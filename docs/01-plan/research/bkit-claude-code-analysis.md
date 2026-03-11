# bkit-claude-code 플러그인 심층 분석 보고서

> 작성일: 2026-03-11 | 분석 대상: bkit-claude-code v1.6.1

## 1. 철학 및 사상 요약

### 핵심 미션
"모든 개발자가 명령어나 PDCA를 몰라도 자연스럽게 문서 주도 개발과 지속 개선을 실천하게 만든다"

### 3대 철학
- **Automation First**: 사용자가 명령어를 모르더라도 Claude가 PDCA를 자동 적용 (`bkit-rules` 스킬 + PreToolUse 훅)
- **No Guessing**: 확실하지 않으면 문서 확인, 없으면 사용자에게 질문 (절대 추측 금지)
- **Docs = Code**: 설계 먼저, 구현 나중 (설계-구현 동기화 유지)

### AI Native Development
AI를 코드 생성 도구가 아닌 전체 개발 프로세스의 파트너로 활용. 인간의 3대 역량(검증/방향설정/품질기준)에 집중.

### Level 시스템
- **Starter** (초보, 5단계): HTML/CSS/JS 정적 사이트
- **Dynamic** (중급, 8단계): BaaS 기반 풀스택
- **Enterprise** (고급, 9단계 전체): 마이크로서비스, K8s, Terraform

### 언어 Tier
4단계: AI-Native Essential → Professional → Specialist → Legacy/Niche

---

## 2. 아키텍처 상세 분석

### 핵심 구성요소 현황

| 구성요소 | 수량 | 위치 |
|---------|:----:|------|
| Skills | 28 (9W/18C/1H) | `skills/*/SKILL.md` |
| Agents | 21 (16 core + 5 PM) | `agents/*.md` |
| lib exports | 208 | 5개 하위 디렉토리 + 7개 top-level 모듈 |
| Scripts | 47 | `scripts/*.js` |
| Hook Events | 10 (13개 등록) | `hooks/hooks.json` + frontmatter |
| Templates | 13+ | `templates/` |
| Output Styles | 4 | `output-styles/` |
| Evals | 28 | `evals/` |

### lib/ 모듈 구조 (5개 하위 디렉토리, 208 exports)

- **`lib/core/`** (7파일, 41 exports): 플랫폼, 캐시, I/O, 디버그, 설정, 파일, **Path Registry**
- **`lib/pdca/`** (6파일, 54 exports): Tier, Level, Phase, Status, Automation, Executive Summary, **Template Validator**
- **`lib/intent/`** (4파일, 19 exports): 8개 언어 감지, 트리거 매칭, 모호성 분석
- **`lib/task/`** (5파일, 26 exports): 태스크 분류, 컨텍스트, 생성, 추적
- **`lib/team/`** (9파일, 40 exports): 코디네이터, 전략, CTO 로직, 통신, 태스크 큐, 상태 기록
- **`lib/common.js`**: 208개 함수를 재export하는 브릿지 레이어

### 6-Layer Hook System

```
Layer 1: hooks.json global (모든 세션에 적용)
Layer 2: Skill frontmatter (스킬 실행 시 적용)
Layer 3: Agent frontmatter (에이전트 실행 시 적용)
Layer 4: Description 트리거 (에이전트 선택에 영향)
Layer 5: 47개 Scripts (이벤트 처리 로직)
Layer 6: Team Orchestration (팀 오케스트레이션)
```

10개 훅 이벤트: SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, Stop, PreCompact, TaskCompleted, SubagentStart, SubagentStop, TeammateIdle

### Skill 분류 시스템 (v1.6.0)

- **Workflow (9개)**: pdca, plan-plus, pm-discovery, development-pipeline, bkit-rules, bkit-templates, code-review, zero-script-qa, claude-code-learning
  - 모델 발전과 무관한 영구 가치
- **Capability (18개)**: starter, dynamic, enterprise, mobile-app, desktop-app, phase-1~9, bkend-*
  - 모델 발전 시 중복 가능, data-driven deprecation
