/**
 * onboarding-slim — Dynamic Regression (S4)
 *
 * Sprint: S4 v2.0.7-onboarding-slim (P5)
 * Spec: AC-OB1~OB8
 *
 * 핵심: README size 상한 / QUICKSTART size 상한 / reference 파일 완전성 /
 *      link 무결성 / content preservation을 동적으로 강제.
 *      미래 누가 README를 다시 비대화하면 즉시 fail.
 */
'use strict';

const fs = require('fs');
const path = require('path');

let __pass = 0;
let __fail = 0;
const __failures = [];

function test(name, fn) {
  try { fn(); __pass++; console.log(`  [PASS] ${name}`); }
  catch (e) { __fail++; __failures.push({ name, error: e.message }); console.error(`  [FAIL] ${name}\n         ${e.message}`); }
}

function assertTrue(c, m) { if (!c) throw new Error(m || 'assertTrue'); }
function assertEq(a, b, m) { if (a !== b) throw new Error(`${m}: got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`); }
function assertLessThan(a, max, m) { if (!(a < max)) throw new Error(`${m}: ${a} >= ${max}`); }
function assertContains(s, sub, m) { if (!s || s.indexOf(sub) === -1) throw new Error(`${m || 'assertContains'}: missing ${JSON.stringify(sub)}`); }

console.log('Suite: onboarding-slim (S4 README/QUICKSTART size + link 무결성 + content preservation)');
console.log('---');

const PLUGIN_ROOT = path.resolve(__dirname, '../../..');
const README = path.join(PLUGIN_ROOT, 'README.md');
const QUICKSTART = path.join(PLUGIN_ROOT, 'QUICKSTART.md');
const GEMINI_MD = path.join(PLUGIN_ROOT, 'GEMINI.md');
const REFERENCE_DIR = path.join(PLUGIN_ROOT, 'docs', 'reference');

const REFERENCE_FILES = ['architecture.md', 'features-history.md', 'commands.md', 'troubleshooting.md'];

// ── OB-01~03: size 상한 (AC-OB1, AC-OB2) ──

test('OB-01 QUICKSTART.md ≤ 1024 bytes (AC-OB1)', () => {
  const size = fs.statSync(QUICKSTART).size;
  assertLessThan(size + 1, 1025, `QUICKSTART must be ≤ 1024B, got ${size}`);
});

test('OB-02 README.md ≤ 5120 bytes (AC-OB2)', () => {
  const size = fs.statSync(README).size;
  assertLessThan(size + 1, 5121, `README must be ≤ 5120B, got ${size}`);
});

test('OB-03 GEMINI.md ≤ 4096 bytes (LLM 슬림 원칙 유지)', () => {
  const size = fs.statSync(GEMINI_MD).size;
  assertLessThan(size + 1, 4097, `GEMINI.md must remain slim ≤ 4096B, got ${size}`);
});

// ── OB-04: reference 4 파일 모두 존재 (AC-OB3) ──

test('OB-04 docs/reference/ 4 파일 모두 존재 (AC-OB3)', () => {
  for (const f of REFERENCE_FILES) {
    const fullPath = path.join(REFERENCE_DIR, f);
    assertTrue(fs.existsSync(fullPath), `missing: ${fullPath}`);
    const size = fs.statSync(fullPath).size;
    assertTrue(size > 0, `${f} is empty`);
  }
});

// ── OB-05: reference 파일 너무 비대화 방지 (각 ≤ 25KB) ──

test('OB-05 reference 파일 각각 ≤ 25KB (re-bloat 방지)', () => {
  const MAX = 25 * 1024;
  for (const f of REFERENCE_FILES) {
    const size = fs.statSync(path.join(REFERENCE_DIR, f)).size;
    assertLessThan(size, MAX, `${f}: ${size}B > ${MAX}B (re-bloat risk)`);
  }
});

// ── OB-06~07: link 무결성 (AC-OB5) ──

