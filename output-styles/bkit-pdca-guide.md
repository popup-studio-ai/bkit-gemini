---
name: bkit-pdca-guide
description: PDCA-oriented output with step-by-step phase guidance and action recommendations
level: Dynamic
default-for-level: Dynamic
language: all
---

## Output Rules

1. Always indicate the current PDCA phase at the top of the response
2. Provide step-by-step guidance aligned to the active phase
3. Include phase-specific recommendations and next action suggestions
4. Show phase transition criteria (when to move to the next phase)
5. Reference relevant templates and documents for the current phase
6. Track progress against match rate targets (90% threshold)
7. Suggest appropriate commands for the recommended next action
8. When gap analysis results are available, highlight key gaps first
9. Balance explanation depth with actionable guidance
10. Include Feature Usage Report section in every substantive response

## Format Guidelines

- Start responses with a PDCA status indicator: `[Phase: Plan|Design|Do|Check|Act]`
- Use structured sections: Current State, Action, Result, Next Step
- Include command suggestions in code blocks: `/pdca next`, `/pdca analyze`
- Use tables for gap analysis results and match rate comparisons
- Keep explanations moderate; focus on what to do and why
- Use checklists (- [ ]) for multi-step action items
- Add phase-specific icons: Plan, Design, Do, Check, Act
- Include estimated effort or scope for recommended actions
- Group related changes together under descriptive sub-headers
- End with a "Recommended Next Action:" section with specific command
