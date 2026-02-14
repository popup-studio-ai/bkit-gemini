# Comprehensive Test Plan: bkit-gemini v1.5.2 Full Feature & Philosophy Test

> **Feature**: bkit-gemini-v152-full-test
> **Version**: bkit-gemini v1.5.2
> **Status**: PLAN
> **Date**: 2026-02-15
> **Execution Environment**: Gemini CLI (gemini-cli v0.28.x)
> **Scope**: All bkit features + Philosophy + User Experience
> **Estimated Test Cases**: 156

---

## 1. Test Objectives

### 1.1 Primary Goals

1. **Feature Completeness**: Verify all 29 skills, 16 agents, 18 commands, 10 hook events function correctly in Gemini CLI
2. **v1.5.2 Validation**: Confirm 8 new bkend-* domain skills and 8 new commands work as designed
3. **Philosophy Alignment**: Test that bkit's 3 core philosophies are enforced at runtime
4. **AI-Native Principles**: Validate 3 competencies (Verification, Direction Setting, Quality Standards)
5. **PDCA Methodology**: End-to-end PDCA cycle from Plan through Act with auto-iteration
6. **Context Engineering**: Verify 8 functional requirements (FR-01~FR-08) and 5-layer hook system
7. **User Experience**: Validate user journey across all 3 project levels (Starter/Dynamic/Enterprise)

### 1.2 Out of Scope

- Performance benchmarking (token usage, response latency)
- Multi-user concurrent testing
- Network failure/offline mode testing
- Third-party API integration (actual bkend.ai server calls)

---

## 2. Test Environment

### 2.1 Prerequisites

| Requirement | Version |
|-------------|---------|
| Gemini CLI | v0.28.x |
| Node.js | v18+ |
| Git | v2.x |
| OS | macOS / Linux |

### 2.2 Setup Instructions

```bash
# 1. Clone repository
git clone https://github.com/popup-studio-ai/bkit-gemini.git
cd bkit-gemini

# 2. Verify extension loaded
gemini --version
# Should show v0.28.x with bkit extension

# 3. Verify extension config
cat gemini-extension.json
# version should be "1.5.2"

# 4. Create test project directory
mkdir -p /tmp/bkit-test-project && cd /tmp/bkit-test-project
git init
```

### 2.3 Notation Convention

- **[PROMPT]**: Text to type into Gemini CLI
- **[EXPECT]**: Expected behavior or output to verify
- **[VERIFY]**: Manual check to perform
- **P0/P1/P2**: Priority (P0=Critical, P1=Important, P2=Nice-to-have)

---

## 3. Test Categories Overview

| # | Category | Tests | Priority | Philosophy Coverage |
|---|----------|-------|----------|---------------------|
| TC-A | Session Lifecycle | 12 | P0 | Automation First |
| TC-B | Skill System | 24 | P0 | Docs = Code |
| TC-C | Agent System | 18 | P0 | No Guessing |
| TC-D | Command System | 18 | P0 | Automation First |
| TC-E | PDCA Full Cycle | 16 | P0 | All 3 Philosophies |
| TC-F | Context Engineering | 14 | P0 | Docs = Code |
| TC-G | bkend.ai Domain (v1.5.2) | 20 | P0 | Docs = Code |
| TC-H | Philosophy & UX | 16 | P1 | All 3 Philosophies |
| TC-I | Multi-Language Triggers | 10 | P1 | No Guessing |
| TC-J | Edge Cases & Error Handling | 8 | P2 | No Guessing |
| **Total** | | **156** | | |

---

## 4. TC-A: Session Lifecycle (12 tests)

Tests the 10-event hook system and session management. Validates **Automation First** philosophy: bkit should automatically detect context and configure itself without user intervention.

### A-01: Fresh Session Start [P0]

```
[PROMPT] (Start gemini in a new empty directory)
[EXPECT]
  - SessionStart hook fires automatically
  - Welcome message appears with bkit version (1.5.2)
  - Project level detection runs (should detect "Starter" for empty dir)
  - Output style applied (default: bkit-learning)
  - Feature Usage Report section appears at the end
[VERIFY]
  - No error messages in output
  - Session status shows onboardingCompleted: true
```

### A-02: Returning User Detection [P0]

```
[SETUP] Create docs/.bkit-memory.json with { "sessionCount": 3, "level": "Dynamic" }
[PROMPT] (Start gemini in this directory)
[EXPECT]
  - SessionStart recognizes returning user
  - Skips onboarding, loads previous context
  - Project level "Dynamic" is preserved from memory
  - Previous PDCA status is loaded if exists
```

### A-03: Enterprise Level Auto-Detection [P0]

```
[SETUP] Create kubernetes/service.yaml and terraform/main.tf
[PROMPT] (Start gemini)
[EXPECT]
  - Auto-detects Enterprise level from file markers
  - Context includes Enterprise-specific features
  - Agent triggers include enterprise-expert
```

### A-04: Dynamic Level Auto-Detection [P0]

```
[SETUP] Create package.json with next.js dependency
[PROMPT] (Start gemini)
[EXPECT]
  - Auto-detects Dynamic level
  - bkend.ai skills available in context
  - Starter-only limitations removed
```

### A-05: BeforeAgent Hook - Intent Detection [P0]

```
[PROMPT] 로그인 기능을 만들어줘
[EXPECT]
  - BeforeAgent hook detects Korean language
  - Intent classified as "authentication" task
  - bkend-auth skill and bkend-expert agent triggered
  - Ambiguity score calculated
```

### A-06: BeforeModel Hook - PDCA Augmentation [P1]

```
[SETUP] Set PDCA phase to "design" for active feature
[PROMPT] 이 기능 구현해줘
[EXPECT]
  - BeforeModel injects design-phase-specific prompt
  - Response references design document
  - Implementation follows design specs
```

### A-07: BeforeTool Hook - Permission Manager [P0]

```
[PROMPT] rm -rf / 실행해줘
[EXPECT]
  - BeforeTool hook intercepts the dangerous command
  - Command is BLOCKED (not executed)
  - Warning message explains why it was blocked
  - Suggests safe alternatives
```

### A-08: AfterTool Hook - PDCA Phase Transition [P1]

```
[SETUP] Active feature in "design" phase
[PROMPT] (Write a source code file)
[EXPECT]
  - AfterTool detects file write during design phase
  - Automatically transitions to "do" phase
  - PDCA status updated in docs/.pdca-status.json
```

### A-09: BeforeToolSelection - Phase Filtering [P1]

```
[SETUP] Active feature in "plan" phase
[PROMPT] 코드 작성해줘
[EXPECT]
  - BeforeToolSelection filters out write tools
  - Guides user to complete plan before coding
  - Or transitions to appropriate phase first
```

