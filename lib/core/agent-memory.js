/**
 * AgentMemoryManager - Per-agent persistent memory
 * Provides isolated memory storage for each agent (project or user scope)
 *
 * Philosophy: FR-08 (State Management) - Each agent maintains its own
 * persistent memory across sessions, storing summaries, patterns, and stats.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * AgentMemoryManager Class
 * Provides per-agent persistent memory with project and user scope support
 */
class AgentMemoryManager {
  /**
   * Create a new AgentMemoryManager
   *
   * @param {string} agentName - Agent identifier (e.g., 'gap-detector', 'starter-guide')
   * @param {string} scope - Memory scope: 'project' or 'user'
   */
  constructor(agentName, scope = 'project') {
    this.agentName = agentName;
    this.scope = scope;
    this.memory = null;
  }

  /**
   * Get the file path based on scope
   *
   * User scope: ~/.gemini/agent-memory/bkit/<agentName>.json
   * Project scope: <projectDir>/.gemini/agent-memory/bkit/<agentName>.json
   *
   * @param {string} projectDir - Project directory (used for project scope)
   * @returns {string} Resolved memory file path
   */
  getMemoryPath(projectDir) {
    if (this.scope === 'user') {
      return path.join(os.homedir(), '.gemini', 'agent-memory', 'bkit', `${this.agentName}.json`);
    }
    return path.join(projectDir || process.cwd(), '.gemini', 'agent-memory', 'bkit', `${this.agentName}.json`);
  }

  /**
   * Load memory from disk
   *
   * @param {string} projectDir - Project directory (optional, defaults to cwd)
   * @returns {object} Loaded memory object
   */
  load(projectDir) {
    const memPath = this.getMemoryPath(projectDir);

    if (fs.existsSync(memPath)) {
      try {
        this.memory = JSON.parse(fs.readFileSync(memPath, 'utf-8'));
      } catch (e) {
        // Graceful degradation: start fresh on parse error
        this.memory = this._createDefault();
      }
    } else {
      this.memory = this._createDefault();
    }

    return this.memory;
  }

