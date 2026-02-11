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
