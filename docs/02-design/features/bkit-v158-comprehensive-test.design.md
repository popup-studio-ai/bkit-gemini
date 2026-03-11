# bkit-v158-comprehensive-test Design Document

> **Summary**: bkit-gemini v1.5.8 종합 테스트 885 TC의 구현 설계서. Gemini CLI 환경에서 실행 가능한 테스트 코드 아키텍처.
>
> **Project**: bkit-gemini
> **Version**: v1.5.8
> **Author**: CTO Team
> **Date**: 2026-03-11
> **Status**: Draft
> **Planning Doc**: [bkit-v158-comprehensive-test.plan.md](../01-plan/features/bkit-v158-comprehensive-test.plan.md)

---

## 1. Overview

### 1.1 Design Goals

1. 885+ TC를 `node tests/run-all.js` 한 번으로 실행 가능
2. 외부 의존성 없이 Node.js 자체 assert만 사용 (기존 test-utils.js 패턴 유지)
3. 기존 TC-01~TC-24 구조와 100% 호환
4. Sprint별/관점별/우선순위별 선택적 실행 지원
5. Gemini CLI 환경에서 `run_shell_command`로 바로 실행 가능

### 1.2 Design Principles

- **기존 패턴 완전 준수**: test-utils.js의 assert/assertEqual/assertContains/assertExists + setup/teardown 패턴 유지
- **격리 테스트**: createTestProject()로 임시 프로젝트 생성, teardown으로 정리
- **버전 게이팅**: withVersion() 래퍼로 환경변수 + 캐시 자동 관리
- **Zero External Dependencies**: npm install 없이 즉시 실행
- **Graceful Failure**: 개별 TC 실패가 전체 스위트를 중단하지 않음

---

## 2. Architecture

### 2.1 테스트 러너 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    tests/run-all.js                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ --sprint │  │--category│  │--priority│  │ --suite  │   │
│  │  1~4     │  │  unit    │  │  P0~P2   │  │  tc25    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       └──────────────┴────────────┴──────────────┘          │
│                          │                                   │
│                    Suite Filter                              │
│                          │                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Suite Registry (78 entries)              │    │
│  │  { name, file, priority, category, sprint }          │    │
│  └─────────────────────┬───────────────────────────────┘    │
│                        │                                     │
│  ┌─────────┬───────────┼───────────┬─────────┐              │
│  ▼         ▼           ▼           ▼         ▼              │
│ tc01    tc25~38    tc39~43    tc44~49    tc75~78            │
│ (기존)  (Unit)     (E2E)     (통합)     (인프라)             │
└─────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────┐
│   tests/test-utils.js │──→ assert, assertEqual, assertContains, assertExists
│                       │──→ createTestProject, cleanupTestProject
│                       │──→ executeHook, sendMcpRequest
│                       │──→ withVersion, countMatches
│                       │──→ readPdcaStatus, readGlobalMemory
└──────────────────────┘
           │
           ▼
