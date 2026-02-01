/**
 * Intent Module Exports
 * Aggregates all intent detection functionality
 */

const language = require('./language');
const trigger = require('./trigger');
const ambiguity = require('./ambiguity');

module.exports = {
  // Language
  ...language,

  // Trigger
  ...trigger,

  // Ambiguity
  ...ambiguity
};
