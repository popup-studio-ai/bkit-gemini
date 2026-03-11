// TC-55: Philosophy Context Engineering Tests (12 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertContains, assertExists } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const tests = [
  { name: 'TC55-01: GEMINI.md 존재 및 크기', fn: () => { const stat = fs.statSync(path.join(PLUGIN_ROOT, 'GEMINI.md')); assert(stat.size > 500, 'GEMINI.md should be substantial'); } },
  { name: 'TC55-02: context 파일 계층 구조', fn: () => { assertExists(path.join(PLUGIN_ROOT, '.gemini'), '.gemini dir'); } },
  { name: 'TC55-03: bkit.config.json 컨텍스트 소스', fn: () => { assertExists(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'config'); } },
  { name: 'TC55-04: hooks가 컨텍스트 주입', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks/scripts/session-start.js'), 'utf-8');
    assertContains(content, 'context', 'session-start should generate context');
  }},
  { name: 'TC55-05: 에이전트 전용 컨텍스트 (frontmatter)', fn: () => {
    const agentContent = fs.readFileSync(path.join(PLUGIN_ROOT, 'agents/gap-detector.md'), 'utf-8');
    assert(agentContent.startsWith('---'), 'Agent should have frontmatter');
  }},
  { name: 'TC55-06: 스킬 전용 컨텍스트 (SKILL.md)', fn: () => {
    const skillContent = fs.readFileSync(path.join(PLUGIN_ROOT, 'skills/pdca/SKILL.md'), 'utf-8');
    assert(skillContent.length > 500, 'Skill should have substantial context');
  }},
  { name: 'TC55-07: output-style 컨텍스트 계층', fn: () => {
    const styles = fs.readdirSync(path.join(PLUGIN_ROOT, 'output-styles')).filter(f => f.endsWith('.md'));
    assert(styles.length >= 4, 'Should have 4+ output styles as context');
  }},
  { name: 'TC55-08: template 컨텍스트 계층', fn: () => {
    const templates = fs.readdirSync(path.join(PLUGIN_ROOT, 'templates')).filter(f => f.endsWith('.md'));
    assert(templates.length >= 10, 'Should have 10+ templates as context');
  }},
  { name: 'TC55-09: import-resolver 컨텍스트 합성', fn: () => {
    const { resolveImports } = require(path.join(PLUGIN_ROOT, 'lib/adapters/gemini/import-resolver'));
    assert(typeof resolveImports === 'function', 'Should support context composition');
  }},
  { name: 'TC55-10: ContextHierarchy 3레벨 우선순위', fn: () => {
    const { ContextHierarchy } = require(path.join(PLUGIN_ROOT, 'lib/context-hierarchy'));
    const h = new ContextHierarchy(PLUGIN_ROOT, PLUGIN_ROOT);
    h.setSession('test', 'session');
    assertEqual(h.get('test'), 'session', 'Session > project > plugin');
    h.clearSession();
  }},
  { name: 'TC55-11: PDCA 규칙 session-start 주입', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks/scripts/session-start.js'), 'utf-8');
    assertContains(content, 'buildCoreRules', 'Should inject PDCA core rules');
  }},
  { name: 'TC55-12: 에이전트 트리거 session-start 주입', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks/scripts/session-start.js'), 'utf-8');
    assertContains(content, 'buildAgentTriggersSection', 'Should inject agent triggers');
  }}
];

module.exports = { tests };
