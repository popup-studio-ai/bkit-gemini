// tests/suites/tc05-mcp.js
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, cleanupTestProject, sendMcpRequest, assert, assertEqual, assertContains } = require('../test-utils');

const tests = [
  {
    name: 'MCP-01: Initialize handshake',
    setup: () => createTestProject({}),
    fn: () => {
      const response = sendMcpRequest('initialize', {});
      assert(response.result, 'Should have result');
      assertEqual(response.result.protocolVersion, '2024-11-05', 'Protocol version');
      assertEqual(response.result.serverInfo.name, 'bkit-agents', 'Server name');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'MCP-02: tools/list returns 6 tools',
    setup: () => createTestProject({}),
    fn: () => {
      const response = sendMcpRequest('tools/list');
      assert(response.result, 'Should have result');
      assertEqual(response.result.tools.length, 6, 'Should have 6 tools');
      const toolNames = response.result.tools.map(t => t.name);
      assert(toolNames.includes('spawn_agent'), 'Should include spawn_agent');
      assert(toolNames.includes('list_agents'), 'Should include list_agents');
      assert(toolNames.includes('team_create'), 'Should include team_create');
    },
    teardown: cleanupTestProject
  }
];

module.exports = { tests };
