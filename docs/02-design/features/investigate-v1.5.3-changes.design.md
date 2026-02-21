# PDCA Design: bkit v1.5.3 Investigation Report Structure

- **Feature ID:** FEAT-V1.5.3-INVESTIGATION
- **Design Version:** 1.0.0
- **Status:** Reviewing
- **Assignee:** CTO Lead (AI Agent)

## 1. Overview
The final report will be delivered as a CTO-level briefing, focusing on **Architectural Centralization**, **Tool Reliability**, and **Future Compatibility (v0.30.0)**.

## 2. Report Structure (The Output)
### 2.1 Executive Summary
- Version: v1.5.3 (2026-02-19)
- Theme: "Reliability & Centralization"
- Criticality: High (Fixes Agent Loading Failure)

### 2.2 Core Architectural Shift: Tool Registry
- Analysis of `lib/adapters/gemini/tool-registry.js`.
- How the system now handles the **17 Gemini CLI built-in tools**.
- Impact on `TOOL_MAP` and `before-tool-selection.js`.

### 2.3 Stability & Reliability Audit
- **Fix (Issue #5):** Global correction of `glob_tool` to `glob`.
- **Search Fix:** Migration from `web_search` to `google_web_search`.
- **Skill Activation Fix:** `"skill"` -> `"activate_skill"` mapping.
- **Agent Cleanup:** Removal of the non-existent `spawn_agent` tool.

### 2.4 Future Roadmap: v0.30.0 & Beyond
- Analysis of the **Policy Engine Detection** logic.
- Warning systems for future TOML-based policy migrations.
- Plan Mode enhancements (`enter_plan_mode`, `exit_plan_mode`).

### 2.5 CTO Conclusion & Next Steps
- Recommended actions for the user.
- Status of the 29 skills and 16 agents.

## 3. Investigation Checklist (Technical Audit)
### 3.1 Registry Implementation
- [ ] Check `lib/adapters/gemini/tool-registry.js` for completeness.
- [ ] Verify `readOnlyTools` vs `allTools` logic.

### 3.2 Agent/Skill Frontmatter Audit
- [ ] Sample 5 random agents for `allowed-tools` correctness.
- [ ] Sample 5 random skills for `allowed-tools` correctness.
- [ ] Check `cto-lead.md` specifically for `spawn_agent` removal.

### 3.3 Hook Logic Audit
- [ ] Review `hooks.json` matchers for `activate_skill`.
- [ ] Review `after-tool.js` for skill name logic.
- [ ] Review `before-tool-selection.js` for Tool Registry integration.

### 3.4 Compatibility Layer
- [ ] Check for Policy Engine detection logs in the codebase.
- [ ] Verify `minimum_gemini_version` updates in `README.md` and `bkit.config.json`.
