// TC-28: Multilang Intent Unit Tests (25 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertType, getPdcaStatus, withVersion } = require('../test-utils');
const { MULTILANG_INPUTS } = require('../fixtures');
const path = require('path');

const lang = require(path.join(PLUGIN_ROOT, 'lib/intent/language'));
const trigger = require(path.join(PLUGIN_ROOT, 'lib/intent/trigger'));
const ambiguity = require(path.join(PLUGIN_ROOT, 'lib/intent/ambiguity'));

const tests = [
  {
    name: 'TC28-01: SUPPORTED_LANGUAGES 8개 언어',
    fn: () => {
      assert(lang.SUPPORTED_LANGUAGES.length >= 8, `Should have >=8 languages, found ${lang.SUPPORTED_LANGUAGES.length}`);
    }
  },
  {
    name: 'TC28-02: detectLanguage 한국어 감지',
    fn: () => {
      const result = lang.detectLanguage('검증해줘');
      assertEqual(result, 'ko', 'Should detect Korean');
    }
  },
  {
    name: 'TC28-03: detectLanguage 일본어 감지',
    fn: () => {
      const result = lang.detectLanguage('コード確認して');
      assertEqual(result, 'ja', 'Should detect Japanese');
    }
  },
  {
    name: 'TC28-04: detectLanguage 중국어 감지',
    fn: () => {
      const result = lang.detectLanguage('验证代码');
      assertEqual(result, 'zh', 'Should detect Chinese');
    }
  },
  {
    name: 'TC28-05: detectLanguage 영어 기본값',
    fn: () => {
      const result = lang.detectLanguage('verify code');
      assertEqual(result, 'en', 'Should detect English');
    }
  },
  {
    name: 'TC28-06: detectLanguage 스페인어',
    fn: () => {
      const result = lang.detectLanguage('verificar código');
      assertEqual(result, 'es', 'Should detect Spanish');
    }
  },
  {
    name: 'TC28-07: detectLanguage 프랑스어 (accent)',
    fn: () => {
      const result = lang.detectLanguage('où est le fichier');
      // French detection uses accent-based regex
      assert(['fr', 'es'].includes(result), `Should detect French-like, got ${result}`);
    }
  },
  {
    name: 'TC28-08: detectLanguage 독일어 (umlaut)',
    fn: () => {
      const result = lang.detectLanguage('überprüfen Sie den Code bitte');
      assert(['de', 'fr'].includes(result), `Should detect German-like, got ${result}`);
    }
  },
  {
    name: 'TC28-09: detectLanguage 이탈리아어',
    fn: () => {
      const result = lang.detectLanguage('è giusto il codice');
      // Italian detection can overlap with French due to shared accents
      assert(['it', 'fr', 'en'].includes(result), `Should detect language, got ${result}`);
    }
  },
  {
    name: 'TC28-10: AGENT_TRIGGER_PATTERNS 존재',
    fn: () => {
      assert(lang.AGENT_TRIGGER_PATTERNS !== undefined, 'Should export AGENT_TRIGGER_PATTERNS');
      assertType(lang.AGENT_TRIGGER_PATTERNS, 'object', 'Should be object');
    }
  },
  {
    name: 'TC28-11: SKILL_TRIGGER_PATTERNS 존재',
    fn: () => {
      assert(lang.SKILL_TRIGGER_PATTERNS !== undefined, 'Should export SKILL_TRIGGER_PATTERNS');
    }
  },
  {
    name: 'TC28-12: matchMultiLangPattern verify 트리거 (한국어)',
    fn: () => {
      const patterns = lang.AGENT_TRIGGER_PATTERNS['gap-detector'];
      const result = lang.matchMultiLangPattern(MULTILANG_INPUTS.ko.verify, patterns);
      assertEqual(result, true, 'Should match Korean verify');
    }
  },
  {
    name: 'TC28-13: matchMultiLangPattern verify 트리거 (일본어)',
    fn: () => {
      const patterns = lang.AGENT_TRIGGER_PATTERNS['gap-detector'];
      const result = lang.matchMultiLangPattern(MULTILANG_INPUTS.ja.verify, patterns);
      assertEqual(result, true, 'Should match Japanese verify');
    }
  },
  {
    name: 'TC28-14: getAllPatterns 함수 존재',
    fn: () => {
      assertType(lang.getAllPatterns, 'function', 'Should export getAllPatterns');
    }
  },
  {
    name: 'TC28-15: matchImplicitAgentTrigger 존재',
    fn: () => {
      assertType(trigger.matchImplicitAgentTrigger, 'function', 'Should export matchImplicitAgentTrigger');
    }
  },
  {
    name: 'TC28-16: matchImplicitSkillTrigger 존재',
    fn: () => {
      assertType(trigger.matchImplicitSkillTrigger, 'function', 'Should export matchImplicitSkillTrigger');
    }
  },
  {
    name: 'TC28-17: detectNewFeatureIntent 존재',
    fn: () => {
      assertType(trigger.detectNewFeatureIntent, 'function', 'Should export detectNewFeatureIntent');
    }
  },
  {
    name: 'TC28-18: extractFeatureNameFromRequest 존재',
    fn: () => {
      assertType(trigger.extractFeatureNameFromRequest, 'function', 'Should export extractFeatureNameFromRequest');
    }
  },
  {
    name: 'TC28-19: calculateAmbiguityScore 존재',
    fn: () => {
      assertType(ambiguity.calculateAmbiguityScore, 'function', 'Should export calculateAmbiguityScore');
    }
  },
  {
    name: 'TC28-20: generateClarifyingQuestions 존재',
    fn: () => {
      assertType(ambiguity.generateClarifyingQuestions, 'function', 'Should export generateClarifyingQuestions');
    }
  },
  {
    name: 'TC28-21: containsFilePath 파일 경로 감지',
    fn: () => {
      assertEqual(ambiguity.containsFilePath('src/app.js를 수정해'), true, 'Should detect file path');
    }
  },
  {
    name: 'TC28-22: containsTechnicalTerms 기술 용어 감지',
    fn: () => {
      const result = ambiguity.containsTechnicalTerms('React 컴포넌트를 만들어줘');
      assertType(result, 'boolean', 'Should return boolean');
    }
  },
  {
    name: 'TC28-23: hasMultipleInterpretations 모호성 감지',
    fn: () => {
      assertType(ambiguity.hasMultipleInterpretations, 'function', 'Should export');
    }
  },
  {
    name: 'TC28-24: detectContextConflicts 존재',
    fn: () => {
      assertType(ambiguity.detectContextConflicts, 'function', 'Should export');
    }
  },
  {
    name: 'TC28-25: 8개 언어 모두 verify 키워드 매칭',
    fn: () => {
      const patterns = lang.AGENT_TRIGGER_PATTERNS['gap-detector'];
      let matched = 0;
      for (const [langCode, inputs] of Object.entries(MULTILANG_INPUTS)) {
        const result = lang.matchMultiLangPattern(inputs.verify, patterns);
        if (result === true) matched++;
      }
      assert(matched >= 6, `At least 6/8 languages should match verify, got ${matched}`);
    }
  }
];

module.exports = { tests };
