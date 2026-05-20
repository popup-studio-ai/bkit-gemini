/**
 * tool-result-clearing — Dynamic Regression (S5 W2 Strategy 2)
 *
 * Sprint: S5 v2.0.7-context-engineering-integration
 * Spec: AC-CE2 (Read result > threshold → summary + reference 보존)
 */
'use strict';

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

console.log('Suite: tool-result-clearing (S5 W2 Strategy 2)');
console.log('---');

const TRS = require('../../../lib/core/tool-result-summarizer');

function makeLargeResult(lines, lineLen) {
  return Array.from({ length: lines }, (_, i) => `line ${i}: ${'x'.repeat(lineLen)}`).join('\n');
}

// ── TR-01~03: shouldSummarize threshold + tool gate + disable toggle ──

test('TR-01 size >= threshold + Read tool → shouldSummarize', () => {
  delete process.env.BKIT_TOOL_RESULT_CLEARING;
  const result = makeLargeResult(500, 30); // ~16 KB
  const r = TRS.shouldSummarize({ toolName: 'Read', result });
  assertTrue(r.shouldSummarize, JSON.stringify(r));
  assertTrue(r.size >= 10 * 1024);
});

test('TR-02 size < threshold → skip', () => {
  const r = TRS.shouldSummarize({ toolName: 'Read', result: 'short content' });
  assertFalse(r.shouldSummarize);
  assertContains(r.reason, 'threshold');
});

test('TR-03 unsupported tool → skip', () => {
  const r = TRS.shouldSummarize({ toolName: 'TodoWrite', result: makeLargeResult(500, 30) });
  assertFalse(r.shouldSummarize);
  assertContains(r.reason, 'not in summarizable set');
});

test('TR-04 BKIT_TOOL_RESULT_CLEARING=false → disabled', () => {
  process.env.BKIT_TOOL_RESULT_CLEARING = 'false';
  try {
    const r = TRS.shouldSummarize({ toolName: 'Read', result: makeLargeResult(1000, 50) });
    assertFalse(r.shouldSummarize);
    assertContains(r.reason, 'disabled');
  } finally {
    delete process.env.BKIT_TOOL_RESULT_CLEARING;
  }
});

// ── TR-05~07: summarize 출력 형태 + ref 보존 ──

test('TR-05 summarize produces HEAD + TAIL + size marker', () => {
  delete process.env.BKIT_TOOL_RESULT_CLEARING;
  const result = makeLargeResult(500, 30);
  const r = TRS.summarize({ toolName: 'Read', result });
  assertTrue(r.summarized);
  assertContains(r.replacement, '[bkit-tool-summary tool=Read');
  assertContains(r.replacement, 'truncated=true');
  assertContains(r.replacement, '--- HEAD');
  assertContains(r.replacement, '--- TAIL');
  assertContains(r.replacement, '[/bkit-tool-summary]');
});

test('TR-06 summarize preserves file:line references', () => {
  const result =
    'line 1\n' +
    'See lib/core/compactor.js:42\n' +
    'and tests/foo.test.js:128\n' +
    Array.from({ length: 400 }, (_, i) => `line ${i + 4}: ` + 'x'.repeat(40)).join('\n');
  const r = TRS.summarize({ toolName: 'Read', result });
  assertTrue(r.summarized);
  assertTrue(r.refs.length >= 2, `expected refs, got: ${r.refs}`);
  assertContains(r.replacement, 'lib/core/compactor.js:42');
  assertContains(r.replacement, '[refs:');
});

test('TR-07 summarize compressionRatio < 1 (실제로 압축됨)', () => {
  const result = makeLargeResult(500, 100); // ~50 KB
  const r = TRS.applyClearing({ toolName: 'Read', result });
  assertTrue(r.summarized);
  assertTrue(r.meta.compressionRatio < 0.5,
    `expected ratio < 0.5, got ${r.meta.compressionRatio}`);
});

// ── TR-08: extractRefs 단위 + 다양한 확장자 ──

test('TR-08 extractRefs supports js/ts/md/json/sh/toml extensions', () => {
  const text =
    'lib/foo.js:10\n' +
    'src/bar.ts:42\n' +
    'docs/baz.md:5\n' +
    'data/quux.json:1\n' +
    'scripts/x.sh:88\n' +
    'config/y.toml:7';
  const refs = TRS.extractRefs(text);
  assertEq(refs.length, 6, JSON.stringify(refs));
});

// ── TR-09: applyClearing pass-through for small results ──

test('TR-09 applyClearing pass-through for small results (output === input)', () => {
  delete process.env.BKIT_TOOL_RESULT_CLEARING;
  const small = 'this is short content';
  const r = TRS.applyClearing({ toolName: 'Read', result: small });
  assertFalse(r.summarized);
  assertEq(r.output, small);
});

console.log('---');
console.log(`Result: ${__pass}/${__pass + __fail} passed`);
console.log(`Pass: ${__pass} | Fail: ${__fail} | Skip: 0`);
if (__failures.length > 0) {
  console.log('\nFailures:');
  __failures.forEach(f => console.log(`  ${f.name}: ${f.error}`));
}
process.exit(__fail > 0 ? 1 : 0);
