# bkit-gemini v2.0.0 Comprehensive Test Design

> Date: 2026-03-20
> Feature: bkit-v200-comprehensive-test
> Plan: 8 specialist agents brainstormed 1,073 test cases
> Framework: Custom Node.js test runner (existing tests/run-all.js)
> Target: TC Pass Rate >= 99%, 0 CRITICAL regressions

---

## Executive Summary

| Aspect | Content |
|--------|---------|
| Feature | bkit-gemini v2.0.0 comprehensive test suite |
| Total Test Cases | **1,073** across 8 categories |
| Test Files | **16 new suites** (TC-80 ~ TC-95) + existing 79 suites updated |
| Priority | P0: ~280, P1: ~520, P2: ~273 |
| Framework | Custom runner (tests/run-all.js) — no Jest/Mocha dependency |
| Reuse | test-utils.js (85%), fixtures.js (90%), existing patterns |

### Value Delivered

| Perspective | Content |
|-------------|---------|
| Problem | v2.0.0 changes 75 files with 85 require path updates, 8 security fixes, and new CE features — zero test coverage for new subsystems |
| Solution | 1,073 TCs across 16 suites covering modules, hooks, security, PDCA, skills, agents, config, context, architecture, migration, edge cases, E2E, integration, performance |
| Function UX Effect | Single command (`node tests/run-all.js --sprint 5`) verifies all v2.0.0 changes; P0 gate blocks broken releases |
| Core Value | Ship v2.0.0 with confidence: every behavioral contract tested, every security fix verified, every CC artifact confirmed removed |

---

## 1. Test Suite Architecture

### 1.1 New Test Files (16 suites)

```
tests/suites/
├── tc80-gemini-platform.js          # 21 TCs — GeminiAdapter, expandVariables, I/O
├── tc81-gemini-tools.js             # 21 TCs — BUILTIN_TOOLS, annotations, resolveToolName
├── tc82-gemini-version.js           # 18 TCs — 14 flags, detection, security boundary
├── tc83-gemini-hooks-adapter.js     # 13 TCs — RuntimeHook SDK, HOOK_EVENT_MAP
├── tc84-gemini-policy.js            # 22 TCs — SUBAGENT_POLICY_GROUPS, modes, TOML gen
├── tc85-gemini-tracker.js           # 16 TCs — TRACKER_MODE, PDCA_TASK_TEMPLATES, CRUD
├── tc86-context-fork.js             # 15 TCs — fork/merge/discard, LRU limit
├── tc87-import-resolver.js          # 14 TCs — @import, variables, circular detection
├── tc88-hooks-session-start.js      # 25 TCs — Phase-Aware, onboarding, skill visibility
├── tc89-hooks-before-model.js       # 16 TCs — MODEL_ROUTING, Context Anchoring
├── tc90-hooks-tool-security.js      # 25 TCs — audit log, deny patterns, CC removal
├── tc91-security-v200.js            # 95 TCs — SEC-01~10 comprehensive
├── tc92-pdca-workflow.js            # 80 TCs — full cycle, phase transitions, tracker
├── tc93-skills-agents.js            # 80 TCs — 35 skills, 21 agents, visibility, teams
├── tc94-config-context-eng.js       # 120 TCs — config schema, GEMINI.md, Phase-Aware
├── tc95-architecture-migration.js   # 140 TCs — directory structure, CC removal, version
├── tc96-edge-recovery.js            # 99 TCs — null/malformed, corruption, degradation
├── tc97-e2e-integration.js          # 80 TCs — full PDCA E2E, hook chain, module integration
├── tc98-performance.js              # 20 TCs — token measurement, load time, file size
```

**Note**: Some suites are consolidated from agent outputs to reduce file count while maintaining full coverage. TC numbering continues from existing tc79.

### 1.2 Test Categories & Distribution

| Category | Suites | TCs | P0 | P1 | P2 |
|----------|:------:|:---:|:--:|:--:|:--:|
| **lib/gemini/ Unit** | tc80-87 | 140 | 64 | 63 | 13 |
| **Hook System** | tc88-90 | 66 | 20 | 35 | 11 |
| **Security** | tc91 | 95 | 45 | 38 | 12 |
| **PDCA Workflow** | tc92 | 80 | 30 | 40 | 10 |
| **Skills & Agents** | tc93 | 80 | 25 | 40 | 15 |
| **Config & Context** | tc94 | 120 | 40 | 55 | 25 |
| **Architecture** | tc95 | 140 | 50 | 65 | 25 |
| **Edge Cases** | tc96 | 99 | 20 | 50 | 29 |
| **E2E + Integration** | tc97 | 80 | 25 | 45 | 10 |
| **Performance** | tc98 | 20 | 5 | 10 | 5 |
| **Hook Detail** (from hooks agent) | tc88-90 overlap | 93 | 23 | 47 | 23 |
| **PDCA Skills Agents Detail** | tc92-93 overlap | 60 | 20 | 30 | 10 |
| **Total** | **19** | **1,073** | ~280 | ~520 | ~273 |

