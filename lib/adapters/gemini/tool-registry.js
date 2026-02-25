/**
 * Gemini CLI Tool Name Registry
 * Centralized Source of Truth for all Gemini CLI built-in tool names.
 *
 * Source: google-gemini/gemini-cli
 *   - /packages/core/src/tools/definitions/base-declarations.ts
 *   - /packages/core/src/tools/tool-names.ts
 *
 * Philosophy: "No Guessing" + "MCP tool accuracy"
 * All tool names verified from Gemini CLI source code.
 *
 * @version 1.5.5
 */

// ─── 17 Built-in Tool Names (v0.29.0+) ───────────────────────

const BUILTIN_TOOLS = Object.freeze({
  // File Management
  GLOB: 'glob',
  GREP_SEARCH: 'grep_search',
  LIST_DIRECTORY: 'list_directory',
  READ_FILE: 'read_file',
  READ_MANY_FILES: 'read_many_files',
  WRITE_FILE: 'write_file',
  REPLACE: 'replace',

  // Execution
  RUN_SHELL_COMMAND: 'run_shell_command',

  // Information
  GOOGLE_WEB_SEARCH: 'google_web_search',
  WEB_FETCH: 'web_fetch',

  // Agent Coordination
  ASK_USER: 'ask_user',
  ACTIVATE_SKILL: 'activate_skill',
  SAVE_MEMORY: 'save_memory',
  WRITE_TODOS: 'write_todos',
  GET_INTERNAL_DOCS: 'get_internal_docs',

  // Plan Mode (v0.29.0+)
  ENTER_PLAN_MODE: 'enter_plan_mode',
  EXIT_PLAN_MODE: 'exit_plan_mode'
});

// ─── All Built-in Tool Names Set ──────────────────────────────

const ALL_BUILTIN_TOOL_NAMES = Object.freeze(
  new Set(Object.values(BUILTIN_TOOLS))
);

// ─── Legacy Aliases ───────────────────────────────────────────
// Only 1 official legacy alias exists in Gemini CLI source

const LEGACY_ALIASES = Object.freeze({
  'search_file_content': BUILTIN_TOOLS.GREP_SEARCH
});

// ─── bkit Legacy Names (v1.5.2 and earlier) ──────────────────
// These were used in bkit but were never valid Gemini CLI tool names

const BKIT_LEGACY_NAMES = Object.freeze({
  'glob_tool': BUILTIN_TOOLS.GLOB,
  'web_search': BUILTIN_TOOLS.GOOGLE_WEB_SEARCH,
  'task_write': BUILTIN_TOOLS.WRITE_TODOS
});

// ─── Forward Aliases (Future Compatibility v0.31.0+) ─────────
// Pre-mapped potential future tool name renames from Issue #1391
// Ensures bkit continues working even after rename

const FORWARD_ALIASES = Object.freeze({
  'edit_file': BUILTIN_TOOLS.REPLACE,
  'find_files': BUILTIN_TOOLS.GLOB,
  'find_in_file': BUILTIN_TOOLS.GREP_SEARCH,
  'web_search': BUILTIN_TOOLS.GOOGLE_WEB_SEARCH,
  'read_files': BUILTIN_TOOLS.READ_MANY_FILES
});

// Reverse mapping: current canonical -> potential future name
const REVERSE_FORWARD_ALIASES = Object.freeze(
  Object.fromEntries(
    Object.entries(FORWARD_ALIASES).map(([future, current]) => [current, future])
  )
);

// ─── Tool Categories ──────────────────────────────────────────

const TOOL_CATEGORIES = Object.freeze({
  FILE_MANAGEMENT: [
    BUILTIN_TOOLS.GLOB,
    BUILTIN_TOOLS.GREP_SEARCH,
    BUILTIN_TOOLS.LIST_DIRECTORY,
    BUILTIN_TOOLS.READ_FILE,
    BUILTIN_TOOLS.READ_MANY_FILES,
    BUILTIN_TOOLS.WRITE_FILE,
    BUILTIN_TOOLS.REPLACE
  ],
  EXECUTION: [
    BUILTIN_TOOLS.RUN_SHELL_COMMAND
  ],
  INFORMATION: [
    BUILTIN_TOOLS.GOOGLE_WEB_SEARCH,
    BUILTIN_TOOLS.WEB_FETCH
  ],
  AGENT_COORDINATION: [
    BUILTIN_TOOLS.ASK_USER,
    BUILTIN_TOOLS.ACTIVATE_SKILL,
    BUILTIN_TOOLS.SAVE_MEMORY,
    BUILTIN_TOOLS.WRITE_TODOS,
    BUILTIN_TOOLS.GET_INTERNAL_DOCS
  ],
  PLAN_MODE: [
    BUILTIN_TOOLS.ENTER_PLAN_MODE,
    BUILTIN_TOOLS.EXIT_PLAN_MODE
  ]
});

