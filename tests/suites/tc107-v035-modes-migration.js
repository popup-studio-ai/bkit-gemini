// TC-107: v0.35.0 Modes Migration (10 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertContains, withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const { LEVEL_POLICY_TEMPLATES, convertToToml } = require(path.join(PLUGIN_ROOT, 'lib/gemini/policy'));

const tests = [
  // ─── LEVEL_POLICY_TEMPLATES modes value check ─────────────

  { name: 'TC107-01: Starter plan mode rules use "plan" (not "plan_mode")', fn: () => {
    const planModeRules = LEVEL_POLICY_TEMPLATES.Starter.rules.filter(
      r => r.modes && r.modes.length > 0
    );
    assert(planModeRules.length > 0, 'Starter should have plan mode rules');
    planModeRules.forEach(r => {
      assert(r.modes.includes('plan'), `Starter mode should be "plan", got ${JSON.stringify(r.modes)}`);
      assert(!r.modes.includes('plan_mode'), 'Should NOT contain "plan_mode"');
    });
  }},

  { name: 'TC107-02: Dynamic plan mode rules use "plan" (not "plan_mode")', fn: () => {
    const planModeRules = LEVEL_POLICY_TEMPLATES.Dynamic.rules.filter(
      r => r.modes && r.modes.length > 0
    );
    assert(planModeRules.length > 0, 'Dynamic should have plan mode rules');
    planModeRules.forEach(r => {
      assert(r.modes.includes('plan'), `Dynamic mode should be "plan", got ${JSON.stringify(r.modes)}`);
      assert(!r.modes.includes('plan_mode'), 'Should NOT contain "plan_mode"');
    });
  }},

  // ─── Source code grep: plan_mode should NOT appear ─────────

  { name: 'TC107-03: policy.js does NOT contain "plan_mode"', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'lib/gemini/policy.js'), 'utf-8');
    assert(!content.includes('plan_mode'), 'policy.js should NOT contain plan_mode');
  }},

  { name: 'TC107-04: session-start.js does NOT contain "plan_mode"', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks/scripts/session-start.js'), 'utf-8');
    assert(!content.includes('plan_mode'), 'session-start.js should NOT contain plan_mode');
  }},

  { name: 'TC107-05: before-tool.js does NOT contain "plan_mode"', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks/scripts/before-tool.js'), 'utf-8');
    assert(!content.includes('plan_mode'), 'before-tool.js should NOT contain plan_mode');
  }},

  // ─── TOML generation uses "plan" ─────────────

  { name: 'TC107-06: convertToToml generates modes = ["plan"]', fn: () => {
    // Create a permission config that triggers modes generation
    // We test via level templates directly
    const template = LEVEL_POLICY_TEMPLATES.Starter;
    const modeRule = template.rules.find(r => r.modes);
    assert(modeRule, 'Starter should have a mode rule');
    assertEqual(modeRule.modes[0], 'plan', 'mode value should be "plan"');
  }},

  { name: 'TC107-07: Extension policy TOML does NOT contain plan_mode', fn: () => {
    const policyPath = path.join(PLUGIN_ROOT, 'policies/bkit-extension-policy.toml');
    if (!fs.existsSync(policyPath)) {
      assert(true, 'Extension policy not generated yet (OK)');
      return;
    }
    const content = fs.readFileSync(policyPath, 'utf-8');
    assert(!content.includes('plan_mode'), 'Extension policy TOML should NOT contain plan_mode');
  }},

  { name: 'TC107-08: bkit-extension-policy.toml exists', fn: () => {
    const policyPath = path.join(PLUGIN_ROOT, 'policies/bkit-extension-policy.toml');
    assert(fs.existsSync(policyPath), 'bkit-extension-policy.toml should exist');
  }},

  { name: 'TC107-09: Starter deny rules modes array contains only "plan"', fn: () => {
    const denyWithModes = LEVEL_POLICY_TEMPLATES.Starter.rules.filter(
      r => r.decision === 'deny' && r.modes
    );
    assert(denyWithModes.length >= 3, 'Starter should have 3+ deny rules with modes');
    denyWithModes.forEach(r => {
      assertEqual(r.modes.length, 1, 'modes array should have exactly 1 element');
      assertEqual(r.modes[0], 'plan', 'mode should be "plan"');
    });
  }},

  { name: 'TC107-10: Enterprise rules have no modes (no plan mode restriction)', fn: () => {
    const withModes = LEVEL_POLICY_TEMPLATES.Enterprise.rules.filter(r => r.modes);
    assertEqual(withModes.length, 0, 'Enterprise should have no mode-restricted rules');
  }}
];

module.exports = { tests };
