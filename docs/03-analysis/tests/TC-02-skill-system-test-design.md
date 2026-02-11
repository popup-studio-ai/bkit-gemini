# TC-02: Skill System Test Design (25 Cases)

> bkit-gemini v1.5.1 | Gap Detector Agent | 2026-02-11

## Test Scope

Validates the entire Skill System pipeline:
- 21 SKILL.md frontmatter files parsed correctly
- `parseSimpleYaml` handles all YAML subset patterns
- `parseSkillFrontmatter` / `loadSkill` / `activateSkill` orchestration
- Template imports, agent delegation, task auto-creation
- Skill listing, filtering, and PDCA phase queries

## Prerequisites

- Node.js >= 18
- Working directory: project root (`/path/to/bkit-gemini`)
- No external dependencies (tests use only `assert`, `fs`, `path`)

---

## SECTION A: SKILL.md Frontmatter Validation (8 cases)

### Skill Validation Master Script

This script systematically validates ALL 21 SKILL.md files.

```javascript
// tests/tc-02-skill-validation.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(ROOT, 'skills');

// All 21 skill directories
const ALL_SKILLS = [
  'pdca', 'starter', 'dynamic', 'enterprise', 'development-pipeline',
  'code-review', 'zero-script-qa', 'mobile-app', 'desktop-app',
  'bkit-templates', 'bkit-rules', 'gemini-cli-learning',
  'phase-1-schema', 'phase-2-convention', 'phase-3-mockup',
  'phase-4-api', 'phase-5-design-system', 'phase-6-ui-integration',
  'phase-7-seo-security', 'phase-8-review', 'phase-9-deployment'
];

// Required frontmatter fields from buildDefaults() in skill-orchestrator.js
const REQUIRED_FIELDS = ['name', 'description'];
const OPTIONAL_FIELDS_WITH_DEFAULTS = {
  'user-invocable': true,
  'argument-hint': '',
  'allowed-tools': [],
  'imports': [],
  'agents': {},
  'context': 'session',
  'memory': 'project',
  'pdca-phase': 'all',
  'task-template': null
};

const VALID_PDCA_PHASES = ['plan', 'design', 'do', 'check', 'act', 'all'];
const VALID_MEMORY_VALUES = ['project', 'user'];
const VALID_CONTEXT_VALUES = ['session'];

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
 * Minimal YAML parser matching skill-orchestrator.js parseSimpleYaml
 * Duplicated here for standalone test execution
 */
function parseScalar(raw) {
  if (raw === undefined || raw === null) return null;
  const trimmed = raw.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null' || trimmed === '~' || trimmed === '') return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

function parseSimpleYaml(yamlStr) {
  const result = {};
  const lines = yamlStr.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) { i++; continue; }
    const indent = line.search(/\S/);
    if (indent !== 0) { i++; continue; }
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) { i++; continue; }
    const key = line.slice(0, colonIdx).trim();
    const valueRaw = line.slice(colonIdx + 1);
    const valueTrimmed = valueRaw.trim();
    if (valueTrimmed === '|' || valueTrimmed === '>') {
      let block = '';
      i++;
      while (i < lines.length) {
        const bline = lines[i];
        if (bline.trim() && bline.search(/\S/) === 0) break;
        block += (block ? '\n' : '') + bline.replace(/^ {2}/, '');
        i++;
      }
      result[key] = block.trim();
      continue;
    }
    if (valueTrimmed === '') {
      const nextIdx = i + 1;
      if (nextIdx < lines.length) {
        const nextLine = lines[nextIdx];
        const nextIndent = nextLine.search(/\S/);
        if (nextIndent > 0 && nextLine.trim().startsWith('- ')) {
          const items = [];
          i++;
          while (i < lines.length) {
            const lline = lines[i];
            if (!lline.trim()) { i++; continue; }
            const lIndent = lline.search(/\S/);
            if (lIndent === 0) break;
            if (lline.trim().startsWith('- ')) {
              items.push(parseScalar(lline.trim().slice(2)));
            }
            i++;
          }
          result[key] = items;
          continue;
        }
        if (nextIndent > 0 && !nextLine.trim().startsWith('- ')) {
          const map = {};
          i++;
          while (i < lines.length) {
            const mline = lines[i];
            if (!mline.trim() || mline.trim().startsWith('#')) { i++; continue; }
            const mIndent = mline.search(/\S/);
            if (mIndent === 0) break;
            const mColonIdx = mline.indexOf(':');
            if (mColonIdx !== -1) {
              const mKey = mline.slice(0, mColonIdx).trim();
              const mVal = mline.slice(mColonIdx + 1).trim();
              if (mVal.startsWith('"') && mVal.endsWith('"')) {
                map[mKey] = mVal.slice(1, -1);
              } else {
                map[mKey] = parseScalar(mVal);
              }
            }
            i++;
          }
          result[key] = map;
          continue;
        }
      }
    }
    result[key] = parseScalar(valueTrimmed);
    i++;
  }
  return result;
}

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  return parseSimpleYaml(match[1]);
}

// ═══════════════════════════════════════════════════════════════════
// SKILL-01: All 21 SKILL.md files exist
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== SKILL-01: All 21 SKILL.md files exist ===');
test('21 skill directories exist', () => {
  const dirs = fs.readdirSync(SKILLS_DIR).filter(f =>
    fs.statSync(path.join(SKILLS_DIR, f)).isDirectory()
  );
  assert.strictEqual(dirs.length, 21, `Expected 21 skill dirs, got ${dirs.length}`);
});

ALL_SKILLS.forEach(skill => {
  test(`${skill}/SKILL.md exists`, () => {
    const p = path.join(SKILLS_DIR, skill, 'SKILL.md');
    assert.ok(fs.existsSync(p), `Missing: ${p}`);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SKILL-02: All SKILL.md have valid YAML frontmatter delimiters
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== SKILL-02: Valid YAML frontmatter delimiters ===');
ALL_SKILLS.forEach(skill => {
  test(`${skill} has --- delimiters`, () => {
    const content = fs.readFileSync(path.join(SKILLS_DIR, skill, 'SKILL.md'), 'utf-8');
    assert.ok(content.startsWith('---\n'), `${skill}: Must start with ---`);
    const secondDelim = content.indexOf('\n---', 4);
    assert.ok(secondDelim > 0, `${skill}: Missing closing ---`);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SKILL-03: Required fields (name, description) present
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== SKILL-03: Required fields present ===');
ALL_SKILLS.forEach(skill => {
  test(`${skill} has name and description`, () => {
    const content = fs.readFileSync(path.join(SKILLS_DIR, skill, 'SKILL.md'), 'utf-8');
    const fm = extractFrontmatter(content);
    assert.ok(fm, `${skill}: No frontmatter parsed`);
    assert.ok(fm.name, `${skill}: Missing 'name'`);
    assert.ok(fm.description, `${skill}: Missing 'description'`);
    assert.strictEqual(typeof fm.name, 'string', `${skill}: name must be string`);
    assert.strictEqual(typeof fm.description, 'string', `${skill}: description must be string`);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SKILL-04: name matches directory name
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== SKILL-04: name matches directory name ===');
ALL_SKILLS.forEach(skill => {
  test(`${skill} name matches dir`, () => {
    const content = fs.readFileSync(path.join(SKILLS_DIR, skill, 'SKILL.md'), 'utf-8');
    const fm = extractFrontmatter(content);
    assert.ok(fm, `${skill}: No frontmatter`);
    assert.strictEqual(fm.name, skill, `${skill}: name '${fm.name}' != dir '${skill}'`);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SKILL-05: v1.5.1 fields have correct types
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== SKILL-05: v1.5.1 field types correct ===');
ALL_SKILLS.forEach(skill => {
  test(`${skill} field types valid`, () => {
    const content = fs.readFileSync(path.join(SKILLS_DIR, skill, 'SKILL.md'), 'utf-8');
    const fm = extractFrontmatter(content);
    assert.ok(fm, `${skill}: No frontmatter`);

    // user-invocable: boolean
    if (fm['user-invocable'] !== undefined) {
      assert.strictEqual(typeof fm['user-invocable'], 'boolean',
        `${skill}: user-invocable must be boolean, got ${typeof fm['user-invocable']}`);
    }

    // allowed-tools: array
    if (fm['allowed-tools'] !== undefined) {
      assert.ok(Array.isArray(fm['allowed-tools']),
        `${skill}: allowed-tools must be array`);
    }

    // imports: array
    if (fm.imports !== undefined) {
      assert.ok(Array.isArray(fm.imports),
        `${skill}: imports must be array`);
    }

    // agents: object
    if (fm.agents !== undefined) {
      assert.strictEqual(typeof fm.agents, 'object',
        `${skill}: agents must be object`);
      assert.ok(!Array.isArray(fm.agents),
        `${skill}: agents must not be array`);
    }

    // context: string
    if (fm.context) {
      assert.ok(VALID_CONTEXT_VALUES.includes(fm.context),
        `${skill}: context '${fm.context}' not in ${VALID_CONTEXT_VALUES}`);
    }

    // memory: string
    if (fm.memory) {
      assert.ok(VALID_MEMORY_VALUES.includes(fm.memory),
        `${skill}: memory '${fm.memory}' not in ${VALID_MEMORY_VALUES}`);
    }

    // pdca-phase: string
    if (fm['pdca-phase']) {
      assert.ok(VALID_PDCA_PHASES.includes(fm['pdca-phase']),
        `${skill}: pdca-phase '${fm['pdca-phase']}' not in ${VALID_PDCA_PHASES}`);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// SKILL-06: task-template fields valid when present
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== SKILL-06: task-template structure valid ===');
ALL_SKILLS.forEach(skill => {
  test(`${skill} task-template valid`, () => {
    const content = fs.readFileSync(path.join(SKILLS_DIR, skill, 'SKILL.md'), 'utf-8');
    const fm = extractFrontmatter(content);
    if (fm && fm['task-template']) {
      const tt = fm['task-template'];
      assert.strictEqual(typeof tt, 'object', `${skill}: task-template must be object`);
      if (tt.subject) assert.strictEqual(typeof tt.subject, 'string');
      if (tt.description) assert.strictEqual(typeof tt.description, 'string');
      if (tt.activeForm) assert.strictEqual(typeof tt.activeForm, 'string');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// SKILL-07: imports reference valid template paths
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== SKILL-07: imports reference existing files ===');
ALL_SKILLS.forEach(skill => {
  test(`${skill} import paths valid`, () => {
    const content = fs.readFileSync(path.join(SKILLS_DIR, skill, 'SKILL.md'), 'utf-8');
    const fm = extractFrontmatter(content);
    if (fm && Array.isArray(fm.imports) && fm.imports.length > 0) {
      fm.imports.forEach(imp => {
        const fullPath = path.resolve(ROOT, imp);
        assert.ok(fs.existsSync(fullPath),
          `${skill}: import '${imp}' not found at '${fullPath}'`);
      });
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// SKILL-08: agents reference valid agent names
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== SKILL-08: agents reference valid agent files ===');
const AGENTS_DIR = path.join(ROOT, 'agents');
ALL_SKILLS.forEach(skill => {
  test(`${skill} agent refs valid`, () => {
    const content = fs.readFileSync(path.join(SKILLS_DIR, skill, 'SKILL.md'), 'utf-8');
    const fm = extractFrontmatter(content);
    if (fm && fm.agents && typeof fm.agents === 'object') {
      Object.entries(fm.agents).forEach(([action, agentName]) => {
        if (agentName) {
          const agentFile = path.join(AGENTS_DIR, `${agentName}.md`);
          assert.ok(fs.existsSync(agentFile),
            `${skill}: agent '${agentName}' for action '${action}' - file not found: ${agentFile}`);
        }
      });
    }
  });
});

// Summary
console.log('\n' + '='.repeat(60));
console.log(`SKILL VALIDATION: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
}
console.log('='.repeat(60));
process.exit(failed > 0 ? 1 : 0);
```

---

## SECTION B: Skill Orchestrator Unit Tests (12 cases)

```javascript
// tests/tc-02-skill-orchestrator.js
const assert = require('assert');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const orchestrator = require(path.join(ROOT, 'lib', 'skill-orchestrator'));

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

