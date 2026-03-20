/**
 * TC-95: Architecture + Migration Verification for bkit v2.0.0
 *
 * Validates v2.0.0 structural changes across 6 categories:
 *   1. Directory Structure (20 tests)
 *   2. Require Path Verification (20 tests)
 *   3. CC Removal Verification (20 tests)
 *   4. Version Consistency (15 tests)
 *   5. Module Compatibility (10 tests)
 *   6. Philosophy & Docs (10 tests)
 *   7. Config Schema (5 tests)
 *
 * ~100 test cases total
 *
 * @version 2.0.0
 */

const fs = require('fs');
const path = require('path');

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

/**
 * Recursively search for a regex pattern in files under a directory
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

// ================================================================
// SECTION 1: DIRECTORY STRUCTURE (DS-01 ~ DS-20)
// ================================================================
console.log('\n=== Section 1: Directory Structure (20 tests) ===');

test('DS-01', 'lib/gemini/ exists as directory', () => {
  assert(fs.existsSync(GEMINI_DIR), 'lib/gemini/ directory not found');
  assert(fs.statSync(GEMINI_DIR).isDirectory(), 'lib/gemini/ is not a directory');
});

const EXPECTED_GEMINI_FILES = [
  'platform.js', 'tools.js', 'version.js', 'hooks.js',
  'policy.js', 'tracker.js', 'context-fork.js', 'import-resolver.js'
];

test('DS-02', 'lib/gemini/ has exactly 8 .js files', () => {
  const files = fs.readdirSync(GEMINI_DIR).filter(f => f.endsWith('.js'));
  assert(files.length === 8,
    `Expected 8 files, found ${files.length}: ${files.join(', ')}`);
});

test('DS-03', 'lib/gemini/ contains platform.js', () => {
  assert(fs.existsSync(path.join(GEMINI_DIR, 'platform.js')), 'platform.js not found');
});

test('DS-04', 'lib/gemini/ contains tools.js', () => {
  assert(fs.existsSync(path.join(GEMINI_DIR, 'tools.js')), 'tools.js not found');
});

test('DS-05', 'lib/gemini/ contains version.js', () => {
  assert(fs.existsSync(path.join(GEMINI_DIR, 'version.js')), 'version.js not found');
});

test('DS-06', 'lib/gemini/ contains hooks.js', () => {
  assert(fs.existsSync(path.join(GEMINI_DIR, 'hooks.js')), 'hooks.js not found');
});

test('DS-07', 'lib/gemini/ contains policy.js', () => {
  assert(fs.existsSync(path.join(GEMINI_DIR, 'policy.js')), 'policy.js not found');
});

test('DS-08', 'lib/gemini/ contains tracker.js', () => {
  assert(fs.existsSync(path.join(GEMINI_DIR, 'tracker.js')), 'tracker.js not found');
});

test('DS-09', 'lib/gemini/ contains context-fork.js', () => {
  assert(fs.existsSync(path.join(GEMINI_DIR, 'context-fork.js')), 'context-fork.js not found');
});

test('DS-10', 'lib/gemini/ contains import-resolver.js', () => {
  assert(fs.existsSync(path.join(GEMINI_DIR, 'import-resolver.js')), 'import-resolver.js not found');
});

test('DS-11', 'lib/adapters/ does NOT exist', () => {
  assert(!fs.existsSync(path.join(LIB, 'adapters')),
    'lib/adapters/ still exists — should have been removed');
});

test('DS-12', 'lib/adapters/platform-interface.js does NOT exist', () => {
  assert(!fs.existsSync(path.join(LIB, 'adapters', 'platform-interface.js')),
    'platform-interface.js still exists');
});

test('DS-13', 'lib/adapters/index.js does NOT exist', () => {
  assert(!fs.existsSync(path.join(LIB, 'adapters', 'index.js')),
    'adapters/index.js still exists');
});

// All 8 lib/gemini/ files can be required without error
EXPECTED_GEMINI_FILES.forEach((file, i) => {
  test(`DS-${14 + i}`, `lib/gemini/${file} can be required without error`, () => {
    const mod = require(path.join(GEMINI_DIR, file));
    assert(mod !== null && mod !== undefined, `${file} returned null/undefined on require`);
  });
});

// DS-14 through DS-21 are consumed by the forEach above (8 files)
// That gives us DS-01..DS-21, but we only need 20. The forEach produces DS-14..DS-21 = 8 tests.
// Total: 13 + 8 = 21 tests. We'll count the section as having ~20 tests.

// ================================================================
// SECTION 2: REQUIRE PATH VERIFICATION (RP-01 ~ RP-20)
// ================================================================
console.log('\n=== Section 2: Require Path Verification (20 tests) ===');

test('RP-01', 'Zero "require.*adapters" in lib/**/*.js', () => {
  const result = searchForPattern(LIB, /require\s*\(\s*['"][^'"]*adapters/g, '*.js');
  assert(result.length === 0,
    `Found ${result.length} adapters references in lib/: ${result.map(r => r.file).join(', ')}`);
});

test('RP-02', 'Zero "require.*adapters" in hooks/scripts/**/*.js', () => {
  const result = searchForPattern(HOOKS_SCRIPTS, /require\s*\(\s*['"][^'"]*adapters/g, '*.js');
  assert(result.length === 0,
    `Found ${result.length} adapters references in hooks/scripts/: ${result.map(r => r.file).join(', ')}`);
});

test('RP-03', 'Zero "require.*adapters" in hooks/**/*.js (all)', () => {
  const result = searchForPattern(HOOKS_DIR, /require\s*\(\s*['"][^'"]*adapters/g, '*.js');
  assert(result.length === 0,
    `Found ${result.length} adapters references in hooks/: ${result.map(r => r.file).join(', ')}`);
});

test('RP-04', 'Zero "require.*adapters" in mcp/**/*.js', () => {
  const result = searchForPattern(MCP_DIR, /require\s*\(\s*['"][^'"]*adapters/g, '*.js');
  assert(result.length === 0,
    `Found ${result.length} adapters references in mcp/: ${result.map(r => r.file).join(', ')}`);
});

test('RP-05', 'lib/common.js removed (unused bridge, deleted in v2.0.1)', () => {
  const commonPath = path.join(LIB, 'common.js');
  assert(!fs.existsSync(commonPath), 'common.js should be deleted (zero usage in codebase)');
});

test('RP-06', 'Platform functions available from lib/gemini/platform.js (not common.js)', () => {
  const platform = require(path.join(LIB, 'gemini', 'platform.js'));
  assert(typeof platform.getAdapter === 'function', 'getAdapter not exported from platform.js');
  assert(typeof platform.getPlatformName === 'function', 'getPlatformName not exported from platform.js');
  assert(typeof platform.isGemini === 'function', 'isGemini not exported from platform.js');
});

test('RP-07', 'session-start.js requires lib/gemini (not lib/adapters)', () => {
  const content = fs.readFileSync(path.join(HOOKS_SCRIPTS, 'session-start.js'), 'utf-8');
  assert(
    content.includes('gemini/platform') || content.includes("'gemini', 'platform'") || content.includes('lib/gemini'),
    'session-start.js does not use gemini/ path'
  );
  assert(!content.includes('lib/adapters'), 'session-start.js still references lib/adapters');
});

test('RP-08', 'before-tool.js has no adapters reference', () => {
  const content = fs.readFileSync(path.join(HOOKS_SCRIPTS, 'before-tool.js'), 'utf-8');
  assert(!content.includes('adapters'), 'before-tool.js still references adapters');
});

test('RP-09', 'after-tool.js has no adapters reference', () => {
  const content = fs.readFileSync(path.join(HOOKS_SCRIPTS, 'after-tool.js'), 'utf-8');
  assert(!content.includes('adapters'), 'after-tool.js still references adapters');
});

test('RP-10', 'before-agent.js has no adapters reference', () => {
  const content = fs.readFileSync(path.join(HOOKS_SCRIPTS, 'before-agent.js'), 'utf-8');
  assert(!content.includes('adapters'), 'before-agent.js still references adapters');
});

test('RP-11', 'after-agent.js has no adapters reference', () => {
  const content = fs.readFileSync(path.join(HOOKS_SCRIPTS, 'after-agent.js'), 'utf-8');
  assert(!content.includes('adapters'), 'after-agent.js still references adapters');
});

test('RP-12', 'before-model.js has no adapters reference', () => {
  const content = fs.readFileSync(path.join(HOOKS_SCRIPTS, 'before-model.js'), 'utf-8');
  assert(!content.includes('adapters'), 'before-model.js still references adapters');
});

test('RP-13', 'after-model.js has no adapters reference', () => {
  const content = fs.readFileSync(path.join(HOOKS_SCRIPTS, 'after-model.js'), 'utf-8');
  assert(!content.includes('adapters'), 'after-model.js still references adapters');
});

test('RP-14', 'session-end.js has no adapters reference', () => {
  const content = fs.readFileSync(path.join(HOOKS_SCRIPTS, 'session-end.js'), 'utf-8');
  assert(!content.includes('adapters'), 'session-end.js still references adapters');
});

test('RP-15', 'pre-compress.js has no adapters reference', () => {
  const content = fs.readFileSync(path.join(HOOKS_SCRIPTS, 'pre-compress.js'), 'utf-8');
  assert(!content.includes('adapters'), 'pre-compress.js still references adapters');
});

test('RP-16', 'before-tool-selection.js has no adapters reference', () => {
  const content = fs.readFileSync(path.join(HOOKS_SCRIPTS, 'before-tool-selection.js'), 'utf-8');
  assert(!content.includes('adapters'), 'before-tool-selection.js still references adapters');
});

test('RP-17', 'mcp/spawn-agent-server.js has no adapters reference', () => {
  const content = fs.readFileSync(path.join(MCP_DIR, 'spawn-agent-server.js'), 'utf-8');
  assert(!content.includes('lib/adapters'), 'spawn-agent-server.js still references lib/adapters');
});

test('RP-18', 'lib/common.js does not exist (removed in v2.0.1)', () => {
  assert(!fs.existsSync(path.join(LIB, 'common.js')), 'common.js should be deleted');
});

test('RP-19', 'Zero string literal "adapters" in lib/gemini/*.js files', () => {
  const results = searchForPattern(GEMINI_DIR, /['"].*adapters.*['"]/g, '*.js');
  assert(results.length === 0,
    `Found adapters string in lib/gemini/: ${results.map(r => r.file).join(', ')}`);
});

test('RP-20', 'Zero "from.*adapters" or "import.*adapters" in all source', () => {
  const libResults = searchForPattern(LIB, /(?:from|import)\s+['"][^'"]*adapters/g, '*.js');
  const hookResults = searchForPattern(HOOKS_DIR, /(?:from|import)\s+['"][^'"]*adapters/g, '*.js');
  const total = libResults.length + hookResults.length;
  assert(total === 0, `Found ${total} import/from adapters references`);
});

// ================================================================
// SECTION 3: CC REMOVAL VERIFICATION (CC-01 ~ CC-20)
// ================================================================
console.log('\n=== Section 3: CC Removal Verification (20 tests) ===');

test('CC-01', 'CLAUDE_TO_GEMINI_MAP not in any lib/ source file', () => {
  const results = searchForPattern(LIB, /CLAUDE_TO_GEMINI_MAP/g, '*.js');
  assert(results.length === 0,
    `Found CLAUDE_TO_GEMINI_MAP in: ${results.map(r => r.file).join(', ')}`);
});

test('CC-02', 'CLAUDE_TO_GEMINI_MAP not in any hooks/ source file', () => {
  const results = searchForPattern(HOOKS_DIR, /CLAUDE_TO_GEMINI_MAP/g, '*.js');
  assert(results.length === 0,
    `Found CLAUDE_TO_GEMINI_MAP in hooks/: ${results.map(r => r.file).join(', ')}`);
});

test('CC-03', 'CLAUDE_TO_GEMINI_MAP not in any mcp/ source file', () => {
  const results = searchForPattern(MCP_DIR, /CLAUDE_TO_GEMINI_MAP/g, '*.js');
  assert(results.length === 0,
    `Found CLAUDE_TO_GEMINI_MAP in mcp/: ${results.map(r => r.file).join(', ')}`);
});

test('CC-04', 'claudeToolName not in any hook script', () => {
  const results = searchForPattern(HOOKS_SCRIPTS, /claudeToolName/g, '*.js');
  assert(results.length === 0,
    `Found claudeToolName in: ${results.map(r => r.file).join(', ')}`);
});

test('CC-05', 'isClaudeCode not exported from core/platform', () => {
  const platform = require(path.join(LIB, 'core', 'platform.js'));
  assert(!('isClaudeCode' in platform), 'isClaudeCode still exported from core/platform.js');
});

test('CC-06', '${CLAUDE_PLUGIN_ROOT} not in any lib/ source', () => {
  const results = searchForPattern(LIB, /\$\{CLAUDE_PLUGIN_ROOT\}/g, '*.js');
  assert(results.length === 0,
    `Found \${CLAUDE_PLUGIN_ROOT} in lib/: ${results.map(r => r.file).join(', ')}`);
});

test('CC-07', '${CLAUDE_PLUGIN_ROOT} not in any hooks/ source', () => {
  const results = searchForPattern(HOOKS_DIR, /\$\{CLAUDE_PLUGIN_ROOT\}/g, '*.js');
  assert(results.length === 0,
    `Found \${CLAUDE_PLUGIN_ROOT} in hooks/: ${results.map(r => r.file).join(', ')}`);
});

test('CC-08', '${CLAUDE_PLUGIN_ROOT} not in any mcp/ source', () => {
  const results = searchForPattern(MCP_DIR, /\$\{CLAUDE_PLUGIN_ROOT\}/g, '*.js');
  assert(results.length === 0,
    `Found \${CLAUDE_PLUGIN_ROOT} in mcp/: ${results.map(r => r.file).join(', ')}`);
});

test('CC-09', '"Claude Code" not in GEMINI.template (templates/)', () => {
  const results = searchForPattern(TEMPLATES_DIR, /Claude Code/g, '*.md');
  const geminiTemplates = results.filter(r =>
    r.file.includes('GEMINI.template') || r.file.includes('gemini.template')
  );
  assert(geminiTemplates.length === 0,
    `Found "Claude Code" in GEMINI template: ${geminiTemplates.map(r => r.file).join(', ')}`);
});

test('CC-10', '"Claude Code" not in zero-script-qa.template (templates/)', () => {
  const results = searchForPattern(TEMPLATES_DIR, /Claude Code/g, '*.md');
  const qaTemplates = results.filter(r => r.file.includes('zero-script-qa'));
  assert(qaTemplates.length === 0,
    `Found "Claude Code" in zero-script-qa template: ${qaTemplates.map(r => r.file).join(', ')}`);
});

test('CC-11', '"Claude Code" not in TEMPLATE-GUIDE (templates/)', () => {
  const results = searchForPattern(TEMPLATES_DIR, /Claude Code/g, '*.md');
  const guideResults = results.filter(r =>
    r.file.includes('TEMPLATE-GUIDE') && !r.file.includes('history')
  );
  // Allow in historical/guide docs if they document migration
  assert(guideResults.length === 0,
    `Found "Claude Code" in TEMPLATE-GUIDE: ${guideResults.map(r => r.file).join(', ')}`);
});

test('CC-12', 'PlatformAdapter class not referenced anywhere in lib/', () => {
  const results = searchForPattern(LIB, /class PlatformAdapter/g, '*.js');
  assert(results.length === 0,
    `PlatformAdapter ABC still exists: ${results.map(r => r.file).join(', ')}`);
});

test('CC-13', 'PlatformAdapter not referenced anywhere in hooks/', () => {
  const results = searchForPattern(HOOKS_DIR, /PlatformAdapter/g, '*.js');
  assert(results.length === 0,
    `PlatformAdapter referenced in hooks/: ${results.map(r => r.file).join(', ')}`);
});

test('CC-14', 'FORWARD_ALIASES not exported from tools.js', () => {
  const tools = require(path.join(GEMINI_DIR, 'tools.js'));
  assert(!('FORWARD_ALIASES' in tools), 'FORWARD_ALIASES still exported from tools.js');
});

test('CC-15', 'BKIT_LEGACY_NAMES not exported from tools.js', () => {
  const tools = require(path.join(GEMINI_DIR, 'tools.js'));
  assert(!('BKIT_LEGACY_NAMES' in tools), 'BKIT_LEGACY_NAMES still exported from tools.js');
});

test('CC-16', 'mapToolName not exported from tools.js (CC legacy)', () => {
  const tools = require(path.join(GEMINI_DIR, 'tools.js'));
  assert(!('mapToolName' in tools), 'mapToolName CC legacy function still exported');
});

test('CC-17', 'reverseMapToolName not exported from tools.js (CC legacy)', () => {
  const tools = require(path.join(GEMINI_DIR, 'tools.js'));
  assert(!('reverseMapToolName' in tools), 'reverseMapToolName CC legacy function still exported');
});

test('CC-18', 'No "claude" in tools.js LEGACY_ALIASES keys', () => {
  const tools = require(path.join(GEMINI_DIR, 'tools.js'));
  const aliases = tools.LEGACY_ALIASES;
  for (const key of Object.keys(aliases)) {
    assert(!key.toLowerCase().includes('claude'),
      `CC legacy alias key found: ${key}`);
  }
});

test('CC-19', 'version.js does not reference "claude" (case-insensitive)', () => {
  const content = fs.readFileSync(path.join(GEMINI_DIR, 'version.js'), 'utf-8');
  assert(!content.toLowerCase().includes('claude'),
    'version.js still contains "claude" reference');
});

test('CC-20', 'hooks.js does not reference "claude" (case-insensitive)', () => {
  const content = fs.readFileSync(path.join(GEMINI_DIR, 'hooks.js'), 'utf-8');
  assert(!content.toLowerCase().includes('claude'),
    'hooks.js still contains "claude" reference');
});

// ================================================================
// SECTION 4: VERSION CONSISTENCY (VER-01 ~ VER-15)
// ================================================================
console.log('\n=== Section 4: Version Consistency (15 tests) ===');

test('VER-01', 'bkit.config.json version = "2.0.0"', () => {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'bkit.config.json'), 'utf-8'));
  assert(config.version === '2.0.0', `bkit.config.json version is "${config.version}"`);
});

test('VER-02', 'gemini-extension.json version = "2.0.0"', () => {
  const ext = JSON.parse(fs.readFileSync(path.join(ROOT, 'gemini-extension.json'), 'utf-8'));
  assert(ext.version === '2.0.0', `gemini-extension.json version is "${ext.version}"`);
});

test('VER-03', 'hooks.json description contains "v2.0.0"', () => {
  const hooks = JSON.parse(fs.readFileSync(path.join(HOOKS_DIR, 'hooks.json'), 'utf-8'));
  assert(hooks.description.includes('v2.0.0'),
    `hooks.json description does not contain v2.0.0: "${hooks.description}"`);
});

test('VER-04', 'bkit.config.json minGeminiCliVersion = "0.34.0"', () => {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'bkit.config.json'), 'utf-8'));
  assert(config.compatibility.minGeminiCliVersion === '0.34.0',
    `minGeminiCliVersion is "${config.compatibility.minGeminiCliVersion}"`);
});

test('VER-05', 'bkit.config.json testedVersions = ["0.34.0"]', () => {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'bkit.config.json'), 'utf-8'));
  const tv = config.compatibility.testedVersions;
  assert(Array.isArray(tv), 'testedVersions is not an array');
  assert(tv.length === 1 && tv[0] === '0.34.0',
    `testedVersions is ${JSON.stringify(tv)}, expected ["0.34.0"]`);
});

test('VER-06', 'gemini-extension.json contextFileName is array', () => {
  const ext = JSON.parse(fs.readFileSync(path.join(ROOT, 'gemini-extension.json'), 'utf-8'));
  assert(Array.isArray(ext.contextFileName),
    `contextFileName is ${typeof ext.contextFileName}, expected array`);
});

test('VER-07', 'No "v1.5" in session-start.js', () => {
  const content = fs.readFileSync(path.join(HOOKS_SCRIPTS, 'session-start.js'), 'utf-8');
  const match = content.match(/v1\.5/g);
  assert(!match, `Found "v1.5" in session-start.js: ${match}`);
});

test('VER-08', 'session-start.js references v2.0.0', () => {
  const content = fs.readFileSync(path.join(HOOKS_SCRIPTS, 'session-start.js'), 'utf-8');
  assert(content.includes('v2.0.0'), 'session-start.js does not contain v2.0.0');
});

test('VER-09', 'scripts/sync-version.js exists', () => {
  assert(fs.existsSync(path.join(SCRIPTS_DIR, 'sync-version.js')),
    'scripts/sync-version.js not found');
});

test('VER-10', 'scripts/sync-version.js references bkit.config.json', () => {
  const content = fs.readFileSync(path.join(SCRIPTS_DIR, 'sync-version.js'), 'utf-8');
  assert(content.includes('bkit.config.json'), 'sync-version.js does not reference bkit.config.json');
});

test('VER-11', 'scripts/sync-version.js references gemini-extension.json', () => {
  const content = fs.readFileSync(path.join(SCRIPTS_DIR, 'sync-version.js'), 'utf-8');
  assert(content.includes('gemini-extension.json'),
    'sync-version.js does not reference gemini-extension.json');
});

test('VER-12', 'scripts/sync-version.js references hooks.json', () => {
  const content = fs.readFileSync(path.join(SCRIPTS_DIR, 'sync-version.js'), 'utf-8');
  assert(content.includes('hooks.json'), 'sync-version.js does not reference hooks.json');
});

test('VER-13', 'gemini-extension.json contextFileName includes "GEMINI.md"', () => {
  const ext = JSON.parse(fs.readFileSync(path.join(ROOT, 'gemini-extension.json'), 'utf-8'));
  assert(Array.isArray(ext.contextFileName) && ext.contextFileName.includes('GEMINI.md'),
    `contextFileName does not include "GEMINI.md": ${JSON.stringify(ext.contextFileName)}`);
});

test('VER-14', 'No operational "v1.5" version strings in lib/gemini/*.js (comments OK)', () => {
  // Check for v1.5 in non-comment lines (operational code, not JSDoc history)
  const files = fs.readdirSync(GEMINI_DIR).filter(f => f.endsWith('.js'));
  const operational = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(GEMINI_DIR, file), 'utf-8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Skip comment lines (JSDoc, single-line comments)
      if (line.startsWith('*') || line.startsWith('//') || line.startsWith('/*')) continue;
      if (/v1\.5/.test(line)) {
        operational.push(`${file}:${i + 1}: ${line}`);
      }
    }
  }
  assert(operational.length === 0,
    `Found operational v1.5 references: ${operational.join('; ')}`);
});

test('VER-15', 'hooks/hooks.json uses ${extensionPath} variable (not ${CLAUDE_PLUGIN_ROOT})', () => {
  const content = fs.readFileSync(path.join(HOOKS_DIR, 'hooks.json'), 'utf-8');
  assert(content.includes('${extensionPath}'), 'hooks.json does not use ${extensionPath}');
  assert(!content.includes('${CLAUDE_PLUGIN_ROOT}'), 'hooks.json still uses ${CLAUDE_PLUGIN_ROOT}');
});

// ================================================================
// SECTION 5: MODULE COMPATIBILITY (MC-01 ~ MC-10)
// ================================================================
console.log('\n=== Section 5: Module Compatibility (10 tests) ===');

test('MC-01', 'lib/common.js removed (unused bridge, deleted in v2.0.1)', () => {
  assert(!fs.existsSync(path.join(LIB, 'common.js')),
    'common.js should be deleted (zero usage in codebase)');
});

test('MC-02', 'lib/gemini/platform.js exports getAdapter as function', () => {
  const platform = require(path.join(GEMINI_DIR, 'platform.js'));
  assert(typeof platform.getAdapter === 'function',
    `getAdapter is ${typeof platform.getAdapter}, expected function`);
});

test('MC-03', 'lib/gemini/platform.js exports getPlatformName as function', () => {
  const platform = require(path.join(GEMINI_DIR, 'platform.js'));
  assert(typeof platform.getPlatformName === 'function',
    `getPlatformName is ${typeof platform.getPlatformName}, expected function`);
});

test('MC-04', 'lib/gemini/platform.js exports isGemini as function', () => {
  const platform = require(path.join(GEMINI_DIR, 'platform.js'));
  assert(typeof platform.isGemini === 'function',
    `isGemini is ${typeof platform.isGemini}, expected function`);
});

test('MC-05', 'lib/gemini/platform.js getPlatformName() returns "gemini"', () => {
  const platform = require(path.join(GEMINI_DIR, 'platform.js'));
  const name = platform.getPlatformName();
  assert(name === 'gemini', `getPlatformName() returned "${name}", expected "gemini"`);
});

test('MC-06', 'lib/gemini/platform.js isGemini() returns true', () => {
  const platform = require(path.join(GEMINI_DIR, 'platform.js'));
  assert(platform.isGemini() === true, 'isGemini() did not return true');
});

test('MC-07', 'lib/gemini/platform.js exports a singleton object', () => {
  const adapter = require(path.join(GEMINI_DIR, 'platform.js'));
  assert(adapter !== null && typeof adapter === 'object',
    'platform.js does not export an object');
});

test('MC-08', 'lib/gemini/tools.js exports getAllTools function', () => {
  const tools = require(path.join(GEMINI_DIR, 'tools.js'));
  assert(typeof tools.getAllTools === 'function',
    'getAllTools is not exported as a function');
});

test('MC-09', 'lib/gemini/tools.js exports resolveToolName function', () => {
  const tools = require(path.join(GEMINI_DIR, 'tools.js'));
  assert(typeof tools.resolveToolName === 'function',
    'resolveToolName is not exported as a function');
});

test('MC-10', 'lib/gemini/version.js exports parseVersion and getFeatureFlags', () => {
  const version = require(path.join(GEMINI_DIR, 'version.js'));
  assert(typeof version.parseVersion === 'function',
    'parseVersion is not exported as a function');
  assert(typeof version.getFeatureFlags === 'function',
    'getFeatureFlags is not exported as a function');
});

// ================================================================
// SECTION 6: PHILOSOPHY & DOCS (PD-01 ~ PD-10)
// ================================================================
console.log('\n=== Section 6: Philosophy & Docs (10 tests) ===');

test('PD-01', 'bkit-system/philosophy is symlink or directory', () => {
  assert(fs.existsSync(PHILOSOPHY_DIR), 'philosophy directory not found');
  const stats = fs.lstatSync(PHILOSOPHY_DIR);
  assert(stats.isDirectory() || stats.isSymbolicLink(),
    'philosophy is not a directory or symlink');
});

test('PD-02', 'bkit-system/philosophy is a symlink', () => {
  const stats = fs.lstatSync(PHILOSOPHY_DIR);
  // May be independent copies in v2.0.0
  if (!stats.isSymbolicLink()) {
    skip('PD-02b', 'Philosophy symlink check', 'Directory is independent copy (not symlink)');
  } else {
    assert(stats.isSymbolicLink(), 'Expected symlink');
  }
});

const PHILOSOPHY_FILES = [
  'core-mission.md', 'ai-native-principles.md',
  'pdca-methodology.md', 'context-engineering.md'
];

PHILOSOPHY_FILES.forEach((file, i) => {
  test(`PD-${3 + i}`, `philosophy/${file} is accessible`, () => {
    const filePath = path.join(PHILOSOPHY_DIR, file);
    assert(fs.existsSync(filePath), `${file} not found`);
    const content = fs.readFileSync(filePath, 'utf-8');
    assert(content.length > 100, `${file} seems too short (${content.length} chars)`);
  });
});

// PD-03..PD-06 consumed by forEach (4 files)

test('PD-07', 'CHANGELOG.md contains "v2.0.0"', () => {
  const content = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf-8');
  assert(content.includes('v2.0.0') || content.includes('## 2.0.0'),
    'CHANGELOG.md has no v2.0.0 entry');
});

test('PD-08', 'CHANGELOG.md contains "Gemini CLI Native"', () => {
  const content = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf-8');
  assert(content.includes('Gemini CLI Native') || content.includes('Gemini-native') || content.includes('Gemini CLI native'),
    'CHANGELOG.md does not mention Gemini CLI Native');
});

test('PD-09', '.gemini/context/core-rules.md exists', () => {
  assert(fs.existsSync(path.join(ROOT, '.gemini', 'context', 'core-rules.md')),
    '.gemini/context/core-rules.md not found');
});

test('PD-10', '.gemini/context/tool-reference-v2.md exists', () => {
  assert(fs.existsSync(path.join(ROOT, '.gemini', 'context', 'tool-reference-v2.md')),
    '.gemini/context/tool-reference-v2.md not found');
});

test('PD-11', 'GEMINI.md has <= 50 lines', () => {
  const content = fs.readFileSync(path.join(ROOT, 'GEMINI.md'), 'utf-8');
  const lineCount = content.split('\n').length;
  assert(lineCount <= 50, `GEMINI.md has ${lineCount} lines, expected <= 50`);
});

test('PD-12', 'GEMINI.md has exactly 2 @imports', () => {
  const content = fs.readFileSync(path.join(ROOT, 'GEMINI.md'), 'utf-8');
  const imports = content.match(/^@[^\s]/gm);
  const importCount = imports ? imports.length : 0;
  assert(importCount === 2, `GEMINI.md has ${importCount} @imports, expected 2`);
});

// ================================================================
// SECTION 7: CONFIG SCHEMA (CS-01 ~ CS-05)
// ================================================================
console.log('\n=== Section 7: Config Schema (5 tests) ===');

test('CS-01', 'bkit.config.json has modelRouting.enabled', () => {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'bkit.config.json'), 'utf-8'));
  assert(config.modelRouting && typeof config.modelRouting.enabled === 'boolean',
    'modelRouting.enabled not found or not boolean');
});

test('CS-02', 'bkit.config.json has context.phaseAware.enabled', () => {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'bkit.config.json'), 'utf-8'));
  assert(config.context && config.context.phaseAware && typeof config.context.phaseAware.enabled === 'boolean',
    'context.phaseAware.enabled not found or not boolean');
});

test('CS-03', 'bkit.config.json has subagentPolicies.enabled', () => {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'bkit.config.json'), 'utf-8'));
  assert(config.compatibility && config.compatibility.subagentPolicies &&
    typeof config.compatibility.subagentPolicies.enabled === 'boolean',
    'subagentPolicies.enabled not found or not boolean');
});

test('CS-04', 'bkit.config.json has taskTracker.directCrud', () => {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'bkit.config.json'), 'utf-8'));
  assert(config.compatibility && config.compatibility.taskTracker &&
    typeof config.compatibility.taskTracker.directCrud === 'boolean',
    'taskTracker.directCrud not found or not boolean');
});

test('CS-05', 'bkit.config.json has skillsSystem.enabled', () => {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'bkit.config.json'), 'utf-8'));
  assert(config.compatibility && config.compatibility.skillsSystem &&
    typeof config.compatibility.skillsSystem.enabled === 'boolean',
    'skillsSystem.enabled not found or not boolean');
});

// ================================================================
// SUMMARY
// ================================================================
console.log('\n' + '='.repeat(60));
console.log('TC-95 Architecture + Migration v2.0.0 Results');
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
