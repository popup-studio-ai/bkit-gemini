# Gemini CLI v0.29.0~v0.30.0-preview Upgrade Impact Analysis Report

## Document Information
| Field | Value |
|-------|-------|
| Report Type | Version Upgrade Impact Analysis |
| Target Version | Gemini CLI 0.28.0 → 0.29.1 (Stable) / 0.30.0-preview |
| Analysis Date | 2026-02-19 |
| Author | bkit PDCA System |
| Previous Report | gemini-cli-028-upgrade-impact-analysis.report.md (2026-02-04) |
| bkit Version | 1.5.2 |
| Status | Completed |

---

## Executive Summary

Gemini CLI가 v0.28.0에서 v0.29.1 (Stable) 및 v0.30.0-preview로 업그레이드됨에 따라, bkit-gemini v1.5.2 익스텐션에 대한 영향도를 종합 분석하였습니다. 이번 업그레이드는 **이전 v0.28.0 업그레이드(65/100)보다 높은 수준의 영향**이 예상됩니다. 특히 Policy Engine 도입, Model-dependent tool definitions, Sub-agent XML 전환, Tool Output Masking 등 아키텍처 수준의 변경이 포함되어 있어 **사전 대응이 필수**입니다.

### Impact Score: **78/100** (High-Medium Impact)

| Category | Impact Level | Urgency | Details |
|----------|-------------|---------|---------|
| Policy Engine (excludeTools 대체) | **High** | Medium | v0.30.0-preview에서 deprecation 시작 |
| Model-dependent Tool Definitions | **High** | High | v0.29.0 stable, 즉시 검증 필요 |
| Sub-agent XML Format Transition | **High** | High | v0.29.0 stable, spawn 메커니즘 검증 필요 |
| Tool Output Masking | **Medium** | Medium | AfterTool 훅 영향 가능 |
| Skills/Hooks Stable 전환 | **Low** | Low | experimental 플래그 제거 가능 |
| Plan Mode MCP 지원 | **Low** (기회) | Low | PDCA 통합 기회 |
| Extension Registry/Discovery | **Low** (기회) | Low | 배포 기회 |
| Admin MCP Allowlisting | **Medium** | Low | 엔터프라이즈 환경 영향 |
| GEMINI_CLI=1 Env Variable | **Low** | Low | MCP 서버 감지 보강 |
| SDK Package for Skills | **Low** (기회) | Low | 향후 스킬 개발 기회 |

---

## 1. Gemini CLI Version Changelog Summary (v0.28.0 → v0.30.0-preview)

### v0.29.0 / v0.29.1 (2026-02-18, Current Stable)

#### Major New Features

| Feature | PR/Issue | Description |
|---------|----------|-------------|
| **Plan Mode** | #17698, #18324 | `/plan` 슬래시 커맨드 및 `enter_plan_mode` 도구 추가 |
| **Plan Mode MCP 지원** | #18229 | MCP 서버가 Plan Mode에서 사용 가능 |
| **Gemini 3 Default Model** | #18414 | Gemini 3가 기본 모델 패밀리로 설정 |
| **Model-dependent Tool Definitions** | #18563, #18662 | 모델별로 도구 스키마가 달라질 수 있음 |
| **Tool Output Masking** | #18389, #18416, #18451, #18553 | 도구 출력 마스킹, 세션 연결 저장소, 복원 지원 |
| **Sub-agent XML Format** | #18555 | 서브에이전트 정의가 XML 형식으로 전환 |
| **Skills/Hooks Stable** | #18358 | Skills, Hooks가 공식 Stable로 전환 |
| **Extension Discovery** | #18396, #18447 | 레지스트리 기반 익스텐션 탐색 |
| **Extension Config** | #17895 | `/extensions config` 커맨드 지원 |
| **Admin MCP Allowlisting** | #18311, #18442 | 관리자 MCP 서버 허용목록 |
| **System Prompt Overhaul** | #17263, #18258 | 시스템 프롬프트 구조 개편 |

#### Breaking Changes

| Change | PR | Impact |
|--------|-----|--------|
| Sub-agent XML format 전환 | #18555 | 커스텀 서브에이전트 정의 방식 변경 |
| Model-dependent tool definitions | #18563 | 도구 스키마가 모델별로 상이 |
| Tool call ID 단축 + 중복 이름 수정 | #18600 | 도구 호출 식별자 변경 |
| `excludeTools` legacy alias 확장 | #18498 | 리네임된 도구에 대한 하위호환 별칭 |
| Hardcoded policy bypass 제거 | #18153 | 로컬 서브에이전트 정책 우회 불가 |
| Default execution limits for subagents | #18274 | 서브에이전트 실행 제한 기본값 |

### v0.30.0-preview.0 (2026-02-17, Preview)

