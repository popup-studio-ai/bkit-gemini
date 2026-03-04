# bkit v1.5.7 Comprehensive Test Plan

> **Summary**: Gemini CLI 기반 bkit v1.5.7 전체 기능 종합 테스트 계획 (Unit, Integration, E2E, UX)
>
> **Project**: bkit-gemini (Vibecoding Kit - Gemini CLI Edition)
> **Version**: v1.5.7
> **Author**: PDCA Plan Phase
> **Date**: 2026-03-04
> **Status**: Draft
> **Test Environment**: Gemini CLI v0.32.x

---

## 1. Overview

### 1.1 Purpose

bkit v1.5.7에서 구현된 Gemini CLI v0.32.x 마이그레이션과 기존 bkit 전체 기능을 Gemini CLI 환경에서 종합적으로 검증한다. Node.js 단위 테스트 외에, 실제 Gemini CLI 세션에서의 통합/E2E/UX 테스트를 통해 production-level 품질을 보장한다.

### 1.2 Background

- bkit v1.5.7은 12개 Work Stream으로 Gemini CLI v0.32.x 지원을 추가
- 기존 Node.js 테스트 (TC-01~TC-21, 193개)는 코드 레벨 검증만 수행
- 실제 Gemini CLI 세션에서의 동작 검증이 필요 (hook 실행, context injection, skill activation 등)
- 16개 Agent, 29개 Skill, 10개 Hook, 6개 Context 파일, 35개 lib 모듈의 통합 동작 확인 필요

### 1.3 Related Documents

- Design: `docs/02-design/features/gemini-cli-032-migration.design.md`
- Analysis: `docs/03-analysis/gemini-cli-032-migration.analysis.md` (100% match rate)
- Report: `docs/04-report/features/gemini-cli-032-migration.report.md`
- Existing Tests: `tests/suites/tc01~tc21-*.js`

---

## 2. Scope

### 2.1 In Scope

- [ ] **TS-A**: Unit Tests - lib 모듈 함수 단위 검증 (Node.js runner)
- [ ] **TS-B**: Integration Tests - Hook chain, Context pipeline, PDCA workflow 통합 검증
- [ ] **TS-C**: E2E Tests - Gemini CLI 세션에서 실제 사용자 시나리오 재현
- [ ] **TS-D**: UX Tests - 사용자 경험 관점의 응답 품질, 안내 정확성 검증
- [ ] **TS-E**: Regression Tests - v0.29.0/v0.30.0/v0.31.0 하위 호환성 검증
- [ ] **TS-F**: v0.32.x 신규 기능 전용 테스트

### 2.2 Out of Scope

- Performance/Load testing (별도 계획 필요)
- Multi-user concurrent testing
- Network failure simulation
- bkend.ai BaaS 연동 테스트 (별도 환경 필요)

---

## 3. Test Strategy

### 3.1 Test Pyramid

```
        /\
       /  \      E2E (TS-C): 15 scenarios
      /    \     Gemini CLI 세션 기반, 실제 대화형 테스트
     /------\
    /        \   Integration (TS-B): 25 test cases
   /          \  Hook chain, Context injection, PDCA flow
  /------------\
 /              \ Unit (TS-A): ~50 test cases
/                \ lib 모듈 함수 단위, Node.js runner
──────────────────
      UX (TS-D): 10 scenarios (Gemini CLI 대화형)
      Regression (TS-E): 8 scenarios (multi-version)
      v0.32.x (TS-F): 12 test cases
```

### 3.2 Test Environments

| Environment | CLI Version | Purpose |
|-------------|-------------|---------|
| **Primary** | Gemini CLI v0.32.1 | 모든 테스트 실행 |
| **Compat-031** | Gemini CLI v0.31.0 | 하위 호환성 검증 |
| **Compat-030** | Gemini CLI v0.30.0 | 하위 호환성 검증 |
| **Compat-029** | Gemini CLI v0.29.0 | 최소 지원 버전 검증 |

### 3.3 Test Execution Method

| Category | Method | Tool |
|----------|--------|------|
| Unit (TS-A) | `node tests/run-all.js` | Node.js test runner |
| Integration (TS-B) | Gemini CLI `gemini` 명령 + log 분석 | Gemini CLI + bash |
| E2E (TS-C) | Gemini CLI 대화형 세션 | 수동/반자동 |
| UX (TS-D) | Gemini CLI 대화형 세션 + 체크리스트 | 수동 |
| Regression (TS-E) | Version-gated `GEMINI_CLI_VERSION` env + Node.js | Node.js + Gemini CLI |
| v0.32.x (TS-F) | Gemini CLI v0.32.x 세션 | Gemini CLI |