┌──────────────────────┐
│   tests/fixtures.js   │──→ PDCA_STATUS_FIXTURE, BKIT_MEMORY_FIXTURE
│   (v1.5.8 확장)       │──→ PDCA_STATUS_V158, TEAM_CONFIG_FIXTURE
│                       │──→ MULTILANG_FIXTURE, HOOK_INPUT_FIXTURES
└──────────────────────┘
```

### 2.2 Suite 파일 구조

```
tests/
├── run-all.js                  # 메인 러너 (v1.5.8 확장)
├── test-utils.js               # 유틸리티 (기존 유지 + assertThrows 추가)
├── fixtures.js                 # 픽스처 (v1.5.8 확장)
├── suites/
│   ├── tc01-hooks.js ~ tc24-runtime-hooks.js    # 기존 24개 (수정 없음)
│   │
│   │  ── 관점 1: Unit Test (14 파일, ~200 TC) ──
│   ├── tc25-tool-registry-v158.js       # 20 TC
│   ├── tc26-version-detector-v158.js    # 25 TC
│   ├── tc27-skill-orchestrator-v158.js  # 20 TC
│   ├── tc28-multilang-intent.js         # 25 TC
│   ├── tc29-pdca-modules.js             # 25 TC
│   ├── tc30-core-modules.js             # 30 TC
│   ├── tc31-team-modules.js             # 40 TC
│   ├── tc32-paths-registry.js           # 15 TC
│   ├── tc33-task-modules.js             # 20 TC
│   ├── tc34-adapters-gemini.js          # 25 TC
│   ├── tc35-adapters-common.js          # 10 TC
│   ├── tc36-config-extension-v158.js    # 15 TC
│   ├── tc37-context-hierarchy.js        # 10 TC
│   ├── tc38-feature-flags-matrix.js     # 15 TC
│   │
│   │  ── 관점 2: E2E Test (5 파일, ~63 TC) ──
│   ├── tc39-pdca-e2e-v158.js            # 18 TC
│   ├── tc40-hook-system-e2e.js          # 15 TC
│   ├── tc41-team-orchestration-e2e.js   # 12 TC
│   ├── tc42-skill-activation-e2e.js     # 10 TC
│   ├── tc43-mcp-command-e2e.js          # 8 TC
│   │
│   │  ── 관점 3: 통합 (6 파일, ~83 TC) ──
│   ├── tc44-agent-integration-v158.js   # 18 TC
│   ├── tc45-skill-integration-v158.js   # 18 TC
│   ├── tc46-context-engineering.js      # 15 TC
│   ├── tc47-config-interop.js           # 12 TC
│   ├── tc48-command-integration.js      # 10 TC
│   ├── tc49-hook-lib-config-chain.js    # 10 TC
│   │
│   │  ── 관점 4: 시나리오 (5 파일, ~50 TC) ──
│   ├── tc50-scenario-starter.js         # 10 TC
│   ├── tc51-scenario-dynamic.js         # 10 TC
│   ├── tc52-scenario-enterprise.js      # 10 TC
│   ├── tc53-scenario-pm-workflow.js     # 10 TC
│   ├── tc54-scenario-multilang.js       # 10 TC
│   │
│   │  ── 관점 5: 철학 (5 파일, ~50 TC) ──
│   ├── tc55-philosophy-context-eng.js   # 12 TC
│   ├── tc56-philosophy-pdca.js          # 15 TC
│   ├── tc57-philosophy-no-guessing.js   # 10 TC
│   ├── tc58-philosophy-disclosure.js    # 8 TC
│   ├── tc59-philosophy-ai-native.js     # 5 TC
│   │
│   │  ── 관점 6: 보안/호환성 (4 파일, ~45 TC) ──
│   ├── tc60-security-sanitization.js    # 12 TC
│   ├── tc61-security-version.js         # 10 TC
│   ├── tc62-security-permission.js      # 10 TC
│   ├── tc63-compatibility-matrix.js     # 13 TC
│   │
│   │  ── 관점 7: 에지 케이스 (5 파일, ~50 TC) ──
│   ├── tc64-edge-null-undefined.js      # 10 TC
│   ├── tc65-edge-empty-malformed.js     # 12 TC
│   ├── tc66-edge-unicode-special.js     # 10 TC
│   ├── tc67-edge-concurrency.js         # 8 TC
│   ├── tc68-edge-filesystem.js          # 10 TC
│   │
│   │  ── 관점 8: 경계값 (3 파일, ~35 TC) ──
│   ├── tc69-boundary-version.js         # 12 TC
│   ├── tc70-boundary-config.js          # 12 TC
│   ├── tc71-boundary-datasize.js        # 11 TC
│   │
│   │  ── 관점 9: 에러 복구 (3 파일, ~35 TC) ──
│   ├── tc72-recovery-file-corruption.js # 12 TC
│   ├── tc73-recovery-module-missing.js  # 12 TC
│   ├── tc74-recovery-cache-state.js     # 11 TC
│   │
│   │  ── 관점 10: 인프라/리소스 (4 파일, ~55 TC) ──
│   ├── tc75-output-styles.js            # 12 TC
│   ├── tc76-template-system.js          # 15 TC
│   ├── tc77-hook-scripts-individual.js  # 18 TC
│   └── tc78-hook-config-runtime.js      # 10 TC
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| run-all.js | test-utils.js | Suite 로딩/실행 |
| 모든 tc*.js | test-utils.js | assert, createTestProject 등 |
| tc25~tc38 | lib/**/*.js | 실제 모듈 require 후 Unit 검증 |
| tc39~tc43 | hooks/scripts/*.js, lib/**/*.js | E2E 워크플로우 시뮬레이션 |
| tc44~tc49 | agents/*.md, skills/*/SKILL.md | 파일 존재/구조 검증 |
| tc50~tc54 | lib/intent/*.js, lib/pdca/*.js | 시나리오 시뮬레이션 |
| tc60~tc63 | lib/adapters/gemini/version-detector.js | 버전별 플래그 매트릭스 |
| tc75~tc78 | output-styles/*.md, templates/*.md, hooks/ | 인프라 파일 검증 |

---

## 3. Data Model

### 3.1 Suite Registry Entry

```javascript
// run-all.js의 Suite 등록 구조
const suiteEntry = {
  name: 'TC-25: Tool Registry v1.5.8',   // 표시 이름
  file: 'suites/tc25-tool-registry-v158.js', // 파일 경로
  priority: 'P0',                         // P0|P1|P2
  category: 'unit',                       // unit|e2e|integration|scenario|philosophy|security|edge|boundary|recovery|infra
  sprint: 1                               // 1~4
};
```

### 3.2 Test Case 구조 (기존 패턴 유지)

```javascript
// 각 suite 파일의 tests 배열 구조
const test = {
  name: 'TC25-01: TOOL_PARAM_CHANGES 구조 검증',  // TC ID + 설명
  setup: () => { /* 사전 준비 (선택) */ },
  fn: () => { /* 검증 로직 (필수) */ },
  teardown: () => { /* 정리 (선택) */ },
  skip: false  // true면 건너뛰기 (선택)
};
```

### 3.3 확장 Fixture 구조

```javascript
// fixtures.js에 추가할 v1.5.8 전용 픽스처

// PDCA Status v1.5.8 (team 관련 필드 포함)
const PDCA_STATUS_V158 = {
  version: '2.0',
  primaryFeature: 'test-feature',
  activeFeatures: {
    'test-feature': {
      phase: 'plan',
      matchRate: null,
      iterationCount: 0,
      lastUpdated: new Date().toISOString(),
      documents: {
        plan: 'docs/01-plan/features/test-feature.plan.md'
      }
    }
  },
  archivedFeatures: {},
  pipeline: { level: 'Dynamic', currentPhase: 3, phaseHistory: [] },
  lastChecked: new Date().toISOString()
};

// 다중 Feature 상태 (TC-39 E2E용)
const PDCA_STATUS_MULTI = {
  version: '2.0',
  primaryFeature: 'feature-a',
  activeFeatures: {
    'feature-a': { phase: 'plan', matchRate: null, iterationCount: 0 },
    'feature-b': { phase: 'do', matchRate: null, iterationCount: 0 },
    'feature-c': { phase: 'completed', matchRate: 100, iterationCount: 2, completedAt: new Date().toISOString() }
  },
  archivedFeatures: {},
  pipeline: { level: 'Enterprise', currentPhase: 9, phaseHistory: [] },
  lastChecked: new Date().toISOString()
};

// Team Config 픽스처 (TC-31, TC-41용)
const TEAM_CONFIG_FIXTURE = {
  enabled: true,
  defaultStrategy: 'balanced',
  strategies: {
    Starter: { maxAgents: 1 },
    Dynamic: { maxAgents: 3 },
    Enterprise: { maxAgents: 10 }
  },
  orchestrationPatterns: ['leader', 'council', 'swarm', 'pipeline', 'watchdog'],
  communication: { protocol: 'task-tracker' }
};

