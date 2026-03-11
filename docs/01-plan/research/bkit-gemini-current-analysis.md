# bkit-gemini 코드베이스 심층 분석 보고서

> 분석일: 2026-03-11 | 분석 대상: bkit-gemini v1.5.7 | 브랜치: feature/v1.5.7-gemini-032-migration

---

## 1. 프로젝트 구조 개요

### 1.1 디렉토리 트리 및 역할

```
bkit-gemini/
|-- gemini-extension.json       # Gemini CLI 확장 매니페스트 (이름, 버전, settings)
|-- GEMINI.md                   # 글로벌 시스템 프롬프트 (6개 @import 모듈 포함)
|-- bkit.config.json            # 중앙 설정 파일 (14개 섹션, 214줄)
|-- CHANGELOG.md                # 버전 히스토리
|-- README.md                   # 프로젝트 문서 (713줄)
|
|-- agents/                     # 16개 전문 AI 에이전트 (.md, Gemini frontmatter)
|-- skills/                     # 29개 도메인 스킬 (각 SKILL.md)
|-- commands/                   # 18개 TOML 커맨드 (/pdca, /bkit, /review 등)
|-- hooks/                      # 10-이벤트 Hook 시스템
|   |-- hooks.json              # 10개 hook 이벤트 등록 (command 타입)
|   |-- runtime-hooks.js        # SDK RuntimeHook 등록 모듈 (v0.31.0+)
|   +-- scripts/                # 10개 hook 스크립트 + 5 skill post-hook + 2 유틸
|
|-- lib/                        # 코어 런타임 라이브러리 (JavaScript)
|   |-- skill-orchestrator.js   # 스킬 파서/로더/오케스트레이터
|   |-- context-hierarchy.js    # 4레벨 설정 병합 (Plugin->User->Project->Session)
|   |-- common.js               # 공통 유틸
|   |-- core/                   # 코어 모듈 (config, memory, permission, agent-memory 등)
|   |-- adapters/gemini/        # Gemini CLI 플랫폼 어댑터 (7개 모듈)
|   |-- intent/                 # 의도 감지 (trigger, language, ambiguity)
|   |-- pdca/                   # PDCA 상태/페이즈/레벨/자동화 관리
|   +-- task/                   # 태스크 분류/추적/의존성
|
|-- mcp/                        # MCP 서버 (spawn-agent-server.js, 6개 도구)
|-- output-styles/              # 4개 출력 스타일 (.md)
|-- policies/                   # 확장 정책 TOML (Tier 2)
|-- templates/                  # PDCA 문서 템플릿 + 파이프라인 템플릿
|-- scripts/                    # 유틸리티 스크립트 (phase-transition.js)
|-- src/                        # E2E 테스트 (pdca-e2e.js)
|-- tests/                      # 테스트 스위트 (24개 TC + 픽스처 + 유틸)
|
|-- .gemini/                    # Gemini CLI 네이티브 설정
|   |-- context/                # @import 컨텍스트 모듈 6개
|   |-- policies/               # 자동 생성 TOML 정책
|   +-- agent-memory/bkit/      # 에이전트별 영속 메모리 (JSON)
|
|-- .bkit/                      # bkit 런타임 상태
|   |-- runtime/                # 에이전트 상태
|   |-- state/                  # 메모리, PDCA 상태
|   +-- snapshots/              # 컨텍스트 스냅샷
|
|-- .claude/                    # Claude Code 호환 설정 (agent-memory, commands)
|-- docs/                       # PDCA 문서 (01-plan ~ 04-report) + 아카이브
+-- images/                     # README 이미지
```

### 1.2 핵심 설정 파일

| 파일 | 역할 | 크기/구조 |
|------|------|-----------|
| `gemini-extension.json` | Gemini CLI 확장 매니페스트 | 24줄, name/version/description/settings 필드 |
| `GEMINI.md` | 글로벌 시스템 프롬프트 | 62줄, 6개 @import 포함, Core Rules 7개 |
| `bkit.config.json` | 중앙 설정 | 214줄, 14개 섹션 (pdca, agents, skills, hooks, permissions 등) |
| `hooks/hooks.json` | Hook 이벤트 등록 | 160줄, 10개 이벤트, `${extensionPath}` 변수 사용 |
| `.pdca-status.json` | PDCA 진행 상태 | v2.0 포맷, activeFeatures + archivedFeatures |

### 1.3 코드 규모

| 카테고리 | 파일 수 | 비고 |
|----------|---------|------|
| JavaScript (lib/) | 약 25개 | 코어 런타임 (adapters, core, intent, pdca, task) |
| JavaScript (hooks/) | 12개 | 10 hook 스크립트 + 5 skill hooks + 2 utils |
| JavaScript (mcp/) | 1개 | spawn-agent-server.js (753줄) |
| JavaScript (tests/) | 약 30개 | 24 TC 스위트 + 유틸 + 수동 테스트 |
| Agent 정의 (.md) | 16개 | Gemini frontmatter 형식 |
| Skill 정의 (.md) | 29개 | YAML frontmatter + 상세 지침 |
| TOML 커맨드 | 18개 | @{path}, !{command}, {{args}} 문법 |
| 출력 스타일 (.md) | 4개 | 레벨별 응답 포맷 |
| 템플릿 (.md) | 약 17개 | PDCA + 파이프라인 + 공유 패턴 |
| 컨텍스트 모듈 (.md) | 6개 | .gemini/context/ 디렉토리 |
| TOML 정책 | 3개 | base + extension + starter 정책 |

---

## 2. 아키텍처 상세 분석

### 2.1 Context Engineering 3계층 아키텍처

