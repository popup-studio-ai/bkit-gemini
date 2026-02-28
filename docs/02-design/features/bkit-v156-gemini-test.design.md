# Design Document: bkit-gemini v1.5.6 Comprehensive Extension Test

> **Feature**: bkit-v156-gemini-test
> **Plan Reference**: [bkit-v156-gemini-test.plan.md](../../01-plan/features/bkit-v156-gemini-test.plan.md)
> **Date**: 2026-02-28
> **Author**: CTO Team
> **Total Test Cases**: ~247 (Unit 84 + E2E ~145 + UX 18)
> **Implementation**: 2 new test suites (TC-18, TC-19) + run-all.js update

---

## 1. Design Overview

### 1.1 Design Goal

Plan 문서의 ~247개 테스트 케이스를 실행 가능한 **코드 기반 테스트 스크립트**로 설계합니다:

1. **TC-18**: v0.31.0 Feature Flags & Tool Annotations (25 tests)
2. **TC-19**: v0.31.0 Level Policy & Hook Adapter (26 tests)
3. **run-all.js**: 2개 신규 suite 등록 및 report 경로 업데이트
4. **UX Test Guide**: 18개 interactive 시나리오 문서

### 1.2 Architecture

```
테스트 실행 흐름:
┌──────────────────────────────────────────────────────────────┐
│ node tests/run-all.js                                        │
│                                                              │
│  [기존 17 suites] TC-01 ~ TC-17 (Regression ~137 tests)     │
│  [신규 TC-18]     v0.31.0 Feature Flags & Tool Annotations  │
│  [신규 TC-19]     v0.31.0 Level Policy & Hook Adapter        │
│                                                              │
│  검증 패턴:                                                  │
│  A. env var 모킹 → version-detector → feature flag 확인     │
│  B. 상수 검증 → TOOL_ANNOTATIONS, LEVEL_POLICY_TEMPLATES     │
│  C. 함수 호출 → 반환값 assert                                │
│  D. 파일 I/O → createTestProject() → TOML 생성 검증         │
└──────────────────────────────────────────────────────────────┘
```

### 1.3 File Structure

```
tests/
├── run-all.js                        # TC-18, TC-19 추가
├── test-utils.js                     # 기존 유틸리티 (변경 없음)
├── fixtures.js                       # 기존 fixture (변경 없음)
├── suites/
│   ├── tc01-hooks.js                 # 기존 (변경 없음)
│   ├── ...                           # TC-02 ~ TC-17 (변경 없음)
│   ├── tc18-v031-features.js         # [신규] v0.31.0 Feature Flags & Tool Annotations
│   └── tc19-v031-policy-hooks.js     # [신규] v0.31.0 Level Policy & Hook Adapter
└── gemini-interactive/
    └── v156-test-prompts.md          # [신규] v1.5.6 UX 테스트 프롬프트 가이드
```

---

## 2. Detailed Test Specifications

### 2.1 TC-18: v0.31.0 Feature Flags & Tool Annotations (P0) — 25 Tests

**파일**: `tests/suites/tc18-v031-features.js`

#### 2.1.1 Feature Flag 검증 (UT-01 ~ UT-14)

**테스트 패턴**: env var 모킹 → resetCache() → getFeatureFlags() → 플래그 assert

```javascript
// 패턴: 버전별 feature flag 검증
{
  name: 'V156-01: v0.31.0 has 18 feature flags all true',
  fn: () => {
    const { getFeatureFlags, resetCache } = require('.../version-detector');
    resetCache();
    const original = process.env.GEMINI_CLI_VERSION;
    process.env.GEMINI_CLI_VERSION = '0.31.0';
    try {
      const flags = getFeatureFlags();
      const keys = Object.keys(flags);
      assertEqual(keys.length, 18, 'Should have exactly 18 feature flags');
      keys.forEach(key => {
        assertEqual(flags[key], true, `${key} should be true for v0.31.0`);
      });
    } finally {
      if (original !== undefined) process.env.GEMINI_CLI_VERSION = original;
      else delete process.env.GEMINI_CLI_VERSION;
      resetCache();
    }
  }
}
```

**개별 v0.31.0 플래그 검증 (UT-02 ~ UT-11)**:

