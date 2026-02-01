/**
 * Platform Adapter Loader
 * Detects and loads the appropriate platform adapter
 */

let _adapter = null;

/**
 * Get the current platform adapter
 * @returns {import('./platform-interface').PlatformAdapter}
 */
function getAdapter() {
  if (_adapter) return _adapter;

  // Load Gemini adapter (this is bkit-gemini, so always use Gemini)
  const geminiAdapter = require('./gemini');

  if (geminiAdapter.isActive()) {
    _adapter = geminiAdapter;
    return _adapter;
  }

  // Even if not detected, use Gemini adapter as this is the Gemini version
  _adapter = geminiAdapter;
  return _adapter;
}

/**
 * Get current platform name
 * @returns {string}
 */
function getPlatformName() {
  return getAdapter().name;
}

/**
 * Check if running on Gemini CLI
 * @returns {boolean}
 */
function isGemini() {
  return getAdapter().name === 'gemini';
}

/**
 * Reset adapter (for testing)
 */
function resetAdapter() {
  _adapter = null;
}

module.exports = {
  getAdapter,
  getPlatformName,
  isGemini,
  resetAdapter
};
