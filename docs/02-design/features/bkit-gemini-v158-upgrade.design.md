# bkit-gemini v1.5.8 고도화 상세 설계서

> **요약**: Gemini CLI v0.33.x 호환성 확보 + bkit-CC v1.6.1 핵심 기능 이식 + Gemini 특화 강화의 상세 기술 설계
>
> **프로젝트**: bkit-gemini
> **버전**: v1.5.7 → v1.5.8
> **작성자**: CTO Team (10명 체제)
> **작성일**: 2026-03-11
> **상태**: Draft
> **계획서**: [bkit-gemini-v158-upgrade.plan.md](../01-plan/features/bkit-gemini-v158-upgrade.plan.md)

---

## Executive Summary

| 항목 | 값 |
|------|-----|
| Feature | bkit-gemini v1.5.8 상세 설계 |
| 작성일 | 2026-03-11 |
| 총 FR | 44개 (Sprint 1: 7, Sprint 2: 18, Sprint 3: 14, 기타: 5) |
| 변경 파일 수 (예상) | 약 55~65개 (신규 30+, 수정 25+) |
| 신규 에이전트 | 5개 (PM Team) |
| 신규 스킬 | 5개 (plan-plus, simplify, loop, batch, output-style-setup) |
| 신규 lib 모듈 | 10개 (team/ 9개 + core/paths.js) |

### Value Delivered (4관점)

| 관점 | 내용 |
|------|------|
| **Problem** | Gemini CLI v0.33.x Breaking Changes 3개 + bkit-CC 대비 핵심 기능 15개 미구현 |
| **Solution** | 도구 스키마 업데이트 + PM Team/CTO Team/plan-plus 이식 + Gemini 네이티브 통합 |
| **기능/UX** | 호환성 보장, PM 워크플로우, 팀 오케스트레이션, 코드 정리, Skills 분류 |
| **핵심 가치** | Gemini CLI 생태계 최고 수준의 AI-native 개발 확장 |

---

## 1. 설계 개요

### 1.1 설계 목표

1. **하위 호환성 유지**: Gemini CLI v0.29.0~v0.33.x 전 범위 지원
2. **어댑터 패턴 일관성**: 모든 CC→Gemini 이식은 lib/adapters/gemini/ 경유
3. **Progressive Disclosure 유지**: 새 기능도 필요 시에만 컨텍스트 로드
4. **Gemini 네이티브 우선**: CC 패턴을 그대로 복사하지 않고 Gemini CLI 네이티브 방식 우선 활용
5. **최소 변경 원칙**: 기존 동작하는 코드는 최소한으로 수정

### 1.2 설계 원칙

- **Single Responsibility**: 각 모듈은 하나의 책임만 (tool-registry는 도구만, version-detector는 버전만)
- **Open/Closed**: 기능 플래그로 확장, 기존 코드 수정 최소화
- **Dependency Inversion**: lib/adapters/를 통한 플랫폼 종속성 역전

---

## 2. 아키텍처

### 2.1 전체 컴포넌트 다이어그램 (v1.5.8)

```
┌─────────────────────────────────────────────────────────────────┐
│  Gemini CLI Runtime                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ GEMINI.md    │  │ agents/      │  │ skills/              │  │
│  │ @import x6   │  │ 21개 (.md)   │  │ 34개 (SKILL.md)      │  │
│  │ + @import x2 │  │ +5 PM NEW    │  │ +5 NEW               │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────────────┘  │
│         │                 │                  │                  │
│  ┌──────▼─────────────────▼──────────────────▼───────────────┐  │
│  │                  hooks/hooks.json                          │  │
│  │                  9 Events, 11+ Hooks                       │  │
│  └──────┬────────────────────────────────────────────────────┘  │
│         │                                                       │
│  ┌──────▼────────────────────────────────────────────────────┐  │
│  │                    lib/ (Core Library)                      │  │
│  │                                                            │  │
│  │  ┌─────────────────┐  ┌─────────────────┐                │  │
│  │  │ adapters/gemini/ │  │ core/           │                │  │
│  │  │ 8 modules        │  │ 9 modules       │                │  │
│  │  │ (tool-registry,  │  │ + paths.js NEW  │                │  │
│  │  │  version-detect,  │  │ (config, memory │                │  │
│  │  │  policy-migrator, │  │  permission,    │                │  │
│  │  │  hook-adapter,    │  │  agent-memory)  │                │  │
│  │  │  tracker-bridge,  │  │                 │                │  │
│  │  │  context-fork,    │  └─────────────────┘                │  │
│  │  │  import-resolver) │                                     │  │
│  │  └─────────────────┘  ┌─────────────────┐                │  │
│  │                        │ team/ NEW       │                │  │
│  │  ┌─────────────────┐  │ 9 modules       │                │  │
│  │  │ pdca/           │  │ (coordinator,   │                │  │
│  │  │ 6 modules       │  │  strategy,      │                │  │
│  │  └─────────────────┘  │  cto-logic,     │                │  │
│  │  ┌─────────────────┐  │  communication, │                │  │
│  │  │ intent/         │  │  task-queue,    │                │  │
│  │  │ 4 modules       │  │  state-recorder,│                │  │
│  │  └─────────────────┘  │  pattern,       │                │  │
│  │  ┌─────────────────┐  │  memory)        │                │  │
│  │  │ task/           │  └─────────────────┘                │  │
│  │  │ 6 modules       │                                     │  │
│  │  └─────────────────┘                                     │  │
│  │                                                            │  │
│  │  skill-orchestrator.js  |  context-hierarchy.js  |  common│  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ commands/    │  │ templates/   │  │ mcp/                 │  │
│  │ 22개 (.toml) │  │ 13+ (.md)    │  │ spawn-agent-server   │  │
│  │ +4 NEW       │  │              │  │ + team 도구 강화      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 데이터 흐름

```
사용자 입력
  │
  ▼
