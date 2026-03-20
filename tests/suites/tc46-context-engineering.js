// TC-46: Context Engineering Integration Tests (15 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertType, assertContains, assertExists } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const { ContextHierarchy } = require(path.join(PLUGIN_ROOT, 'lib/context-hierarchy'));
const { resolveImports, clearCache } = require(path.join(PLUGIN_ROOT, 'lib/gemini/import-resolver'));

const tests = [
  { name: 'TC46-01: ContextHierarchy plugin→project→session 우선순위', fn: () => {
    const h = new ContextHierarchy(PLUGIN_ROOT, PLUGIN_ROOT);
    h.setSession('version', '9.9.9');
    assertEqual(h.get('version'), '9.9.9', 'Session should override');
    h.clearSession();
  }},
  { name: 'TC46-02: 프로젝트 config 오버라이드', fn: () => {
    const h = new ContextHierarchy(PLUGIN_ROOT, PLUGIN_ROOT);
    const val = h.get('pdca.matchRateThreshold');
    assertEqual(val, 90, 'Default threshold should be 90');
  }},
  { name: 'TC46-03: import-resolver 존재', fn: () => {
    assertType(resolveImports, 'function', 'Should export resolveImports');
  }},
  { name: 'TC46-04: clearCache 존재', fn: () => {
    assertType(clearCache, 'function', 'Should export clearCache');
  }},
  { name: 'TC46-05: GEMINI.md ↔ context 파일 연결', fn: () => {
    const geminiMd = fs.readFileSync(path.join(PLUGIN_ROOT, 'GEMINI.md'), 'utf-8');
    assert(geminiMd.length > 100, 'GEMINI.md should have content');
  }},
  { name: 'TC46-06: bkit.config.json ↔ ContextHierarchy', fn: () => {
    const h = new ContextHierarchy(PLUGIN_ROOT, PLUGIN_ROOT);
    const cfg = h.get();
    assert(cfg.version !== undefined, 'Should load version from config');
  }},
  { name: 'TC46-07: session 오버라이드 후 clear', fn: () => {
    const h = new ContextHierarchy(PLUGIN_ROOT, PLUGIN_ROOT);
    h.setSession('custom.key', 'custom-value');
    assertEqual(h.get('custom.key'), 'custom-value', 'Should get session value');
    h.clearSession();
    assertEqual(h.get('custom.key'), undefined, 'Should be undefined after clear');
  }},
  { name: 'TC46-08: invalidate 후 재로드', fn: () => {
    const h = new ContextHierarchy(PLUGIN_ROOT, PLUGIN_ROOT);
    h.get();
    h.invalidate();
    const v = h.get('version');
    assertType(v, 'string', 'Should reload');
  }},
  { name: 'TC46-09: _deepMerge 중첩 객체', fn: () => {
    const h = new ContextHierarchy(PLUGIN_ROOT, PLUGIN_ROOT);
    const result = h._deepMerge({ a: { b: 1, c: 2 } }, { a: { c: 3, d: 4 } });
    assertEqual(result.a.b, 1, 'Should keep b');
    assertEqual(result.a.c, 3, 'Should override c');
    assertEqual(result.a.d, 4, 'Should add d');
  }},
  { name: 'TC46-10: _deepMerge 배열 교체', fn: () => {
    const h = new ContextHierarchy(PLUGIN_ROOT, PLUGIN_ROOT);
    const result = h._deepMerge({ arr: [1, 2] }, { arr: [3] });
    assertEqual(result.arr.length, 1, 'Arrays should replace');
    assertEqual(result.arr[0], 3, 'Should be new value');
  }},
  { name: 'TC46-11: GEMINI.md import/@import 구문', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'GEMINI.md'), 'utf-8');
    const hasRef = content.includes('@import') || content.includes('context/') || content.includes('## ');
    assert(hasRef, 'Should have references or sections');
  }},
  { name: 'TC46-12: context 파일 .md 형식', fn: () => {
    const contextDir = path.join(PLUGIN_ROOT, '.gemini', 'context');
    if (fs.existsSync(contextDir)) {
      const files = fs.readdirSync(contextDir).filter(f => !f.startsWith('.'));
      for (const f of files) {
        assert(f.endsWith('.md'), `${f} should be .md`);
      }
    }
  }},
  { name: 'TC46-13: output-styles context 로딩', fn: () => {
    const stylesDir = path.join(PLUGIN_ROOT, 'output-styles');
    assertExists(stylesDir, 'output-styles dir should exist');
    const files = fs.readdirSync(stylesDir).filter(f => f.endsWith('.md'));
    assert(files.length >= 4, 'Should have >=4 output styles');
  }},
  { name: 'TC46-14: template context 로딩', fn: () => {
    const templatesDir = path.join(PLUGIN_ROOT, 'templates');
    assertExists(templatesDir, 'templates dir should exist');
    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.md'));
    assert(files.length >= 10, 'Should have >=10 templates');
  }},
  { name: 'TC46-15: hooks.json 존재', fn: () => {
    assertExists(path.join(PLUGIN_ROOT, 'hooks', 'hooks.json'), 'hooks.json');
  }}
];

module.exports = { tests };
