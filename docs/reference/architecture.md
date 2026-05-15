# bkit Architecture Reference

> Moved from README.md §Architecture during v2.0.7-S4 onboarding-slim sprint.
> Back to: [README](../../README.md) | [QUICKSTART](../../QUICKSTART.md)

## Architecture

### Context Engineering Layers

| Layer | Components | Count | Purpose |
|-------|-----------|-------|---------|
| **Domain Knowledge** | Skills | 35 | Structured expert knowledge activated on-demand via progressive disclosure |
| **Behavioral Rules** | Agents | 21 | Role-based constraints with model, tools, temperature configuration |
| **State Management** | Hook Scripts + Lib Modules | 17 + 13 | PDCA status tracking, intent detection, permission control, memory persistence, team orchestration |

### 10-Event Hook System

bkit intercepts Gemini CLI's full lifecycle through 10 hook events, enabling comprehensive automation without modifying the CLI source:

```
Event 1:  SessionStart         -> Initialize session, detect project level, load output style
Event 2:  BeforeAgent          -> Intent detection, 8-language trigger matching, ambiguity scoring
Event 3:  BeforeModel          -> PDCA phase-specific prompt augmentation
Event 4:  AfterModel           -> Response tracking, usage metrics
Event 5:  BeforeToolSelection  -> Phase-based tool filtering (plan -> readOnly, do -> all)
Event 6:  BeforeTool           -> Permission manager, dangerous command blocking (exit code 2)
Event 7:  AfterTool            -> PDCA phase auto-transition (design -> do on source write)
Event 8:  AfterAgent           -> Cleanup, phase completion detection
Event 9:  PreCompress          -> Context fork snapshot preservation before compression
Event 10: SessionEnd           -> Session cleanup, memory persistence
```

### Extension Component Map

