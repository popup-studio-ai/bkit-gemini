#!/usr/bin/env node
/**
 * BeforeModel Hook - Prompt Optimization & Model Selection
 * Injects PDCA phase-specific context and optimizes prompts before model processing
 * Dual-mode: handler export (v0.31.0+ SDK) + stdin command (legacy)
 */
const fs = require('fs');
const path = require('path');

const libPath = path.resolve(__dirname, '..', '..', 'lib');

// --- Agent Dispatch Detection (S3 v2.0.7-agent-dispatch-fix) ---
let _agentDispatch = null;
function getAgentDispatch() {
  if (_agentDispatch !== null) return _agentDispatch;
  try {
    _agentDispatch = require(path.join(libPath, 'gemini', 'agent-dispatch'));
  } catch (e) {
    _agentDispatch = false; // sentinel: load attempted, unavailable
  }
  return _agentDispatch;
}

let _auditLog = null;
function getAuditLog() {
  if (_auditLog !== null) return _auditLog;
  try {
    _auditLog = require(path.join(libPath, 'core', 'audit-log'));
  } catch (e) {
    _auditLog = false;
  }
  return _auditLog;
}

/**
 * Detect agent dispatch intent and build directive context.
 * Returns null when no dispatch matched, or a directive string for additionalContext.
 *
 * Strategy (D15 stub for Gemini CLI sync hooks):
 *   Gemini CLI's BeforeModel hook is synchronous and cannot invoke MCP directly.
 *   So we inject a structured directive telling the model to call
 *   mcp__bkit-server__spawn_agent with the resolved arguments.
 *   When Gemini CLI gains async hook support (v0.44.0+ capability flag),
 *   this path will be replaced by direct MCP invocation.
 */
function buildAgentDispatchDirective(prompt, projectDir) {
  const AD = getAgentDispatch();
  if (!AD) return null;

  let detection;
  try {
    detection = AD.detectDispatch(prompt);
  } catch (e) {
    return null;
  }
  if (!detection || !detection.matched) return null;

  let call;
  try {
    call = AD.buildDispatchCall(detection);
  } catch (e) {
    return null;
  }
  if (!call) return null;

  // Audit log (D17): record interception for traceability + telemetry
  const AuditLogger = getAuditLog();
  if (AuditLogger && typeof AuditLogger === 'function') {
    try {
      const logger = new AuditLogger(projectDir);
      logger.append({
        event: 'ALLOW',
        tool: 'spawn_agent',
        decision: 'allow',
        reason: 'agent_dispatch_intercepted',
        hook: 'BeforeModel',
        agent: detection.agent,
        lang: detection.lang,
        taskPreview: (detection.task || '').slice(0, 120)
      });
    } catch (e) { /* non-fatal */ }
  }

  // Directive text — instructs the model to invoke MCP spawn_agent and wrap output.
  const args = JSON.stringify(call.arguments, null, 2);
  return [
    '## Agent Dispatch (bkit S3)',
    '',
    `User invoked a specialized agent via natural language (lang=${detection.lang}).`,
    `Detected agent: **${detection.agent}**`,
    '',
    'You MUST call the MCP tool `mcp__bkit-server__spawn_agent` with the following arguments,',
    'then wrap its returned text inside boundary markers exactly as shown below.',
    '',
    '```json',
    args,
    '```',
    '',
    'Output format — wrap the agent\'s returned content:',
    '```',
    `[Agent: ${detection.agent}]`,
    '<agent output here>',
    '[End Agent Output]',
    '```',
    '',
    'Do NOT answer the task yourself; delegate to the agent via the MCP tool.',
    'If the MCP tool fails or is unavailable, report the failure clearly to the user'
      + ' and suggest running `gemini mcp list` to verify the bkit MCP server is connected.'
  ].join('\n');
}

// --- Model Routing Hints (v2.0.0) ---
const MODEL_ROUTING = Object.freeze({
  plan:   { preferredModel: 'pro', reason: 'Deep reasoning for requirements analysis' },
  design: { preferredModel: 'pro', reason: 'Architecture analysis needs thorough evaluation' },
  do:     { preferredModel: 'pro', reason: 'Code generation requires accuracy' },
  check:  { preferredModel: 'flash', reason: 'Comparison/verification is speed-optimized' },
  act:    { preferredModel: 'flash', reason: 'Iterative fixes benefit from fast response' },
  report: { preferredModel: 'flash', reason: 'Document generation is speed-optimized' }
});

function getModelRoutingHint(phase) {
  const routing = MODEL_ROUTING[phase];
  if (!routing) return null;
  return `[Model Routing: ${routing.preferredModel}] ${routing.reason}`;
}

