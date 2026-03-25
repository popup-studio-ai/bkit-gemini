/**
 * Hook Adapter - RuntimeHook SDK Integration
 * Abstraction layer for SDK-based RuntimeHook registration.
 *
 * v0.31.0 RuntimeHook API: HookSystem.registerHook({ event, action, timeout })
 * - SDK-based programmatic registration (NOT hooks.json type change)
 * - 99% faster execution (in-process vs child_process spawn)
 * - Direct context object access (no stdin/stdout serialization)
 *
 * IMPORTANT: hooks.json only supports type:"command".
 * RuntimeHook functions MUST be registered via SDK API.
 *
 * v1.5.6: Detection + preparation only.
 * v1.5.7: Active SDK integration with activateRuntimeHooks().
 *
 * @version 2.0.0
 */

const path = require('path');
const { getFeatureFlags } = require('./version');

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
 * v1.5.7: Returns 'function' when RuntimeHook available, 'command' otherwise
 *
 * @param {string} hookEvent - Hook event name (e.g., 'session_start')
 * @returns {{ mode: string, sdkAvailable: boolean, hookEvent: string }}
 */
function getHookExecutionInfo(hookEvent) {
  const sdkAvailable = supportsRuntimeHookFunctions();
  return {
    mode: sdkAvailable ? 'function' : 'command',
    sdkAvailable,
    hookEvent
  };
}

/**
 * Activate RuntimeHook functions via SDK registration
 * Called from session-start.js when HookSystem is available
 *
 * @param {object} hookSystem - Gemini CLI HookSystem instance
 * @returns {{ registered: number, skipped: number, errors: string[] }}
 */
function activateRuntimeHooks(hookSystem) {
  if (!supportsRuntimeHookFunctions() || !hookSystem) {
    return { registered: 0, skipped: 0, errors: ['SDK not available'] };
  }

  try {
    const { registerRuntimeHooks } = require(
      path.join(__dirname, '..', '..', '..', 'hooks', 'runtime-hooks')
    );
    return registerRuntimeHooks(hookSystem);
  } catch (e) {
    return { registered: 0, skipped: 0, errors: [e.message] };
  }
}

/**
 * Load hook handler function for direct invocation
 * @param {string} scriptPath - Absolute path to hook script
 * @returns {Function|null} handler function or null
 */
function loadHookHandler(scriptPath) {
  if (!supportsRuntimeHookFunctions()) return null;

  try {
    const hookModule = require(scriptPath);
    if (typeof hookModule.handler === 'function') {
      return hookModule.handler;
    }
  } catch (e) {
    // Fallback to command mode
  }
  return null;
}

/**
 * Get migration status summary
 * @returns {{ mode: string, sdkRegistered: number, commandOnly: number }}
 */
function getMigrationStatus() {
  const sdk = supportsRuntimeHookFunctions();
  return {
    mode: sdk ? 'sdk+command' : 'command-only',
    sdkRegistered: sdk ? 7 : 0,
    commandOnly: sdk ? 3 : 10
  };
}

/**
 * Map hooks.json event names to SDK event names
 * hooks.json uses PascalCase, SDK uses snake_case
 *
 * v0.35.0 compat (#18514, #20439): BeforeAgent/AfterAgent event structures
 * may use nested data/result envelopes. Hook scripts handle this via
 * normalizeInput() - no map changes needed.
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

/**
 * List of hooks that should use SDK mode when available.
 * v0.35.0: after_agent added (#20439 stability improvement)
 */
const HOT_PATH_HOOKS = Object.freeze([
  'before_agent', 'before_model', 'after_model',
  'before_tool_selection', 'before_tool', 'after_tool',
  'after_agent'
]);

module.exports = {
  supportsRuntimeHookFunctions,
  getHookExecutionInfo,
  activateRuntimeHooks,
  loadHookHandler,
  getMigrationStatus,
  HOOK_EVENT_MAP,
  HOT_PATH_HOOKS
};
