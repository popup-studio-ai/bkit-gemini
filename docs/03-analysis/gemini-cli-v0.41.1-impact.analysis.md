# Gemini CLI v0.41.1 bkit 영향 분석 (Phase 2)

> 작성일: 2026-05-06
> 분석자: bkit-impact-analyzer agent
> 베이스라인: bkit v2.0.6 (= Gemini CLI v0.39.1, PR #24 main 머지 완료)
> 누적 비교 범위: `v0.39.1...v0.41.1` (= v0.40.0 + v0.40.1 + v0.41.0 + v0.41.1)
> 입력 문서:
> - `docs/01-plan/research/gemini-cli-v0.41.1-research.md` (Phase 1 신규)
> - `docs/01-plan/research/gemini-cli-v0.40.0-research.md` (baseline 인용)
> - `docs/03-analysis/gemini-cli-v0.40.0-impact.analysis.md` (baseline 인용)
>
> v0.40.0 분석은 별도 cycle로 완료되었으나 main 머지는 미완(브랜치 잔존). 본 cycle은 v0.40.0 결과를 *그대로 흡수* + v0.41.x 신규분만 신규 분석한다.

---

## Executive Summary

### 영향도 카운트 (v0.41.x 신규 한정 + v0.40.0 인용 합산)

| 카테고리 | v0.40.0 (인용) | v0.41.x 신규 | 합계 |
|---|---:|---:|---:|
| 🔴 Critical | 0 | **0** | **0** |
| 🟠 High | 3 | **2** | **5** |
| 🟡 Medium | 7 | **3** | **10** |
| 🟢 Low | 17 | **11** | **28** |
| 영향 추정 파일 (중복 제외) | 27 | +6 | **33** |
| Critical 즉시 수정 | 0 | 0 | **0** |

### v0.41.x P1 7개 검증 질문 답변 표

| # | 검증 질문 | 답 | 근거 (file:line) | bkit 영향 |
|---|---|---|---|---|
| **P1** (#6) | bkit이 `bash -c` / `sh -c` / `$(...)` / `<(...)` wrapper를 baseline runner나 MCP 도구에서 호출하는가? | **NO** (정책 엔진 대상 0건) | `mcp/bkit-server.js:1123` `spawn('gemini', args, ...)`은 단일 binary 직접 spawn (no shell wrapper). `lib/gemini/version.js:105` `execSync('gemini --version 2>/dev/null')`은 자체 process redirection (Gemini policy 비대상). `mcp/start-server.sh:6,13`, `scripts/bootstrap-trust.sh:22,25`의 `$(...)`은 **bash 자체 path resolution**으로 Gemini CLI policy 엔진을 거치지 않음. 21개 agents (FULL tier)도 LLM이 호출하는 `run_shell_command`는 Gemini가 직접 parsing하므로 wrapper 사용 시에만 PR #25720 영향 — bkit 코드는 wrapper 호출 0건 | **PR #25720 직접 영향 0건** |
| **P2** (#7) | bkit이 YOLO 모드 + `argsPattern`을 정의하고 복잡한 shell 표현을 호출하는가? | **NO** (`argsPattern` 정의 0건) | bkit 정책 파일 2개(`.gemini/policies/bkit-permissions.toml`, `.gemini/policies/bkit-starter-policy.toml`, `policies/bkit-extension-policy.toml`)에 `argsPattern` 키 0건 (grep 결과). `bkit.config.json:107-115` permissions는 단순 wildcard 패턴(`run_shell_command(rm -rf*)` deny 등)만 사용. YOLO는 FULL tier 에이전트만 활성(`mcp/bkit-server.js:1086`) | **PR #25935 직접 영향 0건** |
| **P3** (#8) | bkit이 ACP 모드 + SessionEnd hook을 정의하는가? stdout 오염 워크어라운드가 있는가? | **PARTIAL**: SessionEnd hook은 정의(`hooks/hooks.json:147-158`, `hooks/scripts/session-end.js`), but **bkit는 ACP 모드 미사용** (`spawn('gemini', args)`는 stdio pipe 사용, ACP 채널 미사용). 워크어라운드 0건 | **PR #26125 직접 영향 0건**, 단 ACP 채택 시 활용 기회 |
| **P4** (#9) | bkit이 `gemini extensions list`/`mcp list` 등 CLI subcommand 출력을 파이프/리다이렉트로 캡처하는가? | **NO** (직접 캡처 코드 0건) | grep 결과 bkit 코드(mcp/, lib/, scripts/, hooks/, tests/)에 `gemini extensions list` `gemini mcp list` 호출 0건. `tests/run-all-tests.sh:109` `eval "$test_command" 2>&1`은 bkit 자체 테스트 명령 캡처 (Gemini CLI 비대상). `lib/gemini/version.js:105` `gemini --version 2>/dev/null`만 redirection 사용 | **PR #25894, #26068 활용 기회 (간접)** |
| **P5** (#10) | bkit이 `~/.gemini/tmp/<hash>/...` conversation log를 직접 파싱하는가? | **NO** | grep 결과 bkit 코드에 `~/.gemini/tmp` 또는 `tmp/<hash>/memory` 가정/사용 0건. bkit 메모리 path는 `.gemini/agent-memory/bkit/` (`bkit.config.json:207`)와 `.bkit/state/`(자체)만 사용. v0.40.0 분석 §1.2 결론과 동일 | **PR #25409 ContextManager 직접 영향 0건** |
| **P6** (#11) | bkit `.gemini/settings.json`이 `${ENV:-default}` 패턴으로 boolean/number 설정을 사용하는가? | **NO** | `.gemini/settings.json` 전체 5줄(`experimental.enableAgents: true` 1개)만, env var placeholder 0건. `bkit.config.json` 248줄도 placeholder 0건. `gemini-extension.json`도 0건 | **PR #26118 type cast 직접 영향 0건** |
| **P7** (#12) | bkit이 telemetry 활성 + `logPrompts: false` 운영하는가? | **NO** (telemetry 비활성) | `.gemini/settings.json`/`bkit.config.json`/`gemini-extension.json`에 `telemetry`/`logPrompts` 키 0건 (grep 결과) | **v0.40.1 PR #26153 직접 영향 0건 (긍정 효과: 향후 telemetry 활성 시 자동 안전)** |

**P1~P7 종합**: v0.41.x 신규 Breaking 4건이 bkit 코드에 직접 영향 **0건**. ACP 모드 미사용 / argsPattern 미정의 / shell wrapper 미사용 / conversation log 미파싱 / env var placeholder 미사용 / telemetry 미활성으로 모든 회귀 경로가 우회됨. **즉시 수정 0건**.

### 최우선 조치 Top 3 (v0.41.1 신규 한정)

1. 🟠 **`bkit.config.json:120` testedVersions에 `"0.40.0", "0.40.1", "0.41.0", "0.41.1"` 추가** — 1줄, 호환성 선언 (P0, ~1분).
2. 🟠 **`lib/gemini/version.js:212` 뒤에 v0.40.0+/v0.41.0+ feature flag 그룹 신설** — `hasMcpResourcesTools` (v0.40.0), `hasAutoMemoryToggle` (v0.40.0), `hasMemoryFourTier` (v0.40.0), `hasTopicNarrationGeneral` (v0.40.0), `hasToolsCoreAllowlist` 갱신 (v0.41.0 정책 엔진 통합 — 현재 v0.39.1 기준, **재명시 필요**), `hasYoloFailClosed` (v0.41.0), `hasSessionIdFlag` (v0.41.0), `hasSettingsEnvCast` (v0.41.0) — **8개 플래그**, ~15분.
3. 🟠 **`.gemini/settings.json`에 `general.topicUpdateNarration: false` 추가** (v0.40.0 cycle에서 권고된 P0 — 본 cycle에서도 동일 유효). 5분.

### v0.40.0 분석 결과 인용 정책

본 보고서가 다루는 v0.41.x 신규 분석 외, v0.40.0 cycle에서 도출된 27개 영향 항목과 5개 기능 개선 기회는 **그대로 유효**하며 본 보고서 §2~§5에서는 *재서술하지 않고 인용*한다. v0.40.0 분석 보고서 출처: `docs/03-analysis/gemini-cli-v0.40.0-impact.analysis.md`.

---

## 1. Breaking Changes 영향 매핑 (v0.41.x 신규 4건)

### 1.1 PR #25935 — YOLO 모드 fail-closed (B1)

| 항목 | 내용 |
|---|---|
| 변경 본질 | `argsPattern`이 있는 restricted rule에서 shell parser 실패 시 default가 `ALLOW` → `BLOCK` (fail closed). PoC: `echo $[ x='a[$(touch FLAG)]', x ]`가 이전엔 통과 |
| **bkit 영향 grep** | `argsPattern` 정의 파일 **0건** (정책 파일 3개 모두 wildcard만 사용). bkit 코드에서 `$[...]` (deprecated arithmetic) 호출 0건 |
| 영향 파일 | 없음 (P2 검증 결과) |
| 영향도 | 🟢 None |
| 수정 방안 | 불필요. **참고용 메모**: 향후 `bkit.config.json:107-115` permissions에 `argsPattern` 도입 시 PoC와 호환되는 패턴 회피 필요 |
| 예상 작업량 | 0h |

### 1.2 PR #25720 — `tools.core` allowlist + recursive shell validation (B2)

| 항목 | 내용 |
|---|---|
| 변경 본질 | sub-command/substitution을 재귀적으로 정책 매칭. `bash -c`/`sh -c` wrapper도 `stripShellWrapper`로 unwrap. 신규 `settings.tools.core` allowlist 키 |
| **bkit 영향 grep — Wrapper 사용** | bkit 코드에서 `bash -c "..."` / `sh -c "..."` 호출 **0건**. `mcp/bkit-server.js:1123` `spawn('gemini', args, {...})`는 단일 binary spawn으로 wrapper 미사용 |
| **bkit 영향 grep — Substitution** | `mcp/start-server.sh:6,13` `$(cd...) && pwd` `$(fnm env)`, `scripts/bootstrap-trust.sh:22,25` `$(cd...)` `$(dirname...)`는 **bash 자체** path resolution이며 Gemini CLI를 거치지 않음 → 정책 엔진 비대상 |
| **bkit 영향 grep — agents의 LLM tool 호출** | 21개 FULL tier agents(`agents/cto-lead.md` 등)이 `run_shell_command` 도구를 LLM 추론으로 호출 시 v0.41 recursive validation 통과 필요. **단**, bkit이 *어떤* 명령을 호출할지는 LLM이 결정하므로 bkit 코드 차원에서 보장 불가. 회귀 검증 권고 |
| 영향 파일 | 직접 0건. 간접: 21개 agents의 LLM 호출 패턴 (런타임 검증 권고) |
| 영향도 | 🟢 None (정적 분석) / 🟡 Medium (런타임 검증 권고) |
| 수정 방안 | 불필요. **권고**: P3 단계에서 21개 agent FULL tier 회귀 스모크 테스트 (각 agent 1개 샘플 명령 실행 후 v0.41 정책 통과 확인). `tools.core` 명시 allowlist 채택은 별도 cycle (§8 #2) |
| 예상 작업량 | 0h (수정) + 1h (런타임 스모크 테스트, 선택) |

### 1.3 PR #26060 — `--session-id <uuid>` flag 도입 (B3)

| 항목 | 내용 |
|---|---|
| 변경 본질 | 신규 CLI flag `--session-id <uuid>`. `--resume`과 mutex |
| **bkit 영향 grep** | `mcp/bkit-server.js:1097-1102` args 빌더는 `'-e' agentPath` + approval flag + tool isolation + task만 사용. `--session-id` 호출 0건. unknown flag strict 검증 0건 |
| 영향 파일 | 없음 |
| 영향도 | 🟢 None (옵트인) |
| 수정 방안 | 불필요. **활용 기회**: §8 #4 참고 (디버깅용 재현) |
| 예상 작업량 | 0h |

### 1.4 PR #25409 — ContextManager / AgentChatHistory wire-up (B4)

| 항목 | 내용 |
|---|---|
| 변경 본질 | 신규 ContextManager로 chat history 모델 치환 (내부 아키텍처) |
| **bkit 영향 grep** | bkit 코드에 `~/.gemini/tmp` / `tmp/<hash>/memory` / `chat-*.json` / conversation log 직접 파싱 **0건** (P5 검증 결과) |
| 영향 파일 | 없음 |
| 영향도 | 🟢 None |
| 수정 방안 | 불필요 |
| 예상 작업량 | 0h |

**Breaking Changes 종합**: 4건 모두 bkit 직접 영향 **0건**. v0.41.x neuf cycle은 v0.40.0 cycle보다 위험도 더 낮음 (Phase 1에서 hint된 위험이 코드 grep으로 모두 무력화됨).

---

## 2. 스킬 영향 분석 (45개 skills 대상)

> v0.40.0 분석 §2 그대로 유효 — 본 cycle 신규 영향 0건. 변경 사항만 기술.

| 스킬 카테고리 | v0.41.x 신규 영향 | 영향도 | 대응 방안 |
|---|---|---|---|
| 전체 45개 | bkit MCP `spawn_agent` 통한 호출 — env 변수명 정확함 (v0.40.0 분석 그대로) → trust 회귀 0건. v0.41.x recursive shell validation 21개 FULL tier agents에 간접 적용 (런타임 LLM 호출 시) | 🟢 None~🟡 Medium | v0.40.0 분석 그대로. 추가 권고: P3 단계 런타임 스모크 |
| `gemini-cli-learning/SKILL.md` | v0.40.0 5개 항목 + v0.41.x 신규 6개 항목 (Voice Mode, tools.core allowlist, Gemma 4 experimental, ContextManager, autoMemory scratchpad, --session-id) | 🟡 Medium | 6개 단락 추가 (v0.40.0 분석의 5개 + v0.41 신규 6개 = **총 11개 단락**, ~45분) |
| `gemini-migration/SKILL.md` (메타) | 본 분석 보고서 작성 자체가 산출물 | 🟢 None | 불필요 |
| 전체 — `tools.core` allowlist 채택 (v0.41.x 신규) | bkit이 `.gemini/settings.json`에 `tools.core: [...]` 명시 시 21개 FULL tier agents 신뢰 도구 화이트리스트화 가능 | 🟡 Medium (기회) | 별도 cycle 권고 (§8 #2) |

**v0.40.0 분석 그대로 유효**: `docs/03-analysis/gemini-cli-v0.40.0-impact.analysis.md §2` 참조.

---

## 3. 에이전트 영향 분석 (21개 agents 대상)

> v0.40.0 분석 §3 그대로 유효. 본 cycle 신규 영향만 추가.

| 에이전트 | v0.41.x 신규 영향 | 영향도 | 대응 방안 |
|---|---|---|---|
| 21개 FULL tier (allowed-tools에 `run_shell_command` 8개 + 기타 13개) | PR #25720 recursive shell validation 적용 — agent가 LLM 추론으로 `bash -c "..."` 같은 wrapper 명령을 호출하면 v0.41에서 unwrap 후 재귀 검증. agent prompt가 wrapper 사용을 유도하지 않는 한 영향 0건 | 🟡 Medium (LLM 행동 의존) | P3 단계 21개 agent 회귀 스모크 (1h) |
| 21개 (FULL tier 8개) | PR #25935 YOLO fail-closed — `argsPattern` 미정의 상태에서는 영향 0건. 단, agent prompt가 deprecated `$[...]` syntax 유도 시 BLOCK | 🟢 None | 불필요 (정책 0건) |
| 8개 FULL tier (`agents/cto-lead.md`, `qa-strategist.md`, `bkend-expert.md`, `code-analyzer.md` 등) | bkit-permissions.toml deny 우선 동작은 v0.41에서도 유지 (정책 엔진 변경은 `tools.core` allowlist 추가만, deny 우선순위 변경 없음) | 🟢 None | v0.40.0 분석 §3 그대로 |

---

## 4. 스크립트/라이브러리 영향 분석

### v0.41.x 신규 영향 (직접)

| 파일 | 영향 항목 | 영향도 | 수정 방안 | 예상 작업량 |
|---|---|---|---|---|
| **`bkit.config.json:120`** testedVersions | `"0.40.0"`, `"0.40.1"`, `"0.41.0"`, `"0.41.1"` 추가 (현재 `"0.39.1"`로 끝남) | 🟠 High | 4개 항목 추가 (1줄) | 1분 |
| **`lib/gemini/version.js:201-211`** v0.39.1+ feature flag 그룹 | 그 뒤에 v0.40.0+ 그룹 4개 + v0.41.0+ 그룹 4개 신규. v0.41.0+: `hasYoloFailClosed`, `hasSessionIdFlag`, `hasSettingsEnvCast`, `hasContextManagerWire`, `hasVoiceMode`(experimental), `hasGemma4`(experimental). 기존 `hasToolsCoreAllowlist`(line 206)는 v0.39.1 → **v0.41.0** 재명시 검토 필요 (PR #25720이 v0.41.0에서 `tools.core` 키를 정식 도입하면서 동시에 v0.39.1/v0.40.0 release branch에 cherry-pick — 정확한 시작 버전은 v0.39.1 유지 가능) | 🟠 High | 8개 플래그 추가 + 1개 검토 | ~15분 |
| **`mcp/bkit-server.js:1119`** `env.GEMINI_CLI_TRUST_WORKSPACE = 'true'` | v0.41.x에서도 변수명 그대로 유효 (Phase 1 재인용) | 🟢 None | 불필요 | 0 |
| **`mcp/bkit-server.js:1097-1102`** args 빌더 | `--session-id` 옵션 활용 가능 (선택). READONLY tier에 `list_mcp_resources` `read_mcp_resource` 추가 (v0.40.0 분석 §4) | 🟡 Medium (기회) | §8 참고 | 별도 cycle |
| **`mcp/bkit-server.js:1086`** YOLO flag | PR #25341 dangerous heuristic 비차단 (v0.40.0)은 v0.41.x에서 `tools.core` allowlist + recursive shell validation으로 한 단계 더 강화. bkit-permissions.toml deny 우선순위 그대로 유지 | 🟢 None | 불필요 | 0 |
| **`scripts/bootstrap-trust.sh`** | v0.41.x 변경 무관. trustedFolders.json 등록은 v0.41.x에서도 동작 | 🟢 None | 불필요 | 0 |
| **`hooks/scripts/session-end.js`** | bkit이 ACP 모드 미사용이므로 PR #26125 (ACP stdout pollution fix) 영향 0건. 단, ACP 채택 시 자연스럽게 적용 | 🟢 None | 불필요 | 0 |
| **`hooks/hooks.json:147-158`** SessionEnd | bkit는 ACP 미사용 — 영향 0건 | 🟢 None | 불필요 | 0 |
| **`lib/gemini/tools.js`** | v0.40.0 분석 §4 그대로 — `list_mcp_resources`, `read_mcp_resource` 추가 가능 (선택, 별도 cycle) | 🟡 Medium (기회) | v0.40.0 분석 §4 참조 | 별도 cycle |
| **`lib/gemini/policy.js`** | v0.41.x 정책 엔진 변경 (#25720, #25935)은 정책 *런타임* 변경이며 bkit policy.js 코드는 정책 파일 *생성*만 담당 — 직접 영향 0건 | 🟢 None | 불필요 | 0 |

### v0.40.0 분석에서 잔존하는 영향 (인용)

`docs/03-analysis/gemini-cli-v0.40.0-impact.analysis.md §4` 그대로 유효:
- testedVersions/version flag 추가, topic narration 잠금, MCP resources 채택 기회 등 모두 인용.

---

## 5. MCP 서버 영향 분석

| 파일 | v0.41.x 신규 영향 | 영향도 | 대응 방안 |
|---|---|---|---|
| `mcp/bkit-server.js:1086` (`--approval-mode=yolo` FULL tier) | PR #25935 YOLO fail-closed는 `argsPattern` 미정의 시 무영향. bkit는 `argsPattern` 0건 → 영향 0건 | 🟢 None | 불필요 |
| `mcp/bkit-server.js:1119` (`GEMINI_CLI_TRUST_WORKSPACE='true'`) | v0.41.x 그대로 유효 | 🟢 None | 불필요 |
| `mcp/bkit-server.js:1123` (`spawn('gemini', args)`) | wrapper 미사용 → PR #25720 직접 영향 0건. 단, 자식 gemini 프로세스가 LLM 추론으로 wrapper 호출 시 v0.41 정책 적용 | 🟡 Medium (간접) | P3 단계 스모크 권고 |
| `mcp/bkit-server.js` MCP resources export | bkit-server가 MCP resources protocol을 export하지 않음 (v0.40.0 분석 §11 #1 그대로). v0.41.x에서도 동일 기회 | 🟡 Medium (기회) | v0.40.0 분석 §11 #1 인용 |
| `mcp/start-server.sh` | 변경 영향 0건 | 🟢 None | 불필요 |
| `mcp/tools/*.js` (qa-runner, checkpoint-manager, gap-analyzer, pm-pipeline) | bkit 내부 child_process — Gemini policy/trust 비대상 | 🟢 None | 불필요 |

---

## 6. 설정 파일 영향 분석

| 파일 | v0.41.x 신규 영향 | 영향도 | 수정 방안 |
|---|---|---|---|
| `bkit.config.json:120` `compatibility.testedVersions` | `"0.40.0"`, `"0.40.1"`, `"0.41.0"`, `"0.41.1"` 추가 | 🟠 High | 1줄 (P0, 1분) |
| `bkit.config.json:118-119` `compatibility.minGeminiCliVersion` | `"0.34.0"` 유지 (v0.41.x 하위 호환) | 🟢 None | 불필요 |
| `.gemini/settings.json` (현재 5줄) | (1) `general.topicUpdateNarration: false` (v0.40.0 P0 — 본 cycle에서도 유효) (2) v0.41.0+ 신규: `tools.core` 명시 allowlist 채택 시 추가 (3) `experimental.gemma: false` 명시 잠금 (선택) | 🟠 High | 1-3줄 (P0, ~5분) |
| `.gemini/settings.json` env var placeholder | bkit 미사용 → PR #26118 type cast 영향 0건. 단, 향후 placeholder 도입 시 자동 cast 활용 가능 | 🟢 None | 불필요 |
| `.gemini/policies/bkit-permissions.toml`, `.gemini/policies/bkit-starter-policy.toml`, `policies/bkit-extension-policy.toml` | v0.41.x 정책 엔진 변경 (#25720, #25935)은 정책 *해석* 변경. bkit 정책 파일은 wildcard 기반(`argsPattern` 미사용)이므로 직접 영향 0건 | 🟢 None | 불필요 |
| `gemini-extension.json` | v0.41.x 매니페스트 변경 0건 | 🟢 None | 불필요 |
| `bkit.config.json:205-215` `agentMemory` | Gemini 4-tier 메모리(v0.40.0)와 namespace 분리 — 충돌 0건 | 🟢 None | 불필요 |

---

## 7. 철학 정합성 검증 결과 (4대 원칙 1줄씩)

| 원칙 | v0.41.x 변경 정렬 | 비고 |
|---|---|---|
| **Core Mission** (Automation First / No Guessing / Docs=Code) | ✅ 강화 | YOLO fail-closed (No Guessing — parser 실패 시 명시 BLOCK으로 추측 제거), env var auto-cast (Docs=Code — settings.json 의도 명확화), recursive shell validation (Automation First — 자동 재귀 검증) 모두 정렬 |
| **AI Native Principles** (AI as Partner) | ✅ 강화 | autoMemory scratchpad persistence (#25873) — extractor turns -16.7%, precision +32.7% 평가 결과로 AI 협업 효율 향상. ContextManager 재편 (#25409) — chat history 일관성 강화 |
| **PDCA Methodology** (9-Stage Pipeline / Zero Script QA) | ✅ 유지 | v0.41.x 변경이 bkit PDCA 워크플로우에 직접 영향 0건. baseline runner 부팅 8s→1.4s 단축 (#25758)은 Check 단계 가속에 긍정 영향 |
| **Context Engineering** (6-Layer Hierarchy) | ✅ 유지 | Gemini CLI 4-tier 메모리(v0.40.0)와 bkit 6-Layer는 namespace 분리 — v0.41.x ContextManager 재편이 직접 충돌 0건. MCP resources(v0.40.0)는 v0.41에서도 활용 기회 유지 |

**종합**: 4원칙 모두 ✅ (강화 2 / 유지 2). v0.39.1 → v0.40.0 → v0.41.x 일관된 상향 정렬.

---

## 8. 기능 개선 기회 (v0.41.x 신규 9건 + v0.40.0 잔존 5건)

### 8.1 v0.41.x 신규 기회

| # | 새 기능 | bkit 활용 방안 | 예상 효과 | 우선순위 | 난이도 |
|---|---|---|---|---|---|
| 1 | **Auto-memory scratchpad persistence (PR #25873)** | bkit가 `experimental.autoMemory: false`(현재) → `true`로 전환 시 background skill extraction이 turns -16.7% 효율로 자동 작동. 단, bkit는 자체 메모리 사용 — Gemini autoMemory는 *보조 채널*로만 채택 가능 | 🚀 Skill extraction 효율 향상, AI Partnership 강화 | **P2** | 0.5d (검증 위주) |
| 2 | **`tools.core` 명시 allowlist (PR #25720)** | `.gemini/settings.json`에 `tools.core: ["run_shell_command(npm test)", "run_shell_command(npm run build)", ...]` 등 21개 FULL tier agents가 자주 쓰는 명령 화이트리스트화. recursive validation으로 sub-command까지 강제 검증 | 🔒 보안 강화 (No Guessing 원칙 강화), audit trail 명확화 | **P2** | 1d (allowlist 카탈로그 도출 + 회귀 검증) |
| 3 | **`--session-id <uuid>` flag (PR #26060)** | `mcp/bkit-server.js:1097` args에 `--session-id <uuid>` 추가 가능. baseline runner 디버깅 시 session 재현 가능 (PDCA Do 단계 retrace) | 🐛 Debug UX 향상, PDCA Check 단계에서 reproducibility 향상 | **P3** | 0.5d |
| 4 | **CLI subcommand stdout pipe 정상화 (PR #25894)** | bkit가 `gemini extensions list` `gemini mcp list` 호출 0건이지만, 향후 doctor/status 명령 도입 시 자연스럽게 pipe 캡처 가능 | 🛠️ 향후 health check skill 작성 시 stdout assertion 신뢰성 | **P3** | 0건 (미래 활용) |
| 5 | **MCP `gemini mcp list` ping optional (PR #26068)** | bkit가 baseline에서 MCP health check 미사용. 향후 `mcp doctor` skill 작성 시 false negative 우려 사라짐 | 🛠️ 향후 health check 정확성 | **P3** | 0건 (미래 활용) |
| 6 | **Slow boot perf fix (PR #25758, 8s→1.4s)** | 무수정 자동 적용 — bkit `mcp/bkit-server.js:1123` spawn 후 첫 응답 latency 단축. 21개 agent 호출 시 누적 ~150s 절감(추정 21*7=147s) | 💰 PDCA Check 단계 가속, 사용자 대기 시간 단축 | **P0 (자동)** | 0건 |
| 7 | **YOLO/AUTO_EDIT redirection 회귀 fix (PR #26542 v0.41.1)** | bkit가 redirection 사용 시(예: 향후 doctor skill에서 `gemini --version 2>/dev/null`) v0.41.0의 잠시 깨졌던 회귀 자동 복구 | 🛠️ 안정성 | **P0 (자동)** | 0건 |
| 8 | **Telemetry `logPrompts` 누설 fix (PR #26153 v0.40.1)** | bkit가 향후 telemetry 활성 시(현재 미사용) `logPrompts: false` 자동 보장 — 신뢰 가능한 운영 채택 | 🔒 Security/Privacy 강화 | **P3** | 0건 (미래 활용) |
| 9 | **transient error → sticky_retry (PR #26066)** | bkit 에이전트 호출 중 503/rate-limit 시 silently flash fallback 대신 동일 모델 재시도 — 명시 모델 사용 의도 보존 | 🎯 modelRouting 의도 보존 (`bkit.config.json:183-193` 매핑 신뢰성 향상) | **P0 (자동)** | 0건 |

### 8.2 v0.40.0 잔존 기회 (인용)

`docs/03-analysis/gemini-cli-v0.40.0-impact.analysis.md §11` 그대로 유효 (5개):
- MCP resources 도구 export, autoMemory 명시 잠금, 4-tier 메모리 namespace 명문화, GEMINI_CLI_TRUSTED_FOLDERS_PATH 활용, gemma 로컬 fallback.

**합계**: v0.41.x 신규 9건 (자동 적용 4건 + 채택 5건) + v0.40.0 잔존 5건 = **14건** 활용 후보.

---

## 9. 위험·미해결 항목

### 9.1 조사 한계 / 추가 검증 필요

| # | 항목 | 신뢰도 | 추가 검증 방법 |
|---|---|---|---|
| L1 | PR #25720 recursive shell validation의 21개 FULL tier agent LLM 호출 시 회귀 위험 | ⬛⬛⬛⬜⬜ | P3 단계 21개 agent 1개 샘플 명령씩 회귀 스모크 (~1h) |
| L2 | `lib/gemini/version.js:206` `hasToolsCoreAllowlist: isVersionAtLeast('0.39.1')`의 정확성 (PR #25720이 v0.41.0에서 `tools.core` 키 정식 도입) | ⬛⬛⬛⬜⬜ | v0.41.1 npx 격리 실측으로 `tools.core` 키 schema 확정 (Phase 1 §13 #2 잔존) |
| L3 | PR #26118 env var auto-cast의 잠재 회귀 (string 기반 schema 분기를 거치는 코드가 type-cast 후 다른 분기로 가는 경우) | ⬛⬛⬛⬜⬜ | bkit env var placeholder 0건이므로 무영향. 단, 향후 도입 시 검증 필요 |
| L4 | PR #25409 ContextManager의 conversation log JSON 포맷 변경 가능성 | ⬛⬛⬛⬛⬜ | bkit이 직접 파싱 0건이라 무관. PR 본문 정보 부족 (단 한 줄 `fixes #25408`) — bkit 영향 가능성 매우 낮음 |
| L5 | PR #26125 ACP stdout pollution fix가 bkit SessionEnd hook에 미치는 영향 | ⬛⬛⬛⬛⬜ | bkit ACP 미사용 → 무관. 단, 향후 ACP 채택 시 자연스럽게 적용 |

### 9.2 잔존 미해결 (Phase 1 §9)

| PR | 이슈 | 상태 | bkit 대응 |
|---|---|---|---|
| #25827 | Issue #25655 — SessionStart `systemMessage` 중복 렌더 | OPEN (v0.41.1 미포함) | `tests/suites/tc113-session-start-duplication-defense.js` + `tc114-session-start-slim-mode.js` 방어 유지. v0.40.0 분석 §1.4와 동일 — `BKIT_SESSION_START_VERBOSE=false` slim default 유지 |

### 9.3 v0.40.0 baseline 사항 잔존

v0.40.0 분석 §10 (사전 부채 83건과의 상호작용)이 그대로 유효:
- 해소 0건 / 악화 잠재 1건(stdout assertion 회귀, P0 1줄 설정으로 차단) / 무영향 82건.
- v0.41.x 신규 변경은 사전 부채에 추가 영향 0건.

---

## 10. v2.1.0 context-optimization 플랜 정합성 (v0.41.x 추가 시너지)

v0.40.0 분석 §9에서 v2.1.0 plan 본격 갱신 트리거가 발동했고, v0.41.x 신규 9건 중 **MCP resources(v0.40.0)** + **autoMemory scratchpad(v0.41.0)** + **tools.core allowlist(v0.41.0)** 3건이 v2.1.0 Section 4/5/6 갱신 후보로 추가 시너지.

| v2.1.0 항목 | v0.41.x 신규 시너지 | 갱신 권고 |
|---|---|---|
| Section 4 sidecar interface | autoMemory scratchpad (v0.41.0)가 chat history와 별도로 메모리 영속 — Sidecar 채널 후보 추가 | Section 4에 1단락 추가 |
| Section 5 Token Budget | scratchpad persistence는 평가에서 -16.7% extractor turns — 토큰 예산 절감 후보 (현재 8,613 tokens/turn baseline 중 ~5% 추정) | Section 5 재산정 후보에 1줄 추가 |
| Section 6 Skill 통합 | `tools.core` allowlist 채택 시 21개 FULL tier agents의 `run_shell_command` 패턴 카탈로그 자동 도출 가능 — Skill 통합 매트릭스 입력 | Section 6 신규 후보 |

**결론**: v0.41.x 시너지 3건 추가. v2.1.0 plan은 **갱신 진입 시점이 v0.40.0에서 발동, v0.41.x에서 입력 강화**.

---

## 11. 작업량 추정

| 카테고리 | P0 | P1 | P2 | P3 | 합계 |
|---|---|---|---|---|---|
| 코드 수정 (testedVersions, version flags 8개) | ~20분 | 0 | 0 | 0 | ~20분 |
| 설정 수정 (.gemini/settings.json topicUpdateNarration, tools.core 옵션) | ~10분 | 0 | 0 | 0 | ~10분 |
| 테스트 갱신 (tc38 매트릭스 8개 항목 추가) | ~20분 | 0 | 0 | 0 | ~20분 |
| 21개 agent 회귀 스모크 (선택) | 0 | ~1h | 0 | 0 | ~1h |
| MCP resources export PoC (v0.40.0 §11 #1) | 0 | ~3-4h | 0 | 0 | ~3-4h |
| autoMemory scratchpad 검증 (v0.41 신규) | 0 | 0 | ~0.5d | 0 | ~4h |
| tools.core allowlist 카탈로그 (v0.41 신규) | 0 | 0 | ~1d | 0 | ~8h |
| --session-id flag 채택 + Gemma 로컬 fallback (v0.41 신규) | 0 | 0 | 0 | ~1d | ~8h |
| 문서 수정 (gemini-cli-learning SKILL 11단락) | 0 | ~45분 | 0 | 0 | ~45분 |
| **소계** | **~50분** | **~5-6h** | **~12h** | **~8h** | **~26h (전체)** |

### 전략 제안

- **전략 A (Minimal)**: P0 50분만. testedVersions + version flags + topic narration 잠금 + tc38 매트릭스. **회귀 0건이므로 충분**.
- **전략 B (Standard)**: A + P1 5-6h. 21개 agent 회귀 스모크 + MCP resources PoC + 문서 갱신. **v2.1.0 plan 갱신 진입과 시너지**.
- **전략 B' (Recommended)**: A + 21개 agent 회귀 스모크 + 문서 갱신 (~3h). MCP resources PoC는 별도 cycle. **v0.40.0 cycle의 전략 B와 정렬**.
- **전략 C (Full)**: B + P2 12h. autoMemory + tools.core allowlist + (v0.40.0 §11 #3-5). ~3d. **v0.41.x 신규 9건 모두 활용**.

**추천**: **전략 B'** (Critical 0건이지만 v2.1.0 plan 시너지 잡고 21개 agent 회귀 사전 차단). v0.40.0 cycle에서 추천된 전략 B와 정렬. **단일 PR 처리 가능**, 예상 ~4-5시간.

---

## 12. 조사 신뢰도

| 항목 | 신뢰도 | 비고 |
|---|---|---|
| P1~P7 검증 답변 | ⬛⬛⬛⬛⬛ | 7개 모두 코드베이스 grep + Read 검증 |
| Breaking Changes 4건 bkit 영향 | ⬛⬛⬛⬛⬛ | 모두 0건 — grep으로 확정 |
| 21개 FULL tier agents 런타임 회귀 위험 (간접) | ⬛⬛⬛⬜⬜ | 정적 분석 — agent prompt가 wrapper 호출 유도하지 않는 한 영향 0건. P3 단계 스모크 권고 |
| 기능 개선 기회 14건 | ⬛⬛⬛⬛⬜ | v0.41.x 신규 9건 + v0.40.0 잔존 5건. 각 항목 영향 추정 |
| v0.40.0 cycle 분석 인용 정확성 | ⬛⬛⬛⬛⬛ | 동일 cwd의 `docs/03-analysis/gemini-cli-v0.40.0-impact.analysis.md` 직접 Read |
| `tools.core` 키 schema 정확한 명칭 | ⬛⬛⬛⬜⬜ | Phase 1 §13 #2 잔존 — npx 격리 실측 미수행. P3 단계 권고 |
| 사전 부채 83건 영향 | ⬛⬛⬛⬛⬜ | v0.40.0 분석 §10 그대로 유효 |

---

## 13. 최종 결론

### 핵심 5줄 요약

1. **총 영향 추정 파일 수**: v0.40.0 27개 + v0.41.x 신규 6개 = **33개** (중복 제외, Critical 0 / High 5 / Medium 10 / Low 28).
2. **Critical 회귀 0건, High 5건** (v0.40.0 3건 그대로 + v0.41.x 신규 2건 = testedVersions 갱신, version flag 8개 추가). 모두 1줄~15분 수정.
3. **가장 위험한 1건**: 직접 회귀 0건이지만 *간접 위험*은 **PR #25720 recursive shell validation의 21개 FULL tier agents LLM 런타임 호출** — bkit 코드는 wrapper 미사용이지만, agent prompt가 LLM에게 `bash -c "..."` 호출을 유도하면 v0.41에서 차단될 수 있음. 정적 분석으로 무력화 어려움 — P3 단계 21개 agent 회귀 스모크 (~1h) 권고.
4. **가장 큰 개선 기회 1건**: **MCP resources export (v0.40.0 잔존 §11 #1)** — bkit-server에 `bkit-system/philosophy/*.md` 4개 + `templates/*.md` 14개를 MCP resource로 export 시 매 턴 GEMINI.md 토큰 ~30% 절감 추정 + AI Partnership 강화 + v2.1.0 context-optimization 플랜과 직접 시너지. 1d PoC.
5. **P3 단계 권고**: **전략 B'** 채택 (P0 50분 + 21개 agent 회귀 스모크 1h + 문서 갱신 45분 + v2.1.0 plan Section 4/5/6 갱신 진입 ~1h = **~4-5h, 단일 PR**). v0.40.0 cycle의 전략 B와 정렬, MCP resources PoC는 별도 cycle 분리.

### Phase 3 입력

- **회귀 위험**: 직접 0건 / 간접 1건 (21개 agent LLM 호출 패턴, P3 스모크 권고)
- **신규 기능 활용 기회**: 14건 (자동 4건 + 채택 5건 + 잔존 5건)
- **v2.1.0 시너지**: 3건 추가 (autoMemory scratchpad, tools.core allowlist, MCP resources)
- **v0.40.0 cycle 통합**: 본 cycle을 v0.40.0 cycle과 단일 PR로 통합 처리 권고 (v0.40.0 main 머지 미완 상태)
- **전략 B'**: ~4-5h, 단일 PR. Critical 0건이지만 21개 agent 회귀 사전 차단 + v2.1.0 plan 갱신 진입 + 문서 갱신.

---

*분석 종료: 2026-05-06. v0.39.1 → v0.41.1 누적 영향 분석 완료. v0.40.0 cycle 분석 그대로 유효 + v0.41.x 신규 4 Breaking + 9 Feature + 1 Patch 분석. Critical 0 / High 5 / Medium 10 / Low 28. P1~P7 7개 검증 모두 0건 확정 — 단일 PR 처리 가능, 예상 ~4-5h (전략 B').*
*bkit-impact-analyzer agent*
