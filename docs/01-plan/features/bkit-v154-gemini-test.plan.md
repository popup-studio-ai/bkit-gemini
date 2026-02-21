# Test Plan: bkit-gemini v1.5.4 - Comprehensive Extension Feature Test

> **Feature**: bkit-v154-gemini-test
> **Version**: bkit-gemini v1.5.4
> **Date**: 2026-02-21
> **Author**: CTO Team (AI-assisted)
> **Target Environment**: Gemini CLI v0.29.0+
> **Total Test Cases**: 120+
> **Priority**: P0 (Critical)

---

## 1. Overview

bkit-gemini v1.5.4 Extension의 모든 기능을 Gemini CLI 환경에서 실행하여 검증하는 종합 테스트 계획서입니다.

### 1.1 Test Scope

| Category | Count | Description |
|----------|:-----:|-------------|
| Agents | 16 | 전 에이전트 frontmatter, 트리거, 모델/온도 검증 |
| Skills | 29 | 전 스킬 활성화, 내용 로딩, 트리거 검증 |
| TOML Commands | 18 | 전 커맨드 파싱, 실행 확인 |
| Hook Events | 10 | 전 이벤트 등록, 스크립트 실행 검증 |
| Lib Modules | 8+ | Core 라이브러리 함수 검증 |
| MCP Server | 6 | MCP 도구 등록, 핸들러 검증 |
| Context Modules | 6 | Context Engineering 파일 로딩 검증 |
| v1.5.4 Features | 4 | 신규 기능 (Version Detector, Policy Migrator, Forward Aliases, Compatibility) |
| Output Styles | 4 | 출력 스타일 설정 및 적용 검증 |
| PDCA E2E | 8 | 전체 PDCA 사이클 End-to-End 검증 |
| Config | 5 | 설정 파일 일관성 검증 |
| Agent Memory | 3 | 세션 간 메모리 영속성 검증 |
| Automation | 6 | 8개 언어 자동 감지 + Intent Detection |

### 1.2 Test Environment

```
Runtime: Gemini CLI v0.29.0+ (tested: 0.29.0, 0.29.5, 0.30.0-preview.3)
Extension: bkit-gemini v1.5.4
OS: macOS / Linux / Windows (WSL)
Node.js: 18+ (for hook scripts)
```

### 1.3 Test Execution Method

이 테스트 계획서는 **Gemini CLI에서 직접 실행**하기 위해 설계되었습니다:
- 각 테스트 케이스는 Gemini CLI 프롬프트에 입력하는 명령어/메시지로 구성
- 검증 기준은 Gemini의 응답 내용으로 판단
- 자동화 테스트(`tests/run-all.js`)는 별도 보조 수단

---

## 2. Test Categories

### TC-01: Session Startup & Hook System (P0) - 18 Cases

세션 시작 시 bkit Extension이 올바르게 초기화되는지 검증합니다.

#### TC-01-01: SessionStart Hook 실행
```
[테스트 방법] Gemini CLI 새 세션 시작
[검증 기준]
- "bkit Vibecoding Kit v1.5.4 - Session Startup" 메시지 표시
- Previous Work Detected 섹션 표시 (기존 PDCA 상태 있을 경우)
- AskUserQuestion 호출 여부 확인
```

#### TC-01-02: SessionStart Hook 출력 내용 검증
```
[테스트 방법] 새 세션 시작 시 출력 내용 확인
[검증 기준]
- bkit version: v1.5.4 표시
- CTO-Led Agent Teams 섹션 존재
- Output Styles 섹션 존재
- Agent Memory 활성 상태 표시
- PDCA Core Rules 표시
- Auto-Trigger Keywords 테이블 표시
- Feature Usage Report 포맷 안내 표시
```

#### TC-01-03: BeforeAgent Hook (Intent Detection)
```
[테스트 방법] 사용자 메시지 입력 후 에이전트 호출 전 훅 실행 확인
[검증 기준]
- bkit-intent-detection 훅이 3000ms 내 실행
- 사용자 의도 감지 결과가 에이전트 선택에 반영
```

#### TC-01-04: BeforeModel Hook
```
[테스트 방법] 모델 호출 전 훅 실행 확인
[검증 기준]
- bkit-before-model 훅이 3000ms 내 실행
- 컨텍스트 주입 정상 동작
```

#### TC-01-05: AfterModel Hook
```
[테스트 방법] 모델 응답 후 훅 실행 확인
[검증 기준]
- bkit-after-model 훅이 3000ms 내 실행
```

#### TC-01-06: BeforeToolSelection Hook
```
[테스트 방법] 도구 선택 전 훅 실행 확인
[검증 기준]
- bkit-tool-filter 훅이 3000ms 내 실행
- 도구 필터링 정상 동작
```

#### TC-01-07: BeforeTool Hook - write_file
```
[테스트 방법] 파일 생성 요청 ("test.txt 파일 만들어줘")
[검증 기준]
- bkit-pre-write 훅 실행 (matcher: write_file|replace)
- 5000ms 내 완료
```

#### TC-01-08: BeforeTool Hook - replace
```
[테스트 방법] 파일 수정 요청 ("test.txt에서 hello를 world로 바꿔줘")
[검증 기준]
- bkit-pre-write 훅 실행 (matcher: write_file|replace)
- 5000ms 내 완료
```

#### TC-01-09: BeforeTool Hook - run_shell_command
```
[테스트 방법] 쉘 명령 요청 ("git status 실행해줘")
[검증 기준]
- bkit-pre-bash 훅 실행 (matcher: run_shell_command)
- 5000ms 내 완료
```

#### TC-01-10: AfterTool Hook - write_file
```
[테스트 방법] 파일 생성 완료 후 훅 실행 확인
[검증 기준]
- bkit-post-write 훅 실행 (matcher: write_file)
- 5000ms 내 완료
```

#### TC-01-11: AfterTool Hook - run_shell_command
```
[테스트 방법] 쉘 명령 완료 후 훅 실행 확인
[검증 기준]
- bkit-post-bash 훅 실행 (matcher: run_shell_command)
- 5000ms 내 완료
```

#### TC-01-12: AfterTool Hook - activate_skill
```
[테스트 방법] 스킬 활성화 후 훅 실행 확인 ("/pdca status" 입력)
[검증 기준]
- bkit-post-skill 훅 실행 (matcher: activate_skill)
- 5000ms 내 완료
```

