# Plan: Gemini CLI v0.29.x Compatibility Fix + v0.30.0 Preparation

## Document Information

| Field | Value |
|-------|-------|
| Feature | gemini-cli-029-compatibility-fix |
| Version | bkit-gemini v1.5.2 → v1.5.3 |
| Created | 2026-02-19 |
| Author | bkit PDCA System (Plan Plus) |
| Status | Draft |
| Approach | Adaptive Tool Registry (Phase 1: Direct Fix + Registry Module) |
| Related Issue | [#5 Invalid tool name](https://github.com/popup-studio-ai/bkit-gemini/issues/5) |
| Related Report | [gemini-cli-029-030-upgrade-impact-analysis.report.md](../04-report/gemini-cli-029-030-upgrade-impact-analysis.report.md) |

---

## 1. User Intent Discovery (Plan Plus Phase 1)

### Core Problem
Gemini CLI가 v0.28.0에서 v0.29.0으로 업그레이드되면서 도구 이름이 변경되었고, bkit-gemini v1.5.2의 16개 에이전트 전부가 `Invalid tool name` 에러로 로드에 실패합니다 (Issue #5). 이는 bkit의 핵심 기능(PDCA 워크플로우, 에이전트 기반 분석, 팀 오케스트레이션)이 모두 작동하지 않는 **Critical** 수준의 장애입니다.

### Target Users
1. **bkit 설치 사용자**: Gemini CLI v0.29.0+에서 bkit을 설치/사용하는 일반 개발자 → 정상 작동 복구
2. **bkit 컨트리뷰터**: bkit 코드베이스를 유지보수하는 개발자 → Tool Registry 중앙화로 유지보수 용이성 확보

### Success Criteria
| Criteria | Metric | Measurement |
|----------|--------|-------------|
| SC-01 | 16개 에이전트 전부 Gemini CLI v0.29.1에서 에러 없이 로드 | `gemini extensions list`에서 에러 0건 |
| SC-02 | 29개 스킬 전부 정상 활성화 | `activate_skill` 호출 성공 |
| SC-03 | 10개 Hook 이벤트 전부 정상 실행 | Hook 실행 로그 검증 |
| SC-04 | PDCA 전체 사이클 E2E 성공 | plan→design→do→analyze→report |
| SC-05 | MCP 서버 6개 도구 전부 작동 | `tools/list` 응답 검증 |
| SC-06 | v0.30.0-preview에서 deprecation 경고만 발생 (에러 없음) | Policy Engine 경고 로그 확인 |

### Constraints
- **HARD-GATE**: 하위호환 유지 (v0.28.0 사용자도 기본 기능 작동)
- **Philosophy**: "No Guessing" - 소스코드에서 확인된 공식 도구 이름만 사용
- **Philosophy**: "MCP tool accuracy" - Context Engineering 원칙에 따라 정확한 도구 이름 보장

---

## 2. Alternatives Explored (Plan Plus Phase 2)

| Approach | Description | Selected |
|----------|-------------|----------|
| **A: Adaptive Tool Registry** | 동적 레지스트리로 버전별 도구 이름 매핑. Frontmatter는 직접 수정, Hook/lib은 레지스트리 사용 | **Selected** |
| B: Direct Fix + Compat Layer | 모든 파일을 직접 find-and-replace. 빠르지만 다음 변경 시 반복 작업 | Rejected |
| C: Full SDK Integration | v0.30.0 SDK 기반 재구축. 너무 이르고 대규모 리팩토링 필요 | Rejected |

**Selection Rationale**: Frontmatter는 Gemini CLI가 정적 파싱하므로 직접 수정 필수. 동적 코드(Hook scripts, lib)는 Tool Registry 모듈로 중앙화하여 향후 도구 이름 변경 시 레지스트리만 업데이트하면 되도록 설계.

---

## 3. YAGNI Review (Plan Plus Phase 3)

### Included (v1.5.3)
- [x] Tool Registry 모듈 + Agent/Skill frontmatter 수정 (16+29개)
- [x] TOOL_MAP + hooks.json matcher 업데이트
- [x] gemini-extension.json experimental 블록 제거
- [x] v0.30.0 Policy Engine 호환 레이어 (감지 + 경고)
- [x] 모든 기능 정상 동작 검증
- [x] Philosophy 문서 v1.5.3 업데이트

### Deferred (v1.6.0+)
- [ ] Policy Engine TOML 정책 파일 완전 마이그레이션
- [ ] Plan Mode ↔ PDCA 통합
- [ ] Extension Registry 등록
- [ ] Gemini 3 Flash 에이전트 모델 최적화
- [ ] SDK Package 기반 스킬 확장

### Removed
- ~~v0.28.0 이하 하위호환 shim~~ → v0.28.0 이하는 지원 범위에서 제외 (v0.29.0+ 최소 요구)
- ~~동적 도구 이름 감지 (런타임 `gemini tools list` 파싱)~~ → 과도한 복잡성, YAGNI

---

## 4. Authoritative Tool Name Registry (Source of Truth)

### Gemini CLI v0.29.0+ 공식 도구 이름 (소스코드 확인)

> Source: `google-gemini/gemini-cli` `/packages/core/src/tools/definitions/base-declarations.ts`
> Source: `google-gemini/gemini-cli` `/packages/core/src/tools/tool-names.ts`

#### ALL_BUILTIN_TOOL_NAMES (17개)

| # | Tool Name | Display Name | Category |
|---|-----------|-------------|----------|
| 1 | `glob` | FindFiles | File Management |
| 2 | `grep_search` | SearchFileContent | File Management |
| 3 | `list_directory` | LS | File Management |
| 4 | `read_file` | ReadFile | File Management |
| 5 | `read_many_files` | ReadManyFiles | File Management |
| 6 | `write_file` | WriteFile | File Management |
| 7 | `replace` | Edit | File Management |
| 8 | `run_shell_command` | Shell | Execution |
| 9 | `google_web_search` | WebSearch | Information |
| 10 | `web_fetch` | WebFetch | Information |
| 11 | `ask_user` | AskUser | Agent Coordination |
| 12 | `activate_skill` | ActivateSkill | Agent Coordination |
| 13 | `save_memory` | SaveMemory | Agent Coordination |
| 14 | `write_todos` | WriteTodos | Agent Coordination |
| 15 | `get_internal_docs` | GetInternalDocs | Agent Coordination |
| 16 | `enter_plan_mode` | EnterPlanMode | Plan Mode (v0.29.0+) |
| 17 | `exit_plan_mode` | ExitPlanMode | Plan Mode (v0.29.0+) |

#### Legacy Aliases (1개)

| Legacy Name | Current Name | PR |
|-------------|-------------|-----|
| `search_file_content` | `grep_search` | #18003 |

#### bkit 도구 이름 변경 맵

| bkit 현재 (v1.5.2) | 공식 (v0.29.0+) | 변경 유형 | 영향 범위 |
|---------------------|----------------|-----------|----------|
| `glob_tool` | `glob` | **이름이 처음부터 잘못됨** | 16 agents, 29 skills, 1 hook script |
| `web_search` | `google_web_search` | **변경됨, legacy alias 없음** | 7 agents, 11 skills, 1 hook, 2 docs |
| `spawn_agent` | N/A (built-in 아님) | **제거 필요** | 1 agent, 1 skill, 1 hook, 2 docs |
| `task_write` | `write_todos` | **변경됨** | 1 hook script, 1 doc |
| `grep_search` | `grep_search` | 변경 없음 (유지) | - |
| `activate_skill` | `activate_skill` | 변경 없음 (유지) | - |
| `ask_user` | `ask_user` | 변경 없음 (유지) | - |

#### 비공식 도구 (MCP/Extension 제공, built-in 아님)

| Tool | Type | Notes |
|------|------|-------|
| `delegate_to_agent` | 동적 등록 | 서브에이전트 설정 시에만 활성화 |
| MCP tools (`bkit__*`) | MCP 서버 제공 | bkit MCP 서버의 6개 도구 |

---

## 5. Implementation Plan

### 5.1 Work Breakdown Structure

```
gemini-cli-029-compatibility-fix/
├── WP-1: Tool Registry Module (신규)
│   ├── T-1.1: lib/adapters/gemini/tool-registry.js 생성
│   └── T-1.2: 단위 테스트 작성
│
├── WP-2: Agent Frontmatter 수정 (16개)
│   ├── T-2.1: glob_tool → glob (16개 전부)
│   ├── T-2.2: web_search → google_web_search (7개)
│   ├── T-2.3: spawn_agent 제거 (cto-lead 1개)
│   └── T-2.4: 에이전트 로드 검증
│
├── WP-3: Skill Frontmatter 수정 (29개)
│   ├── T-3.1: glob_tool → glob (29개 전부)
│   ├── T-3.2: web_search → google_web_search (11개)
│   ├── T-3.3: spawn_agent 제거 (pdca 1개)
│   └── T-3.4: 스킬 활성화 검증
│
├── WP-4: Hook Scripts 수정
│   ├── T-4.1: before-tool-selection.js readOnlyTools 배열 업데이트
│   │         glob_tool→glob, web_search→google_web_search,
│   │         spawn_agent 제거, task_write→write_todos
│   ├── T-4.2: Tool Registry 연동 (readOnlyTools를 레지스트리에서 로드)
│   └── T-4.3: v0.30.0 Policy Engine 감지 + 경고 레이어 추가
│
├── WP-5: Adapter / TOOL_MAP 수정
│   ├── T-5.1: TOOL_MAP 업데이트
│   │         WebSearch: web_search → google_web_search
│   │         Grep: grep → grep_search
│   │         Skill: skill → activate_skill
│   │         TodoWrite: task_write → write_todos (추가)
│   ├── T-5.2: REVERSE_TOOL_MAP 자동 업데이트 확인
│   └── T-5.3: Hook scripts의 reverseMapToolName 동작 검증
│
├── WP-6: Configuration 수정
│   ├── T-6.1: gemini-extension.json experimental 블록 제거
│   ├── T-6.2: gemini-extension.json 버전 1.5.2 → 1.5.3
│   ├── T-6.3: bkit.config.json 버전 업데이트
│   └── T-6.4: hooks.json 버전 설명 업데이트
│
├── WP-7: Context / Documentation 수정
│   ├── T-7.1: .gemini/context/tool-reference.md 도구 이름 업데이트
│   ├── T-7.2: README.md 도구 매핑 테이블 업데이트
│   ├── T-7.3: CHANGELOG.md v1.5.3 항목 추가
│   └── T-7.4: bkit-system/philosophy 문서 v1.5.3 업데이트
│
├── WP-8: MCP Server 검증/수정
│   ├── T-8.1: spawn-agent-server.js의 에이전트 스폰 검증
│   │         (gemini -e --yolo 동작 확인)
│   ├── T-8.2: spawn_agent MCP 도구와 built-in delegate_to_agent 충돌 검증
│   └── T-8.3: MCP tools/list 응답에 6개 도구 전부 포함 확인
│
└── WP-9: 검증 및 릴리스
    ├── T-9.1: Smoke Test (도구 이름 기반)
    ├── T-9.2: Agent 로드 테스트 (16개 전부)
    ├── T-9.3: Skill 활성화 테스트 (29개 전부)
    ├── T-9.4: Hook 실행 테스트 (10개 이벤트)
    ├── T-9.5: PDCA E2E 테스트
    ├── T-9.6: 테스트 스위트 업데이트 (EXT-04 등)
    └── T-9.7: Issue #5 해결 확인 및 댓글
```

### 5.2 Detailed Implementation

---

#### WP-1: Tool Registry Module

**New file: `lib/adapters/gemini/tool-registry.js`**

```
Purpose: Gemini CLI 도구 이름의 중앙화된 Source of Truth
Philosophy: "No Guessing" + "MCP tool accuracy"

Exports:
  - BUILTIN_TOOLS: 17개 공식 도구 이름 상수
  - LEGACY_ALIASES: 레거시 이름 → 현재 이름 매핑
  - TOOL_CATEGORIES: 도구별 카테고리 분류
  - getReadOnlyTools(): Plan/Check phase용 읽기 전용 도구 목록
  - getAllTools(): 전체 도구 목록
  - resolveToolName(name): 레거시 이름을 현재 이름으로 변환
  - isValidToolName(name): 유효한 도구 이름 검증
  - CLAUDE_TO_GEMINI_MAP: Claude Code ↔ Gemini CLI 이름 매핑
```

**설계 원칙**:
- 하드코딩된 도구 이름을 한 곳에서 관리
- 향후 Gemini CLI 도구 이름 변경 시 이 파일만 업데이트
- Philosophy "MCP tool accuracy" 구현: 정확한 이름만 허용
- v0.30.0 Policy Engine 전환 시에도 이 레지스트리를 기반으로 TOML 생성 가능

---

#### WP-2: Agent Frontmatter 수정 (16개)

**변경 대상 및 상세**:

| Agent | 변경 항목 | Before | After |
|-------|----------|--------|-------|
| bkend-expert.md | tools[3] | `glob_tool` | `glob` |
| code-analyzer.md | tools[3] | `glob_tool` | `glob` |
| cto-lead.md | tools[5], tools[8], tools[10] | `glob_tool`, `web_search`, `spawn_agent` | `glob`, `google_web_search`, (제거) |
| design-validator.md | tools[3] | `glob_tool` | `glob` |
| enterprise-expert.md | tools[3], tools[5] | `glob_tool`, `web_search` | `glob`, `google_web_search` |
| frontend-architect.md | tools[3], tools[6] | `glob_tool`, `web_search` | `glob`, `google_web_search` |
| gap-detector.md | tools[3], tools[5] | `glob_tool`, `web_search` | `glob`, `google_web_search` |
| infra-architect.md | tools[3] | `glob_tool` | `glob` |
| pdca-iterator.md | tools[4] | `glob_tool` | `glob` |
| pipeline-guide.md | tools[1] | `glob_tool` | `glob` |
| product-manager.md | tools[2], tools[4] | `glob_tool`, `web_search` | `glob`, `google_web_search` |
| qa-monitor.md | tools[4] | `glob_tool` | `glob` |
| qa-strategist.md | tools[1] | `glob_tool` | `glob` |
| report-generator.md | tools[3] | `glob_tool` | `glob` |
| security-architect.md | tools[3], tools[4] | `glob_tool`, `web_search` | `glob`, `google_web_search` |
| starter-guide.md | tools[3], tools[5] | `glob_tool`, `web_search` | `glob`, `google_web_search` |

**cto-lead.md 특별 처리**:
- `spawn_agent`는 built-in 도구가 아님
- 제거하거나, Gemini CLI의 동적 도구 `delegate_to_agent`로 대체 검토
- MCP 도구 `bkit__spawn_agent`는 별도이므로 frontmatter에서 제거하고 MCP로 위임

---

#### WP-3: Skill Frontmatter 수정 (29개)

**glob_tool → glob** (29개 전부):

```
skills/bkit-rules/SKILL.md
skills/bkit-templates/SKILL.md
skills/bkend-auth/SKILL.md
skills/bkend-cookbook/SKILL.md
skills/bkend-data/SKILL.md
skills/bkend-guides/SKILL.md
skills/bkend-mcp/SKILL.md
skills/bkend-quickstart/SKILL.md
skills/bkend-security/SKILL.md
skills/bkend-storage/SKILL.md
skills/code-review/SKILL.md
skills/desktop-app/SKILL.md
skills/development-pipeline/SKILL.md
skills/dynamic/SKILL.md
skills/enterprise/SKILL.md
skills/gemini-cli-learning/SKILL.md
skills/mobile-app/SKILL.md
skills/pdca/SKILL.md
skills/phase-1-schema/SKILL.md
skills/phase-2-convention/SKILL.md
skills/phase-3-mockup/SKILL.md
skills/phase-4-api/SKILL.md
skills/phase-5-design-system/SKILL.md
skills/phase-6-ui-integration/SKILL.md
skills/phase-7-seo-security/SKILL.md
skills/phase-8-review/SKILL.md
skills/phase-9-deployment/SKILL.md
skills/starter/SKILL.md
skills/zero-script-qa/SKILL.md
```

**web_search → google_web_search** (11개):

```
skills/starter/SKILL.md
skills/phase-5-design-system/SKILL.md
skills/desktop-app/SKILL.md
skills/phase-3-mockup/SKILL.md
skills/mobile-app/SKILL.md
skills/enterprise/SKILL.md
skills/phase-7-seo-security/SKILL.md
skills/pdca/SKILL.md
skills/dynamic/SKILL.md
skills/gemini-cli-learning/SKILL.md
```

**spawn_agent 제거** (1개):

```
skills/pdca/SKILL.md
```

---

#### WP-4: Hook Scripts 수정

**T-4.1: before-tool-selection.js readOnlyTools**

```
Before:
  const readOnlyTools = [
    'read_file', 'read_many_files', 'grep_search', 'glob_tool',
    'list_directory', 'web_search', 'web_fetch', 'activate_skill',
    'task_write', 'spawn_agent'
  ];

After (Tool Registry 사용):
  const { getReadOnlyTools } = require(toolRegistryPath);
  const readOnlyTools = getReadOnlyTools();

Registry returns:
  ['read_file', 'read_many_files', 'grep_search', 'glob',
   'list_directory', 'google_web_search', 'web_fetch', 'activate_skill',
   'write_todos', 'save_memory']
```

변경 항목:
- `glob_tool` → `glob`
- `web_search` → `google_web_search`
- `task_write` → `write_todos`
- `spawn_agent` → 제거 (built-in 아님), `save_memory` 추가

**T-4.3: v0.30.0 Policy Engine 호환 레이어**

```javascript
// before-tool-selection.js에 추가
function detectPolicyEngine() {
  // v0.30.0+에서 Policy Engine이 활성화되어 있는지 감지
  const policyDir = path.join(os.homedir(), '.gemini', 'policies');
  if (fs.existsSync(policyDir)) {
    const files = fs.readdirSync(policyDir).filter(f => f.endsWith('.toml'));
    if (files.length > 0) {
      adapter.debugLog('PolicyEngine',
        'Policy Engine detected. bkit tool filtering may conflict. ' +
        'Consider migrating to TOML policies.');
      return true;
    }
  }
  return false;
}
```

---

#### WP-5: Adapter / TOOL_MAP 수정

**lib/adapters/gemini/index.js TOOL_MAP**:

```
Before:
  'Glob': 'glob',              → OK (이미 맞음)
  'Grep': 'grep',              → 'grep_search'로 수정
  'WebSearch': 'web_search',   → 'google_web_search'로 수정
  'Skill': 'skill',            → 'activate_skill'로 수정

After:
  'Glob': 'glob',
  'Grep': 'grep_search',
  'WebSearch': 'google_web_search',
  'Skill': 'activate_skill',

추가:
  'TodoWrite': 'write_todos',      (Claude Code TodoWrite 매핑)
  'SaveMemory': 'save_memory',     (새 도구)
  'EnterPlanMode': 'enter_plan_mode', (v0.29.0+)
  'ExitPlanMode': 'exit_plan_mode',   (v0.29.0+)
```

---

#### WP-6: Configuration 수정

**gemini-extension.json**:

```json
// Before
{
  "version": "1.5.2",
  "experimental": {
    "skills": true
  }
}

// After
{
  "version": "1.5.3"
  // experimental 블록 완전 제거 (Skills/Hooks GA since v0.26.0)
}
```

---

#### WP-7: Context / Documentation 수정

**T-7.1: .gemini/context/tool-reference.md**

```
Before:
| `web_search` | Search the web | Finding documentation |
| `spawn_agent` | Launch sub-agent | Complex multi-step tasks |
| `task_write` | Manage tasks | Task tracking |

After:
| `google_web_search` | Search the web | Finding documentation |
| `write_todos` | Manage task lists | Task tracking |
| `save_memory` | Save to long-term memory | Cross-session persistence |
| `enter_plan_mode` | Enter planning mode | Structured planning (v0.29.0+) |
```

**T-7.2: README.md 도구 매핑 테이블**

```
Before:
| WebSearch | web_search |
| Task | spawn_agent |
| TodoWrite | task_write |

After:
| WebSearch | google_web_search |
| Grep | grep_search |
| Skill | activate_skill |
| TodoWrite | write_todos |
```

**T-7.4: bkit-system/philosophy 문서**

4개 philosophy 문서의 버전 기록, 컴포넌트 카운트, 아키텍처 다이어그램을 v1.5.3 기준으로 업데이트:
- core-mission.md: Component counts, v1.5.3 features
- ai-native-principles.md: v1.5.3 model distribution
- pdca-methodology.md: v1.5.3 PDCA notes
- context-engineering.md: v1.5.3 Tool Registry, tool accuracy enhancement

핵심 추가 사항: **"Tool Name Accuracy is a Context Engineering principle"** - 정확한 도구 이름 사용이 LLM의 올바른 도구 호출을 보장한다는 원칙을 context-engineering.md에 명시.

---

#### WP-8: MCP Server 검증/수정

**T-8.1: gemini -e --yolo 검증**

- v0.29.0에서 `--yolo` 모드 변경 사항 확인
- #18153 (로컬 서브에이전트 정책 우회 제거)의 영향 확인
- `ask_user` 도구가 yolo 모드에서 허용됨 (v0.29.0 변경)

**T-8.2: spawn_agent MCP 도구 명칭**

- MCP 서버의 `spawn_agent` 도구는 **MCP 프로토콜의 커스텀 도구**이므로 built-in 이름 충돌과 무관
- MCP 도구 이름은 `bkit__spawn_agent`로 네임스페이스 처리됨
- 변경 불필요, 단 문서에서 built-in 도구와의 구분 명시

**T-8.3: Default execution limits (#18274)**

- v0.29.0에서 서브에이전트 기본 실행 제한 도입
- spawn-agent-server.js의 기본 timeout (300000ms = 5분) 확인
- 필요시 timeout 조정

---

#### WP-9: 검증 및 릴리스

**T-9.1: Smoke Test Script**

```bash
# 1. Gemini CLI 버전 확인
gemini --version  # Expected: 0.29.1

# 2. Extension 로드 확인 (에러 0건)
gemini extensions list 2>&1 | grep -c "Error"  # Expected: 0

# 3. 도구 이름 확인
gemini tools list  # 17개 built-in 도구 확인

# 4. MCP 서버 도구 목록
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node mcp/spawn-agent-server.js

# 5. Hook 실행 테스트
echo '{"prompt":"test verify"}' | node hooks/scripts/before-agent.js
```

**T-9.6: 테스트 스위트 업데이트**

- `EXT-04: experimental.skills is enabled` → 제거 또는 반전 (`experimental block not present`)
- `EXT-excludeTools` → `excludeTools` 필드 존재 여부만 확인
- 에이전트 도구 이름 검증 테스트 추가
- 스킬 allowed-tools 검증 테스트 추가

---

## 6. File Change Matrix

### 신규 파일 (1개)

| File | Purpose | LOC (Est.) |
|------|---------|-----------|
| `lib/adapters/gemini/tool-registry.js` | 중앙화된 도구 이름 레지스트리 | ~120 |

### 수정 파일 (55개+)

| Category | Files | Changes |
|----------|-------|---------|
| Agents | 16 | frontmatter tools 수정 |
| Skills | 29 | frontmatter allowed-tools 수정 |
| Hook scripts | 1 | before-tool-selection.js (Tool Registry 연동) |
| Adapter | 1 | lib/adapters/gemini/index.js (TOOL_MAP) |
| Config | 3 | gemini-extension.json, bkit.config.json, hooks.json |
| Context docs | 1 | .gemini/context/tool-reference.md |
| README | 1 | README.md |
| CHANGELOG | 1 | CHANGELOG.md |
| Philosophy | 4 | bkit-system/philosophy/*.md |
| **Total** | **57+** | |

---

## 7. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| 도구 이름이 또 변경됨 (v0.30.0+) | Medium | Medium | Tool Registry 중앙화로 변경 최소화 |
| `--yolo` 모드 동작 변경 | Low | High | 스폰 테스트로 사전 검증 |
| v0.28.0 사용자 하위호환 깨짐 | Low | Medium | 최소 요구 버전을 v0.29.0으로 명시 |
| grep_search가 향후 deprecation | Low | Low | Tool Registry에 alias 매핑 준비됨 |
| Policy Engine이 bkit 필터링과 충돌 | Low | Medium | 감지 + 경고 로그로 선제 대응 |

---

## 8. Brainstorming Log (Plan Plus)

| Phase | Decision | Rationale |
|-------|----------|-----------|
| P1-Q1 | v0.29.x 호환 + v0.30.0 선제 대응 | Issue #5 즉시 해결 + 차기 버전 대비 |
| P1-Q2 | 설치 사용자 + 컨트리뷰터 모두 | 사용자에게는 정상 작동, 컨트리뷰터에게는 유지보수 용이성 |
| P2 | Approach A: Adaptive Tool Registry | Frontmatter 직접 수정 + 동적 코드 레지스트리 하이브리드 |
| P3 | 4개 항목 전부 포함 + 모든 기능 정상 동작 | 사용자 요구: "bkit의 모든 기능이 정상 동작" |
| P4-S1 | Frontmatter 직접 수정 + Hook Registry 중앙화 | 정적 YAML vs 동적 JS의 기술적 제약 |
| P4-S2 | 공식 문서 기준 전체 수정 | "No Guessing" 철학 준수 |
| P4-S3 | Philosophy 문서 업데이트 포함 | v1.5.3 기능을 철학과 연결 |
| P4-S4 | 호환 레이어만 추가 | YAGNI - v0.30.0 stable 전까지 유예 |

---

## 9. Dependencies

| Dependency | Type | Notes |
|-----------|------|-------|
| Gemini CLI v0.29.1 | External | 테스트 환경 필수 |
| Node.js v14+ | External | CommonJS modules |
| Impact Analysis Report | Internal | docs/04-report/gemini-cli-029-030-upgrade-impact-analysis.report.md |

---

## 10. Definition of Done

- [ ] 16개 에이전트 Gemini CLI v0.29.1에서 에러 없이 로드
- [ ] 29개 스킬 정상 활성화
- [ ] 10개 Hook 이벤트 정상 실행
- [ ] PDCA E2E (plan→design→do→analyze→report) 성공
- [ ] MCP 서버 6개 도구 정상 작동
- [ ] Tool Registry 모듈 생성 및 Hook 연동
- [ ] TOOL_MAP 공식 이름으로 전체 업데이트
- [ ] gemini-extension.json experimental 제거
- [ ] v0.30.0 Policy Engine 감지 레이어 추가
- [ ] Philosophy 문서 v1.5.3 업데이트
- [ ] CHANGELOG.md v1.5.3 항목 추가
- [ ] README.md 도구 매핑 테이블 업데이트
- [ ] 테스트 스위트 업데이트 및 통과
- [ ] Issue #5에 해결 댓글 작성

---

**Plan Generated**: 2026-02-19
**Method**: Plan Plus (Brainstorming-Enhanced PDCA Planning)
**Next Step**: `/pdca design gemini-cli-029-compatibility-fix`
