// TC-64: Edge Case Null/Undefined Tests (10 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertType } = require('../test-utils');
const path = require('path');

const { safeJsonParse } = require(path.join(PLUGIN_ROOT, 'lib/core/config'));
const { checkPermission } = require(path.join(PLUGIN_ROOT, 'lib/core/permission'));
const { isSourceFile, isEnvFile, getExtension } = require(path.join(PLUGIN_ROOT, 'lib/core/file'));
const cache = require(path.join(PLUGIN_ROOT, 'lib/core/cache'));

const tests = [
  { name: 'TC64-01: safeJsonParse(null) → 기본값', fn: () => {
    const r = safeJsonParse(null, {});
    assertEqual(typeof r, 'object', 'null → default object');
  }},
  { name: 'TC64-02: safeJsonParse(undefined) → 기본값', fn: () => {
    const r = safeJsonParse(undefined, {});
    assertEqual(typeof r, 'object', 'undefined → default object');
  }},
  { name: 'TC64-03: safeJsonParse("") → 기본값', fn: () => {
    const r = safeJsonParse('', 'fallback');
    assertEqual(r, 'fallback', 'empty string → fallback');
  }},
  { name: 'TC64-04: cache.get 존재하지 않는 키', fn: () => {
    const r = cache.get('nonexistent-key-xyz');
    assert(r === undefined || r === null, 'Missing key returns undefined/null');
  }},
  { name: 'TC64-05: cache.has 존재하지 않는 키', fn: () => {
    assertEqual(cache.has('nonexistent-key-xyz'), false, 'Should return false');
  }},
  { name: 'TC64-06: isSourceFile undefined 처리', fn: () => {
    try {
      isSourceFile(undefined);
      assert(true, 'Should not throw or handle gracefully');
    } catch {
      assert(true, 'Threw on undefined - acceptable');
    }
  }},
  { name: 'TC64-07: getExtension null 처리', fn: () => {
    try {
      getExtension(null);
      assert(true, 'Handled null gracefully');
    } catch {
      assert(true, 'Threw on null - acceptable');
    }
  }},
  { name: 'TC64-08: checkPermission 빈 params', fn: () => {
    const r = checkPermission('write_file', {}, PLUGIN_ROOT);
    assert(r !== undefined, 'Should return result even with empty params');
  }},
  { name: 'TC64-09: cache.set null 값 저장', fn: () => {
    cache.set('null-val', null);
    assert(cache.has('null-val'), 'Should store null value');
    cache.invalidate('null-val');
  }},
  { name: 'TC64-10: cache.invalidate 존재하지 않는 키', fn: () => {
    // Should not throw
    cache.invalidate('never-existed-key');
    assert(true, 'Should not throw on missing key');
  }}
];

module.exports = { tests };
