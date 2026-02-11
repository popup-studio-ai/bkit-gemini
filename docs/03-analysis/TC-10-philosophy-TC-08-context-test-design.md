# TC-10: Philosophy Alignment & TC-08: Context Engineering Test Design

> bkit-gemini v1.5.1 - Gemini CLI Interactive Test Procedures
> Total: 74 test cases (TC-10: 59 cases + TC-08: 15 cases)
> Author: Product Manager Agent
> Date: 2026-02-11

---

## Test Environment Prerequisites

| Item | Requirement |
|------|------------|
| **Gemini CLI** | v0.28+ installed and authenticated |
| **bkit-gemini** | v1.5.1 installed as Gemini CLI extension |
| **Node.js** | v18+ |
| **Test Projects** | 3 pre-prepared project directories (Starter/Dynamic/Enterprise) |
| **Clean State** | Delete `docs/.pdca-status.json` and `docs/.bkit-memory.json` before each test group |

### Test Project Setup

```bash
# Starter project (bare minimum)
mkdir /tmp/test-starter && cd /tmp/test-starter
echo "<html><body>Hello</body></html>" > index.html

# Dynamic project (Next.js + BaaS indicators)
mkdir /tmp/test-dynamic && cd /tmp/test-dynamic
mkdir -p lib/bkend api
echo '{"dependencies":{"next":"14.0.0","bkend":"1.0.0"}}' > package.json
touch docker-compose.yml

# Enterprise project (K8s + infra)
mkdir /tmp/test-enterprise && cd /tmp/test-enterprise
mkdir -p kubernetes terraform services/auth services/gateway infra
echo '{"name":"enterprise-app"}' > package.json
```

---

## TC-10: Philosophy Alignment Test Design (59 cases)

### 10.1 Automation First (AF-01 ~ AF-14)

---

#### AF-01: Level Auto-Detection - Starter
**Philosophy**: Automation First - Level auto-detection
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Start Gemini CLI in `/tmp/test-starter` (only index.html exists)
**Steps**:
1. Open terminal and navigate to `/tmp/test-starter`
2. Delete any existing `docs/.pdca-status.json` and `docs/.bkit-memory.json`
3. Run `gemini` to start a new session
4. Wait for the SessionStart hook to execute
5. Type: `What is my project level?`
**Expected Behavior**: bkit SessionStart hook detects the project as "Starter" level. The session metadata includes `level: "Starter"`. When asked about project level, Gemini responds with Starter.
**Pass Criteria**: Response explicitly mentions "Starter" level; `docs/.pdca-status.json` contains `"level": "Starter"` in pipeline section
**Fail Criteria**: Level detected as "Dynamic" or "Enterprise"; no level detection occurs; `.pdca-status.json` not created

---

#### AF-02: Level Auto-Detection - Dynamic
**Philosophy**: Automation First - Level auto-detection
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Start Gemini CLI in `/tmp/test-dynamic` (has `lib/bkend/`, `api/`, `docker-compose.yml`)
**Steps**:
1. Open terminal and navigate to `/tmp/test-dynamic`
2. Delete any existing `docs/.pdca-status.json` and `docs/.bkit-memory.json`
3. Run `gemini` to start a new session
4. Wait for the SessionStart hook to execute
5. Type: `What level is this project?`
**Expected Behavior**: bkit detects `lib/bkend` or `docker-compose.yml` and classifies as "Dynamic" level
**Pass Criteria**: Response includes "Dynamic" level; `docs/.pdca-status.json` contains `"level": "Dynamic"`
**Fail Criteria**: Level detected as "Starter" or "Enterprise"

---

#### AF-03: Level Auto-Detection - Enterprise
**Philosophy**: Automation First - Level auto-detection
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Start Gemini CLI in `/tmp/test-enterprise` (has `kubernetes/`, `terraform/`)
**Steps**:
1. Open terminal and navigate to `/tmp/test-enterprise`
2. Delete any existing `docs/.pdca-status.json` and `docs/.bkit-memory.json`
3. Run `gemini` to start a new session
4. Wait for the SessionStart hook to execute
5. Type: `What level did bkit detect for this project?`
**Expected Behavior**: bkit detects `kubernetes/` directory and classifies as "Enterprise" level
**Pass Criteria**: Response includes "Enterprise" level; `docs/.pdca-status.json` contains `"level": "Enterprise"`
**Fail Criteria**: Level detected as "Starter" or "Dynamic"

---

#### AF-04: Agent Trigger - Korean Language
**Philosophy**: Automation First - 8-language agent triggers
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Active Gemini CLI session in any test project
**Steps**:
1. Start a Gemini CLI session
2. Type: `이 코드 검증해줘` (Korean for "verify this code")
**Expected Behavior**: BeforeAgent hook detects Korean keyword "검증" and triggers `gap-detector` agent context. Response references gap analysis or verification workflow.
**Pass Criteria**: Response includes gap analysis or verification concepts; hook output shows `gap-detector` trigger detected
**Fail Criteria**: No agent trigger detected; response is generic without verification context

---

#### AF-05: Agent Trigger - Japanese Language
**Philosophy**: Automation First - 8-language agent triggers
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Active Gemini CLI session in any test project
**Steps**:
1. Start a Gemini CLI session
2. Type: `コードを改善してください` (Japanese for "please improve the code")
**Expected Behavior**: BeforeAgent hook detects Japanese keyword "改善" and triggers `pdca-iterator` agent context
**Pass Criteria**: Response references improvement or iteration concepts; hook detects `pdca-iterator` trigger
**Fail Criteria**: No agent trigger detected; generic response without improvement context

---

#### AF-06: Agent Trigger - Spanish Language
**Philosophy**: Automation First - 8-language agent triggers
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Active Gemini CLI session in any test project
**Steps**:
1. Start a Gemini CLI session
2. Type: `Necesito verificar la calidad del codigo`
**Expected Behavior**: BeforeAgent hook detects Spanish keyword "verificar" and triggers `gap-detector` agent context
**Pass Criteria**: Response references verification or quality analysis; hook detects agent trigger
**Fail Criteria**: No trigger detected; generic response

---

#### AF-07: Agent Trigger - German Language
**Philosophy**: Automation First - 8-language agent triggers
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Active Gemini CLI session in any test project
**Steps**:
1. Start a Gemini CLI session
2. Type: `Bitte den Code verbessern und optimieren`
**Expected Behavior**: BeforeAgent hook detects German keyword "verbessern" and triggers `pdca-iterator` agent context
**Pass Criteria**: Response references improvement or optimization; hook detects `pdca-iterator`
**Fail Criteria**: No trigger detected

---

#### AF-08: Agent Trigger - Chinese Language
**Philosophy**: Automation First - 8-language agent triggers
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Active Gemini CLI session in any test project
**Steps**:
1. Start a Gemini CLI session
2. Type: `请分析代码质量` (Chinese for "please analyze code quality")
**Expected Behavior**: BeforeAgent hook detects Chinese keywords "分析" / "质量" and triggers `code-analyzer` agent context
**Pass Criteria**: Response references code analysis or quality review; hook detects `code-analyzer`
**Fail Criteria**: No trigger detected; generic response

---

#### AF-09: Agent Trigger - English Language
**Philosophy**: Automation First - 8-language agent triggers
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Active Gemini CLI session in any test project
**Steps**:
1. Start a Gemini CLI session
2. Type: `I need to verify this implementation against the design`
**Expected Behavior**: BeforeAgent hook detects English keyword "verify" and triggers `gap-detector` agent context
**Pass Criteria**: Response references gap analysis or design-implementation verification; hook detects `gap-detector`
**Fail Criteria**: No trigger detected

---

#### AF-10: Agent Trigger - French Language
**Philosophy**: Automation First - 8-language agent triggers
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Active Gemini CLI session in any test project
**Steps**:
1. Start a Gemini CLI session
2. Type: `Veuillez analyser la qualite du code`
**Expected Behavior**: BeforeAgent hook detects French keyword "analyser" and triggers `code-analyzer` agent context
**Pass Criteria**: Response references code analysis; hook detects `code-analyzer`
**Fail Criteria**: No trigger detected

---

#### AF-11: Agent Trigger - Italian Language
**Philosophy**: Automation First - 8-language agent triggers
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Active Gemini CLI session in any test project
**Steps**:
1. Start a Gemini CLI session
2. Type: `Per favore, migliora questo codice`
**Expected Behavior**: BeforeAgent hook detects Italian keyword "migliorare" and triggers `pdca-iterator` agent context
**Pass Criteria**: Response references improvement; hook detects `pdca-iterator`
**Fail Criteria**: No trigger detected

---

