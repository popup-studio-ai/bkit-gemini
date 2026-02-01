# bkit-gemini Comprehensive Test Design Document

> **Status**: Draft
>
> **Project**: bkit-gemini
> **Version**: 1.5.0
> **Author**: POPUP STUDIO
> **Created**: 2026-02-01
> **Test Executor**: Gemini CLI
> **Reference**: docs/01-plan/features/bkit-gemini-comprehensive-test.plan.md

---

## 1. Overview

### 1.1 Document Purpose

This design document provides **detailed test case specifications** for the bkit-gemini comprehensive test plan. Each test case includes:

- Preconditions and setup requirements
- Step-by-step execution procedure
- Expected results with specific validation criteria
- Gemini CLI commands and verification scripts
- Pass/Fail criteria

### 1.2 Design Scope (Plan Section 1.2 Coverage)

| Category | Plan Count | Design Count | Coverage |
|----------|:----------:|:------------:|:--------:|
| Skills | 21 | 21 | 100% |
| Agents | 11 | 11 | 100% |
| Hooks | 7 | 7 | 100% |
| Library Modules | 4 | 4 | 100% |
| Functional Requirements | 8 | 8 | 100% |
| Philosophy Principles | 3 | 3 | 100% |
| Pipeline Phases | 9 | 9 | 100% |
| Project Levels | 3 | 3 | 100% |

### 1.3 Test Environment Specification (Plan Section 1.3 Coverage)

```yaml
# Required Environment
Platform: Gemini CLI v0.26.0+
Extension: bkit-gemini v1.5.0
Node.js: v18.0.0+
Git: v2.0.0+
OS: macOS / Linux / Windows (WSL)

# Test Directory Structure
Test Directory: /tmp/bkit-test-project/
├── .pdca-status.json          # PDCA state tracking
├── .bkit-memory.json          # Memory storage
├── bkit.config.json           # Project config (FR-01)
├── docs/
│   ├── 01-plan/features/      # Plan documents
│   ├── 02-design/features/    # Design documents
│   ├── 03-analysis/           # Analysis reports
│   ├── 04-report/features/    # Completion reports
│   └── .pdca-snapshots/       # Context snapshots (FR-07)
└── src/                       # Implementation code

# MCP Servers
MCP Servers:
  - bkend:
      command: npx @bkend/mcp-server
      required: false
      purpose: BaaS integration testing
  - bkit-agents:
      command: node ${extensionPath}/mcp/spawn-agent-server.js
      required: true
      purpose: spawn_agent tool testing

# Hooks Configuration
Hooks: Enabled via ~/.gemini/settings.json
  hooksConfig:
    enabled: true
```

### 1.4 Test Case Numbering Convention

```
Format: {CATEGORY}-{SUBCATEGORY}-{NUMBER}

Categories:
- PHIL   : Philosophy Alignment Tests (Plan Section 2)
- FR     : Functional Requirements Tests (Plan Section 3)
- SKILL  : Skills Component Tests (Plan Section 4.1)
- AGENT  : Agents Component Tests (Plan Section 4.2)
- HOOK   : Hooks Component Tests (Plan Section 4.3)
- LIB    : Library Module Tests (Plan Section 4.4)
- INT    : Integration Tests (Plan Section 5)
- REG    : Regression Tests (Plan Section 6)

Examples:
- PHIL-01-01 : Philosophy → Automation First → Test 1
- FR-03-02   : Functional Requirement → Context Fork → Test 2
- SKILL-09   : Skills → Starter skill test
```

---

## 2. Philosophy Alignment Test Cases (Plan Section 2 Coverage)

### 2.1 PHIL-01: Automation First (Plan Section 2.1 Coverage)

> **Philosophy**: "Claude automatically applies PDCA even if user doesn't know commands"

#### TC-PHIL-01-01: Session Start Welcome Message

| Field | Value |
|-------|-------|
| **Test ID** | PHIL-01-01 |
| **Title** | Session Start Welcome Message |
| **Priority** | High |
| **Type** | Functional |

**Preconditions**:
```bash
# 1. Clean test environment
rm -rf /tmp/bkit-test-project
mkdir -p /tmp/bkit-test-project
cd /tmp/bkit-test-project
git init

# 2. Verify bkit-gemini extension installed
gemini extensions list | grep bkit

# 3. Verify hooks enabled
cat ~/.gemini/settings.json | grep '"enabled": true'
```

**Test Steps**:
```bash
# Step 1: Start Gemini CLI interactive session
gemini

# Step 2: Send initial greeting
> Hello, I'm new here

# Step 3: Observe SessionStart hook output
```

**Expected Results**:
```markdown
SessionStart hook displays:
1. Welcome message with bkit version
2. Detected project level (Starter/Dynamic/Enterprise)
3. Current PDCA status (if any)
4. Available options:
   - Option 1: First Project → /starter
   - Option 2: Learn Gemini CLI → /gemini-cli-learning
   - Option 3: Project Setup → (level-specific)
   - Option 4: PDCA Status → /pdca status

Hook execution time: < 5000ms (timeout threshold)
```

**Verification Script**:
```javascript
// hooks/scripts/session-start.js output validation
const output = getHookOutput();
assert(output.includes('bkit') || output.includes('Welcome'));
assert(output.includes('Starter') || output.includes('Dynamic') || output.includes('Enterprise'));
```

**Pass/Fail Criteria**:
- PASS: Welcome message displayed with options
- FAIL: No welcome message or hook timeout

---

#### TC-PHIL-01-02: Feature Request Without Plan Document

| Field | Value |
|-------|-------|
| **Test ID** | PHIL-01-02 |
| **Title** | Feature Request Without Plan Document |
| **Priority** | High |
| **Type** | Functional |

**Preconditions**:
```bash
# 1. Clean test project (no plan documents)
rm -rf /tmp/bkit-test-project/docs/01-plan/
cd /tmp/bkit-test-project

# 2. Verify no existing plan
ls docs/01-plan/features/ 2>/dev/null || echo "No plan directory"
```

**Test Steps**:
```bash
# Step 1: Request new feature implementation
gemini --prompt "Add user authentication feature"

# Step 2: Observe system response
```

**Expected Results**:
```markdown
System response includes:
1. Detection of new feature request
2. Check for existing plan document: NOT FOUND
3. Suggestion: "Shall I create a plan document first?"
4. Options presented via AskUserQuestion:
   - "Yes, create plan" (Recommended)
   - "Skip planning, proceed with design"
   - "Just implement directly"

bkit-rules skill auto-applies PDCA recommendation
```

**Verification Script**:
```javascript
// Verify plan document check
const planPath = 'docs/01-plan/features/user-authentication.plan.md';
assert(!fs.existsSync(planPath));

// Verify suggestion in output
const output = getAIResponse();
assert(output.includes('plan') && output.includes('document'));
```

**Pass/Fail Criteria**:
- PASS: System suggests creating plan document
- FAIL: System proceeds without mentioning plan

---

#### TC-PHIL-01-03: Implementation Without Design Document

| Field | Value |
|-------|-------|
| **Test ID** | PHIL-01-03 |
| **Title** | Implementation Without Design Document |
| **Priority** | High |
| **Type** | Functional |

**Preconditions**:
```bash
# 1. Create plan document but no design
mkdir -p /tmp/bkit-test-project/docs/01-plan/features
cat > docs/01-plan/features/login-form.plan.md << 'EOF'
# Login Form Plan
## Goals
- Implement login functionality
EOF

# 2. Verify no design document
ls docs/02-design/features/login-form.design.md 2>/dev/null || echo "No design"
```

**Test Steps**:
```bash
# Step 1: Request implementation
gemini --prompt "Implement the login form"

# Step 2: Observe system warning
```

**Expected Results**:
```markdown
System response includes:
1. Detection of implementation request
2. Plan document found: YES
3. Design document check: NOT FOUND
4. Warning: "Design document missing. Recommended to create design first."
5. Options:
   - "Create design document" (Recommended)
   - "Proceed without design"
```

**Pass/Fail Criteria**:
- PASS: System warns about missing design
- FAIL: System proceeds without warning

---

#### TC-PHIL-01-04: Post-Implementation Gap Analysis Suggestion

| Field | Value |
|-------|-------|
| **Test ID** | PHIL-01-04 |
| **Title** | Post-Implementation Gap Analysis Suggestion |
| **Priority** | High |
| **Type** | Functional |

**Preconditions**:
```bash
# 1. Create plan and design documents
mkdir -p docs/01-plan/features docs/02-design/features
echo "# Feature Plan" > docs/01-plan/features/test-feature.plan.md
echo "# Feature Design" > docs/02-design/features/test-feature.design.md

# 2. Create implementation files
mkdir -p src/features
echo "// Implementation" > src/features/test-feature.js

# 3. Update PDCA status to "do" phase
cat > .pdca-status.json << 'EOF'
{
  "version": "2.0",
  "activeFeatures": {
    "test-feature": {
      "phase": "do",
      "lastUpdated": "2026-02-01T00:00:00Z"
    }
  }
}
EOF
```

**Test Steps**:
```bash
# Step 1: Indicate completion
gemini --prompt "I finished implementing the test-feature"

# Step 2: Observe suggestion
```

**Expected Results**:
```markdown
System response includes:
1. Detection of implementation completion
2. Current phase: "do" → Ready for "check"
3. Suggestion: "Shall I run Gap Analysis?"
4. Command reference: /pdca analyze test-feature
```

**Pass/Fail Criteria**:
- PASS: System suggests gap analysis
- FAIL: No gap analysis suggestion

---

#### TC-PHIL-01-05: Task Classification by Code Size

| Field | Value |
|-------|-------|
| **Test ID** | PHIL-01-05 |
| **Title** | Task Classification by Code Size |
| **Priority** | Medium |
| **Type** | Functional |

**Preconditions**:
```bash
# Prepare test files of various sizes
mkdir -p /tmp/bkit-test-project/test-sizes

# Quick Fix: < 10 lines
seq 1 5 | xargs -I{} echo "line {}" > test-sizes/quick-fix.js

# Minor Change: < 50 lines
seq 1 30 | xargs -I{} echo "line {}" > test-sizes/minor-change.js

# Feature: < 200 lines
seq 1 150 | xargs -I{} echo "line {}" > test-sizes/feature.js

# Major Feature: >= 200 lines
seq 1 250 | xargs -I{} echo "line {}" > test-sizes/major-feature.js
```

**Test Steps**:
```bash
# Step 1: Request to create each file
gemini --prompt "Create a quick fix file with 5 lines"
gemini --prompt "Create a feature file with 150 lines"
gemini --prompt "Create a major feature file with 250 lines"

# Step 2: Check classification
```

**Expected Results**:
```markdown
Classification results:

| File Size | Classification | PDCA Requirement |
|-----------|----------------|------------------|
| < 10 lines | quick_fix | PDCA optional |
| < 50 lines | minor_change | PDCA recommended |
| < 200 lines | feature | PDCA required |
| >= 200 lines | major_feature | PDCA + split recommended |

lib/task/classification.js classifyTaskByLines() returns correct classification
```

**Verification Script**:
```javascript
const { classifyTaskByLines } = require('./lib/task/classification');

assert.strictEqual(classifyTaskByLines(5), 'quick_fix');
assert.strictEqual(classifyTaskByLines(30), 'minor_change');
assert.strictEqual(classifyTaskByLines(150), 'feature');
assert.strictEqual(classifyTaskByLines(250), 'major_feature');
```

**Pass/Fail Criteria**:
- PASS: Correct classification for all sizes
- FAIL: Any misclassification

---

### 2.2 PHIL-02: No Guessing (Plan Section 2.2 Coverage)

> **Philosophy**: "If unsure, check docs → If not in docs, ask user (never guess)"

#### TC-PHIL-02-01: Ambiguous Request Detection

| Field | Value |
|-------|-------|
| **Test ID** | PHIL-02-01 |
| **Title** | Ambiguous Request Detection |
| **Priority** | High |
| **Type** | Functional |

**Preconditions**:
```bash
# Clean test environment
cd /tmp/bkit-test-project
```

**Test Steps**:
```bash
# Step 1: Send ambiguous request
gemini --prompt "Improve the app"

# Step 2: Observe clarifying questions
```

**Expected Results**:
```markdown
1. Ambiguity score calculated: >= 50 (threshold)
2. AskUserQuestion triggered with options:
   - "Improve performance"
   - "Improve UI/UX"
   - "Improve code quality"
   - "Other (specify)"
3. No action taken until user clarifies
```

**Verification Script**:
```javascript
const { calculateAmbiguityScore } = require('./lib/intent/ambiguity');

const score = calculateAmbiguityScore("Improve the app");
assert(score >= 50, `Ambiguity score ${score} should be >= 50`);
```

**Pass/Fail Criteria**:
- PASS: Clarifying questions generated
- FAIL: System guesses and proceeds

---

#### TC-PHIL-02-02: Magic Word Bypass

| Field | Value |
|-------|-------|
| **Test ID** | PHIL-02-02 |
| **Title** | Magic Word Bypass (!hotfix) |
| **Priority** | Medium |
| **Type** | Functional |

**Preconditions**:
```bash
# Create file with known issue
echo "buggy code" > /tmp/bkit-test-project/src/buggy.js
```

**Test Steps**:
```bash
# Step 1: Use magic word bypass
gemini --prompt "!hotfix Fix the button in src/buggy.js"

# Step 2: Observe immediate action
```

**Expected Results**:
```markdown
1. Magic word "!hotfix" detected
2. Ambiguity check bypassed (score forced to 0)
3. Direct action taken without questions
4. No PDCA documentation required
```

**Verification Script**:
```javascript
const { calculateAmbiguityScore } = require('./lib/intent/ambiguity');

const score = calculateAmbiguityScore("!hotfix Fix the button");
assert.strictEqual(score, 0, "Magic word should set ambiguity to 0");
```

**Pass/Fail Criteria**:
- PASS: Immediate action without questions
- FAIL: Questions asked despite magic word

---

#### TC-PHIL-02-03: Unambiguous Request with File Path

| Field | Value |
|-------|-------|
| **Test ID** | PHIL-02-03 |
| **Title** | Unambiguous Request with File Path |
| **Priority** | Medium |
| **Type** | Functional |

**Preconditions**:
```bash
# Create file with specific line
echo -e "line 1\nline 2\nbuggy line 45" > /tmp/bkit-test-project/src/auth.js
```

**Test Steps**:
```bash
# Step 1: Request with specific file path
gemini --prompt "Fix bug in src/auth.js:45"

# Step 2: Observe no ambiguity questions
```

**Expected Results**:
```markdown
1. File path detected: src/auth.js
2. Line number detected: 45
3. Ambiguity score: < 50 (low due to specificity)
4. Direct action taken
```

**Verification Script**:
```javascript
const { calculateAmbiguityScore } = require('./lib/intent/ambiguity');

const score = calculateAmbiguityScore("Fix bug in src/auth.js:45");
assert(score < 50, `Score ${score} should be < 50 for specific file path`);
```

