# bkit v1.5.8 Documentation Synchronization Plan

> **Summary**: Synchronize all documentation to reflect bkit v1.5.8 release -- version numbers, feature counts, component maps, new capabilities, and PDCA status
>
> **Project**: bkit-gemini (Vibecoding Kit - Gemini CLI Edition)
> **Version**: v1.5.8
> **Author**: Claude Opus 4.6
> **Date**: 2026-03-11
> **Status**: Draft
> **Language**: English (8-language trigger keywords preserved as-is)
> **Reference**: `docs/01-plan/features/bkit-gemini-v158-upgrade.plan.md` (implementation completed)

---

## Executive Summary

| Field | Value |
|-------|-------|
| **Feature** | bkit-v158-doc-sync |
| **Start Date** | 2026-03-11 |
| **Target Date** | 2026-03-11 |
| **Priority** | P0 (Release Blocker) |

### Value Delivered

| Perspective | Description |
|-------------|-------------|
| **Problem** | Documentation references v1.5.7 counts (16 agents, 29 skills, 18 commands) while codebase has grown to 21 agents, 35 skills, 24 commands. README badge shows 1.5.7. CHANGELOG missing v1.5.8 entry. |
| **Solution** | Systematic audit and synchronization of all documentation files to match v1.5.8 codebase reality |
| **Functional/UX Effect** | Users see accurate version info, feature counts, and component maps matching actual capabilities |
| **Core Value** | Release-ready documentation with zero inconsistencies between code and docs |

---

## 1. Overview

### 1.1 Purpose

bkit v1.5.8 implementation and comprehensive testing (972 TCs, 100% pass rate) are complete. This task synchronizes all documentation to accurately reflect the v1.5.8 release state, including new PM Agent Team (5 agents), 6 new skills, 6 new commands, team orchestration modules, and expanded test infrastructure.

### 1.2 Background

- **Implementation completed**: bkit-gemini-v158-upgrade PDCA cycle 100% (Match Rate 100%)
- **Testing completed**: bkit-v158-comprehensive-test (TC-01 ~ TC-78, 972 TCs) 100% pass
- **Problem**: Documentation files still reference v1.5.7 counts and capabilities
- **Scope**: Documentation-only changes -- no code modifications

### 1.3 Related Documents

- Implementation Plan: `docs/01-plan/features/bkit-gemini-v158-upgrade.plan.md`
- Implementation Design: `docs/02-design/features/bkit-gemini-v158-upgrade.design.md`
- Implementation Report: `docs/04-report/features/bkit-gemini-v158-upgrade.report.md`
- Test Plan: `docs/01-plan/features/bkit-v158-comprehensive-test.plan.md`
- Test Report: `docs/04-report/features/bkit-v158-comprehensive-test.report.md`
- Previous doc-sync: `docs/01-plan/features/bkit-v157-doc-sync.plan.md`

---

## 2. v1.5.8 Feature Matrix (Source of Truth)

### 2.1 Component Counts

| Category | v1.5.7 | v1.5.8 | Delta | Details |
|----------|--------|--------|-------|---------|
| **Agents** | 16 | 21 | +5 | +pm-discovery, pm-lead, pm-prd, pm-research, pm-strategy |
| **Skills** | 29 | 35 | +6 | +batch, plan-plus, simplify, pm-discovery, output-style-setup, loop |
| **Commands** | 18 | 24 | +6 | +batch, loop, plan-plus, simplify, output-style-setup, pm-discovery |
| **Built-in Tools** | 23 | 23 | 0 | Unchanged |
| **Hook Events** | 10 | 10 | 0 | Unchanged |
| **Test Suites** | 24 | 78 | +54 | TC-25 through TC-78 |
| **Test Cases** | ~218 | 972 | +754 | 11-perspective comprehensive coverage |
| **Lib Modules** | ~12 | ~25 | +13 | +9 team modules, paths.js, language-patterns.js, etc. |
| **Feature Flags** | ~37 | ~37 | 0 | Unchanged (v0.32.0+ flags) |
| **Output Styles** | 4 | 4 | 0 | Unchanged |
| **Context Modules** | 6 | 7 | +1 | +executive-summary-rules.md |
| **Orchestration Patterns** | 0 | 5 | +5 | Leader, Council, Swarm, Pipeline, Watchdog |
| **Skill Classifications** | 0 | 3 | +3 | W (Workflow), C (Capability), H (Hybrid) |

