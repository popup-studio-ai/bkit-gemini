#!/usr/bin/env node
/**
 * BeforeModel Hook - Prompt Optimization & Model Selection
 * Injects PDCA phase-specific context and optimizes prompts before model processing
 * Dual-mode: handler export (v0.31.0+ SDK) + stdin command (legacy)
 */
const fs = require('fs');
const path = require('path');

const libPath = path.resolve(__dirname, '..', '..', 'lib');

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
    const { getAdapter } = require(path.join(libPath, 'adapters'));
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
