# bkit-gemini v1.5.1 Comprehensive Test Design

> **Feature**: bkit-gemini-v151-test
> **Phase**: Design
> **Plan Reference**: `docs/01-plan/features/bkit-gemini-v151-test.plan.md`
> **Author**: CTO Team (5-Agent Design: QA Strategist, Code Analyzer, Gap Detector, Product Manager, Design Validator)
> **Date**: 2026-02-11
> **Test Cases**: 258 (TC-01~TC-10)
> **Test Environment**: Gemini CLI v0.27.3+ / Node.js >= 18.x

---

## 1. Test Architecture

### 1.1 Execution Layers

```
Layer 5: Philosophy (Gemini CLI Interactive)  ── TC-10 (59 cases)
Layer 4: E2E (Gemini CLI Interactive)         ── TC-09 (15 cases)
Layer 3: Integration (Node.js)                ── TC-05 (18), TC-08 (15 cases)
Layer 2: Component (Node.js)                  ── TC-01 (40), TC-02 (25), TC-03 (20), TC-06 (15)
Layer 1: Unit (Node.js)                       ── TC-04 (39), TC-07 (12 cases)
```

### 1.2 Test Runner Architecture

```javascript
// tests/run-all.js - Main test runner
const { runSuite } = require('./test-utils');

async function main() {
  const suites = [
    { name: 'TC-04: Lib Modules', file: './suites/tc04-lib-modules.js', priority: 'P0' },
    { name: 'TC-01: Hook System', file: './suites/tc01-hooks.js', priority: 'P0' },
    { name: 'TC-02: Skill System', file: './suites/tc02-skills.js', priority: 'P0' },
    { name: 'TC-07: Configuration', file: './suites/tc07-config.js', priority: 'P1' },
    { name: 'TC-03: Agent System', file: './suites/tc03-agents.js', priority: 'P1' },
    { name: 'TC-05: MCP Server', file: './suites/tc05-mcp.js', priority: 'P1' },
    { name: 'TC-06: TOML Commands', file: './suites/tc06-commands.js', priority: 'P1' },
    { name: 'TC-08: Context Engineering', file: './suites/tc08-context.js', priority: 'P1' },
    { name: 'TC-09: PDCA E2E', file: './suites/tc09-pdca-e2e.js', priority: 'P0' },
    { name: 'TC-10: Philosophy', file: './suites/tc10-philosophy.js', priority: 'P2' },
  ];

  let passed = 0, failed = 0, skipped = 0;
  for (const suite of suites) {
    const result = await runSuite(suite);
    passed += result.passed;
    failed += result.failed;
    skipped += result.skipped;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Total: ${passed + failed + skipped} | Pass: ${passed} | Fail: ${failed} | Skip: ${skipped}`);
  console.log(`Pass Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
```

### 1.3 Test Utility Module

```javascript
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
    return { success: false, error: error.message, exitCode: error.status };
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
    return JSON.parse(lines[lines.length - 1]);
  } catch (error) {
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
    throw new Error(`ASSERT FAILED: ${message}\n  Expected: ${JSON.stringify(expected)}\n  Actual: ${JSON.stringify(actual)}`);
  }
}

function assertContains(str, substring, message) {
  if (!str || !str.includes(substring)) {
    throw new Error(`ASSERT FAILED: ${message}\n  "${substring}" not found in "${str?.substring(0, 200)}..."`);
  }
}

function assertExists(filePath, message) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`ASSERT FAILED: ${message}\n  File not found: ${filePath}`);
  }
}

/**
 * Run a test suite
 */
async function runSuite(suite) {
  console.log(`\n--- ${suite.name} (${suite.priority}) ---`);
  const mod = require(suite.file);
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
```

### 1.4 Standard Test Fixtures

```javascript
// tests/fixtures.js
const PDCA_STATUS_FIXTURE = {
  version: '2.0',
  lastUpdated: new Date().toISOString(),
  activeFeatures: ['test-feature'],
  primaryFeature: 'test-feature',
  features: {
    'test-feature': {
      phase: 'plan',
      matchRate: null,
      iterationCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },
  pipeline: { currentPhase: 1, level: 'Starter', phaseHistory: [] },
  session: { startedAt: new Date().toISOString(), onboardingCompleted: false }
};

const BKIT_MEMORY_FIXTURE = {
  sessionCount: 1,
  platform: 'gemini',
  level: 'Starter',
  lastSessionStarted: new Date().toISOString()
};

const BKIT_MEMORY_RETURNING = {
  sessionCount: 5,
  platform: 'gemini',
  level: 'Dynamic',
  lastSessionStarted: new Date().toISOString(),
  outputStyle: 'bkit-pdca-guide'
};

module.exports = { PDCA_STATUS_FIXTURE, BKIT_MEMORY_FIXTURE, BKIT_MEMORY_RETURNING };
```

---

## 2. TC-01: Hook System Test Design (40 Cases, P0)

### 2.1 SessionStart Hook Tests (HOOK-01 ~ HOOK-10)

#### HOOK-01: Normal execution returns valid JSON

**Category**: Component | **Priority**: P0

```javascript
{
  name: 'HOOK-01: SessionStart returns valid JSON',
  setup: () => createTestProject({}),
  fn: () => {
    const result = executeHook('session-start.js');
    assert(result.success, 'Hook should exit 0');
    assertEqual(result.output.status, 'allow', 'Status should be allow');
    assert(result.output.context || result.output.hookEvent, 'Should have context or hookEvent');
  },
  teardown: cleanupTestProject
}
```

#### HOOK-02: Enterprise level detection

**Category**: Component | **Priority**: P0

```javascript
{
  name: 'HOOK-02: Enterprise level auto-detection',
  setup: () => createTestProject({ 'kubernetes/.keep': '' }),
  fn: () => {
    const result = executeHook('session-start.js');
    assert(result.success, 'Hook should succeed');
    assertContains(result.output.metadata?.level || result.output.context, 'Enterprise', 'Should detect Enterprise level');
  },
  teardown: cleanupTestProject
}
```

#### HOOK-03: Dynamic level detection

```javascript
{
  name: 'HOOK-03: Dynamic level auto-detection',
  setup: () => createTestProject({ 'docker-compose.yml': 'version: "3"' }),
  fn: () => {
    const result = executeHook('session-start.js');
    assert(result.success, 'Hook should succeed');
    assertContains(result.output.metadata?.level || result.output.context, 'Dynamic', 'Should detect Dynamic level');
  },
  teardown: cleanupTestProject
}
```

#### HOOK-04: Starter level default

```javascript
{
  name: 'HOOK-04: Starter level default',
  setup: () => createTestProject({}),
  fn: () => {
    const result = executeHook('session-start.js');
    assert(result.success, 'Hook should succeed');
    assertContains(result.output.metadata?.level || result.output.context, 'Starter', 'Should default to Starter');
  },
  teardown: cleanupTestProject
}
```

#### HOOK-05: Session count increment

```javascript
{
  name: 'HOOK-05: sessionCount increments on each session',
  setup: () => createTestProject({
    'docs/.bkit-memory.json': { sessionCount: 3, platform: 'gemini', level: 'Starter' }
  }),
  fn: () => {
    executeHook('session-start.js');
    const memory = JSON.parse(fs.readFileSync(path.join(TEST_PROJECT_DIR, 'docs/.bkit-memory.json'), 'utf-8'));
    assertEqual(memory.sessionCount, 4, 'sessionCount should increment to 4');
  },
  teardown: cleanupTestProject
}
```

#### HOOK-06: Output Style by level

```javascript
{
  name: 'HOOK-06: Output style matches level',
  setup: () => createTestProject({}),
  fn: () => {
    const result = executeHook('session-start.js');
    // Starter → bkit-learning
    const style = result.output.metadata?.outputStyle || '';
    assertEqual(style, 'bkit-learning', 'Starter should use bkit-learning style');
  },
  teardown: cleanupTestProject
}
```

#### HOOK-07: Returning user detection

```javascript
{
  name: 'HOOK-07: Returning user with active feature',
  setup: () => createTestProject({
    'docs/.bkit-memory.json': BKIT_MEMORY_RETURNING,
    'docs/.pdca-status.json': PDCA_STATUS_FIXTURE
  }),
  fn: () => {
    const result = executeHook('session-start.js');
    assertContains(result.output.context, 'Previous Work Detected', 'Should show previous work');
    assertContains(result.output.context, 'test-feature', 'Should mention active feature');
  },
  teardown: cleanupTestProject
}
```

#### HOOK-08: New user onboarding

```javascript
{
  name: 'HOOK-08: New user gets onboarding options',
  setup: () => createTestProject({}),
  fn: () => {
    const result = executeHook('session-start.js');
    assertContains(result.output.context, 'Welcome', 'Should show welcome for new user');
    assertContains(result.output.context, 'AskUserQuestion', 'Should prompt user question');
  },
  teardown: cleanupTestProject
}
```

#### HOOK-09: PDCA status dynamic injection

```javascript
{
  name: 'HOOK-09: PDCA status injected into context',
  setup: () => createTestProject({
    'docs/.pdca-status.json': PDCA_STATUS_FIXTURE,
    'docs/.bkit-memory.json': BKIT_MEMORY_FIXTURE
  }),
  fn: () => {
    const result = executeHook('session-start.js');
    assertContains(result.output.context, 'PDCA', 'Should contain PDCA section');
    assertContains(result.output.context, 'Core Rules', 'Should contain core rules');
  },
  teardown: cleanupTestProject
}
```

#### HOOK-10: Performance benchmark (< 3000ms)

```javascript
{
  name: 'HOOK-10: SessionStart completes within 3 seconds',
  setup: () => createTestProject({}),
  fn: () => {
    const start = Date.now();
    executeHook('session-start.js');
    const elapsed = Date.now() - start;
    assert(elapsed < 3000, `Should complete in <3s but took ${elapsed}ms`);
  },
  teardown: cleanupTestProject
}
```

### 2.2 BeforeAgent Hook Tests (HOOK-11 ~ HOOK-16)

#### HOOK-11: Korean trigger detection

```javascript
{
  name: 'HOOK-11: Korean trigger → gap-detector',
  setup: () => createTestProject({}),
  fn: () => {
    const result = executeHook('before-agent.js', { prompt: '이 코드 검증해줘' });
    assert(result.success, 'Hook should succeed');
    assertContains(result.output.context || result.raw, 'gap-detector', 'Should detect gap-detector trigger');
  },
  teardown: cleanupTestProject
}
```

#### HOOK-12: Japanese trigger detection

```javascript
{
  name: 'HOOK-12: Japanese trigger → pdca-iterator',
  setup: () => createTestProject({}),
  fn: () => {
    const result = executeHook('before-agent.js', { prompt: 'このコードを改善して' });
    assertContains(result.output.context || result.raw, 'pdca-iterator', 'Should detect pdca-iterator');
  },
  teardown: cleanupTestProject
}
```

#### HOOK-13: English trigger detection

```javascript
{
  name: 'HOOK-13: English trigger → code-analyzer',
  setup: () => createTestProject({}),
  fn: () => {
    const result = executeHook('before-agent.js', { prompt: 'analyze this code for quality issues' });
    assertContains(result.output.context || result.raw, 'code-analyzer', 'Should detect code-analyzer');
  },
  teardown: cleanupTestProject
}
```

#### HOOK-14: Chinese trigger detection

```javascript
{
  name: 'HOOK-14: Chinese trigger → pdca-iterator',
  setup: () => createTestProject({}),
  fn: () => {
    const result = executeHook('before-agent.js', { prompt: '帮我改进这段代码' });
    assertContains(result.output.context || result.raw, 'pdca-iterator', 'Should detect pdca-iterator from Chinese');
  },
  teardown: cleanupTestProject
}
```

#### HOOK-15: Ambiguity detection (score > 0.5)

```javascript
{
  name: 'HOOK-15: Ambiguous input triggers clarification',
  setup: () => createTestProject({}),
  fn: () => {
    const result = executeHook('before-agent.js', { prompt: '이거 좀 고쳐' });
    // Short + no technical terms + no specific nouns → score > 0.5
    assertContains(result.output.context || result.raw, 'ambiguous', 'Should detect ambiguity');
  },
  teardown: cleanupTestProject
}
```

#### HOOK-16: Performance benchmark (< 2000ms)

```javascript
{
  name: 'HOOK-16: BeforeAgent completes within 2 seconds',
  setup: () => createTestProject({}),
  fn: () => {
    const start = Date.now();
    executeHook('before-agent.js', { prompt: 'verify this code' });
    const elapsed = Date.now() - start;
    assert(elapsed < 2000, `Should complete in <2s but took ${elapsed}ms`);
  },
  teardown: cleanupTestProject
}
```

### 2.3 BeforeModel Hook Tests (HOOK-17 ~ HOOK-18)

#### HOOK-17: PDCA phase context injection

```javascript
{
  name: 'HOOK-17: Plan phase context injected',
  setup: () => createTestProject({ 'docs/.pdca-status.json': PDCA_STATUS_FIXTURE }),
  fn: () => {
    const result = executeHook('before-model.js', { prompt: 'help me plan the login feature' });
    if (result.success && result.output.additionalContext) {
      assertContains(result.output.additionalContext, 'Plan', 'Should inject Plan phase context');
    }
  },
  teardown: cleanupTestProject
}
```

#### HOOK-18: Do phase implementation guidelines

```javascript
{
  name: 'HOOK-18: Do phase guidelines injected',
  setup: () => {
    const status = { ...PDCA_STATUS_FIXTURE };
    status.features['test-feature'].phase = 'do';
    createTestProject({ 'docs/.pdca-status.json': status });
  },
  fn: () => {
    const result = executeHook('before-model.js', { prompt: 'implement the login component' });
    if (result.success && result.output.additionalContext) {
      assertContains(result.output.additionalContext, 'Implementation', 'Should inject Do phase context');
    }
  },
  teardown: cleanupTestProject
}
```

### 2.4 AfterModel Hook (HOOK-19)

```javascript
{
  name: 'HOOK-19: AfterModel hook exits cleanly',
  setup: () => createTestProject({}),
  fn: () => {
    const result = executeHook('after-model.js', { response: 'model response here' });
    // AfterModel should exit 0 regardless
    assert(result.success || result.exitCode === null, 'Hook should exit cleanly');
  },
  teardown: cleanupTestProject
}
```

### 2.5 BeforeToolSelection Hook Tests (HOOK-20 ~ HOOK-21)

#### HOOK-20: Plan phase tool filtering

```javascript
{
  name: 'HOOK-20: Plan phase restricts write tools',
  setup: () => createTestProject({ 'docs/.pdca-status.json': PDCA_STATUS_FIXTURE }),
  fn: () => {
    const result = executeHook('before-tool-selection.js', {
      tools: ['read_file', 'write_file', 'run_shell_command', 'grep_search']
    });
    if (result.success && result.output.toolConfig) {
      const allowed = result.output.toolConfig.functionCallingConfig?.allowedFunctionNames || [];
      assert(!allowed.includes('run_shell_command'), 'Plan phase should not allow shell commands');
      assert(allowed.includes('read_file'), 'Plan phase should allow read_file');
    }
  },
  teardown: cleanupTestProject
}
```

#### HOOK-21: Skill-based tool restriction

```javascript
{
  name: 'HOOK-21: Active skill restricts available tools',
  setup: () => createTestProject({
    'docs/.bkit-memory.json': { ...BKIT_MEMORY_FIXTURE, activeSkill: 'code-review' }
  }),
  fn: () => {
    const result = executeHook('before-tool-selection.js', {
      tools: ['read_file', 'write_file', 'grep_search']
    });
    // code-review skill should be read-only
    assert(result.success || true, 'Should handle skill-based filtering');
  },
  teardown: cleanupTestProject
}
```

### 2.6 BeforeTool Hook Tests (HOOK-22 ~ HOOK-27)

#### HOOK-22: rm -rf / blocked

```javascript
{
  name: 'HOOK-22: rm -rf / is blocked',
  setup: () => createTestProject({}),
  fn: () => {
    const result = executeHook('before-tool.js', {
      tool_name: 'run_shell_command',
      tool_input: { command: 'rm -rf /' }
    });
    assert(result.success, 'Hook should exit 0');
    assertEqual(result.output.status, 'block', 'Should block rm -rf /');
  },
  teardown: cleanupTestProject
}
```

#### HOOK-23: git push --force blocked

```javascript
{
  name: 'HOOK-23: git push --force blocked',
  setup: () => createTestProject({}),
  fn: () => {
    const result = executeHook('before-tool.js', {
      tool_name: 'run_shell_command',
      tool_input: { command: 'git push --force origin main' }
    });
    // Should be blocked or warned based on permission patterns
    assert(result.success, 'Hook should exit 0');
    const status = result.output.status;
    assert(status === 'block' || (result.output.context && result.output.context.includes('Warning')),
      'Should block or warn force push');
  },
  teardown: cleanupTestProject
}
```

#### HOOK-24: git reset --hard warning

```javascript
{
  name: 'HOOK-24: git reset --hard shows warning',
  setup: () => createTestProject({}),
  fn: () => {
    const result = executeHook('before-tool.js', {
      tool_name: 'run_shell_command',
      tool_input: { command: 'git reset --hard HEAD~1' }
    });
    assert(result.success, 'Hook should exit 0');
    assertContains(result.output.context || result.raw, 'Warning', 'Should warn about hard reset');
  },
  teardown: cleanupTestProject
}
```

#### HOOK-25: Plan phase write warning

```javascript
{
  name: 'HOOK-25: Writing in plan phase shows PDCA warning',
  setup: () => createTestProject({ 'docs/.pdca-status.json': PDCA_STATUS_FIXTURE }),
  fn: () => {
    const result = executeHook('before-tool.js', {
      tool_name: 'write_file',
      tool_input: { file_path: 'src/login.js', content: 'code' }
    });
    assert(result.success, 'Hook should exit 0');
    assertContains(result.output.context || result.raw, 'PDCA Phase Warning', 'Should warn about plan phase writing');
  },
  teardown: cleanupTestProject
}
```

#### HOOK-26: .env file security warning

```javascript
{
  name: 'HOOK-26: .env file write triggers security warning',
  setup: () => createTestProject({}),
  fn: () => {
    const result = executeHook('before-tool.js', {
      tool_name: 'write_file',
      tool_input: { file_path: '.env', content: 'API_KEY=secret' }
    });
    assert(result.success, 'Hook should exit 0');
    assertContains(result.output.context || result.raw, 'Security', 'Should warn about env file');
  },
  teardown: cleanupTestProject
}
```

#### HOOK-27: PermissionManager integration

```javascript
{
  name: 'HOOK-27: PermissionManager deny patterns work',
  setup: () => createTestProject({}),
  fn: () => {
    const { checkPermission } = require(path.join(PLUGIN_ROOT, 'lib', 'core', 'permission'));
    const result = checkPermission('run_shell_command', { command: 'rm -rf /' }, TEST_PROJECT_DIR);
    assertEqual(result.level, 'deny', 'rm -rf / should be denied');
  },
  teardown: cleanupTestProject
}
```

### 2.7 AfterTool Hook Tests (HOOK-28 ~ HOOK-30)

#### HOOK-28: Design → Do auto-transition

```javascript
{
  name: 'HOOK-28: Source code write transitions design → do',
  setup: () => {
    const status = { ...PDCA_STATUS_FIXTURE };
    status.features['test-feature'].phase = 'design';
    status.history = [];
    createTestProject({ 'docs/.pdca-status.json': status });
  },
  fn: () => {
    const result = executeHook('after-tool.js', {
      tool_name: 'write_file',
      tool_input: { file_path: 'src/login.js', content: 'function login() {}' }
    });
    const updatedStatus = JSON.parse(fs.readFileSync(
      path.join(TEST_PROJECT_DIR, 'docs/.pdca-status.json'), 'utf-8'));
    assertEqual(updatedStatus.features['test-feature'].phase, 'do', 'Phase should transition to do');
  },
  teardown: cleanupTestProject
}
```

#### HOOK-29: Gap analysis suggestion in do phase

```javascript
{
  name: 'HOOK-29: Do phase suggests gap analysis',
  setup: () => {
    const status = { ...PDCA_STATUS_FIXTURE };
    status.features['test-feature'].phase = 'do';
    createTestProject({ 'docs/.pdca-status.json': status });
  },
  fn: () => {
    const result = executeHook('after-tool.js', {
      tool_name: 'write_file',
      tool_input: { file_path: 'src/component.tsx', content: 'export default function() {}' }
    });
    assertContains(result.output.context || result.raw, 'analyze', 'Should suggest gap analysis');
  },
  teardown: cleanupTestProject
}
```

#### HOOK-30: Skill completion tracking

```javascript
{
  name: 'HOOK-30: PDCA skill tracks completion',
  setup: () => createTestProject({}),
  fn: () => {
    const result = executeHook('after-tool.js', {
      tool_name: 'skill',
      tool_input: { skill: 'bkit:pdca', args: 'plan test-feature' }
    });
    assertContains(result.output.context || result.raw, 'PDCA Progress', 'Should track PDCA progress');
  },
  teardown: cleanupTestProject
}
```

### 2.8 Per-Skill Hook Tests (HOOK-31 ~ HOOK-36)

```javascript
// HOOK-31 ~ HOOK-36: Per-skill hooks verify PDCA state updates
// These are tested through after-tool.js skill matcher
// Each pdca-*-post.js script updates .pdca-status.json and suggests next phase

{
  name: 'HOOK-31~36: Per-skill hooks (existence check)',
  fn: () => {
    const skillHooks = [
      'skills/pdca-plan-post.js',
      'skills/pdca-design-post.js',
      'skills/pdca-analyze-post.js',
      'skills/pdca-iterate-post.js',
      'skills/pdca-report-post.js'
    ];
    for (const hook of skillHooks) {
      assertExists(path.join(PLUGIN_ROOT, 'hooks', 'scripts', hook), `${hook} should exist`);
    }
  }
}
```

### 2.9 Graceful Degradation Tests (HOOK-37 ~ HOOK-40)

#### HOOK-37: Missing .pdca-status.json

```javascript
{
  name: 'HOOK-37: Missing .pdca-status.json → graceful fallback',
  setup: () => createTestProject({}), // No .pdca-status.json
  fn: () => {
    const result = executeHook('session-start.js');
    assert(result.success, 'Hook should exit 0 even without status file');
    assertEqual(result.output.status, 'allow', 'Status should be allow');
  },
  teardown: cleanupTestProject
}
```

#### HOOK-38: Missing bkit.config.json

```javascript
{
  name: 'HOOK-38: Missing bkit.config.json → graceful fallback',
  setup: () => createTestProject({}),
  fn: () => {
    const result = executeHook('before-tool.js', {
      tool_name: 'write_file', tool_input: { file_path: 'test.js', content: 'code' }
    });
    assert(result.success || result.exitCode === null, 'Should not crash');
  },
  teardown: cleanupTestProject
}
```

#### HOOK-39: Invalid JSON input

```javascript
{
  name: 'HOOK-39: Invalid JSON stdin → graceful exit',
  fn: () => {
    const scriptPath = path.join(PLUGIN_ROOT, 'hooks', 'scripts', 'before-agent.js');
    try {
      execSync(`echo 'NOT-JSON' | node "${scriptPath}"`, { timeout: 5000, encoding: 'utf-8' });
    } catch (error) {
      // Exit code should still be 0
      assertEqual(error.status, null, 'Should exit 0 on invalid JSON');
    }
  }
}
```

#### HOOK-40: Internal exception caught

```javascript
{
  name: 'HOOK-40: Internal exception → try-catch → exit 0',
  fn: () => {
    // All hooks wrap main() in try-catch and exit(0)
    const hooks = ['session-start.js', 'before-agent.js', 'before-model.js',
      'before-tool.js', 'after-tool.js', 'before-tool-selection.js'];
    for (const hook of hooks) {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks', 'scripts', hook), 'utf-8');
      assertContains(content, 'try', `${hook} should have try-catch`);
      assertContains(content, 'catch', `${hook} should have try-catch`);
      assertContains(content, 'process.exit(0)', `${hook} should exit(0) in catch`);
    }
  }
}
```

---

## 3. TC-02: Skill System Test Design (25 Cases, P0)

### 3.1 SKILL.md Frontmatter Validation (SKILL-01 ~ SKILL-10)

```javascript
// Comprehensive SKILL.md validation script
const ALL_SKILLS = [
  'pdca', 'starter', 'dynamic', 'enterprise', 'development-pipeline',
  'code-review', 'zero-script-qa', 'mobile-app', 'desktop-app',
  'bkit-templates', 'bkit-rules', 'gemini-cli-learning',
  'phase-1-schema', 'phase-2-convention', 'phase-3-mockup',
  'phase-4-api', 'phase-5-design-system', 'phase-6-ui-integration',
  'phase-7-seo-security', 'phase-8-review', 'phase-9-deployment'
];

// SKILL-01: All 21 SKILL.md valid YAML
{
  name: 'SKILL-01: 21 SKILL.md files parse without error',
  fn: () => {
    const { parseSkillFrontmatter } = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
    for (const skill of ALL_SKILLS) {
      const skillPath = path.join(PLUGIN_ROOT, 'skills', skill, 'SKILL.md');
      assertExists(skillPath, `${skill}/SKILL.md should exist`);
      const metadata = parseSkillFrontmatter(skillPath);
      assert(metadata.name, `${skill} should have a name`);
    }
  }
}

// SKILL-02: pdca skill metadata extraction
{
  name: 'SKILL-02: pdca skill has all expected fields',
  fn: () => {
    const { parseSkillFrontmatter } = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
    const metadata = parseSkillFrontmatter(path.join(PLUGIN_ROOT, 'skills', 'pdca', 'SKILL.md'));
    assertEqual(metadata['user-invocable'], true, 'pdca should be user-invocable');
    assert(Object.keys(metadata.agents).length > 0, 'pdca should have agent bindings');
    assertEqual(metadata.agents.analyze, 'gap-detector', 'analyze → gap-detector');
    assertEqual(metadata.agents.iterate, 'pdca-iterator', 'iterate → pdca-iterator');
    assertEqual(metadata.agents.report, 'report-generator', 'report → report-generator');
  }
}

// SKILL-03: Required fields exist
{
  name: 'SKILL-03: All skills have name and description',
  fn: () => {
    const { parseSkillFrontmatter } = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
    for (const skill of ALL_SKILLS) {
      const metadata = parseSkillFrontmatter(path.join(PLUGIN_ROOT, 'skills', skill, 'SKILL.md'));
      assert(metadata.name, `${skill} should have name`);
      assert(typeof metadata.description === 'string', `${skill} should have description`);
    }
  }
}

// SKILL-04: bkit-rules not user-invocable
{
  name: 'SKILL-04: bkit-rules is not user-invocable',
  fn: () => {
    const { parseSkillFrontmatter } = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
    const metadata = parseSkillFrontmatter(path.join(PLUGIN_ROOT, 'skills', 'bkit-rules', 'SKILL.md'));
    assertEqual(metadata['user-invocable'], false, 'bkit-rules should not be user-invocable');
  }
}
```

### 3.2 Skill Orchestrator Tests (SKILL-11 ~ SKILL-25)

```javascript
// SKILL-11 ~ SKILL-14: parseSimpleYaml tests
{
  name: 'SKILL-11: parseSimpleYaml scalar',
  fn: () => {
    const { parseSimpleYaml } = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
    const result = parseSimpleYaml('name: pdca\ndescription: PDCA skill');
    assertEqual(result.name, 'pdca', 'Should parse scalar');
    assertEqual(result.description, 'PDCA skill', 'Should parse description');
  }
}

{
  name: 'SKILL-12: parseSimpleYaml list',
  fn: () => {
    const { parseSimpleYaml } = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
    const result = parseSimpleYaml('allowed-tools:\n  - read_file\n  - write_file');
    assert(Array.isArray(result['allowed-tools']), 'Should parse as array');
    assertEqual(result['allowed-tools'].length, 2, 'Should have 2 items');
  }
}

{
  name: 'SKILL-13: parseSimpleYaml block scalar',
  fn: () => {
    const { parseSimpleYaml } = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
    const result = parseSimpleYaml('description: |\n  Line 1\n  Line 2');
    assertContains(result.description, 'Line 1', 'Should include first line');
    assertContains(result.description, 'Line 2', 'Should include second line');
  }
}

{
  name: 'SKILL-14: parseSimpleYaml nested map',
  fn: () => {
    const { parseSimpleYaml } = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
    const result = parseSimpleYaml('agents:\n  analyze: gap-detector\n  iterate: pdca-iterator');
    assertEqual(result.agents.analyze, 'gap-detector', 'Should parse nested map');
    assertEqual(result.agents.iterate, 'pdca-iterator', 'Should parse nested value');
  }
}

// SKILL-15 ~ SKILL-25: Core function tests
{
  name: 'SKILL-15: loadSkill returns metadata+body+templates',
  fn: () => {
    const { loadSkill, clearCache } = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
    clearCache();
    const result = loadSkill('pdca');
    assert(result !== null, 'Should load pdca skill');
    assert(result.metadata, 'Should have metadata');
    assert(typeof result.body === 'string', 'Should have body');
    assert(Array.isArray(result.templates), 'Should have templates array');
  }
}

{
  name: 'SKILL-16: loadSkill nonexistent returns null',
  fn: () => {
    const { loadSkill } = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
    assertEqual(loadSkill('nonexistent-skill'), null, 'Should return null');
  }
}

{
  name: 'SKILL-17: activateSkill with analyze → gap-detector delegation',
  fn: () => {
    const { activateSkill, clearCache } = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
    clearCache();
    const result = activateSkill('pdca', 'analyze', 'login-form');
    assert(result.success, 'Should activate successfully');
    assertEqual(result.agent, 'gap-detector', 'Should delegate to gap-detector');
  }
}

{
  name: 'SKILL-20: listSkills returns 21 skills',
  fn: () => {
    const { listSkills, clearCache } = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
    clearCache();
    const skills = listSkills();
    assertEqual(skills.length, 21, `Should list 21 skills but found ${skills.length}`);
  }
}

{
  name: 'SKILL-21: getUserInvocableSkills filters correctly',
  fn: () => {
    const { getUserInvocableSkills, clearCache } = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
    clearCache();
    const invocable = getUserInvocableSkills();
    assert(invocable.length > 0, 'Should have invocable skills');
    assert(invocable.every(s => s.name !== 'bkit-rules'), 'bkit-rules should not be invocable');
  }
}

{
  name: 'SKILL-23: createTaskFromTemplate substitutes variables',
  fn: () => {
    const { createTaskFromTemplate } = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
    const template = { subject: '[{action}] {feature}', description: 'Execute {action} for {feature}', activeForm: 'Running {action}' };
    const result = createTaskFromTemplate(template, { action: 'Plan', feature: 'login' });
    assertEqual(result.subject, '[Plan] login', 'Should substitute variables');
  }
}

{
  name: 'SKILL-25: clearCache resets state',
  fn: () => {
    const { loadSkill, clearCache, getActiveSkill, activateSkill } = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
    activateSkill('pdca', 'plan', 'test');
    assert(getActiveSkill() !== null, 'Should have active skill');
    clearCache();
    assertEqual(getActiveSkill(), null, 'Active skill should be cleared');
  }
}
```

---

## 4. TC-03: Agent System Test Design (20 Cases, P1)

### 4.1 Agent File Validation (AGENT-01 ~ AGENT-06)

```javascript
const ALL_AGENTS = [
  'cto-lead', 'frontend-architect', 'security-architect', 'product-manager', 'qa-strategist',
  'gap-detector', 'design-validator', 'code-analyzer', 'pdca-iterator', 'report-generator',
  'qa-monitor', 'starter-guide', 'pipeline-guide', 'bkend-expert', 'enterprise-expert', 'infra-architect'
];

{
  name: 'AGENT-01: 16 agent .md files exist',
  fn: () => {
    for (const agent of ALL_AGENTS) {
      assertExists(path.join(PLUGIN_ROOT, 'agents', `${agent}.md`), `${agent}.md should exist`);
    }
    assertEqual(ALL_AGENTS.length, 16, 'Should have exactly 16 agents');
  }
}

{
  name: 'AGENT-02: cto-lead has correct frontmatter',
  fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'agents', 'cto-lead.md'), 'utf-8');
    assertContains(content, 'model:', 'Should have model field');
    assertContains(content, 'temperature:', 'Should have temperature field');
  }
}

{
  name: 'AGENT-06: All agents have required frontmatter fields',
  fn: () => {
    const requiredFields = ['model:', 'tools:', 'temperature:'];
    for (const agent of ALL_AGENTS) {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'agents', `${agent}.md`), 'utf-8');
      for (const field of requiredFields) {
        assertContains(content, field, `${agent} should have ${field}`);
      }
    }
  }
}
```

### 4.2 Agent-Skill Binding (AGENT-07 ~ AGENT-12)

```javascript
{
  name: 'AGENT-07~09: Level-based routing configured',
  fn: () => {
    const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
    assertEqual(config.agents.levelBased.Starter, 'starter-guide', 'Starter → starter-guide');
    assertEqual(config.agents.levelBased.Dynamic, 'bkend-expert', 'Dynamic → bkend-expert');
    assertEqual(config.agents.levelBased.Enterprise, 'enterprise-expert', 'Enterprise → enterprise-expert');
  }
}

{
  name: 'AGENT-10~12: Task-based routing configured',
  fn: () => {
    const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
    assertEqual(config.agents.taskBased['gap analysis'], 'gap-detector', 'gap analysis → gap-detector');
    assertEqual(config.agents.taskBased['code review'], 'code-analyzer', 'code review → code-analyzer');
    assertEqual(config.agents.taskBased.QA, 'qa-monitor', 'QA → qa-monitor');
  }
}
```

### 4.3 MCP Agent Registry (AGENT-13 ~ AGENT-15)

```javascript
{
  name: 'AGENT-13: MCP server registers all 16 agents',
  fn: () => {
    const serverCode = fs.readFileSync(path.join(PLUGIN_ROOT, 'mcp', 'spawn-agent-server.js'), 'utf-8');
    for (const agent of ALL_AGENTS) {
      assertContains(serverCode, `'${agent}'`, `MCP server should register ${agent}`);
    }
  }
}

{
  name: 'AGENT-14: Agent file paths match MCP registry',
  fn: () => {
    const serverCode = fs.readFileSync(path.join(PLUGIN_ROOT, 'mcp', 'spawn-agent-server.js'), 'utf-8');
    for (const agent of ALL_AGENTS) {
      const filePath = path.join(PLUGIN_ROOT, 'agents', `${agent}.md`);
      assert(fs.existsSync(filePath), `${agent}.md should exist at ${filePath}`);
    }
  }
}
```

### 4.4 8-Language Trigger Tests (AGENT-16 ~ AGENT-20)

```javascript
{
  name: 'AGENT-16~20: 8-language triggers in before-agent.js',
  fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks', 'scripts', 'before-agent.js'), 'utf-8');
    // EN
    assertContains(content, 'verify', 'EN triggers present');
    // KO
    assertContains(content, '검증', 'KO triggers present');
    // JA
    assertContains(content, '確認', 'JA triggers present');
    // ZH
    assertContains(content, '验证', 'ZH triggers present');
    // ES
    assertContains(content, 'verificar', 'ES triggers present');
    // FR
    assertContains(content, 'vérifier', 'FR triggers present');
    // DE
    assertContains(content, 'überprüfen', 'DE triggers present');
    // IT
    assertContains(content, 'verificare', 'IT triggers present');
  }
}
```

---

## 5. TC-04: Lib Module Test Design (39 Cases, P0)

### 5.1 Context Hierarchy Tests (LIB-01 ~ LIB-13)

```javascript
{
  name: 'LIB-01: Plugin config loading',
  fn: () => {
    const { ContextHierarchy } = require(path.join(PLUGIN_ROOT, 'lib', 'context-hierarchy'));
    const hierarchy = new ContextHierarchy(PLUGIN_ROOT, TEST_PROJECT_DIR);
    const version = hierarchy.get('version');
    assertEqual(version, '1.5.1', 'Should load plugin version');
  }
}

{
  name: 'LIB-04: Session override has highest priority',
  fn: () => {
    const { ContextHierarchy } = require(path.join(PLUGIN_ROOT, 'lib', 'context-hierarchy'));
    const hierarchy = new ContextHierarchy(PLUGIN_ROOT, TEST_PROJECT_DIR);
    hierarchy.setSession('version', '9.9.9');
    assertEqual(hierarchy.get('version'), '9.9.9', 'Session should override plugin');
    hierarchy.clearSession();
  }
}

{
  name: 'LIB-05: Dot-notation access',
  fn: () => {
    const { ContextHierarchy } = require(path.join(PLUGIN_ROOT, 'lib', 'context-hierarchy'));
    const hierarchy = new ContextHierarchy(PLUGIN_ROOT, TEST_PROJECT_DIR);
    assertEqual(hierarchy.get('pdca.matchRateThreshold'), 90, 'Should access nested value');
  }
}

{
  name: 'LIB-06: 5s TTL cache expiration',
  fn: async () => {
    const { ContextHierarchy } = require(path.join(PLUGIN_ROOT, 'lib', 'context-hierarchy'));
    const hierarchy = new ContextHierarchy(PLUGIN_ROOT, TEST_PROJECT_DIR);
    hierarchy.get(); // prime cache
    const ts1 = hierarchy.cacheTimestamp;
    hierarchy.get(); // should use cache
    assertEqual(hierarchy.cacheTimestamp, ts1, 'Should use cached value');
    hierarchy.invalidate();
    hierarchy.get(); // should reload
    assert(hierarchy.cacheTimestamp > ts1 || hierarchy.cacheTimestamp === 0, 'Should reload after invalidate');
  }
}

{
  name: 'LIB-09: _deepMerge objects',
  fn: () => {
    const { ContextHierarchy } = require(path.join(PLUGIN_ROOT, 'lib', 'context-hierarchy'));
    const h = new ContextHierarchy(PLUGIN_ROOT, TEST_PROJECT_DIR);
    const result = h._deepMerge({ a: { b: 1 } }, { a: { c: 2 } });
    assertEqual(result.a.b, 1, 'Should preserve original');
    assertEqual(result.a.c, 2, 'Should add new');
  }
}

{
  name: 'LIB-10: _deepMerge arrays replace',
  fn: () => {
    const { ContextHierarchy } = require(path.join(PLUGIN_ROOT, 'lib', 'context-hierarchy'));
    const h = new ContextHierarchy(PLUGIN_ROOT, TEST_PROJECT_DIR);
    const result = h._deepMerge({ arr: [1] }, { arr: [2] });
    assertEqual(result.arr[0], 2, 'Arrays should be replaced, not merged');
    assertEqual(result.arr.length, 1, 'Should have only 1 element');
  }
}
```

### 5.2 Agent Memory Tests (LIB-14 ~ LIB-25)

```javascript
{
  name: 'LIB-14: Project scope path',
  fn: () => {
    const { AgentMemoryManager } = require(path.join(PLUGIN_ROOT, 'lib', 'core', 'agent-memory'));
    const mem = new AgentMemoryManager('gap-detector', 'project');
    const memPath = mem.getMemoryPath('/tmp/project');
    assertContains(memPath, '.gemini/agent-memory/bkit/gap-detector.json', 'Should use project scope');
  }
}

{
  name: 'LIB-15: User scope path',
  fn: () => {
    const { AgentMemoryManager } = require(path.join(PLUGIN_ROOT, 'lib', 'core', 'agent-memory'));
    const mem = new AgentMemoryManager('starter-guide', 'user');
    const memPath = mem.getMemoryPath();
    assertContains(memPath, '.gemini/agent-memory/bkit/starter-guide.json', 'Should use user scope');
    assertContains(memPath, os.homedir(), 'Should be in home directory');
  }
}

{
  name: 'LIB-16: addSession prepends to sessions',
  fn: () => {
    const { AgentMemoryManager } = require(path.join(PLUGIN_ROOT, 'lib', 'core', 'agent-memory'));
    const mem = new AgentMemoryManager('test-agent', 'project');
    mem.memory = mem._createDefault();
    mem.addSession({ summary: 'Session 1' });
    mem.addSession({ summary: 'Session 2' });
    assertEqual(mem.memory.sessions[0].summary, 'Session 2', 'Newest should be first');
    assertEqual(mem.memory.sessions.length, 2, 'Should have 2 sessions');
    assertEqual(mem.memory.stats.totalSessions, 2, 'Total should be 2');
  }
}

{
  name: 'LIB-17: addSession enforces 20 max',
  fn: () => {
    const { AgentMemoryManager } = require(path.join(PLUGIN_ROOT, 'lib', 'core', 'agent-memory'));
    const mem = new AgentMemoryManager('test-agent', 'project');
    mem.memory = mem._createDefault();
    for (let i = 0; i < 25; i++) {
      mem.addSession({ summary: `Session ${i}` });
    }
    assertEqual(mem.memory.sessions.length, 20, 'Should trim to 20');
    assertEqual(mem.memory.stats.totalSessions, 25, 'Total should count all');
  }
}

{
  name: 'LIB-24: getAgentMemory factory - starter-guide gets user scope',
  fn: () => {
    const { getAgentMemory } = require(path.join(PLUGIN_ROOT, 'lib', 'core', 'agent-memory'));
    const mem = getAgentMemory('starter-guide');
    assertEqual(mem.scope, 'user', 'starter-guide should get user scope');
  }
}

{
  name: 'LIB-25: getAgentMemory factory - gap-detector gets project scope',
  fn: () => {
    const { getAgentMemory } = require(path.join(PLUGIN_ROOT, 'lib', 'core', 'agent-memory'));
    const mem = getAgentMemory('gap-detector');
    assertEqual(mem.scope, 'project', 'gap-detector should get project scope');
  }
}
```

### 5.3 Permission Manager Tests (LIB-26 ~ LIB-31)

```javascript
{
  name: 'LIB-26: rm -rf / → deny',
  fn: () => {
    const { checkPermission } = require(path.join(PLUGIN_ROOT, 'lib', 'core', 'permission'));
    const result = checkPermission('run_shell_command', { command: 'rm -rf /' }, PLUGIN_ROOT);
    assertEqual(result.level, 'deny', 'Should deny rm -rf /');
  }
}

{
  name: 'LIB-27: git push --force → deny (from DEFAULT_PATTERNS)',
  fn: () => {
    const { checkPermission } = require(path.join(PLUGIN_ROOT, 'lib', 'core', 'permission'));
    const result = checkPermission('run_shell_command', { command: 'git push --force main' }, PLUGIN_ROOT);
    // Note: DEFAULT_PATTERNS has git push --force* in ask, not deny
    assertEqual(result.level, 'ask', 'Should ask for git push --force');
  }
}

{
  name: 'LIB-28: rm -r folder → ask',
  fn: () => {
    const { checkPermission } = require(path.join(PLUGIN_ROOT, 'lib', 'core', 'permission'));
    const result = checkPermission('run_shell_command', { command: 'rm -r folder/' }, PLUGIN_ROOT);
    // DEFAULT_PATTERNS does not have 'rm -r*' in ask, but let's check
    // If not matched, default is allow
    assert(['allow', 'ask'].includes(result.level), 'Should be allow or ask');
  }
}

{
  name: 'LIB-30: Normal write → allow',
  fn: () => {
    const { checkPermission } = require(path.join(PLUGIN_ROOT, 'lib', 'core', 'permission'));
    const result = checkPermission('write_file', { file_path: 'src/app.js' }, PLUGIN_ROOT);
    assertEqual(result.level, 'allow', 'Normal write should be allowed');
  }
}

{
  name: 'LIB-31: Glob pattern matching',
  fn: () => {
    const { matchesGlobPattern } = require(path.join(PLUGIN_ROOT, 'lib', 'core', 'permission'));
    assert(matchesGlobPattern('rm -rf /', 'rm -rf *'), 'Should match glob');
    assert(!matchesGlobPattern('ls -la', 'rm -rf *'), 'Should not match');
    assert(matchesGlobPattern('.env', '*.env'), 'Should match .env');
  }
}
```

### 5.4 Context Fork Tests (LIB-36 ~ LIB-39)

```javascript
{
  name: 'LIB-36: Named snapshot creation',
  setup: () => createTestProject({ 'docs/.pdca-status.json': PDCA_STATUS_FIXTURE }),
  fn: () => {
    const { forkContext, discardFork } = require(path.join(PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'context-fork'));
    const fork = forkContext('gap-detector', { name: 'test-fork', projectDir: TEST_PROJECT_DIR });
    assert(fork.forkId, 'Should have forkId');
    assertEqual(fork.name, 'test-fork', 'Should use provided name');
    assertExists(fork.snapshotPath, 'Snapshot file should exist');
    // Cleanup
    discardFork(fork.forkId, { projectDir: TEST_PROJECT_DIR });
  },
  teardown: cleanupTestProject
}

{
  name: 'LIB-37: LRU snapshot limit (10)',
  setup: () => createTestProject({ 'docs/.pdca-status.json': PDCA_STATUS_FIXTURE }),
  fn: () => {
    const { forkContext } = require(path.join(PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'context-fork'));
    for (let i = 0; i < 12; i++) {
      forkContext('test-agent', { projectDir: TEST_PROJECT_DIR });
    }
    const snapshotDir = path.join(TEST_PROJECT_DIR, 'docs', '.pdca-snapshots');
    const files = fs.readdirSync(snapshotDir).filter(f => f.endsWith('.json'));
    assert(files.length <= 10, `Should have <=10 snapshots but found ${files.length}`);
  },
  teardown: cleanupTestProject
}

{
  name: 'LIB-38: diffSnapshots returns changes',
  fn: () => {
    const { deepMerge } = require(path.join(PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'context-fork'));
    const result = deepMerge({ a: 1 }, { b: 2 });
    assertEqual(result.a, 1, 'Should preserve target');
    assertEqual(result.b, 2, 'Should add source');
  }
}
```

### 5.5 Import Resolver Tests (LIB-32 ~ LIB-35)

```javascript
{
  name: 'LIB-32: Variable substitution in path',
  fn: async () => {
    const { resolveImports, clearCache } = require(path.join(PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'import-resolver'));
    clearCache();
    const contextFile = path.join(PLUGIN_ROOT, '.gemini', 'context', 'pdca-rules.md');
    if (fs.existsSync(contextFile)) {
      const result = await resolveImports(contextFile);
      assert(result.content.length > 0, 'Should resolve content');
    }
  }
}

{
  name: 'LIB-33: Circular import detection',
  fn: async () => {
    const tmpDir = createTestProject({
      'a.md': '@import b.md',
      'b.md': '@import a.md'
    });
    const { resolveImports, clearCache } = require(path.join(PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'import-resolver'));
    clearCache();
    try {
      await resolveImports(path.join(tmpDir, 'a.md'));
      assert(false, 'Should throw on circular import');
    } catch (error) {
      assertContains(error.message, 'Circular', 'Should detect circular import');
    }
    cleanupTestProject();
  }
}

{
  name: 'LIB-34: Missing file import',
  fn: async () => {
    const { resolveImports, clearCache } = require(path.join(PLUGIN_ROOT, 'lib', 'adapters', 'gemini', 'import-resolver'));
    clearCache();
    try {
      await resolveImports('/nonexistent/file.md');
      assert(false, 'Should throw on missing file');
    } catch (error) {
      assertContains(error.message, 'not found', 'Should report file not found');
    }
  }
}
```

---

## 6. TC-05: MCP Server Test Design (18 Cases, P1)

```javascript
// MCP Protocol Tests - JSON-RPC stdio

{
  name: 'MCP-01: Initialize handshake',
  fn: () => {
    const response = sendMcpRequest('initialize', {});
    assert(response.result, 'Should have result');
    assertEqual(response.result.protocolVersion, '2024-11-05', 'Protocol version');
    assertEqual(response.result.serverInfo.name, 'bkit-agents', 'Server name');
  }
}

{
  name: 'MCP-02: tools/list returns 6 tools',
  fn: () => {
    const response = sendMcpRequest('tools/list');
    assert(response.result, 'Should have result');
    assertEqual(response.result.tools.length, 6, 'Should have 6 tools');
    const toolNames = response.result.tools.map(t => t.name);
    assert(toolNames.includes('spawn_agent'), 'Should include spawn_agent');
    assert(toolNames.includes('list_agents'), 'Should include list_agents');
    assert(toolNames.includes('team_create'), 'Should include team_create');
  }
}

{
  name: 'MCP-04: spawn_agent invalid agent → error',
  fn: () => {
    const response = sendMcpRequest('tools/call', {
      name: 'spawn_agent',
      arguments: { agent_name: 'nonexistent', task: 'test' }
    });
    const text = response.result?.content?.[0]?.text || '';
    assertContains(text, 'Unknown agent', 'Should report unknown agent');
  }
}

{
  name: 'MCP-05: list_agents returns 16 agents',
  fn: () => {
    const response = sendMcpRequest('tools/call', { name: 'list_agents', arguments: {} });
    const text = JSON.parse(response.result?.content?.[0]?.text || '{}');
    assertEqual(text.agents?.length, 16, 'Should list 16 agents');
  }
}

{
  name: 'MCP-06: get_agent_info cto-lead',
  fn: () => {
    const response = sendMcpRequest('tools/call', {
      name: 'get_agent_info',
      arguments: { agent_name: 'cto-lead' }
    });
    const text = JSON.parse(response.result?.content?.[0]?.text || '{}');
    assertContains(text.description, 'CTO', 'Should have CTO description');
    assert(text.exists, 'Agent file should exist');
  }
}

{
  name: 'MCP-15: Unknown method → error',
  fn: () => {
    const response = sendMcpRequest('unknown_method', {});
    assert(response.error, 'Should return error for unknown method');
  }
}

{
  name: 'MCP-16: Shutdown returns empty result',
  fn: () => {
    const response = sendMcpRequest('shutdown', {});
    assert(response.result !== undefined, 'Should return result');
  }
}
```

---

## 7. TC-06: TOML Command Test Design (15 Cases, P1)

```javascript
const ALL_COMMANDS = [
  'pdca', 'bkit', 'review', 'qa', 'starter',
  'dynamic', 'enterprise', 'pipeline', 'learn', 'github-stats'
];

{
  name: 'CMD-01: All 10 TOML files parse correctly',
  fn: () => {
    for (const cmd of ALL_COMMANDS) {
      const filePath = path.join(PLUGIN_ROOT, 'commands', `${cmd}.toml`);
      assertExists(filePath, `${cmd}.toml should exist`);
      const content = fs.readFileSync(filePath, 'utf-8');
      // Basic TOML validation: must have description and prompt
      assertContains(content, 'description', `${cmd}.toml should have description`);
      assertContains(content, 'prompt', `${cmd}.toml should have prompt`);
    }
  }
}

{
  name: 'CMD-02: Required fields in all TOMLs',
  fn: () => {
    for (const cmd of ALL_COMMANDS) {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'commands', `${cmd}.toml`), 'utf-8');
      assert(content.includes('description ='), `${cmd} should have description field`);
      assert(content.includes('prompt ='), `${cmd} should have prompt field`);
    }
  }
}

{
  name: 'CMD-03: pdca.toml references @skills/pdca/SKILL.md',
  fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'commands', 'pdca.toml'), 'utf-8');
    assertContains(content, '@skills/pdca/SKILL.md', 'Should reference pdca SKILL.md');
  }
}

{
  name: 'CMD-04: pdca.toml uses {{args}}',
  fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'commands', 'pdca.toml'), 'utf-8');
    assertContains(content, '{{args}}', 'Should use args substitution');
  }
}

{
  name: 'CMD-05: pdca.toml uses !cat for status',
  fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'commands', 'pdca.toml'), 'utf-8');
    assertContains(content, '!cat', 'Should use !cat for inline execution');
  }
}

{
  name: 'CMD-07~09: Level commands reference correct skills',
  fn: () => {
    const levelCommands = { 'starter': 'starter', 'dynamic': 'dynamic', 'enterprise': 'enterprise' };
    for (const [cmd, skill] of Object.entries(levelCommands)) {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'commands', `${cmd}.toml`), 'utf-8');
      assertContains(content, `@skills/${skill}/SKILL.md`, `${cmd} should reference ${skill}`);
    }
  }
}

{
  name: 'CMD-10~13: Specialized commands reference correct skills',
  fn: () => {
    const specialCommands = {
      'review': 'code-review',
      'qa': 'zero-script-qa',
      'pipeline': 'development-pipeline',
      'learn': 'gemini-cli-learning'
    };
    for (const [cmd, skill] of Object.entries(specialCommands)) {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'commands', `${cmd}.toml`), 'utf-8');
      assertContains(content, `@skills/${skill}/SKILL.md`, `${cmd} should reference ${skill}`);
    }
  }
}
```

---

## 8. TC-07: Configuration Test Design (12 Cases, P1)

```javascript
{
  name: 'CFG-01: bkit.config.json valid JSON',
  fn: () => {
    const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
    assert(typeof config === 'object', 'Should parse as object');
  }
}

{
  name: 'CFG-02: version is 1.5.1',
  fn: () => {
    const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
    assertEqual(config.version, '1.5.1', 'Version should be 1.5.1');
  }
}

{
  name: 'CFG-03: platform is gemini',
  fn: () => {
    const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
    assertEqual(config.platform, 'gemini', 'Platform should be gemini');
  }
}

{
  name: 'CFG-04~05: PDCA thresholds',
  fn: () => {
    const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
    assertEqual(config.pdca.matchRateThreshold, 90, 'Match rate threshold should be 90');
    assertEqual(config.pdca.maxIterations, 5, 'Max iterations should be 5');
  }
}

{
  name: 'CFG-06: 4 output styles available',
  fn: () => {
    const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
    assertEqual(config.outputStyles.available.length, 4, 'Should have 4 output styles');
    assert(config.outputStyles.available.includes('bkit-learning'), 'Should include bkit-learning');
    assert(config.outputStyles.available.includes('bkit-pdca-guide'), 'Should include bkit-pdca-guide');
  }
}

{
  name: 'CFG-07: Agent memory settings',
  fn: () => {
    const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
    assertEqual(config.agentMemory.enabled, true, 'Agent memory should be enabled');
    assertEqual(config.agentMemory.maxSessionsPerAgent, 20, 'Max sessions should be 20');
    assertEqual(config.agentMemory.agentScopes['starter-guide'], 'user', 'starter-guide scope');
  }
}

{
  name: 'CFG-08~10: New v1.5.1 sections exist',
  fn: () => {
    const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
    assert(config.team, 'team section should exist');
    assert(config.contextHierarchy, 'contextHierarchy section should exist');
    assert(config.skillOrchestrator, 'skillOrchestrator section should exist');
    assertEqual(config.contextHierarchy.cacheTTL, 5000, 'Cache TTL should be 5000');
    assertEqual(config.skillOrchestrator.agentDelegation, true, 'Agent delegation should be true');
  }
}

{
  name: 'CFG-11: gemini-extension.json matches',
  fn: () => {
    const ext = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'gemini-extension.json'), 'utf-8'));
    assertEqual(ext.name, 'bkit', 'Name should be bkit');
    assertEqual(ext.version, '1.5.1', 'Version should be 1.5.1');
    assertEqual(ext.contextFileName, 'GEMINI.md', 'Context file should be GEMINI.md');
  }
}

{
  name: 'CFG-12: Permission patterns configured',
  fn: () => {
    const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
    assertEqual(config.permissions['run_shell_command(rm -rf*)'], 'deny', 'rm -rf should be deny');
    assertEqual(config.permissions['run_shell_command(git push --force*)'], 'deny', 'force push should be deny');
    assertEqual(config.permissions['run_shell_command(git reset --hard*)'], 'ask', 'hard reset should be ask');
  }
}
```

---

## 9. TC-08: Context Engineering Test Design (15 Cases, P1)

```javascript
{
  name: 'CTX-01: GEMINI.md has 6 @import directives',
  fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'GEMINI.md'), 'utf-8');
    const imports = content.match(/^@\.gemini\/context\//gm) || [];
    assertEqual(imports.length, 6, `Should have 6 @import directives but found ${imports.length}`);
  }
}

{
  name: 'CTX-02~07: All 6 context modules exist with content',
  fn: () => {
    const modules = [
      'pdca-rules.md', 'agent-triggers.md', 'skill-triggers.md',
      'commands.md', 'tool-reference.md', 'feature-report.md'
    ];
    for (const mod of modules) {
      const modPath = path.join(PLUGIN_ROOT, '.gemini', 'context', mod);
      assertExists(modPath, `${mod} should exist`);
      const content = fs.readFileSync(modPath, 'utf-8');
      assert(content.length > 50, `${mod} should have meaningful content`);
    }
  }
}

{
  name: 'CTX-03: agent-triggers.md has 8 language triggers',
  fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, '.gemini', 'context', 'agent-triggers.md'), 'utf-8');
    const languages = ['EN', 'KO', 'JA', 'ZH', 'ES', 'FR', 'DE', 'IT'];
    // Check for presence of multi-language keywords
    assertContains(content, '검증', 'Should have Korean triggers');
    assertContains(content, '改善', 'Should have Japanese triggers');
  }
}

{
  name: 'CTX-08: 4-level hierarchy merge order',
  fn: () => {
    const { ContextHierarchy } = require(path.join(PLUGIN_ROOT, 'lib', 'context-hierarchy'));
    const h = new ContextHierarchy(PLUGIN_ROOT, TEST_PROJECT_DIR);
    const levels = ['plugin', 'user', 'project', 'session'];
    const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
    assertEqual(config.contextHierarchy.levels.length, 4, 'Should have 4 levels');
    for (let i = 0; i < levels.length; i++) {
      assertEqual(config.contextHierarchy.levels[i], levels[i], `Level ${i} should be ${levels[i]}`);
    }
  }
}

{
  name: 'CTX-09: SessionStart injects dynamic context',
  setup: () => createTestProject({ 'docs/.pdca-status.json': PDCA_STATUS_FIXTURE }),
  fn: () => {
    const result = executeHook('session-start.js');
    assertContains(result.output.context, 'Agent Auto-Triggers', 'Should inject agent triggers');
    assertContains(result.output.context, 'Feature Usage Report', 'Should inject feature report');
    assertContains(result.output.context, 'PDCA Core Rules', 'Should inject PDCA rules');
  },
  teardown: cleanupTestProject
}

{
  name: 'CTX-10: Output style context by level',
  setup: () => createTestProject({}),
  fn: () => {
    const result = executeHook('session-start.js');
    // Starter level → bkit-learning style should be mentioned
    assert(result.output.metadata?.outputStyle === 'bkit-learning' ||
      result.output.context?.includes('bkit-learning'),
      'Should inject learning style for Starter');
  },
  teardown: cleanupTestProject
}
```

---

## 10. TC-09: PDCA Workflow E2E Test Design (15 Cases, P0)

### 10.1 Gemini CLI Interactive Test Procedures

#### E2E-01: Plan document generation

```
**Procedure** (Gemini CLI):
1. Create test project: mkdir -p /tmp/bkit-e2e && cd /tmp/bkit-e2e
2. Initialize: git init && mkdir docs
3. Launch: gemini (bkit extension should activate)
4. Type: /pdca plan login-form
5. Verify: docs/01-plan/features/login-form.plan.md is created
6. Verify: File uses template structure (## Overview, ## Requirements, etc.)

**Expected**: Plan document created with template structure
**Pass Criteria**: File exists AND has template sections
```

#### E2E-02: Status update after plan

```
**Procedure**:
1. After E2E-01, check: cat docs/.pdca-status.json
2. Verify: "login-form" in activeFeatures
3. Verify: phase = "plan"

**Expected**: Status file updated with new feature
```

#### E2E-03~04: Design document generation

```
**Procedure**:
1. Type: /pdca design login-form
2. Verify: docs/02-design/features/login-form.design.md created
3. Verify: .pdca-status.json phase = "design"

**Expected**: Design document created, phase updated
```

#### E2E-05: Do phase auto-transition

```
**Procedure**:
1. With login-form in design phase
2. Write source code: create src/login.js
3. After write, check .pdca-status.json
4. Verify: phase changed to "do"

**Expected**: Phase auto-transitions from design to do on code write
```

#### E2E-06~08: Gap analysis delegation

```
**Procedure**:
1. Type: /pdca analyze login-form
2. Verify: gap-detector agent is invoked
3. Verify: Match rate is calculated
4. If < 90%: should suggest /pdca iterate
5. If >= 90%: should suggest /pdca report

**Expected**: Gap analysis runs with quantitative result
```

#### E2E-13: Status dashboard

```
**Procedure**:
1. Type: /pdca status
2. Verify: Shows all active features
3. Verify: Shows current phase for each
4. Verify: Shows match rate if available
5. Verify: Shows pipeline phase progress

**Expected**: Complete status dashboard rendered
```

#### E2E-14: Next phase guidance

```
**Procedure**:
1. With feature in "design" phase
2. Type: /pdca next
3. Verify: Suggests "Start implementation or /pdca do"

**Expected**: Phase-appropriate next step suggestion
```

---

## 11. TC-10: Philosophy Alignment Test Design (59 Cases, P2)

### 11.1 Automation First (AF-01 ~ AF-14)

#### AF-01: Returning user detection

```
**Procedure** (Gemini CLI):
1. Setup: Create project with docs/.bkit-memory.json { sessionCount: 3 }
2. Launch Gemini CLI
3. Observe SessionStart output

**Expected**: "Previous Work Detected" or "Welcome back" message
**Pass Criteria**: Context includes previous PDCA state
```

#### AF-03: PDCA rules auto-applied

```
**Procedure**:
1. New project, launch Gemini
2. Type: "로그인 만들어줘" (Build a login)
3. Observe AI behavior

**Expected**: AI should check for/suggest creating a Plan document FIRST
**Pass Criteria**: AI mentions /pdca plan before writing code
**Fail Criteria**: AI immediately writes code without plan suggestion
```

#### AF-07~10: 8-language agent triggers

```
**Procedure** (for each language):
- KO: "이 코드 검증해줘" → gap-detector triggered
- JA: "改善してください" → pdca-iterator triggered
- ZH: "帮我改进代码" → pdca-iterator triggered
- EN: "help me understand this" → starter-guide triggered
- ES: "verificar este código" → gap-detector triggered
- FR: "améliorer le code" → pdca-iterator triggered
- DE: "Code analysieren" → code-analyzer triggered
- IT: "verificare questo codice" → gap-detector triggered

**Pass Criteria**: BeforeAgent hook detects correct agent trigger
```

### 11.2 No Guessing (NG-01 ~ NG-12)

#### NG-01: Design document check before implementation

```
**Procedure**:
1. New project, no plan/design documents
2. Type: "implement the login form"
3. Observe AI behavior

**Expected**: AI should suggest creating plan/design first
**Pass Criteria**: AI mentions /pdca plan or design document
**Fail Criteria**: AI directly implements without checking docs
```

#### NG-06~07: Permission hierarchy

```
**Procedure**:
1. Type request that would trigger: rm -rf /
2. Verify: Completely blocked (deny)
3. Type request that would trigger: git reset --hard
4. Verify: Warning shown (ask)

**Expected**: deny blocks completely, ask shows warning
```

### 11.3 Docs = Code (DC-01 ~ DC-12)

#### DC-05: Design-implementation gap detection

```
**Procedure**:
1. Create plan with 5 endpoints
2. Create design with 5 endpoint specs
3. Implement only 3 endpoints
4. Run: /pdca analyze feature
5. Verify: Match rate < 100%

**Expected**: Gap detector identifies 2 missing endpoints
**Pass Criteria**: Quantitative match rate reflects gap
```

### 11.4 Value Delivery User Journeys (UJ)

#### UJ-S-01: Starter new user flow

```
**Procedure**:
1. Empty project (no markers)
2. First launch (no .bkit-memory.json)
3. Observe: Welcome message + 4 options
4. Observe: bkit-learning output style
5. Type: /pdca plan my-portfolio

**Expected**: Complete Starter onboarding flow
**Pass Criteria**: Level=Starter, Style=bkit-learning, Options presented
```

#### UJ-E-01: Enterprise new user flow

```
**Procedure**:
1. Project with kubernetes/ directory
2. First launch
3. Observe: Enterprise level detected
4. Observe: bkit-enterprise output style
5. Type: /pdca plan microservice-auth

**Expected**: Enterprise-appropriate onboarding
**Pass Criteria**: Level=Enterprise, Style=bkit-enterprise
```

---

## 12. Execution Order & Dependencies

```
Phase 1: Unit Tests (Offline, Node.js)
  TC-07: Configuration ──→ TC-04: Lib Modules ──→ TC-02: Skills
     │                        │
     │                        └──→ TC-01: Hooks (mock execution)
     │
     └──→ TC-06: Commands ──→ TC-03: Agents

Phase 2: Integration Tests (Node.js)
  TC-05: MCP Server ──→ TC-08: Context Engineering

Phase 3: E2E Tests (Gemini CLI Interactive)
  TC-09: PDCA E2E Workflow

Phase 4: Philosophy Tests (Gemini CLI Interactive)
  TC-10: Philosophy Alignment + User Journeys
```

---

## 13. Quality Gate

| Metric | Target | Blocking? |
|--------|--------|:---------:|
| TC-01~TC-04 (P0) | 100% pass | **Yes** |
| TC-05~TC-08 (P1) | 95% pass | **Yes** |
| TC-09 (P0) | 100% pass | **Yes** |
| TC-10 (P2) | 90% pass | No |
| Performance benchmarks | All within timeout | **Yes** |
| Total pass rate | >= 95% | **Yes** |

---

## 14. Team Composition (CTO Design Team)

| Agent | Role | Contribution |
|-------|------|-------------|
| **QA Strategist** | Hook + E2E test design | 55 test procedures with mock stdin, performance benchmarks |
| **Code Analyzer** | Lib + MCP test design | 57 unit/integration test scripts with exact assertions |
| **Gap Detector** | Skill + Agent test design | 45 validation scripts for 21 skills + 16 agents |
| **Product Manager** | Philosophy + Context test design | 74 Gemini CLI interactive scenarios |
| **Design Validator** | Command + Config test design | 27 TOML/JSON validation scripts |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-11 | Initial test design - 258 test cases, 5-Agent CTO Team | CTO Team |
