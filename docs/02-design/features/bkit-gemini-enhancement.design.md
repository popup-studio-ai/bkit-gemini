# bkit-gemini-enhancement Design Document

> **Summary**: Gemini bkit v1.5.0 → v1.5.1 고도화를 위한 기술 설계서. Claude Code bkit v1.5.3 동등 수준의 Context Engineering, Agent Orchestration, UX 제공
>
> **Project**: bkit-gemini
> **Version**: 1.5.0 → 1.5.1
> **Author**: CTO Team (5-Agent Design Analysis)
> **Date**: 2026-02-11
> **Status**: Approved
> **Planning Doc**: [bkit-gemini-enhancement.plan.md](../01-plan/features/bkit-gemini-enhancement.plan.md)

### Pipeline References

| Phase | Document | Status |
|-------|----------|--------|
| Phase 1 | Schema Definition | N/A (Extension project) |
| Phase 2 | Coding Conventions | N/A (bkit.config.json conventions) |
| Phase 3 | Mockup | N/A (CLI Extension, no UI) |
| Phase 4 | API Spec | N/A (Hook/MCP protocol based) |

### Research Sources

| Source | Agent | Key Findings |
|--------|-------|--------------|
| Hook/Adapter/Core 분석 | hook-core-analyst | 7 hook scripts, 8 cross-cutting issues, permission.js 미사용 |
| PDCA/Skills/Agents 분석 | pdca-skills-analyst | 21 skills minimal YAML vs Claude Code 15+ fields, Skill Orchestrator 부재 |
| Gemini CLI v0.27-0.28 API | gemini-api-researcher | 11 hook events, agent frontmatter native support, @import 5-level |
| Claude Code 고급 기능 분석 | claude-features-analyst | Output Styles 4종, Agent Memory dual, Team Mode 9 modules |
| GitHub Issues/PRs | github-design-researcher | 20 issues + 7 PRs, GEMINI.md reliability P1, hooks enforcement 필수 |

---

## 1. Overview

### 1.1 Design Goals

