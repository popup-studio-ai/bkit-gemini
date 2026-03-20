// TC-35: Adapters Common Unit Tests (10 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertType, assertExists } = require('../test-utils');
const path = require('path');

const adapters = require(path.join(PLUGIN_ROOT, 'lib/gemini/platform'));
const ir = require(path.join(PLUGIN_ROOT, 'lib/gemini/import-resolver'));

const tests = [
  { name: 'TC35-01: getAdapter 함수 존재', fn: () => { assertType(adapters.getAdapter, 'function', 'Should export getAdapter'); } },
  {
    name: 'TC35-02: getAdapter 인스턴스 반환',
    fn: () => {
      const adapter = adapters.getAdapter();
      assert(adapter !== undefined, 'Should return adapter');
    }
  },
  {
    name: 'TC35-03: adapter.getProjectDir 존재',
    fn: () => {
      const adapter = adapters.getAdapter();
      assertType(adapter.getProjectDir, 'function', 'Should have getProjectDir');
    }
  },
  {
    name: 'TC35-04: adapter.getPluginRoot 존재',
    fn: () => {
      const adapter = adapters.getAdapter();
      assertType(adapter.getPluginRoot, 'function', 'Should have getPluginRoot');
    }
  },
  {
    name: 'TC35-05: import-resolver resolveImports 존재',
    fn: () => { assertType(ir.resolveImports, 'function', 'Should export resolveImports'); }
  },
  {
    name: 'TC35-06: import-resolver clearCache 존재',
    fn: () => { assertType(ir.clearCache, 'function', 'Should export clearCache'); }
  },
  {
    name: 'TC35-07: gemini adapter index 존재',
    fn: () => { assertExists(path.join(PLUGIN_ROOT, 'lib/gemini/platform/index.js'), 'gemini index'); }
  },
  {
    name: 'TC35-08: platform index 존재',
    fn: () => { assertExists(path.join(PLUGIN_ROOT, 'lib/gemini/platform/index.js'), 'platform index'); }
  },
  {
    name: 'TC35-09: adapter getPluginRoot 실제 경로',
    fn: () => {
      const adapter = adapters.getAdapter();
      const root = adapter.getPluginRoot();
      assertExists(root, 'Plugin root should exist');
    }
  },
  {
    name: 'TC35-10: adapter getProjectDir 실제 경로',
    fn: () => {
      const adapter = adapters.getAdapter();
      const dir = adapter.getProjectDir();
      assertType(dir, 'string', 'Should return string');
    }
  }
];

module.exports = { tests };