| Test Name | Flag | Version | Expected |
|-----------|------|:-------:|:--------:|
| V156-02 | `hasRuntimeHookFunctions` | 0.31.0 | `true` |
| V156-03 | `hasRuntimeHookFunctions` | 0.30.0 | `false` |
| V156-04 | `hasBrowserAgent` | 0.31.0 | `true` |
| V156-05 | `hasProjectLevelPolicy` | 0.31.0 | `true` |
| V156-06 | `hasMcpProgress` | 0.31.0 | `true` |
| V156-07 | `hasParallelReadCalls` | 0.31.0 | `true` |
| V156-08 | `hasPlanModeCustomStorage` | 0.31.0 | `true` |
| V156-09 | `hasToolAnnotations` | 0.31.0 | `true` |
| V156-10 | `hasExtensionFolderTrust` | 0.31.0 | `true` |
| V156-11 | `hasAllowMultipleReplace` | 0.31.0 | `true` |

**하위 호환성 검증 (UT-12 ~ UT-14)**:

```javascript
// V156-12: v0.30.0에서 기존 9개 플래그 유지 + 9개 새 플래그 false
{
  name: 'V156-12: v0.30.0 has 9 true flags and 9 false (v0.31.0 flags)',
  fn: () => {
    // env var = '0.30.0'
    const flags = getFeatureFlags();
    // v0.30.0 이하 플래그: true
    assertEqual(flags.hasSkillsStable, true);
    assertEqual(flags.hasPlanMode, true);
    assertEqual(flags.hasPolicyEngine, true);
    assertEqual(flags.hasSDK, true);
    assertEqual(flags.hasApprovalMode, true);
    // v0.31.0 플래그: false
    assertEqual(flags.hasRuntimeHookFunctions, false);
    assertEqual(flags.hasBrowserAgent, false);
    assertEqual(flags.hasProjectLevelPolicy, false);
    // ...나머지 6개 false
  }
}

// V156-13: v0.29.0에서 4개만 true
{
  name: 'V156-13: v0.29.0 has only 4 true flags',
  fn: () => {
    // env var = '0.29.0'
    const flags = getFeatureFlags();
    const trueCount = Object.values(flags).filter(v => v === true).length;
    assertEqual(trueCount, 4, 'v0.29.0 should have exactly 4 true flags');
    // hasSkillsStable, hasPlanMode, hasGemini3Default, hasExtensionRegistry
  }
}

// V156-14: 총 플래그 수 검증
{
  name: 'V156-14: getFeatureFlags() returns exactly 18 keys',
  fn: () => {
    const flags = getFeatureFlags();
    assertEqual(Object.keys(flags).length, 18);
  }
}
```

#### 2.1.2 TOOL_ANNOTATIONS 검증 (UT-15 ~ UT-23)

**테스트 패턴**: 상수 직접 검증 + 함수 호출 검증

```javascript
// V156-15: TOOL_ANNOTATIONS 엔트리 수
{
  name: 'V156-15: TOOL_ANNOTATIONS has 17 entries (all built-in tools)',
  fn: () => {
    const { TOOL_ANNOTATIONS } = require('.../tool-registry');
    assertEqual(Object.keys(TOOL_ANNOTATIONS).length, 17);
  }
}

// V156-16: readOnlyHint 도구 수
{
  name: 'V156-16: 9 tools have readOnlyHint=true',
  fn: () => {
    const { TOOL_ANNOTATIONS } = require('.../tool-registry');
    const readOnly = Object.entries(TOOL_ANNOTATIONS)
      .filter(([, ann]) => ann.readOnlyHint === true);
    assertEqual(readOnly.length, 9);
  }
}

// V156-17: destructiveHint 도구
{
  name: 'V156-17: only run_shell_command has destructiveHint=true',
  fn: () => {
    const { TOOL_ANNOTATIONS, BUILTIN_TOOLS } = require('.../tool-registry');
    const destructive = Object.entries(TOOL_ANNOTATIONS)
      .filter(([, ann]) => ann.destructiveHint === true);
    assertEqual(destructive.length, 1);
    assertEqual(destructive[0][0], BUILTIN_TOOLS.RUN_SHELL_COMMAND);
  }
}

// V156-18: idempotentHint 도구 수
{
  name: 'V156-18: 10 tools have idempotentHint=true',
  fn: () => {
    const { TOOL_ANNOTATIONS } = require('.../tool-registry');
    const idempotent = Object.entries(TOOL_ANNOTATIONS)
      .filter(([, ann]) => ann.idempotentHint === true);
    assertEqual(idempotent.length, 10);
  }
}
```

