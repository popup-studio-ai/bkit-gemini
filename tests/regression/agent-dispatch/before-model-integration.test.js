/**
 * before-model integration — Agent Dispatch directive injection
 *
 * Sprint: S3 v2.0.7-agent-dispatch-fix (Wave 1 Day 2)
 * Spec: AC-A6 (BeforeModel injects MCP spawn_agent directive),
 *       AC-A7 (no false positives — meta patterns pass through),
 *       AC-A8 (audit log written on dispatch),
 *       AC-R1 (no regression on non-dispatch prompts)
 */
'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');

let __pass = 0;
let __fail = 0;
const __failures = [];
const __queue = [];

function test(name, fn) {
  __queue.push({ name, fn });
}

async function runAll() {
  for (const { name, fn } of __queue) {
    try {
      const result = fn();
      if (result && typeof result.then === 'function') await result;
      __pass++;
      console.log(`  [PASS] ${name}`);
    } catch (e) {
      __fail++;
      __failures.push({ name, error: e.message, stack: e.stack });
      console.error(`  [FAIL] ${name}\n         ${e.message}`);
    }
  }
}

function assertTrue(c, m) { if (!c) throw new Error(m || 'assertTrue'); }
function assertFalse(c, m) { if (c) throw new Error(m || 'assertFalse'); }
function assertEq(a, b, m) { if (a !== b) throw new Error(`${m}: got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`); }
function assertContains(s, sub, m) {
  if (!s || s.indexOf(sub) === -1) throw new Error(`${m || 'assertContains'}: ${JSON.stringify(s).slice(0, 200)} does not include ${JSON.stringify(sub)}`);
}

let BM;
try {
  BM = require('../../../hooks/scripts/before-model');
} catch (e) {
  console.error('[SETUP FAIL]:', e.message);
  BM = null;
}

console.log('Suite: before-model integration (S3 dispatch directive injection)');
console.log('---');

