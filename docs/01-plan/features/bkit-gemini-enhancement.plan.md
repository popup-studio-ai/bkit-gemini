# bkit-gemini-enhancement Planning Document

> **Summary**: Claude Code bkit 플러그인과 동일 수준의 기능/UX를 Gemini CLI Extension으로 제공하기 위한 고도화 계획
>
> **Project**: bkit-gemini
> **Version**: 1.5.0 → 1.5.1
> **Author**: CTO Team (5-Agent Analysis)
> **Date**: 2026-02-11
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

bkit(Vibecoding Kit) Gemini CLI Extension을 Claude Code bkit 플러그인(v1.5.3)과 동일한 수준의 기능 완성도와 사용자 경험을 제공하도록 고도화한다. 현재 Gemini 버전은 핵심 PDCA 워크플로우는 구현되어 있으나, Claude Code 버전의 풍부한 Context Engineering, 에이전트 오케스트레이션, UX 자동화 기능이 상당 부분 누락되어 있다.

### 1.2 Background

**현재 상황**:
- Claude Code bkit v1.5.3: 26 Skills, 16 Agents, 45 Scripts, 10+ Hook Events, 4 Output Styles, Agent Teams
- Gemini bkit v1.5.0: 21 Skills, 11 Agents, 7 Scripts, 7 Hook Events, 0 Output Styles, No Teams

**시장 환경**:
- Gemini CLI v0.27.3 (Stable), v0.28.0-preview.8 진행 중
- 1M+ 개발자 사용, 94.2k GitHub Stars
- Extension 시스템 급속 발전 중 (Extensions Lifecycle Launched, Gallery/Config In Design)
- Agent Skills v0.27.0에서 Stable로 승격
- Hook 시스템 v0.27.0에서 기본 활성화
- GitHub Issue #17505 "Bridge Ecosystems: Import External Plugin Bundles (Start with Claude Code)" - 직접 관련

**핵심 목표**: Gemini CLI의 Context Engineering 기능을 최대한 활용하여 Claude Code bkit과 동등한 개발자 경험을 제공

### 1.3 Related Documents

- Claude Code bkit 분석 보고서 (Agent: claude-code-analyst)
- Gemini bkit 코드베이스 분석 보고서 (Agent: gemini-codebase-analyst)
- Gemini CLI 공식문서 및 Extension API 조사 보고서 (Agent: gemini-docs-researcher)
- Gemini CLI GitHub 이슈 및 커뮤니티 동향 보고서 (Agent: github-issue-researcher)
- UX/아키텍처 비교 분석 보고서 (Agent: ux-architecture-analyst)

---

## 2. Scope

### 2.1 In Scope

- [ ] Gemini CLI v0.27+ Context Engineering 기능 완전 활용
- [ ] Claude Code bkit 대비 기능 갭 해소 (21→26 Skills, 11→16 Agents)
- [ ] 동적 컨텍스트 주입 시스템 구축 (Static GEMINI.md → Dynamic SessionStart)
- [ ] Output Styles 시스템 구현 (4종)
- [ ] Agent Memory 영속화 시스템 구축
- [ ] Skill/Agent 메타데이터 고도화 (YAML frontmatter 확장)
- [ ] Hook 시스템 고도화 (7→10 이벤트, 7→20+ 전문 스크립트)
- [ ] Skill Orchestrator 구현
- [ ] Context Hierarchy/Forking 시스템 강화
- [ ] 온보딩 UX 고도화
- [ ] Team Mode / Multi-Agent Orchestration 구현
- [ ] bkit.config.json 확장 (140→229 라인 수준)
- [ ] 테스트 자동화 프레임워크 구축

### 2.2 Out of Scope

