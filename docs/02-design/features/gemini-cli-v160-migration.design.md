# Gemini CLI v0.30.0 Migration Design Document

> **Summary**: bkit-gemini v1.5.4 상세 설계 - 파일별 구현 명세 및 코드 변경 사항
>
> **Project**: bkit-gemini
> **Version**: v1.5.3 -> v1.5.4
> **Author**: CTO Team (AI-assisted)
> **Date**: 2026-02-21
> **Status**: Final
> **Planning Doc**: [gemini-cli-v160-migration.plan.md](../01-plan/features/gemini-cli-v160-migration.plan.md)

---

## 1. Overview

### 1.1 Design Goals

1. Gemini CLI v0.30.0 Policy Engine과의 완전한 호환
2. 미래 도구명 변경에 자동 대응하는 방어 레이어 구축
3. Gemini 3 모델 패밀리 최적 활용
4. Zero regression (기존 v0.29.0 기능 100% 유지)

### 1.2 Design Principles

- **No Breaking Changes**: v0.29.0 사용자에게 영향 없음
- **Graceful Degradation**: 새 기능 감지 실패 시 기존 동작 유지
- **Source of Truth**: tool-registry.js 중심의 도구명 관리 유지
- **Minimal Surface**: 변경 파일 수 최소화, 기존 아키텍처 준수

---

## 2. Architecture

### 2.1 변경 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                    bkit-gemini v1.5.4                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────┐                     │
│  │ lib/adapters/gemini/                │                     │
│  │  ├─ tool-registry.js  ← FR-02      │ Source of Truth      │
│  │  │   └─ FORWARD_ALIASES (NEW)      │                     │
│  │  ├─ index.js           ← FR-05     │ Platform Adapter     │
│  │  │   └─ getCliVersion() (NEW)      │                     │
│  │  ├─ version-detector.js ← FR-05    │ NEW: Version Logic   │
│  │  └─ policy-migrator.js  ← FR-01    │ NEW: Policy Convert  │
│  └─────────────────────────────────────┘                     │
│                                                              │
│  ┌─────────────────────────────────────┐                     │
│  │ lib/core/                           │                     │
│  │  └─ permission.js      ← FR-06     │ Policy Fallback      │
│  └─────────────────────────────────────┘                     │
│                                                              │
│  ┌─────────────────┐  ┌──────────────┐  ┌─────────────┐     │
│  │ agents/*.md (16) │  │ hooks/ (10)  │  │ config (4)  │     │
│  │  ← FR-03, FR-04  │  │  ← FR-08,14 │  │  ← FR-07~09│     │
│  └─────────────────┘  └──────────────┘  └─────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
Session Start
  → version-detector.js: Gemini CLI 버전 감지
  → session-start.js: 버전 정보 표시 (v1.5.4)
  → Tool 호출 시:
    → tool-registry.js: resolveToolName() with FORWARD_ALIASES
    → permission.js: checkPermission() with Policy fallback
    → before-tool.js: 권한 검증
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| version-detector.js | Gemini CLI binary | 버전 감지 |
| policy-migrator.js | bkit.config.json | 권한 -> TOML 변환 |
| permission.js | policy-migrator.js (optional) | Policy 파일 읽기 fallback |
| tool-registry.js | (standalone) | 도구명 Source of Truth |

---

## 3. FR-01: Policy Engine Migration

### 3.1 New File: `lib/adapters/gemini/policy-migrator.js`

**Purpose**: bkit.config.json의 permissions 섹션을 Gemini CLI v0.30.0 Policy Engine TOML 형식으로 변환

```javascript
/**
 * Policy Migrator - bkit.config.json permissions -> TOML Policy
 * @version 1.5.4
 */
const fs = require('fs');
const path = require('path');

