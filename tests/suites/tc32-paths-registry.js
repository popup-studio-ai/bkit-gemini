// TC-32: Paths Registry Unit Tests (15 TC)
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProjectV2, cleanupTestProject,
        assert, assertEqual, assertType, assertContains } = require('../test-utils');
const path = require('path');

const { getPaths, ensureDirectories } = require(path.join(PLUGIN_ROOT, 'lib/core/paths'));

const tests = [
  { name: 'TC32-01: getPaths 반환 타입 object', fn: () => { assertType(getPaths('/tmp/test'), 'object', 'Should return object'); } },
  { name: 'TC32-02: pdcaStatus 경로 포함', fn: () => { assertContains(getPaths('/tmp/t').pdcaStatus, '.pdca-status.json', 'Should include pdca status'); } },
  { name: 'TC32-03: stateDir .bkit/state', fn: () => { assertContains(getPaths('/tmp/t').stateDir, '.bkit', 'Should include .bkit'); } },
  { name: 'TC32-04: runtimeDir 존재', fn: () => { assert(getPaths('/tmp/t').runtimeDir !== undefined, 'Should have runtimeDir'); } },
  { name: 'TC32-05: snapshotsDir 존재', fn: () => { assert(getPaths('/tmp/t').snapshotsDir !== undefined, 'Should have snapshotsDir'); } },
  { name: 'TC32-06: memory 경로', fn: () => { assert(getPaths('/tmp/t').memory !== undefined, 'Should have memory path'); } },
  { name: 'TC32-07: planDir docs/01-plan', fn: () => { assertContains(getPaths('/tmp/t').planDir, '01-plan', 'Should include 01-plan'); } },
  { name: 'TC32-08: designDir docs/02-design', fn: () => { assertContains(getPaths('/tmp/t').designDir, '02-design', 'Should include 02-design'); } },
  { name: 'TC32-09: analysisDir docs/03-analysis', fn: () => { assertContains(getPaths('/tmp/t').analysisDir, '03-analysis', 'Should include 03-analysis'); } },
  { name: 'TC32-10: reportDir docs/04-report', fn: () => { assertContains(getPaths('/tmp/t').reportDir, '04-report', 'Should include 04-report'); } },
  { name: 'TC32-11: archiveDir docs/archive', fn: () => { assertContains(getPaths('/tmp/t').archiveDir, 'archive', 'Should include archive'); } },
  {
    name: 'TC32-12: ensureDirectories 실제 생성',
    setup: () => createTestProjectV2({}),
    fn: () => {
      ensureDirectories(TEST_PROJECT_DIR);
      const fs = require('fs');
      const paths = getPaths(TEST_PROJECT_DIR);
      assert(fs.existsSync(paths.stateDir), 'stateDir should exist');
    },
    teardown: cleanupTestProject
  },
  { name: 'TC32-13: agentMemory 경로', fn: () => { assert(getPaths('/tmp/t').agentMemory !== undefined, 'Should have agentMemory'); } },
  { name: 'TC32-14: policies 경로', fn: () => { assert(getPaths('/tmp/t').policies !== undefined, 'Should have policies'); } },
  { name: 'TC32-15: teams 경로', fn: () => { assert(getPaths('/tmp/t').teams !== undefined, 'Should have teams'); } }
];

module.exports = { tests };
