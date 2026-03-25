// TC-84: Gemini Policy Module Tests (22 TC)
const { PLUGIN_ROOT, assert, assertEqual } = require('../test-utils');
const path = require('path');

const {
  SUBAGENT_POLICY_GROUPS,
  LEVEL_POLICY_TEMPLATES,
  generateSubagentRules,
  convertToToml,
  validateTomlStructure,
  mapDecision,
  getPriority,
  escapeTomlString,
  parsePermissionKey,
  generateExtensionPolicy
} = require(path.join(PLUGIN_ROOT, 'lib/gemini/policy'));

const tests = [
  // ─── SUBAGENT_POLICY_GROUPS (6 tests) ─────────────────────

  { name: 'TC84-01: SUBAGENT_POLICY_GROUPS exists and is an object', fn: () => {
    assert(SUBAGENT_POLICY_GROUPS !== null && typeof SUBAGENT_POLICY_GROUPS === 'object', 'SUBAGENT_POLICY_GROUPS should be an object');
  }},
  { name: 'TC84-02: SUBAGENT_POLICY_GROUPS is frozen', fn: () => {
    assert(Object.isFrozen(SUBAGENT_POLICY_GROUPS), 'SUBAGENT_POLICY_GROUPS should be frozen');
  }},
  { name: 'TC84-03: SUBAGENT_POLICY_GROUPS has readonly and docwrite groups', fn: () => {
    assert('readonly' in SUBAGENT_POLICY_GROUPS, 'should have readonly group');
    assert('docwrite' in SUBAGENT_POLICY_GROUPS, 'should have docwrite group');
  }},
  { name: 'TC84-04: readonly group has 8 agents and 3 deny rules', fn: () => {
    const ro = SUBAGENT_POLICY_GROUPS.readonly;
    assertEqual(ro.agents.length, 8, 'readonly should have 8 agents');
    assertEqual(ro.rules.length, 3, 'readonly should have 3 deny rules');
    ro.rules.forEach(r => assertEqual(r.decision, 'deny', 'readonly rules should all be deny'));
  }},
  { name: 'TC84-05: readonly deny rules cover run_shell_command, write_file, replace', fn: () => {
    const toolNames = SUBAGENT_POLICY_GROUPS.readonly.rules.map(r => r.toolName).sort();
    assertEqual(toolNames[0], 'replace', 'should deny replace');
    assertEqual(toolNames[1], 'run_shell_command', 'should deny run_shell_command');
    assertEqual(toolNames[2], 'write_file', 'should deny write_file');
  }},
  { name: 'TC84-06: docwrite group has 6 agents and 1 deny rule (run_shell_command only)', fn: () => {
    const dw = SUBAGENT_POLICY_GROUPS.docwrite;
    assertEqual(dw.agents.length, 6, 'docwrite should have 6 agents');
    assertEqual(dw.rules.length, 1, 'docwrite should have 1 rule');
    assertEqual(dw.rules[0].toolName, 'run_shell_command', 'docwrite rule should be run_shell_command');
  }},

  // ─── generateSubagentRules (4 tests) ─────────────────────

  { name: 'TC84-07: generateSubagentRules produces string with subagent = entries', fn: () => {
    const output = generateSubagentRules();
    assert(typeof output === 'string', 'output should be a string');
    assert(output.includes('subagent ='), 'output should contain subagent = entries');
  }},
  { name: 'TC84-08: generateSubagentRules output contains gap-detector and code-analyzer', fn: () => {
    const output = generateSubagentRules();
    assert(output.includes('gap-detector'), 'should contain gap-detector');
    assert(output.includes('code-analyzer'), 'should contain code-analyzer');
  }},
  { name: 'TC84-09: generateSubagentRules DOES contain cto-lead and pdca-iterator (full tier)', fn: () => {
    const output = generateSubagentRules();
    assert(output.includes('cto-lead'), 'should contain cto-lead (full tier)');
    assert(output.includes('pdca-iterator'), 'should contain pdca-iterator (full tier)');
  }},

  // ─── LEVEL_POLICY_TEMPLATES (4 tests) ─────────────────────

  { name: 'TC84-10: LEVEL_POLICY_TEMPLATES has Starter, Dynamic, Enterprise', fn: () => {
    assert('Starter' in LEVEL_POLICY_TEMPLATES, 'should have Starter');
    assert('Dynamic' in LEVEL_POLICY_TEMPLATES, 'should have Dynamic');
    assert('Enterprise' in LEVEL_POLICY_TEMPLATES, 'should have Enterprise');
  }},
  { name: 'TC84-11: Starter has plan mode rules with decision deny', fn: () => {
    const planModeRules = LEVEL_POLICY_TEMPLATES.Starter.rules.filter(
      r => r.modes && r.modes.includes('plan')
    );
    assert(planModeRules.length > 0, 'Starter should have plan mode rules');
    planModeRules.forEach(r => assertEqual(r.decision, 'deny', 'Starter plan mode rules should deny'));
  }},
  { name: 'TC84-12: Dynamic has plan mode rules with decision ask_user', fn: () => {
    const planModeRules = LEVEL_POLICY_TEMPLATES.Dynamic.rules.filter(
      r => r.modes && r.modes.includes('plan')
    );
    assert(planModeRules.length > 0, 'Dynamic should have plan mode rules');
    planModeRules.forEach(r => assertEqual(r.decision, 'ask_user', 'Dynamic plan mode rules should ask_user'));
  }},

  // ─── convertToToml (2 tests) ─────────────────────

  { name: 'TC84-13: convertToToml with valid permissions produces valid TOML', fn: () => {
    const toml = convertToToml({ 'run_shell_command(rm -rf*)': 'deny', 'write_file': 'allow' });
    assert(typeof toml === 'string' && toml.length > 0, 'should produce non-empty string');
    assert(toml.includes('[[rule]]'), 'should contain [[rule]]');
    assert(toml.includes('decision = "deny"'), 'should contain deny decision');
  }},
  { name: 'TC84-14: convertToToml with empty returns empty string', fn: () => {
    assertEqual(convertToToml({}), '', 'empty object should return empty string');
    assertEqual(convertToToml(null), '', 'null should return empty string');
  }},

  // ─── validateTomlStructure (2 tests) ─────────────────────

  { name: 'TC84-15: validateTomlStructure returns false for missing decisions', fn: () => {
    const bad = '[[rule]]\ntoolName = "write_file"\n';
    assertEqual(validateTomlStructure(bad), false, 'should fail without decision');
  }},
  { name: 'TC84-16: validateTomlStructure returns false for lowercase toolname', fn: () => {
    const bad = '[[rule]]\ntoolname = "write_file"\ndecision = "deny"\n';
    assertEqual(validateTomlStructure(bad), false, 'should fail with lowercase toolname');
  }},

  // ─── mapDecision (1 test) ─────────────────────

  { name: 'TC84-17: mapDecision maps ask to ask_user', fn: () => {
    assertEqual(mapDecision('ask'), 'ask_user', 'ask should map to ask_user');
    assertEqual(mapDecision('deny'), 'deny', 'deny should stay deny');
    assertEqual(mapDecision('allow'), 'allow', 'allow should stay allow');
  }},

  // ─── getPriority (1 test) ─────────────────────

  { name: 'TC84-18: getPriority returns 100 for deny, 50 for ask_user, 10 for allow', fn: () => {
    assertEqual(getPriority('deny'), 100, 'deny priority should be 100');
    assertEqual(getPriority('ask_user'), 50, 'ask_user priority should be 50');
    assertEqual(getPriority('allow'), 10, 'allow priority should be 10');
  }},

  // ─── escapeTomlString (1 test) ─────────────────────

  { name: 'TC84-19: escapeTomlString escapes backslash and quotes', fn: () => {
    const result = escapeTomlString('path\\to\\"file"');
    assert(result.includes('\\\\'), 'should escape backslash');
    assert(result.includes('\\"'), 'should escape quotes');
  }},

  // ─── parsePermissionKey (1 test) ─────────────────────

  { name: 'TC84-20: parsePermissionKey extracts tool and pattern', fn: () => {
    const result = parsePermissionKey('run_shell_command(rm -rf*)');
    assertEqual(result.tool, 'run_shell_command', 'tool should be run_shell_command');
    assertEqual(result.pattern, 'rm -rf', 'pattern should be rm -rf (trimmed)');
    const simple = parsePermissionKey('write_file');
    assertEqual(simple.tool, 'write_file', 'tool should be write_file');
    assertEqual(simple.pattern, null, 'pattern should be null');
  }},

  // ─── generateExtensionPolicy (1 test) ─────────────────────

  { name: 'TC84-21: generateExtensionPolicy exists as function', fn: () => {
    assertEqual(typeof generateExtensionPolicy, 'function', 'generateExtensionPolicy should be a function');
  }},

  // ─── LEVEL_POLICY_TEMPLATES keys (1 test) ─────────────────────

  { name: 'TC84-22: LEVEL_POLICY_TEMPLATES has exactly Starter, Dynamic, Enterprise keys', fn: () => {
    const keys = Object.keys(LEVEL_POLICY_TEMPLATES).sort();
    assertEqual(keys.length, 3, 'should have 3 templates');
    assertEqual(keys[0], 'Dynamic', 'first key should be Dynamic');
    assertEqual(keys[1], 'Enterprise', 'second key should be Enterprise');
    assertEqual(keys[2], 'Starter', 'third key should be Starter');
  }}
];

module.exports = { tests };
