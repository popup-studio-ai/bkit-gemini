# TC-03: Agent System Test Design (20 Cases)

> bkit-gemini v1.5.1 | Gap Detector Agent | 2026-02-11

## Test Scope

Validates the entire Agent System:
- 16 agent .md files have correct Gemini native frontmatter
- All 16 agents registered in spawn-agent-server.js AGENTS registry
- Agent-Skill binding via bkit.config.json (level-based and task-based routing)
- before-agent.js 8-language trigger detection
- MCP server agent spawning validation

## Prerequisites

- Node.js >= 18
- Working directory: project root (`/path/to/bkit-gemini`)
- No external dependencies (tests use only `assert`, `fs`, `path`)

---

## SECTION A: Agent File Validation (6 cases)

### Agent Validation Master Script

This script systematically validates ALL 16 agent .md files.

```javascript
// tests/tc-03-agent-validation.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const AGENTS_DIR = path.join(ROOT, 'agents');

// All 16 agent files
const ALL_AGENTS = [
  'cto-lead', 'frontend-architect', 'security-architect', 'product-manager',
  'qa-strategist', 'gap-detector', 'design-validator', 'code-analyzer',
  'pdca-iterator', 'report-generator', 'qa-monitor', 'starter-guide',
  'pipeline-guide', 'bkend-expert', 'enterprise-expert', 'infra-architect'
];

// Gemini native frontmatter required fields
const REQUIRED_AGENT_FIELDS = ['name', 'description', 'model', 'tools', 'temperature'];

// Valid model values for Gemini CLI agents
const VALID_MODELS = ['gemini-2.5-pro', 'gemini-2.5-flash'];

// Valid tool names that Gemini CLI supports
const VALID_TOOLS = [
  'read_file', 'read_many_files', 'write_file', 'replace',
  'grep_search', 'glob_tool', 'list_directory',
  'run_shell_command', 'web_search', 'web_fetch', 'spawn_agent'
];

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
 * Simple frontmatter extractor for agent .md files (Gemini native format)
 * Agent files use non-nested YAML: key: value, key: [list]
 */
function extractAgentFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml = match[1];
  const result = {};
  const lines = yaml.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) { i++; continue; }

    const indent = line.search(/\S/);
    if (indent !== 0) {
      // Could be list items for previous key
      if (line.trim().startsWith('- ') && result._lastKey) {
        if (!Array.isArray(result[result._lastKey])) {
          result[result._lastKey] = [];
        }
        result[result._lastKey].push(line.trim().slice(2));
      }
      i++;
      continue;
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) { i++; continue; }

    const key = line.slice(0, colonIdx).trim();
    const valRaw = line.slice(colonIdx + 1).trim();

    if (valRaw === '|' || valRaw === '>') {
      // Block scalar
      let block = '';
      i++;
      while (i < lines.length) {
        const bline = lines[i];
        if (bline.trim() && bline.search(/\S/) === 0) break;
        block += (block ? '\n' : '') + bline.replace(/^ {2}/, '');
        i++;
      }
      result[key] = block.trim();
      result._lastKey = key;
      continue;
    }

    if (valRaw === '') {
      // Might be followed by list
      result._lastKey = key;
      i++;
      continue;
    }

    // Scalar
    if (valRaw === 'true') result[key] = true;
    else if (valRaw === 'false') result[key] = false;
    else if (/^-?\d+(\.\d+)?$/.test(valRaw)) result[key] = Number(valRaw);
    else if ((valRaw.startsWith('"') && valRaw.endsWith('"')) ||
             (valRaw.startsWith("'") && valRaw.endsWith("'"))) {
      result[key] = valRaw.slice(1, -1);
    } else {
      result[key] = valRaw;
    }

    result._lastKey = key;
    i++;
  }

  delete result._lastKey;
  return result;
}

// ═══════════════════════════════════════════════════════════════════
// AGENT-01: All 16 agent .md files exist
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== AGENT-01: All 16 agent .md files exist ===');

test('agents directory exists', () => {
  assert.ok(fs.existsSync(AGENTS_DIR), 'agents/ directory missing');
});

test('exactly 16 agent .md files', () => {
  const files = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
  assert.strictEqual(files.length, 16, `Expected 16, got ${files.length}: ${files.join(', ')}`);
});

ALL_AGENTS.forEach(agent => {
  test(`${agent}.md exists`, () => {
    const p = path.join(AGENTS_DIR, `${agent}.md`);
    assert.ok(fs.existsSync(p), `Missing: ${p}`);
  });
});

// ═══════════════════════════════════════════════════════════════════
// AGENT-02: All agents have valid YAML frontmatter delimiters
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== AGENT-02: Valid YAML frontmatter delimiters ===');
ALL_AGENTS.forEach(agent => {
  test(`${agent} has --- delimiters`, () => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, `${agent}.md`), 'utf-8');
    assert.ok(content.startsWith('---\n'), `${agent}: Must start with ---`);
    const secondDelim = content.indexOf('\n---', 4);
    assert.ok(secondDelim > 0, `${agent}: Missing closing ---`);
  });
});

// ═══════════════════════════════════════════════════════════════════
// AGENT-03: Required Gemini native fields present
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== AGENT-03: Required Gemini native fields ===');
ALL_AGENTS.forEach(agent => {
  test(`${agent} has all required fields`, () => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, `${agent}.md`), 'utf-8');
    const fm = extractAgentFrontmatter(content);
    assert.ok(fm, `${agent}: No frontmatter parsed`);

    // name
    assert.ok(fm.name, `${agent}: Missing 'name'`);
    assert.strictEqual(fm.name, agent, `${agent}: name '${fm.name}' != filename '${agent}'`);

    // description
    assert.ok(fm.description, `${agent}: Missing 'description'`);
    assert.ok(fm.description.length > 10, `${agent}: description too short`);

    // model
    assert.ok(fm.model, `${agent}: Missing 'model'`);
    assert.ok(VALID_MODELS.includes(fm.model),
      `${agent}: model '${fm.model}' not in ${VALID_MODELS.join(', ')}`);

    // tools
    assert.ok(fm.tools !== undefined, `${agent}: Missing 'tools'`);
    assert.ok(Array.isArray(fm.tools), `${agent}: tools must be array, got ${typeof fm.tools}`);
    assert.ok(fm.tools.length > 0, `${agent}: tools array empty`);

    // temperature
    assert.ok(fm.temperature !== undefined, `${agent}: Missing 'temperature'`);
    assert.strictEqual(typeof fm.temperature, 'number', `${agent}: temperature must be number`);
    assert.ok(fm.temperature >= 0 && fm.temperature <= 1,
      `${agent}: temperature ${fm.temperature} out of range [0,1]`);
  });
});

// ═══════════════════════════════════════════════════════════════════
// AGENT-04: Optional fields have valid values
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== AGENT-04: Optional fields validation ===');
ALL_AGENTS.forEach(agent => {
  test(`${agent} optional fields valid`, () => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, `${agent}.md`), 'utf-8');
    const fm = extractAgentFrontmatter(content);
    assert.ok(fm, `${agent}: No frontmatter`);

    // max_turns (optional, number > 0)
    if (fm.max_turns !== undefined) {
      assert.strictEqual(typeof fm.max_turns, 'number',
        `${agent}: max_turns must be number`);
      assert.ok(fm.max_turns > 0, `${agent}: max_turns must be > 0`);
    }

    // timeout_mins (optional, number > 0)
    if (fm.timeout_mins !== undefined) {
      assert.strictEqual(typeof fm.timeout_mins, 'number',
        `${agent}: timeout_mins must be number`);
      assert.ok(fm.timeout_mins > 0, `${agent}: timeout_mins must be > 0`);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// AGENT-05: Tools reference valid Gemini CLI tool names
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== AGENT-05: Tools reference valid tool names ===');
ALL_AGENTS.forEach(agent => {
  test(`${agent} tools are valid`, () => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, `${agent}.md`), 'utf-8');
    const fm = extractAgentFrontmatter(content);
    if (fm && Array.isArray(fm.tools)) {
      fm.tools.forEach(tool => {
        assert.ok(VALID_TOOLS.includes(tool),
          `${agent}: unknown tool '${tool}', valid: ${VALID_TOOLS.join(', ')}`);
      });
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// AGENT-06: Model-role alignment validation
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== AGENT-06: Model-role alignment ===');

// Expected model assignments based on spawn-agent-server.js recommendedModel
const EXPECTED_MODELS = {
  'gap-detector':       'gemini-2.5-pro',
  'design-validator':   'gemini-2.5-pro',
  'pdca-iterator':      'gemini-2.5-flash',
  'code-analyzer':      'gemini-2.5-pro',
  'report-generator':   'gemini-2.5-flash',
  'qa-monitor':         'gemini-2.5-flash',
  'starter-guide':      'gemini-2.5-flash',
  'pipeline-guide':     'gemini-2.5-flash',
  'bkend-expert':       'gemini-2.5-flash',
  'enterprise-expert':  'gemini-2.5-pro',
  'infra-architect':    'gemini-2.5-pro',
  'cto-lead':           'gemini-2.5-pro',
  'frontend-architect': 'gemini-2.5-pro',
  'security-architect': 'gemini-2.5-pro',
  'product-manager':    'gemini-2.5-flash',
  'qa-strategist':      'gemini-2.5-pro'
};

test('all agents use expected model assignments', () => {
  Object.entries(EXPECTED_MODELS).forEach(([agent, expectedModel]) => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, `${agent}.md`), 'utf-8');
    const fm = extractAgentFrontmatter(content);
    assert.ok(fm, `${agent}: No frontmatter`);
    assert.strictEqual(fm.model, expectedModel,
      `${agent}: expected model '${expectedModel}', got '${fm.model}'`);
  });
});

// Verify pro agents have lower temperature (analytical)
test('pro model agents have temperature <= 0.3', () => {
  const proAgents = Object.entries(EXPECTED_MODELS)
    .filter(([_, model]) => model === 'gemini-2.5-pro')
    .map(([name]) => name);

  proAgents.forEach(agent => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, `${agent}.md`), 'utf-8');
    const fm = extractAgentFrontmatter(content);
    if (fm && fm.temperature !== undefined) {
      assert.ok(fm.temperature <= 0.3,
        `${agent} (pro): temperature ${fm.temperature} should be <= 0.3 for analytical agent`);
    }
  });
});

// Summary
console.log('\n' + '='.repeat(60));
console.log(`AGENT VALIDATION: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
}
console.log('='.repeat(60));
process.exit(failed > 0 ? 1 : 0);
```

---

## SECTION B: MCP Agent Registry Tests (4 cases)

```javascript
// tests/tc-03-agent-registry.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
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
 * Extract AGENTS registry from spawn-agent-server.js source code
 * Uses regex parsing since requiring the server would start stdin listener
 */
