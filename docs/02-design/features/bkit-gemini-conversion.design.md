# bkit-gemini-conversion Design Document

> Version: 1.0.0 | Created: 2026-02-01 | Status: Draft
> Plan Reference: [bkit-gemini-conversion.plan.md](../../01-plan/features/bkit-gemini-conversion.plan.md)

---

## 1. Executive Summary

이 설계서는 bkit-claude-code v1.5.0을 Gemini CLI용 익스텐션으로 변환하기 위한 상세 기술 설계를 정의합니다.

### 1.1 Source Analysis Summary

| Category | Count | Reusable | Needs Modification | Needs Rewrite |
|----------|-------|----------|-------------------|---------------|
| Skills | 21 | 21 (100%) | Frontmatter only | 0 |
| Agents | 11 | 11 (100%) | Frontmatter only | 0 |
| Scripts | 39 | 27 (~70%) | 12 (hook format) | 0 |
| Library Functions | 180+ | 120+ (67%) | 40 (~22%) | 20 (~11%) |
| Templates | 22 | 22 (100%) | 0 | 0 |
| Configuration | 3 | 1 | 2 (manifest) | 0 |

### 1.2 Core Conversion Tasks

1. **Manifest Conversion**: `plugin.json` → `gemini-extension.json`
2. **Context File**: `CLAUDE.md` → `GEMINI.md`
3. **Hook System**: 6 events → 11 events mapping
4. **Platform Adapter**: Claude-specific → Gemini-specific abstraction
5. **Variable Substitution**: `${CLAUDE_PLUGIN_ROOT}` → `${extensionPath}`

---

## 2. System Architecture

### 2.1 Target Directory Structure

