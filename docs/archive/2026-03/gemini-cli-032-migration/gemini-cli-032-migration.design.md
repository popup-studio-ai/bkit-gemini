# Gemini CLI v0.32.x Full Migration Design Document

> **Summary**: bkit-gemini v1.5.6 -> v1.5.7 완전 마이그레이션 상세 설계서
>
> **Project**: bkit-gemini (Vibecoding Kit - Gemini CLI Edition)
> **Version**: v1.5.7
> **Author**: CTO Agent Team (6 Specialists)
> **Date**: 2026-03-04
> **Status**: Final
> **Plan Reference**: `docs/01-plan/features/gemini-cli-032-migration.plan.md`
> **Analysis Reference**: `docs/04-report/features/gemini-cli-upgrade.report.md`

---

## 1. Design Overview

### 1.1 Architecture Summary

bkit-gemini은 Gemini CLI Extension 아키텍처를 따르며, 핵심 구조는:

```
gemini-extension.json          ← Extension manifest (entry point)
GEMINI.md                      ← Global context (contextFileName)
hooks/hooks.json               ← Hook event declarations
hooks/scripts/*.js             ← Hook implementations
lib/adapters/gemini/*.js       ← Core adapter modules
lib/core/*.js                  ← Core libraries
mcp/spawn-agent-server.js      ← MCP agent orchestration server
agents/*.md                    ← 16 agent definitions
skills/*/SKILL.md              ← 29 skill definitions
```

### 1.2 Design Principles

1. **Feature Flag Guard**: 모든 v0.32.0+ 기능은 `version-detector.js` feature flag로 게이트
2. **Backward Compatibility**: v0.29.0~v0.31.0에서 기존 동작 100% 유지
3. **SDK + Command Dual-Mode**: 6 hot-path hooks는 SDK `HookSystem.registerHook()` + stdin command 병행, 4 lifecycle hooks는 command-only
4. **Bridge, Not Replace**: Task Tracker는 MCP team 도구와 공존 (대체하지 않음)
5. **Minimal Blast Radius**: 변경은 해당 모듈에 격리, 전파는 grep 기반 정밀 타겟팅

---

## 2. WS-01: Tool Registry 상세 설계

### 2.1 Target File

`lib/adapters/gemini/tool-registry.js` (현재 271줄 -> 예상 ~310줄)

### 2.2 Changes

#### 2.2.1 BUILTIN_TOOLS 확장 (Line 17~44)

```javascript
// 기존 17개 뒤에 추가:

  // Task Tracker (v0.32.0+)
  TRACKER_CREATE_TASK: 'tracker_create_task',
  TRACKER_UPDATE_TASK: 'tracker_update_task',
  TRACKER_GET_TASK: 'tracker_get_task',
  TRACKER_LIST_TASKS: 'tracker_list_tasks',
  TRACKER_ADD_DEPENDENCY: 'tracker_add_dependency',
  TRACKER_VISUALIZE: 'tracker_visualize'
```

**Verification**: `Object.keys(BUILTIN_TOOLS).length === 23`

#### 2.2.2 TOOL_CATEGORIES 확장 (Line 89~117)

```javascript
  // 기존 카테고리 뒤에 추가:
  TASK_TRACKER: [
    BUILTIN_TOOLS.TRACKER_CREATE_TASK,
    BUILTIN_TOOLS.TRACKER_UPDATE_TASK,
    BUILTIN_TOOLS.TRACKER_GET_TASK,
    BUILTIN_TOOLS.TRACKER_LIST_TASKS,
    BUILTIN_TOOLS.TRACKER_ADD_DEPENDENCY,
    BUILTIN_TOOLS.TRACKER_VISUALIZE
  ]
```

#### 2.2.3 TOOL_ANNOTATIONS 확장 (Line 122~140)

```javascript
  // 기존 17개 뒤에 추가:
  [BUILTIN_TOOLS.TRACKER_CREATE_TASK]: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  [BUILTIN_TOOLS.TRACKER_UPDATE_TASK]: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  [BUILTIN_TOOLS.TRACKER_GET_TASK]: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.TRACKER_LIST_TASKS]: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.TRACKER_ADD_DEPENDENCY]: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  [BUILTIN_TOOLS.TRACKER_VISUALIZE]: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
```

#### 2.2.4 CLAUDE_TO_GEMINI_MAP 확장 (Line 144~159)

```javascript
  // 기존 매핑 뒤에 추가:
  'TaskCreate': BUILTIN_TOOLS.TRACKER_CREATE_TASK,
  'TaskUpdate': BUILTIN_TOOLS.TRACKER_UPDATE_TASK,
  'TaskGet': BUILTIN_TOOLS.TRACKER_GET_TASK,
  'TaskList': BUILTIN_TOOLS.TRACKER_LIST_TASKS
```

#### 2.2.5 getReadOnlyTools() 확장 (Line 163~178)

```javascript
// 기존 배열에 추가:
    BUILTIN_TOOLS.TRACKER_GET_TASK,
    BUILTIN_TOOLS.TRACKER_LIST_TASKS,
    BUILTIN_TOOLS.TRACKER_VISUALIZE
```

### 2.3 Impact Analysis

- `ALL_BUILTIN_TOOL_NAMES`: Set 기반이므로 자동으로 23개 반영
- `isValidToolName()`: Set.has() 기반이므로 자동 반영
- `getAllTools()`: Object.values() 기반이므로 자동 반영
- `getStrictReadOnlyTools()`: TOOL_ANNOTATIONS 기반이므로 자동 반영
- `resolveToolName()`: Set 우선 체크이므로 자동 반영

### 2.4 Backward Compatibility

v0.29.0~v0.31.0에서 tracker 도구는 CLI에 존재하지 않지만, registry에 등록만 되어 있어도 문제없음:
- `isValidToolName('tracker_create_task')` → `true` (도구 인식)
- 실제 호출 시 CLI가 "unknown tool" 에러 → `before-tool-selection.js`에서 feature flag 기반 필터링으로 방어

---

## 3. WS-02: Version Detector 상세 설계

### 3.1 Target File

`lib/adapters/gemini/version-detector.js` (현재 209줄 -> 예상 ~230줄)

### 3.2 Changes

#### 3.2.1 parseVersion() 확장 (Line 45~63)

**현재 regex**:
```javascript
const match = raw.match(/^(\d+)\.(\d+)\.(\d+)(-preview\.(\d+))?/);
```

**변경 후**:
```javascript
const match = raw.match(/^(\d+)\.(\d+)\.(\d+)(-(?:preview\.(\d+)|nightly\.(\d+)))?/);
if (!match) {
  return { major: 0, minor: 29, patch: 0, previewNum: null, nightlyNum: null, raw, isPreview: false, isNightly: false };
}

return {
  major: parseInt(match[1]),
  minor: parseInt(match[2]),
  patch: parseInt(match[3]),
  previewNum: match[5] ? parseInt(match[5]) : null,
  nightlyNum: match[6] ? parseInt(match[6]) : null,
  raw,
  isPreview: !!match[5],
  isNightly: !!match[6]
};
```

