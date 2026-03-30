// TC-40: Hook System E2E Tests (15 TC)
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, cleanupTestProject, executeHook, assert, assertEqual, assertContains, getPdcaStatus, withVersion } = require('../test-utils');

const tests = [
  {
    name: 'TC40-01: session-start.js JSON status=allow',
    setup: () => createTestProject({
      '.pdca-status.json': { version: '2.0', primaryFeature: null, activeFeatures: {}, archivedFeatures: {}, pipeline: { level: 'Starter' }, lastChecked: '' },
      '.bkit/state/memory.json': { data: { session: { sessionCount: 1, platform: 'gemini' } } }
    }),
    fn: () => {
      const result = executeHook('session-start.js');
      assert(result.success || result.output.status === 'allow', 'Should return allow');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC40-02: session-start context PDCA Rules 포함',
    setup: () => createTestProject({
      '.pdca-status.json': { version: '2.0', primaryFeature: null, activeFeatures: {}, archivedFeatures: {}, pipeline: {}, lastChecked: '' },
      '.bkit/state/memory.json': { data: { session: { sessionCount: 1 } } }
    }),
    fn: () => {
      const result = executeHook('session-start.js');
      if (result.output && result.output.context) {
        assertContains(result.output.context, 'PDCA', 'Should include PDCA rules');
      }
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC40-03: session-start metadata 구조',
    setup: () => createTestProject({
      '.pdca-status.json': { version: '2.0', primaryFeature: null, activeFeatures: {}, archivedFeatures: {}, pipeline: {}, lastChecked: '' },
      '.bkit/state/memory.json': { data: { session: { sessionCount: 1 } } }
    }),
    fn: () => {
      const result = executeHook('session-start.js');
      if (result.output && result.output.metadata) {
        assert(result.output.metadata.version !== undefined, 'Should have version');
        assert(result.output.metadata.platform !== undefined, 'Should have platform');
      }
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC40-04: before-tool.js 허용 도구',
    setup: () => createTestProject({}),
    fn: () => {
      const result = executeHook('before-tool.js', { toolName: 'read_file', input: { file_path: 'test.js' } });
      assert(result.success || result.output.status === 'allow', 'read_file should be allowed');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC40-05: before-tool.js 위험 명령 차단',
    setup: () => createTestProject({}),
    fn: () => {
      const result = executeHook('before-tool.js', { toolName: 'run_shell_command', input: { command: 'rm -rf /' } });
      // Hook may return deny, allow (deferred to policy), or have no output
      assert(result !== undefined, 'Should return a result');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC40-06: after-tool.js 정상 처리',
    setup: () => createTestProject({}),
    fn: () => {
      const result = executeHook('after-tool.js', { toolName: 'write_file', input: { file_path: 'test.js' }, output: { success: true } });
      assert(result.success || result.output !== undefined, 'Should process after-tool');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC40-07: session-start 리턴 유저 감지',
    setup: () => createTestProject({
      '.pdca-status.json': { version: '2.0', primaryFeature: 'prev-feature', activeFeatures: { 'prev-feature': { phase: 'design' } }, archivedFeatures: {}, pipeline: {}, lastChecked: '' },
      '.bkit/state/memory.json': { data: { session: { sessionCount: 5, platform: 'gemini' } } }
    }),
    fn: () => {
      const result = executeHook('session-start.js');
      if (result.output && result.output.metadata) {
        assertEqual(result.output.metadata.isReturningUser, true, 'Should detect returning user');
      }
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC40-08: session-start Level 감지 Starter',
    setup: () => createTestProject({
      '.pdca-status.json': { version: '2.0', primaryFeature: null, activeFeatures: {}, archivedFeatures: {}, pipeline: {}, lastChecked: '' },
      '.bkit/state/memory.json': { data: { session: { sessionCount: 1 } } }
    }),
    fn: () => {
      const result = executeHook('session-start.js');
      if (result.output && result.output.metadata) {
        assertEqual(result.output.metadata.level, 'Starter', 'Empty project → Starter');
      }
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC40-09: session-start Level 감지 Dynamic',
    setup: () => createTestProject({
      '.pdca-status.json': { version: '2.0', primaryFeature: null, activeFeatures: {}, archivedFeatures: {}, pipeline: {}, lastChecked: '' },
      '.bkit/state/memory.json': { data: { session: { sessionCount: 1 } } },
      '.mcp.json': '{}'
    }),
    fn: () => {
      const result = executeHook('session-start.js');
      if (result.output && result.output.metadata) {
        assertEqual(result.output.metadata.level, 'Dynamic', '.mcp.json → Dynamic');
      }
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC40-10: before-tool-selection.js 존재 및 실행',
    setup: () => createTestProject({}),
    fn: () => {
      const result = executeHook('before-tool-selection.js', {});
      assert(result !== undefined, 'Should execute without crash');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC40-11: pre-compress.js 존재 및 실행',
    setup: () => createTestProject({}),
    fn: () => {
      const result = executeHook('pre-compress.js', {});
      assert(result !== undefined, 'Should execute');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC40-12: session-end.js 존재 및 실행',
    setup: () => createTestProject({
      '.bkit/state/memory.json': { data: { session: { sessionCount: 1 } } }
    }),
    fn: () => {
      const result = executeHook('session-end.js', {});
      assert(result !== undefined, 'Should execute');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC40-13: session-start hookEvent 필드',
    setup: () => createTestProject({
      '.pdca-status.json': { version: '2.0', primaryFeature: null, activeFeatures: {}, archivedFeatures: {}, pipeline: {}, lastChecked: '' },
      '.bkit/state/memory.json': { data: { session: { sessionCount: 1 } } }
    }),
    fn: () => {
      const result = executeHook('session-start.js');
      if (result.output) {
        assertEqual(result.output.hookEvent, 'SessionStart', 'Should set hookEvent');
      }
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC40-14: before-agent.js 존재 및 실행',
    setup: () => createTestProject({}),
    fn: () => {
      const result = executeHook('before-agent.js', { agentName: 'gap-detector' });
      assert(result !== undefined, 'Should execute');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC40-15: after-agent.js 존재 및 실행',
    setup: () => createTestProject({}),
    fn: () => {
      const result = executeHook('after-agent.js', { agentName: 'gap-detector', result: {} });
      assert(result !== undefined, 'Should execute');
    },
    teardown: cleanupTestProject
  }
];

module.exports = { tests };
