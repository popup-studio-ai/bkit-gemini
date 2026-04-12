---
name: pdca
classification: W
description: |
  Unified skill for managing the entire PDCA cycle.
  Supports Plan → Design → Do → Check → Act workflow with automatic phase progression.

  Use proactively when user mentions PDCA cycle, planning, design documents,
  gap analysis, iteration, or completion reports.

  Triggers: pdca, plan, design, analyze, check, report, status, next, iterate,
  계획, 설계, 분석, 검증, 보고서, 반복, 개선,
  計画, 設計, 分析, 検証, 報告, 反復,
  计划, 设计, 分析, 验证, 报告, 迭代,
  planificar, diseño, analizar, verificar, informe,
  planifier, conception, analyser, vérifier, rapport,
  planen, Entwurf, analysieren, überprüfen, Bericht,
  pianificare, progettazione, analizzare, verificare, rapporto

  Do NOT use for: simple one-line fixes, non-development tasks

# ──── NEW FIELDS (v1.5.1) ────
user-invocable: true
argument-hint: "[plan|design|do|analyze|iterate|report|status|next] [feature]"

allowed-tools:
  - read_file
  - write_file
  - replace
  - glob
  - grep_search
  - google_web_search
  - tracker_create_task
  - tracker_update_task
  - tracker_list_tasks
  - tracker_visualize

imports:
  - templates/plan.template.md
  - templates/design.template.md
  - templates/analysis.template.md
  - templates/report.template.md

agents:
  analyze: gap-detector
  iterate: pdca-iterator
  report: report-generator

context: session
memory: project
pdca-phase: all

task-template:
  subject: "PDCA {action} - {feature}"
  description: "Execute PDCA {action} phase for feature '{feature}'"
  activeForm: "Executing PDCA {action}"
---

# PDCA Skill

> Unified Skill for managing PDCA cycle. Supports the entire Plan → Design → Do → Check → Act flow.

## Arguments

| Argument | Description | Example |
|----------|-------------|---------|
| `plan [feature]` | Create Plan document | `/pdca plan user-auth` |
| `design [feature]` | Create Design document | `/pdca design user-auth` |
| `do [feature]` | Do phase guide | `/pdca do user-auth` |
| `analyze [feature]` | Run Gap analysis (Check) | `/pdca analyze user-auth` |
| `iterate [feature]` | Auto improvement (Act) | `/pdca iterate user-auth` |
| `report [feature]` | Generate completion report | `/pdca report user-auth` |
| `archive [feature]` | Archive PDCA documents | `/pdca archive user-auth` |
| `status` | Show current status | `/pdca status` |
| `next` | Guide to next phase | `/pdca next` |

## Action Details

### plan (Plan Phase)
1. Check if `docs/01-plan/features/{feature}.plan.md` exists
2. If not, create based on plan.template.md
3. Create Task: `[Plan] {feature}`
4. **Context Anchor Generation**: After generating Plan document, extract Context Anchor
   (WHY/WHO/RISK/SUCCESS/SCOPE) from Executive Summary, Requirements, and Risk sections.
   Write as `## Context Anchor` table between Executive Summary and Section 1.

   | Dimension | Content |
   |-----------|---------|
   | WHY | Core problem being solved |
   | WHO | Target users/stakeholders |
   | RISK | Top 3 risks identified |
   | SUCCESS | Measurable success criteria |
   | SCOPE | In-scope / out-of-scope boundary |

### design (Design Phase)
1. Verify Plan document exists
2. Create `docs/02-design/features/{feature}.design.md`
3. Create Task: `[Design] {feature}` (blockedBy: Plan)
4. **Context Anchor Embed**: Copy Plan's `## Context Anchor` table to Design document top
   (between header metadata and ## 1. Overview). If Plan has no Context Anchor, skip gracefully.
5. **Generate 3 Architecture Options**:
   - Option A — Minimal Changes: Least modification, maximum reuse
   - Option B — Clean Architecture: Best separation of concerns
   - Option C — Pragmatic Balance: Good boundaries without over-engineering
6. Present comparison table with trade-offs (complexity, maintainability, effort, risk)
7. Ask user which option to select before proceeding

### do (Do Phase)
1. Verify Design document exists
2. Provide implementation guide
3. Create Task: `[Do] {feature}` (blockedBy: Design)
4. **Full Upstream Context Loading**: Read ALL upstream documents:
   - PRD (docs/00-pm/{feature}.prd.md) — WHY context
   - Plan (docs/01-plan/features/{feature}.plan.md) — Context Anchor, Success Criteria
   - Design document — architecture decisions
5. **Decision Record Chain Display**:
   ```
   Decision Record Chain
   [PRD] Target: {segment} — {rationale}
   [Plan] Architecture: {option} — {rationale}
   [Design] Pattern: {approach} — {rationale}
   ```
6. **Display Context Anchor** from Design document header
7. **Parse --scope parameter**: If `--scope module-1` provided, filter implementation
   guide to matching modules only from Design's Session Guide
8. Ask user to confirm scope before starting implementation

### analyze (Check Phase)
1. Call gap-detector agent
2. Compare Design vs implementation
3. Calculate Match Rate
4. Create Task: `[Check] {feature}`
5. After gap-detector analysis, also call `bkit_iterate` MCP tool for quantitative gap measurement:
   - This tool compares design document vs actual implementation
   - Returns matchRate percentage and specific gaps with file references
   - If matchRate < 90%, recommend calling `/pdca iterate`

### iterate (Act Phase)
1. Check results (when matchRate < 90%)
2. Call pdca-iterator agent
3. Auto-fix and re-verify
4. Max 5 iterations
5. Call `bkit_iterate` MCP tool for automated gap analysis:
   - Input: feature name, project directory, target match rate (default 90%)
   - Tool returns gaps with specific file:line references
   - Fix the identified gaps
   - Call `bkit_iterate` again to re-check
   - Repeat until matchRate >= 90% or max 5 iterations
   - Server tracks iteration count internally

### qa (QA Phase)
When running QA, call `bkit_qa_run` MCP tool:
- Input: feature name, project directory, test levels [1,2,3,4,5]
- The tool auto-detects test framework (jest/vitest/playwright)
- L1: Unit tests, L2: API tests, L3-L5: E2E/browser tests (if playwright installed)
- Review results: passRate, coverage, defects
- If passRate < 95%, fix issues and re-run

### report (Completion Report)
1. Verify Check >= 90%
2. Call report-generator agent
3. Create completion report
4. Load ALL upstream documents for comprehensive reporting:
   - PRD — compare original value proposition vs delivered value
   - Plan — compare planned Success Criteria vs actual results
   - Design — note architecture decisions and any deviations
   - Analysis — include final Match Rate
5. Include Decision Record summary and Success Criteria final status

## PDCA Flow

```
[Plan] ✅ → [Design] ✅ → [Do] ✅ → [Check] 🔄 → [Act] ⏳ → [Report] 📋
                                       ↑_________|
                                    (if < 90%)
```

## References

- `${extensionPath}/templates/plan.template.md`
- `${extensionPath}/templates/design.template.md`
- `${extensionPath}/templates/analysis.template.md`
- `${extensionPath}/templates/report.template.md`