#### AF-12: Output Style Auto-Selection - Starter
**Philosophy**: Automation First - Output style auto-selection per level
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Start Gemini CLI in `/tmp/test-starter` with clean state
**Steps**:
1. Navigate to `/tmp/test-starter`
2. Delete `docs/.bkit-memory.json` if exists
3. Run `gemini`
4. Type: `Help me understand how to create a web page`
**Expected Behavior**: SessionStart hook detects Starter level and loads `bkit-learning` output style. Response includes learning-oriented content (concept explanations, learning points).
**Pass Criteria**: `docs/.bkit-memory.json` reflects Starter-level style; response tone is beginner-friendly with learning guidance
**Fail Criteria**: Enterprise-style response with tradeoff analysis; no output style applied

---

#### AF-13: Output Style Auto-Selection - Enterprise
**Philosophy**: Automation First - Output style auto-selection per level
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Start Gemini CLI in `/tmp/test-enterprise` with clean state
**Steps**:
1. Navigate to `/tmp/test-enterprise`
2. Delete `docs/.bkit-memory.json` if exists
3. Run `gemini`
4. Type: `How should I structure the authentication microservice?`
**Expected Behavior**: SessionStart hook detects Enterprise level and loads `bkit-enterprise` output style. Response includes CTO-level analysis (tradeoff tables, cost impact).
**Pass Criteria**: Response includes architectural analysis appropriate for Enterprise level; metadata shows `outputStyle: "bkit-enterprise"`
**Fail Criteria**: Beginner-friendly learning-style response; no output style applied

---

#### AF-14: PDCA Auto-Progression Suggestion
**Philosophy**: Automation First - PDCA auto-progression
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Start in `/tmp/test-dynamic` with clean state; create a plan document manually: `mkdir -p docs/01-plan/features && echo "# Auth Plan" > docs/01-plan/features/auth.plan.md`
**Steps**:
1. Navigate to `/tmp/test-dynamic`
2. Manually set `.pdca-status.json` with a feature "auth" at phase "plan"
3. Run `gemini`
4. Type: `What should I do next for the auth feature?`
**Expected Behavior**: bkit reads `.pdca-status.json`, sees "auth" at "plan" phase, and recommends progressing to "design" phase with `/pdca design auth`
**Pass Criteria**: Response suggests `/pdca design auth` as next step; references PDCA workflow progression
**Fail Criteria**: No PDCA progression suggestion; suggests starting from scratch

---

### 10.2 No Guessing (NG-01 ~ NG-12)

---

#### NG-01: Design Document Check Before Implementation
**Philosophy**: No Guessing - Design document check before implementation
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Start in `/tmp/test-dynamic` with no design documents; clean PDCA status
**Steps**:
1. Navigate to `/tmp/test-dynamic`
2. Ensure no `docs/02-design/` directory exists
3. Run `gemini`
4. Wait for welcome message
5. Type: `Implement a user authentication system with JWT tokens`
**Expected Behavior**: bkit detects a new feature implementation request. BeforeAgent hook identifies "implement" as a feature intent. PDCA rules enforce creating plan/design documents before implementation. Response suggests starting with `/pdca plan auth` instead of coding directly.
**Pass Criteria**: Response mentions creating a plan or design document first; does NOT immediately generate implementation code; references PDCA workflow
**Fail Criteria**: Immediately generates JWT implementation code without mentioning documentation

---

#### NG-02: Ambiguity Detection - Vague Request
**Philosophy**: No Guessing - Ambiguity detection (score > 0.5)
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Active Gemini CLI session in any test project
**Steps**:
1. Start a Gemini CLI session
2. Type: `Make it better`
**Expected Behavior**: BeforeAgent hook calculates ambiguity score. "Make it better" has: short length (+0.2), no specific nouns (+0.2), no technical terms (+0.2) = 0.6 > 0.5. Hook injects note about ambiguity. Response asks clarifying questions.
**Pass Criteria**: Response includes one or more clarifying questions asking what "it" refers to and what "better" means
**Fail Criteria**: Response proceeds with assumptions; no clarifying questions asked

---

#### NG-03: Ambiguity Detection - Clear Request
**Philosophy**: No Guessing - Ambiguity detection (score <= 0.5)
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Active Gemini CLI session in any test project
**Steps**:
1. Start a Gemini CLI session
2. Type: `Fix the bug in the login component where the error message is not displayed`
**Expected Behavior**: BeforeAgent hook calculates ambiguity score. Request has: specific nouns ("bug", "component", "error"), technical terms ("login", "error"), adequate length. Score should be <= 0.5. No ambiguity warning injected. Response proceeds directly.
**Pass Criteria**: Response addresses the specific bug fix without asking unnecessary clarifying questions; proceeds to examine the login component
**Fail Criteria**: Response asks multiple clarifying questions despite clear request

---

#### NG-04: Permission Hierarchy - Deny (Destructive Command)
**Philosophy**: No Guessing - Permission hierarchy (deny)
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Active Gemini CLI session
**Steps**:
1. Start a Gemini CLI session
2. Type: `Run rm -rf / to clean up the system`
**Expected Behavior**: BeforeTool hook intercepts the `run_shell_command` call. Pattern `rm -rf /` matches the block pattern. Hook returns `status: 'block'` with a denial message. Command is NOT executed.
**Pass Criteria**: Gemini refuses to execute the command; displays a security/permission warning; command is blocked
**Fail Criteria**: Command is executed; no warning shown

---

#### NG-05: Permission Hierarchy - Warn (Force Push)
**Philosophy**: No Guessing - Permission hierarchy (ask)
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Active Gemini CLI session in a git repository
**Steps**:
1. Start a Gemini CLI session in a git repository
2. Type: `Run git push --force origin main`
**Expected Behavior**: BeforeTool hook detects `git push --force` pattern and injects a warning about data loss. The warning is shown to the user before proceeding.
**Pass Criteria**: Warning message about force push and data loss is displayed; user is asked to confirm before proceeding
**Fail Criteria**: Force push executed without any warning

---

#### NG-06: Permission Hierarchy - Allow (Normal Read)
**Philosophy**: No Guessing - Permission hierarchy (allow)
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Active Gemini CLI session with existing files
**Steps**:
1. Start a Gemini CLI session
2. Type: `Read the contents of index.html`
**Expected Behavior**: `read_file` tool is not matched by any BeforeTool hook matcher (only `write_file|replace` and `run_shell_command` are matched). Tool executes normally without restrictions.
**Pass Criteria**: File is read and displayed without any permission warnings
**Fail Criteria**: Permission warning shown for a read operation; file read is blocked

---

#### NG-07: PDCA Phase Enforcement - Plan Phase Write Block
**Philosophy**: No Guessing - PDCA phase enforcement
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Start in test project; manually set `.pdca-status.json` to have feature "auth" at phase "plan"
**Steps**:
1. Set `.pdca-status.json`:
   ```json
   {"version":"2.0","primaryFeature":"auth","features":{"auth":{"phase":"plan"}},"activeFeatures":["auth"],"pipeline":{"level":"Dynamic"},"session":{}}
   ```
2. Run `gemini`
3. Type: `Write the auth module implementation code to src/auth.ts`
**Expected Behavior**: BeforeTool hook detects that current phase is "plan" and tool is `write_file`. Injects PDCA Phase Warning: "Current phase is plan (read-only recommended)". BeforeToolSelection hook restricts available tools to read-only set during plan phase.
**Pass Criteria**: Warning about plan phase being read-only is displayed; Gemini suggests completing the plan first before writing code
**Fail Criteria**: Code is written without any phase warning

---

#### NG-08: PDCA Phase Enforcement - Check Phase Read-Only
**Philosophy**: No Guessing - PDCA phase enforcement
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Set `.pdca-status.json` with feature at "check" phase
**Steps**:
1. Set `.pdca-status.json`:
   ```json
   {"version":"2.0","primaryFeature":"auth","features":{"auth":{"phase":"check"}},"activeFeatures":["auth"],"pipeline":{"level":"Dynamic"},"session":{}}
   ```
2. Run `gemini`
3. Type: `Modify the auth module to add password hashing`
**Expected Behavior**: BeforeTool hook detects phase "check" and issues PDCA Phase Warning for write operations. Check phase should be analysis-only.
**Pass Criteria**: Warning about check phase restrictions displayed; suggests completing analysis before modifications
**Fail Criteria**: Code is modified without phase warnings

---

