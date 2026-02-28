# Plan: bkit v1.5.6 Comprehensive Gemini CLI Test

> **Feature**: bkit-v156-gemini-test
> **Date**: 2026-02-28
> **Version**: bkit-gemini v1.5.6
> **Author**: CTO Team
> **Status**: Approved
> **Method**: PDCA Plan (Full-scope Test)
> **Related**: gemini-cli-031-migration (v1.5.6 implementation complete, 100% match rate)

---

## 1. Test Objectives

### 1.1 Why This Test Plan?

bkit v1.5.6에서 Gemini CLI v0.31.0 마이그레이션으로 9개 변경사항(M-01~M-09)을 구현했다. Gap 분석으로 설계-구현 일치율 100%가 확인되었지만, 이는 **코드가 설계서대로 작성되었는지**를 확인한 것이다. 이제 필요한 것은:

1. **v1.5.6 신규 기능이 실제로 동작하는가?** (Unit Test)
2. **변경이 기존 121개 테스트를 깨뜨리지 않았는가?** (Regression Test)
3. **전체 PDCA 워크플로우가 정상 동작하는가?** (E2E Test)
4. **실제 Gemini CLI에서 사용자 경험이 정상인가?** (UX Test)
5. **커버리지 갭 13개 영역이 테스트되는가?** (Coverage Gap Fix)

### 1.2 Test Scope

| Category | Count | Coverage Goal |
|----------|:-----:|:------------:|
| v1.5.6 변경사항 검증 (M-01~M-09) | 9 items | 100% |
| v1.5.6 신규 함수/상수 | 8 functions + 3 constants | 100% |
| Agents (16개) | 16 | 100% loading + frontmatter |
| Skills (29개) | 29 | 100% loading + activation |
| Hooks (10개 이벤트) | 10 | 100% execution + I/O |
| TOML Commands (18개) | 18 | 100% parsing |
| Lib Modules (40+개) | 40+ | Critical path 100% |
| MCP Server (16 tools) | 16 | Registration + execution |
| PDCA E2E Flow | 7 phases | Full cycle |
| Coverage Gap Fix | 13 areas | Priority gaps covered |
| User Experience | 18 scenarios | Interactive verification |

---

## 2. Test Strategy

### 2.1 Four-Layer Testing

```
Layer 4: UX Test (Gemini CLI Interactive)
  └─ 실제 Gemini CLI에서 사용자 시나리오 실행
  └─ 18 interactive scenarios
  └─ 수동 실행, PASS/FAIL 판정

Layer 3: E2E Test (node tests/run-all.js)
  └─ 19개 test suite, TC01~TC19
  └─ Hook → Skill → Agent → PDCA 전체 흐름
  └─ 자동 실행, exit code 판정

Layer 2: Unit Test (v1.5.6 신규)
  └─ TC-18: v0.31.0 Feature Flags + Tool Annotations + Level Policy
  └─ TC-19: Hook Adapter + Coverage Gap Tests
  └─ 자동 실행, assert 판정

Layer 1: Regression Test (기존 121 tests)
  └─ TC-01~TC-17 전체 pass 확인
  └─ 자동 실행, 기존 assert 판정
```

### 2.2 Priority Classification

| Priority | Description | Criteria |
|:--------:|------------|----------|
| **P0** | Release Blocker | v1.5.6 변경사항 + 핵심 기능. 실패 시 릴리즈 불가 |
| **P1** | High Priority | 기존 기능 regression + 커버리지 갭. 실패 시 수정 후 릴리즈 |
| **P2** | Medium | 부가 기능, 문서, 스타일. 실패 시 known issue로 릴리즈 가능 |

---

## 3. Unit Tests - v1.5.6 신규 기능 검증 (P0)

### 3.1 M-01: Version Detector — 9 New Feature Flags