function setup() {
  orchestrator.clearCache();
}

// ═══════════════════════════════════════════════════════════════════
// SKILL-09: parseSimpleYaml - scalar values
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== SKILL-09: parseSimpleYaml scalar parsing ===');
setup();

test('parseScalar: string value', () => {
  assert.strictEqual(orchestrator.parseScalar('hello'), 'hello');
});

test('parseScalar: quoted string', () => {
  assert.strictEqual(orchestrator.parseScalar('"hello world"'), 'hello world');
});

test('parseScalar: single-quoted string', () => {
  assert.strictEqual(orchestrator.parseScalar("'test'"), 'test');
});

test('parseScalar: boolean true', () => {
  assert.strictEqual(orchestrator.parseScalar('true'), true);
});

test('parseScalar: boolean false', () => {
  assert.strictEqual(orchestrator.parseScalar('false'), false);
});

test('parseScalar: null variants', () => {
  assert.strictEqual(orchestrator.parseScalar('null'), null);
  assert.strictEqual(orchestrator.parseScalar('~'), null);
  assert.strictEqual(orchestrator.parseScalar(''), null);
});

test('parseScalar: number', () => {
  assert.strictEqual(orchestrator.parseScalar('42'), 42);
  assert.strictEqual(orchestrator.parseScalar('3.14'), 3.14);
  assert.strictEqual(orchestrator.parseScalar('-7'), -7);
});

