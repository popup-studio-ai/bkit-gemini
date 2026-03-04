# Gemini CLI Version Upgrade Impact Analysis Report

> **Feature**: gemini-cli-upgrade
> **Date**: 2026-03-04
> **Team**: CTO-Led Agent Team (4 agents + CTO Lead)
> **Phase**: PDCA Report (Research & Analysis)
> **bkit Version**: v1.5.6 -> v1.5.7+ (proposed)

---

## Executive Summary

Gemini CLI has released **v0.32.1** (2026-03-04, stable) since bkit-gemini's last tested version v0.31.0. This report is a comprehensive analysis of all changes from v0.31.0 to v0.32.1 and preview versions (v0.33.0-preview.1, v0.34.0-nightly), their impact on bkit-gemini's 10 core subsystems, and detailed enhancement proposals for bkit v1.5.7+.

### Key Findings

| Category | Count | Severity |
|----------|-------|----------|
| Breaking Changes | 5 | CRITICAL |
| New Built-in Tools | 6 | HIGH |
| Policy Engine Changes | 5 | HIGH |
| New Feature Opportunities | 12 | MEDIUM |
| Known Regressions | 2 | HIGH (caution) |
| Long-term Architecture Shifts | 2 | STRATEGIC |

### Version Timeline

```
v0.31.0 (Feb 27) - Current bkit target
  |
v0.32.0-preview.0 (Feb 27)
  |
v0.33.0-nightly (Feb 28)
  |
v0.32.0 (Mar 3) - Stable, major feature release
  |
v0.32.1 (Mar 4) - Patch release (TODAY)
  |
v0.33.0-preview.0 (Mar 3)
  |
v0.33.0-preview.1 (Mar 4) - Latest preview
  |
v0.34.0-nightly (Mar 4) - Latest nightly
```

---

## 1. Breaking Changes Analysis

### 1.1 [CRITICAL] 6 New Task Tracker Tools (v0.32.0)

**What Changed**: Gemini CLI v0.32.0 introduces a built-in Task Tracker system with 6 new tools:

| New Tool | Purpose | Parameters |
|----------|---------|------------|
| `tracker_create_task` | Create task (epic/task/bug) | type, title, description, parent_id |
| `tracker_update_task` | Update task status/details | task_id, status, title, description |
| `tracker_get_task` | Retrieve task details | task_id |
| `tracker_list_tasks` | List/filter tasks | status, type, parent_id |
| `tracker_add_dependency` | Add task dependencies | task_id, depends_on |
| `tracker_visualize` | ASCII tree visualization | root_task_id |

Tasks stored in `.tracker/tasks/` as JSON files with 6-character hex IDs. Includes circular dependency detection.

**Impact on bkit-gemini**:

| Component | Impact | Severity |
|-----------|--------|----------|
| `tool-registry.js` | 6 new tools missing from `BUILTIN_TOOLS`, `ALL_BUILTIN_TOOL_NAMES`, `TOOL_ANNOTATIONS`, `TOOL_CATEGORIES` | **HIGH** |
| `before-tool-selection.js` | Tracker tools not in any category - won't be filtered or available in PDCA phases | **HIGH** |
| `before-tool.js` | No permission rules for tracker tools | **MEDIUM** |
| `policy-migrator.js` | Level policy templates don't include tracker tools | **MEDIUM** |
| GEMINI.md tool reference | Tool count outdated (17 -> 23) | **LOW** |
| Agent frontmatter | 16 agents may need `tracker_*` tools in their allowed tools list | **MEDIUM** |
| Skill frontmatter | 29 skills' `allowed-tools` may need tracker tools | **MEDIUM** |

