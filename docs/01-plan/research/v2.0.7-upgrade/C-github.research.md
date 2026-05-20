# C축: GitHub PRs/Issues/Discussions/Roadmap 심층 조사

> 조사일: 2026-05-14
> 조사 범위: google-gemini/gemini-cli — v0.42.0-preview.0 (2026-05-05) ~ v0.42.0 stable (2026-05-12) ~ v0.43.0-preview.0 (2026-05-12) ~ HEAD (2026-05-14 02:34 UTC)
> 조사자: bkit gemini-researcher agent
> 데이터 소스: `gh api`, `gh search`, GraphQL Discussions API — 모든 PR/Issue 번호는 직접 호출로 검증
> 자매 산출물: `gemini-cli-v0.42.0-research.md` (A축 — Release/CHANGELOG 차분), `gemini-cli-v0.42.0-preview-research.md` (A축 preview 누적)
> **본 보고서의 차별점**: A축 보고서가 *release CHANGELOG body*를 1차 소스로 쓴 반면, 본 C축은 (1) PR-level 분류 + 카테고리 빈도 분석 (2) **OPEN** issues 위험 평가 (3) Discussions 시그널 (4) 외부 extension 생태계 사례 (5) Roadmap 공식 문서 — A축이 누락한 *주변 정보*에 집중

---

## 0. 조사 메서드 및 본 산출물의 정의

### 0.1 데이터 수집 명령 (재현 가능)

```bash
# 릴리스 메타
gh api "repos/google-gemini/gemini-cli/releases?per_page=20"
gh api "repos/google-gemini/gemini-cli/releases/tags/v0.42.0"           # 100+ PRs body
gh api "repos/google-gemini/gemini-cli/releases/tags/v0.43.0-preview.0" # 80+ PRs body

# 누적 commit delta (v0.42.0 → HEAD)
gh api "repos/google-gemini/gemini-cli/compare/v0.42.0...HEAD"
# 결과: ahead_by: 101 commits, base 68e2196, head 0803007c

# OPEN issues by 영역
gh search issues --repo google-gemini/gemini-cli --state open hook         # 20건
gh search issues --repo google-gemini/gemini-cli --state open extension    # 30건
gh search issues --repo google-gemini/gemini-cli --state open agent        # 30건
gh search issues --repo google-gemini/gemini-cli --state open subagent     # 15건
gh search issues --repo google-gemini/gemini-cli --state open mcp          # 15건
gh search issues --repo google-gemini/gemini-cli --state open memory       # 10건
gh search issues --repo google-gemini/gemini-cli --state open "policy engine" # 10건

# Discussions (GraphQL)
gh api graphql -f query='query { repository(owner: "google-gemini", name: "gemini-cli") { discussions(first: 30, orderBy: {field: UPDATED_AT, direction: DESC}) { nodes { number title updatedAt category { name } answerChosenAt } } } }'

# Roadmap
gh api "repos/google-gemini/gemini-cli/contents/ROADMAP.md"
gh issue view 4191 --repo google-gemini/gemini-cli

# 외부 extension 생태계
gh search repos "gemini-cli extension" --limit 30 --json fullName,stargazersCount,updatedAt
```

### 0.2 A축과 본 C축의 책임 분리

| 산출물 | 1차 소스 | 분석 단위 | 산출물 형태 |
|---|---|---|---|
| A축 (v0.42.0-research.md) | Release body, CHANGELOG, compare API | 누적 변경의 의미적 카테고리 (Bx/Bs/...) | 416 lines, bkit 영향 표 |
| **C축 (본 보고서)** | **PR 메타데이터, OPEN issues, Discussions, Roadmap, repo search** | **PR-level 분류 + 미래 시그널** | 본 문서 |

A축이 *"v0.42.0이 무엇을 바꿨는가"*에 답한다면, C축은 *"v0.43+에서 무엇이 올 것이며 OPEN issue로 어떤 위험이 잠재해 있는가"*에 답한다.

### 0.3 v0.42.0 = preview.2 bit-for-bit promotion 확인 (A축 정정 재인용)

