const { PLUGIN_ROOT, assert, assertEqual, assertContains, getPdcaStatus, withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const tests = [
  // 21 test cases for lib/gemini/tools.js
  {
    name: 'TOOL-01: BUILTIN_TOOLS has 23 entries',
    fn: () => {
      const { BUILTIN_TOOLS } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'tools'));
      const keys = Object.keys(BUILTIN_TOOLS);
      assertEqual(keys.length, 23, 'BUILTIN_TOOLS should have 23 entries');
    }
  },
  {
    name: 'TOOL-02: ALL_BUILTIN_TOOL_NAMES is frozen Set of size 23',
    fn: () => {
      const { ALL_BUILTIN_TOOL_NAMES } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'tools'));
      assert(ALL_BUILTIN_TOOL_NAMES instanceof Set, 'Should be a Set');
      assertEqual(ALL_BUILTIN_TOOL_NAMES.size, 23, 'Set should have 23 entries');
      assert(Object.isFrozen(ALL_BUILTIN_TOOL_NAMES), 'Set should be frozen');
    }
  },
  {
    name: 'TOOL-03: CLAUDE_TO_GEMINI_MAP NOT exported',
    fn: () => {
      const tools = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'tools'));
      assertEqual(tools.CLAUDE_TO_GEMINI_MAP, undefined, 'CLAUDE_TO_GEMINI_MAP should not be exported');
    }
  },
  {
    name: 'TOOL-04: FORWARD_ALIASES NOT exported',
    fn: () => {
      const tools = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'tools'));
      assertEqual(tools.FORWARD_ALIASES, undefined, 'FORWARD_ALIASES should not be exported');
    }
  },
  {
    name: 'TOOL-05: BKIT_LEGACY_NAMES NOT exported',
    fn: () => {
      const tools = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'tools'));
      assertEqual(tools.BKIT_LEGACY_NAMES, undefined, 'BKIT_LEGACY_NAMES should not be exported');
    }
  },
  {
    name: 'TOOL-06: LEGACY_ALIASES has search_file_content -> grep_search',
    fn: () => {
      const { LEGACY_ALIASES } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'tools'));
      assertEqual(LEGACY_ALIASES['search_file_content'], 'grep_search', 'search_file_content should map to grep_search');
    }
  },
  {
    name: 'TOOL-07: TOOL_ANNOTATIONS has entries for all 23 tools',
    fn: () => {
      const { TOOL_ANNOTATIONS, BUILTIN_TOOLS } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'tools'));
      const annotationKeys = Object.keys(TOOL_ANNOTATIONS);
      assertEqual(annotationKeys.length, 23, 'TOOL_ANNOTATIONS should have 23 entries');
      const allToolValues = Object.values(BUILTIN_TOOLS);
      for (const toolName of allToolValues) {
        assert(toolName in TOOL_ANNOTATIONS, `TOOL_ANNOTATIONS should have entry for ${toolName}`);
      }
    }
  },
  {
    name: 'TOOL-08: resolveToolName returns canonical for known tool',
    fn: () => {
      const { resolveToolName } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'tools'));
      assertEqual(resolveToolName('read_file'), 'read_file', 'Known tool should return itself');
    }
  },
  {
    name: 'TOOL-09: resolveToolName resolves legacy alias',
    fn: () => {
      const { resolveToolName } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'tools'));
      assertEqual(resolveToolName('search_file_content'), 'grep_search', 'Legacy alias should resolve to grep_search');
    }
  },
  {
    name: 'TOOL-10: resolveToolName returns unknown name as-is',
    fn: () => {
      const { resolveToolName } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'tools'));
      assertEqual(resolveToolName('nonexistent_tool'), 'nonexistent_tool', 'Unknown tool should return as-is');
    }
  },
  {
    name: 'TOOL-11: isValidToolName returns true for valid tool',
    fn: () => {
      const { isValidToolName } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'tools'));
      assertEqual(isValidToolName('read_file'), true, 'read_file should be valid');
      assertEqual(isValidToolName('write_file'), true, 'write_file should be valid');
      assertEqual(isValidToolName('glob'), true, 'glob should be valid');
    }
  },
  {
    name: 'TOOL-12: isValidToolName returns false for invalid tool',
    fn: () => {
      const { isValidToolName } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'tools'));
      assertEqual(isValidToolName('fake_tool'), false, 'fake_tool should be invalid');
      assertEqual(isValidToolName('search_file_content'), false, 'Legacy alias should be invalid as direct name');
    }
  },
  {
    name: 'TOOL-13: isReadOnlyTool true for read_file',
    fn: () => {
      const { isReadOnlyTool } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'tools'));
      assertEqual(isReadOnlyTool('read_file'), true, 'read_file should be read-only');
    }
  },
  {
    name: 'TOOL-14: isReadOnlyTool false for write_file',
    fn: () => {
      const { isReadOnlyTool } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'tools'));
      assertEqual(isReadOnlyTool('write_file'), false, 'write_file should not be read-only');
    }
  },
  {
    name: 'TOOL-15: getReadOnlyTools returns array',
    fn: () => {
      const { getReadOnlyTools } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'tools'));
      const result = getReadOnlyTools();
      assert(Array.isArray(result), 'Should return array');
      assert(result.length > 0, 'Should have entries');
      assert(result.includes('read_file'), 'Should include read_file');
    }
  },
  {
    name: 'TOOL-16: getStrictReadOnlyTools returns subset of getReadOnlyTools',
    fn: () => {
      const { getStrictReadOnlyTools, getReadOnlyTools } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'tools'));
      const strict = getStrictReadOnlyTools();
      const readOnly = getReadOnlyTools();
      assert(Array.isArray(strict), 'Should return array');
      assert(strict.length > 0, 'Should have entries');
      assert(strict.length <= readOnly.length, 'Strict set should be smaller or equal to read-only set');
    }
  },
  {
    name: 'TOOL-17: TOOL_CATEGORIES has FILE_MANAGEMENT',
    fn: () => {
      const { TOOL_CATEGORIES } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'tools'));
      assert(Array.isArray(TOOL_CATEGORIES.FILE_MANAGEMENT), 'FILE_MANAGEMENT should be array');
      assert(TOOL_CATEGORIES.FILE_MANAGEMENT.length > 0, 'FILE_MANAGEMENT should have entries');
    }
  },
  {
    name: 'TOOL-18: TOOL_CATEGORIES has EXECUTION, INFORMATION, AGENT_COORDINATION',
    fn: () => {
      const { TOOL_CATEGORIES } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'tools'));
      assert(Array.isArray(TOOL_CATEGORIES.EXECUTION), 'EXECUTION should be array');
      assert(Array.isArray(TOOL_CATEGORIES.INFORMATION), 'INFORMATION should be array');
      assert(Array.isArray(TOOL_CATEGORIES.AGENT_COORDINATION), 'AGENT_COORDINATION should be array');
    }
  },
  {
    name: 'TOOL-19: TOOL_PARAM_CHANGES has read_file, replace, grep_search',
    fn: () => {
      const { TOOL_PARAM_CHANGES } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'tools'));
      assert('read_file' in TOOL_PARAM_CHANGES, 'Should have read_file');
      assert('replace' in TOOL_PARAM_CHANGES, 'Should have replace');
      assert('grep_search' in TOOL_PARAM_CHANGES, 'Should have grep_search');
    }
  },
  {
    name: 'TOOL-20: getAllTools returns 23 items',
    fn: () => {
      const { getAllTools } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'tools'));
      const result = getAllTools();
      assert(Array.isArray(result), 'Should return array');
      assertEqual(result.length, 23, 'Should have 23 tools');
    }
  },
  {
    name: 'TOOL-21: BUILTIN_TOOLS is frozen',
    fn: () => {
      const { BUILTIN_TOOLS } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'tools'));
      assert(Object.isFrozen(BUILTIN_TOOLS), 'BUILTIN_TOOLS should be frozen');
    }
  }
];

module.exports = { tests };
