// TC-25: Tool Registry v1.5.8 Unit Tests (20 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertContains, assertExists, assertType, assertHasKey } = require('../test-utils');
const path = require('path');

const tr = require(path.join(PLUGIN_ROOT, 'lib/adapters/gemini/tool-registry'));

const tests = [
  {
    name: 'TC25-01: TOOL_PARAM_CHANGES 3개 키 존재',
    fn: () => {
      const keys = Object.keys(tr.TOOL_PARAM_CHANGES);
      assert(keys.includes('read_file'), 'Should have read_file');
      assert(keys.includes('replace'), 'Should have replace');
      assert(keys.includes('grep_search'), 'Should have grep_search');
    }
  },
  {
    name: 'TC25-02: getToolParamChanges(read_file) 구조',
    fn: () => {
      const changes = tr.getToolParamChanges('read_file');
      assert(changes !== null && changes !== undefined, 'Should return changes');
    }
  },
  {
    name: 'TC25-03: getToolParamChanges 미등록 도구 → null',
    fn: () => {
      const changes = tr.getToolParamChanges('nonexistent_tool');
      assertEqual(changes, null, 'Should return null for unknown tool');
    }
  },
  {
    name: 'TC25-04: BUILTIN_TOOLS 23개 존재',
    fn: () => {
      assert(Object.keys(tr.BUILTIN_TOOLS).length >= 23, `Should have >=23 tools, found ${Object.keys(tr.BUILTIN_TOOLS).length}`);
    }
  },
  {
    name: 'TC25-05: ALL_BUILTIN_TOOL_NAMES Set 타입',
    fn: () => {
      assert(tr.ALL_BUILTIN_TOOL_NAMES instanceof Set, 'Should be Set');
      assert(tr.ALL_BUILTIN_TOOL_NAMES.size >= 23, 'Should have >=23 names');
    }
  },
  {
    name: 'TC25-06: TOOL_CATEGORIES 존재 및 구조',
    fn: () => {
      assert(tr.TOOL_CATEGORIES !== undefined, 'Should export TOOL_CATEGORIES');
      assertType(tr.TOOL_CATEGORIES, 'object', 'Should be object');
    }
  },
  {
    name: 'TC25-07: CLAUDE_TO_GEMINI_MAP 매핑 검증',
    fn: () => {
      assert(tr.CLAUDE_TO_GEMINI_MAP !== undefined, 'Should export CLAUDE_TO_GEMINI_MAP');
      assertType(tr.CLAUDE_TO_GEMINI_MAP, 'object', 'Should be object');
    }
  },
  {
    name: 'TC25-08: LEGACY_ALIASES 역호환 매핑',
    fn: () => {
      assert(tr.LEGACY_ALIASES !== undefined, 'Should export LEGACY_ALIASES');
    }
  },
  {
    name: 'TC25-09: FORWARD_ALIASES 정방향 매핑',
    fn: () => {
      assert(tr.FORWARD_ALIASES !== undefined, 'Should export FORWARD_ALIASES');
    }
  },
  {
    name: 'TC25-10: TOOL_ANNOTATIONS 도구 주석',
    fn: () => {
      assert(tr.TOOL_ANNOTATIONS !== undefined, 'Should export TOOL_ANNOTATIONS');
      assertType(tr.TOOL_ANNOTATIONS, 'object', 'Should be object');
    }
  },
  {
    name: 'TC25-11: resolveToolName 정상 해석',
    fn: () => {
      const resolved = tr.resolveToolName('read_file');
      assertEqual(resolved, 'read_file', 'Direct name should resolve to itself');
    }
  },
  {
    name: 'TC25-12: resolveToolName 레거시 별칭',
    fn: () => {
      if (tr.LEGACY_ALIASES && Object.keys(tr.LEGACY_ALIASES).length > 0) {
        const legacyName = Object.keys(tr.LEGACY_ALIASES)[0];
        const resolved = tr.resolveToolName(legacyName);
        assert(resolved !== undefined, `Legacy alias ${legacyName} should resolve`);
      }
    }
  },
  {
    name: 'TC25-13: isReadOnlyTool read_file → true',
    fn: () => {
      const result = tr.isReadOnlyTool('read_file');
      assertEqual(result, true, 'read_file should be read-only');
    }
  },
  {
    name: 'TC25-14: isReadOnlyTool write_file → false',
    fn: () => {
      const result = tr.isReadOnlyTool('write_file');
      assertEqual(result, false, 'write_file should not be read-only');
    }
  },
  {
    name: 'TC25-15: getVersionedParamName 반환 타입',
    fn: () => {
      const result = tr.getVersionedParamName('read_file', 'file_path', '0.28.0');
      assertType(result, 'string', 'Should return string');
    }
  },
  {
    name: 'TC25-16: getToolAnnotations 반환 구조',
    fn: () => {
      const annotations = tr.getToolAnnotations('read_file');
      if (annotations) {
        assertType(annotations, 'object', 'Should be object');
      }
    }
  },
  {
    name: 'TC25-17: getAllTools 전체 도구 목록',
    fn: () => {
      const tools = tr.getAllTools();
      assert(Array.isArray(tools), 'Should return array');
      assert(tools.length >= 23, `Should have >=23 tools, found ${tools.length}`);
    }
  },
  {
    name: 'TC25-18: getReadOnlyTools 읽기전용 목록',
    fn: () => {
      const readOnly = tr.getReadOnlyTools();
      assert(Array.isArray(readOnly), 'Should return array');
      assert(readOnly.includes('read_file'), 'Should include read_file');
    }
  },
  {
    name: 'TC25-19: isValidToolName 유효 이름',
    fn: () => {
      assertEqual(tr.isValidToolName('read_file'), true, 'read_file should be valid');
    }
  },
  {
    name: 'TC25-20: isValidToolName 무효 이름',
    fn: () => {
      assertEqual(tr.isValidToolName('completely_fake_tool'), false, 'Fake tool should be invalid');
    }
  }
];

module.exports = { tests };
