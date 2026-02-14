// tests/suites/tc02-skills.js
const { PLUGIN_ROOT, assert, assertEqual, assertContains, assertExists } = require('../test-utils');
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
  {
    name: 'SKILL-01: 29 SKILL.md files parse without error',
    fn: () => {
      const { parseSkillFrontmatter } = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
      for (const skill of ALL_SKILLS) {
        const skillPath = path.join(PLUGIN_ROOT, 'skills', skill, 'SKILL.md');
        assertExists(skillPath, `${skill}/SKILL.md should exist`);
        const metadata = parseSkillFrontmatter(skillPath);
        assert(metadata.name, `${skill} should have a name`);
      }
    }
  },
  {
    name: 'SKILL-02: pdca skill metadata extraction',
    fn: () => {
      const { parseSkillFrontmatter } = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
      const metadata = parseSkillFrontmatter(path.join(PLUGIN_ROOT, 'skills', 'pdca', 'SKILL.md'));
      assertEqual(metadata['user-invocable'], true, 'pdca should be user-invocable');
      assert(Object.keys(metadata.agents).length > 0, 'pdca should have agent bindings');
      assertEqual(metadata.agents.analyze, 'gap-detector', 'analyze → gap-detector');
    }
  },
  {
    name: 'SKILL-11: parseSimpleYaml scalar',
    fn: () => {
      const { parseSimpleYaml } = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
      const result = parseSimpleYaml('name: pdca\ndescription: PDCA skill');
      assertEqual(result.name, 'pdca', 'Should parse scalar');
      assertEqual(result.description, 'PDCA skill', 'Should parse description');
    }
  },
  {
    name: 'SKILL-15: loadSkill returns metadata+body+templates',
    fn: () => {
      const { loadSkill, clearCache } = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
      clearCache();
      const result = loadSkill('pdca');
      assert(result !== null, 'Should load pdca skill');
      assert(result.metadata, 'Should have metadata');
      assert(typeof result.body === 'string', 'Should have body');
    }
  },
  {
    name: 'SKILL-17: activateSkill with analyze → gap-detector delegation',
    fn: () => {
      const { activateSkill, clearCache } = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
      clearCache();
      const result = activateSkill('pdca', 'analyze', 'login-form');
      assert(result.success, 'Should activate successfully');
      assertEqual(result.agent, 'gap-detector', 'Should delegate to gap-detector');
    }
  },
  {
    name: 'SKILL-20: listSkills returns 29 skills',
    fn: () => {
      const { listSkills, clearCache } = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
      clearCache();
      const skills = listSkills();
      assertEqual(skills.length, 29, `Should list 29 skills but found ${skills.length}`);
    }
  },
  {
    name: 'SKILL-21: bkend-quickstart skill has correct frontmatter',
    fn: () => {
      const { parseSkillFrontmatter } = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
      const metadata = parseSkillFrontmatter(path.join(PLUGIN_ROOT, 'skills', 'bkend-quickstart', 'SKILL.md'));
      assertEqual(metadata.name, 'bkend-quickstart', 'Should have correct name');
      assertEqual(metadata['user-invocable'], true, 'Should be user-invocable');
      assertEqual(metadata.agents.backend, 'bkend-expert', 'Should delegate to bkend-expert');
    }
  },
  {
    name: 'SKILL-22: All 8 bkend-* skills have consistent frontmatter',
    fn: () => {
      const { parseSkillFrontmatter } = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
      const bkendSkills = ALL_SKILLS.filter(s => s.startsWith('bkend-'));
      assertEqual(bkendSkills.length, 8, 'Should have exactly 8 bkend-* skills');
      for (const skill of bkendSkills) {
        const metadata = parseSkillFrontmatter(path.join(PLUGIN_ROOT, 'skills', skill, 'SKILL.md'));
        assertEqual(metadata['user-invocable'], true, `${skill} should be user-invocable`);
        assertEqual(metadata.agents.backend, 'bkend-expert', `${skill} should delegate to bkend-expert`);
        assertEqual(metadata.memory, 'project', `${skill} should use project memory`);
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
