# bkit-gemini v2.0.0 Refactoring Supplement Design Document

> **Summary**: v2.0.0 리팩토링 보완 — Critical/High/Medium 13개 요구사항의 상세 설계
>
> **Project**: bkit-gemini
> **Version**: 2.0.0 -> 2.0.1
> **Author**: CTO Lead (Agent Team 10명 분석)
> **Date**: 2026-03-20
> **Status**: Draft
> **Planning Doc**: [bkit-gemini-v200-refactoring-supplement.plan.md](../01-plan/features/bkit-gemini-v200-refactoring-supplement.plan.md)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | v2.0.0에서 version.js-policy.js 플래그 단절(Policy TOML 미생성), getReadOnlyTools() 보안 누출(쓰기 도구 3개 포함), context-fork.js 레거시 경로(빈 데이터 반환), session-start.js 컨텍스트 중복(550+ 토큰 낭비) |
| **Solution** | 13개 FR의 파일별 정밀 수정 설계: 6개 파일 수정, 1개 파일 삭제, 테스트 보강 |
| **Function/UX Effect** | Policy Engine 정상 동작, readonly 에이전트 보안 격리, context-fork 데이터 정합성, idle 세션 토큰 30% 추가 절감 |
| **Core Value** | **"Production-Ready Architecture"** — 테스트 통과를 넘어 운영 무결성 확보 |

### Value Delivered (4 Perspectives)

| # | Perspective | Before (v2.0.0) | After (v2.0.1) |
|---|-------------|-----------------|-----------------|
| 1 | Problem | 4건 Critical 결함 잠복 | Critical 0건 |
| 2 | Solution | 6파일 수정 + 1파일 삭제 | 13 FR 완전 해소 |
| 3 | Function UX | idle 세션 ~2000 토큰 | ~1450 토큰 (27% 절감) |
| 4 | Core Value | 테스트만 통과 | 운영 환경 무결성 |

---

## 1. Overview

### 1.1 Design Goals

1. **Critical 결함 제로화**: version.js-policy.js 플래그 단절, getReadOnlyTools() 보안 누출, context-fork 레거시 경로, version 하드코딩 4건 즉시 해소
2. **에이전트 보안 모델 완성**: 2티어(readonly/docwrite) → 3티어(readonly/docwrite/full) 전환
3. **컨텍스트 토큰 최적화**: session-start.js 중복 섹션 제거로 550+ 토큰 절감
4. **기존 테스트 무결성 유지**: 754 TC 전체 통과 보장

### 1.2 Design Principles

- **최소 변경 원칙**: 각 FR별 변경 범위를 해당 파일로 한정
- **하위호환 보장**: public API 시그니처 변경 없음
- **단계적 적용**: Critical → High → Medium 순서로 독립 적용 가능
- **검증 가능성**: 각 수정에 대한 테스트 케이스 명시

---

## 2. Architecture

### 2.1 수정 대상 파일 맵

```
bkit-gemini/
├── lib/
│   ├── gemini/
│   │   ├── version.js        [FR-G05] 플래그 복원
│   │   ├── tools.js           [FR-04]  getReadOnlyTools() 수정
│   │   ├── policy.js          [FR-05]  FULL 티어 추가
│   │   └── context-fork.js    [FR-02/03] 경로 위임
│   └── core/
│       └── platform.js        [FR-08]  deprecation 경고
├── hooks/scripts/
│   └── session-start.js       [FR-01/06/07] version 수정 + 중복 제거 + 파일 검증
├── .gemini/context/
│   └── tool-reference.md      [FR-09]  삭제 (v2로 단일화)
└── tests/                     [QA-01~05] 테스트 보강
```

### 2.2 수정 의존성 그래프

```
[Phase 1: Critical - 독립 적용 가능]
  FR-G05 (version.js) ──→ policy.js가 정상 작동
  FR-01  (session-start.js:79) ──→ 독립
  FR-02/03 (context-fork.js) ──→ 독립
  FR-04  (tools.js) ──→ 독립

[Phase 2: High - Phase 1 이후]
  FR-05  (policy.js) ──depends──→ FR-G05 완료 필요
  FR-06  (session-start.js) ──→ 독립
  FR-07  (session-start.js) ──→ 독립

[Phase 3: Medium - Phase 1,2 이후]
  FR-09/10 (.gemini/context/) ──→ FR-07 완료 필요
  FR-08  (platform.js) ──→ 독립
  FR-11  (문서화) ──→ 독립
```

