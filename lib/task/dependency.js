/**
 * Task Dependency Tracking for PDCA Workflow (GAP-02)
 * Implements blockedBy dependency chain for PDCA phase enforcement
 *
 * Philosophy: FR-06 (Automation First) - PDCA phase order must be automatically enforced
 */
const fs = require('fs');
const path = require('path');

/**
 * PDCA Dependency Chain Definition
 * Each phase lists its prerequisite phases
 */
const PDCA_DEPENDENCY_CHAIN = {
  'plan': [],
  'design': ['plan'],
  'do': ['design'],
  'check': ['do'],
  'act': ['check'],
  'report': ['check'],
  'completed': ['report'],
  'archived': ['completed']
};

/**
 * Phase display names
 */
const PHASE_NAMES = {
  'plan': 'Plan',
  'design': 'Design',
  'do': 'Do',
  'check': 'Check',
  'act': 'Act',
  'report': 'Report',
  'completed': 'Completed',
  'archived': 'Archived'
};

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
 * Load PDCA status from file
 * @param {string} projectDir
 * @returns {object}
 */
function loadPdcaStatus(projectDir) {
  const statusPath = path.join(projectDir, 'docs', '.pdca-status.json');

  if (!fs.existsSync(statusPath)) {
    return { version: '2.0', activeFeatures: {}, tasks: {} };
  }

  try {
    return JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
  } catch {
    return { version: '2.0', activeFeatures: {}, tasks: {} };
  }
}

/**
 * Save PDCA status to file
 * @param {string} projectDir
 * @param {object} status
 */
function savePdcaStatus(projectDir, status) {
  const statusPath = path.join(projectDir, 'docs', '.pdca-status.json');
  const dir = path.dirname(statusPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
}

/**
 * Generate unique task ID
 * @returns {string}
 */
function generateTaskId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `task-${timestamp}-${random}`;
}

/**
 * Capitalize first letter
 * @param {string} str
 * @returns {string}
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Find task ID by feature and phase
 * @param {string} feature - Feature name
 * @param {string} phase - PDCA phase
 * @param {object} tasks - Tasks map
 * @returns {string|null}
 */
function findTaskIdByPhase(feature, phase, tasks) {
  const task = Object.values(tasks).find(
    t => t.feature === feature && t.phase === phase
  );
  return task?.id || null;
}

/**
 * Check if a task can be started based on dependencies
 *
 * @param {string} taskId - Task ID to check
 * @param {object} tasksMap - All tasks in the system
 * @returns {{canStart: boolean, blockedByTasks: Array<string>, reason: string|null}}
 */
function canStartTask(taskId, tasksMap) {
  const task = tasksMap[taskId];

  if (!task) {
    return {
      canStart: false,
      blockedByTasks: [],
      reason: 'Task not found'
    };
  }

  const blockedBy = task.blockedBy || [];
  const blockedByTasks = [];
  const blockedByDetails = [];

  for (const depId of blockedBy) {
    const depTask = tasksMap[depId];

    if (!depTask) {
      blockedByTasks.push(depId);
      blockedByDetails.push(`${depId} (not found)`);
    } else if (depTask.status !== 'completed') {
      blockedByTasks.push(depId);
      blockedByDetails.push(`${depTask.subject} (${depTask.status})`);
    }
  }

  return {
    canStart: blockedByTasks.length === 0,
    blockedByTasks,
    reason: blockedByTasks.length > 0
      ? `Blocked by: ${blockedByDetails.join(', ')}`
      : null
  };
}

/**
 * Check if a PDCA phase can be started for a feature
 *
 * @param {string} phase - Target phase
 * @param {string} feature - Feature name
 * @param {object} pdcaStatus - Current PDCA status
 * @returns {{canStart: boolean, requiredPhases: Array<string>, reason: string|null, suggestion: string|null}}
 */