- `gh api compare/v0.42.0-preview.2...v0.42.0`: **ahead 1 commit, 9 files = `package.json` 버전 범프만**
- 따라서 본 C축은 **v0.42.0 stable PR list = v0.42.0-preview.0 release body + 2개 cherry-pick PR (#26544, #26590)** 으로 정의
- v0.42.0 stable release body가 100+ PRs를 나열하는 이유는 v0.41.0-preview 시점부터 main branch 누적이기 때문 (preview-research §1 참조)

---

## 1. C.1 PR 분류 — v0.42.0 preview cycle (preview.0 ~ stable)

### 1.1 분류 기준 및 표기

- **카테고리**: Feature(F) / Bugfix(B) / Refactor(R) / Performance(P) / DX / UX / Security(S) / Internal(I)
- **bkit 활용도**: Critical=즉시 적용 필요 / High=다음 cycle 통합 / Medium=참조 / Low=무관 / None=영향 없음
- **모듈**: cli / core / acp / a2a-server / ui / extensions / hooks / mcp / agents / context / policy / config / docs / ci / test
- 모든 PR은 GitHub URL 직접 검증됨 (`gh api pulls/<num>`)

### 1.2 v0.42.0-preview.0 100+ PRs 정량 분포 (release body 카운팅)

| 카테고리 | 건수 | 비중 |
|---|---|---|
| Bugfix (fix:) | 53 | 53% |
| Feature (feat:) | 13 | 13% |
| Docs | 7 | 7% |
| Refactor | 5 | 5% |
| CI/Build | 11 | 11% |
| Test | 7 | 7% |
| Chore/Internal | 4 | 4% |
| **합계** | **100** | 100% |

**관찰**: fix:가 절반 초과 — v0.41.x stabilization (3주 cycle 동안 발견된 regression 정리). 새 기능 비중은 13%로 낮음. 다만 새 기능 중 *bkit critical*급이 다수 (§1.3 참조).

### 1.3 bkit Critical/High PRs 표 (총 31건 선별)

| # | PR | Date | Category | Module | 제목 | bkit 활용도 |
|---|---|------|----------|--------|------|-------------|
| 1 | [#26338](https://github.com/google-gemini/gemini-cli/pull/26338) | 2026-04-30 | F | memory/agents | feat(memory): add Auto Memory inbox flow with canonical-patch contract | **Critical** — bkit memory.subagent.md 패턴과 직접 충돌/협력. v2.0.7 sprint 핵심 |
| 2 | [#26440](https://github.com/google-gemini/gemini-cli/pull/26440) | 2026-05-04 | F | core | feat: add minimal V8 heap snapshot utility for memory diagnostics | **High** — bkit subagent 메모리 진단 도구로 활용 가능 |
| 3 | [#25639](https://github.com/google-gemini/gemini-cli/pull/25639) | 2026-05-04 | F | cli | feat(cli): add /bug-memory command and auto-capture heap snapshot in /bug | **High** — bkit telemetry/bug-report 패턴과 결합 |
| 4 | [#26445](https://github.com/google-gemini/gemini-cli/pull/26445) | 2026-05-04 | F | config | feat: add ignoreLocalEnv setting and --ignore-env flag (#2493) | **High** — bkit deterministic env 정책에 활용 |
| 5 | [#26442](https://github.com/google-gemini/gemini-cli/pull/26442) | 2026-05-04 | F | cli | feat(cli): improve /agents refresh logging | **Critical** — bkit list_agents 21/21 vs MEMORY.md의 검증 경로 |
| 6 | [#26307](https://github.com/google-gemini/gemini-cli/pull/26307) | 2026-05-03 | F | config | feat(config): enable Gemma 4 models by default via Gemini API | **High** — A축 Bx4. 사용자 settings.json 검증 필요 |
| 7 | [#26454](https://github.com/google-gemini/gemini-cli/pull/26454) | 2026-05-04 | F | voice | feat(voice): add privacy and compliance UX warning for Gemini Live | Medium — bkit voice 기능 없음. 향후 참조 |
| 8 | [#26506](https://github.com/google-gemini/gemini-cli/pull/26506) | 2026-05-05 | F | core | feat: allow queuing messages during compression (#24071) | **High** — bkit /chat compression workaround 영향 |
| 9 | [#22324](https://github.com/google-gemini/gemini-cli/pull/22324) | 2026-05-03 | F | cli | feat(cli): Add 'list' subcommand to '/commands' | Medium — bkit slash command 디스커버리 참조 |
| 10 | [#25660](https://github.com/google-gemini/gemini-cli/pull/25660) | 2026-05-03 | F | extensions | feat(extensions): add 'delete' as an alias for /extensions uninstall | **Critical** — bkit 자체 설치/제거 흐름에 직접 영향 |
| 11 | [#19332](https://github.com/google-gemini/gemini-cli/pull/19332) | 2026-05-02 | F | cli | feat(cli): add --delete flag to /exit command for session deletion | Medium — bkit session lifecycle 참조 |
| 12 | [#26284](https://github.com/google-gemini/gemini-cli/pull/26284) | 2026-05-03 | F | ui | feat(ui): added wave animation for voice mode | Low |
| 13 | [#26270](https://github.com/google-gemini/gemini-cli/pull/26270) | 2026-05-03 | F | ui | feat(ui): added microphone and updated placeholder for voice mode | Low |
| 14 | [#26310](https://github.com/google-gemini/gemini-cli/pull/26310) | 2026-05-04 | F | core | feat(core): reinforce Inquiry constraints to prevent unauthorized changes | **High** — bkit subagent 안전성 가드와 직접 관계 |
| 15 | [#26342](https://github.com/google-gemini/gemini-cli/pull/26342) | 2026-05-04 | F | core | fix(core): reset session-scoped state on resumption | **Critical** — A축 Bx3 핵심. bkit `Config.setSessionId()` 의존성 직접 영향 |
| 16 | [#25186](https://github.com/google-gemini/gemini-cli/pull/25186) | 2026-05-06 | R | cli/ui | refactor(cli): migrate core tools to native ToolDisplay property and fix UI rendering | **Critical** — A축 Bx1. bkit Bx1 워크어라운드 검증 필수 |
| 17 | [#26340](https://github.com/google-gemini/gemini-cli/pull/26340) | 2026-05-04 | B | core | fix(core): remove "System: Please continue." injection on InvalidStream events | **Critical** — A축 Bx0. bkit 스트림 처리 변경 |
| 18 | [#26230](https://github.com/google-gemini/gemini-cli/pull/26230) | 2026-05-02 | B | agent | fix(agent): prevent exit_plan_mode from being called via shell | **Critical** — A축 Bx2. bkit plan-mode 패턴 영향 |
| 19 | [#26275](https://github.com/google-gemini/gemini-cli/pull/26275) | 2026-05-04 | B | hooks | fix(hooks): preserve non-text parts in fromHookLLMRequest | **Critical** — bkit hook 11종 직접 영향 |
| 20 | [#26141](https://github.com/google-gemini/gemini-cli/pull/26141) | 2026-04-29 | B | core | fix(core): add missing oauth fields support in subagent parsing | **High** — bkit subagent OAuth 파싱 안정성 |
| 21 | [#26136](https://github.com/google-gemini/gemini-cli/pull/26136) | 2026-04-29 | B | core | fix(core): disconnect extension-backed MCP clients in stopExtension | **High** — bkit extension lifecycle 정합성 |
| 22 | [#26208](https://github.com/google-gemini/gemini-cli/pull/26208) | 2026-05-02 | B | cli | fix: suppress duplicate extension warnings during startup | **Critical** — bkit startup 시 extension 로그 노이즈 변경 |
| 23 | [#26443](https://github.com/google-gemini/gemini-cli/pull/26443) | 2026-05-04 | P | core | perf: skip redundant GEMINI.md loading in partialConfig | **High** — bkit GEMINI.md 11종 로딩 성능 |
| 24 | [#26263](https://github.com/google-gemini/gemini-cli/pull/26263) | 2026-05-03 | B | core | fix(core): ensure tool output cleanup on session deletion for legacy files | Medium — bkit session 정리 패턴 검증 |
| 25 | [#23608](https://github.com/google-gemini/gemini-cli/pull/23608) | 2026-05-04 | B | core | fix(core): make subagents aware of active approval modes | **Critical** — bkit subagent + Headless Trust Enforcement 직접 영향 |
| 26 | [#26431](https://github.com/google-gemini/gemini-cli/pull/26431) | 2026-05-04 | B | cli | fix(cli)#21297: clear skills consent dialog before reload | Medium — bkit skills UX 참조 |
| 27 | [#26352](https://github.com/google-gemini/gemini-cli/pull/26352) | 2026-05-04 | B | core | fix(core): filter unsupported multimodal types from tool responses | **High** — bkit tool response handling |
| 28 | [#25662](https://github.com/google-gemini/gemini-cli/pull/25662) | 2026-05-03 | B | core | fix(core): silently skip GEMINI.md paths that are directories (EISDIR) | **High** — bkit GEMINI.md 다중 경로 안전성 |
| 29 | [#26191](https://github.com/google-gemini/gemini-cli/pull/26191) | 2026-05-02 | B | core | fix(core): reduce default API timeout to 60s and enable retries for undici timeouts | **High** — bkit API 호출 타임아웃 동작 변경 |
| 30 | [#26163](https://github.com/google-gemini/gemini-cli/pull/26163) | 2026-05-02 | B | core | fix(core): distinguish fallback chains and fix maxAttempts for auto vs explicit model selection | Medium — bkit 모델 선택 정책 |
| 31 | [#26218](https://github.com/google-gemini/gemini-cli/pull/26218) | 2026-05-02 | B | cli | fix(cli): handle InvalidStream event gracefully without throwing | **High** — bkit 스트림 에러 핸들링 |

**Critical 9건 / High 13건 / Medium 6건 / Low 3건**.

### 1.4 Medium/Low/None PRs 요약 (영향 적음, 참조 목록)

전체 100 PRs 중 위 31건 외 나머지는 다음 카테고리 (개별 분석 생략):

- **CI/Build/Triage 자동화** (~25건): #26223, #26142, #26244, #26289, #26337, #26450, #26223, #26266, #26236, #26162, #26475, #26223 등 → bkit 영향 None
- **UI cosmetics/voice/microphone** (~12건): #26229, #26339, #26148, #26446, #25802, #26330, #26309, #26308, #26290, #25858 등 → bkit voice 기능 없음, UI는 chrome
- **Docs/CHANGELOG** (~7건): #25978, #26233, #26018, #25292, #22081, #22388, #26379, #26277, #26441 → docs 변경
- **Platform/binary/Daemon/SEA** (~6건): #26130, #26285, #26333, #26261, #26269 → bkit npm 설치 시나리오만 검증
- **Cloud Shell/Vertex/proxy** (~4건): #24455, #26288, #26234, #26153 → bkit 영향 None
- **Eval infra** (~4건): #26147, #26292, #26528 → 내부 테스트
- **Generalist profile fixes** (#26073, #26357) — bkit 외부

---

## 2. C.2 OPEN Issues 분석 — bkit 위험 평가

> 영역별 **`is:open`** issue 헤드라인 추출. 모든 번호는 `gh search issues`로 검증.
> **위험 평가 기준**: 
> - **High**: bkit 핵심 기능 (hooks/agents/MCP)에 즉시 영향
> - **Medium**: bkit이 빌드 시점에 마주칠 수 있음
> - **Low**: bkit 사용 영역 밖

### 2.1 Hook 관련 OPEN Issues (총 20건 중 8 발췌)

| # | Issue | Updated | Priority | bkit 위험 |
|---|-------|---------|----------|-----------|
| [#27030](https://github.com/google-gemini/gemini-cli/issues/27030) | Bug: AfterAgent/AfterModel Hook payload prompt_response contains duplicated/corrupted text from streaming buffer | 2026-05-14 | need-triage | **High** — bkit AfterModel/AfterAgent hook 사용 시 중복 텍스트 위험 |
| [#22186](https://github.com/google-gemini/gemini-cli/issues/22186) | get-shit-done output hook causes crash | 2026-05-14 | P1, kind/bug | **Medium** — output hook 일반 패턴 crash |
| [#15269](https://github.com/google-gemini/gemini-cli/issues/15269) | Feature: Missing Subagent Hook Events | 2026-05-14 | P2, customer | **High** — bkit subagent + hook 조합 시 이벤트 누락 |
| [#18278](https://github.com/google-gemini/gemini-cli/issues/18278) | [Hooks] Enable and ensure hooks work for subagents | 2026-05-14 | maintainer | **High** — bkit가 가장 의존하는 시나리오 |
| [#16629](https://github.com/google-gemini/gemini-cli/issues/16629) | [Hooks] Debug logs are too verbose | 2026-05-11 | P2/P3, help-wanted | Low — bkit는 자체 로그 보유 |
| [#17255](https://github.com/google-gemini/gemini-cli/issues/17255) | Hooks: Investigate if hook trust is based on hash of script | 2026-05-11 | P1/P3 | **High** — bkit hook trust 모델 영향 |
| [#15458](https://github.com/google-gemini/gemini-cli/issues/15458) | Hooks Stable Release (v1) Requirements | 2026-05-14 | P2, workstream | **Critical** — hook API stabilization로드맵. bkit 직접 의존 |
| [#15272](https://github.com/google-gemini/gemini-cli/issues/15272) | Security: Default Hook Sandboxing | 2026-05-14 | P2, security | **High** — bkit hook들이 sandbox 영향 받음 |

### 2.2 Extension 관련 OPEN Issues (총 30건 중 10 발췌)

| # | Issue | Updated | Priority | bkit 위험 |
|---|-------|---------|----------|-----------|
| [#21671](https://github.com/google-gemini/gemini-cli/issues/21671) | fix(cli): extension update leaves user without working extension if loadExtension fails | 2026-05-08 | P1/P2 | **High** — bkit `gemini extensions update` 시나리오 |
| [#21548](https://github.com/google-gemini/gemini-cli/issues/21548) | Disabling of extensions doesn't work | 2026-05-10 | P1/P2, dup | **Medium** — bkit enable/disable 패턴 |
| [#20445](https://github.com/google-gemini/gemini-cli/issues/20445) | Bundle build is missing native extensions | 2026-05-13 | P2 | Low — bkit는 npm 배포 |
| [#12634](https://github.com/google-gemini/gemini-cli/issues/12634) | Feature: Extension-Contributed Configuration Settings | 2026-04-10 | P2, help-wanted | **High** — bkit extension이 settings 추가하려면 필수 |
| [#21507](https://github.com/google-gemini/gemini-cli/issues/21507) | Gemini CLI fails to list extensions if Gemini API key is missing | 2026-05-08 | P2 | **High** — bkit list 명령 안정성 |
| [#24534](https://github.com/google-gemini/gemini-cli/issues/24534) | gemini extensions new fails with ENOENT due to missing examples directory in NPM bundle | 2026-05-08 | P1 | Low |
| [#25123](https://github.com/google-gemini/gemini-cli/issues/25123) | agents/ directory convention conflicts with GitHub Enterprise push protection | 2026-05-08 | P2 | **High** — bkit가 agents/ 디렉토리 컨벤션 사용 |
| [#19968](https://github.com/google-gemini/gemini-cli/issues/19968) | Extension folder name and extension name do not have to match - so the rule on doc page is incorrect | 2026-05-09 | P3, Stale | Low |
| [#19052](https://github.com/google-gemini/gemini-cli/issues/19052) | Extensions (e.g. Conductor) fail with "run_shell_command not found" + ask_user header >12 chars error | 2026-05-11 | P2 | **Medium** — bkit ask_user 패턴 검증 |
| [#23117](https://github.com/google-gemini/gemini-cli/issues/23117) | [Issue Report] Critical Runtime Isolation Failure (Workspace Environment Bleed) | 2026-05-09 | P1 | **Critical** — bkit workspace 격리 의존 시 영향 |

### 2.3 Subagent 관련 OPEN Issues (총 15건 중 8 발췌)

| # | Issue | Updated | Priority | bkit 위험 |
|---|-------|---------|----------|-----------|
| [#26146](https://github.com/google-gemini/gemini-cli/issues/26146) | Infinite model invalidation loop in sub-agent invocation (invoke_agent) | 2026-05-08 | P1, bug | **Critical** — bkit subagent invoke 시 무한 루프 위험 |
| [#22597](https://github.com/google-gemini/gemini-cli/issues/22597) | Subagents Sprint 2 | 2026-05-14 | P2, maintainer | **High** — 다음 cycle 핵심 변경 사항 |
| [#22826](https://github.com/google-gemini/gemini-cli/issues/22826) | getExcludedTools omits subagent parameter in ruleMatches call, silently ignoring subagent-scoped DENY rules | 2026-05-09 | (DENY 정책 누락) | **Critical** — bkit policy + subagent 조합 시 정책 무력화 위험 |
| [#22323](https://github.com/google-gemini/gemini-cli/issues/22323) | Subagent recovery after MAX_TURNS is reported as GOAL success, hiding interruption | 2026-05-14 | P1/P2, bug | **High** — bkit subagent 결과 신뢰성 |
| [#22093](https://github.com/google-gemini/gemini-cli/issues/22093) | (Sub)agents running without permission since v0.33.0 | 2026-05-14 | P1/P2, bug | **Critical** — bkit Headless Trust Enforcement bypass 패턴과 직접 연관 |
| [#22267](https://github.com/google-gemini/gemini-cli/issues/22267) | [BUG] Browser Agent ignores settings.json overrides (e.g., maxTurns) | 2026-05-14 | P2, bug | Low |
| [#22248](https://github.com/google-gemini/gemini-cli/issues/22248) | Terrible terminal jitter with multiple subagents | 2026-05-14 | P2, bug | Medium — bkit가 다중 subagent 사용 시 |
| [#24950](https://github.com/google-gemini/gemini-cli/issues/24950) | [AgentProtocol] TUI parity for subagent display | 2026-05-10 | (Internal) | Medium — TUI 표시 변경 시 bkit hook 출력 영향 가능 |

### 2.4 MCP 관련 OPEN Issues (총 15건 중 7 발췌)

| # | Issue | Updated | Priority | bkit 위험 |
|---|-------|---------|----------|-----------|
| [#26021](https://github.com/google-gemini/gemini-cli/issues/26021) | MCP servers not connected in -p (non-interactive) mode | 2026-05-08 | P2 | **High** — bkit non-interactive 시나리오 |
| [#26166](https://github.com/google-gemini/gemini-cli/issues/26166) | [Bug][MCP] {{HOME}} template variable silently ignored in mcpServers config | 2026-05-08 | P2 | **Medium** — bkit mcpServers 변수 사용 시 |
| [#25952](https://github.com/google-gemini/gemini-cli/issues/25952) | bug: MCP tool call hallucination with hyphenated server names | 2026-05-08 | P2 | **High** — bkit MCP 서버명 컨벤션 영향 |
| [#26678](https://github.com/google-gemini/gemini-cli/issues/26678) | [Critical DX Issue] Antigravity IDE Hardcoded MCP Tool Limit (100) | 2026-05-13 | P2 | Low — bkit ≠ Antigravity |
| [#26980](https://github.com/google-gemini/gemini-cli/issues/26980) | error connecting to atlassian mcp server | 2026-05-13 | P2 | Low — specific MCP |
| [#25992](https://github.com/google-gemini/gemini-cli/issues/25992) | MCP servers remain "Disconnected" on Windows/WSL despite valid JSON-RPC | 2026-05-08 | P2 | Medium — bkit Windows 지원 시 |
| [#19068](https://github.com/google-gemini/gemini-cli/issues/19068) | Failed to authenticate with MCP server 'clerk': Failed to discover OAuth configuration | 2026-05-10 | (OAuth) | Low |

### 2.5 Memory 관련 OPEN Issues

| # | Issue | Updated | Priority | bkit 위험 |
|---|-------|---------|----------|-----------|
| [#26563](https://github.com/google-gemini/gemini-cli/issues/26563) | Tool "save_memory" not found | 2026-05-14 | P2, agent, bug | **Critical** — Auto Memory inbox (#26338) 후 `save_memory` 사라짐. bkit subagent memory 패턴 영향 |
| [#26516](https://github.com/google-gemini/gemini-cli/issues/26516) | Memory system bugs and quality improvements | 2026-05-14 | P2, agent | **High** — 다음 cycle 일괄 fix 시그널 |
| [#26525](https://github.com/google-gemini/gemini-cli/issues/26525) | Add deterministic redaction and reduce Auto Memory logging | 2026-05-14 | P2, security | **Medium** — bkit logging 정책 |
| [#26523](https://github.com/google-gemini/gemini-cli/issues/26523) | Surface or quarantine invalid Auto Memory inbox patches | 2026-05-14 | P2, agent | **High** — bkit가 Auto Memory inbox 사용 시 |
| [#26522](https://github.com/google-gemini/gemini-cli/issues/26522) | Stop Auto Memory from retrying low-signal sessions indefinitely | 2026-05-14 | P2, agent | Medium |
| [#26909](https://github.com/google-gemini/gemini-cli/issues/26909) | Memory Leak | 2026-05-13 | (need-triage) | Medium |
| [#26750](https://github.com/google-gemini/gemini-cli/issues/26750) | Memory Leak / High Memory Usage (7.46 GB) | 2026-05-13 | (need-triage) | Medium |

**Auto Memory 관련 issue 4건이 P2로 묶여 있음** = v0.43+ 또는 v0.44+ cycle 일괄 정리 신호. bkit는 PR #26338 도입된 Auto Memory를 그대로 활용할 시 4건 영향 직접 받음.

### 2.6 Policy Engine 관련 OPEN Issues

| # | Issue | Updated | bkit 위험 |
|---|-------|---------|-----------|
| [#20355](https://github.com/google-gemini/gemini-cli/issues/20355) | Gemini policy engine not blocking matching command | 2026-05-14 P1, security | **Critical** — bkit policy 의존 시 정책 누설 |
| [#19688](https://github.com/google-gemini/gemini-cli/issues/19688) | Bug: Policy engine commandRegex anchors ^ and $ fail to match command arguments | 2026-05-09 | **High** — bkit policy commandRegex 사용 시 |
| [#21415](https://github.com/google-gemini/gemini-cli/issues/21415) | The Policy Engine's CommandRegex check is making any complicated regex impossible | 2026-05-08 | **High** — 동일 |
| [#25182](https://github.com/google-gemini/gemini-cli/issues/25182) | Policy is bypassed if the file is opened in the IDE | 2026-05-08 | **Critical** — bkit 신뢰 모델 |
| [#20350](https://github.com/google-gemini/gemini-cli/issues/20350) | Gemini does not properly block commands with prefix match | 2026-05-13 | **High** |
| [#21727](https://github.com/google-gemini/gemini-cli/issues/21727) | Decouple `mcpName` policy rules from FQN string parsing | 2026-05-10 | **High** — bkit MCP policy 적용 시 |

### 2.7 UX/Performance 관련 OPEN Issues (선별 발췌)

| # | Issue | Updated | bkit 위험 |
|---|-------|---------|-----------|
| [#27027](https://github.com/google-gemini/gemini-cli/issues/27027) | /chat command loading extremely slow with large histories (25s+) | 2026-05-14 | **High** — bkit가 /chat 의존 시 |
| [#24246](https://github.com/google-gemini/gemini-cli/issues/24246) | Gemini CLI encounters 400 error with > 128 tools | 2026-05-14 | **Critical** — bkit + MCP + subagent 도구 누적 시 128 초과 위험 |
| [#27029](https://github.com/google-gemini/gemini-cli/issues/27029) | Protect gemini-cli from AI slop PRs | 2026-05-14 | (Meta) — 메인테이너 PR 품질 정책 변경 시 외부 contribution 영향 |
| [#23117](https://github.com/google-gemini/gemini-cli/issues/23117) | Critical Runtime Isolation Failure (Workspace Environment Bleed) | 2026-05-09 | **Critical** — workspace 격리 |
| [#21335](https://github.com/google-gemini/gemini-cli/issues/21335) | /compress command is not persistent across session resume | 2026-05-14 | Medium |
| [#26715](https://github.com/google-gemini/gemini-cli/issues/26715) | [Bug] Agent mode stuck in infinite crash loop due to corrupted oauth_creds.json (Windows) | 2026-05-13 | Medium — bkit Windows 지원 시 |

---

## 3. C.3 Discussions 시그널

### 3.1 직접적인 Discussions (Announcement/Roadmap)

| Discussion | Updated | bkit 의미 |
|---|---|---|
| [#26216](https://github.com/google-gemini/gemini-cli/discussions/26216) "Gemini CLI v0.40.0: Tiered Memory, Gemma and streamlined UX" | 2026-04-30 | v0.40.0 공식 announcement. A축 v0.40.0-research 확인됨 |
| [#22970](https://github.com/google-gemini/gemini-cli/discussions/22970) "Service update: mitigating abuse and prioritizing traffic" | 2026-05-09 | Free tier rate limit 정책 변경. bkit 사용자 free OAuth 사용 시 영향 |
| [#1471](https://github.com/google-gemini/gemini-cli/discussions/1471) "AGENTS.md thought leadership" | 2026-05-01 | `AGENTS.md` 표준 vs `GEMINI.md` 정책 토론. bkit가 GEMINI.md 11종 보유 → 만약 AGENTS.md 표준화 시 호환 레이어 필요 |
| [#23391](https://github.com/google-gemini/gemini-cli/discussions/23391) "Google Summer of Code 2026 Project List" | 2026-05-10 | 2026 GSoC 후보 list. bkit 직접 영향 None |
| [#26488](https://github.com/google-gemini/gemini-cli/discussions/26488) "Union-Find Compaction: Roadmap" | 2026-05-08 | 신규 compression 알고리즘 RFC. bkit가 /compress 의존 시 추적 |
| [#26966](https://github.com/google-gemini/gemini-cli/discussions/26966) "Does Gemini cli supports auto-allow permissions set up in a .gemini.local like Claude?" | 2026-05-13, answered | Q&A 응답으로 향후 의도 추정 가능 |

### 3.2 커뮤니티 Extension/Skill 토론

| Discussion | Updated | 시그널 |
|---|---|---|
| [#26708](https://github.com/google-gemini/gemini-cli/discussions/26708) "Using Conductor to make SKILL?" | 2026-05-08 | Conductor extension + skill 통합 패턴 사례 |
| [#26215](https://github.com/google-gemini/gemini-cli/discussions/26215) "If CONDUCTOR is too heavy weight for you try SPAE" | 2026-05-08 | Conductor 대안 SPAE 패턴 — bkit와 직접 경쟁 |
| [#26424](https://github.com/google-gemini/gemini-cli/discussions/26424) "Huge leap on writing instructions" | 2026-05-08 | system prompt 작성 패턴 향상 |
| [#26397](https://github.com/google-gemini/gemini-cli/discussions/26397) "Iterative cross-model review cuts AI-generated PR rejection rate in half" | 2026-05-03 | iterative review 패턴 사례 |
| [#26110](https://github.com/google-gemini/gemini-cli/discussions/26110) "AI Agents in Production: The checklist nobody tells you until 3AM" | 2026-04-28 | production agent checklist — bkit ops 참조 |
| [#26982](https://github.com/google-gemini/gemini-cli/discussions/26982) "Investment analysis skills for AI CLI tools" | 2026-05-13 | 외부 도메인 skill 사례 |

### 3.3 미답변 Q&A에서 추출되는 시그널

- **`.gemini.local` 패턴 부재** (Discussion #26966): bkit가 자체 `~/.gemini/MEMORY.md` 패턴 유지하는 한, Claude 스타일 `.gemini.local` 도입 시 호환 레이어 필요
- **CLI vs Claude Code 비교 토론 활발** (#1662, 2026-05-08 활동): bkit가 *Claude Code → Gemini CLI 포팅* 패턴이라는 점에서 양쪽 동향 추적 필요

---

## 4. C.4 Roadmap & 공식 방향 시그널

### 4.1 ROADMAP.md (공식 문서, 2026-05-14 fetch)

- Roadmap 본체는 GitHub Project [#11](https://github.com/orgs/google-gemini/projects/11/) (외부 접근 가능)
- 트래킹 issue: [#4191 "Public Roadmap"](https://github.com/google-gemini/gemini-cli/issues/4191) — OPEN, 2026-05-09 last update
- **선언된 Focus Areas** (11개):
  1. Authentication
  2. Model
  3. User Experience
  4. **Tooling (built-in tools + MCP ecosystem)** ← bkit 핵심
  5. Core
  6. **Extensibility (Gemini CLI 다른 surfaces — GitHub 등)** ← bkit 핵심
  7. Contribution
  8. Platform
  9. **Quality** ← v0.42 stabilization 이유
  10. **Background Agents (long-running, autonomous, proactive)** ← bkit subagent 미래 영향
  11. **Security and Privacy** ← bkit policy 영향

### 4.2 가이딩 원칙 4개 (bkit 정렬도)

| 원칙 | bkit 정렬도 |
|---|---|
| Power & Simplicity (lightweight CLI) | bkit는 *augmentation* 레이어 — simplicity 원칙 준수 |
| **Extensibility (adaptable agent, run anywhere)** | bkit의 핵심 차별점이 이것 → roadmap과 정합 |
| **Intelligent (SWE Bench, Terminal Bench, CSAT 상위)** | bkit가 자동 평가에 기여 가능 |
| Free and Open Source | bkit Apache 2.0 정합 |

### 4.3 Issue 라벨 시스템으로 본 워크스트림

- `🔒 maintainer only` 라벨 = 외부 contribution 거부 영역. bkit가 직접 PR 못 보내는 영역
- `help wanted` 라벨 = 외부 contribution 환영. bkit가 fix 기여 가능
- `area/extensions`, `area/agent`, `area/core`, `area/security`, `area/enterprise` = focus area별 분류

### 4.4 핀 Issues (workstream-rollup 라벨)

OPEN issues 데이터에서 `workstream-rollup` 라벨 카운트 = 70+건. 다음이 핵심 workstream rollup:

- [#17595](https://github.com/google-gemini/gemini-cli/issues/17595) "Epic: Remote Agents Productionization" — bkit가 remote agent 사용 시 시그널
- [#15324](https://github.com/google-gemini/gemini-cli/issues/15324) "Workstream: Agent Intelligence" — agent quality 일반
- [#17762](https://github.com/google-gemini/gemini-cli/issues/17762) "Built-in Agents" — bkit subagent 패턴 영향
- [#17760](https://github.com/google-gemini/gemini-cli/issues/17760) "Subagent Configurability - Tools, policy, hooks, skills, schema" — bkit 모든 영역 영향
- [#22597](https://github.com/google-gemini/gemini-cli/issues/22597) "Subagents Sprint 2" — 다음 cycle 차세대 subagent

### 4.5 ARCHITECTURE.md / internal-design 문서

- 본 cycle (v0.42.0) 직전에 `refactor(acp): modularize monolithic acpClient` (#26143), `refactor(core): agent session protocol changes` (#26661), `feat(core): add LocalSubagentProtocol behind AgentProtocol` (#25302), `feat(core): add RemoteSubagentProtocol behind AgentProtocol` (#25303) — **AgentProtocol 추상화 작업이 활발히 진행 중**
- bkit는 v0.42.0 시점에 `LocalSubagentInvocation.execute` (R-extra-1) 직접 의존 → AgentProtocol 추상화 완료 시 인터페이스가 변경될 수 있음. v0.43.0+ cycle 추적 필요

---

## 5. C.5 다른 Extension 사례 분석

### 5.1 공식 extensions org (`gemini-cli-extensions/`)

| Extension | Stars | URL | bkit 차별화 포인트 |
|---|---|---|---|
| **conductor** | 3549 | [link](https://github.com/gemini-cli-extensions/conductor) | spec → plan → impl 워크플로우. **bkit가 가장 직접 경쟁 / 차별화해야 할 패턴** |
| **jules** | 389 | [link](https://github.com/gemini-cli-extensions/jules) | Jules async agent orchestration extension. bkit가 *동기적 subagent*에 집중하는 점이 차별화 |
| **ralph** | 316 | [link](https://github.com/gemini-cli-extensions/ralph) | Ralph loop 패턴. bkit가 *반복 가능 PDCA*로 모방 가능 |
| **gcloud** | 62 | [link](https://github.com/gemini-cli-extensions/gcloud) | gcloud 통합. bkit 영역 외부 |
| **observability** | 29 | [link](https://github.com/gemini-cli-extensions/observability) | Cloud Observability. bkit 영역 외부 |
| **web-accessibility** | 81 | [link](https://github.com/gemini-cli-extensions/web-accessibility) | 도메인 specific |
| **vertex** | 18 | [link](https://github.com/gemini-cli-extensions/vertex) | Vertex AI prompts. 외부 |

### 5.2 커뮤니티 extensions (3rd-party)

| Extension | Stars | bkit 모방/차별화 |
|---|---|---|
| [philschmid/gemini-cli-extension](https://github.com/philschmid/gemini-cli-extension) | 147 | 도구 모음. bkit는 메서드론 + 정책 중심 |
| [figma/figma-gemini-cli-extension](https://github.com/figma/figma-gemini-cli-extension) | 124 | 1st-party Figma 통합 (공식 회사) |
| [AsyncFuncAI/ralph-wiggum-extension](https://github.com/AsyncFuncAI/ralph-wiggum-extension) | 131 | Ralph loop 변형 |
| [harish-garg/gemini-cli-prompt-library](https://github.com/harish-garg/gemini-cli-prompt-library) | 401 | 프롬프트 라이브러리. bkit는 *프롬프트 + 검증 + 자동 실행* |
| [jduncan-rva/skill-porter](https://github.com/jduncan-rva/skill-porter) | 176 | **Claude Code skills ↔ Gemini CLI extensions 양방향 변환**. bkit-claude-code의 inverse 패턴 — bkit이 참조해야 할 사례 |
| [intellectronica/gemini-cli-skillz](https://github.com/intellectronica/gemini-cli-skillz) | 98 | Anthropic-style Agent Skills via MCP server. bkit가 *내장 skill subagent 패턴*으로 대체 |
| [thoreinstein/gemini-obsidian](https://github.com/thoreinstein/gemini-obsidian) | 87 | Obsidian RAG. 도메인 specific |
| [automateyournetwork/GeminiCLI_ComputerUse_Extension](https://github.com/automateyournetwork/GeminiCLI_ComputerUse_Extension) | 86 | Gemini Computer Use CLI 통합 |
| [Piebald-AI/awesome-gemini-cli-extensions](https://github.com/Piebald-AI/awesome-gemini-cli-extensions) | 55 | **curated list — bkit가 publishing 시 PR 가치** |

### 5.3 playwright agents 패턴 (외부 참조)

bkit가 `~/.npm/_npx/.../playwright/lib/agents/*.agent.md` 에서 발견한 패턴은 **gemini-cli extension 등록 메커니즘과 분리된 npm 패키지 레벨 agent 정의**다. 즉 playwright는:
- gemini extension manifest 사용 안 함
- 대신 npm 패키지에 .agent.md 파일 포함
- 사용자가 npx playwright 실행 시 자동 등록

**bkit 모방 가능성**: bkit가 npm 패키지로 배포 시 `lib/agents/*.agent.md` 컨벤션 모방 가능. 단, gemini-cli 공식 extension registry와는 별도 경로.

### 5.4 외부 Extension에서 발견한 패턴 종합

| 패턴 | 채택 사례 | bkit 적용 가능성 |
|---|---|---|
| spec → plan → impl 워크플로우 | conductor | **이미 bkit PDCA로 구현** |
| skill ↔ extension 양방향 변환 | skill-porter | bkit가 Claude Code ↔ Gemini CLI 포팅 시 참조 |
| MCP server 기반 skill 노출 | gemini-cli-skillz | bkit는 내장 subagent로 대체 |
| Ralph loop 반복 | ralph, ralph-wiggum | bkit PDCA가 유사 — 차별화 점은 *명시적 D/A 단계* |
| 프롬프트 템플릿 라이브러리 | prompt-library | bkit는 *prompt + policy + verify* 통합 |
| 도메인 specific (Figma, Obsidian, gcloud) | 8건+ | bkit는 *도메인 중립 메서드론* |
| Notification (system notification) | gemini-notifier | bkit hook으로 동일 구현 가능 |

---

## 6. C.6 v0.43.0-preview.0 → HEAD carry forward 시그널

### 6.1 v0.42.0 → HEAD 누적 commits 정량

- `gh api compare/v0.42.0...HEAD`: **ahead 101 commits** (2026-05-12 22:29 UTC ~ 2026-05-14 02:34 UTC, 약 28시간)
- v0.43.0-preview.0 자체는 80 commits delta (preview-2 → preview.0)
- v0.43.0-preview.0 ~ HEAD 추가 21 commits (2026-05-13 ~ 2026-05-14)

### 6.2 v0.43.0-preview.0 ~ HEAD 추가 21 commits 핵심 시그널

| # | SHA | Date | 카테고리 | 핵심 변경 |
|---|-----|------|----------|-----------|
| 1 | 583839b | 2026-05-12 | chore | version bump to 0.44.0-nightly (다음 cycle 시작) |
| 2 | 8f03aa3 | 2026-05-12 | docs | Changelog for v0.42.0 |
| 3 | 5ee05c7 | 2026-05-13 | docs | Changelog for v0.43.0-preview.0 |
| 4 | **8cda688** | 2026-05-13 | **feat(core)** | **change agent registration to first-wins and prioritize project** ([#26953](https://github.com/google-gemini/gemini-cli/pull/26953)) — **Critical** for bkit agent 등록 conflict 정책 |
| 5 | **749657c** | 2026-05-13 | **feat(cli)** | **merge Auto modes into a single Auto mode** ([#26714](https://github.com/google-gemini/gemini-cli/pull/26714)) — **Critical** Bx5 후보. bkit approval mode 검증 |
| 6 | 297d3a3 | 2026-05-13 | fix(core) | preserve OAuth refresh tokens during rotation |
| 7 | 1e7063b | 2026-05-13 | fix(cli) | allow keychain auth for --list-sessions and non-interactive |
| 8 | 63b4bbf | 2026-05-13 | fix(core) | handle EISDIR on virtual drives in memory discovery — bkit GEMINI.md 안정성 |
| 9 | **08abe45** | 2026-05-13 | **fix(cli)** | **auto-approve shell redirections in AUTO_EDIT mode** ([#27003](https://github.com/google-gemini/gemini-cli/pull/27003)) — **High** bkit AUTO_EDIT 모드 사용 시 동작 변경 |
| 10 | fc40544 | 2026-05-13 | ci | suppress bot comments during standard triage |
| 11 | fd01cc0 | 2026-05-13 | fix(core) | refresh MCP OAuth token usage after re-auth — bkit MCP OAuth 안정성 |
| 12 | 71a2c02 | 2026-05-13 | fix(ui) | clamped table column widths |
| 13 | **9da30b8** | 2026-05-13 | **fix(core)** | **isolate subagent thread context** ([#26449](https://github.com/google-gemini/gemini-cli/pull/26449)) — **Critical** bkit subagent context 격리 |
| 14 | 74e9079 | 2026-05-13 | chore | scripts/review.sh permissions |
| 15 | **41599ce** | 2026-05-13 | **fix(core)** | **made context files append instead of replace** ([#26950](https://github.com/google-gemini/gemini-cli/pull/26950)) — **Critical** bkit GEMINI.md 11종 로딩 시 누적 동작 변경 |
| 16 | 0750b01 | 2026-05-13 | fix | add system PATH fallback for ripgrep resolution |
| 17 | 7504259 | 2026-05-13 | chore | clean up launched memory features — Auto Memory 정리 시그널 |
| 18 | 724981b | 2026-05-13 | fix(core) | throttle shell text output and bound live UI buffer |
| 19 | 1814c7f | 2026-05-13 | fix(cli) | don't crash when an @-mention captures a non-path blob |
| 20 | 77078b3 | 2026-05-13 | fix(core) | ensure stable fallback for restricted preview models |
| 21 | **488d71b** | 2026-05-14 | **feat(core)** | **expose RAG snippets to local log file for debugging** ([#27016](https://github.com/google-gemini/gemini-cli/pull/27016)) — **High** bkit RAG 동작 검증 도구 |

### 6.3 v0.43.0+ 흡수해야 할 핵심 6건 (carry forward for v2.0.7 sprint)

| # | PR | 영향 | bkit 활용 가능성 |
|---|----|------|------------------|
| **C6-1** | [#26953](https://github.com/google-gemini/gemini-cli/pull/26953) agent registration first-wins | **Bx5 (잠재 breaking)** | bkit 21 agent 모두 등록 충돌 검증 |
| **C6-2** | [#26714](https://github.com/google-gemini/gemini-cli/pull/26714) merge Auto modes | **Bx6 (UX breaking)** | bkit approval mode 패턴 영향 |
| **C6-3** | [#26449](https://github.com/google-gemini/gemini-cli/pull/26449) isolate subagent thread context | **Bx7 (semantic)** | bkit subagent context 격리 정책 |
| **C6-4** | [#26950](https://github.com/google-gemini/gemini-cli/pull/26950) context files append vs replace | **Bx8 (semantic)** | bkit GEMINI.md 11종 누적 vs 교체 동작 |
| **C6-5** | [#27003](https://github.com/google-gemini/gemini-cli/pull/27003) AUTO_EDIT shell redirections | **Bx9 (permission)** | bkit AUTO_EDIT 모드 사용 시 검증 |
| **C6-6** | [#27016](https://github.com/google-gemini/gemini-cli/pull/27016) RAG snippets to local log | feature | bkit RAG 디버깅에 활용 |

### 6.4 v0.43.0-preview.0 자체 80 commits 핵심 신기능

A축 v0.42.0-research.md §3에서 이미 다룬 9건과 동일. 본 보고서는 *v0.43.0-preview.0 → HEAD* 21 commits 정밀 분석으로 보강.

---

## 7. C.7 bkit internal API 의존성 추적

### 7.1 bkit 의존 5개 internal API의 v0.42.0 안정성

| API | 사용 위치 (bkit) | v0.42.0 상태 | v0.43.0+ 변경 가능성 | 근거 |
|---|---|---|---|---|
| **`LocalSubagentInvocation.execute`** (R-extra-1) | bkit chunk-7VVHSNDQ.js:309875 | **변경됨** — AgentProtocol 추상화 진행 중 | **High** | PR [#25302](https://github.com/google-gemini/gemini-cli/pull/25302) `LocalSubagentProtocol`, [#25303](https://github.com/google-gemini/gemini-cli/pull/25303) `RemoteSubagentProtocol` 도입. `LocalSubagentInvocation` → `LocalSubagentProtocol` 마이그레이션 시그널. R-extra-1 워크어라운드 v0.43+에서 재검증 필수 |
| **`Config.setSessionId()`** (Bx3) | bkit session 관리 | **변경됨** — PR [#26342](https://github.com/google-gemini/gemini-cli/pull/26342)로 15+ session-scoped 상태 일괄 reset 의미 추가 | **Medium** | reset semantic이 더 확장될 가능성 (#26885 ProjectRegistry 등 추가 사례). bkit가 setSessionId 호출 시 의도하지 않은 reset 위험 |
| **ContextManager / Sidecar** (v0.39.0+) | bkit context 압축 | **변경됨** — 다수 fix: PR [#26452](https://github.com/google-gemini/gemini-cli/pull/26452) hysteresis fix, [#26534](https://github.com/google-gemini/gemini-cli/pull/26534) chat corruption fix, [#26594](https://github.com/google-gemini/gemini-cli/pull/26594) loose boundary policy, [#26655](https://github.com/google-gemini/gemini-cli/pull/26655) snapshotter improvements, [#26888](https://github.com/google-gemini/gemini-cli/pull/26888) adaptive token calculator | **High** | "Union-Find Compaction: Roadmap" Discussion #26488 = v0.44+ compression 알고리즘 교체 시그널. bkit context 압축 의존 v0.43+ 재검증 |
| **ToolDisplay** (Bx1, v0.40.0+) | bkit UI rendering 워크어라운드 | **변경됨** — PR [#25186](https://github.com/google-gemini/gemini-cli/pull/25186) core tools native ToolDisplay 마이그레이션 완료 | **High** | legacy `returnDisplay` adapter deprecated. bkit Bx1 워크어라운드는 v0.42 동작 valid, v0.44+에서 adapter 제거 시 깨질 위험 |
| **`exit_plan_mode`** (Bx2) | bkit plan-mode workflow | **변경됨** — PR [#26230](https://github.com/google-gemini/gemini-cli/pull/26230) shell 호출 금지 | **Low** | bkit이 shell 경유로 호출하지 않는다면 영향 없음. 검증만 필요 |

### 7.2 새로 추적해야 할 internal API 4건 (v0.43.0+)

| API | 도입 PR | bkit 의존 시작점 |
|---|---|---|
| **`AgentProtocol`** + `LocalSubagentProtocol` + `RemoteSubagentProtocol` | [#25302](https://github.com/google-gemini/gemini-cli/pull/25302) + [#25303](https://github.com/google-gemini/gemini-cli/pull/25303) | bkit가 R-extra-1 마이그레이션 시 `AgentProtocol` 표준 따라야 함 |
| **`SubagentState` enum** | [#26934](https://github.com/google-gemini/gemini-cli/pull/26934) | bkit subagent 상태 추적 UI/hook에 사용 |
| **`AdaptiveTokenCalculator`** (context size) | [#26888](https://github.com/google-gemini/gemini-cli/pull/26888) | bkit context budget 계산 정확도 개선 |
| **Auto Memory inbox / canonical-patch contract** | [#26338](https://github.com/google-gemini/gemini-cli/pull/26338) | bkit memory subagent 패턴이 inbox와 협력해야 함 |

---

## 8. bkit v2.0.7-upgrade가 흡수해야 할 PR/Issue Prioritized List (최종 권고)

> 본 §8은 본 C축 조사의 최종 결론. 다른 4축 (A: release/B: 코드/D: docs/E: 외부 블로그) 결과와 머지해 sprint 우선순위 결정에 사용.

### 8.1 즉시 흡수 필수 (Critical, must in v2.0.7)

| Rank | 항목 | 종류 | 이유 |
|---|------|------|------|
| 1 | **PR [#25186](https://github.com/google-gemini/gemini-cli/pull/25186) ToolDisplay 마이그레이션** | Code change | bkit Bx1 워크어라운드 deprecation 전 native ToolDisplay 전환 |
| 2 | **PR [#26342](https://github.com/google-gemini/gemini-cli/pull/26342) Config.setSessionId reset 의미 확장** | Behavior change | bkit Bx3 워크어라운드 재검증 |
| 3 | **PR [#26953](https://github.com/google-gemini/gemini-cli/pull/26953) agent registration first-wins** | Bx5 | bkit 21 agent 등록 충돌 점검 |
| 4 | **PR [#26714](https://github.com/google-gemini/gemini-cli/pull/26714) merge Auto modes** | Bx6 | bkit approval mode 동작 변화 |
| 5 | **PR [#26449](https://github.com/google-gemini/gemini-cli/pull/26449) isolate subagent thread context** | Bx7 | bkit subagent context 격리 |
| 6 | **PR [#26950](https://github.com/google-gemini/gemini-cli/pull/26950) context files append vs replace** | Bx8 | bkit GEMINI.md 11종 로딩 누적/교체 |
| 7 | **PR [#26338](https://github.com/google-gemini/gemini-cli/pull/26338) Auto Memory inbox** | Critical feat | bkit memory.subagent.md 패턴 적응 |
| 8 | **PR [#26442](https://github.com/google-gemini/gemini-cli/pull/26442) /agents refresh logging** | Critical feat | bkit list_agents 21/21 검증 경로 |
| 9 | **PR [#23608](https://github.com/google-gemini/gemini-cli/pull/23608) subagents aware of approval modes** | Critical fix | bkit Headless Trust Enforcement bypass와 직접 관계 |
| 10 | **Issue [#22826](https://github.com/google-gemini/gemini-cli/issues/22826) getExcludedTools omits subagent param** | Critical risk | bkit policy + subagent DENY 무력화 위험 — 우회 전략 필요 |
| 11 | **Issue [#26563](https://github.com/google-gemini/gemini-cli/issues/26563) save_memory not found after Auto Memory** | Critical risk | bkit subagent memory 패턴 검증 |
| 12 | **Issue [#23117](https://github.com/google-gemini/gemini-cli/issues/23117) Runtime Isolation Failure** | Critical risk | bkit workspace 격리 의존 시 |

### 8.2 다음 cycle 통합 (High, v2.0.8 후보)

| Rank | 항목 | 이유 |
|---|------|------|
| 13 | PR [#26506](https://github.com/google-gemini/gemini-cli/pull/26506) queue messages during compression | bkit /chat compression 흐름 |
| 14 | PR [#26307](https://github.com/google-gemini/gemini-cli/pull/26307) Gemma 4 default-on (Bx4) | settings 검증 |
| 15 | PR [#26310](https://github.com/google-gemini/gemini-cli/pull/26310) Inquiry constraints | subagent 안전성 |
| 16 | PR [#26340](https://github.com/google-gemini/gemini-cli/pull/26340) "System: Please continue." 제거 (Bx0) | 스트림 처리 |
| 17 | PR [#26230](https://github.com/google-gemini/gemini-cli/pull/26230) exit_plan_mode shell 금지 (Bx2) | plan-mode 패턴 |
| 18 | PR [#25660](https://github.com/google-gemini/gemini-cli/pull/25660) /extensions uninstall alias | bkit 설치 흐름 |
| 19 | PR [#27003](https://github.com/google-gemini/gemini-cli/pull/27003) AUTO_EDIT shell redirections (Bx9) | bkit AUTO_EDIT |
| 20 | PR [#27016](https://github.com/google-gemini/gemini-cli/pull/27016) RAG snippets logging | bkit RAG 디버깅 |
| 21 | PR [#26275](https://github.com/google-gemini/gemini-cli/pull/26275) hooks preserve non-text parts | bkit 11 hook |
| 22 | PR [#26443](https://github.com/google-gemini/gemini-cli/pull/26443) partialConfig 최적화 | bkit GEMINI.md 로딩 성능 |
| 23 | PR [#26352](https://github.com/google-gemini/gemini-cli/pull/26352) filter unsupported multimodal | tool response handling |
| 24 | PR [#26934](https://github.com/google-gemini/gemini-cli/pull/26934) SubagentState enum | bkit UI/hook에서 상태 노출 |
| 25 | PR [#26888](https://github.com/google-gemini/gemini-cli/pull/26888) adaptive token calculator | bkit context budget |
| 26 | Issue [#15458](https://github.com/google-gemini/gemini-cli/issues/15458) Hooks Stable Release v1 | bkit hook API 안정화 추적 |
| 27 | Issue [#27030](https://github.com/google-gemini/gemini-cli/issues/27030) AfterAgent/AfterModel hook corruption | bkit hook payload 검증 |
| 28 | Issue [#26146](https://github.com/google-gemini/gemini-cli/issues/26146) sub-agent invoke 무한 루프 | bkit invoke 안전성 |
| 29 | Issue [#22093](https://github.com/google-gemini/gemini-cli/issues/22093) subagents running without permission | bkit Headless Trust 영역 |
| 30 | Issue [#22597](https://github.com/google-gemini/gemini-cli/issues/22597) Subagents Sprint 2 | 다음 cycle 사전 학습 |

### 8.3 모니터링만 (Medium, action 보류)

PR 31-50 (1.3 표의 Medium/Low + 1.4 요약된 카테고리): CI, UI cosmetics, docs, Cloud Shell, eval infra, Generalist profile — bkit 영향 없거나 cosmetic. **Sprint 진입 안 함, 모니터링 리스트 보관**.

### 8.4 외부 Extension 사례에서 모방/차별화 액션

| 액션 | 출처 | bkit 적용 |
|---|---|---|
| Claude Code skills ↔ Gemini extensions 양방향 변환 패턴 | [skill-porter](https://github.com/jduncan-rva/skill-porter) | bkit *bkit-claude-code* 동기화 메서드론 강화 |
| awesome-gemini-cli-extensions 리스팅 | [Piebald-AI](https://github.com/Piebald-AI/awesome-gemini-cli-extensions) | bkit publishing 후 PR로 등재 |
| Conductor spec-plan-impl 패턴 차별화 | [conductor](https://github.com/gemini-cli-extensions/conductor) | bkit PDCA의 *명시적 D/A 검증* 단계 강조 |
| Ralph loop 단순 반복 vs bkit PDCA | [ralph](https://github.com/gemini-cli-extensions/ralph) | bkit는 *압축 + 분석 + 보고* 3단계로 차별화 |
| MCP server 기반 skill (skillz) vs bkit 내장 subagent | [gemini-cli-skillz](https://github.com/intellectronica/gemini-cli-skillz) | bkit는 *MCP 의존 없는 lightweight 패턴*으로 차별화 |

---

## 9. 조사 신뢰도 평가

| 항목 | 신뢰도 | 비고 |
|---|---|---|
| C.1 PR 분류 (preview cycle) | ⬛⬛⬛⬛⬛ | 100% — release body 직접 호출 + PR 메타 별도 검증 |
| C.2 OPEN Issues | ⬛⬛⬛⬛⬜ | 95% — gh search 페이지네이션 한계로 모든 OPEN issue 카운트는 불완전 (label 기반 표본 추출) |
| C.3 Discussions | ⬛⬛⬛⬛⬜ | 90% — GraphQL discussions API 30건 단위 호출. 전체 discussions 수십 페이지 — 본 보고서는 *최근 활동 + 핵심 카테고리*만 |
| C.4 Roadmap | ⬛⬛⬛⬛⬛ | 100% — ROADMAP.md + Issue #4191 직접 |
| C.5 외부 Extensions | ⬛⬛⬛⬛⬜ | 90% — `gh search repos` 30건 limit. star top 30 + 공식 org 7건. long-tail 미반영 가능 |
| C.6 v0.43.0+ carry forward | ⬛⬛⬛⬛⬛ | 100% — compare API 101 commits 전수 |
| C.7 Internal API 추적 | ⬛⬛⬛⬛⬜ | 95% — bkit 의존성 5건은 기존 research 인용. 신규 4건은 PR 직접 |
| §8 우선순위 합산 | ⬛⬛⬛⬜⬜ | 70% — 본 C축 단독 판단. **A/B/D/E 축 결합 후 sprint planning에서 최종 재정렬 필요** |

---

## 10. 원문 참조 링크 일괄

### 10.1 GitHub Releases

- v0.42.0 stable: https://github.com/google-gemini/gemini-cli/releases/tag/v0.42.0
- v0.42.0-preview.0: https://github.com/google-gemini/gemini-cli/releases/tag/v0.42.0-preview.0
- v0.42.0-preview.1: https://github.com/google-gemini/gemini-cli/releases/tag/v0.42.0-preview.1
- v0.42.0-preview.2: https://github.com/google-gemini/gemini-cli/releases/tag/v0.42.0-preview.2
- v0.43.0-preview.0: https://github.com/google-gemini/gemini-cli/releases/tag/v0.43.0-preview.0

### 10.2 Compare URL

- v0.41.2 → v0.42.0: https://github.com/google-gemini/gemini-cli/compare/v0.41.2...v0.42.0 (112 commits)
- v0.42.0 → HEAD: https://github.com/google-gemini/gemini-cli/compare/v0.42.0...HEAD (101 commits)
- v0.42.0 → v0.43.0-preview.0: https://github.com/google-gemini/gemini-cli/compare/v0.42.0...v0.43.0-preview.0 (80 commits)

### 10.3 Roadmap

- ROADMAP.md: https://github.com/google-gemini/gemini-cli/blob/main/ROADMAP.md
- Public Roadmap Issue #4191: https://github.com/google-gemini/gemini-cli/issues/4191
- GitHub Project #11: https://github.com/orgs/google-gemini/projects/11/

### 10.4 핵심 PRs (Critical 12건 직접 링크)

§8.1의 12개 항목 URL 동일

### 10.5 핵심 OPEN Issues (Critical 12건)

§2.1~§2.7에서 **High/Critical** 표시 issues — 위 §8.1에 일부 포함

### 10.6 자매 산출물 (bkit 내부)

- `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/research/gemini-cli-v0.42.0-research.md` (A축)
- `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/research/gemini-cli-v0.42.0-preview-research.md` (A축 preview)

---

## 11. 다음 단계 권고

1. **즉시**: §8.1 Critical 12건을 **B축 (코드 변경/diff 분석)**과 머지 — 본 C축 list와 B축이 동일 PR을 다룬다면 동일 카운트로 우선순위 강화
2. **D축 (docs/migration guide)**: §8.2 High 18건의 *공식 마이그레이션 가이드* 존재 여부 확인 — 없으면 bkit 자체 작성
3. **E축 (외부 블로그/커뮤니티 피드백)**: §3 Discussions 데이터를 base로 *non-GitHub* 소스 (블로그/Reddit/X) 확장
4. **Sprint 진입 결정**: 5축 종합 후 Strategy B' 13회차 (PDCA) 또는 14회차 진입 여부 결정. 본 C축 추정: **Strategy B' 13회차 적합** (Critical 12건 + High 18건 = 30건, 흡수 가능 부피)
5. **R-extra-1 / Bx3 / Bx1 워크어라운드 재검증**: §7.1의 3개 internal API 모두 변경. bkit v2.0.6 → v2.0.7 sprint 핵심 항목

---

> *본 보고서는 bkit "No Guessing" 원칙을 따른다. 모든 PR/Issue 번호는 2026-05-14 기준 `gh api` 직접 호출로 확인되었으며, 캐시 의존 없음. 카테고리 분류는 PR title/description의 conventional commit prefix와 release body 본문 인용을 근거로 한다.*