### 2.3 변경 영향 범위

| 파일 | 변경 유형 | 예상 변경 라인 | 기존 테스트 영향 |
|------|----------|--------------|----------------|
| `lib/gemini/version.js` | 함수 수정 | +6 lines | TC-95 통과 유지 |
| `lib/gemini/tools.js` | 함수 수정 | -3 lines | TC-81 수정 필요 |
| `lib/gemini/policy.js` | 객체 추가 | +20 lines | TC-84 수정 필요 |
| `lib/gemini/context-fork.js` | 함수 수정 | +12/-4 lines | 신규 TC 추가 |
| `lib/core/platform.js` | 경고 추가 | +5 lines | 영향 없음 |
| `hooks/scripts/session-start.js` | 다중 수정 | +15/-20 lines | TC-88 수정 필요 |
| `.gemini/context/tool-reference.md` | 삭제 | -전체 | 영향 없음 |

---

## 3. Detailed Design — Phase 1: Critical Fixes

### 3.1 FR-G05: version.js getFeatureFlags() 플래그 복원

**문제**: `lib/gemini/version.js:149-167`의 `getFeatureFlags()`에서 `hasPolicyEngine`, `hasProjectLevelPolicy`, `hasExtensionPolicies`, `hasRuntimeHookFunctions` 플래그가 v2.0.0 정리 시 삭제됨. `lib/gemini/policy.js:211,363,459`에서 이 플래그를 여전히 참조하여 Policy Engine TOML 파일이 생성되지 않음.

**수정 파일**: `lib/gemini/version.js`

**수정 위치**: `getFeatureFlags()` 함수 (L149-167)

**수정 내용**:
```javascript
// lib/gemini/version.js getFeatureFlags() 내부에 추가
// 기존 플래그 아래에 Policy Engine 관련 플래그 복원

function getFeatureFlags() {
  return {
    // v0.34.0+ (기존 유지)
    hasNativeSkillSystem: isVersionAtLeast('0.34.0'),
    hasACP: isVersionAtLeast('0.34.0'),
    // ... (기존 14개 플래그 유지)
    hasUpgradeCommand: isVersionAtLeast('0.34.0'),

    // Policy Engine flags (policy.js에서 참조 - v2.0.0 정리 시 누락)
    hasPolicyEngine: isVersionAtLeast('0.30.0'),
    hasProjectLevelPolicy: isVersionAtLeast('0.31.0'),
    hasExtensionPolicies: isVersionAtLeast('0.32.0'),

    // Task Tracker flag (tracker.js에서 참조)
    hasTaskTracker: isVersionAtLeast('0.32.0'),

    // RuntimeHook flag (hooks.js에서 참조)
    hasRuntimeHookFunctions: isVersionAtLeast('0.31.0')
  };
}
```

**검증 방법**:
```javascript
// 테스트: version.js 플래그가 policy.js 사용처와 일치하는지
const flags = getFeatureFlags();
assert(flags.hasPolicyEngine !== undefined, 'hasPolicyEngine must exist');
assert(flags.hasProjectLevelPolicy !== undefined, 'hasProjectLevelPolicy must exist');
assert(flags.hasExtensionPolicies !== undefined, 'hasExtensionPolicies must exist');
assert(flags.hasRuntimeHookFunctions !== undefined, 'hasRuntimeHookFunctions must exist');
assert(flags.hasTaskTracker !== undefined, 'hasTaskTracker must exist');
```

**하위호환**: `getFeatureFlags()` 반환 객체에 키 추가만 수행. 기존 키 변경 없음.

---

### 3.2 FR-01: session-start.js version 하드코딩 수정

**문제**: `hooks/scripts/session-start.js:79`에서 `metadata.version`이 `'1.5.9'`로 하드코딩. Gemini CLI에 전달되어 에이전트가 구버전으로 오인.

