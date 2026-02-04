# bkit 1.5.0 + Gemini CLI 0.28.0 Compatibility Test Plan

> **Summary**: Gemini CLI 0.28.0 환경에서 bkit 1.5.0의 모든 기능이 정상 동작하는지 검증하는 종합 테스트 계획서
>
> **Project**: bkit-gemini
> **Version**: 1.5.0
> **Author**: bkit PDCA System
> **Date**: 2026-02-04
> **Status**: Draft
> **Test Cases**: 187개

---

## 1. Overview

### 1.1 Purpose

Gemini CLI 0.25.0 → 0.28.0 버전 업그레이드 이후 bkit 1.5.0의 모든 기능이 정상 동작하는지 검증합니다.

### 1.2 Background

Gemini CLI 0.28.0에서 Hook 시스템 내부 마이그레이션, Skills GA, 설정 명명 변경 등 주요 변경사항이 있었습니다. 영향도 분석 결과 외부 API 호환성은 유지되나, 실제 동작 검증이 필요합니다.

### 1.3 Test Scope

| Category | Items | Test Count |
|----------|-------|:----------:|
| **Hooks** | 7 hooks | 21 |
| **Skills** | 21 skills | 63 |
| **Agents** | 11 agents | 33 |
| **PDCA Commands** | 9 commands | 27 |
| **MCP Server** | 3 tools | 9 |
| **Automation** | 5 features | 15 |
| **Integration** | End-to-end | 10 |
| **Regression** | Critical paths | 9 |
| **Total** | - | **187** |

---

## 2. Test Environment

### 2.1 Prerequisites

```bash
# Required versions
Gemini CLI: 0.28.0 (nightly or stable)
Node.js: 18.x or 20.x
npm: 9.x or 10.x

# Verify installation
gemini --version  # Expected: 0.28.0
node --version    # Expected: v18.x or v20.x
```

### 2.2 Test Project Setup

```bash
# Create test directory
mkdir -p /tmp/bkit-test-028
cd /tmp/bkit-test-028

# Initialize Next.js project
npx create-next-app@latest . --typescript --tailwind --app --src-dir

# Link bkit extension (development mode)
gemini extensions link /path/to/bkit-gemini

# Verify extension loaded
gemini extensions list
# Expected: bkit v1.5.0 listed
```

### 2.3 Success Criteria

| Level | Criteria | Threshold |
|-------|----------|:---------:|
| **Critical** | Hook system working | 100% |
| **High** | PDCA commands working | 100% |
| **Medium** | All agents callable | 95%+ |
| **Medium** | All skills loadable | 95%+ |
| **Low** | Automation features | 90%+ |

---

## 3. Test Categories

### 3.1 Test ID Convention

```
{CATEGORY}-{SUBCATEGORY}-{NUMBER}

Categories:
- HOOK: Hook system tests
- SKILL: Skill tests
- AGENT: Agent tests
- PDCA: PDCA command tests
- MCP: MCP server tests
- AUTO: Automation tests
- INT: Integration tests
- REG: Regression tests
```

---

## 4. Hook System Tests (HOOK-*)

> 7개 Hook 이벤트가 Gemini CLI 0.28.0에서 정상 작동하는지 검증

### 4.1 SessionStart Hook (HOOK-01)

#### HOOK-01-01: Basic Session Initialization
```
Input: Start new Gemini CLI session
Command: gemini

Expected Output:
- Hook executes without error
- PDCA status loaded (if exists)
- Session context initialized

Pass Criteria:
- No error messages in console
- Response includes bkit version or PDCA mention

Verify:
- Check ~/.gemini/bkit-debug.log for "SessionStart" entry
```

#### HOOK-01-02: Session Resume with Existing PDCA
```
Prerequisite:
- Create docs/.pdca-status.json with active feature

Input: gemini

Expected Output:
- Previous PDCA status restored
- Active feature mentioned

Pass Criteria:
- "Continue bkit-gemini-conversion" or similar message appears
```

#### HOOK-01-03: Session Start with Clean State
```
Prerequisite:
- Remove docs/.pdca-status.json

Input: gemini

Expected Output:
- Clean session start
- No errors about missing files

Pass Criteria:
- Session starts normally
```