**Required Changes**:
```javascript
// tool-registry.js - Add to BUILTIN_TOOLS
TRACKER_CREATE_TASK: 'tracker_create_task',
TRACKER_UPDATE_TASK: 'tracker_update_task',
TRACKER_GET_TASK: 'tracker_get_task',
TRACKER_LIST_TASKS: 'tracker_list_tasks',
TRACKER_ADD_DEPENDENCY: 'tracker_add_dependency',
TRACKER_VISUALIZE: 'tracker_visualize',

// Add to TOOL_CATEGORIES
TASK_TRACKER: [
  BUILTIN_TOOLS.TRACKER_CREATE_TASK,
  BUILTIN_TOOLS.TRACKER_UPDATE_TASK,
  BUILTIN_TOOLS.TRACKER_GET_TASK,
  BUILTIN_TOOLS.TRACKER_LIST_TASKS,
  BUILTIN_TOOLS.TRACKER_ADD_DEPENDENCY,
  BUILTIN_TOOLS.TRACKER_VISUALIZE
]

// Add to TOOL_ANNOTATIONS
[BUILTIN_TOOLS.TRACKER_CREATE_TASK]: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
[BUILTIN_TOOLS.TRACKER_UPDATE_TASK]: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
[BUILTIN_TOOLS.TRACKER_GET_TASK]: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
[BUILTIN_TOOLS.TRACKER_LIST_TASKS]: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
[BUILTIN_TOOLS.TRACKER_ADD_DEPENDENCY]: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
[BUILTIN_TOOLS.TRACKER_VISUALIZE]: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
```

**bkit PDCA Integration Opportunity**: The native Task Tracker could replace or supplement bkit's MCP-based task tools (`team_assign`, `team_status`), enabling tighter integration with the PDCA workflow.

---

### 1.2 [CRITICAL] grep_search Parameter Rename