| ID | Test Case | Input | Expected | Priority |
|----|-----------|-------|----------|:--------:|
| UT-01 | v0.31.0 feature flags 전체 (18개) | `GEMINI_CLI_VERSION=0.31.0` | 18개 모두 `true` | P0 |
| UT-02 | hasRuntimeHookFunctions (v0.31.0) | `GEMINI_CLI_VERSION=0.31.0` | `true` | P0 |
| UT-03 | hasRuntimeHookFunctions (v0.30.0) | `GEMINI_CLI_VERSION=0.30.0` | `false` | P0 |
| UT-04 | hasBrowserAgent (v0.31.0) | `GEMINI_CLI_VERSION=0.31.0` | `true` | P0 |
| UT-05 | hasProjectLevelPolicy (v0.31.0) | `GEMINI_CLI_VERSION=0.31.0` | `true` | P0 |
| UT-06 | hasMcpProgress (v0.31.0) | `GEMINI_CLI_VERSION=0.31.0` | `true` | P0 |
| UT-07 | hasParallelReadCalls (v0.31.0) | `GEMINI_CLI_VERSION=0.31.0` | `true` | P0 |
| UT-08 | hasPlanModeCustomStorage (v0.31.0) | `GEMINI_CLI_VERSION=0.31.0` | `true` | P0 |
| UT-09 | hasToolAnnotations (v0.31.0) | `GEMINI_CLI_VERSION=0.31.0` | `true` | P0 |
| UT-10 | hasExtensionFolderTrust (v0.31.0) | `GEMINI_CLI_VERSION=0.31.0` | `true` | P0 |
| UT-11 | hasAllowMultipleReplace (v0.31.0) | `GEMINI_CLI_VERSION=0.31.0` | `true` | P0 |
| UT-12 | v0.30.0 flags unchanged (9개) | `GEMINI_CLI_VERSION=0.30.0` | 9개 true, 9개 false | P0 |
| UT-13 | v0.29.0 flags unchanged (4개) | `GEMINI_CLI_VERSION=0.29.0` | 4개 true, 14개 false | P0 |
| UT-14 | 총 플래그 개수 검증 | getFeatureFlags() | Object.keys().length === 18 | P0 |

### 3.2 M-06: Tool Registry — TOOL_ANNOTATIONS

| ID | Test Case | Input | Expected | Priority |
|----|-----------|-------|----------|:--------:|
| UT-15 | TOOL_ANNOTATIONS 엔트리 수 | `TOOL_ANNOTATIONS` | 17 entries | P0 |
| UT-16 | readOnlyHint true 도구 수 | filter readOnlyHint===true | 9 tools | P0 |
| UT-17 | destructiveHint true 도구 | filter destructiveHint===true | 1 tool (run_shell_command) | P0 |
| UT-18 | idempotentHint true 도구 수 | filter idempotentHint===true | 10 tools | P0 |
| UT-19 | getToolAnnotations() 반환값 | `getToolAnnotations('read_file')` | `{ readOnlyHint: true, ... }` | P0 |
| UT-20 | isReadOnlyTool() 정상 | `isReadOnlyTool('read_file')` | `true` | P0 |
| UT-21 | isReadOnlyTool() 비정상 | `isReadOnlyTool('write_file')` | `false` | P0 |
| UT-22 | getStrictReadOnlyTools() 수 | `getStrictReadOnlyTools()` | 9 tools | P0 |
| UT-23 | getStrictReadOnlyTools() 포함 도구 | result includes 'read_file', 'glob', 'grep_search' | all present | P0 |

### 3.3 M-04+M-05: Policy Migrator — Level Policy Templates