[SessionStart Hook] → PDCA 상태 로드, 레벨 감지, 동적 컨텍스트 주입
  │
  ▼
[BeforeAgent Hook] → 의도 감지, 8개 언어 트리거 매칭, 에이전트 라우팅
  │
  ▼
[BeforeModel Hook] → PDCA 페이즈별 프롬프트 증강
  │
  ▼
[Gemini Model] → 응답 생성
  │
  ▼
[AfterModel Hook] → 사용량 추적
  │
  ▼
[BeforeToolSelection] → 페이즈 기반 도구 필터링
  │
  ▼
[BeforeTool Hook] → 퍼미션 검증, 위험 명령 차단
  │
  ▼
[Tool Execution] → read_file/write_file/replace/grep_search 등
  │
  ▼
[AfterTool Hook] → PDCA 자동 전환, 스킬 후처리
  │
  ▼
[AfterAgent Hook] → 정리, 루프 가드
  │
  ▼
[PreCompress Hook] → 컨텍스트 스냅샷 보존
```

### 2.3 의존성 관계

| 컴포넌트 | 의존 대상 | 목적 |
|---------|----------|------|
| hooks/scripts/* | lib/adapters, lib/core, lib/pdca | 코어 로직 접근 |
| lib/team/ (NEW) | lib/core, lib/pdca, lib/task, lib/adapters | 팀 오케스트레이션 |
| lib/core/paths.js (NEW) | 없음 (독립) | 경로 상수 정의 |
| agents/pm-*.md (NEW) | skills/pm-discovery | PM 워크플로우 |
| skills/plan-plus (NEW) | templates/plan.template.md | 브레인스토밍 계획 |
| skills/simplify (NEW) | agents/code-analyzer | 코드 분석 위임 |

---

## 3. Sprint 1 상세 설계: Gemini CLI v0.33.x 호환성 (P0)

### 3.1 FR-01: tool-registry.js read_file 업데이트

**변경 파일**: `lib/adapters/gemini/tool-registry.js`

**현재 상태**: read_file 도구 정의에 라인번호 체계 미명시

**변경 내용**:
```javascript
// ─── Tool Parameter Changes (v0.33.0+) ──────────────────────
const TOOL_PARAM_CHANGES = Object.freeze({
  [BUILTIN_TOOLS.READ_FILE]: {
    // v0.33.0+: line numbers are 1-based (was 0-based before)
    lineNumberBase: 1,
    description: 'offset/limit parameters use 1-based line numbers'
  }
});
```

**영향 범위**: 에이전트 프롬프트에서 read_file 사용 시 라인번호 가이드, .gemini/context/tool-reference.md

### 3.2 FR-02: tool-registry.js replace allow_multiple 추가

**변경 파일**: `lib/adapters/gemini/tool-registry.js`

**변경 내용**:
```javascript
// TOOL_PARAM_CHANGES에 추가
[BUILTIN_TOOLS.REPLACE]: {
  // v0.31.0+: allow_multiple parameter added
  // v0.33.0+: required when multiple matches exist
  allowMultiple: {
    minVersion: '0.31.0',
    requiredVersion: '0.33.0',
    description: 'Must set allow_multiple=true when old_string matches multiple locations'
  }
}
```

**기존 hasAllowMultipleReplace 플래그**: version-detector.js에 이미 v0.31.0+ 플래그 존재 (line 175). v0.33.0+ 필수화만 추가.

### 3.3 FR-03: tool-registry.js grep_search include_pattern 매핑

**변경 파일**: `lib/adapters/gemini/tool-registry.js`

**현재 상태**: `FORWARD_ALIASES`에 `find_in_file` → `grep_search` 매핑 존재 (line 83)

**변경 내용**: TOOL_PARAM_CHANGES에 추가
```javascript
[BUILTIN_TOOLS.GREP_SEARCH]: {
  // v0.32.0+: 'glob' parameter renamed to 'include_pattern'
  parameterRenames: {
    'glob': 'include_pattern'
  },
  description: 'Use include_pattern instead of glob for file filtering'
}
```

**기존 hasGrepIncludePatternRename 플래그**: version-detector.js에 이미 v0.32.0+ 플래그 존재 (line 184).

### 3.4 FR-04~05: 버전 호환성 업데이트

**변경 파일 1**: `bkit.config.json`
```json
{
  "compatibility": {
    "testedVersions": [..., "0.33.0-preview.4", "0.33.0"],
    "minGeminiCliVersion": "0.29.0"
  }
}
```

**변경 파일 2**: `lib/adapters/gemini/version-detector.js`
```javascript
// getFeatureFlags()에 v0.33.0+ 플래그 추가
// v0.33.0+
hasMcpV2Prep: isVersionAtLeast('0.33.0'),
hasNativeSubagents: isVersionAtLeast('0.33.0'),
hasPlanDirectory: isVersionAtLeast('0.33.0'),
hasThemeSupport: isVersionAtLeast('0.33.0'),
hasExcludeToolsConfig: isVersionAtLeast('0.33.0'),
hasAgentsDirectory: isVersionAtLeast('0.33.0'),
hasReplaceAllowMultipleRequired: isVersionAtLeast('0.33.0')
```

### 3.5 FR-06: 에이전트 프롬프트 업데이트

**변경 파일**: `agents/*.md` (16개 에이전트)

도구 사용 가이드에 다음 추가:
```markdown
## 도구 사용 시 주의사항 (v0.33.x)
- `read_file`: offset/limit는 1-기반 라인번호
- `replace`: 다중 매칭 시 `allow_multiple: true` 필수
- `grep_search`: 파일 필터는 `include_pattern` 파라미터 사용
```

### 3.6 FR-07: tool-reference.md 업데이트

**변경 파일**: `.gemini/context/tool-reference.md`

도구 레퍼런스에 v0.33.x 파라미터 변경사항 반영. 23개 도구 중 3개 (read_file, replace, grep_search) 업데이트.

### 3.7 Sprint 1 테스트 계획

| TC ID | 대상 | 검증 내용 |
|-------|------|----------|
| TC-S1-01 | tool-registry.js | TOOL_PARAM_CHANGES 구조 검증 |
| TC-S1-02 | version-detector.js | v0.33.0+ 기능 플래그 7개 검증 |
| TC-S1-03 | bkit.config.json | testedVersions에 v0.33.x 포함 확인 |
| TC-S1-04 | agents/*.md | 16개 에이전트 도구 가이드 포함 확인 |
| TC-S1-05 | tool-reference.md | 3개 도구 변경사항 반영 확인 |
| TC-S1-06 | 회귀 | 기존 TC-01~TC-24 전체 통과 |

---

## 4. Sprint 2 상세 설계: 핵심 기능 이식 (P1)

### 4.1 PM Agent Team (FR-10~FR-15)

#### 4.1.1 에이전트 정의 (5개 신규)

모든 PM 에이전트는 Gemini CLI 네이티브 frontmatter 형식:

**agents/pm-lead.md**:
```yaml
---
model: gemini-3.1-pro
tools:
  - read_file
  - write_file
  - replace
  - glob
  - grep_search
  - run_shell_command
  - google_web_search
  - tracker_create_task
  - tracker_update_task
  - tracker_list_tasks
  - tracker_visualize
temperature: 0.3
max_turns: 50
timeout_mins: 30
---
```
- 역할: PM 팀 리드 오케스트레이션
- pm-discovery → pm-strategy → pm-research → pm-prd 순서로 워크플로우 조정
- Task 기반 진행 상태 추적

**agents/pm-discovery.md**:
```yaml
---
model: gemini-3.1-pro
tools:
  - read_file
  - glob
  - grep_search
  - google_web_search
  - web_fetch
  - write_file
  - replace
temperature: 0.5
max_turns: 30
timeout_mins: 15
---
```
- 역할: Opportunity Solution Tree 분석
- Teresa Torres의 Continuous Discovery Habits 프레임워크 기반
- 고객 기회 → 솔루션 → 실험 매핑

**agents/pm-strategy.md**:
```yaml
---
model: gemini-3.1-pro
tools:
  - read_file
  - glob
  - grep_search
  - google_web_search
  - web_fetch
  - write_file
  - replace
temperature: 0.4
max_turns: 30
timeout_mins: 15
---
```
- 역할: Value Proposition (JTBD 6-Part) + Lean Canvas 분석
- 비즈니스 모델 가설 설계

**agents/pm-research.md**:
```yaml
---
model: gemini-3.1-pro
tools:
  - read_file
  - glob
  - grep_search
  - google_web_search
  - web_fetch
  - write_file
  - replace
temperature: 0.4
max_turns: 30
timeout_mins: 15
---
```
- 역할: User Personas, 경쟁 분석, Market Sizing (TAM/SAM/SOM)

**agents/pm-prd.md**:
```yaml
---
model: gemini-3.1-pro
tools:
  - read_file
  - write_file
  - replace
  - glob
  - grep_search
  - google_web_search
  - web_fetch
temperature: 0.3
max_turns: 40
timeout_mins: 20
---
```
- 역할: 8-Section PRD 작성 (Beachhead + GTM 포함)

#### 4.1.2 PM Discovery 스킬 (FR-15)

**skills/pm-discovery/SKILL.md**:
```yaml
---
name: pm-discovery
description: |
  PM Agent Team - Automated product discovery, strategy, and PRD generation.
  Runs specialized PM agents to produce comprehensive PRD.

user-invocable: false
allowed-tools:
  - read_file
  - write_file
  - replace
  - glob
  - grep_search
  - google_web_search
  - web_fetch
  - tracker_create_task
  - tracker_update_task
  - tracker_list_tasks

agents:
  discovery: pm-discovery
  strategy: pm-strategy
  research: pm-research
  prd: pm-prd
  lead: pm-lead

context: session
memory: project
classification: workflow
---
```

### 4.2 plan-plus 스킬 (FR-16)

**skills/plan-plus/SKILL.md**:
```yaml
---
name: plan-plus
description: |
  Plan Plus — Brainstorming-Enhanced PDCA Planning.
  Combines intent discovery from brainstorming methodology with PDCA's structured planning.

user-invocable: true
argument-hint: "[feature]"
allowed-tools:
  - read_file
  - write_file
  - replace
  - glob
  - grep_search
  - google_web_search
  - web_fetch
  - tracker_create_task
  - tracker_update_task
  - tracker_list_tasks

imports:
  - templates/plan.template.md

context: session
memory: project
pdca-phase: plan
classification: hybrid
---
```

**워크플로우**:
```
1. 사용자 의도 탐색 (What / Why / Who / How)
2. 경쟁/대안 분석 (기존 방법 vs 제안)
3. 브레인스토밍 (확산 → 수렴)
4. 기술적 실현 가능성 검토
5. Plan 문서 생성 (plan.template.md 기반)
```

**commands/plan-plus.toml**:
```toml
[command]
name = "plan-plus"
description = "Brainstorming-Enhanced PDCA Planning"
prompt = """
@{extensionPath}/skills/plan-plus/SKILL.md

Feature: {{args}}

Execute Plan-Plus brainstorming workflow for the specified feature.
Current PDCA status: !{node ${extensionPath}/hooks/scripts/utils/pdca-state-updater.js status}
"""
```

### 4.3 simplify 스킬 (FR-17)

**skills/simplify/SKILL.md**:
```yaml
---
name: simplify
description: |
  Review changed code for reuse, quality, and efficiency, then fix any issues found.
  Use after PDCA Check >= 90% or when code review is needed.

user-invocable: true
argument-hint: ""
allowed-tools:
  - read_file
  - replace
  - glob
  - grep_search

agents:
  analyze: code-analyzer

context: session
classification: workflow
---
```

**워크플로우**:
```
1. git diff로 변경된 파일 목록 수집
2. 각 파일에 대해:
   a. 중복 코드 검출
   b. 불필요한 복잡도 감지
   c. 네이밍 개선 기회 탐색
   d. 사용되지 않는 코드 감지
3. 개선 사항 자동 적용
4. 변경 요약 출력
```

### 4.4 lib/team/ 모듈 설계 (FR-20~22)

#### 4.4.1 디렉토리 구조

```
lib/team/
├── index.js              # 팀 모듈 진입점
├── coordinator.js        # 팀 코디네이터 (에이전트 할당/모니터링)
├── strategy.js           # 팀 전략 선택 (dynamic/enterprise/custom)
├── cto-logic.js          # CTO 레벨 의사결정 로직
├── communication.js      # 에이전트 간 통신 (MCP spawn 기반)
├── task-queue.js         # 태스크 큐 관리 (FIFO + 우선순위)
├── state-recorder.js     # 팀 상태 기록/복원
├── pattern-selector.js   # 5가지 오케스트레이션 패턴 선택기
└── memory.js             # 팀 메모리 (세션 간 컨텍스트)
```

#### 4.4.2 핵심 인터페이스

**coordinator.js**:
```javascript
/**
 * Team Coordinator - Agent assignment and monitoring
 */