**수정 파일**: `hooks/scripts/session-start.js`

**수정 위치**: L79

**수정 내용**:
```javascript
// Before (L79):
version: '1.5.9',

// After:
version: '2.0.0',
```

**검증 방법**:
```javascript
// session-start.js 출력의 metadata.version이 '2.0.0'인지 확인
const output = JSON.parse(stdout);
assert.strictEqual(output.metadata.version, '2.0.0');
```

---

### 3.3 FR-02/03: context-fork.js 레거시 경로 위임

**문제**: `lib/gemini/context-fork.js:73-84`에서 `readPdcaStatus()`가 `docs/.pdca-status.json`, `readMemory()`가 `docs/.bkit-memory.json`을 직접 참조. 실제 파일은 루트 `.pdca-status.json`과 `.bkit/state/memory.json`에 위치하여 fork 스냅샷이 항상 빈 데이터를 반환.

**수정 파일**: `lib/gemini/context-fork.js`

**수정 위치**: L72-86 (readPdcaStatus, readMemory 함수)

**수정 내용**:
```javascript
// ===== FR-02: readPdcaStatus 수정 (L72-76) =====

// Before:
function readPdcaStatus(projectDir) {
  const statusPath = path.join(projectDir, 'docs', '.pdca-status.json');
  return readJsonSync(statusPath) || { version: '2.0', activeFeatures: {}, features: {} };
}

// After:
function readPdcaStatus(projectDir) {
  try {
    const { loadPdcaStatus } = require('../pdca/status');
    return loadPdcaStatus(projectDir);
  } catch {
    // Fallback: root path (v2.0.0 standard location)
    const statusPath = path.join(projectDir, '.pdca-status.json');
    return readJsonSync(statusPath) || { version: '2.0', activeFeatures: {}, features: {} };
  }
}

// ===== FR-03: readMemory 수정 (L82-86) =====

// Before:
function readMemory(projectDir) {
  const memoryPath = path.join(projectDir, 'docs', '.bkit-memory.json');
  return readJsonSync(memoryPath) || { version: '1.0', data: {} };
}

// After:
function readMemory(projectDir) {
  try {
    const { getMemory } = require('../core/memory');
    const manager = getMemory(projectDir);
    return manager.load();
  } catch {
    // Fallback: v1.5.9 standard location
    const memoryPath = path.join(projectDir, '.bkit', 'state', 'memory.json');
    return readJsonSync(memoryPath) || { version: '1.0', data: {} };
  }
}
```

**설계 근거**:
- `pdca/status.js:loadPdcaStatus()`가 이미 root → legacy 순서로 탐색하는 로직을 보유 (L122-139)
- `core/memory.js`가 `.bkit/state/memory.json`을 표준 경로로 사용 (MEMORY_DIR = `.bkit/state`)
- try-catch 패턴: context-fork.js가 독립 실행될 수 있는 가능성 대비
- Fallback 경로: legacy `docs/` 경로 대신 v2.0.0 표준 경로 사용

**검증 방법**:
```javascript
// 1. 루트 .pdca-status.json만 존재할 때 정상 로드 확인
// 2. docs/.pdca-status.json이 없을 때도 정상 작동 확인
// 3. forkContext() 호출 시 빈 데이터가 아닌 실제 상태 반환 확인
```

---

### 3.4 FR-04: getReadOnlyTools() 보안 수정

**문제**: `lib/gemini/tools.js:177-194`에서 `getReadOnlyTools()`가 `ACTIVATE_SKILL`, `WRITE_TODOS`, `SAVE_MEMORY`를 포함. 이 3개 도구는 같은 파일의 `TOOL_ANNOTATIONS`에서 `readOnlyHint: false`로 정의되어 API 간 모순 발생.

**수정 파일**: `lib/gemini/tools.js`

**수정 위치**: L177-194 (getReadOnlyTools 함수)