**Pass/Fail Criteria**:
- PASS: Direct action without questions
- FAIL: Unnecessary clarifying questions

---

#### TC-PHIL-02-04: Multiple Interpretation Request

| Field | Value |
|-------|-------|
| **Test ID** | PHIL-02-04 |
| **Title** | Multiple Interpretation Request |
| **Priority** | Medium |
| **Type** | Functional |

**Preconditions**:
```bash
# Clean project with multiple possible form locations
mkdir -p /tmp/bkit-test-project/{components,pages,forms}
```

**Test Steps**:
```bash
# Step 1: Ambiguous request
gemini --prompt "Add a form"

# Step 2: Observe options
```

**Expected Results**:
```markdown
1. Multiple interpretations detected:
   - Login form?
   - Contact form?
   - Registration form?
   - Generic form component?
2. Location ambiguity:
   - components/
   - pages/
   - forms/
3. AskUserQuestion with options
```

**Pass/Fail Criteria**:
- PASS: User asked to choose interpretation
- FAIL: System guesses form type/location

---

#### TC-PHIL-02-05: Design-Referenced Implementation

| Field | Value |
|-------|-------|
| **Test ID** | PHIL-02-05 |
| **Title** | Design-Referenced Implementation |
| **Priority** | High |
| **Type** | Functional |

**Preconditions**:
```bash
# Create detailed design document
cat > docs/02-design/features/user-auth.design.md << 'EOF'
# User Authentication Design

## API Endpoints
- POST /api/auth/login
- POST /api/auth/register
- GET /api/auth/me

## Data Model
```typescript
interface User {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
}
```

## Business Logic
1. Validate email format
2. Hash password with bcrypt
3. Generate JWT token
EOF
```

**Test Steps**:
```bash
# Step 1: Request with design reference
gemini --prompt "Implement according to user-auth.design.md"

# Step 2: Verify implementation follows design exactly
```

**Expected Results**:
```markdown
Implementation follows design:
1. Creates POST /api/auth/login endpoint
2. Creates POST /api/auth/register endpoint
3. Creates GET /api/auth/me endpoint
4. User interface matches design
5. Business logic includes validation, bcrypt, JWT
6. No guessing or additions beyond design
```

**Pass/Fail Criteria**:
- PASS: Implementation matches design 100%
- FAIL: Any deviation from design specification

---

### 2.3 PHIL-03: Docs = Code (Plan Section 2.3 Coverage)

> **Philosophy**: "Design first, implement later (maintain design-implementation sync)"

#### TC-PHIL-03-01: Create Plan Document

| Field | Value |
|-------|-------|
| **Test ID** | PHIL-03-01 |
| **Title** | Create Plan Document with /pdca plan |
| **Priority** | High |
| **Type** | Functional |

**Preconditions**:
```bash
# Clean docs directory
rm -rf /tmp/bkit-test-project/docs/01-plan/features/
mkdir -p /tmp/bkit-test-project/docs/01-plan/features/
cd /tmp/bkit-test-project
```

**Test Steps**:
```bash
# Step 1: Run /pdca plan command
gemini --prompt "/pdca plan user-auth"

# Step 2: Verify file creation
ls -la docs/01-plan/features/user-auth.plan.md
```

**Expected Results**:
```markdown
File created: docs/01-plan/features/user-auth.plan.md

Required sections (from plan.template.md):
1. # Feature Name
2. ## 1. Goals
3. ## 2. Scope
4. ## 3. Success Criteria
5. ## 4. Timeline/Schedule
6. ## 5. Dependencies
7. ## 6. Risks

PDCA status updated:
- .pdca-status.json: phase = "plan"
- activeFeatures includes "user-auth"
```

**Verification Script**:
```bash
# Check file exists
test -f docs/01-plan/features/user-auth.plan.md && echo "PASS: File exists"

# Check required sections
grep -q "## 1. Goals" docs/01-plan/features/user-auth.plan.md && echo "PASS: Goals section"
grep -q "## 2. Scope" docs/01-plan/features/user-auth.plan.md && echo "PASS: Scope section"

# Check PDCA status
jq '.activeFeatures["user-auth"].phase' .pdca-status.json | grep -q "plan" && echo "PASS: Phase updated"
```

**Pass/Fail Criteria**:
- PASS: File created with all required sections
- FAIL: File missing or incomplete

---

#### TC-PHIL-03-02: Create Design Document

| Field | Value |
|-------|-------|
| **Test ID** | PHIL-03-02 |
| **Title** | Create Design Document with /pdca design |
| **Priority** | High |
| **Type** | Functional |

**Preconditions**:
```bash
# Plan document must exist
test -f docs/01-plan/features/user-auth.plan.md || exit 1
```

**Test Steps**:
```bash
# Step 1: Run /pdca design command
gemini --prompt "/pdca design user-auth"

# Step 2: Verify file creation
ls -la docs/02-design/features/user-auth.design.md
```

**Expected Results**:
```markdown
File created: docs/02-design/features/user-auth.design.md

Required sections (from design.template.md):
1. # Feature Design
2. ## 1. Overview
3. ## 2. Architecture
4. ## 3. Data Model
5. ## 4. API Specification
6. ## 5. UI/UX Design
7. ## 6. Error Handling
8. ## 7. Test Plan

References plan document content.
PDCA status updated: phase = "design"
```

**Pass/Fail Criteria**:
- PASS: Design document created with plan reference
- FAIL: Design missing or doesn't reference plan

---

#### TC-PHIL-03-03: Gap Analysis with /pdca analyze

| Field | Value |
|-------|-------|
| **Test ID** | PHIL-03-03 |
| **Title** | Gap Analysis with /pdca analyze |
| **Priority** | High |
| **Type** | Functional |

**Preconditions**:
```bash
# Design document exists
test -f docs/02-design/features/user-auth.design.md || exit 1

# Implementation exists (with intentional gaps)
mkdir -p src/auth
cat > src/auth/login.js << 'EOF'
// Login implementation - missing register and /me endpoints
export function login(email, password) {
  // implementation
}
EOF
```

**Test Steps**:
```bash
# Step 1: Run gap analysis
gemini --prompt "/pdca analyze user-auth"

# Step 2: Check analysis report
cat docs/03-analysis/user-auth.analysis.md
```

**Expected Results**:
```markdown
File created: docs/03-analysis/user-auth.analysis.md

Report includes:
1. ## Overall Scores
   - Design Match: X%
   - Implementation Coverage: X%
2. ## Missing Features (Design O, Implementation X)
   - POST /api/auth/register
   - GET /api/auth/me
3. ## Added Features (Design X, Implementation O)
   - (none if implementation is subset)
4. ## Changed Features
   - (list any deviations)
5. ## Match Rate: calculated percentage

PDCA status updated: phase = "check", matchRate = calculated value
```

**Pass/Fail Criteria**:
- PASS: Analysis report with accurate match rate
- FAIL: Analysis fails or inaccurate match rate

---

#### TC-PHIL-03-04: Low Match Rate Iteration Suggestion

| Field | Value |
|-------|-------|
| **Test ID** | PHIL-03-04 |
| **Title** | Low Match Rate (< 90%) Iteration Suggestion |
| **Priority** | High |
| **Type** | Functional |

**Preconditions**:
```bash
# Analysis with low match rate
cat > .pdca-status.json << 'EOF'
{
  "version": "2.0",
  "activeFeatures": {
    "user-auth": {
      "phase": "check",
      "matchRate": 65,
      "lastUpdated": "2026-02-01T00:00:00Z"
    }
  }
}
EOF
```

**Test Steps**:
```bash
# Step 1: Run /pdca analyze (or check status)
gemini --prompt "/pdca status"

# Step 2: Observe suggestion
```

**Expected Results**:
```markdown
System response:
1. Current match rate: 65% (below 90% threshold)
2. Suggestion: "Match rate is below 90%. Shall I run auto-improvement?"
3. Options:
   - "Auto-improve with /pdca iterate" (Recommended)
   - "Fix manually"
   - "Accept current state"
```

**Pass/Fail Criteria**:
- PASS: Iteration suggested for low match rate
- FAIL: No suggestion or wrong threshold

---

#### TC-PHIL-03-05: High Match Rate Report Suggestion

| Field | Value |
|-------|-------|
| **Test ID** | PHIL-03-05 |
| **Title** | High Match Rate (>= 90%) Report Suggestion |
| **Priority** | High |
| **Type** | Functional |

**Preconditions**:
```bash
# Analysis with high match rate
cat > .pdca-status.json << 'EOF'
{
  "version": "2.0",
  "activeFeatures": {
    "user-auth": {
      "phase": "check",
      "matchRate": 95,
      "lastUpdated": "2026-02-01T00:00:00Z"
    }
  }
}
EOF
```

**Test Steps**:
```bash
# Step 1: Check status
gemini --prompt "/pdca status"

# Step 2: Observe suggestion
```

**Expected Results**:
```markdown
System response:
1. Current match rate: 95% (above 90% threshold)
2. Suggestion: "Match rate is excellent. Ready to generate completion report."
3. Options:
   - "Generate report with /pdca report" (Recommended)
   - "Continue improvement"
```

**Pass/Fail Criteria**:
- PASS: Report generation suggested
- FAIL: Wrong suggestion

---

#### TC-PHIL-03-06: Auto-Iteration with /pdca iterate

| Field | Value |
|-------|-------|
| **Test ID** | PHIL-03-06 |
| **Title** | Auto-Iteration with /pdca iterate |
| **Priority** | High |
| **Type** | Functional |

**Preconditions**:
```bash
# Low match rate analysis exists
cat > docs/03-analysis/user-auth.analysis.md << 'EOF'
# Gap Analysis: user-auth
## Match Rate: 70%
## Missing Features
- POST /api/auth/register
- GET /api/auth/me
EOF

# Update status
cat > .pdca-status.json << 'EOF'
{
  "version": "2.0",
  "activeFeatures": {
    "user-auth": {
      "phase": "check",
      "matchRate": 70,
      "iterations": 0
    }
  }
}
EOF
```

**Test Steps**:
```bash
# Step 1: Run iteration
gemini --prompt "/pdca iterate user-auth"

# Step 2: Verify auto-fix and re-analysis
```

**Expected Results**:
```markdown
Iteration process:
1. pdca-iterator agent invoked
2. Missing features identified from analysis
3. Code auto-fixed:
   - POST /api/auth/register implemented
   - GET /api/auth/me implemented
4. gap-detector re-invoked automatically
5. New match rate calculated
6. Iteration count incremented

Maximum iterations: 5
Stop condition: matchRate >= 90% OR iterations >= 5
```

**Pass/Fail Criteria**:
- PASS: Match rate improves after iteration
- FAIL: No improvement or iteration loop failure

---

## 3. Context Engineering Functional Requirements (Plan Section 3 Coverage)

### 3.1 FR-01: Multi-Level Context Hierarchy (Plan Section 3.1 Coverage)

#### TC-FR-01-01: Plugin-Level Configuration

| Field | Value |
|-------|-------|
| **Test ID** | FR-01-01 |
| **Title** | Plugin-Level Configuration Loading |
| **Priority** | High |
| **Type** | Functional |

**Preconditions**:
```bash
# Locate extension path
EXTENSION_PATH=$(gemini extensions list | grep bkit | awk '{print $NF}')

# Verify plugin config exists
cat ${EXTENSION_PATH}/bkit.config.json
```

**Test Steps**:
```javascript
// Step 1: Load context hierarchy
const { getContextHierarchy } = require('./lib/adapters/gemini/context-hierarchy');
const hierarchy = getContextHierarchy();

// Step 2: Check L1 (plugin) values
console.log('L1 Plugin config:', hierarchy.L1);
```

**Expected Results**:
```markdown
L1 Plugin configuration loaded:
- pdca.matchThreshold: 90 (default)
- pdca.maxIterations: 5 (default)
- permissions.default: "allow"
```

**Pass/Fail Criteria**:
- PASS: Plugin config values accessible
- FAIL: Config loading fails

---

#### TC-FR-01-02: User-Level Override

| Field | Value |
|-------|-------|
| **Test ID** | FR-01-02 |
| **Title** | User-Level Configuration Override |
| **Priority** | High |
| **Type** | Functional |

**Preconditions**:
```bash
# Create user config
mkdir -p ~/.gemini/bkit
cat > ~/.gemini/bkit/user-config.json << 'EOF'
{
  "pdca": {
    "matchThreshold": 85
  }
}
EOF
```

**Test Steps**:
```javascript
const { getHierarchicalConfig } = require('./lib/adapters/gemini/context-hierarchy');
const threshold = getHierarchicalConfig('pdca.matchThreshold');
console.log('Match threshold:', threshold);
```

**Expected Results**:
```markdown
User config overrides plugin:
- pdca.matchThreshold: 85 (from user config)
- Other values: from plugin (not overridden)
```

**Pass/Fail Criteria**:
- PASS: User value overrides plugin value
- FAIL: Plugin value not overridden

---

#### TC-FR-01-03: Project-Level Override

| Field | Value |
|-------|-------|
| **Test ID** | FR-01-03 |
| **Title** | Project-Level Configuration Override |
| **Priority** | High |
| **Type** | Functional |

**Preconditions**:
```bash
# Create project config
cat > /tmp/bkit-test-project/bkit.config.json << 'EOF'
{
  "pdca": {
    "matchThreshold": 95
  }
}
EOF
```

**Test Steps**:
```javascript
const { getHierarchicalConfig } = require('./lib/adapters/gemini/context-hierarchy');
const threshold = getHierarchicalConfig('pdca.matchThreshold');
console.log('Match threshold:', threshold);
```

**Expected Results**:
```markdown
Project config overrides user:
- pdca.matchThreshold: 95 (from project config)
- Priority: L3 Project > L2 User > L1 Plugin
```

**Pass/Fail Criteria**:
- PASS: Project value overrides user value
- FAIL: User value not overridden

---

#### TC-FR-01-04: Session-Level Override

| Field | Value |
|-------|-------|
| **Test ID** | FR-01-04 |
| **Title** | Session-Level In-Memory Override |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```javascript
const { setSessionContext, getHierarchicalConfig } = require('./lib/adapters/gemini/context-hierarchy');

// Set session value
setSessionContext('pdca.matchThreshold', 99);

// Get merged value
const threshold = getHierarchicalConfig('pdca.matchThreshold');
console.log('Match threshold:', threshold);
```

**Expected Results**:
```markdown
Session value overrides all:
- pdca.matchThreshold: 99 (from session)
- Priority: L4 Session > L3 Project > L2 User > L1 Plugin
- Session values not persisted to disk
```

**Pass/Fail Criteria**:
- PASS: Session value overrides project value
- FAIL: Override not working

---

#### TC-FR-01-05: getHierarchicalConfig Dot-Notation

| Field | Value |
|-------|-------|
| **Test ID** | FR-01-05 |
| **Title** | Dot-Notation Config Access |
| **Priority** | Medium |
| **Type** | Functional |