**What Changed**: `include` parameter renamed to `include_pattern` in `grep_search` tool (PR #20328).

**Impact on bkit-gemini**:

| Component | Impact |
|-----------|--------|
| `tool-registry.js` | No direct parameter reference (safe) |
| Agent instructions | Agents that reference grep_search parameters need update |
| Skill instructions | Skills referencing grep file patterns need update |
| Before/After tool hooks | If hooks parse grep_search input parameters, they break |

**Required Changes**: Search all agent `.md` files and skill `SKILL.md` files for references to `grep_search` with `include` parameter and update to `include_pattern`.

---

### 1.3 [CRITICAL] read_file Parameter Migration

**What Changed**: `offset`/`limit` parameters migrated to 1-based `start_line`/`end_line` in `read_file` tool.

**Impact on bkit-gemini**:

| Component | Impact |
|-----------|--------|
| Agent instructions | Any agent referencing `offset`/`limit` parameters |
| Hook scripts | `before-tool.js` or `after-tool.js` parsing `read_file` inputs |
| Skill instructions | Skills with file reading guidance |

**Required Changes**: Update all references from `offset`/`limit` to `start_line`/`end_line` throughout documentation and agent instructions.

---

### 1.4 [HIGH] Replace Tool Parameter Change (v0.31.0)

**What Changed**: `expected_replacements` parameter renamed to `allow_multiple` in the `replace` tool.

**Impact on bkit-gemini**:

| Component | Impact |
|-----------|--------|
| Agent instructions | Agents referencing `expected_replacements` parameter need update |
| Skill instructions | Skills with file editing guidance need update |
| Hook scripts | `before-tool.js` if parsing replace tool parameters |

**Required Changes**: Search all agent/skill files for `expected_replacements` references and update to `allow_multiple`. This was introduced in v0.31.0 which bkit already targets, so it may already be handled - verify.

### 1.5 [MEDIUM] `--allowed-tools` CLI Flag Deprecated (v0.30.0+)

**What Changed**: `--allowed-tools` CLI flag deprecated in favor of Policy Engine `--policy` flag.

**Impact on bkit-gemini**:
- `spawn-agent-server.js` may use `--allowed-tools` when spawning sub-agents
- Any documentation referencing this flag needs update

---

## 2. Policy Engine Evolution (v0.31.0 -> v0.32.0)

### 2.1 4-Tier Priority System

**v0.32.0 Architecture**:
```
Tier 1: Default (base) - Priority 1
Tier 2: Workspace/Extension - Priority 2
Tier 3: User - Priority 3 (previously workspace)
Tier 4: Admin - Priority 4
```

**Key Changes**:
- Extensions can now contribute policy rules, but with restrictions:
  - Extensions can only use `DENY` or `ASK_USER` decisions
  - `ALLOW` decisions from extensions are **silently ignored**
  - Extensions cannot contribute to YOLO mode
- Tool name validation added to TOML policy files
- "Always Allow" repurposed to workspace level

**Impact on bkit-gemini**:

| Component | Impact | Severity |
|-----------|--------|----------|
| `policy-migrator.js` | `LEVEL_POLICY_TEMPLATES` use `allow` decisions at Tier 3 (now User tier, not workspace) - these should be generated at workspace level, not extension level | **HIGH** |
| `gemini-extension.json` | `excludeTools` deprecated - should be replaced with extension-level policy rules (DENY/ASK_USER only) | **HIGH** |
| `bkit.config.json` | `permissions` section needs tier-aware mapping | **MEDIUM** |

**Required Changes**:
1. Policy migrator must distinguish between extension-level (Tier 2, no ALLOW) and workspace-level (Tier 3, ALLOW permitted) policy generation
2. Replace `excludeTools` in `gemini-extension.json` with proper extension-level TOML policy
3. Add `policies/` directory support in extension manifest

### 2.2 Known Policy Engine Bugs

| Issue | Description | Risk |
|-------|-------------|------|
| #20635 | `toolname` (lowercase) typo allows ALL tools - no field validation | **HIGH** |
| #19919 | "Failed to persist policy" on Linux aarch64 | **MEDIUM** |
| #20281 | Symbolic link policy files silently ignored | **LOW** |
| #20294 | Inline env vars break policy persistence | **LOW** |

**Recommendation**: Add field name validation to `validateTomlStructure()` in policy-migrator.js:
```javascript
// Validate field names (prevent #20635 vulnerability)
const invalidFields = tomlContent.match(/toolname\s*=/gi);
if (invalidFields) {
  return false; // Must be "toolName", not "toolname"
}
```

---

## 3. Deprecation & Removal Warnings

### 3.1 `allowedTools`/`excludeTools` Removal (Issue #21025)

**Status**: Marked `@deprecated` in Gemini CLI source, full removal planned.

**Impact on bkit-gemini**:
- `gemini-extension.json` still uses `excludeTools` (line 12-15)
- `bkit.config.json` permissions system uses these concepts
- `permission.js` has fallback to `excludeTools` logic

**Migration Path**:
1. Phase 1 (v1.5.7): Add equivalent TOML policy rules alongside `excludeTools`
2. Phase 2 (v1.5.8): Remove `excludeTools` from `gemini-extension.json`, rely solely on Policy Engine
3. Phase 3: Remove `permission.js` excludeTools fallback code

### 3.2 ToolCallConfirmationDetails Migration (Issue #21023)

**Status**: Migrating from callback-based to event-driven confirmation.

**Impact on bkit-gemini**: Low immediate impact (bkit uses hooks, not confirmation callbacks). Monitor for changes to hook event payloads.

---

## 4. Known Regressions & Caution Items

### 4.1 [CRITICAL] Sub-agents Hang on Interactive Prompts (Issue #21052)

**Version**: v0.32.0 regression
**Description**: Sub-agents hang indefinitely when encountering interactive terminal prompts. Reverting to v0.31.0 resolves.

**Impact on bkit-gemini**:
- MCP server's `spawn_agent` tool spawns sub-agents using `gemini -e <agentPath>`
- If spawned agent triggers interactive prompt (e.g., shell command confirmation), it hangs
- Affects ALL 16 agents when spawned as sub-agents

**Recommendation**:
- Test v0.32.1 to verify if patch resolves this
- Add timeout guard in `executeAgent()` (spawn-agent-server.js)
- Consider adding `--non-interactive` flag if available

### 4.2 [HIGH] AfterAgent Hooks Endless Loop (Issue #20426)

**Version**: v0.30.0+ (persistent)
**Description**: `stop_hook_active` state not propagated correctly in `client.ts:205`, causing AfterAgent hooks to loop.

**Impact on bkit-gemini**:
- `after-agent.js` hook could potentially loop on agent completion
- Currently 10s timeout in hooks.json provides some protection

**Recommendation**:
- Add self-loop detection in `after-agent.js`:
```javascript
const LOOP_GUARD_KEY = '__bkit_after_agent_called';
if (process.env[LOOP_GUARD_KEY]) process.exit(0);
process.env[LOOP_GUARD_KEY] = '1';
```

### 4.3 MCP outputSchema Failure (Issue #21053)

**Version**: v0.32.0
**Description**: MCP tools with `outputSchema` fail with error `-32600`.

**Impact on bkit-gemini**:
- `spawn-agent-server.js` MCP server defines 6 tools
- If any tool uses output schemas, they will fail on v0.32.0
- Currently bkit MCP tools don't use `outputSchema` (safe for now)

---

## 5. New Feature Opportunities

### 5.1 Native Task Tracker Integration (Priority: HIGH)

**Opportunity**: Replace or supplement bkit's MCP-based task management with native Gemini CLI Task Tracker.

**Current bkit approach**:
- MCP tools: `team_create`, `team_assign`, `team_status`
- State in `.gemini/teams/` as JSON files
- No circular dependency detection
- No visualization

**Proposed integration**:
```
bkit PDCA Task Chain:
[Plan] -> tracker_create_task(type: "epic", title: "Feature X")
  [Design] -> tracker_create_task(type: "task", parent_id: epic_id)
  [Do] -> tracker_create_task(type: "task", parent_id: epic_id)
  [Check] -> tracker_create_task(type: "task", parent_id: epic_id)
  [Act] -> tracker_create_task(type: "task", parent_id: epic_id)
  [Report] -> tracker_create_task(type: "task", parent_id: epic_id)
```

**Benefits**:
- Native CLI support (no MCP overhead)
- Circular dependency detection built-in
- ASCII visualization with `tracker_visualize`
- Persistent across sessions in `.tracker/tasks/`

---

### 5.2 Hook Type Migration: command -> function (Priority: HIGH)

**Opportunity**: Migrate hooks from `type: "command"` (child_process spawn) to `type: "function"` (RuntimeHook, in-process).

**Current state**: All 10 hooks use `type: "command"`, spawning Node.js child processes for each invocation.

**v0.31.0+ RuntimeHook functions**:
- Run in-process (99% faster execution)
- No child_process overhead
- Direct access to context objects
- Already detected by `hook-adapter.js` (prepared but not activated)

**Migration plan**:
```json
// hooks.json - Migrate top 3 high-frequency hooks first
{
  "BeforeAgent": [{
    "hooks": [{
      "name": "bkit-intent-detection",
      "type": "function",
      "source": "${extensionPath}/hooks/scripts/before-agent.js",
      "export": "handler"
    }]
  }]
}
```

**Phase 1 candidates (highest frequency)**:
1. `BeforeAgent` (every user prompt)
2. `BeforeModel` (every model call)
3. `AfterModel` (every model response)

**Phase 2 candidates**:
4. `BeforeToolSelection` (every tool selection)
5. `BeforeTool` (every tool call)
6. `AfterTool` (every tool completion)

---

### 5.3 Model Family Toolset Awareness (Priority: MEDIUM)

**Opportunity**: v0.32.0 introduces model-family-specific tool definitions (`default-legacy.ts` vs `gemini-3.ts`).

**Impact**: Agent model selection should consider toolset differences:
- `gemini-3-pro` agents get Gemini 3 optimized tool definitions
- `gemini-2.5-pro` agents get legacy tool definitions
- Different parameter descriptions and constraints per model family

**Proposed change**: Add `modelFamily` awareness to `version-detector.js`:
```javascript
// v0.32.0+ feature flag
hasModelFamilyToolsets: isVersionAtLeast('0.32.0'),
```

---

### 5.4 Extension Policy Engine Integration (Priority: MEDIUM)

**Opportunity**: Extensions can now contribute their own policy rules (v0.32.0).

**Current bkit approach**: Generates workspace-level policies only.

**Proposed enhancement**:
- Add extension-level policy file (`policies/bkit-extension-policy.toml`) with DENY/ASK_USER rules
- Keep workspace-level policies for ALLOW rules
- Properly separate Tier 2 (extension) from Tier 3 (workspace) policies

---

### 5.5 Plan Mode Enhancements (Priority: MEDIUM)

**v0.32.0 new capabilities**:
- External editor support for plans
- Adaptive planning (complexity-based)
- Plan annotations for feedback iteration
- Built-in research subagents in plan mode (v0.33.0)
- `/plan copy` subcommand
- PLAN_MODE_TOOLS constant

**Proposed bkit integration**:
- Map bkit's PDCA Plan phase to native Plan Mode
- Use `PLAN_MODE_TOOLS` constant for `before-tool-selection.js` plan phase filtering
- Leverage plan annotations for PDCA design review feedback

---

### 5.6 Agent-to-Agent (A2A) Protocol (Priority: LOW)

**v0.32.0 capabilities**:
- `Kind.Agent` classification for sub-agent tools
- HTTP authentication for remote agents
- Robust A2A streaming
- 30-minute timeout (v0.33+)

**Future bkit integration**: Team Mode could leverage A2A for distributed agent coordination instead of MCP-based spawning.

---

### 5.7 Interactive Shell Autocompletion (Priority: LOW)

**v0.32.0 feature**: Git, npm providers for autocompletion.

**Opportunity**: bkit commands (`/pdca`, `/review`, `/qa`, etc.) could provide custom autocompletion entries.

---

## 6. Version Detector Upgrade Requirements

### 6.1 New Feature Flags Needed

```javascript
// version-detector.js - Add v0.32.0+ flags
getFeatureFlags() {
  return {
    // ... existing flags ...

    // v0.32.0+
    hasTaskTracker: isVersionAtLeast('0.32.0'),
    hasModelFamilyToolsets: isVersionAtLeast('0.32.0'),
    hasExtensionPolicies: isVersionAtLeast('0.32.0'),
    hasPlanModeEnhanced: isVersionAtLeast('0.32.0'),
    hasA2AStreaming: isVersionAtLeast('0.32.0'),
    hasShellAutocompletion: isVersionAtLeast('0.32.0'),
    hasGrepIncludePatternRename: isVersionAtLeast('0.32.0'),
    hasReadFileLineParams: isVersionAtLeast('0.32.0'),
    hasParallelExtensionLoading: isVersionAtLeast('0.32.0'),

    // v0.33.0+ (preview)
    hasPlanModeResearchSubagents: isVersionAtLeast('0.33.0'),
    hasA2AExtendedTimeout: isVersionAtLeast('0.33.0'),
  };
}
```

### 6.2 MAX_PLAUSIBLE_VERSION

Current: `2.0.0` - This is fine for now, but should be monitored if Gemini CLI approaches v1.x.x.

### 6.3 Nightly/Preview Version Parsing

Current `parseVersion()` handles `X.Y.Z-preview.N` format but NOT `X.Y.Z-nightly.YYYYMMDD` format.

**Required fix**:
```javascript
function parseVersion(raw) {
  // Add nightly format support
  const match = raw.match(/^(\d+)\.(\d+)\.(\d+)(-(?:preview\.(\d+)|nightly\.(\d+)))?/);
  // ...
}
```

---

## 7. Codebase Impact Matrix

### Component-by-Component Analysis

| Component | File | Lines | v0.32.0 Impact | Changes Needed |
|-----------|------|-------|----------------|----------------|
| Version Detector | `version-detector.js` | 209 | HIGH | Add 11 new feature flags, nightly version parsing |
| Tool Registry | `tool-registry.js` | 271 | CRITICAL | Add 6 tracker tools, update annotations/categories |
| Policy Migrator | `policy-migrator.js` | 395 | HIGH | Tier-aware generation, field validation, extension policy |
| Hook Adapter | `hook-adapter.js` | ~84 | MEDIUM | Activate RuntimeHook migration for top hooks |
| Session Start | `session-start.js` | 392 | MEDIUM | v0.32.0 feature detection, tracker tool awareness |
| Before Agent | `before-agent.js` | 186 | LOW | No direct impact |
| Before Tool | `before-tool.js` | 188 | MEDIUM | Add tracker tool permission rules |
| After Tool | `after-tool.js` | 142 | LOW | Add tracker tool post-processors |
| Before Tool Selection | `before-tool-selection.js` | 158 | HIGH | Add tracker tools to phase-based filtering |
| Permission Manager | `permission.js` | 381 | MEDIUM | Add tracker tool permission patterns |
| MCP Server | `spawn-agent-server.js` | 753 | MEDIUM | Test sub-agent hang regression, add timeout guard |
| Extension Manifest | `gemini-extension.json` | 30 | HIGH | Migrate `excludeTools`, add `policies/` |
| Hooks Config | `hooks.json` | 161 | MEDIUM | Consider function-type migration for top hooks |
| Config | `bkit.config.json` | 204 | MEDIUM | Add v0.32.0/v0.32.1 to testedVersions, tracker config |

### Agent Impact (16 agents)

| Agent | Model | Impact | Changes |
|-------|-------|--------|---------|
| cto-lead | gemini-3.1-pro | MEDIUM | Add tracker tools to frontmatter |
| gap-detector | gemini-3.1-pro | LOW | No direct impact |
| pdca-iterator | gemini-3-pro | MEDIUM | Could use tracker for iteration tracking |
| code-analyzer | gemini-3-pro | LOW | No direct impact |
| report-generator | gemini-3-flash-lite | LOW | No direct impact |
| qa-strategist | gemini-3-pro | LOW | No direct impact |
| product-manager | gemini-3-pro | MEDIUM | Could use tracker for requirements |
| pipeline-guide | gemini-3-flash | LOW | No direct impact |
| Other 8 agents | various | LOW | grep_search/read_file parameter updates if referenced |

### Skill Impact (29 skills)

| Category | Skills | Impact | Changes |
|----------|--------|--------|---------|
| PDCA | pdca | MEDIUM | Tracker integration for task chain |
| Level | starter, dynamic, enterprise | LOW | Update tool references |
| Pipeline | phase-1 ~ phase-9 | LOW | Minimal |
| bkend | 8 bkend skills | LOW | No direct impact |
| Utility | bkit-rules, bkit-templates | MEDIUM | Update tool counts and references |

---

## 8. Strategic Architecture Signals

### 8.1 ADK Replatforming (Issue #20995)

**What**: Google plans to replat Gemini CLI on Agent Development Kit (ADK). This will fundamentally change the core model and tool orchestration architecture.

**Timeline**: Unknown (issue is open, no milestone).

**Impact on bkit-gemini**:
- Hook system may change completely
- Tool definitions architecture may be restructured
- Extension manifest format may change
- Agent spawning API may change

**Recommendation**:
- Monitor this issue closely
- Design bkit v1.6.0+ with ADK adapter layer
- Keep `lib/adapters/gemini/` abstraction clean for future ADK adapter

### 8.2 Skills Architecture Gap (Issue #15895)

**Current state**: Gemini CLI treats skills as "tools with documentation" instead of bkit's approach of "methodologies with structured resources."

**Missing from Gemini CLI**:
- Semantic resource directories
- Progressive disclosure (Level 3)
- Frontmatter field support beyond basic metadata
- Skill lifecycle management

**Impact on bkit-gemini**: bkit's 29 skills with YAML frontmatter and progressive disclosure work through TOML command workarounds, not native skill support. If Gemini CLI improves native skill support, bkit can simplify.

**Recommendation**: Continue using TOML commands as skill entry points. Monitor #15895 for native skill improvements.

---

## 9. Migration Roadmap

### Phase 1: v1.5.7 - Critical Compatibility (Estimated: 1 week)

**Priority**: Ensure bkit works on Gemini CLI v0.32.0/v0.32.1

| Task | Effort | Priority |
|------|--------|----------|
| Add 6 tracker tools to tool-registry.js | 2h | P0 |
| Add 11 v0.32.0+ feature flags to version-detector.js | 1h | P0 |
| Fix nightly version parsing in version-detector.js | 30min | P1 |
| Update before-tool-selection.js for tracker tools | 1h | P0 |
| Add tracker tool annotations | 30min | P1 |
| Update grep_search `include` -> `include_pattern` references | 2h | P0 |
| Update read_file `offset`/`limit` -> `start_line`/`end_line` references | 2h | P0 |
| Add v0.32.0, v0.32.1 to testedVersions | 10min | P0 |
| Add AfterAgent loop guard | 30min | P1 |
| Test sub-agent spawning on v0.32.1 | 2h | P0 |
| Update GEMINI.md tool count (17 -> 23) | 30min | P1 |
| Update README.md compatibility section | 30min | P1 |

**Total estimated effort**: ~12 hours

### Phase 2: v1.5.8 - Policy Engine Migration (Estimated: 1-2 weeks)

| Task | Effort | Priority |
|------|--------|----------|
| Migrate `excludeTools` to extension-level TOML policy (DENY/ASK_USER only) | 4h | P1 |
| Implement tier-aware policy generation in policy-migrator.js | 4h | P1 |
| Add field name validation to TOML validator (prevent #20635) | 1h | P1 |
| Create extension policies directory structure | 2h | P2 |
| Update permission.js for 4-tier priority model | 4h | P2 |

### Phase 3: v1.6.0 - Performance & Features (Estimated: 2-3 weeks)

| Task | Effort | Priority |
|------|--------|----------|
| Migrate top 3 hooks to RuntimeHook functions | 8h | P2 |
| Integrate native Task Tracker with PDCA workflow | 8h | P2 |
| Add model family toolset awareness | 4h | P3 |
| Plan Mode native integration | 4h | P3 |
| ADK adapter layer preparation | 8h | P3 |

---

## 10. Risk Assessment

### Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Sub-agent hang on v0.32.0 | HIGH | HIGH | Test v0.32.1, add timeout guards |
| AfterAgent infinite loop | MEDIUM | HIGH | Add loop guard, monitor #20426 |
| excludeTools removal breaks bkit | LOW (future) | HIGH | Phase 2 migration to Policy Engine |
| ADK replatforming breaks hooks | LOW (6+ months) | CRITICAL | ADK adapter layer in Phase 3 |
| Policy typo vulnerability | MEDIUM | HIGH | Add field validation in Phase 2 |
| MCP outputSchema failure | LOW | MEDIUM | Don't add outputSchema to MCP tools |
| Tracker tools conflict with bkit tasks | LOW | MEDIUM | Design coexistence strategy |

### Compatibility Matrix

| Gemini CLI Version | bkit v1.5.6 | bkit v1.5.7 (proposed) |
|-------------------|-------------|------------------------|
| v0.29.0 | Full | Full |
| v0.30.0 | Full | Full |
| v0.31.0 | Full | Full |
| v0.32.0 | Partial (missing tracker tools) | Full |
| v0.32.1 | Partial (missing tracker tools) | Full |
| v0.33.0-preview | Unknown | Partial |

---

## 11. Detailed Enhancement Proposals

### Enhancement 1: Task Tracker - PDCA Bridge

**Description**: Create a bridge module that maps PDCA task chain to native Gemini CLI Task Tracker.

```
lib/adapters/gemini/
  tracker-bridge.js  (NEW - ~200 lines)
```

**Key functions**:
- `createPdcaEpic(feature)` - Create epic for feature with PDCA sub-tasks
- `syncPdcaStatus(feature)` - Sync .pdca-status.json with tracker state
- `getPdcaVisualization(feature)` - Get PDCA progress via `tracker_visualize`

**Integration points**:
- `session-start.js`: Auto-create tracker epic for active features
- `after-tool.js`: Update tracker when PDCA phase transitions
- `pdca` skill: Use tracker for task chain display

### Enhancement 2: Hybrid Policy Generation

**Description**: Generate policies at correct tier based on decision type.

```javascript
// Extension-level (Tier 2): Only DENY and ASK_USER
function generateExtensionPolicy(permissions) {
  const rules = Object.entries(permissions)
    .filter(([, level]) => level === 'deny' || level === 'ask')
    .map(([key, level]) => {
      const { tool, pattern } = parsePermissionKey(key);
      return { toolName: tool, decision: mapDecision(level), pattern };
    });
  // Write to extension's policies/ directory
}

// Workspace-level (Tier 3): ALLOW also permitted
function generateWorkspacePolicy(permissions, level) {
  // Full permission set including ALLOW decisions
  // Write to .gemini/policies/
}
```

### Enhancement 3: RuntimeHook Function Activation

**Description**: Activate RuntimeHook functions for the 3 highest-frequency hooks.

**Before (current)**:
```json
{
  "type": "command",
  "command": "node ${extensionPath}/hooks/scripts/before-agent.js"
}
```

**After (proposed)**:
```json
{
  "type": "function",
  "source": "${extensionPath}/hooks/scripts/before-agent.js",
  "export": "handler"
}
```

**Required script changes**: Each hook script needs to export a handler function instead of reading from stdin:
```javascript
// Current: reads from stdin
const input = JSON.parse(fs.readFileSync('/dev/stdin', 'utf-8'));

// Proposed: export handler function
module.exports.handler = function(event) {
  // Direct object access, no JSON parsing needed
  return { result: 'continue' };
};
```

---

## 12. Test Plan

### New Test Cases for v0.32.0 Compatibility

| ID | Category | Description | Priority |
|----|----------|-------------|----------|
| TC-21 | Tool Registry | Verify 23 tools registered (17 + 6 tracker) | P0 |
| TC-22 | Tool Registry | Verify tracker tool annotations | P0 |
| TC-23 | Feature Flags | Verify 11 new v0.32.0+ feature flags | P0 |
| TC-24 | Policy Engine | Verify tier-aware policy generation | P1 |
| TC-25 | Policy Engine | Verify field name validation (toolName vs toolname) | P1 |
| TC-26 | Version Detector | Test nightly version parsing | P1 |
| TC-27 | Before Tool Selection | Verify tracker tools in phase-based filtering | P0 |
| TC-28 | Sub-agent | Verify spawn_agent works on v0.32.1 | P0 |
| TC-29 | AfterAgent | Verify no infinite loop with loop guard | P1 |
| TC-30 | grep_search | Verify include_pattern parameter handling | P1 |
| TC-31 | read_file | Verify start_line/end_line parameter handling | P1 |

---

## 13. Conclusions & Recommendations

### Immediate Actions (This Week)

1. **Test v0.32.1 compatibility**: Install v0.32.1 and run existing test suite to identify actual failures
2. **Add 6 tracker tools**: Minimum change to prevent tool registry errors
3. **Add v0.32.0+ feature flags**: Enable version-gated functionality
4. **Fix parameter name changes**: grep_search and read_file breaking changes

### Short-term (2 Weeks)

5. **Policy Engine tier migration**: Move from `excludeTools` to proper tier-based policies
6. **AfterAgent loop guard**: Protect against confirmed bug #20426
7. **Sub-agent timeout guard**: Protect against regression #21052

### Medium-term (1 Month)

8. **RuntimeHook migration**: 99% performance improvement for top hooks
9. **Task Tracker integration**: Native PDCA task management
10. **Model family awareness**: Optimize agent tool definitions per model family

### Long-term (3+ Months)

11. **ADK preparation**: Abstract hook/tool layer for potential ADK migration
12. **A2A integration**: Distributed agent coordination for Team Mode
13. **Native skill improvements**: Monitor and adapt to Gemini CLI skill architecture changes

---

## Appendix A: Version Comparison Table

| Feature | v0.31.0 (current) | v0.32.0 | v0.32.1 | v0.33.0-preview |
|---------|-------------------|---------|---------|-----------------|
| Built-in Tools | 17 | 23 (+6 tracker) | 23 | 23+ |
| Policy Tiers | 3 | 4 | 4 | 4 |
| Extension Policies | No | Yes (DENY/ASK only) | Yes | Yes |
| Task Tracker | No | Yes | Yes | Yes |
| Plan Mode | Basic | Enhanced (editor, annotations) | Enhanced | + Research subagents |
| A2A Protocol | Basic | Robust streaming, auth | Same | 30min timeout |
| Hook Types | command | command + function | command + function | command + function |
| Model Families | Single | Legacy + Gemini 3 | Legacy + Gemini 3 | Legacy + Gemini 3 |
| grep_search param | `include` | `include_pattern` | `include_pattern` | `include_pattern` |
| read_file params | `offset`/`limit` | `start_line`/`end_line` | `start_line`/`end_line` | `start_line`/`end_line` |
| Shell Autocomplete | No | Yes | Yes | Yes |
| Generalist Agent | No | Yes (experimental) | Yes | Yes |

## Appendix B: Research Sources

### GitHub Research
- Repository: `google-gemini/gemini-cli`
- Releases analyzed: v0.31.0 ~ v0.34.0-nightly
- Issues analyzed: 50+ (hooks, extensions, policy, security, agents)
- PRs analyzed: 30+ merged since v0.31.0

### Codebase Analysis
- Files analyzed: 15 core files, ~4,000 lines
- Components analyzed: 10 subsystems
- Agents analyzed: 16
- Skills analyzed: 29
- Hooks analyzed: 10 events, 17 scripts

### Team Composition
| Agent | Role | Focus Area |
|-------|------|------------|
| CTO Lead | Orchestration | Synthesis, report generation |
| github-researcher | Research | GitHub releases, tags, commits |
| docs-researcher | Research | Official docs, tech blogs |
| issues-researcher | Research | GitHub issues, discussions, PRs |
| codebase-analyzer | Analysis | Deep codebase architecture review |

---

*Report generated by bkit CTO-Led Agent Team*
*bkit Vibecoding Kit v1.5.6 - Gemini CLI Edition*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