### 2.2 Gemini CLI Compatibility

| Field | v1.5.7 | v1.5.8 |
|-------|--------|--------|
| Min Version | 0.29.0 | 0.29.0 |
| Max Tested | 0.32.1 | 0.33.0-preview.4 |
| Display Range | v0.29.0~v0.32.1 | v0.29.0~v0.33.x |

### 2.3 New Architectural Components

| Component | Description |
|-----------|-------------|
| **PM Agent Team** | 5 specialized PM agents (discovery, lead, research, strategy, PRD) for pre-Plan product analysis |
| **Team Orchestration** | 9 modules in `lib/team/` with 5 patterns (Leader, Council, Swarm, Pipeline, Watchdog) |
| **Path Registry** | `lib/core/paths.js` - Centralized state file path management |
| **Language Patterns** | `lib/intent/language-patterns.js` - 8-language intent detection |
| **Skills 2.0** | Classification system (W/C/H), context:fork native, frontmatter hooks |
| **Executive Summary** | Mandatory output format after PDCA document work |

---

## 3. Scope

### 3.1 In Scope

| ID | Work Item | Priority | Description |
|----|-----------|----------|-------------|
| DS-01 | PDCA Status Cleanup | **P0** | Archive completed v1.5.8 features, register doc-sync feature |
| DS-02 | CHANGELOG.md v1.5.8 Entry | **P0** | Add comprehensive v1.5.8 changelog section |
| DS-03 | README.md Full Update | **P0** | Version badge, CLI range, all counts, component map, features section |
| DS-04 | GEMINI.md Count Update | P1 | Update skills/agents counts (already v1.5.8 version) |
| DS-05 | commands.md Update | P1 | Add 6 new commands to Available Commands reference |
| DS-06 | agent-triggers.md Update | P1 | Add 5 PM agent triggers |
| DS-07 | skill-triggers.md Update | P1 | Add 6 new skill triggers |
| DS-08 | bkit.toml Help Update | P1 | Update counts in /bkit help display (16->21 agents, 29->35 skills, 18->24 commands) |
| DS-09 | bkit.config.json Verify | P2 | Verify testedVersions includes 0.33.0, compatibility sections accurate |
| DS-10 | gemini-extension.json Verify | P2 | Verify version 1.5.8, all fields correct |
| DS-11 | PDCA Documents Archive | P1 | Archive completed v1.5.7 doc-sync and test features |
| DS-12 | Doc-sync Completion Report | P1 | Generate this task's completion report |

### 3.2 Out of Scope

- Code changes (.js files) -- implementation already complete
- New feature development
- Test code modifications
- Hook script version comments (already updated to 1.5.8 during implementation)
- Lib module version comments (already updated during implementation)

---

## 4. Current State Analysis

### 4.1 Version Number Audit

