#!/usr/bin/env node
/**
 * SessionStart Hook - Enhanced Session Initialization (v2.0.0)
 * Dynamic context injection, output style loading, returning user detection,
 * agent triggers injection, PDCA rules injection, feature report template
 */
const fs = require('fs');
const path = require('path');

const libPath = path.resolve(__dirname, '..', '..', 'lib');

function main() {
  try {
    const { getAdapter } = require(path.join(libPath, 'gemini', 'platform'));
    const adapter = getAdapter();

    const projectDir = adapter.getProjectDir();
    const pluginRoot = adapter.getPluginRoot();

    // 1. Load/Initialize PDCA status
    const pdcaStatusModule = require(path.join(libPath, 'pdca', 'status'));

    // Ensure .bkit/ directory structure exists (CC bkit parity)
    try {
      const { ensureDirectories } = require(path.join(libPath, 'core', 'paths'));
      ensureDirectories(projectDir);
    } catch (e) { /* non-fatal */ }

    const pdcaStatus = pdcaStatusModule.loadPdcaStatus(projectDir);

    // 2. Detect project level
    const level = detectProjectLevel(projectDir);
    pdcaStatus.pipeline.level = level;

    // 3. Save updated PDCA status
    pdcaStatusModule.savePdcaStatus(pdcaStatus, projectDir);

    // 3.5. Auto-generate Policy Engine TOML
    // v2.0.0: Policy Engine always available (minVersion 0.34.0+)
    try {
      const pm = require(path.join(libPath, 'gemini', 'policy'));
      pm.generatePolicyFile(projectDir, pluginRoot);
      pm.generateLevelPolicy(level, projectDir);
      pm.generateExtensionPolicy(pluginRoot);
    } catch (e) {
      // Policy generation is non-fatal
    }

    // 4. Load/Update memory store
    const { getMemory } = require(path.join(libPath, 'core', 'memory'));
    const memoryManager = getMemory(projectDir);
    const memoryCount = memoryManager.startSession();
    const memory = {
      sessionCount: memoryCount,
      platform: memoryManager.get('session.platform', 'gemini'),
      level: level,
      lastSessionStarted: memoryManager.get('session.lastSessionStarted'),
      outputStyle: memoryManager.get('data.pdca.outputStyle')
    };

    // 5. Load output style
    const outputStyle = loadOutputStyle(pluginRoot, level, memory);

    // 6. Detect returning user
    const returningInfo = detectReturningUser(pdcaStatus, memory);

    // 6.5. Get tracker context (v0.32.0+)
    let trackerContext = '';
    try {
      const { getTrackerContextInjection } = require(path.join(libPath, 'gemini', 'tracker'));
      if (pdcaStatus.primaryFeature) {
        const phase = pdcaStatus.features[pdcaStatus.primaryFeature]?.phase || 'plan';
        trackerContext = getTrackerContextInjection(pdcaStatus.primaryFeature, phase);
      }
    } catch (e) { /* tracker bridge not available */ }

    // 7. Generate dynamic context
    const dynamicContext = generateDynamicContext(pdcaStatus, level, memory, returningInfo, outputStyle, pluginRoot, trackerContext);

    // 8. Output result
    const output = {
      status: 'allow',
      context: dynamicContext,
      hookEvent: 'SessionStart',
      metadata: {
        version: '2.0.0',
        platform: 'gemini',
        level: level,
        primaryFeature: pdcaStatus.primaryFeature,
        currentPhase: pdcaStatus.primaryFeature ?
          pdcaStatus.features[pdcaStatus.primaryFeature]?.phase : null,
        outputStyle: outputStyle?.name || 'default',
        isReturningUser: returningInfo.isReturning,
        sessionCount: memory.sessionCount || 1,
        geminiCliFeatures: getGeminiCliFeatures()
      }
    };

    console.log(JSON.stringify(output));
    process.exit(0);

  } catch (error) {
    // Graceful degradation
    if (process.env.BKIT_DEBUG === 'true') {
      console.error('SessionStart hook error:', error);
    }
    console.log(JSON.stringify({
      status: 'allow',
      context: 'bkit Vibecoding Kit v2.0.0 activated (Gemini CLI)',
      hookEvent: 'SessionStart'
    }));
    process.exit(0);
  }
}

