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
      // S7 (Wave 1 Day 2, D6 정합성): destructive op 차단 시 audit JSONL + trust_score downgrade
      applyL4Audit('DENY', 'deny', toolName, toolInput, permResult.reason, projectDir, /*forceDowngrade*/ true);
      return { decision: 'deny', reason: `Permission denied: ${permResult.reason || 'Blocked by permission policy'}` };
    }

    const contexts = [];
    if (permResult.level === 'ask') {
      // v0.36.0+: BeforeTool Hook supports 'ask' decision natively (PR #21146)
      try {
        const { getFeatureFlags } = require(path.join(libPath, 'gemini', 'version'));
        if (getFeatureFlags().hasBeforeToolAsk) {
          writeSecurityAuditLog(projectDir, 'ASK', toolName, toolInput, permResult.reason);
          return { decision: 'ask', systemMessage: permResult.reason || 'This action requires user confirmation.' };
        }
      } catch (e) { /* version detection failure, fall through to legacy */ }

      // Fallback for v0.35.x: allow with warning context
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
        // S7 (Wave 1 Day 2, D6 정합성): bash 차단도 audit JSONL + downgrade
        applyL4Audit('BLOCK', 'deny', toolName, toolInput, bashResult.message || 'Blocked by pattern', projectDir, /*forceDowngrade*/ true);
        return { decision: 'deny', reason: bashResult.message };
      }
      contexts.push(...bashResult.warnings);
    }

    // S7 v2.0.7-gemini-cli-l4-automation: L3+ automation channel
    // evaluateAutomation() returns null → fall through to legacy L0~L2 behavior.
    // Otherwise returns explicit { decision, reason/systemMessage }.
    try {
      const autoResult = evaluateAutomation(toolName, toolInput, projectDir);
      if (autoResult) {
        if (contexts.length > 0 && autoResult.decision === 'allow') {
          autoResult.systemMessage = (autoResult.systemMessage ? autoResult.systemMessage + '\n' : '') + contexts.join('\n');
        }
        return autoResult;
      }
    } catch (e) {
      // S7 automation must not block legacy behavior
    }

    if (contexts.length > 0) {
      return { decision: 'allow', systemMessage: contexts.join('\n') };
    }
    return { decision: 'allow' };
  } catch (error) {
    return { decision: 'allow' };
  }
}

/**
 * evaluateAutomation — S7 Wave 1 Day 2 (Sprint v2.0.7-gemini-cli-l4-automation)
 *
 * Decides hook outcome based on automation level + trust score + destructive
 * analysis. Returns `null` for L1~L2 (legacy path), otherwise an explicit
 * decision. Audit log + trust-score update are side-effects.
 *
 * @returns {{decision:'allow'|'deny'|'ask',systemMessage?:string,reason?:string}|null}
 */
