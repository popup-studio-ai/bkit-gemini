const { execSync } = require('child_process');
const path = require('path');

const HOOK_PATH = path.resolve(__dirname, '..', 'hooks/scripts/before-agent.js');

function testBeforeAgent(prompt) {
  const input = JSON.stringify({ prompt });
  try {
    const output = execSync(`node ${HOOK_PATH}`, { input, encoding: 'utf-8' });
    console.log(`Prompt: "${prompt}"`);
    console.log(`Output: ${output}`);
    console.log('---');
  } catch (e) {
    console.error(`Error for "${prompt}":`, e.message);
  }
}

console.log('Testing BeforeAgent Hook Intent Detection:');

testBeforeAgent('verify the implementation');
testBeforeAgent('검증해줘');
testBeforeAgent('build a static website');
testBeforeAgent('create a login feature');
testBeforeAgent('fix it');
