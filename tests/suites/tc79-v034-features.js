// TC-79: Gemini CLI v0.34.0 Feature Tests (25 TC)
const { PLUGIN_ROOT, assert, assertEqual, withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const { parseVersion, getFeatureFlags, getBkitFeatureFlags, isValidSemVer, resetCache } = require(path.join(PLUGIN_ROOT, 'lib/adapters/gemini/version-detector'));

const tests = [
  // ─── v0.34.0 Feature Flags (14 tests) ─────────────────────

  { name: 'TC79-01: hasNativeSkillSystem true on v0.34.0', fn: () => {
    withVersion('0.34.0', () => {
      assertEqual(getFeatureFlags().hasNativeSkillSystem, true, 'hasNativeSkillSystem');
    });
  }},
  { name: 'TC79-02: hasNativeSkillSystem false on v0.33.0', fn: () => {
    withVersion('0.33.0', () => {
      assertEqual(getFeatureFlags().hasNativeSkillSystem, false, 'hasNativeSkillSystem should be false');
    });
  }},
  { name: 'TC79-03: hasACP true on v0.34.0', fn: () => {
    withVersion('0.34.0', () => {
      assertEqual(getFeatureFlags().hasACP, true, 'hasACP');
    });
  }},
  { name: 'TC79-04: hasExtensionRegistryClient true on v0.34.0', fn: () => {
    withVersion('0.34.0', () => {
      assertEqual(getFeatureFlags().hasExtensionRegistryClient, true, 'hasExtensionRegistryClient');
    });
  }},
  { name: 'TC79-05: hasExtensionValidation true on v0.34.0', fn: () => {
    withVersion('0.34.0', () => {
      assertEqual(getFeatureFlags().hasExtensionValidation, true, 'hasExtensionValidation');
    });
  }},
  { name: 'TC79-06: hasHookMigration true on v0.34.0', fn: () => {
    withVersion('0.34.0', () => {
      assertEqual(getFeatureFlags().hasHookMigration, true, 'hasHookMigration');
    });
  }},
  { name: 'TC79-07: hasSlashCommandConflictResolution true on v0.34.0', fn: () => {
    withVersion('0.34.0', () => {
      assertEqual(getFeatureFlags().hasSlashCommandConflictResolution, true, 'hasSlashCommandConflictResolution');
    });
  }},
  { name: 'TC79-08: hasStrictTomlValidation true on v0.34.0', fn: () => {
    withVersion('0.34.0', () => {
      assertEqual(getFeatureFlags().hasStrictTomlValidation, true, 'hasStrictTomlValidation');
    });
  }},
  { name: 'TC79-09: hasSubagentPolicies true on v0.34.0', fn: () => {
    withVersion('0.34.0', () => {
      assertEqual(getFeatureFlags().hasSubagentPolicies, true, 'hasSubagentPolicies');
    });
  }},
  { name: 'TC79-10: hasUpgradeCommand true on v0.34.0', fn: () => {
    withVersion('0.34.0', () => {
      assertEqual(getFeatureFlags().hasUpgradeCommand, true, 'hasUpgradeCommand');
    });
  }},
  { name: 'TC79-11: all 14 v0.34.0 flags true on v0.34.0', fn: () => {
    withVersion('0.34.0', () => {
      const flags = getFeatureFlags();
      const v034Flags = [
        'hasNativeSkillSystem', 'hasACP', 'hasExtensionRegistryClient',
        'hasExtensionValidation', 'hasHookMigration', 'hasSlashCommandConflictResolution',
        'hasMcpPromptLoader', 'hasContextFileNameArray', 'hasGemini31CustomTools',
        'hasToolLegacyAliases', 'hasStrictTomlValidation', 'hasSubagentPolicies',
        'hasThemeSubdirectories', 'hasUpgradeCommand'
      ];
      for (const flag of v034Flags) {
        assertEqual(flags[flag], true, `${flag} should be true on v0.34.0`);
      }
    });
  }},
  { name: 'TC79-12: all 14 v0.34.0 flags false on v0.33.0', fn: () => {
    withVersion('0.33.0', () => {
      const flags = getFeatureFlags();
      const v034Flags = [
        'hasNativeSkillSystem', 'hasACP', 'hasExtensionRegistryClient',
        'hasExtensionValidation', 'hasHookMigration', 'hasSlashCommandConflictResolution',
        'hasMcpPromptLoader', 'hasContextFileNameArray', 'hasGemini31CustomTools',
        'hasToolLegacyAliases', 'hasStrictTomlValidation', 'hasSubagentPolicies',
        'hasThemeSubdirectories', 'hasUpgradeCommand'
      ];
      for (const flag of v034Flags) {
        assertEqual(flags[flag], false, `${flag} should be false on v0.33.0`);
      }
    });
  }},

  // ─── Nightly Version Parsing (4 tests) ─────────────────────

  { name: 'TC79-13: parse nightly without hash', fn: () => {
    const v = parseVersion('0.34.0-nightly.20260304');
    assertEqual(v.major, 0, 'major');
    assertEqual(v.minor, 34, 'minor');
    assertEqual(v.patch, 0, 'patch');
    assertEqual(v.isNightly, true, 'isNightly');
    assertEqual(v.nightlyNum, 20260304, 'nightlyNum');
  }},
  { name: 'TC79-14: parse nightly with commit hash', fn: () => {
    const v = parseVersion('0.34.0-nightly.20260304.28af4e127');
    assertEqual(v.major, 0, 'major');
    assertEqual(v.minor, 34, 'minor');
    assertEqual(v.patch, 0, 'patch');
    assertEqual(v.isNightly, true, 'isNightly');
    assertEqual(v.nightlyNum, 20260304, 'nightlyNum');
  }},
  { name: 'TC79-15: parse v0.35.0 nightly with hash', fn: () => {
    const v = parseVersion('0.35.0-nightly.20260314.3038fdce2');
    assertEqual(v.major, 0, 'major');
    assertEqual(v.minor, 35, 'minor');
    assertEqual(v.patch, 0, 'patch');
    assertEqual(v.isNightly, true, 'isNightly');
  }},
  { name: 'TC79-16: parse preview version still works', fn: () => {
    const v = parseVersion('0.34.0-preview.4');
    assertEqual(v.major, 0, 'major');
    assertEqual(v.minor, 34, 'minor');
    assertEqual(v.patch, 0, 'patch');
    assertEqual(v.isPreview, true, 'isPreview');
    assertEqual(v.previewNum, 4, 'previewNum');
    assertEqual(v.isNightly, false, 'isNightly should be false');
  }},

  // ─── bkit Feature Gates (3 tests) ──────────────────────────

  { name: 'TC79-17: canUseNativeSkills true on v0.34.0', fn: () => {
    withVersion('0.34.0', () => {
      assertEqual(getBkitFeatureFlags().canUseNativeSkills, true, 'canUseNativeSkills');
    });
  }},
  { name: 'TC79-18: canUseSubagentPolicies true on v0.34.0', fn: () => {
    withVersion('0.34.0', () => {
      assertEqual(getBkitFeatureFlags().canUseSubagentPolicies, true, 'canUseSubagentPolicies');
    });
  }},
  { name: 'TC79-19: canValidateExtension true on v0.34.0', fn: () => {
    withVersion('0.34.0', () => {
      assertEqual(getBkitFeatureFlags().canValidateExtension, true, 'canValidateExtension');
    });
  }},

  // ─── TOML Structure Validation (4 tests) ───────────────────

  { name: 'TC79-20: no TOML files have [command] section', fn: () => {
    const commandsDir = path.join(PLUGIN_ROOT, 'commands');
    const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.toml'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(commandsDir, file), 'utf-8');
      assert(!content.includes('[command]'), `${file} should not have [command] section`);
    }
  }},
  { name: 'TC79-21: all TOML files have top-level prompt', fn: () => {
    const commandsDir = path.join(PLUGIN_ROOT, 'commands');
    const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.toml'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(commandsDir, file), 'utf-8');
      assert(content.includes('prompt = """'), `${file} should have top-level prompt`);
    }
  }},
  { name: 'TC79-22: no TOML files have name field', fn: () => {
    const commandsDir = path.join(PLUGIN_ROOT, 'commands');
    const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.toml'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(commandsDir, file), 'utf-8');
      assert(!content.match(/^name\s*=/m), `${file} should not have name field`);
    }
  }},
  { name: 'TC79-23: exactly 24 TOML command files exist', fn: () => {
    const commandsDir = path.join(PLUGIN_ROOT, 'commands');
    const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.toml'));
    assertEqual(files.length, 24, 'Should have 24 TOML files');
  }},

  // ─── Total Flag Count (2 tests) ────────────────────────────

  { name: 'TC79-24: total feature flags count is 50', fn: () => {
    withVersion('0.34.0', () => {
      const flags = getFeatureFlags();
      assertEqual(Object.keys(flags).length, 50, 'Total flags should be 50');
    });
  }},
  { name: 'TC79-25: all 50 flags true on v0.34.0', fn: () => {
    withVersion('0.34.0', () => {
      const flags = getFeatureFlags();
      const trueCount = Object.values(flags).filter(Boolean).length;
      assertEqual(trueCount, 50, 'All 50 flags should be true on v0.34.0');
    });
  }}
];

module.exports = { name: 'TC-79: v0.34.0 Features', tests };
