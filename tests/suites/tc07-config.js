// tests/suites/tc07-config.js
const { PLUGIN_ROOT, assert, assertEqual } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const tests = [
  {
    name: 'CFG-01: bkit.config.json valid JSON',
    fn: () => {
      const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
      assert(typeof config === 'object', 'Should parse as object');
    }
  },
  {
    name: 'CFG-02: version is 1.5.4',
    fn: () => {
      const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
      assertEqual(config.version, '1.5.4', 'Version should be 1.5.4');
    }
  },
  {
    name: 'CFG-03: gemini-extension.json no experimental block',
    fn: () => {
      const ext = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'gemini-extension.json'), 'utf-8'));
      assertEqual(ext.version, '1.5.4', 'Extension version should be 1.5.4');
      assert(!ext.experimental, 'experimental block should be removed (Skills/Hooks GA since v0.26.0)');
    }
  },
  {
    name: 'CFG-06: Tool Registry exports 17 built-in tools',
    fn: () => {
      const { ALL_BUILTIN_TOOL_NAMES, BUILTIN_TOOLS } = require(path.join(PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'tool-registry'));
      assertEqual(ALL_BUILTIN_TOOL_NAMES.size, 17, 'Should have 17 built-in tools');
      assert(ALL_BUILTIN_TOOL_NAMES.has('glob'), 'Should have glob (not glob_tool)');
      assert(ALL_BUILTIN_TOOL_NAMES.has('google_web_search'), 'Should have google_web_search (not web_search)');
      assert(ALL_BUILTIN_TOOL_NAMES.has('grep_search'), 'Should have grep_search');
      assert(!ALL_BUILTIN_TOOL_NAMES.has('glob_tool'), 'Should NOT have glob_tool');
      assert(!ALL_BUILTIN_TOOL_NAMES.has('web_search'), 'Should NOT have web_search');
      assert(!ALL_BUILTIN_TOOL_NAMES.has('spawn_agent'), 'Should NOT have spawn_agent');
    }
  },
  {
    name: 'CFG-07: Tool Registry resolveToolName handles legacy names',
    fn: () => {
      const { resolveToolName } = require(path.join(PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'tool-registry'));
      assertEqual(resolveToolName('glob_tool'), 'glob', 'glob_tool should resolve to glob');
      assertEqual(resolveToolName('web_search'), 'google_web_search', 'web_search should resolve to google_web_search');
      assertEqual(resolveToolName('task_write'), 'write_todos', 'task_write should resolve to write_todos');
      assertEqual(resolveToolName('search_file_content'), 'grep_search', 'search_file_content should resolve to grep_search');
      assertEqual(resolveToolName('glob'), 'glob', 'glob should stay glob');
    }
  },
  {
    name: 'CFG-08: Agent frontmatter uses valid tool names only',
    fn: () => {
      const { isValidToolName } = require(path.join(PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'tool-registry'));
      const agentsDir = path.join(PLUGIN_ROOT, 'agents');
      const agents = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
      const invalidTools = [];
      agents.forEach(agentFile => {
        const content = fs.readFileSync(path.join(agentsDir, agentFile), 'utf-8');
        const match = content.match(/^---\n([\s\S]*?)\n---/);
        if (!match) return;
        const toolsMatch = match[1].match(/tools:\s*\n((?:\s+-\s+.+\n?)*)/);
        if (!toolsMatch) return;
        const tools = toolsMatch[1].split('\n').map(l => l.trim().replace(/^-\s+/, '')).filter(Boolean);
        tools.forEach(tool => {
          if (!isValidToolName(tool)) {
            invalidTools.push(`${agentFile}: ${tool}`);
          }
        });
      });
      assertEqual(invalidTools.length, 0, `Invalid tool names found: ${invalidTools.join(', ')}`);
    }
  },
  {
    name: 'CFG-04~05: PDCA thresholds',
    fn: () => {
      const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
      assertEqual(config.pdca.matchRateThreshold, 90, 'Match rate threshold should be 90');
      assertEqual(config.pdca.maxIterations, 5, 'Max iterations should be 5');
    }
  }
];

module.exports = { tests };
