// TC-96: Edge Case & Recovery Tests (50 TC)
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, cleanupTestProject, assert, assertEqual, assertType, assertThrows, withVersion, getPdcaStatus } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const versionModule = require(path.join(PLUGIN_ROOT, 'lib/gemini/version'));
const { parseVersion, getFeatureFlags, getBkitFeatureFlags, isValidSemVer,
        isVersionBeyondPlausible, resetCache, detectVersion } = versionModule;

const tests = [
  // ─── Version Detector: null/empty/invalid GEMINI_CLI_VERSION (10 tests) ───

  { name: 'TC96-01: parseVersion(null) returns default object', fn: () => {
    const result = parseVersion(null);
    assertEqual(result.major, 0, 'default major');
    assertEqual(result.minor, 29, 'default minor');
    assertEqual(result.patch, 0, 'default patch');
    assertEqual(result.raw, '0.29.0', 'default raw');
  }},

  { name: 'TC96-02: parseVersion(undefined) returns default object', fn: () => {
    const result = parseVersion(undefined);
    assertEqual(result.major, 0, 'default major');
    assertEqual(result.minor, 29, 'default minor');
  }},

  { name: 'TC96-03: parseVersion("") returns default object', fn: () => {
    const result = parseVersion('');
    assertEqual(result.major, 0, 'default major from empty string');
    assertEqual(result.minor, 29, 'default minor from empty string');
  }},

  { name: 'TC96-04: parseVersion with non-string returns default', fn: () => {
    const result = parseVersion(12345);
    assertEqual(result.major, 0, 'default major from number');
    assertEqual(result.minor, 29, 'default minor from number');
  }},

  { name: 'TC96-05: parseVersion("garbage") returns default', fn: () => {
    const result = parseVersion('not-a-version');
    assertEqual(result.major, 0, 'default major from garbage');
    assertEqual(result.minor, 29, 'default minor from garbage');
  }},

  { name: 'TC96-06: null GEMINI_CLI_VERSION -> detectVersion returns valid default', fn: () => {
    resetCache();
    const original = process.env.GEMINI_CLI_VERSION;
    delete process.env.GEMINI_CLI_VERSION;
    try {
      const v = detectVersion();
      assertType(v.major, 'number', 'major should be number');
      assertType(v.minor, 'number', 'minor should be number');
      assertType(v.patch, 'number', 'patch should be number');
      assert(v.raw && typeof v.raw === 'string', 'raw should be a non-empty string');
    } finally {
      resetCache();
      if (original !== undefined) process.env.GEMINI_CLI_VERSION = original;
    }
  }},

  { name: 'TC96-07: empty GEMINI_CLI_VERSION -> detectVersion returns valid default', fn: () => {
    withVersion('', () => {
      // Empty string is falsy, so env var path is skipped -> falls through to detection
      // Either way, result must be valid
      const v = detectVersion();
      assertType(v.major, 'number', 'major should be number');
      assertType(v.minor, 'number', 'minor should be number');
    });
  }},

  { name: 'TC96-08: invalid GEMINI_CLI_VERSION format -> rejected, valid default', fn: () => {
    withVersion('not-semver', () => {
      const v = detectVersion();
      assertType(v.major, 'number', 'major should be number');
      // Invalid format should be rejected by isValidSemVer check
      assert(isValidSemVer(v.raw) || v.raw === '0.34.0', 'should fall through to valid version');
    });
  }},

  { name: 'TC96-09: isValidSemVer rejects malformed strings', fn: () => {
    assertEqual(isValidSemVer(null), false, 'null');
    assertEqual(isValidSemVer(''), false, 'empty');
    assertEqual(isValidSemVer('abc'), false, 'alpha');
    assertEqual(isValidSemVer('1.2'), false, 'partial');
    assertEqual(isValidSemVer('1.2.3.4'), false, 'too many parts');
  }},

  { name: 'TC96-10: isValidSemVer accepts valid versions', fn: () => {
    assertEqual(isValidSemVer('0.34.0'), true, 'basic');
    assertEqual(isValidSemVer('1.0.0'), true, 'major');
    assertEqual(isValidSemVer('0.30.0-preview.3'), true, 'preview');
  }},

  // ─── Beyond-plausible version (5 tests) ───

  { name: 'TC96-11: version 99.0.0 is beyond plausible', fn: () => {
    assertEqual(isVersionBeyondPlausible('99.0.0'), true, '99.0.0 should be beyond plausible');
  }},

  { name: 'TC96-12: version 3.0.0 is beyond plausible', fn: () => {
    assertEqual(isVersionBeyondPlausible('3.0.0'), true, '3.0.0 should be beyond plausible');
  }},

  { name: 'TC96-13: version 0.34.0 is NOT beyond plausible', fn: () => {
    assertEqual(isVersionBeyondPlausible('0.34.0'), false, '0.34.0 should be within range');
  }},

  { name: 'TC96-14: version 2.0.0 is NOT beyond plausible (boundary)', fn: () => {
    assertEqual(isVersionBeyondPlausible('2.0.0'), false, '2.0.0 is the max boundary');
  }},

  { name: 'TC96-15: GEMINI_CLI_VERSION=99.0.0 -> rejected, valid default returned', fn: () => {
    withVersion('99.0.0', () => {
      const v = detectVersion();
      assertType(v.major, 'number', 'major should be number');
      // 99.0.0 should be rejected as beyond plausible
      assert(v.raw !== '99.0.0', 'should not accept 99.0.0');
    });
  }},

  // ─── parseVersion edge cases (5 tests) ───

  { name: 'TC96-16: parseVersion with preview suffix', fn: () => {
    const v = parseVersion('0.30.0-preview.3');
    assertEqual(v.major, 0, 'major');
    assertEqual(v.minor, 30, 'minor');
    assertEqual(v.patch, 0, 'patch');
    assertEqual(v.previewNum, 3, 'previewNum');
    assertEqual(v.isPreview, true, 'isPreview');
  }},

  { name: 'TC96-17: parseVersion with nightly suffix', fn: () => {
    const v = parseVersion('0.34.0-nightly.20260304');
    assertEqual(v.major, 0, 'major');
    assertEqual(v.minor, 34, 'minor');
    assertEqual(v.isNightly, true, 'isNightly');
  }},

  { name: 'TC96-18: parseVersion boolean input returns default', fn: () => {
    const v = parseVersion(false);
    assertEqual(v.major, 0, 'default major from boolean');
    assertEqual(v.minor, 29, 'default minor from boolean');
  }},

  { name: 'TC96-19: parseVersion array input returns default', fn: () => {
    const v = parseVersion([1, 2, 3]);
    assertEqual(v.major, 0, 'default major from array');
  }},

  { name: 'TC96-20: parseVersion object input returns default', fn: () => {
    const v = parseVersion({ version: '1.0.0' });
    assertEqual(v.major, 0, 'default major from object');
  }},

  // ─── Empty/missing config files (10 tests) ───

  { name: 'TC96-21: bkit.config.json exists and is valid JSON', fn: () => {
    const configPath = path.join(PLUGIN_ROOT, 'bkit.config.json');
    assert(fs.existsSync(configPath), 'bkit.config.json should exist');
    const content = fs.readFileSync(configPath, 'utf-8');
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      throw new Error('bkit.config.json is not valid JSON: ' + e.message);
    }
    assertType(parsed, 'object', 'config should be an object');
  }},

  { name: 'TC96-22: empty string JSON.parse throws', fn: () => {
    assertThrows(() => JSON.parse(''), 'empty string should throw');
  }},

  { name: 'TC96-23: malformed JSON string throws', fn: () => {
    assertThrows(() => JSON.parse('{invalid}'), 'malformed JSON should throw');
  }},

  { name: 'TC96-24: missing .pdca-status.json -> createInitialStatusV2 fallback',
    setup: () => createTestProject({}),
    fn: () => {
      const { createInitialStatusV2, loadPdcaStatus } = require(path.join(PLUGIN_ROOT, 'lib/pdca/status'));
      // No .pdca-status.json in test project -> loadPdcaStatus should create initial
      const status = loadPdcaStatus(TEST_PROJECT_DIR);
      assert(status !== null && status !== undefined, 'status should not be null');
      assertEqual(status.version, '2.0', 'should have v2.0 status');
      assert(Array.isArray(status.activeFeatures), 'activeFeatures should be array');
    },
    teardown: () => cleanupTestProject()
  },

  { name: 'TC96-25: createInitialStatusV2 returns valid structure', fn: () => {
    const { createInitialStatusV2 } = require(path.join(PLUGIN_ROOT, 'lib/pdca/status'));
    const status = createInitialStatusV2();
    assertEqual(status.version, '2.0', 'version');
    assert(Array.isArray(status.activeFeatures), 'activeFeatures is array');
    assertEqual(status.primaryFeature, null, 'primaryFeature is null');
    assertType(status.features, 'object', 'features is object');
    assertType(status.pipeline, 'object', 'pipeline is object');
    assertEqual(status.pipeline.currentPhase, 1, 'currentPhase default');
    assertEqual(status.pipeline.level, 'Starter', 'level default');
    assertType(status.session, 'object', 'session is object');
    assert(Array.isArray(status.history), 'history is array');
  }},

  { name: 'TC96-26: malformed .pdca-status.json -> graceful recovery',
    setup: () => createTestProject({ '.pdca-status.json': 'NOT VALID JSON {{{' }),
    fn: () => {
      const { loadPdcaStatus } = require(path.join(PLUGIN_ROOT, 'lib/pdca/status'));
      // Should not throw, should recover with initial status
      const status = loadPdcaStatus(TEST_PROJECT_DIR);
      assert(status !== null, 'should recover from malformed JSON');
      assertEqual(status.version, '2.0', 'should create fresh v2.0 status');
    },
    teardown: () => cleanupTestProject()
  },

  { name: 'TC96-27: hooks.json exists and is valid JSON', fn: () => {
    const hooksPath = path.join(PLUGIN_ROOT, 'hooks', 'hooks.json');
    assert(fs.existsSync(hooksPath), 'hooks.json should exist');
    const content = fs.readFileSync(hooksPath, 'utf-8');
    const parsed = JSON.parse(content);
    assertType(parsed.hooks, 'object', 'hooks key should exist');
  }},

  { name: 'TC96-28: gemini-extension.json exists and is valid JSON', fn: () => {
    const extPath = path.join(PLUGIN_ROOT, 'gemini-extension.json');
    assert(fs.existsSync(extPath), 'gemini-extension.json should exist');
    const parsed = JSON.parse(fs.readFileSync(extPath, 'utf-8'));
    assertType(parsed.name, 'string', 'name should be string');
    assertType(parsed.version, 'string', 'version should be string');
  }},

  { name: 'TC96-29: JSON.parse(null) returns null (not an object)', fn: () => {
    const result = JSON.parse(null);
    assertEqual(result, null, 'JSON.parse(null) should return null');
    // This is a known JS behavior - guard against assuming it returns an object
    assert(typeof result !== 'object' || result === null, 'null is not a usable config object');
  }},

  { name: 'TC96-30: JSON.parse(undefined) throws', fn: () => {
    assertThrows(() => JSON.parse(undefined), 'undefined should throw');
  }},

  // ─── Missing directories/modules (10 tests) ───

  { name: 'TC96-31: lib/gemini/ directory exists', fn: () => {
    const geminiDir = path.join(PLUGIN_ROOT, 'lib', 'gemini');
    assert(fs.existsSync(geminiDir), 'lib/gemini/ should exist');
    assert(fs.statSync(geminiDir).isDirectory(), 'lib/gemini/ should be a directory');
  }},

  { name: 'TC96-32: lib/pdca/ directory exists', fn: () => {
    const pdcaDir = path.join(PLUGIN_ROOT, 'lib', 'pdca');
    assert(fs.existsSync(pdcaDir), 'lib/pdca/ should exist');
  }},

  { name: 'TC96-33: lib/core/ directory exists', fn: () => {
    const coreDir = path.join(PLUGIN_ROOT, 'lib', 'core');
    assert(fs.existsSync(coreDir), 'lib/core/ should exist');
  }},

  { name: 'TC96-34: requiring non-existent module throws', fn: () => {
    assertThrows(() => {
      require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'nonexistent-module-xyz'));
    }, 'require of missing module should throw');
  }},

  { name: 'TC96-35: hooks/scripts/ directory exists', fn: () => {
    const scriptsDir = path.join(PLUGIN_ROOT, 'hooks', 'scripts');
    assert(fs.existsSync(scriptsDir), 'hooks/scripts/ should exist');
  }},

  { name: 'TC96-36: missing hook script path -> require throws', fn: () => {
    assertThrows(() => {
      require(path.join(PLUGIN_ROOT, 'hooks', 'scripts', 'nonexistent-hook.js'));
    }, 'require of missing hook should throw');
  }},

  { name: 'TC96-37: all hook scripts in hooks.json exist on disk', fn: () => {
    const hooksJson = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks', 'hooks.json'), 'utf-8'));
    const scriptPattern = /hooks\/scripts\/([a-z-]+\.js)/;
    const hooks = hooksJson.hooks;
    for (const [eventName, eventHooks] of Object.entries(hooks)) {
      for (const hookGroup of eventHooks) {
        for (const hook of hookGroup.hooks) {
          const match = hook.command.match(scriptPattern);
          if (match) {
            const scriptPath = path.join(PLUGIN_ROOT, 'hooks', 'scripts', match[1]);
            assert(fs.existsSync(scriptPath), `Hook script ${match[1]} for ${eventName} should exist`);
          }
        }
      }
    }
  }},

  { name: 'TC96-38: mcp/spawn-agent-server.js exists', fn: () => {
    const mcpPath = path.join(PLUGIN_ROOT, 'mcp', 'spawn-agent-server.js');
    assert(fs.existsSync(mcpPath), 'MCP server script should exist');
  }},

  { name: 'TC96-39: GEMINI.md exists at root', fn: () => {
    const geminiMd = path.join(PLUGIN_ROOT, 'GEMINI.md');
    assert(fs.existsSync(geminiMd), 'GEMINI.md should exist');
  }},

  { name: 'TC96-40: all .gemini/context/ files exist', fn: () => {
    const contextDir = path.join(PLUGIN_ROOT, '.gemini', 'context');
    if (fs.existsSync(contextDir)) {
      const files = fs.readdirSync(contextDir);
      assert(files.length > 0, 'context directory should have files');
      for (const file of files) {
        const filePath = path.join(contextDir, file);
        assert(fs.statSync(filePath).isFile(), `${file} should be a file`);
      }
    }
  }},

  // ─── File system edge cases (5 tests) ───

  { name: 'TC96-41: temporary test directory creation works',
    fn: () => {
      const tmpDir = path.join(require('os').tmpdir(), 'bkit-tc96-test');
      if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
      fs.mkdirSync(tmpDir, { recursive: true });
      assert(fs.existsSync(tmpDir), 'tmp dir should be created');
      fs.rmSync(tmpDir, { recursive: true });
      assert(!fs.existsSync(tmpDir), 'tmp dir should be removed');
    }
  },

  { name: 'TC96-42: writing and reading JSON file roundtrip',
    fn: () => {
      const tmpDir = path.join(require('os').tmpdir(), 'bkit-tc96-roundtrip');
      if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
      fs.mkdirSync(tmpDir, { recursive: true });
      const data = { test: true, nested: { value: 42 } };
      const filePath = path.join(tmpDir, 'test.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      const loaded = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      assertEqual(loaded.test, true, 'roundtrip boolean');
      assertEqual(loaded.nested.value, 42, 'roundtrip nested value');
      fs.rmSync(tmpDir, { recursive: true });
    }
  },

  { name: 'TC96-43: reading non-existent file throws', fn: () => {
    assertThrows(() => {
      fs.readFileSync('/tmp/bkit-nonexistent-file-xyz.json', 'utf-8');
    }, 'reading nonexistent file should throw');
  }},

  { name: 'TC96-44: createTestProject creates required structure',
    setup: () => createTestProject({}),
    fn: () => {
      assert(fs.existsSync(TEST_PROJECT_DIR), 'test project dir exists');
      assert(fs.existsSync(path.join(TEST_PROJECT_DIR, 'src')), 'src dir exists');
      assert(fs.existsSync(path.join(TEST_PROJECT_DIR, '.bkit', 'state')), '.bkit/state dir exists');
    },
    teardown: () => cleanupTestProject()
  },

  { name: 'TC96-45: cleanupTestProject removes directory',
    setup: () => createTestProject({}),
    fn: () => {
      assert(fs.existsSync(TEST_PROJECT_DIR), 'should exist before cleanup');
      cleanupTestProject();
      assert(!fs.existsSync(TEST_PROJECT_DIR), 'should not exist after cleanup');
    }
  },

  // ─── Cache state (3 tests) ───

  { name: 'TC96-46: resetCache clears cached version', fn: () => {
    withVersion('0.30.0', () => {
      const v1 = detectVersion();
      assertEqual(v1.raw, '0.30.0', 'first detection');
    });
    withVersion('0.34.0', () => {
      const v2 = detectVersion();
      assertEqual(v2.raw, '0.34.0', 'after reset, new version detected');
    });
  }},

  { name: 'TC96-47: resetCache is idempotent (double reset)', fn: () => {
    resetCache();
    resetCache();
    // Should not throw; just ensure it completes
    assert(true, 'double reset should not throw');
  }},

  { name: 'TC96-48: cache module clear works', fn: () => {
    const cache = require(path.join(PLUGIN_ROOT, 'lib/core/cache'));
    cache.set('tc96-test', 'value');
    assertEqual(cache.get('tc96-test'), 'value', 'value set');
    cache.clear();
    assertEqual(cache.has('tc96-test'), false, 'value cleared');
  }},

  // ─── Hook timeout bounds (2 tests) ───

  { name: 'TC96-49: all hooks in hooks.json have timeout <= 10000ms', fn: () => {
    const hooksJson = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks', 'hooks.json'), 'utf-8'));
    const hooks = hooksJson.hooks;
    for (const [eventName, eventHooks] of Object.entries(hooks)) {
      for (const hookGroup of eventHooks) {
        for (const hook of hookGroup.hooks) {
          assert(hook.timeout <= 10000,
            `Hook "${hook.name}" in ${eventName} has timeout ${hook.timeout}ms, exceeds 10000ms`);
        }
      }
    }
  }},

  { name: 'TC96-50: all hooks in hooks.json have timeout >= 1000ms', fn: () => {
    const hooksJson = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks', 'hooks.json'), 'utf-8'));
    const hooks = hooksJson.hooks;
    for (const [eventName, eventHooks] of Object.entries(hooks)) {
      for (const hookGroup of eventHooks) {
        for (const hook of hookGroup.hooks) {
          assert(hook.timeout >= 1000,
            `Hook "${hook.name}" in ${eventName} has timeout ${hook.timeout}ms, below 1000ms minimum`);
        }
      }
    }
  }},
];

module.exports = { tests };
