/**
 * PDCA Module Exports
 * Aggregates all PDCA-related functionality
 */

const tier = require('./tier');
const level = require('./level');
const phase = require('./phase');
const status = require('./status');
const automation = require('./automation');

module.exports = {
  // Tier
  ...tier,

  // Level
  ...level,

  // Phase
  ...phase,

  // Status
  ...status,

  // Automation
  ...automation
};
