# TC-05: MCP Server Test Design (18 Cases)

> bkit-gemini v1.5.1 | Gap Detector Agent | 2026-02-11

## Test Scope

Validates spawn-agent-server.js (753 lines) MCP Server:
- JSON-RPC 2.0 protocol compliance via stdio transport
- 6 MCP tools: spawn_agent, list_agents, get_agent_info, team_create, team_assign, team_status
- AGENTS registry (16 entries) with agent file validation
- Error handling for unknown agents, missing teams, invalid inputs
- SpawnAgentServer class: initialize, tools/list, tools/call, shutdown

## Prerequisites

- Node.js >= 18
- Working directory: project root
- Tests do NOT start the actual MCP server (stdio mode would block)
- Instead, tests extract and validate server internals via source parsing and direct class instantiation

## Architecture

Since `spawn-agent-server.js` runs as a stdio MCP server, we cannot `require()` it directly (it auto-starts on load). Tests use two approaches:
1. **Source Extraction**: Parse the AGENTS registry and tool schemas from source
2. **Process Spawn**: Send JSON-RPC messages via stdin/stdout pipe for integration tests

---

## SECTION A: AGENTS Registry Validation (4 cases)

```javascript
// tests/tc-05-mcp-registry.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SERVER_PATH = path.join(ROOT, 'mcp', 'spawn-agent-server.js');
const AGENTS_DIR = path.join(ROOT, 'agents');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS: ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message });
    console.error(`  FAIL: ${name} - ${err.message}`);
  }
}

/**
 * Extract AGENTS object from server source without executing it
 */
function extractAgentsFromSource() {
  const content = fs.readFileSync(SERVER_PATH, 'utf-8');
  const agentsMatch = content.match(/const AGENTS = \{([\s\S]*?)\n\};/);
  if (!agentsMatch) throw new Error('AGENTS registry not found in source');

  const registry = {};
  const entryRegex = /'([^']+)':\s*\{\s*file:\s*'([^']+)',\s*description:\s*'([^']+)',\s*recommendedModel:\s*'([^']+)'\s*\}/g;
  let match;
  while ((match = entryRegex.exec(agentsMatch[1])) !== null) {
    registry[match[1]] = {
      file: match[2],
      description: match[3],
      recommendedModel: match[4]
    };
  }
  return registry;
}

const AGENTS = extractAgentsFromSource();

const ALL_EXPECTED_AGENTS = [
  'cto-lead', 'frontend-architect', 'security-architect', 'product-manager',
  'qa-strategist', 'gap-detector', 'design-validator', 'code-analyzer',
  'pdca-iterator', 'report-generator', 'qa-monitor', 'starter-guide',
  'pipeline-guide', 'bkend-expert', 'enterprise-expert', 'infra-architect'
];

// ═══════════════════════════════════════════════════════════════════
// MCP-01: Registry completeness
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== MCP-01: Registry completeness ===');

test('AGENTS registry has exactly 16 entries', () => {
  const count = Object.keys(AGENTS).length;
  assert.strictEqual(count, 16,
    `Expected 16 entries, got ${count}: ${Object.keys(AGENTS).join(', ')}`);
});

test('all expected agent names present', () => {
  ALL_EXPECTED_AGENTS.forEach(name => {
    assert.ok(AGENTS[name], `Missing agent: ${name}`);
  });
});

test('no unexpected agents in registry', () => {
  Object.keys(AGENTS).forEach(name => {
    assert.ok(ALL_EXPECTED_AGENTS.includes(name),
      `Unexpected agent in registry: ${name}`);
  });
});

// ═══════════════════════════════════════════════════════════════════
// MCP-02: Registry entry structure
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== MCP-02: Registry entry structure ===');

test('each entry has file, description, recommendedModel', () => {
  Object.entries(AGENTS).forEach(([name, info]) => {
    assert.ok(info.file, `${name}: missing file`);
    assert.ok(info.description, `${name}: missing description`);
    assert.ok(info.recommendedModel, `${name}: missing recommendedModel`);
    assert.ok(info.description.length >= 10,
      `${name}: description too short (${info.description.length} chars)`);
  });
});

test('file names follow {agent-name}.md convention', () => {
  Object.entries(AGENTS).forEach(([name, info]) => {
    assert.strictEqual(info.file, `${name}.md`,
      `${name}: file '${info.file}' should be '${name}.md'`);
  });
});

test('recommendedModel is valid tier', () => {
  const VALID_TIERS = ['pro', 'flash', 'flash-lite'];
  Object.entries(AGENTS).forEach(([name, info]) => {
    assert.ok(VALID_TIERS.includes(info.recommendedModel),
      `${name}: recommendedModel '${info.recommendedModel}' not in [${VALID_TIERS}]`);
  });
});

// ═══════════════════════════════════════════════════════════════════
// MCP-03: Agent files referenced by registry exist
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== MCP-03: Agent file existence ===');

test('all referenced agent files exist on disk', () => {
  Object.entries(AGENTS).forEach(([name, info]) => {
    const agentPath = path.join(AGENTS_DIR, info.file);
    assert.ok(fs.existsSync(agentPath),
      `${name}: agent file not found at ${agentPath}`);
  });
});

test('all agent files are non-empty', () => {
  Object.entries(AGENTS).forEach(([name, info]) => {
    const agentPath = path.join(AGENTS_DIR, info.file);
    const content = fs.readFileSync(agentPath, 'utf-8');
    assert.ok(content.length > 100,
      `${name}: agent file suspiciously short (${content.length} bytes)`);
  });
});

// ═══════════════════════════════════════════════════════════════════
// MCP-04: Description quality
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== MCP-04: Description quality ===');

test('descriptions are unique across agents', () => {
  const descriptions = Object.values(AGENTS).map(a => a.description);
  const unique = new Set(descriptions);
  assert.strictEqual(unique.size, descriptions.length,
    'Duplicate descriptions found');
});

test('descriptions contain no placeholder text', () => {
  Object.entries(AGENTS).forEach(([name, info]) => {
    assert.ok(!info.description.includes('TODO'),
      `${name}: description contains TODO`);
    assert.ok(!info.description.includes('placeholder'),
      `${name}: description contains placeholder`);
  });
});

// Summary
console.log('\n' + '='.repeat(60));
console.log(`MCP REGISTRY: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
}
console.log('='.repeat(60));
process.exit(failed > 0 ? 1 : 0);
```

---

## SECTION B: MCP Tool Schema Validation (4 cases)

```javascript
// tests/tc-05-mcp-tools.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SERVER_PATH = path.join(ROOT, 'mcp', 'spawn-agent-server.js');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS: ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message });
    console.error(`  FAIL: ${name} - ${err.message}`);
  }
}

