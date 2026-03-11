// TC-50: Scenario Starter Level Tests (10 TC)
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, cleanupTestProject,
        executeHook, assert, assertEqual, assertExists } = require('../test-utils');
const { LEVEL_DETECTION_FIXTURES } = require('../fixtures');
const path = require('path');
const fs = require('fs');

const { detectLevel } = require(path.join(PLUGIN_ROOT, 'lib/pdca/level'));

const tests = [
  { name: 'TC50-01: 빈 프로젝트 → Starter 감지', setup: () => createTestProject({}), fn: () => { assertEqual(detectLevel(TEST_PROJECT_DIR), 'Starter', 'Empty → Starter'); }, teardown: cleanupTestProject },
  { name: 'TC50-02: Starter 세션 시작', setup: () => createTestProject({ '.pdca-status.json': { version: '2.0', primaryFeature: null, activeFeatures: {}, archivedFeatures: {}, pipeline: {}, lastChecked: '' }, '.bkit/state/memory.json': { data: { session: { sessionCount: 1 } } } }), fn: () => { const r = executeHook('session-start.js'); if (r.output && r.output.metadata) assertEqual(r.output.metadata.level, 'Starter', 'Should be Starter'); }, teardown: cleanupTestProject },
  { name: 'TC50-03: Starter PDCA Plan 생성 시뮬', setup: () => createTestProject({}), fn: () => {
    const { loadPdcaStatus, savePdcaStatus } = require(path.join(PLUGIN_ROOT, 'lib/pdca/status'));
    const s = loadPdcaStatus(TEST_PROJECT_DIR);
    s.primaryFeature = 'starter-feature';
    s.activeFeatures = { 'starter-feature': { phase: 'plan', matchRate: null, documents: {} } };
    savePdcaStatus(s, TEST_PROJECT_DIR);
    const loaded = loadPdcaStatus(TEST_PROJECT_DIR);
    assertEqual(loaded.activeFeatures['starter-feature'].phase, 'plan', 'Should create plan');
  }, teardown: cleanupTestProject },
  { name: 'TC50-04: Starter bkit-learning 스타일 로딩', fn: () => { assertExists(path.join(PLUGIN_ROOT, 'output-styles/bkit-learning.md'), 'bkit-learning style'); } },
  { name: 'TC50-05: Starter 프로젝트 디렉토리 최소 구조', setup: () => createTestProject({}), fn: () => { assertExists(path.join(TEST_PROJECT_DIR, 'docs'), 'docs/ should exist'); assertExists(path.join(TEST_PROJECT_DIR, 'src'), 'src/ should exist'); }, teardown: cleanupTestProject },
  { name: 'TC50-06: starter 스킬 존재', fn: () => { assertExists(path.join(PLUGIN_ROOT, 'skills/starter/SKILL.md'), 'starter skill'); } },
  { name: 'TC50-07: starter-guide 에이전트 존재', fn: () => { assertExists(path.join(PLUGIN_ROOT, 'agents/starter-guide.md'), 'starter-guide'); } },
  { name: 'TC50-08: pipeline-guide 에이전트 존재', fn: () => { assertExists(path.join(PLUGIN_ROOT, 'agents/pipeline-guide.md'), 'pipeline-guide'); } },
  { name: 'TC50-09: Starter → no k8s/terraform dirs', setup: () => createTestProject({}), fn: () => { assert(!fs.existsSync(path.join(TEST_PROJECT_DIR, 'kubernetes')), 'No k8s'); assert(!fs.existsSync(path.join(TEST_PROJECT_DIR, 'terraform')), 'No terraform'); }, teardown: cleanupTestProject },
  { name: 'TC50-10: Starter 출력 스타일 기본값', fn: () => { const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'output-styles/bkit-learning.md'), 'utf-8'); assert(content.includes('Output Rules') || content.includes('output'), 'Should have output rules'); } }
];

module.exports = { tests };