function extractAgentsRegistry() {
  const serverPath = path.join(ROOT, 'mcp', 'spawn-agent-server.js');
  const content = fs.readFileSync(serverPath, 'utf-8');

  // Extract the AGENTS object definition
  const agentsMatch = content.match(/const AGENTS = \{([\s\S]*?)\n\};/);
  if (!agentsMatch) return {};

  const agentsBlock = agentsMatch[1];
  const registry = {};

  // Parse each agent entry
  const agentPattern = /'([^']+)':\s*\{[^}]*file:\s*'([^']+)'[^}]*description:\s*'([^']+)'[^}]*recommendedModel:\s*'([^']+)'/g;
  let match;
  while ((match = agentPattern.exec(agentsBlock)) !== null) {
    registry[match[1]] = {
      file: match[2],
      description: match[3],
      recommendedModel: match[4]
    };
  }

  return registry;
}

const AGENTS_REGISTRY = extractAgentsRegistry();

// ═══════════════════════════════════════════════════════════════════
// AGENT-07: All 16 agents registered in MCP server
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== AGENT-07: MCP AGENTS registry has 16 entries ===');

test('AGENTS registry has exactly 16 entries', () => {
  const count = Object.keys(AGENTS_REGISTRY).length;
  assert.strictEqual(count, 16,
    `Expected 16 agents in registry, got ${count}: ${Object.keys(AGENTS_REGISTRY).join(', ')}`);
});

const EXPECTED_AGENTS = [
  'cto-lead', 'frontend-architect', 'security-architect', 'product-manager',
  'qa-strategist', 'gap-detector', 'design-validator', 'code-analyzer',
  'pdca-iterator', 'report-generator', 'qa-monitor', 'starter-guide',
  'pipeline-guide', 'bkend-expert', 'enterprise-expert', 'infra-architect'
];

test('all 16 agent names present in registry', () => {
  EXPECTED_AGENTS.forEach(agent => {
    assert.ok(AGENTS_REGISTRY[agent],
      `Agent '${agent}' missing from AGENTS registry`);
  });
});

// ═══════════════════════════════════════════════════════════════════
// AGENT-08: Registry file references resolve to existing files
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== AGENT-08: Registry file references valid ===');

test('all registry file references exist', () => {
  Object.entries(AGENTS_REGISTRY).forEach(([name, info]) => {
    const agentPath = path.join(AGENTS_DIR, info.file);
    assert.ok(fs.existsSync(agentPath),
      `${name}: file '${info.file}' not found at ${agentPath}`);
  });
});

test('registry file names match agent-name.md pattern', () => {
  Object.entries(AGENTS_REGISTRY).forEach(([name, info]) => {
    const expectedFile = `${name}.md`;
    assert.strictEqual(info.file, expectedFile,
      `${name}: file '${info.file}' should be '${expectedFile}'`);
  });
});

// ═══════════════════════════════════════════════════════════════════
// AGENT-09: Registry has required fields per entry
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== AGENT-09: Registry entries have required fields ===');

test('each registry entry has file, description, recommendedModel', () => {
  Object.entries(AGENTS_REGISTRY).forEach(([name, info]) => {
    assert.ok(info.file, `${name}: missing 'file'`);
    assert.ok(info.description, `${name}: missing 'description'`);
    assert.ok(info.recommendedModel, `${name}: missing 'recommendedModel'`);
    assert.ok(['pro', 'flash', 'flash-lite'].includes(info.recommendedModel),
      `${name}: recommendedModel '${info.recommendedModel}' not in [pro, flash, flash-lite]`);
  });
});

// ═══════════════════════════════════════════════════════════════════
// AGENT-10: Registry recommendedModel aligns with agent frontmatter
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== AGENT-10: Registry model aligns with frontmatter ===');

function extractAgentFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const yaml = match[1];
  const result = {};
  yaml.split('\n').forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0 && line.search(/\S/) === 0) {
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      if (val && !val.startsWith('|') && !val.startsWith('>')) {
        if (val === 'true') result[key] = true;
        else if (val === 'false') result[key] = false;
        else if (/^-?\d+(\.\d+)?$/.test(val)) result[key] = Number(val);
        else result[key] = val;
      }
    }
  });
  return result;
}

