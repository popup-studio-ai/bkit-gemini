# bkit-gemini v2.0.0 Refactoring Supplement Plan

> **Summary**: v2.0.0 리팩토링 완료 후 발견된 3대 핵심 문제 (토큰 낭비, 권한 과잉, 할루시네이션)에 대한 정밀 보완 계획
>
> **Project**: bkit-gemini
> **Version**: 2.0.0 -> 2.0.1
> **Author**: CTO Lead (Agent Team Orchestration)
> **Date**: 2026-03-20
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | v2.0.0 리팩토링이 754 TC 100% 통과했으나, 레거시 잔재(버전 하드코딩, 경로 불일치), 에이전트 권한 구멍(readonly 리스트에 write 도구 포함, FULL 티어 미정의), 컨텍스트 불일치(레거시 경로 참조)로 인한 실제 운영 시 할루시네이션 위험이 존재함 |
| **Solution** | 10개 전문가 에이전트의 병렬 분석을 통한 정밀 문제 식별 후, 3단계 점진적 수정 (Critical -> High -> Medium) |
| **Function/UX Effect** | 세션 시작 토큰 추가 30% 절감, 에이전트 오동작 제로화, AI 응답 정확도 향상 |
| **Core Value** | **"Production-Ready Architecture"** - 테스트 통과를 넘어 실제 운영 환경에서의 무결성 확보 |

---

## 1. Overview

### 1.1 Purpose

v2.0.0 리팩토링이 테스트 수준에서는 100% 통과했으나, 보고서 작성 및 코드 리뷰 과정에서 3가지 카테고리의 실제 운영 위험이 발견됨. 이 보완 계획은 테스트로 검출되지 않은 "설계-구현 불일치"를 해소하여 프로덕션 수준의 품질을 확보함.

### 1.2 Background

- v2.0.0에서 CC(Claude Code) 레거시를 제거하고 Gemini CLI 네이티브 아키텍처로 전환 완료
- 754개 테스트 케이스 100% 통과 (TC-80~TC-95)
- 그러나 테스트가 커버하지 못하는 "런타임 컨텍스트 정합성" 문제 3건 발견
- 이 문제들은 테스트 통과와 무관하게 실제 Gemini CLI 세션에서 토큰 낭비 및 오류를 유발할 수 있음

### 1.3 Related Documents

- Completion Report: `docs/04-report/features/bkit-gemini-v200-refactoring.report.md`
- v2.0.0 Test Design: committed as c99b2a7
- Original Plan: `docs/01-plan/features/bkit-gemini-v200-refactoring.plan.md`

---

## 2. Brainstorming Phase (Plan-Plus)

### 2.1 Intent Discovery - 핵심 질문

| # | 질문 | 분석 결과 |
|---|------|-----------|
| Q1 | 토큰 낭비의 실제 규모는? | session-start.js가 8개 섹션을 모두 생성하고, PHASE_CONTEXT_MAP idle 상태에서 5개 컨텍스트 파일을 추가 로드. idle 세션에서만 약 2000토큰 이상 불필요 주입 |
| Q2 | 권한 과잉의 실제 공격 표면은? | getReadOnlyTools()에 ACTIVATE_SKILL, WRITE_TODOS, SAVE_MEMORY 포함 → readonly 에이전트가 스킬 활성화 및 메모리 쓰기 가능. SUBAGENT_POLICY_GROUPS에 FULL 티어 미정의 → pdca-iterator 등의 권한이 무제한 |
| Q3 | 할루시네이션 발생 경로는? | context-fork.js가 `docs/.pdca-status.json`과 `docs/.bkit-memory.json`을 참조하지만 실제 파일은 루트 `.pdca-status.json`과 `.bkit/state/memory.json`에 위치 → fork 시 빈 데이터 반환 |
| Q4 | 테스트가 이 문제를 못 잡은 이유는? | 테스트 setup.js가 `docs/.pdca-status.json`에 fixture를 생성하므로 레거시 경로가 항상 존재. 실제 운영에서는 v2.0 마이그레이션으로 루트 경로만 존재 |
| Q5 | version '1.5.9' 하드코딩의 영향은? | session-start.js:79에서 metadata.version이 '1.5.9'로 출력됨. 이 값이 Gemini CLI에 전달되어 에이전트가 구버전으로 오인할 수 있음 |

### 2.2 Alternatives Exploration

#### 대안 A: 최소 패치 (Hotfix Only)
- 하드코딩 버전 수정, 레거시 경로 수정, readonly 리스트 수정만 수행
- **장점**: 최소 변경, 빠른 적용
- **단점**: 구조적 문제(common.js 브릿지, 중복 컨텍스트 섹션)는 그대로

