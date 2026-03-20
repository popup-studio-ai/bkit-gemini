# v2.0.0 Test Cases: Configuration + Context Engineering

> 120 Test Cases for bkit-gemini v2.0.0 Configuration and Context Engineering modules

---

## Part A: Configuration Tests (60 TCs)

### A1. bkit.config.json -- Schema and Version (8 TCs)

**TC-A1-01: Version field is exactly "2.0.0"**
- Read bkit.config.json and parse JSON
- Assert `version` equals the string `"2.0.0"`
- Fail if version is missing, null, or any other value

**TC-A1-02: Platform field is "gemini" with no alternatives**
- Assert `platform` equals `"gemini"`
- Assert there is no `platforms` array, no `supportedPlatforms`, no `"claude"` string anywhere in the file

**TC-A1-03: $schema field points to local schema file**
- Assert `$schema` equals `"./bkit.config.schema.json"`
- Validate that `bkit.config.schema.json` exists at the project root

**TC-A1-04: minGeminiCliVersion is "0.34.0"**
- Assert `compatibility.minGeminiCliVersion` equals `"0.34.0"`

**TC-A1-05: testedVersions contains "0.34.0"**
- Assert `compatibility.testedVersions` is an array
- Assert the array includes `"0.34.0"`

**TC-A1-06: taskTracker.directCrud is true**
- Assert `compatibility.taskTracker.directCrud` is `true`
- Assert `compatibility.taskTracker.bridgeEnabled` is `true`
- Assert `compatibility.taskTracker.minVersion` is `"0.34.0"`

**TC-A1-07: skillsSystem.nativeActivation is true**
- Assert `compatibility.skillsSystem.nativeActivation` is `true`
- Assert `compatibility.skillsSystem.enabled` is `true`

**TC-A1-08: subagentPolicies.enabled is true**
- Assert `compatibility.subagentPolicies.enabled` is `true`
- Assert `compatibility.subagentPolicies.minVersion` is `"0.34.0"`

---

### A2. bkit.config.json -- Model Routing (6 TCs)

**TC-A2-01: modelRouting.enabled is true**
- Assert `modelRouting.enabled` is `true`

**TC-A2-02: phaseRules contains all 6 PDCA phases**
- Assert `modelRouting.phaseRules` has exactly the keys: `plan`, `design`, `do`, `check`, `act`, `report`

**TC-A2-03: plan/design/do phases route to "pro"**
- Assert `modelRouting.phaseRules.plan` equals `"pro"`
- Assert `modelRouting.phaseRules.design` equals `"pro"`
- Assert `modelRouting.phaseRules.do` equals `"pro"`

**TC-A2-04: check/act/report phases route to "flash"**
- Assert `modelRouting.phaseRules.check` equals `"flash"`
- Assert `modelRouting.phaseRules.act` equals `"flash"`
- Assert `modelRouting.phaseRules.report` equals `"flash"`

**TC-A2-05: phaseRules values are limited to "pro" and "flash"**
- For every value in `modelRouting.phaseRules`, assert it is either `"pro"` or `"flash"`
- No other model tier should appear

**TC-A2-06: modelRouting section has no stale CC references**
- Grep `modelRouting` section for strings: `"claude"`, `"sonnet"`, `"opus"`, `"haiku"`
- Assert none found

---

### A3. bkit.config.json -- Phase-Aware Context (4 TCs)

**TC-A3-01: context.phaseAware.enabled is true**
- Assert `context.phaseAware.enabled` is `true`

**TC-A3-02: context.phaseAware.strategy is "conditional-import"**
- Assert `context.phaseAware.strategy` equals `"conditional-import"`

**TC-A3-03: context section has no dualMode flag**
- Assert there is no `dualMode` key anywhere in the `context` object tree
- Assert there is no `dualMode` key in the `hooks` section either

**TC-A3-04: runtimeHooks has no dualMode**
- Assert `compatibility.runtimeHooks` has only `enabled` and `minVersion` keys
- Assert no `dualMode`, `legacyFallback`, or `claudeCompatibility` keys exist

---

### A4. bkit.config.json -- Level Detection (8 TCs)

**TC-A4-01: Enterprise detection directories are correct**
- Assert `levelDetection.enterprise.directories` equals `["kubernetes", "terraform", "k8s", "infra"]`

