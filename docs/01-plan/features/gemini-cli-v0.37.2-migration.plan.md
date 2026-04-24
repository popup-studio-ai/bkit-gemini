# Gemini CLI v0.37.2 Migration Plan -- bkit v2.0.4

> **Feature**: gemini-cli-v0372-migration
> **Version**: bkit v2.0.4
> **Created**: 2026-04-14
> **Status**: Draft
> **Strategy**: B' (Balanced Enhancement) -- 6th application of validated Strategy B pattern
> **Migration Scope**: v0.36.0 -> v0.37.2 (Stable -> Stable, v0.37.1 포함 누적)
> **Delta Scope**: v0.37.1 -> v0.37.2 (ZERO risk cherry-pick patch)
> **Research**: [gemini-cli-v0.37.2-research.md](../research/gemini-cli-v0.37.2-research.md)
> **Impact Analysis**: [gemini-cli-v0.37.2-impact.analysis.md](../../03-analysis/gemini-cli-v0.37.2-impact.analysis.md)
> **Prior Art**: [gemini-cli-v0.37.1-migration.plan.md](gemini-cli-v0.37.1-migration.plan.md) (본 계획의 상위 집합(Superset) 기반)

---

## Executive Summary

| Item | Content |
|------|---------|
| Target Version | **v0.37.2 Stable** (2026-04-13 released, cherry-pick UI 패치) |
| v0.37.1 -> v0.37.2 Breaking Changes | **0건** (TableRenderer UI-only) |
| v0.36.0 -> v0.37.2 누적 Breaking Changes | 0건 (코드 변경 필수 항목 없음) |
| Default Value Changes (누적) | 3건 (enableAgents=true 복원, jitContext=false, compactToolOutput=true) -- v0.37.1 분석과 동일 |
| Recommended Strategy | **Approach B' (Balanced Enhancement)**: 최적화 + 기능 플래그 + 선별적 기회 채택 |
| Estimated Effort | **2.4h** (v0.37.1 계획 2.3h + v0.37.2 델타 0.1h) |
| Wave Structure | 3 Waves (Foundation -> Optimization -> Tests) |
| Affected Files | 5개 (v0.37.1 계획과 동일, testedVersions 엔트리만 추가) |
| YAGNI Savings | **71%** (~8h 추정 -> 2.4h 실행) |

## Value Delivered

| Perspective | Content |
|-------------|---------|
| Problem | v0.37.0 기본값 복원/변경으로 bkit 방어 코드가 불필요한 I/O 및 잘못된 모드 판정 수행. v0.37.1, v0.37.2 호환성 선언 누락 |
| Solution | 버전 감지 기반 조건부 스킵 + 기능 플래그 확장 + testedVersions 갱신 + 테스트 보강 |
| Functional Effect | 불필요한 settings.json 쓰기 제거, JIT 방어 코드 정확성 복원, v0.37.0+ 기능 게이팅 기반 확보, 마크다운 표 렌더링 품질 자동 수혜 |
| Core Value | bkit 코드-실제동작 의미적 정합성 + v0.38.0 대비 기반 + 최신 stable 호환성 선언 |

---

## 1. Intent Analysis (의도 분석)

### 1.1 WHY: 왜 지금 v0.37.2로 가는가

**Primary: 최신 Stable 추종 + 코드 의미 정합성 복원**

v0.37.2는 2026-04-13 릴리스된 최신 stable로, v0.37.1에 대한 단일 UI 버그(표 렌더링 ANSI 스타일 보존) cherry-pick 핫픽스다. bkit이 v0.36.0을 target으로 하는 상태에서 v0.37.2까지 단번에 승격하여:

1. **누적 최적화 기회 회수**: v0.37.0에서 발생한 `ensureAgentsEnabled()` 중복 쓰기와 `isJITMode()` 과잉 판정을 한 번에 해결
2. **최신 stable 선언**: testedVersions에 `0.37.1`, `0.37.2`를 추가하여 사용자에게 검증된 호환 버전을 선언
3. **표 렌더링 품질 자동 수혜**: PDCA Report 및 에이전트 출력의 마크다운 표에서 볼드/이탤릭/색상 보존

**Secondary: v0.38.0 대비 기반 확보**

v0.38.0-preview는 ContextCompressionService, Background Memory Service, Skill Subagent Injection 등 bkit과 충돌 가능성이 있는 기능을 포함한다. v0.37.0+ 기능 플래그가 확보되어야 조건부 분기가 가능하다. v0.38 라인이 skip되고 v0.39 nightly로 진행 중이므로, stable 승격 전까지 선제적 코드 작업은 YAGNI 위반이다.

