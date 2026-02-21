// tests/suites/tc11-output-styles.js - Output Style Test
const { PLUGIN_ROOT, assert, assertExists, assertEqual } = require('../test-utils');
const fs = require('fs');
const path = require('path');

const tests = [
  {
    name: 'TC-11-01: Output Style Directory Existence',
    fn: () => {
      const styleDir = path.resolve(PLUGIN_ROOT, 'output-styles');
      assertExists(styleDir, 'Output styles directory should exist');
    }
  },
  {
    name: 'TC-11-02: Required Style Files Existence',
    fn: () => {
      const requiredStyles = [
        'bkit-learning.md',
        'bkit-pdca-guide.md',
        'bkit-enterprise.md',
        'bkit-pdca-enterprise.md'
      ];
      const styleDir = path.resolve(PLUGIN_ROOT, 'output-styles');
      requiredStyles.forEach(style => {
        assertExists(path.join(styleDir, style), `${style} should exist`);
      });
    }
  },
  {
    name: 'TC-11-03: Configuration Mapping',
    fn: () => {
      const configPath = path.resolve(PLUGIN_ROOT, 'bkit.config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      assert(config.outputStyles.available.length >= 4, 'Should have at least 4 output styles');
      assertEqual(config.outputStyles.default, 'bkit-pdca-guide', 'Default output style should be correct');
    }
  },
  {
    name: 'TC-11-04: Style Content Validation (Learning)',
    fn: () => {
      const learningStylePath = path.resolve(PLUGIN_ROOT, 'output-styles/bkit-learning.md');
      const content = fs.readFileSync(learningStylePath, 'utf8');
      assert(content.includes('Starter'), 'Learning style should mention Starter level');
      assert(content.includes('friendly'), 'Learning style should mention friendly tone');
    }
  }
];

module.exports = { tests };
