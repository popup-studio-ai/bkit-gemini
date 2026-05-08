# Gemini CLI v0.41.2 마이그레이션 Plan (P3)

> Phase 3 산출물. /gemini-migration Phase 3 — Plan-Plus 브레인스토밍 (12번째 Strategy B family 적용 후보).
> 작성일: 2026-05-07
> 작성자: migration-strategist agent
> 베이스라인: bkit v2.0.6 (= Gemini CLI v0.39.1 stable, PR #24 main 머지)
> 누적 비교 범위: `v0.39.1...v0.41.2` (= v0.40.0 + v0.40.1 + v0.41.0 + v0.41.1 + **v0.41.2**)
>
> **입력 문서**:
> - Phase 1 (v0.41.2 누적): `docs/01-plan/research/gemini-cli-v0.41.2-research.md`
> - Phase 2 (v0.41.2 누적): `docs/03-analysis/gemini-cli-v0.41.2-impact.analysis.md`
> - Phase 3 baseline (참조 + supersede 후보): `docs/01-plan/features/gemini-cli-v0.41.1-migration.plan.md`
> - Phase 3 baseline (참조): `docs/01-plan/features/gemini-cli-v0.40.0-migration.plan.md`
>
> **본 cycle의 본질적 차이 (vs v0.41.1 cycle)**: v0.41.2 신규 변경 = `@google/gemini-cli-a2a-server` 패키지 한정 race-condition fix 단일 cherry-pick (PR #26568 → #26589). bkit는 a2a-server 미의존 (grep 0건 + `package.json` 0건 재확인) → **bkit 코드 변경 0건**. 따라서 본 cycle은 v0.41.1 plan 골격을 **in-place rename + delta 각주만** 추가한 형태.

---

## 0. 컨텍스트 및 입력

### 0.1 입력 자료 요약

| 입력 | 핵심 결론 | 신뢰도 |
|---|---|---|
| P1 누적 research | v0.39.1 → v0.41.2 누적 변경: Breaking 7건, 새 기능 24건, 설정/CLI 12건, bkit 활용 후보 9건 (C1~C9). v0.41.2 단독: a2a-server 단일 cherry-pick, CLI 본체 영향 0건 | ⬛⬛⬛⬛⬛ |
| P2 누적 영향 분석 | Critical 0 / High 5 / Medium 10 / Low 28 / 33 files (v0.41.1 분석 100% 인용 + v0.41.2 a2a-server 0건 재확인). 미해결 5건(Q1~Q5)이 P3 또는 Do 단계에서 해소 | ⬛⬛⬛⬛⬛ |
| v0.41.1 plan (참조) | Strategy B' 채택, 4.5-5h, 3 Wave, LOW risk + R9 (21 agent 스모크) | ⬛⬛⬛⬛⬛ |
| v0.40.0 plan (참조) | Strategy B' 채택, 3.5-4.5h, 3 Wave, LOW risk. v0.41.1 plan에 흡수됨 | ⬛⬛⬛⬛⬛ |

### 0.2 결정된 환경 변수

- bkit `main` HEAD = v2.0.6 = Gemini CLI v0.39.1 머지 완료
- npm `latest` stable = **v0.41.2** (2026-05-07 검증)
- v0.40.0/v0.40.1/v0.41.0/v0.41.1/v0.41.2 cycle 모두 main 머지 미완료 (브랜치/plan 잔존)
- 누적 baseline = v0.39.1 → v0.41.2 (사용자 결정)
- v0.41.2 신규 변경 → bkit 영향 0건 (P2 §1.2 + §9.4 검증 완료)

### 0.3 본 cycle의 본질적 차이 1줄

**v0.41.1 cycle 대비**: 누적 카운트(33 files / Critical 0 / High 5 / Medium 10 / Low 28) 100% 동일. v0.41.2 델타 = a2a-server 단일 패치로 bkit 영향 0건 → **본 plan은 v0.41.1 plan의 in-place rename + delta 각주(≤5건)** 형태.

---

## 1. 의도 탐색 (Intent Discovery)

### 1.1 사용자 의도 추정 (3 가설)

| 가설 | 근거 | 신뢰도 |
|------|------|--------|
| **H1**: "v0.40.0 + v0.41.x + v0.41.2 누적을 단일 PR로 정리하여 v2.0.7로 한 번에 머지" | v0.39.1 cycle 종료 후 v0.40.0/v0.41.x/v0.41.2 모두 Do 미완료 — 누적 cycle 정리 필요. v0.41.1 plan H1 동일 결론에 v0.41.2 흡수 추가. | ⬛⬛⬛⬛⬛ |
| **H2**: "v0.41.2 stable 신뢰 잡기 (race-condition 해결로 a2a-server 사용자에게는 중요한 fix이지만 bkit는 무관 명문화)" | P2 §9.4: a2a-server 의존 0건 grep 재확인. CLI 본체 영향 0건. bkit는 단순 의존 bump만 필요. | ⬛⬛⬛⬛⬛ |
| **H3**: "v2.1.0 context-optimization plan 진입 가속 (변하지 않음)" | v0.41.x 신규 시너지 3건 (MCP resources / autoMemory scratchpad / tools.core allowlist) 그대로 — v0.41.2는 시너지 제로 (a2a-server 한정) | ⬛⬛⬛⬛⬜ |

**결론**: H1 + H2 풀 채택. H3 별도 cycle 위임 (v0.41.1 plan 정책 그대로). 즉 **"v0.40.0+v0.41.x+v0.41.2 단일 누적 PR로 stable 따라잡기. v2.1.0 plan refresh + MCP resources PoC는 별도 cycle"**.

### 1.2 사용자(kay) 컨텍스트 반영

| 항목 | 추정/확인 | Plan에 반영 |
|---|---|---|
| 역할 | bkit-gemini 개발자, CTO-level (사용자 메모리) | 작업량 가중치 0.20 — 여전히 4-5h 가용 가정 |
| 누적 미머지 cycle 부담 | v0.40.0 P1~P4 완료 + v0.41.1 P1~P3 완료 모두 미머지 잔존 (5월 7일 현재) | **단일 PR 통합 정책** 그대로 — 본 cycle에서 v0.41.2 흡수까지 |
| 학습 곡선 | Strategy B family 11회 적용 안정. 누적 학습이 메모리 인덱스에 누적됨 | Strategy B' 12번째 적용 — 패턴 일관성 + 위험 예측력 최대 |
| 시간 투자 의지 | 가용 시간 4-5h 기준 합의 (v0.41.1 plan §0.5) | 본 cycle 동일 추정 — v0.41.2 델타 0건이라 추가 시간 0분 |

### 1.3 숨은 요구사항 — "단계별 진행 vs 누적 PR"

P3 핵심 분기:

| 옵션 | 작업 |
|---|---|
| **(A) 단계별** | v0.40.0 PR 머지 → v0.41.x PR → v0.41.2 PR (3개 PR × 3회 머지 충돌 + 3회 baseline) |
| **(B) 누적 PR 통합** ← 권장 | v0.40.0 + v0.41.x + v0.41.2 단일 PR (1회 머지 + 1회 baseline + 단일 v2.0.7 릴리스) |

**근거**: P2 누적 영향 33 files 그대로 동일. v0.41.2 델타 0건이므로 추가 작업 비용 0분. (B) 단일 PR이 ROI 압도적.

### 1.4 비용/이익 분석 (v0.41.1 plan §0.4 그대로)

| 항목 | Strategy B' (본 cycle) | Strategy C (Full) |
|---|---|---|
| 작업 시간 | ~4.5-5h | ~26h |
| 토큰 절감 (이론) | 0% (게이트만) | ~30% (MCP resources export 시) |
| 회귀 차단 신뢰도 | ⬛⬛⬛⬛⬛ (v0.41.1 plan 대비 R9 스모크 지속) | ⬛⬛⬛⬛⬛ (동일) |
| **ROI** | **5h / 회귀 차단 + 미래 게이트 + v0.41.2 흡수** | **26h / 즉시 토큰 절감** |

**결정**: Strategy B' 채택 12회차. v2.1.0 본격 갱신 + MCP resources PoC는 본 cycle close 후 1주 이내 별도 cycle.

---

## 2. 대안 비교 (가중 점수표, 5개 후보)

### 2.1 전략 정의 (5개)

| 전략 | 정의 | 작업 시간 | 핵심 |
|------|------|----------|------|
| **A** | Minimal — testedVersions에 `0.41.2`만 추가 + version flag 1개(`hasA2aServerRaceFix` — 옵트아웃 가능) + v0.41.2 docs 1줄 | **~30분** | "v0.41.1 cycle close되었다고 가정하고 v0.41.2만 추가" 시나리오 — **현실 부정합** (v0.41.1 plan은 미머지) |
| **A''** | A + v0.41.1 plan supersede 처리 (in-place rename) — v0.41.1 cycle 미머지 흡수 | ~45분 | v0.41.1 plan 작업을 **본 cycle 안에서 묶지 않고** v0.41.1 plan을 그대로 실행 + v0.41.2 추가만 별도 흡수 |
| **B** | Standard — A + v0.41.1 plan 흡수 + 21 agent 스모크 생략 | ~3.5-4h | v0.41.1 plan과 동형이지만 R9 21 agent 스모크 생략 |
| **B' (추천)** | **v0.41.1 plan in-place rename + v0.41.2 델타 각주(≤5건)** — 골격 100% 재활용 + delta 0건이므로 작업 시간 동일 | **~4.5-5h** | 본 cycle 권장. v0.41.1 plan W1.1의 testedVersions만 4→5개로 변경, 그 외 모든 항목 동일 |
| **C** | Full — B' + MCP resources PoC + v2.1.0 본격 갱신 + autoMemory 옵트인 + tools.core 카탈로그 + --session-id 채택 | ~26h (~3-4d) | v0.40.0+v0.41.x+v0.41.2 + 신규 활용 14건 모두 |

### 2.2 가중 점수 매트릭스

가중치 (사용자 명시):
- **안전성 0.30** (v0.41.2 a2a-server fix는 race-condition으로 안전성 가중치 약간 상향)
- **작업 시간 0.25**
- **bkit 가치 0.20** (회귀 차단 + 새 기능 활용 합산)
- **학습 효과 0.15** (Strategy B family 12회차 — 패턴 강화)
- **일관성 0.10** (v0.41.1 plan in-place rename 일관성)

각 차원 1~10점:

| 차원 (가중치) | A | A'' | B | **B'** | C |
|--------------|---|---|---|----|---|
| 안전성 (0.30) | 5 | 6 | 8 | **10** | 9 |
| 작업 시간 (0.25) | **10** | 9 | 8 | 7 | 2 |
| bkit 가치 (0.20) | 2 | 4 | 7 | **9** | 10 |
| 학습 효과 (0.15) | 3 | 5 | 7 | **10** | 8 |
| 일관성 (0.10) | 4 | 6 | 8 | **10** | 7 |
| **가중 합** | **5.10** | **6.05** | **7.55** | **8.85** | 7.05 |

### 2.3 정량 비교

| 항목 | A | A'' | B | **B'** | C |
|---|---|---|---|----|---|
| 작업 시간 | ~30분 | ~45분 | ~3.5-4h | **~4.5-5h** | ~26h |
| 위험도 | MED (v0.41.1 미머지) | MED (PR 분리도 ↓) | LOW | **LOW + R9 차단** | MED (PoC 회귀 분리도 ↓) |
| 코드 수정 라인 | ~3줄 | ~3줄 + plan 별도 | ~20줄 | **~20줄** | ~200줄+ |
| L3 실측 횟수 | 0 | 0 | 1 | **2** | 3+ |
| Full baseline | 0 | 1회 | 1회 | **1회** | 2회+ |
| PR 단위 | 단일 (v0.41.2만) | 2개 (v0.41.1 + v0.41.2) | 단일 | **단일** | 1+α |
| v0.41.1 plan supersede | ❌ | △ | ✅ | ✅ | ✅ |
| 21 agent 스모크 | ❌ | ❌ | ❌ | **✅** | ✅ |

### 2.4 1위 vs 2위 차이 (B' vs B)

가중 점수 차이: **8.85 - 7.55 = +1.30**.

핵심 차별점: **R9 (21 agent 스모크)** 채택 여부. v0.41.0 PR #25720 recursive shell validation은 LLM 행동 변경이라 정적 분석 무력화 어려움 — Strategy B는 신뢰도 ⬛⬛⬛⬛⬜에서 멈추지만 B'는 1h 스모크로 ⬛⬛⬛⬛⬛ 도달. 1h 추가의 ROI 압도적 (안전성 +2점, bkit 가치 +2점, 학습 효과 +3점).

---

## 3. YAGNI 리뷰

### 3.1 본 cycle 추가 항목 (v0.41.1 plan 대비)

| # | 항목 | 채택? | 1줄 근거 |
|---|------|-------|---------|
| 1 | testedVersions에 `0.41.2` 추가 (4개 → 5개) | ✅ 채택 (Wave 1.1 갱신) | 1줄 추가, 5분 |
| 2 | v0.41.2 a2a-server fix bkit 무관 명문화 (gemini-cli-learning SKILL.md 1줄) | ✅ 채택 (Wave 3.3 통합) | Docs=Code, 향후 a2a-server 의존 시 회귀 차단 |
| 3 | `package.json` 의존 bump v0.39.1 → **v0.41.2** | ✅ 채택 (Wave 1.6 신규) | 1줄, 1분 |
| 4 | v0.41.2 전용 version flag 신설 (예: `hasA2aServerRaceFix`) | ❌ 제거 | bkit가 a2a-server 미사용 — flag 노출 가치 0 |
| 5 | 21 agent 스모크 v0.41.2 추가 검증 | ❌ 제거 | a2a-server 한정이라 LLM 행동 변경 0 — v0.41.1과 동일 결과 예상 |
| 6 | v0.41.2 release notes 별도 docs 단락 | ❌ 제거 | gemini-cli-learning SKILL 1줄로 충분 |

**채택률**: 본 cycle 신규 6 후보 중 **3 채택 + 3 제거 = YAGNI 절감 50%**. v0.41.1 plan(37%)보다 높은 이유: v0.41.2 델타가 a2a-server 단일 패치라 신규 항목 자체가 적음.

### 3.2 v0.41.1 plan에서 흡수된 채택 항목 (변경 없음)

v0.41.1 plan §6 27 후보 중 17 채택은 본 plan에 그대로 흡수. 변경 0건.

### 3.3 본 cycle 종합 YAGNI 점검

| 체크 | 결과 |
|---|---|
| "있으면 좋을 것 같은" 기능 포함? | ❌ — v0.41.2 전용 flag 제거 |
| 사용자 실제 필요 변경? | ✅ — testedVersions/dependency bump만 추가 |
| bkit 철학 부합? | ✅ — 4원칙 모두 정렬 (v0.41.1 plan §7 인용) |
| 유지보수 비용 대비 가치? | ✅ — 5분 추가 작업, 영구 호환성 명문화 |
| 이전 cycle 불필요 패턴 반복? | ❌ — Strategy B' family 검증된 패턴 12회차 |

---

## 4. 권장 전략 + 거부 안 근거

### 4.1 채택: Strategy B' (Standard + Spot Verification)

**가중 점수 8.85점 (1위, B 대비 +1.30, C 대비 +1.80)**.

### 4.2 1순위 이유 (3가지)

1. **v0.41.1 plan의 in-place rename + delta 각주만 추가하는 최소 수정**: P2 §9.4 결론(누적 카운트 100% 동일, bkit 영향 0건)에 따라 v0.41.1 plan 골격 100% 재활용. testedVersions 1줄 + dependency bump 1줄 + SKILL 1줄 = **delta 3줄**. v0.41.1 cycle close하지 못한 채로 v0.41.2를 별도 cycle로 처리하는 것보다 흡수 통합이 ROI 압도적.

2. **Strategy B family 12번째 적용 — 검증된 패턴 일관성**: 메모리 인덱스(`MEMORY.md`)에 누적된 11개 cycle 학습이 그대로 적용 가능. v0.40.0/v0.41.1 plan의 흡수 정책, 21 agent 스모크 정책, MCP resources 분리 정책, v2.1.0 trigger 메모 정책 모두 본 cycle에 그대로 인계.

3. **v0.41.2 a2a-server fix bkit 무관 명문화로 향후 회귀 사전 차단**: bkit가 향후 a2a-server에 의존하게 될 경우 (예: ACP/A2A 통신 도입), 본 cycle SKILL 1줄이 v0.41.2 race-condition fix 적용 여부 판단 근거가 됨. Docs=Code 원칙 강화.

### 4.3 거부 안 근거

- **Strategy C (Full, 26h, 7.05점)**: 새 기능 활용 10점이지만 작업 시간 가중치 0.25에서 2점 — v2.1.0 시너지가 안전성/작업시간 우위 못 이김. PoC가 회귀 차단 신호와 섞이는 분리도 저하. 별도 cycle로 분리.

- **Strategy B (Standard, 7.55점)**: B'와 차이는 **21 agent 스모크 누락**. v0.41.0 PR #25720은 LLM 런타임 명령에 정책 적용 → 정적 분석 무력화 어려움. 1h 추가의 ROI 압도적 (가중 점수 +1.30).

- **Strategy A/A'' (Minimal/+rename)**: 30-45분으로 빠르지만 v0.40.0/v0.41.1 cycle 흡수 부족 — autoMemory/memoryManager 명문화, 21 agent 스모크, full baseline 회복 검증, gemini-cli-learning SKILL 11단락 모두 누락. 본 cycle을 단일 누적 PR로 닫지 못하고 후속 cycle 부담 누적.

### 4.4 대안 활성화 조건

- **가용 시간 1h 미만 (긴급)** → Strategy A로 강제 축소 (testedVersions 1줄 + dependency bump 1줄만). v0.41.1 plan 그대로 보존 후 별도 PR.
- **가용 시간 1d 이상 + v2.1.0 cycle 본 cycle과 합치기 결정** → Strategy C로 확장.
- **R9 21 agent 스모크 결과 회귀 1건 이상 발견** → Wave 2 일시 중단 + 회귀 분석 cycle 진입 (B' → 회귀 cycle).

---

## 5. Wave 분할 (Strategy B', 4.5-5h)

총 예상 시간: **~4.5-5시간** (v0.41.1 plan 동일 + v0.41.2 델타 +5분 흡수). Wave 1 ~35분, Wave 2 ~3-3.5h, Wave 3 ~1h, Buffer ~30분.

### Wave 1 (P0, ~35분) — Critical Patch + 회귀 사전 차단 + v0.40.0/v0.41.x/v0.41.2 흡수

| # | 작업 | 파일 | 검증 | 의존성 | 시간 |
|---|------|-----|-----|--------|-----|
| W1.1 | testedVersions에 `"0.40.0", "0.40.1", "0.41.0", "0.41.1", "0.41.2"` **5개** 추가 (v0.41.1 plan W1.1: 4개 → 5개) | `bkit.config.json:120` | L1 unit (json schema) | — | 2분 |
| W1.2 | v0.40.0+ flag 4개 + v0.41.0+ flag 4개 = 8개 신설 (v0.41.1 plan W1.2 그대로) | `lib/gemini/version.js:212` 뒤 | L1 unit (`tc04`) | W1.1 | 15분 |
| W1.3 | `general.topicUpdateNarration: false` 명시 잠금 (v0.41.1 plan W1.3 그대로) | `.gemini/settings.json` | L2 baseline (W2.2 검증) | — | 5분 |
| W1.4 | `experimental.autoMemory: false` + `experimental.memoryManager: false` 명시 (v0.41.1 plan W1.4 그대로) | `.gemini/settings.json` | L1 (json valid) | W1.3 | 5분 |
| W1.5 | tc38 매트릭스에 8개 항목 추가 (v0.41.1 plan W1.5 그대로) | `tests/suites/tc38-feature-flags-matrix.js` | L1 unit (tc38 PASS) | W1.2 | 15분 |
| **W1.6 (v0.41.2 신규)** | **`package.json` `@google/gemini-cli` 의존 v0.39.1 → v0.41.2 bump** | `package.json` | L1 (npm install OK) | — | **3분** |

**Wave 1 산출물**: 6개 파일 수정 (~20줄 + dependency 1줄). v0.41.2 누적 testedVersions 5개 (v0.40.0/0.40.1/0.41.0/0.41.1/0.41.2).
**Wave 1 AC**: `node tests/run-all.js --suite=tc04,tc38,smoke` PASS + `npm install` 정상 종료.

### Wave 2 (P1, ~3-3.5h) — Spot Verification + 21 Agent Smoke + Baseline 회복

v0.41.1 plan Wave 2 그대로 + v0.41.2 a2a-server 무관 재확인 1건.

| # | 작업 | 파일/명령 | 검증 | 의존성 | 시간 |
|---|------|---------|-----|--------|-----|
| W2.1 | tc113/tc107 파일 존재 실측 (v0.41.1 plan 그대로) | `find tests/suites -name "tc107*" -o -name "tc113*" -o -name "*25655*"` | 부재 시 별도 P1 부채 등록 | — | 10분 |
| W2.2 | topic narration L3 baseline 실측 (v0.41.2로 갱신) | `(cd /tmp && npx --yes @google/gemini-cli@0.41.2 -p "list 3 numbers")` 1회 stdout 캡처 | L3 1회 — narration 줄 == 0 | W1.3 | 15분 |
| W2.3 | `tools.core` 키 schema 실측 (v0.41.2로 갱신) | `npx --yes @google/gemini-cli@0.41.2 --help` | L3 1회 | — | 15분 |
| W2.4 | bkit-permissions deny 우선순위 spot (v0.41.1 plan 그대로) | sandbox 시뮬 | L2 spot | — | 15분 |
| W2.5 | **21 agent 회귀 스모크** (R9 차단, v0.41.1 plan 그대로) | 21개 FULL tier × 1개 샘플 명령 | L2 — 21/21 PASS | W1 전체 | 60분 |
| W2.6 | full baseline 1회 (v0.41.2 install 후 1925/2032 회복) | `node tests/run-all.js` | L2 baseline — pass >= 1925 | W1.6 | 30-60분 |
| W2.7 | 카나리아 PASS (tc115 / tc113 / tc38) | run-all 결과 grep | L2 grep | W2.6 | 5분 |
| **W2.8 (v0.41.2 신규)** | **a2a-server 미의존 재확인 (P2 §9.4 검증 재현)** | `grep -rn "a2a-server" mcp/ lib/ hooks/ tests/` + `cat package.json | grep a2a` | grep 결과 docs 외 0건 | — | **5분** |

**Wave 2 산출물**: spot 실측 4건 + 21 agent 스모크 + full baseline 회복 + a2a-server 의존 0건 재확인.
**Wave 2 AC**: 21/21 PASS + pass >= 1925 + tc115/tc113/tc38 PASS + a2a-server grep 0건.

### Wave 3 (P2, ~1h) — 문서 갱신 + 버전 bump + v2.1.0 trigger 메모

v0.41.1 plan Wave 3 + v0.41.2 1줄 추가.

| # | 작업 | 파일 | 검증 | 의존성 | 시간 |
|---|------|-----|-----|--------|-----|
| W3.1 | GEMINI.md 헤더/footer bkit v2.0.6 → v2.0.7 (v0.41.1 plan 그대로) | `GEMINI.md:1, 67` | L1 grep | — | 5분 |
| W3.2 | README.md v0.40.0+v0.41.1+**v0.41.2** testedVersions + 신규 안내 1단락 | `README.md` | L1 grep | W1.1 | 15분 |
| W3.3 | gemini-cli-learning SKILL.md에 **12개 단락** 추가 (v0.40.0 5 + v0.41.x 6 + **v0.41.2 1줄** "a2a-server race-condition fix는 bkit 무관") | `gemini-cli-learning/SKILL.md` | L1 read | — | 30분 |
| W3.4 | `/new` alias + `/voice` slash command 1줄씩 (v0.41.1 plan 그대로) | 동일 | L1 read | W3.3 | 5분 |
| W3.5 | `bkit.config.json` version `2.0.6` → `2.0.7` | `bkit.config.json` | L1 (json valid) | — | 1분 |
| W3.6 | v2.1.0 plan trigger 메모 1단락 (v0.41.1 plan 그대로 + v0.41.2 변화 0건 명시) | `docs/01-plan/features/v2.1.0-context-optimization.plan.md` | L1 read | — | 15분 |
| W3.7 | PR commit message 초안 — `feat(v2.0.7): Gemini CLI v0.39.1 → v0.41.2 cumulative migration + 21 agent smoke + spot verification` | — | — | W1~W2 | 10분 |

**Wave 3 산출물**: bkit v2.0.7 일관성 (3개 파일) + SKILL 12단락 + v2.1.0 trigger 메모 + PR commit message.
**Wave 3 AC**: 모든 docs에 0.40.0/0.41.0/0.41.1/0.41.2 testedVersions 명시 + bkit v2.0.7 일관성 + SKILL에 v0.41.2 a2a-server bkit 무관 1줄.

### Wave 4 (선택, 별도 cycle 위임 — v0.41.1 plan 그대로)

| 항목 | 위임 cycle |
|---|---|
| MCP resources export PoC | v2.1.0 plan refresh cycle |
| 4-tier namespace docs | v2.1.0 plan refresh cycle |
| GEMINI_CLI_TRUSTED_FOLDERS_PATH bootstrap | onboarding UX cycle |
| autoMemory scratchpad 옵트인 | v2.1.0 implementation cycle |
| `tools.core` allowlist 카탈로그 | 보안 강화 cycle |
| `--session-id <uuid>` flag 채택 | v2.1.0 implementation cycle |
| Voice Mode / Gemma 4 | docs only / 외부 모델 cycle |

---

## 6. Decisions (D1~D6)

### D1: 권장 전략

**옵션**: (a) A / (b) A'' / (c) B / (d) **B'** ← 권장 / (e) C

**권장**: (d) Strategy B' 12번째 적용. 가중 점수 8.85 (1위, B 대비 +1.30).

### D2: MCP resources export — v2.1.0 plan refresh cycle 분리

**옵션**: (a) 본 cycle Wave 4 / (b) **v2.1.0 plan refresh cycle 단독 PoC** ← 권장 / (c) v2.0.x 패치 cycle

**권장**: (b). v0.41.1 plan D2 + v0.40.0 plan D2 그대로.

### D3: v2.1.0 plan 갱신 — 본 cycle은 trigger 메모만

**옵션**: (a) 본 cycle Wave 3 본격 갱신 / (b) **trigger 메모 1단락만, 본격 갱신 별도 cycle** ← 권장 / (c) v2.1.0 cycle과 합치기

**권장**: (b). v0.41.1 plan D3 그대로 + v0.41.2 변화 0건이라 메모 자체에 변화 없음.

### D4: testedVersions 누적 정책

**옵션**: (a) **모두 누적 (`["0.34.0", ..., "0.41.2"]`)** ← 권장 / (b) 최근 N개 / (c) 최신 1개

**권장**: (a). v0.41.1 plan D4 그대로. **N=11 도달 — 다음 cycle (v0.42.0)에서 D4 재검토 트리거 발동**.

### D5: 사전 부채 83건 처리

**옵션**: (a) **본 cycle은 v0.41.2까지만 — 사전 부채 미처리** ← 권장 / (b) Wave 4에 P0 부채 1-2건 흡수 / (c) 별도 부채 cycle

**권장**: (a). v0.41.1 plan D5 그대로.

### D6: 21 agent 회귀 스모크 범위

**옵션**: (a) **21개 전체 (~60분)** ← 권장 / (b) 샘플 5개 / (c) 생략

**권장**: (a). v0.41.1 plan D6 그대로. v0.41.2 델타 0건이라 추가 검증 항목 없음.

---

## 7. 미해결 검증 항목 답변/위임 (P2 §8.4 Q1~Q5)

| Q# | 질문 | 본 P3 답변 또는 Do 위임 |
|---|---|---|
| **Q1** | PR #25720 recursive shell validation의 21개 FULL tier agents LLM 호출 회귀 | **Do 위임** — Wave 2.5 21 agent 스모크 1h로 동적 검증. 실패 시 본 cycle 일시 중단 + 회귀 분석 cycle 진입 (R9) |
| **Q2** | `lib/gemini/version.js:206` `hasToolsCoreAllowlist` 시작 버전 (v0.41.0 정식 vs cherry-pick) | **Do 위임** — Wave 2.3 npx 격리 실측으로 키 schema 확정. 본 P3에서는 v0.39.1 보수적 유지 권고 (코멘트 1줄 보강) |
| **Q3** | `tests/suites/tc113-issue-25655-systemmessage-duplicate.js` 파일 존재 여부 | **Do 위임** — Wave 2.1 `find` 1줄 실측. 부재 시 별도 P1 부채 등록 + 본 cycle 진행 차단 안 함 |
| **Q4** | bkit-permissions.toml deny 규칙 우선순위 vs YOLO fail-closed | **Do 위임** — Wave 2.4 sandbox 시뮬 spot 15분 |
| **Q5** | `general.topicUpdateNarration: false` 추가 후 e2e 테스트(tc40/41/43) 영향 | **Do 위임** — Wave 2.6 full baseline 1회 + Wave 2.2 narration L3 spot 결합 검증 |

**모든 5건 Do 단계에서 해소 가능**. 본 P3에서 추가 분석 불필요.

---

## 8. 위험 관리 (R1~R10, v0.41.1 plan 그대로 + R11 신규 후보 평가)

### 8.1 리스크 매트릭스

v0.41.1 plan §5.1 R1~R10 그대로 + v0.41.2 신규 R11 평가.

| ID | 리스크 | 가능성 | 영향 | 완화책 | 잔존 위험 |
|----|--------|-------|------|--------|----------|
| R1~R10 | (v0.41.1 plan §5.1 그대로 — topic narration / 4-tier paths / #25827 / v0.42.0 출시 / hidden regression / YOLO+deny / tc113 부재 / 키 위치 / **R9 21 agent 스모크** / tools.core 키 schema) | — | — | — | LOW |
| **R11 (신규 평가)** | **v0.41.2 a2a-server fix가 향후 bkit가 a2a-server 채택 시 회귀 가져옴** | NEAR-ZERO | LOW | bkit 현재 a2a-server 미사용 (W2.8 grep 0건). 향후 채택 시 v0.41.2+ 의존 강제 | NEAR-ZERO |

**전체 위험도**: **LOW**. v0.41.1 plan 위험 수준 그대로 + R11 신규 0건 영향.

### 8.2 롤백 전략 (v0.41.1 plan §5.4 그대로 + v0.41.2 추가)

- **L1 rollback**: `git revert <commit-sha>` — atomic
- **L2 rollback**: `~/.gemini/settings.json` user-scope override
- **L3 rollback**: `npx --yes @google/gemini-cli@0.39.1` 다운그레이드 (testedVersions에 0.39.1 유지)
- **R9 rollback**: 21 agent 스모크 실패 시 Wave 1 commit 직전으로 되돌리기 + 회귀 분석 cycle
- **v0.41.2 specific rollback**: `package.json` 의존을 v0.41.1로 다운그레이드 (a2a-server fix는 bkit 미사용이라 rollback 영향 0건)

### 8.3 사전/사후 카나리아

| 시점 | 카나리아 | 통과 기준 |
|---|---|---|
| **사전** | tc115 (trust env) PASS, tc113 (#25655 SessionStart) PASS | v0.39.1 baseline 회복 |
| **사후 (Wave 2 종료)** | 동일 카나리아 + 21 agent 스모크 21/21 + a2a-server grep 0건 | 4축 PASS |
| **사후 (Wave 3 종료)** | bkit v2.0.7 일관성 grep + SKILL 12단락 + testedVersions 5개 | docs grep PASS |

---

## 9. Acceptance Criteria (AC)

### 9.1 정량 (7건)

1. **L1 unit**: tc04 / tc38 / smoke PASS (Wave 1 종료)
2. **L2 baseline**: `node tests/run-all.js` pass >= 1925 (v0.39.1 baseline 회복) — Wave 2.6
3. **L3 spot (narration)**: topic narration noisy line == 0 (W1.3 적용 후 v0.41.2 npx 격리 실측) — Wave 2.2
4. **L3 spot (tools.core)**: 키 schema 명칭 확정 (`tools.core` vs `tools.coreTools`) — Wave 2.3
5. **회귀 카나리아**: tc115 PASS + tc113 PASS — Wave 2.7
6. **21 agent 스모크**: 21/21 PASS — Wave 2.5 (R9 차단)
7. **bkit 버전**: GEMINI.md / README.md / bkit.config.json 모두 `bkit v2.0.7` 일관 — Wave 3

### 9.2 정성 (5건)

1. **YAGNI 준수**: Wave 4 별도 cycle 위임 그대로 + v0.41.2 전용 flag 제거
2. **외부 인터페이스 실측**: tc113/tc107, narration L3, tools.core schema, YOLO+deny, **21 agent 스모크**, **a2a-server grep 0건 재확인** — 모두 spot 실측 결과 명시
3. **Strategy B' 12번째 적용**: 메모리 인덱스에 누적된 11개 cycle 학습 적용 + v0.41.2 학습 추가
4. **v0.40.0/v0.41.x/v0.41.2 cycle 흡수**: 3개 cycle 모두 단일 PR로 통합 — 각 plan supersede 명시
5. **Decisions 명문화**: D1~D6 모두 명시 + N=11 trigger (D4 재검토 차기 cycle 발동)

---

## 10. References (P1, P2, prior plans)

- **Phase 1 Research (v0.41.2 누적)**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/research/gemini-cli-v0.41.2-research.md` (2026-05-07)
- **Phase 2 Impact (v0.41.2 누적)**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/03-analysis/gemini-cli-v0.41.2-impact.analysis.md` (2026-05-07)
- **v0.41.1 plan (supersede 후보)**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/features/gemini-cli-v0.41.1-migration.plan.md`
- **v0.40.0 plan (이미 v0.41.1 plan에 흡수)**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/features/gemini-cli-v0.40.0-migration.plan.md`
- **이전 cycle plans (Strategy B' family)**:
  - v0.39.1 (8th): `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/features/gemini-cli-v0.39.1-migration.plan.md`
  - v0.39.0 (7th): `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/features/gemini-cli-v0.39.0-migration.plan.md`
  - v0.38.2 (6th): `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/features/gemini-cli-v0.38.2-migration.plan.md`
- **bkit 철학**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/bkit-system/philosophy/{core-mission,ai-native-principles,context-engineering,workflow-philosophy}.md`
- **메모리 인덱스**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/.claude/agent-memory/migration-strategist/MEMORY.md` + `project_v0411_migration.md` (v0.41.1 cycle 학습)

---

## Appendix A. v0.41.1 plan 대비 본 plan delta 표 (≤5건)

| # | 항목 | v0.41.1 plan | v0.41.2 plan | 본 cycle 변경 사유 |
|---|------|-------------|-------------|------------------|
| 1 | testedVersions 추가 항목 | 4개 (`0.40.0/0.40.1/0.41.0/0.41.1`) | **5개** (+`0.41.2`) | v0.41.2 stable 추가 |
| 2 | dependency bump | v0.41.1 | **v0.41.2** | npm latest 변경 |
| 3 | gemini-cli-learning SKILL 단락 | 11개 (v0.40.0 5 + v0.41.x 6) | **12개** (+ v0.41.2 a2a-server bkit 무관 1줄) | Docs=Code |
| 4 | Wave 2 신규 항목 | tc113 find / narration L3 / tools.core / deny spot / 21 agent 스모크 / full baseline / 카나리아 (7건) | + **W2.8 a2a-server grep 0건 재확인 (5분)** | P2 §9.4 검증 재현 |
| 5 | Strategy B' family 카운트 | 11번째 적용 | **12번째 적용** | cycle 진척 |

**delta 합계**: 5건 (테이블 1건 + 코드 변경 3건 + 검증 1건). v0.41.1 plan 골격 ≥95% 재활용.

---

## Appendix B. 본 plan close 후 다음 액션 (메인 세션용)

1. **D1~D6 사용자 확인** (특히 D6: 21 agent 전체 vs 샘플 5개 fallback)
2. **Phase 4 Do 진입** — Wave 1 → Wave 2 → Wave 3 순차 실행
3. **PR 생성** — 단일 PR, commit message: `feat(v2.0.7): Gemini CLI v0.39.1 → v0.41.2 cumulative migration + 21 agent smoke + a2a-server verification`
4. **v2.1.0 plan refresh cycle 진입 알림** — 본 cycle close 직후

---

*Phase 3 Plan-Plus 종료: 2026-05-07. Strategy B' 12번째 적용 권장. 작업 시간 ~4.5-5h, 위험도 LOW (R9 21 agent 스모크 + R11 a2a-server 미의존 재확인). v0.39.1 → v0.41.2 누적 stable 영향 분석 + v0.40.0/v0.41.1 cycle 흡수 + v0.41.2 a2a-server 무관 명문화의 통합. v0.41.1 plan 골격 ≥95% 재활용 + delta 5건 (testedVersions/dependency/SKILL 1줄/W2.8/카운트).*
*migration-strategist agent (Strategy B' family 12th application)*
