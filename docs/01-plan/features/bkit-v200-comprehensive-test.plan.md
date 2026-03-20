# bkit v2.0.0 Comprehensive Test Plan

## Executive Summary

| Perspective | Content |
|-------------|---------|
| Problem | bkit v2.0.0 introduces deep architectural changes (CC removal, Agent Safety Tiers, Transparent PDCA, Skill Visibility Control) with no existing test coverage for these new subsystems. |
| Solution | A structured 220-TC test suite covering PDCA workflow, Skills 2.0, and Agents in three dedicated test modules, mapped to the new v2.0.0 architecture. |
| Function UX Effect | Developers can verify every v2.0.0 behavioral contract before release — phase transitions, skill filtering, agent safety tiers — with a single test runner command. |
| Core Value | Ship v2.0.0 at TC Pass Rate >= 99%, providing regression safety for all Sprint 1-4 changes and a living test harness for future releases. |

---

> **Feature**: bkit-v200-comprehensive-test
> **Status**: PLAN
> **Date**: 2026-03-20
> **Target Version**: bkit v2.0.0
> **Target Gemini CLI**: v0.34.0+

---

## 1. Overview

bkit v2.0.0 is the largest architectural change in the project's history (Sprint 1-4, 8 weeks). It removes Claude Code legacy, introduces Agent Safety Tiers (SEC-01/02), Transparent PDCA automation, Skill Visibility Control, and Phase-Aware Context loading. The existing 79-TC suite (bkit-v159) was designed against v1.5.9 and does not cover any v2.0.0 behavioral contracts.

This plan defines ~220 test cases across three test modules:

| Module | Scope | Target TC Count |
|--------|-------|:-:|
| PDCA Workflow | Full cycle, state machine, iteration logic | ~80 |
| Skills 2.0 | Discovery, classification, visibility, orchestration | ~80 |
| Agents | Frontmatter, model routing, safety tiers, MCP, teams | ~60 |
| **Total** | | **~220** |

---

## 2. Goals

1. Define all ~220 test cases at specification level (IDs, descriptions, pass criteria) before implementation begins.
2. Map every v2.0.0 architectural change to at least one test case.
3. Produce test case definitions that the Do phase can implement without ambiguity.
4. Establish the quality gate: TC Pass Rate >= 99% required for v2.0.0 release.

---

## 3. Scope

### In Scope

- PDCA workflow: all 10 phases/commands (pm, plan, design, do, analyze, iterate, report, archive, cleanup, status/next)
- `.pdca-status.json` v2.0 schema validation
- `bkit-memory.json` phase tracking
- Match rate calculation and 90% threshold enforcement
- Iteration counting and max-5 guard
- Transparent PDCA: natural language trigger -> auto Plan+Design flow
- Tracker CRUD direct mode (createPdcaEpic, syncPhaseTransition)
- Multi-feature handling (primaryFeature, activeFeatures array)
- Archive `--summary` option and summary schema
- Skill discovery: 35 skills loaded correctly
- Skill classification: Workflow(11), Capability(20+), Hybrid(1) counts
- SKILL.md frontmatter parsing (classification, user-invocable, allowed-tools)
- Skill Visibility Control: Starter(5), Dynamic(18), Enterprise(all)
- LEVEL_SKILL_WHITELIST enforcement
- Skill orchestrator: getAgentForAction(), orchestrateSkillPre(), orchestrateSkillPost()
- Template @import directive resolution
- Agent count: 21 agents with correct frontmatter
- Agent model assignments (gemini-3.1-pro, gemini-3-pro, gemini-3-flash, gemini-3-flash-lite)
- Agent Safety Tier assignment (READONLY / DOCWRITE / FULL) per SEC-01
- MCP spawn-agent-server: list_agents, get_agent_info, spawn_agent
- Team orchestration patterns: leader, council, swarm, pipeline, watchdog
- PM Agent Team: 5-agent composition and phase assignments

### Out of Scope

- Actual Gemini CLI API calls (unit-level tests use mocks/fixtures)
- UI rendering or terminal output formatting beyond string matching
- Performance benchmarking (token count measurement is Sprint 2 verification, not a TC)
- bkit Marketplace publishing pipeline
- v1.5.9 regression (covered by existing 79-TC suite; will run alongside but is not redefined here)

---

## 4. Requirements

### 4.1 Functional Requirements (Must)

#### FR-01: PDCA Phase Transition Tests
- TC-001 through TC-020 must cover the happy path for each phase transition in sequence.
- Each TC must assert the `.pdca-status.json` phase field updates correctly.
- Each TC must assert the `.bkit-memory.json` phase field updates correctly.

#### FR-02: PDCA State Machine Edge Cases
- TC-021 through TC-040 must cover guard conditions: missing prerequisite documents, out-of-order phase invocations, and recovery from invalid state.

