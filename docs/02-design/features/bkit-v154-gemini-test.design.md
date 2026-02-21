# Design Document: bkit-gemini v1.5.4 Comprehensive Extension Test

> **Feature**: bkit-v154-gemini-test
> **Plan Reference**: [bkit-v154-gemini-test.plan.md](../../01-plan/features/bkit-v154-gemini-test.plan.md)
> **Date**: 2026-02-21
> **Author**: CTO Team (AI-assisted)
> **Total Test Cases**: 204
> **Implementation**: Gemini CLI Interactive Test Script

---

## 1. Design Overview

### 1.1 Design Goal

Plan 문서의 204개 테스트 케이스를 Gemini CLI에서 실행 가능한 **구조화된 테스트 스크립트**로 설계합니다. 테스트는 다음 두 가지 형태로 구현합니다:

1. **Interactive Test Prompts**: Gemini CLI 세션에서 직접 입력하는 프롬프트 시퀀스
2. **Automated Verification**: `node tests/run-all.js`로 실행하는 코드 기반 검증

### 1.2 Architecture

```
테스트 실행 흐름:
┌─────────────────────────────────────────────┐
│ Gemini CLI Session                          │
│                                             │
│  1. 세션 시작 → SessionStart Hook 검증      │
│  2. 프롬프트 입력 → 응답 내용 검증          │
│  3. 커맨드 실행 → 파일/상태 변경 검증       │
│  4. 세션 종료 → SessionEnd Hook 검증        │
│                                             │
│  [검증 방법]                                │
│  A. 응답 텍스트에 기대 키워드 포함 확인     │
│  B. 파일 시스템 변경 확인 (read_file)       │
│  C. .pdca-status.json 상태 변경 확인        │
│  D. Hook 스크립트 실행 로그 확인            │
└─────────────────────────────────────────────┘
```

### 1.3 File Structure

```
tests/
├── run-all.js                     # 기존 자동화 테스트 실행기 (72 tests)
├── run-all-tests.sh               # 셸 테스트 실행기
├── test-utils.js                  # 테스트 유틸리티
├── suites/
│   ├── tc01-hooks.js              # Hook System (18 tests)
│   ├── tc02-skills.js             # Skill System (9 tests)
│   ├── tc03-agents.js             # Agent System (4 tests)
│   ├── tc04-lib-modules.js        # Lib Modules (19 tests)
│   ├── tc05-mcp.js                # MCP Server (2 tests)
│   ├── tc06-commands.js           # TOML Commands (3 tests)
│   ├── tc07-config.js             # Configuration (7 tests)
│   ├── tc08-context.js            # Context Engineering (3 tests)
│   ├── tc09-pdca-e2e.js           # PDCA E2E (3 tests)
│   └── tc10-philosophy.js         # Philosophy (4 tests)
└── gemini-interactive/            # [신규] Gemini CLI 대화형 테스트 가이드
    └── test-prompts.md            # 204개 테스트 프롬프트 + 검증 기준
```

---

## 2. Detailed Test Specifications

### 2.1 TC-01: Session Startup & Hook System (P0) - 18 Cases

#### FR-01-01: hooks.json 이벤트 등록 검증

**검증 대상 파일**: `hooks/hooks.json`

```
[Gemini CLI 프롬프트]
> hooks/hooks.json 파일을 읽어서 등록된 훅 이벤트 목록을 보여줘

[기대 응답에 포함될 내용]
- 10개 이벤트 키: SessionStart, BeforeAgent, BeforeModel, AfterModel,
  BeforeToolSelection, BeforeTool, AfterTool, AfterAgent, PreCompress, SessionEnd
- 각 이벤트에 연결된 스크립트 파일 경로

[자동화 검증 코드] (tc01-hooks.js 기존)
```

**hooks.json 등록 맵핑 (정확한 값)**:

| Event | Hook Name | Script | Matcher | Timeout |
|-------|-----------|--------|---------|:-------:|
| SessionStart | bkit-session-init | session-start.js | - | 5000 |
| BeforeAgent | bkit-intent-detection | before-agent.js | - | 3000 |
| BeforeModel | bkit-before-model | before-model.js | - | 3000 |
| AfterModel | bkit-after-model | after-model.js | - | 3000 |
| BeforeToolSelection | bkit-tool-filter | before-tool-selection.js | - | 3000 |
| BeforeTool[0] | bkit-pre-write | before-tool.js | `write_file\|replace` | 5000 |
| BeforeTool[1] | bkit-pre-bash | before-tool.js | `run_shell_command` | 5000 |
| AfterTool[0] | bkit-post-write | after-tool.js | `write_file` | 5000 |
| AfterTool[1] | bkit-post-bash | after-tool.js | `run_shell_command` | 5000 |
| AfterTool[2] | bkit-post-skill | after-tool.js | `activate_skill` | 5000 |
| AfterAgent | bkit-agent-cleanup | after-agent.js | - | 10000 |
| PreCompress | bkit-context-save | pre-compress.js | - | 5000 |
| SessionEnd | bkit-cleanup | session-end.js | - | 10000 |

**PDCA Post-Hook 스크립트 (hooks/scripts/skills/)**:

| Script | Trigger Condition | Action |
|--------|-------------------|--------|
| pdca-plan-post.js | After `/pdca plan` | Update .bkit-memory.json, .pdca-status.json |
| pdca-design-post.js | After `/pdca design` | Update .bkit-memory.json |
| pdca-analyze-post.js | After `/pdca analyze` | Update matchRate |
| pdca-iterate-post.js | After `/pdca iterate` | Update iterationCount |
| pdca-report-post.js | After `/pdca report` | Update phase to "completed" |

#### FR-01-02: SessionStart Hook 출력 검증

**검증 대상 파일**: `hooks/scripts/session-start.js`

```
[Gemini CLI 프롬프트] (새 세션 시작 시 자동 실행)

[기대 출력 키워드 체크리스트]
□ "bkit Vibecoding Kit v1.5.4"
□ "Session Startup"
□ "Previous Work Detected" (PDCA 상태 있을 경우)
□ "CTO-Led Agent Teams"
□ "Output Styles (v1.5.5)"
□ "Agent Memory (Auto-Active)"
□ "PDCA Core Rules"
□ "Auto-Trigger Keywords"
□ "bkit Feature Usage Report"
□ version: '1.5.4' (4곳 - Line 3, 49, 67, 222)
```

#### FR-01-03 ~ FR-01-15: 개별 Hook 이벤트 실행 검증

각 Hook의 실행은 Gemini CLI에서 해당 트리거 액션을 수행하여 간접 검증합니다:

| TC | Hook Event | Trigger Action (Gemini CLI) | 검증 방법 |
|:---:|-----------|---------------------------|-----------|
| 03 | BeforeAgent | 아무 메시지 입력 | 응답에 Intent 감지 반영 확인 |
| 04 | BeforeModel | 아무 메시지 입력 | 모델 호출 전 컨텍스트 주입 확인 |
| 05 | AfterModel | 아무 메시지 입력 | 응답 후처리 확인 |
| 06 | BeforeToolSelection | 도구 필요한 요청 | 도구 필터링 동작 확인 |
| 07 | BeforeTool(write) | "test.txt 만들어줘" | write_file 실행 전 훅 동작 |
| 08 | BeforeTool(replace) | "test.txt 수정해줘" | replace 실행 전 훅 동작 |
| 09 | BeforeTool(shell) | "git status 실행해줘" | run_shell_command 실행 전 훅 동작 |
| 10 | AfterTool(write) | 파일 생성 후 | write_file 실행 후 훅 동작 |
| 11 | AfterTool(shell) | 명령 실행 후 | run_shell_command 실행 후 훅 동작 |
| 12 | AfterTool(skill) | "/pdca status" | activate_skill 실행 후 훅 동작 |
| 13 | AfterAgent | 에이전트 작업 완료 후 | cleanup 훅 동작 |
| 14 | PreCompress | 긴 대화 후 | context-save 훅 동작 |
| 15 | SessionEnd | 세션 종료 | cleanup 훅 동작 |

---

### 2.2 TC-02: Skill System (P0) - 29 Cases

#### FR-02: Skill 디렉토리 구조 및 TOML 연결

**29개 스킬 목록 (정확한 디렉토리명)**:

| # | Directory | Command | TOML File | Category |
|:-:|-----------|---------|-----------|----------|
| 1 | skills/pdca/ | /pdca | commands/pdca.toml | PDCA |
| 2 | skills/starter/ | /starter | commands/starter.toml | Level |
| 3 | skills/dynamic/ | /dynamic | commands/dynamic.toml | Level |
| 4 | skills/enterprise/ | /enterprise | commands/enterprise.toml | Level |
| 5 | skills/phase-1-schema/ | - | - | Phase |
| 6 | skills/phase-2-convention/ | - | - | Phase |
| 7 | skills/phase-3-mockup/ | - | - | Phase |
| 8 | skills/phase-4-api/ | - | - | Phase |
| 9 | skills/phase-5-design-system/ | - | - | Phase |
| 10 | skills/phase-6-ui-integration/ | - | - | Phase |
| 11 | skills/phase-7-seo-security/ | - | - | Phase |
| 12 | skills/phase-8-review/ | - | - | Phase |
| 13 | skills/phase-9-deployment/ | - | - | Phase |
| 14 | skills/code-review/ | /code-review | commands/review.toml | Utility |
| 15 | skills/zero-script-qa/ | /zero-script-qa | commands/qa.toml | Utility |
| 16 | skills/development-pipeline/ | /development-pipeline | commands/pipeline.toml | Utility |
| 17 | skills/gemini-cli-learning/ | /learn | commands/learn.toml | Utility |
| 18 | skills/mobile-app/ | - | - | Platform |
| 19 | skills/desktop-app/ | - | - | Platform |
| 20 | skills/bkit-rules/ | - | - | Core |
| 21 | skills/bkit-templates/ | - | - | Core |
| 22 | skills/bkend-quickstart/ | /bkend-quickstart | commands/bkend-quickstart.toml | bkend |
| 23 | skills/bkend-auth/ | /bkend-auth | commands/bkend-auth.toml | bkend |
| 24 | skills/bkend-data/ | /bkend-data | commands/bkend-data.toml | bkend |
| 25 | skills/bkend-storage/ | /bkend-storage | commands/bkend-storage.toml | bkend |
| 26 | skills/bkend-mcp/ | /bkend-mcp | commands/bkend-mcp.toml | bkend |
| 27 | skills/bkend-security/ | /bkend-security | commands/bkend-security.toml | bkend |
| 28 | skills/bkend-cookbook/ | /bkend-cookbook | commands/bkend-cookbook.toml | bkend |
| 29 | skills/bkend-guides/ | /bkend-guides | commands/bkend-guides.toml | bkend |

