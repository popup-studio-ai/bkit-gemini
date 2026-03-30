// TC-38: Feature Flags Matrix Unit Tests (15 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertType, withVersion, getPdcaStatus } = require('../test-utils');
const path = require('path');

const vd = require(path.join(PLUGIN_ROOT, 'lib/gemini/version'));

const VERSION_FLAG_MATRIX = [
  { version: '0.26.0', expected: { hasPolicyEngine: false, hasTaskTracker: false } },
  { version: '0.28.0', expected: { hasPolicyEngine: false, hasToolAnnotations: false } },
  { version: '0.29.0', expected: { hasPolicyEngine: false } },
  { version: '0.30.0', expected: { hasPolicyEngine: true, hasProjectLevelPolicy: false } },
  { version: '0.31.0', expected: { hasPolicyEngine: true, hasProjectLevelPolicy: true, hasExtensionPolicies: false } },
  { version: '0.32.0', expected: { hasPolicyEngine: true, hasProjectLevelPolicy: true, hasExtensionPolicies: true, hasTaskTracker: true } },
  { version: '0.33.0', expected: { hasPolicyEngine: true, hasExtensionPolicies: true, hasTaskTracker: true } },
];

const tests = [];

// Dynamic matrix tests
for (const entry of VERSION_FLAG_MATRIX) {
  for (const [flag, expected] of Object.entries(entry.expected)) {
    tests.push({
      name: `TC38-${tests.length + 1}: v${entry.version} ${flag} = ${expected}`,
      fn: () => {
        withVersion(entry.version, () => {
          const flags = vd.getFeatureFlags();
          assertEqual(flags[flag], expected, `v${entry.version} ${flag} should be ${expected}`);
        });
      }
    });
  }
}

// Additional tests to reach 15
tests.push(
  {
    name: `TC38-${tests.length + 1}: 전체 플래그 키 일관성`,
    fn: () => {
      withVersion('0.32.0', () => {
        const flags = vd.getFeatureFlags();
        const keys = Object.keys(flags);
        assert(keys.length >= 10, `Should have >=10 flags at v0.32.0, found ${keys.length}`);
      });
    }
  },
  {
    name: `TC38-${tests.length + 2}: 플래그 값 boolean 타입만`,
    fn: () => {
      withVersion('0.32.0', () => {
        const flags = vd.getFeatureFlags();
        for (const [key, val] of Object.entries(flags)) {
          assertType(val, 'boolean', `Flag ${key} should be boolean`);
        }
      });
    }
  }
);

module.exports = { tests };
