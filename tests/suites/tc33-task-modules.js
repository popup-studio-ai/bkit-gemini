// TC-33: Task Modules Unit Tests (20 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertType, getPdcaStatus, withVersion } = require('../test-utils');
const path = require('path');

const classification = require(path.join(PLUGIN_ROOT, 'lib/task/classification'));
const context = require(path.join(PLUGIN_ROOT, 'lib/task/context'));
const creator = require(path.join(PLUGIN_ROOT, 'lib/task/creator'));
const dependency = require(path.join(PLUGIN_ROOT, 'lib/task/dependency'));
const tracker = require(path.join(PLUGIN_ROOT, 'lib/task/tracker'));

const tests = [
  // classification
  { name: 'TC33-01: classifyTask 존재', fn: () => { assertType(classification.classifyTask, 'function', 'Should export'); } },
  { name: 'TC33-02: getPdcaLevel 존재', fn: () => { assertType(classification.getPdcaLevel, 'function', 'Should export'); } },
  { name: 'TC33-03: estimateComplexity 존재', fn: () => { assertType(classification.estimateComplexity, 'function', 'Should export'); } },
  {
    name: 'TC33-04: classifyTask 짧은 입력',
    fn: () => {
      const result = classification.classifyTask('Fix a bug');
      assert(result !== undefined, 'Should return classification');
    }
  },
  {
    name: 'TC33-05: getPdcaGuidance 존재',
    fn: () => { assertType(classification.getPdcaGuidance, 'function', 'Should export'); }
  },
  // context
  { name: 'TC33-06: setActiveSkill/getActiveSkill', fn: () => {
    context.setActiveSkill('pdca');
    assertEqual(context.getActiveSkill(), 'pdca', 'Should set/get skill');
    context.clearActiveContext();
  }},
  { name: 'TC33-07: setActiveAgent/getActiveAgent', fn: () => {
    context.setActiveAgent('gap-detector');
    assertEqual(context.getActiveAgent(), 'gap-detector', 'Should set/get agent');
    context.clearActiveContext();
  }},
  { name: 'TC33-08: clearActiveContext', fn: () => {
    context.setActiveSkill('test');
    context.clearActiveContext();
    assertEqual(context.getActiveSkill(), null, 'Should be null after clear');
  }},
  { name: 'TC33-09: hasActiveContext', fn: () => {
    context.clearActiveContext();
    assertEqual(context.hasActiveContext(), false, 'Should be false when empty');
    context.setActiveSkill('test');
    assertEqual(context.hasActiveContext(), true, 'Should be true when set');
    context.clearActiveContext();
  }},
  // creator
  { name: 'TC33-10: generatePdcaTaskSubject', fn: () => {
    const subject = creator.generatePdcaTaskSubject('plan', 'test-feature');
    assertType(subject, 'string', 'Should return string');
    assert(subject.length > 0, 'Should not be empty');
  }},
  { name: 'TC33-11: generatePdcaTaskDescription', fn: () => {
    const desc = creator.generatePdcaTaskDescription('plan', 'test-feature');
    assertType(desc, 'string', 'Should return string');
  }},
  { name: 'TC33-12: getPdcaTaskMetadata', fn: () => {
    const meta = creator.getPdcaTaskMetadata('plan', 'test-feature');
    assertType(meta, 'object', 'Should return object');
  }},
  { name: 'TC33-13: autoCreatePdcaTask 존재', fn: () => { assertType(creator.autoCreatePdcaTask, 'function', 'Should export'); } },
  // dependency
  { name: 'TC33-14: PDCA_DEPENDENCY_CHAIN 존재', fn: () => { assert(dependency.PDCA_DEPENDENCY_CHAIN !== undefined, 'Should export'); } },
  { name: 'TC33-15: canStartPhase 존재', fn: () => { assertType(dependency.canStartPhase, 'function', 'Should export'); } },
  { name: 'TC33-16: getNextAvailableTasks 존재', fn: () => { assertType(dependency.getNextAvailableTasks, 'function', 'Should export'); } },
  { name: 'TC33-17: validateDependencyChain 존재', fn: () => { assertType(dependency.validateDependencyChain, 'function', 'Should export'); } },
  // tracker
  { name: 'TC33-18: savePdcaTaskId 존재', fn: () => { assertType(tracker.savePdcaTaskId, 'function', 'Should export'); } },
  { name: 'TC33-19: getCurrentPdcaPhase 존재', fn: () => { assertType(tracker.getCurrentPdcaPhase, 'function', 'Should export'); } },
  { name: 'TC33-20: triggerNextPdcaAction 존재', fn: () => { assertType(tracker.triggerNextPdcaAction, 'function', 'Should export'); } }
];

module.exports = { tests };
