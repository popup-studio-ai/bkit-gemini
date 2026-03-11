// TC-43: MCP Command E2E Tests (8 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertExists, assertContains, sendMcpRequest } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const MCP_DIR = path.join(PLUGIN_ROOT, 'mcp');
const COMMANDS_DIR = path.join(PLUGIN_ROOT, 'commands');

const tests = [
  {
    name: 'TC43-01: mcp/ 디렉토리 존재',
    fn: () => { assertExists(MCP_DIR, 'mcp/ should exist'); }
  },
  {
    name: 'TC43-02: spawn-agent-server.js 존재',
    fn: () => { assertExists(path.join(MCP_DIR, 'spawn-agent-server.js'), 'spawn-agent-server.js'); }
  },
  {
    name: 'TC43-03: commands/ 23개 TOML 파일',
    fn: () => {
      const files = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.toml'));
      assert(files.length >= 23, `Should have >=23 TOML commands, found ${files.length}`);
    }
  },
  {
    name: 'TC43-04: pdca.toml 존재',
    fn: () => { assertExists(path.join(COMMANDS_DIR, 'pdca.toml'), 'pdca.toml'); }
  },
  {
    name: 'TC43-05: pdca.toml PDCA 키워드',
    fn: () => {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, 'pdca.toml'), 'utf-8');
      assertContains(content, 'pdca', 'Should reference pdca');
    }
  },
  {
    name: 'TC43-06: bkit.toml 존재',
    fn: () => { assertExists(path.join(COMMANDS_DIR, 'bkit.toml'), 'bkit.toml'); }
  },
  {
    name: 'TC43-07: pipeline.toml 존재',
    fn: () => { assertExists(path.join(COMMANDS_DIR, 'pipeline.toml'), 'pipeline.toml'); }
  },
  {
    name: 'TC43-08: TOML 파일 최소 크기',
    fn: () => {
      const files = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.toml'));
      let tooSmall = [];
      for (const f of files) {
        const stat = fs.statSync(path.join(COMMANDS_DIR, f));
        if (stat.size < 50) tooSmall.push(f);
      }
      assertEqual(tooSmall.length, 0, `Tiny TOML files: ${tooSmall.join(', ')}`);
    }
  }
];

module.exports = { tests };
