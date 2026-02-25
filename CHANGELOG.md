# Changelog

All notable changes to bkit-gemini will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.5] - 2026-02-25

### Added

- **Policy TOML Auto-Generation**: `session-start.js` now triggers `policy-migrator.js` when Gemini CLI >= v0.30.0 detected, creating `.gemini/policies/bkit-permissions.toml` automatically
- **SemVer Validation**: `version-detector.js` validates `GEMINI_CLI_VERSION` env var format and rejects implausible values (>= 2.0.0) to prevent feature flag injection
- **TOML Structural Validation**: `policy-migrator.js` validates generated TOML before writing (rule count vs decision count match)
- **TOML String Escaping**: `escapeTomlString()` prevents TOML injection via backslash, quote, and newline characters
- **Version-Aware Approval Flag**: `spawn-agent-server.js` uses `--approval-mode=yolo` for v0.30.0+ and `--yolo` for older versions
- **Team Name Sanitization**: Path traversal prevention in `team_create` - only alphanumeric, hyphens, underscores allowed
- **Enhanced Dangerous Patterns**: `before-tool.js` blocks reverse shells, policy file tampering, remote code execution via pipes, sensitive file access
- **Feature Flags**: `hasGemini31Pro` (v0.29.7+), `hasApprovalMode` (v0.30.0+)

### Changed

- **Agent Model Upgrades**: `cto-lead` and `gap-detector` upgraded to `gemini-3.1-pro` (ARC-AGI-2 77.1%)
- **Agent Cost Optimization**: `report-generator` and `qa-monitor` switched to `gemini-3-flash-lite` (60% cost reduction)
- **AfterTool Resilience**: Defensive field access supports both `tool_name`/`toolName` and `tool_input`/`toolInput` variants
- **Tested Versions**: Added `0.29.7` and `0.30.0` to `bkit.config.json` testedVersions
- **Policy Migrator Version Guard**: `generatePolicyFile()` checks `hasPolicyEngine` flag before generation

### Documentation

- **model-selection.md**: Added Gemini 3.1 Pro + customtools variant documentation, updated all model recommendations
- **PDCA Analysis**: `gemini-cli-030-upgrade-impact-analysis.analysis.md` - comprehensive v0.30.0 impact analysis (82/100 score)

### Security

- **CRITICAL**: Fixed unconditional `--yolo` flag in sub-agent spawning (bypassed all safety prompts)
- **HIGH**: Fixed `team_name` path traversal vulnerability in `team_create` handler
- **HIGH**: Added SemVer format validation to block env var injection (`GEMINI_CLI_VERSION=99.99.99`)
- **MEDIUM**: Added TOML string escaping to prevent policy injection

## [1.5.4] - 2026-02-21

### Added

- **Version Detector Module**: `lib/adapters/gemini/version-detector.js` - Gemini CLI version detection with 3-strategy fallback (env var, npm, CLI), feature flags, caching
- **Policy Migrator Module**: `lib/adapters/gemini/policy-migrator.js` - Converts bkit.config.json permissions to Gemini CLI v0.30.0 Policy Engine TOML format
- **Forward Alias Layer**: `FORWARD_ALIASES` in tool-registry.js for future tool name changes (`replace`->`edit_file`, `glob`->`find_files`, etc.)
- **Compatibility Config**: `bkit.config.json` new `compatibility` section with version tracking and Policy Engine settings

### Changed

- **16 Agents Model Update**: `gemini-2.5-pro` -> `gemini-3-pro` (9 agents), `gemini-2.5-flash` -> `gemini-3-flash` (7 agents)
- **16 Agents Temperature Optimization**: Adjusted for Gemini 3 recommended ranges (minimum +0.1 from previous values to prevent looping)
- **gemini-extension.json**: Removed deprecated `excludeTools` field (v0.30.0 Policy Engine migration)
- **GeminiAdapter Version**: `1.0.0` -> `1.5.4` with `getCliVersion()` and `getFeatureFlags()` methods
- **Permission Manager**: Added Policy Engine fallback - defers to native TOML policies when `.gemini/policies/*.toml` detected
- **Minimum Gemini CLI Version**: v0.29.0 (unchanged, forward-compatible with v0.30.0)