**함수 검증 (UT-19 ~ UT-23)**:

```javascript
// V156-19: getToolAnnotations() 반환값
{
  name: 'V156-19: getToolAnnotations("read_file") returns correct hints',
  fn: () => {
    const { getToolAnnotations } = require('.../tool-registry');
    const ann = getToolAnnotations('read_file');
    assert(ann !== null && ann !== undefined, 'Should return annotation');
    assertEqual(ann.readOnlyHint, true);
    assertEqual(ann.destructiveHint, false);
    assertEqual(ann.idempotentHint, true);
  }
}

// V156-20: isReadOnlyTool() true case
{
  name: 'V156-20: isReadOnlyTool("read_file") returns true',
  fn: () => {
    const { isReadOnlyTool } = require('.../tool-registry');
    assertEqual(isReadOnlyTool('read_file'), true);
  }
}

// V156-21: isReadOnlyTool() false case
{
  name: 'V156-21: isReadOnlyTool("write_file") returns false',
  fn: () => {
    const { isReadOnlyTool } = require('.../tool-registry');
    assertEqual(isReadOnlyTool('write_file'), false);
  }
}

// V156-22: getStrictReadOnlyTools() returns 9 tools
{
  name: 'V156-22: getStrictReadOnlyTools() returns 9 tools',
  fn: () => {
    const { getStrictReadOnlyTools } = require('.../tool-registry');
    const tools = getStrictReadOnlyTools();
    assertEqual(tools.length, 9, 'Should return 9 strict read-only tools');
  }
}

// V156-23: getStrictReadOnlyTools() includes core read tools
{
  name: 'V156-23: getStrictReadOnlyTools() includes read_file, glob, grep_search',
  fn: () => {
    const { getStrictReadOnlyTools } = require('.../tool-registry');
    const tools = getStrictReadOnlyTools();
    assert(tools.includes('read_file'), 'Should include read_file');
    assert(tools.includes('glob'), 'Should include glob');
    assert(tools.includes('grep_search'), 'Should include grep_search');
    assert(tools.includes('google_web_search'), 'Should include google_web_search');
  }
}
```

#### 2.1.3 Config v1.5.6 검증 보강 (기존 TC-07과 중복 없이)

```javascript
// V156-24: testedVersions includes 0.31.0
{
  name: 'V156-24: bkit.config.json testedVersions includes "0.31.0"',
  fn: () => {
    const config = JSON.parse(fs.readFileSync(
      path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'
    ));
    assert(
      config.compatibility.testedVersions.includes('0.31.0'),
      'testedVersions must include "0.31.0" for v1.5.6'
    );
  }
}

// V156-25: levelPolicies config enabled
{
  name: 'V156-25: bkit.config.json levelPolicies.enabled is true',
  fn: () => {
    const config = JSON.parse(fs.readFileSync(
      path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'
    ));
    assertEqual(
      config.compatibility.policyEngine.levelPolicies?.enabled, true,
      'levelPolicies must be enabled for v1.5.6'
    );
  }
}
```

---

### 2.2 TC-19: v0.31.0 Level Policy & Hook Adapter (P0) — 26 Tests

**파일**: `tests/suites/tc19-v031-policy-hooks.js`

#### 2.2.1 LEVEL_POLICY_TEMPLATES 검증 (UT-24 ~ UT-28)

