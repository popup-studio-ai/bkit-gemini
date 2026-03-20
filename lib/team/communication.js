/**
 * AgentCommunication - Inter-agent communication layer
 * Supports hybrid mode: native delegation (v0.33.0+) or MCP spawn fallback.
 *
 * @module lib/team/communication
 */

class AgentCommunication {
  /**
   * Create a new AgentCommunication instance
   * @param {object} mcpServer - MCP server connection (optional)
   */
  constructor(mcpServer = null) {
    this.mcpServer = mcpServer;
    this.pendingTasks = new Map();
    this.results = new Map();
    this.listeners = new Map();
  }

  /**
   * Send a task to a named agent
   * @param {string} agentName - Target agent identifier
   * @param {object} task - Task payload { id, action, data }
   * @returns {{ taskId: string, agent: string, method: string }}
   */
  sendTask(agentName, task) {
    const taskId = task.id || `comm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const method = this._supportsNativeDelegate() ? 'native' : 'mcp';

    this.pendingTasks.set(taskId, {
      agent: agentName,
      task,
      method,
      sentAt: new Date().toISOString()
    });

    try {
      if (method === 'native') {
        this._nativeDelegate(agentName, { ...task, id: taskId });
      } else {
        this._mcpSpawn(agentName, { ...task, id: taskId });
      }
    } catch (error) {
      this.pendingTasks.delete(taskId);
      throw new Error(`Failed to send task to ${agentName}: ${error.message}`);
    }

    return { taskId, agent: agentName, method };
  }

  /**
   * Collect the result from a completed agent task
   * @param {string} taskId - Task identifier
   * @returns {object|null} Result data or null if not ready
   */
  collectResult(taskId) {
    if (this.results.has(taskId)) {
      const result = this.results.get(taskId);
      this.results.delete(taskId);
      this.pendingTasks.delete(taskId);
      return result;
    }
    return null;
  }

  /**
   * Broadcast a message to all active agents
   * @param {object} message - Message payload { type, data }
   * @returns {{ delivered: number }}
   */
  broadcast(message) {
    let delivered = 0;
    for (const [, listener] of this.listeners) {
      try {
        listener(message);
        delivered++;
      } catch (error) {
        // Continue broadcasting even if one listener fails
      }
    }
    return { delivered };
  }

  /**
   * Native delegation for Gemini CLI v0.33.0+
   * @param {string} agentName - Agent name
   * @param {object} task - Task with id
   * @private
   */
  _nativeDelegate(agentName, task) {
    // Native delegation uses Gemini CLI's built-in agent routing
    this.results.set(task.id, {
      status: 'delegated',
      method: 'native',
      agent: agentName,
      delegatedAt: new Date().toISOString()
    });
  }

  /**
   * MCP spawn fallback for older Gemini CLI versions
   * @param {string} agentName - Agent name
   * @param {object} task - Task with id
   * @private
   */
  _mcpSpawn(agentName, task) {
    if (!this.mcpServer) {
      throw new Error('MCP server not configured for spawn fallback');
    }
    this.results.set(task.id, {
      status: 'spawned',
      method: 'mcp',
      agent: agentName,
      spawnedAt: new Date().toISOString()
    });
  }

  /**
   * Check if native delegation is supported
   * @returns {boolean}
   * @private
   */
  _supportsNativeDelegate() {
    try {
      const { getBkitFeatureFlags } = require('../gemini/version');
      return getBkitFeatureFlags().canUseNativeAgents;
    } catch {
      return false;
    }
  }
}

module.exports = AgentCommunication;
