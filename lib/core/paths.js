/**
 * Path Registry - Centralized state file path management
 * Single source of truth for all bkit state file paths.
 * Matches CC bkit STATE_PATHS structure for cross-platform consistency.
 * @version 2.0.2
 */
const path = require('path');

// Lazy load for project directory
let _projectDir = null;

/**
 * Standard project root detection logic (GAP-01)
 * Used by all library modules for path resolution.
 */
function getProjectDir() {
  if (_projectDir) return _projectDir;

  try {
    const { getAdapter } = require('../gemini/platform');
    _projectDir = getAdapter().getProjectDir();
  } catch {
    // Graceful fallback to cwd
    _projectDir = process.cwd();
  }

  return _projectDir;
}

function getPaths(projectDir) {
  const dir = projectDir || getProjectDir();
  const bkitDir = path.join(dir, '.bkit');
  const geminiDir = path.join(dir, '.gemini');

  return {
    // .bkit root
    root: bkitDir,

    // .bkit/state/ — persistent state
    stateDir: path.join(bkitDir, 'state'),
    pdcaStatus: path.join(bkitDir, 'state', 'pdca-status.json'),
    memory: path.join(bkitDir, 'state', 'memory.json'),
    batchDir: path.join(bkitDir, 'state', 'batch'),
    resumeDir: path.join(bkitDir, 'state', 'resume'),
    workflowStateDir: path.join(bkitDir, 'state', 'workflows'),
    taskMappings: path.join(bkitDir, 'state', 'pdca-tasks.json'),

    // .bkit/runtime/ — ephemeral session state
    runtimeDir: path.join(bkitDir, 'runtime'),
    agentState: path.join(bkitDir, 'runtime', 'agent-state.json'),
    controlState: path.join(bkitDir, 'runtime', 'control-state.json'),

    // .bkit/snapshots/ — context fork snapshots
    snapshotsDir: path.join(bkitDir, 'snapshots'),

    // .bkit/audit/ — audit logs
    auditDir: path.join(bkitDir, 'audit'),

    // .bkit/checkpoints/ — checkpoint snapshots
    checkpointsDir: path.join(bkitDir, 'checkpoints'),

    // .bkit/decisions/ — decision traces
    decisionsDir: path.join(bkitDir, 'decisions'),

    // .bkit/workflows/ — workflow YAML definitions
    workflowsDir: path.join(bkitDir, 'workflows'),

    // .gemini/ — Gemini CLI native
    agentMemory: path.join(geminiDir, 'agent-memory', 'bkit'),
    policies: path.join(geminiDir, 'policies'),
    context: path.join(geminiDir, 'context'),
    teams: path.join(geminiDir, 'teams'),

    // docs/ — PDCA documents (not state files)
    planDir: path.join(projectDir, 'docs', '01-plan', 'features'),
    designDir: path.join(projectDir, 'docs', '02-design', 'features'),
    analysisDir: path.join(projectDir, 'docs', '03-analysis'),
    reportDir: path.join(projectDir, 'docs', '04-report', 'features'),
    archiveDir: path.join(projectDir, 'docs', 'archive'),
    pmDir: path.join(projectDir, 'docs', '00-pm'),

    // Legacy paths (for migration only)
    legacy: {
      pdcaStatusRoot: path.join(projectDir, '.pdca-status.json'),
      pdcaStatusDocs: path.join(projectDir, 'docs', '.pdca-status.json'),
      memoryDocs: path.join(projectDir, 'docs', '.bkit-memory.json'),
      snapshotsDocs: path.join(projectDir, 'docs', '.pdca-snapshots')
    }
  };
}

function ensureDirectories(projectDir) {
  const fs = require('fs');
  const paths = getPaths(projectDir);
  const dirs = [
    paths.stateDir, paths.runtimeDir, paths.snapshotsDir,
    paths.auditDir, paths.checkpointsDir, paths.decisionsDir,
    paths.workflowsDir, paths.batchDir, paths.resumeDir,
    paths.workflowStateDir, paths.teams, paths.pmDir
  ];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

module.exports = { getProjectDir, getPaths, ensureDirectories };
