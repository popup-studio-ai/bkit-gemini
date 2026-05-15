/**
 * CheckpointManager — automatic checkpoint + rollback for L4 safety
 *
 * Sprint: S7 v2.0.7-gemini-cli-l4-automation (Wave 1 Day 3)
 * Design: docs/01-plan/sprints/v2.0.7-gemini-cli-l4-automation-design.md §3.5
 * Spec: AC-T5 (checkpoint+rollback 3 시나리오), D8 (auto checkpoint before code mods)
 *
 * Storage: .bkit/checkpoints/{checkpointId}.json
 * Schema:
 *   {
 *     id: uuid,
 *     timestamp: ISO8601,
 *     operation: 'Edit'|'Write'|'Bash'|...,
 *     tool: string,
 *     reason: string,
 *     files: [{ path, beforeContent, beforeMTime, beforeSHA256 }],
 *     createdBy: 'bkit vX.X.X hook before-tool.js'
 *   }
 *
 * Cross-OS: pure JavaScript. POSIX rename atomic; Windows best-effort.
 *
 * Existing mcp/tools/checkpoint-manager.js handles MCP-side ops; this lib/core/
 * module is the file-system-level capture/restore primitive used by hooks.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RETENTION_DAYS = 90;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB safety cap per file

function checkpointDir(projectDir) {
  return path.join(projectDir, '.bkit', 'checkpoints');
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function generateId() {
  // RFC 4122 v4 UUID
  if (crypto.randomUUID) return crypto.randomUUID();
  return [8, 4, 4, 4, 12].map(n => crypto.randomBytes(n / 2).toString('hex')).join('-');
}

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function captureFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { path: filePath, beforeContent: null, beforeMTime: null, beforeSHA256: null, exists: false };
  }
  const stat = fs.statSync(filePath);
  if (stat.size > MAX_FILE_SIZE_BYTES) {
    // Refuse to checkpoint very large files (binary, build artifacts, etc.)
    return { path: filePath, beforeContent: null, beforeMTime: stat.mtimeMs, beforeSHA256: null, exists: true, skipped: 'oversize' };
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return {
    path: filePath,
    beforeContent: content,
    beforeMTime: stat.mtimeMs,
    beforeSHA256: sha256(content),
    exists: true
  };
}

class CheckpointManager {
  constructor(projectDir) {
    this.projectDir = projectDir;
  }

  /**
   * Create a checkpoint capturing current state of `files` before an operation.
   * @returns {string} checkpointId
   */
  create(operation, files, options) {
    const opts = options || {};
    const id = generateId();
    const cp = {
      id,
      timestamp: new Date().toISOString(),
      operation,
      tool: opts.tool || operation,
      reason: opts.reason || 'auto-checkpoint',
      files: (files || []).map(captureFile),
      createdBy: opts.createdBy || `bkit v2.0.7 hook (${operation})`
    };
    const dir = checkpointDir(this.projectDir);
    ensureDir(dir);
    const cpPath = path.join(dir, `${id}.json`);
    const tmpPath = `${cpPath}.tmp.${process.pid}.${Date.now()}`;
    fs.writeFileSync(tmpPath, JSON.stringify(cp, null, 2));
    fs.renameSync(tmpPath, cpPath);
    return id;
  }

  /**
   * List recent checkpoints.
   * @param {{ from?: Date, to?: Date, limit?: number }} options
   */
  list(options) {
    const opts = options || {};
    const limit = opts.limit || 50;
    const dir = checkpointDir(this.projectDir);
    if (!fs.existsSync(dir)) return [];
    try {
      const entries = fs.readdirSync(dir)
        .filter(f => f.endsWith('.json') && !f.includes('.tmp.'))
        .map(f => {
          const full = path.join(dir, f);
          try {
            const cp = JSON.parse(fs.readFileSync(full, 'utf-8'));
            return cp;
          } catch (e) { return null; }
        })
        .filter(Boolean)
        .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
        .slice(0, limit);
      return entries;
    } catch (e) {
      return [];
    }
  }

  /**
   * Get a checkpoint by ID.
   * @returns {Object|null}
   */
  get(checkpointId) {
    const cpPath = path.join(checkpointDir(this.projectDir), `${checkpointId}.json`);
    if (!fs.existsSync(cpPath)) return null;
    try {
      return JSON.parse(fs.readFileSync(cpPath, 'utf-8'));
    } catch (e) {
      return null;
    }
  }

  /**
   * Rollback to checkpoint state. Restores each file's beforeContent.
   * Safety guards:
   *   - If file was modified after checkpoint (mtime mismatch), report conflict.
   *   - If `force` not set and conflict detected, refuse rollback.
   * @param {string} checkpointId
   * @param {{ force?: boolean }} options
   * @returns {{ success: boolean, restored: string[], conflicts: string[], errors: string[] }}
   */
  rollback(checkpointId, options) {
    const opts = options || {};
    const cp = this.get(checkpointId);
    if (!cp) {
      return { success: false, restored: [], conflicts: [], errors: ['checkpoint not found'] };
    }
    const restored = [];
    const conflicts = [];
    const errors = [];

    for (const file of cp.files) {
      try {
        if (file.skipped === 'oversize') {
          errors.push(`${file.path}: skipped (oversize at capture time)`);
          continue;
        }
        if (file.exists === false) {
          // file didn't exist at capture time → delete current if present
          if (fs.existsSync(file.path)) {
            if (!opts.force && file.beforeMTime !== null) {
              conflicts.push(`${file.path}: did not exist at checkpoint, now exists`);
              continue;
            }
            fs.unlinkSync(file.path);
          }
          restored.push(file.path);
          continue;
        }
        // Conflict detection: current mtime/sha differs?
        if (fs.existsSync(file.path)) {
          const stat = fs.statSync(file.path);
          if (stat.mtimeMs !== file.beforeMTime && !opts.force) {
            const currentContent = fs.readFileSync(file.path, 'utf-8');
            if (sha256(currentContent) !== file.beforeSHA256) {
              conflicts.push(`${file.path}: modified after checkpoint (mtime/sha mismatch)`);
              continue;
            }
          }
        }
        // Restore beforeContent
        ensureDir(path.dirname(file.path));
        const tmpPath = `${file.path}.bkit-rollback.${Date.now()}`;
        fs.writeFileSync(tmpPath, file.beforeContent);
        fs.renameSync(tmpPath, file.path);
        restored.push(file.path);
      } catch (e) {
        errors.push(`${file.path}: ${e.message}`);
      }
    }

    return {
      success: conflicts.length === 0 && errors.length === 0,
      restored,
      conflicts,
      errors
    };
  }

  /**
   * Purge checkpoints older than retentionDays.
   * @returns {number} count purged
   */
  purge(olderThanDays) {
    const days = olderThanDays || RETENTION_DAYS;
    const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;
    const dir = checkpointDir(this.projectDir);
    if (!fs.existsSync(dir)) return 0;
    let count = 0;
    try {
      const entries = fs.readdirSync(dir);
      for (const f of entries) {
        if (!f.endsWith('.json')) continue;
        const full = path.join(dir, f);
        try {
          const cp = JSON.parse(fs.readFileSync(full, 'utf-8'));
          if (cp.timestamp) {
            const ts = new Date(cp.timestamp).getTime();
            if (ts < cutoffMs) {
              fs.unlinkSync(full);
              count++;
            }
          }
        } catch (e) { /* ignore individual */ }
      }
    } catch (e) { /* ignore */ }
    return count;
  }
}

module.exports = CheckpointManager;
module.exports.RETENTION_DAYS = RETENTION_DAYS;
module.exports.captureFile = captureFile;
