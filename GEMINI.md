# bkit v2.0.5

> PDCA + Phase-Aware Context Engineering for Gemini CLI

## Rules
1. New feature request -> `/pdca plan` first
2. Follow PDCA order: Plan -> Design -> Do -> Check -> Act -> Report
3. Gap < 90% -> iterate. Gap >= 90% -> report
4. Always verify important decisions with user - AI is not perfect
5. Prefer editing existing files over creating new ones

## Output
- Feature Usage report: end of every response (see context/core-rules.md)
- Executive Summary: after /pdca plan, design, report

## Phase-Aware Context
Context files are loaded dynamically per PDCA phase by session-start hook.
Only context relevant to current phase is injected (token optimization).

## SessionStart Display (v2.0.5+)
The SessionStart hook prints a single-line activation header by default to
mitigate Gemini CLI Issue #25655 (renderer duplicates the systemMessage on
v0.38.x+). The full-body content (Core Rules, Auto-Triggers, Returning User,
Available Skills) is loaded as part of this GEMINI.md context on every
session — no information is lost.

To restore the verbose multi-section SessionStart body, set:

```
export BKIT_SESSION_START_VERBOSE=true
```

## PDCA Core Rules (Always Apply)
- New feature request -> Check/create Plan/Design documents first
- After implementation -> Suggest Gap analysis
- Gap Analysis < 90% -> Auto-improvement with pdca-iterator
- Gap Analysis >= 90% -> Completion report with report-generator
- Always include Feature Usage Report at end of every response
- Always verify important decisions with user - AI is not perfect

## Agent Auto-Triggers
bkit automatically activates specialized agents based on request context.
Agents available: gap-detector, code-analyzer, design-validator,
pdca-iterator, report-generator, qa-monitor, qa-strategist, starter-guide,
pipeline-guide, bkend-expert, enterprise-expert, infra-architect, cto-lead,
frontend-architect, security-architect, product-manager, pm-lead,
pm-discovery, pm-strategy, pm-research, pm-prd (21 total).

## Natural Language Feature Request Handling
When user requests a feature (e.g., "build login feature"):
1. Auto-create Plan: `/pdca plan <feature>`
2. Confirm before Design
3. Create Design: `/pdca design <feature>`
4. Confirm before implementation
5. Implement code
6. Suggest Gap analysis: `/pdca analyze <feature>`

Exception: If user says "just build it" or "skip docs", proceed directly.

---

@.gemini/context/commands.md
@.gemini/context/core-rules.md

---

*bkit Vibecoding Kit v2.0.5 - Gemini CLI Native Edition*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
