const fs = require('fs');
const path = require('path');
const { createTestProject, cleanupTestProject, executeHook, assert, assertEqual, assertExists, TEST_PROJECT_DIR, getPdcaStatus, withVersion } = require('../test-utils');
const { PDCA_STATUS_V157 } = require('../fixtures');

const tests = [
  {
    name: 'TC-22-01: PDCA status reads from root .pdca-status.json (verbose mode)',
    fn: async () => {
      // Refactored 2026-04-24 (v2.0.5-finalization): the "feature in body" view
      // is part of the verbose SessionStart body; metadata.primaryFeature also
      // carries it. Test now uses verbose mode for the body assertion.
      createTestProject({
        '.pdca-status.json': PDCA_STATUS_V157
      });
      const result = executeHook('session-start.js', {}, { BKIT_SESSION_START_VERBOSE: 'true' });
      assert(result.success, 'SessionStart should succeed');
      const outputText = result.output.systemMessage || result.output.context || JSON.stringify(result.output);
      assert(outputText.includes('test-feature'), 'Output should include feature from root status');
    }
  },
  {
    name: 'TC-22-02: PDCA status fallback to docs/.pdca-status.json (legacy, verbose mode)',
    fn: async () => {
      createTestProject({
        'docs/.pdca-status.json': PDCA_STATUS_V157
      });
      const result = executeHook('session-start.js', {}, { BKIT_SESSION_START_VERBOSE: 'true' });
      assert(result.success, 'SessionStart should succeed');
      const outputText = result.output.systemMessage || result.output.context || JSON.stringify(result.output);
      assert(outputText.includes('test-feature'), 'Output should include feature from legacy status');
    }
  },
  {
    name: 'TC-22-03: after-tool.js updates correct status path',
    fn: async () => {
      // Use proper v2.0 format with activeFeatures as object
      const statusFixture = {
        version: '2.0',
        primaryFeature: 'test-feature',
        activeFeatures: { 'test-feature': { phase: 'design', matchRate: null } },
        history: []
      };
      createTestProject({
        '.bkit/state/pdca-status.json': statusFixture
      });
      const input = {
        tool_name: 'write_file',
        tool_input: { file_path: 'src/new-file.js', content: '// test' }
      };
      const result = executeHook('after-tool.js', input);
      assert(result.success, 'after-tool should succeed');

      // v2.0.4: status is at .bkit/state/pdca-status.json
      const bkitPath = path.join(TEST_PROJECT_DIR, '.bkit', 'state', 'pdca-status.json');
      const rootPath = path.join(TEST_PROJECT_DIR, '.pdca-status.json');
      const statusPath = fs.existsSync(bkitPath) ? bkitPath : rootPath;
      assertExists(statusPath, 'Status file should exist');
      const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
      const features = status.activeFeatures || status.features || {};
      const feature = features['test-feature'];
      assertEqual(feature?.phase, 'do', 'Phase should transition to do');
    }
  },
  {
    name: 'TC-22-07: Auto-migration from legacy to current',
    fn: async () => {
      createTestProject({
        'docs/.pdca-status.json': PDCA_STATUS_V157
      });
      // Any hook that reads status might trigger migration logic if implemented
      // Let's check session-start or after-tool
      executeHook('session-start.js');
      
      const rootPath = path.join(TEST_PROJECT_DIR, '.pdca-status.json');
      // If auto-migration is implemented, it should exist at root now.
      // NOTE: Based on design doc, it's a target. Let's see if it's already there or if I need to implement it.
      // For now, I'll just check if it works.
      assertExists(rootPath, 'Root status file should exist after migration');
    }
  }
];

module.exports = { tests };
