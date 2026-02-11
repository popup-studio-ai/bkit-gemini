# bkit Vibecoding Kit v1.5.1 - Gemini CLI Edition

> AI-native development toolkit implementing PDCA methodology with Context Engineering

## Overview

bkit is a Gemini CLI extension that provides structured development workflows through:
- **PDCA Methodology**: Plan-Do-Check-Act cycle for systematic development
- **Context Engineering**: Systematic context curation for optimal LLM inference
- **3 Project Levels**: Starter (static), Dynamic (fullstack), Enterprise (microservices)
- **21 Skills**: Domain-specific knowledge activated on-demand via progressive disclosure
- **16 Agents**: Specialized AI assistants with role-based constraints (model, tools, temperature)
- **10-Event Hook System**: Full lifecycle interception from SessionStart to SessionEnd

## Core Rules (Always Apply)

1. **New feature request** -> Check/create Plan document first (`/pdca plan`)
2. **Plan complete** -> Create Design document (`/pdca design`)
3. **After implementation** -> Run Gap analysis (`/pdca analyze`)
4. **Gap Analysis < 90%** -> Auto-improvement iteration (`/pdca iterate`)
5. **Gap Analysis >= 90%** -> Generate completion report (`/pdca report`)
6. **Always** include bkit Feature Usage report at the end of every response
7. **Always** verify important decisions with the user - AI is not perfect

## Behavioral Guidelines

- Prefer editing existing files over creating new ones
- Follow existing code patterns and conventions
- Use Gemini CLI native tool names (write_file, replace, read_file, run_shell_command, etc.)
- Skills load on-demand to save context tokens (progressive disclosure)
- Supports EN, KO, JA, ZH, ES, FR, DE, IT (8 languages)
- Agent Memory persists context across sessions automatically

## Documentation Structure

```
docs/
├── 01-plan/features/     # Plan documents (PDCA Plan phase)
├── 02-design/features/   # Design documents (PDCA Design phase)
├── 03-analysis/          # Gap analysis reports (PDCA Check phase)
└── 04-report/            # Completion reports (PDCA Act phase)
```

## Important Notes

- **AI is not perfect**: Always verify critical decisions
- **Context Engineering**: bkit optimizes context for better AI inference
- **Hooks Integration**: bkit uses 10-event hook system for full lifecycle automation

---

@.gemini/context/commands.md
@.gemini/context/pdca-rules.md
@.gemini/context/agent-triggers.md
@.gemini/context/skill-triggers.md
@.gemini/context/tool-reference.md
@.gemini/context/feature-report.md

---

*bkit Vibecoding Kit v1.5.1 - Empowering AI-native development*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
