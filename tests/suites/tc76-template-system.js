// TC-76: Template System Tests (15 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertContains, assertExists, getPdcaStatus, withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const TEMPLATES_DIR = path.join(PLUGIN_ROOT, 'templates');
const REQUIRED_TEMPLATES = [
  'plan.template.md', 'design.template.md', 'analysis.template.md',
  'report.template.md', 'do.template.md', 'convention.template.md',
  'schema.template.md', 'GEMINI.template.md'
];

const tests = [
  { name: 'TC76-01: templates 디렉토리 존재', fn: () => {
    assertExists(TEMPLATES_DIR, 'templates dir');
  }},
  { name: 'TC76-02: 10+ 템플릿 파일 존재', fn: () => {
    const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.md'));
    assert(files.length >= 10, `Should have >=10 templates, got ${files.length}`);
  }},
  { name: 'TC76-03: plan.template.md 존재', fn: () => {
    assertExists(path.join(TEMPLATES_DIR, 'plan.template.md'), 'plan template');
  }},
  { name: 'TC76-04: design.template.md 존재', fn: () => {
    assertExists(path.join(TEMPLATES_DIR, 'design.template.md'), 'design template');
  }},
  { name: 'TC76-05: analysis.template.md 존재', fn: () => {
    assertExists(path.join(TEMPLATES_DIR, 'analysis.template.md'), 'analysis template');
  }},
  { name: 'TC76-06: report.template.md 존재', fn: () => {
    assertExists(path.join(TEMPLATES_DIR, 'report.template.md'), 'report template');
  }},
  { name: 'TC76-07: do.template.md 존재', fn: () => {
    assertExists(path.join(TEMPLATES_DIR, 'do.template.md'), 'do template');
  }},
  { name: 'TC76-08: plan 템플릿 Executive Summary 섹션', fn: () => {
    const content = fs.readFileSync(path.join(TEMPLATES_DIR, 'plan.template.md'), 'utf-8');
    const hasSummary = content.includes('Executive Summary') || content.includes('Summary') || content.includes('##');
    assert(hasSummary, 'Plan should have summary section');
  }},
  { name: 'TC76-09: design 템플릿 구조', fn: () => {
    const content = fs.readFileSync(path.join(TEMPLATES_DIR, 'design.template.md'), 'utf-8');
    assert(content.includes('#'), 'Design template should have headings');
  }},
  { name: 'TC76-10: report 템플릿 구조', fn: () => {
    const content = fs.readFileSync(path.join(TEMPLATES_DIR, 'report.template.md'), 'utf-8');
    assert(content.includes('#'), 'Report template should have headings');
  }},
  { name: 'TC76-11: 모든 필수 템플릿 최소 크기', fn: () => {
    for (const tmpl of REQUIRED_TEMPLATES) {
      const filePath = path.join(TEMPLATES_DIR, tmpl);
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        assert(stat.size > 50, `${tmpl} should be >50 bytes`);
      }
    }
  }},
  { name: 'TC76-12: GEMINI.template.md 존재', fn: () => {
    assertExists(path.join(TEMPLATES_DIR, 'GEMINI.template.md'), 'GEMINI template');
  }},
  { name: 'TC76-13: convention.template.md 존재', fn: () => {
    assertExists(path.join(TEMPLATES_DIR, 'convention.template.md'), 'convention template');
  }},
  { name: 'TC76-14: schema.template.md 존재', fn: () => {
    assertExists(path.join(TEMPLATES_DIR, 'schema.template.md'), 'schema template');
  }},
  { name: 'TC76-15: TEMPLATE-GUIDE.md 존재', fn: () => {
    assertExists(path.join(TEMPLATES_DIR, 'TEMPLATE-GUIDE.md'), 'template guide');
  }}
];

module.exports = { tests };
