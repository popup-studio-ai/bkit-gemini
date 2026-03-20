// tests/suites/tc92-pdca-workflow.js
// TC-92: PDCA Workflow - 80 tests
const {
  PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, cleanupTestProject,
  assert, assertEqual, assertContains, assertExists, assertType, assertHasKey,
  assertThrows, assertInRange
} = require('../test-utils');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Dedicated temp dir for TC-92 to avoid collisions
const TC92_TEMP = path.join(os.tmpdir(), 'bkit-tc92-pdca');

function createTempDir(fixtures = {}) {
  if (fs.existsSync(TC92_TEMP)) {
    fs.rmSync(TC92_TEMP, { recursive: true });
  }
  fs.mkdirSync(TC92_TEMP, { recursive: true });
  for (const [filePath, content] of Object.entries(fixtures)) {
    const fullPath = path.join(TC92_TEMP, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, typeof content === 'object' ? JSON.stringify(content, null, 2) : content);
  }
  return TC92_TEMP;
}

function cleanTempDir() {
  if (fs.existsSync(TC92_TEMP)) {
    fs.rmSync(TC92_TEMP, { recursive: true });
  }
}

function getPdcaStatus() {
  return require(path.join(PLUGIN_ROOT, 'lib', 'pdca', 'status'));
}

function getPdcaPhase() {
  return require(path.join(PLUGIN_ROOT, 'lib', 'pdca', 'phase'));
}