```
bkit-gemini/
|-- gemini-extension.json         # Extension manifest (v2.0.0)
|-- GEMINI.md                     # Global context with 7 @import modules
|-- bkit.config.json              # Centralized configuration (12 sections)
|-- CHANGELOG.md                  # Version history
|
|-- .gemini/context/              # @import context modules
|   |-- pdca-rules.md             # PDCA enforcement rules
|   |-- commands.md               # Command reference
|   |-- agent-triggers.md         # Agent activation triggers
|   |-- skill-triggers.md         # Skill activation triggers
|   |-- tool-reference-v2.md      # Tool name reference (Gemini CLI native)
|   |-- feature-report.md         # Feature usage report format
|   +-- executive-summary-rules.md # Executive summary output rules
|
|-- agents/                       # 21 specialized AI agents
|   |-- cto-lead.md               # CTO-level orchestration
|   |-- frontend-architect.md     # UI/UX architecture
|   |-- security-architect.md     # Security & vulnerability analysis
|   |-- product-manager.md        # Requirements & prioritization
|   |-- qa-strategist.md          # Test strategy coordination
|   |-- gap-detector.md           # Design-implementation gap analysis
|   |-- pdca-iterator.md          # Evaluator-Optimizer iteration
|   |-- code-analyzer.md          # Code quality analysis
|   |-- report-generator.md       # PDCA completion reports
|   |-- design-validator.md       # Design document validation
|   |-- qa-monitor.md             # Docker log monitoring
|   |-- starter-guide.md          # Beginner guidance
|   |-- pipeline-guide.md         # Pipeline guidance
|   |-- bkend-expert.md           # bkend.ai BaaS expertise
|   |-- enterprise-expert.md      # Enterprise architecture
|   |-- infra-architect.md        # AWS/K8s/Terraform
|   |-- pm-lead.md                # PM Team Lead orchestration
|   |-- pm-discovery.md           # Market/user opportunity discovery
|   |-- pm-strategy.md            # Value proposition & Lean Canvas
|   |-- pm-research.md            # Personas, competitors, market sizing
|   +-- pm-prd.md                 # PRD synthesis & GTM strategy
|
|-- skills/                       # 35 domain skills (progressive disclosure)
|   |-- pdca/SKILL.md             # Unified PDCA management (8 actions)
|   |-- starter/SKILL.md          # Static web development
|   |-- dynamic/SKILL.md          # Fullstack with BaaS
|   |-- enterprise/SKILL.md       # Microservices architecture
|   |-- development-pipeline/     # 9-phase pipeline
|   |-- code-review/              # Code review
|   |-- zero-script-qa/           # Log-based testing
|   |-- mobile-app/               # React Native, Flutter, Expo
|   |-- desktop-app/              # Electron, Tauri
|   |-- bkit-templates/           # PDCA document templates
|   |-- bkit-rules/               # Core rules
|   |-- gemini-cli-learning/      # Gemini CLI mastery
|   |-- phase-{1..9}-*/           # 9 pipeline phase skills
|   |-- plan-plus/                # Brainstorming-enhanced planning
|   |-- simplify/                 # Code quality review
|   |-- batch/                    # Parallel multi-feature PDCA
|   |-- loop/                     # Recurring interval execution
|   |-- output-style-setup/       # Output style installation
|   |-- pm-discovery/             # PM Agent Team workflow
|   |-- bkend-quickstart/         # bkend.ai platform onboarding
|   |-- bkend-auth/               # bkend.ai authentication
|   |-- bkend-data/               # bkend.ai database CRUD
|   |-- bkend-storage/            # bkend.ai file storage
|   |-- bkend-mcp/                # bkend.ai MCP tools & AI integration
|   |-- bkend-security/           # bkend.ai security policies
|   |-- bkend-cookbook/            # bkend.ai project tutorials
|   +-- bkend-guides/             # bkend.ai operational guides
|
|-- commands/                     # 24 TOML custom commands
|   |-- bkit.toml                 # /bkit help
|   |-- pdca.toml                 # /pdca (plan, design, do, analyze, iterate, report, status, next)
|   |-- review.toml               # /review
|   |-- qa.toml                   # /qa
|   |-- starter.toml              # /starter
|   |-- dynamic.toml              # /dynamic
|   |-- enterprise.toml           # /enterprise
|   |-- pipeline.toml             # /pipeline
|   |-- learn.toml                # /learn
|   |-- github-stats.toml         # /github-stats
|   |-- plan-plus.toml            # /plan-plus
|   |-- simplify.toml             # /simplify
|   |-- batch.toml                # /batch
|   |-- loop.toml                 # /loop
|   |-- output-style-setup.toml   # /output-style-setup
|   |-- pm-discovery.toml         # /pm-discovery
|   |-- bkend-quickstart.toml     # /bkend-quickstart
|   |-- bkend-auth.toml           # /bkend-auth
|   |-- bkend-data.toml           # /bkend-data
|   |-- bkend-storage.toml        # /bkend-storage
|   |-- bkend-mcp.toml            # /bkend-mcp
|   |-- bkend-security.toml       # /bkend-security
|   |-- bkend-cookbook.toml        # /bkend-cookbook
|   +-- bkend-guides.toml         # /bkend-guides
|
|-- hooks/
|   |-- hooks.json                # 10 hook event registrations
|   +-- scripts/                  # 17 hook scripts
|       |-- session-start.js      # Dynamic context injection (392 lines)
|       |-- before-agent.js       # Intent detection (186 lines)
|       |-- before-model.js       # Prompt augmentation (131 lines)
|       |-- after-model.js        # Response tracking
|       |-- before-tool-selection.js  # Tool filtering (158 lines)
|       |-- before-tool.js        # Permission + PDCA (188 lines)
|       |-- after-tool.js         # Phase transition (142 lines)
|       |-- after-agent.js        # Cleanup
|       |-- pre-compress.js       # Context preservation
|       |-- session-end.js        # Session cleanup
|       |-- skills/               # 5 per-skill post-processor hooks
|       +-- utils/                # 2 utility modules
|
|-- output-styles/                # 4 output styles
|   |-- bkit-learning.md          # Beginner-friendly explanations
|   |-- bkit-pdca-guide.md        # PDCA workflow guidance
|   |-- bkit-enterprise.md        # Enterprise-level technical
|   +-- bkit-pdca-enterprise.md   # Enterprise PDCA combined
|
|-- lib/
|   |-- skill-orchestrator.js     # Custom YAML parser, agent delegation, Skills 2.0 classification
|   |-- context-hierarchy.js      # 4-level config merge (209 lines)
|   |-- core/
|   |   |-- paths.js              # Centralized path registry (v2.0.0)
|   |   |-- agent-memory.js       # Per-agent persistence (214 lines)
|   |   +-- permission.js         # Glob pattern permission engine (381 lines)
|   |-- team/                     # Team orchestration (v2.0.0, 9 modules)
|   |   |-- coordinator.js        # Task coordination
|   |   |-- cto-logic.js          # CTO-level orchestration (5 patterns)
|   |   |-- communication.js      # MCP/memory protocols
|   |   |-- memory.js             # Team memory persistence
|   |   |-- pattern-selector.js   # Orchestration pattern selection
|   |   |-- state-recorder.js     # State snapshots
|   |   |-- strategy.js           # Strategy enum (dynamic/enterprise/custom)
|   |   +-- task-queue.js         # Task queueing
|   |-- intent/
|   |   +-- language-patterns.js  # 8-language intent detection patterns
|   +-- adapters/gemini/
|       |-- index.js              # Platform adapter with TOOL_MAP
|       |-- tool-registry.js      # Tool name registry + Annotations (v0.29.0~v0.33.x, 23 tools)
|       |-- version-detector.js   # 3-strategy CLI version detection + 34 feature flags
|       |-- policy-migrator.js    # Permission -> TOML Policy + Extension/Level Policy (v0.30.0+)
|       |-- hook-adapter.js       # RuntimeHook SDK integration (v0.31.0+)
|       |-- tracker-bridge.js     # Task Tracker - PDCA Bridge (v0.32.0+)
|       |-- context-fork.js       # Snapshot isolation, LRU(10) (477 lines)
|       +-- import-resolver.js    # @import resolution (118 lines)
|
+-- mcp/
    +-- spawn-agent-server.js     # 6 MCP tools (753 lines)
```

---

