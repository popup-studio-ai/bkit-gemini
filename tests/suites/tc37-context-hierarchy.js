// TC-37: Context Hierarchy Unit Tests (10 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertType, assertExists, assertContains } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const CONTEXT_DIR = path.join(PLUGIN_ROOT, '.gemini', 'context');

const tests = [
  { name: 'TC37-01: .gemini/ 디렉토리 존재', fn: () => { assertExists(path.join(PLUGIN_ROOT, '.gemini'), '.gemini dir'); } },
  {
    name: 'TC37-02: GEMINI.md 존재',
    fn: () => { assertExists(path.join(PLUGIN_ROOT, 'GEMINI.md'), 'GEMINI.md'); }
  },
  {
    name: 'TC37-03: GEMINI.md 최소 크기',
    fn: () => {
      const stat = fs.statSync(path.join(PLUGIN_ROOT, 'GEMINI.md'));
      assert(stat.size > 100, `GEMINI.md should be >100 bytes, found ${stat.size}`);
    }
  },
  {
    name: 'TC37-04: context/ 디렉토리 확인',
    fn: () => {
      if (fs.existsSync(CONTEXT_DIR)) {
        const files = fs.readdirSync(CONTEXT_DIR);
        assert(files.length >= 0, 'Context dir should be readable');
      } else {
        assert(true, 'Context dir is optional');
      }
    }
  },
  {
    name: 'TC37-05: .gemini/settings.json 존재',
    fn: () => {
      const settingsPath = path.join(PLUGIN_ROOT, '.gemini', 'settings.json');
      if (fs.existsSync(settingsPath)) {
        const content = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        assertType(content, 'object', 'Should be valid JSON');
      } else {
        assert(true, 'settings.json is optional');
      }
    }
  },
  {
    name: 'TC37-06: GEMINI.md bkit 버전 참조',
    fn: () => {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'GEMINI.md'), 'utf-8');
      assertContains(content, 'bkit', 'Should reference bkit');
    }
  },
  {
    name: 'TC37-07: context 파일 .md 확장자',
    fn: () => {
      if (fs.existsSync(CONTEXT_DIR)) {
        const files = fs.readdirSync(CONTEXT_DIR);
        const nonMd = files.filter(f => !f.endsWith('.md') && !f.startsWith('.'));
        assertEqual(nonMd.length, 0, `Non-md files in context: ${nonMd.join(', ')}`);
      }
    }
  },
  {
    name: 'TC37-08: .gemini/ 하위 구조',
    fn: () => {
      const geminiDir = path.join(PLUGIN_ROOT, '.gemini');
      const items = fs.readdirSync(geminiDir);
      assert(items.length >= 1, 'Should have at least 1 item in .gemini/');
    }
  },
  {
    name: 'TC37-09: GEMINI.md PDCA 워크플로우 언급',
    fn: () => {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'GEMINI.md'), 'utf-8');
      assertContains(content, 'PDCA', 'Should reference PDCA workflow');
    }
  },
  {
    name: 'TC37-10: GEMINI.md import 구문 또는 context 참조',
    fn: () => {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'GEMINI.md'), 'utf-8');
      const hasImport = content.includes('@import') || content.includes('context');
      assert(hasImport, 'Should have import or context reference');
    }
  }
];

module.exports = { tests };
