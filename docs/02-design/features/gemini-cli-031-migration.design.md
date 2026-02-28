# Design: bkit v1.5.6 - Gemini CLI v0.31.0 Migration

> **Summary**: v1.5.6 패치의 파일별 상세 코드 변경 설계서
>
> **Feature**: gemini-cli-031-migration
> **Plan Reference**: [gemini-cli-031-migration.plan.md](../../01-plan/features/gemini-cli-031-migration.plan.md)
> **Author**: CTO Team (Architects)
> **Created**: 2026-02-28
> **Status**: Revised (gemini-031-researcher corrections applied)

---

## 1. Implementation Order

```
Phase 1: Core Updates (P0) ─── 순서 의존성 있음
├── 1.1 version-detector.js (다른 모듈이 참조)
├── 1.2 bkit.config.json (version 필드)
└── 1.3 gemini-extension.json (version 필드)

Phase 2: Feature Enhancements (P1) ─── 병렬 가능
├── 2.1 policy-migrator.js (version-detector 의존)
├── 2.2 tool-registry.js (독립)
├── 2.3 hook-adapter.js [NEW] (version-detector 의존, SDK 감지만)
└── 2.4 hook scripts (version string 업데이트만, 구조 변경 없음)

Phase 3: Integration (P0+P1)
├── 3.1 session-start.js (모든 변경 통합)
└── 3.2 philosophy docs (P2)
```

---

## 2. File-by-File Design

### 2.1 version-detector.js (M-01)

**File**: `lib/adapters/gemini/version-detector.js`
**Change Type**: Modify
**Priority**: P0

#### 2.1.1 변경 1: @version 주석 업데이트

```diff
- * @version 1.5.5
+ * @version 1.5.6
```

#### 2.1.2 변경 2: getFeatureFlags() 확장

**현재 코드** (line 147-159):
```javascript
function getFeatureFlags() {
  return {
    hasPlanMode: isVersionAtLeast('0.29.0'),
    hasPolicyEngine: isVersionAtLeast('0.30.0'),
    hasExcludeToolsDeprecated: isVersionAtLeast('0.30.0'),
    hasGemini3Default: isVersionAtLeast('0.29.0'),
    hasSkillsStable: isVersionAtLeast('0.26.0'),
    hasExtensionRegistry: isVersionAtLeast('0.29.0'),
    hasSDK: isVersionAtLeast('0.30.0'),
    hasGemini31Pro: isVersionAtLeast('0.29.7'),
    hasApprovalMode: isVersionAtLeast('0.30.0')
  };
}
```

**변경 후**:
```javascript
function getFeatureFlags() {
  return {
    // v0.26.0+
    hasSkillsStable: isVersionAtLeast('0.26.0'),

    // v0.29.0+
    hasPlanMode: isVersionAtLeast('0.29.0'),
    hasGemini3Default: isVersionAtLeast('0.29.0'),
    hasExtensionRegistry: isVersionAtLeast('0.29.0'),
    hasGemini31Pro: isVersionAtLeast('0.29.7'),

    // v0.30.0+
    hasPolicyEngine: isVersionAtLeast('0.30.0'),
    hasExcludeToolsDeprecated: isVersionAtLeast('0.30.0'),
    hasSDK: isVersionAtLeast('0.30.0'),
    hasApprovalMode: isVersionAtLeast('0.30.0'),

    // v0.31.0+ (NEW)
    hasRuntimeHookFunctions: isVersionAtLeast('0.31.0'),
    hasBrowserAgent: isVersionAtLeast('0.31.0'),
    hasProjectLevelPolicy: isVersionAtLeast('0.31.0'),
    hasMcpProgress: isVersionAtLeast('0.31.0'),
    hasParallelReadCalls: isVersionAtLeast('0.31.0'),
    hasPlanModeCustomStorage: isVersionAtLeast('0.31.0'),
    hasToolAnnotations: isVersionAtLeast('0.31.0'),
    hasExtensionFolderTrust: isVersionAtLeast('0.31.0'),
    hasAllowMultipleReplace: isVersionAtLeast('0.31.0')
  };
}
```

**설계 근거**:
- 버전별 그룹핑으로 가독성 향상
- 기존 9개 플래그의 키 이름과 값은 변경 없음 (하위호환)
- 신규 9개 플래그 모두 `0.31.0` 기준
- 향후 v0.32.0 플래그 추가 시 그룹 추가만 하면 됨

#### 2.1.3 변경 3: getVersionSummary() 업데이트 없음

현재 구현이 동적으로 `getFeatureFlags()` 결과를 사용하므로 자동으로 신규 플래그 포함됨. 변경 불필요.

---

### 2.2 bkit.config.json (M-02)

**File**: `bkit.config.json`
**Change Type**: Modify
**Priority**: P0