- **Hybrid (1개)**: plan-plus
  - 워크플로우 + 역량 결합

### Agent Teams 오케스트레이션

- **CTO Lead** (opus)가 오케스트레이션 총괄
- 5가지 패턴: Leader / Council / Swarm / Pipeline / Watchdog
- PDCA 단계별 자동 패턴 선택 (bkit.config.json의 orchestrationPatterns)
- Dynamic: 3명 + CTO, Enterprise: 5명 + CTO
- **PM Agent Team**: 5개 PM 에이전트 (pm-lead, pm-discovery, pm-strategy, pm-research, pm-prd)

---

## 3. 전체 기능 카탈로그

### Skills (28개)
| 분류 | 스킬명 | 기능 |
|------|--------|------|
| Workflow | pdca | 통합 PDCA 사이클 관리 |
| Workflow | plan-plus | 브레인스토밍 기반 고도화 계획 |
| Workflow | pm-discovery | PM 에이전트 팀 오케스트레이션 |
| Workflow | development-pipeline | 9단계 개발 파이프라인 가이드 |
| Workflow | bkit-rules | 핵심 규칙 자동 적용 |
| Workflow | bkit-templates | PDCA 문서 템플릿 |
| Workflow | code-review | 코드 리뷰 |
| Workflow | zero-script-qa | 스크립트 없는 QA |
| Workflow | claude-code-learning | CC 학습 가이드 |
| Capability | starter | 정적 웹 개발 |
| Capability | dynamic | 풀스택 BaaS 개발 |
| Capability | enterprise | 엔터프라이즈 마이크로서비스 |
| Capability | mobile-app | 모바일 앱 개발 |
| Capability | desktop-app | 데스크톱 앱 개발 |
| Capability | phase-1~9 | 9단계 개발 파이프라인 각 단계 |
| Capability | bkend-* | bkend.ai BaaS 전문 스킬 (auth, data, storage, cookbook, quickstart) |
| Hybrid | plan-plus | 워크플로우 + 역량 결합 |

### Agents (21개)
| 에이전트 | 역할 |
|---------|------|
| cto-lead | CTO 레벨 팀 리드, PDCA 오케스트레이션 |
| gap-detector | 설계-구현 갭 분석 |
| pdca-iterator | 자동 반복 개선 (Check-Act) |
| code-analyzer | 코드 품질/보안/성능 분석 |
| report-generator | PDCA 완료 보고서 생성 |
| design-validator | 설계 문서 검증 |
| qa-strategist | QA 전략 수립 |
| qa-monitor | Docker 로그 실시간 모니터링 |
| starter-guide | 초보자 가이드 |
| pipeline-guide | 개발 파이프라인 가이드 |
| bkend-expert | bkend.ai BaaS 전문가 |
| enterprise-expert | CTO급 엔터프라이즈 전문가 |
| infra-architect | AWS/K8s/Terraform 인프라 |
| frontend-architect | 프론트엔드 아키텍처 |
| security-architect | 보안 아키텍처 |
| product-manager | 제품 관리 |
| pm-lead | PM 팀 리드 |
| pm-discovery | PM 기회 발견 |
| pm-strategy | PM 전략 (JTBD, Lean Canvas) |
| pm-research | PM 시장 조사 |
| pm-prd | PM PRD 작성 |

---

## 4. Context Engineering 전략 분석

### 동적 Context 주입 (정적 CLAUDE.md 대신)

bkit은 CLAUDE.md에 최소 규칙만 넣고, **SessionStart Hook에서 동적으로 대량의 context를 주입**:
- PDCA 상태, 레벨 감지
- 트리거 키워드 테이블
- Agent Teams 상태
- Output Style 추천
- bkend MCP 상태
- Feature Usage Report 규칙
- Executive Summary 규칙

### 4-Level Context Hierarchy (FR-01)

```
Plugin Policy (최상위)
  └→ User Config
       └→ Project Config
            └→ Session Context (최하위, 상위가 override)
```

### 8대 Functional Requirements

