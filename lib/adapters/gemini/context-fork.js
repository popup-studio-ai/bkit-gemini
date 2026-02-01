/**
 * Context Fork Simulation for Gemini CLI
 * Provides context isolation for analysis agents (GAP-01)
 *
 * Philosophy: FR-03 (No Guessing) - Analysis agents must not modify main state during exploration
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FORK_STORAGE_DIR = '.pdca-snapshots';

// Lazy load for project directory
let _projectDir = null;
function getProjectDir() {
  if (_projectDir) return _projectDir;

  try {
    const { getAdapter } = require('../index');
    _projectDir = getAdapter().getProjectDir();
  } catch {
    _projectDir = process.cwd();
  }

  return _projectDir;
}

/**
 * Generate unique fork ID
 * @returns {string}
 */
function generateForkId() {
  return crypto.randomUUID();
}

/**
 * Ensure directory exists
 * @param {string} dirPath
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Read JSON file safely
 * @param {string} filePath
 * @returns {object|null}
 */
function readJsonSync(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Write JSON file
 * @param {string} filePath
 * @param {object} data
 */
function writeJsonSync(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Read current PDCA status
 * @param {string} projectDir
 * @returns {object}
 */
function readPdcaStatus(projectDir) {
  const statusPath = path.join(projectDir, 'docs', '.pdca-status.json');
  return readJsonSync(statusPath) || { version: '2.0', activeFeatures: {}, features: {} };
}

/**
 * Read current memory
 * @param {string} projectDir
 * @returns {object}
 */
function readMemory(projectDir) {
  const memoryPath = path.join(projectDir, 'docs', '.bkit-memory.json');
  return readJsonSync(memoryPath) || { version: '1.0', data: {} };
}

/**
 * Write PDCA status
 * @param {string} projectDir
 * @param {object} status
 */
function writePdcaStatus(projectDir, status) {
  const statusPath = path.join(projectDir, 'docs', '.pdca-status.json');
  ensureDir(path.dirname(statusPath));
  writeJsonSync(statusPath, status);
}

/**
 * Deep merge objects
 * @param {object} target
 * @param {object} source
 * @returns {object}
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else if (Array.isArray(source[key])) {
      // For arrays, union and dedupe
      const existing = Array.isArray(result[key]) ? result[key] : [];
      result[key] = [...new Set([...existing, ...source[key]])];
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * Create a new context fork
 * Snapshots current state for isolated execution
 *
 * @param {string} agentName - Name of agent requesting fork
 * @param {object} options - Fork options
 * @param {boolean} options.mergeResult - Whether to merge results back (default: true)
 * @param {string} options.projectDir - Project directory override
 * @returns {{forkId: string, snapshotPath: string}}
 */
function forkContext(agentName, options = {}) {
  const forkId = generateForkId();
  const projectDir = options.projectDir || getProjectDir();

  // 1. Snapshot current state
  const snapshot = {
    forkId,
    agentName,
    createdAt: new Date().toISOString(),
    pdcaStatus: readPdcaStatus(projectDir),
    memory: readMemory(projectDir),
    options: {
      mergeResult: options.mergeResult !== false,
      ...options
    }
  };

  // 2. Store snapshot
  const snapshotDir = path.join(projectDir, 'docs', FORK_STORAGE_DIR);
  ensureDir(snapshotDir);

  const snapshotPath = path.join(snapshotDir, `fork-${forkId}.json`);
  writeJsonSync(snapshotPath, snapshot);

  // 3. Return fork reference
  return {
    forkId,
    snapshotPath,
    agentName,
    createdAt: snapshot.createdAt
  };
}

/**
 * Merge forked context back to main
 * Combines fork results with current main state
 *
 * @param {string} forkId - Fork identifier
 * @param {object} forkResult - Result data from fork execution
 * @param {object} mergeOptions - Merge strategy options
 * @param {string} mergeOptions.strategy - 'smart'|'replace'|'append' (default: 'smart')
 * @param {string} mergeOptions.projectDir - Project directory override
 * @returns {{success: boolean, merged?: object, error?: string}}
 */
function mergeForkedContext(forkId, forkResult = {}, mergeOptions = {}) {
  const projectDir = mergeOptions.projectDir || getProjectDir();
  const snapshotDir = path.join(projectDir, 'docs', FORK_STORAGE_DIR);
  const snapshotPath = path.join(snapshotDir, `fork-${forkId}.json`);

  if (!fs.existsSync(snapshotPath)) {
    return {
      success: false,
      error: `Fork ${forkId} not found`
    };
  }

  try {
    const snapshot = readJsonSync(snapshotPath);
    const currentStatus = readPdcaStatus(projectDir);

    // Merge strategy
    const strategy = mergeOptions.strategy || 'smart';
    let merged;

    if (strategy === 'replace') {
      // Replace current with fork result
      merged = {
        ...currentStatus,
        ...forkResult
      };
    } else if (strategy === 'append') {
      // Append only new items
      merged = {
        ...currentStatus,
        history: [
          ...(currentStatus.history || []),
          ...(forkResult.history || [])
        ]
      };
    } else {
      // Smart merge (default)
      merged = {
        ...currentStatus,
        // Merge activeFeatures arrays (dedupe)
        activeFeatures: typeof currentStatus.activeFeatures === 'object'
          ? deepMerge(currentStatus.activeFeatures, forkResult.activeFeatures || {})
          : currentStatus.activeFeatures,
        // Deep merge features object
        features: deepMerge(currentStatus.features || {}, forkResult.features || {}),
        // Add fork merge to history
        history: [
          ...(currentStatus.history || []),
          {
            timestamp: new Date().toISOString(),
            action: 'fork_merged',
            feature: snapshot.agentName,
            details: `Merged fork ${forkId} from agent ${snapshot.agentName}`
          }
        ],
        lastUpdated: new Date().toISOString()
      };
    }

    // Write merged state
    writePdcaStatus(projectDir, merged);

    // Cleanup snapshot
    fs.unlinkSync(snapshotPath);

    return {
      success: true,
      merged,
      forkId,
      agentName: snapshot.agentName
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Discard a forked context without merging
 * Deletes snapshot, no changes to main state
 *
 * @param {string} forkId - Fork identifier
 * @param {object} options - Options
 * @param {string} options.projectDir - Project directory override
 * @returns {{success: boolean, error?: string}}
 */
function discardFork(forkId, options = {}) {
  const projectDir = options.projectDir || getProjectDir();
  const snapshotDir = path.join(projectDir, 'docs', FORK_STORAGE_DIR);
  const snapshotPath = path.join(snapshotDir, `fork-${forkId}.json`);

  try {
    if (fs.existsSync(snapshotPath)) {
      const snapshot = readJsonSync(snapshotPath);
      fs.unlinkSync(snapshotPath);

      return {
        success: true,
        forkId,
        agentName: snapshot?.agentName,
        discardedAt: new Date().toISOString()
      };
    }

    return {
      success: true,
      forkId,
      message: 'Fork already discarded or not found'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * List all active forks
 *
 * @param {object} options - Options
 * @param {string} options.projectDir - Project directory override
 * @returns {Array<{forkId: string, agentName: string, createdAt: string}>}
 */
function listActiveForks(options = {}) {
  const projectDir = options.projectDir || getProjectDir();
  const snapshotDir = path.join(projectDir, 'docs', FORK_STORAGE_DIR);

  if (!fs.existsSync(snapshotDir)) {
    return [];
  }

  try {
    return fs.readdirSync(snapshotDir)
      .filter(f => f.startsWith('fork-') && f.endsWith('.json'))
      .map(f => {
        const snapshot = readJsonSync(path.join(snapshotDir, f));
        if (!snapshot) return null;

        return {
          forkId: snapshot.forkId,
          agentName: snapshot.agentName,
          createdAt: snapshot.createdAt,
          mergeResult: snapshot.options?.mergeResult
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Get fork details by ID
 *
 * @param {string} forkId - Fork identifier
 * @param {object} options - Options
 * @returns {object|null}
 */
function getFork(forkId, options = {}) {
  const projectDir = options.projectDir || getProjectDir();
  const snapshotDir = path.join(projectDir, 'docs', FORK_STORAGE_DIR);
  const snapshotPath = path.join(snapshotDir, `fork-${forkId}.json`);

  if (!fs.existsSync(snapshotPath)) {
    return null;
  }

  return readJsonSync(snapshotPath);
}

/**
 * Cleanup old forks (older than maxAge)
 *
 * @param {object} options - Options
 * @param {number} options.maxAgeMs - Max age in milliseconds (default: 24 hours)
 * @param {string} options.projectDir - Project directory override
 * @returns {{cleaned: number, remaining: number}}
 */
function cleanupOldForks(options = {}) {
  const maxAgeMs = options.maxAgeMs || 24 * 60 * 60 * 1000; // 24 hours
  const projectDir = options.projectDir || getProjectDir();
  const snapshotDir = path.join(projectDir, 'docs', FORK_STORAGE_DIR);

  if (!fs.existsSync(snapshotDir)) {
    return { cleaned: 0, remaining: 0 };
  }

  const now = Date.now();
  let cleaned = 0;
  let remaining = 0;

  try {
    const files = fs.readdirSync(snapshotDir)
      .filter(f => f.startsWith('fork-') && f.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(snapshotDir, file);
      const snapshot = readJsonSync(filePath);

      if (snapshot && snapshot.createdAt) {
        const age = now - new Date(snapshot.createdAt).getTime();

        if (age > maxAgeMs) {
          fs.unlinkSync(filePath);
          cleaned++;
        } else {
          remaining++;
        }
      }
    }
  } catch {
    // Ignore errors
  }

  return { cleaned, remaining };
}

module.exports = {
  FORK_STORAGE_DIR,
  forkContext,
  mergeForkedContext,
  discardFork,
  listActiveForks,
  getFork,
  cleanupOldForks,
  // Utilities exported for testing
  generateForkId,
  deepMerge
};