**Default return도 동일하게 nightlyNum, isNightly 추가**

#### 3.2.2 getFeatureFlags() 확장 (Line 147~174)

```javascript
// 기존 v0.31.0+ flags 뒤에 추가:

    // v0.32.0+
    hasTaskTracker: isVersionAtLeast('0.32.0'),
    hasModelFamilyToolsets: isVersionAtLeast('0.32.0'),
    hasExtensionPolicies: isVersionAtLeast('0.32.0'),
    hasPlanModeEnhanced: isVersionAtLeast('0.32.0'),
    hasA2AStreaming: isVersionAtLeast('0.32.0'),
    hasShellAutocompletion: isVersionAtLeast('0.32.0'),
    hasGrepIncludePatternRename: isVersionAtLeast('0.32.0'),
    hasReadFileLineParams: isVersionAtLeast('0.32.0'),
    hasReplaceAllowMultiple: isVersionAtLeast('0.32.0'),
    hasExcludeToolsRemoved: isVersionAtLeast('0.32.0'),
    hasParallelExtensionLoading: isVersionAtLeast('0.32.0')
```

#### 3.2.3 getVersionSummary() 확장 (Line 181~189)

```javascript
function getVersionSummary() {
  const v = detectVersion();
  const flags = getFeatureFlags();
  const features = Object.entries(flags)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name)
    .join(', ');
  const suffix = v.isPreview ? ' (preview)' : v.isNightly ? ' (nightly)' : '';
  return `Gemini CLI ${v.raw}${suffix} | Features: ${features}`;
}
```

### 3.3 Verification

```javascript
// Test cases:
parseVersion('0.32.1')           // → { major:0, minor:32, patch:1, isNightly:false, isPreview:false }
parseVersion('0.34.0-nightly.20260304') // → { major:0, minor:34, patch:0, isNightly:true, nightlyNum:20260304 }
parseVersion('0.32.0-preview.1') // → { major:0, minor:32, patch:0, isPreview:true, previewNum:1 }
isVersionAtLeast('0.32.0') with v='0.32.1' // → true
getFeatureFlags() with v='0.32.1' // → hasTaskTracker:true, etc.
```

---

## 4. WS-03: Breaking Change 대응 상세 설계

### 4.1 Breaking Changes 목록

| # | Change | Old | New | Affected Scope |
|---|--------|-----|-----|---------------|
| BC-1 | grep_search param | `include_pattern` | `file_pattern` | context docs only |
| BC-2 | read_file params | `offset`/`limit` | `start_line`/`end_line` | agent docs (3 files) |
| BC-3 | replace param | `expected_replacements` | `allow_multiple` | no current usage |
| BC-4 | excludeTools deprecated | `gemini-extension.json` | Policy Engine TOML | manifest file |
| BC-5 | --allowed-tools deprecated | CLI flag | Policy Engine | spawn-agent-server.js |

### 4.2 BC-1: grep_search `include` -> `include_pattern`

**Impact Analysis**: grep_search의 `include` 파라미터는 bkit 코드에서 직접 호출하지 않음. 에이전트/스킬 instructions에서도 현재 이 파라미터를 명시적으로 언급하지 않음.

**Action**: `.gemini/context/tool-reference.md`에 파라미터 변경 문서화만 필요.

```markdown
| `grep_search` | Search file contents | `include` (v0.31.x-), `include_pattern` (v0.32.0+) |
```

### 4.3 BC-2: read_file `offset`/`limit` -> `start_line`/`end_line`

**Impact Analysis**: 3개 에이전트 파일에서 offset/limit 언급 발견:
- `agents/security-architect.md`
- `agents/code-analyzer.md`
- `agents/bkend-expert.md`

**Action**: 이 파일들에서 파라미터 설명 업데이트 (버전별 분기 문서화)

```markdown
<!-- 변경 전 -->
Use `read_file` with `offset` and `limit` to read specific sections.

<!-- 변경 후 -->
Use `read_file` with `start_line` and `end_line` (v0.32.0+) or `offset`/`limit` (v0.31.x-) to read specific sections.
```

### 4.4 BC-3: replace `expected_replacements` -> `allow_multiple`

**Impact Analysis**: bkit 코드 및 에이전트/스킬에서 `expected_replacements` 직접 사용 없음.

**Action**: `tool-reference.md` 문서화만.

### 4.5 BC-4/5: excludeTools & --allowed-tools

WS-04 (Policy Engine)에서 처리. 아래 섹션 참조.

---

## 5. WS-04: Policy Engine 4-Tier 마이그레이션 상세 설계

### 5.1 Target Files

- `gemini-extension.json` (30줄)
- `lib/adapters/gemini/policy-migrator.js` (395줄 -> ~460줄)
- NEW `policies/bkit-extension-policy.toml` (~25줄)

### 5.2 gemini-extension.json 변경

**현재** (Line 12~15):
```json
  "excludeTools": [
    "run_shell_command(rm -rf*)",
    "run_shell_command(git push --force*)"
  ],
```

**변경 후**: `excludeTools` 섹션 완전 제거

```json
{
  "name": "bkit",
  "version": "1.5.7",
  "description": "bkit Vibecoding Kit v1.5.7 - PDCA methodology + Context Engineering for AI-native development with Gemini CLI",
  // ... (excludeTools 제거)
  "settings": [...]
}
```

### 5.3 NEW policies/bkit-extension-policy.toml

Extension-level 정책 (Tier 2: DENY/ASK_USER only, ALLOW 불가)

```toml
# bkit-gemini v1.5.7 - Extension Policy (Tier 2)
# This file replaces the deprecated excludeTools in gemini-extension.json
# Extension tier: DENY and ASK_USER decisions only (ALLOW not permitted at Tier 2)

[[rule]]
toolName = "run_shell_command"
commandPrefix = "rm -rf"
decision = "deny"
priority = 100

[[rule]]
toolName = "run_shell_command"
commandPrefix = "git push --force"
decision = "deny"
priority = 100

[[rule]]
toolName = "run_shell_command"
commandPrefix = "git reset --hard"
decision = "ask_user"
priority = 50

[[rule]]
toolName = "run_shell_command"
commandPrefix = "rm -r"
decision = "ask_user"
priority = 50
```

**배치 위치**: `policies/bkit-extension-policy.toml` (Extension root, 4 rules)

### 5.4 policy-migrator.js 변경

#### 5.4.1 validateTomlStructure() 강화 (Line 24~34)

```javascript
function validateTomlStructure(tomlContent) {
  const rules = tomlContent.match(/\[\[rule\]\]/g);
  if (!rules || rules.length === 0) {
    return false;
  }
  const decisions = tomlContent.match(/decision\s*=\s*"(allow|deny|ask_user)"/g);
  if (!decisions || decisions.length !== rules.length) {
    return false;
  }

  // v0.32.0+ field name validation: toolName (not toolname)
  const invalidFieldNames = tomlContent.match(/\btoolname\s*=/gi);
  if (invalidFieldNames) {
    const hasLowerCase = invalidFieldNames.some(m => m.includes('toolname') && !m.includes('toolName'));
    if (hasLowerCase) return false;
  }

  return true;
}
```

