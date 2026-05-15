/**
 * mcp-response-leak — Dynamic Regression
 *
 * Sprint: S2 v2.0.7-security-baseline-recovery
 * Cluster: C (SEC-10 path/content expose)
 *
 * 핵심: BkitServer 메서드를 실제 호출하여 응답에 file body / absolute path / extensionPath
 *      등 민감 정보가 누설되지 않는지 동적으로 검증. 정적 grep만 갱신하는 임시방편 X.
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
function assertFalse(c, m) { if (c) throw new Error(m || 'assertFalse'); }

console.log('Suite: mcp-response-leak (handleGetAgentInfo/handleListAgents 동적 누설 검증)');
console.log('---');

const PLUGIN_ROOT = path.resolve(__dirname, '../../..');
const { BkitServer, AGENTS } = require(path.join(PLUGIN_ROOT, 'mcp', 'bkit-server.js'));

// BkitServer instance — run() 호출 안 함 (stdin/stdout hang 방지)
const server = new BkitServer();

/**
 * _textResponse는 MCP content[].text 형식 반환. 실 누설 검증을 위해 평탄화.
 */
function flatten(resp) {
  if (!resp) return '';
  if (resp.content && Array.isArray(resp.content)) {
    return resp.content.map(c => c.text || JSON.stringify(c)).join('\n');
  }
  return JSON.stringify(resp);
}

// ── ML-01: handleGetAgentInfo가 agent file body를 누설하지 않음 ──

test('ML-01 handleGetAgentInfo({code-analyzer}) 응답에 agent file body 부재', () => {
  const resp = server.handleGetAgentInfo({ agent_name: 'code-analyzer' });
  const flat = flatten(resp);
  // agents/code-analyzer.md 파일의 첫 줄을 응답이 포함하면 누설
  const agentMd = path.join(PLUGIN_ROOT, 'agents', 'code-analyzer.md');
  const fileBodyFirstLine = fs.readFileSync(agentMd, 'utf-8').split('\n')[0];
  // first line은 '---' YAML frontmatter일 가능성 → 두번째 의미 line 사용
  const meaningfulLine = fs.readFileSync(agentMd, 'utf-8')
    .split('\n').find(l => l.length > 20 && !l.startsWith('---')) || '';
  assertFalse(flat.includes(meaningfulLine),
    `agent file body line should not appear in response, leaked: "${meaningfulLine.slice(0, 80)}"`);
  // 'agentContent' literal 키도 없어야
  assertFalse(/\bagentContent\b/.test(flat), 'agentContent key must not appear');
});

test('ML-02 handleGetAgentInfo 응답에 절대경로 (PLUGIN_ROOT 또는 OS-absolute) 부재', () => {
  const resp = server.handleGetAgentInfo({ agent_name: 'code-analyzer' });
  const flat = flatten(resp);
  // OS-absolute path prefix 검사
  assertFalse(flat.includes(PLUGIN_ROOT),
    `PLUGIN_ROOT (${PLUGIN_ROOT}) leaked in response`);
  // /Users 또는 C:\ Windows prefix
  assertFalse(/\/Users\/[a-zA-Z0-9-]+\//.test(flat) || /[A-Z]:\\\\/.test(flat),
    'OS-absolute path leaked');
});

test('ML-03 handleGetAgentInfo 응답에는 상대 file 이름(agentInfo.file)만 포함', () => {
  const resp = server.handleGetAgentInfo({ agent_name: 'code-analyzer' });
  const flat = flatten(resp);
  // 'code-analyzer.md' (상대 파일명)는 포함되어야 함
  assertTrue(flat.includes('code-analyzer.md'),
    'relative file name should be present in response');
});

test('ML-04 handleGetAgentInfo 에러 path (unknown agent) 누설 없음', () => {
  const resp = server.handleGetAgentInfo({ agent_name: 'nonexistent-agent-xyz' });
  const flat = flatten(resp);
  assertFalse(flat.includes(PLUGIN_ROOT), 'PLUGIN_ROOT leaked in error response');
  assertFalse(/\bextensionPath\b/.test(flat), 'extensionPath leaked in error response');
  assertFalse(/\bagentContent\b/.test(flat), 'agentContent leaked in error response');
});

// ── ML-05~07: handleListAgents ──

test('ML-05 handleListAgents 응답에 file 경로 또는 absolute path 부재', () => {
  const resp = server.handleListAgents();
  const flat = flatten(resp);
  assertFalse(flat.includes(PLUGIN_ROOT), 'PLUGIN_ROOT leaked in list response');
  assertFalse(/\bextensionPath\b/.test(flat), 'extensionPath key leaked');
  assertFalse(/\bagentPath\b/.test(flat), 'agentPath key leaked');
  assertFalse(/\/Users\/[a-zA-Z0-9-]+\//.test(flat), 'OS-absolute path leaked');
});

test('ML-06 handleListAgents 응답에 21 agent 이름 모두 포함', () => {
  const resp = server.handleListAgents();
  const flat = flatten(resp);
  for (const name of Object.keys(AGENTS)) {
    assertTrue(flat.includes(name), `agent ${name} should be listed`);
  }
});

test('ML-07 handleListAgents 응답에 description / recommendedModel만 노출 (safetyTier 노출은 OK)', () => {
  const resp = server.handleListAgents();
  const flat = flatten(resp);
  // file body, content, agentPath 키 없음
  assertFalse(/\bfile\s*:/.test(flat), 'file key should not be in list response');
  assertFalse(/\bcontent\s*:/.test(flat), 'content key should not be in list response');
});

console.log('---');
console.log(`Result: ${__pass}/${__pass + __fail} passed`);
console.log(`Pass: ${__pass} | Fail: ${__fail} | Skip: 0`);
if (__failures.length > 0) {
  console.log('\nFailures:');
  __failures.forEach(f => console.log(`  ${f.name}: ${f.error}`));
}
process.exit(__fail > 0 ? 1 : 0);