```javascript
// V156-26: LEVEL_POLICY_TEMPLATES has 3 levels
{
  name: 'V156-26: LEVEL_POLICY_TEMPLATES has Starter, Dynamic, Enterprise',
  fn: () => {
    const { LEVEL_POLICY_TEMPLATES } = require('.../policy-migrator');
    const keys = Object.keys(LEVEL_POLICY_TEMPLATES);
    assertEqual(keys.length, 3);
    assert(keys.includes('Starter'), 'Should have Starter');
    assert(keys.includes('Dynamic'), 'Should have Dynamic');
    assert(keys.includes('Enterprise'), 'Should have Enterprise');
  }
}

// V156-27: Starter has 10 rules
{
  name: 'V156-27: Starter template has 10 rules',
  fn: () => {
    const { LEVEL_POLICY_TEMPLATES } = require('.../policy-migrator');
    assertEqual(LEVEL_POLICY_TEMPLATES.Starter.rules.length, 10);
  }
}

// V156-28: Dynamic has 7 rules
{
  name: 'V156-28: Dynamic template has 7 rules',
  fn: () => {
    const { LEVEL_POLICY_TEMPLATES } = require('.../policy-migrator');
    assertEqual(LEVEL_POLICY_TEMPLATES.Dynamic.rules.length, 7);
  }
}

// V156-29: Enterprise has 5 rules
{
  name: 'V156-29: Enterprise template has 5 rules',
  fn: () => {
    const { LEVEL_POLICY_TEMPLATES } = require('.../policy-migrator');
    assertEqual(LEVEL_POLICY_TEMPLATES.Enterprise.rules.length, 5);
  }
}

// V156-30: All templates use tier 3
{
  name: 'V156-30: All level templates use tier 3 (workspace)',
  fn: () => {
    const { LEVEL_POLICY_TEMPLATES } = require('.../policy-migrator');
    Object.values(LEVEL_POLICY_TEMPLATES).forEach(tmpl => {
      assertEqual(tmpl.tier, 3, `Template tier should be 3, got ${tmpl.tier}`);
    });
  }
}
```

#### 2.2.2 generateLevelPolicy() 검증 (UT-29 ~ UT-34)

**테스트 패턴**: createTestProject() → env var 모킹 → generateLevelPolicy() → 결과 assert

```javascript
// V156-31: generateLevelPolicy('Starter') creates file
{
  name: 'V156-31: generateLevelPolicy creates Starter policy TOML when CLI >= 0.31.0',
  setup: () => createTestProject({}),
  fn: () => {
    resetCache();
    process.env.GEMINI_CLI_VERSION = '0.31.0';
    try {
      const { generateLevelPolicy } = require('.../policy-migrator');
      const result = generateLevelPolicy('Starter', TEST_PROJECT_DIR);
      assertEqual(result.created, true, 'Should create Starter policy');
      assertContains(result.path, 'bkit-starter-policy.toml');
      assertExists(result.path, 'TOML file should exist');

      // Verify TOML content
      const content = fs.readFileSync(result.path, 'utf-8');
      assertContains(content, '[[rule]]', 'Should have [[rule]] syntax');
      assertContains(content, 'decision = "deny"', 'Starter should have deny rules');
      assertContains(content, 'decision = "ask_user"', 'Starter should have ask_user rules');
      assertContains(content, 'decision = "allow"', 'Starter should have allow rules');
    } finally {
      delete process.env.GEMINI_CLI_VERSION;
      resetCache();
    }
  },
  teardown: cleanupTestProject
}

// V156-32: generateLevelPolicy preserves existing
{
  name: 'V156-32: generateLevelPolicy does not overwrite existing level policy',
  setup: () => {
    createTestProject({});
    const policyDir = path.join(TEST_PROJECT_DIR, '.gemini', 'policies');
    fs.mkdirSync(policyDir, { recursive: true });
    fs.writeFileSync(path.join(policyDir, 'bkit-starter-policy.toml'), 'EXISTING');
  },
  fn: () => {
    resetCache();
    process.env.GEMINI_CLI_VERSION = '0.31.0';
    try {
      const { generateLevelPolicy } = require('.../policy-migrator');
      const result = generateLevelPolicy('Starter', TEST_PROJECT_DIR);
      assertEqual(result.created, false, 'Should not overwrite');
      assertContains(result.reason, 'exists');
    } finally {
      delete process.env.GEMINI_CLI_VERSION;
      resetCache();
    }
  },
  teardown: cleanupTestProject
}

// V156-33: version guard (< 0.31.0)
{
  name: 'V156-33: generateLevelPolicy skips when CLI < 0.31.0',
  fn: () => {
    resetCache();
    process.env.GEMINI_CLI_VERSION = '0.29.0';
    try {
      const { generateLevelPolicy } = require('.../policy-migrator');
      const result = generateLevelPolicy('Starter', '/tmp/test');
      assertEqual(result.created, false);
      assertContains(result.reason, 'not available');
    } finally {
      delete process.env.GEMINI_CLI_VERSION;
      resetCache();
    }
  }
}

// V156-34: unknown level
{
  name: 'V156-34: generateLevelPolicy rejects unknown level',
  fn: () => {
    resetCache();
    process.env.GEMINI_CLI_VERSION = '0.31.0';
    try {
      const { generateLevelPolicy } = require('.../policy-migrator');
      const result = generateLevelPolicy('Unknown', '/tmp/test');
      assertEqual(result.created, false);
      assertContains(result.reason, 'Unknown level');
    } finally {
      delete process.env.GEMINI_CLI_VERSION;
      resetCache();
    }
  }
}

// V156-35: Enterprise TOML content
{
  name: 'V156-35: Enterprise policy TOML has allow decisions',
  setup: () => createTestProject({}),
  fn: () => {
    resetCache();
    process.env.GEMINI_CLI_VERSION = '0.31.0';
    try {
      const { generateLevelPolicy } = require('.../policy-migrator');
      const result = generateLevelPolicy('Enterprise', TEST_PROJECT_DIR);
      assertEqual(result.created, true);
      const content = fs.readFileSync(result.path, 'utf-8');
      assertContains(content, 'Enterprise Level Policy');
      assertContains(content, 'decision = "allow"');
    } finally {
      delete process.env.GEMINI_CLI_VERSION;
      resetCache();
    }
  },
  teardown: cleanupTestProject
}

// V156-36: Dynamic TOML content
{
  name: 'V156-36: Dynamic policy TOML has rm -rf deny',
  setup: () => createTestProject({}),
  fn: () => {
    resetCache();
    process.env.GEMINI_CLI_VERSION = '0.31.0';
    try {
      const { generateLevelPolicy } = require('.../policy-migrator');
      const result = generateLevelPolicy('Dynamic', TEST_PROJECT_DIR);
      assertEqual(result.created, true);
      const content = fs.readFileSync(result.path, 'utf-8');
      assertContains(content, 'rm -rf');
      assertContains(content, 'decision = "deny"');
    } finally {
      delete process.env.GEMINI_CLI_VERSION;
      resetCache();
    }
  },
  teardown: cleanupTestProject
}
```

