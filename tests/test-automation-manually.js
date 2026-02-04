const { execSync } = require('child_process');
const path = require('path');

const HOOK_PATH = path.resolve(__dirname, '..', 'hooks/scripts/before-agent.js');

function testBeforeAgent(prompt, lang) {
  const input = JSON.stringify({ prompt });
  try {
    const output = execSync(`node ${HOOK_PATH}`, { input, encoding: 'utf-8' });
    if (!output.trim()) {
        console.log(`[${lang}] Prompt: "${prompt}" -> FAIL (Empty output)`);
        return;
    }
    const res = JSON.parse(output);
    const hasTrigger = res.context && (res.context.includes('Detected Agent Trigger') || res.context.includes('Detected Skill Trigger'));
    console.log(`[${lang}] Prompt: "${prompt}" -> ${hasTrigger ? 'PASS' : 'FAIL'}`);
    if (hasTrigger) console.log(`      Output: ${res.context.split('\n')[0]}`);
  } catch (e) {
    console.error(`[${lang}] Error:`, e.message);
  }
}

console.log('Testing Multilingual Intent Detection (AUTO-01):');

testBeforeAgent('verify the implementation', 'EN');
testBeforeAgent('검증해줘', 'KO');
testBeforeAgent('設計を検証して', 'JA');
testBeforeAgent('验证实现', 'ZH');
testBeforeAgent('mejorar el código', 'ES');
testBeforeAgent('analyser la qualité', 'FR');
testBeforeAgent('Qualität analysieren', 'DE');
testBeforeAgent('ottimizzare il codice', 'IT');