test('parseScalar: undefined/null input', () => {
  assert.strictEqual(orchestrator.parseScalar(undefined), null);
  assert.strictEqual(orchestrator.parseScalar(null), null);
});

// ═══════════════════════════════════════════════════════════════════
// SKILL-10: parseSimpleYaml - complex structures
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== SKILL-10: parseSimpleYaml complex structures ===');
setup();

test('parse key-value pairs', () => {
  const yaml = 'name: pdca\ncontext: session';
  const result = orchestrator.parseSimpleYaml(yaml);
  assert.strictEqual(result.name, 'pdca');
  assert.strictEqual(result.context, 'session');
});

test('parse block scalar (|)', () => {
  const yaml = 'description: |\n  Line one\n  Line two\nname: test';
  const result = orchestrator.parseSimpleYaml(yaml);
  assert.ok(result.description.includes('Line one'));
  assert.ok(result.description.includes('Line two'));
  assert.strictEqual(result.name, 'test');
});

test('parse list items', () => {
  const yaml = 'allowed-tools:\n  - read_file\n  - write_file\n  - glob_tool';
  const result = orchestrator.parseSimpleYaml(yaml);
  assert.ok(Array.isArray(result['allowed-tools']));
  assert.strictEqual(result['allowed-tools'].length, 3);
  assert.strictEqual(result['allowed-tools'][0], 'read_file');
  assert.strictEqual(result['allowed-tools'][1], 'write_file');
  assert.strictEqual(result['allowed-tools'][2], 'glob_tool');
});