#### Gemini CLI 테스트 프롬프트 시퀀스

**PDCA Skills (TC-02-01 ~ TC-02-08)**:
```
Prompt 1: /pdca status
  → 검증: "PDCA Status" 또는 상태 정보 포함
  → 검증: primaryFeature 표시

Prompt 2: /pdca plan skill-test-feature
  → 검증: Plan 문서 생성 안내 또는 기존 문서 표시
  → 검증: docs/01-plan/features/ 참조

Prompt 3: /pdca next
  → 검증: 다음 단계 추천 (현재 phase 기반)
  → 검증: 추천 커맨드 표시
```

**Level Skills (TC-02-09 ~ TC-02-11)**:
```
Prompt 4: /starter
  → 검증: "HTML", "CSS", "JavaScript" 또는 "static" 키워드
  → 검증: Starter 레벨 가이드 내용

Prompt 5: /dynamic
  → 검증: "Next.js", "bkend", "BaaS", "fullstack" 키워드
  → 검증: init dynamic 안내

Prompt 6: /enterprise
  → 검증: "microservices", "Kubernetes", "Terraform" 키워드
  → 검증: init enterprise 안내
```

**Phase Skills (TC-02-12 ~ TC-02-20)**:
```
Prompt 7: 스키마 정의해줘
  → 검증: phase-1-schema 스킬 활성화 (트리거 키워드 매치)

Prompt 8: 목업 만들어줘
  → 검증: phase-3-mockup 스킬 활성화

Prompt 9: API 설계해줘
  → 검증: phase-4-api 스킬 활성화

Prompt 10: 배포해줘
  → 검증: phase-9-deployment 스킬 활성화
```

**Utility & Platform Skills (TC-02-21 ~ TC-02-29)**:
```
Prompt 11: /code-review
  → 검증: 코드 리뷰 가이드 로딩

Prompt 12: /zero-script-qa
  → 검증: Zero Script QA 방법론

Prompt 13: /development-pipeline
  → 검증: 9-phase 파이프라인

Prompt 14: /bkit
  → 검증: bkit 전체 기능 목록

Prompt 15: 모바일 앱 만들어줘
  → 검증: mobile-app 스킬 (React Native, Flutter)

Prompt 16: 데스크톱 앱 만들어줘
  → 검증: desktop-app 스킬 (Electron, Tauri)
```

---

### 2.3 TC-03: Agent System (P0) - 32 Cases

#### FR-03: 16 Agent Frontmatter 정확한 값