// 다국어 테스트 입력 (TC-28, TC-54용)
const MULTILANG_INPUTS = {
  ko: { verify: '검증해줘', improve: '개선해줘', report: '보고서 작성해줘', help: '도움이 필요해' },
  ja: { verify: 'コード確認して', improve: '改善して', report: '報告書作成', help: '助けて' },
  zh: { verify: '验证代码', improve: '改进代码', report: '生成报告', help: '帮助我' },
  es: { verify: 'verificar código', improve: 'mejorar código', report: 'informe', help: 'ayuda' },
  fr: { verify: 'vérifier le code', improve: 'améliorer', report: 'rapport', help: 'aide' },
  de: { verify: 'Code prüfen', improve: 'verbessern', report: 'Bericht', help: 'Hilfe' },
  it: { verify: 'verificare codice', improve: 'migliorare', report: 'rapporto', help: 'aiuto' },
  en: { verify: 'verify code', improve: 'improve code', report: 'generate report', help: 'help me' }
};

// Hook 입력 픽스처 (TC-40, TC-77용)
const HOOK_INPUT = {
  sessionStart: {},
  beforeTool: {
    toolName: 'run_shell_command',
    input: { command: 'git status' }
  },
  afterTool: {
    toolName: 'write_file',
    input: { file_path: 'src/app.js' },
    output: { success: true }
  },
  beforeToolDeny: {
    toolName: 'run_shell_command',
    input: { command: 'rm -rf /' }
  }
};

// 레벨 감지 픽스처 (TC-50~TC-52용)
const LEVEL_DETECTION = {
  enterprise: { dirs: ['kubernetes'], files: [] },
  dynamic: { dirs: [], files: ['.mcp.json', 'docker-compose.yml'] },
  starter: { dirs: [], files: [] }  // 빈 프로젝트
};
```

---

## 4. 코어 구현 상세 설계

### 4.1 test-utils.js 확장

기존 test-utils.js에 최소한의 추가만 수행:

```javascript
// === 추가할 유틸리티 ===

/**
 * Assert that a function throws an error
 * @param {Function} fn - 에러를 발생시켜야 하는 함수
 * @param {string} message - 실패 시 메시지
 */
function assertThrows(fn, message) {
  let threw = false;
  try { fn(); } catch { threw = true; }
  if (!threw) throw new Error(`ASSERT FAILED: ${message} (expected error but none thrown)`);
}

/**
 * Assert value is of specific type
 */
function assertType(value, type, message) {
  if (typeof value !== type) {
    throw new Error(`ASSERT FAILED: ${message}\n  Expected type: ${type}\n  Actual type: ${typeof value}`);
  }
}

/**
 * Assert array length
 */
function assertLength(arr, length, message) {
  if (!Array.isArray(arr)) throw new Error(`ASSERT FAILED: ${message} (not an array)`);
  if (arr.length !== length) {
    throw new Error(`ASSERT FAILED: ${message}\n  Expected length: ${length}\n  Actual length: ${arr.length}`);
  }
}

/**
 * Assert object has key
 */
function assertHasKey(obj, key, message) {
  if (!(key in obj)) {
    throw new Error(`ASSERT FAILED: ${message}\n  Key "${key}" not found in object`);
  }
}

/**
 * Assert value is within range [min, max]
 */
function assertInRange(value, min, max, message) {
  if (value < min || value > max) {
    throw new Error(`ASSERT FAILED: ${message}\n  ${value} not in [${min}, ${max}]`);
  }
}

/**
 * Parse YAML frontmatter from .md file (for agent/skill validation)
 */
function parseYamlFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const yaml = {};
  match[1].split('\n').forEach(line => {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) yaml[key.trim()] = rest.join(':').trim();
  });
  return yaml;
}
```

### 4.2 run-all.js 확장

```javascript
// run-all.js v1.5.8 - 확장된 Suite Registry