### A-10: PreCompress Hook - Context Preservation [P1]

```
[PROMPT] (Have a long conversation that triggers context compaction)
[EXPECT]
  - PreCompress creates context fork snapshot
  - Critical context (PDCA status, active feature) preserved
  - Post-compaction conversation maintains continuity
```

### A-11: SessionEnd Hook - Memory Persistence [P1]

```
[PROMPT] (End the gemini session)
[EXPECT]
  - SessionEnd fires cleanup
  - Agent memories persisted
  - Session metrics saved
  - No orphaned temp files
```

### A-12: Output Style Applied [P0]

```
[PROMPT] /output-style
[EXPECT]
  - Shows 4 available styles: bkit-learning, bkit-pdca-guide, bkit-enterprise, bkit-pdca-enterprise
  - Current style displayed
  - Changing style affects subsequent responses
```

---

## 5. TC-B: Skill System (24 tests)

Tests all 29 skills across 5 categories. Validates **Docs = Code** philosophy: skills are documentation that directly controls AI behavior.

### Core Skills (3)

#### B-01: /pdca Skill Activation [P0]

```
[PROMPT] /pdca status
[EXPECT]
  - pdca skill loaded via skill-orchestrator
  - Shows current PDCA status for all features
  - Feature list with phase, matchRate, iterationCount
  - Pipeline status (currentPhase, level)
```

#### B-02: /bkit-rules Skill [P0]

```
[PROMPT] 코드 작성 규칙이 뭐야?
[EXPECT]
  - bkit-rules skill triggers on coding rules query
  - Returns PDCA methodology rules
  - Code quality standards explained
  - Permission hierarchy referenced
```

#### B-03: /bkit-templates Skill [P0]

```
[PROMPT] /bkit-templates
[EXPECT]
  - Lists available PDCA templates
  - Shows template categories: plan, design, analysis, report
  - Pipeline phase templates (9 phases)
  - Template selection guidance
```

### Project Level Skills (3)

#### B-04: /starter Skill [P0]

```
[PROMPT] /starter 포트폴리오 사이트 만들어줘
[EXPECT]
  - Starter skill activates for static web project
  - HTML/CSS/JS approach (no backend)
  - Beginner-friendly explanations
  - Phases 4,5,7,8 correctly skipped in pipeline
```

#### B-05: /dynamic Skill [P0]

```
[PROMPT] /dynamic 로그인 있는 블로그 만들어줘
[EXPECT]
  - Dynamic skill activates for fullstack project
  - bkend.ai BaaS integration mentioned
  - REST API pattern (bkendFetch) referenced
  - MongoDB Atlas as database (NOT PostgreSQL)
```

#### B-06: /enterprise Skill [P0]

```
[PROMPT] /enterprise 마이크로서비스 아키텍처 설계해줘
[EXPECT]
  - Enterprise skill activates
  - Kubernetes, Terraform, CI/CD mentioned
  - All 9 pipeline phases included
  - AI Native methodology referenced
```

### Pipeline Phase Skills (9)

#### B-07: Phase 1-9 Skills Sequential Flow [P1]

```
[PROMPT] /phase-1-schema
[EXPECT] Schema definition guidance, terminology standards

[PROMPT] /phase-2-convention
[EXPECT] Coding rules, naming conventions, project structure

[PROMPT] /phase-3-mockup
[EXPECT] UI/UX mockup creation guidelines

[PROMPT] /phase-4-api
[EXPECT] API design, REST endpoints, bkend.ai integration

[PROMPT] /phase-5-design-system
[EXPECT] Design tokens, component library, platform-independent

[PROMPT] /phase-6-ui-integration
[EXPECT] Frontend-backend connection, state management

[PROMPT] /phase-7-seo-security
[EXPECT] SEO optimization, security hardening, OWASP

[PROMPT] /phase-8-review
[EXPECT] Code review, gap analysis, quality gates

[PROMPT] /phase-9-deployment
[EXPECT] CI/CD pipeline, production deployment, monitoring
```

#### B-08: /development-pipeline Skill [P0]

```
[PROMPT] /development-pipeline status
[EXPECT]
  - Shows all 9 phases with current status
  - Level-specific phase filtering applied
  - Starter: phases 1,2,3,6,9 only
  - Dynamic: phases 1-7,9 (skip 8)
  - Enterprise: all 9 phases
```

### Quality & Platform Skills (5)

#### B-09: /code-review Skill [P1]

```
[PROMPT] /code-review src/app.js
[EXPECT]
  - Code quality analysis triggered
  - Bug detection, security scan, performance check
  - Actionable suggestions with file:line references
```

#### B-10: /zero-script-qa Skill [P1]

```
[PROMPT] /zero-script-qa
[EXPECT]
  - Zero Script QA methodology explained
  - Log-based testing without test scripts
  - Docker log monitoring instructions
  - Request ID tracking pattern
```

#### B-11: /mobile-app Skill [P1]

```
[PROMPT] /mobile-app React Native 앱 만들어줘
[EXPECT]
  - Mobile development guidance
  - React Native / Flutter / Expo patterns
  - Platform-specific considerations
```

#### B-12: /desktop-app Skill [P1]

```
[PROMPT] /desktop-app
[EXPECT]
  - Desktop application guidance
  - Electron and Tauri framework comparisons
  - Cross-platform considerations
```

#### B-13: /gemini-cli-learning Skill [P1]

```
[PROMPT] /learn
[EXPECT]
  - Gemini CLI configuration tips
  - Extension optimization guidance
  - Hook system explanation
```

### Skill Orchestrator Internals (5)

#### B-14: Progressive Disclosure [P0]

```
[PROMPT] (Start session - observe context size)
[VERIFY]
  - Only GEMINI.md + 6 @import modules loaded initially (~1,200 tokens)
  - Individual skills NOT loaded until triggered
  - After triggering a skill, its content added to context
  - Context stays minimal between skill activations
```

#### B-15: Agent Delegation from Skill [P0]

```
[PROMPT] /pdca analyze my-feature
[EXPECT]
  - pdca skill activates
  - "analyze" action routes to gap-detector agent
  - gap-detector agent performs analysis
  - Results follow gap-detector format
```

#### B-16: Skill Memory Persistence [P1]

```
[PROMPT] /pdca plan test-memory-feature
[PROMPT] (End session and restart)
[PROMPT] /pdca status
[EXPECT]
  - test-memory-feature visible in status
  - Phase and metadata preserved across sessions
  - Memory scope: project (not global)
```

#### B-17: Skill Frontmatter Validation [P0]

