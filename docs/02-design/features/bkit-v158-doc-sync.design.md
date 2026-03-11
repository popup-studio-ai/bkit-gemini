# bkit v1.5.8 Documentation Synchronization Design Document

> **Summary**: Detailed design for synchronizing all documentation to bkit v1.5.8 release state
>
> **Project**: bkit-gemini (Vibecoding Kit - Gemini CLI Edition)
> **Version**: v1.5.8
> **Author**: Claude Opus 4.6
> **Date**: 2026-03-11
> **Status**: Draft
> **Language**: English (8-language trigger keywords preserved as-is)
> **Plan Reference**: `docs/01-plan/features/bkit-v158-doc-sync.plan.md`

---

## Executive Summary

| Field | Value |
|-------|-------|
| **Feature** | bkit-v158-doc-sync |
| **Start Date** | 2026-03-11 |
| **Target Date** | 2026-03-11 |
| **Work Items** | 12 (DS-01 ~ DS-12) |
| **Files Affected** | ~10 |

### Value Delivered

| Perspective | Description |
|-------------|-------------|
| **Problem** | 18+ count mismatches, missing v1.5.8 CHANGELOG, README badge showing 1.5.7, absent PM Agent Team documentation |
| **Solution** | Systematic file-by-file update specification with exact before/after values |
| **Functional/UX Effect** | Accurate documentation enabling users to discover all 21 agents, 35 skills, 24 commands |
| **Core Value** | Release-ready v1.5.8 documentation with zero code-doc inconsistencies |

---

## 1. Design Overview

### 1.1 Scope Summary

Documentation-only synchronization after v1.5.8 implementation and testing completion. **Zero code changes** -- all .js files already updated during implementation phase.

### 1.2 Design Principles

1. **Single Source of Truth**: All counts derived from Plan Section 2.1 Feature Matrix
2. **Grep-Driven Audit**: Systematic search for v1.5.7 remnants
3. **Incremental Verification**: Verify each file after editing
4. **Language Preservation**: 8-language trigger keywords left as-is, all other content in English

---

## 2. DS-01: PDCA Status Cleanup

### 2.1 Current State

The `.pdca-status.json` currently tracks 4 active features (all completed at 100%):
- `bkit-v158-comprehensive-test` (completed)
- `bkit-gemini-v158-upgrade` (completed)
- `bkit-v157-comprehensive-test` (completed)
- `bkit-v157-doc-sync` (completed)

### 2.2 Target State

```json
{
  "primaryFeature": "bkit-v158-doc-sync",
  "activeFeatures": {
    "bkit-v158-doc-sync": {
      "phase": "design",
      "matchRate": null,
      "lastUpdated": "2026-03-11T00:00:00Z",
      "documents": {
        "plan": "docs/01-plan/features/bkit-v158-doc-sync.plan.md",
        "design": "docs/02-design/features/bkit-v158-doc-sync.design.md"
      }
    }
  },
  "archivedFeatures": {
    "bkit-v158-comprehensive-test": {
      "phase": "archived",
      "matchRate": 100,
      "completedAt": "2026-03-11T00:00:00Z"
    },
    "bkit-gemini-v158-upgrade": {
      "phase": "archived",
      "matchRate": 100,
      "completedAt": "2026-03-11T00:00:00Z"
    },
    "bkit-v157-comprehensive-test": {
      "phase": "archived",
      "matchRate": 100,
      "completedAt": "2026-03-04T00:00:00Z"
    },
    "bkit-v157-doc-sync": {
      "phase": "archived",
      "matchRate": 100,
      "completedAt": "2026-03-04T00:00:00Z"
    }
  }
}
```

### 2.3 Actions

1. Move all 4 completed features from `activeFeatures` to `archivedFeatures`
2. Register `bkit-v158-doc-sync` as new active feature
3. Set `primaryFeature` to `bkit-v158-doc-sync`

---

## 3. DS-02: CHANGELOG.md v1.5.8 Entry

### 3.1 Insert Location

Insert new `## [1.5.8]` section **before** the existing `## [1.5.7]` section (line 8).

### 3.2 Content Specification

