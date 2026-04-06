# Gemini CLI v0.36.0 Stable 변경사항 조사 보고서

> 조사일: 2026-04-06
> 조사 범위: v0.35.3 (2026-03-28) -> v0.36.0 stable (2026-04-01)
> 조사자: gemini-researcher agent
> bkit 현재 버전: v2.0.2 (Gemini CLI v0.35.3 대상)

---

## 1. 버전 개요

### 1.1 릴리스 타임라인

| 버전 | 릴리스일 | 유형 | 주요 테마 |
|------|---------|------|----------|
| v0.35.0 | 2026-03-24 | Stable | 커스텀 키보드 단축키, Vim 모드, JIT Context 기본 활성화, 도구 격리 |
| v0.35.1 | 2026-03-26 | Patch | 패치 수정 |
| v0.35.2 | 2026-03-26 | Patch | Linux 시작 이슈 수정, 사용 제한 명확화 |
| v0.35.3 | 2026-03-28 | Patch | Linux 시작 이슈 리버트, 병합 충돌 해결 체리픽 |
| v0.36.0-preview.0 | 2026-03-25 | Preview | Flash 3.1 Lite 실험 게이트, 브라우저 읽기 전용 도구 동적 발견 |
| v0.36.0-preview.4 | 2026-03-26 | Preview | 증분 프리뷰 빌드 |
| v0.36.0-preview.5 | 2026-03-27 | Preview | 프리뷰 5 |
| v0.36.0-preview.6 | 2026-03-28 | Preview | 핫픽스 체리픽 (PR #24055) |
| v0.36.0-preview.7 | 2026-03-31 | Preview | 안정화 반복 |
| v0.36.0-preview.8 | 2026-04-01 | Preview | 최종 프리뷰 |
| **v0.36.0** | **2026-04-01** | **Stable** | **멀티레지스트리 아키텍처, 네이티브 샌드박싱, Git Worktree, AgentSession** |

### 1.2 릴리스 규모

- **총 150건 변경**: 46 기능, 3 성능 개선, 59 버그 수정, 16 문서 업데이트, 26 기타
- 주요 기여자: @akh64bit (multi-registry), @DavidAPierce (sandbox governance), @gundermanc (hooks), @kschaab (policy), @SandyTao520 (memory manager), @abhipatel12 (scheduler refactor)

### 1.3 주요 테마

1. **Multi-Registry Architecture**: 서브에이전트를 위한 멀티레지스트리 아키텍처와 도구 필터링
2. **네이티브 샌드박싱**: macOS Seatbelt allowlist + Windows 네이티브 샌드박싱 + 거버넌스 파일 보호
3. **AgentSession 도입**: 스트림 이벤트를 에이전트 이벤트로 대체하는 새로운 세션 모델
4. **Git Worktree 지원**: 격리된 병렬 세션을 위한 네이티브 워크트리 지원
5. **보안 강화**: 정책 엔진 toolName 필수화, 샌드박스 거버넌스 파일 쓰기 보호
6. **메모리 관리 진화**: save_memory 도구를 memoryManager 에이전트로 대체 (실험적)

---

## 2. Breaking Changes (하위 호환성 깨짐)

### 2.1 확인된 Breaking Changes

| # | 항목 | 영향도 | 이전 동작 | 이후 동작 | bkit 영향 | 참조 |
|---|------|--------|-----------|-----------|-----------|------|
| 1 | `experimental.enableAgents` 기본값 `false` 전환 | 🔴 Critical | 기본값 `true` | 기본값 `false` (명시적 opt-in 필요) | **이미 대응 완료** (v2.0.2 session-start.js) | [PR #23546](https://github.com/google-gemini/gemini-cli/pull/23546) |
| 2 | Policy config에서 `toolName` 필수 명시 | 🟠 High | `toolName` 생략 시 모든 도구에 암묵적 매칭 | `toolName` 미지정 시 검증 실패. 전체 도구 매칭은 `toolName = "*"` 필수 | **호환**: bkit 모든 policy rule에 toolName 명시됨 | [PR #23330](https://github.com/google-gemini/gemini-cli/pull/23330) |
| 3 | AgentSession 도입 (StreamStart/End -> AgentStart/End) | 🟡 Medium | `stream()` 메서드, `StreamStart`/`StreamEnd` 이벤트 | `subscribe()` 메서드, `AgentStart`/`AgentEnd` 이벤트 | **낮음**: bkit은 내부 API 직접 사용 안 함 (hooks 기반) | [PR #23159](https://github.com/google-gemini/gemini-cli/pull/23159) |
| 4 | Extension skills 접두사 변경 (`.` -> `:`) | 🟡 Medium | 충돌 시에만 접두사 붙임, 점(`.`) 구분자 | 항상 `확장명:스킬명` 형식으로 접두사, 콜론(`:`) 구분자 | **확인 필요**: bkit skills 호출 방식에 따라 영향 가능 | [PR #23566](https://github.com/google-gemini/gemini-cli/pull/23566) |
| 5 | Auth type 명칭 `oauth2` -> `oauth` | 🟢 Low | 사용자 대면 인증 타입 `oauth2` | `oauth`로 변경 | **낮음**: bkit에서 auth type 직접 참조 안 함 | [PR #23639](https://github.com/google-gemini/gemini-cli/pull/23639) |
| 6 | `coreToolScheduler` 삭제 | 🟢 Low | coreToolScheduler 모듈 존재 | 삭제, 새 scheduler로 완전 이전 | **낮음**: bkit은 내부 API 직접 사용 안 함 | [PR #23502](https://github.com/google-gemini/gemini-cli/pull/23502) |

### 2.2 bkit 영향 분석 요약

- **#1 (enableAgents)**: v2.0.2에서 이미 대응 완료. `session-start.js`의 `ensureAgentsEnabled()` 함수가 `.gemini/settings.json`에 `enableAgents: true` 자동 설정
- **#2 (toolName 필수)**: bkit의 3개 정책 파일 모두 `toolName` 명시. **호환 확인됨**
  - `bkit-permissions.toml`: 모든 rule에 `toolName` 존재
  - `bkit-extension-policy.toml`: 모든 rule에 `toolName` 존재
  - `bkit-starter-policy.toml`: 모든 rule에 `toolName` 존재
- **#4 (Extension skills 접두사)**: bkit이 `/스킬명` 형태로 스킬을 호출하는 경우, `bkit:스킬명`으로 변경될 수 있음. **실제 동작 테스트 필요**

---

## 3. 새로운 기능 (New Features)

| # | 기능명 | 영향도 | 설명 | bkit 활용 가능성 | 참조 |
|---|--------|--------|------|-----------------|------|
| 1 | **Multi-Registry Architecture** | 🟠 High | 서브에이전트별 독립 도구 레지스트리 + 도구 필터링 | 높음: bkit 에이전트의 도구 격리 강화에 활용 | [PR #22712](https://github.com/google-gemini/gemini-cli/pull/22712) |
| 2 | **Subagent Local Execution + Tool Isolation** | 🟠 High | 서브에이전트 로컬 실행과 도구 격리 지원 | 높음: bkit 21개 에이전트의 격리 실행 개선 | [PR #22718](https://github.com/google-gemini/gemini-cli/pull/22718) |
| 3 | **macOS Seatbelt Sandboxing** | 🟡 Medium | macOS에서 Seatbelt allowlist 기반 엄격한 샌드박싱 | 중간: macOS 사용자의 보안 강화 | [PR #22832](https://github.com/google-gemini/gemini-cli/pull/22832) |
| 4 | **Windows Native Sandboxing** | 🟡 Medium | Windows 네이티브 샌드박싱 구현 | 중간: Windows 사용자 지원 확대 | [PR #21807](https://github.com/google-gemini/gemini-cli/pull/21807) |
| 5 | **Git Worktree Support** | 🟡 Medium | Git worktree를 통한 격리 병렬 세션 지원 | 중간: 병렬 작업 시나리오에서 유용 | [PR #22973](https://github.com/google-gemini/gemini-cli/pull/22973) |
| 6 | **Dynamic macOS Sandbox Expansion + Worktree** | 🟡 Medium | macOS 샌드박스의 동적 확장 + worktree 지원 | 중간: 샌드박스 환경에서 유연성 증가 | [PR #23301](https://github.com/google-gemini/gemini-cli/pull/23301) |
| 7 | **Task Tracker Protocol in System Prompt** | 🟡 Medium | 태스크 트래커 프로토콜이 코어 시스템 프롬프트에 통합 | 중간: bkit PDCA와 시너지 가능성 | [PR #22442](https://github.com/google-gemini/gemini-cli/pull/22442) |
| 8 | **Blocked Status for Tasks/Todos** | 🟢 Low | 태스크/투두에 "blocked" 상태 추가 | 중간: bkit 태스크 관리와 통합 가능 | [PR #22735](https://github.com/google-gemini/gemini-cli/pull/22735) |
| 9 | **Plan Mode in Non-Interactive** | 🟡 Medium | 비대화형 환경에서 Plan mode 지원 | 높음: CI/CD 파이프라인에서 bkit 활용 가능성 | [PR #22670](https://github.com/google-gemini/gemini-cli/pull/22670) |
| 10 | **Memory Manager Agent** (실험적) | 🟡 Medium | `save_memory` 도구를 지능형 서브에이전트로 대체. 중복 제거, 계층적 저장, 구조화 관리 | 높음: bkit 메모리 시스템 고도화 검토 | [PR #22726](https://github.com/google-gemini/gemini-cli/pull/22726) |
| 11 | **Sandbox Write-Protected Governance Files** | 🟠 High | `.gitignore`, `.geminiignore`, `.git/` 디렉토리를 샌드박스 내에서 쓰기 보호 | 중간: bkit 에이전트가 이 파일들을 수정 못함 인지 필요 | [PR #23139](https://github.com/google-gemini/gemini-cli/pull/23139) |
| 12 | **Admin-Forced MCP Server Installations** | 🟡 Medium | 관리자가 MCP 서버 설치 강제 가능 | 낮음: Enterprise 환경에서 유용 | [PR #23163](https://github.com/google-gemini/gemini-cli/pull/23163) |
| 13 | **ModelChain Support in ModelConfigService** | 🟡 Medium | ModelDialog 및 ModelChain 지원 | 중간: 모델 체인 기반 워크플로우 설계 가능 | [PR #22914](https://github.com/google-gemini/gemini-cli/pull/22914) |
| 14 | **Dynamic Model Resolution** | 🟡 Medium | ModelConfigService에서 동적 모델 해석 | 중간: bkit model-resolver 고도화 참고 | [PR #22578](https://github.com/google-gemini/gemini-cli/pull/22578) |
| 15 | **Extension Registry Linking** | 🟡 Medium | 레지스트리 내 확장 연결(linking) 지원 | 중간: bkit 확장 배포/관리 개선 | [PR #23153](https://github.com/google-gemini/gemini-cli/pull/23153) |
| 16 | **--skip-settings Flag** | 🟢 Low | install 명령에 `--skip-settings` 플래그 추가 | 낮음: 설치 자동화 시 유용 | [PR #17212](https://github.com/google-gemini/gemini-cli/pull/17212) |
| 17 | **Behavioral Evaluations for Subagent Routing** | 🟡 Medium | 서브에이전트 라우팅을 위한 행동 평가 시스템 | 높음: bkit 에이전트 라우팅 최적화 참고 | [PR #23272](https://github.com/google-gemini/gemini-cli/pull/23272) |
| 18 | **Immediate User Input During Startup** | 🟢 Low | 시작 중 즉시 사용자 입력 수용 | 낮음: UX 자동 적용 | [PR #23661](https://github.com/google-gemini/gemini-cli/pull/23661) |
| 19 | **Refreshed Composer Layout UX** | 🟢 Low | Composer 레이아웃 UX 새로고침 | 낮음: UX 자동 적용 | [PR #21212](https://github.com/google-gemini/gemini-cli/pull/21212) |
| 20 | **Onboarding Telemetry** | 🟢 Low | 온보딩 텔레메트리 설정 | 낮음: 내부 분석용 | [PR #23118](https://github.com/google-gemini/gemini-cli/pull/23118) |

---

## 4. Deprecation 예고 (향후 제거 예정)

| # | 항목 | 영향도 | 예고 버전 | 대안 | bkit 영향 | 참조 |
|---|------|--------|-----------|------|-----------|------|
| 1 | `save_memory` 도구 | 🟡 Medium | v0.36.0 (실험적 대체) | `experimental.memoryManager` 활성화 시 memoryManager 서브에이전트가 대체 | 중간: 향후 save_memory 도구 호출 패턴 변경 가능 | [PR #22726](https://github.com/google-gemini/gemini-cli/pull/22726) |
| 2 | `coreToolScheduler` 모듈 | 🟢 Low | v0.36.0 (삭제 완료) | 새 scheduler 아키텍처 | 없음: 내부 API | [PR #23502](https://github.com/google-gemini/gemini-cli/pull/23502) |
| 3 | `accessibility.enableLoadingPhrases` 설정 | 🟢 Low | 문서에 deprecated 표기 | `ui.loadingPhrases` 설정 사용 | 없음: bkit 미사용 | 공식 문서 |

---

## 5. 설정/구성 변경

| # | 설정 항목 | 영향도 | 변경 유형 | 이전 | 이후 | bkit 영향 | 참조 |
|---|-----------|--------|-----------|------|------|-----------|------|
| 1 | `experimental.enableAgents` | 🔴 Critical | 기본값 변경 | `true` | `false` | **이미 대응** (session-start.js) | [PR #23546](https://github.com/google-gemini/gemini-cli/pull/23546) |
| 2 | `experimental.memoryManager` | 🟡 Medium | 신규 추가 | 없음 | `true`/`false` (default: `false`). 활성화 시 save_memory 도구 대신 서브에이전트 등록 | 모니터링 필요: 향후 기본 활성화 가능성 | [PR #22726](https://github.com/google-gemini/gemini-cli/pull/22726) |
| 3 | Policy `toolName` 필수화 | 🟠 High | 검증 강화 | 선택적 | 필수. `toolName = "*"` 명시 필요 | **호환 확인됨** | [PR #23330](https://github.com/google-gemini/gemini-cli/pull/23330) |
| 4 | Policy `allowRedirection` 필드 | 🟡 Medium | 신규 추가 | 없음 | `allowRedirection = true`로 셸 리디렉션 연산자(`>`, `>>`, `<`) 허용 | 향후 활용 가능: bkit shell 정책에서 리디렉션 세밀 제어 | [PR #23579](https://github.com/google-gemini/gemini-cli/pull/23579) |
| 5 | Policy `toolAnnotations` 필드 | 🟡 Medium | 신규 추가 | 없음 | 도구 메타데이터 기반 매칭 (key-value 쌍) | 향후 활용: 도구 속성 기반 정책 설정 | 공식 문서 |
| 6 | Policy `mcpName` 필드 권장화 | 🟡 Medium | 권장 방식 변경 | MCP 도구를 `toolName = "mcp_server_tool"` FQN으로 지정 | `mcpName = "server"` + `toolName = "tool"` 분리 권장 | 정보: bkit MCP 서버 정책 작성 시 참고 | 공식 문서 |
| 7 | `/mcp refresh` -> `/mcp reload` | 🟢 Low | 명령어 이름 변경 | `/mcp refresh` | `/mcp reload` | 낮음: bkit 문서/안내에서 참조 시 업데이트 필요 | [PR #23631](https://github.com/google-gemini/gemini-cli/pull/23631) |
| 8 | ModelChain schema | 🟡 Medium | 신규 추가 | 없음 | `modelConfigs`에 ModelChain 정의 가능 | 중간: 복잡한 모델 워크플로우에 활용 | [PR #22914](https://github.com/google-gemini/gemini-cli/pull/22914), [PR #23284](https://github.com/google-gemini/gemini-cli/pull/23284) |

---

## 6. 도구(Tool) 변경

### 6.1 핵심 도구 이름 (변경 없음 확인)

v0.36.0에서 핵심 파일 시스템 도구의 API 이름(toolName)은 **변경되지 않았음**.

| 도구 API명 | 표시명 | 상태 | bkit 정책 참조 |
|-----------|--------|------|---------------|
| `read_file` | ReadFile | 유지 | bkit-starter-policy.toml |
| `write_file` | WriteFile | 유지 | bkit-permissions.toml, bkit-starter-policy.toml |
| `replace` | Edit | 유지 | bkit-permissions.toml, bkit-starter-policy.toml |
| `glob` | FindFiles | 유지 | bkit-starter-policy.toml |
| `grep_search` | SearchText | 유지 | bkit-starter-policy.toml |
| `run_shell_command` | Shell | 유지 | 모든 정책 파일 |
| `list_directory` | ReadFolder | 유지 | - |
| `google_web_search` | - | 유지 | bkit-starter-policy.toml |

### 6.2 도구 관련 변경사항

| # | 변경 항목 | 영향도 | 설명 | bkit 영향 | 참조 |
|---|----------|--------|------|-----------|------|
| 1 | `save_memory` -> memoryManager 에이전트 (실험적) | 🟡 Medium | `experimental.memoryManager` 활성화 시 save_memory 도구 미등록, 동명 서브에이전트로 대체 | 모니터링: bkit에서 save_memory 도구 직접 호출 시 주의 | [PR #22726](https://github.com/google-gemini/gemini-cli/pull/22726) |
| 2 | write_todo_list 도구 UI 팁에서 제거 | 🟢 Low | UI 팁에서 write todo list 도구 안내 제거 | 없음 | [PR #22281](https://github.com/google-gemini/gemini-cli/pull/22281) |
| 3 | ACP 모드에서 ask_user 도구 조건부 제외 | 🟡 Medium | ACP 모드에서 ask_user 도구 조건부 비활성화 | 낮음: ACP 사용 시에만 해당 | [PR #23045](https://github.com/google-gemini/gemini-cli/pull/23045) |
| 4 | "Allow always" for commands with paths | 🟡 Medium | 경로 포함 명령에 "항상 허용" 지원 | 중간: 사용자 편의 향상 | [PR #23558](https://github.com/google-gemini/gemini-cli/pull/23558) |

---

## 7. Hook/Policy 시스템 변경

### 7.1 Hook 이벤트 전체 목록 (v0.36.0 기준)

| Hook 이벤트 | 유형 | bkit 사용 여부 | 변경 사항 |
|------------|------|---------------|----------|
| `SessionStart` | Lifecycle | **사용중** (bkit-session-init) | 변경 없음 |
| `SessionEnd` | Lifecycle | **사용중** (bkit-cleanup) | 변경 없음 |
| `BeforeAgent` | Agent | **사용중** (bkit-intent-detection) | 변경 없음 |
| `AfterAgent` | Agent | **사용중** (bkit-agent-cleanup) | 변경 없음 |
| `BeforeModel` | Model | **사용중** (bkit-before-model) | 변경 없음 |
| `AfterModel` | Model | **사용중** (bkit-after-model) | 변경 없음 |
| `BeforeToolSelection` | Model | **사용중** (bkit-tool-filter) | 변경 없음 |
| `BeforeTool` | Tool | **사용중** (bkit-pre-write, bkit-pre-bash) | **개선**: `ask` decision 지원 추가 ([PR #21146](https://github.com/google-gemini/gemini-cli/pull/21146)) |
| `AfterTool` | Tool | **사용중** (bkit-post-write, bkit-post-bash, bkit-post-skill) | 변경 없음 |
| `PreCompress` | System | **사용중** (bkit-context-save) | 변경 없음 |
| `Notification` | System | 미사용 | 변경 없음 |

### 7.2 Hook 관련 주요 변경

| # | 변경 항목 | 영향도 | 설명 | bkit 영향 | 참조 |
|---|----------|--------|------|-----------|------|
| 1 | BeforeTool hook `ask` decision 지원 | 🟠 High | BeforeTool 훅에서 `decision: "ask"` 반환 가능. 이전에는 `allow`/`block`만 지원 | **활용 가능**: bkit before-tool.js에서 조건부 사용자 확인 요청 가능 | [PR #21146](https://github.com/google-gemini/gemini-cli/pull/21146) |
| 2 | Hook tests scheduler 이전 | 🟢 Low | 훅 테스트가 coreToolScheduler에서 새 scheduler로 이전 | 없음: 내부 테스트 변경 | [PR #23496](https://github.com/google-gemini/gemini-cli/pull/23496) |
| 3 | BeforeToolSelection union strategy | 🟡 Medium | 다수 BeforeToolSelection 훅의 화이트리스트를 union(합집합) 전략으로 결합 | 정보: 다중 확장이 BeforeToolSelection 사용 시 동작 방식 | 공식 문서 |

### 7.3 Policy 시스템 변경

| # | 변경 항목 | 영향도 | 설명 | bkit 영향 | 참조 |
|---|----------|--------|------|-----------|------|
| 1 | `toolName` 필수화 | 🟠 High | 모든 정책 rule에 toolName 명시 필수. 미지정 시 검증 실패 | **호환 확인됨**: bkit 모든 rule에 toolName 있음 | [PR #23330](https://github.com/google-gemini/gemini-cli/pull/23330) |
| 2 | `allowRedirection` 필드 추가 | 🟡 Medium | 셸 리디렉션 연산자 허용/차단 세밀 제어 | 향후 활용: 파이프/리디렉션 정책 세분화 | [PR #23579](https://github.com/google-gemini/gemini-cli/pull/23579) |
| 3 | `toolAnnotations` 필드 추가 | 🟡 Medium | 도구 메타데이터 기반 정책 매칭 | 향후 활용: 속성 기반 정책 | 공식 문서 |
| 4 | `mcpName` 분리 권장 | 🟡 Medium | MCP 도구 정책에서 `mcpName` + `toolName` 분리 권장 | 정보: bkit MCP 연동 시 새 방식 적용 | 공식 문서 |
| 5 | Tilde expansion in policy paths | 🟢 Low | settings.json의 policyPaths에서 `~` 확장 지원 | 편의: 정책 경로에 `~/` 사용 가능 | [PR #22772](https://github.com/google-gemini/gemini-cli/pull/22772) |
| 6 | Policy engine tier system 유지 | 🟢 Low | Default(1) < Extension(2) < Workspace(3) < User(4) < Admin(5) | 정보: bkit extension policy = Tier 2 | 공식 문서 |

---

## 8. 에이전트 관련 변경

### 8.1 에이전트 시스템 핵심 변경

| # | 변경 항목 | 영향도 | 설명 | bkit 영향 | 참조 |
|---|----------|--------|------|-----------|------|
| 1 | `enableAgents` 기본값 `false` | 🔴 Critical | 에이전트 기본 비활성화. 명시적 opt-in 필요 | **이미 대응**: session-start.js에서 자동 true 설정 | [PR #23546](https://github.com/google-gemini/gemini-cli/pull/23546) |
| 2 | Multi-Registry Architecture | 🟠 High | 서브에이전트별 독립 도구 레지스트리 + 필터링 | 높음: bkit 에이전트 도구 접근 범위 자동 격리 | [PR #22712](https://github.com/google-gemini/gemini-cli/pull/22712) |
| 3 | Subagent Local Execution | 🟠 High | 서브에이전트 로컬 실행 + 도구 격리 | 높음: 에이전트 실행 모델 변경 | [PR #22718](https://github.com/google-gemini/gemini-cli/pull/22718) |
| 4 | AgentSession 도입 | 🟡 Medium | AgentProtocol의 stream() -> subscribe(). AgentStart/AgentEnd 이벤트 | 낮음: hooks 기반 bkit에 직접 영향 적음 | [PR #23159](https://github.com/google-gemini/gemini-cli/pull/23159) |
| 5 | Agent Acknowledgment Command | 🟡 Medium | 에이전트 확인 명령으로 레지스트리 발견 강화 | 중간: 에이전트 등록 안정성 향상 | [PR #22389](https://github.com/google-gemini/gemini-cli/pull/22389) |
| 6 | JIT Context capped at git root | 🟡 Medium | JIT 컨텍스트 상향 순회가 git root에서 중단 | 중간: 에이전트 컨텍스트 범위 제한 인지 | [PR #23074](https://github.com/google-gemini/gemini-cli/pull/23074) |
| 7 | Subagent tool failure UI reflection | 🟢 Low | 서브에이전트 도구 실패 시 UI 정확한 반영 | 낮음: UX 자동 개선 | [PR #23187](https://github.com/google-gemini/gemini-cli/pull/23187) |
| 8 | CliHelpAgent description refinement | 🟢 Low | CliHelpAgent 설명 다듬어 위임 정확성 향상 | 낮음: 내부 에이전트 개선 | [PR #23310](https://github.com/google-gemini/gemini-cli/pull/23310) |
| 9 | Behavioral evaluations for subagent routing | 🟡 Medium | 서브에이전트 라우팅 시 행동 평가 기반 선택 | 중간: bkit 에이전트 라우팅 품질 향상 | [PR #23272](https://github.com/google-gemini/gemini-cli/pull/23272) |
| 10 | Remote agent streaming UI/UX | 🟢 Low | 원격 에이전트 스트리밍 UI 개선 | 낮음: bkit은 로컬 에이전트 중심 | [PR #23633](https://github.com/google-gemini/gemini-cli/pull/23633) |

### 8.2 메모리 관리 변경

| # | 변경 항목 | 영향도 | 설명 | bkit 영향 | 참조 |
|---|----------|--------|------|-----------|------|
| 1 | memoryManager 에이전트 (실험적) | 🟡 Medium | `experimental.memoryManager` 활성화 시 save_memory 도구 대신 서브에이전트가 메모리 관리. 중복 제거, 계층적 저장(글로벌 `~/.gemini/GEMINI.md` + 프로젝트 `./GEMINI.md`), 구조화 편집 | 향후 검토: bkit memory-helper.js와의 관계 정리 필요 | [PR #22726](https://github.com/google-gemini/gemini-cli/pull/22726) |
| 2 | logPrompts privacy enforcement | 🟢 Low | 메모리 누수 패치 + logPrompts 프라이버시 강화 | 낮음: 내부 메모리 관리 | [PR #23281](https://github.com/google-gemini/gemini-cli/pull/23281) |

---

## 9. 버그 수정 (bkit 관련)

### 9.1 bkit에 직접 영향 가능한 수정

| # | 이슈/PR | 영향도 | 설명 | bkit 관련성 | 참조 |
|---|---------|--------|------|-------------|------|
| 1 | Stale closure data loss in settings loading | 🟠 High | onModelChange에서 settings를 lazy load하여 stale closure 방지 | 높음: bkit settings.json 동적 변경 시 안정성 향상 | [PR #20403](https://github.com/google-gemini/gemini-cli/pull/20403) |
| 2 | Subagent thought appending duplicate | 🟡 Medium | 서브에이전트 thought 중복 추가 수정 | 중간: bkit 에이전트 응답 품질 향상 | [PR #22975](https://github.com/google-gemini/gemini-cli/pull/22975) |
| 3 | Terminal escape sequences leaking on exit | 🟡 Medium | 종료 시 터미널 이스케이프 시퀀스 누출 방지 | 중간: 사용자 터미널 깨짐 방지 | [PR #22682](https://github.com/google-gemini/gemini-cli/pull/22682) |
| 4 | Duplicate footer on tool cancel via ESC | 🟢 Low | ESC로 도구 취소 시 중복 푸터 수정 | 낮음: UI 개선 | [PR #21781](https://github.com/google-gemini/gemini-cli/pull/21781) |
| 5 | Ctrl+D exit prevention with non-empty input | 🟢 Low | 입력 버퍼 비어있지 않을 때 Ctrl+D 종료 방지 | 낮음: 실수 방지 UX | [PR #23306](https://github.com/google-gemini/gemini-cli/pull/23306) |
| 6 | Auto-update for standalone binaries | 🟢 Low | 독립 실행형 바이너리 자동 업데이트 수정 | 낮음: 설치 방식에 따라 해당 | [PR #23038](https://github.com/google-gemini/gemini-cli/pull/23038) |
| 7 | NPM audit vulnerabilities | 🟢 Low | npm 감사 취약점 수정 | 낮음: 보안 패치 자동 적용 | [PR #23679](https://github.com/google-gemini/gemini-cli/pull/23679) |

### 9.2 성능/최적화 변경

| # | 항목 | 영향도 | 변경 내용 | 예상 효과 | 참조 |
|---|------|--------|-----------|-----------|------|
| 1 | Startup cleanup task parallelization | 🟡 Medium | 시작 시 정리 작업 병렬화 | 시작 시간 단축 | [PR #23545](https://github.com/google-gemini/gemini-cli/pull/23545) |
| 2 | --version startup time optimization | 🟢 Low | `--version` 플래그 실행 시간 최적화 | 버전 확인 빨라짐 | [PR #23671](https://github.com/google-gemini/gemini-cli/pull/23671) |
| 3 | IDE client lazy loading | 🟡 Medium | IDE 클라이언트를 백그라운드에서 lazy load | 초기화 속도 향상 | [PR #23603](https://github.com/google-gemini/gemini-cli/pull/23603) |

---

## 10. 브라우저 에이전트 변경

| # | 변경 항목 | 영향도 | 설명 | 참조 |
|---|----------|--------|------|------|
| 1 | Browser privacy consent | 🟡 Medium | 브라우저 에이전트 사용 시 프라이버시 동의 구현 | [PR #21119](https://github.com/google-gemini/gemini-cli/pull/21119) |
| 2 | Security prompt for browser agent | 🟡 Medium | 브라우저 에이전트에 보안 프롬프트 추가 | [PR #23241](https://github.com/google-gemini/gemini-cli/pull/23241) |
| 3 | Sensitive action controls | 🟡 Medium | 민감 작업 제어 + 읽기 전용 노이즈 감소 | [PR #22867](https://github.com/google-gemini/gemini-cli/pull/22867) |
| 4 | Browser agent description narrowing | 🟢 Low | 브라우저 에이전트 설명 축소 (URL 작업 탈취 방지) | [PR #23086](https://github.com/google-gemini/gemini-cli/pull/23086) |
| 5 | "Allow all server tools" session policy | 🟡 Medium | 브라우저에서 "모든 서버 도구 허용" 세션 정책 활성화 | [PR #22343](https://github.com/google-gemini/gemini-cli/pull/22343) |

---

## 11. ACP (Agent Communication Protocol) 변경

| # | 변경 항목 | 영향도 | 설명 | 참조 |
|---|----------|--------|------|------|
| 1 | ACP SDK 0.12 -> 0.16.1 업그레이드 | 🟡 Medium | ACP SDK 메이저 버전 업그레이드 | [PR #23132](https://github.com/google-gemini/gemini-cli/pull/23132) |
| 2 | Token usage metadata in send return | 🟡 Medium | send 메서드 반환값에 토큰 사용량 메타데이터 포함 | [PR #23148](https://github.com/google-gemini/gemini-cli/pull/23148) |
| 3 | CWD passing to AcpFileSystemService | 🟡 Medium | ACP 파일시스템 서비스에 CWD 전달 (권한 루프 방지) | [PR #23612](https://github.com/google-gemini/gemini-cli/pull/23612) |
| 4 | Conversational text separation | 🟢 Low | 대화 텍스트와 실행 도구 명령 타이틀 분리 | [PR #23179](https://github.com/google-gemini/gemini-cli/pull/23179) |

---

## 12. 원문 참조 링크

### 공식 소스

| 소스 | URL | 확인 여부 |
|------|-----|----------|
| v0.36.0 Release Notes | [GitHub Release](https://github.com/google-gemini/gemini-cli/releases/tag/v0.36.0) | 확인 |
| v0.36.0 Stable Changelog | [geminicli.com](https://geminicli.com/docs/changelogs/latest/) | 확인 |
| v0.36.0 Preview Changelog | [geminicli.com](https://geminicli.com/docs/changelogs/preview/) | 확인 |
| Changelog Index | [GitHub](https://github.com/google-gemini/gemini-cli/blob/main/docs/changelogs/index.md) | 확인 |
| Policy Engine 문서 | [geminicli.com](https://geminicli.com/docs/reference/policy-engine/) | 확인 |
| Hooks Reference | [geminicli.com](https://geminicli.com/docs/hooks/reference/) | 확인 |
| Configuration Reference | [GitHub](https://github.com/google-gemini/gemini-cli/blob/main/docs/reference/configuration.md) | 확인 |
| File System Tools | [geminicli.com](https://geminicli.com/docs/tools/file-system/) | 확인 |

### 핵심 PR

| PR | 제목 | 카테고리 |
|----|------|---------|
| [#23546](https://github.com/google-gemini/gemini-cli/pull/23546) | Disable agents by default | Breaking (P0) |
| [#23330](https://github.com/google-gemini/gemini-cli/pull/23330) | Force policy config to specify toolName | Breaking |
| [#23159](https://github.com/google-gemini/gemini-cli/pull/23159) | AgentSession introduction | Breaking (API) |
| [#23566](https://github.com/google-gemini/gemini-cli/pull/23566) | Extension skills prefix with colon separator | Breaking (Skills) |
| [#22712](https://github.com/google-gemini/gemini-cli/pull/22712) | Multi-registry architecture | Feature |
| [#22718](https://github.com/google-gemini/gemini-cli/pull/22718) | Subagent local execution | Feature |
| [#22726](https://github.com/google-gemini/gemini-cli/pull/22726) | Memory manager agent | Feature |
| [#23139](https://github.com/google-gemini/gemini-cli/pull/23139) | Sandbox write-protected governance files | Feature (Security) |
| [#22832](https://github.com/google-gemini/gemini-cli/pull/22832) | macOS Seatbelt sandboxing | Feature (Security) |
| [#22973](https://github.com/google-gemini/gemini-cli/pull/22973) | Git worktree support | Feature |
| [#21146](https://github.com/google-gemini/gemini-cli/pull/21146) | BeforeTool hook ask decision | Feature (Hooks) |
| [#23579](https://github.com/google-gemini/gemini-cli/pull/23579) | allowRedirect in policy engine | Feature (Policy) |

---

## 13. bkit v2.0.2 -> v2.0.3 마이그레이션 영향 분석 요약

### P0 (즉시 대응 필요)

| # | 항목 | 현재 상태 | 필요 조치 |
|---|------|----------|----------|
| 1 | `enableAgents` 기본값 `false` | **이미 대응 완료** (v2.0.2) | 없음 (session-start.js에서 자동 설정) |

### P1 (높은 우선순위 확인)

| # | 항목 | 현재 상태 | 필요 조치 |
|---|------|----------|----------|
| 1 | Policy `toolName` 필수화 | **호환 확인됨** | 없음 (모든 rule에 toolName 있음) |
| 2 | Extension skills 접두사 `:` 변경 | **확인 필요** | bkit skills가 `/스킬명` -> `/bkit:스킬명`으로 변경되는지 테스트 필요 |
| 3 | Sandbox governance 파일 보호 | **인지 필요** | bkit 에이전트가 `.gitignore`, `.geminiignore`, `.git/` 수정 시도 시 실패할 수 있음 |

### P2 (향후 검토)

| # | 항목 | 필요 조치 |
|---|------|----------|
| 1 | BeforeTool `ask` decision 활용 | before-tool.js에서 `decision: "ask"` 반환 활용 검토 |
| 2 | `allowRedirection` 정책 활용 | 셸 리디렉션 세밀 제어 정책 추가 검토 |
| 3 | Multi-Registry / Tool Isolation 활용 | bkit 에이전트별 도구 격리 전략 수립 |
| 4 | memoryManager 에이전트 평가 | bkit memory-helper.js와의 관계 정리 |
| 5 | ModelChain 활용 | 복잡한 모델 워크플로우 설계 검토 |

---

## 14. 조사 신뢰도

| 항목 | 신뢰도 | 비고 |
|------|--------|------|
| Breaking Changes | HIGH (4/5) | PR 직접 확인, 공식 릴리스 노트 기반. extension skills prefix는 실제 동작 테스트 미완 |
| 새 기능 | HIGH (4/5) | 공식 changelog + 릴리스 노트 교차 검증 |
| Deprecation | MEDIUM (3/5) | save_memory 실험적 대체는 확인. 다른 미발표 deprecation 가능성 있음 |
| 설정 변경 | HIGH (4/5) | 공식 configuration 문서 + PR 기반 |
| 도구 이름 변경 | HIGH (4/5) | 공식 tools 문서 확인, 핵심 도구 이름 유지 확인 |
| Hook 변경 | HIGH (4/5) | 공식 hooks reference 확인 + PR 기반 |
| Policy 변경 | HIGH (4/5) | 공식 policy-engine.md 직접 확인 + PR 기반 |
| 에이전트 변경 | HIGH (4/5) | 다수 PR 직접 확인 |
| 버그 수정 | MEDIUM (3/5) | 주요 수정만 발췌. 59건 전체 미포함 |
| 성능 변경 | MEDIUM (3/5) | 명시적 perf PR 3건만 확인 |

---

> **조사 방법론**: GitHub Release Notes, geminicli.com 공식 문서, 개별 PR 직접 확인, 공식 policy-engine/hooks/tools/configuration 문서 교차 검증. 확인 불가 항목은 "확인 필요" 표기.
>
> **다음 단계**: Extension skills 접두사 변경(`:`)의 bkit 영향을 실제 v0.36.0 환경에서 테스트 권장.
