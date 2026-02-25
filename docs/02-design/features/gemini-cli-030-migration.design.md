# Design: Gemini CLI v0.30.0 Migration

> **Feature**: gemini-cli-030-migration
> **Date**: 2026-02-25
> **Version**: bkit-gemini v1.5.4 → v1.5.5 (Phase 1+2), v1.6.0 (Phase 3+4)
> **Strategy**: B - Incremental Migration (Plan-Plus approved)
> **Plan Source**: [gemini-cli-030-migration.plan.md](../../01-plan/features/gemini-cli-030-migration.plan.md)
> **Analysis Source**: [gemini-cli-030-upgrade-impact-analysis.analysis.md](../../03-analysis/gemini-cli-030-upgrade-impact-analysis.analysis.md)
> **Team**: CTO Team (8 specialist agents)

---

## 1. Design Overview

### 1.1 Scope

| Release | Phase | Actions | Effort | Files Modified |
|---------|-------|:-------:|:------:|:--------------:|
| **v1.5.5** | Phase 1 (P0) + Phase 2 (P1) | 11 | ~12h | 14 files |
| **v1.6.0** | Phase 3 (P2) + Phase 4 (P3) | 8 | ~32h | 30+ files |

### 1.2 Change Summary (v1.5.5)

```
v1.5.5 Change Map:
├── [V155-01] session-start.js      ← Policy TOML auto-trigger
├── [V155-02] bkit.config.json      ← testedVersions update
├── [V155-03] version-detector.js   ← SemVer validation + max version
├── [V155-04] model-selection.md    ← Gemini 3.1 Pro documentation
├── [V155-05] spawn-agent-server.js ← --approval-mode=yolo + path sanitization
├── [V155-06] policy-migrator.js    ← TOML schema validation + escaping
├── [V155-07] after-tool.js         ← Tool Output Masking resilience
├── [V155-08] cto-lead.md           ← gemini-3.1-pro model
├── [V155-08] gap-detector.md       ← gemini-3.1-pro model
├── [V155-09] report-generator.md   ← gemini-3-flash-lite model
├── [V155-09] qa-monitor.md         ← gemini-3-flash-lite model
├── [V155-10] gemini-extension.json ← version bump
├── [V155-11] before-tool.js        ← Enhanced dangerous patterns
└── [V155-11] CHANGELOG.md          ← v1.5.5 entry
```

---

## 2. Detailed File Changes (v1.5.5)

### V155-01: Policy TOML Auto-Generation Trigger

**File**: `hooks/scripts/session-start.js`
**Location**: Line 29 (after `savePdcaStatus()`, before `loadMemoryStore()`)

**Current Code** (line 28-30):
```javascript
// 3. Save PDCA status
savePdcaStatus(pdcaStatus, projectDir);

// 4. Load memory store
```

**New Code**:
```javascript
// 3. Save PDCA status
savePdcaStatus(pdcaStatus, projectDir);

// 3.5. Auto-generate Policy Engine TOML (v0.30.0+)
try {
  const vd = require(path.join(libPath, 'adapters', 'gemini', 'version-detector'));
  const flags = vd.getFeatureFlags();
  if (flags.hasPolicyEngine) {
    const pm = require(path.join(libPath, 'adapters', 'gemini', 'policy-migrator'));
    const result = pm.generatePolicyFile(projectDir, pluginRoot);
    if (result && result.created) {
      debugLog('Policy TOML auto-generated:', result.path);
    }
  }
} catch (e) {
  debugLog('Policy TOML generation skipped:', e.message);
}

// 4. Load memory store
```

**Rationale**: Policy Engine is GA in v0.30.0. `policy-migrator.js` (231 lines) is fully implemented but never triggered. This activates the dormant subsystem. The `generatePolicyFile()` already checks `hasPolicyFiles()` and skips if TOML files exist.

**Dependencies**: V155-03 (version-detector must correctly detect v0.30.0)

---

### V155-02: testedVersions Update

**File**: `bkit.config.json`
**Location**: Line 120