---

## 4. Requirements

### 4.1 Functional Requirements

| ID | Requirement | Priority | Category |
|----|-------------|----------|----------|
| **FR-01** | SessionStart hook이 정상적으로 context를 생성하고 출력하는지 검증 | High | TS-B |
| **FR-02** | 10개 Hook의 dual-mode (command + handler) 동작 검증 | High | TS-B |
| **FR-03** | PDCA 전체 사이클 (Plan→Design→Do→Check→Act→Report) E2E 검증 | High | TS-C |
| **FR-04** | 29개 Skill이 `/skill-name` 명령으로 올바르게 활성화되는지 검증 | High | TS-C |
| **FR-05** | 16개 Agent가 키워드 트리거로 자동 활성화되는지 검증 | High | TS-C |
| **FR-06** | 8개국어 자동 감지 및 적절한 Agent/Skill 트리거 동작 검증 | Medium | TS-D |
| **FR-07** | Extension Policy Engine의 DENY/ASK_USER 규칙 적용 검증 | High | TS-F |
| **FR-08** | Task Tracker Bridge의 PDCA→Tracker 동기화 검증 | Medium | TS-F |
| **FR-09** | RuntimeHook SDK 모드의 handler() 함수 실행 검증 | High | TS-F |
| **FR-10** | v0.32.0+ Feature Flag가 올바르게 gating하는지 검증 | High | TS-F |
| **FR-11** | Version Detector의 nightly 버전 파싱 정확성 검증 | Medium | TS-A |
| **FR-12** | Tool Registry의 23개 도구 매핑 및 annotation 정확성 검증 | High | TS-A |
| **FR-13** | Context Hierarchy의 4단계 우선순위 (plugin→user→project→session) 검증 | Medium | TS-B |
| **FR-14** | Agent Memory의 project/user scope 분리 저장 검증 | Medium | TS-B |
| **FR-15** | Output Style의 4가지 스타일 적용 및 전환 검증 | Medium | TS-D |
| **FR-16** | AfterAgent loop guard의 MAX_REENTRY=3 보호 동작 검증 | High | TS-B |
| **FR-17** | spawn-agent-server의 MAX_TIMEOUT=600000ms 절대 타임아웃 검증 | Medium | TS-B |
| **FR-18** | Policy Engine 4-Tier 시스템 (Default→Extension→User→Admin) 동작 검증 | High | TS-B |
| **FR-19** | Breaking Changes (BC-1/BC-2/BC-3) 적용 확인 및 구버전 호환 | High | TS-E |
| **FR-20** | GEMINI.md → tool-reference.md import chain 정상 동작 검증 | Medium | TS-B |

### 4.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| **Reliability** | 모든 P0 테스트 100% 통과 | Node.js runner + Gemini CLI |
| **Compatibility** | v0.29.0~v0.32.1 모두 정상 동작 | Multi-version 테스트 |
| **UX Quality** | 사용자 안내 정확도 90%+ | UX 체크리스트 수동 평가 |
| **Response Time** | SessionStart hook < 3초 | 타이밍 측정 |
| **Stability** | 10회 연속 세션에서 에러 0 | 반복 테스트 |

---

## 5. Test Suite Details

### 5.1 TS-A: Unit Tests (Node.js Runner)

**기존 테스트 보강 + 신규 추가**

