/**
 * Import Resolver for context files (FR-02)
 * Handles @import directive with variable substitution
 *
 * Philosophy: FR-02 (Docs = Code) - Maintain modular context files
 *
 * v0.35.0 JIT Context Loading:
 * - Gemini CLI lazy-loads @import directives (eager -> lazy)
 * - resolveImports() may be called before CLI has loaded the file
 * - JIT mode adds: file-existence retry, graceful fallback, deferred resolution
 */
const fs = require('fs');
const path = require('path');

// Cache for imported files to improve performance and prevent infinite loops
const importCache = new Map();

// JIT retry configuration
const JIT_RETRY_DELAY_MS = 200;
const JIT_MAX_RETRIES = 3;

/**
 * Detect if JIT Context Loading is active
 * @returns {boolean}
 */
function isJITMode() {
  try {
    const { getFeatureFlags } = require('./version');
    return !!getFeatureFlags().hasJITContextLoading;
  } catch (e) {
    return false;
  }
}

/**
 * Get cache TTL based on Gemini CLI features
 * @returns {number} TTL in milliseconds
 */
function getCacheTTL() {
  if (isJITMode()) {
    return 30000; // 30s - CLI manages primary cache, bkit just prevents redundant I/O in same turn
  }
  return 5000; // 5s - legacy default
}

/**
 * Wait for a file to appear on disk (JIT lazy-load retry)
 * @param {string} filePath - Absolute path
 * @param {number} retries - Remaining retries
 * @returns {Promise<boolean>} true if file appeared
 */
async function waitForFile(filePath, retries = JIT_MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    if (fs.existsSync(filePath)) return true;
    await new Promise(r => setTimeout(r, JIT_RETRY_DELAY_MS));
  }
  return fs.existsSync(filePath);
}

/**
 * Resolve imports in a context file
 *
 * @param {string} filePath - Path to the file to resolve
 * @param {object} options - Options for resolution
 * @param {string} options.basePath - Base path for relative imports
 * @param {object} options.variables - Variables for substitution
 * @param {Set<string>} options.visited - Set of visited files (for circular dependency detection)
 * @returns {Promise<{content: string, resolvedPath: string}>}
 */
async function resolveImports(filePath, options = {}) {
  const {
    basePath = process.cwd(),
    variables = {},
    visited = new Set()
  } = options;

  // 1. Resolve absolute path and handle variables in path
  let resolvedPath = filePath;
  
  // Substitute variables in path (e.g., ${PLUGIN_ROOT}/...)
  if (resolvedPath.includes('${')) {
    for (const [key, value] of Object.entries(variables)) {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      resolvedPath = resolvedPath.replace(new RegExp(`\\$\\{${escapedKey}\\}`, 'g'), value);
    }
  }

  // Make absolute
  if (!path.isAbsolute(resolvedPath)) {
    resolvedPath = path.resolve(basePath, resolvedPath);
  }

  // 2. Check circular dependency
  if (visited.has(resolvedPath)) {
    throw new Error(`Circular import detected: ${Array.from(visited).join(' -> ')} -> ${resolvedPath}`);
  }

  // 3. Check cache
  const now = Date.now();
  const ttl = getCacheTTL();
  if (importCache.has(resolvedPath)) {
    const entry = importCache.get(resolvedPath);
    if (now - entry.timestamp < ttl) {
      return entry.data;
    }
  }

  // 4. Read file (with JIT retry for v0.35.0+ lazy loading)
  const jit = isJITMode();

  if (!fs.existsSync(resolvedPath)) {
    if (jit) {
      // JIT mode: file may not be loaded yet by CLI, retry with backoff
      const appeared = await waitForFile(resolvedPath);
      if (!appeared) {
        // Graceful fallback: return placeholder instead of throwing
        const fallbackContent = `<!-- [bkit] JIT deferred: ${path.basename(resolvedPath)} not yet available -->`;
        const fallbackResult = { content: fallbackContent, resolvedPath, jitDeferred: true };
        // Cache with short TTL so next call retries
        importCache.set(resolvedPath, { data: fallbackResult, timestamp: now - (ttl - 2000) });
        return fallbackResult;
      }
    } else {
      throw new Error(`Imported file not found: ${resolvedPath}`);
    }
  }

  let content = fs.readFileSync(resolvedPath, 'utf-8');

  // 5. Process @import directives
  const importRegex = /^@import\s+([^\r\n]+)$/gm;
  const matches = [...content.matchAll(importRegex)];

  if (matches.length > 0) {
    const newVisited = new Set(visited);
    newVisited.add(resolvedPath);

    for (const match of matches) {
      const importPath = match[1].trim();
      const importResult = await resolveImports(importPath, {
        basePath: path.dirname(resolvedPath),
        variables,
        visited: newVisited
      });

      // Replace the @import line with the resolved content
      content = content.replace(match[0], importResult.content);
    }
  }

  // 6. Perform variable substitution in content
  if (content.includes('${')) {
    for (const [key, value] of Object.entries(variables)) {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      content = content.replace(new RegExp(`\\$\\{${escapedKey}\\}`, 'g'), value);
    }
  }

  const result = { content, resolvedPath };

  // 7. Update cache
  importCache.set(resolvedPath, {
    data: result,
    timestamp: now
  });

  return result;
}

/**
 * Clear import cache
 */
function clearCache() {
  importCache.clear();
}

module.exports = {
  resolveImports,
  clearCache,
  isJITMode
};
