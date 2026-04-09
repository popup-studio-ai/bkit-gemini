// tests/suites/tc02-skills.js
const { PLUGIN_ROOT, assert, assertEqual, assertContains, assertExists, getPdcaStatus, withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const ALL_SKILLS = [
  'pdca', 'starter', 'dynamic', 'enterprise', 'development-pipeline',
  'code-review', 'zero-script-qa', 'mobile-app', 'desktop-app',
  'bkit-templates', 'bkit-rules', 'gemini-cli-learning',
  'phase-1-schema', 'phase-2-convention', 'phase-3-mockup',
  'phase-4-api', 'phase-5-design-system', 'phase-6-ui-integration',
  'phase-7-seo-security', 'phase-8-review', 'phase-9-deployment',
  'bkend-quickstart', 'bkend-auth', 'bkend-data', 'bkend-storage',
  'bkend-mcp', 'bkend-security', 'bkend-cookbook', 'bkend-guides'
];

const tests = [
  // SKILL-01~22: skill-orchestrator.js removed in v2.0.4 (Gemini CLI native skill system)
  // Skills are now loaded natively by Gemini CLI via skills/*/SKILL.md
  {
    name: 'SKILL-01: All SKILL.md files exist and have frontmatter (v2.0.4)',
    fn: () => {
      for (const skill of ALL_SKILLS) {
        const skillPath = path.join(PLUGIN_ROOT, 'skills', skill, 'SKILL.md');
        assertExists(skillPath, `${skill}/SKILL.md should exist`);
        const content = fs.readFileSync(skillPath, 'utf-8');
        assert(content.includes('---'), `${skill} should have YAML frontmatter`);
      }
    }
  },
  {
    name: 'SKILL-02: pdca skill has agent bindings in frontmatter',
    fn: () => {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'skills', 'pdca', 'SKILL.md'), 'utf-8');
      assertContains(content, 'gap-detector', 'pdca should reference gap-detector');
    }
  },
  {
    name: 'SKILL-11: parseSimpleYaml scalar (v2.0.4: skip - skill-orchestrator removed)',
    skip: true,
    fn: () => {}
  },
  {
    name: 'SKILL-15: loadSkill returns metadata (v2.0.4: skip - skill-orchestrator removed)',
    skip: true,
    fn: () => {}
  },
  {
    name: 'SKILL-17: activateSkill delegation (v2.0.4: skip - skill-orchestrator removed)',
    skip: true,
    fn: () => {}
  },
  {
    name: 'SKILL-20: listSkills count (v2.0.4: verify via filesystem)',
    fn: () => {
      const skillDirs = fs.readdirSync(path.join(PLUGIN_ROOT, 'skills'), { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
      assert(skillDirs.length >= 29, `Should have at least 29 skills but found ${skillDirs.length}`);
    }
  },
  {
    name: 'SKILL-21: bkend-quickstart skill has correct content',
    fn: () => {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'skills', 'bkend-quickstart', 'SKILL.md'), 'utf-8');
      assertContains(content, 'bkend-quickstart', 'Should contain skill name');
      assertContains(content, 'bkend-expert', 'Should reference bkend-expert agent');
    }
  },
  {
    name: 'SKILL-22: All 8 bkend-* skills have consistent content',
    fn: () => {
      const bkendSkills = ALL_SKILLS.filter(s => s.startsWith('bkend-'));
      assertEqual(bkendSkills.length, 8, 'Should have exactly 8 bkend-* skills');
      for (const skill of bkendSkills) {
        const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'skills', skill, 'SKILL.md'), 'utf-8');
        assertContains(content, 'bkend-expert', `${skill} should reference bkend-expert`);
      }
    }
  },
  {
    name: 'SKILL-23: bkend-* skills contain domain-specific content',
    fn: () => {
      const contentChecks = {
        'bkend-quickstart': 'Resource Hierarchy',
        'bkend-auth': 'JWT',
        'bkend-data': 'CRUD',
        'bkend-storage': 'Presigned URL',
        'bkend-mcp': 'MCP',
        'bkend-security': 'RLS',
        'bkend-cookbook': 'tutorial',
        'bkend-guides': 'troubleshoot'
      };
      for (const [skill, keyword] of Object.entries(contentChecks)) {
        const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'skills', skill, 'SKILL.md'), 'utf-8');
        assertContains(content, keyword, `${skill} should contain "${keyword}"`);
      }
    }
  }
];

module.exports = { tests };