class TeamCoordinator {
  constructor(config, adapter) {
    this.config = config;          // bkit.config.json의 team 섹션
    this.adapter = adapter;        // GeminiAdapter
    this.agents = new Map();       // 활성 에이전트
    this.taskQueue = new TaskQueue();
  }

  /** 팀 초기화 */
  async initialize(teamName, strategy) {}

  /** 에이전트 할당 */
  async assignAgent(agentName, task) {}

  /** 팀 상태 조회 */
  getStatus() {}

  /** 팀 해산 */
  async dissolve() {}
}
```

**pattern-selector.js**:
```javascript
/**
 * 5가지 오케스트레이션 패턴
 */
const PATTERNS = {
  LEADER: 'leader',       // CTO가 모든 지시 (기본)
  COUNCIL: 'council',     // 다수결 의사결정
  SWARM: 'swarm',         // 자율 분산 (Plan 단계)
  PIPELINE: 'pipeline',   // 순차 처리 (Do 단계)
  WATCHDOG: 'watchdog'    // 모니터링 (Check 단계)
};

/** PDCA 단계별 자동 패턴 선택 */
function selectPattern(pdcaPhase, teamSize) {
  const phasePatterns = {
    plan: PATTERNS.SWARM,      // 브레인스토밍 → 자율 분산
    design: PATTERNS.COUNCIL,  // 설계 리뷰 → 다수결
    do: PATTERNS.PIPELINE,     // 구현 → 순차 처리
    check: PATTERNS.WATCHDOG,  // 검증 → 모니터링
    act: PATTERNS.LEADER       // 개선 → CTO 지시
  };
  return phasePatterns[pdcaPhase] || PATTERNS.LEADER;
}
```

**communication.js**:
```javascript
/**
 * Agent Communication via MCP spawn
 * Gemini CLI에서는 MCP spawn-agent-server를 통해 통신
 */