/**
 * Extract handleToolsList return value from source
 * Parses the tools array definition
 */
function extractToolDefinitions() {
  const content = fs.readFileSync(SERVER_PATH, 'utf-8');

  // Extract tool names from the tools array in handleToolsList
  const toolNames = [];
  const nameRegex = /name:\s*'([^']+)'/g;
  const toolsSection = content.match(/handleToolsList\(\)[\s\S]*?return\s*\{[\s\S]*?tools:\s*\[([\s\S]*?)\]\s*\};/);

  if (toolsSection) {
    let match;
    while ((match = nameRegex.exec(toolsSection[1])) !== null) {
      toolNames.push(match[1]);
    }
  }

  return toolNames;
}

/**
 * Extract required fields from inputSchema for each tool
 */
function extractToolSchemas() {
  const content = fs.readFileSync(SERVER_PATH, 'utf-8');
  const schemas = {};

  // Find each tool definition block
  const toolBlocks = content.match(/\{[^{}]*name:\s*'([^']+)'[^{}]*inputSchema:\s*\{[^{}]*\{([^{}]*)\}[^{}]*\}[^{}]*\}/g);
  if (!toolBlocks) return schemas;

  for (const block of toolBlocks) {
    const nameMatch = block.match(/name:\s*'([^']+)'/);
    if (nameMatch) {
      const name = nameMatch[1];
      const requiredMatch = block.match(/required:\s*\[([^\]]*)\]/);
      schemas[name] = {
        required: requiredMatch
          ? requiredMatch[1].match(/'([^']+)'/g)?.map(s => s.replace(/'/g, '')) || []
          : []
      };
    }
  }

  return schemas;
}

