/**
 * tool-result-summarizer.js — Tool-result clearing (S5 W2 Strategy 2)
 *
 * Sprint: S5 v2.0.7-context-engineering-integration
 * Spec: AC-CE2 (Read result > threshold → summary + reference 보존)
 *
 * Responsibilities:
 *   1. Decide when to summarize (size threshold by characters)
 *   2. Produce a deterministic summary: first/last N lines + size + ref hint
 *   3. Preserve file:line references when discoverable in original output
 *   4. Honor BKIT_TOOL_RESULT_CLEARING=false toggle (graceful disable)
 *
 * Design choice: byte-size threshold (10KB default) + line-based extraction.
 * Replaces raw tool output with a structured marker the model can act on
 * (file:line refs survive so subsequent Read calls can fetch exact ranges).
 *
 * Cross-OS: pure JS. macOS / Windows / Linux 동일.
 */
'use strict';

const DEFAULT_SIZE_THRESHOLD_BYTES = 10 * 1024;   // 10 KB
const DEFAULT_HEAD_LINES = 10;
const DEFAULT_TAIL_LINES = 5;
const DEFAULT_MAX_REFS = 30;

const SUMMARIZABLE_TOOLS = new Set([
  'Read', 'read_file',
  'Glob', 'glob',
  'Grep', 'grep_search',
  'Bash', 'run_shell_command'
]);

function isClearingEnabled() {
  const raw = (process.env.BKIT_TOOL_RESULT_CLEARING || 'true').toLowerCase().trim();
  return raw !== 'false' && raw !== '0' && raw !== 'off';
}

/**
 * Decide whether a tool result should be summarized.
 * @param {Object} args
 * @param {string} args.toolName
 * @param {string} args.result
 * @param {number} [args.sizeThreshold] default 10240 bytes
 * @returns {{ shouldSummarize: boolean, reason: string, size?: number }}
 */
function shouldSummarize(args) {
  if (!isClearingEnabled()) {
    return { shouldSummarize: false, reason: 'BKIT_TOOL_RESULT_CLEARING=false (disabled)' };
  }
  if (!args || typeof args.result !== 'string') {
    return { shouldSummarize: false, reason: 'no result text' };
  }
  if (!SUMMARIZABLE_TOOLS.has(args.toolName)) {
    return { shouldSummarize: false, reason: `tool ${args.toolName} not in summarizable set` };
  }
  const size = Buffer.byteLength(args.result, 'utf-8');
  const threshold = args.sizeThreshold || DEFAULT_SIZE_THRESHOLD_BYTES;
  if (size < threshold) {
    return { shouldSummarize: false, reason: `size ${size}B < threshold ${threshold}B`, size };
  }
  return { shouldSummarize: true, reason: `size ${size}B >= threshold ${threshold}B`, size };
}

/**
 * Extract file:line references from raw output (file paths followed by `:<n>`).
 * @returns {string[]} unique refs
 */
function extractRefs(text, maxRefs) {
  const refs = new Set();
  const re = /([a-zA-Z0-9_./-]+\.(?:js|ts|tsx|jsx|md|json|sh|toml|yaml|yml|html|css|py|go|rs|java)):(\d+)/g;
  let m;
  const max = maxRefs || DEFAULT_MAX_REFS;
  while ((m = re.exec(text)) !== null) {
    refs.add(`${m[1]}:${m[2]}`);
    if (refs.size >= max) break;
  }
  return Array.from(refs);
}

/**
 * Summarize a tool result. Returns a compact structured replacement.
 * @param {Object} args
 * @param {string} args.toolName
 * @param {string} args.result
 * @param {Object} [args.toolParams]   — original tool args (e.g. file_path) for reference
 * @returns {{ summarized: boolean, replacement?: string, refs?: string[], originalSize?: number, summarySize?: number }}
 */
function summarize(args) {
  const decision = shouldSummarize(args);
  if (!decision.shouldSummarize) {
    return { summarized: false, reason: decision.reason };
  }
  const lines = args.result.split('\n');
  const totalLines = lines.length;
  const headLines = args.headLines || DEFAULT_HEAD_LINES;
  const tailLines = args.tailLines || DEFAULT_TAIL_LINES;
  const head = lines.slice(0, headLines).join('\n');
  const tail = totalLines > headLines + tailLines
    ? lines.slice(-tailLines).join('\n')
    : '';

  const refs = extractRefs(args.result);
  const refHint = refs.length > 0
    ? `\n  [refs: ${refs.slice(0, 10).join(', ')}${refs.length > 10 ? ', ...' : ''}]`
    : '';

  const sourceHint = args.toolParams && args.toolParams.file_path
    ? ` source=${args.toolParams.file_path}`
    : '';

  const replacement =
    `[bkit-tool-summary tool=${args.toolName}${sourceHint} ` +
    `size=${decision.size}B lines=${totalLines} truncated=true]\n` +
    `--- HEAD (${headLines} lines) ---\n${head}\n` +
    (tail ? `--- TAIL (${tailLines} lines) ---\n${tail}\n` : '') +
    `[/bkit-tool-summary]${refHint}`;

  return {
    summarized: true,
    replacement,
    refs,
    originalSize: decision.size,
    summarySize: Buffer.byteLength(replacement, 'utf-8'),
    totalLines,
    reason: decision.reason
  };
}

/**
 * High-level entry: returns either the original or summarized result.
 * @returns {{ output: string, summarized: boolean, meta?: Object }}
 */
function applyClearing(args) {
  const r = summarize(args);
  if (!r.summarized) {
    return { output: args.result, summarized: false, meta: { reason: r.reason } };
  }
  return {
    output: r.replacement,
    summarized: true,
    meta: {
      originalSize: r.originalSize,
      summarySize: r.summarySize,
      compressionRatio: r.summarySize / r.originalSize,
      refsExtracted: r.refs.length,
      reason: r.reason
    }
  };
}

module.exports = {
  shouldSummarize,
  summarize,
  applyClearing,
  extractRefs,
  isClearingEnabled,
  SUMMARIZABLE_TOOLS,
  DEFAULT_SIZE_THRESHOLD_BYTES,
  DEFAULT_HEAD_LINES,
  DEFAULT_TAIL_LINES,
  DEFAULT_MAX_REFS
};
