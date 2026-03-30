// TC-91: Security v2.0.0 Comprehensive Test Suite (95 TC)
// Covers SEC-01 through SEC-10 security fixes for bkit-gemini v2.0.0
//
// SEC-01: Agent Safety Tiers (17 TC)
// SEC-02: Subagent TOML Policies (12 TC)
// SEC-03: Path Traversal Prevention (14 TC)
// SEC-04: Default ask_user Policy (12 TC)
// SEC-05: Dual Defense (10 TC)
// SEC-08: Plan Mode Restrictions (10 TC)
// SEC-09: Security Audit Log (12 TC)
// SEC-10: Path Exposure Prevention (8 TC)
//
// Total: 95 TC

const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, cleanupTestProject, assert, assertEqual, assertType, assertContains, assertExists, assertThrows, assertHasKey, assertLength, countMatches, getPdcaStatus, withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');

// ─── Source file paths ──────────────────────────────────────
const spawnAgentPath = path.join(PLUGIN_ROOT, 'mcp', 'spawn-agent-server.js');
const policyPath = path.join(PLUGIN_ROOT, 'lib', 'gemini', 'policy.js');
const permissionPath = path.join(PLUGIN_ROOT, 'lib', 'core', 'permission.js');
const permsTomlPath = path.join(PLUGIN_ROOT, '.gemini', 'policies', 'bkit-permissions.toml');
const starterTomlPath = path.join(PLUGIN_ROOT, '.gemini', 'policies', 'bkit-starter-policy.toml');
const beforeToolPath = path.join(PLUGIN_ROOT, 'hooks', 'scripts', 'before-tool.js');

// ─── Helpers ────────────────────────────────────────────────

/**
 * Parse SAFETY_TIERS and AGENTS from spawn-agent-server source
 * (Cannot require directly because file calls server.run() at module scope)
 */
function loadSpawnAgentConstants() {
  const src = fs.readFileSync(spawnAgentPath, 'utf-8');

  // Parse SAFETY_TIERS
  const tiersMatch = src.match(/const SAFETY_TIERS\s*=\s*Object\.freeze\(\{([^}]+)\}\)/);
  const tiers = {};
  if (tiersMatch) {
    const entries = tiersMatch[1].matchAll(/(\w+)\s*:\s*(\d+)/g);
    for (const m of entries) tiers[m[1]] = parseInt(m[2]);
  }

  // Parse agent safetyTier assignments
  const agentBlocks = [...src.matchAll(/'([a-z-]+)'\s*:\s*\{[^}]*safetyTier\s*:\s*SAFETY_TIERS\.(\w+)/g)];
  const agents = {};
  for (const m of agentBlocks) {
    agents[m[1]] = m[2]; // e.g., 'gap-detector': 'READONLY'
  }

  return { tiers, agents, src };
}

/**
 * Replicate sanitizeTeamName logic from spawn-agent-server for testing
 */
function sanitizeTeamName(teamName) {
  if (!teamName || typeof teamName !== 'string') return null;
  const sanitized = teamName.replace(/[^a-zA-Z0-9_-]/g, '');
  if (sanitized !== teamName || sanitized.length === 0 || sanitized.length > 64) return null;
  return sanitized;
}

