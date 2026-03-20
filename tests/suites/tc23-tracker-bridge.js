const path = require('path');
const { 
  PLUGIN_ROOT, 
  assert, assertEqual, assertContains, withVersion 
} = require('../test-utils');

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
    name: 'TC-23-03: createPdcaEpic() generates correct context string',
    fn: async () => {
      withVersion('0.32.0', () => {
        const result = trackerBridge.createPdcaEpic('test-feature');
        assert(result.available, 'Tracker should be available');
        assertContains(result.hint, 'tracker_create_task', 'Hint should include tracker_create_task');
        assertContains(result.hint, 'test-feature', 'Hint should include feature name');
      });
    }
  },
  {
    name: 'TC-23-04: syncPhaseTransition() returns instruction text',
    fn: async () => {
      withVersion('0.32.0', () => {
        const instruction = trackerBridge.syncPhaseTransition('test-feature', 'design', 'do');
        assertContains(instruction, 'Design', 'Instruction should include capitalized fromPhase');
        assertContains(instruction, 'Do', 'Instruction should include capitalized toPhase');
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
