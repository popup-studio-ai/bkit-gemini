// TC-73: Recovery Module Missing Tests (12 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertType, assertExists } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const tests = [
  { name: 'TC73-01: lib/core/config.js 존재', fn: () => {
    assertExists(path.join(PLUGIN_ROOT, 'lib/core/config.js'), 'config.js');
  }},
  { name: 'TC73-02: lib/core/file.js 존재', fn: () => {
    assertExists(path.join(PLUGIN_ROOT, 'lib/core/file.js'), 'file.js');
  }},
  { name: 'TC73-03: lib/core/cache.js 존재', fn: () => {
    assertExists(path.join(PLUGIN_ROOT, 'lib/core/cache.js'), 'cache.js');
  }},
  { name: 'TC73-04: lib/core/permission.js 존재', fn: () => {
    assertExists(path.join(PLUGIN_ROOT, 'lib/core/permission.js'), 'permission.js');
  }},
  { name: 'TC73-05: lib/pdca/status.js 존재', fn: () => {
    assertExists(path.join(PLUGIN_ROOT, 'lib/pdca/status.js'), 'status.js');
  }},
  { name: 'TC73-06: lib/pdca/phase.js 존재', fn: () => {
    assertExists(path.join(PLUGIN_ROOT, 'lib/pdca/phase.js'), 'phase.js');
  }},
  { name: 'TC73-07: lib/intent/language.js 존재', fn: () => {
    assertExists(path.join(PLUGIN_ROOT, 'lib/intent/language.js'), 'language.js');
  }},
  { name: 'TC73-08: lib/gemini/version.js 존재', fn: () => {
    assertExists(path.join(PLUGIN_ROOT, 'lib/gemini/version.js'), 'version.js');
  }},
  { name: 'TC73-09: lib/gemini/tools.js 존재', fn: () => {
    assertExists(path.join(PLUGIN_ROOT, 'lib/gemini/tools.js'), 'tools.js');
  }},
  { name: 'TC73-10: lib/context-hierarchy.js 존재', fn: () => {
    assertExists(path.join(PLUGIN_ROOT, 'lib/context-hierarchy.js'), 'context-hierarchy.js');
  }},
  { name: 'TC73-11: 존재하지 않는 모듈 require 안전 처리', fn: () => {
    try {
      require(path.join(PLUGIN_ROOT, 'lib/nonexistent-module'));
      assert(false, 'Should have thrown');
    } catch (e) {
      assert(e.code === 'MODULE_NOT_FOUND', 'Should throw MODULE_NOT_FOUND');
    }
  }},
  { name: 'TC73-12: lib/team/index.js 존재', fn: () => {
    assertExists(path.join(PLUGIN_ROOT, 'lib/team/index.js'), 'team/index.js');
  }}
];

module.exports = { tests };
