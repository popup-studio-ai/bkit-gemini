# bkit v1.5.7 Comprehensive Test - Design Document

> **Summary**: bkit v1.5.7 전체 기능 Gemini CLI 기반 종합 테스트 상세 설계서
>
> **Project**: bkit-gemini (Vibecoding Kit - Gemini CLI Edition)
> **Version**: v1.5.7
> **Author**: PDCA Design Phase
> **Date**: 2026-03-04
> **Status**: Draft
> **Plan Reference**: `docs/01-plan/features/bkit-v157-comprehensive-test.plan.md`

---

## 1. Design Overview

### 1.1 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Test Execution Layer                       │
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  TS-A: Unit  │  │ TS-B: Integ  │  │  TS-C: E2E         │  │
│  │  Node.js     │  │ CLI+LogCheck │  │  Gemini Interactive │  │
│  │  runner      │  │              │  │                     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬─────────┘  │
│         │                  │                      │            │
│  ┌──────┴──────────────────┴──────────────────────┴─────────┐ │
│  │              Test Infrastructure Layer                     │ │
│  │  test-utils.js | fixtures.js | gemini-test-helper.sh      │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ TS-D: UX    │  │ TS-E: Regress│  │ TS-F: v0.32.x      │  │
│  │ Checklist   │  │ Multi-ver    │  │ Feature-specific    │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Test File Structure

```
tests/
├── run-all.js                     # Main runner (updated)
├── test-utils.js                  # Shared utilities (updated)
├── fixtures.js                    # Test fixtures (updated)
├── suites/
│   ├── tc01-hooks.js              # Existing (1 known fail)
│   ├── tc02-skills.js             # Existing
│   ├── ...
│   ├── tc21-v032-migration.js     # Existing (v1.5.7)
│   ├── tc22-pdca-status-path.js   # NEW: PDCA 상태 경로 수정
│   ├── tc23-tracker-bridge.js     # NEW: Tracker Bridge 심화
│   └── tc24-runtime-hooks.js      # NEW: RuntimeHook SDK 모드
├── integration/
│   ├── run-integration.sh         # NEW: Integration test runner
│   ├── int-session-start.sh       # NEW: SessionStart pipeline
│   ├── int-hook-chain.sh          # NEW: Hook chain verification
│   ├── int-policy-engine.sh       # NEW: Policy Engine E2E
│   ├── int-context-import.sh      # NEW: Context import chain
│   └── int-version-compat.sh      # NEW: Multi-version compat
├── e2e/
│   ├── E2E-CHECKLIST.md           # NEW: E2E 수동 테스트 체크리스트
│   ├── e2e-pdca-cycle.md          # NEW: PDCA 전체 사이클 시나리오
│   ├── e2e-skill-activation.md    # NEW: Skill 활성화 시나리오
│   └── e2e-agent-trigger.md       # NEW: Agent 트리거 시나리오
└── ux/
    ├── UX-EVALUATION.md           # NEW: UX 평가 시트
    └── ux-multilang.md            # NEW: 다국어 UX 평가
```

---

## 2. TS-A: Unit Tests Design

### 2.1 TC-22: PDCA Status Path Migration

**Purpose**: v1.5.8에서 `docs/.pdca-status.json` → `.pdca-status.json` 경로 마이그레이션 관련 기존 실패 5건 해결

**File**: `tests/suites/tc22-pdca-status-path.js`

```javascript
// TC-22-01: PDCA status reads from root .pdca-status.json
// TC-22-02: PDCA status fallback to docs/.pdca-status.json (legacy)
// TC-22-03: after-tool.js updates correct status path
// TC-22-04: after-tool.js design→do transition works with root path
// TC-22-05: session-start.js reads PDCA status from correct path
// TC-22-06: .bkit/state/memory.json path resolution
// TC-22-07: Status file auto-migration from legacy to current
// TC-22-08: Concurrent status read/write safety
```

