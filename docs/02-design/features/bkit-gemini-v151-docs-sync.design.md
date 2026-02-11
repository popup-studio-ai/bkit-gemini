# bkit-gemini v1.5.1 Documentation Sync Design

> **Feature**: bkit-gemini-v151-docs-sync
> **Date**: 2026-02-11
> **Status**: Design Phase
> **Plan Reference**: `docs/01-plan/features/bkit-gemini-v151-docs-sync.plan.md`

---

## 1. Design Overview

This document specifies exact content changes for each file to synchronize all project documentation with bkit-gemini v1.5.1 implementation. Every specification is derived from verified source code (258 test cases, 100% pass rate) and Gemini CLI official documentation.

---

## 2. FR-01: README.md Complete Rewrite

### Target: `/README.md`

#### Section Structure

```
1. Header + Badges (v1.5.1)
2. What is bkit?
3. What is Context Engineering?
4. v1.5.1 Architecture
   4.1 Context Engineering Layers (3 layers)
   4.2 10-Event Hook System
   4.3 Extension Component Map
5. Features (complete v1.5.1 list)
6. Quick Start
   6.1 Prerequisites (Gemini CLI v0.26.0+)
   6.2 Installation (CLI + Manual)
   6.3 Verify Installation
   6.4 Hooks Configuration
7. Extension Structure (v1.5.1 tree)
8. Usage
   8.1 /bkit Command Reference
   8.2 PDCA Workflow
   8.3 Project Initialization
   8.4 Development Pipeline
   8.5 Quality Management
   8.6 Learning
9. User Experience
   9.1 Smart Onboarding
   9.2 8-Language Auto-Detection
   9.3 Agent Memory Persistence
   9.4 Output Styles
   9.5 Team Mode Foundation
10. Project Levels
11. Agents (16)
12. Skills (21)
13. TOML Commands (10)
14. Output Styles (4)
15. Tool Name Mapping
16. Language Support
17. Extension Update Guide
18. Compatibility
19. Documentation
20. Contributing
21. License + Support
```

#### Key Content Specifications

**Badges**:
```markdown
[![Version](https://img.shields.io/badge/Version-1.5.1-green.svg)](CHANGELOG.md)
```

**Context Engineering Layers Table**:
| Layer | Components | Count | Purpose |
|-------|-----------|-------|---------|
| Domain Knowledge | Skills | 21 | Structured expert knowledge activated on-demand |
| Behavioral Rules | Agents | 16 | Role-based constraints with model/tools/temperature |
| State Management | Hook Scripts + Lib Modules | 17 scripts + 6 modules | PDCA status, intent detection, permission control |

**10-Event Hook System**:
```
Event 1:  SessionStart         → Initialize session, detect project level, load output style
Event 2:  BeforeAgent          → Intent detection, 8-language trigger matching, ambiguity scoring
Event 3:  BeforeModel          → PDCA phase-specific prompt augmentation
Event 4:  AfterModel           → Response tracking, usage metrics
Event 5:  BeforeToolSelection  → Phase-based tool filtering (plan→readOnly, do→all)
Event 6:  BeforeTool           → Permission manager, dangerous command blocking
Event 7:  AfterTool            → PDCA phase auto-transition, progress tracking
Event 8:  AfterAgent           → Cleanup, phase completion detection
Event 9:  PreCompress          → Context fork snapshot preservation
Event 10: SessionEnd           → Session cleanup, memory persistence
```

