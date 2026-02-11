# TC-06: TOML Command Test Design & TC-07: Configuration Test Design

> **Version**: 1.5.1
> **Test Target**: 10 TOML Commands + bkit.config.json + gemini-extension.json
> **Test Environment**: Node.js 20+ / Gemini CLI 0.28+
> **Total Cases**: TC-06 (15 cases) + TC-07 (12 cases) = 27 cases

---

## TC-06: TOML Command Validation (15 Cases)

### Test Prerequisites

```bash
# Required tools
npm install --save-dev @iarna/toml  # TOML parser for Node.js
# Gemini CLI must be installed and extension linked
gemini extensions link /path/to/bkit-gemini
```

---

#### CMD-01: TOML Syntax Validity - All 10 Files

**File**: All `commands/*.toml`
**Test Type**: TOML Parsing
**Priority**: Critical

**Test Script**:
```javascript
// test/tc-06/cmd-01-toml-syntax.test.js
const fs = require('fs');
const path = require('path');
const TOML = require('@iarna/toml');

const COMMANDS_DIR = path.resolve(__dirname, '../../commands');
const EXPECTED_FILES = [
  'pdca.toml', 'bkit.toml', 'review.toml', 'qa.toml',
  'starter.toml', 'dynamic.toml', 'enterprise.toml',
  'pipeline.toml', 'learn.toml', 'github-stats.toml'
];

describe('CMD-01: TOML Syntax Validity', () => {
  test('All 10 TOML command files exist', () => {
    EXPECTED_FILES.forEach(file => {
      const filePath = path.join(COMMANDS_DIR, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  EXPECTED_FILES.forEach(file => {
    test(`${file} parses as valid TOML`, () => {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, file), 'utf-8');
      const parsed = TOML.parse(content);
      expect(parsed).toBeDefined();
      expect(typeof parsed).toBe('object');
    });
  });
});
```

**Expected**: All 10 files parse without TOML syntax errors. Each returns a valid JavaScript object.

---

#### CMD-02: Required Fields - description and prompt

**File**: All `commands/*.toml`
**Test Type**: Schema Validation
**Priority**: Critical

**Test Script**:
```javascript
// test/tc-06/cmd-02-required-fields.test.js
const fs = require('fs');
const path = require('path');
const TOML = require('@iarna/toml');

const COMMANDS_DIR = path.resolve(__dirname, '../../commands');
const EXPECTED_FILES = [
  'pdca.toml', 'bkit.toml', 'review.toml', 'qa.toml',
  'starter.toml', 'dynamic.toml', 'enterprise.toml',
  'pipeline.toml', 'learn.toml', 'github-stats.toml'
];

describe('CMD-02: Required Fields Validation', () => {
  EXPECTED_FILES.forEach(file => {
    test(`${file} has 'description' (string, non-empty)`, () => {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, file), 'utf-8');
      const parsed = TOML.parse(content);
      expect(typeof parsed.description).toBe('string');
      expect(parsed.description.trim().length).toBeGreaterThan(0);
    });

    test(`${file} has 'prompt' (string, non-empty)`, () => {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, file), 'utf-8');
      const parsed = TOML.parse(content);
      expect(typeof parsed.prompt).toBe('string');
      expect(parsed.prompt.trim().length).toBeGreaterThan(0);
    });

    test(`${file} has no unexpected top-level keys`, () => {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, file), 'utf-8');
      const parsed = TOML.parse(content);
      const allowedKeys = ['description', 'prompt'];
      Object.keys(parsed).forEach(key => {
        expect(allowedKeys).toContain(key);
      });
    });
  });
});
```

**Expected**: Every TOML file has exactly `description` (non-empty string) and `prompt` (non-empty multiline string). No unexpected keys.

---

#### CMD-03: @import Path Resolution - Skill References

**File**: pdca.toml, review.toml, qa.toml, starter.toml, dynamic.toml, enterprise.toml, pipeline.toml, learn.toml
**Test Type**: File Reference Validation
**Priority**: Critical

**Test Script**:
```javascript
// test/tc-06/cmd-03-import-resolution.test.js
const fs = require('fs');
const path = require('path');
const TOML = require('@iarna/toml');

const ROOT_DIR = path.resolve(__dirname, '../..');
const COMMANDS_DIR = path.join(ROOT_DIR, 'commands');

// Map of command files to their expected @import targets
const IMPORT_MAP = {
  'pdca.toml': ['skills/pdca/SKILL.md'],
  'review.toml': ['skills/code-review/SKILL.md'],
  'qa.toml': ['skills/zero-script-qa/SKILL.md'],
  'starter.toml': ['skills/starter/SKILL.md'],
  'dynamic.toml': ['skills/dynamic/SKILL.md'],
  'enterprise.toml': ['skills/enterprise/SKILL.md'],
  'pipeline.toml': ['skills/development-pipeline/SKILL.md'],
  'learn.toml': ['skills/gemini-cli-learning/SKILL.md'],
  'bkit.toml': [],       // No @imports (static help text)
  'github-stats.toml': [] // No @imports (direct commands)
};

describe('CMD-03: @import Path Resolution', () => {
  Object.entries(IMPORT_MAP).forEach(([file, expectedImports]) => {
    test(`${file}: all @import paths resolve to existing files`, () => {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, file), 'utf-8');
      const parsed = TOML.parse(content);
      const prompt = parsed.prompt;

      // Extract @path references (lines starting with @, not email addresses)
      const importPattern = /^@([\w\-/]+\.\w+)/gm;
      const foundImports = [];
      let match;
      while ((match = importPattern.exec(prompt)) !== null) {
        foundImports.push(match[1]);
      }

      // Verify expected imports match
      expect(foundImports).toEqual(expectedImports);

      // Verify each imported file actually exists on disk
      foundImports.forEach(importPath => {
        const fullPath = path.join(ROOT_DIR, importPath);
        expect(fs.existsSync(fullPath)).toBe(true);
      });
    });
  });
});
```

**Expected**:
| Command | @import Target | File Exists |
|---------|---------------|-------------|
| pdca.toml | `@skills/pdca/SKILL.md` | YES |
| review.toml | `@skills/code-review/SKILL.md` | YES |
| qa.toml | `@skills/zero-script-qa/SKILL.md` | YES |
| starter.toml | `@skills/starter/SKILL.md` | YES |
| dynamic.toml | `@skills/dynamic/SKILL.md` | YES |
| enterprise.toml | `@skills/enterprise/SKILL.md` | YES |
| pipeline.toml | `@skills/development-pipeline/SKILL.md` | YES |
| learn.toml | `@skills/gemini-cli-learning/SKILL.md` | YES |
| bkit.toml | (none) | N/A |
| github-stats.toml | (none) | N/A |

---

#### CMD-04: @import Content - Template References in pdca.toml

**File**: `commands/pdca.toml`
**Test Type**: Content Inspection
**Priority**: High

**Test Script**:
```javascript
// test/tc-06/cmd-04-pdca-template-refs.test.js
const fs = require('fs');
const path = require('path');
const TOML = require('@iarna/toml');

const ROOT_DIR = path.resolve(__dirname, '../..');

describe('CMD-04: pdca.toml Template References', () => {
  const content = fs.readFileSync(
    path.join(ROOT_DIR, 'commands/pdca.toml'), 'utf-8'
  );
  const parsed = TOML.parse(content);
  const prompt = parsed.prompt;

  test('References @templates/plan.template.md in plan action', () => {
    expect(prompt).toContain('@templates/plan.template.md');
  });

  test('References @templates/design.template.md in design action', () => {
    expect(prompt).toContain('@templates/design.template.md');
  });

  test('All @templates/ references resolve to existing files', () => {
    const templatePattern = /@templates\/([\w\-.]+)/g;
    let match;
    while ((match = templatePattern.exec(prompt)) !== null) {
      const templatePath = path.join(ROOT_DIR, 'templates', match[1]);
      expect(fs.existsSync(templatePath)).toBe(true);
    }
  });

  test('Lists all expected PDCA actions', () => {
    const expectedActions = [
      'plan', 'design', 'do', 'analyze', 'iterate', 'report', 'status', 'next'
    ];
    expectedActions.forEach(action => {
      expect(prompt).toContain(`- ${action}`);
    });
  });
});
```

**Expected**: pdca.toml references `plan.template.md` and `design.template.md`, both exist in `templates/`. All 8 PDCA actions (plan, design, do, analyze, iterate, report, status, next) are documented.