**Current Code**:
```json
"testedVersions": ["0.29.0", "0.29.5", "0.30.0-preview.3"],
```

**New Code**:
```json
"testedVersions": ["0.29.0", "0.29.5", "0.29.7", "0.30.0-preview.3", "0.30.0"],
```

**Rationale**: v0.29.7 (patch for Gemini 3.1 Pro quota) and v0.30.0 (stable) are now released.

---

### V155-03: Version Detector SemVer Validation

**File**: `lib/adapters/gemini/version-detector.js`

#### Change 3a: Env var validation (line 52)

**Current Code**:
```javascript
raw = process.env.GEMINI_CLI_VERSION || null;
```

**New Code**:
```javascript
const envVal = process.env.GEMINI_CLI_VERSION || null;
if (envVal) {
  if (!isValidSemVer(envVal)) {
    debugLog(`Warning: GEMINI_CLI_VERSION="${envVal}" is not valid SemVer. Ignoring.`);
    raw = null;
  } else if (isVersionBeyondPlausible(envVal)) {
    debugLog(`Warning: GEMINI_CLI_VERSION="${envVal}" exceeds plausible range. Ignoring.`);
    raw = null;
  } else {
    raw = envVal;
  }
}
```

#### Change 3b: Add validation helpers (before `parseVersion`, ~line 20)

**New Code to Add**:
```javascript
const MAX_PLAUSIBLE_VERSION = '2.0.0';

function isValidSemVer(str) {
  return /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(str);
}

function isVersionBeyondPlausible(str) {
  const parsed = parseVersion(str);
  const max = parseVersion(MAX_PLAUSIBLE_VERSION);
  return compareVersions(parsed, max) > 0;
}
```

#### Change 3c: Add new feature flags (lines 113-123)

**Current Code**:
```javascript
function getFeatureFlags() {
  return {
    hasPlanMode: isVersionAtLeast('0.29.0'),
    hasPolicyEngine: isVersionAtLeast('0.30.0'),
    hasExcludeToolsDeprecated: isVersionAtLeast('0.30.0'),
    hasGemini3Default: isVersionAtLeast('0.29.0'),
    hasSkillsStable: isVersionAtLeast('0.26.0'),
    hasExtensionRegistry: isVersionAtLeast('0.29.0'),
    hasSDK: isVersionAtLeast('0.30.0')
  };
}
```

**New Code**:
```javascript
function getFeatureFlags() {
  return {
    hasPlanMode: isVersionAtLeast('0.29.0'),
    hasPolicyEngine: isVersionAtLeast('0.30.0'),
    hasExcludeToolsDeprecated: isVersionAtLeast('0.30.0'),
    hasGemini3Default: isVersionAtLeast('0.29.0'),
    hasSkillsStable: isVersionAtLeast('0.26.0'),
    hasExtensionRegistry: isVersionAtLeast('0.29.0'),
    hasSDK: isVersionAtLeast('0.30.0'),
    hasGemini31Pro: isVersionAtLeast('0.29.7'),
    hasApprovalMode: isVersionAtLeast('0.30.0')
  };
}
```

**Rationale**: Security fix (env var injection), new model/flag awareness.

---

### V155-04: Model Selection Guide Update

**File**: `docs/guides/model-selection.md`

**Changes**:
1. Add Gemini 3.1 Pro row to model comparison table
2. Add `customtools` variant explanation
3. Update agent recommendation table
4. Update CLI examples with `gemini-3.1-pro` option
5. Update version and date metadata

**Key Addition**:
```markdown
### Gemini 3.1 Pro (NEW - 2026-02-19)

| Attribute | Value |
|-----------|-------|
| Model ID | `gemini-3.1-pro-preview` |
| Customtools Variant | `gemini-3.1-pro-preview-customtools` |
| Context Window | 1,000,000 tokens |
| ARC-AGI-2 Score | 77.1% |
| Best For | Complex reasoning, tool-heavy agents (cto-lead, gap-detector) |
| Cost | Input: $2.00/1M, Output: $12.00/1M |

The `customtools` variant prioritizes registered MCP tools over bash commands,
making it ideal for bkit's tool-based agent orchestration.
```