### 4.2 BeforeAgent Hook (HOOK-02)

#### HOOK-02-01: Intent Detection - Agent Trigger
```
Input: "verify the implementation"

Expected Output:
- BeforeAgent hook detects "verify" keyword
- Suggests gap-detector agent

Pass Criteria:
- Response mentions gap analysis or verification
```

#### HOOK-02-02: Intent Detection - Skill Trigger
```
Input: "build a static website"

Expected Output:
- BeforeAgent detects "static website" keyword
- Suggests starter skill

Pass Criteria:
- Response mentions Starter level or static development
```

#### HOOK-02-03: Intent Detection - Multilingual (Korean)
```
Input: "검증해줘"

Expected Output:
- Korean keyword detected
- Agent trigger matched

Pass Criteria:
- Response in appropriate language or context
```

#### HOOK-02-04: Ambiguity Detection
```
Input: "improve it"

Expected Output:
- Ambiguity score > 0.5 detected
- Clarifying questions suggested

Pass Criteria:
- AskUserQuestion or clarification request appears
```

#### HOOK-02-05: New Feature Intent Detection
```
Input: "create a login feature"

Expected Output:
- New feature detected
- PDCA plan suggestion

Pass Criteria:
- Suggests "/pdca plan login" or similar
```

### 4.3 BeforeTool Hook (HOOK-03)

#### HOOK-03-01: write_file Tool Interception
```
Input: Create a new file using write_file

Expected Output:
- Hook executes before file creation
- No blocking unless security concern

Pass Criteria:
- File created successfully
- Hook logged in debug log
```

#### HOOK-03-02: run_shell_command Tool Interception
```
Input: Run a safe shell command

Expected Output:
- Hook executes before command
- Command proceeds if safe

Pass Criteria:
- Command executes successfully
```

#### HOOK-03-03: Dangerous Command Detection
```
Input: "rm -rf /" (should be blocked by permissions)

Expected Output:
- Command blocked
- Warning message shown

Pass Criteria:
- Command NOT executed
- Security warning displayed
```

### 4.4 AfterTool Hook (HOOK-04)

#### HOOK-04-01: write_file Post-Processing
```
Input: Create a file and check post-processing

Expected Output:
- Hook executes after file creation
- Context updated if needed

Pass Criteria:
- File created
- Hook logged
```

#### HOOK-04-02: Skill Execution Tracking
```
Input: /pdca status

Expected Output:
- AfterTool hook tracks skill execution
- State updated appropriately

Pass Criteria:
- No errors
- State consistent
```

### 4.5 AfterAgent Hook (HOOK-05)

#### HOOK-05-01: Gap Detector Completion
```
Prerequisite:
- Active PDCA feature with design document

Input: /pdca analyze {feature}

Expected Output:
- AfterAgent hook processes completion
- Match rate recorded in .pdca-status.json
- Next step suggested

Pass Criteria:
- PDCA status updated
- Appropriate next action suggested
```

#### HOOK-05-02: Iterator Completion
```
Input: /pdca iterate {feature}

Expected Output:
- Iteration count incremented
- Phase transition recorded

Pass Criteria:
- iterationCount increased
- History entry added
```

#### HOOK-05-03: Report Completion
```
Input: /pdca report {feature}

Expected Output:
- Feature marked as completed
- Completion message displayed

Pass Criteria:
- phase = "completed" in status
```

### 4.6 PreCompress Hook (HOOK-06)

#### HOOK-06-01: Context Preservation
```
Prerequisite:
- Long conversation to trigger compression

Input: Continue conversation until context compression

Expected Output:
- PreCompress hook saves context snapshot
- .bkit-memory.json updated

Pass Criteria:
- Memory file contains conversation summary
- No data loss after compression
```

### 4.7 SessionEnd Hook (HOOK-07)

#### HOOK-07-01: Clean Session Exit
```
Input: Exit Gemini CLI (Ctrl+C or /exit)

Expected Output:
- SessionEnd hook executes
- Cleanup performed
- Final state saved

Pass Criteria:
- No errors on exit
- State persisted correctly
```

---

## 5. Skills Tests (SKILL-*)

> 21개 스킬이 정상 로드되고 동작하는지 검증