#### TC-01-13: AfterAgent Hook
```
[테스트 방법] 에이전트 작업 완료 후 훅 실행 확인
[검증 기준]
- bkit-agent-cleanup 훅 실행
- 10000ms 내 완료
```

#### TC-01-14: PreCompress Hook
```
[테스트 방법] 긴 대화 진행하여 컨텍스트 압축 트리거
[검증 기준]
- bkit-context-save 훅 실행
- 5000ms 내 완료
- 컨텍스트 스냅샷 저장 확인
```

#### TC-01-15: SessionEnd Hook
```
[테스트 방법] Gemini CLI 세션 종료 (exit/quit)
[검증 기준]
- bkit-cleanup 훅 실행
- 10000ms 내 완료
- 리소스 정리 확인
```

#### TC-01-16: PDCA Post-Hooks (plan)
```
[테스트 방법] "/pdca plan test-feature" 실행
[검증 기준]
- pdca-plan-post.js 훅 실행
- .bkit-memory.json 업데이트 확인
- .pdca-status.json phase = "plan" 확인
```

#### TC-01-17: PDCA Post-Hooks (design)
```
[테스트 방법] "/pdca design test-feature" 실행
[검증 기준]
- pdca-design-post.js 훅 실행
- .bkit-memory.json 업데이트 확인
```

#### TC-01-18: hooks.json 구조 검증
```
[테스트 방법] hooks.json 파일 읽기
[검증 기준]
- 10개 이벤트 등록 확인: SessionStart, BeforeAgent, BeforeModel, AfterModel,
  BeforeToolSelection, BeforeTool(2), AfterTool(3), AfterAgent, PreCompress, SessionEnd
- 모든 스크립트 경로가 유효한 파일인지 확인
- description: "bkit Vibecoding Kit v1.5.4 - Gemini CLI Edition"
```

---

### TC-02: Skill System (P0) - 29 Cases

29개 스킬의 활성화, 내용 로딩, 트리거 키워드를 검증합니다.

#### TC-02-01 ~ TC-02-08: PDCA Skills
```
[테스트 방법] 각 PDCA 커맨드 실행

TC-02-01: "/pdca plan test-feature"
  → Plan 문서 생성 안내 또는 기존 문서 표시
TC-02-02: "/pdca design test-feature"
  → Design 문서 생성 (Plan 필요 시 안내)
TC-02-03: "/pdca do test-feature"
  → 구현 가이드 제공 (Design 필요 시 안내)
TC-02-04: "/pdca analyze test-feature"
  → Gap Analysis 실행 또는 구현 필요 안내
TC-02-05: "/pdca iterate test-feature"
  → 자동 개선 또는 Check 필요 안내
TC-02-06: "/pdca report test-feature"
  → 완료 보고서 생성 또는 Check 필요 안내
TC-02-07: "/pdca status"
  → 현재 PDCA 상태 표시 (phase, matchRate, feature name)
TC-02-08: "/pdca next"
  → 다음 단계 안내 및 추천 커맨드 표시
```

#### TC-02-09 ~ TC-02-11: Level Skills
```
TC-02-09: "/starter"
  → Starter 레벨 가이드 (HTML/CSS/JS, 정적 사이트)
  → SKILL.md 내용 로딩 확인
TC-02-10: "/dynamic"
  → Dynamic 레벨 가이드 (Next.js, bkend.ai BaaS)
  → init dynamic 초기화 안내 포함
TC-02-11: "/enterprise"
  → Enterprise 레벨 가이드 (Microservices, K8s, Terraform)
  → init enterprise 초기화 안내 포함
```

#### TC-02-12 ~ TC-02-20: Phase Skills (Development Pipeline)
```
TC-02-12: "/phase-1-schema" 또는 "스키마 정의해줘"
  → Phase 1 Schema 가이드 로딩
TC-02-13: "/phase-2-convention" 또는 "코딩 컨벤션 설정해줘"
  → Phase 2 Convention 가이드 로딩
TC-02-14: "/phase-3-mockup" 또는 "목업 만들어줘"
  → Phase 3 Mockup 가이드 로딩
TC-02-15: "/phase-4-api" 또는 "API 설계해줘"
  → Phase 4 API 가이드 로딩
TC-02-16: "/phase-5-design-system" 또는 "디자인 시스템 만들어줘"
  → Phase 5 Design System 가이드 로딩
TC-02-17: "/phase-6-ui-integration" 또는 "UI 구현해줘"
  → Phase 6 UI Integration 가이드 로딩
TC-02-18: "/phase-7-seo-security" 또는 "SEO 최적화해줘"
  → Phase 7 SEO/Security 가이드 로딩
TC-02-19: "/phase-8-review" 또는 "코드 리뷰해줘"
  → Phase 8 Review 가이드 로딩
TC-02-20: "/phase-9-deployment" 또는 "배포해줘"
  → Phase 9 Deployment 가이드 로딩
```

#### TC-02-21 ~ TC-02-24: Utility Skills
```
TC-02-21: "/code-review"
  → 코드 리뷰 스킬 활성화, 품질 분석 시작
TC-02-22: "/zero-script-qa"
  → Zero Script QA 방법론 가이드
TC-02-23: "/development-pipeline" 또는 "뭐부터 시작해야해?"
  → 9-phase 파이프라인 가이드
TC-02-24: "/bkit"
  → 전체 bkit 기능 목록 표시
```

#### TC-02-25 ~ TC-02-29: Platform Skills
```
TC-02-25: "/mobile-app" 또는 "모바일 앱 만들어줘"
  → Mobile App 가이드 (React Native, Flutter, Expo)
TC-02-26: "/desktop-app" 또는 "데스크톱 앱 만들어줘"
  → Desktop App 가이드 (Electron, Tauri)
TC-02-27: "learn" 또는 "/learn"
  → Gemini CLI 학습 가이드
TC-02-28: "/bkit-templates"
  → PDCA 문서 템플릿 로딩
TC-02-29: "/bkit-rules"
  → bkit 핵심 규칙 표시 (PDCA, 레벨 감지, 코드 품질)
```

#### Skill System 공통 검증 기준
```
[공통 검증]
- 각 스킬의 SKILL.md 파일이 존재하고 읽기 가능
- activate_skill 도구를 통해 정상 로딩
- 스킬 내용이 응답에 반영
- AfterTool(activate_skill) 훅 정상 실행
```

