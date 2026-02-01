/**
 * Core Module Exports
 * Aggregates all core utilities
 */

const platform = require('./platform');
const io = require('./io');
const cache = require('./cache');
const config = require('./config');
const file = require('./file');
const debug = require('./debug');
const permission = require('./permission');
const memory = require('./memory');

module.exports = {
  // Platform
  ...platform,

  // I/O
  ...io,

  // Cache
  ...cache,

  // Config
  ...config,

  // File
  ...file,

  // Debug
  ...debug,

  // Permission (GAP-05)
  ...permission,

  // Memory (GAP-06)
  ...memory
};
