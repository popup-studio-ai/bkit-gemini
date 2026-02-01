/**
 * PDCA Automation
 * Handles automatic phase progression and iteration control
 */
const status = require('./status');
const phase = require('./phase');
const level = require('./level');

/**
 * Get automation level
 * @returns {'manual'|'semi-auto'|'full-auto'}
 */
function getAutomationLevel() {
  const envLevel = process.env.BKIT_PDCA_AUTOMATION;

  if (envLevel && ['manual', 'semi-auto', 'full-auto'].includes(envLevel)) {
    return envLevel;
  }

  // Default based on detected level
  const projectLevel = level.detectLevel();

  switch (projectLevel) {
    case 'Enterprise':
      return 'semi-auto';
    case 'Dynamic':
      return 'semi-auto';
    default:
      return 'manual';
  }
}

/**
 * Check if full auto mode is enabled
 * @returns {boolean}
 */
function isFullAutoMode() {
  return getAutomationLevel() === 'full-auto';
}

/**
 * Check if should auto-advance to next phase
 * @param {string} currentPhase
 * @returns {boolean}
 */
function shouldAutoAdvance(currentPhase) {
  const automation = getAutomationLevel();

  if (automation === 'manual') return false;
  if (automation === 'full-auto') return true;

  // Semi-auto: only advance for non-critical phases
  const autoAdvancePhases = ['plan', 'design'];
  return autoAdvancePhases.includes(currentPhase);
}

/**
 * Generate auto-trigger for next phase
 * @param {string} currentPhase
 * @param {object} context
 * @returns {object|null}
 */
function generateAutoTrigger(currentPhase, context = {}) {
  const nextPhase = phase.getNextPdcaPhase(currentPhase);

  if (!nextPhase) return null;

  const feature = context.feature || status.getPdcaStatusFull()?.primaryFeature;

  if (!feature) return null;

  return {
    phase: nextPhase,
    feature,
    command: `/pdca ${nextPhase} ${feature}`,
    message: `Auto-advancing to ${nextPhase} phase for feature "${feature}"`
  };
}

/**
 * Check if should auto-start PDCA
 * @returns {boolean}
 */
function shouldAutoStartPdca() {
  return getAutomationLevel() !== 'manual';
}

/**
 * Auto-advance PDCA phase
 * @param {string} feature
 * @param {object} options
 * @returns {{success: boolean, newPhase: string, message: string}}
 */
function autoAdvancePdcaPhase(feature, options = {}) {
  const pdcaStatus = status.loadPdcaStatus(options.projectDir);
  const featureStatus = pdcaStatus.features[feature];

  if (!featureStatus) {
    return {
      success: false,
      newPhase: null,
      message: `Feature "${feature}" not found in PDCA status`
    };
  }

  const currentPhase = featureStatus.phase;
  const nextPhase = phase.getNextPdcaPhase(currentPhase);

  if (!nextPhase) {
    return {
      success: false,
      newPhase: currentPhase,
      message: `No next phase after ${currentPhase}`
    };
  }

  // Validate transition
  const validation = phase.validatePdcaTransition(
    feature,
    currentPhase,
    nextPhase,
    options.projectDir
  );

  if (!validation.valid) {
    return {
      success: false,
      newPhase: currentPhase,
      message: validation.reason
    };
  }

  // Update status
  status.updatePdcaStatus(feature, { phase: nextPhase }, options.projectDir);
  status.addPdcaHistory({
    action: 'auto_advance',
    feature,
    details: `Auto-advanced from ${currentPhase} to ${nextPhase}`
  }, options.projectDir);

  return {
    success: true,
    newPhase: nextPhase,
    message: `Advanced to ${nextPhase} phase`
  };
}

/**
 * Get hook context for automation
 * @returns {object}
 */
function getHookContext() {
  const pdcaStatus = status.getPdcaStatusFull();

  return {
    primaryFeature: pdcaStatus.primaryFeature,
    currentPhase: pdcaStatus.primaryFeature
      ? pdcaStatus.features[pdcaStatus.primaryFeature]?.phase
      : null,
    automationLevel: getAutomationLevel(),
    projectLevel: level.detectLevel()
  };
}

/**
 * Emit user prompt for confirmation
 * @param {string} question
 * @param {object} options
 * @returns {string}
 */
function emitUserPrompt(question, options = {}) {
  // Format for AskUserQuestion tool
  return formatAskUserQuestion(question, options);
}

/**
 * Format question for AskUserQuestion tool
 * @param {string} question
 * @param {object} options
 * @returns {string}
 */
function formatAskUserQuestion(question, options = {}) {
  const formatted = {
    question,
    header: options.header || 'PDCA Action',
    options: options.options || [
      { label: 'Yes', description: 'Proceed with the action' },
      { label: 'No', description: 'Cancel the action' }
    ]
  };

  return JSON.stringify(formatted);
}

module.exports = {
  getAutomationLevel,
  isFullAutoMode,
  shouldAutoAdvance,
  generateAutoTrigger,
  shouldAutoStartPdca,
  autoAdvancePdcaPhase,
  getHookContext,
  emitUserPrompt,
  formatAskUserQuestion
};
