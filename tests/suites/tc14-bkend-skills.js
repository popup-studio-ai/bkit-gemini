// tests/suites/tc14-bkend-skills.js - bkend.ai Skills Test
const { PLUGIN_ROOT, assert, assertExists } = require('../test-utils');
const fs = require('fs');
const path = require('path');

const tests = [
  {
    name: 'TC-14-01: Required bkend Skill Directory Existence',
    fn: () => {
      const bkendSkills = [
        'bkend-quickstart',
        'bkend-auth',
        'bkend-data',
        'bkend-storage',
        'bkend-mcp',
        'bkend-security',
        'bkend-cookbook',
        'bkend-guides'
      ];
      const skillsDir = path.resolve(PLUGIN_ROOT, 'skills');
      bkendSkills.forEach(skill => {
        assertExists(path.join(skillsDir, skill), `${skill} skill directory should exist`);
      });
    }
  },
  {
    name: 'TC-14-02: bkend Commands Mapping Existence',
    fn: () => {
      const bkendCommands = [
        'bkend-quickstart.toml',
        'bkend-auth.toml',
        'bkend-data.toml',
        'bkend-storage.toml',
        'bkend-mcp.toml',
        'bkend-security.toml',
        'bkend-cookbook.toml',
        'bkend-guides.toml'
      ];
      const commandsDir = path.resolve(PLUGIN_ROOT, 'commands');
      bkendCommands.forEach(cmd => {
        assertExists(path.join(commandsDir, cmd), `${cmd} should exist`);
      });
    }
  },
  {
    name: 'TC-14-03: bkend-quickstart SKILL.md Content Validation',
    fn: () => {
      const skillPath = path.resolve(PLUGIN_ROOT, 'skills/bkend-quickstart/SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf8');
      assert(content.includes('Org->Project->Environment'), 'Quickstart skill should mention resource hierarchy');
    }
  }
];

module.exports = { tests };
