const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEST_DIR = path.resolve(__dirname, 'bkit-test-project');

function setupEnvironment() {
  console.log('Setting up test environment in:', TEST_DIR);

  // 1. Clean and create directory
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_DIR, { recursive: true });

  // 2. Initialize git
  try {
    execSync('git init', { cwd: TEST_DIR, stdio: 'ignore' });
    // Configure git user for commits to work
    execSync('git config user.email "test@example.com"', { cwd: TEST_DIR, stdio: 'ignore' });
    execSync('git config user.name "Test User"', { cwd: TEST_DIR, stdio: 'ignore' });
  } catch (e) {
    console.error('Git init failed:', e.message);
  }

  // 3. Create default configs
  const bkitConfig = {
    "pdca": {
      "matchThreshold": 90,
      "maxIterations": 5
    },
    "permissions": {
      "default": "allow"
    }
  };
  fs.writeFileSync(path.join(TEST_DIR, 'bkit.config.json'), JSON.stringify(bkitConfig, null, 2));

  const pdcaStatus = {
    "version": "2.0",
    "lastUpdated": new Date().toISOString(),
    "activeFeatures": [],
    "primaryFeature": null,
    "features": {},
    "pipeline": {
      "currentPhase": 1,
      "level": "Starter",
      "phaseHistory": []
    },
    "session": {
      "startedAt": new Date().toISOString(),
      "onboardingCompleted": false,
      "lastActivity": new Date().toISOString()
    },
    "history": []
  };
  fs.writeFileSync(path.join(TEST_DIR, '.pdca-status.json'), JSON.stringify(pdcaStatus, null, 2));
  
  // Create docs directory structure
  fs.mkdirSync(path.join(TEST_DIR, 'docs/01-plan/features'), { recursive: true });
  fs.mkdirSync(path.join(TEST_DIR, 'docs/02-design/features'), { recursive: true });
  fs.mkdirSync(path.join(TEST_DIR, 'docs/03-analysis'), { recursive: true });
  fs.mkdirSync(path.join(TEST_DIR, 'docs/04-report/features'), { recursive: true });
  fs.mkdirSync(path.join(TEST_DIR, 'docs/.pdca-snapshots'), { recursive: true });
  fs.mkdirSync(path.join(TEST_DIR, 'src'), { recursive: true });

  // Hook expects .pdca-status.json in docs/
  fs.writeFileSync(path.join(TEST_DIR, 'docs/.pdca-status.json'), JSON.stringify(pdcaStatus, null, 2));

  console.log('Test environment setup complete.');
}

if (require.main === module) {
  setupEnvironment();
}

module.exports = { setupEnvironment, TEST_DIR };
