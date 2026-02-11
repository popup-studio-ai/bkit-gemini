# bkit-gemini v1.5.1 Documentation Sync Plan

> **Feature**: bkit-gemini-v151-docs-sync
> **Date**: 2026-02-11
> **Status**: Plan Phase
> **Scope**: Synchronize all project documentation to accurately reflect v1.5.1 architecture and capabilities

---

## 1. Background

bkit-gemini v1.5.1 has been fully implemented and tested (258 test cases, 100% pass rate). However, the public-facing documentation (README.md, GEMINI.md, NOTICE, etc.) still reflects v1.5.0 content with outdated counts and missing v1.5.1 features. This plan covers comprehensive documentation synchronization.

### Research Sources
- [Gemini CLI Extensions Reference](https://geminicli.com/docs/extensions/reference/)
- [Gemini CLI Hooks Documentation](https://geminicli.com/docs/hooks/)
- [Gemini CLI Release Notes](https://geminicli.com/docs/changelogs/)
- [Gemini CLI Agent Skills](https://geminicli.com/docs/cli/skills/)
- [Gemini CLI Sub-Agents](https://geminicli.com/docs/core/subagents/)
- [Gemini CLI Configuration](https://geminicli.com/docs/get-started/configuration/)
- [Gemini CLI Writing Extensions](https://geminicli.com/docs/extensions/writing-extensions/)
- [Gemini CLI Best Practices](https://geminicli.com/docs/extensions/best-practices/)
- [Google Developers Blog - Hooks](https://developers.googleblog.com/tailor-gemini-cli-to-your-workflow-with-hooks/)

---

## 2. Current State Analysis

### Files Requiring Updates

| File | Current State | Required Changes |
|------|--------------|------------------|
| **README.md** | v1.5.0 content, 11 agents, 7-event hooks, outdated architecture | Full rewrite for v1.5.1: 16 agents, 10-event hooks, context engineering architecture, user experience guide |
| **GEMINI.md** | v1.5.1 header but incomplete feature descriptions | Update to reflect full v1.5.1 capabilities with accurate counts |
| **gemini-extension.json** | Already v1.5.1 | Add `settings` field for user-configurable options per official docs |
| **bkit.config.json** | Already v1.5.1 with all sections | Verify accuracy, add any missing documentation references |
| **NOTICE** | Accurate copyright, references v0.26.0 | Update Gemini CLI compatibility range to v0.26.0+ |
| **commands/bkit.toml** | Missing v1.5.1 commands | Add output-style, agent memory, team mode commands |
| **CHANGELOG.md** | Does not exist | Create full changelog from v1.0.0 through v1.5.1 |

### v1.5.1 Feature Inventory (Verified by 258 Test Cases)

| Category | Count | Details |
|----------|-------|---------|
| Agents | 16 | 5 new: cto-lead, frontend-architect, security-architect, product-manager, qa-strategist |
| Skills | 21 | With 10+ YAML frontmatter fields each |
| Hook Events | 10 | 3 new: BeforeModel, AfterModel, BeforeToolSelection |
| Hook Scripts | 17 | Including 5 per-skill hooks + 2 utility modules |
| TOML Commands | 10 | 8 enhanced + bkit help + github-stats |
| Output Styles | 4 | bkit-learning, bkit-pdca-guide, bkit-enterprise, bkit-pdca-enterprise |
| Lib Modules | 3 new | skill-orchestrator (708 lines), agent-memory (214 lines), context-hierarchy (209 lines) |
| @import Modules | 6 | pdca-rules, commands, agent-triggers, skill-triggers, tool-reference, feature-report |
| MCP Tools | 6 | spawn_agent, list_agents, get_agent_info, team_create, team_assign, team_status |
| Languages | 8 | EN, KO, JA, ZH, ES, FR, DE, IT |

---

## 3. Functional Requirements

### FR-01: README.md Complete Rewrite
- Update version badge to v1.5.1
- Update feature counts: 16 agents, 21 skills, 10-event hooks
- Add v1.5.1 architecture diagram (text-based)
- Document Context Engineering architecture with 3 layers
- Document 10-event hook system (was 7)
- Add user experience section with screenshots references
- Add Extension Update guide section
- Document all TOML commands including /bkit help
- Document output styles system
- Document agent memory system
- Document team mode foundation
- Add Gemini CLI compatibility section (v0.26.0+)
- Update extension structure tree to reflect v1.5.1

### FR-02: GEMINI.md Update
- Update feature counts (16 agents, 21 skills, 10 hooks)
- Ensure @import references are complete and accurate
- Update behavioral guidelines to match v1.5.1 capabilities

### FR-03: gemini-extension.json Enhancement
- Add `settings` array for user-configurable options (per official docs)
- Add `description` field for geminicli.com/extensions display
- Keep existing fields intact

### FR-04: bkit.config.json Verification
- Verify all 5 new v1.5.1 sections are documented
- Ensure consistency with README descriptions

### FR-05: NOTICE Update
- Update Gemini CLI compatibility range
- Keep copyright and attribution intact

### FR-06: commands/bkit.toml Enhancement
- Add output style commands (/output-style)
- Add team mode commands (/team)
- Add agent memory info
- Update command descriptions to match v1.5.1

### FR-07: CHANGELOG.md Creation
- Create comprehensive changelog from v1.0.0 to v1.5.1
- Follow Keep a Changelog format
- Document all version milestones: v1.0.0, v1.1.0, v1.2.0, v1.3.0, v1.4.0, v1.5.0, v1.5.1

### FR-08: Architecture Documentation
- Document 5-layer execution architecture
- Document Platform Adapter pattern
- Document Hook-First Architecture pattern
- Document Progressive Enhancement strategy

---

## 4. Gemini CLI Official Documentation Alignment

### Extension Manifest (gemini-extension.json)
Per [official reference](https://geminicli.com/docs/extensions/reference/):
- `name`: Lowercase with dashes, matches directory name
- `version`: Semantic versioning
- `description`: Displayed on geminicli.com/extensions
- `mcpServers`: MCP server configurations with `${extensionPath}` variable
- `contextFileName`: Context file reference (default: GEMINI.md)
- `excludeTools`: Tool restriction array with command-specific patterns
- `settings`: User-configurable settings with name, description, envVar, sensitive flag
- `experimental`: Feature flags (skills: true)

### Agent Frontmatter Fields
Per [sub-agents docs](https://geminicli.com/docs/core/subagents/):
- `name` (required): Unique identifier
- `description` (required): Purpose summary for invocation decisions
- `kind`: "local" or "remote" (default: "local")
- `tools`: Restricted tool set array
- `model`: Model identifier (e.g., "gemini-2.5-pro")
- `temperature`: 0.0-2.0
- `max_turns`: Conversation limit (default: 15)
- `timeout_mins`: Execution duration (default: 5)

### Skill Frontmatter Fields
Per [creating skills docs](https://geminicli.com/docs/cli/creating-skills/):
- `name` (required): Unique identifier matching directory name
- `description` (required): Triggering mechanism description
- Note: Official docs state "Do not include any other fields in YAML frontmatter"

### Hook Events (10 Total)
Per [hooks docs](https://geminicli.com/docs/hooks/):
SessionStart, SessionEnd, BeforeAgent, AfterAgent, BeforeModel, AfterModel, BeforeToolSelection, BeforeTool, AfterTool, PreCompress (+ Notification)

### TOML Command Syntax
- `@{path}`: File content inclusion
- `!{command}`: Shell command execution
- `{{args}}`: User argument interpolation

---

## 5. Execution Strategy

### Phase 1: Plan (This Document)
- Research complete
- Requirements defined
- Scope confirmed

### Phase 2: Design
- Detailed per-file specifications
- Content outlines for each document
- Consistency matrix across files

### Phase 3: Do (Implementation)
- Update all 7 files
- Parallel execution where possible

### Phase 4: Check (Gap Analysis)
- Verify all FRs implemented
- Cross-reference accuracy with source code
- Validate against Gemini CLI official docs

### Phase 5: Act (Iteration)
- Fix any gaps found in Check phase
- Final consistency verification

---

## 6. Quality Criteria

- All version references must be v1.5.1
- All feature counts must match actual codebase (verified by 258 test cases)
- All Gemini CLI references must align with official documentation
- All documents must be in English
- Extension structure tree must be accurate and complete
- No speculative content - every claim must be verifiable against source code

---

*Generated by bkit PDCA Plan Phase*