#### 2.2.1 변경 1: version 업데이트

```diff
- "version": "1.5.5",
+ "version": "1.5.6",
```

#### 2.2.2 변경 2: testedVersions 추가

```diff
- "testedVersions": ["0.29.0", "0.29.5", "0.29.7", "0.30.0-preview.3", "0.30.0"],
+ "testedVersions": ["0.29.0", "0.29.5", "0.29.7", "0.30.0-preview.3", "0.30.0", "0.31.0"],
```

#### 2.2.3 변경 3: policyEngine 설정 확장

```diff
  "policyEngine": {
    "autoGenerate": true,
-   "outputDir": ".gemini/policies/"
+   "outputDir": ".gemini/policies/",
+   "levelPolicies": {
+     "enabled": true,
+     "templates": {
+       "Starter": "bkit-starter-policy",
+       "Dynamic": "bkit-dynamic-policy",
+       "Enterprise": "bkit-enterprise-policy"
+     }
+   }
  }
```

---

### 2.3 gemini-extension.json (M-03)

**File**: `gemini-extension.json`
**Change Type**: Modify
**Priority**: P0

#### 2.3.1 변경 1: version 업데이트

```diff
- "version": "1.5.5",
+ "version": "1.5.6",
```

#### 2.3.2 변경 2: description 업데이트

```diff
- "description": "bkit Vibecoding Kit - PDCA methodology + Context Engineering for AI-native development with Gemini CLI",
+ "description": "bkit Vibecoding Kit v1.5.6 - PDCA methodology + Context Engineering for AI-native development with Gemini CLI",
```

#### 2.3.3 검토: excludeTools 유지

```json
"excludeTools": [
  "run_shell_command(rm -rf*)",
  "run_shell_command(git push --force*)"
]
```

v0.30.0에서 deprecated 되었으나 v0.31.0에서도 하위호환으로 동작함. Policy Engine이 주 경로이므로 excludeTools는 fallback으로 유지. v1.6.0에서 제거 검토.

---

### 2.4 policy-migrator.js (M-04, M-05)

**File**: `lib/adapters/gemini/policy-migrator.js`
**Change Type**: Modify
**Priority**: P1

#### 2.4.1 변경 1: @version 업데이트

```diff
- * @version 1.5.5
+ * @version 1.5.6
```

#### 2.4.2 변경 2: LEVEL_POLICY_TEMPLATES 상수 추가

`convertToToml()` 함수 앞에 추가:

> **IMPORTANT (gemini-031-researcher 발견사항 반영)**:
> v0.31.0 Policy Engine에는 5-tier hierarchy가 있으며, **Extension tier (Tier 2)에서는
> `allow` decision이 차단**됩니다 (보안 제약). bkit의 level policy는 **Workspace tier
> (Tier 3, `.gemini/policies/`)에 생성**되므로 `allow`를 사용할 수 있습니다.
>
> **Policy Tier Hierarchy**:
> | Tier | Location | `allow` | `deny` | `ask_user` |
> |:---:|---|:---:|:---:|:---:|
> | 1 (Default) | CLI built-in | O | O | O |
> | 2 (Extension) | `gemini-extension.json` policies | **X** | O | O |
> | 3 (Workspace) | `.gemini/policies/*.toml` | O | O | O |
> | 4 (User) | `~/.gemini/policies/*.toml` | O | O | O |
> | 5 (Admin) | `--policy-dir` flag | O | O | O |
>
> bkit의 `generateLevelPolicy()`는 Tier 3에 생성하므로 `allow` 사용 가능.
> 단, `generatePolicyFile()` (기존 함수)이 Extension tier에 직접 정책을 넣는 경우에는
> `allow`를 사용하면 안 됨 → 기존 코드 검증 필요.
>
> **v0.31.0 새로운 TOML 필드**:
> - `toolAnnotations` - 도구별 readOnly/destructive/idempotent 힌트
> - `modes` - Plan Mode 등 모드별 정책
> - `commandRegex` - 정규식 기반 명령어 매칭 (commandPrefix 대안)