**Extension Structure Tree (v1.5.1)**:
```
bkit-gemini/
├── gemini-extension.json         # Extension manifest (v1.5.1)
├── GEMINI.md                     # Global context with 6 @import modules
├── bkit.config.json              # Centralized configuration (12 sections)
├── CHANGELOG.md                  # Version history
├── .gemini/context/              # @import context modules (6 files)
│   ├── pdca-rules.md
│   ├── commands.md
│   ├── agent-triggers.md
│   ├── skill-triggers.md
│   ├── tool-reference.md
│   └── feature-report.md
├── agents/                       # 16 specialized AI agents
│   ├── cto-lead.md              # NEW in v1.5.1
│   ├── frontend-architect.md    # NEW in v1.5.1
│   ├── security-architect.md    # NEW in v1.5.1
│   ├── product-manager.md       # NEW in v1.5.1
│   ├── qa-strategist.md         # NEW in v1.5.1
│   └── ... (11 existing agents)
├── skills/                       # 21 domain skills
│   ├── pdca/SKILL.md
│   ├── starter/SKILL.md
│   └── ... (19 more skills)
├── commands/                     # 10 TOML commands
│   ├── bkit.toml                # /bkit help
│   ├── pdca.toml                # /pdca (8 actions)
│   ├── review.toml              # /review
│   ├── qa.toml                  # /qa
│   ├── starter.toml             # /starter
│   ├── dynamic.toml             # /dynamic
│   ├── enterprise.toml          # /enterprise
│   ├── pipeline.toml            # /pipeline
│   ├── learn.toml               # /learn
│   └── github-stats.toml        # /github-stats
├── hooks/
│   ├── hooks.json               # 10 hook event registrations
│   └── scripts/                 # 17 hook scripts
│       ├── session-start.js     # Dynamic context injection (392 lines)
│       ├── before-agent.js      # Intent detection (186 lines)
│       ├── before-model.js      # Prompt augmentation (131 lines)
│       ├── after-model.js       # Response tracking
│       ├── before-tool-selection.js  # Tool filtering (158 lines)
│       ├── before-tool.js       # Permission + PDCA (188 lines)
│       ├── after-tool.js        # Phase transition (142 lines)
│       ├── after-agent.js       # Cleanup
│       ├── pre-compress.js      # Context preservation
│       ├── session-end.js       # Session cleanup
│       ├── skills/              # 5 per-skill hooks
│       └── utils/               # 2 utility modules
├── output-styles/               # 4 output styles
│   ├── bkit-learning.md
│   ├── bkit-pdca-guide.md
│   ├── bkit-enterprise.md
│   └── bkit-pdca-enterprise.md
├── lib/
│   ├── skill-orchestrator.js    # 708 lines, 20+ exports
│   ├── context-hierarchy.js     # 209 lines, 4-level merge
│   ├── core/
│   │   ├── agent-memory.js      # 214 lines, per-agent persistence
│   │   └── permission.js        # 381 lines, glob pattern matching
│   └── adapters/gemini/
│       ├── context-fork.js      # 477 lines, snapshot isolation
│       └── import-resolver.js   # 118 lines, @import resolution
└── mcp/
    └── spawn-agent-server.js    # 753 lines, 6 MCP tools
```

**Agents Table (16)**:
| Agent | Category | Description |
|-------|----------|-------------|
| cto-lead | Leadership | CTO-level orchestration, PDCA workflow management |
| frontend-architect | Architecture | UI/UX design, component structure, Design System |
| security-architect | Architecture | Vulnerability analysis, OWASP compliance |
| product-manager | Management | Requirements analysis, feature prioritization |
| qa-strategist | Quality | Test strategy, quality metrics coordination |
| gap-detector | PDCA Check | Design-implementation gap analysis |
| pdca-iterator | PDCA Act | Evaluator-Optimizer pattern iteration |
| code-analyzer | Quality | Code quality, security, performance analysis |
| report-generator | PDCA Act | PDCA completion report generation |
| design-validator | PDCA Design | Design document completeness validation |
| qa-monitor | Quality | Docker log monitoring, Zero Script QA |
| starter-guide | Onboarding | Beginner-friendly guidance |
| pipeline-guide | Pipeline | 9-phase development pipeline guidance |
| bkend-expert | Backend | bkend.ai BaaS platform expertise |
| enterprise-expert | Architecture | Enterprise-grade system strategy |
| infra-architect | Infrastructure | AWS, Kubernetes, Terraform expertise |

**Skills Table (21)**:
| Skill | Category | Description |
|-------|----------|-------------|
| pdca | Core | Unified PDCA management (8 actions) |
| starter | Level | Static web development for beginners |
| dynamic | Level | Fullstack development with BaaS |
| enterprise | Level | Microservices with K8s/Terraform |
| development-pipeline | Pipeline | 9-phase pipeline knowledge |
| code-review | Quality | Code review and bug detection |
| zero-script-qa | Quality | Log-based testing methodology |
| mobile-app | Platform | React Native, Flutter, Expo |
| desktop-app | Platform | Electron, Tauri |
| bkit-templates | Utility | PDCA document templates |
| bkit-rules | Utility | Core rules and standards |
| gemini-cli-learning | Learning | Gemini CLI configuration mastery |
| phase-1-schema | Pipeline | Schema and terminology design |
| phase-2-convention | Pipeline | Coding rules and conventions |
| phase-3-mockup | Pipeline | UI/UX prototyping |
| phase-4-api | Pipeline | API design and implementation |
| phase-5-design-system | Pipeline | Component library development |
| phase-6-ui-integration | Pipeline | Frontend-backend integration |
| phase-7-seo-security | Pipeline | SEO and security hardening |
| phase-8-review | Pipeline | Codebase quality verification |
| phase-9-deployment | Pipeline | CI/CD and production deployment |