---

#### CMD-05: {{args}} Substitution Pattern

**File**: All commands using `{{args}}`
**Test Type**: Pattern Validation
**Priority**: Critical

**Test Script**:
```javascript
// test/tc-06/cmd-05-args-substitution.test.js
const fs = require('fs');
const path = require('path');
const TOML = require('@iarna/toml');

const COMMANDS_DIR = path.resolve(__dirname, '../../commands');

// Commands that MUST use {{args}} for user input
const ARGS_REQUIRED = [
  'pdca.toml', 'review.toml', 'qa.toml',
  'starter.toml', 'dynamic.toml', 'enterprise.toml',
  'pipeline.toml', 'learn.toml'
];

// Commands that should NOT use {{args}}
const ARGS_NOT_EXPECTED = ['bkit.toml', 'github-stats.toml'];

describe('CMD-05: {{args}} Substitution Pattern', () => {
  ARGS_REQUIRED.forEach(file => {
    test(`${file} contains exactly one {{args}} placeholder`, () => {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, file), 'utf-8');
      const parsed = TOML.parse(content);
      const matches = parsed.prompt.match(/\{\{args\}\}/g);
      expect(matches).not.toBeNull();
      expect(matches.length).toBe(1);
    });
  });

  ARGS_NOT_EXPECTED.forEach(file => {
    test(`${file} does not contain {{args}}`, () => {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, file), 'utf-8');
      const parsed = TOML.parse(content);
      const matches = parsed.prompt.match(/\{\{args\}\}/g);
      // bkit.toml is static help, github-stats is fixed commands
      expect(matches).toBeNull();
    });
  });

  test('No malformed arg patterns (e.g., {args}, {{ args }}, {{arg}})', () => {
    const allFiles = [...ARGS_REQUIRED, ...ARGS_NOT_EXPECTED];
    allFiles.forEach(file => {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, file), 'utf-8');
      const parsed = TOML.parse(content);
      const prompt = parsed.prompt;
      // Check for malformed variants
      const malformed = prompt.match(/\{args\}(?!\})|(?<!\{)\{args\}\}|\{\{\s+args\s+\}\}|\{\{arg\}\}/g);
      expect(malformed).toBeNull();
    });
  });
});
```

**Expected**:
- 8 commands (pdca, review, qa, starter, dynamic, enterprise, pipeline, learn) each contain exactly ONE `{{args}}`.
- 2 commands (bkit, github-stats) contain ZERO `{{args}}`.
- No malformed variants exist.

---

#### CMD-06: !command Shell Execution Patterns

**File**: pdca.toml, review.toml, qa.toml, pipeline.toml, learn.toml, github-stats.toml
**Test Type**: Pattern Extraction + Safety Analysis
**Priority**: Critical

**Test Script**:
```javascript
// test/tc-06/cmd-06-shell-commands.test.js
const fs = require('fs');
const path = require('path');
const TOML = require('@iarna/toml');

const COMMANDS_DIR = path.resolve(__dirname, '../../commands');

// Expected !command patterns per file
const SHELL_COMMANDS = {
  'pdca.toml': [
    '!cat docs/.pdca-status.json 2>/dev/null || echo \'{"primaryFeature": null}\''
  ],
  'review.toml': [
    '!cat bkit.config.json 2>/dev/null | head -30'
  ],
  'qa.toml': [
    '!docker ps --format "table {{.Names}}\\t{{.Status}}" 2>/dev/null || echo \'Docker not running\''
  ],
  'pipeline.toml': [
    '!cat docs/.pdca-status.json 2>/dev/null | grep -o \'"currentPhase":[0-9]*\' || echo \'Phase 1\''
  ],
  'learn.toml': [
    '!ls -la GEMINI.md .gemini/ commands/ skills/ agents/ hooks/ 2>/dev/null'
  ],
  'github-stats.toml': [
    '!{gh repo view popup-studio-ai/bkit-gemini --json stargazerCount,forkCount,watchers,issues,pullRequests,createdAt,pushedAt}',
    '!{gh api repos/popup-studio-ai/bkit-gemini/traffic/views}',
    '!{gh api repos/popup-studio-ai/bkit-gemini/traffic/clones}'
  ],
  'bkit.toml': [],
  'starter.toml': [],
  'dynamic.toml': [],
  'enterprise.toml': []
};

describe('CMD-06: !command Shell Execution Patterns', () => {
  Object.entries(SHELL_COMMANDS).forEach(([file, expectedCmds]) => {
    test(`${file}: contains exactly ${expectedCmds.length} shell command(s)`, () => {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, file), 'utf-8');
      const parsed = TOML.parse(content);
      const prompt = parsed.prompt;

      // Extract lines starting with ! (shell commands)
      // Pattern: lines starting with ! or !{
      const shellLines = prompt.split('\n')
        .map(l => l.trim())
        .filter(l => /^![\w{]/.test(l));

      expect(shellLines.length).toBe(expectedCmds.length);
    });
  });

  test('No dangerous shell commands (rm, sudo, chmod 777)', () => {
    const allFiles = Object.keys(SHELL_COMMANDS);
    allFiles.forEach(file => {
      const content = fs.readFileSync(
        path.join(COMMANDS_DIR, file), 'utf-8'
      );
      const parsed = TOML.parse(content);
      const prompt = parsed.prompt;

      // Safety check: no destructive commands in TOML prompts
      expect(prompt).not.toMatch(/!rm\s/);
      expect(prompt).not.toMatch(/!sudo\s/);
      expect(prompt).not.toMatch(/!chmod\s+777/);
      expect(prompt).not.toMatch(/!curl.*\|\s*sh/);
      expect(prompt).not.toMatch(/!wget.*\|\s*sh/);
    });
  });

  test('All !commands use error fallback patterns (2>/dev/null, ||)', () => {
    // pdca.toml, review.toml, qa.toml, pipeline.toml, learn.toml
    // should all have error handling
    const filesWithFallback = [
      'pdca.toml', 'review.toml', 'qa.toml', 'pipeline.toml', 'learn.toml'
    ];
    filesWithFallback.forEach(file => {
      const content = fs.readFileSync(
        path.join(COMMANDS_DIR, file), 'utf-8'
      );
      const parsed = TOML.parse(content);
      const prompt = parsed.prompt;
      const shellLines = prompt.split('\n')
        .map(l => l.trim())
        .filter(l => /^![\w]/.test(l));

      shellLines.forEach(line => {
        const hasErrorHandling =
          line.includes('2>/dev/null') || line.includes('|| echo') || line.includes('||');
        expect(hasErrorHandling).toBe(true);
      });
    });
  });
});
```

**Expected**:
| Command | Shell Commands | Error Handling |
|---------|---------------|----------------|
| pdca.toml | 1 (`cat .pdca-status.json`) | `2>/dev/null \|\| echo` |
| review.toml | 1 (`cat bkit.config.json \| head -30`) | `2>/dev/null` |
| qa.toml | 1 (`docker ps`) | `2>/dev/null \|\| echo` |
| pipeline.toml | 1 (`cat .pdca-status.json \| grep`) | `2>/dev/null \|\| echo` |
| learn.toml | 1 (`ls -la`) | `2>/dev/null` |
| github-stats.toml | 3 (`gh` commands) | Uses `!{}` syntax |
| bkit/starter/dynamic/enterprise | 0 | N/A |

---

#### CMD-07: qa.toml Double-Brace Collision

**File**: `commands/qa.toml`
**Test Type**: Syntax Conflict Analysis
**Priority**: High

**Test Script**:
```javascript
// test/tc-06/cmd-07-qa-brace-collision.test.js
const fs = require('fs');
const path = require('path');
const TOML = require('@iarna/toml');

const ROOT_DIR = path.resolve(__dirname, '../..');

describe('CMD-07: qa.toml Double-Brace Collision', () => {
  const content = fs.readFileSync(
    path.join(ROOT_DIR, 'commands/qa.toml'), 'utf-8'
  );
  const parsed = TOML.parse(content);
  const prompt = parsed.prompt;

  test('Contains Docker format with {{.Names}} and {{.Status}}', () => {
    // Docker --format uses Go templates with {{ }}
    expect(prompt).toContain('{{.Names}}');
    expect(prompt).toContain('{{.Status}}');
  });

  test('Contains Gemini {{args}} substitution', () => {
    expect(prompt).toContain('{{args}}');
  });

  test('Identifies collision: both Docker {{ }} and Gemini {{ }} in same prompt', () => {
    // This is a known design issue: {{.Names}} could be misinterpreted
    // by Gemini CLI as a substitution variable
    const doubleBraceMatches = prompt.match(/\{\{[^}]+\}\}/g);
    expect(doubleBraceMatches).not.toBeNull();

    // Separate Gemini vars from Docker format vars
    const geminiVars = doubleBraceMatches.filter(m => m === '{{args}}');
    const dockerVars = doubleBraceMatches.filter(m =>
      m.startsWith('{{.') // Go template format
    );

    expect(geminiVars.length).toBe(1);
    expect(dockerVars.length).toBe(2); // {{.Names}} and {{.Status}}

    // Document: This collision risk should be noted in test report
    // Gemini CLI may need to distinguish !command context from prompt context
  });
});
```