// ─── Claude Code to Gemini CLI Mapping ────────────────────────

const CLAUDE_TO_GEMINI_MAP = Object.freeze({
  'Write': BUILTIN_TOOLS.WRITE_FILE,
  'Edit': BUILTIN_TOOLS.REPLACE,
  'Read': BUILTIN_TOOLS.READ_FILE,
  'Bash': BUILTIN_TOOLS.RUN_SHELL_COMMAND,
  'Glob': BUILTIN_TOOLS.GLOB,
  'Grep': BUILTIN_TOOLS.GREP_SEARCH,
  'WebSearch': BUILTIN_TOOLS.GOOGLE_WEB_SEARCH,
  'WebFetch': BUILTIN_TOOLS.WEB_FETCH,
  'AskUserQuestion': BUILTIN_TOOLS.ASK_USER,
  'Skill': BUILTIN_TOOLS.ACTIVATE_SKILL,
  'TodoWrite': BUILTIN_TOOLS.WRITE_TODOS,
  'SaveMemory': BUILTIN_TOOLS.SAVE_MEMORY,
  'EnterPlanMode': BUILTIN_TOOLS.ENTER_PLAN_MODE,
  'ExitPlanMode': BUILTIN_TOOLS.EXIT_PLAN_MODE
});

// ─── Read-Only Tools (for Plan/Check phases) ──────────────────

function getReadOnlyTools() {
  return [
    BUILTIN_TOOLS.READ_FILE,
    BUILTIN_TOOLS.READ_MANY_FILES,
    BUILTIN_TOOLS.GREP_SEARCH,
    BUILTIN_TOOLS.GLOB,
    BUILTIN_TOOLS.LIST_DIRECTORY,
    BUILTIN_TOOLS.GOOGLE_WEB_SEARCH,
    BUILTIN_TOOLS.WEB_FETCH,
    BUILTIN_TOOLS.ACTIVATE_SKILL,
    BUILTIN_TOOLS.WRITE_TODOS,
    BUILTIN_TOOLS.SAVE_MEMORY,
    BUILTIN_TOOLS.ASK_USER,
    BUILTIN_TOOLS.GET_INTERNAL_DOCS
  ];
}

// ─── All Tools (no restrictions) ──────────────────────────────

function getAllTools() {
  return Object.values(BUILTIN_TOOLS);
}

// ─── Resolve Legacy Tool Name ─────────────────────────────────

function resolveToolName(name) {
  if (ALL_BUILTIN_TOOL_NAMES.has(name)) return name;
  if (LEGACY_ALIASES[name]) return LEGACY_ALIASES[name];
  if (BKIT_LEGACY_NAMES[name]) return BKIT_LEGACY_NAMES[name];
  if (FORWARD_ALIASES[name]) return FORWARD_ALIASES[name];
  return name;
}

// ─── Versioned Tool Name ─────────────────────────────────────

/**
 * Get the most appropriate tool name for the detected CLI version
 * @param {string} name - Current canonical tool name
 * @param {string} cliVersion - Detected Gemini CLI version (e.g., "0.30.0")
 * @returns {string} Tool name appropriate for the CLI version
 */
function getVersionedToolName(name, cliVersion) {
  // For now, always return canonical name
  // When Gemini CLI implements renames, add version branching here
  return name;
}

// ─── Validate Tool Name ───────────────────────────────────────

function isValidToolName(name) {
  return ALL_BUILTIN_TOOL_NAMES.has(name);
}

// ─── Exports ──────────────────────────────────────────────────

module.exports = {
  BUILTIN_TOOLS,
  ALL_BUILTIN_TOOL_NAMES,
  LEGACY_ALIASES,
  BKIT_LEGACY_NAMES,
  FORWARD_ALIASES,
  REVERSE_FORWARD_ALIASES,
  TOOL_CATEGORIES,
  CLAUDE_TO_GEMINI_MAP,
  getReadOnlyTools,
  getAllTools,
  resolveToolName,
  isValidToolName,
  getVersionedToolName
};