**Extension Update Guide Section**:
```markdown
## Updating bkit Extension

### Via CLI
gemini extensions install https://github.com/popup-studio-ai/bkit-gemini.git

### Manual Update
cd ~/.gemini/extensions/bkit && git pull origin main

### Verify Update
/extensions list
/bkit
```

---

## 3. FR-02: GEMINI.md Update

### Target: `/GEMINI.md`

**Changes**:
- Line 5: "21+ Skills" → "21 Skills" (exact count)
- Line 6: "16 Agents" (already correct)
- Line 12: Update hook count reference to "10-event hook system"
- Ensure all 6 @import references are present and correct

---

## 4. FR-03: gemini-extension.json Enhancement

### Target: `/gemini-extension.json`

**Add fields per official reference**:
```json
{
  "name": "bkit",
  "version": "1.5.1",
  "description": "bkit Vibecoding Kit - PDCA methodology + Context Engineering for AI-native development with Gemini CLI",
  "author": "POPUP STUDIO PTE. LTD.",
  "license": "Apache-2.0",
  "repository": "https://github.com/popup-studio-ai/bkit-gemini",
  "keywords": ["vibecoding", "pdca", "ai-native", "fullstack", "context-engineering", "agentic", "agents", "workflow"],
  "contextFileName": "GEMINI.md",
  "excludeTools": [],
  "settings": [
    {
      "name": "Output Style",
      "description": "Response formatting style (bkit-learning, bkit-pdca-guide, bkit-enterprise, bkit-pdca-enterprise)",
      "envVar": "BKIT_OUTPUT_STYLE"
    },
    {
      "name": "Project Level",
      "description": "Override auto-detected project level (Starter, Dynamic, Enterprise)",
      "envVar": "BKIT_PROJECT_LEVEL"
    }
  ],
  "experimental": {
    "skills": true
  }
}
```

---

## 5. FR-04: bkit.config.json Verification

### Target: `/bkit.config.json`

No structural changes needed. Verify all 12 sections are present:
1. version, platform
2. sourceDirectories, codeExtensions
3. pdca
4. taskClassification
5. levelDetection
6. templates
7. conventions
8. agents
9. output, permissions, context, automation, hooks
10. outputStyles
11. agentMemory
12. team, contextHierarchy, skillOrchestrator

---

## 6. FR-05: NOTICE Update

### Target: `/NOTICE`

**Changes**:
- Update compatibility line: "designed to work with Gemini CLI v0.26.0+ by Google"
- Add v1.5.1 version reference

---

## 7. FR-06: commands/bkit.toml Enhancement

### Target: `/commands/bkit.toml`

**Add v1.5.1 sections**:
```toml
description = "Show bkit plugin help and available functions"
prompt = """
Display the bkit help information:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 bkit v1.5.1 - AI Native Development Toolkit
 Gemini CLI Edition
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PDCA (Document-Driven Development)
  /pdca plan <feature>       Start planning
  /pdca design <feature>     Create design doc
  /pdca do <feature>         Implementation guide
  /pdca analyze <feature>    Gap analysis
  /pdca iterate <feature>    Auto-improvement
  /pdca report <feature>     Completion report
  /pdca status               Current status
  /pdca next                 Next step guide

Project Initialization
  /starter init <name>       Static web project
  /dynamic init <name>       Fullstack app (bkend.ai)
  /enterprise init <name>    Enterprise system

Development Pipeline
  /pipeline start            Start pipeline
  /pipeline next             Next phase
  /pipeline status           Current phase

Quality Management
  /review <path>             Code review
  /qa                        Zero Script QA

Output & Display
  /output-style              Change output style
  /output-style-setup        Install output styles

Learning
  /learn                     Gemini CLI learning
  /learn setup               Project optimization

Extension Info
  /extensions list            List extensions
  /bkit                      This help menu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
16 Agents | 21 Skills | 10 Hook Events
8 Languages | 4 Output Styles | 6 MCP Tools
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
```

---

## 8. FR-07: CHANGELOG.md Creation

### Target: `/CHANGELOG.md`

