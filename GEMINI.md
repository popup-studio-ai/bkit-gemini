# bkit v2.0.7

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

## Gemini CLI v0.42.0 Stable Compatibility (v2.0.7)

bkit v2.0.7 supports Gemini CLI **v0.34.0 minimum** through **v0.42.0 stable (tested)**. The 5-version cumulative migration (v0.40.0 → v0.40.1 → v0.41.0 → v0.41.1 → v0.41.2 → v0.42.0) was absorbed in a single sprint without breaking existing behavior.

**Key behavior locks** (`.gemini/settings.json` — pinned by this extension):
- `experimental.gemma: false` — prevents Gemini CLI v0.42.0's Gemma 4 default-on regression (Cx13 / [PR #26307](https://github.com/google-gemini/gemini-cli/pull/26307)). Users wanting Gemma must opt in explicitly.
- `experimental.autoMemory: false` — Auto Memory inbox flow (Cx2, introduced in v0.41.0) is opt-in; bkit defers adoption to the v2.1.0 cycle.
- `experimental.memoryManager: false` — memoryManager (v0.41.x) is opt-in for the same reason.
- `general.topicUpdateNarration: false` — topic-narration noise suppression.
- `experimental.enableAgents: true` — bkit agent catalog visibility (existing setting, unchanged).

**Capability flags** (28 total in `lib/gemini/version.js`, 9 new in this cycle):
- v0.40.0+ (4): `hasContinueOnFailedApiCallRemoved`, `hasNewToolDisplay`, `hasExitPlanModeShellBan`, `hasSetSessionIdReset`
- v0.41.0+ (4): `hasA2aServerSplit`, `hasAutoMemoryInbox`, `hasIgnoreEnvFlag`, `hasPromptUndeprecated`
- v0.42.0+ (1): `hasGemmaDefaultOn` (Cx13 lock trigger)

**PR #25827 (SessionStart `systemMessage` duplicate fix) retention**: MERGED into upstream `main` on 2026-05-11 but NOT cherry-picked into the v0.42.0 release branch. The bkit workaround (`BKIT_SESSION_START_VERBOSE` slim default + `tc113`/`tc114` + 5 environment-variable-explicit test cases + `GEMINI.md` env-var documentation) is **retained for the v0.42.0 cycle and slated for removal in the v0.43.0 stable migration cycle**. Do not attempt manual removal until the v0.43.0 cycle completes.

**Known limitation R-extra-1 (pre-existing from v0.39.1, NOT a v0.42.0 regression)**: `gemini agents list` correctly reports the 21 bkit agents under both v0.39.1 and v0.42.0, but invoking a specific agent via `gemini -p "Use the <agent> agent..."` returns HTTP 404 from `LocalSubagentInvocation.execute` and falls back to the `generalist` agent. The fallback produces correct LLM output. Specialized agent dispatch will be wired into Gemini CLI's native subagent registry in the `v2.1.0-agent-dispatch-fix` sprint. See `docs/01-plan/sprints/v2.1.0-agent-dispatch-fix-master-plan.md`.

**Symbolic link**: `~/.gemini/extensions/bkit -> /Users/popup-kay/Documents/GitHub/popup/bkit-gemini` — verified loading under both `gemini` (v0.39.1) and `npx --yes @google/gemini-cli@0.42.0`. `bkit Vibecoding Kit v2.0.7 activated` confirmation observed in both environments.

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

*bkit Vibecoding Kit v2.0.7 - Gemini CLI Native Edition*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