```javascript
/**
 * Level-specific policy templates
 * Generated at Tier 3 (workspace-level, .gemini/policies/) where `allow` decision IS permitted.
 * NOTE: Extension tier (Tier 2) blocks `allow` decisions - these templates MUST NOT be
 * used in Extension tier policies.
 *
 * @since 1.5.6 (Gemini CLI v0.31.0 project-level policy support)
 */
const LEVEL_POLICY_TEMPLATES = Object.freeze({
  Starter: {
    tier: 3,  // Workspace tier - allow IS permitted
    description: 'Restrictive policy for beginners - safe defaults',
    rules: [
      { toolName: 'write_file', decision: 'ask_user', priority: 30 },
      { toolName: 'replace', decision: 'ask_user', priority: 30 },
      { toolName: 'run_shell_command', decision: 'ask_user', priority: 40 },
      { toolName: 'run_shell_command', commandPrefix: 'rm', decision: 'deny', priority: 100 },
      { toolName: 'run_shell_command', commandPrefix: 'git push --force', decision: 'deny', priority: 100 },
      { toolName: 'run_shell_command', commandPrefix: 'git reset --hard', decision: 'deny', priority: 100 },
      { toolName: 'read_file', decision: 'allow', priority: 10 },
      { toolName: 'glob', decision: 'allow', priority: 10 },
      { toolName: 'grep_search', decision: 'allow', priority: 10 },
      { toolName: 'google_web_search', decision: 'allow', priority: 10 }
    ]
  },
  Dynamic: {
    tier: 3,
    description: 'Balanced policy for fullstack development',
    rules: [
      { toolName: 'write_file', decision: 'allow', priority: 10 },
      { toolName: 'replace', decision: 'allow', priority: 10 },
      { toolName: 'run_shell_command', decision: 'allow', priority: 10 },
      { toolName: 'run_shell_command', commandPrefix: 'rm -rf', decision: 'deny', priority: 100 },
      { toolName: 'run_shell_command', commandPrefix: 'git push --force', decision: 'deny', priority: 100 },
      { toolName: 'run_shell_command', commandPrefix: 'git reset --hard', decision: 'ask_user', priority: 50 },
      { toolName: 'run_shell_command', commandPrefix: 'docker system prune', decision: 'ask_user', priority: 50 }
    ]
  },
  Enterprise: {
    tier: 3,
    description: 'Permissive policy with security audit for enterprise projects',
    rules: [
      { toolName: 'write_file', decision: 'allow', priority: 10 },
      { toolName: 'replace', decision: 'allow', priority: 10 },
      { toolName: 'run_shell_command', decision: 'allow', priority: 10 },
      { toolName: 'run_shell_command', commandPrefix: 'rm -rf /', decision: 'deny', priority: 100 },
      { toolName: 'run_shell_command', commandPrefix: 'git push --force', decision: 'ask_user', priority: 50 }
    ]
  }
});
```

#### 2.4.3 변경 3: generateLevelPolicy() 함수 추가

`generatePolicyFile()` 함수 뒤에 추가:

```javascript
/**
 * Generate level-specific policy file for project-level Policy Engine (Tier 3)
 * Only creates when Gemini CLI >= v0.31.0 and project-level policies supported
 *
 * @param {string} level - Project level: 'Starter', 'Dynamic', 'Enterprise'
 * @param {string} projectDir - Project root directory
 * @returns {{ created: boolean, path: string|null, reason: string }}
 */
function generateLevelPolicy(level, projectDir) {
  // Version guard: project-level policies require CLI >= 0.31.0
  try {
    const { getFeatureFlags } = require('./version-detector');
    const flags = getFeatureFlags();
    if (!flags.hasProjectLevelPolicy) {
      return { created: false, path: null, reason: 'Project-level policy not available (CLI < 0.31.0)' };
    }
  } catch (e) {
    return { created: false, path: null, reason: 'Version detection failed' };
  }

  const template = LEVEL_POLICY_TEMPLATES[level];
  if (!template) {
    return { created: false, path: null, reason: `Unknown level: ${level}` };
  }

  const policyDir = path.join(projectDir, '.gemini', 'policies');
  const policyFileName = `bkit-${level.toLowerCase()}-policy.toml`;
  const policyPath = path.join(policyDir, policyFileName);

  // Don't overwrite existing level policy
  if (fs.existsSync(policyPath)) {
    return { created: false, path: policyPath, reason: 'Level policy already exists' };
  }

  // Generate TOML content
  const lines = [
    `# bkit-gemini v1.5.6 - ${level} Level Policy`,
    `# ${template.description}`,
    `# Auto-generated for Gemini CLI v0.31.0+ Project-Level Policy Engine (Tier 3)`,
    `# Generated: ${new Date().toISOString().split('T')[0]}`,
    ''
  ];

  for (const rule of template.rules) {
    lines.push('[[rule]]');
    lines.push(`toolName = "${escapeTomlString(rule.toolName)}"`);
    if (rule.commandPrefix) {
      lines.push(`commandPrefix = "${escapeTomlString(rule.commandPrefix)}"`);
    }
    lines.push(`decision = "${rule.decision}"`);
    lines.push(`priority = ${rule.priority}`);
    lines.push('');
  }

  const tomlContent = lines.join('\n');

  // Validate before writing
  if (!validateTomlStructure(tomlContent)) {
    return { created: false, path: null, reason: 'Generated TOML failed validation' };
  }

  try {
    if (!fs.existsSync(policyDir)) {
      fs.mkdirSync(policyDir, { recursive: true });
    }
    fs.writeFileSync(policyPath, tomlContent, 'utf-8');
    return { created: true, path: policyPath, reason: `${level} level policy generated` };
  } catch (e) {
    return { created: false, path: null, reason: `Write failed: ${e.message}` };
  }
}
```

#### 2.4.4 변경 4: module.exports 확장

```diff
  module.exports = {
    parsePermissionKey,
    mapDecision,
    getPriority,
    escapeTomlString,
    validateTomlStructure,
    convertToToml,
    hasPolicyFiles,
-   generatePolicyFile
+   generatePolicyFile,
+   generateLevelPolicy,
+   LEVEL_POLICY_TEMPLATES
  };