const suites = [
  // ═══ 기존 TC-01~TC-24 (변경 없음) ═══
  { name: 'TC-04: Lib Modules', file: 'suites/tc04-lib-modules.js', priority: 'P0', category: 'unit', sprint: 1 },
  { name: 'TC-01: Hook System', file: 'suites/tc01-hooks.js', priority: 'P0', category: 'unit', sprint: 1 },
  // ... (기존 24개 그대로 유지, category/sprint 필드만 추가)

  // ═══ 관점 1: Unit Test (TC-25~TC-38) ═══
  { name: 'TC-25: Tool Registry v1.5.8', file: 'suites/tc25-tool-registry-v158.js', priority: 'P0', category: 'unit', sprint: 1 },
  { name: 'TC-26: Version Detector v1.5.8', file: 'suites/tc26-version-detector-v158.js', priority: 'P0', category: 'unit', sprint: 1 },
  { name: 'TC-27: Skill Orchestrator v1.5.8', file: 'suites/tc27-skill-orchestrator-v158.js', priority: 'P1', category: 'unit', sprint: 1 },
  { name: 'TC-28: Multilang Intent', file: 'suites/tc28-multilang-intent.js', priority: 'P1', category: 'unit', sprint: 1 },
  { name: 'TC-29: PDCA Modules', file: 'suites/tc29-pdca-modules.js', priority: 'P0', category: 'unit', sprint: 1 },
  { name: 'TC-30: Core Modules', file: 'suites/tc30-core-modules.js', priority: 'P1', category: 'unit', sprint: 1 },
  { name: 'TC-31: Team Modules', file: 'suites/tc31-team-modules.js', priority: 'P0', category: 'unit', sprint: 1 },
  { name: 'TC-32: Paths Registry', file: 'suites/tc32-paths-registry.js', priority: 'P1', category: 'unit', sprint: 1 },
  { name: 'TC-33: Task Modules', file: 'suites/tc33-task-modules.js', priority: 'P1', category: 'unit', sprint: 1 },
  { name: 'TC-34: Adapters Gemini', file: 'suites/tc34-adapters-gemini.js', priority: 'P1', category: 'unit', sprint: 1 },
  { name: 'TC-35: Adapters Common', file: 'suites/tc35-adapters-common.js', priority: 'P1', category: 'unit', sprint: 1 },
  { name: 'TC-36: Config Extension v1.5.8', file: 'suites/tc36-config-extension-v158.js', priority: 'P0', category: 'unit', sprint: 1 },
  { name: 'TC-37: Context Hierarchy', file: 'suites/tc37-context-hierarchy.js', priority: 'P1', category: 'unit', sprint: 1 },
  { name: 'TC-38: Feature Flags Matrix', file: 'suites/tc38-feature-flags-matrix.js', priority: 'P0', category: 'unit', sprint: 1 },

  // ═══ 관점 2: E2E Test (TC-39~TC-43) ═══
  { name: 'TC-39: PDCA E2E v1.5.8', file: 'suites/tc39-pdca-e2e-v158.js', priority: 'P0', category: 'e2e', sprint: 2 },
  { name: 'TC-40: Hook System E2E', file: 'suites/tc40-hook-system-e2e.js', priority: 'P0', category: 'e2e', sprint: 2 },
  { name: 'TC-41: Team Orchestration E2E', file: 'suites/tc41-team-orchestration-e2e.js', priority: 'P0', category: 'e2e', sprint: 2 },
  { name: 'TC-42: Skill Activation E2E', file: 'suites/tc42-skill-activation-e2e.js', priority: 'P1', category: 'e2e', sprint: 2 },
  { name: 'TC-43: MCP Command E2E', file: 'suites/tc43-mcp-command-e2e.js', priority: 'P1', category: 'e2e', sprint: 2 },

  // ═══ 관점 3: 통합 (TC-44~TC-49) ═══
  { name: 'TC-44: Agent Integration v1.5.8', file: 'suites/tc44-agent-integration-v158.js', priority: 'P1', category: 'integration', sprint: 2 },
  { name: 'TC-45: Skill Integration v1.5.8', file: 'suites/tc45-skill-integration-v158.js', priority: 'P1', category: 'integration', sprint: 2 },
  { name: 'TC-46: Context Engineering', file: 'suites/tc46-context-engineering.js', priority: 'P1', category: 'integration', sprint: 2 },
  { name: 'TC-47: Config Interop', file: 'suites/tc47-config-interop.js', priority: 'P1', category: 'integration', sprint: 2 },
  { name: 'TC-48: Command Integration', file: 'suites/tc48-command-integration.js', priority: 'P1', category: 'integration', sprint: 2 },
  { name: 'TC-49: Hook-Lib-Config Chain', file: 'suites/tc49-hook-lib-config-chain.js', priority: 'P1', category: 'integration', sprint: 2 },

  // ═══ 관점 4: 시나리오 (TC-50~TC-54) ═══
  { name: 'TC-50: Scenario Starter', file: 'suites/tc50-scenario-starter.js', priority: 'P1', category: 'scenario', sprint: 3 },
  { name: 'TC-51: Scenario Dynamic', file: 'suites/tc51-scenario-dynamic.js', priority: 'P1', category: 'scenario', sprint: 3 },
  { name: 'TC-52: Scenario Enterprise', file: 'suites/tc52-scenario-enterprise.js', priority: 'P1', category: 'scenario', sprint: 3 },
  { name: 'TC-53: Scenario PM Workflow', file: 'suites/tc53-scenario-pm-workflow.js', priority: 'P1', category: 'scenario', sprint: 3 },
  { name: 'TC-54: Scenario Multilang', file: 'suites/tc54-scenario-multilang.js', priority: 'P2', category: 'scenario', sprint: 3 },

  // ═══ 관점 5: 철학 (TC-55~TC-59) ═══
  { name: 'TC-55: Philosophy Context Eng', file: 'suites/tc55-philosophy-context-eng.js', priority: 'P1', category: 'philosophy', sprint: 3 },
  { name: 'TC-56: Philosophy PDCA', file: 'suites/tc56-philosophy-pdca.js', priority: 'P1', category: 'philosophy', sprint: 3 },
  { name: 'TC-57: Philosophy No Guessing', file: 'suites/tc57-philosophy-no-guessing.js', priority: 'P1', category: 'philosophy', sprint: 3 },
  { name: 'TC-58: Philosophy Disclosure', file: 'suites/tc58-philosophy-disclosure.js', priority: 'P2', category: 'philosophy', sprint: 3 },
  { name: 'TC-59: Philosophy AI-Native', file: 'suites/tc59-philosophy-ai-native.js', priority: 'P2', category: 'philosophy', sprint: 3 },

  // ═══ 관점 6: 보안/호환성 (TC-60~TC-63) ═══
  { name: 'TC-60: Security Sanitization', file: 'suites/tc60-security-sanitization.js', priority: 'P1', category: 'security', sprint: 4 },
  { name: 'TC-61: Security Version', file: 'suites/tc61-security-version.js', priority: 'P1', category: 'security', sprint: 4 },
  { name: 'TC-62: Security Permission', file: 'suites/tc62-security-permission.js', priority: 'P1', category: 'security', sprint: 4 },
  { name: 'TC-63: Compatibility Matrix', file: 'suites/tc63-compatibility-matrix.js', priority: 'P1', category: 'security', sprint: 4 },

  // ═══ 관점 7: 에지 케이스 (TC-64~TC-68) ═══
  { name: 'TC-64: Edge Null/Undefined', file: 'suites/tc64-edge-null-undefined.js', priority: 'P1', category: 'edge', sprint: 4 },
  { name: 'TC-65: Edge Empty/Malformed', file: 'suites/tc65-edge-empty-malformed.js', priority: 'P1', category: 'edge', sprint: 4 },
  { name: 'TC-66: Edge Unicode/Special', file: 'suites/tc66-edge-unicode-special.js', priority: 'P2', category: 'edge', sprint: 4 },
  { name: 'TC-67: Edge Concurrency', file: 'suites/tc67-edge-concurrency.js', priority: 'P2', category: 'edge', sprint: 4 },
  { name: 'TC-68: Edge Filesystem', file: 'suites/tc68-edge-filesystem.js', priority: 'P1', category: 'edge', sprint: 4 },

  // ═══ 관점 8: 경계값 (TC-69~TC-71) ═══
  { name: 'TC-69: Boundary Version', file: 'suites/tc69-boundary-version.js', priority: 'P2', category: 'boundary', sprint: 4 },
  { name: 'TC-70: Boundary Config', file: 'suites/tc70-boundary-config.js', priority: 'P2', category: 'boundary', sprint: 4 },
  { name: 'TC-71: Boundary DataSize', file: 'suites/tc71-boundary-datasize.js', priority: 'P2', category: 'boundary', sprint: 4 },

  // ═══ 관점 9: 에러 복구 (TC-72~TC-74) ═══
  { name: 'TC-72: Recovery File Corruption', file: 'suites/tc72-recovery-file-corruption.js', priority: 'P1', category: 'recovery', sprint: 4 },
  { name: 'TC-73: Recovery Module Missing', file: 'suites/tc73-recovery-module-missing.js', priority: 'P1', category: 'recovery', sprint: 4 },
  { name: 'TC-74: Recovery Cache State', file: 'suites/tc74-recovery-cache-state.js', priority: 'P1', category: 'recovery', sprint: 4 },

  // ═══ 관점 10: 인프라/리소스 (TC-75~TC-78) ═══
  { name: 'TC-75: Output Styles', file: 'suites/tc75-output-styles.js', priority: 'P1', category: 'infra', sprint: 3 },
  { name: 'TC-76: Template System', file: 'suites/tc76-template-system.js', priority: 'P1', category: 'infra', sprint: 3 },
  { name: 'TC-77: Hook Scripts Individual', file: 'suites/tc77-hook-scripts-individual.js', priority: 'P1', category: 'infra', sprint: 3 },
  { name: 'TC-78: Hook Config Runtime', file: 'suites/tc78-hook-config-runtime.js', priority: 'P1', category: 'infra', sprint: 3 },
];
```

### 4.3 CLI 필터링 구현

```javascript
// run-all.js에 추가할 필터링 로직

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i += 2) {
    opts[args[i].replace('--', '')] = args[i + 1];
  }
  return opts;
}

