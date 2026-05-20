/**
 * compaction — Dynamic Regression (S5 W1 Strategy 1)
 *
 * Sprint: S5 v2.0.7-context-engineering-integration
 * Spec: AC-CE1 (Compaction framework with trigger + snapshot + disable toggle)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

let __pass = 0;
let __fail = 0;
const __failures = [];

function test(name, fn) {
  try { fn(); __pass++; console.log(`  [PASS] ${name}`); }
  catch (e) { __fail++; __failures.push({ name, error: e.message }); console.error(`  [FAIL] ${name}\n         ${e.message}`); }
}

function assertTrue(c, m) { if (!c) throw new Error(m || 'assertTrue'); }
function assertFalse(c, m) { if (c) throw new Error(m || 'assertFalse'); }
function assertEq(a, b, m) { if (a !== b) throw new Error(`${m}: got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`); }
function assertContains(s, sub, m) { if (!s || s.indexOf(sub) === -1) throw new Error(`${m || 'assertContains'}: missing ${JSON.stringify(sub)}`); }

console.log('Suite: compaction (S5 W1 Strategy 1 — Context compaction framework)');
console.log('---');

const C = require('../../../lib/core/compactor');

// ── CP-01~04: shouldCompact threshold logic ──

test('CP-01 turn count >= threshold → shouldCompact', () => {
  delete process.env.BKIT_COMPACTION;
  const r = C.shouldCompact({ turnCount: 50, tokenUsage: 0 });
  assertTrue(r.shouldCompact, JSON.stringify(r));
  assertContains(r.reason, '50');
});

test('CP-02 token pct >= threshold → shouldCompact', () => {
  delete process.env.BKIT_COMPACTION;
  const r = C.shouldCompact({ turnCount: 0, tokenUsage: 160_000, contextWindow: 200_000 });
  assertTrue(r.shouldCompact);
  assertContains(r.reason, '80');
});

test('CP-03 under thresholds → no compact', () => {
  delete process.env.BKIT_COMPACTION;
  const r = C.shouldCompact({ turnCount: 10, tokenUsage: 50_000, contextWindow: 200_000 });
  assertFalse(r.shouldCompact);
  assertContains(r.reason, 'under');
});

test('CP-04 BKIT_COMPACTION=false → disabled (regardless of turns/tokens)', () => {
  process.env.BKIT_COMPACTION = 'false';
  try {
    const r = C.shouldCompact({ turnCount: 1000, tokenUsage: 999_999, contextWindow: 100_000 });
    assertFalse(r.shouldCompact);
    assertContains(r.reason, 'BKIT_COMPACTION=false');
  } finally {
    delete process.env.BKIT_COMPACTION;
  }
});

test('CP-05 BKIT_COMPACTION=0 / off / OFF → disabled (case-insensitive)', () => {
  for (const v of ['0', 'off', 'OFF', 'False']) {
    process.env.BKIT_COMPACTION = v;
    try {
      assertFalse(C.isCompactionEnabled(), `BKIT_COMPACTION=${v} should disable`);
    } finally {
      delete process.env.BKIT_COMPACTION;
    }
  }
});

// ── CP-06~08: defaultExtractDecisions heuristic ──

test('CP-06 extractDecisions: decisions / openItems / codeRefs 분류', () => {
  const messages = [
    'D1: Use SHA256 for hashing',
    'TODO: Add unit tests for module X',
    'See lib/core/compactor.js:42 for the implementation',
    'BLOCKED: Schema migration pending review',
    '결정: 21-agent registry로 동기화',
    'Refer also to tests/regression/foo.test.js:128'
  ];
  const r = C.defaultExtractDecisions({ messages });
  assertTrue(r.decisions.length >= 2, `decisions: ${r.decisions}`);
  assertTrue(r.openItems.length >= 2, `openItems: ${r.openItems}`);
  assertTrue(r.codeRefs.length >= 2, `codeRefs: ${r.codeRefs}`);
  assertContains(r.codeRefs.join(','), 'lib/core/compactor.js:42');
});

test('CP-07 extractDecisions: bound (50 decisions max)', () => {
  const messages = [];
  for (let i = 1; i <= 100; i++) messages.push(`D${i}: decision ${i}`);
  const r = C.defaultExtractDecisions({ messages });
  assertEq(r.decisions.length, 50, 'must cap at 50 decisions');
});

test('CP-08 extractDecisions: empty input safe', () => {
  const r = C.defaultExtractDecisions({});
  assertEq(r.decisions.length, 0);
  assertEq(r.openItems.length, 0);
  assertEq(r.codeRefs.length, 0);
});

// ── CP-09~11: saveSnapshot + compactSession E2E ──

test('CP-09 saveSnapshot writes JSON in .bkit/snapshots/', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-s5-w1-'));
  try {
    const r = C.saveSnapshot(tmp, { _reason: 'test', summary: { decisions: ['D1'] } });
    assertTrue(fs.existsSync(r.path), 'snapshot file must exist');
    const content = JSON.parse(fs.readFileSync(r.path, 'utf-8'));
    assertEq(content._schemaVersion, '1.0');
    assertEq(content._reason, 'test');
    assertTrue(content._timestamp.length > 0);
    assertTrue(r.size > 0);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('CP-10 compactSession E2E (trigger + snapshot 통합)', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-s5-w1-'));
  try {
    delete process.env.BKIT_COMPACTION;
    const state = {
      turnCount: 60,
      tokenUsage: 100_000,
      messages: ['D1: choice A', 'TODO: review', 'lib/foo.js:10']
    };
    const r = C.compactSession(state, tmp);
    assertTrue(r.compacted, `expected compaction, got: ${JSON.stringify(r)}`);
    assertTrue(fs.existsSync(r.snapshotPath));
    assertTrue(r.summary.decisions.length > 0);
    assertContains(r.reason, '60');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('CP-11 compactSession skip when disabled', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-s5-w1-'));
  process.env.BKIT_COMPACTION = 'false';
  try {
    const r = C.compactSession({ turnCount: 999, tokenUsage: 999_999 }, tmp);
    assertFalse(r.compacted);
    assertContains(r.reason, 'BKIT_COMPACTION=false');
    assertEq(C.listSnapshots(tmp).length, 0);
  } finally {
    delete process.env.BKIT_COMPACTION;
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ── CP-12: retention purge ──

test('CP-12 saveSnapshot retains only last 10 (purge)', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-s5-w1-'));
  try {
    // Create 12 snapshots (artificially via direct write, so timestamps differ)
    const dir = path.join(tmp, '.bkit', 'snapshots');
    fs.mkdirSync(dir, { recursive: true });
    for (let i = 0; i < 12; i++) {
      const ts = `2026-05-15T00-00-${String(i).padStart(2, '0')}-000Z`;
      fs.writeFileSync(path.join(dir, `compact-${ts}.json`), '{}', 'utf-8');
    }
    // Trigger purge via saveSnapshot
    C.saveSnapshot(tmp, { _reason: 'retention-test' });
    const remaining = C.listSnapshots(tmp);
    assertEq(remaining.length, 10, `must retain only 10, got ${remaining.length}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ── CP-13: injectable extractor (future LLM extractor path) ──

test('CP-13 setExtractor() injection works', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-s5-w1-'));
  try {
    let invoked = null;
    C.setExtractor((payload) => {
      invoked = payload;
      return { decisions: ['INJECTED'], openItems: [], codeRefs: [] };
    });
    const r = C.compactSession(
      { turnCount: 60, messages: ['x'] }, tmp
    );
    assertEq(r.summary.decisions[0], 'INJECTED');
    assertTrue(invoked !== null, 'injected extractor must be called');
  } finally {
    C.resetExtractor();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

console.log('---');
console.log(`Result: ${__pass}/${__pass + __fail} passed`);
console.log(`Pass: ${__pass} | Fail: ${__fail} | Skip: 0`);
if (__failures.length > 0) {
  console.log('\nFailures:');
  __failures.forEach(f => console.log(`  ${f.name}: ${f.error}`));
}
process.exit(__fail > 0 ? 1 : 0);