class AgentCommunication {
  constructor(mcpServer) {
    this.mcpServer = mcpServer;  // mcp/spawn-agent-server.js
  }

  /** 에이전트에 태스크 전달 */
  async sendTask(agentName, task) {
    return this.mcpServer.spawnAgent(agentName, task);
  }

  /** 에이전트 결과 수집 */
  async collectResult(agentId) {}

  /** 브로드캐스트 (전체 에이전트에 전달) */
  async broadcast(message) {}
}
```

#### 4.4.3 bkit.config.json team 섹션 변경

```json
{
  "team": {
    "enabled": true,
    "defaultStrategy": "dynamic",
    "strategies": {
      "dynamic": { "maxAgents": 3, "pattern": "auto" },
      "enterprise": { "maxAgents": 5, "pattern": "auto" },
      "custom": { "maxAgents": 10, "pattern": "auto" }
    },
    "orchestrationPatterns": {
      "plan": "swarm",
      "design": "council",
      "do": "pipeline",
      "check": "watchdog",
      "act": "leader"
    },
    "stateDir": ".gemini/teams/",
    "communication": "mcp-spawn"
  }
}
```

### 4.5 Path Registry (FR-23~24)

**lib/core/paths.js** (신규):
```javascript
/**
 * Path Registry - Centralized state file path management
 * Single source of truth for all bkit state file paths.
 *
 * @version 1.5.8
 */