bkit-gemini의 핵심 아키텍처는 **Context Engineering** 개념에 기반한 3계층 구조이다.

| 계층 | 구성요소 | 수량 | 역할 |
|------|----------|------|------|
| **Domain Knowledge** | Skills | 29개 | 전문 지식을 on-demand로 제공 (Progressive Disclosure) |
| **Behavioral Rules** | Agents | 16개 | 역할 기반 행동 제약 (model, tools, temperature) |
| **State Management** | Hook Scripts + Lib | 17 + 25 | PDCA 상태 추적, 의도 감지, 권한 제어, 메모리 영속 |

### 2.2 agents/ 디렉토리 (16개 에이전트)

모든 에이전트는 Gemini CLI 네이티브 frontmatter 형식을 사용한다:
- `model`: 사용할 Gemini 모델 (gemini-3.1-pro / gemini-3-flash 등)
- `tools`: 허용 도구 목록
- `temperature`: 창의성 수준
- `max_turns`: 최대 대화 턴 수
- `timeout_mins`: 타임아웃 (분)

| 에이전트 | 카테고리 | 역할 | 모델 |
|----------|----------|------|------|
| `cto-lead` | 리더십 | CTO급 오케스트레이션, 팀 구성, 전략 방향 | gemini-3.1-pro |
| `frontend-architect` | 아키텍처 | UI/UX 설계, 컴포넌트 구조, 디자인 시스템 | gemini-3.1-pro |
| `security-architect` | 아키텍처 | 보안 취약점 분석, OWASP Top 10 | gemini-3.1-pro |
| `product-manager` | 관리 | 요구사항 분석, 기능 우선순위, 유저 스토리 | gemini-3.1-pro |
| `qa-strategist` | 품질 | 테스트 전략, 품질 메트릭 | gemini-3.1-pro |
| `gap-detector` | PDCA Check | 설계-구현 갭 분석 | gemini-3.1-pro |
| `pdca-iterator` | PDCA Act | Evaluator-Optimizer 패턴, 자동 개선 | gemini-3-flash |
| `code-analyzer` | 품질 | 코드 품질, 보안 스캔, 아키텍처 컴플라이언스 | gemini-3.1-pro |
| `report-generator` | PDCA Act | PDCA 완료 보고서 생성 | gemini-3-flash-lite |
| `design-validator` | PDCA Design | 설계 문서 완전성 검증 | gemini-3.1-pro |
| `qa-monitor` | 품질 | Docker 로그 모니터링, Zero Script QA | gemini-3-flash-lite |
| `starter-guide` | 온보딩 | 초보자 친화적 단계별 안내 | gemini-3-flash |
| `pipeline-guide` | 파이프라인 | 9단계 개발 파이프라인 안내 | gemini-3-flash |
| `bkend-expert` | 백엔드 | bkend.ai BaaS 통합 전문가 | gemini-3-flash |
| `enterprise-expert` | 아키텍처 | 엔터프라이즈 아키텍처, MSA | gemini-3.1-pro |
| `infra-architect` | 인프라 | AWS, K8s, Terraform 인프라 설계 | gemini-3.1-pro |

### 2.3 skills/ 디렉토리 (29개 스킬)

스킬은 **Progressive Disclosure** 방식으로 동작한다. 초기에는 메타데이터만 로드하고, 트리거 시 전체 지침을 주입한다.

| 카테고리 | 스킬 | 설명 |
|----------|------|------|
| **코어** | `pdca` | 8개 액션 (plan/design/do/analyze/iterate/report/status/next) |
| **프로젝트 레벨** | `starter`, `dynamic`, `enterprise` | 3단계 프로젝트 수준별 가이드 |
| **개발 파이프라인** | `phase-1-schema` ~ `phase-9-deployment` | 9단계 파이프라인 스킬 |
| **개발 파이프라인** | `development-pipeline` | 파이프라인 총괄 |
| **품질** | `code-review`, `zero-script-qa` | 코드 리뷰, 로그 기반 QA |
| **플랫폼** | `mobile-app`, `desktop-app` | 모바일/데스크톱 앱 개발 |
| **bkend.ai** | `bkend-quickstart` ~ `bkend-guides` (8개) | bkend.ai BaaS 도메인 스킬 |
| **유틸리티** | `bkit-templates`, `bkit-rules`, `gemini-cli-learning` | 템플릿, 규칙, 학습 |

각 SKILL.md는 YAML frontmatter에 다음 필드를 포함한다:
- `name`, `description`, `user-invocable`, `argument-hint`
- `allowed-tools`: 허용 도구 목록
- `imports`: 템플릿 파일 자동 임포트
- `agents`: 액션별 위임 에이전트 (예: analyze -> gap-detector)
- `context`, `memory`, `pdca-phase`
- `task-template`: 자동 태스크 생성 템플릿

### 2.4 hooks/ 디렉토리 (10-이벤트 Hook 시스템)

Gemini CLI의 전체 생명주기를 가로채는 10개 이벤트:

| # | 이벤트 | 스크립트 | 역할 |
|---|--------|----------|------|
| 1 | `SessionStart` | session-start.js | 세션 초기화, 프로젝트 레벨 감지, 출력 스타일 로드, 정책 TOML 자동 생성 |
| 2 | `BeforeAgent` | before-agent.js | 의도 감지, 8개 언어 트리거 매칭, 모호성 스코어링 |
| 3 | `BeforeModel` | before-model.js | PDCA 페이즈별 프롬프트 증강 |
| 4 | `AfterModel` | after-model.js | 응답 추적, 사용량 메트릭 |
| 5 | `BeforeToolSelection` | before-tool-selection.js | 페이즈 기반 도구 필터링 (plan -> readOnly) |
| 6 | `BeforeTool` | before-tool.js | 퍼미션 관리, 위험 명령 차단 (exit code 2) |
| 7 | `AfterTool` | after-tool.js | PDCA 페이즈 자동 전환, 스킬 후처리 |
| 8 | `AfterAgent` | after-agent.js | 정리, 루프 가드 (MAX_REENTRY=3) |
| 9 | `PreCompress` | pre-compress.js | 컨텍스트 포크 스냅샷 보존 |
| 10 | `SessionEnd` | session-end.js | 세션 정리, 메모리 영속화 |

