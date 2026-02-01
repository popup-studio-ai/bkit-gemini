/**
 * Trigger Matching
 * Matches user input to agents and skills
 */
const { AGENT_TRIGGER_PATTERNS, SKILL_TRIGGER_PATTERNS, matchMultiLangPattern } = require('./language');

/**
 * New feature detection patterns
 */
const NEW_FEATURE_PATTERNS = {
  en: [
    /(?:create|build|make|add|implement|develop)\s+(?:a\s+)?(?:new\s+)?([a-z][a-z0-9-_\s]*?)(?:\s+feature|\s+function|\s+module|\s+page)?$/i,
    /new\s+feature\s*[:\-]?\s*([a-z][a-z0-9-_\s]*)/i,
    /implement\s+([a-z][a-z0-9-_\s]*)/i
  ],
  ko: [
    /([가-힣a-z0-9-_]+)\s*(?:기능|모듈|페이지)(?:를|을)?\s*(?:만들|추가|개발|구현)/,
    /(?:새|새로운)\s*(?:기능|모듈|페이지)\s*[:\-]?\s*([가-힣a-z0-9-_]+)/
  ],
  ja: [
    /([ぁ-んァ-ンa-z0-9-_]+)\s*(?:機能|モジュール)(?:を)?(?:作成|追加|開発|実装)/,
    /新(?:しい)?(?:機能|モジュール)\s*[:\-]?\s*([ぁ-んァ-ンa-z0-9-_]+)/
  ],
  zh: [
    /(?:创建|构建|添加|实现|开发)\s*([a-z\u4e00-\u9fff][a-z0-9-_\u4e00-\u9fff]*?)(?:\s*功能|\s*模块)?/i,
    /新(?:功能|模块)\s*[:\-]?\s*([a-z\u4e00-\u9fff][a-z0-9-_\u4e00-\u9fff]*)/i
  ]
};

/**
 * Match implicit agent trigger
 * @param {string} userMessage
 * @returns {{agent: string, confidence: number}|null}
 */
function matchImplicitAgentTrigger(userMessage) {
  const lowerMessage = userMessage.toLowerCase();

  for (const [agent, patterns] of Object.entries(AGENT_TRIGGER_PATTERNS)) {
    for (const [lang, langPatterns] of Object.entries(patterns)) {
      for (const pattern of langPatterns) {
        if (lowerMessage.includes(pattern.toLowerCase())) {
          return {
            agent,
            confidence: 0.8,
            matchedPattern: pattern,
            language: lang
          };
        }
      }
    }
  }

  return null;
}

/**
 * Match implicit skill trigger
 * @param {string} userMessage
 * @returns {{skill: string, level: string, confidence: number}|null}
 */
function matchImplicitSkillTrigger(userMessage) {
  const lowerMessage = userMessage.toLowerCase();

  for (const [skill, patterns] of Object.entries(SKILL_TRIGGER_PATTERNS)) {
    for (const [lang, langPatterns] of Object.entries(patterns)) {
      for (const pattern of langPatterns) {
        if (lowerMessage.includes(pattern.toLowerCase())) {
          // Map skill to level
          const levelMap = {
            'starter': 'Starter',
            'dynamic': 'Dynamic',
            'enterprise': 'Enterprise',
            'mobile-app': 'Dynamic'
          };

          return {
            skill,
            level: levelMap[skill] || 'Starter',
            confidence: 0.75,
            matchedPattern: pattern,
            language: lang
          };
        }
      }
    }
  }

  return null;
}

/**
 * Detect new feature intent
 * @param {string} userMessage
 * @returns {{isNewFeature: boolean, featureName: string|null, confidence: number}}
 */
function detectNewFeatureIntent(userMessage) {
  for (const [lang, patterns] of Object.entries(NEW_FEATURE_PATTERNS)) {
    for (const pattern of patterns) {
      const match = userMessage.match(pattern);
      if (match && match[1]) {
        const featureName = match[1]
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9가-힣ぁ-んァ-ン一-龯-_]/g, '');

        if (featureName.length >= 2) {
          return {
            isNewFeature: true,
            featureName,
            confidence: 0.8,
            language: lang
          };
        }
      }
    }
  }

  return {
    isNewFeature: false,
    featureName: null,
    confidence: 0
  };
}

/**
 * Extract feature name from request
 * @param {string} request
 * @returns {string|null}
 */
function extractFeatureNameFromRequest(request) {
  const intent = detectNewFeatureIntent(request);

  if (intent.isNewFeature && intent.featureName) {
    return intent.featureName;
  }

  // Fallback: try to extract quoted strings
  const quoted = request.match(/["']([^"']+)["']/);
  if (quoted) {
    return quoted[1].toLowerCase().replace(/\s+/g, '-');
  }

  // Fallback: extract last noun-like word
  const words = request.split(/\s+/).filter(w => w.length > 2);
  if (words.length > 0) {
    const lastWord = words[words.length - 1].toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (lastWord.length >= 3) {
      return lastWord;
    }
  }

  return null;
}

module.exports = {
  NEW_FEATURE_PATTERNS,
  matchImplicitAgentTrigger,
  matchImplicitSkillTrigger,
  detectNewFeatureIntent,
  extractFeatureNameFromRequest
};
