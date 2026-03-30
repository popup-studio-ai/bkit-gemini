# Plan: Core Library Simplification & Refactoring

- **ID:** `feature/lib-simplification`
- **Objective:** Optimize core engine logic in `lib/` for better performance and maintainability.
- **Deliverables:**
    - Unified path/directory resolution engine.
    - Consolidated file/JSON utility module.
    - Removal of redundant boilerplate code across status/phase modules.

## 1. Key Refactoring Targets

### A. Utility Consolidation
- Merge redundant `getProjectDir` implementations into a single source of truth.
- Move generic JSON safety wrappers to `lib/core/file.js`.

### B. PDCA Logic Streamlining
- Simplify `lib/pdca/status.js` by extracting file system concerns.
- Refactor `lib/pdca/phase.js` to use centralized path resolution.

### C. Performance & Safety
- Implement better caching for version/config lookups.
- Standardize error responses across all library functions.

## 2. Success Criteria
- 100% Test Pass Rate (node tests/run-all.js).
- Reduction in library code size by ~15%.
- Zero circular dependencies in `lib/` tree.