const TOOL_NAMES = extractToolDefinitions();
const TOOL_SCHEMAS = extractToolSchemas();

// ═══════════════════════════════════════════════════════════════════
// MCP-05: Tool list completeness
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== MCP-05: Tool list completeness ===');

const EXPECTED_TOOLS = [
  'spawn_agent', 'list_agents', 'get_agent_info',
  'team_create', 'team_assign', 'team_status'
];

test('server exposes exactly 6 tools', () => {
  assert.strictEqual(TOOL_NAMES.length, 6,
    `Expected 6 tools, got ${TOOL_NAMES.length}: ${TOOL_NAMES.join(', ')}`);
});

test('all expected tools present', () => {
  EXPECTED_TOOLS.forEach(tool => {
    assert.ok(TOOL_NAMES.includes(tool),
      `Missing tool: ${tool}`);
  });
});

// ═══════════════════════════════════════════════════════════════════
// MCP-06: Tool input schemas
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== MCP-06: Tool input schemas ===');

test('spawn_agent requires agent_name and task', () => {
  const schema = TOOL_SCHEMAS['spawn_agent'];
  assert.ok(schema, 'spawn_agent schema not found');
  assert.ok(schema.required.includes('agent_name'),
    'spawn_agent missing required: agent_name');
  assert.ok(schema.required.includes('task'),
    'spawn_agent missing required: task');
});

test('get_agent_info requires agent_name', () => {
  const schema = TOOL_SCHEMAS['get_agent_info'];
  assert.ok(schema, 'get_agent_info schema not found');
  assert.ok(schema.required.includes('agent_name'),
    'get_agent_info missing required: agent_name');
});

test('team_create requires team_name', () => {
  const schema = TOOL_SCHEMAS['team_create'];
  assert.ok(schema, 'team_create schema not found');
  assert.ok(schema.required.includes('team_name'),
    'team_create missing required: team_name');
});

test('team_assign requires team_name, agent_name, task', () => {
  const schema = TOOL_SCHEMAS['team_assign'];
  assert.ok(schema, 'team_assign schema not found');
  assert.ok(schema.required.includes('team_name'),
    'team_assign missing required: team_name');
  assert.ok(schema.required.includes('agent_name'),
    'team_assign missing required: agent_name');
  assert.ok(schema.required.includes('task'),
    'team_assign missing required: task');
});

test('team_status requires team_name', () => {
  const schema = TOOL_SCHEMAS['team_status'];
  assert.ok(schema, 'team_status schema not found');
  assert.ok(schema.required.includes('team_name'),
    'team_status missing required: team_name');
});

test('list_agents has no required fields', () => {
  const schema = TOOL_SCHEMAS['list_agents'];
  // list_agents may or may not have schema entry
  if (schema) {
    assert.strictEqual(schema.required.length, 0,
      `list_agents should have no required fields, got: ${schema.required}`);
  }
});

// ═══════════════════════════════════════════════════════════════════
// MCP-07: spawn_agent enum matches AGENTS registry
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== MCP-07: spawn_agent enum consistency ===');

test('spawn_agent agent_name enum matches AGENTS keys', () => {
  const content = fs.readFileSync(SERVER_PATH, 'utf-8');

  // Find Object.keys(AGENTS) usage in spawn_agent definition
  // The schema uses: enum: Object.keys(AGENTS)
  assert.ok(content.includes("enum: Object.keys(AGENTS)"),
    'spawn_agent should use Object.keys(AGENTS) for enum');
});

// ═══════════════════════════════════════════════════════════════════
// MCP-08: handleToolsCall routing
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== MCP-08: handleToolsCall routing ===');

