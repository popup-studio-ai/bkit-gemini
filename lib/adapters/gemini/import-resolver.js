/**
 * Import Resolver for context files (FR-02)
 * Handles @import directive with variable substitution
 *
 * Philosophy: FR-02 (Docs = Code) - Maintain modular context files
 */
const fs = require('fs');
const path = require('path');

// Cache for imported files to improve performance and prevent infinite loops
const importCache = new Map();
const CACHE_TTL = 5000; // 5 seconds

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
  if (importCache.has(resolvedPath)) {
    const entry = importCache.get(resolvedPath);
    if (now - entry.timestamp < CACHE_TTL) {
      return entry.data;
    }
  }

  // 4. Read file
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Imported file not found: ${resolvedPath}`);
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
  clearCache
};
