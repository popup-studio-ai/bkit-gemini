# Changelog

All notable changes to bkit-gemini will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.2] - 2026-02-14

### Added

- **8 New bkend.ai Domain Skills** (29 total): bkend-quickstart, bkend-auth, bkend-data, bkend-storage, bkend-mcp, bkend-security, bkend-cookbook, bkend-guides
- **8 New TOML Commands** (18 total): `/bkend-quickstart`, `/bkend-auth`, `/bkend-data`, `/bkend-storage`, `/bkend-mcp`, `/bkend-security`, `/bkend-cookbook`, `/bkend-guides`
- **AGENT-14 Test**: bkend-expert content validation (bkendFetch, MongoDB Atlas, 28 MCP tools, 30-day refresh token)
- **SKILL-21/22/23 Tests**: bkend-quickstart frontmatter, 8-skill consistency, domain content validation
- **CMD-04 Test**: All 8 bkend-* commands reference their skill files and bkend-expert agent

### Enhanced

- **bkend-expert Agent**: Complete rewrite (146 -> 296 lines) with bkendFetch wrapper, 28 MCP tool catalog, REST API patterns, 15 troubleshooting entries, 8 skill references
- **dynamic/SKILL.md**: Fixed PostgreSQL -> MongoDB Atlas, GraphQL -> REST API, @bkend/sdk -> bkendFetch pattern, added bkend-* skills reference table
- **skill-triggers.md**: Added 8 bkend-* skill triggers with 8-language keywords
- **agent-triggers.md**: Updated bkend-expert trigger with expanded keywords
- **commands.md**: Added bkend.ai Commands section with 8 domain commands
- **README.md**: Updated all counts (21->29 skills, 10->18 commands), added bkend.ai entries throughout
- **Test Suite**: Updated ALL_SKILLS (21->29), ALL_COMMANDS (10->18), verify-components requiredSkills (+8)

### Fixed

- **dynamic/SKILL.md**: Corrected "Managed PostgreSQL" to "MongoDB Atlas (REST API)" (bkend uses MongoDB, not PostgreSQL)
- **dynamic/SKILL.md**: Removed non-existent `@bkend/sdk` import, replaced with bkendFetch REST API pattern
- **dynamic/SKILL.md**: Fixed "Auto-generated REST & GraphQL" to "REST API" (bkend does not support GraphQL)
- **bkend-expert Agent**: Fixed refresh token lifetime from unspecified to correct 30 days (not 7 days)

## [1.5.1] - 2026-02-11

### Added

- **5 New Agents** (16 total): cto-lead, frontend-architect, security-architect, product-manager, qa-strategist
- **3 New Hook Events** (10 total): BeforeModel, AfterModel, BeforeToolSelection
- **7 Per-Skill Hook Scripts** + 2 utility modules in `hooks/scripts/skills/` and `hooks/scripts/utils/`
- **4 Output Styles**: bkit-learning, bkit-pdca-guide, bkit-enterprise, bkit-pdca-enterprise
- **Agent Memory System**: Per-agent persistent storage with project/user scope (`lib/core/agent-memory.js`, 214 lines)
- **Context Hierarchy**: 4-level config merge - Plugin, User, Project, Session (`lib/context-hierarchy.js`, 209 lines)
- **Skill Orchestrator**: Custom YAML parser, agent delegation, template loading (`lib/skill-orchestrator.js`, 708 lines)
- **@import Modularization**: GEMINI.md split into 6 context modules in `.gemini/context/`
- **Team Mode Foundation**: 3 new MCP tools - team_create, team_assign, team_status
- **Enhanced TOML Commands**: `@{path}` file inclusion, `!{command}` shell execution, `{{args}}` interpolation
- **Skill Metadata Extension**: 10+ YAML frontmatter fields for all 21 skills
- **Agent Native Frontmatter**: model, tools, temperature, max_turns, timeout_mins for all 16 agents
- **Comprehensive Test Suite**: 258 test cases across 10 categories, 63 automated core cases (100% pass rate)

### Enhanced

- **Permission Manager**: Glob pattern matching with PDCA phase restrictions in `before-tool.js`
- **Context Fork**: LRU cache (limit 10), named snapshots, and diff capabilities in `context-fork.js`
- **Import Resolver**: Variable substitution (`${variable}`), circular dependency detection, 5s cache
- **SessionStart Hook**: Dynamic context injection with returning user detection, project level auto-detection (392 lines)
- **BeforeAgent Hook**: 8-language intent detection with ambiguity scoring (186 lines)
- **bkit.config.json**: 5 new configuration sections (outputStyles, agentMemory, team, contextHierarchy, skillOrchestrator)
- **MCP Server**: Extended from 3 to 6 tools (753 lines)

## [1.5.0] - 2026-02-01

### Added

- Gemini CLI v0.28 compatibility verification (100% pass rate on all compatibility tests)
- Platform Adapter architecture for clean Gemini CLI native integration
- 11 specialized agents with Gemini native frontmatter
- 21 domain skills with progressive disclosure
- 7-event hook system: SessionStart, BeforeAgent, BeforeTool, AfterTool, AfterAgent, PreCompress, SessionEnd
- MCP server with 3 tools: spawn_agent, list_agents, get_agent_info
- Unified PDCA skill with 8 actions: plan, design, do, analyze, iterate, report, status, next
- 8 TOML custom commands with advanced syntax support
- Library core modules: permission.js, import-resolver.js, context-fork.js
- bkit.config.json centralized configuration (7 sections)

## [1.4.0] - 2026-01-15

### Added

- 8-language auto-detection: English, Korean, Japanese, Chinese, Spanish, French, German, Italian
- Implicit agent and skill trigger keywords for natural language activation
- Ambiguity detection with automatic clarifying question generation
- Automatic PDCA phase progression based on user actions
- bkit Feature Usage Report system appended to every response

## [1.3.0] - 2026-01-01

### Added

- Task Management integration with PDCA workflow
- Task Chain Auto-Creation for multi-step features
- Evaluator-Optimizer pattern via pdca-iterator agent (from Anthropic's agent architecture)
- Task ID persistence across sessions

## [1.2.0] - 2025-12-15

### Added

- Core Modularization: `lib/common.js` split into `lib/core/`, `lib/pdca/`, `lib/intent/`, `lib/task/`
- Context Engineering framework with 7 library modules
- Unified hook system architecture

## [1.1.0] - 2025-12-01

### Added

- 9-stage Development Pipeline (Schema through Deployment)
- 3 Project Levels: Starter (static), Dynamic (fullstack), Enterprise (microservices)
- Multilingual keyword detection foundation

## [1.0.0] - 2025-11-15

### Added

- Initial release as Gemini CLI extension
- Fork from bkit-claude-code adapted for Gemini CLI compatibility
- PDCA (Plan-Do-Check-Act) methodology implementation
- Basic hook system for lifecycle event interception
- Tool name mapping: Claude Code tools to Gemini CLI equivalents
- GEMINI.md context file (converted from CLAUDE.md)
- Apache 2.0 license

---

[1.5.1]: https://github.com/popup-studio-ai/bkit-gemini/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/popup-studio-ai/bkit-gemini/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/popup-studio-ai/bkit-gemini/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/popup-studio-ai/bkit-gemini/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/popup-studio-ai/bkit-gemini/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/popup-studio-ai/bkit-gemini/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/popup-studio-ai/bkit-gemini/releases/tag/v1.0.0