| Test ID | Description | Setup | Input | Expected |
|---------|-------------|-------|-------|----------|
| TC-22-01 | Root path read | `.pdca-status.json` at root | Read status | Success, correct content |
| TC-22-02 | Legacy path fallback | `docs/.pdca-status.json` only | Read status | Falls back to legacy |
| TC-22-03 | Status update path | Root status exists | write_file hook → phase change | Root file updated |
| TC-22-04 | Design→Do transition | Phase=design, root status | write_file in src/ | Phase becomes "do" |
| TC-22-05 | SessionStart reads | Root status with feature | session-start.js | Feature name in context |
| TC-22-06 | Memory path | `.bkit/state/memory.json` | Read memory | sessionCount > 0 |
| TC-22-07 | Auto-migration | Legacy path only | Status read | Creates root copy |
| TC-22-08 | Write safety | Root status | Concurrent write_file | No data corruption |

### 2.2 TC-23: Tracker Bridge Deep Tests

**Purpose**: tracker-bridge.js 모듈의 모든 exported 함수 단위 검증

**File**: `tests/suites/tc23-tracker-bridge.js`

```javascript
// TC-23-01: isTrackerAvailable() returns false for v0.31.0
// TC-23-02: isTrackerAvailable() returns true for v0.32.0+
// TC-23-03: createPdcaEpic() generates correct context string
// TC-23-04: syncPhaseTransition() returns instruction text
// TC-23-05: getVisualizationHint() contains tracker_visualize reference
// TC-23-06: registerTrackerIds() stores and retrieves IDs
// TC-23-07: getTrackerContextInjection() for plan phase
// TC-23-08: getTrackerContextInjection() for check phase
// TC-23-09: getBridgeStatus() returns complete status object
// TC-23-10: PDCA_TO_TRACKER_STATUS mapping completeness
```

| Test ID | Description | Version | Expected Output |
|---------|-------------|---------|-----------------|
| TC-23-01 | Tracker unavailable | v0.31.0 | `false` |
| TC-23-02 | Tracker available | v0.32.0 | `true` |
| TC-23-03 | Epic context | v0.32.0 | Contains feature name + "tracker_create_task" |
| TC-23-04 | Phase sync | v0.32.0 | Contains "tracker_update_task" instruction |
| TC-23-05 | Visualization hint | v0.32.0 | Contains "tracker_visualize" |
| TC-23-06 | ID registration | v0.32.0 | registerTrackerIds() → getTrackerIds() roundtrip |
| TC-23-07 | Plan injection | v0.32.0, phase=plan | Contains PDCA context for plan |
| TC-23-08 | Check injection | v0.32.0, phase=check | Contains PDCA context for check |
| TC-23-09 | Bridge status | v0.32.0 | `{ available: true, bridgeEnabled: true, ... }` |
| TC-23-10 | Status mapping | N/A | 5 PDCA phases mapped (plan,design,do,check,report) |

### 2.3 TC-24: RuntimeHook SDK Mode Tests

**Purpose**: hook-adapter.js + runtime-hooks.js의 SDK 모드 동작 검증

**File**: `tests/suites/tc24-runtime-hooks.js`

```javascript
// TC-24-01: supportsRuntimeHookFunctions() for v0.31.0+ → true
// TC-24-02: supportsRuntimeHookFunctions() for v0.30.0 → false
// TC-24-03: HOT_PATH_HOOKS has exactly 6 events
// TC-24-04: registerRuntimeHooks() requires hookSystem param
// TC-24-05: loadHookHandler() loads before-tool.js handler
// TC-24-06: loadHookHandler() returns null for non-existent file
// TC-24-07: activateRuntimeHooks() checks feature flag first
// TC-24-08: getMigrationStatus() for v0.32.0 returns sdk+command mode
```

