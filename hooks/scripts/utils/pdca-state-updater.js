/**
 * PDCA State Updater - Shared utility for PDCA status updates
 */
const fs = require('fs');
const path = require('path');

function loadPdcaStatus(projectDir) {
  const statusPath = path.join(projectDir, 'docs', '.pdca-status.json');
  try {
    if (fs.existsSync(statusPath)) {
      return JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
    }
  } catch (e) { /* ignore */ }
  return null;
}

function savePdcaStatus(projectDir, status) {
  try {
    const statusPath = path.join(projectDir, 'docs', '.pdca-status.json');
    status.lastUpdated = new Date().toISOString();
    status.session.lastActivity = new Date().toISOString();
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
  } catch (e) { /* silently fail */ }
}

function updateFeaturePhase(projectDir, feature, phase, extraData) {
  let status = loadPdcaStatus(projectDir);
  if (!status) {
    // Initialize default status
    status = {
      version: '2.0',
      lastUpdated: new Date().toISOString(),
      activeFeatures: [],
      features: {},
      pipeline: { currentPhase: 1, level: 'Starter', phaseHistory: [] },
      history: [],
      session: { startedAt: new Date().toISOString(), onboardingCompleted: true }
    };
  }

  if (!status.features[feature]) {
    status.features[feature] = { phase: 'plan', createdAt: new Date().toISOString() };
    if (!status.activeFeatures.includes(feature)) {
      status.activeFeatures.push(feature);
    }
    status.primaryFeature = feature;
  }

  status.features[feature].phase = phase;
  status.features[feature].updatedAt = new Date().toISOString();

  if (extraData) {
    Object.assign(status.features[feature], extraData);
  }

  // Update pipeline phase history
  if (!status.pipeline.phaseHistory) status.pipeline.phaseHistory = [];
  status.pipeline.phaseHistory.push({
    feature, phase, timestamp: new Date().toISOString()
  });

  savePdcaStatus(projectDir, status);
  return status;
}

module.exports = { loadPdcaStatus, savePdcaStatus, updateFeaturePhase };