### 5.1 PDCA Skill (SKILL-01)

#### SKILL-01-01: /pdca plan
```
Input: /pdca plan test-feature

Expected:
- Plan document created at docs/01-plan/features/test-feature.plan.md
- Document follows plan.template.md structure

Pass: File exists with proper sections
```

#### SKILL-01-02: /pdca design
```
Prerequisite: Plan document exists

Input: /pdca design test-feature

Expected:
- Design document created at docs/02-design/features/test-feature.design.md

Pass: File exists with proper sections
```

#### SKILL-01-03: /pdca do
```
Prerequisite: Design document exists

Input: /pdca do test-feature

Expected:
- Implementation guide provided
- Phase set to "do"

Pass: Guidance provided, status updated
```

#### SKILL-01-04: /pdca analyze
```
Prerequisite: Implementation exists

Input: /pdca analyze test-feature

Expected:
- Gap analysis performed
- Match rate calculated

Pass: Analysis report generated
```

#### SKILL-01-05: /pdca iterate
```
Prerequisite: Match rate < 90%

Input: /pdca iterate test-feature

Expected:
- Auto-improvement cycle initiated
- Issues addressed

Pass: Iteration logged, improvements made
```

#### SKILL-01-06: /pdca report
```
Prerequisite: Match rate >= 90%

Input: /pdca report test-feature

Expected:
- Completion report generated
- Feature marked complete

Pass: Report in docs/04-report/
```

#### SKILL-01-07: /pdca status
```
Input: /pdca status

Expected:
- Current PDCA status displayed
- Active features listed

Pass: Status information shown
```

#### SKILL-01-08: /pdca next
```
Input: /pdca next

Expected:
- Next recommended action shown

Pass: Appropriate guidance provided
```

#### SKILL-01-09: /pdca archive
```
Input: /pdca archive test-feature

Expected:
- Feature documents archived
- Status updated

Pass: Documents moved/archived
```

### 5.2 Level Skills (SKILL-02 ~ SKILL-04)

#### SKILL-02-01: /starter Activation
```
Input: /starter

Expected:
- Starter skill loaded
- Static site guidance provided

Pass: Skill context injected
```

#### SKILL-02-02: /starter init
```
Input: /starter init

Expected:
- Starter project initialized
- Basic structure created

Pass: Project structure created
```

#### SKILL-03-01: /dynamic Activation
```
Input: /dynamic

Expected:
- Dynamic skill loaded
- Fullstack guidance provided

Pass: Skill context injected
```

#### SKILL-03-02: /dynamic init
```
Input: /dynamic init

Expected:
- Dynamic project initialized
- bkend.ai integration prepared

Pass: Project structure with backend setup
```

#### SKILL-04-01: /enterprise Activation
```
Input: /enterprise

Expected:
- Enterprise skill loaded
- Microservices guidance provided

Pass: Skill context injected
```

#### SKILL-04-02: /enterprise init
```
Input: /enterprise init

Expected:
- Enterprise project initialized
- Monorepo structure created

Pass: Enterprise-grade structure
```

### 5.3 Phase Skills (SKILL-05 ~ SKILL-13)

#### SKILL-05-01: Phase 1 Schema
```
Input: /phase-1-schema

Expected:
- Schema skill loaded
- Terminology/data model guidance

Pass: Schema guidance provided
```

#### SKILL-06-01: Phase 2 Convention
```
Input: /phase-2-convention

Expected:
- Convention skill loaded
- Coding standards guidance

Pass: Convention guidance provided
```

#### SKILL-07-01: Phase 3 Mockup
```
Input: /phase-3-mockup

Expected:
- Mockup skill loaded
- UI/UX prototyping guidance

Pass: Mockup guidance provided
```

#### SKILL-08-01: Phase 4 API
```
Input: /phase-4-api

Expected:
- API skill loaded
- Backend API design guidance

Pass: API guidance provided
```

#### SKILL-09-01: Phase 5 Design System
```
Input: /phase-5-design-system

Expected:
- Design system skill loaded
- Component library guidance

Pass: Design system guidance provided
```

#### SKILL-10-01: Phase 6 UI Integration
```
Input: /phase-6-ui-integration

Expected:
- UI integration skill loaded
- Frontend-backend integration guidance

Pass: Integration guidance provided
```

