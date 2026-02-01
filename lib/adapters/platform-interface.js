/**
 * Platform Adapter Interface
 * All platform-specific implementations must implement this interface.
 * @abstract
 */
class PlatformAdapter {
  // Platform Identification
  get name() { throw new Error('Not implemented: name'); }
  get version() { throw new Error('Not implemented: version'); }

  // Environment Detection
  isActive() { throw new Error('Not implemented: isActive'); }
  getPluginRoot() { throw new Error('Not implemented: getPluginRoot'); }
  getProjectDir() { throw new Error('Not implemented: getProjectDir'); }

  // Variable Substitution
  expandVariables(template) { throw new Error('Not implemented: expandVariables'); }

  // Tool Name Mapping
  mapToolName(toolName) { throw new Error('Not implemented: mapToolName'); }
  reverseMapToolName(geminiToolName) { throw new Error('Not implemented: reverseMapToolName'); }

  // Hook I/O
  readHookInput() { throw new Error('Not implemented: readHookInput'); }
  outputAllow(context, hookEvent) { throw new Error('Not implemented: outputAllow'); }
  outputBlock(reason) { throw new Error('Not implemented: outputBlock'); }
  outputEmpty() { throw new Error('Not implemented: outputEmpty'); }

  // Debug Logging
  getDebugLogPath() { throw new Error('Not implemented: getDebugLogPath'); }
  debugLog(category, message, data) { throw new Error('Not implemented: debugLog'); }

  // Context File
  getContextFileName() { throw new Error('Not implemented: getContextFileName'); }

  // Path Utilities
  getTemplatePath(templateName) { throw new Error('Not implemented: getTemplatePath'); }
  getSkillPath(skillName) { throw new Error('Not implemented: getSkillPath'); }
  getAgentPath(agentName) { throw new Error('Not implemented: getAgentPath'); }
}

module.exports = { PlatformAdapter };