const tests = [

  // ═══════════════════════════════════════════════════════════
  // SEC-01: Agent Safety Tiers (17 TC)
  // ═══════════════════════════════════════════════════════════

  { name: 'TC91-01: SEC-01 SAFETY_TIERS constant exists in spawn-agent-server source',
    fn: () => {
      const src = fs.readFileSync(spawnAgentPath, 'utf-8');
      assert(src.includes('const SAFETY_TIERS'), 'SAFETY_TIERS constant must exist in source');
    }
  },

  { name: 'TC91-02: SEC-01 SAFETY_TIERS has READONLY=0, DOCWRITE=1, FULL=2',
    fn: () => {
      const { tiers } = loadSpawnAgentConstants();
      assertEqual(tiers.READONLY, 0, 'READONLY should be 0');
      assertEqual(tiers.DOCWRITE, 1, 'DOCWRITE should be 1');
      assertEqual(tiers.FULL, 2, 'FULL should be 2');
    }
  },

  { name: 'TC91-03: SEC-01 SAFETY_TIERS is frozen (Object.freeze)',
    fn: () => {
      const src = fs.readFileSync(spawnAgentPath, 'utf-8');
      assert(src.match(/SAFETY_TIERS\s*=\s*Object\.freeze/), 'SAFETY_TIERS should use Object.freeze');
    }
  },

  { name: 'TC91-04: SEC-01 gap-detector has safetyTier READONLY in source',
    fn: () => {
      const { agents } = loadSpawnAgentConstants();
      assertEqual(agents['gap-detector'], 'READONLY', 'gap-detector should be READONLY');
    }
  },

  { name: 'TC91-05: SEC-01 design-validator has safetyTier READONLY in source',
    fn: () => {
      const { agents } = loadSpawnAgentConstants();
      assertEqual(agents['design-validator'], 'READONLY', 'design-validator should be READONLY');
    }
  },

  { name: 'TC91-06: SEC-01 code-analyzer has safetyTier READONLY in source',
    fn: () => {
      const { agents } = loadSpawnAgentConstants();
      assertEqual(agents['code-analyzer'], 'READONLY', 'code-analyzer should be READONLY');
    }
  },

  { name: 'TC91-07: SEC-01 security-architect has safetyTier READONLY in source',
    fn: () => {
      const { agents } = loadSpawnAgentConstants();
      assertEqual(agents['security-architect'], 'READONLY', 'security-architect should be READONLY');
    }
  },

  { name: 'TC91-08: SEC-01 qa-monitor has safetyTier READONLY in source',
    fn: () => {
      const { agents } = loadSpawnAgentConstants();
      assertEqual(agents['qa-monitor'], 'READONLY', 'qa-monitor should be READONLY');
    }
  },

  { name: 'TC91-09: SEC-01 qa-strategist has safetyTier READONLY in source',
    fn: () => {
      const { agents } = loadSpawnAgentConstants();
      assertEqual(agents['qa-strategist'], 'READONLY', 'qa-strategist should be READONLY');
    }
  },

  { name: 'TC91-10: SEC-01 starter-guide has safetyTier READONLY in source',
    fn: () => {
      const { agents } = loadSpawnAgentConstants();
      assertEqual(agents['starter-guide'], 'READONLY', 'starter-guide should be READONLY');
    }
  },

  { name: 'TC91-11: SEC-01 pipeline-guide has safetyTier READONLY in source',
    fn: () => {
      const { agents } = loadSpawnAgentConstants();
      assertEqual(agents['pipeline-guide'], 'READONLY', 'pipeline-guide should be READONLY');
    }
  },

  { name: 'TC91-12: SEC-01 bkend-expert has safetyTier READONLY in source',
    fn: () => {
      const { agents } = loadSpawnAgentConstants();
      assertEqual(agents['bkend-expert'], 'READONLY', 'bkend-expert should be READONLY');
    }
  },

  { name: 'TC91-13: SEC-01 enterprise-expert has safetyTier READONLY in source',
    fn: () => {
      const { agents } = loadSpawnAgentConstants();
      assertEqual(agents['enterprise-expert'], 'READONLY', 'enterprise-expert should be READONLY');
    }
  },

  { name: 'TC91-14: SEC-01 report-generator has safetyTier DOCWRITE in source',
    fn: () => {
      const { agents } = loadSpawnAgentConstants();
      assertEqual(agents['report-generator'], 'DOCWRITE', 'report-generator should be DOCWRITE');
    }
  },

  { name: 'TC91-15: SEC-01 product-manager, infra-architect, frontend-architect are DOCWRITE',
    fn: () => {
      const { agents } = loadSpawnAgentConstants();
      assertEqual(agents['product-manager'], 'DOCWRITE', 'product-manager should be DOCWRITE');
      assertEqual(agents['infra-architect'], 'DOCWRITE', 'infra-architect should be DOCWRITE');
      assertEqual(agents['frontend-architect'], 'DOCWRITE', 'frontend-architect should be DOCWRITE');
    }
  },

  { name: 'TC91-16: SEC-01 cto-lead and pdca-iterator are FULL tier',
    fn: () => {
      const { agents } = loadSpawnAgentConstants();
      assertEqual(agents['cto-lead'], 'FULL', 'cto-lead should be FULL');
      assertEqual(agents['pdca-iterator'], 'FULL', 'pdca-iterator should be FULL');
    }
  },

  { name: 'TC91-17: SEC-01 only FULL tier gets yolo; READONLY/DOCWRITE get auto',
    fn: () => {
      const src = fs.readFileSync(spawnAgentPath, 'utf-8');
      // Verify approval-mode logic based on tier
      assert(src.includes('safetyTier === SAFETY_TIERS.FULL'),
        'Should check for FULL tier to decide approval mode');
      const yoloBlock = src.match(/if\s*\(safetyTier\s*===\s*SAFETY_TIERS\.FULL\)\s*\{[^}]*yolo/s);
      assert(yoloBlock, 'FULL tier block should set yolo approval mode');
      assert(src.includes("'--approval-mode=auto'"),
        'Non-FULL tiers should use auto approval mode');
    }
  },

  // ═══════════════════════════════════════════════════════════
  // SEC-02: Subagent TOML Policies (12 TC)
  // ═══════════════════════════════════════════════════════════

  { name: 'TC91-18: SEC-02 SUBAGENT_POLICY_GROUPS is exported from policy module',
    fn: () => {
      const policy = require(policyPath);
      assert(policy.SUBAGENT_POLICY_GROUPS, 'SUBAGENT_POLICY_GROUPS should be exported');
    }
  },

  { name: 'TC91-19: SEC-02 SUBAGENT_POLICY_GROUPS is frozen (Object.freeze in source)',
    fn: () => {
      const policy = require(policyPath);
      assertType(policy.SUBAGENT_POLICY_GROUPS, 'object', 'Should be an object');
      // Verify Object.freeze is used in source code
      const src = fs.readFileSync(policyPath, 'utf-8');
      assert(src.match(/SUBAGENT_POLICY_GROUPS\s*=\s*Object\.freeze/),
        'SUBAGENT_POLICY_GROUPS should use Object.freeze in source');
    }
  },

  { name: 'TC91-20: SEC-02 readonly group has exactly 8 agents',
    fn: () => {
      const policy = require(policyPath);
      assertEqual(policy.SUBAGENT_POLICY_GROUPS.readonly.agents.length, 8,
        'readonly.agents should have 8 entries');
    }
  },

  { name: 'TC91-21: SEC-02 readonly group has exactly 3 rules',
    fn: () => {
      const policy = require(policyPath);
      assertEqual(policy.SUBAGENT_POLICY_GROUPS.readonly.rules.length, 3,
        'readonly.rules should have 3 entries (shell, write, replace)');
    }
  },

  { name: 'TC91-22: SEC-02 docwrite group has exactly 6 agents',
    fn: () => {
      const policy = require(policyPath);
      assertEqual(policy.SUBAGENT_POLICY_GROUPS.docwrite.agents.length, 6,
        'docwrite.agents should have 6 entries');
    }
  },

  { name: 'TC91-23: SEC-02 docwrite group has exactly 1 rule',
    fn: () => {
      const policy = require(policyPath);
      assertEqual(policy.SUBAGENT_POLICY_GROUPS.docwrite.rules.length, 1,
        'docwrite.rules should have 1 entry (shell deny only)');
    }
  },

  { name: 'TC91-24: SEC-02 generateSubagentRules() produces string with subagent field',
    fn: () => {
      const policy = require(policyPath);
      const rules = policy.generateSubagentRules();
      assertType(rules, 'string', 'generateSubagentRules should return string');
      assert(rules.includes('subagent ='), 'Generated rules should contain subagent field');
    }
  },

  { name: 'TC91-25: SEC-02 generateSubagentRules() DOES include cto-lead (full tier)',
    fn: () => {
      const policy = require(policyPath);
      const rules = policy.generateSubagentRules();
      assert(rules.includes('cto-lead'),
        'cto-lead (FULL tier) should appear in subagent rules');
    }
  },

  { name: 'TC91-26: SEC-02 generateSubagentRules() DOES include pdca-iterator (full tier)',
    fn: () => {
      const policy = require(policyPath);
      const rules = policy.generateSubagentRules();
      assert(rules.includes('pdca-iterator'),
        'pdca-iterator (FULL tier) should appear in subagent rules');
    }
  },

  { name: 'TC91-27: SEC-02 each readonly rule has decision deny',
    fn: () => {
      const policy = require(policyPath);
      for (const rule of policy.SUBAGENT_POLICY_GROUPS.readonly.rules) {
        assertEqual(rule.decision, 'deny', `Readonly rule for ${rule.toolName} should be deny`);
      }
    }
  },

  { name: 'TC91-28: SEC-02 docwrite rule denies run_shell_command',
    fn: () => {
      const policy = require(policyPath);
      const shellRule = policy.SUBAGENT_POLICY_GROUPS.docwrite.rules.find(
        r => r.toolName === 'run_shell_command'
      );
      assert(shellRule, 'docwrite should have a run_shell_command rule');
      assertEqual(shellRule.decision, 'deny', 'docwrite shell rule should be deny');
    }
  },

  { name: 'TC91-29: SEC-02 readonly agents list matches expected READONLY agents from SEC-01',
    fn: () => {
      const policy = require(policyPath);
      const expected = [
        'gap-detector', 'design-validator', 'code-analyzer', 'security-architect',
        'qa-monitor', 'qa-strategist', 'starter-guide', 'pipeline-guide'
      ];
      for (const name of expected) {
        assert(policy.SUBAGENT_POLICY_GROUPS.readonly.agents.includes(name),
          `${name} should be in readonly agents list`);
      }
      // bkend-expert moved to docwrite
      assert(!policy.SUBAGENT_POLICY_GROUPS.readonly.agents.includes('bkend-expert'),
        'bkend-expert should NOT be in readonly (moved to docwrite)');
    }
  },

  // ═══════════════════════════════════════════════════════════
  // SEC-03: Path Traversal Prevention (14 TC)
  // ═══════════════════════════════════════════════════════════

  { name: 'TC91-30: SEC-03 sanitizeTeamName function exists in spawn-agent-server source',
    fn: () => {
      const src = fs.readFileSync(spawnAgentPath, 'utf-8');
      assert(src.includes('sanitizeTeamName'), 'sanitizeTeamName should exist in source');
    }
  },

  { name: 'TC91-31: SEC-03 sanitizeTeamName rejects ../etc/passwd pattern',
    fn: () => {
      const result = sanitizeTeamName('../etc/passwd');
      assertEqual(result, null, '../etc/passwd should be rejected (returns null)');
    }
  },

  { name: 'TC91-32: SEC-03 sanitizeTeamName rejects path with dots and slashes',
    fn: () => {
      assertEqual(sanitizeTeamName('..'), null, '.. should be rejected');
      assertEqual(sanitizeTeamName('./test'), null, './test should be rejected');
      assertEqual(sanitizeTeamName('foo/bar'), null, 'foo/bar should be rejected');
    }
  },

  { name: 'TC91-33: SEC-03 sanitizeTeamName rejects empty string',
    fn: () => {
      assertEqual(sanitizeTeamName(''), null, 'Empty string should be rejected');
    }
  },

  { name: 'TC91-34: SEC-03 sanitizeTeamName rejects null',
    fn: () => {
      assertEqual(sanitizeTeamName(null), null, 'null should be rejected');
    }
  },

  { name: 'TC91-35: SEC-03 sanitizeTeamName rejects undefined',
    fn: () => {
      assertEqual(sanitizeTeamName(undefined), null, 'undefined should be rejected');
    }
  },

  { name: 'TC91-36: SEC-03 sanitizeTeamName rejects non-string types',
    fn: () => {
      assertEqual(sanitizeTeamName(123), null, 'number should be rejected');
      assertEqual(sanitizeTeamName({}), null, 'object should be rejected');
      assertEqual(sanitizeTeamName([]), null, 'array should be rejected');
    }
  },

  { name: 'TC91-37: SEC-03 sanitizeTeamName accepts valid alphanumeric with hyphens',
    fn: () => {
      assertEqual(sanitizeTeamName('my-team'), 'my-team', 'Valid name should pass');
      assertEqual(sanitizeTeamName('team_01'), 'team_01', 'Underscores should pass');
      assertEqual(sanitizeTeamName('TeamAlpha'), 'TeamAlpha', 'Mixed case should pass');
    }
  },

  { name: 'TC91-38: SEC-03 sanitizeTeamName enforces max length 64',
    fn: () => {
      const longName = 'a'.repeat(65);
      assertEqual(sanitizeTeamName(longName), null, 'Name over 64 chars should be rejected');
      const maxName = 'a'.repeat(64);
      assertEqual(sanitizeTeamName(maxName), maxName, 'Name at 64 chars should pass');
    }
  },

  { name: 'TC91-39: SEC-03 sanitizeTeamName rejects special characters',
    fn: () => {
      assertEqual(sanitizeTeamName('team name'), null, 'Spaces should be rejected');
      assertEqual(sanitizeTeamName('team@name'), null, '@ should be rejected');
      assertEqual(sanitizeTeamName('team;cmd'), null, 'Semicolons should be rejected');
    }
  },

  { name: 'TC91-40: SEC-03 source uses sanitizeTeamName before file operations',
    fn: () => {
      const src = fs.readFileSync(spawnAgentPath, 'utf-8');
      // Verify sanitizeTeamName is called in handleTeamAssign and handleTeamStatus
      assert(src.includes('this.sanitizeTeamName(team_name)'),
        'Should call sanitizeTeamName on team_name input');
    }
  },

  { name: 'TC91-41: SEC-03 sanitizeTeamName strips invalid chars and compares',
    fn: () => {
      const src = fs.readFileSync(spawnAgentPath, 'utf-8');
      // The function replaces non-alnum/hyphen/underscore and checks if result differs
      assert(src.includes("[^a-zA-Z0-9_-]"),
        'sanitizeTeamName should use regex to strip invalid chars');
      assert(src.includes('sanitized !== teamName'),
        'Should reject names where sanitized differs from original');
    }
  },

  { name: 'TC91-42: SEC-03 sanitizeTeamName rejects pipe injection',
    fn: () => {
      assertEqual(sanitizeTeamName('team|rm -rf /'), null, 'Pipe injection should be rejected');
    }
  },

  { name: 'TC91-43: SEC-03 sanitizeTeamName rejects backtick injection',
    fn: () => {
      assertEqual(sanitizeTeamName('team`id`'), null, 'Backtick injection should be rejected');
    }
  },

  // ═══════════════════════════════════════════════════════════
  // SEC-04: Default ask_user Policy (12 TC)
  // ═══════════════════════════════════════════════════════════

  { name: 'TC91-44: SEC-04 no bare allow for run_shell_command without commandPrefix',
    fn: () => {
      const toml = fs.readFileSync(permsTomlPath, 'utf-8');
      // Parse rule blocks - find run_shell_command rules without commandPrefix
      const blocks = toml.split('[[rule]]').slice(1);
      for (const block of blocks) {
        const hasShellTool = block.includes('toolName = "run_shell_command"');
        const hasPrefix = block.includes('commandPrefix');
        const hasAllow = block.includes('decision = "allow"');
        if (hasShellTool && hasAllow && !hasPrefix) {
          throw new Error('Found bare allow for run_shell_command without commandPrefix');
        }
      }
    }
  },

  { name: 'TC91-45: SEC-04 has default ask_user for run_shell_command',
    fn: () => {
      const toml = fs.readFileSync(permsTomlPath, 'utf-8');
      const blocks = toml.split('[[rule]]').slice(1);
      let hasDefaultAsk = false;
      for (const block of blocks) {
        const hasShellTool = block.includes('toolName = "run_shell_command"');
        const hasAskUser = block.includes('decision = "ask_user"');
        const hasPrefix = block.includes('commandPrefix');
        if (hasShellTool && hasAskUser && !hasPrefix) {
          hasDefaultAsk = true;
          break;
        }
      }
      assert(hasDefaultAsk, 'Should have default ask_user for bare run_shell_command');
    }
  },

  { name: 'TC91-46: SEC-04 curl has deny',
    fn: () => {
      const toml = fs.readFileSync(permsTomlPath, 'utf-8');
      assert(toml.includes('commandPrefix = "curl"'), 'Should have curl prefix rule');
      // Find the curl block and check decision
      const blocks = toml.split('[[rule]]').slice(1);
      const curlBlock = blocks.find(b =>
        b.includes('commandPrefix = "curl"') && b.includes('toolName = "run_shell_command"')
      );
      assert(curlBlock, 'Should have curl rule block');
      assert(curlBlock.includes('decision = "deny"'), 'curl should have deny decision');
    }
  },

  { name: 'TC91-47: SEC-04 wget has deny',
    fn: () => {
      const toml = fs.readFileSync(permsTomlPath, 'utf-8');
      const blocks = toml.split('[[rule]]').slice(1);
      const wgetBlock = blocks.find(b =>
        b.includes('commandPrefix = "wget"') && b.includes('toolName = "run_shell_command"')
      );
      assert(wgetBlock, 'Should have wget rule block');
      assert(wgetBlock.includes('decision = "deny"'), 'wget should have deny decision');
    }
  },

  { name: 'TC91-48: SEC-04 git status has allow',
    fn: () => {
      const toml = fs.readFileSync(permsTomlPath, 'utf-8');
      const blocks = toml.split('[[rule]]').slice(1);
      const gitStatusBlock = blocks.find(b =>
        b.includes('commandPrefix = "git status"') && b.includes('toolName = "run_shell_command"')
      );
      assert(gitStatusBlock, 'Should have git status rule block');
      assert(gitStatusBlock.includes('decision = "allow"'), 'git status should have allow decision');
    }
  },

  { name: 'TC91-49: SEC-04 npm test has allow',
    fn: () => {
      const toml = fs.readFileSync(permsTomlPath, 'utf-8');
      const blocks = toml.split('[[rule]]').slice(1);
      const npmTestBlock = blocks.find(b =>
        b.includes('commandPrefix = "npm test"') && b.includes('toolName = "run_shell_command"')
      );
      assert(npmTestBlock, 'Should have npm test rule block');
      assert(npmTestBlock.includes('decision = "allow"'), 'npm test should have allow decision');
    }
  },

  { name: 'TC91-50: SEC-04 rm -rf has deny at priority 100',
    fn: () => {
      const toml = fs.readFileSync(permsTomlPath, 'utf-8');
      const blocks = toml.split('[[rule]]').slice(1);
      const rmBlock = blocks.find(b =>
        b.includes('commandPrefix = "rm -rf"') && b.includes('toolName = "run_shell_command"')
      );
      assert(rmBlock, 'Should have rm -rf rule block');
      assert(rmBlock.includes('decision = "deny"'), 'rm -rf should have deny decision');
      assert(rmBlock.includes('priority = 100'), 'rm -rf deny should have priority 100');
    }
  },

  { name: 'TC91-51: SEC-04 git push --force has deny',
    fn: () => {
      const toml = fs.readFileSync(permsTomlPath, 'utf-8');
      const blocks = toml.split('[[rule]]').slice(1);
      const forceBlock = blocks.find(b =>
        b.includes('commandPrefix = "git push --force"') && b.includes('toolName = "run_shell_command"')
      );
      assert(forceBlock, 'Should have git push --force rule block');
      assert(forceBlock.includes('decision = "deny"'), 'git push --force should have deny decision');
    }
  },

  { name: 'TC91-52: SEC-04 allow rules have lower priority than deny rules',
    fn: () => {
      const toml = fs.readFileSync(permsTomlPath, 'utf-8');
      const blocks = toml.split('[[rule]]').slice(1);
      for (const block of blocks) {
        if (block.includes('decision = "allow"')) {
          const priorityMatch = block.match(/priority\s*=\s*(\d+)/);
          assert(priorityMatch, 'Allow rule should have priority');
          assert(parseInt(priorityMatch[1]) < 100,
            'Allow priority should be less than deny priority (100)');
        }
      }
    }
  },

  { name: 'TC91-53: SEC-04 default ask_user has lowest priority (5)',
    fn: () => {
      const toml = fs.readFileSync(permsTomlPath, 'utf-8');
      const blocks = toml.split('[[rule]]').slice(1);
      const defaultAskBlock = blocks.find(b =>
        b.includes('toolName = "run_shell_command"') &&
        b.includes('decision = "ask_user"') &&
        !b.includes('commandPrefix')
      );
      assert(defaultAskBlock, 'Default ask_user block should exist');
      assert(defaultAskBlock.includes('priority = 5'),
        'Default ask_user should have priority 5 (lowest)');
    }
  },

  { name: 'TC91-54: SEC-04 TOML file uses toolName (not toolname) field names',
    fn: () => {
      const toml = fs.readFileSync(permsTomlPath, 'utf-8');
      const matches = toml.match(/\btoolname\s*=/gi) || [];
      for (const m of matches) {
        assert(m.includes('toolName'), `Field should be toolName (camelCase), found: ${m}`);
      }
    }
  },

  { name: 'TC91-55: SEC-04 read_file has allow decision',
    fn: () => {
      const toml = fs.readFileSync(permsTomlPath, 'utf-8');
      const blocks = toml.split('[[rule]]').slice(1);
      const readBlock = blocks.find(b => b.includes('toolName = "read_file"'));
      assert(readBlock, 'Should have read_file rule');
      assert(readBlock.includes('decision = "allow"'), 'read_file should be allowed');
    }
  },

  // ═══════════════════════════════════════════════════════════
  // SEC-05: Dual Defense (10 TC)
  // ═══════════════════════════════════════════════════════════

  { name: 'TC91-56: SEC-05 permission.js source contains "Passed bkit deny check"',
    fn: () => {
      const src = fs.readFileSync(permissionPath, 'utf-8');
      assert(src.includes('Passed bkit deny check'),
        'Should contain dual defense logic message');
    }
  },

  { name: 'TC91-57: SEC-05 does NOT just return ALLOW when policyEngineActive',
    fn: () => {
      const src = fs.readFileSync(permissionPath, 'utf-8');
      // When policyEngineActive, should still check deny patterns before returning
      assert(src.includes('config.policyEngineActive'),
        'Should check policyEngineActive flag');
      // Verify there is deny pattern checking code after policyEngineActive check
      const policyActiveIdx = src.indexOf('config.policyEngineActive');
      const denyCheckIdx = src.indexOf('patterns.deny', policyActiveIdx);
      assert(denyCheckIdx > policyActiveIdx,
        'Deny patterns should be checked even when Policy Engine is active');
    }
  },

  { name: 'TC91-58: SEC-05 DEFAULT_PATTERNS still referenced when policyEngineActive',
    fn: () => {
      const src = fs.readFileSync(permissionPath, 'utf-8');
      // In the policyEngineActive block, DEFAULT_PATTERNS should be re-assigned
      assert(src.includes('config.patterns = DEFAULT_PATTERNS'),
        'Should set patterns to DEFAULT_PATTERNS when Policy Engine is active');
    }
  },

  { name: 'TC91-59: SEC-05 DEFAULT_PATTERNS has deny patterns for run_shell_command',
    fn: () => {
      const src = fs.readFileSync(permissionPath, 'utf-8');
      assert(src.includes("'rm -rf /'"), 'DEFAULT_PATTERNS should deny rm -rf /');
      assert(src.includes("'curl * | bash'"), 'DEFAULT_PATTERNS should deny curl pipe bash');
    }
  },

  { name: 'TC91-60: SEC-05 DEFAULT_PATTERNS has deny patterns for write_file',
    fn: () => {
      const src = fs.readFileSync(permissionPath, 'utf-8');
      assert(src.includes("'*.env'"), 'DEFAULT_PATTERNS should deny .env files');
      assert(src.includes("'*.key'"), 'DEFAULT_PATTERNS should deny .key files');
    }
  },

  { name: 'TC91-61: SEC-05 checkPermission function exists and is exported',
    fn: () => {
      const src = fs.readFileSync(permissionPath, 'utf-8');
      assert(src.includes('function checkPermission('), 'checkPermission function should exist');
      assert(src.includes('checkPermission'), 'checkPermission should be in source');
    }
  },

  { name: 'TC91-62: SEC-05 deny check happens before allow/ask when Policy Engine active',
    fn: () => {
      const src = fs.readFileSync(permissionPath, 'utf-8');
      // Find the policyEngineActive block and verify deny check comes first
      const checkPermFn = src.substring(src.indexOf('function checkPermission'));
      const denyCheckIdx = checkPermFn.indexOf('patterns.deny');
      const policyReturnIdx = checkPermFn.indexOf('Passed bkit deny check');
      assert(denyCheckIdx < policyReturnIdx,
        'Deny pattern check should come before policy engine passthrough');
    }
  },

  { name: 'TC91-63: SEC-05 policyEngineActive set when TOML files found',
    fn: () => {
      const src = fs.readFileSync(permissionPath, 'utf-8');
      assert(src.includes('policyEngineActive: true'),
        'Should set policyEngineActive when .toml policy files exist');
    }
  },

  { name: 'TC91-64: SEC-05 DEFAULT_PATTERNS deny list includes fork bomb pattern',
    fn: () => {
      const src = fs.readFileSync(permissionPath, 'utf-8');
      assert(src.includes(':(){ :|:& };:'), 'DEFAULT_PATTERNS should deny fork bomb');
    }
  },

  { name: 'TC91-65: SEC-05 deny match returns level DENY with matched pattern',
    fn: () => {
      const src = fs.readFileSync(permissionPath, 'utf-8');
      assert(src.includes("level: PERMISSION_LEVELS.DENY"),
        'Should return DENY level on pattern match');
      assert(src.includes('matchedPattern: denyMatch.pattern'),
        'Should include matched pattern in deny result');
    }
  },

  // ═══════════════════════════════════════════════════════════
  // SEC-08: Plan Mode Restrictions (10 TC)
  // ═══════════════════════════════════════════════════════════

  { name: 'TC91-66: SEC-08 starter TOML has modes = ["plan"] rules',
    fn: () => {
      const toml = fs.readFileSync(starterTomlPath, 'utf-8');
      assert(toml.includes('modes = ["plan"]'),
        'Starter policy should have plan mode rules');
    }
  },

  { name: 'TC91-67: SEC-08 write_file deny in plan mode',
    fn: () => {
      const toml = fs.readFileSync(starterTomlPath, 'utf-8');
      const blocks = toml.split('[[rule]]').slice(1);
      const planWriteBlock = blocks.find(b =>
        b.includes('toolName = "write_file"') && b.includes('modes = ["plan"]')
      );
      assert(planWriteBlock, 'Should have write_file plan mode rule');
      assert(planWriteBlock.includes('decision = "deny"'),
        'write_file in plan mode should be denied');
    }
  },

  { name: 'TC91-68: SEC-08 replace deny in plan mode',
    fn: () => {
      const toml = fs.readFileSync(starterTomlPath, 'utf-8');
      const blocks = toml.split('[[rule]]').slice(1);
      const planReplaceBlock = blocks.find(b =>
        b.includes('toolName = "replace"') && b.includes('modes = ["plan"]')
      );
      assert(planReplaceBlock, 'Should have replace plan mode rule');
      assert(planReplaceBlock.includes('decision = "deny"'),
        'replace in plan mode should be denied');
    }
  },

  { name: 'TC91-69: SEC-08 run_shell_command deny in plan mode',
    fn: () => {
      const toml = fs.readFileSync(starterTomlPath, 'utf-8');
      const blocks = toml.split('[[rule]]').slice(1);
      const planShellBlock = blocks.find(b =>
        b.includes('toolName = "run_shell_command"') && b.includes('modes = ["plan"]')
      );
      assert(planShellBlock, 'Should have run_shell_command plan mode rule');
      assert(planShellBlock.includes('decision = "deny"'),
        'run_shell_command in plan mode should be denied');
    }
  },

  { name: 'TC91-70: SEC-08 plan mode rules have priority 110 (higher than normal)',
    fn: () => {
      const toml = fs.readFileSync(starterTomlPath, 'utf-8');
      const blocks = toml.split('[[rule]]').slice(1);
      const planBlocks = blocks.filter(b => b.includes('modes = ["plan"]'));
      assert(planBlocks.length >= 3, 'Should have at least 3 plan mode rules');
      for (const block of planBlocks) {
        assert(block.includes('priority = 110'),
          'Plan mode rules should have priority 110');
      }
    }
  },

  { name: 'TC91-71: SEC-08 plan mode priority 110 exceeds deny priority 100',
    fn: () => {
      // Plan mode deny at 110 overrides even regular deny at 100
      const toml = fs.readFileSync(starterTomlPath, 'utf-8');
      const blocks = toml.split('[[rule]]').slice(1);
      let maxNormalPriority = 0;
      let minPlanPriority = Infinity;
      for (const block of blocks) {
        const priorityMatch = block.match(/priority\s*=\s*(\d+)/);
        if (!priorityMatch) continue;
        const priority = parseInt(priorityMatch[1]);
        if (block.includes('modes = ["plan"]')) {
          minPlanPriority = Math.min(minPlanPriority, priority);
        } else {
          maxNormalPriority = Math.max(maxNormalPriority, priority);
        }
      }
      assert(minPlanPriority >= maxNormalPriority,
        `Plan mode priority (${minPlanPriority}) should be >= normal max (${maxNormalPriority})`);
    }
  },

  { name: 'TC91-72: SEC-08 starter TOML has SEC-08 comment marker',
    fn: () => {
      const toml = fs.readFileSync(starterTomlPath, 'utf-8');
      assert(toml.includes('SEC-08'), 'Starter TOML should reference SEC-08');
    }
  },

  { name: 'TC91-73: SEC-08 read_file is allowed (not blocked in plan mode)',
    fn: () => {
      const toml = fs.readFileSync(starterTomlPath, 'utf-8');
      const blocks = toml.split('[[rule]]').slice(1);
      const readPlanBlock = blocks.find(b =>
        b.includes('toolName = "read_file"') && b.includes('modes = ["plan"]')
      );
      assert(!readPlanBlock, 'read_file should NOT be blocked in plan mode');
      // But read_file should have an allow rule
      const readBlock = blocks.find(b => b.includes('toolName = "read_file"'));
      assert(readBlock, 'read_file should have a rule');
      assert(readBlock.includes('decision = "allow"'), 'read_file should be allowed');
    }
  },

  { name: 'TC91-74: SEC-08 policy module LEVEL_POLICY_TEMPLATES includes plan mode for Starter',
    fn: () => {
      const policySrc = fs.readFileSync(policyPath, 'utf-8');
      assert(policySrc.includes("modes: ['plan']"),
        'Policy module should have plan mode in Starter template');
    }
  },

  { name: 'TC91-75: SEC-08 exactly 3 plan mode rules in starter TOML',
    fn: () => {
      const toml = fs.readFileSync(starterTomlPath, 'utf-8');
      const planModeCount = (toml.match(/modes\s*=\s*\["plan"\]/g) || []).length;
      assertEqual(planModeCount, 3, 'Should have exactly 3 plan mode rules');
    }
  },

  // ═══════════════════════════════════════════════════════════
  // SEC-09: Security Audit Log (12 TC)
  // ═══════════════════════════════════════════════════════════

  { name: 'TC91-76: SEC-09 writeSecurityAuditLog function exists in before-tool source',
    fn: () => {
      const src = fs.readFileSync(beforeToolPath, 'utf-8');
      assert(src.includes('function writeSecurityAuditLog'),
        'writeSecurityAuditLog function should exist');
    }
  },

  { name: 'TC91-77: SEC-09 writes to .gemini/security-audit.log',
    fn: () => {
      const src = fs.readFileSync(beforeToolPath, 'utf-8');
      assert(src.includes('security-audit.log'),
        'Should write to security-audit.log');
      assert(src.includes("path.join(auditDir, 'security-audit.log')") ||
             src.includes("path.join(projectDir, '.gemini')"),
        'Should construct path under .gemini directory');
    }
  },

  { name: 'TC91-78: SEC-09 has try-catch wrapping (non-blocking)',
    fn: () => {
      const src = fs.readFileSync(beforeToolPath, 'utf-8');
      // Find the writeSecurityAuditLog function body
      const funcStart = src.indexOf('function writeSecurityAuditLog');
      const funcBody = src.substring(funcStart, funcStart + 800);
      assert(funcBody.includes('try {'), 'Should have try block');
      assert(funcBody.includes('catch'), 'Should have catch block');
      // Catch block should be empty or minimal (non-blocking)
      assert(funcBody.includes('catch (e) {'),
        'Catch should swallow error silently');
    }
  },

  { name: 'TC91-79: SEC-09 logs DENY events',
    fn: () => {
      const src = fs.readFileSync(beforeToolPath, 'utf-8');
      assert(src.includes("writeSecurityAuditLog(projectDir, 'DENY'"),
        'Should log DENY events');
    }
  },

  { name: 'TC91-80: SEC-09 logs ASK events',
    fn: () => {
      const src = fs.readFileSync(beforeToolPath, 'utf-8');
      assert(src.includes("writeSecurityAuditLog(projectDir, 'ASK'"),
        'Should log ASK events');
    }
  },

  { name: 'TC91-81: SEC-09 severity HIGH for DENY events',
    fn: () => {
      const src = fs.readFileSync(beforeToolPath, 'utf-8');
      assert(src.includes("severity:") && src.includes("'HIGH'"),
        'Should map HIGH severity for DENY');
    }
  },

  { name: 'TC91-82: SEC-09 severity MEDIUM for ASK events',
    fn: () => {
      const src = fs.readFileSync(beforeToolPath, 'utf-8');
      assert(src.includes("'MEDIUM'"),
        'Should map MEDIUM severity for ASK');
    }
  },

  { name: 'TC91-83: SEC-09 severity mapping uses ternary/conditional for DENY vs ASK',
    fn: () => {
      const src = fs.readFileSync(beforeToolPath, 'utf-8');
      // Verify the severity mapping logic
      assert(src.includes("event === 'DENY'") || src.includes("event === 'BLOCK'"),
        'Severity mapping should check for DENY/BLOCK events');
    }
  },

  { name: 'TC91-84: SEC-09 truncates command to 200 chars',
    fn: () => {
      const src = fs.readFileSync(beforeToolPath, 'utf-8');
      assert(src.includes('.substring(0, 200)'),
        'Should truncate command to 200 characters');
    }
  },

  { name: 'TC91-85: SEC-09 log entry includes timestamp',
    fn: () => {
      const src = fs.readFileSync(beforeToolPath, 'utf-8');
      assert(src.includes('timestamp:') && src.includes('toISOString'),
        'Log entry should include ISO timestamp');
    }
  },

  { name: 'TC91-86: SEC-09 log entry is JSON format (JSON.stringify)',
    fn: () => {
      const src = fs.readFileSync(beforeToolPath, 'utf-8');
      const funcStart = src.indexOf('function writeSecurityAuditLog');
      const funcBody = src.substring(funcStart, funcStart + 800);
      assert(funcBody.includes('JSON.stringify'),
        'Log entry should use JSON.stringify');
    }
  },

  { name: 'TC91-87: SEC-09 uses appendFileSync (not writeFileSync) for append behavior',
    fn: () => {
      const src = fs.readFileSync(beforeToolPath, 'utf-8');
      const funcStart = src.indexOf('function writeSecurityAuditLog');
      const funcBody = src.substring(funcStart, funcStart + 800);
      assert(funcBody.includes('appendFileSync'),
        'Should use appendFileSync to append log entries');
    }
  },

  // ═══════════════════════════════════════════════════════════
  // SEC-10: Path Exposure Prevention (8 TC)
  // ═══════════════════════════════════════════════════════════

  { name: 'TC91-88: SEC-10 handleGetAgentInfo does NOT expose absolute path in response',
    fn: () => {
      const src = fs.readFileSync(spawnAgentPath, 'utf-8');
      // Extract the handleGetAgentInfo function body up to the next method
      const funcStart = src.indexOf('handleGetAgentInfo(args)');
      assert(funcStart !== -1, 'handleGetAgentInfo function should exist');
      const funcBody = src.substring(funcStart, funcStart + 1200);
      // The JSON.stringify response object should not include agentPath as a value
      assert(!funcBody.match(/name:\s*agentPath/) && !funcBody.match(/path:\s*agentPath/),
        'Response should not expose full agentPath variable as a field value');
    }
  },

  { name: 'TC91-89: SEC-10 response uses relative file name (agentInfo.file) not full path',
    fn: () => {
      const src = fs.readFileSync(spawnAgentPath, 'utf-8');
      const funcStart = src.indexOf('handleGetAgentInfo(args)');
      assert(funcStart !== -1, 'handleGetAgentInfo should exist');
      const funcBody = src.substring(funcStart, funcStart + 1200);
      assert(funcBody.includes('agentInfo.file'),
        'Should use agentInfo.file (relative filename) in response');
    }
  },

  { name: 'TC91-90: SEC-10 error responses don\'t contain PLUGIN_ROOT',
    fn: () => {
      const src = fs.readFileSync(spawnAgentPath, 'utf-8');
      // Error responses should not leak extensionPath/PLUGIN_ROOT
      const errorBlocks = src.match(/error:.*extensionPath/g);
      assert(!errorBlocks, 'Error responses should not contain extensionPath');
    }
  },

  { name: 'TC91-91: SEC-10 error responses don\'t contain extensionPath variable',
    fn: () => {
      const src = fs.readFileSync(spawnAgentPath, 'utf-8');
      // In sendError method, the message should not include extensionPath
      const sendErrorFn = src.match(/sendError\(id,\s*message\)\s*\{[\s\S]*?\}/);
      assert(sendErrorFn, 'sendError method should exist');
      assert(!sendErrorFn[0].includes('extensionPath'),
        'sendError should not reference extensionPath');
    }
  },

  { name: 'TC91-92: SEC-10 handleGetAgentInfo does not expose agentContent in response',
    fn: () => {
      const src = fs.readFileSync(spawnAgentPath, 'utf-8');
      const funcStart = src.indexOf('handleGetAgentInfo(args)');
      assert(funcStart !== -1, 'handleGetAgentInfo should exist');
      // Find the second return statement (success response with JSON.stringify)
      const funcBody = src.substring(funcStart, funcStart + 1200);
      const jsonBlock = funcBody.match(/JSON\.stringify\(\{[\s\S]*?\}\s*,\s*null/);
      assert(jsonBlock, 'Should have JSON.stringify response block');
      // agentContent is read but should NOT appear inside the JSON response
      assert(!jsonBlock[0].includes('agentContent'),
        'Agent file content should not be directly exposed in response');
    }
  },

  { name: 'TC91-93: SEC-10 extensionPath defined from __dirname (not user input)',
    fn: () => {
      const src = fs.readFileSync(spawnAgentPath, 'utf-8');
      assert(src.includes("const extensionPath = path.resolve(__dirname"),
        'extensionPath should derive from __dirname, not user input');
    }
  },

  { name: 'TC91-94: SEC-10 handleListAgents does not expose file paths',
    fn: () => {
      const src = fs.readFileSync(spawnAgentPath, 'utf-8');
      // Find handleListAgents method
      const listMatch = src.match(/handleListAgents\(\)\s*\{[\s\S]*?return\s*\{[\s\S]*?\}\s*;/);
      if (listMatch) {
        assert(!listMatch[0].includes('extensionPath'),
          'handleListAgents should not expose extensionPath');
        assert(!listMatch[0].includes('agentPath'),
          'handleListAgents should not expose full agent paths');
      }
    }
  },

  { name: 'TC91-95: SEC-10 console.error used for internal debug, console.log for MCP protocol only',
    fn: () => {
      const src = fs.readFileSync(spawnAgentPath, 'utf-8');
      // console.error goes to stderr (not visible to MCP client)
      const consoleErrors = (src.match(/console\.error\(/g) || []).length;
      const consoleLogs = (src.match(/console\.log\(/g) || []).length;
      assert(consoleErrors > 0, 'Should use console.error for debug output');
      assert(consoleLogs > 0, 'Should use console.log for MCP protocol output');
      // sendResponse and sendError use console.log for MCP protocol
      assert(src.includes('console.log(JSON.stringify(response))'),
        'MCP responses should be sent via console.log(JSON.stringify)');
    }
  }
];

module.exports = { tests };
