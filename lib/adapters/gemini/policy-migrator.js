/**
 * Policy Migrator - bkit.config.json permissions -> TOML Policy
 * Converts bkit permission configuration to Gemini CLI v0.30.0 Policy Engine format
 *
 * @version 1.5.6
 */
const fs = require('fs');
const path = require('path');

/**
 * Escape special characters for TOML string values
 * @param {string} str
 * @returns {string}
 */
function escapeTomlString(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

/**
 * Validate generated TOML structure before writing
 * @param {string} tomlContent
 * @returns {boolean}
 */
function validateTomlStructure(tomlContent) {
  const rules = tomlContent.match(/\[\[rule\]\]/g);
  if (!rules || rules.length === 0) {
    return false;
  }
  const decisions = tomlContent.match(/decision\s*=\s*"(allow|deny|ask_user)"/g);
  if (!decisions || decisions.length !== rules.length) {
    return false;
  }
  return true;
}

/**
 * Parse bkit permission key format
 * "run_shell_command(rm -rf*)" -> { tool: "run_shell_command", pattern: "rm -rf" }
 * "write_file" -> { tool: "write_file", pattern: null }
 *
 * @param {string} key - Permission key from bkit.config.json
 * @returns {{ tool: string, pattern: string|null }}
 */
function parsePermissionKey(key) {
  const match = key.match(/^([a-z_]+)\((.+)\)$/);
  if (match) {
    // Remove trailing * from pattern for commandPrefix
    let pattern = match[2];
    if (pattern.endsWith('*')) {
      pattern = pattern.slice(0, -1).trimEnd();
    }
    return { tool: match[1], pattern };
  }
  return { tool: key, pattern: null };
}

/**
 * Map bkit permission level to Policy Engine decision
 * @param {string} level - "allow", "deny", or "ask"
 * @returns {string} Policy Engine decision
 */
function mapDecision(level) {
  switch (level) {
    case 'deny': return 'deny';
    case 'ask': return 'ask_user';
    case 'allow': return 'allow';
    default: return 'allow';
  }
}

/**
 * Get priority based on decision type
 * @param {string} decision - Policy Engine decision
 * @returns {number}
 */
function getPriority(decision) {
  switch (decision) {
    case 'deny': return 100;
    case 'ask_user': return 50;
    case 'allow': return 10;
    default: return 10;
  }
}

/**
 * Convert bkit permissions config to Policy Engine TOML string
 *
 * @param {object} permissions - bkit.config.json permissions object
 * @returns {string} TOML content
 */
function convertToToml(permissions) {
  if (!permissions || typeof permissions !== 'object' || Object.keys(permissions).length === 0) {
    return '';
  }

  const lines = [
    '# bkit-gemini v1.5.6 - Auto-generated Policy File',
    '# Source: bkit.config.json permissions',
    `# Generated: ${new Date().toISOString().split('T')[0]}`,
    ''
  ];

  // Group rules by decision type
  const denyRules = [];
  const askRules = [];
  const allowRules = [];

  for (const [key, level] of Object.entries(permissions)) {
    const { tool, pattern } = parsePermissionKey(key);
    const decision = mapDecision(level);
    const priority = getPriority(decision);

    const rule = { toolName: tool, decision, priority };
    if (pattern) {
      rule.commandPrefix = pattern;
    }

    if (decision === 'deny') denyRules.push(rule);
    else if (decision === 'ask_user') askRules.push(rule);
    else allowRules.push(rule);
  }

  // Deny rules (highest priority)
  if (denyRules.length > 0) {
    lines.push('# --- Deny Rules (highest priority) ---');
    lines.push('');
    for (const rule of denyRules) {
      lines.push('[[rule]]');
      lines.push(`toolName = "${escapeTomlString(rule.toolName)}"`);
      if (rule.commandPrefix) {
        lines.push(`commandPrefix = "${escapeTomlString(rule.commandPrefix)}"`);
      }
      lines.push(`decision = "${rule.decision}"`);
      lines.push(`priority = ${rule.priority}`);
      lines.push('');
    }
  }

  // Ask rules
  if (askRules.length > 0) {
    lines.push('# --- Ask Rules ---');
    lines.push('');
    for (const rule of askRules) {
      lines.push('[[rule]]');
      lines.push(`toolName = "${escapeTomlString(rule.toolName)}"`);
      if (rule.commandPrefix) {
        lines.push(`commandPrefix = "${escapeTomlString(rule.commandPrefix)}"`);
      }
      lines.push(`decision = "${rule.decision}"`);
      lines.push(`priority = ${rule.priority}`);
      lines.push('');
    }
  }

  // Allow rules
  if (allowRules.length > 0) {
    lines.push('# --- Allow Rules ---');
    lines.push('');
    for (const rule of allowRules) {
      lines.push('[[rule]]');
      lines.push(`toolName = "${escapeTomlString(rule.toolName)}"`);
      if (rule.commandPrefix) {
        lines.push(`commandPrefix = "${escapeTomlString(rule.commandPrefix)}"`);
      }
      lines.push(`decision = "${rule.decision}"`);
      lines.push(`priority = ${rule.priority}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Check if Policy Engine TOML files exist in the project
 * @param {string} projectDir - Project root directory
 * @returns {boolean}
 */
function hasPolicyFiles(projectDir) {
  const policyDir = path.join(projectDir, '.gemini', 'policies');
  if (!fs.existsSync(policyDir)) return false;

  try {
    const files = fs.readdirSync(policyDir);
    return files.some(f => f.endsWith('.toml'));
  } catch (e) {
    return false;
  }
}

/**
 * Generate TOML policy file from bkit.config.json permissions
 * Only creates when Gemini CLI >= v0.30.0 detected and no policy exists
 *
 * @param {string} projectDir - Project root directory
 * @param {string} pluginRoot - Extension root directory
 * @returns {{ created: boolean, path: string|null, reason: string }}
 */
function generatePolicyFile(projectDir, pluginRoot) {
  // Version guard: only generate for CLI >= 0.30.0
  try {
    const { getFeatureFlags } = require('./version-detector');
    if (!getFeatureFlags().hasPolicyEngine) {
      return { created: false, path: null, reason: 'Policy Engine not available (CLI < 0.30.0)' };
    }
  } catch (e) {
    // version-detector not available, proceed with generation attempt
  }

  // Don't overwrite existing policies
  if (hasPolicyFiles(projectDir)) {
    return { created: false, path: null, reason: 'Policy files already exist' };
  }

  // Load permissions from bkit.config.json
  let permissions = null;
  const configLocations = [
    path.join(projectDir, 'bkit.config.json'),
    path.join(pluginRoot, 'bkit.config.json')
  ];

  for (const configPath of configLocations) {
    try {
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (config.permissions) {
          permissions = config.permissions;
          break;
        }
      }
    } catch (e) { /* ignore */ }
  }

  if (!permissions) {
    return { created: false, path: null, reason: 'No permissions config found' };
  }

  // Generate TOML content
  const tomlContent = convertToToml(permissions);
  if (!tomlContent) {
    return { created: false, path: null, reason: 'Empty permissions config' };
  }

  // Validate TOML structure before writing
  if (!validateTomlStructure(tomlContent)) {
    return { created: false, path: null, reason: 'Generated TOML failed structural validation' };
  }

  // Write to .gemini/policies/
  const policyDir = path.join(projectDir, '.gemini', 'policies');
  const policyPath = path.join(policyDir, 'bkit-permissions.toml');

  try {
    if (!fs.existsSync(policyDir)) {
      fs.mkdirSync(policyDir, { recursive: true });
    }
    fs.writeFileSync(policyPath, tomlContent, 'utf-8');
    return { created: true, path: policyPath, reason: 'Policy file generated successfully' };
  } catch (e) {
    return { created: false, path: null, reason: `Write failed: ${e.message}` };
  }
}

// ─── Level-specific Policy Templates (v0.31.0+ Tier 3) ──────
// Generated at workspace tier (.gemini/policies/) where `allow` decision IS permitted.
// Extension tier (Tier 2) blocks `allow` decisions - these templates MUST NOT be used there.

const LEVEL_POLICY_TEMPLATES = Object.freeze({
  Starter: {
    tier: 3,
    description: 'Restrictive policy for beginners - safe defaults',
    rules: [
      { toolName: 'write_file', decision: 'ask_user', priority: 30 },
      { toolName: 'replace', decision: 'ask_user', priority: 30 },
      { toolName: 'run_shell_command', decision: 'ask_user', priority: 40 },
      { toolName: 'run_shell_command', commandPrefix: 'rm', decision: 'deny', priority: 100 },
      { toolName: 'run_shell_command', commandPrefix: 'git push --force', decision: 'deny', priority: 100 },
      { toolName: 'run_shell_command', commandPrefix: 'git reset --hard', decision: 'deny', priority: 100 },
      { toolName: 'read_file', decision: 'allow', priority: 10 },
      { toolName: 'glob', decision: 'allow', priority: 10 },
      { toolName: 'grep_search', decision: 'allow', priority: 10 },
      { toolName: 'google_web_search', decision: 'allow', priority: 10 }
    ]
  },
  Dynamic: {
    tier: 3,
    description: 'Balanced policy for fullstack development',
    rules: [
      { toolName: 'write_file', decision: 'allow', priority: 10 },
      { toolName: 'replace', decision: 'allow', priority: 10 },
      { toolName: 'run_shell_command', decision: 'allow', priority: 10 },
      { toolName: 'run_shell_command', commandPrefix: 'rm -rf', decision: 'deny', priority: 100 },
      { toolName: 'run_shell_command', commandPrefix: 'git push --force', decision: 'deny', priority: 100 },
      { toolName: 'run_shell_command', commandPrefix: 'git reset --hard', decision: 'ask_user', priority: 50 },
      { toolName: 'run_shell_command', commandPrefix: 'docker system prune', decision: 'ask_user', priority: 50 }
    ]
  },
  Enterprise: {
    tier: 3,
    description: 'Permissive policy with security audit for enterprise projects',
    rules: [
      { toolName: 'write_file', decision: 'allow', priority: 10 },
      { toolName: 'replace', decision: 'allow', priority: 10 },
      { toolName: 'run_shell_command', decision: 'allow', priority: 10 },
      { toolName: 'run_shell_command', commandPrefix: 'rm -rf /', decision: 'deny', priority: 100 },
      { toolName: 'run_shell_command', commandPrefix: 'git push --force', decision: 'ask_user', priority: 50 }
    ]
  }
});

/**
 * Generate level-specific policy file for project-level Policy Engine (Tier 3)
 * Only creates when Gemini CLI >= v0.31.0 and project-level policies supported
 *
 * @param {string} level - Project level: 'Starter', 'Dynamic', 'Enterprise'
 * @param {string} projectDir - Project root directory
 * @returns {{ created: boolean, path: string|null, reason: string }}
 */
function generateLevelPolicy(level, projectDir) {
  // Version guard: project-level policies require CLI >= 0.31.0
  try {
    const { getFeatureFlags } = require('./version-detector');
    const flags = getFeatureFlags();
    if (!flags.hasProjectLevelPolicy) {
      return { created: false, path: null, reason: 'Project-level policy not available (CLI < 0.31.0)' };
    }
  } catch (e) {
    return { created: false, path: null, reason: 'Version detection failed' };
  }

  const template = LEVEL_POLICY_TEMPLATES[level];
  if (!template) {
    return { created: false, path: null, reason: `Unknown level: ${level}` };
  }

  const policyDir = path.join(projectDir, '.gemini', 'policies');
  const policyFileName = `bkit-${level.toLowerCase()}-policy.toml`;
  const policyPath = path.join(policyDir, policyFileName);

  // Don't overwrite existing level policy
  if (fs.existsSync(policyPath)) {
    return { created: false, path: policyPath, reason: 'Level policy already exists' };
  }

  // Generate TOML content
  const lines = [
    `# bkit-gemini v1.5.6 - ${level} Level Policy`,
    `# ${template.description}`,
    '# Auto-generated for Gemini CLI v0.31.0+ Project-Level Policy Engine (Tier 3)',
    `# Generated: ${new Date().toISOString().split('T')[0]}`,
    ''
  ];

  for (const rule of template.rules) {
    lines.push('[[rule]]');
    lines.push(`toolName = "${escapeTomlString(rule.toolName)}"`);
    if (rule.commandPrefix) {
      lines.push(`commandPrefix = "${escapeTomlString(rule.commandPrefix)}"`);
    }
    lines.push(`decision = "${rule.decision}"`);
    lines.push(`priority = ${rule.priority}`);
    lines.push('');
  }

  const tomlContent = lines.join('\n');

  // Validate before writing
  if (!validateTomlStructure(tomlContent)) {
    return { created: false, path: null, reason: 'Generated TOML failed validation' };
  }

  try {
    if (!fs.existsSync(policyDir)) {
      fs.mkdirSync(policyDir, { recursive: true });
    }
    fs.writeFileSync(policyPath, tomlContent, 'utf-8');
    return { created: true, path: policyPath, reason: `${level} level policy generated` };
  } catch (e) {
    return { created: false, path: null, reason: `Write failed: ${e.message}` };
  }
}

module.exports = {
  parsePermissionKey,
  mapDecision,
  getPriority,
  escapeTomlString,
  validateTomlStructure,
  convertToToml,
  hasPolicyFiles,
  generatePolicyFile,
  generateLevelPolicy,
  LEVEL_POLICY_TEMPLATES
};