### 1.3 run-all.js Integration

```javascript
// Sprint 5: v2.0.0 Comprehensive Tests (TC-80 ~ TC-98)
{ name: 'TC-80: Gemini Platform', file: 'suites/tc80-gemini-platform.js', priority: 'P0', category: 'unit', sprint: 5 },
{ name: 'TC-81: Gemini Tools', file: 'suites/tc81-gemini-tools.js', priority: 'P0', category: 'unit', sprint: 5 },
{ name: 'TC-82: Gemini Version', file: 'suites/tc82-gemini-version.js', priority: 'P0', category: 'unit', sprint: 5 },
{ name: 'TC-83: Gemini Hooks Adapter', file: 'suites/tc83-gemini-hooks-adapter.js', priority: 'P1', category: 'unit', sprint: 5 },
{ name: 'TC-84: Gemini Policy', file: 'suites/tc84-gemini-policy.js', priority: 'P0', category: 'unit', sprint: 5 },
{ name: 'TC-85: Gemini Tracker', file: 'suites/tc85-gemini-tracker.js', priority: 'P0', category: 'unit', sprint: 5 },
{ name: 'TC-86: Context Fork', file: 'suites/tc86-context-fork.js', priority: 'P1', category: 'unit', sprint: 5 },
{ name: 'TC-87: Import Resolver', file: 'suites/tc87-import-resolver.js', priority: 'P1', category: 'unit', sprint: 5 },
{ name: 'TC-88: Hooks Session Start', file: 'suites/tc88-hooks-session-start.js', priority: 'P0', category: 'e2e', sprint: 5 },
{ name: 'TC-89: Hooks Before Model', file: 'suites/tc89-hooks-before-model.js', priority: 'P1', category: 'e2e', sprint: 5 },
{ name: 'TC-90: Hooks Tool Security', file: 'suites/tc90-hooks-tool-security.js', priority: 'P0', category: 'security', sprint: 5 },
{ name: 'TC-91: Security v2.0.0', file: 'suites/tc91-security-v200.js', priority: 'P0', category: 'security', sprint: 5 },
{ name: 'TC-92: PDCA Workflow', file: 'suites/tc92-pdca-workflow.js', priority: 'P0', category: 'e2e', sprint: 5 },
{ name: 'TC-93: Skills & Agents', file: 'suites/tc93-skills-agents.js', priority: 'P1', category: 'integration', sprint: 5 },
{ name: 'TC-94: Config & Context', file: 'suites/tc94-config-context-eng.js', priority: 'P0', category: 'integration', sprint: 5 },
{ name: 'TC-95: Architecture', file: 'suites/tc95-architecture-migration.js', priority: 'P0', category: 'regression', sprint: 5 },
{ name: 'TC-96: Edge & Recovery', file: 'suites/tc96-edge-recovery.js', priority: 'P1', category: 'edge', sprint: 5 },
{ name: 'TC-97: E2E Integration', file: 'suites/tc97-e2e-integration.js', priority: 'P0', category: 'e2e', sprint: 5 },
{ name: 'TC-98: Performance', file: 'suites/tc98-performance.js', priority: 'P1', category: 'infra', sprint: 5 },
```

---

## 2. Key Test Specifications by Category

### 2.1 lib/gemini/ Module Tests (TC-80~87, 140 TCs)

**TC-80 platform.js** (21 TCs): Singleton export, getAdapter()/getPlatformName()/isGemini() named exports, expandVariables with ${PLUGIN_ROOT} (no ${CLAUDE_PLUGIN_ROOT}), readHookInput JSON parsing + empty fallback, outputAllow/Block exit codes, version "2.0.0", getContextFileName returns "GEMINI.md"

**TC-81 tools.js** (21 TCs): 23 BUILTIN_TOOLS, CLAUDE_TO_GEMINI_MAP absent, FORWARD_ALIASES absent, BKIT_LEGACY_NAMES absent, TOOL_ANNOTATIONS for all 23 tools, resolveToolName with legacy alias, getReadOnlyTools/getStrictReadOnlyTools separation, TOOL_PARAM_CHANGES

**TC-82 version.js** (18 TCs): 14 Feature Flags exactly, fallback "0.34.0" (not "0.29.0"), canUseTeam hardcoded true, env var injection rejection (>2.0.0), preview/nightly parsing, cache + resetCache, getBkitFeatureFlags

