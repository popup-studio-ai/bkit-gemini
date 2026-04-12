/**
 * Checkpoint Manager
 * CRUD operations for development checkpoints.
 * Storage: .bkit/checkpoints/{feature}/{id}.json
 *
 * @module mcp/tools/checkpoint-manager
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Execute a checkpoint operation
 * @param {object} params
 * @param {string} params.action - Operation: create, list, restore, delete
 * @param {string} params.projectDir - Project root directory
 * @param {string} [params.feature] - Feature name
 * @param {string} [params.checkpointId] - Checkpoint ID (for restore/delete)
 * @param {string} [params.label] - Human-readable label (for create)
 * @returns {object} Operation result
 */
function execute({ action, feature, projectDir, checkpointId, label }) {
  const baseDir = path.join(projectDir, '.bkit', 'checkpoints');
  const featureDir = feature ? path.join(baseDir, sanitizeName(feature)) : baseDir;

  switch (action) {
    case 'create': {
      fs.mkdirSync(featureDir, { recursive: true });

      const id = `chk-${Date.now()}`;
      const gitHash = safeExec('git rev-parse HEAD', projectDir).trim();
      const gitDiff = safeExec('git diff --stat', projectDir);

      // Read PDCA status if available
      let pdcaStatus = null;
      const pdcaPath = path.join(projectDir, '.pdca-status.json');
      if (fs.existsSync(pdcaPath)) {
        try {
          pdcaStatus = JSON.parse(fs.readFileSync(pdcaPath, 'utf-8'));
        } catch {
          // ignore
        }
      }

      const checkpoint = {
        id,
        feature: feature || 'unknown',
        label: label || `Checkpoint at ${new Date().toISOString()}`,
        gitHash,
        gitDiff: gitDiff.trim(),
        createdAt: new Date().toISOString(),
        pdcaStatus,
        files: getTrackedFileCount(projectDir)
      };

      fs.writeFileSync(
        path.join(featureDir, `${id}.json`),
        JSON.stringify(checkpoint, null, 2)
      );

      return { success: true, checkpoint };
    }

    case 'list': {
      if (!fs.existsSync(featureDir)) {
        return { success: true, checkpoints: [], total: 0 };
      }

      const files = fs.readdirSync(featureDir).filter(f => f.endsWith('.json'));
      const checkpoints = [];

      for (const f of files) {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(featureDir, f), 'utf-8'));
          checkpoints.push({
            id: data.id,
            feature: data.feature,
            label: data.label,
            gitHash: data.gitHash,
            createdAt: data.createdAt,
            files: data.files
          });
        } catch {
          // Skip malformed checkpoint files
        }
      }

      checkpoints.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      return { success: true, checkpoints, total: checkpoints.length };
    }

    case 'restore': {
      if (!checkpointId) {
        return { success: false, error: 'checkpointId is required for restore' };
      }

      const chkPath = findCheckpointFile(baseDir, checkpointId);
      if (!chkPath) {
        return { success: false, error: `Checkpoint not found: ${checkpointId}` };
      }

      const checkpoint = JSON.parse(fs.readFileSync(chkPath, 'utf-8'));

      // Stash current changes, then checkout the checkpoint commit
      safeExec('git stash', projectDir);
      const checkoutResult = safeExec(`git checkout ${checkpoint.gitHash}`, projectDir);

      // Restore PDCA status if available
      if (checkpoint.pdcaStatus) {
        const pdcaPath = path.join(projectDir, '.pdca-status.json');
        fs.writeFileSync(pdcaPath, JSON.stringify(checkpoint.pdcaStatus, null, 2));
      }

      return {
        success: true,
        restoredTo: checkpoint.gitHash,
        label: checkpoint.label,
        checkoutResult: checkoutResult.trim()
      };
    }

    case 'delete': {
      if (!checkpointId) {
        return { success: false, error: 'checkpointId is required for delete' };
      }

      const chkPath = findCheckpointFile(baseDir, checkpointId);
      if (!chkPath) {
        return { success: false, error: `Checkpoint not found: ${checkpointId}` };
      }

      fs.unlinkSync(chkPath);
      return { success: true, deleted: checkpointId };
    }

    default:
      return { success: false, error: `Unknown action: ${action}` };
  }
}

/**
 * Find a checkpoint file by ID across all feature directories
 */
function findCheckpointFile(baseDir, checkpointId) {
  if (!fs.existsSync(baseDir)) return null;

  // Check directly in baseDir
  const directPath = path.join(baseDir, `${checkpointId}.json`);
  if (fs.existsSync(directPath)) return directPath;

  // Search in feature subdirectories
  const dirs = fs.readdirSync(baseDir, { withFileTypes: true })
    .filter(d => d.isDirectory());

  for (const dir of dirs) {
    const chkPath = path.join(baseDir, dir.name, `${checkpointId}.json`);
    if (fs.existsSync(chkPath)) return chkPath;
  }

  return null;
}

/**
 * Get count of git-tracked files
 */
function getTrackedFileCount(projectDir) {
  const output = safeExec('git ls-files', projectDir);
  return output.split('\n').filter(f => f.trim()).length;
}

/**
 * Sanitize a name for use in file paths
 */
function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, '-');
}

/**
 * Safe shell execution
 */
function safeExec(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', timeout: 10000 });
  } catch (err) {
    return err.message || '';
  }
}

module.exports = { execute };
