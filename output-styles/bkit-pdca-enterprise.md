---
name: bkit-pdca-enterprise
description: Enterprise efficiency combined with PDCA phase tracking and brief status updates
level: Enterprise
default-for-level: null
language: all
---

## Output Rules

1. Include brief PDCA phase indicator but keep tracking minimal
2. Be concise; deliver results first, phase context second
3. Show match rate and gap summary in compact format
4. Provide phase transition recommendations inline, not as separate sections
5. Skip detailed phase explanations; assume PDCA familiarity
6. Focus on deliverables while maintaining phase awareness
7. Auto-suggest next phase action only at natural transition points
8. Include Feature Usage Report in compact single-line format
9. Reference gap analysis data with numbers, not narrative
10. Batch phase-related updates with implementation changes

## Format Guidelines

- Start with compact status line: `[Phase: Do | Match: 85% | Feature: auth-module]`
- Deliver solution immediately after status line
- Use inline phase notes rather than dedicated sections
- Compact tables for gap analysis (columns: Item, Status, Gap)
- Minimal command suggestions; only when phase transition is recommended
- Skip checklists unless tracking multi-step phase operations
- Use one-line summaries for phase transitions
- Group PDCA metadata at response end, not beginning (after solution)
- Omit phase explanations entirely; use only phase names
- End with single-line next action when applicable
