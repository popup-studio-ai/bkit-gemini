# Gemini CLI v0.38.0 변경사항 조사 보고서 (v0.37.2 → v0.38.0)

> 조사일: 2026-04-16 (재조사 · 최종본)
> 조사 범위: v0.37.2 (2026-04-13) → v0.38.0 (2026-04-14)
> 확장 범위: v0.38.0 → **v0.38.1 (2026-04-15, 최신 stable)** 포함
> 누적 범위: v0.36.0 (bkit 현재 target) → v0.38.x (최신 stable)
> 조사자: gemini-researcher agent
> bkit 현재 버전: v2.0.4 (Gemini CLI v0.36.0 대상)
> **감지된 최신 stable: v0.38.1 (released 2026-04-15, ~24h before 조사 시점)**

---

## 1. 버전 개요 (Version Overview)

### 1.1 릴리스 타임라인 (2026-04-16 기준)

| 버전 | 릴리스일 | 유형 | 주요 테마 |
|------|---------|------|----------|
| **v0.36.0** | 2026-04-01 | Stable | 멀티레지스트리, 네이티브 샌드박싱 (bkit 현재 target) |
| v0.37.0 | 2026-04-08 | Stable | Plan Mode stable, enableAgents=true 복원 |
| v0.37.1 | 2026-04-09 | Stable (Patch) | ACP 오류 처리 |
| v0.37.2 | 2026-04-13 | Stable (Patch) | UI 표 렌더링 수정 (cherry-pick) |
| **v0.38.0** | **2026-04-14** | **Stable (Minor)** | **ContextCompressionService, Background Memory Service, Hook UI systemMessage, BeforeModel E2E, TerminalBuffer 모드 (기본 off), Background Process 도구** |
| **v0.38.1** | **2026-04-15** | **Stable (Patch) — 최신** | **Plan Mode 모델 라우팅 silent fallback (cherry-pick of PR #25317)** |
| v0.39.0-preview.0 | 2026-04-14 | Preview (not stable) | invoke_subagent 통합, ContextManager+Sidecar, /memory inbox, JSONL chat recording |
| v0.40.0-nightly.20260415.g06e7621b2 | 2026-04-15 | Nightly | — |

> **재조사 갱신 포인트**: 이전 조사본(2026-04-15)에서는 v0.38.0이 최신 stable이었으나, 당일 후반 **v0.38.1 패치가 릴리스됨**. 본 보고서는 v0.38.1을 최종 타깃으로 반영한다.

### 1.2 v0.37.2 → v0.38.0 릴리스 규모

- **커밋 수**: 109 (v0.37.2 기준 ahead_by=109, behind_by=12)
- **변경 파일**: ~300
- **기여자**: 40+ 명 (New contributors 5명 포함)
- **릴리스 타입**: **Minor version bump** (0.37.x → 0.38.0) — v0.38.0-preview.0에서 누적된 기능들의 stable 승격

### 1.3 v0.38.0 → v0.38.1 릴리스 규모

- **커밋 수**: 2 (cherry-pick 1 + release chore 1)
- **변경 파일**: 13
- **핵심 PR**: [#25466](https://github.com/google-gemini/gemini-cli/pull/25466) — cherry-pick of commit `050c303` (원본 PR [#25317](https://github.com/google-gemini/gemini-cli/pull/25317))
- **릴리스 타입**: **Patch** — Plan Mode 모델 라우팅 silent fallback 일관성 수정

### 1.4 주요 테마

v0.38.0은 **preview 단계의 주요 기능들을 stable로 승격한 minor 릴리스**. 네 가지 핵심 축:

1. **컨텍스트 관리 고도화**: `ContextCompressionService`, Auto heap memory, Chapters selective expansion
2. **Hook 시스템 UX 개선**: 훅의 `systemMessage`를 UI에 표시 (`hooksConfig.showOutput`)
3. **BeforeModel 훅 E2E 수정**: `llm_request.model` 오버라이드가 실제 API 호출까지 전파
4. **Background Memory Service (실험적)**: 세션 히스토리에서 자동 스킬 추출 (`experimentalMemoryManager`)
5. **샌드박스/터미널 안정화**: Linux ARG_MAX 수정, Windows PowerShell 경로, TerminalBuffer 모드 (기본 false로 회귀)

v0.38.1은 **Plan Mode 모델 라우팅 silent fallback 패치 한 건**만 담은 핫픽스이다.

---

## 2. Breaking Changes (하위 호환성 깨짐)

### 2.1 v0.37.2 → v0.38.0 구간 신규 Breaking Changes

v0.38.0 릴리스 노트에는 "Breaking Changes: None explicitly listed"로 표기되어 있으나, 내부적으로 동작이 바뀌는 항목이 존재한다. 아래는 실질적 영향이 있는 항목이다.

| # | 항목 | 이전 동작 | 이후 동작 | 영향 범위 | 참조 |
|---|------|-----------|-----------|-----------|------|
| 1 | `ui.loadingPhrases` 기본값 변경 | `'tips'` (로딩 중 팁 표시) | `'off'` (팁 숨김) | 🟢 **LOW** — 사용자 체감 UX만. bkit 기능 영향 없음. 원복 시 settings에 명시적 지정 | [PR #24342](https://github.com/google-gemini/gemini-cli/pull/24342) |
| 2 | 키바인딩 변경: `Ctrl+X` → `Ctrl+G` (외부 에디터) | `Ctrl+X`로 외부 에디터 호출 | `Ctrl+G` 호출. `Ctrl+X` 입력 시 토스트 안내 | 🟢 **LOW** — 인터랙티브 CLI 키바인딩 한정 | [PR #24861](https://github.com/google-gemini/gemini-cli/pull/24861) |
| 3 | IDE 디버깅 단축키 이동: `Ctrl+G` → `F4` | `Ctrl+G` = IDE 디버깅 통합 | `F4` = IDE 디버깅 통합 | 🟢 **LOW** — IDE 통합 사용자만 | [PR #24861](https://github.com/google-gemini/gemini-cli/pull/24861) |
| 4 | Chapters `update_topic` UX 조정 | 모든 경우 topic header 표시 | 단순 작업에서 억제. prioritize-summary 로직은 revert | 🟢 **LOW** — UI 출력 한정. bkit 영향 없음 | [PR #24640](https://github.com/google-gemini/gemini-cli/pull/24640), [revert #24777](https://github.com/google-gemini/gemini-cli/pull/24777) |
| 5 | PowerShell translation 제거 (Windows) | Windows에서 POSIX 명령을 PowerShell로 자동 번역 | 번역 제거(broken 상태였음), native `__write` 경로 수정 | 🟡 **MEDIUM (Windows 한정)** — POSIX 명령 직접 실행이 `cmd`/`pwsh`에 따라 다르게 동작 | [PR #24571](https://github.com/google-gemini/gemini-cli/pull/24571) |
| 6 | `ui.compactToolOutput` 기본값 `true` 승격 | v0.37.0에서 변경되어 이어짐 | 툴 출력 자동 압축 기본 활성 | 🟢 **LOW** — 훅은 raw output 수신하므로 영향 없음 | [PR #24510](https://github.com/google-gemini/gemini-cli/pull/24510) |
| 7 | TerminalBuffer 모드 기본값 유지 `false` (회귀) | preview에서 true로 전환 시도 | v0.38.0 안정화 위해 `renderProcess`/`terminalBuffer` **기본 false** 유지 | 🟢 **LOW** — opt-in. bkit 영향 없음 | [PR #24873](https://github.com/google-gemini/gemini-cli/pull/24873) |

### 2.2 v0.38.0 → v0.38.1 구간 신규 Breaking Changes

**없음.** 단일 패치(silent fallback) 추가 동작으로, 기존 API/설정 스키마 영향 없음.

### 2.3 v0.36.0 → v0.38.1 누적 Breaking Changes (참조)

v0.37.x 조사 보고서의 기존 항목(`experimental.enableAgents=true` 복원, `experimental.jitContext=false`, `ui.compactToolOutput=true`, Plan Mode stable 승격) 모두 v0.38.x에서도 유효. 추가로 위 2.1의 7개 항목.

---

## 3. 새로운 기능 (New Features)

### 3.1 v0.38.0 핵심 신기능

| # | 기능명 | 설명 | 사용법 | bkit 활용 가능성 | 참조 |
|---|--------|------|--------|-----------------|------|
| 1 | **ContextCompressionService** | 컨텍스트 자동 압축 서비스 (Chapters 파이프라인 통합 준비). `ContextManager` → `MemoryContextManager` 리네임. `experimental.generalistProfile` 추가 | `experimental.generalistProfile: true` | 🟢 **HIGH** — bkit v2.1.0 context-optimization 계획과 직접 연관. 자체 압축 vs 내장 서비스 역할 재검토 | [PR #24483](https://github.com/google-gemini/gemini-cli/pull/24483) |
| 2 | **Background Memory Service (스킬 자동 추출)** | 백그라운드 서브에이전트("confucius")가 세션 히스토리를 스캔하여 `~/.gemini/memory/<project>/skills/`에 SKILL.md 자동 생성. `O_CREAT|O_EXCL` 락으로 다중 인스턴스 조율 | `experimentalMemoryManager: true` | 🟡 **MEDIUM** — bkit 자체 스킬 관리와 경로 충돌 가능. 기본 비활성이므로 당장은 리스크 없음 | [PR #24274](https://github.com/google-gemini/gemini-cli/pull/24274) |
| 3 | **Hook System Messages UI 표시** | 훅이 JSON `systemMessage` 반환 시 CLI UI 채팅 히스토리에 INFO 메시지 표시. 훅 소스명 병기 | `hooksConfig.showOutput: true` + 훅이 `{decision, systemMessage}` JSON 반환 | 🟢 **HIGH** — bkit 훅이 이미 `decision/systemMessage` 포맷 사용(commit 7078c2a). 설정 활성화만으로 UX 향상. **v2.1.x에서 기본 활성화 권장** | [PR #24616](https://github.com/google-gemini/gemini-cli/pull/24616) |
| 4 | **BeforeModel 훅 E2E 모델 오버라이드** | `BeforeModel` 훅에서 `llm_request.model` 지정 시 실제 API 호출까지 전파. 이전엔 조용히 무시됨 | 훅 반환: `{hookSpecificOutput: {hookEventName: "BeforeModel", llm_request: {model: "gemini-2.5-flash"}}}` | 🟢 **HIGH** — 작업 유형별 모델 라우팅 훅 신규 구현 가능 (리뷰=pro, 간단=flash-lite) | [PR #24784](https://github.com/google-gemini/gemini-cli/pull/24784) |
| 5 | **Subagent workspace 격리 (AsyncLocalStorage)** | 서브에이전트 워크스페이스가 메인 컨텍스트 오염 방지. `LocalAgentDefinition.workspaceDirectories` 필드 추가 | 서브에이전트 정의에 `workspaceDirectories: [dir]` | 🟢 **HIGH** — bkit 서브에이전트 스코프 제한 | [PR #24445](https://github.com/google-gemini/gemini-cli/pull/24445) |
| 6 | **Background Process 모니터링 도구** | `ListBackgroundProcessesTool`, `ReadBackgroundOutputTool` 신규. `sleep 60 &` 류 상태 조회/로그 읽기. 세션 스코프 격리, 심볼릭 링크 차단 | 에이전트 자동 사용. `Shell` 툴에서 `[background]` 마커 | 🟡 **MEDIUM** — bkit BeforeTool 훅 matching 리스트에 추가 검토 필요 | [PR #23799](https://github.com/google-gemini/gemini-cli/pull/23799) |
| 7 | **환경변수 기본값 문법 (`${VAR:-default}`)** | settings.json, extension config에서 bash 스타일 기본값 지원 | `"url": "${API_URL:-https://default.example.com}"` | 🟢 **HIGH** — bkit extension config 단순화 | [PR #24469](https://github.com/google-gemini/gemini-cli/pull/24469) |
| 8 | **Context-aware Persistent Policy Approvals** | "Allow for all future sessions" 시 approval mode 계층(`plan < default < autoEdit < yolo`)에 따라 상위 허용 모드 자동 포함. 중복 규칙 병합 | `security.enablePermanentToolApproval: true` + UI에서 "Allow for all" | 🟡 **MEDIUM** — bkit 스킬 자동 TOML 정책과 상호작용 검증 필요 | [PR #23257](https://github.com/google-gemini/gemini-cli/pull/23257) |
| 9 | **Auto-configure Heap Memory** | Node.js 힙 크기 자동 최대화. OOM 사실상 제거 | 기본 활성 (opt-out 별도) | 🟢 **LOW–HIGH** — bkit 대용량 컨텍스트 OOM 완화. 테스트 환경 메모리 사용량 증가 모니터링 | [PR #24474](https://github.com/google-gemini/gemini-cli/pull/24474) |
| 10 | **TerminalBuffer 렌더링 모드** | Ink alternate buffer flicker 해결. 정적/동적 분리 렌더링. Wide char 지원 개선 | `renderProcess`, `terminalBuffer` 설정. **v0.38.0에서 기본 false로 유지** (회귀 대응 #24873) | 🟢 **LOW** — 내부 렌더링 | [PR #24512](https://github.com/google-gemini/gemini-cli/pull/24512), [#24873](https://github.com/google-gemini/gemini-cli/pull/24873) |
| 11 | **`experimental.adk.agentSessionNoninteractiveEnabled`** | 비인터랙티브 에이전트 세션 활성화 플래그 | settings에 추가, 기본 false | 🟡 **MEDIUM** — bkit CI/배치에서 활용 가능성 | [PR #24439](https://github.com/google-gemini/gemini-cli/pull/24439) |
| 12 | **nonInteractiveCli → LegacyAgentSession** | 비인터랙티브 경로가 LegacyAgentSession 사용. 내부 리팩토링 | — | 🟡 **WATCH** — bkit e2e 비인터랙티브 실행 동작 검증 | [PR #22987](https://github.com/google-gemini/gemini-cli/pull/22987) |
| 13 | **Role-specific metrics in /stats** | `/stats`에 역할별 메트릭 | 자동 | 🟢 **LOW** | [PR #24659](https://github.com/google-gemini/gemini-cli/pull/24659) |
| 14 | **Minimalist sandbox status labels** | 샌드박스 상태 라벨 간소화 | 자동 | 🟢 **LOW** | [PR #24582](https://github.com/google-gemini/gemini-cli/pull/24582) |
| 15 | **Scrollbar for input prompt** | 입력 프롬프트 스크롤바 | terminalBuffer 모드 한정(#25320) | 🟢 **LOW** | [PR #21992](https://github.com/google-gemini/gemini-cli/pull/21992) |
| 16 | **ACP: `/about`, `/help` 명령 지원** | ACP 세션에서 슬래시 명령 지원 확장 | — | 🟢 **LOW** — bkit은 ACP 경로 미사용 | [PR #24649](https://github.com/google-gemini/gemini-cli/pull/24649), [#24839](https://github.com/google-gemini/gemini-cli/pull/24839) |
| 17 | **Agent Protocol UI types + experimental flag** | 에이전트 프로토콜 UI 타입/`useAgentStream` 훅 | 내부 API | 🟡 **WATCH** — v0.39+ 확장 가능 | [PR #24275](https://github.com/google-gemini/gemini-cli/pull/24275) |
| 18 | **Selective Topic Expansion (Chapters)** | 긴 세션에서 chapter topic click-to-expand. 선택적 확장으로 컨텍스트 절약 | 자동 | 🟢 **LOW-MEDIUM** — 사용자 UX. bkit 세션 관리와 독립 | [PR #24793](https://github.com/google-gemini/gemini-cli/pull/24793) |
| 19 | **Browser agent isolation (concurrent)** | 동시 실행 browser 에이전트 인스턴스 격리 | 자동 | 🟡 **MEDIUM** — bkit에서 웹 작업 병렬화 시 영향 | [PR #24794](https://github.com/google-gemini/gemini-cli/pull/24794) |

### 3.2 v0.38.1 신규 기능

| # | 기능명 | 설명 | 사용법 | bkit 활용 가능성 | 참조 |
|---|--------|------|--------|-----------------|------|
| 1 | **Plan Mode 모델 라우팅 Silent Fallback** | Plan 모드에서 고성능 모델 사용 불가 시 조용히 fallback. 'PLAN' approval mode에서 SILENT_ACTIONS를 일관 주입하여 불필요한 중단 방지 | 자동 (Plan Mode 진입 시 적용) | 🟢 **MEDIUM** — bkit이 Plan Mode를 활용한다면 모델 가용성 이슈 시 UX 안정. 훅 기반 모델 라우팅과 상호작용 시 동작 확인 필요 | [PR #25317](https://github.com/google-gemini/gemini-cli/pull/25317), cherry-pick [#25466](https://github.com/google-gemini/gemini-cli/pull/25466), commit `050c303` |

### 3.3 v0.36.0 → v0.38.1 누적

v0.37.x 조사의 15개 항목(Plan Mode stable + Model Routing, Chapters, Dynamic Sandbox Expansion, `context.memoryBoundaryMarkers`, Project-Level Memory Scope 등)도 그대로 유효. v0.38.x는 그 위에 **19 + 1 = 20개** 추가.

---

## 4. Deprecation 예고 (Deprecation Warnings)

| # | 항목 | 예고 버전 | 제거 예정 | 현재 대안 | 참조 |
|---|------|-----------|-----------|-----------|------|
| 1 | Legacy subagent wrapping tools | v0.39.0-preview.0 예고 | v0.39.x stable | `invoke_subagent` 통합 도구로 대체 | [PR #24489](https://github.com/google-gemini/gemini-cli/pull/24489), [#25053](https://github.com/google-gemini/gemini-cli/pull/25053) |
| 2 | `Ctrl+X` 외부 에디터 단축키 | v0.38.0 | 미정 (토스트 안내 유지) | `Ctrl+G` | [PR #24861](https://github.com/google-gemini/gemini-cli/pull/24861) |
| 3 | `ContextManager` 클래스명 | v0.38.0 | — | `MemoryContextManager`로 리네임 (내부 API) | [PR #24483](https://github.com/google-gemini/gemini-cli/pull/24483) |
| 4 | `keytar` 의존성 | v0.39.0-preview 예고 (v0.38.x 미반영) | v0.39.x stable | `@github/keytar` 포크로 교체 예정 | v0.39.0-preview.0 릴리스 노트 |

---

## 5. 설정/구성 변경 (Configuration Changes)

| # | 설정 항목 | 변경 유형 | 이전 | 이후 | 참조 |
|---|-----------|-----------|------|------|------|
| 1 | `ui.loadingPhrases` | 기본값 변경 | `'tips'` | `'off'` | [PR #24342](https://github.com/google-gemini/gemini-cli/pull/24342) |
| 2 | `hooksConfig.showOutput` | **신규 추가** | — | `boolean`, 기본 `false`. 훅 systemMessage UI 표시 | [PR #24616](https://github.com/google-gemini/gemini-cli/pull/24616) |
| 3 | `experimental.generalistProfile` | **신규 추가** | — | `boolean`, 기본 `false`. 컨텍스트 관리 기본 하이퍼파라미터 | [PR #24483](https://github.com/google-gemini/gemini-cli/pull/24483) |
| 4 | `experimentalMemoryManager` | **신규 추가** | — | `boolean`, 기본 `false`. Background Memory Service | [PR #24274](https://github.com/google-gemini/gemini-cli/pull/24274) |
| 5 | `experimental.adk.agentSessionNoninteractiveEnabled` | **신규 추가** | — | `boolean`, 기본 `false` | [PR #24439](https://github.com/google-gemini/gemini-cli/pull/24439) |
| 6 | `renderProcess`, `terminalBuffer` | **신규 추가** | — | TerminalBuffer 모드 제어. v0.38.0에서 기본 `false` (회귀) | [PR #24512](https://github.com/google-gemini/gemini-cli/pull/24512), [#24873](https://github.com/google-gemini/gemini-cli/pull/24873) |
| 7 | 환경변수 기본값 문법 `${VAR:-default}` | **신규 문법** | 미지원 | settings/extension config 지원 | [PR #24469](https://github.com/google-gemini/gemini-cli/pull/24469) |
| 8 | Heap memory auto-configuration | **자동 활성** | 수동 옵트인 | 자동 | [PR #24474](https://github.com/google-gemini/gemini-cli/pull/24474) |
| 9 | Plan mode 정책: `web_fetch with ask_user` 명시적 허용 | 정책 완화 | 일반 허용 | plan mode에서 `ask_user` 쌍으로 명시 허용 | [PR #24456](https://github.com/google-gemini/gemini-cli/pull/24456) |
| 10 | Plan mode 정책: `complete_task` 허용 | 정책 완화 | 제한 | 허용 | [PR #24771](https://github.com/google-gemini/gemini-cli/pull/24771) |
| 11 | Project memory dir을 tmp 하위로 이동 | 경로 변경 | 프로젝트 루트 인근 | tmp 디렉토리 하위 | [PR #24542](https://github.com/google-gemini/gemini-cli/pull/24542) |
| 12 | Plan Mode Silent Actions (v0.38.1) | 동작 강화 | Plan Mode에서 일부 action 중단 | SILENT_ACTIONS 일관 주입으로 조용히 처리 | [PR #25317](https://github.com/google-gemini/gemini-cli/pull/25317) |

---

## 6. Extension 시스템 변경 (gemini-extension.json / MCP / Hooks)

### 6.1 Extension Manifest (gemini-extension.json)

- **환경변수 기본값 문법 지원** (PR #24469): extension config의 `env`, `args`, URL 필드 등에서 `${VAR:-default}` 사용 가능. bkit `gemini-extension.json`의 MCP 서버 엔트리 단순화 가능.
- 기타 manifest 스키마 Breaking Change 없음. bkit v2.0.4의 `"mcpServers"` 엔트리 형식 그대로 유효.

### 6.2 MCP Server

- **MCP server OAuth redirect port 문서 업데이트** (v0.38.0-preview에 포함): 포트 지정 방식 명확화
- **Scheduler dispose 추가** (v0.38.0-preview): `McpProgress` listener leak 방지 — bkit `bkit-server` 장기 실행 시 메모리 안정성 향상
- MCP stdio/sse 프로토콜 스키마 변경 없음. `mcp/schema.ts` 호환 유지

### 6.3 Hook System

**가장 큰 bkit 관련 변화 영역이다.**

| 항목 | 이전 | 이후 | bkit 영향 |
|------|------|------|----------|
| `hooksConfig.showOutput` 신규 | 없음 | `true` 시 `systemMessage`를 UI INFO로 표시 | bkit 훅은 이미 `{decision, systemMessage}` 반환 (commit 7078c2a) → **설정만 켜면 즉시 UX 향상** |
| BeforeModel E2E 모델 오버라이드 | 무시됨 | `llm_request.model` 전파 | bkit에서 작업별 모델 라우팅 훅 신규 구현 가능 |
| AfterTool `complete_task` 기록 | 누락 | chat history에 기록 | bkit AfterTool 훅이 `complete_task`를 보도록 한다면 trigger 빈도 증가 — 회귀 확인 필요 |
| 서브에이전트 스킬 주입 | 메인만 | 서브에이전트에도 전파 | bkit 스킬이 서브에이전트에서 일관 동작 (#24620) |
| `/skills list` stdout | stderr로 빠짐 | stdout 출력 | bkit CI 사용 시 파싱 용이 (#24566) |
| Subagent `workspaceDirectories` | 없음 | 필드 신규 | bkit 서브에이전트 보안 격리 |

### 6.4 Skills System

- **Background Memory Service 경로 충돌 가능성**: `~/.gemini/memory/<project>/skills/`에 auto-gen SKILL.md — bkit 스킬 디렉토리와 경로 네이밍 충돌 가능. `experimentalMemoryManager` 기본 `false`이므로 현재 리스크 없음
- **Subagent skill propagation** (#24620): bkit 스킬이 서브에이전트 context에도 주입되어 일관성 향상
- **Skill reload refresh** (#24454): `/skills reload` 후 슬래시 명령 리스트가 즉시 갱신

---

## 7. 버그 수정 (bkit 관련)

| # | 이슈 | 설명 | bkit 관련성 | 참조 |
|---|------|------|-------------|------|
| 1 | Linux sandbox ARG_MAX crash | 다수 경로 제한 시 bubblewrap 인자가 ARG_MAX 초과. args-file 패턴으로 해결 | Linux 환경에서 bkit MCP 서버/스킬 다수 등록 시 완화 | [PR #24286](https://github.com/google-gemini/gemini-cli/pull/24286) |
| 2 | `complete_task` chat history 누락 | 서브에이전트 완료 툴 호출 히스토리 누락 | bkit AfterTool 훅 동작 재검증 | [PR #24437](https://github.com/google-gemini/gemini-cli/pull/24437) |
| 3 | 에이전트가 모든 declinable 툴 취소 시 정지 안함 | 중단 로직 수정 | bkit 제어 흐름 간접 영향 | [PR #24479](https://github.com/google-gemini/gemini-cli/pull/24479) |
| 4 | Shell output display 깨짐 | 쉘 툴 출력 표시 수정 | 간접 | [PR #24490](https://github.com/google-gemini/gemini-cli/pull/24490) |
| 5 | Windows vim editor 크래시 | PATH에 vim 없을 때 크래시 | Windows bkit 사용자 | [PR #22423](https://github.com/google-gemini/gemini-cli/pull/22423) |
| 6 | 서브에이전트 스킬 시스템 지시 주입 | 활성화된 스킬이 서브에이전트에 전파 | bkit 스킬이 서브에이전트에서도 일관 동작 | [PR #24620](https://github.com/google-gemini/gemini-cli/pull/24620) |
| 7 | 샌드박스 승인 persistence/매칭 | proactive expansion 승인 정확도 | 간접 | [PR #24577](https://github.com/google-gemini/gemini-cli/pull/24577) |
| 8 | 비인터랙티브 `/skills list` stderr | stdout으로 교정 | bkit CI 파싱 | [PR #24566](https://github.com/google-gemini/gemini-cli/pull/24566) |
| 9 | ACP InvalidStreamError 처리 | graceful 처리 | ACP 사용자만 | [PR #24540](https://github.com/google-gemini/gemini-cli/pull/24540) |
| 10 | `includeDirectories` sandbox config 미전달 | 샌드박스 구성 누락 수정 | 멀티디렉토리 bkit 워크스페이스 | [PR #24573](https://github.com/google-gemini/gemini-cli/pull/24573) |
| 11 | `AnsiOutputText` non-array 입력 크래시 | 방어적 처리 추가 | bkit 툴 출력 파싱 안정화 | [PR #24498](https://github.com/google-gemini/gemini-cli/pull/24498) |
| 12 | Scheduler dispose 추가 | `McpProgress` listener leak 방지 | bkit-server 장기 실행 안정성 | v0.38.0-preview 포함 |
| 13 | `/skills reload` 후 슬래시 명령 리스트 미갱신 | refresh 수정 | bkit 스킬 개발 플로우 | [PR #24454](https://github.com/google-gemini/gemini-cli/pull/24454) |
| 14 | Browser agent 동시 인스턴스 오염 | 인스턴스 격리 | 병렬 브라우저 작업 | [PR #24794](https://github.com/google-gemini/gemini-cli/pull/24794) |
| 15 | Plan Mode 모델 라우팅 silent fallback (v0.38.1) | 고성능 모델 불가 시 조용히 fallback | bkit Plan Mode 활용 시 UX 안정 | [PR #25317](https://github.com/google-gemini/gemini-cli/pull/25317) |

---

## 8. 원문 참조 링크

### 8.1 v0.38.x 직접 참조

- **v0.38.1 릴리스 페이지**: https://github.com/google-gemini/gemini-cli/releases/tag/v0.38.1
- **v0.38.0 릴리스 페이지**: https://github.com/google-gemini/gemini-cli/releases/tag/v0.38.0
- **v0.38.0 → v0.38.1 diff**: https://github.com/google-gemini/gemini-cli/compare/v0.38.0...v0.38.1
- **v0.37.2 → v0.38.0 diff**: https://github.com/google-gemini/gemini-cli/compare/v0.37.2...v0.38.0
- **v0.38.0-preview.0 (2026-04-08)**: https://github.com/google-gemini/gemini-cli/releases/tag/v0.38.0-preview.0
- **v0.38.1 cherry-pick PR**: https://github.com/google-gemini/gemini-cli/pull/25466
- **v0.38.1 원본 PR (Plan Mode silent fallback)**: https://github.com/google-gemini/gemini-cli/pull/25317

### 8.2 핵심 PR (v0.38.0)

- ContextCompressionService: [#24483](https://github.com/google-gemini/gemini-cli/pull/24483)
- Background Memory Service: [#24274](https://github.com/google-gemini/gemini-cli/pull/24274)
- Hook System Messages UI: [#24616](https://github.com/google-gemini/gemini-cli/pull/24616)
- BeforeModel E2E: [#24784](https://github.com/google-gemini/gemini-cli/pull/24784)
- Subagent Workspace Scoping: [#24445](https://github.com/google-gemini/gemini-cli/pull/24445)
- Background Process Tools: [#23799](https://github.com/google-gemini/gemini-cli/pull/23799)
- Env var defaults: [#24469](https://github.com/google-gemini/gemini-cli/pull/24469)
- Persistent Policy Approvals: [#23257](https://github.com/google-gemini/gemini-cli/pull/23257)
- Compact Tool Output default: [#24510](https://github.com/google-gemini/gemini-cli/pull/24510)
- Ctrl+G keybinding: [#24861](https://github.com/google-gemini/gemini-cli/pull/24861)
- Selective Topic Expansion: [#24793](https://github.com/google-gemini/gemini-cli/pull/24793)
- Browser agent isolation: [#24794](https://github.com/google-gemini/gemini-cli/pull/24794)
- Linux sandbox ARG_MAX: [#24286](https://github.com/google-gemini/gemini-cli/pull/24286)

### 8.3 연관 참조

- `docs/01-plan/research/gemini-cli-v0.37.2-research.md` (2026-04-14, 선행 조사)
- `docs/01-plan/research/gemini-cli-v0.37.1-research.md` (2026-04-13)
- `docs/01-plan/research/gemini-cli-v036-stable-research.md` (2026-04-06)
- `docs/01-plan/features/v2.1.0-context-optimization.plan.md` (ContextCompressionService와 연관)
- `docs/01-plan/features/gemini-cli-v0.37.2-migration.plan.md` (v0.38.0으로 재타깃팅 필요)

### 8.4 의존성 변경

| 패키지 | 이전 | 이후 | 주의사항 |
|--------|------|------|----------|
| `ink` | (v0.37.x) | `6.6.7` | [PR #24514](https://github.com/google-gemini/gemini-cli/pull/24514). v0.39.0-preview에서 6.6.9로 추가 bump 예정 |
| `keytar` | 유지 | 유지 (v0.39 이후 `@github/keytar` 전환) | v0.38.x 영향 없음 |

package.json 기타 의존성은 대체로 동일.

---

## 9. 조사 신뢰도

| 항목 | 신뢰도 | 비고 |
|------|--------|------|
| 최신 stable 감지 (v0.38.1) | ⬛⬛⬛⬛⬛ | GitHub Releases 직접 확인, 2026-04-15 릴리스 |
| Breaking Changes | ⬛⬛⬛⬛⬜ | 릴리스 노트가 "None explicitly listed"라 표기하나 실질적 동작 변경 7개 PR 검증 |
| 새 기능 (v0.38.0) | ⬛⬛⬛⬛⬜ | 19개 주요 PR 본문 확인. 마이너 cosmetic 일부 생략 |
| 새 기능 (v0.38.1) | ⬛⬛⬛⬛⬛ | 단일 cherry-pick 확정 |
| Deprecation | ⬛⬛⬛⬜⬜ | 명시적 deprecation 표시 적어 추론 포함 |
| 설정 변경 | ⬛⬛⬛⬛⬜ | 신규 설정 12개 PR 확인 |
| Extension 시스템 | ⬛⬛⬛⬛⬜ | manifest/MCP/hook 세 축 검증 |
| 의존성 변경 | ⬛⬛⬛⬜⬜ | ink 명시 확인, package.json 전체 diff 미검증 |
| bkit 영향 분석 | ⬛⬛⬛⬛⬜ | 핵심 경로(훅/스킬/MCP) 영향 추론 기반 |

---

## 10. bkit 영향 요약 및 권장 조치

### 10.1 즉시 기회 (v2.1.x 반영 권장)

1. **Hook System Messages UI 활성화**: bkit 훅이 이미 `decision/systemMessage` 포맷(commit 7078c2a) → `hooksConfig.showOutput: true`를 bkit 기본 설정에 추가 시 즉시 UX 향상
2. **BeforeModel 모델 라우팅 훅 신규**: 작업 유형별 모델 선택(pro/flash/flash-lite)으로 비용 최적화
3. **Subagent `workspaceDirectories` 선언**: bkit 서브에이전트 보안/정확도 향상
4. **Env var `${VAR:-default}` 문법 도입**: bkit `gemini-extension.json` 단순화

### 10.2 재검토 필요 (잠재 충돌)

1. **v2.1.0 context-optimization vs ContextCompressionService**: bkit 자체 압축 로직과 내장 서비스 역할 분리 재설계 필요
2. **Background Memory Service 경로**: `~/.gemini/memory/<project>/skills/` 경로 충돌 가능. 기본 비활성이나 v0.39 stable 시 재검토
3. **Plan Mode silent fallback (v0.38.1)**: bkit의 BeforeModel 모델 라우팅 훅과 Plan Mode가 동시에 작동할 때 fallback 우선순위 검증 필요

### 10.3 마이그레이션 위험도

- **v0.37.2 → v0.38.1**: 위험도 **LOW–MEDIUM** (109+2 commits, ~313 files, 7개 minor breaking changes. 그러나 bkit 핵심 경로(훅/스킬/MCP/세션)에 직접 파괴적 변경 없음)
- **v0.36.0 → v0.38.1 누적**: 위험도 **LOW–MEDIUM** (v0.37.x 대비 약간 증가. Chapters/topic/TerminalBuffer 회귀 모니터링)

### 10.4 권장 조치

1. **마이그레이션 플랜 재타깃**: `docs/01-plan/features/gemini-cli-v0.37.2-migration.plan.md` → **v0.38.1** 플랜 신규 작성
2. **회귀 테스트 포커스**:
   - 훅 JSON `{decision, systemMessage}` 993/993 유지
   - AfterTool 훅 `complete_task` 처리 (#24437)
   - `/skills list` stdout (#24566)
   - Linux 샌드박스 다중 경로 (#24286)
   - Plan Mode 진입 시 모델 fallback 동작 (#25317, v0.38.1)
3. **v2.1.x 로드맵 추가**:
   - `hooksConfig.showOutput` 기본 활성
   - BeforeModel 라우팅 훅
   - Subagent `workspaceDirectories`
   - ContextCompressionService 연계 설계
4. **문서 업데이트**: bkit README에 "Tested with Gemini CLI v0.38.1" 표기
5. **v0.39 watch**: `invoke_subagent` 통합, `/memory inbox`, JSONL chat recording, `@github/keytar`

---

*조사 종료: 2026-04-16 (v0.38.1 반영 재조사 · 최종본)*