function evaluateAutomation(toolName, toolInput, projectDir) {
  // Lazy load: missing modules must not break legacy hook (graceful)
  let TrustScoreManager, CmdParser, AuditLogger;
  try {
    TrustScoreManager = require(path.join(libPath, 'core', 'trust-score'));
    CmdParser = require(path.join(libPath, 'core', 'cmd-parser'));
    AuditLogger = require(path.join(libPath, 'core', 'audit-log'));
  } catch (e) {
    return null; // automation modules unavailable
  }

  let mgr;
  try {
    mgr = new TrustScoreManager(projectDir);
  } catch (e) {
    return null;
  }

  const level = mgr.getLevel();
  const score = mgr.getScore();
  const logger = new AuditLogger(projectDir);
  const parser = new CmdParser();

  // L0: explicit manual mode → ask user
  if (level === 0) {
    return { decision: 'ask', systemMessage: 'bkit L0 manual mode: user confirmation required.' };
  }

  // L1~L2: legacy behavior (caller handles)
  if (level <= 2) return null;

  // L3~L4 automation channel below
  const cmd = (toolInput && (toolInput.command || toolInput.file_path)) || '';

  // Hard deny check (L4 무관, D6 in design)
  if (cmd && parser.isDestructive(cmd)) {
    logger.append({
      event: 'DENY',
      hook: 'BeforeTool',
      tool: toolName,
      decision: 'deny',
      reason: `L${level}-hardguard: destructive op`,
      command: typeof cmd === 'string' ? cmd.substring(0, 200) : undefined,
      level_before: level,
      level_after: 3,
      score_after: score
    });
    mgr.downgrade(3, 'destructive op detected (D6)');
    return { decision: 'deny', reason: 'L4-hardguard: destructive operation blocked' };
  }

  // Tool whitelist (D5 — read-only ops)
  // Mirrors mcp/bkit-server.js:1094 read-only allowlist for consistency.
  const READONLY_WHITELIST = [
    'read_file', 'read_many_files', 'list_directory', 'glob',
    'grep_search', 'google_web_search', 'web_fetch'
  ];

  if (READONLY_WHITELIST.includes(toolName)) {
    mgr.recordDecision({ type: 'allow', tool: toolName, timestamp: Date.now(), durationMs: 0 });
    logger.append({
      event: 'ALLOW',
      hook: 'BeforeTool',
      tool: toolName,
      decision: 'allow',
      reason: `L${level} whitelist`,
      level_after: mgr.getLevel(),
      score_after: mgr.getScore()
    });
    return { decision: 'allow', systemMessage: `bkit L${mgr.getLevel()}: whitelist auto-approve (${toolName})` };
  }

  // L4 + trust ≥ 80: auto-approve any non-destructive tool
  if (level === 4 && score >= 80) {
    mgr.recordDecision({ type: 'allow', tool: toolName, timestamp: Date.now(), durationMs: 0 });
    logger.append({
      event: 'ALLOW',
      hook: 'BeforeTool',
      tool: toolName,
      decision: 'allow',
      reason: 'L4 auto-approve',
      level_after: mgr.getLevel(),
      score_after: mgr.getScore()
    });
    return { decision: 'allow', systemMessage: 'bkit L4: auto-approve' };
  }

  // L3 (or L4 with score < 80): ask user
  logger.append({
    event: 'ASK',
    hook: 'BeforeTool',
    tool: toolName,
    decision: 'ask',
    reason: `L${level} confirm`,
    level_after: level,
    score_after: score
  });
  return { decision: 'ask', systemMessage: `bkit L${level}: confirm ${toolName} (score=${score})` };
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

    if (result.decision === 'deny') {
      adapter.outputBlock(result.reason);
    } else if (result.systemMessage) {
      adapter.outputAllow(result.systemMessage, 'BeforeTool');
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
    if (!feature || !status.features || !status.features[feature]) return null;

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

/**
 * applyL4Audit — S7 helper for D6 정합성 (Wave 1 Day 2)
 *
 * Mirrors deny/block decisions to .bkit/state/audit/{date}/decisions.jsonl
 * and optionally triggers trust-score downgrade. Graceful: any failure must
 * not block hook execution.
 *
 * @param {'DENY'|'BLOCK'|'ASK'|'ALLOW'} event
 * @param {'allow'|'deny'|'ask'} decision
 * @param {boolean} forceDowngrade  if true and level >= 3, downgrade to L3 with "destructive op" reason
 */
function applyL4Audit(event, decision, toolName, toolInput, reason, projectDir, forceDowngrade) {
  try {
    const TSM = require(path.join(libPath, 'core', 'trust-score'));
    const AL = require(path.join(libPath, 'core', 'audit-log'));
    const mgr = new TSM(projectDir);
    const before = mgr.getLevel();
    if (forceDowngrade && before >= 3) {
      mgr.downgrade(3, 'destructive op detected (D6, hard deny via legacy policy)');
    } else if (event === 'DENY' || event === 'BLOCK') {
      // Record rejection on trust-score (so 5 consecutive rejection downgrade still applies)
      mgr.recordDecision({ type: 'rejection', tool: toolName, timestamp: Date.now(), durationMs: 0 });
    }
    new AL(projectDir).append({
      event,
      hook: 'BeforeTool',
      tool: toolName,
      decision,
      reason,
      command: (toolInput && toolInput.command) ? String(toolInput.command).substring(0, 200) : undefined,
      filePath: (toolInput && toolInput.file_path) || undefined,
      level_before: before,
      level_after: mgr.getLevel(),
      score_after: mgr.getScore()
    });
  } catch (e) {
    // graceful: audit/downgrade failure must not block hook
  }
}

module.exports = { handler, processHook, evaluateAutomation, applyL4Audit };
