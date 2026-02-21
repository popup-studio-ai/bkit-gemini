// tests/suites/tc15-feature-report.js - Feature Usage Report Test
const { PLUGIN_ROOT, assert, assertExists } = require('../test-utils');
const fs = require('fs');
const path = require('path');

const tests = [
  {
    name: 'TC-15-01: Feature Report Context File Existence',
    fn: () => {
      const reportContextPath = path.resolve(PLUGIN_ROOT, '.gemini/context/feature-report.md');
      assertExists(reportContextPath, 'Feature report context file should exist');
    }
  },
  {
    name: 'TC-15-02: Report Format Compliance',
    fn: () => {
      const reportContextPath = path.resolve(PLUGIN_ROOT, '.gemini/context/feature-report.md');
      const content = fs.readFileSync(reportContextPath, 'utf8');
      assert(content.includes('bkit Feature Usage Report Format'), 'Should mention report format');
      assert(content.includes('📊 bkit Feature Usage'), 'Should include icon');
    }
  },
  {
    name: 'TC-15-03: Feature Categorization Present',
    fn: () => {
      const reportContextPath = path.resolve(PLUGIN_ROOT, '.gemini/context/feature-report.md');
      const content = fs.readFileSync(reportContextPath, 'utf8');
      const categories = ['PDCA Skill', 'Agents', 'Level Skills', 'Phase Skills', 'Utility Skills'];
      categories.forEach(category => {
        assert(content.includes(category), `Should include category ${category}`);
      });
    }
  }
];

module.exports = { tests };
