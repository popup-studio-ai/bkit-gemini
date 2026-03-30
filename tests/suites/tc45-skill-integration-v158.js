// TC-45: Skill Integration v1.5.8 Tests (18 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertContains, assertExists, getPdcaStatus, withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const SKILLS_DIR = path.join(PLUGIN_ROOT, 'skills');
const COMMANDS_DIR = path.join(PLUGIN_ROOT, 'commands');

const tests = [
  { name: 'TC45-01: 스킬 → 커맨드 매핑 pdca', fn: () => {
    assertExists(path.join(SKILLS_DIR, 'pdca/SKILL.md'), 'pdca skill');
    assertExists(path.join(COMMANDS_DIR, 'pdca.toml'), 'pdca command');
  }},
  { name: 'TC45-02: 스킬 → 커맨드 매핑 starter', fn: () => {
    assertExists(path.join(SKILLS_DIR, 'starter/SKILL.md'), 'starter skill');
    assertExists(path.join(COMMANDS_DIR, 'starter.toml'), 'starter command');
  }},
  { name: 'TC45-03: 스킬 → 커맨드 매핑 dynamic', fn: () => {
    assertExists(path.join(SKILLS_DIR, 'dynamic/SKILL.md'), 'dynamic skill');
    assertExists(path.join(COMMANDS_DIR, 'dynamic.toml'), 'dynamic command');
  }},
  { name: 'TC45-04: 스킬 → 커맨드 매핑 enterprise', fn: () => {
    assertExists(path.join(SKILLS_DIR, 'enterprise/SKILL.md'), 'enterprise skill');
    assertExists(path.join(COMMANDS_DIR, 'enterprise.toml'), 'enterprise command');
  }},
  { name: 'TC45-05: plan-plus 스킬-커맨드 매핑', fn: () => {
    assertExists(path.join(SKILLS_DIR, 'plan-plus/SKILL.md'), 'plan-plus skill');
    assertExists(path.join(COMMANDS_DIR, 'plan-plus.toml'), 'plan-plus command');
  }},
  { name: 'TC45-06: code-review 스킬-커맨드 매핑', fn: () => {
    assertExists(path.join(SKILLS_DIR, 'code-review/SKILL.md'), 'code-review skill');
    assertExists(path.join(COMMANDS_DIR, 'review.toml'), 'review command');
  }},
  { name: 'TC45-07: simplify 스킬-커맨드 매핑', fn: () => {
    assertExists(path.join(SKILLS_DIR, 'simplify/SKILL.md'), 'simplify skill');
    assertExists(path.join(COMMANDS_DIR, 'simplify.toml'), 'simplify command');
  }},
  { name: 'TC45-08: loop 스킬-커맨드 매핑', fn: () => {
    assertExists(path.join(SKILLS_DIR, 'loop/SKILL.md'), 'loop skill');
    assertExists(path.join(COMMANDS_DIR, 'loop.toml'), 'loop command');
  }},
  { name: 'TC45-09: development-pipeline 스킬-커맨드 매핑', fn: () => {
    assertExists(path.join(SKILLS_DIR, 'development-pipeline/SKILL.md'), 'pipeline skill');
    assertExists(path.join(COMMANDS_DIR, 'pipeline.toml'), 'pipeline command');
  }},
  { name: 'TC45-10: bkend 스킬 8개 → 커맨드 매핑', fn: () => {
    const bkendSkills = ['bkend-quickstart', 'bkend-auth', 'bkend-data', 'bkend-storage', 'bkend-mcp', 'bkend-cookbook', 'bkend-guides', 'bkend-security'];
    for (const s of bkendSkills) {
      assertExists(path.join(SKILLS_DIR, `${s}/SKILL.md`), `${s} skill`);
    }
  }},
  { name: 'TC45-11: TOML 커맨드에 skill_name 필드', fn: () => {
    const content = fs.readFileSync(path.join(COMMANDS_DIR, 'pdca.toml'), 'utf-8');
    assertContains(content, 'skill', 'pdca.toml should reference skill');
  }},
  { name: 'TC45-12: phase 스킬 9개 존재', fn: () => {
    for (let i = 1; i <= 9; i++) {
      const dirs = fs.readdirSync(SKILLS_DIR);
      const phaseDir = dirs.find(d => d.startsWith(`phase-${i}-`));
      assert(phaseDir !== undefined, `phase-${i} skill should exist`);
    }
  }},
  { name: 'TC45-13: 스킬 SKILL.md Triggers 섹션', fn: () => {
    const pdca = fs.readFileSync(path.join(SKILLS_DIR, 'pdca/SKILL.md'), 'utf-8');
    const hasTrigger = pdca.includes('Trigger') || pdca.includes('trigger') || pdca.includes('Keywords');
    assert(hasTrigger, 'Should have triggers section');
  }},
  { name: 'TC45-14: pm-discovery 스킬 존재', fn: () => {
    assertExists(path.join(SKILLS_DIR, 'pm-discovery/SKILL.md'), 'pm-discovery');
  }},
  { name: 'TC45-15: gemini-cli-learning 스킬', fn: () => {
    assertExists(path.join(SKILLS_DIR, 'gemini-cli-learning/SKILL.md'), 'gemini-cli-learning');
  }},
  { name: 'TC45-16: mobile-app 스킬', fn: () => {
    assertExists(path.join(SKILLS_DIR, 'mobile-app/SKILL.md'), 'mobile-app');
  }},
  { name: 'TC45-17: zero-script-qa 스킬', fn: () => {
    assertExists(path.join(SKILLS_DIR, 'zero-script-qa/SKILL.md'), 'zero-script-qa');
  }},
  { name: 'TC45-18: output-style-setup 스킬', fn: () => {
    assertExists(path.join(SKILLS_DIR, 'output-style-setup/SKILL.md'), 'output-style-setup');
  }}
];

module.exports = { tests };
