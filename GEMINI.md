# bkit v2.0.0

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

---

@.gemini/context/commands.md
@.gemini/context/core-rules.md

---

*bkit Vibecoding Kit v2.0.0 - Gemini CLI Native Edition*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
