/**
 * compactor.js — Context Compaction framework (S5 W1 Strategy 1)
 *
 * Sprint: S5 v2.0.7-context-engineering-integration
 * Spec: AC-CE1 (Compaction framework with trigger + snapshot + disable toggle)
 *
 * Responsibilities:
 *   1. Decide when to compact (threshold check: turns + token estimate)
 *   2. Extract decisions / open items / code refs as deterministic JSON
 *   3. Save lossless snapshot to .bkit/snapshots/compact-<ts>.json
 *   4. Honor BKIT_COMPACTION=false toggle (graceful disable)
 *
 * Design choice: deterministic JSON extraction (no LLM dependency) for now.
 * The framework allows a future LLM-backed `extractor` plug-in via
 * `setExtractor(fn)` injection — testable + future-proof.
 *
 * Cross-OS: pure JS (fs, path, os). macOS / Windows / Linux 동일.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_TURN_THRESHOLD = 50;
const DEFAULT_TOKEN_THRESHOLD_PCT = 80; // % of context window
const DEFAULT_CONTEXT_WINDOW = 200_000; // Gemini Pro default — overridable
const SNAPSHOT_RETENTION = 10;

/**
 * Test/runtime-overridable extractor. Default = deterministic heuristic.
 */
let _extractor = defaultExtractDecisions;
function setExtractor(fn) {
  if (typeof fn !== 'function') throw new Error('setExtractor: fn must be function');
  _extractor = fn;
}
function resetExtractor() { _extractor = defaultExtractDecisions; }

/**
 * Read BKIT_COMPACTION env var. Returns false only on explicit 'false' / '0'.
 * Default: true (Compaction enabled).
 */
function isCompactionEnabled() {
  const raw = (process.env.BKIT_COMPACTION || 'true').toLowerCase().trim();
  return raw !== 'false' && raw !== '0' && raw !== 'off';
}

/**
 * Decide whether the current session state warrants compaction.
 * @param {Object} state
 * @param {number} [state.turnCount]       — conversation turns
 * @param {number} [state.tokenUsage]      — estimated tokens used
 * @param {number} [state.contextWindow]   — total token budget (default 200K)
 * @param {Object} [options]
 * @param {number} [options.turnThreshold] — default 50
 * @param {number} [options.tokenPct]      — default 80 (%)
 * @returns {{ shouldCompact: boolean, reason: string }}
 */
function shouldCompact(state, options) {
  if (!isCompactionEnabled()) {
    return { shouldCompact: false, reason: 'BKIT_COMPACTION=false (disabled)' };
  }
  const opts = options || {};
  const turnThreshold = opts.turnThreshold || DEFAULT_TURN_THRESHOLD;
  const tokenPct = opts.tokenPct || DEFAULT_TOKEN_THRESHOLD_PCT;
  const window = (state && state.contextWindow) || DEFAULT_CONTEXT_WINDOW;

  const turns = (state && state.turnCount) || 0;
  const tokens = (state && state.tokenUsage) || 0;
  const tokenPctUsed = window > 0 ? (tokens / window) * 100 : 0;

  if (turns >= turnThreshold) {
    return { shouldCompact: true, reason: `turn count ${turns} >= ${turnThreshold}` };
  }
  if (tokenPctUsed >= tokenPct) {
    return {
      shouldCompact: true,
      reason: `token usage ${tokenPctUsed.toFixed(1)}% >= ${tokenPct}% of ${window}`
    };
  }
  return { shouldCompact: false, reason: `under thresholds (turns=${turns}, tokens=${tokenPctUsed.toFixed(1)}%)` };
}

/**
 * Default extractor — pure heuristic, no LLM. Pulls:
 *   - decisions   : lines marked 'D<n>' or '결정' or 'DECIDED'
 *   - openItems   : 'TODO', 'PENDING', 'BLOCKED', '미해결'
 *   - codeRefs    : file:line patterns (e.g. 'lib/foo.js:42')
 *
 * Future: replace with LLM extractor via setExtractor() — same return shape.
 *
 * @param {Object} payload
 * @param {string[]} [payload.messages]   — conversation excerpts (or merged transcript)
 * @returns {{ decisions: string[], openItems: string[], codeRefs: string[] }}
 */