---

### V155-05: Sub-agent Spawn Security Fix

**File**: `mcp/spawn-agent-server.js`

#### Change 5a: --yolo to --approval-mode=yolo (line 691)

**Current Code**:
```javascript
const args = [
  '-e', agentPath,
  '--yolo',
  task
];
```

**New Code**:
```javascript
const { getFeatureFlags } = require(path.join(__dirname, '..', 'lib', 'adapters', 'gemini', 'version-detector'));

const flags = getFeatureFlags();
const approvalFlag = flags.hasApprovalMode ? '--approval-mode=yolo' : '--yolo';

const args = [
  '-e', agentPath,
  approvalFlag,
  task
];
```

#### Change 5b: team_name path traversal fix (around line 572)

**Current Code** (team_create handler):
```javascript
const statePath = path.join(stateDir, `${teamName}.json`);
```

**New Code**:
```javascript
const sanitizedName = teamName.replace(/[^a-zA-Z0-9_-]/g, '');
if (sanitizedName !== teamName || sanitizedName.length === 0) {
  throw new Error(`Invalid team name: "${teamName}". Use only alphanumeric, hyphens, underscores.`);
}
const statePath = path.join(stateDir, `${sanitizedName}.json`);
```

**Rationale**: CRITICAL security fixes from Security Architect analysis.

---

### V155-06: Policy Migrator TOML Validation

**File**: `lib/adapters/gemini/policy-migrator.js`

#### Change 6a: TOML string escaping (in `convertToToml`, ~line 103)

**Current Code**:
```javascript
rules.push(`toolName = "${tool}"`);
```

**New Code**:
```javascript
rules.push(`toolName = "${escapeTomlString(tool)}"`);
```

**Add helper function**:
```javascript
function escapeTomlString(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}
```

#### Change 6b: Schema validation before write (in `generatePolicyFile`, ~line 202)

**Add before file write**:
```javascript
function validateTomlStructure(tomlContent) {
  const rules = tomlContent.match(/\[\[rule\]\]/g);
  if (!rules || rules.length === 0) {
    debugLog('Warning: Generated TOML has no rules');
    return false;
  }
  const decisions = tomlContent.match(/decision\s*=\s*"(allow|deny|ask_user)"/g);
  if (!decisions || decisions.length !== rules.length) {
    debugLog('Warning: Rule count mismatch with decision count');
    return false;
  }
  return true;
}
```

#### Change 6c: Version guard in generatePolicyFile

**Add at top of `generatePolicyFile`**:
```javascript
const { getFeatureFlags } = require('./version-detector');
if (!getFeatureFlags().hasPolicyEngine) {
  debugLog('Policy Engine not available (CLI < 0.30.0). Skipping generation.');
  return { created: false, reason: 'version' };
}
```

**Rationale**: TOML format integrity, prevent writing invalid policy files.

---

### V155-07: AfterTool Hook Resilience

**File**: `hooks/scripts/after-tool.js`

#### Change 7a: Defensive field access (around line 18-19)

**Current Code**:
```javascript
const toolName = input.tool_name;
const toolInput = input.tool_input;
```

**New Code**:
```javascript
const toolName = input.tool_name || input.toolName || '';
const toolInput = input.tool_input || input.toolInput || {};
```

#### Change 7b: Tool Output Masking resilience (around line 39)

**Current Code**:
```javascript
const filePath = toolInput.file_path || toolInput.path;
```

**New Code**:
```javascript
const filePath = toolInput.file_path || toolInput.path || toolInput.filePath || '';
```

**Rationale**: v0.30.0 may change field names in hook input schema due to tool definition centralization.

---

### V155-08: Agent Model Upgrades (Gemini 3.1 Pro)

**File**: `agents/cto-lead.md`
**Location**: Frontmatter `model` field

**Current**: `model: gemini-3-pro`
**New**: `model: gemini-3.1-pro`

