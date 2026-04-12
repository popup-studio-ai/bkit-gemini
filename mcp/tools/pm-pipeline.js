/**
 * PM Analysis Pipeline
 * Runs discovery -> strategy -> research -> synthesis phases
 * and generates a structured PRD markdown file.
 *
 * @module mcp/tools/pm-pipeline
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Run the PM analysis pipeline
 * @param {object} params
 * @param {string} params.feature - Feature name to analyze
 * @param {string} params.projectDir - Project root directory (absolute path)
 * @param {string[]} [params.phases] - Phases to run (default: all)
 * @param {string} [params.extensionPath] - bkit extension path
 * @returns {Promise<object>} Pipeline results
 */
async function run({ feature, projectDir, phases = ['discovery', 'strategy', 'research', 'synthesis'], extensionPath }) {
  const context = {};
  const results = { feature, phases: [], errors: [] };

  // Step 1: Gather project context
  try {
    context.packageJson = safeReadJson(path.join(projectDir, 'package.json'));
    context.readme = safeReadFile(path.join(projectDir, 'README.md'));
    context.gitLog = execShell('git log --oneline -20', projectDir);
    context.fileStructure = execShell(
      'find . -type f \\( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \\) | head -50',
      projectDir
    );
  } catch (err) {
    results.errors.push(`Context gathering failed: ${err.message}`);
  }

  // Step 2: Execute each phase
  if (phases.includes('discovery')) {
    try {
      const discovery = runDiscovery(context, feature);
      results.phases.push({ name: 'discovery', ...discovery });
      context.discovery = discovery;
    } catch (err) {
      results.errors.push(`Discovery phase failed: ${err.message}`);
    }
  }

  if (phases.includes('strategy')) {
    try {
      const strategy = runStrategy(context, feature);
      results.phases.push({ name: 'strategy', ...strategy });
      context.strategy = strategy;
    } catch (err) {
      results.errors.push(`Strategy phase failed: ${err.message}`);
    }
  }

  if (phases.includes('research')) {
    try {
      const research = runResearch(context, feature);
      results.phases.push({ name: 'research', ...research });
      context.research = research;
    } catch (err) {
      results.errors.push(`Research phase failed: ${err.message}`);
    }
  }

  if (phases.includes('synthesis')) {
    try {
      const prdContent = synthesizePRD(context, feature);
      const prdPath = path.join(projectDir, 'docs', '00-pm', `${feature}.prd.md`);
      fs.mkdirSync(path.dirname(prdPath), { recursive: true });
      fs.writeFileSync(prdPath, prdContent, 'utf-8');
      results.phases.push({ name: 'synthesis', outputPath: prdPath });
      results.prdPath = prdPath;
    } catch (err) {
      results.errors.push(`Synthesis phase failed: ${err.message}`);
    }
  }

  results.status = results.errors.length === 0 ? 'success' : 'partial';
  return results;
}

/**
 * Discovery phase: identify opportunities, tech stack, recent activity
 */
function runDiscovery(context, feature) {
  const techStack = detectTechStack(context.packageJson);
  const existingFeatures = extractFeatures(context.readme);
  const recentActivity = parseGitLog(context.gitLog);

  const opportunities = [];
  if (techStack.length > 0) {
    opportunities.push(`Leverage existing ${techStack.join(', ')} stack for ${feature}`);
  }
  if (recentActivity.length > 0) {
    opportunities.push(`Recent development momentum in ${recentActivity.length} commits`);
  }

  return {
    techStack,
    opportunities,
    existingFeatures,
    recentActivity
  };
}

/**
 * Strategy phase: value proposition, lean canvas
 */
function runStrategy(context, feature) {
  const techInfo = context.discovery ? context.discovery.techStack.join(', ') : 'unknown';

  return {
    valueProposition: `${feature} enables enhanced capabilities for the project built on ${techInfo}`,
    targetUsers: [
      { persona: 'Developer', need: `Efficient ${feature} integration` },
      { persona: 'End User', need: `Seamless ${feature} experience` }
    ],
    leanCanvas: {
      problem: [`Current ${feature} workflow is manual or missing`],
      solution: [`Automated ${feature} with best practices`],
      uniqueValue: `Integrated ${feature} within existing architecture`,
      channels: ['Direct integration', 'CLI tooling'],
      costStructure: ['Development time', 'Testing effort'],
      revenueStreams: ['Productivity gains', 'Quality improvement']
    }
  };
}

/**
 * Research phase: personas, competitive landscape
 */
function runResearch(context, feature) {
  const existingFeatures = context.discovery ? context.discovery.existingFeatures : [];

  return {
    personas: [
      {
        name: 'Technical Lead',
        goals: [`Implement ${feature} with maintainable architecture`],
        painPoints: ['Manual processes', 'Lack of automation']
      },
      {
        name: 'Developer',
        goals: [`Use ${feature} without friction`],
        painPoints: ['Complex setup', 'Poor documentation']
      }
    ],
    competitors: [],
    marketSize: 'Internal tooling - project-specific',
    trends: [
      'AI-assisted development',
      'Automated quality assurance',
      'Shift-left testing'
    ],
    existingCapabilities: existingFeatures
  };
}