// --- Context Anchoring (v2.0.0) ---
function extractDocumentAnchors(projectDir, phase) {
  const MAX_ANCHOR_CHARS = 2000;

  try {
    const pdcaStatusModule = require(path.join(libPath, 'pdca', 'status'));
    const statusPath = pdcaStatusModule.getPdcaStatusPath(projectDir);
    if (!fs.existsSync(statusPath)) return null;

    const status = pdcaStatusModule.loadPdcaStatus(projectDir);
    const feature = status.primaryFeature;
    if (!feature) return null;

    // Determine which document to anchor based on phase
    const PHASE_ANCHOR_DOCS = {
      design: ['01-plan'],
      do:     ['02-design'],
      check:  ['02-design', '01-plan'],
      act:    ['03-analysis']
    };

    const docDirs = PHASE_ANCHOR_DOCS[phase];
    if (!docDirs) return null;

    const anchors = [];
    for (const dir of docDirs) {
      const docPath = path.join(projectDir, 'docs', dir, 'features', `${feature}.${dir.split('-')[1]}.md`);
      if (!fs.existsSync(docPath)) continue;

      try {
        let content = fs.readFileSync(docPath, 'utf-8');
        // Extract Executive Summary section only
        const execMatch = content.match(/## Executive Summary[\s\S]*?(?=\n## [^#]|\n---|\Z)/);
        if (execMatch) {
          const excerpt = execMatch[0].substring(0, 800);
          anchors.push(`### Context Anchor (${dir}):\n${excerpt}`);
        }
      } catch (e) { /* non-fatal */ }
    }

    if (anchors.length === 0) return null;

    let result = `## Context Anchor (auto-injected)\n\n${anchors.join('\n\n')}`;
    if (result.length > MAX_ANCHOR_CHARS) {
      result = result.substring(0, MAX_ANCHOR_CHARS) + '\n\n[...truncated]';
    }
    return result;
  } catch (e) {
    return null;
  }
}

// --- Core processing logic ---
function processHook(input) {
  try {
    const prompt = input.prompt || input.user_message || '';
    if (!prompt || prompt.length < 3) {
      return { decision: 'allow' };
    }

    const projectDir = input.projectDir || process.cwd();
    const contexts = [];

    // S3: Agent dispatch detection runs first — if a dispatch directive is built,
    // it takes precedence and is prepended (model still receives phase context after).
    const dispatchDirective = buildAgentDispatchDirective(prompt, projectDir);
    if (dispatchDirective) {
      contexts.push(dispatchDirective);
    }

    const pdcaPhase = getCurrentPdcaPhase(projectDir);
    if (pdcaPhase) {
      const phaseContext = getPhaseContext(pdcaPhase);
      if (phaseContext) {
        contexts.push(phaseContext);
      }

      // v2.0.0: Model Routing Hint
      const routingHint = getModelRoutingHint(pdcaPhase);
      if (routingHint) {
        contexts.push(routingHint);
      }

      // v2.0.0: Context Anchoring
      const anchorContext = extractDocumentAnchors(projectDir, pdcaPhase);
      if (anchorContext) {
        contexts.push(anchorContext);
      }
    }

    if (contexts.length > 0) {
      return { decision: 'allow', additionalContext: contexts.join('\n\n') };
    }
    return { decision: 'allow' };
  } catch (error) {
    return { decision: 'allow' };
  }
}

// --- RuntimeHook function export (v0.31.0+ SDK) ---
async function handler(event) {
  return processHook(event);
}

// --- Legacy command mode ---
function main() {
  try {
    const { getAdapter } = require(path.join(libPath, 'gemini', 'platform'));
    const adapter = getAdapter();
    const input = adapter.readHookInput();
    input.projectDir = adapter.getProjectDir();
    const result = processHook(input);

    if (result.additionalContext) {
      console.log(JSON.stringify(result));
      process.exit(0);
    } else {
      adapter.outputEmpty();
    }
  } catch (error) {
    process.exit(0);
  }
}

/**
 * Get current PDCA phase from status file
 */
function getCurrentPdcaPhase(projectDir) {
  try {
    const pdcaStatusModule = require(path.join(libPath, 'pdca', 'status'));
    const status = pdcaStatusModule.loadPdcaStatus(projectDir);
    const feature = status.primaryFeature;
    if (!feature || !status.features[feature]) return null;

    return status.features[feature].phase;
  } catch (e) {
    return null;
  }
}

/**
 * Get phase-specific context for prompt enhancement
 */
function getPhaseContext(phase) {
  const phaseContexts = {
    plan: [
      '**Current PDCA Phase: Plan**',
      'Guidelines for Plan phase:',
      '- Focus on requirements gathering and analysis',
      '- Use the plan template from templates/plan.template.md',
      '- Include scope, requirements, risks, and success criteria',
      '- Do NOT write implementation code in this phase'
    ].join('\n'),

    design: [
      '**Current PDCA Phase: Design**',
      'Guidelines for Design phase:',
      '- Create detailed technical design based on the Plan',
      '- Use the design template from templates/design.template.md',
      '- Include architecture, data model, API specs, and implementation order',
      '- Reference existing code patterns and conventions',
      '- Do NOT write implementation code in this phase'
    ].join('\n'),

    do: [
      '**Current PDCA Phase: Do (Implementation)**',
      'Guidelines for Implementation phase:',
      '- Follow the Design document specifications',
      '- Write clean, well-structured code',
      '- Follow existing code patterns and conventions',
      '- After implementation, suggest running /pdca analyze'
    ].join('\n'),

    check: [
      '**Current PDCA Phase: Check (Analysis)**',
      'Guidelines for Check phase:',
      '- Compare implementation against Design document',
      '- Calculate match rate for each requirement',
      '- Identify gaps and missing implementations',
      '- If match rate < 90%, suggest /pdca iterate'
    ].join('\n'),

    act: [
      '**Current PDCA Phase: Act (Improvement)**',
      'Guidelines for Act phase:',
      '- Fix gaps identified in the Check phase',
      '- Re-run gap analysis after each fix cycle',
      '- Maximum 5 iterations per session',
      '- When match rate >= 90%, suggest /pdca report'
    ].join('\n')
  };

  return phaseContexts[phase] || null;
}

if (require.main === module) { main(); }

module.exports = { handler };
