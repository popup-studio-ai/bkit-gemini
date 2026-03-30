#!/usr/bin/env node
/**
 * AfterTool Hook - Post-execution Processing
 * Updates PDCA status, tracks changes, and suggests next steps
 * Dual-mode: handler export (v0.31.0+ SDK) + stdin command (legacy)
 */
const fs = require('fs');
const path = require('path');

const libPath = path.resolve(__dirname, '..', '..', 'lib');

// --- Core processing logic ---
function processHook(input) {
  try {
    const toolName = input.tool_name || input.toolName || '';
    const toolInput = input.tool_input || input.toolInput || {};
    const projectDir = input.projectDir || process.cwd();

    if (['write_file', 'replace'].includes(toolName)) {
      return processPostWrite(toolInput, projectDir);
    } else if (toolName === 'activate_skill') {
      return processPostSkill(toolInput, projectDir);
    }
    return { status: 'allow' };
  } catch (error) {
    return { status: 'allow' };
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
        status: 'allow',
        message: `**Template Warning**: ${validation.docType} document may be missing sections: ${validation.missing.join(', ')}`,
        hookEvent: 'AfterTool'
      };
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const sourceExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java'];
  if (!sourceExts.includes(ext)) return { status: 'allow' };

  try {
    const pdcaStatusModule = require(path.join(libPath, 'pdca', 'status'));
    const pdcaStatus = pdcaStatusModule.loadPdcaStatus(projectDir);
    const primaryFeature = pdcaStatus.primaryFeature;
    if (!primaryFeature || !pdcaStatus.features[primaryFeature]) return { status: 'allow' };

    const featureStatus = pdcaStatus.features[primaryFeature];
    if (featureStatus.phase === 'design' && (normalizedPath.includes('src/') || normalizedPath.includes('lib/'))) {
      const oldPhase = featureStatus.phase;
      featureStatus.phase = 'do';
      featureStatus.updatedAt = new Date().toISOString();
      pdcaStatusModule.savePdcaStatus(pdcaStatus, projectDir);
      return { status: 'allow', message: `**PDCA Progress**: Feature "${primaryFeature}" moved to **do** phase. Implementation started.`, hookEvent: 'AfterTool' };
    }

    if (featureStatus.phase === 'do') {
      return { status: 'allow', message: `**Reminder**: Feature "${primaryFeature}" is in implementation. Run \`/pdca analyze ${primaryFeature}\` when ready.`, hookEvent: 'AfterTool' };
    }
  } catch (e) { /* ignore */ }
  return { status: 'allow' };
}

function processPostSkill(toolInput, projectDir) {
  const skillName = toolInput.skill || '';
  const args = toolInput.args || '';
  const contexts = [];

  try {
    if (skillName === 'pdca' || skillName.startsWith('bkit:pdca')) {
      const action = args.split(' ')[0];
      const feature = args.split(' ').slice(1).join(' ');

      if (feature) {
        const pdcaStatusModule = require(path.join(libPath, 'pdca', 'status'));
        const pdcaStatus = pdcaStatusModule.loadPdcaStatus(projectDir);

        if (action === 'plan') {
          pdcaStatus.primaryFeature = feature;
          if (!pdcaStatus.activeFeatures.includes(feature)) pdcaStatus.activeFeatures.push(feature);
          if (!pdcaStatus.features[feature]) {
            pdcaStatus.features[feature] = { phase: 'plan', createdAt: new Date().toISOString() };
          } else {
            pdcaStatus.features[feature].phase = 'plan';
          }
          pdcaStatusModule.savePdcaStatus(pdcaStatus, projectDir);
          contexts.push(`**PDCA Progress**: Plan created for "${feature}". Next: \`/pdca design ${feature}\``);
        } else if (action === 'design') {
          if (pdcaStatus.features[feature]) {
            pdcaStatus.features[feature].phase = 'design';
            pdcaStatus.features[feature].updatedAt = new Date().toISOString();
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
    return { status: 'allow', message: contexts.join('\n'), hookEvent: 'AfterTool' };
  }
  return { status: 'allow' };
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

    if (result.message) {
      adapter.outputAllow(result.message, result.hookEvent || 'AfterTool');
    } else {
      adapter.outputEmpty();
    }
  } catch (error) {
    process.exit(0);
  }
}

if (require.main === module) { main(); }

module.exports = { handler };
