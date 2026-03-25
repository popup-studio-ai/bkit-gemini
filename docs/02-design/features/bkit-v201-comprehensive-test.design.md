# bkit v2.0.1 종합 테스트 설계서

> **Feature**: bkit-v201-comprehensive-test
> **Status**: Design
> **Date**: 2026-03-25
> **Author**: PDCA Design Agent
> **기반 문서**: bkit-v201-comprehensive-test.plan.md

---

## Executive Summary

| 항목 | 내용 |
|------|------|
| **Feature** | bkit-v201-comprehensive-test |
| **설계일** | 2026-03-25 |
| **테스트 스위트** | TC-101 ~ TC-110 (10개 신규, Sprint 7) |
| **예상 TC 수** | 114개 |
| **테스트 패턴** | 기존 test-utils.js 기반 (assert/assertEqual/assertContains/withVersion) |

### Value Delivered

| 관점 | 내용 |
|------|------|
| **Problem** | v0.35.0 전용 기능 (JIT, Full-Path, modes) 테스트 부재 |
| **Solution** | 10개 신규 스위트로 v0.35.0 전 영역 커버 + 기존 회귀 |
| **Function/UX Effect** | `node tests/run-all.js --sprint 7`로 v2.0.1 전용 테스트 실행 |
| **Core Value** | Gemini CLI v0.35.0 환경 무결성 100% 보장 |

---

## 1. 테스트 아키텍처

### 1.1 디렉토리 구조

```
tests/
├── run-all.js                    # Sprint 7 등록 (TC-101~TC-110 추가)
├── test-utils.js                 # 기존 유틸 (변경 없음)
├── fixtures.js                   # v2.0.1 픽스처 추가
├── suites/
│   ├── tc101-v035-policy-fullpath.js    # Full-Path Command Regex
│   ├── tc102-v035-jit-context.js        # JIT Context Loading
│   ├── tc103-v035-import-resolver.js    # Import Resolver JIT Mode
│   ├── tc104-v035-context-fork.js       # Context Fork JIT
│   ├── tc105-v035-feature-gates.js      # Feature Gates v0.35.0
│   ├── tc106-v035-hooks-integration.js  # Hooks v0.35.0 통합
│   ├── tc107-v035-modes-migration.js    # modes 값 마이그레이션
│   ├── tc108-v035-security-fullpath.js  # Security Full-Path 검증
│   ├── tc109-v035-skill-agent-compat.js # Skill/Agent 호환성
│   └── tc110-v035-e2e-regression.js     # E2E 회귀
└── gemini-interactive/
    └── v201-comprehensive-test-prompts.md  # Gemini CLI 인터랙티브 테스트
```

### 1.2 테스트 패턴

모든 신규 TC는 기존 패턴을 따름:
```javascript
const { PLUGIN_ROOT, assert, assertEqual, assertContains, withVersion } = require('../test-utils');
const path = require('path');
const tests = [
  { name: 'TC1XX-NN: description', fn: () => { ... } }
];
module.exports = { tests };
```

---

## 2. 상세 테스트 설계

### 2.1 TC-101: v0.35.0 Policy Full-Path Command (15 TC)

**대상 모듈**: `lib/gemini/policy.js` — `buildFullPathCommandRegex()`, `emitFullPathRule()`, `hasFullPathCommands()`

| ID | 테스트 케이스 | 검증 |
|----|--------------|------|
| TC101-01 | `buildFullPathCommandRegex('rm -rf')` 반환값 형식 | `[^"]*/${cmd}` 패턴 |
| TC101-02 | `buildFullPathCommandRegex('rm')` bare command 형식 | `[^"]*/rm[ "]` 패턴 |
| TC101-03 | `buildFullPathCommandRegex('git push --force')` args 포함 | args 이스케이프 |
| TC101-04 | regex가 `/usr/bin/rm -rf` 매칭 | 정규식 실행 확인 |
| TC101-05 | regex가 `/bin/rm` 매칭 | 짧은 경로 |
| TC101-06 | regex가 bare `rm` 미매칭 | full-path only |
| TC101-07 | regex가 `rmdir` 미매칭 | word boundary |
| TC101-08 | `hasFullPathCommands()` v0.35.0에서 true | withVersion |
| TC101-09 | `hasFullPathCommands()` v0.34.0에서 false | withVersion |
| TC101-10 | `emitFullPathRule()` useRegex=false시 빈 출력 | 조건부 |
| TC101-11 | `emitFullPathRule()` commandPrefix 없으면 skip | null 방어 |
| TC101-12 | `convertToToml()` v0.35.0에서 commandRegex 포함 | TOML 출력 |
| TC101-13 | `convertToToml()` v0.34.0에서 commandRegex 미포함 | 버전 분기 |
| TC101-14 | `generateLevelPolicy()` v0.35.0에서 regex 주석 포함 | TOML 헤더 |
| TC101-15 | `generateSubagentRules()` v0.35.0에서 regex 포함 | 서브에이전트 |

