// TC-108: v0.35.0 Security Full-Path Verification (12 TC)
const { PLUGIN_ROOT, assert, assertEqual } = require('../test-utils');
const path = require('path');

const {
  buildFullPathCommandRegex,
  escapeTomlString,
  validateTomlStructure
} = require(path.join(PLUGIN_ROOT, 'lib/gemini/policy'));

const tests = [
  // ─── Full-path regex security scenarios ─────────────

  { name: 'TC108-01: /usr/bin/rm -rf / matches deny regex', fn: () => {
    const regex = buildFullPathCommandRegex('rm -rf');
    const re = new RegExp(regex);
    assert(re.test('/usr/bin/rm -rf'), 'should match /usr/bin/rm -rf');
    assert(re.test('/usr/local/bin/rm -rf'), 'should match /usr/local/bin/rm -rf');
  }},

  { name: 'TC108-02: /bin/rm -rf / matches deny regex', fn: () => {
    const regex = buildFullPathCommandRegex('rm -rf');
    const re = new RegExp(regex);
    assert(re.test('/bin/rm -rf'), 'should match /bin/rm -rf');
  }},

  { name: 'TC108-03: /usr/local/bin/git push --force matches', fn: () => {
    const regex = buildFullPathCommandRegex('git push --force');
    const re = new RegExp(regex);
    assert(re.test('/usr/local/bin/git push --force'), 'should match full-path git push --force');
  }},

  { name: 'TC108-04: bare rm -rf still matched by commandPrefix', fn: () => {
    // This is tested at TOML level - commandPrefix handles bare commands
    // commandRegex only handles full-path variants
    const regex = buildFullPathCommandRegex('rm -rf');
    const re = new RegExp(regex);
    // Bare command should NOT match the full-path regex (that's by design)
    assert(!re.test('rm -rf'), 'bare rm -rf should NOT match full-path regex (commandPrefix handles it)');
  }},

  { name: 'TC108-05: ls command does NOT match rm deny regex', fn: () => {
    const regex = buildFullPathCommandRegex('rm -rf');
    const re = new RegExp(regex);
    assert(!re.test('/usr/bin/ls'), 'ls should NOT match rm -rf regex');
    assert(!re.test('ls -la'), 'bare ls should NOT match');
  }},

  { name: 'TC108-06: /usr/bin/ls does NOT match rm deny regex', fn: () => {
    const regex = buildFullPathCommandRegex('rm');
    const re = new RegExp(regex);
    assert(!re.test('/usr/bin/ls'), '/usr/bin/ls should NOT match rm regex');
  }},

  // ─── Regex special character escaping ─────────────

  { name: 'TC108-07: regex escapes special characters in command', fn: () => {
    const regex = buildFullPathCommandRegex('test.cmd');
    assert(regex.includes('test\\.cmd'), 'dot should be escaped');
  }},

  // ─── escapeTomlString security ─────────────

  { name: 'TC108-08: escapeTomlString handles backslash', fn: () => {
    const result = escapeTomlString('C:\\Windows\\System32');
    assert(result.includes('\\\\'), 'backslash should be double-escaped');
  }},

  { name: 'TC108-09: escapeTomlString handles quotes', fn: () => {
    const result = escapeTomlString('say "hello"');
    assert(result.includes('\\"'), 'quotes should be escaped');
  }},

  { name: 'TC108-10: escapeTomlString handles newline', fn: () => {
    const result = escapeTomlString('line1\nline2');
    assert(result.includes('\\n'), 'newline should be escaped');
    assert(!result.includes('\n'), 'literal newline should be removed');
  }},

  // ─── validateTomlStructure ─────────────

  { name: 'TC108-11: validateTomlStructure passes valid TOML', fn: () => {
    const valid = '[[rule]]\ntoolName = "write_file"\ndecision = "allow"\n';
    assertEqual(validateTomlStructure(valid), true, 'valid TOML should pass');
  }},

  { name: 'TC108-12: validateTomlStructure fails without decision', fn: () => {
    const invalid = '[[rule]]\ntoolName = "write_file"\n';
    assertEqual(validateTomlStructure(invalid), false, 'TOML without decision should fail');
  }}
];

module.exports = { tests };
