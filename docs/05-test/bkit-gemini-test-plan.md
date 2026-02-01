# bkit-gemini Test Plan

> **Version**: 1.5.0
> **Created**: 2026-02-01
> **Author**: POPUP STUDIO
> **Status**: Draft

---

## 1. Test Overview

### 1.1 Purpose

Validate that bkit-gemini extension works correctly with Gemini CLI, ensuring all converted components function as expected.

### 1.2 Scope

- Extension manifest and configuration
- Hook system (7 events)
- Skills (21 skills)
- Agents (11 agents)
- Library modules (26 modules)
- PDCA workflow integration

### 1.3 Prerequisites

- Gemini CLI installed and configured
- Node.js 18+ installed
- Git access to bkit-gemini repository

---

## 2. Test Environment Setup

### 2.1 Installation Test

```bash
# Clone repository
git clone https://github.com/popup-studio-ai/bkit-gemini.git

# Copy to Gemini CLI extensions folder
cp -r bkit-gemini ~/.gemini/extensions/bkit

# Verify installation
gemini extensions list
```

**Expected Result**: bkit appears in extensions list

### 2.2 Configuration Verification

| File | Check | Expected |
|------|-------|----------|
| gemini-extension.json | Valid JSON | No parse errors |
| bkit.config.json | Valid JSON | No parse errors |
| hooks/hooks.json | Valid JSON | No parse errors |

---

## 3. Hook System Tests

### 3.1 SessionStart Hook

**Test Steps**:
1. Start new Gemini CLI session in a project directory
2. Observe initialization message

**Expected Result**:
- PDCA status check runs
- Previous work detection (if .pdca-status.json exists)
- Session context initialized

### 3.2 BeforeAgent Hook (Intent Detection)

**Test Steps**:
1. Enter user prompt with trigger keyword (e.g., "help me plan")
2. Check agent suggestion

**Expected Result**:
- Intent detection identifies keyword
- Appropriate agent/skill suggested
- Multi-language triggers work (test: "계획", "plan", "計画")

### 3.3 BeforeTool Hook

**Test Steps**:
1. Execute a tool (e.g., write_file)
2. Verify pre-validation runs

**Expected Result**:
- Tool execution proceeds normally
- No errors in validation

### 3.4 AfterTool Hook

**Test Steps**:
1. Complete a tool execution
2. Check post-execution tracking

**Expected Result**:
- Tool result logged correctly
- Task context updated if applicable

### 3.5 AfterAgent Hook

**Test Steps**:
1. Complete a task that triggers phase transition
2. Verify PDCA phase update

**Expected Result**:
- Phase transition detected
- .pdca-status.json updated
- Next phase suggestion provided

### 3.6 PreCompress Hook

**Test Steps**:
1. Trigger context compression (long conversation)
2. Verify context preservation

**Expected Result**:
- Critical context saved to snapshot
- PDCA status preserved

### 3.7 SessionEnd Hook

**Test Steps**:
1. End Gemini CLI session
2. Verify cleanup

**Expected Result**:
- Session cleanup completed
- No lingering processes

---

## 4. Skills Tests

### 4.1 PDCA Skill

| Command | Test | Expected |
|---------|------|----------|
| `/pdca plan test-feature` | Create plan | Plan document created |
| `/pdca design test-feature` | Create design | Design document created |
| `/pdca do test-feature` | Show guide | Implementation guide shown |
| `/pdca analyze test-feature` | Run analysis | Gap analysis executed |
| `/pdca iterate test-feature` | Auto-improve | Iteration cycle runs |
| `/pdca report test-feature` | Generate report | Completion report created |
| `/pdca status` | Show status | Current PDCA status displayed |
| `/pdca next` | Next step guide | Next action suggested |

### 4.2 Level Skills

| Skill | Test | Expected |
|-------|------|----------|
| `/starter` | Initialize Starter project | Project setup guide |
| `/dynamic` | Initialize Dynamic project | Fullstack setup guide |
| `/enterprise` | Initialize Enterprise project | Microservices setup guide |

### 4.3 Pipeline Skills

| Skill | Test | Expected |
|-------|------|----------|
| `/development-pipeline` | Show pipeline | 9-phase overview |
| `/phase-1-schema` | Schema phase | Schema template guide |
| `/phase-2-convention` | Convention phase | Convention template |
| `/phase-3-mockup` | Mockup phase | UI mockup guide |
| `/phase-4-api` | API phase | API design guide |
| `/phase-5-design-system` | Design system | Component guide |
| `/phase-6-ui-integration` | UI integration | Frontend integration |
| `/phase-7-seo-security` | SEO/Security | Optimization guide |
| `/phase-8-review` | Review phase | Code review guide |
| `/phase-9-deployment` | Deployment | Deployment guide |

### 4.4 Utility Skills

| Skill | Test | Expected |
|-------|------|----------|
| `/code-review` | Code review | Analysis output |
| `/zero-script-qa` | QA guide | Testing methodology |
| `/gemini-cli-learning` | Learning guide | Setup instructions |
| `/mobile-app` | Mobile development | React Native/Flutter guide |
| `/desktop-app` | Desktop development | Electron/Tauri guide |
| `/bkit-templates` | Template list | Available templates |
| `/bkit-rules` | Core rules | Rule documentation |

---

## 5. Agents Tests

### 5.1 Agent Activation Tests

| Agent | Trigger | Expected |
|-------|---------|----------|
| starter-guide | "beginner help" | Beginner guidance |
| pipeline-guide | "where to start" | Pipeline guidance |
| bkend-expert | "login feature" | BaaS integration help |
| gap-detector | "verify design" | Gap analysis |
| enterprise-expert | "microservices" | Enterprise guidance |
| pdca-iterator | "auto-fix" | Iteration cycle |
| design-validator | "validate design" | Design validation |
| qa-monitor | "test logs" | QA monitoring |
| infra-architect | "kubernetes" | Infrastructure guidance |
| code-analyzer | "code quality" | Code analysis |
| report-generator | "completion report" | Report generation |

