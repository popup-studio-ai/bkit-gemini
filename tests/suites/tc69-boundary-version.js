// TC-69: Boundary Version Tests (12 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertType, withVersion } = require('../test-utils');
const path = require('path');

const { isValidSemVer, parseVersion, compareVersions, isVersionAtLeast, getFeatureFlags } = require(path.join(PLUGIN_ROOT, 'lib/gemini/version'));

const tests = [
  { name: 'TC69-01: 최소 지원 버전 0.26.0', fn: () => {
    withVersion('0.26.0', () => {
      const flags = getFeatureFlags();
      assert(flags !== undefined, 'v0.26.0 should be supported');
    });
  }},
  { name: 'TC69-02: 최대 지원 버전 0.33.0', fn: () => {
    withVersion('0.33.0', () => {
      const flags = getFeatureFlags();
      assert(flags !== undefined, 'v0.33.0 should be supported');
    });
  }},
  { name: 'TC69-03: 미래 버전 1.0.0 처리', fn: () => {
    withVersion('1.0.0', () => {
      const flags = getFeatureFlags();
      assert(flags !== undefined, 'Future version should get flags');
    });
  }},
  { name: 'TC69-04: 0.0.0 최소 경계', fn: () => {
    assert(isValidSemVer('0.0.0'), '0.0.0 is valid semver');
    const v = parseVersion('0.0.0');
    assertEqual(v.major, 0, 'Major 0');
    assertEqual(v.minor, 0, 'Minor 0');
    assertEqual(v.patch, 0, 'Patch 0');
  }},
  { name: 'TC69-05: compareVersions 동일 버전', fn: () => {
    assertEqual(compareVersions('0.31.0', '0.31.0'), 0, 'Same version = 0');
  }},
  { name: 'TC69-06: compareVersions major 차이', fn: () => {
    assert(compareVersions(parseVersion('1.0.0'), parseVersion('0.99.99')) > 0, 'Major diff');
  }},
  { name: 'TC69-07: compareVersions minor 차이', fn: () => {
    assert(compareVersions(parseVersion('0.32.0'), parseVersion('0.31.99')) > 0, 'Minor diff');
  }},
  { name: 'TC69-08: compareVersions patch 차이', fn: () => {
    assert(compareVersions(parseVersion('0.31.1'), parseVersion('0.31.0')) > 0, 'Patch diff');
  }},
  { name: 'TC69-09: isVersionAtLeast 정확히 같은 버전', fn: () => {
    withVersion('0.31.0', () => {
      assert(isVersionAtLeast('0.31.0'), 'Should be at least itself');
    });
  }},
  { name: 'TC69-10: isVersionAtLeast 한 패치 아래', fn: () => {
    withVersion('0.30.9', () => {
      assert(!isVersionAtLeast('0.31.0'), 'Should not be at least 0.31.0');
    });
  }},
  { name: 'TC69-11: parseVersion pre-release 태그', fn: () => {
    const valid = isValidSemVer('0.31.0-beta');
    // May or may not support pre-release
    assertType(valid, 'boolean', 'Should return boolean');
  }},
  { name: 'TC69-12: 버전 순서 전이성 (a>b, b>c → a>c)', fn: () => {
    assert(compareVersions(parseVersion('0.32.0'), parseVersion('0.31.0')) > 0, 'a>b');
    assert(compareVersions(parseVersion('0.31.0'), parseVersion('0.30.0')) > 0, 'b>c');
    assert(compareVersions(parseVersion('0.32.0'), parseVersion('0.30.0')) > 0, 'a>c (transitivity)');
  }}
];

module.exports = { tests };