// ─── PDCA Status ───────────────────────────────────────────────
// Managed by lib/pdca/status.js

// ─── Level Detection ───────────────────────────────────────────

function detectProjectLevel(projectDir) {
  const enterpriseDirs = ['kubernetes', 'terraform', 'k8s', 'infra'];
  for (const dir of enterpriseDirs) {
    if (fs.existsSync(path.join(projectDir, dir))) return 'Enterprise';
  }

  const dynamicIndicators = [
    { type: 'dir', path: 'lib/bkend' },
    { type: 'dir', path: 'supabase' },
    { type: 'dir', path: 'api' },
    { type: 'file', path: '.mcp.json' },
    { type: 'file', path: 'docker-compose.yml' }
  ];

  for (const indicator of dynamicIndicators) {
    if (fs.existsSync(path.join(projectDir, indicator.path))) return 'Dynamic';
  }

  const packagePath = path.join(projectDir, 'package.json');
  if (fs.existsSync(packagePath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const dynamicPatterns = ['bkend', '@supabase', 'firebase', 'prisma'];
      for (const pattern of dynamicPatterns) {
        if (Object.keys(deps).some(d => d.includes(pattern))) return 'Dynamic';
      }
    } catch (e) { /* ignore */ }
  }

  return 'Starter';
}

// ─── Memory Store ──────────────────────────────────────────────
// Managed by lib/core/memory.js

// ─── Output Style ──────────────────────────────────────────────

function loadOutputStyle(pluginRoot, level, memory) {
  try {
    // Check if user has a preferred style
    const styleName = memory.outputStyle || getDefaultStyleForLevel(level);
    const stylePath = path.join(pluginRoot, 'output-styles', `${styleName}.md`);

    if (!fs.existsSync(stylePath)) return { name: styleName, rules: '' };

    const content = fs.readFileSync(stylePath, 'utf-8');

    // Extract rules section
    const rulesMatch = content.match(/## Output Rules\n([\s\S]*?)(?=\n## |$)/);
    const rules = rulesMatch ? rulesMatch[1].trim() : '';

    return { name: styleName, rules: rules };
  } catch (e) {
    return { name: 'default', rules: '' };
  }
}

function getDefaultStyleForLevel(level) {
  const defaults = {
    'Starter': 'bkit-learning',
    'Dynamic': 'bkit-pdca-guide',
    'Enterprise': 'bkit-enterprise'
  };
  return defaults[level] || 'bkit-pdca-guide';
}

// ─── Returning User Detection ──────────────────────────────────

function detectReturningUser(pdcaStatus, memory) {
  const isReturning = (memory.sessionCount || 1) > 1;
  const lastFeature = pdcaStatus.primaryFeature || null;
  const lastPhase = lastFeature && pdcaStatus.features[lastFeature]
    ? pdcaStatus.features[lastFeature].phase
    : null;
  const matchRate = lastFeature && pdcaStatus.features[lastFeature]
    ? pdcaStatus.features[lastFeature].matchRate
    : null;

  return { isReturning, lastFeature, lastPhase, matchRate };
}

// --- Phase-Aware Context Loading (v2.0.0) ---

const PHASE_CONTEXT_MAP = {
  plan:   ['commands.md', 'pdca-rules.md', 'feature-report.md', 'executive-summary-rules.md'],
  design: ['pdca-rules.md', 'feature-report.md', 'executive-summary-rules.md'],
  do:     ['tool-reference-v2.md', 'skill-triggers.md', 'feature-report.md'],
  check:  ['pdca-rules.md', 'feature-report.md'],
  act:    ['pdca-rules.md', 'feature-report.md'],
  idle:   ['commands.md', 'pdca-rules.md', 'agent-triggers.md', 'skill-triggers.md', 'feature-report.md']
};

function loadPhaseAwareContext(pluginRoot, phase) {
  const effectivePhase = phase && PHASE_CONTEXT_MAP[phase] ? phase : 'idle';
  const files = PHASE_CONTEXT_MAP[effectivePhase];
  const contextDir = path.join(pluginRoot, '.gemini', 'context');

  const sections = [];
  const missing = [];

  for (const fileName of files) {
    const filePath = path.join(contextDir, fileName);
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8').trim();
        if (content) sections.push(content);
      } else {
        missing.push(fileName);
      }
    } catch (e) { /* non-fatal */ }
  }

  // Debug: log missing files when BKIT_DEBUG is enabled
  if (missing.length > 0 && process.env.BKIT_DEBUG === 'true') {
    console.error(`[bkit] Missing phase context files for ${effectivePhase}: ${missing.join(', ')}`);
  }

  return sections.length > 0
    ? `## Phase-Aware Context (${effectivePhase})\n\n${sections.join('\n\n')}`
    : '';
}

