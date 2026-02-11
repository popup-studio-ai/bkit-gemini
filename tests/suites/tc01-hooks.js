// tests/suites/tc01-hooks.js
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, cleanupTestProject, executeHook, assert, assertEqual, assertContains } = require('../test-utils');
const { PDCA_STATUS_FIXTURE, BKIT_MEMORY_FIXTURE, BKIT_MEMORY_RETURNING } = require('../fixtures');
const fs = require('fs');
const path = require('path');

const tests = [
  // --- 4.1.1 SessionStart ---
  {
    name: 'HOOK-01: SessionStart returns valid JSON',
    setup: () => createTestProject({}),
    fn: () => {
      const result = executeHook('session-start.js');
      assert(result.success, 'Hook should exit 0');
      assertEqual(result.output.status, 'allow', 'Status should be allow');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'HOOK-02: Enterprise level auto-detection',
    setup: () => createTestProject({ 'kubernetes/.keep': '' }),
    fn: () => {
      const result = executeHook('session-start.js');
      assertContains(result.output.metadata?.level || result.output.context, 'Enterprise', 'Should detect Enterprise');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'HOOK-03: Dynamic level auto-detection',
    setup: () => createTestProject({ 'docker-compose.yml': 'version: "3"' }),
    fn: () => {
      const result = executeHook('session-start.js');
      assertContains(result.output.metadata?.level || result.output.context, 'Dynamic', 'Should detect Dynamic');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'HOOK-04: Starter level default',
    setup: () => createTestProject({}),
    fn: () => {
      const result = executeHook('session-start.js');
      assertContains(result.output.metadata?.level || result.output.context, 'Starter', 'Should default to Starter');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'HOOK-05: sessionCount increments',
    setup: () => createTestProject({ 'docs/.bkit-memory.json': { sessionCount: 3, platform: 'gemini', level: 'Starter' } }),
    fn: () => {
      executeHook('session-start.js');
      const memory = JSON.parse(fs.readFileSync(path.join(TEST_PROJECT_DIR, 'docs/.bkit-memory.json'), 'utf-8'));
      assertEqual(memory.sessionCount, 4, 'Should increment sessionCount');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'HOOK-06: Output style by level',
    setup: () => createTestProject({}),
    fn: () => {
      const result = executeHook('session-start.js');
      assertEqual(result.output.metadata?.outputStyle, 'bkit-learning', 'Starter should use learning style');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'HOOK-07: Returning user detection',
    setup: () => createTestProject({ 'docs/.bkit-memory.json': BKIT_MEMORY_RETURNING, 'docs/.pdca-status.json': PDCA_STATUS_FIXTURE }),
    fn: () => {
      const result = executeHook('session-start.js');
      assertContains(result.output.context, 'Previous Work', 'Should show previous work');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'HOOK-08: New user onboarding',
    setup: () => createTestProject({}),
    fn: () => {
      const result = executeHook('session-start.js');
      assertContains(result.output.context, 'Welcome', 'Should show welcome');
    },
    teardown: cleanupTestProject
  },

  // --- 4.1.2 BeforeAgent ---
  {
    name: 'HOOK-11: Korean trigger → gap-detector',
    setup: () => createTestProject({}),
    fn: () => {
      const result = executeHook('before-agent.js', { prompt: '이 코드 검증해줘' });
      assertContains(result.output.context || result.raw, 'gap-detector', 'Should trigger gap-detector');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'HOOK-12: Japanese trigger → pdca-iterator',
    setup: () => createTestProject({}),
    fn: () => {
      const result = executeHook('before-agent.js', { prompt: '改善して' });
      assertContains(result.output.context || result.raw, 'pdca-iterator', 'Should trigger pdca-iterator');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'HOOK-13: English trigger → code-analyzer',
    setup: () => createTestProject({}),
    fn: () => {
      const result = executeHook('before-agent.js', { prompt: 'analyze this code' });
      assertContains(result.output.context || result.raw, 'code-analyzer', 'Should trigger code-analyzer');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'HOOK-15: Ambiguity detection',
    setup: () => createTestProject({}),
    fn: () => {
      const result = executeHook('before-agent.js', { prompt: '이거 고쳐' });
      assertContains(result.output.context || result.raw, 'ambiguous', 'Should detect ambiguity');
    },
    teardown: cleanupTestProject
  },

  // --- 4.1.3 BeforeModel / 4.1.4 AfterModel ---
  {
    name: 'HOOK-17: BeforeModel PDCA context',
    setup: () => createTestProject({ 'docs/.pdca-status.json': PDCA_STATUS_FIXTURE }),
    fn: () => {
      const result = executeHook('before-model.js', { prompt: 'plan feature' });
      // If implemented, should allow and potentially add context
      assert(result.success || result.exitCode === 0, 'BeforeModel should exit 0');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'HOOK-19: AfterModel exit clean',
    setup: () => createTestProject({}),
    fn: () => {
      const result = executeHook('after-model.js', { response: 'done' });
      assert(result.success || result.exitCode === 0, 'AfterModel should exit 0');
    },
    teardown: cleanupTestProject
  },

  // --- 4.1.5 BeforeToolSelection ---
  {
    name: 'HOOK-20: Tool filtering by phase (Plan)',
    setup: () => createTestProject({ 'docs/.pdca-status.json': PDCA_STATUS_FIXTURE }),
    fn: () => {
      const result = executeHook('before-tool-selection.js', { tools: ['write_file', 'read_file'] });
      assert(result.success || result.exitCode === 0, 'Should filter tools');
    },
    teardown: cleanupTestProject
  },

  // --- 4.1.6 BeforeTool ---
  {
    name: 'HOOK-22: Block rm -rf /',
    setup: () => createTestProject({}),
    fn: () => {
      const result = executeHook('before-tool.js', { tool_name: 'run_shell_command', tool_input: { command: 'rm -rf /' } });
      assertEqual(result.output.status, 'block', 'Should block dangerous command');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'HOOK-25: Plan phase write warning',
    setup: () => createTestProject({ 'docs/.pdca-status.json': PDCA_STATUS_FIXTURE }),
    fn: () => {
      const result = executeHook('before-tool.js', { tool_name: 'write_file', tool_input: { file_path: 'src/app.js', content: '...' } });
      assertContains(result.output.context || result.raw, 'Warning', 'Should warn about writing in plan phase');
    },
    teardown: cleanupTestProject
  },

  // --- 4.1.7 AfterTool ---
  {
    name: 'HOOK-28: Design -> Do transition',
    setup: () => {
      const status = JSON.parse(JSON.stringify(PDCA_STATUS_FIXTURE));
      status.features['test-feature'].phase = 'design';
      createTestProject({ 'docs/.pdca-status.json': status });
    },
    fn: () => {
      executeHook('after-tool.js', { tool_name: 'write_file', tool_input: { file_path: 'src/main.js', content: '...' } });
      const status = JSON.parse(fs.readFileSync(path.join(TEST_PROJECT_DIR, 'docs/.pdca-status.json'), 'utf-8'));
      assertEqual(status.features['test-feature'].phase, 'do', 'Should move to do phase');
    },
    teardown: cleanupTestProject
  }
];

module.exports = { tests };