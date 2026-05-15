/**
 * subagent-isolation — Dynamic Regression (S5 W4 Strategy 4)
 *
 * Sprint: S5 v2.0.7-context-engineering-integration
 * Spec: AC-CE4 (forkContext wrapper + main context leak 0건)
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

console.log('Suite: subagent-isolation (S5 W4 Strategy 4 — Sub-agent context fork)');
console.log('---');

const AD = require('../../../lib/gemini/agent-dispatch');

// ── SI-01~03: wrapAsIsolated 기본 동작 ──

test('SI-01 wrapAsIsolated(null) → null', () => {
  assertEq(AD.wrapAsIsolated(null), null);
});

test('SI-02 wrapAsIsolated(undefined) → null', () => {
  assertEq(AD.wrapAsIsolated(undefined), null);
});

test('SI-03 wrapAsIsolated은 isolated: true + isolationPolicy 부여', () => {
  const dispatchCall = AD.buildDispatchCall({
    matched: true, agent: 'code-analyzer', task: 'review eval(input)', lang: 'en'
  });
  assertTrue(dispatchCall);

  const isolated = AD.wrapAsIsolated(dispatchCall);
  assertTrue(isolated);
  assertEq(isolated.tool, 'spawn_agent');
  assertEq(isolated.arguments.agent_name, 'code-analyzer');
  assertEq(isolated.arguments.context.isolated, true);
  assertEq(isolated.arguments.context.isolationPolicy, 'context-fork');
  assertTrue(typeof isolated.arguments.context.outputContract === 'string');
});

// ── SI-04: 기존 context 메타는 보존 (lang, source, version) ──

test('SI-04 wrapAsIsolated은 기존 context 메타 (lang/source/version) 보존', () => {
  const detection = AD.detectDispatch('Use the code-analyzer agent to evaluate this');
  const call = AD.buildDispatchCall(detection);
  const isolated = AD.wrapAsIsolated(call);
  // 원본 context 메타 보존
  assertEq(isolated.arguments.context.source, 'bkit-agent-dispatch');
  assertEq(isolated.arguments.context.lang, 'en');
  assertTrue(typeof isolated.arguments.context.version === 'string');
});

// ── SI-05: detectAndBuildIsolated E2E ──

test('SI-05 detectAndBuildIsolated E2E EN prompt → isolated MCP call', () => {
  const result = AD.detectAndBuildIsolated('Use the gap-detector agent to compare design vs implementation');
  assertTrue(result);
  assertEq(result.arguments.agent_name, 'gap-detector');
  assertEq(result.arguments.context.isolated, true);
});

test('SI-06 detectAndBuildIsolated KO prompt → isolated MCP call', () => {
  const result = AD.detectAndBuildIsolated('code-analyzer 에이전트로 이 코드 평가해줘');
  assertTrue(result);
  assertEq(result.arguments.agent_name, 'code-analyzer');
  assertEq(result.arguments.context.isolated, true);
  assertEq(result.arguments.context.lang, 'ko');
});

test('SI-07 detectAndBuildIsolated 비-dispatch prompt → null', () => {
  assertEq(AD.detectAndBuildIsolated('Can you explain how PDCA works?'), null);
  assertEq(AD.detectAndBuildIsolated('Use the foo-bar agent for x'), null); // unknown agent
  assertEq(AD.detectAndBuildIsolated('What is the code-analyzer agent?'), null); // meta
});

// ── SI-08: outputContract 내용 (decisions+findings+refs only) ──

test('SI-08 outputContract는 raw tool output 금지 명시', () => {
  const isolated = AD.detectAndBuildIsolated('Use the code-analyzer agent to evaluate');
  assertTrue(isolated.arguments.context.outputContract.includes('decisions'));
  assertTrue(isolated.arguments.context.outputContract.includes('no raw tool output'));
});

console.log('---');
console.log(`Result: ${__pass}/${__pass + __fail} passed`);
console.log(`Pass: ${__pass} | Fail: ${__fail} | Skip: 0`);
if (__failures.length > 0) {
  console.log('\nFailures:');
  __failures.forEach(f => console.log(`  ${f.name}: ${f.error}`));
}
process.exit(__fail > 0 ? 1 : 0);
