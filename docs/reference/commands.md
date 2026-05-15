# bkit Commands & Catalog Reference

> Usage / 21 Agents / 35 Skills / 24 TOML Commands. Moved from README.md during
> v2.0.7-S4 onboarding-slim sprint.
> Back to: [README](../../README.md) | [QUICKSTART](../../QUICKSTART.md)

## Usage

### /bkit Command Reference

Run `/bkit` at any time to see all available commands and capabilities.

### PDCA Workflow

```bash
/pdca plan <feature>     # Create plan document
/pdca design <feature>   # Create design document
/pdca do <feature>       # Implementation guide
/pdca analyze <feature>  # Run gap analysis (delegates to gap-detector agent)
/pdca iterate <feature>  # Auto-improvement (delegates to pdca-iterator agent)
/pdca report <feature>   # Generate completion report (delegates to report-generator)
/pdca status             # Check current PDCA status
/pdca next               # Guide to next PDCA step
```

### Project Initialization

```bash
/starter init <name>     # Static website (Starter level)
/dynamic init <name>     # Fullstack with BaaS (Dynamic level)
/enterprise init <name>  # Microservices with K8s (Enterprise level)
```

### Development Pipeline

```bash
/pipeline start          # Start 9-phase pipeline
/pipeline next           # Advance to next phase
/pipeline status         # Show current phase
```

### Quality Management

```bash
/review <path>           # Code review with code-analyzer agent
/qa                      # Zero Script QA via Docker log monitoring
```

### Enhanced Planning

```bash
/plan-plus <feature>     # Brainstorming-enhanced PDCA planning
/pm-discovery <feature>  # PM Agent Team product discovery and PRD
```

### Automation

```bash
/simplify                # Code quality review and simplification
/batch <features>        # Process multiple features in parallel
/loop <interval> <cmd>   # Run command on recurring interval (e.g., /loop 5m /pdca status)
```

### Output Styles

```bash
/output-style            # Change response formatting style
/output-style-setup      # Install output style files
```

### Learning

```bash
/learn                   # Gemini CLI configuration learning
/learn setup             # Analyze and optimize current project setup
```

---

## User Experience

### Smart Onboarding

When you start a session, bkit automatically:
1. **Detects project level** -- scans for `kubernetes/` (Enterprise), `docker-compose.yml` (Dynamic), or defaults to Starter
2. **Loads appropriate output style** -- Starter gets beginner-friendly, Enterprise gets technical
3. **Detects returning users** -- shows feature history and recent PDCA progress
4. **Generates dynamic context** -- injects PDCA rules, agent triggers, and feature reports

### 8-Language Auto-Detection

bkit recognizes natural language triggers in 8 languages and automatically activates the appropriate agent or skill:

| Language | Example Triggers |
|----------|-----------------|
| English | "verify implementation", "analyze code", "create report" |
| Korean | "검증해줘", "분석해줘", "보고서 작성" |
| Japanese | "確認して", "分析して", "レポート作成" |
| Chinese | "验证", "分析代码", "生成报告" |
| Spanish | "verificar", "analizar", "crear informe" |
| French | "verifier", "analyser", "creer rapport" |
| German | "prufen", "analysieren", "Bericht erstellen" |
| Italian | "verificare", "analizzare", "creare rapporto" |

### Agent Memory Persistence

All 21 agents remember context across sessions automatically:
- **Project scope** (default): Memory stored in `.gemini/agent-memory/bkit/` -- shared across team
- **User scope** (starter-guide, pipeline-guide): Memory stored in `~/.gemini/agent-memory/bkit/` -- personal
- Maximum 20 sessions retained per agent

### Output Styles

| Style | Best For | Description |
|-------|----------|-------------|
| `bkit-learning` | Beginners | Step-by-step explanations with context |
| `bkit-pdca-guide` | Standard development | PDCA workflow guidance with document templates |
| `bkit-enterprise` | Enterprise teams | Technical architecture focus |
| `bkit-pdca-enterprise` | Enterprise PDCA | Combined enterprise and PDCA methodologies |

### Team Orchestration

bkit v1.5.8 includes full team orchestration with 5 coordination patterns:

| Pattern | Description | Use Case |
|---------|-------------|----------|
| **Leader** | 1 lead + N workers | Standard feature development |
| **Council** | Equal peers | Architecture decisions |
| **Swarm** | Dynamic pool | High-parallelism tasks |
| **Pipeline** | Sequential chain | Multi-phase workflows |
| **Watchdog** | Monitor + actors | Continuous monitoring |

9 dedicated modules in `lib/team/` handle coordination, communication, state recording, and memory persistence. MCP tools: `team_create`, `team_assign`, `team_status`.

---

## Project Levels