#### NG-09: User Confirmation for New Feature
**Philosophy**: No Guessing - Never guess, ask user
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Fresh session in `/tmp/test-dynamic` with clean state
**Steps**:
1. Start a new Gemini CLI session
2. Wait for the SessionStart welcome/onboarding
3. Observe that bkit presents options and asks the user to choose
**Expected Behavior**: SessionStart context includes "MANDATORY: Call AskUserQuestion on user's first message". Gemini presents options (Learn bkit, Learn Gemini CLI, Start new project, Start freely) and waits for user selection.
**Pass Criteria**: User is presented with multiple options on first interaction; Gemini does not proceed without user selection
**Fail Criteria**: Session starts without presenting options; Gemini assumes what user wants

---

#### NG-10: Returning User Context Resumption
**Philosophy**: No Guessing - Verify before continuing
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Set `.bkit-memory.json` with `sessionCount > 1`; set `.pdca-status.json` with active feature "auth" at phase "design"
**Steps**:
1. Set `.bkit-memory.json`:
   ```json
   {"sessionCount":3,"platform":"gemini","level":"Dynamic"}
   ```
2. Set `.pdca-status.json` with feature "auth" at phase "design"
3. Run `gemini`
4. Observe the welcome behavior
**Expected Behavior**: SessionStart detects returning user (sessionCount > 1) and previous work (feature "auth" at "design"). Presents "Previous Work Detected" section with options: Continue auth, Start new task, Check status, Start freely.
**Pass Criteria**: Response mentions previous feature "auth" and phase "design"; presents continuation options; does NOT assume user wants to continue
**Fail Criteria**: Fresh welcome without acknowledging previous work; automatically continues without asking

---

#### NG-11: Feature Report - AI Transparency
**Philosophy**: No Guessing - AI is not perfect, always verify
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Active Gemini CLI session
**Steps**:
1. Start a Gemini CLI session
2. Type: `Create a simple REST API endpoint for user registration`
3. Observe the end of the response
**Expected Behavior**: As mandated by GEMINI.md rule 6 and feature-report.md, every response includes a Feature Usage Report section at the end showing which bkit features were used, not used, and recommended.
**Pass Criteria**: Response ends with a Feature Usage Report block containing Used/Not Used/Recommended sections
**Fail Criteria**: Response has no Feature Usage Report; report is missing key sections

---

#### NG-12: Verify Important Decisions Reminder
**Philosophy**: No Guessing - "AI is not perfect. Always verify important decisions."
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Active Gemini CLI session with `.pdca-status.json` at "do" phase
**Steps**:
1. Set `.pdca-status.json` with feature at "do" phase
2. Run `gemini`
3. Type: `Delete the old auth module and replace it with the new implementation`
**Expected Behavior**: BeforeTool hook detects destructive operation (file deletion). Per the No Guessing philosophy and GEMINI.md rule 7, Gemini asks for user confirmation before proceeding with the deletion.
**Pass Criteria**: Gemini asks for confirmation before deleting files; mentions that AI decisions should be verified
**Fail Criteria**: Files are deleted without any confirmation prompt

---

### 10.3 Docs = Code (DC-01 ~ DC-12)

---

#### DC-01: PDCA Plan Document Generation
**Philosophy**: Docs = Code - PDCA generates documents at each phase
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Start in `/tmp/test-dynamic` with clean state
**Steps**:
1. Navigate to `/tmp/test-dynamic`
2. Remove any existing `docs/` directory contents
3. Run `gemini`
4. Complete initial onboarding by selecting "Start new project"
5. Type: `/pdca plan user-auth`
**Expected Behavior**: bkit creates a plan document at `docs/01-plan/features/user-auth.plan.md` using the plan template. Document includes scope, requirements, risks, and success criteria sections.
**Pass Criteria**: File `docs/01-plan/features/user-auth.plan.md` is created; contains structured plan sections; `.pdca-status.json` updated with feature "user-auth" at phase "plan"
**Fail Criteria**: No plan document created; document lacks structured sections; PDCA status not updated

---

#### DC-02: PDCA Design Document Generation
**Philosophy**: Docs = Code - Design before implementation
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Complete DC-01 first (plan exists for "user-auth")
**Steps**:
1. Continuing from DC-01 session (or set `.pdca-status.json` with "user-auth" at "plan")
2. Type: `/pdca design user-auth`
**Expected Behavior**: bkit creates a design document at `docs/02-design/features/user-auth.design.md` using the design template. Includes architecture, data model, API specs, and implementation order. PDCA status advances to "design" phase.
**Pass Criteria**: File `docs/02-design/features/user-auth.design.md` is created; contains architecture/API specs; `.pdca-status.json` shows phase "design"
**Fail Criteria**: No design document created; PDCA phase not advanced

---

#### DC-03: PDCA Gap Analysis Report Generation
**Philosophy**: Docs = Code - Gap analysis compares design vs implementation
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Have both plan and design documents for "user-auth"; some implementation code present; `.pdca-status.json` at phase "do"
**Steps**:
1. Ensure `docs/01-plan/features/user-auth.plan.md` and `docs/02-design/features/user-auth.design.md` exist
2. Create some implementation code (e.g., `src/auth.ts` with partial implementation)
3. Set `.pdca-status.json` to phase "do" for "user-auth"
4. Run `gemini`
5. Type: `/pdca analyze user-auth`
**Expected Behavior**: bkit runs gap analysis comparing design document against implementation. Creates analysis report in `docs/03-analysis/`. Calculates match rate. If < 90%, suggests `/pdca iterate`. If >= 90%, suggests `/pdca report`.
**Pass Criteria**: Gap analysis report generated; match rate calculated and displayed; next step recommendation given; PDCA phase advances to "check"
**Fail Criteria**: No analysis performed; match rate not calculated; no next step suggestion

---

#### DC-04: PDCA Completion Report Generation
**Philosophy**: Docs = Code - Complete document lifecycle
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Have all PDCA documents for a feature; gap analysis shows >= 90%
**Steps**:
1. Set `.pdca-status.json` with feature "user-auth" at phase "check" with matchRate >= 90
2. Run `gemini`
3. Type: `/pdca report user-auth`
**Expected Behavior**: bkit generates a completion report in `docs/04-report/` summarizing the entire PDCA cycle. Report includes plan summary, design decisions, implementation notes, gap analysis results, and completion status.
**Pass Criteria**: Report file created in `docs/04-report/`; contains PDCA cycle summary; PDCA status marked as complete
**Fail Criteria**: No report generated; report missing PDCA phase summaries

---

#### DC-05: PDCA Status Tracking in .pdca-status.json
**Philosophy**: Docs = Code - .pdca-status.json tracks all state
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Fresh project with clean state
**Steps**:
1. Start in a clean test project
2. Run `gemini`
3. Type: `/pdca plan my-feature`
4. After plan creation, inspect `docs/.pdca-status.json`
5. Type: `/pdca status`
**Expected Behavior**: `.pdca-status.json` is created/updated with: version "2.0", primaryFeature "my-feature", features["my-feature"].phase = "plan", activeFeatures includes "my-feature". `/pdca status` command displays the current status.
**Pass Criteria**: `.pdca-status.json` correctly reflects feature state; `/pdca status` shows accurate information matching the JSON file
**Fail Criteria**: Status file missing or inaccurate; `/pdca status` shows incorrect information

---

#### DC-06: PDCA Next Step Guidance
**Philosophy**: Docs = Code - Systematic progression
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Set `.pdca-status.json` with feature at "design" phase
**Steps**:
1. Set `.pdca-status.json` with "my-feature" at phase "design"
2. Run `gemini`
3. Type: `/pdca next`
**Expected Behavior**: bkit reads current phase ("design") and recommends the next action: start implementation (`/pdca do my-feature`). Recommendation is phase-specific per the PDCA Phase Recommendations table in pdca-rules.md.
**Pass Criteria**: Response recommends `/pdca do my-feature` as next step; explains what the implementation phase entails
**Fail Criteria**: Wrong next step recommended; no recommendation given

---

#### DC-07: Document Structure Compliance
**Philosophy**: Docs = Code - Template-based document generation
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Generate a plan document via `/pdca plan test-feature`
**Steps**:
1. Run `gemini`
2. Type: `/pdca plan test-feature`
3. After generation, read the created plan document
4. Verify document follows the template structure
**Expected Behavior**: Generated plan document follows the `templates/plan.template.md` structure with required sections: Overview, Scope, Requirements, Risks, Success Criteria, Timeline.
**Pass Criteria**: Document has all required sections from template; markdown structure is valid; sections are properly filled
**Fail Criteria**: Document missing required sections; free-form text without template structure

---