---

### TC-03: Agent System (P0) - 32 Cases

16개 에이전트의 frontmatter, 모델, 온도, 도구, 트리거를 검증합니다.

#### TC-03-01 ~ TC-03-09: Pro Model Agents

| TC | Agent | Model | Temp | 트리거 테스트 메시지 |
|:---:|-------|-------|:----:|---------------------|
| 01 | cto-lead | gemini-3-pro | 0.4 | "팀 구성해서 프로젝트 진행해줘" |
| 02 | code-analyzer | gemini-3-pro | 0.3 | "코드 품질 분석해줘" |
| 03 | design-validator | gemini-3-pro | 0.2 | "설계 문서 검증해줘" |
| 04 | enterprise-expert | gemini-3-pro | 0.3 | "마이크로서비스 아키텍처 설계해줘" |
| 05 | frontend-architect | gemini-3-pro | 0.4 | "프론트엔드 아키텍처 설계해줘" |
| 06 | gap-detector | gemini-3-pro | 0.2 | "설계-구현 갭 분석해줘" |
| 07 | infra-architect | gemini-3-pro | 0.3 | "AWS 인프라 설계해줘" |
| 08 | qa-strategist | gemini-3-pro | 0.3 | "테스트 전략 수립해줘" |
| 09 | security-architect | gemini-3-pro | 0.2 | "보안 취약점 분석해줘" |

#### TC-03-10 ~ TC-03-16: Flash Model Agents

| TC | Agent | Model | Temp | 트리거 테스트 메시지 |
|:---:|-------|-------|:----:|---------------------|
| 10 | bkend-expert | gemini-3-flash | 0.4 | "bkend.ai로 로그인 구현해줘" |
| 11 | pdca-iterator | gemini-3-flash | 0.4 | "자동으로 개선해줘" |
| 12 | pipeline-guide | gemini-3-flash | 0.4 | "뭐부터 시작하면 돼?" |
| 13 | product-manager | gemini-3-flash | 0.6 | "요구사항 정의해줘" |
| 14 | qa-monitor | gemini-3-flash | 0.3 | "docker logs 분석해줘" |
| 15 | report-generator | gemini-3-flash | 0.6 | "완료 보고서 생성해줘" |
| 16 | starter-guide | gemini-3-flash | 0.8 | "초보자인데 도와줘" |

#### TC-03-17 ~ TC-03-32: Agent Frontmatter 검증

각 에이전트 .md 파일의 frontmatter 검증:

```
[검증 기준] (에이전트당 1 case)
TC-03-17~32: agents/{name}.md 파일 읽기
- model 필드 존재 및 값 확인 (gemini-3-pro 또는 gemini-3-flash)
- temperature 필드 존재 및 값 확인
- tools 배열 존재 및 유효한 도구명 확인
- description 필드 존재
- agentGreeting 필드 존재 (선택)
```

#### Agent 공통 검증 기준
```
[공통 검증]
- 트리거 키워드 입력 시 해당 에이전트 활성화
- 8개 언어 키워드 지원 확인 (EN, KO, JA, ZH, ES, FR, DE, IT)
- 에이전트 응답에 관련 전문 지식 반영
- 에이전트 메모리 저장/로드 (Agent Memory 활성 시)
```

---

### TC-04: TOML Commands (P1) - 18 Cases

18개 TOML 커맨드 파일의 파싱 및 실행을 검증합니다.

#### TC-04-01 ~ TC-04-18: 커맨드 파일 검증

| TC | File | Command | 검증 |
|:---:|------|---------|------|
| 01 | pdca.toml | /pdca | TOML 파싱 성공, 스킬 연결 |
| 02 | starter.toml | /starter | TOML 파싱 성공, 스킬 연결 |
| 03 | dynamic.toml | /dynamic | TOML 파싱 성공, 스킬 연결 |
| 04 | enterprise.toml | /enterprise | TOML 파싱 성공, 스킬 연결 |
| 05 | pipeline.toml | /development-pipeline | TOML 파싱 성공, 스킬 연결 |
| 06 | review.toml | /code-review | TOML 파싱 성공, 스킬 연결 |
| 07 | qa.toml | /zero-script-qa | TOML 파싱 성공, 스킬 연결 |
| 08 | learn.toml | /learn | TOML 파싱 성공, 스킬 연결 |
| 09 | bkit.toml | /bkit | TOML 파싱 성공, 스킬 연결 |
| 10 | bkend-quickstart.toml | /bkend-quickstart | TOML 파싱 성공, 스킬 연결 |
| 11 | bkend-auth.toml | /bkend-auth | TOML 파싱 성공, 스킬 연결 |
| 12 | bkend-data.toml | /bkend-data | TOML 파싱 성공, 스킬 연결 |
| 13 | bkend-storage.toml | /bkend-storage | TOML 파싱 성공, 스킬 연결 |
| 14 | bkend-mcp.toml | /bkend-mcp | TOML 파싱 성공, 스킬 연결 |
| 15 | bkend-cookbook.toml | /bkend-cookbook | TOML 파싱 성공, 스킬 연결 |
| 16 | bkend-guides.toml | /bkend-guides | TOML 파싱 성공, 스킬 연결 |
| 17 | bkend-security.toml | /bkend-security | TOML 파싱 성공, 스킬 연결 |
| 18 | github-stats.toml | /github-stats | TOML 파싱 성공, 스킬 연결 |

```
[공통 검증 기준]
- commands/ 디렉토리에 .toml 파일 존재
- TOML 구문 오류 없이 파싱
- name, description 필드 존재
- skill 연결 (activate_skill) 동작
- Gemini CLI에서 해당 커맨드 인식
```

---

### TC-05: Lib Modules (P0) - 22 Cases

Core 라이브러리 모듈의 기능을 검증합니다.

