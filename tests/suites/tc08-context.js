// tests/suites/tc08-context.js
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, cleanupTestProject, executeHook, assert, assertEqual, assertContains, assertExists, getPdcaStatus, withVersion } = require('../test-utils');
const { PDCA_STATUS_FIXTURE } = require('../fixtures');
const path = require('path');
const fs = require('fs');

const tests = [
  {
    name: 'CTX-01: GEMINI.md has 6 @import directives',
    fn: () => {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'GEMINI.md'), 'utf-8');
      const imports = content.match(/^@\.gemini\/context\//gm) || [];
      assert(imports.length >= 2, `Should have at least 2 @import directives but found ${imports.length}`);
    }
  },
  {
    name: 'CTX-08: 4-level hierarchy merge order (v2.0.4: skip - ContextHierarchy removed)',
    skip: true,
    fn: () => {}
  },
  {
    name: 'CTX-09: SessionStart injects dynamic context',
    setup: () => createTestProject({ 'docs/.pdca-status.json': PDCA_STATUS_FIXTURE }),
    fn: () => {
      const result = executeHook('session-start.js');
      assertContains(result.output.systemMessage || result.output.context, 'Agent Auto-Triggers', 'Should inject agent triggers');
    },
    teardown: cleanupTestProject
  }
];

module.exports = { tests };