#### 5.4.2 NEW generateExtensionPolicy() 함수

```javascript
/**
 * Generate Extension-level policy (Tier 2 - DENY/ASK_USER only)
 * v0.32.0+: replaces excludeTools in gemini-extension.json
 *
 * @param {string} extensionRoot - Extension root directory
 * @returns {{ created: boolean, path: string|null, reason: string }}
 */
function generateExtensionPolicy(extensionRoot) {
  try {
    const { getFeatureFlags } = require('./version-detector');
    if (!getFeatureFlags().hasExtensionPolicies) {
      return { created: false, path: null, reason: 'Extension policies not available (CLI < 0.32.0)' };
    }
  } catch (e) {
    return { created: false, path: null, reason: 'Version detection failed' };
  }

  const policyDir = path.join(extensionRoot, 'policies');
  const policyPath = path.join(policyDir, 'bkit-extension-policy.toml');

  if (fs.existsSync(policyPath)) {
    return { created: false, path: policyPath, reason: 'Extension policy already exists' };
  }

  const tomlContent = [
    '# bkit-gemini v1.5.7 - Extension Policy (Tier 2)',
    '# DENY and ASK_USER decisions only (ALLOW not permitted at Tier 2)',
    `# Generated: ${new Date().toISOString().split('T')[0]}`,
    '',
    '[[rule]]',
    'toolName = "run_shell_command"',
    'commandPrefix = "rm -rf"',
    'decision = "deny"',
    'priority = 100',
    '',
    '[[rule]]',
    'toolName = "run_shell_command"',
    'commandPrefix = "git push --force"',
    'decision = "deny"',
    'priority = 100',
    ''
  ].join('\n');

  try {
    if (!fs.existsSync(policyDir)) {
      fs.mkdirSync(policyDir, { recursive: true });
    }
    fs.writeFileSync(policyPath, tomlContent, 'utf-8');
    return { created: true, path: policyPath, reason: 'Extension policy generated' };
  } catch (e) {
    return { created: false, path: null, reason: `Write failed: ${e.message}` };
  }
}
```

#### 5.4.3 convertToToml() 헤더 업데이트

```javascript
// Line 96~101: 버전 번호 업데이트
const lines = [
  '# bkit-gemini v1.5.7 - Auto-generated Policy File',
  // ...
];
```

#### 5.4.4 LEVEL_POLICY_TEMPLATES 버전 업데이트

```javascript
// Line 268~: 주석과 버전 업데이트
// Generated at workspace tier (.gemini/policies/) where `allow` decision IS permitted.
```

#### 5.4.5 Exports 확장

```javascript
module.exports = {
  // 기존 exports...
  generateExtensionPolicy  // NEW
};
```

### 5.5 session-start.js 통합

기존 `session-start.js` Line 31~45에서 Policy Engine 자동 생성 로직 확장:

```javascript
// 3.5. Auto-generate Policy Engine TOML (v0.30.0+)
try {
  const vd = require(path.join(libPath, 'adapters', 'gemini', 'version-detector'));
  const flags = vd.getFeatureFlags();
  if (flags.hasPolicyEngine) {
    const pm = require(path.join(libPath, 'adapters', 'gemini', 'policy-migrator'));
    const result = pm.generatePolicyFile(projectDir, pluginRoot);

    // 3.6. Generate level-specific policy (v0.31.0+)
    if (flags.hasProjectLevelPolicy) {
      pm.generateLevelPolicy(level, projectDir);
    }

    // 3.7. Generate extension policy (v0.32.0+) - NEW
    if (flags.hasExtensionPolicies) {
      pm.generateExtensionPolicy(pluginRoot);
    }
  }
} catch (e) {
  // Policy TOML generation skipped - non-fatal
}
```

---

## 6. WS-05: RuntimeHook 함수 마이그레이션 상세 설계

### 6.1 Strategy: SDK-Based Registration (Team Review Correction)

> **CRITICAL FINDING** (hooks-architect): `hooks.json`은 `type: "command"`만 지원.
> `type: "function"`은 hooks.json에서 지원하지 않음.
> RuntimeHook 함수는 반드시 SDK의 `HookSystem.registerHook()` API로 프로그래밍 방식 등록 필요.

**접근 방식**:
1. `hooks.json` → 변경 없음 (10개 hook 모두 `type: "command"` 유지)
2. 새 모듈 `hooks/runtime-hooks.js` → SDK 기반 6개 hot-path hook 등록
3. 각 hook 스크립트 → `handler()` export (SDK용) + `main()` (stdin 커맨드 fallback)
4. 나머지 4개 hook → command-only 유지 (SessionStart, AfterAgent, PreCompress, SessionEnd)

### 6.2 hooks.json 변경 전략

hooks.json은 **정적 파일로 유지** (type: "command"). 변경 사항은 description 내 버전 문자열만.

**실제 hooks.json 구조 변경 없음** - SDK 기반 `HookSystem.registerHook()`으로 function 모드 활성화.

### 6.2.1 NEW hooks/runtime-hooks.js (SDK Registration Module)

```javascript
/**
 * RuntimeHook SDK Registration Module
 * Registers 6 hot-path hooks via HookSystem.registerHook() (v0.31.0+)
 *
 * hooks.json does NOT support type:"function".
 * SDK registration is the ONLY way to use RuntimeHook functions.
 *
 * @version 1.5.7
 */
const path = require('path');
const { getFeatureFlags } = require('../lib/adapters/gemini/version-detector');

const SCRIPTS_DIR = path.join(__dirname, 'scripts');

// 6 hot-path hooks that benefit from function mode (40-97% faster)
const HOT_PATH_HOOKS = [
  { event: 'BeforeAgent', script: 'before-agent.js' },
  { event: 'BeforeModel', script: 'before-model.js' },
  { event: 'AfterModel', script: 'after-model.js' },
  { event: 'BeforeToolSelection', script: 'before-tool-selection.js' },
  { event: 'BeforeTool', script: 'before-tool.js' },
  { event: 'AfterTool', script: 'after-tool.js' }
];

// 4 hooks remain command-only (lifecycle events, not hot-path)
// SessionStart, AfterAgent, PreCompress, SessionEnd

/**
 * Register hot-path hooks via SDK HookSystem
 * @param {object} hookSystem - Gemini CLI HookSystem instance
 * @returns {{ registered: number, skipped: number, errors: string[] }}
 */
