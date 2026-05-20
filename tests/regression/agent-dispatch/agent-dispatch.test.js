/**
 * agent-dispatch — Unit Tests (AD-* matchers + 8 lang × 21 agent)
 *
 * Sprint: S3 v2.0.7-agent-dispatch-fix (Wave 1 Day 1)
 * Spec: AC-A1~A5 (matcher), AC-F1~F4 (false-positive defense), AC-R1~R5 (regression)
 */
'use strict';

let __pass = 0;
let __fail = 0;
const __failures = [];

function test(name, fn) {
  try {
    fn();
    __pass++;
    console.log(`  [PASS] ${name}`);
  } catch (e) {
    __fail++;
    __failures.push({ name, error: e.message });
    console.error(`  [FAIL] ${name}\n         ${e.message}`);
  }
}

function assertTrue(c, m) { if (!c) throw new Error(m || 'assertTrue'); }
function assertFalse(c, m) { if (c) throw new Error(m || 'assertFalse'); }
function assertEq(a, b, m) { if (a !== b) throw new Error(`${m}: got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`); }

let AD;
try {
  AD = require('../../../lib/gemini/agent-dispatch');
} catch (e) {
  console.error('[SETUP FAIL]:', e.message);
  AD = null;
}

console.log('Suite: agent-dispatch (matcher + 8 lang + 21 agent + meta rejection)');
console.log('---');

