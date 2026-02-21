/**
 * Permission Pattern Matching (GAP-05)
 * Implements deny/ask/allow permission system with glob pattern matching
 *
 * Philosophy: FR-05 (Automation First) - Granular permissions needed for safe automation
 */
const fs = require('fs');
const path = require('path');

/**
 * Permission levels
 */
const PERMISSION_LEVELS = {
  ALLOW: 'allow',
  DENY: 'deny',
  ASK: 'ask'
};

/**
 * Default permission patterns (applied when no config exists)
 */
const DEFAULT_PATTERNS = {
  run_shell_command: {
    deny: [
      'rm -rf /',
      'rm -rf /*',
      'rm -rf ~/*',
      'mkfs.*',
      'dd if=* of=/dev/*',
      '> /dev/sd*',
      'curl * | bash',
      'curl * | sh',
      'wget * | bash',
      'wget * | sh',
      ':(){ :|:& };:'
    ],
    ask: [
      'git push --force*',
      'git reset --hard*',
      'docker system prune*',
      'npm publish*'
    ],
    allow: [
      'npm test*',
      'npm run*',
      'git status',
      'git log*',
      'git diff*',
      'ls*',
      'cat*',
      'echo*'
    ]
  },
  write_file: {
    deny: [
      '*.env',
      '*.env.local',
      '*.env.production',
      '*.key',
      '*.pem',
      '*credentials*',
      '*secrets*',
      '*/id_rsa*',
      '*/.ssh/*'
    ]
  }
};

// Lazy load for project directory
let _projectDir = null;
function getProjectDir() {
  if (_projectDir) return _projectDir;

  try {
    const { getAdapter } = require('../adapters');
    _projectDir = getAdapter().getProjectDir();
  } catch {
    _projectDir = process.cwd();
  }

  return _projectDir;
}

/**
 * Simple glob pattern matcher
 * Supports * (any characters) and ? (single character)
 *
 * @param {string} value - Value to test
 * @param {string} pattern - Glob pattern
 * @returns {boolean}
 */
function matchesGlobPattern(value, pattern) {
  // Escape special regex characters except * and ?
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');

  const regex = new RegExp(`^${regexPattern}$`, 'i');
  return regex.test(value);
}

/**
 * Check if value matches any pattern in list
 *
 * @param {string} value - Value to test
 * @param {string[]} patterns - List of glob patterns
 * @returns {{matched: boolean, pattern: string|null}}
 */
function matchesAnyPattern(value, patterns) {
  if (!patterns || !Array.isArray(patterns)) {
    return { matched: false, pattern: null };
  }

  for (const pattern of patterns) {
    if (matchesGlobPattern(value, pattern)) {
      return { matched: true, pattern };
    }
  }

  return { matched: false, pattern: null };
}

/**
 * Load permission configuration from bkit.config.json
 *
 * @param {string} projectDir - Project directory
 * @returns {object}
 */
function loadPermissionConfig(projectDir) {
  // v0.30.0+: Check for Policy Engine TOML files first
  const policyDir = path.join(projectDir, '.gemini', 'policies');
  if (fs.existsSync(policyDir)) {
    try {
      const policyFiles = fs.readdirSync(policyDir).filter(f => f.endsWith('.toml'));
      if (policyFiles.length > 0) {
        // Policy Engine is active - defer to Gemini CLI native handling
        return {
          tools: {},
          patterns: {},
          policyEngineActive: true
        };
      }
    } catch (e) { /* ignore */ }
  }

  const configPath = path.join(projectDir, 'bkit.config.json');

  if (!fs.existsSync(configPath)) {
    return {
      tools: {},
      patterns: DEFAULT_PATTERNS
    };
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const permissions = config.permissions || {};

    // Merge with defaults
    return {
      tools: permissions.tools || {},
      patterns: {
        ...DEFAULT_PATTERNS,
        ...permissions.patterns
      }
    };
  } catch {
    return {
      tools: {},
      patterns: DEFAULT_PATTERNS
    };
  }
}

/**
 * Get the value to match against patterns for a tool
 *
 * @param {string} toolName - Tool name
 * @param {object} toolInput - Tool input parameters
 * @returns {string}
 */
function getMatchValue(toolName, toolInput) {
  switch (toolName) {
    case 'run_shell_command':
      return toolInput.command || '';

    case 'write_file':
    case 'read_file':
      return toolInput.file_path || toolInput.path || '';

    case 'replace':
      return toolInput.file_path || toolInput.path || '';

    case 'glob':
      return toolInput.pattern || '';

    case 'grep':
      return toolInput.pattern || '';

    default:
      // For unknown tools, stringify the input
      return JSON.stringify(toolInput);
  }
}

/**
 * Check permission for a tool call
 *
 * @param {string} toolName - Tool name (e.g., 'run_shell_command')
 * @param {object} toolInput - Tool input parameters
 * @param {string} projectDir - Project directory (optional)
 * @returns {{level: string, reason: string|null, matchedPattern: string|null}}
 */