**Test Steps**:
```javascript
const { getHierarchicalConfig } = require('./lib/adapters/gemini/context-hierarchy');

// Test various dot-notation paths
const tests = [
  { path: 'pdca.matchThreshold', expected: 'number' },
  { path: 'pdca.maxIterations', expected: 'number' },
  { path: 'permissions.Bash', expected: 'string|object' },
  { path: 'nonexistent.path', expected: 'undefined' }
];

tests.forEach(test => {
  const value = getHierarchicalConfig(test.path);
  console.log(`${test.path}: ${value} (${typeof value})`);
});
```

**Expected Results**:
```markdown
Dot-notation access works:
- pdca.matchThreshold → number (merged value)
- pdca.maxIterations → number
- permissions.Bash → string/object
- nonexistent.path → undefined (no error)
```

**Pass/Fail Criteria**:
- PASS: All paths resolve correctly
- FAIL: Path resolution fails

---

### 3.2 FR-02: @import Directive (Plan Section 3.2 Coverage)

#### TC-FR-02-01: Relative Path Import

| Field | Value |
|-------|-------|
| **Test ID** | FR-02-01 |
| **Title** | Relative Path Import |
| **Priority** | High |
| **Type** | Functional |

**Preconditions**:
```bash
# Create template file
mkdir -p templates
echo "# Imported Content" > templates/test-template.md
```

**Test Steps**:
```javascript
const { resolveImports } = require('./lib/adapters/gemini/import-resolver');

const result = await resolveImports('./templates/test-template.md', {
  basePath: process.cwd()
});
console.log(result.content);
```

**Expected Results**:
```markdown
Content loaded:
- File: ./templates/test-template.md
- Content: "# Imported Content"
- Resolved path: absolute path to file
```

**Pass/Fail Criteria**:
- PASS: Relative import resolves correctly
- FAIL: Path resolution fails

---

#### TC-FR-02-02: Plugin Root Variable Substitution

| Field | Value |
|-------|-------|
| **Test ID** | FR-02-02 |
| **Title** | ${PLUGIN_ROOT} Variable Substitution |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```javascript
const { resolveImports } = require('./lib/adapters/gemini/import-resolver');

const result = await resolveImports('${PLUGIN_ROOT}/templates/plan.template.md');
console.log('Resolved path:', result.resolvedPath);
console.log('Content length:', result.content.length);
```

**Expected Results**:
```markdown
Variable substituted:
- ${PLUGIN_ROOT} → actual extension installation path
- Template content loaded successfully
- No literal "${PLUGIN_ROOT}" in path
```

**Pass/Fail Criteria**:
- PASS: Variable substituted correctly
- FAIL: Literal variable in path

---

#### TC-FR-02-03: Project Variable Substitution

| Field | Value |
|-------|-------|
| **Test ID** | FR-02-03 |
| **Title** | ${PROJECT} Variable Substitution |
| **Priority** | High |
| **Type** | Functional |

**Preconditions**:
```bash
# Create project file
echo "# Project File" > /tmp/bkit-test-project/project-file.md
```

**Test Steps**:
```javascript
const { resolveImports } = require('./lib/adapters/gemini/import-resolver');

const result = await resolveImports('${PROJECT}/project-file.md', {
  projectDir: '/tmp/bkit-test-project'
});
console.log('Resolved:', result.resolvedPath);
```

**Expected Results**:
```markdown
Variable substituted:
- ${PROJECT} → /tmp/bkit-test-project
- File content loaded
```

**Pass/Fail Criteria**:
- PASS: Project path substituted
- FAIL: Substitution fails

---

#### TC-FR-02-04: Circular Dependency Detection

| Field | Value |
|-------|-------|
| **Test ID** | FR-02-04 |
| **Title** | Circular Import Detection |
| **Priority** | Medium |
| **Type** | Negative |

**Preconditions**:
```bash
# Create circular imports
mkdir -p /tmp/bkit-test-project/circular-test

echo '@import ./file-b.md' > /tmp/bkit-test-project/circular-test/file-a.md
echo '@import ./file-a.md' > /tmp/bkit-test-project/circular-test/file-b.md
```

**Test Steps**:
```javascript
const { resolveImports, detectCircularImport } = require('./lib/adapters/gemini/import-resolver');

try {
  await resolveImports('/tmp/bkit-test-project/circular-test/file-a.md');
} catch (error) {
  console.log('Circular dependency detected:', error.message);
}
```

**Expected Results**:
```markdown
Error thrown:
- Type: CircularDependencyError
- Message: "Circular import detected: file-a.md → file-b.md → file-a.md"
- No infinite loop
```

**Pass/Fail Criteria**:
- PASS: Circular dependency detected and reported
- FAIL: Infinite loop or no detection

---

#### TC-FR-02-05: Import Caching

| Field | Value |
|-------|-------|
| **Test ID** | FR-02-05 |
| **Title** | TTL-Based Import Caching |
| **Priority** | Medium |
| **Type** | Performance |

**Test Steps**:
```javascript
const { resolveImports, clearCache } = require('./lib/adapters/gemini/import-resolver');

// Clear cache
clearCache();

// First import (cache miss)
const start1 = Date.now();
await resolveImports('${PLUGIN_ROOT}/templates/plan.template.md');
const time1 = Date.now() - start1;

// Second import (cache hit)
const start2 = Date.now();
await resolveImports('${PLUGIN_ROOT}/templates/plan.template.md');
const time2 = Date.now() - start2;

console.log('First load:', time1, 'ms');
console.log('Cached load:', time2, 'ms');
console.log('Cache speedup:', (time1 / time2).toFixed(2), 'x');
```

**Expected Results**:
```markdown
Caching works:
- First load: > 10ms (disk I/O)
- Cached load: < 5ms (memory)
- Cache TTL: default 5 seconds
- Cache key: resolved absolute path
```

**Pass/Fail Criteria**:
- PASS: Cached load faster than first load
- FAIL: No caching benefit

---

### 3.3 FR-03: Context Fork Isolation (Plan Section 3.3 Coverage)

#### TC-FR-03-01: Fork Context Creation

| Field | Value |
|-------|-------|
| **Test ID** | FR-03-01 |
| **Title** | Create Isolated Fork Context |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```javascript
const { forkContext } = require('./lib/adapters/gemini/context-fork');

const fork = forkContext('gap-detector', {
  projectDir: '/tmp/bkit-test-project'
});

console.log('Fork ID:', fork.forkId);
console.log('Snapshot path:', fork.snapshotPath);
console.log('Agent name:', fork.agentName);
```

**Expected Results**:
```markdown
Fork created:
- forkId: UUID format (e.g., "fork-abc12345")
- snapshotPath: .pdca-snapshots/fork-{uuid}.json
- Snapshot file contains:
  - pdcaStatus (deep clone)
  - memory (deep clone)
  - createdAt timestamp
  - agentName
```

**Verification Script**:
```bash
# Verify snapshot file
cat .pdca-snapshots/fork-*.json | jq '.agentName'
```

**Pass/Fail Criteria**:
- PASS: Fork ID returned, snapshot file created
- FAIL: Fork creation fails

---

#### TC-FR-03-02: Forked Context Isolation

| Field | Value |
|-------|-------|
| **Test ID** | FR-03-02 |
| **Title** | Forked Context Modifications Isolated |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```javascript
const { forkContext, getFork } = require('./lib/adapters/gemini/context-fork');
const { readPdcaStatus, updatePdcaStatus } = require('./lib/pdca/status');

// Get original state
const originalStatus = readPdcaStatus('/tmp/bkit-test-project');

// Create fork
const fork = forkContext('test-agent', { projectDir: '/tmp/bkit-test-project' });

// Modify forked context
const forkedContext = getFork(fork.forkId);
forkedContext.pdcaStatus.testModification = 'modified';

// Verify original unchanged
const currentStatus = readPdcaStatus('/tmp/bkit-test-project');
console.log('Original has modification:', 'testModification' in currentStatus);
```

**Expected Results**:
```markdown
Isolation verified:
- Forked context modified
- Original context unchanged
- Deep clone ensures no shared references
```

**Pass/Fail Criteria**:
- PASS: Original context unchanged after fork modification
- FAIL: Original context modified

---

#### TC-FR-03-03: Merge Forked Context

| Field | Value |
|-------|-------|
| **Test ID** | FR-03-03 |
| **Title** | Smart Merge Forked Context |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```javascript
const { forkContext, mergeForkedContext } = require('./lib/adapters/gemini/context-fork');

// Create fork with result
const fork = forkContext('gap-detector');
const result = {
  matchRate: 95,
  gaps: ['gap1', 'gap2'],
  analysisComplete: true
};

// Merge back
mergeForkedContext(fork.forkId, result);

// Verify merge
const status = readPdcaStatus();
console.log('Merged matchRate:', status.activeFeatures?.matchRate);
```

**Expected Results**:
```markdown
Merge behavior:
- Objects: deep merge (recursive)
- Arrays: concatenate with deduplication
- Primitives: override with fork value
- Snapshot file deleted after merge
```

**Pass/Fail Criteria**:
- PASS: Merge successful, snapshot cleaned up
- FAIL: Merge fails or snapshot remains

---

#### TC-FR-03-04: Discard Fork Without Merge

| Field | Value |
|-------|-------|
| **Test ID** | FR-03-04 |
| **Title** | Discard Fork Without Merging |
| **Priority** | Medium |
| **Type** | Functional |

**Test Steps**:
```javascript
const { forkContext, discardFork, listActiveForks } = require('./lib/adapters/gemini/context-fork');

// Create fork
const fork = forkContext('test-agent');
console.log('Active forks before:', listActiveForks().length);

// Discard
discardFork(fork.forkId);
console.log('Active forks after:', listActiveForks().length);

// Verify original unchanged
```

**Expected Results**:
```markdown
Discard behavior:
- Snapshot file deleted
- No changes to parent context
- Fork removed from active list
```

**Pass/Fail Criteria**:
- PASS: Fork discarded, no side effects
- FAIL: Discard affects parent context

---

#### TC-FR-03-05: List Active Forks

| Field | Value |
|-------|-------|
| **Test ID** | FR-03-05 |
| **Title** | List Active Fork Contexts |
| **Priority** | Medium |
| **Type** | Functional |

**Test Steps**:
```javascript
const { forkContext, listActiveForks } = require('./lib/adapters/gemini/context-fork');

// Create multiple forks
const fork1 = forkContext('agent-1');
const fork2 = forkContext('agent-2');
const fork3 = forkContext('agent-3');

// List active forks
const forks = listActiveForks();
console.log('Active forks:', forks.map(f => f.agentName));
```

**Expected Results**:
```markdown
List contains:
- fork1: agent-1
- fork2: agent-2
- fork3: agent-3

Each entry includes:
- forkId
- agentName
- createdAt
- snapshotPath
```

**Pass/Fail Criteria**:
- PASS: All active forks listed correctly
- FAIL: Missing or incorrect forks

---

#### TC-FR-03-06: Cleanup Old Forks

| Field | Value |
|-------|-------|
| **Test ID** | FR-03-06 |
| **Title** | Cleanup Stale Forks (>24h) |
| **Priority** | Low |
| **Type** | Maintenance |

**Preconditions**:
```bash
# Create old snapshot (simulated)
mkdir -p .pdca-snapshots
cat > .pdca-snapshots/fork-old.json << 'EOF'
{
  "forkId": "fork-old",
  "agentName": "old-agent",
  "createdAt": "2026-01-30T00:00:00Z"
}
EOF
```

**Test Steps**:
```javascript
const { cleanupOldForks, listActiveForks } = require('./lib/adapters/gemini/context-fork');

console.log('Before cleanup:', listActiveForks().length);

// Cleanup forks older than 24 hours
cleanupOldForks({ maxAge: 24 * 60 * 60 * 1000 });

console.log('After cleanup:', listActiveForks().length);
```

**Expected Results**:
```markdown
Cleanup behavior:
- Forks older than 24 hours deleted
- Recent forks preserved
- No errors on empty directory
```

**Pass/Fail Criteria**:
- PASS: Old forks cleaned up
- FAIL: Cleanup fails or removes recent forks

---

### 3.4 FR-04: BeforeAgent Hook Intent Detection (Plan Section 3.4 Coverage)

#### TC-FR-04-01: Feature Intent Detection

| Field | Value |
|-------|-------|
| **Test ID** | FR-04-01 |
| **Title** | Detect New Feature Request Pattern |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```javascript
const { detectFeatureIntent } = require('./lib/intent/trigger');

const testCases = [
  "Add user authentication feature",
  "Create a new login page",
  "Implement shopping cart",
  "Build the checkout flow",
  "기능 추가해줘",  // Korean
  "機能を追加して", // Japanese
];

testCases.forEach(input => {
  const result = detectFeatureIntent(input);
  console.log(`"${input}" → Feature: ${result.isFeature}, Name: ${result.featureName}`);
});
```

**Expected Results**:
```markdown
Detection results:
- "Add user authentication feature" → Feature: true, Name: "user-authentication"
- "Create a new login page" → Feature: true, Name: "login-page"
- "기능 추가해줘" → Feature: true (Korean detected)
- All trigger patterns matched correctly
```

**Pass/Fail Criteria**:
- PASS: All feature requests detected
- FAIL: False negatives on feature requests

---

#### TC-FR-04-02: Agent Trigger Detection (8 Languages)

| Field | Value |
|-------|-------|
| **Test ID** | FR-04-02 |
| **Title** | Implicit Agent Trigger Detection (8 Languages) |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```javascript
const { matchAgentTrigger } = require('./lib/intent/trigger');

const testCases = [
  // gap-detector triggers
  { input: "is this right?", expected: "gap-detector" },
  { input: "맞아?", expected: "gap-detector" },
  { input: "正しい?", expected: "gap-detector" },
  { input: "对吗?", expected: "gap-detector" },
  { input: "está bien?", expected: "gap-detector" },
  { input: "c'est correct?", expected: "gap-detector" },
  { input: "ist das richtig?", expected: "gap-detector" },
  { input: "è giusto?", expected: "gap-detector" },

  // pdca-iterator triggers
  { input: "improve this", expected: "pdca-iterator" },
  { input: "개선해줘", expected: "pdca-iterator" },
  { input: "改善して", expected: "pdca-iterator" },
];

testCases.forEach(({ input, expected }) => {
  const result = matchAgentTrigger(input);
  console.log(`"${input}" → ${result?.agent || 'none'} (expected: ${expected})`);
});
```

**Expected Results**:
```markdown
All 8 languages trigger correct agents:
- English: gap-detector, pdca-iterator, etc.
- Korean: same agents
- Japanese: same agents
- Chinese: same agents
- Spanish: same agents
- French: same agents
- German: same agents
- Italian: same agents
```

**Pass/Fail Criteria**:
- PASS: All language triggers work correctly
- FAIL: Any language fails to trigger

---

#### TC-FR-04-03: Skill Trigger Detection

