#!/usr/bin/env node
/**
 * AfterAgent Hook - Agent Completion Handler
 * Handles cleanup and phase transitions after agent/skill completion
 * Dual-mode: handler export (v0.31.0+ SDK) + stdin command (legacy)
 *
 * v0.35.0 compat: #18514 BeforeAgent event structure, #20439 AfterAgent stability
 */
const fs = require('fs');
const path = require('path');

const libPath = path.resolve(__dirname, '..', '..', 'lib');

// Agent handler registry
const AGENT_HANDLERS = {
  'gap-detector': handleGapDetectorComplete,
  'pdca-iterator': handleIteratorComplete,
  'code-analyzer': handleAnalyzerComplete,
  'qa-monitor': handleQaComplete,
  'report-generator': handleReportComplete
};

// Skill handler registry
const SKILL_HANDLERS = {
  'pdca': handlePdcaSkillComplete,
  'code-review': handleCodeReviewComplete,
  'phase-8-review': handlePhase8Complete
};

// Loop guard: prevent AfterAgent from triggering itself infinitely (WS-07, Issue #20426)
const LOOP_GUARD_KEY = '__BKIT_AFTER_AGENT_DEPTH';
const MAX_REENTRY = 3;

// SDK function-mode loop guard (process.env not shared across SDK calls)
let _sdkCallDepth = 0;

/**
 * Normalize event input across v0.34.0 and v0.35.0 event structures.
 * v0.35.0 #20439: event fields may be nested under `data` or `result`.
 * v0.35.0 #18514: field names may differ (agent_name vs agent, etc.)
 */
function normalizeInput(input) {
  if (!input || typeof input !== 'object') return { agent_name: null, skill_name: null, tool_input: null, context: '', _raw: input };

  // v0.35.0: unwrap nested data/result envelope if present
  const base = input.data || input.result || input;

  return {
    agent_name: base.agent_name || base.agent || input.agent_name || input.agent || null,
    skill_name: base.skill_name || base.skill || input.skill_name || input.skill || null,
    tool_input: base.tool_input || input.tool_input || null,
    context: base.context || base.output || input.context || input.output || '',
    // Preserve original for handler access
    _raw: input
  };
}

// --- Helper to build allow result ---
function _allowMsg(message) {
  return { status: 'allow', message, hookEvent: 'AfterAgent' };
}

function _getProjectDir() {
  try {
    const { getAdapter } = require(path.join(libPath, 'gemini', 'platform'));
    return getAdapter().getProjectDir();
  } catch (e) {
    return process.env.GEMINI_PROJECT_DIR || process.cwd();
  }
}

// --- Core processing logic (shared by SDK + command mode) ---
function processHook(normalized) {
  const activeAgent = normalized.agent_name;
  const activeSkill = normalized.skill_name ||
    (normalized.tool_input?.skill || null);

  if (activeAgent && AGENT_HANDLERS[activeAgent]) {
    try {
      return AGENT_HANDLERS[activeAgent](normalized) || { status: 'allow' };
    } catch (e) {
      return { status: 'allow' };
    }
  }

  if (activeSkill && SKILL_HANDLERS[activeSkill]) {
    try {
      return SKILL_HANDLERS[activeSkill](normalized) || { status: 'allow' };
    } catch (e) {
      return { status: 'allow' };
    }
  }

  return { status: 'allow' };
}

// --- RuntimeHook function export (v0.31.0+ SDK) ---
async function handler(event) {
  // SDK-mode loop guard
  if (_sdkCallDepth >= MAX_REENTRY) {
    return { status: 'allow' };
  }
  _sdkCallDepth++;

  try {
    return processHook(normalizeInput(event));
  } catch (e) {
    return { status: 'allow' };
  } finally {
    _sdkCallDepth = Math.max(0, _sdkCallDepth - 1);
  }
}

// --- Legacy command mode ---
function main() {
  const depth = parseInt(process.env[LOOP_GUARD_KEY] || '0');
  if (depth >= MAX_REENTRY) {
    try {
      const { getAdapter } = require(path.join(libPath, 'gemini', 'platform'));
      getAdapter().outputEmpty();
    } catch (e) {
      process.exit(0);
    }
    return;
  }
  process.env[LOOP_GUARD_KEY] = String(depth + 1);

  try {
    const { getAdapter } = require(path.join(libPath, 'gemini', 'platform'));
    const adapter = getAdapter();

    // Read input and normalize for v0.35.0 compat
    const input = adapter.readHookInput();
    const normalized = normalizeInput(input);
    const result = processHook(normalized);

    if (result.message) {
      adapter.outputAllow(result.message, result.hookEvent || 'AfterAgent');
    } else {
      adapter.outputEmpty();
    }

  } catch (error) {
    process.exit(0);
  } finally {
    process.env[LOOP_GUARD_KEY] = String(Math.max(0, depth));
  }
}

// --- Handler functions (return result objects for dual-mode compat) ---

