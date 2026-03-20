/**
 * Path Registry - Centralized state file path management
 * Single source of truth for all bkit state file paths.
 * @version 2.0.0
 */
const path = require('path');

function getPaths(projectDir) {
  const bkitDir = path.join(projectDir, '.bkit');
  const geminiDir = path.join(projectDir, '.gemini');

  return {
    // PDCA
    pdcaStatus: path.join(projectDir, '.pdca-status.json'),

    // bkit state
    stateDir: path.join(bkitDir, 'state'),
    runtimeDir: path.join(bkitDir, 'runtime'),
    snapshotsDir: path.join(bkitDir, 'snapshots'),
    memory: path.join(bkitDir, 'state', 'memory.json'),

    // Gemini native
    agentMemory: path.join(geminiDir, 'agent-memory', 'bkit'),
    policies: path.join(geminiDir, 'policies'),
    context: path.join(geminiDir, 'context'),
    teams: path.join(geminiDir, 'teams'),

    // Docs
    planDir: path.join(projectDir, 'docs', '01-plan', 'features'),
    designDir: path.join(projectDir, 'docs', '02-design', 'features'),
    analysisDir: path.join(projectDir, 'docs', '03-analysis'),
    reportDir: path.join(projectDir, 'docs', '04-report', 'features'),
    archiveDir: path.join(projectDir, 'docs', 'archive'),
    pmDir: path.join(projectDir, 'docs', '00-pm')
  };
}

function ensureDirectories(projectDir) {
  const fs = require('fs');
  const paths = getPaths(projectDir);
  const dirs = [paths.stateDir, paths.runtimeDir, paths.snapshotsDir, paths.teams, paths.pmDir];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

module.exports = { getPaths, ensureDirectories };
