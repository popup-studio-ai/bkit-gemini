/**
 * llm-replay — Dynamic Regression for BKIT_TEST_MODE record/replay framework
 *
 * Sprint: S1 v2.0.7-ci-stub-mode (P3)
 * Spec: AC-CS1, AC-CS3, AC-CS4
 *
 * 핵심: 3-mode 분기 + hash 결정성 + fail-fast + I/O 격리 동적 검증.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

let __pass = 0;
let __fail = 0;
const __failures = [];
const __queue = [];

function test(name, fn) { __queue.push({ name, fn }); }

async function runAll() {
  for (const { name, fn } of __queue) {
    try {
      const result = fn();
      if (result && typeof result.then === 'function') await result;
      __pass++;
      console.log(`  [PASS] ${name}`);
    } catch (e) {
      __fail++;
      __failures.push({ name, error: e.message });
      console.error(`  [FAIL] ${name}\n         ${e.message}`);
    }
  }
}

function assertTrue(c, m) { if (!c) throw new Error(m || 'assertTrue'); }
function assertFalse(c, m) { if (c) throw new Error(m || 'assertFalse'); }
function assertEq(a, b, m) { if (a !== b) throw new Error(`${m}: got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`); }
function assertContains(s, sub, m) {
  if (!s || s.indexOf(sub) === -1) throw new Error(`${m || 'assertContains'}: missing ${JSON.stringify(sub)}`);
}

console.log('Suite: llm-replay (BKIT_TEST_MODE 3-mode framework 동적 검증)');
console.log('---');

const LR = require('../../../lib/test/llm-replay');

// 격리: FIXTURE_DIR을 임시 위치로 — 실 fixture 오염 방지. 단 require 후 변경 불가하므로
// stub miss test는 hash가 absurd하면 자연스럽게 miss.
// record test는 임시 fixture를 작성한 뒤 즉시 cleanup.

// ── LR-01~04: computeRequestHash 결정성 / 순서 / env / cwd ──

test('LR-01 동일 입력에 동일 hash (결정성)', () => {
  const req = { args: ['-p', 'hello'], env: { GEMINI_CLI_TRUST_WORKSPACE: 'true' } };
  const h1 = LR.computeRequestHash(req);
  const h2 = LR.computeRequestHash(req);
  assertEq(h1, h2, 'hash must be deterministic');
  assertEq(h1.length, 16, 'hash must be 16 hex chars');
});

test('LR-02 args 순서 다르면 다른 hash (의미 차이 반영)', () => {
  const a = LR.computeRequestHash({ args: ['-p', 'a', '-x', 'b'] });
  const b = LR.computeRequestHash({ args: ['-x', 'b', '-p', 'a'] });
  assertFalse(a === b, 'arg order matters');
});

test('LR-03 env allowlist 외 key는 hash에 영향 없음', () => {
  const baseEnv = { GEMINI_CLI_TRUST_WORKSPACE: 'true' };
  const withRandom = { ...baseEnv, HOME: '/foo', SECRET_TOKEN: 'xyz', PATH: '/bin' };
  const h1 = LR.computeRequestHash({ args: ['-p', 'x'], env: baseEnv });
  const h2 = LR.computeRequestHash({ args: ['-p', 'x'], env: withRandom });
  assertEq(h1, h2, 'non-allowlisted env must not affect hash');
});

test('LR-04 cwd absolute path 변화는 hash에 영향 없음 (basename만)', () => {
  const h1 = LR.computeRequestHash({ args: ['-p', 'x'], cwd: '/Users/alice/proj/bkit-gemini' });
  const h2 = LR.computeRequestHash({ args: ['-p', 'x'], cwd: '/home/bob/work/bkit-gemini' });
  assertEq(h1, h2, 'absolute path part must not leak into hash');
});

// ── LR-05~06: stub mode ──

test('LR-05 stub mode + fixture 부재 → fail-fast with hint', async () => {
  process.env.BKIT_TEST_MODE = 'stub';
  try {
    let thrown = null;
    try {
      await LR.recordOrReplay({ args: ['-p', 'definitely-not-cached-' + Date.now()], label: 'L0-miss-test' });
    } catch (e) { thrown = e; }
    assertTrue(thrown !== null, 'stub mode miss must throw');
    assertEq(thrown.code, 'BKIT_STUB_MISS', 'error must carry BKIT_STUB_MISS code');
    assertContains(thrown.message, 'BKIT_TEST_MODE=record', 'hint must mention record mode');
    assertTrue(thrown.fixturePath && thrown.hash, 'error must carry hash + path metadata');
  } finally {
    delete process.env.BKIT_TEST_MODE;
  }
});

test('LR-06 stub mode + fixture 존재 → fixture 반환, spawn 0회', async () => {
  // 임시 fixture 작성
  const tmpFixtureDir = LR.FIXTURE_DIR;
  if (!fs.existsSync(tmpFixtureDir)) fs.mkdirSync(tmpFixtureDir, { recursive: true });
  const req = { args: ['-p', 'lr06-stub-hit'], env: {}, label: 'LR-06-stub-hit' };
  const hash = LR.computeRequestHash(req);
  const fixturePath = LR.getFixturePath(req.label, hash);
  LR.saveFixture(fixturePath, {
    hash,
    captured_at: '2026-05-15T00:00:00.000Z',
    gemini_cli_version: '0.42.0',
    bkit_version: '2.0.7',
    request: { args: req.args, env: {}, cwd_rel: path.basename(process.cwd()) },
    response: { stdout: 'STUB-HIT-LR06', stderr: '', exitCode: 0 }
  });

  // spawn 차단 (실 호출 시 fail로 잡힘)
  let spawnCalled = false;
  LR._setRunLiveImpl(() => { spawnCalled = true; return Promise.resolve({ stdout: 'LIVE-SHOULD-NOT-RUN', stderr: '', exitCode: 0 }); });

  process.env.BKIT_TEST_MODE = 'stub';
  try {
    const result = await LR.recordOrReplay(req);
    assertEq(result.stdout, 'STUB-HIT-LR06', 'must return fixture stdout');
    assertEq(result.fromFixture, true, 'fromFixture flag must be true');
    assertFalse(spawnCalled, 'spawn must not be called in stub mode hit');
  } finally {
    delete process.env.BKIT_TEST_MODE;
    fs.unlinkSync(fixturePath);
  }
});

// ── LR-07: live mode ──

test('LR-07 live mode → runLive 호출 (mock spawn으로 검증)', async () => {
  let invokedWith = null;
  LR._setRunLiveImpl((req) => {
    invokedWith = req;
    return Promise.resolve({ stdout: 'LIVE-RESPONSE', stderr: '', exitCode: 0 });
  });
  process.env.BKIT_TEST_MODE = 'live';
  try {
    const result = await LR.recordOrReplay({ args: ['-p', 'live-test'], label: 'LR-07' });
    assertEq(result.stdout, 'LIVE-RESPONSE');
    assertEq(result.fromFixture, false);
    assertEq(result.mode, 'live');
    assertTrue(invokedWith !== null, 'runLive must be invoked');
  } finally {
    delete process.env.BKIT_TEST_MODE;
  }
});

// ── LR-08: record mode ──

test('LR-08 record mode → fixture 자동 저장', async () => {
  LR._setRunLiveImpl(() => Promise.resolve({ stdout: 'RECORD-CAPTURE-08', stderr: '', exitCode: 0 }));
  process.env.BKIT_TEST_MODE = 'record';
  const req = { args: ['-p', 'lr08-record-' + Date.now()], label: 'LR-08-record' };
  const hash = LR.computeRequestHash(req);
  const fixturePath = LR.getFixturePath(req.label, hash);
  try {
    const result = await LR.recordOrReplay(req);
    assertEq(result.stdout, 'RECORD-CAPTURE-08');
    assertEq(result.fromFixture, false);
    assertTrue(fs.existsSync(fixturePath), 'fixture file must be written');
    const fixture = LR.loadFixture(fixturePath);
    assertEq(fixture.hash, hash);
    assertEq(fixture.response.stdout, 'RECORD-CAPTURE-08');
    assertTrue(typeof fixture.captured_at === 'string' && fixture.captured_at.length > 0,
      'captured_at must be ISO string');
  } finally {
    delete process.env.BKIT_TEST_MODE;
    if (fs.existsSync(fixturePath)) fs.unlinkSync(fixturePath);
  }
});

// ── LR-09: getTestMode ──

test('LR-09 getTestMode 정상 + invalid 값은 live default', () => {
  delete process.env.BKIT_TEST_MODE;
  assertEq(LR.getTestMode(), 'live', 'default should be live');

  process.env.BKIT_TEST_MODE = 'stub';
  assertEq(LR.getTestMode(), 'stub');

  process.env.BKIT_TEST_MODE = 'RECORD';  // case-insensitive
  assertEq(LR.getTestMode(), 'record');

  process.env.BKIT_TEST_MODE = 'invalid-mode';
  assertEq(LR.getTestMode(), 'live', 'invalid value must default to live');

  delete process.env.BKIT_TEST_MODE;
});

// ── LR-10: listFixtures ──

test('LR-10 listFixtures()는 JSON 파일만 반환', () => {
  const fixtures = LR.listFixtures();
  for (const f of fixtures) {
    assertTrue(f.endsWith('.json'), `non-JSON fixture leaked: ${f}`);
  }
});

// ── LR-11: hash 입력 invariants ──

test('LR-11 request.args 부재 시 명시적 오류', () => {
  let thrown = null;
  try { LR.computeRequestHash({}); } catch (e) { thrown = e; }
  assertTrue(thrown !== null && /args/.test(thrown.message), 'must throw on missing args');
});

test('LR-12 recordOrReplay request 검증 (args 필수)', async () => {
  let thrown = null;
  try { await LR.recordOrReplay({ env: {} }); } catch (e) { thrown = e; }
  assertTrue(thrown !== null, 'must throw on missing args');
});

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
