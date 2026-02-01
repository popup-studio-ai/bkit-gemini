const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { setupEnvironment, TEST_DIR } = require('./setup');

async function verifyPhilosophy() {
  console.log('Starting Philosophy Alignment Tests...');
  setupEnvironment();
  process.chdir(TEST_DIR);

  try {
    // --- PHIL-01: Automation First ---
    console.log('Testing PHIL-01: Automation First...');
    const trigger = require('../lib/intent/trigger');
    const dependency = require('../lib/task/dependency');
    const status = require('../lib/pdca/status');

    // PHIL-01-02: Feature Request Without Plan
    const intent = trigger.detectNewFeatureIntent('Add user auth');
    assert.strictEqual(intent.isNewFeature, true, 'PHIL-01-02: Detect feature intent');
    // Logic check: if no plan exists, should suggest plan. 
    // This logic is usually in the agent prompt or before-agent hook.
    // We verify the detection works.

    // PHIL-01-03: Implement without Design
    // Simulate Plan exists but Design missing
    status.updatePdcaStatus('user-auth', { phase: 'plan' }, TEST_DIR);
    const currentStatus = status.loadPdcaStatus(TEST_DIR);
    const resultDo = dependency.canStartPhase('do', 'user-auth', currentStatus);
    assert.strictEqual(resultDo.canStart, false, 'PHIL-01-03: Should block DO phase if DESIGN missing');

    // PHIL-01-05: Task Classification
    const classification = require('../lib/task/classification');
    const quickFixContent = Array(15).fill('line').join('\n');
    const quickFix = classification.classifyTaskByLines(quickFixContent);
    assert.strictEqual(quickFix, 'quickFix', 'PHIL-01-05: Classify quick fix');
    const majorContent = Array(1200).fill('line').join('\n');
    const major = classification.classifyTaskByLines(majorContent);
    assert.strictEqual(major, 'majorFeature', 'PHIL-01-05: Classify major feature');
    console.log('PASS: PHIL-01');


    // --- PHIL-02: No Guessing ---
    console.log('Testing PHIL-02: No Guessing...');
    const ambiguity = require('../lib/intent/ambiguity');

    // PHIL-02-01: Ambiguous Request
    const scoreAmbiguous = ambiguity.calculateAmbiguityScore('Improve system');
    assert.ok(scoreAmbiguous >= 50, 'PHIL-02-01: High ambiguity score');

    // PHIL-02-02: Magic Word
    const scoreMagic = ambiguity.calculateAmbiguityScore('!hotfix Fix bug');
    assert.strictEqual(scoreMagic, 0, 'PHIL-02-02: Magic word bypass');

    // PHIL-02-03: Specific Path
    const scorePath = ambiguity.calculateAmbiguityScore('Fix src/index.js:10');
    assert.ok(scorePath < 50, 'PHIL-02-03: Low ambiguity with path');
    console.log('PASS: PHIL-02');


    // --- PHIL-03: Docs = Code ---
    console.log('Testing PHIL-03: Docs = Code...');
    // Verify templates exist
    const templateDir = path.resolve(__dirname, '../templates');
    assert.ok(fs.existsSync(path.join(templateDir, 'plan.template.md')), 'PHIL-03: Plan template exists');
    assert.ok(fs.existsSync(path.join(templateDir, 'design.template.md')), 'PHIL-03: Design template exists');
    assert.ok(fs.existsSync(path.join(templateDir, 'analysis.template.md')), 'PHIL-03: Analysis template exists');
    console.log('PASS: PHIL-03');

  } catch (err) {
    console.error('FAILED:', err);
    process.exit(1);
  }
}

verifyPhilosophy();
