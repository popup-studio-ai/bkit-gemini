/**
 * PDCA Status Management — v2.0.7-S6 v3 schema sync
 *
 * Aligns with the schema actually used by hooks (hooks/scripts/utils/pdca-state-updater.js,
 * before-tool-selection.js, before-model.js) and tested by tc92-pdca-workflow.js:
 *
 *   {
 *     version: '2.0',
 *     lastUpdated: ISO,
 *     activeFeatures: [],        // string[] — names of features currently active
 *     features: {},              // map: name → { phase, matchRate, iterationCount, ... }
 *     primaryFeature: null,
 *     archivedFeatures: {},
 *     pipeline: { currentPhase: 1, level: 'Starter', phaseHistory: [] },
 *     session: { startedAt: ISO, lastActivity: ISO, onboardingCompleted: false },
 *     history: []
 *   }
 *
 * Prior schema used `activeFeatures: {}` as the feature map; v3 splits names (array)
 * from per-feature data (object) to match the hook code paths and v2.0 expectations.
 */
const { getProjectDir, getPaths } = require('../core/paths');
const { readJson, writeJson } = require('../core/file');
const fs = require('fs');
const path = require('path');

const MAX_HISTORY = 100;

function nowIso() { return new Date().toISOString(); }

function getPdcaStatusPath(projectDir) {
  const paths = getPaths(projectDir || getProjectDir());
  if (fs.existsSync(paths.pdcaStatus)) return paths.pdcaStatus;
  if (fs.existsSync(paths.legacy.pdcaStatusRoot)) return paths.legacy.pdcaStatusRoot;
  if (fs.existsSync(paths.legacy.pdcaStatusDocs)) return paths.legacy.pdcaStatusDocs;
  return paths.pdcaStatus;
}

function createInitialStatusV2() {
  const ts = nowIso();
  return {
    version: '2.0',
    lastUpdated: ts,
    activeFeatures: [],           // v3 schema — array of names
    features: {},                 // v3 schema — per-feature data map
    primaryFeature: null,
    archivedFeatures: {},
    pipeline: { currentPhase: 1, level: 'Starter', phaseHistory: [] },
    session: { startedAt: ts, lastActivity: ts, onboardingCompleted: false },
    history: []
  };
}

/**
 * Migrate legacy/partial status to current v3 schema. Idempotent.
 */
function migrateStatusToV2(oldStatus) {
  const status = createInitialStatusV2();
  if (!oldStatus) return status;

  status.primaryFeature = oldStatus.primaryFeature || oldStatus.currentFeature || null;

  // Old schema: activeFeatures could be either array, object map, or absent.
  // Old schema: features could be absent.
  const oldFeatures = oldStatus.features && typeof oldStatus.features === 'object' ? oldStatus.features : {};
  const oldActive = oldStatus.activeFeatures;

  let names = [];
  if (Array.isArray(oldActive)) {
    names = [...oldActive];
  } else if (oldActive && typeof oldActive === 'object') {
    // legacy v2.0: activeFeatures was a map — keys are names, values may be feature data
    names = Object.keys(oldActive);
    for (const n of names) {
      if (!oldFeatures[n] && typeof oldActive[n] === 'object') {
        oldFeatures[n] = oldActive[n];
      }
    }
  }

  status.activeFeatures = names;
  status.features = { ...oldFeatures };

  // Backfill any names that lack per-feature data
  for (const n of names) {
    if (!status.features[n]) {
      status.features[n] = { phase: oldStatus.phase || 'plan', createdAt: nowIso() };
    }
  }

  if (oldStatus.pipeline) status.pipeline = oldStatus.pipeline;
  else if (oldStatus.level) status.pipeline.level = oldStatus.level;

  if (oldStatus.session) status.session = { ...status.session, ...oldStatus.session };
  if (!status.session.lastActivity) status.session.lastActivity = nowIso();
  if (oldStatus.history && Array.isArray(oldStatus.history)) status.history = oldStatus.history;
  if (oldStatus.archivedFeatures && typeof oldStatus.archivedFeatures === 'object') {
    status.archivedFeatures = oldStatus.archivedFeatures;
  }

  return status;
}

function loadPdcaStatus(projectDir) {
  const dir = projectDir || getProjectDir();
  const paths = getPaths(dir);
  const statusPath = getPdcaStatusPath(dir);

  let status = readJson(statusPath, null);

  if (status && statusPath !== paths.pdcaStatus) {
    writeJson(paths.pdcaStatus, status);
  }

  if (!status) return createInitialStatusV2();

  // Always reshape into v3 schema (idempotent for already-correct status).
  // Detect v2-style nested feature data and migrate.
  const needsMigration =
    status.version !== '2.0' ||
    !Array.isArray(status.activeFeatures) ||
    !status.features ||
    typeof status.features !== 'object' ||
    !status.session ||
    !status.session.lastActivity;

  if (needsMigration) status = migrateStatusToV2(status);
  return status;
}