test('parse nested mapping', () => {
  const yaml = 'agents:\n  analyze: gap-detector\n  iterate: pdca-iterator';
  const result = orchestrator.parseSimpleYaml(yaml);
  assert.strictEqual(typeof result.agents, 'object');
  assert.strictEqual(result.agents.analyze, 'gap-detector');
  assert.strictEqual(result.agents.iterate, 'pdca-iterator');
});

test('parse empty list', () => {
  const yaml = 'imports: []\nname: test';
  // Note: parseSimpleYaml sees "[]" as scalar, not empty array
  // The applyDefaults function handles normalization
  const result = orchestrator.parseSimpleYaml(yaml);
  // The literal [] is parsed as string "[]" by parseScalar
  assert.strictEqual(result.name, 'test');
});

test('parse empty mapping', () => {
  const yaml = 'agents: {}\nname: test';
  // Similar: {} parsed as string
  const result = orchestrator.parseSimpleYaml(yaml);
  assert.strictEqual(result.name, 'test');
});

test('skip comments and blank lines', () => {
  const yaml = '# comment\nname: test\n\n# another comment\ncontext: session';
  const result = orchestrator.parseSimpleYaml(yaml);
  assert.strictEqual(result.name, 'test');
  assert.strictEqual(result.context, 'session');
});

test('parse task-template nested object', () => {
  const yaml = [
    'task-template:',
    '  subject: "PDCA {action} - {feature}"',
    '  description: "Execute PDCA {action} phase"',
    '  activeForm: "Executing PDCA {action}"'
  ].join('\n');
  const result = orchestrator.parseSimpleYaml(yaml);
  assert.strictEqual(typeof result['task-template'], 'object');
  assert.strictEqual(result['task-template'].subject, 'PDCA {action} - {feature}');
  assert.strictEqual(result['task-template'].activeForm, 'Executing PDCA {action}');
});

// ═══════════════════════════════════════════════════════════════════
// SKILL-11: parseSkillFrontmatter returns normalized metadata
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== SKILL-11: parseSkillFrontmatter normalization ===');
setup();