#### 대안 B: 중규모 리팩토링 (Selected)
- 대안 A + 에이전트 권한 체계 완성 + 컨텍스트 중복 제거 + 테스트 fixture 정합성 확보
- **장점**: 구조적 완성도 확보, 향후 v2.1 작업 기반 마련
- **단점**: 테스트 수정 필요 (fixture 경로 변경)

#### 대안 C: 대규모 재설계
- common.js 브릿지 완전 제거, 직접 import 패턴으로 전환
- **장점**: 이상적인 모듈 구조
- **단점**: 하위호환 파괴, 전체 테스트 재작성 필요. YAGNI 위반.

### 2.3 YAGNI Review

| 항목 | YAGNI 판정 | 근거 |
|------|-----------|------|
| common.js 브릿지 제거 | **YAGNI** | 현재 require('./common')을 사용하는 곳이 0건. 브릿지 자체가 사용되지 않으므로 제거할 인센티브도 낮음. v2.1에서 검토. |
| FULL 티어 에이전트 정책 추가 | **필요** | pdca-iterator, cto-lead 등이 파일 쓰기 필요한데 정책이 없어 사실상 무제한 |
| context-fork.js 경로 수정 | **필요** | 현재 fork가 빈 데이터를 반환하므로 분석 에이전트가 잘못된 상태를 기반으로 작업 |
| session-start.js 중복 섹션 제거 | **필요** | idle 상태에서 agent-triggers + skill-triggers + auto-trigger 3개가 중복. 토큰 절감 직결 |
| tool-reference.md vs tool-reference-v2.md 정리 | **필요** | 두 파일이 공존하여 어느 것이 진실인지 불명확. v2가 있으므로 v1은 제거 대상 |
| 테스트 fixture 레거시 경로 정리 | **선택** | 현재 테스트가 통과하고 있어 급하지 않으나, 실제 경로와 불일치로 미래 혼란 유발 |

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Category |
|----|-------------|----------|----------|
| FR-01 | session-start.js metadata.version을 '2.0.0'으로 수정 | **Critical** | 토큰/할루시네이션 |
| FR-02 | context-fork.js readPdcaStatus() 경로를 pdca/status.js의 getPdcaStatusPath()로 위임 | **Critical** | 할루시네이션 |
| FR-03 | context-fork.js readMemory() 경로를 core/memory.js의 getPath()로 위임 | **Critical** | 할루시네이션 |
| FR-04 | getReadOnlyTools()에서 ACTIVATE_SKILL, WRITE_TODOS, SAVE_MEMORY 제거 | **Critical** | 권한 과잉 |
| FR-05 | SUBAGENT_POLICY_GROUPS에 'full' 티어 추가 (pdca-iterator, cto-lead, pm-lead) | **High** | 권한 과잉 |
| FR-06 | session-start.js idle 상태 컨텍스트 중복 섹션 제거 | **High** | 토큰 낭비 |
| FR-07 | PHASE_CONTEXT_MAP에서 참조하는 파일 존재 여부 런타임 검증 | **High** | 할루시네이션 |
| FR-08 | core/platform.js BKIT_PROJECT_DIR 레거시 별칭 deprecation 경고 추가 | **Medium** | 레거시 정리 |
| FR-09 | .gemini/context/tool-reference.md 제거 (tool-reference-v2.md로 단일화) | **Medium** | 토큰 낭비 |
| FR-10 | PHASE_CONTEXT_MAP의 tool-reference.md를 tool-reference-v2.md로 변경 | **Medium** | 정합성 |
| FR-11 | .gemini/agent-memory/ 16개 JSON 파일에 대한 에이전트별 접근 제어 정책 문서화 | **Medium** | 보안 |
| FR-12 | bkit.config.json pdca.statusFile을 '.pdca-status.json'으로 수정 (현재 미사용이지만 정합성) | **Low** | 정합성 |
| FR-13 | 레거시 테스트 v1.5.9 참조 정리 (tc04, tc19 등) | **Low** | 테스트 정합성 |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| 토큰 효율 | idle 세션 컨텍스트 1500 토큰 이하 | session-start 출력 길이 측정 |
| 보안 | readonly 에이전트의 쓰기 도구 접근 0건 | getReadOnlyTools() 반환값 검증 |
| 정합성 | 레거시 경로 참조 0건 (운영 코드 기준) | grep 'docs/.pdca-status\|docs/.bkit-memory' lib/ hooks/ |
| 하위호환 | 기존 754 TC 전체 통과 유지 | run-all.js 실행 |