#### TC-05-01 ~ TC-05-06: Tool Registry (`lib/adapters/gemini/tool-registry.js`)
```
TC-05-01: resolveToolName() - 기본 도구명 반환
  [입력] "write_file"
  [기대] "write_file" (변환 없음)

TC-05-02: resolveToolName() - Legacy 이름 변환
  [입력] "skill" (BKIT_LEGACY_NAMES 매핑)
  [기대] "activate_skill"

TC-05-03: resolveToolName() - Forward Alias 변환
  [입력] "edit_file" (FORWARD_ALIASES 매핑)
  [기대] "replace"

TC-05-04: FORWARD_ALIASES 매핑 검증
  [검증] 5개 매핑 존재:
  - edit_file -> replace
  - find_files -> glob
  - find_in_file -> grep_search
  - web_search -> google_web_search
  - read_files -> read_many_files

TC-05-05: REVERSE_FORWARD_ALIASES 역매핑 검증
  [검증] 5개 역매핑 존재:
  - replace -> edit_file
  - glob -> find_files
  - grep_search -> find_in_file
  - google_web_search -> web_search
  - read_many_files -> read_files

TC-05-06: getVersionedToolName() 스텁 검증
  [검증] 함수 존재, 현재는 동일 이름 반환
```

#### TC-05-07 ~ TC-05-11: Version Detector (`lib/adapters/gemini/version-detector.js`)
```
TC-05-07: detectVersion() - 환경변수 전략
  [설정] GEMINI_CLI_VERSION=0.30.0
  [기대] { major: 0, minor: 30, patch: 0 }

TC-05-08: parseVersion() - semver 파싱
  [입력] "0.29.5"
  [기대] { major: 0, minor: 29, patch: 5, preview: null }

TC-05-09: parseVersion() - preview 버전 파싱
  [입력] "0.30.0-preview.3"
  [기대] { major: 0, minor: 30, patch: 0, preview: 3 }

TC-05-10: isVersionAtLeast() - 버전 비교
  [입력] detected=0.30.0, target=0.29.0
  [기대] true

TC-05-11: getFeatureFlags() - 7개 플래그 검증
  [검증] hasPlanMode, hasPolicyEngine, hasExcludeToolsDeprecated,
         hasGemini3Default, hasSkillsStable, hasExtensionRegistry, hasSDK
  [기대] v0.29.0: hasPlanMode=true, hasPolicyEngine=false
         v0.30.0: hasPolicyEngine=true
```

#### TC-05-12 ~ TC-05-16: Policy Migrator (`lib/adapters/gemini/policy-migrator.js`)
```
TC-05-12: parsePermissionKey() - 기본 파싱
  [입력] "run_shell_command(rm -rf*)"
  [기대] { tool: "run_shell_command", pattern: "rm -rf" }

TC-05-13: mapDecision() - 결정 매핑
  [입력] "ask"
  [기대] "ask_user"
  [입력] "allow"
  [기대] "allow"

TC-05-14: getPriority() - 우선순위 검증
  [입력] "deny" -> 100, "ask_user" -> 50, "allow" -> 10

TC-05-15: convertToToml() - TOML 변환
  [입력] bkit.config.json permissions 객체
  [기대] 유효한 TOML 문자열 출력 (그룹별 정렬)

TC-05-16: hasPolicyFiles() - 정책 파일 감지
  [검증] .gemini/policies/*.toml 존재 여부 정확히 감지
```

#### TC-05-17 ~ TC-05-19: Permission Manager (`lib/core/permission.js`)
```
TC-05-17: loadPermissionConfig() - 기본 설정 로딩
  [검증] bkit.config.json에서 permissions 섹션 정상 로딩

TC-05-18: checkPermission() - 허용/거부 판정
  [입력] tool="write_file" -> "allow"
  [입력] tool="run_shell_command", args="rm -rf /" -> "deny"

TC-05-19: Policy Engine Fallback
  [조건] .gemini/policies/*.toml 파일 존재 시
  [기대] policyEngineActive=true, 모든 권한 체크 ALLOW + 'Deferred to Policy Engine'
```

#### TC-05-20 ~ TC-05-22: GeminiAdapter (`lib/adapters/gemini/index.js`)
```
TC-05-20: Adapter 버전 검증
  [검증] _version = '1.5.4'

TC-05-21: getCliVersion() 메서드
  [검증] 함수 존재, version-detector 연동

TC-05-22: getFeatureFlags() 메서드
  [검증] 함수 존재, 7개 플래그 반환
```

---

### TC-06: MCP Server (P1) - 8 Cases

MCP (Model Context Protocol) 서버 및 도구를 검증합니다.

#### TC-06-01: MCP Server 초기화
```
[테스트 방법] mcp/spawn-agent-server.js 실행 확인
[검증 기준]
- Server version: '1.1.0'
- 정상 초기화 (handleInitialize 호출)
```

#### TC-06-02 ~ TC-06-07: MCP 도구 등록 검증
```
TC-06-02: bkit_pdca_status 도구
  [검증] PDCA 상태 조회 기능 동작

TC-06-03: bkit_pdca_next 도구
  [검증] 다음 PDCA 단계 안내 기능 동작

TC-06-04: bkit_level_detect 도구
  [검증] 프로젝트 레벨 감지 기능 동작

TC-06-05: bkit_context_inject 도구
  [검증] 컨텍스트 주입 기능 동작

TC-06-06: bkit_memory_read 도구
  [검증] 에이전트 메모리 읽기 기능 동작

TC-06-07: bkit_memory_write 도구
  [검증] 에이전트 메모리 쓰기 기능 동작
```

#### TC-06-08: MCP Server 에러 핸들링
```
[테스트 방법] 잘못된 도구 호출
[검증 기준] 적절한 에러 메시지 반환, 서버 크래시 없음
```

---

### TC-07: Configuration (P1) - 12 Cases

설정 파일 간 일관성 및 유효성을 검증합니다.

#### TC-07-01: 버전 일관성 검증
```
[검증 대상]
- bkit.config.json: version = "1.5.4"
- gemini-extension.json: version = "1.5.4"
- hooks/hooks.json: description contains "v1.5.4"
- GEMINI.md: header contains "v1.5.4"
- lib/adapters/gemini/index.js: _version = '1.5.4'
- hooks/scripts/session-start.js: 4곳 version = '1.5.4'
- mcp/spawn-agent-server.js: server version = '1.1.0'
[기대] 모든 버전 참조가 일관성 있게 1.5.4
```

#### TC-07-02: gemini-extension.json 구조 검증
```
[검증 기준]
- name: "bkit"
- version: "1.5.4"
- contextFileName: "GEMINI.md"
- excludeTools 필드 없음 (v1.5.4에서 제거)
- settings 배열에 Output Style, Project Level 존재
```

