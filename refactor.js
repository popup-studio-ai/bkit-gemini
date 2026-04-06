const fs = require('fs');
const path = require('path');

const suitesDir = path.join(__dirname, 'tests/suites');
const files = fs.readdirSync(suitesDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(suitesDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // 1. createTestProjectV2 -> createTestProject
  if (content.includes('createTestProjectV2')) {
    // Replace in destructuring first
    // Pattern: { ..., createTestProjectV2, ... }
    // or { ..., createTestProjectV2 }
    content = content.replace(/createTestProjectV2\s*,\s*createTestProject/g, 'createTestProject');
    content = content.replace(/createTestProject\s*,\s*createTestProjectV2/g, 'createTestProject');
    content = content.replace(/createTestProjectV2/g, 'createTestProject');
    changed = true;
  }

  // 2. JSON.parse(JSON.stringify(PDCA_STATUS_FIXTURE)) -> getPdcaStatus()
  const pdcaPattern = /JSON\.parse\(JSON\.stringify\(PDCA_STATUS_FIXTURE\)\)/g;
  if (pdcaPattern.test(content)) {
    content = content.replace(pdcaPattern, 'getPdcaStatus()');
    changed = true;
    
    // Check for common override pattern:
    // const status = getPdcaStatus();
    // status.phase = 'plan';
    // -> getPdcaStatus({ phase: 'plan' })
    // This is hard to do perfectly with regex but let's try some common cases in the suites
  }

  // 3. remove resetCache() inside withVersion
  // Pattern: withVersion(..., () => { vd.resetCache(); ... }) or resetCache();
  // We need to look for resetCache() calls inside the callback of withVersion
  // This is tricky with regex. Let's look at the grep results first to see the patterns.
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Refactored ${file}`);
  }
});
