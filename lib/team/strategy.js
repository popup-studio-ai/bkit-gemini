/**
 * TeamStrategy - Selects team composition strategy based on project context
 * Maps project level and task size to optimal team configurations.
 *
 * @module lib/team/strategy
 */

/** @type {Object<string, { name: string, maxAgents: number, pattern: string, description: string }>} */
const STRATEGIES = {
  dynamic: {
    name: 'dynamic',
    maxAgents: 3,
    pattern: 'LEADER',
    description: 'Small team for rapid iteration. One leader, two workers.'
  },
  enterprise: {
    name: 'enterprise',
    maxAgents: 5,
    pattern: 'COUNCIL',
    description: 'Mid-size team with council-based decision making.'
  },
  custom: {
    name: 'custom',
    maxAgents: 10,
    pattern: 'SWARM',
    description: 'Large team for complex projects. Swarm-based parallel execution.'
  }
};

class TeamStrategy {
  /**
   * Select the best strategy for the given context
   * @param {string} projectLevel - Project level: starter, dynamic, enterprise, custom
   * @param {string} taskSize - Task size: small, medium, large
   * @returns {{ name: string, maxAgents: number, pattern: string }}
   */
  selectStrategy(projectLevel = 'dynamic', taskSize = 'medium') {
    if (projectLevel === 'custom' || taskSize === 'large') {
      return { ...STRATEGIES.custom };
    }

    if (projectLevel === 'enterprise' || taskSize === 'medium') {
      return { ...STRATEGIES.enterprise };
    }

    return { ...STRATEGIES.dynamic };
  }

  /**
   * Get all available strategies
   * @returns {Object<string, object>}
   */
  getStrategies() {
    return { ...STRATEGIES };
  }

  /**
   * Get a specific strategy by name
   * @param {string} name - Strategy name
   * @returns {object|null}
   */
  getStrategy(name) {
    return STRATEGIES[name] ? { ...STRATEGIES[name] } : null;
  }
}

module.exports = TeamStrategy;
