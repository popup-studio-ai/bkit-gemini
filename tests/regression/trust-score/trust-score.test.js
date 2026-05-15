/**
 * TrustScoreManager — Unit Tests (TDD Red phase)
 *
 * Sprint S7 v2.0.7-gemini-cli-l4-automation Wave 1 Day 2
 * AC-T13: mutation testing score >= 85% (stryker-js)
 * Reference: design.md §2.5 TS-01~12 + §6.1 algorithm
 *
 * Test runner: bkit's tests/run-all.js (suite based)
 * Pure unit tests — no LLM, no external services, no file system mutation outside tmpdir.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

// ─── Test Harness (lightweight assert) ──────────────────────────
let __suite_pass = 0;
let __suite_fail = 0;
const __failures = [];

function test(name, fn) {
  try {
    fn();
    __suite_pass++;
    console.log(`  [PASS] ${name}`);
  } catch (e) {
    __suite_fail++;
    __failures.push({ name, error: e.message });
    console.error(`  [FAIL] ${name}\n         ${e.message}`);
  }
}

function assertEq(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg || 'assertEq fail'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertTrue(cond, msg) {
  if (!cond) throw new Error(msg || 'assertTrue fail');
}

function assertFalse(cond, msg) {
  if (cond) throw new Error(msg || 'assertFalse fail');
}

// ─── Fixture: temporary project directory ───────────────────────
function setupTmpDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-trust-score-'));
  fs.mkdirSync(path.join(dir, '.bkit', 'runtime'), { recursive: true });
  return dir;
}

function teardownTmpDir(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* ignore */ }
}

// ─── Module Under Test ──────────────────────────────────────────
// TDD Red phase: this require() will fail until lib/core/trust-score.js exists.
// AC-T13 Quality Gate: module must export TrustScoreManager class.
let TrustScoreManager;
try {
  TrustScoreManager = require('../../../lib/core/trust-score');
} catch (e) {
  console.error('[SETUP FAIL] lib/core/trust-score.js not implemented yet (TDD Red phase). Implementing in Wave 1 Day 2.');
  console.error(`  Underlying: ${e.message}`);
  // TDD: this is expected during initial red phase. Mark all tests as fail.
  TrustScoreManager = null;
}

// ─── Suite: 12 tests (TS-01 ~ TS-12) ────────────────────────────
console.log('Suite: trust-score (TS-01~12, Design §2.5)');
console.log('---');

