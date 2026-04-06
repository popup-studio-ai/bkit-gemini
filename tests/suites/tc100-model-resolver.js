const { PLUGIN_ROOT, assert, assertEqual } = require('../test-utils');
const path = require('path');

const {
  resolveModel,
  getFallbackModel,
  isKnownModel,
  getValidModelIds,
  getAliases,
  MODEL_ALIASES,
  KNOWN_MODELS,
} = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'model-resolver'));

const tests = [
  // ═══ TC-100: Model Resolver (Issue #20 fix) ═══

  {
    name: 'MR-01: model-resolver.js exports resolveModel function',
    fn: () => {
      assertEqual(typeof resolveModel, 'function', 'resolveModel should be a function');
    }
  },
  {
    name: 'MR-02: gemini-3.1-pro aliases to gemini-3-pro (Issue #20 fix)',
    fn: () => {
      const result = resolveModel('gemini-3.1-pro');
      assertEqual(result.resolved, 'gemini-3-pro', 'Should resolve to GA model');
      assertEqual(result.wasAliased, true, 'Should be marked as aliased');
    }
  },
  {
    name: 'MR-03: gemini-3.1-pro-preview aliases to gemini-3-pro (Issue #20 fix)',
    fn: () => {
      const result = resolveModel('gemini-3.1-pro-preview');
      assertEqual(result.resolved, 'gemini-3-pro');
      assertEqual(result.wasAliased, true);
    }
  },
  {
    name: 'MR-04: known models pass through without aliasing',
    fn: () => {
      for (const model of KNOWN_MODELS) {
        const result = resolveModel(model);
        assertEqual(result.resolved, model, `${model} should pass through`);
        assertEqual(result.wasAliased, false, `${model} should not be aliased`);
      }
    }
  },
  {
    name: 'MR-05: unknown model passes through with warning',
    fn: () => {
      const result = resolveModel('gemini-99-ultra');
      assertEqual(result.resolved, 'gemini-99-ultra', 'Unknown model should pass through');
      assert(result.warning !== null, 'Should produce a warning for unknown model');
    }
  },
  {
    name: 'MR-06: settings override takes precedence over alias',
    fn: () => {
      const result = resolveModel('gemini-3.1-pro', {
        settingsOverrides: { 'gemini-3.1-pro': 'gemini-3-pro' }
      });
      assertEqual(result.resolved, 'gemini-3-pro', 'Settings override should win');
      assertEqual(result.wasAliased, true);
    }
  },
  {
    name: 'MR-07: agentName appears in warning for unknown models',
    fn: () => {
      const result = resolveModel('nonexistent-model', { agentName: 'gap-detector' });
      assert(result.warning.includes('gap-detector'), 'Warning should include agent name');
    }
  },
  {
    name: 'MR-08: getFallbackModel returns correct fallback chain',
    fn: () => {
      assertEqual(getFallbackModel('gemini-3-pro'), 'gemini-3-flash');
      assertEqual(getFallbackModel('gemini-3-flash'), 'gemini-3-flash-lite');
      assertEqual(getFallbackModel('gemini-3-flash-lite'), null);
    }
  },
  {
    name: 'MR-09: isKnownModel validates correctly',
    fn: () => {
      assertEqual(isKnownModel('gemini-3-pro'), true);
      assertEqual(isKnownModel('gemini-3-flash'), true);
      assertEqual(isKnownModel('gemini-3.1-pro'), false, 'Alias should not be a known model');
      assertEqual(isKnownModel('gemini-3.1-pro-preview'), false, 'Preview alias should not be known');
    }
  },
  {
    name: 'MR-10: getValidModelIds returns all known models',
    fn: () => {
      const ids = getValidModelIds();
      assertEqual(ids.length, KNOWN_MODELS.length);
      for (const model of KNOWN_MODELS) {
        assert(ids.includes(model), `Should include ${model}`);
      }
    }
  },
  {
    name: 'MR-11: original field preserves input model name',
    fn: () => {
      const result = resolveModel('gemini-3.1-pro');
      assertEqual(result.original, 'gemini-3.1-pro', 'Should preserve original input');
    }
  },
  {
    name: 'MR-12: all agent frontmatter models are valid or aliased',
    fn: () => {
      const fs = require('fs');
      const agentsDir = path.join(PLUGIN_ROOT, 'agents');
      const agents = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
      const aliases = getAliases();
      const validIds = getValidModelIds();

      for (const agent of agents) {
        const content = fs.readFileSync(path.join(agentsDir, agent), 'utf-8');
        const modelMatch = content.match(/^model:\s*(.+)$/m);
        if (!modelMatch) continue;
        const model = modelMatch[1].trim();
        const isValid = validIds.includes(model) || aliases[model];
        assert(isValid, `Agent ${agent} model "${model}" should be valid or have an alias`);
      }
    }
  },
];

module.exports = { name: 'tc100-model-resolver', tests };
