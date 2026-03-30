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
 * @version 2.0.2
 */

// ─── 23 Built-in Tool Names (v0.29.0+ base, v0.32.0+ tracker, v0.34.0 verified) ─

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
  EXIT_PLAN_MODE: 'exit_plan_mode',

  // Task Tracker (v0.32.0+)
  TRACKER_CREATE_TASK: 'tracker_create_task',
  TRACKER_UPDATE_TASK: 'tracker_update_task',
  TRACKER_GET_TASK: 'tracker_get_task',
  TRACKER_LIST_TASKS: 'tracker_list_tasks',
  TRACKER_ADD_DEPENDENCY: 'tracker_add_dependency',
  TRACKER_VISUALIZE: 'tracker_visualize'
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

// ─── Tool Parameter Changes (v0.32.0+) ───────────────────────
// Tracks breaking parameter changes across Gemini CLI versions
// Used by agents and tool-reference.md for version-aware guidance

const TOOL_PARAM_CHANGES = Object.freeze({
  [BUILTIN_TOOLS.READ_FILE]: {
    // v0.32.0+: offset/limit use 1-based line numbers (was 0-based)
    lineNumberBase: 1,
    params: {
      start_line: { since: '0.32.0', description: '1-based start line (replaces offset)' },
      end_line: { since: '0.32.0', description: '1-based end line (replaces limit)' }
    }
  },
  [BUILTIN_TOOLS.REPLACE]: {
    // v0.31.0+: allow_multiple introduced
    // v0.33.0+: allow_multiple required when multiple matches exist
    params: {
      allow_multiple: {
        since: '0.31.0',
        requiredSince: '0.33.0',
        description: 'Must set allow_multiple=true when old_string matches multiple locations'
      }
    }
  },
  [BUILTIN_TOOLS.GREP_SEARCH]: {
    // v0.32.0+: glob parameter renamed to include_pattern
    parameterRenames: {
      'glob': 'include_pattern'
    },
    params: {
      include_pattern: {
        since: '0.32.0',
        renamedFrom: 'glob',
        description: 'File pattern filter (renamed from glob in v0.32.0+)'
      }
    }
  }
});

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
  ],
  TASK_TRACKER: [
    BUILTIN_TOOLS.TRACKER_CREATE_TASK,
    BUILTIN_TOOLS.TRACKER_UPDATE_TASK,
    BUILTIN_TOOLS.TRACKER_GET_TASK,
    BUILTIN_TOOLS.TRACKER_LIST_TASKS,
    BUILTIN_TOOLS.TRACKER_ADD_DEPENDENCY,
    BUILTIN_TOOLS.TRACKER_VISUALIZE
  ]
});

// ─── Tool Annotations (v0.31.0+) ─────────────────────────────
// Hints for Gemini CLI's trust model and parallel execution

const TOOL_ANNOTATIONS = Object.freeze({
  [BUILTIN_TOOLS.READ_FILE]: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.READ_MANY_FILES]: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.GREP_SEARCH]: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.GLOB]: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.LIST_DIRECTORY]: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.GOOGLE_WEB_SEARCH]: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.WEB_FETCH]: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.ASK_USER]: { readOnlyHint: true, destructiveHint: false, idempotentHint: false },
  [BUILTIN_TOOLS.GET_INTERNAL_DOCS]: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.ACTIVATE_SKILL]: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  [BUILTIN_TOOLS.SAVE_MEMORY]: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.WRITE_TODOS]: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  [BUILTIN_TOOLS.WRITE_FILE]: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.REPLACE]: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  [BUILTIN_TOOLS.RUN_SHELL_COMMAND]: { readOnlyHint: false, destructiveHint: true, idempotentHint: false },
  [BUILTIN_TOOLS.ENTER_PLAN_MODE]: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.EXIT_PLAN_MODE]: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.TRACKER_CREATE_TASK]: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  [BUILTIN_TOOLS.TRACKER_UPDATE_TASK]: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  [BUILTIN_TOOLS.TRACKER_GET_TASK]: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.TRACKER_LIST_TASKS]: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.TRACKER_ADD_DEPENDENCY]: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.TRACKER_VISUALIZE]: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
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
    BUILTIN_TOOLS.ASK_USER,
    BUILTIN_TOOLS.GET_INTERNAL_DOCS,
    BUILTIN_TOOLS.TRACKER_GET_TASK,
    BUILTIN_TOOLS.TRACKER_LIST_TASKS,
    BUILTIN_TOOLS.TRACKER_VISUALIZE,
    BUILTIN_TOOLS.ENTER_PLAN_MODE,
    BUILTIN_TOOLS.EXIT_PLAN_MODE
  ];
}

