/**
 * RuntimeHook SDK Registration Module
 * Registers 7 hooks via HookSystem.registerHook() (v0.31.0+)
 *
 * hooks.json does NOT support type:"function".
 * SDK registration is the ONLY way to use RuntimeHook functions.
 *
 * Hot-path hooks (SDK dual-mode): BeforeAgent, BeforeModel, AfterModel,
 *   BeforeToolSelection, BeforeTool, AfterTool
 * Lifecycle hooks (SDK dual-mode, v0.35.0+): AfterAgent
 * Lifecycle hooks (command-only): SessionStart, PreCompress, SessionEnd
 *
 * v0.35.0 compat: AfterAgent promoted to SDK dual-mode (#20439 stability fix)
 *
 * @version 2.0.0
 */
const path = require('path');

const SCRIPTS_DIR = path.join(__dirname, 'scripts');

// 7 hooks that benefit from function mode (40-97% faster)
// AfterAgent added for v0.35.0 stability (#20439) - has SDK loop guard
const HOT_PATH_HOOKS = [
  { event: 'BeforeAgent', script: 'before-agent.js' },
  { event: 'BeforeModel', script: 'before-model.js' },
  { event: 'AfterModel', script: 'after-model.js' },
  { event: 'BeforeToolSelection', script: 'before-tool-selection.js' },
  { event: 'BeforeTool', script: 'before-tool.js' },
  { event: 'AfterTool', script: 'after-tool.js' },
  { event: 'AfterAgent', script: 'after-agent.js' }
];

/**
 * Register hot-path hooks via SDK HookSystem
 * @param {object} hookSystem - Gemini CLI HookSystem instance
 * @returns {{ registered: number, skipped: number, errors: string[] }}
 */
function registerRuntimeHooks(hookSystem) {
  if (!hookSystem || typeof hookSystem.registerHook !== 'function') {
    return { registered: 0, skipped: HOT_PATH_HOOKS.length, errors: ['Invalid HookSystem'] };
  }

  const result = { registered: 0, skipped: 0, errors: [] };

  for (const { event, script } of HOT_PATH_HOOKS) {
    try {
      const mod = require(path.join(SCRIPTS_DIR, script));
      if (typeof mod.handler !== 'function') {
        result.skipped++;
        continue;
      }
      hookSystem.registerHook(event, mod.handler);
      result.registered++;
    } catch (e) {
      result.errors.push(`${event}: ${e.message}`);
      result.skipped++;
    }
  }

  return result;
}

module.exports = { registerRuntimeHooks, HOT_PATH_HOOKS };