```markdown
## [1.5.8] - 2026-03-11

### Added
- 5 PM Agent Team agents: pm-discovery (OST analysis), pm-lead (4-phase orchestration), pm-research (personas + competitors + market), pm-strategy (JTBD + Lean Canvas), pm-prd (8-section PRD synthesis)
- 6 new skills: batch (parallel multi-feature PDCA), plan-plus (brainstorming-enhanced planning), simplify (code quality review), pm-discovery (PM Team workflow), output-style-setup (style installation), loop (recurring interval execution)
- 6 new TOML commands: /batch, /loop, /plan-plus, /simplify, /output-style-setup, /pm-discovery
- Team Orchestration system: 9 modules in lib/team/ with 5 patterns (Leader, Council, Swarm, Pipeline, Watchdog)
- Path Registry: lib/core/paths.js - centralized state file path management for .bkit/{state,runtime,snapshots}/
- Multilingual Intent Detection: lib/intent/language-patterns.js - structured 8-language keyword patterns
- Skills 2.0 Classification: Workflow (W), Capability (C), Hybrid (H) categories for all 35 skills
- Executive Summary output rules: mandatory summary table after PDCA document work
- 7th @import context module: .gemini/context/executive-summary-rules.md
- 54 new test suites (TC-25 ~ TC-78): 972 total test cases across 11 perspectives
- Gemini CLI v0.33.x compatibility (tested through v0.33.0-preview.4)

### Changed
- Agent count: 16 -> 21 (5 PM agents added)
- Skill count: 29 -> 35 (6 new skills added)
- Command count: 18 -> 24 (6 new commands added)
- Test suite count: 24 -> 78 (54 new suites, 972 total TCs)
- @import context modules: 6 -> 7 (+executive-summary-rules.md)
- bkit.config.json: added team orchestration, Skills 2.0, PM Agent Team configuration sections
- gemini-extension.json: version bumped, plan.directory setting added
- GEMINI.md: version bumped to v1.5.8 with 7 @import modules
- Skill Orchestrator: enhanced with Skills 2.0 classification queries (getSkillsByClassification)
- Core index: updated exports including paths module

### Documentation
- Plan/Design/Analysis/Report documents for bkit-gemini-v158-upgrade
- Plan/Design/Analysis/Report documents for bkit-v158-comprehensive-test
```

### 3.3 Footer Link

Add to CHANGELOG.md footer:

```markdown
[1.5.8]: https://github.com/popup-studio-ai/bkit-gemini/compare/v1.5.7...v1.5.8
```

---

## 4. DS-03: README.md Full Update

### 4.1 Badge Updates (Lines 4-5)

**Before:**
```markdown
[![Gemini CLI](https://img.shields.io/badge/Gemini%20CLI-v0.29.0~v0.32.1-blue.svg)](...)
[![Version](https://img.shields.io/badge/Version-1.5.7-green.svg)](CHANGELOG.md)
```

**After:**
```markdown
[![Gemini CLI](https://img.shields.io/badge/Gemini%20CLI-v0.29.0~v0.33.x-blue.svg)](...)
[![Version](https://img.shields.io/badge/Version-1.5.8-green.svg)](CHANGELOG.md)
```

### 4.2 Architecture Table (Line 38-43)

**Before:**
```markdown
| **Domain Knowledge** | Skills | 29 | ... |
| **Behavioral Rules** | Agents | 16 | ... |
| **State Management** | Hook Scripts + Lib Modules | 17 + 6 | ... |
```

**After:**
```markdown
| **Domain Knowledge** | Skills | 35 | Structured expert knowledge activated on-demand via progressive disclosure |
| **Behavioral Rules** | Agents | 21 | Role-based constraints with model, tools, temperature configuration |
| **State Management** | Hook Scripts + Lib Modules | 17 + 13 | PDCA status tracking, intent detection, permission control, memory persistence, team orchestration |
```

### 4.3 Extension Component Map (Lines 63-179)

Major updates needed:

1. **gemini-extension.json comment**: `(v1.5.7)` -> `(v1.5.8)`
2. **GEMINI.md comment**: `6 @import modules` -> `7 @import modules`
3. **@import context modules**: Add `executive-summary-rules.md`
4. **agents/ comment**: `16 specialized AI agents` -> `21 specialized AI agents`
5. **Add 5 PM agents** to agents/ listing:
   ```
   |   |-- pm-lead.md               # PM Team Lead orchestration
   |   |-- pm-discovery.md           # Market/user opportunity discovery
   |   |-- pm-strategy.md            # Value proposition & Lean Canvas
   |   |-- pm-research.md            # Personas, competitors, market sizing
   |   +-- pm-prd.md                 # PRD synthesis & GTM strategy
   ```