| Test ID | Description | Setup | Expected |
|---------|-------------|-------|----------|
| TC-24-01 | SDK support v0.31.0 | `GEMINI_CLI_VERSION=0.31.0` | `true` |
| TC-24-02 | SDK no support v0.30.0 | `GEMINI_CLI_VERSION=0.30.0` | `false` |
| TC-24-03 | Hot path count | N/A | 6 events in array |
| TC-24-04 | hookSystem required | Call with null | Throws or returns false |
| TC-24-05 | Load handler | before-tool.js | `typeof handler === 'function'` |
| TC-24-06 | Load non-existent | fake-hook.js | `null` |
| TC-24-07 | Activate with flag | Mock hookSystem | Calls registerRuntimeHooks |
| TC-24-08 | Migration status | `GEMINI_CLI_VERSION=0.32.0` | `{ mode: 'sdk+command', sdkRegistered: 6 }` |

---

## 3. TS-B: Integration Tests Design

### 3.1 Shell-based Integration Test Runner

**File**: `tests/integration/run-integration.sh`

```bash
#!/bin/bash
# Integration test runner for bkit-gemini v1.5.7
# Runs hook scripts with real Gemini CLI environment simulation
# Usage: bash tests/integration/run-integration.sh [test-name]
```

### 3.2 Integration Test Details

#### INT-01: SessionStart Full Pipeline

**File**: `tests/integration/int-session-start.sh`

```
Precondition:
  - Clean test project at /tmp/bkit-integ-test/
  - .pdca-status.json with test-feature in "design" phase
  - bkit.config.json copied from plugin root
  - GEMINI_CLI_VERSION=0.32.1

Steps:
  1. Execute: echo '{}' | node hooks/scripts/session-start.js
  2. Capture stdout JSON output

Verification:
  - [ ] Output contains "context" field
  - [ ] Context includes "bkit Vibecoding Kit v1.5.7"
  - [ ] Context includes version compatibility info
  - [ ] Context includes PDCA status (feature name, phase)
  - [ ] Context includes tracker context (v0.32.0+)
  - [ ] Extension policy generated in policies/ dir
  - [ ] Exit code = 0
  - [ ] Execution time < 3 seconds
```

#### INT-02: Hook Chain (Before→Tool→After)

```
Precondition:
  - Test project with PDCA status (phase=design)

Steps:
  1. Execute before-tool.js with write_file input
  2. Capture before-tool output (warnings/guards)
  3. Execute after-tool.js with same write_file context
  4. Read PDCA status file

Verification:
  - [ ] before-tool.js provides context/warning for plan-phase writes
  - [ ] after-tool.js detects src/ write and transitions phase
  - [ ] PDCA status updated: design → do
  - [ ] No errors in either hook
```

#### INT-05: Policy Engine Generation

```
Precondition:
  - Clean test project
  - GEMINI_CLI_VERSION=0.32.0

Steps:
  1. Execute session-start.js
  2. Check policies/ directory
  3. Read generated .toml file

Verification:
  - [ ] policies/bkit-extension-policy.toml exists
  - [ ] Contains 4 [[rule]] blocks
  - [ ] 2 deny rules (rm -rf, git push --force)
  - [ ] 2 ask_user rules (git reset --hard, rm -r)
  - [ ] No "decision = allow" in extension policy
  - [ ] For v0.31.0: policy NOT generated (feature flag gating)
```

#### INT-08/09: Feature Flag Gating

```
Test Matrix:
  | Feature Flag               | v0.29.0 | v0.30.0 | v0.31.0 | v0.32.0 |
  |---------------------------|---------|---------|---------|---------|
  | hasExtensionRegistry      | true    | true    | true    | true    |
  | hasPolicyEngine           | false   | true    | true    | true    |
  | hasLevelPolicies          | false   | false   | true    | true    |
  | hasRuntimeHookFunctions   | false   | false   | true    | true    |
  | hasTaskTracker            | false   | false   | false   | true    |
  | hasExtensionPolicies      | false   | false   | false   | true    |
  | hasA2AStreaming           | false   | false   | false   | true    |

Steps (per version):
  1. Set GEMINI_CLI_VERSION
  2. Call getFeatureFlags()
  3. Verify each flag matches expected matrix

Verification:
  - [ ] All 29 flags correct for each version
  - [ ] No false positives (feature enabled too early)
  - [ ] No false negatives (feature missing when expected)
```

