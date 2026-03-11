// TC-39: PDCA E2E v1.5.8 Tests (18 TC)
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProjectV2, cleanupTestProject,
        assert, assertEqual, assertExists, assertType } = require('../test-utils');
const { PDCA_STATUS_V158, PDCA_STATUS_MULTI } = require('../fixtures');
const path = require('path');
const fs = require('fs');

const { loadPdcaStatus, savePdcaStatus } = require(path.join(PLUGIN_ROOT, 'lib/pdca/status'));
const { getPaths, ensureDirectories } = require(path.join(PLUGIN_ROOT, 'lib/core/paths'));
const { getNextPdcaPhase } = require(path.join(PLUGIN_ROOT, 'lib/pdca/phase'));

const tests = [
  {
    name: 'TC39-01: Plan→Design→Do→Check(100%)→Report 성공 경로',
    setup: () => createTestProjectV2({}),
    fn: () => {
      ensureDirectories(TEST_PROJECT_DIR);
      const s = loadPdcaStatus(TEST_PROJECT_DIR);
      s.primaryFeature = 'e2e-test';
      s.activeFeatures = { 'e2e-test': { phase: 'plan', matchRate: null, iterationCount: 0, lastUpdated: new Date().toISOString(), documents: {} } };
      savePdcaStatus(s, TEST_PROJECT_DIR);
      // Advance through phases
      for (const nextPhase of ['design', 'do', 'check']) {
        const cur = loadPdcaStatus(TEST_PROJECT_DIR);
        cur.activeFeatures['e2e-test'].phase = nextPhase;
        savePdcaStatus(cur, TEST_PROJECT_DIR);
      }
      const cur = loadPdcaStatus(TEST_PROJECT_DIR);
      cur.activeFeatures['e2e-test'].matchRate = 100;
      cur.activeFeatures['e2e-test'].phase = 'completed';
      cur.activeFeatures['e2e-test'].completedAt = new Date().toISOString();
      savePdcaStatus(cur, TEST_PROJECT_DIR);
      const final = loadPdcaStatus(TEST_PROJECT_DIR);
      assertEqual(final.activeFeatures['e2e-test'].phase, 'completed', 'Should complete');
      assertEqual(final.activeFeatures['e2e-test'].matchRate, 100, 'Should be 100%');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC39-02: Plan→Design→Do→Check(60%)→Act 반복 경로',
    setup: () => createTestProjectV2({}),
    fn: () => {
      const s = loadPdcaStatus(TEST_PROJECT_DIR);
      s.primaryFeature = 'iter-test';
      s.activeFeatures = { 'iter-test': { phase: 'check', matchRate: 60, iterationCount: 0, lastUpdated: new Date().toISOString(), documents: {} } };
      savePdcaStatus(s, TEST_PROJECT_DIR);
      // Simulate iteration
      const cur = loadPdcaStatus(TEST_PROJECT_DIR);
      cur.activeFeatures['iter-test'].iterationCount = 1;
      cur.activeFeatures['iter-test'].matchRate = 85;
      savePdcaStatus(cur, TEST_PROJECT_DIR);
      const loaded = loadPdcaStatus(TEST_PROJECT_DIR);
      assertEqual(loaded.activeFeatures['iter-test'].iterationCount, 1, 'Should increment');
      assertEqual(loaded.activeFeatures['iter-test'].matchRate, 85, 'Should update matchRate');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC39-03: 다중 Feature 동시 관리',
    setup: () => createTestProjectV2({ '.pdca-status.json': PDCA_STATUS_MULTI }),
    fn: () => {
      const s = loadPdcaStatus(TEST_PROJECT_DIR);
      assertEqual(Object.keys(s.activeFeatures).length, 3, 'Should have 3 features');
      assertEqual(s.primaryFeature, 'feature-a', 'Primary should be feature-a');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC39-04: primaryFeature 변경',
    setup: () => createTestProjectV2({ '.pdca-status.json': PDCA_STATUS_MULTI }),
    fn: () => {
      const s = loadPdcaStatus(TEST_PROJECT_DIR);
      s.primaryFeature = 'feature-b';
      savePdcaStatus(s, TEST_PROJECT_DIR);
      const loaded = loadPdcaStatus(TEST_PROJECT_DIR);
      assertEqual(loaded.primaryFeature, 'feature-b', 'Should change primary');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC39-05: archivedFeatures 이동',
    setup: () => createTestProjectV2({}),
    fn: () => {
      const s = loadPdcaStatus(TEST_PROJECT_DIR);
      s.activeFeatures = { 'done-f': { phase: 'completed', matchRate: 100, completedAt: new Date().toISOString() } };
      s.archivedFeatures = s.archivedFeatures || {};
      s.archivedFeatures['done-f'] = { phase: 'archived', matchRate: 100, archivedAt: new Date().toISOString() };
      delete s.activeFeatures['done-f'];
      savePdcaStatus(s, TEST_PROJECT_DIR);
      const loaded = loadPdcaStatus(TEST_PROJECT_DIR);
      assertEqual(loaded.archivedFeatures['done-f'].phase, 'archived', 'Should archive');
      assertEqual(loaded.activeFeatures['done-f'], undefined, 'Should remove from active');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC39-06: Plan 문서 경로 기록',
    setup: () => createTestProjectV2({}),
    fn: () => {
      ensureDirectories(TEST_PROJECT_DIR);
      const s = loadPdcaStatus(TEST_PROJECT_DIR);
      s.activeFeatures = { 'doc-test': { phase: 'plan', matchRate: null, documents: { plan: 'docs/01-plan/features/doc-test.plan.md' } } };
      savePdcaStatus(s, TEST_PROJECT_DIR);
      const loaded = loadPdcaStatus(TEST_PROJECT_DIR);
      assertEqual(loaded.activeFeatures['doc-test'].documents.plan, 'docs/01-plan/features/doc-test.plan.md', 'Should store plan path');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC39-07: Design 문서 경로 추가',
    setup: () => createTestProjectV2({ '.pdca-status.json': PDCA_STATUS_V158 }),
    fn: () => {
      const s = loadPdcaStatus(TEST_PROJECT_DIR);
      s.activeFeatures['test-feature'].documents.design = 'docs/02-design/features/test-feature.design.md';
      s.activeFeatures['test-feature'].phase = 'design';
      savePdcaStatus(s, TEST_PROJECT_DIR);
      const loaded = loadPdcaStatus(TEST_PROJECT_DIR);
      assert(loaded.activeFeatures['test-feature'].documents.design !== undefined, 'Should have design doc');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC39-08: pipeline.level 저장',
    setup: () => createTestProjectV2({}),
    fn: () => {
      const s = loadPdcaStatus(TEST_PROJECT_DIR);
      s.pipeline = { level: 'Enterprise', currentPhase: 5, phaseHistory: [] };
      savePdcaStatus(s, TEST_PROJECT_DIR);
      const loaded = loadPdcaStatus(TEST_PROJECT_DIR);
      assertEqual(loaded.pipeline.level, 'Enterprise', 'Should save level');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC39-09: getNextPdcaPhase 전체 체인',
    fn: () => {
      assertEqual(getNextPdcaPhase('plan'), 'design', 'plan→design');
      assertEqual(getNextPdcaPhase('design'), 'do', 'design→do');
      assertEqual(getNextPdcaPhase('do'), 'check', 'do→check');
    }
  },
  {
    name: 'TC39-10: 빈 상태에서 시작',
    setup: () => createTestProjectV2({}),
    fn: () => {
      const s = loadPdcaStatus(TEST_PROJECT_DIR);
      assertEqual(s.primaryFeature, null, 'Should have null primary');
      assertEqual(Object.keys(s.activeFeatures || {}).length, 0, 'Should have no features');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC39-11: matchRate null → 숫자 전환',
    setup: () => createTestProjectV2({ '.pdca-status.json': PDCA_STATUS_V158 }),
    fn: () => {
      const s = loadPdcaStatus(TEST_PROJECT_DIR);
      assertEqual(s.activeFeatures['test-feature'].matchRate, null, 'Should start null');
      s.activeFeatures['test-feature'].matchRate = 75;
      savePdcaStatus(s, TEST_PROJECT_DIR);
      const loaded = loadPdcaStatus(TEST_PROJECT_DIR);
      assertEqual(loaded.activeFeatures['test-feature'].matchRate, 75, 'Should be 75');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC39-12: iterationCount 증가',
    setup: () => createTestProjectV2({ '.pdca-status.json': PDCA_STATUS_V158 }),
    fn: () => {
      const s = loadPdcaStatus(TEST_PROJECT_DIR);
      s.activeFeatures['test-feature'].iterationCount = 3;
      savePdcaStatus(s, TEST_PROJECT_DIR);
      const loaded = loadPdcaStatus(TEST_PROJECT_DIR);
      assertEqual(loaded.activeFeatures['test-feature'].iterationCount, 3, 'Should be 3');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC39-13: lastChecked 타임스탬프 갱신',
    setup: () => createTestProjectV2({}),
    fn: () => {
      const s = loadPdcaStatus(TEST_PROJECT_DIR);
      s.lastChecked = new Date().toISOString();
      savePdcaStatus(s, TEST_PROJECT_DIR);
      const loaded = loadPdcaStatus(TEST_PROJECT_DIR);
      assert(loaded.lastChecked !== '', 'Should have timestamp');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC39-14: version 2.0 스키마 유지',
    setup: () => createTestProjectV2({}),
    fn: () => {
      const s = loadPdcaStatus(TEST_PROJECT_DIR);
      assertEqual(s.version, '2.0', 'Should always be 2.0');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC39-15: 동시 Feature 5개 이상',
    setup: () => createTestProjectV2({}),
    fn: () => {
      const s = loadPdcaStatus(TEST_PROJECT_DIR);
      s.activeFeatures = {};
      for (let i = 0; i < 5; i++) {
        s.activeFeatures[`feat-${i}`] = { phase: 'plan', matchRate: null };
      }
      savePdcaStatus(s, TEST_PROJECT_DIR);
      const loaded = loadPdcaStatus(TEST_PROJECT_DIR);
      assertEqual(Object.keys(loaded.activeFeatures).length, 5, 'Should have 5 features');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC39-16: ensureDirectories 모든 PDCA 디렉토리',
    setup: () => createTestProjectV2({}),
    fn: () => {
      ensureDirectories(TEST_PROJECT_DIR);
      const paths = getPaths(TEST_PROJECT_DIR);
      assertExists(paths.stateDir, 'stateDir');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC39-17: completedAt 타임스탬프',
    setup: () => createTestProjectV2({}),
    fn: () => {
      const s = loadPdcaStatus(TEST_PROJECT_DIR);
      s.activeFeatures = { 'x': { phase: 'completed', matchRate: 100, completedAt: '2026-03-11T00:00:00Z' } };
      savePdcaStatus(s, TEST_PROJECT_DIR);
      const loaded = loadPdcaStatus(TEST_PROJECT_DIR);
      assertEqual(loaded.activeFeatures['x'].completedAt, '2026-03-11T00:00:00Z', 'Should save completedAt');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC39-18: documents 객체 확장 (analysis, report)',
    setup: () => createTestProjectV2({ '.pdca-status.json': PDCA_STATUS_V158 }),
    fn: () => {
      const s = loadPdcaStatus(TEST_PROJECT_DIR);
      s.activeFeatures['test-feature'].documents.analysis = 'docs/03-analysis/test-feature.analysis.md';
      s.activeFeatures['test-feature'].documents.report = 'docs/04-report/features/test-feature.report.md';
      savePdcaStatus(s, TEST_PROJECT_DIR);
      const loaded = loadPdcaStatus(TEST_PROJECT_DIR);
      assert(loaded.activeFeatures['test-feature'].documents.analysis !== undefined, 'Should have analysis');
      assert(loaded.activeFeatures['test-feature'].documents.report !== undefined, 'Should have report');
    },
    teardown: cleanupTestProject
  }
];

module.exports = { tests };
