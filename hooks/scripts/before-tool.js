#!/usr/bin/env node
/**
 * BeforeTool Hook - Pre-execution Validation (v2.0.0)
 * Dual-mode: handler export (v0.31.0+ SDK) + stdin command (legacy)
 * Validates tool calls, checks permissions via PermissionManager,
 * applies PDCA phase restrictions, and provides guidance
 */
const fs = require('fs');
const path = require('path');

const libPath = path.resolve(__dirname, '..', '..', 'lib');

/**
 * SEC-09: Security audit log
 * Records DENY/ASK events to .gemini/security-audit.log
 * @param {string} projectDir
 * @param {string} event - 'DENY' | 'ASK' | 'BLOCK'
 * @param {string} toolName
 * @param {object} toolInput
 * @param {string} reason
 */
function writeSecurityAuditLog(projectDir, event, toolName, toolInput, reason) {
  try {
    const auditDir = path.join(projectDir, '.gemini');
    const auditFile = path.join(auditDir, 'security-audit.log');

    if (!fs.existsSync(auditDir)) {
      fs.mkdirSync(auditDir, { recursive: true });
    }

    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      event,
      hook: 'BeforeTool',
      tool: toolName,
      command: toolInput?.command?.substring(0, 200) || undefined,
      filePath: toolInput?.file_path || undefined,
      reason,
      severity: event === 'DENY' || event === 'BLOCK' ? 'HIGH' : 'MEDIUM'
    });

    fs.appendFileSync(auditFile, entry + '\n', 'utf-8');
  } catch (e) {
    // Audit log failure must not block hook execution
  }
}

// --- Core processing logic ---
function processHook(input) {
  try {
    const toolName = input.tool_name || '';
    const toolInput = input.tool_input || {};
    const projectDir = input.projectDir || process.cwd();

    const permResult = checkPermissionManager(toolName, toolInput, projectDir);
    if (permResult.level === 'deny') {
      writeSecurityAuditLog(projectDir, 'DENY', toolName, toolInput, permResult.reason);
      return { status: 'block', message: `Permission denied: ${permResult.reason || 'Blocked by permission policy'}` };
    }

    const contexts = [];
    if (permResult.level === 'ask') {
      contexts.push(`**Permission Warning**: ${permResult.reason || 'This action requires caution.'}`);
      writeSecurityAuditLog(projectDir, 'ASK', toolName, toolInput, permResult.reason);
    }

    const pdcaWarning = checkPdcaPhaseRestriction(toolName, projectDir);
    if (pdcaWarning) { contexts.push(pdcaWarning); }

    if (['write_file', 'replace'].includes(toolName)) {
      contexts.push(...handleWriteEdit(toolInput));
    } else if (toolName === 'run_shell_command') {
      const bashResult = handleBash(toolInput);
      if (bashResult.block) {
        writeSecurityAuditLog(projectDir, 'BLOCK', toolName, toolInput, bashResult.message || 'Blocked by pattern');
        return { status: 'block', message: bashResult.message };
      }
      contexts.push(...bashResult.warnings);
    }

    if (contexts.length > 0) {
      return { status: 'allow', message: contexts.join('\n'), hookEvent: 'BeforeTool' };
    }
    return { status: 'allow' };
  } catch (error) {
    return { status: 'allow' };
  }
}

// --- RuntimeHook function export (v0.31.0+ SDK) ---
async function handler(event) {
  return processHook(event);
}

// --- Legacy command mode ---
function main() {
  try {
    const { getAdapter } = require(path.join(libPath, 'gemini', 'platform'));
    const adapter = getAdapter();
    const input = adapter.readHookInput();
    input.projectDir = adapter.getProjectDir();
    const result = processHook(input);

    if (result.status === 'block') {
      adapter.outputBlock(result.message);
    } else if (result.message) {
      adapter.outputAllow(result.message, result.hookEvent || 'BeforeTool');
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
    const pdcaStatusModule = require(path.join(libPath, 'pdca', 'status'));
    const status = pdcaStatusModule.loadPdcaStatus(projectDir);
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
    /wget.*\|\s*(?:bash|sh)/,
    // Reverse shell patterns (v1.5.5)
    /\b(bash|sh|nc|ncat)\s+-[ie]\s+/i,
    // Policy file tampering (v1.5.5)
    /\.gemini\/policies\//,
    // Remote code execution via pipes (v1.5.5)
    /(curl|wget)\s+.*\|\s*(bash|sh|python|node)/i,
    // Sensitive file patterns (v1.5.5)
    /\.(pem|key|cert|p12|pfx|jks)\s*$/i
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

if (require.main === module) { main(); }

module.exports = { handler };
