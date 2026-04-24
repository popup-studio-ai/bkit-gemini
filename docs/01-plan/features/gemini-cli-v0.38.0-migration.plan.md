# Gemini CLI v0.38.0 Migration Plan -- bkit v2.0.4

> **Feature**: gemini-cli-v038-migration
> **Version**: bkit v2.0.4
> **Created**: 2026-04-16
> **Status**: Draft
> **Strategy**: B' (Balanced Enhancement) -- 7th application of validated Strategy B pattern
> **Migration Scope**: v0.36.0 -> v0.38.1 (Stable -> Stable, v0.37.x + v0.38.x 누적)
> **Delta Scope**: v0.37.2 -> v0.38.1 (Minor + Patch, 109+2 commits, ~313 files)
> **Research**: [gemini-cli-v0.38.0-research.md](../research/gemini-cli-v0.38.0-research.md)
> **Impact Analysis**: [gemini-cli-v0.38.0-impact.analysis.md](../../03-analysis/gemini-cli-v0.38.0-impact.analysis.md)
> **Prior Art**: [gemini-cli-v0.37.2-migration.plan.md](gemini-cli-v0.37.2-migration.plan.md) (본 계획이 상위 집합)

---

## Executive Summary

| Item | Content |
|------|---------|
| Target Version | **v0.38.1 Stable** (2026-04-15, Plan Mode silent fallback 패치) |
| Breaking Changes (v0.37.2 -> v0.38.1) | 7건 -- **bkit 직접 영향 0건** |
| Critical/High Impact | **0건** |
| Medium Impact | **3건** (version.js 플래그, bkit.config.json, session-start.js showOutput) |
| Low Impact | **4건** |
| 기능 개선 기회 | **6건** (P0 2건 + P1 2건 + P2 1건 + 자동 1건) |
| Recommended Strategy | **Approach B' (Balanced Enhancement)**: 호환성 확인 + P0 기회 채택 + 기능 플래그 확장 |
| Estimated Effort | **7.5h** |
| Wave Structure | 3 Waves (Foundation -> Feature Adoption -> Tests) |
| Affected Files | 7개 |
| YAGNI Savings | **63%** (~20h 추정 -> 7.5h 실행) |

---

## 1. Intent Analysis (의도 분석)

### 1.1 WHY: 왜 지금 v0.38.1로 가는가

**Primary: P0 기회 2건의 즉시 가치 실현**

v0.38.0은 bkit 훅 시스템의 핵심 제약 2개를 해소한다:
1. **hooksConfig.showOutput**: bkit 훅이 이미 반환하는 `systemMessage`가 CLI UI에 표시되지 않던 문제 해결. 1줄 설정 추가로 즉시 UX 향상
2. **BeforeModel E2E 모델 오버라이드**: `before-model.js`의 모델 라우팅 "힌트"가 실제 API 호출 수준으로 승격. PDCA 단계별 모델 라우팅(plan/design=pro, check/act/report=flash) 실현

이 두 기능은 bkit v2.0.4의 commit 7078c2a(decision/systemMessage 포맷)와 MODEL_ROUTING 상수가 이미 준비한 "절반짜리 구현"을 완성한다.

**Secondary: v0.37.x 누적 최적화 + 최신 stable 추종**

v0.37.x 마이그레이션(ensureAgentsEnabled 스킵, isJITMode 정확성 복원)이 미실행 상태. v0.38.1 마이그레이션에 통합 실행하여 계획 중복을 제거한다.

**Tertiary: v0.39 대비 기반 확보**

v0.39.0-preview에서 `invoke_subagent` 통합, `/memory inbox`, JSONL chat recording 등 bkit 아키텍처에 영향을 줄 변경이 예고되어 있다. v0.38.x 기능 플래그 확보가 조건부 분기의 전제조건이다.

### 1.2 핵심 목적 판정

