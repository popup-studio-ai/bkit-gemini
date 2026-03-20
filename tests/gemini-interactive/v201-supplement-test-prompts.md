# Interactive Test Prompts: bkit-gemini v2.0.1 Supplement

> **Feature**: bkit-gemini-v200-refactoring-supplement
> **Goal**: Interactive verification of v2.0.1 supplement changes (Policy Engine restore, context fork fix, token optimization)
> **Environment**: Gemini CLI v0.34.0 recommended

---

## 1. Session Start Verification

### [SUP-01] Version Check
**Prompt**:
```
What version of bkit is loaded in this session?
```
**Expected**:
- Response mentions "2.0.0" (not "1.5.9").
- Version string comes from `lib/core/platform.js` exports.

**Pass**: Version is 2.0.0 or higher.
**Fail**: Version shows 1.5.9 or is missing.

### [SUP-02] Feature Flags Report
**Prompt**:
```
Show me the Gemini CLI feature flags available
```
**Expected**:
- Response includes all of the following flags:
  - `hasPolicyEngine`
  - `hasProjectLevelPolicy`
  - `hasExtensionPolicies`
  - `hasTaskTracker`
  - `hasRuntimeHookFunctions`

**Pass**: All 5 flags are listed and reported as detected.
**Fail**: Any of the 5 flags are missing from the report.

---

## 2. Policy Engine Verification

### [SUP-03] Policy TOML Generation
**Prompt**:
```
Check if policy TOML files exist in .gemini/policies/
```
**Expected**:
- `bkit-permissions.toml` and/or `bkit-starter-policy.toml` exist.
- Policy Engine now works because `hasPolicyEngine` flag is restored.
- TOML files contain valid `[policy_rule.*]` sections.

**Pass**: At least one TOML file exists with valid policy rules.
**Fail**: No TOML files found, or Policy Engine reports as disabled.

### [SUP-04] Agent Security Tiers
**Prompt**:
```
Show me the agent security tiers in this project
```
**Expected**:
- 3 tiers displayed:
  - `readonly`: 8 agents
  - `docwrite`: 6 agents
  - `full`: 3 agents

**Pass**: All 3 tiers shown with correct agent counts.
**Fail**: Tier count mismatch or tiers not displayed.

### [SUP-05] Full Tier Agents
**Prompt**:
```
Which agents have full access in the policy system?
```
**Expected**:
- `pdca-iterator`
- `cto-lead`
- `pm-lead`

**Pass**: Exactly these 3 agents listed with full access.
**Fail**: Missing agents or incorrect agents in full tier.

---

## 3. Context Fork Verification

### [SUP-06] PDCA Status Loading
**Prompt**:
```
Read .pdca-status.json and show the current PDCA status
```
**Expected**:
- Shows actual PDCA status with `activeFeatures` array.
- Data is not empty `{}`.
- File is read from project root (not from `docs/` path).

**Pass**: PDCA status displays with real feature data.
**Fail**: Empty object `{}` or file not found error.

### [SUP-07] Context Fork Test
**Prompt**:
```
Run a context fork for gap-detector agent and show the snapshot
```
**Expected**:
- Fork snapshot contains actual PDCA status data.
- Snapshot does NOT contain empty `{}` from legacy `docs/` path.
- Context fork reads from correct `.pdca-status.json` location.

**Pass**: Fork snapshot includes populated PDCA data.
**Fail**: Fork snapshot has empty or missing PDCA data.

---

## 4. Tool Security Verification

### [SUP-08] ReadOnly Tools
**Prompt**:
```
List all read-only tools available to readonly agents
```
**Expected**:
- List does NOT include any of the following:
  - `activate_skill`
  - `write_todos`
  - `save_memory`
- List only contains tools with `readOnlyHint: true`.

**Pass**: None of the excluded tools appear in the readonly list.
**Fail**: Any excluded tool appears in the readonly tool list.

