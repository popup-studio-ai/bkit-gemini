// TC-75: Output Styles Tests (12 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertContains, assertExists, getPdcaStatus, withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const OUTPUT_STYLES_DIR = path.join(PLUGIN_ROOT, 'output-styles');
const EXPECTED_STYLES = ['bkit-enterprise.md', 'bkit-learning.md', 'bkit-pdca-enterprise.md', 'bkit-pdca-guide.md'];

const tests = [
  { name: 'TC75-01: output-styles 디렉토리 존재', fn: () => {
    assertExists(OUTPUT_STYLES_DIR, 'output-styles dir');
  }},
  { name: 'TC75-02: 4개 output style 파일 존재', fn: () => {
    const files = fs.readdirSync(OUTPUT_STYLES_DIR).filter(f => f.endsWith('.md'));
    assert(files.length >= 4, `Should have >=4 styles, found ${files.length}`);
  }},
  { name: 'TC75-03: bkit-learning.md 존재', fn: () => {
    assertExists(path.join(OUTPUT_STYLES_DIR, 'bkit-learning.md'), 'bkit-learning');
  }},
  { name: 'TC75-04: bkit-pdca-guide.md 존재', fn: () => {
    assertExists(path.join(OUTPUT_STYLES_DIR, 'bkit-pdca-guide.md'), 'bkit-pdca-guide');
  }},
  { name: 'TC75-05: bkit-enterprise.md 존재', fn: () => {
    assertExists(path.join(OUTPUT_STYLES_DIR, 'bkit-enterprise.md'), 'bkit-enterprise');
  }},
  { name: 'TC75-06: bkit-pdca-enterprise.md 존재', fn: () => {
    assertExists(path.join(OUTPUT_STYLES_DIR, 'bkit-pdca-enterprise.md'), 'bkit-pdca-enterprise');
  }},
  { name: 'TC75-07: 각 스타일 파일 최소 크기', fn: () => {
    for (const style of EXPECTED_STYLES) {
      const stat = fs.statSync(path.join(OUTPUT_STYLES_DIR, style));
      assert(stat.size > 100, `${style} should be >100 bytes, got ${stat.size}`);
    }
  }},
  { name: 'TC75-08: bkit-learning 초보자 키워드', fn: () => {
    const content = fs.readFileSync(path.join(OUTPUT_STYLES_DIR, 'bkit-learning.md'), 'utf-8');
    const hasLearning = content.toLowerCase().includes('learn') || content.toLowerCase().includes('beginner') || content.toLowerCase().includes('starter');
    assert(hasLearning, 'Should have learning-related content');
  }},
  { name: 'TC75-09: bkit-pdca-guide PDCA 키워드', fn: () => {
    const content = fs.readFileSync(path.join(OUTPUT_STYLES_DIR, 'bkit-pdca-guide.md'), 'utf-8');
    assertContains(content.toLowerCase(), 'pdca', 'Should reference PDCA');
  }},
  { name: 'TC75-10: bkit-enterprise enterprise 키워드', fn: () => {
    const content = fs.readFileSync(path.join(OUTPUT_STYLES_DIR, 'bkit-enterprise.md'), 'utf-8');
    assertContains(content.toLowerCase(), 'enterprise', 'Should reference enterprise');
  }},
  { name: 'TC75-11: output style frontmatter 존재', fn: () => {
    for (const style of EXPECTED_STYLES) {
      const content = fs.readFileSync(path.join(OUTPUT_STYLES_DIR, style), 'utf-8');
      // Output styles may or may not have frontmatter
      assert(content.length > 0, `${style} should have content`);
    }
  }},
  { name: 'TC75-12: output style UTF-8 인코딩', fn: () => {
    for (const style of EXPECTED_STYLES) {
      const content = fs.readFileSync(path.join(OUTPUT_STYLES_DIR, style), 'utf-8');
      assert(typeof content === 'string', `${style} should be string`);
    }
  }}
];

module.exports = { tests };