| ID | Test Case | Input | Expected | Priority |
|----|-----------|-------|----------|:--------:|
| UT-24 | LEVEL_POLICY_TEMPLATES 레벨 수 | Object.keys() | 3 ('Starter', 'Dynamic', 'Enterprise') | P0 |
| UT-25 | Starter 규칙 수 | `.Starter.rules.length` | 10 | P0 |
| UT-26 | Dynamic 규칙 수 | `.Dynamic.rules.length` | 7 | P0 |
| UT-27 | Enterprise 규칙 수 | `.Enterprise.rules.length` | 5 | P0 |
| UT-28 | 모든 템플릿 tier === 3 | `.tier` check | 3 (workspace tier) | P0 |
| UT-29 | generateLevelPolicy('Starter') | CLI v0.31.0, no existing file | `{ created: true }` | P0 |
| UT-30 | generateLevelPolicy('Starter') 파일 보존 | 기존 파일 있을 때 | `{ created: false, reason: '...exists' }` | P0 |
| UT-31 | generateLevelPolicy('Starter') 버전 가드 | CLI v0.29.0 | `{ created: false, reason: '...not available' }` | P0 |
| UT-32 | generateLevelPolicy('Unknown') | 잘못된 레벨 | `{ created: false, reason: 'Unknown level' }` | P0 |
| UT-33 | 생성된 Starter TOML 검증 | Generated content | `[[rule]]` 포함, `decision = "deny"` 포함 | P0 |
| UT-34 | 생성된 Enterprise TOML 검증 | Generated content | `decision = "allow"` 포함 | P0 |

### 3.4 M-07: Hook Adapter — RuntimeHook SDK Preparation

| ID | Test Case | Input | Expected | Priority |
|----|-----------|-------|----------|:--------:|
| UT-35 | supportsRuntimeHookFunctions() v0.31.0 | CLI v0.31.0 | `true` | P0 |
| UT-36 | supportsRuntimeHookFunctions() v0.30.0 | CLI v0.30.0 | `false` | P0 |
| UT-37 | getHookExecutionInfo() mode | Any | `{ mode: 'command', ... }` | P0 |
| UT-38 | getHookExecutionInfo() sdkAvailable | CLI v0.31.0 | `{ sdkAvailable: true }` | P0 |
| UT-39 | getRuntimeHookTemplate() 기본값 | `('session_start')` | `{ event: 'session_start', timeout: 30000 }` | P0 |
| UT-40 | getRuntimeHookTemplate() 커스텀 timeout | `('before_tool', 5000)` | `{ timeout: 5000 }` | P0 |
| UT-41 | HOOK_EVENT_MAP 엔트리 수 | Object.keys() | 10 entries | P0 |
| UT-42 | HOOK_EVENT_MAP 매핑 검증 | 'SessionStart' | 'session_start' | P0 |
| UT-43 | HOOK_EVENT_MAP 매핑 검증 | 'AfterTool' | 'after_tool' | P0 |
| UT-44 | HOOK_EVENT_MAP freeze 확인 | Object.isFrozen() | `true` | P0 |

### 3.5 M-02+M-03: Config & Extension Version

| ID | Test Case | Input | Expected | Priority |
|----|-----------|-------|----------|:--------:|
| UT-45 | bkit.config.json version | `config.version` | `'1.5.6'` | P0 |
| UT-46 | testedVersions includes 0.31.0 | `config.compatibility.testedVersions` | includes `'0.31.0'` | P0 |
| UT-47 | levelPolicies.enabled | `config.compatibility.policyEngine.levelPolicies` | `{ enabled: true }` | P0 |
| UT-48 | gemini-extension.json version | `ext.version` | `'1.5.6'` | P0 |

### 3.6 M-08: Session Start v1.5.6

| ID | Test Case | Input | Expected | Priority |
|----|-----------|-------|----------|:--------:|
| UT-49 | session-start.js v1.5.6 version string | Source code | `'v1.5.6'` 포함 (4곳) | P0 |
| UT-50 | getGeminiCliFeatures() 18개 플래그 | CLI v0.31.0 | 18 features reported | P0 |
| UT-51 | Level policy 자동 생성 | CLI v0.31.0 + Starter level | Level policy TOML generated | P0 |

---

## 4. Unit Tests - 커버리지 갭 보강 (P1)

### 4.1 GAP-01: lib/pdca/ 모듈 (테스트 없음 → 신규)

| ID | Test Case | Module | Priority |
|----|-----------|--------|:--------:|
| UT-60 | level.js detectLevel() 정상 동작 | `lib/pdca/level.js` | P1 |
| UT-61 | phase.js getNextPhase() 전환 로직 | `lib/pdca/phase.js` | P1 |
| UT-62 | status.js readPdcaStatus() / writePdcaStatus() | `lib/pdca/status.js` | P1 |
| UT-63 | automation.js shouldAutoIterate() | `lib/pdca/automation.js` | P1 |
| UT-64 | tier.js getTier() 분류 | `lib/pdca/tier.js` | P1 |