function checkPermission(toolName, toolInput, projectDir) {
  const dir = projectDir || getProjectDir();
  const config = loadPermissionConfig(dir);

  // If Policy Engine is active, skip bkit permission checks
  if (config.policyEngineActive) {
    return {
      level: PERMISSION_LEVELS.ALLOW,
      reason: 'Deferred to Policy Engine',
      matchedPattern: null
    };
  }

  // 1. Check tool-level permission (highest priority for deny)
  const toolLevel = config.tools?.[toolName];
  if (toolLevel === PERMISSION_LEVELS.DENY) {
    return {
      level: PERMISSION_LEVELS.DENY,
      reason: `Tool ${toolName} is globally denied`,
      matchedPattern: null
    };
  }

  // 2. Get the value to match against patterns
  const matchValue = getMatchValue(toolName, toolInput);

  if (!matchValue) {
    return {
      level: toolLevel || PERMISSION_LEVELS.ALLOW,
      reason: null,
      matchedPattern: null
    };
  }

  // 3. Get patterns for this tool
  const patterns = config.patterns?.[toolName];

  if (!patterns) {
    // No patterns defined, use tool-level or default
    return {
      level: toolLevel || PERMISSION_LEVELS.ALLOW,
      reason: null,
      matchedPattern: null
    };
  }

  // 4. Check deny patterns first (highest priority)
  if (patterns.deny) {
    const denyMatch = matchesAnyPattern(matchValue, patterns.deny);
    if (denyMatch.matched) {
      return {
        level: PERMISSION_LEVELS.DENY,
        reason: `Matches deny pattern`,
        matchedPattern: denyMatch.pattern
      };
    }
  }

  // 5. Check allow patterns
  if (patterns.allow) {
    const allowMatch = matchesAnyPattern(matchValue, patterns.allow);
    if (allowMatch.matched) {
      return {
        level: PERMISSION_LEVELS.ALLOW,
        reason: `Matches allow pattern`,
        matchedPattern: allowMatch.pattern
      };
    }
  }

  // 6. Check ask patterns
  if (patterns.ask) {
    const askMatch = matchesAnyPattern(matchValue, patterns.ask);
    if (askMatch.matched) {
      return {
        level: PERMISSION_LEVELS.ASK,
        reason: `Requires confirmation`,
        matchedPattern: askMatch.pattern
      };
    }
  }

  // 7. Default to tool-level or allow
  return {
    level: toolLevel || PERMISSION_LEVELS.ALLOW,
    reason: 'Default permission',
    matchedPattern: null
  };
}

/**
 * Format permission check result for hook output
 *
 * @param {{level: string, reason: string|null, matchedPattern: string|null}} result
 * @param {string} toolName
 * @param {object} toolInput
 * @returns {{status: string, context?: string, reason?: string}}
 */
function formatPermissionResult(result, toolName, toolInput) {
  switch (result.level) {
    case PERMISSION_LEVELS.DENY:
      return {
        status: 'block',
        reason: `Permission denied for ${toolName}: ${result.reason}${result.matchedPattern ? ` (pattern: ${result.matchedPattern})` : ''}`
      };

    case PERMISSION_LEVELS.ASK:
      const value = getMatchValue(toolName, toolInput);
      const shortValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
      return {
        status: 'allow',
        context: `**Permission Required**: ${toolName} requires confirmation.\n` +
                 `Command: \`${shortValue}\`\n` +
                 `Reason: ${result.reason}${result.matchedPattern ? ` (pattern: ${result.matchedPattern})` : ''}`
      };

    default:
      return { status: 'allow' };
  }
}

/**
 * Validate all permissions in a batch
 *
 * @param {Array<{toolName: string, toolInput: object}>} toolCalls
 * @param {string} projectDir
 * @returns {Array<{toolName: string, result: object}>}
 */
function validateBatch(toolCalls, projectDir) {
  return toolCalls.map(({ toolName, toolInput }) => ({
    toolName,
    toolInput,
    result: checkPermission(toolName, toolInput, projectDir)
  }));
}

/**
 * Check if any tools in batch are denied
 *
 * @param {Array<{toolName: string, result: object}>} batchResults
 * @returns {{hasDenied: boolean, deniedTools: Array}}
 */
function hasDeniedInBatch(batchResults) {
  const deniedTools = batchResults.filter(
    r => r.result.level === PERMISSION_LEVELS.DENY
  );

  return {
    hasDenied: deniedTools.length > 0,
    deniedTools
  };
}

/**
 * Get a summary of permission configuration
 *
 * @param {string} projectDir
 * @returns {object}
 */
function getPermissionSummary(projectDir) {
  const config = loadPermissionConfig(projectDir || getProjectDir());

  const summary = {
    toolOverrides: Object.keys(config.tools).length,
    patternsConfigured: Object.keys(config.patterns).length,
    details: {}
  };

  for (const [tool, patterns] of Object.entries(config.patterns)) {
    summary.details[tool] = {
      denyPatterns: patterns.deny?.length || 0,
      allowPatterns: patterns.allow?.length || 0,
      askPatterns: patterns.ask?.length || 0
    };
  }

  return summary;
}

module.exports = {
  PERMISSION_LEVELS,
  DEFAULT_PATTERNS,
  loadPermissionConfig,
  checkPermission,
  formatPermissionResult,
  validateBatch,
  hasDeniedInBatch,
  getPermissionSummary,
  matchesGlobPattern,
  matchesAnyPattern,
  getMatchValue
};
