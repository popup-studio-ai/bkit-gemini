/**
 * Task Classification
 * Classifies tasks by size and determines PDCA requirements
 */

/**
 * Classification thresholds (line count)
 */
const CLASSIFICATION_THRESHOLDS = {
  trivial: 10,
  quickFix: 50,
  minorChange: 200,
  feature: 1000
};

/**
 * PDCA level mapping
 */
const PDCA_LEVELS = {
  none: { minLines: 0, maxLines: 30, recommended: false },
  light: { minLines: 30, maxLines: 100, recommended: false },
  standard: { minLines: 100, maxLines: 500, recommended: true },
  full: { minLines: 500, maxLines: Infinity, recommended: true }
};

/**
 * Classify task by content (character count)
 * @param {string} content
 * @returns {'trivial'|'quickFix'|'minorChange'|'feature'|'majorFeature'}
 */
function classifyTask(content) {
  const charCount = content.length;

  if (charCount < 500) return 'trivial';
  if (charCount < 2500) return 'quickFix';
  if (charCount < 10000) return 'minorChange';
  if (charCount < 50000) return 'feature';
  return 'majorFeature';
}

/**
 * Classify task by line count
 * @param {string} content
 * @returns {'trivial'|'quickFix'|'minorChange'|'feature'|'majorFeature'}
 */
function classifyTaskByLines(content) {
  const lineCount = content.split('\n').length;

  if (lineCount < CLASSIFICATION_THRESHOLDS.trivial) return 'trivial';
  if (lineCount < CLASSIFICATION_THRESHOLDS.quickFix) return 'quickFix';
  if (lineCount < CLASSIFICATION_THRESHOLDS.minorChange) return 'minorChange';
  if (lineCount < CLASSIFICATION_THRESHOLDS.feature) return 'feature';
  return 'majorFeature';
}

/**
 * Get PDCA level for classification
 * @param {'trivial'|'quickFix'|'minorChange'|'feature'|'majorFeature'} classification
 * @returns {'none'|'light'|'standard'|'full'}
 */
function getPdcaLevel(classification) {
  const mapping = {
    trivial: 'none',
    quickFix: 'none',
    minorChange: 'light',
    feature: 'standard',
    majorFeature: 'full'
  };

  return mapping[classification] || 'none';
}

/**
 * Get PDCA guidance for classification
 * @param {'trivial'|'quickFix'|'minorChange'|'feature'|'majorFeature'} classification
 * @returns {string}
 */
function getPdcaGuidance(classification) {
  const guidance = {
    trivial: 'Very small change. PDCA documentation not needed.',
    quickFix: 'Small fix. PDCA documentation optional.',
    minorChange: 'Minor change. Consider lightweight PDCA (plan + do).',
    feature: 'Feature-sized change. PDCA documentation recommended.',
    majorFeature: 'Major feature. Full PDCA cycle strongly recommended.'
  };

  return guidance[classification] || 'PDCA guidance not available.';
}

/**
 * Get detailed PDCA guidance by level
 * @param {'none'|'light'|'standard'|'full'} level
 * @returns {{description: string, phases: string[], recommended: boolean}}
 */
function getPdcaGuidanceByLevel(level) {
  const guidance = {
    none: {
      description: 'No PDCA documentation needed for this small change.',
      phases: [],
      recommended: false
    },
    light: {
      description: 'Lightweight PDCA: quick planning before implementation.',
      phases: ['plan', 'do'],
      recommended: false
    },
    standard: {
      description: 'Standard PDCA: plan, design, implement, and verify.',
      phases: ['plan', 'design', 'do', 'check'],
      recommended: true
    },
    full: {
      description: 'Full PDCA cycle with iteration until quality goals met.',
      phases: ['plan', 'design', 'do', 'check', 'act', 'report'],
      recommended: true
    }
  };

  return guidance[level] || guidance.none;
}

/**
 * Estimate task complexity from description
 * @param {string} description
 * @returns {'low'|'medium'|'high'|'very-high'}
 */
function estimateComplexity(description) {
  const lowerDesc = description.toLowerCase();

  const highComplexityIndicators = [
    'refactor', 'redesign', 'migrate', 'rewrite',
    'architecture', 'performance', 'security',
    'integration', 'authentication', 'authorization'
  ];

  const mediumComplexityIndicators = [
    'add', 'create', 'implement', 'update',
    'feature', 'component', 'api', 'endpoint'
  ];

  const lowComplexityIndicators = [
    'fix', 'bug', 'typo', 'style', 'format',
    'rename', 'comment', 'docs', 'readme'
  ];

  // Count indicators
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  for (const indicator of highComplexityIndicators) {
    if (lowerDesc.includes(indicator)) highCount++;
  }

  for (const indicator of mediumComplexityIndicators) {
    if (lowerDesc.includes(indicator)) mediumCount++;
  }

  for (const indicator of lowComplexityIndicators) {
    if (lowerDesc.includes(indicator)) lowCount++;
  }

  // Determine complexity
  if (highCount >= 2) return 'very-high';
  if (highCount >= 1 || mediumCount >= 3) return 'high';
  if (mediumCount >= 1) return 'medium';
  return 'low';
}

module.exports = {
  CLASSIFICATION_THRESHOLDS,
  PDCA_LEVELS,
  classifyTask,
  classifyTaskByLines,
  getPdcaLevel,
  getPdcaGuidance,
  getPdcaGuidanceByLevel,
  estimateComplexity
};
