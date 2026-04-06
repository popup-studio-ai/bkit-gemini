# bkit-comprehensive-functional-test Design Document

> **Summary**: Detailed test design for comprehensive functional verification of bkit extensions.
>
> **Project**: bkit-gemini
> **Version**: 2.0.2
> **Author**: Gemini CLI
> **Date**: 2026-04-06
> **Status**: Draft

---

## 1. Executive Summary

| Value Delivered | Details |
|-----------------|---------|
| **Problem** | bkit features are complex and spread across many modules, making it hard to verify all functional logic in one go. |
| **Solution** | A structured, multi-layered test suite covering unit, integration, E2E, and scenario-based tests. |
| **Function UX Effect** | Confirms all commands and features (PDCA, bkend.ai, Automation) work reliably for the user. |
| **Core Value** | Ensures the technical integrity and stability of the bkit extension ecosystem. |

---

## 2. Test Architecture

### 2.1 Test Levels

1. **Unit Test**: Individual lib modules (`context-hierarchy.js`, `skill-orchestrator.js`).
2. **Integration Test**: Interactions between skills, agents, and hooks.
3. **E2E Test**: Full PDCA workflows and command execution in a temporary test project.
4. **Scenario Test**: Real-world user journeys (Starter, Dynamic, Enterprise project initialization).

### 2.2 Test Environment

- **OS**: Darwin (as per session context)
- **Runtime**: Node.js (for `run-all.js`)
- **CLI**: Gemini CLI with bkit extension loaded
- **Workspace**: `/tmp/bkit-test-project` (temporary)

---

## 3. Test Case Mapping (TC-01 to TC-112)

### 3.1 Core Regression (P0)

| TC ID | Feature | Description |
|-------|---------|-------------|
| TC-01 | Hooks | Verify session-start and before-model hooks |
| TC-02 | Skills | Verify skill activation and instruction loading |
| TC-04 | Lib | Verify core logic modules |
| TC-09 | PDCA E2E | Verify full Plan-Design-Do-Check-Act cycle |
| TC-24 | SDK | Verify RuntimeHook SDK functionality |

### 3.2 Feature-Specific (P1)

| TC ID | Feature | Description |
|-------|---------|-------------|
| TC-14 | bkend.ai | Verify all bkend-* skills |
| TC-13 | Automation | Verify `/batch`, `/loop`, `/simplify` |
| TC-06 | Commands | Verify all TOML-defined commands |
| TC-08 | Context | Verify phase-aware context engineering |

### 3.3 Advanced & Scenario (P1/P2)

| TC ID | Feature | Description |
|-------|---------|-------------|
| TC-50-52| Levels | Verify `/starter`, `/dynamic`, `/enterprise` |
| TC-53 | PM | Verify PM discovery workflow |
| TC-111 | Agents | Verify `enableAgents` configuration |
| TC-112 | Prefixes | Verify skill prefixing logic |

---

## 4. Test Data and Fixtures

- **Templates**: `templates/*.md`
- **Fixtures**: `tests/fixtures.js`
- **Hooks**: `hooks/hooks.json`

---

## 5. Execution Plan

1. **Setup**: Run `tests/setup.js` to prepare the environment.
2. **Execution**:
   - Run `node tests/run-all.js --category regression`
   - Run `node tests/run-all.js --category unit`
   - Run `node tests/run-all.js --category e2e`
   - Run `node tests/run-all.js --category integration`
   - Run `node tests/run-all.js --category scenario`
3. **Verification**: Check `test-results.txt` and generated JSON logs.

---

## 6. Coverage Analysis

Total Test Cases: 112
- Unit: 14
- Integration: 6
- E2E: 5
- Scenario: 5
- Regression: 82

---

## 7. Next Steps

1. [ ] Execute `node tests/run-all.js`
2. [ ] Analyze results for any failures
3. [ ] Perform `/pdca iterate` for any identified gaps
4. [ ] Finalize `/pdca report`

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-06 | Initial test design | Gemini CLI |