### 4.2 GAP-02: lib/intent/ 모듈 (hooks 간접 → 직접)

| ID | Test Case | Module | Priority |
|----|-----------|--------|:--------:|
| UT-65 | language.js detectLanguage() 8개 언어 | `lib/intent/language.js` | P1 |
| UT-66 | trigger.js matchAgentTrigger() | `lib/intent/trigger.js` | P1 |
| UT-67 | ambiguity.js detectAmbiguity() | `lib/intent/ambiguity.js` | P1 |

### 4.3 GAP-03: lib/task/ 모듈 (테스트 없음 → 신규)

| ID | Test Case | Module | Priority |
|----|-----------|--------|:--------:|
| UT-68 | classification.js classifyTask() | `lib/task/classification.js` | P1 |
| UT-69 | creator.js createTask() | `lib/task/creator.js` | P1 |
| UT-70 | dependency.js resolveDependencies() | `lib/task/dependency.js` | P1 |
| UT-71 | tracker.js trackProgress() | `lib/task/tracker.js` | P1 |

### 4.4 GAP-04: lib/core/ 유틸리티 (개별 테스트 없음)

| ID | Test Case | Module | Priority |
|----|-----------|--------|:--------:|
| UT-72 | config.js loadConfig() | `lib/core/config.js` | P1 |
| UT-73 | file.js readJson() / writeJson() | `lib/core/file.js` | P1 |
| UT-74 | cache.js TTL 만료 | `lib/core/cache.js` | P1 |
| UT-75 | debug.js 로그 활성화/비활성화 | `lib/core/debug.js` | P1 |
| UT-76 | io.js readHookInput() 파싱 | `lib/core/io.js` | P1 |
| UT-77 | platform.js 플랫폼 감지 | `lib/core/platform.js` | P1 |
| UT-78 | memory.js 세션 저장/로드 | `lib/core/memory.js` | P1 |

### 4.5 GAP-05: lib/common.js (직접 테스트 없음)

| ID | Test Case | Module | Priority |
|----|-----------|--------|:--------:|
| UT-79 | common.js exports 확인 | `lib/common.js` | P1 |

### 4.6 GAP-06~09: 미테스트 Hook Scripts

| ID | Test Case | Module | Priority |
|----|-----------|--------|:--------:|
| UT-80 | session-end.js 정상 종료 | `hooks/scripts/session-end.js` | P1 |
| UT-81 | pre-compress.js 컨텍스트 저장 | `hooks/scripts/pre-compress.js` | P1 |
| UT-82 | after-agent.js 에이전트 정리 | `hooks/scripts/after-agent.js` | P1 |
| UT-83 | pdca-plan-post.js 상태 업데이트 | `hooks/scripts/skills/pdca-plan-post.js` | P2 |
| UT-84 | pdca-design-post.js 상태 업데이트 | `hooks/scripts/skills/pdca-design-post.js` | P2 |
| UT-85 | pdca-analyze-post.js matchRate 업데이트 | `hooks/scripts/skills/pdca-analyze-post.js` | P2 |
| UT-86 | pdca-iterate-post.js iterationCount | `hooks/scripts/skills/pdca-iterate-post.js` | P2 |
| UT-87 | pdca-report-post.js phase completed | `hooks/scripts/skills/pdca-report-post.js` | P2 |

### 4.7 GAP-12: context-hierarchy.js getHierarchy() 싱글톤

| ID | Test Case | Module | Priority |
|----|-----------|--------|:--------:|
| UT-88 | getHierarchy() 싱글톤 반환 | `lib/context-hierarchy.js` | P1 |
| UT-89 | getHierarchy() 동일 인스턴스 | 2회 호출 결과 === 비교 | P1 |

---

## 5. E2E Tests - 전체 워크플로우 (P0~P1)

### 5.1 기존 Test Suites (node tests/run-all.js) — Regression