// ─── Tool Annotation Queries (v0.31.0+) ─────────────────────

/**
 * Get tool annotations for Gemini CLI v0.31.0+ trust model
 * @param {string} toolName - Canonical tool name
 * @returns {{ readOnlyHint: boolean, destructiveHint: boolean, idempotentHint: boolean }|null}
 */
function getToolAnnotations(toolName) {
  const resolved = resolveToolName(toolName);
  return TOOL_ANNOTATIONS[resolved] || null;
}

/**
 * Check if a tool is read-only based on annotations
 * @param {string} toolName
 * @returns {boolean}
 */
function isReadOnlyTool(toolName) {
  const annotations = getToolAnnotations(toolName);
  return annotations ? annotations.readOnlyHint === true : false;
}

/**
 * Get strictly read-only tools based on annotations (v0.31.0+)
 * Unlike getReadOnlyTools() which includes some write-capable tools for backward compat,
 * this returns only tools with readOnlyHint: true in annotations.
 * @returns {string[]}
 */
function getStrictReadOnlyTools() {
  return Object.entries(TOOL_ANNOTATIONS)
    .filter(([, anno]) => anno.readOnlyHint === true)
    .map(([name]) => name);
}

// ─── All Tools (no restrictions) ──────────────────────────────

function getAllTools() {
  return Object.values(BUILTIN_TOOLS);
}

// ─── Resolve Legacy Tool Name ─────────────────────────────────

function resolveToolName(name) {
  if (ALL_BUILTIN_TOOL_NAMES.has(name)) return name;
  if (LEGACY_ALIASES[name]) return LEGACY_ALIASES[name];
  return name;
}

// ─── Validate Tool Name ───────────────────────────────────────

function isValidToolName(name) {
  return ALL_BUILTIN_TOOL_NAMES.has(name);
}

// ─── Tool Parameter Change Queries ────────────────────────────

/**
 * Get parameter changes for a specific tool
 * @param {string} toolName - Canonical tool name
 * @returns {object|null} Parameter change info or null
 */
function getToolParamChanges(toolName) {
  const resolved = resolveToolName(toolName);
  return TOOL_PARAM_CHANGES[resolved] || null;
}

/**
 * Get the version-appropriate parameter name for a tool
 * @param {string} toolName - Tool name
 * @param {string} paramName - Current parameter name
 * @param {string} cliVersion - Detected CLI version
 * @returns {string} Resolved parameter name
 */
function getVersionedParamName(toolName, paramName, cliVersion) {
  const changes = getToolParamChanges(toolName);
  if (!changes || !changes.parameterRenames) return paramName;

  // Check if this param was renamed
  for (const [oldName, newName] of Object.entries(changes.parameterRenames)) {
    if (paramName === oldName) return newName;
    if (paramName === newName) return newName;
  }
  return paramName;
}

// ─── Exports ──────────────────────────────────────────────────

module.exports = {
  BUILTIN_TOOLS,
  ALL_BUILTIN_TOOL_NAMES,
  LEGACY_ALIASES,
  TOOL_CATEGORIES,
  TOOL_ANNOTATIONS,
  TOOL_PARAM_CHANGES,
  getReadOnlyTools,
  getStrictReadOnlyTools,
  getAllTools,
  resolveToolName,
  isValidToolName,
  getToolAnnotations,
  isReadOnlyTool,
  getToolParamChanges,
  getVersionedParamName
};