**TC-A4-02: Dynamic detection directories are correct**
- Assert `levelDetection.dynamic.directories` equals `["lib/bkend", "supabase", "api", "backend"]`

**TC-A4-03: Dynamic detection files include .mcp.json and docker-compose.yml**
- Assert `levelDetection.dynamic.files` contains `".mcp.json"` and `"docker-compose.yml"`

**TC-A4-04: Dynamic detection packagePatterns are correct**
- Assert `levelDetection.dynamic.packagePatterns` contains `"bkend"`, `"@supabase"`, `"firebase"`

**TC-A4-05: Default level is "Starter"**
- Assert `levelDetection.default` equals `"Starter"`

**TC-A4-06: detectProjectLevel returns "Enterprise" when infra/ exists**
- Mock filesystem with `infra/` directory
- Call `detectProjectLevel(projectDir)`
- Assert result is `"Enterprise"`

**TC-A4-07: detectProjectLevel returns "Dynamic" when docker-compose.yml exists**
- Mock filesystem with `docker-compose.yml` file (no enterprise dirs)
- Call `detectProjectLevel(projectDir)`
- Assert result is `"Dynamic"`

**TC-A4-08: detectProjectLevel returns "Starter" when no indicators exist**
- Mock empty filesystem (no enterprise dirs, no dynamic indicators, no package.json)
- Call `detectProjectLevel(projectDir)`
- Assert result is `"Starter"`

---

### A5. bkit.config.json -- Output Styles and Agents (6 TCs)

**TC-A5-01: outputStyles.default is "bkit-pdca-guide"**
- Assert `outputStyles.default` equals `"bkit-pdca-guide"`

**TC-A5-02: Level-specific output style defaults are correct**
- Assert `outputStyles.levelDefaults.Starter` equals `"bkit-learning"`
- Assert `outputStyles.levelDefaults.Dynamic` equals `"bkit-pdca-guide"`
- Assert `outputStyles.levelDefaults.Enterprise` equals `"bkit-enterprise"`

**TC-A5-03: Available styles list contains exactly 4 entries**
- Assert `outputStyles.available` has length 4
- Assert it contains: `"bkit-learning"`, `"bkit-pdca-guide"`, `"bkit-enterprise"`, `"bkit-pdca-enterprise"`

**TC-A5-04: Agent level-based mapping is correct**
- Assert `agents.levelBased.Starter` equals `"starter-guide"`
- Assert `agents.levelBased.Dynamic` equals `"bkend-expert"`
- Assert `agents.levelBased.Enterprise` equals `"enterprise-expert"`

**TC-A5-05: Agent task-based mapping covers 7 task types**
- Assert `agents.taskBased` has keys: `"code review"`, `"security scan"`, `"design review"`, `"gap analysis"`, `"report"`, `"QA"`, `"pipeline"`

**TC-A5-06: No CC agent references in config**
- Grep entire bkit.config.json for: `"claude"`, `"anthropic"`, `"CC"`, `"claude-code"`
- Assert none found (case-insensitive)

---

### A6. gemini-extension.json (8 TCs)

**TC-A6-01: version is "2.0.0"**
- Parse gemini-extension.json
- Assert `version` equals `"2.0.0"`

**TC-A6-02: contextFileName is an array containing "GEMINI.md"**
- Assert `contextFileName` is an array (not a string)
- Assert the array contains exactly `"GEMINI.md"`
- Assert no `"CLAUDE.md"` entry exists

**TC-A6-03: name is "bkit"**
- Assert `name` equals `"bkit"`

**TC-A6-04: settings array has exactly 2 entries**
- Assert `settings` is an array with length 2

**TC-A6-05: Output Style setting is correctly defined**
- Assert `settings[0].name` equals `"Output Style"`
- Assert `settings[0].envVar` equals `"BKIT_OUTPUT_STYLE"`

**TC-A6-06: Project Level setting is correctly defined**
- Assert `settings[1].name` equals `"Project Level"`
- Assert `settings[1].envVar` equals `"BKIT_PROJECT_LEVEL"`

**TC-A6-07: plan.directory is correct**
- Assert `plan.directory` equals `"docs/01-plan"`