#### INT-11/12: Extension Policy Enforcement

```
Steps for INT-11 (DENY):
  1. Start Gemini CLI session with bkit extension
  2. Request: "rm -rf /tmp/test" 실행
  3. Observe Gemini CLI response

Verification:
  - [ ] Command blocked by extension policy
  - [ ] User sees denial message
  - [ ] No actual execution occurs

Steps for INT-12 (ASK_USER):
  1. Start Gemini CLI session
  2. Request: "git reset --hard HEAD~1"
  3. Observe prompt

Verification:
  - [ ] Gemini CLI shows ask_user confirmation
  - [ ] User can approve or deny
  - [ ] Deny → command not executed
```

#### INT-13: Dual-Mode Hook Execution

```
Steps:
  1. Load each hot-path hook script
  2. Test handler() function call (SDK mode)
  3. Test stdin pipe execution (command mode)

6 Hot-Path Hooks:
  - before-agent.js: handler({}) → processHook result
  - before-model.js: handler({}) → processHook result
  - after-model.js: handler({}) → processHook result
  - before-tool-selection.js: handler({}) → processHook result
  - before-tool.js: handler({tool_name, tool_input}) → context
  - after-tool.js: handler({tool_name, tool_input}) → phase update

Verification:
  - [ ] All 6 handlers return valid objects
  - [ ] All 6 stdin pipes exit 0
  - [ ] Results equivalent between modes
```

#### INT-16: Claude→Gemini Tool Mapping

```
Steps:
  1. Import tool-registry.js
  2. Check CLAUDE_TO_GEMINI_MAP entries
  3. Verify each Claude tool maps to valid Gemini tool

Mapping Table:
  | Claude Tool   | Gemini Tool          | Bidirectional |
  |---------------|----------------------|:-------------:|
  | TaskCreate    | tracker_create_task  | No            |
  | TaskUpdate    | tracker_update_task  | No            |
  | TaskGet       | tracker_get_task     | No            |
  | TaskList      | tracker_list_tasks   | No            |

Verification:
  - [ ] 4 mappings present
  - [ ] All target tools exist in ALL_BUILTIN_TOOL_NAMES
  - [ ] resolveToolName handles reverse lookup
```

#### INT-18: Tracker Bridge Context Injection

```
Precondition:
  - GEMINI_CLI_VERSION=0.32.1
  - PDCA feature "test-feat" in "plan" phase

Steps:
  1. Call getTrackerContextInjection("test-feat", "plan")
  2. Examine returned string

Verification:
  - [ ] Contains tracker_create_task instruction
  - [ ] Contains feature name "test-feat"
  - [ ] Contains PDCA phase "plan"
  - [ ] For v0.31.0: returns empty string (tracker unavailable)
```

#### INT-20: Import Resolver Caching

```
Steps:
  1. Import import-resolver.js
  2. Resolve same import path twice
  3. Compare execution times

Verification:
  - [ ] Second call significantly faster (cache hit)
  - [ ] Cache respects cacheTTL from config (30000ms)
  - [ ] Cache invalidation works after TTL
```

---

## 4. TS-C: E2E Tests Design

### 4.1 E2E Test Format

Each E2E test is a Gemini CLI interactive scenario documented as a step-by-step checklist.

**Execution Method**:
1. Open Gemini CLI: `gemini`
2. Follow steps in checklist
3. Mark PASS/FAIL for each verification point
4. Record observations

### 4.2 E2E-01: First Session Startup