#### FR-03: Match Rate and Iteration Logic
- TC-041 through TC-055 must cover: match rate calculation correctness, 90% threshold pass/fail branching, iteration counter increment, max-5 stop condition, and early-stop on >= 90%.

#### FR-04: Transparent PDCA and Tracker Integration
- TC-056 through TC-070 must cover: natural language trigger detection, auto Plan+Design invocation without explicit `/pdca plan` command, Tracker CRUD direct mode calls (not hint-only), and multi-feature activeFeatures array management.

#### FR-05: Archive and Cleanup
- TC-071 through TC-080 must cover: archive happy path, archive `--summary` option producing the correct 7-field summary schema, cleanup interactive mode, cleanup all mode, and guard against archiving before report completion.

#### FR-06: Skill Discovery and Classification
- TC-081 through TC-100 must cover: 35 skills loaded, correct Workflow/Capability/Hybrid counts, SKILL.md frontmatter parsed for all required fields, and invalid frontmatter rejection.

#### FR-07: Skill Visibility Control
- TC-101 through TC-120 must cover: Starter level returns exactly 5 skills, Dynamic level returns 18 skills, Enterprise level returns all skills, and LEVEL_SKILL_WHITELIST is the authoritative filter.

#### FR-08: Skill Orchestrator
- TC-121 through TC-140 must cover: getAgentForAction() returns correct agent for each of the 4 orchestrated actions (pm, analyze, iterate, report), orchestrateSkillPre() and orchestrateSkillPost() lifecycle hooks fire in correct order, and @import directive resolves template content.

#### FR-09: Agent Frontmatter and Model Routing
- TC-141 through TC-160 must cover: all 21 agents have required frontmatter fields (name, description, model, safety-tier), model assignments match the four allowed values, and no agent references a deprecated model string.

#### FR-10: Agent Safety Tiers (SEC-01)
- TC-161 through TC-175 must cover: READONLY agents cannot invoke write tools, DOCWRITE agents can only write to docs/, FULL agents have no additional tool restrictions, and spawn-agent-server enforces tier before spawning.

#### FR-11: MCP spawn-agent-server
- TC-176 through TC-190 must cover: list_agents returns all 21 agents, get_agent_info returns complete metadata, spawn_agent with a READONLY agent rejects a write tool call, and spawn_agent with a valid FULL agent succeeds.

#### FR-12: Team Orchestration and PM Agent Team
- TC-191 through TC-210 must cover: 5-agent PM team composition (pm-lead, pm-discovery, pm-strategy, pm-research, pm-prd), team patterns per level (Dynamic: 3 teammates, Enterprise: 5 teammates), and each orchestration pattern (leader, council, swarm, pipeline, watchdog) is applied at the correct PDCA phase per the level matrix.

#### FR-13: Status v2.0 Schema
- TC-211 through TC-220 must cover: `.pdca-status.json` schema validation for primaryFeature, activeFeatures, per-feature phase/matchRate/iterationCount fields, archived summary format, and rejection of unknown top-level keys.

### 4.2 Non-Functional Requirements (Should)

- All TCs must be automatable via the existing `tests/run-all.js` runner without manual steps.
- Each TC must complete in under 5 seconds (mocked I/O).
- Test output must report pass/fail per TC ID for traceability to this Plan.

### 4.3 Deferred (Could/Won't)

- Could: Property-based testing for match rate calculation edge cases (deferred to v2.1.0).
- Won't: Load testing with 50+ simultaneous PDCA features (out of scope for v2.0.0).

---

## 5. Test Case Summary Table

### 5.1 PDCA Workflow (~80 TCs)

| Range | Area | Description |
|-------|------|-------------|
| TC-001 – TC-010 | Happy Path Transitions | pm -> plan -> design -> do -> analyze -> iterate -> report -> archive full cycle; status and next at each phase |
| TC-011 – TC-020 | State File Updates | `.pdca-status.json` phase field correct after each transition; `.bkit-memory.json` sync |
| TC-021 – TC-030 | Guard Conditions | Design requires plan doc; do requires design doc; analyze requires implementation; report requires matchRate >= 90% (warn); archive requires report completion |
| TC-031 – TC-040 | Out-of-Order Protection | Invoking design before plan returns actionable error; invoking archive before report is rejected |
| TC-041 – TC-050 | Match Rate Calculation | matchRate = 0%, 50%, 89%, 90%, 100% computed correctly; 90% threshold triggers correct branch |
| TC-051 – TC-055 | Iteration Logic | Iteration counter increments on each iterate call; stops at max 5; stops early when matchRate >= 90%; Act-N task label increments correctly |
| TC-056 – TC-062 | Transparent PDCA | Natural language phrase triggers auto-detect; plan+design auto-invoked without explicit command; AskUserQuestion confirmation step fires before execution |
| TC-063 – TC-068 | Tracker CRUD Direct Mode | createPdcaEpic called on plan phase; syncPhaseTransition called on each phase change; not hint-only (actual call verified) |
| TC-069 – TC-074 | Multi-Feature Handling | primaryFeature updates on new feature start; activeFeatures array grows/shrinks correctly; switching features preserves prior feature state |
| TC-075 – TC-080 | Archive and Cleanup | Archive happy path moves docs and updates status; `--summary` produces 7-field schema; cleanup interactive lists archived features; cleanup all deletes all archived; cleanup {feature} deletes specific feature |

