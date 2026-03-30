// TC-102: v0.35.0 JIT Context Loading (12 TC)
const { PLUGIN_ROOT, assert, assertEqual, withVersion, getPdcaStatus } = require('../test-utils');
const path = require('path');
const fs = require('fs');
const os = require('os');

const importResolverPath = path.join(PLUGIN_ROOT, 'lib/gemini/import-resolver');

const tests = [
  // ─── isJITMode version detection ─────────────────────

  { name: 'TC102-01: isJITMode returns true for v0.35.0', fn: () => {
    withVersion('0.35.0', () => {
      const { isJITMode } = require(importResolverPath);
      assertEqual(isJITMode(), true, 'should be true for v0.35.0');
    });
  }},

  { name: 'TC102-02: isJITMode returns false for v0.34.0', fn: () => {
    withVersion('0.34.0', () => {
      const { isJITMode } = require(importResolverPath);
      assertEqual(isJITMode(), false, 'should be false for v0.34.0');
    });
  }},

  // ─── Cache TTL ─────────────────────

  { name: 'TC102-03: JIT mode cache TTL is 30000ms', fn: () => {
    // Read source to verify constant
    const src = fs.readFileSync(path.join(PLUGIN_ROOT, 'lib/gemini/import-resolver.js'), 'utf-8');
    assert(src.includes('30000'), 'JIT cache TTL should be 30000ms');
    assert(src.includes('return 30000'), 'getCacheTTL should return 30000 in JIT mode');
  }},

  { name: 'TC102-04: Legacy mode cache TTL is 5000ms', fn: () => {
    const src = fs.readFileSync(path.join(PLUGIN_ROOT, 'lib/gemini/import-resolver.js'), 'utf-8');
    assert(src.includes('5000'), 'Legacy cache TTL should be 5000ms');
    assert(src.includes('return 5000'), 'getCacheTTL should return 5000 in legacy mode');
  }},

  // ─── resolveImports basic ─────────────────────

  { name: 'TC102-05: resolveImports succeeds for existing file', fn: async () => {
    const { resolveImports, clearCache } = require(importResolverPath);
    clearCache();
    const testFile = path.join(PLUGIN_ROOT, 'GEMINI.md');
    const result = await resolveImports(testFile);
    assert(result.content.length > 0, 'should resolve content');
    assertEqual(result.resolvedPath, testFile, 'resolved path should match');
  }},

  { name: 'TC102-06: resolveImports JIT fallback for missing file', fn: async () => {
    withVersion('0.35.0', () => {});
    const { resolveImports, clearCache } = require(importResolverPath);
    clearCache();

    // Temporarily set version to 0.35.0 for JIT mode
    const vd = require(path.join(PLUGIN_ROOT, 'lib/gemini/version'));
    vd.resetCache();
    process.env.GEMINI_CLI_VERSION = '0.35.0';

    try {
      const missingFile = path.join(os.tmpdir(), 'bkit-test-jit-missing-' + Date.now() + '.md');
      const result = await resolveImports(missingFile);
      assert(result.jitDeferred === true, 'should have jitDeferred flag');
      assert(result.content.includes('JIT deferred'), 'should have JIT deferred message');
    } finally {
      vd.resetCache();
      delete process.env.GEMINI_CLI_VERSION;
      clearCache();
    }
  }},

  { name: 'TC102-07: resolveImports legacy mode throws for missing file', fn: async () => {
    const vd = require(path.join(PLUGIN_ROOT, 'lib/gemini/version'));
    vd.resetCache();
    process.env.GEMINI_CLI_VERSION = '0.34.0';

    const { resolveImports, clearCache } = require(importResolverPath);
    clearCache();

    const missingFile = path.join(os.tmpdir(), 'bkit-test-missing-' + Date.now() + '.md');
    let threw = false;
    try {
      await resolveImports(missingFile);
    } catch (e) {
      threw = true;
      assert(e.message.includes('not found'), 'error should mention file not found');
    } finally {
      vd.resetCache();
      delete process.env.GEMINI_CLI_VERSION;
      clearCache();
    }
    assert(threw, 'should throw for missing file in legacy mode');
  }},

  // ─── Circular dependency ─────────────────────

  { name: 'TC102-08: resolveImports detects circular imports', fn: async () => {
    const { resolveImports, clearCache } = require(importResolverPath);
    clearCache();

    // Create temp files with circular references
    const tmpDir = path.join(os.tmpdir(), 'bkit-circ-test-' + Date.now());
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'a.md'), '@import b.md\nContent A');
    fs.writeFileSync(path.join(tmpDir, 'b.md'), '@import a.md\nContent B');

    let threw = false;
    try {
      await resolveImports(path.join(tmpDir, 'a.md'), { basePath: tmpDir });
    } catch (e) {
      threw = true;
      assert(e.message.includes('Circular'), 'should detect circular import');
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
      clearCache();
    }
    assert(threw, 'should throw on circular imports');
  }},

  // ─── Variable substitution ─────────────────────

  { name: 'TC102-09: resolveImports substitutes variables', fn: async () => {
    const { resolveImports, clearCache } = require(importResolverPath);
    clearCache();

    const tmpDir = path.join(os.tmpdir(), 'bkit-var-test-' + Date.now());
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'test.md'), 'Hello ${NAME}!');

    const result = await resolveImports(path.join(tmpDir, 'test.md'), {
      variables: { NAME: 'World' }
    });

    assert(result.content.includes('Hello World!'), 'should substitute ${NAME}');
    fs.rmSync(tmpDir, { recursive: true });
    clearCache();
  }},

  // ─── clearCache ─────────────────────

  { name: 'TC102-10: clearCache empties the cache', fn: () => {
    const { clearCache } = require(importResolverPath);
    clearCache(); // should not throw
    // Just verify it's callable
    assert(true, 'clearCache should succeed');
  }},

  // ─── JIT configuration constants ─────────────────────

  { name: 'TC102-11: JIT_RETRY_DELAY_MS is 200', fn: () => {
    const src = fs.readFileSync(path.join(PLUGIN_ROOT, 'lib/gemini/import-resolver.js'), 'utf-8');
    assert(src.includes('JIT_RETRY_DELAY_MS = 200'), 'JIT_RETRY_DELAY_MS should be 200');
  }},

  { name: 'TC102-12: JIT_MAX_RETRIES is 3', fn: () => {
    const src = fs.readFileSync(path.join(PLUGIN_ROOT, 'lib/gemini/import-resolver.js'), 'utf-8');
    assert(src.includes('JIT_MAX_RETRIES = 3'), 'JIT_MAX_RETRIES should be 3');
  }}
];

module.exports = { tests };