**수정 내용**:
```javascript
// Before (L177-194):
function getReadOnlyTools() {
  return [
    BUILTIN_TOOLS.READ_FILE,
    BUILTIN_TOOLS.READ_MANY_FILES,
    BUILTIN_TOOLS.GREP_SEARCH,
    BUILTIN_TOOLS.GLOB,
    BUILTIN_TOOLS.LIST_DIRECTORY,
    BUILTIN_TOOLS.GOOGLE_WEB_SEARCH,
    BUILTIN_TOOLS.WEB_FETCH,
    BUILTIN_TOOLS.ACTIVATE_SKILL,     // REMOVE: readOnlyHint: false
    BUILTIN_TOOLS.WRITE_TODOS,        // REMOVE: readOnlyHint: false
    BUILTIN_TOOLS.SAVE_MEMORY,        // REMOVE: readOnlyHint: false
    BUILTIN_TOOLS.ASK_USER,
    BUILTIN_TOOLS.GET_INTERNAL_DOCS,
    BUILTIN_TOOLS.TRACKER_GET_TASK,
    BUILTIN_TOOLS.TRACKER_LIST_TASKS,
    BUILTIN_TOOLS.TRACKER_VISUALIZE
  ];
}

// After:
function getReadOnlyTools() {
  return [
    BUILTIN_TOOLS.READ_FILE,
    BUILTIN_TOOLS.READ_MANY_FILES,
    BUILTIN_TOOLS.GREP_SEARCH,
    BUILTIN_TOOLS.GLOB,
    BUILTIN_TOOLS.LIST_DIRECTORY,
    BUILTIN_TOOLS.GOOGLE_WEB_SEARCH,
    BUILTIN_TOOLS.WEB_FETCH,
    BUILTIN_TOOLS.ASK_USER,
    BUILTIN_TOOLS.GET_INTERNAL_DOCS,
    BUILTIN_TOOLS.TRACKER_GET_TASK,
    BUILTIN_TOOLS.TRACKER_LIST_TASKS,
    BUILTIN_TOOLS.TRACKER_VISUALIZE
  ];
}
```

**설계 근거**:
- `TOOL_ANNOTATIONS`의 `readOnlyHint`가 Gemini CLI의 공식 신뢰 모델 기준
- `getReadOnlyTools()`는 readonly 에이전트(gap-detector, code-analyzer 등)에 도구 제한용
- 제거된 3개 도구: `ACTIVATE_SKILL`(스킬 활성화 = 상태 변경), `WRITE_TODOS`(할일 쓰기), `SAVE_MEMORY`(메모리 쓰기) → 모두 쓰기 동작
- `getStrictReadOnlyTools()`(L225-229)와 일관성 확보

**하위호환 고려**:
- `getReadOnlyTools()`의 반환값이 줄어들지만, 이 함수는 도구 제한용이므로 줄어드는 것이 보안 강화 방향
- readonly 에이전트가 `ACTIVATE_SKILL`이 필요한 경우: docwrite 티어로 승격 필요

**검증 방법**:
```javascript
// getReadOnlyTools()와 TOOL_ANNOTATIONS의 readOnlyHint 교차 검증
const readOnlyTools = getReadOnlyTools();
for (const tool of readOnlyTools) {
  const anno = TOOL_ANNOTATIONS[tool];
  assert(anno.readOnlyHint === true,
    `${tool} in getReadOnlyTools() but readOnlyHint is ${anno.readOnlyHint}`);
}
```

---

## 4. Detailed Design — Phase 2: High Priority

### 4.1 FR-05: SUBAGENT_POLICY_GROUPS full 티어 추가

**문제**: `lib/gemini/policy.js:273-295`에서 `SUBAGENT_POLICY_GROUPS`가 readonly/docwrite 2그룹만 정의. pdca-iterator, cto-lead 등 파일 쓰기+명령 실행이 필요한 에이전트의 정책이 미정의로 사실상 무제한 권한.

**수정 파일**: `lib/gemini/policy.js`

**수정 위치**: L273-295 (SUBAGENT_POLICY_GROUPS)

