// TC-34: Adapters Gemini Unit Tests (25 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertType, assertContains, withVersion } = require('../test-utils');
const path = require('path');

const pm = require(path.join(PLUGIN_ROOT, 'lib/gemini/policy'));
const ha = require(path.join(PLUGIN_ROOT, 'lib/gemini/hooks'));
const tb = require(path.join(PLUGIN_ROOT, 'lib/gemini/tracker'));
const cf = require(path.join(PLUGIN_ROOT, 'lib/gemini/context-fork'));

const tests = [
  // policy-migrator
  { name: 'TC34-01: parsePermissionKey 존재', fn: () => { assertType(pm.parsePermissionKey, 'function', 'Should export'); } },
  { name: 'TC34-02: mapDecision 존재', fn: () => { assertType(pm.mapDecision, 'function', 'Should export'); } },
  { name: 'TC34-03: convertToToml 존재', fn: () => { assertType(pm.convertToToml, 'function', 'Should export'); } },
  { name: 'TC34-04: generatePolicyFile 존재', fn: () => { assertType(pm.generatePolicyFile, 'function', 'Should export'); } },
  { name: 'TC34-05: generateLevelPolicy 존재', fn: () => { assertType(pm.generateLevelPolicy, 'function', 'Should export'); } },
  { name: 'TC34-06: generateExtensionPolicy 존재', fn: () => { assertType(pm.generateExtensionPolicy, 'function', 'Should export'); } },
  { name: 'TC34-07: LEVEL_POLICY_TEMPLATES 존재', fn: () => { assert(pm.LEVEL_POLICY_TEMPLATES !== undefined, 'Should export'); } },
  {
    name: 'TC34-08: escapeTomlString 특수문자',
    fn: () => {
      const result = pm.escapeTomlString('test "value"');
      assertType(result, 'string', 'Should return string');
    }
  },
  {
    name: 'TC34-09: validateTomlStructure 존재',
    fn: () => { assertType(pm.validateTomlStructure, 'function', 'Should export'); }
  },
  // hook-adapter
  { name: 'TC34-10: HOOK_EVENT_MAP 존재', fn: () => { assert(ha.HOOK_EVENT_MAP !== undefined, 'Should export'); } },
  { name: 'TC34-11: HOT_PATH_HOOKS 존재', fn: () => { assert(ha.HOT_PATH_HOOKS !== undefined, 'Should export'); } },
  { name: 'TC34-12: supportsRuntimeHookFunctions 존재', fn: () => { assertType(ha.supportsRuntimeHookFunctions, 'function', 'Should export'); } },
  { name: 'TC34-13: getHookExecutionInfo 존재', fn: () => { assertType(ha.getHookExecutionInfo, 'function', 'Should export'); } },
  { name: 'TC34-14: getMigrationStatus 존재', fn: () => { assertType(ha.getMigrationStatus, 'function', 'Should export'); } },
  // tracker-bridge
  { name: 'TC34-15: isTrackerAvailable 존재', fn: () => { assertType(tb.isTrackerAvailable, 'function', 'Should export'); } },
  { name: 'TC34-16: PDCA_TO_TRACKER_STATUS 존재', fn: () => { assert(tb.PDCA_TO_TRACKER_STATUS !== undefined, 'Should export'); } },
  { name: 'TC34-17: createPdcaEpic 존재', fn: () => { assertType(tb.createPdcaEpic, 'function', 'Should export'); } },
  { name: 'TC34-18: syncPhaseTransition 존재', fn: () => { assertType(tb.syncPhaseTransition, 'function', 'Should export'); } },
  { name: 'TC34-19: getTrackerContextInjection 존재', fn: () => { assertType(tb.getTrackerContextInjection, 'function', 'Should export'); } },
  { name: 'TC34-20: getBridgeStatus 존재', fn: () => { assertType(tb.getBridgeStatus, 'function', 'Should export'); } },
  // context-fork
  { name: 'TC34-21: forkContext 존재', fn: () => { assertType(cf.forkContext, 'function', 'Should export'); } },
  { name: 'TC34-22: mergeForkedContext 존재', fn: () => { assertType(cf.mergeForkedContext, 'function', 'Should export'); } },
  { name: 'TC34-23: discardFork 존재', fn: () => { assertType(cf.discardFork, 'function', 'Should export'); } },
  { name: 'TC34-24: listActiveForks 존재', fn: () => { assertType(cf.listActiveForks, 'function', 'Should export'); } },
  { name: 'TC34-25: FORK_STORAGE_DIR 존재', fn: () => { assert(cf.FORK_STORAGE_DIR !== undefined, 'Should export'); } }
];

module.exports = { tests };
