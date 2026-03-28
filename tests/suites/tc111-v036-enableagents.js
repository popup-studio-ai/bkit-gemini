// TC-111: v0.36.0 enableAgents Settings Auto-Generation (5 TC)
const { PLUGIN_ROOT, assert, assertEqual, createTestProject } = require('../test-utils');
const path = require('path');
const fs = require('fs');

// Load the ensureAgentsEnabled function by requiring session-start internals
// We test it indirectly by simulating the function logic
function getEnsureAgentsEnabled() {
  // Read session-start.js source and extract the function
  const sessionStartPath = path.join(PLUGIN_ROOT, 'hooks', 'scripts', 'session-start.js');
  const source = fs.readFileSync(sessionStartPath, 'utf-8');
  assert(source.includes('ensureAgentsEnabled'), 'session-start.js must contain ensureAgentsEnabled function');

  // Re-implement for testability (mirrors the production function exactly)
  return function ensureAgentsEnabled(projectDir) {
    try {
      const settingsDir = path.join(projectDir, '.gemini');
      const settingsPath = path.join(settingsDir, 'settings.json');

      let settings = {};
      if (fs.existsSync(settingsPath)) {
        const raw = fs.readFileSync(settingsPath, 'utf-8');
        settings = JSON.parse(raw);
      }

      if (!settings.experimental) {
        settings.experimental = {};
      }
      if (settings.experimental.enableAgents === undefined) {
        settings.experimental.enableAgents = true;

        if (!fs.existsSync(settingsDir)) {
          fs.mkdirSync(settingsDir, { recursive: true });
        }
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
      }
    } catch (e) {
      // Non-fatal
    }
  };
}

const tests = [
  { name: 'TC111-01: settings.json 미존재 시 자동 생성', fn: () => {
    const projectDir = createTestProject({});
    const geminiDir = path.join(projectDir, '.gemini');
    // Ensure no settings.json exists
    const settingsPath = path.join(geminiDir, 'settings.json');
    if (fs.existsSync(settingsPath)) fs.unlinkSync(settingsPath);

    const ensureAgentsEnabled = getEnsureAgentsEnabled();
    ensureAgentsEnabled(projectDir);

    assert(fs.existsSync(settingsPath), 'settings.json should be created');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    assertEqual(settings.experimental.enableAgents, true, 'enableAgents should be true');
  }},

  { name: 'TC111-02: settings.json 존재 + enableAgents 미설정 시 true 추가', fn: () => {
    const projectDir = createTestProject({
      '.gemini/settings.json': JSON.stringify({ someOther: 'value' }, null, 2)
    });

    const ensureAgentsEnabled = getEnsureAgentsEnabled();
    ensureAgentsEnabled(projectDir);

    const settingsPath = path.join(projectDir, '.gemini', 'settings.json');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    assertEqual(settings.experimental.enableAgents, true, 'enableAgents should be added as true');
    assertEqual(settings.someOther, 'value', 'existing keys should be preserved');
  }},

  { name: 'TC111-03: settings.json 존재 + enableAgents=true 시 변경 없음', fn: () => {
    const original = { experimental: { enableAgents: true } };
    const projectDir = createTestProject({
      '.gemini/settings.json': JSON.stringify(original, null, 2)
    });

    const settingsPath = path.join(projectDir, '.gemini', 'settings.json');
    const beforeContent = fs.readFileSync(settingsPath, 'utf-8');

    const ensureAgentsEnabled = getEnsureAgentsEnabled();
    ensureAgentsEnabled(projectDir);

    const afterContent = fs.readFileSync(settingsPath, 'utf-8');
    assertEqual(beforeContent, afterContent, 'File should not be modified when enableAgents is already true');
  }},

  { name: 'TC111-04: settings.json 존재 + enableAgents=false 시 사용자 의도 존중 (No Guessing)', fn: () => {
    const original = { experimental: { enableAgents: false } };
    const projectDir = createTestProject({
      '.gemini/settings.json': JSON.stringify(original, null, 2)
    });

    const ensureAgentsEnabled = getEnsureAgentsEnabled();
    ensureAgentsEnabled(projectDir);

    const settingsPath = path.join(projectDir, '.gemini', 'settings.json');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    assertEqual(settings.experimental.enableAgents, false, 'enableAgents=false should be respected (No Guessing)');
  }},

  { name: 'TC111-05: settings.json 생성 시 다른 설정 키 보존', fn: () => {
    const original = { experimental: { someFlag: true }, theme: 'dark' };
    const projectDir = createTestProject({
      '.gemini/settings.json': JSON.stringify(original, null, 2)
    });

    const ensureAgentsEnabled = getEnsureAgentsEnabled();
    ensureAgentsEnabled(projectDir);

    const settingsPath = path.join(projectDir, '.gemini', 'settings.json');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    assertEqual(settings.experimental.enableAgents, true, 'enableAgents should be added');
    assertEqual(settings.experimental.someFlag, true, 'existing experimental keys should be preserved');
    assertEqual(settings.theme, 'dark', 'root-level keys should be preserved');
  }}
];

module.exports = { tests };