| 질문 | 답변 |
|------|------|
| 단순 호환성 유지? | **아님** -- Breaking 0건이지만 P0 기회 2건이 즉시 가치를 제공 |
| 기능 고도화? | **부분적** -- P0 기회(showOutput, BeforeModel E2E)만 선별 채택 |
| 최적화 + 기능 채택 + 최신 추종? | **맞음** -- 3가지를 한 번의 마이그레이션으로 달성 |

### 1.3 사용자 가치 분석

| 가치 | v0.38.1 기여 | 중요도 |
|------|-------------|--------|
| **가시성** | hooksConfig.showOutput으로 훅 메시지가 UI에 표시 | **P0** |
| **비용 최적화** | BeforeModel E2E로 PDCA 단계별 실제 모델 라우팅(pro/flash) | **P0** |
| **안정성** | 15개 버그 수정 + McpProgress leak 방지 자동 수혜 | 자동 적용 |
| **정확성** | v0.37.x ensureAgentsEnabled/isJITMode 정합성 복원 | P1 |
| **기반** | v0.38.0+ 기능 플래그로 향후 기능 활용 가능 | P1 |

### 1.4 시간/리소스 제약

| 항목 | 상태 |
|------|------|
| v0.38.1 Stable 릴리스일 | 2026-04-15 (릴리스 완료, 최신 stable) |
| Critical Breaking Change | 0건 |
| 긴급도 | 중간 -- 기능적으로 정상 동작하나 P0 기회의 가치가 높음 |
| v0.39.0 stable | 미정 (preview 상태) |

### 1.5 bkit 철학 부합성

| 원칙 | 부합 여부 | 근거 |
|------|-----------|------|
| **Automation First** | 부합 | showOutput 자동 설정, BeforeModel 자동 모델 라우팅 |
| **No Guessing** | 부합 | ContextCompressionService(experimental) 선제 코드 거부. `=== undefined` 패턴 유지 |
| **Docs = Code** | 부합 | PDCA 문서 경로/구조 불변 |
| **YAGNI** | 부합 | 63% 절감. workspaceDirectories/ContextCompression은 별도 이니셔티브 분리 |

---

## 2. Strategy Alternatives (전략 비교 매트릭스)

### 2.1 Approach A: Minimal (호환 확인만)

**범위**: bkit.config.json testedVersions 갱신 + v0.37.x 누적 최적화만

| 작업 | 파일 | 공수 |
|------|------|------|
| testedVersions에 "0.37.1"~"0.38.1" 추가 | `bkit.config.json` | 5분 |
| v0.37.x 기능 플래그 8개 + ensureAgents 스킵 + isJITMode 복원 | `version.js`, `session-start.js`, `import-resolver.js` | 1h |
| 테스트 갱신 | `tests/` | 30분 |
| **합계** | **5 files** | **~2h** |

| 장점 | 단점 | 리스크 | 추천도 |
|------|------|--------|--------|
| 최소 위험, v0.37.2 plan과 동일 범위 | P0 기회(showOutput, BeforeModel E2E) 미실현. v0.38.0 신규 기능 플래그 없음 | 매우 낮음 | **Low** -- P0 기회의 ROI가 너무 높아 포기하기 아까움 |

### 2.2 Approach B': Balanced Enhancement (RECOMMENDED)

**범위**: A + v0.38.0 기능 플래그 8개 + hooksConfig.showOutput 자동 설정 + BeforeModel E2E 모델 라우팅