function registerRuntimeHooks(hookSystem) {
  // Feature flag check delegated to hook-adapter.js activateRuntimeHooks() caller
  if (typeof hookSystem.registerHook !== 'function') {
    return { registered: 0, skipped: HOT_PATH_HOOKS.length, errors: ['hookSystem.registerHook is not a function'] };
  }

  const result = { registered: 0, skipped: 0, errors: [] };

  for (const { event, script } of HOT_PATH_HOOKS) {
    try {
      const mod = require(path.join(SCRIPTS_DIR, script));
      if (typeof mod.handler !== 'function') {
        result.skipped++;
        continue;
      }
      hookSystem.registerHook(event, mod.handler);
      result.registered++;
    } catch (e) {
      result.errors.push(`${event}: ${e.message}`);
      result.skipped++;
    }
  }

  return result;
}

module.exports = { registerRuntimeHooks, HOT_PATH_HOOKS };
```

**배치 위치**: `hooks/runtime-hooks.js` (hooks/ 루트)
**호출 위치**: `session-start.js`에서 HookSystem 인스턴스가 사용 가능할 때 호출

### 6.3 Hook Script Dual-Mode 변환 패턴

모든 10개 Hook 스크립트에 적용할 통일 패턴:

```javascript
#!/usr/bin/env node
/**
 * [HookName] Hook - [Description]
 * Dual-mode: function export (v0.31.0+ RuntimeHook) + stdin command (legacy)
 */

// --- Core Logic ---
async function processHook(input) {
  // ... existing logic moved here ...
  return result;
}

// --- RuntimeHook function export (v0.31.0+) ---
async function handler(event) {
  return processHook(event);
}

// --- Legacy command mode (v0.29.0~v0.30.x) ---
if (require.main === module) {
  // Existing main() logic: read stdin, process, write stdout
  main();
}

module.exports = { handler };
```

### 6.4 변환 대상 Hook 스크립트 (SDK Dual-Mode: 6개 / Command-Only: 4개)

#### SDK Dual-Mode 변환 (6개 hot-path hooks)

| Script | Priority | Current Lines | Change |
|--------|----------|--------------|--------|
| `before-agent.js` | P0 | 186 | processHook() 분리 + handler export |
| `before-model.js` | P1 | 131 | processHook() 분리 + handler export |
| `after-model.js` | P1 | ~80 | processHook() 분리 + handler export |
| `before-tool-selection.js` | P0 | 158 | processHook() 분리 + handler export |
| `before-tool.js` | P0 | 188 | processHook() 분리 + handler export |
| `after-tool.js` | P0 | 142 | processHook() 분리 + handler export |

#### Command-Only 유지 (4개 lifecycle hooks)

| Script | Priority | Current Lines | Reason |
|--------|----------|--------------|--------|
| `session-start.js` | P0 | 392 | 복잡한 초기화 로직, 실행 빈도 낮음 (세션당 1회) |
| `after-agent.js` | P0 | 237 | Loop guard env var 조작 필요, 격리 실행 |
| `pre-compress.js` | P2 | ~60 | 드물게 실행, command 충분 |
| `session-end.js` | P2 | ~50 | 세션당 1회, command 충분 |

### 6.5 hook-adapter.js 활성화 설계

**현재**: Detection-only (v1.5.6, 84줄)
**변경 후**: Active SDK integration support (~140줄)

```javascript
/**
 * Hook Adapter - RuntimeHook SDK Integration
 * v1.5.7: SDK-based registration via HookSystem.registerHook()
 *
 * IMPORTANT: hooks.json only supports type:"command".
 * RuntimeHook functions MUST be registered via SDK API.
 *
 * @version 1.5.7
 */
const path = require('path');
const { getFeatureFlags } = require('./version-detector');

function supportsRuntimeHookFunctions() {
  try {
    return getFeatureFlags().hasRuntimeHookFunctions === true;
  } catch (e) {
    return false;
  }
}

/**
 * Get hook execution mode for the detected CLI version
 * v1.5.7: Returns 'function' when RuntimeHook available, 'command' otherwise
 */
function getHookExecutionInfo(hookEvent) {
  const sdkAvailable = supportsRuntimeHookFunctions();
  return {
    mode: sdkAvailable ? 'function' : 'command',
    sdkAvailable,
    hookEvent
  };
}

/**
 * Activate RuntimeHook functions via SDK registration
 * Called from session-start.js when HookSystem is available
 *
 * @param {object} hookSystem - Gemini CLI HookSystem instance
 * @returns {{ registered: number, skipped: number, errors: string[] }}
 */
function activateRuntimeHooks(hookSystem) {
  if (!supportsRuntimeHookFunctions() || !hookSystem) {
    return { registered: 0, skipped: 0, errors: ['SDK not available'] };
  }

  try {
    const { registerRuntimeHooks } = require(
      path.join(__dirname, '..', '..', '..', 'hooks', 'runtime-hooks')
    );
    return registerRuntimeHooks(hookSystem);
  } catch (e) {
    return { registered: 0, skipped: 0, errors: [e.message] };
  }
}

/**
 * Load hook handler function for direct invocation
 * @param {string} scriptPath - Absolute path to hook script
 * @returns {Function|null} handler function or null
 */
function loadHookHandler(scriptPath) {
  if (!supportsRuntimeHookFunctions()) return null;

  try {
    const hookModule = require(scriptPath);
    if (typeof hookModule.handler === 'function') {
      return hookModule.handler;
    }
  } catch (e) {
    // Fallback to command mode
  }
  return null;
}

/**
 * Get migration status summary
 * @returns {{ mode: string, sdkRegistered: number, commandOnly: number }}
 */
function getMigrationStatus() {
  const sdk = supportsRuntimeHookFunctions();
  return {
    mode: sdk ? 'sdk+command' : 'command-only',
    sdkRegistered: sdk ? 6 : 0,
    commandOnly: sdk ? 4 : 10
  };
}

// HOOK_EVENT_MAP remains the same
const HOOK_EVENT_MAP = Object.freeze({
  'SessionStart': 'session_start',
  'SessionEnd': 'session_end',
  'BeforeTool': 'before_tool',
  'AfterTool': 'after_tool',
  'BeforeModel': 'before_model',
  'AfterModel': 'after_model',
  'BeforeAgent': 'before_agent',
  'AfterAgent': 'after_agent',
  'BeforeToolSelection': 'before_tool_selection',
  'PreCompress': 'pre_compress'
});

module.exports = {
  supportsRuntimeHookFunctions,
  getHookExecutionInfo,
  activateRuntimeHooks,
  loadHookHandler,
  getMigrationStatus,
  HOOK_EVENT_MAP
};
```

### 6.6 Performance Impact

| Metric | Before (command) | After (function) | Improvement |
|--------|:---:|:---:|:---:|
| Single hook call | 50-200ms | 1-5ms | 40-97% faster |
| 6 hooks per turn | 300-1200ms | 6-30ms | 97%+ faster |
| session-start | ~200ms | ~5ms | 97% faster |

---

## 7. WS-06: Task Tracker - PDCA Bridge 상세 설계

### 7.1 New File

`lib/adapters/gemini/tracker-bridge.js` (~180줄)

### 7.2 Module Design (bridge-architect Enhanced)

```javascript
/**
 * Task Tracker - PDCA Bridge
 * Instruction-based bridge: generates context hints, NOT direct tool calls
 * One-way sync: PDCA → Tracker (PDCA is source of truth)
 *
 * Bridge state stored in docs/.tracker-bridge.json (ID mappings only)
 * Coexists with MCP team tools (spawn-agent-server) - different storage/lifecycle
 *
 * @version 1.5.7
 */
