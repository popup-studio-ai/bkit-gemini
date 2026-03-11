/**
 * PatternSelector - Maps PDCA phases to team coordination patterns
 * Defines five patterns: LEADER, COUNCIL, SWARM, PIPELINE, WATCHDOG.
 *
 * @module lib/team/pattern-selector
 */

/**
 * Available team coordination patterns
 * @type {Object<string, { description: string, maxConcurrency: number, decisionMode: string }>}
 */
const PATTERNS = {
  LEADER: {
    description: 'Single leader delegates and aggregates. Best for Act phase.',
    maxConcurrency: 1,
    decisionMode: 'authoritative'
  },
  COUNCIL: {
    description: 'Multiple agents discuss and vote. Best for Design phase.',
    maxConcurrency: 3,
    decisionMode: 'consensus'
  },
  SWARM: {
    description: 'All agents explore in parallel. Best for Plan/brainstorming phase.',
    maxConcurrency: 10,
    decisionMode: 'emergent'
  },
  PIPELINE: {
    description: 'Sequential handoff between agents. Best for Do/implementation phase.',
    maxConcurrency: 2,
    decisionMode: 'sequential'
  },
  WATCHDOG: {
    description: 'Independent agents verify and cross-check. Best for Check phase.',
    maxConcurrency: 5,
    decisionMode: 'independent'
  }
};

/**
 * Mapping from PDCA phase to recommended pattern
 * @type {Object<string, string>}
 */
const PHASE_PATTERN_MAP = {
  plan: 'SWARM',
  design: 'COUNCIL',
  do: 'PIPELINE',
  check: 'WATCHDOG',
  act: 'LEADER'
};

/**
 * Select the best coordination pattern for a PDCA phase and team size
 * @param {string} pdcaPhase - PDCA phase: plan, design, do, check, act
 * @param {number} [teamSize=3] - Number of available agents
 * @returns {{ name: string, description: string, maxConcurrency: number, decisionMode: string }}
 */
function selectPattern(pdcaPhase, teamSize = 3) {
  const phase = (pdcaPhase || 'plan').toLowerCase();
  const patternName = PHASE_PATTERN_MAP[phase] || 'LEADER';
  const pattern = PATTERNS[patternName];

  // Adjust concurrency to team size
  const adjustedConcurrency = Math.min(pattern.maxConcurrency, teamSize);

  return {
    name: patternName,
    description: pattern.description,
    maxConcurrency: adjustedConcurrency,
    decisionMode: pattern.decisionMode
  };
}

/**
 * Get configuration for a specific pattern
 * @param {string} pattern - Pattern name (LEADER, COUNCIL, SWARM, PIPELINE, WATCHDOG)
 * @returns {{ description: string, maxConcurrency: number, decisionMode: string }|null}
 */
function getPatternConfig(pattern) {
  const name = (pattern || '').toUpperCase();
  return PATTERNS[name] ? { ...PATTERNS[name] } : null;
}

module.exports = {
  PATTERNS,
  selectPattern,
  getPatternConfig
};
