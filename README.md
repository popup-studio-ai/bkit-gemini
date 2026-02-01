# bkit - Vibecoding Kit (Gemini CLI Edition)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Gemini CLI](https://img.shields.io/badge/Gemini%20CLI-Compatible-blue.svg)](https://github.com/google-gemini/gemini-cli)
[![Version](https://img.shields.io/badge/Version-1.5.0-green.svg)](CHANGELOG.md)
[![Author](https://img.shields.io/badge/Author-POPUP%20STUDIO-orange.svg)](https://popupstudio.ai)

> **PDCA methodology + AI coding assistant mastery for AI-native development**

bkit is a Gemini CLI extension that transforms how you build software with AI. It provides structured development workflows, automatic documentation, and intelligent code assistance through the PDCA (Plan-Do-Check-Act) methodology.

---

## What is Context Engineering?

**Context Engineering** is the systematic curation of context tokens for optimal LLM inference—going beyond simple prompt crafting to build entire systems that consistently guide AI behavior.

```
Traditional Prompt Engineering:
  "The art of writing good prompts"

Context Engineering:
  "The art of designing systems that integrate prompts, tools, and state
   to provide LLMs with optimal context for inference"
```

**bkit is a practical implementation of Context Engineering**, providing a systematic context management system for Gemini CLI.

### bkit's Context Engineering Architecture

bkit implements Context Engineering through three interconnected layers:

| Layer | Components | Purpose |
|-------|------------|---------|
| **Domain Knowledge** | 21 Skills | Structured expert knowledge (phases, levels, specialized domains) |
| **Behavioral Rules** | 11 Agents | Role-based constraints with model selection |
| **State Management** | 86+ Functions | PDCA status, intent detection, ambiguity scoring, multi-feature context |

### 7-Event Hook System

Context injection occurs at seven distinct events:

```
Event 1: SessionStart    → Initialize session context
Event 2: BeforeAgent     → Intent detection, user prompt processing
Event 3: BeforeTool      → Pre-validation before tool execution
Event 4: AfterTool       → Post-tracking after tool execution
Event 5: AfterAgent      → Phase transitions, completion handling
Event 6: PreCompress     → Context preservation before compression
Event 7: SessionEnd      → Cleanup and session termination
```

---

## Features

- **Task Management + PDCA Integration** - Task Chain Auto-Creation, Task ID Persistence, Check↔Act Iteration
- **Core Modularization** - lib/common.js split into 4 modules (lib/core/, lib/pdca/, lib/intent/, lib/task/)
- **Context Engineering** - Systematic context curation with 7 library modules and unified hook system
- **PDCA Methodology** - Structured development workflow with automatic documentation
- **PDCA Skill Integration** - Unified `/pdca` skill with 8 actions (plan, design, do, analyze, iterate, report, status, next)
- **Evaluator-Optimizer Pattern** - Automatic iteration cycles from Anthropic's agent architecture
- **9-Stage Development Pipeline** - From schema design to deployment
- **3 Project Levels** - Starter (static), Dynamic (fullstack), Enterprise (microservices)
- **Multilingual Support** - 8 languages (EN, KO, JA, ZH, ES, FR, DE, IT)
- **21 Skills** - Domain-specific knowledge for various development scenarios
- **11 Agents** - Specialized AI assistants for different tasks
- **Platform Adapter Architecture** - Clean separation for Gemini CLI compatibility

---

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/popup-studio-ai/bkit-gemini.git

# Navigate to your project
cd your-project

# Copy the extension to your Gemini CLI extensions folder
cp -r bkit-gemini ~/.gemini/extensions/bkit
```

### Extension Structure

```
bkit-gemini/
├── gemini-extension.json    # Gemini CLI extension manifest
├── GEMINI.md                # Global context file
├── agents/                  # Specialized AI agents
├── skills/                  # Domain knowledge
├── hooks/                   # Event hooks (hooks.json)
├── scripts/                 # Hook execution scripts
├── lib/                     # Shared utilities (4 modules)
├── templates/               # Document templates
└── bkit.config.json         # Centralized configuration
```

---

## Usage

### Initialize a Project
```bash
/starter      # Static website (Starter level)
/dynamic      # Fullstack with BaaS (Dynamic level)
/enterprise   # Microservices with K8s (Enterprise level)
```

### PDCA Workflow
```bash
/pdca plan {feature}     # Create plan document
/pdca design {feature}   # Create design document
/pdca do {feature}       # Implementation guide
/pdca analyze {feature}  # Run gap analysis
/pdca iterate {feature}  # Auto-fix with Evaluator-Optimizer pattern
/pdca report {feature}   # Generate completion report
/pdca status             # Check current PDCA status
/pdca next               # Guide to next PDCA step
```

---

## Project Levels

| Level | Description | Stack |
|-------|-------------|-------|
| **Starter** | Static websites, portfolios | HTML, CSS, JS |
| **Dynamic** | Fullstack applications | Next.js, BaaS |
| **Enterprise** | Microservices architecture | K8s, Terraform, MSA |

---

## Tool Name Mapping

bkit-gemini uses Gemini CLI tool names:

| Claude Code Tool | Gemini CLI Tool |
|------------------|-----------------|
| Write | write_file |
| Edit | replace |
| Read | read_file |
| Bash | run_shell_command |
| Glob | glob |
| Grep | grep |
| WebSearch | web_search |
| WebFetch | web_fetch |
| Task | spawn_agent |
| TodoWrite | task_write |
| TodoRead | task_read |

---

## Language Support

bkit automatically detects your language from trigger keywords:

| Language | Trigger Keywords |
|----------|-----------------|
| English | static website, beginner, API design |
| Korean | 정적 웹, 초보자, API 설계 |
| Japanese | 静的サイト, 初心者, API設計 |
| Chinese | 静态网站, 初学者, API设计 |
| Spanish | sitio web estático, principiante |
| French | site web statique, débutant |
| German | statische Webseite, Anfänger |
| Italian | sito web statico, principiante |

---

## Documentation

### Component Reference

- [Development Pipeline](skills/development-pipeline/SKILL.md) - 9-stage pipeline skill
- [Skills Reference](skills/) - 21 domain skills
- [Agents Reference](agents/) - 11 specialized agents

### PDCA Documents

- [Active PDCA](docs/pdca/) - Current plan/design/analysis documents
- [Archive](docs/archive/) - Completed PDCA + legacy documents

---

## Relationship to bkit-claude-code

bkit-gemini is a fork of [bkit-claude-code](https://github.com/popup-studio-ai/bkit-claude-code), adapted for Gemini CLI compatibility. Key changes:

- Tool names converted to Gemini CLI equivalents
- Variable names adapted (${extensionPath}, ${workspacePath})
- Hook events mapped to Gemini CLI event system
- Context file renamed from CLAUDE.md to GEMINI.md
- Platform adapter architecture for clean separation

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Branch Protection

- Only `admin` team members can merge to `main`
- All changes require pull request review
- Version releases are managed through Git tags

---

## License

Copyright 2024-2026 POPUP STUDIO PTE. LTD.

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.

You must include the [NOTICE](NOTICE) file in any redistribution.

---

## Support

- **Issues**: [GitHub Issues](https://github.com/popup-studio-ai/bkit-gemini/issues)
- **Email**: contact@popupstudio.ai

---

Made with AI by [POPUP STUDIO](https://popupstudio.ai)