// --- Skill Visibility Control (v2.0.0) ---
const LEVEL_SKILL_WHITELIST = {
  Starter: ['starter', 'pdca', 'bkit-rules', 'bkit-templates', 'development-pipeline'],
  Dynamic: [
    'starter', 'pdca', 'bkit-rules', 'bkit-templates', 'development-pipeline',
    'dynamic', 'bkend-quickstart', 'bkend-auth', 'bkend-data', 'bkend-storage',
    'phase-1-schema', 'phase-2-convention', 'phase-3-mockup', 'phase-4-api',
    'phase-5-design-system', 'phase-6-ui-integration',
    'code-review', 'plan-plus', 'simplify', 'zero-script-qa'
  ],
  Enterprise: null // all skills available
};

function buildAvailableSkillsSection(level) {
  const whitelist = LEVEL_SKILL_WHITELIST[level];
  if (!whitelist) {
    return `## Available Skills (Level: ${level})\nAll skills available. Use \`/development-pipeline\` for full list.\n`;
  }

  const lines = [`## Available Skills (Level: ${level})`, '', `${whitelist.length} skills active:`, ''];
  for (const skill of whitelist) {
    lines.push(`- \`/${skill}\``);
  }

  if (level === 'Starter') {
    lines.push('', '> Need more? Run `/dynamic` or add `Level: Dynamic` to GEMINI.md');
  }
  lines.push('');
  return lines.join('\n');
}

// ─── Dynamic Context Generation ────────────────────────────────

function generateDynamicContext(pdcaStatus, level, memory, returningInfo, outputStyle, pluginRoot, trackerContext) {
  const sections = [];

  // Header
  sections.push('# bkit Vibecoding Kit v2.0.0 - Session Start');
  sections.push('');

  // Core Rules (dynamically injected to address GEMINI.md ignore issue #13852)
  sections.push(buildCoreRules());

  // Onboarding
  sections.push(buildOnboardingSection(returningInfo, level));

  // Output Style
  if (outputStyle.rules) {
    sections.push(buildOutputStyleSection(outputStyle));
  }

  // Tracker Integration (v0.32.0+)
  if (trackerContext) {
    sections.push(trackerContext);
  }

  // PDCA Status
  sections.push(buildPdcaStatusSection(pdcaStatus, level));

  // Available Skills (v2.0.0)
  sections.push(buildAvailableSkillsSection(level));

  // Phase-Aware Context (v2.0.0)
  const currentPhase = pdcaStatus.primaryFeature
    ? (pdcaStatus.features?.[pdcaStatus.primaryFeature]?.phase ||
       pdcaStatus.activeFeatures?.[pdcaStatus.primaryFeature]?.phase)
    : null;
  const phaseContext = loadPhaseAwareContext(pluginRoot, currentPhase);
  if (phaseContext) {
    sections.push(phaseContext);
  }

  return sections.join('\n');
}

function buildCoreRules() {
  return [
    '## PDCA Core Rules (Always Apply)',
    '- New feature request → Check/create Plan/Design documents first',
    '- After implementation → Suggest Gap analysis',
    '- Gap Analysis < 90% → Auto-improvement with pdca-iterator',
    '- Gap Analysis >= 90% → Completion report with report-generator',
    '- Always include Feature Usage Report at end of every response',
    '- Always verify important decisions with user - AI is not perfect',
    '',
    '## Natural Language Feature Request Handling',
    '',
    'When user requests a feature (e.g., "build login feature"):',
    '1. Auto-create Plan document with `/pdca plan <feature>`',
    '2. Ask user to confirm before Design',
    '3. Create Design with `/pdca design <feature>`',
    '4. Ask user to confirm before implementation',
    '5. Implement code',
    '6. Suggest Gap analysis: `/pdca analyze <feature>`',
    '',
    'Exception: If user says "just build it" or "skip docs", proceed directly.',
    ''
  ].join('\n');
}

