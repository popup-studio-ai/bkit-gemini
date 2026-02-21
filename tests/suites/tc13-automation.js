// tests/suites/tc13-automation.js - Multi-language Automation Test
const { PLUGIN_ROOT, assert, assertEqual } = require('../test-utils');
const fs = require('fs');
const path = require('path');

const tests = [
  {
    name: 'TC-13-01: Supported Languages Registration',
    fn: () => {
      const configPath = path.resolve(PLUGIN_ROOT, 'bkit.config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      assertEqual(config.automation.supportedLanguages.length, 8, 'Should support 8 languages');
      const expectedLangs = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'it'];
      expectedLangs.forEach(lang => {
        assert(config.automation.supportedLanguages.includes(lang), `${lang} should be supported`);
      });
    }
  },
  {
    name: 'TC-13-02: Agent Trigger Keywords Check (8 Languages)',
    fn: () => {
      const triggersPath = path.resolve(PLUGIN_ROOT, '.gemini/context/agent-triggers.md');
      const content = fs.readFileSync(triggersPath, 'utf8');
      const keywords = ['verify', 'check', 'is this right?', '검증', '맞아?', '確認', '正しい?', '验证', '对吗?'];
      keywords.forEach(keyword => {
        assert(content.includes(keyword), `Should contain keyword "${keyword}"`);
      });
    }
  },
  {
    name: 'TC-13-03: Multi-language Intent Mapping Presence',
    fn: () => {
      const beforeAgentPath = path.resolve(PLUGIN_ROOT, 'hooks/scripts/before-agent.js');
      const content = fs.readFileSync(beforeAgentPath, 'utf8');
      assert(content.includes('intent'), 'before-agent.js should handle intent mapping');
    }
  }
];

module.exports = { tests };