```
bkit-gemini/
├── gemini-extension.json          # [NEW] Extension manifest
├── GEMINI.md                      # [NEW] Global context file
├── bkit.config.json               # [COPY] Central configuration (minimal changes)
│
├── commands/                      # [NEW] Gemini CLI TOML commands
│   ├── pdca/
│   │   ├── plan.toml
│   │   ├── design.toml
│   │   ├── do.toml
│   │   ├── analyze.toml
│   │   ├── iterate.toml
│   │   ├── report.toml
│   │   ├── archive.toml
│   │   ├── status.toml
│   │   └── next.toml
│   ├── starter.toml
│   ├── dynamic.toml
│   ├── enterprise.toml
│   ├── code-review.toml
│   ├── development-pipeline.toml
│   ├── zero-script-qa.toml
│   ├── claude-code-learning.toml  # → gemini-cli-learning.toml
│   ├── mobile-app.toml
│   ├── desktop-app.toml
│   ├── bkit-templates.toml
│   └── bkit-rules.toml
│
├── skills/                        # [COPY+MODIFY] Agent Skills
│   ├── pdca/
│   │   └── SKILL.md              # Modify frontmatter
│   ├── starter/
│   │   └── SKILL.md
│   ├── dynamic/
│   │   └── SKILL.md
│   ├── enterprise/
│   │   └── SKILL.md
│   ├── phase-1-schema/
│   │   └── SKILL.md
│   ├── phase-2-convention/
│   │   └── SKILL.md
│   ├── phase-3-mockup/
│   │   └── SKILL.md
│   ├── phase-4-api/
│   │   └── SKILL.md
│   ├── phase-5-design-system/
│   │   └── SKILL.md
│   ├── phase-6-ui-integration/
│   │   └── SKILL.md
│   ├── phase-7-seo-security/
│   │   └── SKILL.md
│   ├── phase-8-review/
│   │   └── SKILL.md
│   ├── phase-9-deployment/
│   │   └── SKILL.md
│   ├── code-review/
│   │   └── SKILL.md
│   ├── development-pipeline/
│   │   └── SKILL.md
│   ├── zero-script-qa/
│   │   └── SKILL.md
│   ├── gemini-cli-learning/      # [RENAMED] claude-code-learning
│   │   └── SKILL.md
│   ├── mobile-app/
│   │   └── SKILL.md
│   ├── desktop-app/
│   │   └── SKILL.md
│   ├── bkit-templates/
│   │   └── SKILL.md
│   └── bkit-rules/
│       └── SKILL.md
│
├── agents/                        # [COPY] Agent definitions
│   ├── starter-guide.md
│   ├── bkend-expert.md
│   ├── code-analyzer.md
│   ├── design-validator.md
│   ├── enterprise-expert.md
│   ├── gap-detector.md
│   ├── infra-architect.md
│   ├── pdca-iterator.md
│   ├── pipeline-guide.md
│   ├── qa-monitor.md
│   └── report-generator.md
│
├── hooks/                         # [REWRITE] Hook configurations
│   ├── hooks.json                # Gemini hook format
│   └── scripts/
│       ├── session-start.js
│       ├── before-agent.js
│       ├── after-agent.js
│       ├── before-tool.js
│       ├── after-tool.js
│       ├── before-model.js
│       ├── after-model.js
│       ├── pre-compress.js
│       ├── session-end.js
│       └── notification.js
│
├── lib/                           # [COPY+MODIFY] Core libraries
│   ├── adapters/
│   │   ├── index.js              # [NEW] Platform adapter loader
│   │   ├── platform-interface.js # [NEW] Abstract interface
│   │   └── gemini/
│   │       ├── index.js          # [NEW] Gemini adapter
│   │       ├── io.js             # [NEW] Gemini I/O
│   │       ├── platform.js       # [NEW] Gemini platform detection
│   │       └── hooks.js          # [NEW] Gemini hook handling
│   ├── core/                     # [COPY] Minimal changes
│   │   ├── index.js
│   │   ├── platform.js           # [MODIFY] Use adapter
│   │   ├── io.js                 # [MODIFY] Use adapter
│   │   ├── cache.js              # [COPY]
│   │   ├── config.js             # [COPY]
│   │   ├── file.js               # [COPY]
│   │   └── debug.js              # [MODIFY] Log paths
│   ├── pdca/                     # [COPY] No changes
│   │   ├── index.js
│   │   ├── tier.js
│   │   ├── level.js
│   │   ├── phase.js
│   │   ├── status.js
│   │   └── automation.js
│   ├── intent/                   # [COPY] No changes
│   │   ├── index.js
│   │   ├── language.js
│   │   ├── trigger.js
│   │   └── ambiguity.js
│   ├── task/                     # [COPY] No changes
│   │   ├── index.js
│   │   ├── classification.js
│   │   ├── context.js
│   │   ├── creator.js
│   │   └── tracker.js
│   ├── common.js                 # [COPY] Compatibility bridge
│   ├── skill-orchestrator.js     # [MODIFY] Adapter usage
│   ├── import-resolver.js        # [MODIFY] Variable substitution
│   ├── context-fork.js           # [COPY]
│   ├── context-hierarchy.js      # [COPY]
│   └── memory-store.js           # [COPY]
│
├── scripts/                       # [COPY+MODIFY] Hook scripts
│   ├── unified-stop.js           # [MODIFY] Handler registry
│   ├── unified-write-post.js
│   ├── unified-bash-pre.js
│   ├── unified-bash-post.js
│   ├── user-prompt-handler.js
│   ├── context-compaction.js
│   ├── skill-post.js
│   ├── pre-write.js
│   └── ... (39 scripts total)
│
├── templates/                     # [COPY] No changes
│   ├── plan.template.md
│   ├── design.template.md
│   ├── design-starter.template.md
│   ├── design-enterprise.template.md
│   ├── analysis.template.md
│   ├── report.template.md
│   ├── do.template.md
│   ├── iteration-report.template.md
│   ├── schema.template.md
│   ├── convention.template.md
│   ├── GEMINI.template.md        # [RENAMED] CLAUDE.template.md
│   ├── TEMPLATE-GUIDE.md
│   ├── pipeline/
│   │   └── ... (10 templates)
│   └── shared/
│       └── ... (3 templates)
│
└── docs/                          # PDCA documents
    ├── 01-plan/
    ├── 02-design/
    ├── 03-analysis/
    └── 04-report/
```

---

## 3. Component Design

### 3.1 Extension Manifest (`gemini-extension.json`)

```json
{
  "name": "bkit",
  "version": "1.0.0",
  "description": "bkit Vibecoding Kit - PDCA + AI-native development for Gemini CLI",
  "author": "POPUP STUDIO PTE. LTD.",
  "license": "Apache-2.0",
  "repository": "https://github.com/popup-studio-ai/bkit-gemini",
  "keywords": ["vibecoding", "pdca", "ai-native", "fullstack", "context-engineering"],

  "contextFileName": "GEMINI.md",

  "mcpServers": {
    "bkend": {
      "command": "npx",
      "args": ["@bkend/mcp-server"],
      "env": {
        "BKEND_API_KEY": "$BKEND_API_KEY"
      }
    }
  },

  "excludeTools": [],

  "experimental": {
    "skills": true
  }
}
```

### 3.2 Hook System Mapping

#### 3.2.1 Event Mapping Table

| # | Claude Code Event | Gemini CLI Event | bkit Usage | Script |
|---|-------------------|------------------|------------|--------|
| 1 | SessionStart | SessionStart | Session init, PDCA detection | session-start.js |
| 2 | UserPromptSubmit | BeforeAgent | Intent detection, triggers | before-agent.js |
| 3 | PreToolUse | BeforeTool | Permission check, PDCA guidance | before-tool.js |
| 4 | PostToolUse | AfterTool | Tracking, status updates | after-tool.js |
| 5 | Stop | SessionEnd | Cleanup, phase transitions | session-end.js |
| 6 | PreCompact | PreCompress | State preservation | pre-compress.js |
| 7 | - | BeforeModel | (New) Model selection | before-model.js |
| 8 | - | AfterModel | (New) Response filtering | after-model.js |
| 9 | - | BeforeToolSelection | (New) Tool filtering | (not used) |
| 10 | - | AfterAgent | (New) Agent loop cleanup | after-agent.js |
| 11 | - | Notification | (New) Alerts | notification.js |

