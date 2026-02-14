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
  },
  {
    name: 'AGENT-14: bkend-expert agent contains critical content',
    fn: () => {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'agents', 'bkend-expert.md'), 'utf-8');
      assertContains(content, 'bkendFetch', 'Should contain bkendFetch wrapper pattern');
      assertContains(content, 'MongoDB Atlas', 'Should reference MongoDB Atlas');
      assertContains(content, '28 MCP', 'Should document 28 MCP tools');
      assertContains(content, 'Refresh Token: **30 days**', 'Should have correct 30-day refresh token lifetime');
      assertContains(content, 'bkend-auth', 'Should reference bkend-auth skill');
      assertContains(content, 'bkend-data', 'Should reference bkend-data skill');
      assertContains(content, 'bkend-storage', 'Should reference bkend-storage skill');
      assertContains(content, 'bkend-mcp', 'Should reference bkend-mcp skill');
    }
  }
];

module.exports = { tests };
