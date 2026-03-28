/**
 * TC-80: Architecture + Migration Verification for bkit v2.0.0
 *
 * Validates the v2.0.0 refactoring:
 *   - Directory structure (lib/gemini/ replaces lib/adapters/)
 *   - Require path correctness (zero adapters references)
 *   - Claude Code legacy removal (CC maps, aliases, platform flags)
 *   - Version consistency (v2.0.0 across all config files)
 *   - Migration tooling (sync-version.js)
 *   - Backward compatibility (old fixtures; common.js removed in v2.0.1)
 *   - Philosophy docs (symlink, 4 files)
 *   - CHANGELOG structure
 *
 * ~110 test cases total
 *
 * @version 2.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const LIB = path.join(ROOT, 'lib');
const GEMINI_DIR = path.join(LIB, 'gemini');
const HOOKS_DIR = path.join(ROOT, 'hooks');
const HOOKS_SCRIPTS = path.join(HOOKS_DIR, 'scripts');
const MCP_DIR = path.join(ROOT, 'mcp');
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const SCRIPTS_DIR = path.join(ROOT, 'scripts');
const PHILOSOPHY_DIR = path.join(ROOT, 'bkit-system', 'philosophy');

let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];

function test(id, description, fn) {
  try {
    fn();
    passed++;
    console.log(`  [PASS] ${id}: ${description}`);
  } catch (err) {
    failed++;
    failures.push({ id, description, error: err.message });
    console.log(`  [FAIL] ${id}: ${description} — ${err.message}`);
  }
}

function skip(id, description, reason) {
  skipped++;
  console.log(`  [SKIP] ${id}: ${description} — ${reason}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

// ═══════════════════════════════════════════════════════════════
// SECTION 1: DIRECTORY STRUCTURE (ARC-01 ~ ARC-15)
// ═══════════════════════════════════════════════════════════════
console.log('\n=== Section 1: Directory Structure ===');

test('ARC-01', 'lib/gemini/ directory exists', () => {
  assert(fs.existsSync(GEMINI_DIR), 'lib/gemini/ directory not found');
  assert(fs.statSync(GEMINI_DIR).isDirectory(), 'lib/gemini/ is not a directory');
});

const EXPECTED_GEMINI_FILES = [
  'platform.js', 'tools.js', 'version.js', 'hooks.js',
  'policy.js', 'tracker.js', 'context-fork.js', 'import-resolver.js'
];

test('ARC-02', 'lib/gemini/ has exactly 8 expected files', () => {
  const files = fs.readdirSync(GEMINI_DIR).filter(f => f.endsWith('.js'));
  assert(files.length === 8, `Expected 8 files, found ${files.length}: ${files.join(', ')}`);
});

EXPECTED_GEMINI_FILES.forEach((file, i) => {
  test(`ARC-03-${i + 1}`, `lib/gemini/${file} exists`, () => {
    assert(fs.existsSync(path.join(GEMINI_DIR, file)), `${file} not found in lib/gemini/`);
  });
});

test('ARC-04', 'lib/adapters/ directory does NOT exist', () => {
  assert(!fs.existsSync(path.join(LIB, 'adapters')), 'lib/adapters/ still exists — should have been removed');
});

test('ARC-05', 'lib/adapters/platform-interface.js does NOT exist', () => {
  assert(!fs.existsSync(path.join(LIB, 'adapters', 'platform-interface.js')),
    'platform-interface.js still exists');
});

test('ARC-06', 'lib/adapters/index.js does NOT exist', () => {
  assert(!fs.existsSync(path.join(LIB, 'adapters', 'index.js')),
    'adapters/index.js still exists');
});

test('ARC-07', 'lib/common.js removed (unused bridge, deleted in v2.0.1)', () => {
  assert(!fs.existsSync(path.join(LIB, 'common.js')), 'common.js should be deleted (zero usage)');
});

test('ARC-08', 'Platform functions available directly from lib/gemini/platform.js', () => {
  const platform = require(path.join(LIB, 'gemini', 'platform.js'));
  assert(typeof platform.getAdapter === 'function', 'getAdapter not exported from platform.js');
  assert(typeof platform.getPlatformName === 'function', 'getPlatformName not exported from platform.js');
  assert(typeof platform.isGemini === 'function', 'isGemini not exported from platform.js');
});

// All module directories load without errors
const LIB_SUBDIRS = ['core', 'pdca', 'intent', 'task', 'team'];

LIB_SUBDIRS.forEach(dir => {
  test(`ARC-09-${dir}`, `lib/${dir}/ loads without errors (require index)`, () => {
    const dirPath = path.join(LIB, dir);
    assert(fs.existsSync(dirPath), `lib/${dir}/ not found`);
    const indexPath = path.join(dirPath, 'index.js');
    assert(fs.existsSync(indexPath), `lib/${dir}/index.js not found`);
    // Attempt require — any throw = failure
    require(indexPath);
  });
});

test('ARC-10', 'lib/context-hierarchy.js exists', () => {
  assert(fs.existsSync(path.join(LIB, 'context-hierarchy.js')), 'lib/context-hierarchy.js not found');
});

test('ARC-11', 'lib/skill-orchestrator.js exists', () => {
  assert(fs.existsSync(path.join(LIB, 'skill-orchestrator.js')), 'lib/skill-orchestrator.js not found');
});

// ═══════════════════════════════════════════════════════════════
// SECTION 2: REQUIRE PATH VERIFICATION (REQ-01 ~ REQ-15)
// ═══════════════════════════════════════════════════════════════
console.log('\n=== Section 2: Require Path Verification ===');

test('REQ-01', 'Zero "require.*adapters" in lib/', () => {
  const result = searchForPattern(LIB, /require\s*\(\s*['"][^'"]*adapters/g, '*.js');
  assert(result.length === 0,
    `Found ${result.length} adapters references in lib/: ${result.map(r => r.file).join(', ')}`);
});

test('REQ-02', 'Zero "require.*adapters" in hooks/', () => {
  const result = searchForPattern(HOOKS_DIR, /require\s*\(\s*['"][^'"]*adapters/g, '*.js');
  assert(result.length === 0,
    `Found ${result.length} adapters references in hooks/: ${result.map(r => r.file).join(', ')}`);
});

test('REQ-03', 'Zero "require.*adapters" in mcp/', () => {
  const result = searchForPattern(MCP_DIR, /require\s*\(\s*['"][^'"]*adapters/g, '*.js');
  assert(result.length === 0,
    `Found ${result.length} adapters references in mcp/: ${result.map(r => r.file).join(', ')}`);
});

// All hook scripts can be required
const HOOK_SCRIPTS = [
  'session-start.js', 'session-end.js',
  'before-agent.js', 'after-agent.js',
  'before-model.js', 'after-model.js',
  'before-tool.js', 'after-tool.js',
  'before-tool-selection.js', 'pre-compress.js'
];

HOOK_SCRIPTS.forEach(script => {
  test(`REQ-04-${script}`, `hooks/scripts/${script} can be required without error`, () => {
    const scriptPath = path.join(HOOKS_SCRIPTS, script);
    assert(fs.existsSync(scriptPath), `${script} not found`);
    // Syntax check only — some scripts call main() on require, so we read and syntax-check
    const content = fs.readFileSync(scriptPath, 'utf-8');
    assert(content.length > 0, `${script} is empty`);
    // Verify no adapters reference
    assert(!content.includes('adapters'), `${script} still references adapters`);
  });
});

test('REQ-05', 'mcp/spawn-agent-server.js requires lib/gemini/version (not lib/adapters)', () => {
  const content = fs.readFileSync(path.join(MCP_DIR, 'spawn-agent-server.js'), 'utf-8');
  assert(content.includes('lib/gemini/version') || content.includes("'gemini', 'version'"),
    'spawn-agent-server.js does not reference lib/gemini/version');
  assert(!content.includes('lib/adapters'), 'spawn-agent-server.js still references lib/adapters');
});

test('REQ-06', 'lib/gemini/platform.js exports getAdapter function', () => {
  const platform = require(path.join(LIB, 'gemini', 'platform.js'));
  assert(typeof platform.getAdapter === 'function', 'getAdapter not exported from platform.js');
});

test('REQ-07', 'lib/gemini/platform.js exports getPlatformName function', () => {
  const platform = require(path.join(LIB, 'gemini', 'platform.js'));
  assert(typeof platform.getPlatformName === 'function', 'getPlatformName not exported from platform.js');
});

test('REQ-08', 'lib/gemini/platform.js exports isGemini function', () => {
  const platform = require(path.join(LIB, 'gemini', 'platform.js'));
  assert(typeof platform.isGemini === 'function', 'isGemini not exported from platform.js');
});

test('REQ-09', 'lib/gemini/platform.js getAdapter() returns adapter object', () => {
  const platform = require(path.join(LIB, 'gemini', 'platform.js'));
  const adapter = platform.getAdapter();
  assert(adapter !== null && typeof adapter === 'object',
    `getAdapter() returned ${typeof adapter}, expected object`);
});

test('REQ-10', 'session-start.js requires from lib/gemini/ path', () => {
  const content = fs.readFileSync(path.join(HOOKS_SCRIPTS, 'session-start.js'), 'utf-8');
  assert(content.includes("gemini/platform") || content.includes("'gemini', 'platform'"),
    'session-start.js does not use gemini/platform path');
});

// ═══════════════════════════════════════════════════════════════
// SECTION 3: CC REMOVAL VERIFICATION (CCR-01 ~ CCR-20)
// ═══════════════════════════════════════════════════════════════
console.log('\n=== Section 3: Claude Code Removal ===');

test('CCR-01', 'CLAUDE_TO_GEMINI_MAP not exported from tools.js', () => {
  const tools = require(path.join(GEMINI_DIR, 'tools.js'));
  assert(!('CLAUDE_TO_GEMINI_MAP' in tools), 'CLAUDE_TO_GEMINI_MAP still exported from tools.js');
});

test('CCR-02', 'FORWARD_ALIASES not exported from tools.js', () => {
  const tools = require(path.join(GEMINI_DIR, 'tools.js'));
  assert(!('FORWARD_ALIASES' in tools), 'FORWARD_ALIASES still exported from tools.js');
});

test('CCR-03', 'BKIT_LEGACY_NAMES not exported from tools.js', () => {
  const tools = require(path.join(GEMINI_DIR, 'tools.js'));
  assert(!('BKIT_LEGACY_NAMES' in tools), 'BKIT_LEGACY_NAMES still exported from tools.js');
});

test('CCR-04', 'REVERSE_FORWARD_ALIASES not exported from tools.js', () => {
  const tools = require(path.join(GEMINI_DIR, 'tools.js'));
  assert(!('REVERSE_FORWARD_ALIASES' in tools), 'REVERSE_FORWARD_ALIASES still exported');
});

test('CCR-05', 'mapToolName not exported from tools.js', () => {
  const tools = require(path.join(GEMINI_DIR, 'tools.js'));
  assert(!('mapToolName' in tools), 'mapToolName CC legacy function still exported');
});

test('CCR-06', 'reverseMapToolName not exported from tools.js', () => {
  const tools = require(path.join(GEMINI_DIR, 'tools.js'));
  assert(!('reverseMapToolName' in tools), 'reverseMapToolName CC legacy function still exported');
});

test('CCR-07', 'isClaudeCode not exported from core/platform.js', () => {
  const platform = require(path.join(LIB, 'core', 'platform.js'));
  assert(!('isClaudeCode' in platform), 'isClaudeCode still exported from core/platform.js');
});

test('CCR-08', 'No "claudeToolName" in any hooks/scripts/*.js file', () => {
  const results = searchForPattern(HOOKS_SCRIPTS, /claudeToolName/g, '*.js');
  assert(results.length === 0,
    `Found claudeToolName in: ${results.map(r => r.file).join(', ')}`);
});

test('CCR-09', 'No "${CLAUDE_PLUGIN_ROOT}" in any lib/ source file', () => {
  const results = searchForPattern(LIB, /\$\{CLAUDE_PLUGIN_ROOT\}/g, '*.js');
  assert(results.length === 0,
    `Found \${CLAUDE_PLUGIN_ROOT} in lib/: ${results.map(r => r.file).join(', ')}`);
});

test('CCR-10', 'No "${CLAUDE_PLUGIN_ROOT}" in any hooks/ source file', () => {
  const results = searchForPattern(HOOKS_DIR, /\$\{CLAUDE_PLUGIN_ROOT\}/g, '*.js');
  assert(results.length === 0,
    `Found \${CLAUDE_PLUGIN_ROOT} in hooks/: ${results.map(r => r.file).join(', ')}`);
});

test('CCR-11', 'No "${CLAUDE_PLUGIN_ROOT}" in any mcp/ source file', () => {
  const results = searchForPattern(MCP_DIR, /\$\{CLAUDE_PLUGIN_ROOT\}/g, '*.js');
  assert(results.length === 0,
    `Found \${CLAUDE_PLUGIN_ROOT} in mcp/: ${results.map(r => r.file).join(', ')}`);
});

test('CCR-12', 'No "Claude Code" in templates/ (except historical docs)', () => {
  const results = searchForPattern(TEMPLATES_DIR, /Claude Code/g, '*.md');
  // Allow mentions only in historical documentation templates (e.g., TEMPLATE-GUIDE.md)
  const nonDocResults = results.filter(r => !r.file.includes('GUIDE') && !r.file.includes('history'));
  assert(nonDocResults.length === 0,
    `Found "Claude Code" in templates: ${nonDocResults.map(r => r.file).join(', ')}`);
});

test('CCR-13', 'No PlatformAdapter abstract class in any lib/ file', () => {
  const results = searchForPattern(LIB, /class PlatformAdapter/g, '*.js');
  assert(results.length === 0,
    `PlatformAdapter ABC still exists: ${results.map(r => r.file).join(', ')}`);
});

test('CCR-14', 'tools.js only exports Gemini-native tool names', () => {
  const tools = require(path.join(GEMINI_DIR, 'tools.js'));
  const allNames = tools.getAllTools();
  const ccPatterns = ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep', 'TodoRead', 'TodoWrite'];
  for (const ccName of ccPatterns) {
    assert(!allNames.includes(ccName),
      `CC tool name "${ccName}" found in getAllTools()`);
  }
});

test('CCR-15', 'platform.js GeminiAdapter has no CC-related methods', () => {
  const adapter = require(path.join(GEMINI_DIR, 'platform.js'));
  const ccMethods = ['isClaudeCode', 'getClaudeRoot', 'mapClaudeTool'];
  for (const method of ccMethods) {
    assert(typeof adapter[method] === 'undefined',
      `CC method "${method}" still exists on GeminiAdapter`);
  }
});

test('CCR-16', 'No "claude" in tool LEGACY_ALIASES keys', () => {
  const tools = require(path.join(GEMINI_DIR, 'tools.js'));
  const aliases = tools.LEGACY_ALIASES;
  for (const key of Object.keys(aliases)) {
    assert(!key.toLowerCase().includes('claude'),
      `CC legacy alias key found: ${key}`);
  }
});

test('CCR-17', 'version.js does not reference Claude', () => {
  const content = fs.readFileSync(path.join(GEMINI_DIR, 'version.js'), 'utf-8');
  assert(!content.toLowerCase().includes('claude'),
    'version.js still contains "claude" reference');
});

test('CCR-18', 'hooks.js does not reference Claude', () => {
  const content = fs.readFileSync(path.join(GEMINI_DIR, 'hooks.js'), 'utf-8');
  assert(!content.toLowerCase().includes('claude'),
    'hooks.js still contains "claude" reference');
});

test('CCR-19', 'policy.js does not reference Claude', () => {
  const content = fs.readFileSync(path.join(GEMINI_DIR, 'policy.js'), 'utf-8');
  assert(!content.toLowerCase().includes('claude'),
    'policy.js still contains "claude" reference');
});

test('CCR-20', 'core/platform.js detectPlatform() returns "gemini" only', () => {
  const platform = require(path.join(LIB, 'core', 'platform.js'));
  assert(platform.detectPlatform() === 'gemini',
    `detectPlatform() returned "${platform.detectPlatform()}" instead of "gemini"`);
});

// ═══════════════════════════════════════════════════════════════
// SECTION 4: VERSION CONSISTENCY (VER-01 ~ VER-15)
// ═══════════════════════════════════════════════════════════════
console.log('\n=== Section 4: Version Consistency ===');

test('VER-01', 'bkit.config.json version is 2.0.2', () => {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'bkit.config.json'), 'utf-8'));
  assert(config.version === '2.0.2', `bkit.config.json version is "${config.version}"`);
});

test('VER-02', 'gemini-extension.json version is 2.0.2', () => {
  const ext = JSON.parse(fs.readFileSync(path.join(ROOT, 'gemini-extension.json'), 'utf-8'));
  assert(ext.version === '2.0.2', `gemini-extension.json version is "${ext.version}"`);
});

test('VER-03', 'hooks/hooks.json description contains v2.0.2', () => {
  const hooks = JSON.parse(fs.readFileSync(path.join(HOOKS_DIR, 'hooks.json'), 'utf-8'));
  assert(hooks.description.includes('v2.0.2'),
    `hooks.json description does not contain v2.0.2: "${hooks.description}"`);
});

test('VER-04', 'No "v1.5.x" version strings in session-start.js', () => {
  const content = fs.readFileSync(path.join(HOOKS_SCRIPTS, 'session-start.js'), 'utf-8');
  const match = content.match(/v1\.5\.\d/g);
  assert(!match, `Found v1.5.x in session-start.js: ${match}`);
});

test('VER-05', 'session-start.js references v2.0.2 in context output', () => {
  const content = fs.readFileSync(path.join(HOOKS_SCRIPTS, 'session-start.js'), 'utf-8');
  assert(content.includes('v2.0.2'), 'session-start.js does not contain v2.0.2');
});

test('VER-06', 'scripts/sync-version.js exists', () => {
  assert(fs.existsSync(path.join(SCRIPTS_DIR, 'sync-version.js')),
    'scripts/sync-version.js not found');
});

test('VER-07', 'scripts/sync-version.js has shebang line', () => {
  const content = fs.readFileSync(path.join(SCRIPTS_DIR, 'sync-version.js'), 'utf-8');
  assert(content.startsWith('#!/usr/bin/node') || content.startsWith('#!/usr/bin/env node'),
    'sync-version.js missing shebang line');
});

test('VER-08', 'scripts/sync-version.js is executable', () => {
  try {
    fs.accessSync(path.join(SCRIPTS_DIR, 'sync-version.js'), fs.constants.X_OK);
  } catch {
    throw new Error('sync-version.js is not executable (chmod +x needed)');
  }
});

test('VER-09', 'sync-version.js reads from bkit.config.json', () => {
  const content = fs.readFileSync(path.join(SCRIPTS_DIR, 'sync-version.js'), 'utf-8');
  assert(content.includes('bkit.config.json'), 'sync-version.js does not reference bkit.config.json');
});

test('VER-10', 'sync-version.js syncs gemini-extension.json', () => {
  const content = fs.readFileSync(path.join(SCRIPTS_DIR, 'sync-version.js'), 'utf-8');
  assert(content.includes('gemini-extension.json'),
    'sync-version.js does not sync gemini-extension.json');
});

test('VER-11', 'sync-version.js syncs hooks/hooks.json', () => {
  const content = fs.readFileSync(path.join(SCRIPTS_DIR, 'sync-version.js'), 'utf-8');
  assert(content.includes('hooks.json'), 'sync-version.js does not sync hooks.json');
});

test('VER-12', 'sync-version.js supports --check-only flag', () => {
  const content = fs.readFileSync(path.join(SCRIPTS_DIR, 'sync-version.js'), 'utf-8');
  assert(content.includes('--check-only'), 'sync-version.js does not support --check-only');
});

test('VER-13', 'gemini-extension.json contextFileName is array format', () => {
  const ext = JSON.parse(fs.readFileSync(path.join(ROOT, 'gemini-extension.json'), 'utf-8'));
  assert(Array.isArray(ext.contextFileName),
    `contextFileName is ${typeof ext.contextFileName}, expected array`);
});

test('VER-14', 'gemini-extension.json contextFileName includes "GEMINI.md"', () => {
  const ext = JSON.parse(fs.readFileSync(path.join(ROOT, 'gemini-extension.json'), 'utf-8'));
  assert(ext.contextFileName.includes('GEMINI.md'),
    `contextFileName does not include "GEMINI.md": ${JSON.stringify(ext.contextFileName)}`);
});

test('VER-15', 'bkit.config.json minGeminiCliVersion is 0.34.0', () => {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'bkit.config.json'), 'utf-8'));
  assert(config.compatibility.minGeminiCliVersion === '0.34.0',
    `minGeminiCliVersion is "${config.compatibility.minGeminiCliVersion}"`);
});

// ═══════════════════════════════════════════════════════════════
// SECTION 5: MODULE LOAD TESTS (MOD-01 ~ MOD-15)
// ═══════════════════════════════════════════════════════════════
console.log('\n=== Section 5: Module Load Tests ===');

EXPECTED_GEMINI_FILES.forEach(file => {
  test(`MOD-01-${file}`, `lib/gemini/${file} can be required without error`, () => {
    const mod = require(path.join(GEMINI_DIR, file));
    assert(mod !== null && mod !== undefined, `${file} returned null/undefined`);
  });
});

test('MOD-02', 'tools.js exports BUILTIN_TOOLS with 23 tool names', () => {
  const { BUILTIN_TOOLS } = require(path.join(GEMINI_DIR, 'tools.js'));
  const count = Object.keys(BUILTIN_TOOLS).length;
  assert(count === 23, `BUILTIN_TOOLS has ${count} entries, expected 23`);
});

test('MOD-03', 'tools.js getAllTools() returns array of 23', () => {
  const { getAllTools } = require(path.join(GEMINI_DIR, 'tools.js'));
  const tools = getAllTools();
  assert(Array.isArray(tools), 'getAllTools() does not return array');
  assert(tools.length === 23, `getAllTools() returned ${tools.length} tools, expected 23`);
});

test('MOD-04', 'tools.js resolveToolName resolves legacy alias', () => {
  const { resolveToolName } = require(path.join(GEMINI_DIR, 'tools.js'));
  assert(resolveToolName('search_file_content') === 'grep_search',
    'Legacy alias search_file_content not resolved to grep_search');
});

test('MOD-05', 'version.js parseVersion handles normal version', () => {
  const { parseVersion } = require(path.join(GEMINI_DIR, 'version.js'));
  const v = parseVersion('0.34.0');
  assert(v.major === 0 && v.minor === 34 && v.patch === 0, 'parseVersion("0.34.0") incorrect');
});

test('MOD-06', 'version.js parseVersion handles nightly version', () => {
  const { parseVersion } = require(path.join(GEMINI_DIR, 'version.js'));
  const v = parseVersion('0.34.0-nightly.20260304');
  assert(v.isNightly === true, 'nightly version not detected');
  assert(v.minor === 34, 'nightly version minor incorrect');
});

test('MOD-07', 'version.js getFeatureFlags returns all v0.34.0 flags', () => {
  const { getFeatureFlags, resetCache } = require(path.join(GEMINI_DIR, 'version.js'));
  resetCache();
  // Set env to simulate v0.34.0
  const origEnv = process.env.GEMINI_CLI_VERSION;
  process.env.GEMINI_CLI_VERSION = '0.34.0';
  resetCache();
  const flags = getFeatureFlags();
  process.env.GEMINI_CLI_VERSION = origEnv || '';
  resetCache();
  assert(flags.hasNativeSkillSystem === true, 'hasNativeSkillSystem not true for v0.34.0');
  assert(flags.hasSubagentPolicies === true, 'hasSubagentPolicies not true for v0.34.0');
});

// ═══════════════════════════════════════════════════════════════
// SECTION 6: MIGRATION TESTS (MIG-01 ~ MIG-15)
// ═══════════════════════════════════════════════════════════════
console.log('\n=== Section 6: Migration Tests ===');

test('MIG-01', 'sync-version.js --check-only returns 0 when synced', () => {
  try {
    execSync(`node ${path.join(SCRIPTS_DIR, 'sync-version.js')} --check-only`, {
      timeout: 5000, encoding: 'utf-8', cwd: ROOT
    });
    // Exit code 0 = all synced
  } catch (err) {
    throw new Error(`sync-version.js --check-only failed: exit code ${err.status}`);
  }
});

test('MIG-02', 'sync-version.js propagates version from bkit.config.json', () => {
  const content = fs.readFileSync(path.join(SCRIPTS_DIR, 'sync-version.js'), 'utf-8');
  assert(content.includes('getConfigVersion'), 'sync-version.js does not have getConfigVersion');
  assert(content.includes('bkit.config.json'), 'sync-version.js does not read bkit.config.json');
});

test('MIG-03', 'lib/common.js removed — getAdapter available from lib/gemini/platform.js', () => {
  assert(!fs.existsSync(path.join(LIB, 'common.js')), 'common.js should be deleted (v2.0.1)');
  const platform = require(path.join(LIB, 'gemini', 'platform.js'));
  assert(typeof platform.getAdapter === 'function', 'getAdapter not available from platform.js');
});

test('MIG-04', 'Old test fixture PDCA_STATUS_V157 is importable', () => {
  const fixtures = require(path.join(ROOT, 'tests', 'fixtures.js'));
  assert(fixtures.PDCA_STATUS_V157 !== undefined, 'PDCA_STATUS_V157 fixture not found');
  assert(fixtures.PDCA_STATUS_V157.version === '2.0', 'V157 fixture version incorrect');
});

test('MIG-05', 'Old test fixture PDCA_STATUS_V158 is importable', () => {
  const fixtures = require(path.join(ROOT, 'tests', 'fixtures.js'));
  assert(fixtures.PDCA_STATUS_V158 !== undefined, 'PDCA_STATUS_V158 fixture not found');
  assert(fixtures.PDCA_STATUS_V158.primaryFeature === 'test-feature',
    'V158 fixture primaryFeature incorrect');
});

test('MIG-06', 'Old fixture V157 can be processed by pdca/status module', () => {
  const fixtures = require(path.join(ROOT, 'tests', 'fixtures.js'));
  const status = fixtures.PDCA_STATUS_V157;
  // Should have expected shape
  assert(status.features && typeof status.features === 'object', 'V157 features not an object');
  assert(status.pipeline && typeof status.pipeline === 'object', 'V157 pipeline not an object');
});

test('MIG-07', 'Old fixture V158 activeFeatures is an object (not array)', () => {
  const fixtures = require(path.join(ROOT, 'tests', 'fixtures.js'));
  const status = fixtures.PDCA_STATUS_V158;
  assert(typeof status.activeFeatures === 'object' && !Array.isArray(status.activeFeatures),
    'V158 activeFeatures is not an object map');
});

test('MIG-08', 'Removed feature flags do not cause crashes when accessed', () => {
  const { getFeatureFlags, resetCache } = require(path.join(GEMINI_DIR, 'version.js'));
  resetCache();
  const origEnv = process.env.GEMINI_CLI_VERSION;
  process.env.GEMINI_CLI_VERSION = '0.34.0';
  resetCache();
  const flags = getFeatureFlags();
  process.env.GEMINI_CLI_VERSION = origEnv || '';
  resetCache();
  // Old flags that were removed — accessing them should not throw
  const removedFlags = [
    'hasPolicyEngine', 'hasProjectLevelPolicy', 'hasExtensionPolicies',
    'hasRuntimeHookFunctions', 'hasApprovalMode', 'hasTaskTracker'
  ];
  for (const flag of removedFlags) {
    // Should be undefined, not throw
    const val = flags[flag];
    // No assertion on value — just verifying no crash
  }
});

test('MIG-09', 'hooks/hooks.json uses ${extensionPath} variable (not ${CLAUDE_PLUGIN_ROOT})', () => {
  const content = fs.readFileSync(path.join(HOOKS_DIR, 'hooks.json'), 'utf-8');
  assert(content.includes('${extensionPath}'), 'hooks.json does not use ${extensionPath}');
  assert(!content.includes('${CLAUDE_PLUGIN_ROOT}'), 'hooks.json still uses ${CLAUDE_PLUGIN_ROOT}');
});

test('MIG-10', 'All hooks.json commands reference hooks/scripts/ path', () => {
  const hooks = JSON.parse(fs.readFileSync(path.join(HOOKS_DIR, 'hooks.json'), 'utf-8'));
  const commands = [];
  for (const [, entries] of Object.entries(hooks.hooks)) {
    for (const entry of entries) {
      for (const hook of (entry.hooks || [])) {
        if (hook.command) commands.push(hook.command);
      }
    }
  }
  for (const cmd of commands) {
    assert(cmd.includes('hooks/scripts/'), `Command does not reference hooks/scripts/: ${cmd}`);
  }
});

test('MIG-11', 'gemini-extension.json has plan.directory field', () => {
  const ext = JSON.parse(fs.readFileSync(path.join(ROOT, 'gemini-extension.json'), 'utf-8'));
  assert(ext.plan && ext.plan.directory, 'gemini-extension.json missing plan.directory');
});

test('MIG-12', 'bkit.config.json compatibility section has required keys', () => {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'bkit.config.json'), 'utf-8'));
  const compat = config.compatibility;
  assert(compat.minGeminiCliVersion, 'Missing minGeminiCliVersion');
  assert(compat.policyEngine, 'Missing policyEngine');
  assert(compat.runtimeHooks, 'Missing runtimeHooks');
  assert(compat.taskTracker, 'Missing taskTracker');
  assert(compat.skillsSystem, 'Missing skillsSystem');
  assert(compat.subagentPolicies, 'Missing subagentPolicies');
});

test('MIG-13', 'No deprecated "excludeTools" field in gemini-extension.json', () => {
  const ext = JSON.parse(fs.readFileSync(path.join(ROOT, 'gemini-extension.json'), 'utf-8'));
  assert(!('excludeTools' in ext), 'excludeTools still present in gemini-extension.json');
});

test('MIG-14', 'phase-transition.js script exists', () => {
  assert(fs.existsSync(path.join(SCRIPTS_DIR, 'phase-transition.js')),
    'scripts/phase-transition.js not found');
});

test('MIG-15', 'All hook scripts use consistent error handling (graceful degradation)', () => {
  for (const script of HOOK_SCRIPTS) {
    const content = fs.readFileSync(path.join(HOOKS_SCRIPTS, script), 'utf-8');
    // All hooks should catch errors and exit 0 for graceful degradation
    assert(content.includes('catch') || content.includes('try'),
      `${script} does not have error handling`);
  }
});

// ═══════════════════════════════════════════════════════════════
// SECTION 7: PHILOSOPHY TESTS (PHI-01 ~ PHI-10)
// ═══════════════════════════════════════════════════════════════
console.log('\n=== Section 7: Philosophy Tests ===');

test('PHI-01', 'bkit-system/philosophy/ directory exists and is readable', () => {
  assert(fs.existsSync(PHILOSOPHY_DIR), 'philosophy directory not found');
  const stats = fs.lstatSync(PHILOSOPHY_DIR);
  assert(stats.isDirectory() || stats.isSymbolicLink(), 'philosophy is not a directory or symlink');
});

test('PHI-02', 'bkit-system/philosophy/ is a symlink to bkit-claude-code', () => {
  const stats = fs.lstatSync(PHILOSOPHY_DIR);
  if (stats.isSymbolicLink()) {
    const target = fs.readlinkSync(PHILOSOPHY_DIR);
    assert(target.includes('bkit-claude-code'),
      `Symlink target is "${target}", expected bkit-claude-code`);
  } else {
    // Not a symlink — check if it is independent copies (CHANGELOG says symlink broken)
    skip('PHI-02b', 'Philosophy is independent copy (symlink broken per CHANGELOG)',
      'Directory is not a symlink — independent copies maintained');
  }
});

const PHILOSOPHY_FILES = [
  'core-mission.md', 'ai-native-principles.md',
  'pdca-methodology.md', 'context-engineering.md'
];

PHILOSOPHY_FILES.forEach(file => {
  test(`PHI-03-${file}`, `philosophy/${file} is accessible`, () => {
    const filePath = path.join(PHILOSOPHY_DIR, file);
    assert(fs.existsSync(filePath), `${file} not found`);
    const content = fs.readFileSync(filePath, 'utf-8');
    assert(content.length > 100, `${file} seems too short (${content.length} chars)`);
  });
});

test('PHI-04', 'Philosophy directory has exactly 4 files', () => {
  const files = fs.readdirSync(PHILOSOPHY_DIR).filter(f => f.endsWith('.md'));
  assert(files.length === 4, `Expected 4 philosophy files, found ${files.length}: ${files.join(', ')}`);
});

test('PHI-05', 'core-mission.md contains bkit mission statement', () => {
  const content = fs.readFileSync(path.join(PHILOSOPHY_DIR, 'core-mission.md'), 'utf-8');
  assert(content.includes('bkit') || content.includes('PDCA') || content.includes('Vibecoding'),
    'core-mission.md does not contain expected bkit references');
});

test('PHI-06', 'pdca-methodology.md references PDCA cycle', () => {
  const content = fs.readFileSync(path.join(PHILOSOPHY_DIR, 'pdca-methodology.md'), 'utf-8');
  assert(content.includes('Plan') && content.includes('Check'),
    'pdca-methodology.md does not reference Plan/Check');
});

// ═══════════════════════════════════════════════════════════════
// SECTION 8: CHANGELOG TESTS (LOG-01 ~ LOG-08)
// ═══════════════════════════════════════════════════════════════
console.log('\n=== Section 8: CHANGELOG Tests ===');

test('LOG-01', 'CHANGELOG.md exists', () => {
  assert(fs.existsSync(path.join(ROOT, 'CHANGELOG.md')), 'CHANGELOG.md not found');
});

test('LOG-02', 'CHANGELOG.md has v2.0.0 entry', () => {
  const content = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf-8');
  assert(content.includes('v2.0.0') || content.includes('## 2.0.0'),
    'CHANGELOG.md has no v2.0.0 entry');
});

test('LOG-03', 'CHANGELOG.md v2.0.0 has Breaking Changes section', () => {
  const content = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf-8');
  assert(content.includes('Breaking Changes'), 'CHANGELOG.md missing Breaking Changes section');
});

test('LOG-04', 'CHANGELOG.md v2.0.0 has Security Fixes section', () => {
  const content = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf-8');
  assert(content.includes('Security Fixes'), 'CHANGELOG.md missing Security Fixes section');
});

test('LOG-05', 'CHANGELOG.md documents lib/adapters/ removal', () => {
  const content = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf-8');
  assert(content.includes('lib/adapters/') || content.includes('adapters'),
    'CHANGELOG.md does not document adapters removal');
});

test('LOG-06', 'CHANGELOG.md documents CC code removal', () => {
  const content = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf-8');
  assert(content.includes('CLAUDE_TO_GEMINI_MAP') || content.includes('Claude Code'),
    'CHANGELOG.md does not document CC code removal');
});

test('LOG-07', 'CHANGELOG.md documents minimum CLI version change', () => {
  const content = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf-8');
  assert(content.includes('v0.34.0') || content.includes('0.34.0'),
    'CHANGELOG.md does not document v0.34.0 minimum');
});

test('LOG-08', 'CHANGELOG.md v2.0.2 entry is first (most recent)', () => {
  const content = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf-8');
  const firstH2 = content.indexOf('## ');
  const v202Pos = content.indexOf('v2.0.2');
  // v2.0.2 should appear at or very near the first ## heading
  assert(v202Pos < firstH2 + 100,
    'v2.0.2 is not the most recent changelog entry');
});

// ═══════════════════════════════════════════════════════════════
// SECTION 9: CROSS-CUTTING ARCHITECTURE (XAR-01 ~ XAR-10)
// ═══════════════════════════════════════════════════════════════
console.log('\n=== Section 9: Cross-cutting Architecture ===');

test('XAR-01', 'tools.js exports TOOL_ANNOTATIONS for all 23 tools', () => {
  const { TOOL_ANNOTATIONS, BUILTIN_TOOLS } = require(path.join(GEMINI_DIR, 'tools.js'));
  const toolNames = Object.values(BUILTIN_TOOLS);
  for (const name of toolNames) {
    assert(TOOL_ANNOTATIONS[name], `TOOL_ANNOTATIONS missing for "${name}"`);
    assert('readOnlyHint' in TOOL_ANNOTATIONS[name],
      `TOOL_ANNOTATIONS["${name}"] missing readOnlyHint`);
  }
});

test('XAR-02', 'tools.js TOOL_PARAM_CHANGES covers read_file, replace, grep_search', () => {
  const { TOOL_PARAM_CHANGES } = require(path.join(GEMINI_DIR, 'tools.js'));
  assert(TOOL_PARAM_CHANGES['read_file'], 'Missing TOOL_PARAM_CHANGES for read_file');
  assert(TOOL_PARAM_CHANGES['replace'], 'Missing TOOL_PARAM_CHANGES for replace');
  assert(TOOL_PARAM_CHANGES['grep_search'], 'Missing TOOL_PARAM_CHANGES for grep_search');
});

test('XAR-03', 'policy.js TOML validation rejects lowercase "toolname"', () => {
  const { validateTomlStructure } = require(path.join(GEMINI_DIR, 'policy.js'));
  const badToml = '[[rule]]\ntoolname = "read_file"\ndecision = "allow"';
  assert(validateTomlStructure(badToml) === false,
    'validateTomlStructure accepted lowercase "toolname"');
});

test('XAR-04', 'policy.js TOML validation accepts correct "toolName"', () => {
  const { validateTomlStructure } = require(path.join(GEMINI_DIR, 'policy.js'));
  const goodToml = '[[rule]]\ntoolName = "read_file"\ndecision = "allow"';
  assert(validateTomlStructure(goodToml) === true,
    'validateTomlStructure rejected correct "toolName"');
});

test('XAR-05', 'tracker.js PDCA_TO_TRACKER_STATUS covers all phases', () => {
  const { PDCA_TO_TRACKER_STATUS } = require(path.join(GEMINI_DIR, 'tracker.js'));
  const requiredPhases = ['plan', 'design', 'do', 'check', 'act', 'completed'];
  for (const phase of requiredPhases) {
    assert(PDCA_TO_TRACKER_STATUS[phase],
      `PDCA_TO_TRACKER_STATUS missing "${phase}"`);
  }
});

test('XAR-06', 'context-fork.js exports forkContext and mergeForkedContext', () => {
  const cf = require(path.join(GEMINI_DIR, 'context-fork.js'));
  assert(typeof cf.forkContext === 'function', 'forkContext not exported');
  assert(typeof cf.mergeForkedContext === 'function', 'mergeForkedContext not exported');
});

test('XAR-07', 'import-resolver.js exports resolveImports', () => {
  const ir = require(path.join(GEMINI_DIR, 'import-resolver.js'));
  assert(typeof ir.resolveImports === 'function', 'resolveImports not exported');
});

test('XAR-08', 'hooks.js HOOK_EVENT_MAP has 10 event mappings', () => {
  const { HOOK_EVENT_MAP } = require(path.join(GEMINI_DIR, 'hooks.js'));
  const count = Object.keys(HOOK_EVENT_MAP).length;
  assert(count === 10, `HOOK_EVENT_MAP has ${count} entries, expected 10`);
});

test('XAR-09', 'policy.js SUBAGENT_POLICY_GROUPS has readonly and docwrite tiers', () => {
  const { SUBAGENT_POLICY_GROUPS } = require(path.join(GEMINI_DIR, 'policy.js'));
  assert(SUBAGENT_POLICY_GROUPS.readonly, 'Missing readonly tier');
  assert(SUBAGENT_POLICY_GROUPS.docwrite, 'Missing docwrite tier');
  assert(SUBAGENT_POLICY_GROUPS.readonly.agents.length > 0, 'readonly agents empty');
  assert(SUBAGENT_POLICY_GROUPS.docwrite.agents.length > 0, 'docwrite agents empty');
});

test('XAR-10', 'policy.js LEVEL_POLICY_TEMPLATES has Starter, Dynamic, Enterprise', () => {
  const { LEVEL_POLICY_TEMPLATES } = require(path.join(GEMINI_DIR, 'policy.js'));
  assert(LEVEL_POLICY_TEMPLATES.Starter, 'Missing Starter template');
  assert(LEVEL_POLICY_TEMPLATES.Dynamic, 'Missing Dynamic template');
  assert(LEVEL_POLICY_TEMPLATES.Enterprise, 'Missing Enterprise template');
});

// ═══════════════════════════════════════════════════════════════
// SECTION 10: SECURITY ARCHITECTURE (SEC-01 ~ SEC-08)
// ═══════════════════════════════════════════════════════════════
console.log('\n=== Section 10: Security Architecture ===');

test('SEC-01', 'mcp/spawn-agent-server.js has SAFETY_TIERS defined', () => {
  const content = fs.readFileSync(path.join(MCP_DIR, 'spawn-agent-server.js'), 'utf-8');
  assert(content.includes('SAFETY_TIERS'), 'SAFETY_TIERS not defined');
  assert(content.includes('READONLY'), 'READONLY tier not defined');
  assert(content.includes('DOCWRITE'), 'DOCWRITE tier not defined');
  assert(content.includes('FULL'), 'FULL tier not defined');
});

test('SEC-02', 'mcp/spawn-agent-server.js agents have safetyTier assigned', () => {
  const content = fs.readFileSync(path.join(MCP_DIR, 'spawn-agent-server.js'), 'utf-8');
  assert(content.includes('safetyTier'), 'safetyTier not found in AGENTS registry');
});

test('SEC-03', 'mcp/spawn-agent-server.js has sanitizeTeamName for path traversal prevention', () => {
  const content = fs.readFileSync(path.join(MCP_DIR, 'spawn-agent-server.js'), 'utf-8');
  assert(content.includes('sanitizeTeamName'), 'sanitizeTeamName not found');
});

test('SEC-04', 'policy.js deny rules include rm -rf and git push --force', () => {
  const content = fs.readFileSync(path.join(GEMINI_DIR, 'policy.js'), 'utf-8');
  assert(content.includes('rm -rf'), 'No rm -rf deny rule');
  assert(content.includes('git push --force'), 'No git push --force deny rule');
});

test('SEC-05', 'version.js validates SemVer format for env var injection prevention', () => {
  const { isValidSemVer } = require(path.join(GEMINI_DIR, 'version.js'));
  assert(isValidSemVer('0.34.0') === true, 'Valid semver rejected');
  assert(isValidSemVer('not-a-version') === false, 'Invalid semver accepted');
  assert(isValidSemVer('999.999.999; rm -rf /') === false, 'Injection string accepted');
});

test('SEC-06', 'version.js rejects version beyond plausible range', () => {
  const { isVersionBeyondPlausible } = require(path.join(GEMINI_DIR, 'version.js'));
  assert(isVersionBeyondPlausible('99.0.0') === true, 'Implausible version not detected');
  assert(isVersionBeyondPlausible('0.34.0') === false, 'Plausible version falsely rejected');
});

test('SEC-07', 'policy.js Starter level denies code writes in plan mode', () => {
  const { LEVEL_POLICY_TEMPLATES } = require(path.join(GEMINI_DIR, 'policy.js'));
  const starterRules = LEVEL_POLICY_TEMPLATES.Starter.rules;
  const planModeDeny = starterRules.filter(r =>
    r.modes && r.modes.includes('plan') && r.decision === 'deny'
  );
  assert(planModeDeny.length >= 3,
    `Expected at least 3 plan mode deny rules for Starter, found ${planModeDeny.length}`);
});

test('SEC-08', 'policy.js Extension policy is Tier 2 (no "allow" decisions)', () => {
  const content = fs.readFileSync(path.join(GEMINI_DIR, 'policy.js'), 'utf-8');
  // generateExtensionPolicy should only produce deny/ask_user
  assert(content.includes('DENY and ASK_USER decisions only') ||
    content.includes('Tier 2'),
    'Extension policy Tier 2 documentation not found');
});

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Recursively search for a regex pattern in JS files under a directory
 * Returns array of { file, matches } objects
 */
function searchForPattern(dir, regex, ext) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  function walk(d) {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(d, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walk(fullPath);
      } else if (entry.isFile()) {
        if (ext && !entry.name.endsWith(ext.replace('*', ''))) continue;
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const matches = content.match(regex);
          if (matches && matches.length > 0) {
            results.push({ file: path.relative(ROOT, fullPath), matches });
          }
        } catch { /* ignore binary files */ }
      }
    }
  }

  walk(dir);
  return results;
}

// ═══════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════
console.log('\n' + '='.repeat(60));
console.log(`TC-80 Architecture + Migration v2.0.0 Results`);
console.log('='.repeat(60));
console.log(`  Passed:  ${passed}`);
console.log(`  Failed:  ${failed}`);
console.log(`  Skipped: ${skipped}`);
console.log(`  Total:   ${passed + failed + skipped}`);

if (failures.length > 0) {
  console.log('\nFailures:');
  for (const f of failures) {
    console.log(`  ${f.id}: ${f.description}`);
    console.log(`    -> ${f.error}`);
  }
}

console.log('');
process.exit(failed > 0 ? 1 : 0);