| Level | Description | Stack | Auto-Detection |
|-------|-------------|-------|----------------|
| **Starter** | Static websites, portfolios | HTML, CSS, JS | Default (no special files) |
| **Dynamic** | Fullstack applications | Next.js, BaaS | `docker-compose.yml`, `.mcp.json` |
| **Enterprise** | Microservices architecture | K8s, Terraform, MSA | `kubernetes/`, `terraform/` directories |

---

## Agents (21)

| Agent | Category | Description |
|-------|----------|-------------|
| **cto-lead** | Leadership | CTO-level orchestration, PDCA workflow management |
| **frontend-architect** | Architecture | UI/UX design, component structure, Design System |
| **security-architect** | Architecture | Vulnerability analysis, OWASP Top 10 compliance |
| **product-manager** | Management | Requirements analysis, feature prioritization, user stories |
| **qa-strategist** | Quality | Test strategy, quality metrics, verification coordination |
| **gap-detector** | PDCA Check | Design-implementation gap analysis |
| **pdca-iterator** | PDCA Act | Evaluator-Optimizer pattern, auto-fix iteration |
| **code-analyzer** | Quality | Code quality, security scan, architecture compliance |
| **report-generator** | PDCA Act | PDCA completion report generation |
| **design-validator** | PDCA Design | Design document completeness validation |
| **qa-monitor** | Quality | Docker log monitoring, Zero Script QA execution |
| **starter-guide** | Onboarding | Beginner-friendly step-by-step guidance |
| **pipeline-guide** | Pipeline | 9-phase development pipeline navigation |
| **bkend-expert** | Backend | bkend.ai BaaS platform expertise |
| **enterprise-expert** | Architecture | Enterprise-grade system strategy, microservices |
| **infra-architect** | Infrastructure | AWS, Kubernetes, Terraform infrastructure design |
| **pm-lead** | PM Team | PM team orchestration, 4-phase product discovery workflow |
| **pm-discovery** | PM Team | Opportunity Solution Tree analysis, market/user discovery |
| **pm-strategy** | PM Team | Value Proposition (JTBD), Lean Canvas business model |
| **pm-research** | PM Team | User personas, competitor analysis, market sizing (TAM/SAM/SOM) |
| **pm-prd** | PM Team | PRD synthesis, beachhead segment, GTM strategy |

Each agent uses Gemini native frontmatter with configurable `model`, `tools`, `temperature`, `max_turns`, and `timeout_mins`.

---

## Skills (35)

| Skill | Category | Trigger Examples |
|-------|----------|-----------------|
| **pdca** | Core | `/pdca plan`, `/pdca design`, `/pdca analyze` |
| **starter** | Level | "static site", "portfolio", "beginner" |
| **dynamic** | Level | "login", "fullstack", "authentication" |
| **enterprise** | Level | "microservices", "k8s", "terraform" |
| **development-pipeline** | Pipeline | "where to start", "development order" |
| **code-review** | Quality | "review code", "check quality" |
| **zero-script-qa** | Quality | "test logs", "QA without scripts" |
| **mobile-app** | Platform | "React Native", "Flutter", "iOS app" |
| **desktop-app** | Platform | "Electron", "Tauri", "desktop app" |
| **bkit-templates** | Utility | "plan template", "design template" |
| **bkit-rules** | Utility | Core rules (auto-applied) |
| **gemini-cli-learning** | Learning | `/learn`, "Gemini CLI setup" |
| **plan-plus** | Enhanced | "brainstorm plan", "explore alternatives" |
| **simplify** | Quality | "simplify code", "reduce complexity" |
| **batch** | Automation | "batch process", "multiple features" |
| **loop** | Automation | "recurring check", "monitor interval" |
| **output-style-setup** | Utility | "install styles", "setup output" |
| **pm-discovery** | PM | "product discovery", "PM analysis", "PRD" |
| **phase-1-schema** | Pipeline | "schema", "data model" |
| **phase-2-convention** | Pipeline | "coding rules", "conventions" |
| **phase-3-mockup** | Pipeline | "mockup", "wireframe", "prototype" |
| **phase-4-api** | Pipeline | "API design", "REST endpoints" |
| **phase-5-design-system** | Pipeline | "design system", "component library" |
| **phase-6-ui-integration** | Pipeline | "frontend integration", "API client" |
| **phase-7-seo-security** | Pipeline | "SEO", "security hardening" |
| **phase-8-review** | Pipeline | "architecture review", "gap analysis" |
| **phase-9-deployment** | Pipeline | "CI/CD", "production deployment" |
| **bkend-quickstart** | bkend.ai | "bkend setup", "first project", "MCP connect" |
| **bkend-auth** | bkend.ai | "signup", "login", "JWT", "session" |
| **bkend-data** | bkend.ai | "table", "CRUD", "schema", "filter" |
| **bkend-storage** | bkend.ai | "file upload", "presigned URL", "CDN" |
| **bkend-mcp** | bkend.ai | "MCP tools", "AI integration", "28 tools" |
| **bkend-security** | bkend.ai | "RLS", "API keys", "encryption" |
| **bkend-cookbook** | bkend.ai | "tutorial", "example project", "todo app" |
| **bkend-guides** | bkend.ai | "troubleshooting", "migration", "environment" |