**Tertiary: v0.37.1 계획의 실행 트리거**

v0.37.1 계획이 Draft 상태로 남아있다. v0.37.2는 v0.37.1의 상위 집합(Superset)이므로, v0.37.1 계획을 폐기하고 v0.37.2로 통합 실행함으로써 계획 중복을 제거한다.

### 1.2 핵심 목적 판정

| 질문 | 답변 |
|------|------|
| 단순 호환성 유지? | **부분적** -- Breaking Change 0건이지만 testedVersions 미선언 상태 |
| 기능 고도화? | **아님** -- P2 기회 항목은 별도 이니셔티브로 분리 |
| 최적화 + 기반 확보 + 최신 추종? | **맞음** -- 3가지를 한 번의 마이그레이션으로 달성 |

### 1.3 사용자 가치 분석

| 가치 | v0.37.2 기여 | 중요도 |
|------|-------------|--------|
| **안정성** | enableAgents=true 복원 + 11개 버그 수정 + UI 표 렌더링 수정 자동 수혜 | 자동 적용 |
| **정확성** | bkit 코드가 CLI 실제 동작과 의미적으로 일치 | P1 |
| **성능** | 불필요한 settings.json 쓰기 제거, JIT 방어 코드 스킵 | 미세 개선 |
| **가독성** | PDCA Report 등 마크다운 표의 ANSI 스타일(볼드/색상) 정상 표시 | 자동 적용 |
| **기반** | v0.37.0+ 기능 플래그로 향후 기능 활용 가능 | P1 |

### 1.4 시간/리소스 제약

| 항목 | 상태 |
|------|------|
| v0.37.2 Stable 릴리스일 | 2026-04-13 (릴리스 완료) |
| Critical Breaking Change | 0건 (v0.37.1 -> v0.37.2 0건, v0.36.0 누적 0건) |
| 긴급도 | 낮음 -- 코드 변경 없이도 정상 동작 |
| v0.38.0 stable | 미정 (v0.38 preview 이후 v0.39 nightly로 진행) |

---

## 2. Strategy Alternatives (전략 비교 매트릭스)

### 2.1 Approach A: Minimal Patch (testedVersions만)

**범위**: `bkit.config.json` testedVersions에 `"0.37.1"`, `"0.37.2"` 추가만

| 작업 | 파일 | 공수 |
|------|------|------|
| bkit.config.json testedVersions 2개 추가 | `bkit.config.json` | 5분 |
| README/CHANGELOG compatibility 표기 v0.37.2 | `README.md`, `CHANGELOG.md` | 10분 |
| **합계** | **3 files** | **0.25h** |

| Aspect | Assessment |
|--------|-----------|
| **장점** | 최소 위험, 5분 완료. Breaking Change 0건이므로 엄밀히는 이것만으로 동작 |
| **단점** | ensureAgentsEnabled() 중복 쓰기 방치, isJITMode() 의미 부정확 방치, v0.38.0 대응 기반 없음 |
| **위험도** | 매우 낮음 |
| **품질 향상** | 거의 없음 -- 호환성 선언만 |
| **추천도** | 시간 극단 부족 시에만 |

### 2.2 Approach B': Balanced Enhancement (RECOMMENDED)

**범위**: A + v0.37.0+ 기능 플래그 8개 + ensureAgentsEnabled() 조건부 스킵 + isJITMode() 정확성 복원 + 테스트 보강

| 작업 | 파일 | 공수 |
|------|------|------|
| bkit.config.json testedVersions에 "0.37.1", "0.37.2" 추가 | `bkit.config.json` | 5분 |
| README/CHANGELOG compatibility 표기 v0.37.2 | `README.md`, `CHANGELOG.md` | 10분 |
| version.js v0.37.0+ 기능 플래그 8개 추가 | `lib/gemini/version.js` | 30분 |
| getBkitFeatureFlags() v0.37.0+ 매핑 4개 추가 | `lib/gemini/version.js` | 10분 |
| session-start.js ensureAgentsEnabled() v0.37.0+ 스킵 | `hooks/scripts/session-start.js` | 15분 |
| import-resolver.js isJITMode() v0.37.0+ false 반환 | `lib/gemini/import-resolver.js` | 15분 |
| tc105 기능 플래그 TC 추가 + tc111 기대값 업데이트 | `tests/suites/tc105-*.js`, `tc111-*.js` | 30분 |
| 기존 993+ TC 회귀 테스트 실행 (Zero Script QA) | 전체 | 15분 |
| **합계** | **6 files** | **2.4h** |

