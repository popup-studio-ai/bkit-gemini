// TC-61: Security Version Tests (10 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertType } = require('../test-utils');
const path = require('path');
const fs = require('fs');
const { withVersion } = require('../test-utils');

const { detectVersion, parseVersion, isValidSemVer, getFeatureFlags } = require(path.join(PLUGIN_ROOT, 'lib/adapters/gemini/version-detector'));

const tests = [
  { name: 'TC61-01: malformed version string 처리', fn: () => {
    assert(!isValidSemVer('not-a-version'), 'Should reject non-semver');
  }},
  { name: 'TC61-02: negative version number 처리', fn: () => {
    assert(!isValidSemVer('-1.0.0'), 'Should reject negative version');
  }},
  { name: 'TC61-03: extremely large version 처리', fn: () => {
    const result = isValidSemVer('999.999.999');
    assertType(result, 'boolean', 'Should return boolean for large version');
  }},
  { name: 'TC61-04: empty string version 처리', fn: () => {
    assert(!isValidSemVer(''), 'Should reject empty string');
  }},
  { name: 'TC61-05: null version 처리', fn: () => {
    assert(!isValidSemVer(null), 'Should reject null');
  }},
  { name: 'TC61-06: version injection attack 방어', fn: () => {
    assert(!isValidSemVer('1.0.0; rm -rf /'), 'Should reject injection');
  }},
  { name: 'TC61-07: parseVersion 유효 버전', fn: () => {
    const v = parseVersion('0.31.0');
    assertEqual(v.major, 0, 'Major should be 0');
    assertEqual(v.minor, 31, 'Minor should be 31');
    assertEqual(v.patch, 0, 'Patch should be 0');
  }},
  { name: 'TC61-08: parseVersion 무효 버전 → 기본값 객체', fn: () => {
    const v = parseVersion('invalid');
    // Returns default version object (v0.29.0) for invalid input
    assert(v !== null && v !== undefined, 'Should return default object');
    assertEqual(v.minor, 29, 'Invalid input defaults to 0.29.0');
  }},
  { name: 'TC61-09: getFeatureFlags 안전한 기본값', fn: () => {
    withVersion('0.26.0', () => {
      const flags = getFeatureFlags();
      assert(flags !== undefined, 'Should return flags object');
    });
  }},
  { name: 'TC61-10: version with extra dots 처리', fn: () => {
    assert(!isValidSemVer('1.2.3.4'), 'Should reject extra dots');
  }}
];

module.exports = { tests };