Skills use progressive disclosure -- only metadata is loaded initially, with full instructions injected when activated. Skills are classified as Workflow (W), Capability (C), or Hybrid (H) for optimal activation.

---

## TOML Commands (24)

bkit provides 24 custom commands using Gemini CLI's TOML command format with advanced syntax:

| Command | Description | Syntax Features |
|---------|-------------|-----------------|
| `/bkit` | Show help and available functions | Static prompt |
| `/pdca <action>` | PDCA cycle management | `@{path}` file inclusion, `!{command}` shell exec, `{{args}}` interpolation |
| `/review <path>` | Code review | `@{path}` skill loading |
| `/qa` | Zero Script QA | `@{path}` skill loading |
| `/starter <action>` | Starter project commands | `@{path}` + `{{args}}` |
| `/dynamic <action>` | Dynamic project commands | `@{path}` + `{{args}}` |
| `/enterprise <action>` | Enterprise project commands | `@{path}` + `{{args}}` |
| `/pipeline <action>` | Development pipeline | `@{path}` + `{{args}}` |
| `/learn [topic]` | Gemini CLI learning | `@{path}` + `!{command}` + `{{args}}` |
| `/github-stats` | GitHub repository statistics | Custom prompt |
| `/plan-plus <feature>` | Brainstorming-enhanced PDCA planning | `@{path}` + `{{args}}` |
| `/simplify` | Code quality review and simplification | `@{path}` |
| `/batch <features>` | Parallel multi-feature PDCA processing | `@{path}` + `{{args}}` |
| `/loop <interval> <cmd>` | Recurring command execution | `@{path}` + `{{args}}` |
| `/output-style-setup` | Install output style files | `@{path}` |
| `/pm-discovery <feature>` | PM Agent Team product analysis | `@{path}` + `{{args}}` |
| `/bkend-quickstart` | bkend.ai platform onboarding | `@{path}` + `{{args}}` |
| `/bkend-auth` | bkend.ai authentication guide | `@{path}` + `{{args}}` |
| `/bkend-data` | bkend.ai database operations | `@{path}` + `{{args}}` |
| `/bkend-storage` | bkend.ai file storage guide | `@{path}` + `{{args}}` |
| `/bkend-mcp` | bkend.ai MCP tools & AI | `@{path}` + `{{args}}` |
| `/bkend-security` | bkend.ai security policies | `@{path}` + `{{args}}` |
| `/bkend-cookbook` | bkend.ai project tutorials | `@{path}` + `{{args}}` |
| `/bkend-guides` | bkend.ai operational guides | `@{path}` + `{{args}}` |

### TOML Advanced Syntax

```toml
# Example: pdca.toml
description = "PDCA cycle management"
prompt = """
@skills/pdca/SKILL.md           # @{path} - Include file content
Execute PDCA action: {{args}}    # {{args}} - User argument interpolation
Current status:
!cat docs/.pdca-status.json      # !{command} - Shell command execution
"""
```

---

## Tool Name Mapping

bkit uses Gemini CLI native tool names (v0.29.0+ verified from source):

| Claude Code Tool | Gemini CLI Tool |
|------------------|-----------------|
| Write | write_file |
| Edit | replace |
| Read | read_file |
| Bash | run_shell_command |
| Glob | glob |
| Grep | grep_search |
| WebSearch | google_web_search |
| WebFetch | web_fetch |
| AskUserQuestion | ask_user |
| Skill | activate_skill |
| TodoWrite | write_todos |
| SaveMemory | save_memory |
| EnterPlanMode | enter_plan_mode |
| ExitPlanMode | exit_plan_mode |
| TaskCreate | tracker_create_task |
| TaskUpdate | tracker_update_task |
| TaskGet | tracker_get_task |
| TaskList | tracker_list_tasks |

---

## Language Support

bkit automatically detects your language from trigger keywords in 8 languages:

| Language | Trigger Keywords |
|----------|-----------------|
| English | static website, beginner, API design, verify, analyze |
| Korean | 정적 웹, 초보자, API 설계, 검증, 분석 |
| Japanese | 静的サイト, 初心者, API設計, 確認, 分析 |
| Chinese | 静态网站, 初学者, API设计, 验证, 分析 |
| Spanish | sitio web estatico, principiante, verificar |
| French | site web statique, debutant, verifier |
| German | statische Webseite, Anfanger, prufen |
| Italian | sito web statico, principiante, verificare |

---

