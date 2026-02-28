# Feature Enhancement Proposals & Innovation Opportunities

> **Summary**: Comprehensive feature enhancement proposals for bkit-gemini leveraging Gemini CLI 0.31.0 stable capabilities
>
> **Project**: bkit-gemini
> **Current Version**: v1.5.5
> **Target Versions**: v1.6.0, v1.7.0, v2.0.0
> **Author**: Innovation Lead (AI-assisted)
> **Date**: 2026-02-28
> **Status**: Complete

---

## 1. Executive Summary

bkit v1.5.5 has established itself as a mature Gemini CLI extension with 29 Skills, 16 Agents, 10 Hook Events, and full PDCA methodology integration. Gemini CLI 0.31.0 stable introduces transformative capabilities -- RuntimeHook functions, Session-based SDK, Browser Agent, deep Plan Mode integration, and the Extension Registry -- that create a generational upgrade opportunity.

This document presents 10 ranked proposals with a phased innovation roadmap, competitive moat analysis, and technical feasibility assessment.

### Key Findings

- **3 proposals are P0** (RuntimeHook migration, SDK integration, Extension Registry) forming the foundation for all future work
- **Estimated cumulative impact**: 60-70% performance improvement in hook execution, 40% reduction in context token waste, and first-mover advantage in the Extension Registry
- **Total effort**: ~45-65 days across three release cycles (v1.6.0, v1.7.0, v2.0.0)
- **Risk profile**: Low-Medium overall; highest risk is SDK API stability

---

## 2. Top 10 Proposals Ranked by Impact/Effort Ratio

### Proposal #1: RuntimeHook Functions Migration

