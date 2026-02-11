/**
 * ContextHierarchy - 4-level configuration merge system
 * Priority: Plugin (lowest) -> User -> Project -> Session (highest)
 *
 * Philosophy: Configuration values cascade through four levels,
 * allowing plugin defaults to be overridden by user preferences,
 * project-specific settings, and runtime session overrides.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * ContextHierarchy Class
 * Manages a 4-level configuration merge with caching and session overrides
 */
class ContextHierarchy {
  /**
   * Create a new ContextHierarchy
   *
   * @param {string} pluginRoot - Root directory of the bkit plugin
   * @param {string} projectDir - Current project directory
   */
  constructor(pluginRoot, projectDir) {
    this.pluginRoot = pluginRoot;
    this.projectDir = projectDir;
    this.cache = null;
    this.cacheTimestamp = 0;
    this.cacheTTL = 5000; // 5 seconds
    this.sessionOverrides = {};
  }

  /**
   * Get configuration file paths for each level
   *
   * Plugin: <pluginRoot>/bkit.config.json
   * User:   ~/.gemini/bkit/user-config.json
   * Project: <projectDir>/bkit.config.json
   *
   * @returns {{plugin: string, user: string, project: string}}
   * @private
   */
  _getPaths() {
    return {
      plugin: path.join(this.pluginRoot, 'bkit.config.json'),
      user: path.join(os.homedir(), '.gemini', 'bkit', 'user-config.json'),
      project: path.join(this.projectDir, 'bkit.config.json')
    };
  }

  /**
   * Load a config file safely
   *
   * Returns an empty object if the file does not exist or cannot be parsed.
   *
   * @param {string} filePath - Absolute path to a JSON config file
   * @returns {object} Parsed config or empty object
   * @private
   */
  _loadConfig(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
    } catch (e) { /* ignore parse errors */ }
    return {};
  }

  /**
   * Deep merge two objects (source overrides target)
   *
   * - Objects are merged recursively
   * - Arrays and scalar values from source replace target values
   *
   * @param {object} target - Base object
   * @param {object} source - Override object
   * @returns {object} Merged result (new object)
   * @private
   */
  _deepMerge(target, source) {
    const result = { ...target };

    for (const key of Object.keys(source)) {
      if (
        source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])
        && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])
      ) {
        result[key] = this._deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * Merge all four configuration levels
   *
   * Merge order: Plugin -> User -> Project -> Session
   * Each subsequent level overrides the previous.
   *
   * @returns {object} Fully merged configuration
   * @private
   */
  _mergeAll() {
    const paths = this._getPaths();
    const plugin = this._loadConfig(paths.plugin);
    const user = this._loadConfig(paths.user);
    const project = this._loadConfig(paths.project);

    let merged = this._deepMerge(plugin, user);
    merged = this._deepMerge(merged, project);
    merged = this._deepMerge(merged, this.sessionOverrides);

    return merged;
  }

  /**
   * Get a config value by dot-notation key
   *
   * Results are cached for cacheTTL milliseconds to avoid repeated disk reads.
   * Pass no key (or null) to get the entire merged config.
   *
   * @param {string} key - Dot-notation key (e.g., 'pdca.matchRateThreshold')
   * @returns {*} The resolved value, or undefined if not found
   */
  get(key) {
    const now = Date.now();

    if (!this.cache || (now - this.cacheTimestamp) > this.cacheTTL) {
      this.cache = this._mergeAll();
      this.cacheTimestamp = now;
    }

    if (!key) return this.cache;

    const parts = key.split('.');
    let value = this.cache;

    for (const part of parts) {
      if (value == null || typeof value !== 'object') return undefined;
      value = value[part];
    }

    return value;
  }

  /**
   * Set a session-level override (in-memory only)
   *
   * Session overrides have the highest priority and are not persisted to disk.
   * Setting a value invalidates the cache so the next get() call re-merges.
   *
   * @param {string} key - Dot-notation key
   * @param {*} value - Value to set
   */
  setSession(key, value) {
    const parts = key.split('.');
    let target = this.sessionOverrides;

    for (let i = 0; i < parts.length - 1; i++) {
      if (!target[parts[i]] || typeof target[parts[i]] !== 'object') {
        target[parts[i]] = {};
      }
      target = target[parts[i]];
    }

    target[parts[parts.length - 1]] = value;
    this.cache = null; // Invalidate cache
  }

  /**
   * Clear all session overrides
   *
   * Resets session-level configuration and invalidates cache.
   */
  clearSession() {
    this.sessionOverrides = {};
    this.cache = null;
  }

  /**
   * Invalidate cache (force re-merge on next access)
   */
  invalidate() {
    this.cache = null;
    this.cacheTimestamp = 0;
  }
}

// Singleton per project
let _instance = null;

/**
 * Get or create a ContextHierarchy instance (singleton per plugin+project pair)
 *
 * @param {string} pluginRoot - Root directory of the bkit plugin
 * @param {string} projectDir - Current project directory
 * @returns {ContextHierarchy}
 */
function getHierarchy(pluginRoot, projectDir) {
  if (!_instance || _instance.pluginRoot !== pluginRoot || _instance.projectDir !== projectDir) {
    _instance = new ContextHierarchy(pluginRoot, projectDir);
  }
  return _instance;
}

module.exports = { ContextHierarchy, getHierarchy };