#### Major New Features

| Feature | PR/Issue | Description |
|---------|----------|-------------|
| **Policy Engine** | 다수 PR | `excludeTools`/`--allowed-tools` 대체하는 TOML 기반 정책 엔진 |
| **SDK Package** | #18861-#18863, #19031 | 커스텀 스킬 및 동적 시스템 인스트럭션 SDK |
| **`GEMINI_CLI=1` env** | #18832 | stdio MCP 서버에 환경변수 자동 설정 |
| **AskUser tool schema change** | #18959 | `question` 타입 필드 필수화 |
| **Centralized tool definitions** | #18944, #18991, #19269 | replace, search, grep 도구 정의 통합 |

#### Deprecations

| Deprecated | Replacement | Version | Timeline |
|-----------|-------------|---------|----------|
| `--allowed-tools` CLI flag | Policy Engine (TOML) | v0.30.0-preview | Future stable |
| `excludeTools` in settings | Policy Engine (TOML) | v0.30.0-preview | Future stable |
| `experimental.enableEventDrivenScheduler` | Default behavior | v0.29.0 | Removed (#17924) |
| `experimental.skills` flag | Skills are GA | v0.26.0+ | Ignored |

### Tech Blog Highlights

| Blog Post | Key Takeaway |
|-----------|-------------|
| Gemini 3 Flash in CLI | 기존 대비 1/4 비용, 고빈도 터미널 워크플로우 지원 |
| Extension Settings | 키체인 자동 저장, global/workspace scope 설정 |
| Hooks Blog | 에이전트 루프 커스터마이제이션의 공식 가이드 |
| FastMCP Integration | `fastmcp install gemini-cli`로 MCP 서버 설치 가능 |

### Open Issues (bkit 관련)

| Issue | Description | bkit Relevance |
|-------|-------------|---------------|
| #13850 | MCP dynamic tool update (`notifications/tools/list_changed`) | MCP 서버 동적 도구 업데이트 요청 |
| #18712 | Subagent MCP tool prefix (`internal__xxx`) | spawn_agent 도구 이름 충돌 가능 |
| #17402 | `/mcp disable/enable` for extension-bundled servers | 익스텐션 번들 MCP 제어 |

---

## 2. bkit-gemini v1.5.2 Integration Points Analysis

### 2.1 현재 아키텍처 요약

| Component | Count | Integration |
|-----------|-------|-------------|
| Hook Events | 10 | Gemini CLI lifecycle |
| Hook Scripts | 10 | 3,020 LOC, Node.js |
| Agents | 16 | MCP tools + gemini -e spawning |
| Skills | 29 | SKILL.md + TOML commands |
| Commands | 18 | TOML format |
| MCP Tools | 6 | JSON-RPC 2.0 stdio |
| Lib Modules | 34 | 6,691 LOC |
| Tool Mappings | 15 | Claude Code ↔ Gemini CLI |

### 2.2 Critical Integration Files

| File | Purpose | Risk Level |
|------|---------|-----------|
| `gemini-extension.json` | Extension manifest | **High** - `excludeTools`, `experimental` |
| `hooks/hooks.json` | 10 hook event registrations | **Medium** - hook matcher patterns |
| `lib/adapters/gemini/index.js` | Tool name mapping, env detection | **High** - TOOL_MAP, isActive() |
| `mcp/spawn-agent-server.js` | MCP server, agent spawning | **High** - `gemini -e --yolo` |
| `hooks/scripts/before-tool-selection.js` | Tool filtering | **High** - `allowedFunctionNames` |
| `hooks/scripts/after-tool.js` | Tool output processing | **Medium** - output masking 영향 |

---

## 3. Detailed Impact Assessment

### 3.1 HIGH Impact Items

#### H-01: Policy Engine Migration (excludeTools Deprecation)

**Current State (bkit v1.5.2)**:
```json
// gemini-extension.json
"excludeTools": []
```
```javascript
// hooks/scripts/before-tool-selection.js:39-45
if (allowedTools && allowedTools.length > 0) {
    // ... outputs allowedFunctionNames
    allowedFunctionNames: allowedTools
}
```

**What Changed (v0.30.0-preview)**:
- `excludeTools`와 `--allowed-tools`가 Policy Engine (TOML 파일)으로 대체
- 새로운 정책 파일 위치: `~/.gemini/policies/*.toml`
- MCP 도구도 `mcpName`과 와일드카드로 타겟팅 가능

```toml
# 새로운 Policy Engine 형식
[[rule]]
mcpName = "bkit"
toolName = "spawn_agent"
decision = "allow"
priority = 200
```

**Impact on bkit**:
- `excludeTools: []`는 빈 배열이므로 즉각적 영향은 없음
- 그러나 `before-tool-selection.js`의 `allowedFunctionNames` 출력 방식이 Policy Engine과 충돌 가능
- 향후 stable 릴리스에서 `excludeTools` 완전 제거 시 manifest 스키마 변경 필요

**Required Action**:
- **즉시**: `before-tool-selection.js`의 도구 필터링이 Policy Engine과 호환되는지 검증
- **v0.30 stable 전**: Policy Engine TOML 마이그레이션 계획 수립
- **권장**: `excludeTools`를 사용하지 않으므로 제거하거나, Policy Engine 연동 어댑터 추가

**Priority**: Medium (v0.30.0이 stable 되기 전까지 유예 가능)

---

#### H-02: Model-dependent Tool Definitions

**Current State (bkit v1.5.2)**:
```javascript
// lib/adapters/gemini/index.js:10-26
const TOOL_MAP = {
  'Write': 'write_file',
  'Edit': 'replace',
  'Read': 'read_file',
  'Bash': 'run_shell_command',
  'Glob': 'glob',
  'Grep': 'grep',
  'AskUserQuestion': 'ask_user',
  // ...
};
```

**What Changed (v0.29.0)**:
- PR #18563, #18662: 도구 정의가 모델 패밀리에 따라 달라질 수 있음
- Gemini 3가 기본 모델이 됨 (#18414)
- Gemini 3 패밀리 내에서 수치 라우팅 제한 (#18478)
- PR #18600: 도구 호출 ID 단축 및 중복 도구 이름 수정

**Impact on bkit**:
- TOOL_MAP의 Gemini CLI 도구 이름(`write_file`, `replace`, `read_file` 등)이 Gemini 3에서 변경되었을 수 있음
- `before-tool-selection.js`의 `allowedFunctionNames`에 사용되는 도구 이름이 유효한지 검증 필요
- `hooks.json`의 `matcher` 패턴(`write_file|replace`, `run_shell_command`, `skill`)이 여전히 유효한지 확인 필요

**Required Action**:
- **즉시**: Gemini CLI v0.29.1 환경에서 도구 이름 목록 출력 검증
- **즉시**: `hooks.json` matcher 패턴이 새 도구 이름과 일치하는지 확인
- **권장**: 동적 도구 이름 감지 메커니즘 도입 검토

**Priority**: **High** (v0.29.0은 이미 stable, 즉시 검증 필요)

---

#### H-03: Sub-agent XML Format Transition

**Current State (bkit v1.5.2)**:
```javascript
// mcp/spawn-agent-server.js:701-706
const proc = spawn('gemini', args, {
  env,
  cwd: process.cwd(),
  stdio: ['pipe', 'pipe', 'pipe']
});
```
- 에이전트 스폰: `gemini -e <agentPath.md> --yolo <task>`
- 16개 에이전트가 Markdown 형식의 `.md` 파일로 정의
- 각 에이전트 파일에 YAML frontmatter (model, tools, temperature 등)

**What Changed (v0.29.0)**:
- PR #18555: 서브에이전트가 XML 형식으로 전환
- PR #18274: 서브에이전트 기본 실행 제한 도입
- PR #18153: 로컬 서브에이전트의 하드코딩된 정책 우회 제거

**Impact on bkit**:
- `gemini -e agent.md` 형태의 에이전트 실행이 여전히 작동하는지 검증 필요
- `--yolo` 플래그가 정책 우회 제거(#18153) 이후에도 유효한지 확인
- 기본 실행 제한(#18274)이 bkit 에이전트의 장시간 작업에 영향을 줄 수 있음
- 에이전트 Markdown frontmatter가 새 XML 형식과 호환되는지 확인 필요

**Required Action**:
- **즉시**: v0.29.1에서 `gemini -e agent.md --yolo` 동작 검증
- **즉시**: 서브에이전트 실행 제한 확인 (기본 timeout 등)
- **검토**: 에이전트 정의를 XML 형식으로 마이그레이션할 필요성 평가
- **검토**: `--yolo` 대안 또는 Policy Engine 기반 허용 정책 설정

**Priority**: **High** (v0.29.0 stable, 핵심 기능인 agent spawning에 직접 영향)

---

### 3.2 MEDIUM Impact Items

#### M-01: Tool Output Masking

**What Changed (v0.29.0)**:
- PR #18389: 도구 출력 관찰 마스킹
- PR #18416: 세션 연결 도구 출력 저장소 및 정리
- PR #18451: 마스킹된 도구 출력의 지속성 및 복원
- PR #18553: 마스킹 임계값 원격 설정
- PR #18545: High-signal 도구는 마스킹 면제

**Impact on bkit**:
- `after-tool.js`가 도구 실행 결과를 읽어 PDCA 상태를 추적하는 경우, 마스킹된 출력으로 인해 정보 손실 가능
- `write_file`, `run_shell_command` 등 매칭되는 도구의 출력이 마스킹될 수 있음

**Required Action**:
- **검증**: `after-tool.js`가 도구 출력을 직접 파싱하는지 확인
- **검증**: 마스킹된 출력이 hook input으로 전달될 때의 형식 확인
- **권장**: High-signal 도구 면제 목록에 bkit 관련 도구 포함 요청 검토

**Priority**: Medium

---

#### M-02: Admin MCP Allowlisting

**What Changed (v0.29.0)**:
- PR #18311: 관리자용 MCP 서버 허용목록
- PR #18442: 익스텐션 번들 MCP 서버에도 allowlist 적용

**Impact on bkit**:
- 엔터프라이즈 환경에서 bkit의 `spawn-agent-server.js` MCP 서버가 allowlist에 포함되지 않으면 차단될 수 있음
- `gemini mcp list`에서 bkit MCP 서버 표시 영향

**Required Action**:
- **문서화**: 엔터프라이즈 배포 가이드에 MCP allowlist 설정 방법 추가
- **검토**: bkit MCP 서버를 기본 허용 목록에 포함시키는 방안

**Priority**: Low (엔터프라이즈 환경에서만 해당)

---

#### M-03: System Prompt Overhaul

**What Changed (v0.29.0)**:
- PR #17263: 시스템 프롬프트 전면 개편 ("rigor, integrity, intent alignment")
- PR #18258: 캐싱 최적화를 위한 워크플로우 위치 통합
- PR #18615: 시스템 프롬프트 내 도구 포맷 표준화
- PR #18613: 비활성 도구를 시스템 프롬프트에서 제거

**Impact on bkit**:
- `GEMINI.md`의 `@import` 구문이 새 시스템 프롬프트 구조와 충돌하지 않는지 확인
- `.gemini/context/` 모듈들의 인젝션 타이밍이 변경되었을 수 있음
- `before-model.js`의 프롬프트 증강이 새 시스템 프롬프트와 호환되는지 확인

**Required Action**:
- **검증**: GEMINI.md @import가 v0.29.1에서 정상 로드되는지 확인
- **검증**: before-model.js의 context injection이 새 프롬프트 구조와 충돌하지 않는지 확인

**Priority**: Medium

---

### 3.3 LOW Impact Items (Opportunities)

#### L-01: Plan Mode + MCP Integration

**Opportunity**: Gemini CLI의 새 Plan Mode가 MCP 서버를 지원하므로, bkit의 PDCA Plan 단계와 연동 가능
- `/plan` 커맨드로 구조화된 계획 수립
- MCP 도구를 활용한 Plan 문서 자동 생성
- 5단계 순차 계획 워크플로우를 PDCA에 맵핑

**Potential Integration**:
```
Gemini CLI /plan → bkit /pdca plan
Plan Mode MCP → spawn_agent(product-manager)
```

---

#### L-02: Extension Registry & Discovery

**Opportunity**: v0.29.0의 레지스트리 기반 익스텐션 탐색 기능으로 bkit-gemini 배포/설치 간소화

**Potential Benefit**:
- `gemini extensions search bkit` 으로 설치 가능
- 자동 업데이트 메커니즘

---

#### L-03: SDK Package for Custom Skills

**Opportunity**: v0.30.0-preview의 SDK 패키지로 bkit 스킬의 프로그래밍 가능한 확장

**Potential Benefit**:
- 동적 시스템 인스트럭션
- SessionContext API
- 커스텀 스킬 런타임

---

#### L-04: `GEMINI_CLI=1` Environment Variable

**Current State**:
```javascript
// lib/adapters/gemini/index.js:48-56
isActive() {
  return !!(
    process.env.GEMINI_CLI ||
    process.env.GEMINI_PROJECT_DIR ||
    // ...
  );
}
```

**What Changed (v0.30.0-preview)**:
- PR #18832: stdio MCP 서버 실행 시 `GEMINI_CLI=1` 자동 설정

**Impact on bkit**:
- `isActive()`가 이미 `process.env.GEMINI_CLI`를 체크하므로, MCP 서버에서도 자동 감지 가능
- 양의 영향: bkit MCP 서버(`spawn-agent-server.js`)가 Gemini CLI 환경을 더 확실히 감지

**Required Action**: 없음 (이미 호환)

---

#### L-05: experimental.skills Flag Removal

**Current State**:
```json
// gemini-extension.json:27-29
"experimental": {
  "skills": true
}
```

**What Changed (v0.29.0)**:
- PR #18358: Skills/Hooks가 공식 Stable로 전환
- `experimental.skills` 플래그는 무시됨 (harmless)

**Required Action**:
- **권장**: `gemini-extension.json`에서 `experimental` 블록 제거
- **권장**: 테스트 스위트의 `EXT-04: experimental.skills is enabled` 테스트 업데이트

**Priority**: Low

---

## 4. Feature Compatibility Matrix

### 4.1 Hook System Compatibility

| bkit Hook Event | v0.28.0 | v0.29.0 | v0.29.1 | v0.30.0-preview | Notes |
|----------------|---------|---------|---------|----------------|-------|
| SessionStart | ✅ | ✅ | ✅ | ✅ | 변경 없음 |
| BeforeAgent | ✅ | ✅ | ✅ | ✅ | 변경 없음 |
| BeforeModel | ✅ | ✅ | ✅ | ✅ | 시스템 프롬프트 구조 확인 필요 |
| AfterModel | ✅ | ✅ | ✅ | ✅ | 변경 없음 |
| BeforeToolSelection | ✅ | ⚠️ | ⚠️ | ⚠️ | Tool 이름 변경 영향 확인 |
| BeforeTool | ✅ | ⚠️ | ⚠️ | ⚠️ | matcher 패턴 검증 필요 |
| AfterTool | ✅ | ⚠️ | ⚠️ | ⚠️ | Output masking 영향 확인 |
| AfterAgent | ✅ | ✅ | ✅ | ✅ | 변경 없음 |
| PreCompress | ✅ | ✅ | ✅ | ✅ | 변경 없음 |
| SessionEnd | ✅ | ✅ | ✅ | ✅ | 변경 없음 |

### 4.2 MCP Server Compatibility

| MCP Tool | v0.28.0 | v0.29.0 | v0.29.1 | v0.30.0-preview | Notes |
|----------|---------|---------|---------|----------------|-------|
| spawn_agent | ✅ | ⚠️ | ⚠️ | ⚠️ | Sub-agent 형식 변경 검증 |
| list_agents | ✅ | ✅ | ✅ | ✅ | 변경 없음 |
| get_agent_info | ✅ | ✅ | ✅ | ✅ | 변경 없음 |
| team_create | ✅ | ✅ | ✅ | ✅ | 변경 없음 |
| team_assign | ✅ | ⚠️ | ⚠️ | ⚠️ | Sub-agent 스폰 영향 |
| team_status | ✅ | ✅ | ✅ | ✅ | 변경 없음 |

### 4.3 Skill/Command Compatibility

| Component | v0.28.0 | v0.29.0+ | Notes |
|-----------|---------|----------|-------|
| SKILL.md 형식 | ✅ | ✅ | YAML frontmatter 유지 |
| TOML Commands | ✅ | ✅ | 변경 없음 |
| @import 구문 | ✅ | ✅ | 검증 필요 |
| Skill 호출 | ✅ | ✅ | 정식 GA |

---

## 5. Risk Assessment Matrix

### 5.1 Risk Summary

| ID | Risk | Severity | Probability | Impact | Priority |
|----|------|----------|-------------|--------|----------|
| R-01 | Sub-agent 스폰 실패 (`gemini -e --yolo`) | **Critical** | Medium | Agent 전체 비작동 | **P0** |
| R-02 | Tool 이름 변경으로 hook matcher 불일치 | **High** | Medium | Hook 미작동 | **P0** |
| R-03 | Model-dependent tool schema 불일치 | **High** | Low-Medium | 특정 모델에서 도구 호출 실패 | **P1** |
| R-04 | Tool output masking으로 AfterTool 데이터 손실 | **Medium** | Medium | PDCA 추적 정보 누락 | **P1** |
| R-05 | Policy Engine 전환으로 tool filtering 충돌 | **Medium** | Low | v0.30 stable 시점에서 도구 필터링 실패 | **P2** |
| R-06 | Admin MCP allowlist로 인한 차단 | **Medium** | Low | 엔터프라이즈 환경 배포 불가 | **P2** |
| R-07 | System prompt 개편으로 context injection 충돌 | **Low** | Low | 컨텍스트 로딩 오류 | **P2** |

### 5.2 Risk Detail Analysis

#### R-01: Sub-agent Spawn Failure (Critical)

**Scenario**: `gemini -e agent.md --yolo task` 커맨드가 v0.29.0에서 작동하지 않거나 다르게 동작

**Root Cause**:
- Sub-agent 내부 형식이 XML로 전환 (#18555)
- `--yolo` 정책 우회가 제거 (#18153)
- 기본 실행 제한 도입 (#18274)

**Affected Files**:
- `mcp/spawn-agent-server.js` (701-706행)
- 16개 `agents/*.md` 파일

**Mitigation**:
1. v0.29.1에서 즉시 스폰 테스트 실행
2. `--yolo` 대안 플래그 조사
3. 에이전트 실행 제한 타임아웃 설정 조정

---

#### R-02: Tool Name Mismatch in Hook Matchers

**Scenario**: `hooks.json`의 `matcher` 패턴이 v0.29.0의 새 도구 이름과 일치하지 않음

**Current Matchers**:
```json
"matcher": "write_file|replace"      // BeforeTool
"matcher": "run_shell_command"       // BeforeTool
"matcher": "write_file"             // AfterTool
"matcher": "run_shell_command"      // AfterTool
"matcher": "skill"                  // AfterTool
```

**Root Cause**:
- #18944, #18991, #19269 (v0.30.0-preview): `replace`, `search`, `grep` 도구 정의 통합
- #18600 (v0.29.0): 중복 도구 이름 수정
- #18498: 리네임된 도구에 legacy alias 추가

**Affected Files**:
- `hooks/hooks.json` (66-121행)
- `lib/adapters/gemini/index.js` TOOL_MAP

**Mitigation**:
1. `gemini tools list` 로 현재 도구 이름 목록 확인
2. matcher 패턴을 새 이름에 맞게 업데이트
3. legacy alias가 작동하는지 확인

---

## 6. Migration Recommendations

### 6.1 Phase 1: Immediate Verification (v0.29.1 검증) - 우선순위 P0

| # | Action | Effort | Risk Mitigated |
|---|--------|--------|---------------|
| 1 | Gemini CLI v0.29.1로 업그레이드 후 `gemini tools list` 실행, 도구 이름 목록 확인 | 15분 | R-02 |
| 2 | `gemini -e agents/gap-detector.md --yolo "test"` 실행, sub-agent 스폰 검증 | 30분 | R-01 |
| 3 | `hooks.json` matcher 패턴과 현재 도구 이름 교차 검증 | 30분 | R-02 |
| 4 | 전체 PDCA 워크플로우 E2E 테스트 (`/pdca plan → report`) | 1시간 | R-01~R-04 |
| 5 | `before-tool-selection.js`의 `allowedFunctionNames` 출력값 검증 | 30분 | R-02, R-05 |

### 6.2 Phase 2: Adaptation (호환성 수정) - 우선순위 P1

| # | Action | Effort | Risk Mitigated |
|---|--------|--------|---------------|
| 1 | Tool name 변경 시 `TOOL_MAP` 및 `hooks.json` matcher 업데이트 | 1시간 | R-02, R-03 |
| 2 | `gemini-extension.json`에서 `experimental` 블록 제거 | 5분 | L-05 |
| 3 | 테스트 스위트 업데이트 (EXT-04 테스트 수정/제거) | 15분 | L-05 |
| 4 | `after-tool.js`에서 masking된 출력 핸들링 추가 | 1시간 | R-04 |
| 5 | Sub-agent 실행 제한 대응 (timeout 설정 조정) | 30분 | R-01 |

### 6.3 Phase 3: Policy Engine Preparation (v0.30.0 대비) - 우선순위 P2

| # | Action | Effort | Risk Mitigated |
|---|--------|--------|---------------|
| 1 | Policy Engine TOML 파일 작성 (bkit 도구 허용 정책) | 2시간 | R-05 |
| 2 | `before-tool-selection.js`를 Policy Engine 호환으로 리팩토링 | 3시간 | R-05 |
| 3 | 엔터프라이즈 배포 가이드에 Admin MCP Allowlist 설정 추가 | 1시간 | R-06 |
| 4 | `excludeTools` 필드 제거 또는 마이그레이션 가이드 작성 | 30분 | R-05 |

### 6.4 Phase 4: Feature Adoption (새 기능 활용) - 우선순위 P3

| # | Action | Effort | Benefit |
|---|--------|--------|---------|
| 1 | Plan Mode ↔ PDCA Plan 단계 통합 설계 | 4시간 | 구조화된 계획 수립 |
| 2 | Extension Registry 등록 준비 | 2시간 | 설치 간소화 |
| 3 | SDK Package 기반 스킬 개발 검토 | 3시간 | 프로그래밍 가능한 스킬 |
| 4 | Gemini 3 Flash 에이전트 모델 최적화 | 2시간 | 비용 절감 (1/4) |
| 5 | FastMCP 통합 검토 | 2시간 | MCP 서버 개발 간소화 |

---

## 7. Testing Plan

### 7.1 Smoke Test (즉시 실행)

```bash
# 1. Gemini CLI 버전 확인
gemini --version

# 2. 도구 이름 목록 확인
gemini tools list 2>&1 | grep -E "write_file|replace|read_file|run_shell_command|glob|grep|skill"

# 3. Sub-agent 스폰 테스트
gemini -e agents/gap-detector.md --yolo "List the files in the current directory"

# 4. MCP 서버 작동 확인
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node mcp/spawn-agent-server.js

# 5. Hook 실행 테스트
echo '{"prompt":"test"}' | node hooks/scripts/before-agent.js
```

### 7.2 Integration Test (Phase 1)

| Test Case | Steps | Expected Result |
|-----------|-------|----------------|
| TC-01: Hook Chain | 세션 시작 → 도구 호출 → 세션 종료 | 10개 hook 모두 정상 실행 |
| TC-02: Agent Spawn | `spawn_agent(gap-detector, "test task")` | 에이전트 정상 실행 및 결과 반환 |
| TC-03: PDCA Flow | `/pdca plan test → design → do → analyze → report` | 전체 사이클 완료 |
| TC-04: Tool Filtering | BeforeToolSelection 에서 phase별 도구 필터 | 올바른 도구만 허용 |
| TC-05: Context Loading | GEMINI.md @import 6개 모듈 | 모든 컨텍스트 정상 로드 |
| TC-06: Matcher Validation | hooks.json matcher 패턴 vs 실제 도구 이름 | 모든 패턴 매칭 |

### 7.3 Regression Test (Phase 2)

| Category | Test Count | Coverage |
|----------|-----------|----------|
| Hook Events (10) | 10 | SessionStart ~ SessionEnd |
| MCP Tools (6) | 6 | spawn_agent ~ team_status |
| Agent Spawn (16) | 16 | gap-detector ~ qa-strategist |
| Skill Load (29) | 29 | pdca ~ bkend-guides |
| Command Exec (18) | 18 | /bkit ~ /bkend-guides |
| Tool Mapping (15) | 15 | Write ~ Skill |
| **Total** | **94** | |

---

## 8. Version Comparison Summary

| Aspect | v0.28.0 (Previous) | v0.29.1 (Current Stable) | v0.30.0-preview |
|--------|-------------------|-------------------------|-----------------|
| Default Model | Gemini 2 | **Gemini 3** | Gemini 3 |
| Skills | GA | GA | GA + SDK |
| Hooks | GA | GA | GA |
| Tool Definitions | Static | **Model-dependent** | Centralized |
| excludeTools | Supported | Supported (legacy) | **Deprecated** → Policy Engine |
| Sub-agents | Markdown | **XML format** | XML format |
| Plan Mode | N/A | **New** | Enhanced |
| Tool Output | Raw | **Masked** | Masked + Remote config |
| MCP Admin | N/A | **Allowlisting** | Allowlisting |
| Extension Discovery | Manual | **Registry** | Registry |

---

## 9. Recommended bkit Version Roadmap

### bkit v1.5.3 (v0.29.1 호환 패치)

| Item | Description |
|------|-------------|
| Tool name 검증 및 TOOL_MAP 업데이트 | Gemini 3 기본 모델 환경 도구 이름 확인 |
| hooks.json matcher 패턴 검증/수정 | 새 도구 이름에 맞게 업데이트 |
| experimental 블록 제거 | gemini-extension.json 정리 |
| Sub-agent 스폰 검증 | `gemini -e --yolo` 작동 확인 |
| AfterTool masking 대응 | Output masking 핸들링 추가 |
| 테스트 스위트 업데이트 | EXT-04 수정, 새 도구 이름 반영 |

### bkit v1.6.0 (v0.30.0 대비 마이그레이션)

| Item | Description |
|------|-------------|
| Policy Engine 통합 | TOML 정책 파일 생성 및 연동 |
| Plan Mode ↔ PDCA 통합 | `/plan` → `/pdca plan` 매핑 |
| Extension Registry 등록 | 공식 레지스트리 배포 |
| SDK 기반 스킬 확장 | 프로그래밍 가능한 스킬 지원 |
| Gemini 3 Flash 최적화 | 에이전트 모델 비용 최적화 |

---

## 10. Conclusion

### Key Findings

1. **v0.29.0은 아키텍처 수준의 변경**이 포함된 메이저 업데이트입니다. Gemini 3 기본 모델 전환, model-dependent tool definitions, sub-agent XML 전환은 bkit의 핵심 기능에 직접 영향을 줍니다.

2. **즉각적인 기능 중단 위험은 중간 수준**입니다. Gemini CLI가 하위호환을 위한 legacy alias(#18498)를 제공하고 있어 기존 도구 이름이 당장 깨지지는 않을 수 있으나, 검증이 필수입니다.

3. **v0.30.0-preview의 Policy Engine은 전략적 대응이 필요**합니다. `excludeTools`와 `--allowed-tools`의 deprecation은 bkit의 도구 필터링 메커니즘(`before-tool-selection.js`)에 근본적인 변경을 요구할 수 있습니다.

4. **새로운 기회가 다수 존재**합니다. Plan Mode MCP 통합, Extension Registry, SDK Package, Gemini 3 Flash 비용 절감 등은 bkit의 기능 확장과 배포 간소화에 활용 가능합니다.

### Risk Level

**HIGH-MEDIUM (78/100)** - 이전 v0.28.0 업그레이드(65/100)보다 높은 영향도. Phase 1 검증을 **즉시** 실행하고, Phase 2 적응을 1주 내에 완료할 것을 권장합니다.

### Recommended Approach

| Phase | Timeline | Priority | Description |
|-------|----------|----------|-------------|
| Phase 1 | 즉시 (1일) | **P0** | v0.29.1 환경에서 smoke test 및 핵심 기능 검증 |
| Phase 2 | 1주 내 | **P1** | 호환성 수정 및 bkit v1.5.3 릴리스 |
| Phase 3 | 2-3주 내 | **P2** | Policy Engine 대비 및 v0.30.0 준비 |
| Phase 4 | 1개월 내 | **P3** | 새 기능 채택 및 bkit v1.6.0 계획 |

---

## References

### Official Sources
- [Gemini CLI Changelogs - Latest Stable](https://geminicli.com/docs/changelogs/latest/)
- [Gemini CLI Changelogs - Preview](https://geminicli.com/docs/changelogs/preview/)
- [Gemini CLI Policy Engine](https://geminicli.com/docs/core/policy-engine/)
- [Gemini CLI Extensions](https://geminicli.com/docs/extensions/)
- [Gemini CLI MCP Servers](https://geminicli.com/docs/tools/mcp-server/)

### GitHub
- [google-gemini/gemini-cli Releases](https://github.com/google-gemini/gemini-cli/releases)
- [Issue #13850: MCP Dynamic Tool Updates](https://github.com/google-gemini/gemini-cli/issues/13850)
- [Issue #18712: Subagent MCP Tool Prefix](https://github.com/google-gemini/gemini-cli/issues/18712)
- [Issue #17402: MCP Enable/Disable for Extensions](https://github.com/google-gemini/gemini-cli/issues/17402)

### Tech Blogs
- [Gemini 3 Flash in CLI](https://developers.googleblog.com/gemini-3-flash-is-now-available-in-gemini-cli/)
- [Making Extensions Easier to Use](https://developers.googleblog.com/making-gemini-cli-extensions-easier-to-use/)
- [Gemini CLI Hooks](https://developers.googleblog.com/tailor-gemini-cli-to-your-workflow-with-hooks/)
- [FastMCP Integration](https://developers.googleblog.com/gemini-cli-fastmcp-simplifying-mcp-server-development/)

### bkit Files Analyzed
- `gemini-extension.json` - Extension manifest
- `hooks/hooks.json` - 10 hook event registrations
- `lib/adapters/gemini/index.js` - Gemini CLI adapter (TOOL_MAP, isActive)
- `mcp/spawn-agent-server.js` - MCP server (agent spawning)
- `hooks/scripts/before-tool-selection.js` - Tool filtering
- `hooks/scripts/after-tool.js` - Tool output processing
- `hooks/scripts/before-agent.js` - Intent detection
- `hooks/scripts/before-model.js` - Prompt augmentation
- `bkit.config.json` - Centralized configuration
- `CHANGELOG.md` - Version history
- Previous report: `docs/04-report/gemini-cli-028-upgrade-impact-analysis.report.md`

### Related PRs (Key Changes)
- [#18555: Sub-agent XML format](https://github.com/google-gemini/gemini-cli/pull/18555)
- [#18563: Model-dependent tool definitions](https://github.com/google-gemini/gemini-cli/pull/18563)
- [#18358: Skills/Hooks stable](https://github.com/google-gemini/gemini-cli/pull/18358)
- [#18389: Tool output masking](https://github.com/google-gemini/gemini-cli/pull/18389)
- [#18311: Admin MCP allowlisting](https://github.com/google-gemini/gemini-cli/pull/18311)
- [#18153: Remove hardcoded policy bypass](https://github.com/google-gemini/gemini-cli/pull/18153)
- [#18274: Default subagent execution limits](https://github.com/google-gemini/gemini-cli/pull/18274)
- [#17263: System prompt overhaul](https://github.com/google-gemini/gemini-cli/pull/17263)
- [#18832: GEMINI_CLI=1 env for MCP](https://github.com/google-gemini/gemini-cli/pull/18832)

---

**Report Generated**: 2026-02-19
**bkit Version**: 1.5.2
**Target Gemini CLI**: v0.29.1 (Stable) / v0.30.0-preview
**Analysis Tool**: bkit PDCA Report Generator
**Previous Report**: gemini-cli-028-upgrade-impact-analysis.report.md (2026-02-04)
