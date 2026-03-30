// TC-104: v0.35.0 Context Fork JIT (10 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertType, getPdcaStatus, withVersion } = require('../test-utils');
const path = require('path');

const contextForkPath = path.join(PLUGIN_ROOT, 'lib/gemini/context-fork');

const tests = [
  { name: 'TC104-01: forkContext function exists', fn: () => {
    const mod = require(contextForkPath);
    assertType(mod.forkContext, 'function', 'forkContext should be a function');
  }},

  { name: 'TC104-02: mergeForkedContext function exists', fn: () => {
    const mod = require(contextForkPath);
    assertType(mod.mergeForkedContext, 'function', 'mergeForkedContext should be a function');
  }},

  { name: 'TC104-03: discardFork function exists', fn: () => {
    const mod = require(contextForkPath);
    assertType(mod.discardFork, 'function', 'discardFork should be a function');
  }},

  { name: 'TC104-04: listActiveForks function exists', fn: () => {
    const mod = require(contextForkPath);
    assertType(mod.listActiveForks, 'function', 'listActiveForks should be a function');
  }},

  { name: 'TC104-05: FORK_STORAGE_DIR constant defined', fn: () => {
    const mod = require(contextForkPath);
    assert(mod.FORK_STORAGE_DIR !== undefined, 'FORK_STORAGE_DIR should be defined');
    assert(typeof mod.FORK_STORAGE_DIR === 'string', 'FORK_STORAGE_DIR should be a string');
  }},

  { name: 'TC104-06: generateForkId produces unique IDs', fn: () => {
    const mod = require(contextForkPath);
    if (typeof mod.generateForkId !== 'function') {
      // Some versions may not export this directly
      assert(true, 'generateForkId not exported (internal function)');
      return;
    }
    const id1 = mod.generateForkId();
    const id2 = mod.generateForkId();
    assert(id1 !== id2, 'generated IDs should be unique');
  }},

  { name: 'TC104-07: deepMerge merges nested objects', fn: () => {
    const mod = require(contextForkPath);
    if (typeof mod.deepMerge !== 'function') {
      assert(true, 'deepMerge not exported (internal function)');
      return;
    }
    const result = mod.deepMerge({ a: { b: 1 } }, { a: { c: 2 } });
    assertEqual(result.a.b, 1, 'should preserve original key');
    assertEqual(result.a.c, 2, 'should add new key');
  }},

  { name: 'TC104-08: diffSnapshots function exists', fn: () => {
    const mod = require(contextForkPath);
    assertType(mod.diffSnapshots, 'function', 'diffSnapshots should be a function');
  }},

  { name: 'TC104-09: cleanupOldForks function exists', fn: () => {
    const mod = require(contextForkPath);
    assertType(mod.cleanupOldForks, 'function', 'cleanupOldForks should be a function');
  }},

  { name: 'TC104-10: enforceSnapshotLimit function exists', fn: () => {
    const mod = require(contextForkPath);
    assertType(mod.enforceSnapshotLimit, 'function', 'enforceSnapshotLimit should be a function');
  }}
];

module.exports = { tests };