**File**: `agents/gap-detector.md`
**Location**: Frontmatter `model` field

**Current**: `model: gemini-3-pro`
**New**: `model: gemini-3.1-pro`

**Rationale**: These are the two highest-complexity agents. Gemini 3.1 Pro offers ARC-AGI-2 77.1% and the `customtools` variant prioritizes MCP tool usage.

---

### V155-09: Agent Model Optimization (flash-lite)

**File**: `agents/report-generator.md`
**Location**: Frontmatter `model` field

**Current**: `model: gemini-3-flash`
**New**: `model: gemini-3-flash-lite`

**File**: `agents/qa-monitor.md`
**Location**: Frontmatter `model` field

**Current**: `model: gemini-3-flash`
**New**: `model: gemini-3-flash-lite`

**Rationale**: 60% cost reduction. These agents perform log analysis and report generation - tasks well within flash-lite capabilities.

---

### V155-10: Extension Manifest Version Bump

**File**: `gemini-extension.json`

**Current**: `"version": "1.5.4"`
**New**: `"version": "1.5.5"`

---

### V155-11: Enhanced Dangerous Patterns

**File**: `hooks/scripts/before-tool.js`

**Add to dangerous patterns array** (~line 152):
```javascript
// Reverse shell patterns
/\b(bash|sh|nc|ncat)\s+-[ie]\s+/i,
// Policy file tampering
/\.gemini\/policies\//,
// Remote code execution via pipes
/(curl|wget)\s+.*\|\s*(bash|sh|python|node)/i,
// Sensitive file patterns
/\.(pem|key|cert|p12|pfx|jks)\s*$/i,
```

---

## 3. Detailed File Changes (v1.6.0 - Reference)

### V160-01: SKILL.md Namespace Migration

**Files**: 28 SKILL.md files across `skills/` directory

**Field Renames** (9 fields across 28 files = 252 individual changes):

| Current Field | New Field |
|--------------|-----------|
| `user-invocable` | `bkit-user-invocable` |
| `argument-hint` | `bkit-argument-hint` |
| `allowed-tools` | `bkit-allowed-tools` |
| `imports` | `bkit-imports` |
| `agents` | `bkit-agents` |
| `context` | `bkit-context` |
| `memory` | `bkit-memory` |
| `pdca-phase` | `bkit-pdca-phase` |
| `task-template` | `bkit-task-template` |

**Parser Updates Required**:
- `lib/skill-orchestrator.js` lines 251-282 (frontmatter parsing)
- `hooks/scripts/before-tool-selection.js` lines 117-138 (allowed-tools regex)

**Migration Strategy**: 3-phase approach
1. Add dual-parse shim (accept both old and new field names)
2. Rename all 28 SKILL.md files
3. Remove old field support after 1 release cycle

---

### V160-02: Code Deduplication (5 pairs)

| # | Duplicate | Source of Truth | Action |
|---|-----------|----------------|--------|
| 1 | `lib/pdca/tier.js:15-21` TIER_EXTENSIONS | `lib/core/file.js:14-20` | tier.js imports from file.js |
| 2 | `hooks/scripts/before-agent.js:64-126` triggers | `lib/intent/language.js:14-111` | before-agent.js imports |
| 3 | `hooks/scripts/session-start.js:113-144` detectProjectLevel | `lib/pdca/level.js:65-129` | DELETE, import detectLevel() |
| 4 | `hooks/scripts/before-model.js:60-73` getCurrentPdcaPhase | `lib/pdca/status.js` (new) | Extract to shared module |
| 5 | `hooks/scripts/before-tool-selection.js:66-79` getCurrentPdcaPhase | `lib/pdca/status.js` (new) | Import from shared module |

---

### V160-03: Large File Splits