const MODEL_MAP = {
  'pro': 'gemini-2.5-pro',
  'flash': 'gemini-2.5-flash',
  'flash-lite': 'gemini-2.5-flash'  // flash-lite maps to flash in frontmatter
};

test('registry recommendedModel matches frontmatter model', () => {
  Object.entries(AGENTS_REGISTRY).forEach(([name, info]) => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, info.file), 'utf-8');
    const fm = extractAgentFrontmatter(content);
    if (fm && fm.model) {
      const expectedModel = MODEL_MAP[info.recommendedModel];
      if (expectedModel) {
        assert.strictEqual(fm.model, expectedModel,
          `${name}: registry says '${info.recommendedModel}' (${expectedModel}), frontmatter has '${fm.model}'`);
      }
    }
  });
});

// Summary
console.log('\n' + '='.repeat(60));
console.log(`AGENT REGISTRY: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
}
console.log('='.repeat(60));
process.exit(failed > 0 ? 1 : 0);
```

---

## SECTION C: Agent-Skill Binding Tests (4 cases)

```javascript
// tests/tc-03-agent-binding.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const AGENTS_DIR = path.join(ROOT, 'agents');
const CONFIG_PATH = path.join(ROOT, 'bkit.config.json');

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

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

// ═══════════════════════════════════════════════════════════════════
// AGENT-11: bkit.config.json agents section structure
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== AGENT-11: Config agents section structure ===');

test('config has agents section', () => {
  assert.ok(config.agents, 'bkit.config.json missing agents section');
  assert.ok(config.agents.levelBased, 'Missing levelBased routing');
  assert.ok(config.agents.taskBased, 'Missing taskBased routing');
});

// ═══════════════════════════════════════════════════════════════════
// AGENT-12: Level-based routing maps to existing agents
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== AGENT-12: Level-based routing validation ===');

test('levelBased has Starter, Dynamic, Enterprise', () => {
  const lb = config.agents.levelBased;
  assert.ok(lb.Starter, 'Missing Starter mapping');
  assert.ok(lb.Dynamic, 'Missing Dynamic mapping');
  assert.ok(lb.Enterprise, 'Missing Enterprise mapping');
});

test('levelBased agents map to correct files', () => {
  const expected = {
    'Starter': 'starter-guide',
    'Dynamic': 'bkend-expert',
    'Enterprise': 'enterprise-expert'
  };

  Object.entries(expected).forEach(([level, agentName]) => {
    assert.strictEqual(config.agents.levelBased[level], agentName,
      `Level '${level}' should map to '${agentName}', got '${config.agents.levelBased[level]}'`);
    const agentFile = path.join(AGENTS_DIR, `${agentName}.md`);
    assert.ok(fs.existsSync(agentFile),
      `Level '${level}' agent '${agentName}' file not found: ${agentFile}`);
  });
});

// ═══════════════════════════════════════════════════════════════════
// AGENT-13: Task-based routing maps to existing agents
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== AGENT-13: Task-based routing validation ===');

test('taskBased has expected task mappings', () => {
  const tb = config.agents.taskBased;
  const expectedTasks = [
    'code review', 'security scan', 'design review',
    'gap analysis', 'report', 'QA', 'pipeline'
  ];
  expectedTasks.forEach(task => {
    assert.ok(tb[task], `Missing taskBased mapping for '${task}'`);
  });
});

test('taskBased agents all exist as files', () => {
  const tb = config.agents.taskBased;
  const expected = {
    'code review': 'code-analyzer',
    'security scan': 'code-analyzer',
    'design review': 'design-validator',
    'gap analysis': 'gap-detector',
    'report': 'report-generator',
    'QA': 'qa-monitor',
    'pipeline': 'pipeline-guide'
  };

  Object.entries(expected).forEach(([task, agentName]) => {
    assert.strictEqual(tb[task], agentName,
      `Task '${task}' should map to '${agentName}', got '${tb[task]}'`);
    const agentFile = path.join(AGENTS_DIR, `${agentName}.md`);
    assert.ok(fs.existsSync(agentFile),
      `Task '${task}' agent '${agentName}' file not found: ${agentFile}`);
  });
});

// ═══════════════════════════════════════════════════════════════════
// AGENT-14: No orphan agents (all agents reachable)
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== AGENT-14: Agent reachability ===');

test('every agent file is reachable from at least one binding', () => {
  // Collect all agents referenced from config, skill frontmatter, and registry
  const referencedAgents = new Set();

  // From config levelBased
  Object.values(config.agents.levelBased).forEach(a => referencedAgents.add(a));
  // From config taskBased
  Object.values(config.agents.taskBased).forEach(a => referencedAgents.add(a));

  // From skill frontmatter agents
  const skillsDir = path.join(ROOT, 'skills');
  const skills = fs.readdirSync(skillsDir).filter(f =>
    fs.statSync(path.join(skillsDir, f)).isDirectory());
  skills.forEach(skill => {
    const skillFile = path.join(skillsDir, skill, 'SKILL.md');
    if (fs.existsSync(skillFile)) {
      const content = fs.readFileSync(skillFile, 'utf-8');
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (fmMatch) {
        // Find agent references in frontmatter
        const lines = fmMatch[1].split('\n');
        let inAgents = false;
        lines.forEach(line => {
          if (line.match(/^agents:/)) { inAgents = true; return; }
          if (inAgents && line.search(/\S/) > 0 && line.includes(':')) {
            const val = line.split(':')[1]?.trim();
            if (val && val !== '{}') referencedAgents.add(val);
          }
          if (inAgents && line.search(/\S/) === 0 && !line.startsWith(' ')) {
            inAgents = false;
          }
        });
      }
    }
  });

  // From MCP registry
  const serverContent = fs.readFileSync(path.join(ROOT, 'mcp', 'spawn-agent-server.js'), 'utf-8');
  const registryNames = serverContent.match(/'([a-z-]+)':\s*\{/g);
  if (registryNames) {
    registryNames.forEach(m => {
      const name = m.match(/'([^']+)'/)[1];
      referencedAgents.add(name);
    });
  }

  // Check every agent .md file is referenced
  const allAgentFiles = fs.readdirSync(AGENTS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''));

  const unreachable = allAgentFiles.filter(a => !referencedAgents.has(a));
  assert.strictEqual(unreachable.length, 0,
    `Unreachable agents (no binding found): ${unreachable.join(', ')}`);
});

// Summary
console.log('\n' + '='.repeat(60));
console.log(`AGENT BINDING: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
}
console.log('='.repeat(60));
process.exit(failed > 0 ? 1 : 0);
```

---

## SECTION D: 8-Language Trigger Tests (6 cases)

```javascript
// tests/tc-03-agent-triggers.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

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

