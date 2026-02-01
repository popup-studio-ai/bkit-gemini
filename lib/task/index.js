/**
 * Task Module Exports
 * Aggregates all task management functionality
 */

const classification = require('./classification');
const context = require('./context');
const creator = require('./creator');
const tracker = require('./tracker');

module.exports = {
  // Classification
  ...classification,

  // Context
  ...context,

  // Creator
  ...creator,

  // Tracker
  ...tracker
};
