# Gemini CLI v0.41.1 마이그레이션 종합 보고서

> **PDCA 단계**: Plan/Analysis 종합 (Do 진입 전 최종 결재본)
> **작성일**: 2026-05-06
> **작성자**: /gemini-migration Phase 4 (main session)
> **베이스라인**: bkit v2.0.6 (= Gemini CLI v0.39.1, PR #24 main 머지)
> **타겟**: Gemini CLI v0.41.1 (latest stable, 2026-05-05 릴리스)
> **누적 비교 범위**: `v0.39.1...v0.41.1` (= v0.40.0 + v0.40.1 + v0.41.0 + v0.41.1)

---

## Executive Summary

| 항목 | 내용 |
|------|------|
| 대상 버전 | Gemini CLI v0.39.1 → v0.41.1 (누적, 4개 버전 통합) |
| 조사 완료일 | 2026-05-06 |
| 총 영향 범위 | **33개 파일** (v0.40.0 27개 + v0.41.x 신규 6개, 중복 제외) |
| Critical Issues | **0건** (즉시 수정 필요 없음) |
| High Issues | **5건** (P0, 1줄~15분 수정으로 해결) |
| 직접 회귀 가능성 | **0건** (P1~P7 7개 검증 모두 0건) |
| 간접 회귀 위험 | **1건** (21개 FULL tier agents의 LLM 런타임 호출 경로) |
| 기능 개선 기회 | **14건** (자동 적용 4 + 채택 5 + 잔존 5 = 활용 후보) |
| 추천 전략 | **Strategy B' (Standard + Spot Verification)** |
| 예상 작업 기간 | **~4.5–5시간** (단일 누적 PR) |
| 위험도 | **LOW** |
| 핵심 결정 포인트 | **D6** — 21 agent 회귀 스모크 범위 (전체 21 vs 샘플 5) |

### 한 문단 요약

bkit v2.0.6는 Gemini CLI v0.39.1까지 안정 머지된 상태에서, v0.40.0 P1~P4가 완료되었으나 Do 단계가 미실행으로 남아있다. 그 사이 v0.41.0(major, 2026-05-05) → v0.41.1(patch) 두 stable 버전이 추가 출시되었다. 본 cycle은 **v0.40.0 cycle을 흡수하여 v0.39.1 → v0.41.1 누적 단일 PR로 처리**한다. 정적 분석 결과 v0.41.x Breaking 4건은 bkit 코드에 직접 영향이 0건이며 (`bash -c` wrapper 미사용, `argsPattern` 미정의, ACP 미사용, conversation log 미파싱, env var placeholder 미사용, telemetry 미활성), 즉시 수정이 필요한 항목도 없다. 다만 PR #25720(recursive shell validation)이 21개 FULL tier agents가 LLM 런타임에서 호출하는 명령에 적용되므로 정적 grep만으로 보장이 어려워, **1시간 회귀 스모크로 동적 검증**을 권고한다. 작업은 Wave 1 P0(30분, version flag 8개 + topic narration 잠금) → Wave 2 검증(3–3.5h, 21 agent 스모크 + full baseline + 4건 spot 실측) → Wave 3 문서화(1h, bkit v2.0.6 → v2.0.7) 순으로 진행한다.

---

## Value Delivered

| 관점 | 내용 |
|------|------|
| **Problem** | (1) v0.40.0 cycle Do 미완료 + v0.41.0 stable 추가 출시로 누적 갭 발생 (2) PR #25720 recursive shell validation이 21개 FULL tier agents에 잠재적 회귀 가능 (3) testedVersions/feature flag 누락으로 v0.41.x 호환성 미선언 |
| **Solution** | v0.39.1 → v0.41.1 단일 누적 PR + 21 agent 스모크 1h + 4건 spot 실측 + version flag 8개 신설 + autoMemory/topic narration 명시 잠금 + bkit v2.0.7 일관성 |
| **Function/UX Effect** | (1) 부팅 8s → 1.4s (PR #25758, 자동 적용) (2) telemetry logPrompts 누설 차단 (PR #26153, v0.40.1) (3) `gemini mcp list` ping false-negative fix (PR #26068) (4) baseline runner 안정성 회복 (5) v2.1.0 cycle 진입 게이트(`hasMcpResourcesTools`/`hasAutoMemoryToggle` flag) 노출 |
| **Core Value** | **Automation First / Docs = Code / AI Partnership 4원칙 모두 ✅ 강화 또는 정렬** — Wave 1 P0가 자동화 흐름 정밀화, Wave 3 SKILL 11단락이 Docs=Code, flag 8개 노출이 v2.1.0 AI Partnership 진입 게이트 |

---

## 1. 변경사항 요약 (Phase 1 결과)

> 출처: `docs/01-plan/research/gemini-cli-v0.41.1-research.md` (31KB, 381 lines)
> v0.40.0 부분은 `docs/01-plan/research/gemini-cli-v0.40.0-research.md`(28KB) 인용.

### 1.1 누적 릴리스 타임라인

| 버전 | published_at | 비고 |
|------|--------------|------|
| v0.39.1 | 2026-04-24 | bkit v2.0.6 머지된 baseline (이미 적용됨) |
| **v0.40.0** | 2026-04-28 | 72 commits, Memory 재편 + Headless Trust + MCP resources |
| **v0.40.1** | 2026-04-30 | patch (cherry-pick PR #26153) — telemetry `logPrompts` 누설 fix |
| **v0.41.0** | 2026-05-05 | 47 commits ahead, 39개는 v0.41.0 신규, Voice Mode + ContextManager + tools.core allowlist |
| **v0.41.1** | 2026-05-05 | patch (cherry-pick PR #26542) — YOLO/AUTO_EDIT 모드 redirection 회귀 fix |

### 1.2 Breaking Changes (v0.41.x 신규 한정 4건)

| ID | PR | 변경 본질 | bkit 영향 (P2 검증) |
|----|-----|----------|------------------|
| **B1** | #25935 | YOLO 모드 fail-closed — `argsPattern` restricted rule + parser 실패 시 default `ALLOW` → `BLOCK` | **0건** (bkit는 `argsPattern` 미정의) |
| **B2** | #25720 | `tools.core` allowlist + recursive shell validation — sub-command/substitution 재귀 매칭, `bash -c` wrapper unwrap | **직접 0건** (bkit 코드 wrapper 미사용) / **간접 1건** (21 agents LLM 런타임) |
| **B3** | #26060 | `--session-id <uuid>` CLI flag — 사용자가 명시적 session UUID 지정, `--resume`과 충돌 | **0건** (bkit는 미채택, 기회 항목) |
| **B4** | #25409 | ContextManager wire-up — 내부 conversation 관리 객체 전환 | **0건** (bkit는 conversation log 미파싱) |

### 1.3 새로운 기능 9건 (v0.41.x 신규)

| 기능 | PR | bkit 활용 가능성 |
|------|-----|-----------------|
| Voice Mode (`/voice`, Whisper local) | #24174 | 학습 SKILL 1줄 (bkit headless 무관) |
| `tools.core` allowlist | #25720 | 별도 보안 강화 cycle 위임 (~1d) |
| Gemma 4 experimental | #25604 | 외부 API 정책 변경 동반 — 별도 cycle |
| ContextManager 내부 전환 | #25409 | 자동 적용, bkit 코드 무영향 |
| autoMemory scratchpad | #25873 | v2.1.0 implementation cycle 위임 (-16.7% turns, +32.7% precision 평가) |
| `settings.json` env var auto type cast | #26118 | 자동 적용, bkit는 placeholder 미사용 |
| `--session-id <uuid>` flag | #26060 | v2.1.0 sidecar 인터페이스와 함께 검토 |
| 부팅 perf 8s → 1.4s | #25758 | **자동 적용** — bkit 사용자 즉시 체감 |
| `gemini mcp list` ping false-negative fix | #26068 | **자동 적용** — bkit MCP 검증 안정성 향상 |

### 1.4 보안/Privacy 업데이트

- **PR #26153 (v0.40.1 cherry-pick)**: telemetry `logPrompts: false` flag 누설 차단. bkit는 telemetry 비활성이라 직접 영향 없으나 향후 활성 시 자동 안전.

### 1.5 v0.40.0 baseline 변경사항 요약 (인용)

v0.40.0 변경사항은 baseline research 문서에 상세 정리되어 있고, 본 cycle에서 그대로 흡수한다:
- Memory 시스템 재편 (4-tier paths)
- Workspace Trust hardening (`GEMINI_CLI_TRUST_WORKSPACE` 변수명 확정)
- MCP resources GA
- ripgrep SEA 번들링
- Topic narration default-on (회귀 위험 → W1.3에서 명시 잠금)
- autoMemory/memoryManager experimental split

### 1.6 카테고리 분포 (v0.41.x 신규 한정)

- 🔴 Breaking-leaning Behavior Change: 1
- 🟠 Behavior Change: 5
- 🟡 Feature Add (significant): 6
- 🟢 Bug Fix: 18
- 🔒 Security/Privacy: 1
- Docs/Internal: ~5

---

## 2. 영향 분석 결과 (Phase 2 결과)

> 출처: `docs/03-analysis/gemini-cli-v0.41.1-impact.analysis.md` (30KB, 324 lines)

### 2.1 영향도 카운트

| 카테고리 | v0.40.0 (인용) | v0.41.x 신규 | 합계 |
|---|---:|---:|---:|
| 🔴 Critical | 0 | **0** | **0** |
| 🟠 High | 3 | **2** | **5** |
| 🟡 Medium | 7 | **3** | **10** |
| 🟢 Low | 17 | **11** | **28** |
| 영향 추정 파일 (중복 제외) | 27 | +6 | **33** |
| **즉시 수정 필요** | 0 | **0** | **0** |

### 2.2 P1 → P2 7개 검증 질문 답변 (요약)

| # | 검증 질문 | 답 | bkit 영향 |
|---|---|---|---|
| P1 | bkit이 `bash -c` / `sh -c` / `$(...)` wrapper를 호출하는가? | **NO** (정책 엔진 대상 0건) | PR #25720 직접 영향 0건 |
| P2 | YOLO + `argsPattern` 정의? | **NO** (`argsPattern` 0건) | PR #25935 직접 영향 0건 |
| P3 | ACP 모드 + SessionEnd hook? | **PARTIAL** (SessionEnd 정의, ACP 미사용) | PR #26125 직접 영향 0건 |
| P4 | `gemini extensions list`/`mcp list` 출력 캡처? | **NO** | PR #25894/#26068 활용 기회 |
| P5 | `~/.gemini/tmp/<hash>/...` conversation log 파싱? | **NO** | PR #25409 직접 영향 0건 |
| P6 | `${ENV:-default}` 패턴으로 boolean/number? | **NO** | PR #26118 직접 영향 0건 |
| P7 | telemetry 활성 + `logPrompts: false`? | **NO** (telemetry 비활성) | PR #26153 직접 영향 0건 |

**종합**: v0.41.x 신규 Breaking 4건이 bkit 코드에 **직접 영향 0건**.

### 2.3 최우선 조치 Top 3 (High 5건 중)

| 우선순위 | 작업 | 파일 (file:line) | 시간 |
|---------|------|-----------------|------|
| 🟠 #1 | testedVersions에 `0.40.0`/`0.40.1`/`0.41.0`/`0.41.1` 4개 추가 | `bkit.config.json:120` | ~1분 |
| 🟠 #2 | v0.40.0+/v0.41.0+ feature flag 그룹 8개 신설 (`hasMcpResourcesTools`, `hasAutoMemoryToggle`, `hasMemoryFourTier`, `hasTopicNarrationGeneral`, `hasToolsCoreAllowlist`, `hasYoloFailClosed`, `hasSessionIdFlag`, `hasSettingsEnvCast`) | `lib/gemini/version.js:212` 뒤 | ~15분 |
| 🟠 #3 | `general.topicUpdateNarration: false` + `experimental.autoMemory: false` + `experimental.memoryManager: false` 명시 잠금 | `.gemini/settings.json` | ~10분 |

### 2.4 간접 위험 1건 — PR #25720 LLM 런타임 회귀

**정적 grep으로 무력화 어려운 위험**: 21개 FULL tier agents가 LLM 추론으로 호출하는 `run_shell_command`는 bkit 코드가 *어떤* 명령을 호출할지 결정하지 않는다. v0.41.0 recursive shell validation이 LLM이 만든 명령에 적용되므로 정적 분석만으로 회귀 차단을 보장할 수 없다. → **Wave 2.5에서 1시간 동적 회귀 스모크로 차단**.

### 2.5 bkit 철학 정합성 (4원칙 검증)

| 원칙 | 정합 | 비고 |
|------|------|------|
| Automation First / No Guessing / Docs = Code | ✅ 강화 | YOLO fail-closed (No Guessing 강화), env var auto-cast (Docs=Code) |
| AI as Partner / Human-AI 역할 분담 | ✅ 강화 | autoMemory scratchpad 평가 결과 (-16.7% turns) |
| PDCA Methodology / Zero Script QA / 9-Stage Pipeline | ✅ 유지 | 본 cycle 자체가 PDCA 11번째 적용 |
| Context Engineering / 6-Layer Architecture / 12 Hook Events | ✅ 유지 | MCP resources export 기회는 v2.1.0 cycle 위임 |

### 2.6 가장 큰 개선 기회

**MCP resources export** (v0.40.0 잔존): bkit-server에 `bkit-system/philosophy/*.md` 4개 + `templates/*.md` 14개를 MCP resource로 노출 시 매 턴 GEMINI.md 토큰 ~30% 절감 추정 + AI Partnership 강화 + v2.1.0 context-optimization plan과 직접 시너지. **본 cycle에서는 게이트(flag)만 노출, PoC는 별도 cycle 위임**.

---

## 3. 마이그레이션 전략 (Phase 3 결과)

> 출처: `docs/01-plan/features/gemini-cli-v0.41.1-migration.plan.md` (39KB, 491 lines)

### 3.1 추천 전략 — Strategy B' (Standard + Spot Verification)

**가중 점수 8.00 (5개 대안 중 1위, B 대비 +0.60, C 대비 +0.55)**.

### 3.2 5개 대안 비교 매트릭스

| 전략 | 작업 시간 | 위험도 | 가중 점수 | 핵심 차이 |
|------|---------|-------|---------|---------|
| A — Minimal | ~50분 | LOW (간접 미차단) | 5.85 | P0만, 21 agent 스모크 없음 |
| A' — Minimal + 1 spot | ~1.5h | LOW | 6.40 | A + topic narration L3 1회 |
| B — Standard | ~3.5–4h | LOW | 7.40 | A' + autoMemory 명시 + tc113/tc107 spot + full baseline 1회 + 문서 갱신 |
| **B' — Standard + Spot Verification** | **~4.5–5h** | **LOW (간접 차단)** | **8.00** | **B + 21 agent 회귀 스모크 1h + tools.core schema spot** |
| C — Full | ~26h (~3–4d) | MEDIUM (PoC 분리도 ↓) | 7.45 | B' + MCP resources PoC + v2.1.0 본격 갱신 + autoMemory 옵트인 검증 |

### 3.3 B' 1순위 이유 3가지

1. **Strategy B' 패턴 11번째 적용 — 검증된 절차**: v0.37.1 이후 10번 연속 적용된 안정 패턴. 메모리 인덱스에 누적된 학습이 그대로 적용 가능.
2. **간접 위험 차단 신뢰도 9 → 10**: P2가 명시한 "정적 분석 무력화 어려움" 위험을 1h 스모크로 동적 검증 — Strategy B 대비 가장 큰 차별점.
3. **v0.40.0 cycle 흡수 일관성 10점**: v0.40.0 cycle Plan/Impact가 Do 미완료로 잔존하는 상황에서, 단일 PR 운영이 PR 2개·테스트 2회·머지 충돌 부담을 모두 회피.

### 3.4 거절된 대안 사유

- **Strategy C (Full, 26h)**: PoC가 회귀 차단 신호와 섞이는 분리도 저하가 본질적 문제. v2.1.0 cycle로 분리하는 것이 plan-plus 권장.
- **Strategy B (Standard, 7.40)**: 21 agent 스모크 누락. PR #25720 LLM 런타임 회귀를 정적 분석만으로 보장 불가.
- **Strategy A/A' (5.85/6.40)**: v0.40.0 cycle 흡수 부분만 — 단일 누적 PR로 닫지 못하고 후속 cycle 부담 누적.

### 3.5 6개 결정 항목 (D1~D6)

| ID | 결정 항목 | 권장 |
|----|---------|------|
| **D1** | 권장 전략 | **Strategy B'** |
| **D2** | MCP resources export 시점 | **v2.1.0 plan refresh cycle 단독 PoC** (분리 유지) |
| **D3** | v2.1.0 plan 본격 갱신 시점 | **본 cycle은 trigger 메모 1단락만**, 본격 갱신 별도 cycle |
| **D4** | testedVersions 누적 정책 | **모두 누적** (`["0.34.0", ..., "0.41.1"]`, N=10 도달 → 다음 cycle 재검토) |
| **D5** | 사전 부채 83건 처리 | **본 cycle은 v0.41.x만** — 사전 부채 미처리 |
| **D6** | 21 agent 회귀 스모크 범위 | **21개 전체 (~60분)** — 시간 압박 시 샘플 5개 fallback |

---

## 4. 구현 로드맵

> 출처: Phase 3 plan §4. 총 ~4.5–5h (Wave 1 30분 + Wave 2 3–3.5h + Wave 3 1h + Buffer 30분).

### 4.1 Wave 1 (P0, ~30분) — Critical Patch + 회귀 사전 차단

| # | 작업 | 파일 (file:line) | 시간 |
|---|------|-----------------|------|
| W1.1 | testedVersions에 `"0.40.0", "0.40.1", "0.41.0", "0.41.1"` 4개 추가 | `bkit.config.json:120` | 2분 |
| W1.2 | v0.40.0+ flag 4개 + v0.41.0+ flag 4개 = 8개 신설 | `lib/gemini/version.js:212` 뒤 | 15분 |
| W1.3 | `general.topicUpdateNarration: false` 명시 잠금 | `.gemini/settings.json:2` | 5분 |
| W1.4 | `experimental.autoMemory: false` + `experimental.memoryManager: false` 명시 | `.gemini/settings.json` | 5분 |
| W1.5 | tc38 매트릭스에 8개 항목 추가 | `tests/suites/tc38-feature-flags-matrix.js` | 15분 |

**산출물**: 5개 파일 수정 (~20줄). flag 8개 노출 + 의도 명문화.
**AC**: `node tests/run-all.js --suite=tc04,tc38,smoke` PASS.

### 4.2 Wave 2 (P1, ~3–3.5h) — Spot Verification + 21 Agent Smoke + Baseline 회복

| # | 작업 | 검증 (L1/L2/L3) | 시간 |
|---|------|---------------|------|
| W2.1 | tc113/tc107 파일 존재 실측 (`find tests/suites`) | L1 — 부재 시 별도 P1 부채 등록 | 10분 |
| W2.2 | topic narration L3 baseline 실측 (npx 격리) | L3 1회 — narration 줄 수 == 0 | 15분 |
| W2.3 | `tools.core` 키 schema 실측 (npx 격리 `--help` + bundle js grep) | L3 1회 — 키 명칭 확정 | 15분 |
| W2.4 | bkit-permissions deny 우선순위 spot (YOLO + `rm -rf` 시뮬) | L2 spot | 15분 |
| W2.5 | **21 agent 회귀 스모크** (PR #25720 간접 위험 차단) | L2 — 21/21 PASS | 60분 |
| W2.6 | full baseline 1회 (`node tests/run-all.js`) | L2 — pass >= 1925 회복 | 30–60분 |
| W2.7 | tc115 / tc113 / tc38 회귀 명시 PASS 확인 | L2 grep | 5분 |
| W2.8 | docs 산출물 참조 무결성 | path read | 5분 |

**AC**: 21/21 PASS + pass >= 1925 + tc115/tc113 PASS + tools.core 키 명칭 확정.

### 4.3 Wave 3 (P2, ~1h) — 문서 갱신 + 버전 bump + v2.1.0 trigger 메모

| # | 작업 | 파일 | 시간 |
|---|------|------|------|
| W3.1 | `GEMINI.md` 헤더/footer bkit v2.0.6 → v2.0.7 | `GEMINI.md:1, 67` | 5분 |
| W3.2 | README.md v0.40.0+v0.41.1 안내 1단락 | `README.md` | 15분 |
| W3.3 | `gemini-cli-learning/SKILL.md` 11단락 추가 (v0.40.0 5 + v0.41.x 6) | `gemini-cli-learning/SKILL.md` | 30분 |
| W3.4 | `/new` alias + `/voice` slash command + Voice Mode 외부 의존 1줄씩 | 동일 | 5분 |
| W3.5 | `bkit.config.json` version `2.0.6` → `2.0.7` | `bkit.config.json` | 1분 |
| W3.6 | v2.1.0 plan trigger 메모 1단락 (본격 갱신은 별도 cycle 명시) | `docs/01-plan/features/v2.1.0-context-optimization.plan.md` | 15분 |
| W3.7 | PR commit message 초안 | — | 10분 |

**AC**: bkit v2.0.7 일관성 (GEMINI.md/README.md/bkit.config.json) + v2.1.0 trigger 메모 + commit message 초안.

### 4.4 Wave 4 (별도 cycle 위임)

| 항목 | 위임 cycle | 근거 |
|---|---|---|
| MCP resources export PoC | v2.1.0 plan refresh cycle | 회귀 차단 분리도 유지 |
| 4-tier namespace docs 명문화 | v2.1.0 plan refresh cycle | 영향 0건 docs-only |
| `GEMINI_CLI_TRUSTED_FOLDERS_PATH` bootstrap 자동화 | onboarding UX cycle | 별도 도메인 |
| autoMemory scratchpad 옵트인 검증 | v2.1.0 implementation cycle | 메모리 정책 동반 변화 |
| `tools.core` allowlist 카탈로그 도출 | 별도 보안 강화 cycle | 21 agent 명령 카탈로그 ~1d |
| `--session-id <uuid>` flag 채택 | v2.1.0 implementation cycle | sidecar 인터페이스와 함께 |
| Voice Mode (`/voice`) | docs only (W3.4) | bkit headless 무관 |
| Gemma 4 experimental | 별도 외부 모델 cycle | API 정책 변경 동반 |

---

## 5. bkit 기능 개선/고도화 제안

본 cycle에서 즉시 활용 또는 게이트만 노출, PoC/본격 채택은 별도 cycle 위임:

| 기능 | bkit 활용 방안 | 예상 효과 | 본 cycle 처리 | 별도 cycle |
|------|--------------|----------|-------------|----------|
| **MCP resources export** | bkit-server에 philosophy 4개 + templates 14개 노출 | GEMINI.md 토큰 ~30% 절감, AI Partnership 강화 | flag `hasMcpResourcesTools` 노출 | **v2.1.0 plan refresh** |
| **autoMemory scratchpad** | 메모리 추출기 turns -16.7%, precision +32.7% (v0.41.0 평가) | extractor 효율 향상 | flag `hasAutoMemoryToggle` 노출 | **v2.1.0 implementation** |
| **tools.core allowlist** | 21 agent 명령 카탈로그 명시 → 보안 강화 | recursive validation 회귀 차단 + 명시 보안 정책 | flag `hasToolsCoreAllowlist` 노출 | **보안 강화 cycle (~1d)** |
| **`--session-id <uuid>` flag** | baseline runner 디버깅/재현 UX | 트러블슈팅 효율 ↑ | flag `hasSessionIdFlag` 노출 | **v2.1.0 implementation** |
| **부팅 perf 8s → 1.4s** | 자동 적용 | 사용자 즉시 체감 | 자동 — 별도 작업 없음 | — |
| **`gemini mcp list` ping fix** | 자동 적용 | bkit MCP 검증 안정성 | 자동 | — |
| **YOLO fail-closed (B1)** | 보안 향상 (default → BLOCK) | bkit-permissions 정합성 | flag `hasYoloFailClosed` 노출 | — |
| **settings.json env auto-cast** | bkit 미사용이지만 향후 활성 시 안전 | 자동 — type 검증 통과율 ↑ | flag `hasSettingsEnvCast` 노출 | — |
| **telemetry logPrompts fix (v0.40.1)** | bkit telemetry 미사용 → 미래 활성 시 자동 안전 | privacy 강화 | 자동 | — |

---

## 6. 위험 관리 계획

### 6.1 리스크 매트릭스 (Top 5)

| ID | 리스크 | 가능성 | 영향 | 완화책 | 잔존 위험 |
|----|--------|-------|------|--------|----------|
| **R9** | **21 agent 스모크에서 PR #25720 차단 발견 (v0.41.x 신규)** | LOW–MED | MED–HIGH | **W2.5 스모크 21/21**. 회귀 1건이라도 발견 시 회귀 분석 cycle 진입 | LOW (스모크로 차단) |
| R5 | 누적 갭 hidden regression — pass 1925/2032 미달 | LOW–MED | LOW | W2.6 full baseline + W2.7 카나리아 PASS | LOW |
| R4 | v0.42.0-preview가 본 cycle 작업 중 출시 | LOW | MED | W1만 즉시 머지, W2/W3 흡수. v0.41.1 hotfix 직후이므로 ~2주 여유 | LOW |
| R7 | tc113 / tc107 파일 부재 발견 (v0.39.0/v0.39.1 cycle 누락) | LOW | MED | W2.1 find 실측. 부재 시 별도 P1 부채 등록 | LOW |
| R1 | topic narration default-on 미차단 시 baseline noisy stdout 회귀 | MED | LOW | W1.3 + W2.2 L3 1회 실측 | LOW |

**전체 위험도**: **LOW** (Critical 0건, R9가 신규 가장 큰 위험이지만 1h 스모크로 차단).

### 6.2 21 Agent 회귀 스모크 절차 (W2.5)

1. 21개 agent 목록 추출: `find agents -name "*.md" -exec grep -l "tier: FULL\|allowed-tools.*run_shell_command" {} +`
2. 각 agent별 1개 샘플 명령 정의 (`run_shell_command(ls)`, `run_shell_command(pwd)`, `run_shell_command(git status)` 등)
3. bkit MCP `spawn_agent`로 호출 + 1개 샘플 명령 실행
4. v0.41.1 정책 통과 + 실행 결과 기록
5. 21/21 PASS → W2.6 진행. 실패 1건이라도 → 본 cycle 일시 중단 + 회귀 분석 cycle 진입.

**Fallback**: 시간 압박 시 샘플 5개 (cto-lead, qa-strategist, bkend-expert, code-analyzer, pm-discovery) 만 검증.

### 6.3 롤백 전략 (4단계)

| 레벨 | 트리거 | 절차 |
|------|-------|------|
| **L1** (코드) | 파일 수정 후 unit fail | `git revert <commit-sha>` — 모든 변경 atomic |
| **L2** (사용자 환경) | `~/.gemini/settings.json` user-scope으로 narration 복구 | `general.topicUpdateNarration: true` 또는 미설정 |
| **L3** (CLI 다운그레이드) | v0.41.x stable 자체 회귀 발견 | `npx --yes @google/gemini-cli@0.39.1` — testedVersions 0.39.1 유지 보장 |
| **R9 회귀** (21 agent 스모크 실패) | Wave 2.5 회귀 1건 이상 | Wave 1 commit 직전 되돌림 + 회귀 분석 cycle 진입 |

### 6.4 회귀 모니터링 (Wave 2.6)

- **Pre-baseline**: v0.39.1 cycle close 시점 pass count = 1925/2032
- **AC**: `node tests/run-all.js` pass >= 1925 (v0.39.1 baseline 회복)
- **fail/skip 분포**: v0.39.1 cycle report와 동일해야 함 (107 fail/skip = 사전 부채 83건 + skip 24건)

---

## 7. 다음 단계 트리거

본 cycle close 후 진입할 별도 cycle (우선순위 순):

| Cycle | 진입 조건 | 위임 항목 | 예상 시간 |
|-------|----------|---------|---------|
| **v2.1.0 plan refresh** | 본 cycle close 직후 (1주 이내) | Section 4/5/6/9 갱신, MCP resources PoC 후보 등록, namespace docs, autoMemory 검토, tools.core 카탈로그 후보 | ~1d |
| **v2.1.0 implementation** | v2.1.0 plan refresh close 후 | MCP resources PoC + autoMemory 옵트인 + `--session-id` 채택 | ~3–5d |
| **v0.42.0 / next stable** | v0.42.0 stable 출시 시 | Wave 1만 즉시 머지 + Wave 2/3 흡수 | ~3–4h |
| **bkit-baseline-stabilization** | 사전 부채 83건 처리 결정 시 | PDCA-* 35 + TC80-* 9 + COMP-* 7 + 기타 29건 | ~1–2주 |
| **onboarding UX** | 신규 사용자 onboarding 강화 결정 시 | `GEMINI_CLI_TRUSTED_FOLDERS_PATH` + bootstrap-trust 자동화 | ~1–2d |
| **보안 강화** | tools.core allowlist 채택 결정 시 | 21 agent run_shell_command 카탈로그 + recursive validation 검증 | ~1d |

---

## 8. 참고 자료

### 8.1 본 cycle 산출물

- **Phase 1 Research (v0.41.1 신규)**: `docs/01-plan/research/gemini-cli-v0.41.1-research.md` (31KB, 381 lines)
- **Phase 2 Impact (v0.41.1 신규)**: `docs/03-analysis/gemini-cli-v0.41.1-impact.analysis.md` (30KB, 324 lines)
- **Phase 3 Plan (v0.41.1)**: `docs/01-plan/features/gemini-cli-v0.41.1-migration.plan.md` (39KB, 491 lines)
- **Phase 4 Report (본 문서)**: `docs/04-report/gemini-cli-v0.41.1-migration.report.md`

### 8.2 v0.40.0 cycle 산출물 (흡수 대상, superseded)

- `docs/01-plan/research/gemini-cli-v0.40.0-research.md` (Field Verification 정정 박스 포함)
- `docs/03-analysis/gemini-cli-v0.40.0-impact.analysis.md`
- `docs/01-plan/features/gemini-cli-v0.40.0-migration.plan.md` ← **본 plan으로 superseded**
- `docs/04-report/gemini-cli-v0.40.0-migration.report.md` ← **본 report로 superseded**

### 8.3 이전 cycle Plan (Strategy B' family, 학습 누적)

- v0.39.1 (9th): `docs/01-plan/features/gemini-cli-v0.39.1-migration.plan.md`
- v0.39.0 (8th): `docs/01-plan/features/gemini-cli-v0.39.0-migration.plan.md`
- v0.38.2 (7th): `docs/01-plan/features/gemini-cli-v0.38.2-migration.plan.md`

### 8.4 v2.1.0 plan + bkit 철학

- `docs/01-plan/features/v2.1.0-context-optimization.plan.md` (Section 4/5/6 trigger 메모만 갱신)
- `bkit-system/philosophy/{core-mission,ai-native-principles,context-engineering,workflow-philosophy}.md` (4대 원칙)

### 8.5 Gemini CLI 공식 출처

- **Repo**: `google-gemini/gemini-cli`
- **v0.41.1 release**: https://github.com/google-gemini/gemini-cli/releases/tag/v0.41.1
- **v0.41.0 release**: https://github.com/google-gemini/gemini-cli/releases/tag/v0.41.0
- **v0.40.1 release**: https://github.com/google-gemini/gemini-cli/releases/tag/v0.40.1
- **v0.40.0 release**: https://github.com/google-gemini/gemini-cli/releases/tag/v0.40.0
- **PR #25720** (recursive shell + tools.core): bkit B2 핵심 위험원
- **PR #25935** (YOLO fail-closed): B1
- **PR #26060** (`--session-id`): B3
- **PR #25409** (ContextManager): B4
- **PR #25758** (slow boot fix): 자동 적용 긍정 효과
- **PR #26068** (mcp list ping fix): 자동 적용 긍정 효과
- **PR #26153** (logPrompts fix, v0.40.1 cherry-pick): 보안

---

## 9. 승인 체크리스트 (Do 진입 전)

### 9.1 Plan 자체 검토

- [ ] **D1 (Strategy B')** 채택 — 가중 점수 8.00, 1순위
- [ ] **D2 (MCP resources 분리)** 동의 — v2.1.0 plan refresh 별도 cycle
- [ ] **D3 (v2.1.0 plan trigger 메모만)** 동의
- [ ] **D4 (testedVersions 누적)** 동의
- [ ] **D5 (사전 부채 미처리)** 동의
- [ ] **D6 (21 agent 전체 스모크)** 동의 — fallback 5개 옵션 인지

### 9.2 작업 시간 가용성

- [ ] **4.5–5h 가용 시간** 확보 (Wave 1 30분 + Wave 2 3–3.5h + Wave 3 1h + Buffer 30분)
- [ ] full baseline 30–60분 실행 환경 (네트워크 + Gemini API 할당량)
- [ ] 21 agent 스모크 60분 실행 환경 (Gemini API rate limit 고려)

### 9.3 v0.40.0 cycle 흡수 정책

- [ ] v0.40.0 plan을 superseded 처리하고 본 plan으로 통합 동의
- [ ] v0.40.0 cycle Phase 1/2 산출물은 그대로 보존
- [ ] PR commit message에 `feat(v2.0.7): Gemini CLI v0.39.1→v0.41.1 cumulative migration + 21 agent smoke + spot verification` 포맷 동의

### 9.4 위험 수용

- [ ] **R4** (v0.42.0 출시 충돌) — Wave 1만 즉시 머지 + W2/W3 흡수 정책 동의
- [ ] **R7** (tc113/tc107 부재 발견) — 별도 P1 부채 등록 + 본 cycle 진행 차단 안 함 동의
- [ ] **R9** (21 agent 스모크 회귀 발견) — 본 cycle 일시 중단 + 회귀 분석 cycle 진입 동의

### 9.5 Phase 4 Do 진입 준비

- [ ] /gemini-migration SKILL.md Phase 4 절차 숙지 (Wave 1 → Wave 2 → Wave 3 순차)
- [ ] PR commit message 포맷 결정
- [ ] 본 cycle close 후 v2.1.0 plan refresh cycle 진입 알림 시점 결정

---

## 10. 본 보고서 close 후 다음 액션

1. **사용자 승인 (D1~D6)** — 9.1 체크리스트 6개 결정 항목 확인
2. **Phase 4 Do 진입** — Wave 1 → Wave 2 → Wave 3 순차 실행
3. **PR 생성** — 단일 PR (v0.40.0 cycle 흡수). commit message: `feat(v2.0.7): Gemini CLI v0.39.1→v0.41.1 cumulative migration + 21 agent smoke + spot verification`
4. **메모리 갱신** — v0.41.1 Strategy B' 11번째 적용 학습 기록
5. **v2.1.0 plan refresh cycle 진입 알림** — close 직후 메인 세션에서 트리거 검토

---

**Status**: ✅ Phase 1~4 완료. **Do (구현) 단계 진입 대기 중**.
