# Gemini CLI v0.38.0 bkit 영향 분석 보고서

> 분석일: 2026-04-16
> 분석 범위: bkit v2.0.4 전체 코드베이스 (276 소스 파일, 7,898 LOC 핵심 코드)
> 대상 버전: Gemini CLI v0.37.2 -> v0.38.1 (v0.38.0 + v0.38.1 패치)
> 분석자: bkit-impact-analyzer agent
> 입력: docs/01-plan/research/gemini-cli-v0.38.0-research.md

---

## Executive Summary

| 항목 | 수치 |
|------|------|
| 전수 스캔 대상 파일 | 276개 (소스), 613개 (docs/tests 포함) |
| 영향 받는 파일 | 14개 |
| Breaking Changes | 7건 (연구 보고서 기준) |
| 직접 영향 Breaking Changes | 0건 |
| 새 기능 | 20건 (v0.38.0: 19, v0.38.1: 1) |
| bkit 활용 가능 새 기능 | 8건 |
| Deprecation 예고 | 4건 |
| 직접 영향 Deprecation | 1건 (Legacy subagent wrapping, v0.39 대비) |
| **Critical** | **0건** |
| **High** | **0건** |
| **Medium** | **3건** |
| **Low** | **4건** |
| 기능 개선 기회 | **6건** |

**총평**: v0.37.2 -> v0.38.1 마이그레이션은 **LOW 위험도**. Breaking Changes 7건 중 bkit 코드에 직접 영향을 주는 항목 없음. 주요 가치는 새 기능 활용 기회(Hook System Messages UI, BeforeModel E2E 모델 오버라이드, Subagent workspace 격리, 환경변수 기본값 문법)에 있음.

---

## 1. Breaking Changes 영향 매핑

### 1.1 ui.loadingPhrases 기본값 변경 (tips -> off)

- **영향도**: Low
- **영향 파일**: 없음
- **분석**: bkit 코드에서 `loadingPhrases` 설정을 참조/설정하는 코드 없음. 전수 스캔 결과 hooks, lib, settings 전역에서 미사용.
- **수정 방안**: 수정 불필요. 원하는 경우 settings.json에 `"ui": { "loadingPhrases": "tips" }` 명시.

### 1.2 키바인딩 변경: Ctrl+X -> Ctrl+G (외부 에디터)

- **영향도**: Low
- **영향 파일**: 없음
- **분석**: bkit은 프로그래밍 방식으로 CLI와 상호작용(stdin/stdout JSON). 인터랙티브 키바인딩을 사용하지 않음.
- **수정 방안**: 수정 불필요. 문서 업데이트(사용자 가이드)에서 단축키 변경 안내만 고려.

### 1.3 IDE 디버깅 단축키 이동: Ctrl+G -> F4

- **영향도**: Low
- **영향 파일**: 없음
- **분석**: 1.2와 동일. bkit은 IDE 통합 단축키를 프로그래밍 방식으로 사용하지 않음.
- **수정 방안**: 수정 불필요.

### 1.4 Chapters update_topic UX 조정

- **영향도**: Low
- **영향 파일**: 없음
- **분석**: bkit은 Chapters API를 직접 호출하지 않음. 내부 UI 변경이며 hook 이벤트 구조에 변화 없음.
- **수정 방안**: 수정 불필요.

### 1.5 PowerShell translation 제거 (Windows)

- **영향도**: Medium (Windows 사용자 한정)
- **영향 파일**: `lib/gemini/platform.js` (간접), `mcp/bkit-server.js` (간접)
- **현재 코드**: bkit-server.js의 `executeAgent()` 메서드가 `spawn('gemini', args, ...)` 로 CLI를 호출. platform.js의 경로 처리는 `path.sep` 사용으로 크로스 플랫폼 대응 중.
- **분석**: bkit 코드 자체는 PowerShell 번역에 의존하지 않음. POSIX 명령(rm, ls 등)을 직접 실행하는 패턴 없음 (permission.js의 deny 패턴만 참조). Windows에서 bkit-server.js가 `/bin/bash`로 MCP 서버를 시작하는 점이 이미 POSIX 의존성이므로, PowerShell 번역 제거 자체는 추가 영향 없음.
- **수정 방안**: 수정 불필요. 단, `mcp/start-server.sh`는 bash 스크립트로 Windows에서 Git Bash/WSL 필요 -- 기존 상태와 동일.

