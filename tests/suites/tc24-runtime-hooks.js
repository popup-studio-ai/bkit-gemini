const path = require('path');
const { 
  PLUGIN_ROOT, 
  assert, assertEqual, withVersion 
} = require('../test-utils');

// Require the modules directly for unit tests
const hookAdapter = require(path.join(PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'hook-adapter'));
const runtimeHooks = require(path.join(PLUGIN_ROOT, 'hooks', 'runtime-hooks'));

const tests = [
  {
    name: 'TC-24-01: supportsRuntimeHookFunctions() for v0.31.0+ → true',
    fn: async () => {
      withVersion('0.31.0', () => {
        assertEqual(hookAdapter.supportsRuntimeHookFunctions(), true, 'SDK mode should be supported on 0.31.0');
      });
      withVersion('0.32.1', () => {
        assertEqual(hookAdapter.supportsRuntimeHookFunctions(), true, 'SDK mode should be supported on 0.32.1');
      });
    }
  },
  {
    name: 'TC-24-02: supportsRuntimeHookFunctions() for v0.30.0 → false',
    fn: async () => {
      withVersion('0.30.0', () => {
        assertEqual(hookAdapter.supportsRuntimeHookFunctions(), false, 'SDK mode should NOT be supported on 0.30.0');
      });
    }
  },
  {
    name: 'TC-24-03: HOT_PATH_HOOKS has exactly 6 events',
    fn: async () => {
      assertEqual(hookAdapter.HOT_PATH_HOOKS.length, 6, 'Should have 6 hot path hooks');
      assert(hookAdapter.HOT_PATH_HOOKS.includes('before_tool'), 'Should include before_tool');
      assert(hookAdapter.HOT_PATH_HOOKS.includes('after_tool'), 'Should include after_tool');
    }
  },
  {
    name: 'TC-24-05: loadHookHandler() loads before-tool.js handler',
    fn: async () => {
      const scriptPath = path.join(PLUGIN_ROOT, 'hooks', 'scripts', 'before-tool.js');
      const handler = hookAdapter.loadHookHandler(scriptPath);
      assertEqual(typeof handler, 'function', 'before-tool handler should be a function');
    }
  },
  {
    name: 'TC-24-06: loadHookHandler() returns null for non-existent file',
    fn: async () => {
      const handler = hookAdapter.loadHookHandler('fake-hook');
      assertEqual(handler, null, 'fake-hook should return null');
    }
  }
];

module.exports = { tests };