function filterSuites(suites, opts) {
  let filtered = [...suites];
  if (opts.priority) filtered = filtered.filter(s => s.priority === opts.priority);
  if (opts.category) filtered = filtered.filter(s => s.category === opts.category);
  if (opts.sprint) filtered = filtered.filter(s => s.sprint === parseInt(opts.sprint));
  if (opts.suite) filtered = filtered.filter(s => s.file.includes(opts.suite));
  return filtered;
}

// 사용 예:
// node tests/run-all.js --priority P0
// node tests/run-all.js --category unit
// node tests/run-all.js --sprint 1
// node tests/run-all.js --suite tc25
```

---

## 5. 스위트별 구현 상세 설계

### 5.1 TC-25: tool-registry-v158.js (구현 코드 예시)

```javascript
const { PLUGIN_ROOT, assert, assertEqual, assertContains, assertExists } = require('../test-utils');
const path = require('path');

const {
  BUILTIN_TOOLS, ALL_BUILTIN_TOOL_NAMES, TOOL_PARAM_CHANGES,
  TOOL_CATEGORIES, CLAUDE_TO_GEMINI_MAP, LEGACY_ALIASES, FORWARD_ALIASES,
  TOOL_ANNOTATIONS, getToolParamChanges, getVersionedParamName,
  resolveToolName, isReadOnlyTool
} = require(path.join(PLUGIN_ROOT, 'lib/adapters/gemini/tool-registry'));

const tests = [
  {
    name: 'TC25-01: TOOL_PARAM_CHANGES 3개 키 존재',
    fn: () => {
      const keys = Object.keys(TOOL_PARAM_CHANGES);
      assert(keys.includes('read_file'), 'Should have read_file');
      assert(keys.includes('replace'), 'Should have replace');
      assert(keys.includes('grep_search'), 'Should have grep_search');
    }
  },
  {
    name: 'TC25-02: getToolParamChanges(read_file) 구조',
    fn: () => {
      const changes = getToolParamChanges('read_file');
      assert(changes !== null, 'Should return changes');
      assert(changes.params, 'Should have params');
    }
  },
  // ... 20 TC 전체 구현
];

module.exports = { tests };
```

### 5.2 TC-29: pdca-modules.js (PDCA 모듈 Unit Test 패턴)

```javascript
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, createTestProjectV2,
        cleanupTestProject, assert, assertEqual } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const { loadPdcaStatus, savePdcaStatus, createInitialStatusV2, getPdcaStatusPath }
  = require(path.join(PLUGIN_ROOT, 'lib/pdca/status'));
const { PDCA_PHASES, getNextPdcaPhase, getPreviousPdcaPhase, getPhaseNumber }
  = require(path.join(PLUGIN_ROOT, 'lib/pdca/phase'));
const { detectLevel }
  = require(path.join(PLUGIN_ROOT, 'lib/pdca/level'));

