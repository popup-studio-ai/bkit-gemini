// TC-94: Config + Context Engineering Tests (120 TC)
// Validates bkit v2.0.0 configuration correctness and context engineering architecture
const { PLUGIN_ROOT, assert, assertEqual, assertContains, assertExists } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const ROOT = PLUGIN_ROOT;
const CONFIG_PATH = path.join(ROOT, 'bkit.config.json');
const EXTENSION_PATH = path.join(ROOT, 'gemini-extension.json');
const GEMINI_MD_PATH = path.join(ROOT, 'GEMINI.md');
const CONTEXT_DIR = path.join(ROOT, '.gemini', 'context');
const POLICIES_DIR = path.join(ROOT, '.gemini', 'policies');
const EXT_POLICIES_DIR = path.join(ROOT, 'policies');
const SESSION_START_PATH = path.join(ROOT, 'hooks', 'scripts', 'session-start.js');
const BEFORE_MODEL_PATH = path.join(ROOT, 'hooks', 'scripts', 'before-model.js');

// Pre-load config files
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
const extension = JSON.parse(fs.readFileSync(EXTENSION_PATH, 'utf-8'));
const geminiMd = fs.readFileSync(GEMINI_MD_PATH, 'utf-8');
const sessionStartSrc = fs.readFileSync(SESSION_START_PATH, 'utf-8');
const beforeModelSrc = fs.readFileSync(BEFORE_MODEL_PATH, 'utf-8');

