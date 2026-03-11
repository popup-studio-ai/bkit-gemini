/**
 * Team Module - Entry Point
 * Exports all team coordination modules for multi-agent orchestration.
 *
 * @module lib/team
 */

const TeamCoordinator = require('./coordinator');
const TeamStrategy = require('./strategy');
const CTOLogic = require('./cto-logic');
const AgentCommunication = require('./communication');
const TaskQueue = require('./task-queue');
const StateRecorder = require('./state-recorder');
const PatternSelector = require('./pattern-selector');
const TeamMemory = require('./memory');

module.exports = {
  TeamCoordinator,
  TeamStrategy,
  CTOLogic,
  AgentCommunication,
  TaskQueue,
  StateRecorder,
  PatternSelector,
  TeamMemory
};
