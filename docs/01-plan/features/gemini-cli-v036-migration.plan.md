# Gemini CLI v0.36.0 Migration Plan (Phase 2) -- bkit v2.0.2

> **Feature**: gemini-cli-v036-migration-phase2
> **Version**: bkit v2.0.2
> **Created**: 2026-03-28 (Phase 1)
> **Updated**: 2026-04-06 (Phase 2 -- Post-Stable Strategy)
> **Status**: Approved
> **Strategy**: B (Enhancement) -- 4th application of validated Strategy B pattern
> **Migration Scope**: v0.36.0 Stable remaining items (P2 + selective P3)
> **Prior Art**: Phase 1 Report (100% Gap Match, 120 TC PASS)
> **Research**: [gemini-cli-v036-stable-research.md](../research/) (Phase 1 Research)
> **Impact Analysis**: [gemini-cli-v036-impact.analysis.md](../../03-analysis/gemini-cli-v036-impact.analysis.md)

---

## Executive Summary

| Item | Content |
|------|---------|
| Target Version | v0.36.0 Stable (2026-04-01 released) |
| Phase 1 Status | Completed (P0 enableAgents defense + Feature Flags + BeforeTool ask) |
| Phase 2 Scope | P2 2 items + P3 3 items (selected) |
| Recommended Strategy | Approach B: Enhancement (3.5h) |
| YAGNI Savings | 67% (10.7h -> 3.5h) |
| Wave Structure | 3 Waves (P2 Core -> P3 Polish -> Tests) |
| Affected Files | 7 files (modify 4 + new 2 + update 1) |

## Value Delivered

| Perspective | Content |
|-------------|---------|
| Problem | Extension skill `bkit:` prefix causes SKILL_HANDLERS mismatch; agent tool isolation relies on approval mode only |
| Solution | Universal prefix stripping + Multi-Registry native tool isolation + selective P3 enhancements |
| Function UX Effect | All 35 skills properly handled regardless of prefix format; READONLY agents truly restricted at CLI level |
| Core Value | bkit robustness against CLI prefix changes + defense-in-depth security for agent system |

---

## 1. Intent Analysis (Intent Discovery)

### 1.1 WHY: This Phase 2 Is Needed

**Primary: Extension Skill Prefix Resilience**

v0.36.0 changed extension skill prefix from `.` to `:` and now always attaches it. Phase 1 (completed 2026-03-28) deferred the `bkit:` prefix stripping as YAGNI because only `pdca` had AfterTool post-processing. However, the Impact Analysis (2026-04-06) reveals that `after-agent.js`'s `SKILL_HANDLERS` maps `'pdca'`, `'code-review'`, `'phase-8-review'` -- all three will fail if CLI sends `bkit:pdca`, `bkit:code-review`, `bkit:phase-8-review`.

**Secondary: Agent Tool Isolation Hardening**

`spawn-agent-server.js` currently uses approval mode (`--approval-mode=auto` vs `--approval-mode=yolo`) as the sole security mechanism. v0.36.0's Multi-Registry (PR #22712, #22718) enables native `--allowed-tools` filtering, making READONLY agents truly read-only at CLI sandbox level rather than relying on user approval.

**Tertiary: Documentation Debt Reduction**

3 low-cost P3 items (sandbox notice, tracker blocked, allowRedirection) improve bkit quality at minimal risk.

### 1.2 Purpose Classification

| Question | Answer |
|----------|--------|
| Compatibility fix? | **Yes** -- P2 prefix stripping prevents future skill matching failures |
| Feature enhancement? | **Partial** -- Multi-Registry tool isolation is a genuine security improvement |
| Architecture change? | **No** -- All changes are localized to existing modules |

### 1.3 User Value Analysis

| Value | Contribution | Priority |
|-------|-------------|----------|
| **Stability** | Prefix stripping prevents silent skill handler misses | Highest |
| **Security** | CLI-level tool isolation > approval-mode-only | High |
| **Quality** | P3 polish items reduce doc debt | Medium |

---

## 2. Strategy Comparison (Brainstorming)

### 2.1 Approach A: Minimum Fix (P2 Only)

| Aspect | Assessment |
|--------|-----------|
| **Scope** | P2 2 items only: prefix stripping (1h) + agent tool isolation (2h) |
| **Estimated Effort** | 3h |
| **Risk** | Low -- minimal code changes in well-understood modules |
| **Quality Gain** | Medium -- fixes real matching issue + hardens security |
| **Pros** | Fastest delivery, lowest risk, addresses actual observed issues |
| **Cons** | Leaves 8 P3 items as technical debt; tracker.js and policy.js miss easy wins |

