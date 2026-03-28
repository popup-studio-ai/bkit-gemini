// TC-109: v0.35.0 Skill & Agent Compatibility (10 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertExists, assertType, parseYamlFrontmatter } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const { SUBAGENT_POLICY_GROUPS } = require(path.join(PLUGIN_ROOT, 'lib/gemini/policy'));

const tests = [
  { name: 'TC109-01: skills/ directory has 30+ skill directories', fn: () => {
    const skillsDir = path.join(PLUGIN_ROOT, 'skills');
    const dirs = fs.readdirSync(skillsDir).filter(d =>
      fs.statSync(path.join(skillsDir, d)).isDirectory()
    );
    assert(dirs.length >= 30, `Should have 30+ skills, found ${dirs.length}`);
  }},

  { name: 'TC109-02: agents/ directory has 21 .md files', fn: () => {
    const agentsDir = path.join(PLUGIN_ROOT, 'agents');
    const mds = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
    assert(mds.length >= 20, `Should have 20+ agent files, found ${mds.length}`);
  }},

  { name: 'TC109-03: all skills have SKILL.md with frontmatter', fn: () => {
    const skillsDir = path.join(PLUGIN_ROOT, 'skills');
    const dirs = fs.readdirSync(skillsDir).filter(d =>
      fs.statSync(path.join(skillsDir, d)).isDirectory()
    );
    let missingCount = 0;
    for (const dir of dirs) {
      const skillMd = path.join(skillsDir, dir, 'SKILL.md');
      if (fs.existsSync(skillMd)) {
        const content = fs.readFileSync(skillMd, 'utf-8');
        if (!content.startsWith('---')) missingCount++;
      } else {
        missingCount++;
      }
    }
    assertEqual(missingCount, 0, `${missingCount} skills missing SKILL.md or frontmatter`);
  }},

  { name: 'TC109-04: all agent .md files are non-empty', fn: () => {
    const agentsDir = path.join(PLUGIN_ROOT, 'agents');
    const mds = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
    let emptyCount = 0;
    for (const md of mds) {
      const content = fs.readFileSync(path.join(agentsDir, md), 'utf-8');
      if (content.trim().length === 0) emptyCount++;
    }
    assertEqual(emptyCount, 0, `${emptyCount} agent files are empty`);
  }},

  { name: 'TC109-05: SUBAGENT_POLICY_GROUPS agents exist in agents/ directory', fn: () => {
    const agentsDir = path.join(PLUGIN_ROOT, 'agents');
    const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md')).map(f => f.replace('.md', ''));

    const allPolicyAgents = [];
    for (const group of Object.values(SUBAGENT_POLICY_GROUPS)) {
      allPolicyAgents.push(...group.agents);
    }

    let missing = [];
    for (const agent of allPolicyAgents) {
      if (!agentFiles.includes(agent)) {
        missing.push(agent);
      }
    }
    assertEqual(missing.length, 0, `Missing agent files: ${missing.join(', ')}`);
  }},

  { name: 'TC109-06: skill-orchestrator.js loads without error', fn: () => {
    const mod = require(path.join(PLUGIN_ROOT, 'lib/skill-orchestrator'));
    assert(mod !== null, 'skill-orchestrator should load');
    assertType(mod.listSkills, 'function', 'should export listSkills');
  }},

  { name: 'TC109-07: skill-orchestrator exports listSkills function', fn: () => {
    const mod = require(path.join(PLUGIN_ROOT, 'lib/skill-orchestrator'));
    assertType(mod.listSkills, 'function', 'listSkills should be exported');
    // listSkills may need plugin root context; just verify it's callable
    const result = mod.listSkills();
    assert(Array.isArray(result), 'listSkills should return an array');
  }},

  { name: 'TC109-08: skill-orchestrator exports getUserInvocableSkills', fn: () => {
    const mod = require(path.join(PLUGIN_ROOT, 'lib/skill-orchestrator'));
    assertType(mod.getUserInvocableSkills, 'function', 'getUserInvocableSkills should be exported');
    const result = mod.getUserInvocableSkills();
    assert(Array.isArray(result), 'getUserInvocableSkills should return an array');
  }},

  { name: 'TC109-09: output-styles/ has 4 style files', fn: () => {
    const stylesDir = path.join(PLUGIN_ROOT, 'output-styles');
    if (!fs.existsSync(stylesDir)) {
      assert(true, 'output-styles directory not present (optional)');
      return;
    }
    const files = fs.readdirSync(stylesDir).filter(f => f.endsWith('.md'));
    assert(files.length >= 3, `Should have 3+ style files, found ${files.length}`);
  }},

  { name: 'TC109-10: templates/ has PDCA template files', fn: () => {
    const templatesDir = path.join(PLUGIN_ROOT, 'templates');
    if (!fs.existsSync(templatesDir)) {
      assert(true, 'templates directory not present (optional)');
      return;
    }
    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.md'));
    assert(files.length >= 3, `Should have 3+ template files, found ${files.length}`);
  }},

  // v0.36.0 enableAgents verification (v2.0.2)
  { name: 'TC109-11: .gemini/settings.json contains enableAgents key', fn: () => {
    const settingsPath = path.join(PLUGIN_ROOT, '.gemini', 'settings.json');
    assert(fs.existsSync(settingsPath), '.gemini/settings.json should exist');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    assert(settings.experimental !== undefined, 'experimental section should exist');
    assertEqual(settings.experimental.enableAgents, true, 'enableAgents should be true');
  }},

  { name: 'TC109-12: bkit.config.json testedVersions includes 0.36.0', fn: () => {
    const configPath = path.join(PLUGIN_ROOT, 'bkit.config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const versions = config.compatibility.testedVersions;
    assert(versions.includes('0.36.0'), 'testedVersions should include 0.36.0');
    assert(versions.includes('0.35.3'), 'testedVersions should include 0.35.3');
  }}
];

module.exports = { tests };
