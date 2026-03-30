// TC-56: Philosophy PDCA Tests (15 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertContains, assertType, assertExists, getPdcaStatus, withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const tests = [
  { name: 'TC56-01: Plan→Design→Do→Check→Act 5단계 정의', fn: () => {
    const { PDCA_PHASES } = require(path.join(PLUGIN_ROOT, 'lib/pdca/phase'));
    assert(Object.keys(PDCA_PHASES).length >= 5, 'Should have 5+ phases');
  }},
  { name: 'TC56-02: matchRateThreshold 90% 기본값', fn: () => {
    const { ContextHierarchy } = require(path.join(PLUGIN_ROOT, 'lib/context-hierarchy'));
    const h = new ContextHierarchy(PLUGIN_ROOT, PLUGIN_ROOT);
    assertEqual(h.get('pdca.matchRateThreshold'), 90, 'Threshold should be 90');
  }},
  { name: 'TC56-03: Plan 문서 템플릿 존재', fn: () => { assertExists(path.join(PLUGIN_ROOT, 'templates/plan.template.md'), 'plan template'); } },
  { name: 'TC56-04: Design 문서 템플릿 존재', fn: () => { assertExists(path.join(PLUGIN_ROOT, 'templates/design.template.md'), 'design template'); } },
  { name: 'TC56-05: Analysis 문서 템플릿 존재', fn: () => { assertExists(path.join(PLUGIN_ROOT, 'templates/analysis.template.md'), 'analysis template'); } },
  { name: 'TC56-06: Report 문서 템플릿 존재', fn: () => { assertExists(path.join(PLUGIN_ROOT, 'templates/report.template.md'), 'report template'); } },
  { name: 'TC56-07: gap-detector 에이전트 Check 역할', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'agents/gap-detector.md'), 'utf-8');
    assertContains(content, 'gap', 'Should reference gap detection');
  }},
  { name: 'TC56-08: pdca-iterator 에이전트 Act 역할', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'agents/pdca-iterator.md'), 'utf-8');
    assertContains(content, 'iter', 'Should reference iteration');
  }},
  { name: 'TC56-09: report-generator 에이전트 Report 역할', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'agents/report-generator.md'), 'utf-8');
    assertContains(content, 'report', 'Should reference report');
  }},
  { name: 'TC56-10: PDCA 스킬에 전체 사이클 정의', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'skills/pdca/SKILL.md'), 'utf-8');
    assertContains(content, 'plan', 'plan');
    assertContains(content, 'design', 'design');
    assertContains(content, 'analyze', 'analyze');
  }},
  { name: 'TC56-11: session-start PDCA Core Rules 주입', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks/scripts/session-start.js'), 'utf-8');
    assertContains(content, 'PDCA Core Rules', 'Should inject PDCA rules');
  }},
  { name: 'TC56-12: v2.0 스키마 구조 준수', fn: () => {
    const { createInitialStatusV2 } = require(path.join(PLUGIN_ROOT, 'lib/pdca/status'));
    const s = createInitialStatusV2();
    assertEqual(s.version, '2.0', 'Should be v2.0');
    assert(s.activeFeatures !== undefined, 'activeFeatures');
    assert(s.features !== undefined || s.archivedFeatures !== undefined, 'features or archivedFeatures');
  }},
  { name: 'TC56-13: Feature 라이프사이클 문서화', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'skills/pdca/SKILL.md'), 'utf-8');
    assertContains(content, 'archive', 'Should document archive phase');
  }},
  { name: 'TC56-14: maxIterations 5 제한', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'skills/pdca/SKILL.md'), 'utf-8');
    assertContains(content, '5', 'Should reference 5 max iterations');
  }},
  { name: 'TC56-15: PDCA 자동화 레벨', fn: () => {
    const { getAutomationLevel } = require(path.join(PLUGIN_ROOT, 'lib/pdca/automation'));
    assertType(getAutomationLevel, 'function', 'Should support automation levels');
  }}
];

module.exports = { tests };