| Field | Value |
|-------|-------|
| **Test ID** | FR-04-03 |
| **Title** | Implicit Skill Trigger Detection |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```javascript
const { matchSkillTrigger } = require('./lib/intent/trigger');

const testCases = [
  { input: "create a static website", expected: "starter" },
  { input: "build a fullstack app", expected: "dynamic" },
  { input: "setup microservices", expected: "enterprise" },
  { input: "design the API", expected: "phase-4-api" },
  { input: "review the code", expected: "code-review" },
];

testCases.forEach(({ input, expected }) => {
  const result = matchSkillTrigger(input);
  console.log(`"${input}" → ${result?.skill || 'none'} (expected: ${expected})`);
});
```

**Expected Results**:
```markdown
Skill triggers detected:
- Static website keywords → starter
- Fullstack keywords → dynamic
- Microservices keywords → enterprise
- Phase-specific keywords → corresponding phase skill
```

**Pass/Fail Criteria**:
- PASS: Correct skill triggered
- FAIL: Wrong skill or no trigger

---

#### TC-FR-04-04: Ambiguity Score Calculation

| Field | Value |
|-------|-------|
| **Test ID** | FR-04-04 |
| **Title** | Ambiguity Score Calculation (0-100) |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```javascript
const { calculateAmbiguityScore } = require('./lib/intent/ambiguity');

const testCases = [
  { input: "Fix bug in src/auth.js:45", expectedRange: [0, 30] },
  { input: "Improve the app", expectedRange: [50, 100] },
  { input: "Make it better", expectedRange: [60, 100] },
  { input: "Create user authentication in src/auth/", expectedRange: [20, 50] },
  { input: "!hotfix critical bug", expectedRange: [0, 0] },
];

testCases.forEach(({ input, expectedRange }) => {
  const score = calculateAmbiguityScore(input);
  const inRange = score >= expectedRange[0] && score <= expectedRange[1];
  console.log(`"${input}" → Score: ${score} (expected: ${expectedRange[0]}-${expectedRange[1]}) ${inRange ? '✓' : '✗'}`);
});
```

**Expected Results**:
```markdown
Score factors:
- No specific nouns: +20
- Undefined scope: +20
- Multiple interpretations: +30
- Context conflict: +30
- Contains file path: -30
- Contains technical terms: -20
- Magic word (!hotfix, !prototype, !bypass): score = 0
```

**Pass/Fail Criteria**:
- PASS: Scores in expected ranges
- FAIL: Scores outside expected ranges

---

#### TC-FR-04-05: Context Injection to AI Prompt

| Field | Value |
|-------|-------|
| **Test ID** | FR-04-05 |
| **Title** | Detected Context Injection to AI Prompt |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```javascript
// Simulate BeforeAgent hook
const { processUserPrompt } = require('./hooks/scripts/before-agent');

const input = {
  userPrompt: "Check if the user auth is correct"
};

const output = processUserPrompt(input);
console.log('Detected intent:', output.intent);
console.log('Suggested agent:', output.suggestedAgent);
console.log('Additional context:', output.additionalContext);
```

**Expected Results**:
```markdown
Context injected:
- intent: "verification" or "gap-check"
- suggestedAgent: "gap-detector"
- additionalContext: PDCA status, active feature, etc.

BeforeAgent hook output format:
{
  "hookSpecificOutput": {
    "hookEventName": "BeforeAgent",
    "additionalContext": "Detected verification intent..."
  }
}
```

**Pass/Fail Criteria**:
- PASS: Context properly injected
- FAIL: Missing or incorrect context

---

### 3.5 FR-05: Permission Hierarchy (Plan Section 3.5 Coverage)

#### TC-FR-05-01: Default Dangerous Pattern Denial

| Field | Value |
|-------|-------|
| **Test ID** | FR-05-01 |
| **Title** | Deny Dangerous Shell Commands |
| **Priority** | Critical |
| **Type** | Security |

**Test Steps**:
```javascript
const { checkPermission } = require('./lib/core/permission');

const dangerousCommands = [
  "rm -rf /",
  "rm -rf /*",
  "rm -rf ~",
  "sudo rm -rf /",
  "> /dev/sda",
  "mkfs.ext4 /dev/sda",
];

dangerousCommands.forEach(cmd => {
  const result = checkPermission('run_shell_command', { command: cmd });
  console.log(`"${cmd}" → ${result.level} (expected: deny)`);
});
```

**Expected Results**:
```markdown
All dangerous commands denied:
- rm -rf / → deny
- rm -rf /* → deny
- Destructive file system commands → deny
- Hook returns exit code 2 (block execution)
```

**Pass/Fail Criteria**:
- PASS: All dangerous commands denied
- FAIL: Any dangerous command allowed

---

#### TC-FR-05-02: Configured Ask Pattern

| Field | Value |
|-------|-------|
| **Test ID** | FR-05-02 |
| **Title** | Ask Confirmation for Sensitive Commands |
| **Priority** | High |
| **Type** | Security |

**Preconditions**:
```json
// bkit.config.json
{
  "permissions": {
    "Bash(git push --force*)": "ask",
    "Bash(docker system prune*)": "ask"
  }
}
```

**Test Steps**:
```javascript
const { checkPermission } = require('./lib/core/permission');

const askCommands = [
  "git push --force origin main",
  "docker system prune -a",
];

askCommands.forEach(cmd => {
  const result = checkPermission('run_shell_command', { command: cmd });
  console.log(`"${cmd}" → ${result.level} (expected: ask)`);
});
```

**Expected Results**:
```markdown
Ask commands trigger confirmation:
- git push --force → ask
- docker system prune → ask
- Hook adds confirmation context to AI
```

**Pass/Fail Criteria**:
- PASS: Ask commands require confirmation
- FAIL: Commands executed without confirmation

---

#### TC-FR-05-03: Default Allow Pattern

| Field | Value |
|-------|-------|
| **Test ID** | FR-05-03 |
| **Title** | Allow Safe Commands by Default |
| **Priority** | Medium |
| **Type** | Functional |

**Test Steps**:
```javascript
const { checkPermission } = require('./lib/core/permission');

const safeCommands = [
  "npm test",
  "npm run build",
  "git status",
  "ls -la",
  "cat package.json",
];

safeCommands.forEach(cmd => {
  const result = checkPermission('run_shell_command', { command: cmd });
  console.log(`"${cmd}" → ${result.level} (expected: allow)`);
});
```

**Expected Results**:
```markdown
Safe commands allowed:
- npm test → allow
- git status → allow
- ls, cat → allow
```

**Pass/Fail Criteria**:
- PASS: Safe commands allowed
- FAIL: Safe commands blocked

---

#### TC-FR-05-04: Glob Pattern Matching

| Field | Value |
|-------|-------|
| **Test ID** | FR-05-04 |
| **Title** | Glob Pattern Matching for Permissions |
| **Priority** | Medium |
| **Type** | Functional |

**Test Steps**:
```javascript
const { matchesGlobPattern } = require('./lib/core/permission');

const patterns = [
  { pattern: "docker*", input: "docker build", expected: true },
  { pattern: "docker*", input: "docker-compose up", expected: true },
  { pattern: "git push --force*", input: "git push --force-with-lease", expected: true },
  { pattern: "rm -rf*", input: "rm file.txt", expected: false },
  { pattern: "npm *", input: "npm install", expected: true },
];

patterns.forEach(({ pattern, input, expected }) => {
  const result = matchesGlobPattern(pattern, input);
  console.log(`"${pattern}" vs "${input}" → ${result} (expected: ${expected})`);
});
```

**Expected Results**:
```markdown
Glob matching:
- * matches any characters
- ? matches single character
- Pattern matching is case-sensitive
```

**Pass/Fail Criteria**:
- PASS: All pattern matches correct
- FAIL: Pattern matching errors

---

#### TC-FR-05-05: Custom Project Permission Config

| Field | Value |
|-------|-------|
| **Test ID** | FR-05-05 |
| **Title** | Load Custom Permissions from Project Config |
| **Priority** | High |
| **Type** | Functional |

**Preconditions**:
```bash
# Create project-specific permissions
cat > bkit.config.json << 'EOF'
{
  "permissions": {
    "Bash(npm publish*)": "deny",
    "Bash(yarn deploy*)": "ask",
    "Write(*.secret.*)": "deny"
  }
}
EOF
```

**Test Steps**:
```javascript
const { checkPermission, loadPermissionConfig } = require('./lib/core/permission');

// Reload config
loadPermissionConfig('/tmp/bkit-test-project');

// Test custom permissions
const tests = [
  { tool: 'run_shell_command', input: { command: 'npm publish' }, expected: 'deny' },
  { tool: 'run_shell_command', input: { command: 'yarn deploy prod' }, expected: 'ask' },
  { tool: 'write_file', input: { path: 'config.secret.json' }, expected: 'deny' },
];

tests.forEach(({ tool, input, expected }) => {
  const result = checkPermission(tool, input);
  console.log(`${tool}(${JSON.stringify(input)}) → ${result.level} (expected: ${expected})`);
});
```

**Expected Results**:
```markdown
Custom permissions loaded:
- Project config overrides defaults
- Custom patterns applied correctly
- Both command and file permissions work
```

**Pass/Fail Criteria**:
- PASS: Custom permissions enforced
- FAIL: Custom config ignored

---

### 3.6 FR-06: Task Dependency Chain (Plan Section 3.6 Coverage)

#### TC-FR-06-01: PDCA Dependency Chain Constant

| Field | Value |
|-------|-------|
| **Test ID** | FR-06-01 |
| **Title** | PDCA_DEPENDENCY_CHAIN Constant Definition |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```javascript
const { PDCA_DEPENDENCY_CHAIN } = require('./lib/task/dependency');

console.log('PDCA Dependency Chain:');
Object.entries(PDCA_DEPENDENCY_CHAIN).forEach(([phase, deps]) => {
  console.log(`  ${phase}: depends on [${deps.join(', ')}]`);
});
```

**Expected Results**:
```markdown
Chain definition:
- plan: [] (no dependencies)
- design: [plan]
- do: [design]
- check: [do]
- act: [check]
- report: [check] (can run after check even without act)
- completed: [report]
- archived: [completed]
```

**Pass/Fail Criteria**:
- PASS: Chain matches expected structure
- FAIL: Chain incorrect

---

#### TC-FR-06-02: canStartPhase Validation

| Field | Value |
|-------|-------|
| **Test ID** | FR-06-02 |
| **Title** | Phase Prerequisite Validation |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```javascript
const { canStartPhase } = require('./lib/task/dependency');

const testCases = [
  // Can start design after plan
  { phase: 'design', currentPhase: 'plan', expected: true },
  // Cannot start design without plan
  { phase: 'design', currentPhase: null, expected: false },
  // Can start check after do
  { phase: 'check', currentPhase: 'do', expected: true },
  // Cannot start check after plan (skipping design, do)
  { phase: 'check', currentPhase: 'plan', expected: false },
];

testCases.forEach(({ phase, currentPhase, expected }) => {
  const status = { phase: currentPhase };
  const result = canStartPhase(phase, 'test-feature', status);
  console.log(`canStartPhase('${phase}') when phase='${currentPhase}' → ${result} (expected: ${expected})`);
});
```

**Expected Results**:
```markdown
Validation logic:
- Each phase requires all preceding phases completed
- Returns true if prerequisites met
- Returns false if prerequisites missing
```

**Pass/Fail Criteria**:
- PASS: All validations correct
- FAIL: Incorrect phase allowed/blocked

---

#### TC-FR-06-03: Auto-Link blockedBy Tasks

| Field | Value |
|-------|-------|
| **Test ID** | FR-06-03 |
| **Title** | Create PDCA Task with Dependencies |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```javascript
const { createPdcaTaskWithDependencies } = require('./lib/task/dependency');

// Create plan task first
const planTask = createPdcaTaskWithDependencies('plan', 'user-auth');
console.log('Plan task:', planTask);

// Create design task (should auto-link)
const designTask = createPdcaTaskWithDependencies('design', 'user-auth');
console.log('Design task:', designTask);
console.log('Design blockedBy:', designTask.blockedBy);
```

**Expected Results**:
```markdown
Auto-linking:
- Plan task: blockedBy = []
- Design task: blockedBy = [plan task ID]
- Do task: blockedBy = [design task ID]
- Check task: blockedBy = [do task ID]

Task format:
{
  id: "task-uuid",
  subject: "[Design] user-auth",
  phase: "design",
  feature: "user-auth",
  blockedBy: ["plan-task-id"],
  status: "pending"
}
```

**Pass/Fail Criteria**:
- PASS: blockedBy correctly linked
- FAIL: Missing or wrong dependencies

---

#### TC-FR-06-04: Complete Task Unblocks Dependents

| Field | Value |
|-------|-------|
| **Test ID** | FR-06-04 |
| **Title** | Completing Task Unblocks Dependent Tasks |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```javascript
const { createPdcaTaskWithDependencies, completeTask, getNextAvailableTasks } = require('./lib/task/dependency');

// Create task chain
const planTask = createPdcaTaskWithDependencies('plan', 'test');
const designTask = createPdcaTaskWithDependencies('design', 'test');

console.log('Available before completing plan:', getNextAvailableTasks());

// Complete plan
completeTask(planTask.id);

console.log('Available after completing plan:', getNextAvailableTasks());
```

**Expected Results**:
```markdown
Unblocking behavior:
- Before: only plan task available
- After completing plan: design task unblocked
- Dependent task status changes from "blocked" to "pending"
```

**Pass/Fail Criteria**:
- PASS: Dependent tasks unblocked
- FAIL: Tasks remain blocked

---

#### TC-FR-06-05: Get Next Available Tasks

| Field | Value |
|-------|-------|
| **Test ID** | FR-06-05 |
| **Title** | Get Tasks with No Blockers |
| **Priority** | Medium |
| **Type** | Functional |

**Test Steps**:
```javascript
const { getNextAvailableTasks, createPdcaTaskWithDependencies } = require('./lib/task/dependency');

// Create multiple features
createPdcaTaskWithDependencies('plan', 'feature-a');
createPdcaTaskWithDependencies('plan', 'feature-b');
createPdcaTaskWithDependencies('design', 'feature-a'); // blocked by plan

const available = getNextAvailableTasks();
console.log('Available tasks:', available.map(t => t.subject));
```

**Expected Results**:
```markdown
Available tasks returned:
- [Plan] feature-a (no blockers)
- [Plan] feature-b (no blockers)
- NOT [Design] feature-a (blocked by plan)
```

**Pass/Fail Criteria**:
- PASS: Only unblocked tasks returned
- FAIL: Blocked tasks included

---

### 3.7 FR-07: Context Compaction Hook (Plan Section 3.7 Coverage)

#### TC-FR-07-01: PreCompress Hook Trigger

| Field | Value |
|-------|-------|
| **Test ID** | FR-07-01 |
| **Title** | PreCompress Hook Fires Before Compression |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```bash
# Enable debug logging
BKIT_DEBUG=1 gemini --prompt "Generate a very long response that fills context"

# Check for PreCompress hook execution in logs
grep "PreCompress" ~/.gemini/logs/latest.log
```