| Aspect | Assessment |
|--------|-----------|
| **장점** | 코드-실제동작 의미 정합성, 불필요 I/O 제거, 기능 플래그 확보, 테스트 보강, 최신 stable 선언 |
| **단점** | A 대비 +2.15h |
| **위험도** | 낮음 -- 조건부 분기만 추가 (기존 로직 비파괴) |
| **품질 향상** | 중간 -- 정합성 + 기반 + 테스트 커버리지 |
| **추천도** | **HIGH** -- 검증된 패턴의 6번째 적용 |

### 2.3 Approach C: Comprehensive + 6-Layer 리팩토링 + v0.38 선제 설계

**범위**: B' + Plan Mode modelRouting 통합 + memoryBoundaryMarkers + Project Memory Scope + Chapters PDCA + Secret Lockdown 문서화 + **ContextCompressionService preview 선제 인터페이스 설계**

| 작업 | 파일 | 공수 |
|------|------|------|
| B' 전체 작업 | (위 참조) | 2.4h |
| Plan Mode modelRouting before-model.js 통합 | `hooks/scripts/before-model.js` | 2h |
| memoryBoundaryMarkers 활용 가이드 | 문서 | 1h |
| Project Memory Scope 연계 설계 | `bkit.config.json` + 문서 | 1h |
| Chapters PDCA 연동 설계 | `hooks/scripts/after-agent.js` | 1.5h |
| Secret Lockdown SKILL.md 문서화 | `skills/bkend-security/SKILL.md` | 0.5h |
| **ContextCompressionService preview 선제 인터페이스** | `lib/gemini/context-fork.js` + 신규 어댑터 | 3-4h |
| 추가 테스트 | tests/ | 1.5h |
| **합계** | **12+ files** | **13-14h** |

| Aspect | Assessment |
|--------|-----------|
| **장점** | v0.37.0 기능 최대 활용, v0.38.0 선제 대응 |
| **단점** | 5-6배 작업량, ContextCompressionService API는 preview(미확정). **선제 설계 = 추측 코드(No Guessing 위반)** |
| **위험도** | 중간-높음 -- preview API 변경 시 재작업, 검증되지 않은 인터페이스 |
| **품질 향상** | 높음이지만 YAGNI 위반 다수 |
| **추천도** | LOW -- v0.38.0 stable 승격 후 별도 마이그레이션으로 분리 |

### 2.4 Evaluation Matrix

| 기준 (가중치) | A: Minimal (0.25h) | B': Balanced (2.4h) | C: Comprehensive (13-14h) |
|---------------|--------------------|---------------------|----------------------------|
| 위험도 (30%) | 10 (극소) | 9 (낮음) | 4 (preview 의존) |
| 작업량 (25%) | 10 (0.25h) | 8 (2.4h) | 2 (13h+) |
| 가치 창출 (25%) | 3 (선언만) | 7 (정합성+기반) | 9 (전면) |
| 장기 이점 (20%) | 3 (부채 방치) | 8 (v0.38 대비) | 9 (완전) |
| **가중 합계** | **6.70** | **8.05** | **5.50** |

### 2.5 Strategy Decision

**선택: Approach B' (Balanced Enhancement)** -- 가중 합계 8.05 (최고)

선택 근거:

1. **검증된 패턴의 6회 연속 적용**: Strategy B/B'는 v0.31.0, v0.35.0, v0.36.0(Phase1/Phase2), v0.37.1, v0.37.2까지 6번 연속 최고점을 기록. 메모리 피드백 `feedback_migration_pattern.md`의 "default to Strategy B" 지침 준수
2. **v0.37.2 = v0.37.1 상위 집합**: Impact 분석 결과 v0.37.2 단독 신규 코드 수정 요구 0건. 기존 v0.37.1 계획에 testedVersions `"0.37.2"` 엔트리 1개만 추가 (+0.1h)
3. **B' 변형 근거**: Breaking Change 0건이므로 "수정 + 선택적 채택" 대신 "검증 + 최적화 + 선택적 채택" 패턴
4. **YAGNI 준수**: C의 +11h 작업은 전부 현재 사용자 요구 없는 P2 기회 + preview 의존 선제 설계

---

## 3. YAGNI Review

