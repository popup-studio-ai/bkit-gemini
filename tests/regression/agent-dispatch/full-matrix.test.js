/**
 * Full Coverage Matrix — 21 agents × 8 languages = 168 dispatch cases
 *
 * Sprint: S3 v2.0.7-agent-dispatch-fix (Wave 1 Day 3)
 * Spec: AC-A1~A5 (matcher), AC-R1~R5 (multi-agent regression),
 *       AC-A6 (BeforeModel integration) at scale
 *
 * Each agent is dispatched in every supported language with a realistic task.
 * Expected: detectDispatch().matched === true, agent name preserved,
 *           lang correctly identified, task non-empty.
 */
'use strict';

const path = require('path');

let __pass = 0;
let __fail = 0;
const __failures = [];

function test(name, fn) {
  try {
    fn();
    __pass++;
    // Verbose matrix → succinct PASS marker only
    process.stdout.write('.');
  } catch (e) {
    __fail++;
    __failures.push({ name, error: e.message });
    process.stdout.write('F');
  }
}

function flushSummary() {
  process.stdout.write('\n');
}

function assertTrue(c, m) { if (!c) throw new Error(m || 'assertTrue'); }
function assertEq(a, b, m) { if (a !== b) throw new Error(`${m}: got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`); }

let AD;
try {
  AD = require('../../../lib/gemini/agent-dispatch');
} catch (e) {
  console.error('[SETUP FAIL]:', e.message);
  AD = null;
}

console.log('Suite: agent-dispatch FULL MATRIX (21 agents × 8 languages = 168 cases)');
console.log('---');

if (!AD) {
  test('FM-00 setup', () => { throw new Error('agent-dispatch.js missing'); });
} else {
  const agents = AD.listKnownAgents(); // sorted 21 agent names

  if (agents.length !== 21) {
    test(`FM-00 registry size`, () => {
      assertEq(agents.length, 21, `expected 21 agents in registry, got ${agents.length}`);
    });
  }

  // Per-language phrase template producing a syntactically valid dispatch prompt.
  // Task text is intentionally non-empty (>3 chars after task position) for each.
  const templates = [
    { lang: 'en', tmpl: name => `Use the ${name} agent to evaluate the current implementation` },
    { lang: 'ko', tmpl: name => `${name} 에이전트로 현재 구현을 평가해줘` },
    { lang: 'ja', tmpl: name => `${name} エージェントで 現在の実装を評価して` },
    { lang: 'zh', tmpl: name => `使用 ${name} 代理来评估当前实现` },
    { lang: 'es', tmpl: name => `Usar el agente ${name} para evaluar la implementación actual` },
    { lang: 'fr', tmpl: name => `Utiliser l'agent ${name} pour évaluer l'implémentation actuelle` },
    { lang: 'de', tmpl: name => `Verwende den ${name} Agenten für die Bewertung der Implementierung` },
    { lang: 'it', tmpl: name => `Usa l'agente ${name} per valutare l'implementazione attuale` }
  ];

  // 21 × 8 = 168 cases
  for (const agent of agents) {
    for (const { lang, tmpl } of templates) {
      const prompt = tmpl(agent);
      test(`FM ${lang} → ${agent}`, () => {
        const r = AD.detectDispatch(prompt);
        if (!r.matched) {
          throw new Error(`unmatched for "${prompt}" → reason: ${r.reason || 'n/a'}`);
        }
        assertEq(r.agent, agent, `agent mismatch on lang=${lang}`);
        assertEq(r.lang, lang, `lang mismatch for "${prompt}"`);
        assertTrue(typeof r.task === 'string' && r.task.length > 0, 'task must be non-empty');
      });
    }
  }
}

flushSummary();
console.log('---');
console.log(`Result: ${__pass}/${__pass + __fail} passed`);
console.log(`Pass: ${__pass} | Fail: ${__fail} | Skip: 0`);
if (__failures.length > 0) {
  console.log('\nFailures:');
  __failures.forEach(f => console.log(`  ${f.name}: ${f.error}`));
}
process.exit(__fail > 0 ? 1 : 0);