#### SKILL-11-01: Phase 7 SEO Security
```
Input: /phase-7-seo-security

Expected:
- SEO/Security skill loaded
- Optimization and hardening guidance

Pass: SEO/Security guidance provided
```

#### SKILL-12-01: Phase 8 Review
```
Input: /phase-8-review

Expected:
- Review skill loaded
- Quality verification guidance

Pass: Review guidance provided
```

#### SKILL-13-01: Phase 9 Deployment
```
Input: /phase-9-deployment

Expected:
- Deployment skill loaded
- CI/CD and deployment guidance

Pass: Deployment guidance provided
```

### 5.4 Utility Skills (SKILL-14 ~ SKILL-21)

#### SKILL-14-01: /code-review
```
Input: /code-review

Expected:
- Code review skill loaded
- Analysis performed on codebase

Pass: Review report generated
```

#### SKILL-15-01: /zero-script-qa
```
Input: /zero-script-qa

Expected:
- Zero Script QA skill loaded
- Log-based testing guidance

Pass: QA guidance provided
```

#### SKILL-16-01: /development-pipeline
```
Input: /development-pipeline

Expected:
- Pipeline skill loaded
- 9-phase pipeline guidance

Pass: Pipeline status shown
```

#### SKILL-16-02: /development-pipeline start
```
Input: /development-pipeline start

Expected:
- Pipeline started from Phase 1
- Schema guidance activated

Pass: Phase 1 started
```

#### SKILL-16-03: /development-pipeline next
```
Prerequisite: Currently in Phase 1

Input: /development-pipeline next

Expected:
- Move to Phase 2
- Convention guidance activated

Pass: Phase transition successful
```

#### SKILL-17-01: /bkit
```
Input: /bkit

Expected:
- bkit help displayed
- All available commands listed

Pass: Help information shown
```

#### SKILL-18-01: /gemini-cli-learning
```
Input: /claude-code-learning

Expected:
- Learning skill loaded
- Claude Code configuration guidance

Pass: Learning guidance provided
```

#### SKILL-19-01: /bkit-templates
```
Input: /bkit-templates

Expected:
- Templates skill loaded
- PDCA template information

Pass: Template information shown
```

#### SKILL-20-01: /mobile-app
```
Input: /mobile-app

Expected:
- Mobile app skill loaded
- React Native/Flutter guidance

Pass: Mobile guidance provided
```

#### SKILL-21-01: /desktop-app
```
Input: /desktop-app

Expected:
- Desktop app skill loaded
- Electron/Tauri guidance

Pass: Desktop guidance provided
```

---

## 6. Agent Tests (AGENT-*)

> 11개 에이전트가 정상 호출되고 동작하는지 검증

### 6.1 gap-detector (AGENT-01)

#### AGENT-01-01: Manual Invocation
```
Input: Run gap analysis between design and implementation

Expected:
- gap-detector agent invoked
- Design-implementation comparison performed
- Match rate calculated

Pass: Analysis report with match rate
```

#### AGENT-01-02: Auto-Trigger via Keyword
```
Input: "Is this implementation correct?"

Expected:
- "correct" keyword triggers gap-detector
- Verification performed

Pass: Verification response provided
```

#### AGENT-01-03: Korean Trigger
```
Input: "이거 맞아?"

Expected:
- Korean keyword triggers gap-detector

Pass: Response in context
```

### 6.2 design-validator (AGENT-02)

#### AGENT-02-01: Design Document Validation
```
Prerequisite: Design document exists

Input: Validate the design document

Expected:
- design-validator agent invoked
- Completeness check performed

Pass: Validation report generated
```

### 6.3 pdca-iterator (AGENT-03)

#### AGENT-03-01: Auto-Improvement Cycle
```
Prerequisite: Gap analysis with < 90% match

Input: /pdca iterate test-feature

Expected:
- pdca-iterator agent invoked
- Improvements made
- Re-verification triggered

Pass: Iteration completed, match rate improved
```

#### AGENT-03-02: Max Iteration Limit
```
Prerequisite: Already 5 iterations

Input: /pdca iterate test-feature

Expected:
- Warning about max iterations
- Manual review suggested

Pass: Iteration limit enforced
```

