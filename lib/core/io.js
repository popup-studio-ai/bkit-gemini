/**
 * I/O Utilities for Hook Scripts
 * Provides standardized input/output handling for Gemini CLI hooks
 */
const fs = require('fs');

// Lazy load adapter
let _adapter = null;
function getAdapter() {
  if (!_adapter) {
    _adapter = require('../adapters').getAdapter();
  }
  return _adapter;
}

/**
 * Maximum context length for output
 */
const MAX_CONTEXT_LENGTH = 500;

/**
 * Truncate context to maximum length
 * @param {string} context
 * @param {number} maxLength
 * @returns {string}
 */
function truncateContext(context, maxLength = MAX_CONTEXT_LENGTH) {
  if (!context || context.length <= maxLength) return context;
  return context.substring(0, maxLength - 3) + '...';
}

/**
 * Read JSON input from stdin synchronously
 * @returns {object}
 */
function readStdinSync() {
  try {
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (!input) return {};
    return JSON.parse(input);
  } catch (e) {
    return {};
  }
}

/**
 * Read JSON input from stdin asynchronously
 * @returns {Promise<object>}
 */
async function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf-8');

    process.stdin.on('data', (chunk) => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      try {
        resolve(data.trim() ? JSON.parse(data.trim()) : {});
      } catch {
        resolve({});
      }
    });

    // Timeout after 1 second
    setTimeout(() => {
      resolve(data.trim() ? JSON.parse(data.trim()) : {});
    }, 1000);
  });
}

/**
 * Parse hook input and normalize structure
 * @param {object} input
 * @returns {object}
 */
function parseHookInput(input) {
  if (!input) return {};

  const normalized = { ...input };

  // Normalize tool input
  if (input.tool_input) {
    normalized.toolInput = input.tool_input;
  }

  // Normalize tool name (reverse map from Gemini to Claude names)
  if (input.tool_name) {
    const adapter = getAdapter();
    normalized.toolName = adapter.reverseMapToolName(input.tool_name);
    normalized.geminiToolName = input.tool_name;
  }

  // Extract common fields
  if (input.tool_input) {
    normalized.filePath = input.tool_input.file_path || input.tool_input.path;
    normalized.content = input.tool_input.content;
    normalized.command = input.tool_input.command;
  }

  // User prompt handling
  normalized.prompt = input.prompt || input.user_message || input.message || '';

  return normalized;
}

/**
 * Output allow decision with context
 * @param {string} context - Optional context to inject
 * @param {string} hookEvent - Optional hook event name
 */
function outputAllow(context, hookEvent) {
  return getAdapter().outputAllow(context, hookEvent);
}

/**
 * Output block decision with reason
 * @param {string} reason
 */
function outputBlock(reason) {
  return getAdapter().outputBlock(reason);
}

/**
 * Output empty (no-op, silent exit)
 */
function outputEmpty() {
  return getAdapter().outputEmpty();
}

/**
 * Make content XML-safe (for compatibility)
 * @param {string} content
 * @returns {string}
 */
function xmlSafeOutput(content) {
  if (!content) return content;
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = {
  MAX_CONTEXT_LENGTH,
  truncateContext,
  readStdinSync,
  readStdin,
  parseHookInput,
  outputAllow,
  outputBlock,
  outputEmpty,
  xmlSafeOutput
};
