# bkit-gemini v2.0.0 리팩토링 상세 설계서

> 작성일: 2026-03-19
> Feature: bkit-gemini-v200-refactoring
> Plan 참조: docs/01-plan/features/bkit-gemini-v200-refactoring.plan.md
> 에이전트: 10개 전문 에이전트 병렬 분석 종합
> 코드베이스: 49 JS files, 12,618 LOC, 60+ Feature Flags → 목표 ~40 files, ~12,200 LOC, 14 Flags

---

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | bkit-gemini v2.0.0 — Gemini CLI 네이티브 아키텍처 전환 |
| 설계 완료일 | 2026-03-19 |
| 총 변경 파일 | **45개 수정** + **3개 삭제** + **5개 신규** |
| require() 변경 | **85개** (전수 매핑 완료) |
| 삭제 LOC | ~400 (YAGNI 12항목) |
| 보안 수정 | CRITICAL 2건 + HIGH 3건 + MEDIUM 4건 |
| 토큰 절감 | 세션 시작 3,300 → 970 (**71% 절감**) |
| Feature Flags | 50 → 14 (**72% 축소**, 36개 삭제) |
| 설계서 정합성 | **97.2%** (72항목 검증, gap-detector 확인) |

### Value Delivered

| 관점 | 내용 |
|------|------|
| Problem | CC 유산 16개 파일, yolo 전 에이전트(SEC-01 CRITICAL), 세션 ~3,300 토큰 과부하, PDCA 강제 이탈 |
| Solution | CC 전량 제거 + 안전 티어 3단계 + Phase-Aware 조건부 로딩 + 투명한 PDCA 자동화 |
| Function UX Effect | 토큰 71% 절감, 읽기 전용 에이전트 코드 수정 불가, "아이디어만 말하면" PDCA 자동 실행 |
| Core Value | **"Write your idea. bkit does the rest."** |

---

## 목차

