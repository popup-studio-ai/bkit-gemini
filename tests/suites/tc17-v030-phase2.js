// tests/suites/tc17-v030-phase2.js
// Phase 2 - P1 Integration Tests for Gemini CLI v0.30.0
// bkit-gemini v1.5.5
// Task #14 - QA Strategist: TOML schema, AfterTool integrity, tool registry

const {
  PLUGIN_ROOT, TEST_PROJECT_DIR,
  createTestProject, cleanupTestProject,
  executeHook, assert, assertEqual, assertContains
} = require('../test-utils');
const { PDCA_STATUS_FIXTURE } = require('../fixtures');
const path = require('path');
const fs = require('fs');

const tests = [
  // ─────────────────────────────────────────────────────────────────
  // P2-02 through P2-05: TOML Schema Validation
  // Verifies generated TOML conforms to Policy Engine spec
  // ─────────────────────────────────────────────────────────────────
  {
    name: 'P2-02: TOML output uses [[rule]] array-of-tables (not single [rule])',
    fn: () => {
      const { convertToToml } = require(path.join(
        PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'policy-migrator'
      ));
      const permissions = { 'write_file': 'allow', 'run_shell_command(rm -rf*)': 'deny' };
      const toml = convertToToml(permissions);
      // Policy Engine requires [[rule]] for array-of-tables
      assert(toml.includes('[[rule]]'),
        'Policy Engine spec requires [[rule]] array-of-tables syntax');
      // Ensure we are not accidentally generating single-table [rule]
      // by checking the specific pattern: a [rule] not preceded by [
      const singleTablePattern = /(?<!\[)\[rule\](?!\])/;
      assert(!singleTablePattern.test(toml),
        'Must not generate single-table [rule] syntax - only [[rule]] is valid');
    }
  },

  {
    name: 'P2-03: All TOML [[rule]] blocks contain required toolName field',
    fn: () => {
      const { convertToToml } = require(path.join(
        PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'policy-migrator'
      ));
      const permissions = {
        'write_file': 'allow',
        'read_file': 'allow',
        'run_shell_command(rm -rf*)': 'deny'
      };
      const toml = convertToToml(permissions);
      // Split by [[rule]] to get individual rule blocks
      const ruleBlocks = toml.split('[[rule]]').slice(1);
      assert(ruleBlocks.length >= 3, `Expected 3 rule blocks, found ${ruleBlocks.length}`);
      ruleBlocks.forEach((block, i) => {
        assert(block.includes('toolName ='),
          `Rule block ${i + 1} must have toolName field`);
      });
    }
  },

  {
    name: 'P2-04: TOML decision field only contains valid Policy Engine values',
    fn: () => {
      const { convertToToml } = require(path.join(
        PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'policy-migrator'
      ));
      const permissions = {
        'write_file': 'allow',
        'run_shell_command(rm -rf*)': 'deny',
        'run_shell_command(rm -r*)': 'ask',
      };
      const toml = convertToToml(permissions);
      const validDecisions = ['"allow"', '"deny"', '"ask_user"'];
      const decisionMatches = toml.match(/decision = "[^"]+"/g) || [];
      assert(decisionMatches.length >= 3,
        `Expected at least 3 decision fields, found ${decisionMatches.length}`);
      decisionMatches.forEach(match => {
        const found = validDecisions.some(v => match.includes(v));
        assert(found, `Invalid decision value: ${match}. Valid values: allow, deny, ask_user`);
      });
      // Specifically verify "ask" is not present (must be "ask_user")
      assert(!toml.includes('decision = "ask"'),
        '"ask" bkit level must be converted to "ask_user" for Policy Engine compatibility');
    }
  },

  {
    name: 'P2-05: TOML priority field is a bare integer (not a quoted string)',
    fn: () => {
      const { convertToToml } = require(path.join(
        PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'policy-migrator'
      ));
      const permissions = { 'write_file': 'allow', 'run_shell_command(rm -rf*)': 'deny' };
      const toml = convertToToml(permissions);
      // priority must be TOML integer: priority = 100 (not priority = "100")
      const priorityMatches = toml.match(/priority = .+/g) || [];
      assert(priorityMatches.length >= 2,
        `Expected at least 2 priority fields, found ${priorityMatches.length}`);
      priorityMatches.forEach(match => {
        assert(/priority = \d+/.test(match.trim()),
          `Priority must be a bare integer in TOML: "${match.trim()}"`);
        assert(!/priority = "\d+"/.test(match),
          `Priority must NOT be a quoted string in TOML: "${match.trim()}"`);
      });
    }
  },

  // ─────────────────────────────────────────────────────────────────
  // P2-06 through P2-08: AfterTool Hook Data Integrity
  // Analysis: R-05 Tool Output Masking may change field presence
  // ─────────────────────────────────────────────────────────────────
  {
    name: 'P2-06: AfterTool hook processes tool_name field and exits 0',
    setup: () => createTestProject({ 'docs/.pdca-status.json': PDCA_STATUS_FIXTURE }),
    fn: () => {
      const result = executeHook('after-tool.js', {
        tool_name: 'write_file',
        tool_input: { file_path: 'src/test.js', content: '// test' },
        tool_response: { output: 'success' }
      });
      assert(result.success || result.exitCode === 0,
        'AfterTool hook must exit 0 when tool_name, tool_input, and tool_response are provided');
    },
    teardown: cleanupTestProject
  },

  {
    name: 'P2-07: AfterTool hook handles missing tool_input gracefully (Output Masking)',
    setup: () => createTestProject({}),
    fn: () => {
      // Analysis R-05: Tool Output Masking in v0.30.0 may omit tool_input from hook data
      // The hook must not crash when tool_input is missing
      const result = executeHook('after-tool.js', {
        tool_name: 'write_file',
        tool_response: { output: 'success' }
        // tool_input intentionally omitted to simulate Output Masking behavior
      });
      assert(result.success || result.exitCode === 0,
        'AfterTool hook must not crash when tool_input is missing (v0.30.0 Output Masking)');
    },
    teardown: cleanupTestProject
  },

  {
    name: 'P2-08: AfterTool hook updates PDCA tracking on src file write',
    setup: () => {
      const status = JSON.parse(JSON.stringify(PDCA_STATUS_FIXTURE));
      status.features['test-feature'].phase = 'design';
      createTestProject({ 'docs/.pdca-status.json': status });
    },
    fn: () => {
      executeHook('after-tool.js', {
        tool_name: 'write_file',
        tool_input: { file_path: 'src/app.js', content: '// implementation' }
      });
      const statusPath = path.join(TEST_PROJECT_DIR, 'docs', '.pdca-status.json');
      if (fs.existsSync(statusPath)) {
        const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
        // Phase transition from design -> do should have occurred
        assertEqual(
          status.features['test-feature']?.phase, 'do',
          'PDCA tracking must transition from design to do after writing to src/'
        );
      }
      // If status file was not updated, the hook must at least have exited cleanly
    },
    teardown: cleanupTestProject
  },

  // ─────────────────────────────────────────────────────────────────
  // P2-11: excludeTools in gemini-extension.json
  // Analysis recommendation: add as second defense layer
  // ─────────────────────────────────────────────────────────────────
  {
    name: 'P2-11: gemini-extension.json has excludeTools field for defense-in-depth',
    fn: () => {
      const ext = JSON.parse(fs.readFileSync(
        path.join(PLUGIN_ROOT, 'gemini-extension.json'), 'utf-8'
      ));
      // Analysis recommendation (7.2): add excludeTools to gemini-extension.json
      // as a secondary defense layer alongside Policy Engine
      assert(
        Array.isArray(ext.excludeTools),
        'gemini-extension.json must have excludeTools array (defense-in-depth per analysis 7.2)'
      );
    }
  },

  // ─────────────────────────────────────────────────────────────────
  // P2-12: AskUser Schema Compatibility
  // Analysis BC-02: question type field now required in v0.30.0
  // ─────────────────────────────────────────────────────────────────
  {
    name: 'P2-12: before-tool-selection.js handles ask_user in tool list without crash',
    setup: () => createTestProject({}),
    fn: () => {
      // BC-02: ask_user schema change - question type field now required
      // Verify hook does not crash when ask_user appears in tool list
      const result = executeHook('before-tool-selection.js', {
        tools: ['write_file', 'read_file', 'ask_user']
      });
      assert(result.success || result.exitCode === 0,
        'before-tool-selection.js must handle ask_user in tool list (BC-02 schema change)');
    },
    teardown: cleanupTestProject
  },

  // ─────────────────────────────────────────────────────────────────
  // P2-13 through P2-14: Tool Registry Forward Aliases
  // Analysis: C-02 and R-03 - 5 FORWARD_ALIASES without validation
  // ─────────────────────────────────────────────────────────────────
  {
    name: 'P2-13: tool-registry resolveToolName handles all 5 FORWARD_ALIASES',
    fn: () => {
      const { resolveToolName } = require(path.join(
        PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'tool-registry'
      ));
      // Analysis BC-04: proposed future tool renames that FORWARD_ALIASES must handle
      // if v0.31.0 activates them
      const aliases = [
        { from: 'edit_file', to: 'replace' },
        { from: 'find_files', to: 'glob' },
        { from: 'find_in_file', to: 'grep_search' },
        { from: 'web_search', to: 'google_web_search' },
        { from: 'read_files', to: 'read_many_files' },
      ];
      aliases.forEach(({ from, to }) => {
        const resolved = resolveToolName(from);
        assertEqual(resolved, to, `FORWARD_ALIAS: ${from} must resolve to ${to}`);
      });
    }
  },

  {
    name: 'P2-14: tool-registry FORWARD_ALIASES has exactly 5 entries (per analysis R-03)',
    fn: () => {
      const toolRegistryPath = path.join(
        PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'tool-registry.js'
      );
      const content = fs.readFileSync(toolRegistryPath, 'utf-8');
      // Count FORWARD_ALIASES entries by finding the object literal
      const match = content.match(/FORWARD_ALIASES\s*=\s*\{([^}]+)\}/s);
      if (match) {
        const entries = match[1]
          .split('\n')
          .map(l => l.trim())
          .filter(l => l.includes(':') && !l.startsWith('//'));
        assertEqual(entries.length, 5,
          'FORWARD_ALIASES must have exactly 5 entries per analysis R-03 and BC-04 mapping');
      } else {
        // If FORWARD_ALIASES is exported differently, verify via resolveToolName behavior
        const { resolveToolName } = require(path.join(
          PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'tool-registry'
        ));
        // At minimum verify the 5 known aliases work
        assert(resolveToolName('edit_file') === 'replace', 'edit_file alias must exist');
        assert(resolveToolName('find_files') === 'glob', 'find_files alias must exist');
        assert(resolveToolName('find_in_file') === 'grep_search', 'find_in_file alias must exist');
        assert(resolveToolName('web_search') === 'google_web_search', 'web_search alias must exist');
        assert(resolveToolName('read_files') === 'read_many_files', 'read_files alias must exist');
      }
    }
  }
];

module.exports = { tests };