---

## 4. Detailed Analysis by Agent Team

### 4.1 Code Analyzer: 토큰 낭비 패턴 정밀 분석

**발견 사항 (7건)**

| # | 파일 | 위치 | 문제 | 영향 |
|---|------|------|------|------|
| T-01 | hooks/scripts/session-start.js | L79 | `version: '1.5.9'` 하드코딩 | 에이전트가 구버전으로 오인, 잘못된 호환성 분기 유발 |
| T-02 | hooks/scripts/session-start.js | L301 | `buildAgentTriggersSection()` 항상 호출 | idle 외 단계에서 불필요한 에이전트 트리거 테이블 (약 300 토큰) |
| T-03 | hooks/scripts/session-start.js | L304 | `buildFeatureReportSection()` 항상 호출 | PHASE_CONTEXT_MAP에서 이미 feature-report.md를 로드하므로 중복 (약 150 토큰) |
| T-04 | hooks/scripts/session-start.js | L307 | `buildAutoTriggerSection()` 항상 호출 | skill-triggers.md와 중복 (약 100 토큰) |
| T-05 | .gemini/context/ | 전체 | tool-reference.md와 tool-reference-v2.md 공존 | 양쪽 로딩 시 약 800 토큰 중복 |
| T-06 | lib/common.js | 전체 | spread re-export 브릿지 | require() 시 전체 모듈 로딩. 단, 현재 사용처 0건이므로 실제 영향 없음 |
| T-07 | hooks/scripts/session-start.js | L198-204 | PHASE_CONTEXT_MAP 하드코딩 | 실제 파일 존재 여부 미검증으로 존재하지 않는 파일 참조 시 silent 무시 |

**예상 토큰 절감**: idle 세션 기준 약 550 토큰 (현재 추정 2000 -> 1450)

### 4.2 Security Architect: 에이전트 권한 티어 완전성 검증

**발견 사항 (5건)**

| # | 파일 | 위치 | 문제 | 심각도 |
|---|------|------|------|--------|
| S-01 | lib/gemini/tools.js | L186-188 | `getReadOnlyTools()`에 ACTIVATE_SKILL, WRITE_TODOS, SAVE_MEMORY 포함 | **Critical** |
| S-02 | lib/gemini/policy.js | L273-295 | SUBAGENT_POLICY_GROUPS에 'full' 티어 미정의 | **High** |
| S-03 | lib/gemini/policy.js | L279 | `bkend-expert`가 readonly 그룹에 있지만 실제로는 코드 생성 필요 | **High** |
| S-04 | .gemini/agent-memory/bkit/ | 16개 파일 | 모든 에이전트가 모든 메모리 파일에 접근 가능 (격리 없음) | **Medium** |
| S-05 | lib/gemini/tools.js | L225-229 | `getStrictReadOnlyTools()`가 존재하지만 policy.js에서 사용하지 않음 | **Medium** |

**권한 모델 불일치 상세**:

현재 `getReadOnlyTools()` (L177-194):
```
READ_FILE, READ_MANY_FILES, GREP_SEARCH, GLOB, LIST_DIRECTORY,
GOOGLE_WEB_SEARCH, WEB_FETCH,
ACTIVATE_SKILL,     <-- readOnlyHint: false (TOOL_ANNOTATIONS L159)
WRITE_TODOS,        <-- readOnlyHint: false (TOOL_ANNOTATIONS L161)
SAVE_MEMORY,        <-- readOnlyHint: false (TOOL_ANNOTATIONS L160)
ASK_USER, GET_INTERNAL_DOCS,
TRACKER_GET_TASK, TRACKER_LIST_TASKS, TRACKER_VISUALIZE
```

`TOOL_ANNOTATIONS`에서 이미 `readOnlyHint: false`로 정의된 3개 도구가 `getReadOnlyTools()`에 포함되어 있어, `isReadOnlyTool()`과 `getReadOnlyTools()`가 서로 모순됨.

**수정 제안 - 3티어 완성**:

```
readonly:  getStrictReadOnlyTools() 결과 사용 (annotations 기반)
docwrite:  readonly + WRITE_FILE + REPLACE + ACTIVATE_SKILL + SAVE_MEMORY + WRITE_TODOS
full:      getAllTools() (pdca-iterator, cto-lead, pm-lead 전용)
```

### 4.3 Enterprise Expert: 레거시 제거 전략