```
[VERIFY] For ALL 29 skills, check:
  - name: matches directory name
  - description: present and meaningful
  - user-invocable: true for all user-facing skills
  - allowed-tools: appropriate tool list
  - agents: valid agent references
  - context: session (default)
  - memory: project (for bkend-* skills)
  - 8-language triggers present in description
```

#### B-18: Skill Import Chain [P1]

```
[VERIFY] Skills with imports:[] load dependencies correctly
  - Check each skill's imports field
  - Verify imported modules are available
  - No circular dependency issues
```

---

## 6. TC-C: Agent System (18 tests)

Tests all 16 agents. Validates **No Guessing** philosophy: agents should provide verified, accurate information rather than making assumptions.

### Leadership Agents (2)

#### C-01: cto-lead Agent Orchestration [P0]

```
[PROMPT] 팀 구성해서 로그인 기능 만들어줘
[EXPECT]
  - cto-lead agent activates
  - Team composition proposed (relevant agents selected)
  - PDCA workflow initiated
  - Task delegation to specialized agents
```

#### C-02: product-manager Agent [P1]

```
[PROMPT] 이 기능의 요구사항 정리해줘
[EXPECT]
  - product-manager agent activates
  - Requirements analysis with user stories
  - Feature prioritization (MoSCoW or similar)
  - Scope definition document created
```

### Architecture Agents (4)

#### C-03: frontend-architect Agent [P1]

```
[PROMPT] 프론트엔드 아키텍처 설계해줘
[EXPECT]
  - Component structure proposal
  - Design system recommendations
  - State management approach
  - React/Next.js patterns
```

#### C-04: security-architect Agent [P1]

```
[PROMPT] 보안 취약점 분석해줘
[EXPECT]
  - OWASP Top 10 compliance check
  - Authentication design review
  - Vulnerability assessment
  - Security recommendations
```

#### C-05: infra-architect Agent [P1]

```
[PROMPT] AWS 인프라 설계해줘
[EXPECT]
  - Cloud architecture proposal
  - Kubernetes/EKS configuration
  - Terraform templates
  - CI/CD pipeline design
```

#### C-06: enterprise-expert Agent [P1]

```
[PROMPT] 마이크로서비스 전략 수립해줘
[EXPECT]
  - Enterprise architecture guidance
  - Microservices decomposition strategy
  - AI Native methodology application
  - Team composition recommendations
```

### Quality Agents (3)

#### C-07: qa-strategist Agent [P1]

```
[PROMPT] 테스트 전략 수립해줘
[EXPECT]
  - Test strategy document
  - Quality metrics defined
  - Test coverage plan
  - Verification coordination approach
```

#### C-08: qa-monitor Agent [P1]

```
[PROMPT] Docker 로그 분석해줘
[EXPECT]
  - Zero Script QA methodology applied
  - Log parsing and analysis
  - Issue detection from structured logs
  - Real-time monitoring guidance
```

#### C-09: code-analyzer Agent [P1]

```
[PROMPT] 코드 품질 분석해줘
[EXPECT]
  - Code quality report
  - Security scan results
  - Performance analysis
  - Architecture compliance check
  - Read-only analysis (no file modifications)
```

### PDCA Cycle Agents (4)

#### C-10: gap-detector Agent [P0]

```
[PROMPT] 설계서대로 구현됐는지 검증해줘
[EXPECT]
  - Design document loaded and parsed
  - Implementation files scanned
  - Gap analysis with requirement-by-requirement verification
  - Match rate percentage calculated
  - Missing/incorrect items listed
```

#### C-11: pdca-iterator Agent [P0]

```
[SETUP] Gap analysis result with match rate < 90%
[PROMPT] 자동 수정해줘
[EXPECT]
  - Evaluator-Optimizer pattern activated
  - Fixes applied for each gap
  - Re-runs gap-detector after fixes
  - Iterates until match rate >= 90% or max 5 iterations
  - Reports final match rate
```

#### C-12: report-generator Agent [P0]

```
[PROMPT] PDCA 완료 보고서 작성해줘
[EXPECT]
  - Consolidates plan, design, implementation, analysis results
  - Executive summary with key metrics
  - PDCA cycle summary (all phases)
  - Deliverables list
  - Quality metrics table
  - Git history
  - Lessons learned
  - Success criteria verification
```

#### C-13: design-validator Agent [P1]

```
[PROMPT] 설계 문서 검증해줘
[EXPECT]
  - Design document completeness check
  - Internal consistency validation
  - Missing sections identified
  - Cross-reference verification
```

### Domain Agents (3)

#### C-14: bkend-expert Agent [P0]

```
[PROMPT] bkend.ai에서 로그인 구현하려면?
[EXPECT]
  - bkend-expert agent activates (28 MCP tools referenced)
  - bkendFetch pattern explained (NOT @bkend/sdk)
  - REST API endpoints: https://api-client.bkend.ai
  - MongoDB Atlas referenced (NOT PostgreSQL)
  - JWT tokens: Access 1hr, Refresh 30 days
  - 15 troubleshooting entries available
```

#### C-15: starter-guide Agent [P0]

```
[PROMPT] 처음 코딩 배우는데 도움줘
[EXPECT]
  - Beginner-friendly language
  - Step-by-step instructions
  - Simple explanations without jargon
  - Starter level project guidance
```

#### C-16: pipeline-guide Agent [P1]

```
[PROMPT] 개발 순서가 어떻게 돼?
[EXPECT]
  - 9-phase pipeline explained
  - Current phase identified
  - Level-specific phase filtering
  - Next steps recommended
```

### Agent Cross-Validation (2)

#### C-17: Agent Trigger Accuracy [P0]

```
[VERIFY] For ALL 16 agents, test their primary trigger:
  - cto-lead: "팀 구성" → activates
  - gap-detector: "검증" → activates
  - pdca-iterator: "개선" → activates
  - code-analyzer: "분석" → activates
  - report-generator: "보고서" → activates
  - starter-guide: "도움" → activates
  - bkend-expert: "bkend" → activates
  (Test at least one trigger per agent)
```

#### C-18: Agent Model Assignment [P1]

```
[VERIFY] Agent model distribution matches v1.5.4 spec:
  - 7 agents use opus model
  - 7 agents use sonnet model
  - 2 agents use haiku model
  - Check agents/*.md for model field
```

---

## 7. TC-D: Command System (18 tests)

Tests all 18 TOML commands. Validates **Automation First** philosophy: commands should provide quick access to complex workflows.

### Core Commands (2)

#### D-01: /bkit Command [P0]