### 3.1 Impact Analysis 12개 항목 채택/보류 판정

| # | 항목 | 공수 | 채택? | 근거 |
|---|------|------|-------|------|
| 1 | bkit.config.json testedVersions `0.37.1` + `0.37.2` | 5분 | **채택 P0** | 호환성 선언. 마이그레이션 기본 |
| 2 | README/CHANGELOG compatibility 갱신 | 10분 | **채택 P0** | 사용자 공지 필수 |
| 3 | version.js 기능 플래그 8개 | 30분 | **채택 P1** | 모든 조건부 분기의 전제. 검증된 패턴 |
| 4 | getBkitFeatureFlags() 확장 4개 | 10분 | **채택 P1** | 플래그 추가에 자연 수반 |
| 5 | ensureAgentsEnabled() v0.37.0+ 스킵 | 15분 | **채택 P1** | 불필요한 파일 I/O 제거, 의미 정합성 |
| 6 | isJITMode() v0.37.0+ false 반환 | 15분 | **채택 P1** | JIT 방어 코드 정확성 복원. 2줄 변경으로 고가치 |
| 7 | 테스트 추가 (TC-105 확장 + TC-111 갱신) | 30분 | **채택 P1** | 신규 플래그/최적화 검증 필수 |
| 8 | Plan Mode modelRouting before-model.js 통합 | 2h | **보류 P2** | 사용자 요구 없음. PDCA Plan 단계와 CLI Plan Mode 인터페이스 불명확. 별도 이니셔티브 |
| 9 | memoryBoundaryMarkers 활용 가이드 | 1h | **보류 P2** | monorepo 사용 사례 없음 |
| 10 | Project Memory Scope 연계 | 1h | **보류 P2** | 단일 프로젝트 운용 중 |
| 11 | Secret Lockdown SKILL.md 문서화 | 0.5h | **보류 P3** | v0.36.0 Phase 2에서 이미 sandbox notice 추가됨 |
| 12 | Chapters PDCA 연동 | 1.5h | **보류 P3** | Chapters는 UI 레벨 기능. bkit 훅 인터페이스 미확인 |
| 13 | **v0.37.2 신규: PDCA Report 표 스타일 강화** | 0.5h | **보류 P3** | 자동 수혜. 템플릿 변경 없이도 볼드/색상 적용됨 |
| 14 | **v0.38 선제: ContextCompressionService 어댑터** | 3-4h | **보류 (v0.38 stable 승격 시)** | preview API = No Guessing 위반 |

### 3.2 YAGNI Savings

| Category | Items | Effort |
|----------|-------|--------|
| 채택 (Wave 1-3) | 7 items | 2.4h |
| 보류 (P2/P3/v0.38) | 7 items | 9.5h |
| **Impact Analysis 추정 합계** | 14 items | ~12h |
| **YAGNI 절감률** | | **80%** |

---

## 4. Backwards Compatibility (하위 호환성)

### 4.1 v0.36.0 지원 유지

| 정책 | 결정 |
|------|------|
| `minGeminiCliVersion` | **`"0.34.0"` 유지** (변경 없음) |
| v0.36.0 사용자 정상 동작 | **보장** -- `isVersionAtLeast('0.37.0')` 가드로 v0.37.0+ 전용 분기만 스킵 |
| v0.36.0 테스트 (tc111) | **유지** -- 기존 TC 변경 없음, 신규 TC만 추가 |

### 4.2 하위 호환 검증 방법

1. `isVersionAtLeast('0.37.0')` 조건부 분기 모든 위치에서 false 브랜치 유지
2. tc111 (v0.36.0 enableAgents 테스트) 그대로 통과
3. v0.36.0 실제 환경에서 Zero Script QA 실행 (선택적)

---

## 5. Implementation Roadmap (구현 로드맵)

### Wave 1: Foundation (0.75h) -- P0 + P1 기반

| # | 작업 | 파일 | 공수 | 우선순위 |
|---|------|------|------|----------|
| 1.1 | bkit.config.json testedVersions에 `"0.37.1"`, `"0.37.2"` 추가 | `bkit.config.json` L120 | 5분 | P0 |
| 1.2 | README.md Gemini CLI compatibility 섹션 `v0.37.2` 업데이트 | `README.md` | 5분 | P0 |
| 1.3 | CHANGELOG.md v2.1.0 섹션에 v0.37.2 호환 표기 | `CHANGELOG.md` | 5분 | P0 |
| 1.4 | version.js 기능 플래그 8개 추가 | `lib/gemini/version.js` | 30분 | P1 |
| 1.5 | getBkitFeatureFlags() v0.37.0+ 매핑 4개 추가 | `lib/gemini/version.js` | 10분 | P1 |