**발견 사항 (4건)**

| # | 항목 | 상태 | 조치 |
|---|------|------|------|
| L-01 | `BKIT_PROJECT_DIR` (core/platform.js:78) | 내보내기됨, 테스트에서 1건 사용 | deprecation 경고 추가, v2.1에서 제거 |
| L-02 | `LEGACY_ALIASES` (gemini/tools.js:63) | search_file_content -> grep_search | 유지 (Gemini CLI 소스에 실제 존재하는 별칭) |
| L-03 | version.js getFeatureFlags() | hasPolicyEngine, hasProjectLevelPolicy 등 삭제됨 | **정상** - v2.0.0에서 minVersion 0.34.0으로 통합. 단, policy.js:211,363이 여전히 참조하므로 검증 필요 |
| L-04 | pdca/status.js legacyPath | docs/.pdca-status.json 폴백 존재 | 유지 (마이그레이션 지원 필요) |

**version.js 플래그 정합성 분석**:

version.js의 `getFeatureFlags()`가 v2.0.0에서 0.34.0 기준으로 단순화됨. 그러나 `policy.js`가 여전히 `hasPolicyEngine`, `hasProjectLevelPolicy`, `hasExtensionPolicies`를 참조함:
- policy.js:211 `flags.hasPolicyEngine` -> 존재하지 않음 (항상 undefined -> falsy)
- policy.js:363 `flags.hasProjectLevelPolicy` -> 존재하지 않음
- policy.js:459 `flags.hasExtensionPolicies` -> 존재하지 않음

**이는 Critical 문제**: Policy Engine TOML이 생성되지 않는 원인일 수 있음. version.js에서 해당 플래그를 제거했지만 policy.js에서 여전히 사용 중.

### 4.4 Gap Detector: 설계-구현 불일치

**발견 사항 (6건)**

| # | 설계 의도 | 실제 구현 | Gap |
|---|----------|----------|-----|
| G-01 | context-fork.js가 현재 PDCA 상태를 정확히 스냅샷 | readPdcaStatus()가 `docs/.pdca-status.json`만 참조 | **pdca/status.js의 getPdcaStatusPath()를 사용해야 함** |
| G-02 | context-fork.js가 현재 메모리를 정확히 스냅샷 | readMemory()가 `docs/.bkit-memory.json`만 참조 | **core/memory.js의 getPath()를 사용해야 함** |
| G-03 | 에이전트 안전 티어가 3단계 | SUBAGENT_POLICY_GROUPS가 2단계만 정의 | **full 티어 누락** |
| G-04 | PHASE_CONTEXT_MAP이 단계별 최적 컨텍스트만 로드 | idle 상태에서 5개 파일 + generateDynamicContext()에서 3개 중복 섹션 추가 | **중복 제거 필요** |
| G-05 | version.js 플래그가 policy.js 게이트 역할 | v2.0.0에서 플래그 정리 시 policy.js 연동 누락 | **Critical: 정책 생성 불가** |
| G-06 | bkit.config.json statusFile 설정이 실제 경로 결정 | statusFile: '.pdca-status.json'이지만 pdca/status.js가 직접 경로 결정 | config 값 미참조 (영향 낮음) |

### 4.5 QA Strategist: 테스트 커버리지 갭 분석

**테스트가 잡지 못하는 문제 유형**:

| # | 유형 | 설명 | 보강 방안 |
|---|------|------|----------|
| QA-01 | 런타임 경로 정합성 | tests/setup.js가 docs/ 경로에 fixture를 생성하므로 레거시 경로가 항상 존재 | 루트 경로만 생성하는 테스트 케이스 추가 |
| QA-02 | 플래그-사용처 정합성 | version.js 플래그 변경 시 사용처 검증 없음 | version.js 플래그와 사용처 매핑 테스트 추가 |
| QA-03 | 컨텍스트 토큰 계량 | 토큰 수 측정 테스트 부재 | session-start 출력 길이 제한 테스트 추가 |
| QA-04 | 권한 모델 일관성 | getReadOnlyTools() vs TOOL_ANNOTATIONS 교차 검증 부재 | annotation 기반 readonly 검증 테스트 추가 |
| QA-05 | 파일 존재 검증 | PHASE_CONTEXT_MAP 파일 존재 여부 미검증 | 모든 참조 파일 존재 확인 테스트 추가 |

### 4.6 Infra Architect: Hook 시스템 최적화

**session-start.js 컨텍스트 생성 흐름 분석**:

```
generateDynamicContext()
  |-> buildCoreRules()                   [항상]  ~200 tokens
  |-> buildOnboardingSection()           [항상]  ~300 tokens
  |-> buildOutputStyleSection()          [조건부] ~100 tokens
  |-> trackerContext                     [조건부] ~100 tokens
  |-> buildPdcaStatusSection()           [항상]  ~80 tokens
  |-> buildAvailableSkillsSection()      [항상]  ~150 tokens
  |-> loadPhaseAwareContext()            [항상]  ~variable (idle: 5files x ~200 = 1000)
  |-> buildAgentTriggersSection()        [항상]  ~300 tokens  <-- 중복!
  |-> buildFeatureReportSection()        [항상]  ~150 tokens  <-- 중복!
  |-> buildAutoTriggerSection()          [항상]  ~100 tokens  <-- 중복!
```

**최적화 전략**:
- `buildAgentTriggersSection()`, `buildFeatureReportSection()`, `buildAutoTriggerSection()`은 PHASE_CONTEXT_MAP의 `agent-triggers.md`, `feature-report.md`, `skill-triggers.md`와 중복
- idle 상태에서만 PHASE_CONTEXT_MAP이 이들을 로드하므로, 비-idle 단계에서도 인라인으로 생성하고 있음 -> 항상 중복
- **해결**: PHASE_CONTEXT_MAP에 의존하고, 인라인 빌더 3개 제거

### 4.7 Frontend Architect: 스킬 시스템과 컨텍스트 계층 구조

**PHASE_CONTEXT_MAP 파일 매핑 검증**:

| 파일명 | PHASE_CONTEXT_MAP 참조 | .gemini/context/ 실제 존재 | 불일치 |
|--------|----------------------|---------------------------|--------|
| commands.md | plan, idle | 존재 | -- |
| pdca-rules.md | plan, design, check, act, idle | 존재 | -- |
| feature-report.md | plan, design, do, check, act, idle | 존재 | -- |
| executive-summary-rules.md | plan, design | 존재 | -- |
| tool-reference.md | do | 존재 (v1) | **tool-reference-v2.md로 변경 필요** |
| skill-triggers.md | do, idle | 존재 | -- |
| agent-triggers.md | idle | 존재 | -- |
| core-rules.md | (미참조) | 존재 | **PHASE_CONTEXT_MAP에 추가 검토** |
| tool-reference-v2.md | (미참조) | 존재 | **v1 대체 필요** |

### 4.8 Product Manager: 리팩토링 우선순위 결정

**Impact-Effort Matrix**:

```
        High Impact
            |
   G-05 *  |  * S-01 (FR-04)
   FR-02 * |  * FR-01
            |
  ----------+---------- High Effort
            |
   FR-06 * |  * FR-05
   FR-09 * |  * FR-11
            |
        Low Impact
```

**우선순위 결정**:

| 순서 | ID | 작업 | Impact | Effort | 근거 |
|------|-----|------|--------|--------|------|
| 1 | G-05 | version.js-policy.js 플래그 정합성 복원 | **Critical** | Low | 정책 생성 자체가 불가능해지는 심각한 문제 |
| 2 | FR-01 | session-start version 하드코딩 수정 | **Critical** | Trivial | 1줄 수정, 즉시 효과 |
| 3 | FR-02/03 | context-fork.js 경로 위임 | **Critical** | Low | fork가 빈 데이터 반환 -> 분석 에이전트 오동작 |
| 4 | FR-04 | getReadOnlyTools() 정리 | **Critical** | Low | readonly 에이전트가 스킬 활성화 가능한 보안 문제 |
| 5 | FR-05 | SUBAGENT_POLICY_GROUPS full 티어 추가 | **High** | Medium | 3티어 보안 모델 완성 |
| 6 | FR-06 | session-start 중복 섹션 제거 | **High** | Medium | 토큰 550+ 절감 |
| 7 | FR-07 | PHASE_CONTEXT_MAP 파일 검증 | **High** | Low | 할루시네이션 방지 |
| 8 | FR-09/10 | tool-reference 정리 | **Medium** | Low | 중복 제거 |
| 9 | FR-08 | BKIT_PROJECT_DIR deprecation | **Medium** | Trivial | 레거시 정리 |
| 10 | FR-11 | agent-memory 접근 제어 문서화 | **Medium** | Medium | 보안 투명성 |

---

## 5. Scope

### 5.1 In Scope

