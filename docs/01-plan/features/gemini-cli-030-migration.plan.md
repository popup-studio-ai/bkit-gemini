# Plan-Plus: Gemini CLI v0.30.0 Migration

> **Summary**: Plan-Plus methodology applied to bkit-gemini v0.30.0 migration - intent discovery, strategy alternatives, YAGNI review, and final recommendation.
>
> **Feature**: gemini-cli-030-migration
> **Author**: Product Manager (CTO Team)
> **Created**: 2026-02-25
> **Last Modified**: 2026-02-25
> **Status**: Draft (Pending CTO Approval)
> **Method**: Plan-Plus (brainstorming-enhanced planning)
> **Analysis Source**: [gemini-cli-030-upgrade-impact-analysis.analysis.md](../../03-analysis/gemini-cli-030-upgrade-impact-analysis.analysis.md)

---

## Step 1: Intent Discovery

### 1.1 WHY Do We Need This Migration?

The surface reason is "Gemini CLI released v0.30.0." The real business reasons are:

**Primary: Policy Engine is now GA - the old permission path is broken**

v0.30.0 promotes the Policy Engine from preview to General Availability. This means:
- `excludeTools` in `gemini-extension.json` is removed (already done in v1.5.4)
- The permission system in `permission.js` currently defers to Policy Engine but the TOML auto-generation trigger in `session-start.js` is NOT activated
- Result: bkit users on v0.30.0 have no active permission enforcement. `before-tool.js` still runs, but the Policy Engine path - now the primary mechanism - produces nothing. This is a silent failure.

**Secondary: Sub-agent spawning is unverified across 2 consecutive analyses**

