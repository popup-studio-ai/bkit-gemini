// TC-74: Recovery Cache/State Tests (11 TC)
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProjectV2, cleanupTestProject,
        assert, assertEqual, assertType } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const cache = require(path.join(PLUGIN_ROOT, 'lib/core/cache'));
const { resetCache } = require(path.join(PLUGIN_ROOT, 'lib/gemini/version'));

const tests = [
  { name: 'TC74-01: cache clear 후 새 값 설정', fn: () => {
    cache.set('before', 'old');
    cache.clear();
    cache.set('after', 'new');
    assertEqual(cache.has('before'), false, 'Old value cleared');
    assertEqual(cache.get('after'), 'new', 'New value set');
    cache.clear();
  }},
  { name: 'TC74-02: version cache reset 후 재감지', fn: () => {
    resetCache();
    // After reset, next detectVersion should work fresh
    const vd = require(path.join(PLUGIN_ROOT, 'lib/gemini/version'));
    assertType(vd.detectVersion, 'function', 'Should still have detectVersion');
  }},
  { name: 'TC74-03: cache invalidate 특정 키만 삭제', fn: () => {
    cache.set('keep', 'yes');
    cache.set('remove', 'no');
    cache.invalidate('remove');
    assertEqual(cache.get('keep'), 'yes', 'Kept key intact');
    assertEqual(cache.has('remove'), false, 'Removed key gone');
    cache.clear();
  }},
  { name: 'TC74-04: cache set 동일 키 덮어쓰기', fn: () => {
    cache.set('key', 'v1');
    cache.set('key', 'v2');
    assertEqual(cache.get('key'), 'v2', 'Should overwrite');
    cache.clear();
  }},
  { name: 'TC74-05: cache 오브젝트 값 참조 보존', fn: () => {
    const obj = { nested: { value: 42 } };
    cache.set('obj', obj);
    const retrieved = cache.get('obj');
    assertEqual(retrieved.nested.value, 42, 'Should preserve nested object');
    cache.clear();
  }},
  { name: 'TC74-06: pdca-status 저장 후 즉시 로드',
    setup: () => createTestProjectV2({}),
    fn: () => {
      const { createInitialStatusV2, savePdcaStatus, loadPdcaStatus } = require(path.join(PLUGIN_ROOT, 'lib/pdca/status'));
      const status = createInitialStatusV2();
      status.features = { test: { phase: 'plan' } };
      savePdcaStatus(status, TEST_PROJECT_DIR);
      const loaded = loadPdcaStatus(TEST_PROJECT_DIR);
      assertEqual(loaded.features.test.phase, 'plan', 'Should persist immediately');
    },
    teardown: cleanupTestProject
  },
  { name: 'TC74-07: cache 배열 값 보존', fn: () => {
    cache.set('arr', [1, 2, 3]);
    const r = cache.get('arr');
    assert(Array.isArray(r), 'Should be array');
    assertEqual(r.length, 3, 'Should have 3 elements');
    cache.clear();
  }},
  { name: 'TC74-08: resetCache 여러 번 호출 안전', fn: () => {
    for (let i = 0; i < 10; i++) resetCache();
    assert(true, 'Multiple resetCache safe');
  }},
  { name: 'TC74-09: cache clear 후 has 모두 false', fn: () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    cache.clear();
    assert(!cache.has('a') && !cache.has('b') && !cache.has('c'), 'All cleared');
  }},
  { name: 'TC74-10: cache 숫자 0 값 저장', fn: () => {
    cache.set('zero', 0);
    assertEqual(cache.get('zero'), 0, 'Should store and retrieve 0');
    assertEqual(cache.has('zero'), true, 'Should detect 0 as existing');
    cache.clear();
  }},
  { name: 'TC74-11: cache false 값 저장', fn: () => {
    cache.set('false-val', false);
    assertEqual(cache.get('false-val'), false, 'Should store false');
    assertEqual(cache.has('false-val'), true, 'Should detect false as existing');
    cache.clear();
  }}
];

module.exports = { tests };