const tests = [
  {
    name: 'TC29-01: loadPdcaStatus 정상 로드',
    setup: () => createTestProjectV2({
      '.pdca-status.json': { version: '2.0', primaryFeature: 'test', activeFeatures: {}, archivedFeatures: {}, pipeline: {}, lastChecked: '' }
    }),
    fn: () => {
      const status = loadPdcaStatus(TEST_PROJECT_DIR);
      assertEqual(status.version, '2.0', 'Should load v2.0 schema');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC29-02: loadPdcaStatus 파일 없을 때 기본 스키마',
    setup: () => createTestProjectV2({}),
    fn: () => {
      const status = loadPdcaStatus(TEST_PROJECT_DIR);
      assertEqual(status.version, '2.0', 'Should create default v2.0');
      assert(status.activeFeatures !== undefined, 'Should have activeFeatures');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC29-14: getNextPdcaPhase(plan) → design',
    fn: () => {
      assertEqual(getNextPdcaPhase('plan'), 'design', 'plan → design');
    }
  },
  {
    name: 'TC29-18: detectLevel Enterprise',
    setup: () => {
      createTestProject({});
      fs.mkdirSync(path.join(TEST_PROJECT_DIR, 'kubernetes'), { recursive: true });
    },
    fn: () => {
      const level = detectLevel(TEST_PROJECT_DIR);
      assertEqual(level, 'Enterprise', 'kubernetes/ → Enterprise');
    },
    teardown: cleanupTestProject
  },
  // ... 25 TC 전체 구현
];

module.exports = { tests };
```

### 5.3 TC-31: team-modules.js (Team 모듈 Unit Test 패턴)

```javascript
const { PLUGIN_ROOT, assert, assertEqual } = require('../test-utils');
const { withVersion } = require('../test-utils');
const path = require('path');

const TeamCoordinator = require(path.join(PLUGIN_ROOT, 'lib/team/coordinator'));
const TeamStrategy = require(path.join(PLUGIN_ROOT, 'lib/team/strategy'));
const CTOLogic = require(path.join(PLUGIN_ROOT, 'lib/team/cto-logic'));
const AgentCommunication = require(path.join(PLUGIN_ROOT, 'lib/team/communication'));
const TaskQueue = require(path.join(PLUGIN_ROOT, 'lib/team/task-queue'));
const StateRecorder = require(path.join(PLUGIN_ROOT, 'lib/team/state-recorder'));
const { PatternSelector, selectPattern } = require(path.join(PLUGIN_ROOT, 'lib/team/pattern-selector'));
const TeamMemory = require(path.join(PLUGIN_ROOT, 'lib/team/memory'));

const tests = [
  {
    name: 'TC31-01: require(lib/team) 모든 export',
    fn: () => {
      const team = require(path.join(PLUGIN_ROOT, 'lib/team'));
      assert(team.TeamCoordinator, 'Should export TeamCoordinator');
      assert(team.TaskQueue, 'Should export TaskQueue');
      assert(team.AgentCommunication, 'Should export AgentCommunication');
    }
  },
  {
    name: 'TC31-11: TaskQueue enqueue/dequeue',
    fn: () => {
      const queue = new TaskQueue();
      queue.enqueue({ id: 'a', priority: 'normal' });
      queue.enqueue({ id: 'b', priority: 'critical' });
      const first = queue.dequeue();
      assertEqual(first.id, 'b', 'Critical should come first');
    }
  },
  {
    name: 'TC31-23: AgentCommunication v0.33.0 native',
    fn: () => {
      withVersion('0.33.0', () => {
        const comm = new AgentCommunication();
        const result = comm.sendTask('gap-detector', { action: 'analyze' });
        assertEqual(result.method, 'native', 'v0.33.0 should use native');
      });
    }
  },
  // ... 40 TC 전체 구현
];

module.exports = { tests };
```

### 5.4 TC-39: pdca-e2e-v158.js (PDCA E2E 패턴)

```javascript
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProjectV2,
        cleanupTestProject, assert, assertEqual, assertExists } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const { loadPdcaStatus, savePdcaStatus } = require(path.join(PLUGIN_ROOT, 'lib/pdca/status'));
const { getPaths, ensureDirectories } = require(path.join(PLUGIN_ROOT, 'lib/core/paths'));

const tests = [
  {
    name: 'TC39-01: Plan→Design→Do→Check(100%)→Report 성공 경로',
    setup: () => createTestProjectV2({}),
    fn: () => {
      const projectDir = TEST_PROJECT_DIR;
      ensureDirectories(projectDir);
      const paths = getPaths(projectDir);

      // 1. Plan 문서 생성 → phase = 'plan'
      const status = loadPdcaStatus(projectDir);
      status.primaryFeature = 'test-e2e';
      status.activeFeatures = status.activeFeatures || {};
      status.activeFeatures['test-e2e'] = {
        phase: 'plan', matchRate: null, iterationCount: 0,
        lastUpdated: new Date().toISOString(),
        documents: { plan: 'docs/01-plan/features/test-e2e.plan.md' }
      };
      savePdcaStatus(status, projectDir);
      fs.mkdirSync(path.dirname(path.join(projectDir, 'docs/01-plan/features/test-e2e.plan.md')), { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'docs/01-plan/features/test-e2e.plan.md'), '## 1. Overview\n## 2. Scope\n## 3. Requirements');

      // 2. Design → phase = 'design'
      const s2 = loadPdcaStatus(projectDir);
      s2.activeFeatures['test-e2e'].phase = 'design';
      s2.activeFeatures['test-e2e'].documents.design = 'docs/02-design/features/test-e2e.design.md';
      savePdcaStatus(s2, projectDir);

      // 3. Do → phase = 'do'
      const s3 = loadPdcaStatus(projectDir);
      s3.activeFeatures['test-e2e'].phase = 'do';
      savePdcaStatus(s3, projectDir);

      // 4. Check → matchRate = 100
      const s4 = loadPdcaStatus(projectDir);
      s4.activeFeatures['test-e2e'].phase = 'check';
      s4.activeFeatures['test-e2e'].matchRate = 100;
      savePdcaStatus(s4, projectDir);

      // 5. Report → completed
      const s5 = loadPdcaStatus(projectDir);
      s5.activeFeatures['test-e2e'].phase = 'completed';
      s5.activeFeatures['test-e2e'].completedAt = new Date().toISOString();
      savePdcaStatus(s5, projectDir);

      // Verify
      const final = loadPdcaStatus(projectDir);
      assertEqual(final.activeFeatures['test-e2e'].phase, 'completed', 'Should be completed');
      assertEqual(final.activeFeatures['test-e2e'].matchRate, 100, 'Should be 100%');
    },
    teardown: cleanupTestProject
  },
  // ... 18 TC 전체 구현
];

module.exports = { tests };
```

### 5.5 TC-40: hook-system-e2e.js (Hook E2E 패턴)

```javascript
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject,
        cleanupTestProject, executeHook, assert, assertEqual, assertContains } = require('../test-utils');

