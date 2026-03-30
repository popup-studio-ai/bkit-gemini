// TC-110: v0.35.0 E2E Regression (15 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertExists, assertContains, withVersion, getPdcaStatus } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const tests = [
  // ─── Directory structure ─────────────────────

  { name: 'TC110-01: lib/gemini/ has 8 files', fn: () => {
    const dir = path.join(PLUGIN_ROOT, 'lib/gemini');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
    assertEqual(files.length, 8, `lib/gemini/ should have 8 JS files, found ${files.length}`);
  }},

  { name: 'TC110-02: lib/core/ has 11 files', fn: () => {
    const dir = path.join(PLUGIN_ROOT, 'lib/core');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
    assertEqual(files.length, 11, `lib/core/ should have 11 JS files, found ${files.length}`);
  }},

  { name: 'TC110-03: lib/pdca/ has 6 files', fn: () => {
    const dir = path.join(PLUGIN_ROOT, 'lib/pdca');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
    assertEqual(files.length, 6, `lib/pdca/ should have 6 JS files, found ${files.length}`);
  }},

  // ─── Configuration ─────────────────────

  { name: 'TC110-04: bkit.config.json loads without error', fn: () => {
    const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
    assert(config !== null, 'config should load');
    assert(config.permissions !== undefined, 'should have permissions section');
  }},

  { name: 'TC110-05: bkit.config.json testedVersions includes 0.35.0', fn: () => {
    const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
    const tested = config.compatibility?.testedVersions || [];
    assert(tested.includes('0.35.0'), 'testedVersions should include 0.35.0');
  }},

  { name: 'TC110-06: hooks/hooks.json loads without error', fn: () => {
    const hooks = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks/hooks.json'), 'utf-8'));
    assert(hooks !== null, 'hooks config should load');
  }},

  // ─── GEMINI.md context ─────────────────────

  { name: 'TC110-07: GEMINI.md has @import directives for context files', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'GEMINI.md'), 'utf-8');
    const imports = content.match(/@\.gemini\/context\//g) || [];
    assert(imports.length >= 2, `GEMINI.md should have 2+ @import directives, found ${imports.length}`);
    // Core imports must be present
    assertContains(content, 'commands.md', 'should import commands.md');
    assertContains(content, 'core-rules.md', 'should import core-rules.md');
  }},

  { name: 'TC110-08: .gemini/context/ has 9 files', fn: () => {
    const dir = path.join(PLUGIN_ROOT, '.gemini/context');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    assert(files.length >= 9, `.gemini/context/ should have 9+ files, found ${files.length}`);
  }},

  // ─── Extension manifest ─────────────────────

  { name: 'TC110-09: gemini-extension.json loads without error', fn: () => {
    const ext = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'gemini-extension.json'), 'utf-8'));
    assert(ext !== null, 'extension manifest should load');
    assertEqual(ext.name, 'bkit', 'extension name should be bkit');
  }},

  { name: 'TC110-10: gemini-extension.json version is 2.0.2', fn: () => {
    const ext = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'gemini-extension.json'), 'utf-8'));
    assertEqual(ext.version, '2.0.2', 'version should be 2.0.2');
  }},

  // ─── All lib/ modules load without error ─────────────

  { name: 'TC110-11: all lib/ modules require() successfully', fn: () => {
    const modules = [
      'lib/core/index',
      'lib/gemini/version',
      'lib/gemini/tools',
      'lib/gemini/policy',
      'lib/gemini/hooks',
      'lib/gemini/tracker',
      'lib/gemini/import-resolver',
      'lib/pdca/index',
      'lib/intent/index',
      'lib/task/index',
      'lib/team/index',
      'lib/skill-orchestrator',
      'lib/context-hierarchy'
    ];
    let failures = [];
    for (const mod of modules) {
      try {
        require(path.join(PLUGIN_ROOT, mod));
      } catch (e) {
        failures.push(`${mod}: ${e.message}`);
      }
    }
    assertEqual(failures.length, 0, `Module load failures: ${failures.join('; ')}`);
  }},

  { name: 'TC110-12: CHANGELOG.md exists', fn: () => {
    assertExists(path.join(PLUGIN_ROOT, 'CHANGELOG.md'), 'CHANGELOG.md should exist');
  }},

  { name: 'TC110-13: policies/bkit-extension-policy.toml exists', fn: () => {
    assertExists(path.join(PLUGIN_ROOT, 'policies/bkit-extension-policy.toml'), 'extension policy should exist');
  }},

  // ─── Feature flags completeness ─────────────────────

  { name: 'TC110-14: getFeatureFlags v0.35.0 has all expected flags', fn: () => {
    withVersion('0.35.0', () => {
      const { getFeatureFlags } = require(path.join(PLUGIN_ROOT, 'lib/gemini/version'));
      const flags = getFeatureFlags();
      const expected = [
        'hasJITContextLoading', 'hasToolIsolation', 'hasParallelToolScheduler',
        'hasAdminPolicy', 'hasDisableAlwaysAllow', 'hasCryptoVerification',
        'hasCustomKeybindings', 'hasPolicyEngine', 'hasProjectLevelPolicy',
        'hasExtensionPolicies', 'hasTaskTracker', 'hasRuntimeHookFunctions',
        'hasSubagentPolicies', 'hasNativeSkillSystem'
      ];
      let missing = [];
      for (const key of expected) {
        if (flags[key] === undefined) missing.push(key);
      }
      assertEqual(missing.length, 0, `Missing flags: ${missing.join(', ')}`);
    });
  }},

  { name: 'TC110-15: getBkitFeatureFlags v0.35.0 has JIT flags', fn: () => {
    withVersion('0.35.0', () => {
      const { getBkitFeatureFlags } = require(path.join(PLUGIN_ROOT, 'lib/gemini/version'));
      const flags = getBkitFeatureFlags();
      assertEqual(flags.canUseJITContext, true, 'canUseJITContext should be true');
      assertEqual(flags.canUseToolIsolation, true, 'canUseToolIsolation should be true');
      assertEqual(flags.canUseParallelScheduler, true, 'canUseParallelScheduler should be true');
    });
  }}
];

module.exports = { tests };
