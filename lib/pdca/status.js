/**
 * PDCA Status Management
 * Manages .pdca-status.json file for tracking feature progress
 */
const fs = require('fs');
const path = require('path');

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
 * Get PDCA status file path
 * @param {string} projectDir - Optional project directory
 * @returns {string}
 */
function getPdcaStatusPath(projectDir) {
  const dir = projectDir || getProjectDir();
  return path.join(dir, 'docs', '.pdca-status.json');
}

/**
 * Create initial v2.0 status structure
 * @returns {object}
 */
function createInitialStatusV2() {
  return {
    version: '2.0',
    lastUpdated: new Date().toISOString(),
    activeFeatures: [],
    primaryFeature: null,
    features: {},
    pipeline: {
      currentPhase: 1,
      level: 'Starter',
      phaseHistory: []
    },
    session: {
      startedAt: new Date().toISOString(),
      onboardingCompleted: false,
      lastActivity: new Date().toISOString()
    },
    history: []
  };
}

/**
 * Migrate v1 status to v2
 * @param {object} oldStatus
 * @returns {object}
 */
function migrateStatusToV2(oldStatus) {
  const v2 = createInitialStatusV2();

  // Migrate existing data
  if (oldStatus.currentFeature) {
    v2.primaryFeature = oldStatus.currentFeature;
    v2.activeFeatures = [oldStatus.currentFeature];
    v2.features[oldStatus.currentFeature] = {
      phase: oldStatus.phase || 'plan',
      matchRate: oldStatus.matchRate || null,
      iterationCount: oldStatus.iterationCount || 0,
      createdAt: oldStatus.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  if (oldStatus.level) {
    v2.pipeline.level = oldStatus.level;
  }

  return v2;
}

/**
 * Initialize PDCA status if not exists
 * @param {string} projectDir - Optional project directory
 * @returns {object}
 */
function initPdcaStatusIfNotExists(projectDir) {
  const statusPath = getPdcaStatusPath(projectDir);

  if (fs.existsSync(statusPath)) {
    return loadPdcaStatus(projectDir);
  }

  const status = createInitialStatusV2();

  // Ensure directory exists
  const dir = path.dirname(statusPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
  return status;
}

/**
 * Load PDCA status
 * @param {string} projectDir - Optional project directory
 * @returns {object}
 */
function loadPdcaStatus(projectDir) {
  const statusPath = getPdcaStatusPath(projectDir);

  if (!fs.existsSync(statusPath)) {
    return createInitialStatusV2();
  }

  try {
    const content = fs.readFileSync(statusPath, 'utf-8');
    const status = JSON.parse(content);

    // Check for v1 format and migrate
    if (!status.version || status.version === '1.0') {
      return migrateStatusToV2(status);
    }

    return status;
  } catch {
    return createInitialStatusV2();
  }
}

/**
 * Get full PDCA status
 * @param {string} projectDir - Optional project directory
 * @returns {object}
 */
function getPdcaStatusFull(projectDir) {
  return loadPdcaStatus(projectDir);
}

/**
 * Save PDCA status
 * @param {object} status
 * @param {string} projectDir - Optional project directory
 */
function savePdcaStatus(status, projectDir) {
  const statusPath = getPdcaStatusPath(projectDir);

  // Ensure directory exists
  const dir = path.dirname(statusPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  status.lastUpdated = new Date().toISOString();
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
}

/**
 * Get feature status
 * @param {string} feature
 * @param {string} projectDir - Optional project directory
 * @returns {object|null}
 */
function getFeatureStatus(feature, projectDir) {
  const status = loadPdcaStatus(projectDir);
  return status.features[feature] || null;
}

/**
 * Update PDCA status for a feature
 * @param {string} feature
 * @param {object} updates
 * @param {string} projectDir - Optional project directory
 */
function updatePdcaStatus(feature, updates, projectDir) {
  const status = loadPdcaStatus(projectDir);

  if (!status.features[feature]) {
    status.features[feature] = {
      phase: 'plan',
      matchRate: null,
      iterationCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!status.activeFeatures.includes(feature)) {
      status.activeFeatures.push(feature);
    }
  }

  Object.assign(status.features[feature], updates, {
    updatedAt: new Date().toISOString()
  });

  savePdcaStatus(status, projectDir);
}

/**
 * Add history entry
 * @param {object} entry
 * @param {string} projectDir - Optional project directory
 */
function addPdcaHistory(entry, projectDir) {
  const status = loadPdcaStatus(projectDir);

  status.history.push({
    timestamp: new Date().toISOString(),
    ...entry
  });

  // Keep last 100 entries
  if (status.history.length > 100) {
    status.history = status.history.slice(-100);
  }

  savePdcaStatus(status, projectDir);
}

/**
 * Complete PDCA feature
 * @param {string} feature
 * @param {string} projectDir - Optional project directory
 */
function completePdcaFeature(feature, projectDir) {
  const status = loadPdcaStatus(projectDir);

  if (status.features[feature]) {
    status.features[feature].phase = 'completed';
    status.features[feature].completedAt = new Date().toISOString();
  }

  savePdcaStatus(status, projectDir);
}

/**
 * Set active feature
 * @param {string} feature
 * @param {string} projectDir - Optional project directory
 */
function setActiveFeature(feature, projectDir) {
  const status = loadPdcaStatus(projectDir);

  status.primaryFeature = feature;

  if (!status.activeFeatures.includes(feature)) {
    status.activeFeatures.push(feature);
  }

  if (!status.features[feature]) {
    status.features[feature] = {
      phase: 'plan',
      matchRate: null,
      iterationCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  savePdcaStatus(status, projectDir);
}

/**
 * Add feature to active list
 * @param {string} feature
 * @param {string} projectDir - Optional project directory
 */
function addActiveFeature(feature, projectDir) {
  const status = loadPdcaStatus(projectDir);

  if (!status.activeFeatures.includes(feature)) {
    status.activeFeatures.push(feature);
  }

  savePdcaStatus(status, projectDir);
}

/**
 * Remove feature from active list
 * @param {string} feature
 * @param {string} projectDir - Optional project directory
 */
function removeActiveFeature(feature, projectDir) {
  const status = loadPdcaStatus(projectDir);

  status.activeFeatures = status.activeFeatures.filter(f => f !== feature);

  if (status.primaryFeature === feature) {
    status.primaryFeature = status.activeFeatures[0] || null;
  }

  savePdcaStatus(status, projectDir);
}

/**
 * Get active features
 * @param {string} projectDir - Optional project directory
 * @returns {string[]}
 */
function getActiveFeatures(projectDir) {
  const status = loadPdcaStatus(projectDir);
  return status.activeFeatures || [];
}

/**
 * Switch feature context
 * @param {string} feature
 * @param {string} projectDir - Optional project directory
 */
function switchFeatureContext(feature, projectDir) {
  setActiveFeature(feature, projectDir);
}

/**
 * Extract feature name from context
 * @param {string} context
 * @returns {string|null}
 */
function extractFeatureFromContext(context) {
  // Try common patterns
  const patterns = [
    /feature[:\s]+["']?([a-z0-9-_]+)["']?/i,
    /for\s+["']?([a-z0-9-_]+)["']?\s+feature/i,
    /(?:implement|create|build)\s+([a-z0-9-_]+)/i
  ];

  for (const pattern of patterns) {
    const match = context.match(pattern);
    if (match) {
      return match[1].toLowerCase().replace(/\s+/g, '-');
    }
  }

  return null;
}

module.exports = {
  getPdcaStatusPath,
  createInitialStatusV2,
  migrateStatusToV2,
  initPdcaStatusIfNotExists,
  loadPdcaStatus,
  getPdcaStatusFull,
  savePdcaStatus,
  getFeatureStatus,
  updatePdcaStatus,
  addPdcaHistory,
  completePdcaFeature,
  setActiveFeature,
  addActiveFeature,
  removeActiveFeature,
  getActiveFeatures,
  switchFeatureContext,
  extractFeatureFromContext
};
