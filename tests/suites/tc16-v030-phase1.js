// tests/suites/tc16-v030-phase1.js
// Phase 1 - P0 Migration Tests for Gemini CLI v0.30.0
// bkit-gemini v1.5.5
// Task #14 - QA Strategist: Version compatibility and Policy Engine validation

const {
  PLUGIN_ROOT, TEST_PROJECT_DIR,
  createTestProject, cleanupTestProject,
  executeHook, assert, assertEqual, assertContains, assertExists
} = require('../test-utils');
const path = require('path');
const fs = require('fs');

const tests = [
  // ─────────────────────────────────────────────────────────────────
  // P1-02: testedVersions Config Validation
  // Analysis requirement: bkit.config.json must declare v0.30.0 tested
  // ─────────────────────────────────────────────────────────────────
  {
    name: 'P1-02: testedVersions includes "0.30.0"',
    fn: () => {
      const config = JSON.parse(fs.readFileSync(
        path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'
      ));
      const tested = config.compatibility?.testedVersions || [];
      assert(
        tested.includes('0.30.0'),
        'bkit.config.json compatibility.testedVersions must include "0.30.0" for v1.5.5 release'
      );
    }
  },

  {
    name: 'P1-02b: testedVersions includes at least one v0.29.x baseline',
    fn: () => {
      const config = JSON.parse(fs.readFileSync(
        path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'
      ));
      const tested = config.compatibility?.testedVersions || [];
      const hasBaseline = tested.some(v => v.startsWith('0.29.'));
      assert(hasBaseline, 'testedVersions must include at least one v0.29.x baseline version');
    }
  },

  // ─────────────────────────────────────────────────────────────────
  // P1-03 through P1-08: Policy TOML Generation Unit Tests
  // Module: lib/adapters/gemini/policy-migrator.js / convertToToml()
  // ─────────────────────────────────────────────────────────────────
  {
    name: 'P1-03: convertToToml() generates [[rule]] array syntax for deny rules',
    fn: () => {
      const { convertToToml } = require(path.join(
        PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'policy-migrator'
      ));
      const permissions = {
        'run_shell_command(rm -rf*)': 'deny',
      };
      const toml = convertToToml(permissions);
      assertContains(toml, '[[rule]]', 'Must use [[rule]] array-of-tables syntax');
      assertContains(toml, 'toolName = "run_shell_command"', 'Must have toolName field');
      assertContains(toml, 'decision = "deny"', 'Must have decision = "deny"');
      assertContains(toml, 'commandPrefix = "rm -rf"', 'Must strip trailing * from commandPrefix');
      assertContains(toml, 'priority = 100', 'Deny rules must have priority 100');
    }
  },

  {
    name: 'P1-04: convertToToml() maps "ask" to "ask_user" decision for Policy Engine',
    fn: () => {
      const { convertToToml } = require(path.join(
        PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'policy-migrator'
      ));
      const permissions = {
        'run_shell_command(rm -r*)': 'ask',
      };
      const toml = convertToToml(permissions);
      assertContains(toml, 'decision = "ask_user"',
        '"ask" bkit level must map to "ask_user" for Gemini CLI Policy Engine');
      assertContains(toml, 'priority = 50', 'Ask rules must have priority 50');
    }
  },

  {
    name: 'P1-05: convertToToml() generates allow rules with correct decision and priority',
    fn: () => {
      const { convertToToml } = require(path.join(
        PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'policy-migrator'
      ));
      const permissions = { 'write_file': 'allow' };
      const toml = convertToToml(permissions);
      assertContains(toml, '[[rule]]', 'Must use [[rule]] syntax for allow rules');
      assertContains(toml, 'decision = "allow"', 'Allow decision must be "allow"');
      assertContains(toml, 'priority = 10', 'Allow rules must have priority 10');
    }
  },

  {
    name: 'P1-06: convertToToml() orders deny > ask > allow sections by priority',
    fn: () => {
      const { convertToToml } = require(path.join(
        PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'policy-migrator'
      ));
      const permissions = {
        'write_file': 'allow',
        'run_shell_command(rm -rf*)': 'deny',
        'run_shell_command(rm -r*)': 'ask',
      };
      const toml = convertToToml(permissions);
      const denyIdx = toml.indexOf('Deny Rules');
      const askIdx = toml.indexOf('Ask Rules');
      const allowIdx = toml.indexOf('Allow Rules');
      assert(denyIdx !== -1, 'Deny Rules section must exist');
      assert(askIdx !== -1, 'Ask Rules section must exist');
      assert(allowIdx !== -1, 'Allow Rules section must exist');
      assert(denyIdx < askIdx, 'Deny section must appear before Ask section');
      assert(askIdx < allowIdx, 'Ask section must appear before Allow section');
    }
  },

  {
    name: 'P1-07: parsePermissionKey() strips trailing asterisk from commandPrefix',
    fn: () => {
      const { parsePermissionKey } = require(path.join(
        PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'policy-migrator'
      ));
      const result = parsePermissionKey('run_shell_command(rm -rf*)');
      assertEqual(result.tool, 'run_shell_command', 'Tool name should be extracted correctly');
      assertEqual(result.pattern, 'rm -rf',
        'Trailing asterisk (*) must be stripped from commandPrefix pattern');
    }
  },

  {
    name: 'P1-07b: parsePermissionKey() handles tool name without pattern',
    fn: () => {
      const { parsePermissionKey } = require(path.join(
        PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'policy-migrator'
      ));
      const result = parsePermissionKey('write_file');
      assertEqual(result.tool, 'write_file', 'Tool name parsed correctly');
      assertEqual(result.pattern, null, 'Pattern should be null when not specified');
    }
  },

  {
    name: 'P1-08: convertToToml() returns empty string for null/empty/undefined permissions',
    fn: () => {
      const { convertToToml } = require(path.join(
        PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'policy-migrator'
      ));
      assertEqual(convertToToml({}), '', 'Empty object should return empty string');
      assertEqual(convertToToml(null), '', 'null should return empty string');
      assertEqual(convertToToml(undefined), '', 'undefined should return empty string');
    }
  },

  // ─────────────────────────────────────────────────────────────────
  // P1-09 through P1-10: Policy TOML Auto-trigger Integration Tests
  // Module: hooks/scripts/session-start.js
  // ─────────────────────────────────────────────────────────────────
  {
    name: 'P1-09: session-start auto-generates Policy TOML when CLI >= v0.30.0',
    setup: () => createTestProject({}),
    fn: () => {
      const result = executeHook('session-start.js', {}, {
        GEMINI_CLI_VERSION: '0.30.0'
      });
      assert(result.success || result.exitCode === 0,
        'session-start.js must exit 0 with GEMINI_CLI_VERSION=0.30.0');
      const policyPath = path.join(TEST_PROJECT_DIR, '.gemini', 'policies', 'bkit-permissions.toml');
      assertExists(policyPath,
        'bkit-permissions.toml must be auto-generated at .gemini/policies/ when CLI >= v0.30.0');
    },
    teardown: cleanupTestProject
  },

  {
    name: 'P1-10: session-start does NOT overwrite existing Policy TOML files',
    setup: () => {
      createTestProject({});
      const policyDir = path.join(TEST_PROJECT_DIR, '.gemini', 'policies');
      fs.mkdirSync(policyDir, { recursive: true });
      fs.writeFileSync(path.join(policyDir, 'bkit-permissions.toml'), 'EXISTING_CONTENT_MARKER');
    },
    fn: () => {
      executeHook('session-start.js', {}, { GEMINI_CLI_VERSION: '0.30.0' });
      const policyPath = path.join(TEST_PROJECT_DIR, '.gemini', 'policies', 'bkit-permissions.toml');
      const content = fs.readFileSync(policyPath, 'utf-8');
      assertEqual(content, 'EXISTING_CONTENT_MARKER',
        'Existing Policy TOML must never be overwritten by auto-generation');
    },
    teardown: cleanupTestProject
  },

  // ─────────────────────────────────────────────────────────────────
  // P1-11 through P1-17: version-detector SemVer Validation
  // Module: lib/adapters/gemini/version-detector.js
  // Analysis security finding: GEMINI_CLI_VERSION env var validation missing
  // ─────────────────────────────────────────────────────────────────
  {
    name: 'P1-11: parseVersion() correctly parses "0.30.0"',
    fn: () => {
      const { parseVersion, resetCache } = require(path.join(
        PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'version-detector'
      ));
      resetCache();
      const v = parseVersion('0.30.0');
      assertEqual(v.major, 0, 'Major version should be 0');
      assertEqual(v.minor, 30, 'Minor version should be 30');
      assertEqual(v.patch, 0, 'Patch version should be 0');
      assertEqual(v.isPreview, false, 'Stable release must not be flagged as preview');
      assertEqual(v.previewNum, null, 'Preview number must be null for stable release');
    }
  },

  {
    name: 'P1-12: parseVersion() parses preview suffix "0.31.0-preview.0"',
    fn: () => {
      const { parseVersion, resetCache } = require(path.join(
        PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'version-detector'
      ));
      resetCache();
      const v = parseVersion('0.31.0-preview.0');
      assertEqual(v.major, 0, 'Major should be 0');
      assertEqual(v.minor, 31, 'Minor should be 31');
      assertEqual(v.patch, 0, 'Patch should be 0');
      assertEqual(v.isPreview, true, 'Preview flag must be true for preview releases');
      assertEqual(v.previewNum, 0, 'Preview number should be 0');
    }
  },

  {
    name: 'P1-12b: parseVersion() parses "0.29.7" patch version correctly',
    fn: () => {
      const { parseVersion, resetCache } = require(path.join(
        PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'version-detector'
      ));
      resetCache();
      const v = parseVersion('0.29.7');
      assertEqual(v.minor, 29, 'Minor should be 29');
      assertEqual(v.patch, 7, 'Patch should be 7');
      assertEqual(v.isPreview, false, 'Should not be preview');
    }
  },

  {
    name: 'P1-13: parseVersion() handles invalid input gracefully (no throw)',
    fn: () => {
      const { parseVersion, resetCache } = require(path.join(
        PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'version-detector'
      ));
      resetCache();
      // Must not throw - must return safe defaults
      let v;
      try {
        v = parseVersion('invalid-string');
      } catch (e) {
        assert(false, `parseVersion() must not throw on invalid input: ${e.message}`);
      }
      assert(typeof v === 'object', 'Must return an object on invalid input');
      assert(typeof v.major === 'number', 'Must return numeric major');
      assert(typeof v.minor === 'number', 'Must return numeric minor');
      assert(typeof v.patch === 'number', 'Must return numeric patch');
    }
  },

  {
    name: 'P1-13b: parseVersion() handles empty string without throwing',
    fn: () => {
      const { parseVersion, resetCache } = require(path.join(
        PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'version-detector'
      ));
      resetCache();
      let v;
      try {
        v = parseVersion('');
      } catch (e) {
        assert(false, `parseVersion("") must not throw: ${e.message}`);
      }
      assert(typeof v === 'object', 'Must return an object for empty string');
    }
  },

  {
    name: 'P1-14: version-detector handles "99.99.99" without crashing (security boundary)',
    fn: () => {
      // SECURITY: Analysis finding HIGH severity - env var injection
      // GEMINI_CLI_VERSION="99.99.99" currently activates all feature flags
      // This test documents the security boundary requirement
      const { detectVersion, getFeatureFlags, resetCache } = require(path.join(
        PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'version-detector'
      ));
      resetCache();
      const original = process.env.GEMINI_CLI_VERSION;
      process.env.GEMINI_CLI_VERSION = '99.99.99';
      try {
        let v, flags;
        // Must not throw
        try {
          v = detectVersion();
          flags = getFeatureFlags();
        } catch (e) {
          assert(false, `version-detector must not throw on "99.99.99": ${e.message}`);
        }
        assert(typeof v === 'object', 'Must return version object for "99.99.99"');
        assert(typeof flags === 'object', 'Must return feature flags for "99.99.99"');
        // After security fix: version should be capped at a max known supported version
        // Currently documenting: this test validates no crash, fix tracked separately
      } finally {
        if (original !== undefined) {
          process.env.GEMINI_CLI_VERSION = original;
        } else {
          delete process.env.GEMINI_CLI_VERSION;
        }
        resetCache();
      }
    }
  },

  {
    name: 'P1-15: getFeatureFlags() hasPolicyEngine=true for version "0.30.0"',
    fn: () => {
      const { getFeatureFlags, resetCache } = require(path.join(
        PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'version-detector'
      ));
      resetCache();
      const original = process.env.GEMINI_CLI_VERSION;
      process.env.GEMINI_CLI_VERSION = '0.30.0';
      try {
        const flags = getFeatureFlags();
        assertEqual(flags.hasPolicyEngine, true,
          'hasPolicyEngine must be true for v0.30.0 (Policy Engine GA)');
        assertEqual(flags.hasSDK, true,
          'hasSDK must be true for v0.30.0 (@google/gemini-cli-core released)');
        assertEqual(flags.hasPlanMode, true,
          'hasPlanMode must still be true for v0.30.0 (added in v0.29.0)');
      } finally {
        if (original !== undefined) process.env.GEMINI_CLI_VERSION = original;
        else delete process.env.GEMINI_CLI_VERSION;
        resetCache();
      }
    }
  },

  {
    name: 'P1-16: getFeatureFlags() hasPolicyEngine=false for version "0.29.0"',
    fn: () => {
      const { getFeatureFlags, resetCache } = require(path.join(
        PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'version-detector'
      ));
      resetCache();
      const original = process.env.GEMINI_CLI_VERSION;
      process.env.GEMINI_CLI_VERSION = '0.29.0';
      try {
        const flags = getFeatureFlags();
        assertEqual(flags.hasPolicyEngine, false,
          'hasPolicyEngine must be false for v0.29.0 (Policy Engine not yet GA)');
        assertEqual(flags.hasSDK, false,
          'hasSDK must be false for v0.29.0 (@google/gemini-cli-core not yet released)');
      } finally {
        if (original !== undefined) process.env.GEMINI_CLI_VERSION = original;
        else delete process.env.GEMINI_CLI_VERSION;
        resetCache();
      }
    }
  },

  {
    name: 'P1-17: GEMINI_CLI_VERSION env var takes precedence over npm/CLI detection',
    fn: () => {
      const { detectVersion, resetCache } = require(path.join(
        PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'version-detector'
      ));
      resetCache();
      const original = process.env.GEMINI_CLI_VERSION;
      process.env.GEMINI_CLI_VERSION = '0.30.0';
      try {
        const v = detectVersion();
        assertEqual(v.minor, 30,
          'Env var GEMINI_CLI_VERSION must override npm/CLI detection strategies');
        assertEqual(v.raw, '0.30.0',
          'Raw version must match env var value exactly');
      } finally {
        if (original !== undefined) process.env.GEMINI_CLI_VERSION = original;
        else delete process.env.GEMINI_CLI_VERSION;
        resetCache();
      }
    }
  },

  {
    name: 'P1-17b: resetCache() allows re-detection after env var change',
    fn: () => {
      const { detectVersion, resetCache } = require(path.join(
        PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'version-detector'
      ));
      resetCache();
      const original = process.env.GEMINI_CLI_VERSION;
      process.env.GEMINI_CLI_VERSION = '0.29.0';
      const v1 = detectVersion();
      assertEqual(v1.minor, 29, 'First detection should be 0.29.0');

      resetCache();
      process.env.GEMINI_CLI_VERSION = '0.30.0';
      const v2 = detectVersion();
      assertEqual(v2.minor, 30, 'After resetCache(), second detection should reflect new env var');

      // Restore
      if (original !== undefined) process.env.GEMINI_CLI_VERSION = original;
      else delete process.env.GEMINI_CLI_VERSION;
      resetCache();
    }
  }
];

module.exports = { tests };
