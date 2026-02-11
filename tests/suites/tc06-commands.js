// tests/suites/tc06-commands.js
const { PLUGIN_ROOT, assert, assertEqual, assertContains, assertExists } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const ALL_COMMANDS = [
  'pdca', 'bkit', 'review', 'qa', 'starter',
  'dynamic', 'enterprise', 'pipeline', 'learn', 'github-stats'
];

const tests = [
  {
    name: 'CMD-01: All 10 TOML files parse correctly',
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
    name: 'CMD-03: pdca.toml references @skills/pdca/SKILL.md',
    fn: () => {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'commands', 'pdca.toml'), 'utf-8');
      assertContains(content, '@skills/pdca/SKILL.md', 'Should reference pdca SKILL.md');
    }
  }
];

module.exports = { tests };