```

---

### 2.5 tool-registry.js (M-06)

**File**: `lib/adapters/gemini/tool-registry.js`
**Change Type**: Modify
**Priority**: P1

#### 2.5.1 변경 1: @version 업데이트

```diff
- * @version 1.5.5
+ * @version 1.5.6
```

#### 2.5.2 변경 2: TOOL_ANNOTATIONS 상수 추가

`TOOL_CATEGORIES` 뒤에 추가:

```javascript
// ─── Tool Annotations (v0.31.0+) ─────────────────────────────
// Hints for Gemini CLI's trust model and parallel execution

const TOOL_ANNOTATIONS = Object.freeze({
  [BUILTIN_TOOLS.READ_FILE]: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.READ_MANY_FILES]: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.GREP_SEARCH]: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.GLOB]: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.LIST_DIRECTORY]: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.GOOGLE_WEB_SEARCH]: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.WEB_FETCH]: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.ASK_USER]: { readOnlyHint: true, destructiveHint: false, idempotentHint: false },
  [BUILTIN_TOOLS.GET_INTERNAL_DOCS]: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.ACTIVATE_SKILL]: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  [BUILTIN_TOOLS.SAVE_MEMORY]: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.WRITE_TODOS]: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  [BUILTIN_TOOLS.WRITE_FILE]: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.REPLACE]: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  [BUILTIN_TOOLS.RUN_SHELL_COMMAND]: { readOnlyHint: false, destructiveHint: true, idempotentHint: false },
  [BUILTIN_TOOLS.ENTER_PLAN_MODE]: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.EXIT_PLAN_MODE]: { readOnlyHint: false, destructiveHint: false, idempotentHint: true }
});
```

#### 2.5.3 변경 3: getToolAnnotations() 함수 추가

```javascript
/**
 * Get tool annotations for Gemini CLI v0.31.0+ trust model
 * @param {string} toolName - Canonical tool name
 * @returns {{ readOnlyHint: boolean, destructiveHint: boolean, idempotentHint: boolean }|null}
 */
function getToolAnnotations(toolName) {
  const resolved = resolveToolName(toolName);
  return TOOL_ANNOTATIONS[resolved] || null;
}

/**
 * Check if a tool is read-only based on annotations
 * @param {string} toolName
 * @returns {boolean}
 */
function isReadOnlyTool(toolName) {
  const annotations = getToolAnnotations(toolName);
  return annotations ? annotations.readOnlyHint === true : false;
}
```

#### 2.5.4 변경 4: getReadOnlyTools() 리팩토링

```diff
  function getReadOnlyTools() {
-   return [
-     BUILTIN_TOOLS.READ_FILE,
-     BUILTIN_TOOLS.READ_MANY_FILES,
-     BUILTIN_TOOLS.GREP_SEARCH,
-     BUILTIN_TOOLS.GLOB,
-     BUILTIN_TOOLS.LIST_DIRECTORY,
-     BUILTIN_TOOLS.GOOGLE_WEB_SEARCH,
-     BUILTIN_TOOLS.WEB_FETCH,
-     BUILTIN_TOOLS.ACTIVATE_SKILL,
-     BUILTIN_TOOLS.WRITE_TODOS,
-     BUILTIN_TOOLS.SAVE_MEMORY,
-     BUILTIN_TOOLS.ASK_USER,
-     BUILTIN_TOOLS.GET_INTERNAL_DOCS
-   ];
+   return Object.entries(TOOL_ANNOTATIONS)
+     .filter(([, anno]) => anno.readOnlyHint === true)
+     .map(([name]) => name);
  }
```

#### 2.5.5 변경 5: module.exports 확장

```diff
  module.exports = {
    BUILTIN_TOOLS,
    ALL_BUILTIN_TOOL_NAMES,
    LEGACY_ALIASES,
    BKIT_LEGACY_NAMES,
    FORWARD_ALIASES,
    REVERSE_FORWARD_ALIASES,
    TOOL_CATEGORIES,
+   TOOL_ANNOTATIONS,
    CLAUDE_TO_GEMINI_MAP,
    getReadOnlyTools,
    getAllTools,
    resolveToolName,
    isValidToolName,
-   getVersionedToolName
+   getVersionedToolName,
+   getToolAnnotations,
+   isReadOnlyTool
  };