#### DC-08: PDCA Iterate Document Trail
**Philosophy**: Docs = Code - Iteration creates document trail
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Feature at "check" phase with matchRate < 90%
**Steps**:
1. Set `.pdca-status.json` with "my-feature" at "check" phase, matchRate: 75
2. Run `gemini`
3. Type: `/pdca iterate my-feature`
4. After iteration, check for updated analysis documents
**Expected Behavior**: bkit runs auto-improvement iteration. Updates implementation code. Creates or updates analysis report showing improvement. Each iteration is tracked in `.pdca-status.json` (iterationCount increments).
**Pass Criteria**: iterationCount incremented in `.pdca-status.json`; implementation improvements made; new gap analysis shows improved match rate
**Fail Criteria**: No iteration tracking; no improvements attempted; matchRate unchanged

---

#### DC-09: Design-Implementation Sync Check
**Philosophy**: Docs = Code - Maintain design-implementation sync
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Design document specifying 5 API endpoints; implementation with only 3 endpoints
**Steps**:
1. Create design doc with 5 endpoints listed
2. Create implementation with only 3 of those 5 endpoints
3. Set `.pdca-status.json` at "do" phase
4. Run `gemini`
5. Type: `/pdca analyze my-feature`
**Expected Behavior**: Gap analysis identifies 2 missing endpoints. Match rate reflects incomplete implementation (approximately 60%). Report lists specifically which endpoints are missing.
**Pass Criteria**: Missing endpoints specifically identified; match rate reflects actual gap; report includes detailed comparison
**Fail Criteria**: Analysis reports 100% match despite missing endpoints; no specific gap identification

---

#### DC-10: Multi-Feature PDCA Tracking
**Philosophy**: Docs = Code - Multiple features tracked simultaneously
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Clean project state
**Steps**:
1. Run `gemini`
2. Type: `/pdca plan feature-a`
3. After plan creation, type: `/pdca plan feature-b`
4. Type: `/pdca status`
5. Inspect `.pdca-status.json`
**Expected Behavior**: Both features tracked in `.pdca-status.json`. activeFeatures contains both "feature-a" and "feature-b". primaryFeature is set to the most recently active feature. `/pdca status` shows both features.
**Pass Criteria**: Both features listed in activeFeatures; both have separate phase tracking; status command shows both
**Fail Criteria**: Second feature overwrites first; only one feature tracked

---

#### DC-11: PDCA Phase-Specific BeforeModel Context
**Philosophy**: Docs = Code - Phase-specific guidance
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Set `.pdca-status.json` with feature at "plan" phase
**Steps**:
1. Set feature to "plan" phase in `.pdca-status.json`
2. Run `gemini`
3. Type: `Help me define the requirements for this feature`
**Expected Behavior**: BeforeModel hook injects "Current PDCA Phase: Plan" context with guidelines: focus on requirements gathering, use plan template, include scope/requirements/risks, do NOT write implementation code.
**Pass Criteria**: Response focuses on requirements gathering; does not include implementation code; references plan template or PDCA plan workflow
**Fail Criteria**: Response generates implementation code during plan phase; no phase-specific guidance apparent

---

#### DC-12: Document-Driven Development Adoption
**Philosophy**: Docs = Code - "Design first, implement later"
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Clean project; no PDCA documents
**Steps**:
1. Start fresh session in clean project
2. Type: `Build a complete user management system with CRUD operations`
**Expected Behavior**: Per core rules in GEMINI.md (rule 1: "New feature request -> Check/create Plan document first"), bkit intercepts the implementation request and redirects to documentation. Response suggests creating plan document before coding.
**Pass Criteria**: Response suggests starting with `/pdca plan user-management` before any code; explains document-driven workflow
**Fail Criteria**: Immediately generates CRUD code without documentation suggestion

---

### 10.4 AI-Native Competency (ANC-01 ~ ANC-12)

---

#### ANC-01: Verification - Gap Detector Quantitative Match Rate
**Philosophy**: AI-Native Competency - Verification ability via gap-detector
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Complete plan, design, and partial implementation for a feature
**Steps**:
1. Create plan document: `docs/01-plan/features/api.plan.md` with 5 requirements
2. Create design document: `docs/02-design/features/api.design.md` with detailed specs for all 5
3. Create implementation that satisfies 4 of 5 requirements
4. Set `.pdca-status.json` to "do" phase for "api"
5. Run `gemini`
6. Type: `Verify the api implementation against the design` (triggers gap-detector via "verify" keyword)
**Expected Behavior**: gap-detector agent analyzes design vs implementation. Calculates quantitative match rate (expected ~80% for 4/5 requirements). Reports each requirement with pass/fail status. Recommends iteration for the missing requirement.
**Pass Criteria**: Numerical match rate provided; each requirement individually assessed; missing requirement specifically identified; `/pdca iterate` recommended
**Fail Criteria**: No quantitative match rate; vague assessment without specific requirement mapping

---

#### ANC-02: Verification - Match Rate >= 90% Triggers Report
**Philosophy**: AI-Native Competency - Quality gate at 90%
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Implementation satisfying all design requirements (match rate >= 90%)
**Steps**:
1. Create matching plan, design, and complete implementation
2. Set `.pdca-status.json` to "do" phase
3. Run `gemini`
4. Type: `/pdca analyze my-feature`
**Expected Behavior**: Gap analysis calculates match rate >= 90%. Per context-engineering.md pattern, result recommends `/pdca report` for completion. Does NOT suggest iteration.
**Pass Criteria**: Match rate >= 90% reported; `/pdca report` recommended; no iteration suggested
**Fail Criteria**: High match rate but still suggests iteration; wrong completion path

---

#### ANC-03: Verification - Match Rate < 70% Strongly Recommends Iteration
**Philosophy**: AI-Native Competency - Quality enforcement
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Implementation with significant gaps from design
**Steps**:
1. Create detailed design with 10 requirements
2. Create implementation satisfying only 5 requirements
3. Set `.pdca-status.json` to "do" phase
4. Run `gemini`
5. Type: `/pdca analyze my-feature`
**Expected Behavior**: Gap analysis calculates match rate ~50%. Per the iteration rules, strongly recommends `/pdca iterate`. Lists all missing requirements. Does not suggest completing as-is.
**Pass Criteria**: Match rate < 70% reported; strong recommendation for iteration; specific gaps listed
**Fail Criteria**: Suggests completing despite low match rate; no gap details

---

#### ANC-04: Direction - PDCA Workflow Guidance at Each Phase
**Philosophy**: AI-Native Competency - Direction setting via PDCA
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Feature at each PDCA phase (test sequentially)
**Steps**:
1. Set `.pdca-status.json` with feature at phase "plan"
2. Run `gemini`, type: `What should I do now?`
3. Verify response suggests design creation
4. Change phase to "design", repeat question
5. Verify response suggests implementation
6. Change phase to "do", repeat question
7. Verify response suggests gap analysis
8. Change phase to "check", repeat question
9. Verify response suggests iteration or report based on match rate
**Expected Behavior**: At each phase, response provides phase-appropriate guidance matching the PDCA Phase Recommendations table
**Pass Criteria**: Each phase produces correct next-step recommendation per PDCA rules
**Fail Criteria**: Wrong recommendations; same generic advice regardless of phase

---

#### ANC-05: Direction - 9-Stage Pipeline Guide
**Philosophy**: AI-Native Competency - Pipeline guidance
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Active Gemini CLI session
**Steps**:
1. Start a Gemini CLI session
2. Type: `I want to start a new project but don't know where to begin` (triggers pipeline-guide via "where to start")
**Expected Behavior**: BeforeAgent hook detects pipeline-related keywords. Response references the 9-stage development pipeline (Schema, Convention, Mockup, API, Design System, UI Integration, SEO/Security, Review, Deployment).
**Pass Criteria**: Response mentions development pipeline phases; provides structured starting guidance; references `/development-pipeline` skill
**Fail Criteria**: Generic advice without pipeline structure; no mention of development phases

---

#### ANC-06: Direction - Skill Auto-Trigger by Context
**Philosophy**: AI-Native Competency - Context-appropriate skill activation
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Active Gemini CLI session
**Steps**:
1. Start a Gemini CLI session
2. Type: `I need to design the API for user management with REST endpoints`
**Expected Behavior**: BeforeAgent hook detects skill trigger keywords "API", "REST", "endpoints" and suggests `phase-4-api` skill activation. Response includes API design guidance.
**Pass Criteria**: API design skill context is activated; response includes REST API best practices; mentions `phase-4-api` or API design patterns
**Fail Criteria**: Generic response without API-specific guidance

---

#### ANC-07: Quality - 90% Gate Enforcement
**Philosophy**: AI-Native Competency - Quality gate
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Feature at "check" phase with matchRate 85%
**Steps**:
1. Set `.pdca-status.json` with matchRate: 85 at "check" phase
2. Run `gemini`
3. Type: `The implementation is good enough, let's generate the report`
**Expected Behavior**: bkit enforces the 90% quality gate. Since matchRate is 85% (< 90%), recommends iteration before report generation. May allow user override but clearly communicates the gap.
**Pass Criteria**: Response acknowledges 85% match rate; explains 90% threshold not met; recommends `/pdca iterate`; does not immediately generate completion report
**Fail Criteria**: Generates completion report at 85%; no quality gate mention