### Documentation

- **tool-reference.md**: Added Forward Aliases table for future tool naming compatibility
- **README.md**: Updated version badges and compatibility section for v1.5.4

## [1.5.3] - 2026-02-19

### Added

- **Tool Registry Module**: `lib/adapters/gemini/tool-registry.js` - Centralized Source of Truth for all 17 Gemini CLI built-in tool names, verified from source code
- **v0.30.0 Policy Engine Detection**: Compatibility layer that detects Policy Engine TOML files and logs warnings for future migration
- **Plan Mode Tool Mapping**: `enter_plan_mode`, `exit_plan_mode` added to TOOL_MAP (v0.29.0+ new tools)
- **New TOOL_MAP Entries**: `SaveMemory` -> `save_memory`, `TodoWrite` -> `write_todos`

### Fixed

- **CRITICAL: All 16 Agents Loading Failure** (Issue #5): `glob_tool` was never a valid Gemini CLI tool name - corrected to `glob` across all 16 agent frontmatter files
- **7 Agents Web Search Failure**: `web_search` corrected to `google_web_search` (cto-lead, enterprise-expert, frontend-architect, gap-detector, product-manager, security-architect, starter-guide)
- **29 Skills Tool Name Errors**: `glob_tool` -> `glob` in all skill `allowed-tools` frontmatter
- **11 Skills Web Search Errors**: `web_search` -> `google_web_search` in affected skill frontmatter
- **TOOL_MAP Corrections**: `Grep: 'grep'` -> `'grep_search'`, `WebSearch: 'web_search'` -> `'google_web_search'`, `Skill: 'skill'` -> `'activate_skill'`
- **Hook Scripts**: `before-tool-selection.js` readOnlyTools array updated to use Tool Registry (removed invalid `glob_tool`, `web_search`, `task_write`, `spawn_agent`)
- **hooks.json Matcher**: `"skill"` -> `"activate_skill"` for AfterTool skill matcher
- **after-tool.js**: `toolName === 'skill'` -> `toolName === 'activate_skill'`
- **cto-lead Agent**: Removed non-existent `spawn_agent` from tools (not a built-in tool)
- **pdca Skill**: Removed non-existent `spawn_agent` from allowed-tools

### Changed

- **Minimum Gemini CLI Version**: v0.28.0 -> **v0.29.0** (tool name changes require v0.29.0+)
- **gemini-extension.json**: Removed `experimental.skills` block (Skills/Hooks GA since v0.26.0)
- **TOOL_MAP Architecture**: Now imports from Tool Registry instead of hardcoded values
- **before-tool-selection.js**: Uses `getReadOnlyTools()` from Tool Registry instead of hardcoded array
- **hooks.json**: Version description updated to v1.5.3
- **README.md**: Updated version badges, tool mapping table, compatibility requirements, component map

### Documentation

- **tool-reference.md**: Complete rewrite with all 17 built-in tools (v0.29.0+ verified)
- **README.md**: Added v1.5.3 highlights section, updated all version references
- **Philosophy Docs**: Updated bkit-system/philosophy for v1.5.3 Tool Registry and Context Engineering principles

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

[1.5.4]: https://github.com/popup-studio-ai/bkit-gemini/compare/v1.5.3...v1.5.4
[1.5.3]: https://github.com/popup-studio-ai/bkit-gemini/compare/v1.5.2...v1.5.3
[1.5.2]: https://github.com/popup-studio-ai/bkit-gemini/compare/v1.5.1...v1.5.2
[1.5.1]: https://github.com/popup-studio-ai/bkit-gemini/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/popup-studio-ai/bkit-gemini/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/popup-studio-ai/bkit-gemini/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/popup-studio-ai/bkit-gemini/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/popup-studio-ai/bkit-gemini/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/popup-studio-ai/bkit-gemini/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/popup-studio-ai/bkit-gemini/releases/tag/v1.0.0
