# Gemini CLI v0.41.1 변경사항 조사 보고서

> bkit v2.0.6 (= Gemini CLI v0.39.1) → v0.41.1 stable 마이그레이션 Phase 1 산출물
> 작성일: 2026-05-06
> 조사자: gemini-researcher agent
> 비교 범위: `v0.39.1...v0.41.1` (= v0.40.0 + v0.40.1 + v0.41.0 + v0.41.1)
> 출처: GitHub Releases, gh API, PR 본문 직접 검증

---

## 0. Executive Summary

### 누적 릴리스 타임라인 (bkit baseline 이후)

| 버전 | published_at | 비고 |
|------|--------------|------|
| v0.39.1 | 2026-04-24 | bkit v2.0.6 머지된 baseline (이미 적용됨) |
| **v0.40.0** | 2026-04-28 | 72 commits, Memory 재편 + Headless Trust + MCP resources |
| **v0.40.1** | 2026-04-30 | patch (cherry-pick PR #26153) — telemetry `logPrompts` 누설 fix |
| **v0.41.0** | 2026-05-05 | 47 commits ahead of v0.40.0, **39개는 v0.41.0 신규**, Voice Mode + ContextManager + tools.core allowlist |
| **v0.41.1** | 2026-05-05 | patch (cherry-pick PR #26542) — YOLO/AUTO_EDIT 모드 redirection 회귀 fix |

### 통계 (이 보고서가 다루는 신규분만)

이 보고서는 v0.40.0 baseline 보고서(`docs/01-plan/research/gemini-cli-v0.40.0-research.md`)에 이미 정리된 v0.40.0 변경사항은 **재서술하지 않고 인용**한다. 본 보고서의 신규 카운트는 다음과 같다:

- **v0.40.1 patch**: 1 PR (security/telemetry)
- **v0.41.0 신규 (v0.40.0에 없던 commits 39개 중 user-facing)**: ~30개
- **v0.41.1 patch**: 1 PR (정책 회귀 fix)
- **카테고리 분포** (v0.41.x 신규 한정):
  - 🔴 Breaking-leaning Behavior Change: **1** (PR #25935 — YOLO 모드 fail closed)
  - 🟠 Behavior Change: **5**
  - 🟡 Feature Add (significant): **6** (Voice Mode, tools.core allowlist, Gemma 4, ContextManager wire-up, --session-id, env var casting)
  - 🟢 Bug Fix: **18**
  - 🔒 Security/Privacy: **1** (PR #26153 / v0.40.1 cherry-pick)
  - Docs/Internal: ~5

### bkit 직접 영향 후보 (Top 5, v0.41.x 신규 한정)

1. **PR #25720 — `tools.core` allowlist + recursive shell validation** 🔴
   - 신규 `settings.tools.core` 키. 명시 화이트리스트(`run_shell_command(ls)` 등) 지원.
   - 기존 정책엔진이 sub-command/substitution을 **재귀적으로** 검사 (`stripShellWrapper` 추가).
   - **bkit 영향**: bkit baseline runner가 `bash -c "..."` 같은 wrapper 명령을 호출한다면, 이전에 통과하던 명령이 v0.41에서 차단될 수 있음. `lib/runtime/`, `mcp/bkit-server.js` shell 호출 경로 grep 필요.

2. **PR #25935 — YOLO 모드 fail-closed** 🔴
   - 이전: shell parser 실패 시 YOLO 모드는 `ALLOW`로 default
   - 이후: `argsPattern`이 있는 restricted rule에서 parser 실패 시 **fail closed (BLOCK)**
   - **bkit 영향**: bkit baseline runner가 YOLO + restricted rules로 도는 경우, 복잡한 shell 표현(`$[ ]` 같은 deprecated syntax)이 자동 거부됨. 보안적으론 향상, 동작 호환성에선 회귀.

3. **PR #25814 (재고지) + PR #25720 — Headless Trust + Recursive Shell**
   - PR #25814은 v0.40.0 baseline에 이미 분석 완료 (변수명 `GEMINI_CLI_TRUST_WORKSPACE`로 확정). bkit이 이미 우회 적용.
   - v0.41에서 PR #25720이 결합되면서 trust enforcement + shell allowlist + recursive validation이 **3중 레이어**로 작동. baseline runner의 첫 진입 경로 검증 필요.

4. **PR #26060 — `--session-id` CLI flag** 🟡
   - 사용자가 명시적으로 session UUID 지정 가능. `--resume`과 충돌.
   - **bkit 활용**: baseline runner가 session UUID를 안다면 재현/디버깅에 유용. 옵트인.

5. **PR #26118 — settings.json env var → 자동 type cast** 🟠
   - 이전: `${GEMINI_FOO:-true}`가 string `"true"`로 전달되어 boolean 검증 실패
   - 이후: `z.preprocess`로 boolean/number 자동 캐스팅
   - **bkit 영향**: bkit이 `.gemini/settings.json`에서 `${ENV:-...}` 패턴을 사용한다면 검증 통과율 개선 (긍정적). `lib/runtime/env-config.ts` 류 코드에서 환경변수 만들 때 영향 없음.

### v0.40.0 baseline 보고서 활용 정책

- v0.40.0 변경사항(Memory 재편, MCP resources, ripgrep SEA, topic narration default-on, autoMemory split)은 **모두 baseline 보고서(`gemini-cli-v0.40.0-research.md`)를 참조**한다.
- 본 보고서는 v0.40.0 ↔ v0.41.0 양쪽에 동시 등장한 PR(#25814, #25720, #25874)의 baseline 분석을 재인용하며, **v0.41.0/.1 신규 PR과 v0.40.x patch만 새로 기술**한다.
- baseline 보고서의 §0 정정 노트(`GEMINI_CLI_TRUST_WORKSPACE` 변수명 확정)는 본 보고서에서도 그대로 유효하다.

---

## 1. 버전 개요 (v0.40.0 / v0.40.1 / v0.41.0 / v0.41.1)

### v0.40.0 (이미 baseline 분석 완료)
- 릴리스 날짜: 2026-04-28
- 주요 테마: Memory 시스템 재편, Workspace Trust hardening, MCP resources GA, SEA 번들링
- 자세한 내용: `docs/01-plan/research/gemini-cli-v0.40.0-research.md` 참조

### v0.40.1 (patch)
- 릴리스 날짜: 2026-04-30
- 단일 cherry-pick: PR #26153 (`Respect logPrompts flag for logging sensitive fields`)
- 주요 테마: Telemetry privacy hardening
- 변경 파일 4개: `packages/core/src/telemetry/conseca-logger.{ts,test.ts}`, `loggers.test.ts`, `types.ts`

### v0.41.0
- 릴리스 날짜: 2026-05-05 (v0.40.0 발표 ~7일 후)
- 베이스 브랜치 비교: `v0.40.0...v0.41.0` = 47 commits ahead, 10 commits behind
- v0.40.0과 양쪽 release branch에 모두 cherry-pick된 PR: 3개 (#25814, #25720, #25874)
- v0.41.0 only(=v0.40.0에 없는) PR: **39개** (chore/version bump 포함)
- 주요 테마:
  1. **Voice Mode** (PR #24174) — Gemini Live API + 로컬 Whisper, `/voice` 슬래시 커맨드
  2. **Recursive Shell Validation + `tools.core` allowlist** (PR #25720)
  3. **YOLO mode fail-closed** (PR #25935)
  4. **ContextManager + AgentChatHistory wire-up** (PR #25409 — 내부 아키텍처 단계 변경)
  5. **Auto-memory scratchpad persistence** (PR #25873)
  6. **Gemma 4 모델 지원 (experimental)** (PR #25604)
  7. **Settings.json env var type cast** (PR #26118)
  8. **`--session-id` CLI flag** (PR #26060)
  9. **Slow boot perf fix** (PR #25758, async experiments fetch)

### v0.41.1 (patch)
- 릴리스 날짜: 2026-05-05 (v0.41.0 발표 약 2시간 후 hotfix)
- 단일 cherry-pick: PR #26542 (`fix(core): allow redirection in YOLO and AUTO_EDIT modes without sandboxing`)
- 변경 파일 2개: `packages/core/src/policy/policy-engine.{ts,test.ts}`
- 회귀 fix: 명령에 `2>&1 | tail -80` 같은 redirection이 있을 때 sandbox 비활성 환경에서 YOLO/AUTO_EDIT가 ASK_USER로 다운그레이드되던 회귀 fix

---

## 2. Breaking Changes 매트릭스 (v0.41.x 신규)

> v0.40.0 Breaking Changes는 baseline 보고서 §2 참조 — autoMemory split (#25601), topic narration default-on (#25586), Headless Trust Enforcement (#25814).

| # | PR | 항목 | 이전 (v0.40.0/.1) | 이후 (v0.41.0/.1) | 영향도 | bkit 영향 hint¹ |
|---|----|------|------------------|------------------|--------|-----------------|
| B1 | #25935 | YOLO 모드 + restricted rule fail-closed | shell parser 실패 시 `argsPattern` 있는 rule도 `ALLOW`로 fall-through | parser error → **BLOCK** | 🔴 강함 | bkit baseline runner가 YOLO + restricted rules + 복잡 shell(`$[…]`, `$()`)을 호출하면 자동 거부. 위치: `lib/runtime/`, baseline 정책 정의 |
| B2 | #25720 | `tools.core` allowlist + recursive sub-command validation | sub-command은 일부만 검사, `bash -c` wrapper는 wrapper 자체만 검사 | 모든 substitution / subshell / piped command를 재귀적으로 정책 매칭. wrapper도 `stripShellWrapper`로 unwrap | 🟠 중간 | bkit이 `bash -c "..."`나 `sh -c`로 wrapping된 명령을 정책 통과 가정하고 호출했다면 차단될 수 있음. 위치: `mcp/bkit-server.js`, baseline runner shell 호출 |
| B3 | #26060 | `--session-id` 플래그 도입 + `--resume`과 충돌 처리 | 기존엔 session UUID 자동 생성만 가능 | `--session-id <uuid>` 신규. `--resume`과 동시 지정 시 error | 🟢 낮음 (옵트인 — 기존 호출은 변화 없음) | bkit이 CLI 자동화에서 unknown flag를 strict 검증한다면 무관. baseline runner가 활용 가능 |
| B4 | #25409 | 내부 ContextManager / AgentChatHistory wire-up | 이전 chat history 모델 | 신규 ContextManager로 치환 | 🟠 중간 (내부 API) | 내부 변경. bkit이 history JSON 포맷을 직접 파싱하지 않는다면 영향 없음. **확인 필요**: bkit이 `~/.gemini/tmp/<hash>/...` 안의 conversation log를 읽는 코드가 있는가? |

¹ bkit 영향 hint는 추정이며 Phase 2에서 코드 grep으로 확정한다.

---

## 3. Behavior Changes (기본값 / UX, v0.41.x 신규)

| # | PR | 항목 | 변경 내용 | bkit 영향 hint |
|---|----|------|----------|---------------|
| BH1 | #25758 | 시작 부팅 시 experiments/quota 비동기 fetch | 이전: 동기 await로 8~10s 부팅. 이후: 비동기 chain → 부팅 ~1.4s 단축 | bkit baseline runner가 부팅 latency에 sleep/timeout 가정 코드 있다면 더 빨라짐. 영향 미미 |
| BH2 | #26066 | transient error → `sticky_retry` (terminal 아님) | 이전: 503/rate-limit 등 transient에서 모델이 silently flash로 fallback | 이후: 동일 모델로 재시도 | bkit baseline runner가 의도적으로 flash fallback을 원했다면 영향 (드뭄). 일반적으론 긍정 |
| BH3 | #25894 | CLI subcommand stdout pipe/redirect 통과 | 이전: `gemini extensions list 2>&1 \| less` 시 ConsolePatcher가 헤드리스로 잘못 추론하여 stdout 억제 | 이후: subcommand는 `interactive: true, stderr: false`로 강제하여 정상 출력 | bkit이 `gemini extensions list`를 파이프로 캡처한다면 v0.41에서 처음 정상 작동. 위치: bkit 도구 자동 검증 스크립트 |
| BH4 | #26068 | `gemini mcp list`에서 ping 실패 ≠ Disconnected | 이전: ping 실패 → "Disconnected"로 표시 (ping 미구현 1st-party MCP 서버에서 false negative) | 이후: ping 실패해도 connect 성공이면 Connected. 명시 timeout 존중 | bkit baseline runner의 MCP 서버 health check 코드가 ping 결과만 보고 판단한다면 동작 정정 |
| BH5 | #26125 | ACP stdout pollution from SessionEnd hooks 차단 | 이전: ACP 모드 종료 시 ConsolePatcher unpatch 후 SessionEnd hook stdout이 NDJSON 채널 오염 | 이후: ACP 모드에선 cleanup 시 ConsolePatcher 유지 | **bkit이 ACP 모드 + SessionEnd hook을 사용한다면 적용**. NDJSON 무결성 향상 |
| BH6 | #25941 | Windows backspace handling revert | Windows 회귀 fix | UI only, bkit는 macOS 운영이라 무관 추정 |

---

## 4. 새로운 기능 (v0.41.x 신규)

| # | PR | 기능 | 설명 | bkit 활용 가능성 |
|---|----|------|------|-----------------|
| F1 | #24174 | **Voice Mode (`/voice`)** | Gemini Live API (cloud) + Whisper (local, `~/.gemini/whisper_models/`) backend. Push-to-Talk(spacebar) + Continuous mode. `sox`/`whisper-stream` 외부 의존 | bkit headless 사용엔 무관. 인터랙티브 사용자가 사용 시 audio device 가능 |
| F2 | #25720 | **`tools.core` allowlist** | `settings.tools.core: ["run_shell_command(ls)", ...]` 명시 화이트리스트 | bkit baseline 보안 강화 시 활용 가능. 단, 너무 좁히면 baseline 도구 실행 차단 위험 |
| F3 | #25604 | **Gemma 4 (experimental)** | `experimental.gemma: true` 시 `gemma-4-31b-it`, `gemma-4-26b-a4b-it` 모델 노출. 256K 컨텍스트, thinking 지원 | bkit가 Gemma 사용 의도가 있을 때 명시 활성화 가능 |
| F4 | #25409 | **ContextManager + AgentChatHistory wire-up** | 새로운 내부 chat history 모델로 전환 | 내부 변경, bkit 직접 활용 어려움. 단, fixes #25408 |
| F5 | #25873 | **Auto-memory scratchpad persistence** | session metadata에 `memoryScratchpad` 영속화. skill extraction에 compact workflow hints 제공. 평가에서 extractor turns -16.7%, precision +32.7% | bkit auto-memory 정책이 `experimental.autoMemory: true`라면 자동 활용. 추가 코드 변경 없음 |
| F6 | #26118 | **settings.json env var type cast** | `${GEMINI_AUTO_THEME:-false}` 같은 placeholder가 boolean/number로 자동 캐스팅. case-insensitive (`TRUE`도 인식) | bkit `.gemini/settings.json`에 env var 사용 시 검증 통과. **잠재적 회귀 위험**: 이전엔 string으로 들어와도 작동하던 코드가 type-cast 후 다른 schema 분기로 가는 경우 |
| F7 | #26060 | **`--session-id <uuid>` CLI flag** | session UUID 명시 지정. `--resume`과 충돌 시 error. path traversal/특수문자 검증 | bkit baseline runner가 디버깅용 session 재현이 필요하면 활용 가능 |
| F8 | #25874 | FatalUntrustedWorkspaceError에 docs link 추가 | error 메시지 UX 개선 (PR #25814 보강) | error 메시지 grep으로 bkit baseline runner가 trust 실패를 감지한다면 메시지 변형 가능 — 검증 필요 |
| F9 | #26052 | 자동 update 실패 시 manual update command 제공 | error 메시지에 정확한 manual command 제시 | bkit npm 자동 update 비활성화 사용 시 무관 |

---

## 5. Deprecation 예고 (v0.41.x 신규)

v0.41.0 / v0.41.1 본문에 명시적인 "deprecated as of vX, removed in vY" 표기는 발견되지 않음. v0.40.0 baseline 보고서 §5의 deprecation 항목들(`experimental.topicUpdateNarration`, `experimental.memoryManager` 일부 의미 등)은 v0.41에서도 동일하게 유효하며, 추가 deprecation 통보는 없음.

조사 한계: PR 본문/release notes에 deprecation 마커 부재. 향후 1~2 minor 후 제거될 가능성 있는 항목 추가 식별 안 됨.

---

## 6. 설정 / 구성 변경 (v0.41.x 신규)

| 설정 키 / 환경변수 | 이전 (v0.40.0/.1) | 이후 (v0.41.0/.1) | alias / fallback | bkit 토글 영향 |
|---|---|---|---|---|
| `tools.core` (배열) | **존재하지 않음** | 신규: `run_shell_command(ls)` 같은 명시 allowlist | 없음 | 옵트인. bkit이 명시하지 않으면 기존 정책 그대로 |
| `experimental.gemma` | **존재하지 않음** | 신규 boolean, default `false` | 없음 | 옵트인 |
| `--session-id` (CLI flag) | 존재하지 않음 | 신규 | `--resume`과 mutex | bkit CLI invocation 시 unknown flag strict 거부 코드 있다면 영향 |
| `settings.json`의 `${ENV:-default}` | string으로 평가 → boolean/number schema에서 validation error | `z.preprocess`로 boolean/number 자동 캐스팅 | case-insensitive (TRUE/True/true) | bkit env-driven 설정 사용 시 검증 통과율 향상 |
| `general.topicUpdateNarration` (재인용) | v0.40.0 신규 (default true) | 동일 | `experimental.topicUpdateNarration` fallback | baseline §6 참조 |
| `experimental.autoMemory` (재인용) | v0.40.0 신규 (default false) | 동일 + scratchpad persistence 추가 | 없음 | baseline §6 참조 |
| `GEMINI_CLI_TRUST_WORKSPACE` (재확정) | v0.40.0 stable에서 첫 도입 | 동일 (변수명 확정) | `--skip-trust`, interactive trust | bkit `mcp/bkit-server.js`에 이미 적용됨 |

> v0.40.0에서 도입된 키들은 baseline 보고서 §6 표를 참조하라.

---

## 7. 보안 / 프라이버시 패치 (v0.41.x 신규)

| # | PR | 버전 | 항목 | 영향 |
|---|----|------|------|-----|
| S1 | #26153 | v0.40.1 | **Telemetry `logPrompts` 누설 fix** | `logPrompts: false` 설정해도 `ApiRequestEvent`/`ApiResponseEvent`/`ToolCallEvent`/`ConsecaPolicyGenerationEvent`/`ConsecaVerdictEvent`의 `request_text`/`response_text`/`function_args`/`user_prompt`/`trusted_content`/`policy`/`verdict_rationale` 필드가 OpenTelemetry로 그대로 emit되던 누설을 차단. `getTelemetryLogPromptsEnabled()` 게이팅 추가. closes #18979 |
| S2 | #25935 | v0.41.0 | **YOLO 모드 fail-closed (PoC included in PR)** | PR 본문에 `echo $[ x='a[$(touch FLAG)]', x ]`라는 PoC가 있음 — 이전엔 parser fail로 `ALLOW`되어 file write 발생. 이후 BLOCK |
| S3 | #25814 (재인용) | v0.40.0 + v0.41.0 (둘 다) | Headless Trust Enforcement | baseline 보고서 §7 참조 |
| S4 | #25874 | v0.41.0 | FatalUntrustedWorkspaceError 메시지 개선 | UX 보강 |
| S5 | #25720 | v0.40.0 + v0.41.0 (둘 다) | Recursive shell validation | baseline 보고서 §3 참조 (BH 항목으로 분류했었음). v0.41에서는 `tools.core` allowlist와 결합 |

---

## 8. 버그 수정 중 bkit 관련 가능성 (v0.41.x 신규)

| # | PR | 이슈 | 설명 | bkit 영향 |
|---|----|------|------|----------|
| G1 | #20108 | loop detection AbortError 크래시 | `GeminiClient`에서 abort 시 `@google/genai` SDK async iterator race condition으로 process hard-crash 발생 → break 즉시 처리로 fix | bkit baseline runner가 long-running 호출 중 loop detection trigger 시 안정성 향상 |
| G2 | #25758 | 부팅 ~8s를 ~1.4s로 단축 | experiments/quota 비동기 fetch | baseline runner 시작 latency 개선 (중요) |
| G3 | #26066 | transient error sticky_retry | 503/rate-limit 시 사용자 모델 유지 | bkit가 명시 모델 사용 시 silent fallback 방지 |
| G4 | #26069 | non-string model flag crash fix | `--model` 중복/값 없음 → `TypeError: resolved.startsWith is not a function` 크래시 | bkit가 `--model` 자동화 호출 시 안정성 |
| G5 | #26079 | cloudshell-gca auth error 메시지 개선 | 403만 보여주던 것을 가이드 텍스트로 | bkit가 CloudShell에서 도는 경우만 |
| G6 | #26068 | `gemini mcp list` ping 옵션화 + timeout | 이전 false negative "Disconnected" fix | bkit MCP health check 시 활용 |
| G7 | #26065 | sandbox proxy cleanup leak fix | `finally`로 stopProxy 보장 | bkit가 sandbox 사용 시 안정성 |
| G8 | #26067 | JetBrains alternate buffer warning 정정 | 잘못 firing되던 warning fix | bkit 무관 (UI) |
| G9 | #26078 | DevTools fetch interceptor `Request` 객체 헤더 보존 | private npm registry 자동 update 시 403 fix | bkit가 `gemini` 자동 업데이트 사용 안 한다면 무관 |
| G10 | #26128 | ENOTDIR 에러 메시지 개선 | UX | bkit 무관 |
| G11 | #26059 | ECONNRESET/ETIMEDOUT 에러 메시지 개선 | UX | bkit error 메시지 grep 시 변형 가능 — 확인 필요 |
| G12 | #25821 | 슬래시 자동완성 `list` 노출 정정 | UI | bkit 무관 |
| G13 | #25822 | Custom theme `text.response` schema 누락 fix | bkit 무관 (custom theme 미사용 추정) |
| G14 | #25880 | user message 컴포넌트 background 색 체크 fix | UI | bkit 무관 |
| G15 | #24477 | parallel task tracker batched updates | system prompt 업데이트로 `tracker_update_task` batching 강제 | bkit가 task tracker 사용 시 멀티-step 동기화 향상 |
| G16 | #26542 (v0.41.1 cherry-pick) | YOLO/AUTO_EDIT 모드 redirection 회귀 fix | sandbox 비활성 환경에서 `cmd 2>&1 \| tail`이 ASK_USER로 다운그레이드되던 회귀 fix | bkit baseline runner가 redirection을 사용하는 명령을 YOLO/AUTO_EDIT로 호출 시 정상 작동 (v0.41.0에서 잠시 깨졌다가 v0.41.1 hotfix로 복구) |

---

## 9. 미해결 / OPEN 추적

| PR | 이슈 | 상태 (2026-05-06) | bkit 영향 |
|----|------|-------------------|----------|
| #25827 | Issue #25655 — SessionStart `systemMessage` 중복 렌더 fix | **OPEN** | v0.40.0, v0.40.1, v0.41.0, v0.41.1 **모두 미포함**. bkit SessionStart hook이 systemMessage 사용 시 여전히 중복 렌더링. 워크어라운드 (addItem 직접 호출 회피) 유지 필요 |

---

## 10. v0.40.0 baseline 보고서 인용 인덱스

본 보고서가 재서술하지 않고 baseline 보고서를 인용하는 항목들:

| 영역 | baseline 보고서 위치 | 비고 |
|------|---------------------|------|
| Memory 시스템 재편 (PR #25601, #25716, autoMemory split, 4-tier prompt model) | `gemini-cli-v0.40.0-research.md` §2, §4, §6 | v0.41.0 PR #25873 (scratchpad)이 이 모델 위에 build |
| MCP resources 도구 (PR #25395, `list_mcp_resources` / `read_mcp_resource`) | baseline §4, §9.3 | v0.41에 변경 없음 |
| Headless Trust Enforcement (PR #25814) — 변수명 `GEMINI_CLI_TRUST_WORKSPACE` 확정 | baseline §0 정정 노트 + §2, §9.5 | v0.41에서도 그대로 유효 |
| topic narration default-on (PR #25586) | baseline §2, §6 | v0.41에 변경 없음 |
| ripgrep SEA bundling + npm tarball 제외 (PR #25342, #25841) | baseline §3 | v0.41에 변경 없음 |
| YOLO mode + dangerous heuristic (PR #25341) | baseline §3 | v0.41 PR #25935이 같은 정책 엔진을 더 strict하게 만듬 (보완) |
| `.env` IDE stdio override RCE 차단 (PR #25022) | baseline §7 | v0.41에 변경 없음 |
| `MemoryManagerAgent` 서브에이전트 제거 | baseline §5, §9.1 | v0.41에 변경 없음 |
| MCP resources Plan Mode 활성 | baseline §4, §9.3 | v0.41에 변경 없음 |

---

## 11. Phase 2 영향 분석 우선순위 hint (v0.41.x 신규 한정)

bkit 어느 영역을 봐야 하는지 (baseline 보고서 §11 hint와 합산):

1. **`mcp/bkit-server.js` / baseline runner shell 호출 — recursive shell validation + tools.core**
   - 확인: bkit이 `bash -c`, `sh -c`, 또는 substitution을 포함한 명령을 호출하는 코드 grep
   - 확인: bkit이 정의하는 shell 명령이 v0.41 정책 엔진을 통과하는가
   - 우선순위: 🔴 (회귀 위험)

2. **baseline runner 보안 정책 — YOLO + restricted rule fail-closed**
   - 확인: bkit baseline runner가 YOLO 모드 사용 + `argsPattern` 정의 여부
   - 확인: 자동 테스트가 복잡 shell expression을 사용하는가
   - 우선순위: 🟠

3. **bkit `.gemini/settings.json` env var 사용처 — type cast 영향**
   - 확인: bkit이 `${VAR:-default}` 패턴으로 boolean/number 설정 사용 시 type cast 검증
   - 우선순위: 🟢 (긍정 영향이지만 잠재적 회귀)

4. **bkit ACP 모드 + SessionEnd hook 사용 여부**
   - 확인: bkit이 ACP 모드 + SessionEnd hook 정의가 있다면 PR #26125 효과로 NDJSON 무결성 향상
   - 확인: 이전에 stdout 오염을 우회하는 워크어라운드가 있다면 제거 가능
   - 우선순위: 🟡 (개선 기회)

5. **CLI subcommand 자동화 — pipe/redirect 정상화**
   - 확인: bkit이 `gemini extensions list`, `gemini mcp list` 등을 파이프로 캡처하는 코드
   - 확인: 이전 v0.39.1까지 stdout 누락 워크어라운드가 있었다면 제거 가능 (PR #25894)
   - 우선순위: 🟡 (개선 기회)

6. **MCP health check — `gemini mcp list` ping 정정**
   - 확인: bkit baseline 검증에서 `gemini mcp list` 결과의 Connected/Disconnected 문자열 grep 코드
   - 우선순위: 🟢

7. **Telemetry 사용 시 `logPrompts: false` 검증**
   - 확인: bkit이 telemetry 활성 + `logPrompts: false`로 운영 시 v0.40.1 fix 적용 후 누설 차단됨
   - 우선순위: 🟢 (긍정)

8. **PR #25409 ContextManager — chat history JSON 포맷 가정 코드**
   - 확인: bkit이 `~/.gemini/tmp/<hash>/chat-*.json`이나 conversation log를 직접 파싱하는가
   - 우선순위: 🟠 (내부 구조 변경 가능성)

---

## 12. 원문 참조 링크

### Releases
- v0.40.0: https://github.com/google-gemini/gemini-cli/releases/tag/v0.40.0
- v0.40.1: https://github.com/google-gemini/gemini-cli/releases/tag/v0.40.1
- v0.41.0: https://github.com/google-gemini/gemini-cli/releases/tag/v0.41.0
- v0.41.1: https://github.com/google-gemini/gemini-cli/releases/tag/v0.41.1

### Compares
- v0.39.1...v0.40.0: https://github.com/google-gemini/gemini-cli/compare/v0.39.1...v0.40.0
- v0.40.0...v0.40.1: https://github.com/google-gemini/gemini-cli/compare/v0.40.0...v0.40.1
- v0.40.0...v0.41.0: https://github.com/google-gemini/gemini-cli/compare/v0.40.0...v0.41.0
- v0.41.0...v0.41.1: https://github.com/google-gemini/gemini-cli/compare/v0.41.0...v0.41.1

### v0.41.x 신규 핵심 PR (본문 검증 완료)
- #25720 tools.core allowlist + recursive shell validation — https://github.com/google-gemini/gemini-cli/pull/25720
- #25935 YOLO fail-closed — https://github.com/google-gemini/gemini-cli/pull/25935
- #24174 Voice Mode — https://github.com/google-gemini/gemini-cli/pull/24174
- #25409 ContextManager wire-up — https://github.com/google-gemini/gemini-cli/pull/25409
- #25873 auto-memory scratchpad — https://github.com/google-gemini/gemini-cli/pull/25873
- #25604 Gemma 4 (experimental) — https://github.com/google-gemini/gemini-cli/pull/25604
- #26118 settings.json env var type cast — https://github.com/google-gemini/gemini-cli/pull/26118
- #26060 `--session-id` flag — https://github.com/google-gemini/gemini-cli/pull/26060
- #25758 slow boot fix — https://github.com/google-gemini/gemini-cli/pull/25758
- #25894 CLI subcommand stdout pipe fix — https://github.com/google-gemini/gemini-cli/pull/25894
- #26068 `gemini mcp list` ping optional — https://github.com/google-gemini/gemini-cli/pull/26068
- #26125 ACP stdout pollution fix — https://github.com/google-gemini/gemini-cli/pull/26125

### Cherry-pick patches
- v0.40.1 patch: PR #26153 (logPrompts respect) — https://github.com/google-gemini/gemini-cli/pull/26153 (cherry-pick PR #26268 → v0.40.1)
- v0.41.1 patch: PR #26542 (YOLO redirection fix) — https://github.com/google-gemini/gemini-cli/pull/26542 (cherry-pick PR #26545 → v0.41.1)
- v0.41.0 preview cycle 추가 cherry-picks: #26269 (preview.1), #26508 (preview.2 from PR #26479 a2a-server race), #26530 (preview.3 from PR #26507 settings dialog UI)

### 보조 PR
- #20108 loop detection AbortError fix — https://github.com/google-gemini/gemini-cli/pull/20108
- #26066 transient error sticky_retry — https://github.com/google-gemini/gemini-cli/pull/26066
- #26069 non-string model flag — https://github.com/google-gemini/gemini-cli/pull/26069
- #26065 sandbox proxy cleanup — https://github.com/google-gemini/gemini-cli/pull/26065
- #26067 JetBrains alternate buffer — https://github.com/google-gemini/gemini-cli/pull/26067
- #26078 DevTools Request headers — https://github.com/google-gemini/gemini-cli/pull/26078
- #26079 cloudshell-gca auth — https://github.com/google-gemini/gemini-cli/pull/26079
- #26052 manual update command — https://github.com/google-gemini/gemini-cli/pull/26052
- #26059 ECONNRESET/ETIMEDOUT — https://github.com/google-gemini/gemini-cli/pull/26059
- #26128 ENOTDIR — https://github.com/google-gemini/gemini-cli/pull/26128
- #25821 list 자동완성 — https://github.com/google-gemini/gemini-cli/pull/25821
- #25822 custom theme schema — https://github.com/google-gemini/gemini-cli/pull/25822
- #25874 trust error 메시지 docs link — https://github.com/google-gemini/gemini-cli/pull/25874
- #25888 gemini-cli-bot metrics — https://github.com/google-gemini/gemini-cli/pull/25888
- #25925 README course link — https://github.com/google-gemini/gemini-cli/pull/25925
- #25930 sandbox docs — https://github.com/google-gemini/gemini-cli/pull/25930
- #25945 metric analysis bot — https://github.com/google-gemini/gemini-cli/pull/25945
- #24477 parallel task tracker — https://github.com/google-gemini/gemini-cli/pull/24477
- #23402 / #26053 ACP restore unit tests — https://github.com/google-gemini/gemini-cli/pull/26053
- #25876 package-lock — https://github.com/google-gemini/gemini-cli/pull/25876
- #25941 Windows backspace revert — https://github.com/google-gemini/gemini-cli/pull/25941
- #25880 message bg color — https://github.com/google-gemini/gemini-cli/pull/25880

### 미해결 (OPEN)
- #25827 SessionStart systemMessage 중복 렌더 fix — https://github.com/google-gemini/gemini-cli/pull/25827 (Issue #25655)

---

## 13. 조사 한계

1. **v0.41.0 PR 본문 누락**: 본 보고서는 v0.40.0...v0.41.0 39개 신규 commit 중 핵심 ~15개만 PR 본문을 직접 검증했고, 나머지는 commit message + release notes title 기반. 작은 UI 변경/test-only 변경은 본문 미검증.
2. **CLI 실측 미수행**: v0.40.0 baseline 보고서 §0 정정 노트는 실측(`npx --yes @google/gemini-cli@0.40.0`)으로 변수명을 확정했음. 본 보고서는 v0.41.1 npx 격리 실측을 수행하지 않음. **Phase 2에서 다음 항목을 실측 권장**:
   - v0.41.1에서 `GEMINI_CLI_TRUST_WORKSPACE` 변수명이 그대로 유효한가 (regression 가능성 낮지만 confirmation 필요)
   - PR #25720의 `tools.core` 키 schema 정확한 이름 (`tools.core` vs `tools.coreTools` 같은 변형 가능성)
   - PR #26060 `--session-id` 플래그의 정확한 표기 (`--session-id <uuid>` vs `--session-id=<uuid>`)
3. **PR #25827 진행 상황**: OPEN 상태로 추적 중이나 해결 ETA 미파악.
4. **Voice Mode (PR #24174) 외부 의존**: `sox` / `whisper-stream` 외부 바이너리 의존을 추가. bkit headless 환경엔 무관하지만, 만약 bkit가 의존 검증 스크립트를 가진다면 false positive 가능 — Phase 2 검토.
5. **PR #25409 ContextManager**: PR 본문이 단 한 줄(`fixes #25408`)이라 내부 구조 변경 상세 미파악. 실제 영향 분석은 코드 grep 필요.
6. **bkit 영향 hint는 모두 추정**: Phase 2에서 bkit 코드 grep으로 확정해야 함.

---

## 14. 조사 신뢰도

| 항목 | 신뢰도 | 비고 |
|------|--------|------|
| 릴리스 타임라인 | ⬛⬛⬛⬛⬛ | gh API release list로 직접 확인 |
| Breaking Changes (v0.41.x 신규) | ⬛⬛⬛⬛⬜ | 핵심 4건 PR 본문 직접 검증, bkit 영향은 추정 |
| 새 기능 (v0.41.x) | ⬛⬛⬛⬛⬜ | 핵심 9건 본문 직접 검증, 일부는 release note title만 |
| Deprecation | ⬛⬛⬜⬜⬜ | v0.41 본문에 명시 deprecation 없음 |
| 설정 변경 | ⬛⬛⬛⬛⬜ | PR #25720, #26118 본문 schema 변경 직접 확인. CLI 실측 미수행 |
| 보안 / 프라이버시 | ⬛⬛⬛⬛⬛ | PR #26153, #25935 본문 직접 확인 (PoC 포함) |
| Patch 릴리스 | ⬛⬛⬛⬛⬛ | v0.40.1, v0.41.1 cherry-pick commit/파일 직접 확인 |
| baseline 인용 | ⬛⬛⬛⬛⬛ | 동일 cwd의 v0.40.0 보고서 직접 Read |
| bkit 영향 hint | ⬛⬛⬛⬜⬜ | **추정**. Phase 2에서 코드 grep으로 확정 |

---

**Phase 2로 전달할 핵심 검증 질문**:

(baseline 보고서 §13의 5개 질문에 추가하여)

6. bkit이 `bash -c`, `sh -c`, command substitution `$(...)`, `<(...)`, `${VAR}` 같은 wrapper/expansion을 포함하는 shell 명령을 baseline runner나 MCP 도구에서 호출하는가? (PR #25720 영향 검증)
7. bkit이 YOLO 모드 + `argsPattern`을 설정 한 상태에서 복잡한 shell 표현을 호출하는가? (PR #25935 영향 검증)
8. bkit이 ACP 모드 + SessionEnd hook을 정의하는가? 정의한다면 stdout 오염 워크어라운드가 있는가? (PR #26125 활용 가능성)
9. bkit이 `gemini extensions list`, `gemini mcp list` 등 CLI subcommand 출력을 파이프/리다이렉트로 캡처하는가? (PR #25894, #26068 활용 가능성)
10. bkit이 `~/.gemini/tmp/<hash>/...` conversation log를 직접 파싱하는 코드가 있는가? (PR #25409 ContextManager 영향)
11. bkit `.gemini/settings.json`이 `${ENV:-default}` 패턴으로 boolean/number 설정을 사용하는가? (PR #26118 type cast 영향)
12. bkit이 telemetry를 활성화하면서 `logPrompts: false`로 운영하는가? (PR #26153 / v0.40.1 보안 패치 적용 확인)
