#!/usr/bin/env node
/**
 * phase-transition.js - Pipeline phase transition automation (Gemini CLI Edition)
 *
 * Purpose: Manage transitions between 9-phase Development Pipeline
 * Called by: Phase completion hooks, /development-pipeline next command
 *
 * v1.0.0: Core pipeline automation script for Gemini CLI
 *
 * Usage:
 *   node phase-transition.js [current-phase] [--auto]
 *   node phase-transition.js 4 --auto  # Auto-advance from phase 4 to 5
 */

const fs = require('fs');
const path = require('path');

// Phase definitions with level-specific applicability
const PHASES = {
  1: { name: 'Schema/Terminology', skill: 'phase-1-schema', levels: ['Starter', 'Dynamic', 'Enterprise'] },
  2: { name: 'Coding Conventions', skill: 'phase-2-convention', levels: ['Starter', 'Dynamic', 'Enterprise'] },
  3: { name: 'Mockup/Wireframe', skill: 'phase-3-mockup', levels: ['Starter', 'Dynamic', 'Enterprise'] },
  4: { name: 'API Design', skill: 'phase-4-api', levels: ['Dynamic', 'Enterprise'] },
  5: { name: 'Design System', skill: 'phase-5-design-system', levels: ['Dynamic', 'Enterprise'] },
  6: { name: 'UI Implementation', skill: 'phase-6-ui-integration', levels: ['Starter', 'Dynamic', 'Enterprise'] },
  7: { name: 'SEO & Security', skill: 'phase-7-seo-security', levels: ['Dynamic', 'Enterprise'] },
  8: { name: 'Code Review', skill: 'phase-8-review', levels: ['Dynamic', 'Enterprise'] },
  9: { name: 'Deployment', skill: 'phase-9-deployment', levels: ['Starter', 'Dynamic', 'Enterprise'] }
};

/**
 * Load PDCA status from file
 */
function loadPdcaStatus() {
  const statusPath = path.join(process.cwd(), '.pdca-status.json');
  try {
    if (fs.existsSync(statusPath)) {
      return JSON.parse(fs.readFileSync(statusPath, 'utf8'));
    }
  } catch (error) {
    // Ignore errors
  }
  return {};
}

/**
 * Save PDCA status to file
 */
function savePdcaStatus(status) {
  const statusPath = path.join(process.cwd(), '.pdca-status.json');
  try {
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get next applicable phase for given level
 */
function getNextPhase(currentPhase, level) {
  for (let phase = currentPhase + 1; phase <= 9; phase++) {
    if (PHASES[phase].levels.includes(level)) {
      return phase;
    }
  }
  return null; // All phases complete
}

/**
 * Check if phase can be skipped for given level
 */
function canSkipPhase(phase, level) {
  return !PHASES[phase].levels.includes(level);
}

/**
 * Generate phase status summary
 */
function generatePhaseSummary(status) {
  const level = status?.pipeline?.level || 'Dynamic';
  const currentPhase = status?.pipeline?.currentPhase || 1;

  let summary = 'Pipeline Status:\n';
  summary += `   Level: ${level}\n`;
  summary += `   Current Phase: ${currentPhase}\n\n`;
  summary += '   Phases:\n';

  for (let i = 1; i <= 9; i++) {
    const phase = PHASES[i];
    const isApplicable = phase.levels.includes(level);
    const isComplete = i < currentPhase;
    const isCurrent = i === currentPhase;

    let icon = '[ ]';
    if (!isApplicable) icon = '[-]';
    else if (isComplete) icon = '[x]';
    else if (isCurrent) icon = '[>]';

    summary += `   ${icon} Phase ${i}: ${phase.name}`;
    if (!isApplicable) summary += ' (N/A for this level)';
    summary += '\n';
  }

  return summary;
}

/**
 * Check phase deliverables
 */
function checkPhaseDeliverables(phase) {
  const deliverables = {
    1: ['docs/01-plan/schema.md', 'docs/01-plan/terminology.md'],
    2: ['CONVENTIONS.md'],
    3: ['mockup/'],
    4: ['docs/02-design/api-spec.md'],
    5: ['docs/02-design/design-system.md'],
    6: ['src/components/'],
    7: ['docs/02-design/seo-checklist.md'],
    8: ['docs/03-analysis/'],
    9: ['vercel.json', '.github/workflows/']
  };

  const items = (deliverables[phase] || []).map(item => ({
    name: item,
    exists: fs.existsSync(path.join(process.cwd(), item))
  }));

  return {
    items,
    allComplete: items.length === 0 || items.every(i => i.exists)
  };
}

/**
 * Main transition logic
 */
function handleTransition() {
  const args = process.argv.slice(2);
  const currentPhaseArg = parseInt(args[0]) || null;
  const autoAdvance = args.includes('--auto');

  // Load current status
  const status = loadPdcaStatus();
  const level = status?.pipeline?.level || 'Dynamic';
  const currentPhase = currentPhaseArg || status?.pipeline?.currentPhase || 1;

  // Check current phase deliverables
  const deliverables = checkPhaseDeliverables(currentPhase);

  if (!deliverables.allComplete) {
    const message = `Phase ${currentPhase} (${PHASES[currentPhase].name}) not complete.

Remaining deliverables:
${deliverables.items.filter(i => !i.exists).map(item => `  - ${item.name}`).join('\n')}

Complete these items before transitioning.`;
    console.log(message);
    return;
  }

  // Get next phase
  const nextPhase = getNextPhase(currentPhase, level);

  if (!nextPhase) {
    // All phases complete!
    const message = `All Pipeline Phases Complete!

${generatePhaseSummary(status)}

Your project is ready for deployment!
Run: /phase-9-deployment to finalize

Or generate a completion report:
Run: /pdca report project-complete`;
    console.log(message);
    return;
  }

  // Update status
  if (!status.pipeline) {
    status.pipeline = { level, currentPhase: 1, phaseHistory: [] };
  }

  status.pipeline.currentPhase = nextPhase;
  status.pipeline.phaseHistory = status.pipeline.phaseHistory || [];
  status.pipeline.phaseHistory.push({
    phase: currentPhase,
    completedAt: new Date().toISOString()
  });
  savePdcaStatus(status);

  const message = `Phase ${currentPhase} (${PHASES[currentPhase].name}) -> Complete!

${generatePhaseSummary({ ...status, pipeline: { ...status?.pipeline, currentPhase: nextPhase } })}

Next: Phase ${nextPhase} - ${PHASES[nextPhase].name}
   Run: /${PHASES[nextPhase].skill}

${autoAdvance ? 'Auto-advancing...' : 'Run /development-pipeline next to continue'}`;

  console.log(message);
}

// Execute
handleTransition();
