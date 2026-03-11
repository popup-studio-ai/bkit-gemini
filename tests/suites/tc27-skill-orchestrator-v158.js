// TC-27: Skill Orchestrator v1.5.8 Unit Tests (20 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertContains, assertExists } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const SKILLS_DIR = path.join(PLUGIN_ROOT, 'skills');

const tests = [
  {
    name: 'TC27-01: skills/ 디렉토리 존재',
    fn: () => { assertExists(SKILLS_DIR, 'skills/ directory should exist'); }
  },
  {
    name: 'TC27-02: 35개 스킬 디렉토리 존재',
    fn: () => {
      const dirs = fs.readdirSync(SKILLS_DIR).filter(f => fs.statSync(path.join(SKILLS_DIR, f)).isDirectory());
      assert(dirs.length >= 35, `Should have >=35 skill dirs, found ${dirs.length}`);
    }
  },
  {
    name: 'TC27-03: 모든 스킬에 SKILL.md 존재',
    fn: () => {
      const dirs = fs.readdirSync(SKILLS_DIR).filter(f => fs.statSync(path.join(SKILLS_DIR, f)).isDirectory());
      let missing = [];
      for (const d of dirs) {
        if (!fs.existsSync(path.join(SKILLS_DIR, d, 'SKILL.md'))) missing.push(d);
      }
      assertEqual(missing.length, 0, `Missing SKILL.md in: ${missing.join(', ')}`);
    }
  },
  {
    name: 'TC27-04: pdca 스킬 SKILL.md 필수 섹션',
    fn: () => {
      const content = fs.readFileSync(path.join(SKILLS_DIR, 'pdca', 'SKILL.md'), 'utf-8');
      assertContains(content, 'plan', 'Should have plan action');
      assertContains(content, 'design', 'Should have design action');
    }
  },
  {
    name: 'TC27-05: starter 스킬 존재',
    fn: () => { assertExists(path.join(SKILLS_DIR, 'starter', 'SKILL.md'), 'starter SKILL.md'); }
  },
  {
    name: 'TC27-06: dynamic 스킬 존재',
    fn: () => { assertExists(path.join(SKILLS_DIR, 'dynamic', 'SKILL.md'), 'dynamic SKILL.md'); }
  },
  {
    name: 'TC27-07: enterprise 스킬 존재',
    fn: () => { assertExists(path.join(SKILLS_DIR, 'enterprise', 'SKILL.md'), 'enterprise SKILL.md'); }
  },
  {
    name: 'TC27-08: bkend 스킬 8개 확인',
    fn: () => {
      const bkendSkills = ['bkend-auth', 'bkend-cookbook', 'bkend-data', 'bkend-guides', 'bkend-mcp', 'bkend-quickstart', 'bkend-security', 'bkend-storage'];
      for (const s of bkendSkills) {
        assertExists(path.join(SKILLS_DIR, s, 'SKILL.md'), `${s} should exist`);
      }
    }
  },
  {
    name: 'TC27-09: phase 스킬 9개 확인',
    fn: () => {
      for (let i = 1; i <= 9; i++) {
        const name = `phase-${i}-${['schema','convention','mockup','api','design-system','ui-integration','seo-security','review','deployment'][i-1]}`;
        assertExists(path.join(SKILLS_DIR, name, 'SKILL.md'), `${name} should exist`);
      }
    }
  },
  {
    name: 'TC27-10: development-pipeline 스킬 존재',
    fn: () => { assertExists(path.join(SKILLS_DIR, 'development-pipeline', 'SKILL.md'), 'development-pipeline'); }
  },
  {
    name: 'TC27-11: code-review 스킬 존재',
    fn: () => { assertExists(path.join(SKILLS_DIR, 'code-review', 'SKILL.md'), 'code-review'); }
  },
  {
    name: 'TC27-12: zero-script-qa 스킬 존재',
    fn: () => { assertExists(path.join(SKILLS_DIR, 'zero-script-qa', 'SKILL.md'), 'zero-script-qa'); }
  },
  {
    name: 'TC27-13: plan-plus 스킬 존재',
    fn: () => { assertExists(path.join(SKILLS_DIR, 'plan-plus', 'SKILL.md'), 'plan-plus'); }
  },
  {
    name: 'TC27-14: mobile-app 스킬 존재',
    fn: () => { assertExists(path.join(SKILLS_DIR, 'mobile-app', 'SKILL.md'), 'mobile-app'); }
  },
  {
    name: 'TC27-15: desktop-app 스킬 존재',
    fn: () => { assertExists(path.join(SKILLS_DIR, 'desktop-app', 'SKILL.md'), 'desktop-app'); }
  },
  {
    name: 'TC27-16: SKILL.md 최소 크기 > 100 bytes',
    fn: () => {
      const dirs = fs.readdirSync(SKILLS_DIR).filter(f => fs.statSync(path.join(SKILLS_DIR, f)).isDirectory());
      let tooSmall = [];
      for (const d of dirs) {
        const p = path.join(SKILLS_DIR, d, 'SKILL.md');
        if (fs.existsSync(p) && fs.statSync(p).size < 100) tooSmall.push(d);
      }
      assertEqual(tooSmall.length, 0, `Skills with tiny SKILL.md: ${tooSmall.join(', ')}`);
    }
  },
  {
    name: 'TC27-17: bkit-rules 스킬 PDCA 키워드',
    fn: () => {
      const content = fs.readFileSync(path.join(SKILLS_DIR, 'bkit-rules', 'SKILL.md'), 'utf-8');
      assertContains(content, 'PDCA', 'bkit-rules should reference PDCA');
    }
  },
  {
    name: 'TC27-18: bkit-templates 스킬 template 키워드',
    fn: () => {
      const content = fs.readFileSync(path.join(SKILLS_DIR, 'bkit-templates', 'SKILL.md'), 'utf-8');
      assertContains(content, 'template', 'bkit-templates should reference template');
    }
  },
  {
    name: 'TC27-19: loop 스킬 존재',
    fn: () => { assertExists(path.join(SKILLS_DIR, 'loop', 'SKILL.md'), 'loop'); }
  },
  {
    name: 'TC27-20: simplify 스킬 존재',
    fn: () => { assertExists(path.join(SKILLS_DIR, 'simplify', 'SKILL.md'), 'simplify'); }
  }
];

module.exports = { tests };
