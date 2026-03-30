// TC-103: v0.35.0 Import Resolver Deep Tests (10 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertContains, getPdcaStatus, withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');
const os = require('os');

const importResolverPath = path.join(PLUGIN_ROOT, 'lib/gemini/import-resolver');

const tests = [
  { name: 'TC103-01: @import directive resolves nested file', fn: async () => {
    const { resolveImports, clearCache } = require(importResolverPath);
    clearCache();
    const tmpDir = path.join(os.tmpdir(), 'bkit-import-test-' + Date.now());
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'child.md'), 'Child Content');
    fs.writeFileSync(path.join(tmpDir, 'parent.md'), 'Before\n@import child.md\nAfter');

    const result = await resolveImports(path.join(tmpDir, 'parent.md'), { basePath: tmpDir });
    assertContains(result.content, 'Child Content', 'should contain child content');
    assertContains(result.content, 'Before', 'should contain parent before');
    assertContains(result.content, 'After', 'should contain parent after');
    fs.rmSync(tmpDir, { recursive: true });
    clearCache();
  }},

  { name: 'TC103-02: multiple @import directives preserve order', fn: async () => {
    const { resolveImports, clearCache } = require(importResolverPath);
    clearCache();
    const tmpDir = path.join(os.tmpdir(), 'bkit-multi-import-' + Date.now());
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'first.md'), 'FIRST');
    fs.writeFileSync(path.join(tmpDir, 'second.md'), 'SECOND');
    fs.writeFileSync(path.join(tmpDir, 'main.md'), '@import first.md\n@import second.md');

    const result = await resolveImports(path.join(tmpDir, 'main.md'), { basePath: tmpDir });
    const firstIdx = result.content.indexOf('FIRST');
    const secondIdx = result.content.indexOf('SECOND');
    assert(firstIdx < secondIdx, 'FIRST should appear before SECOND');
    fs.rmSync(tmpDir, { recursive: true });
    clearCache();
  }},

  { name: 'TC103-03: ${PLUGIN_ROOT} variable substitution in path', fn: async () => {
    const { resolveImports, clearCache } = require(importResolverPath);
    clearCache();
    const tmpDir = path.join(os.tmpdir(), 'bkit-varpath-' + Date.now());
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'target.md'), 'VAR_RESOLVED');
    fs.writeFileSync(path.join(tmpDir, 'main.md'), '@import ${MYDIR}/target.md');

    const result = await resolveImports(path.join(tmpDir, 'main.md'), {
      basePath: tmpDir,
      variables: { MYDIR: tmpDir }
    });
    assertContains(result.content, 'VAR_RESOLVED', 'should resolve via variable substitution');
    fs.rmSync(tmpDir, { recursive: true });
    clearCache();
  }},

  { name: 'TC103-04: relative paths resolve to absolute', fn: async () => {
    const { resolveImports, clearCache } = require(importResolverPath);
    clearCache();
    const tmpDir = path.join(os.tmpdir(), 'bkit-relpath-' + Date.now());
    fs.mkdirSync(path.join(tmpDir, 'sub'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'sub', 'child.md'), 'SUB_CONTENT');
    fs.writeFileSync(path.join(tmpDir, 'main.md'), '@import sub/child.md');

    const result = await resolveImports(path.join(tmpDir, 'main.md'), { basePath: tmpDir });
    assertContains(result.content, 'SUB_CONTENT', 'relative import should resolve');
    fs.rmSync(tmpDir, { recursive: true });
    clearCache();
  }},

  { name: 'TC103-05: cache returns same result within TTL', fn: async () => {
    const { resolveImports, clearCache } = require(importResolverPath);
    clearCache();
    const tmpDir = path.join(os.tmpdir(), 'bkit-cache-' + Date.now());
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'cached.md'), 'CACHED_VALUE');

    const result1 = await resolveImports(path.join(tmpDir, 'cached.md'));
    const result2 = await resolveImports(path.join(tmpDir, 'cached.md'));
    assertEqual(result1.content, result2.content, 'cached result should match');
    fs.rmSync(tmpDir, { recursive: true });
    clearCache();
  }},

  { name: 'TC103-06: JIT fallback content format', fn: () => {
    const src = fs.readFileSync(path.join(PLUGIN_ROOT, 'lib/gemini/import-resolver.js'), 'utf-8');
    assertContains(src, '<!-- [bkit] JIT deferred:', 'should have JIT deferred comment format');
  }},

  { name: 'TC103-07: JIT fallback cache uses shortened TTL', fn: () => {
    const src = fs.readFileSync(path.join(PLUGIN_ROOT, 'lib/gemini/import-resolver.js'), 'utf-8');
    assertContains(src, 'ttl - 2000', 'JIT fallback should use shortened TTL for quick retry');
  }},

  { name: 'TC103-08: empty file import produces empty content', fn: async () => {
    const { resolveImports, clearCache } = require(importResolverPath);
    clearCache();
    const tmpDir = path.join(os.tmpdir(), 'bkit-empty-' + Date.now());
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'empty.md'), '');

    const result = await resolveImports(path.join(tmpDir, 'empty.md'));
    assertEqual(result.content, '', 'empty file should produce empty content');
    fs.rmSync(tmpDir, { recursive: true });
    clearCache();
  }},

  { name: 'TC103-09: resolveImports module exports 3 functions', fn: () => {
    const mod = require(importResolverPath);
    assertEqual(typeof mod.resolveImports, 'function', 'should export resolveImports');
    assertEqual(typeof mod.clearCache, 'function', 'should export clearCache');
    assertEqual(typeof mod.isJITMode, 'function', 'should export isJITMode');
  }},

  { name: 'TC103-10: clearCache followed by resolve gives fresh result', fn: async () => {
    const { resolveImports, clearCache } = require(importResolverPath);
    const tmpDir = path.join(os.tmpdir(), 'bkit-fresh-' + Date.now());
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'fresh.md'), 'V1');

    await resolveImports(path.join(tmpDir, 'fresh.md'));
    fs.writeFileSync(path.join(tmpDir, 'fresh.md'), 'V2');
    clearCache();
    const result = await resolveImports(path.join(tmpDir, 'fresh.md'));
    assertEqual(result.content, 'V2', 'after clearCache should get fresh content');
    fs.rmSync(tmpDir, { recursive: true });
    clearCache();
  }}
];

module.exports = { tests };