```
Environment: Gemini CLI v0.32.1 + bkit extension installed

Steps:
  1. Open terminal
  2. Navigate to a test project directory
  3. Run: gemini
  4. Wait for session initialization

Verify:
  □ bkit version displayed (v1.5.7)
  □ Project level detected (Starter/Dynamic/Enterprise)
  □ Previous work detection (if any .pdca-status.json)
  □ Feature suggestions shown
  □ Response language matches system locale or defaults to English
  □ No error messages in output
  □ Session start time < 5 seconds
```

### 4.3 E2E-02: PDCA Full Cycle

```
Steps:
  1. "새로운 기능을 계획하고 싶어. test-auth라는 이름으로."
     → Verify: /pdca plan 트리거, Plan 문서 생성 제안

  2. "/pdca plan test-auth"
     → Verify: docs/01-plan/features/test-auth.plan.md 생성
     → Verify: 템플릿 기반 구조, 섹션 완전성

  3. "/pdca design test-auth"
     → Verify: docs/02-design/features/test-auth.design.md 생성
     → Verify: Plan 문서 참조, 구현 순서 포함

  4. src/auth.js 파일 작성
     → Verify: after-tool.js가 design→do 전환 감지

  5. "/pdca analyze test-auth"
     → Verify: gap-detector Agent 실행
     → Verify: Match Rate 계산 및 표시
     → Verify: docs/03-analysis/test-auth.analysis.md 생성

  6. "/pdca report test-auth" (if matchRate >= 90%)
     → Verify: report-generator Agent 실행
     → Verify: docs/04-report/features/test-auth.report.md 생성

  7. "/pdca status"
     → Verify: 전체 진행 상태 시각화
     → Verify: [Plan]✅→[Design]✅→[Do]✅→[Check]✅→[Report]✅

Duration: ~15 minutes
```

### 4.4 E2E-04: Agent Auto-Trigger (Korean)

```
Steps:
  1. Session start
  2. Input: "보안 검토해줘"
     → Verify: security-architect 또는 code-analyzer Agent 활성화

  3. Input: "코드 분석해줘"
     → Verify: code-analyzer Agent 활성화

  4. Input: "설계 검증해줘"
     → Verify: gap-detector Agent 활성화

  5. Input: "보고서 작성해줘"
     → Verify: report-generator Agent 활성화

Verify per trigger:
  □ Correct Agent selected
  □ Agent provides relevant output
  □ No false triggers (unrelated Agent)
  □ Response in Korean (8-language support)
```

### 4.5 E2E-07: Multi-Language Switch

```
Steps:
  1. Input (KO): "코드 품질을 확인해줘"
     → Verify: Korean response, code-analyzer trigger

  2. Input (EN): "Now check the security vulnerabilities"
     → Verify: English response, security-related agent

  3. Input (JA): "テストを実行して"
     → Verify: Japanese recognized, test-related response

  4. Input (mixed KO+EN): "API endpoint 설계해줘"
     → Verify: Handles mixed input, no crash

Verify:
  □ Language detection correct for each input
  □ Response language matches input language
  □ No error on language switch
  □ Agent triggers work across languages
```

### 4.6 E2E-13: Dangerous Command Block

```
Steps:
  1. Input: "rm -rf / 실행해줘"
     → Verify: Extension policy DENY blocks execution
     → Verify: Safety warning displayed

  2. Input: "git push --force origin main"
     → Verify: Extension policy DENY blocks execution

  3. Input: "rm -r ./node_modules"
     → Verify: Extension policy ASK_USER prompts

Verify:
  □ Dangerous commands never executed
  □ Clear safety explanation provided
  □ ask_user commands show confirmation prompt
  □ User can cancel ask_user prompts
```

---

## 5. TS-D: UX Tests Design

### 5.1 UX Evaluation Sheet

**File**: `tests/ux/UX-EVALUATION.md`

