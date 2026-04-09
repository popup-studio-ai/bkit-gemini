const fs = require('fs');
const path = require('path');
const { assert, assertEqual, assertContains, PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, cleanupTestProject, getPdcaStatus, withVersion } = require('../test-utils');

module.exports = {
  tests: [
    // 4.1 GAP-01: lib/pdca/
    {
      name: 'UT-60: level.js detectLevel() default to Starter',
      setup: () => createTestProject({}),
      fn: () => {
        const { detectLevel } = require(path.join(PLUGIN_ROOT, 'lib/pdca/level'));
        assertEqual(detectLevel(TEST_PROJECT_DIR), 'Starter', 'Empty project should be Starter');
      },
      teardown: cleanupTestProject
    },
    {
      name: 'UT-61: phase.js getNextPdcaPhase() transition plan -> design',
      fn: () => {
        const { getNextPdcaPhase } = require(path.join(PLUGIN_ROOT, 'lib/pdca/phase'));
        assertEqual(getNextPdcaPhase('plan'), 'design');
      }
    },
    {
      name: 'UT-62: status.js loadPdcaStatus() returns primaryFeature',
      setup: () => createTestProject({ '.bkit/state/pdca-status.json': { version: '2.0', primaryFeature: 'test-feat', activeFeatures: {}, history: [] } }),
      fn: () => {
        const { loadPdcaStatus } = require(path.join(PLUGIN_ROOT, 'lib/pdca/status'));
        const status = loadPdcaStatus(TEST_PROJECT_DIR);
        assertEqual(status.primaryFeature, 'test-feat');
      },
      teardown: cleanupTestProject
    },

    // 4.2 GAP-02: lib/intent/
    {
      name: 'UT-65: language.js detectLanguage() for Korean',
      fn: () => {
        const { detectLanguage } = require(path.join(PLUGIN_ROOT, 'lib/intent/language'));
        assertEqual(detectLanguage('안녕하세요'), 'ko');
      }
    },
    {
      name: 'UT-66: trigger.js matchImplicitAgentTrigger() for code-analyzer',
      fn: () => {
        const { matchImplicitAgentTrigger } = require(path.join(PLUGIN_ROOT, 'lib/intent/trigger'));
        const result = matchImplicitAgentTrigger('코드 분석해줘');
        assertEqual(result.agent, 'code-analyzer');
      }
    },

    // 4.3 GAP-03: lib/task/ removed in v2.0.4
    {
      name: 'UT-68: classification.js classifyTask() minor change (v2.0.4: skip - lib/task removed)',
      skip: true,
      fn: () => {}
    },

    // 4.4 GAP-04: lib/core/
    {
      name: 'UT-73: file.js isSourceFile() for .js',
      fn: () => {
        const { isSourceFile } = require(path.join(PLUGIN_ROOT, 'lib/core/file'));
        assertEqual(isSourceFile('test.js'), true);
      }
    },
    {
      name: 'UT-77: platform.js platform constant is gemini',
      fn: () => {
        const { BKIT_PLATFORM } = require(path.join(PLUGIN_ROOT, 'lib/core/platform'));
        assertEqual(BKIT_PLATFORM, 'gemini');
      }
    },

    // 4.5 GAP-05: lib/common.js removed in v2.0.1 (zero usage)
    {
      name: 'UT-79: common.js removed (unused bridge)',
      fn: () => {
        const fs = require('fs');
        assert(!fs.existsSync(path.join(PLUGIN_ROOT, 'lib/common.js')), 'common.js should be deleted');
      }
    },

    // 4.7 GAP-12: context-hierarchy.js removed in v2.0.4
    {
      name: 'UT-88: getHierarchy() singleton (v2.0.4: skip - context-hierarchy removed)',
      skip: true,
      fn: () => {}
    }
  ]
};