#### TC-07-03: bkit.config.json 구조 검증
```
[검증 기준]
- version: "1.5.4"
- platform: "gemini"
- pdca 섹션: matchRateThreshold=90, maxIterations=5
- permissions 섹션: 8개 규칙 존재
- compatibility 섹션: minGeminiCliVersion="0.29.0"
- outputStyles 섹션: 4개 스타일 available
- agentMemory 섹션: enabled=true
- team 섹션 존재
- automation 섹션: supportedLanguages 8개
```

#### TC-07-04: bkit.config.json compatibility 섹션 (v1.5.4 신규)
```
[검증 기준]
- minGeminiCliVersion: "0.29.0"
- testedVersions: ["0.29.0", "0.29.5", "0.30.0-preview.3"]
- policyEngine.autoGenerate: true
- policyEngine.outputDir: ".gemini/policies/"
```

#### TC-07-05: GEMINI.md Context File 검증
```
[검증 기준]
- 헤더: "bkit Vibecoding Kit v1.5.4 - Gemini CLI Edition"
- 6개 @import 참조 존재:
  - @.gemini/context/commands.md
  - @.gemini/context/pdca-rules.md
  - @.gemini/context/agent-triggers.md
  - @.gemini/context/skill-triggers.md
  - @.gemini/context/tool-reference.md
  - @.gemini/context/feature-report.md
- 29 Skills, 16 Agents 숫자 정확
```

#### TC-07-06: permissions 설정 검증
```
[검증 기준]
- write_file: "allow"
- replace: "allow"
- read_file: "allow"
- run_shell_command: "allow"
- run_shell_command(rm -rf*): "deny"
- run_shell_command(rm -r*): "ask"
- run_shell_command(git push --force*): "deny"
- run_shell_command(git reset --hard*): "ask"
```

#### TC-07-07: outputStyles 설정 검증
```
[검증 기준]
- default: "bkit-pdca-guide"
- levelDefaults.Starter: "bkit-learning"
- levelDefaults.Dynamic: "bkit-pdca-guide"
- levelDefaults.Enterprise: "bkit-enterprise"
- available: 4개 스타일
```

#### TC-07-08: agentMemory 설정 검증
```
[검증 기준]
- enabled: true
- projectScope: ".gemini/agent-memory/bkit/"
- userScope: "~/.gemini/agent-memory/bkit/"
- maxSessionsPerAgent: 20
- agentScopes.starter-guide: "user"
- agentScopes.pipeline-guide: "user"
- agentScopes.default: "project"
```

#### TC-07-09: team 설정 검증
```
[검증 기준]
- strategies.dynamic.maxAgents: 3
- strategies.enterprise.maxAgents: 5
- strategies.custom.maxAgents: 10
- stateDir: ".gemini/teams/"
```

#### TC-07-10: levelDetection 설정 검증
```
[검증 기준]
- enterprise.directories: ["kubernetes", "terraform", "k8s", "infra"]
- dynamic.directories: ["lib/bkend", "supabase", "api", "backend"]
- dynamic.packagePatterns: ["bkend", "@supabase", "firebase"]
- default: "Starter"
```

#### TC-07-11: templates 설정 검증
```
[검증 기준]
- directory: "templates"
- types: plan, design, analysis, report 4개 템플릿 참조
- levelVariants: starter, enterprise 변형 패턴
```

#### TC-07-12: automation 설정 검증
```
[검증 기준]
- intentDetection: true
- ambiguityThreshold: 50
- supportedLanguages: 8개 (en, ko, ja, zh, es, fr, de, it)
```

---

### TC-08: Context Engineering (P1) - 8 Cases

Context 모듈 로딩 및 내용을 검증합니다.

#### TC-08-01: commands.md 로딩
```
[검증 기준]
- PDCA Commands 테이블: 8개 커맨드
- Level Commands 테이블: 3개 (starter, dynamic, enterprise)
- bkend.ai Commands 테이블: 8개
- Utility Commands 테이블: 5개
- 총 커맨드 참조 수 = 테이블 행 수 일치
```

#### TC-08-02: pdca-rules.md 로딩
```
[검증 기준]
- Core Cycle: 6단계 규칙
- Behavioral Guidelines: 5개 규칙
- PDCA Phase Recommendations 테이블
- Automation Rules: 3개 규칙
```

#### TC-08-03: agent-triggers.md 로딩
```
[검증 기준]
- 16개 에이전트 트리거 행 존재
- 각 행에 Keywords, Agent, Action 3개 열
- 8개 언어 키워드 포함 (EN, KO, JA, ZH 최소)
```

#### TC-08-04: skill-triggers.md 로딩
```
[검증 기준]
- 28개 스킬 트리거 행 존재 (pdca 제외)
- 각 행에 Keywords, Skill, Description 3개 열
- 다국어 키워드 포함
```

#### TC-08-05: tool-reference.md 로딩
```
[검증 기준]
- Tool Name Reference 테이블: 17개 도구
- Tool Alias Reference (v1.5.4) 섹션 존재
- Forward Aliases 테이블: 5개 행
- 각 alias에 Current Name, Potential Future Name, Status 열
```

#### TC-08-06: feature-report.md 로딩
```
[검증 기준]
- Feature Usage Report Format 포맷 정의
- Used/Not Used/Recommended 3개 카테고리
- Features to Report 목록: PDCA Skill, Agents, Level Skills, Phase Skills, Utility Skills
```

#### TC-08-07: GEMINI.md @import 체인 검증
```
[테스트 방법] GEMINI.md 읽은 후 6개 @import 참조 파일 모두 존재 확인
[검증 기준]
- 6개 파일 모두 존재: commands.md, pdca-rules.md, agent-triggers.md,
  skill-triggers.md, tool-reference.md, feature-report.md
- 각 파일 크기 > 0 bytes
```

#### TC-08-08: Context Hierarchy 검증
```
[검증 기준]
- contextHierarchy.enabled: true
- levels: ["plugin", "user", "project", "session"] 4단계
- cacheTTL: 5000ms
```

---

### TC-09: v1.5.4 New Features (P0) - 12 Cases

v1.5.4에서 추가된 신규 기능을 검증합니다.