test('handleToolsCall has case for each tool', () => {
  const content = fs.readFileSync(SERVER_PATH, 'utf-8');
  EXPECTED_TOOLS.forEach(tool => {
    assert.ok(content.includes(`case '${tool}':`),
      `Missing case handler for tool: ${tool}`);
  });
});

test('handleToolsCall has default error case', () => {
  const content = fs.readFileSync(SERVER_PATH, 'utf-8');
  // Should have a default case that throws error for unknown tools
  assert.ok(content.includes("throw new Error(`Unknown tool:"),
    'Missing default error case for unknown tools');
});

// Summary
console.log('\n' + '='.repeat(60));
console.log(`MCP TOOLS: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
}
console.log('='.repeat(60));
process.exit(failed > 0 ? 1 : 0);
```

---

## SECTION C: JSON-RPC Protocol Integration (6 cases)

```javascript
// tests/tc-05-mcp-jsonrpc.js
const assert = require('assert');
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const SERVER_PATH = path.join(ROOT, 'mcp', 'spawn-agent-server.js');

let passed = 0;
let failed = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  PASS: ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message });
    console.error(`  FAIL: ${name} - ${err.message}`);
  }
}

/**
 * Send a JSON-RPC request to the MCP server and read response
 * @param {object} request - JSON-RPC request
 * @param {number} timeoutMs - Timeout in ms (default 5000)
 * @returns {Promise<object>} JSON-RPC response
 */
function sendRpcRequest(request, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [SERVER_PATH], {
      cwd: ROOT,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let timer;

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      // Try to parse complete JSON lines
      const lines = stdout.split('\n').filter(l => l.trim());
      for (const line of lines) {
        try {
          const response = JSON.parse(line);
          clearTimeout(timer);
          proc.kill();
          resolve(response);
          return;
        } catch { /* incomplete JSON, keep reading */ }
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    timer = setTimeout(() => {
      proc.kill();
      reject(new Error(`Timeout after ${timeoutMs}ms. stdout: ${stdout}`));
    }, timeoutMs);

    // Send request
    proc.stdin.write(JSON.stringify(request) + '\n');
  });
}

/**
 * Send multiple sequential JSON-RPC requests
 */
function sendRpcRequests(requests, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [SERVER_PATH], {
      cwd: ROOT,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    const responses = [];
    let timer;

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      const lines = stdout.split('\n').filter(l => l.trim());
      stdout = ''; // reset buffer
      for (const line of lines) {
        try {
          responses.push(JSON.parse(line));
        } catch {
          stdout += line; // keep incomplete
        }
      }

      if (responses.length >= requests.length) {
        clearTimeout(timer);
        proc.kill();
        resolve(responses);
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    timer = setTimeout(() => {
      proc.kill();
      if (responses.length > 0) {
        resolve(responses);
      } else {
        reject(new Error(`Timeout. Got ${responses.length}/${requests.length} responses`));
      }
    }, timeoutMs);

    // Send all requests
    for (const req of requests) {
      proc.stdin.write(JSON.stringify(req) + '\n');
    }
  });
}

// ═══════════════════════════════════════════════════════════════════
// MCP-09: Initialize handshake
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== MCP-09: Initialize handshake ===');

(async () => {
  await test('initialize returns protocol version and server info', async () => {
    const response = await sendRpcRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        clientInfo: { name: 'test-client', version: '1.0' }
      }
    });
    assert.strictEqual(response.jsonrpc, '2.0');
    assert.strictEqual(response.id, 1);
    assert.ok(response.result);
    assert.strictEqual(response.result.protocolVersion, '2024-11-05');
    assert.ok(response.result.serverInfo);
    assert.strictEqual(response.result.serverInfo.name, 'bkit-agents');
    assert.ok(response.result.capabilities);
    assert.ok(response.result.capabilities.tools !== undefined);
  });

  // ═══════════════════════════════════════════════════════════════════
  // MCP-10: tools/list returns 6 tools
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n=== MCP-10: tools/list ===');

  await test('tools/list returns all 6 tools with schemas', async () => {
    const response = await sendRpcRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    });
    assert.ok(response.result);
    assert.ok(response.result.tools);
    assert.strictEqual(response.result.tools.length, 6);

    const toolNames = response.result.tools.map(t => t.name);
    ['spawn_agent', 'list_agents', 'get_agent_info',
     'team_create', 'team_assign', 'team_status'].forEach(expected => {
      assert.ok(toolNames.includes(expected), `Missing tool: ${expected}`);
    });

    // Each tool should have name, description, inputSchema
    response.result.tools.forEach(tool => {
      assert.ok(tool.name, 'Tool missing name');
      assert.ok(tool.description, `${tool.name}: missing description`);
      assert.ok(tool.inputSchema, `${tool.name}: missing inputSchema`);
      assert.strictEqual(tool.inputSchema.type, 'object',
        `${tool.name}: inputSchema type should be object`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // MCP-11: list_agents tool call
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n=== MCP-11: list_agents tool call ===');

  await test('list_agents returns 16 agents', async () => {
    const response = await sendRpcRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'list_agents',
        arguments: {}
      }
    });
    assert.ok(response.result);
    assert.ok(response.result.content);
    assert.strictEqual(response.result.content[0].type, 'text');

    const data = JSON.parse(response.result.content[0].text);
    assert.ok(data.agents);
    assert.strictEqual(data.agents.length, 16);
    data.agents.forEach(a => {
      assert.ok(a.name);
      assert.ok(a.description);
      assert.ok(a.recommendedModel);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // MCP-12: get_agent_info tool call
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n=== MCP-12: get_agent_info ===');

  await test('get_agent_info for gap-detector returns details', async () => {
    const response = await sendRpcRequest({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'get_agent_info',
        arguments: { agent_name: 'gap-detector' }
      }
    });
    const data = JSON.parse(response.result.content[0].text);
    assert.strictEqual(data.name, 'gap-detector');
    assert.strictEqual(data.file, 'gap-detector.md');
    assert.ok(data.description);
    assert.strictEqual(data.recommendedModel, 'pro');
    assert.strictEqual(data.exists, true);
  });

  await test('get_agent_info for unknown agent returns error', async () => {
    const response = await sendRpcRequest({
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'get_agent_info',
        arguments: { agent_name: 'nonexistent-agent' }
      }
    });
    const data = JSON.parse(response.result.content[0].text);
    assert.ok(data.error);
    assert.ok(data.error.includes('Unknown agent'));
    assert.ok(data.available_agents);
    assert.strictEqual(data.available_agents.length, 16);
  });

  // ═══════════════════════════════════════════════════════════════════
  // MCP-13: spawn_agent error handling
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n=== MCP-13: spawn_agent error handling ===');

  await test('spawn_agent with unknown agent returns error', async () => {
    const response = await sendRpcRequest({
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: {
        name: 'spawn_agent',
        arguments: {
          agent_name: 'fake-agent-xyz',
          task: 'test task'
        }
      }
    });
    const data = JSON.parse(response.result.content[0].text);
    assert.strictEqual(data.success, false);
    assert.ok(data.error.includes('Unknown agent'));
    assert.ok(data.available_agents);
  });

  // ═══════════════════════════════════════════════════════════════════
  // MCP-14: Unknown method returns error
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n=== MCP-14: Unknown method handling ===');

  await test('unknown method returns JSON-RPC error', async () => {
    const response = await sendRpcRequest({
      jsonrpc: '2.0',
      id: 7,
      method: 'nonexistent/method',
      params: {}
    });
    assert.ok(response.error);
    assert.strictEqual(response.error.code, -32000);
    assert.ok(response.error.message.includes('Unknown method'));
  });

  // ═══════════════════════════════════════════════════════════════════
  // MCP-15: team_create tool call
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n=== MCP-15: team_create ===');

  await test('team_create with dynamic strategy', async () => {
    const TEST_CWD = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-team-'));
    // Need to set cwd for team state storage - using env workaround
    const response = await sendRpcRequest({
      jsonrpc: '2.0',
      id: 8,
      method: 'tools/call',
      params: {
        name: 'team_create',
        arguments: {
          team_name: 'test-team',
          strategy: 'dynamic'
        }
      }
    });
    const data = JSON.parse(response.result.content[0].text);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.team, 'test-team');
    assert.strictEqual(data.strategy, 'dynamic');
    assert.ok(Array.isArray(data.agents));
    // Dynamic strategy: cto-lead, code-analyzer, gap-detector
    assert.strictEqual(data.agents.length, 3);
    assert.ok(data.agents.includes('cto-lead'));
    assert.ok(data.agents.includes('code-analyzer'));
    assert.ok(data.agents.includes('gap-detector'));
    fs.rmSync(TEST_CWD, { recursive: true, force: true });
  });

  await test('team_create with enterprise strategy', async () => {
    const response = await sendRpcRequest({
      jsonrpc: '2.0',
      id: 9,
      method: 'tools/call',
      params: {
        name: 'team_create',
        arguments: {
          team_name: 'enterprise-team',
          strategy: 'enterprise'
        }
      }
    });
    const data = JSON.parse(response.result.content[0].text);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.agents.length, 5);
    assert.ok(data.agents.includes('frontend-architect'));
    assert.ok(data.agents.includes('security-architect'));
  });

  await test('team_create with custom invalid agent returns error', async () => {
    const response = await sendRpcRequest({
      jsonrpc: '2.0',
      id: 10,
      method: 'tools/call',
      params: {
        name: 'team_create',
        arguments: {
          team_name: 'bad-team',
          strategy: 'custom',
          agents: ['gap-detector', 'nonexistent-agent']
        }
      }
    });
    const data = JSON.parse(response.result.content[0].text);
    assert.strictEqual(data.success, false);
    assert.ok(data.error.includes('Unknown agents'));
  });

  // ═══════════════════════════════════════════════════════════════════
  // MCP-16: team_status for nonexistent team
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n=== MCP-16: team_status error ===');

  await test('team_status for nonexistent team returns error', async () => {
    const response = await sendRpcRequest({
      jsonrpc: '2.0',
      id: 11,
      method: 'tools/call',
      params: {
        name: 'team_status',
        arguments: { team_name: 'ghost-team' }
      }
    });
    const data = JSON.parse(response.result.content[0].text);
    assert.strictEqual(data.success, false);
    assert.ok(data.error.includes('not found'));
  });

  // ═══════════════════════════════════════════════════════════════════
  // MCP-17: Unknown tool call
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n=== MCP-17: Unknown tool error ===');

  await test('unknown tool returns error', async () => {
    const response = await sendRpcRequest({
      jsonrpc: '2.0',
      id: 12,
      method: 'tools/call',
      params: {
        name: 'nonexistent_tool',
        arguments: {}
      }
    });
    assert.ok(response.error);
    assert.ok(response.error.message.includes('Unknown tool'));
  });

  // ═══════════════════════════════════════════════════════════════════
  // MCP-18: Response format compliance
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n=== MCP-18: JSON-RPC response format ===');

  await test('all responses have jsonrpc 2.0 and matching id', async () => {
    const responses = await sendRpcRequests([
      { jsonrpc: '2.0', id: 100, method: 'initialize', params: {} },
      { jsonrpc: '2.0', id: 101, method: 'tools/list', params: {} },
      { jsonrpc: '2.0', id: 102, method: 'tools/call', params: { name: 'list_agents', arguments: {} } }
    ]);
    assert.ok(responses.length >= 3, `Expected 3 responses, got ${responses.length}`);
    responses.forEach(r => {
      assert.strictEqual(r.jsonrpc, '2.0', `Response missing jsonrpc: 2.0`);
      assert.ok(r.id !== undefined, 'Response missing id');
    });
    // Check ids match
    const ids = responses.map(r => r.id);
    assert.ok(ids.includes(100));
    assert.ok(ids.includes(101));
    assert.ok(ids.includes(102));
  });

  await test('tool call results use MCP content format', async () => {
    const response = await sendRpcRequest({
      jsonrpc: '2.0',
      id: 200,
      method: 'tools/call',
      params: { name: 'list_agents', arguments: {} }
    });
    assert.ok(response.result.content);
    assert.ok(Array.isArray(response.result.content));
    assert.strictEqual(response.result.content[0].type, 'text');
    assert.ok(typeof response.result.content[0].text === 'string');
    // Content text should be valid JSON
    JSON.parse(response.result.content[0].text);
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`MCP JSON-RPC: ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
  }
  console.log('='.repeat(60));
  process.exit(failed > 0 ? 1 : 0);
})();
```

---

## TC-05 Test Case Summary

| ID | Section | Test Name | Category | What it Validates |
|------|---------|-----------|----------|-------------------|
| MCP-01 | Registry | Completeness | Component | 16 entries, all expected names |
| MCP-02 | Registry | Entry structure | Component | file, description, recommendedModel fields |
| MCP-03 | Registry | File existence | Integration | Referenced .md files exist on disk |
| MCP-04 | Registry | Description quality | Component | Unique, no placeholders |
| MCP-05 | Tools | Tool list completeness | Component | 6 tools in handleToolsList |
| MCP-06 | Tools | Input schemas | Component | Required fields per tool |
| MCP-07 | Tools | Enum consistency | Component | spawn_agent enum = AGENTS keys |
| MCP-08 | Tools | Routing | Component | Case handler per tool, default error |
| MCP-09 | JSON-RPC | Initialize handshake | Integration | Protocol version, server info |
| MCP-10 | JSON-RPC | tools/list | Integration | Returns 6 tools with schemas |
| MCP-11 | JSON-RPC | list_agents | Integration | Returns 16 agents via MCP |
| MCP-12 | JSON-RPC | get_agent_info | Integration | Valid + invalid agent lookup |
| MCP-13 | JSON-RPC | spawn_agent error | Integration | Unknown agent error handling |
| MCP-14 | JSON-RPC | Unknown method | Integration | JSON-RPC error code -32000 |
| MCP-15 | JSON-RPC | team_create | Integration | Dynamic/enterprise/custom strategies |
| MCP-16 | JSON-RPC | team_status error | Integration | Nonexistent team handling |
| MCP-17 | JSON-RPC | Unknown tool | Integration | Error for unregistered tool |
| MCP-18 | JSON-RPC | Response format | Integration | jsonrpc 2.0, id matching, MCP content |

---

## Execution

```bash
# Registry validation (static analysis, no process spawn)
node tests/tc-05-mcp-registry.js

