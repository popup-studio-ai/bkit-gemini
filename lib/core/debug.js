/**
 * Debug Logging Utilities
 * Provides logging for development and troubleshooting
 */
const fs = require('fs');
const path = require('path');

/**
 * Debug log paths by platform
 */
const DEBUG_LOG_PATHS = {
  gemini: () => {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '/tmp';
    return path.join(homeDir, '.gemini', 'bkit-debug.log');
  }
};

/**
 * Get debug log path for current platform
 * @returns {string}
 */
function getDebugLogPath() {
  return DEBUG_LOG_PATHS.gemini();
}

/**
 * Check if debug mode is enabled
 * @returns {boolean}
 */
function isDebugEnabled() {
  return process.env.BKIT_DEBUG === 'true';
}

/**
 * Write debug log entry
 * @param {string} category - Log category (e.g., 'hook', 'pdca', 'intent')
 * @param {string} message - Log message
 * @param {*} data - Optional data to include
 */
function debugLog(category, message, data) {
  if (!isDebugEnabled()) return;

  try {
    const logPath = getDebugLogPath();
    const logDir = path.dirname(logPath);

    // Ensure log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    const dataStr = data !== undefined ? '\n' + JSON.stringify(data, null, 2) : '';
    const logEntry = `[${timestamp}] [${category.toUpperCase()}] ${message}${dataStr}\n`;

    fs.appendFileSync(logPath, logEntry);
  } catch (e) {
    // Silently fail - debug logging should never break the app
  }
}

/**
 * Clear debug log file
 */
function clearDebugLog() {
  try {
    const logPath = getDebugLogPath();
    if (fs.existsSync(logPath)) {
      fs.writeFileSync(logPath, '');
    }
  } catch {
    // Silently fail
  }
}

/**
 * Get debug log contents
 * @param {number} lines - Number of lines to retrieve (0 = all)
 * @returns {string}
 */
function getDebugLog(lines = 0) {
  try {
    const logPath = getDebugLogPath();
    if (!fs.existsSync(logPath)) return '';

    const content = fs.readFileSync(logPath, 'utf-8');

    if (lines <= 0) return content;

    const allLines = content.split('\n');
    return allLines.slice(-lines).join('\n');
  } catch {
    return '';
  }
}

module.exports = {
  DEBUG_LOG_PATHS,
  getDebugLogPath,
  isDebugEnabled,
  debugLog,
  clearDebugLog,
  getDebugLog
};