function handleGapDetectorComplete(normalized) {
  const projectDir = _getProjectDir();

  try {
    const pdcaStatusModule = require(path.join(libPath, 'pdca', 'status'));
    const pdcaStatusPath = pdcaStatusModule.getPdcaStatusPath(projectDir);
    if (!fs.existsSync(pdcaStatusPath)) return { status: 'allow' };

    const pdcaStatus = pdcaStatusModule.loadPdcaStatus(projectDir);
    const primaryFeature = pdcaStatus.primaryFeature;
    if (!primaryFeature) return { status: 'allow' };

    // Try to extract match rate from context
    const context = normalized.context || '';
    const matchRateMatch = context.match(/(?:Match Rate|매치율|一致率)[^\d]*(\d+)/i);
    const matchRate = matchRateMatch ? parseInt(matchRateMatch[1]) : null;

    if (matchRate !== null) {
      pdcaStatus.features[primaryFeature].phase = 'check';
      pdcaStatus.features[primaryFeature].matchRate = matchRate;
      pdcaStatus.features[primaryFeature].updatedAt = new Date().toISOString();
      pdcaStatus.lastUpdated = new Date().toISOString();

      pdcaStatus.history.push({
        timestamp: new Date().toISOString(),
        action: 'gap_analysis_complete',
        feature: primaryFeature,
        details: `Match rate: ${matchRate}%`
      });

      pdcaStatusModule.savePdcaStatus(pdcaStatus, projectDir);

      if (matchRate >= 90) {
        return _allowMsg(`**Gap Analysis Complete**: Match rate ${matchRate}% (>=90%). Run \`/pdca report ${primaryFeature}\` to generate completion report.`);
      } else {
        return _allowMsg(`**Gap Analysis Complete**: Match rate ${matchRate}% (<90%). Run \`/pdca iterate ${primaryFeature}\` for auto-improvement.`);
      }
    }
  } catch (e) {
    // Ignore errors
  }

  return { status: 'allow' };
}

function handleIteratorComplete(normalized) {
  const projectDir = _getProjectDir();

  try {
    const pdcaStatusModule = require(path.join(libPath, 'pdca', 'status'));
    const pdcaStatusPath = pdcaStatusModule.getPdcaStatusPath(projectDir);
    if (!fs.existsSync(pdcaStatusPath)) return { status: 'allow' };

    const pdcaStatus = pdcaStatusModule.loadPdcaStatus(projectDir);
    const primaryFeature = pdcaStatus.primaryFeature;
    if (!primaryFeature) return { status: 'allow' };

    const featureStatus = pdcaStatus.features[primaryFeature];
    featureStatus.iterationCount = (featureStatus.iterationCount || 0) + 1;
    featureStatus.phase = 'act';
    featureStatus.updatedAt = new Date().toISOString();
    pdcaStatus.lastUpdated = new Date().toISOString();

    pdcaStatus.history.push({
      timestamp: new Date().toISOString(),
      action: 'iteration_complete',
      feature: primaryFeature,
      details: `Iteration ${featureStatus.iterationCount} completed`
    });

    pdcaStatusModule.savePdcaStatus(pdcaStatus, projectDir);

    if (featureStatus.iterationCount >= 5) {
      return _allowMsg(`**Iteration Limit Reached**: Max iterations (5) reached for "${primaryFeature}". Consider manual review or \`/pdca report ${primaryFeature}\`.`);
    } else {
      return _allowMsg(`**Iteration ${featureStatus.iterationCount} Complete**: Run \`/pdca analyze ${primaryFeature}\` to verify improvements.`);
    }
  } catch (e) {
    return { status: 'allow' };
  }
}

function handleAnalyzerComplete() {
  return _allowMsg('**Code Analysis Complete**: Review the findings and address any critical issues.');
}

function handleQaComplete() {
  return _allowMsg('**QA Monitoring Complete**: Check the log analysis results for any issues.');
}

function handleReportComplete(normalized) {
  const projectDir = _getProjectDir();

  try {
    const pdcaStatusModule = require(path.join(libPath, 'pdca', 'status'));
    const pdcaStatusPath = pdcaStatusModule.getPdcaStatusPath(projectDir);
    if (fs.existsSync(pdcaStatusPath)) {
      const pdcaStatus = pdcaStatusModule.loadPdcaStatus(projectDir);
      const primaryFeature = pdcaStatus.primaryFeature;

      if (primaryFeature && pdcaStatus.features[primaryFeature]) {
        pdcaStatus.features[primaryFeature].phase = 'completed';
        pdcaStatus.features[primaryFeature].updatedAt = new Date().toISOString();
        pdcaStatus.lastUpdated = new Date().toISOString();

        pdcaStatus.history.push({
          timestamp: new Date().toISOString(),
          action: 'report_complete',
          feature: primaryFeature,
          details: 'PDCA cycle completed'
        });

        pdcaStatusModule.savePdcaStatus(pdcaStatus, projectDir);

        return _allowMsg(`**PDCA Complete**: Feature "${primaryFeature}" development cycle completed. Consider \`/pdca archive ${primaryFeature}\` to archive documents.`);
      }
    }
  } catch (e) {
    // Ignore errors
  }

  return _allowMsg('**Report Complete**: PDCA completion report generated.');
}

function handlePdcaSkillComplete() {
  return _allowMsg('**PDCA Skill Complete**: Check /pdca status for current progress.');
}

function handleCodeReviewComplete() {
  return _allowMsg('**Code Review Complete**: Address any findings in the review report.');
}

function handlePhase8Complete() {
  return _allowMsg('**Phase 8 Review Complete**: Ready for deployment phase.');
}

// --- Entry point ---
if (require.main === module) { main(); }

module.exports = { handler };
