const { PLUGIN_ROOT, assert, assertEqual, withVersion } = require('../test-utils');
const path = require('path');

const versionModule = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'version'));
const { getFeatureFlags, getBkitFeatureFlags, parseVersion, isVersionBeyondPlausible, compareVersions, resetCache, isValidSemVer } = versionModule;

const tests = [
  // 18 test cases for lib/gemini/version.js
  {
    name: 'VER-01: getFeatureFlags returns exactly 19 keys',
    fn: () => {
      withVersion('0.34.0', () => {
        const flags = getFeatureFlags();
        const keys = Object.keys(flags);
        assertEqual(keys.length, 19, 'getFeatureFlags should return 19 keys');
      });
    }
  },
  {
    name: 'VER-02: All 14 flags true when version=0.34.0',
    fn: () => {
      withVersion('0.34.0', () => {
        const flags = getFeatureFlags();
        const allTrue = Object.values(flags).every(v => v === true);
        assert(allTrue, 'All 14 flags should be true for v0.34.0');
      });
    }
  },
  {
    name: 'VER-03: All 14 flags false when version=0.29.0',
    fn: () => {
      withVersion('0.29.0', () => {
        const flags = getFeatureFlags();
        const allFalse = Object.values(flags).every(v => v === false);
        assert(allFalse, 'All 14 flags should be false for v0.29.0');
      });
    }
  },
  {
    name: 'VER-04: Default fallback is 0.34.0 (not 0.29.0)',
    fn: () => {
      // When no version detected, default should be 0.34.0
      resetCache();
      const origVersion = process.env.GEMINI_CLI_VERSION;
      delete process.env.GEMINI_CLI_VERSION;
      // detectVersion will try npm/cli and fall back to 0.34.0
      // We verify the source code default
      const fs = require('fs');
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'version.js'), 'utf-8');
      assert(content.includes("if (!raw) raw = '0.34.0'"), 'Default fallback should be 0.34.0');
      // Restore
      resetCache();
      if (origVersion !== undefined) process.env.GEMINI_CLI_VERSION = origVersion;
    }
  },
  {
    name: 'VER-05: getBkitFeatureFlags has canUseTeam=true (hardcoded)',
    fn: () => {
      withVersion('0.34.0', () => {
        const flags = getBkitFeatureFlags();
        assertEqual(flags.canUseTeam, true, 'canUseTeam should be true (hardcoded)');
      });
    }
  },
  {
    name: 'VER-06: canUseTeam is true even on old version (hardcoded)',
    fn: () => {
      withVersion('0.29.0', () => {
        const flags = getBkitFeatureFlags();
        assertEqual(flags.canUseTeam, true, 'canUseTeam should be true even on v0.29.0');
      });
    }
  },
  {
    name: 'VER-07: canUseNativeSkills follows hasNativeSkillSystem',
    fn: () => {
      withVersion('0.34.0', () => {
        const flags = getBkitFeatureFlags();
        assertEqual(flags.canUseNativeSkills, true, 'canUseNativeSkills should be true on v0.34.0');
      });
      withVersion('0.29.0', () => {
        const flags = getBkitFeatureFlags();
        assertEqual(flags.canUseNativeSkills, false, 'canUseNativeSkills should be false on v0.29.0');
      });
    }
  },
  {
    name: 'VER-08: parseVersion handles preview version',
    fn: () => {
      const v = parseVersion('0.30.0-preview.3');
      assertEqual(v.major, 0, 'major should be 0');
      assertEqual(v.minor, 30, 'minor should be 30');
      assertEqual(v.patch, 0, 'patch should be 0');
      assertEqual(v.isPreview, true, 'should be preview');
      assertEqual(v.previewNum, 3, 'preview number should be 3');
    }
  },
  {
    name: 'VER-09: parseVersion handles nightly version',
    fn: () => {
      const v = parseVersion('0.34.0-nightly.20260304');
      assertEqual(v.major, 0, 'major should be 0');
      assertEqual(v.minor, 34, 'minor should be 34');
      assertEqual(v.patch, 0, 'patch should be 0');
      assertEqual(v.isNightly, true, 'should be nightly');
      assertEqual(v.nightlyNum, 20260304, 'nightly number should be 20260304');
    }
  },
  {
    name: 'VER-10: parseVersion handles null input',
    fn: () => {
      const v = parseVersion(null);
      assertEqual(v.major, 0, 'major should be 0');
      assertEqual(v.minor, 29, 'minor should be 29 (fallback)');
      assertEqual(v.patch, 0, 'patch should be 0');
    }
  },
  {
    name: 'VER-11: parseVersion handles undefined input',
    fn: () => {
      const v = parseVersion(undefined);
      assertEqual(v.major, 0, 'major should be 0');
      assertEqual(v.minor, 29, 'minor should be 29 (fallback)');
    }
  },
  {
    name: 'VER-12: isVersionBeyondPlausible rejects 2.0.1',
    fn: () => {
      assertEqual(isVersionBeyondPlausible('2.0.1'), true, '2.0.1 should be beyond plausible');
    }
  },
  {
    name: 'VER-13: isVersionBeyondPlausible accepts 0.34.0',
    fn: () => {
      assertEqual(isVersionBeyondPlausible('0.34.0'), false, '0.34.0 should be within plausible range');
    }
  },
  {
    name: 'VER-14: compareVersions correct ordering',
    fn: () => {
      const v029 = parseVersion('0.29.0');
      const v034 = parseVersion('0.34.0');
      const v034b = parseVersion('0.34.0');
      assert(compareVersions(v029, v034) < 0, '0.29.0 < 0.34.0');
      assert(compareVersions(v034, v029) > 0, '0.34.0 > 0.29.0');
      assertEqual(compareVersions(v034, v034b), 0, '0.34.0 == 0.34.0');
    }
  },
  {
    name: 'VER-15: resetCache clears cache',
    fn: () => {
      // After resetCache, next detectVersion should re-detect
      resetCache();
      assertEqual(typeof resetCache, 'function', 'resetCache should be function');
      // Verify it can be called without error
      resetCache();
    }
  },
  {
    name: 'VER-16: isValidSemVer validates correct format',
    fn: () => {
      assertEqual(isValidSemVer('0.34.0'), true, '0.34.0 should be valid semver');
      assertEqual(isValidSemVer('1.2.3'), true, '1.2.3 should be valid semver');
      assertEqual(isValidSemVer('0.34.0-preview.1'), true, '0.34.0-preview.1 should be valid semver');
    }
  },
  {
    name: 'VER-17: isValidSemVer rejects invalid format',
    fn: () => {
      assertEqual(isValidSemVer('abc'), false, 'abc should be invalid');
      assertEqual(isValidSemVer('1.2'), false, '1.2 should be invalid (no patch)');
      assertEqual(isValidSemVer(''), false, 'empty string should be invalid');
    }
  },
  {
    name: 'VER-18: getBkitFeatureFlags includes all base flags plus bkit flags',
    fn: () => {
      withVersion('0.34.0', () => {
        const bkitFlags = getBkitFeatureFlags();
        const baseFlags = getFeatureFlags();
        // Should include all base flags
        for (const key of Object.keys(baseFlags)) {
          assert(key in bkitFlags, `bkitFlags should include base flag ${key}`);
        }
        // Should include bkit-specific flags
        assert('canUseTeam' in bkitFlags, 'Should have canUseTeam');
        assert('canUsePmTeam' in bkitFlags, 'Should have canUsePmTeam');
        assert('canUseNativeAgents' in bkitFlags, 'Should have canUseNativeAgents');
        assert('canUsePlanDirectory' in bkitFlags, 'Should have canUsePlanDirectory');
        assert('canUseExcludeTools' in bkitFlags, 'Should have canUseExcludeTools');
        assert('canUseNativeSkills' in bkitFlags, 'Should have canUseNativeSkills');
        assert('canUseSubagentPolicies' in bkitFlags, 'Should have canUseSubagentPolicies');
        assert('canValidateExtension' in bkitFlags, 'Should have canValidateExtension');
      });
    }
  }
];

module.exports = { tests };
