/**
 * Audit Store
 * JSONL-based audit trail for recording and querying tool/agent events.
 * Storage: .gemini/audit/YYYY-MM-DD.jsonl
 *
 * @module mcp/tools/audit-store
 */
'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Query audit entries with optional filters
 * @param {object} params
 * @param {string} params.projectDir - Project root directory
 * @param {string} [params.eventType] - Filter by event type
 * @param {string} [params.keyword] - Search keyword in event data
 * @param {string} [params.since] - ISO date string, return events after this time
 * @param {number} [params.limit] - Max entries to return (default: 50)
 * @returns {object} { entries, total }
 */
function query({ projectDir, eventType, keyword, since, limit = 50 }) {
  const auditDir = path.join(projectDir, '.gemini', 'audit');
  if (!fs.existsSync(auditDir)) {
    return { entries: [], total: 0, message: 'No audit directory found' };
  }

  // List JSONL files sorted newest first
  const files = fs.readdirSync(auditDir)
    .filter(f => f.endsWith('.jsonl'))
    .sort()
    .reverse();

  const entries = [];
  const sinceDate = since ? new Date(since) : null;

  for (const file of files) {
    if (entries.length >= limit) break;

    // If filtering by date, skip files clearly before the since date
    if (sinceDate) {
      const fileDate = file.replace('.jsonl', '');
      if (fileDate < since.slice(0, 10)) break;
    }

    let lines;
    try {
      lines = fs.readFileSync(path.join(auditDir, file), 'utf-8')
        .split('\n')
        .filter(l => l.trim());
    } catch {
      continue;
    }

    // Process lines in reverse (newest first)
    for (let i = lines.length - 1; i >= 0; i--) {
      if (entries.length >= limit) break;

      try {
        const entry = JSON.parse(lines[i]);

        // Filter: eventType
        if (eventType && entry.type !== eventType) continue;

        // Filter: since
        if (sinceDate && new Date(entry.timestamp) < sinceDate) continue;

        // Filter: keyword
        if (keyword && !JSON.stringify(entry).toLowerCase().includes(keyword.toLowerCase())) continue;

        entries.push(entry);
      } catch {
        // Skip malformed lines
      }
    }
  }

  return { entries, total: entries.length };
}

/**
 * Append an audit entry to today's JSONL file
 * @param {object} params
 * @param {string} params.projectDir - Project root directory
 * @param {object} params.entry - Audit entry data { type, tool?, agent?, file?, phase?, detail? }
 * @returns {object} The recorded entry with timestamp
 */
function append({ projectDir, entry }) {
  const auditDir = path.join(projectDir, '.gemini', 'audit');
  fs.mkdirSync(auditDir, { recursive: true });

  const today = new Date().toISOString().slice(0, 10);
  const filePath = path.join(auditDir, `${today}.jsonl`);

  const record = {
    timestamp: new Date().toISOString(),
    ...entry
  };

  fs.appendFileSync(filePath, JSON.stringify(record) + '\n');
  return record;
}

/**
 * Get aggregate summary of recent audit entries
 * @param {string} projectDir - Project root directory
 * @returns {object} Summary statistics
 */
function summary(projectDir) {
  const auditDir = path.join(projectDir, '.gemini', 'audit');
  if (!fs.existsSync(auditDir)) {
    return { totalFiles: 0, totalEntries: 0, byType: {}, recentDays: 0 };
  }

  const files = fs.readdirSync(auditDir)
    .filter(f => f.endsWith('.jsonl'))
    .sort()
    .reverse();

  let totalEntries = 0;
  const byType = {};

  for (const file of files.slice(0, 7)) { // Last 7 days
    try {
      const lines = fs.readFileSync(path.join(auditDir, file), 'utf-8')
        .split('\n')
        .filter(l => l.trim());

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          totalEntries++;
          const type = entry.type || 'unknown';
          byType[type] = (byType[type] || 0) + 1;
        } catch {
          // Skip malformed
        }
      }
    } catch {
      continue;
    }
  }

  return {
    totalFiles: files.length,
    totalEntries,
    byType,
    recentDays: Math.min(files.length, 7)
  };
}

module.exports = { query, append, summary };