1. [Sprint 1: CC 유산 제거 + 보안 CRITICAL](#sprint-1)
2. [Sprint 2: Context Engineering 고도화](#sprint-2)
3. [Sprint 3: 민주화 + 어댑터 평탄화](#sprint-3)
4. [Sprint 4: 안정화 + 릴리스](#sprint-4)
5. [횡단 관심사: require() 전수 매핑](#cross-require)
6. [횡단 관심사: Config/GEMINI.md 스키마 v2](#cross-config)
7. [횡단 관심사: 데이터 모델 + API](#cross-data)
8. [횡단 관심사: 마이그레이션 + 하위호환](#cross-migration)
9. [검증 전략](#verification)

---

<a id="sprint-1"></a>
## 1. Sprint 1: CC 유산 제거 + 보안 CRITICAL (Week 1-2)

### 1.1 CC 코드 제거 — 삭제 파일 3개

| # | 파일 | 사유 |
|---|------|------|
| D-1 | `lib/adapters/platform-interface.js` | PlatformAdapter ABC — 구현체 1개(Gemini)만 존재 |
| D-2 | `lib/adapters/index.js` | 항상 Gemini 반환하는 로더 — 불필요한 indirection |
| D-3 | `lib/common.js` | 210개 re-export 브릿지 — tc20 1곳만 직접 사용 |

### 1.2 CC 코드 제거 — 수정 파일 7개

#### 1.2.1 `lib/adapters/gemini/tool-registry.js` (~60줄 삭제)

**삭제 대상:**

```
CLAUDE_TO_GEMINI_MAP (L205-224)     — CC→Gemini 도구 매핑 18개
BKIT_LEGACY_NAMES (L70-74)          — v1.5.2 이전 레거시
FORWARD_ALIASES (L80-86)            — Issue #1391 미구현 예측
REVERSE_FORWARD_ALIASES (L89-93)    — 역방향 예측
getVersionedToolName() (L306-310)   — 빈 함수
getVersionedParamName() (L337-347)  — 빈 함수
```

**유지 대상:** BUILTIN_TOOLS(23개), ALL_BUILTIN_TOOL_NAMES, LEGACY_ALIASES(1개 공식), TOOL_CATEGORIES, TOOL_ANNOTATIONS, TOOL_PARAM_CHANGES, getReadOnlyTools(), getStrictReadOnlyTools(), getAllTools(), resolveToolName(), isValidToolName(), getToolAnnotations(), isReadOnlyTool(), getToolParamChanges()

#### 1.2.2 `lib/adapters/gemini/index.js` (~35줄 삭제)

```diff
- extends PlatformAdapter          → 직접 class (ABC 상속 제거)
- TOOL_MAP (CC 키 포함, L15-23)    → 삭제
- REVERSE_TOOL_MAP (L26-28)        → 삭제
- mapToolName() (L105-107)         → 삭제
- reverseMapToolName() (L112-114)  → 삭제
- ${CLAUDE_PLUGIN_ROOT} (L95)      → 삭제 (${PLUGIN_ROOT}는 유지)
```

#### 1.2.3 `lib/core/platform.js`

```diff
- isClaudeCode() (L38-43)         → 삭제 (항상 false, dead code)
- exports에서 isClaudeCode 제거
- require('../adapters')           → require('../adapters/gemini')
```

#### 1.2.4 `lib/core/io.js`

```diff
- normalized.toolName = adapter.reverseMapToolName(input.tool_name)
+ normalized.toolName = input.tool_name
- normalized.geminiToolName = input.tool_name  → 삭제 (중복)
```

#### 1.2.5 `hooks/scripts/after-tool.js` (L19-28)

```diff
- claudeToolName 변수 + CLAUDE_TO_GEMINI_MAP import + reverseMap 생성 전부 삭제
- ['Write', 'Edit'].includes(claudeToolName) → 삭제
- claudeToolName === 'Skill' → 삭제
  조건문: Gemini 네이티브 도구명만 사용
```

#### 1.2.6 `hooks/scripts/before-tool.js` (동일 패턴)

```diff
- claudeToolName 변수 + 역매핑 로직 전부 삭제
- ['Write', 'Edit'].includes(claudeToolName) → 삭제
- claudeToolName === 'Bash' → 삭제
```

#### 1.2.7 테스트 수정

- tc25: TC25-07(CC MAP), TC25-09(FORWARD), TC25-15(versioned) 삭제
- tc17: P2-13, P2-14 (FORWARD_ALIASES) 삭제
- tc20: common.js require 경로 변경

### 1.3 보안 CRITICAL — SEC-01: 에이전트 안전 티어

**파일:** `mcp/spawn-agent-server.js`

```javascript
const SAFETY_TIERS = Object.freeze({
  READONLY: 0,   // --approval-mode=ask_user
  DOCWRITE: 1,   // --approval-mode=ask_user + write_file allowed
  FULL: 2        // --approval-mode=yolo
});
```

**에이전트 분류 (16개):**

| Tier | 에이전트 | 수 |
|------|---------|---|
| READONLY (0) | gap-detector, design-validator, code-analyzer, security-architect, qa-monitor, qa-strategist, starter-guide, pipeline-guide, bkend-expert, enterprise-expert | 10 |
| DOCWRITE (1) | report-generator, product-manager, infra-architect, frontend-architect | 4 |
| FULL (2) | cto-lead, pdca-iterator | 2 |

**executeAgent() 변경:** safetyTier 파라미터 추가, Tier 0/1은 `--approval-mode=ask_user`, Tier 2만 `--approval-mode=yolo`

### 1.4 보안 CRITICAL — SEC-02: subagent TOML 정책

**파일:** `lib/adapters/gemini/policy-migrator.js` + `policies/bkit-extension-policy.toml`

SUBAGENT_POLICY_GROUPS 상수 + generateSubagentRules() 함수 추가. Tier 0: 30 deny 규칙, Tier 1: 4 deny 규칙.

### 1.5 보안 HIGH — SEC-03~05, SEC-08

| SEC | 파일 | 변경 |
|-----|------|------|
| SEC-03 | spawn-agent-server.js | sanitizeTeamName() + getTeamPath() — path traversal 차단 |
| SEC-04 | bkit-permissions.toml | run_shell_command 기본 ask_user + 안전 명령 allowlist |
| SEC-05 | lib/core/permission.js | Policy Engine + bkit deny 패턴 이중 방어 |
| SEC-08 | TOML 정책 + policy-migrator.js | modes = ["plan_mode"] 규칙 추가 |

### 1.6 Sprint 1 구현 순서

```
1. tool-registry.js 상수/함수 삭제 (Y-1~Y-4, Y-11)
2. gemini/index.js extends 제거, CC 메서드 삭제 (Y-8, Y-9, Y-12)
3. platform-interface.js 삭제 (Y-5)
4. adapters/index.js 삭제 (Y-6)
5. core/platform.js, core/io.js CC 참조 제거
6. hooks 2개 claudeToolName 제거
7. SEC-03 path traversal 수정
8. SEC-01 안전 티어 도입
9. SEC-04 기본 ask_user
10. SEC-05 이중 방어
11. SEC-02 subagent TOML
12. SEC-08 modes 정책
13. common.js 삭제
14. 테스트 수정
```

**게이트:** TC Pass Rate ≥ 99%, SEC-01/02 해소, CC export 0건

---

<a id="sprint-2"></a>
## 2. Sprint 2: Context Engineering 고도화 (Week 3-4)

### 2.1 version-detector.js 단순화

**Feature Flags 54 → 14개** (40개 삭제 — v0.34.0에서 항상 true)

삭제: v0.26.0(1) + v0.29.0(4) + v0.30.0(4) + v0.31.0(9) + v0.32.0(11) + v0.33.0(7) = 36개

유지: v0.34.0 전용 14개 (hasNativeSkillSystem ~ hasUpgradeCommand)

```javascript
// 기본값 변경
if (!raw) raw = '0.34.0';  // was: '0.29.0'

// getBkitFeatureFlags() — 이전 게이트는 항상 true
canUseTeam: true,           // was: flags.hasTaskTracker
canUseNativeAgents: true,   // was: flags.hasNativeSubagents
```

**호출 사이트 4곳 업데이트:** session-start.js의 `flags.hasPolicyEngine/hasProjectLevelPolicy/hasExtensionPolicies` 조건 삭제 → 항상 실행

### 2.2 Phase-Aware Context 조건부 로딩

**GEMINI.md @import 7개 → 2개** (세션 시작 토큰 3,300 → 970, **71% 절감**)

```javascript
const PHASE_CONTEXT_MAP = {
  plan:   ['commands.md', 'pdca-rules.md', 'feature-report.md', 'executive-summary-rules.md'],
  design: ['pdca-rules.md', 'feature-report.md', 'executive-summary-rules.md'],
  do:     ['tool-reference.md', 'skill-triggers.md', 'feature-report.md'],
  check:  ['pdca-rules.md', 'feature-report.md'],
  act:    ['pdca-rules.md', 'feature-report.md'],
  idle:   ['commands.md', 'pdca-rules.md', 'agent-triggers.md', 'skill-triggers.md', 'feature-report.md']
};
```

**GEMINI.md 리라이트:** 62줄 → 15줄 + @import 2개만 (core-rules.md + commands.md)

### 2.3 Context Anchoring — PDCA 문서 자동 주입

`before-model.js`에 `extractDocumentAnchors()` 추가. Do 단계에서 Design 문서 핵심 섹션(Architecture, Implementation Order)을 매 턴 자동 주입. MAX_ANCHOR_CHARS 3000자 상한.

### 2.4 modelRouting 힌트

```javascript
const MODEL_ROUTING = {
  plan:   { preferredModel: 'pro',   reason: 'Deep reasoning' },
  design: { preferredModel: 'pro',   reason: 'Architecture analysis' },
  do:     { preferredModel: 'pro',   reason: 'Code accuracy' },
  check:  { preferredModel: 'flash', reason: 'Fast comparison' },
  act:    { preferredModel: 'flash', reason: 'Iterative fixes' }
};
```

### 2.5 Tracker CRUD 직접 호출

`TRACKER_MODE` enum (INSTRUCTION/DIRECT/HYBRID) + `appendPendingOperation()` + session-start에서 `[MANDATORY]` 지시로 소비

### 2.6 .gemini/context/ 파일 재구성

| Action | 파일 | 설명 |
|--------|------|------|
| CREATE | core-rules.md | pdca-rules + feature-report + executive-summary 통합 (~400토큰) |
| CREATE | tool-reference-v2.md | CC 참조 제거 126줄→35줄 (~350토큰) |
| DELETE | pdca-rules.md, feature-report.md, executive-summary-rules.md, tool-reference.md | 통합/대체 |

**게이트:** 세션 시작 토큰 ≤ 970, Phase-Aware 동작 확인

---

<a id="sprint-3"></a>
## 3. Sprint 3: 민주화 + 어댑터 평탄화 (Week 5-6)

### 3.1 어댑터 평탄화 — require() 85개 변경

`lib/adapters/gemini/` → `lib/gemini/` 이동:

| 현재 | 이동 후 |
|------|---------|
| adapters/gemini/index.js | gemini/platform.js |
| adapters/gemini/tool-registry.js | gemini/tools.js |
| adapters/gemini/version-detector.js | gemini/version.js |
| adapters/gemini/hook-adapter.js | gemini/hooks.js |
| adapters/gemini/policy-migrator.js | gemini/policy.js |
| adapters/gemini/tracker-bridge.js | gemini/tracker.js |
| adapters/gemini/context-fork.js | gemini/context-fork.js |
| adapters/gemini/import-resolver.js | gemini/import-resolver.js |

**영향 범위:** 45개 파일, 85개 require 변경 (전수 매핑 완료 — 상세 목록은 design-s3-flatten 에이전트 결과 참조)

| 범주 | 파일 수 | require 변경 수 |
|------|---------|----------------|
| 어댑터 내부 | 5 | 9 |
| lib/core/ | 4 | 5 |
| lib/pdca/ | 3 | 3 |
| lib/task/, team/ | 3 | 3 |
| lib/skill-orchestrator.js | 1 | 1 |
| hooks/scripts/ | 10 | 18 |
| mcp/ | 1 | 1 |
| tests/ | 17 | 44 |
| lib/common.js | 1 | 1 |

### 3.2 Progressive Onboarding

`session-start.js`의 `buildOnboardingSection()` → 5개 레벨별 함수 분리:

- **Starter**: "무엇을 만들고 싶으신가요?" 단일 질문
- **Dynamic 재방문**: "마지막 작업: [feature] ([phase]) 계속?"
- **Enterprise**: `[Level: Enterprise | Feature: X | Phase: Do]` 한 줄

### 3.3 투명한 PDCA 자동 실행

SessionStart 컨텍스트에 "자연어 기능 요청 처리 절차" 주입:
```
사용자 "로그인 만들어줘" → AI 자동 Plan → 확인 → Design → 확인 → Do → Gap 제안
```

after-tool.js의 `processPostSkill()` 확장: 각 PDCA 단계 완료 시 다음 단계 안내 + write 횟수 카운터

### 3.4 Skill Visibility Control

```javascript
const LEVEL_SKILL_WHITELIST = {
  Starter: ['starter', 'pdca', 'bkit-rules', 'bkit-templates', 'development-pipeline'],  // 5개
  Dynamic: [/* Starter 5개 + */ 'dynamic', 'bkend-*', 'phase-1~6', 'code-review', ...],  // 20개
  Enterprise: null  // 전체 35개
};
```

### 3.5 Feature Report 조건부 출력

- Starter: Phase 전환 시만 (간략: `💡 다음 단계: /pdca design`)
- Dynamic: PDCA 작업 완료 시만
- Enterprise: 명시적 요청 시만

**게이트:** 전체 require() 무결성, Starter 3단계 온보딩 테스트

---

<a id="sprint-4"></a>
## 4. Sprint 4: 안정화 + 릴리스 (Week 7-8)

### 4.1 철학 문서 독립화

`bkit-system/philosophy/` symlink 끊기 → 독립 복사본. 4개 문서 각각 CC→Gemini 변환 + Gemini CE 5대 원칙 통합

### 4.2 통합 Regression

기존 79 TC 중 변경 필요 5개 (tc07, tc10, tc55, tc59, tc76) + 신규 TC-80~83:
- TC-80: Skills 분류별 라우팅 (P0)
- TC-81: Export 하위호환 diff (P0)
- TC-82: Hook 라이프사이클 순서 (P1)
- TC-83: PDCA E2E v2.0.0 전체 사이클 (P0)

### 4.3 Skill Eval 확장

P0 5개 + P1 10개 = 16개 추가 (커버리지 2.9% → 46%)

### 4.4 버전 SST

`scripts/sync-version.js` 신규 — bkit.config.json version을 hooks.json, extension.json, JSDoc에 동기화

### 4.5 template CC 잔재 제거

6곳 식별: TEMPLATE-GUIDE.md(3), GEMINI.template.md(1), zero-script-qa.template.md(2)

### 4.6 보안 감사 로그 (SEC-09)

`writeSecurityAuditLog()` — `.gemini/security-audit.log` JSON Lines 형식

**게이트:** TC ≥ 99%, Skill Eval ≥ 25/35, CRITICAL 0건

---

<a id="cross-require"></a>
## 5. 횡단: require() 전수 매핑 (85개)

> 상세 목록은 design-s3-flatten 에이전트 결과 참조. 핵심 패턴:

```
require(path.join(libPath, 'adapters'))
  → require(path.join(libPath, 'gemini', 'platform'))

require(path.join(libPath, 'adapters', 'gemini', 'version-detector'))
  → require(path.join(libPath, 'gemini', 'version'))

require(path.join(libPath, 'adapters', 'gemini', 'tool-registry'))
  → require(path.join(libPath, 'gemini', 'tools'))
```

---

<a id="cross-config"></a>
## 6. 횡단: Config/GEMINI.md 스키마 v2

### bkit.config.json 주요 변경

| 필드 | v1.5.9 → v2.0.0 |
|------|-----------------|
| version | "1.5.9" → "2.0.0" |
| minGeminiCliVersion | "0.29.0" → "0.34.0" |
| testedVersions | 11개 → ["0.34.0"] |
| runtimeHooks.dualMode | true → 삭제 |
| taskTracker.bridgeEnabled | true → 삭제 |
| taskTracker.directCrud | (추가) true |
| skillsSystem.nativeActivation | false → true |
| permissions 섹션 | 전체 삭제 (TOML 이관) |
| subagentPolicies 섹션 | (추가) enabled: true |
| modelRouting 섹션 | (추가) phase별 Flash/Pro |
| context.phaseAware | (추가) enabled: true |

### gemini-extension.json

```json
"contextFileName": "GEMINI.md"
→ "contextFileName": ["GEMINI.md", "GEMINI-agents.md", "GEMINI-skills.md"]
```

### GEMINI.md

62줄 + @import 7개 (~3,300토큰) → **15줄 + @import 2개 (~970토큰)**

---

<a id="cross-data"></a>
## 7. 횡단: 데이터 모델 + API 인터페이스

### lib/gemini/tools.js (v2.0) — 삭제 3개, 추가 2개

| 항목 | Action |
|------|--------|
| BKIT_LEGACY_NAMES | 삭제 |
| REVERSE_FORWARD_ALIASES | 삭제 |
| CLAUDE_TO_GEMINI_MAP | 삭제 |
| TOOL_VERSION_MATRIX | 추가 |
| getToolsForVersion() | 추가 |

### lib/gemini/tracker.js (v2.0) — TRACKER_MODE 추가

```javascript
const TRACKER_MODE = Object.freeze({
  INSTRUCTION: 'instruction',
  DIRECT_CRUD: 'direct-crud'
});
```

createPdcaEpic() 반환 타입 확장: `{ available, mode, tasks?, epicTitle?, hint? }`

### .pdca-status.json 스키마 검증 (버그 수정)

**발견된 버그:** 실제 파일의 `activeFeatures`가 객체 `{}`, 코드 기대는 배열 `[]`. v2.0에서 `validatePdcaStatus()` 추가하여 타입 통일.

---

<a id="cross-migration"></a>
## 8. 횡단: 마이그레이션 + 하위호환

### Breaking Changes 완전 목록

| 카테고리 | 수량 |
|---------|------|
| 제거되는 exports | 15개 (CLAUDE_TO_GEMINI_MAP, PlatformAdapter 등) |
| 변경되는 require 경로 | 85개 |
| 제거되는 Feature Flags | 36개 |
| 설정 스키마 변경 | bkit.config.json 5필드 제거, 3필드 추가 |
| contextFileName 타입 변경 | string → array |

### 마이그레이션 스크립트 (`scripts/migrate-v2.js`)

6단계: CLI 버전 검증 → config 업데이트 → extension 업데이트 → TOML 재생성 → GEMINI.md 경량화 → 검증

`--dry-run`, `--force`, `--rollback` 옵션 지원

### v1.5.9 LTS 정책

- LTS 기간: v2.0.0 릴리스 후 6개월
- 지원 범위: 보안 패치 + Critical 버그만
- 브랜치: `lts/v1.5.x`

### 롤백 4단계

- Level 1: 개별 커밋 revert (Sprint 내)
- Level 2: Sprint 전체 롤백 (게이트 실패 시)
- Level 3: v2.0.0 전체 롤백 (Critical 이슈)
- Level 4: 사용자 측 `migrate-v2.js --rollback`

---

<a id="verification"></a>
## 9. 검증 전략

### 품질 메트릭

| 메트릭 | 목표값 |
|--------|--------|
| TC Pass Rate | ≥ 99% (82 TC) |
| Export 하위호환 | 삭제 0건 |
| Skill Eval 커버리지 | ≥ 46% (16/35) |
| Hook ERROR | 0건 |
| CRITICAL 보안 | 0건 |
| 세션 시작 토큰 | ≤ 970 |
| Feature Flags | ≤ 14개 |

### Sprint별 게이트

| Sprint | P0 게이트 | 롤백 기준 |
|--------|----------|-----------|
| S1 | TC ≥ 99%, SEC-01/02 해소 | P0 1건 실패 → revert |
| S2 | 토큰 ≤ 970, Phase-Aware 동작 | 토큰 미달 → 롤백 |
| S3 | require() 무결성, 온보딩 테스트 | require 오류 → 롤백 |
| S4 | TC ≥ 99%, Eval ≥ 16/35, E2E 완주 | P0 실패 → 릴리스 보류 |

---

## 부록: 10개 에이전트 분석 결과 참조

| # | 에이전트 | 핵심 산출물 |
|---|----------|------------|
| 1 | design-s1-cc-removal | 파일별 diff + 삭제 export 15개 + 구현 순서 |
| 2 | design-s1-security | SEC-01~08 코드 diff + 완전한 TOML + 검증 스크립트 |
| 3 | design-s2-context | Flags 54→14 + Phase-Aware 맵 + Context Anchoring + modelRouting |
| 4 | design-s3-flatten | require() 85개 전수 매핑 (45파일, line 번호 포함) |
| 5 | design-s3-ux | Progressive Onboarding 5함수 + Skill Visibility + Feature Report |
| 6 | design-s4-stabilize | TC-80~83 설계 + Eval 16개 + sync-version.js + 감사 로그 |
| 7 | design-cross-config | Config v2 전체 JSON + GEMINI.md 리라이트 + 토큰 71% 절감 |
| 8 | design-cross-datamodel | 모듈별 TypeScript 인터페이스 + .pdca-status.json 버그 발견 |
| 9 | design-cross-migration | Breaking Changes 완전 목록 + migrate-v2.js pseudo-code + LTS 정책 |
| 10 | design-cross-hooks | Hook 17개 파일 전수 변경 (s1-cc + s3-flatten과 통합) |

각 에이전트의 상세 결과는 해당 task output 파일에서 전체 내용을 참조할 수 있습니다.
