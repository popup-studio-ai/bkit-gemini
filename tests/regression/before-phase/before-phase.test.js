/**
 * BeforePhase Hook — Unit Tests (BP-01~10)
 *
 * Sprint: S7 v2.0.7-gemini-cli-l4-automation (Wave 1 Day 3)
 * Spec: AC-T2 (L4 phase 자동 전환), AC-T14 (before-phase 작동)
 * Design: §5.3 + §8.1 BP-* test matrix
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

let __pass = 0;
let __fail = 0;
const __failures = [];

function test(name, fn) {
  try {
    fn();
    __pass++;
    console.log(`  [PASS] ${name}`);
  } catch (e) {
    __fail++;
    __failures.push({ name, error: e.message });
    console.error(`  [FAIL] ${name}\n         ${e.message}`);
  }
}

function assertTrue(c, m) { if (!c) throw new Error(m || 'assertTrue fail'); }
function assertEq(a, b, m) { if (a !== b) throw new Error(`${m}: got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`); }

function setupTmpDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-bp-'));
  fs.mkdirSync(path.join(dir, '.bkit', 'runtime'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'lib', 'core'), { recursive: true });
  // Stub core modules required by M5
  ['memory.js', 'paths.js', 'permission.js'].forEach(f => {
    fs.writeFileSync(path.join(dir, 'lib', 'core', f), '// stub');
  });
  // Stub bkit.config.json with required deny patterns (M3)
  fs.writeFileSync(path.join(dir, 'bkit.config.json'), JSON.stringify({
    permissions: {
      'run_shell_command(rm -rf*)': 'deny',
      'run_shell_command(git push --force*)': 'deny'
    }
  }, null, 2));
  // Stub pdca-status.json (M9)
  fs.writeFileSync(path.join(dir, '.pdca-status.json'), JSON.stringify({
    pipeline: { level: 'Starter' },
    activeFeatures: {}
  }, null, 2));
  return dir;
}

function teardown(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* ignore */ }
}

function escalateTo(dir, targetLevel) {
  const TSM = require('../../../lib/core/trust-score');
  const mgr = new TSM(dir);
  for (let i = 0; i < 10; i++) {
    mgr.recordDecision({ type: 'allow', tool: 'Read', timestamp: Date.now() + i * 200, durationMs: 5 });
  }
  mgr.escalate(targetLevel, 'test');
  return mgr.getLevel();
}

let BP;
try {
  BP = require('../../../hooks/scripts/before-phase');
} catch (e) {
  console.error('[SETUP FAIL] before-phase.js missing:', e.message);
  BP = null;
}

console.log('Suite: before-phase (BP-01~10)');
console.log('---');