### 1.6 ui.compactToolOutput 기본값 true 유지

- **영향도**: Low
- **영향 파일**: 없음
- **분석**: v0.37.0에서 이미 변경. bkit AfterTool 훅은 `tool_name`/`tool_input` 필드만 읽으며 UI 출력 형식에 의존하지 않음. 전수 스캔 확인 완료.
- **수정 방안**: 수정 불필요.

### 1.7 TerminalBuffer 모드 기본값 false 유지 (회귀)

- **영향도**: Low
- **영향 파일**: 없음
- **분석**: opt-in 설정. bkit 코드에서 `renderProcess`/`terminalBuffer` 참조 없음.
- **수정 방안**: 수정 불필요.

### Breaking Changes 요약

| # | Breaking Change | bkit 영향 파일 | 영향도 | 수정 필요 |
|---|----------------|---------------|--------|----------|
| 1 | ui.loadingPhrases 기본값 off | 없음 | Low | 불필요 |
| 2 | Ctrl+X -> Ctrl+G | 없음 | Low | 불필요 |
| 3 | Ctrl+G -> F4 | 없음 | Low | 불필요 |
| 4 | Chapters UX 조정 | 없음 | Low | 불필요 |
| 5 | PowerShell translation 제거 | 간접 (Windows) | Medium | 불필요 |
| 6 | compactToolOutput=true 유지 | 없음 | Low | 불필요 |
| 7 | TerminalBuffer 기본 false | 없음 | Low | 불필요 |

**결론: 7건 모두 bkit 코드 수정 불필요.**

---

## 2. 스킬 영향 분석

43개 스킬 (skills/ 디렉토리) 전수 스캔 결과:

| 스킬 | 영향 항목 | 영향도 | 대응 방안 |
|------|-----------|--------|-----------|
| pdca | Subagent skill propagation (#24620) | Low (긍정적) | 수정 불필요. pdca 스킬이 서브에이전트에서도 자동 전파되어 일관성 향상 |
| gemini-cli-learning | CLI 변경사항 반영 필요 | Low | 스킬 본문에 v0.38.x 변경 사항 반영 가능 (선택적) |
| 전체 43개 | `/skills list` stdout 수정 (#24566) | Low (긍정적) | CI에서 스킬 목록 파싱 시 stderr -> stdout으로 변경됨. bkit은 CI에서 직접 파싱하지 않으므로 영향 없음 |
| 전체 43개 | `/skills reload` 갱신 수정 (#24454) | Low (긍정적) | 스킬 개발 중 reload 후 슬래시 명령이 즉시 갱신. DX 향상 |

**스킬 frontmatter 구조 변경 없음.** `allowed-tools`, `imports`, `agents` 등 모든 필드 호환.

---

## 3. 에이전트 영향 분석

21개 에이전트 (agents/ 디렉토리) 전수 스캔 결과:

| 에이전트 | 영향 항목 | 영향도 | 대응 방안 |
|----------|-----------|--------|-----------|
| 전체 21개 | Subagent skill propagation (#24620) | Low (긍정적) | 서브에이전트에서도 활성 스킬이 자동 주입. 수정 불필요 |
| 전체 21개 | workspaceDirectories 필드 신규 (#24445) | Medium (기회) | agent frontmatter에 `workspaceDirectories` 필드 추가 가능. READONLY 에이전트의 워크스페이스 범위 제한으로 보안 향상 |
| cto-lead, pdca-iterator | Plan Mode silent fallback (#25317, v0.38.1) | Low | Plan Mode 사용 시 모델 불가 시 조용히 fallback. 기존 동작 개선 |
| 전체 | BeforeModel E2E 모델 오버라이드 (#24784) | Medium (기회) | bkit `modelRouting` 설정과 연동하여 실제 API 호출 수준 모델 라우팅 가능 |

**에이전트 frontmatter 구조 변경 없음.** `model`, `tools`, `permissionMode` 등 모든 필드 호환.

---

## 4. 스크립트/라이브러리 영향 분석

### 4.1 Hook 스크립트 (hooks/scripts/)

| 파일 | 영향 항목 | 영향도 | 대응 방안 |
|------|-----------|--------|-----------|
| `before-model.js` | BeforeModel E2E 모델 오버라이드 (#24784) | **Medium** (기회) | 현재 코드는 `additionalContext`에 모델 라우팅 힌트만 삽입. v0.38.0+에서는 `hookSpecificOutput.llm_request.model`로 실제 모델 변경 가능. **v2.1.x에서 구현 권장** |
| `before-tool.js` | Background Process 도구 신규 (#23799) | **Medium** | BeforeTool 훅의 matcher가 `write_file|replace`와 `run_shell_command`만 대응. 신규 `list_background_processes`, `read_background_output` 도구는 matcher에 없으므로 훅이 트리거되지 않음. 보안 검사가 필요한 경우 matcher 추가 필요. 현재는 이 도구들이 읽기 전용이므로 **즉시 조치 불필요** |
| `after-tool.js` | complete_task chat history 기록 (#24437) | Low | AfterTool 훅의 matcher가 `write_file`, `run_shell_command`, `activate_skill`만 대응. `complete_task`는 matcher에 없으므로 AfterTool 훅이 발동하지 않음. bkit이 `complete_task` 이벤트를 처리할 필요가 없는 현재 설계에서는 **영향 없음** |
| `session-start.js` | hooksConfig.showOutput 신규 (#24616) | **Medium** (기회) | `ensureAgentsEnabled()` 함수에서 settings.json을 업데이트하는 패턴이 이미 존재. 동일 패턴으로 `hooksConfig.showOutput: true` 자동 설정 가능. **v2.1.x에서 구현 권장** |
| `pre-compress.js` | ContextCompressionService (#24483) | Medium (모니터링) | CLI 자체 컨텍스트 압축 서비스가 stable 승격됨. bkit의 PreCompress 훅이 PDCA 상태를 스냅샷하는 기능과 상호작용 가능. `experimental.generalistProfile: true` 활성화 시 PreCompress 이벤트 발동 빈도/타이밍이 변할 수 있음. **현재 기본 비활성이므로 즉시 조치 불필요. v2.1.0 context-optimization에서 검토** |
| `before-tool-selection.js` | Background Process 도구 신규 (#23799) | Low | 도구 필터링 로직이 BUILTIN_TOOLS 레지스트리 기반. 신규 도구가 레지스트리에 없으면 필터링 대상에서 제외됨. 읽기 전용 도구이므로 보안 우려 없음 |
| `after-agent.js` | Subagent skill propagation (#24620) | Low (긍정적) | 서브에이전트에서 스킬이 일관 동작하므로 AfterAgent 훅의 스킬 핸들러가 더 정확하게 호출됨 |

### 4.2 라이브러리 (lib/)

| 모듈 | 파일 | 영향 항목 | 영향도 | 대응 방안 |
|------|------|-----------|--------|-----------|
| gemini/version.js | `getFeatureFlags()` | **Medium** | v0.38.0 기능 플래그 미정의. `isVersionAtLeast('0.38.0')` 호출은 정상 작동하지만 명시적 플래그(예: `hasHookShowOutput`, `hasBeforeModelE2E`, `hasEnvVarDefaults`) 미등록. 기능을 활용하려면 플래그 추가 필요 |
| gemini/tools.js | BUILTIN_TOOLS 레지스트리 | Low | 신규 도구 `list_background_processes`, `read_background_output`가 미등록. 이 도구들은 CLI 내부에서 자동 사용되며 bkit이 직접 호출하지 않으므로 즉시 추가 불필요 |
| gemini/model-resolver.js | MODEL_ALIASES, KNOWN_MODELS | Low | v0.38.0에서 모델 이름 변경 없음. 기존 `gemini-3-pro`, `gemini-3-flash`, `gemini-3-flash-lite` 그대로 유효 |
| gemini/hooks.js | HOOK_EVENT_MAP | Low | 신규 훅 이벤트 추가 없음. 기존 10개 이벤트 그대로 유효 |
| gemini/policy.js | TOML 생성 | Low | Policy Engine 스키마 변경 없음. `security.enablePermanentToolApproval` 신규 설정은 CLI 측에서 자동 처리 |
| gemini/context-fork.js | ContextCompressionService 연계 | Medium (모니터링) | bkit 자체 컨텍스트 포크/스냅샷 메커니즘과 CLI 내장 ContextCompressionService의 역할 분리 필요. v2.1.0 context-optimization 계획에서 통합 검토 |
| gemini/platform.js | 변경 없음 | Low | 환경변수 감지, 경로 처리 모두 호환 |
| core/permission.js | 변경 없음 | Low | deny/ask/allow 패턴 매칭 로직 변경 없음 |
| core/memory.js | Background Memory Service 경로 | Low (모니터링) | `experimentalMemoryManager` 활성화 시 `~/.gemini/memory/<project>/skills/`에 자동 SKILL.md 생성. bkit의 agentMemory 경로 `.gemini/agent-memory/bkit/`와는 다른 경로이므로 직접 충돌 없음. 단, bkit 스킬 디렉토리 네이밍과 혼동 가능. **기본 비활성이므로 즉시 조치 불필요** |

### 4.3 MCP 서버 (mcp/)

| 파일 | 영향 항목 | 영향도 | 대응 방안 |
|------|-----------|--------|-----------|
| bkit-server.js | MCP 프로토콜 호환 | Low | stdio 프로토콜 스키마 변경 없음. `protocolVersion: '2024-11-05'` 유효 |
| bkit-server.js | McpProgress listener leak 방지 | Low (긍정적) | Scheduler dispose 추가로 장기 실행 안정성 향상. 수정 불필요 |
| bkit-server.js | Linux sandbox ARG_MAX (#24286) | Low (긍정적) | 다수 MCP 서버/스킬 등록 시 Linux 환경 안정성 향상. 수정 불필요 |

---

## 5. 설정 파일 영향 분석

| 파일 | 항목 | 변경 내용 | 영향도 | 대응 방안 |
|------|------|-----------|--------|-----------|
| `bkit.config.json` | `compatibility.testedVersions` | `"0.37.0"`이 최신. `"0.38.0"`, `"0.38.1"` 미포함 | **Medium** | 배열에 `"0.38.0"`, `"0.38.1"` 추가 필요 |
| `bkit.config.json` | `compatibility.minGeminiCliVersion` | `"0.34.0"` 유지 | Low | 변경 불필요. v0.34.0이 여전히 최소 요구 |
| `gemini-extension.json` | 스키마 호환 | 변경 없음 | Low | `mcpServers`, `contextFileName`, `settings` 필드 모두 유효 |
| `hooks/hooks.json` | 훅 이벤트 스키마 | 변경 없음 | Low | 10개 훅 이벤트 모두 유효. `type: "command"` 형식 유지 |
| `policies/bkit-extension-policy.toml` | Policy Engine 스키마 | 변경 없음 | Low | TOML 규칙 스키마 유효 |
| `GEMINI.md` | @import 디렉티브 | 변경 없음 | Low | `@.gemini/context/commands.md`, `@.gemini/context/core-rules.md` 유효 |
| `.gemini/settings.json` (생성됨) | 신규 설정 기회 | `hooksConfig.showOutput`, `experimental.generalistProfile` 등 12개 신규 설정 | Medium (기회) | v2.1.x에서 session-start.js의 `ensureAgentsEnabled()` 패턴 확장 |

---

## 6. 철학 정합성 검증 결과

bkit-system/philosophy/ 디렉토리가 비어 있음 (파일 미발견). GEMINI.md 및 bkit.config.json의 기본 원칙을 기준으로 검증.

| 원칙 | 상태 | 비고 |
|------|------|------|
| Automation First | 유지 | 모든 자동화 경로(훅, MCP, 스킬, 에이전트) 호환 유지. BeforeModel E2E가 자동 모델 라우팅 가능성 확장 |
| No Guessing | 유지 | session-start.js의 `ensureAgentsEnabled()`가 `=== undefined` 체크로 사용자 명시적 설정 존중. v0.38.0 신규 설정도 동일 패턴 적용 가능 |
| Docs = Code | 유지 | PDCA 문서-코드 동기화 메커니즘 변경 없음. ContextCompressionService는 문서 참조 패턴을 변경하지 않음 |
| AI as Partner | 향상 (기회) | hooksConfig.showOutput으로 훅의 systemMessage가 UI에 표시되어 AI-사용자 소통 향상. BeforeModel E2E로 작업별 최적 모델 선택 가능 |
| Context Engineering | 유지 + 모니터링 필요 | 6-Layer 아키텍처 유지. ContextCompressionService가 bkit의 Phase-Aware Context 전략과 상호작용할 수 있으나, 기본 비활성. v2.1.0 context-optimization에서 통합 설계 필요 |
| PDCA Methodology | 유지 | PDCA 사이클 전체 흐름(Plan/Design/Do/Check/Act/Report) 정상 작동. 훅 이벤트, 스킬 활성화, 에이전트 위임 모두 호환 |

---

## 7. 기능 개선 기회

### 7.1 즉시 활용 가능 (v2.1.x 권장)

| # | 새 CLI 기능 | bkit 활용 방안 | 예상 효과 | 우선순위 | 난이도 |
|---|------------|---------------|----------|----------|--------|
| 1 | **hooksConfig.showOutput** (PR #24616) | session-start.js에서 `.gemini/settings.json`에 `hooksConfig: { showOutput: true }` 자동 설정. bkit 훅이 이미 `{decision, systemMessage}` 포맷 사용 중 (commit 7078c2a) | 모든 bkit 훅의 systemMessage가 CLI UI에 INFO로 표시. 사용자 가시성 대폭 향상 | **P0** | 소 (1h) |
| 2 | **BeforeModel E2E 모델 오버라이드** (PR #24784) | before-model.js 훅에서 `hookSpecificOutput: {hookEventName: "BeforeModel", llm_request: {model: "gemini-3-flash"}}` 반환으로 PDCA 단계별 실제 모델 라우팅 | plan/design=pro, check/act/report=flash 실제 적용. 비용 최적화 (현재는 힌트만 주입) | **P0** | 중 (3-4h) |
| 3 | **Subagent workspaceDirectories** (PR #24445) | agent frontmatter에 `workspaceDirectories: [dir]` 필드 추가. READONLY 에이전트(gap-detector, code-analyzer 등)의 워크스페이스를 프로젝트 디렉토리로 제한 | 서브에이전트 보안 격리. 의도치 않은 파일 접근 방지 | **P1** | 중 (2-3h) |
| 4 | **환경변수 기본값 문법** (PR #24469) | gemini-extension.json의 MCP 서버 설정에서 `${VAR:-default}` 문법 활용 | extension config 단순화, 환경별 설정 유연성 향상 | **P2** | 소 (0.5h) |

### 7.2 중기 활용 (v2.1.0 context-optimization 연계)

| # | 새 CLI 기능 | bkit 활용 방안 | 예상 효과 | 우선순위 | 난이도 |
|---|------------|---------------|----------|----------|--------|
| 5 | **ContextCompressionService** (PR #24483) | bkit v2.1.0 context-optimization 계획에서 CLI 내장 압축 서비스와 bkit PreCompress 훅의 역할 분리 설계 | CLI 자체 압축 + bkit PDCA 상태 보존의 이상적 조합. 토큰 효율 극대화 | **P1** | 대 (8-12h) |
| 6 | **Auto-configure Heap Memory** (PR #24474) | 기본 활성. bkit 대용량 컨텍스트 시나리오(43 스킬, 21 에이전트)에서 OOM 위험 완화 | 장기 세션 안정성 자동 향상 | **자동** | 없음 |

### 7.3 모니터링 (v0.39 대비)

| # | 항목 | 모니터링 사유 | 대비 시점 |
|---|------|-------------|----------|
| 7 | Legacy subagent wrapping 도구 deprecation | v0.39.x stable에서 `invoke_subagent`로 대체. bkit bkit-server.js의 `spawn_agent` 도구가 영향 받을 수 있음 | v0.39.0 stable 릴리스 시 |
| 8 | Background Memory Service 경로 | `experimentalMemoryManager` 활성화 시 bkit 스킬 경로와 혼동 가능 | 사용자가 활성화 시 |
| 9 | Plan Mode silent fallback (v0.38.1) | bkit BeforeModel 모델 라우팅 훅과 Plan Mode fallback 우선순위 상호작용 | BeforeModel E2E 구현 시 |

---

## 8. 필수 수정 항목

### 8.1 bkit.config.json testedVersions 업데이트

- **파일**: `bkit.config.json` (Line 120)
- **현재**: `"testedVersions": ["0.29.0", "0.30.0", "0.31.0", "0.32.0", "0.33.0", "0.34.0", "0.35.0", "0.35.3", "0.36.0", "0.37.0"]`
- **수정**: 배열에 `"0.37.1"`, `"0.37.2"`, `"0.38.0"`, `"0.38.1"` 추가
- **영향도**: Medium (테스트 TC-95 VER-05, TC-109-12, TC-110-05 등에서 검증)
- **난이도**: 극소 (5분)

### 8.2 lib/gemini/version.js v0.38.0 기능 플래그 추가 (선택적, v2.1.x 권장)

- **파일**: `lib/gemini/version.js` (`getFeatureFlags()` 함수, Line 149 이후)
- **현재**: v0.36.0까지 플래그 정의
- **추가 필요 플래그**:
  ```javascript
  // v0.37.0+
  hasPlanModeStable: isVersionAtLeast('0.37.0'),
  hasModelRouting: isVersionAtLeast('0.37.0'),
  hasChapters: isVersionAtLeast('0.37.0'),

  // v0.38.0+
  hasHookShowOutput: isVersionAtLeast('0.38.0'),
  hasBeforeModelE2E: isVersionAtLeast('0.38.0'),
  hasSubagentWorkspaceDirs: isVersionAtLeast('0.38.0'),
  hasEnvVarDefaults: isVersionAtLeast('0.38.0'),
  hasContextCompression: isVersionAtLeast('0.38.0'),
  hasBackgroundProcessTools: isVersionAtLeast('0.38.0'),
  hasPersistentPolicyApprovals: isVersionAtLeast('0.38.0'),
  hasAutoHeapMemory: isVersionAtLeast('0.38.0'),
  ```
- **영향도**: Medium (기능 활용 시 필수)
- **난이도**: 소 (30분)

### 8.3 lib/gemini/tools.js 신규 도구 등록 (선택적)

- **파일**: `lib/gemini/tools.js` (BUILTIN_TOOLS, Line 17 이후)
- **추가 고려 도구**:
  ```javascript
  LIST_BACKGROUND_PROCESSES: 'list_background_processes',
  READ_BACKGROUND_OUTPUT: 'read_background_output',
  ```
- **영향도**: Low (bkit이 직접 호출하지 않으나 TOOL_CATEGORIES, TOOL_ANNOTATIONS에 포함 시 일관성 향상)
- **난이도**: 소 (15분)

---

## 9. 구현 우선순위 매트릭스

| 우선순위 | 항목 | 이유 | 예상 공수 |
|----------|------|------|-----------|
| **P0 (필수)** | bkit.config.json testedVersions 업데이트 | 테스트 검증 통과, 호환성 선언 | 5분 |
| **P0 (권장)** | hooksConfig.showOutput 자동 활성화 | 기존 코드 패턴 재사용, 즉시 UX 향상 | 1h |
| **P0 (권장)** | BeforeModel E2E 모델 오버라이드 구현 | bkit 핵심 차별화(PDCA별 모델 라우팅) 실현 | 3-4h |
| **P1** | version.js v0.38.0 기능 플래그 추가 | P0 기능 구현의 전제조건 | 30분 |
| **P1** | Subagent workspaceDirectories 적용 | 보안 향상, READONLY 에이전트 격리 | 2-3h |
| **P2** | 환경변수 기본값 문법 도입 | 설정 유연성 (비필수) | 30분 |
| **P2** | tools.js 신규 도구 등록 | 레지스트리 일관성 (비필수) | 15분 |
| **P3 (v2.1.0)** | ContextCompressionService 연계 설계 | 대규모 아키텍처 변경 | 8-12h |

---

## 10. 회귀 테스트 포커스

v0.38.1 마이그레이션 후 검증해야 할 핵심 영역:

| # | 테스트 영역 | 검증 항목 | 참조 |
|---|------------|-----------|------|
| 1 | 훅 JSON 반환 형식 | 모든 훅이 `{decision, systemMessage}` 포맷 반환 (993/993 기존 통과) | commit 7078c2a |
| 2 | SessionStart 초기화 | PDCA 상태 로드, 레벨 감지, 정책 생성, agents 활성화 | session-start.js |
| 3 | BeforeModel 컨텍스트 | 단계별 컨텍스트 + 모델 라우팅 힌트 주입 | before-model.js |
| 4 | BeforeTool 보안 | deny/ask/allow 결정 정상 (특히 `complete_task` 미매칭 확인) | before-tool.js |
| 5 | AfterTool PDCA 상태 | write_file 후 PDCA 단계 전환, skill 완료 처리 | after-tool.js |
| 6 | MCP 서버 | bkit-server stdio 통신, spawn_agent, 12개 도구 응답 | bkit-server.js |
| 7 | 정책 TOML 생성 | bkit-permissions.toml, level 정책, extension 정책 검증 | policy.js |
| 8 | PreCompress 스냅샷 | PDCA 상태 보존, 스냅샷 LRU 정리 | pre-compress.js |

---

## 부록: 전수 스캔 파일 목록

### 스캔 완료 (영향 없음 확인)

- skills/ (43 SKILL.md): frontmatter 호환, CLI API 의존성 없음
- agents/ (21 .md): frontmatter 호환, model/tools 필드 유효
- hooks/scripts/ (12 .js): 상세 분석 완료 (Section 4.1)
- hooks/scripts/skills/ (5 .js): pdca post-hook, 영향 없음
- hooks/scripts/utils/ (3 .js): memory-helper, pdca-state-updater, skill-normalizer, 영향 없음
- lib/core/ (10 .js): 영향 없음
- lib/gemini/ (9 .js): version.js, tools.js 업데이트 기회 (Section 8)
- lib/intent/ (5 .js): CLI 의존성 없음
- lib/pdca/ (5 .js): CLI 의존성 없음
- mcp/ (7 파일): bkit-server.js 호환 확인
- templates/ (26 .md): CLI 의존성 없음
- commands/ (25 .toml): 슬래시 명령 정의, CLI 호환
- output-styles/ (4 .md): CLI 의존성 없음
- policies/ (1 .toml): TOML 스키마 호환
- 설정 파일 (3): bkit.config.json, gemini-extension.json, GEMINI.md 호환
- scripts/ (2 .js): phase-transition, sync-version, CLI 의존성 없음
- src/ (1 .js): pdca-e2e.js, 간접 의존

---

*분석 종료: 2026-04-16*
*bkit-impact-analyzer agent*