test('OB-06 README의 docs/reference/ 링크 모두 valid (AC-OB5)', () => {
  const readme = fs.readFileSync(README, 'utf-8');
  // [text](relative-path) 패턴 추출
  const linkRe = /\]\(([^)]+\.md)\)/g;
  let m;
  const checked = new Set();
  while ((m = linkRe.exec(readme)) !== null) {
    let target = m[1].split('#')[0]; // strip anchor
    if (!target || target.startsWith('http')) continue;
    if (checked.has(target)) continue;
    checked.add(target);
    const fullPath = path.resolve(PLUGIN_ROOT, target);
    assertTrue(fs.existsSync(fullPath), `README link broken: ${target}`);
  }
  assertTrue(checked.size >= 4, `expected ≥ 4 valid links, got ${checked.size}: ${[...checked]}`);
});

test('OB-07 QUICKSTART의 모든 relative link valid', () => {
  const qs = fs.readFileSync(QUICKSTART, 'utf-8');
  const linkRe = /\]\(([^)]+\.md|[^)]+\.md\/?[^)]*)\)/g;
  let m;
  while ((m = linkRe.exec(qs)) !== null) {
    let target = m[1].split('#')[0];
    if (!target || target.startsWith('http') || target.endsWith('/')) continue;
    const fullPath = path.resolve(PLUGIN_ROOT, target);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`QUICKSTART link broken: ${target}`);
    }
  }
});

// ── OB-08: GEMINI.md가 docs/reference/ 포인터 포함 ──

test('OB-08 GEMINI.md는 docs/reference/ 포인터 포함 (Deep Reference 섹션)', () => {
  const gemini = fs.readFileSync(GEMINI_MD, 'utf-8');
  assertContains(gemini, 'docs/reference/architecture.md', 'GEMINI.md missing architecture pointer');
  assertContains(gemini, 'docs/reference/commands.md', 'GEMINI.md missing commands pointer');
  assertContains(gemini, 'docs/reference/features-history.md', 'GEMINI.md missing features-history pointer');
  assertContains(gemini, 'docs/reference/troubleshooting.md', 'GEMINI.md missing troubleshooting pointer');
});

// ── OB-09: content preservation (AC-OB4) ──

test('OB-09 reference 파일 총 lines >= 원본 README split lines (content preservation)', () => {
  // 원본 README는 git history에서만 확인 가능. 현재는 reference 파일 합산 lines가
  // 의미있는 분량인지만 검증 (≥ 500 lines, README split 시 ~700 line 분배 예상).
  let totalLines = 0;
  for (const f of REFERENCE_FILES) {
    const lines = fs.readFileSync(path.join(REFERENCE_DIR, f), 'utf-8').split('\n').length;
    totalLines += lines;
  }
  assertTrue(totalLines >= 500, `reference total lines ${totalLines} < 500 (content may be lost)`);
});

// ── OB-10: README "Legacy anchors" hint 존재 (외부 링크 사용자 안내) ──

test('OB-10 README는 Legacy anchors 안내 포함', () => {
  const readme = fs.readFileSync(README, 'utf-8');
  assertContains(readme, 'Legacy anchors', 'README must hint deep-link consumers');
  assertContains(readme, 'docs/reference', 'README must point to reference dir');
});

// ── OB-11: QUICKSTART의 핵심 onboarding flow ──

test('OB-11 QUICKSTART는 필수 onboarding step 포함 (install / bkit Hi / PDCA)', () => {
  const qs = fs.readFileSync(QUICKSTART, 'utf-8');
  assertContains(qs, 'gemini extensions install', 'install command missing');
  assertContains(qs, 'bkit Hi', 'bkit Hi smoke test missing');
  assertContains(qs, '/pdca plan', 'first PDCA step missing');
  assertContains(qs, 'v2.0.7 activated', 'expected output marker missing');
});

console.log('---');
console.log(`Result: ${__pass}/${__pass + __fail} passed`);
console.log(`Pass: ${__pass} | Fail: ${__fail} | Skip: 0`);
if (__failures.length > 0) {
  console.log('\nFailures:');
  __failures.forEach(f => console.log(`  ${f.name}: ${f.error}`));
}
process.exit(__fail > 0 ? 1 : 0);
