# Plan: bkit Test Code Simplification

- **ID:** `feature/test-code-simplification`
- **Objective:** Refactor test utilities and suites to improve readability and reduce redundancy.
- **Deliverables:**
    - Unified `createTestProject` helper in `tests/test-utils.js`.
    - Enhanced `withVersion` abstraction.
    - New `getFixture` factory logic.
    - Standardized directory constants.

## 1. Key Improvements

### A. Helper Consolidation
- Merge `createTestProjectV2` into `createTestProject`.
- Make it support v2.0.2 PDCA directory structure by default.
- Auto-generate `.pdca-status.json` if not provided in fixtures.

### B. Version Mocking Refinement
- Ensure `withVersion` handles all cache resets internally.
- Simplify environmental cleanup to prevent state leakage between tests.

### C. Fixture Factory
- Replace `JSON.parse(JSON.stringify(...))` with a cleaner `getPdcaStatus(overrides)` factory function.

## 2. Implementation Steps
1. **Step 1: Refactor `tests/test-utils.js`** - The core utility update.
2. **Step 2: Batch Suite Update** - Use `generalist` to apply new helpers across 20+ test files.
3. **Step 3: Verification** - Run full test suite to ensure zero regressions.

## 3. Success Criteria
- 100% Test Pass Rate.
- Removal of `createTestProjectV2` from codebase.
- Reduction in test file line counts by ~10%.
