# bkit v2.0.7

> PDCA + Phase-Aware Context Engineering for Gemini CLI

## Context-Driven Development

bkit's PDCA + Phase-Aware Context Engineering aligns with Google's
[Conductor: context-driven development for Gemini CLI](https://developers.googleblog.com/conductor-introducing-context-driven-development-for-gemini-cli/)
(2025-12-17). bkit shipped the same model ~1 year before. See README.md
"v2.0.7 Highlights" for the full alignment matrix and external references.

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
SessionStart prints a single-line header by default (Issue #25655 mitigation).
The full body is loaded via GEMINI.md on every session — no info lost.
Restore verbose body: `export BKIT_SESSION_START_VERBOSE=true`.

## Gemini CLI v0.42.0 Compatibility (v2.0.7)

Supports v0.34.0 minimum through v0.42.0 stable (tested). 5-version
cumulative migration absorbed in one sprint. Details: README.md.

Behavior locks in `.gemini/settings.json`:
- `gemma: false` — prevents v0.42.0 Gemma 4 default-on (Cx13).
- `autoMemory: false`, `memoryManager: false` — opt-in, deferred to v2.1.0.
- `enableAgents: true` — bkit agent catalog visibility.

Removed lock (v2.0.7 D-A1 Option B): `topicUpdateNarration` returned to
Gemini CLI default (`true`). Users may set `false` in their own settings.

R-extra-1 (pre-existing from v0.39.1): specialized agent dispatch via
`gemini -p` returns 404 and falls back to `generalist`. Fix slated for
v2.1.0-agent-dispatch-fix sprint.

## PDCA Core Rules
- New feature request -> create Plan/Design first
- After implementation -> Suggest Gap analysis
- Gap < 90% -> pdca-iterator. Gap >= 90% -> report-generator
- Always include Feature Usage Report at end of every response
- Always verify important decisions with user

## Agent Auto-Triggers
21 specialized agents available: gap-detector, code-analyzer,
design-validator, pdca-iterator, report-generator, qa-monitor,
qa-strategist, starter-guide, pipeline-guide, bkend-expert,
enterprise-expert, infra-architect, cto-lead, frontend-architect,
security-architect, product-manager, pm-lead, pm-discovery,
pm-strategy, pm-research, pm-prd.

## Natural Language Feature Request Handling
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

*bkit Vibecoding Kit v2.0.7 - Gemini CLI Native Edition*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