**TC-84 policy.js** (22 TCs): SUBAGENT_POLICY_GROUPS (readonly:10 agents, docwrite:4 agents), generateSubagentRules TOML output, modes in LEVEL_POLICY_TEMPLATES (Starter=deny, Dynamic=ask_user), validateTomlStructure with subagent/modes fields, extension policy Tier 2 no-allow rule

**TC-85 tracker.js** (16 TCs): TRACKER_MODE constants, PDCA_TASK_TEMPLATES 6 phases, createPdcaEpic DIRECT mode (tasks array) vs INSTRUCTION mode (hint string), syncPhaseTransition both modes, getTrackerMode reads bkit.config.json

### 2.2 Security Tests (TC-91, 95 TCs)

**SEC-01** (17 TCs): SAFETY_TIERS frozen, 16 agents correct tier, READONLY→auto not yolo, FULL→yolo, safetyTier passed through call chain

**SEC-02** (12 TCs): 34 TOML rules generated (10×3 + 4×1), subagent field format, cto-lead/pdca-iterator NOT in restrictions

**SEC-03** (14 TCs): sanitizeTeamName blocks `../`, spaces, empty, >64 chars, applies in assign+status+create

**SEC-04** (12 TCs): run_shell_command default=ask_user(p5), safe commands allow(p20), curl/wget deny(p100)

**SEC-05** (10 TCs): fork bomb denied with Policy Engine active, safe commands deferred, bkit patterns always run

**SEC-08** (10 TCs): Starter plan_mode deny(p110), Dynamic ask_user(p60), modes TOML array syntax

**SEC-09** (12 TCs): audit log JSON Lines, DENY→HIGH, ASK→MEDIUM, failure doesn't block hook

**SEC-10** (8 TCs): No filesystem paths in MCP responses, agentPath not exposed

### 2.3 Architecture Verification (TC-95, 140 TCs)

- lib/adapters/ NOT exist, lib/gemini/ has 8 files
- Zero `require.*adapters` in lib/hooks/mcp/tests
- CC code absent: CLAUDE_TO_GEMINI_MAP, claudeToolName, isClaudeCode, ${CLAUDE_PLUGIN_ROOT}
- Version "2.0.0" consistent across all configs
- Philosophy symlink intact to bkit-claude-code
- CHANGELOG v2.0.0 entry present
- sync-version.js executable
- lib/common.js getAdapter/getPlatformName/isGemini all functions

### 2.4 E2E + Integration (TC-97, 80 TCs)

- Full PDCA cycle: plan→design→do→check→iterate→report→archive
- Phase-Aware context files loaded correctly per phase
- Progressive Onboarding: session 1 vs session 6
- Hook chain: SessionStart→BeforeAgent→...→SessionEnd all return allow
- Context Anchoring: design phase reads plan doc
- Model routing: check phase→flash hint
- Tracker CRUD direct mode with directCrud=true
- Module integration: policy.js→TOML files, version.js→Feature Flags

### 2.5 Performance (TC-98, 20 TCs)

- GEMINI.md @imports ≤ 3
- Session context < 1000 tokens (4000 chars)
- Per-phase context < 500 tokens
- All lib/gemini/ modules load < 100ms
- version-detector cache hit < 5ms
- GEMINI.md < 50 lines
- bkit.config.json < 300 lines
- session-start.js < 500 lines
- before-tool.js block patterns < 2ms each

---

## 3. Test Infrastructure

### 3.1 Fixtures Updates (tests/fixtures.js)

Add v2.0.0 specific fixtures:

```javascript
// v2.0.0 PDCA status with phase-aware fields
exports.PDCA_STATUS_V200 = {
  version: '2.0',
  primaryFeature: 'test-feature',
  activeFeatures: ['test-feature'],
  features: {
    'test-feature': { phase: 'do', matchRate: null, iterationCount: 0, createdAt: '2026-03-20T00:00:00Z', updatedAt: '2026-03-20T00:00:00Z' }
  },
  pipeline: { currentPhase: 1, level: 'Dynamic', phaseHistory: [] },
  session: { startedAt: '2026-03-20T00:00:00Z', onboardingCompleted: true, lastActivity: '2026-03-20T00:00:00Z' },
  history: []
};

// Safety tier assignments for verification
exports.SAFETY_TIER_MAP = {
  READONLY: ['gap-detector', 'design-validator', 'code-analyzer', 'security-architect', 'qa-monitor', 'qa-strategist', 'starter-guide', 'pipeline-guide', 'bkend-expert', 'enterprise-expert'],
  DOCWRITE: ['report-generator', 'product-manager', 'infra-architect', 'frontend-architect'],
  FULL: ['cto-lead', 'pdca-iterator']
};

// Phase-Aware context map for verification
exports.PHASE_CONTEXT_EXPECTED = {
  plan: ['commands.md', 'pdca-rules.md', 'feature-report.md', 'executive-summary-rules.md'],
  design: ['pdca-rules.md', 'feature-report.md', 'executive-summary-rules.md'],
  do: ['tool-reference.md', 'skill-triggers.md', 'feature-report.md'],
  check: ['pdca-rules.md', 'feature-report.md'],
  act: ['pdca-rules.md', 'feature-report.md'],
  idle: ['commands.md', 'pdca-rules.md', 'agent-triggers.md', 'skill-triggers.md', 'feature-report.md']
};

// Model routing expected values
exports.MODEL_ROUTING_EXPECTED = {
  plan: 'pro', design: 'pro', do: 'pro', check: 'flash', act: 'flash', report: 'flash'
};

// Skill visibility per level
exports.SKILL_VISIBILITY = {
  Starter: 5, Dynamic: 18, Enterprise: null
};
```