/**
 * Convert bkit permissions config to Policy Engine TOML
 *
 * Input (bkit.config.json):
 * {
 *   "permissions": {
 *     "write_file": "allow",
 *     "run_shell_command(rm -rf*)": "deny",
 *     "run_shell_command(git push --force*)": "deny",
 *     "run_shell_command(rm -r*)": "ask",
 *     "run_shell_command(git reset --hard*)": "ask"
 *   }
 * }
 *
 * Output (.gemini/policies/bkit-permissions.toml):
 * [[rule]]
 * toolName = "run_shell_command"
 * commandPrefix = "rm -rf"
 * decision = "deny"
 * ...
 *
 * @param {object} permissions - bkit.config.json permissions object
 * @returns {string} TOML content
 */
function convertToToml(permissions) { ... }

/**
 * Parse bkit permission key format
 * "run_shell_command(rm -rf*)" -> { tool: "run_shell_command", pattern: "rm -rf*" }
 * "write_file" -> { tool: "write_file", pattern: null }
 */
function parsePermissionKey(key) { ... }

/**
 * Map bkit permission level to Policy Engine decision
 * "allow" -> "allow"
 * "deny"  -> "deny"
 * "ask"   -> "ask_user"
 */
function mapDecision(level) { ... }

/**
 * Generate TOML policy file if not exists
 * Only creates when Gemini CLI >= v0.30.0 detected
 */
function generatePolicyFile(projectDir, pluginRoot) { ... }

/**
 * Check if Policy Engine TOML files exist
 */
function hasPolicyFiles(projectDir) { ... }

module.exports = {
  convertToToml,
  parsePermissionKey,
  mapDecision,
  generatePolicyFile,
  hasPolicyFiles
};
```

### 3.2 Generated TOML Output Example

**File**: `.gemini/policies/bkit-permissions.toml`

```toml
# bkit-gemini v1.5.4 - Auto-generated Policy File
# Source: bkit.config.json permissions
# Generated: 2026-02-21

# --- Deny Rules (highest priority) ---

[[rule]]
toolName = "run_shell_command"
commandPrefix = "rm -rf /"
decision = "deny"
priority = 100

[[rule]]
toolName = "run_shell_command"
commandPrefix = "rm -rf /*"
decision = "deny"
priority = 100

[[rule]]
toolName = "run_shell_command"
commandPrefix = "git push --force"
decision = "deny"
priority = 100

# --- Ask Rules ---

[[rule]]
toolName = "run_shell_command"
commandPrefix = "rm -r"
decision = "ask_user"
priority = 50

[[rule]]
toolName = "run_shell_command"
commandPrefix = "git reset --hard"
decision = "ask_user"
priority = 50

# --- Allow Rules ---

[[rule]]
toolName = "write_file"
decision = "allow"
priority = 10

[[rule]]
toolName = "replace"
decision = "allow"
priority = 10
```

### 3.3 gemini-extension.json 변경 (FR-07 연계)

```diff
 {
   "name": "bkit",
-  "version": "1.5.3",
+  "version": "1.5.4",
   "description": "bkit Vibecoding Kit - PDCA methodology + Context Engineering for AI-native development with Gemini CLI",
   "author": "POPUP STUDIO PTE. LTD.",
   "license": "Apache-2.0",
   "repository": "https://github.com/popup-studio-ai/bkit-gemini",
   "keywords": ["vibecoding", "pdca", "ai-native", "fullstack", "context-engineering", "agentic", "agents", "workflow"],

   "contextFileName": "GEMINI.md",

-  "excludeTools": [],
-
   "settings": [
     {
       "name": "Output Style",
       "description": "Response formatting style (bkit-learning, bkit-pdca-guide, bkit-enterprise, bkit-pdca-enterprise)",
       "envVar": "BKIT_OUTPUT_STYLE"
     },
     {
       "name": "Project Level",
       "description": "Override auto-detected project level (Starter, Dynamic, Enterprise)",
       "envVar": "BKIT_PROJECT_LEVEL"
     }
   ]
 }
