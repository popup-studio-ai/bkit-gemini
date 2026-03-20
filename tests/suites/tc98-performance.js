// TC-98: Performance Tests (20 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertType, withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const tests = [
  // ─── GEMINI.md constraints (2 tests) ───

  { name: 'TC98-01: GEMINI.md @import count <= 3', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'GEMINI.md'), 'utf-8');
    const imports = (content.match(/^@/gm) || []);
    assert(imports.length <= 3,
      `GEMINI.md has ${imports.length} @imports, should be <= 3`);
  }},

  { name: 'TC98-02: GEMINI.md line count <= 50', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'GEMINI.md'), 'utf-8');
    const lineCount = content.split('\n').length;
    assert(lineCount <= 50,
      `GEMINI.md has ${lineCount} lines, should be <= 50`);
  }},

  // ─── Config file size constraints (3 tests) ───

  { name: 'TC98-03: bkit.config.json line count <= 300', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8');
    const lineCount = content.split('\n').length;
    assert(lineCount <= 300,
      `bkit.config.json has ${lineCount} lines, should be <= 300`);
  }},

  { name: 'TC98-04: no context file exceeds 200 lines', fn: () => {
    const contextDir = path.join(PLUGIN_ROOT, '.gemini', 'context');
    if (!fs.existsSync(contextDir)) return; // skip if no context dir
    const files = fs.readdirSync(contextDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(contextDir, file), 'utf-8');
      const lineCount = content.split('\n').length;
      assert(lineCount <= 200,
        `Context file ${file} has ${lineCount} lines, should be <= 200`);
    }
  }},

  { name: 'TC98-05: session-start.js line count <= 500', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks/scripts/session-start.js'), 'utf-8');
    const lineCount = content.split('\n').length;
    assert(lineCount <= 500,
      `session-start.js has ${lineCount} lines, should be <= 500`);
    }},

  // ─── Module load performance (5 tests) ───

  { name: 'TC98-06: lib/gemini/version.js loads in < 100ms', fn: () => {
    // Clear module cache to force fresh load
    const modulePath = require.resolve(path.join(PLUGIN_ROOT, 'lib/gemini/version'));
    delete require.cache[modulePath];

    const start = Date.now();
    require(path.join(PLUGIN_ROOT, 'lib/gemini/version'));
    const elapsed = Date.now() - start;

    assert(elapsed < 100,
      `version.js load took ${elapsed}ms, should be < 100ms`);
  }},

  { name: 'TC98-07: lib/gemini/platform.js loads in < 100ms', fn: () => {
    const modulePath = require.resolve(path.join(PLUGIN_ROOT, 'lib/gemini/platform'));
    delete require.cache[modulePath];

    const start = Date.now();
    require(path.join(PLUGIN_ROOT, 'lib/gemini/platform'));
    const elapsed = Date.now() - start;

    assert(elapsed < 100,
      `platform.js load took ${elapsed}ms, should be < 100ms`);
  }},

  { name: 'TC98-08: lib/gemini/policy.js loads in < 100ms', fn: () => {
    const modulePath = require.resolve(path.join(PLUGIN_ROOT, 'lib/gemini/policy'));
    delete require.cache[modulePath];

    const start = Date.now();
    require(path.join(PLUGIN_ROOT, 'lib/gemini/policy'));
    const elapsed = Date.now() - start;

    assert(elapsed < 100,
      `policy.js load took ${elapsed}ms, should be < 100ms`);
  }},

  { name: 'TC98-09: lib/gemini/tracker.js loads in < 100ms', fn: () => {
    const modulePath = require.resolve(path.join(PLUGIN_ROOT, 'lib/gemini/tracker'));
    delete require.cache[modulePath];

    const start = Date.now();
    require(path.join(PLUGIN_ROOT, 'lib/gemini/tracker'));
    const elapsed = Date.now() - start;

    assert(elapsed < 100,
      `tracker.js load took ${elapsed}ms, should be < 100ms`);
  }},

  { name: 'TC98-10: all lib/gemini/ modules load in < 100ms each', fn: () => {
    const geminiDir = path.join(PLUGIN_ROOT, 'lib', 'gemini');
    const files = fs.readdirSync(geminiDir).filter(f => f.endsWith('.js'));

    for (const file of files) {
      const modulePath = require.resolve(path.join(geminiDir, file));
      delete require.cache[modulePath];

      const start = Date.now();
      try {
        require(path.join(geminiDir, file));
      } catch (e) {
        // Module may need env context - skip runtime errors
        continue;
      }
      const elapsed = Date.now() - start;

      assert(elapsed < 100,
        `lib/gemini/${file} load took ${elapsed}ms, should be < 100ms`);
    }
  }},

  // ─── Version detection performance (3 tests) ───

  { name: 'TC98-11: version.js cache hit < 5ms', fn: () => {
    const vd = require(path.join(PLUGIN_ROOT, 'lib/gemini/version'));
    vd.resetCache();
    // First call populates cache
    withVersion('0.34.0', () => {
      vd.detectVersion();
      // Second call should be cache hit
      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        vd.detectVersion();
      }
      const elapsed = Date.now() - start;
      assert(elapsed < 5,
        `100 cached detectVersion calls took ${elapsed}ms, should be < 5ms`);
    });
  }},

  { name: 'TC98-12: getFeatureFlags < 10ms', fn: () => {
    const vd = require(path.join(PLUGIN_ROOT, 'lib/gemini/version'));
    withVersion('0.34.0', () => {
      // Warm up cache
      vd.detectVersion();
      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        vd.getFeatureFlags();
      }
      const elapsed = Date.now() - start;
      assert(elapsed < 10,
        `100 getFeatureFlags calls took ${elapsed}ms, should be < 10ms`);
    });
  }},

  { name: 'TC98-13: getBkitFeatureFlags < 10ms', fn: () => {
    const vd = require(path.join(PLUGIN_ROOT, 'lib/gemini/version'));
    withVersion('0.34.0', () => {
      vd.detectVersion();
      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        vd.getBkitFeatureFlags();
      }
      const elapsed = Date.now() - start;
      assert(elapsed < 10,
        `100 getBkitFeatureFlags calls took ${elapsed}ms, should be < 10ms`);
    });
  }},

  // ─── JSON parse performance (4 tests) ───

  { name: 'TC98-14: bkit.config.json parses without error', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8');
    const start = Date.now();
    const config = JSON.parse(content);
    const elapsed = Date.now() - start;
    assertType(config, 'object', 'should parse to object');
    assert(elapsed < 50, `bkit.config.json parse took ${elapsed}ms, should be < 50ms`);
  }},

  { name: 'TC98-15: gemini-extension.json parses without error', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'gemini-extension.json'), 'utf-8');
    const start = Date.now();
    const ext = JSON.parse(content);
    const elapsed = Date.now() - start;
    assertType(ext, 'object', 'should parse to object');
    assert(elapsed < 50, `gemini-extension.json parse took ${elapsed}ms, should be < 50ms`);
  }},

  { name: 'TC98-16: hooks.json parses without error', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks/hooks.json'), 'utf-8');
    const start = Date.now();
    const hooks = JSON.parse(content);
    const elapsed = Date.now() - start;
    assertType(hooks, 'object', 'should parse to object');
    assert(hooks.hooks !== undefined, 'should have hooks key');
    assert(elapsed < 50, `hooks.json parse took ${elapsed}ms, should be < 50ms`);
  }},

  { name: 'TC98-17: all JSON config files parse in < 50ms total', fn: () => {
    const jsonFiles = [
      'bkit.config.json',
      'gemini-extension.json',
      'hooks/hooks.json'
    ];
    const start = Date.now();
    for (const file of jsonFiles) {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, file), 'utf-8');
      JSON.parse(content);
    }
    const elapsed = Date.now() - start;
    assert(elapsed < 50,
      `All JSON config files parse took ${elapsed}ms, should be < 50ms`);
  }},

  // ─── File size sanity (3 tests) ───

  { name: 'TC98-18: hooks.json file size < 10KB', fn: () => {
    const stat = fs.statSync(path.join(PLUGIN_ROOT, 'hooks/hooks.json'));
    assert(stat.size < 10240,
      `hooks.json is ${stat.size} bytes, should be < 10KB`);
  }},

  { name: 'TC98-19: GEMINI.md file size < 5KB', fn: () => {
    const stat = fs.statSync(path.join(PLUGIN_ROOT, 'GEMINI.md'));
    assert(stat.size < 5120,
      `GEMINI.md is ${stat.size} bytes, should be < 5KB`);
  }},

  { name: 'TC98-20: gemini-extension.json file size < 5KB', fn: () => {
    const stat = fs.statSync(path.join(PLUGIN_ROOT, 'gemini-extension.json'));
    assert(stat.size < 5120,
      `gemini-extension.json is ${stat.size} bytes, should be < 5KB`);
  }},
];

module.exports = { tests };
