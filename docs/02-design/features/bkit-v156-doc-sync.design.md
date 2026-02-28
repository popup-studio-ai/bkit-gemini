# bkit-v156-doc-sync Design

> **Feature**: bkit-v156-doc-sync
> **Status**: APPROVED
> **Author**: Claude Opus 4.6
> **Date**: 2026-02-28
> **Plan Reference**: [bkit-v156-doc-sync.plan.md](../../01-plan/features/bkit-v156-doc-sync.plan.md)

---

## 1. Design Overview

This document specifies the exact changes to synchronize all non-archived documentation with bkit v1.5.6 and Gemini CLI v0.31.0 changes. Each section contains the precise old/new text for every modification.

---

## 2. README.md Changes

### 2.1 Version Badge Update (Line 4-5)

**Before:**
```markdown
[![Gemini CLI](https://img.shields.io/badge/Gemini%20CLI-v0.29.0+-blue.svg)](https://github.com/google-gemini/gemini-cli)
[![Version](https://img.shields.io/badge/Version-1.5.5-green.svg)](CHANGELOG.md)
```

**After:**
```markdown
[![Gemini CLI](https://img.shields.io/badge/Gemini%20CLI-v0.29.0~v0.31.0-blue.svg)](https://github.com/google-gemini/gemini-cli)
[![Version](https://img.shields.io/badge/Version-1.5.6-green.svg)](CHANGELOG.md)
```

### 2.2 Extension Manifest Comment (Line 65)

**Before:**
```
|-- gemini-extension.json         # Extension manifest (v1.5.5)
```

**After:**
```
|-- gemini-extension.json         # Extension manifest (v1.5.6)
```

### 2.3 lib/ Component Map Addition (Lines 167-174)

**Before:**
```
|   +-- adapters/gemini/
|       |-- index.js              # Platform adapter with TOOL_MAP
|       |-- tool-registry.js      # Centralized tool name registry (v0.29.0+ verified)
|       |-- context-fork.js       # Snapshot isolation, LRU(10) (477 lines)
|       +-- import-resolver.js    # @import resolution (118 lines)
```

**After:**
```
|   +-- adapters/gemini/
|       |-- index.js              # Platform adapter with TOOL_MAP
|       |-- tool-registry.js      # Tool name registry + Annotations (v0.29.0~v0.31.0)
|       |-- version-detector.js   # 3-strategy CLI version detection + 17 feature flags
|       |-- policy-migrator.js    # Permission -> TOML Policy + Level Policy (v0.30.0+)
|       |-- hook-adapter.js       # RuntimeHook function detection (v0.31.0 prep)
|       |-- context-fork.js       # Snapshot isolation, LRU(10) (477 lines)
|       +-- import-resolver.js    # @import resolution (118 lines)
```

### 2.4 New v1.5.6 Highlights Section (Insert above v1.5.5 Highlights at Line 181)

**Insert Before v1.5.5 Highlights:**
```markdown
### v1.5.6 Highlights

- **Gemini CLI v0.31.0 Compatibility** -- 9 new feature flags including RuntimeHook functions, Browser Agent, Tool Annotations, and Project-Level Policy
- **Tool Annotations** -- readOnlyHint, destructiveHint, idempotentHint metadata for all 17 built-in tools enabling trust model and parallel execution optimization
- **Level-Specific Policy Engine** -- Auto-generated Tier 3 TOML policies per project level (Starter: restrictive, Dynamic: balanced, Enterprise: permissive)
- **Hook Adapter Module** -- RuntimeHook function detection and SDK migration preparation for v1.6.0
- **Enhanced Version Detector** -- 17 feature flags organized by CLI version (v0.26.0+, v0.29.0+, v0.30.0+, v0.31.0+)

```

### 2.5 Team Mode Version Reference (Line 383)

**Before:**
```markdown
bkit v1.5.5 includes team mode foundation with 3 MCP tools:
```

**After:**
```markdown
bkit v1.5.6 includes team mode foundation with 3 MCP tools:
```

### 2.6 Compatibility Table Update (Line 604)

**Before:**
```markdown
| Gemini CLI | v0.29.0+ (forward-compatible with v0.30.0 Policy Engine) |
```

**After:**
```markdown
| Gemini CLI | v0.29.0+ (forward-compatible with v0.31.0 Policy Engine + Tool Annotations) |
```

---

## 3. GEMINI.md Changes

### 3.1 Title (Line 1)