const tests = [
  {
    name: 'TC40-01: session-start.js JSON status=allow',
    setup: () => createTestProject({
      '.pdca-status.json': { version: '2.0', primaryFeature: null, activeFeatures: {}, archivedFeatures: {}, pipeline: { level: 'Starter' }, lastChecked: '' },
      '.bkit/state/memory.json': { data: { session: { sessionCount: 1, platform: 'gemini' } } }
    }),
    fn: () => {
      const result = executeHook('session-start.js');
      assert(result.success || result.output.status === 'allow', 'Should return allow');
      assertEqual(result.output.status, 'allow', 'Status should be allow');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'TC40-02: session-start context에 PDCA Core Rules 포함',
    setup: () => createTestProject({
      '.pdca-status.json': { version: '2.0', primaryFeature: null, activeFeatures: {}, archivedFeatures: {}, pipeline: {}, lastChecked: '' },
      '.bkit/state/memory.json': { data: { session: { sessionCount: 1 } } }
    }),
    fn: () => {
      const result = executeHook('session-start.js');
      if (result.output.context) {
        assertContains(result.output.context, 'PDCA', 'Context should include PDCA rules');
      }
    },
    teardown: cleanupTestProject
  },
  // ... 15 TC 전체 구현
];

module.exports = { tests };
```

### 5.6 TC-44: agent-integration-v158.js (Agent 통합 패턴)

```javascript
const { PLUGIN_ROOT, assert, assertEqual, assertContains, assertExists } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const AGENTS_DIR = path.join(PLUGIN_ROOT, 'agents');

const tests = [
  {
    name: 'TC44-01: 21개 에이전트 파일 존재',
    fn: () => {
      const files = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
      assertEqual(files.length, 21, `Should have 21 agents, found ${files.length}`);
    }
  },
  {
    name: 'TC44-02: 16개 기존 에이전트 Tool Usage Notes 포함',
    fn: () => {
      const pmAgents = ['pm-lead', 'pm-discovery', 'pm-strategy', 'pm-research', 'pm-prd'];
      const files = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
      const existing = files.filter(f => !pmAgents.includes(f.replace('.md', '')));
      let missingCount = 0;
      for (const file of existing) {
        const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
        if (!content.includes('Tool Usage Notes')) missingCount++;
      }
      assertEqual(missingCount, 0, `${missingCount} agents missing Tool Usage Notes`);
    }
  },
  // ... 18 TC 전체 구현
];

module.exports = { tests };
```

### 5.7 TC-75: output-styles.js (인프라 검증 패턴)

```javascript
const { PLUGIN_ROOT, assert, assertEqual, assertContains, assertExists } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const STYLES_DIR = path.join(PLUGIN_ROOT, 'output-styles');
const EXPECTED_STYLES = ['bkit-learning.md', 'bkit-pdca-guide.md', 'bkit-enterprise.md', 'bkit-pdca-enterprise.md'];

const tests = [
  {
    name: 'TC75-01: output-styles/ 4개 파일 존재',
    fn: () => {
      for (const style of EXPECTED_STYLES) {
        assertExists(path.join(STYLES_DIR, style), `Missing ${style}`);
      }
    }
  },
  {
    name: 'TC75-02: bkit-learning.md Output Rules 섹션',
    fn: () => {
      const content = fs.readFileSync(path.join(STYLES_DIR, 'bkit-learning.md'), 'utf-8');
      assertContains(content, '## Output Rules', 'Should have Output Rules section');
    }
  },
  // ... 12 TC 전체 구현
];

module.exports = { tests };
```

### 5.8 TC-76: template-system.js (Template 검증 패턴)

```javascript
const { PLUGIN_ROOT, assert, assertEqual, assertContains, assertExists } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const TEMPLATES_DIR = path.join(PLUGIN_ROOT, 'templates');

const tests = [
  {
    name: 'TC76-01: 13개 루트 템플릿 존재',
    fn: () => {
      const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.md'));
      assert(files.length >= 13, `Should have >=13 root templates, found ${files.length}`);
    }
  },
  {
    name: 'TC76-04: plan.template.md 필수 섹션',
    fn: () => {
      const content = fs.readFileSync(path.join(TEMPLATES_DIR, 'plan.template.md'), 'utf-8');
      assertContains(content, '## 1.', 'Should have section 1');
      assertContains(content, '## 2.', 'Should have section 2');
      assertContains(content, '## 3.', 'Should have section 3');
    }
  },
  // ... 15 TC 전체 구현
];

module.exports = { tests };
```

---

## 6. Error Handling

### 6.1 테스트 레벨 에러 처리

| 상황 | 처리 방식 |
|------|----------|
| 개별 TC 실패 | FAIL 로그 출력, 다음 TC 계속 |
| Suite require 실패 | Suite 전체 SKIP, 에러 로그 |
| setup() 에러 | TC FAIL 처리, teardown 시도 |
| teardown() 에러 | 무시 (다음 TC 계속) |
| 모듈 require 실패 | TC FAIL, 상세 에러 메시지 |
| 타임아웃 (10초) | TC FAIL, 타임아웃 메시지 |

### 6.2 Graceful Degradation 패턴

```javascript
// 모듈이 없을 수 있는 경우의 안전한 require 패턴
function safeRequire(modulePath) {
  try {
    return require(modulePath);
  } catch (e) {
    return null;
  }
}

// 사용 예시 (TC-73 모듈 누락 복구 테스트)
{
  name: 'TC73-01: lib/team/ 누락 → team 비활성',
  fn: () => {
    const team = safeRequire(path.join(PLUGIN_ROOT, 'lib/team-nonexistent'));
    assertEqual(team, null, 'Should return null for missing module');
  }
}
```

---

## 7. Security Considerations

- [x] 테스트 프로젝트는 `/tmp/bkit-test-project/`에 격리 생성
- [x] 실제 Gemini CLI 호출 없음 (모킹/시뮬레이션)
- [x] 환경변수 조작 후 반드시 원복 (withVersion 래퍼)
- [x] 테스트에서 실제 파일 시스템 외부 접근 없음
- [x] rm -rf 등 위험 명령 테스트는 시뮬레이션만 (실제 실행 안 함)

---

## 8. Test Plan (자체 테스트)

### 8.1 테스트 실행 검증

```bash
# 전체 실행 (885+ TC)
node tests/run-all.js

# Sprint별 실행
node tests/run-all.js --sprint 1    # ~419 TC (Unit + 회귀)
node tests/run-all.js --sprint 2    # ~146 TC (E2E + 통합)
node tests/run-all.js --sprint 3    # ~155 TC (시나리오 + 철학 + 인프라)
node tests/run-all.js --sprint 4    # ~165 TC (보안 + 에지 + 경계 + 복구)

# P0만 실행 (빠른 검증)
node tests/run-all.js --priority P0

# 개별 스위트 실행
node tests/run-all.js --suite tc25
```

### 8.2 성공 기준

- P0 전체: 100% PASS
- P1 전체: 90%+ PASS
- 전체 Pass Rate: 95%+
- Critical 이슈: 0건

---

## 9. Implementation Guide

### 9.1 구현 순서

| 순서 | 작업 | 파일 | TC 수 | 의존성 |
|:----:|------|------|:-----:|--------|
| 1 | test-utils.js 확장 | tests/test-utils.js | - | 없음 |
| 2 | fixtures.js 확장 | tests/fixtures.js | - | 없음 |
| 3 | run-all.js 확장 | tests/run-all.js | - | 1, 2 |
| 4 | Sprint 1: Unit TC-25~TC-38 | tests/suites/tc25~tc38*.js | 200 | 3 |
| 5 | Sprint 2: E2E TC-39~TC-43 | tests/suites/tc39~tc43*.js | 63 | 4 |
| 6 | Sprint 2: 통합 TC-44~TC-49 | tests/suites/tc44~tc49*.js | 83 | 4 |
| 7 | Sprint 3: 시나리오 TC-50~TC-54 | tests/suites/tc50~tc54*.js | 50 | 4 |
| 8 | Sprint 3: 철학 TC-55~TC-59 | tests/suites/tc55~tc59*.js | 50 | 4 |
| 9 | Sprint 3: 인프라 TC-75~TC-78 | tests/suites/tc75~tc78*.js | 55 | 3 |
| 10 | Sprint 4: 보안 TC-60~TC-63 | tests/suites/tc60~tc63*.js | 45 | 4 |
| 11 | Sprint 4: 에지 TC-64~TC-68 | tests/suites/tc64~tc68*.js | 50 | 4 |
| 12 | Sprint 4: 경계 TC-69~TC-71 | tests/suites/tc69~tc71*.js | 35 | 4 |
| 13 | Sprint 4: 복구 TC-72~TC-74 | tests/suites/tc72~tc74*.js | 35 | 4 |

### 9.2 구현 규칙

1. **파일 하나 = 하나의 Suite**: `tests/suites/tc{번호}-{이름}.js`
2. **exports 형식**: `module.exports = { tests: [...] }`
3. **TC 이름 규칙**: `TC{스위트}-{번호}: {한글 설명}`
4. **setup/teardown 필수**: 파일 시스템 사용 시 반드시 createTestProject + cleanupTestProject
5. **버전 테스트**: withVersion() 래퍼 사용 또는 try/finally로 환경변수 원복
6. **require 경로**: `path.join(PLUGIN_ROOT, 'lib/...')` 형식 사용
7. **async 지원**: fn이 Promise 반환하면 자동 await

### 9.3 Gemini CLI에서 실행 방법

Gemini CLI 세션에서 직접 실행:

```
# 전체 테스트
run_shell_command: node tests/run-all.js

# Sprint 1만 (가장 중요)
run_shell_command: node tests/run-all.js --sprint 1

# 특정 스위트만
run_shell_command: node tests/run-all.js --suite tc25

# P0만 빠르게
run_shell_command: node tests/run-all.js --priority P0
```

---

## 10. 모듈-TC 매핑 매트릭스

### 10.1 lib/ 모듈별 커버리지

| 모듈 | 파일 수 | 담당 TC | TC 수 |
|------|:-------:|---------|:-----:|
| lib/adapters/gemini/tool-registry.js | 1 | TC-25 | 20 |
| lib/adapters/gemini/version-detector.js | 1 | TC-26, TC-38 | 40 |
| lib/adapters/gemini/policy-migrator.js | 1 | TC-34 | 6 |
| lib/adapters/gemini/hook-adapter.js | 1 | TC-34 | 5 |
| lib/adapters/gemini/tracker-bridge.js | 1 | TC-34 | 4 |
| lib/adapters/gemini/import-resolver.js | 1 | TC-34 | 5 |
| lib/adapters/gemini/context-fork.js | 1 | TC-34 | 3 |
| lib/adapters/ (index, platform) | 2 | TC-35 | 10 |
| lib/core/paths.js | 1 | TC-30, TC-32 | 23 |
| lib/core/memory.js | 1 | TC-30 | 7 |
| lib/core/config.js | 1 | TC-30 | 5 |
| lib/core/cache.js | 1 | TC-30 | 3 |
| lib/core/agent-memory.js | 1 | TC-30 | 3 |
| lib/core/permission.js | 1 | TC-30, TC-62 | 13 |
| lib/core/ (debug, file, io, platform) | 4 | TC-30 | 2 |
| lib/intent/ (language, trigger, ambiguity, patterns) | 5 | TC-28 | 25 |
| lib/pdca/ (status, phase, level, automation, tier) | 6 | TC-29 | 25 |
| lib/task/ (classification, context, creator, dependency, tracker) | 6 | TC-33 | 20 |
| lib/team/ (9 modules) | 9 | TC-31 | 40 |
| lib/skill-orchestrator.js | 1 | TC-27 | 20 |
| lib/context-hierarchy.js | 1 | TC-37 | 10 |
| lib/common.js | 1 | TC-35 | 2 |

### 10.2 비코드 리소스별 커버리지

| 리소스 | 파일 수 | 담당 TC | TC 수 |
|--------|:-------:|---------|:-----:|
| agents/*.md | 21 | TC-44 | 18 |
| skills/*/SKILL.md | 35 | TC-27, TC-45 | 38 |
| commands/*.toml | 24 | TC-43, TC-48 | 18 |
| hooks/scripts/*.js | 10+7 | TC-40, TC-77, TC-78 | 43 |
| context/*.md | 7 | TC-46 | 15 |
| output-styles/*.md | 4 | TC-75 | 12 |
| templates/**/*.md | 26 | TC-76 | 15 |
| bkit.config.json | 1 | TC-36, TC-47 | 15 |
| gemini-extension.json | 1 | TC-36, TC-47 | 6 |
| GEMINI.md | 1 | TC-36, TC-46 | 3 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-11 | Initial draft - 885 TC 구현 설계 | CTO Team |

---

*bkit-gemini v1.5.8 종합 테스트 설계서*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
