# bkit-gemini Comprehensive Test Plan

> **Status**: Draft
>
> **Project**: bkit-gemini
> **Version**: 1.5.0
> **Author**: POPUP STUDIO
> **Created**: 2026-02-01
> **Test Executor**: Gemini CLI

---

## 1. Executive Summary

### 1.1 Purpose

This document defines a comprehensive test plan for validating that all bkit-gemini extension features:

1. Function correctly when executed through Gemini CLI
2. Align with bkit's core philosophy (Automation First, No Guessing, Docs = Code)
3. Fulfill AI-Native development principles
4. Implement Context Engineering functional requirements (FR-01 ~ FR-08)
5. Follow PDCA methodology correctly

### 1.2 Test Scope

| Category | Count | Description |
|----------|:-----:|-------------|
| Skills | 21 | All domain knowledge skills |
| Agents | 11 | All specialized AI agents |
| Hooks | 7 | All event hooks (SessionStart ~ SessionEnd) |
| Library Modules | 4 | lib/core, lib/pdca, lib/intent, lib/task |
| Functional Requirements | 8 | FR-01 ~ FR-08 Context Engineering |
| Philosophy Principles | 3 | Automation First, No Guessing, Docs = Code |
| Pipeline Phases | 9 | Phase 1 ~ Phase 9 |
| Project Levels | 3 | Starter, Dynamic, Enterprise |

### 1.3 Test Environment

```yaml
Platform: Gemini CLI v0.26.0+
Extension: bkit-gemini v1.5.0
Test Directory: /tmp/bkit-test-project/
Hooks: Enabled
MCP Servers:
  - bkend (optional)
  - bkit-agents (spawn_agent)
```

---

## 2. Philosophy Alignment Tests

### 2.1 PHIL-01: Automation First

> "Claude automatically applies PDCA even if user doesn't know commands"

| Test ID | Test Case | Expected Result | Gemini CLI Command |
|---------|-----------|-----------------|-------------------|
| PHIL-01-01 | Start session without /pdca command | SessionStart hook displays welcome message with options | `gemini` (interactive) |
| PHIL-01-02 | Request feature without Plan doc | System suggests "Shall I create a plan document?" | `"Add user authentication feature"` |
| PHIL-01-03 | Implement without Design doc | System warns about missing design document | `"Implement the login form"` |
| PHIL-01-04 | Complete implementation | System suggests Gap Analysis | `"I finished implementing"` |
| PHIL-01-05 | Task classification by size | Auto-classify Quick Fix (<10), Minor (<50), Feature (<200), Major (>=200) | Create files of varying sizes |

**Verification Script**:
```bash
# Test PHIL-01-01: Session Start
cd /tmp/bkit-test-project
gemini --prompt "Hello, I'm new here"
# Expected: Welcome message with 4 options

# Test PHIL-01-02: Feature without Plan
gemini --prompt "Add user authentication feature"
# Expected: Suggestion to create plan document
```

### 2.2 PHIL-02: No Guessing

> "If unsure, check docs → If not in docs, ask user (never guess)"

| Test ID | Test Case | Expected Result | Gemini CLI Command |
|---------|-----------|-----------------|-------------------|
| PHIL-02-01 | Ambiguous request | Calculate ambiguity score >= 50, ask clarifying questions | `"Improve the app"` |
| PHIL-02-02 | Request with magic word bypass | Skip ambiguity check, proceed immediately | `"!hotfix Fix the button"` |
| PHIL-02-03 | Request with file path (unambiguous) | Low ambiguity score, proceed without questions | `"Fix bug in src/auth.js:45"` |
| PHIL-02-04 | Multiple interpretation possible | Ask user to choose between options | `"Add a form"` |
| PHIL-02-05 | Design-referenced implementation | Follow design document exactly, no guessing | `"Implement according to user-auth.design.md"` |

**Verification Script**:
```bash
# Test PHIL-02-01: Ambiguous request
gemini --prompt "Make it better"
# Expected: AskUserQuestion with clarifying options

# Test PHIL-02-02: Magic word bypass
gemini --prompt "!hotfix Fix the crash on line 42"
# Expected: Direct action without questions
```

### 2.3 PHIL-03: Docs = Code

> "Design first, implement later (maintain design-implementation sync)"

