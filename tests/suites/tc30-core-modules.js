// TC-30: Core Modules Unit Tests (30 TC)
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, cleanupTestProject, assert, assertEqual, assertType, assertContains, assertExists, getPdcaStatus, withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');
const os = require('os');

const config = require(path.join(PLUGIN_ROOT, 'lib/core/config'));
const fileMod = require(path.join(PLUGIN_ROOT, 'lib/core/file'));
const cache = require(path.join(PLUGIN_ROOT, 'lib/core/cache'));
const debug = require(path.join(PLUGIN_ROOT, 'lib/core/debug'));
const platform = require(path.join(PLUGIN_ROOT, 'lib/core/platform'));
const { getPaths, ensureDirectories } = require(path.join(PLUGIN_ROOT, 'lib/core/paths'));
const { AgentMemoryManager, getAgentMemory } = require(path.join(PLUGIN_ROOT, 'lib/core/agent-memory'));
const { checkPermission, matchesGlobPattern } = require(path.join(PLUGIN_ROOT, 'lib/core/permission'));
const { getMemory } = require(path.join(PLUGIN_ROOT, 'lib/core/memory'));

const tests = [
  // config.js
  {
    name: 'TC30-01: safeJsonParse 정상 JSON',
    fn: () => {
      const result = config.safeJsonParse('{"a":1}');
      assertEqual(result.a, 1, 'Should parse JSON');
    }
  },
  {
    name: 'TC30-02: safeJsonParse 잘못된 JSON → 기본값',
    fn: () => {
      const result = config.safeJsonParse('invalid', {});
      assertEqual(typeof result, 'object', 'Should return default');
    }
  },
  {
    name: 'TC30-03: loadConfig bkit.config.json',
    fn: () => {
      const cfg = config.loadConfig(PLUGIN_ROOT);
      assert(cfg !== undefined, 'Should load config');
    }
  },
  {
    name: 'TC30-04: getBkitConfig 존재',
    fn: () => { assertType(config.getBkitConfig, 'function', 'Should export getBkitConfig'); }
  },
  // file.js
  {
    name: 'TC30-05: isSourceFile .js → true',
    fn: () => { assertEqual(fileMod.isSourceFile('app.js'), true, '.js is source'); }
  },
  {
    name: 'TC30-06: isSourceFile .md → false',
    fn: () => { assertEqual(fileMod.isSourceFile('README.md'), false, '.md is not source'); }
  },
  {
    name: 'TC30-07: isEnvFile .env → true',
    fn: () => { assertEqual(fileMod.isEnvFile('.env'), true, '.env is env file'); }
  },
  {
    name: 'TC30-08: getExtension 추출',
    fn: () => { assertEqual(fileMod.getExtension('app.tsx'), '.tsx', 'Should extract .tsx'); }
  },
  // cache.js
  {
    name: 'TC30-09: cache set/get',
    fn: () => {
      cache.set('test-key', 'test-value');
      assertEqual(cache.get('test-key'), 'test-value', 'Should cache value');
      cache.invalidate('test-key');
    }
  },
  {
    name: 'TC30-10: cache has',
    fn: () => {
      cache.set('exist-key', 1);
      assertEqual(cache.has('exist-key'), true, 'Should detect existing key');
      cache.invalidate('exist-key');
    }
  },
  {
    name: 'TC30-11: cache clear',
    fn: () => {
      cache.set('clear-key', 1);
      cache.clear();
      assertEqual(cache.has('clear-key'), false, 'Should be cleared');
    }
  },
  // debug.js
  {
    name: 'TC30-12: isDebugEnabled 기본 false',
    fn: () => {
      const original = process.env.BKIT_DEBUG;
      delete process.env.BKIT_DEBUG;
      assertEqual(debug.isDebugEnabled(), false, 'Should be false by default');
      if (original) process.env.BKIT_DEBUG = original;
    }
  },
  {
    name: 'TC30-13: debugLog 함수 존재',
    fn: () => { assertType(debug.debugLog, 'function', 'Should export debugLog'); }
  },
  // platform.js
  {
    name: 'TC30-14: detectPlatform gemini',
    fn: () => {
      const p = platform.detectPlatform();
      assertEqual(p, 'gemini', 'Should detect gemini platform');
    }
  },
  {
    name: 'TC30-15: isGemini true',
    fn: () => { assertEqual(platform.isGemini(), true, 'Should be gemini'); }
  },
  {
    name: 'TC30-16: PLUGIN_ROOT 존재',
    fn: () => { assert(platform.PLUGIN_ROOT !== undefined, 'Should export PLUGIN_ROOT'); }
  },
  // paths.js
  {
    name: 'TC30-17: getPaths 모든 키 반환',
    fn: () => {
      const paths = getPaths('/tmp/test');
      assert(paths.pdcaStatus !== undefined, 'Should have pdcaStatus');
      assert(paths.stateDir !== undefined, 'Should have stateDir');
      assert(paths.planDir !== undefined, 'Should have planDir');
      assert(paths.designDir !== undefined, 'Should have designDir');
    }
  },
  {
    name: 'TC30-18: ensureDirectories 생성',
    setup: () => createTestProject({}),
    fn: () => {
      ensureDirectories(TEST_PROJECT_DIR);
      const paths = getPaths(TEST_PROJECT_DIR);
      assertExists(paths.stateDir, 'stateDir should exist');
    },
    teardown: cleanupTestProject
  },
  // agent-memory.js
  {
    name: 'TC30-19: AgentMemoryManager 생성',
    fn: () => {
      const mem = new AgentMemoryManager('test-agent', 'project');
      assertEqual(mem.scope, 'project', 'Should set scope');
    }
  },
  {
    name: 'TC30-20: getAgentMemory starter-guide → user scope',
    fn: () => {
      const mem = getAgentMemory('starter-guide');
      assertEqual(mem.scope, 'user', 'starter-guide should get user scope');
    }
  },
  {
    name: 'TC30-21: getAgentMemory gap-detector → project scope',
    fn: () => {
      const mem = getAgentMemory('gap-detector');
      assertEqual(mem.scope, 'project', 'gap-detector should get project scope');
    }
  },
  // permission.js
  {
    name: 'TC30-22: checkPermission rm -rf → deny',
    setup: () => createTestProject({}),
    fn: () => {
      const result = checkPermission('run_shell_command', { command: 'rm -rf /' }, TEST_PROJECT_DIR);
      assertEqual(result.level, 'deny', 'Should deny rm -rf /');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC30-23: checkPermission normal write → allow',
    fn: () => {
      const result = checkPermission('write_file', { file_path: 'src/app.js' }, PLUGIN_ROOT);
      assertEqual(result.level, 'allow', 'Normal write should be allowed');
    }
  },
  {
    name: 'TC30-24: matchesGlobPattern 매칭',
    fn: () => {
      assert(matchesGlobPattern('rm -rf /', 'rm -rf *'), 'Should match');
      assert(!matchesGlobPattern('ls -la', 'rm -rf *'), 'Should not match');
    }
  },
  // memory.js
  {
    name: 'TC30-25: getMemory 팩토리 함수',
    fn: () => {
      assertType(getMemory, 'function', 'Should export getMemory');
    }
  },
  {
    name: 'TC30-26: getMemory 인스턴스 생성',
    setup: () => createTestProject({}),
    fn: () => {
      const mem = getMemory(TEST_PROJECT_DIR);
      assert(mem !== undefined, 'Should create memory instance');
      assertType(mem.get, 'function', 'Should have get method');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC30-27: getPaths archiveDir 포함',
    fn: () => {
      const paths = getPaths('/tmp/test');
      assert(paths.archiveDir !== undefined, 'Should have archiveDir');
    }
  },
  {
    name: 'TC30-28: getPaths reportDir 포함',
    fn: () => {
      const paths = getPaths('/tmp/test');
      assert(paths.reportDir !== undefined, 'Should have reportDir');
    }
  },
  {
    name: 'TC30-29: getPaths analysisDir 포함',
    fn: () => {
      const paths = getPaths('/tmp/test');
      assert(paths.analysisDir !== undefined, 'Should have analysisDir');
    }
  },
  {
    name: 'TC30-30: isConfigFile package.json → true',
    fn: () => { assertEqual(fileMod.isConfigFile('package.json'), true, 'package.json is config'); }
  }
];

module.exports = { tests };
