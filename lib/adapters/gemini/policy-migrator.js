/**
 * Policy Migrator - bkit.config.json permissions -> TOML Policy
 * Converts bkit permission configuration to Gemini CLI v0.30.0 Policy Engine format
 *
 * @version 1.5.4
 */
const fs = require('fs');
const path = require('path');

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
  if (!permissions || typeof permissions !== 'object') {
    return '';
  }

  const lines = [
    '# bkit-gemini v1.5.4 - Auto-generated Policy File',
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
      lines.push(`toolName = "${rule.toolName}"`);
      if (rule.commandPrefix) {
        lines.push(`commandPrefix = "${rule.commandPrefix}"`);
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
      lines.push(`toolName = "${rule.toolName}"`);
      if (rule.commandPrefix) {
        lines.push(`commandPrefix = "${rule.commandPrefix}"`);
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
      lines.push(`toolName = "${rule.toolName}"`);
      if (rule.commandPrefix) {
        lines.push(`commandPrefix = "${rule.commandPrefix}"`);
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

module.exports = {
  parsePermissionKey,
  mapDecision,
  getPriority,
  convertToToml,
  hasPolicyFiles,
  generatePolicyFile
};
