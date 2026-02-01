/**
 * Configuration Management
 * Loads and provides access to bkit.config.json
 */
const fs = require('fs');
const path = require('path');
const cache = require('./cache');

// Config cache key
const CONFIG_CACHE_KEY = 'bkit.config';
const CONFIG_TTL = 30000; // 30 seconds

/**
 * Safe JSON parse with fallback
 * @param {string} str - JSON string
 * @param {*} fallback - Fallback value on error
 * @returns {*}
 */
function safeJsonParse(str, fallback = {}) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * Load bkit.config.json
 * @param {boolean} forceRefresh - Force reload from disk
 * @returns {object}
 */
function loadConfig(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = cache.get(CONFIG_CACHE_KEY, CONFIG_TTL);
    if (cached) return cached;
  }

  let config = {};

  // Try loading from extension root
  try {
    const { getAdapter } = require('../adapters');
    const adapter = getAdapter();
    const configPath = path.join(adapter.getPluginRoot(), 'bkit.config.json');

    if (fs.existsSync(configPath)) {
      config = safeJsonParse(fs.readFileSync(configPath, 'utf-8'), {});
    }
  } catch {
    // Fallback to relative path
    try {
      const configPath = path.resolve(__dirname, '..', '..', 'bkit.config.json');
      if (fs.existsSync(configPath)) {
        config = safeJsonParse(fs.readFileSync(configPath, 'utf-8'), {});
      }
    } catch {
      config = {};
    }
  }

  // Apply environment overrides
  if (process.env.BKIT_LEVEL) {
    config._envLevel = process.env.BKIT_LEVEL;
  }
  if (process.env.BKIT_PDCA_AUTOMATION) {
    config._envAutomation = process.env.BKIT_PDCA_AUTOMATION;
  }

  cache.set(CONFIG_CACHE_KEY, config, CONFIG_TTL);
  return config;
}

/**
 * Get config value by dot-notation path
 * @param {string} keyPath - Dot-separated path (e.g., 'pdca.maxIterations')
 * @param {*} defaultValue - Default value if not found
 * @returns {*}
 */
function getConfig(keyPath, defaultValue = undefined) {
  const config = loadConfig();

  if (!keyPath) return config;

  const parts = keyPath.split('.');
  let current = config;

  for (const part of parts) {
    if (current === undefined || current === null) {
      return defaultValue;
    }
    current = current[part];
  }

  return current !== undefined ? current : defaultValue;
}

/**
 * Get config array as space-separated string
 * @param {string} keyPath
 * @param {string} defaultValue
 * @returns {string}
 */
function getConfigArray(keyPath, defaultValue = '') {
  const value = getConfig(keyPath);
  if (Array.isArray(value)) {
    return value.join(' ');
  }
  return value || defaultValue;
}

/**
 * Get full config with environment overrides applied
 * @param {boolean} forceRefresh
 * @returns {object}
 */
function getBkitConfig(forceRefresh = false) {
  return loadConfig(forceRefresh);
}

/**
 * Invalidate config cache
 */
function invalidateConfig() {
  cache.invalidate(CONFIG_CACHE_KEY);
}

module.exports = {
  safeJsonParse,
  loadConfig,
  getConfig,
  getConfigArray,
  getBkitConfig,
  invalidateConfig
};