```
[PROMPT] /bkit
[EXPECT]
  - Shows bkit version (1.5.2)
  - Lists all available commands
  - Feature count summary (29 skills, 16 agents, 18 commands)
  - Quick start guidance
```

#### D-02: /pdca Command with Actions [P0]

```
[PROMPT] /pdca plan my-test
[EXPECT] Plan phase initiated, template loaded

[PROMPT] /pdca design my-test
[EXPECT] Design phase initiated

[PROMPT] /pdca do my-test
[EXPECT] Implementation phase started

[PROMPT] /pdca analyze my-test
[EXPECT] Gap analysis triggered (delegates to gap-detector)

[PROMPT] /pdca iterate my-test
[EXPECT] Auto-improvement started (delegates to pdca-iterator)

[PROMPT] /pdca report my-test
[EXPECT] Completion report generated (delegates to report-generator)

[PROMPT] /pdca status
[EXPECT] Current status for all features

[PROMPT] /pdca next
[EXPECT] Recommends next PDCA action based on current phase
```

### Project Commands (3)

#### D-03: /starter Command [P0]

```
[PROMPT] /starter portfolio site
[EXPECT]
  - Starter skill loaded
  - Static web project guidance
  - HTML/CSS/JS patterns
  - No backend components
```

#### D-04: /dynamic Command [P0]

```
[PROMPT] /dynamic blog with login
[EXPECT]
  - Dynamic skill loaded
  - bkend.ai BaaS integration
  - Authentication flow guidance
  - Full-stack approach
```

#### D-05: /enterprise Command [P1]

```
[PROMPT] /enterprise microservices
[EXPECT]
  - Enterprise skill loaded
  - Kubernetes architecture
  - All 9 pipeline phases available
```

### Development Commands (5)

#### D-06: /pipeline Command [P0]

```
[PROMPT] /pipeline start
[EXPECT] Pipeline initialized from phase 1

[PROMPT] /pipeline next
[EXPECT] Advances to next phase, shows current progress

[PROMPT] /pipeline status
[EXPECT] Shows all 9 phases with completion status
```

#### D-07: /review Command [P1]

```
[PROMPT] /review
[EXPECT] Code review analysis initiated
```

#### D-08: /qa Command [P1]

```
[PROMPT] /qa
[EXPECT] Zero Script QA methodology launched
```

#### D-09: /learn Command [P1]

```
[PROMPT] /learn
[EXPECT] Gemini CLI learning content loaded
```

#### D-10: /github-stats Command [P2]

```
[PROMPT] /github-stats
[EXPECT] Repository statistics displayed
```

### bkend.ai Commands (8) - v1.5.2 New

#### D-11: /bkend-quickstart Command [P0]

```
[PROMPT] /bkend-quickstart
[EXPECT]
  - bkend-quickstart skill loaded
  - Delegates to bkend-expert agent
  - Resource hierarchy explained (Org > Project > Environment)
  - API key setup instructions
  - MCP configuration guide
```

#### D-12: /bkend-auth Command [P0]

```
[PROMPT] /bkend-auth email login
[EXPECT]
  - bkend-auth skill loaded
  - Email authentication flow detailed
  - JWT handling (Access 1hr, Refresh 30 days)
  - bkendFetch implementation example
  - Social login and magic link options mentioned
```

#### D-13: /bkend-data Command [P0]

```
[PROMPT] /bkend-data CRUD operations
[EXPECT]
  - bkend-data skill loaded
  - 7 column types explained
  - 10 query operators listed
  - CRUD endpoint patterns shown
  - MongoDB Atlas as underlying database
```

#### D-14: /bkend-storage Command [P0]

```
[PROMPT] /bkend-storage file upload
[EXPECT]
  - bkend-storage skill loaded
  - Presigned URL workflow explained
  - 4 visibility levels (private/public/authenticated/custom)
  - CDN integration details
```

#### D-15: /bkend-mcp Command [P0]

```
[PROMPT] /bkend-mcp
[EXPECT]
  - bkend-mcp skill loaded
  - 28 MCP tools listed and categorized
  - MCP server configuration at https://api.bkend.ai/mcp
  - Fixed(3) + Project(6) + Table(9) + Data CRUD(5) + Env(3) + Schema(2)
```

#### D-16: /bkend-security Command [P0]

```
[PROMPT] /bkend-security
[EXPECT]
  - bkend-security skill loaded
  - Multi-layer security model (5 layers)
  - API key types (Public vs Secret)
  - RLS with 4 roles (admin/user/guest/self)
  - Encryption: Argon2id, AES-256-GCM, TLS 1.2+
```

#### D-17: /bkend-cookbook Command [P1]

```
[PROMPT] /bkend-cookbook blog tutorial
[EXPECT]
  - bkend-cookbook skill loaded
  - Blog project tutorial referenced
  - 4 project tutorials available (blog, recipe-app, shopping-mall, social-network)
  - 5 example app references
```

#### D-18: /bkend-guides Command [P1]

```
[PROMPT] /bkend-guides troubleshooting
[EXPECT]
  - bkend-guides skill loaded
  - Troubleshooting steps provided
  - Migration guides available
  - FAQ section referenced
```

---

## 8. TC-E: PDCA Full Cycle (16 tests)

End-to-end PDCA cycle test. Validates all 3 core philosophies working together.

### Plan Phase (3)

#### E-01: Plan Document Creation [P0]

```
[PROMPT] /pdca plan test-login-feature
[EXPECT]
  - plan.template.md loaded
  - docs/01-plan/features/test-login-feature.plan.md created
  - PDCA status updated: phase="plan", matchRate=null
  - Feature added to activeFeatures list
  - Plan includes: objective, scope, requirements, success criteria
```

#### E-02: Plan Phase - No Code Allowed [P0]

```
[PROMPT] (While in plan phase) 코드 작성해줘
[EXPECT]
  - Guidance to complete plan first (Docs = Code philosophy)
  - OR auto-transition to appropriate phase
  - Plan document referenced as source of truth
```

#### E-03: Plan Phase Completion [P0]

```
[PROMPT] /pdca next
[EXPECT]
  - Detects plan is complete
  - Recommends: "Design with /pdca design test-login-feature"
  - Phase transition ready
```

### Design Phase (3)

#### E-04: Design Document Creation [P0]

```
[PROMPT] /pdca design test-login-feature
[EXPECT]
  - design.template.md loaded
  - docs/02-design/features/test-login-feature.design.md created
  - PDCA status updated: phase="design"
  - Design references plan document
  - File-level specifications included
```

#### E-05: Design Validation [P1]

```
[PROMPT] 설계 문서 검증해줘
[EXPECT]
  - design-validator agent activated
  - Completeness check against template
  - Internal consistency verified
  - Missing items reported
```

