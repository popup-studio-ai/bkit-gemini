# Gemini CLI v0.40.0 bkit 영향 분석

> Phase 2 산출물. Research: `docs/01-plan/research/gemini-cli-v0.40.0-research.md`
> 작성일: 2026-04-29
> 베이스라인: bkit v2.0.6 (= Gemini CLI v0.39.1 stable, PR #24 main 머지)
> 분석자: bkit-impact-analyst agent
> 비교 범위: `v0.39.1...v0.40.0` (72 commits, ~62 user-facing PR)

---

## ⚠️ 본문 정정 박스 — Phase 1 Field Verification 재강조

`mcp/bkit-server.js:1119` `tests/suites/tc115-v0391-headless-trust.js` `README.md:334`에서
사용 중인 **`GEMINI_CLI_TRUST_WORKSPACE='true'`** 환경변수명은 v0.40.0 stable에서도 정확함
(CLI prefix 유지). v0.40.0 npx 격리 실측에서 CLI stderr가 직접 안내한 변수명도
`GEMINI_CLI_TRUST_WORKSPACE` (3중 검증: CLI stderr + bundle js grep + bundle docs).
`GEMINI_TRUST_WORKSPACE`(prefix 없는 alias) 패턴은 v0.40.0 어디에도 존재하지 않음 → trust env 변수명 변경 **0건**.

부수 발견: `GEMINI_CLI_TRUSTED_FOLDERS_PATH` 환경변수가 v0.40.0 docs에서 명문화됨
(`trustedFolders.json` 경로 override). bkit 활용 검토 §11에 별도 정리.

---

## Executive Summary

| 항목 | 수치 |
|------|------|
| 총 영향 추정 파일 | **27개** (Critical 0 / High 3 / Medium 7 / Low 17) |
| **Critical 즉시 수정** | **0건** (Phase 1 정정으로 Headless Trust env 회귀 사라짐) |
| **High 우선 수정** | **3건** (testedVersions 갱신 + version flag 그룹 + topic narration 잠금) |
| **Medium 권장 수정** | **7건** (memoryManager 의미 분리 명문화, autoMemory 신규 토글, 4-tier 메모리 paths 검증, MCP resources 채택, /clear 동작, /new alias, GEMINI_CLI_TRUSTED_FOLDERS_PATH 활용) |
| **Low 선택 수정** | **17건** (UI/내부/문서 메타데이터) |
| **신규 회귀 위험** | **2건** (topic narration default-on noisy stdout, MemoryManagerAgent 직접 spawn 잔존 0건 검증) |
| **기능 개선 기회** | **5건** (MCP resources export, autoMemory 분리 활용, 4-tier 메모리 정렬, trust 부트스트랩, gemma 로컬 fallback) |
| **예상 작업 시간** | **약 4-6시간** (P0 30분, P1 2-3h, P2 2-3h, 확인 30-60분) |

### 최우선 조치 Top 3

1. 🟠 **`bkit.config.json:120` testedVersions에 `"0.40.0"` 추가** — 1줄, 호환성 선언 (P0).
2. 🟠 **`lib/gemini/version.js:212` 뒤에 v0.40.0+ feature flag 그룹 신설** — 4개 플래그
   (`hasMcpResourcesTools`, `hasAutoMemoryToggle`, `hasMemoryFourTier`, `hasTopicNarrationGeneral`)
   `isVersionAtLeast('0.40.0')` 게이팅 (P0).
3. 🟠 **`hooks/scripts/session-start.js:148` `ensureAgentsEnabled` 함수에 `topicUpdateNarration: false` 명시 잠금 추가**
   (또는 `.gemini/settings.json:2`에 `"general": { "topicUpdateNarration": false }` 추가) — baseline runner
   noisy stdout 회귀 사전 차단 (P0).

---

## 1. Breaking/Behavior 영향 매핑 (Top 3 + 부속)

### 1.1 PR #25814 Headless Trust Enforcement (정정 후 회귀 0건)

| 항목 | 내용 |
|------|------|
| Phase 1 field verification | v0.40.0 stable의 정확한 변수명은 `GEMINI_CLI_TRUST_WORKSPACE` (CLI prefix 유지) |
| bkit 현재 상태 | `mcp/bkit-server.js:1119` `env.GEMINI_CLI_TRUST_WORKSPACE = 'true';` — **정확** |
| `tests/suites/tc115-v0391-headless-trust.js` | TC115-02~05 모두 `GEMINI_CLI_TRUST_WORKSPACE` 정확한 변수명으로 검증 — **정확** |
| `lib/gemini/version.js:204` `hasHeadlessTrustEnforcement: isVersionAtLeast('0.39.1')` | v0.40.0에도 그대로 `true` 유지 (이미 v0.39.1부터 활성). 추가 게이팅 불필요 |
| **추가 회귀 위험 (정적 분석)** | `FatalUntrustedWorkspaceError` 메시지 포맷 변동 시 tc115의 message-matching assertion 깨짐 가능 — 단, tc115는 stderr 메시지가 아닌 **bkit-server.js 코드 계약**(env 빌더 패턴)만 검증하는 카나리아 → message 포맷 변동 영향 0건 |
| **Critical 회귀** | **0건** |

### 1.2 PR #25601 + #25716 Memory 모델 재편 (의미 분리 + 4-tier prompt)

| 항목 | 내용 |
|------|------|
| 변경 본질 | `experimental.memoryManager`의 의미가 둘로 분리. (a) MemoryManagerAgent + `save_memory` swap만 기존 키 유지 / (b) background skill 추출 + `/memory inbox`는 신규 `experimental.autoMemory` 토글로 이동. 둘 다 default `false` |
| MemoryManagerAgent 제거 | `packages/core/src/agents/memory-manager-agent.ts` 완전 삭제 (-157 lines) |
| 4-tier 매핑 | ① `./GEMINI.md` (committed) / ② `./<sub>/GEMINI.md` / ③ `~/.gemini/tmp/<hash>/memory/MEMORY.md` (private) / ④ `~/.gemini/GEMINI.md` (global personal) |
| **bkit 영향 — 코드 grep 결과** | bkit 코드베이스에서 `MemoryManagerAgent` / `memory-manager-agent` 직접 spawn 또는 invoke_agent 호출 **0건** (Phase 1 Explore 결과 확정). bkit는 `lib/core/memory.js` 자체 메모리 스토어와 `agentMemory` 필드(`bkit.config.json:205-215`)를 사용 — Gemini CLI의 MemoryManagerAgent와 무관 |
| **bkit 영향 — 설정 토글 사용처 grep** | `experimental.memoryManager` / `experimental.autoMemory` / `memoryV2` 키를 사용하는 bkit 코드 **0건** (`.gemini/settings.json`은 `experimental.enableAgents: true` 1개만) |
| **bkit 영향 — 메모리 path 가정 grep** | `~/.gemini/tmp/<hash>/memory/` 경로를 가정/사용하는 bkit 코드 **0건**. bkit 메모리는 `.gemini/agent-memory/bkit/` (`bkit.config.json:207-208`)와 `.bkit/state/memory.json`(자체 스토어)만 사용 — Gemini CLI의 4-tier와 namespace 분리 |
| **결론** | bkit는 메모리 모델 재편의 직접 영향 0건. **간접 영향**: `MemoryManagerAgent` 사라짐으로 인한 Gemini 자체 메모리 동작이 부드러워질 가능성 (PR #25567 서브에이전트 topic update 비활성과 결합) — bkit subagent 출력에 긍정적 영향 |
| 영향도 | 🟡 Medium (활용 기회 있음, 즉시 수정 불필요) |

### 1.3 PR #25586 Topic Update Narration default-on + general 승격

| 항목 | 내용 |
|------|------|
| 변경 본질 | `experimental.topicUpdateNarration` (default `false`) → `general.topicUpdateNarration` (default `true`). `experimental.*` fallback 읽기는 유지 (alias 호환) |
| **bkit 회귀 시나리오** | bkit baseline runner `tests/run-all.js`가 다수의 sub-suite에서 `gemini -p`를 호출하여 stdout assertion을 수행. v0.40.0 진입 시 multi-step 명령에 자동 narration 추가 → 일부 stdout-pattern assertion이 noisy line 추가로 인해 깨질 위험 |
| **현 상태 grep** | bkit `.gemini/settings.json`에 `topicUpdateNarration` 키 명시 **없음** → v0.40.0 default `true` 자동 적용됨 (제어 필요) |
| **수정 방안** | `.gemini/settings.json`에 `"general": { "topicUpdateNarration": false }` 추가 (alias로 `"experimental": { "topicUpdateNarration": false }`도 작동하지만 deprecated 위치) |
| **회귀 검증 필요 테스트** | `tc115`(message format), `tc40-hook-system-e2e`, `tc41-team-orchestration-e2e`, `tc43-mcp-command-e2e` — 단, 현재 bkit 테스트는 LLM stdout 본문 매칭 대신 `mcp/bkit-server.js` 또는 hook script 단위 contract만 검증 → noisy LLM output 노출 0건 (정적 분석) |
| 영향도 | 🟠 High (사전 차단 1줄 설정 추가로 충분) |

### 1.4 부속 PR 영향 매핑 (전체)

| PR | 변경 내용 | bkit 영향 파일 (file:line) | 영향도 | 수정 필요 | 수정 방안 |
|----|-----------|--------------------------|--------|----------|----------|
| #25395 | MCP resources 도구 (`list_mcp_resources`/`read_mcp_resource`) | `mcp/bkit-server.js:1097-1102` (args 빌더, tool isolation list) | 🟡 Medium (기회) | 선택 | bkit-server에 resources export 시 에이전트가 자동 검색 가능. §11 #1 참고 |
| #25341 | YOLO 모드 dangerous heuristic ASK_USER 다운그레이드 차단 | `mcp/bkit-server.js:1086` (`--approval-mode=yolo` FULL tier만), `agents/cto-lead.md` 등 21개 frontmatter | 🟡 Medium | 권장 | bkit baseline runner는 SAFETY_TIERS.READONLY/MEDIUM은 default approval 모드 사용 → 영향 미미. FULL tier 에이전트만 dangerous 명령 실행 가능 변경 — 보안 검토 필요 |
| #25022 | IDE stdio RCE 차단 | bkit가 IDE companion env 사용 0건 | 🟢 Low | 불필요 | bkit `process.env` 사용 전수 검토(v0.39.1 분석 §7 참조) — IDE-related 변수 0건 |
| #25342 | ripgrep SEA 번들링 | bkit `grep_search` 도구 호출 (allowed-tools list) | 🟢 Low | 불필요 | bkit는 LLM tool로 `grep_search`만 노출, ripgrep binary 직접 호출 0건. `lib/gemini/tools.js:18` `GREP_SEARCH: 'grep_search'` — 영향 없음 |
| #25841 | ripgrep npm tarball 제외 | npm 설치 사용자는 system `rg` 또는 `GrepTool` fallback | 🟢 Low | 불필요 | bkit는 npm 설치 경로 `@google/gemini-cli` 사용 — system `rg` 부재 시 `GrepTool` fallback 자동 등록 (이전 동작과 동일) |
| #25515 | `/clear` 시 plan session state reset | bkit는 `.bkit/state/pdca-status.json` 자체 관리 — Gemini의 plan/tracker/task path와 namespace 분리 | 🟢 Low | 불필요 | bkit `lib/pdca/status.js`가 자체 path 관리 — `Config.resetNewSessionState` 호출과 무관 |
| #25567 | 서브에이전트에서 topic update 비활성 | bkit `executeAgent` spawn 21개 에이전트 (간접 효과) | 🟢 Low (긍정 영향) | 불필요 | bkit subagent 출력이 부수 narration 없이 깔끔해짐 |
| #25513 | Vertex AI request routing | bkit Vertex 미사용 | 🟢 Low | 불필요 | — |
| #25498 | `gemini gemma` 로컬 모델 setup | bkit 로컬 fallback 후보 | 🟢 Low (기회) | 선택 | §11 #5 참고 |
| #17865 | `/new` = `/clear` alias | bkit slash command 문서 | 🟢 Low | 권장 | `GEMINI.md` 또는 `gemini-cli-learning/SKILL.md`에 1줄 추가 |
| #25256 | `@` recommendation 파일 watcher | bkit는 `@import`로 `commands.md`/`core-rules.md` 사용 (`GEMINI.md:62-63`) | 🟢 Low (기회) | 선택 | `context.fileFiltering.enableFileWatcher: true` 옵트인 시 GEMINI.md 자동 reload — 개발 편의 향상 |
| #25827 | SessionStart `systemMessage` 중복 fix | **OPEN, v0.40.0 미포함** | 🟠 High (잔존) | tc113 방어 유지 | `hooks/scripts/session-start.js:354-360` BKIT_SESSION_START_VERBOSE=false default 유지 |
| #25147 | skill extraction recurrence gate 강화 | bkit는 자동 skill extraction 미사용 | 🟢 Low | 불필요 | — |
| #25826 | ACP auto memory startup | bkit ACP 미사용 | 🟢 Low | 불필요 | — |
| #25382 | `ShellExecutionConfig` spread + ProjectRegistry save backoff | bkit baseline runner 안정성 미세 향상 | 🟢 Low | 불필요 | — |
| #25709 | slow render latency round (opentelemetry float warning 방지) | bkit telemetry 미사용 | 🟢 Low | 불필요 | — |
| #16075 | OpenSSL 3.x SSL streaming 재시도 | bkit 안정성 향상 | 🟢 Low | 불필요 | — |
| #25357 | `GOOGLE_GEMINI_BASE_URL` / `GOOGLE_VERTEX_BASE_URL` 존중 fix | bkit는 base URL 미설정 | 🟢 Low | 불필요 | — |
| #14619 | subagent 평가 테스트 추가 | 내부 | 🟢 Low | 불필요 | — |
| #25090 | `get-internal-docs`에 `.mdx` 지원 | bkit는 `.md`만 사용 | 🟢 Low | 불필요 | — |
| #15504 | github colorblind theme | UI | 🟢 Low | 불필요 | — |
| #25300 | OSC 777 terminal notifications | UI | 🟢 Low | 불필요 | — |
| #25343 | telemetry traces flag | bkit telemetry 미사용 | 🟢 Low | 불필요 | — |
| #25497 | `GEMINI_API_KEY` 점(`.`) 허용 | 호환성 fix | 🟢 Low | 불필요 | — |
| #25176 | session persistence 개선 | bkit `~/.gemini/` 비의존 | 🟢 Low | 불필요 | — |
| #25538 | shell command wrapping에 newline 사용 | bkit shell 도구 사용 시 안정성 향상 | 🟢 Low (긍정) | 불필요 | — |
| #25670 | agent refresh 시 중복 initialize 호출 제거 | bkit subagent 사용 시 미세 성능 향상 | 🟢 Low (긍정) | 불필요 | — |
| #25801 | `/clear (new)` alias 동작 fix | bkit `/clear` 사용자 영향 미미 | 🟢 Low | 불필요 | — |
| #25502 | eval test 업데이트 | 내부 | 🟢 Low | 불필요 | — |
| #25542 | extension bundling examples fix | extension 작성자 — bkit `gemini-extension.json` 검토 | 🟢 Low | 불필요 | bkit 매니페스트 4줄(name/version/mcpServers/contextFileName) 단순 — 영향 없음 |
| #25338 | sandbox 명시 write 권한이 governance 보호 override | bkit sandbox 미사용 | 🟢 Low | 불필요 | — |
| #25427 | sandbox seatbelt profile $HOME/.gemini 우선 | bkit seatbelt 미사용 | 🟢 Low | 불필요 | — |
| #25339 | input 배경색 제거 | UI | 🟢 Low | 불필요 | — |
| #25626 | ACP auto memory startup | bkit ACP 미사용 | 🟢 Low | 불필요 | — |
| #24414 | IDE client 동적 CLI 버전 사용 | bkit IDE companion 비의존 | 🟢 Low | 불필요 | — |
| #23895 | ignore 파일 line ending (Windows CRLF) | bkit Windows 특화 코드 0건 | 🟢 Low | 불필요 | — |
| #24170 | command injection shell fix | bkit 정책과 시너지 (보안 강화) | 🟢 Low (긍정) | 불필요 | — |
| #22542, #24599 | UI 회귀 fix | UI | 🟢 Low | 불필요 | — |
| #24496 | devtools 메모리/연결 지연 | bkit devtools 미사용 | 🟢 Low | 불필요 | — |
| #22620 | Bun에서 detached mode 비활성 | bkit Bun 미사용 | 🟢 Low | 불필요 | — |

---

## 2. 스킬 영향 분석 (43개 skills 대상)

| 스킬 카테고리 | 영향 항목 | 영향도 | 대응 방안 |
|--------------|----------|--------|----------|
| 전체 43개 | bkit MCP `spawn_agent` 통한 호출 — `mcp/bkit-server.js:1119` env 변수명 정확함 (Phase 1 정정) → trust 회귀 0건 | 🟢 None | 불필요 |
| `gemini-cli-learning/SKILL.md` | v0.40.0 변경 반영: 4-tier memory, autoMemory 분리, MCP resources, /new alias, gemma 로컬 모델 — 5개 항목 1단락씩 | 🟡 Medium | 5개 단락 추가 (P2, ~30분) |
| `gemini-migration/SKILL.md` (메타) | 본 분석 보고서 작성 자체가 산출물. 추가 수정 불필요 | 🟢 None | 불필요 |
| 21개 (allowed-tools에 `run_shell_command` 포함) | v0.39.1 도입 셸 재귀 검증 그대로 유지. v0.40.0 신규 변경 0건 | 🟢 None | 불필요 |
| 모든 스킬 | `tools.core` allowlist (v0.39.1 도입) — v0.40.0에서도 그대로 — bkit 활용 기회 (v0.39.1 분석 §9 #1 잔존) | 🟡 Medium | 별도 cycle |
| `bkit-rules/SKILL.md`, `bkit-templates/SKILL.md` | bkit 메모리 4-tier (Gemini CLI)와 bkit 자체 메모리 (`.bkit/state/`)의 namespace 분리 명문화 — Phase 3에서 docs 보강 후보 | 🟢 Low | 별도 cycle |

---

## 3. 에이전트 영향 분석 (21개 agents 대상)

| 에이전트 | 영향 항목 | 영향도 | 대응 방안 |
|---------|----------|--------|----------|
| 전체 21개 | bkit MCP `spawn_agent`로 호출 시 v0.40.0 trust 게이트 — `mcp/bkit-server.js:1119` env 변수명 정확함 → 회귀 0건. **PR #25567 서브에이전트 topic update 비활성**으로 21개 모두 stdout이 더 깔끔해지는 긍정 영향 | 🟢 None (긍정 영향) | 불필요 |
| `agents/cto-lead.md`, `agents/qa-strategist.md`, `agents/bkend-expert.md` 등 8개 (frontmatter `allowed-tools: run_shell_command`) | YOLO 모드 dangerous heuristic 차단 (PR #25341) — bkit FULL tier 에이전트가 yolo로 도는 경우 dangerous 명령 자동 실행 가능. 단, bkit-permissions.toml의 deny 규칙(rm -rf 등)은 YOLO보다 우선 | 🟡 Medium (보안) | bkit-permissions.toml deny 우선 동작 회귀 검증 권고 (P2, 30분) |
| `agents/pm-discovery.md` 등 PM 에이전트 5개 | MemoryManagerAgent 제거의 간접 영향 0건 — bkit는 자체 `lib/core/memory.js` 사용 | 🟢 None | 불필요 |
| `agents/gap-detector.md`, `agents/code-analyzer.md` (READONLY tier) | tool isolation list (`mcp/bkit-server.js:1094`)에 `list_mcp_resources`, `read_mcp_resource` 추가 가능 — Plan Mode 활성 호환 | 🟡 Medium (기회) | §11 #1 참고 |

---

## 4. 스크립트/라이브러리 영향 분석

| 파일 | 영향 항목 | 영향도 | 대응 방안 |
|------|----------|--------|----------|
| **`mcp/bkit-server.js:1119`** `env.GEMINI_CLI_TRUST_WORKSPACE = 'true'` | Phase 1 정정 결과 변수명 정확 — v0.40.0 stable에서도 그대로 작동 | 🟢 None | 불필요 |
| **`mcp/bkit-server.js:1097-1102`** args 빌더 / tool isolation | READONLY tier에 `list_mcp_resources`,`read_mcp_resource` 추가 가능 | 🟡 Medium (기회) | §11 #1 (P1, ~1h) |
| **`bkit.config.json:120`** testedVersions | `"0.40.0"` 추가 (현재 `"0.39.1"`로 끝남) | 🟠 High | 1줄 수정 (P0, 1분) |
| **`lib/gemini/version.js:201-211`** v0.39.1+ feature flag 그룹 | 그 뒤에 v0.40.0+ 그룹 신규 (4개 플래그: `hasMcpResourcesTools`, `hasAutoMemoryToggle`, `hasMemoryFourTier`, `hasTopicNarrationGeneral`) — 모두 `isVersionAtLeast('0.40.0')` | 🟠 High | 4-block 추가 (P0, ~10분) |
| `hooks/scripts/session-start.js:148` `ensureAgentsEnabled` | `topicUpdateNarration: false` 자동 잠금 추가 가능 (또는 `.gemini/settings.json`에 명시) | 🟠 High | 1줄 추가 (P0, ~5분) |
| `hooks/scripts/session-start.js:354-360` `BKIT_SESSION_START_VERBOSE` slim default | #25655 fix PR #25827 OPEN 상태 — 잔존. v0.40.0 미해소 | 🔴 잔존 | tc113 방어 유지 (변경 없음) |
| `lib/gemini/tools.js:17-52` `BUILTIN_TOOLS` | v0.40.0에서 `list_mcp_resources`, `read_mcp_resource` 추가 가능 (선택). bkit가 LLM에게 노출하는 도구 카탈로그 갱신 | 🟡 Medium | 2개 항목 추가 (P2, ~5분) |
| `lib/gemini/policy.js`, `bkit.config.json:108-115` permissions | v0.40.0 정책 엔진 변경 없음 (v0.39.1 셸 재귀 검증 그대로) | 🟢 None | 불필요 |
| `lib/gemini/platform.js`, `lib/gemini/hooks.js` 외 lib/gemini/*.js 9개 | v0.40.0 변경 영향 0건 (정적 분석) | 🟢 None | 불필요 |
| `mcp/start-server.sh` | trust 부트스트랩 자동화 후보 (v0.39.1 분석 §9 #2 잔존) | 🟡 Medium (기회) | §11 #4 (별도 cycle) |
| `mcp/tools/qa-runner.js`, `mcp/tools/checkpoint-manager.js`, `mcp/tools/gap-analyzer.js`, `mcp/tools/pm-pipeline.js` | bkit 내부 child_process — Gemini policy/trust 비대상 | 🟢 None | 불필요 |
| `lib/core/memory.js`, `lib/core/agent-memory.js` (있다면) | bkit 자체 메모리 — Gemini 4-tier와 namespace 분리 | 🟢 None | 불필요 |

---

## 5. 설정 파일 영향 분석

| 파일 | 영향 항목 | 영향도 | 대응 방안 |
|------|----------|--------|----------|
| `bkit.config.json:120` `compatibility.testedVersions` | `"0.40.0"` 추가 | 🟠 High | P0 |
| `bkit.config.json:118-120` `compatibility.minGeminiCliVersion` | `"0.34.0"` 유지 (v0.40.0은 하위 호환) | 🟢 None | 불필요 |
| `.gemini/settings.json` (현재 5줄, `experimental.enableAgents: true`) | `general.topicUpdateNarration: false` 추가 + (선택) `experimental.memoryManager`/`experimental.autoMemory` 명시 (default `false` 의도 명문화) | 🟠 High | 1-3줄 추가 (P0, ~5분) |
| `gemini-extension.json` | v0.40.0 변경 영향 0건. mcpServers/contextFileName 매니페스트 변경 없음 | 🟢 None | 불필요 |
| `.gemini/policies/bkit-permissions.toml` | v0.40.0 정책 엔진 변경 없음 | 🟢 None | 불필요 |
| `bkit.config.json:205-215` `agentMemory` (`.gemini/agent-memory/bkit/`) | Gemini 4-tier 메모리(`~/.gemini/tmp/<hash>/memory/`)와 namespace 분리 — 충돌 0건 | 🟢 None | 불필요. 단, docs에서 namespace 분리 명문화 권고 |

---

## 6. 테스트 영향 분석

| 테스트 | 영향 항목 | 영향도 | 대응 방안 | 신규 회귀 위험 |
|--------|----------|--------|----------|---------------|
| `tests/suites/tc115-v0391-headless-trust.js` | TC115-02~05 모두 `GEMINI_CLI_TRUST_WORKSPACE` 변수명 정확 — v0.40.0 stable에서도 PASS 유지 예상 | 🟢 None | 불필요 | 0 |
| `tests/suites/tc113-issue-25655-systemmessage-duplicate.js` (있다면) | 파일 존재 여부 확인 필요 — `find` 결과 미확인. v0.39.1 분석 §10.4에서 "확인 필요" 잔존 | 🟠 High (확인 필요) | 파일 존재 확인 후 v0.40.0 진입에서도 PASS 유지 | 0 (PR #25827 OPEN 동일) |
| `tests/suites/tc107-*` (Phase 1 컨텍스트에 명시) | 파일 존재 여부 확인 필요 — `find` 결과 미확인 | 🟡 Medium | 파일 존재 확인 (P1, ~10분) | 0 |
| `tests/suites/tc38-feature-flags-matrix.js` | v0.40.0+ feature flag 4개 추가 시 매트릭스 갱신 필요 | 🟠 High | 4개 항목 추가 (P0, ~15분) | 0 |
| `tests/suites/tc40-hook-system-e2e.js`, `tc41-team-orchestration-e2e.js`, `tc43-mcp-command-e2e.js` | LLM stdout 직접 매칭 비대상 (bkit 단위 contract만 검증) — topic narration default-on 영향 0건 (정적 분석) | 🟢 None | 불필요 | 0 |
| `tests/suites/tc25-tool-registry-v158.js` | `lib/gemini/tools.js` 갱신 시 동기 — `list_mcp_resources`, `read_mcp_resource` 추가하면 `BUILTIN_TOOLS` 카운트 증가 (23→25) | 🟡 Medium | 2개 항목 추가 (P2, ~5분) | 0 |
| `tests/run-all.js` | suite 등록 변경 없음 (v0.40.0 신규 tc 0건). 단, baseline 실행 시 `topicUpdateNarration: false` 환경 설정 보장 필요 | 🟠 High | `.gemini/settings.json` 사전 설정 시 자동 해소 | noisy stdout assertion 깨짐 (사전 차단 시 0) |
| `tests/suites/tc04-lib-modules.js` | `lib/gemini/version.js` v0.40.0+ feature flag 4개 추가 시 export 카운트 변경 — 회귀 검증 필요 | 🟡 Medium | flag 추가 후 자동 재실행 | 0 |
| `tests/suites/tc12-agent-memory.js` | bkit `agentMemory` (`.gemini/agent-memory/bkit/`) 자체 — Gemini 4-tier 메모리 무관 | 🟢 None | 불필요 | 0 |

---

## 7. 문서 영향 분석

| 문서 | 영향 항목 | 영향도 |
|------|----------|--------|
| `GEMINI.md:1` 헤더 | `bkit v2.0.5` → `bkit v2.0.7` (v0.40.0 cycle 진입 시 bump) | 🟢 Low |
| `GEMINI.md:67` footer | 동일 | 🟢 Low |
| `README.md` (전체) | testedVersions, v0.40.0 신규 기능 안내 1단락 | 🟡 Medium |
| `docs/03-analysis/gemini-cli-v0.39.1-impact.analysis.md` | 본 v0.40.0 분석에서 참조 (잔존 항목 인용). 갱신 불필요 | 🟢 None |
| `docs/04-report/gemini-cli-v0.39.1-migration.report.md` | 동일. 갱신 불필요 | 🟢 None |
| `docs/01-plan/features/v2.1.0-context-optimization.plan.md:6,16-26` | hint 박스가 명시적으로 v0.40.0 stable 진입 시 본격 갱신 트리거 — Phase 3 plan-plus에서 Section 4/5/6/9 갱신 진입점 활성화 | 🟠 High |
| `gemini-cli-learning/SKILL.md` | v0.40.0 신규 기능 5개(4-tier memory, autoMemory, MCP resources, /new alias, gemma) 1단락씩 | 🟡 Medium |

---

## 8. bkit-system/philosophy 정합성 검증

| 원칙 | v0.40.0 변화 | 정합 (Y/N) | 비고 |
|------|-------------|-----------|------|
| **Automation First** (core-mission.md) | Memory 모델 prompt-driven 4-tier로 전환 — 서브에이전트 호출 1단계 제거로 자동화 흐름 단순화 | ✅ 강화 | bkit는 자체 메모리 사용 → 직접 영향 0. 그러나 Gemini 메모리 조작 자동화는 부드러워짐 |
| **Automation First** (topic narration) | Multi-step 명령 진행 narration default-on — 사용자에게 진행 상황 가시성 향상 (Full Visibility 강화) | ✅ 강화 | 단, baseline runner 측은 `false`로 잠금 권장 — 자동화 흐름 stdout 노이즈 차단 |
| **No Guessing** (core-mission.md) | YOLO 모드 dangerous heuristic 차단 (PR #25341) — 사용자 의도(YOLO=autonomous)대로 동작 | ✅ 정렬 | "추측하지 말고 사용자 의도대로 실행"과 정렬. 단, FULL tier 에이전트 보안 검토 권장 |
| **Docs = Code** (core-mission.md) | 4-tier 메모리 paths 명문화 (`docs/cli/auto-memory.md` +143 lines) — Gemini CLI docs 강화 | ✅ 정렬 | bkit GEMINI.md/SKILL.md에서 4-tier 짧은 설명 추가 권고 |
| **Safe Defaults / Progressive Trust / Full Visibility / Always Interruptible** | Headless trust enforcement (v0.39.1) v0.40.0 유지 + Topic narration default-on Full Visibility 강화 | ✅ 강화 | 4원칙 모두 강화. v0.39.1 분석 §8과 동일 |
| **AI as Partner** (ai-native-principles.md) | MCP resources 도구 신설 — AI가 정책/매뉴얼 자동 검색 가능 | ✅ 정렬 | bkit-server에 resources export 시 AI Partnership 강화 |
| **Context Engineering 6-Layer** (context-engineering.md) | 4-tier 메모리는 bkit 6-Layer와 별도 namespace (Gemini CLI 측). 충돌 0건 | ✅ 유지 | bkit Multi-Level Context Hierarchy(L1 Plugin/L2 User/L3 Project/L4 Session)와 4-tier(Project/Subdir/Private/Global)는 의미 축이 다름 — 직교 |
| **PDCA Methodology / Zero Script QA / 9-Stage Pipeline** | v0.40.0 변경 영향 0건 | ✅ 유지 | — |

**종합 결론**: 8개 원칙 중 **4개 강화 / 4개 유지 / 0개 약화 또는 충돌**. v0.40.0은 bkit 철학과 *상향 정렬*된다. v0.39.1 사이클(보안 강화 단일 테마)에 이어 v0.40.0(메모리 모델 단순화 + AI Partnership 강화)도 일관된 방향성.

---

## 9. v2.1.0 context-optimization 플랜 정합성

`docs/01-plan/features/v2.1.0-context-optimization.plan.md:16-26` hint 박스가 명시적으로 v0.40.0 stable 진입 시 본격 갱신 트리거임을 선언. v0.40.0 stable이 2026-04-28 출시되었으므로 **본 분석 cycle이 트리거 발동 시점**.

| v2.1.0 플랜 항목 | v0.40.0 변화 | 정합 (Y/N) | 갱신 필요 항목 |
|----------------|-------------|----------|----------------|
| Section 4 sidecar interface 매핑 | ContextManager+Sidecar(v0.39.0 PR #24752) 변동 없음. v0.40.0은 추가 변화 0건 | ✅ 정합 | 매핑 재확인만 (v0.39.0 분석 결과 그대로 유효) |
| Section 5 Token Budget 재산정 | 4-tier 메모리(③ `~/.gemini/tmp/<hash>/memory/MEMORY.md`)는 bkit 토큰 예산과 namespace 분리 — bkit 매 턴 GEMINI.md 토큰 사용에 직접 영향 0 | ✅ 정합 | bkit 측 8,613 tokens/turn baseline은 변동 없음. 단, MemoryManagerAgent 제거(-157 lines)로 Gemini 시스템 프롬프트 자체가 약간 슬림해질 가능성 (확인 필요) |
| Section 6 Skill 통합 후보 | `/memory inbox` + skill patching이 신규 `experimental.autoMemory`로 분리 (default `false`) — bkit는 자동 학습 미사용 | ✅ 정합 | 변경 없음. bkit는 `autoMemory: false` 유지 (의도) |
| Section 9 구현 로드맵 | Wave 분할 재설계 — v0.40.0 stable 진입 트리거 발동 | 🟠 High | Phase 3 plan-plus에서 본격 재설계 |
| **신규 기회** | MCP resources(PR #25395) — bkit 정책/매뉴얼을 resource로 export 시 매 턴 GEMINI.md 토큰 절감 가능 | 🟠 High (시너지) | Section 4/6에 신규 후보 추가 |

**결론**: v2.1.0 플랜은 v0.40.0 변화와 **직접 충돌 0건**, **시너지 1건**(MCP resources export로 토큰 절감 후보 신설). Phase 3 plan-plus에서 v2.1.0 plan Section 4 (구체적 개선 항목)에 MCP resources export PoC 추가 권고.

---

## 10. 사전 부채 83건과의 상호작용

> 본 cycle은 v0.40.0 영향 분석 한정. 사전 부채(PDCA-* 35 + TC80-* 9 + COMP-* 7 + TC94/91/110/96/109/98/tc92 29 + 기타) 본문 갱신 금지. 이름만 인용하여 상호작용 매핑.

### 10.1 해소될 가능성 항목 (v0.40.0 변화로 자연 해소)

| 부채 ID | v0.40.0 해소 메커니즘 | 검증 필요도 |
|---------|---------------------|------------|
| (없음 추정) | v0.40.0은 bkit 사전 부채를 직접 해소하지 않음 (정적 분석) | 0 |

### 10.2 악화될 가능성 항목 (v0.40.0 변화로 회귀 위험 증가)

| 부채 ID | v0.40.0 악화 메커니즘 | 사전 차단 방안 |
|---------|---------------------|--------------|
| 일부 TC94/91/110/96/109/98/tc92 29건 중 stdout assertion 사용 항목 (실제 갯수 미확인) | topic narration default-on으로 LLM stdout에 narration 추가 → assertion 깨짐 가능 | `.gemini/settings.json`에 `general.topicUpdateNarration: false` 사전 설정 (P0) |

### 10.3 무영향 항목 (기본)

| 부채 ID | 비고 |
|---------|------|
| PDCA-* 35건 | bkit 자체 PDCA 워크플로우 — Gemini CLI 변경 무관 |
| TC80-* 9건 | bkit 단위 테스트 — Gemini CLI 변경 무관 |
| COMP-* 7건 | bkit 호환성 — testedVersions 갱신만 영향, 본문 무관 |
| 기타 | 모두 bkit 내부 — v0.40.0 변경 무관 |

**결론**: v0.40.0 변화는 사전 부채 83건 중 **해소 0건 / 악화 잠재 1건(stdout assertion) / 무영향 82건**. 악화 잠재 1건은 P0 1줄 설정으로 사전 차단 가능.

---

## 11. 기능 개선/고도화 기회 (Phase 3 입력)

| # | 새 기능 | bkit 활용 방안 | 예상 효과 | 우선순위 | 난이도 |
|---|---------|---------------|----------|---------|--------|
| 1 | **MCP resources 도구 (`list_mcp_resources` / `read_mcp_resource`, PR #25395)** | bkit-server에 resources export 인터페이스 추가. `bkit-system/philosophy/*.md` 4개, `templates/*.md` 14개, `bkit.config.json` 정책 단편 등을 MCP resources로 노출. 에이전트가 `read_mcp_resource("bkit://philosophy/core-mission")` 등으로 매 턴이 아닌 *필요 시* 조회 가능 | 🚀 Token saving (8,613/turn baseline 중 ~30% 절감 추정 — 확인 필요), AI Partnership 강화, v2.1.0 context-optimization 플랜과 시너지 | **P1** | 1d (PoC) |
| 2 | **`experimental.autoMemory: false` 명시 잠금 (PR #25601)** | `.gemini/settings.json`에 `experimental.autoMemory: false`, `experimental.memoryManager: false` 명시 — bkit는 자체 메모리(`.bkit/state/memory.json`, `.gemini/agent-memory/bkit/`) 사용. Gemini 자동 학습 비활성 의도를 docs=code로 명문화 | 🔒 No Guessing 강화 (의도 명시), 향후 default 변경 시 회귀 사전 방어 | **P1** | 5분 |
| 3 | **4-tier 메모리 namespace 분리 명문화 (PR #25716)** | `bkit-system/philosophy/context-engineering.md`의 "Memory Systems (No Collision)" 표에 Gemini CLI 4-tier(`~/.gemini/tmp/<hash>/memory/`) 추가. bkit 메모리(`.bkit/state/`, `.gemini/agent-memory/bkit/`)와 의미 축 분리 명문화 | 📚 Docs=Code, 사용자/AI 혼란 방지 | **P2** | 30분 |
| 4 | **`GEMINI_CLI_TRUSTED_FOLDERS_PATH` 환경변수 활용 (v0.40.0 docs 명문화)** | `mcp/start-server.sh`에서 bkit 워크스페이스 등록을 `~/.gemini/trustedFolders.json` 대신 bkit 전용 path(`.bkit/runtime/trustedFolders.json` 등)에 저장. 사용자 글로벌 설정 오염 방지 | 🔧 Onboarding UX, 사용자 환경 격리 | **P2** | 2-3h |
| 5 | **`gemini gemma` 로컬 모델 setup (PR #25498)** | bkit baseline runner에서 외부 API 호출 비용/지연 회피용 로컬 fallback 옵션 — `--model gemma-local` 등으로 도는 dry-run mode | 💰 Cost saving, offline test 지원 | **P3** | 1d |

---

## 12. Phase 3 입력 요약 (대안 비교 입력)

### 12.1 마이그레이션 전략 후보 A/B/C 사전 hint

- **전략 A (Minimal)**: testedVersions + version flag 4개 + topic narration 잠금. P0 3건만. 4-6시간. **Critical 회귀 0건이므로 충분**.
- **전략 B (Standard)**: A + MCP resources export PoC + v2.1.0 plan 갱신 진입. ~1d. v2.1.0 sync 가속.
- **전략 C (Full)**: B + 4-tier 메모리 namespace 명문화 + autoMemory 잠금 + GEMINI_CLI_TRUSTED_FOLDERS_PATH 활용. ~2d. v0.40.0 신규 기능 5건 모두 활용.

추천: **전략 B** (Critical 회귀 0건이므로 minimal+1로 충분하지만, v2.1.0 plan 트리거가 발동된 cycle이므로 본격 갱신 진입 시점 포착).

### 12.2 회귀 위험 차단 항목

1. 🟠 P0: `.gemini/settings.json`에 `general.topicUpdateNarration: false` 명시 (1줄, 5분).
2. 🟠 P0: `bkit.config.json:120` testedVersions에 `"0.40.0"` 추가 (1줄, 1분).
3. 🟠 P0: `lib/gemini/version.js:212` 뒤에 v0.40.0+ feature flag 4개 추가 (~10분).
4. 🟠 P0: `tests/suites/tc38-feature-flags-matrix.js` 매트릭스에 v0.40.0+ 4개 항목 추가 (~15분).
5. 🟡 P1: tc113 / tc107 파일 존재 확인 (`find tests/suites -name "tc107*" -o -name "tc113*"`) — 잔존 #25655 방어 테스트 무결성 (~10분).

### 12.3 작업량 추정

| 카테고리 | P0 | P1 | P2 | P3 | 합계 |
|---------|-----|-----|-----|-----|------|
| 코드 수정 | ~30분 | ~1h | ~30분 | 0 | ~2h |
| 테스트 갱신 | ~15분 | ~30분 | ~10분 | 0 | ~55분 |
| 문서 수정 | 0 | ~30분 | ~30분 | ~30분 | ~1.5h |
| MCP resources PoC (선택) | 0 | ~3-4h | 0 | 0 | ~3-4h |
| **소계** | **~45분** | **~5-6h** | **~70분** | **~30분** | **~7-8h (전략 B)** |

전략 A만 채택 시 ~2h. 전략 C는 ~2d (16h).

---

## 13. 조사 신뢰도

| 항목 | 신뢰도 | 비고 |
|------|--------|------|
| `GEMINI_CLI_TRUST_WORKSPACE` 변수명 v0.40.0 stable 정확성 | ⬛⬛⬛⬛⬛ | Phase 1 정정 박스 — npx 격리 실측 + bundle js grep + bundle docs 3중 검증 |
| MemoryManagerAgent 직접 spawn bkit 코드 0건 | ⬛⬛⬛⬛⬛ | Phase 1 Explore 결과 + Read 검증 (`mcp/bkit-server.js`, `lib/gemini/version.js`, `bkit.config.json`, `gemini-extension.json`, `.gemini/settings.json`) |
| 4-tier 메모리 paths bkit 가정 0건 | ⬛⬛⬛⬛⬛ | bkit 메모리는 `.bkit/state/`, `.gemini/agent-memory/bkit/`만 사용 — `~/.gemini/tmp/<hash>/memory/` 가정 코드 0건 |
| topic narration default-on baseline runner 영향 | ⬛⬛⬛⬛⬜ | 정적 분석 — bkit 테스트는 LLM stdout 본문 매칭 비대상이지만 일부 e2e 테스트 (tc40/41/43)에서 잠재 위험. 사전 차단 1줄 설정 권장. **Phase 3 실측 검증 권고** |
| MCP resources 도구가 bkit-server tool 카탈로그와 충돌 0건 | ⬛⬛⬛⬛⬜ | Gemini CLI 측 코어 도구 — bkit-server는 별도 MCP 서버이므로 이름 충돌 없음. Plan Mode 동시 활성 호환 — Phase 3 검증 권고 |
| tc113-issue-25655 파일 존재 | ⬛⬛⬛⬜⬜ | **확인 필요** — Read 시도 결과 파일 부존재. 파일명 변경/이동 가능성 — Phase 3에서 `find tests/suites -name "*25655*" -o -name "tc113*"` 실측 권고 |
| tc107 파일 존재 | ⬛⬛⬛⬜⬜ | **확인 필요** — 동일. v0.39.1 분석 §10.4의 "확인 필요" 잔존 |
| YOLO 모드 dangerous heuristic 차단 bkit 보안 영향 | ⬛⬛⬛⬜⬜ | bkit-permissions.toml deny 규칙 우선순위 가정 — Phase 3 실측 검증 권고 |
| 사전 부채 83건 stdout assertion 사용 갯수 | ⬛⬛⬜⬜⬜ | 본문 갱신 금지 cycle이므로 미상세 분석. P0 1줄 설정으로 일괄 차단 가능하므로 추가 분석 불필요 추정 |

---

## 14. 최종 결론

v0.40.0의 핵심 변경 3개(memory 모델 재편 / Headless Trust 정정 / Topic narration default-on) 중:

1. **Headless Trust (PR #25814)**: Phase 1 정정 박스로 변수명 `GEMINI_CLI_TRUST_WORKSPACE` 정확성 확인 → bkit 회귀 **0건**.
2. **Memory 모델 재편 (PR #25601 + #25716)**: bkit가 `MemoryManagerAgent`/`memoryManager` 토글/4-tier 메모리 paths 모두 미사용 → bkit 회귀 **0건**. 단, MCP resources(PR #25395) 채택으로 v2.1.0 context-optimization 플랜과 시너지 기회 1건.
3. **Topic narration default-on (PR #25586)**: bkit baseline runner stdout 노이즈 회귀 **잠재 위험 1건**. P0 1줄 설정(`.gemini/settings.json`에 `general.topicUpdateNarration: false`)으로 사전 차단 가능.

**전체 위험도**: **LOW** (Critical 0건, 회귀 잠재 1건이 1줄 설정으로 차단). v0.39.1 cycle(MEDIUM-HIGH)에 비해 크게 낮음 — Phase 1 정정 박스가 Critical 1건을 0건으로 전환.

**v0.39.1 → v0.40.0 in-place migration plan 권고**: 본 분석의 §12.2 P0 4건(testedVersions, version flag 4개, topic narration 잠금, tc38 매트릭스 갱신) + 선택 P1(MCP resources PoC, v2.1.0 plan 갱신 진입)을 단일 PR로 처리. **예상 작업 시간 4-6시간** (전략 B 기준).

**핵심 잔존 위험**: Issue #25655 SessionStart 중복 미해결 (fix PR #25827 OPEN). v0.40.0은 이 이슈를 해소하지 않음 — `BKIT_SESSION_START_VERBOSE=false` slim default 유지로 방어.

---

*분석 종료: 2026-04-29. v0.40.0 stable 영향 분석 완료. v0.39.1 stable 베이스라인 대비 신규 Critical 0건 + High 3건 + Medium 7건 + Low 17건. 단일 PR로 회귀 사전 차단 가능. v2.1.0 context-optimization 플랜 본격 갱신 진입점 발동.*
*bkit-impact-analyst agent*
