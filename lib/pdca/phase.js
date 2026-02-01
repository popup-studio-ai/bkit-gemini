/**
 * PDCA Phase Management
 * Manages phase transitions and deliverable verification
 */
const fs = require('fs');
const path = require('path');

/**
 * PDCA phase definitions
 */
const PDCA_PHASES = {
  plan: { order: 1, name: 'Plan', description: 'Create plan document' },
  design: { order: 2, name: 'Design', description: 'Create design specification' },
  do: { order: 3, name: 'Do', description: 'Implement the feature' },
  check: { order: 4, name: 'Check', description: 'Gap analysis and verification' },
  act: { order: 5, name: 'Act', description: 'Iterate and improve' },
  report: { order: 6, name: 'Report', description: 'Generate completion report' },
  archived: { order: 7, name: 'Archived', description: 'Archived and completed' }
};

/**
 * Phase order list
 */
const PHASE_ORDER = ['plan', 'design', 'do', 'check', 'act', 'report', 'archived'];

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
 * Get phase order number
 * @param {string} phase
 * @returns {number}
 */
function getPhaseNumber(phase) {
  return PDCA_PHASES[phase]?.order || 0;
}

/**
 * Get phase name from order number
 * @param {number} phaseNumber
 * @returns {string|null}
 */
function getPhaseName(phaseNumber) {
  for (const [name, info] of Object.entries(PDCA_PHASES)) {
    if (info.order === phaseNumber) {
      return name;
    }
  }
  return null;
}

/**
 * Get previous PDCA phase
 * @param {string} currentPhase
 * @returns {string|null}
 */
function getPreviousPdcaPhase(currentPhase) {
  const index = PHASE_ORDER.indexOf(currentPhase);
  if (index <= 0) return null;
  return PHASE_ORDER[index - 1];
}

/**
 * Get next PDCA phase
 * @param {string} currentPhase
 * @returns {string|null}
 */
function getNextPdcaPhase(currentPhase) {
  const index = PHASE_ORDER.indexOf(currentPhase);
  if (index === -1 || index >= PHASE_ORDER.length - 1) return null;
  return PHASE_ORDER[index + 1];
}

/**
 * Find design document for a feature
 * @param {string} feature
 * @param {string} projectDir - Optional project directory
 * @returns {string}
 */
function findDesignDoc(feature, projectDir) {
  const dir = projectDir || getProjectDir();

  const searchPaths = [
    `docs/02-design/features/${feature}.design.md`,
    `docs/02-design/${feature}.design.md`,
    `docs/design/${feature}.md`,
    `design/${feature}.md`
  ];

  for (const searchPath of searchPaths) {
    const fullPath = path.join(dir, searchPath);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return '';
}

/**
 * Find plan document for a feature
 * @param {string} feature
 * @param {string} projectDir - Optional project directory
 * @returns {string}
 */
function findPlanDoc(feature, projectDir) {
  const dir = projectDir || getProjectDir();

  const searchPaths = [
    `docs/01-plan/features/${feature}.plan.md`,
    `docs/01-plan/${feature}.plan.md`,
    `docs/plan/${feature}.md`,
    `plan/${feature}.md`
  ];

  for (const searchPath of searchPaths) {
    const fullPath = path.join(dir, searchPath);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return '';
}

/**
 * Check phase deliverables exist
 * @param {string} phase
 * @param {string} feature
 * @param {string} projectDir - Optional project directory
 * @returns {{exists: boolean, path: string}}
 */
function checkPhaseDeliverables(phase, feature, projectDir) {
  const dir = projectDir || getProjectDir();

  const deliverablePaths = {
    plan: `docs/01-plan/features/${feature}.plan.md`,
    design: `docs/02-design/features/${feature}.design.md`,
    check: `docs/03-analysis/${feature}.analysis.md`,
    report: `docs/04-report/${feature}.report.md`
  };

  const deliverablePath = deliverablePaths[phase];
  if (!deliverablePath) {
    return { exists: true, path: '' }; // do, act phases don't have specific deliverables
  }

  const fullPath = path.join(dir, deliverablePath);
  return {
    exists: fs.existsSync(fullPath),
    path: fullPath
  };
}

/**
 * Validate PDCA phase transition
 * @param {string} feature
 * @param {string} fromPhase
 * @param {string} toPhase
 * @param {string} projectDir - Optional project directory
 * @returns {{valid: boolean, reason: string}}
 */
function validatePdcaTransition(feature, fromPhase, toPhase, projectDir) {
  const fromOrder = getPhaseNumber(fromPhase);
  const toOrder = getPhaseNumber(toPhase);

  // Check forward progression
  if (toOrder <= fromOrder && toPhase !== 'check') {
    // Allow going back to check for re-analysis
    return { valid: false, reason: `Cannot move backward from ${fromPhase} to ${toPhase}` };
  }

  // Check prerequisites
  if (toPhase === 'design') {
    const planDoc = findPlanDoc(feature, projectDir);
    if (!planDoc) {
      return { valid: false, reason: 'Plan document required before Design phase' };
    }
  }

  if (toPhase === 'do') {
    const designDoc = findDesignDoc(feature, projectDir);
    if (!designDoc) {
      return { valid: false, reason: 'Design document required before Do phase' };
    }
  }

  return { valid: true, reason: '' };
}

module.exports = {
  PDCA_PHASES,
  PHASE_ORDER,
  getPhaseNumber,
  getPhaseName,
  getPreviousPdcaPhase,
  getNextPdcaPhase,
  findDesignDoc,
  findPlanDoc,
  checkPhaseDeliverables,
  validatePdcaTransition
};
