// tests/test-utils.js
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawn } = require('child_process');

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const TEST_PROJECT_DIR = path.join(os.tmpdir(), 'bkit-test-project');

/**
 * Create a temporary test project with specified fixtures
 * Standard v2.0.2 structure ensured by default.
 */
function createTestProject(fixtures = {}) {
  if (fs.existsSync(TEST_PROJECT_DIR)) {
    fs.rmSync(TEST_PROJECT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_PROJECT_DIR, { recursive: true });

  // Standard v2.0.2 structure
  const dirs = [
    'src', '.bkit/state', '.gemini/policies',
    'docs/01-plan/features', 'docs/02-design/features',
    'docs/03-analysis/features', 'docs/04-report/features',
    'docs/.pdca-snapshots'
  ];
  for (const d of dirs) {
    fs.mkdirSync(path.join(TEST_PROJECT_DIR, d), { recursive: true });
  }

  // Write fixture files
  for (const [filePath, content] of Object.entries(fixtures)) {
    const fullPath = path.join(TEST_PROJECT_DIR, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, typeof content === 'object' ? JSON.stringify(content, null, 2) : content);
  }

  // Auto-generate status if not provided (default to root for v2)
  const statusPath = path.join(TEST_PROJECT_DIR, '.pdca-status.json');
  if (!fs.existsSync(statusPath) && !fixtures['.pdca-status.json']) {
    const { PDCA_STATUS_FIXTURE } = require('./fixtures');
    fs.writeFileSync(statusPath, JSON.stringify(PDCA_STATUS_FIXTURE, null, 2));
  }

  return TEST_PROJECT_DIR;
}

/**
 * Get a deep-cloned PDCA status fixture with optional overrides
 */
function getPdcaStatus(overrides = {}) {
  const { PDCA_STATUS_FIXTURE } = require('./fixtures');
  const status = JSON.parse(JSON.stringify(PDCA_STATUS_FIXTURE));
  // Deep merge primary feature data if exists
  if (overrides.features) {
    for (const [key, val] of Object.entries(overrides.features)) {
      status.features[key] = { ...(status.features[key] || {}), ...val };
    }
    delete overrides.features;
  }
  return { ...status, ...overrides };
}

/**
 * Set Gemini CLI version for testing with auto-cleanup
 */
function withVersion(version, fn) {
  const vd = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'version'));
  vd.resetCache();
  const original = process.env.GEMINI_CLI_VERSION;
  process.env.GEMINI_CLI_VERSION = version;
  process.env.BKIT_PLUGIN_ROOT = PLUGIN_ROOT; // Ensure plugin root is known
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.finally(() => {
        vd.resetCache();
        if (original !== undefined) process.env.GEMINI_CLI_VERSION = original;
        else delete process.env.GEMINI_CLI_VERSION;
      });
    }
    return result;
  } finally {
    vd.resetCache();
    if (original !== undefined) process.env.GEMINI_CLI_VERSION = original;
    else delete process.env.GEMINI_CLI_VERSION;
  }
}

/**
 * Count regex matches in string
 */
function countMatches(str, pattern) {
  if (!str) return 0;
  return (str.match(new RegExp(pattern, 'g')) || []).length;
}

/**
 * Clean up test project
 */
function cleanupTestProject() {
  if (fs.existsSync(TEST_PROJECT_DIR)) {
    fs.rmSync(TEST_PROJECT_DIR, { recursive: true });
  }
}

/**
 * Execute a hook script with mock stdin input
 */
function executeHook(scriptName, stdinInput = {}, env = {}) {
  const scriptPath = path.join(PLUGIN_ROOT, 'hooks', 'scripts', scriptName);
  const fullEnv = {
    ...process.env,
    BKIT_PROJECT_DIR: TEST_PROJECT_DIR,
    BKIT_PLUGIN_ROOT: PLUGIN_ROOT,
    ...env
  };

  try {
    const result = execSync(`echo '${JSON.stringify(stdinInput)}' | node "${scriptPath}"`, {
      env: fullEnv,
      cwd: TEST_PROJECT_DIR,
      timeout: 10000,
      encoding: 'utf-8'
    });
    const trimmed = result.trim();
    return { 
      success: true, 
      output: trimmed ? JSON.parse(trimmed) : {}, 
      raw: trimmed,
      exitCode: 0
    };
  } catch (error) {
    if (process.env.BKIT_DEBUG === 'true') {
      console.log(`Hook ${scriptName} failed with exit code ${error.status}`);
      if (error.stderr) console.log('Hook Stderr:', error.stderr);
    }
    let output = {};
    try {
      if (error.stdout) {
        output = JSON.parse(error.stdout.trim());
      }
    } catch (e) {
      // Ignore parse error on stdout
    }
    return { success: false, error: error.message, exitCode: error.status, output, raw: error.stdout };
  }
}

/**
 * Send JSON-RPC request to MCP server
 */
