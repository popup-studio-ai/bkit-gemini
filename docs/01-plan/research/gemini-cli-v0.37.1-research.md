# Gemini CLI v0.37.1 변경사항 조사 보고서

> 조사일: 2026-04-13
> 조사 범위: v0.36.0 (2026-04-01) -> v0.37.1 (2026-04-09)
> 조사자: gemini-researcher agent
> bkit 현재 버전: v2.0.4 (Gemini CLI v0.36.0 대상)

---

## 1. 버전 개요

### 1.1 릴리스 타임라인

| 버전 | 릴리스일 | 유형 | 주요 테마 |
|------|---------|------|----------|
| **v0.36.0** | 2026-04-01 | Stable | 멀티레지스트리, 네이티브 샌드박싱, AgentSession, enableAgents=false |
| v0.37.0-preview.0~8 | 2026-04-01~07 | Preview | Plan Mode 안정화, 동적 샌드박스 확장, Chapters 시스템 |
| **v0.37.0** | 2026-04-08 | Stable | Plan Mode stable, enableAgents=true 복원, JIT context=false, Chapters |
| **v0.37.1** | 2026-04-09 | Patch | ACP 오류 처리 개선, /about + /help 명령 추가 |
| v0.38.0-preview.0 | 2026-04-08 | Preview | ContextCompressionService, BeforeModel e2e 전파, 백그라운드 메모리 |

### 1.2 릴리스 규모 (v0.37.0)