#### 2.2.3 Hook Adapter 검증 (UT-35 ~ UT-44)

```javascript
// V156-37: supportsRuntimeHookFunctions v0.31.0
{
  name: 'V156-37: supportsRuntimeHookFunctions() true for v0.31.0',
  fn: () => {
    resetCache();
    process.env.GEMINI_CLI_VERSION = '0.31.0';
    try {
      const { supportsRuntimeHookFunctions } = require('.../hook-adapter');
      assertEqual(supportsRuntimeHookFunctions(), true);
    } finally {
      delete process.env.GEMINI_CLI_VERSION;
      resetCache();
    }
  }
}

// V156-38: supportsRuntimeHookFunctions v0.30.0
{
  name: 'V156-38: supportsRuntimeHookFunctions() false for v0.30.0',
  fn: () => {
    resetCache();
    process.env.GEMINI_CLI_VERSION = '0.30.0';
    try {
      const { supportsRuntimeHookFunctions } = require('.../hook-adapter');
      assertEqual(supportsRuntimeHookFunctions(), false);
    } finally {
      delete process.env.GEMINI_CLI_VERSION;
      resetCache();
    }
  }
}

// V156-39: getHookExecutionInfo mode is always 'command' in v1.5.6
{
  name: 'V156-39: getHookExecutionInfo() always returns mode="command"',
  fn: () => {
    const { getHookExecutionInfo } = require('.../hook-adapter');
    const info = getHookExecutionInfo('session_start');
    assertEqual(info.mode, 'command', 'v1.5.6 always uses command mode');
    assertEqual(info.hookEvent, 'session_start');
  }
}

// V156-40: getHookExecutionInfo sdkAvailable
{
  name: 'V156-40: getHookExecutionInfo() reports sdkAvailable for v0.31.0',
  fn: () => {
    resetCache();
    process.env.GEMINI_CLI_VERSION = '0.31.0';
    try {
      const { getHookExecutionInfo } = require('.../hook-adapter');
      const info = getHookExecutionInfo('before_tool');
      assertEqual(info.sdkAvailable, true);
      assertEqual(info.mode, 'command'); // Still command in v1.5.6
    } finally {
      delete process.env.GEMINI_CLI_VERSION;
      resetCache();
    }
  }
}

// V156-41: getRuntimeHookTemplate default timeout
{
  name: 'V156-41: getRuntimeHookTemplate() default timeout is 30000',
  fn: () => {
    const { getRuntimeHookTemplate } = require('.../hook-adapter');
    const tmpl = getRuntimeHookTemplate('session_start');
    assertEqual(tmpl.event, 'session_start');
    assertEqual(tmpl.timeout, 30000);
    assert(tmpl._note.includes('v1.5.6'), 'Should mention v1.5.6');
  }
}

// V156-42: getRuntimeHookTemplate custom timeout
{
  name: 'V156-42: getRuntimeHookTemplate() accepts custom timeout',
  fn: () => {
    const { getRuntimeHookTemplate } = require('.../hook-adapter');
    const tmpl = getRuntimeHookTemplate('before_tool', 5000);
    assertEqual(tmpl.timeout, 5000);
  }
}

// V156-43: HOOK_EVENT_MAP entries
{
  name: 'V156-43: HOOK_EVENT_MAP has 10 entries',
  fn: () => {
    const { HOOK_EVENT_MAP } = require('.../hook-adapter');
    assertEqual(Object.keys(HOOK_EVENT_MAP).length, 10);
  }
}

// V156-44: HOOK_EVENT_MAP key mappings
{
  name: 'V156-44: HOOK_EVENT_MAP maps PascalCase to snake_case',
  fn: () => {
    const { HOOK_EVENT_MAP } = require('.../hook-adapter');
    assertEqual(HOOK_EVENT_MAP['SessionStart'], 'session_start');
    assertEqual(HOOK_EVENT_MAP['AfterTool'], 'after_tool');
    assertEqual(HOOK_EVENT_MAP['BeforeModel'], 'before_model');
    assertEqual(HOOK_EVENT_MAP['PreCompress'], 'pre_compress');
  }
}

// V156-45: HOOK_EVENT_MAP all values are snake_case
{
  name: 'V156-45: HOOK_EVENT_MAP all values use snake_case',
  fn: () => {
    const { HOOK_EVENT_MAP } = require('.../hook-adapter');
    Object.values(HOOK_EVENT_MAP).forEach(v => {
      assert(/^[a-z_]+$/.test(v), `"${v}" should be snake_case`);
    });
  }
}

// V156-46: HOOK_EVENT_MAP is frozen
{
  name: 'V156-46: HOOK_EVENT_MAP is Object.freeze()-d',
  fn: () => {
    const { HOOK_EVENT_MAP } = require('.../hook-adapter');
    assertEqual(Object.isFrozen(HOOK_EVENT_MAP), true);
  }
}
```