| File | Current Version | Expected | Status |
|------|----------------|----------|--------|
| `bkit.config.json` | 1.5.8 | 1.5.8 | **OK** |
| `gemini-extension.json` | 1.5.8 | 1.5.8 | **OK** |
| `GEMINI.md` | v1.5.8 | v1.5.8 | **OK** (counts outdated) |
| `README.md` badge | 1.5.7 | 1.5.8 | **NEEDS UPDATE** |
| `README.md` CLI range | v0.29.0~v0.32.1 | v0.29.0~v0.33.x | **NEEDS UPDATE** |
| `CHANGELOG.md` | [1.5.7] latest | [1.5.8] needed | **NEEDS UPDATE** |
| `lib/adapters/gemini/tool-registry.js` | 1.5.8 | 1.5.8 | **OK** |
| `lib/adapters/gemini/version-detector.js` | 1.5.8 | 1.5.8 | **OK** |
| `lib/core/paths.js` | 1.5.8 | 1.5.8 | **OK** |
| `lib/skill-orchestrator.js` | 1.5.8 | 1.5.8 | **OK** |

### 4.2 Feature Count Audit

| Document | Field | Current Value | Correct Value | Status |
|----------|-------|--------------|---------------|--------|
| README.md | Agents section header | 16 | 21 | **WRONG** |
| README.md | Skills section header | 29 | 35 | **WRONG** |
| README.md | Commands section header | 18 | 24 | **WRONG** |
| README.md | agents/ directory comment | 16 | 21 | **WRONG** |
| README.md | skills/ directory comment | 29 | 35 | **WRONG** |
| README.md | commands/ directory comment | 18 | 24 | **WRONG** |
| README.md | Agent table rows | 16 | 21 | **WRONG** |
| README.md | Skills table rows | 29 | 35 | **WRONG** |
| README.md | Commands table rows | 18 | 24 | **WRONG** |
| README.md | Context modules count | 6 | 7 | **WRONG** |
| README.md | Agent Memory text | 16 agents | 21 agents | **WRONG** |
| README.md | Compatibility table | v0.32.1 | v0.33.x | **WRONG** |
| README.md | Feature utilization table | 16/29/18 counts | 21/35/24 | **WRONG** |
| GEMINI.md | Skills count | 29 | 35 | **WRONG** |
| GEMINI.md | Agents count | 16 | 21 | **WRONG** |
| commands.md | Command list | 18 commands | 24 commands | **WRONG** |
| agent-triggers.md | Agent list | 16 agents | 21 agents | **WRONG** |
| skill-triggers.md | Skill list | 29 skills | 35 skills | **WRONG** |
| bkit.toml | Help text counts | 16/29/18 | 21/35/24 | **WRONG** |

### 4.3 Missing Content

| Document | Missing Content |
|----------|----------------|
| CHANGELOG.md | Entire v1.5.8 section |
| README.md | v1.5.8 Highlights section |
| README.md | 5 PM agents in agent table |
| README.md | 6 new skills in skill table |
| README.md | 6 new commands in command table |
| README.md | Team Orchestration section update |
| README.md | New lib modules in component map |
| commands.md | 6 new command entries |
| agent-triggers.md | 5 PM agent trigger entries |
| skill-triggers.md | 6 new skill trigger entries |

---

## 5. Requirements

### 5.1 Documentation Sync Requirements

| ID | Requirement | Verification Method |
|----|-------------|---------------------|
| DSR-01 | All files show version v1.5.8 (except CHANGELOG history) | grep verification |
| DSR-02 | All component counts match reality (21/35/24/78/972) | Cross-reference check |
| DSR-03 | CHANGELOG.md has comprehensive v1.5.8 entry | Document review |
| DSR-04 | README.md component map reflects all new modules | File existence cross-check |
| DSR-05 | All 21 agents listed in agent-triggers.md | Row count check |
| DSR-06 | All 35 skills listed in skill-triggers.md | Row count check |
| DSR-07 | All 24 commands listed in commands.md | Row count check |
| DSR-08 | .pdca-status.json reflects current state | JSON validation |
| DSR-09 | No v1.5.7 remnant references (except CHANGELOG history) | grep "1\.5\.7" excluding archive/CHANGELOG |

### 5.2 Non-Functional Requirements

