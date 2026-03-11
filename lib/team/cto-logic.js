/**
 * CTOLogic - CTO-level decision making for team orchestration
 * Provides high-level technical decisions: plan review, design review, agent selection.
 *
 * @module lib/team/cto-logic
 */

class CTOLogic {
  /**
   * Make a CTO-level decision based on context and available options
   * @param {object} context - Decision context { phase, feature, constraints }
   * @param {string[]} options - Available options to choose from
   * @returns {{ decision: string, reasoning: string, confidence: number }}
   */
  makeDecision(context = {}, options = []) {
    if (!options.length) {
      return { decision: null, reasoning: 'No options provided', confidence: 0 };
    }

    const phase = context.phase || 'plan';
    const constraints = context.constraints || [];

    // Score each option based on simplicity and constraint satisfaction
    const scored = options.map(option => {
      let score = 50;
      if (constraints.includes('speed')) score += 10;
      if (constraints.includes('quality')) score += 5;
      if (option.toLowerCase().includes('simple')) score += 15;
      if (option.toLowerCase().includes('minimal')) score += 10;
      return { option, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    return {
      decision: best.option,
      reasoning: `Selected for ${phase} phase. Score: ${best.score}/100.`,
      confidence: Math.min(best.score / 100, 1)
    };
  }

  /**
   * Review a plan document for completeness and quality
   * @param {object} planDoc - Plan document { title, objectives, requirements, risks }
   * @returns {{ approved: boolean, score: number, feedback: string[] }}
   */
  reviewPlan(planDoc = {}) {
    const feedback = [];
    let score = 0;

    if (planDoc.title) score += 20; else feedback.push('Missing title');
    if (planDoc.objectives) score += 25; else feedback.push('Missing objectives');
    if (planDoc.requirements) score += 25; else feedback.push('Missing requirements');
    if (planDoc.risks) score += 15; else feedback.push('Missing risk assessment');
    if (planDoc.successCriteria) score += 15; else feedback.push('Missing success criteria');

    return {
      approved: score >= 70,
      score,
      feedback: feedback.length ? feedback : ['Plan meets all criteria']
    };
  }

  /**
   * Review a design document for technical soundness
   * @param {object} designDoc - Design document { architecture, components, interfaces }
   * @returns {{ approved: boolean, score: number, feedback: string[] }}
   */
  reviewDesign(designDoc = {}) {
    const feedback = [];
    let score = 0;

    if (designDoc.architecture) score += 30; else feedback.push('Missing architecture overview');
    if (designDoc.components) score += 25; else feedback.push('Missing component breakdown');
    if (designDoc.interfaces) score += 25; else feedback.push('Missing interface definitions');
    if (designDoc.dataFlow) score += 20; else feedback.push('Missing data flow description');

    return {
      approved: score >= 55,
      score,
      feedback: feedback.length ? feedback : ['Design meets all criteria']
    };
  }

  /**
   * Select appropriate agents for a given task
   * @param {object} task - Task object { type, complexity, skills }
   * @returns {{ agents: string[], reasoning: string }}
   */
  selectAgents(task = {}) {
    const type = task.type || 'general';
    const complexity = task.complexity || 'medium';

    const agentMap = {
      plan: ['researcher', 'analyst'],
      design: ['architect', 'reviewer'],
      implement: ['developer', 'tester'],
      review: ['reviewer', 'security-analyst'],
      general: ['developer']
    };

    const agents = agentMap[type] || agentMap.general;

    if (complexity === 'high') {
      agents.push('senior-reviewer');
    }

    return {
      agents,
      reasoning: `Selected ${agents.length} agent(s) for ${type} task (${complexity} complexity).`
    };
  }
}

module.exports = CTOLogic;