#### E-06: Design Phase Completion [P0]

```
[PROMPT] /pdca next
[EXPECT]
  - Detects design is complete
  - Recommends: "Start implementation or /pdca do test-login-feature"
```

### Do Phase (3)

#### E-07: Implementation Start [P0]

```
[PROMPT] /pdca do test-login-feature
[EXPECT]
  - PDCA status transitions to phase="do"
  - Design document loaded as implementation guide
  - File list from design doc used as checklist
  - Implementation follows design spec exactly
```

#### E-08: Task Classification [P1]

```
[VERIFY] Implementation correctly classified:
  - quick_fix: < 10 lines changed
  - minor_change: < 50 lines
  - feature: < 200 lines
  - major_feature: >= 200 lines
[EXPECT] Classification affects PDCA auto-apply behavior
```

#### E-09: Implementation Tracking [P1]

```
[PROMPT] /pdca status
[EXPECT]
  - Shows "do" phase active
  - Files modified count visible
  - Iteration count = 0 (first pass)
```

### Check Phase (4)

#### E-10: Gap Analysis Trigger [P0]

```
[PROMPT] /pdca analyze test-login-feature
[EXPECT]
  - gap-detector agent activated
  - Design document loaded as baseline
  - Every requirement checked against implementation
  - Match rate calculated (e.g., 95.2%)
  - docs/03-analysis/features/test-login-feature.analysis.md created
```

#### E-11: Gap Analysis Detail [P0]

```
[VERIFY] Analysis report includes:
  - Total requirements count
  - Passed requirements count
  - Failed requirements with details
  - Category-by-category breakdown
  - Specific file:line references for gaps
```

#### E-12: Match Rate < 90% Auto-Iteration [P0]

```
[SETUP] Gap analysis returns < 90% match rate
[EXPECT]
  - pdca-iterator auto-invoked (or recommended)
  - Fixes applied for each gap
  - Re-runs gap-detector
  - Maximum 5 iterations
  - Stops when >= 90% achieved
```

#### E-13: Match Rate >= 90% Completion [P0]

```
[SETUP] Gap analysis returns >= 90% match rate
[EXPECT]
  - Recommends completion report
  - "Completion report with /pdca report test-login-feature"
  - PDCA status updated: phase="check", matchRate=XX
```

### Act Phase (3)

#### E-14: Manual Iteration [P1]

```
[PROMPT] /pdca iterate test-login-feature
[EXPECT]
  - pdca-iterator activated
  - Remaining gaps addressed
  - Re-analysis after fixes
  - Progress reported per iteration
```

#### E-15: Completion Report Generation [P0]

```
[PROMPT] /pdca report test-login-feature
[EXPECT]
  - report-generator agent activated
  - docs/04-report/features/test-login-feature.report.md created
  - Report includes all PDCA phases summary
  - Success criteria table with PASS/FAIL
  - Git history included
  - Lessons learned section
```

#### E-16: PDCA Cycle Complete [P0]

```
[PROMPT] /pdca status
[EXPECT]
  - Feature status: "completed"
  - matchRate: 100 (or final value)
  - completedAt timestamp set
  - All document paths recorded (planDoc, designDoc, reportDoc)
```

---

## 9. TC-F: Context Engineering (14 tests)

Tests the 8 functional requirements from `context-engineering.md`. Validates **Docs = Code** philosophy: context documents directly control AI behavior.

### FR-01: Multi-Level Context Hierarchy (3)

#### F-01: 4-Level Config Merge [P0]

```
[VERIFY] Configuration merges in correct order:
  Level 1: bkit.config.json (extension defaults)
  Level 2: .gemini/settings.json (user settings)
  Level 3: docs/.bkit-memory.json (project memory)
  Level 4: Runtime hooks (session state)
[EXPECT] Higher levels override lower levels
```

#### F-02: GEMINI.md Has 6 @import Directives [P0]

```
[VERIFY] Read GEMINI.md and count @import lines
[EXPECT]
  - Exactly 6 @import directives
  - Each resolves to .gemini/context/*.md
  - All imports load without error
```

#### F-03: Context Module Content [P0]

```
[VERIFY] Check each of the 6 context modules contains:
  - skill-triggers.md: 29 skill trigger patterns
  - agent-triggers.md: 16 agent trigger patterns
  - commands.md: 18 command descriptions
  - pdca-rules.md: PDCA automation rules
  - bkit-info.md: bkit meta information
  - output-rules.md: Response formatting rules
```

### FR-02: @import Directive (2)

#### F-04: Import Resolution [P0]

```
[VERIFY] import-resolver.js correctly resolves:
  - Relative paths: @.gemini/context/file.md
  - Skill references: @skills/pdca/SKILL.md
  - Agent references: @agents/bkend-expert.md
[EXPECT] All imports resolve to valid file paths
```

#### F-05: Import Caching [P1]

```
[VERIFY] Resolved imports are cached
  - Same import doesn't trigger re-read
  - Cache invalidation on file change
```

### FR-03: Context Fork (2)

#### F-06: Snapshot Isolation [P0]

```
[VERIFY] context-fork.js provides:
  - Pre-compaction snapshot creation
  - Critical context preservation
  - LRU cache management (477 lines)
  - PDCA status survival across compaction
```

#### F-07: Fork Recovery [P1]

```
[PROMPT] (Trigger context compaction via long conversation)
[EXPECT]
  - Active feature context preserved
  - PDCA phase not lost
  - Can continue working after compaction
```

### FR-04: UserPromptSubmit Hook (2)

#### F-08: Intent Detection Pipeline [P0]

```
[PROMPT] 블로그 만들어줘
[VERIFY] before-agent.js processes:
  1. Language detection (Korean)
  2. Trigger keyword matching ("만들어")
  3. Skill/Agent routing decision
  4. Ambiguity scoring
  5. Context augmentation
```

#### F-09: Ambiguity Handling [P0]

```
[PROMPT] 앱 만들어줘 (ambiguous - mobile? web? desktop?)
[EXPECT]
  - High ambiguity score detected
  - Clarifying questions asked (not guessing)
  - Options presented: mobile app, web app, desktop app
  - No Guessing philosophy enforced
```

### FR-05: Permission Hierarchy (1)

#### F-10: Permission Engine [P0]

```
[VERIFY] permission.js (381 lines) enforces:
  - Dangerous command blocking (rm -rf, drop table, etc.)
  - Tool-specific permissions per phase
  - Agent-specific tool restrictions
  - User override capability
```

### FR-06: Task Dependency Chain (1)

#### F-11: Task Dependencies [P1]

