# bkit-gemini Interactive Test Guide for Gemini CLI

> **Version**: 1.5.0
> **Purpose**: Step-by-step interactive test cases to execute in Gemini CLI
> **Total Test Cases**: 144

---

## Quick Start

```bash
# 1. Navigate to test project
cd /tmp/bkit-test-project

# 2. Start Gemini CLI
gemini

# 3. Follow the test cases below
```

---

## Test Category Index

| Category | Tests | Command Section |
|----------|-------|-----------------|
| Philosophy Alignment | PHIL-01~03 | Section 1 |
| Context Engineering | FR-01~08 | Section 2 |
| Commands TOML | CMD-01~13 | Section 3 |
| Skills | SKILL-01~21 | Section 4 |
| Agents | AGENT-01~11 | Section 5 |
| Hooks | HOOK-01~08 | Section 6 |
| Integration | INT-01~05 | Section 7 |
| Regression | REG-01~08 | Section 8 |

---

## Section 1: Philosophy Alignment Tests (PHIL-*)

### PHIL-01: Automation First Tests

#### Test PHIL-01-01: Session Start Welcome
```
# In Gemini CLI, type:
Hello, I'm new here

# Expected: Welcome message with bkit version and project level detection
# Pass if: Message includes "bkit" or "PDCA" or level detection
```

#### Test PHIL-01-02: Feature Request Without Plan
```
# Prerequisites:
rm -rf docs/01-plan/features/

# In Gemini CLI:
Add user authentication feature

# Expected: System suggests creating plan document first
# Pass if: Response mentions "plan" or suggests "/pdca plan"
```

#### Test PHIL-01-03: Implementation Without Design
```
# Prerequisites:
mkdir -p docs/01-plan/features
echo "# Login Plan" > docs/01-plan/features/login-form.plan.md

# In Gemini CLI:
Implement the login form

# Expected: System warns about missing design document
# Pass if: Response mentions "design" document or suggests creating one
```

#### Test PHIL-01-04: Post-Implementation Gap Analysis Suggestion
```
# Prerequisites:
echo "# Design" > docs/02-design/features/test-feature.design.md
echo "// Code" > src/features/test-feature.js
cat > .pdca-status.json << 'EOF'
{"version":"2.0","activeFeatures":{"test-feature":{"phase":"do"}}}
EOF

# In Gemini CLI:
I finished implementing the test-feature

# Expected: System suggests gap analysis
# Pass if: Response mentions "gap analysis" or "/pdca analyze"
```

### PHIL-02: No Guessing Tests

#### Test PHIL-02-01: Ambiguous Request Detection
```
# In Gemini CLI:
Improve the app

# Expected: Clarifying questions with options
# Pass if: AskUserQuestion-style options presented
```

#### Test PHIL-02-02: Magic Word Bypass
```
# In Gemini CLI:
!hotfix Fix the button in src/buggy.js

# Expected: Immediate action without questions
# Pass if: No clarifying questions, direct action
```

### PHIL-03: Docs = Code Tests

#### Test PHIL-03-01: Create Plan Document
```
# In Gemini CLI:
/pdca plan user-auth

# Expected: Plan document created at docs/01-plan/features/user-auth.plan.md
# Verify: ls docs/01-plan/features/user-auth.plan.md
# Pass if: File exists with proper sections
```

#### Test PHIL-03-02: Create Design Document
```
# In Gemini CLI:
/pdca design user-auth

# Expected: Design document created
# Verify: ls docs/02-design/features/user-auth.design.md
# Pass if: File exists and references plan
```

---

## Section 2: Context Engineering Tests (FR-*)

### FR-01: Multi-Level Context Hierarchy
```
# In Gemini CLI:
Show current project configuration

# Expected: Displays hierarchy - Plugin > Project > Feature levels
# Pass if: Configuration from gemini-extension.json shown
```

### FR-02: @import Directive
```
# Create test files:
echo "Imported content" > docs/included.md

# In Gemini CLI:
What's in @docs/included.md?

# Expected: Content from included.md displayed
# Pass if: "Imported content" shown
```

### FR-03: Context Fork Isolation
```
# In Gemini CLI:
Analyze this code in isolation: function test() { return 1; }

# Expected: Fork context used for analysis
# Pass if: Analysis provided without affecting main context
```

### FR-04: BeforeAgent Hook
```
# In Gemini CLI - trigger an agent:
/pdca analyze test-feature

# Expected: BeforeAgent hook logs intent detection
# Pass if: Intent logged before agent execution
```