| Suite | Name | Tests | Priority | v1.5.6 연관 |
|-------|------|:-----:|:--------:|:-----------:|
| TC-01 | Hook System | ~18 | P0 | hooks.json description v1.5.6 |
| TC-02 | Skill System | ~9 | P0 | 전체 스킬 로딩 검증 |
| TC-03 | Agent System | ~4 | P1 | 에이전트 frontmatter |
| TC-04 | Lib Modules | ~19 | P0 | version assertion 1.5.6 |
| TC-05 | MCP Server | ~2 | P1 | - |
| TC-06 | TOML Commands | ~3 | P1 | - |
| TC-07 | Configuration | ~7 | P1 | version 1.5.6 |
| TC-08 | Context Engineering | ~3 | P1 | - |
| TC-09 | PDCA E2E | ~3 | P0 | PDCA 전체 사이클 |
| TC-10 | Philosophy | ~4 | P2 | context-engineering.md v1.5.6 |
| TC-11 | Output Styles | ~4 | P1 | - |
| TC-12 | Agent Memory | ~6 | P1 | - |
| TC-13 | Automation | ~10 | P0 | 의도 감지, 자동 트리거 |
| TC-14 | bkend Skills | ~8 | P2 | - |
| TC-15 | Feature Report | ~5 | P2 | - |
| TC-16 | v0.30 Phase 1 | ~21 | P0 | 기존 migration 테스트 |
| TC-17 | v0.30 Phase 2 | ~11 | P1 | 기존 integration 테스트 |

**Regression Total: ~137 tests (기존 121 + TC-16/17 확장)**

### 5.2 신규 Test Suites — v1.5.6 검증

| Suite | Name | Tests (est.) | Priority | Scope |
|-------|------|:-----:|:--------:|-------|
| TC-18 | v0.31.0 Feature Flags & Tool Annotations | ~25 | P0 | UT-01~UT-23 |
| TC-19 | v0.31.0 Level Policy & Hook Adapter | ~26 | P0 | UT-24~UT-51 |

### 5.3 v1.5.6 Specific E2E Flows

| ID | Flow | Steps | Priority |
|----|------|-------|:--------:|
| E2E-01 | Feature Flag 전체 흐름 | env var → version-detector → getFeatureFlags() → 18개 검증 | P0 |
| E2E-02 | Level Policy TOML 전체 흐름 | detectLevel → LEVEL_POLICY_TEMPLATES → generateLevelPolicy → TOML file | P0 |
| E2E-03 | Tool Annotation 조회 흐름 | TOOL_ANNOTATIONS → getToolAnnotations → isReadOnlyTool → getStrictReadOnlyTools | P0 |
| E2E-04 | Hook Adapter SDK 감지 흐름 | version-detector → supportsRuntimeHookFunctions → getHookExecutionInfo | P0 |
| E2E-05 | Backward Compat v0.29.0 | env=0.29.0 → 4 flags true, generateLevelPolicy skipped, annotations still accessible | P0 |
| E2E-06 | Backward Compat v0.30.0 | env=0.30.0 → 9 flags true, generateLevelPolicy skipped, policy TOML generated | P0 |
| E2E-07 | Config Consistency v1.5.6 | bkit.config.json ↔ gemini-extension.json ↔ session-start.js version 일치 | P0 |
| E2E-08 | PDCA Full Cycle v1.5.6 | plan → design → do → analyze → report (v1.5.6 context) | P1 |

---

## 6. Interactive Gemini CLI Tests - 사용자 경험 (P1~P2)

### 6.1 세션 시작 시나리오

| ID | Scenario | Gemini CLI Input | Expected | Priority |
|----|----------|-----------------|----------|:--------:|
| UX-01 | 첫 세션 시작 v1.5.6 | `gemini` (새 프로젝트) | "bkit Vibecoding Kit v1.5.6" 메시지 | P1 |
| UX-02 | 돌아온 사용자 | `gemini` (기존 PDCA 진행중) | Previous Work Detected + feature 표시 | P1 |
| UX-03 | Feature flags 보고 | 세션 시작 후 | 18 features (v0.31.0) 표시 | P1 |