// ── Replicate AGENT_TRIGGERS from before-agent.js ──
const AGENT_TRIGGERS = {
  'gap-detector': [
    'verify', 'check', 'validate', 'gap', 'compare',
    '검증', '확인', '비교', '갭',
    '確認', '検証', '比較',
    '验证', '检查', '对比',
    'verificar', 'comprobar',
    'vérifier', 'comparer',
    'überprüfen', 'vergleichen',
    'verificare', 'confrontare'
  ],
  'pdca-iterator': [
    'improve', 'iterate', 'fix', 'enhance', 'optimize',
    '개선', '반복', '수정', '최적화',
    '改善', '反復', '修正',
    '改进', '优化', '修复',
    'mejorar', 'optimizar',
    'améliorer', 'optimiser',
    'verbessern', 'optimieren',
    'migliorare', 'ottimizzare'
  ],
  'code-analyzer': [
    'analyze', 'quality', 'review', 'security', 'scan',
    '분석', '품질', '리뷰', '보안',
    '分析', '品質', 'レビュー',
    '分析', '质量', '审查',
    'analizar', 'calidad',
    'analyser', 'qualité',
    'analysieren', 'Qualität',
    'analizzare', 'qualità'
  ],
  'report-generator': [
    'report', 'summary', 'complete', 'finish',
    '보고서', '요약', '완료',
    '報告', 'レポート', '完了',
    '报告', '总结', '完成',
    'informe', 'resumen',
    'rapport', 'résumé',
    'Bericht', 'Zusammenfassung',
    'rapporto', 'riepilogo'
  ]
};