```

**Key Changes**:
- `version`: `"1.5.3"` -> `"1.5.4"`
- `excludeTools`: **완전 제거** (v0.30.0 deprecated)

---

## 4. FR-02: Tool Alias Defense Layer

### 4.1 tool-registry.js 변경

```diff
 // ─── Legacy Aliases ───────────────────────────────────────────
 const LEGACY_ALIASES = Object.freeze({
   'search_file_content': BUILTIN_TOOLS.GREP_SEARCH
 });

+// ─── Forward Aliases (Future Compatibility v0.31.0+) ─────────
+// These are potential future tool name renames from Issue #1391
+// Pre-mapped so bkit continues working even after rename
+const FORWARD_ALIASES = Object.freeze({
+  'edit_file': BUILTIN_TOOLS.REPLACE,          // replace -> edit_file
+  'find_files': BUILTIN_TOOLS.GLOB,            // glob -> find_files
+  'find_in_file': BUILTIN_TOOLS.GREP_SEARCH,   // grep_search -> find_in_file
+  'web_search': BUILTIN_TOOLS.GOOGLE_WEB_SEARCH, // google_web_search -> web_search
+  'read_files': BUILTIN_TOOLS.READ_MANY_FILES  // read_many_files -> read_files
+});

 // ─── Resolve Legacy Tool Name ─────────────────────────────────

 function resolveToolName(name) {
   if (ALL_BUILTIN_TOOL_NAMES.has(name)) return name;
   if (LEGACY_ALIASES[name]) return LEGACY_ALIASES[name];
   if (BKIT_LEGACY_NAMES[name]) return BKIT_LEGACY_NAMES[name];
+  if (FORWARD_ALIASES[name]) return FORWARD_ALIASES[name];
   return name;
 }

+// ─── Resolve Reverse (Current -> Future) ──────────────────────
+// Used when Gemini CLI has already renamed tools
+const REVERSE_FORWARD_ALIASES = Object.freeze(
+  Object.fromEntries(
+    Object.entries(FORWARD_ALIASES).map(([future, current]) => [current, future])
+  )
+);
+
+/**
+ * Get the most appropriate tool name for the detected CLI version
+ * @param {string} name - Current canonical tool name
+ * @param {string} cliVersion - Detected Gemini CLI version (e.g., "0.30.0")
+ * @returns {string} Tool name appropriate for the CLI version
+ */
+function getVersionedToolName(name, cliVersion) {
+  // For v0.31.0+ if rename happens, return new name
+  // For now, always return canonical name
+  return name;
+}

 module.exports = {
   BUILTIN_TOOLS,
   ALL_BUILTIN_TOOL_NAMES,
   LEGACY_ALIASES,
   BKIT_LEGACY_NAMES,
+  FORWARD_ALIASES,
+  REVERSE_FORWARD_ALIASES,
   TOOL_CATEGORIES,
   CLAUDE_TO_GEMINI_MAP,
   getReadOnlyTools,
   getAllTools,
   resolveToolName,
-  isValidToolName
+  isValidToolName,
+  getVersionedToolName
 };
