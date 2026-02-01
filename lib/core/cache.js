/**
 * In-Memory Cache with TTL Support
 * Provides simple caching for configuration and frequently accessed data
 */

/**
 * Default TTL in milliseconds (5 seconds)
 */
const DEFAULT_TTL = 5000;

/**
 * Cache entry structure
 * @typedef {Object} CacheEntry
 * @property {*} value - Cached value
 * @property {number} expiry - Expiration timestamp
 */

/**
 * Global cache storage
 * @type {Map<string, CacheEntry>}
 */
const globalCache = new Map();

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @param {number} ttl - TTL in milliseconds (default: DEFAULT_TTL)
 * @returns {*} Cached value or undefined
 */
function get(key, ttl = DEFAULT_TTL) {
  const entry = globalCache.get(key);

  if (!entry) return undefined;

  // Check if expired
  if (Date.now() > entry.expiry) {
    globalCache.delete(key);
    return undefined;
  }

  return entry.value;
}

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} ttl - TTL in milliseconds (default: DEFAULT_TTL)
 */
function set(key, value, ttl = DEFAULT_TTL) {
  globalCache.set(key, {
    value,
    expiry: Date.now() + ttl
  });
}

/**
 * Invalidate cache entries by key or pattern
 * @param {string|RegExp} keyOrPattern - Key or pattern to invalidate
 */
function invalidate(keyOrPattern) {
  if (typeof keyOrPattern === 'string') {
    globalCache.delete(keyOrPattern);
  } else if (keyOrPattern instanceof RegExp) {
    for (const key of globalCache.keys()) {
      if (keyOrPattern.test(key)) {
        globalCache.delete(key);
      }
    }
  }
}

/**
 * Clear entire cache
 */
function clear() {
  globalCache.clear();
}

/**
 * Get cache size
 * @returns {number}
 */
function size() {
  return globalCache.size;
}

/**
 * Check if key exists and is not expired
 * @param {string} key
 * @returns {boolean}
 */
function has(key) {
  return get(key) !== undefined;
}

// Legacy alias
const _cache = globalCache;

module.exports = {
  DEFAULT_TTL,
  globalCache,
  _cache,
  get,
  set,
  invalidate,
  clear,
  size,
  has
};