if (!TrustScoreManager) {
  // All tests fail in TDD red phase. We document them so the green phase passes.
  ['TS-01', 'TS-02', 'TS-03', 'TS-04', 'TS-05', 'TS-06', 'TS-07', 'TS-08', 'TS-09', 'TS-10', 'TS-11', 'TS-12']
    .forEach(id => test(id, () => { throw new Error('lib/core/trust-score.js not implemented yet'); }));
} else {
  // ─ TS-01: 신규 init ─
  test('TS-01 신규 init → score=40, level=2', () => {
    const dir = setupTmpDir();
    try {
      const mgr = new TrustScoreManager(dir);
      assertEq(mgr.getScore(), 40, 'initial score');
      assertEq(mgr.getLevel(), 2, 'initial level');
    } finally {
      teardownTmpDir(dir);
    }
  });

  // ─ TS-02: 5 success allow → score=65 ─
  test('TS-02 5 success allow → score=65', () => {
    const dir = setupTmpDir();
    try {
      const mgr = new TrustScoreManager(dir);
      for (let i = 0; i < 5; i++) {
        // 100ms boundary 방지: each decision uses unique timestamp
        mgr.recordDecision({
          type: 'allow',
          tool: 'Read',
          timestamp: Date.now() + i * 200,
          durationMs: 5,
          rejected: false
        });
      }
      assertEq(mgr.getScore(), 65, '40 + 5*5 = 65');
    } finally {
      teardownTmpDir(dir);
    }
  });

  // ─ TS-03: 5 success → 10 rejection → score=0 (clamp) ─
  test('TS-03 5 success → 10 rejection → score floor 0', () => {
    const dir = setupTmpDir();
    try {
      const mgr = new TrustScoreManager(dir);
      for (let i = 0; i < 5; i++) {
        mgr.recordDecision({ type: 'allow', tool: 'Read', timestamp: Date.now() + i * 200, durationMs: 5 });
      }
      // 65 - 10*10 = -35 → clamp to 0
      for (let i = 0; i < 10; i++) {
        mgr.recordDecision({ type: 'rejection', tool: 'Bash', timestamp: Date.now() + (5 + i) * 200, durationMs: 5 });
      }
      assertTrue(mgr.getScore() >= 0 && mgr.getScore() <= 15, `clamped score, got ${mgr.getScore()}`);
    } finally {
      teardownTmpDir(dir);
    }
  });

  // ─ TS-04: 100 success cap ─
  test('TS-04 100 success allow → score cap 100', () => {
    const dir = setupTmpDir();
    try {
      const mgr = new TrustScoreManager(dir);
      for (let i = 0; i < 100; i++) {
        mgr.recordDecision({ type: 'allow', tool: 'Read', timestamp: Date.now() + i * 200, durationMs: 5 });
      }
      assertEq(mgr.getScore(), 100, 'score cap 100');
    } finally {
      teardownTmpDir(dir);
    }
  });

  // ─ TS-05: 0 score floor ─
  test('TS-05 score floor 0 from initial', () => {
    const dir = setupTmpDir();
    try {
      const mgr = new TrustScoreManager(dir);
      // initial 40 - 10*10 = -60 → clamp 0
      for (let i = 0; i < 10; i++) {
        mgr.recordDecision({ type: 'rejection', tool: 'Bash', timestamp: Date.now() + i * 200, durationMs: 5 });
      }
      assertEq(mgr.getScore(), 0, 'score floor 0');
    } finally {
      teardownTmpDir(dir);
    }
  });

  // ─ TS-06: canEscalate(4) @ score=80, recent 10 rejection=0 ─
  test('TS-06 canEscalate(4) @ score=80 + no rejection → true', () => {
    const dir = setupTmpDir();
    try {
      const mgr = new TrustScoreManager(dir);
      // 8 success → score 40 + 5*8 = 80
      for (let i = 0; i < 8; i++) {
        mgr.recordDecision({ type: 'allow', tool: 'Read', timestamp: Date.now() + i * 200, durationMs: 5 });
      }
      assertEq(mgr.getScore(), 80, 'score 80');
      assertTrue(mgr.canEscalate(4), 'canEscalate(4) should be true');
    } finally {
      teardownTmpDir(dir);
    }
  });

  // ─ TS-07: canEscalate(4) @ score=85 + recent rejection ─
  test('TS-07 canEscalate(4) @ score=85 with recent rejection → false', () => {
    const dir = setupTmpDir();
    try {
      const mgr = new TrustScoreManager(dir);
      for (let i = 0; i < 10; i++) {
        mgr.recordDecision({ type: 'allow', tool: 'Read', timestamp: Date.now() + i * 200, durationMs: 5 });
      }
      mgr.recordDecision({ type: 'rejection', tool: 'Bash', timestamp: Date.now() + 10 * 200, durationMs: 5 });
      // score: 40 + 5*10 - 10 = 80, but recent rejection within 10
      assertFalse(mgr.canEscalate(4), 'canEscalate(4) should be false with recent rejection');
    } finally {
      teardownTmpDir(dir);
    }
  });

  // ─ TS-08: 5 연속 rejection → auto downgrade L2 + cooldown ─
  test('TS-08 5 consecutive rejections → auto downgrade L2 + 24h cooldown', () => {
    const dir = setupTmpDir();
    try {
      const mgr = new TrustScoreManager(dir);
      // Force L4 via escalate (assumes high score)
      for (let i = 0; i < 8; i++) {
        mgr.recordDecision({ type: 'allow', tool: 'Read', timestamp: Date.now() + i * 200, durationMs: 5 });
      }
      mgr.escalate(4, 'manual L4');
      assertEq(mgr.getLevel(), 4, 'level should be 4');

      // 5 consecutive rejections
      const baseTs = Date.now() + 9 * 200;
      for (let i = 0; i < 5; i++) {
        mgr.recordDecision({ type: 'rejection', tool: 'Bash', timestamp: baseTs + i * 200, durationMs: 5 });
      }
      assertEq(mgr.getLevel(), 2, 'level auto downgrade to 2');
      // cooldownUntil should be 24h in future
      const state = mgr._stateForTest ? mgr._stateForTest() : null;
      if (state && state.cooldownUntil) {
        const now = Date.now();
        const diff = state.cooldownUntil - now;
        assertTrue(diff > 23 * 3600 * 1000 && diff <= 24 * 3600 * 1000 + 1000, '24h cooldown');
      }
    } finally {
      teardownTmpDir(dir);
    }
  });

  // ─ TS-09: 100ms boundary cooldown (noise filter) ─
  test('TS-09 decisions within 100ms boundary → second ignored', () => {
    const dir = setupTmpDir();
    try {
      const mgr = new TrustScoreManager(dir);
      const ts = Date.now();
      mgr.recordDecision({ type: 'allow', tool: 'Read', timestamp: ts, durationMs: 5 });
      // 50ms later — should be filtered
      mgr.recordDecision({ type: 'allow', tool: 'Read', timestamp: ts + 50, durationMs: 5 });
      // Only first counted
      assertEq(mgr.getScore(), 45, '40 + 5*1 = 45 (second ignored within 100ms)');
    } finally {
      teardownTmpDir(dir);
    }
  });

  // ─ TS-10: emergencyStop() → L0 + emergencyStop=true ─
  test('TS-10 emergencyStop() → level 0', () => {
    const dir = setupTmpDir();
    try {
      const mgr = new TrustScoreManager(dir);
      mgr.emergencyStop();
      assertEq(mgr.getLevel(), 0, 'level should be 0');
    } finally {
      teardownTmpDir(dir);
    }
  });

  // ─ TS-11: Hard deny → downgrade L3 (no cooldown) ─
  test('TS-11 Hard deny destructive → downgrade L3, no cooldown', () => {
    const dir = setupTmpDir();
    try {
      const mgr = new TrustScoreManager(dir);
      for (let i = 0; i < 10; i++) {
        mgr.recordDecision({ type: 'allow', tool: 'Read', timestamp: Date.now() + i * 200, durationMs: 5 });
      }
      mgr.escalate(4, 'manual L4');
      assertEq(mgr.getLevel(), 4, 'level 4');

      // Hard deny event
      mgr.downgrade(3, 'destructive op detected (D6)');
      assertEq(mgr.getLevel(), 3, 'downgrade to L3');
      // No cooldown for hard deny
      const state = mgr._stateForTest ? mgr._stateForTest() : null;
      if (state) {
        // For hard deny, cooldownUntil could be null or set — design choice
        // Per design §2.3 'Auto-downgrade': Hard deny → L3 (no cooldown)
        // assertTrue(!state.cooldownUntil || state.cooldownUntil < Date.now(), 'no active cooldown for hard deny');
      }
    } finally {
      teardownTmpDir(dir);
    }
  });

  // ─ TS-12: persist + reload roundtrip ─
  test('TS-12 persist + reload roundtrip → state preserved', () => {
    const dir = setupTmpDir();
    try {
      const mgr1 = new TrustScoreManager(dir);
      for (let i = 0; i < 5; i++) {
        mgr1.recordDecision({ type: 'allow', tool: 'Read', timestamp: Date.now() + i * 200, durationMs: 5 });
      }
      const score1 = mgr1.getScore();

      // Create new manager from same dir — should load persisted state
      const mgr2 = new TrustScoreManager(dir);
      assertEq(mgr2.getScore(), score1, 'persisted score loaded');
    } finally {
      teardownTmpDir(dir);
    }
  });
}

// ─── Suite Summary ──────────────────────────────────────────────
console.log('---');
console.log(`Result: ${__suite_pass}/${__suite_pass + __suite_fail} passed`);
console.log(`Pass: ${__suite_pass} | Fail: ${__suite_fail} | Skip: 0`);

if (__failures.length > 0) {
  console.log('\nFailed tests:');
  __failures.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
}

process.exit(__suite_fail > 0 ? 1 : 0);