**TC-A6-08: No excludeTools field exists**
- Assert `excludeTools` key does not exist in gemini-extension.json
- This field was deprecated in favor of TOML policies

---

### A7. TOML Policy -- bkit-extension-policy.toml (8 TCs)

**TC-A7-01: File exists at policies/bkit-extension-policy.toml**
- Assert file exists at the expected path

**TC-A7-02: Header identifies Tier 2**
- Assert file header comment contains `"Tier 2"`
- Assert header contains `"DENY and ASK_USER decisions only"`

**TC-A7-03: rm -rf is denied with priority 100**
- Parse TOML rules
- Find rule where `toolName = "run_shell_command"` and `commandPrefix = "rm -rf"`
- Assert `decision` equals `"deny"` and `priority` equals `100`

**TC-A7-04: git push --force is denied with priority 100**
- Find rule where `commandPrefix = "git push --force"`
- Assert `decision` equals `"deny"` and `priority` equals `100`

**TC-A7-05: git reset --hard is ask_user with priority 50**
- Find rule where `commandPrefix = "git reset --hard"`
- Assert `decision` equals `"ask_user"` and `priority` equals `50`

**TC-A7-06: rm -r is ask_user with priority 50**
- Find rule where `commandPrefix = "rm -r"`
- Assert `decision` equals `"ask_user"` and `priority` equals `50`

**TC-A7-07: No "allow" decisions exist in extension policy**
- For all rules in this file, assert no `decision = "allow"` exists
- Extension (Tier 2) policies must not grant "allow"

**TC-A7-08: Exactly 4 rules defined**
- Count `[[rule]]` entries
- Assert exactly 4 rules

---

### A8. TOML Policy -- bkit-permissions.toml (8 TCs)

**TC-A8-01: File exists at .gemini/policies/bkit-permissions.toml**
- Assert file exists

**TC-A8-02: Safe command allowlist includes git status, git log, git diff**
- For each of `"git status"`, `"git log"`, `"git diff"`, find a rule with `commandPrefix` matching and `decision = "allow"` and `priority = 20`

**TC-A8-03: Safe command allowlist includes ls, cat, echo**
- For each of `"ls"`, `"cat"`, `"echo"`, find a matching allow rule at priority 20

**TC-A8-04: npm test and npm run are allowed**
- Find allow rules for `"npm test"` and `"npm run"` at priority 20

**TC-A8-05: node command is allowed**
- Find allow rule for `"node"` at priority 20

**TC-A8-06: curl and wget are denied**
- Find deny rules for `"curl"` and `"wget"` at priority 100

**TC-A8-07: Default shell command rule is ask_user with priority 5**
- Find a rule where `toolName = "run_shell_command"` with no `commandPrefix` and `decision = "ask_user"` and `priority = 5`

**TC-A8-08: write_file, replace, read_file are allowed at priority 10**
- For each of `"write_file"`, `"replace"`, `"read_file"`, find a rule with `decision = "allow"` and `priority = 10`

---

### A9. TOML Policy -- bkit-starter-policy.toml (4 TCs)

**TC-A9-01: File exists at .gemini/policies/bkit-starter-policy.toml**
- Assert file exists

**TC-A9-02: write_file and replace are ask_user in normal mode**
- Find rules for `write_file` and `replace` with `decision = "ask_user"` and `priority = 30`

**TC-A9-03: Plan mode denies write_file, replace, and run_shell_command**
- Find rules with `modes = ["plan_mode"]` for all three tool names
- Assert `decision = "deny"` and `priority = 110` for each

**TC-A9-04: Starter level completely denies rm command prefix**
- Find rule for `commandPrefix = "rm"` (without -rf)
- Assert `decision = "deny"` and `priority = 100`
- This is stricter than the Dynamic/Enterprise permission (which only denies `rm -rf`)

---

## Part B: Context Engineering Tests (60 TCs)

### B1. GEMINI.md -- Lean Format (8 TCs)

**TC-B1-01: GEMINI.md exists at project root**
- Assert file exists at `./GEMINI.md`

**TC-B1-02: File is under 30 lines**
- Count lines in GEMINI.md
- Assert line count is less than or equal to 30

**TC-B1-03: Exactly 2 @import directives**
- Count lines starting with `@` (import directives)
- Assert exactly 2 found