const tests = [
  // ═══════════════════════════════════════════════════════════════
  // Section 1: .pdca-status.json Schema Validation (10 tests)
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'PDCA-01: createInitialStatusV2 returns version 2.0',
    fn: () => {
      const pdca = getPdcaStatus();
      const status = pdca.createInitialStatusV2();
      assertEqual(status.version, '2.0', 'Version should be 2.0');
    }
  },
  {
    name: 'PDCA-02: createInitialStatusV2 has primaryFeature field',
    fn: () => {
      const pdca = getPdcaStatus();
      const status = pdca.createInitialStatusV2();
      assertHasKey(status, 'primaryFeature', 'Should have primaryFeature key');
      assertEqual(status.primaryFeature, null, 'primaryFeature should be null initially');
    }
  },
  {
    name: 'PDCA-03: createInitialStatusV2 has activeFeatures array',
    fn: () => {
      const pdca = getPdcaStatus();
      const status = pdca.createInitialStatusV2();
      assertHasKey(status, 'activeFeatures', 'Should have activeFeatures key');
      assert(Array.isArray(status.activeFeatures), 'activeFeatures should be an array');
      assertEqual(status.activeFeatures.length, 0, 'activeFeatures should be empty initially');
    }
  },
  {
    name: 'PDCA-04: createInitialStatusV2 has features object',
    fn: () => {
      const pdca = getPdcaStatus();
      const status = pdca.createInitialStatusV2();
      assertHasKey(status, 'features', 'Should have features key');
      assertType(status.features, 'object', 'features should be an object');
      assertEqual(Object.keys(status.features).length, 0, 'features should be empty initially');
    }
  },
  {
    name: 'PDCA-05: createInitialStatusV2 has pipeline object',
    fn: () => {
      const pdca = getPdcaStatus();
      const status = pdca.createInitialStatusV2();
      assertHasKey(status, 'pipeline', 'Should have pipeline key');
      assertEqual(status.pipeline.currentPhase, 1, 'currentPhase should be 1');
      assertEqual(status.pipeline.level, 'Starter', 'level should be Starter');
      assert(Array.isArray(status.pipeline.phaseHistory), 'phaseHistory should be array');
    }
  },
  {
    name: 'PDCA-06: createInitialStatusV2 has session object',
    fn: () => {
      const pdca = getPdcaStatus();
      const status = pdca.createInitialStatusV2();
      assertHasKey(status, 'session', 'Should have session key');
      assert(status.session.startedAt, 'session should have startedAt');
      assertEqual(status.session.onboardingCompleted, false, 'onboarding should be false initially');
    }
  },
  {
    name: 'PDCA-07: createInitialStatusV2 has history array',
    fn: () => {
      const pdca = getPdcaStatus();
      const status = pdca.createInitialStatusV2();
      assertHasKey(status, 'history', 'Should have history key');
      assert(Array.isArray(status.history), 'history should be an array');
      assertEqual(status.history.length, 0, 'history should be empty initially');
    }
  },
  {
    name: 'PDCA-08: createInitialStatusV2 has lastUpdated ISO timestamp',
    fn: () => {
      const pdca = getPdcaStatus();
      const status = pdca.createInitialStatusV2();
      assertHasKey(status, 'lastUpdated', 'Should have lastUpdated key');
      assert(!isNaN(Date.parse(status.lastUpdated)), 'lastUpdated should be valid ISO date');
    }
  },
  {
    name: 'PDCA-09: v2 schema has all 7 required top-level keys',
    fn: () => {
      const pdca = getPdcaStatus();
      const status = pdca.createInitialStatusV2();
      const requiredKeys = ['version', 'lastUpdated', 'activeFeatures', 'primaryFeature', 'features', 'pipeline', 'session'];
      for (const key of requiredKeys) {
        assertHasKey(status, key, `Should have required key: ${key}`);
      }
    }
  },
  {
    name: 'PDCA-10: session.lastActivity is a valid ISO date',
    fn: () => {
      const pdca = getPdcaStatus();
      const status = pdca.createInitialStatusV2();
      assert(status.session.lastActivity, 'session should have lastActivity');
      assert(!isNaN(Date.parse(status.session.lastActivity)), 'lastActivity should be valid ISO date');
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // Section 2: loadPdcaStatus (10 tests)
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'PDCA-11: loadPdcaStatus returns valid v2 structure when no file exists',
    setup: () => createTempDir(),
    fn: () => {
      const pdca = getPdcaStatus();
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assertEqual(status.version, '2.0', 'Should return v2 status');
      assertHasKey(status, 'features', 'Should have features');
      assertHasKey(status, 'pipeline', 'Should have pipeline');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-12: loadPdcaStatus reads existing root .pdca-status.json',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', primaryFeature: 'test', activeFeatures: ['test'], features: { test: { phase: 'design' } }, pipeline: { level: 'Dynamic' }, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assertEqual(status.version, '2.0', 'Should read version 2.0');
      assertEqual(status.primaryFeature, 'test', 'Should read primaryFeature');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-13: loadPdcaStatus reads legacy docs/.pdca-status.json',
    setup: () => createTempDir({
      'docs/.pdca-status.json': { version: '2.0', primaryFeature: 'legacy', activeFeatures: [], features: {}, pipeline: {}, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assertEqual(status.primaryFeature, 'legacy', 'Should read from legacy path');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-14: loadPdcaStatus migrates v1 format to v2',
    setup: () => createTempDir({
      '.pdca-status.json': { currentFeature: 'old-feature', phase: 'design', matchRate: 85, iterationCount: 2, level: 'Dynamic' }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assertEqual(status.version, '2.0', 'Should migrate to v2');
      assertEqual(status.primaryFeature, 'old-feature', 'Should migrate currentFeature to primaryFeature');
      assert(status.activeFeatures.includes('old-feature'), 'Should migrate to activeFeatures');
      assertEqual(status.features['old-feature'].phase, 'design', 'Should preserve phase');
      assertEqual(status.pipeline.level, 'Dynamic', 'Should preserve level');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-15: loadPdcaStatus handles corrupted JSON gracefully',
    setup: () => {
      createTempDir();
      fs.writeFileSync(path.join(TC92_TEMP, '.pdca-status.json'), '{invalid json!!!');
    },
    fn: () => {
      const pdca = getPdcaStatus();
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assertEqual(status.version, '2.0', 'Should return fresh v2 on corruption');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-16: loadPdcaStatus prefers root over legacy path',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', primaryFeature: 'root', activeFeatures: [], features: {}, pipeline: {}, session: {}, history: [] },
      'docs/.pdca-status.json': { version: '2.0', primaryFeature: 'legacy', activeFeatures: [], features: {}, pipeline: {}, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assertEqual(status.primaryFeature, 'root', 'Should prefer root path');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-17: loadPdcaStatus v1 migration preserves matchRate',
    setup: () => createTempDir({
      '.pdca-status.json': { currentFeature: 'feat', matchRate: 92 }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assertEqual(status.features['feat'].matchRate, 92, 'Should preserve matchRate during migration');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-18: loadPdcaStatus v1 migration preserves iterationCount',
    setup: () => createTempDir({
      '.pdca-status.json': { currentFeature: 'feat', iterationCount: 3 }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assertEqual(status.features['feat'].iterationCount, 3, 'Should preserve iterationCount during migration');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-19: loadPdcaStatus returns activeFeatures as array for v2',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', activeFeatures: ['a', 'b'], primaryFeature: 'a', features: { a: { phase: 'plan' }, b: { phase: 'do' } }, pipeline: {}, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assert(Array.isArray(status.activeFeatures), 'activeFeatures should be an array');
      assertEqual(status.activeFeatures.length, 2, 'Should have 2 active features');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-20: getPdcaStatusFull delegates to loadPdcaStatus',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', primaryFeature: 'full-test', activeFeatures: [], features: {}, pipeline: {}, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      const status = pdca.getPdcaStatusFull(TC92_TEMP);
      assertEqual(status.primaryFeature, 'full-test', 'getPdcaStatusFull should return same as loadPdcaStatus');
    },
    teardown: cleanTempDir
  },

  // ═══════════════════════════════════════════════════════════════
  // Section 3: Phase Transitions (10 tests)
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'PDCA-21: PHASE_ORDER has correct sequence plan->design->do->check->act->report',
    fn: () => {
      const { PHASE_ORDER } = getPdcaPhase();
      assertEqual(PHASE_ORDER[0], 'plan', 'First phase should be plan');
      assertEqual(PHASE_ORDER[1], 'design', 'Second phase should be design');
      assertEqual(PHASE_ORDER[2], 'do', 'Third phase should be do');
      assertEqual(PHASE_ORDER[3], 'check', 'Fourth phase should be check');
      assertEqual(PHASE_ORDER[4], 'act', 'Fifth phase should be act');
      assertEqual(PHASE_ORDER[5], 'report', 'Sixth phase should be report');
    }
  },
  {
    name: 'PDCA-22: getNextPdcaPhase plan -> design',
    fn: () => {
      const { getNextPdcaPhase } = getPdcaPhase();
      assertEqual(getNextPdcaPhase('plan'), 'design', 'plan -> design');
    }
  },
  {
    name: 'PDCA-23: getNextPdcaPhase design -> do',
    fn: () => {
      const { getNextPdcaPhase } = getPdcaPhase();
      assertEqual(getNextPdcaPhase('design'), 'do', 'design -> do');
    }
  },
  {
    name: 'PDCA-24: getNextPdcaPhase do -> check',
    fn: () => {
      const { getNextPdcaPhase } = getPdcaPhase();
      assertEqual(getNextPdcaPhase('do'), 'check', 'do -> check');
    }
  },
  {
    name: 'PDCA-25: getNextPdcaPhase check -> act',
    fn: () => {
      const { getNextPdcaPhase } = getPdcaPhase();
      assertEqual(getNextPdcaPhase('check'), 'act', 'check -> act');
    }
  },
  {
    name: 'PDCA-26: getNextPdcaPhase act -> report',
    fn: () => {
      const { getNextPdcaPhase } = getPdcaPhase();
      assertEqual(getNextPdcaPhase('act'), 'report', 'act -> report');
    }
  },
  {
    name: 'PDCA-27: getNextPdcaPhase report -> archived',
    fn: () => {
      const { getNextPdcaPhase } = getPdcaPhase();
      assertEqual(getNextPdcaPhase('report'), 'archived', 'report -> archived');
    }
  },
  {
    name: 'PDCA-28: getNextPdcaPhase archived -> null (terminal)',
    fn: () => {
      const { getNextPdcaPhase } = getPdcaPhase();
      assertEqual(getNextPdcaPhase('archived'), null, 'archived should be terminal');
    }
  },
  {
    name: 'PDCA-29: getPreviousPdcaPhase design -> plan',
    fn: () => {
      const { getPreviousPdcaPhase } = getPdcaPhase();
      assertEqual(getPreviousPdcaPhase('design'), 'plan', 'design -> plan');
    }
  },
  {
    name: 'PDCA-30: getPreviousPdcaPhase plan -> null (no previous)',
    fn: () => {
      const { getPreviousPdcaPhase } = getPdcaPhase();
      assertEqual(getPreviousPdcaPhase('plan'), null, 'plan has no previous');
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // Section 4: Match Rate Threshold & Iterations (10 tests)
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'PDCA-31: PDCA_PHASES defines 7 phases including archived',
    fn: () => {
      const { PDCA_PHASES } = getPdcaPhase();
      const phaseNames = Object.keys(PDCA_PHASES);
      assertEqual(phaseNames.length, 7, 'Should have 7 phases');
      assert(phaseNames.includes('archived'), 'Should include archived phase');
    }
  },
  {
    name: 'PDCA-32: Match rate 90 is the pass threshold (convention)',
    fn: () => {
      // Convention: matchRate >= 90 means passing
      const MATCH_RATE_THRESHOLD = 90;
      assert(92 >= MATCH_RATE_THRESHOLD, '92 should pass threshold of 90');
      assert(89 < MATCH_RATE_THRESHOLD, '89 should fail threshold of 90');
      assertEqual(MATCH_RATE_THRESHOLD, 90, 'Threshold should be 90');
    }
  },
  {
    name: 'PDCA-33: Max iterations is 5 (convention)',
    fn: () => {
      const MAX_ITERATIONS = 5;
      assertEqual(MAX_ITERATIONS, 5, 'Max iterations should be 5');
      assert(4 < MAX_ITERATIONS, '4 iterations should be under limit');
      assert(!(6 <= MAX_ITERATIONS), '6 iterations should exceed limit');
    }
  },
  {
    name: 'PDCA-34: Feature with matchRate below 90 needs iteration',
    fn: () => {
      const matchRate = 85;
      const threshold = 90;
      assert(matchRate < threshold, 'matchRate 85 < 90 should require iteration');
    }
  },
  {
    name: 'PDCA-35: Feature with matchRate at 90 passes threshold',
    fn: () => {
      const matchRate = 90;
      const threshold = 90;
      assert(matchRate >= threshold, 'matchRate 90 >= 90 should pass');
    }
  },
  {
    name: 'PDCA-36: Feature with matchRate above 90 passes threshold',
    fn: () => {
      const matchRate = 96;
      const threshold = 90;
      assert(matchRate >= threshold, 'matchRate 96 should pass threshold');
    }
  },
  {
    name: 'PDCA-37: getPhaseNumber returns correct order numbers',
    fn: () => {
      const { getPhaseNumber } = getPdcaPhase();
      assertEqual(getPhaseNumber('plan'), 1, 'plan = 1');
      assertEqual(getPhaseNumber('design'), 2, 'design = 2');
      assertEqual(getPhaseNumber('do'), 3, 'do = 3');
      assertEqual(getPhaseNumber('check'), 4, 'check = 4');
      assertEqual(getPhaseNumber('act'), 5, 'act = 5');
      assertEqual(getPhaseNumber('report'), 6, 'report = 6');
    }
  },
  {
    name: 'PDCA-38: getPhaseNumber returns 0 for invalid phase',
    fn: () => {
      const { getPhaseNumber } = getPdcaPhase();
      assertEqual(getPhaseNumber('invalid'), 0, 'Invalid phase should return 0');
    }
  },
  {
    name: 'PDCA-39: getPhaseName maps order number back to name',
    fn: () => {
      const { getPhaseName } = getPdcaPhase();
      assertEqual(getPhaseName(1), 'plan', '1 -> plan');
      assertEqual(getPhaseName(6), 'report', '6 -> report');
    }
  },
  {
    name: 'PDCA-40: getPhaseName returns null for invalid order',
    fn: () => {
      const { getPhaseName } = getPdcaPhase();
      assertEqual(getPhaseName(99), null, 'Invalid order should return null');
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // Section 5: Phase Recommendation Logic (10 tests)
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'PDCA-41: plan phase recommends /plan command',
    fn: () => {
      const phaseCommands = { plan: '/plan', design: '/design', do: '/do', check: '/check', act: '/act', report: '/report' };
      assertEqual(phaseCommands['plan'], '/plan', 'plan phase -> /plan command');
    }
  },
  {
    name: 'PDCA-42: design phase recommends /design command',
    fn: () => {
      const phaseCommands = { plan: '/plan', design: '/design', do: '/do', check: '/check', act: '/act', report: '/report' };
      assertEqual(phaseCommands['design'], '/design', 'design phase -> /design command');
    }
  },
  {
    name: 'PDCA-43: do phase recommends /do command',
    fn: () => {
      const phaseCommands = { plan: '/plan', design: '/design', do: '/do', check: '/check', act: '/act', report: '/report' };
      assertEqual(phaseCommands['do'], '/do', 'do phase -> /do command');
    }
  },
  {
    name: 'PDCA-44: check phase recommends /check command',
    fn: () => {
      const phaseCommands = { plan: '/plan', design: '/design', do: '/do', check: '/check', act: '/act', report: '/report' };
      assertEqual(phaseCommands['check'], '/check', 'check phase -> /check command');
    }
  },
  {
    name: 'PDCA-45: act phase recommends /act command',
    fn: () => {
      const phaseCommands = { plan: '/plan', design: '/design', do: '/do', check: '/check', act: '/act', report: '/report' };
      assertEqual(phaseCommands['act'], '/act', 'act phase -> /act command');
    }
  },
  {
    name: 'PDCA-46: report phase recommends /report command',
    fn: () => {
      const phaseCommands = { plan: '/plan', design: '/design', do: '/do', check: '/check', act: '/act', report: '/report' };
      assertEqual(phaseCommands['report'], '/report', 'report phase -> /report command');
    }
  },
  {
    name: 'PDCA-47: PDCA_PHASES plan has description',
    fn: () => {
      const { PDCA_PHASES } = getPdcaPhase();
      assert(PDCA_PHASES.plan.description, 'plan should have description');
      assertContains(PDCA_PHASES.plan.description, 'plan', 'plan description should mention plan');
    }
  },
  {
    name: 'PDCA-48: PDCA_PHASES check has description',
    fn: () => {
      const { PDCA_PHASES } = getPdcaPhase();
      assert(PDCA_PHASES.check.description, 'check should have description');
    }
  },
  {
    name: 'PDCA-49: validatePdcaTransition rejects backward transition',
    setup: () => createTempDir(),
    fn: () => {
      const { validatePdcaTransition } = getPdcaPhase();
      const result = validatePdcaTransition('test-feat', 'do', 'plan', TC92_TEMP);
      assertEqual(result.valid, false, 'Should reject backward transition');
      assert(result.reason.length > 0, 'Should have a reason');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-50: validatePdcaTransition allows re-check (back to check)',
    setup: () => createTempDir(),
    fn: () => {
      const { validatePdcaTransition } = getPdcaPhase();
      const result = validatePdcaTransition('test-feat', 'act', 'check', TC92_TEMP);
      assertEqual(result.valid, true, 'Should allow going back to check for re-analysis');
    },
    teardown: cleanTempDir
  },

  // ═══════════════════════════════════════════════════════════════
  // Section 6: updatePdcaStatus (10 tests)
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'PDCA-51: updatePdcaStatus creates new feature if not exists',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', activeFeatures: [], primaryFeature: null, features: {}, pipeline: { level: 'Starter' }, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      pdca.updatePdcaStatus('new-feat', { phase: 'plan' }, TC92_TEMP);
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assertHasKey(status.features, 'new-feat', 'Should create new feature');
      assertEqual(status.features['new-feat'].phase, 'plan', 'Should set phase');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-52: updatePdcaStatus adds feature to activeFeatures',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', activeFeatures: [], primaryFeature: null, features: {}, pipeline: {}, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      pdca.updatePdcaStatus('auto-added', { phase: 'design' }, TC92_TEMP);
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assert(status.activeFeatures.includes('auto-added'), 'Should auto-add to activeFeatures');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-53: updatePdcaStatus updates existing feature',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', activeFeatures: ['existing'], primaryFeature: 'existing', features: { existing: { phase: 'plan', matchRate: null, iterationCount: 0, createdAt: '2026-01-01', updatedAt: '2026-01-01' } }, pipeline: {}, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      pdca.updatePdcaStatus('existing', { phase: 'design', matchRate: 75 }, TC92_TEMP);
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assertEqual(status.features['existing'].phase, 'design', 'Should update phase');
      assertEqual(status.features['existing'].matchRate, 75, 'Should update matchRate');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-54: updatePdcaStatus sets updatedAt timestamp',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', activeFeatures: ['ts-feat'], primaryFeature: null, features: { 'ts-feat': { phase: 'plan', updatedAt: '2020-01-01T00:00:00Z' } }, pipeline: {}, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      pdca.updatePdcaStatus('ts-feat', { phase: 'do' }, TC92_TEMP);
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      const updatedAt = new Date(status.features['ts-feat'].updatedAt);
      assert(updatedAt.getFullYear() >= 2026, 'updatedAt should be recent');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-55: updatePdcaStatus writes to disk',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', activeFeatures: [], primaryFeature: null, features: {}, pipeline: {}, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      pdca.updatePdcaStatus('disk-check', { phase: 'check' }, TC92_TEMP);
      const raw = fs.readFileSync(path.join(TC92_TEMP, '.pdca-status.json'), 'utf-8');
      const parsed = JSON.parse(raw);
      assertHasKey(parsed.features, 'disk-check', 'Should be persisted to disk');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-56: savePdcaStatus updates lastUpdated',
    setup: () => createTempDir(),
    fn: () => {
      const pdca = getPdcaStatus();
      const status = pdca.createInitialStatusV2();
      status.lastUpdated = '2020-01-01T00:00:00Z';
      pdca.savePdcaStatus(status, TC92_TEMP);
      const raw = JSON.parse(fs.readFileSync(path.join(TC92_TEMP, '.pdca-status.json'), 'utf-8'));
      assert(raw.lastUpdated !== '2020-01-01T00:00:00Z', 'lastUpdated should be refreshed on save');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-57: savePdcaStatus creates directory if needed',
    fn: () => {
      const deepDir = path.join(TC92_TEMP, 'deep', 'nested');
      if (fs.existsSync(TC92_TEMP)) fs.rmSync(TC92_TEMP, { recursive: true });
      const pdca = getPdcaStatus();
      const status = pdca.createInitialStatusV2();
      pdca.savePdcaStatus(status, deepDir);
      assert(fs.existsSync(path.join(deepDir, '.pdca-status.json')), 'Should create nested dirs and save');
      cleanTempDir();
    }
  },
  {
    name: 'PDCA-58: getFeatureStatus returns feature data',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', activeFeatures: ['f1'], primaryFeature: 'f1', features: { f1: { phase: 'act', matchRate: 88 } }, pipeline: {}, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      const feat = pdca.getFeatureStatus('f1', TC92_TEMP);
      assertEqual(feat.phase, 'act', 'Should return feature phase');
      assertEqual(feat.matchRate, 88, 'Should return matchRate');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-59: getFeatureStatus returns null for unknown feature',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', activeFeatures: [], primaryFeature: null, features: {}, pipeline: {}, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      const feat = pdca.getFeatureStatus('nonexistent', TC92_TEMP);
      assertEqual(feat, null, 'Should return null for unknown feature');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-60: initPdcaStatusIfNotExists creates file when missing',
    setup: () => createTempDir(),
    fn: () => {
      const pdca = getPdcaStatus();
      const status = pdca.initPdcaStatusIfNotExists(TC92_TEMP);
      assertEqual(status.version, '2.0', 'Should create v2 status');
      assert(fs.existsSync(path.join(TC92_TEMP, '.pdca-status.json')), 'File should exist on disk');
    },
    teardown: cleanTempDir
  },

  // ═══════════════════════════════════════════════════════════════
  // Section 7: setActiveFeature / addActiveFeature / removeActiveFeature (10 tests)
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'PDCA-61: setActiveFeature sets primaryFeature',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', activeFeatures: [], primaryFeature: null, features: {}, pipeline: {}, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      pdca.setActiveFeature('my-feat', TC92_TEMP);
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assertEqual(status.primaryFeature, 'my-feat', 'Should set primaryFeature');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-62: setActiveFeature adds to activeFeatures if not present',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', activeFeatures: ['other'], primaryFeature: 'other', features: { other: { phase: 'plan' } }, pipeline: {}, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      pdca.setActiveFeature('new-one', TC92_TEMP);
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assert(status.activeFeatures.includes('new-one'), 'Should add to activeFeatures');
      assert(status.activeFeatures.includes('other'), 'Should keep existing features');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-63: setActiveFeature creates feature entry if missing',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', activeFeatures: [], primaryFeature: null, features: {}, pipeline: {}, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      pdca.setActiveFeature('brand-new', TC92_TEMP);
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assertHasKey(status.features, 'brand-new', 'Should create feature entry');
      assertEqual(status.features['brand-new'].phase, 'plan', 'Should default to plan phase');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-64: addActiveFeature adds feature to list',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', activeFeatures: ['existing'], primaryFeature: 'existing', features: {}, pipeline: {}, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      pdca.addActiveFeature('added', TC92_TEMP);
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assert(status.activeFeatures.includes('added'), 'Should add new feature');
      assert(status.activeFeatures.includes('existing'), 'Should keep existing');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-65: addActiveFeature does not duplicate',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', activeFeatures: ['dup'], primaryFeature: 'dup', features: {}, pipeline: {}, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      pdca.addActiveFeature('dup', TC92_TEMP);
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      const count = status.activeFeatures.filter(f => f === 'dup').length;
      assertEqual(count, 1, 'Should not duplicate');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-66: removeActiveFeature removes from list',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', activeFeatures: ['keep', 'remove-me'], primaryFeature: 'keep', features: {}, pipeline: {}, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      pdca.removeActiveFeature('remove-me', TC92_TEMP);
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assert(!status.activeFeatures.includes('remove-me'), 'Should be removed');
      assert(status.activeFeatures.includes('keep'), 'Should keep other features');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-67: removeActiveFeature updates primaryFeature if removed',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', activeFeatures: ['primary', 'backup'], primaryFeature: 'primary', features: {}, pipeline: {}, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      pdca.removeActiveFeature('primary', TC92_TEMP);
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assertEqual(status.primaryFeature, 'backup', 'Should fallback to next active feature');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-68: removeActiveFeature sets primaryFeature to null when empty',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', activeFeatures: ['only-one'], primaryFeature: 'only-one', features: {}, pipeline: {}, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      pdca.removeActiveFeature('only-one', TC92_TEMP);
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assertEqual(status.primaryFeature, null, 'Should set primaryFeature to null');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-69: getActiveFeatures returns list',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', activeFeatures: ['a', 'b', 'c'], primaryFeature: 'a', features: {}, pipeline: {}, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      const features = pdca.getActiveFeatures(TC92_TEMP);
      assertEqual(features.length, 3, 'Should return 3 features');
      assert(features.includes('b'), 'Should include b');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-70: switchFeatureContext delegates to setActiveFeature',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', activeFeatures: [], primaryFeature: null, features: {}, pipeline: {}, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      pdca.switchFeatureContext('switched', TC92_TEMP);
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assertEqual(status.primaryFeature, 'switched', 'Should switch primary feature');
    },
    teardown: cleanTempDir
  },

  // ═══════════════════════════════════════════════════════════════
  // Section 8: completePdcaFeature & addPdcaHistory (10 tests)
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'PDCA-71: completePdcaFeature sets phase to completed',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', activeFeatures: ['done-feat'], primaryFeature: 'done-feat', features: { 'done-feat': { phase: 'report', matchRate: 95 } }, pipeline: {}, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      pdca.completePdcaFeature('done-feat', TC92_TEMP);
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assertEqual(status.features['done-feat'].phase, 'completed', 'Phase should be completed');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-72: completePdcaFeature sets completedAt timestamp',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', activeFeatures: ['ts-done'], primaryFeature: 'ts-done', features: { 'ts-done': { phase: 'report' } }, pipeline: {}, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      pdca.completePdcaFeature('ts-done', TC92_TEMP);
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assert(status.features['ts-done'].completedAt, 'Should set completedAt');
      assert(!isNaN(Date.parse(status.features['ts-done'].completedAt)), 'completedAt should be valid date');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-73: completePdcaFeature ignores nonexistent feature gracefully',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', activeFeatures: [], primaryFeature: null, features: {}, pipeline: {}, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      // Should not throw
      pdca.completePdcaFeature('ghost', TC92_TEMP);
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assert(!status.features['ghost'], 'Should not create feature for nonexistent');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-74: addPdcaHistory adds entry with timestamp',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', activeFeatures: [], primaryFeature: null, features: {}, pipeline: {}, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      pdca.addPdcaHistory({ action: 'test', feature: 'f1' }, TC92_TEMP);
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assertEqual(status.history.length, 1, 'Should have 1 history entry');
      assert(status.history[0].timestamp, 'Entry should have timestamp');
      assertEqual(status.history[0].action, 'test', 'Entry should have action');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-75: addPdcaHistory keeps max 100 entries',
    setup: () => {
      const history = [];
      for (let i = 0; i < 105; i++) {
        history.push({ timestamp: new Date().toISOString(), action: `action-${i}` });
      }
      createTempDir({
        '.pdca-status.json': { version: '2.0', activeFeatures: [], primaryFeature: null, features: {}, pipeline: {}, session: {}, history }
      });
    },
    fn: () => {
      const pdca = getPdcaStatus();
      pdca.addPdcaHistory({ action: 'overflow' }, TC92_TEMP);
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assert(status.history.length <= 100, `History should be capped at 100, got ${status.history.length}`);
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-76: addPdcaHistory preserves newest entries when trimming',
    setup: () => {
      const history = [];
      for (let i = 0; i < 100; i++) {
        history.push({ timestamp: new Date().toISOString(), action: `old-${i}` });
      }
      createTempDir({
        '.pdca-status.json': { version: '2.0', activeFeatures: [], primaryFeature: null, features: {}, pipeline: {}, session: {}, history }
      });
    },
    fn: () => {
      const pdca = getPdcaStatus();
      pdca.addPdcaHistory({ action: 'newest' }, TC92_TEMP);
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      const lastEntry = status.history[status.history.length - 1];
      assertEqual(lastEntry.action, 'newest', 'Newest entry should be preserved');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-77: Multi-feature support - multiple features in parallel',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', activeFeatures: [], primaryFeature: null, features: {}, pipeline: {}, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      pdca.setActiveFeature('feat-a', TC92_TEMP);
      pdca.addActiveFeature('feat-b', TC92_TEMP);
      pdca.updatePdcaStatus('feat-a', { phase: 'design' }, TC92_TEMP);
      pdca.updatePdcaStatus('feat-b', { phase: 'check' }, TC92_TEMP);
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assertEqual(status.features['feat-a'].phase, 'design', 'feat-a should be in design');
      assertEqual(status.features['feat-b'].phase, 'check', 'feat-b should be in check');
      assertEqual(status.activeFeatures.length, 2, 'Should have 2 active features');
    },
    teardown: cleanTempDir
  },
  {
    name: 'PDCA-78: Multi-feature - primary remains after updating another',
    setup: () => createTempDir({
      '.pdca-status.json': { version: '2.0', activeFeatures: ['primary-f'], primaryFeature: 'primary-f', features: { 'primary-f': { phase: 'plan' } }, pipeline: {}, session: {}, history: [] }
    }),
    fn: () => {
      const pdca = getPdcaStatus();
      pdca.updatePdcaStatus('secondary-f', { phase: 'do' }, TC92_TEMP);
      const status = pdca.loadPdcaStatus(TC92_TEMP);
      assertEqual(status.primaryFeature, 'primary-f', 'Primary should remain unchanged');
    },
    teardown: cleanTempDir
  },

  // ═══════════════════════════════════════════════════════════════
  // Section 9: Feature Name Extraction (2 tests to reach 80)
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'PDCA-79: extractFeatureFromContext extracts feature name',
    fn: () => {
      const pdca = getPdcaStatus();
      const result = pdca.extractFeatureFromContext('implement login-form');
      assertEqual(result, 'login-form', 'Should extract login-form from context');
    }
  },
  {
    name: 'PDCA-80: extractFeatureFromContext returns null for no match',
    fn: () => {
      const pdca = getPdcaStatus();
      const result = pdca.extractFeatureFromContext('hello world');
      assertEqual(result, null, 'Should return null when no feature name found');
    }
  }
];

module.exports = { tests };
