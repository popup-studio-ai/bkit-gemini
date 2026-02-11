// tests/suites/tc10-philosophy.js
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, cleanupTestProject, executeHook, assert, assertEqual, assertContains } = require('../test-utils');

const tests = [
  {
    name: 'AF-01: Returning user detection',
    setup: () => createTestProject({
      'docs/.bkit-memory.json': { sessionCount: 3, platform: 'gemini', level: 'Starter' }
    }),
    fn: () => {
      const result = executeHook('session-start.js');
      assertContains(result.output.context, 'Welcome', 'Should recognize returning user');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'AF-04: Enterprise level auto-detection',
    setup: () => createTestProject({ 'kubernetes/service.yaml': '...' }),
    fn: () => {
      const result = executeHook('session-start.js');
      assertContains(result.output.context, 'Enterprise', 'Should detect Enterprise level');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'AF-07: Korean agent trigger (Verification)',
    setup: () => createTestProject({}),
    fn: () => {
      const result = executeHook('before-agent.js', { prompt: '검증해줘' });
      assertContains(result.output.context || result.raw, 'gap-detector', 'Should trigger gap-detector');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'NG-06: Dangerous command block (rm -rf)',
    setup: () => createTestProject({}),
    fn: () => {
      const result = executeHook('before-tool.js', {
        tool_name: 'run_shell_command',
        tool_input: { command: 'rm -rf /' }
      });
      const status = result.output ? result.output.status : null;
      assertEqual(status, 'block', 'Should block dangerous command');
    },
    teardown: cleanupTestProject
  }
];

module.exports = { tests };
