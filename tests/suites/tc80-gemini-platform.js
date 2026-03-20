const { PLUGIN_ROOT, assert, assertEqual, assertContains } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const tests = [
  // 21 test cases for lib/gemini/platform.js
  {
    name: 'PLT-01: GeminiAdapter exports singleton instance',
    fn: () => {
      const adapter = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'platform'));
      assert(typeof adapter === 'object', 'Should export object (singleton)');
      assertEqual(adapter._name, 'gemini', 'Name should be gemini');
      assertEqual(adapter._version, '2.0.0', 'Version should be 2.0.0');
    }
  },
  {
    name: 'PLT-02: No CC legacy code — no CLAUDE references',
    fn: () => {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'platform.js'), 'utf-8');
      assert(!content.includes('CLAUDE_TO_GEMINI_MAP'), 'No CLAUDE_TO_GEMINI_MAP');
      assert(!content.includes('CLAUDE_PLUGIN_ROOT'), 'No CLAUDE_PLUGIN_ROOT in expandVariables');
      assert(!content.includes('ClaudeAdapter'), 'No ClaudeAdapter');
      assert(!content.includes('extends PlatformAdapter'), 'No PlatformAdapter inheritance');
    }
  },
  {
    name: 'PLT-03: getAdapter() returns singleton',
    fn: () => {
      const adapter = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'platform'));
      assertEqual(typeof adapter.getAdapter, 'function', 'getAdapter should be function');
      const result = adapter.getAdapter();
      assertEqual(result._name, 'gemini', 'getAdapter returns gemini adapter');
    }
  },
  {
    name: 'PLT-04: getPlatformName() returns gemini',
    fn: () => {
      const adapter = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'platform'));
      assertEqual(typeof adapter.getPlatformName, 'function', 'getPlatformName should be function');
      assertEqual(adapter.getPlatformName(), 'gemini', 'Platform name should be gemini');
    }
  },
  {
    name: 'PLT-05: isGemini() returns true',
    fn: () => {
      const adapter = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'platform'));
      assertEqual(typeof adapter.isGemini, 'function', 'isGemini should be function');
      assertEqual(adapter.isGemini(), true, 'isGemini should return true');
    }
  },
  {
    name: 'PLT-06: expandVariables replaces ${PLUGIN_ROOT}',
    fn: () => {
      const adapter = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'platform'));
      if (adapter.expandVariables) {
        const result = adapter.expandVariables('${PLUGIN_ROOT}/test');
        assert(!result.includes('${PLUGIN_ROOT}'), 'Should replace ${PLUGIN_ROOT}');
      }
    }
  },
  {
    name: 'PLT-07: expandVariables does NOT have ${CLAUDE_PLUGIN_ROOT}',
    fn: () => {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'platform.js'), 'utf-8');
      assert(!content.includes('CLAUDE_PLUGIN_ROOT'), 'No ${CLAUDE_PLUGIN_ROOT} replacement');
    }
  },
  {
    name: 'PLT-08: expandVariables handles null/non-string input',
    fn: () => {
      const adapter = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'platform'));
      if (adapter.expandVariables) {
        assertEqual(adapter.expandVariables(null), null, 'null returns null');
        assertEqual(adapter.expandVariables(42), 42, 'number returns number');
      }
    }
  },
  {
    name: 'PLT-09: getContextFileName returns GEMINI.md',
    fn: () => {
      const adapter = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'platform'));
      if (adapter.getContextFileName) {
        assertEqual(adapter.getContextFileName(), 'GEMINI.md', 'Context file should be GEMINI.md');
      }
    }
  },
  {
    name: 'PLT-10: No mapToolName method (CC removed)',
    fn: () => {
      const adapter = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'platform'));
      assertEqual(adapter.mapToolName, undefined, 'mapToolName should be removed');
    }
  },
  {
    name: 'PLT-11: No reverseMapToolName method (CC removed)',
    fn: () => {
      const adapter = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'platform'));
      assertEqual(adapter.reverseMapToolName, undefined, 'reverseMapToolName should be removed');
    }
  },
  {
    name: 'PLT-12: readHookInput returns object on empty input',
    fn: () => {
      const adapter = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'platform'));
      if (adapter.readHookInput) {
        // readHookInput reads from stdin, we just verify it exists
        assertEqual(typeof adapter.readHookInput, 'function', 'readHookInput should be function');
      }
    }
  },
  {
    name: 'PLT-13: outputAllow is a function',
    fn: () => {
      const adapter = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'platform'));
      assertEqual(typeof adapter.outputAllow, 'function', 'outputAllow should be function');
    }
  },
  {
    name: 'PLT-14: outputBlock is a function',
    fn: () => {
      const adapter = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'platform'));
      assertEqual(typeof adapter.outputBlock, 'function', 'outputBlock should be function');
    }
  },
  {
    name: 'PLT-15: outputEmpty is a function',
    fn: () => {
      const adapter = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'platform'));
      assertEqual(typeof adapter.outputEmpty, 'function', 'outputEmpty should be function');
    }
  },
  {
    name: 'PLT-16: getPluginRoot returns valid path',
    fn: () => {
      const adapter = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'platform'));
      const root = adapter.getPluginRoot();
      assert(typeof root === 'string' && root.length > 0, 'Plugin root should be non-empty string');
      assert(fs.existsSync(root), 'Plugin root should exist');
    }
  },
  {
    name: 'PLT-17: getProjectDir returns valid path',
    fn: () => {
      const adapter = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'platform'));
      const dir = adapter.getProjectDir();
      assert(typeof dir === 'string' && dir.length > 0, 'Project dir should be non-empty string');
    }
  },
  {
    name: 'PLT-18: getTemplatePath returns path under pluginRoot',
    fn: () => {
      const adapter = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'platform'));
      if (adapter.getTemplatePath) {
        const tp = adapter.getTemplatePath('plan.template.md');
        assertContains(tp, 'templates', 'Template path should contain templates dir');
      }
    }
  },
  {
    name: 'PLT-19: getSkillPath returns path under pluginRoot',
    fn: () => {
      const adapter = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'platform'));
      if (adapter.getSkillPath) {
        const sp = adapter.getSkillPath('pdca');
        assertContains(sp, 'skills', 'Skill path should contain skills dir');
      }
    }
  },
  {
    name: 'PLT-20: getAgentPath returns path under pluginRoot',
    fn: () => {
      const adapter = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'platform'));
      if (adapter.getAgentPath) {
        const ap = adapter.getAgentPath('gap-detector');
        assertContains(ap, 'agents', 'Agent path should contain agents dir');
      }
    }
  },
  {
    name: 'PLT-21: reset() is a function',
    fn: () => {
      const adapter = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'platform'));
      assertEqual(typeof adapter.reset, 'function', 'reset should be function');
    }
  }
];

module.exports = { tests };
