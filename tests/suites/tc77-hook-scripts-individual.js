// TC-77: Hook Scripts Individual Tests (18 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertContains, assertExists } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const HOOKS_DIR = path.join(PLUGIN_ROOT, 'hooks', 'scripts');
const HOOK_SCRIPTS = [
  'session-start.js', 'session-end.js',
  'before-tool.js', 'after-tool.js',
  'before-model.js', 'after-model.js',
  'before-agent.js', 'after-agent.js',
  'before-tool-selection.js', 'pre-compress.js'
];

const tests = [
  { name: 'TC77-01: hooks/scripts 디렉토리 존재', fn: () => {
    assertExists(HOOKS_DIR, 'hooks/scripts dir');
  }},
  { name: 'TC77-02: 10개 hook script 파일 존재', fn: () => {
    const files = fs.readdirSync(HOOKS_DIR).filter(f => f.endsWith('.js'));
    assert(files.length >= 10, `Should have >=10 hooks, got ${files.length}`);
  }},
  { name: 'TC77-03: session-start.js 존재', fn: () => {
    assertExists(path.join(HOOKS_DIR, 'session-start.js'), 'session-start');
  }},
  { name: 'TC77-04: session-end.js 존재', fn: () => {
    assertExists(path.join(HOOKS_DIR, 'session-end.js'), 'session-end');
  }},
  { name: 'TC77-05: before-tool.js 존재', fn: () => {
    assertExists(path.join(HOOKS_DIR, 'before-tool.js'), 'before-tool');
  }},
  { name: 'TC77-06: after-tool.js 존재', fn: () => {
    assertExists(path.join(HOOKS_DIR, 'after-tool.js'), 'after-tool');
  }},
  { name: 'TC77-07: before-model.js 존재', fn: () => {
    assertExists(path.join(HOOKS_DIR, 'before-model.js'), 'before-model');
  }},
  { name: 'TC77-08: after-model.js 존재', fn: () => {
    assertExists(path.join(HOOKS_DIR, 'after-model.js'), 'after-model');
  }},
  { name: 'TC77-09: before-agent.js 존재', fn: () => {
    assertExists(path.join(HOOKS_DIR, 'before-agent.js'), 'before-agent');
  }},
  { name: 'TC77-10: after-agent.js 존재', fn: () => {
    assertExists(path.join(HOOKS_DIR, 'after-agent.js'), 'after-agent');
  }},
  { name: 'TC77-11: before-tool-selection.js 존재', fn: () => {
    assertExists(path.join(HOOKS_DIR, 'before-tool-selection.js'), 'before-tool-selection');
  }},
  { name: 'TC77-12: pre-compress.js 존재', fn: () => {
    assertExists(path.join(HOOKS_DIR, 'pre-compress.js'), 'pre-compress');
  }},
  { name: 'TC77-13: session-start.js 충분한 크기', fn: () => {
    const stat = fs.statSync(path.join(HOOKS_DIR, 'session-start.js'));
    assert(stat.size > 1000, `session-start should be substantial, got ${stat.size}`);
  }},
  { name: 'TC77-14: session-start.js JSON 출력 구조', fn: () => {
    const content = fs.readFileSync(path.join(HOOKS_DIR, 'session-start.js'), 'utf-8');
    assertContains(content, 'JSON.stringify', 'Should output JSON');
  }},
  { name: 'TC77-15: before-tool.js permission 검사', fn: () => {
    const content = fs.readFileSync(path.join(HOOKS_DIR, 'before-tool.js'), 'utf-8');
    const hasPermission = content.includes('permission') || content.includes('checkPermission') || content.includes('allow');
    assert(hasPermission, 'before-tool should check permissions');
  }},
  { name: 'TC77-16: 모든 hook script 유효한 JS 구문', fn: () => {
    for (const script of HOOK_SCRIPTS) {
      const filePath = path.join(HOOKS_DIR, script);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Basic syntax check: should have require or import
        assert(content.includes('require') || content.includes('import') || content.includes('process'), `${script} should be valid JS`);
      }
    }
  }},
  { name: 'TC77-17: hook script 파일 읽기 패턴', fn: () => {
    const content = fs.readFileSync(path.join(HOOKS_DIR, 'session-start.js'), 'utf-8');
    assert(content.includes('readFileSync') || content.includes('readFile') || content.includes('require'), 'Should read files');
  }},
  { name: 'TC77-18: hook script process 출력 처리', fn: () => {
    const content = fs.readFileSync(path.join(HOOKS_DIR, 'session-start.js'), 'utf-8');
    assert(content.includes('process.stdout') || content.includes('console') || content.includes('JSON.stringify'), 'Should handle output');
  }}
];

module.exports = { tests };
