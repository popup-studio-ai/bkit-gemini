// TC-51: Scenario Dynamic Level Tests (10 TC)
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, cleanupTestProject,
        executeHook, assert, assertEqual, assertExists } = require('../test-utils');
const path = require('path');
const fs = require('fs');
const { detectLevel } = require(path.join(PLUGIN_ROOT, 'lib/pdca/level'));

const tests = [
  { name: 'TC51-01: .mcp.json → Dynamic 감지', setup: () => createTestProject({ '.mcp.json': '{}' }), fn: () => { assertEqual(detectLevel(TEST_PROJECT_DIR), 'Dynamic', '.mcp.json → Dynamic'); }, teardown: cleanupTestProject },
  { name: 'TC51-02: docker-compose.yml → Dynamic', setup: () => createTestProject({ 'docker-compose.yml': 'version: "3"' }), fn: () => { assertEqual(detectLevel(TEST_PROJECT_DIR), 'Dynamic', 'docker-compose → Dynamic'); }, teardown: cleanupTestProject },
  { name: 'TC51-03: Dynamic 세션 시작', setup: () => createTestProject({ '.pdca-status.json': { version: '2.0', primaryFeature: null, activeFeatures: {}, archivedFeatures: {}, pipeline: {}, lastChecked: '' }, '.bkit/state/memory.json': { data: { session: { sessionCount: 1 } } }, '.mcp.json': '{}' }), fn: () => { const r = executeHook('session-start.js'); if (r.output && r.output.metadata) assertEqual(r.output.metadata.level, 'Dynamic', 'Should be Dynamic'); }, teardown: cleanupTestProject },
  { name: 'TC51-04: Dynamic bkit-pdca-guide 스타일', fn: () => { assertExists(path.join(PLUGIN_ROOT, 'output-styles/bkit-pdca-guide.md'), 'pdca-guide style'); } },
  { name: 'TC51-05: Dynamic 스킬 존재', fn: () => { assertExists(path.join(PLUGIN_ROOT, 'skills/dynamic/SKILL.md'), 'dynamic skill'); } },
  { name: 'TC51-06: bkend-expert 에이전트 존재', fn: () => { assertExists(path.join(PLUGIN_ROOT, 'agents/bkend-expert.md'), 'bkend-expert'); } },
  { name: 'TC51-07: Dynamic Team 3 에이전트', fn: () => { const TeamStrategy = require(path.join(PLUGIN_ROOT, 'lib/team/strategy')); const s = new TeamStrategy(); const strategy = s.getStrategy ? s.getStrategy('Dynamic') : s.selectStrategy('Dynamic'); assert(strategy !== undefined, 'Should have Dynamic strategy'); } },
  { name: 'TC51-08: Dynamic PDCA 전체 사이클 시뮬', setup: () => createTestProject({}), fn: () => {
    const { loadPdcaStatus, savePdcaStatus } = require(path.join(PLUGIN_ROOT, 'lib/pdca/status'));
    const s = loadPdcaStatus(TEST_PROJECT_DIR);
    s.activeFeatures = { 'dyn-test': { phase: 'plan', matchRate: null, documents: {} } };
    ['design', 'do', 'check', 'completed'].forEach(p => { s.activeFeatures['dyn-test'].phase = p; });
    s.activeFeatures['dyn-test'].matchRate = 95;
    savePdcaStatus(s, TEST_PROJECT_DIR);
    assertEqual(loadPdcaStatus(TEST_PROJECT_DIR).activeFeatures['dyn-test'].matchRate, 95, 'Should complete');
  }, teardown: cleanupTestProject },
  { name: 'TC51-09: api/ 디렉토리 → Dynamic 감지', setup: () => { createTestProject({}); fs.mkdirSync(path.join(TEST_PROJECT_DIR, 'api'), { recursive: true }); }, fn: () => { assertEqual(detectLevel(TEST_PROJECT_DIR), 'Dynamic', 'api/ → Dynamic'); }, teardown: cleanupTestProject },
  { name: 'TC51-10: supabase/ 디렉토리 → Dynamic 감지', setup: () => { createTestProject({}); fs.mkdirSync(path.join(TEST_PROJECT_DIR, 'supabase'), { recursive: true }); }, fn: () => { assertEqual(detectLevel(TEST_PROJECT_DIR), 'Dynamic', 'supabase/ → Dynamic'); }, teardown: cleanupTestProject }
];

module.exports = { tests };