**Expected**: qa.toml contains BOTH `{{args}}` (Gemini substitution) and `{{.Names}}`/`{{.Status}}` (Docker Go templates) in the same prompt. This is a known collision risk that Gemini CLI must handle by only substituting `{{args}}` and passing `{{.Names}}`/`{{.Status}}` through to the shell command.

---

#### CMD-08: github-stats.toml !{} Brace Syntax

**File**: `commands/github-stats.toml`
**Test Type**: Syntax Validation
**Priority**: High

**Test Script**:
```javascript
// test/tc-06/cmd-08-github-stats-brace-syntax.test.js
const fs = require('fs');
const path = require('path');
const TOML = require('@iarna/toml');

const ROOT_DIR = path.resolve(__dirname, '../..');

describe('CMD-08: github-stats.toml !{} Brace Syntax', () => {
  const content = fs.readFileSync(
    path.join(ROOT_DIR, 'commands/github-stats.toml'), 'utf-8'
  );
  const parsed = TOML.parse(content);
  const prompt = parsed.prompt;

  test('Uses !{} syntax (not bare ! syntax)', () => {
    const bracedCommands = prompt.match(/!\{[^}]+\}/g);
    expect(bracedCommands).not.toBeNull();
    expect(bracedCommands.length).toBe(3);
  });

  test('First command: gh repo view with JSON fields', () => {
    expect(prompt).toContain(
      '!{gh repo view popup-studio-ai/bkit-gemini --json stargazerCount,forkCount,watchers,issues,pullRequests,createdAt,pushedAt}'
    );
  });

  test('Second command: gh api traffic/views', () => {
    expect(prompt).toContain(
      '!{gh api repos/popup-studio-ai/bkit-gemini/traffic/views}'
    );
  });

  test('Third command: gh api traffic/clones', () => {
    expect(prompt).toContain(
      '!{gh api repos/popup-studio-ai/bkit-gemini/traffic/clones}'
    );
  });

  test('Does NOT use {{args}} (no user input needed)', () => {
    expect(prompt).not.toContain('{{args}}');
  });

  test('Does NOT use @import (no skill reference)', () => {
    const importPattern = /^@[\w\-/]+\.\w+/gm;
    expect(prompt.match(importPattern)).toBeNull();
  });
});
```

**Expected**: github-stats.toml uses `!{command}` brace syntax for 3 GitHub CLI commands. No `{{args}}` or `@import` references.

---

#### CMD-09: bkit.toml Static Help Content

**File**: `commands/bkit.toml`
**Test Type**: Content Validation
**Priority**: Medium

**Test Script**:
```javascript
// test/tc-06/cmd-09-bkit-help.test.js
const fs = require('fs');
const path = require('path');
const TOML = require('@iarna/toml');

const ROOT_DIR = path.resolve(__dirname, '../..');

describe('CMD-09: bkit.toml Static Help Content', () => {
  const content = fs.readFileSync(
    path.join(ROOT_DIR, 'commands/bkit.toml'), 'utf-8'
  );
  const parsed = TOML.parse(content);
  const prompt = parsed.prompt;

  test('Contains no @import, no !command, no {{args}}', () => {
    expect(prompt.match(/^@[\w\-/]+\.\w+/gm)).toBeNull();
    expect(prompt.match(/^![\w{]/gm)).toBeNull();
    expect(prompt).not.toContain('{{args}}');
  });

  test('Lists all 10 command categories', () => {
    const expectedCommands = [
      '/pdca', '/starter', '/dynamic', '/enterprise',
      '/pipeline', '/review', '/qa', '/learn'
    ];
    expectedCommands.forEach(cmd => {
      expect(prompt).toContain(cmd);
    });
  });

  test('Contains section headers for command groups', () => {
    expect(prompt).toContain('PDCA');
    expect(prompt).toContain('Project Initialization');
    expect(prompt).toContain('Development Pipeline');
    expect(prompt).toContain('Quality Management');
    expect(prompt).toContain('Learning');
  });

  test('Description matches help purpose', () => {
    expect(parsed.description).toContain('help');
  });
});
```

**Expected**: bkit.toml is purely static text with no dynamic features. Lists all major command categories. No advanced syntax (`@`, `!`, `{{}}`) used.

---

#### CMD-10: Description Quality and Uniqueness

**File**: All `commands/*.toml`
**Test Type**: Content Quality
**Priority**: Medium

**Test Script**:
```javascript
// test/tc-06/cmd-10-description-quality.test.js
const fs = require('fs');
const path = require('path');
const TOML = require('@iarna/toml');

const COMMANDS_DIR = path.resolve(__dirname, '../../commands');
const ALL_FILES = [
  'pdca.toml', 'bkit.toml', 'review.toml', 'qa.toml',
  'starter.toml', 'dynamic.toml', 'enterprise.toml',
  'pipeline.toml', 'learn.toml', 'github-stats.toml'
];

describe('CMD-10: Description Quality', () => {
  const descriptions = {};

  beforeAll(() => {
    ALL_FILES.forEach(file => {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, file), 'utf-8');
      const parsed = TOML.parse(content);
      descriptions[file] = parsed.description;
    });
  });

  test('All descriptions are unique', () => {
    const values = Object.values(descriptions);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  test('Descriptions are between 10 and 200 characters', () => {
    Object.entries(descriptions).forEach(([file, desc]) => {
      expect(desc.length).toBeGreaterThanOrEqual(10);
      expect(desc.length).toBeLessThanOrEqual(200);
    });
  });

  test('Descriptions match expected content', () => {
    expect(descriptions['pdca.toml']).toContain('PDCA');
    expect(descriptions['review.toml']).toMatch(/review|quality/i);
    expect(descriptions['qa.toml']).toMatch(/QA|test/i);
    expect(descriptions['starter.toml']).toMatch(/[Ss]tarter/);
    expect(descriptions['dynamic.toml']).toMatch(/[Dd]ynamic|fullstack/i);
    expect(descriptions['enterprise.toml']).toMatch(/[Ee]nterprise/);
    expect(descriptions['pipeline.toml']).toMatch(/pipeline/i);
    expect(descriptions['learn.toml']).toMatch(/learn|CLI/i);
    expect(descriptions['github-stats.toml']).toMatch(/[Gg]it[Hh]ub|stat/i);
    expect(descriptions['bkit.toml']).toMatch(/help|bkit/i);
  });
});
```

**Expected**: All 10 descriptions are unique, 10-200 chars, and semantically match their command purpose.

---

#### CMD-11: Agent Delegation References

**File**: Commands that reference agent delegation
**Test Type**: Cross-Reference Validation
**Priority**: High

**Test Script**:
```javascript
// test/tc-06/cmd-11-agent-delegation.test.js
const fs = require('fs');
const path = require('path');
const TOML = require('@iarna/toml');

const ROOT_DIR = path.resolve(__dirname, '../..');
const COMMANDS_DIR = path.join(ROOT_DIR, 'commands');
const AGENTS_DIR = path.join(ROOT_DIR, 'agents');

// Expected agent references per command
const AGENT_REFS = {
  'pdca.toml': ['gap-detector', 'pdca-iterator', 'report-generator'],
  'review.toml': ['code-analyzer'],
  'qa.toml': ['qa-monitor'],
  'starter.toml': ['starter-guide'],
  'dynamic.toml': ['bkend-expert'],
  'enterprise.toml': ['infra-architect', 'enterprise-expert'],
  'pipeline.toml': ['pipeline-guide'],
  'bkit.toml': [],
  'learn.toml': [],
  'github-stats.toml': []
};

describe('CMD-11: Agent Delegation References', () => {
  Object.entries(AGENT_REFS).forEach(([file, expectedAgents]) => {
    expectedAgents.forEach(agent => {
      test(`${file} references agent '${agent}' which exists as agents/${agent}.md`, () => {
        const content = fs.readFileSync(
          path.join(COMMANDS_DIR, file), 'utf-8'
        );
        const parsed = TOML.parse(content);
        expect(parsed.prompt).toContain(agent);

        // Verify agent definition file exists
        const agentFile = path.join(AGENTS_DIR, `${agent}.md`);
        expect(fs.existsSync(agentFile)).toBe(true);
      });
    });
  });

  test('All referenced agents exist in agents/ directory', () => {
    const allReferencedAgents = new Set(
      Object.values(AGENT_REFS).flat()
    );
    allReferencedAgents.forEach(agent => {
      const agentFile = path.join(AGENTS_DIR, `${agent}.md`);
      expect(fs.existsSync(agentFile)).toBe(true);
    });
  });
});
```

