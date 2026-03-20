const { PLUGIN_ROOT, assert, assertEqual, assertContains } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const BEFORE_TOOL_PATH = path.join(PLUGIN_ROOT, 'hooks', 'scripts', 'before-tool.js');
const AFTER_TOOL_PATH = path.join(PLUGIN_ROOT, 'hooks', 'scripts', 'after-tool.js');

const tests = [
  // ═══ TC-90: before-tool.js + after-tool.js v2.0.0 Security (25 tests) ═══

  // --- before-tool.js tests (13 tests) ---

  {
    name: 'BT-01: before-tool.js exists',
    fn: () => {
      assert(fs.existsSync(BEFORE_TOOL_PATH), 'before-tool.js should exist');
    }
  },
  {
    name: 'BT-02: No claudeToolName variable in before-tool.js',
    fn: () => {
      const src = fs.readFileSync(BEFORE_TOOL_PATH, 'utf-8');
      assert(!src.includes('claudeToolName'), 'Should not contain claudeToolName (CC legacy removed)');
    }
  },
  {
    name: 'BT-03: No CLAUDE_TO_GEMINI_MAP import in before-tool.js',
    fn: () => {
      const src = fs.readFileSync(BEFORE_TOOL_PATH, 'utf-8');
      assert(!src.includes('CLAUDE_TO_GEMINI_MAP'), 'Should not import CLAUDE_TO_GEMINI_MAP (CC legacy removed)');
    }
  },
  {
    name: 'BT-04: writeSecurityAuditLog function exists',
    fn: () => {
      const src = fs.readFileSync(BEFORE_TOOL_PATH, 'utf-8');
      assertContains(src, 'function writeSecurityAuditLog', 'Should define writeSecurityAuditLog function');
    }
  },
  {
    name: 'BT-05: Condition uses write_file (Gemini tool name)',
    fn: () => {
      const src = fs.readFileSync(BEFORE_TOOL_PATH, 'utf-8');
      assertContains(src, "'write_file'", 'Should use Gemini tool name write_file');
    }
  },
  {
    name: 'BT-06: Condition uses replace (Gemini tool name)',
    fn: () => {
      const src = fs.readFileSync(BEFORE_TOOL_PATH, 'utf-8');
      assertContains(src, "'replace'", 'Should use Gemini tool name replace');
    }
  },
  {
    name: 'BT-07: Condition uses run_shell_command (Gemini tool name)',
    fn: () => {
      const src = fs.readFileSync(BEFORE_TOOL_PATH, 'utf-8');
      assertContains(src, "'run_shell_command'", 'Should use Gemini tool name run_shell_command');
    }
  },
  {
    name: 'BT-08: No CC Write tool name in conditions',
    fn: () => {
      const src = fs.readFileSync(BEFORE_TOOL_PATH, 'utf-8');
      // Check that 'Write' is not used as a tool name in includes() checks
      // It may appear in function names like handleWriteEdit, so check specifically for tool name usage
      const toolNameChecks = src.match(/includes\(\s*'Write'\s*\)/g);
      assert(!toolNameChecks, 'Should not check for CC tool name Write in includes()');
    }
  },
  {
    name: 'BT-09: No CC Edit tool name in conditions',
    fn: () => {
      const src = fs.readFileSync(BEFORE_TOOL_PATH, 'utf-8');
      const toolNameChecks = src.match(/includes\(\s*'Edit'\s*\)/g);
      assert(!toolNameChecks, 'Should not check for CC tool name Edit in includes()');
    }
  },
  {
    name: 'BT-10: No CC Bash tool name in conditions',
    fn: () => {
      const src = fs.readFileSync(BEFORE_TOOL_PATH, 'utf-8');
      const toolNameChecks = src.match(/includes\(\s*'Bash'\s*\)/g);
      assert(!toolNameChecks, 'Should not check for CC tool name Bash in includes()');
    }
  },
  {
    name: 'BT-11: Has .gemini/security-audit.log reference',
    fn: () => {
      const src = fs.readFileSync(BEFORE_TOOL_PATH, 'utf-8');
      assertContains(src, 'security-audit.log', 'Should reference security-audit.log');
    }
  },
  {
    name: 'BT-12: writeSecurityAuditLog writes to .gemini directory',
    fn: () => {
      const src = fs.readFileSync(BEFORE_TOOL_PATH, 'utf-8');
      assertContains(src, ".gemini", 'Should write audit log to .gemini directory');
    }
  },
  {
    name: 'BT-13: before-tool.js references lib/gemini (not lib/adapters)',
    fn: () => {
      const src = fs.readFileSync(BEFORE_TOOL_PATH, 'utf-8');
      assertContains(src, "'gemini'", 'Should reference gemini module path');
      assert(!src.includes("lib/adapters"), 'Should not reference legacy lib/adapters path');
    }
  },

  // --- after-tool.js tests (12 tests) ---

  {
    name: 'AT-01: after-tool.js exists',
    fn: () => {
      assert(fs.existsSync(AFTER_TOOL_PATH), 'after-tool.js should exist');
    }
  },
  {
    name: 'AT-02: No claudeToolName variable in after-tool.js',
    fn: () => {
      const src = fs.readFileSync(AFTER_TOOL_PATH, 'utf-8');
      assert(!src.includes('claudeToolName'), 'Should not contain claudeToolName (CC legacy removed)');
    }
  },
  {
    name: 'AT-03: No CLAUDE_TO_GEMINI_MAP import in after-tool.js',
    fn: () => {
      const src = fs.readFileSync(AFTER_TOOL_PATH, 'utf-8');
      assert(!src.includes('CLAUDE_TO_GEMINI_MAP'), 'Should not import CLAUDE_TO_GEMINI_MAP (CC legacy removed)');
    }
  },
  {
    name: 'AT-04: Conditions use write_file (Gemini tool name)',
    fn: () => {
      const src = fs.readFileSync(AFTER_TOOL_PATH, 'utf-8');
      assertContains(src, "'write_file'", 'Should use Gemini tool name write_file');
    }
  },
  {
    name: 'AT-05: Conditions use replace (Gemini tool name)',
    fn: () => {
      const src = fs.readFileSync(AFTER_TOOL_PATH, 'utf-8');
      assertContains(src, "'replace'", 'Should use Gemini tool name replace');
    }
  },
  {
    name: 'AT-06: Conditions use activate_skill (Gemini tool name)',
    fn: () => {
      const src = fs.readFileSync(AFTER_TOOL_PATH, 'utf-8');
      assertContains(src, "'activate_skill'", 'Should use Gemini tool name activate_skill');
    }
  },
  {
    name: 'AT-07: No CC Write tool name in conditions',
    fn: () => {
      const src = fs.readFileSync(AFTER_TOOL_PATH, 'utf-8');
      const toolNameChecks = src.match(/===\s*'Write'/g);
      assert(!toolNameChecks, 'Should not check for CC tool name Write');
    }
  },
  {
    name: 'AT-08: No CC Edit tool name in conditions',
    fn: () => {
      const src = fs.readFileSync(AFTER_TOOL_PATH, 'utf-8');
      const toolNameChecks = src.match(/===\s*'Edit'/g);
      assert(!toolNameChecks, 'Should not check for CC tool name Edit');
    }
  },
  {
    name: 'AT-09: No CC Skill tool name in conditions',
    fn: () => {
      const src = fs.readFileSync(AFTER_TOOL_PATH, 'utf-8');
      // Check that 'Skill' is not used as a tool comparison (may appear in function names)
      const toolNameChecks = src.match(/===\s*'Skill'/g);
      assert(!toolNameChecks, 'Should not check for CC tool name Skill');
    }
  },
  {
    name: 'AT-10: after-tool.js references lib/gemini (not lib/adapters)',
    fn: () => {
      const src = fs.readFileSync(AFTER_TOOL_PATH, 'utf-8');
      assertContains(src, "'gemini'", 'Should reference gemini module path');
      assert(!src.includes("lib/adapters"), 'Should not reference legacy lib/adapters path');
    }
  },
  {
    name: 'AT-11: processHook function exists in after-tool.js',
    fn: () => {
      const src = fs.readFileSync(AFTER_TOOL_PATH, 'utf-8');
      assertContains(src, 'function processHook', 'Should define processHook function');
    }
  },
  {
    name: 'AT-12: handler function exported in after-tool.js',
    fn: () => {
      const src = fs.readFileSync(AFTER_TOOL_PATH, 'utf-8');
      assertContains(src, 'module.exports', 'Should have module.exports');
      assertContains(src, 'handler', 'Should export handler function');
    }
  },
];

module.exports = { tests };
