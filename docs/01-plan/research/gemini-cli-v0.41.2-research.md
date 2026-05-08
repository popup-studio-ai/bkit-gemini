# Gemini CLI v0.39.1 → v0.41.2 누적 변경사항 조사 보고서

> bkit v2.0.6 (= Gemini CLI v0.39.1) → v0.41.2 stable 마이그레이션 Phase 1 (P1) 산출물
> 작성일: 2026-05-07
> 조사자: gemini-researcher agent (PDCA Strategy B' 11번째 적용)
> 비교 범위: `v0.39.1...v0.41.2` (= v0.40.0 + v0.40.1 + v0.41.0 + v0.41.1 + v0.41.2)
> 출처: GitHub Releases/PR/compare API (`gh` CLI 직접 호출), 단일버전 baseline 보고서 2건 인용

---

## 0. 조사 메타데이터

### 0.1 누적 baseline 결정 근거

- bkit `main` HEAD = v2.0.6 = Gemini CLI v0.39.1 머지 완료 (2026-04-25 PDCA 종료, 2026-04-29 v0.40.0 P1~P4 완료, **Do 미실시**).
- 사용자 결정 (2026-05-07): npm `latest` stable이 **v0.41.2**로 진행됨. v0.40.0/v0.41.1 단독 사이클을 모두 묶어서 누적 baseline `v0.39.1 → v0.41.2`로 P1만 다시 작성.
- 본 보고서는 P2 영향 분석의 입력 자료. P3(brainstorm)/P4(report)는 사용자 판단 후 결정.

### 0.2 누적 릴리스 타임라인

| 버전 | published_at | 성격 | 주요 테마 |
|---|---|---|---|
| v0.39.1 | 2026-04-24 | bkit baseline (이미 적용됨) | — |
| **v0.40.0** | 2026-04-28T20:25Z | minor (72 commits) | Memory 시스템 재편, Workspace Trust hardening, MCP resources GA, SEA 번들링, topic narration default-on |
| **v0.40.1** | 2026-04-30 | patch (1 cherry-pick) | Telemetry `logPrompts` 누설 fix |
| **v0.41.0** | 2026-05-05T20:47Z | minor (47 commits ahead, 39 신규) | Voice Mode, ContextManager wire-up, `tools.core` allowlist + recursive shell validation, YOLO fail-closed, Gemma 4 (experimental), `--session-id`, settings env-var type cast |
| **v0.41.1** | 2026-05-05T22:45Z | patch (1 cherry-pick) | YOLO/AUTO_EDIT 모드 redirection 회귀 fix (PR #26542) |
| **v0.41.2** | **2026-05-06T18:39Z** | **patch (1 cherry-pick, a2a-server only)** | **`@google/gemini-cli-a2a-server`의 `Task.waitForPendingTools()` race condition fix (PR #26568 → cherry-pick PR #26589)** |

### 0.3 v0.41.1 baseline 보고서 대비 본 보고서가 추가/수정한 핵심 포인트

1. **v0.41.2 신규 분석**: 단일 cherry-pick (PR #26568) 본문 직접 검증. 영향 패키지 `@google/gemini-cli-a2a-server`만, CLI 본체 무관 (`packages/a2a-server/src/agent/{task.ts,task-event-driven.test.ts,race-condition.test.ts}` 3파일 변경). bkit 영향 **없음**(`a2a-server` 미사용 — bkit grep 결과 `a2a-server`는 v0.41.1 research 보고서 § 12 인용 1건만 존재).
2. **누적 관점 통합**: v0.40.0 baseline의 "정정 노트(`GEMINI_CLI_TRUST_WORKSPACE` 변수명 확정)"를 본 보고서 본문 §2 표에 직접 명시. v0.41.1 보고서가 baseline을 인용 처리했던 항목을 누적표로 일원화.
3. **Breaking Changes 누적 카운트 확정**: 누적 4건 (B1~B4 from v0.41.x) + baseline 3건 = **누적 7건** (§2).
4. **Deprecation 표 빈 행 명시**: v0.39.1 → v0.41.2 사이 명시적 "deprecated as of vX, removed in vY" 통보는 **0건**. 행동 기반 deprecation만 존재 (§4).
5. **bkit 활용 후보 신기능 9건 별도표 신설** (§9). 결정은 P2/P3에 위임, 식별만 수행.

### 0.4 사용 소스 목록

- GitHub Releases: v0.40.0, v0.40.1, v0.41.0, v0.41.1, **v0.41.2** (`gh release view <tag>`)
- GitHub PR 본문: #26568 (v0.41.2 원본), #26589 (v0.41.2 cherry-pick), #26542 (v0.41.1 원본)
- baseline 보고서 직접 Read: `docs/01-plan/research/gemini-cli-v0.40.0-research.md`, `docs/01-plan/research/gemini-cli-v0.41.1-research.md`
- bkit 코드베이스 grep (`a2a-server`)
- 외부 블로그/비공식 매체 인용 **없음** (skill 1.3 quality rule 준수)

---

## 1. 버전 타임라인 개요 (요약)

| 버전 | 릴리스 | 성격 | 주요 테마 |
|---|---|---|---|
| v0.40.0 | 2026-04-28 | minor | Memory 재편 (서브에이전트 → prompt-driven 4-tier), Headless Trust Enforcement, MCP resources, SEA 번들링, topic narration default-on |
| v0.40.1 | 2026-04-30 | patch | Telemetry `logPrompts` 누설 차단 (PR #26153) |
| v0.41.0 | 2026-05-05 | minor | Voice Mode, ContextManager wire-up, `tools.core` allowlist + recursive shell validation, YOLO fail-closed, Gemma 4 (experimental), `--session-id`, env var type cast, slow boot fix |
| v0.41.1 | 2026-05-05 | patch | YOLO/AUTO_EDIT 모드 redirection 회귀 fix (PR #26542) |
| v0.41.2 | **2026-05-06** | **patch (a2a-server only)** | **`Task.waitForPendingTools()` race condition fix (PR #26568) — CLI 본체 영향 없음** |

---

## 2. Breaking Changes 누적 매트릭스 (v0.39.1 → v0.41.2)

> 누적 7건 (v0.40.0 baseline 3건 + v0.41.x 신규 4건). 모두 `bkit` 영향 hint는 **추정** — Phase 2 코드 grep으로 확정.

| # | PR | 도입 버전 | 항목 | 이전 (v0.39.1 baseline) | 이후 | 영향 모듈 | bkit 잠재 영향 (가설) |
|---|----|----|----|----|----|----|----|
| **B1** | #25601 | v0.40.0 | `experimental.memoryManager` 의미 분리 | 단일 플래그가 (a) `MemoryManagerAgent`+`save_memory` swap **AND** (b) background skill 추출 + `/memory inbox` 둘 다 게이팅 | (a)만 `memoryManager` 게이팅, (b)는 신규 `experimental.autoMemory`로 분리 | core/agents, cli/commands/memory | bkit 설정 `experimental.memoryManager: true`만 켰다면 background extraction과 `/memory inbox`는 **자동 비활성화**. 의도적이라면 `autoMemory`도 활성화 필요 |
| **B2** | #25586 | v0.40.0 | `topicUpdateNarration` 기본값 + 카테고리 | default `false`, `experimental.topicUpdateNarration` | default `true`, `general.topicUpdateNarration` (`experimental.*` fallback 읽기 유지) | core/runtime/config | bkit baseline runner/스킬 출력에 multi-step 진행 narration 자동 추가. 명시 비활성화하려면 `general.topicUpdateNarration: false` |
| **B3** | #25814 | v0.40.0 | Headless Trust Enforcement | headless에서 untrusted workspace도 실행 가능 | headless에서 untrusted workspace는 `FatalUntrustedWorkspaceError` 차단. 우회: `--skip-trust`, **`GEMINI_CLI_TRUST_WORKSPACE=true`**, interactive trust | cli, core/trust | **변수명 정정 확정**: v0.40.0 baseline §0 정정 노트 + CLI stderr 실측 결과 정답은 **`GEMINI_CLI_TRUST_WORKSPACE`** (CLI prefix 유지). bkit `mcp/bkit-server.js:1119` 이미 정확하게 사용 중 → 코드 변경 0건 |
| **B4** | #25935 | v0.41.0 | YOLO 모드 + `argsPattern` restricted rule fail-closed | shell parser 실패 시 YOLO + `argsPattern` rule도 `ALLOW`로 fall-through (PoC: `echo $[ x='a[$(touch FLAG)]', x ]`로 file write 우회 가능) | parser error → **BLOCK** | core/policy/policy-engine | bkit baseline runner가 YOLO + restricted rules 사용 + 복잡 shell 표현(`$[…]`, deprecated arithmetic)을 호출 시 자동 거부. 보안 향상이지만 동작 호환성 회귀 가능 |
| **B5** | #25720 | v0.41.0 | `tools.core` allowlist + recursive sub-command validation | `bash -c "..."` wrapper는 wrapper 자체만 검사, sub-command는 부분만 검사 | 모든 substitution / subshell / piped command를 재귀적으로 정책 매칭. wrapper도 `stripShellWrapper`로 unwrap | core/policy, settings schema | bkit이 `bash -c`, `sh -c`, command substitution `$(...)`, `<(...)`로 wrapping된 명령을 정책 통과 가정으로 호출 시 차단 가능. **🔴 회귀 위험 최우선** |
| **B6** | #26060 | v0.41.0 | `--session-id <uuid>` CLI flag 도입 + `--resume`과 mutex | session UUID 자동 생성만 가능 | `--session-id <uuid>` 신규. `--resume`과 동시 지정 시 error. path traversal 검증 | cli/args | bkit이 CLI 자동화에서 unknown flag를 strict 검증한다면 무관. 활용 가능 옵트인 |
| **B7** | #25409 | v0.41.0 | 내부 `ContextManager` + `AgentChatHistory` wire-up | 이전 chat history 모델 | 신규 ContextManager로 치환 (fixes #25408) | core/agents/history (내부 API) | 내부 변경. bkit이 history JSON 포맷을 직접 파싱 시 영향. **확인 필요**: bkit이 `~/.gemini/tmp/<hash>/...` 안의 conversation log를 읽는 코드가 있는가? |

> v0.40.1 / v0.41.1 / v0.41.2 patch 릴리스에는 Breaking Change **0건**.

---

## 3. 새로운 기능 누적 (v0.39.1 → v0.41.2)

> 누적 24건 (baseline 15건 + v0.41.x 신규 9건). 빌드/테스트만 영향 주는 항목은 제외.

### 3.1 v0.40.0 신규 (15건)

| # | PR | 기능 | 설명 | bkit 활용 가능성 |
|---|---|---|---|---|
| F1 | #25395 | **MCP resources 도구 (`list_mcp_resources` / `read_mcp_resource`)** | 연결된 MCP 서버의 resource 집계/읽기. Plan Mode에서도 활성. closes #25335 | **🟡 매우 높음** — bkit MCP 서버에 정책/매뉴얼/체크리스트를 resource로 export하면 에이전트 자동 탐색 가능 |
| F2 | #25716 | **4-tier prompt-driven memory** | `MemoryManagerAgent` 서브에이전트 제거 → 메인 에이전트가 `edit`/`write_file`로 직접 4 계층 마크다운 편집. ① `./GEMINI.md` ② `./<sub>/GEMINI.md` ③ `~/.gemini/tmp/<hash>/memory/MEMORY.md` + sibling `*.md` ④ `~/.gemini/GEMINI.md` | 메모리 영속화 정책 직결. **③ tier 새 경로** 검증 필요 |
| F3 | #25601 | `experimental.autoMemory` 신규 토글 | background skill 추출 + `/memory inbox` 별도 게이팅 | 자동 학습 파이프라인 활성/비활성 분리 |
| F4 | #25513 | Vertex AI request routing | `billing.vertexAi.requestType` / `sharedRequestType` (Priority/Flex PayGo) | Vertex 사용자 한정 |
| F5 | #25498 | `gemini gemma` 로컬 모델 setup | `gemini gemma`, `gemini gemma logs` LiteRT 서버 관리 | local model fallback 활용 가능 |
| F6 | #17865 | `/new` = `/clear` alias | description "starts a new session" | slash command 문서/스킬 반영 |
| F7 | #25256 | `@` recommendation 파일 watcher | `context.fileFiltering.enableFileWatcher: true` 시 create/delete 이벤트로 search index 갱신. default `false` | 옵트인 |
| F8 | #25090 | `get-internal-docs`에 `.mdx` 지원 | mdx 파일 인식 | 영향 미미 |
| F9 | #15504 | github colorblind theme | UI | UI |
| F10 | #25300 | OSC 777 terminal notifications | 종료 알림 | 영향 미미 |
| F11 | #25343 | telemetry traces flag | trace 단독 활성 | telemetry 정책에 따라 |
| F12 | #25497 | `GEMINI_API_KEY` 점(`.`) 허용 | validation에서 dot 허용 | 호환성 fix |
| F13 | #25176 | session persistence 개선 | session 상태 영속화 | `~/.gemini/` 경로 영향 미미 |
| F14 | #25538 | shell command wrapping에 newline | heredoc 깨짐 방지 | shell 도구 안정성 |
| F15 | #14619/#24619 | subagent 평가 테스트 | eval suite 확장 | 내부 |

### 3.2 v0.41.0 신규 (9건)

| # | PR | 기능 | 설명 | bkit 활용 가능성 |
|---|---|---|---|---|
| F16 | #24174 | **Voice Mode (`/voice`)** | Gemini Live API (cloud) + Whisper (local, `~/.gemini/whisper_models/`). Push-to-Talk(spacebar) + Continuous mode. `sox`/`whisper-stream` 외부 의존 | bkit headless 무관. 인터랙티브 사용자 audio device 시 |
| F17 | #25720 | **`tools.core` allowlist** | `settings.tools.core: ["run_shell_command(ls)", ...]` 명시 화이트리스트 | 보안 강화 시 활용. 너무 좁히면 baseline 도구 차단 위험 |
| F18 | #25604 | **Gemma 4 (experimental)** | `experimental.gemma: true` 시 `gemma-4-31b-it`, `gemma-4-26b-a4b-it` 노출. 256K 컨텍스트, thinking 지원 | 활용 가능 |
| F19 | #25409 | **ContextManager + AgentChatHistory wire-up** | 새로운 내부 chat history 모델로 전환 (fixes #25408) | 내부, 직접 활용 어려움 |
| F20 | #25873 | **Auto-memory scratchpad persistence** | session metadata에 `memoryScratchpad` 영속화. extractor turns -16.7%, precision +32.7% | `experimental.autoMemory: true`라면 자동 활용 |
| F21 | #26118 | **settings.json env var 자동 type cast** | `${GEMINI_AUTO_THEME:-false}` 같은 placeholder가 boolean/number로 자동 캐스팅. case-insensitive (`TRUE`도) | bkit env-driven 설정 검증 통과율 향상. 잠재 회귀: 이전 string 가정 코드가 다른 schema 분기 |
| F22 | #26060 | **`--session-id <uuid>` CLI flag** | 명시 session UUID. `--resume`과 mutex | 디버깅/재현 활용 |
| F23 | #25874 | FatalUntrustedWorkspaceError에 docs link | UX 개선 (PR #25814 보강) | error 메시지 grep 검증 |
| F24 | #26052 | 자동 update 실패 시 manual update command | error 메시지 정확화 | npm 자동 update 비활성 시 무관 |

### 3.3 v0.40.1 / v0.41.1 / v0.41.2 patch 릴리스 — 새 기능 0건 (모두 fix)

---

## 4. Deprecation 예고 누적 (v0.39.1 → v0.41.2)

| 항목 | 예고 버전 | 제거 예정 | 현재 대안 | 비고 |
|---|---|---|---|---|
| `experimental.topicUpdateNarration` (키 위치) | v0.40.0 (행동) | TBD (2~3 minor 후 추정) | `general.topicUpdateNarration`로 이동 | `experimental.*` fallback 읽기 유지 |
| `experimental.memoryManager`의 "background skill 추출 게이팅" 의미 | v0.40.0 (행동) | 의미는 이미 분리됨 | `experimental.autoMemory`로 옮길 것 | 키 자체는 유지 |
| `MemoryManagerAgent` 서브에이전트 자체 | v0.40.0 (구현) | **이미 제거** | 4-tier prompt 모델 | 직접 호출 코드 동작 안 함 |
| **명시적 deprecation 통보 ("deprecated as of vX, removed in vY")** | — | — | — | **v0.39.1 ~ v0.41.2 모든 release notes/PR 본문에 명시 deprecation 마커 부재**. 위 3건은 행동 변화 분석에서 도출 |

---

## 5. 설정 / 구성 변경 누적 (v0.39.1 → v0.41.2)

| 영역 | 항목 | 도입 버전 | 변경 내용 | alias / fallback | bkit 잠재 영향 |
|---|---|---|---|---|---|
| settings.json | `experimental.memoryManager` | v0.40.0 (의미만) | (a) MemoryManagerAgent + `save_memory` swap만 게이팅 (서브에이전트 제거 + 4-tier prompt edit으로 의미 변경) | 없음 | 의미 좁아짐. (b) 의도였다면 `autoMemory`로 마이그레이션 |
| settings.json | `experimental.autoMemory` | v0.40.0 신규 | background extraction + `/memory inbox` 게이팅. v0.41.0 PR #25873 scratchpad 추가 | 없음 (default `false`) | 명시 활성 필요 |
| settings.json | `general.topicUpdateNarration` | v0.40.0 신규 | default `true`. 신규 권장 위치 | `experimental.topicUpdateNarration` fallback | 출력 시끄러워질 수 있음 |
| settings.json | `experimental.topicUpdateNarration` | v0.40.0 (deprecated 행동) | (위 fallback) | — | 마이그레이션 권장 |
| settings.json | `context.fileFiltering.enableFileWatcher` | v0.40.0 신규 | default `false` | 없음 | 옵트인 성능 향상 |
| settings.json | `billing.vertexAi.requestType` / `sharedRequestType` | v0.40.0 신규 | Vertex 한정 | 없음 | Vertex 사용자만 |
| settings.json | `tools.core` (배열) | **v0.41.0 신규** | `run_shell_command(ls)` 같은 명시 allowlist | 없음 | 옵트인. 보안 강화 |
| settings.json | `experimental.gemma` | **v0.41.0 신규** | boolean, default `false` | 없음 | 옵트인 |
| settings.json (parser) | `${ENV:-default}` 처리 | **v0.41.0 변경** | string → `z.preprocess`로 boolean/number 자동 캐스팅. case-insensitive | — | env-driven 설정 검증 통과율 향상. 잠재 회귀 |
| CLI flag | `--session-id <uuid>` | **v0.41.0 신규** | 명시 session UUID. `--resume`과 mutex | — | unknown flag strict 거부 시 영향 |
| 환경변수 | **`GEMINI_CLI_TRUST_WORKSPACE`** | v0.40.0 신규 (CLI 정답 변수명) | headless 우회 변수 | `--skip-trust`, interactive trust | bkit `mcp/bkit-server.js:1119` 이미 정확하게 사용 중 |
| 환경변수 | `GEMINI_CLI_TRUSTED_FOLDERS_PATH` | v0.40.0 docs 명문화 | trustedFolders.json 파일 위치 override | — | 신규 또는 명시 강화 |

---

## 6. 버그 수정 중 bkit 관련성 있는 항목 (v0.39.1 → v0.41.2)

> 전체 ~50건 중 bkit 관련성 있는 17건만 추림. UI/Windows-only 회귀 fix는 제외.

### 6.1 v0.40.0 (8건)

| PR | 설명 | bkit 영향 |
|---|---|---|
| #16075 | OpenSSL 3.x SSL streaming 추가 에러 재시도 | 안정성 향상 |
| #25357 | `GOOGLE_GEMINI_BASE_URL` / `GOOGLE_VERTEX_BASE_URL` 존중 | custom endpoint 사용 시 의도대로 동작 |
| #25382 | `ShellExecutionConfig` spread + `ProjectRegistry` save backoff | baseline runner 안정성 |
| #25709 | slow render latency round 처리 (opentelemetry float warning 방지) | telemetry 노이즈 감소 |
| #25138 | nested plan dir 중복 + relative path policies fix | plan 시스템 사용자 영향 |
| #25626 | ACP 세션에서도 auto memory 시작 | TUI/ACP 일관성 |
| #24414 | IDE client 동적 CLI 버전 사용 | telemetry 정확성 |
| #25801 | `/clear (new)` alias 회귀 fix | `/clear` 사용자 |

### 6.2 v0.40.1 patch (1건)

| PR | 설명 | bkit 영향 |
|---|---|---|
| #26153 | **Telemetry `logPrompts: false` 누설 fix** — `ApiRequestEvent`/`ApiResponseEvent`/`ToolCallEvent`/`ConsecaPolicyGenerationEvent`/`ConsecaVerdictEvent`의 `request_text`/`response_text`/`function_args`/`user_prompt`/`trusted_content`/`policy`/`verdict_rationale`가 OpenTelemetry로 그대로 emit되던 누설 차단. closes #18979 | telemetry 활성 + `logPrompts: false` 운영 시 적용 후 누설 차단 |

### 6.3 v0.41.0 (7건)

| PR | 설명 | bkit 영향 |
|---|---|---|
| #20108 | loop detection AbortError 크래시 fix | long-running 호출 안정성 |
| #25758 | 부팅 ~8s → ~1.4s (experiments/quota 비동기 fetch) | baseline runner 시작 latency 개선 |
| #26066 | transient error → `sticky_retry` (terminal 아님) | 명시 모델 사용 시 silent flash fallback 방지 |
| #26069 | non-string model flag crash fix (`--model` 중복/값 없음) | `--model` 자동화 안정성 |
| #26068 | `gemini mcp list` ping optional + timeout (false negative "Disconnected" fix) | MCP health check 활용 |
| #26065 | sandbox proxy cleanup leak fix | sandbox 사용 시 안정성 |
| #25894 | CLI subcommand stdout pipe/redirect 통과 (`gemini extensions list 2>&1 \| less` 정상 출력) | bkit 자동 검증 스크립트가 파이프로 캡처 시 v0.41에서 처음 정상 작동 |
| #26125 | ACP stdout pollution from SessionEnd hooks 차단 | ACP 모드 + SessionEnd hook 시 NDJSON 무결성 향상 |
| #24477 | parallel task tracker batched updates | task tracker 사용 시 멀티-step 동기화 |

### 6.4 v0.41.1 patch (1건)

| PR | 설명 | bkit 영향 |
|---|---|---|
| #26542 | YOLO/AUTO_EDIT 모드 redirection 회귀 fix — sandbox 비활성 환경에서 `cmd 2>&1 \| tail`이 ASK_USER로 다운그레이드되던 회귀 fix | baseline runner가 redirection 명령을 YOLO/AUTO_EDIT로 호출 시 정상 작동 (v0.41.0에서 잠시 깨졌다가 v0.41.1 hotfix 복구) |

### 6.5 v0.41.2 patch (1건) — **CLI 본체 영향 없음**

| PR | 설명 | bkit 영향 |
|---|---|---|
| **#26568** (cherry-pick #26589) | **a2a-server `Task.waitForPendingTools()` race condition fix** — sequential tool confirmation에서 무한 hang. `isCompletionPromiseResolved` 추적 도입. 파일: `packages/a2a-server/src/agent/{task.ts +42/-39, task-event-driven.test.ts +69, race-condition.test.ts +173 신규}`. Breaking change 없음 | **영향 없음**. bkit 코드베이스 grep 결과 `a2a-server` 직접 import/의존 0건 (인용 1건은 v0.41.1 research 보고서 § 12 텍스트). bkit이 사용하는 패키지는 `@google/gemini-cli`(본체)이고 `@google/gemini-cli-a2a-server`는 별도 패키지로 미사용 |

---

## 7. 미해결 / OPEN 추적 (2026-05-07 기준)

| PR | 이슈 | 상태 | bkit 영향 |
|---|---|---|---|
| #25827 | Issue #25655 — SessionStart `systemMessage` 중복 렌더 fix | **OPEN** | v0.40.0/.1, v0.41.0/.1/.2 **전부 미포함**. bkit SessionStart hook이 systemMessage 사용 시 여전히 중복 렌더링. 워크어라운드 (addItem 직접 호출 회피) 유지 필요 |

---

## 8. v0.41.2 단독 변경 상세 (사용자 사전 검증 사실 + PR 본문 직접 검증 결과)

### 8.1 릴리스 메타
- 태그: `v0.41.2`, `latest=true`, `prerelease=false`
- 발행: 2026-05-06T18:39:59Z
- 발행자: scidomino
- Compare: `v0.41.1...v0.41.2`

### 8.2 단일 cherry-pick 구조
- **cherry-pick PR**: #26589 (`fix(patch): cherry-pick 02995ba to release/v0.41.1-pr-26568 to patch version v0.41.1 and create version 0.41.2`)
  - 작성자: gemini-cli-robot, MERGED (kschaab Approved, auto-merge squash)
  - 변경: +284 / -39
- **원본 PR**: #26568 (`fix(a2a-server): Resolve race condition in tool completion waiting`)
  - 작성자: kschaab, MERGED (bdmorgan Approved)
  - commit: `02995ba939bcc592ac1ad9486f74a5708219a993`

### 8.3 영향 범위 (PR 본문 직접 검증)
- **단일 패키지**: `@google/gemini-cli-a2a-server` (별도 npm 패키지)
- **변경 파일 3개**:
  - `packages/a2a-server/src/agent/task.ts` (+42 / -39) — `isCompletionPromiseResolved` 상태 추적 도입, `_resetToolCompletionPromise`가 이전 promise가 settled된 경우에만 새로 생성, resolve/reject 핸들러가 상태 갱신
  - `packages/a2a-server/src/agent/task-event-driven.test.ts` (+69) — 이벤트 드리븐 스케줄러 테스트 (status mapping, tool confirmations, output updates, YOLO mode + parallel tool calls 엣지 케이스)
  - `packages/a2a-server/src/agent/race-condition.test.ts` (+173 신규) — 다중 sequential confirmation으로 hang 재현 + fix 검증
- **CLI 본체(`@google/gemini-cli`) 영향**: **없음** — `packages/cli/`, `packages/core/`, `packages/extension/` 모두 변경 0건

### 8.4 Breaking change 여부
- **없음**: PR 본문 "Pre-Merge Checklist"에서 `Noted breaking changes (if any)` 미체크. 원본 PR은 race condition 수정만 포함하고 외부 API/schema 변경 없음.

### 8.5 bkit 영향 평가
- **bkit 코드 grep 결과** (`a2a-server` 검색): 일치 1건 (`docs/01-plan/research/gemini-cli-v0.41.1-research.md:310` — v0.41.0 preview cycle 추가 cherry-picks 인용 텍스트). **소스/스크립트/패키지 의존 0건**.
- **bkit npm 의존**: `@google/gemini-cli` (본체)만 사용. `@google/gemini-cli-a2a-server`는 별도 패키지로 미사용.
- **결론**: **bkit 코드 변경 0건 필요**. v0.41.2 ↑ 시 단순 의존 버전 bump만 수행하면 됨.

---

## 9. bkit 활용 후보 신기능 (식별만, 결정은 P2/P3)

| # | PR | 기능 | bkit 활용 시나리오 (가설) | 활용 후보 등급 |
|---|---|---|---|---|
| C1 | #25395 | MCP resources (`list_mcp_resources` / `read_mcp_resource`) | bkit 정책/체크리스트/매뉴얼을 MCP server resource로 노출 → 에이전트 자동 탐색 | 🟢 **높음** |
| C2 | #25716 | 4-tier prompt-driven memory | bkit 메모리 영속화 정책을 ① project ② subdir ③ private ④ global 4-tier에 매핑 | 🟢 **높음** |
| C3 | #25601 | `experimental.autoMemory` 분리 토글 | bkit 자동 학습 파이프라인 활성/비활성 분리 | 🟡 중간 |
| C4 | #25873 | Auto-memory scratchpad persistence | `autoMemory: true`이면 자동 활용 | 🟡 중간 |
| C5 | #25720 | `tools.core` allowlist | bkit baseline runner 보안 강화 (단, 너무 좁히면 도구 차단) | 🟢 **높음** (옵트인) |
| C6 | #26060 | `--session-id` CLI flag | baseline runner 디버깅/재현용 session UUID 명시 | 🟡 중간 |
| C7 | #26118 | settings env var type cast | bkit `.gemini/settings.json` `${ENV:-default}` 패턴 검증 통과율 향상 | 🟢 **높음** (긍정) |
| C8 | #26068 | `gemini mcp list` ping optional + timeout | bkit MCP health check 정정 | 🟡 중간 |
| C9 | #25894 | CLI subcommand stdout pipe/redirect 정상화 | bkit 자동 검증 스크립트의 파이프 캡처 워크어라운드 제거 | 🟡 중간 |

---

## 10. 누적 통계 요약

| 카테고리 | 누적 건수 | 비고 |
|---|---|---|
| Breaking Changes | **7** | baseline 3 (B1~B3) + v0.41.x 신규 4 (B4~B7) |
| 새 기능 (significant) | **24** | baseline 15 + v0.41.x 9 (patch 0) |
| Deprecation 통보 (명시) | **0** | 행동 기반 deprecation 3건만 존재 |
| 설정/CLI flag/환경변수 변경 | **12** | settings 7, CLI flag 1, env 2, parser 1, schema 1 |
| 보안 / 프라이버시 패치 | **5** | #25022 (RCE), #25814 (Trust), #26153 (telemetry), #25935 (YOLO), #25874 (UX 보강) |
| bkit 관련 버그 수정 | **17** | v0.40.0: 8, v0.40.1: 1, v0.41.0: 7, v0.41.1: 1, v0.41.2: 0 (a2a-server only) |
| OPEN 미해결 | **1** | #25827 SessionStart systemMessage 중복 |
| **bkit 활용 후보 신기능** | **9** | C1~C9 (§9) |

---

## 11. 참고 링크 (PR / Release / 문서)

### 11.1 Releases
- v0.40.0: https://github.com/google-gemini/gemini-cli/releases/tag/v0.40.0
- v0.40.1: https://github.com/google-gemini/gemini-cli/releases/tag/v0.40.1
- v0.41.0: https://github.com/google-gemini/gemini-cli/releases/tag/v0.41.0
- v0.41.1: https://github.com/google-gemini/gemini-cli/releases/tag/v0.41.1
- **v0.41.2**: https://github.com/google-gemini/gemini-cli/releases/tag/v0.41.2

### 11.2 Compares
- v0.39.1...v0.40.0: https://github.com/google-gemini/gemini-cli/compare/v0.39.1...v0.40.0
- v0.40.0...v0.40.1: https://github.com/google-gemini/gemini-cli/compare/v0.40.0...v0.40.1
- v0.40.0...v0.41.0: https://github.com/google-gemini/gemini-cli/compare/v0.40.0...v0.41.0
- v0.41.0...v0.41.1: https://github.com/google-gemini/gemini-cli/compare/v0.41.0...v0.41.1
- **v0.41.1...v0.41.2**: https://github.com/google-gemini/gemini-cli/compare/v0.41.1...v0.41.2

### 11.3 v0.41.2 단독 핵심 PR
- #26568 (원본) `fix(a2a-server): Resolve race condition in tool completion waiting` — https://github.com/google-gemini/gemini-cli/pull/26568
- #26589 (v0.41.2 cherry-pick) — https://github.com/google-gemini/gemini-cli/pull/26589

### 11.4 v0.40.0 ~ v0.41.1 핵심 PR (본문 검증 완료)
- v0.40.0:
  - #25601 autoMemory split — https://github.com/google-gemini/gemini-cli/pull/25601
  - #25716 4-tier prompt-driven memory — https://github.com/google-gemini/gemini-cli/pull/25716
  - #25395 MCP resources tools — https://github.com/google-gemini/gemini-cli/pull/25395
  - #25022 IDE stdio RCE fix — https://github.com/google-gemini/gemini-cli/pull/25022
  - #25586 topic narration default-on — https://github.com/google-gemini/gemini-cli/pull/25586
  - #25342 ripgrep SEA bundling — https://github.com/google-gemini/gemini-cli/pull/25342
  - #25841 ripgrep npm tarball exclude — https://github.com/google-gemini/gemini-cli/pull/25841
  - #25814 Headless Trust Enforcement — https://github.com/google-gemini/gemini-cli/pull/25814
  - #25874 Trust error message docs link — https://github.com/google-gemini/gemini-cli/pull/25874
  - #25341 YOLO not downgraded — https://github.com/google-gemini/gemini-cli/pull/25341
- v0.40.1: #26153 logPrompts respect — https://github.com/google-gemini/gemini-cli/pull/26153 (cherry-pick #26268)
- v0.41.0:
  - #25720 tools.core + recursive shell validation — https://github.com/google-gemini/gemini-cli/pull/25720
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
- v0.41.1: #26542 YOLO redirection fix — https://github.com/google-gemini/gemini-cli/pull/26542 (cherry-pick #26545)

### 11.5 미해결 (OPEN)
- #25827 SessionStart systemMessage 중복 렌더 fix — https://github.com/google-gemini/gemini-cli/pull/25827 (Issue #25655)

### 11.6 baseline 보고서
- `docs/01-plan/research/gemini-cli-v0.40.0-research.md` (29,010 bytes, 2026-04-29)
- `docs/01-plan/research/gemini-cli-v0.41.1-research.md` (31,233 bytes, 2026-05-06)

---

## 12. 조사 신뢰도

| 항목 | 신뢰도 | 비고 |
|------|--------|------|
| 릴리스 타임라인 | ⬛⬛⬛⬛⬛ | gh release view로 5개 릴리스 직접 확인 |
| Breaking Changes (누적 7건) | ⬛⬛⬛⬛⬜ | baseline 3건 + v0.41.x 4건 PR 본문 직접 검증. bkit 영향은 추정 |
| 새 기능 (누적 24건) | ⬛⬛⬛⬛⬜ | 핵심 ~14건 본문 검증, 일부 release notes title 기반 |
| Deprecation | ⬛⬛⬛⬜⬜ | 명시 통보 0건 — 행동 기반 도출 (변동 가능성 낮음) |
| 설정 / 구성 변경 | ⬛⬛⬛⬛⬛ | PR #25601, #25586, #25720, #26118 본문 schema 직접 확인 + v0.40.0 baseline §0 정정 노트 (`GEMINI_CLI_TRUST_WORKSPACE` 변수명 CLI 실측) |
| v0.41.2 단독 변경 | ⬛⬛⬛⬛⬛ | PR #26568, #26589 본문 직접 검증 + 변경 파일 3개 명시. bkit grep 0건 검증 완료 |
| 보안 / 프라이버시 | ⬛⬛⬛⬛⬛ | PR #25022, #25814, #26153, #25935 본문 직접 확인 (PoC 포함) |
| bkit 영향 hint | ⬛⬛⬛⬜⬜ | **추정**. P2 코드 grep으로 확정 필요 |
| 활용 후보 (§9) | ⬛⬛⬛⬜⬜ | 식별만. 결정은 P3 brainstorm |

---

## 13. P2 영향 분석 우선순위 hint (누적)

> baseline 보고서 §11 + v0.41.1 보고서 §11에서 식별한 항목을 누적 우선순위로 재정렬:

1. **`mcp/bkit-server.js` / baseline runner shell 호출** — recursive shell validation + `tools.core` (PR #25720) — 🔴 회귀 위험 최우선
2. **baseline runner 보안 정책 / YOLO 모드** — fail-closed (PR #25935) — 🟠 행동 변화
3. **bkit `mcp/bkit-server.js`의 trust 환경변수** — `GEMINI_CLI_TRUST_WORKSPACE` 정확성 재검증 (이미 정확 사용 중이지만 v0.41.x에서 regression 없는지 확인) — 🟡 신뢰도 ⬛⬛⬛⬛⬛로 이미 검증됨
4. **bkit 메모리 영속화 코드** — `experimental.memoryManager` vs `experimental.autoMemory` 의미 분리 (PR #25601), 4-tier 새 경로 `~/.gemini/tmp/<hash>/memory/MEMORY.md` (PR #25716) — 🟠
5. **SessionStart hook 출력** — topic narration default-on (PR #25586) noisy 검증 — 🟠
6. **bkit `.gemini/settings.json` env var 사용처** — type cast 영향 (PR #26118) — 🟡 긍정 + 잠재 회귀
7. **bkit ACP 모드 + SessionEnd hook 사용 여부** — stdout pollution fix (PR #26125) 활용 가능성 — 🟡 개선 기회
8. **CLI subcommand 자동화** — pipe/redirect 정상화 (PR #25894), `gemini mcp list` ping (PR #26068) 활용 — 🟡 개선 기회
9. **bkit이 history JSON 파싱 코드 보유 여부** — ContextManager wire-up (PR #25409) 영향 — 🟠
10. **bkit-server의 MCP resources export 가능성** — `list_mcp_resources` 활용 (PR #25395) — 🟢 활용 기회
11. **Telemetry 운영 시 `logPrompts: false` 누설 차단** — v0.40.1 fix (PR #26153) 적용 확인 — 🟢 긍정
12. **a2a-server 의존 여부** — bkit grep 0건으로 v0.41.2는 영향 없음 확정 — ✅ **확정 완료** (P2 grep 불필요)

---

## 14. P2로 전달할 핵심 검증 질문 (누적)

(baseline + v0.41.1 보고서의 12개 질문에 v0.41.2 추가 사항 포함)

1. bkit `mcp/bkit-server.js`의 trust 우회 환경변수 = `GEMINI_CLI_TRUST_WORKSPACE` (검증 완료)
2. bkit이 `experimental.memoryManager`에서 (a) 서브에이전트 swap 또는 (b) background extraction 의도였는가?
3. bkit이 `~/.gemini/tmp/<hash>/memory/MEMORY.md` 새 경로를 사용/가정하는 코드?
4. bkit baseline runner가 topic narration default-on으로 noisy해지지 않는가?
5. bkit-server가 MCP resources를 export할 가치가 있는 정책/매뉴얼 자료?
6. bkit이 `bash -c`, `sh -c`, `$(...)`, `<(...)` wrapper/expansion 포함 shell 명령을 호출하는가? (PR #25720)
7. bkit이 YOLO 모드 + `argsPattern` 정의 + 복잡 shell 표현 호출하는가? (PR #25935)
8. bkit이 ACP 모드 + SessionEnd hook 정의하는가? (PR #26125)
9. bkit이 `gemini extensions list`, `gemini mcp list` 등을 파이프/리다이렉트로 캡처하는가? (PR #25894, #26068)
10. bkit이 `~/.gemini/tmp/<hash>/...` conversation log를 직접 파싱하는가? (PR #25409)
11. bkit `.gemini/settings.json`이 `${ENV:-default}` 패턴으로 boolean/number 사용하는가? (PR #26118)
12. bkit이 telemetry를 활성화하면서 `logPrompts: false`로 운영하는가? (PR #26153 / v0.40.1 보안)
13. **(v0.41.2)** bkit이 `@google/gemini-cli-a2a-server` 패키지에 의존하는가? — **검증 완료: 0건. P2 grep 불필요.**

---

**조사 완료**: 2026-05-07. P2 (영향 분석)로 전달.
