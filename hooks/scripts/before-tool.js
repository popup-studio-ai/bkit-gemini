#!/usr/bin/env node
/**
 * BeforeTool Hook - Pre-execution Validation (v1.5.1)
 * Validates tool calls, checks permissions via PermissionManager,
 * applies PDCA phase restrictions, and provides guidance
 */
const fs = require('fs');
const path = require('path');

const libPath = path.resolve(__dirname, '..', '..', 'lib');

function main() {
  try {
    const { getAdapter } = require(path.join(libPath, 'adapters'));
    const adapter = getAdapter();

    // Read input
    const input = adapter.readHookInput();
    const toolName = input.tool_name || '';
    const toolInput = input.tool_input || {};

    // Map tool name
    const claudeToolName = adapter.reverseMapToolName(toolName);

    const projectDir = adapter.getProjectDir();

    // 1. Check PermissionManager (integrated from lib/core/permission.js)
    const permResult = checkPermissionManager(toolName, toolInput, projectDir);
    if (permResult.level === 'deny') {
      adapter.outputBlock(`Permission denied: ${permResult.reason || 'Blocked by permission policy'}`);
      return;
    }

    const contexts = [];

    // Add permission warnings
    if (permResult.level === 'ask') {
      contexts.push(`**Permission Warning**: ${permResult.reason || 'This action requires caution.'}`);
    }

    // 2. Check PDCA phase restrictions
    const pdcaWarning = checkPdcaPhaseRestriction(toolName, projectDir);
    if (pdcaWarning) {
      contexts.push(pdcaWarning);
    }

    // 3. Handle by tool type (existing logic)
    if (['write_file', 'replace'].includes(toolName) || ['Write', 'Edit'].includes(claudeToolName)) {
      const writeContexts = handleWriteEdit(toolInput);
      contexts.push(...writeContexts);
    } else if (toolName === 'run_shell_command' || claudeToolName === 'Bash') {
      const bashResult = handleBash(toolInput);
      if (bashResult.block) {
        adapter.outputBlock(bashResult.message);
        return;
      }
      contexts.push(...bashResult.warnings);
    }

    if (contexts.length > 0) {
      adapter.outputAllow(contexts.join('\n'), 'BeforeTool');
    } else {
      adapter.outputEmpty();
    }

  } catch (error) {
    process.exit(0);
  }
}

/**
 * Check PermissionManager from lib/core/permission.js
 */
function checkPermissionManager(toolName, toolInput, projectDir) {
  try {
    const { checkPermission } = require(path.join(libPath, 'core', 'permission'));
    return checkPermission(toolName, toolInput, projectDir);
  } catch (e) {
    // Permission module not available, fall through to hardcoded checks
    return { level: 'allow', reason: null, matchedPattern: null };
  }
}

/**
 * Check PDCA phase restrictions
 */
function checkPdcaPhaseRestriction(toolName, projectDir) {
  try {
    const statusPath = path.join(projectDir, 'docs', '.pdca-status.json');
    if (!fs.existsSync(statusPath)) return null;

    const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
    const feature = status.primaryFeature;
    if (!feature || !status.features[feature]) return null;

    const phase = status.features[feature].phase;

    // Plan/Check phases should be read-only
    if ((phase === 'plan' || phase === 'check') &&
        ['write_file', 'replace', 'run_shell_command'].includes(toolName)) {
      return `**PDCA Phase Warning**: Current phase is "${phase}" (read-only recommended). Writing files may deviate from the PDCA workflow.`;
    }

    return null;
  } catch (e) {
    return null;
  }
}

function handleWriteEdit(toolInput) {
  const filePath = toolInput.file_path || toolInput.path || '';
  const content = toolInput.content || '';
  const contexts = [];

  // Check for dangerous patterns in content
  if (content.includes('rm -rf /') || content.includes(':(){ :|:& };:')) {
    // This is now handled by PermissionManager, but keep as fallback
    contexts.push('**Security Alert**: Potentially dangerous content detected');
  }

  // Check if writing to source code
  const ext = path.extname(filePath).toLowerCase();
  const sourceExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java'];

  if (sourceExts.includes(ext)) {
    const lines = content.split('\n').length;
    let guidance = '';

    if (lines > 500) {
      guidance = 'Major feature detected. PDCA documentation is strongly recommended.';
    } else if (lines > 100) {
      guidance = 'Feature-sized change detected. Consider creating design documentation.';
    }

    if (guidance) {
      contexts.push(`**PDCA Guidance**: ${guidance}`);
    }
  }

  // Check for env file writes
  if (path.basename(filePath).startsWith('.env')) {
    contexts.push('**Security Note**: Writing to environment file. Ensure sensitive values are not committed.');
  }

  return contexts;
}

function handleBash(toolInput) {
  const command = toolInput.command || '';

  // Dangerous patterns to block (fallback for PermissionManager)
  const blockPatterns = [
    /rm\s+-rf\s+\/(?!\s)/,
    /rm\s+-rf\s+\*/,
    /mkfs\./,
    /dd\s+if=.*of=\/dev/,
    />\s*\/dev\/sd[a-z]/,
    /curl.*\|\s*(?:bash|sh)/,
    /wget.*\|\s*(?:bash|sh)/
  ];

  for (const pattern of blockPatterns) {
    if (pattern.test(command)) {
      return { block: true, message: `Dangerous command pattern detected: ${pattern}`, warnings: [] };
    }
  }

  // Warning patterns
  const warnPatterns = [
    { pattern: /git\s+push\s+--force/, msg: 'Force push detected. Use with caution.' },
    { pattern: /git\s+reset\s+--hard/, msg: 'Hard reset detected. This may cause data loss.' },
    { pattern: /rm\s+-r/, msg: 'Recursive delete detected. Verify the path.' },
    { pattern: /DROP\s+TABLE/i, msg: 'SQL DROP statement detected.' },
    { pattern: /TRUNCATE/i, msg: 'SQL TRUNCATE statement detected.' }
  ];

  const warnings = [];
  for (const { pattern, msg } of warnPatterns) {
    if (pattern.test(command)) {
      warnings.push(`**Warning**: ${msg}`);
    }
  }

  return { block: false, message: '', warnings };
}

main();