**Dual-Mode 실행**: 6개 핫패스 hook은 SDK RuntimeHook 함수 모드(v0.31.0+)와 stdin command 모드를 동시 지원하여 40-97% 지연 시간을 줄인다.

추가 hook 스크립트:
- `hooks/scripts/skills/`: pdca-plan-post.js, pdca-design-post.js, pdca-analyze-post.js, pdca-iterate-post.js, pdca-report-post.js (5개 PDCA 스킬 후처리)
- `hooks/scripts/utils/`: memory-helper.js, pdca-state-updater.js (2개 유틸)

### 2.5 commands/ 디렉토리 (18개 TOML 커맨드)

Gemini CLI의 TOML 커맨드 형식을 사용하며, 3가지 고급 문법을 활용한다:
- `@{path}`: 파일 내용 인라인 삽입 (스킬/템플릿 로딩)
- `!{command}`: 셸 명령 실행 결과 삽입
- `{{args}}`: 사용자 인자 보간

| 커맨드 | 카테고리 | 문법 |
|--------|----------|------|
| `/bkit` | 헬프 | Static prompt |
| `/pdca <action>` | PDCA | @{path} + !{command} + {{args}} |
| `/review`, `/qa` | 품질 | @{path} |
| `/starter`, `/dynamic`, `/enterprise` | 프로젝트 초기화 | @{path} + {{args}} |
| `/pipeline`, `/learn` | 유틸리티 | @{path} + !{command} + {{args}} |
| `/github-stats` | 유틸리티 | Custom prompt |
| `/bkend-*` (8개) | bkend.ai | @{path} + {{args}} |

### 2.6 lib/ 디렉토리 (코어 라이브러리)

#### lib/adapters/gemini/ (8개 모듈 - Gemini CLI 플랫폼 어댑터)

| 모듈 | 역할 |
|------|------|
| `index.js` | GeminiAdapter 클래스 - 환경 감지, 경로 해석, 도구명 매핑, Hook I/O |
| `tool-registry.js` | 23개 도구명 중앙 레지스트리, Claude->Gemini 매핑, Forward Alias, Tool Annotations |
| `version-detector.js` | 3-전략 버전 감지 (env -> npm -> cli), 34개 기능 플래그, SemVer 검증 |
| `policy-migrator.js` | 퍼미션 -> TOML 정책 변환, 4-Tier 정책 시스템, 레벨별 정책 |
| `hook-adapter.js` | RuntimeHook SDK 통합, 실행 모드 감지, 마이그레이션 상태 |
| `tracker-bridge.js` | Task Tracker <-> PDCA 브릿지, 인스트럭션 기반 동기화 |
| `context-fork.js` | 컨텍스트 포크 스냅샷 격리, LRU(10) 캐시 |
| `import-resolver.js` | @import 해석 |

#### lib/core/ (8개 모듈)

| 모듈 | 역할 |
|------|------|
| `index.js` | 코어 모듈 진입점 |
| `config.js` | 설정 로딩/검증 |
| `memory.js` | 프로젝트 메모리 관리 (세션 카운트, 데이터 저장) |
| `agent-memory.js` | 에이전트별 영속 메모리 (project/user scope, 최대 20세션) |
| `permission.js` | Glob 패턴 퍼미션 엔진 (deny/ask/allow, 위험 명령 차단) |
| `file.js` | 파일 유틸리티 |
| `io.js` | I/O 유틸리티 |
| `debug.js` | 디버그 로깅 |
| `platform.js` | 플랫폼 감지 |

#### lib/intent/ (3개 모듈)

| 모듈 | 역할 |
|------|------|
| `trigger.js` | 8개 언어 트리거 매칭, 에이전트/스킬/새 기능 감지 |
| `language.js` | 다국어 트리거 패턴 정의 (EN/KO/JA/ZH/ES/FR/DE/IT) |
| `ambiguity.js` | 모호성 점수 계산 (임계값 50) |

#### lib/pdca/ (6개 모듈)

| 모듈 | 역할 |
|------|------|
| `index.js` | PDCA 모듈 진입점 |
| `status.js` | .pdca-status.json 관리 (v2.0 포맷, 루트/레거시 경로 자동 감지) |
| `phase.js` | PDCA 페이즈 전환 로직 |
| `level.js` | 프로젝트 레벨 감지 (Starter/Dynamic/Enterprise) |
| `automation.js` | 자동 반복/보고서 생성 (최대 5회 반복) |
| `tier.js` | 태스크 규모 분류 |

#### lib/task/ (6개 모듈)

| 모듈 | 역할 |
|------|------|
| `index.js` | 태스크 모듈 진입점 |
| `classification.js` | 태스크 크기 분류 (quickFix/minorChange/feature/majorFeature) |
| `context.js` | 태스크 컨텍스트 관리 |
| `creator.js` | 태스크 생성 |
| `dependency.js` | 의존성 관리 |
| `tracker.js` | 태스크 추적 |

#### 기타 lib/ 최상위