| Suite | File | Tests | Status |
|-------|------|:-----:|--------|
| TC-01 | tc01-hooks.js | 8 | Existing (1 fail: HOOK-28) |
| TC-02 | tc02-skills.js | 10 | Existing |
| TC-03 | tc03-agents.js | 8 | Existing |
| TC-04 | tc04-lib-modules.js | 6 | Existing (updated v1.5.7) |
| TC-05 | tc05-mcp.js | 5 | Existing |
| TC-06 | tc06-commands.js | 4 | Existing |
| TC-07 | tc07-config.js | 6 | Existing (updated v1.5.7) |
| TC-08 | tc08-context.js | 5 | Existing |
| TC-09 | tc09-pdca-e2e.js | 5 | Existing (3 fail: status path) |
| TC-10 | tc10-philosophy.js | 4 | Existing |
| TC-11 | tc11-output-styles.js | 4 | Existing |
| TC-12 | tc12-agent-memory.js | 4 | Existing |
| TC-13 | tc13-automation.js | 6 | Existing |
| TC-14 | tc14-bkend-skills.js | 3 | Existing |
| TC-15 | tc15-feature-report.js | 3 | Existing |
| TC-16 | tc16-v030-phase1.js | 12 | Existing |
| TC-17 | tc17-v030-phase2.js | 11 | Existing (updated v1.5.7) |
| TC-18 | tc18-v031-features.js | 25 | Existing (updated v1.5.7) |
| TC-19 | tc19-v031-policy-hooks.js | 20 | Existing (updated v1.5.7) |
| TC-20 | tc20-coverage-gaps.js | 10 | Existing |
| TC-21 | tc21-v032-migration.js | 11 | **NEW** (v1.5.7) |
| **TC-22** | tc22-pdca-status-path.js | ~8 | **NEW** - PDCA 상태파일 경로 마이그레이션 |
| **TC-23** | tc23-tracker-bridge.js | ~10 | **NEW** - Tracker Bridge 심화 테스트 |
| **TC-24** | tc24-runtime-hooks.js | ~8 | **NEW** - RuntimeHook SDK 모드 검증 |

**Target**: ~210 unit tests, 95%+ pass rate

### 5.2 TS-B: Integration Tests (Gemini CLI + Log Analysis)

| ID | Test Case | Method | Expected Result |
|----|-----------|--------|-----------------|
| **INT-01** | SessionStart full pipeline | `gemini` 시작 → hook output 확인 | Context 정상 생성, version 표시 |
| **INT-02** | Hook chain: Before→Tool→After | 파일 작성 후 hook 로그 확인 | 3-hook chain 순서 실행 |
| **INT-03** | PDCA status file read/write | `/pdca status` 실행 | 현재 상태 정확히 표시 |
| **INT-04** | Context import chain | GEMINI.md imports 확인 | tool-reference.md 내용 포함 |
| **INT-05** | Policy Engine policy generation | SessionStart → policies/ 확인 | .toml 파일 정상 생성 |
| **INT-06** | Level detection auto | 프로젝트 구조 기반 레벨 감지 | Starter/Dynamic/Enterprise 정확 |
| **INT-07** | Agent Memory persistence | 세션 종료 → 재시작 → 메모리 확인 | 이전 세션 데이터 유지 |
| **INT-08** | Feature flag gating v0.32.0 | `GEMINI_CLI_VERSION=0.32.0` | 모든 v0.32.0 기능 활성화 |
| **INT-09** | Feature flag gating v0.31.0 | `GEMINI_CLI_VERSION=0.31.0` | v0.32.0 기능 비활성화 |
| **INT-10** | AfterAgent loop guard | 재진입 3회 시 중단 | MAX_REENTRY 후 종료 |
| **INT-11** | Extension policy DENY | `rm -rf` 시도 → 거부 | deny 규칙 적용 |
| **INT-12** | Extension policy ASK_USER | `git reset --hard` 시도 | ask_user 프롬프트 표시 |
| **INT-13** | Dual-mode hook execution | SDK 모드 + command 모드 | 둘 다 정상 동작 |
| **INT-14** | Context fork shared behavior | 다중 세션 context 분리 | 각 세션 독립 context |
| **INT-15** | PDCA phase auto-transition | write_file in src/ 후 | design→do 자동 전환 |
| **INT-16** | Tool Registry CLAUDE→GEMINI map | TaskCreate 사용 시 | tracker_create_task 매핑 |
| **INT-17** | Skill TOML commands mapping | `/pdca status` 실행 | commands.toml 정상 매핑 |
| **INT-18** | Tracker Bridge context injection | v0.32.0+ 세션 시작 | tracker 안내 context 포함 |
| **INT-19** | Permission config enforcement | bkit.config.json 권한 적용 | deny/allow/ask 정상 동작 |
| **INT-20** | Import resolver caching | 동일 import 2회 요청 | 캐시 히트, 성능 향상 |
| **INT-21** | Pre-compress snapshot | context compaction 시 | 스냅샷 정상 저장 |
| **INT-22** | Session-end cleanup | 세션 종료 시 | 임시 파일 정리 |
| **INT-23** | Config hierarchy override | session > project > user > plugin | 우선순위 정확히 적용 |
| **INT-24** | Agent frontmatter tool validation | Agent 실행 시 tool list | 유효한 tool 이름만 사용 |
| **INT-25** | Nightly version detection | `0.34.0-nightly.20260304` | isNightly=true, nightlyNum 파싱 |