```

**주의**: `getReadOnlyTools()` 리팩토링 후 반환 목록 검증 필요. 현재 하드코딩 목록에는 `ACTIVATE_SKILL`, `WRITE_TODOS`, `SAVE_MEMORY`가 포함되어 있으나 이들은 annotation 기준으로는 `readOnlyHint: false`. 따라서 리팩토링 시 기존 동작이 변경됨.

**대안**: `getReadOnlyTools()` 하드코딩 유지하고 `getAnnotationBasedReadOnlyTools()` 별도 추가.

```javascript
// 기존 유지 (하위호환)
function getReadOnlyTools() {
  return [
    BUILTIN_TOOLS.READ_FILE,
    BUILTIN_TOOLS.READ_MANY_FILES,
    BUILTIN_TOOLS.GREP_SEARCH,
    BUILTIN_TOOLS.GLOB,
    BUILTIN_TOOLS.LIST_DIRECTORY,
    BUILTIN_TOOLS.GOOGLE_WEB_SEARCH,
    BUILTIN_TOOLS.WEB_FETCH,
    BUILTIN_TOOLS.ACTIVATE_SKILL,
    BUILTIN_TOOLS.WRITE_TODOS,
    BUILTIN_TOOLS.SAVE_MEMORY,
    BUILTIN_TOOLS.ASK_USER,
    BUILTIN_TOOLS.GET_INTERNAL_DOCS
  ];
}

// 신규: annotation 기반 (v0.31.0+)
function getStrictReadOnlyTools() {
  return Object.entries(TOOL_ANNOTATIONS)
    .filter(([, anno]) => anno.readOnlyHint === true)
    .map(([name]) => name);
}
```

**결정**: 대안 채택 (하위호환 우선). `getReadOnlyTools()`는 유지하고 `getStrictReadOnlyTools()`를 추가.

---

### 2.6 hook-adapter.js [NEW] (M-07)

**File**: `lib/adapters/gemini/hook-adapter.js`
**Change Type**: New
**Priority**: P1

> **IMPORTANT (gemini-031-researcher 발견사항 반영)**:
> v0.31.0의 RuntimeHook Function은 `hooks.json`의 `type: "function"`이 **아니라**,
> SDK 기반 프로그래밍 방식인 `HookSystem.registerHook(hookConfig)` API를 사용합니다.
>
> ```javascript
> // SDK-based RuntimeHook API (v0.31.0+)
> import { HookSystem } from '@anthropic-ai/gemini-cli-sdk';
>
> HookSystem.registerHook({
>   event: 'session_start',
>   action: async (context) => { /* ... */ return result; },
>   timeout: 30000
> });
> ```
>
> 따라서 `hooks.json`의 구조 변경은 불필요하며, v1.5.6에서는 SDK 연동을 위한
> 추상화 레이어만 준비합니다. 실제 SDK 기반 전환은 v1.6.0에서 수행합니다.

```javascript
/**
 * Hook Adapter - RuntimeHook Function Support Utilities
 * Abstraction layer for future SDK-based RuntimeHook migration.
 *
 * v0.31.0 RuntimeHook API: HookSystem.registerHook({ event, action, timeout })
 * - SDK-based programmatic registration (NOT hooks.json type change)
 * - 99% faster execution (in-process vs child_process spawn)
 * - Direct context object access (no stdin/stdout serialization)
 *
 * v1.5.6: Detection + preparation only. Hooks remain type:"command" in hooks.json.
 * v1.6.0: Migrate top 3 hooks to SDK-based RuntimeHook functions.
 *
 * @version 1.5.6
 */

const { getFeatureFlags } = require('./version-detector');

/**
 * Check if RuntimeHook functions are supported (SDK-based API)
 * @returns {boolean}
 */
function supportsRuntimeHookFunctions() {
  try {
    return getFeatureFlags().hasRuntimeHookFunctions === true;
  } catch (e) {
    return false;
  }
}

/**
 * Get hook execution mode info for the detected CLI version
 * v1.5.6: Always 'command'. Reports SDK availability for diagnostics.
 *
 * @param {string} hookEvent - Hook event name (e.g., 'session_start')
 * @returns {{ mode: 'command'|'sdk', sdkAvailable: boolean, hookEvent: string }}
 */
function getHookExecutionInfo(hookEvent) {
  const sdkAvailable = supportsRuntimeHookFunctions();
  return {
    mode: 'command',  // v1.5.6: always command mode
    sdkAvailable,     // true when CLI >= 0.31.0 (for diagnostics/metadata)
    hookEvent
  };
}

