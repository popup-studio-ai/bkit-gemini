// tests/suites/tc06-commands.js
const { PLUGIN_ROOT, assert, assertEqual, assertContains, assertExists, getPdcaStatus, withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const ALL_COMMANDS = [
  'pdca', 'bkit', 'review', 'qa', 'starter',
  'dynamic', 'enterprise', 'pipeline', 'learn', 'github-stats',
  'bkend-quickstart', 'bkend-auth', 'bkend-data', 'bkend-storage',
  'bkend-mcp', 'bkend-security', 'bkend-cookbook', 'bkend-guides'
];

const tests = [
  {
    name: 'CMD-01: All 18 TOML files parse correctly',
    fn: () => {
      for (const cmd of ALL_COMMANDS) {
        const filePath = path.join(PLUGIN_ROOT, 'commands', `${cmd}.toml`);
        assertExists(filePath, `${cmd}.toml should exist`);
        const content = fs.readFileSync(filePath, 'utf-8');
        assertContains(content, 'description', `${cmd}.toml should have description`);
        assertContains(content, 'prompt', `${cmd}.toml should have prompt`);
      }
    }
  },
  {
    name: 'CMD-03: pdca.toml references pdca skill',
    fn: () => {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'commands', 'pdca.toml'), 'utf-8');
      assertContains(content, 'pdca', 'Should reference pdca skill');
    }
  },
  {
    name: 'CMD-04: All 8 bkend-* commands exist',
    fn: () => {
      const bkendCommands = ALL_COMMANDS.filter(c => c.startsWith('bkend-'));
      assertEqual(bkendCommands.length, 8, 'Should have exactly 8 bkend-* commands');
      for (const cmd of bkendCommands) {
        const filePath = path.join(PLUGIN_ROOT, 'commands', `${cmd}.toml`);
        assertExists(filePath, `${cmd}.toml should exist`);
        const content = fs.readFileSync(filePath, 'utf-8');
        assertContains(content, 'bkend', `${cmd}.toml should reference bkend`);
      }
    }
  }
];

module.exports = { tests };