**수정 내용**:
```javascript
// After: 3티어 완성
const SUBAGENT_POLICY_GROUPS = Object.freeze({
  readonly: {
    description: 'Read-only agents: analysis, validation, guidance',
    agents: [
      'gap-detector', 'design-validator', 'code-analyzer',
      'security-architect', 'qa-monitor', 'qa-strategist',
      'starter-guide', 'pipeline-guide'
    ],
    rules: [
      { toolName: 'run_shell_command', decision: 'deny', priority: 100 },
      { toolName: 'write_file', decision: 'deny', priority: 100 },
      { toolName: 'replace', decision: 'deny', priority: 100 }
    ]
  },
  docwrite: {
    description: 'Document-writing agents: reports, specs, design docs',
    agents: [
      'report-generator', 'product-manager', 'infra-architect',
      'frontend-architect', 'bkend-expert', 'enterprise-expert'
    ],
    rules: [
      { toolName: 'run_shell_command', decision: 'deny', priority: 100 }
    ]
  },
  full: {
    description: 'Full-access agents: implementation, iteration, orchestration',
    agents: [
      'pdca-iterator', 'cto-lead', 'pm-lead'
    ],
    rules: [
      // Full access but still deny destructive operations
      { toolName: 'run_shell_command', commandPrefix: 'rm -rf /', decision: 'deny', priority: 100 },
      { toolName: 'run_shell_command', commandPrefix: 'git push --force', decision: 'deny', priority: 100 }
    ]
  }
});
```

**변경 사항**:
1. **readonly에서 제거**: `bkend-expert`, `enterprise-expert` → docwrite로 이동 (S-03 대응: 코드 생성 필요)
2. **full 티어 신규**: `pdca-iterator`, `cto-lead`, `pm-lead` — 파일 쓰기와 명령 실행이 필요하지만 파괴적 명령은 차단
3. **docwrite 확장**: `bkend-expert`, `enterprise-expert` 추가 — 문서뿐 아니라 코드 파일도 생성 가능해야 함

**검증 방법**:
```javascript
// 모든 에이전트가 정확히 하나의 티어에 속하는지 확인
const allAgents = new Set();
for (const group of Object.values(SUBAGENT_POLICY_GROUPS)) {
  for (const agent of group.agents) {
    assert(!allAgents.has(agent), `${agent} is in multiple groups`);
    allAgents.add(agent);
  }
}
```

---

### 4.2 FR-06: session-start.js 컨텍스트 중복 섹션 제거

**문제**: `hooks/scripts/session-start.js:261-309`의 `generateDynamicContext()`에서 `buildAgentTriggersSection()`, `buildFeatureReportSection()`, `buildAutoTriggerSection()`이 항상 호출되지만, 이 내용은 `loadPhaseAwareContext()`의 `agent-triggers.md`, `feature-report.md`, `skill-triggers.md`와 중복. idle 상태에서 약 550 토큰 낭비.

**수정 파일**: `hooks/scripts/session-start.js`

**수정 위치**: L261-309 (generateDynamicContext 함수)

**수정 내용**:
```javascript
// Before:
function generateDynamicContext(pdcaStatus, level, memory, returningInfo, outputStyle, pluginRoot, trackerContext) {
  const sections = [];
  // ... (기존 섹션들)

  // Phase-Aware Context
  const phaseContext = loadPhaseAwareContext(pluginRoot, currentPhase);
  if (phaseContext) {
    sections.push(phaseContext);
  }

  // 아래 3개는 Phase-Aware Context와 중복
  sections.push(buildAgentTriggersSection());     // REMOVE
  sections.push(buildFeatureReportSection());      // REMOVE
  sections.push(buildAutoTriggerSection());        // REMOVE

  return sections.join('\n');
}

// After:
function generateDynamicContext(pdcaStatus, level, memory, returningInfo, outputStyle, pluginRoot, trackerContext) {
  const sections = [];

  sections.push('# bkit Vibecoding Kit v2.0.0 - Session Start');
  sections.push('');
  sections.push(buildCoreRules());
  sections.push(buildOnboardingSection(returningInfo, level));

  if (outputStyle.rules) {
    sections.push(buildOutputStyleSection(outputStyle));
  }

  if (trackerContext) {
    sections.push(trackerContext);
  }

  sections.push(buildPdcaStatusSection(pdcaStatus, level));
  sections.push(buildAvailableSkillsSection(level));

  // Phase-Aware Context가 agent-triggers, feature-report, skill-triggers를 포함
  // idle 단계에서 PHASE_CONTEXT_MAP이 이 파일들을 로드하므로 인라인 빌더 불필요
  const currentPhase = pdcaStatus.primaryFeature
    ? (pdcaStatus.features?.[pdcaStatus.primaryFeature]?.phase ||
       pdcaStatus.activeFeatures?.[pdcaStatus.primaryFeature]?.phase)
    : null;
  const phaseContext = loadPhaseAwareContext(pluginRoot, currentPhase);
  if (phaseContext) {
    sections.push(phaseContext);
  }

  // 중복 제거: buildAgentTriggersSection(), buildFeatureReportSection(),
  // buildAutoTriggerSection()은 Phase-Aware Context에서 로드됨

  return sections.join('\n');
}
```

