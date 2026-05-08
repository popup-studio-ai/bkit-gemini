# Gemini CLI v0.41.1 마이그레이션 Plan

> Phase 3 산출물. /gemini-migration Phase 3 — Plan-Plus 브레인스토밍.
> 작성일: 2026-05-06
> 작성자: migration-strategist agent
> 베이스라인: bkit v2.0.6 (= Gemini CLI v0.39.1 stable, PR #24 main 머지)
> 누적 비교 범위: `v0.39.1...v0.41.1` (= v0.40.0 + v0.40.1 + v0.41.0 + v0.41.1)
>
> **입력 문서**:
> - Phase 1 (v0.41.1 신규): `docs/01-plan/research/gemini-cli-v0.41.1-research.md`
> - Phase 2 (v0.41.1 신규): `docs/03-analysis/gemini-cli-v0.41.1-impact.analysis.md`
> - Phase 3 baseline (참조): `docs/01-plan/features/gemini-cli-v0.40.0-migration.plan.md`
> - Phase 2 baseline (참조): `docs/03-analysis/gemini-cli-v0.40.0-impact.analysis.md`
>
> **본 cycle의 통합 정책**: v0.40.0 cycle은 P1~P4 완료 / Do 미완료(브랜치 잔존, PR #25827 OPEN) 상태. 본 cycle은 v0.40.0 plan을 **흡수+확장**하여 단일 PR로 통합 처리한다. v0.40.0 plan에서 위임된 별도 cycle(MCP resources, v2.1.0 plan refresh) 분리 정책은 그대로 유지.

---

## 0. Intent Discovery — 왜 v0.41.1을 지금 마이그레이션하는가?

### 0.1 사용자 의도 추정 (3 가설)

| 가설 | 근거 | 신뢰도 |
|------|------|--------|
| **H1**: "v0.40.0 미완 + v0.41.x stable을 단일 PR로 누적 따라잡기" | v0.40.0 cycle Do 미완료 상태에서 v0.41.0(major)이 7일 후 출시. 두 cycle을 분리 처리 시 PR 2개·테스트 2회·머지 충돌 위험. **단일 누적 PR이 작업 효율과 회귀 차단 신뢰성 모두 우위** | ⬛⬛⬛⬛⬛ |
| **H2**: "v0.41.x 직접 회귀 0건 확정 후 stable 신뢰 잡기" | P2 P1~P7 7개 검증 모두 0건. Critical 0건. v0.41.0의 위험 hint(recursive shell, YOLO fail-closed, ContextManager)가 모두 코드 grep으로 무력화 — **stable 신뢰는 확보 후 머지하면 됨** | ⬛⬛⬛⬛⬜ |
| **H3**: "v2.1.0 context-optimization 진입 가속" | v0.40.0 cycle에서 트리거 발동, v0.41.0의 autoMemory scratchpad(-16.7% turns) + tools.core allowlist + MCP resources의 3중 시너지 — v2.1.0 plan refresh의 입력 강화 | ⬛⬛⬛⬛⬜ |

**결론**: H1 + H2 풀 채택. H3는 별도 cycle로 위임 (v0.40.0 plan D2/D3 정책 그대로). 즉 **"v0.40.0+v0.41.x 단일 누적 PR로 stable 따라잡기. v2.1.0 plan refresh + MCP resources PoC는 별도 cycle"**.

### 0.2 사용자 페인 포인트 (어떤 시나리오가 답답한가?)

| # | 페인 | v0.41.x 해소 메커니즘 | bkit 반영 경로 |
|---|------|---------------------|---------------|
| P1 | "v0.40.0 작업했는데 머지 못 한 상태에서 v0.41.0 stable 떨어짐 — 두 번 일하기 싫음" | 누적 PR로 단일 사이클에 흡수 | 본 plan Wave 1~3 |
| P2 | "stable이지만 신뢰가 없어 못 올림" | P1~P7 정적 검증 + Wave 2 spot 실측 | Wave 2 baseline+spot |
| P3 | "21개 FULL tier agent의 LLM이 v0.41.x recursive shell validation에 걸릴까 무서움" | P3 단계 회귀 스모크 1h | Wave 2 신규 항목 |
| P4 | "baseline runner 부팅 8s 매번 답답함" | PR #25758 자동 적용 (8s→1.4s) | 자동 — 별도 작업 없음 |
| P5 | "topic narration default-on이 stdout 깨뜨리면 어쩌지" | P0 1줄 잠금 (v0.40.0 plan W1.3 그대로) | Wave 1 |

### 0.3 bkit 미래 방향과의 정합성

- **v2.1.0 context-optimization plan**: v0.41.x 신규 시너지 3건 (MCP resources / autoMemory scratchpad / tools.core allowlist) 모두 입력 강화. **본 cycle은 v2.1.0 cycle 진입 게이트**(`hasMcpResourcesTools`, `hasAutoMemoryToggle` flag 노출)만 깔아두고 PoC는 분리.
- **AI Partnership 강화**: autoMemory scratchpad의 평가 결과(extractor turns -16.7%, precision +32.7%)는 v2.1.0 KPI와 직결 — 본 cycle은 게이트만, v2.1.0에서 옵트인.
- **Automation First / No Guessing / Docs=Code 4원칙**: P2 §7에 따라 4원칙 모두 ✅ (강화 2 / 유지 2). v0.39.1 → v0.40.0 → v0.41.x 일관된 상향 정렬.

### 0.4 비용/이익 분석

| 항목 | 본 cycle (Strategy B') | 이상적 풀 활용 (Strategy C) |
|---|---|---|
| 작업 시간 | ~4-5h (단일 PR) | ~26h (~3-4d, MCP resources PoC + autoMemory + tools.core 카탈로그) |
| 토큰 절감 (이론) | 0% (게이트만 깔아둠) | ~30% (MCP resources export 시) |
| 회귀 차단 신뢰도 | ⬛⬛⬛⬛⬜ (정적 + spot) | ⬛⬛⬛⬛⬜ (동일 — Strategy C 추가 작업은 새 기능 PoC가 회귀에 도움 안 됨) |
| v2.1.0 trigger | 게이트 깔림 + 플래그 노출 | 본격 갱신과 동시 PoC |
| **ROI** | **5h / 회귀 차단 + 미래 게이트** | **26h / 동일한 회귀 차단 + 즉시 토큰 절감** |

**결정**: Strategy B' 채택. v2.1.0 본격 갱신 + MCP resources PoC는 **본 cycle close 후 1주 이내 별도 cycle**.

### 0.5 가용 시간 / 리스크 톨러런스 가정

- **가용 시간**: 본 cycle은 v0.40.0 미완 상태와 합치므로 **4-5시간** (v0.40.0 plan 추정 3.5-4.5h에 v0.41.x 신규 ~1h 추가).
- **리스크 톨러런스**: LOW. v0.39.1 cycle 학습("외부 인터페이스 PR 본문 ≠ 권위") 그대로 적용 — Wave 2 spot 실측 유지.
- **하루 단위 작업** 채택 어려움. v0.41.x neuf cycle은 **v0.40.0 흡수 + 신규 4건 검증 한정**.

---

## 1. 상황 요약 (P1+P2 핵심 5줄)

1. **누적 영향 33개 파일** (v0.40.0 27개 + v0.41.x 신규 6개). **Critical 0 / High 5 / Medium 10 / Low 28**. 즉시 수정 0건.
2. **P1~P7 7개 검증 모두 0건**: bkit는 `bash -c` wrapper 미사용 / `argsPattern` 미정의 / ACP 미사용 / conversation log 미파싱 / env var placeholder 미사용 / telemetry 미활성 → **v0.41.x Breaking 4건 직접 영향 0건**.
3. **High 5건 = P0 1줄~15분 수정**: testedVersions 4개 추가 (`0.40.0/0.40.1/0.41.0/0.41.1`) + version flag 8개 신설 + topic narration 명시 잠금 + autoMemory/memoryManager 명시 + tc38 매트릭스 동기.
4. **간접 위험 1건**: 21개 FULL tier agents의 LLM 런타임이 `bash -c "..."` wrapper를 호출하면 PR #25720 recursive validation에 걸릴 가능성. 정적 분석으로 무력화 어려움 — **회귀 스모크 1h 권고**.
5. **자동 적용 4건 + 채택 5건 + 잔존 5건 = 14건 활용 후보**. 가장 큰 개선 기회는 **MCP resources export (~30% 토큰 절감 추정)** 이지만 **별도 cycle 위임**.

---

## 2. 대안 비교 매트릭스

### 2.1 전략 정의 (5개)

| 전략 | 정의 | 작업 시간 | 핵심 |
|------|------|----------|------|
| **A** | Minimal — testedVersions 4개 추가 + version flag 8개 신설 + topic narration 잠금 + tc38 매트릭스 | ~50분 | "v0.40.0+v0.41.x stable 따라잡기" 최소 단위 |
| **A'** | A + 단일 spot 실측 (topic narration L3 baseline 1회) | ~1.5h | 회귀 차단 1건만 추가 — Strategy A의 신뢰도만 보강 |
| **B** | Standard — A + autoMemory/memoryManager 명시 + tc113/tc107 파일 존재 실측 + bkit-permissions deny spot + full baseline 1회 + 문서 갱신 | ~3.5-4h | v0.40.0 cycle Strategy B와 동형 |
| **B' (추천)** | Standard + Spot Verification — B + **21개 agent 회귀 스모크 1h** + topic narration L3 spot + npx 격리 `tools.core` schema 실측 | ~4.5-5h | v0.40.0 cycle Strategy B' + v0.41.x 간접 위험 차단 1건 |
| **C** | Full — B' + MCP resources export PoC + v2.1.0 plan Section 4/5/6 본격 갱신 + autoMemory 옵트인 검증 + `--session-id` 채택 + tools.core 카탈로그 도출 | ~26h (~3-4d) | v0.40.0 + v0.41.x 신규 14건 모두 활용 |

### 2.2 가중 점수 매트릭스

가중치(사용자 컨텍스트 반영):
- 마이그레이션 안전성 0.25 (Critical 0 — 안전성 가중치 약간 하향)
- 작업 시간 0.20 (가용 4-5h 가정)
- 회귀 차단 0.25 (간접 위험 21 agent — 가중치 상향)
- 새 기능 활용 0.10
- v2.1.0 시너지 0.10
- v0.40.0 cycle 흡수 일관성 0.10 (신규 차원 — 본 cycle 특성)

각 차원 1~10점:

| 차원 (가중치) | A | A' | B | **B'** | C |
|--------------|---|---|---|----|---|
| 마이그 안전성 (0.25) | 7 | 8 | 9 | **10** | 9 |
| 작업 시간 (0.20) | **10** | 9 | 8 | 7 | 2 |
| 회귀 차단 (0.25) | 5 | 7 | 8 | **10** | 9 |
| 새 기능 활용 (0.10) | 1 | 1 | 3 | 4 | **10** |
| v2.1.0 시너지 (0.10) | 1 | 1 | 2 | 3 | **10** |
| v0.40.0 흡수 일관성 (0.10) | 6 | 6 | 9 | **10** | 8 |
| **가중 합** | **5.85** | **6.40** | **7.40** | **8.00** | 7.45 |

### 2.3 대안별 정량 비교

| 항목 | A | A' | B | **B'** | C |
|---|---|---|---|----|---|
| 작업 시간 | ~50분 | ~1.5h | ~3.5-4h | **~4.5-5h** | ~26h |
| 위험도 | LOW (간접 미차단) | LOW | LOW | **LOW (간접 1건 차단)** | MEDIUM (PoC 회귀 분리도 ↓) |
| 코드 수정 라인 | ~10줄 | ~10줄 | ~20줄 | ~20줄 | ~200줄+ |
| 신규 테스트 | 0 | 0 | 0 | 0 (스모크는 임시 1회) | 1-2개 |
| L3 실측 횟수 | 0 | 1회 | 1회 | **2회** (narration + tools.core schema) | 3+회 |
| Full baseline 실행 | 0 | 0 | 1회 | **1회** | 2회+ |
| PR 단위 | 단일 | 단일 | 단일 | **단일** | 1+α (별도 cycle 분리 안 하면 비대) |
| v0.40.0 cycle 흡수 | 부분 (P0만) | 부분 | 완전 | **완전** | 완전+α |
| v2.1.0 게이트 노출 | flag 8개 | flag 8개 | flag 8개 | **flag 8개** | flag 8개 + 본격 PoC |

### 2.4 bkit 핵심 가치 부합도 (3대 가치 × 5 전략)

| 가치 | A | A' | B | **B'** | C |
|---|---|---|---|----|---|
| **Automation First** | 부분 (게이트만) | 부분 | ✅ | ✅ | ✅ + PoC |
| **Docs = Code** | △ (의도 명문화 부족) | △ | ✅ | ✅ | ✅ |
| **AI Partnership** | △ | △ | ✅ | ✅ | ✅✅ (autoMemory 옵트인) |

---

## 3. 추천 전략 — Strategy B' (Standard + Spot Verification)

### 3.1 이름 및 점수
**Strategy B' (Standard + Spot Verification)** — 가중 점수 **8.00점 (1위, C 대비 +0.55, B 대비 +0.60)**.

### 3.2 1순위 이유 (3가지)

1. **v0.40.0 cycle Strategy B' 패턴 11번째 적용 — 검증된 패턴**: Strategy B' family는 v0.37.1 이후 10번 연속 적용된 안정 패턴. 본 cycle은 11번째 적용으로 일관성 + 검증된 절차 + 위험 예측력을 모두 확보. 메모리 인덱스 (`MEMORY.md`)에 누적된 10개 cycle 학습이 그대로 적용 가능.

2. **v0.41.x 간접 위험(21 agent recursive shell) 차단 신뢰도 9 → 10**: P2 §1.2가 명시한 "정적 분석으로 무력화 어려움" 위험을 **1h 스모크로 동적 검증**. v0.41.0 PR #25720 정책 변화는 LLM이 호출하는 명령에만 적용되므로 정적 grep만으로 보장 불가 — 21개 agent 1개 샘플 명령씩 실행하면 회귀 신호 즉시 검출 가능. 이는 Strategy B 대비 가장 큰 차별점.

3. **v0.40.0 cycle 흡수 일관성 10점 — 단일 PR 운영 효율**: v0.40.0 cycle Plan/Impact가 Do 미완료로 잔존하는 상황에서, v0.41.x를 별도 cycle로 처리하면 PR 2개·테스트 2회·머지 충돌·문서 동기화 부담이 발생. B' 채택 시 단일 PR로 v0.39.1→v0.41.1 누적 누락 0건 보장. 메모리 (`project_v0400_migration.md`)의 "v2.1.0 trigger fired" 학습과 정합.

### 3.3 2순위 / 3순위 거절 이유

- **Strategy C (Full, 26h, 7.45점)**: 새 기능 활용 10점이지만 작업 시간 가중치 0.20에서 2점 — v2.1.0 시너지 가중치(0.10)가 회귀 차단(0.25) + 안전성(0.25)을 못 이김. **PoC가 회귀 차단 신호와 섞이는 분리도 저하**가 본질적 문제. C는 별도 cycle (v2.1.0 plan refresh + implementation cycle)로 분리하는 것이 plan-plus 권장.

- **Strategy B (Standard, 7.40점)**: B'와 0.60 차이의 핵심은 **21 agent 스모크 누락**. v0.41.0 PR #25720은 LLM 런타임 명령에 정책을 적용하므로 정적 분석만으로 무력화 어려움 — 신뢰도 ⬛⬛⬛⬛⬜에서 ⬛⬛⬛⬛⬛으로 올리려면 spot 1h가 필수. 1h 추가의 ROI가 압도적.

- **Strategy A/A' (Minimal/+1, 5.85/6.40점)**: 50분~1.5h로 빠르지만 **v0.40.0 cycle 흡수 부분만**. autoMemory/memoryManager 명문화, 21 agent 스모크, tc113/tc107 파일 존재 spot, full baseline 회복 검증 모두 누락 — v0.40.0 plan AC 항목과 정합 안 됨. 본 cycle을 단일 누적 PR로 닫지 못하고 후속 cycle 부담 누적.

### 3.4 대안 활성화 조건 (가용 시간/긴급도 변경 시)

- **가용 시간 1h 미만 (긴급)** → Strategy A로 강제 축소 (Wave 1 P0 5건만 — testedVersions/version flag/topic narration/autoMemory 명시/tc38). v0.40.0 cycle Plan은 그대로 보존 후 별도 PR.
- **가용 시간 1d 이상 + v2.1.0 cycle 본 cycle과 합치기 결정** → Strategy C로 확장 (별도 cycle 합병).
- **21 agent 스모크 결과 회귀 1건 이상 발견** → Wave 2 일시 중단 + 회귀 분석 cycle 진입 (B' → 회귀 cycle).

---

## 4. 구현 로드맵 (Strategy B', 4-5h)

총 예상 시간: **~4.5-5시간** (Wave 1 ~30분, Wave 2 ~3-3.5h, Wave 3 ~1h, Buffer ~30분).

### Wave 1 (P0, ~30분) — Critical Patch + 회귀 사전 차단 + v0.40.0 흡수

| # | 작업 | 파일 (file:line) | 검증 (L1/L2/L3) | 의존성 | 예상 시간 |
|---|------|-----------------|---------------|--------|---------|
| W1.1 | testedVersions에 `"0.40.0", "0.40.1", "0.41.0", "0.41.1"` 4개 추가 | `bkit.config.json:120` | L1 unit (json schema) | — | 2분 |
| W1.2 | v0.40.0+ flag 그룹 4개 + v0.41.0+ flag 그룹 4개 신설 (총 8개) | `lib/gemini/version.js:212` 뒤 | L1 unit (`tc04-lib-modules`) | W1.1 | 15분 |
| W1.3 | `general.topicUpdateNarration: false` 명시 잠금 | `.gemini/settings.json:2` | L2 baseline (Wave 2.5에서 검증) | — | 5분 |
| W1.4 | `experimental.autoMemory: false` + `experimental.memoryManager: false` 명시 (의도 명문화) | `.gemini/settings.json` (W1.3과 동일 객체에 추가) | L1 (json valid) | W1.3 | 5분 |
| W1.5 | tc38 매트릭스에 v0.40.0+ 4개 + v0.41.0+ 4개 = 8개 항목 추가 | `tests/suites/tc38-feature-flags-matrix.js` | L1 unit (tc38 PASS) | W1.2 | 15분 |

**Wave 1 산출물**: 5개 파일 수정 (~20줄). v0.40.0+v0.41.x feature flag 8개 노출. topic narration / autoMemory 의도 명문화.
**Wave 1 AC**: `node tests/run-all.js --suite=tc04,tc38,smoke` PASS.

### Wave 2 (P1, ~3-3.5h) — Spot Verification + 21 Agent Smoke + Baseline 회복

| # | 작업 | 파일/명령 | 검증 (L1/L2/L3) | 의존성 | 예상 시간 |
|---|------|---------|---------------|--------|---------|
| W2.1 | tc113/tc107 파일 존재 실측 | `find tests/suites -name "tc107*" -o -name "tc113*" -o -name "*25655*"` | 명령 결과 — 부재 시 v0.39.0/v0.39.1 cycle 누락 처리 (별도 P1 부채 등록, 본 cycle 진행 차단 안 함) | — | 10분 |
| W2.2 | topic narration L3 baseline 실측 (v0.40.0 default-on 검증) | `(cd /tmp && npx --yes @google/gemini-cli@0.41.1 -p "list 3 numbers")` 1회 stdout 캡처 + 잡음 line 카운트 | L3 1회 — narration 줄 수 == 0 (W1.3 적용 후) | W1.3 | 15분 |
| W2.3 | `tools.core` 키 schema 실측 (v0.41.0 신규, P2 §13 신뢰도 ⬛⬛⬛⬜⬜) | `npx --yes @google/gemini-cli@0.41.1 --help` 또는 bundle js grep으로 정확한 키 명칭(`tools.core` vs `tools.coreTools`) 확정 | L3 1회 | — | 15분 |
| W2.4 | bkit-permissions deny 우선순위 spot (v0.40.0 plan W2.3 잔존) | `gemini --approval-mode=yolo -p "rm -rf /tmp/xxx"` 시뮬 (격리 sandbox) | L2 spot — deny 우선 동작 확인 | — | 15분 |
| W2.5 | **21 agent 회귀 스모크** (v0.41.x 신규 — PR #25720 recursive shell validation 간접 위험 차단) | 21개 FULL tier agents × 1개 샘플 명령씩 (`run_shell_command(ls)` 등 단순 명령). 실패 1건이라도 발견 시 회귀 분석 cycle 진입 | L2 — 21/21 PASS | W1 전체 | 60분 |
| W2.6 | full baseline 1회 (1925/2032 회복 확인) | `node tests/run-all.js` | L2 baseline — pass count >= 1925 | W1 전체 | 30-60분 |
| W2.7 | tc115 / tc113 / tc38 회귀 명시 PASS 확인 | run-all 결과 grep | L2 grep | W2.6 | 5분 |
| W2.8 | docs/01-plan/research + docs/03-analysis 본 cycle 산출물 참조 무결성 | path read | — | — | 5분 |

**Wave 2 산출물**: spot 실측 4건 (tc113/tc107 존재, topic narration L3, tools.core schema, deny 우선순위) + **21 agent 스모크 결과** + full baseline 회복 명시.
**Wave 2 AC**:
- `find` 결과: tc113 / tc107 파일 존재 또는 부재 명시 (부재 시 별도 부채로 등록)
- L3 실측 (narration): noisy line == 0 (W1.3 적용 후)
- L3 실측 (tools.core schema): 키 명칭 확정
- 21 agent 스모크: 21/21 PASS
- Full baseline: pass >= 1925 (v0.39.1 baseline 회복)
- tc115 (trust env), tc113 (#25655 SessionStart) 모두 PASS

### Wave 3 (P2, ~1h) — 문서 갱신 + 버전 bump + v2.1.0 trigger 메모

| # | 작업 | 파일 (file:line) | 검증 | 의존성 | 예상 시간 |
|---|------|-----------------|------|--------|---------|
| W3.1 | `GEMINI.md:1, 67` 헤더/footer bkit v2.0.6 → v2.0.7 | `GEMINI.md` | L1 grep | — | 5분 |
| W3.2 | README.md v0.40.0+v0.41.1 testedVersions + 신규 안내 1단락 | `README.md` | L1 grep | W1.1 | 15분 |
| W3.3 | `gemini-cli-learning/SKILL.md`에 11개 단락 추가 (v0.40.0 5개 + v0.41.x 6개) | `gemini-cli-learning/SKILL.md` | L1 read | — | 30분 |
| W3.4 | `gemini-cli-learning/SKILL.md`에 `/new` alias + `/voice` slash command + Voice Mode 외부 의존 (sox/whisper) 1줄씩 | 동일 | L1 read | W3.3 | 5분 |
| W3.5 | `bkit.config.json` version `2.0.6` → `2.0.7` | `bkit.config.json` | L1 (json valid) | — | 1분 |
| W3.6 | v2.1.0 plan trigger 메모 추가 (`docs/01-plan/features/v2.1.0-context-optimization.plan.md` Section 4/5/6에 "v0.41.x 신규 시너지 3건" 1단락만 — 본격 갱신은 별도 cycle) | v2.1.0 plan | L1 read | — | 15분 |
| W3.7 | 본 cycle Phase 4 Do PR 진입 준비 (commit message 초안) | — | — | W1~W2 전체 | 10분 |

**Wave 3 산출물**: bkit v2.0.7 일관성 (3개 파일) + gemini-cli-learning SKILL.md 11단락 + v2.1.0 plan 진입 trigger 메모 + PR commit message.
**Wave 3 AC**:
- 모든 docs에 v0.40.0 + v0.41.0 + v0.41.1 testedVersions 명시
- bkit v2.0.7 일관성 (GEMINI.md, README.md, bkit.config.json)
- v2.1.0 plan에 v0.41.x 시너지 3건 trigger 메모 (본격 갱신은 별도 cycle 명시)
- PR commit message 초안 준비

### Wave 4 (선택, 별도 cycle 위임)

본 cycle에서 제외, **별도 cycle**에 위임:

| 항목 | 위임 cycle | 근거 |
|---|---|---|
| MCP resources export PoC (`bkit://philosophy/*`, `bkit://templates/*`) | v2.1.0 plan refresh cycle | v0.40.0 plan D2 그대로 |
| 4-tier namespace docs 명문화 | v2.1.0 plan refresh cycle | v0.40.0 plan D3 그대로 |
| `GEMINI_CLI_TRUSTED_FOLDERS_PATH` bootstrap 자동화 | onboarding UX cycle | v0.40.0 plan §7 그대로 |
| autoMemory scratchpad 옵트인 검증 (PR #25873) | v2.1.0 implementation cycle | autoMemory 활성 시 메모리 정책 변화 동반 — 단독 검증 권고 |
| `tools.core` allowlist 카탈로그 도출 (PR #25720) | 별도 보안 강화 cycle | 21 agent 자주 쓰는 명령 카탈로그 도출 + recursive validation 회귀 검증 ~1d |
| `--session-id <uuid>` flag 채택 (PR #26060) | v2.1.0 implementation cycle | baseline runner 디버깅 UX 향상 — v2.1.0 sidecar 인터페이스와 함께 검토 |
| Voice Mode (`/voice`, PR #24174) | docs only | bkit headless 무관, 학습 SKILL에 1줄만 |
| Gemma 4 (experimental, PR #25604) | 별도 외부 모델 cycle | 외부 API 정책 변경 동반 |
| transient error sticky_retry / slow boot fix / loop detection AbortError fix | 자동 적용 | 무수정 |
| Telemetry logPrompts fix (v0.40.1) | 자동 적용 | bkit telemetry 미사용 → 미래 활성 시 자동 안전 |

---

## 5. 위험 관리

### 5.1 리스크 매트릭스

| ID | 리스크 | 가능성 | 영향 | 완화책 | 잔존 위험 |
|----|--------|-------|------|--------|----------|
| R1 | topic narration default-on 미차단 시 baseline noisy stdout 회귀 | MED | LOW (cosmetic, assertion 깨짐 잠재) | W1.3 1줄 + W2.2 L3 1회 실측 | LOW |
| R2 | 4-tier memory paths를 가정한 bkit 코드 누락 발견 (v0.40.0 그대로) | LOW | LOW | P2 §1.4 grep 0건 + W2.6 baseline 회복 | NEAR-ZERO |
| R3 | PR #25827 (Issue #25655) 머지 시점이 본 cycle 작업과 충돌 | LOW | LOW | tc113 카나리아 유지 + W2.1 파일 존재 실측 | LOW |
| R4 | v0.42.0-preview가 본 cycle 작업 중 출시 | LOW | MED | W1만 즉시 머지, W2/W3 흡수. v0.41.1은 hotfix 직후이므로 v0.42 출시까지 ~2주 여유 추정 | LOW |
| R5 | 누적 갭 hidden regression — pass 1925/2032 미달 | LOW-MED | LOW | W2.6 full baseline 1회 + W2.7 카나리아 PASS | LOW |
| R6 | YOLO + dangerous heuristic이 bkit-permissions deny와 충돌 | LOW | MED (보안) | W2.4 spot. 충돌 시 P3 부채 등록 후 본 cycle 진행 | LOW |
| R7 | tc113 / tc107 파일 부재 발견 (v0.39.0/v0.39.1 cycle 누락) | LOW | MED | W2.1 find 실측. 부재 시 별도 P1 부채 등록 | LOW |
| R8 | `general.topicUpdateNarration` 키 위치 적용 안 됨 (alias 우선순위) | LOW | LOW | W2.2 L3 실측 자동 검출 + alias `experimental.topicUpdateNarration: false` 페어 추가 fallback | NEAR-ZERO |
| **R9** | **21 agent 회귀 스모크에서 PR #25720 recursive shell validation 차단 발견 (v0.41.x 신규)** | **LOW-MED** | **MED-HIGH** (LLM 행동 변경) | **W2.5 스모크 21/21**. 회귀 1건이라도 발견 시 회귀 분석 cycle 진입 — 본 cycle 일시 중단 | **LOW (스모크로 차단)** |
| R10 | `tools.core` 키 schema 실제 명칭이 보고서와 다름 (Phase 1 §13 #2 잔존) | LOW | LOW | W2.3 npx 격리 실측. 차이 시 W1.2 flag 명칭 수정 | NEAR-ZERO |

**전체 위험도**: **LOW** (Critical 0건, R9가 신규 가장 큰 위험이지만 스모크 1h로 차단). v0.40.0 cycle (LOW)와 동일 수준 + R9 1건 추가.

### 5.2 21 Agent 회귀 스모크 방법 (W2.5 상세)

**목적**: PR #25720 recursive shell validation이 21개 FULL tier agents의 LLM 런타임 호출을 차단하는지 동적 검증.

**절차**:
1. 21개 agent 목록 추출: `find agents -name "*.md" -exec grep -l "tier: FULL\|allowed-tools.*run_shell_command" {} +`
2. 각 agent별 1개 샘플 명령 정의 (단순 명령부터 점진적 — 예: `run_shell_command(ls)`, `run_shell_command(pwd)`, `run_shell_command(git status)`)
3. bkit MCP `spawn_agent`로 각 agent 호출 + 1개 샘플 명령 실행 (LLM이 다른 명령을 호출하지 않도록 prompt에 명시)
4. v0.41.1 정책 엔진 통과 여부 + 실행 결과 PASS/FAIL 기록
5. 21/21 PASS 시 W2.6 진행. 실패 1건이라도 발견 시 본 cycle 일시 중단 + 회귀 분석 cycle 진입.

**예상 시간**: 60분 (각 agent 호출 ~3분 × 21개 = 63분).

**Fallback**: 21개 전체가 부담스러우면 **샘플 5개** (cto-lead, qa-strategist, bkend-expert, code-analyzer, pm-discovery — FULL tier 대표) 만 검증하고 나머지는 추후 별도 cycle 흡수. 시간 압박 시.

### 5.3 회귀 모니터링 (Wave 2.6 baseline 회복 검증)

- **Pre-Wave 2.6 baseline**: v0.39.1 cycle close 시점 pass count = 1925/2032 (v0.39.1 cycle report 기준)
- **Wave 2.6 baseline**: `node tests/run-all.js`
- **AC**: pass >= 1925 (v0.39.1 baseline 회복). pass < 1925 시 회귀 분석 (어떤 suite가 깨졌나?)
- **fail/skip 분포**: v0.39.1 cycle report와 동일해야 함. 예상 분포: 107 fail/skip = 사전 부채 83건 + skip 24건 (정확한 분포는 v0.39.1 report 참조)

### 5.4 롤백 전략

- **L1 rollback** (코드 단위): `git revert <commit-sha>` — bkit.config.json / .gemini/settings.json / lib/gemini/version.js / tc38 변경 모두 1줄~수줄로 atomic.
- **L2 rollback** (사용자 환경): `~/.gemini/settings.json`에 `general.topicUpdateNarration: true` (또는 미설정) 으로 복구 — bkit `.gemini/settings.json`은 project-scope이므로 user-scope override 가능.
- **L3 rollback** (CLI 다운그레이드): `npx --yes @google/gemini-cli@0.39.1`로 CLI 자체 다운그레이드 — bkit testedVersions에 0.39.1 유지 보장.
- **R9 rollback** (21 agent 스모크 실패 시): Wave 1 commit 직전으로 되돌리고 회귀 분석 cycle 진입. 별도 cycle에서 PR #25720 영향 받는 명령 패턴 식별 + agent prompt 갱신 후 재진입.

---

## 6. YAGNI 결정 기록 (제거/연기 항목 + 이유)

각 후보 항목의 채택/유보/제거 + 1줄 검증:

| # | 항목 | 채택? | 1줄 근거 |
|---|------|-------|---------|
| 1 | testedVersions에 0.40.0/0.40.1/0.41.0/0.41.1 추가 (4개) | ✅ 채택 (W1.1) | 호환성 명시 부채 — 1줄 |
| 2 | v0.40.0+ flag 4개 + v0.41.0+ flag 4개 = 8개 신설 | ✅ 채택 (W1.2) | capability gating 표준 — 1줄 게이팅으로 미래 활용 진입 |
| 3 | `general.topicUpdateNarration: false` 명시 잠금 | ✅ 채택 (W1.3) | default `true` → noisy stdout 회귀 사전 차단 — 1줄 |
| 4 | tc38 매트릭스 8개 항목 추가 | ✅ 채택 (W1.5) | flag 추가와 동기화 의무 — 8줄 |
| 5 | `experimental.autoMemory: false` 명시 | ✅ 채택 (W1.4) | default `false`이지만 No Guessing 원칙 + 향후 default 변경 회귀 방어 |
| 6 | `experimental.memoryManager: false` 명시 | ✅ 채택 (W1.4) | autoMemory와 페어로 명시 — 의도 명문화 |
| 7 | tc116 신규 (v0.40.0/v0.41.x 회귀 카나리아) | ❌ 제거 | tc115(v0.39.1 trust) + tc113(#25655) 카나리아 둘 다 v0.40.0/v0.41.x에서 PASS 유지 예상 — 신규 카나리아 신호 0개. **B' Spot 검증으로 대체** (W2.1 + W2.2 + W2.5) |
| 8 | tc113/tc107 파일 존재 실측 (v0.40.0 그대로) | ✅ 채택 (W2.1) | find 1줄 — 부재 시 v0.39.0/v0.39.1 cycle 누락 확정 |
| 9 | topic narration L3 baseline 1회 실측 | ✅ 채택 (W2.2) | 정적 분석으로 충분하지만 stdout 노이즈는 실측이 1차 권위 |
| 10 | bkit-permissions deny 우선순위 spot | ✅ 채택 (W2.4) | YOLO + dangerous heuristic 차단 bkit 보안 영향 — 5분 spot |
| 11 | **21 agent 회귀 스모크 (v0.41.x 신규)** | ✅ 채택 (W2.5) | **PR #25720 recursive shell validation 간접 위험 — 정적 분석 무력화 어려움. 1h spot으로 신뢰도 9→10** |
| 12 | tools.core 키 schema 실측 (v0.41.x 신규) | ✅ 채택 (W2.3) | Phase 1 §13 #2 잔존 — flag 명칭 정확성 확보 |
| 13 | full baseline 1회 (Wave 2.6) | ✅ 채택 (W2.6) | 누적 갭 hidden regression 차단 |
| 14 | MCP resources export PoC (philosophy 4개) | ❌ 별도 cycle 위임 | v2.1.0 plan refresh cycle 단독 PoC — 본 cycle 혼합 시 회귀 차단 분리도 ↓ |
| 15 | 4-tier namespace docs 명문화 (`context-engineering.md`) | ❌ 별도 cycle 위임 | 영향 0건 docs-only — v2.1.0 cycle과 묶기 |
| 16 | GEMINI_CLI_TRUSTED_FOLDERS_PATH bootstrap 활용 | ❌ 별도 cycle 위임 | onboarding UX cycle 잔존 |
| 17 | autoMemory scratchpad 옵트인 검증 (v0.41.x 신규) | ❌ 별도 cycle 위임 | 메모리 정책 변화 동반 — 단독 검증 권고 |
| 18 | `tools.core` allowlist 카탈로그 도출 (v0.41.x 신규) | ❌ 별도 cycle 위임 | 21 agent 명령 카탈로그 ~1d — 보안 강화 cycle |
| 19 | `--session-id <uuid>` flag 채택 (v0.41.x 신규) | ❌ 별도 cycle 위임 | v2.1.0 sidecar 인터페이스와 함께 검토 |
| 20 | Voice Mode (`/voice`) docs 1줄 (v0.41.x 신규) | ✅ 채택 (W3.4) | 학습 SKILL 1줄 — bkit headless 무관이지만 사용자 학습 가치 |
| 21 | Gemma 4 experimental docs (v0.41.x 신규) | ❌ 제거 | 외부 API 정책 변경 동반 — bkit 의도 외 |
| 22 | `/new` alias docs 1줄 (v0.40.0 그대로) | ✅ 채택 (W3.4) | 5분 |
| 23 | gemini-cli-learning SKILL 11단락 갱신 (v0.40.0 5 + v0.41.x 6) | ✅ 채택 (W3.3) | Docs=Code |
| 24 | README.md v0.40.0+v0.41.1 안내 | ✅ 채택 (W3.2) | testedVersions 갱신과 동기 |
| 25 | GEMINI.md / bkit.config.json 버전 bump | ✅ 채택 (W3.1, W3.5) | bkit v2.0.6 → v2.0.7 |
| 26 | v2.1.0 plan trigger 메모 (1단락) | ✅ 채택 (W3.6) | 본격 갱신은 별도 cycle, 진입점만 명시 |
| 27 | sticky_retry / slow boot fix / loop detection fix docs | ❌ 제거 | 자동 적용 — docs 갱신 가치 낮음, gemini-cli-learning에 통합 가능 |

**채택률**: 27 후보 중 17 채택 + 7 별도 cycle 위임 + 3 제거 = **YAGNI 절감 ~37%** (10/27). v0.40.0 cycle YAGNI 절감(~28%)보다 높은데, 이는 v0.41.x 신규 14건 활용 후보 중 11건이 별도 cycle 위임 가능했기 때문 (자동 적용 4건 + 별도 cycle 5건 + 제거 2건).

---

## 7. bkit 가치 부합도 평가 (3대 핵심 가치 × 1줄)

| 가치 | v0.41.x 변경 정렬 | Strategy B' 평가 |
|------|-----------------|----------------|
| **Automation First** | YOLO fail-closed (No Guessing 강화), env var auto-cast (Docs=Code), recursive shell validation (Automation 강화) | ✅ 강화 — Wave 1 P0 5건이 모두 자동화 흐름 정밀화 |
| **Docs = Code** | 4-tier 메모리 paths 명문화 (`docs/cli/auto-memory.md` +143 lines, v0.40.0), v0.41.x docs 동기화 | ✅ 정렬 — Wave 3 SKILL 11단락 + README 1단락 + v2.1.0 trigger 메모 |
| **AI Partnership** | autoMemory scratchpad (-16.7% turns, +32.7% precision), ContextManager 재편 — AI 협업 효율 향상 | ✅ 강화 — flag 8개 노출로 v2.1.0 cycle 진입 게이트 확보 (PoC는 별도 cycle) |

**종합**: 3대 가치 모두 ✅. Strategy B'는 v0.40.0 plan의 4원칙 강화 정합성 그대로 흡수 + v0.41.x 신규 시너지 3건 추가.

---

## 8. 결정 항목 (Decisions) — D1~D6

### D1: 권장 전략

**옵션**: (a) Strategy A / (b) Strategy A' / (c) Strategy B / (d) **Strategy B'** ← 권장 / (e) Strategy C

**권장**: (d) Strategy B'.

**근거**: §3.2 1순위 이유 3가지. 가중 점수 8.00 (1위, B 대비 +0.60).

### D2: MCP resources export — 본 cycle vs v2.1.0 별도 cycle

**옵션**: (a) 본 cycle Wave 4 / (b) **v2.1.0 plan refresh cycle 단독 PoC** ← 권장 / (c) v2.0.x 패치 cycle

**권장**: (b). v0.40.0 plan D2 그대로 — 본 cycle 혼합 시 회귀 차단 분리도 저하. v0.41.x autoMemory scratchpad 시너지가 추가됐지만 분리 정책 유지.

### D3: v2.1.0 plan 갱신 시점 — 본 cycle 포함 vs 별도 cycle

**옵션**: (a) 본 cycle Wave 3 본격 갱신 / (b) **본 cycle은 trigger 메모 1단락만, 본격 갱신은 별도 cycle** ← 권장 / (c) v2.1.0 cycle과 합치기

**권장**: (b). v0.40.0 plan D3 그대로 + v0.41.x 시너지 3건 trigger 메모만 추가.

### D4: testedVersions 누적 정책

**옵션**: (a) **모두 누적 (`["0.34.0", ..., "0.41.1"]`)** ← 권장 / (b) 최근 N개 / (c) 최신 1개

**권장**: (a) 누적 유지 (v0.40.0 plan D4 그대로). v0.41.x로 N=10 도달 — 다음 cycle에서 D4 재검토.

### D5: 사전 부채 83건 처리

**옵션**: (a) **본 cycle은 v0.41.x만 — 사전 부채 미처리** ← 권장 / (b) Wave 4에 P0 부채 1-2건 흡수 / (c) 별도 부채 cycle

**권장**: (a). v0.40.0 plan D5 그대로 — Wave 2.6 baseline 1회 실측에서 v0.41.x 변화로 부채 항목이 자동 해소/악화되는지 보고만 (1줄).

### D6: 21 agent 회귀 스모크 범위 (v0.41.x 신규)

**옵션**: (a) **21개 전체 회귀 스모크 (~60분)** ← 권장 / (b) 샘플 5개 (FULL tier 대표) / (c) 스모크 생략 (Strategy B로 강제)

**권장**: (a) 21개 전체. PR #25720 recursive shell validation은 LLM 행동 변경이라 정적 분석 무력화 어려움 — 21/21 PASS로 신뢰도 ⬛⬛⬛⬛⬛ 확보. 시간 압박 시 (b)로 fallback.

**근거**: §3.2 1순위 이유 #2 — Strategy B와 B'의 핵심 차별점.

---

## 9. AC (Acceptance Criteria) — 본 cycle 성공 기준

### 9.1 정량

1. **L1 unit**: tc04 / tc38 / smoke PASS (Wave 1).
2. **L2 baseline**: `node tests/run-all.js` pass >= 1925 (v0.39.1 baseline 회복) — Wave 2.6.
3. **L3 spot (narration)**: topic narration noisy line == 0 (W1.3 적용 후 npx 격리 실측) — Wave 2.2.
4. **L3 spot (tools.core)**: 키 schema 명칭 확정 (예: `tools.core` vs `tools.coreTools`) — Wave 2.3.
5. **회귀 카나리아**: tc115 (trust env) PASS + tc113 (#25655 SessionStart) PASS — Wave 2.7.
6. **21 agent 스모크**: 21/21 PASS — Wave 2.5. (R9 차단)
7. **bkit 버전**: GEMINI.md / README.md / bkit.config.json 모두 `bkit v2.0.7` 일관 — Wave 3.

### 9.2 정성

1. **YAGNI 준수**: Wave 4 (MCP resources, v2.1.0 plan refresh, namespace docs, autoMemory PoC, tools.core 카탈로그, --session-id, Gemma 4) 모두 별도 cycle 위임 — 본 cycle ~4.5-5h 유지.
2. **외부 인터페이스 실측**: tc113/tc107 파일 존재, topic narration L3 stdout, tools.core schema, YOLO+deny 우선순위, **21 agent 스모크** — 모두 spot 실측 결과 명시.
3. **v0.39.1+v0.40.0 cycle 학습 적용**: Strategy B' 11번째 적용. "gemini-researcher 보고는 1차 자료이지 권위 아님" 원칙 본 cycle도 유지.
4. **v0.40.0 cycle 흡수**: v0.40.0 plan W1~W3 모든 항목이 본 plan에 흡수 + v0.41.x 신규 추가 — v0.40.0 cycle Plan은 superseded 상태 표시.
5. **Decision 명문화**: D1~D6 본 plan에 모두 명시 — 향후 cycle 추적 가능.

---

## 10. 다음 단계 트리거

본 cycle (v0.39.1→v0.41.1 누적) close 후 즉시/조건부 진입할 별도 cycle:

| Cycle | 진입 조건 | 본 plan에서 위임된 항목 | 예상 시간 |
|-------|----------|------------------------|---------|
| **v2.1.0 plan refresh cycle** | 본 cycle close 직후 (1주 이내) | Section 4/5/6/9 본격 갱신, MCP resources PoC 후보 등록, 4-tier namespace docs 명문화, autoMemory scratchpad 검토, tools.core allowlist 카탈로그 후보 | ~1d |
| **v2.1.0 implementation cycle** | v2.1.0 plan refresh cycle close 후 | MCP resources export PoC + autoMemory 옵트인 + --session-id 채택 | ~3-5d |
| **v0.42.0 / next stable cycle** | v0.42.0 stable 출시 시 | Wave 1만 즉시 머지 + Wave 2/3 흡수 | ~3-4h |
| **bkit-baseline-stabilization cycle** | 사전 부채 83건 처리 의사 결정 시 | PDCA-* 35 + TC80-* 9 + COMP-* 7 + TC94/91/110/96/109/98/tc92 29건 | ~1-2주 |
| **onboarding UX cycle** | 신규 사용자 onboarding 강화 의사 결정 시 | `GEMINI_CLI_TRUSTED_FOLDERS_PATH` 활용 + bootstrap-trust.sh 자동화 | ~1-2d |
| **보안 강화 cycle** | tools.core allowlist 채택 의사 결정 시 | 21 agent run_shell_command 카탈로그 + recursive validation 회귀 검증 | ~1d |

**우선순위 추천**: v2.1.0 plan refresh cycle > v0.42.0 stable cycle (출시 시) > 나머지.

---

## 11. 승인 체크리스트 (사용자 확인 전 검토 항목)

### 11.1 Plan 자체 검토

- [ ] D1 (Strategy B') 채택 여부 확인
- [ ] D2 (MCP resources 분리) 동의 — v2.1.0 plan refresh cycle 별도 진입 동의
- [ ] D3 (v2.1.0 plan trigger 메모만) 동의
- [ ] D4 (testedVersions 누적) 동의
- [ ] D5 (사전 부채 미처리) 동의
- [ ] D6 (21 agent 전체 스모크) 동의 — 시간 압박 시 fallback 5개 옵션 사용 의사

### 11.2 작업 시간 가용성

- [ ] **4.5-5h 가용 시간** 확보 가능 (Wave 1 30분 + Wave 2 3-3.5h + Wave 3 1h + Buffer 30분)
- [ ] full baseline 30-60분 실행 가능한 환경 (네트워크 + Gemini API 할당량)
- [ ] 21 agent 스모크 60분 실행 가능 (Gemini API rate limit 고려)

### 11.3 v0.40.0 cycle 흡수 정책

- [ ] v0.40.0 plan을 superseded 처리하고 본 plan으로 통합 동의
- [ ] v0.40.0 cycle Phase 1 (Research) / Phase 2 (Impact) 산출물은 그대로 보존
- [ ] 본 cycle PR commit message에 "v0.39.1→v0.41.1 누적 마이그레이션" 명시 동의

### 11.4 위험 수용

- [ ] R4 (v0.42.0 출시 충돌) — 본 cycle 작업 중 출시 시 Wave 1만 즉시 머지 + W2/W3 흡수 정책 동의
- [ ] R7 (tc113/tc107 부재 발견) — 별도 P1 부채 등록 + 본 cycle 진행 차단 안 함 동의
- [ ] R9 (21 agent 스모크 회귀 발견) — 본 cycle 일시 중단 + 회귀 분석 cycle 진입 동의

### 11.5 Phase 4 Do 진입 준비

- [ ] gemini-migration SKILL.md Phase 4 절차 숙지 (Wave 1 → Wave 2 → Wave 3 순차 실행)
- [ ] PR commit message 포맷 결정 (제안: `feat(v2.0.7): Gemini CLI v0.39.1→v0.41.1 cumulative migration + 21 agent smoke + spot verification`)
- [ ] 본 cycle close 후 v2.1.0 plan refresh cycle 진입 알림 시점 결정

---

## 12. 참고 자료 (Phase 1/2 산출물 + 이전 cycle)

- **Phase 1 Research (v0.41.1 신규)**: `docs/01-plan/research/gemini-cli-v0.41.1-research.md` (2026-05-06)
- **Phase 2 Impact (v0.41.1 신규)**: `docs/03-analysis/gemini-cli-v0.41.1-impact.analysis.md` (2026-05-06)
- **v0.40.0 cycle 산출물 (흡수 대상)**:
  - `docs/01-plan/research/gemini-cli-v0.40.0-research.md` (Field Verification 정정 박스 포함)
  - `docs/03-analysis/gemini-cli-v0.40.0-impact.analysis.md`
  - `docs/01-plan/features/gemini-cli-v0.40.0-migration.plan.md` ← **본 plan으로 superseded**
- **이전 cycle plan (Strategy B' family)**:
  - v0.39.1: `docs/01-plan/features/gemini-cli-v0.39.1-migration.plan.md` (9th)
  - v0.39.0: `docs/01-plan/features/gemini-cli-v0.39.0-migration.plan.md` (8th)
  - v0.38.2: `docs/01-plan/features/gemini-cli-v0.38.2-migration.plan.md` (7th)
- **v2.1.0 plan**: `docs/01-plan/features/v2.1.0-context-optimization.plan.md` (Section 4/5/6 trigger 메모만 갱신, 본격 갱신은 별도 cycle)
- **bkit 철학**: `bkit-system/philosophy/{core-mission,ai-native-principles,context-engineering,workflow-philosophy}.md` (4대 원칙 — Phase 2 §7 검증)
- **메모리 인덱스**: `.claude/agent-memory/migration-strategist/MEMORY.md` + `project_v0400_migration.md` (Strategy B' 10번째 적용 학습 — 본 cycle은 11번째)

---

## 13. 본 plan close 후 다음 액션 (메인 세션용 요약)

1. **D1 (전략) 사용자 확인** — Strategy B' 채택 여부.
2. **D2/D3 (MCP resources / v2.1.0 plan)** — 분리 정책 그대로 유지 동의.
3. **D6 (21 agent 스모크 범위)** — 21개 전체 vs 샘플 5개 결정.
4. **Phase 4 Do 진입** — gemini-migration SKILL.md Phase 4 절차에 따라 Wave 1 → Wave 2 → Wave 3 순차 실행.
5. **PR 생성** — 본 cycle 단일 PR (v0.40.0 cycle 흡수). commit message에 `feat(v2.0.7): Gemini CLI v0.39.1→v0.41.1 cumulative migration + 21 agent smoke + spot verification` 포맷.
6. **v2.1.0 plan refresh cycle 진입 알림** — 본 cycle close 직후 메인 세션에서 트리거 검토.

---

*Phase 3 Plan-Plus 종료: 2026-05-06. Strategy B' 권장 (11th application). 작업 시간 ~4.5-5h, 위험도 LOW (R9 21 agent 스모크로 차단). v0.39.1→v0.41.1 누적 stable 영향 분석 + v0.40.0 cycle 흡수 + 회귀 사전 차단 + 의도 명문화 + spot 검증 + 21 agent 회귀 스모크의 5축 균형. v2.1.0 plan 본격 갱신 + MCP resources PoC + autoMemory 옵트인 + tools.core 카탈로그 + --session-id 채택은 별도 cycle 위임.*
*migration-strategist agent*