const fs = require('fs');
const path = require('path');
const { getFeatureFlags } = require('./version-detector');

const BRIDGE_STATE_FILE = 'docs/.tracker-bridge.json';

function isTrackerAvailable() {
  try {
    return getFeatureFlags().hasTaskTracker === true;
  } catch (e) {
    return false;
  }
}

const PDCA_TO_TRACKER_STATUS = Object.freeze({
  plan: 'in_progress', design: 'in_progress', do: 'in_progress',
  check: 'in_progress', act: 'in_progress', completed: 'done', archived: 'done'
});

/**
 * Create PDCA epic in tracker (context hint generation)
 * Returns instruction text for LLM context, not direct API call
 */
function createPdcaEpic(feature) {
  if (!isTrackerAvailable()) return { available: false, hint: '' };
  return {
    available: true,
    hint: `Use tracker_create_task to create epic: "[PDCA] ${feature}" with 6 subtasks (Plan, Design, Do, Check, Act, Report)`
  };
}

/**
 * Sync PDCA phase transition to tracker (context hint)
 */
function syncPhaseTransition(feature, fromPhase, toPhase) {
  if (!isTrackerAvailable()) return '';
  const status = PDCA_TO_TRACKER_STATUS[toPhase] || 'in_progress';
  return `Update tracker: [${capitalize(fromPhase)}] → done, [${capitalize(toPhase)}] → ${status}`;
}

/**
 * Get visualization hint for current state
 */
function getVisualizationHint(feature, currentPhase) {
  if (!isTrackerAvailable()) return '';
  const phases = ['plan', 'design', 'do', 'check', 'act', 'report'];
  const idx = phases.indexOf(currentPhase);
  return phases.map((p, i) => {
    const label = capitalize(p);
    if (i < idx) return `[${label}] done`;
    if (i === idx) return `[${label}] >>> active`;
    return `[${label}] pending`;
  }).join(' -> ');
}

/**
 * Register tracker task IDs for bridge state persistence
 */
function registerTrackerIds(feature, taskIds) {
  try {
    const statePath = path.join(process.cwd(), BRIDGE_STATE_FILE);
    let state = {};
    if (fs.existsSync(statePath)) {
      state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    }
    state[feature] = { ...state[feature], taskIds, updatedAt: new Date().toISOString() };
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) { /* non-fatal */ }
}

/**
 * Get context injection for session-start
 */
function getTrackerContextInjection(feature, phase) {
  if (!isTrackerAvailable()) return '';
  return [
    '', '## Task Tracker Integration (v0.32.0+)',
    `Native Task Tracker available. PDCA feature "${feature}" can be tracked with:`,
    `- \`tracker_create_task\` to create tracker tasks`,
    `- \`tracker_visualize\` to view task graph`,
    `Current PDCA progress: ${getVisualizationHint(feature, phase)}`, ''
  ].join('\n');
}

/**
 * Get bridge operational status
 */
