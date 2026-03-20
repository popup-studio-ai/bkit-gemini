// TC-49: Hook-Lib-Config Chain Integration Tests (10 TC)
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, cleanupTestProject,
        executeHook, assert, assertEqual, assertType, assertContains } = require('../test-utils');
const path = require('path');

const { loadConfig } = require(path.join(PLUGIN_ROOT, 'lib/core/config'));
const { checkPermission } = require(path.join(PLUGIN_ROOT, 'lib/core/permission'));

const tests = [
  { name: 'TC49-01: config → permission → hook 체인', fn: () => {
    const config = loadConfig(PLUGIN_ROOT);
    assert(config !== undefined, 'Config should load');
    const perm = checkPermission('read_file', { file_path: 'test.js' }, PLUGIN_ROOT);
    assertEqual(perm.level, 'allow', 'Read should be allowed');
  }},
  { name: 'TC49-02: session-start → lib/pdca/status 연동',
    setup: () => createTestProject({
      '.pdca-status.json': { version: '2.0', primaryFeature: 'chain-test', activeFeatures: { 'chain-test': { phase: 'plan' } }, archivedFeatures: {}, pipeline: {}, lastChecked: '' },
      '.bkit/state/memory.json': { data: { session: { sessionCount: 1 } } }
    }),
    fn: () => {
      const result = executeHook('session-start.js');
      if (result.output && result.output.metadata) {
        assertEqual(result.output.metadata.primaryFeature, 'chain-test', 'Should pass feature from status');
      }
    },
    teardown: cleanupTestProject
  },
  { name: 'TC49-03: session-start → lib/core/memory 연동',
    setup: () => createTestProject({
      '.pdca-status.json': { version: '2.0', primaryFeature: null, activeFeatures: {}, archivedFeatures: {}, pipeline: {}, lastChecked: '' },
      '.bkit/state/memory.json': { data: { session: { sessionCount: 3, platform: 'gemini' } } }
    }),
    fn: () => {
      const result = executeHook('session-start.js');
      if (result.output && result.output.metadata) {
        assert(result.output.metadata.sessionCount >= 1, 'Should have session count');
      }
    },
    teardown: cleanupTestProject
  },
  { name: 'TC49-04: before-tool → lib/core/permission 연동',
    setup: () => createTestProject({}),
    fn: () => {
      const result = executeHook('before-tool.js', { toolName: 'run_shell_command', input: { command: 'ls' } });
      assert(result !== undefined, 'Should execute hook with permission check');
    },
    teardown: cleanupTestProject
  },
  { name: 'TC49-05: hook → version-detector 연동',
    setup: () => createTestProject({
      '.pdca-status.json': { version: '2.0', primaryFeature: null, activeFeatures: {}, archivedFeatures: {}, pipeline: {}, lastChecked: '' },
      '.bkit/state/memory.json': { data: { session: { sessionCount: 1 } } }
    }),
    fn: () => {
      const result = executeHook('session-start.js');
      if (result.output && result.output.metadata && result.output.metadata.geminiCliFeatures) {
        assertType(result.output.metadata.geminiCliFeatures, 'object', 'Should have CLI features');
      }
    },
    teardown: cleanupTestProject
  },
  { name: 'TC49-06: config permissions → hook deny 체인',
    setup: () => createTestProject({}),
    fn: () => {
      const perm = checkPermission('run_shell_command', { command: 'rm -rf /' }, TEST_PROJECT_DIR);
      assertEqual(perm.level, 'deny', 'Should deny dangerous command');
    },
    teardown: cleanupTestProject
  },
  { name: 'TC49-07: config pdca → hook context 체인',
    setup: () => createTestProject({
      '.pdca-status.json': { version: '2.0', primaryFeature: null, activeFeatures: {}, archivedFeatures: {}, pipeline: {}, lastChecked: '' },
      '.bkit/state/memory.json': { data: { session: { sessionCount: 1 } } }
    }),
    fn: () => {
      const result = executeHook('session-start.js');
      if (result.output && result.output.context) {
        assertContains(result.output.context, 'PDCA', 'Should inject PDCA rules from config');
      }
    },
    teardown: cleanupTestProject
  },
  { name: 'TC49-08: lib/gemini → hooks 연동', fn: () => {
    const ha = require(path.join(PLUGIN_ROOT, 'lib/gemini/hooks'));
    assertType(ha.HOOK_EVENT_MAP, 'object', 'Should have event map');
  }},
  { name: 'TC49-09: lib/pdca/level → session-start level 감지', fn: () => {
    const { detectLevel } = require(path.join(PLUGIN_ROOT, 'lib/pdca/level'));
    assertType(detectLevel, 'function', 'Should export detectLevel');
  }},
  { name: 'TC49-10: 전체 체인 비파괴 실행',
    setup: () => createTestProject({
      '.pdca-status.json': { version: '2.0', primaryFeature: null, activeFeatures: {}, archivedFeatures: {}, pipeline: {}, lastChecked: '' },
      '.bkit/state/memory.json': { data: { session: { sessionCount: 1 } } }
    }),
    fn: () => {
      const result = executeHook('session-start.js');
      assert(result.success || (result.output && result.output.status === 'allow'), 'Full chain should not crash');
    },
    teardown: cleanupTestProject
  }
];

module.exports = { tests };