const path = require('path');

function getPaths(projectDir) {
  const bkitDir = path.join(projectDir, '.bkit');
  const geminiDir = path.join(projectDir, '.gemini');

  return {
    // PDCA
    pdcaStatus: path.join(projectDir, '.pdca-status.json'),

    // bkit state
    stateDir: path.join(bkitDir, 'state'),
    runtimeDir: path.join(bkitDir, 'runtime'),
    snapshotsDir: path.join(bkitDir, 'snapshots'),
    memory: path.join(bkitDir, 'state', 'memory.json'),

    // Gemini native
    agentMemory: path.join(geminiDir, 'agent-memory', 'bkit'),
    policies: path.join(geminiDir, 'policies'),
    context: path.join(geminiDir, 'context'),
    teams: path.join(geminiDir, 'teams'),

    // Docs
    planDir: path.join(projectDir, 'docs', '01-plan', 'features'),
    designDir: path.join(projectDir, 'docs', '02-design', 'features'),
    analysisDir: path.join(projectDir, 'docs', '03-analysis'),
    reportDir: path.join(projectDir, 'docs', '04-report', 'features'),
    archiveDir: path.join(projectDir, 'docs', 'archive')
  };
}

module.exports = { getPaths };
```

### 4.6 Executive Summary / Feature Usage Report (FR-25~27)

**SessionStart hook 변경** (`hooks/scripts/session-start.js`):

`generateDynamicContext()` 함수에 다음 섹션 추가:

```javascript
// Executive Summary Rule
const executiveSummaryRule = `
## Executive Summary Output Rule
After completing PDCA document work (/pdca plan, /pdca design, /pdca report),
output the Executive Summary table including:
1. Project overview table
2. Results summary
3. Value Delivered 4-perspective table
`;