| Dimension | Detail |
|-----------|--------|
| **What** | Convert all 10 hook events from `type: "command"` (spawning `node` processes) to `type: "function"` (in-process execution) |
| **Why** | Each hook currently spawns a new Node.js process via `node ${extensionPath}/hooks/scripts/*.js`. With 10 hooks firing frequently during a session, this creates significant latency overhead. RuntimeHook functions (#19598) run in-process, eliminating cold-start penalties. For bkit specifically, the `BeforeAgent` intent detection hook fires on every user message -- sub-millisecond execution here directly improves perceived responsiveness. |
| **How** | 1. Create `hooks/functions/` directory with ES module exports matching each hook script. 2. Refactor each hook script to export a `handler(context)` function alongside the existing CLI entry point. 3. Update `hooks.json` to use `type: "function"` with `module` paths. 4. Maintain backward-compatible `type: "command"` fallback via version detection (`hasRuntimeHookFunctions` flag). 5. Run benchmark comparison (process spawn vs function call) across all 10 events. |
| **Impact** | **HIGH** -- 60-70% latency reduction per hook invocation, ~10 fewer process spawns per user message cycle |
| **Effort** | 5-7 days |
| **Priority** | **P0** |
| **Dependencies** | Gemini CLI 0.31.0 RuntimeHook functions API finalized |
| **Risk** | Low. The refactoring is mechanical -- extract handler functions from existing scripts. Backward compatibility maintained via version detection (already implemented in `version-detector.js`). Risk: function hooks may have different `context` object shape than command hooks receive via stdin. Mitigation: integration tests for all 10 hooks. |

**hooks.json migration example:**
```json
// Before (v1.5.5)
{
  "name": "bkit-session-init",
  "type": "command",
  "command": "node ${extensionPath}/hooks/scripts/session-start.js",
  "timeout": 5000
}

// After (v1.6.0)
{
  "name": "bkit-session-init",
  "type": "function",
  "module": "${extensionPath}/hooks/functions/session-start.mjs",
  "export": "handler",
  "timeout": 2000
}
```

---

### Proposal #2: Extension Registry Listing

| Dimension | Detail |
|-----------|--------|
| **What** | Publish bkit to the official Gemini CLI Extension Registry, enabling `gemini extensions install bkit` |
| **Why** | Currently bkit requires manual git clone and configuration. The Extension Registry (geminicli.com/extensions) is the primary discovery channel for Gemini CLI users. Being listed early -- before competitors -- establishes category ownership for "PDCA + Context Engineering" extensions. Every installation via the registry is zero-friction adoption. |
| **How** | 1. Verify `gemini-extension.json` meets registry schema requirements. 2. Add required metadata: screenshots, demo GIF, category tags. 3. Submit to the registry via `gemini extensions publish`. 4. Set up CI/CD pipeline for automated registry updates on version bumps. 5. Add registry badge to README.md. |
| **Impact** | **HIGH** -- Distribution moat, zero-friction installation, discoverability |
| **Effort** | 2-3 days |
| **Priority** | **P0** |
| **Dependencies** | Extension Registry accepting submissions; gemini-extension.json compliance |
| **Risk** | Low. The registry schema is well-documented. Risk: registry review/approval delay. Mitigation: submit early, iterate on feedback. |

---

### Proposal #3: Session-based SDK Integration

| Dimension | Detail |
|-----------|--------|
| **What** | Adopt `@google/gemini-cli-core` SDK for SessionContext API, replacing ad-hoc state management in hook scripts |
| **Why** | bkit currently manages session state through file-based mechanisms (`.pdca-status.json`, `.gemini/agent-memory/`). The SDK's SessionContext API (#19180) provides structured state management with proper lifecycle guarantees -- state persists across context compressions, integrates with Plan Mode, and supports dynamic system instructions. This eliminates an entire class of state-sync bugs (e.g., PDCA phase state lost during context compaction). |
| **How** | 1. Add `@google/gemini-cli-core` as peer dependency. 2. Create `lib/adapters/gemini/session-context.js` adapter wrapping the SDK's SessionContext. 3. Migrate PDCA status from `.pdca-status.json` to SessionContext state. 4. Migrate agent memory from file-based to SessionContext with file fallback. 5. Implement dynamic system instructions for PDCA phase transitions (inject phase-specific rules without reloading GEMINI.md). 6. Maintain file-based fallback for Gemini CLI versions without SDK. |
| **Impact** | **HIGH** -- Eliminates state-sync bugs, enables dynamic context injection, future-proofs architecture |
| **Effort** | 8-10 days |
| **Priority** | **P0** |
| **Dependencies** | `@google/gemini-cli-core` npm package stable release; RuntimeHook functions (Proposal #1) for optimal integration |
| **Risk** | Medium. The SDK API may still evolve between preview and stable. Mitigation: adapter pattern isolates SDK surface area; file-based fallback ensures graceful degradation. |

---

### Proposal #4: Plan Mode Deep Integration

| Dimension | Detail |
|-----------|--------|
| **What** | Integrate bkit's PDCA Plan phase with Gemini CLI's native Plan Mode -- custom plan storage in `docs/01-plan/`, automatic model switching, and PDCA context injection on Plan Mode exit |
| **Why** | bkit's PDCA methodology already has a Plan phase (`/pdca plan`), but it operates independently from Gemini CLI's Plan Mode. Users may use either or both, causing confusion. Deep integration means: `/pdca plan` activates Gemini CLI Plan Mode natively; plans are stored in bkit's doc structure; exiting Plan Mode auto-transitions to PDCA Design phase with relevant context injected. This creates a seamless workflow where PDCA methodology and Gemini CLI Plan Mode are one unified experience. |
| **How** | 1. Configure Plan Mode custom storage directory to `docs/01-plan/features/`. 2. Implement `ExitPlanMode` hook handler that detects PDCA context and injects Design phase instructions. 3. Configure automatic model switching: `gemini-3-flash` for Plan Mode (cheap, fast ideation), `gemini-3.1-pro` for implementation. 4. Update `/pdca plan` skill to invoke `enter_plan_mode` tool when Gemini CLI supports it. 5. Add Plan Mode state to PDCA status tracking. |
| **Impact** | **HIGH** -- Unified workflow, cost optimization via model switching, smoother PDCA transitions |
| **Effort** | 4-5 days |
| **Priority** | **P1** |
| **Dependencies** | Plan Mode custom storage API (Gemini CLI 0.31.0); SessionContext for state injection (Proposal #3) |
| **Risk** | Low. Plan Mode is GA since v0.29.0. Risk: custom storage directory API may have constraints on path format. Mitigation: test with relative and absolute paths. |

---

### Proposal #5: Policy Engine Auto-Generation per Project Level

| Dimension | Detail |
|-----------|--------|
| **What** | Auto-generate optimized `.gemini/policies/*.toml` files based on bkit's 3 project levels (Starter/Dynamic/Enterprise) |
| **Why** | bkit already has `policy-migrator.js` that converts `bkit.config.json` permissions to TOML. The opportunity is to generate level-specific policies: Starter gets restrictive policies (safe for beginners), Dynamic gets balanced policies, Enterprise gets permissive policies with audit logging. This leverages Gemini CLI's per-project policy tier (#19046) to provide right-sized guardrails. Additionally, bkit can validate that user-created policies don't conflict with bkit's requirements. |
| **How** | 1. Create policy templates for each level in `templates/policies/`. 2. Extend `policy-migrator.js` with `generateLevelPolicy(level)` method. 3. Hook into `SessionStart` to detect project level and generate/validate policies. 4. Add policy conflict detection: warn if user policies override bkit safety rules. 5. Support `bkit.config.json` -> TOML policy sync on config changes. |
| **Impact** | **MEDIUM** -- Better security posture, level-appropriate guardrails, reduced misconfiguration |
| **Effort** | 3-4 days |
| **Priority** | **P1** |
| **Dependencies** | Policy Engine (already supported since v0.30.0); level detection (already implemented) |
| **Risk** | Low. Policy TOML generation is already working. Risk: policy conflicts between bkit-generated and user-created policies. Mitigation: conflict detection with clear warnings. |

---

### Proposal #6: Tool Annotation Matching for Agent Safety

| Dimension | Detail |
|-----------|--------|
| **What** | Add `readOnlyHint`, `destructiveHint`, and `idempotentHint` annotations to all bkit MCP tools and agent configurations |
| **Why** | Gemini CLI now uses tool annotations for safer execution -- tools marked `readOnlyHint: true` can run in parallel without confirmation, while `destructiveHint: true` tools require explicit approval. bkit's MCP server (`spawn-agent-server.js`) exposes tools like `spawn_agent`, `team_create`, `gap_analyze` without annotations. Adding proper annotations enables: (1) parallel read-only tool execution for faster gap analysis, (2) automatic confirmation prompts for destructive operations, (3) compatibility with Gemini CLI's trust model. |
| **How** | 1. Audit all MCP tools in `spawn-agent-server.js` and classify as read-only, destructive, or idempotent. 2. Add `annotations` field to each tool's JSON schema definition. 3. Update `before-tool-selection.js` to respect annotations (current `readOnlyTools` array becomes annotation-driven). 4. Map agent tool permissions to annotation hints. 5. Document annotation policy in `tool-reference.md`. |
| **Impact** | **MEDIUM** -- Safer execution, parallel read-only operations, Gemini CLI trust model alignment |
| **Effort** | 2-3 days |
| **Priority** | **P1** |
| **Dependencies** | Gemini CLI 0.31.0 tool annotation support; Parallel Read-Only Tool Calls (#18791) |
| **Risk** | Low. Additive change -- annotations are metadata that don't affect existing behavior. Risk: incorrect annotation classification. Mitigation: conservative defaults (default to non-read-only). |

---

### Proposal #7: Agent Model Matrix Optimization (Gemini 3.1 Pro + Flash Lite)

| Dimension | Detail |
|-----------|--------|
| **What** | Implement a dynamic agent model matrix that assigns optimal Gemini models to each of the 16 agents based on task complexity, cost, and latency requirements |
| **Why** | v1.5.5 already started model optimization (cto-lead/gap-detector -> gemini-3.1-pro, report-generator/qa-monitor -> flash-lite). The opportunity is to systematize this: create a model matrix that maps agent capabilities to model strengths. Gemini 3.1 Pro excels at reasoning-heavy tasks (ARC-AGI-2 77.1%), Flash Lite at high-throughput low-cost tasks. A well-tuned matrix can reduce API costs by 40-50% while maintaining or improving output quality. |
| **How** | 1. Create `lib/core/model-matrix.js` with per-agent model assignments. 2. Define model tiers: `reasoning` (gemini-3.1-pro), `balanced` (gemini-3-pro), `fast` (gemini-3-flash), `cheap` (gemini-3-flash-lite). 3. Add model override support in `bkit.config.json` for user customization. 4. Implement cost tracking in `AfterModel` hook to validate savings. 5. Add automatic tier selection based on task classification (quickFix -> cheap, feature -> reasoning). |
| **Impact** | **MEDIUM** -- 40-50% cost reduction, better model-task alignment, user-configurable |
| **Effort** | 3-4 days |
| **Priority** | **P1** |
| **Dependencies** | Gemini 3.1 Pro availability; agent frontmatter model field support |
| **Risk** | Low. Model assignment is already per-agent in frontmatter. Risk: some agents may perform worse with cheaper models. Mitigation: A/B testing framework, easy rollback via config. |

**Proposed Model Matrix:**
```
| Agent               | Current Model      | Proposed Model       | Tier      | Rationale |
|---------------------|--------------------|----------------------|-----------|-----------|
| cto-lead            | gemini-3.1-pro     | gemini-3.1-pro       | reasoning | Complex orchestration |
| gap-detector        | gemini-3.1-pro     | gemini-3.1-pro       | reasoning | Deep code analysis |
| code-analyzer       | gemini-3-pro       | gemini-3.1-pro       | reasoning | Security/quality analysis |
| enterprise-expert   | gemini-3-pro       | gemini-3.1-pro       | reasoning | Architecture decisions |
| security-architect  | gemini-3-pro       | gemini-3.1-pro       | reasoning | Security-critical |
| design-validator    | gemini-3-pro       | gemini-3-pro         | balanced  | Design review |
| frontend-architect  | gemini-3-pro       | gemini-3-pro         | balanced  | UI/UX decisions |
| product-manager     | gemini-3-pro       | gemini-3-pro         | balanced  | Product strategy |
| infra-architect     | gemini-3-pro       | gemini-3-pro         | balanced  | Infrastructure |
| pdca-iterator       | gemini-3-flash     | gemini-3-flash       | fast      | Iteration loops |
| starter-guide       | gemini-3-flash     | gemini-3-flash       | fast      | Beginner guidance |
| pipeline-guide      | gemini-3-flash     | gemini-3-flash       | fast      | Pipeline steps |
| bkend-expert        | gemini-3-flash     | gemini-3-flash       | fast      | BaaS integration |
| qa-strategist       | gemini-3-flash     | gemini-3-flash       | fast      | QA planning |
| report-generator    | gemini-3-flash-lite| gemini-3-flash-lite  | cheap     | Template fill |
| qa-monitor          | gemini-3-flash-lite| gemini-3-flash-lite  | cheap     | Log monitoring |
```

---

### Proposal #8: Browser Agent for Automated Research

| Dimension | Detail |
|-----------|--------|
| **What** | Create a new `browser-researcher` agent leveraging Gemini CLI's Browser Agent capability (#19284) for automated web research during PDCA Plan and Check phases |
| **Why** | PDCA Plan phase often requires research -- competitive analysis, library documentation, API references. Currently users must manually search and paste findings. The Browser Agent enables bkit to automatically: (1) research technology options during Plan phase, (2) validate design decisions against official documentation during Check phase, (3) capture visual mockup screenshots for design validation. This closes the loop on "AI-assisted research" within the PDCA workflow. |
| **How** | 1. Create `agents/browser-researcher.md` with Browser Agent tool access. 2. Integrate with `/pdca plan` skill: offer automated research for technology decisions. 3. Add `google_web_search` + browser tools to research workflows. 4. Create research report template in `templates/research.template.md`. 5. Implement research findings storage in `docs/01-plan/research/`. 6. Add rate limiting and domain allowlisting for safety. |
| **Impact** | **MEDIUM** -- Automated research, richer Plan documents, validated Design decisions |
| **Effort** | 5-6 days |
| **Priority** | **P2** |
| **Dependencies** | Browser Agent API stability; appropriate sandboxing/rate limiting |
| **Risk** | Medium. Browser Agent is relatively new. Risk: unreliable page rendering, blocked by CAPTCHAs, rate limiting by target sites. Mitigation: domain allowlist, fallback to `google_web_search`, caching of research results. |

---

### Proposal #9: MCP Progress Updates Dashboard

| Dimension | Detail |
|-----------|--------|
| **What** | Implement real-time progress reporting for long-running bkit operations (gap analysis, team orchestration, pipeline phases) using MCP Progress Updates (#19046) |
| **Why** | Complex bkit operations like gap analysis (reading design docs + scanning codebase + computing match rate) can take 30-60 seconds. Users currently see no feedback during this time. MCP Progress Updates enable real-time progress bars: "Scanning 15/42 source files..." or "Phase 3/9: Mockup validation...". This dramatically improves perceived performance and user confidence. |
| **How** | 1. Add `progressToken` support to `spawn-agent-server.js` MCP tool handlers. 2. Implement `reportProgress(token, current, total, message)` in key operations: gap analysis file scanning, team agent spawning, pipeline phase execution. 3. Create progress tracking wrapper in `lib/core/progress.js`. 4. Integrate with team orchestration: show agent status across team members. 5. Add progress events to `AfterTool` hook for analytics. |
| **Impact** | **MEDIUM** -- Better UX, perceived performance, user confidence during long operations |
| **Effort** | 3-4 days |
| **Priority** | **P2** |
| **Dependencies** | MCP Progress Updates (#19046) in Gemini CLI 0.31.0 |
| **Risk** | Low. Additive UX improvement. Risk: progress granularity may not be fine-grained enough for some operations. Mitigation: estimate-based progress for operations without natural checkpoints. |

---

### Proposal #10: Hybrid SKILL.md + SDK Skills

| Dimension | Detail |
|-----------|--------|
| **What** | Enable bkit skills to combine SKILL.md declarative prompts with SDK-based programmatic logic for complex workflows |
| **Why** | bkit's 29 skills are currently SKILL.md-only -- declarative markdown files with frontmatter. This works well for knowledge injection but limits complex workflows. Example: the `pdca` skill needs to read PDCA status, determine the current phase, load the right template, and execute phase-specific logic. Currently this logic is split between the skill, hook scripts, and lib modules. SDK-based skills (#19180) could encapsulate entire workflows: read state -> determine action -> execute -> update state, all within a single skill activation. |
| **How** | 1. Create `skills/sdk/` directory for SDK-enhanced skills. 2. Implement `PdcaSkill` class extending SDK's `SkillBase` with state management. 3. Convert complex skills (pdca, development-pipeline, enterprise) to hybrid format. 4. Keep simple skills (bkend-*, starter, code-review) as SKILL.md. 5. Create skill type detection in `skill-orchestrator.js`. 6. Document hybrid skill development in `templates/SKILL-SDK-GUIDE.md`. |
| **Impact** | **MEDIUM** -- More powerful skills, encapsulated workflows, cleaner architecture |
| **Effort** | 7-8 days |
| **Priority** | **P2** |
| **Dependencies** | Session-based SDK (Proposal #3); SDK Skill API stability |
| **Risk** | Medium. SDK skill API may change. Risk: increased complexity for skill authors. Mitigation: keep SKILL.md as the default for simple skills; only use SDK for genuinely complex workflows. |

---

## 3. Innovation Roadmap

### v1.6.0 -- "Foundation" (Target: March 2026)

**Theme**: Platform modernization and distribution

| # | Proposal | Priority | Effort | Key Deliverable |
|---|----------|----------|--------|-----------------|
| 1 | RuntimeHook Functions | P0 | 5-7d | In-process hooks, 60-70% latency reduction |
| 2 | Extension Registry | P0 | 2-3d | `gemini extensions install bkit` |
| 5 | Policy Engine per Level | P1 | 3-4d | Level-specific .toml policies |
| 6 | Tool Annotations | P1 | 2-3d | Read-only/destructive hints |
| 7 | Model Matrix | P1 | 3-4d | Optimized per-agent model assignments |

**Total effort**: 15-21 days
**Release criteria**: All hooks converted to functions, registry listing live, policy auto-generation working

### v1.7.0 -- "Intelligence" (Target: April 2026)

**Theme**: SDK integration and workflow intelligence

| # | Proposal | Priority | Effort | Key Deliverable |
|---|----------|----------|--------|-----------------|
| 3 | SDK Integration | P0 | 8-10d | SessionContext state, dynamic instructions |
| 4 | Plan Mode Integration | P1 | 4-5d | Unified PDCA + Plan Mode |
| 9 | MCP Progress Updates | P2 | 3-4d | Real-time progress bars |

**Total effort**: 15-19 days
**Release criteria**: SDK-based state management, Plan Mode produces PDCA docs, progress reporting on gap analysis

### v2.0.0 -- "Autonomy" (Target: June 2026)

**Theme**: Autonomous research, advanced skills, ecosystem maturity

| # | Proposal | Priority | Effort | Key Deliverable |
|---|----------|----------|--------|-----------------|
| 8 | Browser Agent | P2 | 5-6d | Automated research in PDCA Plan |
| 10 | Hybrid SDK Skills | P2 | 7-8d | Programmatic PDCA skill workflows |
| - | A2A Protocol | P3 | TBD | Cross-extension agent communication |
| - | Conductor Integration | P3 | TBD | Multi-extension orchestration |

**Total effort**: 15-20 days (core proposals only)
**Release criteria**: Browser research integrated into PDCA, SDK skills for pdca/pipeline/enterprise

### Roadmap Visualization

```
Mar 2026          Apr 2026          May 2026          Jun 2026
v1.6.0            v1.7.0                              v2.0.0
|                 |                                   |
[RuntimeHooks]----+
[Registry]--------+
[Policies]--------+
[Annotations]-----+
[Model Matrix]----+
                  [SDK Integration]---+
                  [Plan Mode]---------+
                  [Progress Updates]--+
                                                     [Browser Agent]-----+
                                                     [Hybrid Skills]-----+
                                                     [A2A Protocol]------+
```

---

## 4. Competitive Moat Analysis

### 4.1 Current Competitive Landscape

The AI coding tools market in 2026 has shifted from "Copilots" (code completion) to "Agents" (task completion). Key players:

- **GitHub Copilot Workspace**: Agentic planning-to-code, deep GitHub integration
- **Cursor AI**: AI-first IDE, inline editing, multi-file refactoring
- **Claude Code**: Agent-oriented, repository-level reasoning
- **Aider**: Open-source, git-integrated AI pair programming
- **Devin**: Autonomous software engineering agent

### 4.2 bkit's Competitive Position

bkit occupies a unique niche: **methodology-driven AI development** within the Gemini ecosystem. No other Gemini CLI extension implements structured PDCA methodology with Context Engineering.

### 4.3 Moat Components (Current)

| Moat Layer | Strength | Durability |
|------------|----------|------------|
| **PDCA Methodology** | Strong -- unique in Gemini ecosystem | High -- methodology is hard to copy correctly |
| **Context Engineering** | Strong -- 3-layer architecture (Skills/Agents/Hooks) | Medium -- pattern can be replicated |
| **29 Skills library** | Medium -- domain knowledge accumulation | Medium -- content moat grows over time |
| **10-Event Hook System** | Strong -- deepest Gemini CLI integration | Medium -- hooks API is public |
| **3 Project Levels** | Medium -- onboarding differentiation | Low -- easy to replicate |

### 4.4 Moat Enhancement Strategy

The proposed features strengthen the moat in three critical dimensions:

**1. Distribution Moat (Registry Listing)**
- First-mover in "PDCA" category on Extension Registry
- Zero-friction installation reduces barrier to adoption
- Network effects: more users -> more feedback -> better product

**2. Integration Depth Moat (RuntimeHooks + SDK + Plan Mode)**
- Deepest possible integration with Gemini CLI internals
- RuntimeHook functions = in-process execution = inseparable from the runtime
- SDK SessionContext = state shared with the CLI itself
- Plan Mode integration = bkit IS the planning experience

**3. Workflow Lock-in (PDCA + Context Engineering)**
- PDCA document structure (`docs/01-plan/`, `docs/02-design/`, etc.) becomes the project's documentation backbone
- Switching away means losing the entire PDCA document history
- Context Engineering architecture (skills, agents, hooks) creates compound value over time

### 4.5 Competitive Threats

| Threat | Probability | Impact | Mitigation |
|--------|-------------|--------|------------|
| Google builds PDCA-like features into Gemini CLI | Low | High | Stay ahead by 1-2 versions; contribute to Gemini CLI upstream |
| Competitor extension replicates bkit's approach | Medium | Medium | Registry first-mover + deeper integration + community building |
| Gemini CLI hooks API breaking changes | Medium | High | Adapter pattern, version detection, backward compatibility |
| Model quality parity eliminates need for methodology | Low | High | PDCA value is process discipline, not model quality |

---

## 5. Technical Feasibility Assessment

### 5.1 Feasibility Matrix

| Proposal | API Readiness | Codebase Impact | Breaking Changes | Test Coverage | Feasibility |
|----------|---------------|-----------------|------------------|---------------|-------------|
| #1 RuntimeHooks | Ready (0.31.0) | Medium (10 files) | None (backward compat) | High (per-hook tests) | **HIGH** |
| #2 Registry | Ready | Low (2 files) | None | Low (manual verify) | **HIGH** |
| #3 SDK | Preview | High (15+ files) | None (adapter pattern) | High (integration tests) | **MEDIUM** |
| #4 Plan Mode | Ready (0.29.0+) | Medium (5 files) | None | Medium | **HIGH** |
| #5 Policies | Ready (0.30.0+) | Low (3 files) | None | Medium | **HIGH** |
| #6 Annotations | Ready (0.31.0) | Low (2 files) | None | Low | **HIGH** |
| #7 Model Matrix | Ready | Medium (17 files) | None | Medium (per-agent) | **HIGH** |
| #8 Browser Agent | Preview | Medium (4 files) | None | Medium | **MEDIUM** |
| #9 Progress | Preview | Medium (3 files) | None | Low | **MEDIUM** |
| #10 Hybrid Skills | Preview | High (10+ files) | None | High | **MEDIUM** |

### 5.2 Architecture Impact

```
Current Architecture (v1.5.5):
  hooks.json -> command scripts -> lib modules -> file-based state

Proposed Architecture (v2.0.0):
  hooks.json -> function handlers ---|
                                     +--> SessionContext (SDK)
  SDK Skills -> SkillBase classes ---|     |
                                           +--> PDCA State
                                           +--> Agent Memory
                                           +--> Plan Mode State
                                           +--> Progress Tracking
```

The key architectural shift is from file-based state management to SDK-backed SessionContext, with RuntimeHook functions as the execution model. This is a non-breaking, incremental migration enabled by the adapter pattern already present in `lib/adapters/`.

### 5.3 Risk Summary

| Risk Category | Items | Overall Risk |
|---------------|-------|--------------|
| API Stability | SDK preview, Browser Agent preview | **Medium** |
| Breaking Changes | None -- all proposals maintain backward compatibility | **Low** |
| Complexity Growth | SDK integration adds ~500 LOC, hybrid skills add ~300 LOC | **Low-Medium** |
| Testing Burden | 10 hook tests + SDK integration tests + skill tests | **Medium** |
| Timeline Risk | SDK stable release timing uncertain | **Medium** |

---

## 6. Innovation Opportunities Beyond the Top 10

### 6.1 Emerging Opportunities (P3, Future Consideration)

**A2A (Agent-to-Agent) Protocol**: Cross-extension agent communication enabling bkit agents to coordinate with agents from other extensions (e.g., a testing extension's test-runner agent). Requires A2A protocol standardization.

**Conductor Extension Integration**: Multi-extension orchestration where bkit acts as the PDCA conductor, delegating specific phases to specialized extensions (security scanning extension for Check phase, deployment extension for Act phase).

**AI-Powered PDCA Retrospectives**: Use AfterAgent hook data and session telemetry to automatically generate PDCA retrospective reports: what worked, what didn't, suggested process improvements. Leverages the PDCA methodology's Act phase for continuous improvement of the development process itself.

**Multi-Language Skill Packs**: Create installable skill packs for specific tech stacks (React, Next.js, FastAPI, Go, Rust) that extend the base 29 skills with framework-specific knowledge. Distributed via Extension Registry as sub-extensions.

**Visual Design Validation via Browser Agent**: Capture screenshots of running application and compare against design mockups stored in `docs/02-design/`. Use Gemini's multimodal capabilities for pixel-level design-to-implementation gap analysis.

### 6.2 Industry Trend Alignment

| Trend (2026) | bkit Alignment | Gap |
|------|----------------|-----|
| Shift from Copilots to Agents | 16 specialized agents | Need autonomy improvements |
| Context-aware tooling | Context Engineering architecture | SDK integration will deepen this |
| AI-assisted SDLC | PDCA covers full lifecycle | Browser Agent fills research gap |
| Cost optimization | Model matrix, flash-lite agents | Need usage analytics dashboard |
| Developer trust & safety | Permission manager, policy engine | Tool annotations will improve this |
| Extension ecosystems | Gemini CLI extension | Registry listing is critical next step |

---

## 7. Conclusion

bkit v1.5.5 is well-positioned to leverage Gemini CLI 0.31.0's capabilities. The proposed roadmap prioritizes:

1. **v1.6.0 (Foundation)**: Performance (RuntimeHooks), distribution (Registry), safety (Policies, Annotations, Model Matrix) -- the "must-haves" that establish competitive position
2. **v1.7.0 (Intelligence)**: Architecture modernization (SDK), workflow unification (Plan Mode), UX polish (Progress) -- the "force multipliers" that deepen integration
3. **v2.0.0 (Autonomy)**: Research automation (Browser Agent), advanced workflows (Hybrid Skills) -- the "differentiators" that create sustainable advantage

The total investment of ~45-65 engineering days across three releases transforms bkit from a "powerful extension" into an "indispensable platform" -- deeply integrated with Gemini CLI's runtime, first in the Extension Registry, and the definitive implementation of PDCA methodology for AI-native development.

---

## References

- [Top 15 AI Coding Assistant Tools to Try in 2026](https://www.qodo.ai/blog/best-ai-coding-assistant-tools/)
- [Best AI Coding Agents for 2026: Real-World Developer Reviews](https://www.faros.ai/blog/best-ai-coding-agents-2026)
- [12 AI Coding Emerging Trends That Will Dominate 2026](https://medium.com/ai-software-engineer/12-ai-coding-emerging-trends-that-will-dominate-2026-dont-miss-out-dae9f4a76592)
- [A Plan-Do-Check-Act Framework for AI Code Generation](https://www.infoq.com/articles/PDCA-AI-code-generation/)
- [AI-Driven Business Development: A Complete PDCA Framework](https://medium.com/ai-simplified-in-plain-english/ai-driven-business-development-a-complete-pdca-framework-for-cursor-pair-programming-e9917af12d78)
- [Reducing AI code debt: A human-supervised PDCA framework](https://agilealliance.org/reducing-ai-code-debt/)
- [Gemini CLI Extensions](https://geminicli.com/docs/extensions/)
- [Gemini CLI Hooks](https://geminicli.com/docs/hooks/)
- [Preview release: v0.31.0-preview.1](https://geminicli.com/docs/changelogs/preview/)
- [The Current AI "Winners" Have a Thin Moat](https://www.abzglobal.net/web-development-blog/the-current-ai-winners-have-a-thin-moat-and-2026-could-flip-the-leaderboard)
- [AI Tools for Developers 2026: More Than Just Coding Assistants](https://www.cortex.io/post/the-engineering-leaders-guide-to-ai-tools-for-developers-in-2026)

---

*bkit Vibecoding Kit v1.5.5 - Feature Enhancement Proposals*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
