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
  'phase-7-seo-security', 'phase-8-review', 'phase-9-deployment'
];

const tests = [
  {
    name: 'SKILL-01: 21 SKILL.md files parse without error',
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
    name: 'SKILL-20: listSkills returns 21 skills',
    fn: () => {
      const { listSkills, clearCache } = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
      clearCache();
      const skills = listSkills();
      assertEqual(skills.length, 21, `Should list 21 skills but found ${skills.length}`);
    }
  }
];

module.exports = { tests };
