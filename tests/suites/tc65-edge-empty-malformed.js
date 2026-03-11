// TC-65: Edge Case Empty/Malformed Input Tests (12 TC)
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, createTestProjectV2,
        cleanupTestProject, assert, assertEqual, assertType } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const { safeJsonParse, loadConfig } = require(path.join(PLUGIN_ROOT, 'lib/core/config'));
const { detectLanguage, matchMultiLangPattern } = require(path.join(PLUGIN_ROOT, 'lib/intent/language'));
const { calculateAmbiguityScore } = require(path.join(PLUGIN_ROOT, 'lib/intent/ambiguity'));

const tests = [
  { name: 'TC65-01: safeJsonParse 잘못된 JSON 구문', fn: () => {
    const r = safeJsonParse('{invalid json}', 'default');
    assertEqual(r, 'default', 'Malformed JSON → default');
  }},
  { name: 'TC65-02: safeJsonParse 중첩 깨진 JSON', fn: () => {
    const r = safeJsonParse('{"a":{"b":}', null);
    assertEqual(r, null, 'Broken nested JSON → null');
  }},
  { name: 'TC65-03: detectLanguage 빈 문자열', fn: () => {
    const lang = detectLanguage('');
    assert(lang !== undefined, 'Should return a language for empty string');
  }},
  { name: 'TC65-04: detectLanguage 숫자만', fn: () => {
    const lang = detectLanguage('12345');
    assert(lang !== undefined, 'Should handle numeric-only input');
  }},
  { name: 'TC65-05: detectLanguage 특수문자만', fn: () => {
    const lang = detectLanguage('!@#$%^&*()');
    assert(lang !== undefined, 'Should handle special chars');
  }},
  { name: 'TC65-06: matchMultiLangPattern 빈 패턴', fn: () => {
    try {
      const r = matchMultiLangPattern('hello', 'nonexistent_pattern');
      assert(r === false || r === null || r === undefined, 'Should not match nonexistent pattern');
    } catch {
      assert(true, 'Threw on bad pattern - acceptable');
    }
  }},
  { name: 'TC65-07: calculateAmbiguityScore 빈 입력', fn: () => {
    const score = calculateAmbiguityScore('');
    assertType(score, 'number', 'Should return numeric score');
  }},
  { name: 'TC65-08: calculateAmbiguityScore 명확한 입력', fn: () => {
    const score = calculateAmbiguityScore('/pdca plan user-auth');
    assert(score >= 0, 'Score should be >= 0');
  }},
  { name: 'TC65-09: loadConfig 존재하지 않는 디렉토리',
    setup: () => createTestProject({}),
    fn: () => {
      const cfg = loadConfig('/nonexistent/path/xyz');
      assert(cfg !== undefined, 'Should return default config for missing dir');
    },
    teardown: cleanupTestProject
  },
  { name: 'TC65-10: safeJsonParse 매우 큰 JSON', fn: () => {
    const big = JSON.stringify({ data: 'x'.repeat(10000) });
    const r = safeJsonParse(big);
    assertEqual(r.data.length, 10000, 'Should parse large JSON');
  }},
  { name: 'TC65-11: detectLanguage 혼합 언어', fn: () => {
    const lang = detectLanguage('hello 안녕하세요');
    assert(lang !== undefined, 'Should detect a language for mixed input');
  }},
  { name: 'TC65-12: safeJsonParse 배열 JSON', fn: () => {
    const r = safeJsonParse('[1,2,3]');
    assert(Array.isArray(r), 'Should parse array JSON');
    assertEqual(r.length, 3, 'Should have 3 elements');
  }}
];

module.exports = { tests };
