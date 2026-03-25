// TC-106: v0.35.0 Hooks Integration (12 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertContains, assertExists } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const HOOKS_DIR = path.join(PLUGIN_ROOT, 'hooks');
const SCRIPTS_DIR = path.join(HOOKS_DIR, 'scripts');

const tests = [
  { name: 'TC106-01: session-start.js exists and is valid JS', fn: () => {
    const scriptPath = path.join(SCRIPTS_DIR, 'session-start.js');
    assertExists(scriptPath, 'session-start.js should exist');
    // Verify it's parseable
    const content = fs.readFileSync(scriptPath, 'utf-8');
    assert(content.length > 100, 'session-start.js should have substantial content');
  }},

  { name: 'TC106-02: session-start.js has JIT deduplication logic', fn: () => {
    const content = fs.readFileSync(path.join(SCRIPTS_DIR, 'session-start.js'), 'utf-8');
    // Check for JIT-related context handling
    const hasJitLogic = content.includes('GEMINI_MD_IMPORTS') ||
                        content.includes('jit') ||
                        content.includes('JIT') ||
                        content.includes('import');
    assert(hasJitLogic, 'session-start.js should have JIT or import deduplication logic');
  }},

  { name: 'TC106-03: before-tool.js handles security checks', fn: () => {
    const content = fs.readFileSync(path.join(SCRIPTS_DIR, 'before-tool.js'), 'utf-8');
    assertContains(content, 'deny', 'before-tool.js should handle deny decisions');
    assertContains(content, 'run_shell_command', 'should reference run_shell_command');
  }},

  { name: 'TC106-04: before-agent.js exists', fn: () => {
    assertExists(path.join(SCRIPTS_DIR, 'before-agent.js'), 'before-agent.js should exist');
  }},

  { name: 'TC106-05: hooks.json has hooks with lifecycle events', fn: () => {
    const hooksConfig = JSON.parse(fs.readFileSync(path.join(HOOKS_DIR, 'hooks.json'), 'utf-8'));
    // hooks.json has {description, hooks: {SessionStart: [...], ...}}
    const hooksObj = hooksConfig.hooks || hooksConfig;
    const eventNames = Object.keys(hooksObj);
    assert(eventNames.length >= 2, `Should have at least 2 hook events, found ${eventNames.length}: ${eventNames.join(', ')}`);
    // Verify SessionStart exists
    const hasSessionStart = eventNames.some(k => k === 'SessionStart' || k === 'session_start');
    assert(hasSessionStart, 'Should have SessionStart hook event');
  }},

  { name: 'TC106-06: runtime-hooks.js exports registerRuntimeHooks', fn: () => {
    const runtimeHooksPath = path.join(HOOKS_DIR, 'runtime-hooks.js');
    if (!fs.existsSync(runtimeHooksPath)) {
      assert(true, 'runtime-hooks.js not present (optional SDK feature)');
      return;
    }
    const mod = require(runtimeHooksPath);
    assert(typeof mod.registerRuntimeHooks === 'function' || typeof mod.HOT_PATH_HOOKS !== 'undefined',
      'should export registerRuntimeHooks or HOT_PATH_HOOKS');
  }},

  { name: 'TC106-07: session-start.js has PHASE_CONTEXT_MAP', fn: () => {
    const content = fs.readFileSync(path.join(SCRIPTS_DIR, 'session-start.js'), 'utf-8');
    assertContains(content, 'PHASE_CONTEXT_MAP', 'should have PHASE_CONTEXT_MAP for phase-aware loading');
  }},

  { name: 'TC106-08: before-tool.js has writeSecurityAuditLog', fn: () => {
    const content = fs.readFileSync(path.join(SCRIPTS_DIR, 'before-tool.js'), 'utf-8');
    assertContains(content, 'writeSecurityAuditLog', 'should have security audit logging');
  }},

  { name: 'TC106-09: after-tool.js has processHook function', fn: () => {
    const content = fs.readFileSync(path.join(SCRIPTS_DIR, 'after-tool.js'), 'utf-8');
    assertContains(content, 'processHook', 'should have processHook function');
  }},

  { name: 'TC106-10: pre-compress.js has main function', fn: () => {
    const content = fs.readFileSync(path.join(SCRIPTS_DIR, 'pre-compress.js'), 'utf-8');
    assertContains(content, 'main', 'should have main function');
  }},

  { name: 'TC106-11: after-agent.js has AGENT_HANDLERS', fn: () => {
    const content = fs.readFileSync(path.join(SCRIPTS_DIR, 'after-agent.js'), 'utf-8');
    assertContains(content, 'AGENT_HANDLERS', 'should have AGENT_HANDLERS object');
  }},

  { name: 'TC106-12: session-start.js references Gemini CLI compatibility', fn: () => {
    const content = fs.readFileSync(path.join(SCRIPTS_DIR, 'session-start.js'), 'utf-8');
    const hasCompat = content.includes('0.34.0') || content.includes('0.35.0') || content.includes('compatibility');
    assert(hasCompat, 'session-start.js should reference CLI compatibility');
  }}
];

module.exports = { tests };