test('parseSkillFrontmatter for pdca skill', () => {
  const skillPath = path.join(ROOT, 'skills', 'pdca', 'SKILL.md');
  const meta = orchestrator.parseSkillFrontmatter(skillPath);
  assert.strictEqual(meta.name, 'pdca');
  assert.ok(meta.description.length > 0);
  assert.strictEqual(meta['user-invocable'], true);
  assert.ok(Array.isArray(meta['allowed-tools']));
  assert.ok(meta['allowed-tools'].length > 0);
  assert.ok(Array.isArray(meta.imports));
  assert.ok(meta.imports.length > 0);
  assert.strictEqual(typeof meta.agents, 'object');
  assert.strictEqual(meta.agents.analyze, 'gap-detector');
  assert.strictEqual(meta.agents.iterate, 'pdca-iterator');
  assert.strictEqual(meta.agents.report, 'report-generator');
  assert.strictEqual(meta.context, 'session');
  assert.strictEqual(meta.memory, 'project');
  assert.strictEqual(meta['pdca-phase'], 'all');
  assert.ok(meta['task-template'] !== null);
});

test('parseSkillFrontmatter applies defaults for missing fields', () => {
  const skillPath = path.join(ROOT, 'skills', 'bkit-templates', 'SKILL.md');
  const meta = orchestrator.parseSkillFrontmatter(skillPath);
  assert.strictEqual(meta.name, 'bkit-templates');
  assert.strictEqual(meta['user-invocable'], true);
  assert.strictEqual(meta.context, 'session');
  assert.strictEqual(meta.memory, 'project');
});

test('buildDefaults returns complete object', () => {
  const defaults = orchestrator.buildDefaults('test-skill', 'A test');
  assert.strictEqual(defaults.name, 'test-skill');
  assert.strictEqual(defaults.description, 'A test');
  assert.strictEqual(defaults['user-invocable'], true);
  assert.strictEqual(defaults['argument-hint'], '');
  assert.ok(Array.isArray(defaults['allowed-tools']));
  assert.strictEqual(defaults['allowed-tools'].length, 0);
  assert.ok(Array.isArray(defaults.imports));
  assert.strictEqual(defaults.imports.length, 0);
  assert.strictEqual(typeof defaults.agents, 'object');
  assert.strictEqual(Object.keys(defaults.agents).length, 0);
  assert.strictEqual(defaults.context, 'session');
  assert.strictEqual(defaults.memory, 'project');
  assert.strictEqual(defaults['pdca-phase'], 'all');
  assert.strictEqual(defaults['task-template'], null);
});

// ═══════════════════════════════════════════════════════════════════
// SKILL-12: loadSkill returns metadata + body + templates
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== SKILL-12: loadSkill returns correct structure ===');
setup();

test('loadSkill for pdca returns all three components', () => {
  const result = orchestrator.loadSkill('pdca');
  assert.ok(result !== null, 'loadSkill should not return null');
  assert.ok(result.metadata, 'should have metadata');
  assert.ok(typeof result.body === 'string', 'should have body string');
  assert.ok(Array.isArray(result.templates), 'should have templates array');
  assert.strictEqual(result.metadata.name, 'pdca');
  assert.ok(result.body.includes('PDCA'), 'body should contain skill content');
  assert.ok(result.templates.length > 0, 'pdca has template imports');
});

test('loadSkill for nonexistent skill returns null', () => {
  const result = orchestrator.loadSkill('nonexistent-skill-xyz');
  assert.strictEqual(result, null);
});

test('loadSkill with null returns null', () => {
  const result = orchestrator.loadSkill(null);
  assert.strictEqual(result, null);
});

test('loadSkill with empty string returns null', () => {
  const result = orchestrator.loadSkill('');
  assert.strictEqual(result, null);
});

test('loadSkill for skill without imports returns empty templates', () => {
  const result = orchestrator.loadSkill('code-review');
  assert.ok(result !== null);
  assert.strictEqual(result.templates.length, 0);
});

// ═══════════════════════════════════════════════════════════════════
// SKILL-13: activateSkill sets active state
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== SKILL-13: activateSkill lifecycle ===');
setup();

test('activateSkill returns success with metadata', () => {
  const result = orchestrator.activateSkill('pdca', 'analyze', 'auth');
  assert.ok(result !== null);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.agent, 'gap-detector');
  assert.ok(result.metadata);
  assert.ok(Array.isArray(result.templates));
});

test('activateSkill sets active skill state', () => {
  orchestrator.clearCache();
  orchestrator.activateSkill('starter', 'guide');
  const active = orchestrator.getActiveSkill();
  assert.ok(active !== null);
  assert.strictEqual(active.name, 'starter');
  assert.strictEqual(active.action, 'guide');
});

test('activateSkill for nonexistent skill returns null', () => {
  const result = orchestrator.activateSkill('fake-skill-xyz');
  assert.strictEqual(result, null);
});

