/**
 * policy-modes-array — Dynamic Regression
 *
 * Sprint: S2 v2.0.7-security-baseline-recovery
 * Cluster: B (SEC-08 modes array regex)
 *
 * 핵심: 생성된 policy TOML이 `modes = ["..."]` 배열 형태를 정확히 사용하는지 검증.
 *       원 TC80-73 regex는 char class bug (`["plan"]` escape 누락).
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

console.log('Suite: policy-modes-array (TOML modes 배열 형태 동적 검증)');
console.log('---');

const PLUGIN_ROOT = path.resolve(__dirname, '../../..');
const POLICY_DIR = path.join(PLUGIN_ROOT, '.gemini', 'policies');

// 정확한 modes 배열 regex (escape 적용)
const MODES_ARRAY_RE = /modes\s*=\s*\[\s*"[a-zA-Z_]+"(?:\s*,\s*"[a-zA-Z_]+")*\s*\]/g;
// 잘못된 modes 단일 string 형태 (이런게 있으면 fail)
const MODES_STRING_RE = /modes\s*=\s*"[^"\[\]]+"\s*$/m;

const LEVEL_FILES = ['bkit-starter-policy.toml', 'bkit-dynamic-policy.toml', 'bkit-enterprise-policy.toml'];

for (const file of LEVEL_FILES) {
  const fullPath = path.join(POLICY_DIR, file);
  if (!fs.existsSync(fullPath)) {
    console.log(`  [SKIP] ${file} not present (optional level)`);
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');

  test(`MA-${file} modes는 모두 배열 형태 ["..."]`, () => {
    // modes = 가 존재하는 모든 라인이 배열 형태인지
    const allModesLines = content.match(/^modes\s*=.*$/gm) || [];
    for (const line of allModesLines) {
      assertTrue(/modes\s*=\s*\[/.test(line),
        `${file}: modes line must use array form, got: ${line.trim()}`);
    }
  });

  test(`MA-${file} modes 단일 string 형태 0건`, () => {
    const m = content.match(MODES_STRING_RE);
    assertTrue(!m, `${file}: modes line as single string is forbidden, got: ${m ? m[0] : ''}`);
  });

  // Starter level만 plan-mode rule 3개 이상 보장
  if (file === 'bkit-starter-policy.toml') {
    test(`MA-${file} plan mode rule >= 3 (write_file / replace / run_shell_command)`, () => {
      const matches = content.match(/modes\s*=\s*\[\s*"plan"\s*\]/g);
      assertTrue(matches && matches.length >= 3,
        `${file}: expected >= 3 plan mode rules, got ${matches ? matches.length : 0}`);
    });
  }
}

console.log('---');
console.log(`Result: ${__pass}/${__pass + __fail} passed`);
console.log(`Pass: ${__pass} | Fail: ${__fail} | Skip: 0`);
if (__failures.length > 0) {
  console.log('\nFailures:');
  __failures.forEach(f => console.log(`  ${f.name}: ${f.error}`));
}
process.exit(__fail > 0 ? 1 : 0);