### 6.4 code-analyzer (AGENT-04)

#### AGENT-04-01: Code Quality Analysis
```
Input: Analyze the code quality

Expected:
- code-analyzer agent invoked
- Quality metrics calculated
- Issues identified

Pass: Analysis report generated
```

#### AGENT-04-02: Security Scan
```
Input: Check for security issues

Expected:
- Security scan performed
- Vulnerabilities reported

Pass: Security report generated
```

### 6.5 report-generator (AGENT-05)

#### AGENT-05-01: PDCA Completion Report
```
Prerequisite: PDCA cycle completed

Input: /pdca report test-feature

Expected:
- report-generator agent invoked
- Completion report created

Pass: Report in docs/04-report/
```

### 6.6 qa-monitor (AGENT-06)

#### AGENT-06-01: Docker Log Monitoring
```
Prerequisite: Docker container running

Input: Monitor docker logs for issues

Expected:
- qa-monitor agent invoked
- Log analysis performed

Pass: Issues reported from logs
```

### 6.7 starter-guide (AGENT-07)

#### AGENT-07-01: Beginner Assistance
```
Input: "I'm new to web development, help me"

Expected:
- starter-guide agent invoked
- Beginner-friendly guidance

Pass: Simple, clear guidance provided
```

### 6.8 pipeline-guide (AGENT-08)

#### AGENT-08-01: Pipeline Navigation
```
Input: "Where should I start?"

Expected:
- pipeline-guide agent invoked
- 9-phase pipeline explained

Pass: Pipeline guidance provided
```

### 6.9 bkend-expert (AGENT-09)

#### AGENT-09-01: BaaS Integration
```
Input: "How do I add authentication?"

Expected:
- bkend-expert agent invoked
- bkend.ai integration guidance

Pass: Auth setup guidance provided
```

### 6.10 enterprise-expert (AGENT-10)

#### AGENT-10-01: Architecture Guidance
```
Input: "How should I structure microservices?"

Expected:
- enterprise-expert agent invoked
- Microservices architecture guidance

Pass: Architecture recommendations provided
```

### 6.11 infra-architect (AGENT-11)

#### AGENT-11-01: Infrastructure Design
```
Input: "Set up Kubernetes deployment"

Expected:
- infra-architect agent invoked
- K8s setup guidance

Pass: Infrastructure guidance provided
```

---

## 7. MCP Server Tests (MCP-*)

> MCP spawn_agent 서버가 정상 동작하는지 검증

### 7.1 spawn_agent Tool (MCP-01)

#### MCP-01-01: Basic Agent Spawn
```
Input: Use spawn_agent tool to invoke gap-detector

Expected:
- MCP server receives request
- Agent context loaded
- Response returned

Pass: Agent response received
```

#### MCP-01-02: Invalid Agent Name
```
Input: Use spawn_agent with invalid agent name

Expected:
- Error returned
- Available agents listed

Pass: Graceful error handling
```

#### MCP-01-03: Agent with Context
```
Input: Spawn agent with additional context

Expected:
- Context passed to agent
- Context-aware response

Pass: Context utilized in response
```

### 7.2 list_agents Tool (MCP-02)

#### MCP-02-01: List All Agents
```
Input: Use list_agents tool

Expected:
- All 11 agents listed
- Descriptions included

Pass: Complete agent list returned
```

### 7.3 get_agent_info Tool (MCP-03)

#### MCP-03-01: Get Agent Details
```
Input: Use get_agent_info for gap-detector

Expected:
- Agent description returned
- Recommended model shown
- Triggers listed

Pass: Complete agent info returned
```

---

## 8. Automation Tests (AUTO-*)

> 자동화 기능이 정상 동작하는지 검증

### 8.1 Intent Detection (AUTO-01)

#### AUTO-01-01: English Intent
```
Input: "verify the implementation is correct"

Expected:
- Intent detected: verification
- Agent: gap-detector suggested

Pass: Correct intent detection
```

#### AUTO-01-02: Korean Intent
```
Input: "코드 품질 분석해줘"

Expected:
- Intent detected: code analysis
- Agent: code-analyzer suggested

Pass: Korean intent detected
```