### 5.2 Multi-Language Agent Triggers

Test each agent with trigger keywords in:
- English (EN)
- Korean (KO)
- Japanese (JA)
- Chinese (ZH)
- Spanish (ES)
- French (FR)
- German (DE)
- Italian (IT)

---

## 6. Library Module Tests

### 6.1 Platform Adapter

```javascript
// Test: lib/adapters/gemini/index.js
const adapter = require('./lib/adapters/gemini');

// Verify tool name mapping
console.log(adapter.getToolName('Write')); // Expected: 'write_file'
console.log(adapter.getToolName('Edit')); // Expected: 'replace'
console.log(adapter.getToolName('Read')); // Expected: 'read_file'
```

### 6.2 Core Modules

| Module | Test | Expected |
|--------|------|----------|
| lib/core/platform.js | Platform detection | 'gemini' returned |
| lib/core/io.js | Hook I/O | Correct stdin/stdout |
| lib/core/cache.js | Cache operations | Set/get works |
| lib/core/config.js | Config loading | bkit.config.json loaded |
| lib/core/file.js | File utilities | Read/write works |
| lib/core/debug.js | Debug logging | Logs to stderr |

### 6.3 PDCA Modules

| Module | Test | Expected |
|--------|------|----------|
| lib/pdca/status.js | Status read/write | .pdca-status.json updated |
| lib/pdca/phase.js | Phase detection | Correct phase returned |
| lib/pdca/level.js | Level detection | Starter/Dynamic/Enterprise |
| lib/pdca/tier.js | Language tier | Tier1-3 detection |
| lib/pdca/automation.js | Auto-advance | Phase progression |

### 6.4 Intent Modules

| Module | Test | Expected |
|--------|------|----------|
| lib/intent/language.js | 8-language keywords | All languages work |
| lib/intent/trigger.js | Trigger matching | Correct skill/agent |
| lib/intent/ambiguity.js | Ambiguity scoring | Score 0-100 |

### 6.5 Task Modules

| Module | Test | Expected |
|--------|------|----------|
| lib/task/classification.js | Task classification | Correct task type |
| lib/task/context.js | Active context | Context retrieved |
| lib/task/creator.js | Task creation | Task created |
| lib/task/tracker.js | Task tracking | Status updated |

---

## 7. Integration Tests

### 7.1 Full PDCA Cycle

**Test Steps**:
1. `/pdca plan test-integration`
2. `/pdca design test-integration`
3. Implement feature based on design
4. `/pdca analyze test-integration`
5. If < 90%, `/pdca iterate test-integration`
6. `/pdca report test-integration`

**Expected Result**:
- All phases complete successfully
- Match rate >= 90%
- Completion report generated

### 7.2 Cross-Feature Context

**Test Steps**:
1. Start feature A with `/pdca plan feature-a`
2. Start feature B with `/pdca plan feature-b`
3. Check `/pdca status` shows both features

**Expected Result**:
- Multiple features tracked
- Correct feature context maintained

---

## 8. Error Handling Tests

### 8.1 Invalid Commands

| Test | Command | Expected |
|------|---------|----------|
| Unknown skill | `/unknown-skill` | Helpful error message |
| Missing feature name | `/pdca plan` | Prompt for feature name |
| Invalid phase | `/pdca invalidaction` | List valid actions |

### 8.2 File System Errors

| Test | Scenario | Expected |
|------|----------|----------|
| Read-only directory | Try to create plan | Permission error message |
| Missing docs folder | First PDCA command | Auto-create folder |
| Corrupted JSON | Invalid .pdca-status.json | Reset with warning |

---

## 9. Performance Tests

### 9.1 Startup Time

| Metric | Target | Measurement |
|--------|--------|-------------|
| Extension load time | < 500ms | Measure SessionStart |
| Hook execution time | < 100ms | Measure each hook |
| Skill activation time | < 200ms | Measure skill load |

### 9.2 Memory Usage

| Metric | Target |
|--------|--------|
| Base memory footprint | < 50MB |
| Cache size limit | < 10MB |
| Snapshot file size | < 1MB |

---

## 10. Test Execution Checklist

### 10.1 Phase 1: Basic Functionality

- [ ] Extension installs correctly
- [ ] Configuration files parse without error
- [ ] SessionStart hook fires on session start
- [ ] At least one skill activates correctly

### 10.2 Phase 2: Core Features

- [ ] All 7 hooks execute correctly
- [ ] All 21 skills activate
- [ ] All 11 agents trigger on keywords
- [ ] PDCA workflow completes full cycle

### 10.3 Phase 3: Integration

- [ ] Multi-language triggers work
- [ ] Cross-feature context maintained
- [ ] Error handling provides helpful messages
- [ ] Performance within targets

### 10.4 Phase 4: Edge Cases

- [ ] Large file handling
- [ ] Long conversations (context compression)
- [ ] Concurrent feature development
- [ ] Recovery from interrupted sessions

---

## 11. Test Results Template

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| T001 | Extension installation | | |
| T002 | SessionStart hook | | |
| T003 | PDCA plan creation | | |
| ... | ... | | |

---

## 12. Known Limitations

1. **Gemini CLI Availability**: Testing requires actual Gemini CLI installation
2. **Platform Differences**: Some behaviors may differ between platforms
3. **API Rate Limits**: Testing may be affected by Gemini API limits

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-01 | Initial test plan | POPUP STUDIO |