| Test ID | Test Case | Expected Result | Gemini CLI Command |
|---------|-----------|-----------------|-------------------|
| PHIL-03-01 | Run /pdca plan | Create docs/01-plan/features/{feature}.plan.md | `/pdca plan user-auth` |
| PHIL-03-02 | Run /pdca design | Create docs/02-design/features/{feature}.design.md | `/pdca design user-auth` |
| PHIL-03-03 | Run /pdca analyze | Compare design vs implementation, calculate match rate | `/pdca analyze user-auth` |
| PHIL-03-04 | Match rate < 90% | Suggest iteration or manual fix | `/pdca analyze` with gaps |
| PHIL-03-05 | Match rate >= 90% | Suggest report generation | `/pdca analyze` with alignment |
| PHIL-03-06 | Run /pdca iterate | Auto-fix gaps, re-run analysis | `/pdca iterate user-auth` |

**Verification Script**:
```bash
# Test PHIL-03-01 ~ PHIL-03-03: Full PDCA cycle
gemini --prompt "/pdca plan test-feature"
gemini --prompt "/pdca design test-feature"
# Implement test-feature manually
gemini --prompt "/pdca analyze test-feature"
# Expected: Analysis report with match rate
```

---

## 3. Context Engineering Functional Requirements Tests

### 3.1 FR-01: Multi-Level Context Hierarchy

> L1 Plugin → L2 User → L3 Project → L4 Session (later overrides earlier)

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| FR-01-01 | Plugin-level config | Read from ${EXTENSION_PATH}/bkit.config.json |
| FR-01-02 | User-level override | ~/.gemini/bkit/user-config.json overrides plugin |
| FR-01-03 | Project-level override | ${PROJECT}/bkit.config.json overrides user |
| FR-01-04 | Session-level override | In-memory runtime values override all |
| FR-01-05 | getHierarchicalConfig() | Returns merged value from all levels |

**Test Files**:
```
Plugin: ${extensionPath}/bkit.config.json
  → pdca.matchThreshold: 90

User: ~/.gemini/bkit/user-config.json
  → pdca.matchThreshold: 85 (override)

Project: ./bkit.config.json
  → pdca.matchThreshold: 95 (override)

Expected: getHierarchicalConfig('pdca.matchThreshold') returns 95
```

### 3.2 FR-02: @import Directive

> Load external context files with variable substitution

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| FR-02-01 | Relative path import | Import ./templates/api-patterns.md |
| FR-02-02 | Plugin root variable | ${PLUGIN_ROOT} substitution works |
| FR-02-03 | Project variable | ${PROJECT} substitution works |
| FR-02-04 | Circular dependency | Detect and report circular imports |
| FR-02-05 | Import caching | Second import uses cache (TTL-based) |

**Verification Script**:
```javascript
// Test in Node.js REPL
const { resolveImports } = require('./lib/adapters/gemini/import-resolver');

// Test FR-02-02
const result = await resolveImports('${PLUGIN_ROOT}/templates/plan.template.md');
console.log(result.content);
```

### 3.3 FR-03: Context Fork Isolation

> Skills/Agents execute in isolated context copies

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| FR-03-01 | forkContext() | Create isolated snapshot in .pdca-snapshots/ |
| FR-03-02 | Forked context modification | Changes don't affect parent context |
| FR-03-03 | mergeForkedContext() | Smart merge arrays (dedupe), objects (deep merge) |
| FR-03-04 | discardFork() | Delete snapshot without merging |
| FR-03-05 | listActiveForks() | Return list of active forks |
| FR-03-06 | cleanupOldForks() | Remove stale forks (>24h) |

**Verification Script**:
```javascript
const { forkContext, mergeForkedContext, discardFork } = require('./lib/adapters/gemini/context-fork');

// Test FR-03-01
const fork = forkContext('gap-detector', { projectDir: process.cwd() });
console.log('Fork ID:', fork.forkId);

// Test FR-03-03
mergeForkedContext(fork.forkId, { result: 'analysis complete' });
```

### 3.4 FR-04: BeforeAgent Hook (Intent Detection)

