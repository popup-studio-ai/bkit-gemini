/**
 * agent-dispatch.js — Track A: detect "Use the X agent ..." prompts + extract dispatch target
 *
 * Sprint: S3 v2.0.7-agent-dispatch-fix (Plan §3 D1~D12)
 * Design: docs/01-plan/sprints/v2.0.7-agent-dispatch-fix-design.md
 * Spec: AC-A1~A8 (matcher + validation + MCP delegate)
 *
 * Responsibilities:
 *   1. Detect natural-language dispatch intent in 8 languages (D4)
 *   2. Validate agent name against bkit 21-agent registry (D5 exact match)
 *   3. Reject meta patterns (code blocks, "what is", quotes) — D9
 *   4. Return structured dispatch descriptor for MCP spawn_agent
 *
 * Cross-OS: pure JavaScript. macOS / Windows / Linux / WSL / Git Bash 동일.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { matchAny } = require('./agent-dispatch.lang');

// ─── Bkit 21-agent whitelist (exact match per D5) ──────────────
const AGENTS_DIR = path.resolve(__dirname, '..', '..', 'agents');

let _cachedAgents = null;
function loadAgentRegistry() {
  if (_cachedAgents) return _cachedAgents;
  try {
    const files = fs.readdirSync(AGENTS_DIR)
      .filter(f => f.endsWith('.md'))
      .map(f => f.slice(0, -3));
    _cachedAgents = new Set(files);
  } catch (e) {
    _cachedAgents = new Set();
  }
  return _cachedAgents;
}

/**
 * Meta-pattern rejection (D9):
 *   - Code blocks (fenced ``` or indented 4-space)
 *   - Quotation marks around agent name
 *   - "What is X agent", "Tell me about X agent" (informational, not invocational)
 *   - Markdown links containing 'agent'
 */
function isMetaPattern(prompt) {
  if (!prompt || typeof prompt !== 'string') return true;
  // Fenced code block
  if (/```[\s\S]*?(?:agent|subagent)[\s\S]*?```/i.test(prompt)) return true;
  // Markdown link: [...](.../agent...)
  if (/\[[^\]]*\]\([^)]*agent[^)]*\)/i.test(prompt)) return true;
  // Questioning / informational
  if (/^\s*(?:What|How|Why|When|Tell me|Explain|Describe|What's)\s.+(agent|subagent)/i.test(prompt)) return true;
  // Quoted agent name (literal mention, not invocation)
  if (/["']\s*[a-z-]+\s+agent\s*["']/i.test(prompt)) return true;
  return false;
}

/**
 * Detect dispatch intent.
 * @param {string} prompt
 * @returns {{ matched: boolean, agent?: string, task?: string, lang?: string, reason?: string }}
 */
function detectDispatch(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    return { matched: false, reason: 'empty prompt' };
  }
  if (isMetaPattern(prompt)) {
    return { matched: false, reason: 'meta pattern (informational / quoted / code block)' };
  }
  const match = matchAny(prompt);
  if (!match) {
    return { matched: false, reason: 'no dispatch pattern matched' };
  }
  const registry = loadAgentRegistry();
  if (!registry.has(match.agent)) {
    return {
      matched: false,
      reason: `unknown agent "${match.agent}" (not in bkit 21-agent registry)`,
      attempted: match.agent
    };
  }
  if (!match.task || match.task.length < 3) {
    return {
      matched: false,
      reason: 'task description too short or missing',
      agent: match.agent
    };
  }
  return {
    matched: true,
    agent: match.agent,
    task: match.task,
    lang: match.lang
  };
}

/**
 * Build a structured dispatch descriptor for downstream MCP spawn_agent call.
 * Returned shape mirrors the MCP tool input schema (mcp/bkit-server.js:321~346).
 */
function buildDispatchCall(detection) {
  if (!detection || !detection.matched) return null;
  return {
    tool: 'spawn_agent',
    arguments: {
      agent_name: detection.agent,
      task: detection.task,
      context: {
        source: 'bkit-agent-dispatch',
        lang: detection.lang,
        version: '2.0.7-S3'
      },
      timeout: 300000 // 5 min default; before-model hook may pass override
    }
  };
}

/**
 * Build a user-visible boundary wrap around an agent's output (D7).
 */
function wrapAgentOutput(agent, output) {
  return `[Agent: ${agent}]\n${output}\n[End Agent Output]`;
}

/**
 * Lightweight introspection helper for diagnostics / tests.
 */
function listKnownAgents() {
  return Array.from(loadAgentRegistry()).sort();
}

function clearCache() {
  _cachedAgents = null;
}

/**
 * v2.0.7-S5 W4 Strategy 4 — Wrap a dispatch as an isolated sub-agent invocation.
 *
 * The sub-agent runs in a forked context (see lib/gemini/context-fork.js).
 * The main context only receives the agent's structured result, never the
 * sub-agent's intermediate scratch context.
 *
 * This is a directive-level wrapper (sync hook constraint) — it annotates the
 * dispatch with isolation metadata so the model knows to:
 *   1. spawn the agent with `isolated: true` (no main context inheritance)
 *   2. wrap result with the standard `[Agent: X]...[End Agent Output]` boundary
 *   3. only return decisions / findings — never raw scratch tool calls
 *
 * @param {Object} dispatchCall — output of buildDispatchCall()
 * @returns {Object|null} isolated dispatch call or null if input null
 */
function wrapAsIsolated(dispatchCall) {
  if (!dispatchCall || !dispatchCall.arguments) return null;
  const isolated = {
    ...dispatchCall,
    arguments: {
      ...dispatchCall.arguments,
      context: {
        ...(dispatchCall.arguments.context || {}),
        isolated: true,
        // The sub-agent must not see the caller's main context. Hint downstream
        // consumers (MCP server, model) to enforce fork-based isolation.
        isolationPolicy: 'context-fork',
        // Mandate: return only decisions, findings, code refs — no raw tool dumps.
        outputContract: 'decisions+findings+refs only (no raw tool output)'
      }
    }
  };
  return isolated;
}

/**
 * Detect → build → wrap-as-isolated, returning a single ready-to-emit MCP call.
 * @param {string} prompt
 * @returns {Object|null} isolated dispatch call, or null when no dispatch
 */
function detectAndBuildIsolated(prompt) {
  const detection = detectDispatch(prompt);
  if (!detection || !detection.matched) return null;
  const call = buildDispatchCall(detection);
  return wrapAsIsolated(call);
}

module.exports = {
  detectDispatch,
  buildDispatchCall,
  wrapAgentOutput,
  isMetaPattern,
  listKnownAgents,
  clearCache,
  wrapAsIsolated,
  detectAndBuildIsolated
};