function canStartPhase(phase, feature, pdcaStatus) {
  const requiredPhases = PDCA_DEPENDENCY_CHAIN[phase] || [];

  // Check if feature exists
  const featureStatus = pdcaStatus.features?.[feature];

  if (!featureStatus && requiredPhases.length > 0) {
    return {
      canStart: false,
      requiredPhases,
      reason: `Feature "${feature}" not found`,
      suggestion: `Start with /pdca plan ${feature}`
    };
  }

  // If plan phase, always can start (no dependencies)
  if (phase === 'plan') {
    return {
      canStart: true,
      requiredPhases: [],
      reason: null,
      suggestion: null
    };
  }

  const tasks = pdcaStatus.tasks || {};
  const missingPhases = [];
  const incompletePhases = [];

  for (const reqPhase of requiredPhases) {
    const phaseTaskId = findTaskIdByPhase(feature, reqPhase, tasks);

    if (!phaseTaskId) {
      missingPhases.push(reqPhase);
    } else {
      const phaseTask = tasks[phaseTaskId];
      if (phaseTask.status !== 'completed') {
        incompletePhases.push(reqPhase);
      }
    }
  }

  const allMissing = [...missingPhases, ...incompletePhases];

  if (allMissing.length > 0) {
    const formattedPhases = allMissing.map(p => PHASE_NAMES[p] || capitalize(p));

    return {
      canStart: false,
      requiredPhases: allMissing,
      reason: `Required phases not completed: ${formattedPhases.join(', ')}`,
      suggestion: missingPhases.length > 0
        ? `/pdca ${missingPhases[0]} ${feature}`
        : `Complete ${PHASE_NAMES[incompletePhases[0]] || incompletePhases[0]} phase first`
    };
  }

  return {
    canStart: true,
    requiredPhases: [],
    reason: null,
    suggestion: null
  };
}

/**
 * Create a PDCA task with automatic dependency setup
 *
 * @param {string} phase - PDCA phase
 * @param {string} feature - Feature name
 * @param {object} pdcaStatus - Current PDCA status
 * @param {object} options - Additional options
 * @returns {{task: object, updated: boolean}}
 */
function createPdcaTaskWithDependencies(phase, feature, pdcaStatus, options = {}) {
  const tasks = pdcaStatus.tasks || {};
  const taskId = generateTaskId();

  // Find blocking tasks based on dependency chain
  const requiredPhases = PDCA_DEPENDENCY_CHAIN[phase] || [];
  const blockedBy = [];

  for (const reqPhase of requiredPhases) {
    const depTaskId = findTaskIdByPhase(feature, reqPhase, tasks);
    if (depTaskId) {
      blockedBy.push(depTaskId);
    }
  }

  // Create task object
  const task = {
    id: taskId,
    subject: `[${PHASE_NAMES[phase] || capitalize(phase)}] ${feature}`,
    description: options.description || `PDCA ${phase} phase for feature: ${feature}`,
    status: 'pending',
    feature,
    phase,
    blockedBy,
    blocks: [],
    createdAt: new Date().toISOString(),
    metadata: {
      pdca: true,
      ...options.metadata
    }
  };

  // Update blocking tasks to include this as blocked
  for (const blockingId of blockedBy) {
    if (tasks[blockingId]) {
      tasks[blockingId].blocks = tasks[blockingId].blocks || [];
      if (!tasks[blockingId].blocks.includes(taskId)) {
        tasks[blockingId].blocks.push(taskId);
      }
    }
  }

  // Add task to tasks map
  tasks[taskId] = task;

  return {
    task,
    updated: true,
    tasksMap: tasks
  };
}

/**
 * Complete a task and unblock dependent tasks
 *
 * @param {string} taskId - Task to complete
 * @param {object} pdcaStatus - Current PDCA status
 * @returns {{success: boolean, unblockedTasks: Array<string>, nextPhase: string|null}}
 */
function completeTask(taskId, pdcaStatus) {
  const tasks = pdcaStatus.tasks || {};
  const task = tasks[taskId];

  if (!task) {
    return {
      success: false,
      error: 'Task not found',
      unblockedTasks: []
    };
  }

  // Mark task as completed
  task.status = 'completed';
  task.completedAt = new Date().toISOString();

  // Find tasks that are now unblocked
  const unblockedTasks = [];
  const blocks = task.blocks || [];

  for (const blockedId of blocks) {
    const blockedTask = tasks[blockedId];
    if (blockedTask && blockedTask.status === 'pending') {
      const { canStart } = canStartTask(blockedId, tasks);
      if (canStart) {
        unblockedTasks.push({
          id: blockedId,
          subject: blockedTask.subject,
          phase: blockedTask.phase
        });
      }
    }
  }

  // Determine next phase
  const phaseOrder = Object.keys(PDCA_DEPENDENCY_CHAIN);
  const currentIndex = phaseOrder.indexOf(task.phase);
  const nextPhase = currentIndex < phaseOrder.length - 1
    ? phaseOrder[currentIndex + 1]
    : null;

  return {
    success: true,
    task,
    unblockedTasks,
    nextPhase,
    suggestion: nextPhase ? `/pdca ${nextPhase} ${task.feature}` : null
  };
}

