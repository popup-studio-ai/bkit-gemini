// tests/suites/tc08-context.js
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, cleanupTestProject, executeHook, assert, assertEqual, assertContains, assertExists } = require('../test-utils');
const { PDCA_STATUS_FIXTURE } = require('../fixtures');
const path = require('path');
const fs = require('fs');

const tests = [
  {
    name: 'CTX-01: GEMINI.md has 6 @import directives',
    fn: () => {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'GEMINI.md'), 'utf-8');
      const imports = content.match(/^@\.gemini\/context\//gm) || [];
      assertEqual(imports.length, 6, `Should have 6 @import directives but found ${imports.length}`);
    }
  },
  {
    name: 'CTX-08: 4-level hierarchy merge order',
    fn: () => {
      const { ContextHierarchy } = require(path.join(PLUGIN_ROOT, 'lib', 'context-hierarchy'));
      const h = new ContextHierarchy(PLUGIN_ROOT, TEST_PROJECT_DIR);
      const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
      assertEqual(config.contextHierarchy.levels.length, 4, 'Should have 4 levels');
    }
  },
  {
    name: 'CTX-09: SessionStart injects dynamic context',
    setup: () => createTestProject({ 'docs/.pdca-status.json': PDCA_STATUS_FIXTURE }),
    fn: () => {
      const result = executeHook('session-start.js');
      assertContains(result.output.context, 'Agent Auto-Triggers', 'Should inject agent triggers');
      assertContains(result.output.context, 'Feature Usage Report', 'Should inject feature report');
    },
    teardown: cleanupTestProject
  }
];

module.exports = { tests };