- Gemini CLI 코어 코드 수정 (Extension 범위 내에서만 작업)
- bkend.ai BaaS 플랫폼 자체 개발
- Claude Code 플러그인 호환성 (Bridge Ecosystem은 Gemini CLI 팀의 #17505에서 진행)
- Gemini CLI의 알려진 버그 수정 (GEMINI.md 무시 문제 #13852 등은 Gemini 팀이 해결)

---

## 3. Requirements

### 3.1 Functional Requirements

#### Phase 1: Core Context Engineering (P0 - 최우선)

| ID | Requirement | Priority | Status | Claude Code 대응 |
|----|-------------|----------|--------|-------------------|
| FR-01 | **동적 컨텍스트 주입**: SessionStart 훅에서 PDCA 상태, 레벨, 트리거, 규칙을 동적으로 주입하여 매 세션마다 최적화된 컨텍스트 제공 | Critical | Pending | session-start.js (680줄) |
| FR-02 | **Skill 메타데이터 확장**: SKILL.md YAML frontmatter에 `user-invocable`, `argument-hint`, `allowed-tools`, `imports`, `context`, `agents`, `memory`, `permissionMode` 필드 추가 | Critical | Pending | 26개 Skill의 15+ 필드 |
| FR-03 | **Agent 메타데이터 확장**: Agent .md YAML frontmatter에 `model`, `tools`, `temperature`, `max_turns`, `timeout_mins` 필드 추가 (Gemini CLI v0.27+ 네이티브 지원) | Critical | Pending | 16개 Agent 정의 |
| FR-04 | **BeforeModel/AfterModel 훅 활용**: Gemini CLI의 10개 훅 이벤트 중 현재 미사용인 BeforeModel, AfterModel, BeforeToolSelection 활용 | High | Pending | PreToolUse, PostToolUse |
| FR-05 | **@import 기반 GEMINI.md 모듈화**: `@file.md` 구문으로 GEMINI.md를 모듈로 분리하여 토큰 효율성 개선 | High | Pending | Import Resolver |

#### Phase 2: UX Enhancement (P1 - 높음)

| ID | Requirement | Priority | Status | Claude Code 대응 |
|----|-------------|----------|--------|-------------------|
| FR-06 | **Output Styles 시스템**: 4종 출력 스타일(bkit-learning, bkit-pdca-guide, bkit-enterprise, bkit-pdca-enterprise) 구현 및 관리 | High | Pending | output-styles/ 디렉토리 |
| FR-07 | **고도화된 온보딩 UX**: 복귀 사용자 감지, 피처 이력 표시, 매치율 표시, 구조화된 선택지 제공 | High | Pending | enhancedOnboarding() |
| FR-08 | **Ambiguity Detection 통합**: 점수 50+ 시 구조화된 명확화 질문 생성 | Medium | Pending | AskUserQuestion 패턴 |
| FR-09 | **TOML 명령어 고도화**: description + prompt에 더해 `!{command}`, `@{path}`, `{{args}}` 활용한 풍부한 명령어 | Medium | Pending | Markdown 명령어 + frontmatter |

#### Phase 3: Agent Orchestration (P1 - 높음)

| ID | Requirement | Priority | Status | Claude Code 대응 |
|----|-------------|----------|--------|-------------------|
| FR-10 | **Agent Memory 영속화**: 에이전트별 세션 간 컨텍스트 저장/복원. `.gemini/agent-memory/bkit-{agent}/` 디렉토리 구조 | High | Pending | .claude/agent-memory/ |
| FR-11 | **누락 에이전트 5종 추가**: cto-lead, frontend-architect, security-architect, product-manager, qa-strategist | High | Pending | 16개 Agent |
| FR-12 | **Skill Orchestrator**: 스킬 라이프사이클 관리, frontmatter 파싱, 템플릿 자동 임포트, 태스크 자동 생성 | High | Pending | skill-orchestrator.js (400+줄) |
| FR-13 | **Multi-Binding Agent 지원**: PDCA 스킬에서 action별 다른 에이전트 위임 (analyze→gap-detector, iterate→pdca-iterator 등) | Medium | Pending | agents: 매핑 |

#### Phase 4: Advanced Features (P2 - 중간)

| ID | Requirement | Priority | Status | Claude Code 대응 |
|----|-------------|----------|--------|-------------------|
| FR-14 | **Context Hierarchy 구현**: Plugin→User→Project→Session 4단계 설정 병합 | Medium | Pending | context-hierarchy.js |
| FR-15 | **Context Fork 강화**: 분석 에이전트용 격리된 컨텍스트 복사본, 스냅샷 관리 개선 | Medium | Pending | context-fork.js |
| FR-16 | **Per-Skill Hook Scripts**: 제네릭 7개 스크립트 → 스킬/페이즈별 전문화된 20+ 스크립트 | Medium | Pending | 45개 scripts/ |
| FR-17 | **Permission Manager**: 도구별 allow/deny/ask 패턴 매칭 권한 관리 | Medium | Pending | permission-manager.js |

#### Phase 5: Team Mode (P3 - 향후)

| ID | Requirement | Priority | Status | Claude Code 대응 |
|----|-------------|----------|--------|-------------------|
| FR-18 | **Team Mode 기반 구축**: spawn_agent MCP 서버 확장하여 멀티에이전트 오케스트레이션 | Low | Pending | lib/team/ (9 모듈) |
| FR-19 | **CTO-Led 오케스트레이션**: 5가지 패턴 (Leader, Council, Swarm, Pipeline, Watchdog) | Low | Pending | cto-logic.js |
| FR-20 | **Conductor 패턴 연구**: Google의 Conductor Extension과 bkit PDCA 워크플로우 통합 가능성 조사 | Low | Pending | N/A (Gemini 고유) |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| **호환성** | Gemini CLI v0.27.0+ 완전 호환 | v0.27.3, v0.28.0-preview 테스트 |
| **토큰 효율성** | SessionStart 컨텍스트 주입으로 GEMINI.md 정적 로딩 대비 30%+ 토큰 절약 | 토큰 카운트 비교 |
| **성능** | 모든 훅 스크립트 3초 내 실행 완료 | 타임아웃 측정 |
| **안정성** | MCP 서버 장애 시 graceful fallback | 에러 핸들링 검증 |
| **하위호환성** | 기존 bkit-gemini v1.5.0 프로젝트와 호환 | 마이그레이션 테스트 |
| **확장성** | 새로운 Gemini CLI 기능 출시 시 최소 변경으로 통합 | 아키텍처 리뷰 |

---

## 4. 현재 상태 분석 (Gap Analysis)

### 4.1 기능 비교 매트릭스

| Component | Claude Code bkit v1.5.3 | Gemini bkit v1.5.0 | Gap | Priority |
|-----------|------------------------|--------------------|----- |----------|
| **Skills** | 26 (15+ frontmatter 필드) | 21 (3 frontmatter 필드) | -5 Skills, 메타데이터 부족 | P0 |
| **Agents** | 16 (model/memory/context/permission) | 11 (name/desc/triggers만) | -5 Agents, 메타데이터 부족 | P0 |
| **Hook Events** | 10+ (12 with SubagentStart/Stop) | 7 | -3 이벤트 | P1 |
| **Hook Scripts** | 45 (전문화) | 7 (제네릭) | -38 스크립트 | P2 |
| **Output Styles** | 4종 | 0종 | 완전 부재 | P1 |
| **Session Start** | 680줄 (동적 컨텍스트) | 184줄 (기본 초기화) | 기능 격차 큼 | P0 |
| **Commands** | 3 markdown + 26 skills | 10 TOML (단순) | 명령어 표현력 부족 | P1 |
| **Context Hierarchy** | 4레벨 (Plugin→Session) | 없음 | 완전 부재 | P2 |
| **Context Fork** | 완전한 격리 시스템 | 기본 스냅샷만 | 기능 미흡 | P2 |
| **Agent Memory** | Per-agent 영속 저장소 | 없음 | 완전 부재 | P1 |
| **Skill Orchestrator** | 400+줄 오케스트레이터 | 없음 | 완전 부재 | P1 |
| **Team Mode** | 9 모듈 (CTO-Led) | 없음 | 완전 부재 | P3 |
| **Import Resolver** | TTL 캐시, 순환참조 감지 | 기본 구현 | 고도화 필요 | P2 |
| **Memory Store** | 완전한 CRUD + dot-notation | 기본 read/write | 고도화 필요 | P1 |
| **bkit.config.json** | 229줄 (포괄적) | 140줄 (기본) | 설정 확장 필요 | P1 |
| **Templates** | 25+ (level variants 포함) | ~26 (동일) | ✅ 동등 | - |
| **Multi-Language** | 8언어 | 8언어 | ✅ 동등 | - |
| **PDCA Workflow** | 완전 구현 | 완전 구현 | ✅ 동등 | - |
| **Task System** | 완전 구현 | 완전 구현 | ✅ 동등 | - |

### 4.2 Gemini CLI 고유 기능 활용 현황

| Gemini CLI 기능 | 현재 활용도 | 잠재 활용 | Gap |
|-----------------|-----------|----------|-----|
| `@file.md` import syntax | 미사용 | GEMINI.md 모듈화 | High |
| 10 Hook Events | 7/10 사용 | 3개 추가 활용 가능 | Medium |
| Agent frontmatter (`model`, `tools`, `max_turns`) | 미사용 | 에이전트별 모델/도구 제한 | High |
| `/memory` commands | 미사용 | 사용자 기억 관리 | Low |
| `settings` in gemini-extension.json | 미사용 | 설치 시 API 키 설정 | Medium |
| TOML `!{command}`, `@{path}` | 미사용 | 동적 명령어 출력 | Medium |
| Skill progressive disclosure | 부분 사용 | 완전 활용 가능 | Medium |
| 7-layer config precedence | 미사용 | 다단계 설정 관리 | Low |
| Extension themes | 미사용 (v0.28 신규) | 사용자 테마 커스텀 | Low |
| Background shell commands | 미사용 (v0.28 신규) | 장기 실행 작업 | Low |
| Remote sub-agents (A2A) | 미사용 | 원격 에이전트 위임 | Future |

### 4.3 Gemini CLI 알려진 제한사항 및 리스크

| 이슈 | 심각도 | 영향 | 대응 전략 |
|------|--------|------|-----------|
| GEMINI.md 무시 문제 (#13852, #15037) | P1 | 시스템 프롬프트 신뢰성 저하 | SessionStart 훅으로 동적 컨텍스트 주입 병행 |
| MCP Discovery 실패 (#18302) | P1 | MCP 서버 연결 불안정 | Robust error handling + fallback |
| Custom commands 로딩 오류 (#13180, #14453) | P1 | 명령어 사용 불가 | 대체 활성화 경로 구현 |
| Hook 안정성 (#14932, #18019) | P2 | 훅 실행 실패 | Try-catch + graceful degradation |
| SubagentStart/Stop 훅 미지원 (#15269) | P2 | 에이전트 라이프사이클 관리 불가 | AfterAgent 훅으로 대체 |
| Extension 관련 훅 미지원 (#18249) | In Design | 확장된 훅 사용 제한 | 공식 지원 시 마이그레이션 |

---

## 5. Technical Architecture

### 5.1 Gemini CLI Context Engineering 활용 전략

```
┌─────────────────────────────────────────────────────────────────┐
│                    Gemini CLI v0.27+ Architecture               │
│                                                                 │
│  ┌──────────────────┐   ┌──────────────────┐                   │
│  │ GEMINI.md        │   │ SessionStart Hook│                   │
│  │ (Static Context) │   │ (Dynamic Context)│                   │
│  │ - Core Rules     │   │ - PDCA State     │                   │
│  │ - Tool Reference │   │ - Level Detection│                   │
│  │ - @imports       │   │ - Agent Triggers │                   │
│  └────────┬─────────┘   │ - Output Style   │                   │
│           │              │ - Feature Report │                   │
│           │              │ - Onboarding     │                   │
│           │              └────────┬─────────┘                   │
│           └───────────┬──────────┘                              │
│                       ▼                                         │
│              ┌─────────────────┐                                │
│              │  Agent Context  │                                │
│              │  (Combined)     │                                │
│              └────────┬────────┘                                │
│                       │                                         │
│           ┌───────────┼───────────┐                             │
│           ▼           ▼           ▼                             │
│     ┌──────────┐ ┌──────────┐ ┌──────────┐                     │
│     │BeforeAgent│ │BeforeTool│ │AfterTool │                     │
│     │ - Intent  │ │ - Perms  │ │ - Phase  │                     │
│     │ - Trigger │ │ - Guard  │ │ - Track  │                     │
│     └──────────┘ └──────────┘ └──────────┘                     │
│                                                                 │
│     ┌──────────────────────────────────────┐                    │
│     │  Skills (Progressive Disclosure)     │                    │
│     │  - activate_skill → SKILL.md loaded  │                    │
│     │  - Rich frontmatter (new)            │                    │
│     │  - Template auto-import (new)        │                    │
│     └──────────────────────────────────────┘                    │
│                                                                 │
│     ┌──────────────────────────────────────┐                    │
│     │  Agents (.md with Gemini frontmatter)│                    │
│     │  - model: gemini-2.5-pro/flash       │                    │
│     │  - tools: [restricted list]          │                    │
│     │  - max_turns, timeout_mins           │                    │
│     │  - Memory persistence (new)          │                    │
│     └──────────────────────────────────────┘                    │
│                                                                 │
│     ┌──────────────────────────────────────┐                    │
│     │  MCP Server (spawn-agent)            │                    │
│     │  - Team orchestration (new)          │                    │
│     │  - Agent delegation (new)            │                    │
│     └──────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 GEMINI.md 모듈화 전략

현재 167줄 단일 파일을 @import로 모듈 분리:

```
GEMINI.md (코어 룰 + 임포트)
├── @.gemini/context/pdca-rules.md        # PDCA 핵심 규칙
├── @.gemini/context/agent-triggers.md    # 에이전트 트리거 테이블
├── @.gemini/context/skill-triggers.md    # 스킬 트리거 테이블
├── @.gemini/context/tool-reference.md    # 도구 이름 레퍼런스
└── @.gemini/context/feature-report.md    # 기능 사용 보고서 템플릿
```

**이점**:
- 핵심 룰만 상위 GEMINI.md에 유지 (토큰 절약)
- 동적으로 불필요한 모듈 비활성화 가능
- 모듈별 독립 업데이트

### 5.3 Agent Frontmatter 고도화 (Gemini CLI Native)

Gemini CLI v0.27+는 에이전트 .md 파일에서 다음 frontmatter를 네이티브 지원:

```yaml
---
name: gap-detector
description: Design-implementation gap analysis for PDCA Check phase
kind: local
model: gemini-2.5-pro        # 복잡한 분석에 Pro 모델
tools:                        # 도구 제한 (read-only)
  - read_file
  - read_many_files
  - grep_search
  - glob_tool
  - list_directory
  - web_search
temperature: 0.1              # 정확한 분석을 위해 낮은 temperature
max_turns: 20                 # 충분한 분석 턴
timeout_mins: 10              # 대규모 코드베이스 분석 시간
---
```

### 5.4 Hook System 확장 계획

현재 7개 → 10개 이벤트 + 전문화된 스크립트:

```
hooks/
├── hooks.json                    # 10 이벤트 등록
└── scripts/
    ├── session-start.js          # 고도화 (184→400+ 줄)
    ├── session-end.js            # 상태 영속화 강화
    ├── before-agent.js           # 인텐트 감지 + 에이전트 메모리 로드
    ├── after-agent.js            # 메모리 저장 + 매치율 추출
    ├── before-model.js           # (신규) 프롬프트 최적화, 모델 선택
    ├── after-model.js            # (신규) 응답 후처리, 로깅
    ├── before-tool-selection.js  # (신규) 도구 필터링, 권한 체크
    ├── before-tool.js            # 위험 명령 차단 강화
    ├── after-tool.js             # PDCA 단계 전환 + 파일 변경 추적
    └── pre-compress.js           # 컨텍스트 압축 전 상태 스냅샷
```

---

## 6. Implementation Roadmap

### Phase 1: Core Context Engineering (Sprint 1-2, 예상 2주)

**목표**: 동적 컨텍스트 주입 + Skill/Agent 메타데이터 확장

| Step | Task | 파일/모듈 | 예상 공수 |
|------|------|----------|----------|
| 1.1 | SessionStart 훅 고도화 (184→400+줄) | hooks/scripts/session-start.js | Large |
| | - PDCA 상태 기반 동적 컨텍스트 생성 | | |
| | - 레벨별 권장 사항 주입 | | |
| | - 에이전트 트리거 테이블 동적 생성 | | |
| | - Feature Usage Report 템플릿 주입 | | |
| | - 고도화된 온보딩 로직 | | |
| 1.2 | GEMINI.md 모듈화 (@import 적용) | GEMINI.md + .gemini/context/*.md | Medium |
| 1.3 | Agent .md frontmatter 확장 (11개 에이전트) | agents/*.md | Medium |
| | - model, tools, temperature, max_turns, timeout_mins 추가 | | |
| 1.4 | SKILL.md frontmatter 확장 (21개 스킬) | skills/*/SKILL.md | Medium |
| | - user-invocable, argument-hint, allowed-tools, imports 추가 | | |
| 1.5 | 누락 에이전트 5종 추가 | agents/ (신규 5개 파일) | Medium |
| | - cto-lead.md, frontend-architect.md | | |
| | - security-architect.md, product-manager.md, qa-strategist.md | | |
| 1.6 | bkit.config.json 확장 (team, permissions, outputStyles 섹션) | bkit.config.json | Small |

**검증 기준**:
- SessionStart에서 동적 컨텍스트 주입 확인
- 모든 에이전트가 지정된 model로 실행
- 에이전트 도구 제한이 정상 동작

### Phase 2: UX Enhancement (Sprint 3-4, 예상 2주)

**목표**: Output Styles + 온보딩 + 메모리 시스템 강화

| Step | Task | 파일/모듈 | 예상 공수 |
|------|------|----------|----------|
| 2.1 | Output Styles 시스템 구현 | output-styles/ (신규 4개 파일) | Medium |
| | - bkit-learning.md, bkit-pdca-guide.md | | |
| | - bkit-enterprise.md, bkit-pdca-enterprise.md | | |
| | - 스타일 활성화/관리 로직 | | |
| 2.2 | 고도화된 온보딩 UX | hooks/scripts/session-start.js | Medium |
| | - 복귀 사용자 감지 및 피처 이력 표시 | | |
| | - 매치율 기반 이어하기 제안 | | |
| | - 구조화된 선택지 (4가지 옵션) | | |
| 2.3 | Agent Memory 영속화 | lib/core/agent-memory.js (신규) | Large |
| | - .gemini/agent-memory/bkit-{agent}/ 디렉토리 | | |
| | - project/user scope 분리 | | |
| | - BeforeAgent 훅에서 메모리 로드 | | |
| | - AfterAgent 훅에서 메모리 저장 | | |
| 2.4 | Memory Store 고도화 | lib/core/memory.js | Medium |
| | - Dot-notation 완전 지원 | | |
| | - Cache + dirty tracking 최적화 | | |
| 2.5 | TOML 명령어 고도화 | commands/*.toml | Small |
| | - `!{command}`, `@{path}`, `{{args}}` 활용 | | |
| 2.6 | Ambiguity Detection 통합 | hooks/scripts/before-agent.js | Small |
| | - 점수 50+ 시 구조화된 질문 생성 | | |

**검증 기준**:
- Output Style 전환 및 적용 확인
- 에이전트 메모리가 세션 간 유지
- 복귀 사용자에게 이전 작업 이력 표시

### Phase 3: Skill Orchestration (Sprint 5-6, 예상 2주)

**목표**: Skill Orchestrator + Per-Skill Hooks + Context 관리

| Step | Task | 파일/모듈 | 예상 공수 |
|------|------|----------|----------|
| 3.1 | Skill Orchestrator 구현 | lib/skill-orchestrator.js (신규) | Large |
| | - Frontmatter 파싱 엔진 | | |
| | - 템플릿 자동 임포트 | | |
| | - 태스크 자동 생성 | | |
| | - Multi-binding agent 위임 | | |
| 3.2 | Per-Skill Hook Scripts | hooks/scripts/ (10+ 신규) | Large |
| | - pdca-plan-post.js, pdca-design-post.js | | |
| | - pdca-analyze-post.js, pdca-iterate-post.js | | |
| | - skill-completion-handler.js | | |
| 3.3 | Context Hierarchy 구현 | lib/context-hierarchy.js (신규) | Medium |
| | - 4단계 설정 병합 (Plugin→Session) | | |
| | - 우선순위 기반 충돌 해결 | | |
| 3.4 | Context Fork 강화 | lib/adapters/gemini/context-fork.js | Medium |
| | - Smart/Replace/Append 병합 전략 | | |
| | - 스냅샷 관리 개선 (LRU 캐시) | | |
| 3.5 | Import Resolver 고도화 | lib/adapters/gemini/import-resolver.js | Small |
| | - TTL 캐시 + 순환참조 감지 강화 | | |
| 3.6 | Permission Manager 구현 | lib/core/permission.js (확장) | Medium |
| | - 패턴 매칭 기반 allow/deny/ask | | |
| | - Per-skill 도구 제한 연동 | | |

**검증 기준**:
- 스킬 활성화 시 템플릿 자동 로드
- 에이전트 위임이 정상 동작
- Context fork에서 상태 격리 확인

### Phase 4: Advanced Hook System (Sprint 7, 예상 1주)

**목표**: 10 Hook Events 완전 활용

| Step | Task | 파일/모듈 | 예상 공수 |
|------|------|----------|----------|
| 4.1 | BeforeModel 훅 구현 | hooks/scripts/before-model.js (신규) | Medium |
| | - 프롬프트 최적화 | | |
| | - 모델 선택 로직 | | |
| 4.2 | AfterModel 훅 구현 | hooks/scripts/after-model.js (신규) | Small |
| | - 응답 후처리 | | |
| | - 사용량 로깅 | | |
| 4.3 | BeforeToolSelection 훅 구현 | hooks/scripts/before-tool-selection.js (신규) | Medium |
| | - 컨텍스트 기반 도구 필터링 | | |
| | - PDCA 단계별 도구 제한 | | |
| 4.4 | hooks.json 업데이트 | hooks/hooks.json | Small |
| | - 10개 이벤트 등록, matcher 패턴 최적화 | | |

**검증 기준**:
- 10개 훅 이벤트 모두 정상 실행
- BeforeToolSelection에서 도구 필터링 동작

### Phase 5: Team Mode Foundation (Sprint 8-9, 예상 2주)

**목표**: MCP 기반 멀티에이전트 오케스트레이션 기반 구축

| Step | Task | 파일/모듈 | 예상 공수 |
|------|------|----------|----------|
| 5.1 | MCP spawn-agent 서버 확장 | mcp/spawn-agent-server.js | Large |
| | - Team 생성/관리 도구 추가 | | |
| | - 에이전트 간 메시지 전달 | | |
| | - 태스크 분배 로직 | | |
| 5.2 | Team Coordinator 구현 | lib/team/coordinator.js (신규) | Large |
| | - 팀 전략 생성 (Dynamic: 3명, Enterprise: 5명) | | |
| | - 태스크 배정 및 추적 | | |
| 5.3 | CTO-Led Orchestration 패턴 | lib/team/cto-logic.js (신규) | Medium |
| | - 5가지 패턴 (Leader/Council/Swarm/Pipeline/Watchdog) | | |
| 5.4 | Conductor Extension 연동 조사 | docs/ (연구 문서) | Small |
| | - Google Conductor와 bkit PDCA 통합 가능성 | | |

**검증 기준**:
- spawn_agent MCP로 에이전트 간 협업 동작
- 팀 전략에 따른 태스크 자동 배분

### Phase 6: Testing & Documentation (Sprint 10, 예상 1주)

| Step | Task | 파일/모듈 | 예상 공수 |
|------|------|----------|----------|
| 6.1 | 자동화 테스트 프레임워크 | tests/ (전면 개편) | Medium |
| | - Hook 테스트 자동화 | | |
| | - Skill 활성화 테스트 | | |
| | - 에이전트 실행 테스트 | | |
| 6.2 | Gemini CLI 버전 호환성 테스트 | tests/compat/ | Medium |
| | - v0.27.3 / v0.28.0 양쪽 테스트 | | |
| 6.3 | 마이그레이션 가이드 | docs/guides/migration-v2.md | Small |
| 6.4 | GEMINI.template.md 업데이트 | templates/GEMINI.template.md | Small |

---

## 7. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **GEMINI.md 무시 문제 (#13852)**: Gemini 3 Pro가 GEMINI.md 지시를 무시하는 알려진 버그 | High | High | SessionStart 훅의 `additionalContext`로 핵심 규칙을 동적 주입하여 이중 보장. GEMINI.md에 의존하지 않는 아키텍처 설계 |
| **Hook 시스템 불안정**: 아직 v1 안정판 미출시, 일부 환경에서 동작하지 않음 (#14932) | High | Medium | 모든 훅에 try-catch + graceful degradation. 훅 없이도 기본 기능 동작하도록 설계 |
| **Gemini CLI 빠른 버전 업데이트**: 주간 릴리스로 API 변경 가능성 | Medium | High | 어댑터 패턴 유지. Platform interface를 통한 추상화. 호환성 테스트 자동화 |
| **Extension API 변경**: Skills, Hooks가 아직 발전 중이며 breaking changes 가능 | Medium | Medium | semver 준수, gemini-extension.json의 experimental 플래그 모니터링. 변경 감지 CI/CD |
| **MCP 서버 안정성**: 환경변수 redaction, 인증 실패 등 (#18302, #13840) | Medium | Medium | Robust error handling, fallback 로직, 재연결 메커니즘 |
| **Agent frontmatter 파싱 변경**: Gemini CLI가 에이전트 메타데이터 처리 방식 변경 가능 | Low | Medium | 현재 공식 문서 기반 구현, 호환성 테스트 자동화 |
| **Conductor Extension 충돌**: Google의 Conductor가 유사한 워크플로우를 제공하여 중복 가능 | Low | Low | 차별화 전략: bkit은 PDCA 특화, Conductor는 일반 프로젝트 관리. 상호 보완적 포지셔닝 |

---

## 8. Success Criteria

### 8.1 Definition of Done

- [ ] 모든 Functional Requirements (FR-01 ~ FR-20) 구현 완료
- [ ] Claude Code bkit v1.5.3의 핵심 기능 100% 대응 (Team Mode 제외)
- [ ] Gemini CLI v0.27.3, v0.28.0-preview에서 정상 동작 확인
- [ ] 자동화 테스트 통과
- [ ] 마이그레이션 가이드 완성
- [ ] PDCA Gap Analysis Match Rate >= 90%

### 8.2 Quality Criteria

- [ ] 모든 훅 스크립트 3초 내 실행 (타임아웃 미초과)
- [ ] MCP 서버 에러 핸들링 100% 커버리지
- [ ] Zero lint errors (ESLint)
- [ ] 기존 v1.5.0 프로젝트 하위호환성 유지

### 8.3 Feature Parity Metrics

| Metric | Target | 측정 방법 |
|--------|--------|----------|
| Skills 수 | 26/26 (100%) | 파일 카운트 |
| Agents 수 | 16/16 (100%) | 파일 카운트 |
| Hook Events | 10/10 (100%) | hooks.json 검증 |
| Hook Scripts | 20+/45 (44%+) | 스크립트 카운트 |
| Output Styles | 4/4 (100%) | 파일 카운트 |
| Agent Memory | Implemented | 기능 테스트 |
| Skill Orchestrator | Implemented | 기능 테스트 |
| Context Hierarchy | Implemented | 기능 테스트 |
| Team Mode | Foundation | MCP 서버 테스트 |

---

## 9. Architecture Considerations

### 9.1 Project Level Selection

| Level | Characteristics | Selected |
|-------|-----------------|:--------:|
| **Starter** | Simple structure | ☐ |
| **Dynamic** | Feature-based modules, services layer | ☐ |
| **Enterprise** | Strict layer separation, DI, microservices | ☑ |

**선택 근거**: bkit 자체가 26 Skills, 16 Agents, 복잡한 Hook/Agent/Context 시스템을 가진 Enterprise급 Extension. 모듈화된 아키텍처가 필수.

### 9.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Context 주입 | Static GEMINI.md / Dynamic Hook | **Hybrid** | GEMINI.md 코어 룰 + SessionStart 동적 주입 |
| Agent 정의 | Generic .md / Gemini Native frontmatter | **Gemini Native** | v0.27+ 네이티브 지원 활용 |
| Team Mode | MCP spawn_agent / Gemini Sub-agents | **MCP 확장** | 더 많은 제어 가능 |
| Output Styles | GEMINI.md / Skill / Standalone | **Standalone .md** | Claude Code와 동일 패턴 |
| Config 관리 | Single file / Hierarchy | **Hierarchy** | 4단계 설정 병합 |
| 테스트 | Manual / Node test runner | **Node test runner** | 자동화 필수 |

### 9.3 Gemini CLI Native 기능 최대 활용

1. **`@file.md` import**: GEMINI.md 모듈화에 적극 활용
2. **Agent frontmatter**: `model`, `tools`, `temperature`, `max_turns` 네이티브 지원
3. **TOML commands**: `!{command}`, `@{path}`, `{{args}}` 고급 기능 활용
4. **Progressive skill disclosure**: 필요할 때만 스킬 로드 (토큰 절약)
5. **7-layer config**: 시스템→프로젝트→CLI args 설정 우선순위 활용
6. **Extension settings**: `gemini-extension.json`의 `settings` 필드로 설치 시 설정

---

## 10. Convention Prerequisites

### 10.1 Existing Project Conventions

- [x] `GEMINI.md` has coding conventions section
- [x] `bkit.config.json` exists with convention settings
- [ ] `docs/01-plan/conventions.md` exists (Phase 2 output) - 필요
- [ ] ESLint configuration (`.eslintrc.*`) - 추가 필요
- [ ] Prettier configuration (`.prettierrc`) - 추가 필요

### 10.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Naming** | bkit.config.json에 기본 정의 | Agent/Skill 파일 명명 규칙 표준화 | High |
| **Folder structure** | 기본 구조 있음 | .gemini/context/, output-styles/ 추가 | High |
| **Hook script naming** | 이벤트명 기반 | per-skill 스크립트 명명 규칙 | Medium |
| **Environment variables** | 기본 목록 있음 | BKIT_OUTPUT_STYLE, BKIT_TEAM_MODE 추가 | Medium |
| **Error handling** | 기본 try-catch | Graceful degradation 패턴 표준화 | Medium |

---

## 11. Gemini CLI 버전별 기능 활용 계획

### v0.27.x (Stable, 현재 기준)

활용 가능:
- Agent Skills (Stable)
- Hook System (기본 활성화)
- 10 Hook Events
- Agent frontmatter (model, tools, max_turns, timeout_mins)
- @import syntax in GEMINI.md
- TOML commands with !{}, @{}, {{args}}
- Extension manifest with settings
- MCP 3 transport types
- Session management & resume

### v0.28.x (Preview, 향후 적용)

추가 활용 가능:
- Extension themes support
- Background shell commands
- Dynamic policy registration for subagents
- MCP server OAuth consent
- Tool name aliasing
- Hooks management improvements

### 향후 (In Design/Roadmap)

모니터링 대상:
- Extensions support for hooks, subagents, and skills (#18249)
- Per-extension configuration (#18247)
- Gallery discovery and installation (#18246)
- SubAgent Architecture (#11773)
- Dynamic Loading of Hierarchical Memory (#11774)
- Run autonomous background Agents (#4168)

---

## 12. Next Steps

1. [ ] 이 Plan 문서 리뷰 및 승인
2. [ ] Design 문서 작성 (`/pdca design bkit-gemini-enhancement`)
3. [ ] Phase 1 (Core Context Engineering) 구현 시작
4. [ ] Gemini CLI v0.28 Stable 출시 모니터링
5. [ ] Google Conductor Extension 연동 가능성 PoC

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-11 | Initial draft - 5-Agent 분석 기반 종합 계획 | CTO Team (team-lead) |