| 모듈 | 역할 |
|------|------|
| `skill-orchestrator.js` | 스킬 파싱/로딩/활성화/에이전트 위임/템플릿 자동 임포트 (708줄) |
| `context-hierarchy.js` | 4레벨 설정 병합 - Plugin->User->Project->Session (209줄, TTL 캐시) |
| `common.js` | 공통 유틸리티 |

### 2.7 mcp/ 디렉토리

`spawn-agent-server.js` (753줄) - MCP 서버로 6개 도구를 제공:

| MCP 도구 | 역할 |
|----------|------|
| `spawn_agent` | 서브 에이전트 실행 (16개 에이전트 레지스트리, child_process.spawn) |
| `team_create` | 에이전트 팀 생성 (이름 새니타이제이션, 경로 순회 방지) |
| `team_assign` | 팀 태스크 할당 |
| `team_status` | 팀 상태 모니터링 |
| `agent_list` | 에이전트 목록 조회 |
| `agent_info` | 에이전트 상세 정보 |

### 2.8 templates/ 디렉토리

| 카테고리 | 파일 | 역할 |
|----------|------|------|
| PDCA | plan.template.md, design.template.md, analysis.template.md, report.template.md | PDCA 각 페이즈 문서 템플릿 |
| 레벨별 | design-starter.template.md, design-enterprise.template.md | Starter/Enterprise 전용 디자인 |
| 파이프라인 | pipeline/phase-{1..9}*.template.md, zero-script-qa.template.md | 9단계 + QA 템플릿 |
| 공유 | shared/api-patterns.md, error-handling-patterns.md, naming-conventions.md | 공통 패턴 |
| 기타 | GEMINI.template.md, convention.template.md, do.template.md, schema.template.md | 유틸리티 템플릿 |

### 2.9 output-styles/ 디렉토리

| 스타일 | 대상 | 특징 |
|--------|------|------|
| `bkit-learning` | 초보자 (Starter) | 단계별 설명, 풍부한 맥락 |
| `bkit-pdca-guide` | 일반 개발 (Dynamic) | PDCA 워크플로우 가이드 |
| `bkit-enterprise` | 엔터프라이즈 팀 | 기술 아키텍처 중심 |
| `bkit-pdca-enterprise` | 엔터프라이즈 PDCA | 엔터프라이즈 + PDCA 결합 |

### 2.10 .gemini/ 디렉토리 (Gemini CLI 네이티브)

| 하위 경로 | 역할 |
|-----------|------|
| `context/` | @import 컨텍스트 모듈 6개 (commands, pdca-rules, agent-triggers, skill-triggers, tool-reference, feature-report) |
| `policies/` | 자동 생성 TOML 정책 (bkit-permissions.toml, bkit-starter-policy.toml) |
| `agent-memory/bkit/` | 16개 에이전트별 영속 메모리 JSON 파일 |

### 2.11 bkit-system/ 디렉토리

현재 비어 있다. 향후 시스템 설정 저장을 위한 예약 디렉토리로 추정된다.

---

## 3. Gemini CLI 연동 방식 분석

### 3.1 gemini-extension.json 구조

```json
{
  "name": "bkit",
  "version": "1.5.7",
  "description": "bkit Vibecoding Kit v1.5.7 - PDCA methodology + Context Engineering",
  "contextFileName": "GEMINI.md",
  "settings": [
    { "name": "Output Style", "envVar": "BKIT_OUTPUT_STYLE" },
    { "name": "Project Level", "envVar": "BKIT_PROJECT_LEVEL" }
  ]
}
```

Gemini CLI가 확장을 로드할 때의 흐름:
1. `gemini-extension.json`을 읽어 확장 메타데이터 파악
2. `contextFileName`으로 지정된 `GEMINI.md`를 시스템 프롬프트로 로드
3. `settings` 배열의 환경변수를 통해 사용자 설정 제공
4. `agents/` 디렉토리의 .md 파일을 에이전트로 등록
5. `skills/` 디렉토리의 SKILL.md를 스킬로 등록
6. `commands/` 디렉토리의 .toml 파일을 커스텀 커맨드로 등록
7. `hooks/hooks.json`의 이벤트 핸들러를 등록

### 3.2 GEMINI.md 시스템 프롬프트 구조

```
# 개요 + Core Rules (7개)
# Behavioral Guidelines
# Documentation Structure
# Important Notes
---
@.gemini/context/commands.md         # 42줄 - 커맨드 레퍼런스
@.gemini/context/pdca-rules.md       # 33줄 - PDCA 워크플로우 규칙
@.gemini/context/agent-triggers.md   # 23줄 - 8개 언어 에이전트 트리거
@.gemini/context/skill-triggers.md   # 29줄 - 스킬 자동 활성화 트리거
@.gemini/context/tool-reference.md   # 99줄 - 23개 도구 레퍼런스 + Annotations
@.gemini/context/feature-report.md   # 21줄 - 기능 사용 보고서 포맷
```

**핵심 설계**: @import 모듈화로 전체 시스템 프롬프트를 62줄로 압축하면서도, 필요한 모든 컨텍스트를 6개 모듈(총 약 247줄)로 분리 관리한다. 이를 통해 각 모듈을 독립적으로 업데이트할 수 있다.

### 3.3 Gemini CLI Extension 로딩 메커니즘 활용