**Format**: Keep a Changelog (https://keepachangelog.com)

```markdown
# Changelog

All notable changes to bkit-gemini will be documented in this file.

## [1.5.1] - 2026-02-11
### Added
- 5 new agents: cto-lead, frontend-architect, security-architect, product-manager, qa-strategist (16 total)
- 3 new hook events: BeforeModel, AfterModel, BeforeToolSelection (10 total)
- 7 per-skill hook scripts + 2 utility modules (17 hook scripts total)
- 4 output styles: bkit-learning, bkit-pdca-guide, bkit-enterprise, bkit-pdca-enterprise
- Agent Memory system with project/user scope persistence (agent-memory.js, 214 lines)
- Context Hierarchy 4-level config merge (context-hierarchy.js, 209 lines)
- Skill Orchestrator with YAML parser and agent delegation (skill-orchestrator.js, 708 lines)
- @import GEMINI.md modularization with 6 context modules
- Team Mode foundation with 3 MCP tools (team_create, team_assign, team_status)
- Enhanced TOML commands with @{path}, !{command}, {{args}} syntax
- 10+ YAML frontmatter fields for all 21 skills
- Gemini native agent frontmatter (model, tools, temperature, max_turns, timeout_mins)
- 258 test cases across 10 categories (100% pass rate)

### Enhanced
- Permission Manager with glob pattern matching and PDCA phase restrictions
- Context Fork with LRU(10), named snapshots, and diff capabilities
- Import Resolver with variable substitution and circular dependency detection
- SessionStart dynamic context injection with returning user detection
- BeforeAgent 8-language intent detection with ambiguity scoring
- bkit.config.json extended with 5 new sections (outputStyles, agentMemory, team, contextHierarchy, skillOrchestrator)

## [1.5.0] - 2026-02-01
### Added
- Gemini CLI v0.28 compatibility verification (100% pass rate)
- Platform Adapter architecture for Gemini CLI native integration
- 11 agents with Gemini native frontmatter
- 21 skills with progressive disclosure
- 7-event hook system (SessionStart, BeforeAgent, BeforeTool, AfterTool, AfterAgent, PreCompress, SessionEnd)
- MCP server with spawn_agent, list_agents, get_agent_info tools
- PDCA skill with 8 actions (plan, design, do, analyze, iterate, report, status, next)
- 8 TOML commands with advanced syntax
- lib/core module system (permission.js, import-resolver.js, context-fork.js)

## [1.4.0] - 2026-01-15
### Added
- 8-language auto-detection (EN, KO, JA, ZH, ES, FR, DE, IT)
- Implicit agent/skill trigger keywords
- Ambiguity detection with clarifying question generation
- Automatic PDCA phase progression
- bkit Feature Usage Report system

## [1.3.0] - 2026-01-01
### Added
- Task Management integration with PDCA
- Task Chain Auto-Creation
- Evaluator-Optimizer pattern (pdca-iterator)

## [1.2.0] - 2025-12-15
### Added
- Core Modularization (lib/common.js split into lib/core/, lib/pdca/, lib/intent/, lib/task/)
- Context Engineering framework
- 7 library modules

## [1.1.0] - 2025-12-01
### Added
- 9-stage Development Pipeline
- 3 Project Levels (Starter, Dynamic, Enterprise)
- Multilingual keyword detection

## [1.0.0] - 2025-11-15
### Added
- Initial release as Gemini CLI extension
- Fork from bkit-claude-code adapted for Gemini CLI
- PDCA methodology implementation
- Basic hook system
- Tool name mapping (Claude Code → Gemini CLI)
```

---

## 9. FR-08: Architecture Documentation (in README.md)

Covered in FR-01 README.md sections 3 and 4.

---

## 10. Implementation Order

1. CHANGELOG.md (new file, no dependencies)
2. gemini-extension.json (small change)
3. NOTICE (small change)
4. commands/bkit.toml (small change)
5. GEMINI.md (small change)
6. bkit.config.json (verification only)
7. README.md (largest change, references all others)

---

## 11. Consistency Matrix

| Data Point | README | GEMINI.md | bkit.toml | CHANGELOG | Source Code |
|-----------|--------|-----------|-----------|-----------|-------------|
| Version | 1.5.1 | 1.5.1 | 1.5.1 | 1.5.1 | 1.5.1 |
| Agents | 16 | 16 | 16 | 16 | 16 files |
| Skills | 21 | 21 | 21 | 21 | 21 dirs |
| Hook Events | 10 | 10 | 10 | 10 | 10 in hooks.json |
| Commands | 10 | - | 10 listed | 10 | 10 TOML files |
| Output Styles | 4 | - | 4 | 4 | 4 files |
| Languages | 8 | 8 | 8 | 8 | 8 in config |
| MCP Tools | 6 | - | 6 | 6 | 6 in server |

---

*Generated by bkit PDCA Design Phase*
