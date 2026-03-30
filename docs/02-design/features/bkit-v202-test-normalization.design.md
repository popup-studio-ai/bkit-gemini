# Design: bkit v2.0.2 Test Normalization & Feature Recovery

- **ID:** `feature/v202-test-normalization.design`
- **Objective:** Detail code changes to align tests with v2.0.2 architecture and CLI v0.34.0+.

## 1. Test Setup & Runner Normalization
- **File:** `tests/setup.js`
  - Update `ensureDirectories()` to include v2.0.0 PDCA paths:
    - `docs/01-plan/features/`
    - `docs/02-design/features/`
    - `docs/03-analysis/`
    - `docs/04-report/`
- **File:** `tests/run-all.js`
  - Replace hardcoded `v1.5.9` header with version from `bkit.config.json`.

## 2. Global Test Suite Sync
- **Files:** `tests/suites/*.js`
  - Batch replace `1.5.9` with `2.0.2`.
  - Batch replace `0.30.0`/`0.31.0` CLI version expectations with `0.34.0`.
  - Update `testedVersions` checks to include `0.34.0`.

## 3. Library Logic Adjustments
- **File:** `lib/pdca/phase.js`
  - Ensure path joining logic in `checkPhaseDeliverables` and `findPlanDoc` always respects the `projectDir` argument for test isolation.
- **File:** `lib/skill-orchestrator.js`
  - Enhance `getPluginRoot` to support an environment variable `BKIT_PLUGIN_ROOT` for deterministic testing.

## 4. Feature Flag Synchronization
- **File:** `lib/gemini/version.js`
  - Align `getFeatureFlags()` output with CLI v0.34.0 native flags.
  - Ensure count matches expectation in `tc79-v034-features.js`.

## 5. Verification Steps
1. Run `node tests/run-all.js`.
2. Monitor `PDCA status` and `Skill discovery` failures specifically.
3. Iterate until 100% pass.