function getBridgeStatus() {
  return {
    available: isTrackerAvailable(),
    mode: 'instruction-based',
    syncDirection: 'pdca-to-tracker (one-way)',
    coexistence: 'MCP team tools operate independently'
  };
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

module.exports = {
  isTrackerAvailable, PDCA_TO_TRACKER_STATUS,
  createPdcaEpic, syncPhaseTransition, getVisualizationHint,
  registerTrackerIds, getTrackerContextInjection,
  getBridgeStatus
};
```

### 7.3 Architecture: Coexistence with MCP Team Tools

| Aspect | MCP Team Tools (spawn-agent-server) | Native Task Tracker |
|--------|-------------------------------------|---------------------|
| Storage | `.claude/teams/`, `.claude/tasks/` | Gemini CLI internal |
| Lifecycle | Session-scoped | Persistent |
| Namespace | Team-based | Feature-based |
| Purpose | Agent orchestration | PDCA progress visualization |
| Bridge | - | `tracker-bridge.js` (instruction-based) |

### 7.4 Integration Points

1. **session-start.js**: 세션 시작 시 `getTrackerContextInjection()` 호출하여 context에 주입
2. **before-tool-selection.js**: tracker read-only 도구를 PDCA phase별 필터링에 포함
3. **Bridge state**: `docs/.tracker-bridge.json`에 ID 매핑만 저장 (최소 footprint)
4. One-way sync only in v1.5.7 (PDCA → Tracker, PDCA is source of truth)

---

## 8. WS-07: Bug Guards 상세 설계

### 8.1 AfterAgent Loop Guard

**Target**: `hooks/scripts/after-agent.js` (237줄)

**Problem**: Gemini CLI Issue #20426 - AfterAgent hook이 자기 자신을 다시 트리거하여 무한 루프 발생 가능

**Design**:

```javascript
// after-agent.js Line 27 (main 함수 시작부)에 추가:

// Loop guard: prevent AfterAgent from triggering itself infinitely
const LOOP_GUARD_KEY = '__BKIT_AFTER_AGENT_DEPTH';
const MAX_REENTRY = 3;

function main() {
  const depth = parseInt(process.env[LOOP_GUARD_KEY] || '0');
  if (depth >= MAX_REENTRY) {
    // Max reentry reached - pass through without processing
    try {
      const { getAdapter } = require(path.join(libPath, 'adapters'));
      getAdapter().outputEmpty();
    } catch (e) {
      process.exit(0);
    }
    return;
  }
  process.env[LOOP_GUARD_KEY] = String(depth + 1);

  try {
    // ... existing logic ...
  } finally {
    // Reset depth on completion
    process.env[LOOP_GUARD_KEY] = String(Math.max(0, depth));
  }
}
```

### 8.2 Sub-agent Timeout Guard

**Target**: `mcp/spawn-agent-server.js` Line 691~759 (executeAgent)

**Current State**: 이미 timeout 로직이 존재 (Line 746~758). 강화 필요:

```javascript
executeAgent(agentPath, task, context, timeout) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const { getFeatureFlags } = require(path.join(__dirname, '..', 'lib', 'adapters', 'gemini', 'version-detector'));
    const flags = getFeatureFlags();
    const approvalFlag = flags.hasApprovalMode ? '--approval-mode=yolo' : '--yolo';

    const args = ['-e', agentPath, approvalFlag, task];

    const env = { ...process.env };
    if (context) {
      env.BKIT_AGENT_CONTEXT = JSON.stringify(context);
    }

    // v0.32.0+ sub-agent hang prevention: force non-interactive
    if (flags.hasTaskTracker) {  // proxy for v0.32.0+
      env.GEMINI_NON_INTERACTIVE = '1';
    }

    const proc = spawn('gemini', args, {
      env,
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']  // All stdio piped (no interactive)
    });

    // ... existing stdout/stderr handling ...

    // Enhanced timeout with SIGTERM -> SIGKILL escalation
    const MAX_TIMEOUT = 600000;  // 10 min absolute max
    const effectiveTimeout = Math.min(timeout, MAX_TIMEOUT);

    const timeoutId = setTimeout(() => {
      console.error(`Agent timeout after ${effectiveTimeout}ms, sending SIGTERM`);
      proc.kill('SIGTERM');
      setTimeout(() => {
        if (!proc.killed) {
          console.error('Agent did not exit after SIGTERM, sending SIGKILL');
          proc.kill('SIGKILL');
        }
      }, 5000);
      reject(new Error(`Agent execution timed out after ${effectiveTimeout}ms`));
    }, effectiveTimeout);

    proc.on('close', () => clearTimeout(timeoutId));
  });
}
```

### 8.3 Key Changes Summary

| Guard | File | Line | Description |
|-------|------|------|-------------|
| Loop Guard | after-agent.js | 27-40 | Env var depth counter, MAX_REENTRY=3 |
| Timeout Cap | spawn-agent-server.js | 691 | MAX_TIMEOUT=600s absolute cap |
| Non-Interactive | spawn-agent-server.js | 715 | GEMINI_NON_INTERACTIVE env for v0.32.0+ |

---

## 9. WS-08/09: Agent & Skill Updates 상세 설계

### 9.1 Agent Updates (16 agents)

#### 9.1.1 Tracker Tool Additions

에이전트 frontmatter `tools:` 섹션에 tracker 도구 추가 (해당 에이전트만):

| Agent | Added Tools | Rationale |
|-------|------------|-----------|
| `cto-lead.md` | tracker_create_task, tracker_update_task, tracker_list_tasks, tracker_visualize | PDCA 오케스트레이션 |
| `product-manager.md` | tracker_create_task, tracker_list_tasks | 요구사항 → 태스크 생성 |
| `pdca-iterator.md` | tracker_update_task, tracker_get_task | 이터레이션 상태 동기화 |
| `qa-strategist.md` | tracker_list_tasks, tracker_visualize | 테스트 태스크 조회 |

**나머지 12개 에이전트**: tracker 도구 불필요 (역할과 무관)

#### 9.1.2 read_file Parameter Update

3개 에이전트의 instructions에서 `offset`/`limit` 언급부를 버전별 분기 설명으로 업데이트:

- `agents/security-architect.md`
- `agents/code-analyzer.md`
- `agents/bkend-expert.md`

### 9.2 Skill Updates (29 skills)

#### 9.2.1 Tracker Tool Additions

스킬 SKILL.md의 `allowed-tools:` 섹션에 tracker 도구 추가:

| Skill | Added Tools | Rationale |
|-------|------------|-----------|
| `pdca/SKILL.md` | tracker_create_task, tracker_update_task, tracker_list_tasks, tracker_visualize | PDCA 전체 사이클 |
| `development-pipeline/SKILL.md` | tracker_list_tasks, tracker_visualize | 파이프라인 진행 조회 |
| `phase-8-review/SKILL.md` | tracker_list_tasks | 리뷰 태스크 조회 |

**나머지 26개 스킬**: tracker 도구 불필요

---

## 10. WS-10: Documentation Updates 상세 설계

### 10.1 GEMINI.md

**변경 사항**:
- "17 built-in tools" -> "23 built-in tools"
- "v0.29.0~v0.31.0" -> "v0.29.0~v0.32.1"
- Task Tracker 카테고리 설명 추가

### 10.2 .gemini/context/tool-reference.md

**전면 업데이트**:
- 17개 -> 23개 도구 테이블
- 6개 tracker 도구 설명 추가
- 파라미터 변경 사항 (BC-1, BC-2, BC-3) 문서화
- Tool Annotations 테이블에 6개 추가

### 10.3 README.md

**변경 사항**:
- 호환성 섹션: v0.29.0~v0.32.1
- 도구 매핑 테이블에 tracker 4개 추가
- v1.5.7 Highlights 섹션 추가

### 10.4 CHANGELOG.md

```markdown
## [1.5.7] - 2026-03-XX

