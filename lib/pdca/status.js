/**
 * PDCA Status Management
 * Manages .pdca-status.json file for tracking feature progress
 */
const { getProjectDir, getPaths } = require('../core/paths');
const { readJson, writeJson } = require('../core/file');
const fs = require('fs');
const path = require('path');

/**
 * Get PDCA status file path (GAP-02)
 */
function getPdcaStatusPath(projectDir) {
  const paths = getPaths(projectDir || getProjectDir());
  if (fs.existsSync(paths.pdcaStatus)) return paths.pdcaStatus;
  if (fs.existsSync(paths.legacy.pdcaStatusRoot)) return paths.legacy.pdcaStatusRoot;
  if (fs.existsSync(paths.legacy.pdcaStatusDocs)) return paths.legacy.pdcaStatusDocs;
  return paths.pdcaStatus;
}

/**
 * Create initial v3.0 status structure
 */
function createInitialStatusV2() {
  return {
    version: '3.0',
    lastUpdated: new Date().toISOString(),
    activeFeatures: {}, 
    primaryFeature: null,
    archivedFeatures: {},
    pipeline: { currentPhase: 1, level: 'Starter', phaseHistory: [] },
    session: { startedAt: new Date().toISOString(), onboardingCompleted: false },
    history: []
  };
}

/**
 * Migrate legacy status to v3
 */
function migrateStatusToV2(oldStatus) {
  const status = createInitialStatusV2();
  if (!oldStatus) return status;

  status.primaryFeature = oldStatus.primaryFeature || oldStatus.currentFeature || null;
  
  const features = oldStatus.features || {};
  const activeList = Array.isArray(oldStatus.activeFeatures) ? oldStatus.activeFeatures : Object.keys(oldStatus.activeFeatures || {});
  
  activeList.forEach(f => {
    status.activeFeatures[f] = features[f] || { phase: oldStatus.phase || 'plan' };
  });

  if (oldStatus.pipeline) status.pipeline = oldStatus.pipeline;
  else if (oldStatus.level) status.pipeline.level = oldStatus.level;

  return status;
}

/**
 * Load PDCA status with auto-migration
 */
function loadPdcaStatus(projectDir) {
  const dir = projectDir || getProjectDir();
  const paths = getPaths(dir);
  const statusPath = getPdcaStatusPath(dir);

  let status = readJson(statusPath, null);

  if (status && statusPath !== paths.pdcaStatus) {
    writeJson(paths.pdcaStatus, status);
  }

  if (!status) return createInitialStatusV2();
  if (status.version !== '3.0') status = migrateStatusToV2(status);
  
  return status;
}

function savePdcaStatus(status, projectDir) {
  const paths = getPaths(projectDir || getProjectDir());
  status.lastUpdated = new Date().toISOString();
  writeJson(paths.pdcaStatus, status);
}

function getPdcaStatusFull(projectDir) {
  return loadPdcaStatus(projectDir);
}

function getFeatureStatus(feature, projectDir) {
  const status = loadPdcaStatus(projectDir);
  return status.activeFeatures[feature] || null;
}

function updatePdcaStatus(feature, updates, projectDir) {
  const status = loadPdcaStatus(projectDir);
  if (!status.activeFeatures[feature]) {
    status.activeFeatures[feature] = { phase: 'plan', createdAt: new Date().toISOString() };
  }
  Object.assign(status.activeFeatures[feature], updates, { updatedAt: new Date().toISOString() });
  savePdcaStatus(status, projectDir);
}

function setActiveFeature(feature, projectDir) {
  const status = loadPdcaStatus(projectDir);
  status.primaryFeature = feature;
  if (!status.activeFeatures[feature]) {
    status.activeFeatures[feature] = { phase: 'plan', createdAt: new Date().toISOString() };
  }
  savePdcaStatus(status, projectDir);
}

module.exports = {
  getPdcaStatusPath,
  createInitialStatusV2,
  migrateStatusToV2,
  loadPdcaStatus,
  getPdcaStatusFull,
  savePdcaStatus,
  getFeatureStatus,
  updatePdcaStatus,
  setActiveFeature
};