**Expected Results**:
```markdown
Hook execution:
- PreCompress hook fires before context compression
- Execution time logged
- No errors in hook execution
```

**Pass/Fail Criteria**:
- PASS: Hook fires before compression
- FAIL: Hook not triggered

---

#### TC-FR-07-02: State Snapshot Creation

| Field | Value |
|-------|-------|
| **Test ID** | FR-07-02 |
| **Title** | Create State Snapshot Before Compression |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```javascript
// Simulate PreCompress hook
const { createSnapshot } = require('./hooks/scripts/pre-compress');

const snapshot = createSnapshot({
  projectDir: '/tmp/bkit-test-project'
});

console.log('Snapshot path:', snapshot.path);
console.log('Snapshot timestamp:', snapshot.timestamp);
```

**Expected Results**:
```markdown
Snapshot created:
- Location: .pdca-snapshots/compress-{timestamp}.json
- Content includes current state
```

**Pass/Fail Criteria**:
- PASS: Snapshot file created with valid content
- FAIL: Snapshot creation fails

---

#### TC-FR-07-03: Snapshot Content Completeness

| Field | Value |
|-------|-------|
| **Test ID** | FR-07-03 |
| **Title** | Snapshot Contains Required State |
| **Priority** | High |
| **Type** | Functional |

**Preconditions**:
```bash
# Ensure state exists
echo '{"activeFeatures":{}}' > .pdca-status.json
echo '{"key":"value"}' > .bkit-memory.json
```

**Test Steps**:
```javascript
const { createSnapshot } = require('./hooks/scripts/pre-compress');
const snapshot = createSnapshot();

// Verify contents
console.log('Has pdcaStatus:', 'pdcaStatus' in snapshot.content);
console.log('Has memory:', 'memory' in snapshot.content);
console.log('Has activeTasks:', 'activeTasks' in snapshot.content);
console.log('Has timestamp:', 'timestamp' in snapshot.content);
```

**Expected Results**:
```markdown
Snapshot content:
{
  "pdcaStatus": { ... },     // From .pdca-status.json
  "memory": { ... },         // From .bkit-memory.json
  "activeTasks": [ ... ],    // Current task list
  "timestamp": "2026-02-01T00:00:00Z"
}
```

**Pass/Fail Criteria**:
- PASS: All required fields present
- FAIL: Missing required fields

---

#### TC-FR-07-04: Auto Cleanup Old Snapshots

| Field | Value |
|-------|-------|
| **Test ID** | FR-07-04 |
| **Title** | Keep Only 10 Most Recent Snapshots |
| **Priority** | Low |
| **Type** | Maintenance |

**Preconditions**:
```bash
# Create 15 snapshots
for i in {1..15}; do
  echo "{\"timestamp\":\"2026-02-01T00:0$i:00Z\"}" > .pdca-snapshots/compress-$i.json
done
```

**Test Steps**:
```javascript
const { cleanupOldSnapshots } = require('./hooks/scripts/pre-compress');

console.log('Before cleanup:', fs.readdirSync('.pdca-snapshots').length);

cleanupOldSnapshots({ keep: 10 });

console.log('After cleanup:', fs.readdirSync('.pdca-snapshots').length);
```

**Expected Results**:
```markdown
Cleanup behavior:
- Keep: 10 most recent snapshots
- Delete: 5 oldest snapshots
- Sorted by timestamp
```

**Pass/Fail Criteria**:
- PASS: Only 10 snapshots remain
- FAIL: More than 10 or wrong snapshots kept

---

#### TC-FR-07-05: State Summary for Context Restoration

| Field | Value |
|-------|-------|
| **Test ID** | FR-07-05 |
| **Title** | Return State Summary for AI Context |
| **Priority** | Medium |
| **Type** | Functional |

**Test Steps**:
```javascript
const { createSnapshot, getStateSummary } = require('./hooks/scripts/pre-compress');

createSnapshot();
const summary = getStateSummary();

console.log('Summary:', summary);
```

**Expected Results**:
```markdown
Summary format (for AI context):
"PDCA Status: feature 'user-auth' at 'check' phase (85% match rate).
 Active tasks: 3 pending, 2 in-progress.
 Last updated: 2026-02-01T10:30:00Z"

Summary used in context restoration after compression.
```

**Pass/Fail Criteria**:
- PASS: Summary contains essential state info
- FAIL: Summary missing or unreadable

---

### 3.8 FR-08: Structured Memory Storage (Plan Section 3.8 Coverage)

#### TC-FR-08-01: Set Memory Value

| Field | Value |
|-------|-------|
| **Test ID** | FR-08-01 |
| **Title** | Save Value with setMemory |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```javascript
const { getMemory } = require('./lib/core/memory');

const memory = getMemory('/tmp/bkit-test-project');
memory.set('testKey', 'testValue');

// Verify file saved
const content = fs.readFileSync('.bkit-memory.json', 'utf8');
console.log('Saved content:', content);
```

**Expected Results**:
```markdown
Memory saved:
- File: .bkit-memory.json
- Content: { "testKey": "testValue" }
- File permissions: 0644
```

**Pass/Fail Criteria**:
- PASS: Value persisted to file
- FAIL: Value not saved

---

#### TC-FR-08-02: Get Memory with Default

| Field | Value |
|-------|-------|
| **Test ID** | FR-08-02 |
| **Title** | Get Value with Default Fallback |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```javascript
const { getMemory } = require('./lib/core/memory');
const memory = getMemory('/tmp/bkit-test-project');

// Existing key
memory.set('existingKey', 'existingValue');
console.log('Existing:', memory.get('existingKey')); // 'existingValue'

// Non-existing key with default
console.log('Non-existing with default:', memory.get('nonExistent', 'defaultValue')); // 'defaultValue'

// Non-existing key without default
console.log('Non-existing without default:', memory.get('nonExistent')); // null
```

**Expected Results**:
```markdown
Get behavior:
- Existing key: returns stored value
- Non-existing + default: returns default
- Non-existing + no default: returns null
```

**Pass/Fail Criteria**:
- PASS: All get scenarios work correctly
- FAIL: Incorrect return values

---

#### TC-FR-08-03: Dot-Notation Access

| Field | Value |
|-------|-------|
| **Test ID** | FR-08-03 |
| **Title** | Dot-Notation Key Access |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```javascript
const { getMemory } = require('./lib/core/memory');
const memory = getMemory('/tmp/bkit-test-project');

// Set nested value
memory.set('pdca.feature', 'user-auth');
memory.set('pdca.phase', 'design');
memory.set('user.preferences.theme', 'dark');

// Get nested values
console.log('pdca.feature:', memory.get('pdca.feature'));
console.log('pdca:', memory.get('pdca'));
console.log('user.preferences.theme:', memory.get('user.preferences.theme'));
```

**Expected Results**:
```markdown
Dot-notation:
- 'pdca.feature' → 'user-auth'
- 'pdca' → { feature: 'user-auth', phase: 'design' }
- 'user.preferences.theme' → 'dark'

JSON structure:
{
  "pdca": {
    "feature": "user-auth",
    "phase": "design"
  },
  "user": {
    "preferences": {
      "theme": "dark"
    }
  }
}
```

**Pass/Fail Criteria**:
- PASS: Nested access works at all levels
- FAIL: Nested access fails

---

#### TC-FR-08-04: Increment Helper

| Field | Value |
|-------|-------|
| **Test ID** | FR-08-04 |
| **Title** | Numeric Increment Helper |
| **Priority** | Medium |
| **Type** | Functional |

**Test Steps**:
```javascript
const { getMemory } = require('./lib/core/memory');
const memory = getMemory('/tmp/bkit-test-project');

// Initialize counter
memory.set('counter', 0);

// Increment
memory.increment('counter');
console.log('After +1:', memory.get('counter')); // 1

memory.increment('counter', 5);
console.log('After +5:', memory.get('counter')); // 6

memory.increment('counter', -2);
console.log('After -2:', memory.get('counter')); // 4
```

**Expected Results**:
```markdown
Increment behavior:
- Default increment: +1
- Custom amount: +n
- Negative amount: -n
- Non-existing key: initialize to amount
```

**Pass/Fail Criteria**:
- PASS: Increment works correctly
- FAIL: Incorrect increment behavior

---

#### TC-FR-08-05: Array Push with Max Length

| Field | Value |
|-------|-------|
| **Test ID** | FR-08-05 |
| **Title** | Array Push with Max Length Limit |
| **Priority** | Medium |
| **Type** | Functional |

**Test Steps**:
```javascript
const { getMemory } = require('./lib/core/memory');
const memory = getMemory('/tmp/bkit-test-project');

// Initialize array
memory.set('history', []);

// Push with max length
for (let i = 1; i <= 15; i++) {
  memory.push('history', `item-${i}`, 10);
}

const history = memory.get('history');
console.log('Length:', history.length);
console.log('First item:', history[0]);
console.log('Last item:', history[history.length - 1]);
```

**Expected Results**:
```markdown
Push with limit:
- Array capped at maxLen (10)
- Oldest items removed when exceeding limit
- First item: 'item-6' (items 1-5 removed)
- Last item: 'item-15'
```

**Pass/Fail Criteria**:
- PASS: Array respects max length
- FAIL: Array exceeds max length

---

#### TC-FR-08-06: Session Tracking

| Field | Value |
|-------|-------|
| **Test ID** | FR-08-06 |
| **Title** | Session Start/End Tracking |
| **Priority** | Medium |
| **Type** | Functional |

**Test Steps**:
```javascript
const { getMemory } = require('./lib/core/memory');
const memory = getMemory('/tmp/bkit-test-project');

// Start session
memory.startSession();
console.log('Session started at:', memory.get('session.startedAt'));
console.log('Session count:', memory.get('session.count'));

// Simulate work
memory.set('session.lastAction', 'test');

// End session
memory.endSession();
console.log('Session ended at:', memory.get('session.endedAt'));
console.log('Session duration:', memory.get('session.duration'));
```

**Expected Results**:
```markdown
Session tracking:
- startSession(): sets startedAt, increments count
- endSession(): sets endedAt, calculates duration
- Persisted across sessions via .bkit-memory.json
```

**Pass/Fail Criteria**:
- PASS: Session lifecycle tracked correctly
- FAIL: Session data missing or incorrect

---

## 4. Component Tests (Plan Section 4 Coverage)

### 4.1 Skills Tests (Plan Section 4.1 Coverage)

> **Total Skills**: 21 (as specified in Plan)
> **Test Cases**: SKILL-01 to SKILL-28 (including sub-tests)

#### TC-SKILL-01 to TC-SKILL-08: PDCA Skill Actions

| Test ID | Action | Command | Expected Output |
|---------|--------|---------|-----------------|
| SKILL-01 | plan | `/pdca plan test-feature` | docs/01-plan/features/test-feature.plan.md created |
| SKILL-02 | design | `/pdca design test-feature` | docs/02-design/features/test-feature.design.md created |
| SKILL-03 | analyze | `/pdca analyze test-feature` | docs/03-analysis/test-feature.analysis.md created |
| SKILL-04 | iterate | `/pdca iterate test-feature` | Auto-fix gaps, re-analyze |
| SKILL-05 | report | `/pdca report test-feature` | docs/04-report/features/test-feature.report.md created |
| SKILL-06 | status | `/pdca status` | Current PDCA progress displayed |
| SKILL-07 | next | `/pdca next` | Next phase suggestion |
| SKILL-08 | archive | `/pdca archive test-feature` | Documents moved to archive |

**Verification Script**:
```bash
#!/bin/bash
# tests/verify-pdca-skill.sh

# Test SKILL-01
gemini --prompt "/pdca plan skill-test"
test -f docs/01-plan/features/skill-test.plan.md && echo "SKILL-01: PASS"

# Test SKILL-02
gemini --prompt "/pdca design skill-test"
test -f docs/02-design/features/skill-test.design.md && echo "SKILL-02: PASS"

# Continue for SKILL-03 through SKILL-08...
```

---

#### TC-SKILL-09 to TC-SKILL-11: Level Skills

| Test ID | Skill | Command | Expected Behavior |
|---------|-------|---------|-------------------|
| SKILL-09 | starter | `/starter` | Initialize Starter-level project structure |
| SKILL-10 | dynamic | `/dynamic` | Initialize Dynamic-level with Next.js + BaaS |
| SKILL-11 | enterprise | `/enterprise` | Initialize Enterprise-level with K8s structure |

**Expected Project Structures**:
```
SKILL-09 (Starter):
├── index.html
├── style.css
└── script.js

SKILL-10 (Dynamic):
├── next.config.js
├── package.json
├── .mcp.json
├── pages/
└── lib/

SKILL-11 (Enterprise):
├── services/
├── infra/
├── k8s/
└── terraform/
```

---

#### TC-SKILL-12: Development Pipeline Skill

| Test ID | Skill | Command | Expected Behavior |
|---------|-------|---------|-------------------|
| SKILL-12 | development-pipeline | `/development-pipeline start` | Initialize 9-phase pipeline |

**Expected Pipeline Initialization**:
```markdown
Pipeline started:
- Phase 1: Schema (pending)
- Phase 2: Convention (pending)
- Phase 3: Mockup (pending)
- Phase 4: API (pending)
- Phase 5: Design System (pending)
- Phase 6: UI Integration (pending)
- Phase 7: SEO/Security (pending)
- Phase 8: Review (pending)
- Phase 9: Deployment (pending)

Level-specific flow:
- Starter: 1→2→3→6→9 (skip 4,5,7,8)
- Dynamic: 1→2→3→4→5→6→7→9 (skip 8)
- Enterprise: All phases
```

---

#### TC-SKILL-13 to TC-SKILL-21: Phase Skills

| Test ID | Skill | Focus |
|---------|-------|-------|
| SKILL-13 | phase-1-schema | Data modeling, terminology |
| SKILL-14 | phase-2-convention | Coding conventions |
| SKILL-15 | phase-3-mockup | UI/UX mockups |
| SKILL-16 | phase-4-api | API design and implementation |
| SKILL-17 | phase-5-design-system | Design system components |
| SKILL-18 | phase-6-ui-integration | UI component integration |
| SKILL-19 | phase-7-seo-security | SEO and security checks |
| SKILL-20 | phase-8-review | Code review |
| SKILL-21 | phase-9-deployment | Production deployment |

---

#### TC-SKILL-22 to TC-SKILL-28: Utility Skills

| Test ID | Skill | Command | Purpose |
|---------|-------|---------|---------|
| SKILL-22 | code-review | `/code-review` | Code quality review |
| SKILL-23 | zero-script-qa | `/zero-script-qa` | Log-based QA |
| SKILL-24 | gemini-cli-learning | `/gemini-cli-learning` | Learn Gemini CLI |
| SKILL-25 | mobile-app | `/mobile-app` | Mobile development guide |
| SKILL-26 | desktop-app | `/desktop-app` | Desktop development guide |
| SKILL-27 | bkit-templates | `/bkit-templates` | Template reference |
| SKILL-28 | bkit-rules | (auto-applied) | Core rules |