The `gemini -e --yolo` pattern (used in `spawn-agent-server.js`) was flagged as HIGH RISK in v0.29.0 analysis and again in v0.30.0 analysis. Two upgrade cycles have passed without validation. If `--yolo` behavior changed in v0.30.0 (PR #18153 exists), bkit's multi-agent orchestration via `spawn_agent` MCP tool may silently fail or bypass security policies. This is the highest-weighted risk factor in the impact score (18.0/100).

**Tertiary: Gemini 3.1 Pro is available and optimized for bkit's workflow**

The `customtools` variant is specifically designed for extensions that use MCP tools - exactly what bkit does. Not adopting it for `cto-lead` and `gap-detector` means leaving a performance and reliability improvement on the table that competitors using raw Gemini CLI will not have.

**The business case in one sentence**: Without this migration, bkit users on Gemini CLI v0.30.0 (the current stable release as of today) have non-functional permission enforcement, unverified agent spawning, and are missing a model upgrade that would improve the quality of PDCA automation outputs.

### 1.2 WHO Is Affected?

| Stakeholder | Impact | Severity |
|-------------|--------|----------|
| **bkit users on v0.30.0** | Permission system silently non-functional (Policy TOML never generated) | Critical |
| **bkit users using `/pdca team`** | Sub-agent spawn may fail or bypass policies | High |
| **bkit users on v0.29.x** | No impact - existing behavior unchanged | None |
| **Extension developers** | SKILL.md namespace collision risk is future-facing only | Low (deferred) |
| **The bkit team** | Technical debt accumulates if Phase 2-4 items slip again | Medium |

**User count context**: v0.30.0 released today (2026-02-25). Any user who runs `npm install -g @google/gemini-cli` from today onwards gets v0.30.0. The affected population will grow daily.

### 1.3 WHAT Happens If We Don't Migrate?

**Immediate (week 1)**:
- Users upgrading to Gemini CLI v0.30.0 find bkit's permission system non-functional
- No TOML policy files generated, no native Policy Engine enforcement
- `before-tool.js` still provides some protection but the primary path is broken
- Risk: users execute commands that should have been blocked or prompted

**Short-term (weeks 2-4)**:
- Sub-agent spawn failures compound: `spawn_agent` MCP tool calls may silently degrade
- Gemini 3.1 Pro adoption by other tools while bkit stays on 3.0 Pro
- v0.31.0-preview.0 is already out (released same day as v0.30.0). If v0.31.0 stable ships in 1 week (the observed cadence), the team will be chasing two versions behind

**Quantified risk**:
- Impact Score: 82/100 (up from 78 for v0.29.0). Trend is increasing.
- Technical debt from deferring TD-01 (sub-agent spawn) has now persisted through 3 analysis cycles.
- At the v1.5.x release cadence (~every 3-7 days), missing one release window means the next opportunity is 1+ week away while users are on a broken permission path.

### 1.4 WHEN Is the Deadline?

| Event | Date | Urgency |
|-------|------|---------|
| v0.30.0 stable released | 2026-02-25 (today) | **Now** |
| v0.31.0-preview.0 released | 2026-02-25 (today) | Monitor |
| Next expected stable release (v0.31.0) | ~2026-03-04 (weekly cadence) | 1 week |
| Permission system breakage visible to users | Immediate | Critical |

**Deadline**: P0 items must ship in the next release (v1.5.5), targeting this week. The permission system gap is a user-facing bug, not a future improvement.

---

## Step 2: Alternative Strategies

### Strategy Comparison Matrix

| Criterion | Weight | Strategy A: Minimal Patch | Strategy B: Incremental | Strategy C: Full Migration |
|-----------|:------:|:------------------------:|:----------------------:|:-------------------------:|
| P0 item delivery speed | 30% | Fast (4h) | Fast (4h) | Slow (2 weeks) |
| Risk to existing users | 25% | Low | Low-Medium | High |
| Technical debt reduction | 20% | None | Partial | Full |
| User-facing improvement | 15% | Minimal | Moderate | Maximum |
| Team bandwidth fit | 10% | High fit | High fit | Low fit |
| **Weighted Score** | 100% | **71** | **78** | **52** |

### Strategy A: Minimal Patch (v1.5.5)

**Scope**: P0 items only (5 actions, ~4.75 hours)

| Item | Action | Effort |
|------|--------|--------|
| A-1 | Activate Policy TOML auto-generation in `session-start.js` | 1h |
| A-2 | Add `"0.29.7"` and `"0.30.0"` to `bkit.config.json` testedVersions | 15m |
| A-3 | Add SemVer format validation to `version-detector.js` | 30m |
| A-4 | Add Gemini 3.1 Pro + customtools documentation to `docs/guides/model-selection.md` | 1h |
| A-5 | Verify sub-agent spawn (`gemini -e --yolo`) on v0.30.0 | 2h |

**Pros**:
- Ships this week, closes the permission system gap immediately
- Zero risk to existing v0.29.x users
- Small change set, easy to review and test

**Cons**:
- Sub-agent spawn (A-5) is verification, not a fix. If broken, a follow-up patch is needed.
- Phase 2-4 debt continues to accumulate
- Does not adopt Gemini 3.1 Pro model upgrades
- Does not activate actual model improvements for users

**Risk**: Deferring Phase 2 means the team will face these same items in the next analysis cycle, as has happened for the past 2 cycles with TD-01.

### Strategy B: Incremental Migration (v1.5.5 + v1.6.0)

**Scope**: Phase 1+2 in v1.5.5 (this week), Phase 3+4 selectively in v1.6.0 (2-3 weeks)

**v1.5.5 scope** (Phase 1+2, ~12 hours total):

| Item | Action | Effort | Priority |
|------|--------|:------:|:--------:|
| B-1 | Activate Policy TOML auto-generation (`session-start.js`) | 1h | P0 |
| B-2 | `bkit.config.json` version updates | 15m | P0 |
| B-3 | `version-detector.js` SemVer validation | 30m | P0 |
| B-4 | `model-selection.md` Gemini 3.1 Pro documentation | 1h | P0 |
| B-5 | Sub-agent spawn verification | 2h | P0 |
| B-6 | `policy-migrator.js` TOML schema validation | 2h | P1 |
| B-7 | AfterTool hook schema / Tool Output Masking verification | 1h | P1 |
| B-8 | Apply gemini-3.1-pro model to `cto-lead` and `gap-detector` | 2h | P1 |
| B-9 | Apply gemini-3-flash-lite to `report-generator` and `qa-monitor` | 30m | P1 |
| B-10 | Add `excludeTools` safety backstop to `gemini-extension.json` | 15m | P1 |

**v1.6.0 scope** (Phase 3 items only, YAGNI-filtered Phase 4):

| Item | Action | Effort | Priority |
|------|--------|:------:|:--------:|
| C-1 | `@google/gemini-cli-core` SDK integration | 8h | P2 |
| C-2 | Extension Registry registration preparation | 4h | P2 |
| C-3 | Code duplication removal (5 structural duplicates) | 4h | P2 |
| C-4 | Large file splitting (4 files over 300 lines) | 4h | P2 |
| C-5 | AfterAgent retry pattern | 2h | P2 |

**Pros**:
- Delivers all critical fixes this week
- Includes meaningful model upgrade (3.1 Pro for key agents)
- Phase 3 items are properly scoped for v1.6.0 with cleaner architecture foundation
- Avoids dragging Phase 2 into a third consecutive analysis cycle

**Cons**:
- v1.5.5 scope is wider than Strategy A (~12h vs ~4.75h)
- Model changes (B-8, B-9) require testing to confirm no regression in agent behavior
- Some v1.6.0 Phase 3 items (SDK integration) have open questions (Q-08)

### Strategy C: Full Migration (v1.6.0)

**Scope**: All 24 recommended actions in one release

**Pros**:
- Comprehensive, no phasing complexity
- Full architecture improvement in one shot

**Cons**:
- ~2 week timeline leaves users on broken permission system for another week+
- Large change set increases regression risk
- Phase 4 items (ACP, Conductor, GenAI SDK 1.41.0) have unresolved open questions (Q-06, Q-11)
- Mixes urgent bug fixes with speculative/architectural items
- No forcing function for YAGNI discipline

**Verdict**: Not recommended. The urgency of the permission system gap makes delaying all P0 items until a "full migration" release unacceptable.

---

## Step 3: YAGNI Review

For each of the 24 recommended actions from the analysis, the following evaluates whether it is genuinely needed now and whether it could be simplified.

### Phase 1 Items (P0)

| # | Action | Needed NOW? | Cost of Deferring | Simplification? |
|---|--------|:-----------:|-------------------|-----------------|
| 1 | Compatibility test suite run | **Y** - Verification gate before release | Cannot ship confidently without it | Scope to smoke test of P0 changes; full suite deferred to later |
| 2 | `bkit.config.json` testedVersions update | **Y** - 15 minutes, zero risk | Misleading version tracking | None needed |
| 3 | Policy TOML auto-generation activation | **Y** - Fixes silent permission failure | Users on v0.30.0 have non-functional permissions | Can limit to session-start trigger only; full schema validation is P1 |
| 4 | `version-detector.js` SemVer validation | **Y** - Security issue (HIGH severity) | `GEMINI_CLI_VERSION=99.99.99` enables all feature flags | Simple regex validation is sufficient; full sanitizer is overkill |
| 5 | `model-selection.md` Gemini 3.1 Pro documentation | **Y** - Users need to know about customtools variant | Documentation lag is recurring pattern D | Can be a short addition to existing doc; no new doc needed |

**Phase 1 verdict**: All 5 items are genuinely needed now. No YAGNI cuts.

### Phase 2 Items (P1)

| # | Action | Needed NOW? | Cost of Deferring | Simplification? |
|---|--------|:-----------:|-------------------|-----------------|
| 6 | Sub-agent spawn (`--yolo`) verification | **Y** - Critical risk, deferred 2 cycles | If broken, multi-agent orchestration silently fails | Verification only in v1.5.5; fix in follow-up if needed |
| 7 | `policy-migrator.js` TOML schema validation | **Y** - C-01 Critical Issue; permission enforcement depends on correct TOML | TOML format mismatch = permission management failure | Add basic structural validation only; full JSON Schema validation is overkill |
| 8 | AfterTool hook / Tool Output Masking verification | **Y** - PDCA state tracking may be broken on v0.30.0 | PDCA phase tracking fails silently | Verification only; schema fix if needed |
| 9 | `cto-lead` + `gap-detector` → gemini-3.1-pro model | **Y** - Quality improvement for key orchestration agents | Staying on 3.0 Pro is functionally fine but 3.1 customtools variant is specifically designed for this use case | Can skip `gap-detector` initially; prioritize `cto-lead` only if bandwidth is tight |
| 10 | `report-generator` + `qa-monitor` → gemini-3-flash-lite | **Y** - 60% cost reduction on high-volume agents | Unnecessary cost at scale | Trivial 2-line change per agent; no reason to defer |
| 11 | `gemini-extension.json` excludeTools safety backstop | **Y** - Defense in depth, 15-minute change | Minor; v0.30.0 Policy Engine is primary, this is secondary | None |

**Phase 2 verdict**: All 6 items are needed for v1.5.5. The sub-agent spawn item is restructured as verification-first, fix-second to bound scope.

### Phase 3 Items (P2)

| # | Action | Needed NOW? | Cost of Deferring | Simplification? |
|---|--------|:-----------:|-------------------|-----------------|
| 12 | `@google/gemini-cli-core` SDK integration | **N** - Open questions Q-08 unanswered | Low; current Markdown skill format works well | Defer to v1.6.0 after investigating SDK skill API |
| 13 | Extension Registry registration | **N** - Blocked by SDK integration; open question Q-07 | Low; manual discovery still works | Defer to v1.6.0 |
| 14 | SKILL.md `bkit-` namespace prefix | **N** - Risk is theoretical for v0.30.0 | Low; v0.30.0 has no new conflicting fields | **Challenge the premise**: Is the collision risk real or theoretical? |
| 15 | MCP SDK ^1.27.0 upgrade | **N** - No breaking change affecting bkit in 1.23.0→1.27.1 range | Minimal; SDK is backward compatible | Defer; monitor for actual breaking changes |
| 16 | Code duplication removal (5 structural duplicates) | **N** - Tech debt, not user-facing | Low for now; increases as codebase grows | Defer to v1.6.0 with code quality sprint |
| 17 | Large file splitting (4 files) | **N** - Tech debt, not user-facing | Low for now | Defer to v1.6.0 |
| 18 | AfterAgent retry pattern | **N** - Enhancement, not fix | Low; current behavior acceptable | Defer to v1.6.0 |

**SKILL.md namespace challenge (item 14)**: The analysis flags this as a risk because bkit uses custom frontmatter fields like `user-invocable`, `allowed-tools`, `imports`. The question is: does v0.30.0 or any imminent version introduce conflicting official fields?

**Finding**: The analysis states the risk is for v0.31.0-preview.0 and beyond, not v0.30.0. No specific conflicting field names are identified in the analysis. The risk is real but non-immediate. Deferring the 29-skill rename to v1.6.0 is correct - the cost of renaming 29 skill files is high and should be done in a dedicated PR with proper testing, not bundled into an urgent patch.

**Phase 3 verdict**: Defer all 7 items to v1.6.0. No YAGNI cuts needed - these are all legitimate future improvements, just not for this release.

### Phase 4 Items (P3)

| # | Action | Needed NOW? | Cost of Deferring | Decision |
|---|--------|:-----------:|-------------------|----------|
| 19 | Agent Client Protocol (ACP) IDE integration | **N** | None - ACP SDK at 0.14.1, not stable | **YAGNI CUT**: ACP is at 0.x versioning. Integrating a pre-1.0 protocol adds maintenance burden with no stable API contract. Defer until ACP reaches 1.0 or Gemini CLI formally adopts it. |
| 20 | Plan Mode + PDCA integration | **N** | Low - `/pdca plan` already works | **DEFER**: Not a fix, it's a UX improvement. Open question Q-01 (--yolo behavior) must be resolved first. |
| 21 | Conductor Extension evaluation | **N** | None | **YAGNI CUT**: Q-11 is unresolved. No concrete benefit defined. Evaluate only after v0.31.0 stable ships and Conductor stabilizes. |
| 22 | GenAI SDK 1.41.0+ response (v0.31.0-preview) | **N** | Low - v0.31.0 is still preview | **DEFER**: Track when v0.31.0 stable ships. GenAI SDK API changes are upstream concern. |
| 23 | Dynamic MCP tool updates (notifications/tools/list_changed) | **N** | Low - current static registration works | **DEFER**: Q-09 (Issue #13850 resolution status) must be answered first. |
| 24 | Automated test suite | **N** for v1.5.5, **Y** for v1.6.0 | **This is the key YAGNI tension**: Currently 0 automated tests means every release requires manual verification. The cost of deferring grows with every release. However, a full test suite (16h estimate) is not suitable for an urgent patch release. | **DEFER with commitment**: Scope a minimal smoke test harness (4h) for v1.6.0, not the full 16h suite. |

**Phase 4 verdict**:
- ACP (item 19) and Conductor (item 21): YAGNI CUT. Pre-1.0 protocols and unevaluated extensions should not be on the roadmap until concrete benefit is established.
- Items 20, 22, 23: Defer to v1.7.0 with monitoring triggers.
- Item 24 (test suite): Reframe as a 4h minimal harness in v1.6.0, not a 16h full suite.

---

## Step 4: Final Recommendation

### Recommended Strategy: B (Incremental Migration)

Strategy B best balances urgency against scope control. It delivers all P0 and P1 items in v1.5.5 this week, defers properly YAGNI-filtered P2 items to v1.6.0, and eliminates the premature P3/P4 items.

### Revised Action List (YAGNI-Filtered)

#### v1.5.5 Release (This Week - ~12h total)

**P0: Permission + Security (Must Have)**

| ID | Action | Effort | File(s) |
|----|--------|:------:|---------|
| V155-01 | Activate Policy TOML auto-generation trigger in `session-start.js` | 1h | `hooks/scripts/session-start.js` |
| V155-02 | Add `"0.29.7"` and `"0.30.0"` to `bkit.config.json` testedVersions | 15m | `bkit.config.json` |
| V155-03 | Add SemVer regex validation to `version-detector.js` (line 52, env var injection fix) | 30m | `lib/adapters/gemini/version-detector.js` |
| V155-04 | Document Gemini 3.1 Pro + customtools variant in `model-selection.md` | 1h | `docs/guides/model-selection.md` |
| V155-05 | Verify sub-agent spawn (`gemini -e agent.md --yolo`) on v0.30.0; document findings | 2h | `mcp/spawn-agent-server.js` (fix if broken) |

**P1: Compatibility + Quality (Should Have)**

| ID | Action | Effort | File(s) |
|----|--------|:------:|---------|
| V155-06 | Add TOML structural validation to `policy-migrator.js` `convertToToml()` | 2h | `lib/adapters/gemini/policy-migrator.js` |
| V155-07 | Verify AfterTool hook schema on v0.30.0; fix PDCA state tracking if affected | 1h | `hooks/scripts/after-tool.js` |
| V155-08 | Apply `gemini-3.1-pro-preview-customtools` to `cto-lead`; `gemini-3.1-pro-preview` to `gap-detector` | 2h | `agents/cto-lead.md`, `agents/gap-detector.md` |
| V155-09 | Apply `gemini-3-flash-lite` to `report-generator` and `qa-monitor` | 30m | `agents/report-generator.md`, `agents/qa-monitor.md` |
| V155-10 | Add `excludeTools` safety backstop to `gemini-extension.json` | 15m | `gemini-extension.json` |
| V155-11 | Run smoke test on P0+P1 changes vs v0.29.0 and v0.30.0 | 1h | Manual verification |

**Total v1.5.5**: 11 actions, ~11.5 hours

#### v1.6.0 Release (2-3 Weeks - ~30h total)

**P2: Architecture Quality (Could Have)**

| ID | Action | Effort | File(s) |
|----|--------|:------:|---------|
| V160-01 | Investigate `@google/gemini-cli-core` SDK skill API (Q-08); implement if viable | 8h | Architecture |
| V160-02 | Prepare Extension Registry registration (Q-07 answer required first) | 4h | `gemini-extension.json` |
| V160-03 | SKILL.md `bkit-` namespace prefix migration (29 skills) | 4h | `skills/*/SKILL.md` |
| V160-04 | Code duplication removal: 5 structural duplicates identified in W-05 through W-08 | 4h | `hooks/scripts/*`, `lib/*` |
| V160-05 | Large file splitting: `skill-orchestrator.js` (709L), `memory.js` (460L), `permission.js` (407L), `session-start.js` (393L) | 4h | `lib/*` |
| V160-06 | AfterAgent retry pattern implementation | 2h | `hooks/scripts/after-agent.js` |
| V160-07 | MCP SDK upgrade to ^1.27.0 (if breaking changes identified) | 2h | `mcp/spawn-agent-server.js` |
| V160-08 | Minimal automated smoke test harness (not full 16h suite) | 4h | `tests/` |

**Total v1.6.0**: 8 actions, ~32h

#### v1.7.0 and Beyond (Monitored)

| ID | Action | Trigger | Note |
|----|--------|---------|------|
| V170-01 | Plan Mode + PDCA integration | Q-01 answered; v0.30.0 --yolo behavior confirmed | |
| V170-02 | GenAI SDK 1.41.0+ response | v0.31.0 stable released | |
| V170-03 | Dynamic MCP tool updates | Issue #13850 resolved | |
| V170-04 | ACP/A2A integration | ACP SDK reaches 1.0 | YAGNI - removed from near-term roadmap |
| V170-05 | Conductor Extension | v0.31.0 stable + Conductor docs available | YAGNI - evaluate don't commit |
| V170-06 | Full automated test suite | Smoke harness established in v1.6.0 | Build on v1.6.0 foundation |

### Release Plan with Milestones

```
TODAY (2026-02-25) - v0.30.0 stable released
    │
    ▼
2026-02-26 (Day 1) - v1.5.5 Planning + Design
    - This Plan document approved
    - Design document created
    - V155-01 through V155-11 sequenced
    │
    ▼
2026-02-27~28 (Day 2-3) - v1.5.5 Implementation
    - V155-01: Policy TOML activation (1h)     ← unblocks permission system
    - V155-02: Config update (15m)
    - V155-03: SemVer validation (30m)          ← closes security gap
    - V155-05: Sub-agent verification (2h)      ← resolves 2-cycle debt
    - V155-06: TOML schema validation (2h)      ← closes C-01 critical issue
    - V155-07: AfterTool verification (1h)
    - V155-08: Model upgrades cto-lead/gap-detector (2h)
    - V155-09: Flash-lite for report/qa (30m)
    - V155-10: excludeTools backstop (15m)
    - V155-04: Model docs (1h)
    - V155-11: Smoke test (1h)
    │
    ▼
2026-02-28 (Day 3) - v1.5.5 Released
    - CHANGELOG.md updated
    - README.md compatibility updated
    │
    ▼
~2026-03-04 (Week 2) - v0.31.0 stable expected
    - Monitor; trigger V170-02 if ships
    │
    ▼
2026-03-11~18 (Weeks 2-3) - v1.6.0 Planning + Implementation
    - Answer Q-07, Q-08 before starting V160-01, V160-02
    - V160-03 through V160-08 implemented
    │
    ▼
~2026-03-18 (Week 3) - v1.6.0 Released
```

### Success Criteria Per Phase

#### v1.5.5 Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Permission system functional on v0.30.0 | Policy TOML file generated at `session-start`; bkit-permissions.toml present in `.gemini/policies/` |
| Sub-agent spawn verified | `spawn_agent` MCP tool call succeeds on v0.30.0; findings documented in report |
| Security gap closed | `version-detector.js` rejects `GEMINI_CLI_VERSION=99.99.99` as invalid |
| No v0.29.x regression | All 16 agents load; all 29 skills load; all 18 commands respond; all 10 hooks fire |
| Model upgrade deployed | `cto-lead` uses `gemini-3.1-pro-preview-customtools`; `gap-detector` uses `gemini-3.1-pro-preview` |
| Cost reduction active | `report-generator` and `qa-monitor` use `gemini-3-flash-lite` |

#### v1.6.0 Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| No code duplication above 80% | Static analysis of identified duplicate pairs |
| All files under 400 lines | File size audit post-refactor |
| SKILL.md namespace safe | No bkit custom field conflicts with official v0.31.0 SKILL spec |
| SDK integration decision made | Either V160-01 implemented or Q-08 answered with "not viable" and documented |
| Minimal test harness | At least 10 automated smoke tests covering P0 components (tool-registry, version-detector, policy-migrator) |

### Risk Mitigation for Deferred Items

| Deferred Item | Risk if v0.31.0 Changes Something | Mitigation |
|---------------|-----------------------------------|------------|
| SKILL.md namespace (V160-03) | Official field conflicts with bkit custom fields | Monitor v0.31.0 release notes; SKILL.md files have no runtime impact until Gemini CLI reads those fields |
| MCP SDK upgrade (V160-07) | Breaking change in 1.23.0→1.27.1 range | Check MCP SDK changelog before v1.6.0; if breaking, elevate to P0 |
| Sub-agent spawn (V155-05 findings) | --yolo removed or changed | If V155-05 finds --yolo broken, immediately create a P0 follow-up for alternative flag research |
| ACP (YAGNI cut) | ACP becomes Gemini CLI standard faster than expected | Quarterly review; re-evaluate when ACP SDK reaches 1.0 |
| Test suite (deferred to v1.6.0 foundation) | Regression ship undetected | V155-11 smoke test gate must block v1.5.5 release if failures found |

---

## Appendix: Decision Log

| Decision | Options Considered | Selected | Rationale |
|----------|--------------------|----------|-----------|
| Strategy choice | A (minimal), B (incremental), C (full) | **B** | Closes permission gap this week; bounds scope; avoids pre-1.0 ACP commitment |
| Sub-agent item framing | Fix now / Verify now / Defer | **Verify now, fix if broken** | Cannot know if fix is needed without verification; 2h verification is bounded |
| ACP integration | v1.7.0 / Never / On trigger | **On trigger (ACP 1.0)** | YAGNI: 0.x protocol with no stable API should not be on committed roadmap |
| Test suite | Full 16h now / Minimal 4h v1.6.0 / Defer indefinitely | **Minimal 4h in v1.6.0** | Full suite is too large for urgent patch; indefinite deferral is how W-11 persisted |
| SKILL.md namespace | Rename now (29 files) / Rename v1.6.0 / Monitor and rename if conflict | **Rename v1.6.0** | Risk is real but non-immediate; 29-file rename needs dedicated PR |
| Gemini 3.1 Pro adoption | All 16 agents / Only cto-lead + gap-detector / None | **cto-lead + gap-detector** | Selective adoption per architecture decision record in analysis; cost/benefit balance |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-25 | Initial Plan-Plus document | Product Manager (CTO Team) |