**PHASE_CONTEXT_MAP 검증**:
| 함수 | 대응 컨텍스트 파일 | idle에서 로드 | 비-idle에서 로드 |
|------|-------------------|-------------|----------------|
| `buildAgentTriggersSection()` | `agent-triggers.md` | Yes (idle) | No → 필요 시 PHASE_CONTEXT_MAP에 추가 |
| `buildFeatureReportSection()` | `feature-report.md` | Yes (모든 단계) | Yes (모든 단계) |
| `buildAutoTriggerSection()` | `skill-triggers.md` | Yes (idle, do) | Yes (do) |

**보완 조치**: `agent-triggers.md`가 idle에서만 로드되므로, 비-idle 단계에서도 에이전트 트리거 정보가 필요한 경우를 대비해 `PHASE_CONTEXT_MAP`의 모든 단계에 추가:

```javascript
// PHASE_CONTEXT_MAP 보완 (선택사항 - 현재는 idle에서만 필요)
// 현재 idle 외 단계에서 agent-triggers가 필요한 유즈케이스는 없으므로 변경하지 않음
```

**예상 토큰 절감**: ~550 토큰 (buildAgentTriggersSection ~300 + buildFeatureReportSection ~150 + buildAutoTriggerSection ~100)

---

### 4.3 FR-07: PHASE_CONTEXT_MAP 파일 존재 검증

**문제**: `hooks/scripts/session-start.js:198-204`의 `PHASE_CONTEXT_MAP`이 참조하는 파일의 존재 여부를 `loadPhaseAwareContext()`에서 silent 무시. 존재하지 않는 파일 참조 시 컨텍스트 누락으로 할루시네이션 유발 가능.

**수정 파일**: `hooks/scripts/session-start.js`

**수정 위치**: L207-226 (loadPhaseAwareContext 함수)

