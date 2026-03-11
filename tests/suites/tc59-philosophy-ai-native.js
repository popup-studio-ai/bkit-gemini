// TC-59: Philosophy AI-Native Tests (5 TC)
const { PLUGIN_ROOT, assert, assertContains, assertExists } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const tests = [
  { name: 'TC59-01: Zero External Dependencies', fn: () => {
    // bkit-gemini has no package.json (zero dependency philosophy - no npm at all)
    const pkgPath = path.join(PLUGIN_ROOT, 'package.json');
    assert(!fs.existsSync(pkgPath), 'Should have no package.json (pure Node.js built-ins only)');
  }},
  { name: 'TC59-02: AI 에이전트 21개 정의', fn: () => {
    const agents = fs.readdirSync(path.join(PLUGIN_ROOT, 'agents')).filter(f => f.endsWith('.md'));
    assert(agents.length >= 21, `Should have >=21 agents, got ${agents.length}`);
  }},
  { name: 'TC59-03: Markdown 기반 에이전트 정의', fn: () => {
    const agents = fs.readdirSync(path.join(PLUGIN_ROOT, 'agents')).filter(f => f.endsWith('.md'));
    for (const a of agents) {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'agents', a), 'utf-8');
      assert(content.length > 100, `Agent ${a} should have substantial content`);
    }
  }},
  { name: 'TC59-04: 8개 언어 다국어 지원', fn: () => {
    const { SUPPORTED_LANGUAGES } = require(path.join(PLUGIN_ROOT, 'lib/intent/language'));
    assert(SUPPORTED_LANGUAGES.length >= 8, 'Should support 8+ languages');
  }},
  { name: 'TC59-05: AI 네이티브 아키텍처 (lib 모듈 수)', fn: () => {
    const countFiles = (dir) => {
      let count = 0;
      if (!fs.existsSync(dir)) return 0;
      for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) count += countFiles(full);
        else if (f.endsWith('.js')) count++;
      }
      return count;
    };
    const libCount = countFiles(path.join(PLUGIN_ROOT, 'lib'));
    assert(libCount >= 40, `Should have >=40 lib modules, found ${libCount}`);
  }}
];

function assertEqual(a, b, msg) { if (a !== b) throw new Error(`ASSERT FAILED: ${msg}\n  Expected: ${JSON.stringify(b)}\n  Actual: ${JSON.stringify(a)}`); }

module.exports = { tests };
