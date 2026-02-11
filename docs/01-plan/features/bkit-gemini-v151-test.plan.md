# bkit-gemini v1.5.1 Comprehensive Test Plan

> **Summary**: bkit Gemini CLI Extension v1.5.1의 모든 기능이 Gemini CLI 환경에서 정상 동작하는지 검증하기 위한 체계적 테스트 계획서. bkit 철학(Automation First, No Guessing, Docs=Code)과 AI-Native 원칙에 기반한 사용자 경험 검증 포함.
>
> **Project**: bkit-gemini
> **Version**: v1.5.1
> **Author**: CTO Team (4-Agent Analysis: QA Strategist, Product Manager, Code Analyzer, Gap Detector)
> **Date**: 2026-02-11
> **Status**: Plan
> **Test Environment**: Gemini CLI v0.27.3+

---

## 1. Overview

### 1.1 Purpose

bkit-gemini v1.5.1로 추가된 20개 Functional Requirements와 기존 기능 전체가 Gemini CLI 환경에서 올바르게 동작하는지 검증한다. 단순 기능 테스트를 넘어, bkit의 핵심 철학(bkit-system/philosophy/)이 사용자 경험에 올바르게 반영되는지를 체계적으로 검증한다.

### 1.2 Test Scope

**In Scope:**
- 10 Hook Events (hooks/hooks.json)
- 21 Skills (skills/*/SKILL.md)
- 16 Agents (agents/*.md)
- 10 TOML Commands (commands/*.toml)
- 3 New Lib Modules (skill-orchestrator.js, agent-memory.js, context-hierarchy.js)
- 1 MCP Server (spawn-agent-server.js, 6 tools)
- 4 Output Styles (output-styles/*.md)
- bkit.config.json (186 lines, 5 new sections)
- GEMINI.md (@import 6 modules)
- PDCA Workflow E2E (Plan→Design→Do→Check→Act)
- bkit Philosophy Alignment (3 philosophies + 3 AI-Native competencies)
- Context Engineering (4-level hierarchy, @import, fork, permission)
- 8-Language Multi-Language Support

**Out of Scope:**
- Gemini CLI core code testing
- Google Cloud API testing
- bkend.ai BaaS platform testing
- Network/latency testing

### 1.3 Test Philosophy

bkit의 4가지 철학 문서(bkit-system/philosophy/)를 테스트 설계의 기반으로 활용:

| Philosophy Document | Test Perspective |
|---------------------|-----------------|
| **core-mission.md** | "개발자가 명령어나 PDCA를 모르더라도 자연스럽게 document-driven development 채택" → Automation First 테스트 |
| **ai-native-principles.md** | 3 Core Competencies (검증, 방향설정, 품질) → AI가 파트너로서 기능하는지 검증 |
| **context-engineering.md** | 최적 토큰 큐레이션 → Context 계층, @import, 동적 주입 검증 |
| **pdca-methodology.md** | PDCA 사이클 + 9단계 파이프라인 → 워크플로우 E2E 검증 |

---

## 2. Test Strategy

### 2.1 Test Categories (10 Categories)

| ID | Category | Test Count | Priority | Rationale |
|----|----------|:----------:|:--------:|-----------|
| TC-01 | Hook System Tests | 20+ | **P0** | 모든 세션/도구 호출에서 실행; 실패 시 전체 UX 손상 |
| TC-02 | Skill System Tests | 25+ | **P0** | 사용자 인터페이스의 핵심; 커스텀 YAML 파싱 취약 |
| TC-03 | Agent System Tests | 20+ | **P1** | 정적 마크다운 파일; 리스크는 MCP 스포닝에 집중 |
| TC-04 | Lib Module Tests | 30+ | **P0** | 모든 Hook/Skill의 기반; YAML 파서 정확성 필수 |
| TC-05 | MCP Server Tests | 18+ | **P1** | JSON-RPC 프로토콜 정확성; 서브프로세스 관리 복잡 |
| TC-06 | TOML Command Tests | 15+ | **P1** | Gemini CLI가 TOML 파싱; @import 해석 리스크 |
| TC-07 | Configuration Tests | 12+ | **P1** | JSON 안정적; 버전/필드 불일치 리스크 |
| TC-08 | Context Engineering Tests | 15+ | **P1** | 계층 병합, 캐싱 정확성 중요 |
| TC-09 | PDCA Workflow E2E Tests | 15+ | **P0** | 핵심 가치 제안; 파일 I/O 상태 전환 포함 |
| TC-10 | Philosophy Alignment Tests | 81+ | **P2** | 행동/UX 테스트; 품질 이슈, 브레이킹은 아님 |
| | **Total** | **250+** | | |

### 2.2 Risk-Based Priority Matrix

```
Impact
  High  │ TC-01(P0)  TC-04(P0)  TC-05(P1)
        │ TC-02(P0)  TC-09(P0)
  Med   │ TC-06(P1)  TC-08(P1)  TC-03(P1)
        │ TC-07(P1)
  Low   │                       TC-10(P2)
        └──────────────────────────────────
          Low       Medium      High
                  Likelihood
```

### 2.3 Critical Path

```
TC-04 (Lib Modules) ──→ TC-01 (Hooks) ──→ TC-02 (Skills) ──→ TC-09 (PDCA E2E)
                              │
                              └──→ TC-05 (MCP) ──→ TC-03 (Agents)
```

### 2.4 Test Execution Strategy

| Layer | Type | Method | Scope |
|-------|------|--------|-------|
| **Layer 1** | Unit Tests | `node tests/run-all.js` | Lib 모듈 순수 함수, YAML 파서 |
| **Layer 2** | Component Tests | `node tests/run-all.js` | Hook 스크립트 mock 실행, 파일 존재 확인 |
| **Layer 3** | Integration Tests | `node tests/run-all.js` | MCP 프로토콜, Permission 시스템, Context Hierarchy |
| **Layer 4** | E2E Tests | Gemini CLI Interactive | 전체 PDCA 사이클, 명령어 호출, 에이전트 스포닝 |
| **Layer 5** | Philosophy Tests | Gemini CLI Interactive | 철학 정합성, UX 시나리오, 다국어 트리거 |

---

## 3. Test Environment

### 3.1 Runtime Requirements

| Requirement | Version | Purpose |
|------------|---------|---------|
| **Gemini CLI** | >= 0.27.3 | Extension 호스트, Hook 실행, MCP 트랜스포트 |
| **Node.js** | >= 18.x | Hook 스크립트, lib 모듈, MCP 서버 |
| **OS** | macOS / Linux | 파일 시스템 연산 |
| **Git** | >= 2.x | 버전 관리 통합 |

### 3.2 Test Project Fixture

```bash
# 테스트 프로젝트 구조
/tmp/bkit-test-project/
├── docs/
│   ├── 01-plan/features/          # Plan 문서 생성 검증
│   ├── 02-design/features/        # Design 문서 생성 검증
│   ├── 03-analysis/               # Gap 분석 보고서 검증
│   ├── 04-report/                 # 완료 보고서 검증
│   ├── .pdca-status.json          # PDCA 상태 추적 검증
│   └── .bkit-memory.json          # 메모리 영속화 검증
├── src/features/                  # 구현 코드 위치
├── kubernetes/                    # Enterprise 레벨 감지용 (선택)
├── docker-compose.yml             # Dynamic 레벨 감지용 (선택)
└── bkit.config.json               # 프로젝트 설정 (선택)
```

### 3.3 Environment Variables

```bash
export BKIT_PLUGIN_ROOT=$(pwd)              # bkit-gemini 설치 경로
export BKIT_PROJECT_DIR=/tmp/bkit-test-project
export BKIT_DEBUG=1                         # 디버그 로깅 활성화
```

---

## 4. Detailed Test Cases

### TC-01: Hook System Tests (P0 - Critical)

> 10 Hook Events, 17 Hook Scripts, hooks/hooks.json

#### 4.1.1 SessionStart Hook (session-start.js)

| ID | Test Case | Input | Expected | Validates |
|----|-----------|-------|----------|-----------|
| HOOK-01 | 정상 실행 후 유효한 JSON 반환 | 빈 프로젝트 | `{"status":"allow","additionalContext":"..."}` | Hook 프로토콜 준수 |
| HOOK-02 | Enterprise 레벨 자동 감지 | `kubernetes/` 디렉토리 존재 | additionalContext에 "Enterprise" 포함 | levelDetection.enterprise.directories |
| HOOK-03 | Dynamic 레벨 감지 | `docker-compose.yml` 존재 | additionalContext에 "Dynamic" 포함 | levelDetection.dynamic.files |
| HOOK-04 | Starter 레벨 기본값 | 마커 없는 프로젝트 | additionalContext에 "Starter" 포함 | levelDetection.default |
| HOOK-05 | sessionCount 증가 | `.bkit-memory.json` 존재 | sessionCount++ 후 저장 | 메모리 영속화 |
| HOOK-06 | 올바른 Output Style 적용 | Starter 프로젝트 | "bkit-learning" 스타일 주입 | outputStyles.levelDefaults |
| HOOK-07 | 복귀 사용자 감지 | sessionCount > 1 | "Welcome back" 메시지 + 이전 PDCA 상태 | 온보딩 UX |
| HOOK-08 | 신규 사용자 감지 | `.bkit-memory.json` 없음 | 4가지 선택지 제시 (First Project, Learn, Setup, Status) | 신규 온보딩 |
| HOOK-09 | PDCA 상태 동적 주입 | 활성 피처 존재 | 현재 PDCA 단계, 매치율, 추천 표시 | 동적 컨텍스트 주입 |
| HOOK-10 | 5초 타임아웃 내 완료 | 정상 환경 | 실행 시간 < 3000ms (목표) | 성능 벤치마크 |

#### 4.1.2 BeforeAgent Hook (before-agent.js)

| ID | Test Case | Input | Expected | Validates |
|----|-----------|-------|----------|-----------|
| HOOK-11 | 한국어 트리거 감지 | "이 코드 검증해줘" | gap-detector 에이전트 트리거 | 8개 언어 지원 (KO) |
| HOOK-12 | 일본어 트리거 감지 | "改善して" | pdca-iterator 트리거 | 8개 언어 지원 (JA) |
| HOOK-13 | 영어 트리거 감지 | "analyze this code" | code-analyzer 트리거 | 8개 언어 지원 (EN) |
| HOOK-14 | 중국어 트리거 감지 | "帮我改进" | pdca-iterator 트리거 | 8개 언어 지원 (ZH) |
| HOOK-15 | 모호성 점수 50+ 시 질문 | "이거 좀 고쳐줘" (모호) | 명확화 질문 생성 | ambiguityThreshold: 50 |
| HOOK-16 | 3초 타임아웃 내 완료 | 정상 입력 | 실행 시간 < 2000ms (목표) | 성능 벤치마크 |

#### 4.1.3 BeforeModel Hook (before-model.js) - NEW in v1.5.1

| ID | Test Case | Input | Expected | Validates |
|----|-----------|-------|----------|-----------|
| HOOK-17 | PDCA 단계 컨텍스트 주입 | plan 단계의 피처 | 프롬프트에 PDCA 규칙 주입 | FR-04 |
| HOOK-18 | 모델 선택 로직 | 분석 요청 | 적절한 모델 제안 | 모델 최적화 |

#### 4.1.4 AfterModel Hook (after-model.js) - NEW in v1.5.1

| ID | Test Case | Input | Expected | Validates |
|----|-----------|-------|----------|-----------|
| HOOK-19 | 사용량 추적 | 모델 응답 후 | 사용량 로그 기록 | FR-04 |

#### 4.1.5 BeforeToolSelection Hook (before-tool-selection.js) - NEW in v1.5.1

| ID | Test Case | Input | Expected | Validates |
|----|-----------|-------|----------|-----------|
| HOOK-20 | PDCA 단계별 도구 필터링 | plan 단계 | 쓰기 도구 제한/경고 | FR-04 |
| HOOK-21 | 스킬별 도구 제한 | code-review 스킬 활성 | 읽기 전용 도구만 허용 | allowed-tools 연동 |

#### 4.1.6 BeforeTool Hook (before-tool.js)

| ID | Test Case | Input | Expected | Validates |
|----|-----------|-------|----------|-----------|
| HOOK-22 | `rm -rf *` 차단 | run_shell_command("rm -rf /") | status: "deny" | permissions deny |
| HOOK-23 | `git push --force` 차단 | run_shell_command("git push --force") | status: "deny" | permissions deny |
| HOOK-24 | `git reset --hard` 경고 | run_shell_command("git reset --hard") | status: "allow" + 경고 컨텍스트 | permissions ask |
| HOOK-25 | Plan 단계 쓰기 경고 | write_file (plan 단계) | 경고: "계획 단계에서 코드 작성" | PDCA 단계 제한 |
| HOOK-26 | .env 파일 쓰기 감지 | write_file(".env") | 보안 경고 컨텍스트 추가 | 보안 검증 |
| HOOK-27 | PermissionManager 통합 | 다양한 도구+입력 | lib/core/permission.js와 연동 | FR-17 |

#### 4.1.7 AfterTool Hook (after-tool.js)

| ID | Test Case | Input | Expected | Validates |
|----|-----------|-------|----------|-----------|
| HOOK-28 | design→do 자동 전환 | 소스 파일 write 후 | PDCA 상태 do로 전환 | 자동 단계 전환 |
| HOOK-29 | Gap 분석 제안 | do 단계 다수 파일 변경 | "Gap 분석을 실행하시겠습니까?" 제안 | PDCA 자동 안내 |
| HOOK-30 | 스킬 완료 추적 | skill 실행 후 | 스킬별 post-hook 실행 | Per-skill hooks |

#### 4.1.8 Per-Skill Hooks (hooks/scripts/skills/)

| ID | Test Case | Input | Expected | Validates |
|----|-----------|-------|----------|-----------|
| HOOK-31 | pdca-plan-post | plan 스킬 완료 | 상태 업데이트 + "/pdca design 추천" | FR-16 |
| HOOK-32 | pdca-design-post | design 스킬 완료 | 상태 업데이트 + "/pdca do 추천" | FR-16 |
| HOOK-33 | pdca-analyze-post | analyze 완료 (매치율 85%) | 매치율 저장 + "/pdca iterate 추천" | FR-16 |
| HOOK-34 | pdca-analyze-post | analyze 완료 (매치율 95%) | 매치율 저장 + "/pdca report 추천" | FR-16 |
| HOOK-35 | pdca-iterate-post | iterate 완료 (3회차) | 반복 카운트 증가 + "재분석 추천" | 최대 5회 제한 |
| HOOK-36 | pdca-report-post | report 완료 | 피처 completed 마킹, activeFeatures에서 제거 | 라이프사이클 완료 |

#### 4.1.9 Graceful Degradation

| ID | Test Case | Input | Expected | Validates |
|----|-----------|-------|----------|-----------|
| HOOK-37 | .pdca-status.json 없을 때 | 파일 부재 | 에러 없이 기본값 사용, exit 0 | Fail-Safe |
| HOOK-38 | bkit.config.json 없을 때 | 파일 부재 | 에러 없이 기본값 사용, exit 0 | Fail-Safe |
| HOOK-39 | 잘못된 JSON 입력 | 파싱 불가 JSON | 에러 없이 기본 응답, exit 0 | Fail-Safe |
| HOOK-40 | 스크립트 내부 예외 | require 실패 등 | try-catch로 잡혀서 exit 0 | Graceful Degradation |

---

### TC-02: Skill System Tests (P0 - Critical)

> 21 Skills, YAML Frontmatter 10+ fields, Skill Orchestrator 708 lines

#### 4.2.1 SKILL.md Frontmatter Parsing

| ID | Test Case | Input | Expected | Validates |
|----|-----------|-------|----------|-----------|
| SKILL-01 | 21개 SKILL.md 모두 유효한 YAML | 모든 skills/*/SKILL.md | 파싱 에러 없음 | 기본 무결성 |
| SKILL-02 | pdca 스킬 메타데이터 추출 | skills/pdca/SKILL.md | name, description, user-invocable:true, agents:{analyze:gap-detector,...} | FR-02 |
| SKILL-03 | 필수 필드 존재 확인 | 모든 SKILL.md | name, description 존재 | 스키마 검증 |
| SKILL-04 | user-invocable 필드 | bkit-rules | user-invocable: false | 호출 제어 |
| SKILL-05 | allowed-tools 필드 | pdca | 7개 도구 리스트 | 도구 제한 |
| SKILL-06 | imports 필드 | pdca | 4개 템플릿 경로 | 템플릿 자동 임포트 |
| SKILL-07 | agents 멀티바인딩 | pdca | analyze→gap-detector, iterate→pdca-iterator, report→report-generator | FR-13 |
| SKILL-08 | pdca-phase 필드 | phase-8-review | check | 단계 매핑 |
| SKILL-09 | memory 스코프 | pipeline-guide | memory: user | 메모리 스코핑 |
| SKILL-10 | task-template 필드 | pdca | subject/description/activeForm | 태스크 자동 생성 |

#### 4.2.2 Skill Orchestrator (lib/skill-orchestrator.js)

| ID | Test Case | Input | Expected | Validates |
|----|-----------|-------|----------|-----------|
| SKILL-11 | `parseSimpleYaml()` 스칼라 | `key: value` | `{key: "value"}` | YAML 파서 기본 |
| SKILL-12 | `parseSimpleYaml()` 리스트 | `- item1\n- item2` | `["item1","item2"]` | 리스트 파싱 |
| SKILL-13 | `parseSimpleYaml()` 블록 스칼라 | `key: |\n  line1\n  line2` | `{key: "line1\nline2"}` | 블록 파싱 |
| SKILL-14 | `parseSimpleYaml()` 중첩 맵 | `agents:\n  analyze: gap-detector` | `{agents:{analyze:"gap-detector"}}` | 중첩 파싱 |
| SKILL-15 | `loadSkill("pdca")` | 유효한 스킬명 | `{metadata, body, templates}` | 스킬 로딩 |
| SKILL-16 | `loadSkill("nonexistent")` | 없는 스킬명 | `null` | 에러 처리 |
| SKILL-17 | `activateSkill("pdca","analyze","login")` | 멀티바인딩 스킬 | gap-detector 에이전트 위임 | FR-12, FR-13 |
| SKILL-18 | `activateSkill("pdca","iterate","login")` | 반복 개선 | pdca-iterator 에이전트 위임 | 에이전트 라우팅 |
| SKILL-19 | `deactivateSkill("pdca")` | 활성 스킬 해제 | 스킬 상태 초기화 | 라이프사이클 |
| SKILL-20 | `listSkills()` | - | 21개 스킬 목록 | 스킬 열거 |
| SKILL-21 | `getUserInvocableSkills()` | - | user-invocable:true인 스킬만 | 필터링 |
| SKILL-22 | `getSkillsByPhase("check")` | 체크 단계 | phase-8-review, code-review 등 | 단계별 필터링 |
| SKILL-23 | `createTaskFromTemplate()` | task-template + params | {action}, {feature} 치환된 태스크 | FR-12 |
| SKILL-24 | `loadTemplates()` | imports 경로 배열 | 파일 내용 배열 반환 | 템플릿 로딩 |
| SKILL-25 | 캐시 무효화 | `clearCache()` 후 재로딩 | 새로운 데이터 반환 | 캐시 관리 |

---

### TC-03: Agent System Tests (P1 - High)

> 16 Agents, Gemini Native Frontmatter, MCP AGENTS Registry

#### 4.3.1 Agent File Validation

| ID | Test Case | Input | Expected | Validates |
|----|-----------|-------|----------|-----------|
| AGENT-01 | 16개 .md 파일 존재 | agents/*.md | 16개 파일 모두 존재 | 기본 무결성 |
| AGENT-02 | cto-lead frontmatter | agents/cto-lead.md | model: gemini-2.5-pro, temp: 0.3, max_turns: 30, timeout_mins: 15 | FR-03 |
| AGENT-03 | gap-detector frontmatter | agents/gap-detector.md | model: gemini-2.5-pro, temp: 0.1, tools: [read-only] | FR-03 |
| AGENT-04 | starter-guide frontmatter | agents/starter-guide.md | model: gemini-2.5-flash, temp: 0.7 | 모델 선택 전략 |
| AGENT-05 | security-architect frontmatter | agents/security-architect.md | model: gemini-2.5-pro, tools: read-only + web_search | FR-11 |
| AGENT-06 | 모든 에이전트 필수 필드 | 16개 .md 파일 | name, description, model, tools, temperature 존재 | 스키마 검증 |

#### 4.3.2 Agent-Skill Binding

| ID | Test Case | Input | Expected | Validates |
|----|-----------|-------|----------|-----------|
| AGENT-07 | 레벨 기반 라우팅 Starter | Starter 프로젝트 | starter-guide 에이전트 | agents.levelBased |
| AGENT-08 | 레벨 기반 라우팅 Dynamic | Dynamic 프로젝트 | bkend-expert 에이전트 | agents.levelBased |
| AGENT-09 | 레벨 기반 라우팅 Enterprise | Enterprise 프로젝트 | enterprise-expert 에이전트 | agents.levelBased |
| AGENT-10 | 태스크 기반 라우팅 "gap analysis" | - | gap-detector | agents.taskBased |
| AGENT-11 | 태스크 기반 라우팅 "code review" | - | code-analyzer | agents.taskBased |
| AGENT-12 | 태스크 기반 라우팅 "QA" | - | qa-monitor | agents.taskBased |

#### 4.3.3 MCP AGENTS Registry

| ID | Test Case | Input | Expected | Validates |
|----|-----------|-------|----------|-----------|
| AGENT-13 | 16개 에이전트 등록 확인 | list_agents MCP 호출 | 16개 엔트리 반환 | MCP 레지스트리 |
| AGENT-14 | 에이전트 파일 경로 일치 | get_agent_info 호출 | 각 에이전트의 filePath가 실제 파일과 일치 | 파일 정합성 |
| AGENT-15 | 신규 5개 에이전트 등록 | cto-lead 조회 | description, filePath 반환 | FR-11 |

#### 4.3.4 Agent Description 8-Language Triggers

| ID | Test Case | Input | Expected | Validates |
|----|-----------|-------|----------|-----------|
| AGENT-16 | EN 트리거 | "security review" | security-architect | 영어 |
| AGENT-17 | KO 트리거 | "보안 검토" | security-architect | 한국어 |
| AGENT-18 | JA 트리거 | "セキュリティレビュー" | security-architect | 일본어 |
| AGENT-19 | ZH 트리거 | "安全审查" | security-architect | 중국어 |
| AGENT-20 | ES/FR/DE/IT 트리거 | "revisión de seguridad" 등 | security-architect | 4개 유럽어 |

---

### TC-04: Lib Module Tests (P0 - Critical)

> skill-orchestrator.js (708L), agent-memory.js (214L), context-hierarchy.js (209L), permission.js, etc.

#### 4.4.1 Context Hierarchy (lib/context-hierarchy.js)

| ID | Test Case | Input | Expected | Validates |
|----|-----------|-------|----------|-----------|
| LIB-01 | Plugin 설정 로딩 | extensionPath/bkit.config.json | 기본 설정 값 반환 | L1 Plugin |
| LIB-02 | User 설정 오버라이드 | ~/.gemini/bkit/user-config.json | Plugin 값 덮어쓰기 | L2 User |
| LIB-03 | Project 설정 오버라이드 | projectDir/bkit.config.json | User 값 덮어쓰기 | L3 Project |
| LIB-04 | Session 오버라이드 최우선 | setSession("key","value") | 모든 레벨 덮어쓰기 | L4 Session |
| LIB-05 | dot-notation 접근 | get("pdca.matchRateThreshold") | 90 | 경로 접근 |
| LIB-06 | 5초 TTL 캐시 만료 | get() 후 5초 대기 후 get() | 디스크에서 재로딩 | 캐시 TTL |
| LIB-07 | clearSession() | 세션 값 설정 후 클리어 | 세션 오버라이드 제거 | 세션 관리 |
| LIB-08 | invalidate() 강제 무효화 | 캐시 활성 상태에서 호출 | 다음 get()에서 재로딩 | 캐시 무효화 |
| LIB-09 | _deepMerge 객체 | {a:{b:1}} + {a:{c:2}} | {a:{b:1,c:2}} | 깊은 병합 |
| LIB-10 | _deepMerge 배열 대체 | {arr:[1]} + {arr:[2]} | {arr:[2]} | 배열은 교체 |
| LIB-11 | 싱글톤 패턴 | 동일 pluginRoot+projectDir | 같은 인스턴스 | getHierarchy() |
| LIB-12 | 다른 프로젝트 별도 인스턴스 | 다른 projectDir | 새 인스턴스 | 격리 |
| LIB-13 | user-config.json 없을 때 | 파일 부재 | 빈 객체로 대체 | Graceful fallback |

#### 4.4.2 Agent Memory (lib/core/agent-memory.js)

| ID | Test Case | Input | Expected | Validates |
|----|-----------|-------|----------|-----------|
| LIB-14 | Project 스코프 경로 | agentName="gap-detector" | .gemini/agent-memory/bkit/gap-detector.json | FR-10 |
| LIB-15 | User 스코프 경로 | agentName="starter-guide" | ~/.gemini/agent-memory/bkit/starter-guide.json | FR-10 |
| LIB-16 | addSession() 추가 | 세션 데이터 | sessions 배열 앞에 추가, totalSessions++ | 세션 기록 |
| LIB-17 | addSession() 20개 제한 | 21번째 세션 추가 | 가장 오래된 세션 제거, 20개 유지 | maxSessionsPerAgent |
| LIB-18 | getRecentSessions(5) | 10개 세션 존재 | 최근 5개만 반환 | 최근 세션 조회 |
| LIB-19 | updatePatterns() | 패턴 객체 | Object.assign으로 병합 | 학습 패턴 |
| LIB-20 | getSummary() | 다수 세션 존재 | 사람 읽기 가능한 요약 문자열 | 컨텍스트 주입용 |
| LIB-21 | clear() | 데이터 존재 | 기본 스키마로 리셋 | 초기화 |
| LIB-22 | load() 파일 없을 때 | 파일 부재 | 기본 스키마 생성 | Graceful creation |
| LIB-23 | save() 디렉토리 자동 생성 | 디렉토리 부재 | mkdir -p 후 저장 | 자동 디렉토리 |
| LIB-24 | getAgentMemory() 팩토리 | "starter-guide" | scope: "user" | 스코프 자동 선택 |
| LIB-25 | getAgentMemory() 팩토리 | "gap-detector" | scope: "project" | 기본 스코프 |

#### 4.4.3 Permission Manager (lib/core/permission.js)

| ID | Test Case | Input | Expected | Validates |
|----|-----------|-------|----------|-----------|
| LIB-26 | deny 패턴 매칭 | run_shell_command + "rm -rf /" | "deny" | FR-17 |
| LIB-27 | deny 패턴 매칭 | run_shell_command + "git push --force main" | "deny" | FR-17 |
| LIB-28 | ask 패턴 매칭 | run_shell_command + "rm -r folder/" | "ask" | FR-17 |
| LIB-29 | ask 패턴 매칭 | run_shell_command + "git reset --hard" | "ask" | FR-17 |
| LIB-30 | allow 기본값 | write_file + 일반 경로 | "allow" | 기본 허용 |
| LIB-31 | glob 패턴 와일드카드 | "rm -rf*" vs "rm -rf /" | 매칭 성공 | 패턴 매칭 |

#### 4.4.4 Import Resolver (lib/adapters/gemini/import-resolver.js)

| ID | Test Case | Input | Expected | Validates |
|----|-----------|-------|----------|-----------|
| LIB-32 | 변수 치환 ${extensionPath} | "@.gemini/context/pdca-rules.md" | 정확한 파일 경로 반환 | FR-05 |
| LIB-33 | 순환 참조 감지 | A imports B, B imports A | 에러 또는 중단 | 순환 방지 |
| LIB-34 | 없는 파일 임포트 | "@nonexistent.md" | 빈 문자열 또는 에러 메시지 | Graceful handling |
| LIB-35 | TTL 캐시 (30초) | 동일 파일 2회 로딩 | 두 번째는 캐시에서 | importCacheTTL |

#### 4.4.5 Context Fork (lib/adapters/gemini/context-fork.js)

| ID | Test Case | Input | Expected | Validates |
|----|-----------|-------|----------|-----------|
| LIB-36 | Named 스냅샷 생성 | options.name = "analysis-v1" | 이름으로 스냅샷 생성 | FR-15 |
| LIB-37 | LRU 스냅샷 제한 (10개) | 11번째 스냅샷 생성 | 가장 오래된 것 제거 | enforceSnapshotLimit |
| LIB-38 | diffSnapshots() | 두 스냅샷 비교 | {added, removed, modified} 반환 | FR-15 |
| LIB-39 | Fork 격리 | fork 내 수정 | 원본 영향 없음 | 컨텍스트 격리 |

---

### TC-05: MCP Server Tests (P1 - High)

> mcp/spawn-agent-server.js, 6 Tools, JSON-RPC stdio

| ID | Test Case | Input | Expected | Validates |
|----|-----------|-------|----------|-----------|
| MCP-01 | initialize 핸드셰이크 | `{"method":"initialize"}` | protocolVersion: "2024-11-05", 6 tools | MCP 프로토콜 |
| MCP-02 | tools/list | `{"method":"tools/list"}` | 6개 도구 스키마 반환 | 도구 목록 |
| MCP-03 | spawn_agent 유효 에이전트 | agent_name: "gap-detector" | 에이전트 프로세스 시작 | 에이전트 스포닝 |
| MCP-04 | spawn_agent 무효 에이전트 | agent_name: "nonexistent" | 에러 응답 | 입력 검증 |
| MCP-05 | list_agents | - | 16개 에이전트 목록 | 레지스트리 조회 |
| MCP-06 | get_agent_info "cto-lead" | agent_name: "cto-lead" | description + filePath | 상세 정보 |
| MCP-07 | team_create "dynamic" | team_name + strategy: "dynamic" | cto-lead + 2 agents, maxAgents: 3 | FR-18 |
| MCP-08 | team_create "enterprise" | team_name + strategy: "enterprise" | cto-lead + 4 agents, maxAgents: 5 | FR-18 |
| MCP-09 | team_create "custom" | team_name + agents 배열 | 지정된 에이전트들로 팀 구성 | FR-18 |
| MCP-10 | team_create 상태 영속화 | 팀 생성 후 | .gemini/teams/{name}.json 파일 생성 | 상태 저장 |
| MCP-11 | team_assign | team + agent + task | 에이전트에 태스크 배정 | FR-18 |
| MCP-12 | team_assign 팀 외 에이전트 | 팀에 없는 에이전트 | 에러 응답 | 검증 |
| MCP-13 | team_status | team_name | 팀 구성 및 상태 반환 | 팀 상태 조회 |
| MCP-14 | 잘못된 JSON 입력 | 파싱 불가 | 에러 응답 (크래시 없음) | 에러 핸들링 |
| MCP-15 | 알 수 없는 메서드 | {"method":"unknown"} | 에러 응답 | 프로토콜 준수 |
| MCP-16 | shutdown | {"method":"shutdown"} | 빈 결과 반환 | 정상 종료 |
| MCP-17 | BKIT_AGENT_CONTEXT 환경변수 | spawn_agent 실행 | 환경변수 전달 확인 | 컨텍스트 전달 |
| MCP-18 | 타임아웃 처리 | 느린 에이전트 | 기본 300초 후 종료 | 타임아웃 관리 |

---

### TC-06: TOML Command Tests (P1 - High)

> 10 commands in commands/*.toml

| ID | Test Case | Input | Expected | Validates |
|----|-----------|-------|----------|-----------|
| CMD-01 | 10개 TOML 파일 파싱 | 모든 commands/*.toml | 파싱 에러 없음 | 기본 무결성 |
| CMD-02 | 필수 필드 존재 | 모든 TOML | description + prompt 존재 | 스키마 |
| CMD-03 | /pdca @import 해석 | pdca.toml | @skills/pdca/SKILL.md 참조 | @{path} 구문 |
| CMD-04 | /pdca {{args}} 치환 | pdca.toml + "plan login" | {{args}} → "plan login" | 템플릿 변수 |
| CMD-05 | /pdca !cat 실행 | pdca.toml | !cat docs/.pdca-status.json 실행 | !{command} 구문 |
| CMD-06 | /bkit 도움말 | bkit.toml | 전체 명령어 목록 표시 | 도움말 |
| CMD-07 | /starter 레벨 스킬 | starter.toml | @skills/starter/SKILL.md 참조 | 레벨 명령어 |
| CMD-08 | /dynamic 레벨 스킬 | dynamic.toml | @skills/dynamic/SKILL.md 참조 | 레벨 명령어 |
| CMD-09 | /enterprise 레벨 스킬 | enterprise.toml | @skills/enterprise/SKILL.md 참조 | 레벨 명령어 |
| CMD-10 | /review 코드 리뷰 | review.toml | @skills/code-review/SKILL.md 참조 | 특화 명령어 |
| CMD-11 | /qa Zero Script QA | qa.toml | @skills/zero-script-qa/SKILL.md + !docker ps | 특화 명령어 |
| CMD-12 | /pipeline 파이프라인 | pipeline.toml | @skills/development-pipeline/SKILL.md + !cat status | 파이프라인 |
| CMD-13 | /learn 학습 | learn.toml | @skills/gemini-cli-learning/SKILL.md + !ls | 학습 명령어 |
| CMD-14 | Gemini CLI에서 명령어 인식 | /pdca 입력 | Gemini CLI가 TOML 명령어 실행 | CLI 통합 |
| CMD-15 | 없는 명령어 입력 | /nonexistent | Gemini CLI 기본 에러 처리 | 에러 핸들링 |

---

### TC-07: Configuration Tests (P1 - High)

| ID | Test Case | Input | Expected | Validates |
|----|-----------|-------|----------|-----------|
| CFG-01 | bkit.config.json 유효 JSON | 파일 로드 | JSON.parse 성공 | 기본 무결성 |
| CFG-02 | version "1.5.1" | - | version === "1.5.1" | 버전 확인 |
| CFG-03 | platform "gemini" | - | platform === "gemini" | 플랫폼 확인 |
| CFG-04 | pdca.matchRateThreshold | - | 90 | PDCA 임계값 |
| CFG-05 | pdca.maxIterations | - | 5 | 반복 제한 |
| CFG-06 | outputStyles 4개 | available 배열 | ["bkit-learning","bkit-pdca-guide","bkit-enterprise","bkit-pdca-enterprise"] | FR-06 |
| CFG-07 | agentMemory 설정 | - | enabled:true, maxSessions:20, 2 user-scope agents | FR-10 |
| CFG-08 | team 설정 | - | enabled:false, 3 strategies | FR-18 |
| CFG-09 | contextHierarchy 설정 | - | enabled:true, cacheTTL:5000, 4 levels | FR-14 |
| CFG-10 | skillOrchestrator 설정 | - | enabled:true, autoImport:true, agentDelegation:true | FR-12 |
| CFG-11 | gemini-extension.json | - | name:"bkit", version:"1.5.1", contextFileName:"GEMINI.md" | 매니페스트 |
| CFG-12 | permissions 설정 | - | rm -rf:deny, git push --force:deny, git reset --hard:ask | FR-17 |

---

### TC-08: Context Engineering Tests (P1 - High)

| ID | Test Case | Input | Expected | Validates |
|----|-----------|-------|----------|-----------|
| CTX-01 | GEMINI.md @import 6개 | GEMINI.md 로딩 | 6개 모듈 모두 해석 | FR-05 |
| CTX-02 | pdca-rules.md 내용 | @.gemini/context/pdca-rules.md | Core Rules 포함 | 모듈 내용 |
| CTX-03 | agent-triggers.md 내용 | @.gemini/context/agent-triggers.md | 8개 언어 트리거 테이블 | 다국어 트리거 |
| CTX-04 | skill-triggers.md 내용 | @.gemini/context/skill-triggers.md | 레벨별 스킬 트리거 | 스킬 매칭 |
| CTX-05 | commands.md 내용 | @.gemini/context/commands.md | TOML 명령어 레퍼런스 | 명령어 가이드 |
| CTX-06 | tool-reference.md 내용 | @.gemini/context/tool-reference.md | Gemini CLI 네이티브 도구명 | 도구 참조 |
| CTX-07 | feature-report.md 내용 | @.gemini/context/feature-report.md | Feature Usage Report 템플릿 | 보고서 템플릿 |
| CTX-08 | 4-level 계층 병합 | Plugin + User + Project + Session | Session이 최우선 | FR-14 |
| CTX-09 | 동적 컨텍스트 주입 | SessionStart hook | additionalContext에 PDCA 상태, 레벨, 트리거 포함 | FR-01 |
| CTX-10 | Output Style 컨텍스트 | Starter 프로젝트 | "bkit-learning" 스타일 규칙 주입 | FR-06 |
| CTX-11 | Permission 컨텍스트 | before-tool hook | PermissionManager 결과 반영 | FR-17 |
| CTX-12 | Agent Memory 컨텍스트 | before-agent hook | 에이전트 이전 세션 요약 주입 | FR-10 |
| CTX-13 | Fork 격리 컨텍스트 | gap-detector 실행 | 격리된 컨텍스트에서 분석 | FR-15 |
| CTX-14 | PreCompress 상태 보존 | 컨텍스트 압축 이벤트 | PDCA 상태 스냅샷 저장 | 상태 보존 |
| CTX-15 | 토큰 효율성 | @import 모듈화 | 정적 GEMINI.md 대비 토큰 절약 | 토큰 최적화 |

---

### TC-09: PDCA Workflow E2E Tests (P0 - Critical)

> Plan → Design → Do → Check → Act → Report 전체 사이클

| ID | Test Case | Steps | Expected | Validates |
|----|-----------|-------|----------|-----------|
| E2E-01 | Plan 문서 생성 | `/pdca plan login-form` | docs/01-plan/features/login-form.plan.md 생성, 템플릿 구조 사용 | Plan 단계 |
| E2E-02 | Plan 후 상태 업데이트 | E2E-01 완료 후 | .pdca-status.json: phase="plan", activeFeatures에 추가 | 상태 추적 |
| E2E-03 | Design 문서 생성 | `/pdca design login-form` | docs/02-design/features/login-form.design.md 생성 | Design 단계 |
| E2E-04 | Design 후 상태 업데이트 | E2E-03 완료 후 | phase="design" | 상태 추적 |
| E2E-05 | Do 단계 자동 전환 | 소스 코드 write_file | phase="do"로 자동 전환 | AfterTool hook |
| E2E-06 | Gap 분석 위임 | `/pdca analyze login-form` | gap-detector 에이전트에 위임 | 에이전트 위임 |
| E2E-07 | 매치율 90% 미만 시 | 분석 결과 75% | "iterate 추천" + phase="check" | 자동 반복 결정 |
| E2E-08 | 매치율 90% 이상 시 | 분석 결과 95% | "report 추천" + phase="check" | 완료 결정 |
| E2E-09 | 자동 반복 개선 | `/pdca iterate login-form` | pdca-iterator 실행, 갭 자동 수정 | 반복 개선 |
| E2E-10 | 최대 5회 반복 제한 | 5회 iterate 후 | 더 이상 iterate 않고 report 추천 | maxIterations |
| E2E-11 | 완료 보고서 생성 | `/pdca report login-form` | docs/04-report/ 에 보고서 생성 | Report 단계 |
| E2E-12 | 피처 완료 마킹 | report 후 | phase="completed", activeFeatures에서 제거 | 라이프사이클 |
| E2E-13 | `/pdca status` 대시보드 | 다수 피처 활성 | 전체 피처 상태, 단계, 매치율 표시 | 상태 대시보드 |
| E2E-14 | `/pdca next` 안내 | design 완료 상태 | "Start implementation or /pdca do" 추천 | 다음 단계 안내 |
| E2E-15 | 복수 피처 동시 추적 | 2개 피처 활성 | 각각 독립적 phase/matchRate | 다중 피처 |

---

### TC-10: Philosophy Alignment Tests (P2 - Medium)

> bkit-system/philosophy/ 4개 문서 기반

#### 4.10.1 Automation First (AF) - 14 Tests

| ID | Test | Expected | Philosophy Ref |
|----|------|----------|---------------|
| AF-01 | SessionStart 복귀 사용자 감지 | Welcome back + 이전 PDCA 상태 | core-mission: User Journey Stage 1 |
| AF-02 | SessionStart 신규 사용자 4옵션 | 4가지 선택지 제시 | core-mission: User Journey Stage 1 |
| AF-03 | PDCA 규칙 자동 적용 | "로그인 만들어줘" → plan 문서 확인 | core-mission: "commands 모르더라도" |
| AF-04 | 레벨 자동 감지 Enterprise | kubernetes/ → Enterprise | core-mission: User Journey Stage 2 |
| AF-05 | 레벨 자동 감지 Dynamic | docker-compose.yml → Dynamic | core-mission: User Journey Stage 2 |
| AF-06 | 레벨 자동 감지 Starter 기본값 | 마커 없음 → Starter | core-mission: User Journey Stage 2 |
| AF-07 | 8개 언어 에이전트 트리거 (KO) | "검증해줘" → gap-detector | ai-native: Agent trigger |
| AF-08 | 8개 언어 에이전트 트리거 (JA) | "改善して" → pdca-iterator | ai-native: Agent trigger |
| AF-09 | 8개 언어 에이전트 트리거 (ZH) | "帮我改进" → pdca-iterator | ai-native: Agent trigger |
| AF-10 | 8개 언어 모든 언어 (EN/ES/FR/DE/IT) | 각 언어 "help" → starter-guide | ai-native: 8-language coverage |
| AF-11 | Output Style 레벨 자동 설정 | Starter → bkit-learning | core-mission: v1.5.3 Features |
| AF-12 | 매치율 >=90% 자동 report 추천 | 92% → "/pdca report" | pdca: Check-Act Iteration |
| AF-13 | 매치율 <90% 자동 iterate 추천 | 75% → "/pdca iterate" | pdca: Check-Act Iteration |
| AF-14 | Feature Usage Report 자동 첨부 | 모든 응답 | 보고서 블록 포함 | context-engineering: Response Report |

#### 4.10.2 No Guessing (NG) - 12 Tests

| ID | Test | Expected | Philosophy Ref |
|----|------|----------|---------------|
| NG-01 | 설계서 없이 구현 시도 | 설계서 확인 → 없으면 작성 제안 | core-mission: "No Guessing" |
| NG-02 | 모호성 50+ 시 질문 | "이거 좀 고쳐" → 명확화 질문 | context-engineering: Ambiguity Score |
| NG-03 | gap-detector 설계서 참조 | 설계서 대비 코드 비교 | core-mission: "check docs first" |
| NG-04 | 계획서 없이 기능 시작 | plan 없음 → plan 작성 제안 | pdca: Design Document Check |
| NG-05 | 중요 결정 사용자 확인 | 파일 삭제 전 → "진행하시겠습니까?" | core-mission: "AI is not perfect" |
| NG-06 | deny 권한 차단 | rm -rf → 완전 차단 | context-engineering: Permission Hierarchy |
| NG-07 | ask 권한 확인 | git reset --hard → 확인 요청 | context-engineering: Permission Hierarchy |
| NG-08 | 다중 매칭 시 사용자 선택 | 여러 스킬/에이전트 매칭 → 선택지 제시 | core-mission: "never guess" |
| NG-09 | PDCA 단계 건너뛰기 방지 | plan 없이 analyze → 거부 | pdca: Phase enforcement |
| NG-10 | 템플릿 기반 문서 생성 | /pdca plan → 템플릿 구조 | pdca: Document Templates |
| NG-11 | 레벨별 템플릿 선택 | Enterprise → enterprise 템플릿 | pdca: Level-specific templates |
| NG-12 | 피처명 누락 시 요청 | /pdca plan (이름 없이) → 이름 요청 | core-mission: "ask user" |

#### 4.10.3 Docs = Code (DC) - 12 Tests

| ID | Test | Expected | Philosophy Ref |
|----|------|----------|---------------|
| DC-01 | /pdca plan 문서 생성 | docs/01-plan/features/ | pdca: Plan phase |
| DC-02 | /pdca design 문서 생성 | docs/02-design/features/ | pdca: Design phase |
| DC-03 | /pdca analyze 보고서 | docs/03-analysis/ | pdca: Check phase |
| DC-04 | /pdca report 완료 보고서 | docs/04-report/ | pdca: Act phase |
| DC-05 | 설계-구현 불일치 감지 | 5 endpoints 설계, 3 구현 → 매치율 < 100% | core-mission: "Docs = Code" |
| DC-06 | 자동 갭 수정 | iterate → Evaluator-Optimizer 패턴 | pdca: Check-Act Iteration |
| DC-07 | .pdca-status.json 전 단계 추적 | 전체 사이클 | 모든 단계 기록 | pdca: State persistence |
| DC-08 | 문서 구조 컨벤션 준수 | docs/01-plan/ ~ docs/04-report/ | pdca: Documentation Structure |
| DC-09 | 복수 피처 독립 추적 | feature-a(design) + feature-b(plan) | 독립적 관리 | pdca: Multi-feature |
| DC-10 | 설계 우선 워크플로우 강제 | "그냥 코딩" → 최소 plan 요구 | core-mission: "Design first" |
| DC-11 | /pdca status 대시보드 | 활성 피처 전체 표시 | pdca: Status dashboard |
| DC-12 | /pdca next 다음 단계 안내 | 현재 단계에 맞는 추천 | pdca: Phase recommendations |

#### 4.10.4 AI-Native Competency (ANC) - 12 Tests

| ID | Test | Competency | Expected |
|----|------|-----------|----------|
| ANC-01 | gap-detector 매치율 산출 | Verification | 수치적 매치율 + 세부 갭 리스트 |
| ANC-02 | code-analyzer 품질 검사 | Verification | 아키텍처, 보안, 네이밍 컨벤션 검사 |
| ANC-03 | iterate 개선 추적 | Verification | 반복별 델타: "73% → 85% (+12%)" |
| ANC-04 | 설계 우선 워크플로우 | Direction | "채팅 앱 만들기" → Plan → Design → Do 안내 |
| ANC-05 | 템플릿 구조 제공 | Direction | /pdca plan → 목표, 범위, 요구사항, 기준 |
| ANC-06 | 9단계 파이프라인 안내 | Direction | "어디서 시작?" → Schema→...→Deploy |
| ANC-07 | 레벨 적합 가이드 | Direction | Starter에게 K8s 대신 정적 배포 안내 |
| ANC-08 | 네이밍 컨벤션 검사 | Quality | PascalCase(컴포넌트), camelCase(함수) |
| ANC-09 | bkit-rules 기준 제시 | Quality | "코딩 규칙?" → 컨벤션, PDCA 규칙, 도구 규칙 |
| ANC-10 | 90% 품질 게이트 | Quality | 88% → "미달" 판정, 자동 iterate |
| ANC-11 | 보안 검사 활성화 | Quality | "security" → security-architect 활성화 |
| ANC-12 | 팀 표준화 | Quality | 동일 extension → 동일 규칙/워크플로우 |

#### 4.10.5 Value Delivery (VD) - 9 Tests

| ID | Test | Level | Before → After |
|----|------|-------|---------------|
| VD-01 | 시작점 제공 | Starter | "어디서 시작?" → 4가지 옵션 |
| VD-02 | PDCA 자동 적용 | Starter | 명령어 모름 → AI가 자동 plan 생성 |
| VD-03 | 학습형 응답 | Starter | bkit-learning: WHY 설명 포함 |
| VD-04 | 템플릿 자동 생성 | Dynamic | 설계서 처음부터 작성 → 템플릿으로 5분 |
| VD-05 | 설계서 일관성 | Dynamic | 피처마다 다른 구조 → 동일 템플릿 |
| VD-06 | 설계-코드 연결 | Dynamic | 관계 없음 → Gap 분석으로 정량 추적 |
| VD-07 | 팀 표준화 | Enterprise | 사람마다 다른 스타일 → 동일 트리거/규칙 |
| VD-08 | 방법론 통일 | Enterprise | 팀원 개별 방법 → PDCA 공유 상태 |
| VD-09 | 품질 표준화 | Enterprise | 품질 편차 → 90% 임계값 동일 적용 |

#### 4.10.6 User Journey (UJ) - 12 Tests

| ID | Test | Level | Scenario |
|----|------|-------|----------|
| UJ-S-01 | Starter 신규 사용자 | Starter | 빈 프로젝트 → 4옵션 → bkit-learning 스타일 |
| UJ-S-02 | Starter 복귀 사용자 | Starter | sessionCount>1 → "Welcome back" → 이전 상태 |
| UJ-S-03 | Starter E2E | Starter | 포트폴리오: plan→design→do→analyze→report |
| UJ-S-04 | Starter 에러 복구 | Starter | 설계서 삭제 → 감지 → 재생성 제안 |
| UJ-D-01 | Dynamic 신규 사용자 | Dynamic | docker-compose.yml → Dynamic 감지 → bkit-pdca-guide |
| UJ-D-02 | Dynamic 복귀 사용자 | Dynamic | 이전 피처 컨텍스트 복원 + 에이전트 메모리 |
| UJ-D-03 | Dynamic E2E | Dynamic | 인증 시스템: plan→design→do→analyze→report |
| UJ-D-04 | Dynamic 에러 복구 | Dynamic | API 실패 → 설계서 확인 → gap-detector → iterate |
| UJ-E-01 | Enterprise 신규 사용자 | Enterprise | kubernetes/ → Enterprise → bkit-enterprise 스타일 |
| UJ-E-02 | Enterprise 복귀 사용자 | Enterprise | 다중 피처 + 팀 설정 + cto-lead 에이전트 |
| UJ-E-03 | Enterprise E2E | Enterprise | 마이크로서비스: plan→design→do→analyze→report |
| UJ-E-04 | Enterprise 에러 복구 | Enterprise | 배포 실패 → pipeline-guide + infra-architect |

---

## 5. Quality Metrics & Success Criteria

### 5.1 Pass Rate Thresholds

| Priority | Target | Scope |
|----------|--------|-------|
| **P0** (Critical) | **100%** pass | TC-01 Hooks, TC-02 Skills, TC-04 Lib, TC-09 PDCA E2E |
| **P1** (High) | **95%** pass | TC-03 Agents, TC-05 MCP, TC-06 Commands, TC-07 Config, TC-08 Context |
| **P2** (Medium) | **90%** pass | TC-10 Philosophy Alignment |
| **Overall** | **>= 95%** | 전체 카테고리 |

### 5.2 Coverage Targets

| Component | Target | Metric |
|-----------|--------|--------|
| Hook scripts | 10/10 (100%) | 스크립트 실행 커버리지 |
| Skills | 21/21 (100%) | SKILL.md 검증 커버리지 |
| Agents | 16/16 (100%) | 파일 존재 + 레지스트리 매칭 |
| Lib exports | 19/19 (100%) | Orchestrator 함수별 커버리지 |
| MCP tools | 6/6 (100%) | 도구 호출 커버리지 |
| TOML commands | 10/10 (100%) | 명령어 파싱 커버리지 |
| Templates | 12/12 (100%) | 템플릿 존재 커버리지 |
| Permission patterns | 4/4 deny+ask (100%) | 보안 패턴 커버리지 |
| 8-language triggers | 8/8 (100%) | 다국어 트리거 커버리지 |

### 5.3 Performance Benchmarks

| Metric | Target | Timeout |
|--------|--------|---------|
| SessionStart hook | < 3000ms | 5000ms |
| BeforeAgent hook | < 2000ms | 3000ms |
| BeforeModel hook | < 2000ms | 3000ms |
| BeforeTool hook | < 3000ms | 5000ms |
| AfterTool hook | < 3000ms | 5000ms |
| AfterAgent hook | < 7000ms | 10000ms |
| YAML frontmatter 파싱 | < 50ms/skill | - |
| Context hierarchy 병합 | < 100ms | - |
| MCP initialize | < 500ms | - |
| Config 파일 로딩 | < 50ms | - |

### 5.4 Non-Functional Requirements

| Requirement | Criterion |
|------------|-----------|
| Graceful degradation | 모든 hook exit 0 (에러 시에도) |
| Error isolation | Hook 실패가 사용자 인터랙션을 차단하지 않음 |
| Memory safety | 싱글톤 캐시 메모리 누수 없음 |
| File safety | Permission 없이 사용자 파일 쓰기 없음 |
| Security | 모든 deny 패턴이 위험 작업 차단 |
| I18n | 에이전트/스킬 트리거 8개 언어 동작 |

---

## 6. Test Execution Plan

### Phase 1: Automated Tests (Layer 1-3)

```bash
# 실행 방법
cd /path/to/bkit-gemini
node tests/run-all.js

# 개별 실행
node tests/verify-lib.js          # TC-04: Lib 모듈 테스트
node tests/verify-hooks.js        # TC-01: Hook 시스템 테스트
node tests/verify-components.js   # TC-02,03: Skill/Agent 무결성
node tests/verify-philosophy.js   # TC-10: 철학 정합성 기본
```

### Phase 2: MCP Server Tests (Layer 3)

```bash
# MCP 프로토콜 테스트
node tests/test-mcp-manually.js

# 또는 수동 테스트
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | node mcp/spawn-agent-server.js
```

### Phase 3: Interactive E2E Tests (Layer 4-5)

```bash
# Gemini CLI에서 직접 실행
gemini

# 테스트 시나리오 순서:
# 1. SessionStart 확인 (onboarding, level detection)
# 2. /pdca plan test-feature
# 3. /pdca design test-feature
# 4. 소스 코드 작성 (do 단계 전환 확인)
# 5. /pdca analyze test-feature
# 6. /pdca iterate test-feature (매치율 < 90% 시)
# 7. /pdca report test-feature
# 8. /pdca status 확인
# 9. 다국어 트리거 테스트
# 10. Permission 테스트
```

---

## 7. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| GEMINI.md 무시 (#13852) | Hook 동적 주입으로 상쇄 | SessionStart hook이 핵심 규칙 주입 |
| Hook 실행 실패 | 기능 저하 | 모든 hook try-catch + exit 0 |
| MCP 서버 연결 실패 | 에이전트 스포닝 불가 | fallback 에러 메시지 |
| YAML 파서 엣지 케이스 | Skill 메타데이터 오류 | 기본값 fallback + 테스트 강화 |
| Gemini CLI 버전 변경 | API 호환성 | Adapter 패턴 + 호환성 테스트 |
| 파일 시스템 권한 | 쓰기 실패 | 디렉토리 자동 생성 + 에러 핸들링 |

---

## 8. Test Summary

| Category | Test Count | Priority |
|----------|:----------:|:--------:|
| TC-01: Hook System | 40 | P0 |
| TC-02: Skill System | 25 | P0 |
| TC-03: Agent System | 20 | P1 |
| TC-04: Lib Modules | 39 | P0 |
| TC-05: MCP Server | 18 | P1 |
| TC-06: TOML Commands | 15 | P1 |
| TC-07: Configuration | 12 | P1 |
| TC-08: Context Engineering | 15 | P1 |
| TC-09: PDCA E2E | 15 | P0 |
| TC-10: Philosophy Alignment | 59 | P2 |
| **Total** | **258** | |

### Team Composition (CTO Team)

| Agent | Role | Contribution |
|-------|------|-------------|
| **QA Strategist** | 테스트 전략 설계 | 10 카테고리, 180+ 케이스, 리스크 매트릭스, 성능 벤치마크 |
| **Product Manager** | 사용자 경험 검증 | 38 철학 시나리오, 12 User Journey, 12 AI-Native, 9 Value Delivery |
| **Code Analyzer** | 코드 테스트 표면 | 모듈별 export 분석, 에지 케이스, 실패 모드 식별 |
| **Gap Detector** | 커버리지 매핑 | Feature-to-Test 매트릭스, 미테스트 영역 식별 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-11 | Initial test plan - CTO Team 4-Agent 분석 기반 | CTO Team (team-lead) |