### 2.2 TC-102: v0.35.0 JIT Context Loading (12 TC)

**대상 모듈**: `lib/gemini/import-resolver.js` — `isJITMode()`, `getCacheTTL()`, `waitForFile()`

| ID | 테스트 케이스 | 검증 |
|----|--------------|------|
| TC102-01 | `isJITMode()` v0.35.0에서 true | withVersion |
| TC102-02 | `isJITMode()` v0.34.0에서 false | withVersion |
| TC102-03 | `getCacheTTL()` JIT모드 30000ms | TTL 값 |
| TC102-04 | `getCacheTTL()` legacy모드 5000ms | TTL 값 |
| TC102-05 | `resolveImports()` 존재하는 파일 성공 | 기본 동작 |
| TC102-06 | `resolveImports()` JIT모드 파일 없을 때 fallback | jitDeferred |
| TC102-07 | `resolveImports()` legacy모드 파일 없을 때 에러 | throw |
| TC102-08 | `resolveImports()` 순환 참조 감지 | circular detect |
| TC102-09 | `resolveImports()` 변수 치환 | ${VAR} |
| TC102-10 | `clearCache()` 후 캐시 비어있음 | 캐시 초기화 |
| TC102-11 | JIT_RETRY_DELAY_MS 상수 200 | 설정값 |
| TC102-12 | JIT_MAX_RETRIES 상수 3 | 설정값 |

### 2.3 TC-103: v0.35.0 Import Resolver 심화 (10 TC)

**대상 모듈**: `lib/gemini/import-resolver.js` — `resolveImports()` 심화 시나리오

| ID | 테스트 케이스 | 검증 |
|----|--------------|------|
| TC103-01 | `@import` 디렉티브 처리 | 중첩 파일 해석 |
| TC103-02 | 다중 `@import` 순서 유지 | 순서 보존 |
| TC103-03 | `${PLUGIN_ROOT}` 변수 치환 | 경로 변환 |
| TC103-04 | 상대 경로 → 절대 경로 변환 | path.resolve |
| TC103-05 | 캐시 TTL 만료 후 재로드 | 시간 경과 |
| TC103-06 | JIT fallback 콘텐츠 형식 | `<!-- [bkit] JIT deferred: ... -->` |
| TC103-07 | JIT fallback 캐시 TTL 짧음 | TTL - 2000 |
| TC103-08 | 빈 파일 import 처리 | 정상 동작 |
| TC103-09 | 특수문자 파일명 import | 이스케이프 |
| TC103-10 | `clearCache()` 후 재 resolve | 새로운 결과 |

### 2.4 TC-104: v0.35.0 Context Fork JIT (10 TC)

**대상 모듈**: `lib/gemini/context-fork.js`

| ID | 테스트 케이스 | 검증 |
|----|--------------|------|
| TC104-01 | `forkContext()` 함수 존재 | export 확인 |
| TC104-02 | `mergeForkedContext()` 함수 존재 | export 확인 |
| TC104-03 | `discardFork()` 함수 존재 | export 확인 |
| TC104-04 | `listActiveForks()` 함수 존재 | export 확인 |
| TC104-05 | `FORK_STORAGE_DIR` 상수 정의 | 경로 확인 |
| TC104-06 | `generateForkId()` 유니크한 ID 생성 | 중복 없음 |
| TC104-07 | `deepMerge()` 객체 병합 | 중첩 객체 |
| TC104-08 | `diffSnapshots()` 차이점 검출 | 비교 기능 |
| TC104-09 | `cleanupOldForks()` 함수 존재 | export 확인 |
| TC104-10 | `enforceSnapshotLimit()` 함수 존재 | export 확인 |

### 2.5 TC-105: v0.35.0 Feature Gates (8 TC)

**대상 모듈**: `lib/gemini/version.js` — v0.35.0 전용 플래그

| ID | 테스트 케이스 | 검증 |
|----|--------------|------|
| TC105-01 | v0.35.0: `hasJITContextLoading` = true | withVersion |
| TC105-02 | v0.35.0: `hasToolIsolation` = true | withVersion |
| TC105-03 | v0.35.0: `hasParallelToolScheduler` = true | withVersion |
| TC105-04 | v0.35.0: `hasAdminPolicy` = true | withVersion |
| TC105-05 | v0.34.0: `hasJITContextLoading` = false | withVersion |
| TC105-06 | v0.35.0: `getBkitFeatureFlags().canUseJITContext` = true | withVersion |
| TC105-07 | v0.35.0: `hasDisableAlwaysAllow` = true | withVersion |
| TC105-08 | v0.35.0: `hasCryptoVerification` = true | withVersion |