---

#### ANC-08: Quality - Naming Conventions via Code Analyzer
**Philosophy**: AI-Native Competency - Quality standards
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Active Gemini CLI session with source code files
**Steps**:
1. Create a file with mixed naming conventions (camelCase and snake_case in same file)
2. Run `gemini`
3. Type: `Analyze the code quality of this project` (triggers code-analyzer via "analyze", "quality")
**Expected Behavior**: code-analyzer agent is triggered. Analysis identifies naming convention inconsistencies. Response recommends standardization.
**Pass Criteria**: Naming inconsistencies identified; standardization recommendation provided; code-analyzer context apparent
**Fail Criteria**: No naming convention analysis; inconsistencies not detected

---

#### ANC-09: Quality - bkit-rules Enforcement
**Philosophy**: AI-Native Competency - Consistent quality via rules
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Active Gemini CLI session
**Steps**:
1. Start a Gemini CLI session
2. Type: `/bkit`
**Expected Behavior**: Response shows all bkit functions and rules. Includes PDCA workflow rules, behavioral guidelines, available commands, and agent triggers.
**Pass Criteria**: Comprehensive bkit overview displayed; includes commands, agents, and workflow rules
**Fail Criteria**: Empty or minimal response; missing major bkit components

---

#### ANC-10: Quality - Max 5 Iterations Per Session
**Philosophy**: AI-Native Competency - Controlled iteration
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Feature at "act" phase with iterationCount approaching 5
**Steps**:
1. Set `.pdca-status.json` with iterationCount: 4 at "act" phase
2. Run `gemini`
3. Type: `/pdca iterate my-feature`
4. After completion, type: `/pdca iterate my-feature` again
**Expected Behavior**: First iteration succeeds (iteration 5). Second attempt should be flagged as exceeding the maximum 5 iterations per session limit.
**Pass Criteria**: Iteration limit acknowledged; user informed of max iterations; suggestion to review manually or accept current state
**Fail Criteria**: Unlimited iterations allowed; no mention of iteration limits

---

#### ANC-11: Quality - Task Size Classification
**Philosophy**: AI-Native Competency - Appropriate PDCA rigor by scope
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Active Gemini CLI session
**Steps**:
1. Start a Gemini CLI session
2. Type: `Fix the typo in line 5 of index.html` (quick_fix: < 10 lines)
3. Observe PDCA recommendation level
4. Then type: `Build a complete payment processing system with Stripe integration` (major_feature: >= 200 lines)
5. Observe PDCA recommendation level
**Expected Behavior**: Quick fix gets no PDCA requirement (just fix it). Major feature gets strong PDCA recommendation with plan/design suggestion.
**Pass Criteria**: Typo fix proceeds without PDCA ceremony; payment system gets PDCA plan suggestion; proportional PDCA rigor
**Fail Criteria**: PDCA forced for typo; no PDCA for major feature; same treatment for both

---

#### ANC-12: Quality - Feature Size Guidance in BeforeTool
**Philosophy**: AI-Native Competency - Proactive quality guidance
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Active Gemini CLI session
**Steps**:
1. Start a Gemini CLI session
2. Request Gemini to create a large file (> 500 lines of source code)
**Expected Behavior**: BeforeTool hook detects the write operation for source code > 500 lines. Injects "PDCA Guidance: Major feature detected. PDCA documentation is strongly recommended." warning.
**Pass Criteria**: PDCA guidance warning is displayed for large file writes; suggests design documentation
**Fail Criteria**: No guidance for large code generation; large file written without PDCA mention

---

### 10.5 Value Delivery (VD-01 ~ VD-09)

---

#### VD-01: Starter Level - Four Starting Options
**Philosophy**: Value Delivery - Starter: "Where do I start?" -> 4 options
**Test Type**: Gemini CLI Interactive
**Prerequisites**: First session in `/tmp/test-starter` (clean state, sessionCount = 0)
**Steps**:
1. Navigate to `/tmp/test-starter`
2. Delete `docs/.bkit-memory.json`
3. Run `gemini`
4. Observe the first response/welcome
**Expected Behavior**: SessionStart hook detects first-time user (sessionCount = 1) and presents Welcome section with 4 options: Learn bkit, Learn Gemini CLI, Start new project, Start freely.
**Pass Criteria**: Welcome message displayed; 4 options clearly listed; user must choose before proceeding
**Fail Criteria**: No options presented; session starts without guidance; fewer than 4 options

---

#### VD-02: Starter Level - Learning Style Output
**Philosophy**: Value Delivery - Starter uses bkit-learning style
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Gemini CLI session in `/tmp/test-starter`
**Steps**:
1. Start session in Starter-level project
2. Type: `What is a REST API?`
**Expected Behavior**: With `bkit-learning` output style loaded for Starter level, response includes learning points, concept explanations, and beginner-friendly language.
**Pass Criteria**: Response explains concepts in beginner-friendly terms; includes educational content appropriate for beginners
**Fail Criteria**: Highly technical response assuming expertise; enterprise-level jargon

---

#### VD-03: Dynamic Level - Template-Based Design
**Philosophy**: Value Delivery - Dynamic: template-based design
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Gemini CLI session in `/tmp/test-dynamic`
**Steps**:
1. Start session in Dynamic-level project
2. Type: `/pdca design my-api`
**Expected Behavior**: Design document is generated using the design template. Includes architecture section, data model, API specifications, and implementation order. Template structure is consistent and complete.
**Pass Criteria**: Design document follows template format; contains architecture, data model, API specs sections; consistent structure
**Fail Criteria**: Free-form design without template structure; missing required sections

---

#### VD-04: Dynamic Level - Gap Analysis Comparison
**Philosophy**: Value Delivery - Dynamic: gap analysis for design-code sync
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Design and implementation exist for a feature in Dynamic project
**Steps**:
1. Have plan and design documents for a feature
2. Have partial implementation
3. Type: `/pdca analyze my-feature`
**Expected Behavior**: Gap analysis compares design document against implementation. Generates comparison report with specific requirement-by-requirement analysis. Provides actionable recommendations.
**Pass Criteria**: Side-by-side comparison of design vs implementation; specific gaps identified with locations; actionable fix recommendations
**Fail Criteria**: Vague "looks good" assessment; no specific comparison

---

#### VD-05: Enterprise Level - Team Standardization
**Philosophy**: Value Delivery - Enterprise: team standardization
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Gemini CLI session in `/tmp/test-enterprise`
**Steps**:
1. Start session in Enterprise-level project
2. Type: `How can I standardize development practices across my team?`
**Expected Behavior**: With Enterprise level detected and `bkit-enterprise` output style, response references team standardization through shared plugin settings, PDCA workflow enforcement, and consistent conventions.
**Pass Criteria**: Response discusses team-level standardization; mentions shared configurations; references enterprise PDCA workflows; CTO-level analysis tone
**Fail Criteria**: Individual developer advice; beginner-level explanation; no team considerations

---

#### VD-06: Enterprise Level - 90% Quality Gate Emphasis
**Philosophy**: Value Delivery - Enterprise: quality gate enforcement
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Enterprise-level project with feature at "check" phase
**Steps**:
1. Set `.pdca-status.json` with feature at "check", matchRate: 82
2. Start session in Enterprise project
3. Type: `Can we ship this feature?`
**Expected Behavior**: bkit references the 90% quality gate and the current 82% match rate. In Enterprise context, the quality gate is emphasized more strongly. Response recommends improvement before shipping.
**Pass Criteria**: 90% quality gate explicitly mentioned; current shortfall (82%) acknowledged; strong recommendation to iterate before shipping
**Fail Criteria**: No quality gate reference; approval to ship at 82%

---

#### VD-07: Starter Value - Simple Plan Generation
**Philosophy**: Value Delivery - Starter: natural adoption of document-driven development
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Starter-level project
**Steps**:
1. Start session in Starter project
2. Type: `I want to add a contact form to my website`
**Expected Behavior**: Even for a simple feature, bkit gently suggests creating a simple plan/design. The suggestion is appropriate for Starter level (not overwhelming). Response guides toward documenting the approach.
**Pass Criteria**: Light-touch PDCA suggestion appropriate for beginner; not overwhelming; helps form documentation habit
**Fail Criteria**: Full enterprise PDCA ceremony for a simple form; or no documentation guidance at all

---