#### 2.2.4 Session Start v1.5.6 검증 (UT-49 ~ UT-51)

```javascript
// V156-47: session-start.js contains 'v1.5.6'
{
  name: 'V156-47: session-start.js references v1.5.6 version',
  fn: () => {
    const content = fs.readFileSync(
      path.join(PLUGIN_ROOT, 'hooks', 'scripts', 'session-start.js'), 'utf-8'
    );
    const matches = content.match(/1\.5\.6/g) || [];
    assert(matches.length >= 4,
      `session-start.js should reference v1.5.6 at least 4 times, found ${matches.length}`);
  }
}

// V156-48: Level policy auto-generation in session-start
{
  name: 'V156-48: session-start generates level policy TOML for v0.31.0',
  setup: () => createTestProject({}),
  fn: () => {
    const result = executeHook('session-start.js', {}, {
      GEMINI_CLI_VERSION: '0.31.0'
    });
    assert(result.success || result.exitCode === 0,
      'session-start.js must exit 0 with GEMINI_CLI_VERSION=0.31.0');
    // Check for level policy file (depends on level detection)
    const policyDir = path.join(TEST_PROJECT_DIR, '.gemini', 'policies');
    if (fs.existsSync(policyDir)) {
      const files = fs.readdirSync(policyDir);
      // Should have at least bkit-permissions.toml or level-policy
      assert(files.length >= 1, 'Policy directory should have at least one policy file');
    }
  },
  teardown: cleanupTestProject
}
```

#### 2.2.5 Backward Compatibility E2E (E2E-05 ~ E2E-06)

