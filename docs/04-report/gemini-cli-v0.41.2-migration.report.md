# Gemini CLI v0.41.2 마이그레이션 종합 보고서

> **PDCA 단계**: Plan/Analysis 종합 (Do 진입 전 최종 결재본, P4)
> **작성일**: 2026-05-07
> **작성자**: bkit-report-generator agent (Strategy B' 12번째 적용)
> **베이스라인**: bkit v2.0.6 (= Gemini CLI v0.39.1, PR #24 main 머지)
> **타겟**: Gemini CLI v0.41.2 (latest stable, 2026-05-06 릴리스)
> **누적 비교 범위**: `v0.39.1...v0.41.2` (= v0.40.0 + v0.40.1 + v0.41.0 + v0.41.1 + v0.41.2)
> **본 cycle의 본질적 차이 (vs v0.41.1 report)**: v0.41.2 = `@google/gemini-cli-a2a-server` 단일 cherry-pick (race condition fix), CLI 본체 영향 0건, bkit 영향 0건. v0.41.1 report의 누적 카운트(33 files / Critical 0 / High 5 / Medium 10 / Low 28) 100% 동일 유지.

---

## Executive Summary

| 항목 | 내용 |
|------|------|
| 대상 버전 | Gemini CLI v0.39.1 → v0.41.2 (누적, 5개 버전 통합) |
| 보고 작성일 | 2026-05-07 |
| 총 영향 범위 | **33개 파일** (v0.40.0 27 + v0.41.x 신규 6, 중복 제외. v0.41.2 추가 영향 0) |
| Critical Issues | **0건** (즉시 수정 필요 없음) |
| High Issues | **5건** (P0, 1줄~15분 수정으로 해결) |
| 직접 회귀 가능성 | **0건** (P1~P7 7개 검증 모두 0건, v0.41.2 추가 0건) |
| 간접 회귀 위험 | **1건** (21개 FULL tier agents의 LLM 런타임 호출 경로 — v0.41.0 PR #25720) |
| 기능 개선 기회 | **11건** (자동 적용 4 + 채택 5 + 잔존 2 = 활용 후보) |
| 추천 전략 | **Strategy B' (Standard + Spot Verification)** |
| 예상 작업 기간 | **~4.5–5시간** (단일 누적 PR, v0.40.0/v0.41.x/v0.41.2 흡수) |
| 위험도 | **LOW** |
| 핵심 결정 포인트 | **D6** — 21 agent 회귀 스모크 범위 (전체 21 vs 샘플 5) |
| v0.41.2 추가 변경 | a2a-server 단일 패치, CLI 영향 0건, bkit 영향 0건 |

### 한 문단 요약

bkit v2.0.6는 Gemini CLI v0.39.1까지 안정 머지되었고, v0.40.0 P1~P4가 완료되었으나 Do가 미실행으로 남아있다. 그 사이 v0.41.0(major) → v0.41.1(patch) → **v0.41.2(patch a2a-server only)** 세 stable이 추가 출시되었다. 본 cycle은 **v0.40.0 + v0.41.x 모두를 흡수하여 v0.39.1 → v0.41.2 누적 단일 PR로 처리**한다. 정적 분석 결과 v0.41.x Breaking 4건 + v0.41.2 추가 0건은 bkit 코드에 **직접 영향 0건**이며 (`bash -c` wrapper 미사용, `argsPattern` 미정의, a2a-server 미의존, conversation log 미파싱, env placeholder 미사용, telemetry 미활성), 즉시 수정이 필요한 항목도 없다. 다만 PR #25720(recursive shell validation)이 21개 FULL tier agents의 LLM 런타임에서 호출하는 명령에 적용되므로 정적 grep만으로 보장이 어려워, **1시간 회귀 스모크로 동적 검증**을 권고한다. 작업은 Wave 1 P0(~30분, version flag 8개 + topic narration 잠금) → Wave 2 검증(~3–3.5h, 21 agent 스모크 + full baseline + spot 실측) → Wave 3 문서화(~1h, bkit v2.0.6 → v2.0.7) 순으로 진행되며, **v0.41.2 a2a-server 무관 명문화 1줄** 추가.

---

## Value Delivered

| 관점 | 내용 |
|------|------|
| **Problem** | (1) v0.40.0 cycle Do 미완료 + v0.41.0/v0.41.1/v0.41.2 stable 추가 출시로 누적 갭 발생 (2) PR #25720 recursive shell validation이 21개 FULL tier agents에 잠재적 회귀 가능 (3) testedVersions/feature flag 누락으로 v0.41.x 호환성 미선언 (4) v0.41.2 a2a-server race fix bkit 무관 미명문화 |
| **Solution** | v0.39.1 → v0.41.2 단일 누적 PR + 21 agent 스모크 1h + 5건 spot 실측 + version flag 8개 신설 + autoMemory/topic narration 명시 잠금 + a2a-server 무관 1줄 명문화 + bkit v2.0.7 일관성 |
| **Function/UX Effect** | (1) 부팅 8s → 1.4s (PR #25758, 자동 적용) (2) telemetry logPrompts 누설 차단 (PR #26153, v0.40.1 자동) (3) `gemini mcp list` ping false-negative fix (PR #26068 자동) (4) baseline runner 안정성 회복 (5) v2.1.0 cycle 진입 게이트(`hasMcpResourcesTools`/`hasAutoMemoryToggle`/`hasToolsCoreAllowlist` flag) 노출 (6) v0.41.2 a2a-server 투명성 — 향후 a2a-server 채택 시 버전 의존 명확화 |
| **Core Value** | **Automation First / Docs = Code / AI Partnership / No Guessing 4원칙 모두 ✅ 강화 또는 정렬** — Wave 1 P0가 자동화 흐름 정밀화, Wave 3 SKILL 12단락(v0.41.2 1줄 추가)이 Docs=Code, flag 8개 노출이 v2.1.0 AI Partnership 진입 게이트, 스모크가 No Guessing 강화 |

---

## 1. 변경사항 요약 (Phase 1 누적)

> 출처: `docs/01-plan/research/gemini-cli-v0.41.2-research.md` (32KB, 387 lines)
> v0.40.0/v0.41.1 부분은 baseline research 보고서 인용. v0.41.2는 §8 상세 분석.

### 1.1 누적 릴리스 타임라인 (5개 버전)

| 버전 | published_at | 성격 | 주요 테마 |
|------|--------------|------|---------|
| v0.39.1 | 2026-04-24 | bkit v2.0.6 baseline | — |
| **v0.40.0** | 2026-04-28 | minor (72 commits) | Memory 재편, Headless Trust, MCP resources, SEA 번들링 |
| **v0.40.1** | 2026-04-30 | patch (cherry-pick) | telemetry `logPrompts` 누설 fix |
| **v0.41.0** | 2026-05-05 | minor (47 commits) | Voice Mode, ContextManager, tools.core allowlist, YOLO fail-closed |
| **v0.41.1** | 2026-05-05 | patch (cherry-pick) | YOLO/AUTO_EDIT redirection 회귀 fix |
| **v0.41.2** | **2026-05-06** | **patch (a2a-server only)** | **`Task.waitForPendingTools()` race condition fix** |

### 1.2 Breaking Changes 누적 (7건 — v0.41.x 신규 4건, v0.40.0 baseline 3건)

| # | PR | 버전 | 항목 | bkit 영향 |
|---|----|----|------|----------|
| B1 | #25601 | v0.40.0 | `experimental.memoryManager` 의미 분리 (`autoMemory` 신설) | 0건 |
| B2 | #25586 | v0.40.0 | `topicUpdateNarration` default-on + `general` 카테고리 승격 | High (P0 잠금) |
| B3 | #25814 | v0.40.0 | Headless Trust Enforcement (`GEMINI_CLI_TRUST_WORKSPACE`) | 0건 (이미 정확 사용) |
| B4 | #25935 | v0.41.0 | YOLO + `argsPattern` fail-closed | 0건 |
| B5 | #25720 | v0.41.0 | `tools.core` allowlist + recursive shell validation | 직접 0건 / 간접 1건 (21 agents LLM) |
| B6 | #26060 | v0.41.0 | `--session-id <uuid>` flag 도입 | 0건 (옵트인) |
| B7 | #25409 | v0.41.0 | ContextManager + AgentChatHistory wire-up | 0건 |
| (B0) | **#26568/26589** | **v0.41.2** | **a2a-server `Task.waitForPendingTools()` race fix** | **0건 (재확인)** |

**누적 종합**: 8건 검증, **bkit 직접 회귀 0건**.

### 1.3 새로운 기능 누적 (24건 — v0.41.x 신규 9건, v0.40.0 baseline 15건)

| 기능 | PR | bkit 활용 가능성 | 본 cycle 처리 |
|------|-----|-----------------|--------------|
| **MCP resources** | #25395 | 🟢 높음 (flag 게이트) | 🟡 flag `hasMcpResourcesTools` 노출, PoC 별도 cycle |
| **4-tier prompt-driven memory** | #25716 | 🟢 높음 (namespace 명문화) | 🟡 SKILL.md 통합 문서 |
| `experimental.autoMemory` | #25601 | 🟡 중간 | 🟡 flag + 명시 잠금 |
| `GEMINI_CLI_TRUST_WORKSPACE` | #25814 | ✅ 이미 정확 사용 | ✅ 코드 변경 0건 |
| MCP resources 도구 | #25395 | 🟢 높음 | 🟡 tool isolation list에 추가 기회 |
| Voice Mode (`/voice`) | #24174 | 🟢 높음 (문서) | 🟢 SKILL.md 1줄 |
| Gemma 4 experimental | #25604 | 🟡 중간 | 🟡 flag + docs only |
| ContextManager wire-up | #25409 | 🟢 높음 (자동 적용) | ✅ 자동, 코드 변경 0건 |
| autoMemory scratchpad persistence | #25873 | 🟡 중간 | 🟡 flag + 별도 cycle |
| tools.core allowlist | #25720 | 🟢 높음 (옵트인) | 🟡 flag + 보안 cycle |
| --session-id flag | #26060 | 🟡 중간 | 🟡 flag 노출 |
| settings env auto type cast | #26118 | 🟢 높음 (자동) | ✅ 자동 |
| 부팅 perf 8s → 1.4s | #25758 | 🟢 높음 | ✅ 자동 적용 |
| gemini mcp list ping fix | #26068 | 🟢 높음 | ✅ 자동 적용 |

### 1.4 v0.41.2 단독 변경 (상세)

**a2a-server `Task.waitForPendingTools()` race condition fix**:
- PR #26568 (원본) → #26589 (cherry-pick v0.41.2)
- 변경 파일: `packages/a2a-server/src/agent/task.ts` (+42/-39), `task-event-driven.test.ts` (+69), `race-condition.test.ts` (+173 신규)
- **CLI 본체(`@google/gemini-cli`) 영향**: 0건
- **bkit 영향**: 0건 (grep 검증: a2a-server 의존 부재, package.json 부재)

---

## 2. 영향 분석 결과 (Phase 2 누적)

> 출처: `docs/03-analysis/gemini-cli-v0.41.2-impact.analysis.md` (29KB, 262 lines)

### 2.1 영향도 누적 카운트

| 카테고리 | v0.40.0 | v0.41.x | v0.41.2 추가 | **합계** |
|---|---:|---:|---:|---:|
| 🔴 Critical | 0 | 0 | **0** | **0** |
| 🟠 High | 3 | +2 | **0** | **5** |
| 🟡 Medium | 7 | +3 | **0** | **10** |
| 🟢 Low | 17 | +11 | **0** | **28** |
| **영향 파일 (중복 제외)** | 27 | +6 | **0** | **33** |

**v0.41.1 대비 변화**: v0.41.2는 **누적 카운트 100% 동일 유지** (a2a-server 한정이라 CLI 영향 0건).

### 2.2 P1~P7 검증 질문 답변 + v0.41.2 신규 검증

| Q | 질문 | 답 | 신뢰도 | v0.41.2 추가 |
|---|---|---|---|---|
| P1 | `bash -c` / `sh -c` / `$(...)` wrapper 호출? | NO | ⬛⬛⬛⬛⬛ | 동일 (a2a-server 무관) |
| P2 | YOLO + `argsPattern` 정의? | NO | ⬛⬛⬛⬛⬛ | 동일 |
| P3 | ACP 모드 + SessionEnd hook? | PARTIAL | ⬛⬛⬛⬛⬜ | 동일 |
| P4 | `gemini mcp list` 출력 캡처? | NO | ⬛⬛⬛⬛⬜ | 동일 |
| P5 | conversation log 파싱? | NO | ⬛⬛⬛⬛⬜ | 동일 |
| P6 | `${ENV:-default}` boolean/number? | NO | ⬛⬛⬛⬛⬜ | 동일 |
| P7 | telemetry + `logPrompts: false`? | NO | ⬛⬛⬛⬛⬜ | 동일 |
| **Q13 (신규)** | **a2a-server 의존?** | **NO** | **⬛⬛⬛⬛⬛** | **grep 재확인: 0건** |

### 2.3 High 항목 Top 3 (P0 권장)

| 우선순위 | 작업 | 파일 | 시간 |
|---------|------|------|------|
| 🟠 #1 | testedVersions에 **5개** 추가 (v0.40.0/0.40.1/0.41.0/0.41.1/**0.41.2**) | `bkit.config.json:120` | 2분 |
| 🟠 #2 | feature flag 8개 신설 + 1줄 코멘트 | `lib/gemini/version.js` | 15분 |
| 🟠 #3 | `general.topicUpdateNarration: false` 등 4줄 | `.gemini/settings.json` | 10분 |

### 2.4 간접 위험 1건 — PR #25720 LLM 런타임 회귀

**정적 grep으로 무력화 어려운 위험**: 21개 FULL tier agents가 LLM 추론으로 `run_shell_command` 호출 시, v0.41.0 recursive shell validation 적용 → **Wave 2.5에서 1시간 동적 회귀 스모크로 차단**.

### 2.5 철학 정합성 (4원칙 검증)

| 원칙 | 정합 | 비고 |
|------|------|------|
| Automation First | ✅ 강화 | 부팅 8s→1.4s (PR #25758), v0.41.2 sequential tool completion 안정성 향상 |
| No Guessing | ✅ 강화 | YOLO fail-closed (PR #25935), transient error sticky_retry (PR #26066) |
| Docs = Code | ✅ 강화 | settings env auto-cast (PR #26118), **v0.41.2 a2a-server 무관 명문화** |
| AI as Partner | ✅ 강화 | MCP resources (PR #25395), autoMemory scratchpad -16.7% turns |

**종합**: 4원칙 모두 ✅ 강화 또는 유지. **0건 충돌**.

### 2.6 활용 기회 요약 (11건 — 자동 4 + 채택 5 + 잔존 2)

**자동 적용 4건** (코드 변경 0):
- 부팅 perf (PR #25758)
- telemetry logPrompts fix (PR #26153)
- `gemini mcp list` ping fix (PR #26068)
- transient error sticky_retry (PR #26066)

**본 cycle 채택 5건** (flag 노출 + 명시 잠금):
- `experimental.autoMemory: false` 명시 (B1 완화)
- `general.topicUpdateNarration: false` (B2 완화)
- flag 8개 node exposed (v2.1.0 gate)
- a2a-server 무관 명문화 (Docs=Code)
- 21 agent 스모크 검증 (R9)

**잔존 2건** (별도 cycle 위임):
- MCP resources PoC (v2.1.0 plan refresh)
- tools.core allowlist 카탈로그 (보안 cycle)

---

## 3. 마이그레이션 전략 (Phase 3 결과)

> 출처: `docs/01-plan/features/gemini-cli-v0.41.2-migration.plan.md` (37KB, 416 lines)
> v0.41.1 plan 골격 95% 재활용 + v0.41.2 delta 5건 추가.

### 3.1 추천 전략 — Strategy B' (Standard + Spot Verification)

**가중 점수 8.85점 (12회차 적용, 5개 대안 중 1위, B 대비 +1.30, C 대비 +1.80)**.

### 3.2 5개 대안 비교 (최소화된 표)

| 전략 | 시간 | 위험도 | 점수 | 핵심 |
|------|------|-------|------|------|
| A | ~30분 | LOW | 5.10 | testedVersions만 |
| A'' | ~45분 | MED | 6.05 | A + v0.41.1 plan rename |
| B | ~3.5-4h | LOW | 7.55 | Standard (스모크 없음) |
| **B'** | **~4.5-5h** | **LOW** | **8.85** | **Standard + 21 agent 스모크** |
| C | ~26h | MED | 7.05 | Full + MCP PoC |

### 3.3 B' 1순위 이유 3가지

1. **v0.41.1 plan의 in-place rename + delta 각주**: P2 결론(누적 카운트 100% 동일)에 따라 v0.41.1 plan 골격 100% 재활용. **delta 5건** = testedVersions 1줄 + dependency 1줄 + SKILL 1줄 + W2.8 grep 5분 + 카운트. **v0.41.2를 별도 cycle로 처리하는 것보다 흡수 통합이 ROI 압도적.**

2. **Strategy B family 12번째 적용 — 검증된 패턴**: 메모리 인덱스에 누적된 11개 cycle 학습이 그대로 적용 가능. v0.40.0/v0.41.1 흡수 정책, 21 agent 스모크, MCP resources 분리, v2.1.0 trigger 메모 정책 모두 본 cycle에 인계.

3. **v0.41.2 a2a-server 무관 명문화 1줄 추가**: 향후 bkit이 a2a-server 채택 시 본 cycle SKILL 1줄이 v0.41.2 race-condition fix 적용 여부 근거가 됨. **Docs=Code 원칙 강화**.

### 3.4 거절된 대안 사유

- **Strategy C (26h, 7.05점)**: PoC가 회귀 차단과 섞이는 분리도 저하. v2.1.0 cycle 분리가 plan-plus 권장.
- **Strategy B (7.55점)**: 21 agent 스모크 누락. PR #25720 LLM 런타임 회귀를 정적 분석만으로 보장 불가 (1h 추가의 ROI 압도적).
- **Strategy A/A'' (~50분)**: v0.40.0 cycle 흡수 부족. 단일 누적 PR로 닫지 못하고 후속 cycle 부담 누적.

### 3.5 6개 결정 항목 (D1~D6)

| ID | 결정 | 권장 |
|----|------|------|
| **D1** | 권장 전략 | **Strategy B' 12회차** |
| **D2** | MCP resources | **v2.1.0 plan refresh cycle 분리** |
| **D3** | v2.1.0 본격 갱신 | **trigger 메모만, 본격 갱신 별도** |
| **D4** | testedVersions 정책 | **모두 누적** (N=11 도달 → 다음 cycle 재검토) |
| **D5** | 사전 부채 83건 | **본 cycle은 v0.41.x만** |
| **D6** | 21 agent 스모크 범위 | **21개 전체** (시간 압박 시 샘플 5개 fallback) |

---

## 4. 구현 로드맵

총 예상 시간: **~4.5–5시간** (Wave 1 ~35분 + Wave 2 ~3–3.5h + Wave 3 ~1h + Buffer ~30분).

### 4.1 Wave 1 (P0, ~35분) — Critical Patch + 회귀 사전 차단 + v0.40.0/v0.41.x/v0.41.2 흡수

| # | 작업 | 파일 | 시간 |
|---|------|------|------|
| W1.1 | testedVersions **5개 추가** (`0.40.0`, `0.40.1`, `0.41.0`, `0.41.1`, **`0.41.2`**) | `bkit.config.json:120` | 2분 |
| W1.2 | feature flag 8개 신설 (v0.40.0+ 4 + v0.41.0+ 4) | `lib/gemini/version.js:212` | 15분 |
| W1.3 | `general.topicUpdateNarration: false` | `.gemini/settings.json` | 5분 |
| W1.4 | `experimental.autoMemory: false`, `memoryManager: false` | `.gemini/settings.json` | 5분 |
| W1.5 | tc38 매트릭스 8개 항목 추가 | `tests/suites/tc38-feature-flags-matrix.js` | 15분 |
| **W1.6** | **`package.json` `@google/gemini-cli` v0.39.1 → v0.41.2 bump** | **`package.json`** | **3분** |

**AC**: `npm install` + `node tests/run-all.js --suite=tc04,tc38,smoke` PASS.

### 4.2 Wave 2 (P1, ~3–3.5h) — Spot Verification + 21 Agent Smoke + Baseline 회복

| # | 작업 | 검증 | 시간 |
|---|------|------|------|
| W2.1 | tc113/tc107 파일 실측 | find 1줄 | 10분 |
| W2.2 | topic narration L3 baseline (v0.41.2 npx) | L3 1회 narration 줄==0 | 15분 |
| W2.3 | `tools.core` schema 실측 (v0.41.2) | L3 1회 | 15분 |
| W2.4 | bkit-permissions deny 우선순위 spot | L2 spot | 15분 |
| W2.5 | **21 agent 회귀 스모크** (PR #25720 R9 차단) | L2 21/21 PASS | 60분 |
| W2.6 | full baseline 1회 (v0.41.2 install 후) | L2 pass >= 1925 | 30-60분 |
| W2.7 | tc115/tc113/tc38 카나리아 | L2 grep | 5분 |
| **W2.8** | **a2a-server 미의존 재확인** (P2 §9.4 재현) | **grep 결과 0건** | **5분** |

**AC**: 21/21 PASS + pass >= 1925 + tc115/tc113 PASS + **a2a-server grep 0건**.

### 4.3 Wave 3 (P2, ~1h) — 문서 갱신 + 버전 bump + v2.1.0 trigger

| # | 작업 | 파일 | 시간 |
|---|------|------|------|
| W3.1 | GEMINI.md v2.0.6 → v2.0.7 | `GEMINI.md:1,67` | 5분 |
| W3.2 | README.md testedVersions + 안내 1단락 | `README.md` | 15분 |
| W3.3 | gemini-cli-learning SKILL.md **12단락** (**v0.40.0 5 + v0.41.x 6 + v0.41.2 1줄** "a2a-server race fix bkit 무관") | `gemini-cli-learning/SKILL.md` | 30분 |
| W3.4 | `/new` alias + `/voice` slash command | 동일 | 5분 |
| W3.5 | bkit.config.json version 2.0.6 → 2.0.7 | `bkit.config.json` | 1분 |
| W3.6 | v2.1.0 plan trigger 메모 1단락 | `docs/01-plan/features/v2.1.0-context-optimization.plan.md` | 15분 |
| W3.7 | PR commit message 초안 | — | 10분 |

**AC**: bkit v2.0.7 일관성 + SKILL 12단락 + **v0.41.2 a2a-server 무관 1줄**.

### 4.4 Wave 4 (별도 cycle 위임, v0.41.1 plan 동일)

- MCP resources export PoC → v2.1.0 plan refresh cycle
- autoMemory scratchpad 옵트인 → v2.1.0 implementation
- tools.core allowlist 카탈로그 → 보안 강화 cycle

---

## 5. bkit 기능 개선/고도화 제안

| 기능 | 예상 효과 | 본 cycle 처리 | 별도 cycle |
|------|----------|-------------|---------|
| **MCP resources** | GEMINI.md 토큰 ~30% 절감 | flag 노출 | v2.1.0 plan refresh |
| **autoMemory scratchpad** | extractor turns -16.7% | flag 노출 | v2.1.0 implementation |
| **tools.core allowlist** | 보안 강화 + recursive validation | flag 노출 | 보안 강화 cycle |
| **--session-id flag** | 디버깅 UX | flag 노출 | v2.1.0 implementation |
| 부팅 perf (8s→1.4s) | 자동 적용 | ✅ 자동 | — |
| gemini mcp list fix | 자동 적용 | ✅ 자동 | — |

---

## 6. 위험 관리 계획

### 6.1 리스크 매트릭스 (v0.41.1 plan + v0.41.2 신규)

| ID | 리스크 | 가능성 | 영향 | 완화책 | 잔존 위험 |
|----|--------|-------|------|--------|----------|
| **R9** | 21 agent 스모크 PR #25720 회귀 발견 | LOW-MED | MED-HIGH | W2.5 스모크 21/21 | LOW |
| R5 | hidden regression (pass < 1925) | LOW-MED | LOW | W2.6 full baseline | LOW |
| R4 | v0.42.0 출시 충돌 | LOW | MED | W1 즉시 머지 + W2/W3 흡수 | LOW |
| R7 | tc113/tc107 부재 | LOW | MED | W2.1 find 실측 | LOW |
| R1 | topic narration noisy | MED | LOW | W1.3 + W2.2 L3 | LOW |
| **R11** | **v0.41.2 a2a-server 향후 채택 회귀** | **NEAR-ZERO** | **LOW** | **W2.8 grep 0건 재확인 + SKILL 1줄 명문화** | **NEAR-ZERO** |

**전체 위험도**: **LOW** (v0.41.1 동일 + R11 0건).

### 6.2 21 Agent 회귀 스모크 절차 (W2.5, 60분)

1. 21개 agent 목록 추출
2. 각 agent별 1개 샘플 명령 정의
3. bkit MCP `spawn_agent` 호출 + 샘플 실행
4. v0.41.2 정책 통과 + 결과 기록
5. 21/21 PASS → W2.6. 실패 → cycle 중단 + 회귀 분석.

**Fallback**: 시간 압박 시 샘플 5개 (cto-lead, qa-strategist, bkend-expert, code-analyzer, pm-discovery).

### 6.3 롤백 전략

| 레벨 | 트리거 | 절차 |
|------|-------|------|
| L1 | unit fail | `git revert <sha>` |
| L2 | user-scope | `~/.gemini/settings.json` 수정 |
| L3 | CLI 회귀 | `npx @google/gemini-cli@0.39.1` 다운그레이드 |
| R9 | 21 agent 실패 | Wave 1 직전 되돌림 + 회귀 분석 cycle |

### 6.4 회귀 모니터링 (Wave 2.6)

- **Pre-baseline**: v0.39.1 baseline = 1925/2032 PASS
- **AC**: v0.41.2 install 후 pass >= 1925 회복
- **fail/skip 분포**: v0.39.1 cycle 보고서와 동일 (사전 부채 83 + skip 24)

---

## 7. Acceptance Criteria (AC, 12건)

### 7.1 정량 (7건)

1. **L1 unit**: tc04 / tc38 / smoke PASS (Wave 1)
2. **L2 baseline**: `node tests/run-all.js` pass >= 1925 (Wave 2.6)
3. **L3 spot (narration)**: v0.41.2 npx 격리 후 topic narration 줄 == 0 (Wave 2.2)
4. **L3 spot (tools.core)**: 키 schema 명칭 확정 (Wave 2.3)
5. **카나리아**: tc115 + tc113 + tc38 PASS (Wave 2.7)
6. **21 agent 스모크**: 21/21 PASS (Wave 2.5, R9)
7. **a2a-server grep**: 매치 0건 (code/script/package.json) (Wave 2.8)

### 7.2 정성 (5건)

1. **YAGNI 준수**: Wave 4 별도 cycle 위임 + v0.41.2 전용 flag 제거
2. **외부 인터페이스 실측**: 7건 spot 모두 결과 명시 + **a2a-server 재확인**
3. **Strategy B' 12회차 적용**: 메모리 인덱스 학습 적용 + v0.41.2 학습 추가
4. **cycle 통합**: 3개 cycle(v0.40.0/v0.41.x/v0.41.2) 단일 PR로 **supersede 명시**
5. **D1~D6 명문화**: 6개 결정 모두 기록 + **N=11 trigger (D4 재검토)**

---

## 8. v0.41.1 cycle 대비 변경 요약

### 8.1 본질적 차이 1줄

**v0.41.2는 a2a-server 단일 cherry-pick으로 CLI 영향 0건, bkit 영향 0건 → v0.41.1 plan 골격 100% 재활용, delta 5건만 추가.**

### 8.2 변경 항목 (delta 5건)

| # | 항목 | v0.41.1 | v0.41.2 추가 | 사유 |
|---|------|---------|-------------|------|
| 1 | testedVersions | 4개 (`0.40.0/0.40.1/0.41.0/0.41.1`) | +1 (`0.41.2`) | npm latest 변경 |
| 2 | dependency | v0.41.1 | → v0.41.2 | 버전 bump |
| 3 | SKILL 단락 | 11개 | +1 (v0.41.2 a2a-server 무관) | Docs=Code |
| 4 | Wave 2 신규 | 7건 spot | +**W2.8 a2a-server grep** | P2 재현 |
| 5 | Strategy count | 11회차 | **12회차** | cycle 진척 |

**delta 합계**: 5건. **v0.41.1 plan 골격 ≥95% 재활용**.

### 8.3 누적 카운트 (변화 없음)

| 항목 | v0.41.1 | v0.41.2 | 변화 |
|------|---------|---------|------|
| Critical | 0 | 0 | 동일 |
| High | 5 | 5 | 동일 |
| Medium | 10 | 10 | 동일 |
| Low | 28 | 28 | 동일 |
| 영향 파일 | 33 | 33 | 동일 |
| 권장 전략 | B' (~4.5-5h) | B' (~4.5-5h) | 동일 |

---

## 9. 미해결 검증 답변 (P2 Q1~Q5 + v0.41.2 Q13)

| Q# | 질문 | 본 P3 답변 또는 Do 위임 |
|---|---|----|
| Q1 | PR #25720 recursive shell 21 agent LLM 회귀 | **Do W2.5** — 21 agent 스모크 1h로 동적 검증 |
| Q2 | `hasToolsCoreAllowlist` 시작 버전 (v0.41.0 정식 vs cherry-pick) | **Do W2.3** — npx 격리 실측 + 본 P3은 v0.39.1 보수적 유지 코멘트 |
| Q3 | tc113/tc107 파일 존재 여부 | **Do W2.1** — find 실측, 부재 시 P1 부채 등록 |
| Q4 | bkit-permissions deny vs YOLO fail-closed | **Do W2.4** — sandbox 시뮬 spot |
| Q5 | `general.topicUpdateNarration: false` e2e 영향 | **Do W2.6+W2.2** — full baseline + L3 spot 검증 |
| **Q13** | **a2a-server 의존?** | **Done** — P2 grep 결과 0건 + **Do W2.8 재현** |

**모든 6건 Do에서 해소 가능** (Q13은 P2에서 이미 검증됨, W2.8 재현만 추가).

---

## 10. 다음 단계 트리거

본 cycle close 후 진입할 별도 cycle (우선순위 순):

| Cycle | 진입 조건 | 위임 항목 | 예상 시간 |
|-------|----------|---------|---------|
| **v2.1.0 plan refresh** | 본 cycle close 직후 (1주 이내) | Section 4/5/6/9 갱신, MCP resources PoC, namespace docs, autoMemory 검토, tools.core 카탈로그 | ~1d |
| **v2.1.0 implementation** | v2.1.0 plan close 후 | MCP resources PoC + autoMemory 옵트인 + `--session-id` | ~3–5d |
| **v0.42.0 / next stable** | v0.42.0 출시 시 | Wave 1 즉시 머지 + W2/W3 흡수 | ~3–4h |

---

## 11. 참고 자료

### 11.1 본 cycle 산출물 (P1~P4)

- **P1 Research**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/research/gemini-cli-v0.41.2-research.md`
- **P2 Impact**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/03-analysis/gemini-cli-v0.41.2-impact.analysis.md`
- **P3 Plan**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/features/gemini-cli-v0.41.2-migration.plan.md`
- **P4 Report** (본 문서): `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/04-report/gemini-cli-v0.41.2-migration.report.md`

### 11.2 supersede 대상 (v0.40.0 / v0.41.1 cycle)

- `docs/01-plan/research/gemini-cli-v0.40.0-research.md` ← **본 P1에 인용**
- `docs/03-analysis/gemini-cli-v0.40.0-impact.analysis.md` ← **본 P2에 인용**
- `docs/01-plan/features/gemini-cli-v0.40.0-migration.plan.md` ← **본 P3 골격 재활용**
- `docs/04-report/gemini-cli-v0.40.0-migration.report.md` ← **본 P4로 superseded**
- `docs/01-plan/research/gemini-cli-v0.41.1-research.md` ← **본 P1에 인용**
- `docs/03-analysis/gemini-cli-v0.41.1-impact.analysis.md` ← **본 P2에 인용**
- `docs/01-plan/features/gemini-cli-v0.41.1-migration.plan.md` ← **본 P3 기반**
- `docs/04-report/gemini-cli-v0.41.1-migration.report.md` ← **본 P4로 superseded**

### 11.3 이전 cycle Plan (Strategy B' family, 학습 누적)

- v0.39.1 (9th): `docs/01-plan/features/gemini-cli-v0.39.1-migration.plan.md`
- v0.39.0 (8th): `docs/01-plan/features/gemini-cli-v0.39.0-migration.plan.md`
- v0.38.2 (7th): `docs/01-plan/features/gemini-cli-v0.38.2-migration.plan.md`

### 11.4 bkit 철학 + v2.1.0

- `bkit-system/philosophy/{core-mission,ai-native-principles,context-engineering,workflow-philosophy}.md`
- `docs/01-plan/features/v2.1.0-context-optimization.plan.md` (Section 4/5/6 trigger 메모만)

### 11.5 Gemini CLI 공식 출처 (5개 버전)

- v0.39.1: https://github.com/google-gemini/gemini-cli/releases/tag/v0.39.1
- v0.40.0: https://github.com/google-gemini/gemini-cli/releases/tag/v0.40.0
- v0.40.1: https://github.com/google-gemini/gemini-cli/releases/tag/v0.40.1
- v0.41.0: https://github.com/google-gemini/gemini-cli/releases/tag/v0.41.0
- v0.41.1: https://github.com/google-gemini/gemini-cli/releases/tag/v0.41.1
- **v0.41.2**: https://github.com/google-gemini/gemini-cli/releases/tag/v0.41.2
- PR #26568 (v0.41.2 원본): https://github.com/google-gemini/gemini-cli/pull/26568
- PR #26589 (v0.41.2 cherry-pick): https://github.com/google-gemini/gemini-cli/pull/26589

---

## 12. 승인 체크리스트 (Do 진입 전)

### 12.1 Plan 자체 검토

- [ ] **D1 (Strategy B' 12회차)** 채택 — 가중 점수 8.85
- [ ] **D2 (MCP resources 분리)** 동의
- [ ] **D3 (v2.1.0 trigger 메모만)** 동의
- [ ] **D4 (testedVersions 누적, N=11)** 동의
- [ ] **D5 (사전 부채 미처리)** 동의
- [ ] **D6 (21 agent 전체 vs 샘플 5)** 동의

### 12.2 v0.41.2 추가 검증

- [ ] **v0.41.2 a2a-server 무관** 동의 (W2.8 grep 재현)
- [ ] **Wave 3.3 SKILL 12단락** (v0.41.2 1줄 추가) 동의

### 12.3 작업 시간 가용성

- [ ] **4.5–5h 가용** 확보
- [ ] full baseline 실행 환경 (30–60분)
- [ ] 21 agent 스모크 실행 환경 (60분)

---

**Status**: ✅ **Phase 1~4 완료. Do (구현) 단계 진입 대기 중.**

---

## 부록: v0.41.1 보고서 대비 변경 요약 (교차 검증)

v0.41.2 추가로 인한 본 보고서의 본질적 변화는 0건. 모든 누적 카운트 유지, delta 5건만 추가:

1. **testedVersions**: 4개 → **5개** (v0.41.2 추가)
2. **dependency**: v0.41.1 → **v0.41.2**
3. **SKILL**: 11단락 → **12단락** (a2a-server 무관 1줄)
4. **Wave 2.8**: 신규 (a2a-server grep 재확인, 5분)
5. **Strategy**: 11회차 → **12회차**

**v0.41.1 보고서의 Executive Summary, Value Delivered, Breaking Changes, 철학 정합성, 위험 관리, AC 모두 100% 유지.**

---

*보고서 작성 완료: 2026-05-07. Strategy B' 12번째 적용. 누적 카운트 33 files / Critical 0 / High 5 / Medium 10 / Low 28 (v0.41.1 대비 동일). v0.40.0 + v0.41.1 + v0.41.2 단일 PR 통합. a2a-server 미의존 명문화. 다음 액션: Do 단계 진입 (Wave 1 → Wave 2 → Wave 3).*

*bkit-report-generator agent (Strategy B' family 12th application)*