| Category | Criteria |
|----------|----------|
| Completeness | Zero v1.5.7 references outside of CHANGELOG history and archive |
| Consistency | Same counts appear identically across all documents |
| Accuracy | Every documented module/tool/agent exists in the codebase |
| Language | All sync work in English; 8-language trigger keywords preserved as-is |

---

## 6. Success Criteria

### 6.1 Definition of Done

- [ ] DS-01 ~ DS-12 all work items completed
- [ ] grep "1\.5\.7" returns 0 results (excluding archive/, CHANGELOG.md history sections)
- [ ] All counts verified: 21 agents, 35 skills, 24 commands, 7 @imports, 78 test suites
- [ ] CHANGELOG.md v1.5.8 section comprehensive and accurate
- [ ] README.md fully updated with v1.5.8 content
- [ ] .pdca-status.json reflects current state
- [ ] Gap Analysis Match Rate >= 95%

### 6.2 Quality Criteria

- [ ] Cross-document count consistency: 0 mismatches
- [ ] Every listed component verifiable by file existence
- [ ] No broken @import references

---

## 7. Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| v1.5.7 remnants in non-obvious locations | Low | Comprehensive grep across all file types |
| Count mismatch between README sections | Medium | Single source of truth table (Section 2.1) used for all updates |
| New skill/agent missing from trigger lists | Medium | Cross-reference actual directory listings with trigger docs |
| CHANGELOG section too verbose or too terse | Low | Follow existing v1.5.7 CHANGELOG format/structure |
| README component map tree out of date | Medium | Generate from actual `ls` output, not memory |

---

## 8. Implementation Order

```
Phase 1: Audit
  1.1 grep "1\.5\.7" across all non-archive files
  1.2 Verify all component counts against actual files
  1.3 List all files requiring changes

Phase 2: Core Documents (P0)
  2.1 CHANGELOG.md - Add v1.5.8 section (DS-02)
  2.2 README.md - Full update: badge, counts, tables, component map (DS-03)

Phase 3: Context Modules (P1)
  3.1 GEMINI.md - Update counts (DS-04)
  3.2 commands.md - Add 6 new commands (DS-05)
  3.3 agent-triggers.md - Add 5 PM agents (DS-06)
  3.4 skill-triggers.md - Add 6 new skills (DS-07)
  3.5 bkit.toml - Update help text counts (DS-08)

Phase 4: Config Verification (P2)
  4.1 bkit.config.json - Verify all fields (DS-09)
  4.2 gemini-extension.json - Verify all fields (DS-10)

Phase 5: PDCA Housekeeping (P1)
  5.1 .pdca-status.json - Archive old, register new (DS-01)
  5.2 Archive completed v1.5.7 features (DS-11)
  5.3 Generate doc-sync completion report (DS-12)

Phase 6: Final Verification
  6.1 grep "1\.5\.7" final check (exclude archive, CHANGELOG history)
  6.2 Cross-reference all counts across documents
  6.3 Verify @import module existence
```

---

## 9. File Change Summary

| Category | Files | Action |
|----------|-------|--------|
| CHANGELOG | 1 (CHANGELOG.md) | Edit - add v1.5.8 section |
| README | 1 (README.md) | Edit - comprehensive update |
| Context Modules | 4 (GEMINI.md, commands.md, agent-triggers.md, skill-triggers.md) | Edit |
| Command Config | 1 (commands/bkit.toml) | Edit |
| PDCA Status | 1 (.pdca-status.json) | Edit |
| Report Docs | 1 (doc-sync report) | Create |
| **Total** | **~9-10 files** | |

---

## 10. Next Steps

1. [x] Plan document created
2. [ ] Design document created (`/pdca design bkit-v158-doc-sync`)
3. [ ] Implementation (documentation edits)
4. [ ] Gap Analysis (`/pdca analyze bkit-v158-doc-sync`)
5. [ ] Completion Report (`/pdca report bkit-v158-doc-sync`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-11 | Initial - v1.5.8 documentation synchronization plan | Claude Opus 4.6 |