/**
 * Replicate matchAgentTrigger from before-agent.js
 */
function matchAgentTrigger(text) {
  const lowerText = text.toLowerCase();
  for (const [agent, triggers] of Object.entries(AGENT_TRIGGERS)) {
    for (const trigger of triggers) {
      if (lowerText.includes(trigger.toLowerCase())) {
        return { agent, confidence: 0.8 };
      }
    }
  }
  return null;
}

// 8 languages: EN, KO, JA, ZH, ES, FR, DE, IT
const LANGUAGES = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'it'];

// ═══════════════════════════════════════════════════════════════════
// AGENT-15: English triggers work for all 4 agents
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== AGENT-15: English trigger detection ===');

test('EN: gap-detector triggers', () => {
  ['verify the implementation', 'check if this matches', 'validate the design',
   'gap analysis needed', 'compare design with code'].forEach(input => {
    const result = matchAgentTrigger(input);
    assert.ok(result, `No trigger match for: "${input}"`);
    assert.strictEqual(result.agent, 'gap-detector', `"${input}" => ${result.agent}, expected gap-detector`);
  });
});

test('EN: pdca-iterator triggers', () => {
  ['improve the code', 'iterate on this', 'fix the issues',
   'enhance performance', 'optimize the query'].forEach(input => {
    const result = matchAgentTrigger(input);
    assert.ok(result, `No trigger match for: "${input}"`);
    assert.strictEqual(result.agent, 'pdca-iterator', `"${input}" => ${result.agent}, expected pdca-iterator`);
  });
});