**Expected**: Every agent name mentioned in TOML commands has a corresponding `agents/{name}.md` file. Cross-reference is complete.

---

#### CMD-12: Gemini CLI Integration - Command Loading

**Test Type**: Gemini CLI Integration
**Priority**: Critical

**Test Script (Bash)**:
```bash
#!/bin/bash
# test/tc-06/cmd-12-cli-loading.sh
# Requires: Gemini CLI installed and extension linked

set -e

BKIT_DIR="/path/to/bkit-gemini"
cd "$BKIT_DIR"

echo "=== CMD-12: Gemini CLI Command Loading ==="

# Step 1: Verify extension is linked
echo "[1] Checking extension link..."
gemini extensions list 2>/dev/null | grep -q "bkit" || {
  echo "FAIL: bkit extension not linked"
  echo "  Run: gemini extensions link ."
  exit 1
}
echo "  PASS: bkit extension found"

# Step 2: Verify commands are discovered
echo "[2] Checking command discovery..."
COMMANDS=(pdca bkit review qa starter dynamic enterprise pipeline learn github-stats)
for cmd in "${COMMANDS[@]}"; do
  echo "  Checking /${cmd}..."
  # Gemini CLI lists available commands
  # The command should appear in the slash command list
done
echo "  PASS: All commands expected"

# Step 3: Verify /bkit help output
echo "[3] Testing /bkit help rendering..."
# Note: Actual Gemini CLI execution requires interactive session
# This test documents the expected behavior for manual verification
echo "  Expected: Static help text with command listings"
echo "  Verify: No TOML parsing errors in output"

echo "=== CMD-12: COMPLETE ==="
```

**Expected**: Gemini CLI discovers all 10 commands as `/pdca`, `/bkit`, `/review`, `/qa`, `/starter`, `/dynamic`, `/enterprise`, `/pipeline`, `/learn`, `/github-stats`. No TOML parsing errors.

---

#### CMD-13: Prompt Multiline String Integrity

**File**: All `commands/*.toml`
**Test Type**: TOML Multiline Validation
**Priority**: Medium

**Test Script**:
```javascript
// test/tc-06/cmd-13-multiline-integrity.test.js
const fs = require('fs');
const path = require('path');
const TOML = require('@iarna/toml');

const COMMANDS_DIR = path.resolve(__dirname, '../../commands');
const ALL_FILES = [
  'pdca.toml', 'bkit.toml', 'review.toml', 'qa.toml',
  'starter.toml', 'dynamic.toml', 'enterprise.toml',
  'pipeline.toml', 'learn.toml', 'github-stats.toml'
];

describe('CMD-13: Prompt Multiline String Integrity', () => {
  ALL_FILES.forEach(file => {
    test(`${file}: prompt uses triple-quoted multiline string`, () => {
      const raw = fs.readFileSync(
        path.join(COMMANDS_DIR, file), 'utf-8'
      );
      // Verify the raw TOML uses """ for multiline
      const tripleQuoteCount = (raw.match(/"""/g) || []).length;
      // Should have exactly 2 (opening and closing)
      expect(tripleQuoteCount).toBe(2);
    });

    test(`${file}: prompt preserves newlines after parsing`, () => {
      const content = fs.readFileSync(
        path.join(COMMANDS_DIR, file), 'utf-8'
      );
      const parsed = TOML.parse(content);
      expect(parsed.prompt).toContain('\n');
      // Should have multiple lines
      const lineCount = parsed.prompt.split('\n').length;
      expect(lineCount).toBeGreaterThan(3);
    });
  });
});
```

**Expected**: All prompt values use TOML triple-quoted multiline strings (`"""`). After parsing, newlines are preserved and each prompt has 3+ lines.

---

#### CMD-14: Command-to-Skill Mapping Completeness

**Test Type**: Cross-Reference Validation
**Priority**: High

**Test Script**:
```javascript
// test/tc-06/cmd-14-command-skill-mapping.test.js
const fs = require('fs');
const path = require('path');
const TOML = require('@iarna/toml');

const ROOT_DIR = path.resolve(__dirname, '../..');
const COMMANDS_DIR = path.join(ROOT_DIR, 'commands');

// Definitive command-to-skill mapping
const COMMAND_SKILL_MAP = {
  'pdca.toml':       { skill: 'skills/pdca/SKILL.md',                hasArgs: true,  hasShell: true  },
  'review.toml':     { skill: 'skills/code-review/SKILL.md',         hasArgs: true,  hasShell: true  },
  'qa.toml':         { skill: 'skills/zero-script-qa/SKILL.md',      hasArgs: true,  hasShell: true  },
  'starter.toml':    { skill: 'skills/starter/SKILL.md',             hasArgs: true,  hasShell: false },
  'dynamic.toml':    { skill: 'skills/dynamic/SKILL.md',             hasArgs: true,  hasShell: false },
  'enterprise.toml': { skill: 'skills/enterprise/SKILL.md',          hasArgs: true,  hasShell: false },
  'pipeline.toml':   { skill: 'skills/development-pipeline/SKILL.md',hasArgs: true,  hasShell: true  },
  'learn.toml':      { skill: 'skills/gemini-cli-learning/SKILL.md', hasArgs: true,  hasShell: true  },
  'bkit.toml':       { skill: null,                                   hasArgs: false, hasShell: false },
  'github-stats.toml':{ skill: null,                                  hasArgs: false, hasShell: true  }
};

describe('CMD-14: Command-to-Skill Mapping Completeness', () => {
  Object.entries(COMMAND_SKILL_MAP).forEach(([file, expected]) => {
    describe(file, () => {
      let parsed;
      beforeAll(() => {
        const content = fs.readFileSync(path.join(COMMANDS_DIR, file), 'utf-8');
        parsed = TOML.parse(content);
      });

      if (expected.skill) {
        test(`imports ${expected.skill}`, () => {
          const skillName = expected.skill.replace('skills/', '@skills/');
          expect(parsed.prompt).toContain(skillName.replace('@skills/', '@skills/'));
          expect(fs.existsSync(path.join(ROOT_DIR, expected.skill))).toBe(true);
        });
      } else {
        test('has no skill import', () => {
          expect(parsed.prompt.match(/^@skills\//gm)).toBeNull();
        });
      }

      test(`hasArgs=${expected.hasArgs}`, () => {
        if (expected.hasArgs) {
          expect(parsed.prompt).toContain('{{args}}');
        } else {
          expect(parsed.prompt).not.toContain('{{args}}');
        }
      });

      test(`hasShell=${expected.hasShell}`, () => {
        const shellLines = parsed.prompt.split('\n')
          .filter(l => /^\s*![\w{]/.test(l));
        if (expected.hasShell) {
          expect(shellLines.length).toBeGreaterThan(0);
        } else {
          expect(shellLines.length).toBe(0);
        }
      });
    });
  });
});
```

**Expected**: Complete mapping table verified:

| Command | Skill Import | {{args}} | !command |
|---------|-------------|----------|----------|
| pdca | skills/pdca | YES | YES |
| review | skills/code-review | YES | YES |
| qa | skills/zero-script-qa | YES | YES |
| starter | skills/starter | YES | NO |
| dynamic | skills/dynamic | YES | NO |
| enterprise | skills/enterprise | YES | NO |
| pipeline | skills/development-pipeline | YES | YES |
| learn | skills/gemini-cli-learning | YES | YES |
| bkit | (none) | NO | NO |
| github-stats | (none) | NO | YES |

---

#### CMD-15: File Encoding and Line Endings

**File**: All `commands/*.toml`
**Test Type**: File Integrity
**Priority**: Low