/**
 * Synthesis phase: combine all phase results into a structured PRD
 */
function synthesizePRD(context, feature) {
  const discovery = context.discovery || {};
  const strategy = context.strategy || {};
  const research = context.research || {};
  const now = new Date().toISOString();

  const techStack = (discovery.techStack || []).join(', ') || 'Not detected';
  const recentCommits = (discovery.recentActivity || []).slice(0, 5);
  const targetUsers = strategy.targetUsers || [];
  const leanCanvas = strategy.leanCanvas || {};
  const personas = research.personas || [];

  const sections = [
    `# PRD: ${feature}`,
    ``,
    `> Generated: ${now}`,
    `> Status: Draft`,
    ``,
    `## 1. Executive Summary`,
    ``,
    `This PRD defines the requirements and specifications for the **${feature}** feature.`,
    `The project uses ${techStack} as its primary technology stack.`,
    ``,
    `## 2. Problem Statement`,
    ``,
    ...(leanCanvas.problem || []).map(p => `- ${p}`),
    ``,
    `## 3. Target Users & JTBD`,
    ``,
    ...targetUsers.map(u => `- **${u.persona}**: ${u.need}`),
    ``,
    ...personas.map(p => [
      `### ${p.name}`,
      `- Goals: ${(p.goals || []).join(', ')}`,
      `- Pain Points: ${(p.painPoints || []).join(', ')}`,
      ``
    ].join('\n')),
    `## 4. Value Proposition`,
    ``,
    strategy.valueProposition || `${feature} provides significant value to the project.`,
    ``,
    `## 5. Feature Specifications`,
    ``,
    `### 5.1 Functional Requirements`,
    ``,
    `- [ ] Core ${feature} functionality`,
    `- [ ] Integration with existing systems`,
    `- [ ] Error handling and edge cases`,
    `- [ ] User-facing documentation`,
    ``,
    `### 5.2 Non-Functional Requirements`,
    ``,
    `- [ ] Performance: Response time < 200ms`,
    `- [ ] Reliability: 99.9% uptime`,
    `- [ ] Security: Input validation, auth checks`,
    `- [ ] Maintainability: Code coverage > 80%`,
    ``,
    `## 6. Success Metrics`,
    ``,
    `| Metric | Target | Measurement |`,
    `|--------|--------|-------------|`,
    `| Implementation completeness | 100% | Gap analysis |`,
    `| Test pass rate | > 90% | QA runner |`,
    `| Code quality | A grade | Static analysis |`,
    ``,
    `## 7. Dependencies & Risks`,
    ``,
    `### Dependencies`,
    `- Technology stack: ${techStack}`,
    `- Existing feature integrations`,
    ``,
    `### Risks`,
    `| Risk | Probability | Impact | Mitigation |`,
    `|------|-------------|--------|------------|`,
    `| Scope creep | Medium | High | Strict PRD adherence |`,
    `| Technical debt | Low | Medium | Iterative refactoring |`,
    ``,
    `## 8. Competitive Landscape`,
    ``,
    research.competitors && research.competitors.length > 0
      ? research.competitors.map(c => `- ${c}`).join('\n')
      : 'No direct competitors identified for internal tooling.',
    ``,
    `---`,
    ``,
    `## Appendix: Recent Activity`,
    ``,
    ...recentCommits.map(c => `- ${c}`),
    ``
  ];

  return sections.join('\n');
}

// --- Utility functions ---

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function detectTechStack(pkg) {
  if (!pkg) return [];
  const stack = [];
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  if (deps['react'] || deps['next']) stack.push('React');
  if (deps['next']) stack.push('Next.js');
  if (deps['vue']) stack.push('Vue');
  if (deps['express']) stack.push('Express');
  if (deps['fastify']) stack.push('Fastify');
  if (deps['typescript']) stack.push('TypeScript');
  if (deps['jest'] || deps['vitest']) stack.push('Testing');
  if (deps['@playwright/test']) stack.push('Playwright');
  if (deps['tailwindcss']) stack.push('Tailwind');

  // Detect Node.js always if package.json exists
  if (stack.length === 0) stack.push('Node.js');

  return stack;
}

function extractFeatures(readme) {
  if (!readme) return [];
  const features = [];
  const lines = readme.split('\n');

  for (const line of lines) {
    // Extract items from markdown lists under "Features" or "Overview" headings
    const listMatch = line.match(/^[-*]\s+(.+)/);
    if (listMatch) {
      features.push(listMatch[1].trim());
    }
  }

  return features.slice(0, 20); // Cap at 20
}

function parseGitLog(log) {
  if (!log) return [];
  return log.split('\n').filter(l => l.trim()).slice(0, 20);
}

function execShell(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', timeout: 15000 });
  } catch (err) {
    return err.stdout || '';
  }
}

module.exports = { run };