test('activateSkill without action returns null agent', () => {
  orchestrator.clearCache();
  const result = orchestrator.activateSkill('code-review');
  assert.ok(result !== null);
  assert.strictEqual(result.agent, null);
});

test('activateSkill with action creates task from template', () => {
  orchestrator.clearCache();
  const result = orchestrator.activateSkill('pdca', 'analyze', 'login-feature');
  assert.ok(result.task !== null, 'pdca has task-template, should create task');
  assert.ok(result.task.subject.includes('login-feature') || result.task.subject.includes('analyze'));
});

// ═══════════════════════════════════════════════════════════════════
// SKILL-14: deactivateSkill clears state
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== SKILL-14: deactivateSkill ===');
setup();

test('deactivateSkill clears active skill', () => {
  orchestrator.activateSkill('pdca');
  assert.ok(orchestrator.getActiveSkill() !== null);
  const deactivated = orchestrator.deactivateSkill();
  assert.strictEqual(deactivated, true);
  assert.strictEqual(orchestrator.getActiveSkill(), null);
});

test('deactivateSkill with mismatched name does nothing', () => {
  orchestrator.clearCache();
  orchestrator.activateSkill('pdca');
  const deactivated = orchestrator.deactivateSkill('starter');
  assert.strictEqual(deactivated, false);
  assert.ok(orchestrator.getActiveSkill() !== null);
});

test('deactivateSkill when no active skill returns false', () => {
  orchestrator.clearCache();
  const deactivated = orchestrator.deactivateSkill();
  assert.strictEqual(deactivated, false);
});

// ═══════════════════════════════════════════════════════════════════
// SKILL-15: resolveAgent maps action to agent
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== SKILL-15: resolveAgent delegation ===');
setup();

test('resolveAgent maps pdca analyze to gap-detector', () => {
  orchestrator.loadSkill('pdca'); // populate cache
  const agent = orchestrator.resolveAgent('pdca', 'analyze');
  assert.strictEqual(agent, 'gap-detector');
});

test('resolveAgent maps pdca iterate to pdca-iterator', () => {
  const agent = orchestrator.resolveAgent('pdca', 'iterate');
  assert.strictEqual(agent, 'pdca-iterator');
});

test('resolveAgent maps pdca report to report-generator', () => {
  const agent = orchestrator.resolveAgent('pdca', 'report');
  assert.strictEqual(agent, 'report-generator');
});

test('resolveAgent returns null for unknown action', () => {
  const agent = orchestrator.resolveAgent('pdca', 'unknown-action');
  assert.strictEqual(agent, null);
});

test('resolveAgent returns null when no action given', () => {
  const agent = orchestrator.resolveAgent('pdca');
  assert.strictEqual(agent, null);
});

// ═══════════════════════════════════════════════════════════════════
// SKILL-16: createTaskFromTemplate substitutes variables
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== SKILL-16: createTaskFromTemplate ===');

test('substitutes {action} and {feature}', () => {
  const template = {
    subject: 'PDCA {action} - {feature}',
    description: 'Execute PDCA {action} phase for {feature}',
    activeForm: 'Executing PDCA {action}'
  };
  const task = orchestrator.createTaskFromTemplate(template, {
    action: 'analyze',
    feature: 'auth'
  });
  assert.strictEqual(task.subject, 'PDCA analyze - auth');
  assert.strictEqual(task.description, 'Execute PDCA analyze phase for auth');
  assert.strictEqual(task.activeForm, 'Executing PDCA analyze');
});

test('handles missing params gracefully', () => {
  const template = { subject: 'PDCA {action} - {feature}' };
  const task = orchestrator.createTaskFromTemplate(template, {});
  assert.strictEqual(task.subject, 'PDCA  -');
});

test('null template returns null', () => {
  const task = orchestrator.createTaskFromTemplate(null, {});
  assert.strictEqual(task, null);
});

// ═══════════════════════════════════════════════════════════════════
// SKILL-17: delegateToAgent builds prompt
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== SKILL-17: delegateToAgent ===');
setup();

test('delegateToAgent builds correct prompt', () => {
  orchestrator.activateSkill('pdca', 'analyze', 'auth');
  const result = orchestrator.delegateToAgent('gap-detector',
    { subject: 'Analyze auth', description: 'Check auth implementation' },
    { feature: 'auth', phase: 'check' }
  );
  assert.strictEqual(result.agent, 'gap-detector');
  assert.ok(result.prompt.includes('Check auth implementation'));
  assert.ok(result.prompt.includes('Feature: auth'));
  assert.ok(result.prompt.includes('PDCA Phase: check'));
  assert.strictEqual(result.context.delegatedFrom, 'pdca');
});