/**
 * Get RuntimeHook config template for future SDK migration (v1.6.0+)
 * Returns the config shape that HookSystem.registerHook() expects.
 * Used for planning/documentation purposes in v1.5.6.
 *
 * @param {string} hookEvent - Hook event name
 * @param {number} [timeout=30000] - Timeout in ms
 * @returns {{ event: string, timeout: number, _note: string }}
 */
function getRuntimeHookTemplate(hookEvent, timeout = 30000) {
  return {
    event: hookEvent,
    timeout,
    _note: 'v1.5.6 preparation - action function to be provided in v1.6.0 migration'
  };
}

/**
 * Map hooks.json event names to SDK event names
 * hooks.json uses kebab-case, SDK uses snake_case
 */
const HOOK_EVENT_MAP = Object.freeze({
  'session-start': 'session_start',
  'session-end': 'session_end',
  'before-tool': 'before_tool',
  'after-tool': 'after_tool',
  'before-model': 'before_model',
  'after-model': 'after_model',
  'before-skill': 'before_skill',
  'after-skill': 'after_skill',
  'before-permission': 'before_permission',
  'notification': 'notification'
});

module.exports = {
  supportsRuntimeHookFunctions,
  getHookExecutionInfo,
  getRuntimeHookTemplate,
  HOOK_EVENT_MAP
};
```

---

### 2.7 session-start.js (M-08)

**File**: `hooks/scripts/session-start.js`
**Change Type**: Modify
**Priority**: P0

#### 2.7.1 변경 1: 모든 v1.5.5 → v1.5.6 문자열 업데이트

```diff
- * SessionStart Hook - Enhanced Session Initialization (v1.5.5)
+ * SessionStart Hook - Enhanced Session Initialization (v1.5.6)
```

```diff
- sections.push('# bkit Vibecoding Kit v1.5.5 - Session Start');
+ sections.push('# bkit Vibecoding Kit v1.5.6 - Session Start');
```

```diff
      metadata: {
-       version: '1.5.5',
+       version: '1.5.6',
```

```diff
      context: 'bkit Vibecoding Kit v1.5.6 activated (Gemini CLI)',
```

#### 2.7.2 변경 2: Policy Engine 레벨별 정책 생성 추가

`session-start.js`의 "3.5. Auto-generate Policy Engine TOML" 블록 확장:

```diff
    // 3.5. Auto-generate Policy Engine TOML (v0.30.0+)
    try {
      const vd = require(path.join(libPath, 'adapters', 'gemini', 'version-detector'));
      const flags = vd.getFeatureFlags();
      if (flags.hasPolicyEngine) {
        const pm = require(path.join(libPath, 'adapters', 'gemini', 'policy-migrator'));
        const result = pm.generatePolicyFile(projectDir, pluginRoot);
-       if (result && result.created) {
-         // Policy TOML auto-generated successfully
-       }
+       // 3.6. Generate level-specific policy (v0.31.0+)
+       if (flags.hasProjectLevelPolicy) {
+         const levelResult = pm.generateLevelPolicy(level, projectDir);
+         // Level policy generated or already exists
+       }
      }
    } catch (e) {
      // Policy TOML generation skipped - non-fatal
    }
```

#### 2.7.3 변경 3: metadata에 v0.31.0 기능 상태 추가

```diff
      metadata: {
        version: '1.5.6',
        platform: 'gemini',
        level: level,
        primaryFeature: pdcaStatus.primaryFeature,
        currentPhase: pdcaStatus.primaryFeature ?
          pdcaStatus.features[pdcaStatus.primaryFeature]?.phase : null,
        outputStyle: outputStyle?.name || 'default',
        isReturningUser: returningInfo.isReturning,
-       sessionCount: memory.sessionCount || 1
+       sessionCount: memory.sessionCount || 1,
+       geminiCliFeatures: getGeminiCliFeatures()
      }
```

새 함수 추가:

```javascript
function getGeminiCliFeatures() {
  try {
    const vd = require(path.join(libPath, 'adapters', 'gemini', 'version-detector'));
    const version = vd.detectVersion();
    const flags = vd.getFeatureFlags();
    return {
      version: version.raw,
      isPreview: version.isPreview,
      flagCount: Object.values(flags).filter(Boolean).length,
      totalFlags: Object.keys(flags).length
    };
  } catch (e) {
    return { version: 'unknown', isPreview: false, flagCount: 0, totalFlags: 0 };
  }
}
```

---

### 2.8 hooks.json 설명 업데이트 (M-08 부속)

**File**: `hooks/hooks.json`
**Change Type**: Modify
**Priority**: P0

```diff
- "description": "bkit Vibecoding Kit v1.5.5 - Gemini CLI Edition",
+ "description": "bkit Vibecoding Kit v1.5.6 - Gemini CLI Edition",
```

---

### 2.9 before-tool.js 주석 업데이트 (M-08 부속)

**File**: `hooks/scripts/before-tool.js`
**Change Type**: Modify (minimal)
**Priority**: P1

```diff
- * BeforeTool Hook - Pre-execution Validation (v1.5.1)
+ * BeforeTool Hook - Pre-execution Validation (v1.5.6)
```

---

## 3. New File Summary

| File | Type | Lines (est.) | Purpose |
|---|:---:|:---:|---|
| `lib/adapters/gemini/hook-adapter.js` | New | ~60 | RuntimeHook function 지원 유틸리티 |

---

## 4. Version String Update Matrix

모든 `v1.5.5` 참조를 `v1.5.6`으로 업데이트해야 하는 파일:

| File | Location | Change |
|---|---|---|
| `bkit.config.json` | `"version"` field | `"1.5.5"` → `"1.5.6"` |
| `gemini-extension.json` | `"version"` field | `"1.5.5"` → `"1.5.6"` |
| `hooks/hooks.json` | `"description"` field | `v1.5.5` → `v1.5.6` |
| `hooks/scripts/session-start.js` | comment, context strings, metadata | `v1.5.5` → `v1.5.6` (4 occurrences) |
| `hooks/scripts/before-tool.js` | comment | `v1.5.1` → `v1.5.6` |
| `lib/adapters/gemini/version-detector.js` | `@version` comment | `1.5.5` → `1.5.6` |
| `lib/adapters/gemini/policy-migrator.js` | `@version` comment, TOML header | `1.5.5` → `1.5.6` |
| `lib/adapters/gemini/tool-registry.js` | `@version` comment | `1.5.5` → `1.5.6` |

**NOTE**: 모든 hook script, lib module의 `@version` 주석은 일괄 업데이트가 이상적이나, v1.5.6의 scope는 수정된 파일만 업데이트. 나머지는 해당 파일이 수정될 때 업데이트.

---

## 5. Backward Compatibility Verification

| Component | v0.29.0 | v0.30.0 | v0.31.0 | Test |
|---|:---:|:---:|:---:|---|
| `getFeatureFlags()` | 4 flags true | 9 flags true | 18 flags true | T-02, T-03 |
| `generatePolicyFile()` | Skip (no engine) | Generate | Generate | T-04 |
| `generateLevelPolicy()` | Skip (no flag) | Skip (no flag) | Generate | T-05 |
| `getToolAnnotations()` | Returns data | Returns data | Returns data | T-06 |
| `getReadOnlyTools()` | Same list | Same list | Same list | T-08 |
| Hook scripts | Command mode | Command mode | Command mode | T-01 |
| Session metadata | v1.5.6, no features | v1.5.6, 9 features | v1.5.6, 18 features | T-01 |

---

## 6. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|:---:|:---:|---|
| `TOOL_ANNOTATIONS`의 `readOnlyHint` 분류 오류 | Low | Low | `getReadOnlyTools()` 하드코딩 유지 |
| Level policy TOML이 Gemini CLI에서 인식 안 됨 | Low | Medium | 표준 TOML 스키마 준수, 수동 검증 |
| `generateLevelPolicy()` 기존 policy와 충돌 | Medium | Low | 파일 존재 시 skip 로직 |
| Version string 누락 (일부 파일에서 v1.5.5 잔존) | Low | Low | Grep 검증 후 커밋 |
| `hook-adapter.js`가 미래 API와 불일치 | Medium | Low | 최소 구현, v1.6.0에서 조정 |

---

## 7. Implementation Estimate

| Phase | Files | Effort | Dependency |
|:---:|:---:|:---:|:---:|
| Phase 1 (P0) | 4 files | 1.5h | None |
| Phase 2 (P1) | 4 files | 6h | Phase 1 |
| Phase 3 (Integration) | 2 files | 1.2h | Phase 1+2 |
| **Total** | **10 files** | **~8.7h** | |

---

## References

- [Plan Document](../../01-plan/features/gemini-cli-031-migration.plan.md)
- [v0.31.0 Analysis Report](../../04-report/gemini-cli-031-upgrade-comprehensive-analysis.report.md)
- [Current version-detector.js](../../lib/adapters/gemini/version-detector.js) (192 lines)
- [Current policy-migrator.js](../../lib/adapters/gemini/policy-migrator.js) (273 lines)
- [Current tool-registry.js](../../lib/adapters/gemini/tool-registry.js) (210 lines)
- [Current session-start.js](../../hooks/scripts/session-start.js) (407 lines)

---

## Appendix A: v0.31.0 Breaking Change Details

> **gemini-031-researcher 발견사항 (2026-02-28)**:
> 이전 분석에서 "preview only"로 분류했던 항목들이 v0.31.0 stable에서 **ACTIVE**임이 확인됨.

### A.1 read_file 파라미터 변경 (ACTIVE in v0.31.0)

| Parameter | v0.30.0 (Old) | v0.31.0 (New) | Behavior |
|:---:|:---:|:---:|---|
| `offset` | 0-based byte offset | **Removed** | → `start_line` |
| `limit` | Max bytes to read | **Removed** | → `end_line` |
| `start_line` | N/A | **1-based line number** | Inclusive start |
| `end_line` | N/A | **1-based line number** | Inclusive end |

**bkit 영향 분석**:
- bkit hooks/skills에서 `read_file`을 직접 호출하는 코드는 없음 (Gemini CLI가 자체 처리)
- `tool-registry.js`의 `BUILTIN_TOOLS.READ_FILE` 정의는 이름만 등록하므로 영향 없음
- `before-tool.js`에서 `read_file` 이벤트를 가로채지만, 파라미터를 수정하지 않으므로 영향 없음
- **결론**: bkit v1.5.6에서 코드 변경 불필요. 단, `version-detector.js`에 모니터링 플래그 추가 완료 (`hasAllowMultipleReplace`)

### A.2 replace tool 파라미터 변경 (ACTIVE in v0.31.0)

| Parameter | v0.30.0 (Old) | v0.31.0 (New) |
|:---:|:---:|:---:|
| `expected_replacements` | Number (정확한 치환 수) | **Removed** |
| `allow_multiple` | N/A | **Boolean** (다중 치환 허용 여부) |

**bkit 영향 분석**:
- bkit에서 `replace` tool을 직접 호출하는 코드 없음
- `tool-registry.js`에 이름만 등록, 파라미터 전달 없음
- **결론**: 코드 변경 불필요. Feature flag `hasAllowMultipleReplace`로 추적

### A.3 RuntimeHook Architecture Clarification

v0.31.0의 RuntimeHook은 **SDK-based programmatic API**입니다:

```javascript
// 올바른 API (SDK-based)
import { HookSystem } from '@anthropic-ai/gemini-cli-sdk';

HookSystem.registerHook({
  event: 'session_start',       // snake_case event name
  action: async (context) => {  // Direct function, not command
    // In-process execution - no child_process spawn
    return { output: '...' };
  },
  timeout: 30000
});
```

**이전 설계의 오류 (수정됨)**:
- ~~`hooks.json`에 `type: "function"` 추가~~ → hooks.json 구조 변경 아님
- ~~`module` + `function` 필드로 함수 참조~~ → SDK의 `action` 콜백으로 직접 등록

**v1.5.6 접근 방식**: `hook-adapter.js`에서 SDK 가용성 감지 + 이벤트 이름 매핑만 제공.
실제 SDK 기반 전환은 v1.6.0에서 `@anthropic-ai/gemini-cli-sdk` 의존성 추가 후 수행.

### A.4 Policy Engine 신규 TOML 필드 (v0.31.0+)

`generateLevelPolicy()` 향후 확장 시 사용 가능한 새 필드:

```toml
# v0.31.0+ 새 필드 (v1.5.6에서는 미사용, v1.6.0 검토)

# Tool Annotations in policy
[[rule]]
toolName = "run_shell_command"
decision = "ask_user"
toolAnnotations = { destructiveHint = true }  # NEW

# Mode-specific rules
[[rule]]
toolName = "write_file"
modes = ["plan_mode"]  # NEW: Plan Mode에서만 적용
decision = "deny"

# Regex-based command matching
[[rule]]
toolName = "run_shell_command"
commandRegex = "^(rm|del|rmdir)\\s"  # NEW: commandPrefix 대안
decision = "deny"
```

**v1.5.6 결정**: 이 필드들은 사용하지 않음. 기존 `commandPrefix` 방식 유지.
v1.6.0에서 `commandRegex` 도입 검토 (더 정밀한 매칭 가능).

---

## Appendix B: Implementation Phase 2 Updated Notes

Section 2.6 `hook-adapter.js`의 설계가 수정됨에 따라 Phase 2의 의존 관계 업데이트:

```
Phase 2: Feature Enhancements (P1) ─── 병렬 가능
├── 2.1 policy-migrator.js (version-detector 의존)
├── 2.2 tool-registry.js (독립)
├── 2.3 hook-adapter.js [NEW] (version-detector 의존, hooks.json 변경 없음)
└── 2.4 hook scripts (version string 업데이트만, hook-adapter 의존 없음)
                        ^^^^^^^^^^^^^^^^^^^^^^^^
                        수정: hook-adapter에 대한 구조적 의존성 제거됨
                        (hooks.json의 type은 "command" 그대로 유지)
```

---

*bkit Vibecoding Kit v1.5.6 - Gemini CLI v0.31.0 Migration Design*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
