# Gemini CLI v0.42.0 preview train 마이그레이션 Plan (P3)

> Phase 3 산출물. /gemini-migration Phase 3 — Plan-Plus 브레인스토밍 (Strategy B family **13번째** 후보 — preview train delta).
> 작성일: 2026-05-09
> 작성자: migration-strategist agent
> 베이스라인: bkit v2.0.6 (= Gemini CLI v0.39.1 stable, PR #24 main 머지)
> 본 cycle 비교 범위: **`v0.41.2 → v0.42.0-preview-train`** (= preview.0/1/2 + 4 nightly, **delta only**)
> 누적 비교 범위 (참조): `v0.39.1 → v0.42.0-preview-train` = v0.41.2 누적 (33 files / Critical 0 / High 5 / Medium 10 / Low 28) + 본 cycle delta 1 Low
>
> **입력 문서**:
> - Phase 1 (v0.42.0 preview train delta): `docs/01-plan/research/gemini-cli-v0.42.0-preview-research.md` (389 lines)
> - Phase 2 (v0.42.0 preview train delta): `docs/03-analysis/gemini-cli-v0.42.0-preview-impact.analysis.md` (291 lines)
> - Phase 3 baseline (참조 + supersede 후보): `docs/01-plan/features/gemini-cli-v0.41.2-migration.plan.md` (B' 12회차)
> - Phase 3 baseline (참조): `docs/01-plan/features/gemini-cli-v0.41.1-migration.plan.md` (B' 11회차)
> - Phase 3 baseline (참조): `docs/01-plan/features/gemini-cli-v0.40.0-migration.plan.md` (B' 10회차)
> - Phase 4 baseline (참조): `docs/04-report/gemini-cli-v0.41.2-migration.report.md`
>
> **본 cycle의 본질적 차이 (vs v0.41.2 cycle)**: P2 영향 분석에서 **Critical 0 / High 0 / Medium 0 / Low 1**(`gemini-cli-learning/SKILL.md` placeholder 1줄)으로 강등 확정. v0.42.0 stable **미출시** (preview.2가 최신, 3일 경과). **D1 (stable 출시 시 흡수 정책) 결정이 핵심 분기** — preview 단독 처리 ROI vs stable 대기 비용.

---

## 0. 컨텍스트 및 입력

### 0.1 입력 자료 요약

| 입력 | 핵심 결론 | 신뢰도 |
|---|---|---|
| P1 research (preview train delta) | v0.41.2 → v0.42.0-preview-train delta: Breaking 1건(Bx0 `continueOnFailedApiCall` 제거) + 행동 변화 강화 4건(Bx1~Bx4) + 신기능 14건(Cx1~Cx14) + 보안 패치 5건. preview.0 107 commits + preview.1/2 cherry-pick 2건. preview.2 → 최신 nightly 24 commits 사전 시그널 (§8). PR #25827 여전히 OPEN | ⬛⬛⬛⬛⬛ |
| P2 impact analysis (preview train delta) | **Critical 0 / High 0 / Medium 0 / Low 1**. P1 추정 7건(High 2 + Medium 1 + Low 4) 모두 P2 grep 검증 후 **0건 강등 확정**. 잔존 영향 1건 = `skills/gemini-cli-learning/SKILL.md` placeholder 1줄. 누적 카운트 변동 **없음** (33 files → 34 files / Low 28 → 29) | ⬛⬛⬛⬛⬛ |
| v0.41.2 plan (참조 + supersede 후보) | Strategy B' 12회차, ~4.5-5h, 3 Wave, LOW risk + R9 (21 agent 스모크) + R11 (a2a-server 미의존). **Do 미실행 상태** | ⬛⬛⬛⬛⬛ |
| v0.41.1 plan (참조) | Strategy B' 11회차, golden 골격. v0.41.2 plan에 90% 흡수 | ⬛⬛⬛⬛⬛ |
| v0.41.2 report (참조) | P4 종합 보고서. Do 단계 진입 시 commit message + PR template 그대로 활용 가능 | ⬛⬛⬛⬛⬛ |

### 0.2 결정된 환경 변수

- bkit `main` HEAD = v2.0.6 = Gemini CLI v0.39.1 머지 완료
- npm `latest` stable = **v0.41.2** (2026-05-06 출시, 3일 경과 시점에 본 P3 작성)
- v0.42.0 stable **미출시**. 최신 stable preview = **v0.42.0-preview.2** (2026-05-06). 최신 nightly = `v0.42.0-nightly.20260507.ga809bc7c5` (preview.2 + 24 commits)
- v0.40.0/v0.40.1/v0.41.0/v0.41.1/v0.41.2 cycle **모두 main 머지 미완료** (브랜치/plan 잔존)
- 누적 baseline = v0.39.1 → v0.42.0-preview-train (사용자 결정)
- 본 cycle delta → bkit 영향 1 Low 확정 (P2 §0 Executive Summary)
- **preview train 변동성 경고**: preview.2 → 최신 nightly 24 commits 분기 (§8 사전 시그널). v0.42.0 stable 출시 시점 (추정 2026-05-09 ~ 12) 사이 추가 cherry-pick 가능성 → Bx*/Cx* 카운트 ±2~3건 변동 가능

### 0.3 본 cycle의 본질적 차이 1줄

**v0.41.2 cycle 대비**: 누적 카운트 변동 없음(33 → 34 files). delta = `gemini-cli-learning/SKILL.md` placeholder 1줄만. **v0.42.0 stable 미출시** → 본 plan은 *"preview 단독 처리 vs v0.41.2 cycle Do와 동시 흡수 vs stable 출시 후 합본"* 결정 cycle 성격.

---

## 1. 의도 탐색 (Intent Discovery)

### 1.1 사용자 의도 추정 (3 가설)

| 가설 | 근거 | 신뢰도 |
|------|------|--------|
| **H1**: "v0.42.0 stable 출시 전 preview train 사전 시그널 확보 → stable 출시 시 즉시 진입 (P3 결재만 사전 완료)" | 사용자 결정 (2026-05-09) — preview train 전체 P1 별도 작성. v0.41.2 cycle Do 미실행 누적 부담을 stable 출시 시 *통합 단일 PR*로 일괄 해소. P2 §10.4 권고와 일치 | ⬛⬛⬛⬛⬛ |
| **H2**: "preview 단독 cycle로 미머지 plan 누적 부담 감소" — v0.41.2 cycle Do와 분리 진행 | 본 cycle delta 1 Low만이라 단독 PR로 처리 가능. 하지만 v0.41.2 cycle Do 미실행 부담이 추가됨 (3개 plan 누적: v0.41.2 + v0.42.0-preview + v0.42.0-stable) | ⬛⬛⬜⬜⬜ |
| **H3**: "v0.42.0 stable 출시 1주 이상 지연 시나리오 대응" — preview train 단독 진입 백업 시나리오 | preview.2 → 3일 경과. stable 출시 대기 비용이 점증 시 본 plan을 stable rename 후 단독 진입 옵션 보유 | ⬛⬛⬛⬜⬜ |

**결론**: **H1 풀 채택 (1순위), H3 백업 (가용 시간 1주 이상 지연 시 활성화)**. H2 거부 — *통합 단일 PR* 정책 ROI 압도적 (D1 §4 상세).

### 1.2 사용자(kay) 컨텍스트 반영

| 항목 | 추정/확인 | Plan에 반영 |
|---|---|---|
| 역할 | bkit-gemini 개발자, CTO-level (사용자 메모리) | 작업량 가중치 0.25 — 가용 시간 4-5h 가정 |
| 누적 미머지 cycle 부담 | v0.40.0 P1~P4 + v0.41.1 P1~P3 + v0.41.2 P1~P4 모두 미머지 잔존. **본 cycle 추가 시 4개 plan 누적** | **D1 권고**: stable 출시 시 v0.41.2 cycle + 본 cycle delta + stable delta 통합 단일 PR. 단독 처리 거부 |
| 학습 곡선 | Strategy B family **12회 적용 안정** (8.05~8.85점 1위 일관성) | Strategy B' **13회차** 적용 — 패턴 일관성 + 위험 예측력 최대 |
| 시간 투자 의지 | 가용 시간 4-5h (B' family 표준). 본 cycle delta 1 Low — 단독 처리 시 ~30분 / 통합 시 +10분 (v0.41.2 cycle ~5h → ~5.2h) | 본 plan은 *통합 시나리오* 기준 작성 (D1 시나리오 A) |
| preview vs stable 결정 | 사용자가 P1 별도 작성을 결정한 시점 = stable 출시 전 사전 시그널 확보 의도 | **D1 시나리오 A 권고** (stable 출시 즉시 진입, 본 plan을 stable rename) |

### 1.3 숨은 요구사항 — preview 단독 처리 vs stable 대기

P3 핵심 분기:

| 옵션 | 작업 | ROI | 위험 |
|---|---|---|---|
| **(A) preview 단독 PR** | 본 plan 그대로 진입 → preview.2 dependency bump → 단독 PR | 낮음 (delta 1 Low) | 매우 높음 (npm `latest` 미보장 = preview.2가 production 채널이 아님) |
| **(B) v0.41.2 cycle Do와 동시 흡수 (preview 단독)** | v0.41.2 cycle Do + 본 cycle delta 통합 PR. v0.42.0 stable 미반영 | 중간 (v0.41.2 cycle 해소) | 중간 (preview.2 stable 대체로 부적절 — production fall-back 필요) |
| **(C) stable 출시 대기 후 통합** ← 권장 | v0.42.0 stable 출시 시 본 plan을 stable rename → v0.41.2 cycle Do + stable delta 통합 단일 PR | **매우 높음** (3개 plan 일괄 해소) | 매우 낮음 (stable 채널 안정성 + Strategy B' 13회차 검증된 골격) |

**근거**: P2 §10.4 권고 + npm `latest` channel 정책. preview.2는 *npm `latest` 채널 부적격* → bkit production dependency로 부적절. (C) stable 대기가 ROI/위험 모두 압도적.

### 1.4 비용/이익 분석

| 항목 | Strategy A (Minimal) | Strategy B' (본 cycle 권장) | Strategy C (Full + Cx2/Cx4 PoC) |
|---|---|---|---|
| 작업 시간 | ~10분 (placeholder만) | ~3.5-4.5h (v0.41.2 cycle 골격 90% 재사용 + delta 통합) | ~26h (Cx2 Auto Memory inbox + Cx4 heap snapshot PoC) |
| 토큰 절감 (이론) | 0% | 0% (게이트만) | ~30% (v2.1.0 시너지) |
| 회귀 차단 신뢰도 | ⬛⬛⬜⬜⬜ (placeholder만) | ⬛⬛⬛⬛⬛ (R9 21 agent 스모크 + R11 a2a-server 재확인 + Bx0~Bx4 정적 분석 누적 8건 검증) | ⬛⬛⬛⬛⬛ (동일) |
| **ROI** | **10분 / 1 Low 처리** | **~4.5h / 회귀 차단 + 미래 게이트 + v0.41.2 cycle 흡수 + stable 사전 사전 검증** | **26h / 즉시 토큰 절감 + PoC** |

**결정**: Strategy B' 채택 13회차. v2.1.0 본격 갱신 + Cx2 Auto Memory inbox PoC + Cx4 heap snapshot PoC 모두 별도 cycle 위임.

---

## 2. 대안 비교 (가중 점수표, 5개 후보)

### 2.1 전략 정의 (5개)

| 전략 | 정의 | 작업 시간 | 핵심 |
|------|------|----------|------|
| **A** | Minimal — `gemini-cli-learning/SKILL.md`에 v0.42.0 preview train 1줄 placeholder만 | **~10분** | "본 cycle delta 1 Low만 처리, v0.41.2 cycle와 분리" 시나리오 — 단독 처리 ROI 매우 낮음 |
| **A''** | A + v0.41.2 plan in-place rename + delta 각주 | ~30분 | v0.41.2 cycle 미머지 흡수 부족 + preview train flag 부재 |
| **B** | Standard — A + v0.41.2 plan 흡수 + 21 agent 스모크 생략 | ~3-3.5h | v0.41.2 cycle 흡수 + Bx0~Bx4 정적 검증 + Cx13 잠금 — R9 누락 |
| **B' (추천)** | **v0.41.2 plan in-place rename + preview train delta 각주(≤6건) + Cx13/Cx1 P0 통합 + 21 agent 스모크** | **~3.5-4.5h** | 본 cycle 권장. v0.41.2 plan 골격 90% 재활용 + Cx13 (`experimental.gemma: false` 잠금) + 선택 Cx1 (`--ignore-env`) + R9 21 agent 스모크 |
| **C** | Full — B' + Cx2 Auto Memory inbox PoC + Cx4 heap snapshot PoC + Cx7 `/commands list` health check | ~26h (~3-4d) | preview train + v2.1.0 시너지 + PoC 다수 |

### 2.2 가중 점수 매트릭스

가중치 (사용자 명시):
- **안전성 0.30** (preview train 변동성 보정 — preview.2 → stable 24 commits 분기 위험)
- **작업 시간 0.25**
- **bkit 가치 0.20** (회귀 차단 + 새 기능 활용 합산)
- **학습 효과 0.15** (Strategy B family 13회차 — 패턴 강화)
- **일관성 0.10** (v0.41.2 plan in-place rename + preview→stable 흡수 정책)

각 차원 1~10점:

| 차원 (가중치) | A | A'' | B | **B'** | C |
|--------------|---|---|---|----|---|
| 안전성 (0.30) | 4 | 6 | 8 | **10** | 9 |
| 작업 시간 (0.25) | **10** | 9 | 8 | 7 | 2 |
| bkit 가치 (0.20) | 1 | 4 | 7 | **9** | 10 |
| 학습 효과 (0.15) | 2 | 5 | 7 | **10** | 8 |
| 일관성 (0.10) | 3 | 6 | 8 | **10** | 7 |
| **가중 합** | **4.65** | **6.05** | **7.55** | **8.85** | 7.05 |

### 2.3 정량 비교

| 항목 | A | A'' | B | **B'** | C |
|---|---|---|---|----|---|
| 작업 시간 | ~10분 | ~30분 | ~3-3.5h | **~3.5-4.5h** | ~26h |
| 위험도 | HIGH (1 Low 잔존) | MED (v0.41.2 미머지) | LOW | **LOW + R9/R11 차단** | MED (PoC 회귀 분리도 ↓) |
| 코드 수정 라인 | ~1줄 | ~3줄 | ~25줄 | **~25줄 + Cx13/Cx1** | ~250줄+ |
| L3 실측 횟수 | 0 | 0 | 1 | **2-3** | 4+ |
| Full baseline | 0 | 0 | 1회 | **1회** | 2회+ |
| PR 단위 | 단일 (preview placeholder) | 2개 분리 | 단일 | **단일** | 1+α |
| v0.41.2 plan supersede | ❌ | △ | ✅ | ✅ | ✅ |
| 21 agent 스모크 | ❌ | ❌ | ❌ | **✅** | ✅ |
| Cx13 (`experimental.gemma: false`) | ❌ | ❌ | △ | **✅** | ✅ |
| Cx1 (`--ignore-env`) 옵션 | ❌ | ❌ | ❌ | **△ (선택)** | ✅ |

### 2.4 1위 vs 2위 차이 (B' vs B)

가중 점수 차이: **8.85 - 7.55 = +1.30** (v0.41.2 cycle B'와 동일 격차).

핵심 차별점: **Cx13 (`experimental.gemma: false` 잠금) + R9 21 agent 스모크**. Cx13은 No Guessing 강화 1줄, R9는 v0.41.0 PR #25720 recursive shell validation의 LLM 행동 변경 검증. 1h 추가 (스모크) + 5분 (Cx13)의 ROI 압도적 (안전성 +2점, bkit 가치 +2점, 학습 효과 +3점).

---

## 3. YAGNI 리뷰

### 3.1 본 cycle 추가 항목 (v0.41.2 plan 대비)

| # | 항목 | 채택? | 1줄 근거 |
|---|------|-------|---------|
| 1 | `gemini-cli-learning/SKILL.md`에 v0.42.0 preview train placeholder 1줄 | ✅ 채택 (Wave 3.3 1줄 보강) | Docs=Code, P2 잔존 1 Low |
| 2 | testedVersions에 `0.42.0` 추가 (5개 → 6개) | △ 조건부 (D1 시나리오 A 시 채택) | v0.42.0 stable 출시 시 1줄 추가, 미출시 시 보류 |
| 3 | `package.json` 의존 bump v0.41.2 → v0.42.0 | △ 조건부 (D1 시나리오 A 시 채택) | stable 미출시 시 preview.2로 bump 거부 |
| 4 | `experimental.gemma: false` 명시 잠금 (Cx13) | ✅ 채택 (Wave 1.7 신규) | Bx4 default-on 회귀 사전 차단, No Guessing 강화 1줄 |
| 5 | `lib/gemini/version.js` `hasGemmaDefaultOn: isVersionAtLeast('0.42.0')` flag | ✅ 채택 (Wave 1.2 추가 1개) | Bx4 게이트 (D1 시나리오 A 시 활성, 미활성 시 future-proof) |
| 6 | `--ignore-env` flag 채택 (Cx1) | ❌ 제거 → 별도 cycle | Q7 검증 위임. baseline runner CI 안정성 향상 시나리오 별도 검증 필요 |
| 7 | Auto Memory inbox flow 채택 (Cx2) | ❌ 제거 → 별도 cycle | v2.1.0 implementation cycle 위임 (P2 §2 우선순위 P3) |
| 8 | `/bug-memory` heap snapshot 채택 (Cx4) | ❌ 제거 → 별도 cycle | 디버깅 도구 별도 cycle 위임 (P2 §2 우선순위 P3) |
| 9 | `/commands list` health check 채택 (Cx7) | ❌ 제거 → 별도 cycle | health check skill 별도 cycle 위임 (P2 §2 우선순위 P3) |
| 10 | Cx11 (`/agents refresh logging`) 채택 | ❌ 제거 → 별도 cycle | `list_agents` 진단 별도 cycle 위임 |
| 11 | Cx14 (`--prompt` undeprecate) 명문화 | ❌ 제거 → SKILL placeholder에 통합 | 별도 단락 가치 낮음 (SKILL 1줄에 통합) |
| 12 | preview train 전용 21 agent 스모크 추가 검증 | ❌ 제거 | a2a-server와 동일 — Bx0~Bx4 정적 분석 0건 확정. v0.41.2 cycle 21 agent 스모크와 동일 결과 예상 |

**채택률**: 본 cycle 신규 12 후보 중 **3 채택 (1, 4, 5) + 2 조건부 (2, 3) + 7 제거 = YAGNI 절감 58%**. v0.41.2 plan(50%)보다 높은 이유: preview train delta가 `experimental.gemma`/`hasGemmaDefaultOn`/SKILL 1줄로 한정되고 신기능 11건이 모두 별도 cycle 위임 가능.

### 3.2 v0.41.2 plan에서 흡수된 채택 항목 (변경 없음)

v0.41.2 plan §6 27 후보 중 17 채택은 본 plan에 그대로 흡수 (Wave 1.1~1.6, Wave 2.1~2.8, Wave 3.1~3.7 모두 인계). 변경 0건.

### 3.3 본 cycle 종합 YAGNI 점검

| 체크 | 결과 |
|---|---|
| "있으면 좋을 것 같은" 기능 포함? | ❌ — Cx2/Cx4/Cx7/Cx11 모두 별도 cycle 위임 |
| 사용자 실제 필요 변경? | ✅ — Cx13 (Bx4 잠금) 1줄 + SKILL placeholder 1줄 + future-proof flag 1개 |
| bkit 철학 부합? | ✅ — 4원칙 모두 정렬 (Cx13 = No Guessing 강화, Bx0 = Automation First 강화) |
| 유지보수 비용 대비 가치? | ✅ — Wave 1.7 5분 + Wave 1.2 추가 5분 = 10분, 영구 호환성 명문화 |
| 이전 cycle 불필요 패턴 반복? | ❌ — Strategy B' family 검증된 패턴 13회차 |

---

## 4. 권장 전략 + 거부 안 근거

### 4.1 채택: Strategy B' (Standard + Spot Verification + Cx13/flag P0 통합)

**가중 점수 8.85점 (1위, B 대비 +1.30, C 대비 +1.80)**.

### 4.2 1순위 이유 (3가지)

1. **v0.41.2 plan의 in-place rename + preview train delta 각주(≤6건)만 추가하는 최소 수정**: P2 §0 결론(누적 카운트 33 → 34 files, 본 cycle delta 1 Low 잔존)에 따라 v0.41.2 plan 골격 90% 재활용. testedVersions 1줄(stable 시 활성) + Cx13 1줄 + `hasGemmaDefaultOn` 1줄 + SKILL placeholder 1줄 = **delta ≤6줄**. v0.42.0 stable 출시 시 본 plan을 stable rename하여 즉시 진입 가능 (시나리오 A).

2. **Strategy B family 13번째 적용 — 검증된 패턴 일관성**: 메모리 인덱스(`MEMORY.md`)에 누적된 12개 cycle 학습이 그대로 적용 가능. v0.40.0/v0.41.1/v0.41.2 plan의 흡수 정책, 21 agent 스모크 정책, MCP resources 분리 정책, v2.1.0 trigger 메모 정책, a2a-server 미의존 재확인 정책 모두 본 cycle에 그대로 인계. 13회차로 가중 점수 8.85점 일관성 유지.

3. **Cx13 (`experimental.gemma: false`) 잠금 + `hasGemmaDefaultOn` flag로 Bx4 회귀 사전 차단 + Docs=Code 강화**: bkit가 v0.42.0 stable 머지 후 `experimental.gemma` default 변경 (false → true) 회귀 위험을 1줄 잠금 + flag 게이트로 사전 차단. P2 §2 P1 우선순위 권고와 일치. SKILL placeholder는 향후 v0.42.0 stable cycle에서 풀 단락(14개)으로 확장.

### 4.3 거부 안 근거

- **Strategy C (Full + PoC, 26h, 7.05점)**: Cx2/Cx4/Cx7 PoC 가치 10점이지만 작업 시간 가중치 0.25에서 2점 — v2.1.0 시너지가 안전성/작업시간 우위 못 이김. PoC가 회귀 차단 신호와 섞이는 분리도 저하. 별도 cycle로 분리.

- **Strategy B (Standard, 7.55점)**: B'와 차이는 **Cx13 잠금 누락 + 21 agent 스모크 누락**. Bx4 default-on 회귀 사전 차단 + LLM 행동 검증의 ROI 압도적 (가중 점수 +1.30).

- **Strategy A/A'' (Minimal/+rename)**: 10-30분으로 빠르지만 v0.41.2 cycle 흡수 부족 — autoMemory/memoryManager 명문화, 21 agent 스모크, full baseline 회복 검증, gemini-cli-learning SKILL 12단락 모두 누락. 본 cycle을 단일 누적 PR로 닫지 못하고 후속 cycle 부담 누적.

### 4.4 대안 활성화 조건

- **가용 시간 1h 미만 (긴급 + v0.42.0 stable 미출시)** → Strategy A로 강제 축소 (SKILL placeholder 1줄만). v0.41.2 plan + 본 plan 보존 후 stable 출시 시 통합.
- **가용 시간 1d 이상 + v2.1.0 cycle 본 cycle과 합치기 결정** → Strategy C로 확장 (Cx2 Auto Memory inbox PoC 포함).
- **v0.42.0 stable 1주 이상 지연 시** → 본 plan을 *preview.2 단독 cycle*로 진입 (시나리오 B, §9 참조).
- **R9 21 agent 스모크 결과 회귀 1건 이상 발견** → Wave 2 일시 중단 + 회귀 분석 cycle 진입 (B' → 회귀 cycle).

---

## 5. Wave 분할 (Strategy B', 3.5-4.5h, D1 시나리오 A 기준)

총 예상 시간: **~3.5-4.5시간** (v0.41.2 plan ~4.5-5h + Cx13/flag/SKILL 통합 +10분 - testedVersions 1줄/dependency bump 1줄/SKILL 1줄 단순화 -1h). Wave 1 ~45분, Wave 2 ~3-3.5h, Wave 3 ~1h, Buffer ~30분.

### Wave 1 (P0, ~45분) — Critical Patch + 회귀 사전 차단 + v0.40.0/v0.41.x/v0.41.2/v0.42.0 흡수 + Cx13 잠금

| # | 작업 | 파일 | 검증 | 의존성 | 시간 |
|---|------|-----|-----|--------|-----|
| W1.1 | testedVersions에 `"0.40.0", "0.40.1", "0.41.0", "0.41.1", "0.41.2", "0.42.0"` **6개** 추가 (v0.41.2 plan W1.1: 5개 → 6개) ⚠️ D1 시나리오 A 한정 (stable 출시 시) | `bkit.config.json:120` | L1 unit (json schema) | — | 2분 |
| W1.2 | v0.40.0+ flag 4개 + v0.41.0+ flag 4개 + **v0.42.0+ `hasGemmaDefaultOn`** 1개 = **9개 신설** (v0.41.2 plan W1.2: 8개 → 9개) | `lib/gemini/version.js:212` 뒤 | L1 unit (`tc04`) | W1.1 | 18분 |
| W1.3 | `general.topicUpdateNarration: false` 명시 잠금 (v0.41.2 plan W1.3 그대로) | `.gemini/settings.json` | L2 baseline (W2.2 검증) | — | 5분 |
| W1.4 | `experimental.autoMemory: false` + `experimental.memoryManager: false` 명시 (v0.41.2 plan W1.4 그대로) | `.gemini/settings.json` | L1 (json valid) | W1.3 | 5분 |
| W1.5 | tc38 매트릭스에 9개 항목 추가 (v0.41.2 plan W1.5: 8개 → 9개) | `tests/suites/tc38-feature-flags-matrix.js` | L1 unit (tc38 PASS) | W1.2 | 17분 |
| W1.6 | `package.json` `@google/gemini-cli` 의존 v0.39.1 → **v0.42.0** bump ⚠️ D1 시나리오 A 한정 | `package.json` | L1 (npm install OK) | — | 3분 |
| **W1.7 (preview train 신규)** | **`.gemini/settings.json`에 `experimental.gemma: false` 명시 잠금 (Cx13)** | `.gemini/settings.json` | L1 (json valid) | W1.4 | **5분** |

**Wave 1 산출물**: 7개 파일 수정 (~25줄 + dependency 1줄). v0.42.0 누적 testedVersions 6개 (v0.40.0/0.40.1/0.41.0/0.41.1/0.41.2/**0.42.0**).
**Wave 1 AC**: `node tests/run-all.js --suite=tc04,tc38,smoke` PASS + `npm install` 정상 종료 + `experimental.gemma: false` grep 1건.

### Wave 2 (P1, ~3-3.5h) — Spot Verification + 21 Agent Smoke + Baseline 회복

v0.41.2 plan Wave 2 그대로 + v0.42.0 preview train 신규 검증 1건.

| # | 작업 | 파일/명령 | 검증 | 의존성 | 시간 |
|---|------|---------|-----|--------|-----|
| W2.1 | tc113/tc107 파일 존재 실측 (v0.41.2 plan 그대로) | `find tests/suites -name "tc107*" -o -name "tc113*" -o -name "*25655*"` | 부재 시 별도 P1 부채 등록 | — | 10분 |
| W2.2 | topic narration L3 baseline 실측 (v0.42.0으로 갱신) | `(cd /tmp && npx --yes @google/gemini-cli@0.42.0 -p "list 3 numbers")` 1회 stdout 캡처 | L3 1회 — narration 줄 == 0 | W1.3 | 15분 |
| W2.3 | `tools.core` 키 schema 실측 (v0.42.0으로 갱신) | `npx --yes @google/gemini-cli@0.42.0 --help` | L3 1회 | — | 15분 |
| W2.4 | bkit-permissions deny 우선순위 spot (v0.41.2 plan 그대로) | sandbox 시뮬 | L2 spot | — | 15분 |
| W2.5 | **21 agent 회귀 스모크** (R9 차단, v0.41.2 plan 그대로) | 21개 FULL tier × 1개 샘플 명령 | L2 — 21/21 PASS | W1 전체 | 60분 |
| W2.6 | full baseline 1회 (v0.42.0 install 후 1925/2032 회복) | `node tests/run-all.js` | L2 baseline — pass >= 1925 | W1.6 | 30-60분 |
| W2.7 | 카나리아 PASS (tc115 / tc113 / tc38) | run-all 결과 grep | L2 grep | W2.6 | 5분 |
| W2.8 | a2a-server 미의존 재확인 (v0.41.2 plan W2.8 그대로) | `grep -rn "a2a-server" mcp/ lib/ hooks/ tests/` + `cat package.json | grep a2a` | grep 결과 docs 외 0건 | — | 5분 |
| **W2.9 (preview train 신규)** | **Bx0~Bx4 정적 분석 재현 (P2 §1.1~1.5 grep)** | `grep -rn "continueOnFailedApiCall\|InvalidStream\|exit_plan_mode\|Config\.setSessionId" lib/ mcp/ hooks/` | grep 결과 docs/test 외 0건 | — | **5분** |
| **W2.10 (preview train 신규)** | **Bx4 Gemma default-on 잠금 검증 (`experimental.gemma: false`가 Wave 1.7 적용 후 baseline에 반영)** | `cat .gemini/settings.json | jq '.experimental.gemma'` → `false` | L1 grep | W1.7 | **3분** |

**Wave 2 산출물**: spot 실측 4건 + 21 agent 스모크 + full baseline 회복 + a2a-server grep 0건 + Bx0~Bx4 정적 분석 재현 + Cx13 잠금 검증.
**Wave 2 AC**: 21/21 PASS + pass >= 1925 + tc115/tc113/tc38 PASS + a2a-server grep 0건 + Bx grep 0건 + `experimental.gemma == false`.

### Wave 3 (P2, ~1h) — 문서 갱신 + 버전 bump + v2.1.0 trigger 메모 + preview train SKILL placeholder

v0.41.2 plan Wave 3 + v0.42.0 preview train placeholder 1줄.

| # | 작업 | 파일 | 검증 | 의존성 | 시간 |
|---|------|-----|-----|--------|-----|
| W3.1 | GEMINI.md 헤더/footer bkit v2.0.6 → **v2.0.7** (v0.41.2 plan 그대로 — 본 cycle은 v2.0.7 머지 시점에 흡수되므로 추가 bump 없음) | `GEMINI.md:1, 67` | L1 grep | — | 5분 |
| W3.2 | README.md v0.40.0+v0.41.x+v0.41.2+**v0.42.0** testedVersions + 신규 안내 1단락 | `README.md` | L1 grep | W1.1 | 15분 |
| W3.3 | gemini-cli-learning SKILL.md에 **13개 단락** 추가 (v0.40.0 5 + v0.41.x 6 + v0.41.2 1 + **v0.42.0 preview train 1줄 placeholder**: "v0.42.0 preview train (preview.0/1/2): bkit 영향 0건, 활용 후보 6건 (Cx1/Cx2/Cx4/Cx7/Cx11/Cx14) — 별도 cycle 위임. v0.42.0 stable 출시 cycle에서 풀 단락 14개로 확장 예정") | `gemini-cli-learning/SKILL.md` | L1 read | — | 30분 |
| W3.4 | `/new` alias + `/voice` slash command 1줄씩 (v0.41.2 plan 그대로) | 동일 | L1 read | W3.3 | 5분 |
| W3.5 | `bkit.config.json` version `2.0.6` → `2.0.7` (v0.41.2 plan 그대로 — 본 cycle은 v2.0.7 시점 통합) | `bkit.config.json` | L1 (json valid) | — | 1분 |
| W3.6 | v2.1.0 plan trigger 메모 1단락 (v0.41.2 plan 그대로 + **preview train 변경 0건** + Cx2 Auto Memory inbox 시너지 명시) | `docs/01-plan/features/v2.1.0-context-optimization.plan.md` | L1 read | — | 15분 |
| W3.7 | PR commit message 초안 — `feat(v2.0.7): Gemini CLI v0.39.1 → v0.42.0 cumulative migration + 21 agent smoke + preview train absorption + Gemma 4 lock` | — | — | W1~W2 | 10분 |

**Wave 3 산출물**: bkit v2.0.7 일관성 (3개 파일) + SKILL 13단락 + v2.1.0 trigger 메모 + PR commit message.
**Wave 3 AC**: 모든 docs에 0.40.0/0.41.0/0.41.1/0.41.2/**0.42.0** testedVersions 명시 + bkit v2.0.7 일관성 + SKILL에 v0.42.0 preview train placeholder 1줄 + Cx13 잠금 docs 명문화.

### Wave 4 (선택, 별도 cycle 위임 — v0.41.2 plan 그대로 + preview train 추가)

| 항목 | 위임 cycle |
|---|---|
| MCP resources export PoC | v2.1.0 plan refresh cycle |
| 4-tier namespace docs | v2.1.0 plan refresh cycle |
| GEMINI_CLI_TRUSTED_FOLDERS_PATH bootstrap | onboarding UX cycle |
| autoMemory scratchpad 옵트인 | v2.1.0 implementation cycle |
| `tools.core` allowlist 카탈로그 | 보안 강화 cycle |
| `--session-id <uuid>` flag 채택 | v2.1.0 implementation cycle |
| Voice Mode / Gemma 4 | docs only / 외부 모델 cycle |
| **Cx1 (`--ignore-env`) 채택** | **CI/headless UX cycle (Q7 검증 통합)** |
| **Cx2 (Auto Memory inbox flow)** | **v2.1.0 implementation cycle (autoMemory PoC와 통합)** |
| **Cx4 (`/bug-memory` heap snapshot)** | **debugging tools cycle** |
| **Cx7 (`/commands list`)** | **health-check skill cycle (audit/skill-status 보강)** |
| **Cx11 (`/agents refresh logging`)** | **list_agents diagnostics cycle** |
| **Cx14 (`--prompt` undeprecate 명문화)** | **automation conventions cycle** |

---

## 6. Decisions (D1~D5 — P2 위임 5개 결정 항목)

### D1: v0.42.0 stable 출시 시 흡수 정책 (핵심 분기)

**옵션**: (a) preview 단독 PR / (b) v0.41.2 cycle Do와 동시 흡수 (preview 단독) / (c) **stable 출시 대기 후 통합** ← 권장 / (d) v0.42.0 stable cycle 별도 분리

**권장**: (c) **stable 출시 대기 후 통합 단일 PR** (시나리오 A, §9 상세).

**근거**:
- preview.2는 npm `latest` 채널 부적격 → bkit production dependency로 부적절 (H1 §1.1).
- v0.41.2 cycle Do 미실행 + 본 cycle delta 1 Low + stable delta = **단일 PR 통합 ROI 압도적**.
- preview.2 → 3일 경과. stable 출시 추정 시점 2026-05-09 ~ 12 (1주 이내).
- *예외*: v0.42.0 stable이 1주 이상 지연될 경우 → 시나리오 B (preview.2 단독 cycle) 활성화.

### D2: Cx1 (`--ignore-env`) 채택 여부

**옵션**: (a) 본 cycle Wave 1 통합 / (b) Wave 4 별도 cycle 위임 / (c) **CI/headless UX cycle 별도 분리** ← 권장 / (d) 거절

**권장**: (c) **별도 cycle 위임** (Q7 검증 통합).

**근거**: P2 §2 우선순위 P1이지만 *baseline runner CI 안정성 향상 시나리오* 별도 검증 필요(Q7). bkit는 `.env` 직접 사용 0건이라 *부모 .env 누설 시나리오* 별도 e2e 필요. 본 cycle delta 1 Low와 함께 처리 시 검증 비대칭. 별도 cycle (CI/headless UX) 30분 + tc115 헤드리스 시나리오 1개 추가가 분리도 우수.

### D3: Cx13 (`experimental.gemma: false` 잠금) 채택 여부

**옵션**: (a) **본 cycle Wave 1.7 통합 (1줄 잠금)** ← 권장 / (b) Wave 4 별도 cycle 위임 / (c) 거절

**권장**: (a) **본 cycle Wave 1.7 통합 (5분, 1줄)**.

**근거**: Bx4 (Gemma 4 default-on) 회귀 사전 차단 + No Guessing 강화. `.gemini/settings.json`에 1줄 추가 (5분 작업) + `hasGemmaDefaultOn` flag (5분 추가) = 총 10분으로 본 cycle delta 1 Low와 함께 *Wave 1 P0 통합 ROI 압도적*. P2 §2 우선순위 P1 권고와 일치. Cx13 잠금 시 사용자 명시 모델 선택 시 무관 (R3 위험 매우 낮음).

### D4: Cx2 (Auto Memory inbox) 별도 cycle 분리 여부

**옵션**: (a) 본 cycle Wave 1 통합 / (b) Wave 4 PoC 통합 / (c) **v2.1.0 implementation cycle 별도 분리** ← 권장 / (d) 거절

**권장**: (c) **v2.1.0 implementation cycle 별도 분리**.

**근거**: P2 §2 우선순위 P3. v2.1.0 §7 C4(autoMemory scratchpad)와 시너지 — *별도 cycle 통합 ROI 우수*. bkit는 자체 메모리 사용 — 보조 채널로 inbox 활용은 *옵트인 PoC*가 적절. 본 cycle 통합 시 PoC 회귀와 본 cycle 회귀 신호 분리도 저하.

### D5: PR #25827 워크어라운드 영구화 명문화 여부

**옵션**: (a) **본 cycle Wave 3 SKILL 1줄 명문화** ← 권장 / (b) Wave 4 별도 cycle 위임 / (c) 거절

**권장**: (a) **본 cycle Wave 3 SKILL 1줄 명문화**.

**근거**: PR #25827은 v0.42.0 preview train **7 release 연속 미수렴** (P1 §9). 워크어라운드 (`addItem` 직접 호출 회피, `BKIT_SESSION_START_VERBOSE` slim default, tc113 방어) 영구화 명문화 ROI 우수. SKILL.md에 1줄 추가 (Wave 3.3에 통합) — 향후 cycle에서 PR #25827 머지 시 즉시 재검토 트리거.

### D6: 21 agent 회귀 스모크 범위 (v0.41.2 plan D6 인계)

**옵션**: (a) **21개 전체 (~60분)** ← 권장 / (b) 샘플 5개 / (c) 생략

**권장**: (a). v0.41.2 plan D6 그대로. preview train delta 0건 회귀 신호이지만 R9 차단 위해 21 agent 스모크 *13회차 일관 적용*.

### D7: testedVersions 누적 정책 (v0.41.2 plan D4 인계 + N=12 trigger 발동)

**옵션**: (a) **모두 누적 (`["0.34.0", ..., "0.42.0"]`)** ← 권장 / (b) 최근 N개 / (c) 최신 1개

**권장**: (a). v0.41.2 plan D4 그대로. **N=12 도달 (12회차 cycle) — 다음 cycle (v0.42.0 stable post-merge)에서 D4 재검토 정식 발동**.

---

## 7. 미해결 검증 항목 답변/위임 (P2 §9 Q6~Q8)

| Q# | 질문 | 본 P3 답변 또는 Do 위임 |
|---|---|---|
| **Q6** | v0.42.0 stable 시점 PR #25186 ToolDisplay refactor schema 변경 회귀 | **Do 위임** — Wave 2.6 full baseline + W2.9 Bx grep 정적 분석 재현으로 동적 검증. bkit는 stdout/stderr 불투명 캡처 → schema 변경 무관 확인 (P2 §1.2). 회귀 위험 매우 낮음 |
| **Q7** | bkit `--ignore-env` (Cx1) 채택 시 baseline runner CI 안정성 향상 시나리오 | **별도 cycle 위임** — D2 권고. CI/headless UX cycle에서 `mcp/bkit-server.js:1097` args 추가 + tc115 헤드리스 시나리오 1개 30분 |
| **Q8** | bkit `experimental.gemma: false` 명시 잠금 시 Bx4 영향 0건 사전 차단 | **본 P3 채택** — D3 Wave 1.7 1줄 + W2.10 검증 (Cx13 잠금 docs 명문화) |

**기존 Q1~Q5 (v0.41.2 plan)** 모두 *Do 단계 처리* 그대로 유효 (W2.1~W2.7 인계).

**모든 8건 (v0.41.2 5건 + 본 cycle 3건) Do 단계 또는 별도 cycle에서 해소 가능**. 본 P3에서 추가 분석 불필요.

---

## 8. 위험 관리 (R1~R12, v0.41.2 plan + R12 신규)

### 8.1 리스크 매트릭스

v0.41.2 plan §8.1 R1~R11 그대로 + R12 신규 평가.

| ID | 리스크 | 가능성 | 영향 | 완화책 | 잔존 위험 |
|----|--------|-------|------|--------|----------|
| R1~R11 | (v0.41.2 plan §8.1 그대로 — topic narration / 4-tier paths / #25827 / v0.42.0 출시 / hidden regression / YOLO+deny / tc113 부재 / 키 위치 / R9 21 agent 스모크 / tools.core 키 schema / R11 a2a-server 미의존) | — | — | — | LOW |
| **R12 (신규 — preview train 변동성)** | **preview.2 → v0.42.0 stable 사이 추가 cherry-pick으로 Bx*/Cx* 카운트 ±2~3건 변동** | 중간 | 낮음 (정적 분석 재현 가능) | D1 시나리오 A에서 stable 출시 release notes 재검증 (10분) + W2.9 Bx grep 재현 | LOW |
| **R13 (신규 — Bx4 Gemma 4 default-on)** | **`experimental.gemma: false` 잠금 누락 시 stable 머지 후 모델 자동 추론 변화** | 매우 낮음 | 매우 낮음 (사용자 prompt 의존이므로 모델 명시 시 무관) | D3 Wave 1.7 1줄 잠금 + W2.10 검증 | NEAR-ZERO |
| **R14 (신규 — preview train 단독 cycle 부담)** | **본 cycle 단독 PR 처리 시 v0.41.2 + 본 cycle + stable cycle = 3개 plan 누적 부담** | 높음 (D1 시나리오 B 시) | 중간 (코드 변경 중복 — `bkit.config.json` testedVersions, `lib/gemini/version.js` flag 그룹) | D1 시나리오 A 권고 (stable 대기 후 통합) | LOW |

**전체 위험도**: **LOW**. v0.41.2 plan 위험 수준 그대로 + R12~R14 신규 모두 완화 가능.

### 8.2 21 agent 회귀 스모크 절차 (v0.41.2 plan §8.2 그대로)

1. 21개 FULL tier agent × 1개 표준 명령 (예: `/agents refresh` 또는 자기 진단 query) 실행
2. PASS = 표준 응답 패턴 확인 (응답 길이 > 0 + 명령 거부 0건)
3. FAIL 1건 이상 시 Wave 2 일시 중단 → 회귀 분석 cycle 진입
4. 21/21 PASS 시 Wave 2.6 full baseline 진입

### 8.3 롤백 전략 (v0.41.2 plan §8.2 그대로 + preview train 추가)

- **L1 rollback**: `git revert <commit-sha>` — atomic
- **L2 rollback**: `~/.gemini/settings.json` user-scope override
- **L3 rollback**: `npx --yes @google/gemini-cli@0.41.2` 다운그레이드 (testedVersions에 0.41.2 유지)
- **R9 rollback**: 21 agent 스모크 실패 시 Wave 1 commit 직전으로 되돌리기 + 회귀 분석 cycle
- **R12 rollback (preview train 변동성)**: stable 출시 시 release notes 재검증 후 P1/P2 재작성 (본 plan은 stable rename 시점에 재검증)
- **R13 rollback (Cx13 Gemma 잠금)**: `experimental.gemma: false` 제거 (1줄 revert)
- **v0.42.0 specific rollback**: `package.json` 의존을 v0.41.2로 다운그레이드 (D1 시나리오 A에서만)

### 8.4 사전/사후 카나리아

| 시점 | 카나리아 | 통과 기준 |
|---|---|---|
| **사전** | tc115 (trust env) PASS, tc113 (#25655 SessionStart) PASS | v0.39.1 baseline 회복 |
| **사후 (Wave 2 종료)** | 동일 카나리아 + 21 agent 스모크 21/21 + a2a-server grep 0건 + Bx grep 0건 + `experimental.gemma == false` | 5축 PASS |
| **사후 (Wave 3 종료)** | bkit v2.0.7 일관성 grep + SKILL 13단락 + testedVersions 6개 + Cx13 잠금 docs | docs grep PASS |

---

## 9. v0.42.0 stable 출시 시 흡수 정책 (D1 상세)

### 9.1 시나리오 A — 본 plan을 그대로 stable rename ← 권장

**조건**: v0.42.0 stable이 본 P3 작성 후 1주 이내 (2026-05-16 이전) 출시.

**작업**:
1. 본 plan 파일을 `gemini-cli-v0.42.0-migration.plan.md`로 rename
2. P1 + P2 산출물 stable 재검증 (release notes diff ~10분)
3. Wave 1.1 testedVersions 6개 활성화 (`"0.42.0"` 추가)
4. Wave 1.6 dependency bump v0.41.2 → v0.42.0 활성화
5. R12 (preview.2 → stable cherry-pick) 검증 (W2.9 Bx grep 재현)

**총 시간**: ~3.5-4.5h (본 plan + ~30분 재검증).

**ROI**: ⬛⬛⬛⬛⬛ — v0.41.2 cycle Do + 본 cycle delta + stable delta 통합 단일 PR. 미머지 plan 부담 일괄 해소.

### 9.2 시나리오 B — preview.2 단독 cycle 진입 (백업)

**조건**: v0.42.0 stable이 1주 이상 지연 (2026-05-16 이후 미출시).

**작업**:
1. 본 plan을 *preview.2 단독 cycle*로 진입
2. `package.json` 의존을 v0.41.2 유지 (preview.2 dependency 거부 — npm `latest` 부적격)
3. Wave 1.1 testedVersions 5개 (`"0.42.0"` 보류)
4. Wave 1.6 dependency bump 보류
5. 본 cycle delta (Cx13 + SKILL placeholder) 단독 처리 — v0.41.2 cycle Do와 동시 흡수
6. v0.42.0 stable 출시 시 별도 cycle B' 14회차 진입 (testedVersions/dependency만 추가)

**총 시간**: ~3-3.5h (본 plan - testedVersions/dependency 활성화 시간).

**ROI**: ⬛⬛⬛⬜⬜ — preview train 단독 PR 처리. stable cycle 분리로 미머지 plan 4개 누적 (R14 위험).

### 9.3 시나리오 C — v0.41.2 cycle Do와 동시 통합 (권장 대안)

**조건**: v0.42.0 stable 출시 *직전* 1-2일 내 v0.41.2 cycle Do 진입 결정.

**작업**:
1. v0.41.2 cycle Do 진입 → main 머지 (PR `feat(v2.0.7): Gemini CLI v0.39.1 → v0.41.2 cumulative migration`)
2. v0.42.0 stable 출시 시 본 plan을 stable rename → 별도 cycle B' 14회차 진입 (testedVersions 1개 + dependency bump 1개 + Cx13 1줄 + SKILL placeholder 1줄 + flag 1개 = ~30분 + Wave 2 재실행 ~3h)

**총 시간**: v0.41.2 cycle Do ~4.5-5h + 본 cycle ~3.5-4h = **~8-9h** (분리 처리).

**ROI**: ⬛⬛⬛⬜⬜ — *분리 처리*로 회귀 신호 명확. 단 *통합 단일 PR ROI*는 시나리오 A가 우수.

### 9.4 시나리오 비교

| 시나리오 | 조건 | 시간 | PR 수 | ROI | 위험 |
|---|---|---|---|---|---|
| **A (권장)** | stable 1주 이내 출시 | ~3.5-4.5h | **1개** | ⬛⬛⬛⬛⬛ | LOW |
| B (백업) | stable 1주 이상 지연 | ~3-3.5h + 별도 14회차 | 2개 | ⬛⬛⬛⬜⬜ | MED (R14) |
| C (대안) | stable 직전 2일 내 v0.41.2 Do 결정 | ~8-9h (분리) | 2개 | ⬛⬛⬛⬜⬜ | LOW (분리도 우수) |

**최종 권고**: **시나리오 A**. v0.42.0 stable 출시 시 즉시 본 plan을 stable rename → 통합 단일 PR. 시나리오 B/C는 백업/대안.

---

## 10. Acceptance Criteria (AC)

### 10.1 정량 (8건)

1. **L1 unit**: tc04 / tc38 / smoke PASS (Wave 1 종료)
2. **L2 baseline**: `node tests/run-all.js` pass >= 1925 (v0.39.1 baseline 회복) — Wave 2.6
3. **L3 spot (narration)**: topic narration noisy line == 0 (W1.3 적용 후 v0.42.0 npx 격리 실측) — Wave 2.2
4. **L3 spot (tools.core)**: 키 schema 명칭 확정 (`tools.core` vs `tools.coreTools`) — Wave 2.3
5. **회귀 카나리아**: tc115 PASS + tc113 PASS — Wave 2.7
6. **21 agent 스모크**: 21/21 PASS — Wave 2.5 (R9 차단)
7. **bkit 버전**: GEMINI.md / README.md / bkit.config.json 모두 `bkit v2.0.7` 일관 — Wave 3
8. **Cx13 잠금**: `.gemini/settings.json`에 `experimental.gemma: false` 명시 — Wave 1.7 + W2.10

### 10.2 정성 (6건)

1. **YAGNI 준수**: Wave 4 별도 cycle 위임 그대로 + Cx2/Cx4/Cx7/Cx11/Cx14 모두 별도 cycle 위임
2. **외부 인터페이스 실측**: tc113/tc107, narration L3, tools.core schema, YOLO+deny, **21 agent 스모크**, **a2a-server grep 0건 재확인**, **Bx0~Bx4 정적 분석 재현** — 모두 spot 실측 결과 명시
3. **Strategy B' 13번째 적용**: 메모리 인덱스에 누적된 12개 cycle 학습 적용 + v0.42.0 preview train 학습 추가
4. **v0.40.0/v0.41.x/v0.41.2/v0.42.0 cycle 흡수**: 4개 cycle 모두 단일 PR로 통합 — 각 plan supersede 명시 (D1 시나리오 A)
5. **Decisions 명문화**: D1~D7 모두 명시 + N=12 trigger (D7 재검토 차기 cycle 발동)
6. **preview train 변동성 대응**: R12 명시 + 시나리오 A/B/C 명시 + stable 출시 시 W2.9 Bx grep 재현 명시

---

## 11. References (P1, P2, prior plans)

- **Phase 1 Research (v0.42.0 preview train delta)**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/research/gemini-cli-v0.42.0-preview-research.md` (2026-05-09, 389 lines)
- **Phase 2 Impact (v0.42.0 preview train delta)**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/03-analysis/gemini-cli-v0.42.0-preview-impact.analysis.md` (2026-05-09, 291 lines)
- **v0.41.2 plan (supersede 후보)**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/features/gemini-cli-v0.41.2-migration.plan.md`
- **v0.41.1 plan (이미 v0.41.2 plan에 흡수)**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/features/gemini-cli-v0.41.1-migration.plan.md`
- **v0.40.0 plan (이미 v0.41.1 plan에 흡수)**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/features/gemini-cli-v0.40.0-migration.plan.md`
- **v0.41.2 report (참조)**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/04-report/gemini-cli-v0.41.2-migration.report.md`
- **이전 cycle plans (Strategy B' family 1~12)**:
  - v0.39.1 (8th): `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/features/gemini-cli-v0.39.1-migration.plan.md`
  - v0.39.0 (7th): `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/features/gemini-cli-v0.39.0-migration.plan.md`
  - v0.38.2 (6th): `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/features/gemini-cli-v0.38.2-migration.plan.md`
- **bkit 철학**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/bkit-system/philosophy/{core-mission,ai-native-principles,context-engineering,workflow-philosophy}.md`
- **메모리 인덱스**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/.claude/agent-memory/migration-strategist/MEMORY.md` + `project_v0412_migration.md` (v0.41.2 cycle 학습)

---

## 12. Cx 시리즈 본 cycle 처리 매트릭스 (Cx1~Cx14)

| Cx# | 기능 | 본 cycle 처리 | 별도 cycle 위임 | 권장 우선순위 |
|---|---|---|---|---|
| **Cx1** | `--ignore-env` flag + `advanced.ignoreLocalEnv` setting | ❌ (D2 별도) | ✅ CI/headless UX cycle (Q7 검증) | P2 |
| **Cx2** | Auto Memory inbox flow (`extraction.patch`) | ❌ (D4 별도) | ✅ v2.1.0 implementation cycle | P3 |
| Cx3 | Auto Memory private patch allowlist tighten | ❌ (Cx2 종속) | ✅ Cx2와 함께 | (Cx2 종속) |
| **Cx4** | `/bug-memory` slash command + `/bug` heap snapshot | ❌ (별도) | ✅ debugging tools cycle | P3 |
| Cx5 | V8 heap snapshot utility | ❌ (Cx4 종속) | ✅ Cx4와 함께 | (Cx4 종속) |
| Cx6 | `/exit --delete` flag | ❌ (배제) | (선택 — 자동화 가치 낮음) | P4 |
| **Cx7** | `/commands list` subcommand | ❌ (별도) | ✅ health-check skill cycle | P3 |
| Cx8 | `/extensions delete` alias | ❌ (배제) | — | (배제) |
| Cx9 | queuing messages during compression | ❌ (자동 적용) | — | (자동) |
| Cx10 | Voice Mode privacy/compliance UX warning | ❌ (배제) | — | (배제) |
| **Cx11** | `/agents refresh logging` | ❌ (별도) | ✅ list_agents diagnostics cycle | P3 |
| Cx12 | Inquiry constraints 강화 | ❌ (자동 적용) | — | (자동) |
| **Cx13** | **Gemma 4 default-on (`experimental.gemma: false` 잠금)** | **✅ Wave 1.7 (5분)** | — | **P1** |
| **Cx14** | `--prompt` (-p) flag undeprecated | ❌ (SKILL placeholder 통합) | ✅ automation conventions cycle | P3 |

**본 cycle 채택**: **Cx13 1건만**. 나머지 13건 모두 별도 cycle 위임 또는 자동 적용/배제. YAGNI 절감 92.8%.

---

## 13. 다음 단계 (P4 위임)

### 13.1 종합 보고서 작성 항목 (P4)

1. **D1~D7 사용자 결재** — 특히 D1 시나리오 A vs B vs C 선택
2. **R12~R14 위험 모니터링** — preview.2 → v0.42.0 stable 사이 cherry-pick 추적
3. **본 plan supersede 정책 명시** — v0.42.0 stable 출시 시 본 plan을 stable rename 후 P1/P2 재검증
4. **Strategy B family 13회차 학습 메모리 갱신** — `MEMORY.md` + `project_v0420_preview_migration.md` 신설

### 13.2 사용자 결재 후 Do 진입 시 즉시 적용 가능 여부

✅ **D1 시나리오 A 결재 + v0.42.0 stable 출시 동시 충족 시 즉시 진입 가능**.

근거:
- 본 plan은 v0.41.2 plan 골격 90% 재활용 — Wave 1~3 모두 검증된 패턴
- delta = Cx13 + flag + SKILL placeholder = 10분 추가 작업
- R12 (preview train 변동성) 완화책 명시 — stable 출시 release notes 재검증 10분
- Strategy B' 13회차 — 메모리 누적 학습 적용 가능

❌ **시나리오 B/C 결재 시 별도 cycle 분리 필요** — D1 결재 사전 필수.

### 13.3 P4 보고서 출력 경로

`docs/04-report/gemini-cli-v0.42.0-preview-migration.report.md` (P3 결재 후 작성)

---

## Appendix A. v0.41.2 plan 대비 본 plan delta 표 (≤6건)

| # | 항목 | v0.41.2 plan | v0.42.0 preview plan | 본 cycle 변경 사유 |
|---|------|-------------|-------------|------------------|
| 1 | testedVersions 추가 항목 | 5개 (`0.40.0/0.40.1/0.41.0/0.41.1/0.41.2`) | **6개** (+`0.42.0` D1 시나리오 A 한정) | v0.42.0 stable 추가 (조건부) |
| 2 | dependency bump | v0.41.2 | **v0.42.0** (D1 시나리오 A 한정) | npm latest 변경 (조건부) |
| 3 | gemini-cli-learning SKILL 단락 | 12개 (v0.40.0 5 + v0.41.x 6 + v0.41.2 1) | **13개** (+ v0.42.0 preview train placeholder 1줄) | Docs=Code, P2 잔존 1 Low |
| 4 | Wave 1 신규 항목 | W1.1~W1.6 | + **W1.7 (`experimental.gemma: false` 잠금, Cx13)** | Bx4 회귀 사전 차단 (D3) |
| 5 | Wave 1.2 flag 신설 | 8개 | **9개** (+ `hasGemmaDefaultOn`) | Bx4 게이트 (조건부 활성) |
| 6 | Wave 2 신규 항목 | W2.1~W2.8 | + **W2.9 (Bx grep 정적 분석 재현)** + **W2.10 (Cx13 잠금 검증)** | preview train 회귀 사전 차단 |
| 7 | Strategy B' family 카운트 | 12번째 적용 | **13번째 적용** | cycle 진척 |

**delta 합계**: 7건 (테이블 1건 + 코드 변경 4건 + 검증 2건). v0.41.2 plan 골격 ≥90% 재활용.

---

## Appendix B. 본 plan close 후 다음 액션 (메인 세션용)

1. **D1~D7 사용자 확인** (특히 D1 시나리오 A/B/C, D2 Cx1, D3 Cx13, D4 Cx2, D5 PR #25827 영구화, D7 N=12 trigger)
2. **D1 시나리오 A 결재 시**: v0.42.0 stable 출시 대기 → 출시 시점 본 plan을 stable rename → Phase 4 Do 진입 (Wave 1 → Wave 2 → Wave 3 순차 실행)
3. **D1 시나리오 B 결재 시**: preview.2 단독 cycle 진입 → 본 cycle delta (Cx13 + SKILL placeholder) 단독 PR + v0.41.2 cycle Do 동시 흡수 (단, dependency/testedVersions stable 활성 보류)
4. **D1 시나리오 C 결재 시**: v0.41.2 cycle Do 우선 진입 → main 머지 → v0.42.0 stable 출시 시 별도 B' 14회차 cycle
5. **PR 생성 (시나리오 A)**: 단일 PR, commit message: `feat(v2.0.7): Gemini CLI v0.39.1 → v0.42.0 cumulative migration + 21 agent smoke + preview train absorption + Gemma 4 lock`
6. **v2.1.0 plan refresh cycle 진입 알림** — 본 cycle close 직후 (Cx2 Auto Memory inbox 시너지 명시)
7. **메모리 갱신** — `project_v0420_preview_migration.md` 신설 + `MEMORY.md` 인덱스 추가

---

*Phase 3 Plan-Plus 종료: 2026-05-09. Strategy B' **13번째** 적용 권장. 작업 시간 ~3.5-4.5h, 위험도 LOW (R9 21 agent 스모크 + R11 a2a-server 미의존 + R12 preview train 변동성 + R13 Bx4 잠금 + R14 단독 cycle 부담). v0.42.0 preview train delta = 1 Low (`gemini-cli-learning/SKILL.md` placeholder 1줄). v0.41.2 cycle Do 미실행 + 본 cycle delta + v0.42.0 stable cycle 통합 단일 PR (D1 시나리오 A 권장). v0.41.2 plan 골격 ≥90% 재활용 + delta 7건 (testedVersions/dependency 조건부 + SKILL 1줄 + W1.7 Cx13 + flag 1개 + W2.9/W2.10 + 카운트). Cx13만 본 cycle 채택, 나머지 13개 신기능 모두 별도 cycle 위임 (YAGNI 절감 92.8%).*
*migration-strategist agent (Strategy B' family 13th application — preview train delta cycle)*