### 6.2 v1.5.6 신규 기능 UX 검증

| ID | Scenario | Gemini CLI Input | Expected | Priority |
|----|----------|-----------------|----------|:--------:|
| UX-04 | Level Policy 확인 | 세션 시작 후 `.gemini/policies/` 확인 | v0.31.0에서 level policy TOML 자동 생성 | P1 |
| UX-05 | Tool Annotations 조회 | `tool-registry.js의 TOOL_ANNOTATIONS 확인해줘` | 17개 도구 annotation 표시 | P1 |
| UX-06 | RuntimeHook SDK 상태 | `hook-adapter.js 분석해줘` | mode='command', sdkAvailable 표시 | P1 |

### 6.3 PDCA 워크플로우 시나리오

| ID | Scenario | Gemini CLI Input | Expected | Priority |
|----|----------|-----------------|----------|:--------:|
| UX-07 | Plan 생성 | `/pdca plan test-feature` | Plan 문서 생성 | P1 |
| UX-08 | Design 생성 | `/pdca design test-feature` | Design 문서 생성 | P1 |
| UX-09 | Status 확인 | `/pdca status` | 현재 feature, phase 표시 | P1 |
| UX-10 | Next 안내 | `/pdca next` | 다음 단계 추천 | P1 |

### 6.4 Agent/Skill 시나리오

| ID | Scenario | Gemini CLI Input | Expected | Priority |
|----|----------|-----------------|----------|:--------:|
| UX-11 | 한국어 인식 | `로그인 기능 만들어줘` | Dynamic 스킬 또는 bkend-expert 트리거 | P1 |
| UX-12 | 영어 인식 | `Help me build a landing page` | starter-guide 트리거 | P1 |
| UX-13 | 코드 리뷰 | `/code-review` | code-analyzer 활성화 | P2 |
| UX-14 | 보안 검토 | `보안 취약점 점검해줘` | security-architect 트리거 | P2 |

### 6.5 보안 및 방어 시나리오

| ID | Scenario | Gemini CLI Input | Expected | Priority |
|----|----------|-----------------|----------|:--------:|
| UX-15 | 위험 명령 차단 | `rm -rf /` 실행 시도 | before-tool에서 차단 | P1 |
| UX-16 | Policy TOML 변조 차단 | `.gemini/policies/` 접근 시도 | 차단 또는 경고 | P1 |
| UX-17 | Feature Report 포함 | 아무 질문 | 응답 끝에 Feature Usage Report | P1 |
| UX-18 | bkit 도움말 | `/bkit` | 전체 기능 목록 표시 | P2 |

---

## 7. Execution Plan

### 7.1 테스트 실행 순서

```
Phase 1: Regression Tests (자동)
  └─ node tests/run-all.js (기존 TC-01~TC-17)
  └─ 17 suites, ~137 test cases
  └─ Pass Criteria: P0 suites 100% pass

Phase 2: v1.5.6 Targeted Tests (자동)
  └─ TC-18 (v0.31.0 Feature Flags & Tool Annotations): ~25 cases
  └─ TC-19 (v0.31.0 Level Policy & Hook Adapter): ~26 cases
  └─ Pass Criteria: 100% pass

Phase 3: Interactive UX Tests (수동, Gemini CLI)
  └─ UX-01 ~ UX-18: 18 scenarios
  └─ 실제 Gemini CLI에서 실행
  └─ Pass Criteria: P1 scenarios 100% pass
```

### 7.2 환경 요구사항

| 항목 | 요구사항 |
|------|---------|
| Node.js | >= 18.0.0 |
| Gemini CLI | v0.29.x, v0.30.x, v0.31.0 (3 버전 호환 테스트) |
| OS | macOS (darwin) |
| Branch | `feature/v1.5.6` |
| 환경변수 | `GEMINI_CLI_VERSION` (Unit Test용 버전 오버라이드) |

### 7.3 테스트 실행 명령어