**TC-B1-04: First import is commands.md**
- Assert one import line is `@.gemini/context/commands.md`

**TC-B1-05: Second import is core-rules.md**
- Assert one import line is `@.gemini/context/core-rules.md`

**TC-B1-06: No CC references in GEMINI.md**
- Grep for: `claude`, `CLAUDE`, `Claude Code`, `CC`, `anthropic`
- Assert none found

**TC-B1-07: Contains Phase-Aware Context description**
- Assert file contains the string `"Phase-Aware"` or `"phase-aware"`
- Assert file mentions that context files are loaded dynamically per phase

**TC-B1-08: Contains version header "bkit v2.0.0"**
- Assert first line is `# bkit v2.0.0`

---

### B2. Phase-Aware Loading -- PHASE_CONTEXT_MAP (12 TCs)

**TC-B2-01: PHASE_CONTEXT_MAP is defined in session-start.js**
- Parse session-start.js
- Assert `PHASE_CONTEXT_MAP` constant exists and is a frozen or plain object

**TC-B2-02: Map has exactly 6 phase keys**
- Assert PHASE_CONTEXT_MAP has keys: `plan`, `design`, `do`, `check`, `act`, `idle`

**TC-B2-03: idle phase loads 5 files**
- Assert `PHASE_CONTEXT_MAP.idle` has length 5
- Assert it contains: `commands.md`, `pdca-rules.md`, `agent-triggers.md`, `skill-triggers.md`, `feature-report.md`

**TC-B2-04: plan phase loads 4 files**
- Assert `PHASE_CONTEXT_MAP.plan` has length 4
- Assert it contains: `commands.md`, `pdca-rules.md`, `feature-report.md`, `executive-summary-rules.md`

**TC-B2-05: design phase loads 3 files**
- Assert `PHASE_CONTEXT_MAP.design` has length 3
- Assert it contains: `pdca-rules.md`, `feature-report.md`, `executive-summary-rules.md`

**TC-B2-06: do phase loads 3 files (includes tool-reference)**
- Assert `PHASE_CONTEXT_MAP.do` has length 3
- Assert it contains: `tool-reference.md`, `skill-triggers.md`, `feature-report.md`

**TC-B2-07: check phase loads 2 files**
- Assert `PHASE_CONTEXT_MAP.check` has length 2
- Assert it contains: `pdca-rules.md`, `feature-report.md`

**TC-B2-08: act phase loads 2 files**
- Assert `PHASE_CONTEXT_MAP.act` has length 2
- Assert it contains: `pdca-rules.md`, `feature-report.md`

**TC-B2-09: loadPhaseAwareContext returns correct content for plan phase**
- Call `loadPhaseAwareContext(pluginRoot, 'plan')`
- Assert result starts with `"## Phase-Aware Context (plan)"`
- Assert result contains content from all 4 plan-phase files

**TC-B2-10: loadPhaseAwareContext returns correct content for do phase**
- Call `loadPhaseAwareContext(pluginRoot, 'do')`
- Assert result contains tool reference content (23 tools table)
- Assert result does NOT contain commands.md content

**TC-B2-11: loadPhaseAwareContext defaults to idle for unknown phase**
- Call `loadPhaseAwareContext(pluginRoot, 'nonexistent')`
- Assert result starts with `"## Phase-Aware Context (idle)"`
- Assert result contains content from all 5 idle-phase files

**TC-B2-12: loadPhaseAwareContext defaults to idle for null phase**
- Call `loadPhaseAwareContext(pluginRoot, null)`
- Assert result starts with `"## Phase-Aware Context (idle)"`

---

### B3. Phase-Aware Loading -- File Existence and Correctness (7 TCs)

**TC-B3-01: All 7 original context files exist**
- Assert each of these files exists in `.gemini/context/`:
  - `commands.md`
  - `pdca-rules.md`
  - `agent-triggers.md`
  - `skill-triggers.md`
  - `feature-report.md`
  - `executive-summary-rules.md`
  - `tool-reference.md`

**TC-B3-02: tool-reference-v2.md also exists (new v2 version)**
- Assert `.gemini/context/tool-reference-v2.md` exists

**TC-B3-03: core-rules.md contains PDCA rules**
- Read `core-rules.md`
- Assert it contains `"PDCA Workflow Rules"`
- Assert it contains the 6-step core cycle