- [x] Critical: version.js-policy.js 플래그 정합성 복원 (G-05)
- [x] Critical: session-start.js 버전 하드코딩 수정 (FR-01)
- [x] Critical: context-fork.js 레거시 경로 수정 (FR-02, FR-03)
- [x] Critical: getReadOnlyTools() 보안 수정 (FR-04)
- [ ] High: SUBAGENT_POLICY_GROUPS full 티어 추가 (FR-05)
- [ ] High: session-start.js 중복 섹션 제거 (FR-06)
- [ ] High: PHASE_CONTEXT_MAP 파일 존재 검증 (FR-07)
- [ ] Medium: tool-reference 파일 정리 (FR-09, FR-10)
- [ ] Medium: BKIT_PROJECT_DIR deprecation (FR-08)
- [ ] Medium: agent-memory 접근 제어 문서화 (FR-11)

### 5.2 Out of Scope

- common.js 브릿지 제거 (YAGNI - 사용처 0건이므로 현재 영향 없음)
- 테스트 fixture 레거시 경로 정리 (테스트는 정상 통과 중)
- RuntimeHook SDK 전면 전환 (v2.1.0 범위)
- ACP 도입 (v2.2.0 범위)

---

## 6. Implementation Design

### 6.1 Phase 1: Critical Fixes (즉시 적용)

#### 6.1.1 G-05: version.js-policy.js 플래그 정합성

**문제**: policy.js가 `flags.hasPolicyEngine`, `flags.hasProjectLevelPolicy`, `flags.hasExtensionPolicies`를 사용하지만 version.js에서 삭제됨

**수정 방안 A (Selected)**: version.js getFeatureFlags()에 누락 플래그 복원
```javascript
// version.js getFeatureFlags()에 추가
hasPolicyEngine: isVersionAtLeast('0.30.0'),
hasProjectLevelPolicy: isVersionAtLeast('0.31.0'),
hasExtensionPolicies: isVersionAtLeast('0.32.0'),
hasTaskTracker: isVersionAtLeast('0.32.0'),
```

**수정 방안 B (Alternative)**: policy.js에서 플래그 체크 제거하고 항상 생성
- 근거: minVersion이 0.34.0이므로 이 플래그들은 항상 true
- 그러나 방안 A가 더 안전 (향후 하위 버전 호환 가능성 유지)

#### 6.1.2 FR-01: version 하드코딩 수정

```javascript
// hooks/scripts/session-start.js L79
// Before: version: '1.5.9',
// After:  version: '2.0.0',
```

#### 6.1.3 FR-02/03: context-fork.js 경로 위임

```javascript
// Before (L73-74):
function readPdcaStatus(projectDir) {
  const statusPath = path.join(projectDir, 'docs', '.pdca-status.json');
  return readJsonSync(statusPath) || { version: '2.0', activeFeatures: {}, features: {} };
}

// After:
function readPdcaStatus(projectDir) {
  try {
    const { loadPdcaStatus } = require('../pdca/status');
    return loadPdcaStatus(projectDir);
  } catch {
    // Fallback for standalone usage
    const statusPath = path.join(projectDir, '.pdca-status.json');
    return readJsonSync(statusPath) || { version: '2.0', activeFeatures: {}, features: {} };
  }
}
```

```javascript
// Before (L83-84):
function readMemory(projectDir) {
  const memoryPath = path.join(projectDir, 'docs', '.bkit-memory.json');
  return readJsonSync(memoryPath) || { version: '1.0', data: {} };
}

// After:
function readMemory(projectDir) {
  try {
    const { getMemory } = require('../core/memory');
    const manager = getMemory(projectDir);
    return manager.load();
  } catch {
    // Fallback for standalone usage
    const memoryPath = path.join(projectDir, '.bkit', 'state', 'memory.json');
    return readJsonSync(memoryPath) || { version: '1.0', data: {} };
  }
}
```

#### 6.1.4 FR-04: getReadOnlyTools() 보안 수정

```javascript
// Before (L177-194):
function getReadOnlyTools() {
  return [
    ...
    BUILTIN_TOOLS.ACTIVATE_SKILL,   // REMOVE
    BUILTIN_TOOLS.WRITE_TODOS,      // REMOVE
    BUILTIN_TOOLS.SAVE_MEMORY,      // REMOVE
    ...
  ];
}

// After: getStrictReadOnlyTools() 사용을 권장하되,
// 하위호환을 위해 getReadOnlyTools()는 유지하되 이름 변경:
// getReadOnlyTools() -> getPhaseRestrictedTools() (Plan/Check용)
// getStrictReadOnlyTools() -> getReadOnlyTools() (보안 기준)
//
// 그러나 YAGNI: 현재 getReadOnlyTools()를 호출하는 곳이 없으므로 (policy.js가 직접 rules 사용)
// 단순히 write 도구 3개 제거하는 것이 최선
```

