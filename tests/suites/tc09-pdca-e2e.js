// tests/suites/tc09-pdca-e2e.js
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, cleanupTestProject, executeHook, assert, assertEqual, assertContains, assertExists } = require('../test-utils');
const fs = require('fs');
const path = require('path');

const tests = [
  {
    name: 'E2E-01: Plan document generation (Logic check)',
    setup: () => createTestProject({}),
    fn: () => {
      const result = executeHook('after-tool.js', {
        tool_name: 'activate_skill',
        tool_input: { skill: 'bkit:pdca', args: 'plan test-feature' }
      });
      assert(result.success, 'Post-hook should run');
      const status = JSON.parse(fs.readFileSync(path.join(TEST_PROJECT_DIR, 'docs/.pdca-status.json'), 'utf-8'));
      assert(status.features['test-feature'], 'Feature should be in status');
      assertEqual(status.features['test-feature'].phase, 'plan', 'Phase should be plan');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'E2E-03: Design document transition',
    setup: () => {
      const status = JSON.parse(JSON.stringify(require('../fixtures').PDCA_STATUS_FIXTURE));
      status.features['test-feature'].phase = 'plan';
      createTestProject({ 'docs/.pdca-status.json': status });
    },
    fn: () => {
      const result = executeHook('after-tool.js', {
        tool_name: 'activate_skill',
        tool_input: { skill: 'bkit:pdca', args: 'design test-feature' }
      });
      const status = JSON.parse(fs.readFileSync(path.join(TEST_PROJECT_DIR, 'docs/.pdca-status.json'), 'utf-8'));
      assertEqual(status.features['test-feature'].phase, 'design', 'Phase should transition to design');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'E2E-05: Implementation starts (Do phase)',
    setup: () => {
      const status = JSON.parse(JSON.stringify(require('../fixtures').PDCA_STATUS_FIXTURE));
      status.features['test-feature'].phase = 'design';
      createTestProject({ 'docs/.pdca-status.json': status });
    },
    fn: () => {
      const result = executeHook('after-tool.js', {
        tool_name: 'write_file',
        tool_input: { file_path: 'src/app.js', content: 'console.log("hello");' }
      });
      const status = JSON.parse(fs.readFileSync(path.join(TEST_PROJECT_DIR, 'docs/.pdca-status.json'), 'utf-8'));
      assertEqual(status.features['test-feature'].phase, 'do', 'Phase should transition to do');
    },
    teardown: cleanupTestProject
  }
];

module.exports = { tests };
