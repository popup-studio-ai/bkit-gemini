/**
 * Common Module - Compatibility Bridge
 * Provides backward compatibility exports from all modules
 */

// Re-export all modules
const core = require('./core');
const pdca = require('./pdca');
const intent = require('./intent');
const task = require('./task');
const adapters = require('./adapters');

module.exports = {
  // Core exports
  ...core,

  // PDCA exports
  ...pdca,

  // Intent exports
  ...intent,

  // Task exports
  ...task,

  // Adapter access
  getAdapter: adapters.getAdapter,
  getPlatformName: adapters.getPlatformName,
  isGemini: adapters.isGemini
};
