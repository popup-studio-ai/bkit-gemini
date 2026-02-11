// tests/suites/tc07-config.js
const { PLUGIN_ROOT, assert, assertEqual } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const tests = [
  {
    name: 'CFG-01: bkit.config.json valid JSON',
    fn: () => {
      const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
      assert(typeof config === 'object', 'Should parse as object');
    }
  },
  {
    name: 'CFG-02: version is 1.5.1',
    fn: () => {
      const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
      assertEqual(config.version, '1.5.1', 'Version should be 1.5.1');
    }
  },
  {
    name: 'CFG-04~05: PDCA thresholds',
    fn: () => {
      const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
      assertEqual(config.pdca.matchRateThreshold, 90, 'Match rate threshold should be 90');
      assertEqual(config.pdca.maxIterations, 5, 'Max iterations should be 5');
    }
  }
];

module.exports = { tests };
