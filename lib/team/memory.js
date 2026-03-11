/**
 * TeamMemory - File-based persistent memory for team state
 * Stores key-value data to .gemini/teams/{teamName}/memory.json.
 *
 * @module lib/team/memory
 */

const fs = require('fs');
const path = require('path');

const TEAMS_DIR = '.gemini/teams';

class TeamMemory {
  /**
   * Create a new TeamMemory instance
   * @param {string} [projectDir] - Project root directory (defaults to cwd)
   */
  constructor(projectDir) {
    this.projectDir = projectDir || process.cwd();
  }

  /**
   * Get the memory file path for a team
   * @param {string} teamName - Team identifier
   * @returns {string}
   * @private
   */
  _memoryPath(teamName) {
    return path.join(this.projectDir, TEAMS_DIR, teamName, 'memory.json');
  }

  /**
   * Load memory data for a team
   * @param {string} teamName - Team identifier
   * @returns {object} Key-value store
   * @private
   */
  _load(teamName) {
    try {
      const filePath = this._memoryPath(teamName);
      if (!fs.existsSync(filePath)) return {};
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  /**
   * Persist memory data for a team
   * @param {string} teamName - Team identifier
   * @param {object} data - Key-value store to persist
   * @private
   */
  _persist(teamName, data) {
    try {
      const filePath = this._memoryPath(teamName);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      throw new Error(`Failed to persist memory for team '${teamName}': ${error.message}`);
    }
  }

  /**
   * Save a value to team memory
   * @param {string} teamName - Team identifier
   * @param {string} key - Memory key
   * @param {*} value - Value to store
   * @returns {{ teamName: string, key: string, saved: boolean }}
   */
  save(teamName, key, value) {
    const data = this._load(teamName);
    data[key] = { value, updatedAt: new Date().toISOString() };
    this._persist(teamName, data);
    return { teamName, key, saved: true };
  }

  /**
   * Retrieve a value from team memory
   * @param {string} teamName - Team identifier
   * @param {string} key - Memory key
   * @returns {*} Stored value or null if not found
   */
  get(teamName, key) {
    const data = this._load(teamName);
    return data[key] ? data[key].value : null;
  }

  /**
   * Get all memory entries for a team
   * @param {string} teamName - Team identifier
   * @returns {object} All key-value pairs
   */
  getAll(teamName) {
    const data = this._load(teamName);
    const result = {};
    for (const [key, entry] of Object.entries(data)) {
      result[key] = entry.value;
    }
    return result;
  }

  /**
   * Clear all memory for a team
   * @param {string} teamName - Team identifier
   * @returns {{ teamName: string, cleared: boolean }}
   */
  clear(teamName) {
    try {
      const filePath = this._memoryPath(teamName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return { teamName, cleared: true };
    } catch {
      return { teamName, cleared: false };
    }
  }
}

module.exports = TeamMemory;
