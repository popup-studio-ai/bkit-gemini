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
  ...debug
};