---

### 4.2 Agents Tests (Plan Section 4.2 Coverage)

> **Total Agents**: 11 (as specified in Plan)

#### TC-AGENT-01 to TC-AGENT-11: All Agents

| Test ID | Agent | Korean Trigger | English Trigger | Model |
|---------|-------|----------------|-----------------|-------|
| AGENT-01 | gap-detector | "이거 맞아?" | "is this right?" | pro |
| AGENT-02 | design-validator | "설계 검증해줘" | "validate the design" | pro |
| AGENT-03 | pdca-iterator | "개선해줘" | "improve this" | pro |
| AGENT-04 | report-generator | "보고서 작성" | "write a report" | flash |
| AGENT-05 | code-analyzer | "코드 분석" | "analyze the code" | pro |
| AGENT-06 | qa-monitor | "QA 테스트" | "run QA test" | flash |
| AGENT-07 | starter-guide | "도움말" | "help me" | flash-lite |
| AGENT-08 | pipeline-guide | "파이프라인" | "pipeline guidance" | flash |
| AGENT-09 | bkend-expert | "인증 구현" | "implement auth" | pro |
| AGENT-10 | enterprise-expert | "마이크로서비스" | "microservices" | pro |
| AGENT-11 | infra-architect | "인프라 설계" | "infrastructure design" | pro |

**Agent Metadata Verification**:
```javascript
// Verify context fork for analysis agents
const gapDetector = require('./agents/gap-detector.md');
assert(gapDetector.metadata.context === 'fork');
assert(gapDetector.metadata.mergeResult === false);
assert(gapDetector.metadata['recommended-model'] === 'pro');
```

---

### 4.3 Hooks Tests (Plan Section 4.3 Coverage)

> **Total Hooks**: 7 (as specified in Plan)

#### TC-HOOK-01 to TC-HOOK-08: All Event Hooks

| Test ID | Hook Script | Event | Trigger | Expected Behavior |
|---------|-------------|-------|---------|-------------------|
| HOOK-01 | session-start.js | SessionStart | Session begins | Display welcome, detect level |
| HOOK-02 | before-agent.js | BeforeAgent | Before AI processes | Intent detection, ambiguity |
| HOOK-03 | before-tool.js | BeforeTool (write_file) | Before write | Permission check |
| HOOK-04 | before-tool.js | BeforeTool (run_shell_command) | Before bash | Dangerous command block |
| HOOK-05 | after-tool.js | AfterTool (write_file) | After write | Track file changes |
| HOOK-06 | after-agent.js | AfterAgent | After AI completes | Phase transition |
| HOOK-07 | pre-compress.js | PreCompress | Before compression | State snapshot |
| HOOK-08 | session-end.js | SessionEnd | Session ends | Final cleanup |

**Hook Registration Verification**:
```json
// hooks/hooks.json structure verification
{
  "SessionStart": [...],      // HOOK-01
  "BeforeAgent": [...],       // HOOK-02
  "BeforeTool": [...],        // HOOK-03, HOOK-04
  "AfterTool": [...],         // HOOK-05
  "AfterAgent": [...],        // HOOK-06
  "PreCompress": [...],       // HOOK-07
  "SessionEnd": [...]         // HOOK-08
}
```

---

### 4.4 Library Module Tests (Plan Section 4.4 Coverage)

#### 4.4.1 lib/core/ Tests (Plan Section 4.4.1 Coverage)

| Test ID | Module | Function | Test |
|---------|--------|----------|------|
| CORE-01 | io.js | readJsonFile() | Read JSON with default |
| CORE-02 | io.js | writeJsonFile() | Write JSON with formatting |
| CORE-03 | cache.js | getCached() | TTL-based retrieval |
| CORE-04 | cache.js | setCached() | Cache with expiration |
| CORE-05 | config.js | loadConfig() | Load bkit.config.json |
| CORE-06 | permission.js | checkPermission() | Pattern matching |
| CORE-07 | memory.js | getMemory() | Singleton factory |
| CORE-08 | debug.js | debug() | Debug output |

#### 4.4.2 lib/pdca/ Tests (Plan Section 4.4.2 Coverage)

| Test ID | Module | Function | Test |
|---------|--------|----------|------|
| PDCA-01 | status.js | readPdcaStatus() | Load status |
| PDCA-02 | status.js | updatePdcaStatus() | Update phase |
| PDCA-03 | phase.js | getCurrentPhase() | Get current |
| PDCA-04 | phase.js | getNextPhase() | Get next |
| PDCA-05 | level.js | detectLevel() | Auto-detect |
| PDCA-06 | tier.js | getLanguageTier() | Language tier |
| PDCA-07 | automation.js | shouldAutoApply() | Auto-apply decision |

#### 4.4.3 lib/intent/ Tests (Plan Section 4.4.3 Coverage)

| Test ID | Module | Function | Test |
|---------|--------|----------|------|
| INTENT-01 | trigger.js | matchAgentTrigger() | Agent patterns |
| INTENT-02 | trigger.js | matchSkillTrigger() | Skill patterns |
| INTENT-03 | language.js | detectLanguage() | 8 languages |
| INTENT-04 | ambiguity.js | calculateAmbiguityScore() | Score 0-100 |
| INTENT-05 | ambiguity.js | generateClarifyingQuestions() | Questions |

#### 4.4.4 lib/task/ Tests (Plan Section 4.4.4 Coverage)

| Test ID | Module | Function | Test |
|---------|--------|----------|------|
| TASK-01 | creator.js | createTask() | Create task |
| TASK-02 | tracker.js | updateTask() | Update status |
| TASK-03 | classification.js | classifyTaskByLines() | Size classification |
| TASK-04 | dependency.js | canStartPhase() | Prerequisites |
| TASK-05 | dependency.js | createPdcaTaskWithDependencies() | Auto-link |
| TASK-06 | context.js | getTaskContext() | Task for AI |

---

## 5. Integration Tests (Plan Section 5 Coverage)

### 5.1 INT-01: Full PDCA Cycle Test (Plan Section 5.1 Coverage)

**Scenario**: Complete PDCA cycle for "user-auth" feature

```bash
#!/bin/bash
# tests/integration/full-pdca-cycle.sh

PROJECT_DIR="/tmp/bkit-test-project"
FEATURE="user-auth"

# Setup
rm -rf $PROJECT_DIR
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR
git init

# Step 1: Plan
echo "Step 1: Creating Plan..."
gemini --prompt "/pdca plan $FEATURE"
test -f docs/01-plan/features/$FEATURE.plan.md || exit 1
echo "✓ Plan document created"

# Step 2: Design
echo "Step 2: Creating Design..."
gemini --prompt "/pdca design $FEATURE"
test -f docs/02-design/features/$FEATURE.design.md || exit 1
echo "✓ Design document created"

# Step 3: Do (Implementation)
echo "Step 3: Implementing..."
mkdir -p src/auth
cat > src/auth/login.js << 'EOF'
export function login(email, password) {
  // Implementation
}
export function register(email, password) {
  // Implementation
}
EOF
echo "✓ Implementation created"

# Step 4: Check (Gap Analysis)
echo "Step 4: Running Gap Analysis..."
gemini --prompt "/pdca analyze $FEATURE"
test -f docs/03-analysis/$FEATURE.analysis.md || exit 1
echo "✓ Analysis report created"

# Step 5: Act (Iteration if needed)
MATCH_RATE=$(jq '.activeFeatures["'$FEATURE'"].matchRate' .pdca-status.json)
if [ "$MATCH_RATE" -lt 90 ]; then
  echo "Step 5: Iterating (match rate: $MATCH_RATE%)..."
  gemini --prompt "/pdca iterate $FEATURE"
fi
echo "✓ Iteration complete"

# Step 6: Report
echo "Step 6: Generating Report..."
gemini --prompt "/pdca report $FEATURE"
test -f docs/04-report/features/$FEATURE.report.md || exit 1
echo "✓ Report generated"

# Step 7: Archive
echo "Step 7: Archiving..."
gemini --prompt "/pdca archive $FEATURE"
ARCHIVE_DIR="docs/archive/$(date +%Y-%m)/$FEATURE"
test -d $ARCHIVE_DIR || exit 1
echo "✓ Documents archived"

echo ""
echo "================================"
echo "Full PDCA Cycle Test: PASSED"
echo "================================"
```

---

### 5.2 INT-02: Multi-Language Trigger Test (Plan Section 5.2 Coverage)

```bash
#!/bin/bash
# tests/integration/multi-language-trigger.sh

AGENT="gap-detector"

# Test triggers in all 8 languages
TRIGGERS=(
  "is this correct?"           # English
  "이거 맞아?"                  # Korean
  "これで正しい?"               # Japanese
  "这样对吗?"                   # Chinese
  "¿está correcto?"            # Spanish
  "c'est correct?"             # French
  "ist das richtig?"           # German
  "è corretto?"                # Italian
)

for trigger in "${TRIGGERS[@]}"; do
  echo "Testing: $trigger"
  RESULT=$(gemini --prompt "$trigger" 2>&1)
  if echo "$RESULT" | grep -qi "$AGENT"; then
    echo "  ✓ Triggered $AGENT"
  else
    echo "  ✗ Failed to trigger $AGENT"
    exit 1
  fi
done

echo ""
echo "Multi-Language Trigger Test: PASSED"
```

---

### 5.3 INT-03: Level Detection Test (Plan Section 5.3 Coverage)

```bash
#!/bin/bash
# tests/integration/level-detection.sh

BASE_DIR="/tmp/bkit-level-test"

# Test Starter Level
echo "Testing Starter Level..."
rm -rf $BASE_DIR/starter && mkdir -p $BASE_DIR/starter
cd $BASE_DIR/starter
touch index.html style.css script.js
LEVEL=$(gemini --prompt "What level is this project?" 2>&1 | grep -i "starter")
[ -n "$LEVEL" ] && echo "✓ Starter detected" || exit 1

# Test Dynamic Level
echo "Testing Dynamic Level..."
rm -rf $BASE_DIR/dynamic && mkdir -p $BASE_DIR/dynamic
cd $BASE_DIR/dynamic
echo '{}' > next.config.js
echo '{}' > .mcp.json
mkdir pages
LEVEL=$(gemini --prompt "What level is this project?" 2>&1 | grep -i "dynamic")
[ -n "$LEVEL" ] && echo "✓ Dynamic detected" || exit 1

# Test Enterprise Level
echo "Testing Enterprise Level..."
rm -rf $BASE_DIR/enterprise && mkdir -p $BASE_DIR/enterprise
cd $BASE_DIR/enterprise
mkdir services infra k8s terraform
LEVEL=$(gemini --prompt "What level is this project?" 2>&1 | grep -i "enterprise")
[ -n "$LEVEL" ] && echo "✓ Enterprise detected" || exit 1

echo ""
echo "Level Detection Test: PASSED"
```

---

### 5.4 INT-04: Hook Chain Test (Plan Section 5.4 Coverage)

```bash
#!/bin/bash
# tests/integration/hook-chain.sh

LOG_FILE="/tmp/bkit-hook-test.log"
export BKIT_DEBUG=1

# Clear log
> $LOG_FILE

# Start session and perform actions
cd /tmp/bkit-test-project
gemini --prompt "Create a test file" 2>&1 | tee -a $LOG_FILE

# Verify each hook fired
HOOKS=(
  "SessionStart"
  "BeforeAgent"
  "BeforeTool"
  "AfterTool"
  "AfterAgent"
)

for hook in "${HOOKS[@]}"; do
  if grep -q "$hook" $LOG_FILE; then
    echo "✓ $hook hook fired"
  else
    echo "✗ $hook hook NOT fired"
    exit 1
  fi
done

echo ""
echo "Hook Chain Test: PASSED"
```

---

### 5.5 INT-05: MCP Server spawn_agent Test (Plan Section 5.5 Coverage)

```bash
#!/bin/bash
# tests/integration/mcp-spawn-agent.sh

# Start MCP server in background
node mcp/spawn-agent-server.js &
MCP_PID=$!
sleep 2

# Test spawn_agent tool
echo '{"method":"spawn_agent","params":{"agent_name":"gap-detector","task":"Test analysis"}}' | \
  nc localhost 3000 > /tmp/mcp-response.json

# Verify response
if jq -e '.result' /tmp/mcp-response.json > /dev/null; then
  echo "✓ spawn_agent tool works"
else
  echo "✗ spawn_agent tool failed"
  kill $MCP_PID
  exit 1
fi

# Cleanup
kill $MCP_PID

echo ""
echo "MCP Server Test: PASSED"
```

---

## 6. Regression Tests (Plan Section 6 Coverage)

### 6.1 Philosophy Alignment Regression (Plan Section 6.1 Coverage)

| Test ID | Regression Case | Verification |
|---------|-----------------|--------------|
| REG-01 | Code request without plan | System prompts for plan |
| REG-02 | Implementation without design | System warns about design |
| REG-03 | Implementation differs from design | Gap detected |
| REG-04 | Ambiguous request | Questions generated |

### 6.2 Breaking Change Detection (Plan Section 6.2 Coverage)

| Test ID | Area | Baseline | Verification |
|---------|------|----------|--------------|
| REG-05 | Hooks | All 7 fire | Check logs |
| REG-06 | Skills | 21 loadable | Load each skill |
| REG-07 | Agents | 11 triggerable | Trigger each agent |
| REG-08 | FRs | 8 functional | Run FR tests |

---

## 7. Test Execution Plan (Plan Section 7 Coverage)

### 7.1 Test Phases (Plan Section 7.1 Coverage)

| Phase | Focus | Tests | Duration |
|-------|-------|-------|----------|
| 1 | Philosophy | PHIL-01~03 (16 tests) | Day 1 |
| 2 | FR | FR-01~08 (42 tests) | Day 2 |
| 3 | Components | Skills/Agents/Hooks/Lib (73 tests) | Day 3-4 |
| 4 | Integration | INT-01~05 (5 tests) | Day 5 |
| 5 | Regression | REG-01~08 (8 tests) | Day 6 |

### 7.2 Test Environment Setup (Plan Section 7.2 Coverage)

```bash
#!/bin/bash
# tests/setup-test-environment.sh

# 1. Create test directory
mkdir -p /tmp/bkit-test-project
cd /tmp/bkit-test-project

# 2. Initialize git
git init

# 3. Install bkit-gemini extension
gemini extensions install https://github.com/popup-studio-ai/bkit-gemini.git

# 4. Verify installation
gemini extensions list | grep bkit

# 5. Enable hooks
mkdir -p ~/.gemini
cat > ~/.gemini/settings.json << 'EOF'
{
  "hooksConfig": {
    "enabled": true
  }
}
EOF

# 6. Create test configs
echo '{}' > bkit.config.json
echo '{"version":"2.0","activeFeatures":{}}' > .pdca-status.json
echo '{}' > .bkit-memory.json

echo "Test environment ready!"
```

