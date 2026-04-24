# Gemini CLI v0.38.1 Migration Plan -- bkit v2.0.4 (Incremental Hotfix)

> **Feature**: gemini-cli-v0381-migration
> **Version**: bkit v2.0.4
> **Created**: 2026-04-17
> **Status**: Draft
> **Strategy**: **A' (Spot Validation)** -- v0.38.0 플랜에 in-place delta 주입
> **Migration Scope**: v0.38.0 -> v0.38.1 (Patch, Plan Mode silent fallback 단일 핫픽스)
> **Delta Scope**: v0.38.0 -> v0.38.1 (cherry-pick 1 + release chore 1, ~13 files)
> **Research**: [gemini-cli-v0.38.1-research.md](../research/gemini-cli-v0.38.1-research.md)
> **Impact Analysis**: [gemini-cli-v0.38.1-impact.analysis.md](../../03-analysis/gemini-cli-v0.38.1-impact.analysis.md)
> **Parent Plan (active)**: [gemini-cli-v0.38.0-migration.plan.md](gemini-cli-v0.38.0-migration.plan.md) -- v0.38.1은 target swap delta로 흡수

---

## Executive Summary

| Item | Content |
|------|---------|
| Target Version | **v0.38.1 Stable** (2026-04-15, Plan Mode silent fallback 핫픽스) |
| Breaking Changes (증분) | **0건** |
| Critical/High/Medium Impact | **0 / 0 / 0** |
| Low Impact | **2건** (검증/모니터링 권장, 수정 불필요) |
| 새 기능 (증분) | **1건** (Plan Mode silent fallback, hang 방지) |
| Deprecation (증분) | **0건** |
| 기능 개선 기회 | **+1건** (BeforeModel × Plan Mode E2E 테스트, v2.1.x 연계) |
| Recommended Strategy | **Approach A' (Spot Validation)** -- v0.38.0 plan에 in-place delta swap + BeforeModel×Plan Mode spot 검증 |
| Estimated Effort | **0.5h** (증분 단독 기준, v0.38.0 plan 미실행 시 7.5h + 0.1h 통합) |
| Wave Structure | 2 Waves (Version swap -> Spot validation) |
| Affected Files | **1개** (`bkit.config.json` testedVersions 문자열 1개 추가) |
| YAGNI Savings | **~95%** (naive C 전략 10h+ -> A' 0.5h) |

**TL;DR**: v0.38.1은 단일 핫픽스로 bkit 직접 영향 0건. v0.38.0 마이그레이션 플랜의 target version을 `v0.38.1`로 in-place swap하는 것이 가장 효율적. 별도 신규 구현 없이 `bkit.config.json` testedVersions에 문자열 1개 추가 + BeforeModel×Plan Mode 상호작용 spot 검증만 수행.

---

## 1. Background (배경) / v0.38.1 한 줄 요약

> **"Plan Mode가 Pro 모델 불가 시 조용히 Flash로 fallback하여 15분+ hang 방지"** -- 단일 cherry-pick 핫픽스 (PR #25317 -> #25466).

### 1.1 릴리스 컨텍스트

- 릴리스 일시: 2026-04-15 17:56 UTC (v0.38.0 릴리스 다음날)
- 커밋 수: 2개 (cherry-pick 1 + release chore 1)
- 변경 표면: `packages/core/src/availability/policyHelpers.ts` + `policyCatalog.ts` (core 내부 정책 해석 경로)
- 원본 이슈: #25110 (Windows CLI v0.36.0 사용자 보고, Plan Mode에서 15분+ hang)

### 1.2 왜 "증분 플랜"을 별도 작성하는가

v0.38.0 플랜이 아직 Draft이며 Do phase 미실행 상태. 본 문서는 **v0.38.0 플랜과 병합**되어야 할 증분 사항을 명시하고, v0.38.0 플랜이 이미 실행된 후 v0.38.1로만 넘어갈 때 필요한 **최소 작업**을 별도로 기록하는 이중 목적의 델타 플랜이다.

---

## 2. Intent & Goals (의도 & 목표)

### 2.1 핵심 질문 판정

| 질문 | 판정 | 근거 |
|------|------|------|
| 단순 호환성 유지? | **주로 예** | Breaking 0, 새 설정 0, Deprecation 0 |
| 기능 고도화? | **아님** | bkit이 `ApprovalMode.PLAN`을 사용하지 않아 silent fallback이 런타임 경로로 진입하지 않음 |
| 아키텍처 개선? | **아님** | 순수 단일 버그 수정 |

### 2.2 목표

1. **최신 stable 추종**: npm `latest` tag가 v0.38.1로 교체된 상태. 호환성 선언 업데이트
2. **잠재 상호작용 방어 검증**: bkit의 `BeforeModel` 훅과 신규 silent fallback 메커니즘의 우선순위를 사전 조사 (현재 미충돌, v2.1.x 구현 시 재검증)
3. **과잉 설계 회피**: 핫픽스 특성상 대규모 신규 구현/재설계 금지

### 2.3 시간/리소스 제약

| 항목 | 상태 |
|------|------|
| v0.38.1 stable 경과 | 2일 (2026-04-15 -> 2026-04-17) |
| Critical Breaking Change | 0건 |
| 긴급도 | **낮음** |
| v0.38.0 플랜 상태 | Draft, Do phase 미실행 -> **흡수 가능** |

---

## 3. Strategy Alternatives (대안 비교 매트릭스)

### 3.1 Approach A: No-Op 수용 (버전 라벨만)

**범위**: 버전 표시만 v0.38.1로 상향, E2E 검증 없이 머지.

| 작업 | 파일 | 공수 |
|------|------|------|
| `bkit.config.json` testedVersions에 `"0.38.1"` 추가 | `bkit.config.json` | 5분 |
| **합계** | **1 file** | **~5분** |

| 장점 | 단점 | 리스크 | 추천도 | 예상 시간 |
|------|------|--------|--------|-----------|
| 최소 비용, 핫픽스 정신에 부합 | BeforeModel × Plan Mode 상호작용 미검증 → v2.1.x 구현 시 snag 발생 시 원인 추적 시간 증가 | **매우 낮음** (bkit은 `ApprovalMode.PLAN` 미사용) | **Medium** -- 리스크가 극소하여 수용 가능하나, 미세한 안전망을 스킵 | **0.1h** |

### 3.2 Approach A' / B: Spot Validation (RECOMMENDED)

**범위**: A + BeforeModel × Plan Mode 상호작용 1~2건 spot 검증 + 문서 델타 각주.

| 작업 | 파일 | 공수 |
|------|------|------|
| `bkit.config.json` testedVersions에 `"0.38.1"` 추가 | `bkit.config.json` | 5분 |
| BeforeModel × Plan Mode 상호작용 spot 검증 (이론/코드 리뷰, v2.1.x E2E 구현 전까지 문서화 수준) | `hooks/scripts/before-model.js` 리뷰 + `docs/` 각주 | 15분 |
| v0.38.0 플랜 각주 추가 ("v0.38.1 delta: Plan Mode silent fallback cherry-pick only") | `docs/01-plan/features/gemini-cli-v0.38.0-migration.plan.md` | 5분 |
| 기존 993/993 테스트 smoke (v0.38.1 설치 후 `npm test`) | 전체 | 5분 |
| **합계** | **2 files 수정, 1 file 각주** | **~0.5h** |

| 장점 | 단점 | 리스크 | 추천도 | 예상 시간 |
|------|------|--------|--------|-----------|
| 최소 비용에 안전망 확보. v2.1.x BeforeModel E2E 구현 시 사전 조사 자료 확보. YAGNI 원칙 부합 | A 대비 +0.4h (의미 있는 추가) | **매우 낮음** | **HIGH** -- 패치 핫픽스에 최적. `feedback_migration_pattern.md`의 "핫픽스엔 과잉 절차 금지" 정신에 부합 | **0.5h** |

> Note: 본 전략은 Strategy B의 "Feature Gate + 선택 채택" 정신을 패치 규모에 맞게 축소한 변종이므로 **A'**(A-prime)으로 표기. B의 큰 골격(플래그 먼저, 선택 채택)은 유지하되 패치 성격상 **Feature Gate 0개, 선택 채택 0개**로 축소된다.

### 3.3 Approach C: 기능 고도화 결합

**범위**: A' + v2.1.x 예정된 BeforeModel `llm_request.model` override를 이번 패치에 앞당겨 구현 + Plan Mode fallback 우선순위 설계 문서 작성 + E2E 테스트 확보.

| 작업 | 파일 | 공수 |
|------|------|------|
| A' 전체 작업 | (위 참조) | 0.5h |
| BeforeModel E2E 모델 오버라이드 구현 (v0.38.0 플랜의 Wave 2.2와 동일) | `hooks/scripts/before-model.js` | 3h |
| Plan Mode silent fallback vs BeforeModel override 우선순위 설계 문서 | `docs/02-design/` | 2h |
| E2E 테스트 작성 (Plan Mode 진입 + Pro 미가용 시뮬레이션 + Flash fallback 관찰) | `tests/` | 2-3h |
| 문서화/리뷰 | `docs/` | 1h |
| **합계** | **5+ files** | **~8-10h** |

| 장점 | 단점 | 리스크 | 추천도 | 예상 시간 |
|------|------|--------|--------|-----------|
| v2.1.x 로드맵 선제 확보 | **v0.38.0 플랜의 Wave 2.2(BeforeModel E2E, 3h)와 직접 중복** -- v0.38.0 플랜 미실행 상태에서 여기에 이식하면 플랜 경계가 흐려짐. v0.38.0 플랜이 실행되면 이 작업은 이미 수행됨 -> 중복 | 중간 -- 플랜 경계 혼선, YAGNI 위반 | **Low** -- v0.38.0 플랜의 Wave 2에 이미 계획된 작업을 v0.38.1 핫픽스 플랜으로 당기는 것은 범위 크리프 | **1~2일 (8-10h)** |

### 3.4 Evaluation Matrix

| 기준 (가중치) | A: No-Op (0.1h) | **A': Spot Validation (0.5h)** | C: Comprehensive (8-10h) |
|---------------|------------------|-------------------------------|---------------------------|
| 위험도 (30%) | 10 (극소) | 10 (극소) | 6 (범위 크리프) |
| 작업량 (25%) | 10 (0.1h) | 9 (0.5h) | 2 (9h) |
| 가치 창출 (25%) | 4 (버전 라벨만) | 7 (사전 조사 + 문서 각주) | 9 (E2E 선제 확보) |
| 장기 이점 (20%) | 5 (변화 없음) | 8 (v2.1.x 준비) | 9 (완료) |
| **가중 합계** | **7.55** | **8.70** | **6.20** |

### 3.5 Strategy Decision

**선택: Approach A' (Spot Validation)** -- 가중 합계 8.70 (최고)

선택 근거:

1. **핫픽스 성격**: v0.38.1은 단일 cherry-pick이며 bkit 계약에 영향 0. 대규모 구현은 불필요한 범위 크리프
2. **A' vs A**: +0.4h 투자로 BeforeModel × Plan Mode 상호작용 사전 조사 + v0.38.0 플랜 델타 각주 확보. ROI 높음
3. **C 탈락 근거**: C의 BeforeModel E2E 구현 3h는 v0.38.0 플랜 Wave 2.2와 **완전 중복**. v0.38.0 플랜이 정석적으로 실행되면 자연 수행되므로, 여기서 당겨 구현할 이유가 없음. YAGNI 위반
4. **feedback_migration_pattern.md 준수**: "핫픽스엔 과잉 절차 금지" 원칙에 부합. Strategy B 패턴을 패치 규모로 축소한 A' 변종 적용

---

## 4. YAGNI Review (YAGNI 리뷰 결과)

### 4.1 채택/보류 판정

| # | 항목 | 공수 | 채택? | 근거 |
|---|------|------|-------|------|
| 1 | `bkit.config.json` testedVersions에 `"0.38.1"` 추가 | 5분 | **채택 P0** | 호환성 선언 필수. v0.38.0 플랜 Wave 1.1에 이미 포함되어 있다면 자연 흡수 |
| 2 | BeforeModel × Plan Mode 상호작용 이론 검증 + 각주 | 15분 | **채택 P1** | v2.1.x BeforeModel E2E 구현 시 사전 조사 자료로 활용. 실제 코드 변경 없음 |
| 3 | v0.38.0 플랜에 "v0.38.1 delta" 각주 추가 | 5분 | **채택 P1** | 문서 일관성, Docs = Code 원칙 |
| 4 | 993/993 테스트 smoke (v0.38.1 설치 후) | 5분 | **채택 P1** | 계약 무변경 가정 검증 |
| 5 | BeforeModel E2E 모델 오버라이드 구현 (Plan Mode 대응 포함) | 3h | **보류** | v0.38.0 플랜 Wave 2.2와 중복. 해당 플랜에서 수행 |
| 6 | Plan Mode silent fallback 우선순위 설계 문서 | 2h | **보류** | v2.1.x context-optimization 플랜으로 이관 |
| 7 | E2E 테스트: Plan Mode + Pro 미가용 시뮬레이션 | 2-3h | **보류** | v0.38.0 Wave 3.4 "BeforeModel E2E 반환값 검증" 신규 TC에 Plan Mode 시나리오 1건 추가 형태로 흡수 (v0.38.0 플랜 실행 시) |
| 8 | Plan Mode 사용 여부 bkit 정책 재점검 | 30분 | **보류** | Impact §3에서 이미 `permissionMode`/`approvalMode` 미사용 확정. 재검증 불필요 |
| 9 | `version.js`에 `hasPlanModeSilentFallback` 플래그 추가 | 15분 | **보류** | v0.38.0 플래그가 v0.38.1 동작을 포괄 (v0.38.0에서 Plan Mode 동작 기본). bkit이 분기할 사용처 없음 -> YAGNI |
| 10 | `hooksConfig.showOutput` / BeforeModel E2E 구현 등 v0.38.0 P0 기회 | 3.5h | **보류** | v0.38.0 플랜의 Wave 2가 담당 |

### 4.2 YAGNI 체크리스트

- [x] "있으면 좋을 것 같은" 기능 제외: `hasPlanModeSilentFallback` 플래그(분기 사용처 없음), E2E 테스트 선제 작성(v0.38.0 플랜에서 자연 수반), 우선순위 설계 문서 선제 작성(v2.1.x 이관)
- [x] 현재 사용자가 실제로 필요: 버전 호환성 선언, BeforeModel × Plan Mode 사전 조사 문서화(v2.1.x 선행 자료)
- [x] bkit 철학 부합: `No Guessing`(silent fallback이 bkit의 질문 원칙과 미묘한 긴장 -> 각주로 명시), `Docs = Code`(v0.38.0 플랜에 델타 각주 반영)
- [x] 유지보수 비용 대비 가치 충분: 0.5h 투자로 최신 stable 추종 + 사전 조사 확보
- [x] 이전 마이그레이션 불필요 패턴 미반복: 대규모 C 전략 패턴 거부

### 4.3 YAGNI Savings

| Category | Items | Effort |
|----------|-------|--------|
| 채택 (Wave 1-2) | 4 items | 0.5h |
| 보류 (v0.38.0 플랜/v2.1.x 이관) | 6 items | 8-10h |
| **Naive 추정 합계 (C 전략)** | 10 items | ~8.5-10.5h |
| **YAGNI 절감률** | | **~95%** |

---

## 5. Recommended Strategy + Rationale (권장 전략 & 근거)

**Strategy A' (Spot Validation)** -- 0.5h, 2 Waves, 1 file 수정 + 1 file 각주

### 5.1 핵심 근거

1. **핫픽스는 핫픽스답게**: v0.38.1은 Plan Mode hang을 막는 단일 패치. bkit은 Plan Mode 미사용이므로 런타임 영향 0. 과잉 대응은 신호/잡음비 악화
2. **v0.38.0 플랜 흡수 전략**: v0.38.0 plan의 target version만 `v0.38.1`로 in-place swap하면 자연 커버. 별도 신규 구현 0
3. **v2.1.x 연계 준비**: BeforeModel × Plan Mode 상호작용을 미리 메모해 두면 v2.1.x BeforeModel E2E 구현 시 "어떤 시나리오를 테스트해야 하는가"를 고민할 필요가 없어짐
4. **롤백 초간단**: 단일 파일 1-line 수정 + 문서 각주 -> `git revert` 수준

### 5.2 하위 호환

- v0.38.0은 계속 지원: `minGeminiCliVersion: "0.34.0"` 유지
- v0.38.0과 v0.38.1은 계약 동등: `testedVersions`에 `"0.38.0"`, `"0.38.1"` 모두 포함
- 롤백 시나리오: 사용자가 v0.38.1에서 문제 발견 시 v0.38.0 재설치 가능 (bkit 측 코드 변경 0)

---

## 6. Implementation Roadmap (구현 로드맵)

### Wave 1: Version Swap & Docs Delta (0.3h)

| # | 작업 | 파일 | 공수 | 우선순위 |
|---|------|------|------|----------|
| 1.1 | `bkit.config.json`의 `compatibility.testedVersions`에 `"0.38.1"` 추가 | `bkit.config.json` L120 | 5분 | P0 |
| 1.2 | v0.38.0 플랜 각주 추가: "Target Version swap: v0.38.0 -> v0.38.1 (Plan Mode silent fallback cherry-pick, 동작 변경 없음)" | `docs/01-plan/features/gemini-cli-v0.38.0-migration.plan.md` L20 | 5분 | P1 |
| 1.3 | v0.38.0 플랜 References 섹션에 v0.38.1 research/impact 링크 추가 | 동일 | 5분 | P1 |

**1.1 상세**:

v0.38.0 플랜의 Wave 1.1이 `"0.37.1", "0.37.2", "0.38.0", "0.38.1"` 네 개를 이미 포함하므로, **v0.38.0 플랜이 아직 실행되지 않았다면 이 작업은 흡수됨**. 플랜이 이미 실행 완료된 경우에만 문자열 1개를 추가하는 형태로 0.1h 작업.

### Wave 2: Spot Validation & Smoke Test (0.2h)

| # | 작업 | 파일 | 공수 | 우선순위 |
|---|------|------|------|----------|
| 2.1 | BeforeModel × Plan Mode 상호작용 이론 검증 (코드 리뷰) + 한 줄 주석 각주 | `hooks/scripts/before-model.js` 상단 주석 | 10분 | P1 |
| 2.2 | v0.38.1 설치 후 기존 993/993 테스트 smoke (`npm test`) | 전체 | 5분 | P1 |

**2.1 상세**:

`hooks/scripts/before-model.js` 상단 주석에 다음 각주를 추가 (4~5줄):

```
// NOTE (v0.38.1+, 2026-04-17):
// Gemini CLI v0.38.1에서 Plan Mode 진입 시 model policy chain이 silent로 override됨.
// 현재 bkit은 ApprovalMode.PLAN 미사용 -> 런타임 충돌 없음.
// v2.1.x BeforeModel E2E 구현 시 {llm_request.model} 반환값이 Plan Mode
// silent fallback보다 우선하는지 E2E 테스트로 검증 필요 (see: v0.38.1 research §3.2).
```

**2.2 상세**: v0.38.1 npm 설치 -> `npm test` 실행 -> 993/993 green 확인. 실패 시 Wave 1 롤백.

### Wave 3 (Deferred): v0.38.0 플랜 / v2.1.x 이관 항목

v0.38.1 단독 스코프가 아닌 항목은 **각각의 상위 플랜으로 위임**:

- **v0.38.0 플랜 Wave 2** (hooksConfig.showOutput, BeforeModel E2E 모델 오버라이드): v0.38.0 플랜이 원래 계획대로 처리
- **v2.1.x context-optimization 플랜**: Plan Mode silent fallback vs BeforeModel override 우선순위 E2E 테스트 (2-3h)
- **v2.1.x**: BeforeModel × Plan Mode 시나리오 포함한 우선순위 설계 문서

### 총 공수

| Wave | 공수 | 누적 |
|------|------|------|
| Wave 1: Version Swap & Docs Delta | 0.3h | 0.3h |
| Wave 2: Spot Validation & Smoke Test | 0.2h | 0.5h |
| **Buffer** | 0h (단순 작업) | **0.5h** |

---

## 7. Risk Management & Rollback Plan (위험 관리 & 롤백 계획)

### 7.1 식별된 위험

| # | 위험 | 가능성 | 영향 | 완화 방안 |
|---|------|--------|------|-----------|
| R1 | v0.38.1 설치 시 기존 993 테스트에서 예상치 못한 회귀 | **매우 낮음** (계약 무변경) | 낮음 | Wave 2.2에서 전수 smoke. 실패 시 v0.38.0으로 롤백 |
| R2 | bkit 사용자가 수동으로 `/approval-mode plan` 토글 후 BeforeModel 훅을 통해 특정 모델 지정 | 매우 낮음 (사용자 주도 경로) | 낮음 | 각주로 문서화. v2.1.x E2E 구현 시 시나리오 추가 |
| R3 | `chain | undefined` null-check 누락 (Research §6.2 리뷰어 지적) -> 런타임 error 경로 | 낮음 | 중간 | bkit 측 완화 불가. Google upstream v0.38.2 추적. 이슈 발생 시 v0.38.0으로 롤백 옵션 유지 |
| R4 | v0.38.0 플랜이 아직 실행되지 않아 testedVersions 수정 충돌 | 낮음 | 매우 낮음 | v0.38.0 플랜이 이미 `"0.38.1"`를 포함하므로 흡수. 단독 실행 시만 문자열 추가 |

### 7.2 롤백 전략

1. **코드 롤백**: `git revert <commit>` -- 단일 커밋이므로 1분 내 복원
2. **패키지 롤백**: `npm install @google/gemini-cli@0.38.0` -- 계약 무변경이라 즉시 호환
3. **하위 호환**: `minGeminiCliVersion: "0.34.0"` 유지, `testedVersions`에 v0.38.0 병행 유지 -> 사용자 자율 선택 가능

### 7.3 롤백 의사결정 기준

| 상황 | 대응 |
|------|------|
| Wave 2.2 smoke 실패 (1건 이상) | 즉시 Wave 1 revert, v0.38.0 유지 |
| v0.38.1 upstream runtime error 발생 (R3) | v0.38.0 재pin, Google v0.38.2 릴리스 대기 |
| BeforeModel 상호작용 실제 snag 발견 (v2.1.x 구현 중) | v2.1.x 플랜 스코프로 이관, v0.38.1 플랜 자체는 유지 |

---

## 8. Validation Plan (검증 계획)

### 8.1 테스트 업데이트 범위

**Impact 분석의 "P1 E2E 1건" 판정**: v0.38.1 단독으로는 **추가 신규 테스트 없음**. v2.1.x BeforeModel E2E 구현 시 Plan Mode 시나리오 1건을 포함하는 것으로 이관.

| 영역 | v0.38.1 증분 테스트 | 비고 |
|------|---------------------|------|
| 기존 993/993 회귀 smoke | **실시** (Wave 2.2) | green 유지 확인 |
| BeforeModel 훅 단위 테스트 | 변경 없음 | 기존 형태 유지 |
| Plan Mode silent fallback 직접 테스트 | **미실시** | bkit이 Plan Mode 미사용 -> 테스트 범위 아님 |
| BeforeModel × Plan Mode E2E | **v2.1.x 이관** | E2E 인프라가 v2.1.x 구현 시 성숙하는 시점과 정합 |

### 8.2 QA 체크리스트

| 단계 | 검증 | 방법 | 합격 기준 |
|------|------|------|-----------|
| 사전 | v0.38.0 baseline | `gemini --version` 확인 | v0.38.0 또는 v0.38.1 설치 가능 |
| Wave 1 후 | testedVersions 반영 | `node -e "console.log(require('./bkit.config.json').compatibility.testedVersions)"` | `"0.38.1"` 포함 |
| Wave 2 후 | 회귀 smoke | `npm test` | 993/993 PASS (기존 grade 유지) |
| 수동 | PDCA 사이클 E2E | plan -> design 한 사이클 | hang/에러 없음 |
| 문서 | 각주 일관성 | v0.38.0 플랜 + before-model.js 주석 | 상호 참조 일치 |

### 8.3 문서 업데이트 범위

| 문서 | 수정 | 내용 |
|------|------|------|
| `docs/01-plan/features/gemini-cli-v0.38.0-migration.plan.md` | 각주 추가 | "v0.38.1 delta: Plan Mode silent fallback cherry-pick only, 동작 변경 없음" |
| `hooks/scripts/before-model.js` | 상단 주석 추가 | BeforeModel × Plan Mode 상호작용 메모 (Wave 2.1) |
| `docs/04-report/gemini-cli-v0.38.1-migration.report.md` (Do phase 후 생성) | 신규 | Do/Check/Act 결과 기록 |
| `docs/01-plan/research/gemini-cli-v0.38.1-research.md` | 수정 없음 | 이미 완료 |
| `docs/03-analysis/gemini-cli-v0.38.1-impact.analysis.md` | 수정 없음 | 이미 완료 |

### 8.4 성공 판정 기준

- [x] `bkit.config.json` testedVersions에 `"0.38.1"` 포함
- [x] 993/993 테스트 green 유지
- [x] `before-model.js` 주석에 v0.38.1 상호작용 메모 반영
- [x] v0.38.0 플랜에 v0.38.1 delta 각주 추가
- [x] 사용자 체감 기능 회귀 0건
- [x] 추가 신규 테스트 작성 0건 (YAGNI)

---

## References

- Research: `docs/01-plan/research/gemini-cli-v0.38.1-research.md`
- Impact Analysis: `docs/03-analysis/gemini-cli-v0.38.1-impact.analysis.md`
- Parent Plan: `docs/01-plan/features/gemini-cli-v0.38.0-migration.plan.md` (target swap + delta 각주 수행 대상)
- Strategy B Pattern: `.claude/agent-memory/migration-strategist/feedback_migration_pattern.md`
- v0.38.1 Release: https://github.com/google-gemini/gemini-cli/releases/tag/v0.38.1
- cherry-pick PR #25466: https://github.com/google-gemini/gemini-cli/pull/25466
- 원본 PR #25317: https://github.com/google-gemini/gemini-cli/pull/25317
- 원본 이슈 #25110: https://github.com/google-gemini/gemini-cli/issues/25110

---

*Plan 작성 완료: 2026-04-17 | 승인 대기*
*Strategy: A' (Spot Validation) -- 7th Strategy B family application, 패치 규모 축소 변종*