| File | Current | Split Plan | Target |
|------|:-------:|-----------|:------:|
| `lib/skill-orchestrator.js` | 709 lines | Extract YAML parser (144 lines) → `lib/core/yaml-parser.js` | ~565 lines |
| `hooks/scripts/session-start.js` | 393 lines | Delete duplicate detectProjectLevel, extract context builders → `lib/context/session-context-builder.js` | ~190 lines |
| `lib/core/permission.js` | 407 lines | Extract glob matcher → `lib/core/glob-matcher.js` | ~370 lines |

---

### V160-04: AfterAgent Retry Pattern

**File**: `hooks/scripts/after-agent.js`
**Location**: Lines 10-11 (before handler registry)

**New Code**:
```javascript
function withRetry(handler, { maxRetries = 1, shouldRetry }) {
  return function(adapter, input) {
    const result = handler(adapter, input);
    if (shouldRetry && shouldRetry(result)) {
      debugLog(`Retry triggered for ${handler.name}`);
      // Queue retry via output instruction
      return { ...result, retry: true, retryCount: (result.retryCount || 0) + 1 };
    }
    return result;
  };
}
```

**Apply to handlers**:
```javascript
AGENT_HANDLERS['gap-detector'] = withRetry(handleGapDetectorComplete, {
  maxRetries: 1,
  shouldRetry: (r) => r && r.matchRate === null
});
```

---

### V160-05: SDK Integration (Lazy Bridge)

**New File**: `lib/adapters/gemini/sdk-bridge.js`

```javascript
let coreSDK = null;

function getSDK() {
  if (coreSDK) return coreSDK;
  try {
    coreSDK = require('@google/gemini-cli-core');
    return coreSDK;
  } catch (e) {
    debugLog('gemini-cli-core SDK not available. Using fallback.');
    return null;
  }
}

module.exports = { getSDK };
```

**Rationale**: Optional lazy-load. Never hard-require. Enables JS-based skills alongside SKILL.md.

---

### V160-06: MCP SDK Protocol Update

**File**: `mcp/spawn-agent-server.js`

**Current protocol version** (in server initialization):
```javascript
protocolVersion: '2024-11-05'
```

**New**:
```javascript
protocolVersion: '2025-03-26'
```

**Add capability**:
```javascript
capabilities: {
  tools: { listChanged: true }
}
```

---

### V160-07: Test Framework Setup

**Framework**: Vitest (devDependency)
**Test Suites Already Created**:
- `tests/suites/tc16-v030-phase1.js` (21 cases, P0)
- `tests/suites/tc17-v030-phase2.js` (11 cases, P1)

**Target Coverage**: 65% at v1.6.0, 80% at v1.7.0

---

### V160-08: Extension Registry Preparation

**File**: `gemini-extension.json`

**Add fields**:
```json
"icon": "images/bkit-icon.png",
"homepage": "https://github.com/popup-studio-ai/bkit-gemini"
```

---

## 4. Dependency Graph

```
V155-03 (version-detector) ─────┐
                                 ├──→ V155-01 (session-start Policy trigger)
V155-06 (policy-migrator) ──────┘

V155-03 (version-detector) ──────→ V155-05 (spawn-agent --approval-mode)

V155-04 (model-selection.md) ←──── V155-08 (agent model 3.1 Pro)
                             ←──── V155-09 (agent model flash-lite)

V155-02 (bkit.config.json) ─────── Independent (no dependencies)
V155-07 (after-tool.js) ────────── Independent
V155-10 (gemini-extension.json) ── Independent
V155-11 (before-tool.js) ──────── Independent
```

**Recommended Implementation Order**:
1. V155-03 (version-detector) - Foundation, others depend on this
2. V155-06 (policy-migrator) - Needs version-detector
3. V155-01 (session-start) - Needs both above
4. V155-05 (spawn-agent) - Needs version-detector
5. V155-02, V155-07, V155-11 (independent changes) - Parallel
6. V155-08, V155-09 (model updates) - Parallel
7. V155-04 (docs), V155-10 (manifest) - Final

---

## 5. Test Plan Reference

**Test Strategy**: `docs/05-test/gemini-cli-030-migration-test-strategy.md`
**Automated Suites**: `tests/suites/tc16-v030-phase1.js` (21 cases), `tests/suites/tc17-v030-phase2.js` (11 cases)
**Manual Checklist**: `tests/manual/phase1-smoke-checklist.md`