test('delegateToAgent with null returns empty', () => {
  const result = orchestrator.delegateToAgent(null, null);
  assert.strictEqual(result.agent, null);
  assert.strictEqual(result.prompt, '');
});

// ═══════════════════════════════════════════════════════════════════
// SKILL-18: listSkills returns all skills
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== SKILL-18: listSkills ===');
setup();

test('listSkills returns 21 entries', () => {
  const skills = orchestrator.listSkills();
  assert.strictEqual(skills.length, 21, `Expected 21, got ${skills.length}`);
});

test('listSkills entries have required fields', () => {
  const skills = orchestrator.listSkills();
  skills.forEach(s => {
    assert.ok(s.name, `Skill missing name`);
    assert.ok(typeof s.description === 'string', `${s.name}: description not string`);
    assert.ok(typeof s.userInvocable === 'boolean', `${s.name}: userInvocable not boolean`);
    assert.ok(typeof s.pdcaPhase === 'string', `${s.name}: pdcaPhase not string`);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SKILL-19: getUserInvocableSkills filters correctly
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== SKILL-19: getUserInvocableSkills ===');
setup();

test('getUserInvocableSkills returns only user-invocable skills', () => {
  const skills = orchestrator.getUserInvocableSkills();
  assert.ok(skills.length > 0, 'Should have at least 1 user-invocable skill');
  skills.forEach(s => {
    assert.ok(s.name, 'Each skill must have name');
    assert.ok(typeof s.description === 'string', 'Each skill must have description');
  });
});

// ═══════════════════════════════════════════════════════════════════
// SKILL-20: getSkillsByPhase filters by PDCA phase
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== SKILL-20: getSkillsByPhase ===');
setup();

test('getSkillsByPhase("plan") includes phase-1-schema', () => {
  const skills = orchestrator.getSkillsByPhase('plan');
  const names = skills.map(s => s.name);
  assert.ok(names.includes('phase-1-schema'),
    `plan phase should include phase-1-schema, got: ${names.join(', ')}`);
});

test('getSkillsByPhase("check") includes zero-script-qa', () => {
  const skills = orchestrator.getSkillsByPhase('check');
  const names = skills.map(s => s.name);
  assert.ok(names.includes('zero-script-qa'),
    `check phase should include zero-script-qa, got: ${names.join(', ')}`);
});

test('getSkillsByPhase("do") includes code-review', () => {
  const skills = orchestrator.getSkillsByPhase('do');
  const names = skills.map(s => s.name);
  assert.ok(names.includes('code-review'),
    `do phase should include code-review, got: ${names.join(', ')}`);
});

test('getSkillsByPhase("all") or null returns all skills', () => {
  const skills = orchestrator.getSkillsByPhase(null);
  assert.strictEqual(skills.length, 21);
});

test('skills with pdca-phase "all" appear in every phase', () => {
  const planSkills = orchestrator.getSkillsByPhase('plan');
  const doSkills = orchestrator.getSkillsByPhase('do');
  const checkSkills = orchestrator.getSkillsByPhase('check');

  // pdca skill has pdca-phase: all
  const planNames = planSkills.map(s => s.name);
  const doNames = doSkills.map(s => s.name);
  const checkNames = checkSkills.map(s => s.name);

  assert.ok(planNames.includes('pdca'), 'pdca (all) should appear in plan');
  assert.ok(doNames.includes('pdca'), 'pdca (all) should appear in do');
  assert.ok(checkNames.includes('pdca'), 'pdca (all) should appear in check');
});

// ═══════════════════════════════════════════════════════════════════
// SKILL-21: getMultiBindingMap
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== SKILL-21: getMultiBindingMap ===');
setup();

test('getMultiBindingMap for pdca returns 3 bindings', () => {
  const map = orchestrator.getMultiBindingMap('pdca');
  assert.strictEqual(Object.keys(map).length, 3);
  assert.strictEqual(map.analyze, 'gap-detector');
  assert.strictEqual(map.iterate, 'pdca-iterator');
  assert.strictEqual(map.report, 'report-generator');
});

test('getMultiBindingMap for skill without agents returns empty', () => {
  const map = orchestrator.getMultiBindingMap('bkit-templates');
  assert.strictEqual(Object.keys(map).length, 0);
});

// ═══════════════════════════════════════════════════════════════════
// SKILL-22/23: Cache behavior
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== SKILL-22: Cache behavior ===');

test('clearCache resets all state', () => {
  orchestrator.activateSkill('pdca');
  assert.ok(orchestrator.getActiveSkill() !== null);
  orchestrator.clearCache();
  assert.strictEqual(orchestrator.getActiveSkill(), null);
});

test('loadSkill uses cache on second call', () => {
  orchestrator.clearCache();
  const first = orchestrator.loadSkill('pdca');
  const second = orchestrator.loadSkill('pdca');
  assert.deepStrictEqual(first.metadata, second.metadata);
});

// ═══════════════════════════════════════════════════════════════════
// SKILL-24/25: getSkillInfo and getAvailableTemplates
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== SKILL-24: getSkillInfo and getAvailableTemplates ===');
setup();

test('getSkillInfo for existing skill returns metadata', () => {
  const info = orchestrator.getSkillInfo('pdca');
  assert.ok(info !== null);
  assert.strictEqual(info.name, 'pdca');
  assert.ok(info.description.length > 0);
});

test('getSkillInfo for nonexistent skill returns null', () => {
  assert.strictEqual(orchestrator.getSkillInfo('xyz-nope'), null);
});

test('getAvailableTemplates for pdca returns template paths', () => {
  const templates = orchestrator.getAvailableTemplates('pdca');
  assert.ok(Array.isArray(templates));
  assert.ok(templates.length > 0);
  assert.ok(templates.some(t => t.includes('plan.template.md')));
});

test('getAvailableTemplates for skill without imports returns empty', () => {
  const templates = orchestrator.getAvailableTemplates('code-review');
  assert.ok(Array.isArray(templates));
  assert.strictEqual(templates.length, 0);
});

// Summary
console.log('\n' + '='.repeat(60));
console.log(`SKILL ORCHESTRATOR: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
}
console.log('='.repeat(60));
process.exit(failed > 0 ? 1 : 0);
```

---

## TC-02 Test Case Summary

| ID | Test Name | Category | What it Validates |
|-----|-----------|----------|-------------------|
| SKILL-01 | All 21 SKILL.md files exist | Component | File presence for all 21 skills |
| SKILL-02 | Valid YAML frontmatter delimiters | Component | `---` open/close markers |
| SKILL-03 | Required fields present | Component | `name` and `description` in all 21 |
| SKILL-04 | name matches directory name | Component | `name` field == directory name |
| SKILL-05 | v1.5.1 field types correct | Component | Type validation for all optional fields |
| SKILL-06 | task-template structure valid | Component | Nested object structure when present |
| SKILL-07 | imports reference existing files | Integration | Template paths resolve to real files |
| SKILL-08 | agents reference valid agent files | Integration | Agent names map to existing .md files |
| SKILL-09 | parseSimpleYaml scalar parsing | Unit | String, number, boolean, null parsing |
| SKILL-10 | parseSimpleYaml complex structures | Unit | Block scalars, lists, nested maps |
| SKILL-11 | parseSkillFrontmatter normalization | Unit | Default application and type coercion |
| SKILL-12 | loadSkill returns correct structure | Unit | metadata + body + templates composition |
| SKILL-13 | activateSkill lifecycle | Unit | State management and delegation |
| SKILL-14 | deactivateSkill | Unit | State clearing and name matching |
| SKILL-15 | resolveAgent delegation | Unit | Action-to-agent mapping |
| SKILL-16 | createTaskFromTemplate | Unit | Variable substitution in templates |
| SKILL-17 | delegateToAgent | Unit | Prompt building and context passing |
| SKILL-18 | listSkills | Unit | Returns all 21 skills with fields |
| SKILL-19 | getUserInvocableSkills | Unit | Filters by user-invocable flag |
| SKILL-20 | getSkillsByPhase | Unit | PDCA phase filtering incl. "all" |
| SKILL-21 | getMultiBindingMap | Unit | Agent binding map extraction |
| SKILL-22 | Cache behavior - clearCache | Unit | State reset completeness |
| SKILL-23 | Cache behavior - reuse | Unit | Metadata cache consistency |
| SKILL-24 | getSkillInfo | Unit | Skill metadata retrieval |
| SKILL-25 | getAvailableTemplates | Unit | Template path listing |

---

## Execution

```bash
# Run SKILL.md validation (8 aggregate test groups, covers all 21 files)
node tests/tc-02-skill-validation.js

# Run Skill Orchestrator unit tests (17 test groups)
node tests/tc-02-skill-orchestrator.js
```
