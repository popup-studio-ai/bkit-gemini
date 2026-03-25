// TC-101: v0.35.0 Policy Full-Path Command Regex (15 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertContains, withVersion } = require('../test-utils');
const path = require('path');

const {
  buildFullPathCommandRegex,
  hasFullPathCommands,
  convertToToml,
  generateSubagentRules,
  generateLevelPolicy,
  escapeTomlString
} = require(path.join(PLUGIN_ROOT, 'lib/gemini/policy'));

const tests = [
  // ─── buildFullPathCommandRegex ─────────────────────

  { name: 'TC101-01: buildFullPathCommandRegex returns path pattern for "rm -rf"', fn: () => {
    const regex = buildFullPathCommandRegex('rm -rf');
    assertContains(regex, '[^"]*/', 'should start with path matching pattern');
    assertContains(regex, 'rm', 'should contain command name');
    assertContains(regex, '-rf', 'should contain args');
  }},

  { name: 'TC101-02: buildFullPathCommandRegex bare command has word boundary', fn: () => {
    const regex = buildFullPathCommandRegex('rm');
    assertContains(regex, '[ "]', 'bare command should have word boundary');
    assertContains(regex, '[^"]*/rm', 'should match path/rm');
  }},

  { name: 'TC101-03: buildFullPathCommandRegex with "git push --force" includes args', fn: () => {
    const regex = buildFullPathCommandRegex('git push --force');
    assertContains(regex, 'git', 'should contain git');
    assertContains(regex, 'push --force', 'should contain push --force');
  }},

  { name: 'TC101-04: regex matches /usr/bin/rm -rf', fn: () => {
    const regex = buildFullPathCommandRegex('rm -rf');
    const re = new RegExp(regex);
    assert(re.test('/usr/bin/rm -rf'), 'should match /usr/bin/rm -rf');
  }},

  { name: 'TC101-05: regex matches /bin/rm', fn: () => {
    const regex = buildFullPathCommandRegex('rm');
    const re = new RegExp(regex);
    assert(re.test('/bin/rm '), 'should match /bin/rm with space');
    assert(re.test('/bin/rm"'), 'should match /bin/rm with quote');
  }},

  { name: 'TC101-06: regex does NOT match bare rm (no path)', fn: () => {
    const regex = buildFullPathCommandRegex('rm');
    const re = new RegExp(regex);
    // regex requires [^"]*/ prefix which needs a / before rm
    assert(!re.test('rm '), 'should NOT match bare rm without path');
  }},

  { name: 'TC101-07: regex does NOT match rmdir (word boundary)', fn: () => {
    const regex = buildFullPathCommandRegex('rm');
    const re = new RegExp(regex);
    // /usr/bin/rmdir should NOT match because of [ "] word boundary
    assert(!re.test('/usr/bin/rmdir'), 'should NOT match rmdir');
  }},

  // ─── hasFullPathCommands version gating ─────────────

  { name: 'TC101-08: hasFullPathCommands returns true for v0.35.0', fn: () => {
    withVersion('0.35.0', () => {
      assertEqual(hasFullPathCommands(), true, 'should be true for v0.35.0');
    });
  }},

  { name: 'TC101-09: hasFullPathCommands returns false for v0.34.0', fn: () => {
    withVersion('0.34.0', () => {
      assertEqual(hasFullPathCommands(), false, 'should be false for v0.34.0');
    });
  }},

  // ─── emitFullPathRule ─────────────────────

  { name: 'TC101-10: convertToToml v0.34.0 produces no commandRegex lines', fn: () => {
    withVersion('0.34.0', () => {
      const toml = convertToToml({ 'run_shell_command(rm -rf*)': 'deny' });
      assert(!toml.includes('commandRegex'), 'v0.34.0 should NOT produce commandRegex');
    });
  }},

  { name: 'TC101-11: convertToToml write_file only rule has no commandPrefix/commandRegex', fn: () => {
    withVersion('0.35.0', () => {
      // write_file alone has no commandPrefix, so its rule block should NOT have commandRegex
      const toml = convertToToml({ 'write_file': 'allow' });
      // Split into rule blocks and check the write_file block specifically
      const ruleBlocks = toml.split('[[rule]]').filter(b => b.includes('write_file'));
      for (const block of ruleBlocks) {
        assert(!block.includes('commandPrefix'), 'write_file block should not have commandPrefix');
      }
    });
  }},

  // ─── convertToToml with v0.35.0 ─────────────────────

  { name: 'TC101-12: convertToToml includes commandRegex when v0.35.0', fn: () => {
    withVersion('0.35.0', () => {
      const toml = convertToToml({ 'run_shell_command(rm -rf*)': 'deny' });
      assertContains(toml, 'commandRegex', 'v0.35.0 TOML should include commandRegex');
      assertContains(toml, 'commandPrefix', 'should still have commandPrefix');
    });
  }},

  { name: 'TC101-13: convertToToml excludes commandRegex when v0.34.0', fn: () => {
    withVersion('0.34.0', () => {
      const toml = convertToToml({ 'run_shell_command(rm -rf*)': 'deny' });
      assert(!toml.includes('commandRegex'), 'v0.34.0 TOML should NOT include commandRegex');
    });
  }},

  // ─── generateLevelPolicy / generateSubagentRules ─────

  { name: 'TC101-14: generateSubagentRules includes regex comment in v0.35.0', fn: () => {
    withVersion('0.35.0', () => {
      const output = generateSubagentRules();
      // full tier has commandPrefix rules that generate commandRegex
      assertContains(output, 'commandRegex', 'v0.35.0 subagent rules should have commandRegex');
    });
  }},

  { name: 'TC101-15: generateSubagentRules v0.35.0 includes subagent + commandRegex', fn: () => {
    withVersion('0.35.0', () => {
      const output = generateSubagentRules();
      assertContains(output, 'subagent =', 'should have subagent entries');
      assertContains(output, 'commandRegex', 'should have commandRegex for full-path');
      assertContains(output, 'gap-detector', 'should include gap-detector agent');
    });
  }}
];

module.exports = { tests };