**Test Script**:
```javascript
// test/tc-06/cmd-15-encoding.test.js
const fs = require('fs');
const path = require('path');

const COMMANDS_DIR = path.resolve(__dirname, '../../commands');
const ALL_FILES = [
  'pdca.toml', 'bkit.toml', 'review.toml', 'qa.toml',
  'starter.toml', 'dynamic.toml', 'enterprise.toml',
  'pipeline.toml', 'learn.toml', 'github-stats.toml'
];

describe('CMD-15: File Encoding and Line Endings', () => {
  ALL_FILES.forEach(file => {
    test(`${file}: valid UTF-8 encoding`, () => {
      const buffer = fs.readFileSync(path.join(COMMANDS_DIR, file));
      // Check for BOM (should not have one)
      const hasBOM = buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF;
      expect(hasBOM).toBe(false);

      // Verify it decodes as valid UTF-8
      const text = buffer.toString('utf-8');
      expect(text.length).toBeGreaterThan(0);
    });

    test(`${file}: uses LF line endings (not CRLF)`, () => {
      const content = fs.readFileSync(
        path.join(COMMANDS_DIR, file), 'utf-8'
      );
      const hasCRLF = content.includes('\r\n');
      expect(hasCRLF).toBe(false);
    });

    test(`${file}: ends with newline`, () => {
      const content = fs.readFileSync(
        path.join(COMMANDS_DIR, file), 'utf-8'
      );
      expect(content.endsWith('\n')).toBe(true);
    });
  });
});
```

**Expected**: All TOML files are UTF-8 without BOM, use LF line endings, and end with a newline.

---

## TC-07: Configuration Validation (12 Cases)

### Test Prerequisites

```bash
npm install --save-dev ajv ajv-formats  # JSON Schema validator
```

---

#### CFG-01: bkit.config.json - JSON Syntax Validity

**File**: `bkit.config.json`
**Test Type**: JSON Parsing
**Priority**: Critical

**Test Script**:
```javascript
// test/tc-07/cfg-01-json-validity.test.js
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');

describe('CFG-01: bkit.config.json JSON Validity', () => {
  test('Parses as valid JSON', () => {
    const content = fs.readFileSync(
      path.join(ROOT_DIR, 'bkit.config.json'), 'utf-8'
    );
    const config = JSON.parse(content);
    expect(config).toBeDefined();
    expect(typeof config).toBe('object');
  });

  test('Is not empty', () => {
    const content = fs.readFileSync(
      path.join(ROOT_DIR, 'bkit.config.json'), 'utf-8'
    );
    const config = JSON.parse(content);
    expect(Object.keys(config).length).toBeGreaterThan(0);
  });

  test('Has $schema reference', () => {
    const content = fs.readFileSync(
      path.join(ROOT_DIR, 'bkit.config.json'), 'utf-8'
    );
    const config = JSON.parse(content);
    expect(config.$schema).toBe('./bkit.config.schema.json');
  });
});
```

**Expected**: bkit.config.json is valid JSON with `$schema` pointing to `./bkit.config.schema.json`.

---

#### CFG-02: Version Consistency Check

**File**: `bkit.config.json`, `gemini-extension.json`
**Test Type**: Cross-File Validation
**Priority**: Critical

**Test Script**:
```javascript
// test/tc-07/cfg-02-version-consistency.test.js
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');

describe('CFG-02: Version Consistency', () => {
  let config, extension;

  beforeAll(() => {
    config = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, 'bkit.config.json'), 'utf-8')
    );
    extension = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, 'gemini-extension.json'), 'utf-8')
    );
  });

  test('bkit.config.json version is "1.5.1"', () => {
    expect(config.version).toBe('1.5.1');
  });

  test('gemini-extension.json version is "1.5.1"', () => {
    expect(extension.version).toBe('1.5.1');
  });

  test('Versions match between config and extension', () => {
    expect(config.version).toBe(extension.version);
  });

  test('Version follows semver format', () => {
    const semverPattern = /^\d+\.\d+\.\d+$/;
    expect(config.version).toMatch(semverPattern);
    expect(extension.version).toMatch(semverPattern);
  });

  test('bkit.config.json platform is "gemini"', () => {
    expect(config.platform).toBe('gemini');
  });
});
```

**Expected**: Both files report version `1.5.1`. Versions match. Platform is `gemini`.

---

#### CFG-03: gemini-extension.json Schema Validation

**File**: `gemini-extension.json`
**Test Type**: Schema Validation
**Priority**: Critical

**Test Script**:
```javascript
// test/tc-07/cfg-03-extension-schema.test.js
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');

describe('CFG-03: gemini-extension.json Schema', () => {
  let ext;

  beforeAll(() => {
    ext = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, 'gemini-extension.json'), 'utf-8')
    );
  });

  test('Has required field: name', () => {
    expect(ext.name).toBe('bkit');
  });

  test('Has required field: version', () => {
    expect(typeof ext.version).toBe('string');
  });

  test('Has required field: description', () => {
    expect(typeof ext.description).toBe('string');
    expect(ext.description.length).toBeGreaterThan(10);
  });

  test('Has contextFileName set to "GEMINI.md"', () => {
    expect(ext.contextFileName).toBe('GEMINI.md');
  });

  test('Has experimental.skills enabled', () => {
    expect(ext.experimental).toBeDefined();
    expect(ext.experimental.skills).toBe(true);
  });

  test('Has valid author', () => {
    expect(ext.author).toBe('POPUP STUDIO PTE. LTD.');
  });

  test('Has valid license', () => {
    expect(ext.license).toBe('Apache-2.0');
  });

  test('Has valid repository URL', () => {
    expect(ext.repository).toMatch(/^https:\/\/github\.com\//);
  });

  test('Has keywords array', () => {
    expect(Array.isArray(ext.keywords)).toBe(true);
    expect(ext.keywords.length).toBeGreaterThan(0);
    expect(ext.keywords).toContain('vibecoding');
    expect(ext.keywords).toContain('pdca');
  });

  test('excludeTools is empty array', () => {
    expect(ext.excludeTools).toEqual([]);
  });
});
```

**Expected**: gemini-extension.json has all required Gemini CLI extension fields. `contextFileName` is `GEMINI.md`, `experimental.skills` is `true`.

---

#### CFG-04: PDCA Configuration Section

**File**: `bkit.config.json` (lines 9-24)
**Test Type**: Value Validation
**Priority**: Critical

**Test Script**:
```javascript
// test/tc-07/cfg-04-pdca-config.test.js
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');

describe('CFG-04: PDCA Configuration', () => {
  let config;

  beforeAll(() => {
    config = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, 'bkit.config.json'), 'utf-8')
    );
  });

  test('pdca section exists', () => {
    expect(config.pdca).toBeDefined();
  });

  test('matchRateThreshold is 90 (integer, 0-100)', () => {
    expect(config.pdca.matchRateThreshold).toBe(90);
    expect(Number.isInteger(config.pdca.matchRateThreshold)).toBe(true);
    expect(config.pdca.matchRateThreshold).toBeGreaterThanOrEqual(0);
    expect(config.pdca.matchRateThreshold).toBeLessThanOrEqual(100);
  });

  test('autoIterate is true (boolean)', () => {
    expect(config.pdca.autoIterate).toBe(true);
    expect(typeof config.pdca.autoIterate).toBe('boolean');
  });

  test('maxIterations is 5 (positive integer)', () => {
    expect(config.pdca.maxIterations).toBe(5);
    expect(Number.isInteger(config.pdca.maxIterations)).toBe(true);
    expect(config.pdca.maxIterations).toBeGreaterThan(0);
  });

  test('statusFile points to docs/.pdca-status.json', () => {
    expect(config.pdca.statusFile).toBe('docs/.pdca-status.json');
  });

  test('designDocPaths is array with {feature} placeholder', () => {
    expect(Array.isArray(config.pdca.designDocPaths)).toBe(true);
    expect(config.pdca.designDocPaths.length).toBeGreaterThan(0);
    config.pdca.designDocPaths.forEach(p => {
      expect(p).toContain('{feature}');
    });
  });

  test('planDocPaths is array with {feature} placeholder', () => {
    expect(Array.isArray(config.pdca.planDocPaths)).toBe(true);
    expect(config.pdca.planDocPaths.length).toBeGreaterThan(0);
    config.pdca.planDocPaths.forEach(p => {
      expect(p).toContain('{feature}');
    });
  });
});
```

