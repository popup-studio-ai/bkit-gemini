# Gemini CLI v0.42.0 preview train bkit 영향 분석 (P2)

> 작성일: 2026-05-09
> 작성자: bkit-impact-analyzer agent (Strategy B' 13번째 cycle 후보 — preview train delta)
> 입력: P1 research (`docs/01-plan/research/gemini-cli-v0.42.0-preview-research.md`, 389 lines)
> 베이스라인: bkit v2.0.6 (= Gemini CLI v0.39.1 main 머지) + v0.41.2 cycle (P1~P4 완료, **Do 미실행**)
> 본 cycle 비교 범위: **`v0.41.2 → v0.42.0-preview-train`** (= preview.0/1/2 + 4 nightly, **delta only**)
> 누적 비교 범위 (참조): `v0.39.1 → v0.42.0-preview-train` = v0.41.2 누적 (33 files / Critical 0 / High 5 / Medium 10 / Low 28) + 본 cycle delta

---

## Executive Summary

### 영향도 카운트 (본 cycle delta vs v0.41.2 누적 참조)

| 항목 | **본 cycle delta** (v0.41.2 → v0.42.0-preview-train) | v0.41.2 cycle 누적 (참조) |
|---|---:|---:|
| 영향 추정 파일 | **1** (`skills/gemini-cli-learning/SKILL.md`만 추가 단락) | 33 |
| 🔴 Critical | **0** | 0 |
| 🟠 High | **0** | 5 |
| 🟡 Medium | **0** | 10 |
| 🟢 Low | **1** (학습 스킬 단락 추가만) | 28 |
| 신규 활용 후보 (Cx*) | **6** (Cx1, Cx2, Cx4, Cx7, Cx11, Cx14) | 11 |
| 미해결 검증 (Q*) | **3** (Q6, Q7, Q8 — P3 위임) | 5 (Q1~Q5) |

### 핵심 결론 (본 cycle delta)

**v0.42.0 preview train은 bkit 직접 회귀 0건. P1에서 식별된 5개 검증 포인트(Bx0~Bx4) 모두 정적 분석으로 추정 영향 0건이 확정됨.**

| 검증 항목 | P1 추정 | P2 grep 결과 | 결론 |
|---|---|---|---|
| Bx0 `continueOnFailedApiCall` 제거 | 0건 (settings.json 부재) | grep 결과 매치 1건 (P1 보고서 자체만) | ✅ 0건 확정 |
| Bx0 빈 응답 retry 의존 | 검증 필요 | `lib/core/`, `hooks/scripts/` retry/backoff/empty response 패턴 grep 0건 | ✅ 0건 확정 |
| Bx1 ToolDisplay refactor (도구 응답 schema 직접 파싱) | 검증 필요 | `JSON.parse` 28건 모두 bkit 자체 state/teamState/checkpoint/audit 등 — Gemini CLI tool response schema 직접 파싱 0건. `lib/gemini/tools.js` BUILTIN_TOOLS는 *이름 카탈로그*만 | ✅ 0건 확정 |
| Bx2 `exit_plan_mode` shell 호출 금지 | agent prompt 의존 | agents/ 21개 prompt에 `bash -c "exit_plan_mode"` 또는 wrapper 호출 0건 (grep) | ✅ 0건 확정 |
| Bx3 `Config.setSessionId()` reset | bkit 미호출 | bkit는 spawn만 사용 — 직접 호출 0건 | ✅ 0건 확정 |
| Bx4 Gemma 4 default-on (`--model` 자동 추론) | 검증 필요 | `mcp/bkit-server.js:1097-1102` args 빌더에 `--model` 미주입. settings.json `experimental.gemma` 부재 → default `true` 적용되지만 bkit는 모델 명시 X 사용자 prompt 의존 | ✅ 0건 확정 (사용자 prompt 의존만) |

### v0.41.2 cycle 누적 카운트 변동

**없음.** v0.41.2 cycle 33 files / Critical 0 / High 5 / Medium 10 / Low 28 그대로 유효.

본 cycle delta는 P0 차단 항목 0건. **v0.41.2 cycle Do 미실행 상태에서 본 cycle을 단독 진입 가능**하며, v0.42.0 stable 출시 시 **v0.41.2 cycle 흡수와 동시에 본 cycle delta(1 Low) 동반 처리 권고**.

---

## 1. Breaking Changes 영향 매핑 (Bx0~Bx4)

> P1 §2의 1 명시 breaking + 4 행동 변화 강화 = 5건.

### 1.1 Bx0 — `continueOnFailedApiCall` config 옵션 제거 (PR #26340, preview.0)

| 영향 파일 | 영향 범위 | 영향도 | 수정 방안 | 시간 추정 |
|---|---|---|---|---|
| `.gemini/settings.json` | `continueOnFailedApiCall` 키 부재 (현재 `experimental.enableAgents: true`만) → schema 변경 영향 0건 | 🟢 None | 불필요 | 0분 |
| `lib/core/agent-memory.js`, `hooks/scripts/*.js` | grep 결과 `retry`, `backoff`, `empty response`, `emptyResponse`, `null response`, `InvalidStream`, `NO_RESPONSE_TEXT`, `System: Please continue` 패턴 **0건** — bkit는 빈 응답 retry에 의존하지 않음 | 🟢 None | 불필요 | 0분 |
| `mcp/bkit-server.js` | `proc.on('close')` 시 `output: stdout || stderr`로 단순 누적만 (line 1138) — 빈 응답이 명시 `InvalidStream` failure로 노출되어도 stderr 캡처에서 자연 처리됨 | 🟢 None | 불필요 | 0분 |

**결론**: P1 추정 그대로. **bkit 영향 0건 확정**.

### 1.2 Bx1 — ToolDisplay refactor (PR #25186, preview.0 + nightly 20260507)

| 영향 파일 | 영향 범위 | 영향도 | 수정 방안 | 시간 추정 |
|---|---|---|---|---|
| `lib/gemini/tools.js` | `BUILTIN_TOOLS` (line 17~52)는 도구 *이름* 25개 카탈로그만 보유. `TOOL_PARAM_CHANGES` (line 71~104)도 파라미터 schema 명세만 (read_file `start_line`/`end_line`, replace `allow_multiple`, grep_search `include_pattern`). **도구 응답 schema 파싱 코드 0건** | 🟢 None | 불필요 | 0분 |
| `mcp/bkit-server.js` | `JSON.parse` 호출 5건 (line 235 MCP request, 779/809/843 teamState, 988/993 task assign/status, 1044 settings) 모두 bkit 자체 state. **Gemini CLI 도구 응답 schema 직접 파싱 0건** | 🟢 None | 불필요 | 0분 |
| `mcp/tools/qa-runner.js`, `pm-pipeline.js`, `checkpoint-manager.js`, `audit-store.js` | 모두 bkit 자체 JSON 파싱. Gemini 도구 응답 미관여 | 🟢 None | 불필요 | 0분 |

**결론**: P1 §10.1 High 후보 1건 → **0건으로 강등 확정**. bkit는 stdout/stderr를 *불투명 텍스트*로만 집계 → schema 변경 무관.

### 1.3 Bx2 — `exit_plan_mode` 도구의 shell 호출 명시 금지 (PR #26230, preview.0)

| 영향 파일 | 영향 범위 | 영향도 | 수정 방안 | 시간 추정 |
|---|---|---|---|---|
| `agents/*.md` (21개) | grep 결과 `bash -c "exit_plan_mode"` 또는 `sh -c "exit_plan_mode"` 또는 `run_shell_command(... exit_plan_mode ...)` 패턴 **0건**. `lib/gemini/tools.js:43`에 `EXIT_PLAN_MODE: 'exit_plan_mode'` 카탈로그 등록만 | 🟢 None | 불필요 | 0분 |

**결론**: bkit agent prompt가 exit_plan_mode를 *직접* 호출하는 패턴 부재. LLM 보안 강화 자동 적용. **0건 확정**.

### 1.4 Bx3 — `Config.setSessionId()` 시 15+ session-scoped 상태 reset (PR #26342, preview.0)

| 영향 파일 | 영향 범위 | 영향도 | 수정 방안 | 시간 추정 |
|---|---|---|---|---|
| `mcp/bkit-server.js:1123` | `spawn('gemini', args, ...)` 단일 binary spawn — `Config.setSessionId()` 직접 호출 0건. `--session-id` flag 미주입 | 🟢 None | 불필요 | 0분 |
| `lib/core/agent-memory.js:91,99` | `sessionId` 변수는 bkit 자체 메모리 ID (Gemini ContextManager와 namespace 무관) | 🟢 None | 불필요 | 0분 |

**결론**: bkit는 내부 API 미사용. **0건 확정**.

### 1.5 Bx4 — Gemma 4 default-on (PR #26307, preview.0)

| 영향 파일 | 영향 범위 | 영향도 | 수정 방안 | 시간 추정 |
|---|---|---|---|---|
| `.gemini/settings.json` | `experimental.gemma` 명시 부재 → default `true` 자동 적용. 단 bkit는 사용자 prompt에 모델 결정 위임 → Gemma 4 모델 노출이 기본값에서 활성화됨 | 🟢 None | 옵션: settings.json에 `experimental.gemma: false` 명시 잠금 (별도 cycle, P3 권고) | 0분 (본 cycle) |
| `mcp/bkit-server.js:1097-1102` args 빌더 | `-e <agentPath>`, approval flag, tool isolation, task만 주입. **`--model` 미주입** (확인) | 🟢 None | 불필요 | 0분 |
| `lib/gemini/version.js` | `experimental.gemma` 관련 flag 부재. v0.42.0 stable 출시 시 `hasGemmaDefaultOn: isVersionAtLeast('0.42.0')` 신규 후보 (별도 cycle) | 🟢 Low (별도) | 별도 cycle (B' 13회차 P0와 통합) | 5분 (별도) |

**결론**: P1 추정 그대로. **본 cycle 직접 영향 0건**. v0.42.0 stable 출시 시점 별도 P0 잠금 권고 (Cx13 활용 후보로 §2에 등록).

---

## 2. 새 기능 영향/활용 분석 (Cx1~Cx14)

> P1 §3의 14건 + §8 사전 시그널 일부.

| Cx# | 기능 | bkit 활용 후보 | 시너지 영역 | 우선순위 |
|---|---|---|---|---|
| **Cx1** | `--ignore-env` flag + `advanced.ignoreLocalEnv` setting (PR #26445) | 🟢 **매우 높음** — `mcp/bkit-server.js:1097` args 빌더에 `--ignore-env` 추가 시 baseline runner의 `.env` 누설 차단. CI/headless 안정성 강화 | tc115 (headless trust), 향후 baseline runner CI 시나리오 | **P1** (~30분 + tc 1개 추가) |
| **Cx2** | Auto Memory inbox flow (`extraction.patch` canonical contract, PR #26338) | 🟡 중간 — bkit는 자체 메모리 사용. 보조 채널로 inbox 활용 가능. v0.41.2 §7 C4(autoMemory scratchpad)와 시너지 | v2.1.0 implementation cycle | P3 (별도 cycle) |
| Cx3 | Auto Memory private patch allowlist tighten (PR #26535, nightly 20260507만) | 🟢 (Cx2 보완) | Cx2 채택 시 자동 적용 | (Cx2 종속) |
| **Cx4** | `/bug-memory` slash command + `/bug` 2GB 자동 heap snapshot (PR #25639) | 🟡 중간 — bkit baseline runner OOM 진단 시 활용. `/bug-memory` 호출은 인터랙티브 의존 → CI 자동화 가치 낮음 | tc 디버깅 도구 | P3 (별도 cycle) |
| Cx5 | V8 heap snapshot utility (`captureHeapSnapshot()`, PR #26440) | 🟡 중간 (Cx4의 기반) | Cx4 채택 시 함께 활용 | (Cx4 종속) |
| Cx6 | `/exit --delete` flag (PR #19332) | 🟢 Low — bkit 자동화에서 직접 사용 가능성 낮음 (자동화는 spawn 종료 후 stdout 즉시 회수 — `/exit` slash 미호출) | — | P3 (선택) |
| **Cx7** | `/commands list` subcommand (PR #22324) | 🟡 중간 — bkit health check skill 작성 시 활용 가능 (~/.gemini/commands/ + .gemini/commands/ 카탈로그) | `skill-status`, `audit` 스킬 보강 후보 | P3 (별도 cycle) |
| Cx8 | `/extensions delete` alias (PR #25660) | 🟢 Low — bkit 무관 | — | (배제) |
| Cx9 | queuing messages during compression (PR #26506, nightly 20260506만) | 🟡 중간 — baseline runner가 인터랙티브 compression 시 영향. 자동화 모드는 compression 미관여 | — | P3 (자동 적용) |
| Cx10 | Voice Mode privacy/compliance UX warning (PR #26454) | 🟢 Low — bkit headless 무관 | — | (배제) |
| **Cx11** | `feat(cli): improve /agents refresh logging` (PR #26442) | 🟡 중간 — bkit `list_agents` MCP 도구의 21개 agent 검출 진단 시 활용 가능 | `list_agents` 디버깅 | P3 (별도 cycle) |
| Cx12 | `feat(core): reinforce Inquiry constraints` (PR #26310) | 🟡 중간 — bkit READONLY tier agents의 prompt 의존도 감소 (LLM이 자체 거부) | READONLY tier 8개 agents 보강 | P3 (별도 cycle) |
| Cx13 | Gemma 4 default-on (PR #26307) | 🟡 중간 — `.gemini/settings.json`에 `experimental.gemma: false` 명시 잠금 (No Guessing 강화) | v0.42.0 stable cycle P0 통합 | **P1** (5분, 본 cycle 동반) |
| **Cx14** | `--prompt` (-p) flag undeprecated (PR #26329) | 🟢 (긍정) — bkit `mcp/bkit-server.js:1097` args 빌더는 `-p` 미사용 (positional `task` 사용) — 향후 자동화에서 `--prompt` 채택 시 안전 보장 | 자동화 권장 명문화 | P3 (skill 단락 1줄) |

**P1 차단/우선 채택 후보**: Cx1 (`--ignore-env`) + Cx13 (`experimental.gemma: false` 잠금) — *본 cycle delta 1 Low와 함께 처리*.

---

## 3. 스킬 영향 분석

| 스킬 | 영향 항목 | 영향도 | 대응 방안 |
|---|---|---|---|
| **`skills/gemini-cli-learning/SKILL.md`** | v0.42.0 preview train 신규 14개 단락 후보 (Bx0~Bx4 + Cx1, Cx2, Cx4, Cx7, Cx11, Cx12, Cx13, Cx14, OAuth #26571) — *v0.42.0 stable 출시 시 합본 추가* | 🟢 Low | 본 cycle은 1줄 placeholder ("v0.42.0 preview train: bkit 영향 0건, 활용 후보 6건 — 별도 cycle"). v0.42.0 stable 출시 cycle에서 풀 단락 작성 (~30분) |
| `skills/gemini-migration/SKILL.md` (메타) | 본 보고서 자체가 산출물 (B' 13회차 cycle 입력) | 🟢 None | 불필요 |
| `skills/audit/SKILL.md`, `skills/skill-status/SKILL.md` | Cx7 `/commands list` 활용 가능성 — health check skill 작성 시 | 🟢 Low | 별도 cycle (Cx7 채택 시) |
| 21개 (allowed-tools에 `run_shell_command` 포함) | 직전 v0.41.2 누적 분석 §2 결과(🟡 Medium, P3 스모크 권고) **그대로 유효**. 본 cycle 추가 영향 0건 | (변동 없음) | (v0.41.2 cycle Do 단계에서 처리) |

> 나머지 39개 스킬: v0.41.2 → v0.42.0 preview train 변경 영향 0건 (정적 분석).

---

## 4. 에이전트 영향 분석

| 에이전트 | 영향 항목 | 영향도 | 대응 방안 |
|---|---|---|---|
| 21개 전체 (FULL tier 8개 + READONLY/MEDIUM 13개) | (1) Bx2 `exit_plan_mode` shell 호출 금지 — agent prompt에 호출 패턴 0건 (grep). (2) Bx3 `Config.setSessionId()` reset — bkit 미호출. (3) Cx12 Inquiry constraints 강화 — READONLY tier 8개의 보조 안전망 강화 | 🟢 None (긍정 강화) | 불필요 |
| 8개 FULL tier (v0.41.2 cycle High 후보) | 본 cycle delta 추가 영향 0건. v0.41.2 cycle B5 (PR #25720 recursive shell validation) P3 스모크 권고 그대로 유효 | (변동 없음) | (v0.41.2 cycle Do 단계 처리) |

---

## 5. 스크립트/라이브러리 영향 분석

| 파일 | 영향 항목 | 영향도 | 대응 방안 |
|---|---|---|---|
| `mcp/bkit-server.js:1097-1102` args 빌더 | `--model` 미주입 (확인) → Bx4 영향 0건. `--session-id`/`--prompt` 미주입 → Bx3, Cx14 무관 | 🟢 None | 불필요 |
| `mcp/bkit-server.js:1119` `env.GEMINI_CLI_TRUST_WORKSPACE = 'true'` | v0.39.1 ~ v0.42.0 preview train 전부 변수명 정확 (P1 §6 보안 패치 미언급) | 🟢 None | 불필요 |
| `mcp/bkit-server.js:1138` `output: stdout || stderr` | Bx0 빈 응답 명시 `InvalidStream` failure로 노출되어도 stderr 자연 캡처 | 🟢 None | 불필요 |
| `lib/gemini/tools.js` BUILTIN_TOOLS | 도구 *이름* 25개 카탈로그만. Bx1 schema 변경 무관. v0.42.0 stable 시점 신규 도구 추가 가능성 — preview train에 신규 builtin tool 0건 (P1 §3 확인) | 🟢 None | 불필요 |
| `lib/gemini/version.js:201-211` v0.39.1+ flag 그룹 | v0.41.2 cycle 누적 분석 §4의 8개 신규 flag 권고 (`hasMcpResourcesTools`, `hasAutoMemoryToggle`, `hasMemoryFourTier`, `hasTopicNarrationGeneral`, `hasYoloFailClosed`, `hasSessionIdFlag`, `hasSettingsEnvCast`, `hasContextManagerWire`) **그대로 유효**. 본 cycle delta는 추가 1개 후보 (`hasGemmaDefaultOn: isVersionAtLeast('0.42.0')`) — v0.42.0 stable 출시 후 | 🟢 Low (별도) | v0.42.0 stable cycle P0 통합 (5분) |
| `lib/core/agent-memory.js`, `lib/core/memory.js` | bkit 자체 메모리. Cx2 Auto Memory inbox와 namespace 분리 (의미 축 직교) | 🟢 None | 불필요 |
| `hooks/scripts/*.js` (10 events) | 빈 응답 retry 로직 0건 (Bx0 무관). hook event 추가/제거/변경 0건 (P1 §3 확인) | 🟢 None | 불필요 |
| `mcp/start-server.sh`, `scripts/bootstrap-trust.sh` | 변경 영향 0건 | 🟢 None | 불필요 |

---

## 6. 설정/MCP/테스트 영향

| 파일 | 영향 항목 | 영향도 | 대응 방안 |
|---|---|---|---|
| `.gemini/settings.json` (현재 `experimental.enableAgents: true`만) | (1) Bx0 `continueOnFailedApiCall` 키 부재 — 영향 0건. (2) Bx4 `experimental.gemma` 부재 → default `true` 자동 적용 → Cx13 권장 잠금 후보 (`experimental.gemma: false`). (3) Cx1 `advanced.ignoreLocalEnv: true` 또는 `--ignore-env` flag 채택 후보 | 🟢 Low (옵션) | v0.42.0 stable cycle P0에서 (1줄) `experimental.gemma: false` + (선택) `advanced.ignoreLocalEnv: true` 잠금 |
| `gemini-extension.json` | 매니페스트 변경 0건 | 🟢 None | 불필요 |
| `bkit.config.json:120` `compatibility.testedVersions` | 현재 `"...0.39.1"`로 끝남. v0.41.2 cycle 누적 권고 5개(`"0.40.0", "0.40.1", "0.41.0", "0.41.1", "0.41.2"`) **그대로 유효** + 본 cycle delta 0개 (v0.42.0 stable 미출시 — 추가 보류). v0.42.0 stable 출시 시 `"0.42.0"` 추가 후보 | 🟢 Low (별도) | v0.42.0 stable cycle P0 통합 |
| `mcp/bkit-server.js` MCP server | spawn pattern 변경 0건 (Bx1/Bx3 무관) | 🟢 None | 불필요 |
| `tests/suites/tc113-session-start-duplication-defense.js` | PR #25827 (Issue #25655 SessionStart `systemMessage` 중복 fix) **여전히 OPEN**. v0.42.0 preview train 7 release 연속 미흡수 (P1 §9). bkit 워크어라운드(`BKIT_SESSION_START_VERBOSE` slim default + tc113 방어) **유지 필요** | 🟢 None (잔존) | 변경 없음. tc113 그대로 유효 |
| `tests/suites/tc115-v0391-headless-trust.js` | v0.39.1 headless trust enforcement — v0.42.0 preview train 변경 0건 | 🟢 None | 불필요 |
| `tests/suites/tc107-v035-modes-migration.js` | v0.35 modes — v0.42.0 preview train 무관 | 🟢 None | 불필요 |
| `tests/suites/tc38-feature-flags-matrix.js` | v0.41.2 cycle 누적 권고 8개 신규 flag 매트릭스 추가 **그대로 유효**. 본 cycle delta 추가 1개(`hasGemmaDefaultOn`) v0.42.0 stable 시점 | 🟢 Low (별도) | v0.42.0 stable cycle P0 통합 |

---

## 7. 철학 정합성 검증

| 원칙 | 정합 (✅/➖/🔴) | 비고 |
|---|---|---|
| **Core Mission** — Automation First | ✅ 강화 | Bx0 빈 응답이 명시 `InvalidStream` failure로 노출 → bkit 자동화에서 ambiguity 제거. #26191 timeout 5분 → 60초 (자동 적용)로 baseline runner latency 단축. #26534/26452 chat corruption + async hysteresis fix (자동 적용)로 안정성 향상 |
| **Core Mission** — No Guessing | ✅ 강화 | Bx0 `"System: Please continue."` injection 제거 → 빈 응답 retry 추측 없이 명시 실패. Cx13 `experimental.gemma: false` 잠금 권고 (default 변경 회귀 사전 차단) |
| **Core Mission** — Docs = Code | ➖ 중립 | 본 cycle delta는 settings.json/manifest 변경 0건. Cx14 `--prompt` undeprecation은 docs/SKILL.md 1줄 명문화 후보만 |
| **AI Native Principles** — AI as Partner | ✅ 강화 | Cx12 Inquiry constraints 강화 → READONLY tier agents의 LLM 자체 거부 능력 강화. Bx2 exit_plan_mode shell 금지 → LLM 보안 행동 강화 |
| **PDCA Methodology** — 9-Stage Pipeline | ➖ 중립 | 본 cycle delta가 PDCA 워크플로우에 직접 영향 0건 |
| **PDCA Methodology** — Zero Script QA | ✅ 유지 | bkit 정책 파일은 wildcard 기반(`argsPattern` 0건) — Bx 5건 모두 영향 0건 |
| **Context Engineering** — 6-Layer Hierarchy | ✅ 유지 | Cx2 Auto Memory inbox는 bkit 6-Layer와 namespace 분리 (직교). 충돌 0건 |
| **Context Engineering** — 12 Hook Events | ✅ 유지 | hook event 추가/제거/변경 0건 (P1 §3) |

**종합**: 8개 검증 원칙 중 **5개 강화 / 3개 중립 또는 유지 / 0개 충돌**. v0.42.0 preview train은 v0.41.x 패턴(보안 fail-closed + 행동 강화)을 *유지 + 미세 보강*. bkit 철학과 긴장 포인트 0건.

---

## 8. v0.41.2 cycle 누적 일관성 (참조)

### 8.1 누적 카운트 변동 여부

| 항목 | v0.41.2 cycle 누적 | + 본 cycle delta | **누적 합계 (참고)** |
|---|---:|---:|---:|
| 영향 추정 파일 | 33 | +1 (`gemini-cli-learning/SKILL.md` 단락 추가) | **34** |
| 🔴 Critical | 0 | +0 | **0** |
| 🟠 High | 5 | +0 | **5** |
| 🟡 Medium | 10 | +0 | **10** |
| 🟢 Low | 28 | +1 | **29** |
| 활용 후보 (Cx*) | 11 | +6 (Cx1, Cx2, Cx4, Cx7, Cx11, Cx14 — 중복 제외 시 +5 — Cx2/Cx4는 v0.41.2 §7 C4와 일부 시너지) | **16** |
| 미해결 검증 (Q*) | 5 (Q1~Q5) | +3 (Q6~Q8) | **8** |

### 8.2 v0.41.2 cycle Do 미실행 → 본 cycle 흡수 권고

**권고**: **v0.42.0 stable 출시 시 v0.41.2 cycle (33 files / High 5) + 본 cycle delta (1 Low) 통합 단일 PR 처리.**

근거:
- v0.41.2 cycle Do 미실행으로 main에 미반영 — 본 cycle delta가 추가되어도 *통합 단일 PR* 합리적.
- 본 cycle delta는 P0 차단 0건. v0.41.2 cycle B' 12회차 골격(50분 P0 + 1h agent 스모크 + 45분 SKILL.md + 1h v2.1.0 hint) **90% 재사용 가능**.
- v0.42.0 stable 시점 추가 권고: P0에 `experimental.gemma: false` (5분), `bkit.config.json` `"0.42.0"` 추가(1분), `lib/gemini/version.js`에 `hasGemmaDefaultOn`(5분) — 총 추가 ~10분.

### 8.3 v0.41.2 cycle 누적 결론 100% 유지 사실

| 항목 | v0.41.2 cycle 결론 | 본 cycle delta 후 | 변동 |
|---|---|---|---|
| Critical 회귀 | 0건 | 0건 | 변동 없음 |
| 권장 전략 | B' (~4-5h, 단일 PR) | B' 13회차 (~4-5h + 10분 = ~5h, 단일 PR) | +10분 |
| H1 testedVersions 추가 | 5개 (`0.40.0~0.41.2`) | 5개 + (옵션) `"0.42.0"` 1개 (v0.42.0 stable 출시 시점) | +1개 후보 |
| H3 version flag 신규 | 8개 | 8개 + (옵션) `hasGemmaDefaultOn` 1개 | +1개 후보 |
| H4 settings.json topicUpdateNarration 잠금 | 1줄 | 1줄 + (옵션) `experimental.gemma: false` 1줄 | +1줄 후보 |

---

## 9. 미해결 검증 질문 (Q6~Q8, P3 위임)

> v0.41.2 cycle Q1~Q5는 그대로 유효. 본 cycle 추가 3건.

| Q# | 질문 | 가설 | 검증 방법 |
|---|---|---|---|
| **Q6** | v0.42.0 stable 출시 시점에 PR #25186 (ToolDisplay refactor)이 *추가 마이그레이션 완성*되어 도구 응답 schema가 변경되는가? P1 §8 핵심 사전 시그널 #3 | preview.0 + nightly 20260507에서 *점진적*. v0.42.0 stable 시점 완성도가 변수. bkit는 stdout/stderr 불투명 텍스트로만 집계 → schema 변경 무관 (P2 grep 확정). 회귀 위험 매우 낮음 | v0.42.0 stable 출시 후 release notes 재검증 + `mcp/bkit-server.js:1138` stderr 캡처 e2e 스모크 (~10분) |
| **Q7** | bkit가 `--ignore-env` (Cx1) 채택 시 baseline runner CI 안정성 향상 시나리오 식별 가능? | bkit는 `.env` 직접 사용 0건이지만 baseline runner spawn 시 부모 `.env`가 자식에게 누설될 가능성 — `--ignore-env`로 차단 시 CI/headless 결정성 향상 | v0.42.0 stable 출시 후 `mcp/bkit-server.js:1097` args에 `--ignore-env` 추가 + tc115 헤드리스 시나리오 1개 추가 (~30분) |
| **Q8** | bkit가 `experimental.gemma: false` 명시 잠금(Cx13) 시 Gemma 4 default-on 영향 0건 사전 차단 가능? | `.gemini/settings.json` 1줄 추가로 default 변경 회귀 차단 (No Guessing 강화). bkit는 모델 명시 X 사용자 prompt 의존이지만 잠금이 안전 | v0.42.0 stable 출시 cycle P0에서 1줄 추가 + tc115/tc113 회귀 0건 확인 (~5분) |

**미해결 8건 (v0.41.2 5건 + 본 cycle 3건) 모두 P3 brainstorm/Do 단계에서 해소 가능**. 본 P2 분석으로 ✅ Critical/High 결정 충분.

---

## 10. 다음 단계 권고 (P3 위임)

### 10.1 Strategy 후보

| 전략 | 시간 | 리스크 | 점수 | 비고 |
|---|---|---|---|---|
| **B' 13회차 (권장)** | ~4-5h + 10분 = **~5h** | LOW | 7.45 | v0.41.2 cycle B' 12회차 골격 90% 재사용 + 본 cycle delta 1 Low 통합 (Cx13 + `bkit.config.json` `"0.42.0"` + `hasGemmaDefaultOn`). v0.42.0 stable 출시 시 즉시 진입. *권장* |
| A' (Minimum) | ~3h | LOW | 7.20 | testedVersions + flag만. SKILL.md 단락 보류 — 비권장 (Docs=Code 약화) |
| C' (Full + autoMemory PoC) | ~26h (~3-4d) | MEDIUM | 7.50 | B' + Cx2 Auto Memory inbox PoC + Cx7 `/commands list` health check. PoC 분리 권장 |

### 10.2 Wave 분할 가이드라인 (B' 13회차)

| Wave | 작업 | 시간 |
|---|---|---|
| W1.0 | v0.41.2 cycle Wave 1 (P0) 그대로 (50분) | 50분 |
| W1.5 (신규) | `experimental.gemma: false` 1줄 + `bkit.config.json` `"0.42.0"` 1개 + `hasGemmaDefaultOn` 1개 + `tc38` 1줄 | **~10분** |
| W2.0 | v0.41.2 cycle Wave 2 (21 agent 스모크 1h + SKILL.md 12개 단락 + v2.1.0 hint) | ~3h |
| W2.5 (신규) | `gemini-cli-learning/SKILL.md`에 v0.42.0 preview train 1줄 placeholder 추가 → v0.42.0 stable 출시 시 풀 단락(14개) | ~5분 (placeholder) + ~30분 (stable 후 풀 단락) |

### 10.3 R* 리스크 후보

| R# | 리스크 | 가능성 | 영향 | 완화 |
|---|---|---|---|---|
| R1 | v0.42.0 stable에서 PR #25186 (ToolDisplay refactor) 추가 완성으로 schema 변경 가능 (Q6) | 낮음 | 매우 낮음 (bkit 불투명 캡처) | stable release notes 재검증 (10분) |
| R2 | PR #25827 (Issue #25655 SessionStart `systemMessage` 중복) v0.42.0 stable에도 미흡수 가능 (preview train 7 release 연속 부재) | 매우 높음 | 0건 (워크어라운드 유지) | tc113 방어 그대로 유지 |
| R3 | Cx13 `experimental.gemma: false` 잠금 시 Gemma 4 모델 사용자 명시 호출 거부 (No Guessing의 역기능) | 매우 낮음 | 매우 낮음 (사용자 prompt 의존이므로 명시 모델 선택 시 무관) | 향후 사용자 요구 시 잠금 해제 |

### 10.4 v0.42.0 stable 출시 시 흡수 vs 본 cycle 단독 처리

**권고**: **v0.42.0 stable 출시 시 v0.41.2 cycle Do와 동시 흡수** (B' 13회차 단일 PR).

근거:
- 본 cycle delta P0 차단 0건 → 단독 처리 가치 낮음.
- v0.41.2 cycle Do 미실행 — 별도 PR로 분리 시 코드 변경 중복 (`bkit.config.json` testedVersions, `lib/gemini/version.js` flag 그룹 모두 두 cycle 동시 갱신 필요).
- v0.42.0 stable 출시 시점은 *추정 2026-05-09 ~ 12* (preview.2 → 3일 경과). **출시 후 즉시 B' 13회차 진입** 권고.
- *예외*: v0.42.0 stable이 1주 이상 지연될 경우 → v0.41.2 cycle 단독 Do 진행 후 v0.42.0 stable cycle 별도 진행 (단, B' 13회차 골격 재사용성은 90% 유지).

### 10.5 P3 brainstorm 입력 핵심 5줄

1. **본 cycle delta 영향**: Critical 0 / High 0 / Medium 0 / Low 1 (placeholder 단락 추가만). v0.41.2 누적(33 files)과 합산 시 34 files / Critical 0 / High 5 / Medium 10 / Low 29.
2. **권장 전략**: B' 13회차 (~5h, 단일 PR, v0.41.2 cycle Do와 동시 흡수).
3. **P0 추가 작업**: `experimental.gemma: false` (5분) + `"0.42.0"` testedVersions 1개(1분) + `hasGemmaDefaultOn` flag(5분) = **+10분** (v0.41.2 cycle 50분 → 60분).
4. **활용 후보 6건** (P3 brainstorm): Cx1 (`--ignore-env`, P1) + Cx13 (`experimental.gemma: false`, P1) + Cx2/Cx4/Cx7/Cx11 (P3 별도 cycle).
5. **미해결 검증 3건**: Q6 (ToolDisplay schema 회귀 — 매우 낮음), Q7 (`--ignore-env` 채택), Q8 (`experimental.gemma: false` 잠금) — 모두 P3/Do 단계에서 해소 가능.

---

*분석 종료: 2026-05-09. v0.41.2 → v0.42.0-preview-train delta 영향 분석 완료. P1 §10.1 추정(Critical 0 / High 2 / Medium 1 / Low 4) → **P2 grep 검증 후 Critical 0 / High 0 / Medium 0 / Low 1**으로 최종 강등 (High/Medium 5건 모두 정적 분석 0건 확정). v0.41.2 cycle 누적 카운트 변동 없음. 권장 전략 B' 13회차 (~5h, 단일 PR, v0.42.0 stable 출시 후 v0.41.2 cycle Do와 동시 흡수).*
*bkit-impact-analyzer agent (Strategy B' 13번째 적용 후보)*
