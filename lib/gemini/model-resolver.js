/**
 * Gemini Model Resolver
 * Normalizes model names, validates availability, and provides fallbacks.
 * Prevents agent execution failures from invalid/outdated model IDs.
 *
 * @version 1.0.0
 * @see Issue #20 — agent model mismatch in Gemini CLI v0.36.0
 */

/**
 * Known model aliases — maps shorthand or outdated IDs to current valid IDs.
 * Update this table when Gemini models graduate from preview to GA.
 */
const MODEL_ALIASES = {
  // Preview → GA aliases (Issue #20: preview models may not be available on all plans)
  'gemini-3.1-pro': 'gemini-3-pro',
  'gemini-3.1-pro-preview': 'gemini-3-pro',
  'gemini-3.1-pro-customtools': 'gemini-3-pro',
  'gemini-3.1-pro-preview-customtools': 'gemini-3-pro',
};

/**
 * Canonical model IDs known to be valid in Gemini CLI.
 * Ordered by capability tier (highest first).
 */
const KNOWN_MODELS = [
  'gemini-3-pro',
  'gemini-3-flash',
  'gemini-3-flash-lite',
];

/**
 * Tier-based fallback chain.
 * If the requested model is unavailable, try the next model in the same tier.
 */
const FALLBACK_CHAIN = {
  'gemini-3-pro': 'gemini-3-flash',
  'gemini-3-flash': 'gemini-3-flash-lite',
  'gemini-3-flash-lite': null, // no further fallback
};

/**
 * Resolve a model name to a valid Gemini CLI model ID.
 *
 * Resolution order:
 * 1. Settings override (agentModels in settings.json)
 * 2. Alias resolution (MODEL_ALIASES)
 * 3. Pass-through if already a known model
 * 4. Warning + pass-through for unknown models
 *
 * @param {string} modelName - Model name from agent frontmatter
 * @param {object} [options] - Resolution options
 * @param {object} [options.settingsOverrides] - agentModels from settings.json
 * @param {string} [options.agentName] - Agent name for logging
 * @returns {{ resolved: string, original: string, wasAliased: boolean, warning: string|null }}
 */
function resolveModel(modelName, options = {}) {
  const { settingsOverrides, agentName } = options;
  const original = modelName;
  let resolved = modelName;
  let wasAliased = false;
  let warning = null;

  // Step 1: Check settings override
  if (settingsOverrides && settingsOverrides[modelName]) {
    resolved = settingsOverrides[modelName];
    wasAliased = true;
  }
  // Step 2: Check alias table
  else if (MODEL_ALIASES[modelName]) {
    resolved = MODEL_ALIASES[modelName];
    wasAliased = true;
  }

  // Step 3: Validate the resolved model
  if (!KNOWN_MODELS.includes(resolved)) {
    warning = `[model-resolver] Unknown model "${resolved}"${agentName ? ` for agent "${agentName}"` : ''}. Passing through as-is.`;
  }

  return { resolved, original, wasAliased, warning };
}

/**
 * Get the fallback model for a given model ID.
 * @param {string} modelId - Current model ID
 * @returns {string|null} - Fallback model ID, or null if no fallback
 */
function getFallbackModel(modelId) {
  return FALLBACK_CHAIN[modelId] || null;
}

/**
 * Check if a model ID is known to be valid.
 * @param {string} modelId
 * @returns {boolean}
 */
function isKnownModel(modelId) {
  return KNOWN_MODELS.includes(modelId);
}

/**
 * Get all valid model IDs (including aliases as inputs).
 * Useful for test validation.
 * @returns {string[]}
 */
function getValidModelIds() {
  return [...KNOWN_MODELS];
}

/**
 * Get all alias mappings.
 * @returns {object}
 */
function getAliases() {
  return { ...MODEL_ALIASES };
}

module.exports = {
  resolveModel,
  getFallbackModel,
  isKnownModel,
  getValidModelIds,
  getAliases,
  MODEL_ALIASES,
  KNOWN_MODELS,
  FALLBACK_CHAIN,
};