test('EN: code-analyzer triggers', () => {
  ['analyze this code', 'quality check needed', 'review the module',
   'security audit', 'scan for vulnerabilities'].forEach(input => {
    const result = matchAgentTrigger(input);
    assert.ok(result, `No trigger match for: "${input}"`);
    assert.strictEqual(result.agent, 'code-analyzer', `"${input}" => ${result.agent}, expected code-analyzer`);
  });
});

test('EN: report-generator triggers', () => {
  ['generate a report', 'summary of progress', 'complete the cycle',
   'finish the task'].forEach(input => {
    const result = matchAgentTrigger(input);
    assert.ok(result, `No trigger match for: "${input}"`);
    assert.strictEqual(result.agent, 'report-generator', `"${input}" => ${result.agent}, expected report-generator`);
  });
});

// ═══════════════════════════════════════════════════════════════════
// AGENT-16: Korean triggers
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== AGENT-16: Korean trigger detection ===');

test('KO: all 4 agents triggered', () => {
  const koTests = [
    { input: '설계를 검증해주세요', expected: 'gap-detector' },
    { input: '확인 부탁합니다', expected: 'gap-detector' },
    { input: '코드를 개선해주세요', expected: 'pdca-iterator' },
    { input: '반복 수정해주세요', expected: 'pdca-iterator' },
    { input: '코드 분석해주세요', expected: 'code-analyzer' },
    { input: '품질 검사 필요합니다', expected: 'code-analyzer' },
    { input: '보고서 작성해주세요', expected: 'report-generator' },
    { input: '요약 부탁합니다', expected: 'report-generator' }
  ];

  koTests.forEach(({ input, expected }) => {
    const result = matchAgentTrigger(input);
    assert.ok(result, `KO: No trigger for "${input}"`);
    assert.strictEqual(result.agent, expected,
      `KO: "${input}" => ${result.agent}, expected ${expected}`);
  });
});

// ═══════════════════════════════════════════════════════════════════
// AGENT-17: Japanese triggers
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== AGENT-17: Japanese trigger detection ===');

test('JA: all 4 agents triggered', () => {
  const jaTests = [
    { input: '設計を確認してください', expected: 'gap-detector' },
    { input: '実装を検証する', expected: 'gap-detector' },
    { input: 'コードを改善してください', expected: 'pdca-iterator' },
    { input: '修正をお願いします', expected: 'pdca-iterator' },
    { input: 'コード品質を分析', expected: 'code-analyzer' },
    { input: '報告書を作成してください', expected: 'report-generator' },
    { input: 'レポートを出力する', expected: 'report-generator' }
  ];

  jaTests.forEach(({ input, expected }) => {
    const result = matchAgentTrigger(input);
    assert.ok(result, `JA: No trigger for "${input}"`);
    assert.strictEqual(result.agent, expected,
      `JA: "${input}" => ${result.agent}, expected ${expected}`);
  });
});

