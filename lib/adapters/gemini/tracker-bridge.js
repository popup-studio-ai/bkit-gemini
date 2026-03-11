/**
 * Task Tracker - PDCA Bridge
 * Instruction-based bridge: generates context hints, NOT direct tool calls
 * One-way sync: PDCA → Tracker (PDCA is source of truth)
 *
 * Bridge state stored in docs/.tracker-bridge.json (ID mappings only)
 * Coexists with MCP team tools (spawn-agent-server) - different storage/lifecycle
 *
 * @version 1.5.8
 */
const fs = require('fs');
const path = require('path');
const { getFeatureFlags } = require('./version-detector');

const BRIDGE_STATE_FILE = 'docs/.tracker-bridge.json';

function isTrackerAvailable() {
  try {
    return getFeatureFlags().hasTaskTracker === true;
  } catch (e) {
    return false;
  }
}

const PDCA_TO_TRACKER_STATUS = Object.freeze({
  plan: 'in_progress', design: 'in_progress', do: 'in_progress',
  check: 'in_progress', act: 'in_progress', completed: 'done', archived: 'done'
});

/**
 * Create PDCA epic in tracker (context hint generation)
 * Returns instruction text for LLM context, not direct API call
 */
function createPdcaEpic(feature) {
  if (!isTrackerAvailable()) return { available: false, hint: '' };
  return {
    available: true,
    hint: `Use tracker_create_task to create epic: "[PDCA] ${feature}" with 6 subtasks (Plan, Design, Do, Check, Act, Report)`
  };
}

/**
 * Sync PDCA phase transition to tracker (context hint)
 */
function syncPhaseTransition(feature, fromPhase, toPhase) {
  if (!isTrackerAvailable()) return '';
  const status = PDCA_TO_TRACKER_STATUS[toPhase] || 'in_progress';
  return `Update tracker: [${capitalize(fromPhase)}] → done, [${capitalize(toPhase)}] → ${status}`;
}

/**
 * Get visualization hint for current state
 */
function getVisualizationHint(feature, currentPhase) {
  if (!isTrackerAvailable()) return '';
  const phases = ['plan', 'design', 'do', 'check', 'act', 'report'];
  const idx = phases.indexOf(currentPhase);
  return phases.map((p, i) => {
    const label = capitalize(p);
    if (i < idx) return `[${label}] done`;
    if (i === idx) return `[${label}] >>> active`;
    return `[${label}] pending`;
  }).join(' -> ');
}

/**
 * Register tracker task IDs for bridge state persistence
 */
function registerTrackerIds(feature, taskIds) {
  try {
    const statePath = path.join(process.cwd(), BRIDGE_STATE_FILE);
    let state = {};
    if (fs.existsSync(statePath)) {
      state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    }
    state[feature] = { ...state[feature], taskIds, updatedAt: new Date().toISOString() };
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) { /* non-fatal */ }
}

/**
 * Get context injection for session-start
 */
function getTrackerContextInjection(feature, phase) {
  if (!isTrackerAvailable()) return '';
  return [
    '', '## Task Tracker Integration (v0.32.0+)',
    `Native Task Tracker available. PDCA feature "${feature}" can be tracked with:`,
    '- `tracker_create_task` to create tracker tasks',
    '- `tracker_visualize` to view task graph',
    `Current PDCA progress: ${getVisualizationHint(feature, phase)}`, ''
  ].join('\n');
}

/**
 * Get bridge operational status
 */
function getBridgeStatus() {
  return {
    available: isTrackerAvailable(),
    mode: 'instruction-based',
    syncDirection: 'pdca-to-tracker (one-way)',
    coexistence: 'MCP team tools operate independently'
  };
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

module.exports = {
  isTrackerAvailable, PDCA_TO_TRACKER_STATUS,
  createPdcaEpic, syncPhaseTransition, getVisualizationHint,
  registerTrackerIds, getTrackerContextInjection,
  getBridgeStatus
};