**TC-B3-04: core-rules.md contains Feature Report template**
- Assert `core-rules.md` contains `"Feature Usage Report"` or `"Feature Usage"`

**TC-B3-05: core-rules.md contains Executive Summary rule**
- Assert `core-rules.md` contains `"Executive Summary"`

**TC-B3-06: tool-reference-v2.md lists 23 tools**
- Count rows in the Built-in Tools table in `tool-reference-v2.md`
- Assert exactly 23 tool entries

**TC-B3-07: tool-reference-v2.md has no CC mapping references**
- Grep `tool-reference-v2.md` for: `CLAUDE_TO_GEMINI`, `claudeToolName`, `CC mapping`, `Claude Code`
- Assert none found

---

### B4. Context Anchoring (10 TCs)

**TC-B4-01: extractDocumentAnchors is defined in before-model.js**
- Assert function `extractDocumentAnchors` exists in `hooks/scripts/before-model.js`

**TC-B4-02: Returns null when no .pdca-status.json exists**
- Call `extractDocumentAnchors(emptyDir, 'design')`
- Assert result is `null`

**TC-B4-03: Returns null when no primaryFeature is set**
- Create `.pdca-status.json` with `primaryFeature: null`
- Call `extractDocumentAnchors(projectDir, 'design')`
- Assert result is `null`

**TC-B4-04: Returns null for plan phase (no anchor needed)**
- Create `.pdca-status.json` with a valid primaryFeature
- Call `extractDocumentAnchors(projectDir, 'plan')`
- Assert result is `null` (plan phase has no prior document to anchor from)

**TC-B4-05: Returns plan excerpt during design phase**
- Create `.pdca-status.json` with primaryFeature = "test-feature"
- Create `docs/01-plan/features/test-feature.plan.md` with an Executive Summary section
- Call `extractDocumentAnchors(projectDir, 'design')`
- Assert result contains `"Context Anchor (01-plan)"`

**TC-B4-06: Returns design excerpt during do phase**
- Create `docs/02-design/features/test-feature.design.md` with Executive Summary
- Call `extractDocumentAnchors(projectDir, 'do')`
- Assert result contains `"Context Anchor (02-design)"`

**TC-B4-07: Returns both design and plan excerpts during check phase**
- Create both plan and design documents with Executive Summary sections
- Call `extractDocumentAnchors(projectDir, 'check')`
- Assert result contains `"Context Anchor (02-design)"` and `"Context Anchor (01-plan)"`

**TC-B4-08: Returns analysis excerpt during act phase**
- Create `docs/03-analysis/features/test-feature.analysis.md` with Executive Summary
- Call `extractDocumentAnchors(projectDir, 'act')`
- Assert result contains `"Context Anchor (03-analysis)"`

**TC-B4-09: Respects MAX_ANCHOR_CHARS limit (2000)**
- Create a plan document with an Executive Summary exceeding 3000 characters
- Call `extractDocumentAnchors(projectDir, 'design')`
- Assert result length is at most 2000 + length of `"[...truncated]"` suffix
- Assert result ends with `"[...truncated]"`

**TC-B4-10: Handles missing documents gracefully**
- Create `.pdca-status.json` with primaryFeature = "missing-feature"
- No corresponding plan/design documents exist
- Call `extractDocumentAnchors(projectDir, 'design')`
- Assert result is `null` (not an error)

---

### B5. Model Routing (8 TCs)

**TC-B5-01: MODEL_ROUTING object is defined in before-model.js**
- Assert `MODEL_ROUTING` constant exists in `hooks/scripts/before-model.js`
- Assert it is frozen (Object.freeze)

**TC-B5-02: MODEL_ROUTING has entries for all 6 phases**
- Assert MODEL_ROUTING has keys: `plan`, `design`, `do`, `check`, `act`, `report`

**TC-B5-03: plan/design/do prefer "pro" model**
- Assert `MODEL_ROUTING.plan.preferredModel` equals `"pro"`
- Assert `MODEL_ROUTING.design.preferredModel` equals `"pro"`
- Assert `MODEL_ROUTING.do.preferredModel` equals `"pro"`