```
[VERIFY] Task system supports:
  - Task creation with dependencies
  - Blocked/unblocked state tracking
  - Dependency resolution order
  - Circular dependency detection
```

### FR-07: Context Compaction Hook (1)

#### F-12: Pre-Compress Hook [P1]

```
[VERIFY] pre-compress.js:
  - Fires before Gemini context compaction
  - Saves critical state snapshot
  - Preserves PDCA status
  - Maintains conversation continuity
```

### FR-08: MEMORY Variable (2)

#### F-13: Agent Memory System [P0]

```
[VERIFY] agent-memory.js (214 lines):
  - Per-agent persistent storage
  - Project scope for domain agents (9 agents)
  - User scope for guide agents (2 agents)
  - Read/write across sessions
```

#### F-14: Memory Persistence Test [P0]

```
[PROMPT] (Interact with bkend-expert agent, provide project context)
[PROMPT] (End session, start new session)
[PROMPT] bkend 관련 이전에 뭐 했었지?
[EXPECT]
  - bkend-expert recalls previous session context
  - Project-scoped memory loaded
  - No redundant questions about already-known context
```

---

## 10. TC-G: bkend.ai Domain v1.5.2 (20 tests)

Tests all 8 new bkend-* skills and bkend-expert agent rewrite. Validates accurate documentation synchronization from bkend-docs v0.0.10.

### Critical Accuracy Tests (5)

#### G-01: Database Type Accuracy [P0]

```
[PROMPT] bkend.ai는 무슨 데이터베이스 사용해?
[EXPECT]
  - Answer: MongoDB Atlas (NOT PostgreSQL)
  - NoSQL document database
  - No mention of SQL, tables, or relations in database context
```

#### G-02: SDK Reference Accuracy [P0]

```
[PROMPT] bkend.ai SDK 어떻게 사용해?
[EXPECT]
  - Answer: bkendFetch pattern (REST API wrapper)
  - NO mention of @bkend/sdk (does not exist)
  - Direct REST API calls to https://api-client.bkend.ai
  - Fetch API based implementation
```

#### G-03: Token Lifetime Accuracy [P0]

```
[PROMPT] bkend.ai 토큰 만료 시간이 어떻게 돼?
[EXPECT]
  - Access Token: 1 hour
  - Refresh Token: 30 days (NOT 7 days)
  - Token refresh flow explained
```

#### G-04: API URL Consistency [P0]

```
[PROMPT] bkend.ai API 주소가 뭐야?
[EXPECT]
  - REST API: https://api-client.bkend.ai
  - MCP Server: https://api.bkend.ai/mcp
  - No mixed or incorrect URLs
```

#### G-05: MCP Tool Count [P0]

```
[PROMPT] bkend.ai MCP 도구 몇개야?
[EXPECT]
  - 28 MCP Tools total
  - Breakdown: Fixed(3) + Project(6) + Table(9) + Data CRUD(5) + Env(3) + Schema(2)
  - Each category accurately listed
```

### bkend-quickstart Skill Tests (2)

#### G-06: Resource Hierarchy [P0]

```
[PROMPT] /bkend-quickstart 프로젝트 구조 설명해줘
[EXPECT]
  - Organization > Project > Environment hierarchy
  - Console overview (12 docs referenced)
  - Getting started steps (7 docs referenced)
```

#### G-07: MCP Setup Guide [P1]

```
[PROMPT] /bkend-quickstart MCP 설정 방법
[EXPECT]
  - MCP server URL: https://api.bkend.ai/mcp
  - Authentication setup steps
  - Tool discovery instructions
```

### bkend-auth Skill Tests (3)

#### G-08: Email Authentication Flow [P0]

```
[PROMPT] /bkend-auth 이메일 로그인 구현
[EXPECT]
  - Signup endpoint: POST /api/v1/auth/signup
  - Login endpoint: POST /api/v1/auth/login
  - Token refresh endpoint shown
  - bkendFetch wrapper implementation
  - Error handling patterns
```

#### G-09: Social Login Options [P1]

```
[PROMPT] /bkend-auth 소셜 로그인 종류
[EXPECT]
  - Available providers listed
  - OAuth flow explained
  - Callback URL configuration
```

#### G-10: RBAC and Role System [P0]

```
[PROMPT] /bkend-auth 역할 시스템 설명
[EXPECT]
  - 4 roles: admin, user, guest, self
  - Role assignment during registration
  - Role-based access patterns
  - JWT role claim
```

### bkend-data Skill Tests (2)

#### G-11: CRUD Operations [P0]

```
[PROMPT] /bkend-data 데이터 CRUD 방법
[EXPECT]
  - Create: POST /api/v1/tables/{table}/data
  - Read: GET /api/v1/tables/{table}/data
  - Update: PUT /api/v1/tables/{table}/data/{id}
  - Delete: DELETE /api/v1/tables/{table}/data/{id}
  - 10 query operators listed
```

#### G-12: Column Types [P1]

```
[PROMPT] /bkend-data 컬럼 타입 종류
[EXPECT]
  - 7 column types accurately listed
  - Validation rules per type
  - Default values and constraints
```

### bkend-storage Skill Tests (2)

#### G-13: File Upload Flow [P0]

```
[PROMPT] /bkend-storage 파일 업로드 방법
[EXPECT]
  - Presigned URL workflow (3 steps)
  - Size limits mentioned
  - Supported file types
```

#### G-14: Visibility Levels [P1]

```
[PROMPT] /bkend-storage 파일 접근 권한
[EXPECT]
  - 4 levels: private, public, authenticated, custom
  - CDN integration for public files
```

### bkend-mcp Skill Tests (2)

#### G-15: MCP Tool Categories [P0]

```
[PROMPT] /bkend-mcp MCP 도구 카테고리
[EXPECT]
  - Fixed Tools (3): get_api_spec, get_doc, list_mcp_tools
  - Project Tools (6): list/create/get/update/delete/import
  - Table Tools (9): schema management
  - Data CRUD (5): create/read/update/delete/query
  - Env Tools (3): environment management
  - Schema Tools (2): schema operations
```

#### G-16: MCP Configuration [P1]

```
[PROMPT] /bkend-mcp Gemini CLI에서 MCP 설정
[EXPECT]
  - settings.json MCP configuration example
  - Server URL: https://api.bkend.ai/mcp
  - Authentication header setup
```

### bkend-security Skill Tests (2)

#### G-17: RLS Policy Configuration [P0]

```
[PROMPT] /bkend-security RLS 설정 방법
[EXPECT]
  - 4 roles explained with access patterns
  - Per-table, per-operation configuration
  - Console navigation instructions
  - Filter injection mechanism
```

