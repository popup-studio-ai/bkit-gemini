/**
 * Gemini CLI Version Detector
 * Detects installed Gemini CLI version for compatibility branching
 *
 * Detection Order:
 * 1. GEMINI_CLI_VERSION env var (fastest)
 * 2. npm list -g @google/gemini-cli (reliable)
 * 3. gemini --version (fallback)
 *
 * @version 1.5.4
 */
const { execSync } = require('child_process');

// Cache version after first detection
let _cachedVersion = null;

/**
 * Parse version string
 * @param {string} raw - e.g., "0.30.0-preview.3"
 * @returns {{ major: number, minor: number, patch: number, previewNum: number|null, raw: string, isPreview: boolean }}
 */
function parseVersion(raw) {
  if (!raw || typeof raw !== 'string') {
    return { major: 0, minor: 29, patch: 0, previewNum: null, raw: raw || '0.29.0', isPreview: false };
  }

  const match = raw.match(/^(\d+)\.(\d+)\.(\d+)(-preview\.(\d+))?/);
  if (!match) {
    return { major: 0, minor: 29, patch: 0, previewNum: null, raw, isPreview: false };
  }

  return {
    major: parseInt(match[1]),
    minor: parseInt(match[2]),
    patch: parseInt(match[3]),
    previewNum: match[5] ? parseInt(match[5]) : null,
    raw,
    isPreview: !!match[4]
  };
}

/**
 * Detect Gemini CLI version
 * @returns {{ major: number, minor: number, patch: number, previewNum: number|null, raw: string, isPreview: boolean }}
 */
function detectVersion() {
  if (_cachedVersion) return _cachedVersion;

  let raw = null;

  // Strategy 1: Environment variable (fastest)
  raw = process.env.GEMINI_CLI_VERSION || null;

  // Strategy 2: npm global package
  if (!raw) {
    try {
      const output = execSync(
        'npm list -g @google/gemini-cli --depth=0 --json 2>/dev/null',
        { timeout: 3000, encoding: 'utf-8' }
      );
      const json = JSON.parse(output);
      raw = json.dependencies?.['@google/gemini-cli']?.version || null;
    } catch (e) { /* ignore */ }
  }

  // Strategy 3: CLI --version
  if (!raw) {
    try {
      const output = execSync('gemini --version 2>/dev/null', {
        timeout: 3000,
        encoding: 'utf-8'
      });
      const match = output.match(/(\d+\.\d+\.\d+(-preview\.\d+)?)/);
      if (match) raw = match[1];
    } catch (e) { /* ignore */ }
  }

  // Default to minimum supported version
  if (!raw) raw = '0.29.0';

  _cachedVersion = parseVersion(raw);
  return _cachedVersion;
}

/**
 * Compare two version objects
 * @param {{ major: number, minor: number, patch: number }} a
 * @param {{ major: number, minor: number, patch: number }} b
 * @returns {number} -1 if a < b, 0 if equal, 1 if a > b
 */
function compareVersions(a, b) {
  if (a.major !== b.major) return a.major > b.major ? 1 : -1;
  if (a.minor !== b.minor) return a.minor > b.minor ? 1 : -1;
  if (a.patch !== b.patch) return a.patch > b.patch ? 1 : -1;
  return 0;
}

/**
 * Check if CLI version >= target
 * @param {string} target - e.g., "0.30.0"
 * @returns {boolean}
 */
function isVersionAtLeast(target) {
  const current = detectVersion();
  const tgt = parseVersion(target);
  return compareVersions(current, tgt) >= 0;
}

/**
 * Feature flags based on detected version
 * @returns {object}
 */
function getFeatureFlags() {
  return {
    hasPlanMode: isVersionAtLeast('0.29.0'),
    hasPolicyEngine: isVersionAtLeast('0.30.0'),
    hasExcludeToolsDeprecated: isVersionAtLeast('0.30.0'),
    hasGemini3Default: isVersionAtLeast('0.29.0'),
    hasSkillsStable: isVersionAtLeast('0.26.0'),
    hasExtensionRegistry: isVersionAtLeast('0.29.0'),
    hasSDK: isVersionAtLeast('0.30.0')
  };
}

/**
 * Get human-readable version summary
 * @returns {string}
 */
function getVersionSummary() {
  const v = detectVersion();
  const flags = getFeatureFlags();
  const features = Object.entries(flags)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name)
    .join(', ');
  return `Gemini CLI ${v.raw}${v.isPreview ? ' (preview)' : ''} | Features: ${features}`;
}

/**
 * Reset cached version (for testing)
 */
function resetCache() {
  _cachedVersion = null;
}

module.exports = {
  detectVersion,
  parseVersion,
  compareVersions,
  isVersionAtLeast,
  getFeatureFlags,
  getVersionSummary,
  resetCache
};