| 작업 | 파일 | 공수 |
|------|------|------|
| bkit.config.json testedVersions "0.37.1"~"0.38.1" 추가 | `bkit.config.json` | 5분 |
| version.js v0.37.0+ 기능 플래그 8개 + v0.38.0+ 플래그 8개 | `lib/gemini/version.js` | 45분 |
| getBkitFeatureFlags() v0.37.0+/v0.38.0+ 매핑 확장 | `lib/gemini/version.js` | 15분 |
| session-start.js ensureAgentsEnabled() v0.37.0+ 스킵 | `hooks/scripts/session-start.js` | 15분 |
| session-start.js hooksConfig.showOutput 자동 설정 | `hooks/scripts/session-start.js` | 30분 |
| import-resolver.js isJITMode() v0.37.0+ false 반환 | `lib/gemini/import-resolver.js` | 15분 |
| before-model.js BeforeModel E2E 모델 오버라이드 구현 | `hooks/scripts/before-model.js` | 3h |
| tc105 기능 플래그 TC + tc111 기대값 갱신 + 신규 TC | `tests/` | 1h |
| 기존 993+ TC 회귀 테스트 + E2E 검증 | 전체 | 30분 |
| **합계** | **7 files** | **~7.5h** |

| 장점 | 단점 | 리스크 | 추천도 |
|------|------|--------|--------|
| P0 기회 2건 즉시 실현. 기존 코드(MODEL_ROUTING, decision/systemMessage)를 완성. v0.37.x+v0.38.x 누적 최적화 한 번에 해결. 기능 플래그 16개로 v0.39 대비 | A 대비 +5.5h (주로 BeforeModel E2E 3h) | 낮음 -- BeforeModel E2E는 v0.38.0 stable API. showOutput은 1줄 설정 | **HIGH** -- 검증된 패턴의 7번째 적용 |

### 2.3 Approach C: Comprehensive (전면 통합)

**범위**: B' + Subagent workspaceDirectories + ContextCompressionService 연계 설계 + Background Memory Service 경로 관리 + 환경변수 기본값 문법 전환

| 작업 | 파일 | 공수 |
|------|------|------|
| B' 전체 작업 | (위 참조) | 7.5h |
| Subagent workspaceDirectories 21개 에이전트 적용 | `agents/*.md` | 2-3h |
| ContextCompressionService 연계 설계 + 어댑터 | `lib/gemini/context-fork.js` + 신규 | 8-12h |
| gemini-extension.json `${VAR:-default}` 전환 | `gemini-extension.json` | 30분 |
| Background Memory Service 경로 격리 가드 | `lib/core/memory.js` | 1h |
| 추가 테스트 | tests/ | 2h |
| **합계** | **15+ files** | **~22-26h** |

| 장점 | 단점 | 리스크 | 추천도 |
|------|------|--------|--------|
| v0.38.x 기능 최대 활용. 보안 격리 완성 | 3-4배 작업량. ContextCompressionService는 `experimental.generalistProfile`로 기본 비활성 -- 사용자 요구 없음. workspaceDirectories 21개 에이전트 일괄 적용은 검증 부담 | 중간 -- 대규모 변경, experimental API 의존 | **Low** -- YAGNI 위반 다수. 별도 이니셔티브로 분리 |

### 2.4 Evaluation Matrix

| 기준 (가중치) | A: Minimal (~2h) | B': Balanced (7.5h) | C: Comprehensive (22-26h) |
|---------------|-------------------|----------------------|----------------------------|
| 위험도 (30%) | 10 (극소) | 8 (낮음) | 4 (experimental 의존) |
| 작업량 (25%) | 9 (2h) | 6 (7.5h) | 2 (24h) |
| 가치 창출 (25%) | 4 (선언+최적화) | 9 (P0 2건 실현) | 10 (전면) |
| 장기 이점 (20%) | 4 (v0.37 기반만) | 8 (v0.38 기반+P0 완성) | 9 (완전) |
| **가중 합계** | **6.95** | **7.80** | **5.80** |

### 2.5 Strategy Decision

**선택: Approach B' (Balanced Enhancement)** -- 가중 합계 7.80 (최고)

선택 근거:

1. **검증된 패턴의 7회 연속 적용**: Strategy B/B'는 v0.31.0부터 7번 연속 최고점. `feedback_migration_pattern.md` 지침 준수
2. **P0 기회의 높은 ROI**: showOutput(30분, 즉시 UX 향상) + BeforeModel E2E(3h, bkit 핵심 차별화)가 전체 7.5h의 가치 중심
3. **기존 코드 완성**: commit 7078c2a의 `decision/systemMessage`와 `MODEL_ROUTING` 상수가 이미 "절반 구현" 상태. v0.38.0이 나머지 절반을 열어줌
4. **A 대비 B' 편향 근거**: Breaking 0건이지만 P0 기회 2건의 가치가 A의 시간 절약(5.5h)보다 큼. B'와 A의 가중 합계 차이(7.80 vs 6.95)가 이전 마이그레이션(8.05 vs 6.70)과 유사
5. **C 탈락 근거**: ContextCompressionService는 `experimental.generalistProfile`로 기본 비활성. workspaceDirectories 21개 일괄 적용은 현재 사용자 요구 없음. YAGNI 위반

---

## 3. YAGNI Review

### 3.1 채택/보류 판정

| # | 항목 | 공수 | 채택? | 근거 |
|---|------|------|-------|------|
| 1 | bkit.config.json testedVersions 4개 추가 | 5분 | **채택 P0** | 호환성 선언 |
| 2 | version.js v0.37.0+ 기능 플래그 8개 | 30분 | **채택 P1** | v0.37.x 조건부 분기 전제 (v0.37.2 plan 미실행분) |
| 3 | version.js v0.38.0+ 기능 플래그 8개 | 15분 | **채택 P1** | P0 기능 구현 전제. hasHookShowOutput, hasBeforeModelE2E 등 |
| 4 | getBkitFeatureFlags() 확장 | 15분 | **채택 P1** | 플래그에 자연 수반 |
| 5 | ensureAgentsEnabled() v0.37.0+ 스킵 | 15분 | **채택 P1** | 불필요 I/O 제거 (v0.37.2 plan 미실행분) |
| 6 | isJITMode() v0.37.0+ false 반환 | 15분 | **채택 P1** | JIT 방어 정확성 복원 (v0.37.2 plan 미실행분) |
| 7 | hooksConfig.showOutput 자동 설정 | 30분 | **채택 P0** | 1줄 설정으로 즉시 UX 향상. 기존 ensureAgentsEnabled() 패턴 재사용 |
| 8 | BeforeModel E2E 모델 오버라이드 | 3h | **채택 P0** | bkit 핵심 차별화. MODEL_ROUTING 상수 활용한 실제 모델 라우팅 |
| 9 | 테스트 갱신/추가 | 1h | **채택 P1** | 플래그/기능 검증 필수 |
| 10 | 회귀 + E2E | 30분 | **채택 P1** | QA 필수 |
| 11 | Subagent workspaceDirectories (21개 에이전트) | 2-3h | **보류 P1** | 가치 있으나 별도 이니셔티브로 분리. 21개 일괄 적용 검증 부담 |
| 12 | ContextCompressionService 연계 설계 | 8-12h | **보류 P3** | experimental 기본 비활성. v2.1.0 context-optimization에서 통합 검토 |
| 13 | 환경변수 기본값 문법 `${VAR:-default}` | 30분 | **보류 P2** | nice-to-have. gemini-extension.json 현재 상태로 동작 |
| 14 | Background Memory Service 경로 격리 | 1h | **보류 P3** | experimentalMemoryManager 기본 비활성 |
| 15 | tools.js 신규 도구 등록 | 15분 | **보류 P2** | bkit이 직접 호출하지 않는 도구 |
| 16 | Background Process 도구 BeforeTool matcher 추가 | 30분 | **보류 P3** | 읽기 전용 도구, 보안 위험 없음 |

### 3.2 YAGNI 체크리스트