> User input preprocessing before AI processing

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| FR-04-01 | Feature intent detection | Detect "new feature request" pattern |
| FR-04-02 | Agent trigger detection | Match implicit agent triggers (8 languages) |
| FR-04-03 | Skill trigger detection | Match implicit skill triggers |
| FR-04-04 | Ambiguity calculation | Return ambiguity score (0-100) |
| FR-04-05 | Context injection | Add detected context to AI prompt |

**Test Prompts by Language**:
```yaml
English: "is this right?" → gap-detector
Korean: "맞아?" → gap-detector
Japanese: "正しい?" → gap-detector
Chinese: "对吗?" → gap-detector
Spanish: "está bien?" → gap-detector
French: "c'est correct?" → gap-detector
German: "ist das richtig?" → gap-detector
Italian: "è giusto?" → gap-detector
```

### 3.5 FR-05: Permission Hierarchy

> Three-level permission system: deny → ask → allow

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| FR-05-01 | Default dangerous pattern | `rm -rf /` → deny |
| FR-05-02 | Configured ask pattern | `git push --force*` → ask confirmation |
| FR-05-03 | Default allow pattern | `npm test*` → allow |
| FR-05-04 | Glob pattern matching | `Bash(docker*)` matches `docker build` |
| FR-05-05 | Custom project config | Load patterns from project bkit.config.json |

**Test Configuration**:
```json
// bkit.config.json
{
  "permissions": {
    "Bash(rm -rf*)": "deny",
    "Bash(git push --force*)": "deny",
    "Bash(docker system prune*)": "ask",
    "Write": "allow"
  }
}
```

### 3.6 FR-06: Task Dependency Chain

> PDCA phase-based task blocking

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| FR-06-01 | PDCA_DEPENDENCY_CHAIN constant | plan→design→do→check→act→report |
| FR-06-02 | canStartPhase('design') | Returns false if plan not completed |
| FR-06-03 | createPdcaTaskWithDependencies | Auto-links blockedBy tasks |
| FR-06-04 | completeTask() | Unblocks dependent tasks |
| FR-06-05 | getNextAvailableTasks() | Returns tasks with no blockers |

**Verification Script**:
```javascript
const { canStartPhase, PDCA_DEPENDENCY_CHAIN } = require('./lib/task/dependency');

// Test FR-06-02
const canStart = canStartPhase('design', 'user-auth', {
  phase: 'plan',
  matchRate: 100
});
console.log('Can start design:', canStart); // true if plan completed
```

### 3.7 FR-07: Context Compaction Hook (PreCompress)

> Preserve PDCA state during context compression

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| FR-07-01 | PreCompress trigger | Hook fires before context compression |
| FR-07-02 | State snapshot | Save to docs/.pdca-snapshots/ |
| FR-07-03 | Snapshot content | Include pdcaStatus, memory, activeTasks |
| FR-07-04 | Auto cleanup | Keep only 10 most recent snapshots |
| FR-07-05 | State summary output | Return summary for context restoration |

### 3.8 FR-08: Structured Memory Storage

> Session-persistent key-value storage with dot-notation

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| FR-08-01 | setMemory(key, value) | Save to .bkit-memory.json |
| FR-08-02 | getMemory(key, default) | Return value or default |
| FR-08-03 | Dot-notation access | `get('pdca.feature')` works |
| FR-08-04 | increment(key, amount) | Numeric increment helper |
| FR-08-05 | push(key, value, maxLen) | Array push with max length |
| FR-08-06 | Session tracking | startSession() / endSession() |

**Verification Script**:
```javascript
const { getMemory, setMemory } = require('./lib/core/memory');

const memory = getMemory(process.cwd());
memory.set('test.key', 'value');
console.log(memory.get('test.key')); // 'value'
```

---

## 4. Component Tests

### 4.1 Skills Tests (21 Skills)

