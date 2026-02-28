# bkit-v156-doc-sync Plan

> **Feature**: bkit-v156-doc-sync
> **Status**: APPROVED
> **Author**: Claude Opus 4.6
> **Date**: 2026-02-28
> **Branch**: feature/v1.5.6

---

## 1. Objective

Synchronize all documentation across the bkit-gemini codebase to accurately reflect v1.5.6 version changes and Gemini CLI v0.31.0 migration content. All documentation updates (except 8-language trigger keywords and `docs/` subdirectory PDCA documents) must be written in English.

---

## 2. Scope

### 2.1 Branch Change Summary (feature/v1.5.6 vs main)

5 commits, 30 files changed (+5,668 / -168 lines):

| Category | Files Changed | Key Changes |
|----------|--------------|-------------|
| Config | `bkit.config.json`, `gemini-extension.json`, `hooks/hooks.json` | Version bump 1.5.5 -> 1.5.6, v0.31.0 compatibility |
| Core Lib | `lib/adapters/gemini/index.js`, `version-detector.js`, `policy-migrator.js`, `tool-registry.js` | Version bump, 9 new v0.31.0 feature flags, Tool Annotations, Level Policy |
| New Module | `lib/adapters/gemini/hook-adapter.js` | RuntimeHook function detection (84 lines) |
| Hook Scripts | `hooks/scripts/session-start.js`, `hooks/scripts/before-tool.js` | v1.5.6 version, level policy generation, CLI feature detection |
| Policy | `.gemini/policies/bkit-permissions.toml` | New auto-generated TOML policy file |
| Tests | `tc18-v031-features.js`, `tc19-v031-policy-hooks.js`, `tc20-coverage-gaps.js` | 3 new test suites for v0.31.0 features |
| Test Runner | `tests/run-all.js` | Added 3 new test suites, v1.5.6 report path |
| Test Fix | `tests/suites/tc04-lib-modules.js` | Permission tests use isolated test projects |
| PDCA Docs | 6 new docs under `docs/01-plan/`, `docs/02-design/`, `docs/04-report/` | v1.5.6 & v0.31.0 migration documents |

### 2.2 Documents Requiring Update

**Priority 1 -- User-Facing (root-level)**:

| File | Current Version | Changes Needed |
|------|----------------|----------------|
| `README.md` | v1.5.5 (4+ references) | Version badge, highlights section, compatibility table, component map, team mode |
| `GEMINI.md` | v1.5.5 (2 references) | Title and footer version |
| `CHANGELOG.md` | Latest entry is v1.5.5 | Add complete v1.5.6 section |

**Priority 2 -- Internal Reference**:

| File | Current Version | Changes Needed |
|------|----------------|----------------|
| `docs/guides/model-selection.md` | v1.5.5 | Version header |
| `.gemini/context/tool-reference.md` | v1.5.4 alias section | Add Tool Annotations section |

### 2.3 Exclusions

| Category | Reason |
|----------|--------|
| `docs/` subdirectory PDCA documents (01-plan, 02-design, 03-analysis, 04-report, 05-test) | Historical archives, version-specific -- must not be altered |
| 8-language trigger keywords in `agent-triggers.md`, `skill-triggers.md` | Multilingual content preserved as-is |
| `.gemini/context/commands.md`, `pdca-rules.md`, `feature-report.md` | No version-specific content to update |
| `docs/.bkit-memory.json`, `docs/.pdca-status.json` | Session state files, not documentation |
| `lib/`, `hooks/`, `tests/`, config files | Already updated to v1.5.6 in prior commits |

---

## 3. Change Specification

### 3.1 README.md

| Location | Current | Target |
|----------|---------|--------|
| Line 4 | `Gemini%20CLI-v0.29.0+-blue` | `Gemini%20CLI-v0.29.0~v0.31.0-blue` |
| Line 5 | `Version-1.5.5-green` | `Version-1.5.6-green` |
| Line 65 | `Extension manifest (v1.5.5)` | `Extension manifest (v1.5.6)` |
| Line 167-174 | lib/ structure missing hook-adapter.js | Add `hook-adapter.js` entry |
| Line 169 | `tool-registry.js` comment | Add `Tool Annotations` note |
| Line 181-187 | v1.5.5 Highlights section | Add new v1.5.6 Highlights section above |
| Line 383 | `bkit v1.5.5 includes team mode` | `bkit v1.5.6 includes team mode` |
| Line 604 | Compatibility: `forward-compatible with v0.30.0` | `forward-compatible with v0.31.0` |

### 3.2 GEMINI.md

| Location | Current | Target |
|----------|---------|--------|
| Line 1 | `# bkit Vibecoding Kit v1.5.5` | `# bkit Vibecoding Kit v1.5.6` |
| Line 61 | `*bkit Vibecoding Kit v1.5.5` | `*bkit Vibecoding Kit v1.5.6` |

### 3.3 CHANGELOG.md

Add new `[1.5.6] - 2026-02-28` section at top (after header) covering:
- **Added**: hook-adapter.js, 9 new v0.31.0 feature flags, Tool Annotations, Level Policy templates, level-specific policy generation, Gemini CLI feature detection in session metadata, 3 new test suites (tc18, tc19, tc20), `.gemini/policies/bkit-permissions.toml`
- **Changed**: version-detector grouped by CLI version, session-start level policy generation, test runner includes v1.5.6 suites, tc04 permission tests use isolated test projects, bkit-v155 report simplified
- **Documentation**: v1.5.6 Plan/Design/Report documents, Gemini CLI v0.31.0 migration report, comprehensive upgrade analysis

Add version comparison links at bottom.

### 3.4 docs/guides/model-selection.md

| Location | Current | Target |
|----------|---------|--------|
| Line 3 | `Version: 1.5.5` | `Version: 1.5.6` |
| Line 4 | `Updated: 2026-02-25` | `Updated: 2026-02-28` |

### 3.5 .gemini/context/tool-reference.md

| Change | Description |
|--------|-------------|
| Line 25 | Update `## Tool Alias Reference (v1.5.4)` heading to `(v1.5.6)` |
| New section | Add `## Tool Annotations (v1.5.6)` section documenting readOnlyHint, destructiveHint, idempotentHint |

---

## 4. Language Rules

1. All documentation text must be in **English**
2. **Exception**: 8-language trigger keyword tables in `agent-triggers.md` and `skill-triggers.md` retain multilingual content
3. **Exception**: `docs/` subdirectory files (PDCA archives) are not modified
4. Technical terms, tool names, and code identifiers remain unchanged

---

## 5. Quality Criteria

| Criteria | Target |
|----------|--------|
| All v1.5.5 references in target files | Updated to v1.5.6 |
| All v0.30.0 compatibility claims | Updated to include v0.31.0 |
| CHANGELOG completeness | All branch changes documented |
| English consistency | No non-English text in updated sections (except keywords) |
| No historical doc modifications | docs/ subdirectory PDCA archives untouched |
| README component map accuracy | Reflects actual file structure |

---

## 6. Estimated Scope

| File | Estimated Changes |
|------|-------------------|
| README.md | ~30 lines modified/added |
| GEMINI.md | 2 lines modified |
| CHANGELOG.md | ~50 lines added |
| docs/guides/model-selection.md | 2 lines modified |
| .gemini/context/tool-reference.md | ~20 lines added |
| **Total** | ~5 files, ~105 lines |

---

*Generated by bkit PDCA Plan Phase*