6. **skills/ comment**: `29 domain skills` -> `35 domain skills`
7. **Add 6 new skills** to skills/ listing:
   ```
   |   |-- plan-plus/                # Brainstorming-enhanced planning
   |   |-- simplify/                 # Code quality review
   |   |-- batch/                    # Parallel multi-feature PDCA
   |   |-- loop/                     # Recurring interval execution
   |   |-- output-style-setup/       # Output style installation
   |   +-- pm-discovery/             # PM Agent Team workflow
   ```
8. **commands/ comment**: `18 TOML custom commands` -> `24 TOML custom commands`
9. **Add 6 new commands** to commands/ listing:
   ```
   |   |-- plan-plus.toml            # /plan-plus
   |   |-- simplify.toml             # /simplify
   |   |-- batch.toml                # /batch
   |   |-- loop.toml                 # /loop
   |   |-- output-style-setup.toml   # /output-style-setup
   |   +-- pm-discovery.toml         # /pm-discovery
   ```
10. **lib/ section**: Add new modules:
    ```
    |   |-- core/
    |   |   |-- paths.js             # Centralized path registry (v1.5.8)
    |   |   |-- agent-memory.js      # Per-agent persistence (214 lines)
    |   |   +-- permission.js        # Glob pattern permission engine (381 lines)
    |   |-- team/                    # Team orchestration (v1.5.8)
    |   |   |-- coordinator.js       # Task coordination
    |   |   |-- cto-logic.js         # CTO-level orchestration (5 patterns)
    |   |   |-- communication.js     # MCP/memory protocols
    |   |   |-- memory.js            # Team memory persistence
    |   |   |-- pattern-selector.js  # Orchestration pattern selection
    |   |   |-- state-recorder.js    # State snapshots
    |   |   |-- strategy.js          # Strategy enum
    |   |   +-- task-queue.js        # Task queueing
    |   |-- intent/
    |   |   +-- language-patterns.js # 8-language intent detection
    ```

### 4.4 Features Section

**Add new v1.5.8 Highlights section** before existing v1.5.7 section:

```markdown
### v1.5.8 Highlights

- **PM Agent Team** -- 5 new agents (pm-lead, pm-discovery, pm-strategy, pm-research, pm-prd) for comprehensive product discovery before PDCA Plan phase
- **Team Orchestration** -- 9 modules with 5 patterns (Leader, Council, Swarm, Pipeline, Watchdog) for coordinated multi-agent workflows
- **6 New Skills** -- plan-plus (brainstorming-enhanced planning), simplify (code quality review), batch (parallel PDCA), loop (recurring execution), output-style-setup, pm-discovery
- **6 New Commands** -- /plan-plus, /simplify, /batch, /loop, /output-style-setup, /pm-discovery
- **Skills 2.0 Classification** -- 35 skills categorized as Workflow (9), Capability (25), or Hybrid (1)
- **Path Registry** -- Centralized state file management with auto-migration from legacy paths
- **972 Test Cases** -- 78 test suites covering 11 perspectives (unit, E2E, integration, scenario, philosophy, security, edge cases, recovery)
- **Gemini CLI v0.33.x Compatibility** -- Tested through v0.33.0-preview.4
```

### 4.5 Agent Section

**Update header**: `## Agents (16)` -> `## Agents (21)`

**Add 5 PM agent rows** to agent table:

```markdown
| **pm-lead** | PM Team | PM team orchestration, 4-phase product discovery workflow |
| **pm-discovery** | PM Team | Opportunity Solution Tree analysis, market/user discovery |
| **pm-strategy** | PM Team | Value Proposition (JTBD), Lean Canvas business model |
| **pm-research** | PM Team | User personas, competitor analysis, market sizing (TAM/SAM/SOM) |
| **pm-prd** | PM Team | PRD synthesis, beachhead segment, GTM strategy |
```

**Update agent memory text**: "All 16 agents" -> "All 21 agents"

**Update agent frontmatter text**: Reference 21 agents

### 4.6 Skills Section

**Update header**: `## Skills (29)` -> `## Skills (35)`

**Add 6 new skill rows** to skills table:

```markdown
| **plan-plus** | Utility | "brainstorm plan", "explore alternatives" |
| **simplify** | Quality | "simplify code", "reduce complexity" |
| **batch** | Utility | "batch process", "multiple features" |
| **loop** | Utility | "recurring check", "monitor interval" |
| **output-style-setup** | Utility | "install styles", "setup output" |
| **pm-discovery** | PM | "product discovery", "PM analysis", "PRD" |
```

### 4.7 Commands Section

**Update header**: `## TOML Commands (18)` -> `## TOML Commands (24)`

**Update description**: "18 custom commands" -> "24 custom commands"

**Add 6 new command rows** to commands table:

```markdown
| `/plan-plus <feature>` | Brainstorming-enhanced PDCA planning | `@{path}` + `{{args}}` |
| `/simplify` | Code quality review and simplification | `@{path}` |
| `/batch <features>` | Parallel multi-feature PDCA processing | `@{path}` + `{{args}}` |
| `/loop <interval> <cmd>` | Recurring command execution | `@{path}` + `{{args}}` |
| `/output-style-setup` | Install output style files | `@{path}` |
| `/pm-discovery <feature>` | PM Agent Team product analysis | `@{path}` + `{{args}}` |
```

### 4.8 Usage Section

**Add new subsections** for new command categories:

```markdown
### Enhanced Planning

```bash
/plan-plus <feature>     # Brainstorming-enhanced PDCA planning
/pm-discovery <feature>  # PM Agent Team product discovery
```

### Automation

```bash
/simplify                # Code quality review and simplification
/batch <features>        # Process multiple features in parallel
/loop <interval> <cmd>   # Run command on recurring interval (e.g., /loop 5m /pdca status)
```
```

### 4.9 Team Mode Section Update

**Replace existing Team Mode Foundation content** with expanded Team Orchestration:

```markdown
### Team Orchestration

bkit v1.5.8 includes full team orchestration with 5 coordination patterns:

| Pattern | Agents | Use Case |
|---------|--------|----------|
| **Leader** | 1 lead + N workers | Standard feature development |
| **Council** | Equal peers | Architecture decisions |
| **Swarm** | Dynamic pool | High-parallelism tasks |
| **Pipeline** | Sequential chain | Multi-phase workflows |
| **Watchdog** | Monitor + actors | Continuous monitoring |

9 dedicated modules in `lib/team/` handle coordination, communication, state recording, and memory persistence.
```

### 4.10 Compatibility Section

**Update Gemini CLI version**:
```markdown
| Gemini CLI | v0.29.0+ (forward-compatible with v0.33.x) |
```

**Update Feature Utilization table**:
```markdown
| Agent frontmatter | All 21 agents |
| @import syntax | 7 context modules in `.gemini/context/` |
| TOML commands | 24 enhanced commands |
| Agent Skills | 35 skills with progressive disclosure |
```

### 4.11 Documentation Section

**Update references**:
```markdown
- [Skills Reference](skills/) -- 35 domain skills
- [Agents Reference](agents/) -- 21 specialized agents
```

---

## 5. DS-04: GEMINI.md Count Update

### 5.1 Changes

**Line 12** (Skills count):
```
Before: - **29 Skills**: Domain-specific knowledge activated on-demand
After:  - **35 Skills**: Domain-specific knowledge activated on-demand via progressive disclosure
```

**Line 13** (Agents count):
```
Before: - **16 Agents**: Specialized AI assistants with role-based constraints
After:  - **21 Agents**: Specialized AI assistants with role-based constraints (model, tools, temperature)
```

---

## 6. DS-05: commands.md Update

### 6.1 Add New Command Sections

**Add to "Utility Commands" section or create new sections:**

```markdown
### Enhanced Planning Commands
| Command | Description |
|---------|-------------|
| `/plan-plus [feature]` | Brainstorming-enhanced PDCA planning |
| `/pm-discovery [feature]` | PM Agent Team product discovery and PRD |

### Automation Commands
| Command | Description |
|---------|-------------|
| `/batch [features]` | Process multiple features in parallel |
| `/loop [interval] [cmd]` | Run command on recurring interval |
| `/simplify` | Code quality review and simplification |
| `/output-style-setup` | Install output style files |
```

---

## 7. DS-06: agent-triggers.md Update

### 7.1 Add 5 PM Agent Trigger Rows

Append to existing agent trigger table:

```markdown
| pm, PRD, product discovery, PM analysis, PM 분석, 제품 기획, PM分析, 产品分析 | `pm-lead` | PM Team orchestration and PRD workflow |
| opportunity, discovery, OST, customer needs, 기회, 고객 니즈, 機会発見, 机会发现 | `pm-discovery` | Opportunity Solution Tree analysis |
| value proposition, JTBD, lean canvas, business model, 가치 제안, 価値提案, 价值主张 | `pm-strategy` | Value Proposition and Lean Canvas |
| persona, competitor, market size, TAM, SAM, 페르소나, 경쟁사, ペルソナ, 用户画像 | `pm-research` | User personas, competitor analysis, market sizing |
| PRD, beachhead, GTM, feature spec, 요구사항 문서, 製品要件, 产品需求 | `pm-prd` | PRD synthesis and GTM strategy |
```

---

## 8. DS-07: skill-triggers.md Update

### 8.1 Add 6 New Skill Trigger Rows

Append to existing skill trigger table:

```markdown
| brainstorm plan, explore alternatives, plan plus, 브레인스토밍, ブレスト, 头脑风暴 | `plan-plus` | Brainstorming-enhanced PDCA planning |
| simplify, reduce complexity, code cleanup, 심플리파이, シンプル化, 简化 | `simplify` | Code quality review and simplification |
| batch process, multiple features, parallel, 배치, バッチ, 批量 | `batch` | Parallel multi-feature PDCA processing |
| loop, recurring, monitor interval, 반복, ループ, 循环 | `loop` | Recurring interval execution |
| output style, install style, setup style, 스타일 설정, スタイル設定, 样式设置 | `output-style-setup` | Output style file installation |
| pm analysis, product discovery, PRD, PM 분석, PM分析, 产品分析 | `pm-discovery` | PM Agent Team workflow |
```

---

## 9. DS-08: bkit.toml Help Update

### 9.1 Count Updates

The `/bkit` help command in `commands/bkit.toml` displays component counts. Update:

| Field | Before | After |
|-------|--------|-------|
| Agents | 16 | 21 |
| Skills | 29 | 35 |
| Commands | 18 | 24 |
| Version | v1.5.2 (if outdated) | v1.5.8 |

### 9.2 Verification

Read `commands/bkit.toml` and update all count references to match v1.5.8 reality.

---

## 10. DS-09: bkit.config.json Verification

### 10.1 Checklist

| Field | Expected Value | Action |
|-------|---------------|--------|
| `version` | "1.5.8" | Verify (should be OK) |
| `testedVersions` | includes "0.33.0" | Verify |
| `compatibility.minGeminiCliVersion` | "0.29.0" | Verify |
| `compatibility.taskTracker.enabled` | true | Verify |
| `compatibility.teamOrchestration` | exists | Verify |
| `compatibility.skillOrchestrator` | exists | Verify |

### 10.2 Expected Result

All fields should already be correct from implementation phase. This is a verification-only step.

---

## 11. DS-10: gemini-extension.json Verification

### 11.1 Checklist

| Field | Expected Value | Action |
|-------|---------------|--------|
| `version` | "1.5.8" | Verify |
| `contextFileName` | "GEMINI.md" | Verify |
| `excludeTools` | absent | Verify removed |

### 11.2 Expected Result

All fields should already be correct. Verification-only step.

---

## 12. DS-11: PDCA Documents Archive

### 12.1 Archive Strategy

Completed v1.5.7 features should be acknowledged in `archivedFeatures` of `.pdca-status.json`. The actual plan/design/report files remain in place (they serve as project history).

### 12.2 Files to Keep

All existing plan/design/analysis/report files remain in `docs/` -- they are reference documents, not transient artifacts.

---

## 13. DS-12: Doc-sync Completion Report

### 13.1 Target File

`docs/04-report/features/bkit-v158-doc-sync.report.md`

### 13.2 Report Structure

```markdown
# bkit v1.5.8 Documentation Synchronization Report

## 1. Summary
- Work items: 12 (DS-01 ~ DS-12)
- Files modified: ~10
- Result: All documentation synchronized to v1.5.8

## 2. Changes Made
(DS-01 ~ DS-12 execution results)

## 3. Verification Results
- v1.5.7 remnant references: 0 (excluding CHANGELOG history)
- Count mismatches: 0
- Missing documentation: 0

## 4. Quality Metrics
- Match Rate: >= 95%
- Cross-document consistency: verified
```