### 5.2 Skills 2.0 (~80 TCs)

| Range | Area | Description |
|-------|------|-------------|
| TC-081 – TC-090 | Skill Discovery | 35 skills loaded on init; each skill has a SKILL.md; missing SKILL.md causes graceful error not crash |
| TC-091 – TC-100 | Skill Classification | Workflow count = 11; Capability count >= 20; Hybrid count = 1; total = 35; classification field is one of three valid values |
| TC-101 – TC-105 | SKILL.md Frontmatter | classification field present and valid; user-invocable field is boolean; allowed-tools is array or absent; malformed frontmatter rejected with clear error |
| TC-106 – TC-115 | Starter Visibility | Exactly 5 skills returned for Starter level: starter, pdca, bkit-rules, bkit-templates, development-pipeline; 6th skill not returned |
| TC-116 – TC-120 | Dynamic Visibility | Exactly 18 skills returned for Dynamic level; all 5 Starter skills included; remaining 13 are correct Dynamic additions |
| TC-121 – TC-125 | Enterprise Visibility | All 35 skills returned for Enterprise level; no skill excluded |
| TC-126 – TC-130 | LEVEL_SKILL_WHITELIST | Whitelist is authoritative; skills not in whitelist for level are filtered even if SKILL.md marks user-invocable=true; whitelist changes take effect without restart (hot reload) |
| TC-131 – TC-140 | Skill Orchestrator Core | getAgentForAction("pm") returns pm-lead; getAgentForAction("analyze") returns gap-detector; getAgentForAction("iterate") returns pdca-iterator; getAgentForAction("report") returns report-generator; unknown action returns null not error |
| TC-141 – TC-150 | Orchestrator Lifecycle | orchestrateSkillPre() fires before skill execution; orchestrateSkillPost() fires after; pre/post order is guaranteed; post receives skill result |
| TC-151 – TC-160 | Template @import | @import directive in SKILL.md resolves template file content; missing import file causes graceful error; circular import detected and rejected |

### 5.3 Agents (~60 TCs)

| Range | Area | Description |
|-------|------|-------------|
| TC-161 – TC-170 | Agent Frontmatter | All 21 agents present; each has: name, description, model, safety-tier fields; no required field absent; no deprecated field present |
| TC-171 – TC-175 | Model Assignments | All agent model values are one of: gemini-3.1-pro, gemini-3-pro, gemini-3-flash, gemini-3-flash-lite; no agent references gemini-2.x or claude-* |
| TC-176 – TC-185 | Safety Tier Enforcement (SEC-01) | READONLY agents: write tool call rejected before spawn; DOCWRITE agents: write to docs/ allowed, write to lib/ rejected; FULL agents: no additional restrictions; spawn-agent-server reads safety-tier before spawning |
| TC-186 – TC-190 | MCP spawn-agent-server | list_agents returns array of 21; get_agent_info returns complete metadata for known agent; get_agent_info for unknown agent returns error; spawn_agent success path returns agent handle; spawn_agent with safety violation returns error not crash |
| TC-191 – TC-195 | PM Agent Team Composition | pm-lead agent exists; pm-discovery, pm-strategy, pm-research, pm-prd all exist; pm-lead orchestrates 3-phase flow (Context Collection, Parallel Analysis, PRD Synthesis) |
| TC-196 – TC-200 | Team Level Requirements | Starter: team mode returns unavailable error; Dynamic: 3 teammates assigned (developer, frontend, qa); Enterprise: 5 teammates assigned (architect, developer, qa, reviewer, security) |
| TC-201 – TC-210 | Orchestration Patterns | leader pattern: single agent directs; council pattern: multi-agent consensus; swarm pattern: parallel execution; pipeline pattern: sequential handoff; watchdog pattern: monitors and intervenes; each pattern applied at correct PDCA phase per level matrix |
| TC-211 – TC-215 | Agent Memory Scope | Project-scope memory persists across sessions within project; user-scope memory persists across projects; memory does not leak between agent tiers |
| TC-216 – TC-220 | Status v2.0 Schema | primaryFeature field present; activeFeatures is array; per-feature object has phase/matchRate/iterationCount; archived summary has exactly: phase, matchRate, iterationCount, startedAt, archivedAt, archivedTo; extra unknown keys rejected |