| Test ID | Skill | Test Case | Gemini CLI Command |
|---------|-------|-----------|-------------------|
| SKILL-01 | pdca | Plan action | `/pdca plan test-feature` |
| SKILL-02 | pdca | Design action | `/pdca design test-feature` |
| SKILL-03 | pdca | Analyze action | `/pdca analyze test-feature` |
| SKILL-04 | pdca | Iterate action | `/pdca iterate test-feature` |
| SKILL-05 | pdca | Report action | `/pdca report test-feature` |
| SKILL-06 | pdca | Status action | `/pdca status` |
| SKILL-07 | pdca | Next action | `/pdca next` |
| SKILL-08 | pdca | Archive action | `/pdca archive test-feature` |
| SKILL-09 | starter | Initialize Starter project | `/starter` |
| SKILL-10 | dynamic | Initialize Dynamic project | `/dynamic` |
| SKILL-11 | enterprise | Initialize Enterprise project | `/enterprise` |
| SKILL-12 | development-pipeline | Start pipeline | `/development-pipeline start` |
| SKILL-13 | phase-1-schema | Schema definition | `/phase-1-schema` |
| SKILL-14 | phase-2-convention | Convention setup | `/phase-2-convention` |
| SKILL-15 | phase-3-mockup | Create mockup | `/phase-3-mockup` |
| SKILL-16 | phase-4-api | API design | `/phase-4-api` |
| SKILL-17 | phase-5-design-system | Design system | `/phase-5-design-system` |
| SKILL-18 | phase-6-ui-integration | UI integration | `/phase-6-ui-integration` |
| SKILL-19 | phase-7-seo-security | SEO/Security | `/phase-7-seo-security` |
| SKILL-20 | phase-8-review | Code review | `/phase-8-review` |
| SKILL-21 | phase-9-deployment | Deployment | `/phase-9-deployment` |
| SKILL-22 | code-review | Code review | `/code-review` |
| SKILL-23 | zero-script-qa | Log-based QA | `/zero-script-qa` |
| SKILL-24 | gemini-cli-learning | Learn Gemini CLI | `/gemini-cli-learning` |
| SKILL-25 | mobile-app | Mobile development | `/mobile-app` |
| SKILL-26 | desktop-app | Desktop development | `/desktop-app` |
| SKILL-27 | bkit-templates | Template reference | `/bkit-templates` |
| SKILL-28 | bkit-rules | Core rules | (Auto-applied) |

### 4.2 Agents Tests (11 Agents)

| Test ID | Agent | Trigger | Expected Behavior |
|---------|-------|---------|-------------------|
| AGENT-01 | gap-detector | "이거 맞아?" | Compare design vs implementation |
| AGENT-02 | design-validator | "설계 검증해줘" | Validate design completeness |
| AGENT-03 | pdca-iterator | "개선해줘" | Auto-fix based on gap analysis |
| AGENT-04 | report-generator | "보고서 작성" | Generate completion report |
| AGENT-05 | code-analyzer | "코드 분석" | Analyze code quality |
| AGENT-06 | qa-monitor | "QA 테스트" | Monitor Docker logs |
| AGENT-07 | starter-guide | "도움말" | Beginner guidance |
| AGENT-08 | pipeline-guide | "파이프라인" | Pipeline navigation |
| AGENT-09 | bkend-expert | "인증 구현" | BaaS integration |
| AGENT-10 | enterprise-expert | "마이크로서비스" | Enterprise architecture |
| AGENT-11 | infra-architect | "인프라 설계" | AWS/K8s/Terraform |

**Agent Context Fork Verification**:
```yaml
gap-detector:
  context: fork
  mergeResult: false

design-validator:
  context: fork
  mergeResult: false
```

### 4.3 Hooks Tests (7 Event Hooks)

| Test ID | Hook | Event | Test Case |
|---------|------|-------|-----------|
| HOOK-01 | session-start.js | SessionStart | Display welcome, detect level |
| HOOK-02 | before-agent.js | BeforeAgent | Intent detection, ambiguity |
| HOOK-03 | before-tool.js | BeforeTool (write_file) | Permission check |
| HOOK-04 | before-tool.js | BeforeTool (run_shell_command) | Dangerous command block |
| HOOK-05 | after-tool.js | AfterTool (write_file) | Track file changes |
| HOOK-06 | after-agent.js | AfterAgent | Phase transition, cleanup |
| HOOK-07 | pre-compress.js | PreCompress | State snapshot |
| HOOK-08 | session-end.js | SessionEnd | Final cleanup |

### 4.4 Library Module Tests

#### 4.4.1 lib/core/ (Core Utilities)

