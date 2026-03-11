/**
 * StateRecorder - Records and retrieves team state history
 * Persists state to .gemini/teams/{teamName}/state.json.
 *
 * @module lib/team/state-recorder
 */

const fs = require('fs');
const path = require('path');

const TEAMS_DIR = '.gemini/teams';

class StateRecorder {
  /**
   * Create a new StateRecorder
   * @param {string} [projectDir] - Project root directory (defaults to cwd)
   */
  constructor(projectDir) {
    this.projectDir = projectDir || process.cwd();
  }

  /**
   * Get the state file path for a team
   * @param {string} teamName - Team identifier
   * @returns {string}
   * @private
   */
  _statePath(teamName) {
    return path.join(this.projectDir, TEAMS_DIR, teamName, 'state.json');
  }

  /**
   * Load state history for a team
   * @param {string} teamName - Team identifier
   * @returns {object[]} Array of state records
   * @private
   */
  _loadHistory(teamName) {
    try {
      const filePath = this._statePath(teamName);
      if (!fs.existsSync(filePath)) return [];
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  /**
   * Save state history for a team
   * @param {string} teamName - Team identifier
   * @param {object[]} history - State records
   * @private
   */
  _saveHistory(teamName, history) {
    try {
      const filePath = this._statePath(teamName);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
    } catch (error) {
      throw new Error(`Failed to save state for team '${teamName}': ${error.message}`);
    }
  }

  /**
   * Record a state snapshot for a team
   * @param {string} teamName - Team identifier
   * @param {object} state - State data to record
   * @returns {{ teamName: string, recordCount: number, timestamp: string }}
   */
  record(teamName, state) {
    const history = this._loadHistory(teamName);
    const timestamp = new Date().toISOString();
    history.push({ state, timestamp });
    this._saveHistory(teamName, history);

    return { teamName, recordCount: history.length, timestamp };
  }

  /**
   * Get full state history for a team
   * @param {string} teamName - Team identifier
   * @returns {object[]} Array of { state, timestamp }
   */
  getHistory(teamName) {
    return this._loadHistory(teamName);
  }

  /**
   * Get the most recent state for a team
   * @param {string} teamName - Team identifier
   * @returns {object|null} Latest state record or null
   */
  getLatest(teamName) {
    const history = this._loadHistory(teamName);
    return history.length > 0 ? history[history.length - 1] : null;
  }

  /**
   * Clear all state history for a team
   * @param {string} teamName - Team identifier
   * @returns {{ teamName: string, cleared: boolean }}
   */
  clear(teamName) {
    try {
      const filePath = this._statePath(teamName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return { teamName, cleared: true };
    } catch {
      return { teamName, cleared: false };
    }
  }
}

module.exports = StateRecorder;