**수정 내용**:
```javascript
// After: 누락 파일 경고 추가
function loadPhaseAwareContext(pluginRoot, phase) {
  const effectivePhase = phase && PHASE_CONTEXT_MAP[phase] ? phase : 'idle';
  const files = PHASE_CONTEXT_MAP[effectivePhase];
  const contextDir = path.join(pluginRoot, '.gemini', 'context');

  const sections = [];
  const missing = [];

  for (const fileName of files) {
    const filePath = path.join(contextDir, fileName);
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8').trim();
        if (content) sections.push(content);
      } else {
        missing.push(fileName);
      }
    } catch (e) { /* non-fatal */ }
  }

  // Debug: 누락 파일 기록 (BKIT_DEBUG=true 시)
  if (missing.length > 0 && process.env.BKIT_DEBUG === 'true') {
    try {
      const adapter = require(path.join(libPath, 'gemini', 'platform'));
      adapter.getAdapter().debugLog('context', `Missing phase context files for ${effectivePhase}`, { missing });
    } catch (e) { /* ignore */ }
  }

  return sections.length > 0
    ? `## Phase-Aware Context (${effectivePhase})\n\n${sections.join('\n\n')}`
    : '';
}
```

**설계 근거**:
- 운영 모드: 기존과 동일하게 silent 무시 (사용자 경험 보호)
- 디버그 모드: `BKIT_DEBUG=true` 시 누락 파일을 로그에 기록 (개발자용 진단)
- 성능 영향: 없음 (기존 `fs.existsSync` 분기에 else 추가만)

---

## 5. Detailed Design — Phase 3: Medium Priority

### 5.1 FR-09/10: tool-reference 파일 정리

**현황**: `.gemini/context/`에 `tool-reference.md`(v1)와 `tool-reference-v2.md` 공존

**수정 사항**:
1. `.gemini/context/tool-reference.md` 삭제
2. `PHASE_CONTEXT_MAP`의 `do` 단계에서 `tool-reference.md` → `tool-reference-v2.md`로 변경

```javascript
// session-start.js PHASE_CONTEXT_MAP 수정
const PHASE_CONTEXT_MAP = {
  plan:   ['commands.md', 'pdca-rules.md', 'feature-report.md', 'executive-summary-rules.md'],
  design: ['pdca-rules.md', 'feature-report.md', 'executive-summary-rules.md'],
  do:     ['tool-reference-v2.md', 'skill-triggers.md', 'feature-report.md'],  // Changed
  check:  ['pdca-rules.md', 'feature-report.md'],
  act:    ['pdca-rules.md', 'feature-report.md'],
  idle:   ['commands.md', 'pdca-rules.md', 'agent-triggers.md', 'skill-triggers.md', 'feature-report.md']
};
```

---

### 5.2 FR-08: BKIT_PROJECT_DIR deprecation 경고

**수정 파일**: `lib/core/platform.js`

**수정 위치**: L78

**수정 내용**:
```javascript
// Before (L76-78):
/**
 * Legacy alias
 */
const BKIT_PROJECT_DIR = PROJECT_DIR;

// After:
/**
 * @deprecated Use PROJECT_DIR or getProjectDir() instead. Will be removed in v2.1.0.
 */