#### AUTO-01-03: Japanese Intent
```
Input: "設計を検証して"

Expected:
- Intent detected: verification
- Agent: gap-detector suggested

Pass: Japanese intent detected
```

#### AUTO-01-04: Chinese Intent
```
Input: "验证实现是否正确"

Expected:
- Intent detected: verification

Pass: Chinese intent detected
```

### 8.2 Level Auto-Detection (AUTO-02)

#### AUTO-02-01: Starter Level Detection
```
Setup: Empty project with only HTML/CSS

Input: Start working on the project

Expected:
- Starter level detected
- Starter guidance activated

Pass: Level = "Starter"
```

#### AUTO-02-02: Dynamic Level Detection
```
Setup: Project with docker-compose.yml and api/ folder

Input: Start working on the project

Expected:
- Dynamic level detected

Pass: Level = "Dynamic"
```

#### AUTO-02-03: Enterprise Level Detection
```
Setup: Project with kubernetes/ and terraform/ folders

Input: Start working on the project

Expected:
- Enterprise level detected

Pass: Level = "Enterprise"
```

### 8.3 Ambiguity Detection (AUTO-03)

#### AUTO-03-01: Ambiguous Request
```
Input: "fix it"

Expected:
- Ambiguity score > 0.5
- Clarifying questions asked

Pass: Questions presented
```

#### AUTO-03-02: Clear Request
```
Input: "Add a login button to the header component in src/components/Header.tsx"

Expected:
- Ambiguity score < 0.5
- Direct action taken

Pass: No clarifying questions
```

### 8.4 Skill Auto-Trigger (AUTO-04)

#### AUTO-04-01: API Keywords
```
Input: "Design the REST API endpoints"

Expected:
- phase-4-api skill auto-activated

Pass: API skill context loaded
```

#### AUTO-04-02: Deployment Keywords
```
Input: "Deploy to production with CI/CD"

Expected:
- phase-9-deployment skill auto-activated

Pass: Deployment skill context loaded
```

### 8.5 Agent Auto-Trigger (AUTO-05)

#### AUTO-05-01: Help Keywords
```
Input: "I need help understanding this"

Expected:
- starter-guide agent suggested

Pass: Beginner guidance offered
```

#### AUTO-05-02: Report Keywords
```
Input: "Generate a summary report"

Expected:
- report-generator agent suggested

Pass: Report generation offered
```

---

## 9. Integration Tests (INT-*)

> 전체 워크플로우 통합 테스트

### 9.1 Full PDCA Cycle (INT-01)

#### INT-01-01: Complete PDCA Cycle
```
Test Steps:
1. /pdca plan test-integration
2. /pdca design test-integration
3. Implement the feature
4. /pdca analyze test-integration
5. If < 90%: /pdca iterate test-integration
6. /pdca report test-integration

Expected:
- All phases complete
- Documents created at each phase
- Status tracked throughout

Pass: Complete cycle with report
```

### 9.2 Hook Chain (INT-02)

#### INT-02-01: Session Lifecycle
```
Test Steps:
1. Start session (SessionStart)
2. Send message (BeforeAgent)
3. Use write_file (BeforeTool, AfterTool)
4. Complete task (AfterAgent)
5. Exit session (SessionEnd)

Expected:
- All hooks fire in sequence
- No errors

Pass: Complete hook chain
```

### 9.3 Skill-Agent Interaction (INT-03)

#### INT-03-01: PDCA with Agent Delegation
```
Test Steps:
1. /pdca analyze test-feature
2. Observe gap-detector invocation
3. Check match rate calculation

Expected:
- Skill delegates to agent
- Agent returns result
- Skill processes result

Pass: Seamless delegation
```

### 9.4 Multilingual Workflow (INT-04)

#### INT-04-01: Korean Workflow
```
Test Steps:
1. "새로운 기능 만들어줘"
2. "/pdca plan 새기능"
3. "설계 검증해줘"

Expected:
- Korean understood throughout
- Responses appropriate

Pass: Korean workflow complete
```

### 9.5 MCP + Hooks Integration (INT-05)