### 2.2 Approach B: Feature Enhancement (P2 + Selected P3)

| Aspect | Assessment |
|--------|-----------|
| **Scope** | P2 2 items + P3 3 items (allowRedirection, tracker blocked, sandbox notice) |
| **Estimated Effort** | 3.5h |
| **Risk** | Low -- P3 additions are isolated, low-complexity changes |
| **Quality Gain** | High -- fixes P2 issues + enhances policy granularity + PDCA dependency tracking |
| **Pros** | Best value/cost ratio; all selected P3 items are under 1h each; no YAGNI risk |
| **Cons** | 0.5h more than A; slightly more test surface |

### 2.3 Approach C: Architecture Optimization (P2 + All P3 + Deferred)

| Aspect | Assessment |
|--------|-----------|
| **Scope** | P2 + all P3 8 items + Git Worktree (8h) + ModelChain (2h) + memoryManager (2h) |
| **Estimated Effort** | 22.7h |
| **Risk** | High -- Git Worktree and ModelChain require architecture changes; memoryManager depends on CLI experimental feature stability |
| **Quality Gain** | High -- but most gain comes from deferred items that are not user-requested |
| **Pros** | Comprehensive; addresses long-term architecture |
| **Cons** | YAGNI violation; 6.5x more effort than B; Git Worktree alone is 8h for unvalidated use case |

### 2.4 Evaluation Matrix

| Criterion (Weight) | A: Minimum | B: Enhancement | C: Architecture |
|--------------------|-----------|----------------|-----------------|
| Risk (30%) | 9 (Low) | 8 (Low) | 4 (High) |
| Effort (25%) | 9 (3h) | 8 (3.5h) | 2 (22.7h) |
| Value Creation (25%) | 5 (P2 only) | 8 (P2 + polish) | 9 (comprehensive) |
| Long-term Benefit (20%) | 4 (debt remains) | 7 (clean state) | 9 (future-proof) |
| **Weighted Score** | **6.85** | **7.85** | **5.65** |

### 2.5 Strategy Decision

**Selected: Approach B (Enhancement)** -- Weighted score 7.85 (highest)

Reasoning:
1. **Validated pattern**: Strategy B has been chosen in all 3 prior migrations (v0.31.0, v0.35.0, v0.36.0 Phase 1) and consistently delivers the best weighted score
2. **Marginal cost**: +0.5h over Approach A buys meaningful quality improvements (allowRedirection, tracker blocked, sandbox notice)
3. **YAGNI discipline**: Approach C's 19.2h delta is entirely comprised of items that have no current user demand (Git Worktree, ModelChain, memoryManager)
4. **Low P3 risk**: All 3 selected P3 items modify single files with isolated changes

---

## 3. YAGNI Review

### 3.1 P3 Items: Adopt or Defer?

| # | P3 Item | Effort | Adopt? | Rationale |
|---|---------|--------|--------|-----------|
| 1 | allowRedirection policy | 0.5h | **Adopt** | Single-line TOML template change. Shell redirect control is a real security gap (current policy blocks all redirects including benign `> file.log`) |
| 2 | tracker.js blocked status | 0.3h | **Adopt** | Single constant mapping addition. PDCA dependency expression is a real workflow gap (no way to mark a phase as "blocked by dependency") |
| 3 | bkend-security SKILL.md sandbox notice | 0.2h | **Adopt** | One-line documentation addition. Prevents user confusion when `.gitignore` edit fails in v0.36.0+ sandbox |
| 4 | Unused Feature Flag activation roadmap | doc only | **Defer** | Informational. No code change needed. Already documented in Impact Analysis |
| 5 | bkit: prefix test expansion (non-pdca) | 1h | **Defer -> Merge into P2 prefix stripping test** | Naturally covered by P2 implementation tests |
| 6 | memoryManager agent evaluation | 2h | **Defer** | `save_memory` still works. No deprecation timeline from CLI team |
| 7 | Git Worktree parallel PDCA | 8h | **Defer** | No user request. Architecture change. POC needed first |
| 8 | ModelChain schema externalization | 2h | **Defer** | Current static FALLBACK_CHAIN works. No model routing flexibility demand |

### 3.2 YAGNI Savings