```

---

## 5. FR-03 & FR-04: Agent Model & Temperature Update

### 5.1 Model Mapping Strategy

| Current Model | New Model | Agent Selection Criteria |
|--------------|-----------|------------------------|
| `gemini-2.5-pro` | `gemini-3-pro` | Complex reasoning, architecture, analysis |
| `gemini-2.5-flash` | `gemini-3-flash` | Fast tasks, lightweight operations |

### 5.2 Agent-by-Agent Changes

| Agent | Old Model | New Model | Old Temp | New Temp | Rationale |
|-------|-----------|-----------|----------|----------|-----------|
| **cto-lead** | gemini-2.5-pro | gemini-3-pro | 0.3 | 0.4 | Complex orchestration, slight increase for Gemini 3 |
| **code-analyzer** | gemini-2.5-pro | gemini-3-pro | 0.2 | 0.3 | Precision analysis, slight increase |
| **design-validator** | gemini-2.5-pro | gemini-3-pro | 0.1 | 0.2 | High precision, minimal increase |
| **enterprise-expert** | gemini-2.5-pro | gemini-3-pro | 0.2 | 0.3 | Strategic decisions |
| **frontend-architect** | gemini-2.5-pro | gemini-3-pro | 0.3 | 0.4 | Creative architecture |
| **gap-detector** | gemini-2.5-pro | gemini-3-pro | 0.1 | 0.2 | High precision comparison |
| **infra-architect** | gemini-2.5-pro | gemini-3-pro | 0.2 | 0.3 | Infrastructure design |
| **qa-strategist** | gemini-2.5-pro | gemini-3-pro | 0.2 | 0.3 | Test strategy |
| **security-architect** | gemini-2.5-pro | gemini-3-pro | 0.1 | 0.2 | Security analysis precision |
| **bkend-expert** | gemini-2.5-flash | gemini-3-flash | 0.3 | 0.4 | Fast BaaS operations |
| **pdca-iterator** | gemini-2.5-flash | gemini-3-flash | 0.3 | 0.4 | Iterative fixes |
| **pipeline-guide** | gemini-2.5-flash | gemini-3-flash | 0.3 | 0.4 | Pipeline guidance |
| **product-manager** | gemini-2.5-flash | gemini-3-flash | 0.5 | 0.6 | Creative PM tasks |
| **qa-monitor** | gemini-2.5-flash | gemini-3-flash | 0.2 | 0.3 | Log monitoring |
| **report-generator** | gemini-2.5-flash | gemini-3-flash | 0.5 | 0.6 | Report writing |
| **starter-guide** | gemini-2.5-flash | gemini-3-flash | 0.7 | 0.8 | Friendly, creative guidance |

### 5.3 Agent Frontmatter Change Pattern

각 agent `.md` 파일에서:

```diff
 ---
-model: gemini-2.5-pro
+model: gemini-3-pro
-temperature: 0.1
+temperature: 0.2
 tools:
   - read_file
   ...
 ---
```

**Temperature 조정 근거**: Gemini 3에서 매우 낮은 temperature (< 0.2)는 모델 반복(looping) 유발 가능성이 있어 공식 권장에 따라 0.1 -> 0.2 이상으로 최소 조정.

---

## 6. FR-05: Version Detection System

### 6.1 New File: `lib/adapters/gemini/version-detector.js`

```javascript
/**
 * Gemini CLI Version Detector
 * Detects installed Gemini CLI version for compatibility branching
 *
 * Detection Order:
 * 1. GEMINI_CLI_VERSION env var (fastest)
 * 2. npm list -g @google/gemini-cli (reliable)
 * 3. gemini --version (fallback)
 *
 * @version 1.5.4
 */
const { execSync } = require('child_process');

// Cache version after first detection
let _cachedVersion = null;

/**
 * Detect Gemini CLI version
 * @returns {{ major: number, minor: number, patch: number, raw: string, isPreview: boolean }}
 */
function detectVersion() {
  if (_cachedVersion) return _cachedVersion;

  let raw = null;

  // Strategy 1: Environment variable
  raw = process.env.GEMINI_CLI_VERSION;

  // Strategy 2: npm global
  if (!raw) {
    try {
      const output = execSync(
        'npm list -g @google/gemini-cli --depth=0 --json 2>/dev/null',
        { timeout: 3000, encoding: 'utf-8' }
      );
      const json = JSON.parse(output);
      raw = json.dependencies?.['@google/gemini-cli']?.version;
    } catch (e) { /* ignore */ }
  }

  // Strategy 3: CLI --version
  if (!raw) {
    try {
      const output = execSync('gemini --version 2>/dev/null', {
        timeout: 3000,
        encoding: 'utf-8'
      });
      const match = output.match(/(\d+\.\d+\.\d+(-preview\.\d+)?)/);
      if (match) raw = match[1];
    } catch (e) { /* ignore */ }
  }

  // Default to minimum supported version
  if (!raw) raw = '0.29.0';

  _cachedVersion = parseVersion(raw);
  return _cachedVersion;
}

