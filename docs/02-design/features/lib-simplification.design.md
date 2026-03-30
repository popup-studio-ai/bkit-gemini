# Design: Core Library Simplification

- **ID:** `feature/lib-simplification.design`
- **Target:** `lib/core/`, `lib/pdca/`

## 1. Unified Path Resolution (`lib/core/paths.js`)
- Integrate all `getProjectDir` logic from `status.js`, `config.js`, and `platform.js`.
- Export a standardized `PATHS` object for:
    - `STATE_DIR`: `.bkit/state/`
    - `DOCS_DIR`: `docs/`
    - `STATUS_FILE`: `.pdca-status.json`

## 2. File Utility Consolidation (`lib/core/file.js`)
- Implement `readJson(path, defaultValue)`:
    - Wraps `fs.readFileSync` and `JSON.parse`.
    - Handles malformed JSON gracefully.
- Implement `writeJson(path, data)`:
    - Wraps `fs.mkdirSync` and `fs.writeFileSync`.
    - Ensures directory existence.

## 3. PDCA Status Refactoring (`lib/pdca/status.js`)
- Replace direct `fs` calls with `core/file.js` utilities.
- Simplify `loadPdcaStatus` by delegating migration checks to sub-functions.
- Reduce code duplication in `setActiveFeature` and `updatePdcaStatus`.

## 4. Circular Dependency Audit
- Ensure `core/` modules do not depend on `pdca/` or `intent/`.
- `paths.js` must be top-level (leaf node in dependency graph).
