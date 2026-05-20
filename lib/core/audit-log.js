/**
 * AuditLogger — JSONL append-only audit log for hook decisions
 *
 * Sprint: S7 v2.0.7-gemini-cli-l4-automation
 * Design: docs/01-plan/sprints/v2.0.7-gemini-cli-l4-automation-design.md §7.4
 * Spec: AC-T8 audit log grep-able, D17 JSONL migration, 90d retention
 *
 * Location: .bkit/state/audit/{YYYY-MM-DD}/decisions.jsonl
 *
 * Schema (per line):
 *   {
 *     ts: ISO8601,
 *     event: 'ALLOW'|'DENY'|'ASK'|'BLOCK',
 *     tool: string,
 *     decision: 'allow'|'deny'|'ask',
 *     reason: string,
 *     durationMs?: number,
 *     success?: boolean|null,
 *     score_after?: number,
 *     level_after?: number,
 *     hook?: 'BeforeTool'|'AfterTool'|'BeforePhase'|'SessionStart'|'SessionEnd'
 *   }
 *
 * Legacy compatibility: hooks/scripts/before-tool.js still uses
 * writeSecurityAuditLog() → .gemini/security-audit.log (text format).
 * That function is preserved for backwards compatibility. New code should
 * use AuditLogger.append() with JSONL schema.
 *
 * Cross-OS: pure JS. POSIX/Windows fs.appendFileSync atomicity is
 * sufficient for single-process bkit hooks.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const RETENTION_DAYS = 90;

function todayDir(projectDir) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(projectDir, '.bkit', 'state', 'audit', today);
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

class AuditLogger {
  constructor(projectDir) {
    this.projectDir = projectDir;
  }

  /**
   * Append a decision entry to today's JSONL.
   * @param {Object} entry — decision shape (see header)
   */
  append(entry) {
    try {
      const dir = todayDir(this.projectDir);
      ensureDir(dir);
      const file = path.join(dir, 'decisions.jsonl');
      const enriched = {
        ts: entry.ts || new Date().toISOString(),
        ...entry
      };
      fs.appendFileSync(file, JSON.stringify(enriched) + '\n', 'utf-8');
    } catch (e) {
      // audit failure must NOT block hook execution (graceful)
    }
  }

  /**
   * Read all entries for a specific date (or today by default).
   * @param {string} dateStr YYYY-MM-DD
   * @returns {Array<Object>}
   */
  read(dateStr) {
    try {
      const date = dateStr || new Date().toISOString().slice(0, 10);
      const file = path.join(this.projectDir, '.bkit', 'state', 'audit', date, 'decisions.jsonl');
      if (!fs.existsSync(file)) return [];
      const raw = fs.readFileSync(file, 'utf-8');
      return raw.split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => {
          try { return JSON.parse(line); } catch (e) { return null; }
        })
        .filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  /**
   * Purge audit logs older than retention days.
   * Called from sessionStart hook or daily cron.
   * @param {number} olderThanDays default 90
   * @returns {number} count of directories purged
   */
  purge(olderThanDays) {
    const days = olderThanDays || RETENTION_DAYS;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const auditDir = path.join(this.projectDir, '.bkit', 'state', 'audit');
    if (!fs.existsSync(auditDir)) return 0;

    let purgedCount = 0;
    try {
      const entries = fs.readdirSync(auditDir);
      for (const entry of entries) {
        // Only process YYYY-MM-DD format directories
        if (!/^\d{4}-\d{2}-\d{2}$/.test(entry)) continue;
        if (entry < cutoffStr) {
          const dirPath = path.join(auditDir, entry);
          try {
            fs.rmSync(dirPath, { recursive: true, force: true });
            purgedCount++;
          } catch (e) { /* ignore individual failures */ }
        }
      }
    } catch (e) { /* ignore */ }

    return purgedCount;
  }

  /**
   * Find decisions matching predicate across all dates.
   * For grep-like investigation.
   * @param {function} predicate
   * @param {number} maxDates max dates to scan (default 30)
   * @returns {Array<Object>}
   */
  find(predicate, maxDates) {
    const limit = maxDates || 30;
    const auditDir = path.join(this.projectDir, '.bkit', 'state', 'audit');
    if (!fs.existsSync(auditDir)) return [];

    try {
      const dates = fs.readdirSync(auditDir)
        .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
        .sort()
        .reverse()
        .slice(0, limit);

      const results = [];
      for (const date of dates) {
        const entries = this.read(date);
        for (const e of entries) {
          if (predicate(e)) results.push(e);
        }
      }
      return results;
    } catch (e) {
      return [];
    }
  }
}

module.exports = AuditLogger;
module.exports.RETENTION_DAYS = RETENTION_DAYS;