#### 3.2.2 Gemini hooks.json Format

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "name": "bkit-session-init",
            "type": "command",
            "command": "node ${extensionPath}/hooks/scripts/session-start.js",
            "timeout": 5000
          }
        ]
      }
    ],
    "BeforeAgent": [
      {
        "hooks": [
          {
            "name": "bkit-intent-detection",
            "type": "command",
            "command": "node ${extensionPath}/hooks/scripts/before-agent.js",
            "timeout": 3000
          }
        ]
      }
    ],
    "BeforeTool": [
      {
        "matcher": "write_file|replace",
        "hooks": [
          {
            "name": "bkit-pre-write",
            "type": "command",
            "command": "node ${extensionPath}/hooks/scripts/before-tool.js",
            "timeout": 5000
          }
        ]
      },
      {
        "matcher": "run_shell_command",
        "hooks": [
          {
            "name": "bkit-pre-bash",
            "type": "command",
            "command": "node ${extensionPath}/hooks/scripts/before-tool.js",
            "timeout": 5000
          }
        ]
      }
    ],
    "AfterTool": [
      {
        "matcher": "write_file",
        "hooks": [
          {
            "name": "bkit-post-write",
            "type": "command",
            "command": "node ${extensionPath}/hooks/scripts/after-tool.js",
            "timeout": 5000
          }
        ]
      },
      {
        "matcher": "run_shell_command",
        "hooks": [
          {
            "name": "bkit-post-bash",
            "type": "command",
            "command": "node ${extensionPath}/hooks/scripts/after-tool.js",
            "timeout": 5000
          }
        ]
      }
    ],
    "AfterAgent": [
      {
        "hooks": [
          {
            "name": "bkit-agent-cleanup",
            "type": "command",
            "command": "node ${extensionPath}/hooks/scripts/after-agent.js",
            "timeout": 10000
          }
        ]
      }
    ],
    "PreCompress": [
      {
        "hooks": [
          {
            "name": "bkit-context-save",
            "type": "command",
            "command": "node ${extensionPath}/hooks/scripts/pre-compress.js",
            "timeout": 5000
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "name": "bkit-cleanup",
            "type": "command",
            "command": "node ${extensionPath}/hooks/scripts/session-end.js",
            "timeout": 10000
          }
        ]
      }
    ]
  }
}
```

### 3.3 Platform Adapter Architecture

#### 3.3.1 Abstract Interface (`lib/adapters/platform-interface.js`)

```javascript
/**
 * Platform Adapter Interface
 * All platform-specific implementations must implement this interface.
 */
class PlatformAdapter {
  // Platform Identification
  get name() { throw new Error('Not implemented'); }
  get version() { throw new Error('Not implemented'); }

  // Environment Detection
  isActive() { throw new Error('Not implemented'); }
  getPluginRoot() { throw new Error('Not implemented'); }
  getProjectDir() { throw new Error('Not implemented'); }

  // Variable Substitution
  expandVariables(template) { throw new Error('Not implemented'); }

  // Tool Name Mapping
  mapToolName(toolName) { throw new Error('Not implemented'); }

  // Hook I/O
  readHookInput() { throw new Error('Not implemented'); }
  outputAllow(context, hookEvent) { throw new Error('Not implemented'); }
  outputBlock(reason) { throw new Error('Not implemented'); }
  outputEmpty() { throw new Error('Not implemented'); }

  // Debug Logging
  getDebugLogPath() { throw new Error('Not implemented'); }
  debugLog(category, message, data) { throw new Error('Not implemented'); }

  // Context File
  getContextFileName() { throw new Error('Not implemented'); }
}

module.exports = { PlatformAdapter };
```

#### 3.3.2 Gemini Adapter (`lib/adapters/gemini/index.js`)

```javascript
const { PlatformAdapter } = require('../platform-interface');
const fs = require('fs');
const path = require('path');

class GeminiAdapter extends PlatformAdapter {
  constructor() {
    super();
    this._name = 'gemini';
    this._version = '1.0.0';
  }

  get name() { return this._name; }
  get version() { return this._version; }

  // Environment Detection
  isActive() {
    return !!(
      process.env.GEMINI_CLI ||
      process.env.GEMINI_PROJECT_DIR ||
      process.env.GOOGLE_API_KEY
    );
  }

  getPluginRoot() {
    return process.env.GEMINI_EXTENSION_PATH ||
           process.env.extensionPath ||
           path.dirname(path.dirname(__dirname));
  }

