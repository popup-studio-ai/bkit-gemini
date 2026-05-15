/**
 * Sprint S1~S6 L4 Dry-Run Tests (DR-S1~S6)
 *
 * Sprint: S7 v2.0.7-gemini-cli-l4-automation (Wave 1 Day 3)
 * Spec: AC-T11 (S1~S6 각 sprint를 L4 모드 + emergency_stop 즉시 시나리오)
 * Design: §8.3 DR-S1~DR-S6
 *
 * 시나리오:
 *   1. Setup: L4 escalation + bkit.config.json valid + core modules present
 *   2. Simulate sprint start: BeforePhase hook with current=plan, next=design
 *   3. Verify: L4 → BeforePhase auto-allow (assuming gates pass)
 *   4. Simulate emergency_stop (Ctrl+C 2회 등가 호출)
 *   5. Verify: level → 0 + checkpoint auto-created (if any code changes were captured)
 *   6. Verify: audit log records full sequence
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

function assertTrue(c, m) { if (!c) throw new Error(m || 'assertTrue'); }
function assertEq(a, b, m) { if (a !== b) throw new Error(`${m}: got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`); }

function setupSprintFixture(sprintName) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `bkit-dr-${sprintName.slice(0, 20)}-`));
  fs.mkdirSync(path.join(dir, '.bkit', 'runtime'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'lib', 'core'), { recursive: true });
  // Stub required core modules (M5)
  ['memory.js', 'paths.js', 'permission.js'].forEach(f => {
    fs.writeFileSync(path.join(dir, 'lib', 'core', f), '// stub');
  });
  // Stub bkit.config.json (M3 destructive deny)
  fs.writeFileSync(path.join(dir, 'bkit.config.json'), JSON.stringify({
    permissions: {
      'run_shell_command(rm -rf*)': 'deny',
      'run_shell_command(git push --force*)': 'deny'
    }
  }, null, 2));
  // Stub pdca-status.json (M9)
  fs.writeFileSync(path.join(dir, '.pdca-status.json'), JSON.stringify({
    pipeline: { level: 'Starter' },
    primaryFeature: sprintName,
    activeFeatures: { [sprintName]: { phase: 'plan' } }
  }, null, 2));
  // Stub plan doc (M7)
  const planDir = path.join(dir, 'docs', '01-plan', 'features');
  fs.mkdirSync(planDir, { recursive: true });
  fs.writeFileSync(path.join(planDir, `${sprintName}.plan.md`), '# Plan');
  return dir;
}
function teardown(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* */ }
}

const TSM = require('../../../lib/core/trust-score');
const BP = require('../../../hooks/scripts/before-phase');
const CM = require('../../../lib/core/checkpoint');
const AL = require('../../../lib/core/audit-log');

function dryRunSprint(sprintName) {
  const dir = setupSprintFixture(sprintName);
  try {
    // 1. Escalate to L4
    const mgr = new TSM(dir);
    for (let i = 0; i < 10; i++) {
      mgr.recordDecision({ type: 'allow', tool: 'Read', timestamp: Date.now() + i * 200, durationMs: 5 });
    }
    mgr.escalate(4, `${sprintName} dry-run`);
    assertEq(mgr.getLevel(), 4, `${sprintName}: escalate to L4`);

    // 2. Invoke BeforePhase: plan → design
    const phaseResult = BP.processHook({
      current_phase: 'plan',
      next_phase: 'design',
      projectDir: dir,
      feature: sprintName
    });
    assertEq(phaseResult.decision, 'allow', `${sprintName}: phase auto-allow, got ${JSON.stringify(phaseResult)}`);

    // 3. Create a checkpoint (simulating code modification)
    const cm = new CM(dir);
    const stubFile = path.join(dir, 'sprint-work.txt');
    fs.writeFileSync(stubFile, 'before sprint');
    const cpId = cm.create('Edit', [stubFile], { reason: `${sprintName} sprint work` });
    assertTrue(cpId.length > 0, `${sprintName}: checkpoint created`);

    // 4. Simulate emergency_stop (Ctrl+C 2회)
    const mgr2 = new TSM(dir);
    mgr2.emergencyStop();
    assertEq(mgr2.getLevel(), 0, `${sprintName}: emergency_stop → L0`);

    // 5. Verify rollback capability
    fs.writeFileSync(stubFile, 'after sprint, but emergency_stop fired');
    const rb = cm.rollback(cpId, { force: true });
    assertTrue(rb.success, `${sprintName}: rollback success`);
    assertEq(fs.readFileSync(stubFile, 'utf-8'), 'before sprint', `${sprintName}: state restored`);

    // 6. Audit log records sequence
    const al = new AL(dir);
    const entries = al.read();
    const phaseEntry = entries.find(e => e.hook === 'BeforePhase');
    assertTrue(phaseEntry !== undefined, `${sprintName}: BeforePhase audit recorded`);
    assertEq(phaseEntry.decision, 'allow', `${sprintName}: phase decision logged`);
  } finally {
    teardown(dir);
  }
}

console.log('Suite: sprint-dryrun (DR-S1~S6, AC-T11)');
console.log('---');

test('DR-S1 v2.0.7-ci-stub-mode L4 dry-run', () => dryRunSprint('v2.0.7-ci-stub-mode'));
test('DR-S2 v2.0.7-security-baseline-recovery L4 dry-run', () => dryRunSprint('v2.0.7-security-baseline-recovery'));
test('DR-S3 v2.0.7-agent-dispatch-fix L4 dry-run', () => dryRunSprint('v2.0.7-agent-dispatch-fix'));
test('DR-S4 v2.0.7-onboarding-slim L4 dry-run', () => dryRunSprint('v2.0.7-onboarding-slim'));
test('DR-S5 v2.0.7-context-engineering-integration L4 dry-run', () => dryRunSprint('v2.0.7-context-engineering-integration'));
test('DR-S6 v2.0.7-baseline-full-recovery L4 dry-run', () => dryRunSprint('v2.0.7-baseline-full-recovery'));

console.log('---');
console.log(`Result: ${__pass}/${__pass + __fail} passed`);
console.log(`Pass: ${__pass} | Fail: ${__fail} | Skip: 0`);
if (__failures.length > 0) {
  console.log('\nFailures:');
  __failures.forEach(f => console.log(`  ${f.name}: ${f.error}`));
}
process.exit(__fail > 0 ? 1 : 0);
