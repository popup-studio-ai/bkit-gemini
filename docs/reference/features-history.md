# bkit Features History

> v1.5.x ~ v2.0.7 변경 이력. Moved from README.md §Features during v2.0.7-S4
> onboarding-slim sprint.
> Back to: [README](../../README.md) | Current release notes: [CHANGELOG](../../CHANGELOG.md)

## Features

### v2.0.7 Highlights (Gemini CLI v0.40.0~v0.42.0 stable migration + Context Engineering 고도화)

#### Context-Driven Development: Convergence with Google's Conductor Philosophy

Google's official [Conductor announcement](https://developers.googleblog.com/conductor-introducing-context-driven-development-for-gemini-cli/) (developers.googleblog.com, 2025-12-17) defines "context-driven development" with the same principles bkit has implemented since v1.x. bkit achieved this convergence **approximately 1 year before** Google's formal announcement.

| Conductor Principle | bkit Equivalent | bkit Implementation |
|---|---|---|
| "Plan before you build" | `/pdca plan` phase | `docs/01-plan/features/<feature>-migration.plan.md` |
| "Persistent markdown specs" | PDCA 6-phase artifacts | `docs/01-plan` ~ `docs/04-report` 산출물 |
| "Review plans before code is written" | GEMINI.md Rule #4: "Always verify important decisions with user" | `hooks/scripts/session-start.js` |
| "control your code" | "No Guessing" principle | `session-start.js:159` |