| Category | Items | Effort |
|----------|-------|--------|
| Adopted (P2 + P3) | 5 items | 3.5h |
| Deferred | 4 items | 13h |
| **Total Impact Analysis estimate** | 9 items | **10.7h** (Section 8 sum: 1h + 2h + 1h + 0.5h + 0.2h + 1h + 2h + 3h) |
| **Actual plan** | 5 items | **3.5h** |
| **YAGNI savings** | | **67%** |

### 3.3 YAGNI Checklist

- [x] No "nice to have" features included -- all 5 items address real gaps
- [x] Current users need these changes -- prefix matching affects 3 active skill handlers; tool isolation affects 14 registered agents
- [x] Aligns with bkit philosophy -- "Automation First" (prefix normalization), "No Guessing" (explicit tool restriction), "Docs = Code" (sandbox notice)
- [x] Maintenance cost justified -- each change is under 30 lines; no new modules introduced
- [x] Not repeating unnecessary patterns from prior migrations -- v0.35.0 did NOT have a "fix all P3" anti-pattern

---

## 4. Implementation Roadmap

### Wave 1: P2 Core -- Prefix Stripping + Tool Isolation (2h)

| # | Task | File | Change | Effort |
|---|------|------|--------|--------|
| W1-1 | Universal `bkit:` prefix stripping utility | `hooks/scripts/utils/skill-normalizer.js` (new) | `normalizeSkillName(name)` function: `name.replace(/^bkit:/, '')` + unit test helper | 0.3h |
| W1-2 | Apply to after-agent.js SKILL_HANDLERS lookup | `hooks/scripts/after-agent.js` | Import normalizer; apply to `activeSkill` before `SKILL_HANDLERS[activeSkill]` lookup (Line 86) | 0.2h |
| W1-3 | Apply to after-tool.js processPostSkill | `hooks/scripts/after-tool.js` | Import normalizer; replace inline `bkit:pdca` check (Line 115) with `normalizeSkillName(skillName)` | 0.2h |
| W1-4 | Multi-Registry native tool isolation | `mcp/spawn-agent-server.js` | In `executeAgent()` (Line 822): when `hasMultiRegistry && safetyTier === READONLY`, add `--allowed-tools=read_file,list_directory,web_search` to args array | 1.3h |

**Dependency**: W1-1 must complete before W1-2 and W1-3. W1-4 is independent.

**Verification**:
- W1-1~W1-3: After-agent and after-tool correctly route `bkit:pdca`, `bkit:code-review`, `bkit:phase-8-review` to handlers
- W1-4: READONLY agents spawned with `--allowed-tools` flag when v0.36.0+ detected

### Wave 2: P3 Polish (0.5h)

| # | Task | File | Change | Effort |
|---|------|------|--------|--------|
| W2-1 | allowRedirection in shell policy templates | `lib/gemini/policy.js` | Add `allowRedirection = true` to LEVEL_POLICY_TEMPLATES shell rules where `action = "allow"` | 0.2h |
| W2-2 | tracker.js blocked status mapping | `lib/gemini/tracker.js` | Add `'blocked': 'BLOCKED'` to `PDCA_TO_TRACKER_STATUS` mapping | 0.1h |
| W2-3 | bkend-security SKILL.md sandbox notice | `skills/bkend-security/SKILL.md` | Add note: "In Gemini CLI v0.36.0+, `.gitignore` is write-protected by sandbox governance. Add entries manually." | 0.2h |

**Dependency**: None (all independent). Can be done in parallel.

**Verification**:
- W2-1: Generated TOML includes `allowRedirection = true` for shell allow rules
- W2-2: `getTrackerStatus('blocked')` returns `'BLOCKED'`
- W2-3: SKILL.md contains sandbox governance notice

### Wave 3: Tests (1h)

| # | Task | File | Change | Effort |
|---|------|------|--------|--------|
| W3-1 | Prefix stripping unit tests | `tests/suites/tc112-v036-skill-prefix.js` (new) | 6 TC: normalizeSkillName identity, bkit: strip, after-agent routing with prefix, after-tool routing with prefix, edge cases (empty, null, double-prefix) | 0.5h |
| W3-2 | Tool isolation test | `tests/suites/tc111-v036-enableagents.js` (update) | 2 TC addition: READONLY agent includes --allowed-tools when hasMultiRegistry=true; FULL agent does not | 0.3h |
| W3-3 | Regression run | All test suites | Verify 120+ TC still pass | 0.2h |

**Dependency**: W3-1 and W3-2 depend on Wave 1 completion. W3-3 depends on all waves.

---

## 5. Risk Management