### Added
- 6 Task Tracker tool registrations (v0.32.0+): tracker_create_task, tracker_update_task, tracker_get_task, tracker_list_tasks, tracker_add_dependency, tracker_visualize
- 11 v0.32.0+ feature flags in version-detector
- Nightly version format parsing support
- Extension-level TOML policy (Tier 2) replacing deprecated excludeTools
- Task Tracker - PDCA Bridge module (tracker-bridge.js)
- AfterAgent loop guard (Issue #20426 mitigation)
- Sub-agent timeout cap (600s) and non-interactive mode

### Changed
- 6 hot-path hook scripts converted to SDK dual-mode (HookSystem.registerHook + stdin fallback)
- New hooks/runtime-hooks.js SDK registration module
- hook-adapter.js activated with activateRuntimeHooks() for SDK integration
- Policy Engine migrated to 4-tier system (Extension/Workspace separation)
- Tool reference docs updated for 23 tools
- 4 agent frontmatters updated with tracker tools
- 3 skill frontmatters updated with tracker tools

### Removed
- excludeTools from gemini-extension.json (replaced by Extension TOML policy)

### Fixed
- validateTomlStructure() now validates toolName field casing
```

---

## 11. WS-11: Configuration Updates 상세 설계

### 11.1 bkit.config.json

```json
{
  "version": "1.5.7",

  "compatibility": {
    "minGeminiCliVersion": "0.29.0",
    "testedVersions": ["0.29.0", "0.29.5", "0.29.7", "0.30.0-preview.3", "0.30.0", "0.31.0", "0.32.0", "0.32.1"],
    "policyEngine": {
      "autoGenerate": true,
      "outputDir": ".gemini/policies/",
      "extensionPolicyDir": "policies/",
      "levelPolicies": {
        "enabled": true,
        "templates": {
          "Starter": "bkit-starter-policy",
          "Dynamic": "bkit-dynamic-policy",
          "Enterprise": "bkit-enterprise-policy"
        }
      }
    },
    "runtimeHooks": {
      "enabled": true,
      "minVersion": "0.31.0",
      "dualMode": true
    },
    "taskTracker": {
      "enabled": true,
      "minVersion": "0.32.0",
      "bridgeEnabled": true
    }
  }
}
```

### 11.2 gemini-extension.json

```json
{
  "name": "bkit",
  "version": "1.5.7",
  "description": "bkit Vibecoding Kit v1.5.7 - PDCA methodology + Context Engineering for AI-native development with Gemini CLI"
  // excludeTools 제거
  // settings 유지
}
```

---

## 12. WS-12: Test Suite 상세 설계

### 12.1 New Test File

`tests/suites/tc21-v032-migration.js`

### 12.2 Test Cases

```javascript
/**
 * TC-21 ~ TC-31: v0.32.x Migration Tests
 */

// TC-21: Tool Registry - 23 tools registered
test('TC-21: Tool Registry has 23 built-in tools', () => {
  const { ALL_BUILTIN_TOOL_NAMES } = require('../../lib/adapters/gemini/tool-registry');
  assert.strictEqual(ALL_BUILTIN_TOOL_NAMES.size, 23);
});

// TC-22: Tool Registry - 6 tracker tool annotations
test('TC-22: Tracker tools have correct annotations', () => {
  const { TOOL_ANNOTATIONS, BUILTIN_TOOLS } = require('../../lib/adapters/gemini/tool-registry');
  assert.ok(TOOL_ANNOTATIONS[BUILTIN_TOOLS.TRACKER_GET_TASK].readOnlyHint === true);
  assert.ok(TOOL_ANNOTATIONS[BUILTIN_TOOLS.TRACKER_CREATE_TASK].readOnlyHint === false);
});

// TC-23: Feature Flags - 11 v0.32.0+ flags
test('TC-23: v0.32.0+ feature flags are present', () => {
  const vd = require('../../lib/adapters/gemini/version-detector');
  vd.resetCache();
  process.env.GEMINI_CLI_VERSION = '0.32.1';
  const flags = vd.getFeatureFlags();
  assert.ok(flags.hasTaskTracker);
  assert.ok(flags.hasModelFamilyToolsets);
  assert.ok(flags.hasExtensionPolicies);
  assert.ok(flags.hasGrepIncludePatternRename);
  assert.ok(flags.hasReadFileLineParams);
  assert.ok(flags.hasReplaceAllowMultiple);
  assert.ok(flags.hasExcludeToolsRemoved);
  vd.resetCache();
  delete process.env.GEMINI_CLI_VERSION;
});

// TC-24: Policy Engine - Extension/Workspace Tier separation
test('TC-24: Extension policy generates DENY/ASK_USER only', () => {
  const pm = require('../../lib/adapters/gemini/policy-migrator');
  // generateExtensionPolicy test with temp dir
});

// TC-25: Policy Engine - field name validation
test('TC-25: validateTomlStructure rejects lowercase toolname', () => {
  const pm = require('../../lib/adapters/gemini/policy-migrator');
  const badToml = '[[rule]]\ntoolname = "read_file"\ndecision = "allow"\npriority = 10\n';
  assert.strictEqual(pm.validateTomlStructure(badToml), false);
});

// TC-26: Version Detector - nightly parsing
test('TC-26: parseVersion handles nightly format', () => {
  const { parseVersion } = require('../../lib/adapters/gemini/version-detector');
  const v = parseVersion('0.34.0-nightly.20260304');
  assert.strictEqual(v.major, 0);
  assert.strictEqual(v.minor, 34);
  assert.strictEqual(v.patch, 0);
  assert.strictEqual(v.isNightly, true);
  assert.strictEqual(v.nightlyNum, 20260304);
});

// TC-27: BeforeToolSelection - tracker tools in phase filtering
test('TC-27: Tracker read-only tools allowed in check phase', () => {
  const { getReadOnlyTools, BUILTIN_TOOLS } = require('../../lib/adapters/gemini/tool-registry');
  const readOnly = getReadOnlyTools();
  assert.ok(readOnly.includes(BUILTIN_TOOLS.TRACKER_GET_TASK));
  assert.ok(readOnly.includes(BUILTIN_TOOLS.TRACKER_LIST_TASKS));
  assert.ok(readOnly.includes(BUILTIN_TOOLS.TRACKER_VISUALIZE));
  assert.ok(!readOnly.includes(BUILTIN_TOOLS.TRACKER_CREATE_TASK));
});

// TC-28: Tracker Bridge - availability check
test('TC-28: Tracker bridge reports availability based on feature flag', () => {
  const tb = require('../../lib/adapters/gemini/tracker-bridge');
  vd.resetCache();
  process.env.GEMINI_CLI_VERSION = '0.32.1';
  assert.ok(tb.isTrackerAvailable());
  vd.resetCache();
  process.env.GEMINI_CLI_VERSION = '0.31.0';
  assert.ok(!tb.isTrackerAvailable());
  vd.resetCache();
  delete process.env.GEMINI_CLI_VERSION;
});

// TC-29: AfterAgent loop guard
test('TC-29: AfterAgent loop guard structure', () => {
  const content = fs.readFileSync('hooks/scripts/after-agent.js', 'utf-8');
  assert.ok(content.includes('LOOP_GUARD_KEY'));
  assert.ok(content.includes('MAX_REENTRY'));
  assert.ok(content.includes('__BKIT_AFTER_AGENT_DEPTH'));
});

// TC-30: Hook dual-mode exports
test('TC-30: Hook dual-mode exports', () => {
  const hookFiles = [
    'before-agent.js', 'before-model.js', 'after-model.js',
    'before-tool-selection.js', 'before-tool.js', 'after-tool.js'
  ];
  for (const file of hookFiles) {
    const mod = require(`../../hooks/scripts/${file}`);
    assert.ok(typeof mod.handler === 'function', `${file} should export handler`);
  }
});

// TC-31: Backward compatibility - v0.29.0 regression
test('TC-31: v0.29.0 backward compatibility', () => {
  const vd = require('../../lib/adapters/gemini/version-detector');
  vd.resetCache();
  process.env.GEMINI_CLI_VERSION = '0.29.0';
  const flags = vd.getFeatureFlags();
  assert.ok(!flags.hasTaskTracker);
  assert.ok(!flags.hasExtensionPolicies);
  assert.ok(flags.hasPlanMode);
  vd.resetCache();
  delete process.env.GEMINI_CLI_VERSION;
});
```

---

## 13. Implementation Order (의존성 기반)

```
Phase 1: Foundation
  ① version-detector.js (WS-02) - 모든 feature flag의 기반
  ② tool-registry.js (WS-01) - 다른 모듈이 참조

Phase 2: Breaking Changes
  ③ tool-reference.md, agent docs (WS-03) - 파라미터 변경 문서화

Phase 3: Core Infrastructure
  ④ policy-migrator.js + policies/ + gemini-extension.json (WS-04)
  ⑤ hook-adapter.js + runtime-hooks.js + 6 hook scripts SDK dual-mode (WS-05)
  ⑥ after-agent.js loop guard + spawn-agent timeout (WS-07)

Phase 4: New Feature
  ⑦ tracker-bridge.js (WS-06)
  ⑧ session-start.js tracker integration

Phase 5: Propagation
  ⑨ 4 agent frontmatter updates (WS-08)
  ⑩ 3 skill frontmatter updates (WS-09)

Phase 6: Documentation & Config
  ⑪ GEMINI.md, README.md, CHANGELOG.md, tool-reference.md (WS-10)
  ⑫ bkit.config.json, gemini-extension.json (WS-11)

Phase 7: Verification
  ⑬ tc21-v032-migration.js (TC-21 ~ TC-31) (WS-12)
  ⑭ Existing TC-01 ~ TC-20 regression test
```

---

## 14. File Change Matrix

| File | Action | WS | Lines Changed | Priority |
|------|--------|-----|--------------|----------|
| `lib/adapters/gemini/version-detector.js` | MODIFY | WS-02 | +25 | P0 |
| `lib/adapters/gemini/tool-registry.js` | MODIFY | WS-01 | +40 | P0 |
| `lib/adapters/gemini/policy-migrator.js` | MODIFY | WS-04 | +65 | P0 |
| `lib/adapters/gemini/hook-adapter.js` | MODIFY | WS-05 | +55 | P0 |
| `hooks/runtime-hooks.js` | NEW | WS-05 | +65 | P0 |
| `lib/adapters/gemini/tracker-bridge.js` | NEW | WS-06 | +200 | P1 |
| `docs/.tracker-bridge.json` | NEW (runtime) | WS-06 | auto-generated | P1 |
| `policies/bkit-extension-policy.toml` | NEW | WS-04 | +15 | P0 |
| `gemini-extension.json` | MODIFY | WS-04/11 | -4, +2 | P0 |
| `hooks/scripts/session-start.js` | MODIFY | WS-05/06 | +20 | P0 |
| `hooks/scripts/before-agent.js` | MODIFY | WS-05 | +10 | P0 |
| `hooks/scripts/before-model.js` | MODIFY | WS-05 | +10 | P1 |
| `hooks/scripts/after-model.js` | MODIFY | WS-05 | +10 | P1 |
| `hooks/scripts/before-tool-selection.js` | MODIFY | WS-05 | +15 | P0 |
| `hooks/scripts/before-tool.js` | MODIFY | WS-05 | +10 | P0 |
| `hooks/scripts/after-tool.js` | MODIFY | WS-05 | +10 | P0 |
| `hooks/scripts/after-agent.js` | MODIFY | WS-05/07 | +20 | P0 |
| `hooks/scripts/pre-compress.js` | MODIFY | WS-05 | +10 | P2 |
| `hooks/scripts/session-end.js` | MODIFY | WS-05 | +10 | P2 |
| `mcp/spawn-agent-server.js` | MODIFY | WS-07 | +10 | P1 |
| `agents/cto-lead.md` | MODIFY | WS-08 | +4 | P1 |
| `agents/product-manager.md` | MODIFY | WS-08 | +2 | P1 |
| `agents/pdca-iterator.md` | MODIFY | WS-08 | +2 | P1 |
| `agents/qa-strategist.md` | MODIFY | WS-08 | +2 | P1 |
| `agents/security-architect.md` | MODIFY | WS-03 | +2 | P1 |
| `agents/code-analyzer.md` | MODIFY | WS-03 | +2 | P1 |
| `agents/bkend-expert.md` | MODIFY | WS-03 | +2 | P1 |
| `skills/pdca/SKILL.md` | MODIFY | WS-09 | +4 | P1 |
| `skills/development-pipeline/SKILL.md` | MODIFY | WS-09 | +2 | P1 |
| `skills/phase-8-review/SKILL.md` | MODIFY | WS-09 | +1 | P1 |
| `bkit.config.json` | MODIFY | WS-11 | +15 | P0 |
| `GEMINI.md` | MODIFY | WS-10 | +10 | P1 |
| `README.md` | MODIFY | WS-10 | +20 | P1 |
| `CHANGELOG.md` | MODIFY | WS-10 | +30 | P1 |
| `.gemini/context/tool-reference.md` | MODIFY | WS-10 | +40 | P1 |
| `tests/suites/tc21-v032-migration.js` | NEW | WS-12 | +200 | P1 |
| **Total** | **36 files** | | **~920 lines** | |

---

## 15. Backward Compatibility Matrix

| CLI Version | Tool Registry | Feature Flags | Policy Engine | RuntimeHook | Tracker | Bug Guards |
|:-----------:|:---:|:---:|:---:|:---:|:---:|:---:|
| v0.29.0 | 23 tools registered (6 unused) | 23 flags, 12 enabled | bkit permission.js | command mode | unavailable | loop guard active |
| v0.30.0 | same | 16 enabled | TOML auto-gen (Tier 3) | command mode | unavailable | loop guard active |
| v0.31.0 | same | 23 enabled | TOML + Tier 3 level | function mode (dual) | unavailable | loop guard active |
| v0.32.0 | 23 tools active | 34 enabled | Tier 2 extension + Tier 3 | function mode (dual) | bridge active | all guards active |
| v0.32.1 | same | same | same | same | same | same |

**Key Guarantee**: No behavioral change for v0.29.0~v0.31.0 users. All new features are gated behind feature flags.

---

---

## Appendix A: Team Review Corrections

이 설계서는 CTO Lead가 초안 작성 후, 6명의 전문 에이전트 팀이 정밀 리뷰하여 보정한 최종 버전.

### A.1 Critical Correction: RuntimeHook Architecture (hooks-architect)

**Original**: hooks.json에서 `type: "function"`으로 변경하여 RuntimeHook 활성화
**Corrected**: hooks.json은 `type: "command"`만 지원. SDK의 `HookSystem.registerHook()` API로만 RuntimeHook 함수 등록 가능.

**Impact**: WS-05 전체 아키텍처 변경
- hooks.json 수정 없음 (구조적 변경 제거)
- 새 모듈 `hooks/runtime-hooks.js` 추가 (SDK 등록 모듈)
- `hook-adapter.js`에 `activateRuntimeHooks()` 추가
- 10개 모두 dual-mode → 6개 SDK dual-mode + 4개 command-only

### A.2 Confirmation: Zero Code Changes for Breaking Changes (breaking-change-analyst)

BC-1 (grep_search), BC-2 (read_file), BC-3 (replace) 파라미터 변경은 bkit 코드에서 직접 호출하지 않으므로 **코드 변경 필요 없음**. 문서 업데이트만 필요.

### A.3 Enhanced Tracker Bridge Design (bridge-architect)

- Instruction-based 접근 (context hint 생성, 직접 도구 호출 아님)
- One-way sync (PDCA → Tracker, PDCA가 source of truth)
- Bridge state는 `docs/.tracker-bridge.json`에 최소 데이터만 저장
- MCP team tools와 완전 독립적 공존

### A.4 Policy Engine Tier Clarification (policy-architect)

Extension 정책은 Tier 2 (Workspace와 동일 tier)이지만 **DENY/ASK_USER만 허용** (ALLOW 불가). `permission.js`에 defense-in-depth deny check 추가.

### A.5 Propagation Analysis (propagation-analyst)

- 16개 에이전트 중 4개만 tracker 도구 추가 필요 (나머지 12개는 역할과 무관)
- 29개 스킬 중 3개만 tracker 도구 추가 필요
- 3개 에이전트의 offset/limit 언급은 Gemini CLI read_file 파라미터가 아닌 일반적 설명 → 버전별 분기 문서화

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-04 | Initial design - 12 work streams | CTO Lead |
| 1.1 | 2026-03-04 | Team review corrections: SDK-based RuntimeHook, enhanced tracker bridge, 36 files ~920 lines | CTO Agent Team (6 specialists) |
