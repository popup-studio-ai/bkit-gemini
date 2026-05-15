#!/usr/bin/env node
/**
 * AfterTool Hook - Post-execution Processing
 * Updates PDCA status, tracks changes, and suggests next steps
 * Dual-mode: handler export (v0.31.0+ SDK) + stdin command (legacy)
 */
const fs = require('fs');
const path = require('path');

const libPath = path.resolve(__dirname, '..', '..', 'lib');
const { normalizeSkillName } = require('./utils/skill-normalizer');

// --- Core processing logic ---
function processHook(input) {
  try {
    const toolName = input.tool_name || input.toolName || '';
    const toolInput = input.tool_input || input.toolInput || {};
    const projectDir = input.projectDir || process.cwd();

    // v2.0.4: Inline audit trail (best-effort, no external imports)
    try {
      const auditDir = path.join(projectDir, '.gemini', 'audit');
      if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });
      const today = new Date().toISOString().slice(0, 10);
      const record = JSON.stringify({
        ts: new Date().toISOString(), type: 'tool_call',
        tool: toolName, file: toolInput.file_path || toolInput.path || ''
      });
      fs.appendFileSync(path.join(auditDir, `${today}.jsonl`), record + '\n');
    } catch (_) { /* audit is best-effort */ }

    // S7 v2.0.7-gemini-cli-l4-automation (Wave 1 Day 2):
    // PostToolUse continueOnBlock + JSONL audit + auto-downgrade in L3+
    applyAfterToolAudit(toolName, toolInput, input, projectDir);

    if (['write_file', 'replace'].includes(toolName)) {
      return processPostWrite(toolInput, projectDir);
    } else if (toolName === 'activate_skill') {
      return processPostSkill(toolInput, projectDir);
    }
    return { decision: 'allow' };
  } catch (error) {
    return { decision: 'allow' };
  }
}

/**
 * applyAfterToolAudit — S7 PostToolUse continueOnBlock + JSONL audit + auto-downgrade
 *
 * Only active in L3+ modes (AC-T6 무회귀: L0~L2 동작 무변경).
 * Graceful: any failure must not block hook execution.
 */
function applyAfterToolAudit(toolName, toolInput, hookInput, projectDir) {
  try {
    const TSM = require(path.join(libPath, 'core', 'trust-score'));
    const AL = require(path.join(libPath, 'core', 'audit-log'));
    const mgr = new TSM(projectDir);
    const level = mgr.getLevel();
    if (level < 3) return; // legacy untouched

    const errorMessage = hookInput.tool_error || hookInput.error
      || (hookInput.tool_response && hookInput.tool_response.error)
      || null;
    const success = !errorMessage;
    const durationMs = hookInput.duration_ms || (hookInput.tool_response && hookInput.tool_response.duration_ms) || 0;

    if (!success) {
      mgr.recordDecision({
        type: 'rejection',
        tool: toolName,
        timestamp: Date.now(),
        durationMs,
        rejected: true
      });
    }

    new AL(projectDir).append({
      event: success ? 'ALLOW' : 'DENY',
      hook: 'AfterTool',
      tool: toolName,
      decision: success ? 'allow' : 'deny',
      reason: success ? 'tool completed' : `tool failure: ${errorMessage}`,
      command: (toolInput && toolInput.command) ? String(toolInput.command).substring(0, 200) : undefined,
      filePath: (toolInput && (toolInput.file_path || toolInput.path)) || undefined,
      durationMs,
      success,
      level_after: mgr.getLevel(),
      score_after: mgr.getScore()
    });
  } catch (e) {
    // graceful
  }
}

/**
 * Validate PDCA document against template requirements (FR-36)
 * @param {string} filePath - Path to the document
 * @param {string} projectDir - Project root directory
 * @returns {{ valid: boolean, missing: string[], docType: string|null }}
 */
function validatePdcaDocument(filePath, projectDir) {
  const requiredSections = {
    'plan': ['## 1.', '## 2.', '## 3.'],
    'design': ['## 1.', '## 2.', '## 3.'],
    'analysis': ['Match Rate', 'Gap'],
    'report': ['Executive Summary', 'Result']
  };

  const normalizedPath = filePath.replace(/\\/g, '/');
  let docType = null;
  if (normalizedPath.includes('/01-plan/')) docType = 'plan';
  else if (normalizedPath.includes('/02-design/')) docType = 'design';
  else if (normalizedPath.includes('/03-analysis/')) docType = 'analysis';
  else if (normalizedPath.includes('/04-report/')) docType = 'report';

  if (!docType || !requiredSections[docType]) return { valid: true, missing: [], docType: null };

  try {
    const content = fs.readFileSync(path.resolve(projectDir, filePath), 'utf-8');
    const missing = requiredSections[docType].filter(s => !content.includes(s));
    return { valid: missing.length === 0, missing, docType };
  } catch {
    return { valid: true, missing: [], docType };
  }
}

