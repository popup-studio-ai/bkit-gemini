const fs = require('fs');
const path = require('path');
const { 
  assert, assertEqual, assertContains, PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, cleanupTestProject 
} = require('../test-utils');

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
      setup: () => createTestProject({ 'docs/.pdca-status.json': { version: '2.0', primaryFeature: 'test-feat', features: {} } }),
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

    // 4.3 GAP-03: lib/task/
    {
      name: 'UT-68: classification.js classifyTask() minor change',
      fn: () => {
        const { classifyTask } = require(path.join(PLUGIN_ROOT, 'lib/task/classification'));
        // minorChange: 2500 <= charCount < 10000
        const content = 'a'.repeat(3000);
        assertEqual(classifyTask(content), 'minorChange');
      }
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

    // 4.5 GAP-05: lib/common.js
    {
      name: 'UT-79: common.js exports checkPermission',
      fn: () => {
        const common = require(path.join(PLUGIN_ROOT, 'lib/common'));
        assert(typeof common.checkPermission === 'function', 'Should export checkPermission');
      }
    },

    // 4.7 GAP-12: context-hierarchy.js
    {
      name: 'UT-88: getHierarchy() singleton',
      fn: () => {
        const { getHierarchy } = require(path.join(PLUGIN_ROOT, 'lib/context-hierarchy'));
        const h1 = getHierarchy();
        const h2 = getHierarchy();
        assert(h1 === h2, 'Should be same instance');
      }
    }
  ]
};