### FR-05: Permission Hierarchy
```
# In Gemini CLI:
What permissions do I have?

# Expected: Lists current permission level (plugin/project/feature)
# Pass if: Permission structure explained
```

### FR-06: Task Dependency Chain
```
# In Gemini CLI:
/pdca plan new-feature
/pdca design new-feature

# Expected: Design task blocked by Plan task completion
# Pass if: Proper task dependency shown
```

### FR-07: Context Compaction
```
# In Gemini CLI (long session):
# ... many commands ...

# Expected: Context compaction when approaching limit
# Pass if: Snapshot saved to docs/.pdca-snapshots/
```

### FR-08: Structured Memory Storage
```
# In Gemini CLI:
Remember that the user prefers TypeScript

# Expected: Stored in .bkit-memory.json
# Verify: cat .bkit-memory.json
# Pass if: Preference stored
```

---

## Section 3: Commands TOML Tests (CMD-*)

### CMD-01~03: Format Validation
```bash
# Run in terminal (not Gemini):
cd /path/to/bkit-gemini
./tests/run-all-tests.sh

# Or manually check:
ls commands/*.toml
# Expected: 10 TOML files
```

### CMD-04: /pdca Command Recognition
```
# In Gemini CLI:
/pdca status

# Expected: PDCA status displayed
# Pass if: Current phase and status shown
```

### CMD-05: /starter Command Recognition
```
# In Gemini CLI:
/starter help

# Expected: Starter skill activated
# Pass if: Starter guide information displayed
```

### CMD-06: /dynamic Command Recognition
```
# In Gemini CLI:
/dynamic help

# Expected: Dynamic skill activated
# Pass if: Dynamic/fullstack guide displayed
```

### CMD-07: /enterprise Command Recognition
```
# In Gemini CLI:
/enterprise help

# Expected: Enterprise skill activated
# Pass if: Enterprise/microservices guide displayed
```

### CMD-08: /pipeline Command Recognition
```
# In Gemini CLI:
/pipeline status

# Expected: Pipeline status shown
# Pass if: 9-phase pipeline info displayed
```

### CMD-09: /review Command Recognition
```
# In Gemini CLI:
/review src/

# Expected: Code review skill activated
# Pass if: Review analysis started
```

### CMD-10: /qa Command Recognition
```
# In Gemini CLI:
/qa

# Expected: Zero Script QA skill activated
# Pass if: QA guide displayed
```

### CMD-11: /learn Command Recognition
```
# In Gemini CLI:
/learn

# Expected: Gemini CLI learning skill activated
# Pass if: Learning topics displayed
```

### CMD-12: /bkit Command Recognition
```
# In Gemini CLI:
/bkit

# Expected: bkit help menu displayed
# Pass if: All available commands listed
```

### CMD-13: /github-stats Command Recognition
```
# In Gemini CLI:
/github-stats

# Expected: GitHub stats collection initiated
# Pass if: gh commands executed or stats displayed
```

---

## Section 4: Skills Tests (SKILL-*)

### SKILL-01: pdca skill
```
# In Gemini CLI:
I want to start a new PDCA cycle for user-management

# Expected: pdca skill auto-triggered
# Pass if: Plan creation suggested
```

### SKILL-02: starter skill
```
# In Gemini CLI:
I want to create a simple portfolio website

# Expected: starter skill triggered (keywords: simple, portfolio)
# Pass if: Starter project guide provided
```

### SKILL-03: dynamic skill
```
# In Gemini CLI:
I need to add user login and database

# Expected: dynamic skill triggered (keywords: login, database)
# Pass if: Dynamic/fullstack guide provided
```

### SKILL-04: enterprise skill
```
# In Gemini CLI:
Set up microservices architecture with Kubernetes

# Expected: enterprise skill triggered
# Pass if: Enterprise guide provided
```

### SKILL-05: development-pipeline skill
```
# In Gemini CLI:
What phase should I start with?

# Expected: development-pipeline skill triggered
# Pass if: 9-phase pipeline explained
```

### SKILL-06~21: Remaining Skills
```
# Test each skill by using its trigger keywords from SKILL.md description
# Skills: code-review, zero-script-qa, gemini-cli-learning, bkit-rules,
#         bkit-templates, mobile-app, desktop-app, phase-1~9
```

---

## Section 5: Agents Tests (AGENT-*)

### AGENT-01: gap-detector
```
# In Gemini CLI:
Verify my implementation matches the design

# Expected: gap-detector agent invoked
# Pass if: Gap analysis performed
```