#### TC-09-01 ~ TC-09-04: Version Detection System
```
TC-09-01: version-detector.js 파일 존재 및 구조
  [검증] 154줄, 7개 함수 export

TC-09-02: 3-Strategy Fallback
  [검증] ENV -> npm list -> CLI --version 순서 감지

TC-09-03: 7 Feature Flags
  [검증] hasPlanMode, hasPolicyEngine, hasExcludeToolsDeprecated,
         hasGemini3Default, hasSkillsStable, hasExtensionRegistry, hasSDK

TC-09-04: Default Version Fallback
  [검증] 미감지 시 0.29.0 기본값
```

#### TC-09-05 ~ TC-09-08: Policy Engine Migration
```
TC-09-05: policy-migrator.js 파일 존재 및 구조
  [검증] 230줄, 6개 함수 export

TC-09-06: Permission -> TOML 변환 정확성
  [입력] bkit.config.json permissions
  [기대] 유효한 TOML 출력 (deny, ask_user, allow 그룹별)

TC-09-07: Policy File 자동 생성 (autoGenerate=true)
  [검증] .gemini/policies/ 디렉토리에 TOML 파일 생성 로직

TC-09-08: Policy Engine Bypass (permission.js)
  [검증] TOML 정책 파일 감지 시 bkit 권한 체크 우회
```

#### TC-09-09 ~ TC-09-10: Forward Alias Defense Layer
```
TC-09-09: 5개 Forward Alias 매핑 존재
  [검증] edit_file, find_files, find_in_file, web_search, read_files

TC-09-10: Forward Alias Resolution 동작
  [테스트] resolveToolName("edit_file") == "replace"
  [테스트] resolveToolName("find_files") == "glob"
```

#### TC-09-11 ~ TC-09-12: Compatibility Configuration
```
TC-09-11: Compatibility 섹션 존재
  [검증] bkit.config.json에 compatibility 키 존재

TC-09-12: Tested Versions 목록
  [검증] ["0.29.0", "0.29.5", "0.30.0-preview.3"]
```

---

### TC-10: PDCA End-to-End (P0) - 10 Cases

전체 PDCA 사이클을 End-to-End로 검증합니다.

#### TC-10-01: PDCA Plan Phase
```
[테스트 방법] "/pdca plan e2e-test-feature"
[검증 기준]
- docs/01-plan/features/e2e-test-feature.plan.md 생성
- .pdca-status.json에 feature 등록 (phase: "plan")
- Plan 템플릿 구조 준수
```

#### TC-10-02: PDCA Design Phase
```
[테스트 방법] "/pdca design e2e-test-feature"
[선행 조건] Plan 문서 존재
[검증 기준]
- docs/02-design/features/e2e-test-feature.design.md 생성
- .pdca-status.json phase = "design"
- Plan 내용 참조
```

#### TC-10-03: PDCA Do Phase
```
[테스트 방법] "/pdca do e2e-test-feature"
[선행 조건] Design 문서 존재
[검증 기준]
- 구현 가이드 제공
- 구현 순서 체크리스트 포함
- 키 파일/컴포넌트 목록 제공
```

#### TC-10-04: PDCA Analyze Phase
```
[테스트 방법] "/pdca analyze e2e-test-feature"
[선행 조건] 구현 코드 존재
[검증 기준]
- gap-detector 에이전트 호출
- docs/03-analysis/e2e-test-feature.analysis.md 생성
- Match Rate 계산
- .pdca-status.json phase = "check"
```

#### TC-10-05: PDCA Iterate Phase (matchRate < 90%)
```
[테스트 방법] "/pdca iterate e2e-test-feature"
[선행 조건] matchRate < 90%
[검증 기준]
- pdca-iterator 에이전트 호출
- 자동 코드 수정
- 재분석 실행
- 최대 5회 반복 제한
```

#### TC-10-06: PDCA Report Phase
```
[테스트 방법] "/pdca report e2e-test-feature"
[선행 조건] matchRate >= 90%
[검증 기준]
- report-generator 에이전트 호출
- docs/04-report/features/e2e-test-feature.report.md 생성
- .pdca-status.json phase = "completed"
```

#### TC-10-07: PDCA Archive Phase
```
[테스트 방법] "/pdca archive e2e-test-feature"
[선행 조건] phase = "completed"
[검증 기준]
- docs/archive/YYYY-MM/e2e-test-feature/ 디렉토리 생성
- 4개 문서 이동 (plan, design, analysis, report)
- .pdca-status.json phase = "archived"
```

#### TC-10-08: PDCA Archive with --summary
```
[테스트 방법] "/pdca archive e2e-test-feature --summary"
[검증 기준]
- 문서 이동 후 .pdca-status.json에 요약 보존
- summary 필드에 phase, matchRate, iterationCount, archivedAt, archivedTo 포함
```

#### TC-10-09: PDCA Cleanup
```
[테스트 방법] "/pdca cleanup"
[검증 기준]
- 아카이브된 feature 목록 표시
- 선택적 삭제 기능
- 활성 feature 보호
```

#### TC-10-10: PDCA Status & Next
```
[테스트 방법] "/pdca status" 및 "/pdca next"
[검증 기준]
- status: 현재 feature, phase, matchRate 표시
- next: 현재 phase 기반 다음 단계 안내
- 진행 시각화: [Plan] -> [Design] -> [Do] -> [Check] -> [Act]
```

---

### TC-11: Output Styles (P1) - 4 Cases

4개 출력 스타일의 설정 및 적용을 검증합니다.

#### TC-11-01: bkit-learning 스타일
```
[테스트 방법] BKIT_OUTPUT_STYLE=bkit-learning 설정 후 응답 확인
[검증 기준]
- Starter 레벨에 적합한 친절한 설명 톤
- 학습 친화적 포맷
```

#### TC-11-02: bkit-pdca-guide 스타일
```
[테스트 방법] BKIT_OUTPUT_STYLE=bkit-pdca-guide 설정 후 응답 확인
[검증 기준]
- PDCA phase 배지 표시
- Gap analysis 제안
- Next-phase 체크리스트
```

#### TC-11-03: bkit-enterprise 스타일
```
[테스트 방법] BKIT_OUTPUT_STYLE=bkit-enterprise 설정 후 응답 확인
[검증 기준]
- Enterprise 레벨에 적합한 기술적 톤
- 아키텍처 관점 포함
```

#### TC-11-04: bkit-pdca-enterprise 스타일
```
[테스트 방법] BKIT_OUTPUT_STYLE=bkit-pdca-enterprise 설정 후 응답 확인
[검증 기준]
- PDCA + Enterprise 결합 포맷
```