**추가 플래그** (v0.37.1 계획과 동일):
- `hasPlanModeStable` (v0.37.0+)
- `hasPlanModelRouting` (v0.37.0+)
- `hasEnableAgentsDefaultTrue` (v0.37.0+)
- `hasJitContextDefaultFalse` (v0.37.0+)
- `hasMemoryBoundaryMarkers` (v0.37.0+)
- `hasProjectMemoryScope` (v0.37.0+)
- `hasChapters` (v0.37.0+)
- `hasSecretVisibilityLockdown` (v0.37.0+)

**bkit 플래그 매핑**: `canUsePlanModeStable`, `canUsePlanModelRouting`, `canUseMemoryBoundaryMarkers`, `canUseProjectMemoryScope`

### Wave 2: Optimization (0.5h) -- P1 정합성 복원

| # | 작업 | 파일 | 공수 | 우선순위 |
|---|------|------|------|----------|
| 2.1 | ensureAgentsEnabled() 내부에 `hasEnableAgentsDefaultTrue` early return 추가 | `hooks/scripts/session-start.js` L125-151 | 15분 | P1 |
| 2.2 | isJITMode() 내부에 `hasJitContextDefaultFalse` 시 false 반환 추가 | `lib/gemini/import-resolver.js` L26-58 | 15분 | P1 |

### Wave 3: Tests & QA (1h) -- P1 검증

| # | 작업 | 파일 | 공수 | 우선순위 |
|---|------|------|------|----------|
| 3.1 | tc105에 v0.37.0+ 기능 플래그 TC 추가 | `tests/suites/tc105-*.js` | 15분 | P1 |
| 3.2 | tc111 v0.37.0+ 스킵 조건 기대값 업데이트 | `tests/suites/tc111-*.js` | 15분 | P1 |
| 3.3 | Zero Script QA 회귀 (993+ TC) | 전체 | 15분 | P1 |
| 3.4 | v0.36.0 환경 회귀 검증 (선택) | 전체 | 15분 | P2 |

### Wave 4 (Deferred): P2/P3 기회 항목

보류 (별도 이니셔티브 또는 v0.38.0 stable 승격 시 재검토):
- Plan Mode modelRouting 통합 (2h)
- memoryBoundaryMarkers 가이드 (1h)
- Project Memory Scope 연계 (1h)
- Chapters PDCA 연동 (1.5h)
- Secret Lockdown 문서 강화 (0.5h)
- ContextCompressionService 어댑터 (3-4h, v0.38 stable 후)

### 총 공수

| Wave | 공수 | 누적 |
|------|------|------|
| Wave 1 | 0.75h | 0.75h |
| Wave 2 | 0.5h | 1.25h |
| Wave 3 | 1h | 2.25h |
| **Buffer (0.15h)** | | **2.4h** |

---

## 6. Risk Management Plan (위험 관리)

### 6.1 식별된 위험

| # | 위험 | 가능성 | 영향 | 완화 방안 |
|---|------|--------|------|-----------|
| R1 | `isVersionAtLeast('0.37.0')` 버전 비교 로직 오동작 | 낮음 | 중간 | tc105에서 v0.36.0/v0.37.0/v0.37.1/v0.37.2 모두 검증 |
| R2 | `ensureAgentsEnabled()` 스킵으로 CLI 기본값 미적용 | 매우 낮음 | 낮음 | v0.37.0+ CLI는 enableAgents=true가 default이므로 안전. 명시적 false 사용자는 스킵으로 존중됨 |
| R3 | `isJITMode()` false 반환이 pre-compress.js JIT 파셜 감지와 충돌 | 낮음 | 낮음 | pre-compress.js는 `isJITMode()`와 독립적으로 파일 존재만 확인 |
| R4 | tc111 기존 TC 회귀 | 낮음 | 중간 | 기대값만 갱신, 테스트 로직 불변 |
| R5 | v0.38.0 stable 조기 승격 시 본 계획 재작업 | 낮음 | 낮음 | v0.37.0+ 플래그는 v0.38에서도 재사용 가능 |

### 6.2 롤백 전략