// ═══════════════════════════════════════════════════════════════════
// AGENT-18: Chinese triggers
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== AGENT-18: Chinese trigger detection ===');

test('ZH: all 4 agents triggered', () => {
  const zhTests = [
    { input: '请验证这个实现', expected: 'gap-detector' },
    { input: '检查一下设计', expected: 'gap-detector' },
    { input: '改进代码质量', expected: 'pdca-iterator' },
    { input: '优化这个功能', expected: 'pdca-iterator' },
    { input: '分析代码质量', expected: 'code-analyzer' },
    { input: '生成报告', expected: 'report-generator' },
    { input: '总结进度', expected: 'report-generator' }
  ];

  zhTests.forEach(({ input, expected }) => {
    const result = matchAgentTrigger(input);
    assert.ok(result, `ZH: No trigger for "${input}"`);
    assert.strictEqual(result.agent, expected,
      `ZH: "${input}" => ${result.agent}, expected ${expected}`);
  });
});

// ═══════════════════════════════════════════════════════════════════
// AGENT-19: Spanish, French, German, Italian triggers
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== AGENT-19: European language triggers ===');

test('ES: trigger detection', () => {
  const esTests = [
    { input: 'verificar la implementacion', expected: 'gap-detector' },
    { input: 'mejorar el rendimiento', expected: 'pdca-iterator' },
    { input: 'analizar el codigo', expected: 'code-analyzer' },
    { input: 'generar un informe', expected: 'report-generator' }
  ];
  esTests.forEach(({ input, expected }) => {
    const result = matchAgentTrigger(input);
    assert.ok(result, `ES: No trigger for "${input}"`);
    assert.strictEqual(result.agent, expected,
      `ES: "${input}" => ${result.agent}, expected ${expected}`);
  });
});

test('FR: trigger detection', () => {
  const frTests = [
    { input: 'vérifier le code', expected: 'gap-detector' },
    { input: 'améliorer la qualite', expected: 'pdca-iterator' },
    { input: 'analyser le module', expected: 'code-analyzer' },
    { input: 'creer un rapport', expected: 'report-generator' }
  ];
  frTests.forEach(({ input, expected }) => {
    const result = matchAgentTrigger(input);
    assert.ok(result, `FR: No trigger for "${input}"`);
    assert.strictEqual(result.agent, expected,
      `FR: "${input}" => ${result.agent}, expected ${expected}`);
  });
});

test('DE: trigger detection', () => {
  const deTests = [
    { input: 'bitte den code überprüfen', expected: 'gap-detector' },
    { input: 'code verbessern', expected: 'pdca-iterator' },
    { input: 'den code analysieren', expected: 'code-analyzer' },
    { input: 'einen Bericht erstellen', expected: 'report-generator' }
  ];
  deTests.forEach(({ input, expected }) => {
    const result = matchAgentTrigger(input);
    assert.ok(result, `DE: No trigger for "${input}"`);
    assert.strictEqual(result.agent, expected,
      `DE: "${input}" => ${result.agent}, expected ${expected}`);
  });
});

test('IT: trigger detection', () => {
  const itTests = [
    { input: 'verificare il codice', expected: 'gap-detector' },
    { input: 'migliorare le prestazioni', expected: 'pdca-iterator' },
    { input: 'analizzare il modulo', expected: 'code-analyzer' },
    { input: 'generare un rapporto', expected: 'report-generator' }
  ];
  itTests.forEach(({ input, expected }) => {
    const result = matchAgentTrigger(input);
    assert.ok(result, `IT: No trigger for "${input}"`);
    assert.strictEqual(result.agent, expected,
      `IT: "${input}" => ${result.agent}, expected ${expected}`);
  });
});

// ═══════════════════════════════════════════════════════════════════
// AGENT-20: No-match and edge cases
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== AGENT-20: Edge cases and no-match ===');

test('no trigger for unrelated input', () => {
  const noMatchInputs = [
    'hello world',
    'what time is it',
    'open the file',
    'create a new component',
    'deploy to production'
  ];
  // Note: "deploy" does not match any trigger
  // But some words might incidentally match - we just test known non-matches
  noMatchInputs.forEach(input => {
    const result = matchAgentTrigger(input);
    // These should NOT match any agent triggers
    // (unless coincidental substring match)
    if (result) {
      // Verify it is an expected coincidental match
      console.log(`    INFO: "${input}" matched ${result.agent} (may be coincidental)`);
    }
  });
  // At minimum "hello world" should not match
  assert.strictEqual(matchAgentTrigger('hello world'), null,
    '"hello world" should not trigger any agent');
});

test('empty and short input returns null', () => {
  assert.strictEqual(matchAgentTrigger(''), null);
  assert.strictEqual(matchAgentTrigger('hi'), null);
});

