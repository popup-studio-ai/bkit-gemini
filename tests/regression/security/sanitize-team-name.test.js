/**
 * sanitize-team-name — Dynamic Regression
 *
 * Sprint: S2 v2.0.7-security-baseline-recovery
 * Cluster: D (SEC-03 sanitizeTeamName)
 *
 * 핵심: 우회 시도(command injection, path traversal, 특수문자)를 실제 호출하여
 *      거부되는지 + 파일시스템 부작용 없는지 동적 검증.
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

console.log('Suite: sanitize-team-name (BkitServer sanitize 우회 시도 동적 거부)');
console.log('---');

const PLUGIN_ROOT = path.resolve(__dirname, '../../..');
const { BkitServer } = require(path.join(PLUGIN_ROOT, 'mcp', 'bkit-server.js'));

// tmpdir 격리 — handleTeamCreate은 process.cwd() 기반으로 .gemini/teams 생성
const tmpProject = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-s2-sanitize-'));
const origCwd = process.cwd();
process.chdir(tmpProject);

const server = new BkitServer();

function flatten(resp) {
  if (resp && resp.content && Array.isArray(resp.content)) {
    return resp.content.map(c => c.text || '').join('\n');
  }
  return JSON.stringify(resp || '');
}

function teamFiles() {
  const dir = path.join(tmpProject, '.gemini', 'teams');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir);
}

try {

  // ── SN-01~05: 우회 시도는 모두 거부 ──

  const malicious = [
    { name: 'team;rm -rf /', desc: 'command injection (semicolon + rm)' },
    { name: '../../etc/passwd', desc: 'path traversal' },
    { name: 'team@host', desc: '@ special char' },
    { name: 'team name with spaces', desc: 'whitespace' },
    { name: 'team`echo pwned`', desc: 'backtick command substitution' }
  ];

  for (const m of malicious) {
    test(`SN-${m.desc}`, () => {
      const before = teamFiles().length;
      const resp = server.handleTeamCreate({ team_name: m.name, strategy: 'dynamic' });
      const flat = flatten(resp);
      // success: false 또는 error 메시지
      assertTrue(/success.*false|error|Invalid/i.test(flat),
        `should reject malicious name "${m.name}", got: ${flat.slice(0, 200)}`);
      // 파일시스템 부작용 없음 (.gemini/teams 디렉터리 안에 sanitized 이름의 파일 0개 추가)
      const after = teamFiles();
      assertEq(after.length, before, `no team file should be created for malicious name`);
    });
  }

  // ── SN-06: 안전한 이름은 통과 ──

  test('SN-06 안전한 이름 "safe-team_01" 은 sanitize 통과', () => {
    const resp = server.handleTeamCreate({ team_name: 'safe-team_01', strategy: 'dynamic' });
    const flat = flatten(resp);
    // success 또는 created 메시지
    assertTrue(/success|created|name/i.test(flat),
      `safe name should be accepted, got: ${flat.slice(0, 200)}`);
    // 파일 생성 확인
    const files = teamFiles();
    assertTrue(files.some(f => f.startsWith('safe-team_01')),
      `team file should be created, got: ${files.join(', ')}`);
  });

  // ── SN-07: 절대경로 시도 거부 (POSIX) ──

  test('SN-07 절대경로 "/etc/shadow" 거부', () => {
    const before = teamFiles().length;
    const resp = server.handleTeamCreate({ team_name: '/etc/shadow', strategy: 'dynamic' });
    const flat = flatten(resp);
    assertTrue(/Invalid|error|success.*false/i.test(flat),
      `absolute path should be rejected`);
    assertEq(teamFiles().length, before, 'no team file should be created');
  });

  // ── SN-08: 빈 문자열 / null / 매우 긴 문자열 ──

  test('SN-08 빈 문자열 거부', () => {
    const resp = server.handleTeamCreate({ team_name: '', strategy: 'dynamic' });
    const flat = flatten(resp);
    assertTrue(/Invalid|error|success.*false/i.test(flat),
      `empty name should be rejected`);
  });

} finally {
  process.chdir(origCwd);
  try { fs.rmSync(tmpProject, { recursive: true, force: true }); } catch (e) { /* ignore */ }
}

console.log('---');
console.log(`Result: ${__pass}/${__pass + __fail} passed`);
console.log(`Pass: ${__pass} | Fail: ${__fail} | Skip: 0`);
if (__failures.length > 0) {
  console.log('\nFailures:');
  __failures.forEach(f => console.log(`  ${f.name}: ${f.error}`));
}
process.exit(__fail > 0 ? 1 : 0);