```bash
# Phase 1: 전체 Regression 테스트
cd /Users/popup-kay/Documents/GitHub/popup/bkit-gemini
node tests/run-all.js

# Phase 2: v1.5.6 특화 테스트 (run-all.js에 포함)
# TC-18, TC-19가 자동 실행됨

# Phase 3: Interactive (Gemini CLI에서)
cd /tmp/bkit-test-project
gemini
# → UX-01 ~ UX-18 시나리오 순서대로 실행
```

---

## 8. Pass/Fail Criteria

### 8.1 릴리즈 판정 기준

| Level | Criteria | Action |
|-------|----------|--------|
| **GREEN** (릴리즈) | P0 100% pass + P1 90% pass | 즉시 릴리즈 |
| **YELLOW** (조건부) | P0 100% pass + P1 < 90% | P1 실패 항목 확인 후 판단 |
| **RED** (차단) | P0 < 100% | 수정 후 재테스트 |

### 8.2 수치 목표

| Metric | Target |
|--------|--------|
| Unit Test Pass Rate | >= 95% (P0: 100%) |
| E2E Test Pass Rate | >= 90% (P0: 100%) |
| UX Test Pass Rate | >= 90% (P1: 100%) |
| Regression Count | 0 (P0 영역) |
| v1.5.6 변경사항 검증 | 100% (51 test cases) |

---

## 9. Test Case Summary

| Category | P0 | P1 | P2 | Total |
|----------|:--:|:--:|:--:|:-----:|
| UT: v1.5.6 New Features (M-01~M-09) | 51 | 0 | 0 | 51 |
| UT: Coverage Gap Fix | 0 | 20 | 5 | 25 |
| UT: lib/core, lib/common | 0 | 8 | 0 | 8 |
| E2E: Regression (TC-01~TC-17) | ~88 | ~40 | ~9 | ~137 |
| E2E: v1.5.6 Flows | 7 | 1 | 0 | 8 |
| UX: Interactive | 0 | 14 | 4 | 18 |
| **Total** | **~146** | **~83** | **~18** | **~247** |

---

## 10. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gemini CLI v0.31.0 미설치 | Level Policy, RuntimeHook 테스트 불가 | `GEMINI_CLI_VERSION=0.31.0` env var 모킹 |
| LEVEL_POLICY_TEMPLATES TOML 스키마 불일치 | 생성된 TOML CLI 거부 가능 | validateTomlStructure() 검증 추가 |
| hook-adapter.js SDK API 변경 | v1.6.0에서 인터페이스 불일치 | Minimal implementation, 감지 전용 |
| 기존 121 테스트 regression | v1.5.6 변경으로 기존 테스트 깨짐 | version assertion 1.5.6으로 업데이트 완료 |
| Interactive 테스트 주관성 | Pass/Fail 판정 모호 | 명확한 Expected 결과 정의 |

---

## Appendix: File-to-Test Mapping (v1.5.6 변경 파일)

| File | Plan Item | Unit Tests | E2E Tests |
|------|-----------|:----------:|:---------:|
| `lib/adapters/gemini/version-detector.js` | M-01 | UT-01~14 | TC-18, E2E-01 |
| `bkit.config.json` | M-02 | UT-45~47 | TC-07, E2E-07 |
| `gemini-extension.json` | M-03 | UT-48 | TC-07, E2E-07 |
| `lib/adapters/gemini/policy-migrator.js` | M-04,M-05 | UT-24~34 | TC-19, E2E-02 |
| `lib/adapters/gemini/tool-registry.js` | M-06 | UT-15~23 | TC-18, E2E-03 |
| `lib/adapters/gemini/hook-adapter.js` | M-07 | UT-35~44 | TC-19, E2E-04 |
| `hooks/scripts/session-start.js` | M-08 | UT-49~51 | TC-01, E2E-07 |
| `hooks/hooks.json` | M-08 | - | TC-01 |
| `hooks/scripts/before-tool.js` | M-09 | - | TC-01 |
| `bkit-system/philosophy/context-engineering.md` | M-09 | - | TC-10 |

---

*Test Plan prepared by CTO Team*
*bkit Vibecoding Kit v1.5.6 Comprehensive Test Plan*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