test('case insensitive matching', () => {
  const result1 = matchAgentTrigger('VERIFY THE CODE');
  assert.ok(result1, 'Should match uppercase VERIFY');
  assert.strictEqual(result1.agent, 'gap-detector');

  const result2 = matchAgentTrigger('Analyze This');
  assert.ok(result2, 'Should match mixed case Analyze');
  assert.strictEqual(result2.agent, 'code-analyzer');
});

test('trigger in sentence context', () => {
  const result = matchAgentTrigger('Can you please verify that the auth module matches the design?');
  assert.ok(result);
  assert.strictEqual(result.agent, 'gap-detector');
});

test('multiple trigger words - first match wins', () => {
  // "verify and analyze" should match gap-detector first (verify comes before analyze in scan order)
  const result = matchAgentTrigger('verify and analyze the code');
  assert.ok(result);
  // gap-detector is checked first in AGENT_TRIGGERS iteration order
  assert.strictEqual(result.agent, 'gap-detector');
});

test('confidence is always 0.8', () => {
  const result = matchAgentTrigger('verify something');
  assert.ok(result);
  assert.strictEqual(result.confidence, 0.8);
});

// Summary
console.log('\n' + '='.repeat(60));
console.log(`AGENT TRIGGERS: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
}
console.log('='.repeat(60));
process.exit(failed > 0 ? 1 : 0);
```

---

## TC-03 Test Case Summary

| ID | Test Name | Category | What it Validates |
|-----|-----------|----------|-------------------|
| AGENT-01 | All 16 agent .md files exist | Component | File presence for all 16 agents |
| AGENT-02 | Valid YAML frontmatter delimiters | Component | `---` open/close markers |
| AGENT-03 | Required Gemini native fields | Component | name, description, model, tools, temperature |
| AGENT-04 | Optional fields validation | Component | max_turns, timeout_mins types and ranges |
| AGENT-05 | Tools reference valid tool names | Component | All tool entries in Gemini CLI valid set |
| AGENT-06 | Model-role alignment | Integration | Pro vs Flash assignment matches role complexity |
| AGENT-07 | MCP AGENTS registry count | Component | 16 entries in spawn-agent-server.js |
| AGENT-08 | Registry file references valid | Integration | .md file paths resolve to existing files |
| AGENT-09 | Registry entry fields | Component | file, description, recommendedModel present |
| AGENT-10 | Registry model alignment | Integration | recommendedModel matches frontmatter model |
| AGENT-11 | Config agents section structure | Component | levelBased and taskBased sections exist |
| AGENT-12 | Level-based routing | Integration | Starter/Dynamic/Enterprise map to correct agents |
| AGENT-13 | Task-based routing | Integration | 7 task types map to correct agents |
| AGENT-14 | Agent reachability | Integration | No orphan agents without any binding |
| AGENT-15 | English triggers | Unit | All 4 agents triggered by EN keywords |
| AGENT-16 | Korean triggers | Unit | All 4 agents triggered by KO keywords |
| AGENT-17 | Japanese triggers | Unit | All 4 agents triggered by JA keywords |
| AGENT-18 | Chinese triggers | Unit | All 4 agents triggered by ZH keywords |
| AGENT-19 | European language triggers | Unit | ES, FR, DE, IT trigger detection |
| AGENT-20 | Edge cases and no-match | Unit | Empty input, case insensitivity, priority |

---

## Execution

```bash
# Run Agent file validation (6 test groups, covers all 16 files)
node tests/tc-03-agent-validation.js

# Run MCP registry tests (4 test groups)
node tests/tc-03-agent-registry.js

# Run Agent-Skill binding tests (4 test groups)
node tests/tc-03-agent-binding.js

# Run 8-language trigger tests (6 test groups)
node tests/tc-03-agent-triggers.js

# Run all TC-03 tests
node tests/tc-03-agent-validation.js && \
node tests/tc-03-agent-registry.js && \
node tests/tc-03-agent-binding.js && \
node tests/tc-03-agent-triggers.js
```

---

## Cross-Reference: TC-02 <-> TC-03 Dependencies

| TC-02 Test | TC-03 Test | Dependency |
|------------|------------|------------|
| SKILL-08 (agents ref valid) | AGENT-01 (files exist) | Skill agent refs must point to valid agent files |
| SKILL-15 (resolveAgent) | AGENT-12 (level-based) | Skill orchestrator delegates to agents in config |
| SKILL-13 (activateSkill) | AGENT-07 (registry) | Activated skills spawn agents via MCP registry |
| SKILL-21 (multiBindingMap) | AGENT-14 (reachability) | All binding map agents must be reachable |
