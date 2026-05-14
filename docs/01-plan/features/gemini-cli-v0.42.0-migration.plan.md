# Gemini CLI v0.42.0 stable 마이그레이션 Plan (P3)

> Phase 3 산출물. /gemini-migration Phase 3 — Plan-Plus 브레인스토밍 (Strategy B family **13번째** 후보 — stable 출시 확정 cycle).
> 작성일: 2026-05-13
> 작성자: migration-strategist agent
> 베이스라인: bkit v2.0.6 (= Gemini CLI v0.39.1 stable, PR #24 main 머지) + main commit `8e0daa7` (2026-05-08 v0.40.0/v0.41.1/v0.41.2 P1~P4 산출물 12 files / 4642 lines 머지, **Do 미실행**)
> 본 cycle 비교 범위: **`v0.41.2 → v0.42.0 stable`** (= preview.2 bit-for-bit promotion, code patch 0건)
> 누적 비교 범위 (참조): `v0.39.1 → v0.42.0 stable` = v0.41.2 누적 (33 files / Critical 0 / High 5 / Medium 10 / Low 28) + 본 cycle delta 1 Low → **34 files / Critical 0 / High 5 / Medium 10 / Low 29**
> v0.42.0 stable 출시: **2026-05-12 22:29 UTC** (preview.2 출시 후 6일 burn-in / preview.2 = `68e2196d` 직전 / stable = `chore(release): v0.42.0`만 1 commit 9 files = package.json 계열)
> v0.43.0-preview.0 동시 출시: **2026-05-12 22:25 UTC** (stable 출시 4분 전, **본 cycle scope 외**, 다음 cycle 시그널 §11)
>
> **입력 문서**:
> - Phase 1 (v0.42.0 stable delta, 2026-05-13): `docs/01-plan/research/gemini-cli-v0.42.0-research.md` (416 lines)
> - Phase 2 (v0.42.0 stable impact, 2026-05-13): `docs/03-analysis/gemini-cli-v0.42.0-impact.analysis.md` (417 lines)
> - Phase 3 baseline (참조 + supersede 후보, 2026-05-09): `docs/01-plan/features/gemini-cli-v0.42.0-preview-migration.plan.md` (590 lines, Strategy B' 13회차 preview train)
> - Phase 3 baseline (참조): `docs/01-plan/features/gemini-cli-v0.41.2-migration.plan.md` (B' 12회차)
> - Phase 4 baseline (참조): `docs/04-report/gemini-cli-v0.42.0-preview-migration.report.md`
>
> **본 cycle의 본질적 차이 (vs v0.42.0-preview plan)**: ① v0.42.0 stable **출시 확정** (2026-05-12 22:29 UTC) → D1 시나리오 A **활성**, ② preview.2 → stable bit-for-bit promotion 확정 (code patch 0건, package.json만) → preview plan 골격 ≥95% 재활용, ③ **PR #25827 정정** (OPEN → MERGED 2026-05-11, v0.42.0 release 브랜치 미포함 / v0.43.0-preview.0 포함) → 워크어라운드 v0.42.0 cycle 유지 + v0.43.0 stable cycle 제거 후보 사전 등록, ④ R12 (preview train 변동성) **소진** (stable 확정으로 변동성 위험 0), ⑤ R4 신설 (OAuth headless #26571 미포함 — bkit scope 외 사용자 책임), ⑥ v0.43.0-preview.0 시그널 80 commits 사전 검토 (§11 다음 cycle 위임).

---

## 0. 컨텍스트 및 입력

### 0.1 입력 자료 요약

| 입력 | 핵심 결론 | 신뢰도 |
|---|---|---|
| P1 research (stable delta, 2026-05-13) | **v0.42.0 stable = preview.2 bit-for-bit promotion** (1 commit / 9 files / package.json 계열만). preview-research §1~§7 결론 **100% 유효**. PR #25827 정정 (main MERGED 2026-05-11 / v0.42.0 release 브랜치 미포함 / v0.43.0-preview.0 포함). v0.43.0-preview.0 동시 출시 (80 commits 시그널 §3) | ⬛⬛⬛⬛⬛ |
| P2 impact analysis (stable delta, 2026-05-13) | **Critical 0 / High 0 / Medium 0 / Low 1** (preview-impact 그대로 유지). v0.41.2 누적 33 files + 본 delta 1 Low → **34 files / Critical 0 / High 5 / Medium 10 / Low 29**. preview-impact §1~§8 **100% 유효** + 정정 3건(PR #25827 / OAuth #26571 / v0.43.0-preview.0 사전 검토). bkit 4대 철학 5 강화 / 3 중립 / **0 충돌** | ⬛⬛⬛⬛⬛ |
| v0.42.0-preview plan (참조 + supersede 후보) | Strategy B' 13회차, ~3.5-4.5h, 3 Wave, D1 시나리오 A 권장. v0.41.2 plan 골격 ≥90% 재활용 + delta 7건. **본 cycle은 preview plan의 stable rename + D1 시나리오 A 활성화** | ⬛⬛⬛⬛⬛ |
| v0.41.2 plan (참조 + supersede 후보) | Strategy B' 12회차, ~4.5-5h, 3 Wave, LOW risk + R9 (21 agent 스모크) + R11 (a2a-server 미의존). **Do 미실행 상태** | ⬛⬛⬛⬛⬛ |
| v0.42.0-preview report (참조) | P4 종합 보고서. D1~D7 결재 + 메모리 갱신 완료. 본 cycle 진입 시 commit message + PR template 그대로 활용 가능 | ⬛⬛⬛⬛⬛ |

### 0.2 결정된 환경 변수

- bkit `main` HEAD = v2.0.6 = Gemini CLI v0.39.1 머지 완료 (PR #24)
- main commit `8e0daa7` (2026-05-08) = v0.40.0/v0.41.1/v0.41.2 P1~P4 산출물 12 files / 4642 lines 머지. **Do 미실행** (코드/설정/스킬 변경 0건, 산출물 docs만)
- npm `latest` stable = **v0.42.0** (2026-05-12 22:29 UTC 출시, 본 P3 작성 시점 ~14시간 경과)
- 누적 baseline = v0.39.1 → v0.42.0 stable (사용자 결정 = 메인 세션 확정)
- 본 cycle delta → bkit 영향 **1 Low** 확정 (P2 §6.2: `skills/gemini-cli-learning/SKILL.md` v0.42.0 stable 1줄 placeholder)
- v0.40.0/v0.40.1/v0.41.0/v0.41.1/v0.41.2/v0.42.0-preview cycle **모두 main 머지 미완료** (산출물만 머지, Do 미진행)
- **v0.42.0 stable promotion 확정 = preview.2 bit-for-bit**: preview plan §1~§13의 모든 결론이 stable 시점에 자동 승계. preview plan을 stable rename + D1 시나리오 A 활성화만으로 즉시 진입 가능
- **PR #25827 상태 갱신**: OPEN → MERGED (2026-05-11 16:59 UTC, merge_commit_sha `ecfaac2dc7...`) → v0.42.0 release 브랜치 **미포함** (`compare/{25827_merge}...{v0.42.0_tag}` = diverged 6/54) → v0.43.0-preview.0 **포함**. bkit SessionStart `systemMessage` 워크어라운드 9 위치(P2 §2.2) **v0.42.0 cycle 유지, v0.43.0 stable cycle 제거 후보**
- **v0.43.0-preview.0 동시 출시** (2026-05-12 22:25 UTC, stable 4분 전): 80 commits 시그널. 본 cycle scope **외** (§11 다음 cycle 위임)

### 0.3 본 cycle의 본질적 차이 1줄

**v0.42.0-preview plan 대비**: stable promotion 확정으로 D1 시나리오 A **활성**(preview plan은 시나리오 A/B/C 분기). preview.2 → stable bit-for-bit promotion (code 0건)으로 preview plan 골격 ≥95% 재활용. **PR #25827 정정 흡수** + R12 소진 + R4 신설 + v0.43.0-preview.0 시그널 §11 등록. 총 작업 시간 ~3.5-4.5h (preview plan과 동일), 위험도 LOW (preview plan 동일).

---

## 1. 의도 탐색 (Intent Discovery)

### 1.1 사용자 의도 추정 (3 가설)

| 가설 | 근거 | 신뢰도 |
|------|------|--------|
| **H1**: "v0.42.0 stable 출시 확정 → preview plan을 stable rename + D1 시나리오 A 활성화 → v0.40.0/v0.41.1/v0.41.2 cycle Do와 동시 흡수 통합 단일 PR" | preview plan §9.1 시나리오 A 그대로. 사용자 메인 세션 확정 (target = latest = v0.42.0 stable, from = v0.41.2). v0.40.0/v0.41.1/v0.41.2 산출물 12 files / 4642 lines 8e0daa7 머지됐으나 Do 미실행 → 통합 PR ROI 압도적 | ⬛⬛⬛⬛⬛ |
| **H2**: "preview cycle은 사전 시그널 검증이었고, stable 출시 시 별도 cycle B' 14회차 진입" | preview plan §9.3 시나리오 C와 유사. v0.41.2 cycle Do와 분리 처리. 미머지 plan 누적 부담 증가 | ⬛⬛⬜⬜⬜ |
| **H3**: "v0.43.0-preview.0 동시 출시를 고려해 v0.43.0 stable 출시까지 통합 보류" | v0.43.0-preview.0 시그널이 풍부(Subagent Protocol, Session persistence, OAuth fix #26571 등). 하지만 v0.43.0 stable 출시 시점 불확실 → 미머지 plan 부담 가중 | ⬛⬜⬜⬜⬜ |

**결론**: **H1 풀 채택**. preview plan §9.1 시나리오 A 활성화. H2 거부(미머지 plan 누적 부담), H3 거부(v0.43.0 stable 출시 시점 미정).

### 1.2 사용자(kay) 컨텍스트 반영

| 항목 | 추정/확인 | Plan에 반영 |
|---|---|---|
| 역할 | bkit-gemini 개발자, CTO-level (사용자 메모리) | 작업량 가중치 0.25 — 가용 시간 4-5h 가정 |
| 누적 미머지 cycle 부담 | v0.40.0/v0.40.1/v0.41.0/v0.41.1/v0.41.2/v0.42.0-preview P1~P4 산출물 main 머지 완료 (`8e0daa7`), **그러나 Do 미실행**. 코드/설정/스킬 변경 0건, 산출물 docs만 | 통합 단일 PR ROI 압도적. 본 plan은 v0.42.0-preview plan §9.1 시나리오 A 활성화 |
| 학습 곡선 | Strategy B family **13회 적용 안정** (preview cycle 포함, 가중 점수 8.05~8.85점 일관성) | Strategy B' **13회차** 적용 — 패턴 일관성 + 위험 예측력 최대. preview cycle P3 plan을 stable rename으로 진입 (메모리 인덱스 `project_v0420_preview_migration.md` 학습 직접 활용) |
| 시간 투자 의지 | 가용 시간 4-5h (B' family 표준) | preview plan ~3.5-4.5h 그대로 + stable 활성화 ~10분 = **~3.5-4.5h 동일** |
| stable vs preview 결정 | 사용자가 메인 세션에서 *target = latest stable* 결정 (= v0.42.0) | **D1 시나리오 A 활성화** (stable rename + 통합 PR) |

### 1.3 숨은 요구사항 — v0.43.0-preview.0 시그널 활용 결정

P3 핵심 분기 (preview plan에는 없던 신규 분기):

| 옵션 | 작업 | ROI | 위험 |
|---|---|---|---|
| **(A) v0.42.0 stable 단일 cycle** ← 권장 | 본 plan 그대로 진입. v0.43.0-preview.0 시그널 § 11 등록만 | **매우 높음** (3개 plan 일괄 해소 + stable 채널 안정성) | 매우 낮음 |
| (B) v0.42.0 stable + v0.43.0-preview.0 핵심 fix 사전 cherry-pick | OAuth #26571 / chat corruption #26534 / async hysteresis #26452 / PR #25827 정정 등 백포트 시도 | 낮음 (gemini-cli 자체에서 cherry-pick 불가능 — 사용자 측에서 build 불가) | 매우 높음 (npm latest 채널 부적격) |
| (C) v0.43.0 stable 출시까지 통합 보류 | v0.42.0 stable 흡수 보류. v0.43.0 stable 출시 시 진입 | 매우 낮음 (출시 시점 미정) | 매우 높음 (미머지 plan 부담 가중) |

**근거**: P2 §4.3 (Context 강화 4건 자동 적용) + P1 §3.4 (v0.43.0-preview.0 방향성 시사). v0.42.0 stable로 자동 흡수되는 fix가 12건(P1 §1.6)이므로 v0.42.0 stable 단일 cycle ROI 압도적. v0.43.0-preview.0 신호는 **다음 cycle**(v0.43.0 stable)에서 풀 진입.

### 1.4 비용/이익 분석

| 항목 | Strategy A (Minimal) | **Strategy B' (본 cycle 권장)** | Strategy C (Full + v0.43.0 사전 fix PoC) |
|---|---|---|---|
| 작업 시간 | ~30분 (preview plan SKILL placeholder만) | ~3.5-4.5h (preview plan 골격 ≥95% 재활용 + stable 활성화) | ~26h (v0.43.0-preview.0 fix PoC 백포트 시도 — 비실용적) |
| 토큰 절감 (이론) | 0% | 0% (게이트만) | ~30% (v2.1.0 시너지) |
| 회귀 차단 신뢰도 | ⬛⬛⬜⬜⬜ (placeholder만) | ⬛⬛⬛⬛⬛ (R9 21 agent 스모크 + R11 a2a-server 재확인 + Bx0~Bx4 정적 분석 재현 + W2.10 Cx13 잠금 검증) | ⬛⬛⬛⬛⬛ (동일) |
| **ROI** | **30분 / 1 Low 처리** | **~4h / 회귀 차단 + 미래 게이트 + v0.40.0/v0.41.1/v0.41.2/v0.42.0-preview/v0.42.0 cycle 5건 일괄 흡수** | **26h / PoC 사실상 불가능** |

**결정**: Strategy B' 13회차 채택. preview plan §1.4 결론 그대로 (preview train delta 1 Low → stable delta 1 Low 동일).

---

## 2. 대안 비교 (가중 점수표, 5개 후보)

### 2.1 전략 정의 (5개)

| 전략 | 정의 | 작업 시간 | 핵심 |
|------|------|----------|------|
| **A** | Minimal — `gemini-cli-learning/SKILL.md`에 v0.42.0 stable 1줄 placeholder만 | **~30분** | "본 cycle delta 1 Low만 처리, v0.41.2 cycle와 분리" 시나리오 — 단독 처리 ROI 매우 낮음 |
| **B** | Standard — A + v0.42.0-preview plan 흡수 + testedVersions/dependency 활성화 (Cx13 잠금 누락, 21 agent 스모크 생략) | ~3h | preview plan 흡수 + Bx0~Bx4 정적 검증 — Cx13 잠금/R9 누락 |
| **B' (추천)** | **v0.42.0-preview plan in-place rename + D1 시나리오 A 활성화 + PR #25827 정정 흡수 + Cx13/Cx1 P0 통합 + 21 agent 스모크** | **~3.5-4.5h** | 본 cycle 권장. preview plan 골격 ≥95% 재활용 + stable 활성화 (testedVersions/dependency/flag 활성) + W1.7 Cx13 + W2.9/W2.10 검증 + R9 21 agent 스모크 |
| **B''** | B' + Cx1 (`--ignore-env`) 본 cycle 통합 (Q7 검증 본 cycle에서 해소) | ~4h | Cx1을 별도 cycle에서 본 cycle로 이전. baseline runner CI 안정성 향상. 단 시너지 분리도 ↓ |
| **C** | Full — B' + Cx2/Cx4/Cx7 PoC + v0.43.0-preview.0 시그널 사전 PoC | ~26h (~3-4d) | v2.1.0 시너지 + PoC 다수. 본 cycle scope 외 |

### 2.2 가중 점수 매트릭스

가중치 (사용자 명시 — preview plan 그대로):
- **안전성 0.30** (R12 소진 보정 — stable 확정으로 변동성 위험 0)
- **작업 시간 0.25**
- **bkit 가치 0.20** (회귀 차단 + 새 기능 활용 합산)
- **학습 효과 0.15** (Strategy B family 13회차 — 패턴 강화)
- **일관성 0.10** (preview plan in-place rename + stable 활성화 정책)

각 차원 1~10점:

| 차원 (가중치) | A | B | **B'** | B'' | C |
|--------------|---|---|----|---|---|
| 안전성 (0.30) | 4 | 8 | **10** | 9 | 9 |
| 작업 시간 (0.25) | **10** | 8 | 7 | 6 | 2 |
| bkit 가치 (0.20) | 1 | 7 | **9** | 10 | 10 |
| 학습 효과 (0.15) | 2 | 7 | **10** | 9 | 8 |
| 일관성 (0.10) | 3 | 8 | **10** | 9 | 7 |
| **가중 합** | **4.95** | **7.55** | **8.85** | **8.40** | 7.05 |

### 2.3 정량 비교

| 항목 | A | B | **B'** | B'' | C |
|---|---|---|----|---|---|
| 작업 시간 | ~30분 | ~3h | **~3.5-4.5h** | ~4-5h | ~26h |
| 위험도 | HIGH (1 Low 잔존) | LOW | **LOW + R9/R11 차단** | LOW + Q7 검증 시너지 분리도 ↓ | MED (PoC 회귀 분리도 ↓) |
| 코드 수정 라인 | ~1줄 | ~25줄 | **~28줄 + Cx13 + flag + 활성화** | ~30줄 + Cx1 args 1줄 + tc115 시나리오 | ~250줄+ |
| L3 실측 횟수 | 0 | 1 | **2-3** | 3-4 | 4+ |
| Full baseline | 0 | 1회 | **1회** | 1회 | 2회+ |
| PR 단위 | 단일 (preview placeholder) | 단일 | **단일** | 단일 | 1+α |
| v0.41.2 plan supersede | ❌ | ✅ | ✅ | ✅ | ✅ |
| v0.42.0-preview plan supersede | ❌ | △ | ✅ | ✅ | ✅ |
| 21 agent 스모크 | ❌ | ❌ | **✅** | ✅ | ✅ |
| Cx13 (`experimental.gemma: false`) | ❌ | △ | **✅** | ✅ | ✅ |
| Cx1 (`--ignore-env`) 옵션 | ❌ | ❌ | **△ (별도 cycle)** | ✅ (본 cycle) | ✅ |
| PR #25827 정정 흡수 | ❌ | ❌ | **✅** | ✅ | ✅ |
| v0.43.0-preview.0 § 11 등록 | ❌ | ❌ | **✅** | ✅ | ✅ |

### 2.4 1위 vs 2위 차이 (B' vs B'')

가중 점수 차이: **8.85 - 8.40 = +0.45**.

핵심 차별점: **B''는 Cx1 (`--ignore-env`)을 본 cycle에 통합**. 작업 시간 +30분 + tc115 헤드리스 시나리오 추가. 단 Q7 (Cx1 채택 시 baseline runner CI 안정성 향상 시나리오) 별도 검증 필요 → *본 cycle 회귀 신호와 Q7 검증 신호 분리도 저하*. B' 권장: Cx1 별도 cycle 위임(D2)으로 시너지 분리도 우수.

### 2.5 1위 vs 3위 차이 (B' vs B)

가중 점수 차이: **8.85 - 7.55 = +1.30**.

핵심 차별점: **B는 Cx13 잠금 누락 + 21 agent 스모크 누락 + PR #25827 정정 흡수 누락**. Bx4 default-on 회귀 사전 차단 + LLM 행동 검증 + PR #25827 워크어라운드 유지 명문화 ROI 압도적 (안전성 +2점, bkit 가치 +2점, 학습 효과 +3점).

---

## 3. YAGNI 리뷰

### 3.1 본 cycle 추가 항목 (v0.42.0-preview plan 대비)

> v0.42.0-preview plan에 이미 12개 후보를 검토하여 3 채택 + 2 조건부(stable 한정) + 7 제거로 YAGNI 절감 92.8% 기록. 본 cycle은 **조건부 2건의 활성화 결정**과 **stable 확정으로 인한 신규 항목 4건**을 추가 검토.

| # | 항목 | 채택? | 1줄 근거 |
|---|------|-------|---------|
| 1 | testedVersions에 `0.42.0` 추가 (5개 → 6개) — preview plan 조건부 | **✅ 활성화** (Wave 1.1) | v0.42.0 stable 출시 확정 (2026-05-12 22:29 UTC). D1 시나리오 A 활성 |
| 2 | `package.json` 의존 bump v0.41.2 → v0.42.0 — preview plan 조건부 | **✅ 활성화** (Wave 1.6) | npm `latest` 채널 = v0.42.0. D1 시나리오 A 활성 |
| 3 | `experimental.gemma: false` 명시 잠금 (Cx13) | ✅ 채택 (Wave 1.7) | preview plan §6 D3 그대로 — Bx4 default-on 회귀 사전 차단, No Guessing 강화 1줄 |
| 4 | `lib/gemini/version.js` `hasGemmaDefaultOn: isVersionAtLeast('0.42.0')` flag | ✅ 채택 (Wave 1.2 추가 1개) | preview plan §6 D3 그대로 — Bx4 게이트 (stable 확정으로 active 평가) |
| 5 | `gemini-cli-learning/SKILL.md`에 v0.42.0 stable 1줄 placeholder | ✅ 채택 (Wave 3.3) | Docs=Code, P2 잔존 1 Low. preview plan placeholder 단락을 stable 단락으로 갱신 |
| 6 | **PR #25827 정정 흡수 — 워크어라운드 9 위치 유지 명문화** (본 cycle 신규) | ✅ 채택 (Wave 3.3, SKILL 1줄 + 본 plan §10.4 명문화) | P1 §3.5 정정 확정. v0.42.0 release 브랜치 미포함 → 9 위치 모두 유지. v0.43.0 stable cycle 제거 후보 사전 등록 |
| 7 | **v0.43.0-preview.0 §11 시그널 등록** (본 cycle 신규) | ✅ 채택 (본 plan §11) | P1 §3 시그널 80 commits → 다음 cycle 위임. OAuth #26571 / Subagent Protocol / Session persistence 등록 |
| 8 | **OAuth headless #26571 미포함 R4 신설** (본 cycle 신규) | ✅ 채택 (본 plan §8.1 R4) | P2 §3 분석. bkit scope 외 사용자 책임. 문서화 1줄 권고 (선택) |
| 9 | **R12 (preview train 변동성) 소진** (본 cycle 신규) | ✅ 채택 (본 plan §8.1) | stable 확정으로 변동성 위험 0. preview plan R12를 "소진" 상태로 명문화 |
| 10 | Cx1 (`--ignore-env`) 채택 | ❌ 제거 → 별도 cycle | preview plan D2 그대로. Q7 검증 위임 |
| 11 | Cx2 (Auto Memory inbox flow) 채택 | ❌ 제거 → 별도 cycle | preview plan D4 그대로. v2.1.0 implementation cycle 위임 |
| 12 | Cx4/Cx7/Cx11/Cx14 채택 | ❌ 제거 → 별도 cycle | preview plan §3.1 그대로 |
| 13 | **v0.43.0-preview.0 Subagent Protocol/Session persistence 사전 통합** | ❌ 제거 → 다음 cycle (v0.43.0 stable) | 본 cycle scope 외. v0.42.0 stable 단일 cycle 채택 (§1.3 옵션 A) |
| 14 | **v0.43.0-preview.0 OAuth/chat corruption/async hysteresis fix 백포트** | ❌ 제거 (백포트 불가능) | npm `latest` v0.42.0 채택 시 npm publish 권한 없음. 사용자 build 비실용적 |

**채택률**: 본 cycle 신규 14 후보 중 **9 채택 (1~9) + 5 제거 = YAGNI 절감 64.3%**. preview plan(92.8%)보다 낮은 이유: stable 확정으로 *조건부 2건 활성화* + *PR #25827 정정/R4/R12 소진/v0.43.0 §11 등록* 4건 추가 (정정/문서화/등록은 모두 ROI 압도적).

### 3.2 v0.42.0-preview plan에서 흡수된 채택 항목 (변경 없음)

v0.42.0-preview plan §3.2 흡수 17 채택 항목 그대로 + W1.7 (Cx13) + W2.9/W2.10 (preview train 검증) 인계. 변경 0건.

### 3.3 본 cycle 종합 YAGNI 점검

| 체크 | 결과 |
|---|---|
| "있으면 좋을 것 같은" 기능 포함? | ❌ — Cx1/Cx2/Cx4/Cx7/Cx11 모두 별도 cycle 위임. v0.43.0-preview.0 사전 통합 제거 |
| 사용자 실제 필요 변경? | ✅ — testedVersions 1개 + dependency 1개 + Cx13 1줄 + flag 1개 + SKILL 1줄 + PR #25827 정정 명문화 1줄 |
| bkit 철학 부합? | ✅ — 4원칙 모두 정렬 (Cx13 = No Guessing 강화, Bx0 = Automation First 강화, PR #25827 정정 명문화 = No Guessing 강화) |
| 유지보수 비용 대비 가치? | ✅ — Wave 1.7 5분 + Wave 1.2 5분 + Wave 3.3 5분 + PR #25827 정정 명문화 5분 = 20분, 영구 호환성 + 정정 명문화 |
| 이전 cycle 불필요 패턴 반복? | ❌ — Strategy B' family 검증된 패턴 13회차 (preview plan 골격 ≥95% 재활용) |

---

## 4. 권장 전략 + 거부 안 근거

### 4.1 채택: Strategy B' (Standard + Spot Verification + Cx13/flag P0 통합 + PR #25827 정정 흡수 + D1 시나리오 A 활성화)

**가중 점수 8.85점 (1위, B'' 대비 +0.45, B 대비 +1.30, C 대비 +1.80)**.

### 4.2 1순위 이유 (3가지)

1. **v0.42.0-preview plan의 in-place rename + D1 시나리오 A 활성화만으로 즉시 진입 가능 (~10분)**: P1 §0.1 / P2 §1.1 결론(preview.2 → stable bit-for-bit promotion, code patch 0건, package.json만)에 따라 preview plan 골격 ≥95% 재활용. testedVersions 활성화(1줄) + dependency bump 활성화(1줄) + Cx13 Wave 1.7 + flag Wave 1.2 + SKILL stable 단락 갱신(1줄) + PR #25827 정정 명문화(1줄) = **delta ≤6줄 + 활성화 2건**. v0.42.0 stable 출시 확정으로 즉시 Do 진입 가능.

2. **Strategy B family 13번째 적용 — 검증된 패턴 일관성 + v0.42.0-preview cycle 학습 직접 활용**: 메모리 인덱스 `project_v0420_preview_migration.md`(2026-05-09 작성)의 13회차 학습 + B' 12회차(v0.41.2) + B' 11회차(v0.41.1) 등 12개 cycle 누적 학습 직접 적용. preview cycle에서 검증된 D1~D7 결정 사항 그대로 인계 + R12 소진 / R4 신설 / R5 (v0.43.0 시그널 위임) 추가만.

3. **PR #25827 정정 흡수 + v0.43.0-preview.0 시그널 §11 등록으로 No Guessing 강화**: PR #25827이 2026-05-11 main에 머지됐으나 v0.42.0 release 브랜치 미포함 사실을 *명시적으로 §10.4 + SKILL 단락에 기록*하여 사용자 추측("v0.42.0.x 패치 release에 곧 cherry-pick 되겠지") 행동 사전 차단. v0.43.0-preview.0 시그널 80 commits를 §11에 풀 등록하여 다음 cycle(v0.43.0 stable) 준비도 사전 완료.

### 4.3 거부 안 근거

- **Strategy C (Full + PoC, 26h, 7.05점)**: Cx2/Cx4/Cx7 PoC + v0.43.0-preview.0 사전 fix 백포트 시도 (백포트 사실상 불가능). 작업 시간 가중치 0.25에서 2점 — v2.1.0 시너지가 안전성/작업시간 우위 못 이김. PoC 회귀와 본 cycle 회귀 신호 분리도 저하.

- **Strategy B'' (B' + Cx1 본 cycle 통합, 8.40점)**: B' 대비 +0.45 차이. Cx1 채택 시 baseline runner CI 안정성 향상 시너지 있으나 Q7 검증 신호와 본 cycle 회귀 신호 분리도 저하. 별도 cycle (CI/headless UX) 분리가 검증 신뢰도 우수.

- **Strategy B (Standard, 7.55점)**: B'와 차이는 **Cx13 잠금 누락 + 21 agent 스모크 누락 + PR #25827 정정 흡수 누락**. Bx4 default-on 회귀 사전 차단 + LLM 행동 검증 + PR #25827 워크어라운드 유지 명문화 ROI 압도적 (가중 점수 +1.30).

- **Strategy A (Minimal, 4.95점)**: 30분으로 빠르지만 v0.40.0/v0.41.1/v0.41.2/v0.42.0-preview cycle 흡수 부족 — autoMemory/memoryManager 명문화, 21 agent 스모크, full baseline 회복 검증, gemini-cli-learning SKILL 13단락 모두 누락. 본 cycle을 단일 누적 PR로 닫지 못하고 후속 cycle 부담 누적.

### 4.4 대안 활성화 조건

- **가용 시간 1h 미만 (긴급)** → Strategy A로 강제 축소 (SKILL placeholder 1줄만). 본 plan + 미머지 plans 보존 후 후속 cycle에서 통합.
- **가용 시간 1d 이상 + v2.1.0 cycle 본 cycle과 합치기 결정** → Strategy C로 확장 (Cx2 Auto Memory inbox PoC 포함). 단 PoC 회귀 분리도 저하 — 추천 안 함.
- **Cx1 (`--ignore-env`) baseline runner CI 안정성 향상이 *본 cycle 시급* 결정** → Strategy B''로 확장 (Wave 1.8 신규 + tc115 헤드리스 시나리오 1개 추가 ~30분).
- **R9 21 agent 스모크 결과 회귀 1건 이상 발견** → Wave 2 일시 중단 + 회귀 분석 cycle 진입 (B' → 회귀 cycle).
- **v0.43.0-preview.1 출시 + chat corruption #26534 / async hysteresis #26452 회귀 발생 본 cycle Do 중 발견** → fast-track 별도 cycle 진입 (B' 14회차 가속화).

---

## 5. Wave 분할 (Strategy B', 3.5-4.5h, D1 시나리오 A 활성화)

총 예상 시간: **~3.5-4.5시간** (preview plan 동일 + stable 활성화 ~10분 - dependency/testedVersions 활성화 보류 부담 0). Wave 1 ~50분, Wave 2 ~3-3.5h, Wave 3 ~1h, Buffer ~30분.

### Wave 1 (P0, ~50분) — Critical Patch + 회귀 사전 차단 + v0.40.0/v0.41.x/v0.41.2/v0.42.0 흡수 + Cx13 잠금 + stable 활성화

> v0.42.0-preview plan Wave 1 (~45분) + stable 활성화 (testedVersions/dependency 활성) ~5분.

| # | 작업 | 파일 | 검증 | 의존성 | 시간 |
|---|------|-----|-----|--------|-----|
| W1.1 | **testedVersions에 `"0.40.0", "0.40.1", "0.41.0", "0.41.1", "0.41.2", "0.42.0"` 6개 추가 활성화** (preview plan 조건부 → 본 cycle 활성) | `bkit.config.json:120` | L1 unit (json schema) | — | 2분 |
| W1.2 | v0.40.0+ flag 4개 + v0.41.0+ flag 4개 + **v0.42.0+ `hasGemmaDefaultOn`** 1개 = **9개 신설** | `lib/gemini/version.js:212` 뒤 | L1 unit (`tc04`) | W1.1 | 18분 |
| W1.3 | `general.topicUpdateNarration: false` 명시 잠금 (preview plan W1.3 그대로) | `.gemini/settings.json` | L2 baseline (W2.2 검증) | — | 5분 |
| W1.4 | `experimental.autoMemory: false` + `experimental.memoryManager: false` 명시 (preview plan W1.4 그대로) | `.gemini/settings.json` | L1 (json valid) | W1.3 | 5분 |
| W1.5 | tc38 매트릭스에 9개 항목 추가 (preview plan W1.5: 8개 → 9개) | `tests/suites/tc38-feature-flags-matrix.js` | L1 unit (tc38 PASS) | W1.2 | 17분 |
| W1.6 | **`package.json` `@google/gemini-cli` 의존 v0.39.1 → v0.42.0 bump 활성화** (preview plan 조건부 → 본 cycle 활성) | `package.json` | L1 (npm install OK) | — | 3분 |
| W1.7 | `.gemini/settings.json`에 `experimental.gemma: false` 명시 잠금 (Cx13, preview plan W1.7 그대로) | `.gemini/settings.json` | L1 (json valid) | W1.4 | 5분 |

**Wave 1 산출물**: 7개 파일 수정 (~28줄 + dependency 1줄). v0.42.0 누적 testedVersions 6개 (v0.40.0/0.40.1/0.41.0/0.41.1/0.41.2/v0.42.0).
**Wave 1 AC**: `node tests/run-all.js --suite=tc04,tc38,smoke` PASS + `npm install` 정상 종료 + `experimental.gemma: false` grep 1건 + dependency v0.42.0 lockfile 반영.

### Wave 2 (P1, ~3-3.5h) — Spot Verification + 21 Agent Smoke + Baseline 회복 + Bx 정적 분석 재현

> v0.42.0-preview plan Wave 2 그대로 + npx 호출 v0.42.0으로 활성화.

| # | 작업 | 파일/명령 | 검증 | 의존성 | 시간 |
|---|------|---------|-----|--------|-----|
| W2.1 | tc113/tc107 파일 존재 실측 (preview plan 그대로) | `find tests/suites -name "tc107*" -o -name "tc113*" -o -name "*25655*"` | 부재 시 별도 P1 부채 등록 | — | 10분 |
| W2.2 | topic narration L3 baseline 실측 (**v0.42.0 stable로 갱신**) | `(cd /tmp && npx --yes @google/gemini-cli@0.42.0 -p "list 3 numbers")` 1회 stdout 캡처 | L3 1회 — narration 줄 == 0 | W1.3 | 15분 |
| W2.3 | `tools.core` 키 schema 실측 (**v0.42.0 stable로 갱신**) | `npx --yes @google/gemini-cli@0.42.0 --help` | L3 1회 | — | 15분 |
| W2.4 | bkit-permissions deny 우선순위 spot (preview plan 그대로) | sandbox 시뮬 | L2 spot | — | 15분 |
| W2.5 | **21 agent 회귀 스모크** (R9 차단, preview plan 그대로) | 21개 FULL tier × 1개 샘플 명령 | L2 — 21/21 PASS | W1 전체 | 60분 |
| W2.6 | full baseline 1회 (v0.42.0 install 후 1925/2032 회복) | `node tests/run-all.js` | L2 baseline — pass >= 1925 | W1.6 | 30-60분 |
| W2.7 | 카나리아 PASS (tc115 / tc113 / tc38) | run-all 결과 grep | L2 grep | W2.6 | 5분 |
| W2.8 | a2a-server 미의존 재확인 (preview plan 그대로) | `grep -rn "a2a-server" mcp/ lib/ hooks/ tests/` + `cat package.json \| grep a2a` | grep 결과 docs 외 0건 | — | 5분 |
| W2.9 | **Bx0~Bx4 정적 분석 재현 (P2 §1.1~1.5 grep)** (preview plan W2.9 그대로) | `grep -rn "continueOnFailedApiCall\|InvalidStream\|exit_plan_mode\|Config\.setSessionId" lib/ mcp/ hooks/` | grep 결과 docs/test 외 0건 | — | 5분 |
| W2.10 | **Bx4 Gemma default-on 잠금 검증** (`experimental.gemma: false`가 Wave 1.7 적용 후 baseline에 반영) | `cat .gemini/settings.json \| jq '.experimental.gemma'` → `false` | L1 grep | W1.7 | 3분 |
| **W2.11 (본 cycle 신규)** | **PR #25827 정정 흡수 — bkit 워크어라운드 9 위치 재확인** (P2 §2.2 그대로 유지) | `grep -rn "BKIT_SESSION_START_VERBOSE\|tc113-session-start-duplication" hooks/ tests/ GEMINI.md` | grep 결과 9 위치 그대로 유지 | — | **5분** |

**Wave 2 산출물**: spot 실측 4건 + 21 agent 스모크 + full baseline 회복 + a2a-server grep 0건 + Bx0~Bx4 정적 분석 재현 + Cx13 잠금 검증 + PR #25827 워크어라운드 9 위치 재확인.
**Wave 2 AC**: 21/21 PASS + pass >= 1925 + tc115/tc113/tc38 PASS + a2a-server grep 0건 + Bx grep 0건 + `experimental.gemma == false` + PR #25827 워크어라운드 9 위치 유지.

### Wave 3 (P2, ~1h) — 문서 갱신 + 버전 bump + v2.1.0 trigger 메모 + v0.42.0 stable SKILL 단락 + PR #25827 정정 명문화

> v0.42.0-preview plan Wave 3 + stable SKILL 단락 활성 + PR #25827 정정 명문화 5분.

| # | 작업 | 파일 | 검증 | 의존성 | 시간 |
|---|------|-----|-----|--------|-----|
| W3.1 | GEMINI.md 헤더/footer bkit v2.0.6 → **v2.0.7** | `GEMINI.md:1, 67` | L1 grep | — | 5분 |
| W3.2 | README.md v0.40.0+v0.41.x+v0.41.2+**v0.42.0** testedVersions + 신규 안내 1단락 | `README.md` | L1 grep | W1.1 | 15분 |
| W3.3 | gemini-cli-learning SKILL.md에 **13개 단락** 추가 (v0.40.0 5 + v0.41.x 6 + v0.41.2 1 + **v0.42.0 stable 1단락**: "v0.42.0 stable (2026-05-12 출시): preview.2 bit-for-bit promotion (code 0건). Bx4 Gemma 4 default-on → `.gemini/settings.json` `experimental.gemma: false` 잠금. Cx13 `hasGemmaDefaultOn` flag 신설. Cx1~Cx14 14건 중 Cx13만 채택, 나머지 13건 별도 cycle 위임. **PR #25827 정정**: main MERGED 2026-05-11이나 v0.42.0 release 브랜치 미포함 → SessionStart `systemMessage` 워크어라운드(`BKIT_SESSION_START_VERBOSE` slim default + tc113/tc114 + 7개 tc 환경변수 명시) **v0.42.0 cycle 유지**, v0.43.0 stable cycle 제거 후보. v0.43.0-preview.0 동시 출시 시그널 §11 참조") | `gemini-cli-learning/SKILL.md` | L1 read | — | 30분 |
| W3.4 | `/new` alias + `/voice` slash command 1줄씩 (preview plan 그대로) | 동일 | L1 read | W3.3 | 5분 |
| W3.5 | `bkit.config.json` version `2.0.6` → `2.0.7` (preview plan 그대로) | `bkit.config.json` | L1 (json valid) | — | 1분 |
| W3.6 | v2.1.0 plan trigger 메모 1단락 (preview plan 그대로 + **v0.43.0-preview.0 Subagent Protocol/Session persistence 시너지 메모 1줄 추가**) | `docs/01-plan/features/v2.1.0-context-optimization.plan.md` | L1 read | — | 15분 |
| W3.7 | PR commit message 초안 — `feat(v2.0.7): Gemini CLI v0.39.1 → v0.42.0 cumulative migration + 21 agent smoke + preview train absorption + Gemma 4 lock + PR #25827 정정 명문화` | — | — | W1~W2 | 10분 |

**Wave 3 산출물**: bkit v2.0.7 일관성 (3개 파일) + SKILL 13단락 (v0.42.0 stable 1단락 포함) + v2.1.0 trigger 메모 + PR commit message + PR #25827 정정 명문화.
**Wave 3 AC**: 모든 docs에 0.40.0/0.41.0/0.41.1/0.41.2/**0.42.0** testedVersions 명시 + bkit v2.0.7 일관성 + SKILL에 v0.42.0 stable 풀 단락 + Cx13 잠금 docs 명문화 + PR #25827 정정 명문화.

### Wave 4 (선택, 별도 cycle 위임 — preview plan 그대로 + v0.43.0-preview.0 시그널 추가)

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
| **PR #25827 워크어라운드 9 위치 일괄 제거 (~30분)** | **v0.43.0 stable cycle (PR #25827 v0.43.0-preview.0 포함 → stable 출시 시 자연 해소)** |
| **OAuth headless #26571 자동 흡수** | **v0.43.0 stable cycle (자동 적용, 추가 작업 0건)** |
| **Subagent Protocol (Dx4/Dx5) 호환성 회귀 스모크 (~10분)** | **v0.43.0 stable cycle (lib/gemini/policy.js `generateSubagentRules()` 회귀)** |
| **Session persistence (`/export-session` + `--session-file`, Dx2) PoC** | **v0.43.0 stable cycle 별도 PoC (~30분)** |
| **Snapshotter improvements (Dx7) + adaptive token calculator (Dx8) 자동 흡수** | **v0.43.0 stable cycle (자동 적용)** |
| **Chat corruption #26534 + async hysteresis #26452 fix 자동 흡수** | **v0.43.0 stable cycle (자동 적용)** |

---

## 6. Decisions (D1~D8 — preview plan D1~D7 인계 + D8 신규)

### D1: v0.42.0 stable 출시 시 흡수 정책 (preview plan D1 인계 — 활성화)

**옵션**: (a) preview 단독 PR / (b) v0.41.2 cycle Do와 동시 흡수 (preview 단독) / (c) **stable 출시 대기 후 통합** ← 권장 / (d) v0.42.0 stable cycle 별도 분리

**권장**: (c) **stable 출시 대기 후 통합 단일 PR — 활성화 확정**.

**근거**:
- v0.42.0 stable **출시 확정** (2026-05-12 22:29 UTC). preview plan §9.1 시나리오 A 활성화.
- preview.2 → stable bit-for-bit promotion (code patch 0건) → preview plan 골격 ≥95% 재활용.
- v0.40.0/v0.41.1/v0.41.2/v0.42.0-preview cycle Do 미실행 + 본 cycle delta 1 Low + stable delta 0 = **단일 PR 통합 ROI 압도적**.
- *예외 활성화 조건*: v0.43.0-preview.0 동시 출시(2026-05-12 22:25 UTC)이지만 본 cycle scope 외(§1.3 옵션 A). 다음 cycle(v0.43.0 stable) 위임.

### D2: Cx1 (`--ignore-env`) 채택 여부 (preview plan D2 인계)

**옵션**: (a) 본 cycle Wave 1 통합 / (b) Wave 4 별도 cycle 위임 / (c) **CI/headless UX cycle 별도 분리** ← 권장 / (d) 거절

**권장**: (c) **별도 cycle 위임 — preview plan 결정 그대로**.

**근거**: preview plan D2 그대로. P2 §2 우선순위 P1이지만 *baseline runner CI 안정성 향상 시나리오* 별도 검증 필요(Q7). bkit는 `.env` 직접 사용 0건이라 *부모 .env 누설 시나리오* 별도 e2e 필요. 본 cycle delta와 함께 처리 시 검증 비대칭. 별도 cycle (CI/headless UX) 30분 + tc115 헤드리스 시나리오 1개 추가가 분리도 우수.

### D3: Cx13 (`experimental.gemma: false` 잠금) 채택 여부 (preview plan D3 인계)

**옵션**: (a) **본 cycle Wave 1.7 통합 (1줄 잠금)** ← 권장 / (b) Wave 4 별도 cycle 위임 / (c) 거절

**권장**: (a) **본 cycle Wave 1.7 통합 (5분, 1줄) — preview plan 결정 그대로**.

**근거**: preview plan D3 그대로. Bx4 (Gemma 4 default-on) 회귀 사전 차단 + No Guessing 강화. `.gemini/settings.json`에 1줄 추가 (5분 작업) + `hasGemmaDefaultOn` flag (5분 추가) = 총 10분으로 본 cycle delta 1 Low와 함께 *Wave 1 P0 통합 ROI 압도적*. P2 §7.1 우선순위 P1 권고와 일치.

### D4: Cx2 (Auto Memory inbox) 별도 cycle 분리 여부 (preview plan D4 인계)

**권장**: (c) **v2.1.0 implementation cycle 별도 분리 — preview plan 결정 그대로**.

### D5: PR #25827 워크어라운드 영구화 명문화 여부 (preview plan D5 인계 + 정정 흡수)

**옵션**: (a) **본 cycle Wave 3 SKILL 풀 단락 명문화 + 본 plan §10.4 정정 흡수** ← 권장 / (b) Wave 4 별도 cycle 위임 / (c) 거절

**권장**: (a) **본 cycle Wave 3 SKILL 풀 단락 명문화 + §10.4 정정 흡수 — preview plan D5 + P1 §3.5 정정**.

**근거**:
- **PR #25827 상태 변화 (preview plan 시점 → 본 cycle 시점)**:
  - preview plan 시점(2026-05-09): **OPEN** (7 release 연속 미흡수)
  - 본 cycle 시점(2026-05-13): **MERGED 2026-05-11 16:59 UTC** (main only)
  - v0.42.0 release 브랜치: **미포함** (`compare/{25827_merge}...{v0.42.0_tag}` = diverged 6/54)
  - v0.43.0-preview.0: **포함**
- **bkit 영향**: P2 §2.2 9 위치 모두 **v0.42.0 cycle 유지**. v0.43.0 stable cycle에서 일괄 제거 후보 사전 등록.
- **No Guessing 강화**: SKILL.md에 *"PR #25827 main 머지됐으나 v0.42.0 release 브랜치 미포함 → 워크어라운드 v0.42.0 cycle 유지"* 1줄 추가로 사용자 추측("v0.42.0.x 패치 release에 곧 cherry-pick 되겠지") 행동 사전 차단.

### D6: 21 agent 회귀 스모크 범위 (preview plan D6 인계)

**권장**: (a) **21개 전체 (~60분) — preview plan 결정 그대로 (R9 차단)**.

### D7: testedVersions 누적 정책 (preview plan D7 인계 + N=12 trigger 본 cycle 발동 검토)

**옵션**: (a) **모두 누적 (`["0.34.0", ..., "0.42.0"]`)** ← 권장 / (b) 최근 N개 / (c) 최신 1개

**권장**: (a) **모두 누적 — preview plan D7 그대로**.

**근거**: preview plan §6 D7에서 *N=12 도달 → 다음 cycle 재검토 정식 발동*으로 트리거. 본 cycle은 N=13 도달 → **다음 cycle (v0.43.0 stable)에서 D7 재검토 정식 발동**. 본 cycle은 여전히 모두 누적 유지 (testedVersions 6개 추가 자체로는 작업 부담 미미).

### D8 (본 cycle 신규): v0.43.0-preview.0 시그널 등록 깊이

**옵션**: (a) **§11에 80 commits 시그널 풀 등록 (다음 cycle 진입 시 즉시 활용)** ← 권장 / (b) Wave 4에 1줄 메모만 / (c) 등록 생략

**권장**: (a) **§11에 풀 등록**.

**근거**: P1 §3 / P2 §4 에서 80 commits 시그널 9건 핵심 PR 본문 직접 검증 완료. 다음 cycle 진입 시 P1/P2 재작업 부담 감소 (~30분 절감). 풀 등록 ROI 압도적.

---

## 7. 미해결 검증 항목 답변/위임 (P2 §8 Q6~Q10)

| Q# | 질문 | 본 P3 답변 또는 Do 위임 |
|---|---|---|
| **Q6** | v0.42.0 stable 시점 PR #25186 ToolDisplay refactor schema 변경 회귀 | **본 P3 0건 확정** — P2 §1.2 (Bx1 stable 추가 변경 0건). v0.43.0-preview.0에서 추가 진행. Wave 2.6 full baseline + W2.9 Bx grep 정적 분석 재현으로 동적 검증 |
| **Q7** | bkit `--ignore-env` (Cx1) 채택 시 baseline runner CI 안정성 향상 시나리오 | **별도 cycle 위임** — D2 권고. CI/headless UX cycle에서 `mcp/bkit-server.js:1097` args 추가 + tc115 헤드리스 시나리오 1개 30분 |
| **Q8** | bkit `experimental.gemma: false` 명시 잠금 시 Bx4 영향 0건 사전 차단 | **본 P3 채택** — D3 Wave 1.7 1줄 + W2.10 검증 + flag W1.2 |
| **Q9** | PR #25827 워크어라운드 9 위치(P2 §2.2)를 v0.43.0 stable cycle에서 일괄 제거 시 회귀 위험 | **다음 cycle (v0.43.0 stable) 위임** — 매우 낮음 (BKIT_SESSION_START_VERBOSE 환경변수 폐기, verbose default 복원만). v0.43.0 stable cycle Wave 2에서 tc113/tc114 회귀 스모크 + 7개 tc01/08/10/22 환경변수 명시 제거 (~30분) |
| **Q10** | v0.43.0-preview.0 Session persistence(#26514)가 bkit `.bkit/state/`와 namespace 충돌 | **본 P3 0건 확정** — P2 §4.2.2 schema/디렉토리 모두 직교 확정. v0.43.0 stable cycle에서 `--session-file` PoC 시 추가 검증 (~30분) |

**기존 Q1~Q5 (v0.41.2 plan)** 모두 *Do 단계 처리* 그대로 유효 (Wave 2.1~Wave 2.7 인계).

**모든 10건 (v0.41.2 5건 + preview cycle 3건 + 본 cycle 2건) Do 단계 또는 별도 cycle에서 해소 가능**. 본 P3에서 추가 분석 불필요.

---

## 8. 위험 관리 (R1~R15, preview plan R1~R14 인계 + R15 신규)

### 8.1 리스크 매트릭스

preview plan §8.1 R1~R14 그대로 + R12 소진 + R4 신설 + R15 신규.

| ID | 리스크 | 가능성 | 영향 | 완화책 | 잔존 위험 |
|----|--------|-------|------|--------|----------|
| R1~R11 | (preview plan §8.1 그대로 — topic narration / 4-tier paths / #25827 / v0.42.0 출시 / hidden regression / YOLO+deny / tc113 부재 / 키 위치 / R9 21 agent 스모크 / tools.core 키 schema / R11 a2a-server 미의존) | — | — | — | LOW |
| **R12 (소진)** | preview.2 → v0.42.0 stable 사이 추가 cherry-pick 변동성 | **소진** (stable 확정으로 변동성 위험 0) | — | P1 §0.1 확정: stable = preview.2 bit-for-bit promotion (code 0건). R12 폐기 | **소진** |
| R13 | `experimental.gemma: false` 잠금 누락 시 stable 머지 후 모델 자동 추론 변화 | 매우 낮음 | 매우 낮음 (사용자 prompt 의존이므로 모델 명시 시 무관) | D3 Wave 1.7 1줄 잠금 + W2.10 검증 | NEAR-ZERO |
| R14 | 단독 cycle 처리 시 v0.41.2 + 본 cycle + stable cycle = 3개 plan 누적 부담 | **소진** (D1 시나리오 A 활성화로 통합 단일 PR) | 중간 | D1 시나리오 A 활성화 | **소진** |
| **R4 (본 cycle 신규 — preview plan §3.4 갱신)** | **OAuth headless silent hang #26571 v0.42.0 stable 미포함 — 사용자 환경에서 hang** | 낮음 | 매우 낮음 (bkit scope 외, 사용자 책임) | P2 §3.4: bkit OAuth 사용 0건. 문서화 1줄 권고 (선택, GEMINI.md/README) + v0.43.0 stable 자동 해소 | LOW |
| **R15 (본 cycle 신규)** | **v0.43.0-preview.0 Subagent Protocol 추상화(#25302/#25303)가 v0.43.0 stable에서 bkit 정책 호환성 깨뜨림** | 매우 낮음 (P2 §4.1.3 0건 확정) | 낮음 (lib/gemini/policy.js TOML 회귀 가능) | v0.43.0 stable cycle Wave 2에서 policy.js `generateSubagentRules()` 회귀 스모크 (~10분). 본 cycle 작업 0건 | LOW |
| **R16 (본 cycle 신규)** | **PR #25827 main 머지(2026-05-11) 정정 흡수 누락 시 사용자 추측 행동 (워크어라운드 제거 시도)** | 중간 (사용자가 PR 머지 발견 시) | 낮음 (워크어라운드 제거 시 tc113 회귀) | D5 SKILL 풀 단락 명문화 + 본 plan §10.4 정정 흡수 + tc113/tc114 회귀 카나리아 유지 | NEAR-ZERO |

**전체 위험도**: **LOW**. preview plan 위험 수준 그대로 + R12/R14 소진 + R4/R15/R16 신규 모두 완화 가능.

### 8.2 21 agent 회귀 스모크 절차 (preview plan §8.2 그대로)

1. 21개 FULL tier agent × 1개 표준 명령 (예: `/agents refresh` 또는 자기 진단 query) 실행
2. PASS = 표준 응답 패턴 확인 (응답 길이 > 0 + 명령 거부 0건)
3. FAIL 1건 이상 시 Wave 2 일시 중단 → 회귀 분석 cycle 진입
4. 21/21 PASS 시 Wave 2.6 full baseline 진입

### 8.3 롤백 전략 (preview plan §8.3 그대로 + R4/R15/R16 추가)

- **L1 rollback**: `git revert <commit-sha>` — atomic
- **L2 rollback**: `~/.gemini/settings.json` user-scope override
- **L3 rollback**: `npx --yes @google/gemini-cli@0.41.2` 다운그레이드 (testedVersions에 0.41.2 유지)
- **R9 rollback**: 21 agent 스모크 실패 시 Wave 1 commit 직전으로 되돌리기 + 회귀 분석 cycle
- **R12 rollback**: **소진** (불필요)
- **R13 rollback (Cx13 Gemma 잠금)**: `experimental.gemma: false` 제거 (1줄 revert)
- **R14 rollback**: **소진** (D1 시나리오 A 활성화)
- **R4 rollback (OAuth #26571)**: bkit scope 외 (사용자 책임). 사용자 환경에서 v0.41.2 fallback 권고 + v0.43.0 stable 자동 해소
- **R15 rollback (Subagent Protocol)**: v0.43.0 stable cycle에서만 발생 가능 (본 cycle 0건)
- **R16 rollback (PR #25827 정정 흡수)**: SKILL 단락 + §10.4 명문화 revert (1단락 제거) + 워크어라운드 9 위치 그대로 유지
- **v0.42.0 specific rollback**: `package.json` 의존을 v0.41.2로 다운그레이드 + testedVersions에서 `0.42.0` 1줄 제거

### 8.4 사전/사후 카나리아

| 시점 | 카나리아 | 통과 기준 |
|---|---|---|
| **사전** | tc115 (trust env) PASS, tc113 (#25655 SessionStart) PASS | v0.39.1 baseline 회복 |
| **사후 (Wave 2 종료)** | 동일 카나리아 + 21 agent 스모크 21/21 + a2a-server grep 0건 + Bx grep 0건 + `experimental.gemma == false` + **PR #25827 워크어라운드 9 위치 grep 재확인** | 6축 PASS |
| **사후 (Wave 3 종료)** | bkit v2.0.7 일관성 grep + SKILL 13단락 (v0.42.0 stable 1단락 포함) + testedVersions 6개 + Cx13 잠금 docs + **PR #25827 정정 명문화 grep** | docs grep PASS |

---

## 9. v0.42.0 stable 출시 흡수 정책 (D1 시나리오 A 활성화 — preview plan §9 갱신)

### 9.1 시나리오 A — 본 plan 활성화 ← 권장 + 활성

**조건**: v0.42.0 stable 출시 확정 (**2026-05-12 22:29 UTC** — 본 P3 작성 시점 ~14시간 경과). **조건 충족 → 활성화 확정**.

**작업**:
1. ✅ 본 plan을 `gemini-cli-v0.42.0-migration.plan.md`로 신설 (preview plan을 stable rename 패턴 적용) — **본 P3 작업 = 활성화 완료**
2. ✅ P1 + P2 산출물 stable 재검증 완료 (release notes diff 결과: stable = preview.2 bit-for-bit promotion)
3. ✅ Wave 1.1 testedVersions 6개 활성화 (`"0.42.0"` 추가)
4. ✅ Wave 1.6 dependency bump v0.41.2 → v0.42.0 활성화
5. ✅ R12 (preview.2 → stable cherry-pick) **소진 확정** (W2.9 Bx grep 재현으로 추가 검증)

**총 시간**: ~3.5-4.5h (preview plan + ~10분 stable 활성화 + ~10분 PR #25827 정정 흡수).

**ROI**: ⬛⬛⬛⬛⬛ — v0.40.0/v0.41.1/v0.41.2/v0.42.0-preview cycle Do + 본 cycle delta + stable delta 통합 단일 PR. 미머지 plan 부담 일괄 해소.

### 9.2 시나리오 B — preview.2 단독 cycle 진입 (소진)

**소진**: stable 출시 확정 → 시나리오 B 불필요.

### 9.3 시나리오 C — v0.41.2 cycle Do와 동시 통합 (소진)

**소진**: stable 출시 확정 → 시나리오 A 활성화로 v0.41.2 cycle Do + 본 cycle delta + stable delta 통합 단일 PR.

### 9.4 시나리오 비교 (최종 확정)

| 시나리오 | 조건 | 시간 | PR 수 | ROI | 상태 |
|---|---|---|---|---|---|
| **A (권장 + 활성)** | stable 출시 확정 (2026-05-12 22:29 UTC) | ~3.5-4.5h | **1개** | ⬛⬛⬛⬛⬛ | **활성화 확정** |
| B (백업) | stable 1주 이상 지연 | (불필요) | — | — | **소진** |
| C (대안) | stable 직전 2일 내 v0.41.2 Do 결정 | (불필요) | — | — | **소진** |

**최종 활성화**: **시나리오 A**. 본 plan = stable rename + D1 시나리오 A 활성화 + R12/R14 소진 + R4/R15/R16 신설.

---

## 10. Acceptance Criteria (AC)

### 10.1 정량 (10건)

1. **L1 unit**: tc04 / tc38 / smoke PASS (Wave 1 종료)
2. **L2 baseline**: `node tests/run-all.js` pass >= 1925 (v0.39.1 baseline 회복) — Wave 2.6
3. **L3 spot (narration)**: topic narration noisy line == 0 (W1.3 적용 후 v0.42.0 npx 격리 실측) — Wave 2.2
4. **L3 spot (tools.core)**: 키 schema 명칭 확정 (`tools.core` vs `tools.coreTools`) — Wave 2.3
5. **회귀 카나리아**: tc115 PASS + tc113 PASS — Wave 2.7
6. **21 agent 스모크**: 21/21 PASS — Wave 2.5 (R9 차단)
7. **bkit 버전**: GEMINI.md / README.md / bkit.config.json 모두 `bkit v2.0.7` 일관 — Wave 3
8. **Cx13 잠금**: `.gemini/settings.json`에 `experimental.gemma: false` 명시 — Wave 1.7 + W2.10
9. **dependency 활성화**: `package.json` `@google/gemini-cli` v0.42.0 + `package-lock.json` 반영 — Wave 1.6 + W2.6 npm install
10. **PR #25827 정정 흡수**: SKILL 단락 + 본 plan §10.4 + 워크어라운드 9 위치 grep 재확인 — Wave 3.3 + W2.11

### 10.2 정성 (8건)

1. **YAGNI 준수**: Wave 4 별도 cycle 위임 그대로 + Cx1/Cx2/Cx4/Cx7/Cx11/Cx14 모두 별도 cycle 위임 + v0.43.0-preview.0 사전 통합 거부
2. **외부 인터페이스 실측**: tc113/tc107, narration L3, tools.core schema, YOLO+deny, **21 agent 스모크**, **a2a-server grep 0건 재확인**, **Bx0~Bx4 정적 분석 재현**, **PR #25827 워크어라운드 9 위치 재확인** — 모두 spot 실측 결과 명시
3. **Strategy B' 13번째 적용**: 메모리 인덱스에 누적된 12개 cycle 학습 + preview cycle 학습 적용 + 본 cycle 학습 추가
4. **v0.40.0/v0.41.x/v0.41.2/v0.42.0-preview/v0.42.0 cycle 흡수**: 5개 cycle 모두 단일 PR로 통합 — 각 plan supersede 명시 (D1 시나리오 A 활성화)
5. **Decisions 명문화**: D1~D8 모두 명시 + N=13 trigger (D7 재검토 차기 cycle 발동) + D8 v0.43.0-preview.0 시그널 §11 풀 등록
6. **R12/R14 소진 + R4/R15/R16 신설 명문화**: stable 확정으로 변동성 위험 0 + bkit scope 외 사용자 책임 + v0.43.0 시그널 위임 + PR #25827 정정 흡수
7. **bkit 4대 철학 정합성**: P2 §5 (5 강화 / 3 중립 / 0 충돌) 유지 + No Guessing 강화 (PR #25827 정정 명문화)
8. **v0.43.0-preview.0 §11 풀 등록**: 80 commits 시그널 9건 핵심 PR + 5건 fix 자동 흡수 후보 등록 → 다음 cycle 진입 시 P1/P2 재작업 부담 감소

### 10.3 체크리스트 형식 (구현 항목)

#### Wave 1 (P0) — 7 항목
- [ ] W1.1: `bkit.config.json:120` testedVersions 6개 추가 (`"0.40.0", "0.40.1", "0.41.0", "0.41.1", "0.41.2", "0.42.0"`)
- [ ] W1.2: `lib/gemini/version.js:212` 뒤에 9개 flag 신설 (v0.40.0+ 4개 + v0.41.0+ 4개 + **v0.42.0+ `hasGemmaDefaultOn`** 1개)
- [ ] W1.3: `.gemini/settings.json`에 `general.topicUpdateNarration: false` 명시
- [ ] W1.4: `.gemini/settings.json`에 `experimental.autoMemory: false` + `experimental.memoryManager: false` 명시
- [ ] W1.5: `tests/suites/tc38-feature-flags-matrix.js`에 9개 항목 추가
- [ ] W1.6: `package.json` `@google/gemini-cli` 의존 v0.39.1 → **v0.42.0** bump + `npm install`
- [ ] W1.7: `.gemini/settings.json`에 `experimental.gemma: false` 명시 잠금 (Cx13)
- [ ] **Wave 1 AC**: `node tests/run-all.js --suite=tc04,tc38,smoke` PASS + `experimental.gemma: false` grep 1건 + `package-lock.json` v0.42.0 반영

#### Wave 2 (P1) — 11 항목
- [ ] W2.1: `find tests/suites -name "tc107*" -o -name "tc113*" -o -name "*25655*"` 실측 — 부재 시 별도 P1 부채 등록
- [ ] W2.2: `(cd /tmp && npx --yes @google/gemini-cli@0.42.0 -p "list 3 numbers")` 1회 stdout 캡처 — narration 줄 == 0
- [ ] W2.3: `npx --yes @google/gemini-cli@0.42.0 --help` schema 실측 — `tools.core` 명칭 확정
- [ ] W2.4: sandbox 시뮬 bkit-permissions deny 우선순위 spot
- [ ] W2.5: 21개 FULL tier agent × 1개 샘플 명령 실행 — 21/21 PASS (R9 차단)
- [ ] W2.6: `node tests/run-all.js` 1회 — pass >= 1925 (v0.39.1 baseline 회복)
- [ ] W2.7: run-all 결과 grep — tc115 PASS + tc113 PASS + tc38 PASS
- [ ] W2.8: `grep -rn "a2a-server" mcp/ lib/ hooks/ tests/` + `cat package.json | grep a2a` — docs 외 0건
- [ ] W2.9: `grep -rn "continueOnFailedApiCall\|InvalidStream\|exit_plan_mode\|Config\.setSessionId" lib/ mcp/ hooks/` — docs/test 외 0건
- [ ] W2.10: `cat .gemini/settings.json | jq '.experimental.gemma'` → `false`
- [ ] W2.11: `grep -rn "BKIT_SESSION_START_VERBOSE\|tc113-session-start-duplication" hooks/ tests/ GEMINI.md` — 9 위치 그대로 유지
- [ ] **Wave 2 AC**: 21/21 + pass >= 1925 + tc115/tc113/tc38 PASS + 4종 grep 모두 충족 + PR #25827 워크어라운드 9 위치 유지

#### Wave 3 (P2) — 7 항목
- [ ] W3.1: `GEMINI.md:1, 67` bkit v2.0.6 → v2.0.7
- [ ] W3.2: `README.md`에 v0.42.0 testedVersions + 신규 안내 1단락
- [ ] W3.3: `gemini-cli-learning/SKILL.md`에 13개 단락 추가 (v0.40.0 5 + v0.41.x 6 + v0.41.2 1 + **v0.42.0 stable 1단락** = PR #25827 정정 명문화 포함)
- [ ] W3.4: `/new` alias + `/voice` slash command 1줄씩
- [ ] W3.5: `bkit.config.json` version `2.0.6` → `2.0.7`
- [ ] W3.6: `docs/01-plan/features/v2.1.0-context-optimization.plan.md` trigger 메모 1단락 + v0.43.0-preview.0 시너지 1줄
- [ ] W3.7: PR commit message 초안 작성
- [ ] **Wave 3 AC**: bkit v2.0.7 일관성 + SKILL 13단락 (v0.42.0 stable 풀 단락) + testedVersions 6개 + Cx13 잠금 docs + PR #25827 정정 명문화

---

## 11. v0.43.0-preview.0 시그널 등록 (D8 신규 — 다음 cycle 위임)

> v0.43.0-preview.0 출시: 2026-05-12 22:25 UTC (v0.42.0 stable 출시 4분 전). 80 commits / 300 files / 14 new contributors. 본 cycle scope **외**. 다음 cycle (v0.43.0 stable) 진입 시 즉시 활용 목적으로 풀 등록.

### 11.1 v0.42.0 → v0.43.0-preview.0 핵심 신기능 9건 (P1 §3.2 그대로)

| # | PR | 신기능 | 다음 cycle bkit 영향 추정 |
|---|---|---|---|
| Dx1 | #26480 | `feat(core): steer model to use edit tool for surgical edits` | 🟢 긍정 (자동 적용) |
| **Dx2** | #26514 | **`feat: export session to file and import via flag`** — `/export-session <path>` + `--session-file <path>` | 🟢 **매우 높음** — bkit 자동화 baseline runner cycle 재사용 PoC (~30분, 별도) |
| Dx3 | #25637 | `Feat: Add Machine Hostname to CLI interface` | 🟢 Low |
| **Dx4** | #25302 | **`feat(core): add LocalSubagentProtocol behind AgentProtocol`** | 🟡 중간 (P2 §4.1.3 0건 확정. lib/gemini/policy.js `generateSubagentRules()` 회귀 스모크 ~10분) |
| **Dx5** | #25303 | **`feat(core): add RemoteSubagentProtocol behind AgentProtocol`** | 🟡 중간 (bkit A2A 미사용, 호환성 회귀 스모크 ~10분) |
| Dx6 | #26676 | `feat(acp/core): prefix tool call IDs with tool names` | 🟢 Low (bkit ACP 미사용) |
| **Dx7** | #26655 | **`feat(context): Improvements to the snapshotter`** | 🟡 중간 (자동 적용, namespace 분리) |
| **Dx8** | #26888 | **`feat(context): Introduce adaptive token calculator`** | 🟢 baseline runner 컨텍스트 한계 정확성 향상 (자동 적용) |
| Dx9 | #26528 | `feat(evals): add shell command safety evals` | 🟢 Low |

### 11.2 v0.42.0 → v0.43.0-preview.0 중요 fix 흡수 5건 (P1 §3.3 그대로)

| PR | fix | 본 cycle 처리 | 다음 cycle (v0.43.0 stable) 처리 |
|---|---|---|---|
| **#25827** | `fix(cli): prevent duplicate SessionStart systemMessage render` (Issue #25655) | **워크어라운드 9 위치 유지 (D5/§10.4 명문화)** | **워크어라운드 일괄 제거 (~30분, Wave 2)** |
| #26534 | `fix(core): chat corruption bug in context manager` | 미포함 (v0.42.0 stable) | 자동 흡수 |
| #26452 | `fix(core): Fix hysteresis in async context management pipelines` | 미포함 (v0.42.0 stable) | 자동 흡수 |
| **#26571** | `fix(core): prevent silent hang during OAuth auth on headless Linux` | **R4 신설 (사용자 책임, 문서화 1줄 권고 선택)** | 자동 흡수 |
| #25186 | `refactor(cli): migrate core tools to native ToolDisplay property` (Bx1) | stable 추가 변경 0건 (Q6 0건 확정) | 추가 부분 포함 (자동 적용) |

### 11.3 다음 cycle 작업 사전 예측 (B' 14회차)

| Wave | 작업 | 시간 | 비고 |
|---|---|---|---|
| W1 | testedVersions `0.43.0` 추가 + dependency bump | ~5분 | preview plan 패턴 그대로 |
| W2 | 21 agent 스모크 + baseline 회복 + **policy.js `generateSubagentRules()` 회귀 스모크** (R15) | ~3h | preview plan 패턴 + R15 추가 ~10분 |
| W2 | **PR #25827 워크어라운드 9 위치 일괄 제거** (Q9, ~30분) | ~30분 | 본 cycle §10.4 명문화에서 v0.43.0 stable cycle 제거 후보로 명시. v0.43.0-preview.0에 #25827 포함 → 자연 해소 |
| W2 | OAuth headless #26571 자동 흡수 검증 | ~5분 | R4 자동 해소 |
| W3 | SKILL.md에 v0.43.0 stable 풀 단락 + Subagent Protocol 명문화 + Session persistence 시너지 | ~30분 | preview plan 패턴 |
| W3 | `bkit.config.json` version `2.0.7` → `2.0.8` | ~1분 | preview plan 패턴 |
| W4 (선택) | Session persistence (`--session-file`) PoC 별도 cycle | ~30분 | 별도 cycle 분리 권장 |

**다음 cycle (v0.43.0 stable) 예상 시간**: ~3.5-4.5h (본 cycle과 동일 — B' 패턴 일관성).

### 11.4 다음 cycle 진입 트리거

- **v0.43.0 stable 출시 확정** (preview.0 → stable 표준 burn-in ~6-14일 → 추정 2026-05-18 ~ 2026-05-26)
- **본 cycle Do 완료 + main 머지** (PR #25 가칭)
- **P1/P2 재작업 부담**: ~30분 (v0.43.0-preview.0 시그널이 §11에 풀 등록되어 있어 P1 80% / P2 70% 흡수 가능)

---

## 12. Cx 시리즈 본 cycle 처리 매트릭스 (Cx1~Cx14 — preview plan §12 인계)

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

**본 cycle 채택**: **Cx13 1건만 (preview plan과 동일)**. 나머지 13건 모두 별도 cycle 위임 또는 자동 적용/배제. YAGNI 절감 92.8% (preview plan 그대로).

---

## 13. References (P1, P2, prior plans)

- **Phase 1 Research (v0.42.0 stable delta, 2026-05-13)**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/research/gemini-cli-v0.42.0-research.md` (416 lines)
- **Phase 2 Impact (v0.42.0 stable, 2026-05-13)**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/03-analysis/gemini-cli-v0.42.0-impact.analysis.md` (417 lines)
- **v0.42.0-preview plan (supersede 후보)**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/features/gemini-cli-v0.42.0-preview-migration.plan.md` (590 lines, B' 13회차 preview train)
- **v0.42.0-preview report (참조)**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/04-report/gemini-cli-v0.42.0-preview-migration.report.md`
- **v0.41.2 plan (supersede 후보)**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/features/gemini-cli-v0.41.2-migration.plan.md`
- **v0.41.1 plan (이미 v0.41.2 plan에 흡수)**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/features/gemini-cli-v0.41.1-migration.plan.md`
- **v0.40.0 plan (이미 v0.41.1 plan에 흡수)**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/features/gemini-cli-v0.40.0-migration.plan.md`
- **v0.41.2 report (참조)**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/04-report/gemini-cli-v0.41.2-migration.report.md`
- **이전 cycle plans (Strategy B' family 1~12)**:
  - v0.39.1 (8th): `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/features/gemini-cli-v0.39.1-migration.plan.md`
  - v0.39.0 (7th): `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/features/gemini-cli-v0.39.0-migration.plan.md`
  - v0.38.2 (6th): `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/features/gemini-cli-v0.38.2-migration.plan.md`
- **bkit 철학**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/bkit-system/philosophy/{core-mission,ai-native-principles,context-engineering,workflow-philosophy}.md`
- **메모리 인덱스**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/.claude/agent-memory/migration-strategist/MEMORY.md` + `project_v0420_preview_migration.md` (preview cycle 13회차 학습)

---

## 14. 다음 단계 (P4 위임)

### 14.1 종합 보고서 작성 항목 (P4)

1. **D1~D8 사용자 결재 확정** — D1 시나리오 A 활성화 (이미 본 P3에서 활성화), D8 v0.43.0-preview.0 §11 풀 등록 확정
2. **R4/R15/R16 위험 모니터링** — OAuth #26571 사용자 책임 영역, Subagent Protocol 다음 cycle 위임, PR #25827 정정 명문화
3. **본 plan supersede 정책 명시** — v0.40.0/v0.41.x/v0.41.2/v0.42.0-preview plans 모두 supersede
4. **Strategy B family 13회차 학습 메모리 갱신** — `MEMORY.md` + `project_v0420_migration.md` 신설 (preview cycle 메모와 분리: preview cycle은 P3 plan 작성 단계, 본 cycle은 stable 활성화 단계)
5. **PR 생성** — 단일 PR, commit message: `feat(v2.0.7): Gemini CLI v0.39.1 → v0.42.0 cumulative migration + 21 agent smoke + preview train absorption + Gemma 4 lock + PR #25827 정정 명문화`

### 14.2 사용자 결재 후 Do 진입 시 즉시 적용 가능 여부

✅ **즉시 진입 가능**.

근거:
- 본 plan은 preview plan 골격 ≥95% 재활용 — Wave 1~3 모두 검증된 패턴
- stable 활성화 ≤10분 추가 작업 + PR #25827 정정 명문화 ≤10분 추가 = ~20분 추가
- v0.42.0 stable 출시 확정 (2026-05-12 22:29 UTC) — D1 시나리오 A 활성화 조건 충족
- R12 (preview train 변동성) 소진 + R14 (단독 cycle 부담) 소진
- R4 (OAuth #26571) 사용자 책임 명문화 + R15 (Subagent Protocol) 다음 cycle 위임 + R16 (PR #25827 정정 흡수 누락) 명문화
- Strategy B' 13회차 — 메모리 누적 학습 적용 가능

### 14.3 P4 보고서 출력 경로

`docs/04-report/gemini-cli-v0.42.0-migration.report.md` (P3 결재 후 작성)

---

## 15. bkit 기능 고도화 기회 (v0.40.0 ~ v0.42.0 누적 + v0.43.0-preview.0 시그널)

> P2 §7 활용 후보 + v0.43.0-preview.0 시그널을 종합한 bkit 발전 방향. 본 cycle scope 외이지만 메인 세션 요청에 따라 식별.

### 15.1 본 cycle 즉시 채택 (P0/P1 통합)

| 후보 | PR | 채택 위치 | 가치 |
|---|---|---|---|
| **Cx13**: `experimental.gemma: false` 잠금 | #26307 | Wave 1.7 + W2.10 | Bx4 default-on 회귀 사전 차단 + No Guessing 강화 |

### 15.2 별도 cycle 채택 후보 (P3 brainstorm 위임 — 활용 가치 높은 순)

| 후보 | PR | 별도 cycle | 가치 |
|---|---|---|---|
| **Dx2**: `/export-session` + `--session-file` (Session persistence) | #26514 | v0.43.0 stable cycle PoC | bkit baseline runner cycle 재사용 — CI 결정성 향상 (매우 높음) |
| **Cx1**: `--ignore-env` flag | #26445 | CI/headless UX cycle | baseline runner CI 안정성 향상 (높음, Q7 검증 통합) |
| **Cx2**: Auto Memory inbox flow | #26338 | v2.1.0 implementation cycle | autoMemory PoC 통합 — Tiered Memory 시너지 (중간) |
| **Dx8**: adaptive token calculator | #26888 | v0.43.0 stable cycle 자동 흡수 | baseline runner 컨텍스트 한계 정확성 향상 (자동) |
| **Cx7**: `/commands list` subcommand | #22324 | health-check skill cycle | skill-status / audit 보강 (낮음) |
| **Cx11**: `/agents refresh logging` | #26442 | list_agents diagnostics cycle | 진단 도구 보강 (낮음) |

### 15.3 자동 흡수 (다음 cycle 통합)

| 후보 | PR | 다음 cycle 통합 | 가치 |
|---|---|---|---|
| #26571 OAuth headless silent hang fix | #26571 | v0.43.0 stable cycle 자동 흡수 | bkit scope 외 사용자 환경 영향 (R4 자동 해소) |
| #26534 chat corruption fix | #26534 | v0.43.0 stable cycle 자동 흡수 | context manager 안정성 (자동) |
| #26452 async context hysteresis fix | #26452 | v0.43.0 stable cycle 자동 흡수 | async context 안정성 (자동) |
| #25827 SessionStart `systemMessage` fix | #25827 | v0.43.0 stable cycle 자동 흡수 + bkit 워크어라운드 9 위치 제거 (Q9, ~30분) | tc113/tc114 회귀 카나리아 활용 + 워크어라운드 코드 축소 |

### 15.4 streamlined UX / Tiered Memory / adaptive token calculator 활용 방안

#### 15.4.1 Tiered Memory 활용 방안 (Cx2 Auto Memory inbox + bkit `.bkit/state/memory.json`)

- **현재 상태**: bkit는 자체 `.bkit/state/memory.json` + agent별 memory 디렉토리 (`/.claude/agent-memory/<agent>/`) 운용. 4-Tier Memory 구조.
- **Cx2 활용 시나리오**: bkit가 *gemini-cli autoMemory inbox*를 보조 채널로 활용 → 사용자 검토 후 4-Tier Memory로 통합. *Tiered Memory 자동 staging* 효과.
- **위험**: namespace 충돌 가능성 → opt-in 설계 필요 (v2.1.0 implementation cycle 위임).

#### 15.4.2 streamlined UX 활용 방안 (Cx11 `/agents refresh logging` + bkit `list_agents` skill)

- **현재 상태**: bkit `list_agents` skill이 21 agent 카탈로그 + tier 정보 제공.
- **Cx11 활용 시나리오**: `/agents refresh` 시 bkit `list_agents` 호출 → 진단 정보(로딩 시간, tier, 메모리 사용량) 노출. *list_agents diagnostics cycle*.

#### 15.4.3 adaptive token calculator 활용 방안 (Dx8 #26888 + bkit baseline runner)

- **현재 상태**: bkit baseline runner는 context budget 추정에 *gemini-cli 내부 토큰 계산기* 의존. 부정확 가능성.
- **Dx8 활용 시나리오**: v0.43.0 stable 자동 흡수 → baseline runner context budget 추정 자동 정확화. 추가 작업 0건.

#### 15.4.4 Session persistence 활용 방안 (Dx2 `--session-file` + bkit baseline runner)

- **현재 상태**: bkit baseline runner는 각 test suite 실행마다 새 session 생성. cycle 재현성은 prompt 기반.
- **Dx2 활용 시나리오**: baseline runner 단계별 session export → re-run 시 재사용. *CI 결정성 향상*. v0.43.0 stable cycle PoC 별도 (~30분).

---

## Appendix A. v0.42.0-preview plan 대비 본 plan delta 표 (≤8건)

| # | 항목 | v0.42.0-preview plan | **v0.42.0 stable plan (본)** | 본 cycle 변경 사유 |
|---|------|-------------|-------------|------------------|
| 1 | D1 시나리오 | A/B/C 분기 | **A 활성화 확정** | stable 출시 확정 (2026-05-12 22:29 UTC) |
| 2 | testedVersions / dependency 활성화 | 조건부 (D1-A 한정) | **활성화 (Wave 1.1 / 1.6)** | D1 시나리오 A 활성 |
| 3 | R12 (preview train 변동성) | 신설 (LOW) | **소진** (stable 확정 변동성 0) | stable = preview.2 bit-for-bit promotion |
| 4 | R14 (단독 cycle 부담) | 신설 (LOW, D1 시나리오 B 한정) | **소진** | D1 시나리오 A 활성화 |
| 5 | R4 (OAuth headless #26571 미포함) | 부재 | **신설** (LOW, bkit scope 외 사용자 책임) | P1 §3.3 정정 — v0.42.0 stable 미포함 확정 |
| 6 | R15 (Subagent Protocol 호환성) | 부재 | **신설** (LOW, 다음 cycle 위임) | P1 §3.2 v0.43.0-preview.0 시그널 |
| 7 | R16 (PR #25827 정정 흡수 누락) | 부재 | **신설** (NEAR-ZERO) | P1 §3.5 정정 — PR #25827 main MERGED 2026-05-11 |
| 8 | W2.11 (PR #25827 워크어라운드 9 위치 재확인) | 부재 | **신설** (5분) | D5 정정 흡수 |
| 9 | W3.3 (SKILL 단락) | preview train placeholder 1줄 | **v0.42.0 stable 풀 단락** (PR #25827 정정 명문화 포함) | stable 확정 + 정정 흡수 |
| 10 | W3.7 (PR commit message) | preview train absorption | **+ PR #25827 정정 명문화** | D5 정정 흡수 |
| 11 | §11 v0.43.0-preview.0 시그널 등록 | 부재 | **신설** (80 commits / 9 PR / 5 fix) | D8 신규 — 다음 cycle 위임 사전 등록 |
| 12 | Strategy B' family 카운트 | 13회차 (preview cycle) | **13회차 (stable cycle, preview cycle 학습 활용)** | 동일 13회차 (preview는 P3 작성, stable은 활성화) |

**delta 합계**: 12건 (활성화 2건 + 위험 갱신 5건 + Wave 항목 3건 + §11 신설 + 카운트). preview plan 골격 ≥95% 재활용.

---

## Appendix B. 본 plan close 후 다음 액션 (메인 세션용)

1. **D1~D8 사용자 결재 확인** (D1 시나리오 A 활성화 확정, D5 PR #25827 정정 명문화, D7 N=13 trigger 다음 cycle 발동, D8 v0.43.0-preview.0 §11 등록)
2. **Do 진입**: Wave 1 → Wave 2 → Wave 3 순차 실행 (~3.5-4.5h)
3. **PR 생성**: 단일 PR, branch `feature/v2.0.7-gemini-cli-v0.42.0-migration`, commit message: `feat(v2.0.7): Gemini CLI v0.39.1 → v0.42.0 cumulative migration + 21 agent smoke + preview train absorption + Gemma 4 lock + PR #25827 정정 명문화`
4. **메모리 갱신**: `project_v0420_migration.md` 신설 (preview cycle 메모와 분리) + `MEMORY.md` 인덱스 추가 (v0.42.0 stable 활성화 cycle = B' 13회차 stable, preview cycle = B' 13회차 P3 작성)
5. **다음 cycle 트리거 설정**: v0.43.0 stable 출시 (추정 2026-05-18 ~ 2026-05-26) 감지 시 §11에 등록된 시그널 활용 → P1/P2 ~30분 + Wave 1~3 ~3.5-4.5h (B' 14회차)

---

*Phase 3 Plan-Plus 종료: 2026-05-13. Strategy B' **13번째** 적용 권장 (stable 활성화 cycle). 작업 시간 ~3.5-4.5h, 위험도 LOW (R9 21 agent 스모크 + R11 a2a-server 미의존 + R12 소진 + R14 소진 + R4 OAuth bkit scope 외 + R15 Subagent Protocol 다음 cycle 위임 + R16 PR #25827 정정 명문화). v0.42.0 stable = preview.2 bit-for-bit promotion (code patch 0건). preview plan 골격 ≥95% 재활용 + delta 12건 (활성화 2건 + R 갱신 5건 + Wave 항목 3건 + §11 v0.43.0-preview.0 시그널 등록 + 카운트). Cx13만 본 cycle 채택, 나머지 13개 신기능 모두 별도 cycle 위임 (YAGNI 절감 64.3% — preview plan 92.8% 대비 stable 활성화 4건 + 정정 흡수 1건 + §11 등록 1건 추가). 가중 점수 8.85점 (B'' 대비 +0.45, B 대비 +1.30, C 대비 +1.80). D1 시나리오 A 활성화 확정 (stable 출시 확정 2026-05-12 22:29 UTC). v0.40.0/v0.41.x/v0.41.2/v0.42.0-preview/v0.42.0 cycle 5개 단일 PR 통합. PR #25827 정정 흡수 + v0.43.0-preview.0 §11 80 commits 시그널 풀 등록 (D8 신규).*
*migration-strategist agent (Strategy B' family 13th application — stable activation cycle, supersedes preview cycle P3 plan)*