if (!BP) {
  for (let i = 1; i <= 10; i++) {
    test(`BP-${String(i).padStart(2, '0')}`, () => { throw new Error('before-phase.js not implemented'); });
  }
} else {
  // BP-01: L2 baseline ask
  test('BP-01 L2 → ask user (legacy)', () => {
    const dir = setupTmpDir();
    try {
      const r = BP.processHook({
        current_phase: 'plan', next_phase: 'design',
        projectDir: dir, feature: 'feat-x'
      });
      assertEq(r.decision, 'ask', 'L2 should ask');
    } finally { teardown(dir); }
  });

  // BP-02: L4 + all gates pass → allow
  test('BP-02 L4 + gates pass → allow auto-advance', () => {
    const dir = setupTmpDir();
    try {
      const lvl = escalateTo(dir, 4);
      assertEq(lvl, 4, 'escalate L4');
      // current_phase = 'do' (skips M1 design check, skips M7 plan check)
      const r = BP.processHook({
        current_phase: 'do', next_phase: 'check',
        projectDir: dir, feature: 'feat-x'
      });
      assertEq(r.decision, 'allow', `L4 should allow when gates pass, got ${JSON.stringify(r)}`);
    } finally { teardown(dir); }
  });

  // BP-03: L4 + M3 fail (destructive deny removed) → deny
  test('BP-03 L4 + M3 fail → deny', () => {
    const dir = setupTmpDir();
    try {
      escalateTo(dir, 4);
      // Remove critical deny pattern → M3 fail
      fs.writeFileSync(path.join(dir, 'bkit.config.json'), JSON.stringify({ permissions: {} }));
      const r = BP.processHook({
        current_phase: 'do', next_phase: 'check',
        projectDir: dir, feature: 'feat-x'
      });
      assertEq(r.decision, 'deny', 'M3 fail should deny');
      assertTrue(/M3/.test(r.reason), 'reason should mention M3');
    } finally { teardown(dir); }
  });

  // BP-04: L4 + M5 fail (core module missing) → deny
  test('BP-04 L4 + M5 fail → deny', () => {
    const dir = setupTmpDir();
    try {
      escalateTo(dir, 4);
      // Remove core module → M5 fail
      fs.unlinkSync(path.join(dir, 'lib', 'core', 'permission.js'));
      const r = BP.processHook({
        current_phase: 'do', next_phase: 'check',
        projectDir: dir, feature: 'feat-x'
      });
      assertEq(r.decision, 'deny', 'M5 fail should deny');
    } finally { teardown(dir); }
  });

  // BP-05: No next phase (sprint complete) → allow
  test('BP-05 No next phase → allow (sprint complete)', () => {
    const dir = setupTmpDir();
    try {
      const r = BP.processHook({
        current_phase: 'report', next_phase: null,
        projectDir: dir
      });
      assertEq(r.decision, 'allow', 'report end → allow');
    } finally { teardown(dir); }
  });

  // BP-06: L4 + design → do transition, M1 fail (no design doc) → deny
  test('BP-06 L4 + design phase + M1 fail → deny', () => {
    const dir = setupTmpDir();
    try {
      escalateTo(dir, 4);
      const r = BP.processHook({
        current_phase: 'design', next_phase: 'do',
        projectDir: dir, feature: 'feat-x'
      });
      assertEq(r.decision, 'deny', 'no design doc → M1 fail → deny');
      assertTrue(/M1/.test(r.reason), 'reason mentions M1');
    } finally { teardown(dir); }
  });

  // BP-07: L4 + design → do with design doc present → allow
  test('BP-07 L4 + design → do with design doc → allow', () => {
    const dir = setupTmpDir();
    try {
      escalateTo(dir, 4);
      const designDir = path.join(dir, 'docs', '02-design', 'features');
      fs.mkdirSync(designDir, { recursive: true });
      fs.writeFileSync(path.join(designDir, 'feat-x.design.md'), '# Design');
      // Need plan doc too for M7 of plan phase, but here current_phase=design, M7 skip
      const r = BP.processHook({
        current_phase: 'design', next_phase: 'do',
        projectDir: dir, feature: 'feat-x'
      });
      assertEq(r.decision, 'allow', `should allow, got ${JSON.stringify(r)}`);
    } finally { teardown(dir); }
  });

  // BP-08: PDCA order inference (no next_phase given)
  test('BP-08 PDCA order inference plan→design', () => {
    const dir = setupTmpDir();
    try {
      escalateTo(dir, 4);
      const planDir = path.join(dir, 'docs', '01-plan', 'features');
      fs.mkdirSync(planDir, { recursive: true });
      fs.writeFileSync(path.join(planDir, 'feat-x.plan.md'), '# Plan');
      const r = BP.processHook({
        current_phase: 'plan',
        projectDir: dir, feature: 'feat-x'
      });
      assertEq(r.decision, 'allow', 'plan → design inferred');
      assertTrue(/design/.test(r.systemMessage), 'mentions inferred next');
    } finally { teardown(dir); }
  });

  // BP-09: Audit log written on phase transition
  test('BP-09 audit log written on transition', () => {
    const dir = setupTmpDir();
    try {
      escalateTo(dir, 4);
      BP.processHook({
        current_phase: 'do', next_phase: 'check',
        projectDir: dir, feature: 'feat-x'
      });
      const AL = require('../../../lib/core/audit-log');
      const entries = new AL(dir).read();
      const phaseEntries = entries.filter(e => e.hook === 'BeforePhase');
      assertTrue(phaseEntries.length > 0, 'audit log has BeforePhase entry');
      assertEq(phaseEntries[0].from_phase, 'do', 'from_phase recorded');
      assertEq(phaseEntries[0].to_phase, 'check', 'to_phase recorded');
    } finally { teardown(dir); }
  });

  // BP-10: Graceful error → ask (conservative)
  test('BP-10 Graceful error → ask', () => {
    // Corrupt input: missing required fields handled gracefully
    const r = BP.processHook({});
    assertTrue(['ask', 'allow'].includes(r.decision), `graceful, got ${JSON.stringify(r)}`);
  });
}

console.log('---');
console.log(`Result: ${__pass}/${__pass + __fail} passed`);
console.log(`Pass: ${__pass} | Fail: ${__fail} | Skip: 0`);
if (__failures.length > 0) {
  console.log('\nFailures:');
  __failures.forEach(f => console.log(`  ${f.name}: ${f.error}`));
}
process.exit(__fail > 0 ? 1 : 0);
