// TC-85: Gemini Tracker Module Tests (16 TC)
const { PLUGIN_ROOT, assert, assertEqual } = require('../test-utils');
const path = require('path');

const {
  TRACKER_MODE,
  PDCA_TASK_TEMPLATES,
  PDCA_TO_TRACKER_STATUS,
  getTrackerMode,
  isTrackerAvailable,
  createPdcaEpic,
  syncPhaseTransition,
  getVisualizationHint,
  getBridgeStatus,
  registerTrackerIds,
  getTrackerContextInjection
} = require(path.join(PLUGIN_ROOT, 'lib/gemini/tracker'));

const tests = [
  // ─── TRACKER_MODE (2 tests) ─────────────────────

  { name: 'TC85-01: TRACKER_MODE has INSTRUCTION and DIRECT', fn: () => {
    assertEqual(TRACKER_MODE.INSTRUCTION, 'instruction', 'INSTRUCTION should be instruction');
    assertEqual(TRACKER_MODE.DIRECT, 'direct', 'DIRECT should be direct');
  }},
  { name: 'TC85-02: TRACKER_MODE is frozen', fn: () => {
    assert(Object.isFrozen(TRACKER_MODE), 'TRACKER_MODE should be frozen');
  }},

  // ─── PDCA_TASK_TEMPLATES (3 tests) ─────────────────────

  { name: 'TC85-03: PDCA_TASK_TEMPLATES has 6 phases', fn: () => {
    const phases = Object.keys(PDCA_TASK_TEMPLATES);
    assertEqual(phases.length, 6, 'should have 6 phases');
    assert(phases.includes('plan'), 'should have plan');
    assert(phases.includes('design'), 'should have design');
    assert(phases.includes('do'), 'should have do');
    assert(phases.includes('check'), 'should have check');
    assert(phases.includes('act'), 'should have act');
    assert(phases.includes('report'), 'should have report');
  }},
  { name: 'TC85-04: plan template has title [Plan] {feature} and status in_progress', fn: () => {
    assertEqual(PDCA_TASK_TEMPLATES.plan.title, '[Plan] {feature}', 'plan title');
    assertEqual(PDCA_TASK_TEMPLATES.plan.status, 'in_progress', 'plan status');
  }},
  { name: 'TC85-05: design template has blockedBy plan', fn: () => {
    assertEqual(PDCA_TASK_TEMPLATES.design.blockedBy, 'plan', 'design blockedBy should be plan');
  }},

  // ─── getTrackerMode (1 test) ─────────────────────

  { name: 'TC85-06: getTrackerMode is a function', fn: () => {
    assertEqual(typeof getTrackerMode, 'function', 'getTrackerMode should be a function');
  }},

  // ─── createPdcaEpic (2 tests) ─────────────────────

  { name: 'TC85-07: createPdcaEpic returns available:false when tracker unavailable', fn: () => {
    // When tracker is not available, createPdcaEpic returns available:false
    const result = createPdcaEpic('test-feature');
    if (!isTrackerAvailable()) {
      assertEqual(result.available, false, 'should be unavailable when tracker not available');
    } else {
      assertEqual(result.available, true, 'should be available when tracker is available');
    }
  }},
  { name: 'TC85-08: createPdcaEpic returns mode and hint', fn: () => {
    const result = createPdcaEpic('test-feature');
    assert('mode' in result, 'result should have mode field');
    assert('hint' in result, 'result should have hint field');
  }},

  // ─── syncPhaseTransition (1 test) ─────────────────────

  { name: 'TC85-09: syncPhaseTransition returns object (not plain string)', fn: () => {
    const result = syncPhaseTransition('test-feature', 'plan', 'design');
    assert(typeof result === 'object' && result !== null, 'should return an object');
    assert('mode' in result, 'result should have mode');
    assert('hint' in result, 'result should have hint');
  }},

  // ─── PDCA_TO_TRACKER_STATUS (1 test) ─────────────────────

  { name: 'TC85-10: PDCA_TO_TRACKER_STATUS maps completed to done', fn: () => {
    assertEqual(PDCA_TO_TRACKER_STATUS.completed, 'done', 'completed should map to done');
  }},

  // ─── isTrackerAvailable (1 test) ─────────────────────

  { name: 'TC85-11: isTrackerAvailable is a function', fn: () => {
    assertEqual(typeof isTrackerAvailable, 'function', 'isTrackerAvailable should be a function');
  }},

  // ─── getVisualizationHint (1 test) ─────────────────────

  { name: 'TC85-12: getVisualizationHint is a function', fn: () => {
    assertEqual(typeof getVisualizationHint, 'function', 'getVisualizationHint should be a function');
  }},

  // ─── getBridgeStatus (1 test) ─────────────────────

  { name: 'TC85-13: getBridgeStatus returns object with available and mode fields', fn: () => {
    const status = getBridgeStatus();
    assert(typeof status === 'object' && status !== null, 'should return an object');
    assert('available' in status, 'should have available field');
    assert('mode' in status, 'should have mode field');
  }},

  // ─── registerTrackerIds (1 test) ─────────────────────

  { name: 'TC85-14: registerTrackerIds is a function', fn: () => {
    assertEqual(typeof registerTrackerIds, 'function', 'registerTrackerIds should be a function');
  }},

  // ─── getTrackerContextInjection (1 test) ─────────────────────

  { name: 'TC85-15: getTrackerContextInjection is a function', fn: () => {
    assertEqual(typeof getTrackerContextInjection, 'function', 'getTrackerContextInjection should be a function');
  }},

  // ─── Additional validation (1 test) ─────────────────────

  { name: 'TC85-16: PDCA_TO_TRACKER_STATUS maps archived to done', fn: () => {
    assertEqual(PDCA_TO_TRACKER_STATUS.archived, 'done', 'archived should map to done');
  }}
];

module.exports = { tests };