### 6.2 Phase 2: High Priority Fixes

#### 6.2.1 FR-05: SUBAGENT_POLICY_GROUPS full 티어

```javascript
const SUBAGENT_POLICY_GROUPS = Object.freeze({
  readonly: { /* 기존 유지 */ },
  docwrite: { /* 기존 유지 */ },
  full: {
    description: 'Full-access agents: iteration, orchestration, leadership',
    agents: ['pdca-iterator', 'cto-lead', 'pm-lead'],
    rules: [
      // 위험한 명령만 차단, 나머지 허용
      { toolName: 'run_shell_command', commandPrefix: 'rm -rf', decision: 'deny', priority: 100 },
      { toolName: 'run_shell_command', commandPrefix: 'git push --force', decision: 'deny', priority: 100 }
    ]
  }
});
```

**에이전트 재분류**:

| 에이전트 | 현재 그룹 | 수정 후 그룹 | 근거 |
|---------|----------|-------------|------|
| bkend-expert | readonly | **docwrite** | 코드 생성/수정이 주 업무 |
| enterprise-expert | readonly | readonly | 분석/가이드 전용 |
| pdca-iterator | (미정의) | **full** | 코드 수정 + 셸 명령 필요 |
| cto-lead | (미정의) | **full** | 팀 오케스트레이션 전권 |
| pm-lead | (미정의) | **full** | PM 팀 오케스트레이션 |

#### 6.2.2 FR-06: session-start.js 중복 섹션 제거

`generateDynamicContext()`에서 다음 3개 함수 호출 제거:
- `buildAgentTriggersSection()` -> PHASE_CONTEXT_MAP의 agent-triggers.md로 대체
- `buildFeatureReportSection()` -> PHASE_CONTEXT_MAP의 feature-report.md로 대체
- `buildAutoTriggerSection()` -> PHASE_CONTEXT_MAP의 skill-triggers.md로 대체

단, PHASE_CONTEXT_MAP에서 모든 단계에 feature-report.md가 포함되어 있으므로, 인라인 빌더 제거 시 누락되는 단계가 없는지 교차 검증 필요.

**검증 결과**: feature-report.md는 모든 6개 단계(plan, design, do, check, act, idle)에 포함됨. agent-triggers.md는 idle에만, skill-triggers.md는 do와 idle에만 포함됨. 따라서:
- `buildFeatureReportSection()`: 안전하게 제거 가능 (모든 단계에서 파일로 로드됨)
- `buildAgentTriggersSection()`: idle 외 단계에서 사라짐 -> 의도된 동작 (idle에서만 보여주는 것이 맞음)
- `buildAutoTriggerSection()`: do와 idle 외에서 사라짐 -> 의도된 동작

#### 6.2.3 FR-07: PHASE_CONTEXT_MAP 파일 존재 검증

```javascript
function loadPhaseAwareContext(pluginRoot, phase) {
  const effectivePhase = phase && PHASE_CONTEXT_MAP[phase] ? phase : 'idle';
  const files = PHASE_CONTEXT_MAP[effectivePhase];
  const contextDir = path.join(pluginRoot, '.gemini', 'context');

  const sections = [];
  const missing = [];
  for (const fileName of files) {
    const filePath = path.join(contextDir, fileName);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8').trim();
        if (content) sections.push(content);
      } catch (e) { /* non-fatal */ }
    } else {
      missing.push(fileName);
    }
  }

  // 디버그 모드에서 누락 파일 경고
  if (missing.length > 0 && process.env.BKIT_DEBUG === 'true') {
    console.error(`[WARN] Missing context files for phase ${effectivePhase}: ${missing.join(', ')}`);
  }

  return sections.length > 0
    ? `## Phase-Aware Context (${effectivePhase})\n\n${sections.join('\n\n')}`
    : '';
}
```

### 6.3 Phase 3: Medium Priority Fixes

#### 6.3.1 FR-09/10: tool-reference 정리

1. `.gemini/context/tool-reference.md` 삭제
2. PHASE_CONTEXT_MAP `do` 단계의 `tool-reference.md`를 `tool-reference-v2.md`로 변경
3. `core-rules.md`는 session-start의 `buildCoreRules()`와 중복이므로, 파일을 기준으로 인라인 빌더 제거 검토

#### 6.3.2 FR-08: BKIT_PROJECT_DIR deprecation

```javascript
// lib/core/platform.js L78
/** @deprecated Use PROJECT_DIR or getProjectDir() instead. Will be removed in v2.1.0. */
const BKIT_PROJECT_DIR = PROJECT_DIR;
```

---

## 7. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| G-05 수정 시 정책 생성 동작 변경 | Medium | High | 수정 후 policy.js 단위 테스트 추가 실행 |
| getReadOnlyTools() 변경 시 하위호환 파괴 | Low | Medium | 현재 사용처 0건 확인 완료. 안전하게 변경 가능 |
| context-fork 경로 변경 시 기존 스냅샷 호환 | Low | Low | 기존 스냅샷은 docs/ 경로로 생성되었으므로 병존 가능 |
| session-start 섹션 제거 시 컨텍스트 누락 | Medium | High | 제거 전 PHASE_CONTEXT_MAP 커버리지 교차 검증 완료 |
| 테스트 fixture 변경 없이 수정 시 테스트 실패 | Medium | Medium | 단위 테스트만 우선 수정, fixture는 별도 PR |

---

## 8. Implementation Order

```
Phase 1 (Critical - Day 1)
  ├─ [1] G-05: version.js 플래그 복원 (hasPolicyEngine 등)
  ├─ [2] FR-01: session-start version '2.0.0' 수정
  ├─ [3] FR-02/03: context-fork.js 경로 위임
  └─ [4] FR-04: getReadOnlyTools() write 도구 제거