if (!AD) {
  test('AD-* ALL', () => { throw new Error('agent-dispatch.js missing'); });
} else {

  // ── AD-01~08: 8 language matchers (one sample each) ──

  test('AD-01 en: "Use the code-analyzer agent to evaluate..."', () => {
    const r = AD.detectDispatch('Use the code-analyzer agent to evaluate this code: eval(input)');
    assertTrue(r.matched, JSON.stringify(r));
    assertEq(r.agent, 'code-analyzer');
    assertEq(r.lang, 'en');
    assertTrue(r.task.length > 0);
  });

  test('AD-02 ko: "code-analyzer 에이전트로 ... 평가해줘"', () => {
    const r = AD.detectDispatch('code-analyzer 에이전트로 이 코드 평가해줘');
    assertTrue(r.matched, JSON.stringify(r));
    assertEq(r.agent, 'code-analyzer');
    assertEq(r.lang, 'ko');
  });

  test('AD-03 ja: "code-analyzer エージェントで ..."', () => {
    const r = AD.detectDispatch('code-analyzer エージェントで このコードを評価して');
    assertTrue(r.matched, JSON.stringify(r));
    assertEq(r.agent, 'code-analyzer');
    assertEq(r.lang, 'ja');
  });

  test('AD-04 zh: "使用 code-analyzer 代理来..."', () => {
    const r = AD.detectDispatch('使用 code-analyzer 代理来评估这段代码');
    assertTrue(r.matched, JSON.stringify(r));
    assertEq(r.agent, 'code-analyzer');
    assertEq(r.lang, 'zh');
  });

  test('AD-05 es: "Usar el agente code-analyzer para..."', () => {
    const r = AD.detectDispatch('Usar el agente code-analyzer para evaluar este código');
    assertTrue(r.matched, JSON.stringify(r));
    assertEq(r.agent, 'code-analyzer');
    assertEq(r.lang, 'es');
  });

  test('AD-06 fr: "Utiliser l\'agent code-analyzer pour..."', () => {
    const r = AD.detectDispatch("Utiliser l'agent code-analyzer pour évaluer ce code");
    assertTrue(r.matched, JSON.stringify(r));
    assertEq(r.agent, 'code-analyzer');
    assertEq(r.lang, 'fr');
  });

  test('AD-07 de: "Verwende den code-analyzer Agenten für..."', () => {
    const r = AD.detectDispatch('Verwende den code-analyzer Agenten für die Bewertung des Codes');
    assertTrue(r.matched, JSON.stringify(r));
    assertEq(r.agent, 'code-analyzer');
    assertEq(r.lang, 'de');
  });

  test('AD-08 it: "Usa l\'agente code-analyzer per..."', () => {
    const r = AD.detectDispatch("Usa l'agente code-analyzer per valutare questo codice");
    assertTrue(r.matched, JSON.stringify(r));
    assertEq(r.agent, 'code-analyzer');
    assertEq(r.lang, 'it');
  });

  // ── AD-09~14: 21-agent registry validation ──

  test('AD-09 21 agent registry loaded', () => {
    const agents = AD.listKnownAgents();
    assertEq(agents.length, 21, `expected 21 agents, got ${agents.length}`);
    assertTrue(agents.includes('code-analyzer'));
    assertTrue(agents.includes('security-architect'));
    assertTrue(agents.includes('gap-detector'));
  });

  test('AD-10 Unknown agent rejected', () => {
    const r = AD.detectDispatch('Use the foo-bar agent to do something');
    assertFalse(r.matched);
    assertTrue(/unknown agent/.test(r.reason), r.reason);
  });

  test('AD-11 Empty task rejected', () => {
    const r = AD.detectDispatch('Use the code-analyzer agent to');
    assertFalse(r.matched, JSON.stringify(r));
  });

  test('AD-12 Sample on 5 agents (sanity)', () => {
    ['security-architect', 'gap-detector', 'qa-strategist', 'cto-lead', 'pm-lead'].forEach(name => {
      const r = AD.detectDispatch(`Use the ${name} agent to review architecture`);
      assertTrue(r.matched, `${name}: ${JSON.stringify(r)}`);
      assertEq(r.agent, name);
    });
  });

  // ── AD-13~18: Meta pattern rejection (D9, AC-F1~F4) ──

  test('AD-13 Code fence rejected', () => {
    const r = AD.detectDispatch('```js\nUse the code-analyzer agent to review\n```');
    assertFalse(r.matched);
    assertTrue(/meta pattern/.test(r.reason));
  });

  test('AD-14 Question rejected', () => {
    const r = AD.detectDispatch('What is the code-analyzer agent?');
    assertFalse(r.matched);
  });

  test('AD-15 Markdown link rejected', () => {
    const r = AD.detectDispatch('See [docs](https://example.com/agent/code-analyzer) for details');
    assertFalse(r.matched);
  });

  test('AD-16 Quoted agent name rejected', () => {
    const r = AD.detectDispatch('The "code-analyzer agent" is interesting');
    assertFalse(r.matched);
  });

  test('AD-17 "Tell me about" rejected', () => {
    const r = AD.detectDispatch('Tell me about the security-architect agent');
    assertFalse(r.matched);
  });

  test('AD-18 "Explain" rejected', () => {
    const r = AD.detectDispatch('Explain how the gap-detector agent works');
    assertFalse(r.matched);
  });

  // ── AD-19~22: Dispatch call builder + wrap ──

  test('AD-19 buildDispatchCall returns MCP shape', () => {
    const r = AD.detectDispatch('Use the code-analyzer agent to review eval(input)');
    const call = AD.buildDispatchCall(r);
    assertEq(call.tool, 'spawn_agent');
    assertEq(call.arguments.agent_name, 'code-analyzer');
    assertTrue(call.arguments.task.length > 0);
    assertEq(call.arguments.context.source, 'bkit-agent-dispatch');
    assertEq(call.arguments.context.lang, 'en');
  });

  test('AD-20 buildDispatchCall(null) → null', () => {
    assertEq(AD.buildDispatchCall(null), null);
  });

  test('AD-21 wrapAgentOutput produces boundary', () => {
    const out = AD.wrapAgentOutput('code-analyzer', 'security finding A03 OWASP');
    assertTrue(out.startsWith('[Agent: code-analyzer]'));
    assertTrue(out.endsWith('[End Agent Output]'));
  });

  test('AD-22 isMetaPattern empty / null', () => {
    assertTrue(AD.isMetaPattern(''));
    assertTrue(AD.isMetaPattern(null));
  });
}

console.log('---');
console.log(`Result: ${__pass}/${__pass + __fail} passed`);
console.log(`Pass: ${__pass} | Fail: ${__fail} | Skip: 0`);
if (__failures.length > 0) {
  console.log('\nFailures:');
  __failures.forEach(f => console.log(`  ${f.name}: ${f.error}`));
}
process.exit(__fail > 0 ? 1 : 0);