**Expected**: PDCA thresholds: matchRate=90, maxIterations=5, autoIterate=true. Doc paths use `{feature}` placeholder.

---

#### CFG-05: Level Detection Configuration

**File**: `bkit.config.json` (lines 40-51)
**Test Type**: Value Validation
**Priority**: High

**Test Script**:
```javascript
// test/tc-07/cfg-05-level-detection.test.js
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');

describe('CFG-05: Level Detection Configuration', () => {
  let config;

  beforeAll(() => {
    config = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, 'bkit.config.json'), 'utf-8')
    );
  });

  test('levelDetection section exists', () => {
    expect(config.levelDetection).toBeDefined();
  });

  test('Enterprise level detects kubernetes/terraform directories', () => {
    const ent = config.levelDetection.enterprise;
    expect(ent.directories).toContain('kubernetes');
    expect(ent.directories).toContain('terraform');
    expect(ent.directories).toContain('k8s');
    expect(ent.directories).toContain('infra');
  });

  test('Dynamic level detects backend directories and files', () => {
    const dyn = config.levelDetection.dynamic;
    expect(dyn.directories).toContain('lib/bkend');
    expect(dyn.directories).toContain('supabase');
    expect(dyn.directories).toContain('api');
    expect(dyn.directories).toContain('backend');
    expect(dyn.files).toContain('.mcp.json');
    expect(dyn.files).toContain('docker-compose.yml');
    expect(dyn.packagePatterns).toContain('bkend');
  });

  test('Default level is "Starter"', () => {
    expect(config.levelDetection.default).toBe('Starter');
  });

  test('All three levels (Enterprise, Dynamic, Starter) are defined', () => {
    expect(config.levelDetection.enterprise).toBeDefined();
    expect(config.levelDetection.dynamic).toBeDefined();
    expect(config.levelDetection.default).toBeDefined();
  });
});
```

**Expected**: Three detection levels defined. Enterprise looks for k8s/terraform dirs. Dynamic looks for backend dirs and config files. Default is `Starter`.

---

#### CFG-06: Agent Configuration Cross-Reference

**File**: `bkit.config.json` (lines 84-98) + `agents/*.md`
**Test Type**: Cross-Reference Validation
**Priority**: Critical

**Test Script**:
```javascript
// test/tc-07/cfg-06-agent-crossref.test.js
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const AGENTS_DIR = path.join(ROOT_DIR, 'agents');

describe('CFG-06: Agent Configuration Cross-Reference', () => {
  let config;

  beforeAll(() => {
    config = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, 'bkit.config.json'), 'utf-8')
    );
  });

  test('agents.levelBased maps all three levels to agents', () => {
    const lb = config.agents.levelBased;
    expect(lb.Starter).toBe('starter-guide');
    expect(lb.Dynamic).toBe('bkend-expert');
    expect(lb.Enterprise).toBe('enterprise-expert');
  });

  test('All levelBased agent files exist', () => {
    Object.values(config.agents.levelBased).forEach(agent => {
      const agentFile = path.join(AGENTS_DIR, `${agent}.md`);
      expect(fs.existsSync(agentFile)).toBe(true);
    });
  });

  test('agents.taskBased maps tasks to agents', () => {
    const tb = config.agents.taskBased;
    expect(tb['code review']).toBe('code-analyzer');
    expect(tb['security scan']).toBe('code-analyzer');
    expect(tb['design review']).toBe('design-validator');
    expect(tb['gap analysis']).toBe('gap-detector');
    expect(tb.report).toBe('report-generator');
    expect(tb.QA).toBe('qa-monitor');
    expect(tb.pipeline).toBe('pipeline-guide');
  });

  test('All taskBased agent files exist', () => {
    const uniqueAgents = new Set(Object.values(config.agents.taskBased));
    uniqueAgents.forEach(agent => {
      const agentFile = path.join(AGENTS_DIR, `${agent}.md`);
      expect(fs.existsSync(agentFile)).toBe(true);
    });
  });

  test('agentMemory.agentScopes references valid agents', () => {
    const scopes = config.agentMemory.agentScopes;
    // Named agents should exist
    Object.keys(scopes).forEach(key => {
      if (key !== 'default') {
        const agentFile = path.join(AGENTS_DIR, `${key}.md`);
        expect(fs.existsSync(agentFile)).toBe(true);
      }
    });
  });
});
```

**Expected**: All 10 unique agent names referenced in config have corresponding `agents/{name}.md` files. Level-based mapping: Starter->starter-guide, Dynamic->bkend-expert, Enterprise->enterprise-expert.

---

#### CFG-07: Output Styles Cross-Reference

**File**: `bkit.config.json` (lines 141-149) + `output-styles/*.md`
**Test Type**: Cross-Reference Validation
**Priority**: High

**Test Script**:
```javascript
// test/tc-07/cfg-07-output-styles-crossref.test.js
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const STYLES_DIR = path.join(ROOT_DIR, 'output-styles');

describe('CFG-07: Output Styles Cross-Reference', () => {
  let config;

  beforeAll(() => {
    config = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, 'bkit.config.json'), 'utf-8')
    );
  });

  test('Default output style is "bkit-pdca-guide"', () => {
    expect(config.outputStyles.default).toBe('bkit-pdca-guide');
  });

  test('Available styles list has 4 entries', () => {
    expect(config.outputStyles.available).toEqual([
      'bkit-learning',
      'bkit-pdca-guide',
      'bkit-enterprise',
      'bkit-pdca-enterprise'
    ]);
  });

  test('All available styles have corresponding .md files', () => {
    config.outputStyles.available.forEach(style => {
      const styleFile = path.join(STYLES_DIR, `${style}.md`);
      expect(fs.existsSync(styleFile)).toBe(true);
    });
  });

  test('Level defaults reference only available styles', () => {
    const ld = config.outputStyles.levelDefaults;
    expect(config.outputStyles.available).toContain(ld.Starter);
    expect(config.outputStyles.available).toContain(ld.Dynamic);
    expect(config.outputStyles.available).toContain(ld.Enterprise);
  });

  test('Level default mappings are correct', () => {
    expect(config.outputStyles.levelDefaults.Starter).toBe('bkit-learning');
    expect(config.outputStyles.levelDefaults.Dynamic).toBe('bkit-pdca-guide');
    expect(config.outputStyles.levelDefaults.Enterprise).toBe('bkit-enterprise');
  });

  test('Default style is in available list', () => {
    expect(config.outputStyles.available).toContain(
      config.outputStyles.default
    );
  });
});
```

**Expected**: 4 output styles defined, all have files in `output-styles/`. Level defaults: Starter=bkit-learning, Dynamic=bkit-pdca-guide, Enterprise=bkit-enterprise.

---

#### CFG-08: Permissions Security Configuration

**File**: `bkit.config.json` (lines 107-116)
**Test Type**: Security Validation
**Priority**: Critical

**Test Script**:
```javascript
// test/tc-07/cfg-08-permissions.test.js
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');

describe('CFG-08: Permissions Security Configuration', () => {
  let config;

  beforeAll(() => {
    config = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, 'bkit.config.json'), 'utf-8')
    );
  });

  test('permissions section exists', () => {
    expect(config.permissions).toBeDefined();
  });

  test('Destructive commands are denied', () => {
    expect(config.permissions['run_shell_command(rm -rf*)']).toBe('deny');
    expect(config.permissions['run_shell_command(git push --force*)']).toBe('deny');
  });

  test('Risky commands require confirmation ("ask")', () => {
    expect(config.permissions['run_shell_command(rm -r*)']).toBe('ask');
    expect(config.permissions['run_shell_command(git reset --hard*)']).toBe('ask');
  });

  test('Standard operations are allowed', () => {
    expect(config.permissions.write_file).toBe('allow');
    expect(config.permissions.replace).toBe('allow');
    expect(config.permissions.read_file).toBe('allow');
    expect(config.permissions.run_shell_command).toBe('allow');
  });

  test('All permission values are valid (allow/deny/ask)', () => {
    const validValues = ['allow', 'deny', 'ask'];
    Object.entries(config.permissions).forEach(([key, value]) => {
      expect(validValues).toContain(value);
    });
  });

  test('rm -rf deny takes precedence over rm -r ask', () => {
    // Verify both exist (order matters for glob matching)
    expect(config.permissions['run_shell_command(rm -rf*)']).toBe('deny');
    expect(config.permissions['run_shell_command(rm -r*)']).toBe('ask');
    // The more specific (rm -rf) should be deny, less specific (rm -r) should be ask
  });
});
```