**agents/*.md frontmatter 형식**:
```yaml
---
name: {agent-name}
description: |
  {description with triggers}
model: {gemini-3-pro|gemini-3-flash}
tools:
  - {tool1}
  - {tool2}
temperature: {0.2~0.8}
max_turns: {number}
---
```

**16개 에이전트 정확한 Frontmatter 검증값**:

| # | Agent File | model | temperature | tools (count) |
|:-:|-----------|-------|:-----------:|:-------------:|
| 1 | cto-lead.md | gemini-3-pro | 0.4 | 11+ |
| 2 | code-analyzer.md | gemini-3-pro | 0.3 | 6+ |
| 3 | design-validator.md | gemini-3-pro | 0.2 | 5+ |
| 4 | enterprise-expert.md | gemini-3-pro | 0.3 | 7+ |
| 5 | frontend-architect.md | gemini-3-pro | 0.4 | 8+ |
| 6 | gap-detector.md | gemini-3-pro | 0.2 | 5+ |
| 7 | infra-architect.md | gemini-3-pro | 0.3 | 8+ |
| 8 | qa-strategist.md | gemini-3-pro | 0.3 | 6+ |
| 9 | security-architect.md | gemini-3-pro | 0.2 | 5+ |
| 10 | bkend-expert.md | gemini-3-flash | 0.4 | 7+ |
| 11 | pdca-iterator.md | gemini-3-flash | 0.4 | 8+ |
| 12 | pipeline-guide.md | gemini-3-flash | 0.4 | 6+ |
| 13 | product-manager.md | gemini-3-flash | 0.6 | 7+ |
| 14 | qa-monitor.md | gemini-3-flash | 0.3 | 7+ |
| 15 | report-generator.md | gemini-3-flash | 0.6 | 6+ |
| 16 | starter-guide.md | gemini-3-flash | 0.8 | 6+ |

#### Agent Trigger 테스트 프롬프트

```
[Pro Agents]
Prompt: "팀 구성해서 프로젝트 진행해줘" → cto-lead
Prompt: "코드 품질 분석해줘" → code-analyzer
Prompt: "설계 문서 검증해줘" → design-validator
Prompt: "마이크로서비스 아키텍처 설계해줘" → enterprise-expert
Prompt: "프론트엔드 아키텍처 설계해줘" → frontend-architect
Prompt: "설계-구현 갭 분석해줘" → gap-detector
Prompt: "AWS 인프라 설계해줘" → infra-architect
Prompt: "테스트 전략 수립해줘" → qa-strategist
Prompt: "보안 취약점 분석해줘" → security-architect

[Flash Agents]
Prompt: "bkend.ai로 로그인 구현해줘" → bkend-expert
Prompt: "자동으로 개선해줘" → pdca-iterator
Prompt: "뭐부터 시작하면 돼?" → pipeline-guide
Prompt: "요구사항 정의해줘" → product-manager
Prompt: "docker logs 분석해줘" → qa-monitor
Prompt: "완료 보고서 생성해줘" → report-generator
Prompt: "초보자인데 도와줘" → starter-guide
```

**검증 기준**:
- 응답에 해당 에이전트의 전문 영역 관련 내용 포함
- 에이전트 .md 파일의 description에 명시된 전문성 반영
- agent-triggers.md에 정의된 키워드와 매치

---

### 2.4 TC-04: TOML Commands (P1) - 18 Cases

#### FR-04: TOML 커맨드 파일 구조

**TOML 파일 필수 필드**:
```toml
description = "..."
prompt = """
@skills/{skill-name}/SKILL.md
...
"""
```

**18개 TOML 커맨드 정확한 검증값**:

| # | File | description 시작 | @skills 참조 |
|:-:|------|-----------------|-------------|
| 1 | pdca.toml | "PDCA cycle management" | @skills/pdca/SKILL.md |
| 2 | starter.toml | Static/Starter 관련 | @skills/starter/SKILL.md |
| 3 | dynamic.toml | Dynamic/Fullstack 관련 | @skills/dynamic/SKILL.md |
| 4 | enterprise.toml | Enterprise 관련 | @skills/enterprise/SKILL.md |
| 5 | pipeline.toml | Development pipeline 관련 | @skills/development-pipeline/SKILL.md |
| 6 | review.toml | Code review 관련 | @skills/code-review/SKILL.md |
| 7 | qa.toml | QA/Testing 관련 | @skills/zero-script-qa/SKILL.md |
| 8 | learn.toml | Learning/교육 관련 | @skills/gemini-cli-learning/SKILL.md |
| 9 | bkit.toml | bkit help 관련 | - (독립 프롬프트) |
| 10 | bkend-quickstart.toml | bkend quickstart | @skills/bkend-quickstart/SKILL.md |
| 11 | bkend-auth.toml | bkend auth | @skills/bkend-auth/SKILL.md |
| 12 | bkend-data.toml | bkend data | @skills/bkend-data/SKILL.md |
| 13 | bkend-storage.toml | bkend storage | @skills/bkend-storage/SKILL.md |
| 14 | bkend-mcp.toml | bkend MCP | @skills/bkend-mcp/SKILL.md |
| 15 | bkend-cookbook.toml | bkend cookbook | @skills/bkend-cookbook/SKILL.md |
| 16 | bkend-guides.toml | bkend guides | @skills/bkend-guides/SKILL.md |
| 17 | bkend-security.toml | bkend security | @skills/bkend-security/SKILL.md |
| 18 | github-stats.toml | GitHub stats | - (독립 프롬프트) |

**Gemini CLI 검증 프롬프트**:
```
> commands/ 디렉토리의 모든 .toml 파일을 읽어서 각 description과 skill 연결 목록을 보여줘
  → 검증: 18개 파일 존재, 각 파일 TOML 파싱 성공, description 필드 존재
```

---

### 2.5 TC-05: Lib Modules (P0) - 22 Cases

#### FR-05-A: Tool Registry (`lib/adapters/gemini/tool-registry.js`)

**정확한 상수 값 (소스 코드 기준)**:

```javascript
// BUILTIN_TOOLS (17개)
const BUILTIN_TOOLS = {
  GLOB: 'glob',
  GREP_SEARCH: 'grep_search',
  LIST_DIRECTORY: 'list_directory',
  READ_FILE: 'read_file',
  READ_MANY_FILES: 'read_many_files',
  WRITE_FILE: 'write_file',
  REPLACE: 'replace',
  RUN_SHELL_COMMAND: 'run_shell_command',
  GOOGLE_WEB_SEARCH: 'google_web_search',
  WEB_FETCH: 'web_fetch',
  ASK_USER: 'ask_user',
  ACTIVATE_SKILL: 'activate_skill',
  SAVE_MEMORY: 'save_memory',
  WRITE_TODOS: 'write_todos',
  GET_INTERNAL_DOCS: 'get_internal_docs',
  ENTER_PLAN_MODE: 'enter_plan_mode',
  EXIT_PLAN_MODE: 'exit_plan_mode'
};

// LEGACY_ALIASES (1개)
'search_file_content' -> 'grep_search'

// BKIT_LEGACY_NAMES (3개)
'glob_tool' -> 'glob'
'web_search' -> 'google_web_search'
'task_write' -> 'write_todos'

// FORWARD_ALIASES (5개)
'edit_file' -> 'replace'
'find_files' -> 'glob'
'find_in_file' -> 'grep_search'
'web_search' -> 'google_web_search'
'read_files' -> 'read_many_files'

// REVERSE_FORWARD_ALIASES (5개 - 자동 생성)
'replace' -> 'edit_file'
'glob' -> 'find_files'
'grep_search' -> 'find_in_file'
'google_web_search' -> 'web_search'
'read_many_files' -> 'read_files'

// TOOL_CATEGORIES (5개 카테고리)
FILE_MANAGEMENT: 7 tools
EXECUTION: 1 tool
INFORMATION: 2 tools
AGENT_COORDINATION: 5 tools
PLAN_MODE: 2 tools

// CLAUDE_TO_GEMINI_MAP (14개)
Write -> write_file, Edit -> replace, Read -> read_file, Bash -> run_shell_command, ...
```

**Gemini CLI 검증 프롬프트**:
```
> lib/adapters/gemini/tool-registry.js 파일을 읽어서 다음을 확인해줘:
> 1. BUILTIN_TOOLS에 17개 도구가 있는지
> 2. FORWARD_ALIASES에 5개 매핑이 있는지
> 3. resolveToolName 함수가 존재하는지
> 4. @version이 1.5.4인지
  → 검증: 모든 항목 확인 완료
```

#### FR-05-B: Version Detector (`lib/adapters/gemini/version-detector.js`)

**정확한 함수 시그니처 및 동작**:

```javascript
// 7개 exported 함수
module.exports = {
  detectVersion,      // () => { major, minor, patch, previewNum, raw, isPreview }
  parseVersion,       // (raw: string) => { major, minor, patch, previewNum, raw, isPreview }
  compareVersions,    // (a, b) => -1 | 0 | 1
  isVersionAtLeast,   // (target: string) => boolean
  getFeatureFlags,    // () => { hasPlanMode, hasPolicyEngine, ... } (7 flags)
  getVersionSummary,  // () => string
  resetCache          // () => void
};

// 7개 Feature Flags 및 버전 임계값
hasPlanMode:               isVersionAtLeast('0.29.0')
hasPolicyEngine:           isVersionAtLeast('0.30.0')
hasExcludeToolsDeprecated: isVersionAtLeast('0.30.0')
hasGemini3Default:         isVersionAtLeast('0.29.0')
hasSkillsStable:           isVersionAtLeast('0.26.0')
hasExtensionRegistry:      isVersionAtLeast('0.29.0')
hasSDK:                    isVersionAtLeast('0.30.0')

// Detection Strategy Order
1. process.env.GEMINI_CLI_VERSION (환경변수)
2. npm list -g @google/gemini-cli --depth=0 --json (npm)
3. gemini --version (CLI)
4. Default: '0.29.0' (미감지 시)

// Cache: _cachedVersion (한 번 감지 후 재사용)
```

**Gemini CLI 검증 프롬프트**:
```
> lib/adapters/gemini/version-detector.js 파일을 분석해서:
> 1. 7개 exported 함수 목록
> 2. getFeatureFlags()의 7개 플래그와 각 버전 임계값
> 3. 3가지 Detection Strategy 순서
> 를 확인해줘
  → 검증: 위 표의 모든 값과 일치
```

#### FR-05-C: Policy Migrator (`lib/adapters/gemini/policy-migrator.js`)

**정확한 함수 시그니처**:

```javascript
// 6개 exported 함수
module.exports = {
  parsePermissionKey,   // (key: string) => { tool, pattern }
  mapDecision,          // (decision: string) => string
  getPriority,          // (decision: string) => number
  convertToToml,        // (permissions: object) => string
  hasPolicyFiles,       // (projectDir: string) => boolean
  generatePolicyFile    // (projectDir: string, configPath: string) => void
};

// mapDecision 매핑
'ask' -> 'ask_user'
'allow' -> 'allow'
'deny' -> 'deny'

// getPriority 매핑
'deny' -> 100
'ask_user' -> 50
'allow' -> 10
```

#### FR-05-D: Permission Manager (`lib/core/permission.js`)

**정확한 exported 함수**:

```javascript
module.exports = {
  PERMISSION_LEVELS,      // { ALLOW: 'allow', DENY: 'deny', ASK: 'ask' }
  DEFAULT_PATTERNS,       // run_shell_command + write_file 패턴
  loadPermissionConfig,   // (projectDir) => { tools, patterns, policyEngineActive? }
  checkPermission,        // (toolName, toolInput, projectDir?) => { level, reason, matchedPattern }
  formatPermissionResult, // (result, toolName, toolInput) => { status, context?, reason? }
  validateBatch,          // (toolCalls, projectDir) => Array
  hasDeniedInBatch,       // (batchResults) => { hasDenied, deniedTools }
  getPermissionSummary,   // (projectDir?) => object
  matchesGlobPattern,     // (value, pattern) => boolean
  matchesAnyPattern,      // (value, patterns) => { matched, pattern }
  getMatchValue           // (toolName, toolInput) => string
};

// Policy Engine Bypass 로직 (loadPermissionConfig)
if (.gemini/policies/*.toml exists) {
  return { tools: {}, patterns: {}, policyEngineActive: true };
}

// Policy Engine Active 시 checkPermission 반환값
{ level: 'allow', reason: 'Deferred to Policy Engine', matchedPattern: null }
```

#### FR-05-E: GeminiAdapter (`lib/adapters/gemini/index.js`)

```javascript
// 검증 포인트
_version: '1.5.4'
getCliVersion():    calls detectVersion() from version-detector.js
getFeatureFlags():  calls getFeatureFlags() from version-detector.js
```

---

### 2.6 TC-06: MCP Server (P1) - 8 Cases

#### FR-06: MCP Server 도구 등록

**검증 대상 파일**: `mcp/spawn-agent-server.js`

**MCP Server 정확한 값**:
```javascript
// Server Info (handleInitialize)
{
  protocolVersion: '2024-11-05',
  capabilities: { tools: {} },
  serverInfo: {
    name: 'bkit-agents',
    version: '1.1.0'
  }
}

// 등록된 Agent 목록 (16개)
AGENTS = {
  'gap-detector':       { recommendedModel: 'pro' },
  'design-validator':   { recommendedModel: 'pro' },
  'pdca-iterator':      { recommendedModel: 'flash' },
  'code-analyzer':      { recommendedModel: 'pro' },
  'report-generator':   { recommendedModel: 'flash-lite' },
  'qa-monitor':         { recommendedModel: 'flash-lite' },
  'starter-guide':      { recommendedModel: 'flash' },
  'pipeline-guide':     { recommendedModel: 'flash' },
  'bkend-expert':       { recommendedModel: 'flash' },
  'enterprise-expert':  { recommendedModel: 'pro' },
  'infra-architect':    { recommendedModel: 'pro' },
  'cto-lead':           { recommendedModel: 'pro' },
  'frontend-architect': { recommendedModel: 'pro' },
  'security-architect': { recommendedModel: 'pro' },
  'product-manager':    { recommendedModel: 'flash' },
  'qa-strategist':      { recommendedModel: 'pro' }
};

// MCP 도구: spawn_agent
// Input: { agent_name: string, task: string, context?: string }
// Output: Agent의 .md 파일 내용 + 작업 지시
```

**Gemini CLI 검증 프롬프트**:
```
> mcp/spawn-agent-server.js 파일을 읽어서:
> 1. Server version이 '1.1.0'인지
> 2. 등록된 에이전트가 16개인지
> 3. 각 에이전트의 recommendedModel 값을 확인해줘
  → 검증: 모든 값 일치
```

---

### 2.7 TC-07: Configuration (P1) - 12 Cases

#### FR-07: Version 일관성 매트릭스

| File | Field/Location | Expected Value |
|------|---------------|----------------|
| bkit.config.json | `version` | `"1.5.4"` |
| gemini-extension.json | `version` | `"1.5.4"` |
| hooks/hooks.json | `description` | contains `"v1.5.4"` |
| GEMINI.md | Line 1 (header) | contains `"v1.5.4"` |
| lib/adapters/gemini/index.js | `_version` | `'1.5.4'` |
| hooks/scripts/session-start.js | Line 3 | contains `"v1.5.4"` |
| hooks/scripts/session-start.js | Line 49 | `version: '1.5.4'` |
| hooks/scripts/session-start.js | Line 67 | contains `"v1.5.4"` |
| hooks/scripts/session-start.js | Line 222 | contains `"v1.5.4"` |
| mcp/spawn-agent-server.js | `serverInfo.version` | `'1.1.0'` |
| lib/adapters/gemini/tool-registry.js | `@version` comment | `1.5.4` |
| lib/adapters/gemini/version-detector.js | `@version` comment | `1.5.4` |

#### FR-07-02: gemini-extension.json 정확한 구조

```json
{
  "name": "bkit",
  "version": "1.5.4",
  "description": "bkit Vibecoding Kit - PDCA methodology + Context Engineering...",
  "author": "POPUP STUDIO PTE. LTD.",
  "license": "Apache-2.0",
  "contextFileName": "GEMINI.md",
  "settings": [
    { "name": "Output Style", "envVar": "BKIT_OUTPUT_STYLE" },
    { "name": "Project Level", "envVar": "BKIT_PROJECT_LEVEL" }
  ]
}
// NOTE: "excludeTools" 필드 없음 (v1.5.4에서 제거됨)
```

#### FR-07-03: bkit.config.json 주요 섹션 검증값

```
version: "1.5.4"
platform: "gemini"
pdca.matchRateThreshold: 90
pdca.maxIterations: 5
pdca.autoIterate: true
permissions: 8개 키 (write_file, replace, read_file, run_shell_command, + 4 patterns)
compatibility.minGeminiCliVersion: "0.29.0"
compatibility.testedVersions: ["0.29.0", "0.29.5", "0.30.0-preview.3"]
compatibility.policyEngine.autoGenerate: true
compatibility.policyEngine.outputDir: ".gemini/policies/"
outputStyles.default: "bkit-pdca-guide"
outputStyles.available: 4개
agentMemory.enabled: true
agentMemory.maxSessionsPerAgent: 20
automation.supportedLanguages: 8개
```

---

### 2.8 TC-08: Context Engineering (P1) - 8 Cases

#### FR-08: 6개 Context 파일 정확한 내용 검증

| File | Key Content | Rows/Items |
|------|------------|:----------:|
| commands.md | 4개 테이블: PDCA(8), Level(3), bkend(8), Utility(5) | 24 rows |
| pdca-rules.md | Core Cycle(6), Guidelines(5), Recommendations(7), Automation(3) | 21 items |
| agent-triggers.md | 16 agents x (Keywords, Agent, Action) | 16 rows |
| skill-triggers.md | 28 skills x (Keywords, Skill, Description) | 28 rows |
| tool-reference.md | Tool Reference(17) + Forward Aliases(5) | 22 rows |
| feature-report.md | Report format + Features list (5 categories) | - |

**GEMINI.md @import 체인**:
```markdown
@.gemini/context/commands.md
@.gemini/context/pdca-rules.md
@.gemini/context/agent-triggers.md
@.gemini/context/skill-triggers.md
@.gemini/context/tool-reference.md
@.gemini/context/feature-report.md
```

---

### 2.9 TC-09: v1.5.4 New Features (P0) - 12 Cases

#### FR-09: 신규 기능 체크리스트

**Version Detection System**:
- [ ] `lib/adapters/gemini/version-detector.js` 존재 (154줄)
- [ ] 7개 함수 export: detectVersion, parseVersion, compareVersions, isVersionAtLeast, getFeatureFlags, getVersionSummary, resetCache
- [ ] 3-Strategy Fallback: ENV → npm → CLI → default(0.29.0)
- [ ] 7 Feature Flags 및 버전 임계값 정확

**Policy Engine Migration**:
- [ ] `lib/adapters/gemini/policy-migrator.js` 존재 (230줄)
- [ ] 6개 함수 export: parsePermissionKey, mapDecision, getPriority, convertToToml, hasPolicyFiles, generatePolicyFile
- [ ] mapDecision: ask→ask_user, allow→allow, deny→deny
- [ ] getPriority: deny=100, ask_user=50, allow=10

**Forward Alias Defense Layer**:
- [ ] FORWARD_ALIASES: 5개 매핑 (edit_file, find_files, find_in_file, web_search, read_files)
- [ ] REVERSE_FORWARD_ALIASES: 5개 역매핑
- [ ] resolveToolName()에서 Forward Alias 체크 동작

**Compatibility Configuration**:
- [ ] bkit.config.json에 `compatibility` 섹션 존재
- [ ] minGeminiCliVersion: "0.29.0"
- [ ] testedVersions: 3개 버전 배열
- [ ] policyEngine.autoGenerate: true

---

### 2.10 TC-10: PDCA End-to-End (P0) - 10 Cases

#### FR-10: 전체 PDCA 사이클 시나리오

**Test Scenario**: Feature name = `e2e-test-feature`

```
Step 1: /pdca plan e2e-test-feature
  → 생성: docs/01-plan/features/e2e-test-feature.plan.md
  → 상태: .pdca-status.json에 phase="plan" 등록
  → 검증: Plan 템플릿 구조 (Overview, Requirements, etc.)

Step 2: /pdca design e2e-test-feature
  → 선행: Plan 문서 존재
  → 생성: docs/02-design/features/e2e-test-feature.design.md
  → 상태: phase="design"
  → 검증: Plan 참조, Implementation Spec 포함

Step 3: /pdca do e2e-test-feature
  → 선행: Design 문서 존재
  → 출력: 구현 가이드 (체크리스트, 파일 목록, 의존성)
  → 상태: phase="do"

Step 4: /pdca analyze e2e-test-feature
  → 선행: 구현 코드 존재
  → 에이전트: gap-detector 호출
  → 생성: docs/03-analysis/e2e-test-feature.analysis.md
  → 상태: phase="check", matchRate 계산

Step 5: (matchRate < 90%) /pdca iterate e2e-test-feature
  → 에이전트: pdca-iterator 호출
  → 동작: 자동 코드 수정 + 재분석
  → 제한: 최대 5회 반복

Step 6: (matchRate >= 90%) /pdca report e2e-test-feature
  → 에이전트: report-generator 호출
  → 생성: docs/04-report/features/e2e-test-feature.report.md
  → 상태: phase="completed"

Step 7: /pdca archive e2e-test-feature
  → 선행: phase="completed"
  → 이동: docs/archive/2026-02/e2e-test-feature/
  → 상태: phase="archived"
  → 삭제: 원본 위치에서 4개 문서 삭제

Step 8: /pdca archive e2e-test-feature --summary
  → 동작: 아카이브 + 상태에 요약 보존
  → 검증: archivedAt, archivedTo, matchRate, iterationCount 필드

Step 9: /pdca cleanup
  → 출력: 아카이브된 feature 목록
  → 동작: 선택적 삭제

Step 10: /pdca status + /pdca next
  → status: feature, phase, matchRate, iteration 표시
  → next: 현재 phase 기반 다음 단계 + 추천 커맨드
```

---

### 2.11 TC-11 ~ TC-15: P1/P2 Categories

#### TC-11: Output Styles (4 Cases)

```
bkit-learning:        Starter 레벨, 친절한 톤, 학습 포맷
bkit-pdca-guide:      PDCA 배지, Gap analysis 제안, 체크리스트
bkit-enterprise:      기술적 톤, 아키텍처 관점
bkit-pdca-enterprise: PDCA + Enterprise 결합
```

#### TC-12: Agent Memory (4 Cases)

```
프로젝트 스코프: .gemini/agent-memory/bkit/{agent}/ (14 agents)
유저 스코프:     ~/.gemini/agent-memory/bkit/{agent}/ (starter-guide, pipeline-guide)
세션 제한:       maxSessionsPerAgent = 20
```

#### TC-13: Automation (16 Cases)

**8개 언어 Agent Trigger 매핑 (정확한 프롬프트)**:

| Lang | Prompt | Expected Agent |
|------|--------|---------------|
| EN | "help me build a website" | starter-guide |
| KO | "코드 품질 분석해줘" | code-analyzer |
| JA | "セキュリティの脆弱性をチェックして" | security-architect |
| ZH | "帮我设计微服务架构" | enterprise-expert |
| ES | "necesito ayuda para empezar" | starter-guide |
| FR | "aide-moi a concevoir l'architecture" | frontend-architect |
| DE | "Hilfe bei der Infrastruktur" | infra-architect |
| IT | "aiutami con il database" | bkend-expert |

**6개 언어 Skill Trigger 매핑**:

| Lang | Prompt | Expected Skill |
|------|--------|---------------|
| EN | "I need to deploy to production" | phase-9-deployment |
| KO | "목업 만들어줘" | phase-3-mockup |
| JA | "APIを設計して" | phase-4-api |
| ZH | "我需要一个静态网站" | starter |
| ES | "necesito un sistema de diseno" | phase-5-design-system |
| FR | "revue de code s'il vous plait" | code-review |

#### TC-14: bkend.ai Skills (8 Cases)

각 bkend 스킬의 핵심 검증 키워드:

| Skill | 핵심 키워드 |
|-------|-----------|
| bkend-quickstart | MCP, Resource hierarchy, Org→Project→Environment |
| bkend-auth | Email/Social login, JWT, Access 1h, Refresh 7d, RBAC |
| bkend-data | 7 column types, CRUD, filter, pagination, relations |
| bkend-storage | Presigned URL, 4 visibility levels, CDN |
| bkend-mcp | MCP tools, AI integration |
| bkend-security | API Key, encryption, Rate Limit, CORS, RLS |
| bkend-cookbook | 10 single projects, 4 full guides |
| bkend-guides | Migration, troubleshooting, operations |

#### TC-15: Feature Usage Report (3 Cases)

```
[필수 포맷]
─────────────────────────────────────────────────
📊 bkit Feature Usage
─────────────────────────────────────────────────
✅ Used: [실제 사용 기능]
⏭️ Not Used: [미사용 주요 기능] (사유)
💡 Recommended: [다음 추천 기능]
─────────────────────────────────────────────────

[검증]
- 모든 응답 끝에 포함
- Used에 실제 사용한 bkit 기능 반영
- Recommended에 현재 PDCA phase 기반 추천
```

---

## 3. Implementation Order

```
Phase 1 - Gemini Interactive Test Guide (신규)
  1. tests/gemini-interactive/test-prompts.md 작성
  2. 204개 테스트 프롬프트 + 검증 기준 문서화

Phase 2 - Automated Test 보강 (기존 확장)
  3. tc02-skills.js: 9 → 29 테스트 확장
  4. tc03-agents.js: 4 → 32 테스트 확장 (frontmatter 검증)
  5. tc05-mcp.js: 2 → 8 테스트 확장
  6. tc06-commands.js: 3 → 18 테스트 확장 (전체 TOML)
  7. tc07-config.js: 7 → 12 테스트 확장
  8. tc08-context.js: 3 → 8 테스트 확장

Phase 3 - 신규 Test Suites
  9. tc11-output-styles.js (4 tests) - 신규
  10. tc12-agent-memory.js (4 tests) - 신규
  11. tc13-automation.js (16 tests) - 신규
  12. tc14-bkend-skills.js (8 tests) - 신규
  13. tc15-feature-report.js (3 tests) - 신규

Phase 4 - v1.5.4 Feature Tests
  14. tc09 확장: v1.5.4 신규 기능 (12 tests)
  15. tc10 확장: PDCA E2E 전체 사이클 (10 tests)
```

---

## 4. Non-Functional Requirements

| Requirement | Criteria |
|-------------|---------|
| 테스트 실행 시간 | 자동화: < 30초, Interactive: < 60분/세션 |
| Pass Rate | P0: 100%, P1: >= 90%, P2: >= 80% |
| 호환성 | Gemini CLI v0.29.0, v0.29.5, v0.30.0-preview.3 |
| 재현성 | 동일 환경에서 동일 결과 보장 |
| 격리성 | 테스트 간 상태 간섭 없음 |

---

## 5. File Changes Summary

| Action | File | Lines (est.) |
|--------|------|:------------:|
| NEW | tests/gemini-interactive/test-prompts.md | 500+ |
| MODIFY | tests/suites/tc02-skills.js | +200 |
| MODIFY | tests/suites/tc03-agents.js | +300 |
| MODIFY | tests/suites/tc05-mcp.js | +80 |
| MODIFY | tests/suites/tc06-commands.js | +150 |
| MODIFY | tests/suites/tc07-config.js | +60 |
| MODIFY | tests/suites/tc08-context.js | +60 |
| NEW | tests/suites/tc11-output-styles.js | 60 |
| NEW | tests/suites/tc12-agent-memory.js | 60 |
| NEW | tests/suites/tc13-automation.js | 200 |
| NEW | tests/suites/tc14-bkend-skills.js | 100 |
| NEW | tests/suites/tc15-feature-report.js | 50 |
| MODIFY | tests/run-all.js | +20 |
| **Total** | **13 files** | **~1,840** |

---

*bkit Vibecoding Kit v1.5.4 - Comprehensive Extension Test Design*
*Generated: 2026-02-21*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
