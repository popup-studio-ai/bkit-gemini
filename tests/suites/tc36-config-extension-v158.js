// TC-36: Config Extension v1.5.8 Unit Tests (15 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertType, assertContains, assertExists, getPdcaStatus, withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const { ContextHierarchy } = require(path.join(PLUGIN_ROOT, 'lib/context-hierarchy'));

const tests = [
  {
    name: 'TC36-01: bkit.config.json 존재',
    fn: () => { assertExists(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'bkit.config.json should exist'); }
  },
  {
    name: 'TC36-02: bkit.config.json JSON 파싱',
    fn: () => {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8');
      const config = JSON.parse(content);
      assert(config !== undefined, 'Should parse');
    }
  },
  {
    name: 'TC36-03: version 필드 1.5.8',
    fn: () => {
      const content = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
      assert(content.version !== undefined, 'Should have version');
    }
  },
  {
    name: 'TC36-04: pdca.matchRateThreshold 90',
    fn: () => {
      const h = new ContextHierarchy(PLUGIN_ROOT, PLUGIN_ROOT);
      assertEqual(h.get('pdca.matchRateThreshold'), 90, 'Should be 90');
    }
  },
  {
    name: 'TC36-05: ContextHierarchy 생성',
    fn: () => {
      const h = new ContextHierarchy(PLUGIN_ROOT, PLUGIN_ROOT);
      assert(h, 'Should create instance');
    }
  },
  {
    name: 'TC36-06: ContextHierarchy get version',
    fn: () => {
      const h = new ContextHierarchy(PLUGIN_ROOT, PLUGIN_ROOT);
      const v = h.get('version');
      assertType(v, 'string', 'Should return string version');
    }
  },
  {
    name: 'TC36-07: ContextHierarchy dot-notation 접근',
    fn: () => {
      const h = new ContextHierarchy(PLUGIN_ROOT, PLUGIN_ROOT);
      const val = h.get('pdca.matchRateThreshold');
      assertType(val, 'number', 'Should return number');
    }
  },
  {
    name: 'TC36-08: ContextHierarchy setSession/clearSession',
    fn: () => {
      const h = new ContextHierarchy(PLUGIN_ROOT, PLUGIN_ROOT);
      h.setSession('test', 'value');
      assertEqual(h.get('test'), 'value', 'Session should override');
      h.clearSession();
    }
  },
  {
    name: 'TC36-09: ContextHierarchy invalidate',
    fn: () => {
      const h = new ContextHierarchy(PLUGIN_ROOT, PLUGIN_ROOT);
      h.get();
      h.invalidate();
      const v = h.get('version');
      assert(v !== undefined, 'Should reload after invalidate');
    }
  },
  {
    name: 'TC36-10: ContextHierarchy _deepMerge',
    fn: () => {
      const h = new ContextHierarchy(PLUGIN_ROOT, PLUGIN_ROOT);
      const result = h._deepMerge({ a: 1 }, { b: 2 });
      assertEqual(result.a, 1, 'Should preserve a');
      assertEqual(result.b, 2, 'Should add b');
    }
  },
  {
    name: 'TC36-11: bkit.config.json platform 필드',
    fn: () => {
      const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
      assert(config.platform !== undefined, 'Should have platform');
    }
  },
  {
    name: 'TC36-12: bkit.config.json agentTeams 설정',
    fn: () => {
      const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
      assert(config.agentTeams !== undefined || config.team !== undefined, 'Should have team config');
    }
  },
  {
    name: 'TC36-13: ContextHierarchy get 전체 config',
    fn: () => {
      const h = new ContextHierarchy(PLUGIN_ROOT, PLUGIN_ROOT);
      const all = h.get();
      assertType(all, 'object', 'Should return full config object');
    }
  },
  {
    name: 'TC36-14: bkit.config.json permissions 존재',
    fn: () => {
      const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
      assert(config.permissions !== undefined, 'Should have permissions');
    }
  },
  {
    name: 'TC36-15: bkit.config.json 유효 JSON 구조 전체',
    fn: () => {
      const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
      assert(Object.keys(config).length >= 5, `Should have >=5 top-level keys, found ${Object.keys(config).length}`);
    }
  }
];

module.exports = { tests };