---

## 6. Test Infrastructure

### 6.1 New Test Modules

Three new test files will be added to the existing `tests/` directory:

| File | TC Range | Description |
|------|----------|-------------|
| `tests/verify-pdca-workflow.js` | TC-001 – TC-080 | PDCA state machine, transitions, match rate, archive |
| `tests/verify-skills.js` | TC-081 – TC-160 | Skill discovery, classification, visibility, orchestrator |
| `tests/verify-agents.js` | TC-161 – TC-220 | Agent frontmatter, safety tiers, MCP, team patterns |

### 6.2 Runner Integration

`tests/run-all.js` will be updated to:
- Include the three new modules in the suite list.
- Report TC-001 through TC-220 in the output.
- Update report generation path to `docs/04-report/features/bkit-v200-comprehensive-test.report.md`.

### 6.3 Fixtures Required

| Fixture | Purpose |
|---------|---------|
| `tests/fixtures/pdca-status-v2.json` | Valid v2.0 schema for schema validation TCs |
| `tests/fixtures/pdca-status-invalid.json` | Invalid schema with unknown keys |
| `tests/fixtures/skill-valid-frontmatter.md` | Valid SKILL.md for parsing TCs |
| `tests/fixtures/skill-invalid-frontmatter.md` | Malformed SKILL.md for rejection TCs |
| `tests/fixtures/agent-readonly.md` | Agent with safety-tier: READONLY |
| `tests/fixtures/agent-full.md` | Agent with safety-tier: FULL |

---

## 7. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| TC Pass Rate | >= 99% (218/220) | `tests/run-all.js` output |
| TC Coverage vs Plan | 100% (all 220 TCs implemented) | TC ID presence in test files |
| PDCA Phase Coverage | 10/10 phases covered | TC-001 – TC-080 range |
| Skill Classification Coverage | 3/3 types (Workflow/Capability/Hybrid) | TC-091 – TC-100 |
| Safety Tier Coverage | 3/3 tiers (READONLY/DOCWRITE/FULL) | TC-176 – TC-185 |
| Agent Coverage | 21/21 agents verified | TC-161 – TC-170 |
| Team Pattern Coverage | 5/5 patterns verified | TC-201 – TC-210 |

---

## 8. Risks and Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|:---:|:---:|------------|
| R-1 | v2.0.0 implementation deviates from Plan, making TCs invalid | Medium | High | TCs are defined against the v2.0.0 Plan (bkit-gemini-v200-refactoring.plan.md) which is the authoritative spec; implementation must conform |
| R-2 | Skill count (35) or classification counts change during Sprint 3 | Medium | Medium | TC-081 and TC-091 use constants from SKILL.md files directly; update constants if counts change, do not hardcode |
| R-3 | Safety Tier enforcement requires Gemini CLI v0.34.0+ TOML support | Low | High | Verified in v1.5.9 that TOML policy is active; mock TOML enforcement in unit tests to avoid CLI dependency |
| R-4 | MCP spawn-agent-server tests require running MCP process | Medium | Medium | Use test-mcp-manually.js pattern (already in tests/) for MCP TCs; mark MCP TCs as integration-only in runner |
| R-5 | 220 TCs exceed current runner capacity causing timeout | Low | Low | Each TC targets < 5s; 220 x 5s = 18 min max; acceptable for CI gate |

---

## 9. Timeline

| Milestone | Sprint | Deliverable |
|-----------|--------|-------------|
| Plan Approved | Pre-Sprint | This document approved by CTO |
| Design Document | Sprint 1 | `docs/02-design/features/bkit-v200-comprehensive-test.design.md` with per-TC implementation notes |
| Fixture Files Created | Sprint 1 | 6 fixture files in `tests/fixtures/` |
| TC-001 – TC-080 Implemented | Sprint 2 | `tests/verify-pdca-workflow.js` passing |
| TC-081 – TC-160 Implemented | Sprint 3 | `tests/verify-skills.js` passing |
| TC-161 – TC-220 Implemented | Sprint 3 | `tests/verify-agents.js` passing |
| Runner Integration Complete | Sprint 4 | `tests/run-all.js` updated, all 220 TCs in report |
| Final Gate | Sprint 4 | TC Pass Rate >= 99%, report generated |

---

## 10. Related Documents

- Plan: [bkit-gemini-v200-refactoring.plan.md](./bkit-gemini-v200-refactoring.plan.md)
- Prior Test Plan: [bkit-v159-comprehensive-test.plan.md](./bkit-v159-comprehensive-test.plan.md)
- Design (to be created): `docs/02-design/features/bkit-v200-comprehensive-test.design.md`
- Report (to be created): `docs/04-report/features/bkit-v200-comprehensive-test.report.md`
