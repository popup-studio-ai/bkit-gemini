#!/usr/bin/env node
/**
 * BeforeModel Hook - Prompt Optimization & Model Selection
 * Injects PDCA phase-specific context and optimizes prompts before model processing
 * Dual-mode: handler export (v0.31.0+ SDK) + stdin command (legacy)
 */
const fs = require('fs');
const path = require('path');

const libPath = path.resolve(__dirname, '..', '..', 'lib');

// --- Model Routing Hints (v2.0.0) ---
const MODEL_ROUTING = Object.freeze({
  plan:   { preferredModel: 'pro', reason: 'Deep reasoning for requirements analysis' },
  design: { preferredModel: 'pro', reason: 'Architecture analysis needs thorough evaluation' },
  do:     { preferredModel: 'pro', reason: 'Code generation requires accuracy' },
  check:  { preferredModel: 'flash', reason: 'Comparison/verification is speed-optimized' },
  act:    { preferredModel: 'flash', reason: 'Iterative fixes benefit from fast response' },
  report: { preferredModel: 'flash', reason: 'Document generation is speed-optimized' }
});

function getModelRoutingHint(phase) {
  const routing = MODEL_ROUTING[phase];
  if (!routing) return null;
  return `[Model Routing: ${routing.preferredModel}] ${routing.reason}`;
}

// --- Context Anchoring (v2.0.0) ---
function extractDocumentAnchors(projectDir, phase) {
  const MAX_ANCHOR_CHARS = 2000;

  try {
    const statusPath = path.join(projectDir, '.pdca-status.json');
    if (!fs.existsSync(statusPath)) return null;

    const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
    const feature = status.primaryFeature;
    if (!feature) return null;

    // Determine which document to anchor based on phase
    const PHASE_ANCHOR_DOCS = {
      design: ['01-plan'],
      do:     ['02-design'],
      check:  ['02-design', '01-plan'],
      act:    ['03-analysis']
    };

    const docDirs = PHASE_ANCHOR_DOCS[phase];
    if (!docDirs) return null;

    const anchors = [];
    for (const dir of docDirs) {
      const docPath = path.join(projectDir, 'docs', dir, 'features', `${feature}.${dir.split('-')[1]}.md`);
      if (!fs.existsSync(docPath)) continue;

      try {
        let content = fs.readFileSync(docPath, 'utf-8');
        // Extract Executive Summary section only
        const execMatch = content.match(/## Executive Summary[\s\S]*?(?=\n## [^#]|\n---|\Z)/);
        if (execMatch) {
          const excerpt = execMatch[0].substring(0, 800);
          anchors.push(`### Context Anchor (${dir}):\n${excerpt}`);
        }
      } catch (e) { /* non-fatal */ }
    }

    if (anchors.length === 0) return null;

    let result = `## Context Anchor (auto-injected)\n\n${anchors.join('\n\n')}`;
    if (result.length > MAX_ANCHOR_CHARS) {
      result = result.substring(0, MAX_ANCHOR_CHARS) + '\n\n[...truncated]';
    }
    return result;
  } catch (e) {
    return null;
  }
}

// --- Core processing logic ---
function processHook(input) {
  try {
    const prompt = input.prompt || input.user_message || '';
    if (!prompt || prompt.length < 3) {
      return { status: 'allow' };
    }

    const projectDir = input.projectDir || process.cwd();
    const contexts = [];

    const pdcaPhase = getCurrentPdcaPhase(projectDir);
    if (pdcaPhase) {
      const phaseContext = getPhaseContext(pdcaPhase);
      if (phaseContext) {
        contexts.push(phaseContext);
      }

      // v2.0.0: Model Routing Hint
      const routingHint = getModelRoutingHint(pdcaPhase);
      if (routingHint) {
        contexts.push(routingHint);
      }

      // v2.0.0: Context Anchoring
      const anchorContext = extractDocumentAnchors(projectDir, pdcaPhase);
      if (anchorContext) {
        contexts.push(anchorContext);
      }
    }

    if (contexts.length > 0) {
      return { status: 'allow', additionalContext: contexts.join('\n\n'), hookEvent: 'BeforeModel' };
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

    if (result.additionalContext) {
      console.log(JSON.stringify(result));
      process.exit(0);
    } else {
      adapter.outputEmpty();
    }
  } catch (error) {
    process.exit(0);
  }
}

/**
 * Get current PDCA phase from status file
 */
function getCurrentPdcaPhase(projectDir) {
  try {
    const statusPath = path.join(projectDir, 'docs', '.pdca-status.json');
    if (!fs.existsSync(statusPath)) return null;

    const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
    const feature = status.primaryFeature;
    if (!feature || !status.features[feature]) return null;

    return status.features[feature].phase;
  } catch (e) {
    return null;
  }
}

/**
 * Get phase-specific context for prompt enhancement
 */
function getPhaseContext(phase) {
  const phaseContexts = {
    plan: [
      '**Current PDCA Phase: Plan**',
      'Guidelines for Plan phase:',
      '- Focus on requirements gathering and analysis',
      '- Use the plan template from templates/plan.template.md',
      '- Include scope, requirements, risks, and success criteria',
      '- Do NOT write implementation code in this phase'
    ].join('\n'),

    design: [
      '**Current PDCA Phase: Design**',
      'Guidelines for Design phase:',
      '- Create detailed technical design based on the Plan',
      '- Use the design template from templates/design.template.md',
      '- Include architecture, data model, API specs, and implementation order',
      '- Reference existing code patterns and conventions',
      '- Do NOT write implementation code in this phase'
    ].join('\n'),

    do: [
      '**Current PDCA Phase: Do (Implementation)**',
      'Guidelines for Implementation phase:',
      '- Follow the Design document specifications',
      '- Write clean, well-structured code',
      '- Follow existing code patterns and conventions',
      '- After implementation, suggest running /pdca analyze'
    ].join('\n'),

    check: [
      '**Current PDCA Phase: Check (Analysis)**',
      'Guidelines for Check phase:',
      '- Compare implementation against Design document',
      '- Calculate match rate for each requirement',
      '- Identify gaps and missing implementations',
      '- If match rate < 90%, suggest /pdca iterate'
    ].join('\n'),

    act: [
      '**Current PDCA Phase: Act (Improvement)**',
      'Guidelines for Act phase:',
      '- Fix gaps identified in the Check phase',
      '- Re-run gap analysis after each fix cycle',
      '- Maximum 5 iterations per session',
      '- When match rate >= 90%, suggest /pdca report'
    ].join('\n')
  };

  return phaseContexts[phase] || null;
}

if (require.main === module) { main(); }

module.exports = { handler };