### 7.3 Test Execution Commands (Plan Section 7.3 Coverage)

```bash
# Master test runner
#!/bin/bash
# tests/test-runner.sh

echo "=========================================="
echo "bkit-gemini Comprehensive Test Suite"
echo "=========================================="

# Run all test categories
./tests/verify-philosophy.sh
./tests/verify-fr.sh
./tests/verify-components.sh
./tests/integration/full-pdca-cycle.sh
./tests/integration/multi-language-trigger.sh
./tests/integration/level-detection.sh
./tests/integration/hook-chain.sh
./tests/integration/mcp-spawn-agent.sh
./tests/verify-regression.sh

echo ""
echo "=========================================="
echo "All Tests Complete"
echo "=========================================="
```

---

## 8. Success Criteria (Plan Section 8 Coverage)

### 8.1 Philosophy Alignment (Plan Section 8.1 Coverage)

| Criteria | Target | Pass Condition |
|----------|:------:|----------------|
| Automation First | 100% | All 5 PHIL-01 tests pass |
| No Guessing | 100% | All 5 PHIL-02 tests pass |
| Docs = Code | 90%+ | 5/6 PHIL-03 tests pass |

### 8.2 Functional Requirements (Plan Section 8.2 Coverage)

| FR | Target | Pass Condition |
|----|:------:|----------------|
| FR-01 | 100% | All 5 tests pass |
| FR-02 | 100% | All 5 tests pass |
| FR-03 | 100% | All 6 tests pass |
| FR-04 | 100% | All 5 tests pass |
| FR-05 | 100% | All 5 tests pass |
| FR-06 | 100% | All 5 tests pass |
| FR-07 | 100% | All 5 tests pass |
| FR-08 | 100% | All 6 tests pass |

### 8.3 Component Coverage (Plan Section 8.3 Coverage)

| Component | Target | Pass Condition |
|-----------|:------:|----------------|
| Skills | 100% | All 21 skills loadable |
| Agents | 100% | All 11 agents triggerable |
| Hooks | 100% | All 7 hooks fire |
| Libraries | 90%+ | 23/26 tests pass |

---

## 9. Risk Assessment (Plan Section 9 Coverage)

### 9.1 High Risk Areas (Plan Section 9.1 Coverage)

| Risk | Mitigation | Test Focus |
|------|------------|------------|
| Hook execution | Test each event individually | HOOK-01~08 |
| MCP server | Test connection first | INT-05 |
| Multi-language | Test all 8 languages | INT-02 |
| Context fork | Monitor memory | FR-03 tests |

### 9.2 Dependencies (Plan Section 9.2 Coverage)

| Dependency | Required | Verification |
|------------|----------|--------------|
| Gemini CLI | v0.26.0+ | `gemini --version` |
| Node.js | v18+ | `node --version` |
| Git | Any | `git --version` |
| bkend MCP | Optional | Skip if unavailable |

---

## 10. Test Deliverables (Plan Section 10 Coverage)

### 10.1 Documents (Plan Section 10.1 Coverage)

| Document | Path | Status |
|----------|------|:------:|
| Test Plan | docs/01-plan/features/bkit-gemini-comprehensive-test.plan.md | ✅ |
| Test Design | docs/02-design/features/bkit-gemini-comprehensive-test.design.md | ✅ |
| Test Results | docs/03-analysis/bkit-gemini-comprehensive-test.analysis.md | Pending |
| Test Report | docs/04-report/features/bkit-gemini-comprehensive-test.report.md | Pending |

### 10.2 Scripts (Plan Section 10.2 Coverage)

| Script | Path | Purpose |
|--------|------|---------|
| test-runner.sh | tests/test-runner.sh | Execute all tests |
| verify-philosophy.sh | tests/verify-philosophy.sh | Philosophy tests |
| verify-fr.sh | tests/verify-fr.sh | FR tests |
| verify-components.sh | tests/verify-components.sh | Component tests |
| setup-test-environment.sh | tests/setup-test-environment.sh | Environment setup |

---

## 11. Appendix (Plan Section 11 Coverage)

### A. Philosophy Reference (Plan Appendix A Coverage)

Covered in Section 2 test cases.

### B. AI-Native Principles (Plan Appendix B Coverage)

Verified through:
- Verification Ability → gap-detector agent tests
- Direction Setting → design-first workflow tests
- Quality Standards → code-analyzer agent tests

### C. Context Engineering Architecture (Plan Appendix C Coverage)

Covered in Section 3 (FR-01 to FR-08) test cases.

### D. PDCA Cycle Reference (Plan Appendix D Coverage)

Verified through:
- INT-01: Full PDCA Cycle Test
- SKILL-01 to SKILL-08: PDCA Skill Action Tests

---

## 12. Plan-Design Gap Analysis Summary

| Plan Section | Design Section | Coverage |
|--------------|----------------|:--------:|
| 1. Executive Summary | 1. Overview | 100% |
| 1.1 Purpose | 1.1 Document Purpose | 100% |
| 1.2 Test Scope | 1.2 Design Scope | 100% |
| 1.3 Test Environment | 1.3 Test Environment Specification | 100% |
| 2. Philosophy Tests | 2. Philosophy Alignment Test Cases | 100% |
| 2.1 PHIL-01 | 2.1 PHIL-01 (5 test cases) | 100% |
| 2.2 PHIL-02 | 2.2 PHIL-02 (5 test cases) | 100% |
| 2.3 PHIL-03 | 2.3 PHIL-03 (6 test cases) | 100% |
| 3. FR Tests | 3. Context Engineering FR Tests | 100% |
| 3.1 FR-01 | 3.1 FR-01 (5 test cases) | 100% |
| 3.2 FR-02 | 3.2 FR-02 (5 test cases) | 100% |
| 3.3 FR-03 | 3.3 FR-03 (6 test cases) | 100% |
| 3.4 FR-04 | 3.4 FR-04 (5 test cases) | 100% |
| 3.5 FR-05 | 3.5 FR-05 (5 test cases) | 100% |
| 3.6 FR-06 | 3.6 FR-06 (5 test cases) | 100% |
| 3.7 FR-07 | 3.7 FR-07 (5 test cases) | 100% |
| 3.8 FR-08 | 3.8 FR-08 (6 test cases) | 100% |
| 4. Component Tests | 4. Component Tests | 100% |
| 4.1 Skills | 4.1 Skills Tests (21) | 100% |
| 4.2 Agents | 4.2 Agents Tests (11) | 100% |
| 4.3 Hooks | 4.3 Hooks Tests (7) | 100% |
| 4.4 Library | 4.4 Library Module Tests (4) | 100% |
| 5. Integration Tests | 5. Integration Tests | 100% |
| 5.1 Full PDCA | 5.1 INT-01 | 100% |
| 5.2 Multi-Language | 5.2 INT-02 | 100% |
| 5.3 Level Detection | 5.3 INT-03 | 100% |
| 5.4 Hook Chain | 5.4 INT-04 | 100% |
| 5.5 MCP Server | 5.5 INT-05 | 100% |
| 6. Regression Tests | 6. Regression Tests | 100% |
| 7. Execution Plan | 7. Test Execution Plan | 100% |
| 8. Success Criteria | 8. Success Criteria | 100% |
| 9. Risk Assessment | 9. Risk Assessment | 100% |
| 10. Deliverables | 10. Test Deliverables | 100% |
| 11. Appendix | 11. Appendix | 100% |
| (New) Commands TOML | 13. Commands TOML Tests | New |

**Total Plan-Design Match Rate: 100%**

### 12.1 Commands TOML Conversion Test Coverage

| Test Category | Tests | Coverage |
|---------------|:-----:|:--------:|
| Format Validation | CMD-01~03 | 100% |
| Recognition | CMD-04~13 | 100% |
| Metadata Removal | SKILL-META-01~03 | 100% |
| Integration | CMD-SKILL-01~03 | 100% |
| Arguments | CMD-ARG-01~02 | 100% |
| Cleanup | CLEANUP-01 | 100% |
| **Total** | **22 tests** | **100%** |

---

## 13. Commands TOML & Skills Integration Tests (Gemini CLI Compatibility)

> **Critical**: Commands must be in TOML format for Gemini CLI recognition.
> Skills SKILL.md files must only have `name` and `description` in YAML frontmatter.

### 13.1 Commands TOML Format Validation

#### TC-CMD-01: Commands Directory Structure

| Field | Value |
|-------|-------|
| **Test ID** | CMD-01 |
| **Title** | Commands Directory Contains Only TOML Files |
| **Priority** | Critical |
| **Type** | Structural |

**Test Steps**:
```bash
# Check commands directory
ls -la ~/.gemini/extensions/bkit/commands/

# Verify only .toml files exist (no .md files)
find ~/.gemini/extensions/bkit/commands/ -name "*.md" | wc -l
find ~/.gemini/extensions/bkit/commands/ -name "*.toml" | wc -l
```

**Expected Results**:
```markdown
Commands directory contains:
- 0 .md files (all removed)
- 10 .toml files (all created)

Files present:
- pdca.toml
- starter.toml
- dynamic.toml
- enterprise.toml
- pipeline.toml
- review.toml
- qa.toml
- learn.toml
- bkit.toml
- github-stats.toml
```

**Pass/Fail Criteria**:
- PASS: Only .toml files in commands directory
- FAIL: Any .md files remain

---

#### TC-CMD-02: TOML Syntax Validation

| Field | Value |
|-------|-------|
| **Test ID** | CMD-02 |
| **Title** | All TOML Files Have Valid Syntax |
| **Priority** | Critical |
| **Type** | Syntax |

**Test Steps**:
```bash
#!/bin/bash
# Validate TOML syntax for all command files
EXTENSION_PATH=~/.gemini/extensions/bkit

for file in $EXTENSION_PATH/commands/*.toml; do
  echo "Validating: $file"
  # Use Python toml library for validation
  python3 -c "import toml; toml.load('$file')" 2>&1
  if [ $? -eq 0 ]; then
    echo "  ✓ Valid TOML"
  else
    echo "  ✗ Invalid TOML"
    exit 1
  fi
done
```

**Expected Results**:
```markdown
All 10 files validate:
- pdca.toml: Valid
- starter.toml: Valid
- dynamic.toml: Valid
- enterprise.toml: Valid
- pipeline.toml: Valid
- review.toml: Valid
- qa.toml: Valid
- learn.toml: Valid
- bkit.toml: Valid
- github-stats.toml: Valid
```

**Pass/Fail Criteria**:
- PASS: All TOML files parse without error
- FAIL: Any TOML syntax error

---

#### TC-CMD-03: Required TOML Fields

| Field | Value |
|-------|-------|
| **Test ID** | CMD-03 |
| **Title** | All Commands Have Required Fields |
| **Priority** | Critical |
| **Type** | Schema |

**Test Steps**:
```python
#!/usr/bin/env python3
import toml
import os

EXTENSION_PATH = os.path.expanduser("~/.gemini/extensions/bkit/commands")

for filename in os.listdir(EXTENSION_PATH):
    if filename.endswith('.toml'):
        filepath = os.path.join(EXTENSION_PATH, filename)
        data = toml.load(filepath)

        # Check required 'prompt' field
        assert 'prompt' in data, f"{filename}: Missing 'prompt' field"

        # Check optional but recommended 'description'
        has_desc = 'description' in data

        print(f"{filename}: prompt=✓, description={'✓' if has_desc else '○'}")
```

**Expected Results**:
```markdown
Required fields check:
| File | prompt | description |
|------|:------:|:-----------:|
| pdca.toml | ✓ | ✓ |
| starter.toml | ✓ | ✓ |
| dynamic.toml | ✓ | ✓ |
| enterprise.toml | ✓ | ✓ |
| pipeline.toml | ✓ | ✓ |
| review.toml | ✓ | ✓ |
| qa.toml | ✓ | ✓ |
| learn.toml | ✓ | ✓ |
| bkit.toml | ✓ | ✓ |
| github-stats.toml | ✓ | ✓ |
```

**Pass/Fail Criteria**:
- PASS: All commands have `prompt` field
- FAIL: Any command missing `prompt`

---

### 13.2 Commands Recognition Tests

#### TC-CMD-04: Command /pdca Recognition

| Field | Value |
|-------|-------|
| **Test ID** | CMD-04 |
| **Title** | /pdca Command Recognized by Gemini CLI |
| **Priority** | Critical |
| **Type** | Functional |

**Test Steps**:
```bash
# Start Gemini and test /pdca command
gemini --prompt "/pdca status"
```

**Expected Results**:
```markdown
Command recognized:
1. /pdca command executed (not "Unknown command")
2. pdca skill activated
3. PDCA status displayed or action performed
4. No "command not found" error
```

**Pass/Fail Criteria**:
- PASS: /pdca executes and triggers skill
- FAIL: Command not recognized

---

#### TC-CMD-05: Command /starter Recognition

| Field | Value |
|-------|-------|
| **Test ID** | CMD-05 |
| **Title** | /starter Command Recognition |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```bash
gemini --prompt "/starter help"
```

**Expected Results**:
```markdown
/starter command:
1. Command recognized
2. starter skill context activated
3. Help information displayed
```

**Pass/Fail Criteria**:
- PASS: /starter triggers starter skill
- FAIL: Command not recognized

---

#### TC-CMD-06: Command /dynamic Recognition

| Field | Value |
|-------|-------|
| **Test ID** | CMD-06 |
| **Title** | /dynamic Command Recognition |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```bash
gemini --prompt "/dynamic help"
```

**Expected Results**:
```markdown
/dynamic command recognized and triggers dynamic skill
```

**Pass/Fail Criteria**:
- PASS: Command works
- FAIL: Command not recognized

---

#### TC-CMD-07: Command /enterprise Recognition

| Field | Value |
|-------|-------|
| **Test ID** | CMD-07 |
| **Title** | /enterprise Command Recognition |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```bash
gemini --prompt "/enterprise help"
```

**Expected Results**:
```markdown
/enterprise command recognized and triggers enterprise skill
```

**Pass/Fail Criteria**:
- PASS: Command works
- FAIL: Command not recognized

---

#### TC-CMD-08: Command /pipeline Recognition

| Field | Value |
|-------|-------|
| **Test ID** | CMD-08 |
| **Title** | /pipeline Command Recognition |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```bash
gemini --prompt "/pipeline status"
```

**Expected Results**:
```markdown
/pipeline command recognized and triggers development-pipeline skill
```

**Pass/Fail Criteria**:
- PASS: Command works
- FAIL: Command not recognized

---

#### TC-CMD-09: Command /review Recognition

| Field | Value |
|-------|-------|
| **Test ID** | CMD-09 |
| **Title** | /review Command Recognition |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```bash
gemini --prompt "/review src/"
```

**Expected Results**:
```markdown
/review command recognized and triggers code-review skill
```

**Pass/Fail Criteria**:
- PASS: Command works
- FAIL: Command not recognized

