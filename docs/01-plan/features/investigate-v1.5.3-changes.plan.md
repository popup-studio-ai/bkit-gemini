# PDCA Plan: bkit v1.5.3 Deep Investigation

- **Feature ID:** FEAT-V1.5.3-INVESTIGATION
- **Status:** Planning
- **Priority:** High
- **Assignee:** CTO Team (AI Agent)

## 1. Background
bkit has been upgraded to v1.5.3 on 2026-02-19. This version includes critical fixes for agent loading, tool registry centralization, and compatibility with Gemini CLI v0.29.0+. A deep investigation is required to ensure all components are properly aligned and to report the architectural shifts to the user.

## 2. Objectives
- Investigate the centralized Tool Registry implementation.
- Verify the fixes for the critical Agent Loading Failure (Issue #5).
- Analyze the impact of Gemini CLI v0.30.0 Policy Engine detection.
- Document the transition to `google_web_search` and other tool name corrections.
- Ensure all 29 skills and 16 agents are functional under the new version.

## 3. Investigation Scope (CTO Team Roles)
### 3.1 Architecture Review (CTO Lead)
- [ ] Audit `lib/adapters/gemini/tool-registry.js`.
- [ ] Review `lib/core/config.js` and registry integration.
- [ ] Analyze Policy Engine detection logic.

### 3.2 Tooling & Interface (Frontend Architect)
- [ ] Verify `TOOL_MAP` integration with the Registry.
- [ ] Check `enter_plan_mode` and `exit_plan_mode` mapping.
- [ ] Review documentation updates (README.md, tool-reference.md).

### 3.3 Security & Stability (Security Architect)
- [ ] Verify removal of `spawn_agent` and invalid tools.
- [ ] Audit `before-tool-selection.js` for `readOnlyTools` registry sync.

### 3.4 Verification (QA Strategist)
- [ ] Verify `glob_tool` -> `glob` replacement in all agents/skills.
- [ ] Verify `web_search` -> `google_web_search` replacement.
- [ ] Check `hooks.json` and `after-tool.js` for skill matcher fixes.

## 4. Schedule
1. **Plan (P):** 2026-02-19 (Current)
2. **Design (D):** Define report structure and investigation check-list.
3. **Do (D):** Execute file reads and logic verification.
4. **Check (C):** Analyze gaps or missed updates.
5. **Act (A):** Finalize CTO Report.

## 5. Success Criteria
- [ ] 100% of tool name errors fixed in frontmatter.
- [ ] Tool Registry acting as the single source of truth.
- [ ] Clear report highlighting v1.5.3 improvements and breaking changes.