function savePdcaStatus(status, projectDir) {
  const paths = getPaths(projectDir || getProjectDir());
  status.lastUpdated = nowIso();
  if (status.session) status.session.lastActivity = status.lastUpdated;
  // v2.0.7-S6: if a legacy .pdca-status.json exists at the project root, keep
  // saving there (do not force-migrate). Only switch to the new canonical
  // .bkit/state/pdca-status.json when no legacy file exists. Ensures backward
  // compat for projects that already use the legacy path.
  let target = paths.pdcaStatus;
  if (!fs.existsSync(target) && fs.existsSync(paths.legacy.pdcaStatusRoot)) {
    target = paths.legacy.pdcaStatusRoot;
  }
  const dir = path.dirname(target);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  writeJson(target, status);
}

function getPdcaStatusFull(projectDir) {
  return loadPdcaStatus(projectDir);
}

function getFeatureStatus(feature, projectDir) {
  const status = loadPdcaStatus(projectDir);
  return (status.features && status.features[feature]) || null;
}

/**
 * Upsert a feature; auto-adds it to activeFeatures array if absent.
 */
function updatePdcaStatus(feature, updates, projectDir) {
  const status = loadPdcaStatus(projectDir);
  if (!status.features[feature]) {
    status.features[feature] = { phase: 'plan', createdAt: nowIso() };
  }
  Object.assign(status.features[feature], updates, { updatedAt: nowIso() });
  if (!status.activeFeatures.includes(feature)) {
    status.activeFeatures.push(feature);
  }
  savePdcaStatus(status, projectDir);
  return status;
}

function setActiveFeature(feature, projectDir) {
  const status = loadPdcaStatus(projectDir);
  status.primaryFeature = feature;
  if (!status.features[feature]) {
    status.features[feature] = { phase: 'plan', createdAt: nowIso() };
  }
  if (!status.activeFeatures.includes(feature)) {
    status.activeFeatures.push(feature);
  }
  savePdcaStatus(status, projectDir);
}

/**
 * Initialize .pdca-status.json if it does not exist. Returns the (possibly
 * newly created) status. Safe to call repeatedly.
 */
function initPdcaStatusIfNotExists(projectDir) {
  const dir = projectDir || getProjectDir();
  const paths = getPaths(dir);
  // v2.0.7-S6: also consider legacy paths as "existing"
  if (!fs.existsSync(paths.pdcaStatus) &&
      !fs.existsSync(paths.legacy.pdcaStatusRoot) &&
      !fs.existsSync(paths.legacy.pdcaStatusDocs)) {
    const status = createInitialStatusV2();
    // Save to project root (.pdca-status.json) for new projects — simplest path
    // matching most test expectations and existing tooling.
    const target = paths.legacy.pdcaStatusRoot;
    const targetDir = path.dirname(target);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    status.lastUpdated = nowIso();
    if (status.session) status.session.lastActivity = status.lastUpdated;
    writeJson(target, status);
    return status;
  }
  return loadPdcaStatus(dir);
}

function addActiveFeature(feature, projectDir) {
  const status = loadPdcaStatus(projectDir);
  if (!status.activeFeatures.includes(feature)) {
    status.activeFeatures.push(feature);
  }
  if (!status.features[feature]) {
    status.features[feature] = { phase: 'plan', createdAt: nowIso() };
  }
  savePdcaStatus(status, projectDir);
  return status;
}

function removeActiveFeature(feature, projectDir) {
  const status = loadPdcaStatus(projectDir);
  status.activeFeatures = status.activeFeatures.filter(f => f !== feature);
  if (status.primaryFeature === feature) {
    status.primaryFeature = status.activeFeatures[0] || null;
  }
  savePdcaStatus(status, projectDir);
  return status;
}

function getActiveFeatures(projectDir) {
  const status = loadPdcaStatus(projectDir);
  return [...status.activeFeatures];
}

function switchFeatureContext(feature, projectDir) {
  return setActiveFeature(feature, projectDir);
}

function completePdcaFeature(feature, projectDir) {
  const status = loadPdcaStatus(projectDir);
  if (!status.features[feature]) return status; // ignore nonexistent
  status.features[feature].phase = 'completed';
  status.features[feature].completedAt = nowIso();
  savePdcaStatus(status, projectDir);
  return status;
}

function addPdcaHistory(entry, projectDir) {
  const status = loadPdcaStatus(projectDir);
  // v2.0.7-S6: push (newest-last) matches hook code convention
  // (after-agent.js, session-end.js all use push). Trim keeps newest entries.
  status.history.push({ ...entry, timestamp: nowIso() });
  if (status.history.length > MAX_HISTORY) {
    status.history = status.history.slice(-MAX_HISTORY);
  }
  savePdcaStatus(status, projectDir);
  return status;
}

/**
 * Extract feature name from PDCA-style context strings:
 *   "/pdca plan login" → "login"
 *   "pdca design checkout" → "checkout"
 * Returns null when no match.
 */
function extractFeatureFromContext(context) {
  if (!context || typeof context !== 'string') return null;
  // v2.0.7-S6: 'pdca' prefix optional — accepts both
  // "/pdca plan login" and "implement login-form".
  const m = context.match(/(?:\/?pdca\s+)?(?:plan|design|implement|analyze|iterate|act|check|report)\s+([a-zA-Z0-9_-]+)/i);
  return m ? m[1] : null;
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
  setActiveFeature,
  initPdcaStatusIfNotExists,
  addActiveFeature,
  removeActiveFeature,
  getActiveFeatures,
  switchFeatureContext,
  completePdcaFeature,
  addPdcaHistory,
  extractFeatureFromContext
};