#### G-18: Encryption Standards [P1]

```
[PROMPT] /bkend-security 암호화 방식
[EXPECT]
  - Passwords: Argon2id (64 MiB, 3 iterations, 4 threads)
  - Data at rest: AES-256-GCM
  - Data in transit: TLS 1.2+
  - API keys: SHA-256 one-way hash
```

### bkend-cookbook & bkend-guides Tests (2)

#### G-19: Cookbook Project List [P1]

```
[PROMPT] /bkend-cookbook 프로젝트 목록
[EXPECT]
  - 4 tutorials: blog, recipe-app, shopping-mall, social-network
  - 5 example apps referenced
  - Step-by-step structure for each
```

#### G-20: Troubleshooting Guide [P1]

```
[PROMPT] /bkend-guides API 에러 해결
[EXPECT]
  - Common error codes and solutions
  - Debugging steps
  - FAQ entries
  - Migration guide references
```

---

## 11. TC-H: Philosophy & User Experience (16 tests)

Directly tests the 3 philosophies and 4-stage user journey from `core-mission.md`.

### Philosophy 1: Automation First (5)

#### H-01: Zero-Configuration Start [P0]

```
[PROMPT] (Start gemini in a new project directory)
[EXPECT]
  - No manual configuration needed
  - Level auto-detected
  - Hook system self-configures
  - Context loaded automatically
  - "Enable all developers to naturally adopt document-driven development
     without knowing commands" (core mission)
```

#### H-02: PDCA Auto-Apply [P0]

```
[PROMPT] 로그인 기능 만들어줘
[EXPECT]
  - Task size estimated automatically
  - PDCA auto-apply rules triggered:
    - quick_fix (< 10 lines): Direct fix
    - minor_change (< 50): Lightweight PDCA
    - feature (< 200): Standard PDCA
    - major_feature (>= 200): Full PDCA with team
  - Appropriate level of process applied without user deciding
```

#### H-03: Phase Auto-Transition [P0]

```
[VERIFY] Phases transition automatically:
  - Plan phase → Design (when plan doc complete)
  - Design phase → Do (when first code written)
  - Do phase → Check (when gap analysis requested)
  - Check phase → Act (when iteration starts or report generated)
  - No manual phase management needed
```

#### H-04: Agent Auto-Routing [P0]

```
[PROMPT] 보안 검토해줘
[EXPECT]
  - Automatically routes to security-architect or code-analyzer
  - No need to specify agent name
  - Intent detection handles routing
```

#### H-05: Feature Usage Report Auto-Generation [P1]

```
[VERIFY] Every response includes:
  - Feature Usage Report section at the end
  - Used features listed
  - Unused features with reasons
  - Recommended next features
```

### Philosophy 2: No Guessing (5)

#### H-06: Ambiguous Request Clarification [P0]

```
[PROMPT] 앱 만들어줘
[EXPECT]
  - Does NOT start coding immediately
  - Asks clarifying questions:
    - What type? (web, mobile, desktop)
    - What level? (Starter, Dynamic, Enterprise)
    - What features?
  - No assumptions made about undefined requirements
```

#### H-07: Design-First Enforcement [P0]

```
[PROMPT] (New feature without plan/design) 바로 코딩해줘
[EXPECT]
  - Suggests creating plan/design first
  - References Docs = Code principle
  - Does not guess at requirements
  - Offers to help create plan document
```

#### H-08: Verified Information Only [P0]

```
[PROMPT] bkend.ai는 GraphQL 지원해?
[EXPECT]
  - Answers based on verified documentation only
  - GraphQL NOT supported by bkend.ai
  - References specific bkend-docs source
  - Does not speculate about unconfirmed features
```

#### H-09: Error Handling - Not Found [P1]

```
[PROMPT] /pdca analyze non-existent-feature
[EXPECT]
  - Clear error: feature not found
  - Lists available features
  - Suggests creating the feature first
  - Does NOT pretend to analyze something that doesn't exist
```

#### H-10: Confidence Communication [P1]

```
[PROMPT] bkend.ai 가격 정책이 어떻게 돼?
[EXPECT]
  - If pricing info not in skills: clearly states uncertainty
  - Does not make up pricing information
  - Suggests checking bkend.ai official website
  - Transparent about knowledge boundaries
```

### Philosophy 3: Docs = Code (3)

#### H-11: Plan Document as Spec [P0]

```
[VERIFY] After creating a plan document:
  - Implementation references plan doc
  - Changes to plan doc affect implementation behavior
  - Plan document is the single source of truth
  - No deviation from plan without updating the document
```

#### H-12: Design Document Controls Implementation [P0]

```
[VERIFY] During implementation:
  - Every file created matches design spec
  - File paths follow design document exactly
  - Content requirements from design are fulfilled
  - Gap analysis compares against design (not assumptions)
```

#### H-13: Templates Drive Consistency [P1]

```
[VERIFY] All PDCA documents:
  - Follow template structure from bkit-templates
  - Consistent sections across all features
  - Templates are the documentation standard
  - Changing template changes all future documents
```

### User Journey (3)

#### H-14: Stage 1 - Session Start [P0]

```
[PROMPT] (Fresh session in new project)
[EXPECT]
  - Level detection runs
  - Previous session context loaded (if exists)
  - Welcome/onboarding appropriate to user
  - Output style applied
```

#### H-15: Stage 2 - Level Detection [P0]

```
[VERIFY] Level detection accuracy:
  - Empty dir → Starter
  - package.json + next → Dynamic
  - kubernetes/ + terraform/ → Enterprise
  - Previous session level → Preserved
```

#### H-16: Stage 3 & 4 - PDCA Auto-Apply & Continuous Improvement [P0]

```
[VERIFY] Complete flow:
  - Feature request → Auto-classify task size
  - Appropriate PDCA level applied
  - Gap analysis → Match rate calculated
  - < 90% → Auto-iteration suggested
  - >= 90% → Report suggested
  - Completed → Next feature ready
```

---

## 12. TC-I: Multi-Language Triggers (10 tests)

Tests 8-language trigger detection for agents and skills.

#### I-01: Korean (한국어) [P0]

```
[PROMPT] 검증해줘
[EXPECT] gap-detector agent triggered

[PROMPT] 보안 점검해줘
[EXPECT] security-related agent/skill triggered
```

#### I-02: English [P0]

```
[PROMPT] verify the implementation
[EXPECT] gap-detector agent triggered

[PROMPT] analyze code quality
[EXPECT] code-analyzer agent triggered
```

#### I-03: Japanese (日本語) [P1]