### 2.6 TC-106: v0.35.0 Hooks Integration (12 TC)

**대상**: `hooks/scripts/*.js` — v0.35.0 환경에서 훅 정합성

| ID | 테스트 케이스 | 검증 |
|----|--------------|------|
| TC106-01 | session-start.js v0.35.0에서 정상 출력 | JSON 구조 |
| TC106-02 | session-start.js JIT 중복 방지 로직 존재 | 코드 검사 |
| TC106-03 | before-tool.js full-path 명령어 차단 | `/usr/bin/rm -rf` |
| TC106-04 | before-agent.js v0.35.0 환경 트리거 | 정상 동작 |
| TC106-05 | hooks.json 10개 훅 정의 | 개수 확인 |
| TC106-06 | runtime-hooks.js HOT_PATH_HOOKS 7개 | 개수 확인 |
| TC106-07 | session-start.js PHASE_CONTEXT_MAP 존재 | 코드 검사 |
| TC106-08 | before-tool.js writeSecurityAuditLog 함수 존재 | 코드 검사 |
| TC106-09 | after-tool.js processHook 함수 존재 | 코드 검사 |
| TC106-10 | pre-compress.js main 함수 존재 | 코드 검사 |
| TC106-11 | after-agent.js AGENT_HANDLERS 존재 | 코드 검사 |
| TC106-12 | session-start.js Gemini CLI 호환 버전 표시 | 코드 검사 |

### 2.7 TC-107: v0.35.0 Modes Migration (10 TC)

**대상**: `modes` 값 `plan_mode` → `plan` 마이그레이션 검증

| ID | 테스트 케이스 | 검증 |
|----|--------------|------|
| TC107-01 | LEVEL_POLICY_TEMPLATES.Starter plan mode = `['plan']` | 값 확인 |
| TC107-02 | LEVEL_POLICY_TEMPLATES.Dynamic plan mode = `['plan']` | 값 확인 |
| TC107-03 | `plan_mode` 문자열 policy.js에 없음 | grep 검사 |
| TC107-04 | `plan_mode` 문자열 session-start.js에 없음 | grep 검사 |
| TC107-05 | `plan_mode` 문자열 before-tool.js에 없음 | grep 검사 |
| TC107-06 | TOML 정책에 `modes = ["plan"]` 생성 | convertToToml |
| TC107-07 | Extension policy TOML에 `plan_mode` 없음 | 파일 검사 |
| TC107-08 | bkit-extension-policy.toml 존재 | 파일 존재 |
| TC107-09 | Starter deny 규칙의 modes 배열에 `plan` 포함 | 값 확인 |
| TC107-10 | Enterprise 규칙에 modes 미사용 (plan 모드 없음) | 값 확인 |

### 2.8 TC-108: v0.35.0 Security Full-Path (12 TC)

**대상**: Full-path 명령어 보안 검증

| ID | 테스트 케이스 | 검증 |
|----|--------------|------|
| TC108-01 | `/usr/bin/rm -rf /` 차단 regex 매칭 | 정규식 |
| TC108-02 | `/bin/rm -rf /` 차단 regex 매칭 | 정규식 |
| TC108-03 | `/usr/local/bin/git push --force` 차단 | 정규식 |
| TC108-04 | bare `rm -rf /` 여전히 commandPrefix로 차단 | 기본 매칭 |
| TC108-05 | `ls` 명령은 차단 안됨 | 허용 |
| TC108-06 | `/usr/bin/ls` 명령은 차단 안됨 | 허용 |
| TC108-07 | regex 특수문자 이스케이프 정확 | `.*+?^$` |
| TC108-08 | `escapeTomlString()` backslash 처리 | 이스케이프 |
| TC108-09 | `escapeTomlString()` 따옴표 처리 | 이스케이프 |
| TC108-10 | `escapeTomlString()` newline 처리 | 이스케이프 |
| TC108-11 | `validateTomlStructure()` 정상 TOML 통과 | 구조 검증 |
| TC108-12 | `validateTomlStructure()` 비정상 TOML 실패 | 구조 검증 |

### 2.9 TC-109: v0.35.0 Skill & Agent Compatibility (10 TC)

**대상**: 35개 스킬 + 21개 에이전트 정합성