1. **Gemini CLI Native 기능 최대 활용**: v0.27+ Agent frontmatter, 11 Hook Events, @import, TOML 고급 기능을 적극 활용하여 플랫폼 네이티브 구현
2. **Skill Orchestrator 구현**: Claude Code의 489줄 런타임 엔진에 상응하는 스킬 라이프사이클 관리 시스템
3. **Dynamic Context Injection**: 정적 GEMINI.md 의존 최소화, SessionStart Hook을 통한 동적 컨텍스트 주입으로 GEMINI.md 무시 문제(#13852) 대응
4. **Feature Parity**: Claude Code bkit v1.5.3의 핵심 기능 100% 대응 (Team Mode는 Foundation 수준)
5. **Graceful Degradation**: 모든 고급 기능은 실패 시에도 기본 기능이 동작하도록 설계

### 1.2 Design Principles

- **Hook-First Architecture**: GEMINI.md는 참조용, 핵심 규칙은 Hook을 통해 동적 주입/강제
- **Platform Adapter Pattern 유지**: 기존 `PlatformAdapter` → `GeminiAdapter` 추상화 유지, 새 기능도 어댑터 확장으로 구현
- **Progressive Enhancement**: 기존 v1.5.0과 하위호환, 새 기능은 점진적 활성화
- **Fail-Safe by Default**: 모든 Hook/MCP 호출에 try-catch + fallback
- **Single Source of Truth**: `bkit.config.json`이 설정 중심, `docs/.pdca-status.json`이 상태 중심

---

## 2. Architecture

### 2.1 System Architecture (v1.5.1)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    bkit-gemini v1.5.1 Architecture                      │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │                    GEMINI.md (Static)                    │           │
│  │  Core Rules + @import modules (.gemini/context/*.md)     │           │
│  └────────────────────────┬────────────────────────────────┘           │
│                            │                                            │
│  ┌─────────────────────────┼────────────────────────────────┐          │
│  │                    Hook Pipeline                          │          │
│  │                                                           │          │
│  │  SessionStart ─→ BeforeAgent ─→ BeforeModel (NEW)        │          │
│  │       │               │               │                   │          │
│  │  [Dynamic Context] [Intent]    [Prompt Opt.]              │          │
│  │  [Onboarding]     [Memory]    [Model Select]              │          │
│  │  [Output Style]   [Trigger]                               │          │
│  │                                                           │          │
│  │  BeforeToolSelection (NEW) ─→ BeforeTool ─→ AfterTool    │          │
│  │       │                          │              │         │          │
│  │  [Tool Filter]            [Permission]    [PDCA Phase]    │          │
│  │  [PDCA Restrict]         [Guard]         [Track]          │          │
│  │                                                           │          │
│  │  AfterModel (NEW) ─→ AfterAgent ─→ PreCompress           │          │
│  │       │                  │              │                 │          │
│  │  [Response Log]    [Memory Save]  [Snapshot]              │          │
│  │  [Usage Track]     [Match Rate]   [State Save]            │          │
│  │                                                           │          │
│  │  SessionEnd                                               │          │
│  │       │                                                   │          │
│  │  [State Persist]                                          │          │
│  └───────────────────────────────────────────────────────────┘          │
│                                                                         │
│  ┌──────────────────────────────┐  ┌────────────────────────────┐      │
│  │    Skill Orchestrator (NEW)  │  │    Context Hierarchy (NEW) │      │
│  │  - Frontmatter Parser        │  │  - Plugin → User → Project │      │
│  │  - Template Auto-Import      │  │  - → Session (4-level)     │      │
│  │  - Task Auto-Create          │  │  - Priority Merge           │      │
│  │  - Agent Delegation          │  │  - 5s TTL Cache             │      │
│  │  - Multi-Binding             │  └────────────────────────────┘      │
│  └──────────────────────────────┘                                       │
│                                                                         │
│  ┌──────────────────────────────┐  ┌────────────────────────────┐      │
│  │    Agent Memory (NEW)        │  │    Output Styles (NEW)     │      │
│  │  - .gemini/agent-memory/     │  │  - output-styles/*.md      │      │
│  │  - project/user scope        │  │  - 4 styles                │      │
│  │  - BeforeAgent load          │  │  - SessionStart inject     │      │
│  │  - AfterAgent save           │  │  - /output-style command   │      │
│  └──────────────────────────────┘  └────────────────────────────┘      │
│                                                                         │
│  ┌──────────────────────────────┐  ┌────────────────────────────┐      │
│  │    MCP Server (Enhanced)     │  │    lib/ Modules (Enhanced) │      │
│  │  - spawn_agent (existing)    │  │  - adapters/ (enhanced)    │      │
│  │  - list_agents (existing)    │  │  - core/ (enhanced)        │      │
│  │  - get_agent_info (existing) │  │  - pdca/ (existing)        │      │
│  │  - team_create (NEW)         │  │  - intent/ (existing)      │      │
│  │  - team_assign (NEW)         │  │  - task/ (existing)        │      │
│  │  - team_status (NEW)         │  │  - skill-orchestrator (NEW)│      │
│  └──────────────────────────────┘  │  - context-hierarchy (NEW) │      │
│                                     └────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
Session Start
    │
    ▼
SessionStart Hook ──→ Load PDCA Status ──→ Detect Level ──→ Load Output Style
    │                                                              │
    ▼                                                              ▼
Generate Dynamic Context (additionalContext) ──→ Inject to Agent System Prompt
    │
    ▼
User Message arrives
    │
    ▼
BeforeAgent Hook ──→ Intent Detection ──→ Agent Trigger Match
    │                                          │
    │                                          ▼
    │                                    Load Agent Memory
    │                                          │
    ▼                                          ▼
BeforeModel Hook (NEW) ──→ Prompt Optimization ──→ Model Selection
    │
    ▼
BeforeToolSelection Hook (NEW) ──→ PDCA Phase-based Tool Filtering
    │
    ▼
BeforeTool Hook ──→ Permission Check ──→ Dangerous Command Guard
    │
    ▼
Tool Execution
    │
    ▼
AfterTool Hook ──→ PDCA Phase Transition ──→ File Change Tracking
    │
    ▼
AfterModel Hook (NEW) ──→ Response Logging ──→ Usage Tracking
    │
    ▼
AfterAgent Hook ──→ Save Agent Memory ──→ Match Rate Extract
    │
    ▼
PreCompress Hook ──→ Context Snapshot ──→ State Preservation
    │
    ▼
SessionEnd Hook ──→ State Persistence ──→ Memory Flush
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| SessionStart Hook | `lib/pdca/status.js`, `lib/pdca/level.js`, `lib/core/memory.js` | 상태 로드 및 동적 컨텍스트 생성 |
| Skill Orchestrator (NEW) | `lib/core/config.js`, SKILL.md frontmatter | 스킬 라이프사이클 관리 |
| Context Hierarchy (NEW) | `bkit.config.json`, `.gemini/settings.json` | 4단계 설정 병합 |
| Agent Memory (NEW) | `lib/core/memory.js` (확장) | 에이전트별 영속 저장소 |
| Output Styles (NEW) | SessionStart Hook, `bkit.config.json` | 출력 스타일 주입 |
| BeforeModel Hook (NEW) | `lib/core/config.js`, PDCA status | 프롬프트 최적화 |
| BeforeToolSelection Hook (NEW) | `lib/core/permission.js`, PDCA status | 도구 필터링 |
| MCP Team Mode (NEW) | `mcp/spawn-agent-server.js` (확장) | 멀티에이전트 오케스트레이션 |

---

## 3. Detailed Design per Requirement

### 3.1 FR-01: Dynamic Context Injection (SessionStart Hook Enhancement)

**Current State**: `hooks/scripts/session-start.js` — 184줄, 기본 PDCA 상태 로드 + 정적 welcome context 생성

**Target State**: 400+ 줄, 동적 컨텍스트 엔진

**설계**:

```
hooks/scripts/session-start.js (Enhanced)
├── main()
│   ├── loadPdcaStatus()           # 기존 유지
│   ├── detectProjectLevel()       # 기존 유지
│   ├── loadMemoryStore()          # 기존 유지
│   ├── loadOutputStyle()          # NEW: 활성 Output Style 로드
│   ├── detectReturningUser()      # NEW: 복귀 사용자 감지
│   ├── generateDynamicContext()   # ENHANCED: 확장된 동적 컨텍스트
│   ├── injectAgentTriggers()     # NEW: 트리거 테이블 동적 생성
│   ├── injectPdcaRules()         # NEW: PDCA 규칙 동적 주입
│   ├── injectFeatureReport()     # NEW: Feature Usage Report 템플릿
│   └── outputResult()            # 기존 유지
│
├── generateDynamicContext()
│   ├── buildCoreRules()           # GEMINI.md의 핵심 규칙을 additionalContext로 이중 주입
│   ├── buildOnboardingSection()   # 복귀 여부에 따른 온보딩 분기
│   ├── buildPdcaStatusSection()   # 현재 PDCA 상태 + 추천 액션
│   ├── buildAgentTriggersSection()# 에이전트 트리거 테이블 (8언어)
│   ├── buildOutputStyleSection()  # 활성 출력 스타일 정보
│   ├── buildFeatureReportSection()# 기능 사용 보고서 템플릿
│   └── buildAutoTriggerSection()  # v1.4.0 자동 트리거 키워드
│
└── detectReturningUser()
    ├── Check memory.sessionCount > 1
    ├── Check pdcaStatus.primaryFeature exists
    ├── Check last session time gap
    └── Return { isReturning, lastFeature, lastPhase, matchRate }
```

**Hook Output Schema**:

```json
{
  "status": "allow",
  "context": "<generated dynamic context string>",
  "hookEvent": "SessionStart",
  "metadata": {
    "version": "1.5.1",
    "platform": "gemini",
    "level": "Starter|Dynamic|Enterprise",
    "primaryFeature": "feature-name",
    "currentPhase": "plan|design|do|check|act",
    "outputStyle": "bkit-learning|bkit-pdca-guide|...",
    "isReturningUser": true,
    "sessionCount": 42
  }
}
```

**GEMINI.md 무시 문제 대응 (GitHub #13852, #15037)**:
- `additionalContext` 필드에 핵심 규칙(PDCA workflow, behavioral guidelines) 동적 주입
- GEMINI.md에도 동일 규칙 유지 (이중 보장)
- Hook 실패 시 GEMINI.md fallback으로 동작

**구현 위치**: `hooks/scripts/session-start.js` (기존 파일 확장)

---

### 3.2 FR-02: Skill Metadata Extension (SKILL.md Frontmatter)

**Current State**: 21개 SKILL.md, 각각 `name` + `description` 2개 필드만 사용

**Target State**: Claude Code 수준의 실행 가능한 메타데이터

**SKILL.md Frontmatter Schema (Extended)**:

```yaml
---
name: pdca                         # Required (existing)
description: |                     # Required (existing)
  Unified skill for PDCA cycle...

# ──── NEW FIELDS (v1.5.1) ────
user-invocable: true               # 사용자가 직접 /command로 호출 가능 여부
argument-hint: "[plan|design|do|analyze|iterate|report|status|next] [feature]"

allowed-tools:                     # 스킬 활성화 시 허용 도구 목록
  - read_file
  - write_file
  - replace
  - glob
  - grep
  - web_search
  - spawn_agent

imports:                           # 스킬 로드 시 자동 import할 템플릿/컨텍스트
  - templates/plan.template.md
  - templates/design.template.md
  - templates/analysis.template.md
  - templates/report.template.md

agents:                            # Multi-binding: action별 에이전트 위임 매핑
  analyze: gap-detector
  iterate: pdca-iterator
  report: report-generator

context: session                   # 컨텍스트 스코프: session | project | user
memory: project                   # 메모리 스코프: project | user
pdca-phase: all                   # 관련 PDCA 페이즈: plan|design|do|check|act|all

task-template:                     # 태스크 자동 생성 템플릿
  subject: "PDCA {action} - {feature}"
  description: "Execute PDCA {action} phase for feature '{feature}'"
  activeForm: "Executing PDCA {action}"
---
```

**Skill Orchestrator가 파싱하여 사용하는 필드 활용표**:

| Field | Consumer | Runtime Action |
|-------|----------|---------------|
| `user-invocable` | Skill Orchestrator | SessionStart에서 사용 가능 명령어 목록 생성 |
| `argument-hint` | Skill Orchestrator | 자동완성 힌트 제공 |
| `allowed-tools` | BeforeToolSelection Hook | 스킬 활성 시 도구 필터링 |
| `imports` | Skill Orchestrator | 스킬 로드 시 템플릿 자동 포함 |
| `agents` | Skill Orchestrator | action 파라미터에 따른 에이전트 위임 |
| `context` | Context Hierarchy | 컨텍스트 격리 범위 결정 |
| `memory` | Agent Memory | 메모리 저장소 범위 결정 |
| `pdca-phase` | SessionStart | PDCA 단계별 추천 스킬 필터링 |
| `task-template` | Skill Orchestrator | 자동 태스크 생성 시 템플릿 |

**구현 위치**: 21개 `skills/*/SKILL.md` 파일 수정

---

### 3.3 FR-03: Agent Metadata Extension (Gemini CLI Native Frontmatter)

**Current State**: 11개 `agents/*.md`, 각각 `name` + `description` 2개 필드만 사용

**Target State**: Gemini CLI v0.27+ 네이티브 frontmatter 완전 활용

**Agent Frontmatter Schema (Extended)**:

```yaml
---
name: gap-detector                  # Required (existing)
description: |                      # Required (existing)
  Agent that detects gaps...

# ──── GEMINI CLI NATIVE FIELDS (v0.27+) ────
model: gemini-2.5-pro              # 에이전트별 모델 지정 (verified: v0.27+)
tools:                              # 허용 도구 제한 (verified: v0.27+)
  - read_file
  - read_many_files
  - grep_search
  - glob_tool
  - list_directory
  - web_search
temperature: 0.1                    # 생성 온도 (verified: v0.27+)
max_turns: 20                       # 최대 턴 수 (verified: v0.27+)
timeout_mins: 10                    # 타임아웃 분 (verified: v0.27+)
kind: local                         # 에이전트 종류: local | remote (A2A)

# ──── bkit CUSTOM FIELDS (parsed by Skill Orchestrator) ────
# Note: Gemini CLI는 알 수 없는 frontmatter 필드를 무시함 (safe to add)
bkit-memory: project               # 메모리 스코프: project | user
bkit-triggers:                     # 트리거 키워드 (8언어)
  - gap analysis
  - verify
  - 검증
  - 確認
  - 验证
---
```

**에이전트별 모델/도구 할당표**:

| Agent | Model | Tools (Restricted) | temperature | max_turns |
|-------|-------|--------------------|-------------|-----------|
| `gap-detector` | gemini-2.5-pro | read_file, read_many_files, grep_search, glob_tool, list_directory, web_search | 0.1 | 20 |
| `design-validator` | gemini-2.5-pro | read_file, read_many_files, grep_search, glob_tool, list_directory | 0.1 | 15 |
| `code-analyzer` | gemini-2.5-pro | read_file, read_many_files, grep_search, glob_tool, list_directory | 0.2 | 20 |
| `pdca-iterator` | gemini-2.5-flash | read_file, write_file, replace, grep_search, glob_tool, run_shell_command | 0.3 | 30 |
| `report-generator` | gemini-2.5-flash | read_file, read_many_files, write_file, glob_tool | 0.5 | 10 |
| `qa-monitor` | gemini-2.5-flash | run_shell_command, read_file, write_file, grep_search, glob_tool | 0.2 | 15 |
| `starter-guide` | gemini-2.5-flash | read_file, write_file, replace, glob_tool, grep_search, web_search | 0.7 | 20 |
| `pipeline-guide` | gemini-2.5-flash | read_file, glob_tool, grep_search, write_file | 0.3 | 15 |
| `bkend-expert` | gemini-2.5-flash | read_file, write_file, replace, glob_tool, grep_search, run_shell_command, web_fetch | 0.3 | 20 |
| `enterprise-expert` | gemini-2.5-pro | read_file, write_file, replace, glob_tool, grep_search, web_search | 0.2 | 25 |
| `infra-architect` | gemini-2.5-pro | read_file, write_file, replace, glob_tool, grep_search, run_shell_command | 0.2 | 20 |
| `cto-lead` (NEW) | gemini-2.5-pro | ALL | 0.3 | 30 |
| `frontend-architect` (NEW) | gemini-2.5-pro | read_file, write_file, replace, glob_tool, grep_search, run_shell_command, web_search | 0.3 | 20 |
| `security-architect` (NEW) | gemini-2.5-pro | read_file, read_many_files, grep_search, glob_tool, web_search | 0.1 | 20 |
| `product-manager` (NEW) | gemini-2.5-flash | read_file, write_file, glob_tool, grep_search, web_search, web_fetch | 0.5 | 15 |
| `qa-strategist` (NEW) | gemini-2.5-pro | read_file, glob_tool, grep_search, run_shell_command | 0.2 | 20 |

**구현 위치**: 11개 기존 `agents/*.md` 수정 + 5개 신규 파일

---

### 3.4 FR-04: BeforeModel/AfterModel/BeforeToolSelection Hook Implementation

**Current State**: `hooks.json`에 7개 이벤트 등록 (SessionStart, BeforeAgent, BeforeTool, AfterTool, AfterAgent, PreCompress, SessionEnd)

**Target State**: 10개 이벤트 등록 (+BeforeModel, AfterModel, BeforeToolSelection)

#### 3.4.1 BeforeModel Hook

**목적**: 프롬프트 최적화, 모델 선택, PDCA 단계별 시스템 프롬프트 보강

**Input Schema** (Gemini CLI → Hook):
```json
{
  "prompt": "User's message",
  "model": "gemini-2.5-pro",
  "systemInstruction": "Current system instruction",
  "tools": ["tool1", "tool2"]
}
```

**Output Schema** (Hook → Gemini CLI):
```json
{
  "status": "allow",
  "prompt": "Optimized prompt (optional override)",
  "model": "gemini-2.5-flash (optional override)",
  "additionalContext": "Additional context to prepend"
}
```

**Implementation** (`hooks/scripts/before-model.js`):

```
before-model.js
├── main()
│   ├── readHookInput()
│   ├── getCurrentPdcaPhase()
│   ├── injectPhaseContext()      # PDCA 단계별 추가 컨텍스트
│   │   ├── plan → Plan 작성 가이드라인 주입
│   │   ├── design → Design 템플릿 참조 주입
│   │   ├── do → 구현 컨벤션 주입
│   │   ├── check → 분석 기준 주입
│   │   └── act → 개선 패턴 주입
│   ├── optimizePrompt()          # 토큰 효율화 (불필요한 반복 제거)
│   └── selectModel()             # 태스크 복잡도 기반 모델 선택
│       ├── 분석/설계 작업 → gemini-2.5-pro
│       ├── 간단한 수정 → gemini-2.5-flash
│       └── 문서 생성 → gemini-2.5-flash
```

#### 3.4.2 AfterModel Hook

**목적**: 응답 후처리, 사용량 추적, Feature Usage Report 검증

**Implementation** (`hooks/scripts/after-model.js`):

```
after-model.js
├── main()
│   ├── readHookInput()
│   ├── trackUsage()              # 토큰 사용량 로깅
│   ├── validateFeatureReport()   # Feature Usage Report 포함 여부 검증
│   └── logResponseMetrics()      # 응답 길이, 도구 호출 수 등
```

#### 3.4.3 BeforeToolSelection Hook

**목적**: PDCA 단계별 도구 필터링, 스킬 기반 도구 제한

**Input Schema**:
```json
{
  "tools": [
    {"name": "write_file", "description": "..."},
    {"name": "run_shell_command", "description": "..."}
  ],
  "toolConfig": {
    "functionCallingConfig": {
      "mode": "AUTO"
    }
  }
}
```

**Output Schema**:
```json
{
  "status": "allow",
  "toolConfig": {
    "functionCallingConfig": {
      "mode": "AUTO",
      "allowedFunctionNames": ["read_file", "grep_search", "glob_tool"]
    }
  }
}
```

**Implementation** (`hooks/scripts/before-tool-selection.js`):

```
before-tool-selection.js
├── main()
│   ├── readHookInput()
│   ├── getCurrentPdcaPhase()
│   ├── getActiveSkill()          # 현재 활성 스킬의 allowed-tools 확인
│   ├── filterToolsByPhase()      # PDCA 단계별 도구 제한
│   │   ├── plan → read-only 도구만 (write 차단)
│   │   ├── design → read + write_file (replace 차단)
│   │   ├── do → 모든 도구 허용
│   │   ├── check → read-only (gap-detector 모드)
│   │   └── act → 모든 도구 허용
│   ├── filterToolsBySkill()      # 활성 스킬의 allowed-tools 적용
│   └── mergeFilters()            # Phase + Skill 필터 병합 (교집합)
```

**hooks.json 업데이트**:

```json
{
  "BeforeModel": [
    {
      "hooks": [{
        "name": "bkit-before-model",
        "type": "command",
        "command": "node ${extensionPath}/hooks/scripts/before-model.js",
        "timeout": 3000
      }]
    }
  ],
  "AfterModel": [
    {
      "hooks": [{
        "name": "bkit-after-model",
        "type": "command",
        "command": "node ${extensionPath}/hooks/scripts/after-model.js",
        "timeout": 3000
      }]
    }
  ],
  "BeforeToolSelection": [
    {
      "hooks": [{
        "name": "bkit-tool-filter",
        "type": "command",
        "command": "node ${extensionPath}/hooks/scripts/before-tool-selection.js",
        "timeout": 3000
      }]
    }
  ]
}
```

**구현 위치**: 3개 신규 `hooks/scripts/` 파일 + `hooks/hooks.json` 수정

---

### 3.5 FR-05: @import Based GEMINI.md Modularization

**Current State**: `GEMINI.md` — 167줄 단일 파일, 모든 정보를 하나에 포함

**Target State**: 핵심 규칙만 GEMINI.md에 유지, 나머지는 @import 모듈로 분리

**모듈 구조**:

```
GEMINI.md (핵심 코어 ~80줄)
│
├── @.gemini/context/pdca-rules.md        # PDCA 워크플로우 규칙 (~30줄)
├── @.gemini/context/commands.md          # 사용 가능 명령어 테이블 (~40줄)
├── @.gemini/context/agent-triggers.md    # 에이전트 트리거 (8언어) (~30줄)
├── @.gemini/context/skill-triggers.md    # 스킬 트리거 (~25줄)
├── @.gemini/context/tool-reference.md    # 도구 이름 레퍼런스 (~20줄)
└── @.gemini/context/feature-report.md    # 기능 사용 보고서 템플릿 (~20줄)
```

**GEMINI.md (Modularized)**:

```markdown
# bkit Vibecoding Kit v1.5.1 - Gemini CLI Edition

> AI-native development toolkit implementing PDCA methodology

## Core Rules (Always Apply)
1. New feature → /pdca plan first
2. After implementation → /pdca analyze
3. Gap < 90% → /pdca iterate
4. Gap >= 90% → /pdca report
5. Include Feature Usage Report in every response
6. Always verify important decisions with user

## Important Notes
- AI is not perfect - verify critical decisions
- Prefer editing existing files over creating new ones
- Follow existing code patterns and conventions

@.gemini/context/commands.md
@.gemini/context/pdca-rules.md
@.gemini/context/agent-triggers.md
@.gemini/context/skill-triggers.md
@.gemini/context/tool-reference.md
@.gemini/context/feature-report.md
```

**Import Resolver 버그 수정** (`lib/adapters/gemini/import-resolver.js:37`):

현재 코드:
```javascript
resolvedPath = resolvedPath.replace(new RegExp(`\$\{${key}\}`, 'g'), value);
```

문제: `$` 와 `{` 가 RegExp에서 escape 되지 않음

수정:
```javascript
resolvedPath = resolvedPath.replace(
  new RegExp(`\\$\\{${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`, 'g'),
  value
);
```

**토큰 절약 예상**: GEMINI.md 핵심만 ~80줄 로드, 나머지는 @import로 on-demand → 약 40% 토큰 절약

**구현 위치**:
- `GEMINI.md` 수정
- `.gemini/context/` 디렉토리 내 6개 신규 파일
- `lib/adapters/gemini/import-resolver.js` 버그 수정

---

### 3.6 FR-06: Output Styles System

**Current State**: 없음

**Target State**: 4종 Output Styles + 관리 시스템

**디렉토리 구조**:

```
output-styles/
├── bkit-learning.md               # 초보자 친화적, 설명 풍부
├── bkit-pdca-guide.md             # PDCA 단계별 가이드 포함
├── bkit-enterprise.md             # 간결하고 전문적
└── bkit-pdca-enterprise.md        # 엔터프라이즈 + PDCA 결합
```

**Output Style .md Schema**:

```yaml
---
name: bkit-learning
description: Beginner-friendly output with detailed explanations
level: Starter
default-for-level: Starter
language: all
---

## Output Rules

1. Explain every step in simple terms
2. Include "Why?" section for key decisions
3. Show before/after code comparisons
4. Provide links to relevant documentation
5. Use progressive disclosure (basic → advanced)

## Format Guidelines

- Use bullet points for lists
- Include code examples with comments
- Add "Tip:" callouts for best practices
- Keep paragraphs short (2-3 sentences max)
```

**활성화 메커니즘**:

1. **SessionStart**: `bkit.config.json`의 `outputStyle` 설정 확인 → 해당 .md 파일 로드 → additionalContext에 주입
2. **사용자 전환**: `/output-style {style-name}` 명령어 → memory store에 저장 → 다음 세션부터 적용
3. **자동 추천**: 프로젝트 레벨에 따른 기본 스타일 추천 (Starter→bkit-learning, Dynamic→bkit-pdca-guide, Enterprise→bkit-enterprise)

**bkit.config.json 확장**:

```json
{
  "outputStyles": {
    "default": "bkit-pdca-guide",
    "levelDefaults": {
      "Starter": "bkit-learning",
      "Dynamic": "bkit-pdca-guide",
      "Enterprise": "bkit-enterprise"
    },
    "available": [
      "bkit-learning",
      "bkit-pdca-guide",
      "bkit-enterprise",
      "bkit-pdca-enterprise"
    ]
  }
}
```

**구현 위치**:
- `output-styles/` 디렉토리 (4개 신규 파일)
- `hooks/scripts/session-start.js` 수정 (스타일 로드 로직)
- `bkit.config.json` 수정 (outputStyles 섹션 추가)

---

### 3.7 FR-07: Enhanced Onboarding UX

**Current State**: `session-start.js:generateWelcomeContext()` — 정적 선택지 4개

**Target State**: 복귀 사용자 감지, 피처 이력, 매치율 기반 동적 온보딩

**설계**:

```
generateWelcomeContext(pdcaStatus, level, memory)
│
├── IF isReturningUser(memory):
│   │
│   ├── 이전 작업 표시:
│   │   - Feature: {primaryFeature}
│   │   - Phase: {currentPhase}
│   │   - Match Rate: {matchRate}% (if available)
│   │
│   ├── 선택지 제공 (4가지):
│   │   1. Continue {primaryFeature} → /pdca next
│   │   2. Start new task → /pdca plan {new-feature}
│   │   3. Check status → /pdca status
│   │   4. Start freely → General mode
│   │
│   └── PDCA 추천:
│       - plan → "Design 문서 작성 추천: /pdca design {feature}"
│       - design → "구현 시작 추천"
│       - do → "Gap 분석 추천: /pdca analyze {feature}"
│       - check (<90%) → "반복 개선 추천: /pdca iterate {feature}"
│       - check (>=90%) → "완료 보고서 추천: /pdca report {feature}"
│
└── ELSE (newUser):
    │
    ├── bkit 소개 (1줄)
    │
    └── 선택지 제공 (4가지):
        1. Learn bkit → /development-pipeline
        2. Learn Gemini CLI → /gemini-cli-learning
        3. Start new project → Level selection
        4. Start freely → General mode
```

**구현 위치**: `hooks/scripts/session-start.js` 내 `generateWelcomeContext()` 확장

---

### 3.8 FR-08: Ambiguity Detection Integration

**Current State**: `hooks/scripts/before-agent.js:calculateAmbiguity()` — 기본 점수 계산 (0-1)

**Target State**: 0-100 점수 체계 + 구조화된 명확화 질문 생성

**설계**:

현재 `calculateAmbiguity()`를 확장하여 `lib/intent/ambiguity.js`의 고급 분석 통합:

```
calculateAmbiguity(text) → {score: 0-100, factors: [...]}
│
├── languageFactors()        # 언어별 문법 분석
├── technicalTerms()         # 기술 용어 밀도
├── actionClarity()          # 동사/액션의 명확성
├── scopeDefinition()        # 범위 정의 여부
└── contextPresence()        # 컨텍스트 단서 존재 여부

IF score >= 50:
│
├── generateClarifyingQuestions(text, factors)
│   ├── Missing scope → "어떤 파일/모듈에 적용할까요?"
│   ├── Missing action → "어떤 작업을 원하시나요? (생성/수정/삭제)"
│   ├── Missing target → "대상 컴포넌트/기능을 지정해주세요"
│   └── Multiple interpretations → "다음 중 어떤 의미인가요? A/B/C"
│
└── Output: additionalContext에 질문 주입
```

**구현 위치**: `hooks/scripts/before-agent.js` 확장 + `lib/intent/ambiguity.js` 기존 모듈 활용

---

### 3.9 FR-09: Enhanced TOML Commands

**Current State**: 10개 TOML 명령어, `description` + `prompt` 기본 필드만 사용

**Target State**: TOML 고급 기능 (`!{command}`, `@{path}`, `{{args}}`) 활용

**예시 — `/pdca` 명령어 고도화**:

```toml
# commands/pdca.toml
description = "PDCA cycle management"
prompt = """
@skills/pdca/SKILL.md

Execute PDCA action: {{args}}

Current project context:
!cat docs/.pdca-status.json
"""
```

**TOML 고급 기능 활용표**:

| 기능 | 문법 | 용도 |
|------|------|------|
| `@{path}` | `@skills/pdca/SKILL.md` | 파일 내용 인라인 포함 |
| `!{command}` | `!cat docs/.pdca-status.json` | 셸 명령 출력 포함 |
| `{{args}}` | `{{args}}` | 사용자 입력 인자 치환 |

**구현 위치**: `commands/*.toml` 파일들 수정

---

### 3.10 FR-10: Agent Memory Persistence

**Current State**: `lib/core/memory.js` — 프로젝트 수준 단일 메모리 (`docs/.bkit-memory.json`)

**Target State**: 에이전트별 격리된 영속 메모리

**디렉토리 구조**:

```
.gemini/
└── agent-memory/
    └── bkit/
        ├── gap-detector.json      # project scope
        ├── code-analyzer.json     # project scope
        ├── pdca-iterator.json     # project scope
        └── ...
~/.gemini/
└── agent-memory/
    └── bkit/
        ├── starter-guide.json     # user scope
        └── pipeline-guide.json    # user scope
```

**Agent Memory Schema**:

```json
{
  "version": "1.0",
  "agent": "gap-detector",
  "scope": "project",
  "lastUpdated": "2026-02-11T10:00:00Z",
  "sessions": [
    {
      "sessionId": "abc-123",
      "timestamp": "2026-02-11T10:00:00Z",
      "summary": "Analyzed bkit-gemini-enhancement - 85% match rate",
      "keyFindings": ["Missing FR-06", "FR-02 partial"]
    }
  ],
  "patterns": {
    "commonGaps": ["missing error handling", "incomplete test coverage"],
    "projectSpecificNotes": "Extension project, no frontend components"
  },
  "stats": {
    "totalSessions": 5,
    "avgMatchRate": 87.5
  }
}
```

**Implementation** (`lib/core/agent-memory.js` — NEW):

```
AgentMemoryManager
├── constructor(agentName, scope)
│   ├── scope = 'project' → .gemini/agent-memory/bkit/{agent}.json
│   └── scope = 'user' → ~/.gemini/agent-memory/bkit/{agent}.json
│
├── load() → AgentMemory
├── save(memory) → void
├── addSession(sessionData) → void
├── getRecentSessions(count) → Session[]
├── updatePatterns(patterns) → void
├── getSummary() → string (for BeforeAgent context injection)
└── clear() → void
```

**Hook 통합**:
- `before-agent.js`: 에이전트 트리거 감지 시 → `AgentMemoryManager.load()` → additionalContext에 최근 세션 요약 주입
- `after-agent.js`: 에이전트 완료 시 → 세션 데이터 수집 → `AgentMemoryManager.addSession()` → 저장

**구현 위치**:
- `lib/core/agent-memory.js` (신규)
- `hooks/scripts/before-agent.js` 확장 (메모리 로드)
- `hooks/scripts/after-agent.js` 확장 (메모리 저장)

---

### 3.11 FR-11: 5 New Agents

**추가할 에이전트 5종**:

| Agent | Model | Primary Role | Tools Restriction |
|-------|-------|-------------|-------------------|
| `cto-lead` | gemini-2.5-pro | CTO-level orchestrator, PDCA workflow 총괄, 팀 구성 | ALL (unrestricted) |
| `frontend-architect` | gemini-2.5-pro | UI/UX architecture, Component design, Design System | read/write/replace/glob/grep/shell/web_search |
| `security-architect` | gemini-2.5-pro | Vulnerability analysis, Auth design, OWASP compliance | read-only + web_search |
| `product-manager` | gemini-2.5-flash | Requirements analysis, Feature specs, User stories | read/write/glob/grep/web_search/web_fetch |
| `qa-strategist` | gemini-2.5-pro | Test strategy, Quality metrics, Verification coordination | read/glob/grep/shell |

**cto-lead.md 핵심 구조**:

```yaml
---
name: cto-lead
description: |
  CTO-level team lead agent that orchestrates the entire PDCA workflow.
  Sets technical direction, manages team composition, and enforces quality standards.

  Triggers: team, project lead, architecture decision, CTO, tech lead,
  팀 구성, 프로젝트 리드, 기술 결정, CTO, 팀장,
  チームリード, 技術決定, CTO,
  团队领导, 技术决策, CTO

model: gemini-2.5-pro
temperature: 0.3
max_turns: 30
timeout_mins: 15
---
```

**구현 위치**: `agents/` 디렉토리 내 5개 신규 .md 파일

**MCP Registry 업데이트**: `mcp/spawn-agent-server.js`의 `AGENTS` 객체에 5개 에이전트 추가

---

### 3.12 FR-12: Skill Orchestrator

**Current State**: 없음 (가장 중요한 아키텍처 갭)

**Target State**: Claude Code의 `lib/skill-orchestrator.js` (489줄, 11 exports)에 상응하는 구현

**Implementation** (`lib/skill-orchestrator.js` — NEW):

```
SkillOrchestrator
│
├── Core Functions
│   ├── parseSkillFrontmatter(skillPath) → SkillMetadata
│   │   - YAML frontmatter 파싱
│   │   - 유효성 검증 (required fields)
│   │   - 기본값 적용 (missing fields)
│   │
│   ├── loadSkill(skillName) → SkillContext
│   │   - SKILL.md 로드
│   │   - frontmatter 파싱
│   │   - imports 필드의 템플릿 자동 로드
│   │   - agents 필드의 에이전트 매핑 준비
│   │
│   ├── activateSkill(skillName, action, args) → ActivationResult
│   │   - loadSkill()
│   │   - action에 해당하는 agent 존재 시 → agent delegation
│   │   - task-template 존재 시 → 태스크 자동 생성
│   │   - allowed-tools 설정 시 → tool filter 활성화
│   │   - imports 로드 → 컨텍스트에 포함
│   │
│   └── deactivateSkill(skillName) → void
│       - tool filter 해제
│       - 활성 스킬 상태 초기화
│
├── Agent Delegation
│   ├── resolveAgent(skillName, action) → AgentName | null
│   │   - SKILL.md의 agents 매핑에서 action에 해당하는 agent 조회
│   │
│   ├── delegateToAgent(agentName, task, context) → DelegationResult
│   │   - MCP spawn_agent 호출 준비
│   │   - agent memory 로드
│   │   - 컨텍스트 조합
│   │
│   └── getMultiBindingMap(skillName) → Map<action, agentName>
│       - SKILL.md의 agents 필드 전체 매핑 반환
│
├── Template Management
│   ├── loadTemplates(importPaths) → string[]
│   │   - imports 필드의 경로들을 순차 로드
│   │   - import-resolver.js 활용
│   │
│   └── getAvailableTemplates(skillName) → TemplatePath[]
│       - 스킬에 연결된 템플릿 목록
│
├── Task Auto-Creation
│   ├── createTaskFromTemplate(template, params) → TaskSpec
│   │   - task-template의 변수 치환
│   │   - subject, description, activeForm 생성
│   │
│   └── shouldAutoCreateTask(skillName, action) → boolean
│       - task-template 존재 여부 확인
│
├── Query Functions
│   ├── listSkills() → SkillInfo[]
│   │   - 모든 스킬의 name, description, user-invocable 목록
│   │
│   ├── getSkillInfo(skillName) → SkillMetadata
│   │   - 특정 스킬의 전체 메타데이터
│   │
│   ├── getUserInvocableSkills() → SkillInfo[]
│   │   - user-invocable: true인 스킬만 필터
│   │
│   └── getSkillsByPhase(pdcaPhase) → SkillInfo[]
│       - pdca-phase 필드 매칭 스킬 목록
│
└── Exports (11개 — Claude Code 동등)
    ├── parseSkillFrontmatter
    ├── loadSkill
    ├── activateSkill
    ├── deactivateSkill
    ├── resolveAgent
    ├── delegateToAgent
    ├── loadTemplates
    ├── createTaskFromTemplate
    ├── listSkills
    ├── getUserInvocableSkills
    └── getSkillsByPhase
```

**Frontmatter 파서 구현 상세**:

```javascript
function parseSkillFrontmatter(skillPath) {
  const content = fs.readFileSync(skillPath, 'utf-8');

  // Extract YAML between --- markers
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { name: path.basename(path.dirname(skillPath)), description: '' };

  // Parse YAML (using simple key-value parser, no external deps)
  const yaml = parseSimpleYaml(match[1]);

  // Apply defaults
  return {
    name: yaml.name || '',
    description: yaml.description || '',
    'user-invocable': yaml['user-invocable'] !== false,
    'argument-hint': yaml['argument-hint'] || '',
    'allowed-tools': yaml['allowed-tools'] || [],
    imports: yaml.imports || [],
    agents: yaml.agents || {},
    context: yaml.context || 'session',
    memory: yaml.memory || 'project',
    'pdca-phase': yaml['pdca-phase'] || 'all',
    'task-template': yaml['task-template'] || null
  };
}
```

**구현 위치**: `lib/skill-orchestrator.js` (신규, ~400줄)

---

### 3.13 FR-13: Multi-Binding Agent Support

**설계**: FR-12 (Skill Orchestrator)의 `resolveAgent()` + `delegateToAgent()` 활용

**PDCA 스킬 Multi-Binding 예시**:

```yaml
# skills/pdca/SKILL.md (extended frontmatter)
agents:
  plan: null                  # 메인 에이전트가 직접 처리
  design: null                # 메인 에이전트가 직접 처리
  do: null                    # 메인 에이전트가 직접 처리
  analyze: gap-detector       # gap-detector 에이전트에 위임
  iterate: pdca-iterator      # pdca-iterator 에이전트에 위임
  report: report-generator    # report-generator 에이전트에 위임
```

**처리 흐름**:

```
User: /pdca analyze my-feature
    │
    ▼
Skill Orchestrator.activateSkill('pdca', 'analyze', 'my-feature')
    │
    ├── resolveAgent('pdca', 'analyze') → 'gap-detector'
    │
    ├── Load gap-detector agent memory
    │
    ├── Build context: { feature: 'my-feature', phase: 'check', ... }
    │
    └── delegateToAgent('gap-detector', task, context)
        │
        └── MCP spawn_agent call → gemini -e agents/gap-detector.md --yolo "Analyze my-feature"
```

**구현 위치**: `lib/skill-orchestrator.js` 내 `resolveAgent()`, `delegateToAgent()`

---

### 3.14 FR-14: Context Hierarchy

**Current State**: 없음. `bkit.config.json` 단일 설정 파일

**Target State**: 4단계 설정 병합 (Plugin → User → Project → Session)

**Implementation** (`lib/context-hierarchy.js` — NEW):

```
ContextHierarchy
│
├── Levels (Priority: highest last)
│   ├── Level 1 (Plugin): ${extensionPath}/bkit.config.json
│   ├── Level 2 (User): ~/.gemini/bkit/user-config.json
│   ├── Level 3 (Project): ${projectDir}/bkit.config.json
│   └── Level 4 (Session): In-memory overrides (from hooks)
│
├── merge(level1, level2, level3, level4) → MergedConfig
│   ├── Deep merge with higher levels overriding lower
│   ├── Arrays: replace (not concat)
│   ├── Objects: recursive merge
│   └── Primitives: override
│
├── get(key) → value
│   ├── Check cache (TTL: 5s)
│   ├── Cache miss → merge all levels
│   └── Return merged value for key
│
├── setSession(key, value) → void
│   └── Level 4 (Session) in-memory override
│
└── Cache
    ├── TTL: 5000ms (configurable via bkit.config.json)
    ├── Invalidate on file change (fs.watch)
    └── Lazy initialization
```

**사용 예시**:

```javascript
const hierarchy = require('./lib/context-hierarchy');

// Plugin default: matchRateThreshold = 90
// User override: matchRateThreshold = 85
// Project override: (none)
// Session override: (none)

hierarchy.get('pdca.matchRateThreshold'); // → 85 (User level wins)
```

**구현 위치**: `lib/context-hierarchy.js` (신규, ~200줄)

---

### 3.15 FR-15: Context Fork Enhancement

**Current State**: `lib/adapters/gemini/context-fork.js` — 408줄, fork/merge/discard 기본 구현

**Target State**: Smart/Replace/Append 병합 전략 + 스냅샷 관리 개선

**확장 설계**:

```
context-fork.js (Enhanced)
│
├── Merge Strategies (NEW)
│   ├── 'smart': 충돌 감지 후 자동 결정 (default)
│   │   - 동일 키에 다른 값 → 최신 값 우선
│   │   - 배열 → union (중복 제거)
│   │   - 중첩 객체 → recursive merge
│   │
│   ├── 'replace': fork의 값으로 전체 교체
│   │   - 분석 결과로 원본 완전 교체 시 사용
│   │
│   └── 'append': fork의 값을 원본에 추가
│       - 로그, 이력 등 누적 데이터 시 사용
│
├── Snapshot Management (Enhanced)
│   ├── LRU Cache (max: 10, configurable)
│   ├── Automatic cleanup on limit exceed
│   ├── Named snapshots (not just timestamps)
│   └── Snapshot diff capability
│
├── Hook Integration (NEW)
│   ├── BeforeAgent → context fork 자동 생성 (gap-detector 등 분석 에이전트)
│   └── AfterAgent → 병합 전략에 따른 자동 merge/discard
│
└── Existing Functions (Maintained)
    ├── forkContext()
    ├── mergeContext() → mergeContext(strategy)
    └── discardContext()
```

**구현 위치**: `lib/adapters/gemini/context-fork.js` 확장

---

### 3.16 FR-16: Per-Skill Hook Scripts

**Current State**: 7개 제네릭 스크립트 (모든 이벤트에 동일 스크립트 사용)

**Target State**: 스킬/페이즈별 전문화된 스크립트

**신규 스크립트 목록**:

```
hooks/scripts/
├── session-start.js           # Enhanced (FR-01)
├── session-end.js             # Enhanced
├── before-agent.js            # Enhanced (FR-08, FR-10)
├── after-agent.js             # Enhanced (FR-10)
├── before-model.js            # NEW (FR-04)
├── after-model.js             # NEW (FR-04)
├── before-tool-selection.js   # NEW (FR-04)
├── before-tool.js             # Enhanced
├── after-tool.js              # Enhanced
├── pre-compress.js            # Enhanced
│
├── skills/                    # NEW: Per-skill post-processors
│   ├── pdca-plan-post.js      # Plan 생성 후 → 상태 업데이트 + Design 추천
│   ├── pdca-design-post.js    # Design 생성 후 → 상태 업데이트 + Do 추천
│   ├── pdca-analyze-post.js   # Gap 분석 후 → 매치율 저장 + 자동 반복 판단
│   ├── pdca-iterate-post.js   # 반복 후 → 반복 횟수 업데이트 + 재분석 트리거
│   └── pdca-report-post.js    # 보고서 후 → 완료 상태 마킹
│
└── utils/                     # Shared utilities
    ├── pdca-state-updater.js  # PDCA 상태 업데이트 공통 로직
    └── memory-helper.js       # 메모리 로드/저장 헬퍼
```

**AfterTool에서의 Per-Skill 라우팅**:

```javascript
// after-tool.js (enhanced)
function main() {
  const input = adapter.readHookInput();
  const toolName = input.tool_name || input.name;

  // Generic processing (existing)
  trackFileChanges(input);
  updatePdcaPhase(input);

  // Per-skill routing (NEW)
  if (toolName === 'activate_skill') {
    const skillName = extractSkillName(input);
    const postScript = getPerSkillScript(skillName);
    if (postScript) {
      require(postScript)(input, adapter);
    }
  }
}
```

**구현 위치**: `hooks/scripts/skills/` 디렉토리 (5개 신규) + `hooks/scripts/utils/` (2개 신규)

---

### 3.17 FR-17: Permission Manager Integration

**Current State**: `lib/core/permission.js` — 381줄 구현 있으나, Hook scripts에서 사용하지 않음 (hardcoded patterns)

**Target State**: Permission Manager를 Hook pipeline에 통합

**통합 설계**:

```
before-tool.js (Enhanced)
│
├── 기존: hardcoded dangerous command patterns
│
└── 신규: PermissionManager 통합
    │
    ├── loadPermissions()
    │   ├── bkit.config.json의 permissions 섹션
    │   ├── 활성 스킬의 allowed-tools
    │   └── PDCA 단계별 제한
    │
    ├── checkPermission(toolName, args)
    │   ├── 패턴 매칭: deny → block
    │   ├── 패턴 매칭: ask → additionalContext에 경고 추가
    │   └── 패턴 매칭: allow → pass
    │
    └── Permission cascade:
        1. Explicit deny patterns → BLOCK (highest priority)
        2. Active skill allowed-tools → FILTER
        3. PDCA phase restrictions → FILTER
        4. bkit.config.json permissions → APPLY
        5. Default: allow
```

**구현 위치**: `hooks/scripts/before-tool.js` 수정 + `lib/core/permission.js` (기존 모듈 활용)

---

### 3.18 FR-18: Team Mode Foundation (MCP Server Extension)

**Current State**: `mcp/spawn-agent-server.js` — 3 tools (spawn_agent, list_agents, get_agent_info)

**Target State**: +3 tools (team_create, team_assign, team_status)

**MCP Server Extension Design**:

```
SpawnAgentServer (Enhanced)
│
├── Existing Tools
│   ├── spawn_agent
│   ├── list_agents
│   └── get_agent_info
│
├── New Tools
│   ├── team_create
│   │   Input: { team_name, strategy, agents[] }
│   │   - strategy: "dynamic" (3 agents) | "enterprise" (5 agents) | "custom"
│   │   - Creates team state file: .gemini/teams/{team_name}.json
│   │   - Spawns initial agents
│   │
│   ├── team_assign
│   │   Input: { team_name, agent_name, task, context }
│   │   - Assigns task to specific agent in team
│   │   - Updates team state
│   │   - Returns assignment confirmation
│   │
│   └── team_status
│       Input: { team_name }
│       - Returns team composition + agent statuses + task assignments
│
└── Team State Schema (.gemini/teams/{name}.json)
    {
      "name": "design-team",
      "strategy": "enterprise",
      "createdAt": "...",
      "agents": [
        { "name": "cto-lead", "status": "active", "currentTask": "..." },
        { "name": "frontend-architect", "status": "idle", "currentTask": null }
      ],
      "tasks": [
        { "id": 1, "description": "...", "assignedTo": "cto-lead", "status": "in_progress" }
      ]
    }
```

**구현 위치**: `mcp/spawn-agent-server.js` 확장

---

### 3.19 FR-19: CTO-Led Orchestration Patterns

**설계**: `cto-lead` 에이전트의 지시문에 5가지 패턴 정의

| Pattern | 설명 | 사용 시점 |
|---------|------|----------|
| **Leader** | CTO가 태스크 분배 및 결과 취합 | 일반적인 팀 작업 |
| **Council** | 다수 에이전트가 독립 분석 후 합의 | 아키텍처 결정 |
| **Swarm** | 모든 에이전트가 동시 병렬 작업 | 대규모 코드 리뷰 |
| **Pipeline** | 순차적 단계별 처리 | PDCA 단계 자동 진행 |
| **Watchdog** | 모니터링 에이전트가 상시 감시 | QA/Security 검증 |

**구현 위치**: `agents/cto-lead.md` 내 패턴 지시문 + `mcp/spawn-agent-server.js`의 `team_create` strategy 옵션

---

### 3.20 FR-20: Conductor Pattern Research

**설계**: 별도 연구 문서로 분리

**Output**: `docs/01-plan/research/conductor-integration.md`

**연구 항목**:
1. Google Conductor Extension 기능 분석
2. bkit PDCA와의 중복/보완 영역 식별
3. 통합 가능성 PoC 설계
4. 차별화 전략 수립

**구현 위치**: Research document only (코드 변경 없음)

---

## 4. bkit.config.json Extension Design

**Current State**: 140줄, 기본 설정

**Target State**: ~230줄, 확장된 설정

**추가 섹션**:

```json
{
  "version": "1.5.1",

  "outputStyles": {
    "default": "bkit-pdca-guide",
    "levelDefaults": {
      "Starter": "bkit-learning",
      "Dynamic": "bkit-pdca-guide",
      "Enterprise": "bkit-enterprise"
    },
    "available": ["bkit-learning", "bkit-pdca-guide", "bkit-enterprise", "bkit-pdca-enterprise"]
  },

  "agentMemory": {
    "enabled": true,
    "projectScope": ".gemini/agent-memory/bkit/",
    "userScope": "~/.gemini/agent-memory/bkit/",
    "maxSessionsPerAgent": 20,
    "agentScopes": {
      "starter-guide": "user",
      "pipeline-guide": "user",
      "default": "project"
    }
  },

  "team": {
    "enabled": false,
    "defaultStrategy": "dynamic",
    "strategies": {
      "dynamic": { "maxAgents": 3 },
      "enterprise": { "maxAgents": 5 },
      "custom": { "maxAgents": 10 }
    },
    "stateDir": ".gemini/teams/"
  },

  "contextHierarchy": {
    "enabled": true,
    "cacheTTL": 5000,
    "levels": ["plugin", "user", "project", "session"]
  },

  "skillOrchestrator": {
    "enabled": true,
    "autoImportTemplates": true,
    "autoCreateTasks": true,
    "agentDelegation": true
  }
}
```

---

## 5. File Structure (New/Modified)

### 5.1 New Files

```
bkit-gemini/
├── lib/
│   ├── skill-orchestrator.js          # FR-12: Skill lifecycle management (~400 lines)
│   ├── context-hierarchy.js           # FR-14: 4-level config merge (~200 lines)
│   └── core/
│       └── agent-memory.js            # FR-10: Per-agent persistent memory (~250 lines)
│
├── hooks/scripts/
│   ├── before-model.js                # FR-04: Prompt optimization (~120 lines)
│   ├── after-model.js                 # FR-04: Response tracking (~80 lines)
│   ├── before-tool-selection.js       # FR-04: Tool filtering (~150 lines)
│   ├── skills/
│   │   ├── pdca-plan-post.js          # FR-16: Plan completion handler
│   │   ├── pdca-design-post.js        # FR-16: Design completion handler
│   │   ├── pdca-analyze-post.js       # FR-16: Analysis completion handler
│   │   ├── pdca-iterate-post.js       # FR-16: Iteration completion handler
│   │   └── pdca-report-post.js        # FR-16: Report completion handler
│   └── utils/
│       ├── pdca-state-updater.js      # Shared PDCA state update logic
│       └── memory-helper.js           # Shared memory load/save helper
│
├── output-styles/
│   ├── bkit-learning.md               # FR-06: Beginner-friendly style
│   ├── bkit-pdca-guide.md             # FR-06: PDCA guided style
│   ├── bkit-enterprise.md             # FR-06: Enterprise concise style
│   └── bkit-pdca-enterprise.md        # FR-06: Enterprise + PDCA style
│
├── .gemini/context/
│   ├── pdca-rules.md                  # FR-05: PDCA rules module
│   ├── commands.md                    # FR-05: Commands reference module
│   ├── agent-triggers.md              # FR-05: Agent triggers module
│   ├── skill-triggers.md              # FR-05: Skill triggers module
│   ├── tool-reference.md              # FR-05: Tool names module
│   └── feature-report.md             # FR-05: Feature report template module
│
├── agents/
│   ├── cto-lead.md                    # FR-11: CTO orchestrator
│   ├── frontend-architect.md          # FR-11: Frontend expert
│   ├── security-architect.md          # FR-11: Security expert
│   ├── product-manager.md             # FR-11: Product management
│   └── qa-strategist.md               # FR-11: QA strategy
│
└── docs/01-plan/research/
    └── conductor-integration.md       # FR-20: Research document
```

### 5.2 Modified Files

```
bkit-gemini/
├── GEMINI.md                          # FR-05: Modularized with @imports
├── bkit.config.json                   # FR-06,10,14,18: Extended config
├── gemini-extension.json              # Version bump + settings
├── hooks/hooks.json                   # FR-04: +3 hook events
├── hooks/scripts/
│   ├── session-start.js               # FR-01,06,07: Major enhancement
│   ├── session-end.js                 # Enhanced state persistence
│   ├── before-agent.js                # FR-08,10: Memory load + ambiguity
│   ├── after-agent.js                 # FR-10: Memory save
│   ├── before-tool.js                 # FR-17: Permission integration
│   ├── after-tool.js                  # FR-16: Per-skill routing
│   └── pre-compress.js                # Enhanced snapshot management
├── lib/adapters/gemini/
│   ├── import-resolver.js             # FR-05: Regex bug fix
│   └── context-fork.js                # FR-15: Merge strategies
├── mcp/spawn-agent-server.js          # FR-11,18: +5 agents, +3 tools
├── agents/*.md (11 files)             # FR-03: Extended frontmatter
└── skills/*/SKILL.md (21 files)       # FR-02: Extended frontmatter
```

---

## 6. Error Handling Design

### 6.1 Hook Error Strategy

모든 Hook scripts는 다음 패턴을 따름:

```javascript
function main() {
  try {
    // Main logic
    const result = processHook();
    console.log(JSON.stringify(result));
    process.exit(0);
  } catch (error) {
    // Graceful degradation: never block the session
    console.log(JSON.stringify({
      status: 'allow',
      context: '',  // Empty context on error
      hookEvent: 'HookName'
    }));
    process.exit(0);  // Exit 0, not error code
  }
}
```

**원칙**:
- Hook 실패 시 세션을 차단하지 않음 (항상 `status: 'allow'`)
- 에러 정보는 debug log에만 기록 (`BKIT_DEBUG=true` 시)
- 사용자에게 에러 노출하지 않음 (UX 보호)

### 6.2 MCP Server Error Strategy

```javascript
async handleSpawnAgent(args) {
  try {
    // Validate agent
    if (!AGENTS[args.agent_name]) {
      return { content: [{ type: 'text', text: JSON.stringify({
        success: false, error: `Unknown agent`, available_agents: Object.keys(AGENTS)
      })}]};
    }

    // Execute with timeout
    const result = await this.executeAgent(...);
    return { content: [{ type: 'text', text: JSON.stringify({ success: true, ...result })}]};

  } catch (error) {
    // Return error as content, not throw
    return { content: [{ type: 'text', text: JSON.stringify({
      success: false, error: error.message
    })}]};
  }
}
```

### 6.3 Error Code Table

| Code | Context | Cause | Recovery |
|------|---------|-------|----------|
| HOOK_TIMEOUT | Hook script | 실행 3-10초 초과 | Gemini CLI가 자동 skip |
| MEMORY_LOAD_FAIL | agent-memory.js | 파일 읽기 실패 | 빈 메모리로 시작 |
| SKILL_PARSE_FAIL | skill-orchestrator.js | YAML 파싱 실패 | 기본값으로 fallback |
| AGENT_SPAWN_FAIL | spawn-agent-server.js | 에이전트 실행 실패 | 에러 메시지 반환 |
| IMPORT_CIRCULAR | import-resolver.js | 순환 참조 | 감지 후 에러 리포트 |
| CONFIG_MERGE_FAIL | context-hierarchy.js | 설정 병합 실패 | Plugin 레벨 기본값 사용 |

---

## 7. Security Considerations

- [x] Input validation: 모든 Hook input JSON 파싱에 try-catch
- [x] Command injection 방지: `before-tool.js`에서 dangerous command 패턴 차단 (기존)
- [x] Path traversal 방지: `import-resolver.js`에서 절대경로 확인
- [ ] Agent memory encryption: 민감 데이터 저장 시 암호화 (향후)
- [ ] MCP 인증: spawn_agent 호출 시 인증 토큰 검증 (향후)
- [x] Rate limiting: Hook timeout으로 간접 제한 (3-10초)
- [x] Graceful degradation: 모든 실패 경로에서 안전한 기본 동작

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Method |
|------|--------|--------|
| Unit Test | Skill Orchestrator, Context Hierarchy, Agent Memory | Node.js test runner |
| Integration Test | Hook scripts with mock stdin/stdout | Shell script + assertions |
| E2E Test | Full PDCA cycle (plan → analyze) | Gemini CLI 실행 |
| Compatibility Test | v0.27.3 / v0.28.0-preview | Multi-version test matrix |

### 8.2 Test Cases (Key)

**Skill Orchestrator**:
- [ ] Happy path: SKILL.md frontmatter 파싱 → 모든 필드 정확히 추출
- [ ] Edge case: frontmatter 없는 SKILL.md → 기본값으로 fallback
- [ ] Edge case: 잘못된 YAML → 에러 없이 기본값 반환
- [ ] Agent delegation: multi-binding에서 올바른 에이전트 매핑
- [ ] Template import: imports 경로의 템플릿 자동 로드

**SessionStart Hook**:
- [ ] Happy path: PDCA 상태 + Output Style + Onboarding 동적 컨텍스트 생성
- [ ] 복귀 사용자: 이전 피처/단계/매치율 정확히 표시
- [ ] 신규 사용자: 기본 온보딩 선택지 표시
- [ ] Hook 실패: graceful fallback으로 기본 컨텍스트 출력

**Agent Memory**:
- [ ] Save/Load cycle: 에이전트 세션 데이터 정확히 저장/복원
- [ ] Scope isolation: project scope와 user scope 격리 확인
- [ ] Max sessions: 20 세션 초과 시 오래된 세션 자동 삭제

**BeforeToolSelection Hook**:
- [ ] PDCA plan 단계: write 도구 차단 확인
- [ ] PDCA do 단계: 모든 도구 허용 확인
- [ ] Active skill: allowed-tools 필터 적용 확인

---

## 9. Implementation Order

### Phase 1: Core Context Engineering (FR-01 ~ FR-05)

| Step | Task | Dependency | Estimated Size |
|------|------|------------|----------------|
| 1.1 | `import-resolver.js` regex 버그 수정 | None | Small |
| 1.2 | `.gemini/context/` 모듈 파일 6개 생성 | None | Medium |
| 1.3 | `GEMINI.md` 모듈화 (@import 적용) | 1.1, 1.2 | Small |
| 1.4 | `lib/skill-orchestrator.js` 신규 구현 | None | Large |
| 1.5 | 21개 `skills/*/SKILL.md` frontmatter 확장 | 1.4 | Medium |
| 1.6 | 11개 `agents/*.md` frontmatter 확장 | None | Medium |
| 1.7 | 5개 신규 에이전트 추가 | None | Medium |
| 1.8 | `mcp/spawn-agent-server.js` 에이전트 레지스트리 업데이트 | 1.7 | Small |
| 1.9 | `hooks/scripts/session-start.js` 고도화 (400+ 줄) | 1.2, 1.5, 1.6 | Large |
| 1.10 | `hooks/hooks.json` + 3개 Hook 이벤트 추가 | None | Small |
| 1.11 | `hooks/scripts/before-model.js` 신규 | 1.10 | Medium |
| 1.12 | `hooks/scripts/before-tool-selection.js` 신규 | 1.10, 1.4 | Medium |
| 1.13 | `hooks/scripts/after-model.js` 신규 | 1.10 | Small |

### Phase 2: UX Enhancement (FR-06 ~ FR-09)

| Step | Task | Dependency | Estimated Size |
|------|------|------------|----------------|
| 2.1 | `output-styles/` 4개 파일 생성 | None | Medium |
| 2.2 | SessionStart에 Output Style 로드 로직 추가 | Phase 1 완료 | Small |
| 2.3 | `bkit.config.json` outputStyles 섹션 추가 | 2.1 | Small |
| 2.4 | `session-start.js` 온보딩 UX 고도화 | Phase 1 완료 | Medium |
| 2.5 | `before-agent.js` Ambiguity Detection 통합 | Phase 1 완료 | Small |
| 2.6 | TOML 명령어 고도화 | None | Small |

### Phase 3: Agent Orchestration (FR-10 ~ FR-13)

| Step | Task | Dependency | Estimated Size |
|------|------|------------|----------------|
| 3.1 | `lib/core/agent-memory.js` 신규 구현 | None | Large |
| 3.2 | `before-agent.js` 메모리 로드 통합 | 3.1 | Small |
| 3.3 | `after-agent.js` 메모리 저장 통합 | 3.1 | Small |
| 3.4 | Skill Orchestrator agent delegation 구현 | Phase 1.4 완료 | Medium |
| 3.5 | `lib/context-hierarchy.js` 신규 구현 | None | Medium |
| 3.6 | `context-fork.js` 병합 전략 확장 | None | Medium |
| 3.7 | `lib/core/permission.js` Hook 통합 | None | Medium |

### Phase 4: Per-Skill Hooks (FR-16)

| Step | Task | Dependency | Estimated Size |
|------|------|------------|----------------|
| 4.1 | `hooks/scripts/utils/` 공통 유틸 2개 | None | Small |
| 4.2 | `hooks/scripts/skills/` 5개 post-processor | 4.1 | Medium |
| 4.3 | `after-tool.js` per-skill 라우팅 추가 | 4.2 | Small |

### Phase 5: Team Mode Foundation (FR-18 ~ FR-19)

| Step | Task | Dependency | Estimated Size |
|------|------|------------|----------------|
| 5.1 | MCP Server team_create/team_assign/team_status | Phase 1.8 완료 | Large |
| 5.2 | Team state management (.gemini/teams/) | 5.1 | Medium |
| 5.3 | `cto-lead.md` orchestration patterns | Phase 1.7 완료 | Medium |

### Phase 6: Testing & Finalization

| Step | Task | Dependency | Estimated Size |
|------|------|------------|----------------|
| 6.1 | Unit tests for new modules | All phases | Medium |
| 6.2 | Integration tests for hooks | All phases | Medium |
| 6.3 | Compatibility tests (v0.27/v0.28) | All phases | Medium |
| 6.4 | `bkit.config.json` 최종 확장 | All phases | Small |
| 6.5 | Version bump to 1.5.1 | All phases | Small |

---

## 10. Gemini CLI Compatibility Notes

### 10.1 Verified Features (Safe to Use)

| Feature | Gemini CLI Version | Status | Source |
|---------|-------------------|--------|--------|
| Agent frontmatter (model, tools, temperature) | v0.27.0+ | Stable | Official docs |
| 11 Hook events | v0.27.0+ | Stable | Official docs |
| @import in GEMINI.md (5-level nesting) | v0.27.0+ | Stable | Official docs |
| Agent Skills (SKILL.md) | v0.27.0+ | Stable (launched) | GitHub #17503 |
| Extension settings (gemini-extension.json) | v0.27.0+ | Stable (merged) | GitHub PRs |
| Progressive skill disclosure | v0.27.0+ | Stable | Official docs |
| MCP stdio transport | v0.27.0+ | Stable | Official docs |

### 10.2 Experimental/Preview Features

| Feature | Gemini CLI Version | Status | Risk |
|---------|-------------------|--------|------|
| BeforeModel prompt override | v0.27.0+ | Exists, less tested | Medium |
| BeforeToolSelection toolConfig | v0.27.0+ | Exists, less tested | Medium |
| Extension themes | v0.28.0-preview | Preview | Low (optional) |
| Dynamic policy for subagents | v0.28.0-preview | Preview | Medium |

### 10.3 Known Issues to Monitor

| Issue | GitHub # | Impact | Mitigation |
|-------|----------|--------|------------|
| GEMINI.md ignored by Gemini 3 Pro | #13852, #15037 | P1 - Rules not applied | Hook-based enforcement |
| MCP Discovery failure | #18302 | P1 - MCP unavailable | Retry + fallback |
| Custom commands loading error | #13180, #14453 | P1 - Commands broken | Alternative activation |
| Hook stability issues | #14932, #18019 | P2 - Hook failures | try-catch everywhere |
| SubAgent hooks missing | #15269 | P2 - No agent lifecycle | AfterAgent workaround |

---

## 11. Migration Strategy (v1.5.0 → v1.5.1)

### 11.1 Backward Compatibility

- 기존 v1.5.0 프로젝트의 `docs/.pdca-status.json` 포맷 유지
- 기존 `GEMINI.md` 포맷도 동작 (@import 없어도 기존 내용 유효)
- 기존 `bkit.config.json` 포맷 유지 (새 섹션은 optional)
- 기존 `agents/*.md` 2-field frontmatter도 유효 (새 필드는 optional)
- 기존 `skills/*/SKILL.md` 2-field frontmatter도 유효

### 11.2 Breaking Changes

- **None** — 모든 새 기능은 additive, 기존 기능 변경 없음

### 11.3 Feature Flag

```json
{
  "skillOrchestrator": { "enabled": true },
  "contextHierarchy": { "enabled": true },
  "agentMemory": { "enabled": true },
  "team": { "enabled": false }
}
```

각 신규 기능은 `bkit.config.json`에서 개별 비활성화 가능

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-11 | Initial draft - 5-Agent Research 기반 종합 설계 | CTO Team |
