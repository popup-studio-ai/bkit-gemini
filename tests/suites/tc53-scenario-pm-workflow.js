// TC-53: Scenario PM Workflow Tests (10 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertType, assertExists, assertContains } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const tests = [
  { name: 'TC53-01: PM 에이전트 5개 존재', fn: () => {
    const pmAgents = ['pm-lead', 'pm-discovery', 'pm-strategy', 'pm-research', 'pm-prd'];
    for (const a of pmAgents) assertExists(path.join(PLUGIN_ROOT, `agents/${a}.md`), a);
  }},
  { name: 'TC53-02: pm-lead 오케스트레이션 키워드', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'agents/pm-lead.md'), 'utf-8');
    assertContains(content, 'pm', 'Should reference pm workflow');
  }},
  { name: 'TC53-03: pm-discovery OST 프레임워크', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'agents/pm-discovery.md'), 'utf-8');
    assert(content.length > 200, 'Should have substantial content');
  }},
  { name: 'TC53-04: pm-strategy JTBD/Lean Canvas', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'agents/pm-strategy.md'), 'utf-8');
    assert(content.length > 200, 'Should have substantial content');
  }},
  { name: 'TC53-05: pm-research 페르소나/경쟁사', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'agents/pm-research.md'), 'utf-8');
    assert(content.length > 200, 'Should have substantial content');
  }},
  { name: 'TC53-06: pm-prd PRD 생성', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'agents/pm-prd.md'), 'utf-8');
    assertContains(content, 'PRD', 'Should reference PRD');
  }},
  { name: 'TC53-07: pm-discovery 스킬 존재', fn: () => {
    assertExists(path.join(PLUGIN_ROOT, 'skills/pm-discovery/SKILL.md'), 'pm-discovery skill');
  }},
  { name: 'TC53-08: pm-discovery 커맨드 존재', fn: () => {
    assertExists(path.join(PLUGIN_ROOT, 'commands/pm-discovery.toml'), 'pm-discovery command');
  }},
  { name: 'TC53-09: pdca 스킬에 pm 액션', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'skills/pdca/SKILL.md'), 'utf-8');
    assertContains(content, 'pm', 'Should have pm action');
  }},
  { name: 'TC53-10: PM → Plan → Design 워크플로우 참조', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'skills/pdca/SKILL.md'), 'utf-8');
    assertContains(content, 'plan', 'Should reference plan after pm');
  }}
];

module.exports = { tests };
