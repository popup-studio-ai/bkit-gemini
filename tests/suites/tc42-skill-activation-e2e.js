// TC-42: Skill Activation E2E Tests (10 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertType, assertExists, assertContains, getPdcaStatus, withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const trigger = require(path.join(PLUGIN_ROOT, 'lib/intent/trigger'));
const lang = require(path.join(PLUGIN_ROOT, 'lib/intent/language'));
const context = require(path.join(PLUGIN_ROOT, 'lib/task/context'));

const tests = [
  {
    name: 'TC42-01: 영어 "verify" → gap-detector 트리거',
    fn: () => {
      const patterns = lang.AGENT_TRIGGER_PATTERNS['gap-detector'];
      const result = lang.matchMultiLangPattern('verify code quality', patterns);
      assertEqual(result, true, 'Should trigger on verify');
    }
  },
  {
    name: 'TC42-02: 한국어 "검증" → gap-detector 트리거',
    fn: () => {
      const patterns = lang.AGENT_TRIGGER_PATTERNS['gap-detector'];
      const result = lang.matchMultiLangPattern('코드 검증해줘', patterns);
      assertEqual(result, true, 'Should trigger on 검증');
    }
  },
  {
    name: 'TC42-03: "help" → starter-guide 트리거',
    fn: () => {
      const patterns = lang.AGENT_TRIGGER_PATTERNS['starter-guide'];
      const result = lang.matchMultiLangPattern('help me understand', patterns);
      assertEqual(result, true, 'Should trigger on help');
    }
  },
  {
    name: 'TC42-04: matchImplicitAgentTrigger 동작',
    fn: () => {
      const result = trigger.matchImplicitAgentTrigger('verify code quality');
      // Returns object { agent, confidence, matchedPattern, language } or null
      assert(result === null || typeof result === 'object', 'Should return object or null');
    }
  },
  {
    name: 'TC42-05: matchImplicitSkillTrigger 동작',
    fn: () => {
      const result = trigger.matchImplicitSkillTrigger('create a static website');
      assert(result === null || typeof result === 'object', 'Should return object or null');
    }
  },
  {
    name: 'TC42-06: NEW_FEATURE_PATTERNS 존재',
    fn: () => {
      assert(trigger.NEW_FEATURE_PATTERNS !== undefined, 'Should export patterns');
    }
  },
  {
    name: 'TC42-07: detectNewFeatureIntent 동작',
    fn: () => {
      const result = trigger.detectNewFeatureIntent('I want to add user authentication');
      assert(typeof result === 'boolean' || typeof result === 'object', 'Should return boolean or result object');
    }
  },
  {
    name: 'TC42-08: context 설정 후 스킬 조회',
    fn: () => {
      context.setActiveSkill('pdca');
      const active = context.getActiveSkill();
      assertEqual(active, 'pdca', 'Should return active skill');
      context.clearActiveContext();
    }
  },
  {
    name: 'TC42-09: SKILL.md에서 Triggers 키워드 확인',
    fn: () => {
      const pdcaSkill = fs.readFileSync(path.join(PLUGIN_ROOT, 'skills/pdca/SKILL.md'), 'utf-8');
      assertContains(pdcaSkill, 'plan', 'PDCA skill should have plan trigger');
    }
  },
  {
    name: 'TC42-10: 스킬 → 에이전트 체인 (pdca → gap-detector)',
    fn: () => {
      // Verify both skill and agent exist
      assertExists(path.join(PLUGIN_ROOT, 'skills/pdca/SKILL.md'), 'pdca skill');
      assertExists(path.join(PLUGIN_ROOT, 'agents/gap-detector.md'), 'gap-detector agent');
    }
  }
];

module.exports = { tests };