---

## 14. Implementation Order (Detailed)

```
Step 1: Audit Phase
├── 1.1 grep "1\.5\.7" across all non-archive files
├── 1.2 Count actual agents (ls agents/*.md | wc -l) => 21
├── 1.3 Count actual skills (ls skills/*/SKILL.md | wc -l) => 35
├── 1.4 Count actual commands (ls commands/*.toml | wc -l) => 24
└── 1.5 Count @import modules in GEMINI.md => 7

Step 2: CHANGELOG.md (DS-02)
└── 2.1 Insert [1.5.8] section before [1.5.7]
     └── 2.2 Add footer compare link

Step 3: README.md (DS-03) -- Largest change
├── 3.1 Update badges (version + CLI range)
├── 3.2 Update Architecture table counts
├── 3.3 Update Extension Component Map
├── 3.4 Add v1.5.8 Highlights section
├── 3.5 Update Agents section (header + table + memory text)
├── 3.6 Update Skills section (header + table)
├── 3.7 Update Commands section (header + table + description)
├── 3.8 Update Usage section (add new subsections)
├── 3.9 Update Team Mode section
├── 3.10 Update Compatibility section
└── 3.11 Update Documentation references

Step 4: Context Modules (DS-04 ~ DS-07)
├── 4.1 GEMINI.md count update (29->35, 16->21)
├── 4.2 commands.md add 6 commands
├── 4.3 agent-triggers.md add 5 PM agents
└── 4.4 skill-triggers.md add 6 skills

Step 5: Command Config (DS-08)
└── 5.1 bkit.toml help text counts

Step 6: Config Verification (DS-09, DS-10)
├── 6.1 bkit.config.json field check
└── 6.2 gemini-extension.json field check

Step 7: PDCA Housekeeping (DS-01, DS-11)
├── 7.1 Update .pdca-status.json
└── 7.2 Archive completed features

Step 8: Final Verification
├── 8.1 grep "1\.5\.7" final check (exclude archive + CHANGELOG history)
├── 8.2 Cross-reference all counts: README vs GEMINI.md vs triggers vs bkit.toml
├── 8.3 Verify all 7 @import module files exist
└── 8.4 JSON validation on .pdca-status.json

Step 9: Report (DS-12)
└── 9.1 Generate doc-sync completion report
```

---

## 15. Verification Queries

### 15.1 v1.5.7 Remnant Check

```bash
# Should return 0 results (excluding archive and CHANGELOG history)
grep -r "1\.5\.7" --include="*.md" --include="*.json" --include="*.toml" \
  --exclude-dir=archive --exclude-dir=node_modules . \
  | grep -v "CHANGELOG.md" | grep -v "docs/01-plan" | grep -v "docs/02-design" \
  | grep -v "docs/03-analysis" | grep -v "docs/04-report"
```

### 15.2 Component Count Verification

```bash
# Agents: expected 21
ls agents/*.md | wc -l

# Skills: expected 35
ls skills/*/SKILL.md | wc -l

# Commands: expected 24
ls commands/*.toml | wc -l

# Context modules: expected 7
grep "^@" GEMINI.md | wc -l
```

### 15.3 Cross-Document Consistency Check

Verify these numbers appear consistently across all documents:

| Count | README | GEMINI.md | triggers | bkit.toml |
|-------|--------|-----------|----------|-----------|
| 21 agents | Agents (21) | 21 Agents | 21 rows | 21 Agents |
| 35 skills | Skills (35) | 35 Skills | 35 rows | 35 Skills |
| 24 commands | Commands (24) | N/A | N/A | 24 Commands |
| 7 @imports | 7 @import modules | 7 @-lines | N/A | N/A |

---

## 16. Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| README edit is large and error-prone | Section-by-section editing with verification after each |
| Count mismatch introduced during editing | Use Plan Section 2.1 as single source of truth |
| New skill/agent missing from triggers | Cross-reference `ls` output with trigger table rows |
| CHANGELOG too verbose | Follow existing v1.5.7 entry format and structure |
| Merge conflicts if parallel work | Doc-sync is documentation-only, low conflict risk |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-11 | Initial - 12 DS items with detailed before/after specifications | Claude Opus 4.6 |