```markdown
# UX Evaluation Sheet - bkit v1.5.7

Date: ____
Evaluator: ____
CLI Version: ____

## Scoring: 1(Poor) - 5(Excellent)

### UX-01: SessionStart Guidance Clarity
| Criteria | Score | Notes |
|----------|:-----:|-------|
| Level display clear | /5 | |
| Feature list helpful | /5 | |
| Next action obvious | /5 | |
| **Subtotal** | /15 | |

### UX-02: PDCA Status Visualization
| Criteria | Score | Notes |
|----------|:-----:|-------|
| Progress bar readable | /5 | |
| Match rate prominent | /5 | |
| Phase badges intuitive | /5 | |
| **Subtotal** | /15 | |

...
(10 UX aspects, each with 3 criteria, max 150 points)
```

### 5.2 UX Pass Criteria

| UX Aspect | Weight | Pass Threshold |
|-----------|:------:|:--------------:|
| UX-01: Startup clarity | 10% | >= 12/15 |
| UX-02: Status visualization | 10% | >= 12/15 |
| UX-03: Error messages | 15% | >= 12/15 |
| UX-04: Korean quality | 10% | >= 12/15 |
| UX-05: English quality | 10% | >= 12/15 |
| UX-06: Report readability | 10% | >= 12/15 |
| UX-07: Skill guidance | 10% | >= 12/15 |
| UX-08: Agent accuracy | 10% | >= 12/15 |
| UX-09: Mixed-lang stability | 5% | >= 12/15 |
| UX-10: Feature report | 10% | >= 12/15 |
| **Total** | 100% | >= 135/150 (90%) |

---

## 6. TS-E: Regression Tests Design

### 6.1 Multi-Version Test Matrix

**Execution**: For each version, set `GEMINI_CLI_VERSION` env var and run targeted tests.

```bash
# Example execution
for version in 0.29.0 0.30.0 0.31.0 0.32.0 0.32.1; do
  GEMINI_CLI_VERSION=$version node tests/run-all.js 2>&1 | tail -5
done
```

### 6.2 Regression Test Details

| ID | Version | Test Focus | Key Assertions |
|----|---------|------------|----------------|
| REG-01 | v0.29.0 | Basic hooks | session-start outputs context, hooks exit 0 |
| REG-02 | v0.29.0 | Feature flags | 7 true, 22 false, no tracker/policy |
| REG-03 | v0.30.0 | Policy Engine | generatePolicyFile creates .toml, no level policies |
| REG-04 | v0.30.0 | BC-2 compat | No excludeTools in gemini-extension.json → no error |
| REG-05 | v0.31.0 | Level Policy | Level-specific policy generation works |
| REG-06 | v0.31.0 | Dual-mode | 6 hooks have handler() + stdin, all work |
| REG-07 | v0.32.0 | Full v0.32.0 | 29 flags true, tracker available, policies generated |
| REG-08 | v0.32.1 | Latest | All features including tracker bridge context |

### 6.3 Known Pre-existing Issues

| Issue | Tests Affected | Root Cause | Status |
|-------|---------------|------------|--------|
| PDCA status path | HOOK-28, E2E-01/03/05, P2-08 | v1.5.8 path migration | TC-22 will fix |
| | 5 total | `docs/.pdca-status.json` → root | |

---

## 7. TS-F: v0.32.x Feature Tests Design

### 7.1 Task Tracker Tests (V32-01~02)

```javascript
// V32-01: Tracker availability
test('Tracker available for v0.32.0+', () => {
  setVersion('0.32.0');
  assert(isTrackerAvailable() === true);
  setVersion('0.31.0');
  assert(isTrackerAvailable() === false);
});

// V32-02: PDCA epic context
test('createPdcaEpic generates context', () => {
  setVersion('0.32.0');
  const ctx = createPdcaEpic('test-feature');
  assertContains(ctx, 'tracker_create_task');
  assertContains(ctx, 'test-feature');
});
```

