/**
 * TC-21 ~ TC-31: v0.32.x Migration Tests
 * Tests for bkit v1.5.7 Gemini CLI v0.32.x compatibility
 */
const fs = require('fs');
const path = require('path');
const { assert, assertEqual, PLUGIN_ROOT } = require('../test-utils');

const vd = require(path.join(PLUGIN_ROOT, 'lib/adapters/gemini/version-detector'));
const tr = require(path.join(PLUGIN_ROOT, 'lib/adapters/gemini/tool-registry'));

module.exports = {
  tests: [
    {
      name: 'TC-21: Tool Registry has 23 built-in tools',
      fn: () => {
        assertEqual(tr.ALL_BUILTIN_TOOL_NAMES.size, 23, 'Should have 23 built-in tools');
      }
    },
    {
      name: 'TC-22: Tracker tools have correct annotations',
      fn: () => {
        const annotations = tr.TOOL_ANNOTATIONS;
        assert(annotations[tr.BUILTIN_TOOLS.TRACKER_GET_TASK].readOnlyHint === true, 'tracker_get_task should be readOnly');
        assert(annotations[tr.BUILTIN_TOOLS.TRACKER_LIST_TASKS].readOnlyHint === true, 'tracker_list_tasks should be readOnly');
        assert(annotations[tr.BUILTIN_TOOLS.TRACKER_VISUALIZE].readOnlyHint === true, 'tracker_visualize should be readOnly');
        assert(annotations[tr.BUILTIN_TOOLS.TRACKER_CREATE_TASK].readOnlyHint === false, 'tracker_create_task should NOT be readOnly');
        assert(annotations[tr.BUILTIN_TOOLS.TRACKER_UPDATE_TASK].readOnlyHint === false, 'tracker_update_task should NOT be readOnly');
        assert(annotations[tr.BUILTIN_TOOLS.TRACKER_ADD_DEPENDENCY].readOnlyHint === false, 'tracker_add_dependency should NOT be readOnly');
      }
    },
    {
      name: 'TC-23: v0.32.0+ feature flags are present',
      fn: () => {
        vd.resetCache();
        const original = process.env.GEMINI_CLI_VERSION;
        process.env.GEMINI_CLI_VERSION = '0.32.1';
        try {
          const flags = vd.getFeatureFlags();
          assert(flags.hasTaskTracker, 'hasTaskTracker should be true');
          assert(flags.hasModelFamilyToolsets, 'hasModelFamilyToolsets should be true');
          assert(flags.hasExtensionPolicies, 'hasExtensionPolicies should be true');
          assert(flags.hasGrepIncludePatternRename, 'hasGrepIncludePatternRename should be true');
          assert(flags.hasReadFileLineParams, 'hasReadFileLineParams should be true');
          assert(flags.hasReplaceAllowMultiple, 'hasReplaceAllowMultiple should be true');
          assert(flags.hasExcludeToolsRemoved, 'hasExcludeToolsRemoved should be true');
          assert(flags.hasPlanModeEnhanced, 'hasPlanModeEnhanced should be true');
          assert(flags.hasA2AStreaming, 'hasA2AStreaming should be true');
          assert(flags.hasShellAutocompletion, 'hasShellAutocompletion should be true');
          assert(flags.hasParallelExtensionLoading, 'hasParallelExtensionLoading should be true');
        } finally {
          vd.resetCache();
          if (original !== undefined) process.env.GEMINI_CLI_VERSION = original;
          else delete process.env.GEMINI_CLI_VERSION;
        }
      }
    },
    {
      name: 'TC-24: Extension policy generates DENY/ASK_USER only',
      fn: () => {
        const pm = require(path.join(PLUGIN_ROOT, 'lib/adapters/gemini/policy-migrator'));
        assert(typeof pm.generateExtensionPolicy === 'function', 'generateExtensionPolicy should exist');
        // Static policy file should exist
        const policyPath = path.join(PLUGIN_ROOT, 'policies', 'bkit-extension-policy.toml');
        assert(fs.existsSync(policyPath), 'Static extension policy should exist');
        const content = fs.readFileSync(policyPath, 'utf-8');
        assert(content.includes('deny'), 'Policy should contain deny rules');
        assert(!content.includes('decision = "allow"'), 'Extension policy should NOT contain allow decisions');
      }
    },
    {
      name: 'TC-25: validateTomlStructure rejects lowercase toolname',
      fn: () => {
        const pm = require(path.join(PLUGIN_ROOT, 'lib/adapters/gemini/policy-migrator'));
        const badToml = '[[rule]]\ntoolname = "read_file"\ndecision = "allow"\npriority = 10\n';
        assertEqual(pm.validateTomlStructure(badToml), false, 'Should reject lowercase toolname');
      }
    },
    {
      name: 'TC-26: parseVersion handles nightly format',
      fn: () => {
        const { parseVersion } = vd;
        const v = parseVersion('0.34.0-nightly.20260304');
        assertEqual(v.major, 0, 'major should be 0');
        assertEqual(v.minor, 34, 'minor should be 34');
        assertEqual(v.patch, 0, 'patch should be 0');
        assertEqual(v.isNightly, true, 'isNightly should be true');
        assertEqual(v.nightlyNum, 20260304, 'nightlyNum should be 20260304');
      }
    },
    {
      name: 'TC-27: Tracker read-only tools allowed in check phase',
      fn: () => {
        const readOnly = tr.getReadOnlyTools();
        assert(readOnly.includes(tr.BUILTIN_TOOLS.TRACKER_GET_TASK), 'tracker_get_task should be in readOnly');
        assert(readOnly.includes(tr.BUILTIN_TOOLS.TRACKER_LIST_TASKS), 'tracker_list_tasks should be in readOnly');
        assert(readOnly.includes(tr.BUILTIN_TOOLS.TRACKER_VISUALIZE), 'tracker_visualize should be in readOnly');
        assert(!readOnly.includes(tr.BUILTIN_TOOLS.TRACKER_CREATE_TASK), 'tracker_create_task should NOT be in readOnly');
      }
    },
    {
      name: 'TC-28: Tracker bridge reports availability based on feature flag',
      fn: () => {
        const tb = require(path.join(PLUGIN_ROOT, 'lib/adapters/gemini/tracker-bridge'));
        vd.resetCache();
        const original = process.env.GEMINI_CLI_VERSION;

        // v0.32.1 -> available
        process.env.GEMINI_CLI_VERSION = '0.32.1';
        assert(tb.isTrackerAvailable(), 'Tracker should be available for v0.32.1');

        // v0.31.0 -> not available
        vd.resetCache();
        process.env.GEMINI_CLI_VERSION = '0.31.0';
        assert(!tb.isTrackerAvailable(), 'Tracker should NOT be available for v0.31.0');

        vd.resetCache();
        if (original !== undefined) process.env.GEMINI_CLI_VERSION = original;
        else delete process.env.GEMINI_CLI_VERSION;
      }
    },
    {
      name: 'TC-29: AfterAgent loop guard structure',
      fn: () => {
        const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks/scripts/after-agent.js'), 'utf-8');
        assert(content.includes('LOOP_GUARD_KEY'), 'Should have loop guard key');
        assert(content.includes('MAX_REENTRY'), 'Should have MAX_REENTRY constant');
        assert(content.includes('__BKIT_AFTER_AGENT_DEPTH'), 'Should use depth env var');
      }
    },
    {
      name: 'TC-30: Hook dual-mode exports',
      fn: () => {
        const hookFiles = [
          'before-agent.js', 'before-model.js', 'after-model.js',
          'before-tool-selection.js', 'before-tool.js', 'after-tool.js'
        ];
        for (const file of hookFiles) {
          const hookPath = path.join(PLUGIN_ROOT, 'hooks/scripts', file);
          const mod = require(hookPath);
          assert(typeof mod.handler === 'function', `${file} should export handler function`);
        }
      }
    },
    {
      name: 'TC-31: v0.29.0 backward compatibility',
      fn: () => {
        vd.resetCache();
        const original = process.env.GEMINI_CLI_VERSION;
        process.env.GEMINI_CLI_VERSION = '0.29.0';
        try {
          const flags = vd.getFeatureFlags();
          assert(!flags.hasTaskTracker, 'hasTaskTracker should be false for v0.29.0');
          assert(!flags.hasExtensionPolicies, 'hasExtensionPolicies should be false for v0.29.0');
          assert(flags.hasPlanMode, 'hasPlanMode should be true for v0.29.0');
        } finally {
          vd.resetCache();
          if (original !== undefined) process.env.GEMINI_CLI_VERSION = original;
          else delete process.env.GEMINI_CLI_VERSION;
        }
      }
    }
  ]
};
