// tests/test-utils.js
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawn } = require('child_process');

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const TEST_PROJECT_DIR = path.join(os.tmpdir(), 'bkit-test-project');

/**
 * Create a temporary test project with specified fixtures
 */
function createTestProject(fixtures = {}) {
  if (fs.existsSync(TEST_PROJECT_DIR)) {
    fs.rmSync(TEST_PROJECT_DIR, { recursive: true });
  }
  fs.mkdirSync(TEST_PROJECT_DIR, { recursive: true });
  fs.mkdirSync(path.join(TEST_PROJECT_DIR, 'docs'), { recursive: true });
  fs.mkdirSync(path.join(TEST_PROJECT_DIR, 'src'), { recursive: true });

  // Write fixture files
  for (const [filePath, content] of Object.entries(fixtures)) {
    const fullPath = path.join(TEST_PROJECT_DIR, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, typeof content === 'object' ? JSON.stringify(content, null, 2) : content);
  }

  return TEST_PROJECT_DIR;
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
    return { success: true, output: JSON.parse(result.trim()), raw: result.trim() };
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

module.exports = {
  PLUGIN_ROOT, TEST_PROJECT_DIR,
  createTestProject, cleanupTestProject,
  executeHook, sendMcpRequest,
  assert, assertEqual, assertContains, assertExists,
  runSuite
};