function defaultExtractDecisions(payload) {
  const messages = (payload && Array.isArray(payload.messages)) ? payload.messages : [];
  const text = messages.join('\n');

  const decisions = [];
  const openItems = [];
  const codeRefs = new Set();

  const lines = text.split('\n');
  // `\b` is ASCII-only in JS regex; for Korean tokens 결정/미해결 we match
  // without word boundary. ASCII tokens still use boundary to avoid prefix-only matches.
  const decisionRe = /(?:\bD\d+\b|결정|\bDECIDED\b|\bDECISION:)/i;
  const openRe = /(?:\bTODO\b|\bFIXME\b|\bPENDING\b|\bBLOCKED\b|미해결|\bcarry-?over\b)/i;
  const codeRefRe = /([a-zA-Z0-9_./-]+\.(?:js|ts|tsx|jsx|md|json|sh|toml|yaml|yml)):(\d+)/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.length > 500) continue;
    if (decisionRe.test(trimmed)) decisions.push(trimmed);
    if (openRe.test(trimmed)) openItems.push(trimmed);

    let m;
    codeRefRe.lastIndex = 0;
    while ((m = codeRefRe.exec(trimmed)) !== null) {
      codeRefs.add(`${m[1]}:${m[2]}`);
    }
  }

  return {
    decisions: decisions.slice(0, 50),    // bound: 50 most-recent
    openItems: openItems.slice(0, 30),
    codeRefs: Array.from(codeRefs).slice(0, 100)
  };
}

/**
 * Save a compaction snapshot. Lossless JSON in .bkit/snapshots/.
 * @returns {{ path: string, size: number, retentionPurged: number }}
 */
function saveSnapshot(projectDir, snapshot) {
  const snapshotDir = path.join(projectDir, '.bkit', 'snapshots');
  if (!fs.existsSync(snapshotDir)) fs.mkdirSync(snapshotDir, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `compact-${ts}.json`;
  const fullPath = path.join(snapshotDir, filename);

  const enriched = {
    _schemaVersion: '1.0',
    _reason: snapshot._reason || 'compaction',
    _timestamp: new Date().toISOString(),
    ...snapshot
  };
  const json = JSON.stringify(enriched, null, 2);
  fs.writeFileSync(fullPath, json, 'utf-8');

  // Retention: keep the most-recent SNAPSHOT_RETENTION (compact-*.json only)
  const purged = purgeOld(snapshotDir, 'compact-', SNAPSHOT_RETENTION);

  return { path: fullPath, size: Buffer.byteLength(json, 'utf-8'), retentionPurged: purged };
}

/**
 * Retention purge — keep only the newest `keep` files matching prefix.
 */
function purgeOld(dir, prefix, keep) {
  if (!fs.existsSync(dir)) return 0;
  const files = fs.readdirSync(dir)
    .filter(f => f.startsWith(prefix) && f.endsWith('.json'))
    .sort()
    .reverse();
  let purged = 0;
  for (const f of files.slice(keep)) {
    try { fs.unlinkSync(path.join(dir, f)); purged++; } catch (e) { /* ignore */ }
  }
  return purged;
}

/**
 * High-level entry: compact a session state and persist snapshot.
 * @returns {{ compacted: boolean, snapshotPath?: string, summary?: Object, reason?: string }}
 */
function compactSession(state, projectDir, options) {
  const decision = shouldCompact(state, options);
  if (!decision.shouldCompact) {
    return { compacted: false, reason: decision.reason };
  }
  const summary = _extractor({ messages: state && state.messages });
  const snapshot = {
    _reason: decision.reason,
    sessionStats: {
      turnCount: state && state.turnCount,
      tokenUsage: state && state.tokenUsage,
      contextWindow: (state && state.contextWindow) || DEFAULT_CONTEXT_WINDOW
    },
    summary
  };
  const saved = saveSnapshot(projectDir || process.cwd(), snapshot);
  return {
    compacted: true,
    snapshotPath: saved.path,
    snapshotSize: saved.size,
    retentionPurged: saved.retentionPurged,
    summary,
    reason: decision.reason
  };
}

/**
 * List existing compaction snapshots (newest first).
 */
function listSnapshots(projectDir) {
  const dir = path.join(projectDir || process.cwd(), '.bkit', 'snapshots');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.startsWith('compact-') && f.endsWith('.json'))
    .sort()
    .reverse();
}

module.exports = {
  shouldCompact,
  isCompactionEnabled,
  defaultExtractDecisions,
  saveSnapshot,
  compactSession,
  listSnapshots,
  setExtractor,
  resetExtractor,
  DEFAULT_TURN_THRESHOLD,
  DEFAULT_TOKEN_THRESHOLD_PCT,
  DEFAULT_CONTEXT_WINDOW,
  SNAPSHOT_RETENTION
};
