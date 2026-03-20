# v2.0.0 Documentation Sync Plan

> **Feature**: v200-doc-sync
> **Version**: 2.0.0
> **Date**: 2026-03-20
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | README.md shows v1.5.8 badge and component tree references; v2.0.0 highlights section missing; sync-version.js does not cover README.md |
| **Solution** | Update README.md (4 version refs + add v2.0.0 highlights), update sync-version.js to cover README.md pattern |
| **Function/UX Effect** | Public-facing documentation accurately reflects v2.0.0; future version bumps auto-sync README |
| **Core Value** | **Documentation integrity** — users see correct version everywhere |

---

## 1. Scope

### 1.1 In Scope

| ID | Task | File | Priority |
|----|------|------|----------|
| DS-01 | Update version badge from 1.5.8 to 2.0.0 | README.md:5 | Critical |
| DS-02 | Update gemini-extension.json comment from v1.5.8 to v2.0.0 | README.md:65 | High |
| DS-03 | Update paths.js comment from v1.5.8 to v2.0.0 | README.md:183 | High |
| DS-04 | Update team/ comment from v1.5.8 to v2.0.0 | README.md:186 | High |
| DS-05 | Add v2.0.0 Highlights section before v1.5.8 highlights | README.md:~215 | High |
| DS-06 | Add README.md badge pattern to sync-version.js | scripts/sync-version.js | Medium |
| DS-07 | Verify all config files are v2.0.0 (bkit.config.json, gemini-extension.json, hooks.json) | Multiple | Verification |

### 1.2 Out of Scope

- Archive docs (historical, should not be updated)
- Test files (version references are for test fixture purposes)
- v1.5.x historical comments in CHANGELOG.md (correct as-is)

---

## 2. Implementation Order

1. DS-01~04: README.md version updates
2. DS-05: Add v2.0.0 Highlights section
3. DS-06: sync-version.js enhancement
4. DS-07: Final verification scan
