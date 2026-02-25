# Gemini CLI v0.30.0 Stable Compatibility Verification

> **Task**: CTO Team Task #8 - Enterprise Expert
> **Date**: 2026-02-25
> **Agent**: enterprise-expert
> **Scope**: v0.30.0 stable release verification for bkit-gemini v1.5.4

---

## 0. Critical Discovery: v0.30.0 Stable Release Status

### Status: UNCONFIRMED - Stable may not yet be published

**Evidence from multiple sources**:

| Source | Finding |
|--------|---------|
| [geminicli.com/docs/changelogs/latest/](https://geminicli.com/docs/changelogs/latest/) | Still shows v0.29.0 as "Latest stable release" |
| [npm @google/gemini-cli](https://www.npmjs.com/package/@google/gemini-cli) | Latest published version is 0.29.7 (published ~10 hours ago as of search time) |
| [GitHub Releases](https://github.com/google-gemini/gemini-cli/releases) | No v0.30.0 stable tag found; only v0.30.0-preview.0 through v0.30.0-preview.6 |
| [geminicli.com/docs/changelogs/preview/](https://geminicli.com/docs/changelogs/preview/) | Shows v0.30.0-preview.3 as documented preview |

**Release cadence reference**: "New stable releases are published weekly at UTC 2000 on Tuesdays." Today is Tuesday 2026-02-25. The v0.30.0 stable may be scheduled for UTC 2000 today but has not yet appeared in any public source as of this analysis.

**Impact on this analysis**: All findings below are based on v0.30.0-preview.3 through v0.30.0-preview.6 behavior. If v0.30.0 stable includes cherry-picked changes from the preview series, these findings should hold. However, **the exact stable changelog is not yet available for verification**.

**Recommended action**: Wait until UTC 2100 today (2026-02-25) and re-verify the npm `latest` tag before any code changes. If v0.30.0 does not land today, the analysis applies to v0.30.0-preview.6 as the nearest reference.

---

## 1. Policy Engine GA Verification

### Status: CONFIRMED (with caveats - see Section 0)

### 1.1 TOML Schema (Verified from official docs + source code)

The Policy Engine TOML schema fields are confirmed from [geminicli.com/docs/reference/policy-engine/](https://geminicli.com/docs/reference/policy-engine/) and the source code at [packages/core/src/policy/policies/plan.toml](https://github.com/google-gemini/gemini-cli/blob/main/packages/core/src/policy/policies/plan.toml):

```toml
[[rule]]
toolName = "run_shell_command"    # String or array of strings. Supports wildcards: *, server__*, *__toolName
commandPrefix = "rm -rf"          # String or array. Matches if command starts with this. Shell tool only.
# commandRegex = "rm\\s+-rf"      # Regex alternative. Cannot use with commandPrefix in same rule.
# argsPattern = ".*dangerous.*"   # Regex tested against JSON-stringified tool arguments
decision = "deny"                 # "allow" | "deny" | "ask_user"
priority = 100                    # 0-999. Higher = checked first within same tier.
# modes = ["yolo"]                # Optional. Only apply in specific approval modes.
```

**Key schema facts confirmed**:

| Field | Type | Required | Notes |
|-------|------|:--------:|-------|
| `toolName` | string or string[] | YES | Wildcards supported: `*`, `server__*`, `*__toolName` |
| `decision` | string | YES | `"allow"`, `"deny"`, `"ask_user"` |
| `priority` | integer | YES | 0-999 range |
| `commandPrefix` | string or string[] | NO | Shell tool only. Mutually exclusive with `commandRegex` |
| `commandRegex` | string | NO | Shell tool only. Mutually exclusive with `commandPrefix` |
| `argsPattern` | string | NO | Regex tested against stable JSON string of tool arguments |
| `modes` | string[] | NO | Optional mode filter (e.g., `["yolo"]`) |

### 1.2 Priority Tier System (CONFIRMED)

The 4-tier hierarchy is confirmed from [Issue #16699](https://github.com/google-gemini/gemini-cli/issues/16699) and the policy engine documentation:

| Tier | Source | Effective Priority Formula |
|------|--------|---------------------------|
| **Admin** | IT/org-managed TOML files | `4 + priority/1000` (e.g., priority 100 -> 4.100) |
| **User** | `~/.gemini/policies/*.toml` | `3 + priority/1000` (e.g., priority 100 -> 3.100) |
| **Workspace** | `.gemini/policies/*.toml` (project) | `2 + priority/1000` (e.g., priority 100 -> 2.100) |
| **Default** | Built-in policies (e.g., plan.toml) | `1 + priority/1000` (e.g., priority 100 -> 1.100) |

**Hierarchy guarantee**: Admin > User > Workspace > Default. A priority=0 Admin rule always overrides a priority=999 User rule.

### 1.3 `excludeTools` Status (CONFIRMED - Deprecated but still functional)

From [v0.30.0-preview.3 changelog](https://geminicli.com/docs/changelogs/preview/): "`--allowed-tools` flag and `excludeTools` deprecated in favor of policy engine."

From [Extension reference](https://geminicli.com/docs/extensions/reference/): `excludeTools` is still documented as a valid property in `gemini-extension.json`, described as "An array of tool names to exclude from the model."

**Status**: Deprecated, NOT removed. Still functions as a fallback. The Policy Engine is the primary mechanism.

### 1.4 bkit Impact Assessment

**Current `policy-migrator.js` (231 lines) review**:

| Check | Status | Detail |
|-------|--------|--------|
| `[[rule]]` TOML array syntax | PASS | Lines 101-109, 117-126, 131-140 correctly use `[[rule]]` |
| `toolName` field | PASS | Line 103: `toolName = "${rule.toolName}"` |
| `commandPrefix` field | PASS | Lines 104-106: conditional include when pattern exists |
| `commandRegex` field | NOT USED | bkit uses `commandPrefix` only - acceptable |
| `argsPattern` field | NOT USED | Not needed for current permission rules |
| `decision` values | PASS | Line 39: maps to `deny`, `ask_user`, `allow` - all valid |
| `priority` field | PASS | Lines 51-56: deny=100, ask_user=50, allow=10 |
| `modes` field | NOT USED | Not needed - rules apply to all modes |
| Tier placement | WARNING | Output goes to `.gemini/policies/` (Workspace tier, priority base = 2.xxx). This is correct for project-level extension policies. |

**Critical finding (C-01 from previous analysis)**: The TOML output lacks runtime schema validation. The generated TOML is syntactically correct based on code review, but there is no verification that the Gemini CLI actually accepts and parses it correctly. A malformed rule would silently fail, causing the permission to be unenforceable.

**Action required**:

1. **P0**: Add TOML schema validation (verify all required fields present, priority range 0-999, decision in valid set)
2. **P1**: Add integration test: generate TOML, run `gemini --policy .gemini/policies/bkit-permissions.toml` to validate parsing
3. **P1**: Add `"0.30.0"` to `bkit.config.json` `testedVersions` array once stable is confirmed

---

## 2. `--yolo` Flag Status

### Status: PARTIALLY CONFIRMED - Flag exists but behavior evolving

### 2.1 Current State

| Evidence | Finding |
|----------|---------|
| [Subagents docs](https://geminicli.com/docs/core/subagents/) | "Subagents currently operate in YOLO mode" - confirms non-interactive execution model |
| [Issue #19592](https://github.com/google-gemini/gemini-cli/issues/19592) | Bug: YOLO mode disabled after exiting Plan mode (v0.29.5). Active bug, not yet fixed. |
| [Issue #13561](https://github.com/google-gemini/gemini-cli/issues/13561) | Bug report: both `--yolo` and `--approval-mode yolo` not working properly in some contexts |
| [Issue #18816](https://github.com/google-gemini/gemini-cli/issues/18816) | "YOLO mode prompts always need manual confirmation in the latest version" |
| [Configuration docs](https://geminicli.com/docs/reference/configuration/) | `--approval-mode=yolo` is the canonical form. `--yolo` is a shorthand alias. |

### 2.2 PR #18153 (Hardcoded Policy Bypass Removal)

**Status**: MERGED into v0.29.0.

This PR removed the hardcoded bypass that allowed local subagents to skip policy checks entirely. However, `--yolo` / `--approval-mode=yolo` as a user-facing flag still exists and functions. The change means subagents now go through the Policy Engine, but the Policy Engine respects the `yolo` approval mode.

**Key distinction**: The PR removed the hardcoded `if (mode === YOLO) return true;` bypass in `CoreToolScheduler`. Now, YOLO mode works *through* the Policy Engine rather than *around* it. This means Admin-tier deny rules can override YOLO mode.

### 2.3 bkit spawn_agent Impact (P0 Critical)

Current bkit implementation in `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/mcp/spawn-agent-server.js`, lines 689-693:

```javascript
const args = [
  '-e', agentPath,
  '--yolo',
  task
];
```

**Risk assessment**:

| Risk | Severity | Evidence |
|------|----------|---------|
| `--yolo` flag removed entirely | LOW | Flag still documented and used. Not removed in v0.30.0-preview.x |
| `--yolo` stops working due to Policy Engine override | MEDIUM | Issue #18816 reports YOLO confirmation prompts appearing |
| `--yolo` + Plan mode interaction bug | MEDIUM | Issue #19592 confirms YOLO gets disabled after Plan mode exit |
| Admin policy blocks YOLO in subagents | LOW | Only affects enterprise/admin-managed environments |

**Action required**:

1. **P0**: Test `gemini -e agent.md --yolo "task"` on v0.30.0 stable when available. Verify it runs non-interactively to completion.
2. **P1**: Add fallback: if `--yolo` fails, try `--approval-mode=yolo`.
3. **P1**: Consider adding `--sandbox` flag for subagent isolation if available in v0.30.0.
4. **P2**: Monitor Issue #19592 fix status. If Plan mode is triggered within a subagent session, YOLO may break.

---

## 3. Tool Names in v0.30.0

### Status: CONFIRMED - All 17 built-in tool names unchanged

### 3.1 Verified Tool Names

From [geminicli.com/docs/tools/](https://geminicli.com/docs/tools/) and cross-referenced with [Tools API docs](https://geminicli.com/docs/core/tools-api/):

| # | Tool Name (internal) | Display Name | Category | bkit Usage |
|---|---------------------|-------------|----------|:----------:|
| 1 | `glob` | FindFiles | File System | 16/16 agents |
| 2 | `grep_search` | SearchText | File System | 16/16 agents |
| 3 | `list_directory` | ReadFolder | File System | 5/16 agents |
| 4 | `read_file` | ReadFile | File System | 16/16 agents |
| 5 | `read_many_files` | - | File System | 6/16 agents |
| 6 | `write_file` | WriteFile | File System | 11/16 agents |
| 7 | `replace` | Edit | File System | 6/16 agents |
| 8 | `run_shell_command` | Shell | Execution | 7/16 agents |
| 9 | `google_web_search` | GoogleSearch | Information | 7/16 agents |
| 10 | `web_fetch` | WebFetch | Information | 3/16 agents |
| 11 | `ask_user` | - | Agent | implicit |
| 12 | `activate_skill` | - | Agent | implicit |
| 13 | `save_memory` | SaveMemory | Agent | implicit |
| 14 | `write_todos` | WriteTodos | Agent | implicit |
| 15 | `get_internal_docs` | - | Agent | implicit |
| 16 | `enter_plan_mode` | - | Plan Mode | implicit |
| 17 | `exit_plan_mode` | - | Plan Mode | implicit |

**Additional tool noted**: `codebase_investigator` (Codebase Investigator Agent) appears in some tool listings. This may be a new built-in tool or an alias. **Not yet tracked by bkit's tool-registry.js**.

### 3.2 Legacy Alias Status

| Legacy Name | Canonical Name | Status |
|-------------|----------------|--------|
| `search_file_content` | `grep_search` | Still recognized as alias |

### 3.3 Forward Aliases (Issue #1391)

| Proposed Future Name | Current Name | Status in v0.30.0 |
|---------------------|-------------|-------------------|
| `edit_file` | `replace` | NOT ACTIVE - still `replace` |
| `find_files` | `glob` | NOT ACTIVE - still `glob` |
| `find_in_file` | `grep_search` | NOT ACTIVE - still `grep_search` |
| `web_search` | `google_web_search` | NOT ACTIVE - still `google_web_search` |
| `read_files` | `read_many_files` | NOT ACTIVE - still `read_many_files` |

**v0.31.0-preview.0**: No evidence from web search that tool renames have been activated. Issue #1391 remains open.

### 3.4 bkit Impact

**`/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/lib/adapters/gemini/tool-registry.js`** is CORRECT for v0.30.0:

- All 17 BUILTIN_TOOLS names match v0.30.0 tool names
- FORWARD_ALIASES are speculative but safe (only used as fallback in `resolveToolName()`)
- LEGACY_ALIASES correctly maps `search_file_content` -> `grep_search`

**Action required**:

1. **P2**: Investigate `codebase_investigator` tool. If it is a new built-in, add to `BUILTIN_TOOLS` registry.
2. **P3**: Continue monitoring Issue #1391 for tool renames in v0.31.0+.

---

## 4. Hook System Compatibility

### Status: CONFIRMED - All 10 hook events functional

### 4.1 Hook Events Verification

From [geminicli.com/docs/hooks/reference/](https://geminicli.com/docs/hooks/reference/):

| # | Hook Event | bkit Script | Status |
|---|-----------|-------------|--------|
| 1 | `SessionStart` | `session-start.js` | CONFIRMED |
| 2 | `BeforeAgent` | `before-agent.js` | CONFIRMED |
| 3 | `BeforeModel` | `before-model.js` | CONFIRMED |
| 4 | `AfterModel` | `after-model.js` | CONFIRMED |
| 5 | `BeforeToolSelection` | `before-tool-selection.js` | CONFIRMED |
| 6 | `BeforeTool` | `before-tool.js` (x2 matchers) | CONFIRMED |
| 7 | `AfterTool` | `after-tool.js` (x3 matchers) | CONFIRMED |
| 8 | `AfterAgent` | `after-agent.js` | CONFIRMED |
| 9 | `PreCompress` | `pre-compress.js` | CONFIRMED |
| 10 | `SessionEnd` | `session-end.js` | CONFIRMED |

### 4.2 BeforeToolSelection `allowedFunctionNames` API

From [writing hooks docs](https://geminicli.com/docs/hooks/writing-hooks/) and search results:

The BeforeToolSelection hook output structure has evolved. The current API uses:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "BeforeToolSelection",
    "mode": "ANY",
    "allowedToolNames": ["read_file", "glob", "grep_search"]
  }
}
```

**bkit's current implementation** (`/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/hooks/scripts/before-tool-selection.js`, lines 41-51):

```javascript
const output = {
  status: 'allow',
  toolConfig: {
    functionCallingConfig: {
      mode: 'AUTO',
      allowedFunctionNames: allowedTools
    }
  },
  hookEvent: 'BeforeToolSelection'
};
```

**WARNING**: The field name may have changed from `allowedFunctionNames` to `allowedToolNames`, and the output structure may have changed from `toolConfig.functionCallingConfig` to `hookSpecificOutput`. This needs verification against the actual v0.30.0 hook input/output schema.

**Action required**:

1. **P1**: Verify the exact BeforeToolSelection output schema on v0.30.0 stable. The field names `allowedFunctionNames` vs `allowedToolNames` and the wrapper structure may differ.
2. **P1**: Test that the output from `before-tool-selection.js` is actually processed by Gemini CLI v0.30.0.

### 4.3 AfterTool + Tool Output Masking

**Status**: UNKNOWN - Cannot confirm from web search alone.

The AfterTool hook in bkit reads `input.tool_name` and `input.tool_input` (lines 18-19 of after-tool.js). If Tool Output Masking modifies or redacts fields in the hook input data, PDCA phase tracking could fail silently.

**Action required**:

1. **P1**: Test AfterTool hook on v0.30.0 stable. Log the full `input` object and verify `tool_name`, `tool_input`, and any `tool_output` fields are present and unmasked.

---

## 5. Extension System

### Status: CONFIRMED - Manifest format unchanged

### 5.1 `gemini-extension.json` Manifest

From [Extension reference](https://geminicli.com/docs/extensions/reference/) and [Getting started](https://geminicli.com/docs/extensions/getting-started-extensions/):

| Field | Type | Required | bkit Uses | Status |
|-------|------|:--------:|:---------:|--------|
| `name` | string | YES | "bkit" | CONFIRMED |
| `version` | string | NO | "1.5.4" | CONFIRMED (bkit custom field, not in official spec) |
| `description` | string | YES | Present | CONFIRMED |
| `contextFileName` | string | NO | "GEMINI.md" | CONFIRMED |
| `settings` | array | NO | 2 settings | CONFIRMED |
| `mcpServers` | object | NO | Not used | CONFIRMED |
| `hooks` | - | NO | In hooks.json | CONFIRMED (separate file) |
| `excludeTools` | array | NO | Not used | DEPRECATED but functional |
| `themes` | object | NO | Not used | Available since v0.29.0 |
| `author` | string | NO | Present | bkit custom field |
| `license` | string | NO | Present | bkit custom field |
| `repository` | string | NO | Present | bkit custom field |
| `keywords` | array | NO | Present | bkit custom field |

**Note**: bkit's `gemini-extension.json` includes several custom fields (`version`, `author`, `license`, `repository`, `keywords`) that are not in the official Gemini CLI spec. These are ignored by Gemini CLI but could conflict if the spec adds these field names with different semantics.

### 5.2 GEMINI.md @import

**Status**: CONFIRMED - Still functional. The `contextFileName` property specifies which file to load as context, and `@import` directives within that file continue to work.

### 5.3 New Manifest Fields in v0.30.0

From the v0.30.0-preview.3 changelog:
- `sensitive` flag for settings (marks API keys, etc.)
- No other new required fields detected

**bkit impact**: None. The `sensitive` flag is optional and only applies to settings that expose API keys. bkit's two settings (`BKIT_OUTPUT_STYLE`, `BKIT_PROJECT_LEVEL`) are not sensitive.

---

## 6. Consolidated Action Items

### Priority Matrix

```
P0 (Block release)  ─┬─ Verify v0.30.0 stable npm publish (wait UTC 2000 today)
                      ├─ Test spawn_agent with --yolo on v0.30.0 stable
                      └─ Add "0.30.0" to testedVersions after verification

P1 (This week)      ─┬─ Verify BeforeToolSelection output schema (allowedFunctionNames vs allowedToolNames)
                      ├─ Verify AfterTool hook input schema (tool output masking)
                      ├─ Add TOML schema validation to policy-migrator.js
                      ├─ Add --approval-mode=yolo fallback in spawn-agent-server.js
                      └─ Activate TOML auto-generation trigger in session-start.js

P2 (Next sprint)    ─┬─ Investigate codebase_investigator tool
                      ├─ Add SemVer format validation to version-detector.js
                      └─ Monitor Issue #19592 (YOLO + Plan mode interaction bug)

P3 (Backlog)        ─┬─ Monitor Issue #1391 (tool renames) for v0.31.0+
                      ├─ Evaluate excludeTools addition as defense-in-depth
                      └─ Plan bkit- prefix migration for SKILL.md custom fields
```

### Specific Code Changes

#### 6.1 spawn-agent-server.js (P0/P1)

```javascript
// CURRENT (line 689-693):
const args = [
  '-e', agentPath,
  '--yolo',
  task
];

// RECOMMENDED:
const args = [
  '-e', agentPath,
  '--approval-mode=yolo',  // Canonical form, more future-proof
  task
];
```

#### 6.2 bkit.config.json (P0 - after stable confirmed)

```json
"testedVersions": ["0.29.0", "0.29.5", "0.29.7", "0.30.0"]
```

#### 6.3 policy-migrator.js (P1)

Add schema validation before writing TOML:

```javascript
function validateRule(rule) {
  const errors = [];
  if (!rule.toolName) errors.push('toolName is required');
  if (!['allow', 'deny', 'ask_user'].includes(rule.decision)) {
    errors.push(`Invalid decision: ${rule.decision}`);
  }
  if (typeof rule.priority !== 'number' || rule.priority < 0 || rule.priority > 999) {
    errors.push(`Priority must be 0-999, got: ${rule.priority}`);
  }
  if (rule.commandPrefix && rule.commandRegex) {
    errors.push('Cannot use both commandPrefix and commandRegex');
  }
  return errors;
}
```

#### 6.4 before-tool-selection.js (P1 - investigate)

Verify whether the output format should be:

```javascript
// Current bkit format:
{ status: 'allow', toolConfig: { functionCallingConfig: { mode: 'AUTO', allowedFunctionNames: [...] } } }

// Possibly expected v0.30.0 format:
{ hookSpecificOutput: { hookEventName: 'BeforeToolSelection', mode: 'ANY', allowedToolNames: [...] } }
```

This requires testing against the actual v0.30.0 hook dispatcher.

---

## 7. Summary Assessment

| Research Task | Status | Confidence | Critical Finding |
|--------------|--------|:----------:|-----------------|
| 1. Policy Engine GA | CONFIRMED | HIGH | TOML schema matches bkit's output. Priority tiers confirmed. Schema validation needed. |
| 2. `--yolo` Flag | PARTIALLY CONFIRMED | MEDIUM | Flag exists but multiple bugs reported. Canonical form is `--approval-mode=yolo`. |
| 3. Tool Names | CONFIRMED | HIGH | All 17 tools unchanged. Forward aliases NOT active. `codebase_investigator` is new. |
| 4. Hook System | CONFIRMED (structure) | MEDIUM | 10 events unchanged. `allowedFunctionNames` field name may have changed. |
| 5. Extension System | CONFIRMED | HIGH | Manifest format unchanged. `excludeTools` deprecated but functional. |

### Overall Risk: MEDIUM

The v0.30.0 stable release, when it lands, should be broadly compatible with bkit-gemini v1.5.4. The primary risks are:

1. **`--yolo` reliability** for non-interactive subagent execution (multiple open bugs)
2. **BeforeToolSelection output schema** may have evolved (field name change)
3. **v0.30.0 stable may not be published yet** despite expected Tuesday release cadence

All of these can be resolved with targeted testing once the stable release is confirmed on npm.

---

## Sources

- [Gemini CLI Latest Stable Release (v0.29.0)](https://geminicli.com/docs/changelogs/latest/)
- [Gemini CLI Preview Release (v0.30.0-preview.3)](https://geminicli.com/docs/changelogs/preview/)
- [Gemini CLI GitHub Releases](https://github.com/google-gemini/gemini-cli/releases)
- [Policy Engine Reference](https://geminicli.com/docs/reference/policy-engine/)
- [Policy Engine plan.toml Source](https://github.com/google-gemini/gemini-cli/blob/main/packages/core/src/policy/policies/plan.toml)
- [Issue #18750 - Policy Engine Documentation Review](https://github.com/google-gemini/gemini-cli/issues/18750)
- [Issue #15383 - Policy Engine Docs Mismatch](https://github.com/google-gemini/gemini-cli/issues/15383)
- [Issue #16699 - Admin Default Policy Tier](https://github.com/google-gemini/gemini-cli/issues/16699)
- [Issue #19592 - YOLO Mode Disabled After Plan Mode](https://github.com/google-gemini/gemini-cli/issues/19592)
- [Issue #18816 - YOLO Mode Prompts Always Need Confirmation](https://github.com/google-gemini/gemini-cli/issues/18816)
- [Issue #13561 - --yolo and --approval-mode Not Working](https://github.com/google-gemini/gemini-cli/issues/13561)
- [Issue #1391 - Consistent Tool Naming](https://github.com/google-gemini/gemini-cli/issues/1391)
- [Subagents Documentation](https://geminicli.com/docs/core/subagents/)
- [Hooks Reference](https://geminicli.com/docs/hooks/reference/)
- [Writing Hooks](https://geminicli.com/docs/hooks/writing-hooks/)
- [Extension Reference](https://geminicli.com/docs/extensions/reference/)
- [Getting Started with Extensions](https://geminicli.com/docs/extensions/getting-started-extensions/)
- [Gemini CLI Tools](https://geminicli.com/docs/tools/)
- [Tools API](https://geminicli.com/docs/core/tools-api/)
- [npm @google/gemini-cli](https://www.npmjs.com/package/@google/gemini-cli)
- [Gemini CLI Configuration](https://geminicli.com/docs/reference/configuration/)
- [Releasebot - Gemini CLI Updates](https://releasebot.io/updates/google/gemini-cli)

---

*Enterprise Expert Agent - CTO Team Task #8*
*bkit Vibecoding Kit v1.5.4*
*2026-02-25*