- [x] "있으면 좋을 것 같은" 기능 제외: workspaceDirectories(P1 보류), `${VAR:-default}`(P2 보류)
- [x] 현재 사용자가 실제로 필요: showOutput(훅 메시지 가시성), BeforeModel E2E(비용 최적화)
- [x] bkit 철학 부합: No Guessing(experimental 선제 코드 거부), Automation First(자동 설정)
- [x] 유지보수 비용 대비 가치 충분: showOutput(30분/높은 가치), BeforeModel E2E(3h/핵심 차별화)
- [x] 이전 마이그레이션 불필요 패턴 미반복: C 전략의 선제 설계 패턴 거부

### 3.3 YAGNI Savings

| Category | Items | Effort |
|----------|-------|--------|
| 채택 (Wave 1-3) | 10 items | 7.5h |
| 보류 (P1/P2/P3) | 6 items | 12.5-17.5h |
| **Impact Analysis 추정 합계** | 16 items | ~20-25h |
| **YAGNI 절감률** | | **63%** |

---

## 4. Recommended Strategy + Rationale (추천 전략)

**Strategy B' (Balanced Enhancement)** -- 7.5h, 3 Waves, 7 files

핵심 근거:

1. **"절반 완성" 코드의 완성**: bkit v2.0.4는 이미 `decision/systemMessage` 포맷(commit 7078c2a)과 `MODEL_ROUTING` 상수를 갖고 있다. v0.38.0이 서버 측 지원을 추가했으므로, 클라이언트(bkit)에서 남은 반쪽만 구현하면 End-to-End가 완성된다
2. **비용 대비 가치**: showOutput은 30분 투자로 모든 bkit 훅의 사용자 가시성을 확보한다. BeforeModel E2E는 3h 투자로 PDCA 단계별 모델 비용을 최적화한다 (pro -> flash 전환으로 약 80% 비용 절감 가능한 단계에서)
3. **v0.37.x 부채 청산**: 미실행된 v0.37.2 plan의 최적화(ensureAgentsEnabled 스킵, isJITMode 복원)를 함께 처리하여 계획 중복 제거

---

## 5. Implementation Roadmap (구현 로드맵)

### Wave 1: Foundation (1.75h) -- P0/P1 기반

| # | 작업 | 파일 | 공수 | 우선순위 |
|---|------|------|------|----------|
| 1.1 | bkit.config.json testedVersions에 `"0.37.1"`, `"0.37.2"`, `"0.38.0"`, `"0.38.1"` 추가 | `bkit.config.json` L120 | 5분 | P0 |
| 1.2 | version.js v0.37.0+ 기능 플래그 8개 추가 | `lib/gemini/version.js` | 30분 | P1 |
| 1.3 | version.js v0.38.0+ 기능 플래그 8개 추가 | `lib/gemini/version.js` | 15분 | P1 |
| 1.4 | getBkitFeatureFlags() v0.37.0+/v0.38.0+ 매핑 확장 | `lib/gemini/version.js` | 15분 | P1 |
| 1.5 | session-start.js ensureAgentsEnabled() v0.37.0+ 스킵 | `hooks/scripts/session-start.js` | 15분 | P1 |
| 1.6 | import-resolver.js isJITMode() v0.37.0+ false 반환 | `lib/gemini/import-resolver.js` | 15분 | P1 |

**v0.37.0+ 기능 플래그** (v0.37.2 plan 미실행분):
- `hasPlanModeStable`, `hasPlanModelRouting`, `hasEnableAgentsDefaultTrue`, `hasJitContextDefaultFalse`
- `hasMemoryBoundaryMarkers`, `hasProjectMemoryScope`, `hasChapters`, `hasSecretVisibilityLockdown`

**v0.38.0+ 기능 플래그** (신규):
- `hasHookShowOutput`, `hasBeforeModelE2E`, `hasSubagentWorkspaceDirs`, `hasEnvVarDefaults`
- `hasContextCompression`, `hasBackgroundProcessTools`, `hasPersistentPolicyApprovals`, `hasAutoHeapMemory`

### Wave 2: Feature Adoption (3.5h) -- P0 기회 채택