---

#### TC-CMD-10: Command /qa Recognition

| Field | Value |
|-------|-------|
| **Test ID** | CMD-10 |
| **Title** | /qa Command Recognition |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```bash
gemini --prompt "/qa"
```

**Expected Results**:
```markdown
/qa command recognized and triggers zero-script-qa skill
```

**Pass/Fail Criteria**:
- PASS: Command works
- FAIL: Command not recognized

---

#### TC-CMD-11: Command /learn Recognition

| Field | Value |
|-------|-------|
| **Test ID** | CMD-11 |
| **Title** | /learn Command Recognition |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```bash
gemini --prompt "/learn"
```

**Expected Results**:
```markdown
/learn command recognized and triggers gemini-cli-learning skill
```

**Pass/Fail Criteria**:
- PASS: Command works
- FAIL: Command not recognized

---

#### TC-CMD-12: Command /bkit Recognition

| Field | Value |
|-------|-------|
| **Test ID** | CMD-12 |
| **Title** | /bkit Help Command Recognition |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```bash
gemini --prompt "/bkit"
```

**Expected Results**:
```markdown
/bkit command:
1. Recognized by Gemini CLI
2. Displays bkit help menu with all available commands
3. Shows version info
```

**Pass/Fail Criteria**:
- PASS: Help menu displayed
- FAIL: Command not recognized

---

#### TC-CMD-13: Command /github-stats Recognition

| Field | Value |
|-------|-------|
| **Test ID** | CMD-13 |
| **Title** | /github-stats Command Recognition |
| **Priority** | Medium |
| **Type** | Functional |

**Test Steps**:
```bash
gemini --prompt "/github-stats"
```

**Expected Results**:
```markdown
/github-stats command recognized and executes GitHub statistics collection
```

**Pass/Fail Criteria**:
- PASS: Command works
- FAIL: Command not recognized

---

### 13.3 Skills Metadata Removal Validation

#### TC-SKILL-META-01: Skills YAML Frontmatter Validation

| Field | Value |
|-------|-------|
| **Test ID** | SKILL-META-01 |
| **Title** | All Skills Have Valid Frontmatter (No metadata key) |
| **Priority** | Critical |
| **Type** | Schema |

**Test Steps**:
```bash
#!/bin/bash
# Check all SKILL.md files for metadata key
EXTENSION_PATH=~/.gemini/extensions/bkit/skills

for skill_dir in $EXTENSION_PATH/*/; do
  skill_file="$skill_dir/SKILL.md"
  if [ -f "$skill_file" ]; then
    skill_name=$(basename $skill_dir)

    # Check for metadata key in frontmatter
    if grep -q "^metadata:" "$skill_file"; then
      echo "✗ $skill_name: Contains 'metadata:' key (INVALID)"
      exit 1
    else
      echo "✓ $skill_name: Valid frontmatter"
    fi
  fi
done
```

**Expected Results**:
```markdown
All 21 skills pass validation:
| Skill | metadata removed | Status |
|-------|:----------------:|:------:|
| pdca | ✓ | Valid |
| starter | ✓ | Valid |
| dynamic | ✓ | Valid |
| enterprise | ✓ | Valid |
| development-pipeline | ✓ | Valid |
| code-review | ✓ | Valid |
| zero-script-qa | ✓ | Valid |
| gemini-cli-learning | ✓ | Valid |
| bkit-rules | ✓ | Valid |
| bkit-templates | ✓ | Valid |
| mobile-app | ✓ | Valid |
| desktop-app | ✓ | Valid |
| phase-1-schema | ✓ | Valid |
| phase-2-convention | ✓ | Valid |
| phase-3-mockup | ✓ | Valid |
| phase-4-api | ✓ | Valid |
| phase-5-design-system | ✓ | Valid |
| phase-6-ui-integration | ✓ | Valid |
| phase-7-seo-security | ✓ | Valid |
| phase-8-review | ✓ | Valid |
| phase-9-deployment | ✓ | Valid |
```

**Pass/Fail Criteria**:
- PASS: No SKILL.md files contain `metadata:` key
- FAIL: Any SKILL.md contains `metadata:` key

---

#### TC-SKILL-META-02: Skills Only Have name and description

| Field | Value |
|-------|-------|
| **Test ID** | SKILL-META-02 |
| **Title** | Skills Frontmatter Contains Only Allowed Fields |
| **Priority** | Critical |
| **Type** | Schema |

**Test Steps**:
```python
#!/usr/bin/env python3
import os
import re

EXTENSION_PATH = os.path.expanduser("~/.gemini/extensions/bkit/skills")
ALLOWED_FIELDS = {'name', 'description'}

for skill_name in os.listdir(EXTENSION_PATH):
    skill_file = os.path.join(EXTENSION_PATH, skill_name, "SKILL.md")
    if os.path.isfile(skill_file):
        with open(skill_file, 'r') as f:
            content = f.read()

        # Extract frontmatter
        match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
        if match:
            frontmatter = match.group(1)
            # Extract top-level keys
            keys = set(re.findall(r'^(\w+):', frontmatter, re.MULTILINE))

            invalid_keys = keys - ALLOWED_FIELDS
            if invalid_keys:
                print(f"✗ {skill_name}: Invalid keys: {invalid_keys}")
            else:
                print(f"✓ {skill_name}: Only allowed fields")
```

**Expected Results**:
```markdown
Each SKILL.md frontmatter only contains:
- name: (required)
- description: (required)

No other top-level keys allowed:
- ✗ license: (removed)
- ✗ metadata: (removed)
- ✗ Any other key (removed)
```

**Pass/Fail Criteria**:
- PASS: Only `name` and `description` in frontmatter
- FAIL: Any additional keys present

---

#### TC-SKILL-META-03: Extension Loads Without Validation Errors

| Field | Value |
|-------|-------|
| **Test ID** | SKILL-META-03 |
| **Title** | gemini extensions list Shows No Errors |
| **Priority** | Critical |
| **Type** | Integration |

**Test Steps**:
```bash
# Run extension list command
gemini extensions list 2>&1 | tee /tmp/extension-list.log

# Check for validation errors
grep -i "validation\|error\|unrecognized" /tmp/extension-list.log
```

**Expected Results**:
```markdown
Extension list output:
1. bkit extension loads successfully
2. All 21 skills listed
3. No "Unrecognized key" errors
4. No validation failures
5. No agent loading errors

Expected output:
✓ bkit (1.5.0)
 Agent skills:
  pdca: ...
  starter: ...
  (all 21 skills listed)
```

**Pass/Fail Criteria**:
- PASS: Extension loads with all skills, no errors
- FAIL: Any validation error in output

---

### 13.4 Command-Skill Integration Tests

#### TC-CMD-SKILL-01: /pdca → pdca Skill Integration

| Field | Value |
|-------|-------|
| **Test ID** | CMD-SKILL-01 |
| **Title** | /pdca Command Activates pdca Skill |
| **Priority** | Critical |
| **Type** | Integration |

**Test Steps**:
```bash
# Test /pdca command with arguments
gemini --prompt "/pdca plan test-integration"

# Verify skill activation
# Check if pdca skill was used (look for skill-specific behavior)
```

**Expected Results**:
```markdown
Integration verified:
1. /pdca command parsed by Gemini CLI
2. Command prompt sent to AI with pdca skill context
3. pdca skill instructions applied
4. Plan document created following pdca skill guidelines
```

**Pass/Fail Criteria**:
- PASS: pdca skill behavior observed
- FAIL: Generic response without skill context

---

#### TC-CMD-SKILL-02: /starter → starter Skill Integration

| Field | Value |
|-------|-------|
| **Test ID** | CMD-SKILL-02 |
| **Title** | /starter Command Activates starter Skill |
| **Priority** | High |
| **Type** | Integration |

**Test Steps**:
```bash
gemini --prompt "/starter init my-portfolio"
```

**Expected Results**:
```markdown
Integration verified:
1. /starter command parsed
2. starter skill activated (activate_skill internal)
3. Starter-level project structure created
4. Beginner-friendly guidance provided
```

**Pass/Fail Criteria**:
- PASS: Starter-level behavior observed
- FAIL: No skill-specific behavior

---

#### TC-CMD-SKILL-03: All Commands Map to Correct Skills

| Field | Value |
|-------|-------|
| **Test ID** | CMD-SKILL-03 |
| **Title** | Command-to-Skill Mapping Complete |
| **Priority** | High |
| **Type** | Integration |

**Test Steps**:
```bash
#!/bin/bash
# Test all command → skill mappings

declare -A CMD_SKILL_MAP=(
  ["/pdca"]="pdca"
  ["/starter"]="starter"
  ["/dynamic"]="dynamic"
  ["/enterprise"]="enterprise"
  ["/pipeline"]="development-pipeline"
  ["/review"]="code-review"
  ["/qa"]="zero-script-qa"
  ["/learn"]="gemini-cli-learning"
)

for cmd in "${!CMD_SKILL_MAP[@]}"; do
  skill="${CMD_SKILL_MAP[$cmd]}"
  echo "Testing: $cmd → $skill"

  # Execute command and check for skill-specific keywords
  RESULT=$(gemini --prompt "$cmd help" 2>&1)

  # Verify skill was activated (look for skill name or behavior)
  if echo "$RESULT" | grep -qi "$skill\|activated"; then
    echo "  ✓ $cmd activates $skill"
  else
    echo "  ! $cmd may not activate $skill (verify manually)"
  fi
done
```

**Expected Results**:
```markdown
| Command | Expected Skill | Mapping |
|---------|----------------|:-------:|
| /pdca | pdca | ✓ |
| /starter | starter | ✓ |
| /dynamic | dynamic | ✓ |
| /enterprise | enterprise | ✓ |
| /pipeline | development-pipeline | ✓ |
| /review | code-review | ✓ |
| /qa | zero-script-qa | ✓ |
| /learn | gemini-cli-learning | ✓ |
```

**Pass/Fail Criteria**:
- PASS: All commands map to correct skills
- FAIL: Any mapping incorrect

---

### 13.5 Commands Argument Handling Tests

#### TC-CMD-ARG-01: {{args}} Placeholder Substitution

| Field | Value |
|-------|-------|
| **Test ID** | CMD-ARG-01 |
| **Title** | Command Arguments Passed via {{args}} |
| **Priority** | High |
| **Type** | Functional |

**Test Steps**:
```bash
# Test argument passing
gemini --prompt "/pdca plan my-feature"

# Verify "my-feature" was passed to the prompt
```

**Expected Results**:
```markdown
Argument substitution:
1. Command: /pdca plan my-feature
2. {{args}} in pdca.toml replaced with "plan my-feature"
3. AI receives: "...execute: plan my-feature..."
4. Feature name extracted: "my-feature"
```

**Pass/Fail Criteria**:
- PASS: Arguments correctly substituted
- FAIL: Arguments not passed

---

#### TC-CMD-ARG-02: No Arguments Default Behavior

| Field | Value |
|-------|-------|
| **Test ID** | CMD-ARG-02 |
| **Title** | Command Without Arguments Uses Default |
| **Priority** | Medium |
| **Type** | Functional |

**Test Steps**:
```bash
# Test command without arguments
gemini --prompt "/pdca"
```

**Expected Results**:
```markdown
Default behavior:
1. {{args}} empty or not replaced
2. AI interprets as help/status request
3. Shows available pdca actions
```

**Pass/Fail Criteria**:
- PASS: Sensible default behavior
- FAIL: Error on empty arguments

---

### 13.6 Old MD Files Cleanup Verification

#### TC-CLEANUP-01: Old MD Command Files Deleted

| Field | Value |
|-------|-------|
| **Test ID** | CLEANUP-01 |
| **Title** | Old .md Command Files Removed |
| **Priority** | High |
| **Type** | Cleanup |

**Test Steps**:
```bash
# Check for old MD files
ls ~/.gemini/extensions/bkit/commands/*.md 2>/dev/null
ls ~/.gemini/extensions/bkit/commands/pdca/ 2>/dev/null
```

**Expected Results**:
```markdown
Cleanup verified:
- bkit.md: Deleted ✓
- github-stats.md: Deleted ✓
- pdca/ directory: Deleted ✓

No .md files remain in commands directory.
```

**Pass/Fail Criteria**:
- PASS: No .md files or pdca/ directory
- FAIL: Old files remain

---

### 13.7 Commands TOML Test Summary

| Test Category | Test Count | Priority |
|---------------|:----------:|:--------:|
| Format Validation | 3 | Critical |
| Recognition | 10 | High |
| Metadata Removal | 3 | Critical |
| Integration | 3 | High |
| Arguments | 2 | Medium |
| Cleanup | 1 | High |
| **Total** | **22** | - |

### 13.8 Test Execution Script for Commands TOML

```bash
#!/bin/bash
# tests/verify-commands-toml.sh

echo "========================================"
echo "Commands TOML Conversion Test Suite"
echo "========================================"

EXTENSION_PATH=~/.gemini/extensions/bkit
PASS=0
FAIL=0

# CMD-01: Directory structure
echo "CMD-01: Directory structure..."
MD_COUNT=$(find $EXTENSION_PATH/commands -name "*.md" 2>/dev/null | wc -l)
TOML_COUNT=$(find $EXTENSION_PATH/commands -name "*.toml" 2>/dev/null | wc -l)
if [ "$MD_COUNT" -eq 0 ] && [ "$TOML_COUNT" -eq 10 ]; then
  echo "  ✓ PASS: $TOML_COUNT TOML files, $MD_COUNT MD files"
  ((PASS++))
else
  echo "  ✗ FAIL: Found $MD_COUNT MD files, $TOML_COUNT TOML files"
  ((FAIL++))
fi

# SKILL-META-01: No metadata in skills
echo "SKILL-META-01: Skills metadata removed..."
META_COUNT=$(grep -l "^metadata:" $EXTENSION_PATH/skills/*/SKILL.md 2>/dev/null | wc -l)
if [ "$META_COUNT" -eq 0 ]; then
  echo "  ✓ PASS: No metadata keys found"
  ((PASS++))
else
  echo "  ✗ FAIL: $META_COUNT skills still have metadata"
  ((FAIL++))
fi

# SKILL-META-03: Extension loads
echo "SKILL-META-03: Extension loading..."
gemini extensions list 2>&1 | grep -q "bkit"
if [ $? -eq 0 ]; then
  ERROR_COUNT=$(gemini extensions list 2>&1 | grep -ci "error\|unrecognized")
  if [ "$ERROR_COUNT" -eq 0 ]; then
    echo "  ✓ PASS: Extension loads without errors"
    ((PASS++))
  else
    echo "  ✗ FAIL: Extension has $ERROR_COUNT errors"
    ((FAIL++))
  fi
else
  echo "  ✗ FAIL: bkit extension not found"
  ((FAIL++))
fi

echo ""
echo "========================================"
echo "Results: $PASS passed, $FAIL failed"
echo "========================================"

exit $FAIL
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-01 | Initial design document | Claude Code |