const tests = [

  // ═══════════════════════════════════════════════════════════════
  // SECTION 1: bkit.config.json Core Fields (15 tests)
  // ═══════════════════════════════════════════════════════════════

  { name: 'TC94-01: bkit.config.json version is 2.0.2', fn: () => {
    assertEqual(config.version, '2.0.2', 'config version');
  }},
  { name: 'TC94-02: bkit.config.json platform is gemini', fn: () => {
    assertEqual(config.platform, 'gemini', 'config platform');
  }},
  { name: 'TC94-03: compatibility.minGeminiCliVersion is 0.34.0', fn: () => {
    assertEqual(config.compatibility.minGeminiCliVersion, '0.34.0', 'minGeminiCliVersion');
  }},
  { name: 'TC94-04: compatibility.testedVersions includes 0.34.0', fn: () => {
    assert(config.compatibility.testedVersions.includes('0.34.0'), 'testedVersions should include 0.34.0');
  }},
  { name: 'TC94-05: compatibility.taskTracker.directCrud is true', fn: () => {
    assertEqual(config.compatibility.taskTracker.directCrud, true, 'taskTracker.directCrud');
  }},
  { name: 'TC94-06: compatibility.skillsSystem.nativeActivation is true', fn: () => {
    assertEqual(config.compatibility.skillsSystem.nativeActivation, true, 'skillsSystem.nativeActivation');
  }},
  { name: 'TC94-07: compatibility.subagentPolicies.enabled is true', fn: () => {
    assertEqual(config.compatibility.subagentPolicies.enabled, true, 'subagentPolicies.enabled');
  }},
  { name: 'TC94-08: modelRouting.enabled is true', fn: () => {
    assertEqual(config.modelRouting.enabled, true, 'modelRouting.enabled');
  }},
  { name: 'TC94-09: context.phaseAware.enabled is true', fn: () => {
    assertEqual(config.context.phaseAware.enabled, true, 'context.phaseAware.enabled');
  }},
  { name: 'TC94-10: no runtimeHooks.dualMode property (removed in v2.0.0)', fn: () => {
    const hasDualMode = config.compatibility?.runtimeHooks?.dualMode !== undefined;
    assertEqual(hasDualMode, false, 'runtimeHooks.dualMode should not exist');
  }},
  { name: 'TC94-11: pdca.matchRateThreshold is 90', fn: () => {
    assertEqual(config.pdca.matchRateThreshold, 90, 'pdca.matchRateThreshold');
  }},
  { name: 'TC94-12: pdca.maxIterations is 5', fn: () => {
    assertEqual(config.pdca.maxIterations, 5, 'pdca.maxIterations');
  }},
  { name: 'TC94-13: context.phaseAware.strategy is conditional-import', fn: () => {
    assertEqual(config.context.phaseAware.strategy, 'conditional-import', 'phaseAware strategy');
  }},
  { name: 'TC94-14: compatibility.runtimeHooks.enabled is true', fn: () => {
    assertEqual(config.compatibility.runtimeHooks.enabled, true, 'runtimeHooks.enabled');
  }},
  { name: 'TC94-15: compatibility.skillsSystem.enabled is true', fn: () => {
    assertEqual(config.compatibility.skillsSystem.enabled, true, 'skillsSystem.enabled');
  }},

  // ═══════════════════════════════════════════════════════════════
  // SECTION 2: Level Detection Config (10 tests)
  // ═══════════════════════════════════════════════════════════════

  { name: 'TC94-16: levelDetection.enterprise.directories has kubernetes', fn: () => {
    assert(config.levelDetection.enterprise.directories.includes('kubernetes'), 'should include kubernetes');
  }},
  { name: 'TC94-17: levelDetection.enterprise.directories has terraform', fn: () => {
    assert(config.levelDetection.enterprise.directories.includes('terraform'), 'should include terraform');
  }},
  { name: 'TC94-18: levelDetection.enterprise.directories has k8s', fn: () => {
    assert(config.levelDetection.enterprise.directories.includes('k8s'), 'should include k8s');
  }},
  { name: 'TC94-19: levelDetection.enterprise.directories has infra', fn: () => {
    assert(config.levelDetection.enterprise.directories.includes('infra'), 'should include infra');
  }},
  { name: 'TC94-20: levelDetection.dynamic.directories includes lib/bkend', fn: () => {
    assert(config.levelDetection.dynamic.directories.includes('lib/bkend'), 'should include lib/bkend');
  }},
  { name: 'TC94-21: levelDetection.dynamic.directories includes backend', fn: () => {
    assert(config.levelDetection.dynamic.directories.includes('backend'), 'should include backend');
  }},
  { name: 'TC94-22: levelDetection.dynamic.files includes .mcp.json', fn: () => {
    assert(config.levelDetection.dynamic.files.includes('.mcp.json'), 'should include .mcp.json');
  }},
  { name: 'TC94-23: levelDetection.dynamic.files includes docker-compose.yml', fn: () => {
    assert(config.levelDetection.dynamic.files.includes('docker-compose.yml'), 'should include docker-compose.yml');
  }},
  { name: 'TC94-24: levelDetection.dynamic.packagePatterns includes bkend', fn: () => {
    assert(config.levelDetection.dynamic.packagePatterns.includes('bkend'), 'should include bkend');
  }},
  { name: 'TC94-25: levelDetection.default is Starter', fn: () => {
    assertEqual(config.levelDetection.default, 'Starter', 'default level');
  }},

  // ═══════════════════════════════════════════════════════════════
  // SECTION 3: Output Styles Config (10 tests)
  // ═══════════════════════════════════════════════════════════════

  { name: 'TC94-26: outputStyles.available has 4 styles', fn: () => {
    assertEqual(config.outputStyles.available.length, 4, 'should have 4 available output styles');
  }},
  { name: 'TC94-27: outputStyles.available includes bkit-learning', fn: () => {
    assert(config.outputStyles.available.includes('bkit-learning'), 'should include bkit-learning');
  }},
  { name: 'TC94-28: outputStyles.available includes bkit-pdca-guide', fn: () => {
    assert(config.outputStyles.available.includes('bkit-pdca-guide'), 'should include bkit-pdca-guide');
  }},
  { name: 'TC94-29: outputStyles.available includes bkit-enterprise', fn: () => {
    assert(config.outputStyles.available.includes('bkit-enterprise'), 'should include bkit-enterprise');
  }},
  { name: 'TC94-30: outputStyles.available includes bkit-pdca-enterprise', fn: () => {
    assert(config.outputStyles.available.includes('bkit-pdca-enterprise'), 'should include bkit-pdca-enterprise');
  }},
  { name: 'TC94-31: outputStyles.levelDefaults.Starter is bkit-learning', fn: () => {
    assertEqual(config.outputStyles.levelDefaults.Starter, 'bkit-learning', 'Starter default style');
  }},
  { name: 'TC94-32: outputStyles.levelDefaults.Dynamic is bkit-pdca-guide', fn: () => {
    assertEqual(config.outputStyles.levelDefaults.Dynamic, 'bkit-pdca-guide', 'Dynamic default style');
  }},
  { name: 'TC94-33: outputStyles.levelDefaults.Enterprise is bkit-enterprise', fn: () => {
    assertEqual(config.outputStyles.levelDefaults.Enterprise, 'bkit-enterprise', 'Enterprise default style');
  }},
  { name: 'TC94-34: outputStyles.default is bkit-pdca-guide', fn: () => {
    assertEqual(config.outputStyles.default, 'bkit-pdca-guide', 'default output style');
  }},
  { name: 'TC94-35: modelRouting.phaseRules has all 6 phase entries', fn: () => {
    const phases = Object.keys(config.modelRouting.phaseRules);
    assertEqual(phases.length, 6, 'should have 6 phase rules');
    for (const p of ['plan', 'design', 'do', 'check', 'act', 'report']) {
      assert(phases.includes(p), `should include ${p}`);
    }
  }},

  // ═══════════════════════════════════════════════════════════════
  // SECTION 4: gemini-extension.json (10 tests)
  // ═══════════════════════════════════════════════════════════════

  { name: 'TC94-36: gemini-extension.json version is 2.0.2', fn: () => {
    assertEqual(extension.version, '2.0.2', 'extension version');
  }},
  { name: 'TC94-37: gemini-extension.json contextFileName is an array', fn: () => {
    assert(Array.isArray(extension.contextFileName), 'contextFileName should be an array');
  }},
  { name: 'TC94-38: contextFileName array includes GEMINI.md', fn: () => {
    assert(extension.contextFileName.includes('GEMINI.md'), 'should include GEMINI.md');
  }},
  { name: 'TC94-39: gemini-extension.json name is bkit', fn: () => {
    assertEqual(extension.name, 'bkit', 'extension name');
  }},
  { name: 'TC94-40: gemini-extension.json has settings array', fn: () => {
    assert(Array.isArray(extension.settings), 'settings should be an array');
  }},
  { name: 'TC94-41: gemini-extension.json has plan.directory', fn: () => {
    assert(extension.plan && extension.plan.directory, 'should have plan.directory');
  }},
  { name: 'TC94-42: gemini-extension.json description mentions v2.0.0', fn: () => {
    assertContains(extension.description, 'v2.0.0', 'description should mention v2.0.0');
  }},
  { name: 'TC94-43: gemini-extension.json description mentions Gemini CLI', fn: () => {
    assertContains(extension.description, 'Gemini CLI', 'description should mention Gemini CLI');
  }},
  { name: 'TC94-44: gemini-extension.json license is Apache-2.0', fn: () => {
    assertEqual(extension.license, 'Apache-2.0', 'extension license');
  }},
  { name: 'TC94-45: gemini-extension.json has repository URL', fn: () => {
    assert(extension.repository && extension.repository.includes('github.com'), 'should have a github repository URL');
  }},

  // ═══════════════════════════════════════════════════════════════
  // SECTION 5: Extension Policy TOML (8 tests)
  // ═══════════════════════════════════════════════════════════════

  { name: 'TC94-46: extension policy TOML exists', fn: () => {
    assertExists(path.join(EXT_POLICIES_DIR, 'bkit-extension-policy.toml'), 'extension policy file');
  }},
  { name: 'TC94-47: extension policy has no allow decisions (Tier 2)', fn: () => {
    const content = fs.readFileSync(path.join(EXT_POLICIES_DIR, 'bkit-extension-policy.toml'), 'utf-8');
    const allowMatches = content.match(/decision\s*=\s*"allow"/g);
    assertEqual(allowMatches, null, 'extension policy should have no allow decisions');
  }},
  { name: 'TC94-48: extension policy has deny decision for rm -rf', fn: () => {
    const content = fs.readFileSync(path.join(EXT_POLICIES_DIR, 'bkit-extension-policy.toml'), 'utf-8');
    assertContains(content, 'rm -rf', 'should deny rm -rf');
    assertContains(content, '"deny"', 'should have deny decision');
  }},
  { name: 'TC94-49: extension policy has deny decision for git push --force', fn: () => {
    const content = fs.readFileSync(path.join(EXT_POLICIES_DIR, 'bkit-extension-policy.toml'), 'utf-8');
    assertContains(content, 'git push --force', 'should deny git push --force');
  }},
  { name: 'TC94-50: extension policy has ask_user for git reset --hard', fn: () => {
    const content = fs.readFileSync(path.join(EXT_POLICIES_DIR, 'bkit-extension-policy.toml'), 'utf-8');
    assertContains(content, 'git reset --hard', 'should have git reset --hard');
    assertContains(content, '"ask_user"', 'should have ask_user decision');
  }},
  { name: 'TC94-51: extension policy mentions Tier 2', fn: () => {
    const content = fs.readFileSync(path.join(EXT_POLICIES_DIR, 'bkit-extension-policy.toml'), 'utf-8');
    assertContains(content, 'Tier 2', 'should mention Tier 2');
  }},
  { name: 'TC94-52: extension policy only contains deny and ask_user decisions', fn: () => {
    const content = fs.readFileSync(path.join(EXT_POLICIES_DIR, 'bkit-extension-policy.toml'), 'utf-8');
    const decisions = content.match(/decision\s*=\s*"(\w+)"/g) || [];
    for (const d of decisions) {
      const val = d.match(/"(\w+)"/)[1];
      assert(val === 'deny' || val === 'ask_user', `unexpected decision: ${val}`);
    }
  }},
  { name: 'TC94-53: extension policy has 4 rules', fn: () => {
    const content = fs.readFileSync(path.join(EXT_POLICIES_DIR, 'bkit-extension-policy.toml'), 'utf-8');
    const ruleCount = (content.match(/\[\[rule\]\]/g) || []).length;
    assertEqual(ruleCount, 4, 'should have 4 rules');
  }},

  // ═══════════════════════════════════════════════════════════════
  // SECTION 6: Starter Policy (5 tests)
  // ═══════════════════════════════════════════════════════════════

  { name: 'TC94-54: starter policy TOML exists', fn: () => {
    assertExists(path.join(POLICIES_DIR, 'bkit-starter-policy.toml'), 'starter policy file');
  }},
  { name: 'TC94-55: starter policy has modes rules', fn: () => {
    const content = fs.readFileSync(path.join(POLICIES_DIR, 'bkit-starter-policy.toml'), 'utf-8');
    assertContains(content, 'modes', 'starter policy should have modes rules');
  }},
  { name: 'TC94-56: starter policy has plan mode deny for write_file', fn: () => {
    const content = fs.readFileSync(path.join(POLICIES_DIR, 'bkit-starter-policy.toml'), 'utf-8');
    assertContains(content, 'modes = ["plan"]', 'should reference plan mode');
    assertContains(content, 'write_file', 'should reference write_file');
  }},
  { name: 'TC94-57: starter policy has allow for read_file', fn: () => {
    const content = fs.readFileSync(path.join(POLICIES_DIR, 'bkit-starter-policy.toml'), 'utf-8');
    assertContains(content, 'read_file', 'should reference read_file');
    assertContains(content, '"allow"', 'should have allow decision');
  }},
  { name: 'TC94-58: starter policy has ask_user default for write operations', fn: () => {
    const content = fs.readFileSync(path.join(POLICIES_DIR, 'bkit-starter-policy.toml'), 'utf-8');
    assertContains(content, '"ask_user"', 'should have ask_user decisions');
  }},

  // ═══════════════════════════════════════════════════════════════
  // SECTION 7: Permissions TOML (7 tests)
  // ═══════════════════════════════════════════════════════════════

  { name: 'TC94-59: permissions TOML exists', fn: () => {
    assertExists(path.join(POLICIES_DIR, 'bkit-permissions.toml'), 'permissions file');
  }},
  { name: 'TC94-60: permissions TOML has safe command allowlist', fn: () => {
    const content = fs.readFileSync(path.join(POLICIES_DIR, 'bkit-permissions.toml'), 'utf-8');
    assertContains(content, 'Safe Command Allowlist', 'should have safe command allowlist section');
  }},
  { name: 'TC94-61: permissions TOML allows git status', fn: () => {
    const content = fs.readFileSync(path.join(POLICIES_DIR, 'bkit-permissions.toml'), 'utf-8');
    assertContains(content, 'git status', 'should allow git status');
  }},
  { name: 'TC94-62: permissions TOML allows git log', fn: () => {
    const content = fs.readFileSync(path.join(POLICIES_DIR, 'bkit-permissions.toml'), 'utf-8');
    assertContains(content, 'git log', 'should allow git log');
  }},
  { name: 'TC94-63: permissions TOML default is ask_user', fn: () => {
    const content = fs.readFileSync(path.join(POLICIES_DIR, 'bkit-permissions.toml'), 'utf-8');
    // The default run_shell_command rule (low priority) should be ask_user
    const defaultRule = content.match(/toolName\s*=\s*"run_shell_command"\s*\n\s*decision\s*=\s*"ask_user"\s*\n\s*priority\s*=\s*5/);
    assert(defaultRule, 'default shell command should be ask_user with priority 5');
  }},
  { name: 'TC94-64: permissions TOML denies curl and wget', fn: () => {
    const content = fs.readFileSync(path.join(POLICIES_DIR, 'bkit-permissions.toml'), 'utf-8');
    assertContains(content, 'curl', 'should deny curl');
    assertContains(content, 'wget', 'should deny wget');
  }},
  { name: 'TC94-65: permissions TOML allows npm test and npm run', fn: () => {
    const content = fs.readFileSync(path.join(POLICIES_DIR, 'bkit-permissions.toml'), 'utf-8');
    assertContains(content, 'npm test', 'should allow npm test');
    assertContains(content, 'npm run', 'should allow npm run');
  }},

  // ═══════════════════════════════════════════════════════════════
  // SECTION 8: GEMINI.md Context Engineering (10 tests)
  // ═══════════════════════════════════════════════════════════════

  { name: 'TC94-66: GEMINI.md exists', fn: () => {
    assertExists(GEMINI_MD_PATH, 'GEMINI.md file');
  }},
  { name: 'TC94-67: GEMINI.md is under 30 lines', fn: () => {
    const lineCount = geminiMd.split('\n').length;
    assert(lineCount <= 30, `GEMINI.md should be under 30 lines, got ${lineCount}`);
  }},
  { name: 'TC94-68: GEMINI.md has exactly 2 @imports', fn: () => {
    const imports = geminiMd.match(/^@/gm) || [];
    assertEqual(imports.length, 2, `should have exactly 2 @imports, got ${imports.length}`);
  }},
  { name: 'TC94-69: GEMINI.md imports commands.md', fn: () => {
    assertContains(geminiMd, '@.gemini/context/commands.md', 'should import commands.md');
  }},
  { name: 'TC94-70: GEMINI.md imports core-rules.md', fn: () => {
    assertContains(geminiMd, '@.gemini/context/core-rules.md', 'should import core-rules.md');
  }},
  { name: 'TC94-71: GEMINI.md has no Claude Code references', fn: () => {
    const hasCCRef = /Claude\s*Code/i.test(geminiMd) || /\bCC_/.test(geminiMd);
    assertEqual(hasCCRef, false, 'GEMINI.md should not reference Claude Code');
  }},
  { name: 'TC94-72: GEMINI.md mentions Phase-Aware Context', fn: () => {
    assertContains(geminiMd, 'Phase-Aware', 'should mention Phase-Aware');
  }},
  { name: 'TC94-73: GEMINI.md mentions bkit v2.0.0', fn: () => {
    assertContains(geminiMd, 'v2.0.0', 'should mention v2.0.0');
  }},
  { name: 'TC94-74: GEMINI.md mentions PDCA order', fn: () => {
    assertContains(geminiMd, 'Plan', 'should mention Plan');
    assertContains(geminiMd, 'Design', 'should mention Design');
    assertContains(geminiMd, 'Check', 'should mention Check');
  }},
  { name: 'TC94-75: GEMINI.md does not import tool-reference directly', fn: () => {
    const hasToolRef = geminiMd.includes('@.gemini/context/tool-reference');
    assertEqual(hasToolRef, false, 'tool-reference should be loaded via phase-aware context, not GEMINI.md');
  }},

  // ═══════════════════════════════════════════════════════════════
  // SECTION 9: Context Files Existence (10 tests)
  // ═══════════════════════════════════════════════════════════════

  { name: 'TC94-76: core-rules.md exists', fn: () => {
    assertExists(path.join(CONTEXT_DIR, 'core-rules.md'), 'core-rules.md');
  }},
  { name: 'TC94-77: core-rules.md contains PDCA rules', fn: () => {
    const content = fs.readFileSync(path.join(CONTEXT_DIR, 'core-rules.md'), 'utf-8');
    assertContains(content, 'PDCA', 'should contain PDCA rules');
  }},
  { name: 'TC94-78: core-rules.md contains Feature Report section', fn: () => {
    const content = fs.readFileSync(path.join(CONTEXT_DIR, 'core-rules.md'), 'utf-8');
    assertContains(content, 'Feature', 'should contain Feature section');
    assertContains(content, 'Report', 'should contain Report section');
  }},
  { name: 'TC94-79: core-rules.md contains Executive Summary', fn: () => {
    const content = fs.readFileSync(path.join(CONTEXT_DIR, 'core-rules.md'), 'utf-8');
    assertContains(content, 'Executive Summary', 'should contain Executive Summary');
  }},
  { name: 'TC94-80: tool-reference-v2.md exists', fn: () => {
    assertExists(path.join(CONTEXT_DIR, 'tool-reference-v2.md'), 'tool-reference-v2.md');
  }},
  { name: 'TC94-81: tool-reference-v2.md lists 23 tools', fn: () => {
    const content = fs.readFileSync(path.join(CONTEXT_DIR, 'tool-reference-v2.md'), 'utf-8');
    // Count table rows with backtick-wrapped tool names (excluding header and separator)
    const toolRows = content.match(/\|\s*`\w+`\s*\|/g) || [];
    assertEqual(toolRows.length, 23, `should list 23 tools, got ${toolRows.length}`);
  }},
  { name: 'TC94-82: tool-reference-v2.md has no CC mappings', fn: () => {
    const content = fs.readFileSync(path.join(CONTEXT_DIR, 'tool-reference-v2.md'), 'utf-8');
    const hasCCMap = /Claude\s*Code/i.test(content) || /\bCC\b/.test(content) || /claude_/.test(content);
    assertEqual(hasCCMap, false, 'tool-reference-v2.md should have no Claude Code mappings');
  }},
  { name: 'TC94-83: All 6 original context files exist for phase-aware loading', fn: () => {
    const expectedFiles = [
      'commands.md', 'core-rules.md', 'pdca-rules.md',
      'agent-triggers.md', 'skill-triggers.md', 'feature-report.md'
    ];
    for (const f of expectedFiles) {
      assertExists(path.join(CONTEXT_DIR, f), `context file ${f}`);
    }
  }},
  { name: 'TC94-84: executive-summary-rules.md exists', fn: () => {
    assertExists(path.join(CONTEXT_DIR, 'executive-summary-rules.md'), 'executive-summary-rules.md');
  }},
  { name: 'TC94-85: feature-report.md has conditional output section', fn: () => {
    const content = fs.readFileSync(path.join(CONTEXT_DIR, 'feature-report.md'), 'utf-8');
    assertContains(content, 'Level', 'should have level-based conditions');
    assertContains(content, 'Starter', 'should mention Starter');
    assertContains(content, 'Enterprise', 'should mention Enterprise');
  }},

  // ═══════════════════════════════════════════════════════════════
  // SECTION 10: PHASE_CONTEXT_MAP in session-start.js (14 tests)
  // ═══════════════════════════════════════════════════════════════

  { name: 'TC94-86: PHASE_CONTEXT_MAP exists in session-start.js', fn: () => {
    assertContains(sessionStartSrc, 'PHASE_CONTEXT_MAP', 'should define PHASE_CONTEXT_MAP');
  }},
  { name: 'TC94-87: plan phase loads 4 files', fn: () => {
    const planMatch = sessionStartSrc.match(/plan:\s*\[(.*?)\]/s);
    assert(planMatch, 'plan phase should exist in PHASE_CONTEXT_MAP');
    const files = planMatch[1].match(/'[^']+'/g) || [];
    assertEqual(files.length, 4, `plan should load 4 files, got ${files.length}`);
  }},
  { name: 'TC94-88: plan phase includes commands.md', fn: () => {
    const planMatch = sessionStartSrc.match(/plan:\s*\[(.*?)\]/s);
    assert(planMatch[1].includes('commands.md'), 'plan should include commands.md');
  }},
  { name: 'TC94-89: plan phase includes pdca-rules.md', fn: () => {
    const planMatch = sessionStartSrc.match(/plan:\s*\[(.*?)\]/s);
    assert(planMatch[1].includes('pdca-rules.md'), 'plan should include pdca-rules.md');
  }},
  { name: 'TC94-90: design phase loads 3 files', fn: () => {
    const match = sessionStartSrc.match(/design:\s*\[(.*?)\]/s);
    assert(match, 'design phase should exist');
    const files = match[1].match(/'[^']+'/g) || [];
    assertEqual(files.length, 3, `design should load 3 files, got ${files.length}`);
  }},
  { name: 'TC94-91: do phase loads 3 files', fn: () => {
    const match = sessionStartSrc.match(/do:\s*\[(.*?)\]/s);
    assert(match, 'do phase should exist');
    const files = match[1].match(/'[^']+'/g) || [];
    assertEqual(files.length, 3, `do should load 3 files, got ${files.length}`);
  }},
  { name: 'TC94-92: check phase loads 2 files', fn: () => {
    const match = sessionStartSrc.match(/check:\s*\[(.*?)\]/s);
    assert(match, 'check phase should exist');
    const files = match[1].match(/'[^']+'/g) || [];
    assertEqual(files.length, 2, `check should load 2 files, got ${files.length}`);
  }},
  { name: 'TC94-93: act phase loads 2 files', fn: () => {
    const match = sessionStartSrc.match(/act:\s*\[(.*?)\]/s);
    assert(match, 'act phase should exist');
    const files = match[1].match(/'[^']+'/g) || [];
    assertEqual(files.length, 2, `act should load 2 files, got ${files.length}`);
  }},
  { name: 'TC94-94: idle phase loads 5 files', fn: () => {
    const match = sessionStartSrc.match(/idle:\s*\[(.*?)\]/s);
    assert(match, 'idle phase should exist');
    const files = match[1].match(/'[^']+'/g) || [];
    assertEqual(files.length, 5, `idle should load 5 files, got ${files.length}`);
  }},
  { name: 'TC94-95: idle phase includes agent-triggers.md', fn: () => {
    const match = sessionStartSrc.match(/idle:\s*\[(.*?)\]/s);
    assert(match[1].includes('agent-triggers.md'), 'idle should include agent-triggers.md');
  }},
  { name: 'TC94-96: idle phase includes skill-triggers.md', fn: () => {
    const match = sessionStartSrc.match(/idle:\s*\[(.*?)\]/s);
    assert(match[1].includes('skill-triggers.md'), 'idle should include skill-triggers.md');
  }},
  { name: 'TC94-97: do phase includes tool-reference-v2.md', fn: () => {
    const match = sessionStartSrc.match(/do:\s*\[(.*?)\]/s);
    assert(match[1].includes('tool-reference-v2.md'), 'do should include tool-reference-v2.md');
  }},
  { name: 'TC94-98: loadPhaseAwareContext function exists in session-start.js', fn: () => {
    assertContains(sessionStartSrc, 'function loadPhaseAwareContext', 'should define loadPhaseAwareContext');
  }},
  { name: 'TC94-99: loadPhaseAwareContext defaults to idle for unknown phase', fn: () => {
    assertContains(sessionStartSrc, "? phase : 'idle'", 'should default to idle for unknown phase');
  }},

  // ═══════════════════════════════════════════════════════════════
  // SECTION 11: MODEL_ROUTING in before-model.js (10 tests)
  // ═══════════════════════════════════════════════════════════════

  { name: 'TC94-100: MODEL_ROUTING exists in before-model.js', fn: () => {
    assertContains(beforeModelSrc, 'MODEL_ROUTING', 'should define MODEL_ROUTING');
  }},
  { name: 'TC94-101: MODEL_ROUTING is frozen', fn: () => {
    assertContains(beforeModelSrc, 'Object.freeze', 'MODEL_ROUTING should be frozen');
  }},
  { name: 'TC94-102: plan phase routes to pro', fn: () => {
    const match = beforeModelSrc.match(/plan:\s*\{[^}]*preferredModel:\s*'(\w+)'/);
    assert(match, 'plan routing should exist');
    assertEqual(match[1], 'pro', 'plan should route to pro');
  }},
  { name: 'TC94-103: design phase routes to pro', fn: () => {
    const match = beforeModelSrc.match(/design:\s*\{[^}]*preferredModel:\s*'(\w+)'/);
    assert(match, 'design routing should exist');
    assertEqual(match[1], 'pro', 'design should route to pro');
  }},
  { name: 'TC94-104: do phase routes to pro', fn: () => {
    const match = beforeModelSrc.match(/do:\s*\{[^}]*preferredModel:\s*'(\w+)'/);
    assert(match, 'do routing should exist');
    assertEqual(match[1], 'pro', 'do should route to pro');
  }},
  { name: 'TC94-105: check phase routes to flash', fn: () => {
    const match = beforeModelSrc.match(/check:\s*\{[^}]*preferredModel:\s*'(\w+)'/);
    assert(match, 'check routing should exist');
    assertEqual(match[1], 'flash', 'check should route to flash');
  }},
  { name: 'TC94-106: act phase routes to flash', fn: () => {
    const match = beforeModelSrc.match(/act:\s*\{[^}]*preferredModel:\s*'(\w+)'/);
    assert(match, 'act routing should exist');
    assertEqual(match[1], 'flash', 'act should route to flash');
  }},
  { name: 'TC94-107: report phase routes to flash', fn: () => {
    const match = beforeModelSrc.match(/report:\s*\{[^}]*preferredModel:\s*'(\w+)'/);
    assert(match, 'report routing should exist');
    assertEqual(match[1], 'flash', 'report should route to flash');
  }},
  { name: 'TC94-108: MODEL_ROUTING has 6 phases', fn: () => {
    const phases = beforeModelSrc.match(/(\w+):\s*\{\s*preferredModel:/g) || [];
    assertEqual(phases.length, 6, `should have 6 phase entries, got ${phases.length}`);
  }},
  { name: 'TC94-109: getModelRoutingHint function exists in before-model.js', fn: () => {
    assertContains(beforeModelSrc, 'function getModelRoutingHint', 'should define getModelRoutingHint');
  }},

  // ═══════════════════════════════════════════════════════════════
  // SECTION 12: extractDocumentAnchors in before-model.js (5 tests)
  // ═══════════════════════════════════════════════════════════════

  { name: 'TC94-110: extractDocumentAnchors function exists in before-model.js', fn: () => {
    assertContains(beforeModelSrc, 'function extractDocumentAnchors', 'should define extractDocumentAnchors');
  }},
  { name: 'TC94-111: extractDocumentAnchors has MAX_ANCHOR_CHARS limit', fn: () => {
    assertContains(beforeModelSrc, 'MAX_ANCHOR_CHARS', 'should define MAX_ANCHOR_CHARS');
  }},
  { name: 'TC94-112: extractDocumentAnchors reads .pdca-status.json', fn: () => {
    assertContains(beforeModelSrc, '.pdca-status.json', 'should reference pdca-status.json');
  }},
  { name: 'TC94-113: extractDocumentAnchors maps phase to anchor docs', fn: () => {
    assertContains(beforeModelSrc, 'PHASE_ANCHOR_DOCS', 'should define PHASE_ANCHOR_DOCS');
  }},
  { name: 'TC94-114: extractDocumentAnchors extracts Executive Summary section', fn: () => {
    assertContains(beforeModelSrc, 'Executive Summary', 'should extract Executive Summary');
  }},

  // ═══════════════════════════════════════════════════════════════
  // SECTION 13: Skill Visibility + Transparent PDCA (6 tests)
  // ═══════════════════════════════════════════════════════════════

  { name: 'TC94-115: LEVEL_SKILL_WHITELIST exists in session-start.js', fn: () => {
    assertContains(sessionStartSrc, 'LEVEL_SKILL_WHITELIST', 'should define LEVEL_SKILL_WHITELIST');
  }},
  { name: 'TC94-116: LEVEL_SKILL_WHITELIST has Starter, Dynamic, Enterprise keys', fn: () => {
    assertContains(sessionStartSrc, "Starter:", 'should have Starter key');
    assertContains(sessionStartSrc, "Dynamic:", 'should have Dynamic key');
    assertContains(sessionStartSrc, "Enterprise:", 'should have Enterprise key');
  }},
  { name: 'TC94-117: Enterprise level has null whitelist (all skills)', fn: () => {
    assertContains(sessionStartSrc, 'Enterprise: null', 'Enterprise should have null whitelist');
  }},
  { name: 'TC94-118: buildCoreRules function exists in session-start.js', fn: () => {
    assertContains(sessionStartSrc, 'function buildCoreRules', 'should define buildCoreRules');
  }},
  { name: 'TC94-119: buildCoreRules includes PDCA Core Rules', fn: () => {
    assertContains(sessionStartSrc, 'PDCA Core Rules', 'should contain PDCA Core Rules');
  }},
  { name: 'TC94-120: buildCoreRules is called in generateDynamicContext (transparent injection)', fn: () => {
    assertContains(sessionStartSrc, 'sections.push(buildCoreRules())', 'buildCoreRules should be pushed into dynamic context sections');
  }},
];

module.exports = { tests };
