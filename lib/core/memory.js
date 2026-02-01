/**
 * Structured Memory Storage (GAP-06)
 * Provides file-based structured memory for persistent state management
 *
 * Philosophy: FR-08 (State Management) - All state changes must be tracked and recoverable
 */
const fs = require('fs');
const path = require('path');

const MEMORY_FILE = '.bkit-memory.json';
const MEMORY_DIR = 'docs';

/**
 * Get nested value from object using dot notation
 *
 * @param {object} obj - Object to traverse
 * @param {string} key - Dot-notation key (e.g., 'pdca.lastFeature')
 * @returns {*}
 */
function getNestedValue(obj, key) {
  if (!key || !obj) return undefined;
  return key.split('.').reduce((o, k) => o?.[k], obj);
}

/**
 * Set nested value in object using dot notation
 *
 * @param {object} obj - Object to modify
 * @param {string} key - Dot-notation key
 * @param {*} value - Value to set
 */
function setNestedValue(obj, key, value) {
  if (!key || !obj) return;

  const keys = key.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((o, k) => {
    if (!o[k] || typeof o[k] !== 'object') {
      o[k] = {};
    }
    return o[k];
  }, obj);

  target[lastKey] = value;
}

/**
 * Delete nested value from object using dot notation
 *
 * @param {object} obj - Object to modify
 * @param {string} key - Dot-notation key
 * @returns {boolean} - Whether deletion was successful
 */
function deleteNestedValue(obj, key) {
  if (!key || !obj) return false;

  const keys = key.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((o, k) => o?.[k], obj);

  if (target && lastKey in target) {
    delete target[lastKey];
    return true;
  }

  return false;
}

/**
 * Memory Manager Class
 * Provides structured access to persistent memory storage
 */
class MemoryManager {
  /**
   * Create a new MemoryManager
   * @param {string} projectDir - Project directory path
   */
  constructor(projectDir) {
    this.projectDir = projectDir;
    this.memoryPath = path.join(projectDir, MEMORY_DIR, MEMORY_FILE);
    this.cache = null;
    this.dirty = false;
  }

  /**
   * Get memory file path
   * @returns {string}
   */
  getPath() {
    return this.memoryPath;
  }