---

### TC-12: Agent Memory (P1) - 4 Cases

에이전트 메모리의 세션 간 영속성을 검증합니다.

#### TC-12-01: 프로젝트 스코프 메모리 저장
```
[테스트 방법] 에이전트 사용 후 메모리 저장 확인
[검증 기준]
- .gemini/agent-memory/bkit/{agent-name}/ 디렉토리에 파일 생성
- 세션 컨텍스트 정보 포함
```

#### TC-12-02: 프로젝트 스코프 메모리 로드
```
[테스트 방법] 새 세션에서 동일 에이전트 호출
[검증 기준]
- 이전 세션 메모리 자동 로드
- 연속성 있는 응답 제공
```

#### TC-12-03: 유저 스코프 메모리 (starter-guide, pipeline-guide)
```
[테스트 방법] starter-guide 또는 pipeline-guide 사용 후 확인
[검증 기준]
- ~/.gemini/agent-memory/bkit/ 디렉토리에 저장
- 프로젝트 간 공유 가능
```

#### TC-12-04: 세션 제한 (maxSessionsPerAgent=20)
```
[테스트 방법] 20회 이상 세션 기록 후 확인
[검증 기준]
- 오래된 세션 자동 정리
- 최근 20개 세션만 보존
```

---

### TC-13: Automation & Multi-language (P1) - 16 Cases

8개 언어 자동 감지 및 Intent Detection을 검증합니다.

#### TC-13-01 ~ TC-13-08: 언어별 Agent Trigger

| TC | Language | 테스트 입력 | 기대 에이전트 |
|:---:|---------|-----------|-------------|
| 01 | EN | "help me build a website" | starter-guide |
| 02 | KO | "코드 품질 분석해줘" | code-analyzer |
| 03 | JA | "セキュリティの脆弱性をチェックして" | security-architect |
| 04 | ZH | "帮我设计微服务架构" | enterprise-expert |
| 05 | ES | "necesito ayuda para empezar" | starter-guide |
| 06 | FR | "aide-moi a concevoir l'architecture" | frontend-architect |
| 07 | DE | "Hilfe bei der Infrastruktur" | infra-architect |
| 08 | IT | "aiutami con il database" | bkend-expert |

#### TC-13-09 ~ TC-13-14: 언어별 Skill Trigger

| TC | Language | 테스트 입력 | 기대 스킬 |
|:---:|---------|-----------|----------|
| 09 | EN | "I need to deploy to production" | phase-9-deployment |
| 10 | KO | "목업 만들어줘" | phase-3-mockup |
| 11 | JA | "APIを設計して" | phase-4-api |
| 12 | ZH | "我需要一个静态网站" | starter |
| 13 | ES | "necesito un sistema de diseno" | phase-5-design-system |
| 14 | FR | "revue de code s'il vous plait" | code-review |

#### TC-13-15: Intent Detection 정확도
```
[테스트 방법] 모호한 요청 입력 ("이거 좀 봐줘")
[검증 기준]
- ambiguityThreshold (50) 이상일 경우 AskUserQuestion 호출
- 명확한 의도 감지 시 적절한 에이전트/스킬 자동 선택
```

#### TC-13-16: Mixed Language 처리
```
[테스트 방법] 혼합 언어 입력 ("API 설계를 review해줘")
[검증 기준]
- 주요 언어 감지 및 적절한 응답
- 관련 에이전트/스킬 활성화
```

---

### TC-14: bkend.ai Integration Skills (P2) - 8 Cases

bkend.ai 플랫폼 관련 8개 스킬을 검증합니다.

#### TC-14-01: /bkend-quickstart
```
[테스트 방법] "/bkend-quickstart" 입력
[검증 기준] MCP 설정, 리소스 계층구조, 첫 프로젝트 생성 가이드
```

#### TC-14-02: /bkend-auth
```
[테스트 방법] "/bkend-auth" 또는 "로그인 구현해줘"
[검증 기준] 이메일/소셜 로그인, JWT, RBAC, RLS 가이드
```

#### TC-14-03: /bkend-data
```
[테스트 방법] "/bkend-data" 또는 "테이블 만들어줘"
[검증 기준] CRUD, 7개 컬럼 타입, 필터링, 페이지네이션 가이드
```

#### TC-14-04: /bkend-storage
```
[테스트 방법] "/bkend-storage" 또는 "파일 업로드 구현해줘"
[검증 기준] Presigned URL, 4개 가시성 레벨, CDN 가이드
```

#### TC-14-05: /bkend-mcp
```
[테스트 방법] "/bkend-mcp" 또는 "MCP 설정해줘"
[검증 기준] MCP 도구 설정, AI 통합 가이드
```

#### TC-14-06: /bkend-security
```
[테스트 방법] "/bkend-security" 또는 "RLS 정책 설정해줘"
[검증 기준] API Key, 암호화, Rate Limit, CORS 가이드
```

#### TC-14-07: /bkend-cookbook
```
[테스트 방법] "/bkend-cookbook" 또는 "투두 앱 만들어줘"
[검증 기준] 10개 단일 프로젝트 + 4개 풀 가이드 프로젝트 목록
```

#### TC-14-08: /bkend-guides
```
[테스트 방법] "/bkend-guides" 또는 "마이그레이션 가이드 보여줘"
[검증 기준] 운영 가이드, 트러블슈팅, 마이그레이션 가이드
```

---

### TC-15: Feature Usage Report (P1) - 3 Cases

모든 응답에 포함되어야 하는 Feature Usage Report를 검증합니다.

#### TC-15-01: Report 포함 여부
```
[테스트 방법] 아무 질문 후 응답 확인
[검증 기준]
- "bkit Feature Usage" 섹션 응답 끝에 포함
- Used / Not Used / Recommended 3개 카테고리 존재
```

#### TC-15-02: Report 정확성
```
[테스트 방법] "/pdca status" 실행 후 Report 확인
[검증 기준]
- Used: "PDCA Skill (/pdca status)" 포함
- Not Used: 사용되지 않은 주요 기능 언급
- Recommended: 현재 PDCA 단계 기반 추천
```

#### TC-15-03: Report 일관성
```
[테스트 방법] 여러 종류의 요청 후 각 Report 비교
[검증 기준]
- 동일한 포맷 유지
- 실제 사용 기능과 보고 내용 일치
```

