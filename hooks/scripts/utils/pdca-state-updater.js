/**
 * PDCA State Updater - Shared utility for PDCA status updates
 */
const fs = require('fs');
const path = require('path');

const libPath = path.resolve(__dirname, '..', '..', '..', 'lib');
const pdcaStatusModule = require(path.join(libPath, 'pdca', 'status'));

function loadPdcaStatus(projectDir) {
  try {
    return pdcaStatusModule.loadPdcaStatus(projectDir);
  } catch (e) { /* ignore */ }
  return null;
}

function savePdcaStatus(projectDir, status) {
  try {
    pdcaStatusModule.savePdcaStatus(status, projectDir);
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