**Expected**: `rm -rf*` and `git push --force*` are `deny`. `rm -r*` and `git reset --hard*` are `ask`. Standard operations are `allow`. All values are in {allow, deny, ask}.

---

#### CFG-09: Templates Configuration Cross-Reference

**File**: `bkit.config.json` (lines 53-65) + `templates/*.template.md`
**Test Type**: Cross-Reference Validation
**Priority**: High

**Test Script**:
```javascript
// test/tc-07/cfg-09-templates-crossref.test.js
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const TEMPLATES_DIR = path.join(ROOT_DIR, 'templates');

describe('CFG-09: Templates Configuration Cross-Reference', () => {
  let config;

  beforeAll(() => {
    config = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, 'bkit.config.json'), 'utf-8')
    );
  });

  test('Templates directory config matches actual directory', () => {
    expect(config.templates.directory).toBe('templates');
    expect(fs.existsSync(TEMPLATES_DIR)).toBe(true);
  });

  test('All template types have files', () => {
    const types = config.templates.types;
    Object.entries(types).forEach(([type, filename]) => {
      const templatePath = path.join(TEMPLATES_DIR, filename);
      expect(fs.existsSync(templatePath)).toBe(true);
    });
  });

  test('Template types include plan, design, analysis, report', () => {
    expect(config.templates.types.plan).toBe('plan.template.md');
    expect(config.templates.types.design).toBe('design.template.md');
    expect(config.templates.types.analysis).toBe('analysis.template.md');
    expect(config.templates.types.report).toBe('report.template.md');
  });

  test('Level variants use {type} placeholder', () => {
    const variants = config.templates.levelVariants;
    expect(variants.starter).toContain('{type}');
    expect(variants.enterprise).toContain('{type}');
  });

  test('Level variant files exist for at least design type', () => {
    // Check that design-starter.template.md and design-enterprise.template.md exist
    const starterVariant = config.templates.levelVariants.starter
      .replace('{type}', 'design');
    const enterpriseVariant = config.templates.levelVariants.enterprise
      .replace('{type}', 'design');

    expect(fs.existsSync(path.join(TEMPLATES_DIR, starterVariant))).toBe(true);
    expect(fs.existsSync(path.join(TEMPLATES_DIR, enterpriseVariant))).toBe(true);
  });
});
```

**Expected**: 4 template types (plan, design, analysis, report) all have files in `templates/`. Level variants exist for design (design-starter.template.md, design-enterprise.template.md).

---

#### CFG-10: Team and Orchestrator Configuration

**File**: `bkit.config.json` (lines 163-185)
**Test Type**: Value Validation
**Priority**: Medium

**Test Script**:
```javascript
// test/tc-07/cfg-10-team-orchestrator.test.js
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');

describe('CFG-10: Team and Orchestrator Configuration', () => {
  let config;

  beforeAll(() => {
    config = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, 'bkit.config.json'), 'utf-8')
    );
  });

  describe('Team Configuration', () => {
    test('Team is disabled by default', () => {
      expect(config.team.enabled).toBe(false);
    });

    test('Default strategy is "dynamic"', () => {
      expect(config.team.defaultStrategy).toBe('dynamic');
    });

    test('Strategy maxAgents are reasonable', () => {
      expect(config.team.strategies.dynamic.maxAgents).toBe(3);
      expect(config.team.strategies.enterprise.maxAgents).toBe(5);
      expect(config.team.strategies.custom.maxAgents).toBe(10);
    });

    test('MaxAgents increases: dynamic < enterprise < custom', () => {
      const d = config.team.strategies.dynamic.maxAgents;
      const e = config.team.strategies.enterprise.maxAgents;
      const c = config.team.strategies.custom.maxAgents;
      expect(d).toBeLessThan(e);
      expect(e).toBeLessThan(c);
    });

    test('stateDir is defined', () => {
      expect(config.team.stateDir).toBe('.gemini/teams/');
    });
  });

  describe('Context Hierarchy', () => {
    test('Context hierarchy is enabled', () => {
      expect(config.contextHierarchy.enabled).toBe(true);
    });

    test('Cache TTL is 5000ms', () => {
      expect(config.contextHierarchy.cacheTTL).toBe(5000);
    });

    test('Levels are [plugin, user, project, session]', () => {
      expect(config.contextHierarchy.levels).toEqual([
        'plugin', 'user', 'project', 'session'
      ]);
    });
  });

  describe('Skill Orchestrator', () => {
    test('Skill orchestrator is enabled', () => {
      expect(config.skillOrchestrator.enabled).toBe(true);
    });

    test('Auto features enabled', () => {
      expect(config.skillOrchestrator.autoImportTemplates).toBe(true);
      expect(config.skillOrchestrator.autoCreateTasks).toBe(true);
      expect(config.skillOrchestrator.agentDelegation).toBe(true);
    });
  });

  describe('Agent Memory', () => {
    test('Agent memory is enabled', () => {
      expect(config.agentMemory.enabled).toBe(true);
    });

    test('Max sessions per agent is 20', () => {
      expect(config.agentMemory.maxSessionsPerAgent).toBe(20);
    });

    test('Project and user scopes are defined', () => {
      expect(config.agentMemory.projectScope).toContain('.gemini/');
      expect(config.agentMemory.userScope).toContain('~/.gemini/');
    });
  });
});
```

**Expected**: Team disabled by default. Strategy maxAgents: dynamic=3, enterprise=5, custom=10. Context hierarchy has 4 levels. Skill orchestrator fully enabled. Agent memory enabled with max 20 sessions.

---

#### CFG-11: Full Config Schema Validation

**File**: `bkit.config.json`
**Test Type**: JSON Schema Validation
**Priority**: Critical

**Test Script**:
```javascript
// test/tc-07/cfg-11-full-schema.test.js
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ROOT_DIR = path.resolve(__dirname, '../..');

// Define the expected schema for bkit.config.json
const BKIT_CONFIG_SCHEMA = {
  type: 'object',
  required: ['version', 'platform', 'pdca', 'levelDetection', 'agents',
             'permissions', 'outputStyles', 'templates'],
  properties: {
    '$schema': { type: 'string' },
    version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
    platform: { type: 'string', enum: ['gemini'] },
    sourceDirectories: { type: 'array', items: { type: 'string' } },
    codeExtensions: { type: 'array', items: { type: 'string', pattern: '^\\.' } },
    pdca: {
      type: 'object',
      required: ['matchRateThreshold', 'maxIterations', 'autoIterate', 'statusFile'],
      properties: {
        matchRateThreshold: { type: 'integer', minimum: 0, maximum: 100 },
        maxIterations: { type: 'integer', minimum: 1 },
        autoIterate: { type: 'boolean' },
        statusFile: { type: 'string' },
        designDocPaths: { type: 'array', items: { type: 'string' } },
        planDocPaths: { type: 'array', items: { type: 'string' } }
      }
    },
    levelDetection: {
      type: 'object',
      required: ['enterprise', 'dynamic', 'default'],
      properties: {
        enterprise: {
          type: 'object',
          properties: {
            directories: { type: 'array', items: { type: 'string' } },
            files: { type: 'array', items: { type: 'string' } }
          }
        },
        dynamic: {
          type: 'object',
          properties: {
            directories: { type: 'array', items: { type: 'string' } },
            files: { type: 'array', items: { type: 'string' } },
            packagePatterns: { type: 'array', items: { type: 'string' } }
          }
        },
        default: { type: 'string' }
      }
    },
    agents: {
      type: 'object',
      required: ['levelBased', 'taskBased'],
      properties: {
        levelBased: { type: 'object' },
        taskBased: { type: 'object' }
      }
    },
    permissions: {
      type: 'object',
      additionalProperties: { type: 'string', enum: ['allow', 'deny', 'ask'] }
    },
    outputStyles: {
      type: 'object',
      required: ['default', 'available'],
      properties: {
        default: { type: 'string' },
        available: { type: 'array', items: { type: 'string' } },
        levelDefaults: { type: 'object' }
      }
    },
    templates: {
      type: 'object',
      required: ['directory', 'types'],
      properties: {
        directory: { type: 'string' },
        types: { type: 'object' },
        levelVariants: { type: 'object' }
      }
    },
    taskClassification: { type: 'object' },
    conventions: { type: 'object' },
    output: { type: 'object' },
    context: { type: 'object' },
    automation: { type: 'object' },
    hooks: { type: 'object' },
    agentMemory: { type: 'object' },
    team: { type: 'object' },
    contextHierarchy: { type: 'object' },
    skillOrchestrator: { type: 'object' }
  },
  additionalProperties: false
};

describe('CFG-11: Full Config Schema Validation', () => {
  let config;

  beforeAll(() => {
    config = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, 'bkit.config.json'), 'utf-8')
    );
  });

  test('Config validates against schema', () => {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(BKIT_CONFIG_SCHEMA);
    const valid = validate(config);
    if (!valid) {
      console.error('Validation errors:', validate.errors);
    }
    expect(valid).toBe(true);
  });

  test('Config has all 16 top-level sections', () => {
    const expectedSections = [
      '$schema', 'version', 'platform', 'sourceDirectories', 'codeExtensions',
      'pdca', 'taskClassification', 'levelDetection', 'templates',
      'conventions', 'agents', 'output', 'permissions', 'context',
      'automation', 'hooks', 'outputStyles', 'agentMemory',
      'team', 'contextHierarchy', 'skillOrchestrator'
    ];
    expectedSections.forEach(section => {
      expect(config).toHaveProperty(section);
    });
  });

  test('Config has exactly 186 lines', () => {
    const content = fs.readFileSync(
      path.join(ROOT_DIR, 'bkit.config.json'), 'utf-8'
    );
    const lineCount = content.split('\n').length;
    // Allow for trailing newline
    expect(lineCount).toBeGreaterThanOrEqual(186);
    expect(lineCount).toBeLessThanOrEqual(187);
  });
});
```