function buildOnboardingSection(returningInfo, level) {
  const lines = [];

  if (returningInfo.isReturning && returningInfo.lastFeature) {
    lines.push('## Previous Work Detected');
    lines.push('');
    lines.push(`- **Feature**: ${returningInfo.lastFeature}`);
    lines.push(`- **Current Phase**: ${returningInfo.lastPhase || 'unknown'}`);
    if (returningInfo.matchRate !== null && returningInfo.matchRate !== undefined) {
      lines.push(`- **Match Rate**: ${returningInfo.matchRate}%`);
    }
    lines.push('');
    lines.push('### MANDATORY: Call AskUserQuestion on user\'s first message');
    lines.push('');
    lines.push('### Actions by selection:');
    lines.push(`- **Continue ${returningInfo.lastFeature}** → Run /pdca status then guide to next phase`);
    lines.push('- **Start new task** → Ask for new feature name then run /pdca plan');
    lines.push('- **Check status** → Run /pdca status');
    lines.push('- **Start freely** → General conversation mode');
    lines.push('');

    // Phase-specific recommendation
    const rec = getPhaseRecommendation(returningInfo.lastPhase, returningInfo.lastFeature, returningInfo.matchRate);
    if (rec) {
      lines.push(`### Recommended Next Step`);
      lines.push(rec);
      lines.push('');
    }
  } else {
    lines.push('## Welcome to bkit');
    lines.push('');
    lines.push('### MANDATORY: Call AskUserQuestion on user\'s first message');
    lines.push('');
    lines.push('### Actions by selection:');
    lines.push('- **Learn bkit** → Run /development-pipeline');
    lines.push('- **Learn Gemini CLI** → Run /gemini-cli-learning');
    lines.push('- **Start new project** → Select level then run /starter, /dynamic, or /enterprise');
    lines.push('- **Start freely** → General conversation mode');
    lines.push('');
  }

  return lines.join('\n');
}

function getPhaseRecommendation(phase, feature, matchRate) {
  if (!phase || !feature) return null;

  const recommendations = {
    plan: `Recommended: Create Design document: \`/pdca design ${feature}\``,
    design: `Recommended: Start implementation: \`/pdca do ${feature}\``,
    do: `Recommended: Run Gap analysis: \`/pdca analyze ${feature}\``,
    check: matchRate !== null && matchRate < 90
      ? `Recommended: Iterate to improve (current ${matchRate}%): \`/pdca iterate ${feature}\``
      : `Recommended: Generate completion report: \`/pdca report ${feature}\``,
    act: `Recommended: Generate completion report: \`/pdca report ${feature}\``
  };

  return recommendations[phase] || null;
}

function buildOutputStyleSection(outputStyle) {
  return [
    `## Output Style: ${outputStyle.name}`,
    '',
    outputStyle.rules,
    ''
  ].join('\n');
}

function buildPdcaStatusSection(pdcaStatus, level) {
  return [
    '## Current Session',
    `- **Level**: ${level}`,
    `- **Primary Feature**: ${pdcaStatus.primaryFeature || 'None'}`,
    `- **Current Phase**: ${pdcaStatus.primaryFeature ? pdcaStatus.features[pdcaStatus.primaryFeature]?.phase || 'plan' : 'N/A'}`,
    `- **Active Features**: ${pdcaStatus.activeFeatures?.length || 0}`,
    ''
  ].join('\n');
}

// ─── Gemini CLI Feature Detection ────────────────────────────

function getGeminiCliFeatures() {
  try {
    const vd = require(path.join(libPath, 'gemini', 'version'));
    const version = vd.detectVersion();
    const flags = vd.getFeatureFlags();
    return {
      version: version.raw,
      isPreview: version.isPreview,
      isNightly: version.isNightly || false,
      flagCount: Object.values(flags).filter(Boolean).length,
      totalFlags: Object.keys(flags).length,
      hasNativeSkills: flags.hasNativeSkillSystem || false,
      hasStrictToml: flags.hasStrictTomlValidation || false
    };
  } catch (e) {
    return { version: 'unknown', isPreview: false, isNightly: false, flagCount: 0, totalFlags: 0, hasNativeSkills: false, hasStrictToml: false };
  }
}

main();