/**
 * Parse version string
 * @param {string} raw - e.g., "0.30.0-preview.3"
 */
function parseVersion(raw) {
  const match = raw.match(/^(\d+)\.(\d+)\.(\d+)(-preview\.(\d+))?/);
  if (!match) return { major: 0, minor: 29, patch: 0, raw, isPreview: false };

  return {
    major: parseInt(match[1]),
    minor: parseInt(match[2]),
    patch: parseInt(match[3]),
    previewNum: match[5] ? parseInt(match[5]) : null,
    raw,
    isPreview: !!match[4]
  };
}

/**
 * Check if CLI version >= target
 * @param {string} target - e.g., "0.30.0"
 */
function isVersionAtLeast(target) {
  const current = detectVersion();
  const tgt = parseVersion(target);

  if (current.major !== tgt.major) return current.major > tgt.major;
  if (current.minor !== tgt.minor) return current.minor > tgt.minor;
  return current.patch >= tgt.patch;
}

/**
 * Feature flags based on version
 */
function getFeatureFlags() {
  return {
    hasPlanMode: isVersionAtLeast('0.29.0'),
    hasPolicyEngine: isVersionAtLeast('0.30.0'),
    hasExcludeToolsDeprecated: isVersionAtLeast('0.30.0'),
    hasGemini3Default: isVersionAtLeast('0.29.0'),
    hasSkillsStable: isVersionAtLeast('0.26.0'),
    hasExtensionRegistry: isVersionAtLeast('0.29.0'),
    hasSDK: isVersionAtLeast('0.30.0')
  };
}

/**
 * Reset cached version (for testing)
 */
function resetCache() {
  _cachedVersion = null;
}

module.exports = {
  detectVersion,
  parseVersion,
  isVersionAtLeast,
  getFeatureFlags,
  resetCache
};
```

### 6.2 GeminiAdapter 변경 (index.js)

```diff
 const { PlatformAdapter } = require('../platform-interface');
 const { CLAUDE_TO_GEMINI_MAP } = require('./tool-registry');