### Critical Test Cases

| ID | Test | Pass Criteria |
|----|------|---------------|
| P1-09 | Policy TOML auto-generation | `.gemini/policies/bkit-permissions.toml` created when CLI >= 0.30.0 |
| P1-10 | Existing policy preservation | Existing TOML files never overwritten |
| P1-14 | SemVer validation | `GEMINI_CLI_VERSION="99.99.99"` ignored with warning |
| P2-01 | Sub-agent spawn v0.30.0 | `gemini -e agent.md --approval-mode=yolo` works |
| P2-04 | TOML decision values | `decision = "ask_user"` (not `"ask"`) |
| P2-07 | AfterTool missing fields | Handles missing `tool_input` gracefully |

---

## 6. Risk Mitigation

| Risk | Mitigation | Owner |
|------|-----------|-------|
| v0.30.0 stable not yet on npm | Check before release; if preview only, target v0.29.7 as tested | CTO |
| `--approval-mode=yolo` not working | Fallback to `--yolo` via version detection | V155-05 |
| Gemini 3.1 Pro model ID incorrect | Verify against `gemini models list` output; revert to 3-pro if unavailable | V155-08 |
| TOML format incompatible | validateTomlStructure() catches issues before write | V155-06 |
| flash-lite model not available | Version-gated; fallback to gemini-3-flash | V155-09 |

---

## 7. Rollback Plan

All v1.5.5 changes are backward-compatible with v0.29.x:
- Policy TOML generation is gated by `hasPolicyEngine` flag (v0.30.0+)
- `--approval-mode` fallback uses `--yolo` for older versions
- Model names fallback to previous models if unavailable
- SemVer validation only rejects invalid values; valid v0.29.x values pass through

**Rollback procedure**: Revert to v1.5.4 tag. No data migration needed.

---

## 8. Files Modified Summary

### v1.5.5 (14 files)

| # | File | Change Type | Lines Changed |
|---|------|:-----------:|:-------------:|
| 1 | `hooks/scripts/session-start.js` | Add | ~15 |
| 2 | `bkit.config.json` | Edit | 1 |
| 3 | `lib/adapters/gemini/version-detector.js` | Add/Edit | ~30 |
| 4 | `docs/guides/model-selection.md` | Rewrite | ~50 |
| 5 | `mcp/spawn-agent-server.js` | Edit | ~15 |
| 6 | `lib/adapters/gemini/policy-migrator.js` | Add | ~30 |
| 7 | `hooks/scripts/after-tool.js` | Edit | ~6 |
| 8 | `agents/cto-lead.md` | Edit | 1 |
| 9 | `agents/gap-detector.md` | Edit | 1 |
| 10 | `agents/report-generator.md` | Edit | 1 |
| 11 | `agents/qa-monitor.md` | Edit | 1 |
| 12 | `gemini-extension.json` | Edit | 1 |
| 13 | `hooks/scripts/before-tool.js` | Add | ~8 |
| 14 | `CHANGELOG.md` | Add | ~30 |

### v1.6.0 (30+ files, reference)

- 28 SKILL.md files (namespace migration)
- `lib/skill-orchestrator.js` (parser + split)
- `hooks/scripts/before-tool-selection.js` (parser update)
- `hooks/scripts/before-agent.js` (deduplication)
- `hooks/scripts/session-start.js` (deduplication + split)
- `hooks/scripts/before-model.js` (deduplication)
- `hooks/scripts/after-agent.js` (retry pattern)
- `lib/core/yaml-parser.js` (new - extracted)
- `lib/pdca/status.js` (new - shared utility)
- `lib/adapters/gemini/sdk-bridge.js` (new)
- `gemini-extension.json` (registry fields)

---

*Design document prepared by CTO-Lead*
*Based on 8 specialist agent research reports*
*bkit Vibecoding Kit v1.5.4 → v1.5.5 Migration Design*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
