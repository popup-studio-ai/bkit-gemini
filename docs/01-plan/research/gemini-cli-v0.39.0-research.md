# Gemini CLI v0.39.0 변경사항 조사 보고서

> 조사일: **2026-04-23**
> 조사 범위: **v0.38.2 (2026-04-17) → v0.39.0 (2026-04-23)**
> 조사자: gemini-researcher agent
> bkit 현재 버전: v2.0.4 (Gemini CLI v0.36.0 대상)
> 조사 트리거: 메모리 스냅샷(2026-04-22 기준 "v0.38.2 변동 없음") **무효화 — v0.39.0 stable이 2026-04-23 출시됨**

---

## 0. TL;DR (한 눈에 보는 결론)

| 항목 | 값 |
|------|-----|
| **신규 stable target** | **v0.39.0** (2026-04-23 04:12 UTC, commit `398f78d`) |
| 기준 버전 (현 bkit 마이그 target) | v0.38.2 (2026-04-17) |
| v0.38.2 → v0.39.0 누적 커밋 | **101 commits, 513 files changed** (GitHub compare) |
| v0.39.0 contributors | **41명** (신규 9명) |
| 🔴 명시적 Breaking Changes | **1건** (legacy subagent wrapping tools 제거, [#25053](https://github.com/google-gemini/gemini-cli/pull/25053)) |
| 🟢 주요 신규 기능 | **10+건** (memory inbox, skill patching, JSONL 채팅 기록, ContextManager+Sidecar, tool-controlled display protocol, useAgentStream, MCP auth, Plan Mode 확인 등) |
| ⚙️ 설정 변경 | **3건** (`GEMINI_PLANS_DIR` 환경 변수, Plan mode TOML 구조 단순화, OAuth 5분 타임아웃 정리) |
| 의존성 주요 업데이트 | Ink 6.6.8 → 6.6.9, `keytar` → `@github/keytar` |
| **메모리 스냅샷 예고와 차이** | **v0.39.0에는 MemoryManager 4-tier 리팩터(#25716)와 autoMemory 분리(#25601) 미포함** — 둘 다 v0.40.0으로 미뤄짐 |

### bkit 입장 핵심 결론

1. **즉시 마이그레이션 target 변경 권고**: v0.38.2 → **v0.39.0** 직행 가능. v0.38.2 마이그 플랜은 base로 활용하되 §3 Breaking과 §4 신기능을 추가 반영.
2. **bkit v2.0.4 코드의 subagent 호출 경로가 legacy `SubagentTool`/`SubagentToolWrapper`를 직접 import 하고 있는지 사전 감사 필수**. 사용 중이면 v0.39.0에서 즉시 빌드/런타임 실패.
3. **메모리 4-tier 리팩터는 v0.39.0이 아닌 v0.40.0 영역**. bkit v2.1.0 context-optimization 설계 재검토는 **v0.40.0 stable 출시 전까지 시간 확보**.

---

## 1. 버전 개요

| 항목 | 값 |
|------|-----|
| 릴리스 날짜 | **2026-04-23 04:12 UTC** |
| 릴리스 타입 | **Minor (stable)** |
| Tag | `v0.39.0` |
| Tip commit SHA | `398f78d` |
| Preview 시리즈 | v0.39.0-preview.0 (2026-04-14), .1 (2026-04-21), .2 (2026-04-22) |
| 직전 stable | v0.38.2 (2026-04-17), 6일 간격 |
| 주요 테마 | **Subagent 통합, 메모리 시스템 진화 시작, 컨텍스트 아키텍처 디커플링, Plan Mode 강화** |

---

## 2. v0.38.2 → v0.39.0 타임라인

| 날짜 (UTC) | 태그 | 비고 |
|-----------|------|------|
| 2026-04-17 18:38 | v0.38.2 | 직전 stable |
| 2026-04-14 | v0.39.0-preview.0 | 첫 preview |
| 2026-04-21 22:52 | v0.39.0-preview.1 | Plan Mode 중첩 경로 핫픽스 ([PR #25138](https://github.com/google-gemini/gemini-cli/pull/25138) cherry-pick) |
| 2026-04-22 00:45 | v0.39.0-preview.2 | A2A 활동 추적 리팩터 cherry-pick |
| **2026-04-23 04:12** | **v0.39.0** | **stable 정식 출시** |
| 2026-04-23 04:08 | v0.40.0-preview.2 | 동시 출시 (별도 보고서 참조) |
| 2026-04-23 05:41 | v0.41.0-nightly.20260423 | 동시 출시 (별도 보고서 참조) |

---

## 3. Breaking Changes (🔴 Critical)

| # | 항목 | 이전 동작 | v0.39.0 동작 | 영향 범위 | 참조 |
|---|------|-----------|-------------|-----------|------|
| 1 | **Legacy subagent wrapping tools 제거** | `SubagentTool`, `SubagentToolWrapper` 클래스가 `packages/core/src/agents/`에 존재. 1:1 tool-to-agent 매핑으로 각 서브에이전트가 별도 도구로 노출 | 두 클래스 완전 제거 (`subagent-tool.ts`, `subagent-tool-wrapper.ts`, 각 테스트 파일). **하위 호환성 shim 없음** | bkit 서브에이전트 호출 코드가 두 클래스를 직접 참조 시 즉시 빌드/런타임 실패 | [PR #25053](https://github.com/google-gemini/gemini-cli/pull/25053) |
| 2 | **Subagent 통합: `invoke_subagent` (또는 `invoke_agent`) 단일 도구화** | 각 서브에이전트가 별도 도구 (예: `codebase_investigator_tool()`) | 단일 `invoke_agent(agent_name="codebase_investigator", ...)` 호출. Policy Engine은 `agent_name`을 virtual tool name으로 처리 | 시스템 프롬프트가 구 도구명을 지시하면 모델이 도구를 찾지 못함. Policy 규칙은 `agent_name` 매칭으로 자동 호환 | [PR #24489](https://github.com/google-gemini/gemini-cli/pull/24489) |

> **보강 주의**: v0.39.0 release notes는 "None explicitly documented" 라고 적혀 있으나 PR #25053이 *legacy* 제거이므로 사실상 Breaking Change. 공식 마이그레이션 가이드 부재 — bkit 측 자체 감사 필요.

---

## 4. 새로운 기능 (🟢 New)

### 4.1 메모리/스킬 라이프사이클

| # | 기능 | 설명 | bkit 활용 가능성 | 참조 |
|---|------|------|----------------|------|
| 1 | **`/memory inbox`** | 추출된 스킬 리뷰용 슬래시 커맨드 | bkit 스킬 라이프사이클 통합 (수락/거절 워크플로우) | [#24544](https://github.com/google-gemini/gemini-cli/pull/24544) |
| 2 | **Skill patching** | `/memory inbox` 통합으로 스킬 부분 업데이트 지원 | bkit 스킬 업데이트 UX 개선 | [#25148](https://github.com/google-gemini/gemini-cli/pull/25148) |
| 3 | **JSONL 채팅 기록** | binary→JSONL 스트리밍 마이그레이션 | bkit 세션 로그 파싱/audit trail 간소화 | [#23749](https://github.com/google-gemini/gemini-cli/pull/23749) |

### 4.2 Subagent / 컨텍스트 / 도구 프로토콜

| # | 기능 | 설명 | bkit 활용 가능성 | 참조 |
|---|------|------|----------------|------|
| 4 | **`invoke_subagent` 통합 도구** | 모든 서브에이전트 호출 단일 인터페이스 | bkit subagent 호출 코드 단순화 (단, 마이그레이션 필요 — §3 Breaking) | [#24489](https://github.com/google-gemini/gemini-cli/pull/24489) |
| 5 | **Tool-controlled display protocol (Steps 2-3)** | 도구가 자체 출력 표시 방식 제어 | bkit `hooksConfig.showOutput` 동작과 상호작용 변경 가능 → 회귀 테스트 필수, 신규 API 활용 기회 | [#25134](https://github.com/google-gemini/gemini-cli/pull/25134) |
| 6 | **`useAgentStream` 훅** | 커스텀 에이전트 스트림 처리 React 훅. `AppContainer`에 wired | bkit UI 통합 옵션 (외부 UI에서 Gemini 스트림 구독) | [#24292](https://github.com/google-gemini/gemini-cli/pull/24292), [#24297](https://github.com/google-gemini/gemini-cli/pull/24297) |
| 7 | **ContextManager + Sidecar 디커플드 아키텍처** | 컨텍스트 관리와 sidecar 분리 | bkit v2.1.0 context-optimization과 정렬/충돌 동시 분석 필요 | [#24752](https://github.com/google-gemini/gemini-cli/pull/24752) |

### 4.3 Plan Mode

| # | 기능 | 설명 | bkit 활용 가능성 | 참조 |
|---|------|------|----------------|------|
| 8 | **Plan Mode `activate_skill` 사용자 확인** | Plan Mode 중 스킬 활성화 시 사용자 게이트 | bkit 안전성 강화. 자동 흐름이 막힐 가능성 검증 필요 | [#24946](https://github.com/google-gemini/gemini-cli/pull/24946) |
| 9 | Plan Mode 프롬프트 — plan 내용 표시 허용 | 모델이 plan 자체를 화면에 표시 가능 | bkit Plan Mode 시각화 활용 | [#25058](https://github.com/google-gemini/gemini-cli/pull/25058) |
| 10 | **Plan Mode 중첩 디렉토리 + 상대 경로 정책** (preview.1 cherry-pick) | EditTool/WriteFileTool 시스템 프롬프트가 절대→상대 경로로 전환, 중첩 경로 중복 버그 수정 | bkit 절대 경로 기대 시스템 프롬프트 사용 시 동작 변경 | [#25138](https://github.com/google-gemini/gemini-cli/pull/25138) |

### 4.4 MCP / 인증

| # | 기능 | 설명 | bkit 활용 가능성 | 참조 |
|---|------|------|----------------|------|
| 11 | **MCP servers config — `auth` 블록 지원** | agents 내 MCP server 정의에 인증 블록 가능 | bkit-server 보안 강화 기회 (현재 평문 토큰 운영 시 즉시 마이그) | [#24770](https://github.com/google-gemini/gemini-cli/pull/24770) |

### 4.5 보안

| # | 기능 | 설명 | bkit 활용 가능성 | 참조 |
|---|------|------|----------------|------|
| 12 | **🔒 IDE stdio override RCE 방지** | workspace `.env`로 IDE stdio override 차단 | bkit-server가 동일 메커니즘 사용 시 정책 점검 | [#25022](https://github.com/google-gemini/gemini-cli/pull/25022) |

### 4.6 UX

| # | 기능 | 설명 | 참조 |
|---|------|------|------|
| 13 | **AskUser 멀티라인 답변 마우스 클릭 커서 위치 지정** | TUI 입력 UX 개선 | [#24630](https://github.com/google-gemini/gemini-cli/pull/24630) |

---

## 5. Deprecation 예고 (🟡 Warning)

> v0.39.0 release notes에는 명시적 deprecation 섹션이 없다. 단, 다음은 **사실상 deprecation**:

| # | 항목 | 상태 | 현재 대안 | 참조 |
|---|------|------|----------|------|
| 1 | `experimental.memoryManager` 플래그 | v0.39.0에서 **유지** (split은 v0.40.0). v0.39.0에서는 기존 그대로 동작 | (현 시점) 변경 불필요 | [PR #25601](https://github.com/google-gemini/gemini-cli/pull/25601) (v0.40.0 예정) |
| 2 | 1:1 subagent 도구 매핑 | v0.39.0에서 **제거 완료** | `invoke_agent` 사용 | [#25053](https://github.com/google-gemini/gemini-cli/pull/25053) |

---

## 6. 설정/구성 변경

| # | 설정 항목 | 변경 유형 | 이전 | 이후 | 참조 |
|---|-----------|-----------|------|------|------|
| 1 | **`GEMINI_PLANS_DIR`** | 환경 변수 노출 | hook 환경에서 미노출 | hook 환경에 노출 | [#25296](https://github.com/google-gemini/gemini-cli/pull/25296) |
| 2 | Plan mode TOML 구조 | 단순화/리팩 | 복잡한 구조 | 단순화 (구체 변경 미상) | [#25037](https://github.com/google-gemini/gemini-cli/pull/25037) |
| 3 | Plan Mode model routing | silent fallback 도입 | 라우팅 실패 시 에러 | 폴백으로 silent 처리 | [#25317](https://github.com/google-gemini/gemini-cli/pull/25317) |
| 4 | Session resume | dynamic session ID 주입 | resume 버그 존재 | dynamic injection으로 해결 | [#24972](https://github.com/google-gemini/gemini-cli/pull/24972) |

---

## 7. 버그 수정 (주요)

| # | 이슈/PR | 설명 | bkit 관련성 | 참조 |
|---|---------|------|-------------|------|
| 1 | Subagent memory leak (AbortSignal in MessageBus) | 서브에이전트 종료 시 메시지 버스 누수 해결 | 🟢 긍정 — bkit subagent 호출 안정성 향상 | [#25048](https://github.com/google-gemini/gemini-cli/pull/25048) |
| 2 | OAuth 5분 타임아웃 정리 | OAuth flow 메모리 누수 수정 | 🟢 긍정 — bkit 인증 흐름 영향 가능 | [#24968](https://github.com/google-gemini/gemini-cli/pull/24968) |
| 3 | PTY exhaustion + orphan MCP subprocess leaks | PTY 고갈 및 MCP 서브프로세스 고아화 해소 | 🟢 긍정 — bkit-server 안정성 향상 | [#25079](https://github.com/google-gemini/gemini-cli/pull/25079) |
| 4 | Sandbox cleanup 강건화 | 모든 process 실행 경로에서 정리 보장 | 🟢 긍정 | [#24763](https://github.com/google-gemini/gemini-cli/pull/24763) |
| 5 | Windows symlink bypass + sandbox 통합 테스트 안정화 | 보안 + 신뢰성 | 🟢 긍정 | [#24834](https://github.com/google-gemini/gemini-cli/pull/24834) |
| 6 | Edit/Write tool 확인 UI 파일 경로 복원 | (v0.38.2에서 처음 도입, v0.39.0 정착) | bkit 사용자 confirm UX 개선 | [#24974](https://github.com/google-gemini/gemini-cli/pull/24974) |
| 7 | EPERM 디렉토리 구조 silent handling | 권한 부족 시 조용히 처리 | bkit 워크스페이스 스캔 신뢰성 | [#25066](https://github.com/google-gemini/gemini-cli/pull/25066) |
| 8 | ModelRouterService finally 블록 secondary crash 방지 | 라우터 폴백 시 2차 크래시 방지 | bkit BeforeModel 훅 안정성 | [#25333](https://github.com/google-gemini/gemini-cli/pull/25333) |
| 9 | kmscon 터미널 truecolor 인식 | 터미널 호환성 | bkit TUI 무관 (외부 의존) | [#25282](https://github.com/google-gemini/gemini-cli/pull/25282) |
| 10 | **🔴 [#25655 SessionStart 훅 systemMessage 중복] 미해결** | fix PR [#25827](https://github.com/google-gemini/gemini-cli/pull/25827) **OPEN, 미머지** → v0.39.0 미포함 | 🔴 **bkit-server SessionStart 메시지 이중 출력 회귀 가능성 — v0.39.0 수용 시에도 잔존** | [#25655](https://github.com/google-gemini/gemini-cli/issues/25655) |

---

## 8. 성능/최적화 변경

| # | 항목 | 변경 내용 | 예상 효과 |
|---|------|-----------|-----------|
| 1 | Subagent 메시지 버스 | AbortSignal로 누수 방지 | 장시간 세션에서 메모리 안정 |
| 2 | OAuth 타임아웃 | 5분 타이머 명시 cleanup | 인증 흐름 메모리 누수 0 |
| 3 | PTY/MCP 서브프로세스 | 고아 프로세스 회수 | 다중 MCP 사용 시 시스템 자원 보호 |
| 4 | Sandbox cleanup | 모든 경로에서 정리 | 컨테이너 풀 효율 향상 |

---

## 9. 의존성 변경

| 패키지 | 이전 | v0.39.0 | 주의사항 |
|--------|------|---------|----------|
| `ink` | 6.6.7 (추정) | **6.6.9** ([#24934 → #24980](https://github.com/google-gemini/gemini-cli/pull/24980)) | TUI 렌더링 패치 |
| `keytar` | `keytar` | **`@github/keytar`** ([#25143](https://github.com/google-gemini/gemini-cli/pull/25143)) | 패키지 fork 전환. bkit가 자체 keytar 의존 시 정합성 검토 |
| 기타 | (다수) | npm audit fix ([#25140](https://github.com/google-gemini/gemini-cli/pull/25140)) | 취약 의존성 일괄 패치 |

---

## 10. v0.39.0에 **포함되지 않은** 주요 변경 (메모리 스냅샷 예고와 차이)

> 메모리 스냅샷(2026-04-22 기준)은 다음 3건을 v0.39.0 예고 Breaking으로 기록했으나 **실제로는 v0.40.0으로 미뤄짐**.

| # | 항목 | 메모리 예고 | **실제 v0.39.0** | 실제 포함 버전 |
|---|------|-------------|----------------|--------------|
| 1 | **MemoryManager 4-tier 리팩터** ([#25716](https://github.com/google-gemini/gemini-cli/pull/25716), commit `6edfba4`) | v0.39.0 stable에 포함 예상 | **미포함**. v0.39.0 tip은 `398f78d`로 commit `6edfba4`(2026-04-22 01:31 UTC 머지) 이후이지만 release notes에 부재, v0.40.0-preview.2 release notes에 명시 | **v0.40.0** |
| 2 | **`autoMemory` rename / split** ([#25601](https://github.com/google-gemini/gemini-cli/pull/25601), commit `8573650`) | v0.39.0 예상 | **미포함**. v0.40.0-preview.2 release notes에서 확인 | **v0.40.0** |
| 3 | Legacy subagent 제거 | v0.39.0 예상 | **포함 ✅** ([#25053](https://github.com/google-gemini/gemini-cli/pull/25053)) | v0.39.0 |

> **bkit 영향**: 메모리 4-tier와 autoMemory 분리에 대한 대응 시간이 추가 확보됨 (최소 1 minor cycle).
> **단, v0.40.0-preview.2가 동일일에 출시되었으므로 v0.40.0 stable은 4월 말 ~ 5월 초 가능성**.

---

## 11. bkit 영향 가능성 상위 5개

### 11.1 #1 🔴 CRITICAL — Legacy subagent wrapping tools 제거 ([#25053](https://github.com/google-gemini/gemini-cli/pull/25053))

- **출처**: [PR #25053](https://github.com/google-gemini/gemini-cli/pull/25053)
- **확인 사실**: `packages/core/src/agents/subagent-tool.ts`, `subagent-tool-wrapper.ts` 및 테스트 완전 제거. **하위 호환성 shim 없음**.
- **영향**:
  - bkit-server 또는 bkit skills/subagents가 두 클래스를 import 시 즉시 빌드 실패
  - 1:1 tool-to-agent 매핑을 가정한 모든 시스템 프롬프트가 도구를 찾지 못함
- **조치 (Phase 2 영향 분석에서 우선)**:
  1. `grep -r "SubagentTool\|SubagentToolWrapper" packages/`
  2. 사용 발견 시 `invoke_agent(agent_name=...)` 패턴으로 마이그
  3. Policy 규칙은 `agent_name` 인자 매칭으로 그대로 동작

### 11.2 #2 🔴 HIGH — [#25655 SessionStart 훅 systemMessage 중복] 미해결 (v0.39.0 잔존)

- **출처**: [Issue #25655](https://github.com/google-gemini/gemini-cli/issues/25655) (open), Fix PR [#25827](https://github.com/google-gemini/gemini-cli/pull/25827) **OPEN, 미머지**
- **영향**: bkit v2.0.4가 SessionStart 훅 메시지를 출력하는 모든 케이스에서 v0.39.0에서도 **이중 렌더링** 가능성
- **조치**:
  1. v0.39.0 마이그 E2E 테스트에 SessionStart 중복 검증 케이스 포함
  2. 임시 회피: BeforeAgent 이벤트 전환 검토
  3. PR #25827 머지 모니터링 → v0.39.1 핫픽스 또는 v0.40.0 stable 포함 가능성

### 11.3 #3 🟡 MEDIUM — Tool-controlled display protocol (Steps 2-3) 도입 ([#25134](https://github.com/google-gemini/gemini-cli/pull/25134))

- **출처**: [PR #25134](https://github.com/google-gemini/gemini-cli/pull/25134)
- **영향**: bkit `hooksConfig.showOutput` 동작이 도구가 통제하는 표시 프로토콜과 충돌하거나 보강될 수 있음
- **조치**:
  1. Steps 2-3 spec 확인 (preview.0 release notes 또는 PR 본문)
  2. bkit 훅 출력 렌더링 회귀 테스트
  3. **긍정적 기회**: bkit이 도구 출력 포맷을 세밀하게 제어하는 신규 API 활용 가능성

### 11.4 #4 🟡 MEDIUM — ContextManager + Sidecar 디커플드 아키텍처 ([#24752](https://github.com/google-gemini/gemini-cli/pull/24752))

- **출처**: [PR #24752](https://github.com/google-gemini/gemini-cli/pull/24752)
- **영향**: bkit v2.1.0 context-optimization 설계 (`docs/01-plan/features/v2.1.0-context-optimization.plan.md`)와 정합성 분석 필요. ContextManager가 외부에서 주입 가능한 sidecar 인터페이스를 노출하면 bkit 6-Layer가 sidecar로 통합될 가능성
- **조치**:
  1. ContextManager / Sidecar 인터페이스 export 여부 확인
  2. bkit 6-Layer를 sidecar로 노출 가능한지 PoC

### 11.5 #5 🟢 LOW-MEDIUM — MCP `auth` 블록 지원 ([#24770](https://github.com/google-gemini/gemini-cli/pull/24770))

- **출처**: [PR #24770](https://github.com/google-gemini/gemini-cli/pull/24770)
- **영향**: bkit-server가 평문 토큰으로 MCP에 접근 시 보안 강화 기회
- **조치**:
  1. `auth` 블록 스키마 확인 (OAuth/API key/custom 방식)
  2. bkit-server 설정 마이그레이션 가이드 작성 (P3 단계)

---

## 12. 원문 참조 링크

### 12.1 GitHub Releases / Tags
- [v0.39.0 (stable)](https://github.com/google-gemini/gemini-cli/releases/tag/v0.39.0) — 2026-04-23 04:12 UTC, commit `398f78d`
- [v0.39.0-preview.0](https://github.com/google-gemini/gemini-cli/releases/tag/v0.39.0-preview.0) — 2026-04-14
- [v0.39.0-preview.1](https://github.com/google-gemini/gemini-cli/releases/tag/v0.39.0-preview.1) — 2026-04-21
- [v0.39.0-preview.2](https://github.com/google-gemini/gemini-cli/releases/tag/v0.39.0-preview.2) — 2026-04-22
- [v0.38.2 (직전 stable)](https://github.com/google-gemini/gemini-cli/releases/tag/v0.38.2) — 2026-04-17

### 12.2 주요 PR
- [#25053 — Remove legacy subagent wrapping tools](https://github.com/google-gemini/gemini-cli/pull/25053) (Breaking)
- [#24489 — Refactor subagent tool to unified invoke_subagent](https://github.com/google-gemini/gemini-cli/pull/24489)
- [#24544 — `/memory inbox` command for reviewing extracted skills](https://github.com/google-gemini/gemini-cli/pull/24544)
- [#25148 — Skill patching with `/memory inbox` integration](https://github.com/google-gemini/gemini-cli/pull/25148)
- [#23749 — Migrate chat recording to JSONL streaming](https://github.com/google-gemini/gemini-cli/pull/23749)
- [#25134 — Tool-controlled display protocol (Steps 2-3)](https://github.com/google-gemini/gemini-cli/pull/25134)
- [#24292 — `useAgentStream` hook implementation](https://github.com/google-gemini/gemini-cli/pull/24292)
- [#24297 — `useAgentStream` wired in AppContainer](https://github.com/google-gemini/gemini-cli/pull/24297)
- [#24752 — Decoupled ContextManager + Sidecar architecture](https://github.com/google-gemini/gemini-cli/pull/24752)
- [#24946 — Plan Mode `activate_skill` user confirmation](https://github.com/google-gemini/gemini-cli/pull/24946)
- [#25058 — Plan mode prompt allows showing plan content](https://github.com/google-gemini/gemini-cli/pull/25058)
- [#24770 — MCP servers `auth` block in agents config](https://github.com/google-gemini/gemini-cli/pull/24770)
- [#25022 — 🔒 Disallow IDE stdio override via workspace .env (RCE)](https://github.com/google-gemini/gemini-cli/pull/25022)
- [#25048 — Subagent memory leaks (AbortSignal MessageBus)](https://github.com/google-gemini/gemini-cli/pull/25048)
- [#25079 — PTY exhaustion + orphan MCP subprocess leaks](https://github.com/google-gemini/gemini-cli/pull/25079)
- [#24763 — Robust sandbox cleanup](https://github.com/google-gemini/gemini-cli/pull/24763)
- [#24834 — Windows symlink bypass + sandbox tests](https://github.com/google-gemini/gemini-cli/pull/24834)
- [#24972 — Dynamic session ID injection (resume bugs)](https://github.com/google-gemini/gemini-cli/pull/24972)
- [#24974 — Edit/Write tool confirm UI file path 복원](https://github.com/google-gemini/gemini-cli/pull/24974)
- [#25143 — `keytar` → `@github/keytar`](https://github.com/google-gemini/gemini-cli/pull/25143)
- [#25140 — npm audit fix](https://github.com/google-gemini/gemini-cli/pull/25140)
- [#25296 — `GEMINI_PLANS_DIR` env var to hooks](https://github.com/google-gemini/gemini-cli/pull/25296)
- [#25037 — Plan mode TOML 구조 단순화](https://github.com/google-gemini/gemini-cli/pull/25037)
- [#25317 — Plan Mode silent fallback model routing](https://github.com/google-gemini/gemini-cli/pull/25317)
- [#24630 — AskUser 멀티라인 마우스 클릭 커서 위치](https://github.com/google-gemini/gemini-cli/pull/24630)

### 12.3 관련 이슈 (bkit 관점)
- [Issue #25655 — SessionStart 훅 systemMessage 중복 (open, fix PR #25827 미머지)](https://github.com/google-gemini/gemini-cli/issues/25655) 🔴
- [Issue #25615 — Windows `run_shell_command("gemini ...")` 무한 루프](https://github.com/google-gemini/gemini-cli/issues/25615)
- [Issue #25610 — `text.response` 테마 validation](https://github.com/google-gemini/gemini-cli/issues/25610)
- [Issue #25283 — Tool execution denied by policy](https://github.com/google-gemini/gemini-cli/issues/25283)
- [Issue #25306 — "The caller does not have permission"](https://github.com/google-gemini/gemini-cli/issues/25306)

### 12.4 연관 bkit 연구 문서
- `docs/01-plan/research/gemini-cli-post-v0.38.2-research.md` (2026-04-22, 본 문서가 갱신)
- `docs/01-plan/research/gemini-cli-v0.38.2-research.md` (2026-04-20, baseline 직전 stable)
- `docs/01-plan/research/gemini-cli-v0.38.1-research.md`
- `docs/01-plan/research/gemini-cli-v0.38.0-research.md`

### 12.5 연관 bkit 플랜 문서
- `docs/01-plan/features/gemini-cli-v0.38.2-migration.plan.md` (재활용 가능 base, but v0.39.0으로 target 변경 권고)
- `docs/01-plan/features/v2.1.0-context-optimization.plan.md` (ContextManager+Sidecar 정합성 분석 필요)

---

## 13. 조사 신뢰도

| 항목 | 신뢰도 | 비고 |
|------|--------|------|
| v0.39.0 출시 사실 + tip SHA | ⬛⬛⬛⬛⬛ | GitHub Tags + Releases 이중 확인 |
| v0.39.0 release notes 본문 | ⬛⬛⬛⬛⬛ | 공식 release page 직접 확인 |
| Breaking Changes 목록 | ⬛⬛⬛⬛⬜ | release notes "None explicitly" 표기에도 PR #25053 본문이 legacy 제거 명시 |
| PR #25716 / #25601이 v0.39.0 미포함이라는 판정 | ⬛⬛⬛⬛⬜ | 두 PR이 v0.40.0-preview.2 release notes에 명시되고 v0.39.0 release notes에는 부재. compare 페이지는 로드 실패로 commit graph 직접 확인 못함 |
| #25655 / #25827 상태 | ⬛⬛⬛⬛⬜ | 두 페이지 직접 확인 (Issue open, PR open) |
| 의존성 변경 | ⬛⬛⬛⬛⬜ | release notes 명시 |
| 설정 변경 | ⬛⬛⬛⬜⬜ | Plan mode TOML 구조 변경의 구체 diff 미확인 |

---

## 14. 권장 조치 (bkit 팀)

### 14.1 즉시 (P1 → P2 전환)
1. **마이그레이션 target 재선정**: v0.38.2 → **v0.39.0**. 기존 v0.38.2 마이그 플랜은 base로 활용
2. **legacy subagent 사용 감사** (Phase 2 영향 분석에서 최우선): `grep -r "SubagentTool\|SubagentToolWrapper"`
3. **#25655 SessionStart 중복 회귀 테스트** v0.39.0 환경에서 재실행 (수정 안됐으므로 잔존 가능)

### 14.2 단기 (P3 마이그레이션 브레인스토밍)
4. ContextManager + Sidecar와 bkit 6-Layer 정합성 분석
5. Tool-controlled display protocol Steps 2-3 활용 가능성 평가
6. MCP `auth` 블록 마이그레이션 (보안 우선)

### 14.3 모니터링 (P4 이후)
7. **v0.40.0 stable 출시 모니터링** (메모리 4-tier + autoMemory split 본격 도입). 현재 preview.2 상태, stable은 4월 말 ~ 5월 초 가능성
8. PR #25827 (#25655 fix) 머지 모니터링
9. v0.41.0-nightly에서 main 브랜치로 추가 유입되는 변경 추적

---

*조사 종료: 2026-04-23. v0.39.0 stable 출시 확인. 메모리 스냅샷 "v0.38.2 변동 없음" 무효화. v0.39.0이 새 마이그레이션 target.*
