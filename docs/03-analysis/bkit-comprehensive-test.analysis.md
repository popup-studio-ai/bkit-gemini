# bkit-comprehensive-test Gap Analysis

> **Summary**: Analysis of test failures and missing components identified during the comprehensive functional test.
>
> **Project**: bkit-gemini
> **Version**: 2.0.2
> **Date**: 2026-04-06
> **Match Rate**: 75% (approximate)

---

## 1. Test Execution Summary

| Suite | Result | Issues |
|-------|--------|--------|
| TC-01: Hooks | 10/18 (55%) | Level auto-detection, Output style not detected |
| TC-09: PDCA E2E | 1/3 (33%) | Phase transition failures (Expected do, Actual design) |
| TC-16: v0.30.0 | 20/21 (95%) | Policy TOML generation failure |
| TC-45/48: Commands | Fail | 18+ TOML command files missing in `commands/` |
| TC-80: Architecture | 142/142 (100%)| No issues (Structural integrity OK) |

---

## 2. Identified Gaps

### 2.1 Missing Command Files (Critical)

Gemini CLI v0.34.0+ requires separate `.toml` files for each slash command. `bkit` lists 24 commands but only 5 exist.
- **Missing**: `pdca`, `starter`, `dynamic`, `enterprise`, `bkend-*`, `simplify`, `batch`, `loop`, `output-style-setup`, etc.

### 2.2 Phase Transition Issues (High)

`PDCA E2E` and `Hook System` tests failed because the phase status didn't transition correctly between Design and Do.
- **Likely Cause**: `lib/pdca/phase.js` or `hooks/scripts/session-start.js` logic for phase detection.

### 2.3 Auto-detection & Output Style (Medium)

Level detection and output style injection failed in `session-start` hook tests.
- **Likely Cause**: Change in expected output strings or detection patterns in `session-start.js`.

### 2.4 Policy Generation (Medium)

`bkit-permissions.toml` was not auto-generated in the test project.
- **Likely Cause**: Permission or path issue in `lib/gemini/policy.js`.

---

## 3. Root Cause Analysis

| Problem | Root Cause |
|---------|------------|
| Missing TOMLs | These files were likely omitted during the v2.0 refactoring or were intended to be generated but the generation script is missing/broken. |
| Phase Mismatch | Status management logic in `pdca-status.json` might be using old keys or the phase transition script `scripts/phase-transition.js` is not being triggered. |
| Detection Failures | Tests are asserting on specific strings in the `SessionStart` context, which might have changed in v2.0.2. |

---

## 4. Remediation Plan (Iteration 1)

1. [ ] Create missing TOML files in `commands/` based on `skills/*/SKILL.md`.
2. [ ] Fix phase transition logic in `lib/pdca/` if necessary.
3. [ ] Update `session-start.js` to ensure strings match test assertions (or update tests).
4. [ ] Verify `lib/gemini/policy.js` generation logic.

---

## 5. Next Steps

1. Run `/pdca iterate` to auto-fix missing commands.
2. Manually fix phase transition and detection logic.
3. Re-run tests to reach 100% coverage.