// Feature Usage Report Rule (확장)
const featureUsageRule = `
## bkit Feature Usage Report
Include at the end of every response:
✅ Used: [features used]
⏭️ Not Used: [unused features] (reason)
💡 Recommended: [next recommended features]
`;
```

**.gemini/context/ 모듈 추가**:
- `executive-summary-rules.md` (신규): Executive Summary 출력 규칙
- `feature-report.md` (확장): Feature Usage Report 규칙 강화

**GEMINI.md 업데이트**:
```markdown
@.gemini/context/executive-summary-rules.md   # NEW
@.gemini/context/feature-report.md             # UPDATED
```

### 4.7 Sprint 2 테스트 계획

| TC ID | 대상 | 검증 내용 |
|-------|------|----------|
| TC-S2-01 | pm-lead.md | frontmatter 구조, model/tools 검증 |
| TC-S2-02 | pm-discovery.md | frontmatter 구조, 역할 설명 검증 |
| TC-S2-03 | pm-strategy.md | frontmatter 구조 검증 |
| TC-S2-04 | pm-research.md | frontmatter 구조 검증 |
| TC-S2-05 | pm-prd.md | frontmatter 구조 검증 |
| TC-S2-06 | plan-plus SKILL.md | frontmatter, 워크플로우 검증 |
| TC-S2-07 | simplify SKILL.md | frontmatter, 에이전트 위임 검증 |
| TC-S2-08 | lib/team/coordinator.js | 초기화, 에이전트 할당 검증 |
| TC-S2-09 | lib/team/pattern-selector.js | PDCA 단계별 패턴 선택 검증 |
| TC-S2-10 | lib/core/paths.js | 경로 상수 정확성 검증 |
| TC-S2-11 | session-start.js | Executive Summary 규칙 주입 검증 |
| TC-S2-12 | GEMINI.md | @import 8개 모듈 포함 검증 |
| TC-S2-13 | commands/plan-plus.toml | TOML 구조, @{path} 구문 검증 |
| TC-S2-14 | bkit.config.json | team.enabled: true, 패턴 설정 검증 |
| TC-S2-15 | 회귀 | 기존 TC-01~TC-24 전체 통과 |

---

## 5. Sprint 3 상세 설계: 기능 강화 (P2)

### 5.1 새 스킬 3개 (FR-30~32)

#### loop 스킬
```yaml
---
name: loop
description: |
  Run a prompt or command on a recurring interval.
  Usage: /loop [interval] [command]
user-invocable: true
argument-hint: "[interval] [command]"
allowed-tools:
  - run_shell_command
  - read_file
  - write_file
classification: workflow
---
```

#### batch 스킬
```yaml
---
name: batch
description: |
  Process multiple features/tasks in parallel.
  Usage: /batch [command] [feature1] [feature2] ...
user-invocable: true
argument-hint: "[command] [features...]"
allowed-tools:
  - read_file
  - write_file
  - glob
  - grep_search
  - tracker_create_task
  - tracker_update_task
  - tracker_list_tasks
classification: workflow
---
```

#### output-style-setup 스킬
```yaml
---
name: output-style-setup
description: |
  Install bkit output styles to your project.
user-invocable: true
allowed-tools:
  - read_file
  - write_file
  - glob
classification: capability
---
```

### 5.2 Skills 2.0 분류 체계 (FR-33)

모든 SKILL.md frontmatter에 `classification` 필드 추가:

| 분류 | 스킬 수 | 기준 |
|------|:------:|------|
| **workflow** | 12 | 모델 발전과 무관한 영구 가치 (pdca, plan-plus, simplify, loop, batch, bkit-rules, bkit-templates, code-review, zero-script-qa, gemini-cli-learning, development-pipeline, pm-discovery) |
| **capability** | 21 | 모델 발전 시 중복 가능 (starter, dynamic, enterprise, mobile-app, desktop-app, phase-1~9, bkend-*, output-style-setup) |
| **hybrid** | 1 | 워크플로우 + 역량 결합 (plan-plus) |

**구현**: skill-orchestrator.js에 분류별 필터링 함수 추가:
```javascript
function getSkillsByClassification(classification) {
  return allSkills.filter(s => s.classification === classification);
}
```

### 5.3 Version-Gated Features (FR-35)

**변경 파일**: `lib/adapters/gemini/version-detector.js`

기존 `getFeatureFlags()`를 확장하여 bkit 내부 기능도 버전 게이팅:

```javascript
/**
 * Get bkit feature availability based on Gemini CLI version
 * @returns {object}
 */
