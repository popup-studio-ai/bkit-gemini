// TC-71: Boundary Data Size Tests (11 TC)
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, cleanupTestProject, assert, assertEqual, assertType, getPdcaStatus, withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const { safeJsonParse } = require(path.join(PLUGIN_ROOT, 'lib/core/config'));
const cache = require(path.join(PLUGIN_ROOT, 'lib/core/cache'));

const tests = [
  { name: 'TC71-01: safeJsonParse 1 바이트 JSON', fn: () => {
    const r = safeJsonParse('1');
    assertEqual(r, 1, 'Should parse single number');
  }},
  { name: 'TC71-02: safeJsonParse 빈 배열', fn: () => {
    const r = safeJsonParse('[]');
    assert(Array.isArray(r), 'Should parse empty array');
    assertEqual(r.length, 0, 'Should be empty');
  }},
  { name: 'TC71-03: safeJsonParse 깊은 중첩 (10레벨)', fn: () => {
    let json = '{"a":';
    for (let i = 0; i < 9; i++) json += '{"a":';
    json += '1';
    for (let i = 0; i < 10; i++) json += '}';
    const r = safeJsonParse(json);
    assert(r !== undefined, 'Should parse 10-level nested JSON');
  }},
  { name: 'TC71-04: cache 빈 문자열 키', fn: () => {
    cache.set('', 'empty-key');
    const r = cache.get('');
    assertEqual(r, 'empty-key', 'Should handle empty string key');
    cache.invalidate('');
  }},
  { name: 'TC71-05: cache 매우 긴 키', fn: () => {
    const longKey = 'k'.repeat(1000);
    cache.set(longKey, 'long-key-value');
    assertEqual(cache.get(longKey), 'long-key-value', 'Should handle long key');
    cache.invalidate(longKey);
  }},
  { name: 'TC71-06: cache 큰 값 저장', fn: () => {
    const bigValue = { data: 'x'.repeat(50000) };
    cache.set('big-value', bigValue);
    assertEqual(cache.get('big-value').data.length, 50000, 'Should store large value');
    cache.invalidate('big-value');
  }},
  { name: 'TC71-07: JSON 파일 0 바이트',
    setup: () => createTestProject({ 'zero.json': '' }),
    fn: () => {
      const content = fs.readFileSync(path.join(TEST_PROJECT_DIR, 'zero.json'), 'utf-8');
      assertEqual(content.length, 0, 'Should handle 0-byte file');
    },
    teardown: cleanupTestProject
  },
  { name: 'TC71-08: JSON 파일 정확히 1KB',
    setup: () => createTestProject({}),
    fn: () => {
      const content = JSON.stringify({ data: 'x'.repeat(1024 - 12) });
      fs.writeFileSync(path.join(TEST_PROJECT_DIR, '1kb.json'), content);
      const read = JSON.parse(fs.readFileSync(path.join(TEST_PROJECT_DIR, '1kb.json'), 'utf-8'));
      assert(read.data.length > 0, 'Should handle 1KB JSON');
    },
    teardown: cleanupTestProject
  },
  { name: 'TC71-09: safeJsonParse boolean', fn: () => {
    assertEqual(safeJsonParse('true'), true, 'Should parse true');
    assertEqual(safeJsonParse('false'), false, 'Should parse false');
  }},
  { name: 'TC71-10: safeJsonParse null literal', fn: () => {
    assertEqual(safeJsonParse('null'), null, 'Should parse null literal');
  }},
  { name: 'TC71-11: 100개 키 JSON 파싱', fn: () => {
    const obj = {};
    for (let i = 0; i < 100; i++) obj[`key${i}`] = i;
    const r = safeJsonParse(JSON.stringify(obj));
    assertEqual(Object.keys(r).length, 100, 'Should parse 100-key object');
  }}
];

module.exports = { tests };
