/**
 * TrustScoreManager — dynamic trust score + automation level transitions
 *
 * Sprint: S7 v2.0.7-gemini-cli-l4-automation (Prerequisite)
 * Design: docs/01-plan/sprints/v2.0.7-gemini-cli-l4-automation-design.md §2 + §6.1
 * Spec: AC-T4 auto-downgrade + AC-T13 mutation score >= 85%
 *
 * Algorithm:
 *   - success allow: score = min(100, score + 5)
 *   - rejection:     score = max(0,   score - 10)
 *   - 100ms boundary cooldown filters duplicate/noise decisions
 *
 * Level transitions:
 *   - L0~L2 → L3: trust >= 60, recent 5 rejections <= 1
 *   - L0~L3 → L4: trust >= 80, recent 10 rejections == 0, no active 24h cooldown
 *   - L3/L4 → L2: 5 consecutive rejections (auto, +24h cooldown)
 *   - L3/L4 → L3: hard deny (destructive op, no cooldown)
 *   - any → L0: emergencyStop()
 *
 * Persistence: .bkit/runtime/control-state.json (atomic write, debounce 100ms)
 *
 * Cross-OS: pure JavaScript. macOS / Windows / Linux / WSL / Git Bash compatible.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const CONTROL_STATE_VERSION = '1.1';
const DEFAULT_SCORE = 40;
const DEFAULT_LEVEL = 2;
const SCORE_MAX = 100;
const SCORE_MIN = 0;
const SCORE_DELTA_ALLOW = 5;
const SCORE_DELTA_REJECTION = 10;
const BOUNDARY_MS = 100;
const COOLDOWN_DOWNGRADE_MS = 24 * 60 * 60 * 1000; // 24h
const RECENT_DECISIONS_LIMIT = 50;
const CONSECUTIVE_REJECTION_THRESHOLD = 5;

const LEVEL_ESCALATION_REQUIREMENTS = {
  1: { minScore: 20, recentWindow: 5, maxRecentRejections: Infinity },
  2: { minScore: 40, recentWindow: 5, maxRecentRejections: 2 },
  3: { minScore: 60, recentWindow: 5, maxRecentRejections: 1 },
  4: { minScore: 80, recentWindow: 10, maxRecentRejections: 0 }
};

function controlStatePath(projectDir) {
  return path.join(projectDir, '.bkit', 'runtime', 'control-state.json');
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function atomicWrite(filePath, content) {
  ensureDir(filePath);
  const tmpPath = `${filePath}.tmp.${process.pid}.${Date.now()}`;
  fs.writeFileSync(tmpPath, content, 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

function createDefaultState() {
  return {
    version: CONTROL_STATE_VERSION,
    currentLevel: DEFAULT_LEVEL,
    previousLevel: null,
    levelChangedAt: null,
    levelChangeReason: null,
    trustScore: DEFAULT_SCORE,
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

function migrateState(state) {
  if (!state) return createDefaultState();
  if (state.version === CONTROL_STATE_VERSION) {
    // ensure v1.1 fields exist
    if (!state.automationHistory) state.automationHistory = [];
    if (!state.recentDecisions) state.recentDecisions = [];
    return state;
  }
  // v1.0 → v1.1
  return {
    ...state,
    version: CONTROL_STATE_VERSION,
    automationHistory: state.automationHistory || [],
    recentDecisions: state.recentDecisions || []
  };
}

class TrustScoreManager {
  constructor(projectDir) {
    this.projectDir = projectDir;
    this.path = controlStatePath(projectDir);
    this.state = this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.path)) {
        const raw = fs.readFileSync(this.path, 'utf-8');
        return migrateState(JSON.parse(raw));
      }
    } catch (e) {
      // graceful: corrupt file → start fresh
    }
    return createDefaultState();
  }

  _persist() {
    try {
      atomicWrite(this.path, JSON.stringify(this.state, null, 2) + '\n');
    } catch (e) {
      // persistence failure must not block hook execution
    }
  }

  // Test helper (read-only snapshot)
  _stateForTest() {
    return JSON.parse(JSON.stringify(this.state));
  }

  getScore() {
    return this.state.trustScore;
  }

  getLevel() {
    return this.state.currentLevel;
  }

  /**
   * Record a decision. Updates score + history + checks auto-downgrade.
   * @param {Object} decision { type, tool, timestamp, durationMs, rejected? }
   * @returns {Object|null} downgrade info if triggered, else null
   */
  recordDecision(decision) {
    // Rejections are ALWAYS recorded — safety must not be filtered by noise boundary.
    // Only allow-type decisions are subject to the 100ms boundary (D3 noise filter).
    const isRejection = decision.type === 'rejection' || decision.rejected;
    if (!isRejection && !this._shouldRecord(decision)) return null;

    // Append to recent window (sliding 50)
    this.state.recentDecisions.push({
      type: decision.type,
      tool: decision.tool,
      timestamp: decision.timestamp,
      durationMs: decision.durationMs || 0,
      rejected: !!decision.rejected
    });
    if (this.state.recentDecisions.length > RECENT_DECISIONS_LIMIT) {
      this.state.recentDecisions.shift();
    }

    // Adjust score
    if (decision.type === 'allow' && !decision.rejected) {
      this.state.trustScore = Math.min(SCORE_MAX, this.state.trustScore + SCORE_DELTA_ALLOW);
      this.state.sessionStats.approvals++;
    } else if (decision.type === 'rejection' || decision.rejected) {
      this.state.trustScore = Math.max(SCORE_MIN, this.state.trustScore - SCORE_DELTA_REJECTION);
      this.state.sessionStats.rejections++;
    }

    // Auto-downgrade check
    const downgradeInfo = this.shouldDowngrade();
    if (downgradeInfo) {
      this.downgrade(downgradeInfo.to, downgradeInfo.reason);
    }

    this._persist();
    return downgradeInfo;
  }

  _shouldRecord(decision) {
    const last = this.state.recentDecisions.slice(-1)[0];
    if (!last) return true;
    const diff = decision.timestamp - last.timestamp;
    // Within 100ms boundary → ignore as noise duplicate
    if (diff >= 0 && diff < BOUNDARY_MS) return false;
    return true;
  }

  /**
   * Check if target level can be entered.
   */
  canEscalate(targetLevel) {
    if (targetLevel <= this.state.currentLevel) return true;
    if (this.state.emergencyStop) return false;
    if (this.state.cooldownUntil && Date.now() < this.state.cooldownUntil) return false;

    const req = LEVEL_ESCALATION_REQUIREMENTS[targetLevel];
    if (!req) return false;

    if (this.state.trustScore < req.minScore) return false;

    const rejections = this._countRecentRejections(req.recentWindow);
    if (rejections > req.maxRecentRejections) return false;

    return true;
  }

  _countRecentRejections(windowSize) {
    const recent = this.state.recentDecisions.slice(-windowSize);
    return recent.filter(d => d.type === 'rejection' || d.rejected).length;
  }

  /**
   * Manually escalate to target level. Persists if successful.
   * @returns {boolean} success
   */
  escalate(targetLevel, reason) {
    if (!this.canEscalate(targetLevel)) return false;

    this.state.previousLevel = this.state.currentLevel;
    this.state.currentLevel = targetLevel;
    this.state.levelChangedAt = new Date().toISOString();
    this.state.levelChangeReason = reason || 'manual escalation';
    this.state.lastEscalation = this.state.levelChangedAt;
    this.state.automationHistory.push({
      from: this.state.previousLevel,
      to: targetLevel,
      reason: this.state.levelChangeReason,
      timestamp: this.state.levelChangedAt,
      kind: 'escalate'
    });

    this._persist();
    return true;
  }

  /**
   * Detect if auto-downgrade should fire.
   * @returns {Object|null} { from, to, reason } or null
   */
  shouldDowngrade() {
    if (this.state.currentLevel <= 2) return null;

    const recent = this.state.recentDecisions.slice(-CONSECUTIVE_REJECTION_THRESHOLD);
    if (recent.length < CONSECUTIVE_REJECTION_THRESHOLD) return null;

    const allRejection = recent.every(d => d.type === 'rejection' || d.rejected);
    if (allRejection) {
      return {
        from: this.state.currentLevel,
        to: 2,
        reason: `auto: ${CONSECUTIVE_REJECTION_THRESHOLD} consecutive rejections`
      };
    }
    return null;
  }

  /**
   * Downgrade to target level. Sets cooldown for soft downgrades.
   */
  downgrade(targetLevel, reason) {
    const from = this.state.currentLevel;
    this.state.previousLevel = from;
    this.state.currentLevel = targetLevel;
    this.state.levelChangedAt = new Date().toISOString();
    this.state.levelChangeReason = reason || 'auto downgrade';
    this.state.lastDowngrade = this.state.levelChangedAt;

    // 24h cooldown for soft downgrade (consecutive rejection).
    // Hard deny downgrade does NOT set cooldown (per design §2.3).
    const isHardDeny = /destructive|hard deny|D6/i.test(reason || '');
    if (!isHardDeny) {
      this.state.cooldownUntil = Date.now() + COOLDOWN_DOWNGRADE_MS;
    } else {
      this.state.cooldownUntil = null;
    }

    this.state.automationHistory.push({
      from,
      to: targetLevel,
      reason: this.state.levelChangeReason,
      timestamp: this.state.levelChangedAt,
      kind: isHardDeny ? 'downgrade-hard' : 'downgrade-soft'
    });

    this._persist();
  }

  /**
   * Emergency stop — immediately L0, blocks all escalation.
   */
  emergencyStop() {
    const from = this.state.currentLevel;
    this.state.previousLevel = from;
    this.state.currentLevel = 0;
    this.state.emergencyStop = true;
    this.state.levelChangedAt = new Date().toISOString();
    this.state.levelChangeReason = 'emergency_stop';
    this.state.lastDowngrade = this.state.levelChangedAt;
    this.state.automationHistory.push({
      from,
      to: 0,
      reason: 'emergency_stop',
      timestamp: this.state.levelChangedAt,
      kind: 'emergency'
    });
    this._persist();
  }

  /**
   * Release emergency stop (session-end hook). Restores previous level only if safe.
   */
  releaseEmergencyStop() {
    if (!this.state.emergencyStop) return;
    this.state.emergencyStop = false;
    this._persist();
  }
}

module.exports = TrustScoreManager;
module.exports.CONTROL_STATE_VERSION = CONTROL_STATE_VERSION;
module.exports.DEFAULT_SCORE = DEFAULT_SCORE;
module.exports.DEFAULT_LEVEL = DEFAULT_LEVEL;
