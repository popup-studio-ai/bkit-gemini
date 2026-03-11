/**
 * TeamCoordinator - Orchestrates multi-agent team operations
 * Manages agent assignment, status tracking, and team lifecycle.
 *
 * @module lib/team/coordinator
 */

const TaskQueue = require('./task-queue');
const { selectPattern } = require('./pattern-selector');

class TeamCoordinator {
  /**
   * Create a new TeamCoordinator
   * @param {object} config - Team configuration
   * @param {object} adapter - Platform adapter (Gemini CLI, etc.)
   */
  constructor(config = {}, adapter = null) {
    this.config = config;
    this.adapter = adapter;
    this.teamName = null;
    this.strategy = null;
    this.agents = new Map();
    this.taskQueue = new TaskQueue();
    this.initialized = false;
  }

  /**
   * Initialize the team with a name and strategy
   * @param {string} teamName - Team identifier
   * @param {string} strategy - Strategy name (dynamic, enterprise, custom)
   * @returns {{ teamName: string, strategy: string, pattern: string }}
   */
  initialize(teamName, strategy = 'dynamic') {
    this.teamName = teamName;
    this.strategy = strategy;
    this.agents.clear();
    this.taskQueue.clear();
    this.initialized = true;

    const pattern = selectPattern('plan', 1);
    return { teamName, strategy, pattern: pattern.name };
  }

  /**
   * Assign an agent to a task
   * @param {string} agentName - Agent identifier
   * @param {object} task - Task object { id, description, priority }
   * @returns {{ agent: string, taskId: string, status: string }}
   */
  assignAgent(agentName, task) {
    if (!this.initialized) {
      throw new Error('TeamCoordinator not initialized. Call initialize() first.');
    }

    const taskId = task.id || `task-${Date.now()}`;
    const assignment = {
      agentName,
      taskId,
      task,
      status: 'assigned',
      assignedAt: new Date().toISOString()
    };

    this.agents.set(agentName, assignment);
    this.taskQueue.enqueue({ ...task, id: taskId, agent: agentName }, task.priority);

    return { agent: agentName, taskId, status: 'assigned' };
  }

  /**
   * Get current team status
   * @returns {{ teamName: string, agentCount: number, queueSize: number, agents: object[] }}
   */
  getStatus() {
    const agents = [];
    for (const [name, assignment] of this.agents) {
      agents.push({ name, taskId: assignment.taskId, status: assignment.status });
    }

    return {
      teamName: this.teamName,
      agentCount: this.agents.size,
      queueSize: this.taskQueue.size(),
      agents
    };
  }

  /**
   * Dissolve the team and clean up resources
   * @returns {{ teamName: string, dissolved: boolean }}
   */
  dissolve() {
    const name = this.teamName;
    this.agents.clear();
    this.taskQueue.clear();
    this.teamName = null;
    this.strategy = null;
    this.initialized = false;

    return { teamName: name, dissolved: true };
  }
}

module.exports = TeamCoordinator;
