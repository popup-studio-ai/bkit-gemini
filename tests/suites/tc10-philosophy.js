// tests/suites/tc10-philosophy.js
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, cleanupTestProject, executeHook, assert, assertEqual, assertContains, getPdcaStatus, withVersion } = require('../test-utils');

const tests = [
  {
    name: 'AF-01: Returning user detection (verbose mode)',
    setup: () => createTestProject({
      'docs/.bkit-memory.json': { sessionCount: 3, platform: 'gemini', level: 'Starter' }
    }),
    fn: () => {
      // Refactored 2026-04-24 (v2.0.5-finalization): default is slim. Welcome
      // body lives in verbose body / GEMINI.md.
      const result = executeHook('session-start.js', {}, { BKIT_SESSION_START_VERBOSE: 'true' });
      assertContains(result.output.systemMessage || result.output.context, 'Welcome', 'Should recognize returning user');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'AF-04: Enterprise level auto-detection',
    setup: () => createTestProject({ 'kubernetes/service.yaml': '...' }),
    fn: () => {
      const result = executeHook('session-start.js');
      assertContains(result.output.systemMessage || result.output.context || JSON.stringify(result.output.metadata), 'Enterprise', 'Should detect Enterprise level');
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
      const decision = result.output ? result.output.decision : null;
      assertEqual(decision, 'deny', 'Should block dangerous command');
    },
    teardown: cleanupTestProject
  }
];

module.exports = { tests };