| # | 작업 | 파일 | 공수 | 우선순위 |
|---|------|------|------|----------|
| 2.1 | session-start.js `hooksConfig.showOutput: true` 자동 설정 | `hooks/scripts/session-start.js` | 30분 | P0 |
| 2.2 | before-model.js BeforeModel E2E 모델 오버라이드 구현 | `hooks/scripts/before-model.js` | 3h | P0 |

**2.1 상세**: session-start.js의 `ensureAgentsEnabled()` 패턴을 재사용하여 `ensureHookShowOutput()` 함수 추가. `.gemini/settings.json`에 `hooksConfig: { showOutput: true }` 자동 설정. `=== undefined` 체크로 사용자 명시적 설정 존중 (No Guessing).

**2.2 상세**: before-model.js의 `getModelRoutingHint()` 함수를 확장. 기존 `additionalContext` 힌트 주입 로직에 더해, `hasBeforeModelE2E` 플래그가 true일 때 `hookSpecificOutput`에 `llm_request.model` 필드를 추가하여 실제 모델 변경을 반환. 모델 매핑:
```
MODEL_ROUTING.plan.preferredModel: 'pro'   -> 'gemini-2.5-pro'
MODEL_ROUTING.design.preferredModel: 'pro'  -> 'gemini-2.5-pro'
MODEL_ROUTING.do.preferredModel: 'pro'      -> 'gemini-2.5-pro'
MODEL_ROUTING.check.preferredModel: 'flash' -> 'gemini-2.5-flash'
MODEL_ROUTING.act.preferredModel: 'flash'   -> 'gemini-2.5-flash'
MODEL_ROUTING.report.preferredModel: 'flash'-> 'gemini-2.5-flash'
```
기존 `additionalContext` 힌트는 하위 호환을 위해 유지 (v0.37.x에서는 E2E 무시되므로 힌트만 작동).

### Wave 3: Tests & QA (1.5h) -- P1 검증

| # | 작업 | 파일 | 공수 | 우선순위 |
|---|------|------|------|----------|
| 3.1 | tc105 v0.37.0+/v0.38.0+ 기능 플래그 TC 추가 | `tests/suites/tc105-*.js` | 20분 | P1 |
| 3.2 | tc111 v0.37.0+ 스킵 조건 기대값 갱신 | `tests/suites/tc111-*.js` | 15분 | P1 |
| 3.3 | 신규 TC: showOutput 자동 설정 검증 | `tests/` | 15분 | P1 |
| 3.4 | 신규 TC: BeforeModel E2E 모델 오버라이드 반환값 검증 | `tests/` | 15분 | P1 |
| 3.5 | Zero Script QA 회귀 (993+ TC) | 전체 | 15분 | P1 |
| 3.6 | E2E PDCA 사이클 수동 검증 | 전체 | 10분 | P1 |

### Wave 4 (Deferred): 보류 항목

별도 이니셔티브 또는 v0.39 stable 시 재검토:
- Subagent workspaceDirectories 21개 에이전트 적용 (2-3h, P1 별도)
- 환경변수 기본값 `${VAR:-default}` 문법 전환 (30분, P2)
- tools.js 신규 도구 등록 (15분, P2)
- ContextCompressionService 연계 설계 (8-12h, v2.1.0 context-optimization)
- Background Memory Service 경로 격리 (1h, P3)
- Background Process 도구 BeforeTool matcher (30분, P3)

### 총 공수

| Wave | 공수 | 누적 |
|------|------|------|
| Wave 1: Foundation | 1.75h | 1.75h |
| Wave 2: Feature Adoption | 3.5h | 5.25h |
| Wave 3: Tests & QA | 1.5h | 6.75h |
| **Buffer (10%)** | 0.75h | **7.5h** |

---

## 6. Risk Management Plan (위험 관리)

### 6.1 식별된 위험