  /**
   * Save memory to disk
   *
   * @param {string} projectDir - Project directory (optional, defaults to cwd)
   */
  save(projectDir) {
    const memPath = this.getMemoryPath(projectDir);
    const dir = path.dirname(memPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.memory.lastUpdated = new Date().toISOString();
    fs.writeFileSync(memPath, JSON.stringify(this.memory, null, 2));
  }

  /**
   * Add a session entry to memory
   *
   * Sessions are stored newest-first. Older sessions beyond maxSessions are trimmed.
   *
   * @param {object} sessionData - Session data to record
   * @param {string} sessionData.sessionId - Unique session ID (auto-generated if omitted)
   * @param {string} sessionData.summary - Brief summary of what happened
   * @param {string[]} sessionData.keyFindings - Key findings or outputs from the session
   */
  addSession(sessionData) {
    if (!this.memory) this.memory = this._createDefault();

    this.memory.sessions.unshift({
      sessionId: sessionData.sessionId || Date.now().toString(36),
      timestamp: new Date().toISOString(),
      summary: sessionData.summary || '',
      keyFindings: sessionData.keyFindings || []
    });

    // Keep only last maxSessions entries
    const max = 20;
    if (this.memory.sessions.length > max) {
      this.memory.sessions = this.memory.sessions.slice(0, max);
    }

    this.memory.stats.totalSessions = (this.memory.stats.totalSessions || 0) + 1;
  }

  /**
   * Get recent sessions (newest first)
   *
   * @param {number} count - Number of sessions to return (default: 5)
   * @returns {object[]} Array of session objects
   */
  getRecentSessions(count = 5) {
    if (!this.memory) return [];
    return this.memory.sessions.slice(0, count);
  }

  /**
   * Update learned patterns
   *
   * Merges the provided patterns into existing patterns via Object.assign.
   *
   * @param {object} patterns - Pattern data to merge
   */
  updatePatterns(patterns) {
    if (!this.memory) this.memory = this._createDefault();
    Object.assign(this.memory.patterns, patterns);
  }

  /**
   * Get a summary string suitable for injection into agent context
   *
   * Returns a human-readable multi-line summary including session count,
   * recent activity, and common patterns.
   *
   * @returns {string} Summary text (empty string if no sessions)
   */
  getSummary() {
    if (!this.memory || this.memory.sessions.length === 0) return '';

    const recent = this.getRecentSessions(3);
    const lines = [`Agent Memory (${this.agentName}): ${this.memory.stats.totalSessions} sessions`];

    for (const s of recent) {
      lines.push(`- ${s.timestamp.slice(0, 10)}: ${s.summary}`);
    }

    if (this.memory.patterns.commonGaps && this.memory.patterns.commonGaps.length > 0) {
      lines.push(`Common patterns: ${this.memory.patterns.commonGaps.join(', ')}`);
    }

    return lines.join('\n');
  }

  /**
   * Clear all memory (reset to default) and save
   *
   * @param {string} projectDir - Project directory (optional)
   */
  clear(projectDir) {
    this.memory = this._createDefault();
    this.save(projectDir);
  }

  /**
   * v2.0.7-S5 W3 Strategy 3 — Export current memory as Gemini Auto Memory
   * extraction.patch (PR #26338 schema). Lossless one-way transform.
   *
   * Schema (extraction.patch):
   *   {
   *     "schema": "bkit-agent-memory/1.0",
   *     "agent": "<agentName>",
   *     "scope": "project|user",
   *     "captured_at": ISO8601,
   *     "patches": [
   *       { "type": "session", "session_id": "...", "timestamp": "...",
   *         "summary": "...", "key_findings": [...] },
   *       { "type": "pattern", "key": "commonGaps", "value": [...] }
   *     ]
   *   }
   *
   * @returns {Object} extraction.patch payload (JSON-safe)
   */
  exportAsExtractionPatch() {
    if (!this.memory) this.memory = this._createDefault();
    const patches = [];
    for (const s of this.memory.sessions || []) {
      patches.push({
        type: 'session',
        session_id: s.sessionId,
        timestamp: s.timestamp,
        summary: s.summary || '',
        key_findings: Array.isArray(s.keyFindings) ? s.keyFindings : []
      });
    }
    const patterns = this.memory.patterns || {};
    for (const [k, v] of Object.entries(patterns)) {
      if (v === null || v === undefined) continue;
      // Skip empty arrays / empty strings (no signal)
      if (Array.isArray(v) && v.length === 0) continue;
      if (typeof v === 'string' && v.length === 0) continue;
      patches.push({ type: 'pattern', key: k, value: v });
    }
    return {
      schema: 'bkit-agent-memory/1.0',
      agent: this.agentName,
      scope: this.scope,
      captured_at: new Date().toISOString(),
      patches
    };
  }

  /**
   * v2.0.7-S5 W3 Strategy 3 — Import patches from Gemini Auto Memory
   * extraction.patch (PR #26338 schema). Merges into current memory.
   *
   * Behavior:
   *   - session patches: prepend (newest-first), dedupe by session_id
   *   - pattern patches: merge into patterns (arrays union, scalars overwrite)
   *   - 21-agent file 무손상 보장: import는 incremental merge, save()는 caller 책임
   *
   * @param {Object} patch — extraction.patch payload
   * @returns {{ sessionsAdded: number, patternsApplied: number, skipped: number }}
   * @throws if patch schema is missing or agent name mismatches
   */
  importFromExtractionPatch(patch) {
    if (!patch || typeof patch !== 'object') {
      throw new Error('importFromExtractionPatch: patch must be an object');
    }
    if (patch.schema !== 'bkit-agent-memory/1.0') {
      throw new Error(`importFromExtractionPatch: unsupported schema "${patch.schema}"`);
    }
    if (patch.agent && patch.agent !== this.agentName) {
      throw new Error(
        `importFromExtractionPatch: agent name mismatch — patch=${patch.agent}, this=${this.agentName}`
      );
    }
    if (!this.memory) this.memory = this._createDefault();
    if (!Array.isArray(this.memory.sessions)) this.memory.sessions = [];
    if (!this.memory.patterns) this.memory.patterns = {};

    const existingSessionIds = new Set(this.memory.sessions.map(s => s.sessionId));
    let sessionsAdded = 0;
    let patternsApplied = 0;
    let skipped = 0;

    for (const p of (patch.patches || [])) {
      if (!p || typeof p !== 'object') { skipped++; continue; }
      if (p.type === 'session') {
        if (!p.session_id) { skipped++; continue; }
        if (existingSessionIds.has(p.session_id)) { skipped++; continue; }
        this.memory.sessions.unshift({
          sessionId: p.session_id,
          timestamp: p.timestamp || new Date().toISOString(),
          summary: p.summary || '',
          keyFindings: Array.isArray(p.key_findings) ? p.key_findings : []
        });
        existingSessionIds.add(p.session_id);
        sessionsAdded++;
      } else if (p.type === 'pattern') {
        if (!p.key) { skipped++; continue; }
        const existing = this.memory.patterns[p.key];
        if (Array.isArray(existing) && Array.isArray(p.value)) {
          const merged = new Set([...existing, ...p.value]);
          this.memory.patterns[p.key] = Array.from(merged);
        } else {
          this.memory.patterns[p.key] = p.value;
        }
        patternsApplied++;
      } else {
        skipped++;
      }
    }

    // Bound sessions to max=20 (matches addSession)
    if (this.memory.sessions.length > 20) {
      this.memory.sessions = this.memory.sessions.slice(0, 20);
    }
    this.memory.stats = this.memory.stats || { totalSessions: 0 };
    this.memory.stats.totalSessions += sessionsAdded;

    return { sessionsAdded, patternsApplied, skipped };
  }

  /**
   * Create the default memory schema
   *
   * @returns {object} Default memory object
   * @private
   */
  _createDefault() {
    return {
      version: '1.0',
      agent: this.agentName,
      scope: this.scope,
      lastUpdated: new Date().toISOString(),
      sessions: [],
      patterns: { commonGaps: [], projectSpecificNotes: '' },
      stats: { totalSessions: 0 }
    };
  }
}

/**
 * Factory function with scope lookup from config
 *
 * Determines the appropriate scope for the given agent and returns
 * a new AgentMemoryManager instance. Agents in the userScopeAgents
 * list get 'user' scope; all others default to 'project' scope.
 *
 * @param {string} agentName - Agent identifier
 * @param {string|object} configOrProjectDir - Config object or project directory (reserved for future use)
 * @returns {AgentMemoryManager}
 */
function getAgentMemory(agentName, configOrProjectDir) {
  // Determine scope from bkit.config.json agentMemory.agentScopes
  let scope = 'project';
  const userScopeAgents = ['starter-guide', 'pipeline-guide'];

  if (userScopeAgents.includes(agentName)) {
    scope = 'user';
  }

  return new AgentMemoryManager(agentName, scope);
}

module.exports = { AgentMemoryManager, getAgentMemory };