| Gemini CLI 기능 | bkit 활용 방식 |
|-----------------|---------------|
| Agent frontmatter | 16개 에이전트에 model/tools/temperature/max_turns/timeout_mins 설정 |
| 10 Hook Events | 모든 10개 이벤트 등록, matcher 패턴으로 도구별 필터링 |
| @import syntax | GEMINI.md에서 6개 컨텍스트 모듈 임포트 |
| TOML commands | 18개 커맨드, `@{}`, `!{}`, `{{}}` 고급 문법 |
| Agent Skills (GA) | 29개 스킬, Progressive Disclosure |
| MCP servers | 6개 도구 (spawn-agent-server.js) |
| Extension settings | 2개 사용자 설정 (BKIT_OUTPUT_STYLE, BKIT_PROJECT_LEVEL) |
| `${extensionPath}` | hooks.json에서 이식 가능한 경로 |
| RuntimeHook SDK | 6개 핫패스 hook의 함수 모드 등록 (v0.31.0+) |
| Task Tracker | 6개 tracker 도구 등록 + PDCA 브릿지 (v0.32.0+) |
| Policy Engine | 4-Tier TOML 정책 자동 생성 (v0.30.0+) |
| Tool Annotations | 23개 도구의 readOnly/destructive/idempotent 힌트 (v0.31.0+) |

### 3.4 MCP 서버 연동

`mcp/spawn-agent-server.js`는 독립 MCP 서버로:
- 16개 에이전트 레지스트리 관리 (각 에이전트에 recommendedModel 설정)
- `spawn_agent` 도구로 서브 에이전트 실행 (child_process.spawn)
- 팀 모드 기초 (team_create, team_assign, team_status)
- 버전별 승인 모드 분기 (`--approval-mode=yolo` vs `--yolo`)
- 팀 이름 새니타이제이션 (경로 순회 방지)
- 서브 에이전트 타임아웃 캡 (600초) + SIGTERM->SIGKILL 에스컬레이션

### 3.5 버전 호환성 전략

bkit-gemini는 Gemini CLI v0.29.0~v0.32.1 범위를 지원하며, **Version Detector** 모듈이 핵심이다:

1. **3-전략 감지**: 환경변수 -> npm list -> gemini --version
2. **34개 기능 플래그**: 버전별 기능 사용 가능 여부 (v0.26.0+ ~ v0.32.0+)
3. **SemVer 검증**: 주입 방지를 위한 형식 검증 + 범위 제한 (< 2.0.0)
4. **Nightly 지원**: `0.34.0-nightly.20260304` 형식 파싱
5. **정상 저하 (Graceful Degradation)**: 기능 미지원 시 자동 폴백

기능 플래그 주요 항목:
- v0.26.0+: hasSkills
- v0.29.0+: hasPlanMode, hasHooks
- v0.30.0+: hasPolicyEngine
- v0.31.0+: hasRuntimeHookFunctions, hasBrowserAgent, hasToolAnnotations, hasProjectLevelPolicy
- v0.32.0+: hasTaskTracker, hasExtensionPolicies, hasModelFamilyToolsets, hasA2AStreaming

---

## 4. 전체 기능 현황 카탈로그

### 4.1 PDCA 워크플로우 (완전 구현)

| 기능 | 상태 | 구현 위치 |
|------|------|-----------|
| `/pdca plan` | 완전 구현 | commands/pdca.toml -> skills/pdca/SKILL.md -> templates/plan.template.md |
| `/pdca design` | 완전 구현 | commands/pdca.toml -> templates/design.template.md |
| `/pdca do` | 완전 구현 | commands/pdca.toml -> 구현 가이드 |
| `/pdca analyze` | 완전 구현 | commands/pdca.toml -> agents/gap-detector.md (위임) |
| `/pdca iterate` | 완전 구현 | commands/pdca.toml -> agents/pdca-iterator.md (위임) |
| `/pdca report` | 완전 구현 | commands/pdca.toml -> agents/report-generator.md (위임) |
| `/pdca status` | 완전 구현 | .pdca-status.json 읽기 |
| `/pdca next` | 완전 구현 | 현재 상태 기반 다음 단계 안내 |
| PDCA 자동 전환 | 완전 구현 | hooks/scripts/after-tool.js (write_file시 design->do 자동 전환) |
| Gap < 90% 자동 반복 | 완전 구현 | lib/pdca/automation.js (최대 5회) |
| PDCA 문서 아카이브 | 완전 구현 | /pdca archive |
| PDCA 상태 v2.0 | 완전 구현 | lib/pdca/status.js (루트/레거시 경로 자동 감지) |

### 4.2 에이전트 시스템 (완전 구현)

| 기능 | 상태 | 구현 위치 |
|------|------|-----------|
| 16개 에이전트 정의 | 완전 구현 | agents/*.md (Gemini frontmatter) |
| 8개 언어 자동 트리거 | 완전 구현 | .gemini/context/agent-triggers.md + lib/intent/ |
| 에이전트 메모리 영속 | 완전 구현 | lib/core/agent-memory.js -> .gemini/agent-memory/bkit/ (project/user scope) |
| MCP spawn_agent | 완전 구현 | mcp/spawn-agent-server.js |
| 팀 모드 기초 | 기초 구현 | team_create, team_assign, team_status (team.enabled: false) |
| AfterAgent 루프 가드 | 완전 구현 | MAX_REENTRY=3 (Issue #20426 대응) |
| 서브 에이전트 타임아웃 | 완전 구현 | 600초 + SIGTERM->SIGKILL 에스컬레이션 |

### 4.3 스킬 시스템 (완전 구현)

| 기능 | 상태 | 구현 위치 |
|------|------|-----------|
| 29개 스킬 정의 | 완전 구현 | skills/*/SKILL.md |
| Progressive Disclosure | 완전 구현 | 메타데이터만 초기 로드, 트리거 시 전체 로드 |
| Skill Orchestrator | 완전 구현 | lib/skill-orchestrator.js (커스텀 YAML 파서, 708줄) |
| 에이전트 위임 | 완전 구현 | SKILL.md의 `agents:` 필드 (예: analyze -> gap-detector) |
| 템플릿 자동 임포트 | 완전 구현 | SKILL.md의 `imports:` 필드 |
| 태스크 자동 생성 | 완전 구현 | SKILL.md의 `task-template:` 필드 |
| 스킬 트리거 매칭 | 완전 구현 | lib/intent/trigger.js |