/**
 * Get next available tasks for a feature
 *
 * @param {string} feature - Feature name
 * @param {object} pdcaStatus - Current PDCA status
 * @returns {Array<{taskId: string, phase: string, canStart: boolean, subject: string}>}
 */
function getNextAvailableTasks(feature, pdcaStatus) {
  const tasks = pdcaStatus.tasks || {};

  return Object.values(tasks)
    .filter(t => t.feature === feature && t.status === 'pending')
    .map(t => ({
      taskId: t.id,
      phase: t.phase,
      subject: t.subject,
      ...canStartTask(t.id, tasks)
    }))
    .filter(t => t.canStart);
}

/**
 * Get all tasks for a feature organized by phase
 *
 * @param {string} feature - Feature name
 * @param {object} pdcaStatus - Current PDCA status
 * @returns {object} Tasks organized by phase
 */
function getFeatureTasksByPhase(feature, pdcaStatus) {
  const tasks = pdcaStatus.tasks || {};
  const result = {};

  for (const phase of Object.keys(PDCA_DEPENDENCY_CHAIN)) {
    result[phase] = Object.values(tasks).filter(
      t => t.feature === feature && t.phase === phase
    );
  }

  return result;
}

/**
 * Validate entire dependency chain for a feature
 *
 * @param {string} feature - Feature name
 * @param {object} pdcaStatus - Current PDCA status
 * @returns {{valid: boolean, issues: Array<string>}}
 */
function validateDependencyChain(feature, pdcaStatus) {
  const tasks = pdcaStatus.tasks || {};
  const featureTasks = Object.values(tasks).filter(t => t.feature === feature);
  const issues = [];

  for (const task of featureTasks) {
    const requiredPhases = PDCA_DEPENDENCY_CHAIN[task.phase] || [];

    for (const reqPhase of requiredPhases) {
      const depTask = featureTasks.find(t => t.phase === reqPhase);

      if (!depTask) {
        issues.push(`[${task.phase}] Missing dependency: ${reqPhase}`);
      } else if (!task.blockedBy.includes(depTask.id)) {
        issues.push(`[${task.phase}] Missing blockedBy reference to ${reqPhase} task`);
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Get task chain status summary for a feature
 *
 * @param {string} feature - Feature name
 * @param {object} pdcaStatus - Current PDCA status
 * @returns {object} Summary of task chain status
 */
function getTaskChainSummary(feature, pdcaStatus) {
  const tasks = pdcaStatus.tasks || {};
  const phases = Object.keys(PDCA_DEPENDENCY_CHAIN);

  const summary = {
    feature,
    phases: {},
    currentPhase: null,
    progress: 0,
    totalPhases: phases.length,
    completedPhases: 0
  };

  for (const phase of phases) {
    const phaseTask = Object.values(tasks).find(
      t => t.feature === feature && t.phase === phase
    );

    if (phaseTask) {
      summary.phases[phase] = {
        taskId: phaseTask.id,
        status: phaseTask.status,
        completedAt: phaseTask.completedAt
      };

      if (phaseTask.status === 'completed') {
        summary.completedPhases++;
      } else if (phaseTask.status === 'in_progress') {
        summary.currentPhase = phase;
      } else if (phaseTask.status === 'pending' && !summary.currentPhase) {
        summary.currentPhase = phase;
      }
    } else {
      summary.phases[phase] = null;
    }
  }

  summary.progress = Math.round((summary.completedPhases / summary.totalPhases) * 100);

  return summary;
}

module.exports = {
  PDCA_DEPENDENCY_CHAIN,
  PHASE_NAMES,
  canStartTask,
  canStartPhase,
  createPdcaTaskWithDependencies,
  completeTask,
  getNextAvailableTasks,
  getFeatureTasksByPhase,
  validateDependencyChain,
  getTaskChainSummary,
  findTaskIdByPhase,
  generateTaskId,
  loadPdcaStatus,
  savePdcaStatus
};