Additional external alignment (independent corroboration):
- **Andrej Karpathy** (X, [2025-06-26](https://x.com/karpathy/status/1937902205765607626)) — "context engineering is the delicate art and science of filling the context window"
- **Tobi Lütke** (Shopify CEO, 2025-06) — "the art of providing all the context for the task to be plausibly solvable by the LLM"
- **Anthropic** ([2025-09-29](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)) — "strategies for curating and maintaining the optimal set of tokens (information) during LLM inference"

bkit's PDCA + Phase-Aware Context Engineering operationalizes these principles via 6 explicit phases (plan/design/do/check/act/idle) with `PHASE_CONTEXT_MAP` reducing idle session tokens by ~60%.

#### Removed Lock (v2.0.7-upgrade D-A1 Option B)

- `general.topicUpdateNarration: false` — **Removed in v2.0.7-upgrade sprint** (2026-05-14). The previous lock lacked explicit justification (anti-pattern A1 in D-axis matrix). Gemini CLI's default `true` ([PR #25586](https://github.com/google-gemini/gemini-cli/pull/25586)) is now retained. Users who prefer narration suppression can opt in via their own `.gemini/settings.json`.

#### Compatibility Migration (commit `1b452ef`)

- **Tested up to Gemini CLI v0.42.0 stable** -- testedVersions array expanded from 15 to 21 entries (`0.40.0`, `0.40.1`, `0.41.0`, `0.41.1`, `0.41.2`, `0.42.0` added in this cycle)
- **9 New Capability Flags** in `lib/gemini/version.js` -- v0.40.0+ (4): `hasContinueOnFailedApiCallRemoved`, `hasNewToolDisplay`, `hasExitPlanModeShellBan`, `hasSetSessionIdReset` / v0.41.0+ (4): `hasA2aServerSplit`, `hasAutoMemoryInbox`, `hasIgnoreEnvFlag`, `hasPromptUndeprecated` / v0.42.0+ (1): `hasGemmaDefaultOn`. **Total feature flags now 28** (was 19).
- **Cx13 Gemma 4 Default-On Lock** -- `.gemini/settings.json` now pins `experimental.gemma: false` to prevent the v0.42.0 default-on behavior change introduced by [PR #26307](https://github.com/google-gemini/gemini-cli/pull/26307). Users wanting Gemma must explicitly opt in.
- **`.gemini/settings.json` 4 Explicit Locks** -- `experimental.gemma: false` (Cx13), `experimental.autoMemory: false`, `experimental.memoryManager: false`, `general.topicUpdateNarration: false`. All four are verified by `jq` and `tc38` matrix.
- **tc38 Feature Flags Matrix Expanded** -- 7 → 10 version rows (v0.40.0 / v0.41.0 / v0.42.0 added), 29 test assertions covering all 9 new capability flags. Backward-compatible: existing v0.26.0~v0.33.0 assertions unchanged.
- **PR #25827 Workaround Retention** -- The SessionStart `systemMessage` duplicate fix ([PR #25827](https://github.com/google-gemini/gemini-cli/pull/25827)) was **MERGED into `main` on 2026-05-11 but NOT cherry-picked into the v0.42.0 release branch**. bkit retains the workaround across 9 file locations (`hooks/scripts/session-start.js`, `tc113`, `tc114`, 5 environment-variable-explicit test cases, and the `GEMINI.md` env-var documentation). Slated for removal in the v0.43.0 stable migration cycle.
- **Dual-Version Compatibility Verified** -- Sprint v0.42.0-stable-migration ran every Wave under both `gemini` (locally installed v0.39.1) and `npx --yes @google/gemini-cli@0.42.0`. Symbolic link `~/.gemini/extensions/bkit -> bkit-gemini` loads correctly under both environments; `bkit Vibecoding Kit v2.0.7 activated` confirmation observed in both.
- **Known Limitation R-extra-1 (carry to v2.1.0-agent-dispatch-fix sprint)** -- `gemini agents list` correctly reports the 21 bkit agents under both v0.39.1 and v0.42.0, but `gemini -p "Use the <agent> agent..."` returns `404` from `LocalSubagentInvocation.execute` and falls back to the `generalist` agent. This is a **pre-existing condition inherited from v0.39.1**, not introduced by v0.42.0. The fallback path produces correct LLM responses, but specialized agent dispatch is not currently wired into Gemini CLI's native subagent registry. Tracked separately; see `docs/01-plan/sprints/v2.1.0-agent-dispatch-fix-master-plan.md` (post-merge).
- **Baseline Recovery** -- `node tests/run-all.js` baseline 1939/2046 passed (94.8%) under both `GEMINI_CLI_VERSION=0.39.1` and `GEMINI_CLI_VERSION=0.42.0` environments. tc113 (SessionStart duplication defense) 8/8, tc115 (v0.39.1 headless trust) 8/8. Carry items 9 (see `docs/04-report/v0.42.0-stable-migration-report.md`).

### v2.0.0 Highlights

- **Gemini CLI Native Architecture** -- Complete removal of Claude Code legacy; standalone Gemini CLI extension with zero external dependencies
- **Phase-Aware Context** -- `PHASE_CONTEXT_MAP` loads only relevant context files per PDCA phase (plan/design/do/check/act/idle), reducing idle session tokens by ~60%
- **3-Tier Agent Security Model** -- `readonly` (8 agents, read-only), `docwrite` (6 agents, file creation), `full` (3 agents, implementation/orchestration) with TOML Policy Engine enforcement
- **19 Feature Flags** -- Version-gated capabilities for Gemini CLI v0.30.0~v0.34.0+ (Policy Engine, Project-Level Policy, Extension Policies, Task Tracker, RuntimeHook)
- **Skill Visibility Control** -- Level-based skill filtering (Starter: 5 skills, Dynamic: 22 skills, Enterprise: all)
- **Flat Module Architecture** -- `lib/gemini/` replaces adapter pattern; direct imports with no bridge modules
- **115 v2.0.0 Test Cases** -- Sprint 5 (103 TCs) + Sprint 6 (12 TCs) covering architecture migration, security tiers, and policy engine
- **Minimum CLI Version: v0.34.0** -- Leverages native skill system, ACP, extension validation, and subagent policies

### v1.5.8 Highlights

- **PM Agent Team** -- 5 new agents (pm-lead, pm-discovery, pm-strategy, pm-research, pm-prd) for comprehensive product discovery before PDCA Plan phase
- **Team Orchestration** -- 9 modules with 5 patterns (Leader, Council, Swarm, Pipeline, Watchdog) for coordinated multi-agent workflows
- **6 New Skills** -- plan-plus (brainstorming-enhanced planning), simplify (code quality review), batch (parallel PDCA), loop (recurring execution), output-style-setup, pm-discovery
- **6 New Commands** -- `/plan-plus`, `/simplify`, `/batch`, `/loop`, `/output-style-setup`, `/pm-discovery`
- **Skills 2.0 Classification** -- 35 skills categorized as Workflow (9), Capability (25), or Hybrid (1)
- **Path Registry** -- Centralized state file management in `lib/core/paths.js` with auto-migration from legacy paths
- **972 Test Cases** -- 78 test suites covering 11 perspectives (unit, E2E, integration, scenario, philosophy, security, edge cases, recovery)
- **Gemini CLI v0.33.x Compatibility** -- Tested through v0.33.0-preview.4

### v1.5.7 Highlights

- **Gemini CLI v0.32.x Compatibility** -- 11 new feature flags for Task Tracker, Extension Policies, Model Family Toolsets, A2A Streaming, and more
- **23 Built-in Tools** -- 6 new Task Tracker tools registered (tracker_create_task, tracker_update_task, tracker_get_task, tracker_list_tasks, tracker_add_dependency, tracker_visualize)
- **SDK RuntimeHook Dual-Mode** -- 6 hot-path hooks converted to SDK function export + stdin command fallback for 40-97% latency reduction
- **Extension Policy Engine** -- Tier 2 TOML extension policy replacing deprecated excludeTools in gemini-extension.json
- **Task Tracker - PDCA Bridge** -- Instruction-based bridge connecting PDCA workflow to native Task Tracker (v0.32.0+)
- **Bug Guards** -- AfterAgent loop guard (Issue #20426) and sub-agent timeout cap (600s) with SIGTERM→SIGKILL escalation
- **Nightly Version Parsing** -- parseVersion() now handles `0.34.0-nightly.20260304` format

### v1.5.6 Highlights

- **Gemini CLI v0.31.0 Compatibility** -- 9 new feature flags including RuntimeHook functions, Browser Agent, Tool Annotations, and Project-Level Policy
- **Tool Annotations** -- readOnlyHint, destructiveHint, idempotentHint metadata for all 17 built-in tools enabling trust model and parallel execution optimization
- **Level-Specific Policy Engine** -- Auto-generated Tier 3 TOML policies per project level (Starter: restrictive, Dynamic: balanced, Enterprise: permissive)
- **Hook Adapter Module** -- RuntimeHook function detection and SDK migration preparation for v1.6.0
- **Enhanced Version Detector** -- 17 feature flags organized by CLI version (v0.26.0+, v0.29.0+, v0.30.0+, v0.31.0+)

### v1.5.5 Highlights

- **Gemini 3 Model Migration** -- All 16 agents updated to `gemini-3-pro` (9) and `gemini-3-flash` (7)
- **Version Detector** -- 3-strategy Gemini CLI version detection with feature flags and caching
- **Policy Engine Migrator** -- Auto-converts bkit permissions to v0.30.0 TOML policy format
- **Forward Alias Layer** -- Pre-mapped future tool name changes for seamless CLI upgrades
- **v0.30.0 Forward Compatibility** -- Policy Engine support with auto-generate and fallback

### v1.5.3 Highlights

- **Gemini CLI v0.29.0+ Compatibility** -- All tool names verified from source code (Issue #5 fix)
- **Tool Registry Module** -- Centralized tool name management for future-proof maintenance
- **17 Built-in Tools Mapped** -- Including new Plan Mode tools (enter_plan_mode, exit_plan_mode)
- **v0.30.0 Readiness** -- Policy Engine detection layer for smooth migration

### v1.5.2 Highlights

- **8 bkend.ai Domain Skills** -- quickstart, auth, data, storage, mcp, security, cookbook, guides
- **8 bkend.ai Commands** -- TOML commands for each bkend domain skill
- **bkend-expert Agent Rewrite** -- Complete rewrite with 28 MCP tools, bkendFetch pattern, 15 troubleshooting entries
- **16 Specialized Agents** with Gemini native frontmatter (model, tools, temperature, max_turns, timeout_mins)
- **29 Domain Skills** with progressive disclosure to save context tokens
- **10-Event Hook System** covering the full Gemini CLI lifecycle
- **PDCA Methodology** with automatic phase transitions and enforcement
- **Context Engineering** with 3-layer architecture (Domain Knowledge, Behavioral Rules, State Management)
- **8-Language Support** -- EN, KO, JA, ZH, ES, FR, DE, IT with auto-detection
- **4 Output Styles** -- bkit-learning, bkit-pdca-guide, bkit-enterprise, bkit-pdca-enterprise
- **Agent Memory** -- Per-agent persistent storage across sessions (project/user scope)
- **Team Mode Foundation** -- 3 MCP tools for agent team coordination
- **Skill Orchestrator** -- Custom YAML parser, agent delegation, template auto-loading
- **Context Hierarchy** -- 4-level config merge (Plugin -> User -> Project -> Session)
- **Permission Manager** -- Glob pattern matching with PDCA phase restrictions
- **9-Stage Development Pipeline** -- From schema design to deployment
- **3 Project Levels** -- Starter (static), Dynamic (fullstack), Enterprise (microservices)
- **@import Modularization** -- GEMINI.md split into 6 focused context modules
- **Evaluator-Optimizer Pattern** -- Automatic iteration from Anthropic's agent architecture

---