  /**
   * Initialize memory file if not exists
   */
  initialize() {
    const dir = path.dirname(this.memoryPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(this.memoryPath)) {
      const initial = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        platform: 'gemini',
        data: {
          session: {
            sessionCount: 0,
            lastSessionStarted: null,
            lastSessionEnded: null
          },
          pdca: {
            lastFeature: null,
            activePdca: null,
            preferredLevel: 'Starter'
          },
          preferences: {
            language: 'en',
            automationLevel: 'semi-auto'
          },
          custom: {}
        }
      };

      fs.writeFileSync(this.memoryPath, JSON.stringify(initial, null, 2));
      this.cache = initial;
    }
  }

  /**
   * Load memory from file
   * @param {boolean} force - Force reload from disk
   * @returns {object}
   */
  load(force = false) {
    if (this.cache && !force) {
      return this.cache;
    }

    this.initialize();

    try {
      const content = fs.readFileSync(this.memoryPath, 'utf-8');
      this.cache = JSON.parse(content);
    } catch (error) {
      console.error('Failed to load memory:', error.message);
      this.cache = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        platform: 'gemini',
        data: {}
      };
    }

    return this.cache;
  }

  /**
   * Save memory to file
   * @param {boolean} force - Force save even if not dirty
   */
  save(force = false) {
    if (!this.cache) return;
    if (!this.dirty && !force) return;

    this.cache.lastUpdated = new Date().toISOString();

    try {
      const dir = path.dirname(this.memoryPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.memoryPath, JSON.stringify(this.cache, null, 2));
      this.dirty = false;
    } catch (error) {
      console.error('Failed to save memory:', error.message);
    }
  }

  /**
   * Get a memory value
   *
   * @param {string} key - Dot-notation key (e.g., 'pdca.lastFeature')
   * @param {*} defaultValue - Default value if not found
   * @returns {*}
   */
  get(key, defaultValue = null) {
    const memory = this.load();
    const value = getNestedValue(memory.data, key);
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Set a memory value
   *
   * @param {string} key - Dot-notation key
   * @param {*} value - Value to set
   * @returns {MemoryManager} - Returns this for chaining
   */
  set(key, value) {
    const memory = this.load();
    setNestedValue(memory.data, key, value);
    this.dirty = true;
    this.save();
    return this;
  }

  /**
   * Delete a memory value
   *
   * @param {string} key - Dot-notation key
   * @returns {boolean} - Whether deletion was successful
   */
  delete(key) {
    const memory = this.load();
    const result = deleteNestedValue(memory.data, key);

    if (result) {
      this.dirty = true;
      this.save();
    }

    return result;
  }

  /**
   * Check if a key exists in memory
   *
   * @param {string} key - Dot-notation key
   * @returns {boolean}
   */
  has(key) {
    const memory = this.load();
    return getNestedValue(memory.data, key) !== undefined;
  }

  /**
   * Get all memory data
   * @returns {object}
   */
  getAll() {
    return this.load().data;
  }

  /**
   * Set multiple values at once
   *
   * @param {object} values - Key-value pairs to set
   * @returns {MemoryManager}
   */
  setMultiple(values) {
    const memory = this.load();

    for (const [key, value] of Object.entries(values)) {
      setNestedValue(memory.data, key, value);
    }

    this.dirty = true;
    this.save();
    return this;
  }

  /**
   * Clear all memory data (keeps structure)
   */
  clear() {
    this.cache = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      platform: 'gemini',
      data: {
        session: {},
        pdca: {},
        preferences: {},
        custom: {}
      }
    };
    this.dirty = true;
    this.save();
  }

  /**
   * Invalidate cache (force reload on next access)
   */
  invalidateCache() {
    this.cache = null;
    this.dirty = false;
  }

  /**
   * Get memory metadata
   * @returns {{version: string, lastUpdated: string, platform: string}}
   */
  getMetadata() {
    const memory = this.load();
    return {
      version: memory.version,
      lastUpdated: memory.lastUpdated,
      platform: memory.platform
    };
  }

  /**
   * Increment a numeric value
   *
   * @param {string} key - Dot-notation key
   * @param {number} amount - Amount to increment (default: 1)
   * @returns {number} - New value
   */
  increment(key, amount = 1) {
    const current = this.get(key, 0);
    const newValue = (typeof current === 'number' ? current : 0) + amount;
    this.set(key, newValue);
    return newValue;
  }

  /**
   * Push a value to an array
   *
   * @param {string} key - Dot-notation key
   * @param {*} value - Value to push
   * @param {number} maxLength - Maximum array length (optional)
   * @returns {number} - New array length
   */
  push(key, value, maxLength = null) {
    const current = this.get(key, []);
    const arr = Array.isArray(current) ? current : [];

    arr.push(value);

    // Trim if exceeds max length
    if (maxLength && arr.length > maxLength) {
      arr.splice(0, arr.length - maxLength);
    }

    this.set(key, arr);
    return arr.length;
  }

  /**
   * Get recent session info
   * @returns {object}
   */
  getSessionInfo() {
    return {
      sessionCount: this.get('session.sessionCount', 0),
      lastSessionStarted: this.get('session.lastSessionStarted'),
      lastSessionEnded: this.get('session.lastSessionEnded')
    };
  }

  /**
   * Update session start
   * @returns {number} - New session count
   */
  startSession() {
    const count = this.increment('session.sessionCount');
    this.set('session.lastSessionStarted', new Date().toISOString());
    return count;
  }

  /**
   * Update session end
   */
  endSession() {
    this.set('session.lastSessionEnded', new Date().toISOString());
  }
}

// Instance cache for singleton pattern per project
const _instances = new Map();

/**
 * Get or create a MemoryManager for a project
 *
 * @param {string} projectDir - Project directory (optional, defaults to cwd)
 * @returns {MemoryManager}
 */
function getMemory(projectDir) {
  const dir = projectDir || process.cwd();

  if (!_instances.has(dir)) {
    _instances.set(dir, new MemoryManager(dir));
  }

  return _instances.get(dir);
}

/**
 * Convenience function: Set a memory value
 *
 * @param {string} key - Dot-notation key
 * @param {*} value - Value to set
 * @param {string} projectDir - Project directory (optional)
 */
function setMemory(key, value, projectDir) {
  getMemory(projectDir).set(key, value);
}

/**
 * Convenience function: Get a memory value
 *
 * @param {string} key - Dot-notation key
 * @param {*} defaultValue - Default value if not found
 * @param {string} projectDir - Project directory (optional)
 * @returns {*}
 */
function getMemoryValue(key, defaultValue = null, projectDir) {
  return getMemory(projectDir).get(key, defaultValue);
}

/**
 * Convenience function: Delete a memory value
 *
 * @param {string} key - Dot-notation key
 * @param {string} projectDir - Project directory (optional)
 * @returns {boolean}
 */
function deleteMemory(key, projectDir) {
  return getMemory(projectDir).delete(key);
}

/**
 * Convenience function: Check if memory key exists
 *
 * @param {string} key - Dot-notation key
 * @param {string} projectDir - Project directory (optional)
 * @returns {boolean}
 */
function hasMemory(key, projectDir) {
  return getMemory(projectDir).has(key);
}

/**
 * Clear all cached instances (useful for testing)
 */
function clearInstances() {
  _instances.clear();
}

module.exports = {
  MemoryManager,
  getMemory,
  setMemory,
  getMemoryValue,
  deleteMemory,
  hasMemory,
  clearInstances,
  // Utilities exported for testing
  getNestedValue,
  setNestedValue,
  deleteNestedValue,
  // Constants
  MEMORY_FILE,
  MEMORY_DIR
};