**TC-B5-04: check/act/report prefer "flash" model**
- Assert `MODEL_ROUTING.check.preferredModel` equals `"flash"`
- Assert `MODEL_ROUTING.act.preferredModel` equals `"flash"`
- Assert `MODEL_ROUTING.report.preferredModel` equals `"flash"`

**TC-B5-05: Each routing entry has a reason string**
- For every key in MODEL_ROUTING, assert `reason` is a non-empty string

**TC-B5-06: getModelRoutingHint returns formatted string for "plan"**
- Call `getModelRoutingHint('plan')`
- Assert result matches pattern `"[Model Routing: pro] Deep reasoning for requirements analysis"`

**TC-B5-07: getModelRoutingHint returns formatted string for "check"**
- Call `getModelRoutingHint('check')`
- Assert result matches pattern `"[Model Routing: flash] Comparison/verification is speed-optimized"`

**TC-B5-08: getModelRoutingHint returns null for unknown phase**
- Call `getModelRoutingHint('unknown')`
- Assert result is `null`
- Call `getModelRoutingHint(undefined)`
- Assert result is `null`

---

### B6. Skill Visibility Control (6 TCs)

**TC-B6-01: LEVEL_SKILL_WHITELIST is defined in session-start.js**
- Assert `LEVEL_SKILL_WHITELIST` exists

**TC-B6-02: Starter level has exactly 5 skills**
- Assert `LEVEL_SKILL_WHITELIST.Starter` has length 5
- Assert it contains: `starter`, `pdca`, `bkit-rules`, `bkit-templates`, `development-pipeline`

**TC-B6-03: Dynamic level includes all Starter skills plus additional skills**
- Assert `LEVEL_SKILL_WHITELIST.Dynamic` includes every skill from `LEVEL_SKILL_WHITELIST.Starter`
- Assert it additionally includes: `dynamic`, `bkend-quickstart`, `bkend-auth`, `bkend-data`, `bkend-storage`

**TC-B6-04: Enterprise level is null (all skills available)**
- Assert `LEVEL_SKILL_WHITELIST.Enterprise` is `null`

**TC-B6-05: buildAvailableSkillsSection for Starter shows upgrade hint**
- Call `buildAvailableSkillsSection('Starter')`
- Assert result contains `"Need more?"`
- Assert result contains `"/dynamic"` or `"Level: Dynamic"`

**TC-B6-06: buildAvailableSkillsSection for Enterprise shows "All skills available"**
- Call `buildAvailableSkillsSection('Enterprise')`
- Assert result contains `"All skills available"`

---

### B7. Session-Start Dynamic Context Generation (9 TCs)

**TC-B7-01: generateDynamicContext includes header**
- Call `generateDynamicContext` with minimal valid inputs
- Assert result starts with `"# bkit Vibecoding Kit v2.0.0 - Session Start"`

**TC-B7-02: New user sees welcome section with AskUserQuestion**
- Simulate first session (sessionCount = 1, no primaryFeature)
- Assert output contains `"Welcome to bkit"`
- Assert output contains `"MANDATORY: Call AskUserQuestion"`

**TC-B7-03: Returning user sees previous work section**
- Simulate returning session with primaryFeature = "login-feature" in "do" phase
- Assert output contains `"Previous Work Detected"`
- Assert output contains `"login-feature"`
- Assert output contains `"do"`

**TC-B7-04: Phase recommendation is correct for each phase**
- For phase "plan" + feature "x": assert recommendation contains `"/pdca design x"`
- For phase "do" + feature "x": assert recommendation contains `"/pdca analyze x"`
- For phase "check" + matchRate 75: assert recommendation contains `"/pdca iterate x"`
- For phase "check" + matchRate 95: assert recommendation contains `"/pdca report x"`

**TC-B7-05: Output style section is included when rules exist**
- Set memory.outputStyle = "bkit-enterprise"
- Mock a valid output style file
- Assert output contains `"Output Style: bkit-enterprise"`

**TC-B7-06: Phase-Aware Context is injected based on current phase**
- Set primaryFeature active with phase = "do"
- Assert output contains `"Phase-Aware Context (do)"`
- Assert output contains tool-reference content

**TC-B7-07: Agent Triggers section is always present**
- Assert output contains `"Agent Auto-Triggers (8 Languages)"`
- Assert output contains the keywords table

