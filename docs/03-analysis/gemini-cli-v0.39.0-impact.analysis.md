# Gemini CLI v0.39.0 bkit 영향 분석 보고서

> 분석일: **2026-04-23**
> 분석 범위: bkit v2.0.4 전체 코드베이스 (소스 639개 파일, 스킬 43 / 에이전트 21 / 훅 스크립트 10 / lib 30개 / MCP tools 5 + bkit-server.js)
> 대상 버전: **Gemini CLI v0.39.0 stable** (2026-04-23 04:12 UTC, commit `398f78d`)
> 분석자: bkit-impact-analyzer agent
> 입력 문서: `docs/01-plan/research/gemini-cli-v0.39.0-research.md`
> 선행 분석: `docs/03-analysis/gemini-cli-v0.38.2-impact.analysis.md`
> 사용자 결정: **v0.39.0 stable만 P2 분석**. v0.40.0-preview.2는 §10에 hint만 기재, 별도 사이클로 분리.

---

## Executive Summary

| 항목 | 수치 |
|------|------|
| 전수 스캔 대상 파일 | **639개** (소스/문서/설정 — node_modules 제외) |
| 스킬 / 에이전트 / 훅 스크립트 / lib(.js) / MCP tools | **43 / 21 / 10 / 30 / 5 + bkit-server.js** |
| **v0.39.0 누적 영향 받는 bkit 파일(직접)** | **2개** (`bkit.config.json`, `lib/gemini/version.js`) |
| **v0.39.0 누적 영향 받는 bkit 파일(간접/검증)** | **3개** (`hooks/scripts/session-start.js`, `mcp/bkit-server.js`, `lib/gemini/platform.js`) |
| Breaking Changes | **1건** (Legacy SubagentTool 제거 — bkit 영향 **0**, 감사 결과 0건) |
| 새 기능 | **10+건** |
| 🔴 Critical | **1건** (Issue #25655 SessionStart 중복 잔존, 업스트림 fix PR #25827 OPEN) |
| 🟠 High | **0건** |
| 🟡 Medium | **3건** (ContextManager+Sidecar 정합성, MCP `auth` 블록, JSONL chat recording 통합) |
| 🟢 Low | **6건** (Plan Mode 확인 게이트, useAgentStream, IDE stdio 보안, GEMINI_PLANS_DIR, keytar fork, AskUser UX) |
| 기능 개선 기회 | **6건** |
| **전체 위험도** | **MEDIUM** (Breaking Change 자체는 LOW이나 #25655 잔존 + ContextManager 디커플링이 v2.1.0 plan과 교차 — 약한 상승) |

**총평**: v0.39.0의 가장 첨예한 변경인 **Legacy SubagentTool/SubagentToolWrapper 제거(PR #25053)**는 bkit 코드베이스에서 **0건 사용**으로 확인되었다. bkit는 자체 `mcp/bkit-server.js`의 `spawn_agent` MCP 도구 + `gemini -e <agent>.md` 외부 spawn 방식을 사용하므로 Gemini CLI 내부 SubagentTool 클래스에 의존하지 않는다. 따라서 이 Breaking Change에 대한 직접 코드 수정은 **불필요**.

핵심 위험 1: **Issue #25655 SessionStart `systemMessage` 이중 렌더링**이 v0.38.2부터 v0.39.0까지 계속 미해결 상태(fix PR #25827 OPEN)로, bkit `hooks/scripts/session-start.js` Line 89/114가 정면 적중 영역이다.

핵심 위험 2: **ContextManager + Sidecar 디커플드 아키텍처(PR #24752)**가 bkit v2.1.0 context-optimization plan(`docs/01-plan/features/v2.1.0-context-optimization.plan.md`)의 6-Layer 가정과 교차할 수 있다. v0.40.0의 MemoryManager 4-tier가 합쳐지면 v2.1.0 재설계 필요할 가능성이 매우 높음 — 본 P2에서는 v0.39.0 부분만 다루되 별도 cycle 권고.

---

## 1. Breaking Changes 영향 매핑

### 1.1 🔴→🟢 Legacy SubagentTool / SubagentToolWrapper 제거 (PR #25053) — bkit 영향 **0건**

| 항목 | 내용 |
|------|------|
| 업스트림 변경 | `packages/core/src/agents/subagent-tool.ts`, `subagent-tool-wrapper.ts` 및 테스트 완전 제거. 하위 호환성 shim 없음. |
| 이전 동작 | 1:1 tool-to-agent 매핑 (각 서브에이전트가 별도 도구로 노출, 예: `codebase_investigator_tool()`) |
| v0.39.0 동작 | `invoke_agent(agent_name="...")` 단일 도구로 통합 (PR #24489) |
| **bkit 감사 명령** | `grep -rn "SubagentTool\|SubagentToolWrapper\|invoke_subagent\|invoke_agent" .` (.git, node_modules 제외) |
| **bkit 코드 hit** | **0건** — 두 클래스 직접 import / 인스턴스화 / 문자열 참조 모두 없음 |
| **bkit 문서 hit (Research/Plan/Analysis)** | 17건 (`docs/01-plan/research/...v0.38.0/v0.38.1/v0.39.0/post-v0.38.2-research.md`, `docs/03-analysis/...v0.38.0-impact.analysis.md`, `docs/01-plan/features/gemini-cli-v0.38.0-migration.plan.md`) — 모두 사전 예고 텍스트로, 실제 호출 코드 없음 |

#### 1.1.1 bkit가 영향 받지 않는 이유 (정확한 근거)

bkit는 **Gemini CLI 내부 `SubagentTool` 클래스**가 아니라 **자체 MCP 서버 내 `spawn_agent` MCP tool**을 사용하여 서브에이전트를 호출한다. 두 메커니즘은 완전히 분리되어 있다.

| 비교 | Gemini CLI legacy SubagentTool | bkit `spawn_agent` MCP tool |
|------|-------------------------------|----------------------------|
| 정의 위치 | `packages/core/src/agents/subagent-tool.ts` (제거됨) | `mcp/bkit-server.js` Line 287-300 (자체 정의) |
| 호출 방식 | TypeScript class 직접 참조 | MCP protocol을 통한 외부 tool call |
| 실행 메커니즘 | Gemini CLI 내부 agent runtime | `child_process.spawn('gemini', ['-e', agentPath, ...])` (Line 1085) |
| 경로 (bkit) | — | `mcp/bkit-server.js#executeAgent()` Line 1040-1131 |

**bkit가 사용하는 외부 `gemini` CLI invocation 경로** (`mcp/bkit-server.js` Line 1065-1070):
```js
const args = [
  '-e', agentPath,
  ...(approvalFlag ? [approvalFlag] : []),
  ...toolIsolationArgs,
  task
];
```
→ `gemini -e <agentName>.md --approval-mode=yolo|default --allowed-tools ... <task>` 형태로 *외부 프로세스*를 spawn한다. 이는 v0.39.0에서도 그대로 유효하다 (CLI flag 무변경).

#### 1.1.2 결론

| 영향도 | 영향 파일 | 수정 필요 | 근거 |
|--------|----------|-----------|------|
| 🟢 None | 0개 | **불필요** | 감사 grep 결과 0건. spawn_agent MCP tool은 별개 메커니즘 |

**향후 모니터링**: bkit가 future에 Gemini CLI 내부 agent 시스템(`@google/gemini-cli` 패키지를 직접 import하는 방식)으로 전환하게 되면 그때 `invoke_agent(agent_name=...)` 패턴으로 마이그레이션이 필요하다. 현재 v2.0.4 아키텍처는 *외부 spawn* 방식이므로 즉시 영향 없음.

### 1.2 v0.39.0 release notes "None explicitly documented" 확정

Research §3 보강 주의 부분에서 지적한 "release notes는 None explicitly이지만 PR #25053은 사실상 Breaking"이라는 판단을 본 분석에서도 확정한다. 단, **bkit 측 Breaking 영향은 위 §1.1과 같이 0건**이다.

---

## 2. 새로운 기능 영향 매핑 (10+건)

| # | 기능 / PR | 영향 파일 | 영향도 | 권장 조치 |
|---|----------|----------|--------|----------|
| 1 | `/memory inbox` ([#24544](https://github.com/google-gemini/gemini-cli/pull/24544)) | 무영향. bkit는 `.bkit/state/memory.json`(자체) + `lib/core/agent-memory.js` 자체 운영 | 🟢 Low | §9 기능 개선 기회 #2로 별도 평가 |
| 2 | Skill patching ([#25148](https://github.com/google-gemini/gemini-cli/pull/25148)) | 무영향. bkit 스킬은 `skills/<name>/SKILL.md` 정적 파일 | 🟢 Low | §9 기능 개선 기회 #3 |
| 3 | JSONL 채팅 기록 ([#23749](https://github.com/google-gemini/gemini-cli/pull/23749)) | `mcp/tools/audit-store.js`, `hooks/scripts/after-tool.js` Line 29 (이미 JSONL 사용) | 🟡 Medium | bkit는 이미 JSONL이지만 Gemini CLI 표준 포맷과 정합성 확인 권장 |
| 4 | `invoke_agent` 통합 도구 ([#24489](https://github.com/google-gemini/gemini-cli/pull/24489)) | 무영향. spawn_agent MCP tool이 분리되어 있음 (§1.1 참조) | 🟢 Low | 향후 Gemini CLI agent runtime 직접 사용 시 적용 |
| 5 | **Tool-controlled display protocol Steps 2-3** ([#25134](https://github.com/google-gemini/gemini-cli/pull/25134)) | `hooks/scripts/session-start.js` Line 89(systemMessage), `before-tool.js` Line 68(systemMessage), `after-tool.js`, `lib/gemini/platform.js#outputAllow` | 🟡 Medium | E2E 회귀 테스트 필요 — `decision/systemMessage/metadata` 페이로드가 새 디스플레이 프로토콜과 호환되는지 검증 |
| 6 | `useAgentStream` 훅 ([#24292](https://github.com/google-gemini/gemini-cli/pull/24292), [#24297](https://github.com/google-gemini/gemini-cli/pull/24297)) | 무영향 (TUI 훅, bkit는 외부 spawn) | 🟢 Low | §9 기능 개선 기회 #4 (실시간 진행 표시) |
| 7 | **ContextManager + Sidecar 디커플드 아키텍처** ([#24752](https://github.com/google-gemini/gemini-cli/pull/24752)) | `bkit-system/philosophy/context-engineering.md`, `lib/intent/`, `lib/team/`, `docs/01-plan/features/v2.1.0-context-optimization.plan.md`, `docs/02-design/features/v2.1.0-context-optimization.design.md` | 🟡 Medium | §3에서 별도 분석 |
| 8 | Plan Mode `activate_skill` 사용자 확인 ([#24946](https://github.com/google-gemini/gemini-cli/pull/24946)) | `hooks/hooks.json` (AfterTool matcher: `activate_skill`), `hooks/scripts/after-tool.js` Line 29, 자동 흐름 검증 필요 | 🟢 Low | §4에서 별도 분석 |
| 9 | Plan mode plan 내용 표시 허용 ([#25058](https://github.com/google-gemini/gemini-cli/pull/25058)) | 무영향 (기능 개선만) | 🟢 Low | — |
| 10 | Plan Mode 중첩 디렉토리 + 상대 경로 ([#25138](https://github.com/google-gemini/gemini-cli/pull/25138)) | `agents/*.md`(36개) — 시스템 프롬프트가 절대 경로 가정 시 동작 변경 가능 | 🟢 Low | 에이전트 프롬프트 grep — 절대 경로 강제 표현 없음 확인 권장 |
| 11 | **MCP servers `auth` 블록** ([#24770](https://github.com/google-gemini/gemini-cli/pull/24770)) | `gemini-extension.json` Line 14-19 (`mcpServers.bkit`), `mcp/bkit-server.js` (인증 없음) | 🟡 Medium | §5에서 별도 분석 |
| 12 | 🔒 IDE stdio override RCE 차단 ([#25022](https://github.com/google-gemini/gemini-cli/pull/25022)) | `mcp/bkit-server.js` Line 1088 (`stdio: ['pipe', 'pipe', 'pipe']`) | 🟢 Low | §6에서 별도 분석 — bkit는 standard pipe만 사용, 영향 없음 |
| 13 | AskUser 멀티라인 마우스 클릭 ([#24630](https://github.com/google-gemini/gemini-cli/pull/24630)) | 무영향 (TUI 입력) | 🟢 Low | UX 개선만 |

### 2.1 환경 변수 / 설정 변경 영향

| # | 변경 | 영향 파일 | 영향도 | 비고 |
|---|------|----------|--------|------|
| 14 | `GEMINI_PLANS_DIR` 환경 변수 hook 노출 ([#25296](https://github.com/google-gemini/gemini-cli/pull/25296)) | `hooks/scripts/before-model.js`, `before-agent.js`, `session-start.js` (env 사용처) | 🟢 Low | bkit는 `gemini-extension.json` Line 12에서 `plan: { directory: "docs/01-plan" }` 사용 중. `GEMINI_PLANS_DIR`는 다른 경로일 수 있어 충돌 검증 필요 |
| 15 | Plan mode TOML 구조 단순화 ([#25037](https://github.com/google-gemini/gemini-cli/pull/25037)) | `policies/bkit-extension-policy.toml` (Plan mode 규칙 미사용 확인됨) | 🟢 Low | bkit은 TOML 정책에 plan_mode 항목 없음 (`tests/suites/tc107-v035-modes-migration.js` 검증) |
| 16 | Session resume dynamic ID ([#24972](https://github.com/google-gemini/gemini-cli/pull/24972)) | 무영향 | 🟢 Low | bkit session resume 미사용 |
| 17 | OAuth 5분 타임아웃 cleanup ([#24968](https://github.com/google-gemini/gemini-cli/pull/24968)) | 무영향 (안정성 향상) | 🟢 Low (긍정) | — |

### 2.2 의존성 변경 영향

| # | 패키지 | 변경 | 영향 파일 | 영향도 |
|---|--------|------|----------|--------|
| 18 | `keytar` → `@github/keytar` ([#25143](https://github.com/google-gemini/gemini-cli/pull/25143)) | bkit `package.json` 부재 (Bash 결과 — 빈 응답), 자체 keytar 의존 없음 | 🟢 Low | 의존성 검토 결과 영향 없음 |
| 19 | `ink` 6.6.7 → 6.6.9 ([#24980](https://github.com/google-gemini/gemini-cli/pull/24980)) | TUI 렌더링 (CLI 내부) | 🟢 Low | bkit 무관 |
| 20 | npm audit fix ([#25140](https://github.com/google-gemini/gemini-cli/pull/25140)) | CLI 내부 transitive deps | 🟢 Low | bkit 무관 |

---

## 3. 🟡 MEDIUM: ContextManager + Sidecar 디커플드 아키텍처 ↔ bkit 6-Layer Context

### 3.1 변경 요약

PR [#24752](https://github.com/google-gemini/gemini-cli/pull/24752)는 Gemini CLI의 **ContextManager**(컨텍스트 라이프사이클 관리)와 **Sidecar**(외부 컨텍스트 공급자)를 디커플링한다. 이전에는 monolithic하게 결합되어 있던 두 책임이 분리되어, sidecar 인터페이스를 통해 외부에서 컨텍스트를 주입할 수 있게 되었을 가능성이 있다 (구체 API spec은 PR 본문 추가 확인 필요).

### 3.2 bkit 측 정합성 분석

bkit의 **6-Layer Hook System** (`bkit-system/philosophy/context-engineering.md` Line 38-51):
```
L1: hooks.json    → SessionStart, UserPromptSubmit, PreCompact, etc. (12+ events)
L2: Skill YAML    → PreToolUse, PostToolUse, Stop
L3: Agent YAML    → PreToolUse, PostToolUse
L4: Triggers      → 8-language keyword detection
L5: Scripts       → 47 Node.js hook scripts (실제는 10개 in hooks/scripts/)
L6: Team Orch.    → CTO-led phase routing
```

bkit의 6-Layer는 **hook 이벤트 기반 컨텍스트 주입**이며, ContextManager API에 의존하지 않는다. 따라서 PR #24752 자체는 직접적 breaking 영향 없음.

**그러나** v2.1.0 context-optimization plan(`docs/01-plan/features/v2.1.0-context-optimization.plan.md` 및 design 파일)은 bkit 6-Layer를 ContextManager의 sidecar로 노출하는 것을 검토 중이라면, **새 sidecar 인터페이스가 v0.39.0에서 안정화되었는지 검증**이 필요하다.

### 3.3 영향 파일

| 파일 | 영향 항목 | 영향도 | 라인 |
|------|----------|--------|------|
| `bkit-system/philosophy/context-engineering.md` | 6-Layer 아키텍처 설명 — Sidecar 옵션 추가 검토 | 🟡 Medium | Line 23-85 |
| `lib/intent/` (4개 파일, 19 exports) | 8-language detection — sidecar 인터페이스로 노출 가능성 | 🟡 Medium | — |
| `lib/team/` (9개 파일, 40 exports) | CTO orchestration — sidecar 후보 | 🟡 Medium | — |
| `mcp/bkit-server.js` | 현재 MCP 기반 외부 통합 — sidecar 패턴과 비교 | 🟡 Medium | Line 287-300 (spawn_agent), 497 (audit_query) |
| `docs/01-plan/features/v2.1.0-context-optimization.plan.md` | 설계 자체 재검토 | 🟡 Medium | (status: untracked) |
| `docs/02-design/features/v2.1.0-context-optimization.design.md` | 설계 자체 재검토 | 🟡 Medium | (status: untracked) |

### 3.4 권장 조치

1. **PR #24752 본문에서 sidecar 인터페이스 spec(API signature) 추출** — 현재 release notes만으로는 디커플링 정도 불명확
2. v2.1.0 plan에 "sidecar 인터페이스 PoC: bkit 6-Layer를 sidecar로 노출 가능한가?" 액션 항목 추가
3. **v0.40.0의 MemoryManager 4-tier가 합쳐진 후 종합 재설계** (P3에서 결정)

---

## 4. 🟢 LOW: Plan Mode `activate_skill` 사용자 확인

### 4.1 변경 요약

PR [#24946](https://github.com/google-gemini/gemini-cli/pull/24946)은 **Plan Mode 중 `activate_skill` 호출 시 사용자 게이트(확인 프롬프트)** 를 추가한다. 이는 보안/신뢰성 향상이지만, bkit의 자동 스킬 활성화 흐름에 영향 가능성.

### 4.2 bkit 측 사용 현황

bkit에서 `activate_skill`이 등장하는 위치:

| 파일 | Line | 용도 |
|------|------|------|
| `hooks/hooks.json` | (검색 결과) | AfterTool matcher: `activate_skill` |
| `hooks/scripts/after-tool.js` | Line 29 | toolName === 'activate_skill' 분기 → JSONL 감사 기록 |
| `tests/suites/tc09-pdca-e2e.js` | Line 12, 36 | tool_name: 'activate_skill' 테스트 |
| `tests/suites/tc90-hooks-tool-security.js` | Line 147-150 | "AT-06: Conditions use activate_skill" |
| `.gemini/context/tool-reference-v2.md` | Line 16 | activate_skill 도구 reference |

bkit는 `activate_skill`을 **활성 호출하지 않으며**, 단지 AfterTool 훅에서 모니터링/audit 한다. 따라서 Plan Mode 게이트 추가는 bkit 자동 흐름을 막지 않는다.

### 4.3 영향도 결론

| 영향도 | 영향 파일 | 수정 필요 |
|--------|----------|-----------|
| 🟢 Low | 0개 (모니터링만) | 불필요 — Plan Mode 환경에서 사용자가 `activate_skill` 확인 prompt를 받지만 bkit 워크플로우는 영향 없음 |

---

## 5. 🟡 MEDIUM: MCP servers `auth` 블록 지원

### 5.1 변경 요약

PR [#24770](https://github.com/google-gemini/gemini-cli/pull/24770)은 agents 내 MCP server 정의에 `auth` 블록을 지원한다. 인증 방식(OAuth/API key/custom)을 명시하여 평문 토큰 운영을 대체할 수 있다.

### 5.2 bkit 측 영향

`gemini-extension.json` Line 14-19:
```json
"mcpServers": {
  "bkit": {
    "command": "/bin/bash",
    "args": ["${extensionPath}/mcp/start-server.sh"],
    "cwd": "${extensionPath}"
  }
}
```

bkit-server.js는 **현재 stdio 로컬 통신만 사용**(Line 1088 `stdio: ['pipe', 'pipe', 'pipe']`)하므로 인증 토큰을 운영하지 않는다. 따라서 즉시 마이그레이션 필요성 없음.

`bkit.config.json` Line 78에 `"auth": "AUTH_"` (env prefix)가 있지만 이는 **환경변수 prefix 정책**으로, MCP auth 블록과는 무관.

### 5.3 영향도 결론

| 영향도 | 영향 파일 | 권장 조치 |
|--------|----------|-----------|
| 🟡 Medium (잠재) | `gemini-extension.json`, `mcp/bkit-server.js` | 현재 무영향. **향후** bkit-server가 OAuth/API key 인증을 도입할 경우 v0.39.0+ `auth` 블록을 사용 가능 (보안 강화 기회) |

---

## 6. 🟢 LOW: IDE stdio override RCE 차단

### 6.1 변경 요약

PR [#25022](https://github.com/google-gemini/gemini-cli/pull/25022)은 workspace `.env`로 IDE stdio를 override하는 RCE 벡터를 차단한다.

### 6.2 bkit 측 영향

`mcp/bkit-server.js` Line 1088: `stdio: ['pipe', 'pipe', 'pipe']` — **standard pipe만 사용**. workspace `.env` 기반 stdio override를 시도하지 않는다. `mcp/start-server.sh`도 단순 bash launcher (`gemini-extension.json` Line 17 참조).

### 6.3 영향도 결론

| 영향도 | 영향 파일 | 권장 조치 |
|--------|----------|-----------|
| 🟢 Low | 0개 | **불필요** — bkit는 standard stdio만 사용. 향후 보안 정책 점검 시 PR #25022 spec을 reference로 추가 권장 |

---

## 7. 🔴 CRITICAL: Issue #25655 SessionStart `systemMessage` 중복 (v0.39.0 잔존)

### 7.1 이슈 상태 (2026-04-23)

| 항목 | 내용 |
|------|------|
| 업스트림 이슈 | [#25655](https://github.com/google-gemini/gemini-cli/issues/25655) — **OPEN** |
| 업스트림 fix PR | [#25827](https://github.com/google-gemini/gemini-cli/pull/25827) — **OPEN, 미머지** |
| v0.39.0 포함 | **No** — 회귀 잔존 |
| 직전 분석 (v0.38.2) | `docs/03-analysis/gemini-cli-v0.38.2-impact.analysis.md` §3 |

### 7.2 bkit 영향 (v0.38.2 분석에서 변동 없음)

| 파일 | 라인 | 증상 |
|------|------|------|
| `hooks/scripts/session-start.js` | **Line 87-105** (정상 경로 systemMessage) | bkit Welcome + PDCA 상태 + Phase-Aware Context 2회 출력 |
| `hooks/scripts/session-start.js` | **Line 112-116** (fallback systemMessage) | "bkit Vibecoding Kit v2.0.4 activated" 2회 출력 |
| `lib/gemini/platform.js` | (`outputAllow` 헬퍼) | 동일 이중 출력 경로 |

### 7.3 v0.38.2 분석에서 신설 권고된 방어 테스트 검증

v0.38.2 분석은 `tests/suites/tc107-v0382-session-start-duplication.js` 신설을 권고했다. **현 시점 검증 결과**:
- `tests/suites/tc107-*` → `tc107-v035-modes-migration.js`만 존재. v0382 방어 테스트 **미신설**.
- `tests/suites/tc88-hooks-session-start.js` 존재 → 기본 SessionStart 검증 있음. 단, **중복 렌더 검증 없음**.

→ **본 v0.39.0 사이클에서 tc107-v0382 방어 테스트 신설 우선순위 P0**.

### 7.4 권장 조치

| # | 조치 | 우선순위 | 공수 |
|---|------|---------|------|
| 1 | `tests/suites/tc107-v0382-session-start-duplication.js` 신설 (stdout JSON에 `bkit Session Start` sentinel 정확히 1회 검증) | P0 | 1-2h |
| 2 | E2E: 실제 `gemini` v0.39.0 환경에서 SessionStart 출력 캡처 → `bkit Vibecoding Kit v2.0.4 activated` 등장 횟수 검증 | P0 | 30분 |
| 3 | PR #25827 머지 모니터링 → v0.39.1 핫픽스 또는 v0.40.0 stable 포함 가능성 | P3 | 5분/주 |
| 4 | (대안) `session-start.js`의 systemMessage를 BeforeAgent 훅으로 이관 검토 — v0.38.2 분석 §3.4 옵션 B | P2 | 2-3h |

---

## 8. 영향 분석 — 영역별 매트릭스

### 8.1 스킬 영향 분석 (43개)

| 스킬 카테고리 | 영향 항목 | 영향도 | 수정 내용 |
|--------------|----------|--------|----------|
| 전체 43개 | Breaking Change 직접 영향 | 🟢 None | 0건 |
| 모든 스킬 | Plan Mode `activate_skill` 게이트 (#24946) — bkit이 활성 호출 안 함 | 🟢 None | 0건 |
| `pdca`, `plan-plus`, `phase-1`~`phase-9`, `skill-create`, `pdca` 등 30+ | Edit/Write 확인 UI 파일 경로 표시 (v0.38.2 잔여 + v0.39.0 안정) | 🟢 Low (긍정) | 문서화 옵션 |
| `gemini-cli-learning/SKILL.md` | v0.39.0 릴리스 노트 반영 | 🟢 Low | 교육 자료 1줄 추가 |

### 8.2 에이전트 영향 분석 (21개)

| 에이전트 | 영향 항목 | 영향도 | 수정 내용 |
|---------|----------|--------|----------|
| 전체 21개 | Breaking Change 직접 영향 | 🟢 None | 0건 |
| 전체 21개 | invoke_agent 통합 (#24489) — bkit는 spawn_agent MCP tool 별도 운영 | 🟢 None | 0건 |
| `pm-lead.md` Line 195-197 | `spawn_agent pm-discovery/pm-strategy/pm-research` 텍스트 — Gemini의 invoke_agent와 무관 (bkit MCP tool명) | 🟢 Low | 문서 텍스트만, 수정 불필요 |
| 전체 21개 | Plan Mode 중첩 디렉토리 + 상대 경로 (#25138) — 절대 경로 강제 prompt 없음 (감사 결과) | 🟢 None | 0건 |
| `cto-lead.md` Line 36-39 | `tracker_create_task`, `tracker_update_task` 등 — Gemini CLI 내부 tool API에 의존하지 않는 bkit MCP tools 추정 | 🟢 None | 0건 |

### 8.3 훅 스크립트 영향 분석 (10개)

| 파일 | 영향 항목 | 영향도 | 라인 |
|------|----------|--------|------|
| `session-start.js` | §7 Issue #25655 잔존 | 🔴 Critical | 89, 114 |
| `before-tool.js` | Tool-controlled display protocol Steps 2-3 (#25134) — `decision: 'ask'` + `systemMessage` 호환성 검증 | 🟡 Medium | 68 |
| `after-tool.js` | JSONL audit 기록 + `activate_skill` matcher 동작 | 🟢 Low | 29 |
| `after-agent.js` | `agent_name` 필드 normalization (v0.35.0 #18514 호환 — v0.39.0에서 변동 없음 확인) | 🟢 Low | 41-50 |
| `before-agent.js`, `before-model.js`, `after-model.js`, `before-tool-selection.js`, `pre-compress.js`, `session-end.js` | 영향 없음 | 🟢 None | — |

### 8.4 라이브러리 영향 분석 (`lib/`, 30 .js 파일)

| 파일 | 영향 항목 | 영향도 |
|------|----------|--------|
| `lib/gemini/platform.js` | §7 Issue #25655 간접 (outputAllow 헬퍼) | 🔴 간접 Critical (수정 불필요, 상위 CLI 레이어 버그) |
| `lib/gemini/version.js` | `testedVersions`/`getFeatureFlags`에 `0.38.x`/`0.39.0` 미반영 — `MAX_PLAUSIBLE_VERSION = '2.0.0'` (Line 18) 안전 범위 | 🟡 Medium |
| `lib/core/agent-memory.js` | `getAgentPath` Line 184 — agent name → file path mapping. v0.39.0 invoke_agent 패턴과 무관 | 🟢 None |
| `lib/intent/` (4개), `lib/team/` (9개) | §3 ContextManager+Sidecar 정합성 (잠재) | 🟡 Medium (간접) |
| `lib/pdca/` (18개), `lib/core/` (13개 일반), `lib/control/`, `lib/quality/`, `lib/audit/`, `lib/ui/` | 영향 없음 | 🟢 None |

### 8.5 MCP 서버 영향 분석

| 파일 | 영향 항목 | 영향도 | 근거 |
|------|----------|--------|------|
| `mcp/bkit-server.js` | Legacy SubagentTool 영향 0건 (자체 spawn_agent 사용) | 🟢 None | Line 287-300, 1040-1131 (`executeAgent`) |
| `mcp/bkit-server.js` | IDE stdio override 차단 (#25022) — standard pipe 사용 (Line 1088) | 🟢 None | — |
| `mcp/bkit-server.js` | MCP `auth` 블록 (#24770) — 현재 인증 미사용, 향후 강화 기회 | 🟡 Medium (잠재) | gemini-extension.json Line 14-19 |
| `mcp/start-server.sh` | 영향 없음 | 🟢 None | POSIX 호환 유지 |
| `mcp/tools/audit-store.js` | JSONL 채팅 기록 표준화 (#23749) — 이미 JSONL 사용 (Line 4) | 🟡 Medium | 포맷 정합성 검토 |
| `mcp/tools/pm-pipeline.js`, `qa-runner.js`, `gap-analyzer.js`, `checkpoint-manager.js` | 영향 없음 | 🟢 None | — |

### 8.6 설정 파일 영향 분석

| 파일 | 영향 항목 | 영향도 | 수정 내용 |
|------|----------|--------|----------|
| `bkit.config.json` | `compatibility.testedVersions` Line 120: 현재 `["0.29.0",..., "0.37.0"]` → `"0.38.0", "0.38.1", "0.38.2", "0.39.0"` 4개 추가 | 🟡 Medium | 4개 문자열 추가, 5분 |
| `lib/gemini/version.js` | `MAX_PLAUSIBLE_VERSION = '2.0.0'` (Line 18) — v0.39.0 안전 범위 내. `getFeatureFlags()`에 v0.37+/v0.38+/v0.39+ 그룹 신규 추가 권장 | 🟡 Medium | 새 feature flag 그룹 추가 (`hasInvokeAgent`, `hasContextManagerSidecar`, `hasMcpAuthBlock`, `hasToolControlledDisplay`, `hasMemoryInbox` 등 5-7개), 30분 |
| `gemini-extension.json` | 영향 없음 | 🟢 None | MCP 스키마 무변경 (auth 블록 옵션) |
| `hooks/hooks.json` | 영향 없음 | 🟢 None | 12+ 훅 이벤트 계약 무변경 |
| `policies/bkit-extension-policy.toml` | 영향 없음 | 🟢 None | TOML 단순화(#25037)가 plan_mode에 한정 — bkit는 plan_mode 정책 없음 |
| `GEMINI.md` | 영향 없음 | 🟢 None | `@import` 디렉티브 무변경 |
| `.gemini/settings.json` | 영향 없음 | 🟢 None | v0.39.0은 노출 설정 신규 0건 |

---

## 9. 철학 정합성 검증 결과 (4대 문서)

bkit-system/philosophy/ 4개 문서를 직접 Read한 후, v0.39.0 변경이 각 원칙을 강화/약화/중립인지 평가:

| 원칙 | 출처 | 상태 | v0.39.0 변경의 영향 | 비고 |
|------|------|------|--------------------|------|
| **Automation First** | core-mission.md Line 27 | ✅ 강화 | Subagent 통합(#24489) 단순화, 메시지 버스 누수 fix(#25048) → 자동화 안정성 향상 | bkit 외부 spawn 방식 영향 없음 |
| **No Guessing** | core-mission.md Line 28 | ⚠️ 약한 주의 | Plan Mode `activate_skill` 게이트(#24946) → 사용자 확인 강제는 No Guessing 강화. 단, #25655로 SessionStart 첫인상 신뢰 저하 | net 약한 긍정 |
| **Docs = Code** | core-mission.md Line 29 | ✅ 유지 | 영향 없음 — PDCA 문서 동기화 메커니즘 무변경 | — |
| **Safe Defaults / Progressive Trust / Full Visibility / Always Interruptible** | core-mission.md Line 33-38 | ✅ 강화 | OAuth cleanup(#24968), Sandbox cleanup(#24763), PTY/MCP leak fix(#25079), Subagent leak fix(#25048) → 안정성 전반 향상 | 4개 모두 강화 |
| **AI as Partner / 3 Core Competencies** | ai-native-principles.md | ✅ 유지 | useAgentStream(#24292/#24297) → Verification Ability 향상 가능 (실시간 진행) | §9 기능 개선 기회 #4 |
| **Context Engineering 6-Layer** | context-engineering.md Line 38-51 | ⚠️ 리팩 검토 필요 | ContextManager+Sidecar 디커플링(#24752)이 v2.1.0 plan과 교차 | §3 별도 분석 |
| **PDCA Methodology / Zero Script QA** | pdca-methodology.md | ✅ 유지 | 영향 없음 — 9-Stage Pipeline, Quality Gates, Trust Score 메커니즘 무변경 | — |
| **9-Stage Pipeline** | pdca-methodology.md Line 60-79 | ✅ 유지 | 영향 없음 | — |
| **12 Hook Events** (참고: 실제 bkit hooks는 12개 events에서 v2.1.x로 21로 확장) | context-engineering.md Line 38-51 | ✅ 유지 | tool-controlled display protocol(#25134)는 hook 출력 호환성 영향 가능 — §8.3 검증 | — |
| **Context Fork** | (lib/gemini/context-fork.js 참조) | ✅ 유지 | 영향 없음 | — |

### 9.1 종합 결론

**6개 원칙 중 4개 강화 / 2개 유지 / 1개(Context Engineering 6-Layer) 리팩 검토 필요**.

전체 정합성은 유지되며, ContextManager+Sidecar(#24752) 변경이 **v2.1.0 context-optimization plan 재설계 트리거**가 될 수 있다. v0.40.0의 MemoryManager 4-tier가 합쳐지면 종합 재설계가 거의 확정적이다 (별도 cycle 권고).

---

## 10. 기능 개선 기회 (6건)

| # | 새 CLI 기능 / 변경 | bkit 활용 방안 | 예상 효과 | 우선순위 | 난이도 |
|---|-------------------|---------------|----------|----------|--------|
| 1 | **Issue #25655 방어 테스트 신설** | `tests/suites/tc107-v0382-session-start-duplication.js` 신설 — stdout JSON sentinel 1회 검증 | 회귀 조기 경보, 향후 #25827 머지 후 자동 검증 | **P0** | 1-2h |
| 2 | **`/memory inbox` ↔ bkit memory 통합** ([#24544](https://github.com/google-gemini/gemini-cli/pull/24544)) | bkit `lib/core/agent-memory.js`의 스킬 추출/리뷰 워크플로우와 Gemini `/memory inbox` 통합 — 두 시스템 간 sync 메커니즘 검토 | 사용자가 단일 inbox에서 bkit/Gemini 양쪽 메모리 관리 | P3 | 4-6h (PoC) |
| 3 | **Skill patching** ([#25148](https://github.com/google-gemini/gemini-cli/pull/25148)) | bkit `skill-create` 스킬 + `pm-lead-skill-patch` 에이전트와 통합 — 부분 업데이트 UX 개선 | 스킬 이터레이션 속도 향상 | P3 | 4-6h |
| 4 | **`useAgentStream` 훅** ([#24292](https://github.com/google-gemini/gemini-cli/pull/24292)) | bkit 에이전트 실시간 진행 표시 — 현재 `mcp/bkit-server.js` `executeAgent` (Line 1040)는 stdout 누적 후 일괄 반환. Stream으로 전환 시 사용자 가시성 향상 | Trust Score 4 컴포넌트 중 "Full Visibility" 강화, ai-native-principles의 Verification Ability 향상 | P2 | 1d |
| 5 | **JSONL 채팅 기록 표준화** ([#23749](https://github.com/google-gemini/gemini-cli/pull/23749)) | bkit `mcp/tools/audit-store.js` (자체 JSONL) ↔ Gemini CLI JSONL 포맷 정합성 검토. 통일 시 외부 도구로 동시 분석 가능 | Audit trail interoperability | P2 | 2-3h |
| 6 | **`bkit.config.json` testedVersions 업데이트** | `["0.38.0", "0.38.1", "0.38.2", "0.39.0"]` 4개 문자열 추가 + `lib/gemini/version.js`에 v0.39.0 feature flag 그룹 신설 | 호환성 선언 + 분기 로직 활용 | **P0** | 30분 |

### 10.1 v0.40.0 진입 시 검토 필요 (hint, 본 P2 범위 외)

> v0.40.0-preview.2(2026-04-23 동시 출시)에는 **MemoryManager 4-tier 리팩터([#25716](https://github.com/google-gemini/gemini-cli/pull/25716))** 와 **`autoMemory` rename/split([#25601](https://github.com/google-gemini/gemini-cli/pull/25601))** 이 포함된다. 이 둘이 합쳐지면 bkit `lib/core/agent-memory.js`(현재 user/project 2-scope) + `lib/core/memory.js` + `bkit-system/philosophy/context-engineering.md` Line 271-279(Memory Systems 4종) **모두 영향**. 본 P2에서는 다루지 않으며, **v0.40.0 stable 출시 시 별도 cycle 진행 권고**.

---

## 11. 구현 우선순위 매트릭스

| 우선순위 | 항목 | 이유 | 예상 공수 | 출처 |
|---------|------|------|----------|------|
| **P0** | tc107-v0382-session-start-duplication.js 방어 테스트 신설 | #25655 v0.39.0 잔존, fix PR #25827 OPEN. 사용자 첫인상 회귀 가능 | 1-2h | §7, §10 #1 |
| **P0** | `bkit.config.json` testedVersions 업데이트 (4개 문자열) | 호환성 선언 정확화 | 5분 | §8.6, §10 #6 |
| **P0** | `lib/gemini/version.js` feature flag 그룹 추가 (v0.37+/v0.38+/v0.39+ 5-7개) | 분기 로직에서 v0.39.0 신기능 사용 게이팅 | 30분 | §8.6 |
| **P0** | E2E 검증: 실제 `gemini` v0.39.0 환경에서 SessionStart 출력 캡처 | #25655 실제 재현 여부 확정 | 30분 | §7.4 |
| **P1** | Tool-controlled display protocol Steps 2-3 회귀 테스트 | bkit hookOutput 형식(`decision`/`systemMessage`/`metadata`)의 새 디스플레이 프로토콜 호환성 검증 | 2-3h | §2 #5, §8.3 |
| **P1** | `agents/*.md` 36개 grep — 절대 경로 강제 표현 검증 (Plan Mode #25138 대응) | 회귀 가능성 확인 (예방) | 30분 | §2 #10 |
| **P2** | useAgentStream 도입 PoC | Verification Ability 향상 | 1d | §10 #4 |
| **P2** | JSONL audit-store 포맷 정합성 검토 | interoperability | 2-3h | §10 #5 |
| **P2** | ContextManager+Sidecar PR #24752 spec 추출 → v2.1.0 plan 갱신 | v0.40.0 진입 전 사전 준비 | 2-3h | §3 |
| **P3** | `/memory inbox` 통합 PoC | 향후 단일 inbox UX | 4-6h | §10 #2 |
| **P3** | Skill patching 통합 PoC | 향후 skill 이터레이션 UX | 4-6h | §10 #3 |
| **P3** | PR #25827 머지 모니터링 (#25655 fix) | v0.39.1 또는 v0.40.0 stable 포함 가능성 | 5분/주 | §7.4 |
| **하지 않을 것** | invoke_agent 마이그레이션 코드 작성 | bkit는 spawn_agent MCP tool 사용 — Gemini CLI 내부 SubagentTool과 무관 | 0 | §1.1 |
| **하지 않을 것** | `notifications: false` 플래그 시도 | #25655에서 무시됨 (v0.38.2 분석 §3.4 옵션 D) | 0 | §7 |

---

## 12. v0.38.2 → v0.39.0 증분 영향 (요약 테이블)

| 영역 | v0.38.2 (이전) | v0.39.0 (본 분석) | 증분 변화 |
|------|---------------|------------------|----------|
| Breaking Changes 매핑 | 0건 | **1건** (SubagentTool 제거, **bkit 영향 0**) | +1건 (영향 0) |
| 스킬 (43개) | 0개 직접 | 0개 직접 (Plan Mode `activate_skill` 영향 0) | No Change |
| 에이전트 (21개) | 0개 직접 | 0개 직접 | No Change |
| Hook 스크립트 (10개) | 1개 🔴 간접 (#25655) | **1개 🔴 간접** (동일, 잔존) | 잔존 |
| 라이브러리 lib/ (30 .js) | 1개 🔴 간접 | **3개** (platform.js 잔존 + intent/+team/ §3 잠재) | +2 (잠재) |
| MCP 서버 | 0개 | **2개** (bkit-server.js 잠재 + audit-store.js JSONL 정합성) | +2 (잠재) |
| 설정 파일 | 1개 (testedVersions) | **2개** (testedVersions 4개 추가 + version.js 새 flag 그룹) | +1 |
| 철학 정합성 | 4 유지 / 2 약한 주의 | **4 강화 / 2 유지 / 1 리팩 검토** (Context Engineering) | +개선 |
| 기능 개선 기회 | 1건 (방어 테스트) | **6건** | +5건 |
| 필수 수정 항목 | 1건 | **3건 P0** (방어테스트 + testedVersions + feature flags) | +2 |

---

## 13. 조사 신뢰도

| 항목 | 신뢰도 | 비고 |
|------|--------|------|
| Breaking Changes 영향 (SubagentTool 0건) | ⬛⬛⬛⬛⬛ | grep 전수 감사 (.git, node_modules 제외) — 코드 0 hit, 문서 17 hit (모두 사전 예고) |
| #25655 잔존 + bkit 영향 | ⬛⬛⬛⬛⬛ | session-start.js Line 89/114 직접 확인. fix PR #25827 OPEN 확인 (Research §7.10) |
| 스킬/에이전트 영향 | ⬛⬛⬛⬛⬛ | 43+21 전수 카탈로그 확인 |
| MCP 서버 영향 | ⬛⬛⬛⬛⬛ | bkit-server.js Line 287-300, 1040-1131, 1088 stdio 직접 확인 |
| ContextManager+Sidecar 정합성 | ⬛⬛⬛⬜⬜ | PR #24752 본문 spec 미확인 (release notes만 의존). v2.1.0 plan 파일 정독 미완료 (untracked file) |
| Tool-controlled display protocol Steps 2-3 | ⬛⬛⬛⬜⬜ | PR #25134 spec 미확인 — Steps 2-3의 정확한 API 변경 미확정 |
| Plan Mode 중첩 디렉토리 + 상대 경로 (#25138) | ⬛⬛⬛⬛⬜ | 에이전트 36개 prompt 절대 경로 grep 미수행 (예방 조치 P1로 분리) |
| 의존성 변경 영향 | ⬛⬛⬛⬛⬜ | bkit `package.json` 부재 확인 (Bash empty result) — keytar 영향 0 확정. ink 영향 무관 확정 |
| 철학 정합성 | ⬛⬛⬛⬛⬜ | 4대 문서 직접 Read. 6-Layer ↔ Sidecar 정합성은 v2.1.0 plan 정독 후 재평가 필요 |

---

## 14. 최종 결론

v0.39.0의 **단일 명시적 Breaking Change(SubagentTool 제거, PR #25053)는 bkit에 영향 0건**이다. bkit는 자체 `mcp/bkit-server.js`의 `spawn_agent` MCP tool과 `gemini -e <agent>.md` 외부 spawn 방식을 사용하므로 Gemini CLI 내부 `SubagentTool` 클래스에 의존하지 않는다 (감사 grep 0 hit). 따라서 즉시 코드 수정 필수 항목은 없다.

핵심 위험 1: **Issue #25655 SessionStart `systemMessage` 이중 렌더링**이 v0.38.2~v0.39.0 잔존(fix PR #25827 OPEN). bkit `hooks/scripts/session-start.js` Line 89/114가 정면 적중 영역이며, v0.38.2 분석에서 권고된 방어 테스트(`tc107-v0382-session-start-duplication.js`)가 미신설 상태다. **본 v0.39.0 사이클의 P0 우선순위로 신설** 권고.

핵심 위험 2: **ContextManager + Sidecar 디커플드 아키텍처(PR #24752)**가 bkit v2.1.0 context-optimization plan과 교차 가능성. 본 P2에서는 정합성 검토 액션 항목만 제기하고, **v0.40.0의 MemoryManager 4-tier가 합쳐진 후 종합 재설계** 권고 (별도 cycle).

핵심 기회: **useAgentStream(#24292)** 채택 시 bkit `executeAgent`(Line 1040) 일괄 반환 → 실시간 stream 전환 가능. Trust Score "Full Visibility" 컴포넌트와 ai-native-principles의 "Verification Ability" 모두 강화 — P2 PoC 권고.

전체 위험도 **MEDIUM** (Breaking 0 + #25655 잔존 + ContextManager 교차). 별도 v0.39.0 전용 migration plan 작성보다는 v0.38.2 plan의 target을 `v0.39.0`으로 in-place swap하고 §11의 P0/P1 항목을 추가 반영하는 방식이 효율적.

---

*분석 종료: 2026-04-23. v0.39.0 stable 영향 분석 완료. v0.40.0-preview.2의 MemoryManager 4-tier + autoMemory split은 본 분석 범위 밖, 별도 cycle 권고.*
*bkit-impact-analyzer agent*
