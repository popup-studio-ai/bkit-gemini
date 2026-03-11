#!/usr/bin/env node
/**
 * SessionStart Hook - Enhanced Session Initialization (v1.5.8)
 * Dynamic context injection, output style loading, returning user detection,
 * agent triggers injection, PDCA rules injection, feature report template
 */
const fs = require('fs');
const path = require('path');

const libPath = path.resolve(__dirname, '..', '..', 'lib');

function main() {
  try {
    const { getAdapter } = require(path.join(libPath, 'adapters'));
    const adapter = getAdapter();

    const projectDir = adapter.getProjectDir();
    const pluginRoot = adapter.getPluginRoot();

    // 1. Load/Initialize PDCA status
    const pdcaStatusModule = require(path.join(libPath, 'pdca', 'status'));
    const pdcaStatus = pdcaStatusModule.loadPdcaStatus(projectDir);

    // 2. Detect project level
    const level = detectProjectLevel(projectDir);
    pdcaStatus.pipeline.level = level;

    // 3. Save updated PDCA status
    pdcaStatusModule.savePdcaStatus(pdcaStatus, projectDir);

    // 3.5. Auto-generate Policy Engine TOML (v0.30.0+)
    try {
      const vd = require(path.join(libPath, 'adapters', 'gemini', 'version-detector'));
      const flags = vd.getFeatureFlags();
      if (flags.hasPolicyEngine) {
        const pm = require(path.join(libPath, 'adapters', 'gemini', 'policy-migrator'));
        const result = pm.generatePolicyFile(projectDir, pluginRoot);

        // 3.6. Generate level-specific policy (v0.31.0+)
        if (flags.hasProjectLevelPolicy) {
          pm.generateLevelPolicy(level, projectDir);
        }

        // 3.7. Generate extension policy (v0.32.0+)
        if (flags.hasExtensionPolicies) {
          pm.generateExtensionPolicy(pluginRoot);
        }
      }
    } catch (e) {
      // Policy TOML generation skipped - non-fatal
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
      const { getTrackerContextInjection } = require(path.join(libPath, 'adapters', 'gemini', 'tracker-bridge'));
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
        version: '1.5.8',
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
      context: 'bkit Vibecoding Kit v1.5.8 activated (Gemini CLI)',
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

// ─── Dynamic Context Generation ────────────────────────────────

function generateDynamicContext(pdcaStatus, level, memory, returningInfo, outputStyle, pluginRoot, trackerContext) {
  const sections = [];

  // Header
  sections.push('# bkit Vibecoding Kit v1.5.8 - Session Start');
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

  // Agent Triggers
  sections.push(buildAgentTriggersSection());

  // Feature Report
  sections.push(buildFeatureReportSection());

  // Auto-Trigger Keywords
  sections.push(buildAutoTriggerSection());

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

function buildAgentTriggersSection() {
  return [
    '## Agent Auto-Triggers (8 Languages)',
    '',
    '| Keywords | Agent | Action |',
    '|----------|-------|--------|',
    '| verify, 검증, 確認, 验证, verificar, vérifier, prüfen, verificare | gap-detector | Gap analysis |',
    '| improve, 개선, 改善, 改进, mejorar, améliorer, verbessern, migliorare | pdca-iterator | Auto-improvement |',
    '| analyze, 분석, 分析, 品質, analizar, analyser, analysieren, analizzare | code-analyzer | Code quality |',
    '| report, 보고서, 報告, 报告, informe, rapport, Bericht, rapporto | report-generator | Completion report |',
    '| help, 도움, 助けて, 帮助, ayuda, aide, Hilfe, aiuto | starter-guide | Beginner guide |',
    '| bkend, BaaS, 백엔드, バックエンド, 后端, backend | bkend-expert | Backend/BaaS expert |',
    '| pm, PRD, PM 분석, PM分析, PM-Analyse, analisi PM | pm-lead | PM Team analysis |',
    '| team, 팀 구성, チームリード, 团队领导, CTO | cto-lead | Team orchestration |',
    ''
  ].join('\n');
}

function buildFeatureReportSection() {
  return [
    '## Feature Usage Report (Required)',
    '',
    'Include at the end of every response:',
    '```',
    '─────────────────────────────────────────────────',
    '📊 bkit Feature Usage',
    '─────────────────────────────────────────────────',
    '✅ Used: [Features used in this response]',
    '⏭️ Not Used: [Major unused features] (reason)',
    '💡 Recommended: [Features suitable for next task]',
    '─────────────────────────────────────────────────',
    '```',
    ''
  ].join('\n');
}

function buildAutoTriggerSection() {
  return [
    '## Skill Auto-Triggers',
    '',
    '| Keywords | Skill | Level |',
    '|----------|-------|-------|',
    '| static site, portfolio, 정적 웹 | starter | Starter |',
    '| login, fullstack, 로그인 | dynamic | Dynamic |',
    '| microservices, k8s, 마이크로서비스 | enterprise | Enterprise |',
    '| mobile app, React Native, 모바일 앱 | mobile-app | All |',
    ''
  ].join('\n');
}

// ─── Gemini CLI Feature Detection ────────────────────────────

function getGeminiCliFeatures() {
  try {
    const vd = require(path.join(libPath, 'adapters', 'gemini', 'version-detector'));
    const version = vd.detectVersion();
    const flags = vd.getFeatureFlags();
    return {
      version: version.raw,
      isPreview: version.isPreview,
      flagCount: Object.values(flags).filter(Boolean).length,
      totalFlags: Object.keys(flags).length
    };
  } catch (e) {
    return { version: 'unknown', isPreview: false, flagCount: 0, totalFlags: 0 };
  }
}

main();