---

## 3. Test Execution Matrix

### 3.1 Priority-based Execution Order

| Priority | Category | Cases | 누적 |
|:--------:|----------|:-----:|:----:|
| **P0** | TC-01 Hook System | 18 | 18 |
| **P0** | TC-02 Skill System | 29 | 47 |
| **P0** | TC-03 Agent System | 32 | 79 |
| **P0** | TC-05 Lib Modules | 22 | 101 |
| **P0** | TC-09 v1.5.4 Features | 12 | 113 |
| **P0** | TC-10 PDCA E2E | 10 | 123 |
| **P1** | TC-04 TOML Commands | 18 | 141 |
| **P1** | TC-06 MCP Server | 8 | 149 |
| **P1** | TC-07 Configuration | 12 | 161 |
| **P1** | TC-08 Context Engineering | 8 | 169 |
| **P1** | TC-11 Output Styles | 4 | 173 |
| **P1** | TC-12 Agent Memory | 4 | 177 |
| **P1** | TC-13 Automation | 16 | 193 |
| **P1** | TC-15 Feature Report | 3 | 196 |
| **P2** | TC-14 bkend.ai Skills | 8 | 204 |
| | **Total** | **204** | |

### 3.2 Gemini CLI Execution Guide

```bash
# 1. Extension 설치 확인
gemini --list-extensions

# 2. 새 세션 시작 (TC-01 자동 실행)
gemini

# 3. PDCA 기본 흐름 테스트 (TC-02, TC-10)
> /pdca status
> /pdca plan e2e-test-feature
> /pdca next

# 4. Agent Trigger 테스트 (TC-03)
> 코드 품질 분석해줘
> 보안 취약점 검사해줘
> 팀 구성해서 프로젝트 진행해줘

# 5. Skill Trigger 테스트 (TC-02)
> /starter
> /dynamic
> /enterprise
> /development-pipeline
> /code-review

# 6. 다국어 테스트 (TC-13)
> help me build a website
> APIを設計して
> 帮我设计微服务架构

# 7. bkend 스킬 테스트 (TC-14)
> /bkend-quickstart
> /bkend-auth
> /bkend-data

# 8. 버전/설정 확인 (TC-07)
> bkit.config.json의 version 확인해줘
> gemini-extension.json 확인해줘
```

---

## 4. Pass/Fail Criteria

### 4.1 Overall Pass Criteria

| Level | Criteria |
|-------|---------|
| **PASS** | P0 100% + P1 >= 90% + P2 >= 80% |
| **CONDITIONAL PASS** | P0 100% + P1 >= 80% |
| **FAIL** | P0 < 100% 또는 P1 < 80% |

### 4.2 Category-level Pass Criteria

| Category | Pass Threshold |
|----------|:--------------:|
| Hook System (TC-01) | 100% |
| Skill System (TC-02) | 100% |
| Agent System (TC-03) | 100% |
| Lib Modules (TC-05) | 100% |
| v1.5.4 Features (TC-09) | 100% |
| PDCA E2E (TC-10) | 100% |
| All P1 Categories | >= 90% |
| All P2 Categories | >= 80% |

---

## 5. Supplementary: Automated Test Mapping

기존 `tests/run-all.js` 자동화 테스트와의 매핑:

| Automated Suite | Gemini Test Category | Coverage |
|----------------|---------------------|:--------:|
| TC-01: Hook System (18) | TC-01 (18) | Full |
| TC-02: Skill System (9) | TC-02 (29) | Partial - Gemini adds 20 cases |
| TC-03: Agent System (4) | TC-03 (32) | Partial - Gemini adds 28 cases |
| TC-04: Lib Modules (19) | TC-05 (22) | Partial - Gemini adds 3 cases |
| TC-05: MCP Server (2) | TC-06 (8) | Partial - Gemini adds 6 cases |
| TC-06: TOML Commands (3) | TC-04 (18) | Partial - Gemini adds 15 cases |
| TC-07: Configuration (7) | TC-07 (12) | Partial - Gemini adds 5 cases |
| TC-08: Context Engineering (3) | TC-08 (8) | Partial - Gemini adds 5 cases |
| TC-09: PDCA E2E (3) | TC-10 (10) | Partial - Gemini adds 7 cases |
| TC-10: Philosophy (4) | TC-15 (3) | Mapped |
| - | TC-09 v1.5.4 (12) | **New** |
| - | TC-11 Output Styles (4) | **New** |
| - | TC-12 Agent Memory (4) | **New** |
| - | TC-13 Automation (16) | **New** |
| - | TC-14 bkend.ai (8) | **New** |
| **72 automated** | **204 total** | **+132 new** |

---

## 6. Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|:------:|:-----------:|------------|
| Gemini CLI 버전 불일치 | High | Medium | 3개 버전 호환성 테스트 매트릭스 |
| Hook 타임아웃 | Medium | Low | 각 훅에 적절한 timeout 설정 |
| Agent 트리거 오감지 | Medium | Medium | 8개 언어 키워드 매트릭스 검증 |
| Policy Engine 충돌 | High | Low | Fallback 메커니즘 (permission.js) |
| Context 압축 시 데이터 손실 | Medium | Low | PreCompress Hook으로 스냅샷 보존 |
| MCP 서버 응답 지연 | Low | Medium | timeout 설정 및 에러 핸들링 |

---

## 7. Dependencies

| Dependency | Version | Purpose |
|-----------|---------|---------|
| Gemini CLI | >= 0.29.0 | 테스트 실행 환경 |
| Node.js | >= 18 | Hook 스크립트 실행 |
| bkit-gemini Extension | 1.5.4 | 테스트 대상 |
| Git | any | 버전 관리 검증 |

---

## 8. Schedule

| Phase | Activity | Duration |
|-------|----------|:--------:|
| Phase 1 | P0 테스트 실행 (TC-01,02,03,05,09,10) | 1 session |
| Phase 2 | P1 테스트 실행 (TC-04,06,07,08,11,12,13,15) | 1 session |
| Phase 3 | P2 테스트 실행 (TC-14) | 1 session |
| Phase 4 | 결과 종합 및 보고서 작성 | 1 session |

---

*bkit Vibecoding Kit v1.5.4 - Comprehensive Extension Test Plan*
*Generated: 2026-02-21*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
