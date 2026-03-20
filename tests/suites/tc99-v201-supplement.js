// TC-99: v2.0.1 Supplement Verification (12 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertContains, withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const tests = [
  // ─── TC-96-01: version.js has all 5 restored flags ─────────────
  {
    name: 'TC96-01: getFeatureFlags has hasPolicyEngine flag',
    fn: () => {
      const { getFeatureFlags, resetCache } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'version'));
      resetCache();
      process.env.GEMINI_CLI_VERSION = '0.34.0';
      const flags = getFeatureFlags();
      resetCache();
      delete process.env.GEMINI_CLI_VERSION;
      assert(flags.hasPolicyEngine !== undefined, 'hasPolicyEngine must exist');
      assert(flags.hasProjectLevelPolicy !== undefined, 'hasProjectLevelPolicy must exist');
      assert(flags.hasExtensionPolicies !== undefined, 'hasExtensionPolicies must exist');
      assert(flags.hasTaskTracker !== undefined, 'hasTaskTracker must exist');
      assert(flags.hasRuntimeHookFunctions !== undefined, 'hasRuntimeHookFunctions must exist');
    }
  },

  // ─── TC-96-02: Policy flags are true for 0.34.0 ────────────────
  {
    name: 'TC96-02: All 5 policy flags true for 0.34.0',
    fn: () => {
      const { getFeatureFlags, resetCache } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'version'));
      resetCache();
      process.env.GEMINI_CLI_VERSION = '0.34.0';
      const flags = getFeatureFlags();
      resetCache();
      delete process.env.GEMINI_CLI_VERSION;
      assertEqual(flags.hasPolicyEngine, true, 'hasPolicyEngine should be true (0.34.0 >= 0.30.0)');
      assertEqual(flags.hasProjectLevelPolicy, true, 'hasProjectLevelPolicy should be true (0.34.0 >= 0.31.0)');
      assertEqual(flags.hasExtensionPolicies, true, 'hasExtensionPolicies should be true (0.34.0 >= 0.32.0)');
      assertEqual(flags.hasTaskTracker, true, 'hasTaskTracker should be true (0.34.0 >= 0.32.0)');
      assertEqual(flags.hasRuntimeHookFunctions, true, 'hasRuntimeHookFunctions should be true (0.34.0 >= 0.31.0)');
    }
  },

  // ─── TC-96-03: getReadOnlyTools excludes write tools ────────────
  {
    name: 'TC96-03: getReadOnlyTools excludes write tools',
    fn: () => {
      const { getReadOnlyTools, BUILTIN_TOOLS } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'tools'));
      const roTools = getReadOnlyTools();
      assert(!roTools.includes(BUILTIN_TOOLS.ACTIVATE_SKILL), 'ACTIVATE_SKILL must not be in readonly');
      assert(!roTools.includes(BUILTIN_TOOLS.WRITE_TODOS), 'WRITE_TODOS must not be in readonly');
      assert(!roTools.includes(BUILTIN_TOOLS.SAVE_MEMORY), 'SAVE_MEMORY must not be in readonly');
    }
  },

  // ─── TC-96-04: getReadOnlyTools all have readOnlyHint: true ─────
  {
    name: 'TC96-04: getReadOnlyTools entries all have readOnlyHint true in TOOL_ANNOTATIONS',
    fn: () => {
      const { getReadOnlyTools, TOOL_ANNOTATIONS } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'tools'));
      const roTools = getReadOnlyTools();
      for (const toolName of roTools) {
        const anno = TOOL_ANNOTATIONS[toolName];
        assert(anno !== undefined, `TOOL_ANNOTATIONS must have entry for ${toolName}`);
        assertEqual(anno.readOnlyHint, true, `${toolName} should have readOnlyHint: true`);
      }
    }
  },

  // ─── TC-96-05: SUBAGENT_POLICY_GROUPS has 3 tiers ──────────────
  {
    name: 'TC96-05: SUBAGENT_POLICY_GROUPS has readonly, docwrite, full tiers',
    fn: () => {
      const { SUBAGENT_POLICY_GROUPS } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'policy'));
      const keys = Object.keys(SUBAGENT_POLICY_GROUPS);
      assertEqual(keys.length, 3, 'Should have exactly 3 tiers');
      assert('readonly' in SUBAGENT_POLICY_GROUPS, 'Should have readonly tier');
      assert('docwrite' in SUBAGENT_POLICY_GROUPS, 'Should have docwrite tier');
      assert('full' in SUBAGENT_POLICY_GROUPS, 'Should have full tier');
    }
  },

  // ─── TC-96-06: full tier has correct agents ─────────────────────
  {
    name: 'TC96-06: full tier has pdca-iterator, cto-lead, pm-lead',
    fn: () => {
      const { SUBAGENT_POLICY_GROUPS } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'policy'));
      const fullAgents = SUBAGENT_POLICY_GROUPS.full.agents;
      assert(fullAgents.includes('pdca-iterator'), 'full tier should include pdca-iterator');
      assert(fullAgents.includes('cto-lead'), 'full tier should include cto-lead');
      assert(fullAgents.includes('pm-lead'), 'full tier should include pm-lead');
    }
  },

  // ─── TC-96-07: No agent appears in multiple tiers ───────────────
  {
    name: 'TC96-07: No agent appears in multiple tiers',
    fn: () => {
      const { SUBAGENT_POLICY_GROUPS } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'policy'));
      const allAgents = [];
      for (const [tierName, group] of Object.entries(SUBAGENT_POLICY_GROUPS)) {
        for (const agent of group.agents) {
          assert(!allAgents.includes(agent), `Agent "${agent}" appears in multiple tiers (found in ${tierName})`);
          allAgents.push(agent);
        }
      }
    }
  },

  // ─── TC-96-08: bkend-expert is in docwrite tier ─────────────────
  {
    name: 'TC96-08: bkend-expert is in docwrite tier (not readonly)',
    fn: () => {
      const { SUBAGENT_POLICY_GROUPS } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'policy'));
      const docwriteAgents = SUBAGENT_POLICY_GROUPS.docwrite.agents;
      const readonlyAgents = SUBAGENT_POLICY_GROUPS.readonly.agents;
      assert(docwriteAgents.includes('bkend-expert'), 'bkend-expert should be in docwrite tier');
      assert(!readonlyAgents.includes('bkend-expert'), 'bkend-expert should NOT be in readonly tier');
    }
  },

  // ─── TC-96-09: PHASE_CONTEXT_MAP.do uses tool-reference-v2.md ──
  {
    name: 'TC96-09: PHASE_CONTEXT_MAP.do uses tool-reference-v2.md',
    fn: () => {
      const sessionStartPath = path.join(PLUGIN_ROOT, 'hooks', 'scripts', 'session-start.js');
      const content = fs.readFileSync(sessionStartPath, 'utf-8');
      assertContains(content, "tool-reference-v2.md", 'session-start.js PHASE_CONTEXT_MAP.do should reference tool-reference-v2.md');
      // Verify it does NOT reference old tool-reference.md (without -v2)
      const doLine = content.split('\n').find(l => l.includes("do:") && l.includes('tool-reference'));
      assert(doLine !== undefined, 'Should find do: line with tool-reference');
      assertContains(doLine, 'tool-reference-v2.md', 'do phase should use tool-reference-v2.md');
    }
  },

  // ─── TC-96-10: tool-reference.md does NOT exist ─────────────────
  {
    name: 'TC96-10: tool-reference.md (old) does NOT exist',
    fn: () => {
      const oldPath = path.join(PLUGIN_ROOT, '.gemini', 'context', 'tool-reference.md');
      assertEqual(fs.existsSync(oldPath), false, 'Old tool-reference.md should not exist');
    }
  },

  // ─── TC-96-11: tool-reference-v2.md DOES exist ─────────────────
  {
    name: 'TC96-11: tool-reference-v2.md exists',
    fn: () => {
      const v2Path = path.join(PLUGIN_ROOT, '.gemini', 'context', 'tool-reference-v2.md');
      assertEqual(fs.existsSync(v2Path), true, 'tool-reference-v2.md should exist');
    }
  },

  // ─── TC-96-12: BKIT_PROJECT_DIR has @deprecated JSDoc ──────────
  {
    name: 'TC96-12: BKIT_PROJECT_DIR has @deprecated JSDoc in platform.js',
    fn: () => {
      const platformPath = path.join(PLUGIN_ROOT, 'lib', 'core', 'platform.js');
      const content = fs.readFileSync(platformPath, 'utf-8');
      assertContains(content, '@deprecated', 'platform.js should have @deprecated comment for BKIT_PROJECT_DIR');
      // Verify the deprecated comment is near BKIT_PROJECT_DIR
      const lines = content.split('\n');
      const deprecatedIdx = lines.findIndex(l => l.includes('@deprecated'));
      const bkitDirIdx = lines.findIndex(l => l.includes('const BKIT_PROJECT_DIR'));
      assert(deprecatedIdx !== -1, '@deprecated comment must exist');
      assert(bkitDirIdx !== -1, 'BKIT_PROJECT_DIR declaration must exist');
      assert(bkitDirIdx - deprecatedIdx <= 3, '@deprecated should be within 3 lines before BKIT_PROJECT_DIR');
    }
  }
];

module.exports = { tests };
