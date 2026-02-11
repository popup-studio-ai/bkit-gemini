// tests/suites/tc03-agents.js
const { PLUGIN_ROOT, assert, assertEqual, assertContains, assertExists } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const ALL_AGENTS = [
  'cto-lead', 'frontend-architect', 'security-architect', 'product-manager', 'qa-strategist',
  'gap-detector', 'design-validator', 'code-analyzer', 'pdca-iterator', 'report-generator',
  'qa-monitor', 'starter-guide', 'pipeline-guide', 'bkend-expert', 'enterprise-expert', 'infra-architect'
];

const tests = [
  {
    name: 'AGENT-01: 16 agent .md files exist',
    fn: () => {
      for (const agent of ALL_AGENTS) {
        assertExists(path.join(PLUGIN_ROOT, 'agents', `${agent}.md`), `${agent}.md should exist`);
      }
      assertEqual(ALL_AGENTS.length, 16, 'Should have exactly 16 agents');
    }
  },
  {
    name: 'AGENT-02: cto-lead has correct frontmatter',
    fn: () => {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'agents', 'cto-lead.md'), 'utf-8');
      assertContains(content, 'model:', 'Should have model field');
      assertContains(content, 'temperature:', 'Should have temperature field');
    }
  },
  {
    name: 'AGENT-13: MCP server registers all 16 agents',
    fn: () => {
      const serverCode = fs.readFileSync(path.join(PLUGIN_ROOT, 'mcp', 'spawn-agent-server.js'), 'utf-8');
      for (const agent of ALL_AGENTS) {
        assertContains(serverCode, `'${agent}'`, `MCP server should register ${agent}`);
      }
    }
  }
];

module.exports = { tests };
