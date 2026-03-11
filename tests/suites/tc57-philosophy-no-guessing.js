// TC-57: Philosophy No Guessing Tests (10 TC)
const { PLUGIN_ROOT, assert, assertContains, assertExists, assertType } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const tests = [
  { name: 'TC57-01: ask 패턴 PDCA 스킬', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'skills/pdca/SKILL.md'), 'utf-8');
    assert(content.includes('ask') || content.includes('AskUserQuestion'), 'Should reference ask pattern');
  }},
  { name: 'TC57-02: session-start MANDATORY AskUserQuestion', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks/scripts/session-start.js'), 'utf-8');
    assertContains(content, 'AskUserQuestion', 'Should mandate user question');
  }},
  { name: 'TC57-03: ambiguity 감지 모듈 존재', fn: () => {
    const { calculateAmbiguityScore } = require(path.join(PLUGIN_ROOT, 'lib/intent/ambiguity'));
    assertType(calculateAmbiguityScore, 'function', 'Should detect ambiguity');
  }},
  { name: 'TC57-04: clarifying questions 생성 모듈', fn: () => {
    const { generateClarifyingQuestions } = require(path.join(PLUGIN_ROOT, 'lib/intent/ambiguity'));
    assertType(generateClarifyingQuestions, 'function', 'Should generate questions');
  }},
  { name: 'TC57-05: AI is not perfect 경고문', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks/scripts/session-start.js'), 'utf-8');
    assertContains(content, 'AI is not perfect', 'Should warn about AI limitations');
  }},
  { name: 'TC57-06: 리턴 유저 선택지 제공', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks/scripts/session-start.js'), 'utf-8');
    assertContains(content, 'Actions by selection', 'Should offer choices');
  }},
  { name: 'TC57-07: 신규 유저 선택지 제공', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks/scripts/session-start.js'), 'utf-8');
    assertContains(content, 'Welcome', 'Should welcome new users');
  }},
  { name: 'TC57-08: permission deny 패턴', fn: () => {
    const { checkPermission } = require(path.join(PLUGIN_ROOT, 'lib/core/permission'));
    const result = checkPermission('run_shell_command', { command: 'rm -rf /' }, PLUGIN_ROOT);
    // In PLUGIN_ROOT with Policy Engine, defers to engine; deny patterns exist in module
    assert(result.level === 'deny' || result.reason === 'Deferred to Policy Engine', 'Should deny or defer to Policy Engine');
  }},
  { name: 'TC57-09: PDCA phase validation', fn: () => {
    const { validatePdcaTransition } = require(path.join(PLUGIN_ROOT, 'lib/pdca/phase'));
    assertType(validatePdcaTransition, 'function', 'Should validate transitions');
  }},
  { name: 'TC57-10: 컨텍스트 기반 판단 (ContextHierarchy)', fn: () => {
    const { ContextHierarchy } = require(path.join(PLUGIN_ROOT, 'lib/context-hierarchy'));
    const h = new ContextHierarchy(PLUGIN_ROOT, PLUGIN_ROOT);
    const config = h.get();
    assert(config !== undefined, 'Should base decisions on context, not guessing');
  }}
];

module.exports = { tests };
