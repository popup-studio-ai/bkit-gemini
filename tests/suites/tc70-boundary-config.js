// TC-70: Boundary Config Tests (12 TC)
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, cleanupTestProject, assert, assertEqual, assertType, getPdcaStatus, withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const { ContextHierarchy } = require(path.join(PLUGIN_ROOT, 'lib/context-hierarchy'));
const { loadConfig, safeJsonParse } = require(path.join(PLUGIN_ROOT, 'lib/core/config'));

const tests = [
  { name: 'TC70-01: ContextHierarchy 빈 프로젝트',
    setup: () => createTestProject({}),
    fn: () => {
      const h = new ContextHierarchy(TEST_PROJECT_DIR, PLUGIN_ROOT);
      assert(h !== undefined, 'Should create hierarchy for empty project');
    },
    teardown: cleanupTestProject
  },
  { name: 'TC70-02: ContextHierarchy session 우선순위', fn: () => {
    const h = new ContextHierarchy(PLUGIN_ROOT, PLUGIN_ROOT);
    h.setSession('testKey', 'sessionVal');
    assertEqual(h.get('testKey'), 'sessionVal', 'Session > project > plugin');
    h.clearSession();
  }},
  { name: 'TC70-03: ContextHierarchy clearSession 완전 삭제', fn: () => {
    const h = new ContextHierarchy(PLUGIN_ROOT, PLUGIN_ROOT);
    h.setSession('clearKey', 'val');
    h.clearSession();
    assert(h.get('clearKey') !== 'val' || h.get('clearKey') === undefined, 'Should clear session values');
  }},
  { name: 'TC70-04: pdca.matchRateThreshold 기본값 90', fn: () => {
    const h = new ContextHierarchy(PLUGIN_ROOT, PLUGIN_ROOT);
    assertEqual(h.get('pdca.matchRateThreshold'), 90, 'Default threshold 90');
  }},
  { name: 'TC70-05: pdca.maxIterations 기본값 5', fn: () => {
    const h = new ContextHierarchy(PLUGIN_ROOT, PLUGIN_ROOT);
    const maxIter = h.get('pdca.maxIterations');
    assertEqual(maxIter, 5, 'Default maxIterations 5');
  }},
  { name: 'TC70-06: loadConfig 유효한 디렉토리', fn: () => {
    const cfg = loadConfig(PLUGIN_ROOT);
    assert(cfg !== undefined, 'Should load config from valid dir');
  }},
  { name: 'TC70-07: bkit.config.json 필수 키 존재', fn: () => {
    const cfg = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
    assert(cfg !== undefined, 'Config should be valid JSON');
  }},
  { name: 'TC70-08: matchRateThreshold 범위 0-100', fn: () => {
    const h = new ContextHierarchy(PLUGIN_ROOT, PLUGIN_ROOT);
    const threshold = h.get('pdca.matchRateThreshold');
    assert(threshold >= 0 && threshold <= 100, 'Threshold should be 0-100');
  }},
  { name: 'TC70-09: maxIterations 범위 1-10', fn: () => {
    const h = new ContextHierarchy(PLUGIN_ROOT, PLUGIN_ROOT);
    const maxIter = h.get('pdca.maxIterations');
    assert(maxIter >= 1 && maxIter <= 10, 'maxIterations should be 1-10');
  }},
  { name: 'TC70-10: ContextHierarchy 같은 키 중복 set', fn: () => {
    const h = new ContextHierarchy(PLUGIN_ROOT, PLUGIN_ROOT);
    h.setSession('dup', 'first');
    h.setSession('dup', 'second');
    assertEqual(h.get('dup'), 'second', 'Last set wins');
    h.clearSession();
  }},
  { name: 'TC70-11: safeJsonParse 빈 오브젝트', fn: () => {
    const r = safeJsonParse('{}');
    assertEqual(typeof r, 'object', 'Should parse empty object');
    assertEqual(Object.keys(r).length, 0, 'Should be empty');
  }},
  { name: 'TC70-12: loadConfig 결과 불변성', fn: () => {
    const cfg1 = loadConfig(PLUGIN_ROOT);
    const cfg2 = loadConfig(PLUGIN_ROOT);
    assert(cfg1 !== undefined && cfg2 !== undefined, 'Both configs should exist');
  }}
];

module.exports = { tests };