if (!BM || typeof BM.handler !== 'function') {
  test('BM-* ALL', () => { throw new Error('before-model.js handler missing'); });
} else {

  // Use a temp project dir so audit log writes do not pollute the real workspace
  const tmpProject = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-bm-it-'));

  // ── BM-01~04: Dispatch detection produces directive ──

  test('BM-01 EN dispatch produces additionalContext with directive', async () => {
    const r = await BM.handler({
      prompt: 'Use the code-analyzer agent to evaluate this code: eval(input)',
      projectDir: tmpProject
    });
    assertEq(r.decision, 'allow');
    assertTrue(typeof r.additionalContext === 'string', 'expected additionalContext string');
    assertContains(r.additionalContext, 'Agent Dispatch (bkit S3)');
    assertContains(r.additionalContext, 'mcp__bkit-server__spawn_agent');
    assertContains(r.additionalContext, '"agent_name": "code-analyzer"');
    assertContains(r.additionalContext, '[Agent: code-analyzer]');
    assertContains(r.additionalContext, '[End Agent Output]');
  });

  test('BM-02 KO dispatch matches and injects directive', async () => {
    const r = await BM.handler({
      prompt: 'code-analyzer 에이전트로 이 코드 평가해줘',
      projectDir: tmpProject
    });
    assertEq(r.decision, 'allow');
    assertContains(r.additionalContext, '"agent_name": "code-analyzer"');
    assertContains(r.additionalContext, 'lang=ko');
  });

  test('BM-03 JA dispatch matches and injects directive', async () => {
    const r = await BM.handler({
      prompt: 'code-analyzer エージェントで このコードを評価して',
      projectDir: tmpProject
    });
    assertEq(r.decision, 'allow');
    assertContains(r.additionalContext, '"agent_name": "code-analyzer"');
    assertContains(r.additionalContext, 'lang=ja');
  });

  test('BM-04 ZH dispatch matches and injects directive', async () => {
    const r = await BM.handler({
      prompt: '使用 code-analyzer 代理来评估这段代码',
      projectDir: tmpProject
    });
    assertEq(r.decision, 'allow');
    assertContains(r.additionalContext, '"agent_name": "code-analyzer"');
    assertContains(r.additionalContext, 'lang=zh');
  });

  // ── BM-05~08: False-positive defense ──

  test('BM-05 "What is the X agent" passes through (no directive)', async () => {
    const r = await BM.handler({
      prompt: 'What is the code-analyzer agent?',
      projectDir: tmpProject
    });
    assertEq(r.decision, 'allow');
    if (r.additionalContext) {
      assertFalse(
        /Agent Dispatch \(bkit S3\)/.test(r.additionalContext),
        'meta question must not produce dispatch directive'
      );
    }
  });

  test('BM-06 Code fence with agent name passes through', async () => {
    const r = await BM.handler({
      prompt: '```js\nUse the code-analyzer agent to review\n```',
      projectDir: tmpProject
    });
    assertEq(r.decision, 'allow');
    if (r.additionalContext) {
      assertFalse(/Agent Dispatch \(bkit S3\)/.test(r.additionalContext));
    }
  });

  test('BM-07 Unknown agent name passes through', async () => {
    const r = await BM.handler({
      prompt: 'Use the foo-bar agent to do something nefarious',
      projectDir: tmpProject
    });
    assertEq(r.decision, 'allow');
    if (r.additionalContext) {
      assertFalse(/Agent Dispatch \(bkit S3\)/.test(r.additionalContext));
    }
  });

  test('BM-08 Empty / short prompt yields plain allow', async () => {
    const r1 = await BM.handler({ prompt: '', projectDir: tmpProject });
    assertEq(r1.decision, 'allow');
    assertFalse('additionalContext' in r1, 'empty prompt should not inject context');

    const r2 = await BM.handler({ prompt: 'hi', projectDir: tmpProject });
    assertEq(r2.decision, 'allow');
    assertFalse('additionalContext' in r2, 'short prompt should not inject context');
  });

  // ── BM-09~11: Regression — non-dispatch prompts behave as before ──

  test('BM-09 Plain conversational prompt → no dispatch directive', async () => {
    const r = await BM.handler({
      prompt: 'Can you explain how PDCA cycles work in bkit?',
      projectDir: tmpProject
    });
    assertEq(r.decision, 'allow');
    if (r.additionalContext) {
      assertFalse(/Agent Dispatch \(bkit S3\)/.test(r.additionalContext));
    }
  });

  test('BM-10 Implementation request → no dispatch directive', async () => {
    const r = await BM.handler({
      prompt: 'Please implement a function that calculates fibonacci numbers',
      projectDir: tmpProject
    });
    assertEq(r.decision, 'allow');
    if (r.additionalContext) {
      assertFalse(/Agent Dispatch \(bkit S3\)/.test(r.additionalContext));
    }
  });

  test('BM-11 handler is always async-safe (returns Promise/object)', async () => {
    const r = await BM.handler({
      prompt: 'Use the gap-detector agent to compare design vs implementation',
      projectDir: tmpProject
    });
    assertTrue(r && typeof r === 'object', 'handler must return an object');
    assertEq(r.decision, 'allow');
    assertContains(r.additionalContext, '"agent_name": "gap-detector"');
  });

  // ── BM-12: Audit log written on dispatch (AC-A8) ──

  test('BM-12 Dispatch interception writes audit JSONL entry', async () => {
    // Use a fresh tmp project so we can assert deterministic state
    const auditProject = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-bm-it-audit-'));
    try {
      const r = await BM.handler({
        prompt: 'Use the security-architect agent to review OWASP A03 risks',
        projectDir: auditProject
      });
      assertEq(r.decision, 'allow');
      assertContains(r.additionalContext, '"agent_name": "security-architect"');

      const auditDir = path.join(auditProject, '.bkit', 'state', 'audit');
      assertTrue(fs.existsSync(auditDir), 'audit dir must be created on dispatch');

      let found = null;
      for (const d of fs.readdirSync(auditDir)) {
        const file = path.join(auditDir, d, 'decisions.jsonl');
        if (!fs.existsSync(file)) continue;
        const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            if (entry.reason === 'agent_dispatch_intercepted' && entry.agent === 'security-architect') {
              found = entry;
              break;
            }
          } catch (e) { /* skip */ }
        }
        if (found) break;
      }

      assertTrue(found !== null, 'audit log must contain agent_dispatch_intercepted entry');
      assertEq(found.hook, 'BeforeModel');
      assertEq(found.tool, 'spawn_agent');
      assertEq(found.agent, 'security-architect');
      assertEq(found.event, 'ALLOW');
      assertTrue(typeof found.ts === 'string' && found.ts.length > 0, 'audit entry must have ISO timestamp');
    } finally {
      try { fs.rmSync(auditProject, { recursive: true, force: true }); } catch (e) { /* ignore */ }
    }
  });

  // Cleanup
  try { fs.rmSync(tmpProject, { recursive: true, force: true }); } catch (e) { /* ignore */ }
}

runAll().then(() => {
  console.log('---');
  console.log(`Result: ${__pass}/${__pass + __fail} passed`);
  console.log(`Pass: ${__pass} | Fail: ${__fail} | Skip: 0`);
  if (__failures.length > 0) {
    console.log('\nFailures:');
    __failures.forEach(f => console.log(`  ${f.name}: ${f.error}`));
  }
  process.exit(__fail > 0 ? 1 : 0);
});