| ID | 테스트 케이스 | 검증 |
|----|--------------|------|
| TC109-01 | skills/ 디렉토리 35개 이상 | 개수 확인 |
| TC109-02 | agents/ 디렉토리 21개 .md 파일 | 개수 확인 |
| TC109-03 | 모든 SKILL.md에 YAML frontmatter 존재 | 파싱 |
| TC109-04 | 모든 에이전트 .md 비어있지 않음 | 내용 확인 |
| TC109-05 | SUBAGENT_POLICY_GROUPS 전체 에이전트 agents/에 존재 | 일치 확인 |
| TC109-06 | skill-orchestrator.js 정상 로드 | require 성공 |
| TC109-07 | `listSkills()` 반환값 30개 이상 | 개수 확인 |
| TC109-08 | `getUserInvocableSkills()` 반환값 존재 | 배열 확인 |
| TC109-09 | output-styles/ 4개 스타일 파일 존재 | 파일 확인 |
| TC109-10 | templates/ PDCA 템플릿 4개 존재 | 파일 확인 |

### 2.10 TC-110: v0.35.0 E2E Regression (15 TC)

**대상**: 전체 시스템 통합 검증

| ID | 테스트 케이스 | 검증 |
|----|--------------|------|
| TC110-01 | lib/gemini/ 8개 파일 모두 존재 | 구조 확인 |
| TC110-02 | lib/core/ 11개 파일 모두 존재 | 구조 확인 |
| TC110-03 | lib/pdca/ 6개 파일 모두 존재 | 구조 확인 |
| TC110-04 | bkit.config.json 정상 로드 | JSON 파싱 |
| TC110-05 | bkit.config.json testedVersions에 0.35.0 포함 | 값 확인 |
| TC110-06 | hooks/hooks.json 정상 로드 | JSON 파싱 |
| TC110-07 | GEMINI.md @import 7개 디렉티브 | 개수 확인 |
| TC110-08 | .gemini/context/ 9개 파일 존재 | 파일 확인 |
| TC110-09 | gemini-extension.json 정상 로드 | JSON 파싱 |
| TC110-10 | gemini-extension.json version = 2.0.0 | 값 확인 |
| TC110-11 | 모든 lib/ require() 에러 없음 | require 성공 |
| TC110-12 | CHANGELOG.md 존재 | 파일 확인 |
| TC110-13 | policies/bkit-extension-policy.toml 존재 | 파일 확인 |
| TC110-14 | `getFeatureFlags()` v0.35.0 전체 플래그 | 완전성 |
| TC110-15 | `getBkitFeatureFlags()` v0.35.0 전체 플래그 | 완전성 |

---

## 3. Fixtures 설계 (v2.0.1 추가)

### 3.1 신규 Fixtures

```javascript
// v0.35.0 JIT 환경 시뮬레이션
const V035_HOOK_INPUT = {
  sessionStart: {},
  beforeTool: { toolName: 'run_shell_command', input: { command: '/usr/bin/rm -rf /' } },
  beforeToolSafe: { toolName: 'run_shell_command', input: { command: '/usr/bin/ls -la' } }
};

// v0.35.0 정책 검증용
const V035_POLICY_PERMISSIONS = {
  'run_shell_command(rm -rf*)': 'deny',
  'run_shell_command(git push --force*)': 'deny',
  'run_shell_command(git reset --hard*)': 'ask',
  'write_file': 'allow'
};
```

---

## 4. 인터랙티브 테스트 설계

### 4.1 Gemini CLI 실행 시나리오

| 카테고리 | 시나리오 | 검증 포인트 |
|----------|----------|-------------|
| SessionStart | 세션 시작 후 bkit Feature Usage 출력 | 정책 생성, 레벨 감지 |
| PDCA | `/pdca plan test-feature` 실행 | Plan 문서 생성 |
| Policy | `rm -rf /tmp/test` 시도 | DENY + deny_message |
| Full-Path | `/usr/bin/rm -rf /tmp/test` 시도 | DENY (v0.35.0 regex) |
| JIT | 컨텍스트 파일 로딩 확인 | 지연 로딩 동작 |
| Skill | `/starter` 스킬 실행 | 스킬 활성화 |
| Agent | `검증해줘` 입력 | gap-detector 트리거 |
| Multilang | 8개국어 트리거 테스트 | 에이전트 매칭 |

---

## 5. 검증 기준

| 항목 | 기준 |
|------|------|
| TC-101~TC-110 Pass Rate | 100% |
| 기존 TC-01~TC-100 회귀 | 0 Failure |
| 인터랙티브 시나리오 | 전체 통과 |
| v0.35.0 전용 커버리지 | 10/10 영역 |

---

*Generated by bkit PDCA Design Phase*