**Before:**
```markdown
# bkit Vibecoding Kit v1.5.5 - Gemini CLI Edition
```

**After:**
```markdown
# bkit Vibecoding Kit v1.5.6 - Gemini CLI Edition
```

### 3.2 Footer (Line 61)

**Before:**
```markdown
*bkit Vibecoding Kit v1.5.5 - Empowering AI-native development*
```

**After:**
```markdown
*bkit Vibecoding Kit v1.5.6 - Empowering AI-native development*
```

---

## 4. CHANGELOG.md Changes

### 4.1 New Version Entry (Insert at Line 8, before `## [1.5.5]`)

```markdown
## [1.5.6] - 2026-02-28

### Added

- **Hook Adapter Module**: `lib/adapters/gemini/hook-adapter.js` - RuntimeHook function detection, SDK event name mapping (PascalCase -> snake_case), execution mode info for v1.6.0 migration preparation (84 lines)
- **Tool Annotations**: `TOOL_ANNOTATIONS` in tool-registry.js - readOnlyHint, destructiveHint, idempotentHint metadata for all 17 built-in tools (v0.31.0+ trust model)
- **Tool Annotation Queries**: `getToolAnnotations()`, `isReadOnlyTool()`, `getStrictReadOnlyTools()` for annotation-based tool classification
- **9 New Feature Flags (v0.31.0+)**: `hasRuntimeHookFunctions`, `hasBrowserAgent`, `hasProjectLevelPolicy`, `hasMcpProgress`, `hasParallelReadCalls`, `hasPlanModeCustomStorage`, `hasToolAnnotations`, `hasExtensionFolderTrust`, `hasAllowMultipleReplace`
- **Level Policy Templates**: `LEVEL_POLICY_TEMPLATES` in policy-migrator.js - Starter (restrictive), Dynamic (balanced), Enterprise (permissive) policy presets for Tier 3 project-level policies
- **Level Policy Generator**: `generateLevelPolicy()` creates project-level TOML policies per detected project level (v0.31.0+ only)
- **Gemini CLI Feature Detection**: `getGeminiCliFeatures()` in session-start.js - reports CLI version, preview status, and flag counts in session metadata
- **3 New Test Suites**: tc18-v031-features.js (Tool Annotations, feature flags), tc19-v031-policy-hooks.js (level policy, hook adapter), tc20-coverage-gaps.js (lib/pdca, lib/intent coverage)
- **Policy File**: `.gemini/policies/bkit-permissions.toml` - auto-generated base policy for Gemini CLI v0.30.0+

### Changed

- **Version Detector Grouping**: Feature flags in `getFeatureFlags()` organized by CLI version milestone (v0.26.0+, v0.29.0+, v0.30.0+, v0.31.0+) for clarity
- **Session Start**: Level-specific policy generation via `generateLevelPolicy()` when `hasProjectLevelPolicy` flag is true
- **Session Metadata**: Added `geminiCliFeatures` object to session start metadata output
- **Test Runner**: Added TC-18, TC-19, TC-20 to P0/P1 test suites, report path updated to v1.5.6
- **TC-04 Permission Tests**: LIB-26 and LIB-27 now use `createTestProject()`/`cleanupTestProject()` for isolated testing
- **Tested Versions**: Added `0.31.0` to `bkit.config.json` testedVersions array
- **Level Policy Config**: Added `levelPolicies` section to `bkit.config.json` compatibility.policyEngine

### Documentation

- **Plan**: bkit-v156-gemini-test plan and gemini-cli-031-migration plan
- **Design**: bkit-v156-gemini-test design and gemini-cli-031-migration design
- **Report**: bkit-v156-gemini-test report and gemini-cli-031-migration report
- **Analysis**: gemini-cli-031-feature-enhancement-proposals analysis
- **Upgrade Analysis**: gemini-cli-031-upgrade-comprehensive-analysis report (CTO Team 9-agent)

```

### 4.2 Version Links (Append before existing links at bottom)

**Before (line 220):**
```markdown
[1.5.4]: https://github.com/popup-studio-ai/bkit-gemini/compare/v1.5.3...v1.5.4
```

**After:**
```markdown
[1.5.6]: https://github.com/popup-studio-ai/bkit-gemini/compare/v1.5.5...v1.5.6
[1.5.5]: https://github.com/popup-studio-ai/bkit-gemini/compare/v1.5.4...v1.5.5
[1.5.4]: https://github.com/popup-studio-ai/bkit-gemini/compare/v1.5.3...v1.5.4
```

