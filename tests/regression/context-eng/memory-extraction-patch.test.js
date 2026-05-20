/**
 * memory-extraction-patch — Dynamic Regression (S5 W3 Strategy 3)
 *
 * Sprint: S5 v2.0.7-context-engineering-integration
 * Spec: AC-CE3 (agent-memory ↔ extraction.patch 양방향 sync round-trip)
 *       AC-CE6 (기존 21 agent memory file 무손상)
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
function assertThrows(fn, sub, m) {
  let thrown = null;
  try { fn(); } catch (e) { thrown = e; }
  if (!thrown) throw new Error(`${m || 'assertThrows'}: no error thrown`);
  if (sub && !thrown.message.includes(sub)) {
    throw new Error(`${m || 'assertThrows'}: expected message to include ${JSON.stringify(sub)}, got ${JSON.stringify(thrown.message)}`);
  }
}

console.log('Suite: memory-extraction-patch (S5 W3 양방향 sync)');
console.log('---');

const { AgentMemoryManager } = require('../../../lib/core/agent-memory');

// ── MX-01~03: exportAsExtractionPatch 형태 ──

test('MX-01 빈 memory도 valid extraction.patch 반환 (스키마 보장)', () => {
  const mgr = new AgentMemoryManager('test-agent', 'project');
  const patch = mgr.exportAsExtractionPatch();
  assertEq(patch.schema, 'bkit-agent-memory/1.0');
  assertEq(patch.agent, 'test-agent');
  assertEq(patch.scope, 'project');
  assertTrue(typeof patch.captured_at === 'string' && patch.captured_at.length > 0);
  assertTrue(Array.isArray(patch.patches));
  assertEq(patch.patches.length, 0);
});

test('MX-02 sessions + patterns 모두 patches로 export', () => {
  const mgr = new AgentMemoryManager('test-agent', 'project');
  mgr.load(os.tmpdir());
  mgr.addSession({ sessionId: 's1', summary: 'session 1', keyFindings: ['fA', 'fB'] });
  mgr.addSession({ sessionId: 's2', summary: 'session 2' });
  mgr.updatePatterns({ commonGaps: ['gap1', 'gap2'], projectSpecificNotes: 'note' });

  const patch = mgr.exportAsExtractionPatch();
  const sessionPatches = patch.patches.filter(p => p.type === 'session');
  const patternPatches = patch.patches.filter(p => p.type === 'pattern');

  assertEq(sessionPatches.length, 2);
  assertEq(sessionPatches[0].session_id, 's2');  // newest-first
  assertEq(sessionPatches[1].session_id, 's1');
  assertTrue(patternPatches.some(p => p.key === 'commonGaps'));
  assertTrue(patternPatches.some(p => p.key === 'projectSpecificNotes'));
});

test('MX-03 empty pattern (빈 배열/빈 string)은 export skip', () => {
  const mgr = new AgentMemoryManager('test-agent', 'project');
  mgr.load(os.tmpdir());
  mgr.updatePatterns({ commonGaps: [], projectSpecificNotes: '', realKey: 'value' });
  const patch = mgr.exportAsExtractionPatch();
  const patternPatches = patch.patches.filter(p => p.type === 'pattern');
  assertEq(patternPatches.length, 1, `expected only realKey, got: ${JSON.stringify(patternPatches)}`);
  assertEq(patternPatches[0].key, 'realKey');
});

// ── MX-04~07: importFromExtractionPatch 정합성 + 안전성 ──

test('MX-04 invalid schema throws', () => {
  const mgr = new AgentMemoryManager('test-agent', 'project');
  assertThrows(() => mgr.importFromExtractionPatch({ schema: 'invalid' }), 'unsupported schema');
});

test('MX-05 agent name mismatch throws', () => {
  const mgr = new AgentMemoryManager('agent-A', 'project');
  assertThrows(
    () => mgr.importFromExtractionPatch({ schema: 'bkit-agent-memory/1.0', agent: 'agent-B', patches: [] }),
    'agent name mismatch'
  );
});

test('MX-06 session patches imported (newest-first) + 중복 session_id skip', () => {
  const mgr = new AgentMemoryManager('test-agent', 'project');
  mgr.load(os.tmpdir());
  mgr.addSession({ sessionId: 'existing-1', summary: 'pre-existing' });

  const result = mgr.importFromExtractionPatch({
    schema: 'bkit-agent-memory/1.0',
    agent: 'test-agent',
    patches: [
      { type: 'session', session_id: 'new-1', summary: 'imported 1', key_findings: ['x'] },
      { type: 'session', session_id: 'new-2', summary: 'imported 2' },
      { type: 'session', session_id: 'existing-1', summary: 'dup attempt' } // should skip
    ]
  });

  assertEq(result.sessionsAdded, 2);
  assertEq(result.skipped, 1, 'duplicate session_id must be skipped');
  assertTrue(mgr.memory.sessions.some(s => s.sessionId === 'new-1'));
  assertTrue(mgr.memory.sessions.some(s => s.sessionId === 'new-2'));
});

test('MX-07 pattern array merging (union) + scalar overwrite', () => {
  const mgr = new AgentMemoryManager('test-agent', 'project');
  mgr.load(os.tmpdir());
  mgr.updatePatterns({ commonGaps: ['existing-A', 'existing-B'], scalar: 'old' });

  const result = mgr.importFromExtractionPatch({
    schema: 'bkit-agent-memory/1.0',
    agent: 'test-agent',
    patches: [
      { type: 'pattern', key: 'commonGaps', value: ['existing-A', 'new-C'] },
      { type: 'pattern', key: 'scalar', value: 'new' }
    ]
  });

  assertEq(result.patternsApplied, 2);
  // array union, no duplicates
  const gaps = mgr.memory.patterns.commonGaps;
  assertEq(gaps.length, 3, `expected 3 unique, got: ${JSON.stringify(gaps)}`);
  assertTrue(gaps.includes('existing-A') && gaps.includes('existing-B') && gaps.includes('new-C'));
  assertEq(mgr.memory.patterns.scalar, 'new');
});

// ── MX-08: round-trip 정합성 (export → import → export 동치) ──

test('MX-08 round-trip: export → fresh mgr import → re-export = 동치', () => {
  const src = new AgentMemoryManager('rt-agent', 'project');
  src.load(os.tmpdir());
  src.addSession({ sessionId: 'rt-1', summary: 'rt session 1', keyFindings: ['f1'] });
  src.addSession({ sessionId: 'rt-2', summary: 'rt session 2' });
  src.updatePatterns({ commonGaps: ['g1', 'g2'] });
  const patch1 = src.exportAsExtractionPatch();

  const dst = new AgentMemoryManager('rt-agent', 'project');
  dst.load(os.tmpdir());
  dst.importFromExtractionPatch(patch1);
  const patch2 = dst.exportAsExtractionPatch();

  // 비교: sessions count + pattern keys + session_ids set
  const ids1 = new Set(patch1.patches.filter(p => p.type === 'session').map(p => p.session_id));
  const ids2 = new Set(patch2.patches.filter(p => p.type === 'session').map(p => p.session_id));
  assertEq(ids1.size, ids2.size, `session count round-trip: ${ids1.size} vs ${ids2.size}`);
  for (const id of ids1) assertTrue(ids2.has(id), `session ${id} lost in round-trip`);

  const keys1 = new Set(patch1.patches.filter(p => p.type === 'pattern').map(p => p.key));
  const keys2 = new Set(patch2.patches.filter(p => p.type === 'pattern').map(p => p.key));
  for (const k of keys1) assertTrue(keys2.has(k), `pattern key ${k} lost`);
});

// ── MX-09: existing memory file 무손상 (AC-CE6) ──

test('MX-09 importFromExtractionPatch는 save() 호출 안 함 (caller 책임)', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-s5-w3-'));
  try {
    const mgr = new AgentMemoryManager('safety-test', 'project');
    mgr.load(tmp);
    const sizeBefore = fs.existsSync(mgr.getMemoryPath(tmp))
      ? fs.statSync(mgr.getMemoryPath(tmp)).size : 0;

    mgr.importFromExtractionPatch({
      schema: 'bkit-agent-memory/1.0',
      agent: 'safety-test',
      patches: [{ type: 'session', session_id: 'x', summary: 'in-memory only' }]
    });

    // 파일 시스템 사이드 이펙트 0
    const sizeAfter = fs.existsSync(mgr.getMemoryPath(tmp))
      ? fs.statSync(mgr.getMemoryPath(tmp)).size : 0;
    assertEq(sizeAfter, sizeBefore, 'import must not auto-save (caller controls persistence)');

    // 그러나 in-memory state는 변경됨
    assertTrue(mgr.memory.sessions.some(s => s.sessionId === 'x'));
  } finally {
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