# Tool schema validation (static analysis)
node tests/tc-05-mcp-tools.js

# JSON-RPC integration tests (spawns MCP server process)
node tests/tc-05-mcp-jsonrpc.js

# Run all TC-05
node tests/tc-05-mcp-registry.js && \
node tests/tc-05-mcp-tools.js && \
node tests/tc-05-mcp-jsonrpc.js
```

---

## Cross-Reference: TC-04 <-> TC-05 Dependencies

| TC-04 Test | TC-05 Test | Dependency |
|------------|------------|------------|
| LIB-07 (getAgentMemory scope) | MCP-01 (registry) | Agent names in memory must match registry |
| LIB-26 (forkContext) | MCP-13 (spawn_agent) | Fork creates isolation for agent execution |
| LIB-19-21 (checkPermission) | MCP-08 (tool routing) | Permission checks gate tool execution |

## Cross-Reference: TC-04 <-> TC-02/TC-03

| TC-04 Test | TC-02/03 Test | Dependency |
|------------|---------------|------------|
| - | TC-02 SKILL-09 to SKILL-25 | skill-orchestrator.js covered in TC-02 |
| LIB-07 (scope routing) | TC-03 AGENT-06 (model alignment) | Agent scope from config matches agent role |
| LIB-10 (hierarchy merge) | TC-02 SKILL-07 (import paths) | Template paths resolved through hierarchy |
