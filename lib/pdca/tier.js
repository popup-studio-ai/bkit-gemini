/**
 * Language Tier Classification
 * Classifies programming languages by AI-native development suitability
 */
const path = require('path');

/**
 * Language tier definitions
 * Tier 1: AI-Native Essential - Best suited for AI-assisted development
 * Tier 2: Mainstream Recommended - Good support, widely used
 * Tier 3: Domain Specific - Specialized use cases
 * Tier 4: Legacy/Niche - Limited AI support
 * Experimental: Emerging languages with growing support
 */
const TIER_EXTENSIONS = {
  '1': ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.kt'],
  '2': ['.vue', '.svelte', '.astro', '.php', '.rb', '.swift', '.scala'],
  '3': ['.c', '.cpp', '.cc', '.cxx', '.cs', '.m', '.mm'],
  '4': ['.sh', '.bash', '.zsh', '.ps1', '.bat', '.cmd'],
  'experimental': ['.zig', '.nim', '.v', '.odin', '.jai']
};

/**
 * Tier descriptions
 */
const TIER_DESCRIPTIONS = {
  '1': 'AI-Native Essential',
  '2': 'Mainstream Recommended',
  '3': 'Domain Specific',
  '4': 'Legacy/Niche',
  'experimental': 'Experimental',
  'unknown': 'Unknown'
};

/**
 * Get language tier for a file
 * @param {string} filePath
 * @returns {'1'|'2'|'3'|'4'|'experimental'|'unknown'}
 */
function getLanguageTier(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  for (const [tier, extensions] of Object.entries(TIER_EXTENSIONS)) {
    if (extensions.includes(ext)) {
      return tier;
    }
  }

  return 'unknown';
}

/**
 * Get tier description
 * @param {string} tier
 * @returns {string}
 */
function getTierDescription(tier) {
  return TIER_DESCRIPTIONS[tier] || TIER_DESCRIPTIONS.unknown;
}

/**
 * Get PDCA guidance for tier
 * @param {string} tier
 * @returns {string}
 */
function getTierPdcaGuidance(tier) {
  const guidance = {
    '1': 'Full PDCA support. AI excels at generating and reviewing code in this language.',
    '2': 'Good PDCA support. AI handles most tasks well with occasional guidance needed.',
    '3': 'Moderate PDCA support. Manual review recommended for complex logic.',
    '4': 'Limited PDCA support. Consider using higher-tier alternatives when possible.',
    'experimental': 'Experimental support. AI may have outdated or limited knowledge.',
    'unknown': 'Unknown language tier. PDCA support may vary.'
  };

  return guidance[tier] || guidance.unknown;
}

/**
 * Check if file is Tier 1
 * @param {string} filePath
 * @returns {boolean}
 */
function isTier1(filePath) {
  return getLanguageTier(filePath) === '1';
}

/**
 * Check if file is Tier 2
 * @param {string} filePath
 * @returns {boolean}
 */
function isTier2(filePath) {
  return getLanguageTier(filePath) === '2';
}

/**
 * Check if file is Tier 3
 * @param {string} filePath
 * @returns {boolean}
 */
function isTier3(filePath) {
  return getLanguageTier(filePath) === '3';
}

/**
 * Check if file is Tier 4
 * @param {string} filePath
 * @returns {boolean}
 */
function isTier4(filePath) {
  return getLanguageTier(filePath) === '4';
}

/**
 * Check if file is experimental tier
 * @param {string} filePath
 * @returns {boolean}
 */
function isExperimentalTier(filePath) {
  return getLanguageTier(filePath) === 'experimental';
}

module.exports = {
  TIER_EXTENSIONS,
  TIER_DESCRIPTIONS,
  getLanguageTier,
  getTierDescription,
  getTierPdcaGuidance,
  isTier1,
  isTier2,
  isTier3,
  isTier4,
  isExperimentalTier
};
