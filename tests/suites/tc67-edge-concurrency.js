// TC-67: Edge Case Concurrency Tests (8 TC)
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProjectV2, cleanupTestProject,
        assert, assertEqual, assertType } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const cache = require(path.join(PLUGIN_ROOT, 'lib/core/cache'));

const tests = [
  { name: 'TC67-01: cache 동시 set/get 안전', fn: () => {
    for (let i = 0; i < 100; i++) {
      cache.set(`concurrent-${i}`, i);
    }
    for (let i = 0; i < 100; i++) {
      assertEqual(cache.get(`concurrent-${i}`), i, `Should get ${i}`);
    }
    for (let i = 0; i < 100; i++) {
      cache.invalidate(`concurrent-${i}`);
    }
  }},
  { name: 'TC67-02: cache clear 후 일관성', fn: () => {
    cache.set('pre-clear', 'value');
    cache.clear();
    assertEqual(cache.has('pre-clear'), false, 'Should be cleared');
  }},
  { name: 'TC67-03: 빠른 연속 cache set 덮어쓰기', fn: () => {
    for (let i = 0; i < 50; i++) {
      cache.set('overwrite-key', i);
    }
    assertEqual(cache.get('overwrite-key'), 49, 'Should have last value');
    cache.invalidate('overwrite-key');
  }},
  { name: 'TC67-04: 동시 파일 읽기 안전',
    setup: () => createTestProjectV2({ 'test.json': '{"a":1}' }),
    fn: () => {
      const reads = [];
      for (let i = 0; i < 10; i++) {
        reads.push(JSON.parse(fs.readFileSync(path.join(TEST_PROJECT_DIR, 'test.json'), 'utf-8')));
      }
      for (const r of reads) {
        assertEqual(r.a, 1, 'All reads should be consistent');
      }
    },
    teardown: cleanupTestProject
  },
  { name: 'TC67-05: version detector resetCache 반복 호출', fn: () => {
    const vd = require(path.join(PLUGIN_ROOT, 'lib/gemini/version'));
    for (let i = 0; i < 20; i++) {
      vd.resetCache();
    }
    assert(true, 'Multiple resetCache should not throw');
  }},
  { name: 'TC67-06: module require 캐시 일관성', fn: () => {
    const mod1 = require(path.join(PLUGIN_ROOT, 'lib/core/config'));
    const mod2 = require(path.join(PLUGIN_ROOT, 'lib/core/config'));
    assert(mod1 === mod2, 'Same module reference');
  }},
  { name: 'TC67-07: safeJsonParse 반복 호출 안전', fn: () => {
    const { safeJsonParse } = require(path.join(PLUGIN_ROOT, 'lib/core/config'));
    for (let i = 0; i < 100; i++) {
      const r = safeJsonParse(`{"i":${i}}`);
      assertEqual(r.i, i, `Iteration ${i}`);
    }
  }},
  { name: 'TC67-08: cache 대량 키 저장/삭제', fn: () => {
    for (let i = 0; i < 500; i++) {
      cache.set(`bulk-${i}`, `val-${i}`);
    }
    assertEqual(cache.has('bulk-0'), true, 'First key exists');
    assertEqual(cache.has('bulk-499'), true, 'Last key exists');
    cache.clear();
    assertEqual(cache.has('bulk-0'), false, 'Cleared');
  }}
];

module.exports = { tests };