| FR | 설명 |
|----|------|
| FR-01 | Multi-Level Context Hierarchy |
| FR-02 | @import Directive |
| FR-03 | Context Fork Isolation |
| FR-04 | UserPromptSubmit Hook |
| FR-05 | Permission Hierarchy |
| FR-06 | Task Dependency Chain |
| FR-07 | Context Compaction Hook |
| FR-08 | MEMORY Variable Support |

### Dynamic Context Injection Patterns

1. **Task Size → PDCA Level**: 코드 변경 줄 수 기반 자동 분류
2. **User Intent → Agent/Skill Auto-Trigger**: 8개 언어 의도 감지
3. **Ambiguity Score → Clarifying Questions**: 모호성 점수 ≥ 50일 때 질문
4. **Match Rate → Check-Act Iteration**: < 90% 시 자동 반복 개선
5. **Level Detection → Team Suggestion**: Major Feature 감지 시 팀 제안

---

## 5. 최신 기능 분석 (v1.5.7~v1.6.1)

### v1.6.0~v1.6.1 주요 기능
- **Skills 2.0**: context:fork native, frontmatter hooks, Skill Evals, Skill Classification
- **28 스킬 분류**: 9 Workflow / 18 Capability / 1 Hybrid
- **PDCA 문서 템플릿 검증**: PostToolUse hook (ENH-103)
- **Skill Creator + A/B Testing**: evals/ 디렉토리
- **/loop + Cron PDCA 자동 모니터링**
- **Hot reload**: SKILL.md 변경 즉시 반영
- **Wildcard permissions**: `Bash(npm *)`, `Bash(git log*)` 패턴
- **Background agent recovery**: CTO Team bg agents 안정화
- **PM Agent Team**: /pdca pm {feature} 사전 제품 발견

### v1.5.9 주요 기능
- **Path Registry**: 중앙 집중 상태 파일 경로 관리 (lib/core/paths.js)
- **State file 구조화**: `.bkit/{state,runtime,snapshots}/`
- **자동 마이그레이션**: v1.5.7 레거시 경로에서 자동 이전
- **Output Styles**: bkit-learning, bkit-pdca-guide, bkit-enterprise, bkit-pdca-enterprise

### v1.5.7 주요 기능
- **CC v2.1.63 HTTP hooks 지원**: `type: "http"` in hooks config
- **13 메모리 누수 수정**: 장시간 CTO Team 세션 안정화
- **/simplify 통합**: PDCA Check→Report 흐름에 코드 정리 단계 추가

---

## 6. bkit-gemini 고도화에 활용 가능한 핵심 인사이트

1. **SessionStart 동적 context 주입 패턴** → Gemini RuntimeHook으로 이식
2. **lib/common.js 브릿지 패턴** → 모듈화하면서 하위 호환성 유지
3. **Skill Classification (W/C/H)** → 스킬 라이프사이클 관리 전략
4. **Multi-binding Agents** → 스킬의 액션별 에이전트 라우팅
5. **unified-stop.js 핸들러 레지스트리** → 단일 진입점에서 context 기반 라우팅
6. **5가지 오케스트레이션 패턴** → PDCA 단계별 자동 패턴 선택
7. **Path Registry** → 상태 파일 경로 중앙 관리 + 자동 마이그레이션
8. **8개 언어 트리거 시스템** → 다국어 의도 감지
9. **Executive Summary + Feature Usage Report** → 매 응답의 구조화된 메타 정보
10. **Version-Gated Features** → `getFeatureFlags()` 기반 점진적 기능 활성화

---

> 본 분석은 실제 소스코드(bkit.config.json, hooks/hooks.json, hooks/session-start.js, lib/common.js, lib/core/paths.js, lib/core/config.js, lib/skill-orchestrator.js, lib/context-hierarchy.js, lib/memory-store.js, lib/team/index.js, lib/team/coordinator.js, scripts/unified-stop.js, scripts/user-prompt-handler.js, agents/*.md, skills/*/SKILL.md, bkit-system/philosophy/*.md, commands/bkit.md, output-styles/bkit-pdca-guide.md)를 직접 읽어서 수행한 것입니다.
