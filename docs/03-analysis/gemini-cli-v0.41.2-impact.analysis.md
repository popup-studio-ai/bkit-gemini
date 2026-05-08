# Gemini CLI v0.39.1 → v0.41.2 bkit 누적 영향 분석

> 작성일: 2026-05-07
> 분석자: bkit-impact-analyzer agent (Strategy B' 11번째 적용 — P2)
> 베이스라인: bkit v2.0.6 (= Gemini CLI v0.39.1 stable, PR #24 main 머지 완료)
> 누적 비교 범위: `v0.39.1...v0.41.2` (= v0.40.0 + v0.40.1 + v0.41.0 + v0.41.1 + v0.41.2)
> 입력 문서:
> - `docs/01-plan/research/gemini-cli-v0.41.2-research.md` (Phase 1 누적 조사)
> - `docs/03-analysis/gemini-cli-v0.40.0-impact.analysis.md` (인용+통합)
> - `docs/03-analysis/gemini-cli-v0.41.1-impact.analysis.md` (인용+통합)
>
> 본 cycle은 v0.40.0 + v0.41.1 단일 분석을 *누적 통합*하고 v0.41.2 델타만 신규 분석한다.
> v0.40.0 / v0.41.1 단일 분석 결과는 main 머지 미완(브랜치 잔존) 상태에서 그대로 유효.

---

## Executive Summary

### 영향도 카운트 (v0.39.1 → v0.41.2 누적)

| 카테고리 | v0.40.0 인용 | v0.41.x 인용 | v0.41.2 델타 | **누적 합계** |
|---|---:|---:|---:|---:|
| 🔴 Critical | 0 | 0 | **0** | **0** |
| 🟠 High | 3 | +2 | **0** | **5** |
| 🟡 Medium | 7 | +3 | **0** | **10** |
| 🟢 Low | 17 | +11 | **0** | **28** |
| 영향 추정 파일 (중복 제외) | 27 | +6 | **0** | **33** |

### v0.41.1 분석 대비 변화

| 항목 | v0.41.1 분석 (2026-05-06) | v0.41.2 누적 분석 (2026-05-07) | 변화 |
|---|---|---|---|
| 분석 범위 | v0.39.1 → v0.41.1 | v0.39.1 → v0.41.2 | +1 patch (v0.41.2 a2a-server only) |
| Critical | 0 | 0 | 동일 |
| High | 5 | 5 | 동일 |
| Medium | 10 | 10 | 동일 |
| Low | 28 | 28 | 동일 |
| 영향 파일 | 33 | 33 | 동일 |
| 신규 결론 | — | v0.41.2 a2a-server 의존 0건 grep 재검증 완료 (P1 §13 #13 답: NO) | **v0.41.1 분석의 결론 100% 유지** |
| 권장 전략 | B' (4-5h, 단일 PR) | **B' 그대로 유효** | 변화 없음 |

### v0.41.2 델타 핵심 결론

**v0.41.2는 단일 cherry-pick (PR #26568 → #26589) 으로 `@google/gemini-cli-a2a-server` 패키지 한정 race condition fix이며, CLI 본체(`@google/gemini-cli`)에 영향 0건. bkit는 a2a-server에 의존하지 않으므로 (grep 0건 재확인), v0.41.2는 단순 의존 버전 bump 외 코드 변경 0건.**

---

## 1. Breaking Changes 영향 매핑 (누적 7건)

### 1.1 누적 영향 매트릭스

| # | 도입 버전 | PR | 항목 | 영향 파일(경로:라인) | 영향 범위 | 영향도 | 수정 방안 |
|---|---|---|---|---|---|---|---|
| **B1** | v0.40.0 | #25601 | `experimental.memoryManager` 의미 분리 (autoMemory 신설) | bkit 사용 0건. `.gemini/settings.json:1-3` `experimental.enableAgents: true`만 정의, `memoryManager`/`autoMemory` 키 부재 | 직접 영향 없음 | 🟢 None | 불필요. 의도 명문화는 §7 #2 권고 |
| **B2** | v0.40.0 | #25586 | `topicUpdateNarration` default-on + `general` 카테고리 승격 | `.gemini/settings.json` 명시 부재 → v0.40.0+에서 default `true` 자동 적용. `lib/gemini/version.js`에 flag 부재 (v0.40.0+ 그룹 신설 필요) | baseline runner stdout 노이즈 잠재 회귀 | 🟠 High (사전 차단 필요) | `.gemini/settings.json`에 `general.topicUpdateNarration: false` 1줄 추가 (P0, 5분) |
| **B3** | v0.40.0 | #25814 | Headless Trust Enforcement | `mcp/bkit-server.js:1119` `env.GEMINI_CLI_TRUST_WORKSPACE = 'true'`, `tests/suites/tc115-v0391-headless-trust.js:47-61`, `README.md:334` 모두 정확한 변수명 사용 | 정정 후 회귀 0건 | 🟢 None | 불필요. v0.40.0 분석 §1.1 정정 박스 그대로 |
| **B4** | v0.41.0 | #25935 | YOLO + `argsPattern` fail-closed | `.gemini/policies/bkit-permissions.toml`, `.gemini/policies/bkit-starter-policy.toml`, `policies/bkit-extension-policy.toml`, `bkit.config.json:107-115` 모두 `argsPattern` 키 0건 (grep 결과). wildcard 패턴(`run_shell_command(rm -rf*)`)만 사용 | 직접 영향 없음 | 🟢 None | 불필요 |
| **B5** | v0.41.0 | #25720 | `tools.core` allowlist + recursive shell validation | (1) bkit 코드 wrapper 호출 0건: `mcp/bkit-server.js:1123` `spawn('gemini', args)` 단일 binary spawn, `mcp/start-server.sh:6,13` `$(cd...) && pwd` `$(fnm env)`은 bash 자체 path resolution (Gemini policy 비대상). (2) **간접 위험**: 21개 FULL tier agents가 LLM 추론으로 `bash -c "..."` 호출 시 v0.41 recursive validation 적용 — agent prompt 의존 | 직접 0건, 간접 1건 (LLM 행동 의존) | 🟢 None (직접) / 🟡 Medium (런타임 검증 권고) | P3 단계 21개 agent 회귀 스모크 (~1h) 권고 |
| **B6** | v0.41.0 | #26060 | `--session-id <uuid>` flag 도입 + `--resume`과 mutex | `mcp/bkit-server.js:1097-1102` args 빌더는 `-e <agentPath>` + approval flag + tool isolation + task만 사용. `--session-id` 호출 0건. unknown flag strict 검증 0건 | 옵트인 (디버깅 활용 기회) | 🟢 None | 불필요. §7 #6 활용 기회 |
| **B7** | v0.41.0 | #25409 | ContextManager + AgentChatHistory wire-up (내부) | bkit 코드에 `~/.gemini/tmp/<hash>/memory/` 또는 conversation log JSON 직접 파싱 0건 (grep 결과). `lib/core/agent-memory.js:91,99` `sessionId`은 bkit 자체 메모리 ID로 Gemini ContextManager와 무관 | 직접 영향 없음 | 🟢 None | 불필요 |

### 1.2 v0.41.2 단독 (B0, 분류 외)

| # | 도입 버전 | PR | 항목 | 영향 파일 | 영향 범위 | 영향도 |
|---|---|---|---|---|---|---|
| (B0) | **v0.41.2** | **#26568 / #26589** | `@google/gemini-cli-a2a-server` `Task.waitForPendingTools()` race condition fix | bkit 코드 grep 결과 `a2a-server` 매치 2건 모두 `docs/01-plan/research/*.md`(자체 research 보고서 인용). 소스/스크립트/패키지 의존 **0건**. `package.json` 검사 결과 `@google/gemini-cli-a2a-server` 의존 부재 | **bkit 영향 0건 (재확인)** | 🟢 None |

**Breaking Changes 누적 종합**: 누적 7건 + v0.41.2 patch 1건 = 8건 검증. **bkit 직접 회귀 0건** (정적 분석). 간접 위험 1건(B5 LLM 행동 의존)만 P3 스모크 권고. v0.41.2는 bkit에 영향 0건.

---

## 2. 스킬 영향 (43개 중 영향받는 항목만)

| 스킬 | 영향 항목 | 영향도 | 대응 |
|---|---|---|---|
| `gemini-cli-learning/SKILL.md` | v0.40.0 5개 항목 + v0.41.x 신규 6개 항목 (Voice Mode, tools.core allowlist, Gemma 4 experimental, ContextManager, autoMemory scratchpad, --session-id) + v0.41.2 1줄 (a2a-server fix는 bkit 무관 명문화 권고) — **총 12개 단락** | 🟡 Medium | 12개 단락 추가 (~50분) |
| `gemini-migration/SKILL.md` (메타) | 본 분석 보고서 작성 자체가 산출물 | 🟢 None | 불필요 |
| 21개 (allowed-tools에 `run_shell_command` 포함) | v0.41.0 PR #25720 recursive shell validation 간접 영향 (LLM 호출 패턴 의존) | 🟡 Medium | P3 스모크 권고 |
| `bkit-rules/SKILL.md`, `bkit-templates/SKILL.md` | bkit 메모리(`/.bkit/state/`, `.gemini/agent-memory/bkit/`)와 Gemini CLI 4-tier(`~/.gemini/tmp/<hash>/memory/`) namespace 분리 명문화 후보 | 🟢 Low | 별도 cycle |

> 나머지 39개 스킬: v0.39.1 → v0.41.2 변경 영향 0건 (정적 분석).

---

## 3. 에이전트 영향 (21개 중 영향받는 항목만)

| 에이전트 | 영향 항목 | 영향도 | 대응 |
|---|---|---|---|
| 21개 전체 (FULL tier 8개 + READONLY/MEDIUM 13개) | bkit MCP `spawn_agent` 통한 호출 시 v0.40.0 trust 게이트 — `mcp/bkit-server.js:1119` env 변수명 정확함 → 회귀 0건. PR #25567 서브에이전트 topic update 비활성으로 stdout 깔끔해지는 긍정 영향 | 🟢 None (긍정) | 불필요 |
| 8개 FULL tier (`agents/cto-lead.md`, `qa-strategist.md`, `bkend-expert.md`, `code-analyzer.md` 등) | (1) PR #25341 YOLO 모드 dangerous heuristic 비차단(v0.40.0): bkit-permissions.toml deny 우선순위 유지 — 회귀 0건. (2) **PR #25720 recursive shell validation (v0.41.0)**: agent prompt가 LLM에게 wrapper(`bash -c`, `$(...)`) 호출 유도 시 v0.41에서 unwrap+재귀 검증 — 정적 분석 무력화 어려움 | 🟡 Medium (간접, LLM 행동 의존) | P3 단계 21개 agent 1개 샘플 명령씩 회귀 스모크 (~1h) |
| `agents/gap-detector.md`, `agents/code-analyzer.md` (READONLY tier) | tool isolation list (`mcp/bkit-server.js:1094`)에 `list_mcp_resources`, `read_mcp_resource` 추가 가능 — Plan Mode 활성 호환 | 🟡 Medium (기회) | §7 #1 별도 cycle |
| `agents/pm-discovery.md` 등 PM 에이전트 5개 | MemoryManagerAgent 제거(v0.40.0)의 간접 영향 0건 — bkit는 자체 `lib/core/memory.js` + `hooks/scripts/utils/memory-helper.js` 사용 (grep 결과 `getMemory(projectDir)` 패턴 — Gemini CLI MemoryManager와 namespace 무관) | 🟢 None | 불필요 |

---

## 4. 스크립트/라이브러리 영향 (Hook 10 events, Lib 30 modules, MCP 6 servers)

> 실측: hooks.json 정의 이벤트 10개 (SessionStart/BeforeAgent/BeforeModel/AfterModel/BeforeToolSelection/BeforeTool/AfterTool/AfterAgent/PreCompress/SessionEnd). lib/ 디렉토리 .js 30개. mcp/ .js 6개.

| 파일 | 영향 항목 | 영향도 | 대응 |
|---|---|---|---|
| **`mcp/bkit-server.js:1119`** `env.GEMINI_CLI_TRUST_WORKSPACE = 'true'` | v0.39.1 ~ v0.41.2 전부 변수명 정확 — 회귀 0건 | 🟢 None | 불필요 |
| **`mcp/bkit-server.js:1097-1102`** args 빌더 / tool isolation | `--session-id` 옵션 활용 가능, READONLY tier에 `list_mcp_resources` `read_mcp_resource` 추가 가능 | 🟡 Medium (기회) | §7 #1, #6 별도 cycle |
| **`mcp/bkit-server.js:1086`** `--approval-mode=yolo` FULL tier | PR #25935 YOLO fail-closed는 `argsPattern` 미정의 시 무영향 (bkit 정책 0건 → 영향 0건) | 🟢 None | 불필요 |
| **`mcp/bkit-server.js:1123`** `spawn('gemini', args, {...})` | wrapper 미사용 → PR #25720 직접 영향 0건. 자식 gemini가 LLM 추론으로 wrapper 호출 시 간접 적용 | 🟡 Medium (간접) | P3 스모크 |
| **`bkit.config.json:120`** `compatibility.testedVersions` | 현재 `"...0.39.1"`로 끝남. **`"0.40.0", "0.40.1", "0.41.0", "0.41.1", "0.41.2"` 5개 추가 필요** | 🟠 High | 1줄 5개 추가 (P0, 1분) |
| **`lib/gemini/version.js:201-211`** v0.39.1+ feature flag 그룹 (line 213 정책엔진 그룹 시작) | 그 사이에 v0.40.0+ 그룹(4개) + v0.41.0+ 그룹(4개) 신규 — `hasMcpResourcesTools`, `hasAutoMemoryToggle`, `hasMemoryFourTier`, `hasTopicNarrationGeneral` (v0.40.0), `hasYoloFailClosed`, `hasSessionIdFlag`, `hasSettingsEnvCast`, `hasContextManagerWire` (v0.41.0). **8개 신규** | 🟠 High | 8개 플래그 추가 (~15분) |
| **`lib/gemini/version.js:206`** `hasToolsCoreAllowlist: isVersionAtLeast('0.39.1')` | 정확한 시작 버전 검증 필요. PR #25720은 v0.41.0 정식 도입이지만 v0.39.1 release branch에 cherry-pick 가능 — 현재 `0.39.1` 유지가 보수적으로 정합. 명시 코멘트 1줄 보강 권고 | 🟡 Medium | 코멘트 보강 (~5분) |
| `hooks/scripts/session-start.js:79-86,148`, `hooks/scripts/session-end.js:44-45`, `hooks/scripts/after-model.js:58-65`, `hooks/scripts/before-tool-selection.js:127-129`, `hooks/scripts/utils/memory-helper.js:20-33` | 모두 `getMemory(projectDir)` 패턴 — bkit 자체 메모리 (`.bkit/state/`)와 결합. Gemini CLI 4-tier(`~/.gemini/tmp/<hash>/memory/`)와 namespace 분리 — 충돌 0건 | 🟢 None | 불필요 |
| `hooks/scripts/session-start.js:354-360` `BKIT_SESSION_START_VERBOSE` slim default | #25655 fix PR #25827 OPEN 상태 — v0.40.0/v0.41.x/v0.41.2 모두 미해소 | 🔴 잔존 (CLI측) | tc113 방어 유지 (변경 없음) |
| `hooks/scripts/session-end.js`, `hooks/hooks.json` SessionEnd | bkit ACP 미사용 → PR #26125 (ACP stdout pollution fix) 영향 0건 | 🟢 None | 불필요 |
| `lib/gemini/tools.js` BUILTIN_TOOLS | `list_mcp_resources`, `read_mcp_resource` 추가 가능 (선택) — bkit-server tool 카탈로그 갱신 후보 | 🟡 Medium (기회) | 별도 cycle |
| `lib/gemini/policy.js` | v0.41.x 정책 엔진 변경(#25720, #25935)은 정책 *런타임* 변경 — bkit policy.js는 정책 파일 *생성*만 담당 → 직접 영향 0건 | 🟢 None | 불필요 |
| `lib/gemini/platform.js`, `lib/gemini/hooks.js` 외 lib/gemini/*.js 9개 | v0.40.0 ~ v0.41.2 변경 영향 0건 (정적 분석) | 🟢 None | 불필요 |
| `mcp/start-server.sh`, `scripts/bootstrap-trust.sh` | 변경 영향 0건. `$(...)`는 bash 자체 path resolution (Gemini policy 비대상) | 🟢 None | 불필요 |
| `mcp/tools/qa-runner.js`, `checkpoint-manager.js`, `gap-analyzer.js`, `pm-pipeline.js`, `audit-store.js` | bkit 내부 child_process — Gemini policy/trust 비대상 | 🟢 None | 불필요 |
| `lib/core/memory.js`, `lib/core/agent-memory.js:91,99` | bkit 자체 메모리 — Gemini 4-tier와 namespace 분리. `sessionId`도 bkit 자체 ID (Gemini ContextManager 무관) | 🟢 None | 불필요 |

---

## 5. 설정 파일 영향 (settings.json, hooks.json, package.json, MCP)

| 파일 | 영향 항목 | 영향도 | 대응 |
|---|---|---|---|
| `bkit.config.json:120` `compatibility.testedVersions` | `"0.40.0", "0.40.1", "0.41.0", "0.41.1", "0.41.2"` 5개 추가 | 🟠 High | 1줄 5개 추가 (P0, 1분) |
| `bkit.config.json:118-119` `compatibility.minGeminiCliVersion` | `"0.34.0"` 유지 (v0.41.2 하위 호환) | 🟢 None | 불필요 |
| `.gemini/settings.json` (현재 3줄: `experimental.enableAgents: true`만) | (1) `general.topicUpdateNarration: false` (v0.40.0 P0) (2) `experimental.autoMemory: false`, `experimental.memoryManager: false` 명시 잠금(선택) (3) `tools.core` 명시 allowlist (v0.41.x 옵트인) (4) `experimental.gemma: false` 잠금(선택) | 🟠 High (1번) / 🟡 Medium (나머지) | (1)만 P0 1줄 (5분), 나머지는 별도 cycle |
| `.gemini/policies/bkit-permissions.toml`, `bkit-starter-policy.toml`, `policies/bkit-extension-policy.toml` | v0.41.x 정책 엔진 변경(#25720, #25935)은 정책 *해석* 변경. bkit 정책 파일은 wildcard 기반(`argsPattern` 미사용 — grep 0건)이므로 직접 영향 0건 | 🟢 None | 불필요 |
| `gemini-extension.json` | v0.40.0 ~ v0.41.2 매니페스트 변경 0건 | 🟢 None | 불필요 |
| `package.json` `@google/gemini-cli` dependency | 버전 bump 필요 (v0.39.1 → v0.41.2). `@google/gemini-cli-a2a-server` 의존 부재 — v0.41.2 race fix 직접 영향 0건 | 🟠 High | 1줄 (P0, 1분) |
| `hooks/hooks.json` 10개 이벤트 (SessionStart/BeforeAgent/BeforeModel/AfterModel/BeforeToolSelection/BeforeTool/AfterTool/AfterAgent/PreCompress/SessionEnd) | v0.40.0 ~ v0.41.2 hook event 추가/제거/변경 0건 | 🟢 None | 불필요 |
| `bkit.config.json:205-215` `agentMemory` (`.gemini/agent-memory/bkit/`) | Gemini 4-tier 메모리(`~/.gemini/tmp/<hash>/memory/`)와 namespace 분리 — 충돌 0건 | 🟢 None | 불필요 |

---

## 6. 철학 정합성 검증

| 원칙 | 정합/긴장 | 비고 |
|---|---|---|
| **Core Mission** — Automation First | ✅ 강화 | Memory 모델 prompt-driven 4-tier 전환(v0.40.0 #25716): 서브에이전트 호출 1단계 제거. baseline runner 부팅 8s → 1.4s 단축(v0.41.0 #25758) — Check 가속. v0.41.2 race fix는 a2a-server 한정이지만 sequential tool confirmation 안정성 향상 |
| **Core Mission** — No Guessing | ✅ 강화 | YOLO + `argsPattern` fail-closed(v0.41.0 #25935): parser 실패 시 명시 BLOCK으로 추측 제거. transient error → sticky_retry(v0.41.0 #26066): silent flash fallback 차단으로 모델 의도 보존 |
| **Core Mission** — Docs = Code | ✅ 강화 | settings.json env var auto-cast(v0.41.0 #26118): `${ENV:-default}` 의도 명확화. 4-tier 메모리 명문화(v0.40.0 docs +143). bkit는 placeholder 미사용으로 회귀 0건 |
| **AI Native Principles** — AI as Partner | ✅ 강화 | MCP resources 도구(v0.40.0 #25395): 정책/매뉴얼 자동 검색 가능. autoMemory scratchpad persistence(v0.41.0 #25873): extractor turns -16.7%, precision +32.7% |
| **PDCA Methodology** — 9-Stage Pipeline | ✅ 유지 | v0.40.0 ~ v0.41.2 변경이 bkit PDCA 워크플로우에 직접 영향 0건. 부팅 latency 개선이 Check 단계 가속에 긍정 영향 |
| **PDCA Methodology** — Zero Script QA | ✅ 유지 | v0.41.x 정책 엔진 강화는 bkit 정책 파일 wildcard 기반(`argsPattern` 0건)이므로 영향 0건 |
| **Context Engineering** — 6-Layer Hierarchy | ✅ 유지 | Gemini CLI 4-tier 메모리(v0.40.0)와 bkit 6-Layer 의미 축 분리(직교). v0.41.0 ContextManager 재편(#25409)도 namespace 분리 — 직접 충돌 0건 |
| **Safe Defaults / Progressive Trust / Full Visibility / Always Interruptible** | ✅ 강화 | Headless trust enforcement(v0.39.1) + topic narration default-on(v0.40.0) Full Visibility 강화. YOLO fail-closed(v0.41.0)로 Safe Defaults 강화 |

**종합**: 8개 원칙 중 **5개 강화 / 3개 유지 / 0개 약화 또는 충돌**. v0.39.1 → v0.40.0(메모리 단순화 + AI Partnership 강화) → v0.41.x(보안 fail-closed 강화) → v0.41.2(stability) — 일관된 *상향 정렬*. bkit 철학과 긴장 포인트 0건.

---

## 7. 신기능 활용 기회 (P1 §9 C1~C9 + v0.40.0 잔존 5건)

### 7.1 P1 §9 C1~C9 평가

| # | P1 등급 | 새 CLI 기능 | bkit 적용 방안 | 예상 효과 | 리스크 | 우선순위 |
|---|---|---|---|---|---|---|
| C1 | 🟢 높음 | MCP resources (`list_mcp_resources` / `read_mcp_resource`, PR #25395, v0.40.0) | bkit-server에 resources export 인터페이스 추가. `bkit-system/philosophy/*.md` 4개, `templates/*.md` 14개, `bkit.config.json` 정책 단편을 MCP resources로 노출 → 에이전트 자동 탐색 | 🚀 매 턴 GEMINI.md 토큰 ~30% 절감(추정), AI Partnership 강화, v2.1.0 context-optimization 시너지 | 낮음 (별도 channel, namespace 충돌 0건) | **P1** (1d PoC) |
| C2 | 🟢 높음 | 4-tier prompt-driven memory (PR #25716, v0.40.0) | `context-engineering.md` "Memory Systems (No Collision)" 표에 Gemini 4-tier 명문화. bkit 메모리(`.bkit/state/`, `.gemini/agent-memory/bkit/`)와 의미 축 분리 명시 | 📚 Docs=Code, 사용자/AI 혼란 방지 | 0 | P2 (30분) |
| C3 | 🟡 중간 | `experimental.autoMemory` 분리 토글 (PR #25601, v0.40.0) | `.gemini/settings.json`에 `experimental.autoMemory: false`, `experimental.memoryManager: false` 명시 잠금 — 의도 docs=code 명문화 | 🔒 No Guessing 강화, default 변경 시 회귀 사전 방어 | 0 | P1 (5분) |
| C4 | 🟡 중간 | Auto-memory scratchpad persistence (PR #25873, v0.41.0) | bkit가 `autoMemory: true` 전환 시 background extraction 자동 작동 (extractor -16.7%). 단 bkit 자체 메모리 사용 — *보조 채널*로만 채택 | 🚀 Skill extraction 효율, v2.1.0 시너지 | 중간 (행동 변화 검증 필요) | P2 (~0.5d) |
| C5 | 🟢 높음 (옵트인) | `tools.core` allowlist (PR #25720, v0.41.0) | 21개 FULL tier agents가 자주 쓰는 명령(`run_shell_command(npm test)` 등) 화이트리스트화. recursive validation으로 sub-command 강제 검증 | 🔒 보안 강화, audit trail 명확화 | 중간 (allowlist 너무 좁히면 도구 차단) | P2 (~1d, 카탈로그 도출 + 회귀 검증) |
| C6 | 🟡 중간 | `--session-id <uuid>` CLI flag (PR #26060, v0.41.0) | `mcp/bkit-server.js:1097` args에 `--session-id <uuid>` 추가 — baseline runner 디버깅 시 session 재현 (PDCA Do retrace) | 🐛 Debug UX, PDCA Check reproducibility | 0 | P3 (~0.5d) |
| C7 | 🟢 높음 (긍정) | settings env var type cast (PR #26118, v0.41.0) | bkit가 placeholder 미사용 → 향후 도입 시 자동 활용 | 🛠️ 향후 활용 | 매우 낮음 (string-기반 schema 분기 잠재 회귀, 하지만 placeholder 0건이므로 무관) | P3 (미래 활용) |
| C8 | 🟡 중간 | `gemini mcp list` ping optional + timeout (PR #26068, v0.41.0) | bkit가 baseline에서 MCP health check 미사용. 향후 `mcp doctor` skill 작성 시 false negative 우려 사라짐 | 🛠️ 향후 health check 정확성 | 0 | P3 (미래 활용) |
| C9 | 🟡 중간 | CLI subcommand stdout pipe/redirect 정상화 (PR #25894, v0.41.0) | bkit가 `gemini extensions list`/`gemini mcp list` 호출 0건이지만 향후 doctor/status 명령 도입 시 자연스럽게 pipe 캡처 | 🛠️ 향후 health check skill 신뢰성 | 0 | P3 (미래 활용) |

### 7.2 v0.40.0 잔존 기회 (인용)

`docs/03-analysis/gemini-cli-v0.40.0-impact.analysis.md §11` 그대로 유효 (5건):
- (1) MCP resources 도구 export (= C1) (2) `experimental.autoMemory: false` 명시 잠금 (= C3) (3) 4-tier 메모리 namespace 명문화 (= C2) (4) `GEMINI_CLI_TRUSTED_FOLDERS_PATH` 활용 (5) `gemini gemma` 로컬 fallback

**자동 적용 4건** (코드 변경 0건): 부팅 latency 개선(#25758), YOLO/AUTO_EDIT redirection fix(#26542), telemetry logPrompts 누설 fix(#26153, bkit telemetry 미활성이지만 향후 안전), transient error sticky_retry(#26066). v0.41.2 a2a-server fix는 bkit 무관(0건).

**합계**: P1 9건(C1~C9) + v0.40.0 잔존 (중복 3건 제외 시 +2건 = `GEMINI_CLI_TRUSTED_FOLDERS_PATH`, `gemini gemma`) = **11건 활용 후보** (자동 적용 4건 별도).

---

## 8. 누적 결론 및 v2.0.7 권장 액션

### 8.1 Critical 파일 목록 (즉시 수정)

**0건**. v0.39.1 → v0.41.2 전체 누적에서 Critical 회귀 부재.

### 8.2 High 항목 목록 (P0 권장)

| # | 파일 | 변경 내용 | 작업량 |
|---|---|---|---|
| H1 | `bkit.config.json:120` | `testedVersions`에 `"0.40.0", "0.40.1", "0.41.0", "0.41.1", "0.41.2"` 5개 추가 | 1분 |
| H2 | `package.json` | `@google/gemini-cli` 의존 v0.39.1 → v0.41.2 bump | 1분 |
| H3 | `lib/gemini/version.js:201-211` 뒤 | v0.40.0+ 그룹(4개) + v0.41.0+ 그룹(4개) 신규 — `hasMcpResourcesTools`, `hasAutoMemoryToggle`, `hasMemoryFourTier`, `hasTopicNarrationGeneral`, `hasYoloFailClosed`, `hasSessionIdFlag`, `hasSettingsEnvCast`, `hasContextManagerWire` 8개 추가. line 206 `hasToolsCoreAllowlist` 코멘트 1줄 보강 | ~15분 |
| H4 | `.gemini/settings.json` | `general.topicUpdateNarration: false` 1줄 추가 (baseline runner stdout 노이즈 사전 차단) | 5분 |
| H5 | `tests/suites/tc38-feature-flags-matrix.js` | v0.40.0+/v0.41.0+ 신규 8개 플래그 매트릭스 추가 | ~15분 |

### 8.3 v2.0.7 마이그레이션 권장 액션 (5개 이내)

> 전략 B' (v0.41.1 분석 §11 추천 그대로 유지) — Critical 0건이지만 v2.1.0 plan 시너지 잡고 21개 agent 회귀 사전 차단.

1. **P0 (~50분)**: `bkit.config.json` testedVersions + `package.json` 의존 bump + `lib/gemini/version.js` flag 8개 추가 + `.gemini/settings.json` topicUpdateNarration 잠금 + `tc38` 매트릭스 갱신.
2. **P1 (~1h)**: 21개 FULL tier agents 회귀 스모크 — `bash -c`/wrapper 호출 유도 prompt가 없는지 1개 샘플 명령 실행 검증 (PR #25720 간접 위험 차단).
3. **P1 (~45분)**: `gemini-cli-learning/SKILL.md` 12개 단락 추가 (v0.40.0 5개 + v0.41.x 6개 + v0.41.2 1줄).
4. **P1 (~1h)**: v2.1.0 plan Section 4/5/6 본격 갱신 진입 — MCP resources(C1) + autoMemory scratchpad(C4) + tools.core allowlist(C5) 시너지 hint 추가.
5. **별도 cycle**: MCP resources export PoC(C1, ~1d) — 매 턴 토큰 ~30% 절감 추정. 본 PR 분리.

**예상 합계**: ~4-5시간, 단일 PR로 처리 가능. v0.40.0/v0.41.1/v0.41.2 cycle 모두 단일 PR로 통합.

### 8.4 미해결 검증 필요 항목 (P3 brainstorm 위임)

| Q# | 질문 | 신뢰도 | 위임 사유 |
|---|---|---|---|
| Q1 | PR #25720 recursive shell validation의 21개 FULL tier agents LLM 호출 시 회귀 위험 (정적 분석 불가, agent prompt 의존) | ⬛⬛⬛⬜⬜ | P3에서 21개 agent 1개 샘플 명령씩 회귀 스모크 (~1h) |
| Q2 | `lib/gemini/version.js:206` `hasToolsCoreAllowlist: isVersionAtLeast('0.39.1')` 의 정확한 시작 버전 (PR #25720 v0.41.0 정식 도입 vs cherry-pick 가능성) | ⬛⬛⬛⬜⬜ | P3 npx 격리 실측으로 `tools.core` 키 schema 확정 |
| Q3 | `tests/suites/tc113-issue-25655-systemmessage-duplicate.js` 파일 존재 여부 (v0.39.1 분석 §10.4 + v0.40.0 분석 §13 잔존) | ⬛⬛⬛⬜⬜ | P3에서 `find tests/suites -name "*25655*" -o -name "tc113*"` 실측 |
| Q4 | bkit-permissions.toml deny 규칙 우선순위가 v0.41.x YOLO fail-closed보다 우선 동작하는지 실측 | ⬛⬛⬛⬜⬜ | P3 단계 boundary 테스트 |
| Q5 | `.gemini/settings.json`에 `general.topicUpdateNarration: false` 추가 후 baseline runner의 e2e 테스트(tc40/41/43) 실측 영향 | ⬛⬛⬛⬛⬜ | P3 단계 실측 검증 권고 (정적 분석은 영향 0건이지만) |

**미해결 5건 모두 P3 brainstorm/Do 단계에서 해소 가능**. 본 P2 분석으로 ✅ Critical/High 결정 충분.

---

## 9. v0.41.1 분석 대비 변경 요약

### 9.1 결론 유지 (변경 없음)

- v0.40.0 분석 §1.1 (Headless Trust 정정 후 회귀 0건) — 그대로 유효.
- v0.40.0 분석 §1.2 (Memory 모델 재편 직접 영향 0건) — 그대로 유효.
- v0.40.0 분석 §1.3 (Topic narration default-on, P0 1줄 차단) — 그대로 유효.
- v0.41.1 분석 §1.1~1.4 (Breaking 4건 모두 0건) — 그대로 유효.
- v0.41.1 분석 §11 전략 B' 추천 (~4-5h, 단일 PR) — 그대로 유효.
- v0.41.1 분석 §13 핵심 5줄 요약 — 그대로 유효.

### 9.2 변경 (수정/보강)

| 항목 | v0.41.1 분석 | v0.41.2 누적 분석 | 변경 사유 |
|---|---|---|---|
| testedVersions 추가 항목 | 4개 (`0.40.0`, `0.40.1`, `0.41.0`, `0.41.1`) | **5개** (+`0.41.2`) | v0.41.2 추가 |
| 권장 액션 #1 작업량 | ~50분 | 동일(~50분) | testedVersions는 5개로 늘었지만 1줄 변경이라 시간 동일 |
| 신기능 활용 기회 합계 | 14건 (v0.41.x 9 + v0.40.0 잔존 5) | **11건** (P1 §9 C1~C9 + v0.40.0 잔존 +2 중복 제외) | P1 §9에서 C1~C9로 정제 + 중복 제거 (자동 적용 4건은 별도 카운트) |

### 9.3 신규 추가 (v0.41.2 델타)

- §1.2 v0.41.2 단독 분류 외 행 (B0): `@google/gemini-cli-a2a-server` race fix → bkit 영향 0건 grep 재확인.
- §2 `gemini-cli-learning/SKILL.md`: 단락 카운트 11개 → **12개** (v0.41.2 a2a-server fix가 bkit 무관임을 1줄 명문화).
- §5 `package.json`: 의존 버전 bump v0.39.1 → **v0.41.2** (이전 분석은 v0.41.1 대상).
- §6 철학 정합성 §1 (Automation First): v0.41.2 race fix가 sequential tool confirmation 안정성 향상에 기여하는 1문장 추가.
- §8.4 미해결 Q5 신규: `general.topicUpdateNarration: false` 추가 후 e2e 테스트 실측 (정적 분석 보강).

### 9.4 v0.41.2 영향 0건 재확인 사실

| 검증 | 결과 | 근거 |
|---|---|---|
| `a2a-server` 코드/스크립트/패키지 의존 | **0건** | grep 결과 매치 2건 모두 `docs/01-plan/research/*.md` (자체 research 보고서 인용 텍스트만) |
| `package.json`의 `@google/gemini-cli-a2a-server` 의존 | **0건** | `package.json` 검사 결과 부재 |
| v0.41.2 cherry-pick 영향 파일 (`packages/a2a-server/src/agent/*`) | bkit 비대상 | bkit는 `@google/gemini-cli` 본체만 사용 — `packages/a2a-server` 별도 패키지 |
| bkit 영향 추정 파일 카운트 (33개) 변동 | **0건** | v0.41.2는 영향 추정 파일에 추가/제거 없음 |

---

*분석 종료: 2026-05-07. v0.39.1 → v0.41.2 누적 영향 분석 완료. v0.40.0 cycle + v0.41.1 cycle 분석 100% 인용 + v0.41.2 델타 0건 재확인. Critical 0 / High 5 / Medium 10 / Low 28 / 영향 파일 33 — v0.41.1 분석 대비 카운트 동일. 권장 전략 B' (~4-5h, 단일 PR) 그대로 유효. v2.0.7 마이그레이션은 v0.40.0/v0.41.1/v0.41.2를 단일 cycle로 통합 처리 권고.*
*bkit-impact-analyzer agent (Strategy B' 11번째 적용)*
