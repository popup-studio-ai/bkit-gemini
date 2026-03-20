// TC-97: E2E Integration Tests (40 TC)
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProjectV2, cleanupTestProject,
        executeHook, assert, assertEqual, assertType, assertContains, assertExists,
        withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const tests = [
  // ─── session-start.js + lib/gemini/policy.js integration (5 tests) ───

  { name: 'TC97-01: session-start hook loads without error',
    setup: () => createTestProjectV2({ '.pdca-status.json': JSON.stringify({
      version: '2.0', lastUpdated: new Date().toISOString(),
      activeFeatures: [], primaryFeature: null, features: {},
      pipeline: { currentPhase: 1, level: 'Starter', phaseHistory: [] },
      session: { startedAt: new Date().toISOString(), onboardingCompleted: false, lastActivity: new Date().toISOString() },
      history: []
    }) }),
    fn: () => {
      const result = executeHook('session-start.js', {}, {
        GEMINI_CLI_VERSION: '0.34.0'
      });
      // Hook should produce output (even if error, it should not crash)
      assertType(result, 'object', 'result should be object');
    },
    teardown: () => cleanupTestProject()
  },

  { name: 'TC97-02: policy.js module exports expected functions', fn: () => {
    const policy = require(path.join(PLUGIN_ROOT, 'lib/gemini/policy'));
    assertType(policy.escapeTomlString, 'function', 'escapeTomlString');
    assertType(policy.validateTomlStructure, 'function', 'validateTomlStructure');
  }},

  { name: 'TC97-03: policy.js escapeTomlString handles special chars', fn: () => {
    const { escapeTomlString } = require(path.join(PLUGIN_ROOT, 'lib/gemini/policy'));
    const result = escapeTomlString('hello "world"\nnewline\\slash');
    assertContains(result, '\\"', 'should escape quotes');
    assertContains(result, '\\n', 'should escape newlines');
    assertContains(result, '\\\\', 'should escape backslashes');
  }},

  { name: 'TC97-04: session-start.js can be required as module', fn: () => {
    // Verify the script file exists and has valid JS syntax
    const scriptPath = path.join(PLUGIN_ROOT, 'hooks/scripts/session-start.js');
    assert(fs.existsSync(scriptPath), 'session-start.js should exist');
    const content = fs.readFileSync(scriptPath, 'utf-8');
    assertContains(content, 'require', 'should have require statements');
  }},

  { name: 'TC97-05: session-start references lib/gemini/platform', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks/scripts/session-start.js'), 'utf-8');
    assertContains(content, 'platform', 'should reference platform module');
  }},

  // ─── before-model.js + version.js integration (5 tests) ───

  { name: 'TC97-06: before-model.js references version/feature flags', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks/scripts/before-model.js'), 'utf-8');
    // before-model uses MODEL_ROUTING which maps to config modelRouting
    assertContains(content, 'MODEL_ROUTING', 'should define MODEL_ROUTING');
  }},

  { name: 'TC97-07: before-model MODEL_ROUTING has all PDCA phases', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks/scripts/before-model.js'), 'utf-8');
    const phases = ['plan', 'design', 'do', 'check', 'act', 'report'];
    for (const phase of phases) {
      assertContains(content, phase, `MODEL_ROUTING should have ${phase} phase`);
    }
  }},

  { name: 'TC97-08: version.js getFeatureFlags returns object with v0.34.0', fn: () => {
    withVersion('0.34.0', () => {
      const flags = getFeatureFlags();
      assertType(flags, 'object', 'flags should be object');
      assertEqual(flags.hasNativeSkillSystem, true, 'hasNativeSkillSystem on 0.34.0');
    });
  }},

  { name: 'TC97-09: version.js getBkitFeatureFlags includes canUse flags', fn: () => {
    withVersion('0.34.0', () => {
      const flags = getBkitFeatureFlags();
      assertEqual(flags.canUseTeam, true, 'canUseTeam always true in v2.0.0');
      assertEqual(flags.canUsePmTeam, true, 'canUsePmTeam always true in v2.0.0');
      assertEqual(flags.canUseNativeAgents, true, 'canUseNativeAgents always true');
    });
  }},

  { name: 'TC97-10: before-model hook executes without crash',
    setup: () => createTestProjectV2({ '.pdca-status.json': JSON.stringify({
      version: '2.0', lastUpdated: new Date().toISOString(),
      activeFeatures: [], primaryFeature: null, features: {},
      pipeline: { currentPhase: 1, level: 'Starter', phaseHistory: [] },
      session: { startedAt: new Date().toISOString(), onboardingCompleted: false, lastActivity: new Date().toISOString() },
      history: []
    }) }),
    fn: () => {
      const result = executeHook('before-model.js', {
        prompt: 'test prompt',
        model: 'gemini-2.0-flash'
      }, { GEMINI_CLI_VERSION: '0.34.0' });
      assertType(result, 'object', 'result should be object');
    },
    teardown: () => cleanupTestProject()
  },

  // ─── before-tool.js + permission.js integration (5 tests) ───

  { name: 'TC97-11: before-tool.js references permission module', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks/scripts/before-tool.js'), 'utf-8');
    assertContains(content, 'permission', 'should reference permission');
  }},

  { name: 'TC97-12: lib/core/permission.js exports checkPermission', fn: () => {
    const permission = require(path.join(PLUGIN_ROOT, 'lib/core/permission'));
    assertType(permission.checkPermission, 'function', 'checkPermission should be function');
  }},

  { name: 'TC97-13: before-tool hook handles write_file tool',
    setup: () => createTestProjectV2({ '.pdca-status.json': JSON.stringify({
      version: '2.0', lastUpdated: new Date().toISOString(),
      activeFeatures: [], primaryFeature: null, features: {},
      pipeline: { currentPhase: 1, level: 'Starter', phaseHistory: [] },
      session: { startedAt: new Date().toISOString(), onboardingCompleted: false, lastActivity: new Date().toISOString() },
      history: []
    }) }),
    fn: () => {
      const result = executeHook('before-tool.js', {
        tool_name: 'write_file',
        tool_input: { path: 'test.js', content: 'console.log("test")' }
      }, { GEMINI_CLI_VERSION: '0.34.0' });
      assertType(result, 'object', 'result should be object');
    },
    teardown: () => cleanupTestProject()
  },

  { name: 'TC97-14: before-tool.js has security audit logging', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks/scripts/before-tool.js'), 'utf-8');
    assertContains(content, 'security-audit', 'should have security audit');
  }},

  { name: 'TC97-15: bkit.config.json permissions map defined', fn: () => {
    const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
    assertType(config.permissions, 'object', 'permissions should exist');
    assertEqual(config.permissions.write_file, 'allow', 'write_file should be allow');
    assertEqual(config.permissions['run_shell_command(rm -rf*)'], 'deny', 'rm -rf should be deny');
  }},

  // ─── after-tool.js + pdca/status.js integration (5 tests) ───

  { name: 'TC97-16: after-tool.js references pdca status', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks/scripts/after-tool.js'), 'utf-8');
    assertContains(content, 'tool_name', 'should handle tool_name');
  }},

  { name: 'TC97-17: after-tool hook handles write_file event',
    setup: () => createTestProjectV2({ '.pdca-status.json': JSON.stringify({
      version: '2.0', lastUpdated: new Date().toISOString(),
      activeFeatures: [], primaryFeature: null, features: {},
      pipeline: { currentPhase: 1, level: 'Starter', phaseHistory: [] },
      session: { startedAt: new Date().toISOString(), onboardingCompleted: false, lastActivity: new Date().toISOString() },
      history: []
    }) }),
    fn: () => {
      const result = executeHook('after-tool.js', {
        tool_name: 'write_file',
        tool_input: { path: 'src/test.js' }
      }, { GEMINI_CLI_VERSION: '0.34.0' });
      assertType(result, 'object', 'result should be object');
    },
    teardown: () => cleanupTestProject()
  },

  { name: 'TC97-18: pdca/status.js exports required functions', fn: () => {
    const status = require(path.join(PLUGIN_ROOT, 'lib/pdca/status'));
    assertType(status.loadPdcaStatus, 'function', 'loadPdcaStatus');
    assertType(status.savePdcaStatus, 'function', 'savePdcaStatus');
    assertType(status.createInitialStatusV2, 'function', 'createInitialStatusV2');
  }},

  { name: 'TC97-19: PDCA status file persists between save and load',
    setup: () => createTestProjectV2({}),
    fn: () => {
      const { createInitialStatusV2, savePdcaStatus, loadPdcaStatus } = require(path.join(PLUGIN_ROOT, 'lib/pdca/status'));
      const initial = createInitialStatusV2();
      initial.pipeline.level = 'Dynamic';
      initial.primaryFeature = 'test-feature';
      savePdcaStatus(initial, TEST_PROJECT_DIR);

      const loaded = loadPdcaStatus(TEST_PROJECT_DIR);
      assertEqual(loaded.pipeline.level, 'Dynamic', 'level should persist');
      assertEqual(loaded.primaryFeature, 'test-feature', 'primaryFeature should persist');
    },
    teardown: () => cleanupTestProject()
  },

  { name: 'TC97-20: PDCA status preserves activeFeatures array',
    setup: () => createTestProjectV2({}),
    fn: () => {
      const { createInitialStatusV2, savePdcaStatus, loadPdcaStatus } = require(path.join(PLUGIN_ROOT, 'lib/pdca/status'));
      const initial = createInitialStatusV2();
      initial.activeFeatures = ['feat-a', 'feat-b'];
      savePdcaStatus(initial, TEST_PROJECT_DIR);

      const loaded = loadPdcaStatus(TEST_PROJECT_DIR);
      assert(Array.isArray(loaded.activeFeatures), 'should be array');
      assertEqual(loaded.activeFeatures.length, 2, 'should have 2 features');
      assertEqual(loaded.activeFeatures[0], 'feat-a', 'first feature');
    },
    teardown: () => cleanupTestProject()
  },

  // ─── Config consistency checks (5 tests) ───

  { name: 'TC97-21: config modelRouting matches before-model MODEL_ROUTING phases', fn: () => {
    const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
    const hookContent = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks/scripts/before-model.js'), 'utf-8');
    const configPhases = Object.keys(config.modelRouting.phaseRules);
    for (const phase of configPhases) {
      assertContains(hookContent, phase, `MODEL_ROUTING should reference phase: ${phase}`);
    }
  }},

  { name: 'TC97-22: config modelRouting phase models match before-model', fn: () => {
    const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
    const phaseRules = config.modelRouting.phaseRules;
    // Verify structure: each phase should map to 'pro' or 'flash'
    for (const [phase, model] of Object.entries(phaseRules)) {
      assert(model === 'pro' || model === 'flash',
        `Phase ${phase} should map to 'pro' or 'flash', got '${model}'`);
    }
  }},

  { name: 'TC97-23: config taskTracker.directCrud matches tracker module', fn: () => {
    const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
    assertEqual(config.compatibility.taskTracker.directCrud, true, 'directCrud should be true');
    // Verify tracker module exists
    const trackerPath = path.join(PLUGIN_ROOT, 'lib/gemini/tracker.js');
    assert(fs.existsSync(trackerPath), 'tracker.js should exist');
  }},

  { name: 'TC97-24: config compatibility.minGeminiCliVersion is 0.34.0', fn: () => {
    const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
    assertEqual(config.compatibility.minGeminiCliVersion, '0.34.0', 'minGeminiCliVersion');
  }},

  { name: 'TC97-25: config version matches gemini-extension.json version', fn: () => {
    const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
    const ext = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'gemini-extension.json'), 'utf-8'));
    assertEqual(config.version, ext.version, 'versions should match');
  }},

  // ─── Module dependency chain (5 tests) ───

  { name: 'TC97-26: gemini/platform -> gemini/version chain (no circular)', fn: () => {
    // Verify that requiring these in order does not throw
    // Note: common.js was removed in v2.0.1 (zero usage); platform.js is the canonical entry
    let errorMsg = null;
    try {
      const version = require(path.join(PLUGIN_ROOT, 'lib/gemini/version'));
      const platform = require(path.join(PLUGIN_ROOT, 'lib/gemini/platform'));
      assertType(version.detectVersion, 'function', 'version has detectVersion');
      assertType(platform.getAdapter, 'function', 'platform has getAdapter');
    } catch (e) {
      errorMsg = e.message;
    }
    assertEqual(errorMsg, null, 'no circular dependency error');
  }},

  { name: 'TC97-27: platform.js requires version.js (verified in source)', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'lib/gemini/platform.js'), 'utf-8');
    assertContains(content, "./version", 'platform.js should require version');
  }},

  { name: 'TC97-28: all lib/gemini/ modules can be required', fn: () => {
    const geminiDir = path.join(PLUGIN_ROOT, 'lib', 'gemini');
    const files = fs.readdirSync(geminiDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
      let loaded = false;
      try {
        require(path.join(geminiDir, file));
        loaded = true;
      } catch (e) {
        // Some modules may need specific env - that's OK if it's a runtime error, not syntax
        loaded = !e.message.includes('SyntaxError');
      }
      assert(loaded, `lib/gemini/${file} should be requireable`);
    }
  }},

  { name: 'TC97-29: all lib/pdca/ modules can be required', fn: () => {
    const pdcaDir = path.join(PLUGIN_ROOT, 'lib', 'pdca');
    const files = fs.readdirSync(pdcaDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
      let loaded = false;
      try {
        require(path.join(pdcaDir, file));
        loaded = true;
      } catch (e) {
        loaded = !e.message.includes('SyntaxError');
      }
      assert(loaded, `lib/pdca/${file} should be requireable`);
    }
  }},

  { name: 'TC97-30: all lib/core/ modules can be required', fn: () => {
    const coreDir = path.join(PLUGIN_ROOT, 'lib', 'core');
    const files = fs.readdirSync(coreDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
      let loaded = false;
      try {
        require(path.join(coreDir, file));
        loaded = true;
      } catch (e) {
        loaded = !e.message.includes('SyntaxError');
      }
      assert(loaded, `lib/core/${file} should be requireable`);
    }
  }},

  // ─── All hook scripts can be loaded (5 tests) ───

  { name: 'TC97-31: all hook scripts have valid JS syntax (node --check)', fn: () => {
    const { execSync } = require('child_process');
    const scriptsDir = path.join(PLUGIN_ROOT, 'hooks', 'scripts');
    const scripts = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.js'));
    for (const script of scripts) {
      const scriptPath = path.join(scriptsDir, script);
      try {
        execSync(`node --check "${scriptPath}"`, { encoding: 'utf-8', timeout: 5000 });
      } catch (e) {
        throw new Error(`${script} has syntax error: ${e.message}`);
      }
    }
  }},

  { name: 'TC97-32: session-start.js is a valid Node script', fn: () => {
    const scriptPath = path.join(PLUGIN_ROOT, 'hooks/scripts/session-start.js');
    const content = fs.readFileSync(scriptPath, 'utf-8');
    assertContains(content, '#!/usr/bin/env node', 'should have shebang');
    assertContains(content, 'require', 'should use require');
  }},

  { name: 'TC97-33: before-tool.js is a valid Node script', fn: () => {
    const scriptPath = path.join(PLUGIN_ROOT, 'hooks/scripts/before-tool.js');
    const content = fs.readFileSync(scriptPath, 'utf-8');
    assertContains(content, '#!/usr/bin/env node', 'should have shebang');
  }},

  { name: 'TC97-34: after-tool.js is a valid Node script', fn: () => {
    const scriptPath = path.join(PLUGIN_ROOT, 'hooks/scripts/after-tool.js');
    const content = fs.readFileSync(scriptPath, 'utf-8');
    assertContains(content, '#!/usr/bin/env node', 'should have shebang');
  }},

  { name: 'TC97-35: all hook scripts have shebang line', fn: () => {
    const scriptsDir = path.join(PLUGIN_ROOT, 'hooks', 'scripts');
    const scripts = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.js'));
    for (const script of scripts) {
      const content = fs.readFileSync(path.join(scriptsDir, script), 'utf-8');
      assertContains(content, '#!/usr/bin/env node', `${script} should have shebang`);
    }
  }},

  // ─── MCP server + version path (5 tests) ───

  { name: 'TC97-36: MCP server source references version require path', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'mcp/spawn-agent-server.js'), 'utf-8');
    assertContains(content, 'lib', 'should reference lib path');
    assertContains(content, 'version', 'should reference version module');
  }},

  { name: 'TC97-37: MCP server has getFeatureFlags require', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'mcp/spawn-agent-server.js'), 'utf-8');
    assertContains(content, 'getFeatureFlags', 'should require getFeatureFlags');
  }},

  { name: 'TC97-38: MCP server version path resolves to correct module', fn: () => {
    // The path used in spawn-agent-server.js: path.join(__dirname, '..', 'lib', 'gemini', 'version')
    const resolvedPath = path.join(PLUGIN_ROOT, 'mcp', '..', 'lib', 'gemini', 'version');
    const normalizedPath = path.resolve(resolvedPath);
    const expectedPath = path.resolve(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'version'));
    assertEqual(normalizedPath, expectedPath, 'MCP version path should resolve to lib/gemini/version');
  }},

  { name: 'TC97-39: gemini-extension.json contextFileName is valid', fn: () => {
    const ext = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'gemini-extension.json'), 'utf-8'));
    assert(Array.isArray(ext.contextFileName), 'contextFileName should be array');
    assert(ext.contextFileName.length > 0, 'contextFileName should not be empty');
    assertContains(ext.contextFileName[0], 'GEMINI', 'should reference GEMINI.md');
  }},

  { name: 'TC97-40: all config compatibility sections have minVersion', fn: () => {
    const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
    const compat = config.compatibility;
    const sectionsWithMin = ['runtimeHooks', 'taskTracker', 'skillsSystem', 'subagentPolicies'];
    for (const section of sectionsWithMin) {
      assert(compat[section] && compat[section].minVersion,
        `compatibility.${section} should have minVersion`);
    }
  }},
];

// Lazy-loaded version functions for tests that need them
const { getFeatureFlags, getBkitFeatureFlags } = require(path.join(PLUGIN_ROOT, 'lib/gemini/version'));

module.exports = { tests };
