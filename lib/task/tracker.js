/**
 * Task Tracker
 * Tracks PDCA task status and manages task chains
 */
const fs = require('fs');
const path = require('path');

// In-memory task ID mapping
const _taskIdMap = new Map();

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
 * Save PDCA task ID mapping
 * @param {string} taskId
 * @param {string} phase
 * @param {string} feature
 */
function savePdcaTaskId(taskId, phase, feature) {
  const key = `${feature}:${phase}`;
  _taskIdMap.set(key, taskId);

  // Persist to file
  try {
    const mapPath = path.join(getProjectDir(), 'docs', '.pdca-tasks.json');
    let data = {};

    if (fs.existsSync(mapPath)) {
      data = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
    }

    if (!data[feature]) {
      data[feature] = {};
    }

    data[feature][phase] = taskId;
    data._lastUpdated = new Date().toISOString();

    const dir = path.dirname(mapPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(mapPath, JSON.stringify(data, null, 2));
  } catch {
    // Ignore persistence errors
  }
}

/**
 * Get PDCA task ID
 * @param {string} phase
 * @param {string} feature
 * @returns {string|null}
 */
function getPdcaTaskId(phase, feature) {
  const key = `${feature}:${phase}`;

  // Check memory first
  if (_taskIdMap.has(key)) {
    return _taskIdMap.get(key);
  }

  // Load from file
  try {
    const mapPath = path.join(getProjectDir(), 'docs', '.pdca-tasks.json');

    if (fs.existsSync(mapPath)) {
      const data = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
      return data[feature]?.[phase] || null;
    }
  } catch {
    // Ignore read errors
  }

  return null;
}

/**
 * Get task chain status for feature
 * @param {string} feature
 * @returns {object}
 */
function getTaskChainStatus(feature) {
  const phases = ['plan', 'design', 'do', 'check', 'act', 'report'];
  const status = {};

  for (const phase of phases) {
    const taskId = getPdcaTaskId(phase, feature);
    status[phase] = {
      taskId,
      hasTask: !!taskId
    };
  }

  return status;
}

/**
 * Update PDCA task status (placeholder - actual task update via tools)
 * @param {string} taskId
 * @param {'pending'|'in_progress'|'completed'} newStatus
 * @returns {string} Guidance for updating task
 */
function updatePdcaTaskStatus(taskId, newStatus) {
  // Return guidance for using TaskUpdate tool
  return `Use TaskUpdate tool to update task ${taskId} to status: ${newStatus}`;
}

/**
 * Trigger next PDCA action
 * @param {string} completedTaskId
 * @returns {{nextPhase: string, command: string}|null}
 */
function triggerNextPdcaAction(completedTaskId) {
  // Find feature and phase from task ID
  for (const [key, id] of _taskIdMap.entries()) {
    if (id === completedTaskId) {
      const [feature, phase] = key.split(':');

      const phaseOrder = ['plan', 'design', 'do', 'check', 'act', 'report'];
      const currentIndex = phaseOrder.indexOf(phase);

      if (currentIndex >= 0 && currentIndex < phaseOrder.length - 1) {
        const nextPhase = phaseOrder[currentIndex + 1];
        return {
          nextPhase,
          feature,
          command: `/pdca ${nextPhase} ${feature}`
        };
      }
    }
  }

  return null;
}

/**
 * Find PDCA status by task ID
 * @param {string} taskId
 * @returns {{feature: string, phase: string}|null}
 */
function findPdcaStatus(taskId) {
  for (const [key, id] of _taskIdMap.entries()) {
    if (id === taskId) {
      const [feature, phase] = key.split(':');
      return { feature, phase };
    }
  }

  return null;
}

/**
 * Get current PDCA phase from status file
 * @param {string} feature - Optional feature name
 * @returns {string|null}
 */
function getCurrentPdcaPhase(feature) {
  try {
    const statusPath = path.join(getProjectDir(), 'docs', '.pdca-status.json');

    if (fs.existsSync(statusPath)) {
      const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));

      if (feature && status.features?.[feature]) {
        return status.features[feature].phase;
      }

      if (status.primaryFeature && status.features?.[status.primaryFeature]) {
        return status.features[status.primaryFeature].phase;
      }
    }
  } catch {
    // Ignore errors
  }

  return null;
}

module.exports = {
  savePdcaTaskId,
  getPdcaTaskId,
  getTaskChainStatus,
  updatePdcaTaskStatus,
  triggerNextPdcaAction,
  findPdcaStatus,
  getCurrentPdcaPhase
};