| Test ID | Module | Function | Test Case |
|---------|--------|----------|-----------|
| CORE-01 | io.js | readJsonFile() | Read JSON with default |
| CORE-02 | io.js | writeJsonFile() | Write JSON with formatting |
| CORE-03 | cache.js | getCached() | TTL-based cache retrieval |
| CORE-04 | cache.js | setCached() | Cache with expiration |
| CORE-05 | config.js | loadConfig() | Load bkit.config.json |
| CORE-06 | permission.js | checkPermission() | Pattern matching |
| CORE-07 | memory.js | getMemory() | Singleton factory |
| CORE-08 | debug.js | debug() | Debug output (when enabled) |

#### 4.4.2 lib/pdca/ (PDCA Utilities)

| Test ID | Module | Function | Test Case |
|---------|--------|----------|-----------|
| PDCA-01 | status.js | readPdcaStatus() | Load .pdca-status.json |
| PDCA-02 | status.js | updatePdcaStatus() | Update phase, matchRate |
| PDCA-03 | phase.js | getCurrentPhase() | Return current phase |
| PDCA-04 | phase.js | getNextPhase() | Return next phase |
| PDCA-05 | level.js | detectLevel() | Auto-detect Starter/Dynamic/Enterprise |
| PDCA-06 | tier.js | getLanguageTier() | Return Tier 1-4 for language |
| PDCA-07 | automation.js | shouldAutoApply() | Determine PDCA auto-apply |

#### 4.4.3 lib/intent/ (Intent Detection)

| Test ID | Module | Function | Test Case |
|---------|--------|----------|-----------|
| INTENT-01 | trigger.js | matchAgentTrigger() | Match agent patterns |
| INTENT-02 | trigger.js | matchSkillTrigger() | Match skill patterns |
| INTENT-03 | language.js | detectLanguage() | Detect from 8 languages |
| INTENT-04 | ambiguity.js | calculateAmbiguityScore() | Score 0-100 |
| INTENT-05 | ambiguity.js | generateClarifyingQuestions() | Return questions |

#### 4.4.4 lib/task/ (Task Management)

| Test ID | Module | Function | Test Case |
|---------|--------|----------|-----------|
| TASK-01 | creator.js | createTask() | Create task with metadata |
| TASK-02 | tracker.js | updateTask() | Update task status |
| TASK-03 | classification.js | classifyTaskByLines() | Quick/Minor/Feature/Major |
| TASK-04 | dependency.js | canStartPhase() | Check phase prerequisites |
| TASK-05 | dependency.js | createPdcaTaskWithDependencies() | Auto-link tasks |
| TASK-06 | context.js | getTaskContext() | Return task for AI |

---

## 5. Integration Tests

### 5.1 Full PDCA Cycle Test

```
Scenario: Complete PDCA cycle for "user-auth" feature

Step 1: Plan
  Command: /pdca plan user-auth
  Expected: docs/01-plan/features/user-auth.plan.md created
  Verify: File exists, contains required sections

Step 2: Design
  Command: /pdca design user-auth
  Expected: docs/02-design/features/user-auth.design.md created
  Verify: File exists, references plan document

Step 3: Do (Manual Implementation)
  Action: Create src/auth/login.js, src/auth/register.js
  Expected: Implementation files created
  Verify: Files match design specifications

Step 4: Check (Gap Analysis)
  Command: /pdca analyze user-auth
  Expected: docs/03-analysis/user-auth.analysis.md created
  Verify: Match rate calculated, gaps listed

Step 5: Act (Iteration if needed)
  Command: /pdca iterate user-auth
  Expected: Gaps auto-fixed, re-analysis triggered
  Verify: Match rate improved

Step 6: Report
  Command: /pdca report user-auth
  Expected: docs/04-report/features/user-auth.report.md created
  Verify: Report contains all PDCA phases

Step 7: Archive
  Command: /pdca archive user-auth
  Expected: Documents moved to docs/archive/YYYY-MM/user-auth/
  Verify: Original locations cleared
```

### 5.2 Multi-Language Trigger Test

```
Test all 8 languages trigger the same agent:

English: "is this correct?" → gap-detector
Korean: "이거 맞아?" → gap-detector
Japanese: "これで正しい?" → gap-detector
Chinese: "这样对吗?" → gap-detector
Spanish: "¿está correcto?" → gap-detector
French: "c'est correct?" → gap-detector
German: "ist das richtig?" → gap-detector
Italian: "è corretto?" → gap-detector

Verify: All trigger gap-detector agent with same behavior
```

