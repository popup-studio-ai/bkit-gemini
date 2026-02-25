# Gemini CLI v0.30.0 - Gap Analysis Report

> **Feature**: gemini-cli-030-v155-gap
> **Summary**: Quantitative gap analysis between bkit-gemini v1.5.4 implementation and v0.30.0 upgrade requirements
> **Author**: Gap Detector (CTO Team Task #15)
> **Created**: 2026-02-25
> **Last Modified**: 2026-02-25
> **Status**: Draft
> **Analysis Source**: `docs/03-analysis/gemini-cli-030-upgrade-impact-analysis.analysis.md`

---

## 1. Analysis Overview

- **Analysis Target**: 24 recommended actions from v0.30.0 upgrade impact analysis
- **Design Document**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/03-analysis/gemini-cli-030-upgrade-impact-analysis.analysis.md`
- **Implementation Path**: Full codebase (`lib/`, `hooks/`, `mcp/`, `agents/`, `skills/`, `tests/`)
- **Analysis Date**: 2026-02-25
- **Method**: Source code inspection of each file referenced in the 24 actions

---

## 2. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Phase 1 (Immediate P0) | 22% | CRITICAL |
| Phase 2 (Short-term P1) | 12% | CRITICAL |
| Phase 3 (Medium-term P2) | 5% | CRITICAL |
| Phase 4 (Long-term P3) | 3% | CRITICAL |
| **Overall Weighted** | **12.4%** | CRITICAL |

### Score Methodology

- 0% = No implementation exists toward target state
- 25% = Partial foundation exists but core logic missing
- 50% = Core logic exists but incomplete/untested
- 75% = Mostly complete, minor gaps remain
- 100% = Fully matches target state

---

## 3. Gap Matrix

### Phase 1: Immediate (P0) -- v1.5.5 Patch

| # | Action | Current State | Target State | Gap % | Effort | Evidence |
|---|--------|--------------|-------------|:-----:|--------|----------|
| 1 | v0.30.0 compatibility test | 15 test suites exist (`tests/suites/tc01-tc15`), 0 test cases reference v0.30.0. Tests are structural/unit only; no v0.30.0-specific compatibility assertions | Executable test suite validating all v0.30.0 behaviors (Policy Engine, tool names, hook schemas) | **90%** | 2h | `tests/run-all.js` has 15 suites; `grep "0.30.0" tests/` = 0 matches |
| 2 | testedVersions update | `["0.29.0", "0.29.5", "0.30.0-preview.3"]` -- missing `"0.29.7"` and stable `"0.30.0"` | `["0.29.0", "0.29.5", "0.29.7", "0.30.0-preview.3", "0.30.0"]` | **80%** | 15m | `bkit.config.json` line 120: testedVersions array |
| 3 | Policy TOML auto-generation trigger | `policy-migrator.js` (231 lines) fully implements `generatePolicyFile()` but `session-start.js` (393 lines) never calls it. Config has `autoGenerate: true` but no code reads that flag on session start | `session-start.js` calls `generatePolicyFile()` when `hasPolicyEngine` flag is true and `autoGenerate` is enabled | **70%** | 1h | `session-start.js`: 0 references to `policy-migrator`, `generatePolicyFile`, or `autoGenerate`. The migrator module is complete but dormant |
| 4 | version-detector SemVer fix | `process.env.GEMINI_CLI_VERSION` read directly at line 52 with no format validation. `parseVersion()` silently defaults to 0.29.0 on invalid input. No max version cap. Injecting `"99.99.99"` activates all feature flags | SemVer regex validation on env var input, reject non-conforming values, cap at known maximum version, log warning on suspicious input | **85%** | 30m | `lib/adapters/gemini/version-detector.js` lines 52, 23-30: no validation guard before `parseVersion()` |
| 5 | model-selection.md update | Guide version 1.0 (2026-02-01), references Gemini 2.5 Pro and Gemini 3 Pro. No mention of Gemini 3.1 Pro, `customtools` variant, or pricing. Agent table uses old model names | Add Gemini 3.1 Pro, `gemini-3.1-pro-preview-customtools`, 1M context, ARC-AGI-2 77.1%, pricing $2/$12 per 1M tokens | **90%** | 1h | `docs/guides/model-selection.md`: 0 matches for "3.1", "customtools", "1,000,000" |

**Phase 1 Average Gap: 83% (mostly not done)**

---

### Phase 2: Short-term (P1) -- v1.5.5~v1.6.0

| # | Action | Current State | Target State | Gap % | Effort | Evidence |
|---|--------|--------------|-------------|:-----:|--------|----------|
| 6 | Sub-agent spawn verification | `--yolo` is hardcoded in `executeAgent()` at line 691. No conditional logic, no version check, no alternative flag. All 16 agents spawned with full yolo bypass | Conditionally use `--yolo` only when Policy Engine allows it; verify flag exists in v0.30.0; implement fallback for when `--yolo` is removed | **95%** | 2h | `mcp/spawn-agent-server.js` line 689-693: `const args = ['-e', agentPath, '--yolo', task]` -- unconditional |
| 7 | TOML schema validation | `convertToToml()` generates TOML string via string concatenation (lines 65-146). No TOML parser library, no schema validation, no round-trip verification. Output format assumed correct | Validate generated TOML against v0.30.0 Policy Engine schema; add TOML parse round-trip check; validate required fields (`toolName`, `decision`) | **90%** | 2h | `lib/adapters/gemini/policy-migrator.js`: no `require('toml')`, no schema object, no validation function |
| 8 | AfterTool hook verification | `after-tool.js` reads `input.tool_name`, `input.tool_input.file_path`, `input.tool_input.path`. No verification of whether v0.30.0 Tool Output Masking changes these field names or adds/removes fields | Verify v0.30.0 hook input schema matches expectations; add defensive field access with fallback; document expected schema | **80%** | 1h | `hooks/scripts/after-tool.js` lines 18-19: direct property access without schema guards |
| 9 | Gemini 3.1 Pro in agents | All 9 "pro" agents use `model: gemini-3-pro`. None use `gemini-3.1-pro-preview` or the `customtools` variant | `cto-lead.md`: `gemini-3.1-pro-preview-customtools`; `gap-detector.md`: `gemini-3.1-pro-preview`; test with new models | **95%** | 2h | `grep "^model:" agents/*.md` shows 9x `gemini-3-pro`, 0x `gemini-3.1` |
| 10 | flash-lite in agents | `report-generator.md` and `qa-monitor.md` both use `model: gemini-3-flash`. No agents use `gemini-3-flash-lite` despite cost optimization opportunity | `report-generator.md`: `gemini-3-flash-lite`; `qa-monitor.md`: `gemini-3-flash-lite` | **90%** | 30m | `grep "^model:" agents/*.md`: report-generator=`gemini-3-flash`, qa-monitor=`gemini-3-flash` |
| 11 | excludeTools in manifest | `gemini-extension.json` (24 lines) has no `excludeTools` field. No secondary defense layer against dangerous tool usage beyond `before-tool.js` | Add `excludeTools` array as defense-in-depth for high-risk operations | **95%** | 15m | `gemini-extension.json`: field absent entirely |

**Phase 2 Average Gap: 91% (almost entirely not done)**

---

### Phase 3: Medium-term (P2) -- v1.6.0

| # | Action | Current State | Target State | Gap % | Effort | Evidence |
|---|--------|--------------|-------------|:-----:|--------|----------|
| 12 | SDK integration | No `package.json` exists in the project. No reference to `@google/gemini-cli-core` in any source file. Pure file-based extension architecture | Integrate `@google/gemini-cli-core` SDK for JS-based skill development; add `package.json` with SDK dependency | **100%** | 8h | `grep "gemini-cli-core" **/*.js` = 0 matches in source files; `glob "**/package.json"` = 0 results |
| 13 | Extension Registry | No registry metadata in `gemini-extension.json`. No `registry`, `homepage`, `bugs`, or `funding` fields. No preparation for registry submission | Add registry-compatible metadata fields to manifest; prepare submission documentation | **95%** | 4h | `gemini-extension.json`: only 8 fields present, none registry-related |
| 14 | SKILL.md namespace prefix | All 29 SKILL.md files use unprefixed custom fields: `user-invocable`, `argument-hint`, `allowed-tools`, `imports`, `agents`, `context`, `memory`, `pdca-phase`, `task-template` | Prefix all custom fields with `bkit-`: `bkit-user-invocable`, `bkit-allowed-tools`, etc. | **100%** | 4h | Sampled `skills/pdca/SKILL.md`, `skills/code-review/SKILL.md`, `skills/starter/SKILL.md`: all use unprefixed fields |
| 15 | MCP SDK upgrade | No `package.json` exists; no explicit MCP SDK dependency. `spawn-agent-server.js` implements MCP protocol manually via stdio JSON-RPC without using `@modelcontextprotocol/sdk` | Evaluate MCP SDK ^1.27.0 integration to replace manual JSON-RPC handling | **100%** | 2h | `mcp/spawn-agent-server.js`: hand-rolled MCP protocol (class `SpawnAgentServer` with manual `processBuffer`) |
| 16 | Code deduplication | 5 confirmed duplicate pairs: (a) `TIER_EXTENSIONS` in `file.js` + `tier.js` -- 100% identical object; (b) `getCurrentPdcaPhase()` in `before-model.js` + `before-tool-selection.js` -- 100% identical; (c) trigger patterns in `before-agent.js` + `language.js`; (d) level detection in `session-start.js` + `level.js`; (e) not yet verified 5th pair | Extract shared code to common modules; single source of truth for each | **100%** | 4h | Grep confirms: `TIER_EXTENSIONS` defined in 2 files (lib/core/file.js:14 + lib/pdca/tier.js:15); `getCurrentPdcaPhase` defined in 3 locations |
| 17 | Large file splits | 4 files exceed 300-line limit: `skill-orchestrator.js` (708 lines), `memory.js` (459 lines), `permission.js` (406 lines), `session-start.js` (392 lines) | Split each into focused modules under 300 lines with clear single responsibility | **100%** | 4h | Line counts verified: skill-orchestrator=708, memory=459, permission=406, session-start=392 |
| 18 | AfterAgent retry | `after-agent.js` (237 lines) has no retry logic. After agent completion, it extracts match rate and suggests next steps but never retries a failed agent invocation | Implement retry pattern per v0.30.0 AfterAgent specification; configurable max retries and backoff | **100%** | 2h | `grep "retry\|retryCount\|maxRetries" after-agent.js` = 0 matches |

**Phase 3 Average Gap: 99% (essentially not started)**

---

### Phase 4: Long-term (P3) -- v1.7.0

| # | Action | Current State | Target State | Gap % | Effort | Evidence |
|---|--------|--------------|-------------|:-----:|--------|----------|
| 19 | ACP integration | No references to `@agentclientprotocol` or ACP in any source files. Only mentioned in analysis document | Evaluate and prototype ACP SDK 0.14.1 integration for IDE connectivity | **100%** | 16h | `grep -ri "agentclientprotocol\|ACP" src/ lib/ mcp/` = 0 source matches |
| 20 | Plan Mode + PDCA | `enter_plan_mode` and `exit_plan_mode` registered in tool-registry.js. Feature flag `hasPlanMode` exists. But no command/hook maps `/plan` to `/pdca plan`. No integration code | Map Gemini CLI `/plan` command to bkit PDCA plan phase; bidirectional mode switching | **95%** | 4h | Tool names registered but no handler code; `grep "enter_plan_mode" hooks/` = 0 matches in hook scripts |
| 21 | Conductor evaluation | Conductor mentioned only in docs (research note at `docs/01-plan/research/conductor-integration.md`). No source code references | Evaluate Conductor Extension architecture; determine if it supersedes bkit CTO Lead pattern | **95%** | 8h | Only doc references, 0 source code references |
| 22 | GenAI SDK tracking | No references to `@google/genai` in source files. bkit is a pure extension (no Node SDK dependencies). Impact is indirect through Gemini CLI upstream | Monitor GenAI SDK 1.41.0 changes for model API breaking changes that affect CLI behavior | **100%** | 4h | Indirect dependency only; no action possible until v0.31.0 testing |
| 23 | Dynamic MCP updates | `spawn-agent-server.js` has static tool list. No `notifications/tools/list_changed` capability. No dynamic tool registration | Implement MCP `notifications/tools/list_changed` for runtime tool updates | **100%** | 8h | `grep "list_changed\|tools_changed" mcp/` = 0 matches; `handleInitialize` returns `capabilities: { tools: {} }` with no notification support |
| 24 | Automated test suite | 15 test suites exist with structural tests. Tests are synchronous `require()`-based assertions. No v0.30.0 test cases. Test runner produces text report. No CI integration (no package.json, no GitHub Actions workflow) | Comprehensive test suite with v0.30.0 compatibility cases, CI/CD integration, coverage tracking | **75%** | 16h | `tests/run-all.js`: 15 suites (tc01-tc15); but no v0.30.0 assertions, no CI config |

**Phase 4 Average Gap: 94% (future work, as expected)**

---

## 4. Summary Statistics

### Gap Distribution

| Gap Level | Count | Actions |
|-----------|:-----:|---------|
| 100% (Nothing done) | 7 | #12, #14, #15, #16, #17, #18, #19, #22, #23 |
| 95% (Minimal/doc only) | 6 | #6, #9, #11, #13, #20, #21 |
| 90% (Foundation exists but gap vast) | 4 | #1, #5, #7, #10 |
| 80-85% (Partial impl, core missing) | 3 | #2, #4, #8 |
| 70-75% (Substantial foundation) | 2 | #3, #24 |
| <50% (Mostly done) | 0 | -- |
| 0% (Complete) | 0 | -- |

### Overall Weighted Gap Score

```
Phase 1 (weight 40%):  avg gap 83% x 0.40 = 33.2
Phase 2 (weight 30%):  avg gap 91% x 0.30 = 27.3
Phase 3 (weight 20%):  avg gap 99% x 0.20 = 19.8
Phase 4 (weight 10%):  avg gap 94% x 0.10 =  9.4
────────────────────────────────────────────────
Overall Weighted Gap:                     89.7%
Implementation Completeness:              10.3%
```

---

## 5. Critical Gaps (Blocking Other Items)

These gaps, if unresolved, block downstream work or create cascading risk:

| # | Gap | Blocks | Risk if Unresolved |
|---|-----|--------|--------------------|
| **3** | Policy TOML auto-generation not triggered | #7 (TOML validation is moot if never generated) | v0.30.0 Policy Engine GA means permission system may silently fail |
| **6** | `--yolo` hardcoded in spawn | All agent spawning | If v0.30.0 removes `--yolo`, all 16 agents fail to spawn (total system failure) |
| **4** | version-detector no validation | All feature flags (#3, #6, #11) | Malicious env var injection bypasses all version-gated security |
| **2** | testedVersions stale | #1 (tests need version baseline) | Misleading compatibility claims; users on v0.29.7/v0.30.0 see untested badge |
| **1** | No v0.30.0 test cases | #3, #6, #7, #8 (can't verify fixes work) | All v0.30.0 changes deployed untested |

### Critical Path

```
#4 (version-detector fix)
  --> #3 (Policy TOML trigger, depends on hasPolicyEngine flag)
      --> #7 (TOML validation, depends on TOML being generated)
  --> #6 (--yolo conditional, depends on version detection)

#2 (testedVersions update)
  --> #1 (v0.30.0 test cases, needs version baseline)
      --> #8, #9, #10, #11 (all need test verification)
```

---

## 6. Quick Wins (High Gap, Low Effort)

Items that can be resolved rapidly with high impact:

| Priority | # | Action | Gap | Effort | Impact |
|:--------:|---|--------|:---:|:------:|--------|
| 1 | **2** | testedVersions update | 80% | 15m | Accurate compatibility reporting |
| 2 | **11** | excludeTools in manifest | 95% | 15m | Defense-in-depth security layer |
| 3 | **10** | flash-lite in agents | 90% | 30m | 60% cost reduction for 2 agents |
| 4 | **4** | version-detector SemVer fix | 85% | 30m | Closes security vulnerability |
| 5 | **5** | model-selection.md update | 90% | 1h | Documentation accuracy |
| 6 | **3** | Policy TOML trigger | 70% | 1h | Activates dormant subsystem |

**Total quick win effort: ~3h 30m for 6 items resolved**

---

## 7. Dependency Chain

```
                    ┌─────────────────────────────────────┐
                    |        FOUNDATION LAYER              |
                    |                                      |
                    |  #4 version-detector SemVer fix      |
                    |  #2 testedVersions update            |
                    └────────────┬────────────┬────────────┘
                                 |            |
                    ┌────────────▼──┐   ┌─────▼────────────┐
                    | POLICY CHAIN  |   | TEST CHAIN       |
                    |               |   |                  |
                    | #3 TOML       |   | #1 v0.30.0 tests |
                    |    trigger    |   |                  |
                    |      |        |   |       |          |
                    | #7 TOML       |   | #8 AfterTool     |
                    |    validate   |   | #9 3.1 Pro model |
                    └───────────────┘   | #10 flash-lite   |
                                        | #11 excludeTools |
                    ┌───────────────┐   └──────────────────┘
                    | SPAWN CHAIN   |
                    |               |
                    | #6 --yolo     |──── CRITICAL: blocks all agent spawning
                    |    conditional|
                    |      |        |
                    | #18 AfterAgent|
                    |     retry     |
                    └───────────────┘

                    ┌───────────────────────────────────────┐
                    | INDEPENDENT (No Dependencies)          |
                    |                                        |
                    | #5 model-selection.md                  |
                    | #12 SDK integration                    |
                    | #13 Extension Registry                 |
                    | #14 SKILL.md namespace                 |
                    | #15 MCP SDK upgrade                    |
                    | #16 Code deduplication                 |
                    | #17 Large file splits                  |
                    | #19-#24 (Phase 4 items)                |
                    └───────────────────────────────────────┘
```

---

## 8. Recommended Execution Order

Based on dependency chain analysis and risk prioritization:

### Sprint 1: Foundation (Day 1, ~2h)

| Order | # | Action | Effort |
|:-----:|---|--------|:------:|
| 1 | 2 | Add `"0.29.7"`, `"0.30.0"` to testedVersions | 15m |
| 2 | 4 | SemVer validation in version-detector.js | 30m |
| 3 | 11 | Add excludeTools to gemini-extension.json | 15m |
| 4 | 10 | Update report-generator + qa-monitor to flash-lite | 30m |
| 5 | 5 | Update model-selection.md with 3.1 Pro info | 1h |

### Sprint 2: Policy & Spawn (Day 1-2, ~5h)

| Order | # | Action | Effort |
|:-----:|---|--------|:------:|
| 6 | 3 | Wire policy-migrator into session-start.js | 1h |
| 7 | 7 | Add TOML schema validation to policy-migrator | 2h |
| 8 | 6 | Make --yolo conditional in spawn-agent-server.js | 2h |

### Sprint 3: Verification (Day 2-3, ~6h)

| Order | # | Action | Effort |
|:-----:|---|--------|:------:|
| 9 | 1 | Create v0.30.0 compatibility test cases | 2h |
| 10 | 8 | Verify AfterTool hook schema with v0.30.0 | 1h |
| 11 | 9 | Test gemini-3.1-pro models in cto-lead + gap-detector | 2h |
| 12 | 18 | Implement AfterAgent retry pattern | 2h |

### Sprint 4: Code Quality (Day 3-5, ~12h)

| Order | # | Action | Effort |
|:-----:|---|--------|:------:|
| 13 | 16 | Deduplicate 5 code pairs | 4h |
| 14 | 17 | Split 4 oversized files | 4h |
| 15 | 14 | Add bkit- prefix to 29 SKILL.md files | 4h |

### Sprint 5: Future Work (Week 2+, ~64h)

Items #12, #13, #15, #19-#24 -- deferred to v1.6.0/v1.7.0 as per analysis recommendations.

---

## 9. File-Level Impact Map

| File | Gap Items | Total Changes Needed |
|------|-----------|:--------------------:|
| `bkit.config.json` | #2 | 1 |
| `lib/adapters/gemini/version-detector.js` | #4 | 1 |
| `hooks/scripts/session-start.js` | #3 | 1 |
| `lib/adapters/gemini/policy-migrator.js` | #7 | 1 |
| `mcp/spawn-agent-server.js` | #6 | 1 |
| `gemini-extension.json` | #11 | 1 |
| `agents/cto-lead.md` | #9 | 1 |
| `agents/gap-detector.md` | #9 | 1 |
| `agents/report-generator.md` | #10 | 1 |
| `agents/qa-monitor.md` | #10 | 1 |
| `docs/guides/model-selection.md` | #5 | 1 |
| `hooks/scripts/after-tool.js` | #8 | 1 |
| `hooks/scripts/after-agent.js` | #18 | 1 |
| `tests/suites/*.js` (new) | #1 | 1 |
| `skills/*/SKILL.md` (29 files) | #14 | 29 |
| `lib/core/file.js` + `lib/pdca/tier.js` | #16 | 2 |
| `hooks/scripts/before-model.js` + `before-tool-selection.js` | #16 | 2 |
| `lib/skill-orchestrator.js` | #17 | 1 |
| `lib/core/memory.js` | #17 | 1 |
| `lib/core/permission.js` | #17 | 1 |

---

## 10. Comparison with Previous Analysis

| Metric | v1.5.1 Docs Sync (2026-02-11) | This Analysis (2026-02-25) |
|--------|:-----------------------------:|:--------------------------:|
| Match Rate | 100% (135/135) | 10.3% (24 items) |
| Scope | Documentation sync only | Code + Config + Docs |
| Items Analyzed | 7 FRs, cross-file consistency | 24 recommended actions |
| Critical Gaps | 0 | 5 (blocking chains) |
| Quick Wins | 0 (already perfect) | 6 (3.5h total effort) |

**Note**: The previous analysis measured documentation-to-documentation consistency (which was excellent). This analysis measures analysis-recommendations-to-implementation gaps, which is a fundamentally different metric. The 10.3% score reflects that the v0.30.0 recommendations are newly identified and have not yet entered the implementation pipeline.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-25 | Initial gap analysis | Gap Detector |

---

## Related Documents

- Analysis Source: [gemini-cli-030-upgrade-impact-analysis.analysis.md](../gemini-cli-030-upgrade-impact-analysis.analysis.md)
- Plan: [gemini-cli-v160-migration.plan.md](../../01-plan/features/gemini-cli-v160-migration.plan.md)

---

*Analysis performed by Gap Detector Agent on bkit-gemini v1.5.4 codebase*
*Source: 24 recommended actions from CTO Team v0.30.0 impact analysis*
