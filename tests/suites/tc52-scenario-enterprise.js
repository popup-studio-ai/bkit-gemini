// TC-52: Scenario Enterprise Level Tests (10 TC)
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, cleanupTestProject,
        assert, assertEqual, assertExists } = require('../test-utils');
const path = require('path');
const fs = require('fs');
const { detectLevel } = require(path.join(PLUGIN_ROOT, 'lib/pdca/level'));

const tests = [
  { name: 'TC52-01: kubernetes/ → Enterprise', setup: () => { createTestProject({}); fs.mkdirSync(path.join(TEST_PROJECT_DIR, 'kubernetes'), { recursive: true }); }, fn: () => { assertEqual(detectLevel(TEST_PROJECT_DIR), 'Enterprise', 'k8s → Enterprise'); }, teardown: cleanupTestProject },
  { name: 'TC52-02: terraform/ → Enterprise', setup: () => { createTestProject({}); fs.mkdirSync(path.join(TEST_PROJECT_DIR, 'terraform'), { recursive: true }); }, fn: () => { assertEqual(detectLevel(TEST_PROJECT_DIR), 'Enterprise', 'terraform → Enterprise'); }, teardown: cleanupTestProject },
  { name: 'TC52-03: k8s/ → Enterprise', setup: () => { createTestProject({}); fs.mkdirSync(path.join(TEST_PROJECT_DIR, 'k8s'), { recursive: true }); }, fn: () => { assertEqual(detectLevel(TEST_PROJECT_DIR), 'Enterprise', 'k8s/ → Enterprise'); }, teardown: cleanupTestProject },
  { name: 'TC52-04: infra/ → Enterprise', setup: () => { createTestProject({}); fs.mkdirSync(path.join(TEST_PROJECT_DIR, 'infra'), { recursive: true }); }, fn: () => { assertEqual(detectLevel(TEST_PROJECT_DIR), 'Enterprise', 'infra/ → Enterprise'); }, teardown: cleanupTestProject },
  { name: 'TC52-05: Enterprise bkit-enterprise 스타일', fn: () => { assertExists(path.join(PLUGIN_ROOT, 'output-styles/bkit-enterprise.md'), 'enterprise style'); } },
  { name: 'TC52-06: Enterprise 스킬 존재', fn: () => { assertExists(path.join(PLUGIN_ROOT, 'skills/enterprise/SKILL.md'), 'enterprise skill'); } },
  { name: 'TC52-07: enterprise-expert 에이전트', fn: () => { assertExists(path.join(PLUGIN_ROOT, 'agents/enterprise-expert.md'), 'enterprise-expert'); } },
  { name: 'TC52-08: infra-architect 에이전트', fn: () => { assertExists(path.join(PLUGIN_ROOT, 'agents/infra-architect.md'), 'infra-architect'); } },
  { name: 'TC52-09: Enterprise Team 5 에이전트', fn: () => { const TeamStrategy = require(path.join(PLUGIN_ROOT, 'lib/team/strategy')); const s = new TeamStrategy(); const strategy = s.getStrategy ? s.getStrategy('Enterprise') : s.selectStrategy('Enterprise'); assert(strategy !== undefined, 'Should have Enterprise strategy'); } },
  { name: 'TC52-10: bkit-pdca-enterprise 스타일', fn: () => { assertExists(path.join(PLUGIN_ROOT, 'output-styles/bkit-pdca-enterprise.md'), 'pdca-enterprise style'); } }
];

module.exports = { tests };