  getProjectDir() {
    return process.env.GEMINI_PROJECT_DIR ||
           process.env.workspacePath ||
           process.cwd();
  }

  // Variable Substitution
  expandVariables(template) {
    return template
      .replace(/\$\{extensionPath\}/g, this.getPluginRoot())
      .replace(/\$\{workspacePath\}/g, this.getProjectDir())
      .replace(/\$\{PLUGIN_ROOT\}/g, this.getPluginRoot())
      .replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, this.getPluginRoot())
      .replace(/\$\{\/\}/g, path.sep)
      .replace(/\$\{pathSeparator\}/g, path.sep);
  }

  // Tool Name Mapping (Claude → Gemini)
  mapToolName(toolName) {
    const mapping = {
      'Write': 'write_file',
      'Edit': 'replace',
      'Read': 'read_file',
      'Bash': 'run_shell_command',
      'Glob': 'glob',
      'Grep': 'grep',
      'WebSearch': 'web_search',
      'WebFetch': 'web_fetch',
      'Task': 'task',
      'TaskCreate': 'task_create',
      'TaskUpdate': 'task_update',
      'TaskList': 'task_list',
      'AskUserQuestion': 'ask_user'
    };
    return mapping[toolName] || toolName.toLowerCase();
  }

  // Hook I/O
  readHookInput() {
    try {
      const input = fs.readFileSync(0, 'utf-8').trim();
      return input ? JSON.parse(input) : {};
    } catch (e) {
      return {};
    }
  }

  outputAllow(context, hookEvent) {
    const output = {
      status: 'allow',
      context: context || undefined
    };
    if (hookEvent) {
      output.hookEvent = hookEvent;
    }
    console.log(JSON.stringify(output));
    process.exit(0);
  }

  outputBlock(reason) {
    console.log(JSON.stringify({
      status: 'block',
      reason: reason
    }));
    process.exit(2);
  }

  outputEmpty() {
    process.exit(0);
  }

  // Debug Logging
  getDebugLogPath() {
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    return path.join(homeDir, '.gemini', 'bkit-debug.log');
  }

  debugLog(category, message, data) {
    if (process.env.BKIT_DEBUG !== 'true') return;

    const logPath = this.getDebugLogPath();
    const logDir = path.dirname(logPath);

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${category}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n`;

    fs.appendFileSync(logPath, logEntry);
  }

  // Context File
  getContextFileName() {
    return 'GEMINI.md';
  }
}

module.exports = new GeminiAdapter();
```

#### 3.3.3 Adapter Loader (`lib/adapters/index.js`)

```javascript
let _adapter = null;

function getAdapter() {
  if (_adapter) return _adapter;

  // Try Gemini first (primary for this extension)
  const geminiAdapter = require('./gemini');
  if (geminiAdapter.isActive()) {
    _adapter = geminiAdapter;
    return _adapter;
  }

  // Fallback to error
  throw new Error('bkit-gemini requires Gemini CLI environment');
}

function getPlatformName() {
  return getAdapter().name;
}

function isGemini() {
  try {
    return getAdapter().name === 'gemini';
  } catch {
    return false;
  }
}

module.exports = {
  getAdapter,
  getPlatformName,
  isGemini
};
```

### 3.4 SKILL.md Format Conversion

#### 3.4.1 Claude Code Format (Original)

```yaml
---
name: pdca
description: |
  Unified skill for managing the entire PDCA cycle.
  Triggers: pdca, 계획, 設計, 计划, planificar...
  Do NOT use for: ...

argument-hint: "[action] [feature]"
agent: null
agents:
  analyze: bkit:gap-detector
  iterate: bkit:pdca-iterator
  report: bkit:report-generator
  default: null
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - TaskCreate
  - TaskUpdate
  - TaskList
  - AskUserQuestion
user-invocable: true
imports:
  - ${PLUGIN_ROOT}/templates/plan.template.md
  - ${PLUGIN_ROOT}/templates/design.template.md
next-skill: null
pdca-phase: null
task-template: "[PDCA] {feature}"
---

# PDCA Skill Content...
```

#### 3.4.2 Gemini CLI Format (Converted)

```yaml
---
name: pdca
description: |
  Unified skill for managing the entire PDCA cycle.
  Triggers: pdca, 계획, 設計, 计划, planificar...
  Do NOT use for: ...

license: Apache-2.0
metadata:
  author: POPUP STUDIO
  version: "1.0.0"
  bkit-version: "1.0.0"
  argument-hint: "[action] [feature]"
  agents:
    analyze: gap-detector
    iterate: pdca-iterator
    report: report-generator
    default: null
  next-skill: null
  pdca-phase: null
  task-template: "[PDCA] {feature}"
---

# PDCA Skill Content...

## Scripts
- `scripts/pdca-handler.js` - Main PDCA action handler

## References
- `references/plan.template.md`
- `references/design.template.md`
```

#### 3.4.3 Key Frontmatter Changes

| Claude Code Field | Gemini CLI Field | Notes |
|-------------------|------------------|-------|
| `name` | `name` | Same |
| `description` | `description` | Same |
| `argument-hint` | `metadata.argument-hint` | Moved to metadata |
| `agent` | (removed) | Gemini handles differently |
| `agents` | `metadata.agents` | Moved to metadata |
| `allowed-tools` | (removed) | Gemini uses different permission model |
| `user-invocable` | (implicit) | All skills are invocable |
| `imports` | `## References` section | Converted to markdown |
| `next-skill` | `metadata.next-skill` | Moved to metadata |
| `pdca-phase` | `metadata.pdca-phase` | Moved to metadata |
| `task-template` | `metadata.task-template` | Moved to metadata |
| (new) | `license` | Required for Gemini |
| (new) | `metadata.author` | Required for Gemini |
| (new) | `metadata.version` | Required for Gemini |

### 3.5 Commands (TOML Format)

Gemini CLI uses TOML format for slash commands. Each command maps to a skill.

#### 3.5.1 Example: `/pdca` Command (`commands/pdca/plan.toml`)

```toml
# /pdca plan command
[command]
name = "pdca plan"
description = "Create a Plan document for a feature"
arguments = "[feature-name]"

[execution]
type = "skill"
skill = "pdca"
action = "plan"

[metadata]
category = "pdca"
phase = "plan"
```

#### 3.5.2 Command Directory Structure

```
commands/
├── pdca/
│   ├── plan.toml
│   ├── design.toml
│   ├── do.toml
│   ├── analyze.toml
│   ├── iterate.toml
│   ├── report.toml
│   ├── archive.toml
│   ├── status.toml
│   └── next.toml
├── starter.toml
├── dynamic.toml
├── enterprise.toml
├── code-review.toml
├── development-pipeline.toml
├── zero-script-qa.toml
├── gemini-cli-learning.toml
├── mobile-app.toml
├── desktop-app.toml
├── bkit-templates.toml
└── bkit-rules.toml
```

---

## 4. Data Flow Design

### 4.1 Session Initialization Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Gemini CLI Session Start                    │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ SessionStart Hook (hooks/scripts/session-start.js)              │
├─────────────────────────────────────────────────────────────────┤
│ 1. Load platform adapter (lib/adapters/gemini)                  │
│ 2. Initialize PDCA status (docs/.pdca-status.json)              │
│ 3. Detect project level (Starter/Dynamic/Enterprise)           │
│ 4. Load session memory (docs/.bkit-memory.json)                │
│ 5. Scan for active features                                    │
│ 6. Generate welcome context with AskUserQuestion prompt        │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ Output: JSON with additionalContext (system prompt injection)  │
│ { status: "allow", context: "bkit v1.0.0 activated..." }       │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Tool Execution Flow

```
┌──────────────────┐
│   User Request   │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────────────────────────────┐
│ BeforeAgent Hook (intent detection)                    │
│ - Detect skill/agent triggers                          │
│ - Calculate ambiguity score                            │
│ - Inject context hints                                 │
└────────┬───────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────┐
│ Gemini Model Processing                                │
│ - Uses injected context                                │
│ - Selects tools based on task                         │
└────────┬───────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────┐
│ BeforeTool Hook (validation)                           │
│ - Permission check (FR-05)                             │
│ - PDCA guidance injection                              │
│ - Block dangerous operations                           │
└────────┬───────────────────────────────────────────────┘
         │
    ┌────┴────┐
    │ Allowed │
    └────┬────┘
         │
         ▼
┌────────────────────────────────────────────────────────┐
│ Tool Execution (write_file, run_shell_command, etc.)   │
└────────┬───────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────┐
│ AfterTool Hook (tracking)                              │
│ - Update PDCA status                                   │
│ - Track file changes                                   │
│ - Suggest next steps                                   │
└────────┬───────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────┐
│ AfterAgent Hook (cleanup)                              │
│ - Phase transitions                                    │
│ - Agent/skill completion handling                      │
│ - Next action suggestions                              │
└────────────────────────────────────────────────────────┘
```

### 4.3 PDCA State Machine

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  PLAN   │────▶│ DESIGN  │────▶│   DO    │────▶│  CHECK  │────▶│   ACT   │
└─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘
    │                                               │               │
    │                                               │               │
    │                                          ┌────┴────┐          │
    │                                          │ <90%    │          │
    │                                          │ Match   │──────────┘
    │                                          └────┬────┘      (iterate)
    │                                               │
    │                                          ┌────┴────┐
    │                                          │ >=90%   │
    │                                          │ Match   │
    │                                          └────┬────┘
    │                                               │
    │                                               ▼
    │                                        ┌──────────┐
    │                                        │  REPORT  │
    │                                        └────┬─────┘
    │                                               │
    │                                               ▼
    │                                        ┌──────────┐
    └────────────────────────────────────────│ ARCHIVED │
            (new feature)                    └──────────┘
```

---

## 5. File-by-File Conversion Specification

### 5.1 Files to Copy Without Changes (100% Reusable)

```
templates/                          # All 22 templates
├── plan.template.md
├── design.template.md
├── design-starter.template.md
├── design-enterprise.template.md
├── analysis.template.md
├── report.template.md
├── do.template.md
├── iteration-report.template.md
├── schema.template.md
├── convention.template.md
├── TEMPLATE-GUIDE.md
├── pipeline/                       # 10 files
└── shared/                         # 3 files

lib/pdca/                           # All PDCA logic
├── tier.js                         # Language tier classification
├── level.js                        # Project level detection
├── phase.js                        # Phase state machine
├── status.js                       # Status file management
└── automation.js                   # Auto-advance logic

lib/intent/                         # All intent detection
├── language.js                     # Multi-language patterns
├── trigger.js                      # Trigger matching
└── ambiguity.js                    # Ambiguity scoring

lib/task/                           # All task management
├── classification.js               # Task size classification
├── context.js                      # Active context tracking
├── creator.js                      # Task creation
└── tracker.js                      # Task status tracking

lib/                                # Supporting modules
├── context-fork.js
├── context-hierarchy.js
└── memory-store.js

agents/                             # All 11 agent definitions
├── starter-guide.md
├── bkend-expert.md
├── code-analyzer.md
├── design-validator.md
├── enterprise-expert.md
├── gap-detector.md
├── infra-architect.md
├── pdca-iterator.md
├── pipeline-guide.md
├── qa-monitor.md
└── report-generator.md
```

### 5.2 Files to Copy with Modifications

#### 5.2.1 Skills (21 files) - Frontmatter Modification

**Modification Required:**
1. Move `argument-hint` to `metadata.argument-hint`
2. Move `agents` to `metadata.agents`
3. Move `next-skill` to `metadata.next-skill`
4. Move `pdca-phase` to `metadata.pdca-phase`
5. Move `task-template` to `metadata.task-template`
6. Remove `allowed-tools` (Gemini handles differently)
7. Remove `agent` field
8. Remove `user-invocable` (all are invocable)
9. Add `license: Apache-2.0`
10. Add `metadata.author` and `metadata.version`
11. Convert `imports` to `## References` markdown section
12. Replace `${PLUGIN_ROOT}` → `${extensionPath}` in any paths

**Conversion Script Pattern:**
```javascript
function convertSkillFrontmatter(claudeFrontmatter) {
  const gemini = {
    name: claudeFrontmatter.name,
    description: claudeFrontmatter.description,
    license: 'Apache-2.0',
    metadata: {
      author: 'POPUP STUDIO',
      version: '1.0.0',
      'bkit-version': '1.0.0'
    }
  };

  // Move fields to metadata
  if (claudeFrontmatter['argument-hint']) {
    gemini.metadata['argument-hint'] = claudeFrontmatter['argument-hint'];
  }
  if (claudeFrontmatter.agents) {
    // Remove 'bkit:' prefix
    gemini.metadata.agents = {};
    for (const [key, value] of Object.entries(claudeFrontmatter.agents)) {
      gemini.metadata.agents[key] = value?.replace('bkit:', '') || null;
    }
  }
  if (claudeFrontmatter['next-skill']) {
    gemini.metadata['next-skill'] = claudeFrontmatter['next-skill'];
  }
  if (claudeFrontmatter['pdca-phase']) {
    gemini.metadata['pdca-phase'] = claudeFrontmatter['pdca-phase'];
  }
  if (claudeFrontmatter['task-template']) {
    gemini.metadata['task-template'] = claudeFrontmatter['task-template'];
  }

  return gemini;
}
```

#### 5.2.2 Library Core (`lib/core/`)

| File | Modifications |
|------|---------------|
| `index.js` | Add adapter exports |
| `platform.js` | Replace with adapter delegation |
| `io.js` | Replace with adapter delegation |
| `debug.js` | Change log path to `.gemini/bkit-debug.log` |
| `cache.js` | No changes |
| `config.js` | No changes |
| `file.js` | No changes |

**platform.js Modification:**
```javascript
// Before (Claude-specific)
const BKIT_PLATFORM = 'claude';
function detectPlatform() { return 'claude'; }

// After (Adapter-based)
const { getAdapter } = require('../adapters');
const adapter = getAdapter();
const BKIT_PLATFORM = adapter.name;
function detectPlatform() { return adapter.name; }
```

#### 5.2.3 Scripts (39 files)

**Scripts Requiring Modification:**

| Script | Changes Required |
|--------|------------------|
| `session-start.js` | Use adapter I/O, change CLAUDE_ env vars |
| `unified-stop.js` | Update handler registry paths |
| `pre-write.js` | Use adapter for tool name mapping |
| `unified-write-post.js` | Use adapter I/O |
| `unified-bash-pre.js` | Use adapter I/O |
| `unified-bash-post.js` | Use adapter I/O |
| `user-prompt-handler.js` | Move to BeforeAgent hook |
| `context-compaction.js` | Use adapter paths |
| `skill-post.js` | Use adapter I/O |

**Common Modification Pattern:**
```javascript
// Before
const { outputAllow, outputBlock } = require('../lib/core/io');
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT;

// After
const { getAdapter } = require('../lib/adapters');
const adapter = getAdapter();
const PLUGIN_ROOT = adapter.getPluginRoot();
// Use adapter.outputAllow(), adapter.outputBlock()
```

### 5.3 Files to Create New

| File | Purpose |
|------|---------|
| `gemini-extension.json` | Extension manifest |
| `GEMINI.md` | Global context file |
| `lib/adapters/index.js` | Adapter loader |
| `lib/adapters/platform-interface.js` | Abstract interface |
| `lib/adapters/gemini/index.js` | Gemini adapter |
| `lib/adapters/gemini/io.js` | Gemini I/O utilities |
| `lib/adapters/gemini/platform.js` | Gemini platform detection |
| `lib/adapters/gemini/hooks.js` | Gemini hook handling |
| `hooks/hooks.json` | Gemini hook configuration |
| `hooks/scripts/before-agent.js` | BeforeAgent hook (from UserPromptSubmit) |
| `hooks/scripts/after-agent.js` | AfterAgent hook (from Stop) |
| `hooks/scripts/before-model.js` | BeforeModel hook (new) |
| `hooks/scripts/after-model.js` | AfterModel hook (new) |
| `commands/*.toml` | 20+ TOML command files |

---

## 6. Implementation Order

### Phase 1: Foundation (Priority: Critical)

```
1.1 Create gemini-extension.json
1.2 Create GEMINI.md (from CLAUDE.md template)
1.3 Copy bkit.config.json (no changes needed)
1.4 Create lib/adapters/ structure
    - platform-interface.js
    - index.js
    - gemini/index.js
    - gemini/io.js
    - gemini/platform.js
1.5 Modify lib/core/platform.js (use adapter)
1.6 Modify lib/core/io.js (use adapter)
1.7 Modify lib/core/debug.js (change log path)
```

### Phase 2: Hook System (Priority: Critical)

```
2.1 Create hooks/hooks.json (Gemini format)
2.2 Convert hooks/session-start.js → hooks/scripts/session-start.js
2.3 Create hooks/scripts/before-agent.js (from user-prompt-handler.js)
2.4 Convert scripts/pre-write.js → hooks/scripts/before-tool.js
2.5 Convert scripts/unified-write-post.js → hooks/scripts/after-tool.js
2.6 Create hooks/scripts/after-agent.js (from unified-stop.js)
2.7 Convert scripts/context-compaction.js → hooks/scripts/pre-compress.js
2.8 Create hooks/scripts/session-end.js
```

### Phase 3: Library Modules (Priority: High)

```
3.1 Copy lib/pdca/ (no changes)
3.2 Copy lib/intent/ (no changes)
3.3 Copy lib/task/ (no changes)
3.4 Copy lib/context-fork.js (no changes)
3.5 Copy lib/context-hierarchy.js (no changes)
3.6 Copy lib/memory-store.js (no changes)
3.7 Modify lib/common.js (add adapter usage)
3.8 Modify lib/skill-orchestrator.js (adapter usage)
3.9 Modify lib/import-resolver.js (variable substitution)
```

### Phase 4: Skills (Priority: High)

```
4.1 Create skill conversion script
4.2 Convert all 21 skills:
    - pdca/SKILL.md
    - starter/SKILL.md
    - dynamic/SKILL.md
    - enterprise/SKILL.md
    - phase-1-schema/SKILL.md
    - phase-2-convention/SKILL.md
    - phase-3-mockup/SKILL.md
    - phase-4-api/SKILL.md
    - phase-5-design-system/SKILL.md
    - phase-6-ui-integration/SKILL.md
    - phase-7-seo-security/SKILL.md
    - phase-8-review/SKILL.md
    - phase-9-deployment/SKILL.md
    - code-review/SKILL.md
    - development-pipeline/SKILL.md
    - zero-script-qa/SKILL.md
    - gemini-cli-learning/SKILL.md (renamed)
    - mobile-app/SKILL.md
    - desktop-app/SKILL.md
    - bkit-templates/SKILL.md
    - bkit-rules/SKILL.md
```

### Phase 5: Commands & Agents (Priority: Medium)

```
5.1 Create commands/ directory
5.2 Create TOML commands (20+ files)
5.3 Copy agents/ directory (11 files, no changes)
5.4 Copy templates/ directory (22 files, rename CLAUDE.template.md)
```

### Phase 6: Scripts Migration (Priority: Medium)

```
6.1 Copy and modify remaining scripts:
    - gap-detector-stop.js
    - iterator-stop.js
    - pdca-skill-stop.js
    - phase*-stop.js (9 files)
    - qa-stop.js
    - code-review-stop.js
    - learning-stop.js
    - analysis-stop.js
```

### Phase 7: Testing & Validation (Priority: Critical)

```
7.1 Gemini CLI installation test
7.2 SessionStart hook test
7.3 PDCA workflow E2E test
7.4 Skill invocation test (all 21)
7.5 Agent routing test
7.6 Hook execution test (all events)
```

---

## 7. Testing Strategy

### 7.1 Unit Tests

| Module | Test Focus |
|--------|------------|
| `lib/adapters/gemini` | Platform detection, variable expansion, I/O |
| `lib/pdca/*` | Phase transitions, status management |
| `lib/intent/*` | Trigger matching, language detection |
| `lib/task/*` | Classification, task creation |

### 7.2 Integration Tests

| Test | Description |
|------|-------------|
| Hook Chain | SessionStart → BeforeAgent → BeforeTool → AfterTool → AfterAgent |
| PDCA Flow | plan → design → do → check → act → report |
| Skill Routing | Command → Skill → Agent → Completion |

### 7.3 E2E Tests

| Test | Scenario |
|------|----------|
| Fresh Install | `gemini extensions install` from scratch |
| PDCA Cycle | Create feature, complete full PDCA cycle |
| Level Detection | Test Starter/Dynamic/Enterprise detection |
| Multi-language | Test triggers in all 8 languages |

---

## 8. Migration Checklist

### 8.1 Pre-Migration

- [ ] Backup bkit-claude-code source
- [ ] Document current version (v1.5.0)
- [ ] Verify Gemini CLI v0.25+ installed
- [ ] Set up test environment

### 8.2 Migration Steps

- [ ] Phase 1: Foundation complete
- [ ] Phase 2: Hook system complete
- [ ] Phase 3: Library modules complete
- [ ] Phase 4: Skills converted
- [ ] Phase 5: Commands & agents ready
- [ ] Phase 6: Scripts migrated
- [ ] Phase 7: All tests passing

### 8.3 Post-Migration

- [ ] Documentation updated (README, GETTING_STARTED)
- [ ] Version set to 1.0.0
- [ ] GitHub release created
- [ ] Extension gallery submission prepared

---

## 9. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Gemini CLI API changes | Pin to v0.25+, monitor release notes |
| Hook behavior differences | Comprehensive hook testing |
| Tool name mismatches | Thorough tool mapping validation |
| Performance regression | Benchmark critical paths |
| State file incompatibility | Version detection and migration |

---

## 10. Appendix

### A. Environment Variable Mapping

| Claude Code | Gemini CLI | Purpose |
|-------------|------------|---------|
| `CLAUDE_PLUGIN_ROOT` | `extensionPath` | Plugin installation directory |
| `CLAUDE_PROJECT_DIR` | `workspacePath` | Active project directory |
| `ANTHROPIC_API_KEY` | `GOOGLE_API_KEY` | API authentication |
| `BKIT_DEBUG` | `BKIT_DEBUG` | Debug logging (unchanged) |
| `BKIT_LEVEL` | `BKIT_LEVEL` | Project level override (unchanged) |
| `BKIT_PDCA_AUTOMATION` | `BKIT_PDCA_AUTOMATION` | Automation level (unchanged) |

### B. Tool Name Mapping

| Claude Code | Gemini CLI |
|-------------|------------|
| `Write` | `write_file` |
| `Edit` | `replace` |
| `Read` | `read_file` |
| `Bash` | `run_shell_command` |
| `Glob` | `glob` |
| `Grep` | `grep` |
| `WebSearch` | `web_search` |
| `WebFetch` | `web_fetch` |
| `Task` | `task` |
| `TaskCreate` | `task_create` |
| `TaskUpdate` | `task_update` |
| `TaskList` | `task_list` |
| `AskUserQuestion` | `ask_user` |
| `LSP` | (not available) |
| `NotebookEdit` | (not available) |

### C. File Count Summary

| Category | Claude Code | Gemini CLI | Action |
|----------|-------------|------------|--------|
| Skills | 21 | 21 | Convert frontmatter |
| Agents | 11 | 11 | Copy |
| Scripts | 39 | ~45 | Modify + new |
| Templates | 22 | 22 | Copy (rename 1) |
| Lib modules | 29 | 35 | Copy + new adapters |
| Commands | 0 | 20+ | Create new |
| Config | 3 | 3 | Modify 2 |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-02-01 | Claude | Initial design document |

---

**Next Steps:**
1. 설계서 리뷰 및 승인
2. Phase 1 (Foundation) 구현 시작
3. `/pdca do bkit-gemini-conversion` 으로 구현 가이드 생성
