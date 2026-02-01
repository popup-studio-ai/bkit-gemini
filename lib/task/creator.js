/**
 * Task Creator
 * Creates PDCA-integrated tasks
 */
const { PDCA_PHASES } = require('../pdca/phase');

/**
 * Generate PDCA task subject
 * @param {string} phase
 * @param {string} feature
 * @returns {string}
 */
function generatePdcaTaskSubject(phase, feature) {
  const phaseInfo = PDCA_PHASES[phase];
  const phaseName = phaseInfo ? phaseInfo.name : phase.charAt(0).toUpperCase() + phase.slice(1);

  return `[${phaseName}] ${feature}`;
}

/**
 * Generate PDCA task description
 * @param {string} phase
 * @param {string} feature
 * @param {string} docPath - Path to related document
 * @returns {string}
 */
function generatePdcaTaskDescription(phase, feature, docPath = '') {
  const phaseInfo = PDCA_PHASES[phase];
  const description = phaseInfo ? phaseInfo.description : `${phase} phase`;

  let desc = `PDCA ${phase} phase for feature: ${feature}\n\n`;
  desc += `Objective: ${description}`;

  if (docPath) {
    desc += `\n\nRelated document: ${docPath}`;
  }

  return desc;
}

/**
 * Get PDCA task metadata
 * @param {string} phase
 * @param {string} feature
 * @param {object} options
 * @returns {object}
 */
function getPdcaTaskMetadata(phase, feature, options = {}) {
  return {
    pdca: true,
    phase,
    feature,
    createdAt: new Date().toISOString(),
    ...options
  };
}

/**
 * Generate task guidance for phase
 * @param {string} phase
 * @param {string} feature
 * @returns {string}
 */
function generateTaskGuidance(phase, feature) {
  const guidance = {
    plan: `Create a plan document for "${feature}". Define goals, scope, and success criteria.`,
    design: `Create a design document for "${feature}". Specify architecture, data models, and API contracts.`,
    do: `Implement "${feature}" according to the design document.`,
    check: `Run gap analysis for "${feature}". Compare implementation against design.`,
    act: `Iterate on "${feature}" to achieve >= 90% match rate.`,
    report: `Generate completion report for "${feature}".`
  };

  return guidance[phase] || `Complete ${phase} phase for "${feature}".`;
}

/**
 * Create PDCA task chain for feature
 * @param {string} feature
 * @param {'Starter'|'Dynamic'|'Enterprise'} level
 * @returns {Array<{subject: string, description: string, blockedBy: string[]}>}
 */
function createPdcaTaskChain(feature, level = 'Dynamic') {
  const phases = ['plan', 'design', 'do', 'check'];

  // Add optional phases based on level
  if (level === 'Enterprise' || level === 'Dynamic') {
    phases.push('act', 'report');
  }

  const tasks = [];
  let previousSubject = null;

  for (const phase of phases) {
    const subject = generatePdcaTaskSubject(phase, feature);
    const description = generatePdcaTaskDescription(phase, feature);

    tasks.push({
      subject,
      description,
      blockedBy: previousSubject ? [previousSubject] : [],
      metadata: getPdcaTaskMetadata(phase, feature)
    });

    previousSubject = subject;
  }

  return tasks;
}

/**
 * Create task from auto-trigger
 * @param {{phase: string, feature: string, command: string}} trigger
 * @returns {{subject: string, description: string}}
 */
function autoCreatePdcaTask(trigger) {
  return {
    subject: generatePdcaTaskSubject(trigger.phase, trigger.feature),
    description: generatePdcaTaskDescription(trigger.phase, trigger.feature),
    metadata: getPdcaTaskMetadata(trigger.phase, trigger.feature, {
      autoCreated: true,
      command: trigger.command
    })
  };
}

module.exports = {
  generatePdcaTaskSubject,
  generatePdcaTaskDescription,
  getPdcaTaskMetadata,
  generateTaskGuidance,
  createPdcaTaskChain,
  autoCreatePdcaTask
};
