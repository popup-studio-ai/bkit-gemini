---
name: plan-plus
classification: W
description: |
  Plan Plus — Brainstorming-Enhanced PDCA Planning.
  Combines intent discovery from brainstorming methodology with PDCA's structured planning.
  Produces higher-quality Plan documents by exploring user intent, comparing alternatives, and validating incrementally.

  Triggers: plan-plus, brainstorm plan, enhanced plan, deep plan,
  플랜플러스, 브레인스토밍, 심층 기획,
  プランプラス, ブレインストーミング,
  深度计划, 头脑风暴,
  plan plus, planificación avanzada,
  plan plus, planification avancée,
  Plan Plus, erweiterte Planung,
  plan plus, pianificazione avanzata

user-invocable: true
argument-hint: "[feature]"
allowed-tools:
  - read_file
  - write_file
  - replace
  - glob
  - grep_search
  - google_web_search
  - web_fetch
  - tracker_create_task
  - tracker_update_task
  - tracker_list_tasks

imports:
  - templates/plan.template.md

context: session
memory: project
pdca-phase: plan
classification: hybrid
---

# Plan Plus — Brainstorming-Enhanced PDCA Planning

> Produces higher-quality Plan documents by exploring user intent, comparing alternatives, and validating incrementally.

## HARD-GATE

**Do NOT write implementation code until the Plan is approved by the user.**

All output in this skill is documentation and planning artifacts only.
No source code files may be created or modified until the user explicitly approves the final Plan document.

## Key Principles

1. **Think before coding** — Planning prevents wasted effort.
2. **User intent over assumptions** — Ask, do not guess.
3. **Minimal viable plan** — Cover what matters, skip what does not.
4. **Iterative refinement** — Build the plan in stages with user feedback.
5. **Evidence-based decisions** — Use research and data, not opinion.
6. **YAGNI discipline** — If the user does not need it now, exclude it.

## 7-Phase Workflow

### Phase 0: Project Context Exploration (auto)

Automatically gather project context before interacting with the user.

1. Read existing documentation in `docs/01-plan/`, `docs/02-design/`.
2. Scan code structure: project root files, `src/`, `lib/`, `package.json`, config files.
3. Check `.pdca-status.json` for current PDCA state.
4. Identify existing features, tech stack, and conventions.

**Output:** Internal context summary (not shown to user unless requested).

### Phase 1: Intent Discovery

Ask the user 4 structured questions with numbered options:

1. **What** — What is the feature or change?
   - Provide 3-4 interpretations based on context, let user pick or clarify.
2. **Why** — What problem does this solve?
   - Suggest 2-3 possible motivations.
3. **Who** — Who are the target users or stakeholders?
   - List likely user personas from project context.
4. **How** — What approach or constraints exist?
   - Propose 2-3 technical directions.

**Format:** Present each question with numbered options. Wait for user response before proceeding.

### Phase 2: Alternative Exploration

Based on Phase 1 answers, present 2-3 alternative approaches in a comparison table:

| Criteria | Approach A | Approach B | Approach C |
|----------|-----------|-----------|-----------|
| Complexity | | | |
| Time estimate | | | |
| Risk level | | | |
| Scalability | | | |
| Recommendation | | | |

Ask user to select or combine approaches.

### Phase 3: YAGNI Review

For each requirement identified so far, classify:

| Requirement | Classification | Rationale |
|-------------|---------------|-----------|
| ... | Must-have | Core to the feature |
| ... | Nice-to-have | Useful but not blocking |
| ... | YAGNI | Not needed now, defer |

Remove YAGNI items from the plan scope. Move Nice-to-have items to a "Future Considerations" section.

### Phase 4: Incremental Design Validation

Present the plan section by section for approval:

1. Show **Objective & Scope** — wait for approval.
2. Show **Requirements** — wait for approval.
3. Show **Technical Approach** — wait for approval.
4. Show **Success Criteria** — wait for approval.
5. Show **Risk Assessment** — wait for approval.

If the user requests changes to any section, revise and re-present that section.

### Phase 5: Plan Document Generation

After all sections are approved:

1. Generate the full Plan document using `templates/plan.template.md`.
2. Save to `docs/01-plan/features/{feature}.plan.md`.
3. Update `.pdca-status.json` with plan completion.
4. Create tracker task: `[Plan-Plus] {feature}`.

### Phase 6: Next Steps

Guide the user to the next PDCA phase:

- Recommend `/pdca design {feature}` to proceed to Design phase.
- Summarize key decisions made during planning.
- List any deferred items (Nice-to-have / YAGNI) for future reference.

## Arguments

| Argument | Description | Example |
|----------|-------------|---------|
| `[feature]` | Feature name to plan | `/plan-plus user-auth` |

## References

- `${extensionPath}/templates/plan.template.md`
- `${extensionPath}/skills/pdca/SKILL.md`
