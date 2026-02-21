# Gemini CLI Version Upgrade Impact Analysis

> **bkit-gemini v1.5.3 -> v1.6.0+ Roadmap**
> PDCA Analysis Phase | 2026-02-21

---

## 1. Executive Summary

### Analysis Scope

Gemini CLI v0.22.0 ~ v0.30.0-preview.3 전체 버전 변경사항을 종합 조사하고, bkit-gemini v1.5.3 코드베이스에 대한 기능 영향을 분석한다. Google의 Context Engineering 전략 방향을 파악하여 bkit Extensions의 중장기 개선 계획을 수립한다.

### Key Findings

| Category | Impact Level | Summary |
|----------|-------------|---------|
| Policy Engine Migration | **CRITICAL** | `--allowed-tools`, `excludeTools` v0.30.0에서 deprecated. TOML Policy로 전환 필수 |
| Tool Naming Instability | **HIGH** | `replace` -> `edit_file`, `glob` -> `find_files` 등 추가 rename 가능성 |
| Sub-agent Architecture | **HIGH** | XML 포맷 전환, MCP 도구 prefix 문제, Skills 미지원 |
| Gemini 3 Model Family | **MEDIUM** | 기본 모델 변경, temperature 1.0 권장, Flash/Pro 모델 선택 |
| SDK Package | **MEDIUM** | `@google/gemini-cli-core` SDK 도입으로 프로그래매틱 통합 가능 |
| Context Management | **MEDIUM** | Token-frugal reads, context compression 개선 |
| Extension Registry | **LOW** | 확장 탐색 UI, 설치/관리 개선 |

### Risk Assessment

- **즉시 대응 필요 (v0.30.0)**: Policy Engine 마이그레이션, excludeTools 제거
- **단기 대응 (v0.31.0 예상)**: Tool Registry 방어 계층 강화, Sub-agent MCP 호환성
- **중기 대응 (v0.32.0+)**: SDK 통합, Conductor 연동, Context Compaction 최적화

---

## 2. Gemini CLI Version History Analysis

### 2.1 Major Version Timeline (v0.22.0 ~ v0.30.0-preview.3)

```
v0.30.0-preview.3 (2026-02-19) ── Policy Engine 전환, SDK Package, --allowed-tools deprecated
v0.29.5          (2026-02-19) ── Plan Mode, Gemini 3 default, Extension Discovery
v0.28.0          (2026-02-10) ── /prompt-suggest, Positron IDE, Custom themes
v0.27.0          (2026-02-03) ── Event-driven scheduler, /rewind command
v0.26.0          (2026-01-27) ── skill-creator, Generalist agent, Skills GA
v0.25.0          (2026-01-20) ── activate_skill 강화, pr-creator skill, Skills default enabled
v0.24.0          (2026-01-14) ── Folder trust, Shell allowlisting, /skills install
v0.23.0          (2026-01-07) ── Agent Skills (experimental), Gemini CLI Wrapped
v0.22.0          (2025-12-22) ── Gemini 3 default, Extensions UI, Conductor launch
v0.21.0          (2025-12-15) ── Gemini 3 Flash, MCP Resource support
v0.20.0          (2025-12-01) ── Persistent "Always Allow", Multi-file drag & drop
v0.18.0          (2025-11-17) ── Policy Engine (experimental), Google Workspace extension
v0.16.0          (2025-11-10) ── Gemini 3 launch
v0.15.0          (2025-11-03) ── Scrollable UI, Partner extensions, Todo planning
v0.12.0          (2025-10-27) ── /model command, Model routing, Codebase Investigator
v0.11.0          (2025-10-20) ── Jules extension, stream-json output
```

### 2.2 Breaking Changes Cumulative Impact

| Version | Breaking Change | bkit Impact |
|---------|----------------|-------------|
| **v0.30.0** | `--allowed-tools` deprecated -> Policy Engine | `gemini-extension.json`의 `excludeTools` 제거 필요 |
| **v0.30.0** | `excludeTools` deprecated -> Policy Engine TOML | Extension manifest 구조 변경 |
| **v0.30.0** | AskUser tool question type 필수화 | Hook scripts에서 ask_user 호출 방식 검증 필요 |
| **v0.30.0** | Utility models -> Gemini 3 | Agent model 참조 업데이트 확인 |
| **v0.29.0** | Event-driven scheduler 기본화 | `experimental.enableEventDrivenScheduler` 제거 확인 |
| **v0.29.0** | Sub-agent XML 포맷 전환 | MCP spawn-agent-server.js 호환성 검증 |
| **v0.29.0** | Skills/Hooks stable (experimental 제거) | `gemini-extension.json`에서 `experimental.skills` 제거 ✅ (v1.5.3 완료) |
| **v0.29.0** | Gemini 3 기본 모델 | Agent frontmatter model 필드 검증 |
| **v0.26.0** | Agent Skills default enabled | Skills 활성화 로직 불필요 확인 |
| **v0.24.0** | Folder trust default untrusted | Extension 설치 시 trust 처리 필요 |

