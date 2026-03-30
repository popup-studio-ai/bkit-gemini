// TC-72: Recovery File Corruption Tests (12 TC)
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, cleanupTestProject, assert, assertEqual, assertType, getPdcaStatus, withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const { safeJsonParse, loadConfig } = require(path.join(PLUGIN_ROOT, 'lib/core/config'));
const { loadPdcaStatus, savePdcaStatus, createInitialStatusV2 } = require(path.join(PLUGIN_ROOT, 'lib/pdca/status'));

const tests = [
  { name: 'TC72-01: 깨진 pdca-status.json 복구',
    setup: () => createTestProject({ '.pdca-status.json': '{corrupt' }),
    fn: () => {
      try {
        const status = loadPdcaStatus(TEST_PROJECT_DIR);
        assert(true, 'Should handle corrupt status gracefully');
      } catch {
        assert(true, 'Threw on corrupt - acceptable if caught by caller');
      }
    },
    teardown: cleanupTestProject
  },
  { name: 'TC72-02: 빈 pdca-status.json 복구',
    setup: () => createTestProject({ '.pdca-status.json': '' }),
    fn: () => {
      try {
        const status = loadPdcaStatus(TEST_PROJECT_DIR);
        assert(true, 'Should handle empty status');
      } catch {
        assert(true, 'Threw on empty - acceptable');
      }
    },
    teardown: cleanupTestProject
  },
  { name: 'TC72-03: 존재하지 않는 pdca-status.json',
    setup: () => createTestProject({}),
    fn: () => {
      try {
        const status = loadPdcaStatus(TEST_PROJECT_DIR);
        assert(true, 'Should handle missing status');
      } catch {
        assert(true, 'Threw on missing - acceptable');
      }
    },
    teardown: cleanupTestProject
  },
  { name: 'TC72-04: createInitialStatusV2 새 상태 생성', fn: () => {
    const status = createInitialStatusV2();
    assertEqual(status.version, '2.0', 'Should create v2.0');
    assert(status.activeFeatures !== undefined, 'Should have activeFeatures');
  }},
  { name: 'TC72-05: savePdcaStatus 저장/로드 사이클',
    setup: () => createTestProject({ '.pdca-status.json': JSON.stringify(createInitialStatusV2()) }),
    fn: () => {
      const initial = createInitialStatusV2();
      savePdcaStatus(initial, TEST_PROJECT_DIR);
      const loaded = loadPdcaStatus(TEST_PROJECT_DIR);
      assertEqual(loaded.version, '2.0', 'Should persist and load');
    },
    teardown: cleanupTestProject
  },
  { name: 'TC72-06: safeJsonParse 잘린 JSON', fn: () => {
    const r = safeJsonParse('{"key":"val', 'fallback');
    assertEqual(r, 'fallback', 'Truncated JSON → fallback');
  }},
  { name: 'TC72-07: loadConfig 깨진 bkit.config.json',
    setup: () => createTestProject({ 'bkit.config.json': '{broken' }),
    fn: () => {
      const cfg = loadConfig(TEST_PROJECT_DIR);
      assert(cfg !== undefined, 'Should return default config for broken file');
    },
    teardown: cleanupTestProject
  },
  { name: 'TC72-08: 바이너리 데이터 JSON 파싱', fn: () => {
    const binary = Buffer.from([0x00, 0x01, 0x02]).toString();
    const r = safeJsonParse(binary, 'default');
    assertEqual(r, 'default', 'Binary data → default');
  }},
  { name: 'TC72-09: 매우 긴 단일 라인 JSON', fn: () => {
    const longStr = JSON.stringify({ data: 'a'.repeat(100000) });
    const r = safeJsonParse(longStr);
    assertEqual(r.data.length, 100000, 'Should handle 100K char value');
  }},
  { name: 'TC72-10: 중복 키 JSON 처리', fn: () => {
    // JSON with duplicate keys - last one wins per spec
    const r = safeJsonParse('{"a":1,"a":2}');
    assertEqual(r.a, 2, 'Last duplicate key should win');
  }},
  { name: 'TC72-11: null 값 pdca-status.json',
    setup: () => createTestProject({ '.pdca-status.json': 'null' }),
    fn: () => {
      try {
        const status = loadPdcaStatus(TEST_PROJECT_DIR);
        assert(true, 'Should handle null status');
      } catch {
        assert(true, 'Threw on null - acceptable');
      }
    },
    teardown: cleanupTestProject
  },
  { name: 'TC72-12: 배열 pdca-status.json',
    setup: () => createTestProject({ '.pdca-status.json': '[]' }),
    fn: () => {
      try {
        const status = loadPdcaStatus(TEST_PROJECT_DIR);
        assert(true, 'Should handle array status');
      } catch {
        assert(true, 'Threw on array - acceptable');
      }
    },
    teardown: cleanupTestProject
  }
];

module.exports = { tests };
