/**
 * Task Context Management
 * Manages active skill and agent context
 */

// In-memory context storage
let _activeSkill = null;
let _activeAgent = null;
let _contextMetadata = {};

/**
 * Set active skill
 * @param {string} skillName
 */
function setActiveSkill(skillName) {
  _activeSkill = skillName;
  _contextMetadata.skillSetAt = new Date().toISOString();
}

/**
 * Set active agent
 * @param {string} agentName
 */
function setActiveAgent(agentName) {
  _activeAgent = agentName;
  _contextMetadata.agentSetAt = new Date().toISOString();
}

/**
 * Get active skill
 * @returns {string|null}
 */
function getActiveSkill() {
  return _activeSkill;
}

/**
 * Get active agent
 * @returns {string|null}
 */
function getActiveAgent() {
  return _activeAgent;
}

/**
 * Clear active context
 */
function clearActiveContext() {
  _activeSkill = null;
  _activeAgent = null;
  _contextMetadata = {};
}

/**
 * Get full active context
 * @returns {{skill: string|null, agent: string|null, metadata: object}}
 */
function getActiveContext() {
  return {
    skill: _activeSkill,
    agent: _activeAgent,
    metadata: { ..._contextMetadata }
  };
}

/**
 * Check if any context is active
 * @returns {boolean}
 */
function hasActiveContext() {
  return _activeSkill !== null || _activeAgent !== null;
}

/**
 * Set context metadata
 * @param {string} key
 * @param {*} value
 */
function setContextMetadata(key, value) {
  _contextMetadata[key] = value;
}

/**
 * Get context metadata
 * @param {string} key
 * @returns {*}
 */
function getContextMetadata(key) {
  return _contextMetadata[key];
}

module.exports = {
  setActiveSkill,
  setActiveAgent,
  getActiveSkill,
  getActiveAgent,
  clearActiveContext,
  getActiveContext,
  hasActiveContext,
  setContextMetadata,
  getContextMetadata
};