---

## 3. Feature-by-Feature Impact Analysis

### 3.1 Policy Engine Migration (CRITICAL - v0.30.0)

#### Current State (bkit v1.5.3)

```json
// gemini-extension.json
{
  "excludeTools": []  // 현재 미사용이지만 필드 존재
}

// bkit.config.json
{
  "permissions": {
    "write_file": "allow",
    "run_shell_command(rm -rf*)": "deny",
    "run_shell_command(git push --force*)": "deny"
  }
}
```

#### What Changes

v0.30.0-preview에서 `--allowed-tools`와 `excludeTools`가 deprecated되고, TOML 기반 Policy Engine으로 전환된다.

**Policy TOML 구조:**
```toml
# .gemini/policies/bkit-permissions.toml

[[rule]]
toolName = "run_shell_command"
commandPrefix = "rm -rf"
decision = "deny"
priority = 100

[[rule]]
toolName = "run_shell_command"
commandPrefix = "git push --force"
decision = "deny"
priority = 100

[[rule]]
toolName = "write_file"
decision = "allow"
priority = 50
```

**Priority Tiers:** Default(1) < Workspace(2) < User(3) < Admin(4)
**MCP Wildcards:** `toolName = "my-server__*"` 서버 전체 도구 매칭

#### Required Actions

