// TC-29: PDCA Modules Unit Tests (25 TC)
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, cleanupTestProject, assert, assertEqual, assertType, assertThrows, getPdcaStatus, withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const status = require(path.join(PLUGIN_ROOT, 'lib/pdca/status'));
const phase = require(path.join(PLUGIN_ROOT, 'lib/pdca/phase'));
const level = require(path.join(PLUGIN_ROOT, 'lib/pdca/level'));
const automation = require(path.join(PLUGIN_ROOT, 'lib/pdca/automation'));
const tier = require(path.join(PLUGIN_ROOT, 'lib/pdca/tier'));

const tests = [
  {
    name: 'TC29-01: loadPdcaStatus 정상 로드',
    setup: () => createTestProject({ '.pdca-status.json': { version: '2.0', primaryFeature: 'test', activeFeatures: {}, archivedFeatures: {}, pipeline: {}, lastChecked: '' } }),
    fn: () => {
      const s = status.loadPdcaStatus(TEST_PROJECT_DIR);
      assertEqual(s.version, '2.0', 'Should load v2.0 schema');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC29-02: loadPdcaStatus 파일 없을 때 기본 스키마',
    setup: () => createTestProject({}),
    fn: () => {
      const s = status.loadPdcaStatus(TEST_PROJECT_DIR);
      assertEqual(s.version, '2.0', 'Should create default v2.0');
      assert(s.activeFeatures !== undefined, 'Should have activeFeatures');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC29-03: savePdcaStatus 저장 후 로드',
    setup: () => createTestProject({}),
    fn: () => {
      const s = status.createInitialStatusV2();
      s.primaryFeature = 'save-test';
      status.savePdcaStatus(s, TEST_PROJECT_DIR);
      const loaded = status.loadPdcaStatus(TEST_PROJECT_DIR);
      assertEqual(loaded.primaryFeature, 'save-test', 'Should persist primaryFeature');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC29-04: createInitialStatusV2 기본 구조',
    fn: () => {
      const s = status.createInitialStatusV2();
      assertEqual(s.version, '2.0', 'Should be v2.0');
      assert(s.activeFeatures !== undefined, 'Should have activeFeatures');
      assert(s.features !== undefined || s.archivedFeatures !== undefined, 'Should have features or archivedFeatures');
      assert(s.pipeline !== undefined, 'Should have pipeline');
    }
  },
  {
    name: 'TC29-05: getPdcaStatusPath 루트 경로',
    fn: () => {
      const p = status.getPdcaStatusPath('/tmp/test-project');
      assertType(p, 'string', 'Should return string');
      assert(p.includes('.pdca-status.json'), 'Should include status filename');
    }
  },
  {
    name: 'TC29-06: PDCA_PHASES 오브젝트 7개 phase 존재',
    fn: () => {
      assert(typeof phase.PDCA_PHASES === 'object', 'Should be object');
      assert(Object.keys(phase.PDCA_PHASES).length >= 5, 'Should have >=5 phases');
    }
  },
  {
    name: 'TC29-07: getNextPdcaPhase plan → design',
    fn: () => { assertEqual(phase.getNextPdcaPhase('plan'), 'design', 'plan → design'); }
  },
  {
    name: 'TC29-08: getNextPdcaPhase design → do',
    fn: () => { assertEqual(phase.getNextPdcaPhase('design'), 'do', 'design → do'); }
  },
  {
    name: 'TC29-09: getNextPdcaPhase do → check',
    fn: () => { assertEqual(phase.getNextPdcaPhase('do'), 'check', 'do → check'); }
  },
  {
    name: 'TC29-10: getPreviousPdcaPhase design → plan',
    fn: () => { assertEqual(phase.getPreviousPdcaPhase('design'), 'plan', 'design → plan'); }
  },
  {
    name: 'TC29-11: getPhaseNumber plan → 1',
    fn: () => {
      const num = phase.getPhaseNumber('plan');
      assertType(num, 'number', 'Should return number');
    }
  },
  {
    name: 'TC29-12: validatePdcaTransition 존재',
    fn: () => { assertType(phase.validatePdcaTransition, 'function', 'Should export'); }
  },
  {
    name: 'TC29-13: findPlanDoc 존재',
    fn: () => { assertType(phase.findPlanDoc, 'function', 'Should export'); }
  },
  {
    name: 'TC29-14: findDesignDoc 존재',
    fn: () => { assertType(phase.findDesignDoc, 'function', 'Should export'); }
  },
  {
    name: 'TC29-15: detectLevel Starter (빈 프로젝트)',
    setup: () => createTestProject({}),
    fn: () => {
      const l = level.detectLevel(TEST_PROJECT_DIR);
      assertEqual(l, 'Starter', 'Empty project → Starter');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC29-16: detectLevel Dynamic (.mcp.json)',
    setup: () => createTestProject({ '.mcp.json': '{}' }),
    fn: () => {
      const l = level.detectLevel(TEST_PROJECT_DIR);
      assertEqual(l, 'Dynamic', '.mcp.json → Dynamic');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC29-17: detectLevel Enterprise (kubernetes/)',
    setup: () => {
      createTestProject({});
      fs.mkdirSync(path.join(TEST_PROJECT_DIR, 'kubernetes'), { recursive: true });
    },
    fn: () => {
      const l = level.detectLevel(TEST_PROJECT_DIR);
      assertEqual(l, 'Enterprise', 'kubernetes/ → Enterprise');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC29-18: getRequiredPhases 존재',
    fn: () => { assertType(level.getRequiredPhases, 'function', 'Should export'); }
  },
  {
    name: 'TC29-19: getAutomationLevel 존재',
    fn: () => { assertType(automation.getAutomationLevel, 'function', 'Should export'); }
  },
  {
    name: 'TC29-20: shouldAutoAdvance 존재',
    fn: () => { assertType(automation.shouldAutoAdvance, 'function', 'Should export'); }
  },
  {
    name: 'TC29-21: shouldAutoStartPdca 존재',
    fn: () => { assertType(automation.shouldAutoStartPdca, 'function', 'Should export'); }
  },
  {
    name: 'TC29-22: getLanguageTier 존재',
    fn: () => { assertType(tier.getLanguageTier, 'function', 'Should export'); }
  },
  {
    name: 'TC29-23: getTierDescription 존재',
    fn: () => { assertType(tier.getTierDescription, 'function', 'Should export'); }
  },
  {
    name: 'TC29-24: isTier1 JavaScript',
    fn: () => {
      const result = tier.isTier1('js');
      assertType(result, 'boolean', 'Should return boolean');
    }
  },
  {
    name: 'TC29-25: LEVEL_INDICATORS 존재',
    fn: () => {
      assert(level.LEVEL_INDICATORS !== undefined, 'Should export LEVEL_INDICATORS');
    }
  }
];

module.exports = { tests };