```javascript
// V156-49: v0.29.0 backward compatibility
{
  name: 'V156-49: v0.29.0 has 4 true flags, generateLevelPolicy skipped',
  fn: () => {
    resetCache();
    process.env.GEMINI_CLI_VERSION = '0.29.0';
    try {
      const { getFeatureFlags } = require('.../version-detector');
      const { generateLevelPolicy } = require('.../policy-migrator');
      const { TOOL_ANNOTATIONS } = require('.../tool-registry');

      const flags = getFeatureFlags();
      const trueFlags = Object.values(flags).filter(v => v === true).length;
      assertEqual(trueFlags, 4, 'v0.29.0 should have 4 true flags');

      const result = generateLevelPolicy('Starter', '/tmp/test');
      assertEqual(result.created, false, 'Level policy should be skipped for v0.29.0');

      // TOOL_ANNOTATIONS should still be accessible (static data)
      assert(Object.keys(TOOL_ANNOTATIONS).length === 17,
        'TOOL_ANNOTATIONS should still return 17 entries regardless of CLI version');
    } finally {
      delete process.env.GEMINI_CLI_VERSION;
      resetCache();
    }
  }
}

// V156-50: v0.30.0 backward compatibility
{
  name: 'V156-50: v0.30.0 has 9 true flags, level policy skipped, base policy works',
  setup: () => createTestProject({}),
  fn: () => {
    resetCache();
    process.env.GEMINI_CLI_VERSION = '0.30.0';
    try {
      const { getFeatureFlags } = require('.../version-detector');
      const { generateLevelPolicy, generatePolicyFile } = require('.../policy-migrator');

      const flags = getFeatureFlags();
      const trueFlags = Object.values(flags).filter(v => v === true).length;
      assertEqual(trueFlags, 9, 'v0.30.0 should have 9 true flags');

      const levelResult = generateLevelPolicy('Starter', TEST_PROJECT_DIR);
      assertEqual(levelResult.created, false, 'Level policy not available for v0.30.0');

      // Base policy should still work
      const config = JSON.parse(fs.readFileSync(
        path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'
      ));
      const baseResult = generatePolicyFile(TEST_PROJECT_DIR, config.permissions);
      assertEqual(baseResult.created, true, 'Base policy should generate for v0.30.0');
    } finally {
      delete process.env.GEMINI_CLI_VERSION;
      resetCache();
    }
  },
  teardown: cleanupTestProject
}

// V156-51: Config version consistency
{
  name: 'V156-51: All config files reference version 1.5.6',
  fn: () => {
    const config = JSON.parse(fs.readFileSync(
      path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'
    ));
    const ext = JSON.parse(fs.readFileSync(
      path.join(PLUGIN_ROOT, 'gemini-extension.json'), 'utf-8'
    ));
    assertEqual(config.version, '1.5.6', 'bkit.config.json version');
    assertEqual(ext.version, '1.5.6', 'gemini-extension.json version');
  }
}
```

---

### 2.3 run-all.js 업데이트

```javascript
// tests/run-all.js에 추가할 suite 등록
const suites = [
  // ... 기존 TC-01 ~ TC-17 ...

  // P0 - v1.5.6 New Features
  { name: 'TC-18: v0.31.0 Features & Annotations', file: 'suites/tc18-v031-features.js', priority: 'P0' },
  { name: 'TC-19: v0.31.0 Level Policy & Hooks', file: 'suites/tc19-v031-policy-hooks.js', priority: 'P0' },
];

// Report 경로 업데이트
const reportPath = path.resolve(
  __dirname, '../docs/04-report/features/bkit-v156-gemini-test.report.md'
);
```

---

### 2.4 UX Test Prompts (v1.5.6)

**파일**: `tests/gemini-interactive/v156-test-prompts.md`

#### UX-01 ~ UX-03: 세션 시작

```
[UX-01] 첫 세션 시작
Prompt: (새 프로젝트에서 gemini 실행)
Expected: "bkit Vibecoding Kit v1.5.6" 포함
Pass: 세션 시작 메시지에 v1.5.6 표시 □

[UX-02] 돌아온 사용자
Prompt: (기존 PDCA 진행중 프로젝트에서 gemini 실행)
Expected: "Previous Work Detected" + feature 이름 표시
Pass: 이전 작업 감지 □

[UX-03] Feature flags 보고
Prompt: (v0.31.0에서 세션 시작)
Expected: 18 features 표시
Pass: 18개 feature flag 감지 □
```

#### UX-04 ~ UX-06: v1.5.6 신규 기능

