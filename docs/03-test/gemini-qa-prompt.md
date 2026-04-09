# bkit-gemini v2.0.4 — Gemini CLI QA Test Prompt

> 이 프롬프트를 `gemini -p` 또는 gemini 인터랙티브 모드에서 실행하여
> bkit의 모든 기능을 체계적으로 테스트합니다.

## 사용법

```bash
# 방법 1: 파일에서 프롬프트 로드
gemini -p "$(cat docs/03-test/gemini-qa-prompt.md)" --yolo

# 방법 2: 인터랙티브 모드에서 복사-붙여넣기
gemini
# 그 후 아래 프롬프트를 붙여넣기
```

---

## QA 프롬프트

아래를 복사하여 gemini에 입력하세요:

```
You are running a comprehensive QA test of the bkit extension (v2.0.4).
Test ALL features systematically. For each test, show:
- Test ID and name
- What you're testing
- Result: PASS or FAIL (with reason)

Execute ALL tests below in order. Do NOT skip any test.
Use --yolo mode tools freely. After all tests, show a summary table.

═══════════════════════════════════════════════════
PHASE 1: EXTENSION & SESSION (5 tests)
═══════════════════════════════════════════════════

TEST-01: Extension Loading
- Run: Check if bkit extension is loaded in this session
- Verify: bkit v2.0.4 context is available, GEMINI.md rules are applied
- Pass: bkit version 2.0.4 confirmed

TEST-02: PDCA Status
- Run: /pdca status
- Verify: Current PDCA status is displayed (phase, feature, or "no active feature")
- Pass: Status output shown without error

TEST-03: Skill Inventory
- Run: List all available skills by reading the skills/ directory
- Verify: Count skill directories that have SKILL.md or skill.md
- Pass: 43 skills found (report exact count)

TEST-04: Agent Inventory
- Run: Read agents/ directory and count .md files
- Also use list_agents MCP tool if available
- Verify: 21 agents found
- Pass: Agent count matches

TEST-05: MCP Server Tools
- Run: List all available MCP tools from bkit server
- Verify: spawn_agent, bkit_pm_run, bkit_qa_run, bkit_iterate, bkit_audit_query, bkit_checkpoint are available
- Pass: At least 6 bkit tools confirmed

═══════════════════════════════════════════════════
PHASE 2: PDCA FULL WORKFLOW (10 tests)
This is the core test — runs a complete PDCA cycle
Feature name: "qa-test-login"
═══════════════════════════════════════════════════

TEST-06: PM Analysis (PRD Generation)
- Run: Use bkit_pm_run tool OR spawn_agent pm-lead to analyze feature "qa-test-login"
  Description: "User login and registration system with email/password and social login"
- Verify: PRD document created at docs/00-pm/qa-test-login.prd.md
  OR pm-lead provides a structured analysis
- Pass: Analysis output with sections (Problem, Users, Value Proposition)

TEST-07: Plan-Plus (Enhanced Planning)
- Run: /plan-plus qa-test-login
  Use the PRD from TEST-06 as context if available.
  Create a plan document with:
  - Executive Summary (4-perspective table)
  - Context Anchor (WHY/WHO/RISK/SUCCESS/SCOPE)
  - Requirements, Success Criteria, Risk Assessment
  - 3 implementation options comparison
- Verify: docs/01-plan/features/qa-test-login.plan.md created
- Pass: File exists with Context Anchor section

TEST-08: Design Document
- Run: /pdca design qa-test-login
  Read the plan document first. Then:
  - Embed Context Anchor from Plan
  - Generate 3 Architecture Options (A: Minimal, B: Clean, C: Pragmatic)
  - Show comparison table
  - Select Option C (Pragmatic) and generate design
- Verify: docs/02-design/features/qa-test-login.design.md created
- Pass: File exists with Context Anchor + Architecture Options

TEST-09: Context Anchor Propagation Check
- Run: Read both plan and design documents
- Verify: Design document contains the SAME Context Anchor table from Plan
- Pass: WHY/WHO/RISK/SUCCESS/SCOPE values match between documents

TEST-10: Do Phase — Implementation Guide
- Run: /pdca do qa-test-login
  Read Plan + Design documents fully. Then:
  - Display Decision Record Chain (PRD→Plan→Design decisions)
  - Display Context Anchor
  - Show implementation scope (files to create/modify)
  - Generate implementation guide
  DO NOT actually implement code — just show the guide
- Verify: Decision Record Chain and implementation guide displayed
- Pass: Guide includes file list and implementation order

TEST-11: Gap Analysis (Check Phase)
- Run: /pdca analyze qa-test-login
  Compare design document vs actual implementation (there should be gaps since we didn't implement)
  Use bkit_iterate tool if available
- Verify: Match rate calculated and gaps identified
- Pass: Match rate percentage shown (expected < 90% since not implemented)

TEST-12: Iterate Phase
- Run: /pdca iterate qa-test-login
  Since this is a test, just verify the iterate mechanism works:
  - bkit_iterate tool called (or pdca-iterator agent spawned)
  - Gaps from TEST-11 referenced
  - Iteration count tracked
- Verify: Iteration attempt recorded
- Pass: Iterator response received (even if no fixes possible)

TEST-13: QA Phase
- Run: /pdca qa qa-test-login
  Use bkit_qa_run tool if available. Run whatever tests are possible:
  - L1: Check if test files exist (they won't — that's OK)
  - L2: Check if server is running (it won't — that's OK)
  - Report results honestly
- Verify: QA report generated with pass/fail/skip status
- Pass: QA output shows test levels and results

TEST-14: Report Generation
- Run: /pdca report qa-test-login
  Generate completion report covering the full journey:
  - Read PRD, Plan, Design, Analysis documents
  - Include Decision Record summary
  - Include Success Criteria status
  - Include Executive Summary with Value Delivered
- Verify: docs/04-report/qa-test-login.report.md created (or equivalent report output)
- Pass: Report contains Executive Summary and journey narrative

TEST-15: PDCA Phase Progression Verification
- Run: /pdca status
- Verify: Feature "qa-test-login" status shows progression through phases
- Pass: Phase history visible

═══════════════════════════════════════════════════
PHASE 3: TEAM ORCHESTRATION (5 tests)
═══════════════════════════════════════════════════

TEST-16: CTO Lead Agent
- Run: Use spawn_agent to call cto-lead
  Ask: "Briefly describe your role and what MCP tools you can use for team orchestration."
- Verify: CTO lead responds with team capabilities
- Pass: Mentions bkit_team_run or team orchestration

TEST-17: PM Team Run
- Run: Use bkit_team_run tool (or bkit_pm_run) with team="pm", feature="qa-test-team"
- Verify: PM team workflow executes (even if sequential)
- Pass: PM analysis results returned

TEST-18: QA Team
- Run: Use spawn_agent to call qa-monitor
  Ask: "Describe the QA workflow and what test levels you support."
  Also try: Use bkit_qa_run tool with feature="qa-test-team"
- Verify: QA capabilities described, L1-L5 levels mentioned
- Pass: QA workflow response received

TEST-19: Team Status
- Run: Use team_status MCP tool (or bkit_team_run with action status)
- Verify: Team status information returned
- Pass: Status response received (even if empty)

TEST-20: Agent Spawn — Multiple Agents
- Run: Sequentially spawn 3 agents and collect responses:
  1. spawn_agent code-analyzer — "Briefly analyze mcp/bkit-server.js quality"
  2. spawn_agent security-architect — "List top 3 security concerns for an MCP server"
  3. spawn_agent gap-detector — "What is your primary function?"
- Verify: All 3 agents respond correctly
- Pass: 3 distinct responses received

═══════════════════════════════════════════════════
PHASE 4: v2.0.4 NEW FEATURES (8 tests)
═══════════════════════════════════════════════════

TEST-21: Audit Trail
- Run: /audit log — Show recent audit entries
  Check if .gemini/audit/ or .bkit/audit/ directory has .jsonl files
  Read the most recent file and display entries
- Verify: Audit entries from this session exist
- Pass: At least 1 audit entry shown with timestamp and tool name

TEST-22: Audit Search
- Run: Use bkit_audit_query tool to search for "read_file" events
- Verify: Filtered results returned
- Pass: Search results shown

TEST-23: BTW Suggestion
- Run: /btw "The MCP server could benefit from health check endpoint"
  Then: /btw list
- Verify: Suggestion stored and retrievable
- Pass: Suggestion appears in list

TEST-24: Control Status
- Run: /control status
  Show current automation level (L0/L1/L2) and feature flags
- Verify: Level and flags displayed
- Pass: Automation level shown

TEST-25: Checkpoint Create
- Run: Use bkit_checkpoint tool with action="create", feature="qa-test-login", label="QA test checkpoint"
- Verify: Checkpoint created in .bkit/checkpoints/
- Pass: Checkpoint ID returned

TEST-26: Checkpoint List
- Run: Use bkit_checkpoint tool with action="list", feature="qa-test-login"
- Verify: Checkpoint from TEST-25 visible
- Pass: At least 1 checkpoint listed

TEST-27: Deploy Guide
- Run: /deploy — Show deployment guidance
- Verify: Level-appropriate deployment checklist shown
- Pass: Deployment steps listed

TEST-28: Skill Create
- Run: /skill-create test-skill-qa — Start skill creation workflow
  (Don't actually create, just verify the guidance works)
- Verify: Skill creation guide shown with template
- Pass: SKILL.md template structure displayed

═══════════════════════════════════════════════════
PHASE 5: HOOKS & SECURITY (5 tests)
═══════════════════════════════════════════════════

TEST-29: Dangerous Command Block
- Run: Try to execute shell command: echo "test" && rm -rf /tmp/fake-dir-that-does-not-exist
  (This should trigger before-tool.js guardrail)
- Verify: Warning or block message from bkit hook
- Pass: Hook intervenes (warning or block)

TEST-30: Plan Phase Read-Only
- Note: If current PDCA phase is "plan", write operations should be warned
- Run: Check if before-tool.js warns about writes during plan phase
- Verify: Phase-aware tool filtering works
- Pass: Awareness of current phase demonstrated

TEST-31: Intent Detection — Korean
- Run: "코드 리뷰해줘" (Korean for "review the code")
- Verify: before-agent.js detects code-review intent
- Pass: Code review action triggered or suggested

TEST-32: Intent Detection — Japanese
- Run: "設計を検証してください" (Japanese for "validate the design")
- Verify: Design validation intent detected
- Pass: design-validator or gap-detector triggered

TEST-33: Security — Environment File
- Run: Try to read .env file (if exists) or ask about environment variables
- Verify: before-tool.js warns about sensitive file access
- Pass: Security awareness demonstrated

═══════════════════════════════════════════════════
PHASE 6: EXISTING FEATURES (5 tests)
═══════════════════════════════════════════════════

TEST-34: Development Pipeline
- Run: /development-pipeline — Show the 9-phase pipeline
- Verify: All 9 phases listed (Schema → Convention → Mockup → API → Design System → UI → SEO/Security → Review → Deployment)
- Pass: 9 phases visible

TEST-35: Code Review
- Run: /code-review — Review mcp/tools/gap-analyzer.js
- Verify: Code quality feedback provided
- Pass: Review comments returned

TEST-36: Plan-Plus Features
- Run: Read skills/plan-plus/skill.md and verify it supports:
  - Intent discovery
  - Alternatives exploration
  - YAGNI review
- Pass: All 3 features mentioned in skill definition

TEST-37: Output Style
- Run: Check current output style and available styles
  Read output-styles/ directory
- Verify: 4 styles available (bkit-learning, bkit-pdca-guide, bkit-enterprise, bkit-pdca-enterprise)
- Pass: Style names confirmed

TEST-38: Level Detection
- Run: Detect project level for this codebase
  Check: Does it have kubernetes/ terraform/ (Enterprise)?
  Does it have docker-compose.yml or bkend config (Dynamic)?
  Or default (Starter)?
- Verify: Level detected based on directory structure
- Pass: Level determination explained

═══════════════════════════════════════════════════
FINAL: TEST SUMMARY
═══════════════════════════════════════════════════

After completing ALL 38 tests, create a summary table:

| Test ID | Name | Result | Notes |
|---------|------|--------|-------|
| TEST-01 | Extension Loading | PASS/FAIL | ... |
| TEST-02 | PDCA Status | PASS/FAIL | ... |
| ... | ... | ... | ... |
| TEST-38 | Level Detection | PASS/FAIL | ... |

Final counts:
- Total: 38
- PASS: X
- FAIL: Y
- SKIP: Z

List any FAIL tests with root cause analysis.

═══════════════════════════════════════════════════
CLEANUP
═══════════════════════════════════════════════════

After reporting results, clean up test artifacts:
- Delete docs/00-pm/qa-test-login.prd.md (if created)
- Delete docs/01-plan/features/qa-test-login.plan.md (if created)
- Delete docs/02-design/features/qa-test-login.design.md (if created)
- Delete docs/03-analysis/qa-test-login.analysis.md (if created)
- Delete docs/04-report/qa-test-login.report.md (if created)
- Delete .bkit/checkpoints/qa-test-login/ (if created)
- Delete .bkit/btw.json (if created)
- Do NOT delete audit logs
```