1. **`gemini-extension.json`에서 `excludeTools` 필드 제거** 또는 deprecated 경고 대응
2. **`bkit.config.json` permissions -> TOML Policy 변환기 구현** (`lib/adapters/gemini/policy-migrator.js`)
3. **Extension에 Policy 파일 번들링 지원** (Issue #19702 - 아직 미구현)
4. **`before-tool.js` Permission Manager -> Policy Engine 호환 레이어** 추가
5. **`before-tool-selection.js` 도구 필터링 -> Policy 기반으로 전환**

#### Impact on bkit Architecture

```
현재: bkit.config.json permissions -> before-tool.js Permission Manager
미래: .gemini/policies/*.toml -> Policy Engine (Gemini CLI native)
      + bkit.config.json (bkit-specific 확장 규칙만 유지)
```

**Severity: CRITICAL** - v0.30.0 정식 출시 시 기존 방식 동작 중단 가능

---

### 3.2 Tool Naming Evolution (HIGH)

#### Current State (bkit v1.5.3)

`lib/adapters/gemini/tool-registry.js`에 17개 built-in 도구명이 Source of Truth로 관리됨.

#### Pending Renames (GitHub Issue #1391)

| Current Name | Proposed Name | Status |
|-------------|--------------|--------|
| `replace` | `edit_file` | Proposed, maintainer liked |
| `glob` | `find_files` | Proposed, stale |
| `search_file_content` / `grep_search` | `find_in_file` | Naming conflict 존재 |
| `google_web_search` | `web_search` | Proposed |
| `read_many_files` | `read_files` | Proposed |

**v0.29.0 Legacy Alias 시스템:** `excludeTools`에서 이전 이름도 인식하도록 확장됨
**v0.30.0 Centralized Definitions:** 모델 패밀리별 도구 정의 중앙화

#### Required Actions

1. **Tool Registry에 alias 매핑 레이어 추가**
   ```javascript
   // tool-registry.js 확장
   const TOOL_ALIASES = {
     'edit_file': 'replace',        // 미래 호환
     'find_files': 'glob',          // 미래 호환
     'web_search': 'google_web_search',
     'find_in_file': 'grep_search',
     'read_files': 'read_many_files'
   };
   ```

2. **도구명 자동 감지 + 폴백 시스템** 구현
   - Gemini CLI 버전 감지 -> 해당 버전의 도구명 사용
   - 실패 시 alias로 폴백

3. **Agent/Skill frontmatter 도구명 동적 치환**
   - Build time이 아닌 runtime에서 도구명 결정

#### Impact Assessment

- **16 agents**: 모든 frontmatter `tools:` 필드 영향
- **29 skills**: 모든 frontmatter `allowed-tools:` 필드 영향
- **10 hook scripts**: 도구명 비교 로직 영향
- **hooks.json**: matcher 패턴 영향

---

### 3.3 Sub-agent Architecture Overhaul (HIGH)

#### v0.29.0 Changes

- Sub-agents XML 포맷으로 전환
- Hardcoded policy bypass 제거
- Default execution limits 추가
- System prompt 최적화

#### Key Issues Affecting bkit

| Issue | Impact on bkit |
|-------|---------------|
| **#18712** - Sub-agent MCP tool server prefix 필요 (`server__tool`) | bkit MCP 도구가 sub-agent에서 동작 불가 |
| **#19599** - Custom agent MCP tool validation 실패 | Agent frontmatter에 MCP 도구명 사용 불가 |
| **#18276** - Sub-agent Skills 미지원 | cto-lead 등 agent에서 skill 활성화 불가 |
| **#18271** - Agent/Sub-agent 통합 refactor 진행중 | 향후 API 변경 가능 |
| **#18287** - Shared memory / parallel collaboration 탐색 | Agent 팀 모드에 영향 |

#### Required Actions

1. **MCP spawn-agent-server.js 도구명에 server prefix 추가**
   ```javascript
   // 현재: team_create, team_assign, team_status
   // 필요: bkit__team_create, bkit__team_assign, bkit__team_status
   ```

2. **Agent frontmatter에서 MCP 도구 참조 방식 변경**
   - `tools:` 필드에 MCP 도구 직접 참조 대신 built-in 도구만 나열
   - MCP 도구는 Policy/settings.json으로 제어

3. **cto-lead agent 팀 모드 아키텍처 재설계**
   - `spawn_agent` 제거 완료 (v1.5.3)
   - Sub-agent 간 통신 방식을 Gemini CLI native 패턴으로 전환

---

### 3.4 Gemini 3 Model Family (MEDIUM)

#### Current State

v0.29.0에서 Gemini 3가 기본 모델이 됨. 현재 bkit agents:

```yaml
# 대부분의 agent
model: gemini-2.5-pro

# 일부 lightweight agent
model: gemini-2.5-flash
```

#### Available Models (v0.29.0+)

| Model | Context Window | Use Case |
|-------|---------------|----------|
| **Gemini 3 Pro** | 1M tokens | Complex reasoning, architecture |
| **Gemini 3 Flash** | 200K tokens | Fast tasks, 3x faster than 2.5 Pro |
| **Gemini 3.1 Pro** | 1M tokens | Latest, 77.1% ARC-AGI-2 (preview) |

#### Required Actions

1. **Agent model 참조 업데이트**
   ```yaml
   # 변경 전
   model: gemini-2.5-pro

   # 변경 후
   model: gemini-3-pro          # Complex agents (cto-lead, enterprise-expert)
   model: gemini-3-flash        # Fast agents (starter-guide, pipeline-guide)
   ```

2. **Temperature 조정 검토**
   - Gemini 3에서 낮은 temperature(0.1-0.3)는 looping 유발 가능
   - 기본 temperature 1.0 권장
   - bkit agents의 temperature 값 재평가 필요

3. **Model Routing 활용 검토**
   - v0.12.0의 intelligent model routing 기능 활용 가능
   - 태스크 복잡도에 따른 자동 모델 선택

---

### 3.5 SDK Package - `@google/gemini-cli-core` (MEDIUM)

#### v0.30.0-preview에서 도입

**새로운 기능:**
- Custom skills 프로그래매틱 정의
- Dynamic system instructions 주입
- Gemini CLI 핵심 기능의 Node.js API 접근

#### Impact on bkit

현재 bkit는 Extension manifest + Hook scripts + GEMINI.md로 통합하지만, SDK를 통해:
- **Hook scripts를 SDK API로 대체** 가능 (더 안정적인 API)
- **Skill Orchestrator를 SDK 기반으로 재구현** 가능
- **MCP spawn-agent-server.js를 SDK의 sub-agent API로 대체** 가능

#### Required Actions (중기)

1. **SDK API 평가 및 호환성 레이어 설계**
2. **hook scripts -> SDK migration 가능성 분석**
3. **skill-orchestrator.js SDK 통합 프로토타입**

---

### 3.6 Plan Mode (LOW - Already Supported)

#### v0.29.0에서 정식 도입

- `/plan` 커맨드
- `enter_plan_mode`, `exit_plan_mode` 도구
- 계획 파일 세션별 격리 (v0.30.0)
- Plan 중 skill 활성화 가능 (v0.30.0)

#### Current bkit Support

v1.5.3에서 이미 TOOL_MAP에 추가됨:
```javascript
EnterPlanMode: 'enter_plan_mode',
ExitPlanMode: 'exit_plan_mode'
```

#### Additional Opportunities

- bkit PDCA "Plan" 단계와 Gemini Plan Mode 연동
- Plan 문서 자동 생성 시 Plan Mode 활용
- `before-tool-selection.js`에서 Plan Mode 감지 -> 읽기 전용 도구만 허용

---

### 3.7 Extension Discovery & Registry (LOW)

#### v0.29.0 Changes

- Extension Registry client 구현
- 확장 탐색 UI
- Extension config 기본 활성화

#### Impact on bkit

- bkit을 공식 Extension Registry에 등록 가능
- 설치/업데이트 UX 개선
- 사용자가 extension 탐색 UI에서 bkit 발견 가능

---

## 4. Context Engineering Strategic Analysis

### 4.1 Google의 Context Engineering 정의

Google의 공식 정의 (2025.11 Whitepaper):

> **Context Engineering**은 LLM의 컨텍스트 윈도우 내에서 정보를 동적으로 관리하는 discipline로, 두 가지 핵심 요소로 구성된다:
> - **Sessions**: 단일 대화의 즉각적이고 시간순서적인 상태 관리
> - **Memory**: 여러 세션에 걸친 장기 지속적 기억 시스템

핵심 테제: **"에이전트의 진정한 지능은 모델이 아니라, 모델 주변에 조립되는 컨텍스트에서 나온다."**

### 4.2 Google ADK의 Context Engineering 아키텍처

**4-Tier Context Stack:**

| Layer | 목적 | 특성 |
|-------|------|------|
| **Working Context** | 즉시 모델 프롬프트 | 일시적, 매 호출 재계산 |
| **Session** | 지속적 상호작용 로그 | 시간순 Event 객체 |
| **Memory** | 장기 검색 가능 지식 | 세션 초월, 시맨틱 검색 |
| **Artifacts** | 대형 바이너리/텍스트 | 이름+버전, 핸들 기반 접근 |

**3 Core Principles:**
1. **Separate storage from presentation** - 저장과 표현 분리
2. **Explicit transformations** - 명시적 변환 파이프라인
3. **Scope by default** - 최소 필요 컨텍스트만 전달

### 4.3 bkit vs Google Context Engineering 비교

| Google CE 원칙 | bkit 현재 구현 | 격차 | 개선 방향 |
|---------------|---------------|------|----------|
| **4-Tier Stack** | 3-Layer (Domain/Behavioral/State) | Artifacts 레이어 부재 | PDCA 문서를 Artifact으로 관리 |
| **Session Management** | Hook-based state tracking | 세션 간 상태 전달 제한적 | Agent Memory 확장 |
| **Memory System** | agent-memory.js (file-based) | 시맨틱 검색 없음 | Embedding 기반 검색 추가 |
| **Explicit Transformations** | Skill Orchestrator YAML 파싱 | 파이프라인 미명시화 | Context Pipeline 패턴 도입 |
| **Scope by Default** | before-tool-selection.js 필터링 | Agent별 스코프 미세분화 | Per-agent context budget |
| **Context Compaction** | pre-compress.js hook | 자체 압축 로직 없음 | Gemini CLI native 압축 연동 |
| **Progressive Disclosure** | Skill metadata -> full content | Level 3 (on-demand) 미구현 | `references/` 디렉토리 지원 |

### 4.4 Conductor Extension 벤치마킹

Google의 Conductor는 Context Engineering의 참조 구현:

| Conductor 기능 | bkit 동등 기능 | 차별화 기회 |
|---------------|---------------|-------------|
| `conductor/product.md` | `docs/01-plan/` | bkit: PDCA 4단계로 더 구조화됨 |
| `conductor/tech-stack.md` | `bkit.config.json` | bkit: 자동 레벨 감지 |
| `conductor/workflow.md` | PDCA lifecycle hooks | bkit: 10-event hook 시스템으로 자동화 |
| `/conductor:newTrack` | `/pdca plan` | bkit: 8개 PDCA 액션으로 더 세분화 |
| `/conductor:implement` | `/pdca do` | bkit: Gap analysis + 자동 iteration |
| Specs/Plan 생성 | Plan/Design 문서 | bkit: 템플릿 + 자동 검증 |
| Automated Reviews | gap-detector agent | bkit: 90% 일치율 기반 자동 개선 |

**bkit의 차별적 강점:**
- PDCA 순환 구조 (Conductor는 선형)
- 16 전문 agent (Conductor는 범용)
- 3 프로젝트 레벨 자동 감지 (Conductor는 단일)
- 8개국어 인텐트 감지 (Conductor는 영어 중심)

---

## 5. 기능 개선 계획 (Roadmap)

### 5.1 Phase 1: v0.30.0 호환성 (v1.6.0) - 긴급

**목표:** v0.30.0 정식 출시 시 즉시 호환

| Task | Priority | Effort | Description |
|------|----------|--------|-------------|
| Policy Engine 마이그레이션 | P0 | L | bkit.config.json permissions -> TOML Policy 변환기 |
| excludeTools 제거 | P0 | S | gemini-extension.json에서 deprecated 필드 제거 |
| Tool Alias 방어 레이어 | P1 | M | tool-registry.js에 forward/backward alias 매핑 |
| Agent model 업데이트 | P1 | S | gemini-2.5-pro -> gemini-3-pro/flash |
| Temperature 재평가 | P1 | S | Gemini 3 권장값(1.0)으로 조정 검토 |
| ask_user question type 필수화 | P2 | S | Hook scripts의 ask_user 호출 검증 |
| Session retention 30일 대응 | P2 | S | Agent Memory TTL 검토 |

**새로운 파일:**
```
lib/adapters/gemini/policy-migrator.js    # Config -> TOML 변환
.gemini/policies/bkit-defaults.toml       # 기본 정책 파일
```

### 5.2 Phase 2: Sub-agent 호환성 (v1.6.1)

**목표:** Sub-agent에서 MCP 도구, Skills 정상 동작

| Task | Priority | Effort | Description |
|------|----------|--------|-------------|
| MCP 도구 server prefix 대응 | P1 | M | spawn-agent-server.js prefix 자동 처리 |
| Agent frontmatter MCP 도구 분리 | P1 | M | built-in tools만 frontmatter에, MCP는 별도 관리 |
| Sub-agent Skills 호환성 레이어 | P2 | L | #18276 해결될 때까지 workaround |
| cto-lead 팀 모드 재설계 | P2 | L | native sub-agent 패턴으로 전환 |

### 5.3 Phase 3: Context Engineering 고도화 (v1.7.0)

**목표:** Google CE 아키텍처 원칙 도입

| Task | Priority | Effort | Description |
|------|----------|--------|-------------|
| Context Pipeline 패턴 | P1 | XL | Hook 기반 -> 명시적 processor 파이프라인 |
| Artifacts Layer 도입 | P2 | L | PDCA 문서를 named/versioned artifact으로 관리 |
| Per-agent Context Budget | P2 | M | Agent별 토큰 예산 할당 + 모니터링 |
| Skills Progressive Disclosure L3 | P2 | M | `references/` 디렉토리 on-demand 로딩 |
| Memory Semantic Search | P3 | XL | Embedding 기반 agent-memory 검색 |

### 5.4 Phase 4: SDK 통합 & Conductor 연동 (v1.8.0)

**목표:** 프로그래매틱 통합, Conductor와의 시너지

| Task | Priority | Effort | Description |
|------|----------|--------|-------------|
| SDK API 통합 레이어 | P2 | XL | hook scripts -> SDK API 마이그레이션 |
| Conductor 연동 | P3 | L | bkit PDCA + Conductor specs/plans 상호운용 |
| Dynamic System Instructions | P2 | M | SDK의 동적 시스템 인스트럭션 활용 |
| Extension Registry 등록 | P3 | S | 공식 레지스트리 배포 |

---

## 6. Risk Assessment

### 6.1 Critical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Tool naming 추가 변경 | 높음 | 높음 | Alias 방어 레이어 + 버전 감지 |
| Policy Engine 마이그레이션 실패 | 중간 | 매우 높음 | 조기 v0.30.0-preview 테스트 |
| Sub-agent 아키텍처 전면 변경 | 중간 | 높음 | Minimal sub-agent 의존성 유지 |
| Skills system 아키텍처 변경 | 낮음 | 높음 | Agent Skills 표준 준수 |

### 6.2 Opportunity Assessment

| Opportunity | Probability | Impact | Action |
|-------------|------------|--------|--------|
| Extension Registry 등록 | 높음 | 높음 | Registry 요구사항 조기 파악 |
| SDK 기반 안정적 통합 | 높음 | 매우 높음 | SDK preview API 조기 평가 |
| Conductor 시너지 | 중간 | 높음 | PDCA <-> Specs/Plans 매핑 설계 |
| Gemini 3 성능 향상 | 높음 | 중간 | Model 업그레이드 + 프롬프트 최적화 |

---

## 7. Detailed Technical Analysis

### 7.1 Hook System Compatibility

**10 Hook Events 현재 상태:**

| Hook | v0.29.0 상태 | v0.30.0 변경 | bkit 대응 |
|------|-------------|-------------|----------|
| SessionStart | Stable | 변경 없음 | OK |
| BeforeAgent | Stable | 변경 없음 | OK |
| BeforeModel | Stable | Utility model -> Gemini 3 | Model 참조 확인 |
| AfterModel | Stable | 변경 없음 | OK |
| BeforeToolSelection | Stable | Policy Engine 통합 | Policy 우선순위 확인 |
| BeforeTool | Stable | 도구 출력 마스킹 기본화 | 마스킹 영향 분석 |
| AfterTool | Stable | 변경 없음 | OK |
| AfterAgent | Stable | 변경 없음 | OK |
| PreCompress | Stable | 대형 디버그 로그 제한 | 컨텍스트 보존 로직 검증 |
| SessionEnd | Stable | 세션 보존 30일 기본 | Agent Memory TTL 조정 |

### 7.2 TOML Command Compatibility

**18 TOML Commands 현재 상태:**

v0.30.0에서 TOML 로딩 통합 예정 (Issue #15180). 현재 3개 별도 로더 존재:
- Agents: `packages/core/src/agents/toml-loader.ts`
- Policies: `packages/core/src/policy/toml-loader.ts`
- Commands: `packages/cli/src/services/FileCommandLoader.ts`

**영향:**
- bkit의 `@{path}`, `!{command}`, `{{args}}` 확장 문법이 통합 로더에서 지원되는지 확인 필요
- Issue #15535에서 Markdown 기반 커맨드 정의 제안 -> TOML에서 MD로 전환 가능성

### 7.3 MCP Integration Deep Dive

**spawn-agent-server.js (753 lines) 현재 도구:**

| Tool | Status | v0.30.0 영향 |
|------|--------|-------------|
| `team_create` | Active | Server prefix 필요 (`bkit__team_create`) |
| `team_assign` | Active | Server prefix 필요 |
| `team_status` | Active | Server prefix 필요 |
| `spawn_agent` | Legacy | 이미 v1.5.3에서 agent frontmatter에서 제거 |
| `list_agents` | Legacy | 정리 가능 |
| `get_agent_info` | Legacy | 정리 가능 |

**MCP 관련 Gemini CLI 이슈:**
- **#19660**: McpClientManager 이름 충돌 시 상태 손상 -> bkit MCP 서버명 고유성 보장
- **#14375**: `notifications/tools/list_changed` 동적 도구 업데이트 -> bkit 도구 동적 등록 가능

### 7.4 Agent Memory vs Google ADK Memory

| Feature | bkit agent-memory.js | Google ADK Memory |
|---------|---------------------|-------------------|
| 저장 방식 | 파일 기반 JSON | Service 기반 (MemoryService) |
| 검색 방식 | 키-값 조회 | 시맨틱 검색 (Embedding) |
| 스코프 | Project / User | Agent / Session / User |
| 지속성 | 영구 (파일) | 구성 가능 (TTL) |
| 적재 방식 | 명시적 호출 | Reactive + Proactive recall |
| 압축 | 없음 | Sliding window + Summarization |

**격차 분석:** bkit의 파일 기반 메모리는 기능적이지만, ADK의 시맨틱 검색과 proactive recall에 비해 기본적. 중기적으로 Embedding 기반 검색 도입 필요.

---

## 8. Context Engineering 방향성 분석

### 8.1 Google의 CE 진화 방향

```
Phase 1 (2025 Q3-Q4): 기반 구축
  ├── Gemini CLI 출시 (v0.4.0)
  ├── GEMINI.md 계층적 컨텍스트
  ├── Extension 생태계 시작
  └── MCP 통합

Phase 2 (2025 Q4-2026 Q1): 지능화
  ├── Agent Skills 표준 도입
  ├── Model Routing (작업 복잡도 기반)
  ├── Policy Engine (세밀한 권한 제어)
  └── Conductor (컨텍스트 주도 개발)

Phase 3 (2026 Q1-현재): 자동화 & 최적화
  ├── Gemini 3 기본화 (1M 컨텍스트)
  ├── Plan Mode (아키텍처 우선 개발)
  ├── SDK Package (프로그래매틱 통합)
  ├── Token-frugal reads (컨텍스트 최적화)
  └── Background Agents (자율 실행)

Phase 4 (2026 Q2+ 예상): 완전 자율
  ├── Background Agents 정식화
  ├── A2A (Agent-to-Agent) 프로토콜
  ├── Multi-agent 병렬 협업
  └── 자동 컨텍스트 컴팩션
```

### 8.2 bkit의 전략적 포지셔닝

Google의 CE 방향에서 bkit의 차별화 영역:

1. **방법론적 구조화 (PDCA)**: Conductor는 선형 워크플로우, bkit은 순환 개선 구조
2. **전문 에이전트 팀**: 16 전문 agent vs Conductor의 범용 접근
3. **멀티 레벨 적응**: Starter/Dynamic/Enterprise 자동 감지
4. **8개국어 자연어 인식**: 글로벌 개발자 접근성
5. **자동 품질 보증**: Gap analysis -> auto-iteration -> completion report

### 8.3 Context Engineering 원칙 적용 로드맵

```
v1.6.0: "Separation of Concerns"
  - Policy Engine으로 권한을 분리
  - Tool Registry에 alias layer 추가

v1.7.0: "Explicit Transformations"
  - Context Pipeline 패턴 (hook -> processor chain)
  - Per-agent context budget

v1.8.0: "Scope by Default"
  - Agent별 최소 컨텍스트 전달
  - Progressive Disclosure Level 3
  - Memory semantic search
```

---

## 9. GitHub Issue Tracking Matrix

### bkit에 직접 영향을 미치는 Open Issues

| Issue | Title | Impact | bkit Action |
|-------|-------|--------|-------------|
| **#19702** | Extension에 policy 파일 번들링 | HIGH | Policy 마이그레이션 의존 |
| **#19655** | MCP Policy Engine 강화 | MEDIUM | MCP 도구 정책 관리 |
| **#19599** | Sub-agent MCP tool validation 실패 | HIGH | Agent frontmatter 수정 |
| **#18712** | Sub-agent MCP server prefix 필요 | HIGH | MCP 도구명 접두사 추가 |
| **#18436** | Commands/Agents에 skills 필드 추가 | MEDIUM | TOML/Agent에 skill 자동 활성화 |
| **#18276** | Sub-agent Skills 지원 | MEDIUM | Agent 팀 모드 Skills 연동 |
| **#18271** | Agent/Sub-agent 통합 refactor | HIGH | 아키텍처 변경 대비 |
| **#15895** | Skills 핵심 아키텍처 미구현 | MEDIUM | Progressive Disclosure L3 |
| **#15180** | TOML 로딩 통합 | LOW | 확장 문법 호환성 검증 |
| **#19561** | Token-frugal reads | LOW | Skill/Agent 프롬프트 최적화 |

---

## 10. Recommendations

### 즉시 실행 (이번 주)

1. **v0.30.0-preview.3 설치 및 테스트** - 현재 bkit v1.5.3의 호환성 검증
2. **excludeTools deprecated 경고 확인** - gemini-extension.json 수정 필요 여부 판단
3. **Agent model 필드 확인** - `gemini-2.5-pro` -> `gemini-3-pro` 전환 필요 여부

### 단기 계획 (2주 이내)

4. **Policy Engine TOML 파일 생성** - bkit.config.json permissions 변환
5. **Tool Registry alias 레이어** - 미래 도구명 변경 방어
6. **MCP 도구 server prefix 테스트** - sub-agent에서의 동작 검증

### 중기 계획 (1개월)

7. **Context Pipeline 설계** - hook 기반에서 processor chain으로 전환
8. **SDK API 평가** - `@google/gemini-cli-core` 프로토타입
9. **Conductor 연동 설계** - PDCA <-> Conductor 상호운용성

---

## 11. Sources

### Official Documentation
- [Gemini CLI Releases](https://github.com/google-gemini/gemini-cli/releases)
- [v0.29.0 Changelog](https://geminicli.com/docs/changelogs/latest/)
- [v0.30.0-preview Changelog](https://geminicli.com/docs/changelogs/preview/)
- [Policy Engine Reference](https://geminicli.com/docs/reference/policy-engine)
- [Agent Skills Documentation](https://geminicli.com/docs/cli/skills/)
- [Extension Reference](https://geminicli.com/docs/extensions/reference/)
- [File System Tools Reference](https://geminicli.com/docs/tools/file-system/)

### Google Context Engineering
- [Context Engineering: Sessions & Memory (Whitepaper)](https://www.kaggle.com/whitepaper-context-engineering-sessions-and-memory)
- [ADK Context Documentation](https://google.github.io/adk-docs/context/)
- [ADK Context Compaction](https://google.github.io/adk-docs/context/compaction/)
- [ADK Sessions & Memory](https://google.github.io/adk-docs/sessions/memory/)
- [Conductor Extension](https://github.com/gemini-cli-extensions/conductor)
- [Google Developers Blog: Conductor](https://developers.googleblog.com/conductor-introducing-context-driven-development-for-gemini-cli/)
- [Gemini Embedding for RAG & Context Engineering](https://developers.googleblog.com/gemini-embedding-powering-rag-context-engineering/)

### GitHub Issues (Impact on bkit)
- [#19702 - Extension policy bundling](https://github.com/google-gemini/gemini-cli/issues/19702)
- [#19655 - MCP Policy Engine enhancements](https://github.com/google-gemini/gemini-cli/issues/19655)
- [#19599 - Sub-agent MCP tool validation](https://github.com/google-gemini/gemini-cli/issues/19599)
- [#18712 - Sub-agent MCP tool prefix](https://github.com/google-gemini/gemini-cli/issues/18712)
- [#18436 - Declarative skills field](https://github.com/google-gemini/gemini-cli/issues/18436)
- [#18276 - Sub-agent Skills support](https://github.com/google-gemini/gemini-cli/issues/18276)
- [#18271 - Agent unification refactor](https://github.com/google-gemini/gemini-cli/issues/18271)
- [#15895 - Skills core architecture gaps](https://github.com/google-gemini/gemini-cli/issues/15895)
- [#15180 - TOML loading centralization](https://github.com/google-gemini/gemini-cli/issues/15180)
- [#1391 - Tool naming consistency](https://github.com/google-gemini/gemini-cli/issues/1391)
- [#11525 - Tool name inconsistency](https://github.com/google-gemini/gemini-cli/issues/11525)

### Community & Analysis
- [TheUnwindAI: Extensions Combine MCP with Context Engineering](https://www.theunwindai.com/p/gemini-cli-extensions-combine-mcp-with-context-engineering)
- [InfoQ: Google Introduces Conductor](https://www.infoq.com/news/2026/01/google-conductor/)
- [Elastic: Context Engineering vs Prompt Engineering](https://www.elastic.co/search-labs/blog/context-engineering-vs-prompt-engineering)
- [Andrej Karpathy on Context Engineering](https://x.com/karpathy/status/1937902205765607626)

---

## Document Metadata

| Field | Value |
|-------|-------|
| **Document Type** | PDCA Analysis (Check Phase) |
| **Feature** | gemini-cli-version-upgrade-impact |
| **Version** | 1.0.0 |
| **Date** | 2026-02-21 |
| **Author** | bkit PDCA Analysis (AI-assisted) |
| **Scope** | Gemini CLI v0.22.0 ~ v0.30.0-preview.3 |
| **bkit Version** | v1.5.3 (current) -> v1.6.0+ (target) |
| **Gemini CLI Versions Analyzed** | v0.22.0, v0.23.0, v0.24.0, v0.25.0, v0.26.0, v0.27.0, v0.28.0, v0.29.0~v0.29.5, v0.30.0-preview.1~3 |
| **Sources Consulted** | Official docs, GitHub releases, GitHub issues (20+), Google whitepaper, Developer blogs, Community analysis |