function processPostWrite(toolInput, projectDir) {
  let filePath = toolInput.file_path || toolInput.path || toolInput.filePath || '';
  
  // Ensure we have a relative path for internal logic
  if (path.isAbsolute(filePath)) {
    filePath = path.relative(projectDir, filePath);
  }
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Template validation for PDCA documents (FR-36)
  if (filePath.includes('/docs/') && filePath.endsWith('.md')) {
    const validation = validatePdcaDocument(filePath, projectDir);
    if (!validation.valid && validation.missing.length > 0) {
      return {
        decision: 'allow',
        systemMessage: `**Template Warning**: ${validation.docType} document may be missing sections: ${validation.missing.join(', ')}`
      };
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const sourceExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java'];
  if (!sourceExts.includes(ext)) return { decision: 'allow' };

  try {
    const pdcaStatusModule = require(path.join(libPath, 'pdca', 'status'));
    const pdcaStatus = pdcaStatusModule.loadPdcaStatus(projectDir);
    const primaryFeature = pdcaStatus.primaryFeature;
    if (!primaryFeature || !pdcaStatus.activeFeatures[primaryFeature]) return { decision: 'allow' };

    const featureStatus = pdcaStatus.activeFeatures[primaryFeature];
    if (featureStatus.phase === 'design' && (normalizedPath.includes('src/') || normalizedPath.includes('lib/'))) {
      const oldPhase = featureStatus.phase;
      featureStatus.phase = 'do';
      featureStatus.updatedAt = new Date().toISOString();
      pdcaStatusModule.savePdcaStatus(pdcaStatus, projectDir);
      return { decision: 'allow', systemMessage: `**PDCA Progress**: Feature "${primaryFeature}" moved to **do** phase. Implementation started.` };
    }

    if (featureStatus.phase === 'do') {
      return { decision: 'allow', systemMessage: `**Reminder**: Feature "${primaryFeature}" is in implementation. Run \`/pdca analyze ${primaryFeature}\` when ready.` };
    }
  } catch (e) { /* ignore */ }
  return { decision: 'allow' };
}

function processPostSkill(toolInput, projectDir) {
  const skillName = toolInput.skill || '';
  const args = toolInput.args || '';
  const contexts = [];

  try {
    const normalized = normalizeSkillName(skillName);
    if (normalized === 'pdca' || normalized.startsWith('pdca')) {
      const parts = args.split(' ');
      const action = parts[0];
      const feature = parts.slice(1).join(' ');

      if (feature) {
        const pdcaStatusModule = require(path.join(libPath, 'pdca', 'status'));
        const pdcaStatus = pdcaStatusModule.loadPdcaStatus(projectDir);

        if (action === 'plan') {
          pdcaStatus.primaryFeature = feature;
          if (!pdcaStatus.activeFeatures[feature]) {
            pdcaStatus.activeFeatures[feature] = { phase: 'plan', createdAt: new Date().toISOString() };
          } else {
            pdcaStatus.activeFeatures[feature].phase = 'plan';
          }
          pdcaStatusModule.savePdcaStatus(pdcaStatus, projectDir);
          contexts.push(`**PDCA Progress**: Plan created for "${feature}". Next: \`/pdca design ${feature}\``);
        } else if (action === 'design') {
          if (pdcaStatus.activeFeatures[feature]) {
            pdcaStatus.activeFeatures[feature].phase = 'design';
            pdcaStatus.activeFeatures[feature].updatedAt = new Date().toISOString();
            pdcaStatusModule.savePdcaStatus(pdcaStatus, projectDir);
          }
          contexts.push(`**PDCA Progress**: Design created for "${feature}". Next: Start implementation, then \`/pdca analyze ${feature}\``);
        } else if (action === 'analyze') {
          contexts.push(`**PDCA Progress**: Gap analysis completed for "${feature}". Check match rate for next steps.`);
        }
      }
    }
  } catch (e) { /* ignore */ }

  if (contexts.length > 0) {
    return { decision: 'allow', systemMessage: contexts.join('\n') };
  }
  return { decision: 'allow' };
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

    if (result.systemMessage) {
      adapter.outputAllow(result.systemMessage, 'AfterTool');
    } else {
      adapter.outputEmpty();
    }
  } catch (error) {
    process.exit(0);
  }
}

if (require.main === module) { main(); }

module.exports = { handler, processHook, applyAfterToolAudit };