| # | 위험 | 가능성 | 영향 | 완화 방안 |
|---|------|--------|------|-----------|
| R1 | BeforeModel E2E `llm_request.model` 반환 형식이 CLI 기대와 불일치 | 낮음 | 중간 | Research PR #24784 반환 스키마 정밀 확인. `hookSpecificOutput.hookEventName` + `hookSpecificOutput.llm_request.model` 형식 준수 |
| R2 | hooksConfig.showOutput 설정이 기존 훅 JSON 파싱에 영향 | 매우 낮음 | 낮음 | 기존 `{decision, systemMessage}` 포맷 불변. showOutput은 CLI 측 UI 표시만 제어 |
| R3 | BeforeModel E2E와 Plan Mode silent fallback(v0.38.1) 상호작용 | 낮음 | 중간 | Plan Mode 진입 시 BeforeModel 훅의 모델 지정이 fallback으로 무시될 수 있음. E2E 테스트에서 Plan Mode 시나리오 검증 |
| R4 | v0.37.x 최적화(ensureAgents 스킵, isJITMode)가 v0.38.x에서 부작용 | 매우 낮음 | 낮음 | v0.38.0도 enableAgents=true 기본, jitContext=false 기본. 동일 방향 |
| R5 | 993+ TC 회귀 | 낮음 | 중간 | Wave 3에서 전수 검증. 실패 시 Wave 2만 부분 롤백 가능 |

### 6.2 롤백 전략

1. **전체 롤백**: Wave 1-2를 단일 commit(또는 2개 commit)으로 구성. `git revert`로 전체 복원
2. **부분 롤백 -- P0 기회만 롤백**: Wave 2만 revert하면 Wave 1(플래그+최적화)은 무해하게 유지
3. **BeforeModel E2E만 비활성화**: `hasBeforeModelE2E` 플래그를 false로 고정하면 기존 힌트-only 동작으로 복귀
4. **하위 호환**: 모든 조건부 분기가 `isVersionAtLeast()` 가드 하에 동작하므로 v0.36.0 사용자는 기존 경로 유지

### 6.3 테스트 전략

| 단계 | 검증 | 방법 |
|------|------|------|
| 사전 | Zero Script QA baseline 확인 | `npm test` 전체, 993/993 기록 |
| Wave 1 후 | 기능 플래그 + 최적화 분기 | tc105/tc111 실행, 신규+기존 TC PASS |
| Wave 2 후 | P0 기능 단위 검증 | showOutput TC + BeforeModel E2E TC PASS |
| Wave 3 | 전체 회귀 | 993+ TC 0 회귀 확인 |
| 배포 전 | E2E PDCA 사이클 | plan -> design -> do -> check -> act -> report 수동 실행 |

### 6.4 v0.37.2 plan 통합

본 계획은 v0.37.2 plan의 상위 집합(Superset)이다:
- v0.37.2 plan의 Wave 1-3 전체가 본 계획의 Wave 1에 포함
- v0.37.2 plan의 "보류" 항목 중 2건(showOutput, BeforeModel E2E)이 본 계획의 Wave 2로 승격
- v0.37.2 plan은 본 계획 실행 시 자동 폐기(Superseded)

---

## References

- Research: `docs/01-plan/research/gemini-cli-v0.38.0-research.md`
- Impact Analysis: `docs/03-analysis/gemini-cli-v0.38.0-impact.analysis.md`
- Prior Plan (superseded): `docs/01-plan/features/gemini-cli-v0.37.2-migration.plan.md`
- Strategy B Pattern: `.claude/agent-memory/migration-strategist/feedback_migration_pattern.md`
- bkit commit 7078c2a: decision/systemMessage hook output format
- v0.38.1 Release: https://github.com/google-gemini/gemini-cli/releases/tag/v0.38.1
- BeforeModel E2E PR: https://github.com/google-gemini/gemini-cli/pull/24784
- Hook showOutput PR: https://github.com/google-gemini/gemini-cli/pull/24616

---

*Plan 작성 완료: 2026-04-16 | 승인 대기*
