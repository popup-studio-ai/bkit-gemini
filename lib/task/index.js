/**
 * Task Module Exports
 * Aggregates all task management functionality
 */

const classification = require('./classification');
const context = require('./context');
const creator = require('./creator');
const tracker = require('./tracker');
const dependency = require('./dependency');

module.exports = {
  // Classification
  ...classification,

  // Context
  ...context,

  // Creator
  ...creator,

  // Tracker
  ...tracker,

  // Dependency (GAP-02)
  ...dependency
};
