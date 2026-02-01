/**
 * File Type Detection and Utilities
 * Provides file classification for PDCA workflow
 */
const path = require('path');

/**
 * Language tier extensions mapping
 * Tier 1: AI-Native Essential
 * Tier 2: Mainstream Recommended
 * Tier 3: Domain Specific
 * Tier 4: Legacy/Niche
 */
const TIER_EXTENSIONS = {
  '1': ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.kt'],
  '2': ['.vue', '.svelte', '.astro', '.php', '.rb', '.swift', '.scala'],
  '3': ['.c', '.cpp', '.cc', '.cxx', '.cs', '.m', '.mm'],
  '4': ['.sh', '.bash', '.zsh', '.ps1', '.bat', '.cmd'],
  'experimental': ['.zig', '.nim', '.v', '.odin', '.jai']
};

/**
 * Default patterns to exclude from scanning
 */
const DEFAULT_EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.cache',
  'coverage',
  '__pycache__',
  '.pytest_cache',
  'target',
  'vendor'
];

/**
 * Default feature extraction patterns
 */
const DEFAULT_FEATURE_PATTERNS = [
  'features',
  'modules',
  'components',
  'pages',
  'services',
  'lib',
  'src'
];

/**
 * Get file extension
 * @param {string} filePath
 * @returns {string}
 */
function getExtension(filePath) {
  return path.extname(filePath).toLowerCase();
}

/**
 * Check if file is a source code file
 * @param {string} filePath
 * @returns {boolean}
 */
function isSourceFile(filePath) {
  const ext = getExtension(filePath);
  return Object.values(TIER_EXTENSIONS).flat().includes(ext);
}

/**
 * Check if file is a Tier 1 (AI-Native) code file
 * @param {string} filePath
 * @returns {boolean}
 */
function isCodeFile(filePath) {
  const ext = getExtension(filePath);
  return TIER_EXTENSIONS['1'].includes(ext);
}

/**
 * Check if file is a UI component file
 * @param {string} filePath
 * @returns {boolean}
 */
function isUiFile(filePath) {
  const ext = getExtension(filePath);
  const name = path.basename(filePath).toLowerCase();

  // React/Vue/Svelte components
  if (['.tsx', '.jsx', '.vue', '.svelte'].includes(ext)) {
    return true;
  }

  // Check for component naming patterns
  if (name.includes('component') || name.includes('page') || name.includes('view')) {
    return true;
  }

  // Check path for UI directories
  const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();
  return normalizedPath.includes('/components/') ||
         normalizedPath.includes('/pages/') ||
         normalizedPath.includes('/views/') ||
         normalizedPath.includes('/ui/');
}

/**
 * Check if file is an environment file
 * @param {string} filePath
 * @returns {boolean}
 */
function isEnvFile(filePath) {
  const name = path.basename(filePath).toLowerCase();
  return name.startsWith('.env') ||
         name === 'env' ||
         name.endsWith('.env') ||
         name.includes('.env.');
}

/**
 * Check if file is a configuration file
 * @param {string} filePath
 * @returns {boolean}
 */
function isConfigFile(filePath) {
  const name = path.basename(filePath).toLowerCase();
  const ext = getExtension(filePath);

  const configPatterns = [
    'config', 'settings', 'options', 'preferences',
    '.rc', 'rc.', '.config'
  ];

  const configExtensions = ['.json', '.yaml', '.yml', '.toml', '.ini'];

  return configPatterns.some(p => name.includes(p)) ||
         configExtensions.includes(ext);
}

/**
 * Extract feature name from file path
 * @param {string} filePath
 * @returns {string|null}
 */
function extractFeature(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Try to extract from feature patterns
  for (const pattern of DEFAULT_FEATURE_PATTERNS) {
    const regex = new RegExp(`/${pattern}/([^/]+)`, 'i');
    const match = normalizedPath.match(regex);
    if (match) {
      return match[1].replace(/\.[^.]+$/, ''); // Remove extension
    }
  }

  // Fallback to directory name
  const dirName = path.dirname(normalizedPath).split('/').pop();
  if (dirName && !DEFAULT_EXCLUDE_PATTERNS.includes(dirName)) {
    return dirName;
  }

  return null;
}

/**
 * Get language tier for a file
 * @param {string} filePath
 * @returns {'1'|'2'|'3'|'4'|'experimental'|'unknown'}
 */
function getLanguageTier(filePath) {
  const ext = getExtension(filePath);

  for (const [tier, extensions] of Object.entries(TIER_EXTENSIONS)) {
    if (extensions.includes(ext)) {
      return tier;
    }
  }

  return 'unknown';
}

module.exports = {
  TIER_EXTENSIONS,
  DEFAULT_EXCLUDE_PATTERNS,
  DEFAULT_FEATURE_PATTERNS,
  getExtension,
  isSourceFile,
  isCodeFile,
  isUiFile,
  isEnvFile,
  isConfigFile,
  extractFeature,
  getLanguageTier
};