### AGENT-02: pdca-iterator
```
# In Gemini CLI:
Auto-fix the implementation gaps

# Expected: pdca-iterator agent invoked
# Pass if: Code improvements applied
```

### AGENT-03: report-generator
```
# In Gemini CLI:
Generate a completion report for user-auth

# Expected: report-generator agent invoked
# Pass if: Report document created
```

### AGENT-04: starter-guide
```
# In Gemini CLI:
I'm a beginner, help me understand web development

# Expected: starter-guide agent invoked
# Pass if: Beginner-friendly guidance provided
```

### AGENT-05~11: Remaining Agents
```
# Test: code-analyzer, design-validator, qa-monitor, pipeline-guide,
#       bkend-expert, enterprise-expert, infra-architect
# Use their trigger keywords from agent .md descriptions
```

---

## Section 6: Hooks Tests (HOOK-*)

### HOOK-01: SessionStart Hook
```
# Start new Gemini CLI session:
gemini

# Expected: Welcome message on startup
# Pass if: bkit startup message displayed
```

### HOOK-02: BeforeAgent Hook
```
# In Gemini CLI - trigger agent:
/pdca analyze test

# Expected: Intent detection logged
# Pass if: BeforeAgent hook fires
```

### HOOK-03: BeforeTool Hook
```
# In Gemini CLI - use tool:
Read the file src/index.js

# Expected: Tool usage logged
# Pass if: BeforeTool hook fires
```

### HOOK-04: AfterTool Hook
```
# Continue from above
# Expected: Tool result logged
# Pass if: AfterTool hook fires
```

### HOOK-05~08: Hook Timeout Tests
```
# Verify hooks complete within 5000ms timeout
# Each hook should complete without timeout error
```

---

## Section 7: Integration Tests (INT-*)

### INT-01: Full PDCA Cycle
```
# Complete cycle:
/pdca plan integration-test
/pdca design integration-test
# ... implement ...
/pdca analyze integration-test
/pdca iterate integration-test  # if needed
/pdca report integration-test

# Expected: Complete PDCA cycle successful
# Pass if: All phases complete with >=90% match rate
```

### INT-02: Multi-Language Trigger
```
# Test Korean:
계획 문서 만들어줘

# Test Japanese:
計画を作成してください

# Expected: Same functionality regardless of language
# Pass if: PDCA plan created
```

### INT-03: Level Detection
```
# Test Starter detection:
cd /tmp/simple-site && gemini
# Expected: Starter level detected

# Test Dynamic detection (with .mcp.json):
cd /tmp/fullstack-app && gemini
# Expected: Dynamic level detected

# Test Enterprise detection (with kubernetes/):
cd /tmp/enterprise && gemini
# Expected: Enterprise level detected
```

### INT-04: Hook Chain
```
# Trigger multiple hooks in sequence
# Expected: Hooks fire in correct order
# Pass if: SessionStart → BeforeAgent → BeforeTool → AfterTool
```

### INT-05: MCP spawn_agent
```
# In Gemini CLI:
Spawn the gap-detector agent

# Expected: MCP server spawns agent
# Pass if: Agent executes successfully
```

---

## Section 8: Regression Tests (REG-*)

### REG-01: Philosophy Alignment Regression
```
# Verify all PHIL-* tests still pass after changes
```

### REG-02: Breaking Change Detection
```
# Verify no breaking changes in:
# - Command formats
# - Skill triggers
# - Agent invocations
# - Hook behaviors
```

### REG-03~08: Specific Regression Cases
```
# Test previously fixed bugs don't regress
```

---

## Test Execution Summary

After completing all tests, record results:

```bash
# Run automated tests:
./tests/run-all-tests.sh

# Record interactive test results:
echo "PHIL-01-01: [PASS/FAIL]" >> test-results.txt
echo "PHIL-01-02: [PASS/FAIL]" >> test-results.txt
# ... continue for all tests ...
```

---

## Pass/Fail Criteria

| Metric | Target | Actual |
|--------|--------|--------|
| Philosophy Tests | 100% | __% |
| Context Engineering | >= 95% | __% |
| Commands TOML | 100% | __% |
| Skills | >= 90% | __% |
| Agents | >= 90% | __% |
| Hooks | >= 95% | __% |
| Integration | >= 90% | __% |
| Overall | >= 90% | __% |

---

## Reporting

Generate final report:
```
/pdca report bkit-gemini-comprehensive-test
```