### 3.2 test-utils.js Additions

```javascript
// v2.0.0 helpers
exports.createTestProjectV200 = (fixtures = {}) => {
  const dir = createTestProject(fixtures);
  // Ensure lib/gemini/ structure for module tests
  fs.mkdirSync(path.join(dir, '.gemini', 'context'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.gemini', 'policies'), { recursive: true });
  return dir;
};

exports.withVersion200 = (fn) => withVersion('0.34.0', fn);

exports.verifyNoAdaptersRef = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  return !content.includes("require") || !content.includes("adapters");
};
```

---

## 4. Test Execution Strategy

### 4.1 Commands

```bash
# Run all v2.0.0 tests
node tests/run-all.js --sprint 5

# Run P0 only (release gate)
node tests/run-all.js --sprint 5 --priority P0

# Run by category
node tests/run-all.js --sprint 5 --category security
node tests/run-all.js --sprint 5 --category e2e
node tests/run-all.js --sprint 5 --category unit

# Run single suite
node tests/run-all.js --suite tc91
```

### 4.2 Quality Gates

| Gate | Threshold | Action on Failure |
|------|-----------|-------------------|
| P0 tests | 100% pass | Block release |
| P1 tests | >= 98% pass | Fix before release |
| P2 tests | >= 95% pass | Document known issues |
| Total | >= 99% pass | Release approved |
| Security suites | 100% pass | Block release |
| Performance | All within limits | Investigate regressions |

### 4.3 Implementation Priority

```
Phase 1 (Immediate): TC-91 (Security), TC-95 (Architecture) — release gates
Phase 2 (Core):      TC-80~87 (lib/gemini/ modules) — unit regression
Phase 3 (Workflow):  TC-92~93 (PDCA + Skills) — functional verification
Phase 4 (Context):   TC-88~90, TC-94 (Hooks + Config) — CE validation
Phase 5 (Quality):   TC-96~98 (Edge + E2E + Perf) — robustness
```

---

## 5. Bugs Found During Test Design

| # | Source | Issue | Severity | Status |
|---|--------|-------|----------|--------|
| 1 | tc95 | lib/common.js getAdapter undefined (singleton export) | HIGH | ✅ Fixed |
| 2 | tc95 | sync-version.js no executable bit | LOW | ✅ Fixed |
| 3 | tc96 | session-start.js getAdapter destructuring mismatch | MEDIUM | Verify |
| 4 | tc96 | forkContext named snapshot vs merge forkId mismatch | LOW | Backlog |
| 5 | tc97 | bkit.config backend/ vs session-start dynamicIndicators | LOW | Backlog |
| 6 | tc91 | SEC-10: handleSpawnAgent line 457 still exposes agentPath | MEDIUM | Backlog |

---

## 6. Agent Source Reference

Each agent's detailed TC specifications are preserved in task outputs:

| Agent | TCs | Output |
|-------|:---:|--------|
| test-plan-gemini-modules | 140 | TC-80~87 per-module specs with input/expected/priority |
| test-plan-hooks | 159 | 16 suites, CC removal grep tests, dual-mode verification |
| test-plan-security | 95 | SEC-01~10 executable test code written to tc80-security-v200.js |
| test-plan-pdca-skills | 220 | PDCA workflow, skills classification, agent safety, PM team |
| test-plan-config-context | 120 | Config schema, GEMINI.md lean, Phase-Aware, Model Routing |
| test-plan-architecture | 140 | 138 pass + 2 bugs found (both fixed), directory/require/CC verification |
| test-plan-edge-cases | 99 | Null/malformed/unicode/concurrency/corruption/degradation |
| test-plan-e2e | 100 | Full PDCA E2E, hook chain, module integration, performance |