---

## 5. docs/guides/model-selection.md Changes

### 5.1 Version Header (Lines 3-4)

**Before:**
```markdown
> **Version**: 1.5.5
> **Updated**: 2026-02-25
```

**After:**
```markdown
> **Version**: 1.5.6
> **Updated**: 2026-02-28
```

---

## 6. .gemini/context/tool-reference.md Changes

### 6.1 Alias Section Header Update (Line 25)

**Before:**
```markdown
## Tool Alias Reference (v1.5.4)
```

**After:**
```markdown
## Tool Alias Reference (v1.5.6)
```

### 6.2 New Tool Annotations Section (Append at end of file)

```markdown

## Tool Annotations (v1.5.6)

Tool annotations provide hints for Gemini CLI's v0.31.0+ trust model and parallel execution:

| Tool | readOnlyHint | destructiveHint | idempotentHint |
|------|:---:|:---:|:---:|
| `read_file` | true | false | true |
| `read_many_files` | true | false | true |
| `grep_search` | true | false | true |
| `glob` | true | false | true |
| `list_directory` | true | false | true |
| `google_web_search` | true | false | true |
| `web_fetch` | true | false | true |
| `ask_user` | true | false | false |
| `get_internal_docs` | true | false | true |
| `activate_skill` | false | false | false |
| `save_memory` | false | false | true |
| `write_todos` | false | false | false |
| `write_file` | false | false | true |
| `replace` | false | false | false |
| `run_shell_command` | false | true | false |
| `enter_plan_mode` | false | false | true |
| `exit_plan_mode` | false | false | true |

- **readOnlyHint**: Tool does not modify state
- **destructiveHint**: Tool may cause irreversible side effects
- **idempotentHint**: Multiple identical calls produce same result

bkit-gemini uses these annotations via `getToolAnnotations()` and `isReadOnlyTool()` in `tool-registry.js`.
```

---

## 7. Files NOT Modified (Exclusion List)

### 7.1 Historical PDCA Documents (docs/ subdirectory)

These files are version-specific archives and must not be modified:

| Directory | Files | Reason |
|-----------|-------|--------|
| `docs/01-plan/features/` | bkit-v155-*, bkit-v154-*, gemini-cli-030-* | Historical plan archives |
| `docs/02-design/features/` | bkit-v154-*, gemini-cli-030-* | Historical design archives |
| `docs/03-analysis/` | All files | Historical analysis archives |
| `docs/04-report/features/` | bkit-v155-*, bkit-v154-*, gemini-cli-030-* | Historical report archives |
| `docs/05-test/` | All files | Historical test strategy archives |

### 7.2 8-Language Trigger Files

| File | Reason |
|------|--------|
| `.gemini/context/agent-triggers.md` | Multilingual keyword tables -- no version-specific content |
| `.gemini/context/skill-triggers.md` | Multilingual keyword tables -- no version-specific content |

### 7.3 Other Excluded Files

| File | Reason |
|------|--------|
| `.gemini/context/commands.md` | No version references |
| `.gemini/context/pdca-rules.md` | No version references |
| `.gemini/context/feature-report.md` | No version references |
| All `lib/`, `hooks/`, `tests/`, config files | Already updated in prior commits |

---

## 8. Implementation Order

| Step | File | Estimated Lines |
|------|------|----------------|
| 1 | README.md | ~30 lines modified/added |
| 2 | GEMINI.md | 2 lines modified |
| 3 | CHANGELOG.md | ~50 lines added |
| 4 | docs/guides/model-selection.md | 2 lines modified |
| 5 | .gemini/context/tool-reference.md | ~25 lines added |
| **Total** | **5 files** | **~110 lines** |

---

## 9. Verification Criteria

| Check | Method |
|-------|--------|
| No remaining v1.5.5 references in target files | `grep -r "v1.5.5\|1\.5\.5" README.md GEMINI.md CHANGELOG.md docs/guides/model-selection.md .gemini/context/tool-reference.md` returns only CHANGELOG historical entry |
| CHANGELOG v1.5.6 entry present | Manual verification |
| README component map matches actual lib/ structure | Compare with `ls lib/adapters/gemini/` |
| Tool Annotations table matches `TOOL_ANNOTATIONS` in tool-registry.js | Cross-reference code |
| All text in English | Visual inspection (except 8-language keywords in excluded files) |
| No docs/ subdirectory files modified | `git diff --stat` verification |

---

*Generated by bkit PDCA Design Phase*