Phase 2 (High - Day 2)
  ├─ [5] FR-05: SUBAGENT_POLICY_GROUPS full 티어 + 에이전트 재분류
  ├─ [6] FR-06: session-start 중복 섹션 제거
  └─ [7] FR-07: PHASE_CONTEXT_MAP 파일 검증 추가

Phase 3 (Medium - Day 3)
  ├─ [8] FR-09/10: tool-reference 정리 + PHASE_CONTEXT_MAP 업데이트
  ├─ [9] FR-08: BKIT_PROJECT_DIR deprecation
  └─ [10] FR-11: agent-memory 접근 제어 문서화

Verification (Day 3-4)
  ├─ 기존 754 TC 전체 통과 확인
  ├─ 신규 TC 추가 (플래그 정합성, 권한 모델 일관성, 토큰 계량)
  └─ 수동 E2E: Gemini CLI 세션 시작 후 컨텍스트 출력 확인
```

---

## 9. Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| 기존 테스트 통과율 | 754/754 (100%) | node tests/run-all.js |
| 레거시 경로 참조 (lib/, hooks/) | 0건 | grep 'docs/\.pdca-status\|docs/\.bkit-memory' lib/ hooks/ |
| getReadOnlyTools() write 도구 | 0건 | 단위 테스트 |
| version.js 플래그 - policy.js 사용처 불일치 | 0건 | 교차 검증 테스트 |
| idle 세션 컨텍스트 크기 | 현재 대비 25% 이상 감소 | 문자열 길이 측정 |
| SUBAGENT_POLICY_GROUPS 티어 수 | 3 (readonly, docwrite, full) | 단위 테스트 |

---

## 10. Agent Team Assignment

| Agent | Role | Tasks | Priority |
|-------|------|-------|----------|
| code-analyzer-1 | 코드 품질 분석 | T-01~T-07 토큰 낭비 패턴 확인 및 수정 | Phase 1-2 |
| security-architect | 보안 아키텍처 | S-01~S-05 권한 수정 및 검증 | Phase 1-2 |
| enterprise-expert | 아키텍처 전문가 | L-01~L-04 레거시 정리 전략 실행 | Phase 1-3 |
| gap-detector | 갭 분석 | G-01~G-06 설계-구현 불일치 해소 확인 | Phase 1-2 |
| qa-strategist | QA 전략 | QA-01~QA-05 테스트 보강 설계 | Phase 3 |
| frontend-architect | 컨텍스트 구조 | PHASE_CONTEXT_MAP 정리 및 최적화 | Phase 2-3 |
| infra-architect | Hook 최적화 | session-start.js 중복 제거 | Phase 2 |
| code-analyzer-2 | 토큰 분석 | 토큰 계량 및 최적화 효과 측정 | Phase 2-3 |
| product-manager | 우선순위 관리 | 일정 조율 및 위험 관리 | All |
| report-generator | 보고서 | 보완 완료 보고서 생성 | Phase 3 완료 후 |

---

*Plan generated by CTO Lead Agent Team - /plan-plus brainstorming process*
*10 specialized agents analyzed 46 source files across 9 directories*
