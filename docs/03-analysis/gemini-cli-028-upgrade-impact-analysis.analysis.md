# Gemini CLI v0.28.2 Upgrade Impact Analysis

> **Analysis Type**: Gap Analysis (v0.28.2 Compatibility)
> **Project**: bkit-gemini
> **Version**: 1.5.1
> **Analyst**: bkit CTO Team (code-analyzer, enterprise-expert)
> **Date**: 2026-02-12
> **Design Doc**: [gemini-cli-028-upgrade-impact-analysis.design.md](../02-design/features/gemini-cli-028-upgrade-impact-analysis.design.md)

---

## 1. Analysis Overview

### 1.1 Scope
Analysis of `bkit-gemini` compatibility with Gemini CLI v0.28.2, focusing on hook permissions, skill orchestration, and tool sandboxing.

### 1.2 v0.28.2 Key Changes
1.  **Strict Hook Warnings**: Users are warned about hooks; dangerous hooks might be blocked.
2.  **Skill Activation**: Native `activate_skill` tool is optimized.
3.  **Tool Isolation**: Enhanced sandboxing for file system access.
4.  **UX Improvements**: Dynamic terminal titles, large text handling.

---

## 2. Findings & Verification

### A-01: Strict Hook Permissions
*   **Status**: ⚠️ **Warning**
*   **Observation**: `hooks/hooks.json` defines 10 event hooks, including `BeforeTool` and `AfterTool` for `write_file` and `run_shell_command`.
*   **Impact**: These hooks intercept core tool execution. v0.28.2 will likely display security warnings to the user upon installation/activation.
*   **Action**: Document these warnings clearly in `README.md` so users expect them. Ensure scripts are idempotent and fast (timeout 5000ms is safe).

### A-02: Hook Script Execution
*   **Status**: ✅ **Pass**
*   **Observation**: Checked `hooks/scripts/` for interactive code (`readline`, `prompt`).
*   **Result**: Matches found were variable names (e.g., `input.prompt`), not interactive calls. No `readline.createInterface` or synchronous `fs.readSync(0)` usage found that would block execution.
*   **Conclusion**: Scripts are non-interactive and safe for v0.28.2's event loop.

### A-03: Skill Activation Logic
*   **Status**: ℹ️ **Optimization Opportunity**
*   **Observation**: `lib/skill-orchestrator.js` manually handles some context loading and agent delegation.
*   **Impact**: v0.28.2's native `activate_skill` is more robust. `bkit` currently wraps this logic.
*   **Action**: No immediate breakage. Future refactoring should migrate custom YAML parsing to rely more on Gemini's native skill loading if possible, but `bkit`'s PDCA-specific metadata (agents, pdca-phase) still requires custom handling.
*   **Recommendation**: Keep current logic for now (it works on top of v0.28.2) but plan a refactor to reduce duplication.

### A-04: Tool Sandbox/Isolation
*   **Status**: ✅ **Pass**
*   **Observation**: `gemini-extension.json` has `"excludeTools": []`.
*   **Impact**: No tools are explicitly excluded. `bkit` relies on standard `write_file`, `read_file`, `run_shell_command`.
*   **Risk**: If v0.28.2 imposes stricter default sandboxing on `run_shell_command`, `bkit` operations (git, npm) might need explicit permission grants.
*   **Action**: Add a "Troubleshooting" section to docs if users report permission denied errors.

### A-05: Documentation Updates
*   **Status**: ❌ **Fail (Update Needed)**
*   **Observation**: `README.md` does not mention:
    *   Hook security warnings.
    *   `/agents refresh` command (useful for `bkit` development).
*   **Action**: Update `README.md` to include these v0.28.2 specifics.

---

## 3. Summary of Gaps

| ID | Feature | Gap | Severity | Action |
|----|---------|-----|----------|--------|
| G-01 | Hook Security | User warnings not documented | Medium | Update README |
| G-02 | Dev Workflow | Missing `/agents refresh` info | Low | Update README |
| G-03 | Skill Logic | Redundant orchestration logic | Low | Backlog (Refactor) |

## 4. Recommendations

1.  **Immediate**: Update `README.md` with a "Security & Permissions" section explaining why `bkit` needs hooks.
2.  **Immediate**: Add `/agents refresh` to the "Development Mode" section in `README.md`.
3.  **Future**: Monitor `activate_skill` performance. If native handling improves further, strip down `lib/skill-orchestrator.js`.

---

*Verified by bkit CTO Team*