### [SUP-09] ReadOnly Consistency
**Prompt**:
```
Verify that all tools in getReadOnlyTools() have readOnlyHint: true in TOOL_ANNOTATIONS
```
**Expected**:
- All tools returned by `getReadOnlyTools()` have `readOnlyHint: true` in `TOOL_ANNOTATIONS`.
- No contradiction between the two sources.

**Pass**: 100% consistency between `getReadOnlyTools()` and `TOOL_ANNOTATIONS`.
**Fail**: Any tool has mismatched annotation.

---

## 5. Token Optimization

### [SUP-10] Phase-Aware Context
**Prompt**:
```
Show me what context files are loaded for the 'do' phase
```
**Expected**:
- Includes `tool-reference-v2.md` (NOT `tool-reference.md`).
- Includes `skill-triggers.md`.
- Includes `feature-report.md`.

**Pass**: `tool-reference-v2.md` is loaded; `tool-reference.md` is NOT loaded.
**Fail**: Old `tool-reference.md` is loaded instead of v2.

### [SUP-11] Duplicate Section Check
**Prompt**:
```
Check if session-start generates duplicate agent trigger or feature report sections
```
**Expected**:
- No duplicate sections in session-start output.
- `buildAgentTriggersSection`, `buildFeatureReportSection`, `buildAutoTriggerSection` are no longer called in `generateDynamicContext`.

**Pass**: No duplicated sections in generated context.
**Fail**: Agent triggers or feature report appear more than once.

---

## 6. File Existence Verification

### [SUP-12] Old tool-reference.md Removed
**Prompt**:
```
Check if .gemini/context/tool-reference.md exists
```
**Expected**:
- File does NOT exist (deleted in FR-09).
- Only `tool-reference-v2.md` should exist.

**Pass**: `tool-reference.md` does not exist; `tool-reference-v2.md` exists.
**Fail**: Old `tool-reference.md` still exists.

### [SUP-13] Agent Memory Policy
**Prompt**:
```
Show the agent memory access control policy
```
**Expected**:
- Displays content from `.gemini/context/agent-memory-policy.md`.
- Contains 3-tier access table (readonly, docwrite, full).

**Pass**: Policy content displayed with 3-tier access table.
**Fail**: File not found or missing tier table.

### [SUP-14] Deprecated BKIT_PROJECT_DIR
**Prompt**:
```
Check if BKIT_PROJECT_DIR is deprecated in lib/core/platform.js
```
**Expected**:
- Shows `@deprecated` JSDoc tag on `BKIT_PROJECT_DIR`.
- Export still exists for backward compatibility but is marked deprecated.

**Pass**: `@deprecated` tag present on `BKIT_PROJECT_DIR`.
**Fail**: No deprecation annotation found.

---

## 7. Regression Check

### [SUP-15] PDCA Workflow Still Works
**Prompt**:
```
/pdca status
```
**Expected**:
- Shows current PDCA status normally.
- No errors or exceptions.
- Active features are displayed correctly.

**Pass**: PDCA status displayed without errors.
**Fail**: Error thrown or empty/broken output.

### [SUP-16] Skill System Still Works
**Prompt**:
```
/pdca plan test-feature
```
**Expected**:
- Plan skill activates correctly.
- Policy Engine generates TOML without errors.
- Plan document is created in `docs/01-plan/features/`.

**Pass**: Plan created successfully with no Policy Engine errors.
**Fail**: Skill fails to activate or TOML generation error occurs.

---

## Test Summary

| Section | Tests | IDs |
|---------|-------|-----|
| Session Start | 2 | SUP-01, SUP-02 |
| Policy Engine | 3 | SUP-03, SUP-04, SUP-05 |
| Context Fork | 2 | SUP-06, SUP-07 |
| Tool Security | 2 | SUP-08, SUP-09 |
| Token Optimization | 2 | SUP-10, SUP-11 |
| File Existence | 3 | SUP-12, SUP-13, SUP-14 |
| Regression Check | 2 | SUP-15, SUP-16 |
| **Total** | **16** | |

---

*Generated for v2.0.1 Supplement Testing*