function getBkitFeatureFlags() {
  const flags = getFeatureFlags();
  return {
    ...flags,
    // bkit feature gates
    canUseTeam: flags.hasTaskTracker,           // team은 tracker 필요
    canUsePmTeam: flags.hasTaskTracker,         // PM team도 tracker 필요
    canUseNativeAgents: flags.hasNativeSubagents, // v0.33.0+
    canUsePlanDirectory: flags.hasPlanDirectory,  // v0.33.0+
    canUseExcludeTools: flags.hasExcludeToolsConfig // v0.33.0+
  };
}
```

### 5.4 Template Validator (FR-36)

**변경 파일**: `hooks/scripts/after-tool.js`

`write_file` 또는 `replace`로 PDCA 문서가 변경될 때 템플릿 준수 여부 검증:

```javascript
function validatePdcaDocument(filePath, content) {
  const requiredSections = {
    'plan': ['## 1. Overview', '## 2. Scope', '## 3. Requirements'],
    'design': ['## 1. Overview', '## 2. Architecture', '## 3. Data Model'],
    'analysis': ['## Match Rate', '## Gap Items'],
    'report': ['## Executive Summary', '## Results']
  };

  const docType = detectDocType(filePath);
  if (!docType || !requiredSections[docType]) return { valid: true };

  const missing = requiredSections[docType].filter(s => !content.includes(s));
  return {
    valid: missing.length === 0,
    missing,
    docType
  };
}
```

### 5.5 gemini-extension.json 확장 (FR-37~38)

```json
{
  "name": "bkit",
  "version": "1.5.8",
  "description": "bkit Vibecoding Kit v1.5.8 - PDCA + Context Engineering for Gemini CLI",
  "contextFileName": "GEMINI.md",
  "plan": {
    "directory": "docs/01-plan"
  },
  "settings": [
    { "name": "Output Style", "envVar": "BKIT_OUTPUT_STYLE" },
    { "name": "Project Level", "envVar": "BKIT_PROJECT_LEVEL" }
  ]
}
```

### 5.6 네이티브 에이전트 하이브리드 (FR-39)

v0.33.0+에서 `.gemini/agents/*.md` 네이티브 지원 시, bkit 에이전트를 하이브리드로 운영:

```
에이전트 호출 흐름:
1. getBkitFeatureFlags().canUseNativeAgents 확인
2. true → Gemini 네이티브 에이전트 호출 (transferToAgent)
3. false → MCP spawn_agent 폴백
```

**구현 위치**: `lib/team/communication.js`
```javascript
async sendTask(agentName, task) {
  const flags = getBkitFeatureFlags();
  if (flags.canUseNativeAgents) {
    return this.nativeDelegate(agentName, task);
  }
  return this.mcpSpawn(agentName, task);
}
```

### 5.7 Sprint 3 테스트 계획

| TC ID | 대상 | 검증 내용 |
|-------|------|----------|
| TC-S3-01 | loop SKILL.md | frontmatter, classification 검증 |
| TC-S3-02 | batch SKILL.md | frontmatter, classification 검증 |
| TC-S3-03 | output-style-setup SKILL.md | frontmatter 검증 |
| TC-S3-04 | 전체 34개 SKILL.md | classification 필드 존재 검증 |
| TC-S3-05 | version-detector.js | getBkitFeatureFlags() 함수 검증 |
| TC-S3-06 | after-tool.js | PDCA 문서 템플릿 검증 동작 확인 |
| TC-S3-07 | gemini-extension.json | plan.directory 필드 검증 |
| TC-S3-08 | communication.js | 하이브리드 에이전트 호출 분기 검증 |
| TC-S3-09 | 회귀 | 기존 TC-01~TC-24 + Sprint 1,2 TC 전체 통과 |

---

## 6. 에러 처리

### 6.1 에러 처리 전략

| 상황 | 에러 처리 | 사용자 경험 |
|------|----------|-----------|
| Gemini CLI 버전 감지 실패 | v0.29.0 폴백, 경고 로그 | 기본 기능 동작 |
| PM 에이전트 실행 실패 | 개별 에이전트 스킵, 워크플로우 계속 | 부분 결과 반환 |
| CTO Team 통신 실패 | MCP spawn 재시도(최대 3회) | 재시도 결과 알림 |
| PDCA 문서 템플릿 검증 실패 | 경고만 출력, 저장은 허용 | 누락 섹션 안내 |
| Path Registry 경로 미존재 | 자동 디렉토리 생성 | 투명하게 처리 |
| 기능 플래그 미지원 | Graceful degradation | 대체 기능 안내 |

### 6.2 로깅

모든 새 모듈은 `lib/core/debug.js`의 디버그 로거 사용:
```javascript
const { debug } = require('../core/debug');
debug('team', 'Coordinator initialized with pattern:', pattern);
```

`BKIT_DEBUG=true` 환경변수로 디버그 로그 활성화.

---

## 7. 보안 고려사항

- [x] 기존 4-Tier TOML 정책 시스템 유지
- [x] 기존 퍼미션 엔진 (lib/core/permission.js) 유지
- [x] SemVer 검증으로 버전 주입 방지
- [x] 팀 이름 새니타이제이션 유지
- [x] TOML 인젝션 방지 유지
- [ ] PM 에이전트의 google_web_search/web_fetch 사용 시 외부 데이터 검증
- [ ] 팀 통신 시 에이전트 ID 검증
- [ ] 새 스킬(loop, batch)의 무한 루프 방지 (maxIterations 설정)

---

## 8. 구현 순서

### 8.1 Sprint 1 (P0) 구현 순서

```
1. lib/adapters/gemini/tool-registry.js 수정
   └─ TOOL_PARAM_CHANGES 추가
2. lib/adapters/gemini/version-detector.js 수정
   └─ v0.33.0+ 기능 플래그 7개 추가
3. bkit.config.json 수정
   └─ testedVersions 업데이트
4. .gemini/context/tool-reference.md 수정
   └─ 3개 도구 변경사항 반영
5. agents/*.md 수정 (16개)
   └─ 도구 사용 가이드 추가
6. 테스트 실행
   └─ TC-S1-01 ~ TC-S1-06
```

### 8.2 Sprint 2 (P1) 구현 순서

```
Phase A: PM Agent Team
1. agents/pm-lead.md 생성
2. agents/pm-discovery.md 생성
3. agents/pm-strategy.md 생성
4. agents/pm-research.md 생성
5. agents/pm-prd.md 생성
6. skills/pm-discovery/SKILL.md 생성
7. commands/pm-discovery.toml 생성 (있다면)

Phase B: 새 스킬
8. skills/plan-plus/SKILL.md 생성
9. commands/plan-plus.toml 생성
10. skills/simplify/SKILL.md 생성
11. commands/simplify.toml 생성

Phase C: CTO Team
12. lib/team/index.js 생성
13. lib/team/coordinator.js 생성
14. lib/team/strategy.js 생성
15. lib/team/cto-logic.js 생성
16. lib/team/communication.js 생성
17. lib/team/task-queue.js 생성
18. lib/team/state-recorder.js 생성
19. lib/team/pattern-selector.js 생성
20. lib/team/memory.js 생성
21. bkit.config.json team 섹션 업데이트

Phase D: 기반 인프라
22. lib/core/paths.js 생성
23. .gemini/context/executive-summary-rules.md 생성
24. .gemini/context/feature-report.md 확장
25. hooks/scripts/session-start.js 수정
26. GEMINI.md @import 추가
27. 테스트 실행
```

### 8.3 Sprint 3 (P2) 구현 순서

```
Phase E: 새 스킬
1. skills/loop/SKILL.md 생성
2. skills/batch/SKILL.md 생성
3. skills/output-style-setup/SKILL.md 생성
4. commands/loop.toml, batch.toml 생성

Phase F: Skills 2.0
5. 기존 29 + 신규 5 = 34개 SKILL.md에 classification 필드 추가
6. lib/skill-orchestrator.js에 분류 필터링 함수 추가
7. version-detector.js에 getBkitFeatureFlags() 추가

Phase G: Gemini 특화
8. gemini-extension.json plan.directory 추가
9. hooks/scripts/after-tool.js Template Validator 추가
10. lib/team/communication.js 하이브리드 에이전트 구현
11. lib/intent/language.js ES/FR/DE/IT 패턴 추가
12. 구조 정리 (bkit-system/, .claude/)
13. 테스트 실행
```

---

## 9. 변경 파일 총괄

### 신규 파일 (약 30개)

| 파일 | Sprint | 설명 |
|------|:------:|------|
| agents/pm-lead.md | 2 | PM 팀 리드 |
| agents/pm-discovery.md | 2 | 기회 발견 |
| agents/pm-strategy.md | 2 | 전략 분석 |
| agents/pm-research.md | 2 | 시장 조사 |
| agents/pm-prd.md | 2 | PRD 작성 |
| skills/plan-plus/SKILL.md | 2 | 브레인스토밍 계획 |
| skills/simplify/SKILL.md | 2 | 코드 정리 |
| skills/pm-discovery/SKILL.md | 2 | PM 오케스트레이션 |
| skills/loop/SKILL.md | 3 | 반복 실행 |
| skills/batch/SKILL.md | 3 | 병렬 처리 |
| skills/output-style-setup/SKILL.md | 3 | 스타일 설치 |
| commands/plan-plus.toml | 2 | /plan-plus |
| commands/simplify.toml | 2 | /simplify |
| commands/loop.toml | 3 | /loop |
| commands/batch.toml | 3 | /batch |
| lib/team/index.js | 2 | 팀 모듈 진입점 |
| lib/team/coordinator.js | 2 | 코디네이터 |
| lib/team/strategy.js | 2 | 전략 선택 |
| lib/team/cto-logic.js | 2 | CTO 로직 |
| lib/team/communication.js | 2 | 에이전트 통신 |
| lib/team/task-queue.js | 2 | 태스크 큐 |
| lib/team/state-recorder.js | 2 | 상태 기록 |
| lib/team/pattern-selector.js | 2 | 패턴 선택기 |
| lib/team/memory.js | 2 | 팀 메모리 |
| lib/core/paths.js | 2 | Path Registry |
| .gemini/context/executive-summary-rules.md | 2 | ES 규칙 |

### 수정 파일 (약 25개)

| 파일 | Sprint | 변경 내용 |
|------|:------:|----------|
| lib/adapters/gemini/tool-registry.js | 1 | TOOL_PARAM_CHANGES 추가 |
| lib/adapters/gemini/version-detector.js | 1,3 | v0.33.0+ 플래그, getBkitFeatureFlags() |
| bkit.config.json | 1,2 | testedVersions, team 섹션 |
| gemini-extension.json | 3 | version, plan.directory |
| .gemini/context/tool-reference.md | 1 | 3개 도구 변경 |
| .gemini/context/feature-report.md | 2 | 규칙 확장 |
| GEMINI.md | 2 | @import 2개 추가 |
| hooks/scripts/session-start.js | 2 | 동적 컨텍스트 확장 |
| hooks/scripts/after-tool.js | 3 | Template Validator |
| lib/skill-orchestrator.js | 3 | 분류 필터링 |
| lib/intent/language.js | 3 | ES/FR/DE/IT 패턴 |
| agents/*.md (16개) | 1 | 도구 사용 가이드 |
| skills/*/SKILL.md (29개) | 3 | classification 필드 |

---

## Version History

| 버전 | 날짜 | 변경사항 | 작성자 |
|------|------|---------|--------|
| 0.1 | 2026-03-11 | 초안 작성 (3 Sprint 전체 상세 설계) | CTO Team |

---

*bkit-gemini v1.5.8 상세 설계서*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
