// tests/suites/tc12-agent-memory.js - Agent Memory Test
const { PLUGIN_ROOT, assert, assertExists, assertEqual } = require('../test-utils');
const fs = require('fs');
const path = require('path');

const tests = [
  {
    name: 'TC-12-01: Agent Memory Directory Existence',
    fn: () => {
      const memoryDir = path.resolve(PLUGIN_ROOT, '.gemini/agent-memory');
      assertExists(memoryDir, 'Agent memory directory should exist');
    }
  },
  {
    name: 'TC-12-02: Bkit Specific Agent Memory Path',
    fn: () => {
      const bkitMemoryDir = path.resolve(PLUGIN_ROOT, '.gemini/agent-memory/bkit');
      assertExists(bkitMemoryDir, 'Bkit specific agent memory directory should exist');
    }
  },
  {
    name: 'TC-12-03: Required Agent Memory Files',
    fn: () => {
      const requiredAgents = [
        'cto-lead',
        'code-analyzer',
        'design-validator',
        'enterprise-expert',
        'frontend-architect',
        'gap-detector',
        'infra-architect',
        'qa-strategist',
        'security-architect',
        'bkend-expert',
        'pdca-iterator',
        'pipeline-guide',
        'product-manager',
        'qa-monitor',
        'report-generator',
        'starter-guide'
      ];
      const bkitMemoryDir = path.resolve(PLUGIN_ROOT, '.gemini/agent-memory/bkit');
      requiredAgents.forEach(agent => {
        assertExists(path.join(bkitMemoryDir, `${agent}.json`), `${agent}.json memory file should exist`);
      });
    }
  },
  {
    name: 'TC-12-04: Memory Policy Persistence',
    fn: () => {
      const configPath = path.resolve(PLUGIN_ROOT, 'bkit.config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      assertEqual(config.agentMemory.enabled, true, 'Agent memory should be enabled');
      assertEqual(config.agentMemory.maxSessionsPerAgent, 20, 'Max sessions should be 20');
    }
  }
];

module.exports = { tests };