### 5.1 Identified Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | `bkit:` prefix may not be the only format CLI sends | Low | Medium | `normalizeSkillName()` uses regex that handles `bkit:` specifically; other prefixes pass through unchanged. Monitor CLI release notes for further prefix changes |
| 2 | `--allowed-tools` flag format may differ from documentation | Low | Medium | Feature-gated behind `hasMultiRegistry`; if flag is wrong, agent still runs in approval mode (current behavior). Graceful degradation |
| 3 | `allowRedirection = true` may change redirect security semantics | Low | Low | Only applied to `action = "allow"` rules that already permit the command. Does not weaken deny rules |
| 4 | `blocked` tracker status may not be recognized by Gemini CLI task tracker | Low | Low | bkit maps its own status; CLI unrecognized statuses are treated as custom states. No error produced |

### 5.2 Rollback Strategy

Each Wave is an independent commit. Rollback via `git revert <commit>` for any single wave.

| Wave | Rollback Command | Side Effects |
|------|-----------------|--------------|
| Wave 1 | `git revert <W1-commit>` | Prefix stripping removed; skill handlers revert to exact-match only. Tool isolation reverts to approval-mode only |
| Wave 2 | `git revert <W2-commit>` | P3 enhancements removed; no functional regression |
| Wave 3 | `git revert <W3-commit>` | Tests removed; no production impact |

### 5.3 Test Strategy

| Layer | Method | Coverage |
|-------|--------|----------|
| Unit | TC-112 prefix stripping (6 TC) | normalizeSkillName correctness |
| Integration | TC-111 update (2 TC) | Tool isolation flag generation |
| Regression | Full suite run (120+ TC) | No existing test breaks |
| Manual | Invoke `/pdca plan test-feature` in v0.36.0 CLI, verify after-agent.js receives and routes correctly | E2E validation |

### 5.4 Backward Compatibility

| Component | v0.35.x Behavior | v0.36.0 Behavior | Compatibility |
|-----------|-----------------|-----------------|---------------|
| Prefix stripping | `skillName = 'pdca'` (no prefix) -> passes through unchanged | `skillName = 'bkit:pdca'` -> stripped to `'pdca'` | Both handled |
| Tool isolation | `--approval-mode=auto` for READONLY | `--allowed-tools=...` + `--approval-mode=auto` | Additive only |
| allowRedirection | Not present in TOML | Present in TOML, ignored by older CLI | Forward-compatible |
| blocked status | Not mapped | Mapped to `'BLOCKED'` | Additive only |

---

## 6. Detailed File Change Specification

### 6.1 hooks/scripts/utils/skill-normalizer.js (NEW)

```javascript
/**
 * Skill Name Normalizer
 * Strips extension prefix (bkit:) from skill names for consistent handler matching.
 * v0.36.0: CLI always attaches "bkit:" prefix to extension skills (PR #23566).
 */

/**
 * Normalize skill name by stripping known extension prefixes.
 * @param {string} skillName - Raw skill name from CLI event
 * @returns {string} Normalized skill name without prefix
 */
function normalizeSkillName(skillName) {
  if (!skillName || typeof skillName !== 'string') return skillName || '';
  return skillName.replace(/^bkit:/, '');
}

module.exports = { normalizeSkillName };
```

### 6.2 hooks/scripts/after-agent.js (MODIFY)

Line 86 area -- before SKILL_HANDLERS lookup:

```javascript
// Before (current):
if (activeSkill && SKILL_HANDLERS[activeSkill]) {

// After:
const { normalizeSkillName } = require(path.join(__dirname, 'utils', 'skill-normalizer'));
const normalizedSkill = normalizeSkillName(activeSkill);
if (normalizedSkill && SKILL_HANDLERS[normalizedSkill]) {
  // ... use SKILL_HANDLERS[normalizedSkill]
```

### 6.3 hooks/scripts/after-tool.js (MODIFY)

Line 115 area -- replace inline prefix check:

```javascript
// Before (current):
if (skillName === 'pdca' || skillName.startsWith('bkit:pdca')) {

// After:
const { normalizeSkillName } = require(path.join(libPath, '..', 'hooks', 'scripts', 'utils', 'skill-normalizer'));
const normalized = normalizeSkillName(skillName);
if (normalized === 'pdca') {
```

### 6.4 mcp/spawn-agent-server.js (MODIFY)

Line 822 area -- after approval flag, before args construction:

```javascript
// Tool isolation for READONLY agents (v0.36.0+ Multi-Registry)
const READONLY_ALLOWED_TOOLS = ['read_file', 'list_directory', 'web_search', 'grep_search'];
let toolIsolationArgs = [];
if (flags.hasMultiRegistry && safetyTier === SAFETY_TIERS.READONLY) {
  toolIsolationArgs = ['--allowed-tools', READONLY_ALLOWED_TOOLS.join(',')];
}

const args = [
  '-e', agentPath,
  ...(approvalFlag ? [approvalFlag] : []),
  ...toolIsolationArgs,
  task
];
```

### 6.5 lib/gemini/policy.js (MODIFY)

In LEVEL_POLICY_TEMPLATES shell rules with `action = "allow"`:

```toml
# Add to shell allow rules:
allowRedirection = true
```

### 6.6 lib/gemini/tracker.js (MODIFY)

In `PDCA_TO_TRACKER_STATUS` mapping:

```javascript
// Add:
'blocked': 'BLOCKED',
```

### 6.7 skills/bkend-security/SKILL.md (MODIFY)

After Line 336 (`.gitignore` recommendation):

```markdown
> **Note**: In Gemini CLI v0.36.0+, `.gitignore` is write-protected by sandbox governance. Add entries manually or use `git` commands directly.
```

---

## 7. Deferred Items (v2.1.0 Backlog)

| Feature | Effort | Priority | Deferral Reason |
|---------|--------|----------|-----------------|
| Git Worktree parallel PDCA | 8h | P2 | Architecture change; requires POC validation; no user request |
| Task Tracker native integration | 4h | P2 | Current bridge works; CLI tracker API not stabilized |
| Plan Mode non-interactive CI/CD | 3h | P1 | No CI/CD pipeline demand yet |
| Dynamic Model Resolution (ModelChain) | 2h | P3 | Static FALLBACK_CHAIN sufficient; single-model operation |
| memoryManager agent evaluation | 2h | P3 | `save_memory` tool still functional; no deprecation announced |
| Write-Protected Governance docs | 1h | P3 | Enterprise-only concern |
| Feature Flag activation roadmap | doc | P3 | Already captured in Impact Analysis |

---

## 8. Phase 1 vs Phase 2 Comparison

| Aspect | Phase 1 (2026-03-28) | Phase 2 (2026-04-06) |
|--------|----------------------|----------------------|
| Trigger | v0.36.0 Preview P0 (enableAgents) | Stable P2/P3 hardening |
| Strategy | B (Enhancement) | B (Enhancement) |
| Critical Issues | 1 (enableAgents) | 0 |
| Scope | P0 defense + Feature Flags + BeforeTool ask | Prefix stripping + tool isolation + polish |
| Estimated Effort | 4.8h | 3.5h |
| YAGNI Savings | 81% | 67% |
| Modified Files | 8 | 7 |
| New Tests | 11 TC | 8 TC |
| Cumulative Value | Stability guaranteed | Robustness + security depth |

---

## 9. Approval

### Automated Evaluation (L4 Auto)

| Criterion | Result |
|-----------|--------|
| P0/P1 Critical issues | None (all resolved in Phase 1) |
| Strategy consistency | B (4th consecutive application) |
| YAGNI savings > 50% | 67% (pass) |
| Backward compatibility | All changes additive or forward-compatible |
| Risk level | Low (all items feature-gated or isolated) |
| **Decision** | **Approved** |

---

## Appendix A: Impact Analysis Cross-Reference

| Impact Analysis Section | Plan Coverage |
|------------------------|---------------|
| Section 2.3 (prefix stripping) | Wave 1: W1-1, W1-2, W1-3 |
| Section 3.1 (hasMultiRegistry) | Wave 1: W1-4 |
| Section 4 #2 (allowRedirection) | Wave 2: W2-1 |
| Section 4 #10 (tracker blocked) | Wave 2: W2-2 |
| Section 5.3 (sandbox notice) | Wave 2: W2-3 |
| Section 8 P3 items 5-10 | Deferred to v2.1.0 (Section 7) |

## Appendix B: Strategy B Validation History

| Migration | Version | Weighted Score | YAGNI Savings | Outcome |
|-----------|---------|---------------|---------------|---------|
| 1st | v0.31.0 | 7.8 | ~50% | Completed |
| 2nd | v0.35.0 | 7.9 | 42% | Completed |
| 3rd | v0.36.0 Phase 1 | 7.85 | 81% | Completed (100% Gap Match) |
| **4th** | **v0.36.0 Phase 2** | **7.85** | **67%** | **This Plan** |