1. **코드 롤백**: 모든 변경은 단일 commit으로 staging. `git revert` 한 번으로 전체 복원
2. **설정 롤백**: `bkit.config.json` testedVersions 원복 (단순 JSON 수정)
3. **하위 호환**: 조건부 분기(`if (isVersionAtLeast('0.37.0'))`)로 v0.36.0 사용자는 기존 경로 그대로 진입
4. **부분 롤백**: Wave 2만 롤백 시 Wave 1 플래그는 미사용 상태로 남지만 무해

### 6.3 테스트 전략 (Zero Script QA 연동)

| 단계 | 검증 | 방법 |
|------|------|------|
| 사전 | 현재 Zero Script QA baseline 확인 | `npm test` 전체 실행, 993/993 기록 |
| Wave 1 후 | 기능 플래그 단위 검증 | tc105 실행, 신규 TC PASS 확인 |
| Wave 2 후 | 최적화 분기 검증 | tc111 실행, v0.37.0+ 스킵 경로 PASS |
| Wave 3 | 전체 회귀 | Zero Script QA 993+ TC 실행, 0 회귀 확인 |
| 배포 전 | E2E PDCA 사이클 | `/plan-plus` -> `/build` -> `/report` 수동 실행, 마크다운 표 출력 시각 확인 |

---

## 7. bkit 철학 정합성 검증

| 원칙 | 검증 |
|------|------|
| **Automation First** | version.js 플래그 기반 자동 분기 -> 자동화 강화 |
| **No Guessing** | preview API(ContextCompressionService) 선제 코드 거부. `=== undefined` 사용자 존중 패턴 유지 |
| **Docs = Code** | PDCA 문서 경로 불변. 마크다운 표 렌더링 품질 향상으로 Docs 가독성 미세 향상 |
| **AI as Partner** | 에이전트 활성화 기본값 + UI 개선으로 AI 출력 품질 향상 |
| **YAGNI** | 80% 절감률. 7개 P2/P3 항목 모두 보류 |

---

## 8. Success Metrics (성공 지표)

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| Breaking Change 회귀 | 0건 | Zero Script QA 993/993 통과 |
| 불필요 settings.json 쓰기 | v0.37.0+ 환경에서 0회 | session-start.js 로그 확인 |
| isJITMode() 정확성 | v0.37.0+ 환경에서 false 반환 | tc105 신규 TC PASS |
| v0.37.2 호환성 선언 | testedVersions에 0.37.1, 0.37.2 포함 | bkit.config.json 확인 |
| 기능 플래그 확보 | 8개 v0.37.0+ 플래그 + 4개 bkit 매핑 | version.js grep 확인 |
| 하위 호환 (v0.36.0) | 전체 테스트 통과 | v0.36.0 환경 회귀 (선택) |
| 총 공수 | <= 2.4h | 실 작업 시간 로그 |

---

## 9. v0.37.1 계획과의 Delta

| 항목 | v0.37.1 계획 | v0.37.2 계획 | Delta |
|------|--------------|--------------|-------|
| Target | v0.37.1 | v0.37.2 | +패치 |
| 총 공수 | 2.3h | 2.4h | +0.1h |
| testedVersions 엔트리 | `0.37.1` 추가 | `0.37.1` + `0.37.2` 추가 | +1 |
| Wave 수 | 3 | 3 | 0 |
| 영향 파일 | 5 | 6 (README/CHANGELOG 명시) | +1 |
| YAGNI 절감률 | 71% | 80% | +9%p |
| 보류 항목 | 6 | 7 (PDCA 표 스타일 강화 추가 보류) | +1 |

**결론**: v0.37.2 계획은 v0.37.1 계획의 상위 집합(Superset). v0.37.1 계획을 폐기하고 본 계획으로 통합 실행한다.

---

## 10. References

- Research: `docs/01-plan/research/gemini-cli-v0.37.2-research.md`
- Impact Analysis: `docs/03-analysis/gemini-cli-v0.37.2-impact.analysis.md`
- Prior Plan: `docs/01-plan/features/gemini-cli-v0.37.1-migration.plan.md` (본 계획이 대체)
- v0.36.0 Phase 2: `docs/01-plan/features/gemini-cli-v036-migration.plan.md`
- Strategy B Pattern: `.claude/agent-memory/migration-strategist/feedback_migration_pattern.md`
- v0.37.2 Release: https://github.com/google-gemini/gemini-cli/releases/tag/v0.37.2
- Cherry-pick PR: https://github.com/google-gemini/gemini-cli/pull/25322

---

*Plan 작성 완료: 2026-04-14 | 승인 대기*
