/**
 * Ambiguity Detection
 * Analyzes text for ambiguity and generates clarifying questions
 */

/**
 * Check if text contains file path
 * @param {string} text
 * @returns {boolean}
 */
function containsFilePath(text) {
  return /[a-zA-Z0-9_.-]+(?:\/|\\)[a-zA-Z0-9_.-]+/.test(text) ||
         /\.[a-z]{2,4}(?::\d+)?(?:\s|$)/i.test(text) ||
         /\.[a-z]{2,4}\b/i.test(text);
}

/**
 * Check if text contains technical terms
 * @param {string} text
 * @returns {boolean}
 */
function containsTechnicalTerms(text) {
  const technicalTerms = [
    'api', 'database', 'server', 'client', 'component', 'function',
    'class', 'module', 'package', 'dependency', 'endpoint', 'route',
    'controller', 'service', 'model', 'view', 'repository', 'interface',
    'type', 'schema', 'migration', 'seed', 'test', 'mock', 'stub',
    'hook', 'middleware', 'plugin', 'extension', 'config', 'env'
  ];

  const lowerText = text.toLowerCase();
  return technicalTerms.some(term => lowerText.includes(term));
}

/**
 * Check if text has specific nouns
 * @param {string} text
 * @returns {boolean}
 */
function hasSpecificNouns(text) {
  // Check for proper nouns (capitalized words not at sentence start)
  const properNouns = text.match(/(?<!\.\s|^)[A-Z][a-z]+/g);
  if (properNouns && properNouns.length > 0) return true;

  // Check for quoted strings
  if (/"[^"]+"/.test(text) || /'[^']+'/.test(text)) return true;

  // Check for code-like identifiers
  if (/[a-z]+[A-Z][a-z]+|[a-z]+_[a-z]+/.test(text)) return true;

  return false;
}

/**
 * Check if text has scope definition
 * @param {string} text
 * @returns {boolean}
 */
function hasScopeDefinition(text) {
  const scopeIndicators = [
    'in the', 'for the', 'of the', 'within', 'inside',
    'only', 'specific', 'particular', 'this', 'that',
    'all', 'every', 'each', 'across', 'throughout'
  ];

  const lowerText = text.toLowerCase();
  return scopeIndicators.some(indicator => lowerText.includes(indicator));
}

/**
 * Check if text has multiple interpretations
 * @param {string} text
 * @returns {boolean}
 */
function hasMultipleInterpretations(text) {
  const ambiguityIndicators = [
    'or', 'either', 'maybe', 'might', 'could',
    'perhaps', 'possibly', 'any', 'some',
    'whatever', 'however', 'whichever'
  ];

  const lowerText = text.toLowerCase();
  return ambiguityIndicators.some(indicator =>
    new RegExp(`\\b${indicator}\\b`).test(lowerText)
  );
}

/**
 * Detect context conflicts
 * @param {string} context1
 * @param {string} context2
 * @returns {string[]}
 */
function detectContextConflicts(context1, context2) {
  const conflicts = [];

  // Simple conflict detection based on opposing terms
  const opposingPairs = [
    ['add', 'remove'],
    ['create', 'delete'],
    ['enable', 'disable'],
    ['start', 'stop'],
    ['increase', 'decrease'],
    ['frontend', 'backend'],
    ['client', 'server']
  ];

  const lower1 = context1.toLowerCase();
  const lower2 = context2.toLowerCase();

  for (const [term1, term2] of opposingPairs) {
    if ((lower1.includes(term1) && lower2.includes(term2)) ||
        (lower1.includes(term2) && lower2.includes(term1))) {
      conflicts.push(`Possible conflict: "${term1}" vs "${term2}"`);
    }
  }

  return conflicts;
}

/**
 * Calculate ambiguity score
 * @param {string} text
 * @returns {number} Score from 0 (clear) to 100 (very ambiguous)
 */
function calculateAmbiguityScore(text) {
  // Magic word bypass
  if (text.trim().startsWith('!') || /\!(?:hotfix|prototype|bypass)/i.test(text)) {
    return 0;
  }

  let score = 0;

  // Short messages tend to be ambiguous
  if (text.length < 15) score += 0.25;
  else if (text.length < 30) score += 0.15;

  // Missing technical terms suggests vagueness
  if (!containsTechnicalTerms(text)) score += 0.2;

  // Missing specific nouns
  if (!hasSpecificNouns(text)) score += 0.15;

  // Missing scope definition
  if (!hasScopeDefinition(text)) score += 0.1;

  // Multiple interpretations possible
  if (hasMultipleInterpretations(text)) score += 0.25;

  // Questions without specifics are ambiguous
  if (/\?$/.test(text.trim()) && !containsFilePath(text)) score += 0.1;

  // Vague action words
  const vagueTerms = ['fix', 'update', 'change', 'modify', 'improve', 'handle'];
  const lowerText = text.toLowerCase();
  for (const term of vagueTerms) {
    if (new RegExp(`\\b${term}\\b`).test(lowerText)) {
      score += 0.05;
    }
  }

  // File path significantly reduces ambiguity
  if (containsFilePath(text)) {
    score -= 0.3;
  }

  return Math.round(Math.max(0, Math.min(score, 1)) * 100);
}

/**
 * Generate clarifying questions
 * @param {string} text
 * @returns {string[]}
 */
function generateClarifyingQuestions(text) {
  const questions = [];
  const lowerText = text.toLowerCase();

  // Check for missing specifics
  if (!containsFilePath(text) && containsTechnicalTerms(text)) {
    questions.push('Which specific file or component should be modified?');
  }

  // Check for vague actions
  if (/\b(fix|update|change)\b/i.test(text) && !hasScopeDefinition(text)) {
    questions.push('What specific issue or behavior should be addressed?');
  }

  // Check for feature requests without details
  if (/\b(add|create|implement)\b/i.test(text) && !containsTechnicalTerms(text)) {
    questions.push('What are the technical requirements for this feature?');
  }

  // Check for multiple interpretations
  if (hasMultipleInterpretations(text)) {
    questions.push('Which option would you prefer?');
  }

  // Default question if very ambiguous
  if (questions.length === 0 && calculateAmbiguityScore(text) > 0.5) {
    questions.push('Could you provide more details about what you want to accomplish?');
  }

  return questions;
}

module.exports = {
  containsFilePath,
  containsTechnicalTerms,
  hasSpecificNouns,
  hasScopeDefinition,
  hasMultipleInterpretations,
  detectContextConflicts,
  calculateAmbiguityScore,
  generateClarifyingQuestions
};
