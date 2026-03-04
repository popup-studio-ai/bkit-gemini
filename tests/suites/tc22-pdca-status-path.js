const fs = require('fs');
const path = require('path');
const { 
  createTestProject, createTestProjectV2, cleanupTestProject, 
  executeHook, assert, assertEqual, assertExists, TEST_PROJECT_DIR 
} = require('../test-utils');
const { PDCA_STATUS_V157 } = require('../fixtures');

const tests = [
  {
    name: 'TC-22-01: PDCA status reads from root .pdca-status.json',
    fn: async () => {
      createTestProjectV2({
        '.pdca-status.json': PDCA_STATUS_V157
      });
      const result = executeHook('session-start.js');
      assert(result.success, 'SessionStart should succeed');
      assert(result.output.context.includes('test-feature'), 'Context should include feature from root status');
    }
  },
  {
    name: 'TC-22-02: PDCA status fallback to docs/.pdca-status.json (legacy)',
    fn: async () => {
      createTestProject({
        'docs/.pdca-status.json': PDCA_STATUS_V157
      });
      const result = executeHook('session-start.js');
      assert(result.success, 'SessionStart should succeed');
      assert(result.output.context.includes('test-feature'), 'Context should include feature from legacy status');
    }
  },
  {
    name: 'TC-22-03: after-tool.js updates correct status path',
    fn: async () => {
      createTestProjectV2({
        '.pdca-status.json': PDCA_STATUS_V157
      });
      // Simulate tool that would trigger phase transition (not strictly needed for just path check, but let's test it)
      const input = {
        tool_name: 'write_file',
        tool_input: { file_path: 'src/new-file.js', content: '// test' }
      };
      const result = executeHook('after-tool.js', input);
      assert(result.success, 'after-tool should succeed');
      
      const statusPath = path.join(TEST_PROJECT_DIR, '.pdca-status.json');
      assertExists(statusPath, 'Root status file should exist');
      const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
      assertEqual(status.features['test-feature'].phase, 'do', 'Phase should transition to do');
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
