// TC-63: Compatibility Matrix Tests (13 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertContains, withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const { detectVersion, getFeatureFlags, getBkitFeatureFlags, compareVersions, isVersionAtLeast } = require(path.join(PLUGIN_ROOT, 'lib/gemini/version'));

const COMPAT_VERSIONS = ['0.26.0', '0.27.0', '0.28.0', '0.29.0', '0.30.0', '0.31.0', '0.32.0', '0.33.0'];

const tests = [
  { name: 'TC63-01: v0.26 기본 플래그 호환', fn: () => {
    withVersion('0.26.0', () => {
      const flags = getFeatureFlags();
      assert(flags !== undefined, 'v0.26 should have flags');
    });
  }},
  { name: 'TC63-02: v0.31 advanced 플래그 호환', fn: () => {
    withVersion('0.31.0', () => {
      const flags = getFeatureFlags();
      assert(flags !== undefined, 'v0.31 should have flags');
    });
  }},
  { name: 'TC63-03: v0.32 최신 플래그 호환', fn: () => {
    withVersion('0.32.0', () => {
      const flags = getFeatureFlags();
      assert(flags !== undefined, 'v0.32 should have flags');
    });
  }},
  { name: 'TC63-04: compareVersions 정렬 일관성', fn: () => {
    const { parseVersion } = require(path.join(PLUGIN_ROOT, 'lib/gemini/version'));
    assert(compareVersions(parseVersion('0.31.0'), parseVersion('0.30.0')) > 0, '0.31 > 0.30');
    assert(compareVersions(parseVersion('0.30.0'), parseVersion('0.31.0')) < 0, '0.30 < 0.31');
    assertEqual(compareVersions(parseVersion('0.31.0'), parseVersion('0.31.0')), 0, '0.31 == 0.31');
  }},
  { name: 'TC63-05: isVersionAtLeast 경계값', fn: () => {
    withVersion('0.31.0', () => {
      assert(isVersionAtLeast('0.31.0'), 'Should be at least 0.31.0');
      assert(isVersionAtLeast('0.30.0'), 'Should be at least 0.30.0');
      assert(!isVersionAtLeast('0.32.0'), 'Should not be at least 0.32.0');
    });
  }},
  { name: 'TC63-06: getBkitFeatureFlags 존재', fn: () => {
    withVersion('0.31.0', () => {
      const flags = getBkitFeatureFlags();
      assert(flags !== undefined, 'Should return bkit feature flags');
    });
  }},
  { name: 'TC63-07: 모든 버전 getFeatureFlags 안전', fn: () => {
    for (const ver of COMPAT_VERSIONS) {
      withVersion(ver, () => {
        const flags = getFeatureFlags();
        assert(flags !== undefined, `v${ver} should have flags`);
      });
    }
  }},
  { name: 'TC63-08: bkit.config.json gemini 섹션 호환', fn: () => {
    const cfg = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
    assert(cfg.gemini !== undefined || cfg.platform !== undefined, 'Config should have gemini section');
  }},
  { name: 'TC63-09: hooks.json gemini adapter 호환', fn: () => {
    const hooksPath = path.join(PLUGIN_ROOT, 'hooks.json');
    if (fs.existsSync(hooksPath)) {
      const hooks = JSON.parse(fs.readFileSync(hooksPath, 'utf-8'));
      assert(hooks !== undefined, 'hooks.json should be valid');
    } else {
      assert(true, 'No hooks.json (TOML-based hooks)');
    }
  }},
  { name: 'TC63-10: GEMINI.md 플랫폼 식별', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'GEMINI.md'), 'utf-8');
    assertContains(content, 'Gemini', 'GEMINI.md should reference Gemini');
  }},
  { name: 'TC63-11: zero-dependency (no package.json)', fn: () => {
    assert(!fs.existsSync(path.join(PLUGIN_ROOT, 'package.json')), 'Should have no package.json');
  }},
  { name: 'TC63-12: Node.js 내장 모듈만 사용 (node_modules 없음)', fn: () => {
    assert(!fs.existsSync(path.join(PLUGIN_ROOT, 'node_modules')), 'Should have no node_modules');
  }},
  { name: 'TC63-13: version detector cache reset 안전', fn: () => {
    const vd = require(path.join(PLUGIN_ROOT, 'lib/gemini/version'));
    vd.resetCache();
    // Should not throw
    assert(true, 'Cache reset should be safe');
  }}
];

module.exports = { tests };