function sendMcpRequest(method, params = {}, id = 1) {
  const serverPath = path.join(PLUGIN_ROOT, 'mcp', 'spawn-agent-server.js');
  const request = JSON.stringify({ jsonrpc: '2.0', id, method, params });

  try {
    const result = execSync(`echo '${request}' | node "${serverPath}"`, {
      cwd: TEST_PROJECT_DIR,
      timeout: 10000,
      encoding: 'utf-8'
    });
    const lines = result.trim().split('\n').filter(l => l.trim());
    if (process.env.BKIT_DEBUG === 'true') {
      console.log('MCP Raw Result:', result);
    }
    return JSON.parse(lines[lines.length - 1]);
  } catch (error) {
    if (process.env.BKIT_DEBUG === 'true') {
      console.log('MCP Request Failed:', error.message);
      if (error.stdout) console.log('MCP Stdout:', error.stdout);
      if (error.stderr) console.log('MCP Stderr:', error.stderr);
    }
    return { error: error.message };
  }
}

/**
 * Assert helper with descriptive messages
 */
function assert(condition, message) {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`ASSERT FAILED: ${message}
  Expected: ${JSON.stringify(expected)}
  Actual: ${JSON.stringify(actual)}`);
  }
}

function assertContains(str, substring, message) {
  if (!str || !str.includes(substring)) {
    throw new Error(`ASSERT FAILED: ${message}
  "${substring}" not found in "${str?.substring(0, 200)}..."`);
  }
}

function assertExists(filePath, message) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`ASSERT FAILED: ${message}
  File not found: ${filePath}`);
  }
}

function assertThrows(fn, message) {
  let threw = false;
  try { fn(); } catch { threw = true; }
  if (!threw) throw new Error(`ASSERT FAILED: ${message} (expected error but none thrown)`);
}

function assertType(value, type, message) {
  if (typeof value !== type) {
    throw new Error(`ASSERT FAILED: ${message}\n  Expected type: ${type}\n  Actual type: ${typeof value}`);
  }
}

function assertLength(arr, length, message) {
  if (!Array.isArray(arr)) throw new Error(`ASSERT FAILED: ${message} (not an array)`);
  if (arr.length !== length) {
    throw new Error(`ASSERT FAILED: ${message}\n  Expected length: ${length}\n  Actual length: ${arr.length}`);
  }
}

function assertHasKey(obj, key, message) {
  if (!(key in obj)) {
    throw new Error(`ASSERT FAILED: ${message}\n  Key "${key}" not found in object`);
  }
}

function assertInRange(value, min, max, message) {
  if (value < min || value > max) {
    throw new Error(`ASSERT FAILED: ${message}\n  ${value} not in [${min}, ${max}]`);
  }
}

function parseYamlFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const yaml = {};
  match[1].split('\n').forEach(line => {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) yaml[key.trim()] = rest.join(':').trim();
  });
  return yaml;
}

/**
 * Run a test suite
 */
async function runSuite(suite) {
  console.log(`
--- ${suite.name} (${suite.priority}) ---`);
  // Use absolute path for require
  const suitePath = path.resolve(PLUGIN_ROOT, 'tests', suite.file);
  const mod = require(suitePath);
  const tests = mod.tests || [];
  let passed = 0, failed = 0, skipped = 0;

  for (const test of tests) {
    try {
      if (test.skip) { skipped++; console.log(`  SKIP: ${test.name}`); continue; }
      if (test.setup) test.setup();
      await test.fn();
      if (test.teardown) test.teardown();
      passed++;
      console.log(`  PASS: ${test.name}`);
    } catch (error) {
      failed++;
      console.log(`  FAIL: ${test.name} - ${error.message}`);
      if (test.teardown) try { test.teardown(); } catch {}
    }
  }

  console.log(`  Result: ${passed}/${tests.length} passed`);
  return { passed, failed, skipped };
}

/**
 * Read PDCA status with path resolution
 */
function readPdcaStatus(projectDir = TEST_PROJECT_DIR) {
  const bkitPath = path.join(projectDir, '.bkit', 'state', 'pdca-status.json');
  const rootPath = path.join(projectDir, '.pdca-status.json');
  const legacyPath = path.join(projectDir, 'docs', '.pdca-status.json');
  
  if (fs.existsSync(bkitPath)) return JSON.parse(fs.readFileSync(bkitPath, 'utf8'));
  if (fs.existsSync(rootPath)) return JSON.parse(fs.readFileSync(rootPath, 'utf8'));
  if (fs.existsSync(legacyPath)) return JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
  
  throw new Error(`PDCA status file not found in ${projectDir} (Checked .bkit/state, root, and docs/)`);
}

/**
 * Read global memory with path resolution
 */
function readGlobalMemory(projectDir = TEST_PROJECT_DIR) {
  const rootPath = path.join(projectDir, '.bkit', 'state', 'memory.json');
  const legacyPath = path.join(projectDir, 'docs', '.bkit-memory.json');
  const memoryPath = fs.existsSync(rootPath) ? rootPath : legacyPath;
  
  if (!fs.existsSync(memoryPath)) {
    throw new Error(`Memory file not found in ${projectDir}`);
  }
  
  const content = fs.readFileSync(memoryPath, 'utf8');
  const memory = JSON.parse(content);
  // Support both old flat structure and new nested data structure
  return memory.data || memory;
}

module.exports = {
  PLUGIN_ROOT, TEST_PROJECT_DIR,
  createTestProject, cleanupTestProject, getPdcaStatus,
  executeHook, sendMcpRequest,
  assert, assertEqual, assertContains, assertExists,
  assertThrows, assertType, assertLength, assertHasKey, assertInRange,
  parseYamlFrontmatter,
  runSuite, withVersion, countMatches,
  readPdcaStatus, readGlobalMemory
};