### 4.4 Hook 시스템 (완전 구현)

| 기능 | 상태 | 구현 위치 |
|------|------|-----------|
| 10-이벤트 Hook 등록 | 완전 구현 | hooks/hooks.json |
| Matcher 패턴 필터링 | 완전 구현 | BeforeTool/AfterTool에 write_file, replace, run_shell_command, activate_skill |
| SDK RuntimeHook 듀얼 모드 | 완전 구현 | hooks/runtime-hooks.js + hook-adapter.js (6개 핫패스) |
| PDCA 스킬별 후처리 | 완전 구현 | hooks/scripts/skills/*.js (5개) |
| 컨텍스트 포크 보존 | 완전 구현 | hooks/scripts/pre-compress.js + context-fork.js |

### 4.5 Task Management (구현)

| 기능 | 상태 | 구현 위치 |
|------|------|-----------|
| 태스크 분류 | 완전 구현 | lib/task/classification.js (quickFix/minorChange/feature/majorFeature) |
| 태스크 추적 | 완전 구현 | lib/task/tracker.js |
| 의존성 관리 | 완전 구현 | lib/task/dependency.js |
| Task Tracker-PDCA 브릿지 | 완전 구현 | lib/adapters/gemini/tracker-bridge.js (인스트럭션 기반, v0.32.0+) |
| 23개 도구 레지스트리 | 완전 구현 | lib/adapters/gemini/tool-registry.js + Tool Annotations |

### 4.6 권한 및 보안 시스템

| 기능 | 상태 | 구현 위치 |
|------|------|-----------|
| Glob 패턴 퍼미션 | 완전 구현 | lib/core/permission.js (deny/ask/allow 3단계) |
| 4-Tier TOML 정책 | 완전 구현 | policy-migrator.js (Default/Extension/Workspace/Admin) |
| 위험 명령 차단 | 완전 구현 | before-tool.js (역방향 셸, 파이프 RCE, 민감 파일, rm -rf) |
| SemVer 검증 | 완전 구현 | version-detector.js (주입 방지, < 2.0.0 범위 제한) |
| TOML 인젝션 방지 | 완전 구현 | escapeTomlString(), validateTomlStructure() |
| 팀 이름 새니타이제이션 | 완전 구현 | spawn-agent-server.js (영숫자, 하이픈, 밑줄만 허용) |
| 민감 파일 보호 | 완전 구현 | permission.js (.env, .key, .pem 쓰기 차단) |

### 4.7 다국어 지원

| 기능 | 상태 | 설명 |
|------|------|------|
| 8개 언어 지원 | 완전 구현 | EN, KO, JA, ZH, ES, FR, DE, IT |
| 에이전트 트리거 매칭 | 완전 구현 | lib/intent/language.js + trigger.js |
| 스킬 트리거 매칭 | 완전 구현 | .gemini/context/skill-triggers.md |
| 새 기능 감지 패턴 | 부분 구현 | EN, KO, JA, ZH (4개 언어만, ES/FR/DE/IT 미구현) |

### 4.8 컨텍스트 관리

| 기능 | 상태 | 구현 위치 |
|------|------|-----------|
| @import 모듈화 | 완전 구현 | GEMINI.md -> 6개 .gemini/context/ 모듈 |
| 4레벨 설정 병합 | 완전 구현 | lib/context-hierarchy.js (Plugin->User->Project->Session) |
| 컨텍스트 포크 | 완전 구현 | lib/adapters/gemini/context-fork.js (LRU 10, 스냅샷 격리) |
| @import 해석 | 완전 구현 | lib/adapters/gemini/import-resolver.js |
| 출력 스타일 시스템 | 완전 구현 | output-styles/ (4개 스타일, 레벨별 자동 선택) |

### 4.9 테스트 현황

| 테스트 스위트 | ID | 대상 |
|---------------|-----|------|
| Hook 시스템 | TC-01 | hooks.json 구조, 10 이벤트 등록 |
| 스킬 시스템 | TC-02 | 29개 SKILL.md, frontmatter 파싱 |
| 에이전트 시스템 | TC-03 | 16개 에이전트, frontmatter 검증 |
| Lib 모듈 | TC-04 | 코어 라이브러리 (config, memory, permission) |
| MCP | TC-05 | spawn-agent-server 도구 |
| 커맨드 | TC-06 | 18개 TOML 커맨드 |
| 설정 | TC-07 | bkit.config.json 검증 |
| 컨텍스트 | TC-08 | @import, 컨텍스트 계층 |
| PDCA E2E | TC-09 | 전체 PDCA 워크플로우 |
| 철학 | TC-10 | Context Engineering 원칙 준수 |
| 출력 스타일 | TC-11 | 4개 출력 스타일 |
| 에이전트 메모리 | TC-12 | 영속 메모리 |
| 자동화 | TC-13 | PDCA 자동화 |
| bkend 스킬 | TC-14 | 8개 bkend.ai 스킬 |
| 기능 리포트 | TC-15 | 기능 사용 보고서 |
| v0.30 Phase 1 | TC-16 | 정책 엔진 |
| v0.30 Phase 2 | TC-17 | 도구 레지스트리 |
| v0.31 기능 | TC-18 | Tool Annotations, 기능 플래그 |
| v0.31 정책/훅 | TC-19 | 레벨 정책, 훅 어댑터 |
| 커버리지 갭 | TC-20 | lib/pdca, lib/intent 커버리지 |
| v0.32 마이그레이션 | TC-21 | Task Tracker, Extension Policy |
| PDCA 상태 경로 | TC-22 | 루트/레거시 경로 |
| Tracker 브릿지 | TC-23 | PDCA-Tracker 동기화 |
| 런타임 훅 | TC-24 | SDK 듀얼 모드 |

---

## 5. 강점 및 특화 기능

### 5.1 아키텍처적 강점

1. **Context Engineering 실용적 구현**: 단순 프롬프트 엔지니어링을 넘어, 도메인 지식(Skills) + 행동 규칙(Agents) + 상태 관리(Hooks+Lib)의 3계층으로 체계화된 컨텍스트 관리 시스템. 이는 LLM 추론 최적화를 위한 시스템 수준의 접근이다.

2. **Progressive Disclosure**: 29개 스킬의 메타데이터만 초기 로드하여 컨텍스트 토큰을 절약하고, 필요 시에만 전체 내용을 주입한다. 이를 통해 대규모 지식 베이스를 효율적으로 관리한다.

3. **10-이벤트 Hook 시스템**: Gemini CLI의 전체 생명주기(세션 시작 -> 에이전트 -> 모델 -> 도구 선택 -> 도구 실행 -> 에이전트 완료 -> 압축 -> 세션 종료)를 가로채는 포괄적 자동화를 CLI 소스 수정 없이 달성한다.

4. **Evaluator-Optimizer 패턴**: Anthropic의 에이전트 아키텍처를 차용하여, gap-detector(평가자)가 갭을 발견하면 pdca-iterator(최적화기)가 자동으로 개선을 반복하는 구조를 구현한다.

5. **플랫폼 어댑터 패턴**: `lib/adapters/` 아래에 Gemini CLI 전용 어댑터를 분리하여, 향후 다른 AI CLI 플랫폼으로의 확장을 구조적으로 지원한다. `platform-interface.js`가 공통 인터페이스를 정의한다.

### 5.2 Gemini CLI 특화 기능

1. **SDK RuntimeHook 듀얼 모드**: v0.31.0+에서 함수 모드로 40-97% 지연 감소를 달성하면서, 이전 버전은 command 모드로 자동 폴백한다. `runtime-hooks.js`가 SDK 등록을, `hook-adapter.js`가 모드 감지를 담당한다.

2. **4-Tier TOML Policy Engine**: Default(기본) -> Extension(확장, Tier 2) -> Workspace(프로젝트, Tier 3) -> Admin(관리자) 4단계 정책으로, Gemini CLI의 Policy Engine을 최대한 활용한다. 프로젝트 레벨(Starter/Dynamic/Enterprise)별 자동 정책 생성을 포함한다.

3. **Task Tracker-PDCA Bridge**: Gemini CLI v0.32.0+ Task Tracker를 PDCA 워크플로우와 **인스트럭션 기반**으로 연결한다. PDCA가 소스 오브 트루스(source of truth)이며, Tracker로 단방향 동기화한다. 직접 API 호출이 아닌 컨텍스트 힌트 생성 방식이다.

4. **34개 기능 플래그 버전 감지**: Gemini CLI 버전별 기능 자동 감지를 통해 v0.26.0부터 v0.32.1까지 6개 버전 마일스톤의 기능을 안전하게 활용한다.

5. **23개 도구 레지스트리**: Claude Code -> Gemini CLI 도구명 양방향 매핑, Forward Alias(미래 도구명 변경 대비), Legacy Alias(과거 호환), Tool Annotations(readOnly/destructive/idempotent 힌트)를 포함한다.

6. **TOML 커맨드 고급 문법**: `@{path}`(파일 인라인), `!{command}`(셸 실행 삽입), `{{args}}`(인자 보간) 3가지 문법을 조합하여 18개 동적 커맨드를 구현한다.

### 5.3 개발 생산성 특화

1. **8개 언어 자동 트리거**: 사용자 입력에서 키워드를 감지하여 적절한 에이전트/스킬을 자동 활성화한다 (EN/KO/JA/ZH/ES/FR/DE/IT).

2. **9단계 개발 파이프라인**: 스키마 -> 컨벤션 -> 목업 -> API -> 디자인시스템 -> UI 통합 -> SEO/보안 -> 리뷰 -> 배포. 각 단계에 전용 스킬과 템플릿이 준비되어 있다.

3. **3단계 프로젝트 레벨 자동 감지**: kubernetes/ 디렉토리(Enterprise), docker-compose.yml(Dynamic), 기본(Starter)으로 자동 분류하여 맞춤형 가이드를 제공한다.

4. **bkend.ai 도메인 전문 스킬 8개**: quickstart, auth, data, storage, mcp, security, cookbook, guides로 BaaS 통합 개발을 전문적으로 지원한다.

5. **에이전트 메모리 영속**: 16개 에이전트의 세션 간 컨텍스트 유지. project scope(팀 공유)와 user scope(개인)를 분리하며, 에이전트당 최대 20세션을 보관한다.

---

## 6. 개선 기회 영역

### 6.1 구조적 개선

| 영역 | 현황 | 개선 기회 |
|------|------|-----------|
| `bkit-system/` 디렉토리 | 비어 있음 | 활용 계획이 없으면 제거하거나, 시스템 설정 통합 검토 |
| `.claude/` 디렉토리 | Claude Code 호환 잔재 (agent-memory, commands) | Gemini 전용 리포에서의 역할 재정의 또는 정리 필요 |
| `src/pdca-e2e.js` | E2E 테스트 1개만 src/에 위치 | tests/ 디렉토리로 통합 고려 |
| `.bkit/` vs `.gemini/` | 상태 저장이 두 디렉토리에 분산 | 단일 상태 디렉토리로 통합 가능성 검토 |
| 스냅샷 파일 누적 | .bkit/snapshots/, docs/.pdca-snapshots/ | 오래된 스냅샷 자동 정리 정책 도입 |

### 6.2 기능적 개선

| 영역 | 현황 | 개선 기회 |
|------|------|-----------|
| 팀 모드 | 기초 구현 (team.enabled: false) | 실제 활성화 및 멀티 에이전트 협업 고도화 |
| 새 기능 감지 패턴 | EN/KO/JA/ZH 4개 언어만 정규식 정의 | ES/FR/DE/IT 4개 언어 NEW_FEATURE_PATTERNS 추가 |
| Task Tracker 브릿지 | 인스트럭션 기반 (컨텍스트 힌트 생성) | 직접 API 호출 통합 가능성 탐색 |
| 테스트 자동화 | 24개 TC 스위트 (수동 실행) | CI/CD 파이프라인 통합, 자동 회귀 테스트 |
| 에이전트 모델 | gemini-3.1-pro / gemini-3-flash 고정 | 모델 업데이트 주기 자동화 또는 설정 외부화 |
| context-fork.js | LRU(10) 고정 | 프로젝트 규모에 따른 동적 크기 조정 |

### 6.3 문서화 개선

| 영역 | 현황 | 개선 기회 |
|------|------|-----------|
| API 문서 | README에 개요 수준 | lib/ 모듈별 API 레퍼런스 문서 (JSDoc 기반 자동 생성) |
| 아키텍처 문서 | README의 Component Map | 아키텍처 의사결정 기록(ADR) 추가 |
| 온보딩 가이드 | CONTRIBUTING.md | 신규 기여자를 위한 개발 환경 설정 가이드 강화 |
| 변경 이력 | CHANGELOG.md 수동 관리 | conventional-commits 기반 자동 생성 도구 도입 |

### 6.4 bkit-claude-code 대비 현황

bkit-gemini는 bkit-claude-code의 Gemini CLI 포크이며, 아래와 같이 분류된다.

**이미 포팅/구현된 기능 (bkit-claude-code 동등):**
- PDCA 전체 워크플로우 (Plan/Design/Do/Check/Act, 8개 액션)
- 16개 에이전트 시스템 (Gemini frontmatter로 재구현)
- 29개 스킬 시스템 (Progressive Disclosure)
- Hook 시스템 (Claude Code hooks -> Gemini CLI 10-이벤트)
- 도구명 매핑 (Claude -> Gemini, 23개 양방향)
- 퍼미션 시스템 (Glob 패턴 매칭)
- 컨텍스트 관리 (CLAUDE.md -> GEMINI.md @import 모듈화)
- 에이전트 메모리 영속
- 출력 스타일 시스템 (4개)
- 9단계 개발 파이프라인
- 3단계 프로젝트 레벨
- 8개 언어 지원
- Evaluator-Optimizer 패턴
- bkend.ai 도메인 스킬 8개
- MCP 에이전트 서버

**Gemini CLI 전용 확장 (bkit-claude-code에 없는 기능):**
- RuntimeHook SDK 듀얼 모드 (40-97% 지연 감소)
- 4-Tier TOML Policy Engine (Extension/Workspace/Admin 정책)
- Task Tracker-PDCA Bridge (v0.32.0+ 인스트럭션 기반)
- 34개 기능 플래그 버전 감지 (v0.26.0~v0.32.1)
- Extension Settings (envVar 기반 사용자 설정)
- TOML 커맨드 고급 문법 (@{path}, !{command}, {{args}})
- Tool Annotations (readOnly/destructive/idempotent 힌트)
- Extension Policy (Tier 2 TOML)
- Forward Alias Layer (미래 도구명 변경 대비)
- Nightly 버전 파싱
- `${extensionPath}` / `${workspacePath}` 변수 지원

**미구현 또는 축소된 영역:**
- 팀 모드: 기초만 구현 (enabled: false)
- 새 기능 감지: 4개 언어만 정규식 (8개 중 4개)
- CI/CD 통합: 미구현 (수동 테스트만)

---

## 부록: 주요 파일 경로 참조

| 파일 | 절대 경로 |
|------|-----------|
| 확장 매니페스트 | `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/gemini-extension.json` |
| 시스템 프롬프트 | `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/GEMINI.md` |
| 중앙 설정 | `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/bkit.config.json` |
| Hook 등록 | `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/hooks/hooks.json` |
| RuntimeHook SDK | `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/hooks/runtime-hooks.js` |
| 플랫폼 어댑터 | `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/lib/adapters/gemini/index.js` |
| 도구 레지스트리 | `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/lib/adapters/gemini/tool-registry.js` |
| 버전 감지 | `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/lib/adapters/gemini/version-detector.js` |
| 정책 변환 | `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/lib/adapters/gemini/policy-migrator.js` |
| Tracker 브릿지 | `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/lib/adapters/gemini/tracker-bridge.js` |
| 스킬 오케스트레이터 | `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/lib/skill-orchestrator.js` |
| 컨텍스트 계층 | `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/lib/context-hierarchy.js` |
| PDCA 상태 | `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/lib/pdca/status.js` |
| 퍼미션 엔진 | `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/lib/core/permission.js` |
| 에이전트 메모리 | `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/lib/core/agent-memory.js` |
| MCP 서버 | `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/mcp/spawn-agent-server.js` |
| 의도 감지 | `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/lib/intent/trigger.js` |

---

*분석 완료: 2026-03-11 | bkit-gemini v1.5.7*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