### 5.3 Level Detection Test

```
Test project level auto-detection:

Starter Level:
  Structure: index.html, style.css, script.js
  Expected: Level = "Starter", phases 1→2→3→6→9

Dynamic Level:
  Structure: next.config.js, .mcp.json, pages/
  Expected: Level = "Dynamic", phases 1→2→3→4→5→6→7→9

Enterprise Level:
  Structure: services/, infra/, k8s/, terraform/
  Expected: Level = "Enterprise", all phases required
```

### 5.4 Hook Chain Test

```
Test complete hook execution chain:

1. SessionStart → session-start.js fires
2. User input → before-agent.js fires (intent detection)
3. AI calls write_file → before-tool.js fires (permission)
4. write_file completes → after-tool.js fires (tracking)
5. Agent completes → after-agent.js fires (phase transition)
6. Context full → pre-compress.js fires (state save)
7. Session ends → session-end.js fires (cleanup)

Verify: All hooks execute in order, no errors
```

### 5.5 MCP Server Test (spawn_agent)

```
Test spawn_agent MCP tool:

Command: Use spawn_agent tool to invoke gap-detector

Expected:
1. MCP server receives spawn_agent request
2. Gemini CLI subprocess spawned
3. Agent prompt loaded
4. Analysis executed
5. Result returned to caller

Verify: spawn_agent tool works via MCP protocol
```

---

## 6. Regression Tests

### 6.1 Philosophy Alignment Regression

| Test ID | Regression Case | Expected |
|---------|-----------------|----------|
| REG-01 | User requests code without plan | System prompts for plan first |
| REG-02 | User implements without design | System warns about missing design |
| REG-03 | Implementation differs from design | Gap analysis detects difference |
| REG-04 | Ambiguous request submitted | Clarifying questions generated |

### 6.2 Breaking Change Detection

| Test ID | Area | Baseline | Test |
|---------|------|----------|------|
| REG-05 | Hook execution | All 7 hooks fire | Verify all fire |
| REG-06 | Skill loading | 21 skills loadable | Verify all load |
| REG-07 | Agent triggers | 11 agents triggerable | Verify all trigger |
| REG-08 | FR implementation | 8 FRs functional | Verify all work |

---

## 7. Test Execution Plan

### 7.1 Test Phases

| Phase | Focus | Duration | Dependencies |
|-------|-------|----------|--------------|
| Phase 1 | Philosophy Tests (PHIL-01~03) | Day 1 | None |
| Phase 2 | FR Tests (FR-01~08) | Day 2 | Phase 1 |
| Phase 3 | Component Tests (Skills, Agents, Hooks) | Day 3-4 | Phase 2 |
| Phase 4 | Integration Tests | Day 5 | Phase 3 |
| Phase 5 | Regression Tests | Day 6 | Phase 4 |

### 7.2 Test Environment Setup

```bash
# 1. Create test directory
mkdir -p /tmp/bkit-test-project
cd /tmp/bkit-test-project

# 2. Initialize git
git init

# 3. Install bkit-gemini extension
gemini extensions install /path/to/bkit-gemini

# 4. Verify installation
gemini extensions list

# 5. Enable hooks
cat > ~/.gemini/settings.json << 'EOF'
{
  "hooksConfig": {
    "enabled": true
  }
}
EOF
```

### 7.3 Test Execution Commands

```bash
# Philosophy Tests
gemini --prompt "Hello, I'm starting a new project" # PHIL-01-01
gemini --prompt "Add user authentication" # PHIL-01-02
gemini --prompt "Improve the app" # PHIL-02-01
gemini --prompt "!hotfix Fix the crash" # PHIL-02-02

# PDCA Skill Tests
gemini --prompt "/pdca plan test-feature" # SKILL-01
gemini --prompt "/pdca design test-feature" # SKILL-02
gemini --prompt "/pdca status" # SKILL-06

# Agent Trigger Tests
gemini --prompt "이거 맞아?" # AGENT-01 (Korean)
gemini --prompt "is this right?" # AGENT-01 (English)
gemini --prompt "正しい?" # AGENT-01 (Japanese)

# Hook Tests
# (Hooks fire automatically, check logs)
BKIT_DEBUG=1 gemini --prompt "Test prompt"
```

---

## 8. Success Criteria