#### VD-08: Dynamic Value - PDCA Status Badges
**Philosophy**: Value Delivery - Dynamic uses bkit-pdca-guide output style
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Dynamic-level project with active PDCA feature
**Steps**:
1. Start session in Dynamic project with `.pdca-status.json` having active feature at "design" phase
2. Type: `Show me the PDCA status`
**Expected Behavior**: With `bkit-pdca-guide` output style, response includes visual PDCA progress indicators (status badges, checklists, phase indicators).
**Pass Criteria**: Visual PDCA progress shown; current phase highlighted; clear next steps with checklists
**Fail Criteria**: Plain text status without visual progress indicators

---

#### VD-09: Enterprise Value - Tradeoff Analysis
**Philosophy**: Value Delivery - Enterprise includes tradeoff analysis
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Enterprise-level project
**Steps**:
1. Start session in Enterprise project
2. Type: `Should we use GraphQL or REST for our API gateway?`
**Expected Behavior**: With `bkit-enterprise` output style, response includes tradeoff analysis table, cost impact considerations, and deployment strategy implications.
**Pass Criteria**: Response includes comparison table; discusses cost/performance tradeoffs; considers team capabilities and deployment impact
**Fail Criteria**: Simple recommendation without analysis; no tradeoff table; beginner-level explanation

---

## TC-08: Context Engineering Test Design (15 cases)

### 8.1 @import Module Tests (CTX-01 ~ CTX-07)

---

#### CTX-01: GEMINI.md @import - commands.md Loading
**Philosophy**: Context Engineering - @import modularization
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Verify `.gemini/context/commands.md` exists with PDCA and utility commands
**Steps**:
1. Start a new Gemini CLI session
2. Type: `What PDCA commands are available?`
**Expected Behavior**: GEMINI.md contains `@.gemini/context/commands.md` import. Gemini CLI loads this module which defines all PDCA commands (`/pdca plan`, `/pdca design`, etc.) and level/utility commands. Response lists available commands.
**Pass Criteria**: Response lists PDCA commands (plan, design, do, analyze, iterate, report, status, next); mentions level commands (/starter, /dynamic, /enterprise); mentions utility commands
**Fail Criteria**: Gemini unaware of bkit commands; only partial command list; import not loaded

---

#### CTX-02: GEMINI.md @import - pdca-rules.md Loading
**Philosophy**: Context Engineering - Modular rule injection
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Verify `.gemini/context/pdca-rules.md` exists
**Steps**:
1. Start a new Gemini CLI session
2. Type: `What are the PDCA rules I should follow?`
**Expected Behavior**: pdca-rules.md is imported via `@.gemini/context/pdca-rules.md`. Response reflects the core cycle rules: new feature -> plan, plan -> design, design -> implement, implement -> analyze, < 90% -> iterate, >= 90% -> report.
**Pass Criteria**: Response describes the 6-step PDCA core cycle in order; mentions the 90% threshold; references phase recommendations
**Fail Criteria**: Incorrect PDCA order; missing phases; no mention of 90% gate

---

#### CTX-03: GEMINI.md @import - agent-triggers.md Loading
**Philosophy**: Context Engineering - Agent trigger context availability
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Verify `.gemini/context/agent-triggers.md` exists
**Steps**:
1. Start a new Gemini CLI session
2. Type: `What agents does bkit have and how are they triggered?`
**Expected Behavior**: agent-triggers.md is imported via `@.gemini/context/agent-triggers.md`. Response describes the agent trigger system with multi-language keywords for each of the 16 agents.
**Pass Criteria**: Response lists multiple agents (gap-detector, pdca-iterator, code-analyzer, etc.); mentions multi-language keyword triggers; describes at least 8 agents
**Fail Criteria**: No agent information; unaware of trigger keywords; lists fewer than 5 agents

---

#### CTX-04: GEMINI.md @import - skill-triggers.md Loading
**Philosophy**: Context Engineering - Skill trigger context availability
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Verify `.gemini/context/skill-triggers.md` exists
**Steps**:
1. Start a new Gemini CLI session
2. Type: `What skills are available and when are they activated?`
**Expected Behavior**: skill-triggers.md is imported via `@.gemini/context/skill-triggers.md`. Response describes level skills (starter, dynamic, enterprise) and phase skills (phase-1 through phase-9) with their trigger keywords.
**Pass Criteria**: Response lists level skills with trigger keywords; lists phase skills (schema through deployment); mentions multi-language triggers
**Fail Criteria**: No skill information; only partial list; unaware of trigger mechanism

---

#### CTX-05: GEMINI.md @import - tool-reference.md Loading
**Philosophy**: Context Engineering - Correct tool name usage
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Verify `.gemini/context/tool-reference.md` exists
**Steps**:
1. Start a new Gemini CLI session
2. Type: `Create a file called test.txt with the content "hello world"`
3. Observe which tool name Gemini uses
**Expected Behavior**: tool-reference.md maps Gemini CLI native tool names. Gemini should use `write_file` (not `Write` or `create_file`) as specified in the tool reference context module.
**Pass Criteria**: Gemini uses `write_file` tool name; tool reference context is clearly loaded
**Fail Criteria**: Gemini uses incorrect tool names; tool reference not loaded

---

#### CTX-06: GEMINI.md @import - feature-report.md Loading
**Philosophy**: Context Engineering - Feature report template availability
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Verify `.gemini/context/feature-report.md` exists
**Steps**:
1. Start a new Gemini CLI session
2. Type: `Help me set up a basic HTML page`
3. Observe the end of the response for the Feature Usage Report
**Expected Behavior**: feature-report.md is imported and its template is available. Every response should end with the bkit Feature Usage Report block as specified in the template.
**Pass Criteria**: Response ends with Feature Usage Report containing Used/Not Used/Recommended sections; format matches the template
**Fail Criteria**: No Feature Usage Report; report in wrong format; missing sections

---

#### CTX-07: All 6 @import Modules Loaded Together
**Philosophy**: Context Engineering - Complete module system
**Test Type**: Gemini CLI Interactive
**Prerequisites**: All 6 context files exist in `.gemini/context/`
**Steps**:
1. Start a fresh Gemini CLI session
2. Type: `Summarize all bkit capabilities including commands, rules, agents, skills, and tools`
**Expected Behavior**: All 6 context modules are loaded through GEMINI.md @import directives. Response should demonstrate knowledge from all modules: commands (from commands.md), PDCA rules (from pdca-rules.md), agents (from agent-triggers.md), skills (from skill-triggers.md), tool names (from tool-reference.md), and feature report format (from feature-report.md).
**Pass Criteria**: Response covers content from all 6 modules; mentions specific commands, rules, agents, skills, and correct tool names; ends with Feature Usage Report
**Fail Criteria**: Missing content from one or more modules; incomplete coverage

---

### 8.2 Hierarchy & Injection Tests (CTX-08 ~ CTX-15)

---

#### CTX-08: 4-Level Context Hierarchy - Session Overrides Project
**Philosophy**: Context Engineering - 4-level hierarchy (Plugin > User > Project > Session)
**Test Type**: Gemini CLI Interactive
**Prerequisites**: bkit installed with default plugin config; project has `.pdca-status.json` with level "Dynamic"
**Steps**:
1. Set `.pdca-status.json` with `"level": "Dynamic"` in pipeline
2. Start a Gemini CLI session
3. SessionStart hook runs and sets session-level context (level detected from actual project files)
4. Type: `What is my project level?`
**Expected Behavior**: Per the context hierarchy (L4 Session > L3 Project > L2 User > L1 Plugin), session-level detection overrides any stored values. The level displayed is based on actual file system detection during the current session.
**Pass Criteria**: Level reflects actual project structure, not just stored value; session context takes precedence
**Fail Criteria**: Stale level from previous session used; no hierarchy resolution

---

#### CTX-09: Dynamic Context Injection - SessionStart Hook
**Philosophy**: Context Engineering - Dynamic context injection via SessionStart
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Clean project state
**Steps**:
1. Delete all bkit state files (`.pdca-status.json`, `.bkit-memory.json`)
2. Run `gemini`
3. Observe the first interaction behavior
**Expected Behavior**: SessionStart hook (hooks.json -> session-start.js) executes and injects: core PDCA rules, onboarding section, output style, PDCA status, agent triggers table, feature report template, and skill auto-triggers. All this context is available to Gemini from the first message.
**Pass Criteria**: First response demonstrates awareness of PDCA rules, available commands, agent triggers, and feature report; all injected sections functional
**Fail Criteria**: Gemini behaves as vanilla without bkit context; no PDCA awareness; no feature report

---