const BKIT_PROJECT_DIR = PROJECT_DIR;
```

**설계 근거**: JSDoc `@deprecated` 태그만 추가. 런타임 경고는 추가하지 않음 (YAGNI — 사용처가 테스트 1건뿐).

---

### 5.3 FR-11: agent-memory 접근 제어 문서화

**수정 유형**: 문서 추가 (코드 변경 없음)

`.gemini/agent-memory/bkit/` 디렉토리의 16개 에이전트 메모리 파일에 대한 접근 정책을 GEMINI.md 또는 별도 문서에 명시:

| 에이전트 | 메모리 파일 | 접근 범위 | 티어 |
|----------|-----------|----------|------|
| gap-detector | gap-detector.json | 자신만 읽기 | readonly |
| code-analyzer | code-analyzer.json | 자신만 읽기 | readonly |
| report-generator | report-generator.json | 자신 + 읽기(모든 분석 에이전트) | docwrite |
| pdca-iterator | pdca-iterator.json | 자신 + 읽기/쓰기(gap-detector) | full |
| cto-lead | cto-lead.json | 모든 에이전트 메모리 읽기/쓰기 | full |

**구현 방법**: 현재 Gemini CLI에서 에이전트별 파일 접근 제어 API가 없으므로, 정책 문서로 가이드만 제공. v2.1.0에서 ACP 도입 시 프로그래밍 방식 격리 구현 예정.

---

## 6. Test Plan

### 6.1 기존 테스트 수정

| TC Suite | 수정 필요 | 수정 내용 |
|----------|----------|----------|
| TC-81 (Tools) | Yes | `getReadOnlyTools()` 반환값에서 3개 도구 제거 검증 |
| TC-84 (Policy) | Yes | `SUBAGENT_POLICY_GROUPS.full` 존재 및 규칙 검증 |
| TC-88 (Session Start) | Yes | `metadata.version === '2.0.0'` 검증, 중복 섹션 미생성 검증 |
| TC-95 (Architecture) | No | 기존 통과 유지 |
| TC-91 (Security) | No | 기존 통과 유지 |

### 6.2 신규 테스트 케이스

| TC ID | 대상 | 검증 항목 | 우선순위 |
|-------|------|----------|---------|
| TC-96-01 | version.js | `getFeatureFlags()`에 hasPolicyEngine 등 5개 플래그 존재 확인 | Critical |
| TC-96-02 | version.js-policy.js | 플래그 존재 시 `generatePolicyFile()` 정상 실행 확인 | Critical |
| TC-96-03 | tools.js | `getReadOnlyTools()` ⊆ `getStrictReadOnlyTools()` 교차 검증 | Critical |
| TC-96-04 | tools.js | `getReadOnlyTools()`의 모든 도구가 `readOnlyHint: true`인지 확인 | Critical |
| TC-96-05 | context-fork.js | 루트 `.pdca-status.json`만 존재할 때 `readPdcaStatus()` 정상 반환 | Critical |
| TC-96-06 | context-fork.js | `docs/.pdca-status.json` 미존재 시 fallback 경로 정상 작동 | Critical |
| TC-96-07 | context-fork.js | `forkContext()` 호출 시 실제 상태 데이터 포함 확인 | High |
| TC-96-08 | session-start.js | idle 컨텍스트 출력에 중복 섹션 미포함 확인 | High |
| TC-96-09 | session-start.js | PHASE_CONTEXT_MAP 참조 파일 전체 존재 확인 | High |
| TC-96-10 | policy.js | `SUBAGENT_POLICY_GROUPS`의 모든 에이전트가 정확히 1개 그룹 소속 | High |
| TC-96-11 | policy.js | full 티어 에이전트의 파괴적 명령 deny 확인 | High |
| TC-96-12 | session-start.js | `PHASE_CONTEXT_MAP.do`에 `tool-reference-v2.md` 참조 | Medium |

---

## 7. Implementation Order (Checklist)

### Phase 1: Critical (Day 1)

- [ ] **7.1** `lib/gemini/version.js` — getFeatureFlags()에 5개 플래그 복원 (FR-G05)
- [ ] **7.2** `hooks/scripts/session-start.js:79` — version '1.5.9' → '2.0.0' (FR-01)
- [ ] **7.3** `lib/gemini/context-fork.js` — readPdcaStatus()/readMemory() 경로 위임 (FR-02/03)
- [ ] **7.4** `lib/gemini/tools.js` — getReadOnlyTools()에서 3개 도구 제거 (FR-04)
- [ ] **7.5** 기존 754 TC 전체 통과 확인

### Phase 2: High (Day 2)

- [ ] **7.6** `lib/gemini/policy.js` — SUBAGENT_POLICY_GROUPS full 티어 추가 (FR-05)
- [ ] **7.7** `hooks/scripts/session-start.js` — 중복 섹션 3개 제거 (FR-06)
- [ ] **7.8** `hooks/scripts/session-start.js` — loadPhaseAwareContext 누락 파일 경고 (FR-07)
- [ ] **7.9** TC-96-01~11 신규 테스트 작성 및 통과 확인

### Phase 3: Medium (Day 3)

- [ ] **7.10** `.gemini/context/tool-reference.md` 삭제 (FR-09)
- [ ] **7.11** `PHASE_CONTEXT_MAP.do` → `tool-reference-v2.md`로 변경 (FR-10)
- [ ] **7.12** `lib/core/platform.js` — BKIT_PROJECT_DIR @deprecated 주석 추가 (FR-08)
- [ ] **7.13** agent-memory 접근 제어 정책 문서 작성 (FR-11)
- [ ] **7.14** TC-96-12 + 전체 회귀 테스트 통과 확인

---

## 8. Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| getReadOnlyTools() 변경으로 readonly 에이전트 기능 제한 | Medium | Low | docwrite 티어 승격으로 해결 가능 |
| version.js 플래그 복원 시 다른 모듈 부작용 | Low | Very Low | 키 추가만 수행, 기존 키 불변 |
| session-start.js 중복 제거 시 비-idle 단계 정보 누락 | Medium | Low | PHASE_CONTEXT_MAP이 모든 단계에서 feature-report.md 로드 확인 완료 |
| context-fork.js require() 실패 시 fallback 작동 여부 | Low | Very Low | try-catch + v2.0.0 표준 경로 fallback |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-20 | Initial draft — 13 FR detailed design | CTO Lead (Agent Team) |