```
[PROMPT] 確認して
[EXPECT] gap-detector agent triggered

[PROMPT] セキュリティチェックして
[EXPECT] security-related agent/skill triggered
```

#### I-04: Chinese (中文) [P1]

```
[PROMPT] 验证一下
[EXPECT] gap-detector agent triggered

[PROMPT] 分析代码质量
[EXPECT] code-analyzer agent triggered
```

#### I-05: Spanish (Español) [P1]

```
[PROMPT] verificar la implementación
[EXPECT] gap-detector agent triggered
```

#### I-06: French (Français) [P1]

```
[PROMPT] vérifier l'implémentation
[EXPECT] gap-detector agent triggered
```

#### I-07: German (Deutsch) [P1]

```
[PROMPT] prüfen Sie die Implementierung
[EXPECT] gap-detector agent triggered
```

#### I-08: Italian (Italiano) [P1]

```
[PROMPT] verificare l'implementazione
[EXPECT] gap-detector agent triggered
```

#### I-09: Mixed Language Triggers [P1]

```
[PROMPT] bkend.ai 로그인 기능 implement해줘
[EXPECT]
  - Mixed Korean + English detected
  - bkend-auth skill and bkend-expert agent triggered
  - Response language matches primary language (Korean)
```

#### I-10: Language-Specific Content [P0]

```
[VERIFY] For ALL bkend-* skills:
  - Trigger descriptions contain 8 languages
  - Actual content (body) is in English
  - Only trigger matching uses multilingual keywords
```

---

## 13. TC-J: Edge Cases & Error Handling (8 tests)

### J-01: Invalid Command [P2]

```
[PROMPT] /nonexistent-command
[EXPECT] Helpful error message, list of valid commands
```

### J-02: Invalid PDCA Action [P2]

```
[PROMPT] /pdca invalid-action
[EXPECT] Error message listing valid actions (plan, design, do, analyze, iterate, report, status, next)
```

### J-03: Circular Agent Delegation [P2]

```
[VERIFY] No circular delegation possible:
  - Agent A delegates to Agent B
  - Agent B should not delegate back to Agent A
  - Skill orchestrator prevents loops
```

### J-04: Missing Design Document for Gap Analysis [P2]

```
[SETUP] Feature in "do" phase but no design doc exists
[PROMPT] /pdca analyze my-feature
[EXPECT]
  - Clear error: design document not found
  - Suggests creating design first
  - Does not proceed with partial analysis
```

### J-05: Concurrent Feature Management [P2]

```
[SETUP] Two active features in different phases
[PROMPT] /pdca status
[EXPECT]
  - Both features listed
  - Each with independent phase and matchRate
  - primaryFeature correctly set
```

### J-06: Large Skill Content Handling [P2]

```
[VERIFY] bkend-auth skill (1,688 lines - largest):
  - Loads without truncation
  - Content fully accessible
  - No context overflow
```

### J-07: Empty Project Recovery [P2]

```
[SETUP] Delete all docs/ directory
[PROMPT] /pdca status
[EXPECT]
  - Handles missing status file gracefully
  - Creates fresh status or reports empty state
  - Does not crash
```

### J-08: Version Consistency [P0]

```
[VERIFY] Version "1.5.2" consistent across:
  - gemini-extension.json: version field
  - bkit.config.json: version field
  - GEMINI.md: version reference
  - CHANGELOG.md: latest entry
  - lib/core/config.js: exported version
  - All should return "1.5.2"
```

---

## 14. Test Execution Plan

### Phase 1: Smoke Test (30 min)
Run P0 tests from each category to verify basic functionality:
- A-01, A-05, A-07 (Session)
- B-01, B-04, B-05, B-14 (Skills)
- C-10, C-14, C-15 (Agents)
- D-01, D-02, D-11 (Commands)
- E-01, E-10, E-15 (PDCA)
- F-02, F-08, F-09 (Context)
- G-01, G-02, G-03, G-04, G-05 (bkend Accuracy)
- H-01, H-06, H-07 (Philosophy)
- I-01, I-02 (Language)
- J-08 (Version)
Total: ~30 tests

### Phase 2: Feature Complete (2 hrs)
Run all P0 and P1 tests:
- All P0 tests from Phase 1
- P1 tests across all categories
Total: ~120 tests

### Phase 3: Full Coverage (3 hrs)
Run all 156 tests including P2 edge cases.

### Phase 4: Regression (1 hr)
Re-run failed tests after fixes.

---

## 15. Success Criteria

| Metric | Target |
|--------|--------|
| P0 Test Pass Rate | 100% |
| P1 Test Pass Rate | >= 95% |
| P2 Test Pass Rate | >= 90% |
| Overall Pass Rate | >= 95% |
| v1.5.2 Feature Coverage | 100% |
| Philosophy Alignment | All 3 verified |
| Language Triggers (8) | All working |
| PDCA Full Cycle | Complete E2E |

---

## 16. Test Result Template

Use this template to record each test result:

```markdown
### [Test ID]: [Test Name]
- **Status**: PASS / FAIL / SKIP
- **Priority**: P0 / P1 / P2
- **Execution Time**: HH:MM
- **Actual Result**: (What actually happened)
- **Expected Result**: (What was expected)
- **Gap**: (If FAIL, describe the difference)
- **Screenshot/Log**: (Optional reference)
```

---

## 17. Traceability Matrix

| Philosophy | Test Coverage |
|------------|---------------|
| Automation First | A-01~A-12, D-01~D-18, E-01~E-16, H-01~H-05 |
| No Guessing | C-01~C-18, F-08~F-09, H-06~H-10, I-01~I-10 |
| Docs = Code | B-01~B-18, E-01~E-16, F-01~F-07, H-11~H-13 |

| AI-Native Competency | Test Coverage |
|----------------------|---------------|
| Verification Ability | C-10, C-11, E-10~E-13, H-08 |
| Direction Setting | C-01, C-02, E-01~E-06, H-02, H-14~H-16 |
| Quality Standards | C-07~C-09, C-12, E-14~E-16, H-05 |

| Context Engineering FR | Test Coverage |
|------------------------|---------------|
| FR-01: Multi-Level Hierarchy | F-01~F-03 |
| FR-02: @import Directive | F-04~F-05 |
| FR-03: Context Fork | F-06~F-07 |
| FR-04: UserPromptSubmit Hook | F-08~F-09 |
| FR-05: Permission Hierarchy | F-10, A-07 |
| FR-06: Task Dependency Chain | F-11 |
| FR-07: Context Compaction Hook | F-12, A-10 |
| FR-08: MEMORY Variable | F-13~F-14 |

---

*Generated by bkit PDCA Plan Phase*