### 8.1 Philosophy Alignment

| Criteria | Target | Measurement |
|----------|:------:|-------------|
| Automation First | 100% | All auto-apply scenarios work |
| No Guessing | 100% | Ambiguous requests trigger questions |
| Docs = Code | 90%+ | Match rate in gap analysis |

### 8.2 Functional Requirements

| FR | Target | Measurement |
|----|:------:|-------------|
| FR-01 Context Hierarchy | 100% | All 4 levels merge correctly |
| FR-02 @import | 100% | Variables substitute correctly |
| FR-03 Context Fork | 100% | Isolation and merge work |
| FR-04 BeforeAgent | 100% | Intent detection triggers |
| FR-05 Permission | 100% | Deny/Ask/Allow work |
| FR-06 Task Dependency | 100% | blockedBy enforced |
| FR-07 PreCompress | 100% | State snapshots saved |
| FR-08 Memory | 100% | Persistence works |

### 8.3 Component Coverage

| Component | Target | Measurement |
|-----------|:------:|-------------|
| Skills | 100% | All 21 skills loadable |
| Agents | 100% | All 11 agents triggerable |
| Hooks | 100% | All 7 hooks fire |
| Libraries | 90%+ | Core functions tested |

---

## 9. Risk Assessment

### 9.1 High Risk Areas

| Area | Risk | Mitigation |
|------|------|------------|
| Hook execution | May not fire in all scenarios | Test each hook event individually |
| MCP server | spawn_agent may fail | Test MCP connection first |
| Multi-language triggers | Edge cases in regex | Test all 8 languages |
| Context fork | Memory issues with large context | Monitor memory usage |

### 9.2 Dependencies

| Dependency | Required Version | Impact if Missing |
|------------|-----------------|-------------------|
| Gemini CLI | v0.26.0+ | Hooks won't work |
| Node.js | v18+ | Scripts may fail |
| Git | Any | PDCA tracking fails |
| bkend MCP | Optional | BaaS features unavailable |

---

## 10. Test Deliverables

### 10.1 Documents

| Document | Path | Description |
|----------|------|-------------|
| Test Plan | docs/01-plan/features/bkit-gemini-comprehensive-test.plan.md | This document |
| Test Design | docs/02-design/features/bkit-gemini-comprehensive-test.design.md | Detailed test cases |
| Test Results | docs/03-analysis/bkit-gemini-comprehensive-test.analysis.md | Execution results |
| Test Report | docs/04-report/features/bkit-gemini-comprehensive-test.report.md | Final report |

### 10.2 Scripts

| Script | Path | Purpose |
|--------|------|---------|
| test-runner.sh | tests/test-runner.sh | Execute all tests |
| verify-philosophy.sh | tests/verify-philosophy.sh | Philosophy tests |
| verify-fr.sh | tests/verify-fr.sh | FR tests |
| verify-components.sh | tests/verify-components.sh | Component tests |

---

## 11. Appendix

### A. Philosophy Reference

```
Core Mission:
"Enable all developers using Gemini CLI to naturally adopt
 'document-driven development' and 'continuous improvement'
 even without knowing commands or PDCA methodology"

Three Core Philosophies:
1. Automation First - Auto-apply PDCA even if user doesn't know commands
2. No Guessing - Check docs first, ask user if unsure
3. Docs = Code - Design first, maintain sync
```

### B. AI-Native Principles

```
3 Core Competencies:
1. Verification Ability - Judge AI output correctness
2. Direction Setting - Clearly define what to build
3. Quality Standards - Provide criteria for good code
```

### C. Context Engineering Architecture

```
FR-01: Multi-Level Context Hierarchy
FR-02: @import Directive
FR-03: Context Fork Isolation
FR-04: BeforeAgent Hook (Intent Detection)
FR-05: Permission Hierarchy
FR-06: Task Dependency Chain
FR-07: Context Compaction Hook (PreCompress)
FR-08: Structured Memory Storage
```

### D. PDCA Cycle Reference

```
Plan   → docs/01-plan/features/{feature}.plan.md
Design → docs/02-design/features/{feature}.design.md
Do     → Implementation code
Check  → docs/03-analysis/{feature}.analysis.md
Act    → Iteration / Report
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-01 | Initial test plan | Claude Code |