- **약 120+ 변경**: 40+ 기능, 40+ 버그 수정, 15+ 문서, 10+ 테스트/인프라
- 주요 기여자: @galz10 (sandbox), @scidomino (sandbox), @abhipatel12 (agents), @DavidAPierce (security), @SandyTao520 (release)
- **v0.37.1**: 4 commits, ACP 관련 패치 (PR #24540, #24649, #24839)

### 1.3 주요 테마

1. **Plan Mode 안정화 (Stable Promotion)**: 실험적 -> 안정 단계 승격, 모델 라우팅 내장
2. **기본값 복원/변경**: enableAgents=true 복원, JIT context=false, compactToolOutput=true
3. **동적 샌드박스 확장 (Dynamic Sandbox Expansion)**: Linux/Windows 모두 지원
4. **Chapters (도구 기반 토픽 그룹핑)**: 세션 내 에이전트 상호작용의 논리적 그룹화
5. **브라우저 에이전트 강화**: 영속 세션 관리, 동적 읽기 전용 도구 발견
6. **보안 강화**: 환경 파일 비밀 가시성 잠금, Windows MIC 통합

---

## 2. Breaking Changes (하위 호환성 깨짐)

### 2.1 확인된 Breaking Changes

| # | 항목 | 영향도 | 이전 동작 (v0.36.0) | 이후 동작 (v0.37.x) | bkit 영향 | 참조 |
|---|------|--------|---------------------|---------------------|-----------|------|
| 1 | `experimental.enableAgents` 기본값 `true` 복원 | INFO | v0.36.0에서 `false`로 변경됨 | `true`로 복원 (원래 동작) | **영향 없음**: bkit의 `ensureAgentsEnabled()`가 어느 쪽이든 대응. v0.37에서는 불필요하나 안전망 유지 권장 | [PR #23672](https://github.com/google-gemini/gemini-cli/pull/23672) |
| 2 | `experimental.jitContext` 기본값 `false` 전환 | 🟡 Medium | `true` (JIT 활성) | `false` (즉시 로딩, eager loading) | **긍정적**: bkit GEMINI.md 컨텍스트가 세션 시작 시 즉시 로딩됨. 안정성 향상 | [PR #24364](https://github.com/google-gemini/gemini-cli/pull/24364) |
| 3 | `ui.compactToolOutput` 기본값 `true` 전환 | 🟢 Low | `false` (전체 출력) | `true` (구조화된 축약 출력) | **영향 없음**: bkit AfterTool 훅은 tool_name/tool_input만 읽음 (출력 형식 무관) | 설정 문서 확인 |
| 4 | Plan Mode: 실험적 -> 안정 (stable) | INFO | `experimental.planMode` | `general.plan.enabled` (기본값 `true`) | **영향 없음**: bkit은 plan mode 직접 사용하지 않음. 향후 PDCA 사이클 통합 기회 | [PR #24282](https://github.com/google-gemini/gemini-cli/pull/24282) |

### 2.2 bkit 영향 분석 요약

**v0.36.0 -> v0.37.1 마이그레이션에서 코드 변경이 필요한 Breaking Change는 없음.**

- **enableAgents**: v0.36.0에서 `false`로 변경되어 bkit이 `ensureAgentsEnabled()`로 대응했는데, v0.37에서 `true`로 복원됨. 안전망 코드는 유지하되 불필요한 설정 덮어쓰기가 발생함 (동작에 영향 없음)
- **JIT context**: `false`로 변경되어 bkit에 긍정적. GEMINI.md 컨텍스트가 세션 시작 시 확실히 로딩됨
- **compactToolOutput**: bkit AfterTool 훅 동작에 영향 없음 (UI 표시만 변경)

---

## 3. 새로운 기능 (New Features)

| # | 기능명 | 영향도 | 설명 | bkit 활용 가능성 | 참조 |
|---|--------|--------|------|-----------------|------|
| 1 | **Plan Mode Stable + Model Routing** | 🟠 High | Plan Mode가 안정 단계로 승격. Pro 모델(설계) -> Flash 모델(구현) 자동 라우팅 내장. `/plan` 명령 + `Shift+Tab` 모드 전환 | **높음**: bkit PDCA 사이클에 Plan Mode 통합 가능. `plan.modelRouting`으로 비용 최적화 | [PR #24282](https://github.com/google-gemini/gemini-cli/pull/24282) |
| 2 | **Chapters (Tool-Based Topic Grouping)** | 🟡 Medium | 도구 사용 및 의도 기반으로 에이전트 상호작용을 논리적 "챕터"로 그룹핑. 장시간 세션의 가독성 향상 | **중간**: bkit 세션 히스토리 분석 시 챕터 단위 맥락 파악 가능 | [PR #24241](https://github.com/google-gemini/gemini-cli/pull/24241) |
| 3 | **Dynamic Sandbox Expansion (Linux + Windows)** | 🟡 Medium | 런타임에 샌드박스 경계를 동적으로 확장. Git worktree 지원 포함 | **중간**: 다중 워크스페이스 환경에서 bkit 에이전트 실행 유연성 향상 | [PR #23691](https://github.com/google-gemini/gemini-cli/pull/23691), [PR #23692](https://github.com/google-gemini/gemini-cli/pull/23692) |
| 4 | **Persistent Browser Session Management** | 🟡 Medium | 브라우저 에이전트의 세션을 유지하며 동적 읽기 전용 도구 발견 + `maxActionsPerTask` 설정 | **낮음**: bkit이 브라우저 에이전트를 직접 사용하지 않는 한 | [PR #21306](https://github.com/google-gemini/gemini-cli/pull/21306) |
| 5 | **`context.memoryBoundaryMarkers`** 설정 | 🟠 High | GEMINI.md 발견 시 상향 탐색 경계를 `.git` 외에 커스텀 마커로 설정 가능 | **높음**: monorepo 환경에서 bkit 프로젝트별 GEMINI.md 범위 제어 | 설정 문서 |
| 6 | **Secret Visibility Lockdown** | 🟡 Medium | 환경 파일(`.env` 등)의 비밀 값이 에이전트에게 노출되지 않도록 잠금 | **중간**: bkit 보안 가이드에 문서화 필요 | v0.37.0 릴리스 노트 |
| 7 | **Project-Level Memory Scope** | 🟡 Medium | `save_memory` 도구에 프로젝트 수준 메모리 범위 추가 (글로벌 vs 프로젝트) | **높음**: bkit 에이전트 메모리를 프로젝트별로 격리 가능 | v0.37.0 릴리스 노트 |
| 8 | **Unified Context Management + Tool Distillation** | 🟡 Medium | 컨텍스트 관리 통합 및 도구 출력 요약(distillation) 시스템 | **중간**: 토큰 사용량 최적화에 기여 | [PR #24157](https://github.com/google-gemini/gemini-cli/pull/24157) |
| 9 | **Dynamic Model Routing (Gemini 3.1 Pro -> customtools)** | 🟡 Medium | Gemini 3.1 Pro 요청을 customtools 모델로 동적 라우팅 | **정보**: 모델 성능 최적화 자동 적용 | [PR #23641](https://github.com/google-gemini/gemini-cli/pull/23641) |
| 10 | **Flash Lite Preview Model** | 🟢 Low | 사용자 티어와 무관하게 Flash Lite Preview 모델 표시 | **낮음**: 모델 선택지 확대 | [PR #23904](https://github.com/google-gemini/gemini-cli/pull/23904) |
| 11 | **Shell Output 10MB Cap** | 🟢 Low | 셸 출력 10MB 제한으로 RangeError 크래시 방지 | **긍정적**: 대용량 출력 시 안정성 향상 | [PR #24168](https://github.com/google-gemini/gemini-cli/pull/24168) |
| 12 | **Windows Mandatory Integrity Control** | 🟢 Low | Windows 샌드박스에 필수 무결성 제어 구현 | **낮음**: Windows 사용 시에만 해당 | [PR #24057](https://github.com/google-gemini/gemini-cli/pull/24057) |
| 13 | **Extension Update UI** | 🟢 Low | 확장 업데이트 관리 UI 추가 | **낮음**: UX 자동 적용 | [PR #23682](https://github.com/google-gemini/gemini-cli/pull/23682) |
| 14 | **Inline `agentCardJson` for Remote Agents** | 🟡 Medium | 원격 에이전트에 인라인 에이전트 카드 JSON 지원 | **중간**: bkit 원격 에이전트 설정 간소화 | [PR #23743](https://github.com/google-gemini/gemini-cli/pull/23743) |
| 15 | **Tab-to-Queue Messages** | 🟢 Low | 생성 중 Tab 키로 다음 메시지 대기열에 추가 | **낮음**: UX 자동 적용 | v0.37.0 릴리스 노트 |

---

## 4. Deprecation 예고 (향후 제거 예정)

| # | 항목 | 영향도 | 예고 버전 | 제거 예정 | 현재 대안 | bkit 영향 | 참조 |
|---|------|--------|-----------|-----------|-----------|-----------|------|
| 1 | `save_memory` 도구 (단독) | 🟡 Medium | v0.36.0 (실험적 대체) | 미정 | `experimental.memoryManager` 서브에이전트 | 모니터링: bkit에서 save_memory 직접 호출 시 주의 | [PR #22726](https://github.com/google-gemini/gemini-cli/pull/22726) |
| 2 | `accessibility.enableLoadingPhrases` 설정 | 🟢 Low | v0.36.0 | 미정 | `ui.loadingPhrases` | 없음: bkit 미사용 | 공식 문서 |
| 3 | `experimental.planMode` 설정 경로 | 🟡 Medium | v0.37.0 | 미정 (아직 호환) | `general.plan.enabled` + `general.plan.modelRouting` | 정보: 설정 경로 이전 시 업데이트 필요 | [PR #24282](https://github.com/google-gemini/gemini-cli/pull/24282) |

---

## 5. 설정/구성 변경

### 5.1 기본값 변경

| # | 설정 항목 | 변경 유형 | v0.36.0 기본값 | v0.37.1 기본값 | bkit 영향 | 참조 |
|---|-----------|-----------|---------------|---------------|-----------|------|
| 1 | `experimental.enableAgents` | 기본값 복원 | `false` | `true` | bkit `ensureAgentsEnabled()` 불필요해지나 안전망 유지 권장 | [PR #23672](https://github.com/google-gemini/gemini-cli/pull/23672) |
| 2 | `experimental.jitContext` | 기본값 변경 | `true` | `false` | **긍정적**: 즉시 로딩으로 안정성 향상 | [PR #24364](https://github.com/google-gemini/gemini-cli/pull/24364) |
| 3 | `ui.compactToolOutput` | 기본값 변경 | `false` | `true` | 영향 없음 (UI 전용) | 설정 문서 |
| 4 | `general.plan.enabled` | 신규 (stable 승격) | 해당 없음 (experimental) | `true` | 정보: 사용자에게 Plan Mode 기본 활성화 | [PR #24282](https://github.com/google-gemini/gemini-cli/pull/24282) |
| 5 | `general.plan.modelRouting` | 신규 | 해당 없음 | `true` | **기회**: Pro/Flash 자동 전환으로 비용 최적화 | 설정 문서 |

### 5.2 신규 설정 항목

| # | 설정 항목 | 기본값 | 설명 | bkit 활용 | 참조 |
|---|-----------|--------|------|-----------|------|
| 1 | `context.memoryBoundaryMarkers` | `[".git"]` | GEMINI.md 상향 탐색 경계 마커 배열 | **높음**: monorepo 프로젝트별 범위 제어 | 설정 문서 |
| 2 | `general.plan.directory` | `".gemini/plans"` | Plan Mode 파일 저장 경로 | 중간: bkit 계획 파일 경로 커스텀 | 설정 문서 |
| 3 | `general.plan.modelRouting` | `true` | Plan/Execute 단계별 모델 자동 전환 | **높음**: 비용 최적화 | 설정 문서 |
| 4 | `general.sessionRetention.enabled` | `true` | 세션 자동 정리 활성화 | 정보 | 설정 문서 |
| 5 | `general.sessionRetention.maxAge` | `"30d"` | 세션 보존 기간 | 정보 | 설정 문서 |
| 6 | `security.environmentVariableRedaction.enabled` | `false` | 민감 환경 변수 마스킹 | 중간: 보안 강화 시 활성화 | 설정 문서 |

---

## 6. Hook/Policy 시스템 변경

### 6.1 Hook 시스템 (v0.37.1 기준)

**Hook 이벤트 목록에 변경 없음** - 11개 이벤트 유지:
SessionStart, SessionEnd, BeforeAgent, AfterAgent, BeforeModel, AfterModel, BeforeToolSelection, BeforeTool, AfterTool, PreCompress, Notification

| # | 변경 항목 | 영향도 | 설명 | bkit 영향 | 참조 |
|---|----------|--------|------|-----------|------|
| 1 | Hook 시스템 구조 변경 없음 | INFO | 11개 이벤트, 입출력 스키마 모두 유지 | **호환 확인**: bkit 전체 훅 동작 유지 | 훅 레퍼런스 문서 |
| 2 | BeforeModel hook model override e2e 전파 | INFO | v0.38.0-preview에서 수정 (PR #24784). v0.37에서는 미포함 | **주목**: 향후 v0.38 안정화 시 bkit BeforeModel 훅의 모델 오버라이드 안정성 향상 | [PR #24784](https://github.com/google-gemini/gemini-cli/pull/24784) |

### 6.2 Policy 시스템

| # | 변경 항목 | 영향도 | 설명 | bkit 영향 | 참조 |
|---|----------|--------|------|-----------|------|
| 1 | `toolName` 필수 (v0.36.0에서 도입) | 유지됨 | v0.37에서 변경 없음. 모든 policy rule에 toolName 필수 | **호환 확인됨**: bkit 모든 rule에 toolName 존재 | [PR #23330](https://github.com/google-gemini/gemini-cli/pull/23330) |
| 2 | ACP 정책 관련 개선 | 🟢 Low | `additional_permissions` 조건부 노출, 비대화형 ASK_USER 거부를 명시적 정책으로 대체 | 낮음: ACP 사용 시에만 해당 | v0.37.0 릴리스 노트 |

---

## 7. 버그 수정 (주요, bkit 관련)

| # | 이슈/PR | 설명 | bkit 관련성 | 참조 |
|---|---------|------|-------------|------|
| 1 | TTY hang in headless environments | 헤드리스 환경에서 TTY 행 해결 | **높음**: CI/CD에서 bkit 실행 시 안정성 | [PR #23673](https://github.com/google-gemini/gemini-cli/pull/23673) |
| 2 | Shell output 10MB cap | 10MB 초과 셸 출력 시 RangeError 크래시 방지 | **높음**: 대규모 출력 처리 안정성 | [PR #24168](https://github.com/google-gemini/gemini-cli/pull/24168) |
| 3 | MCP discovery premature completion | MCP 서버 발견 조기 완료 방지 | **중간**: bkit MCP 서버 안정적 등록 | [PR #23637](https://github.com/google-gemini/gemini-cli/pull/23637) |
| 4 | Plan Mode deadlock during file creation | Plan 파일 생성 중 교착 상태 해결 | **낮음**: Plan Mode 사용 시 안정성 | v0.37.0 릴리스 노트 |
| 5 | Browser session race condition | 브라우저 세션 닫기 프로세스 경합 조건 해결 | **낮음**: 브라우저 에이전트 사용 시에만 | v0.37.0 릴리스 노트 |
| 6 | ACP grep_search Operation Aborted | grep 검색 시 ACP 작업 중단 오류 해결 | **중간**: ACP 환경에서 검색 도구 안정성 | v0.37.0 릴리스 노트 |
| 7 | Shell outputChunks buffer memory bloat | 셸 출력 청크 버퍼 캐싱 제거로 메모리 누수 방지 | **높음**: 장시간 세션 안정성 | [PR #23751](https://github.com/google-gemini/gemini-cli/pull/23751) |
| 8 | Chat compression AbortSignal threading | 채팅 압축 요청에 AbortSignal 전달 | **중간**: 세션 종료 시 정상 정리 | [PR #20778](https://github.com/google-gemini/gemini-cli/pull/20778) |

---

## 8. 성능/최적화 변경

| # | 항목 | 변경 내용 | 예상 효과 |
|---|------|-----------|-----------|
| 1 | Shell outputChunks 버퍼 캐싱 제거 | 메모리 누수 방지 | 장시간 세션에서 메모리 사용량 안정화 |
| 2 | Build scripts 병렬 실행 최적화 | 빌드 스크립트 병렬화 | 개발 빌드 속도 향상 (사용자 무관) |
| 3 | JIT context 비활성화 (즉시 로딩) | 세션 시작 시 모든 컨텍스트 즉시 로딩 | 초기 로딩 약간 느려지나 이후 안정성 향상 |
| 4 | Compact tool output 기본 활성화 | 도구 출력 축약 표시 | 토큰 사용량 감소 |

---

## 9. 의존성 변경

| 패키지 | 이전 버전 | 이후 버전 | 주의사항 |
|--------|-----------|-----------|----------|
| Ink | 미확인 | 6.5.0 -> 6.6.3 | UI 렌더링 라이브러리 업데이트 |
| eslint | - | 메모리 제한 증가 | 개발 의존성 (사용자 무관) |

---

## 10. v0.38.0-preview.0 주목할 변경 (다음 stable 후보)

bkit의 다음 마이그레이션 계획을 위해 v0.38.0-preview.0의 주요 변경사항을 미리 정리합니다.

| # | 항목 | 영향도 | 설명 | bkit 관련성 |
|---|------|--------|------|-------------|
| 1 | **ContextCompressionService** | 🟠 High | 컨텍스트 윈도우 사용량 최적화 서비스 | **높음**: bkit 컨텍스트 전략 재검토 필요 |
| 2 | **Background Memory Service** | 🟠 High | 세션 간 자동 스킬 추출 + SKILL.md 생성 | **높음**: bkit 메모리/스킬 시스템과 충돌 가능성 검토 |
| 3 | **BeforeModel hook model override e2e** | 🟡 Medium | 모델 오버라이드가 전체 파이프라인에 전파 | **높음**: bkit BeforeModel 훅 안정성 향상 |
| 4 | **Persistent Policy Approvals** | 🟡 Medium | 컨텍스트 인식 영속 정책 승인 | **중간**: 반복 승인 감소 |
| 5 | **Background Process Monitoring** | 🟡 Medium | 백그라운드 프로세스 모니터링/검사 도구 | **중간**: CI/CD 통합 가능성 |
| 6 | **Subagent Workspace Scoping** | 🟡 Medium | AsyncLocalStorage 기반 서브에이전트 작업 디렉토리 범위 지정 | **높음**: bkit 에이전트 격리 강화 |
| 7 | **Skill injection into subagent prompts** | 🟡 Medium | 활성화된 스킬 시스템 명령이 서브에이전트 프롬프트에 주입 | **검증 필요**: bkit 스킬이 의도치 않게 서브에이전트에 영향 줄 가능성 |
| 8 | **TerminalBuffer mode 기본값 false 복원** | 🟢 Low | 리그레션 수정 | 정보 |

---

## 11. bkit 마이그레이션 우선순위 평가

### 11.1 즉시 조치 필요 (P0: Critical)

**없음** - v0.36.0 -> v0.37.1 마이그레이션에서 코드 변경이 필수인 항목 없음.

### 11.2 권장 조치 (P1: Recommended)

| # | 항목 | 조치 | 이유 |
|---|------|------|------|
| 1 | `ensureAgentsEnabled()` 동작 검증 | v0.37에서 enableAgents=true가 기본이므로, 중복 설정이 발생하는지 확인. 안전망으로 유지하되 로그 레벨 조정 고려 | 불필요한 설정 덮어쓰기 방지 |
| 2 | JIT context=false 동작 검증 | bkit GEMINI.md/컨텍스트 파일이 세션 시작 시 올바르게 로딩되는지 확인 | 즉시 로딩 모드에서의 동작 확인 |
| 3 | Plan Mode 활용 검토 | bkit PDCA 사이클에 Plan Mode 통합 방안 설계 | 비용 최적화 + 안전한 설계 단계 분리 |

### 11.3 기회 활용 (P2: Opportunity)

| # | 항목 | 조치 | 이유 |
|---|------|------|------|
| 1 | `context.memoryBoundaryMarkers` 활용 | monorepo 환경에서 프로젝트별 GEMINI.md 범위 설정 | 컨텍스트 정밀 제어 |
| 2 | `general.plan.modelRouting` 활용 | Pro(설계)/Flash(구현) 자동 전환으로 비용 최적화 | API 비용 절감 |
| 3 | Project-level memory scope 활용 | 프로젝트별 에이전트 메모리 격리 | 다중 프로젝트 관리 개선 |
| 4 | Secret Visibility Lockdown 문서화 | bkit 보안 가이드에 환경 파일 보호 정책 명시 | 보안 강화 |

### 11.4 향후 대비 (P3: Watch)

| # | 항목 | 시점 | 이유 |
|---|------|------|------|
| 1 | ContextCompressionService (v0.38) | v0.38 stable 릴리스 시 | bkit 컨텍스트 전략과 충돌 가능성 |
| 2 | Background Memory Service (v0.38) | v0.38 stable 릴리스 시 | bkit 스킬/메모리 시스템과 중복 가능 |
| 3 | Skill injection into subagents (v0.38) | v0.38 stable 릴리스 시 | bkit 스킬이 서브에이전트에 의도치 않게 전파될 수 있음 |
| 4 | BeforeModel e2e propagation (v0.38) | v0.38 stable 릴리스 시 | bkit 모델 라우팅 훅 안정화 |

---

## 12. 원문 참조 링크

- [x] v0.37.0 릴리스 노트: [GitHub Release v0.37.0](https://github.com/google-gemini/gemini-cli/releases/tag/v0.37.0)
- [x] v0.37.1 릴리스 노트: [GitHub Release v0.37.1](https://github.com/google-gemini/gemini-cli/releases/tag/v0.37.1)
- [x] v0.37.0...v0.37.1 비교: [GitHub Compare](https://github.com/google-gemini/gemini-cli/compare/v0.37.0...v0.37.1)
- [x] v0.38.0-preview.0 변경사항: [geminicli.com Preview Changelog](https://geminicli.com/docs/changelogs/preview/)
- [x] 최신 안정 릴리스 문서: [geminicli.com Latest Changelog](https://geminicli.com/docs/changelogs/latest/)
- [x] 설정 레퍼런스: [geminicli.com Configuration](https://geminicli.com/docs/reference/configuration/)
- [x] Hook 레퍼런스: [geminicli.com Hooks Reference](https://geminicli.com/docs/hooks/reference/)
- [x] Plan Mode 문서: [geminicli.com Plan Mode](https://geminicli.com/docs/cli/plan-mode/)
- [x] 릴리스 인덱스: [geminicli.com Changelogs](https://geminicli.com/docs/changelogs/)

---

## 13. 조사 신뢰도

| 항목 | 신뢰도 | 비고 |
|------|--------|------|
| Breaking Changes | 4/5 | v0.37.0 릴리스 노트 + 설정 문서 교차 검증 완료. enableAgents 복원 PR #23672 확인 |
| 새 기능 | 4/5 | 릴리스 노트 + 공식 문서 교차 검증. 일부 상세 PR 내용 미확인 |
| Deprecation | 3/5 | 명시적 deprecation 공지 부족. 설정 경로 이전은 추정 |
| 설정 변경 | 4/5 | 설정 문서 직접 확인 완료. 기본값 변경은 릴리스 노트와 교차 검증 |
| Hook/Policy 시스템 | 4/5 | Hook 레퍼런스 직접 확인. v0.37에서 Hook 구조 변경 없음 확인 |
| v0.38 preview | 3/5 | 프리뷰 릴리스 노트 기반. 안정 버전에서 변경될 수 있음 |

---

## 14. 결론

**v0.36.0 -> v0.37.1 마이그레이션은 저위험(Low Risk)**입니다.

핵심 판단:
1. bkit 코드 변경이 필요한 Breaking Change가 없습니다
2. 기본값 변경(enableAgents, jitContext, compactToolOutput)은 모두 bkit에 긍정적이거나 무영향입니다
3. Hook 시스템(11개 이벤트)과 Policy 시스템에 구조적 변경이 없습니다
4. Plan Mode stable 승격과 memoryBoundaryMarkers는 bkit 고도화 기회입니다
5. v0.38.0-preview의 ContextCompressionService, Background Memory Service는 향후 주의가 필요합니다

**권장 마이그레이션 전략**: v0.37.1로 업데이트 후 통합 테스트 실행, `ensureAgentsEnabled()` 동작 확인, JIT context=false 모드에서의 컨텍스트 로딩 검증.