### 5.3 TS-C: E2E Tests (Gemini CLI Interactive Session)

| ID | Scenario | Steps | Expected UX |
|----|----------|-------|-------------|
| **E2E-01** | First session startup | 1. `gemini` 실행 2. 첫 프롬프트 대기 | bkit 안내 메시지, 레벨 표시 |
| **E2E-02** | PDCA full cycle | 1. `/pdca plan test-feature` 2. `/pdca design` 3. 구현 4. `/pdca analyze` 5. `/pdca report` | 전체 사이클 완료, 문서 생성 |
| **E2E-03** | Skill activation | 1. `/starter` 또는 `/dynamic` 입력 | 해당 Skill 활성화, 안내 제공 |
| **E2E-04** | Agent auto-trigger (KO) | 1. "보안 검토해줘" 입력 | security-architect Agent 활성화 |
| **E2E-05** | Agent auto-trigger (EN) | 1. "review the code quality" 입력 | code-analyzer Agent 활성화 |
| **E2E-06** | Agent auto-trigger (JA) | 1. "コードを分析して" 입력 | code-analyzer Agent 활성화 |
| **E2E-07** | Multi-language switch | 1. KO → EN → JA 순서로 요청 | 각 언어별 적절한 Agent 선택 |
| **E2E-08** | Output style change | 1. `/output-style bkit-learning` 2. 질문 | 스타일 변경 반영 |
| **E2E-09** | Error recovery | 1. 잘못된 명령 입력 2. 올바른 명령 | 에러 안내 후 정상 진행 |
| **E2E-10** | Context compaction | 1. 긴 대화 진행 (10+ turns) 2. pre-compress 트리거 | 스냅샷 저장, 컨텍스트 유지 |
| **E2E-11** | Development pipeline | 1. `/development-pipeline start` 2. Phase 1~9 순서 진행 | 파이프라인 안내 정확 |
| **E2E-12** | Returning user detection | 1. 첫 세션 2. 두 번째 세션 시작 | "Welcome back" 또는 이전 상태 복원 |
| **E2E-13** | Dangerous command block | 1. "rm -rf / 실행해줘" 입력 | 거부 + 안전 경고 |
| **E2E-14** | Plan-plus brainstorming | 1. `/plan-plus test-feature` | 의도 발견 + 대안 탐색 + YAGNI |
| **E2E-15** | Code review workflow | 1. 코드 작성 2. `/code-review` | 리뷰 결과 + 개선 제안 |

### 5.4 TS-D: UX Tests (User Experience Validation)

| ID | UX Aspect | Checklist | Pass Criteria |
|----|-----------|-----------|---------------|
| **UX-01** | SessionStart 안내 명확성 | 레벨 표시, 기능 소개, 다음 행동 제안 | 사용자가 즉시 다음 행동 가능 |
| **UX-02** | PDCA 상태 시각화 | 진행 바, 매치율, 현재 단계 | 한 눈에 상태 파악 가능 |
| **UX-03** | 에러 메시지 친화성 | 문제 설명 + 해결 방법 + 명령어 제안 | 사용자가 자체 해결 가능 |
| **UX-04** | 한국어 응답 품질 | 자연스러운 한국어, 적절한 존댓말 | 어색하지 않은 안내 |
| **UX-05** | 영어 응답 품질 | Professional tone, clear instructions | Immediately actionable |
| **UX-06** | Feature report 가독성 | 표 정렬, 섹션 구분, 요약 | 5초 내 핵심 파악 가능 |
| **UX-07** | Skill 안내 완전성 | 사용법, 예제, 다음 단계 | 추가 질문 불필요 |
| **UX-08** | Agent trigger 정확도 | 의도에 맞는 Agent 선택 | 10번 중 9번 이상 정확 |
| **UX-09** | 다국어 혼용 시 안정성 | KO+EN 혼합 입력 처리 | 에러 없이 적절히 처리 |
| **UX-10** | 기능 리포트 유용성 | 세션 종료 시 bkit Feature Usage | 사용/미사용 기능 정확 보고 |

### 5.5 TS-E: Regression Tests (Multi-Version Compatibility)

