# bkit v1.5.9 Comprehensive Test Plan

> **Feature**: bkit-v159-comprehensive-test
> **Objective**: Verify all features and architectural components of bkit v1.5.9, ensuring full compatibility with Gemini CLI v0.34.0.
> **Status**: PLAN
> **Date**: 2026-03-18

## 1. Objective
To systematically verify the stability, compatibility, and functionality of bkit v1.5.9, specifically focusing on the new v0.34.0 feature flags, strictly validated TOML commands, and the integration of the 78 existing test suites.

## 2. Scope
The test plan covers the entire bkit extension architecture:
- **Core Architecture**: Context Engineering, PDCA Methodology, Project Levels (Starter/Dynamic/Enterprise).
- **Components**: 21 Agents, 35 Skills, 10 Hooks, 24 TOML Commands, 23 Tools.
- **Integration**: Gemini CLI v0.34.0 compatibility, MCP Server, Tool Registry.
- **New Features (v1.5.9)**:
    - 14 New Feature Flags (v0.34.0+)
    - 3 Feature Gates
    - Nightly Version Parsing
    - Strict TOML Validation (Zod schema compliance)
    - Session Metadata Enhancements

## 3. Test Strategy
We will utilize the existing automated test infrastructure (`tests/run-all.js`) extended for v1.5.9.

### 3.1 Test Layers
1.  **Unit Tests (TC-25 ~ TC-38)**: Verify individual modules (Lib, Adapters, Core).
2.  **E2E Tests (TC-39 ~ TC-43)**: Verify complete workflows (PDCA, Hooks, Team).
3.  **Integration Tests (TC-44 ~ TC-49)**: Verify component interactions.
4.  **Scenario Tests (TC-50 ~ TC-54)**: Verify user journeys (PM Workflow, Multilang).
5.  **Philosophy Tests (TC-55 ~ TC-59)**: Verify architectural principles.
6.  **Security Tests (TC-60 ~ TC-63)**: Verify sanitization and permissions.
7.  **Edge/Boundary/Recovery (TC-64 ~ TC-74)**: Verify robustness.
8.  **Infrastructure (TC-75 ~ TC-78)**: Verify templates and styles.
9.  **v1.5.9 Specific (TC-79)**: Verify v0.34.0 features and TOML fixes.

### 3.2 Key Verification Points
- **TOML Validation**: Ensure all 24 command files comply with Zod schema (no `[command]` header, no `name` field).
- **Feature Flags**: Verify `hasNativeSkillSystem`, `hasStrictTomlValidation`, etc., correct values for v0.34.0.
- **Version Parsing**: Verify nightly build hash parsing.
- **Regression**: Ensure all previous 78 test suites pass without regression.

## 4. Implementation Plan

### Step 1: Update Test Runner
- **File**: `tests/run-all.js`
- **Task**:
    - Update version header to v1.5.9.
    - Add `TC-79: v0.34.0 Features` to the test suite list.
    - Update report generation path to `docs/04-report/features/bkit-v159-comprehensive-test.report.md`.

### Step 2: Execution
- Run `node tests/run-all.js`.
- Analyze output for any failures.

### Step 3: Reporting
- The test runner will automatically generate the report.
- We will review the report and create a final PDCA Report document.

## 5. Verification Checklist
- [ ] `tests/run-all.js` updated.
- [ ] Test execution completed (79 suites).
- [ ] All TOML files verified.
- [ ] v0.34.0 Feature Flags verified.
- [ ] Report generated in `docs/04-report/`.

## 6. Rollback Plan
If critical failures occur:
- Revert `tests/run-all.js` changes.
- Investigate specific failure (TOML validation or Feature Flag detection).
- Fix the issue in the codebase and re-run.
