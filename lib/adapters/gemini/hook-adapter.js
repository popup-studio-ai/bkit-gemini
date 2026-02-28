/**
 * Hook Adapter - RuntimeHook Function Support Utilities
 * Abstraction layer for future SDK-based RuntimeHook migration.
 *
 * v0.31.0 RuntimeHook API: HookSystem.registerHook({ event, action, timeout })
 * - SDK-based programmatic registration (NOT hooks.json type change)
 * - 99% faster execution (in-process vs child_process spawn)
 * - Direct context object access (no stdin/stdout serialization)
 *
 * v1.5.6: Detection + preparation only. Hooks remain type:"command" in hooks.json.
 * v1.6.0: Migrate top 3 hooks to SDK-based RuntimeHook functions.
 *
 * @version 1.5.6
 */

const { getFeatureFlags } = require('./version-detector');

/**
 * Check if RuntimeHook functions are supported (SDK-based API)
 * @returns {boolean}
 */
function supportsRuntimeHookFunctions() {
  try {
    return getFeatureFlags().hasRuntimeHookFunctions === true;
  } catch (e) {
    return false;
  }
}

/**
 * Get hook execution mode info for the detected CLI version
 * v1.5.6: Always 'command'. Reports SDK availability for diagnostics.
 *
 * @param {string} hookEvent - Hook event name (e.g., 'session_start')
 * @returns {{ mode: string, sdkAvailable: boolean, hookEvent: string }}
 */
function getHookExecutionInfo(hookEvent) {
  const sdkAvailable = supportsRuntimeHookFunctions();
  return {
    mode: 'command',
    sdkAvailable,
    hookEvent
  };
}

/**
 * Get RuntimeHook config template for future SDK migration (v1.6.0+)
 * Returns the config shape that HookSystem.registerHook() expects.
 *
 * @param {string} hookEvent - Hook event name
 * @param {number} [timeout=30000] - Timeout in ms
 * @returns {{ event: string, timeout: number, _note: string }}
 */
function getRuntimeHookTemplate(hookEvent, timeout = 30000) {
  return {
    event: hookEvent,
    timeout,
    _note: 'v1.5.6 preparation - action function to be provided in v1.6.0 migration'
  };
}

/**
 * Map hooks.json event names to SDK event names
 * hooks.json uses PascalCase, SDK uses snake_case
 */
const HOOK_EVENT_MAP = Object.freeze({
  'SessionStart': 'session_start',
  'SessionEnd': 'session_end',
  'BeforeTool': 'before_tool',
  'AfterTool': 'after_tool',
  'BeforeModel': 'before_model',
  'AfterModel': 'after_model',
  'BeforeAgent': 'before_agent',
  'AfterAgent': 'after_agent',
  'BeforeToolSelection': 'before_tool_selection',
  'PreCompress': 'pre_compress'
});

module.exports = {
  supportsRuntimeHookFunctions,
  getHookExecutionInfo,
  getRuntimeHookTemplate,
  HOOK_EVENT_MAP
};
