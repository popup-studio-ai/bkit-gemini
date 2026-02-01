/**
 * Platform Detection and Utilities
 * Delegates to platform adapter for Gemini CLI compatibility
 */
const path = require('path');

// Lazy load adapter to avoid circular dependencies
let _adapter = null;
function getAdapter() {
  if (!_adapter) {
    _adapter = require('../adapters').getAdapter();
  }
  return _adapter;
}

/**
 * Platform identifier
 */
const BKIT_PLATFORM = 'gemini';

/**
 * Detect current platform
 * @returns {'gemini'}
 */
function detectPlatform() {
  return 'gemini';
}

/**
 * Check if running on Gemini CLI
 * @returns {boolean}
 */
function isGemini() {
  return true;
}

/**
 * Check if running on Claude Code (always false for this version)
 * @returns {boolean}
 */
function isClaudeCode() {
  return false;
}

/**
 * Get plugin root directory
 * @returns {string}
 */
function getPluginRoot() {
  return getAdapter().getPluginRoot();
}

/**
 * Alias for getPluginRoot
 */
const PLUGIN_ROOT = (() => {
  try {
    return getAdapter().getPluginRoot();
  } catch {
    return path.resolve(__dirname, '..', '..');
  }
})();

/**
 * Get project directory
 * @returns {string}
 */
function getProjectDir() {
  return getAdapter().getProjectDir();
}

/**
 * Alias for getProjectDir
 */
const PROJECT_DIR = (() => {
  try {
    return getAdapter().getProjectDir();
  } catch {
    return process.cwd();
  }
})();

/**
 * Legacy alias
 */
const BKIT_PROJECT_DIR = PROJECT_DIR;

/**
 * Get plugin-relative path
 * @param {string} relativePath
 * @returns {string}
 */
function getPluginPath(relativePath) {
  return path.join(getPluginRoot(), relativePath);
}

/**
 * Get project-relative path
 * @param {string} relativePath
 * @returns {string}
 */
function getProjectPath(relativePath) {
  return path.join(getProjectDir(), relativePath);
}

/**
 * Get template file path
 * @param {string} templateName
 * @returns {string}
 */
function getTemplatePath(templateName) {
  return getAdapter().getTemplatePath(templateName);
}

module.exports = {
  BKIT_PLATFORM,
  detectPlatform,
  isGemini,
  isClaudeCode,
  getPluginRoot,
  PLUGIN_ROOT,
  getProjectDir,
  PROJECT_DIR,
  BKIT_PROJECT_DIR,
  getPluginPath,
  getProjectPath,
  getTemplatePath
};