| ID | Version | Test Focus | Expected |
|----|---------|------------|----------|
| **REG-01** | v0.29.0 | 기본 기능 동작 (hooks, skills, context) | 정상 동작, v0.32.0 기능 비활성화 |
| **REG-02** | v0.29.0 | Feature flags 모두 false (v0.30.0+) | 18개 중 7개만 true |
| **REG-03** | v0.30.0 | Policy Engine 기본 동작 | 정상 동작, level policy 비활성화 |
| **REG-04** | v0.30.0 | excludeTools 제거 영향 없음 | 정상 동작 (BC-2) |
| **REG-05** | v0.31.0 | Level Policy + Hook Adapter | 정상 동작 |
| **REG-06** | v0.31.0 | RuntimeHook SDK dual-mode | command + handler 모두 동작 |
| **REG-07** | v0.32.0 | 전체 v0.32.0 기능 활성화 | 29개 feature flag 모두 true |
| **REG-08** | v0.32.1 | Tracker Bridge + Extension Policy | 전체 기능 활성화 |

### 5.6 TS-F: v0.32.x New Feature Tests

| ID | Feature | Test Case | Expected |
|----|---------|-----------|----------|
| **V32-01** | Task Tracker | tracker_create_task 가용성 | v0.32.0+에서만 활성화 |
| **V32-02** | Task Tracker | PDCA epic 생성 context hint | 올바른 안내 텍스트 |
| **V32-03** | Extension Policy | bkit-extension-policy.toml 생성 | 4개 규칙 정상 생성 |
| **V32-04** | Extension Policy | DENY 규칙 (rm -rf, git push --force) | 실행 차단 |
| **V32-05** | Extension Policy | ASK_USER 규칙 (git reset --hard, rm -r) | 사용자 확인 요청 |
| **V32-06** | RuntimeHook SDK | 6개 hot-path hook handler() 실행 | SDK 모드 정상 동작 |
| **V32-07** | RuntimeHook SDK | 4개 lifecycle hook command-only | stdin command 정상 |
| **V32-08** | BC-1 | grep_search `file_pattern` param | 정상 인식 |
| **V32-09** | BC-2 | read_file `start_line`/`end_line` param | 정상 인식 |
| **V32-10** | BC-3 | replace `allow_multiple` param | 정상 인식 |
| **V32-11** | Nightly version | `0.34.0-nightly.20260304` 파싱 | isNightly=true |
| **V32-12** | Parallel Extension | hasParallelExtensionLoading flag | v0.32.0+에서 true |

---

## 6. Test Data & Fixtures

### 6.1 Test Project Structure

```
/tmp/bkit-test-project/
├── src/
│   └── app.js              # 테스트용 소스 파일
├── docs/
│   ├── .pdca-status.json    # PDCA 상태 fixture
│   └── 01-plan/
│       └── features/
│           └── test-feature.plan.md
├── .gemini/
│   ├── context/             # Context fixture
│   └── policies/            # Policy output
├── bkit.config.json         # Config fixture
└── gemini-extension.json    # Extension fixture
```

### 6.2 Environment Variables

| Variable | Values | Purpose |
|----------|--------|---------|
| `GEMINI_CLI_VERSION` | `0.29.0`, `0.30.0`, `0.31.0`, `0.32.0`, `0.32.1` | Version gating 테스트 |
| `BKIT_TEST_MODE` | `1` | 테스트 모드 활성화 |
| `BKIT_DEBUG` | `1` | 디버그 로그 활성화 |

### 6.3 PDCA Status Fixtures

```json
{
  "version": "2.0",
  "activeFeatures": {
    "test-feature": {
      "phase": "design",
      "matchRate": null,
      "lastUpdated": "2026-03-04T00:00:00Z"
    }
  }
}
```

---

## 7. Success Criteria

### 7.1 Definition of Done

- [ ] TS-A: Unit test pass rate >= 97% (pre-existing 5 failures are documented & excluded)
- [ ] TS-B: All 25 integration tests pass on Gemini CLI v0.32.1
- [ ] TS-C: All 15 E2E scenarios complete successfully
- [ ] TS-D: UX score >= 90% (9/10 checklist items pass)
- [ ] TS-E: All 8 regression tests pass across 4 CLI versions
- [ ] TS-F: All 12 v0.32.x feature tests pass
- [ ] Test documentation complete (plan + design + report)

### 7.2 Quality Criteria

- [ ] Zero critical/blocker defects
- [ ] All P0 tests passing
- [ ] No regression from v1.5.6 (existing features)
- [ ] v0.32.x features gracefully degrade on older CLI versions

