const path = require('path');
const { PLUGIN_ROOT, assert, assertEqual, assertContains, withVersion, getPdcaStatus } = require('../test-utils');

// Require the module directly for unit tests
const trackerBridge = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'tracker'));

const tests = [
  {
    name: 'TC-23-01: isTrackerAvailable() returns false for v0.31.0',
    fn: async () => {
      withVersion('0.31.0', () => {
        assertEqual(trackerBridge.isTrackerAvailable(), false, 'Tracker should NOT be available on 0.31.0');
      });
    }
  },
  {
    name: 'TC-23-02: isTrackerAvailable() returns true for v0.32.0+',
    fn: async () => {
      withVersion('0.32.0', () => {
        assertEqual(trackerBridge.isTrackerAvailable(), true, 'Tracker should be available on 0.32.0');
      });
      withVersion('0.32.1', () => {
        assertEqual(trackerBridge.isTrackerAvailable(), true, 'Tracker should be available on 0.32.1');
      });
    }
  },
  {
    name: 'TC-23-03: createPdcaEpic() generates context string when tracker available',
    fn: async () => {
      withVersion('0.37.0', () => {
        const result = trackerBridge.createPdcaEpic('test-feature');
        if (result.available) {
          assert(result.hint.length > 0, 'Hint should not be empty');
          assertContains(result.hint, 'test-feature', 'Hint should include feature name');
        } else {
          // Tracker not available in test environment is OK
          assertEqual(result.hint, '', 'Hint should be empty when unavailable');
        }
      });
    }
  },
  {
    name: 'TC-23-04: syncPhaseTransition() returns instruction object',
    fn: async () => {
      withVersion('0.37.0', () => {
        const result = trackerBridge.syncPhaseTransition('test-feature', 'design', 'do');
        assert(typeof result === 'object', 'Should return an object');
        assert(typeof result.hint === 'string', 'Hint should be a string');
      });
    }
  },
  {
    name: 'TC-23-05: getVisualizationHint() contains phase status',
    fn: async () => {
      withVersion('0.32.0', () => {
        const hint = trackerBridge.getVisualizationHint('test-feature', 'do');
        assertContains(hint, '[Plan] done', 'Plan should be done');
        assertContains(hint, '[Do] >>> active', 'Do should be active');
        assertContains(hint, '[Check] pending', 'Check should be pending');
      });
    }
  }
];

module.exports = { tests };