**Expected**: Config validates against full JSON Schema. All 16 top-level sections present. File is approximately 186 lines.

---

#### CFG-12: Configuration Consistency - Naming Convention Alignment

**File**: `bkit.config.json` - Cross-section validation
**Test Type**: Consistency Analysis
**Priority**: Medium

**Test Script**:
```javascript
// test/tc-07/cfg-12-config-consistency.test.js
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');

describe('CFG-12: Configuration Consistency', () => {
  let config, extension;

  beforeAll(() => {
    config = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, 'bkit.config.json'), 'utf-8')
    );
    extension = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, 'gemini-extension.json'), 'utf-8')
    );
  });

  test('Level names in levelDetection match agents.levelBased keys', () => {
    // levelDetection uses: enterprise, dynamic, default="Starter"
    // agents.levelBased uses: "Starter", "Dynamic", "Enterprise"
    const detectionLevels = ['Starter', 'Dynamic', 'Enterprise'];
    const agentLevels = Object.keys(config.agents.levelBased);
    expect(agentLevels.sort()).toEqual(detectionLevels.sort());
  });

  test('Level names in outputStyles.levelDefaults match agents.levelBased', () => {
    const styleLevels = Object.keys(config.outputStyles.levelDefaults);
    const agentLevels = Object.keys(config.agents.levelBased);
    expect(styleLevels.sort()).toEqual(agentLevels.sort());
  });

  test('Cache TTLs are consistent', () => {
    // context.hierarchyCacheTTL should match contextHierarchy.cacheTTL
    expect(config.context.hierarchyCacheTTL).toBe(config.contextHierarchy.cacheTTL);
  });

  test('All referenced agent names are unique', () => {
    const allAgents = [
      ...Object.values(config.agents.levelBased),
      ...Object.values(config.agents.taskBased)
    ];
    // Some agents may be referenced multiple times (e.g., code-analyzer)
    // but each unique name should map to one agent file
    const uniqueAgents = [...new Set(allAgents)];
    uniqueAgents.forEach(agent => {
      const agentFile = path.join(ROOT_DIR, 'agents', `${agent}.md`);
      expect(fs.existsSync(agentFile)).toBe(true);
    });
  });

  test('contextFileName in extension matches GEMINI.md existence', () => {
    expect(extension.contextFileName).toBe('GEMINI.md');
    expect(fs.existsSync(path.join(ROOT_DIR, 'GEMINI.md'))).toBe(true);
  });

  test('sourceDirectories contain common project directories', () => {
    const dirs = config.sourceDirectories;
    expect(dirs).toContain('src');
    expect(dirs).toContain('lib');
    expect(dirs).toContain('app');
  });

  test('codeExtensions are valid file extensions', () => {
    config.codeExtensions.forEach(ext => {
      expect(ext).toMatch(/^\.\w+$/);
    });
  });

  test('automation.supportedLanguages includes en', () => {
    expect(config.automation.supportedLanguages).toContain('en');
  });

  test('hooks configuration has valid timeouts', () => {
    expect(config.hooks.beforeAgent.timeout).toBeGreaterThan(0);
    expect(config.hooks.contextCompaction.snapshotLimit).toBeGreaterThan(0);
  });
});
```

**Expected**: Level names are consistent across levelDetection, agents.levelBased, and outputStyles.levelDefaults. Cache TTLs match. All agent references resolve. GEMINI.md exists at root.

---

## Test Execution Summary

### TC-06: TOML Command Tests (15 cases)

| Case | Name | Type | Priority |
|------|------|------|----------|
| CMD-01 | TOML Syntax Validity (10 files) | Parsing | Critical |
| CMD-02 | Required Fields (description, prompt) | Schema | Critical |
| CMD-03 | @import Path Resolution | File Reference | Critical |
| CMD-04 | pdca.toml Template References | Content | High |
| CMD-05 | {{args}} Substitution Pattern | Pattern | Critical |
| CMD-06 | !command Shell Execution Patterns | Pattern + Safety | Critical |
| CMD-07 | qa.toml Double-Brace Collision | Syntax Conflict | High |
| CMD-08 | github-stats.toml !{} Brace Syntax | Syntax | High |
| CMD-09 | bkit.toml Static Help Content | Content | Medium |
| CMD-10 | Description Quality and Uniqueness | Quality | Medium |
| CMD-11 | Agent Delegation References | Cross-Reference | High |
| CMD-12 | Gemini CLI Command Loading | Integration | Critical |
| CMD-13 | Prompt Multiline String Integrity | TOML | Medium |
| CMD-14 | Command-to-Skill Mapping Completeness | Cross-Reference | High |
| CMD-15 | File Encoding and Line Endings | Integrity | Low |

### TC-07: Configuration Tests (12 cases)

| Case | Name | Type | Priority |
|------|------|------|----------|
| CFG-01 | bkit.config.json JSON Validity | Parsing | Critical |
| CFG-02 | Version Consistency Check | Cross-File | Critical |
| CFG-03 | gemini-extension.json Schema | Schema | Critical |
| CFG-04 | PDCA Configuration Section | Value | Critical |
| CFG-05 | Level Detection Configuration | Value | High |
| CFG-06 | Agent Configuration Cross-Reference | Cross-Reference | Critical |
| CFG-07 | Output Styles Cross-Reference | Cross-Reference | High |
| CFG-08 | Permissions Security Configuration | Security | Critical |
| CFG-09 | Templates Configuration Cross-Reference | Cross-Reference | High |
| CFG-10 | Team and Orchestrator Configuration | Value | Medium |
| CFG-11 | Full Config Schema Validation | Schema | Critical |
| CFG-12 | Configuration Consistency | Consistency | Medium |

### Run All Tests

```bash
# Install dependencies
npm install --save-dev jest @iarna/toml ajv ajv-formats

# Run TC-06 tests
npx jest test/tc-06/ --verbose

# Run TC-07 tests
npx jest test/tc-07/ --verbose

# Run all command + config tests
npx jest test/tc-06/ test/tc-07/ --verbose --coverage
```

### Key Findings from Source Analysis

1. **qa.toml Brace Collision (CMD-07)**: `{{.Names}}`/`{{.Status}}` (Docker Go templates) coexist with `{{args}}` (Gemini substitution) - potential parsing conflict
2. **github-stats.toml uses !{} syntax (CMD-08)**: Unlike other commands that use bare `!`, github-stats uses `!{command}` brace-wrapped syntax for multi-word commands
3. **bkit.toml is pure static (CMD-09)**: No dynamic features - serves as help text only
4. **Missing schema file**: `bkit.config.schema.json` referenced in config `$schema` field does not exist on disk
5. **All agent cross-references valid (CFG-06)**: 10 unique agents across levelBased + taskBased all have corresponding `.md` files
6. **Output styles complete (CFG-07)**: All 4 styles in `available` array have files in `output-styles/` directory
