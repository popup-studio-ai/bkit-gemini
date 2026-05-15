/**
 * ControlStateManager — capsule for .bkit/runtime/control-state.json
 *
 * Sprint: S7 v2.0.7-gemini-cli-l4-automation
 * Design: docs/01-plan/sprints/v2.0.7-gemini-cli-l4-automation-design.md §3
 * Spec: AC-T1 영속화, AC-T6 무회귀 (v1.0 → v1.1 마이그레이션 안전)
 *
 * Responsibilities:
 *   - Load control-state.json with automatic v1.0 → v1.1 migration
 *   - Atomic write (temp + rename) for cross-OS safety
 *   - Get/set field accessors
 *
 * Note: TrustScoreManager also writes to control-state.json. Both modules
 * must be consistent. ControlStateManager is the canonical read/write
 * interface; TrustScoreManager uses it indirectly via its own _load/_persist
 * which follow the same schema. Future refactor: TrustScoreManager should
 * delegate to ControlStateManager (Wave 1 Day 3+ work).
 *
 * Cross-OS: pure JavaScript. POSIX rename is atomic; on Windows NTFS the
 * single-process bkit hook assumption ensures no concurrent writes.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SCHEMA_VERSION = '1.1';

function statePath(projectDir) {
  return path.join(projectDir, '.bkit', 'runtime', 'control-state.json');
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function defaultState() {
  return {
    version: SCHEMA_VERSION,
    currentLevel: 2,
    previousLevel: null,
    levelChangedAt: null,
    levelChangeReason: null,
    trustScore: 40,
    sessionStats: {
      approvals: 0,
      rejections: 0,
      modifications: 0,
      destructiveBlocked: 0,
      checkpointsCreated: 0,
      rollbacksPerformed: 0
    },
    emergencyStop: false,
    cooldownUntil: null,
    lastEscalation: null,
    lastDowngrade: null,
    automationHistory: [],
    recentDecisions: []
  };
}

function migrate(state) {
  if (!state || typeof state !== 'object') return defaultState();
  if (state.version === SCHEMA_VERSION) {
    // ensure v1.1 fields exist (defensive)
    if (!Array.isArray(state.automationHistory)) state.automationHistory = [];
    if (!Array.isArray(state.recentDecisions)) state.recentDecisions = [];
    return state;
  }
  // v1.0 → v1.1: append new arrays, preserve all existing fields
  const migrated = {
    ...state,
    version: SCHEMA_VERSION,
    automationHistory: Array.isArray(state.automationHistory) ? state.automationHistory : [],
    recentDecisions: Array.isArray(state.recentDecisions) ? state.recentDecisions : []
  };
  return migrated;
}

class ControlStateManager {
  constructor(projectDir) {
    this.projectDir = projectDir;
    this.path = statePath(projectDir);
    this.state = null;
  }

  load() {
    try {
      if (fs.existsSync(this.path)) {
        const raw = fs.readFileSync(this.path, 'utf-8');
        this.state = migrate(JSON.parse(raw));
      } else {
        this.state = defaultState();
      }
    } catch (e) {
      // corrupt file → start fresh, but do NOT overwrite (let caller decide)
      this.state = defaultState();
    }
    return this.state;
  }

  save() {
    if (!this.state) this.load();
    ensureDir(this.path);
    const tmpPath = `${this.path}.tmp.${process.pid}.${Date.now()}`;
    fs.writeFileSync(tmpPath, JSON.stringify(this.state, null, 2) + '\n', 'utf-8');
    fs.renameSync(tmpPath, this.path);
  }

  get(field) {
    if (!this.state) this.load();
    return this.state[field];
  }

  set(field, value) {
    if (!this.state) this.load();
    this.state[field] = value;
  }

  raw() {
    if (!this.state) this.load();
    return this.state;
  }
}

module.exports = ControlStateManager;
module.exports.SCHEMA_VERSION = SCHEMA_VERSION;
module.exports.defaultState = defaultState;
module.exports.migrate = migrate;