### 7.2 Extension Policy Tests (V32-03~05)

```javascript
// V32-03: Policy file generation
test('Extension policy generated with 4 rules', () => {
  setVersion('0.32.0');
  generateExtensionPolicy(pluginRoot);
  const content = readFile('policies/bkit-extension-policy.toml');
  assertEqual(countMatches(content, '[[rule]]'), 4);
});

// V32-04: DENY rules
test('DENY rules block rm -rf and git push --force', () => {
  const content = readFile('policies/bkit-extension-policy.toml');
  assertContains(content, 'decision = "deny"');
  assertContains(content, 'rm -rf');
  assertContains(content, 'git push --force');
});

// V32-05: ASK_USER rules
test('ASK_USER rules for git reset --hard and rm -r', () => {
  const content = readFile('policies/bkit-extension-policy.toml');
  assertContains(content, 'decision = "ask_user"');
  assertContains(content, 'git reset --hard');
  assertContains(content, 'rm -r');
});
```

### 7.3 RuntimeHook SDK Tests (V32-06~07)

```javascript
// V32-06: Hot-path hooks have handler()
test('6 hot-path hooks export handler function', () => {
  const hooks = ['before-agent', 'before-model', 'after-model',
                 'before-tool-selection', 'before-tool', 'after-tool'];
  for (const hook of hooks) {
    const mod = require(`hooks/scripts/${hook}.js`);
    assert(typeof mod.handler === 'function');
  }
});

// V32-07: Lifecycle hooks command-only
test('4 lifecycle hooks have NO handler export', () => {
  const hooks = ['session-start', 'session-end', 'after-agent', 'pre-compress'];
  for (const hook of hooks) {
    const mod = require(`hooks/scripts/${hook}.js`);
    assert(mod.handler === undefined || typeof mod.handler !== 'function');
  }
});
```

### 7.4 Breaking Changes Tests (V32-08~10)

```javascript
// V32-08: BC-1 grep_search file_pattern
test('tool-reference.md documents file_pattern rename', () => {
  const content = readFile('.gemini/context/tool-reference.md');
  assertContains(content, 'file_pattern');
  assertContains(content, 'BC-1');
});

// V32-09: BC-2 read_file start_line/end_line
test('tool-reference.md documents read_file line params', () => {
  const content = readFile('.gemini/context/tool-reference.md');
  assertContains(content, 'start_line');
  assertContains(content, 'end_line');
});

// V32-10: BC-3 replace allow_multiple
test('tool-reference.md documents allow_multiple', () => {
  const content = readFile('.gemini/context/tool-reference.md');
  assertContains(content, 'allow_multiple');
});
```

---

## 8. Test Infrastructure Updates

### 8.1 test-utils.js Enhancements

```javascript
// New utility functions needed:

/**
 * Set Gemini CLI version for testing with auto-cleanup
 */
function withVersion(version, fn) {
  const vd = require(PLUGIN_ROOT + '/lib/adapters/gemini/version-detector');
  vd.resetCache();
  const original = process.env.GEMINI_CLI_VERSION;
  process.env.GEMINI_CLI_VERSION = version;
  try {
    return fn();
  } finally {
    vd.resetCache();
    if (original !== undefined) process.env.GEMINI_CLI_VERSION = original;
    else delete process.env.GEMINI_CLI_VERSION;
  }
}

/**
 * Create test project with PDCA status at correct path
 */
function createTestProjectV2(fixtures = {}) {
  // Creates .pdca-status.json at root (not docs/)
  // + Creates .bkit/state/memory.json
}

/**
 * Count regex matches in string
 */
function countMatches(str, pattern) {
  return (str.match(new RegExp(pattern, 'g')) || []).length;
}
```

### 8.2 fixtures.js Enhancements

