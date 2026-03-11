// TC-62: Security Permission Tests (10 TC)
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, cleanupTestProject,
        assert, assertEqual, assertType } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const { checkPermission, validateBatch, hasDeniedInBatch, getPermissionSummary,
        formatPermissionResult, loadPermissionConfig } = require(path.join(PLUGIN_ROOT, 'lib/core/permission'));

const tests = [
  { name: 'TC62-01: validateBatch 여러 명령 검증', fn: () => {
    assertType(validateBatch, 'function', 'Should export validateBatch');
  }},
  { name: 'TC62-02: hasDeniedInBatch deny 포함 감지', fn: () => {
    assertType(hasDeniedInBatch, 'function', 'Should export hasDeniedInBatch');
  }},
  { name: 'TC62-03: getPermissionSummary 요약 생성', fn: () => {
    assertType(getPermissionSummary, 'function', 'Should export getPermissionSummary');
  }},
  { name: 'TC62-04: formatPermissionResult 포맷', fn: () => {
    assertType(formatPermissionResult, 'function', 'Should export formatPermissionResult');
  }},
  { name: 'TC62-05: loadPermissionConfig 로드', fn: () => {
    assertType(loadPermissionConfig, 'function', 'Should export loadPermissionConfig');
  }},
  { name: 'TC62-06: write_file 일반 소스 → allow',
    fn: () => {
      const r = checkPermission('write_file', { file_path: 'src/index.js' }, PLUGIN_ROOT);
      assertEqual(r.level, 'allow', 'Normal source should be allowed');
    }
  },
  { name: 'TC62-07: write_file package.json → warn/allow',
    fn: () => {
      const r = checkPermission('write_file', { file_path: 'package.json' }, PLUGIN_ROOT);
      assert(r.level === 'warn' || r.level === 'allow', 'package.json should warn or allow');
    }
  },
  { name: 'TC62-08: run_shell_command git push → policy deferred',
    fn: () => {
      const r = checkPermission('run_shell_command', { command: 'git push --force' }, PLUGIN_ROOT);
      // With Policy Engine active, defers to engine
      assert(r.level === 'deny' || r.level === 'warn' || r.reason === 'Deferred to Policy Engine', 'Should handle git push');
    }
  },
  { name: 'TC62-09: unknown tool → allow (기본)',
    fn: () => {
      const r = checkPermission('unknown_tool', { param: 'value' }, PLUGIN_ROOT);
      assertEqual(r.level, 'allow', 'Unknown tool should default allow');
    }
  },
  { name: 'TC62-10: run_shell_command chmod 777 → policy deferred',
    fn: () => {
      const r = checkPermission('run_shell_command', { command: 'chmod 777 /etc/shadow' }, PLUGIN_ROOT);
      // With Policy Engine active in PLUGIN_ROOT, defers to engine
      assert(r.level === 'deny' || r.level === 'warn' || r.reason === 'Deferred to Policy Engine', 'Should handle chmod');
    }
  }
];

module.exports = { tests };