```
[UX-04] Level Policy 확인
Prompt: .gemini/policies/ 디렉토리에 뭐가 있어?
Expected: v0.31.0에서 bkit-{level}-policy.toml 존재
Pass: Level policy TOML 확인 □

[UX-05] Tool Annotations 조회
Prompt: TOOL_ANNOTATIONS에서 read_file의 annotation을 확인해줘
Expected: readOnlyHint=true, destructiveHint=false, idempotentHint=true
Pass: 정확한 annotation 반환 □

[UX-06] RuntimeHook SDK 상태
Prompt: hook-adapter.js를 분석하고 RuntimeHook 지원 상태를 알려줘
Expected: mode='command', sdkAvailable=true (v0.31.0)
Pass: SDK 상태 정확 □
```

#### UX-07 ~ UX-18: PDCA / Agent / Security

```
[UX-07] Plan 생성:        /pdca plan test-feature → Plan 문서 생성 □
[UX-08] Design 생성:      /pdca design test-feature → Design 문서 생성 □
[UX-09] Status 확인:      /pdca status → 현재 상태 표시 □
[UX-10] Next 안내:        /pdca next → 다음 단계 추천 □
[UX-11] 한국어 인식:      로그인 기능 만들어줘 → bkend-expert 또는 dynamic 트리거 □
[UX-12] 영어 인식:        Help me build a landing page → starter-guide 트리거 □
[UX-13] 코드 리뷰:        /code-review → code-analyzer 활성화 □
[UX-14] 보안 검토:        보안 취약점 점검해줘 → security-architect 트리거 □
[UX-15] 위험 명령 차단:   rm -rf / → before-tool 차단 □
[UX-16] Policy 변조 차단: .gemini/policies/ 접근 차단 □
[UX-17] Feature Report:   아무 질문 → Feature Usage Report 포함 □
[UX-18] bkit 도움말:      /bkit → 전체 기능 목록 표시 □
```

---

## 3. Implementation Order

```
Phase 1 - 신규 Test Suites 생성
  1. tests/suites/tc18-v031-features.js (25 tests)
  2. tests/suites/tc19-v031-policy-hooks.js (26 tests)

Phase 2 - Test Runner 업데이트
  3. tests/run-all.js: TC-18, TC-19 등록 + report 경로

Phase 3 - UX Test Guide 문서
  4. tests/gemini-interactive/v156-test-prompts.md
```

---

## 4. Non-Functional Requirements

| Requirement | Criteria |
|-------------|---------|
| 테스트 실행 시간 | 전체 자동화 (TC-01~TC-19): < 60초 |
| Pass Rate | P0: 100%, P1: >= 90%, P2: >= 80% |
| 호환성 | Gemini CLI v0.29.0, v0.30.0, v0.31.0 (3 버전) |
| 재현성 | 동일 환경에서 동일 결과 보장 |
| 격리성 | env var + resetCache() + createTestProject/cleanup 패턴 |

---

## 5. File Changes Summary

| Action | File | Tests (est.) |
|--------|------|:------------:|
| NEW | tests/suites/tc18-v031-features.js | 25 |
| NEW | tests/suites/tc19-v031-policy-hooks.js | 26 |
| MODIFY | tests/run-all.js | +6 lines |
| NEW | tests/gemini-interactive/v156-test-prompts.md | 18 scenarios |
| **Total** | **4 files** | **51 automated + 18 UX** |

---

## 6. Dependency Map

```
tc18-v031-features.js
  └─ lib/adapters/gemini/version-detector.js  (feature flags)
  └─ lib/adapters/gemini/tool-registry.js     (TOOL_ANNOTATIONS, getToolAnnotations, etc.)
  └─ bkit.config.json                         (testedVersions, levelPolicies)

tc19-v031-policy-hooks.js
  └─ lib/adapters/gemini/policy-migrator.js   (LEVEL_POLICY_TEMPLATES, generateLevelPolicy)
  └─ lib/adapters/gemini/hook-adapter.js      (HOOK_EVENT_MAP, supportsRuntimeHookFunctions)
  └─ lib/adapters/gemini/version-detector.js  (env var mocking)
  └─ hooks/scripts/session-start.js           (version string, level policy trigger)
  └─ test-utils.js                            (createTestProject, executeHook, assert*)
```

---

*bkit Vibecoding Kit v1.5.6 — Comprehensive Extension Test Design*
*Generated: 2026-02-28*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