+const { detectVersion, getFeatureFlags } = require('./version-detector');
 const fs = require('fs');
 const path = require('path');

 class GeminiAdapter extends PlatformAdapter {
   constructor() {
     super();
     this._name = 'gemini';
-    this._version = '1.0.0';
+    this._version = '1.5.4';
     this._pluginRoot = null;
     this._projectDir = null;
   }

+  /**
+   * Get detected Gemini CLI version
+   */
+  getCliVersion() {
+    return detectVersion();
+  }
+
+  /**
+   * Get feature flags based on Gemini CLI version
+   */
+  getFeatureFlags() {
+    return getFeatureFlags();
+  }
```

---

## 7. FR-06: Permission Manager Policy Fallback

### 7.1 permission.js 변경

```diff
 /**
  * Load permission configuration from bkit.config.json
+ * Falls back to Policy Engine TOML if available (v0.30.0+)
  */
 function loadPermissionConfig(projectDir) {
+  // v0.30.0+: Check for Policy Engine TOML files first
+  const policyDir = path.join(projectDir, '.gemini', 'policies');
+  if (fs.existsSync(policyDir)) {
+    try {
+      const policyFiles = fs.readdirSync(policyDir).filter(f => f.endsWith('.toml'));
+      if (policyFiles.length > 0) {
+        // Policy Engine is active - defer to Gemini CLI native handling
+        // Return minimal config to avoid double-checking
+        return {
+          tools: {},
+          patterns: {},
+          policyEngineActive: true
+        };
+      }
+    } catch (e) { /* ignore */ }
+  }
+
   const configPath = path.join(projectDir, 'bkit.config.json');
   // ... existing logic ...
 }

 function checkPermission(toolName, toolInput, projectDir) {
   const dir = projectDir || getProjectDir();
   const config = loadPermissionConfig(dir);

+  // If Policy Engine is active, skip bkit permission checks
+  // Gemini CLI handles permissions natively
+  if (config.policyEngineActive) {
+    return {
+      level: PERMISSION_LEVELS.ALLOW,
+      reason: 'Deferred to Policy Engine',
+      matchedPattern: null
+    };
+  }
+
   // ... existing logic ...
 }
```

---

## 8. FR-08: hooks.json Update

```diff
 {
-  "description": "bkit Vibecoding Kit v1.5.3 - Gemini CLI Edition",
+  "description": "bkit Vibecoding Kit v1.5.4 - Gemini CLI Edition",
   "hooks": {
     ...
   }
 }
```

변경 없음: hooks 이벤트 구조 및 matcher 패턴은 v0.30.0에서 변경 없음.

---

## 9. FR-09: bkit.config.json Update

```diff
 {
   "$schema": "./bkit.config.schema.json",
-  "version": "1.5.3",
+  "version": "1.5.4",
   "platform": "gemini",

   // ... existing sections ...

   "permissions": {
     "write_file": "allow",
     "replace": "allow",
     "read_file": "allow",
     "run_shell_command": "allow",
     "run_shell_command(rm -rf*)": "deny",
     "run_shell_command(rm -r*)": "ask",
     "run_shell_command(git push --force*)": "deny",
     "run_shell_command(git reset --hard*)": "ask"
   },

+  "compatibility": {
+    "minGeminiCliVersion": "0.29.0",
+    "testedVersions": ["0.29.0", "0.29.5", "0.30.0-preview.3"],
+    "policyEngine": {
+      "autoGenerate": true,
+      "outputDir": ".gemini/policies/"
+    }
+  },

   // ... rest unchanged ...
 }
```

---

## 10. FR-12: tool-reference.md Update

### .gemini/context/tool-reference.md 추가 내용

```diff
 ## Gemini CLI Built-in Tools (v0.29.0+)

 ... existing table ...

+## Tool Alias Reference (v1.5.4)
+
+### Forward Aliases (Future Compatibility)
+
+These aliases are pre-mapped for potential future Gemini CLI tool renames:
+
+| Current Name (v0.29.0) | Potential Future Name | Status |
+|------------------------|----------------------|--------|
+| `replace` | `edit_file` | Proposed (Issue #1391) |
+| `glob` | `find_files` | Proposed (Issue #1391) |
+| `grep_search` | `find_in_file` | Proposed (Issue #1391) |
+| `google_web_search` | `web_search` | Proposed (Issue #1391) |
+| `read_many_files` | `read_files` | Proposed (Issue #1391) |
+
+bkit-gemini resolves both old and new names automatically via `tool-registry.js`.
```

---

## 11. FR-13: MCP spawn-agent-server.js Update

```diff
 // Agent execution in spawn-agent-server.js
 // Update agent registry to note Gemini 3 models

-// No model-specific changes needed in MCP server
-// Agents define their own model in frontmatter
+// Agents define their own model in frontmatter (gemini-3-pro/flash)
+// MCP server version update
+const SERVER_VERSION = '1.1.0';  // was '1.0.0'
```

실제 agent spawn은 `gemini -e <agentPath>` 커맨드를 통해 이루어지며, 에이전트의 frontmatter에서 model을 직접 지정하므로 MCP 서버 코드 자체에서는 model 참조가 없음. 버전 번호만 업데이트.

---

## 12. FR-14: session-start.js Update

```diff
 // session-start.js

 function buildSessionContext(pdcaStatus, memory, projectLevel) {
   // ...
-  const header = `# bkit Vibecoding Kit v1.5.1 - Session Startup\n\n`;
+  const header = `# bkit Vibecoding Kit v1.5.4 - Session Startup\n\n`;
   // ...
 }
```

---

## 13. Implementation Order

### 13.1 Phase 1: Infrastructure (변경 기반)

| Order | File | FR | Action | Effort |
|:-----:|------|:---:|--------|:------:|
| 1 | `lib/adapters/gemini/version-detector.js` | FR-05 | **CREATE** | M |
| 2 | `lib/adapters/gemini/tool-registry.js` | FR-02 | MODIFY | S |
| 3 | `lib/adapters/gemini/policy-migrator.js` | FR-01 | **CREATE** | M |
| 4 | `lib/adapters/gemini/index.js` | FR-05 | MODIFY | S |
| 5 | `lib/core/permission.js` | FR-06 | MODIFY | S |

### 13.2 Phase 2: Agent Updates (16 files)

| Order | File | FR | Action | Effort |
|:-----:|------|:---:|--------|:------:|
| 6-21 | `agents/*.md` (16 files) | FR-03, FR-04 | MODIFY | S each |

### 13.3 Phase 3: Configuration Updates

| Order | File | FR | Action | Effort |
|:-----:|------|:---:|--------|:------:|
| 22 | `gemini-extension.json` | FR-07 | MODIFY | S |
| 23 | `bkit.config.json` | FR-09 | MODIFY | S |
| 24 | `hooks/hooks.json` | FR-08 | MODIFY | S |
| 25 | `.gemini/context/tool-reference.md` | FR-12 | MODIFY | S |

### 13.4 Phase 4: Hook & MCP Updates

| Order | File | FR | Action | Effort |
|:-----:|------|:---:|--------|:------:|
| 26 | `hooks/scripts/session-start.js` | FR-14 | MODIFY | S |
| 27 | `mcp/spawn-agent-server.js` | FR-13 | MODIFY | S |

### 13.5 Phase 5: Documentation

| Order | File | FR | Action | Effort |
|:-----:|------|:---:|--------|:------:|
| 28 | `CHANGELOG.md` | FR-11 | MODIFY | M |
| 29 | `README.md` | FR-10 | MODIFY | M |

---

## 14. File Change Summary

### 14.1 New Files (2)

| File | Lines (est.) | Purpose |
|------|:------------|---------|
| `lib/adapters/gemini/version-detector.js` | ~120 | Gemini CLI 버전 감지 |
| `lib/adapters/gemini/policy-migrator.js` | ~150 | Permission -> TOML 변환 |

### 14.2 Modified Files (27)

| File | Changes | FR |
|------|---------|:---:|
| `lib/adapters/gemini/tool-registry.js` | +FORWARD_ALIASES, +getVersionedToolName | FR-02 |
| `lib/adapters/gemini/index.js` | +getCliVersion, +getFeatureFlags, version update | FR-05 |
| `lib/core/permission.js` | +Policy Engine fallback | FR-06 |
| `gemini-extension.json` | -excludeTools, version update | FR-07 |
| `bkit.config.json` | version, +compatibility | FR-09 |
| `hooks/hooks.json` | description version | FR-08 |
| `.gemini/context/tool-reference.md` | +Alias reference table | FR-12 |
| `hooks/scripts/session-start.js` | version string | FR-14 |
| `mcp/spawn-agent-server.js` | server version | FR-13 |
| `CHANGELOG.md` | v1.5.4 entry | FR-11 |
| `README.md` | compatibility section | FR-10 |
| `agents/cto-lead.md` | model, temperature | FR-03,04 |
| `agents/code-analyzer.md` | model, temperature | FR-03,04 |
| `agents/design-validator.md` | model, temperature | FR-03,04 |
| `agents/enterprise-expert.md` | model, temperature | FR-03,04 |
| `agents/frontend-architect.md` | model, temperature | FR-03,04 |
| `agents/gap-detector.md` | model, temperature | FR-03,04 |
| `agents/infra-architect.md` | model, temperature | FR-03,04 |
| `agents/qa-strategist.md` | model, temperature | FR-03,04 |
| `agents/security-architect.md` | model, temperature | FR-03,04 |
| `agents/bkend-expert.md` | model, temperature | FR-03,04 |
| `agents/pdca-iterator.md` | model, temperature | FR-03,04 |
| `agents/pipeline-guide.md` | model, temperature | FR-03,04 |
| `agents/product-manager.md` | model, temperature | FR-03,04 |
| `agents/qa-monitor.md` | model, temperature | FR-03,04 |
| `agents/report-generator.md` | model, temperature | FR-03,04 |
| `agents/starter-guide.md` | model, temperature | FR-03,04 |

**Total**: 2 new + 27 modified = **29 files**

---

## 15. Test Plan

### 15.1 Test Scope

| Type | Target | Method |
|------|--------|--------|
| Unit Test | version-detector.js | parseVersion(), isVersionAtLeast() 검증 |
| Unit Test | policy-migrator.js | convertToToml(), parsePermissionKey() 검증 |
| Unit Test | tool-registry.js | resolveToolName() with FORWARD_ALIASES 검증 |
| Integration | 16 agents 로딩 | frontmatter YAML 파싱 성공 확인 |
| Integration | 29 skills 로딩 | frontmatter 도구명 유효성 검증 |
| Regression | 144 interactive tests | 기존 테스트 전수 통과 |
| Compatibility | v0.29.0 동작 | 기존 기능 100% 유지 확인 |
| Compatibility | v0.30.0 동작 | deprecated 경고 없음 확인 |

### 15.2 Test Cases

**version-detector.js**:
- [x] `parseVersion("0.29.0")` -> `{ major: 0, minor: 29, patch: 0, isPreview: false }`
- [x] `parseVersion("0.30.0-preview.3")` -> `{ major: 0, minor: 30, patch: 0, isPreview: true, previewNum: 3 }`
- [x] `isVersionAtLeast("0.30.0")` when version is "0.29.5" -> `false`
- [x] `isVersionAtLeast("0.29.0")` when version is "0.30.0" -> `true`
- [x] Feature flags all correct for v0.29.0 vs v0.30.0

**tool-registry.js**:
- [x] `resolveToolName("edit_file")` -> `"replace"`
- [x] `resolveToolName("find_files")` -> `"glob"`
- [x] `resolveToolName("web_search")` -> `"google_web_search"`
- [x] `resolveToolName("replace")` -> `"replace"` (canonical unchanged)
- [x] All 17 built-in tools still resolve correctly

**policy-migrator.js**:
- [x] `parsePermissionKey("run_shell_command(rm -rf*)")` -> `{ tool: "run_shell_command", pattern: "rm -rf*" }`
- [x] `parsePermissionKey("write_file")` -> `{ tool: "write_file", pattern: null }`
- [x] `mapDecision("deny")` -> `"deny"`
- [x] `mapDecision("ask")` -> `"ask_user"`
- [x] `convertToToml(permissions)` generates valid TOML

**Agent Loading**:
- [x] All 16 agents load with gemini-3-pro/flash model
- [x] No YAML parsing errors
- [x] Temperature values within valid range (0.0-2.0)

---

## 16. Security Considerations

- [x] Policy TOML 파일은 workspace scope (.gemini/policies/)에만 생성
- [x] 사용자 홈 디렉토리에 자동 생성하지 않음
- [x] version-detector.js의 execSync은 3초 타임아웃 적용
- [x] policy-migrator.js는 기존 정책 파일을 덮어쓰지 않음 (존재 시 skip)
- [x] 환경변수 주입 공격 방지: GEMINI_CLI_VERSION 값 검증

---

## 17. Coding Convention Reference

### 17.1 This Feature's Conventions

| Item | Convention Applied |
|------|-------------------|
| Module pattern | CommonJS (require/module.exports) |
| File naming | kebab-case (version-detector.js, policy-migrator.js) |
| Function naming | camelCase (detectVersion, parseVersion) |
| Constants | UPPER_SNAKE_CASE (FORWARD_ALIASES, BUILTIN_TOOLS) |
| Error handling | try-catch with silent fallback for non-critical |
| Version strings | Semantic versioning (major.minor.patch) |
| Agent model names | Official Gemini naming (gemini-3-pro, gemini-3-flash) |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-21 | Initial design with 14 FRs, 29 files, complete implementation spec | CTO Team |
