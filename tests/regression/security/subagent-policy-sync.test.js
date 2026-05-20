/**
 * subagent-policy-sync — Dynamic Regression
 *
 * Sprint: S2 v2.0.7-security-baseline-recovery
 * Cluster: A (SEC-02 SUBAGENT_POLICY_GROUPS drift)
 *
 * 핵심: mcp/bkit-server.js AGENTS와 lib/gemini/policy.js SUBAGENT_POLICY_GROUPS의
 *      양방향 정합성을 동적으로 강제. 미래 누가 한쪽만 수정해도 즉시 fail.
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
function assertEq(a, b, m) { if (a !== b) throw new Error(`${m}: got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`); }

console.log('Suite: subagent-policy-sync (AGENTS ↔ SUBAGENT_POLICY_GROUPS 양방향 정합성)');
console.log('---');

let AGENTS, SAFETY_TIERS, SUBAGENT_POLICY_GROUPS;
try {
  // mcp/bkit-server.js는 class 정의 후 process.stdin 리스너 등록만 함 (run() 미호출은 외부).
  // 다만 require 시 부수효과(stdin listener)는 SetMaxListenersExceededWarning만 발생하므로 안전.
  // 실제로는 AGENTS / SAFETY_TIERS만 가져오기 위해 별도 wrapper로 추출.
  const serverModule = require('../../../mcp/bkit-server.js');
  AGENTS = serverModule.AGENTS;
  SAFETY_TIERS = serverModule.SAFETY_TIERS;
  // bkit-server.js가 AGENTS를 export 하지 않으면 fallback으로 직접 파일 파싱
  if (!AGENTS) {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(path.resolve(__dirname, '../../../mcp/bkit-server.js'), 'utf-8');
    AGENTS = {};
    SAFETY_TIERS = { READONLY: 0, DOCWRITE: 1, FULL: 2 };
    // 파일에서 직접 agent 이름 + tier 추출
    const re = /'([a-z][a-z0-9-]+)'\s*:\s*\{[\s\S]*?safetyTier:\s*SAFETY_TIERS\.(READONLY|DOCWRITE|FULL)/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      AGENTS[m[1]] = { safetyTier: SAFETY_TIERS[m[2]] };
    }
  }
  const pm = require('../../../lib/gemini/policy.js');
  SUBAGENT_POLICY_GROUPS = pm.SUBAGENT_POLICY_GROUPS;
} catch (e) {
  console.error('[SETUP FAIL]:', e.message);
}

if (!AGENTS || !SUBAGENT_POLICY_GROUPS) {
  test('SP-* ALL', () => { throw new Error('AGENTS or SUBAGENT_POLICY_GROUPS missing'); });
} else {

  const readonlyTier = SAFETY_TIERS.READONLY;
  const docwriteTier = SAFETY_TIERS.DOCWRITE;
  const fullTier = SAFETY_TIERS.FULL;

  test('SP-01 모든 21 AGENTS가 정확히 하나의 그룹에 속함', () => {
    const allGroupAgents = [
      ...SUBAGENT_POLICY_GROUPS.readonly.agents,
      ...SUBAGENT_POLICY_GROUPS.docwrite.agents,
      ...SUBAGENT_POLICY_GROUPS.full.agents
    ];
    const uniqueSet = new Set(allGroupAgents);
    assertEq(uniqueSet.size, allGroupAgents.length, 'agents must not appear in multiple groups');
    for (const name of Object.keys(AGENTS)) {
      assertTrue(uniqueSet.has(name), `AGENTS[${name}] is missing from SUBAGENT_POLICY_GROUPS`);
    }
  });

  test('SP-02 readonly 그룹의 모든 agent가 AGENTS에서 READONLY tier', () => {
    for (const name of SUBAGENT_POLICY_GROUPS.readonly.agents) {
      assertTrue(AGENTS[name], `${name} must exist in AGENTS`);
      assertEq(AGENTS[name].safetyTier, readonlyTier,
        `${name} is in readonly policy group but AGENTS[${name}].safetyTier is not READONLY`);
    }
  });

  test('SP-03 docwrite 그룹의 모든 agent가 AGENTS에서 DOCWRITE tier', () => {
    for (const name of SUBAGENT_POLICY_GROUPS.docwrite.agents) {
      assertTrue(AGENTS[name], `${name} must exist in AGENTS`);
      assertEq(AGENTS[name].safetyTier, docwriteTier,
        `${name} is in docwrite policy group but AGENTS[${name}].safetyTier is not DOCWRITE`);
    }
  });

  test('SP-04 full 그룹의 모든 agent가 AGENTS에서 FULL tier', () => {
    for (const name of SUBAGENT_POLICY_GROUPS.full.agents) {
      assertTrue(AGENTS[name], `${name} must exist in AGENTS`);
      assertEq(AGENTS[name].safetyTier, fullTier,
        `${name} is in full policy group but AGENTS[${name}].safetyTier is not FULL`);
    }
  });

  test('SP-05 AGENTS의 모든 READONLY agent가 readonly 그룹에 등장', () => {
    for (const [name, info] of Object.entries(AGENTS)) {
      if (info.safetyTier !== readonlyTier) continue;
      assertTrue(SUBAGENT_POLICY_GROUPS.readonly.agents.includes(name),
        `READONLY agent ${name} missing from SUBAGENT_POLICY_GROUPS.readonly`);
    }
  });

  test('SP-06 AGENTS의 모든 DOCWRITE agent가 docwrite 그룹에 등장', () => {
    for (const [name, info] of Object.entries(AGENTS)) {
      if (info.safetyTier !== docwriteTier) continue;
      assertTrue(SUBAGENT_POLICY_GROUPS.docwrite.agents.includes(name),
        `DOCWRITE agent ${name} missing from SUBAGENT_POLICY_GROUPS.docwrite`);
    }
  });

  test('SP-07 AGENTS의 모든 FULL agent가 full 그룹에 등장', () => {
    for (const [name, info] of Object.entries(AGENTS)) {
      if (info.safetyTier !== fullTier) continue;
      assertTrue(SUBAGENT_POLICY_GROUPS.full.agents.includes(name),
        `FULL agent ${name} missing from SUBAGENT_POLICY_GROUPS.full`);
    }
  });

  test('SP-08 SUBAGENT_POLICY_GROUPS는 frozen', () => {
    let thrown = false;
    try { SUBAGENT_POLICY_GROUPS.newProp = 'test'; } catch (e) { thrown = true; }
    // strict mode에서 frozen object 변경 시 throw
    assertTrue(thrown || !('newProp' in SUBAGENT_POLICY_GROUPS),
      'SUBAGENT_POLICY_GROUPS must be frozen');
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