#### INT-05-01: Agent Spawn with Hooks
```
Test Steps:
1. Trigger agent via keyword
2. Observe BeforeAgent hook
3. Agent executes
4. Observe AfterAgent hook

Expected:
- Hooks fire around agent execution
- State updated correctly

Pass: Integrated flow works
```

---

## 10. Regression Tests (REG-*)

> Gemini CLI 0.28.0 특정 변경사항 영향 테스트

### 10.1 Hook Migration (REG-01)

#### REG-01-01: BeforeAgent Hook Still Works
```
Background: PR #16919 removed fireBeforeAgentHook internally

Input: Send any message

Expected:
- BeforeAgent hook still fires
- Intent detection works

Pass: Hook fires correctly
```

#### REG-01-02: AfterAgent Hook Still Works
```
Background: PR #16919 removed fireAfterAgentHook internally

Input: Complete any agent task

Expected:
- AfterAgent hook still fires
- State updates correctly

Pass: Hook fires correctly
```

### 10.2 Skills GA (REG-02)

#### REG-02-01: Experimental Flag Ignored
```
Background: Skills now GA, experimental flag should be ignored

Setup: gemini-extension.json has "experimental": { "skills": true }

Input: Use any skill

Expected:
- Skill works regardless of flag
- No warnings about experimental

Pass: Skills work normally
```

### 10.3 Settings Migration (REG-03)

#### REG-03-01: Hook Settings
```
Background: Negative settings renamed to positive

Input: Check hook configuration

Expected:
- Hooks enabled by default
- Old settings don't cause errors

Pass: Hooks work correctly
```

---

## 11. Test Execution Plan

### 11.1 Test Priority

| Priority | Categories | Execute When |
|----------|------------|--------------|
| **P0** | HOOK-*, REG-* | First - Critical path |
| **P1** | PDCA-*, MCP-* | Second - Core features |
| **P2** | SKILL-*, AGENT-* | Third - Feature coverage |
| **P3** | AUTO-*, INT-* | Fourth - Edge cases |

### 11.2 Execution Order

```
Phase 1: Critical (P0) - 30 tests
├── Hook System Tests (21)
└── Regression Tests (9)

Phase 2: Core (P1) - 36 tests
├── PDCA Command Tests (27)
└── MCP Server Tests (9)

Phase 3: Coverage (P2) - 96 tests
├── Skill Tests (63)
└── Agent Tests (33)

Phase 4: Edge Cases (P3) - 25 tests
├── Automation Tests (15)
└── Integration Tests (10)
```

### 11.3 Test Result Template

```markdown
## Test Result: {TEST-ID}

- **Date**: YYYY-MM-DD HH:MM
- **Gemini CLI Version**: 0.28.0-nightly.YYYYMMDD
- **bkit Version**: 1.5.0
- **Result**: PASS / FAIL
- **Notes**: {observations}

### Evidence
{Screenshot or log output}
```

---

## 12. Success Criteria

### 12.1 Overall Pass Rate

| Category | Target | Required |
|----------|:------:|:--------:|
| Critical (P0) | 100% | Yes |
| Core (P1) | 100% | Yes |
| Coverage (P2) | 95% | Yes |
| Edge Cases (P3) | 90% | No |

### 12.2 Certification

```
bkit 1.5.0 is certified compatible with Gemini CLI 0.28.0 when:
- All P0 tests pass (100%)
- All P1 tests pass (100%)
- P2 tests pass at 95%+ rate
```

---

## 13. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|:------:|:----------:|------------|
| Hook internal changes break hooks | High | Low | Regression tests cover this |
| Skills don't load | High | Low | Skill tests verify each skill |
| MCP server connection issues | Medium | Low | MCP tests verify server |
| Multilingual detection fails | Low | Low | AUTO tests cover 8 languages |

---

## 14. Next Steps

1. [ ] Set up test environment with Gemini CLI 0.28.0
2. [ ] Execute P0 (Critical) tests
3. [ ] Execute P1 (Core) tests
4. [ ] Execute P2 (Coverage) tests
5. [ ] Execute P3 (Edge Cases) tests
6. [ ] Document results
7. [ ] Create `/pdca design` for any fixes needed
8. [ ] Certify compatibility or document issues

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-04 | Initial draft with 187 test cases | bkit PDCA System |