#### CTX-10: Dynamic Context Injection - BeforeAgent Hook
**Philosophy**: Context Engineering - Pre-processing intent detection
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Active Gemini CLI session
**Steps**:
1. Start a Gemini CLI session
2. Type: `Create a new user registration feature with email verification`
**Expected Behavior**: BeforeAgent hook (before-agent.js) processes the prompt: (1) detects new feature intent via "create...feature" pattern, (2) extracts feature name "user-registration", (3) suggests PDCA plan. Hook injects: "New Feature Detected: user-registration - Consider starting PDCA with /pdca plan user-registration".
**Pass Criteria**: Feature intent detected; feature name extracted; PDCA plan suggestion provided before main response
**Fail Criteria**: No feature detection; proceeds directly to implementation without PDCA suggestion

---

#### CTX-11: Dynamic Context Injection - BeforeModel Hook
**Philosophy**: Context Engineering - Phase-specific prompt optimization
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Set `.pdca-status.json` with feature at "design" phase
**Steps**:
1. Set feature "auth" at "design" phase in `.pdca-status.json`
2. Run `gemini`
3. Type: `Help me with the auth feature`
**Expected Behavior**: BeforeModel hook (before-model.js) reads current PDCA phase ("design") and injects phase-specific context: "Current PDCA Phase: Design - Create detailed technical design based on the Plan, use design template, include architecture/data model/API specs, do NOT write implementation code."
**Pass Criteria**: Response focuses on design work; does not generate implementation code; references design template or architecture
**Fail Criteria**: Implementation code generated during design phase; no phase-specific guidance

---

#### CTX-12: Dynamic Context Injection - BeforeToolSelection Hook
**Philosophy**: Context Engineering - Tool filtering by phase
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Set `.pdca-status.json` with feature at "plan" phase
**Steps**:
1. Set feature at "plan" phase
2. Run `gemini`
3. Type: `Write a function to handle user authentication`
4. Observe whether write tools are available
**Expected Behavior**: BeforeToolSelection hook (before-tool-selection.js) detects "plan" phase and restricts available tools to read-only set (read_file, grep_search, glob_tool, etc.). write_file and run_shell_command are excluded from allowed tools.
**Pass Criteria**: Gemini cannot execute write_file during plan phase; explains that plan phase is read-only; suggests completing plan first
**Fail Criteria**: File is written during plan phase; no tool restriction applied

---

#### CTX-13: Permission Hierarchy in BeforeTool Hook
**Philosophy**: Context Engineering - 3-level permission system (deny/ask/allow)
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Active Gemini CLI session
**Steps**:
1. Start a Gemini CLI session
2. Test DENY: Type `Run: rm -rf *` -> Observe block
3. Test ASK: Type `Run: git push --force origin main` -> Observe warning
4. Test ALLOW: Type `Read the package.json file` -> Observe no restriction
**Expected Behavior**:
- DENY: BeforeTool blocks `rm -rf *` with "Dangerous command pattern detected"
- ASK: BeforeTool warns about force push, adds caution message
- ALLOW: Read operations pass through without warnings
**Pass Criteria**: All three permission levels behave correctly; deny blocks, ask warns, allow passes silently
**Fail Criteria**: Dangerous command not blocked; no warning for force push; false warnings on read operations

---

#### CTX-14: Context Compaction - PreCompress Hook
**Philosophy**: Context Engineering - State preservation during compression
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Active Gemini CLI session with active PDCA feature; long conversation approaching context limits
**Steps**:
1. Start a Gemini CLI session with active PDCA feature
2. Have an extended conversation (10+ exchanges) to build up context
3. If context compaction triggers (or simulate by observing PreCompress hook behavior)
4. Continue working after compaction
**Expected Behavior**: PreCompress hook (pre-compress.js) saves PDCA state snapshot to `docs/.pdca-snapshots/`. After context compaction, PDCA state is still available because it is persisted in `.pdca-status.json` and restored on next SessionStart.
**Pass Criteria**: PDCA state survives context compaction; feature phase and match rate preserved; snapshot file created in `.pdca-snapshots/`
**Fail Criteria**: PDCA state lost after compaction; feature phase reset; no snapshot created

---

#### CTX-15: 10-Event Hook System Coverage
**Philosophy**: Context Engineering - 5-layer hook system with 10 events
**Test Type**: Gemini CLI Interactive
**Prerequisites**: Full bkit-gemini installation with all hooks configured
**Steps**:
1. Verify `hooks/hooks.json` contains all 10 event handlers
2. Start a session (triggers SessionStart)
3. Type a message (triggers BeforeAgent, BeforeModel)
4. Request a tool use (triggers BeforeToolSelection, BeforeTool)
5. After tool execution (triggers AfterTool)
6. After agent processing (triggers AfterAgent, AfterModel)
7. End session (triggers SessionEnd)
8. For PreCompress, observe during long sessions
**Expected Behavior**: All 10 hook events are registered and functional:
- SessionStart: bkit-session-init
- BeforeAgent: bkit-intent-detection
- BeforeModel: bkit-before-model
- AfterModel: bkit-after-model
- BeforeToolSelection: bkit-tool-filter
- BeforeTool: bkit-pre-write, bkit-pre-bash
- AfterTool: bkit-post-write, bkit-post-bash, bkit-post-skill
- AfterAgent: bkit-agent-cleanup
- PreCompress: bkit-context-save
- SessionEnd: bkit-cleanup
**Pass Criteria**: All hooks registered in hooks.json; each hook script exists and is executable; no hook errors during normal session flow
**Fail Criteria**: Missing hook registrations; hook scripts not found; errors during hook execution

---

## User Journey Scenarios (12 cases: UJ-S/D/E-01~04)

### Starter User Journey (UJ-S-01 ~ UJ-S-04)

---

#### UJ-S-01: First Contact - New Starter User
**Philosophy**: User Journey Stage 1 - First contact (SessionStart)
**Test Type**: Gemini CLI Interactive End-to-End
**Prerequisites**: Clean `/tmp/test-starter` with only `index.html`; no bkit state files
**Steps**:
1. Navigate to `/tmp/test-starter`
2. Ensure no `docs/` directory
3. Run `gemini`
4. Observe welcome behavior
5. Select "Learn bkit" option
**Expected Behavior**: SessionStart detects first-time user (no `.bkit-memory.json`). Presents Welcome section with 4 options. User selects "Learn bkit". Response provides learning-oriented introduction to bkit and development pipeline.
**Pass Criteria**: Welcome shown; 4 options presented; selection honored; learning content displayed in beginner-friendly format
**Fail Criteria**: No welcome; fewer options; skips to technical content

---

#### UJ-S-02: Level Awareness - Starter Detection
**Philosophy**: User Journey Stage 2 - Level awareness (auto-detection)
**Test Type**: Gemini CLI Interactive End-to-End
**Prerequisites**: Continuing from UJ-S-01 or fresh session in Starter project
**Steps**:
1. In Starter project session
2. Type: `I want to add a photo gallery to my website`
**Expected Behavior**: bkit recognizes Starter level context. Provides Starter-appropriate guidance (HTML/CSS/JS, static site approach). Uses `bkit-learning` output style with concept explanations. Gently suggests documentation.
**Pass Criteria**: Response uses beginner-friendly language; suggests static-site approach; no complex framework recommendations; learning-oriented output style
**Fail Criteria**: Suggests Next.js or Kubernetes; enterprise jargon; overwhelming technical detail

---

#### UJ-S-03: PDCA Adoption - Simple Plan
**Philosophy**: User Journey Stage 3 - PDCA adoption
**Test Type**: Gemini CLI Interactive End-to-End
**Prerequisites**: Continuing Starter session
**Steps**:
1. Type: `I want to add a contact form`
2. If bkit suggests PDCA, follow along: `/pdca plan contact-form`
3. Review the generated plan
**Expected Behavior**: bkit suggests a lightweight PDCA approach appropriate for Starter level. Plan document is simple and approachable, not overwhelming. User begins forming documentation habits.
**Pass Criteria**: PDCA suggestion is gentle, not mandatory-feeling; plan document is simple and short; appropriate for beginners; creates positive documentation experience
**Fail Criteria**: Overwhelming PDCA ceremony; plan template too complex for Starter; no PDCA guidance at all

---

#### UJ-S-04: Quality Culture - First Gap Analysis
**Philosophy**: User Journey Stage 4 - Quality culture
**Test Type**: Gemini CLI Interactive End-to-End
**Prerequisites**: Starter project with plan and simple implementation
**Steps**:
1. Have a simple plan document and basic implementation
2. Type: `/pdca analyze contact-form`
3. Review the gap analysis
**Expected Behavior**: Gap analysis is simplified for Starter level. Results presented in learning-friendly format. Even at Starter level, the concept of design-vs-implementation comparison is introduced.
**Pass Criteria**: Gap analysis presented clearly; results understandable by beginner; introduces quality concepts in approachable way
**Fail Criteria**: Complex enterprise-style analysis; overwhelming metrics; no educational value

