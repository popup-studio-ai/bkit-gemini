# Gemini CLI v0.42.0 preview train 마이그레이션 종합 보고서

> **PDCA 단계**: Plan/Analysis 종합 (Do 진입 전 최종 결재본, P4)
> **작성일**: 2026-05-09
> **작성자**: bkit-report-generator agent (Strategy B' 13번째 적용)
> **베이스라인**: bkit v2.0.6 (= Gemini CLI v0.39.1, PR #24 main 머지)
> **타겟**: Gemini CLI v0.42.0 preview train (preview.2 = 최신 stable preview, 2026-05-06 릴리스)
> **본 cycle 비교 범위**: `v0.41.2 → v0.42.0-preview-train` (delta only, 111 commits / 300 files)
> **누적 비교 범위**: `v0.39.1 → v0.42.0-preview-train` (v0.40.0 + v0.41.x + v0.41.2 + preview train 누적)
> **본 cycle의 본질적 차이 (vs v0.41.2 report)**: preview train delta = 1 Low (`gemini-cli-learning/SKILL.md` placeholder 1줄만). P1 추정 High 2 + Medium 1 + Low 4 → P2 grep 검증 후 **모두 0건 강등 확정**. v0.42.0 stable **미출시** (preview.2가 최신, 3일 경과). **D1 (stable 출시 시 흡수 정책 = 시나리오 A 권장)이 핵심 분기** — preview 단독 처리 vs stable 통합 vs 1주 이상 지연 대응.

---

## Executive Summary

| 항목 | 내용 |
|------|------|
| 대상 버전 | `v0.41.2 → v0.42.0-preview-train` (delta) |
| 보고 작성일 | 2026-05-09 |
| **본 cycle delta 영향** | **1개 파일** (`gemini-cli-learning/SKILL.md` placeholder 1줄) |
| 🔴 Critical Issues | **0건** (즉시 수정 필요 없음) |
| 🟠 High Issues | **0건** (P1 추정 2 → P2 정적 분석 후 0건 강등 확정) |
| 🟡 Medium Issues | **0건** (P1 추정 1 → P2 정적 분석 후 0건 강등 확정) |
| 🟢 Low Issues | **1건** (SKILL placeholder 단락 추가만) |
| 직접 회귀 가능성 | **0건** (P1 §2~§6 + P2 §1~§5 grep 검증 모두 0건) |
| 신기능 활용 후보 | **14건** (Cx1~Cx14, 본 cycle 채택 1건) |
| 추천 전략 | **Strategy B' (B family 13회차)** |
| 예상 작업 기간 | **~3.5-4.5h** (v0.41.2 cycle 골격 90% 재활용 + delta +10분) |
| 위험도 | **LOW** (R9 21 agent 스모크 + R11 a2a-server 재확인 + R12 preview train 변동성 + R13 Gemma 잠금) |
| **누적 카운트 변동** | 33 files → **34 files** / Critical 0 → 0 / High 5 → 5 / Medium 10 → 10 / Low 28 → **29** |
| **핵심 결정 포인트** | **D1** — v0.42.0 stable 출시 시 흡수 정책 (시나리오 A 권장: stable 출시 후 통합 단일 PR) |
| YAGNI 절감 | **92.8%** (14건 신기능 중 13건 별도 cycle 위임, 본 cycle Cx13 1건만 채택) |

### 한 문단 요약

v0.42.0 preview train은 v0.41.2 대비 **107 commits / 300 files 변경**이지만 bkit 직접 영향은 0건이다. P1 research에서 Breaking 1건(Bx0 `continueOnFailedApiCall` 제거) + 행동 변화 4건(Bx1~Bx4) + 신기능 14건(Cx1~Cx14)을 식별했으나, P2 impact analysis에서 **정적 분석(grep) 결과 모두 0건으로 강등 확정**했다. 잔존 항목은 `gemini-cli-learning/SKILL.md`에 v0.42.0 preview train 설명 1줄 추가만이다. 본 cycle의 핵심은 *"preview 단독 처리 vs v0.41.2 cycle Do와 동시 흡수 vs stable 출시 대기"* 결정이다. **권장 방식(시나리오 A)**: v0.42.0 stable 출시 대기 후 v0.41.2 cycle Do + 본 cycle delta + stable delta를 **단일 PR로 통합** 처리 — v0.41.2 plan 골격 90% 재활용 + Cx13(`experimental.gemma: false` 잠금) 5분 추가 + SKILL placeholder 1줄 + `hasGemmaDefaultOn` flag 1개로 완성. **Strategy B' 13회차**, 위험도 LOW, 작업 시간 ~3.5-4.5h.

---

## 1. Value Delivered

| 관점 | 내용 |
|------|------|
| **Problem** | **(1)** v0.42.0 preview train 출시로 누적 갭 신규 발생 **(2)** preview 단독 처리 ROI 의문 (delta 1 Low만) **(3)** v0.41.2 cycle Do 미실행 + 본 cycle 추가 plan 누적 위험 — 이미 3개 plan 미머지 잔존 **(4)** PR #25827(SessionStart `systemMessage` 중복 fix) 7 release 연속 미흡수로 워크어라운드 영구화 필요 |
| **Solution** | preview train 사전 시그널 P1~P4 완료 + **Strategy B' 13회차** 권고 + Cx13(`experimental.gemma: false` 1줄 잠금) 채택 + **시나리오 A**(stable 출시 후 v0.41.2 + 본 cycle + stable delta 통합 단일 PR) 권고로 미머지 plan 누적 부담 일괄 해소 |
| **Function/UX Effect** | **(1)** Bx4(Gemma 4 default-on) 회귀 사전 차단 via `experimental.gemma: false` 잠금 + `hasGemmaDefaultOn` flag **(2)** v0.42.0 stable 출시 시 즉시 P1/P2/P3 재검증 후 흡수 가능 (재검증 10분) **(3)** 21 agent 스모크 13회차 안정화 (R9 차단) **(4)** v0.41.2 a2a-server 무관 재확인 (R11 차단) |
| **Core Value** | **Automation First / Docs = Code / AI Partnership / No Guessing 4원칙 모두 ✅ 강화 또는 유지** — Bx0 빈 응답 명시 실패(Automation First), Cx13 잠금(No Guessing), SKILL placeholder(Docs=Code), v2.1.0 trigger 메모(AI Partnership) |

---

## 2. 변경사항 요약 (Phase 1 결과)

> 출처: `docs/01-plan/research/gemini-cli-v0.42.0-preview-research.md` (389 lines, 2026-05-09)

### 2.1 preview train 타임라인

| 버전 | published_at | 성격 | 주요 내용 |
|------|--------------|------|---------|
| v0.41.2 (baseline) | 2026-05-06 18:39 | patch (a2a-server) | `Task.waitForPendingTools()` race fix |
| **v0.42.0-preview.0** | **2026-05-05 20:39** | **minor (107 commits)** | **Breaking 1건(Bx0 `continueOnFailedApiCall` 제거) + 행동 변화 4건(Bx1~Bx4) + 신기능 14건(Cx1~Cx14) + 보안 패치 5건** |
| **v0.42.0-preview.1** | **2026-05-05 22:48** | **patch (cherry-pick)** | **PR #26542 cherry-pick (YOLO/AUTO_EDIT redirection fix)** |
| **v0.42.0-preview.2** | **2026-05-06 18:06** | **patch (cherry-pick) — 최신 stable preview** | **PR #26568 cherry-pick (a2a-server race fix)** |
| v0.42.0-nightly.20260507 | 2026-05-07 17:08 | nightly (최신) | preview.2 → +24 commits (§2.2 사전 시그널) |

**핵심**: preview.0이 본 train의 유일한 substantive cut (107 commits). preview.1/2는 cherry-pick 2건(v0.41.x hotfix backport)만.

### 2.2 Breaking Changes (preview train delta, Bx0~Bx4)

| # | PR | 항목 | 첫 포함 | bkit 영향 | P2 grep 결과 |
|---|----|----|--------|----------|-------------|
| **Bx0** | **#26340** | **`continueOnFailedApiCall` config 옵션 제거** | preview.0 | bkit `.gemini/settings.json` 부재 — 추정 0건 | ✅ **0건 확정** (settings.json 없음, retry 로직 0건) |
| Bx1 | #25186 | core tool들이 native `ToolDisplay` 객체 emit (schema 내부 변경) | preview.0 | 도구 응답 schema 직접 파싱 시 영향 — 추정 검증 필요 | ✅ **0건 확정** (bkit는 stdout/stderr 불투명 텍스트로만 집계) |
| Bx2 | #26230 | `exit_plan_mode` 도구를 `run_shell_command`로 호출 명시 금지 | preview.0 | agent prompt에서 호출 패턴 여부 — 추정 검증 필요 | ✅ **0건 확정** (grep: 패턴 부재) |
| Bx3 | #26342 | `Config.setSessionId()` 호출 시 15+ session-scoped 상태 reset | preview.0 | bkit 미호출 — 추정 0건 | ✅ **0건 확정** (spawn만 사용) |
| Bx4 | #26307 | **`experimental.gemma` default `false` → `true`** | preview.0 | settings.json 부재 → default `true` 자동 적용 — 행동 변화 가능 | ✅ **0건 확정** (Cx13으로 본 cycle 잠금 권고) |

**결론**: P1 추정 7건(High 2 + Medium 1 + Low 4) **모두 0건으로 강등 확정**. Bx1이 유일한 위험 후보였으나 bkit 아키텍처(stdout/stderr 불투명 캡처)로 무영향 확정.

### 2.3 새 기능 (preview train delta, Cx1~Cx14)

| # | PR | 기능 | bkit 활용 가능성 | 본 cycle |
|---|----|----|-----------------|---------|
| **Cx1** | #26445 | `--ignore-env` flag + `advanced.ignoreLocalEnv` setting | 🟢 높음 (CI/headless) | ❌ 별도 cycle (D2) |
| **Cx2** | #26338 | Auto Memory inbox flow (`extraction.patch` canonical) | 🟡 중간 | ❌ v2.1.0 cycle (D4) |
| Cx3 | #26535 | Auto Memory private patch allowlist tighten | 🟢 (Cx2 보완) | ❌ Cx2와 함께 |
| **Cx4** | #25639 | `/bug-memory` + 2GB 자동 heap snapshot | 🟡 중간 (OOM 진단) | ❌ debugging tools cycle |
| Cx5 | #26440 | V8 heap snapshot utility | 🟡 중간 (Cx4 기반) | ❌ Cx4와 함께 |
| Cx6 | #19332 | `/exit --delete` flag | 🟢 Low | ❌ 선택 |
| **Cx7** | #22324 | `/commands list` subcommand | 🟡 중간 (health check) | ❌ health-check skill cycle |
| Cx8 | #25660 | `/extensions delete` alias | 🟢 Low | ❌ 배제 |
| Cx9 | #26506 | queuing messages during compression | 🟡 중간 | ✅ 자동 적용 |
| Cx10 | #26454 | Voice Mode privacy/compliance UX warning | 🟢 Low | ❌ 배제 |
| **Cx11** | #26442 | `feat(cli): improve /agents refresh logging` | 🟡 중간 | ❌ list_agents diagnostics cycle |
| Cx12 | #26310 | Inquiry constraints 강화 | 🟡 중간 | ✅ 자동 적용 |
| **Cx13** | **#26307** | **Gemma 4 default-on 잠금 (`experimental.gemma: false`)** | 🟢 (Bx4 회귀 차단) | **✅ Wave 1.7 (5분, 본 cycle 채택)** |
| **Cx14** | #26329 | `--prompt` (-p) flag undeprecated | 🟢 (긍정) | ❌ SKILL placeholder 통합 |

**채택률**: 14건 중 **1건만 본 cycle 채택** (Cx13) + 4건 자동 적용 + 9건 별도 cycle 위임 = **YAGNI 절감 92.8%**.

### 2.4 preview.2 → 최신 nightly delta (v0.42.0 stable 사전 시그널)

preview.2 (2026-05-06 18:06) → nightly.20260507.ga809bc7c5 (2026-05-07 17:08): **24 commits**. v0.42.0 stable 출시 시 추가 흡수 후보:

| 변경 | 추정 stable 포함 여부 | bkit 영향 |
|-----|-----------------|----------|
| Chat corruption bug fix (#26534) | 🔴 거의 확정 (P1 fix) | 🟢 baseline runner 안정성 |
| Async context hysteresis fix (#26452) | 🔴 거의 확정 | 🟢 baseline runner 안정성 |
| **OAuth headless Linux silent hang fix (#26571)** | 🔴 **거의 확정 (P0급)** | 🟢 **CI/headless OAuth 시 critical** |
| ToolDisplay refactor 추가 완성 (#25186) | 🟡 중간 (refactor 큼) | 🟡 도구 응답 schema 내부 변경 (Q6) |

**사전 시그널**: 3건 거의 확정, 1건 부분 가능. R12(preview train 변동성) 완화책 명시 필요.

### 2.5 미해결 추적

| PR | 이슈 | 상태 | 대응 |
|----|------|------|------|
| **#25827** | **Issue #25655 — SessionStart `systemMessage` 중복 렌더 fix** | **OPEN (미머지) — 7 release 연속 미흡수** | **Wave 3.3 SKILL 1줄 명문화**(D5) |

---

## 3. 영향 분석 결과 (Phase 2 결과)

> 출처: `docs/03-analysis/gemini-cli-v0.42.0-preview-impact.analysis.md` (291 lines, 2026-05-09)

### 3.1 영향도 카운트 (본 cycle delta vs 누적 참조)

| 항목 | 본 cycle delta | v0.41.2 cumulative | **합계** |
|---|---:|---:|---:|
| 영향 추정 파일 | **1** | 33 | **34** |
| 🔴 Critical | **0** | 0 | **0** |
| 🟠 High | **0** | 5 | **5** |
| 🟡 Medium | **0** | 10 | **10** |
| 🟢 Low | **1** | 28 | **29** |

**v0.41.2 누적 카운트 변동 없음**: 본 cycle delta는 P0 차단 항목 0건.

### 3.2 P1 추정 → P2 grep 검증 강등표

| 검증 항목 | P1 추정 | P2 grep 결과 | 결론 |
|----------|--------|-------------|------|
| Bx0 `continueOnFailedApiCall` 키 | 0건 | settings.json 부재 (확정 0) | ✅ 0건 |
| Bx0 빈 응답 retry 의존 | 필요 | retry/backoff/empty response 패턴 0건 | ✅ 0건 |
| Bx1 도구 응답 schema 파싱 | 필요 | `JSON.parse` 28건 모두 bkit 자체 state (확정 0) | ✅ 0건 |
| Bx2 `exit_plan_mode` shell 호출 | agent prompt 의존 | 21개 prompt grep 패턴 0건 | ✅ 0건 |
| Bx3 `Config.setSessionId()` 호출 | bkit 미호출 (추정 0) | spawn 방식만 확인 | ✅ 0건 |
| Bx4 Gemma 4 `--model` 자동 추론 | 필요 | mcp/bkit-server.js args 빌더에 `--model` 미주입 확인 | ✅ 0건 (사용자 prompt 의존만) |

**결론**: **P1 §10.1 추정 7건(High 2 + Medium 1 + Low 4) 모두 0건으로 강등 확정**.

### 3.3 잔존 1건 상세

**`skills/gemini-cli-learning/SKILL.md` placeholder 1줄**:
- Wave 3.3에서 "v0.42.0 preview train (preview.0/1/2): bkit 영향 0건, 활용 후보 6건(Cx1/Cx2/Cx4/Cx7/Cx11/Cx14) — 별도 cycle 위임. v0.42.0 stable 출시 cycle에서 풀 단락 14개로 확장 예정" 추가.
- v0.42.0 stable 출시 후 별도 cycle에서 풀 단락(~30분) 작성.

### 3.4 철학 정합성 검증

| 원칙 | 정합 | 비고 |
|-----|-----|------|
| **Automation First** | ✅ 강화 | Bx0 빈 응답 명시 `InvalidStream` failure 노출 + #26191 timeout 60초 단축 (자동) |
| **No Guessing** | ✅ 강화 | Cx13 `experimental.gemma: false` 잠금 + default 변경 회귀 사전 차단 |
| **Docs = Code** | ➖ 중립 | SKILL placeholder 1줄 + 향후 풀 단락 |
| **AI Partnership** | ✅ 강화 | Cx12 Inquiry constraints 강화 (LLM 자체 거부 능력 향상) |

**종합**: 4원칙 중 3개 강화 / 1개 중립. **충돌 0건**.

---

## 4. 마이그레이션 전략 (Phase 3 결과)

> 출처: `docs/01-plan/features/gemini-cli-v0.42.0-preview-migration.plan.md` (589 lines, 2026-05-09)

### 4.1 추천 전략 — Strategy B' (B family 13회차)

**가중 점수 8.85점** (5개 대안 중 1위, B 대비 +1.30, C 대비 +1.80).

| 전략 | 시간 | 위험도 | 점수 | 핵심 |
|------|------|-------|------|------|
| A | ~10분 | HIGH | 4.65 | placeholder만 (단독 처리 ROI 낮음) |
| A'' | ~30분 | MED | 6.05 | A + v0.41.2 plan rename (미머지 부담 부족) |
| B | ~3-3.5h | LOW | 7.55 | Standard (스모크 없음) |
| **B'** | **~3.5-4.5h** | **LOW** | **8.85** | **Standard + 21 agent 스모크 + Cx13 잠금** |
| C | ~26h | MED | 7.05 | Full + PoC (분리도 ↓) |

**1위 이유**:
1. **v0.41.2 plan 골격 90% 재활용** — delta ≤6줄 (testedVersions 1줄, dependency 1줄, Cx13 1줄, flag 1개, SKILL 1줄, W2.9/W2.10 2줄)
2. **Strategy B family 13번째 적용** — 메모리 누적 12회차 학습 적용 가능
3. **Cx13 + `hasGemmaDefaultOn` flag로 Bx4 회귀 사전 차단** — 10분 추가 작업

### 4.2 5개 결정 항목 (D1~D5)

| ID | 결정 | 권장 | 근거 |
|----|----|------|------|
| **D1** | **v0.42.0 stable 출시 시 흡수 정책** | **시나리오 A** (stable 출시 대기 후 통합 단일 PR) | npm `latest` 정책 + 미머지 plan 3개 누적 부담 + ROI 압도적 (§4.3 상세) |
| D2 | Cx1 (`--ignore-env`) 채택 여부 | 별도 cycle (D2) | Q7 검증 필요 (baseline runner CI 안정성 시나리오 별도) |
| **D3** | **Cx13 (`experimental.gemma: false` 잠금) 채택** | **본 cycle Wave 1.7** | Bx4 회귀 사전 차단 (5분) + No Guessing 강화 + P2 우선순위 P1 |
| D4 | Cx2 (Auto Memory inbox) 별도 분리 | v2.1.0 cycle | 옵트인 PoC + v0.41.2 §7 C4 시너지 |
| D5 | PR #25827 워크어라운드 영구화 명문화 | Wave 3.3 SKILL 1줄 | 7 release 연속 미수렴 → 영구화 명문화 ROI 우수 |

### 4.3 v0.42.0 stable 출시 시 흡수 정책 (D1 상세)

#### 시나리오 A (권장) — stable 출시 후 본 plan rename

**조건**: v0.42.0 stable이 본 P3 작성 후 1주 이내(2026-05-16 이전) 출시.

**작업**:
1. 본 plan 파일을 `gemini-cli-v0.42.0-migration.plan.md`로 rename
2. P1 + P2 산출물 stable 재검증 (release notes diff ~10분)
3. v0.41.2 cycle Do 진입 → Wave 1~3 실행 (v0.41.2 plan 그대로)
4. **동시에 본 cycle delta 적용**:
   - Wave 1.6 dependency bump v0.41.2 → v0.42.0 활성
   - Wave 1.1 testedVersions에 `"0.42.0"` 추가
   - Wave 1.7 `experimental.gemma: false` 잠금 (Cx13)
   - Wave 1.2 `hasGemmaDefaultOn` flag 신설 (1개)
   - Wave 2.9 Bx grep 재현 (R12 preview train 변동성 완화)
   - Wave 3.3 SKILL placeholder → 풀 단락 확장(~30분)

**총 시간**: ~3.5-4.5h (v0.41.2 + delta 통합) + 10분 재검증 = **~3.5-5h**.

**ROI**: ⬛⬛⬛⬛⬛ — **단일 PR로 v0.41.2 cycle Do + 본 cycle delta + stable delta 일괄 해소**.

#### 시나리오 B (백업) — preview.2 단독 cycle

**조건**: v0.42.0 stable이 1주 이상 지연 (2026-05-16 이후 미출시).

**작업**:
1. 본 plan을 preview.2 단독 cycle로 진입
2. `package.json` 의존을 v0.41.2 유지 (preview.2 = npm `latest` 부적격)
3. Wave 1.1 testedVersions 5개 (`"0.42.0"` 보류)
4. Wave 1.6 dependency bump 보류
5. Cx13 + SKILL placeholder 단독 처리 → v0.41.2 cycle Do와 동시 흡수
6. v0.42.0 stable 출시 시 별도 B' 14회차 진입 (testedVersions 1개 + dependency 1개 + SKILL 확장)

**총 시간**: ~3-3.5h (본 cycle 단독) + v0.41.2 cycle ~4.5-5h = **분리 처리** (R14 위험).

**ROI**: ⬛⬛⬛⬜⬜ — preview 단독 PR. stable cycle 분리로 미머지 plan 4개 누적.

#### 시나리오 C (대안) — v0.41.2 cycle Do 우선

**조건**: v0.42.0 stable 출시 직전 1-2일 내 v0.41.2 cycle Do 진입 결정.

**작업**:
1. v0.41.2 cycle Do 진입 → main 머지
2. v0.42.0 stable 출시 시 본 plan rename → 별도 B' 14회차 진입 (testedVersions 1개 + dependency 1개 + delta)

**총 시간**: v0.41.2 cycle ~4.5-5h + 본 cycle ~3.5-4h = **~8-9h (분리 처리)**.

**ROI**: ⬛⬛⬛⬜⬜ — 분리 처리로 회귀 신호 명확. 단, 통합 단일 PR(A) ROI 우수.

#### 시나리오 비교표

| 시나리오 | 조건 | 시간 | PR 수 | ROI | 위험 | **추천** |
|---------|-----|------|------|-----|------|---------|
| **A (권장)** | stable 1주 내 출시 | ~3.5-5h | **1개** | ⬛⬛⬛⬛⬛ | LOW | ✅ |
| B (백업) | stable 1주 이상 지연 | ~3-3.5h + 별도 | 2개 | ⬛⬛⬛⬜⬜ | MED (R14) | ⏸️ |
| C (대안) | stable 직전 v0.41.2 Do | ~8-9h | 2개 | ⬛⬛⬛⬜⬜ | LOW | ⏸️ |

---

## 5. 구현 로드맵 (Strategy B' 13회차)

총 예상 시간: **~3.5-4.5시간** (v0.41.2 plan ~4.5-5h + Cx13/flag/SKILL 통합 +10분 - 재활용 효율로 약간 단축).

### Wave 1 (P0, ~45분) — Critical Patch + Cx13 잠금 + version flag

| # | 작업 | 파일 | 시간 |
|---|------|-----|------|
| W1.1 | testedVersions에 6개 추가 (`0.40.0/0.40.1/0.41.0/0.41.1/0.41.2/**0.42.0**`) | `bkit.config.json:120` | 2분 |
| W1.2 | v0.42.0+ `hasGemmaDefaultOn` flag 신설 + 기존 8개 = **9개** | `lib/gemini/version.js:212` | 18분 |
| W1.3~W1.6 | `general.topicUpdateNarration: false` + autoMemory 잠금 + tc38 매트릭스 + dependency bump | `.gemini/settings.json` 외 4개 | 15분 |
| **W1.7 (신규)** | **`.gemini/settings.json`에 `experimental.gemma: false` 명시 잠금 (Cx13)** | `.gemini/settings.json` | **5분** |

**Wave 1 AC**: `node tests/run-all.js --suite=tc04,tc38,smoke` PASS + `experimental.gemma: false` grep 1건.

### Wave 2 (P1, ~3-3.5h) — 21 Agent Smoke + Spot Verification + Bx grep

v0.41.2 plan Wave 2 + **preview train 신규 2건**:

| # | 작업 | 시간 |
|----|------|------|
| W2.1~W2.4 | tc113/tc107 실측 + topic narration L3 + tools.core schema + sandbox spot | 50분 |
| **W2.5** | **21 agent 회귀 스모크** (R9 차단) | **60분** |
| W2.6 | full baseline 1회 (pass >= 1925 회복) | 30-60분 |
| W2.7~W2.8 | 카나리아 + a2a-server grep 0건 | 10분 |
| **W2.9 (신규)** | **Bx0~Bx4 정적 분석 재현 (P2 grep)** | **5분** |
| **W2.10 (신규)** | **Cx13 잠금 검증 (`experimental.gemma: false` == false)** | **3분** |

**Wave 2 AC**: 21/21 PASS + pass >= 1925 + Bx grep 0건 + `experimental.gemma == false`.

### Wave 3 (P2, ~1h) — 문서 갱신 + v2.1.0 trigger

| # | 작업 | 파일 | 시간 |
|----|------|-----|------|
| W3.1~W3.2 | GEMINI.md v2.0.7 업데이트 + README.md testedVersions | 20분 |
| **W3.3 (신규)** | **gemini-cli-learning SKILL.md v0.42.0 preview train placeholder 1줄** → v0.42.0 stable 후 풀 단락(14개) | **5분** (placeholder) + **30분** (stable 후) |
| W3.4~W3.7 | 명령어 alias + v2.1.0 trigger + PR commit message | 35분 |

**Wave 3 AC**: bkit v2.0.7 일관성 + SKILL 13단락 + testedVersions 6개 + Cx13 잠금 docs.

---

## 6. 위험 관리 계획

### 6.1 리스크 매트릭스 (R1~R14)

| R# | 리스크 | 가능성 | 영향 | 완화책 | 잔존 위험 |
|----|--------|-------|------|--------|----------|
| R1~R11 | v0.41.2 plan 그대로 (topic narration / #25827 / 21 agent 스모크 등) | — | — | — | LOW |
| **R12 (신규)** | **preview.2 → v0.42.0 stable 사이 추가 cherry-pick** | 중간 | 낮음 | D1 시나리오 A에서 stable release notes 재검증 (10분) | LOW |
| **R13 (신규)** | **Cx13 `experimental.gemma: false` 잠금 누락 → Gemma 4 default-on 회귀** | 매우 낮음 | 매우 낮음 | D3 Wave 1.7 + W2.10 | NEAR-ZERO |
| **R14 (신규)** | **본 cycle 단독 PR 처리 시 3개 plan 누적** | 높음 (시나리오 B) | 중간 (코드 중복) | D1 시나리오 A 권고 | LOW |

**전체 위험도**: **LOW**. R12~R14 신규 항목도 완화 가능.

### 6.2 21 agent 회귀 스모크 절차

1. 21개 FULL tier agent × 1개 표준 명령 (예: `/agents refresh`)
2. PASS = 표준 응답 패턴 확인 + 명령 거부 0건
3. FAIL 1건 이상 시 Wave 2 일시 중단 → 회귀 분석 cycle

### 6.3 롤백 전략

- **L1**: `git revert <commit-sha>` (atomic)
- **L2**: `~/.gemini/settings.json` user-scope override
- **L3**: `npx --yes @google/gemini-cli@0.41.2` 다운그레이드
- **R12**: stable 출시 시 release notes 재검증 후 P1/P2 재작성
- **R13**: `experimental.gemma: false` 제거 (1줄 revert)

---

## 7. Acceptance Criteria

### 7.1 정량 AC (8건)

1. **L1 unit**: tc04 / tc38 / smoke PASS (Wave 1)
2. **L2 baseline**: `node tests/run-all.js` pass >= 1925 (Wave 2.6)
3. **회귀 카나리아**: tc115 PASS + tc113 PASS (Wave 2.7)
4. **21 agent 스모크**: 21/21 PASS (Wave 2.5, R9)
5. **bkit 버전**: GEMINI.md / bkit.config.json 모두 `bkit v2.0.7` (Wave 3)
6. **Cx13 잠금**: `.gemini/settings.json`에 `experimental.gemma: false` (Wave 1.7 + W2.10)
7. **Bx grep**: Bx0~Bx4 정적 분석 재현 0건 (Wave 2.9)
8. **flag 신설**: `hasGemmaDefaultOn` 포함 9개 (Wave 1.2 + tc38)

### 7.2 정성 AC (5건)

1. **D1~D7 명문화**: 모든 decision 명시 + 시나리오 A/B/C 선택 근거
2. **외부 인터페이스 실측**: tc113/tc107, narration, tools.core, **21 agent 스모크**, **a2a-server grep**, **Bx grep**
3. **Strategy B' 13회차**: 메모리 누적 학습 적용 + v0.42.0 preview train 학습 추가
4. **YAGNI 92.8% 절감**: Cx13만 채택 + 13건 별도 cycle 위임
5. **v0.41.2/v0.42.0 cycle 흡수**: 3개 plan(v0.40.0/v0.41.x/v0.41.2) + delta + stable 단일 PR 정책

---

## 8. 차이점 요약 (vs v0.41.2 report)

| 항목 | v0.41.2 report | v0.42.0 preview report | 변동 |
|------|----------------|----------------------|------|
| **영향 범위** | 33 files (누적) | 34 files (+1 SKILL) | +1 |
| **Critical** | 0 | 0 | — |
| **High** | 5 | 5 | — |
| **Medium** | 10 | 10 | — |
| **Low** | 28 | 29 (+1) | +1 |
| **직접 회귀** | 0 | 0 | — |
| **Strategy** | B' 12회차 | B' 13회차 | +1회 |
| **시간** | ~4.5-5h | ~3.5-4.5h (delta +10분, 재활용 -1h) | -1h |
| **본 cycle 채택 기능** | 5건 (flag 8 + settings 4) | 1건 (Cx13 잠금) | -4 |
| **YAGNI 절감** | ~50% | **92.8%** | ↑ |
| **핵심 결정** | D6 (21 agent 범위) | **D1 (stable 흡수 정책)** | 분기점 변경 |

---

## 9. 다음 단계

### 9.1 사용자 결재 항목 (즉시)

**D1~D7 모두 결재 필요** (특히 D1):

- **D1**: 시나리오 A (권장, stable 대기) / B (preview 단독) / C (v0.41.2 우선) 중 선택
- **D2**: Cx1 별도 cycle 동의
- **D3**: Cx13 본 cycle 채택 동의
- **D4**: Cx2 v2.1.0 cycle 위임 동의
- **D5**: PR #25827 워크어라운드 영구화 동의
- **D7**: N=12 trigger (testedVersions 누적 재검토) 차기 cycle 발동 동의

### 9.2 D1 시나리오 A 결재 후

1. **v0.42.0 stable 출시 대기** (추정 2026-05-09 ~ 12)
2. stable 출시 시 **P1/P2 재검증** (~10분, release notes diff)
3. **본 plan을 `gemini-cli-v0.42.0-migration.plan.md`로 rename**
4. **Wave 1 → Wave 2 → Wave 3 순차 실행** (v0.41.2 + delta 통합)
5. **단일 PR merge**: `feat(v2.0.7): Gemini CLI v0.39.1 → v0.42.0 cumulative migration + 21 agent smoke + preview train absorption + Gemma 4 lock`

### 9.3 Do 진입 시 즉시 가능 여부

✅ **D1 시나리오 A 결재 + v0.42.0 stable 출시 동시 충족 시 즉시 진입 가능**.

근거:
- v0.41.2 plan 골격 90% 재활용 (Wave 1~3 검증된 패턴)
- delta = 10분 추가 작업
- R12 (preview train 변동성) 완화책 명시
- Strategy B' 13회차 — 메모리 누적 학습 적용 가능

❌ **시나리오 B/C 결재 시 별도 분리 필요** (D1 결재 우선).

### 9.4 v2.1.0 cycle 진입 알림

본 cycle close 직후 **v2.1.0 plan refresh cycle 진입 예정**:
- Cx2 Auto Memory inbox PoC (v0.41.2 §7 C4 시너지)
- Cx1 `--ignore-env` CI/headless 채택
- Cx7 `/commands list` health check skill

---

## 10. 참고 자료

### 10.1 Phase 1~3 산출물

- **P1 Research**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/research/gemini-cli-v0.42.0-preview-research.md` (389 lines, 2026-05-09)
- **P2 Impact Analysis**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/03-analysis/gemini-cli-v0.42.0-preview-impact.analysis.md` (291 lines, 2026-05-09)
- **P3 Plan**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/features/gemini-cli-v0.42.0-preview-migration.plan.md` (589 lines, 2026-05-09)

### 10.2 baseline 산출물 (참조)

- **v0.41.2 Plan**: `docs/01-plan/features/gemini-cli-v0.41.2-migration.plan.md`
- **v0.41.2 Report**: `docs/04-report/gemini-cli-v0.41.2-migration.report.md` (722 lines, 2026-05-07)
- **v0.41.1 Plan**: `docs/01-plan/features/gemini-cli-v0.41.1-migration.plan.md`

### 10.3 GitHub 링크

**Breaking Changes**:
- #26340: https://github.com/google-gemini/gemini-cli/pull/26340
- #25186: https://github.com/google-gemini/gemini-cli/pull/25186
- #26230, #26342, #26307

**주요 기능**:
- #26445 (`--ignore-env`), #26338 (Auto Memory inbox), #25639 (`/bug-memory`), #26307 (Gemma 4)

**보안 패치**:
- #26571 (OAuth headless Linux silent hang), #26535 (Memory patch allowlist)

**Releases**:
- v0.42.0-preview.0/1/2: https://github.com/google-gemini/gemini-cli/releases
- v0.42.0-nightly.20260507: 최신 nightly

### 10.4 미해결 OPEN PR

- **#25827** (SessionStart `systemMessage` 중복): 7 release 연속 미수렴

---

## 11. 조사 신뢰도

| 항목 | 신뢰도 | 비고 |
|------|--------|------|
| preview train 타임라인 + compare 통계 | ⬛⬛⬛⬛⬛ | gh release view + gh api compare 직접 호출 |
| Breaking Changes (Bx0~Bx4) | ⬛⬛⬛⬛⬜ | PR 본문 직접 검증. 명시 breaking marker 부재 → 추정 일부 |
| 새 기능 (Cx1~Cx14) | ⬛⬛⬛⬛⬜ | 핵심 12건 PR 본문 검증. UI minor enhancements 일부 추정 |
| **P2 grep 검증** | ⬛⬛⬛⬛⬛ | **bkit 코드 직접 정적 분석 — Bx0~Bx4 모두 0건 확정** |
| 누적 카운트 변동 | ⬛⬛⬛⬛⬛ | v0.41.2 33 files → 34 files (1줄 추가만) |
| §2.4 사전 시그널 | ⬛⬛⬛⬜⬜ | preview.2 → nightly 24 commits 추정 (stable 확정 아님) |
| 활용 후보 우선순위 | ⬛⬛⬛⬜⬜ | P3 brainstorm 입력만 (최종 결정 P3에서) |

---

## 12. 한계 및 미해결

1. **v0.42.0 stable 출시 전**: preview train만 분석. preview.2 → 최신 nightly delta(§2.4)는 *사전 시그널*이며 stable 확정 시 재검증 필요.
2. **bkit 영향은 P2 grep으로 확정**: Bx0~Bx4 모두 0건 검증 완료. 유일한 잔존 위험 = ToolDisplay refactor(Bx1)의 v0.42.0 stable 시점 완성도 — bkit 아키텍처(stdout/stderr 불투명 캡처)로 무영향 확인.
3. **preview cycle 빠른 회전**: preview.0 (2026-05-05) → preview.2 (2026-05-06)까지 24h 내 2개 cherry-pick. stable 출시 사이 추가 변경 가능성 → 본 P1 작성 후 stable 출시 시 **R12 완화책 실행 필수** (release notes 재검증 10분).
4. **PR #25827 계속 OPEN**: 7 release 연속 미흡수로 v0.42.0 stable에도 미포함 가능성 높음 → 워크어라운드 영구화 필수.

---

## 13. 결론

### 13.1 최종 권고

| 항목 | 권고 |
|------|------|
| **추천 전략** | **Strategy B' (13회차)** |
| **작업 시간** | **~3.5-4.5h** (v0.41.2 골격 재활용) |
| **위험도** | **LOW** (R9 21 agent 스모크 + R12 stable 재검증) |
| **v0.42.0 stable 흡수** | **시나리오 A** (stable 출시 후 v0.41.2 + delta + stable 통합 단일 PR) |
| **본 cycle 채택 기능** | **Cx13만** (`experimental.gemma: false` 잠금, 5분) |
| **YAGNI 절감** | **92.8%** (13건 신기능 별도 cycle 위임) |
| **즉시 진입 가능** | ✅ D1 시나리오 A 결재 + v0.42.0 stable 출시 시 |

### 13.2 차이점 1줄

**v0.41.2 보고서 대비**: 본 cycle delta = **1 Low 잔존** (SKILL placeholder 1줄만). 누적 카운트 변동 없음. **D1 stable 흡수 정책 시나리오 A가 핵심** — preview.2 npm `latest` 부적격 + 미머지 plan 3개 누적 부담 해소 ROI 압도적.

### 13.3 4원칙 정합성

| 원칙 | 상태 |
|-----|------|
| **Automation First** | ✅ 강화 (Bx0 빈 응답 명시 실패 + #26191 timeout 60초) |
| **No Guessing** | ✅ 강화 (Cx13 `experimental.gemma: false` 잠금) |
| **Docs = Code** | ➖ 중립 (SKILL placeholder → 향후 풀 단락) |
| **AI Partnership** | ✅ 강화 (Cx12 Inquiry constraints + v2.1.0 gate) |

---

**종합 보고서 완료: 2026-05-09**. Strategy B' **13번째** 적용. **v0.42.0 preview train 마이그레이션 Do 진입 준비 완료**. D1 시나리오 A (stable 출시 후 통합) 결재만 남음.