### 7.3 Exit Criteria

| Category | Metric | Target |
|----------|--------|--------|
| Unit Pass Rate | TS-A pass / total | >= 97% |
| Integration Pass Rate | TS-B pass / total | 100% |
| E2E Success Rate | TS-C pass / total | >= 90% |
| UX Score | TS-D pass / total | >= 90% |
| Regression Pass Rate | TS-E pass / total | 100% |
| v0.32.x Pass Rate | TS-F pass / total | 100% |

---

## 8. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Gemini CLI v0.32.x 미설치 | High | Medium | `GEMINI_CLI_VERSION` env로 시뮬레이션 |
| Hook 실행 타이밍 이슈 | Medium | Low | 타임아웃 여유 (3초→5초) |
| Context 크기 초과 | Medium | Low | MaxContextLength 500 제한 확인 |
| Multi-version 동시 테스트 불가 | Medium | High | `GEMINI_CLI_VERSION` env 기반 순차 테스트 |
| PDCA 상태 파일 경로 충돌 | High | Medium | 테스트 격리 디렉토리 사용 |

---

## 9. Test Execution Order

### Phase 1: Foundation (Unit + Core Integration)
```
1. TS-A: Node.js unit tests (tc01~tc24)
2. TS-F: v0.32.x feature unit tests
3. TS-E: Regression tests (multi-version env)
```

### Phase 2: Integration Verification
```
4. TS-B: INT-01~INT-10 (Core integration)
5. TS-B: INT-11~INT-20 (Policy + Hook integration)
6. TS-B: INT-21~INT-25 (Advanced integration)
```

### Phase 3: E2E + UX Validation
```
7. TS-C: E2E-01~E2E-05 (Core user flows)
8. TS-C: E2E-06~E2E-10 (Multi-language + advanced)
9. TS-C: E2E-11~E2E-15 (Pipeline + review)
10. TS-D: UX-01~UX-10 (UX validation)
```

---

## 10. Deliverables

| Deliverable | Format | Path |
|-------------|--------|------|
| Test Plan | Markdown | `docs/01-plan/features/bkit-v157-comprehensive-test.plan.md` |
| Test Design | Markdown | `docs/02-design/features/bkit-v157-comprehensive-test.design.md` |
| New Unit Tests | JavaScript | `tests/suites/tc22~tc24-*.js` |
| Integration Test Script | Shell/JS | `tests/integration/` |
| E2E Test Checklist | Markdown | `tests/e2e/` |
| UX Evaluation Sheet | Markdown | `tests/ux/` |
| Test Report | Markdown | `docs/03-analysis/bkit-v157-comprehensive-test.analysis.md` |

---

## 11. Architecture Considerations

### 11.1 Project Level

| Level | Selected |
|-------|:--------:|
| **Enterprise** | YES - bkit-gemini is an Enterprise-grade Gemini CLI extension |

### 11.2 Test Architecture

```
Test Architecture:
┌──────────────────────────────────────────────────┐
│                  TS-C: E2E Layer                  │
│           (Gemini CLI Interactive)                │
├──────────────────────────────────────────────────┤
│              TS-B: Integration Layer              │
│      (Hook Chain + Context + PDCA Flow)          │
├──────────────────────────────────────────────────┤
│               TS-A: Unit Layer                    │
│       (lib modules + Node.js runner)             │
├──────────────────────────────────────────────────┤
│  TS-D: UX   │  TS-E: Regression  │  TS-F: v0.32 │
│  (Cross-cut)│  (Multi-version)    │  (Specific)  │
└──────────────────────────────────────────────────┘
```

---

## 12. Summary Statistics

| Category | Count |
|----------|:-----:|
| Test Suites | 6 (TS-A~TS-F) |
| Unit Tests | ~210 |
| Integration Tests | 25 |
| E2E Scenarios | 15 |
| UX Checklists | 10 |
| Regression Tests | 8 |
| v0.32.x Tests | 12 |
| **Total Test Items** | **~280** |

---

## 13. Next Steps

1. [ ] `/pdca design bkit-v157-comprehensive-test` - 상세 설계서 작성
2. [ ] New test files 구현 (tc22~tc24, integration/, e2e/, ux/)
3. [ ] Gemini CLI v0.32.1에서 전체 테스트 실행
4. [ ] 결과 분석 및 리포트 생성

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-04 | Initial comprehensive test plan | PDCA Plan Phase |