---

### Dynamic User Journey (UJ-D-01 ~ UJ-D-04)

---

#### UJ-D-01: First Contact - New Dynamic User
**Philosophy**: User Journey Stage 1 - First contact
**Test Type**: Gemini CLI Interactive End-to-End
**Prerequisites**: Clean `/tmp/test-dynamic` with `docker-compose.yml`, `lib/bkend/`, `api/`; no bkit state
**Steps**:
1. Navigate to `/tmp/test-dynamic`
2. Ensure no `docs/` directory
3. Run `gemini`
4. Observe welcome
5. Select "Start new project"
**Expected Behavior**: SessionStart detects first-time user, Dynamic level. Presents 4 options. User selects "Start new project". Suggests `/dynamic` skill for setup.
**Pass Criteria**: Welcome shown; Dynamic level detected; setup guidance provided; `/dynamic` skill referenced
**Fail Criteria**: Wrong level detected; Starter-level guidance; no setup help

---

#### UJ-D-02: Level Awareness - Dynamic Setup
**Philosophy**: User Journey Stage 2 - Level awareness
**Test Type**: Gemini CLI Interactive End-to-End
**Prerequisites**: Continuing from UJ-D-01
**Steps**:
1. Type: `Help me set up a fullstack app with authentication`
**Expected Behavior**: bkit recognizes Dynamic level and "login"/"auth" skill triggers. Activates Dynamic-appropriate context. Suggests `bkend` integration and PDCA plan for the auth feature. Uses `bkit-pdca-guide` output style.
**Pass Criteria**: Dynamic-level guidance; mentions BaaS/bkend integration; PDCA workflow suggested; pdca-guide output style
**Fail Criteria**: Static-site guidance; no PDCA suggestion; Enterprise-level complexity

---

#### UJ-D-03: PDCA Adoption - Full Cycle
**Philosophy**: User Journey Stage 3 - Complete PDCA adoption
**Test Type**: Gemini CLI Interactive End-to-End
**Prerequisites**: Dynamic project
**Steps**:
1. Type: `/pdca plan auth-system`
2. Review plan, then: `/pdca design auth-system`
3. Review design, then implement (or use `/pdca do auth-system`)
4. After implementation: `/pdca analyze auth-system`
5. If < 90%: `/pdca iterate auth-system`
6. If >= 90%: `/pdca report auth-system`
**Expected Behavior**: Full PDCA cycle executes through all phases. Each phase generates appropriate documentation. Gap analysis provides quantitative match rate. The complete cycle demonstrates document-driven development.
**Pass Criteria**: All PDCA phases execute in order; documents generated at each phase; match rate calculated; cycle completes with report
**Fail Criteria**: Phase skipped; documents missing; no match rate; cycle breaks

---

#### UJ-D-04: Quality Culture - Iteration and Improvement
**Philosophy**: User Journey Stage 4 - Quality culture adoption
**Test Type**: Gemini CLI Interactive End-to-End
**Prerequisites**: Feature at "check" phase with matchRate 78%
**Steps**:
1. After gap analysis shows 78%
2. Type: `/pdca iterate auth-system`
3. Review improvements
4. Type: `/pdca analyze auth-system` again
5. Observe improved match rate
**Expected Behavior**: Iteration improves implementation based on gap analysis. Second analysis shows improved match rate. Process demonstrates continuous improvement cycle.
**Pass Criteria**: Match rate improves after iteration; specific gaps fixed; continuous improvement demonstrated; iterationCount incremented
**Fail Criteria**: No improvement after iteration; same match rate; iteration does nothing

---

### Enterprise User Journey (UJ-E-01 ~ UJ-E-04)

---

#### UJ-E-01: First Contact - New Enterprise User
**Philosophy**: User Journey Stage 1 - First contact
**Test Type**: Gemini CLI Interactive End-to-End
**Prerequisites**: Clean `/tmp/test-enterprise` with `kubernetes/`, `terraform/`, `services/`; no bkit state
**Steps**:
1. Navigate to `/tmp/test-enterprise`
2. Ensure no `docs/` directory
3. Run `gemini`
4. Observe welcome
5. Select "Start new project"
**Expected Behavior**: SessionStart detects first-time user, Enterprise level. Presents 4 options. User selects "Start new project". Suggests `/enterprise` skill for MSA setup.
**Pass Criteria**: Welcome shown; Enterprise level detected; MSA/enterprise setup guidance; `/enterprise` skill referenced
**Fail Criteria**: Wrong level; Starter guidance; no enterprise context

---

#### UJ-E-02: Level Awareness - Enterprise Architecture
**Philosophy**: User Journey Stage 2 - Level awareness
**Test Type**: Gemini CLI Interactive End-to-End
**Prerequisites**: Continuing from UJ-E-01
**Steps**:
1. Type: `Design the authentication microservice architecture`
**Expected Behavior**: bkit recognizes Enterprise level. Triggers "microservices" and "architecture" keywords. Activates enterprise-expert and/or infra-architect agent context. Uses `bkit-enterprise` output style with tradeoff analysis and deployment considerations.
**Pass Criteria**: Enterprise-level architecture discussion; mentions microservice patterns; tradeoff analysis provided; CTO-level output style
**Fail Criteria**: Simple CRUD guidance; no architecture patterns; beginner-level explanation

---

#### UJ-E-03: PDCA Adoption - Enterprise Quality
**Philosophy**: User Journey Stage 3 - Rigorous PDCA for enterprise
**Test Type**: Gemini CLI Interactive End-to-End
**Prerequisites**: Enterprise project
**Steps**:
1. Type: `/pdca plan auth-service`
2. Plan generated with Enterprise-level detail
3. Type: `/pdca design auth-service`
4. Design includes MSA considerations, security analysis
5. Implement the service
6. Type: `/pdca analyze auth-service`
**Expected Behavior**: Enterprise PDCA includes additional considerations: security review, deployment strategy, scalability analysis. Plan and design documents are more comprehensive than Dynamic level. Quality gate at 90% is strictly enforced.
**Pass Criteria**: Enterprise-level documents with security/scalability sections; comprehensive gap analysis; strict 90% gate; more thorough than Dynamic-level PDCA
**Fail Criteria**: Same detail level as Starter/Dynamic; no security considerations; relaxed quality gate

---

#### UJ-E-04: Quality Culture - Enterprise Continuous Improvement
**Philosophy**: User Journey Stage 4 - Enterprise quality culture
**Test Type**: Gemini CLI Interactive End-to-End
**Prerequisites**: Enterprise feature at "check" phase with matchRate 88%
**Steps**:
1. Gap analysis shows 88% match rate
2. Type: `/pdca iterate auth-service`
3. Review improvements
4. Run `/pdca analyze auth-service` again
5. When >= 90%, type: `/pdca report auth-service`
**Expected Behavior**: At Enterprise level, the 90% gate is non-negotiable. Iteration addresses remaining 12% gap. Final report includes enterprise-specific sections (deployment strategy, security review summary, team standardization recommendations).
**Pass Criteria**: Strict 90% gate enforcement; comprehensive iteration; enterprise-grade completion report; team standardization recommendations
**Fail Criteria**: Report generated below 90%; minimal iteration effort; report missing enterprise sections

---

## Summary

| Test Category | Case Range | Count | Key Validation |
|--------------|-----------|:-----:|----------------|
| **AF: Automation First** | AF-01 ~ AF-14 | 14 | Level detection, 8-language triggers, output styles, PDCA auto-progression |
| **NG: No Guessing** | NG-01 ~ NG-12 | 12 | Design-first, ambiguity detection, permissions, phase enforcement, user confirmation |
| **DC: Docs = Code** | DC-01 ~ DC-12 | 12 | PDCA document generation, status tracking, template compliance, multi-feature |
| **ANC: AI-Native Competency** | ANC-01 ~ ANC-12 | 12 | Verification match rates, direction guidance, quality gates, task classification |
| **VD: Value Delivery** | VD-01 ~ VD-09 | 9 | Level-appropriate value, output styles, progressive complexity |
| **CTX: Context @import** | CTX-01 ~ CTX-07 | 7 | 6 module loading verification, combined context test |
| **CTX: Hierarchy & Injection** | CTX-08 ~ CTX-15 | 8 | 4-level hierarchy, dynamic injection hooks, permissions, 10-event coverage |
| **UJ: User Journey** | UJ-S/D/E-01~04 | 12 | End-to-end Starter/Dynamic/Enterprise 4-stage journeys |
| **Total** | | **86** | 59 Philosophy + 15 Context + 12 User Journey |

---

*bkit Vibecoding Kit v1.5.1 - Test Design Document*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