```javascript
// New fixtures needed:

const PDCA_STATUS_V157 = {
  version: "2.0",
  activeFeatures: {
    "test-feature": {
      phase: "design",
      matchRate: null,
      lastUpdated: "2026-03-04T00:00:00Z"
    }
  }
};

const TRACKER_BRIDGE_FIXTURE = {
  featureName: "test-feature",
  epicId: null,
  taskIds: {}
};
```

### 8.3 run-all.js Updates

```javascript
// Add new suites in order:
{ name: 'TC-22: PDCA Status Path', file: 'suites/tc22-pdca-status-path.js', priority: 'P0' },
{ name: 'TC-23: Tracker Bridge Deep', file: 'suites/tc23-tracker-bridge.js', priority: 'P0' },
{ name: 'TC-24: RuntimeHook SDK', file: 'suites/tc24-runtime-hooks.js', priority: 'P0' },
```

---

## 9. Implementation Order

```
Phase 1: Unit Test Infrastructure (Day 1)
  ① test-utils.js enhancements (withVersion, createTestProjectV2)
  ② fixtures.js new fixtures
  ③ TC-22: PDCA status path tests (fixes 5 pre-existing fails)
  ④ TC-23: Tracker Bridge deep tests
  ⑤ TC-24: RuntimeHook SDK tests
  ⑥ run-all.js registration

Phase 2: Integration Tests (Day 2)
  ⑦ tests/integration/ directory structure
  ⑧ int-session-start.sh
  ⑨ int-hook-chain.sh
  ⑩ int-policy-engine.sh
  ⑪ int-version-compat.sh
  ⑫ run-integration.sh runner

Phase 3: E2E + UX Documents (Day 3)
  ⑬ tests/e2e/E2E-CHECKLIST.md
  ⑭ tests/e2e/e2e-pdca-cycle.md
  ⑮ tests/e2e/e2e-skill-activation.md
  ⑯ tests/e2e/e2e-agent-trigger.md
  ⑰ tests/ux/UX-EVALUATION.md
  ⑱ tests/ux/ux-multilang.md

Phase 4: Execution & Report
  ⑲ Run all unit tests → target 97%+ pass rate
  ⑳ Run integration tests on Gemini CLI v0.32.1
  ㉑ Execute E2E checklists on Gemini CLI
  ㉒ Complete UX evaluation
  ㉓ Generate test report
```

---

## 10. Acceptance Criteria

### 10.1 Unit Tests (TS-A)

| Metric | Current | Target |
|--------|:-------:|:------:|
| Total Tests | 193 | ~220 |
| Pass Rate | 97.4% (188/193) | >= 99% |
| Known Fails | 5 (status path) | 0 (fixed by TC-22) |
| New Suites | 0 | 3 (TC-22/23/24) |

### 10.2 Integration Tests (TS-B)

| Metric | Target |
|--------|:------:|
| Total Tests | 25 |
| Pass Rate | 100% |
| Execution Env | Gemini CLI v0.32.1 |

### 10.3 E2E Tests (TS-C)

| Metric | Target |
|--------|:------:|
| Total Scenarios | 15 |
| Pass Rate | >= 90% (13/15) |
| Execution | Manual on Gemini CLI |

### 10.4 Overall

```
Combined Test Coverage:
┌────────────────────────────────────────────┐
│  Component Coverage Target                  │
├────────────────────────────────────────────┤
│  10 Hooks:      100% (all hooks tested)    │
│  35 Lib modules: 90%+ (key modules)        │
│  29 Skills:      E2E sampling (5+ tested)  │
│  16 Agents:      E2E trigger test          │
│  6 Context:      Integration verified      │
│  23 Tools:       Registry + annotation     │
│  4 Policies:     Generation + enforcement  │
├────────────────────────────────────────────┤
│  Overall:  ~280 test items                 │
│  Target:   95%+ combined pass rate         │
└────────────────────────────────────────────┘
```

---

## 11. Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-04 | Initial test design document | PDCA Design Phase |
