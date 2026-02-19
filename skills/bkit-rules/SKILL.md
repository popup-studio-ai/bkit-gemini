---
name: bkit-rules
description: |
  Core rules for bkit plugin.
  PDCA methodology, level detection, agent auto-triggering, and code quality standards.

  Use proactively when user requests feature development or code changes.

  Triggers: bkit, PDCA, develop, implement, feature, bug, code, design, document,
  개발, 기능, 버그, 코드, 설계, 문서,
  開発, 機能, バグ,
  开发, 功能, 代码,
  desarrollar, función, código,
  développer, fonctionnalité, code,
  entwickeln, Funktion, Code,
  sviluppare, funzionalità, codice

  Do NOT use for: general conversation, non-development tasks

# ──── NEW FIELDS (v1.5.1) ────
user-invocable: false
argument-hint: ""

allowed-tools:
  - read_file
  - glob
  - grep_search

imports: []

agents: {}

context: project
memory: project
pdca-phase: all
---

# bkit Core Rules

> Rules that govern bkit behavior and PDCA methodology

## Rule 1: PDCA First

For any feature request:
1. Check if Plan document exists
2. Check if Design document exists
3. If missing, suggest creating them first
4. Track phase in `.pdca-status.json`

## Rule 2: Level Detection

Automatically detect project level:

| Indicator | Level |
|-----------|-------|
| kubernetes/, terraform/ | Enterprise |
| api/, backend/, .mcp.json | Dynamic |
| Default | Starter |

## Rule 3: Task Classification

| Lines Changed | Classification | PDCA Level |
|--------------|----------------|------------|
| < 30 | Trivial | None |
| 30-100 | Quick Fix | None |
| 100-500 | Minor Change | Light |
| 500-1000 | Feature | Standard |
| > 1000 | Major Feature | Full |

## Rule 4: Agent Auto-Trigger

| User Intent | Agent |
|-------------|-------|
| Verify, check | gap-detector |
| Improve, iterate | pdca-iterator |
| Analyze, quality | code-analyzer |
| Report, summary | report-generator |
| Help, guide | starter-guide |

## Rule 5: Check-Act Loop

When gap analysis < 90%:
1. Auto-trigger pdca-iterator
2. Apply fixes
3. Re-run gap analysis
4. Repeat until >= 90% or max 5 iterations

## Rule 6: Feature Usage Report

Include at end of every response:

```
─────────────────────────────────────────────────
📊 bkit Feature Usage
─────────────────────────────────────────────────
✅ Used: [features used]
⏭️ Not Used: [features not used] (reason)
💡 Recommended: [next recommended feature]
─────────────────────────────────────────────────
```

## Rule 7: Multi-Language Support

Support 8 languages for triggers:
- English (en)
- Korean (ko)
- Japanese (ja)
- Chinese (zh)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)

## Rule 8: Quality Standards

- Never skip PDCA for features > 500 LOC
- Always suggest gap analysis after implementation
- Encourage design-first development
- Track all phase transitions in history