**TC-B7-08: Feature Report section is always present**
- Assert output contains `"Feature Usage Report (Required)"`

**TC-B7-09: Auto-Trigger section is always present**
- Assert output contains `"Skill Auto-Triggers"`

---

### B8. Before-Model Hook Integration (10 TCs)

**TC-B8-01: processHook returns allow status for empty prompt**
- Call `processHook({ prompt: '' })`
- Assert result is `{ status: 'allow' }` with no additionalContext

**TC-B8-02: processHook returns allow status for short prompt (< 3 chars)**
- Call `processHook({ prompt: 'hi' })`
- Assert result is `{ status: 'allow' }` with no additionalContext

**TC-B8-03: processHook returns phase context when PDCA phase is active**
- Create `.pdca-status.json` with primaryFeature in "plan" phase (at docs/ path)
- Call `processHook({ prompt: 'help me plan this feature', projectDir })`
- Assert result has `additionalContext` containing `"Current PDCA Phase: Plan"`

**TC-B8-04: processHook includes model routing hint**
- With active "plan" phase, call processHook with valid prompt
- Assert result.additionalContext contains `"[Model Routing: pro]"`

**TC-B8-05: processHook includes context anchors when documents exist**
- Create plan document with Executive Summary
- Set phase to "design"
- Call processHook
- Assert result.additionalContext contains `"Context Anchor"`

**TC-B8-06: Phase context for "do" emphasizes implementation guidelines**
- Assert getPhaseContext('do') contains `"Follow the Design document specifications"`
- Assert getPhaseContext('do') contains `"suggest running /pdca analyze"`

**TC-B8-07: Phase context for "check" emphasizes gap analysis**
- Assert getPhaseContext('check') contains `"match rate"`
- Assert getPhaseContext('check') contains `"/pdca iterate"`

**TC-B8-08: Phase context for unknown phase returns null**
- Assert getPhaseContext('deploy') returns `null`
- Assert getPhaseContext(undefined) returns `null`

**TC-B8-09: handler export exists for SDK integration**
- Assert `module.exports.handler` is a function
- Call `handler({ prompt: 'test', projectDir: '/tmp' })`
- Assert result is a promise that resolves to an object with `status` key

**TC-B8-10: Graceful degradation on error**
- Call processHook with invalid projectDir that causes fs read failure
- Assert result is `{ status: 'allow' }` (not an exception)

---

## Summary

| Category | TC Range | Count |
|----------|----------|-------|
| A1. bkit.config.json Schema/Version | TC-A1-01 to TC-A1-08 | 8 |
| A2. Model Routing Config | TC-A2-01 to TC-A2-06 | 6 |
| A3. Phase-Aware Config | TC-A3-01 to TC-A3-04 | 4 |
| A4. Level Detection | TC-A4-01 to TC-A4-08 | 8 |
| A5. Output Styles and Agents | TC-A5-01 to TC-A5-06 | 6 |
| A6. gemini-extension.json | TC-A6-01 to TC-A6-08 | 8 |
| A7. Extension Policy TOML | TC-A7-01 to TC-A7-08 | 8 |
| A8. Permissions Policy TOML | TC-A8-01 to TC-A8-08 | 8 |
| A9. Starter Policy TOML | TC-A9-01 to TC-A9-04 | 4 |
| **Configuration Subtotal** | | **60** |
| B1. GEMINI.md Lean Format | TC-B1-01 to TC-B1-08 | 8 |
| B2. Phase-Aware PHASE_CONTEXT_MAP | TC-B2-01 to TC-B2-12 | 12 |
| B3. Context File Existence | TC-B3-01 to TC-B3-07 | 7 |
| B4. Context Anchoring | TC-B4-01 to TC-B4-10 | 10 |
| B5. Model Routing Logic | TC-B5-01 to TC-B5-08 | 8 |
| B6. Skill Visibility Control | TC-B6-01 to TC-B6-06 | 6 |
| B7. Session-Start Dynamic Context | TC-B7-01 to TC-B7-09 | 9 |
| B8. Before-Model Hook Integration | TC-B8-01 to TC-B8-10 | 10 |
| **Context Engineering Subtotal** | | **60** |
| **Grand Total** | | **120** |
