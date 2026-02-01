#!/usr/bin/env node
/**
 * SessionStart Hook - Session Initialization
 * Initializes PDCA status, detects project level, and provides welcome context
 */
const fs = require('fs');
const path = require('path');

// Add lib to path
const libPath = path.resolve(__dirname, '..', '..', 'lib');

function main() {
  try {
    const { getAdapter } = require(path.join(libPath, 'adapters'));
    const adapter = getAdapter();

    const projectDir = adapter.getProjectDir();
    const pluginRoot = adapter.getPluginRoot();

    // Initialize PDCA status file
    const pdcaStatusPath = path.join(projectDir, 'docs', '.pdca-status.json');
    let pdcaStatus = {
      version: '2.0',
      lastUpdated: new Date().toISOString(),
      activeFeatures: [],
      primaryFeature: null,
      features: {},
      pipeline: { currentPhase: 1, level: 'Starter', phaseHistory: [] },
      session: { startedAt: new Date().toISOString(), onboardingCompleted: false, lastActivity: new Date().toISOString() },
      history: []
    };

    // Load existing status if available
    if (fs.existsSync(pdcaStatusPath)) {
      try {
        pdcaStatus = JSON.parse(fs.readFileSync(pdcaStatusPath, 'utf-8'));
        pdcaStatus.session.startedAt = new Date().toISOString();
        pdcaStatus.session.lastActivity = new Date().toISOString();
      } catch (e) {
        // Use default status
      }
    } else {
      // Create docs directory if needed
      const docsDir = path.dirname(pdcaStatusPath);
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }
    }

    // Detect project level
    const level = detectProjectLevel(projectDir);
    pdcaStatus.pipeline.level = level;

    // Save updated status
    fs.writeFileSync(pdcaStatusPath, JSON.stringify(pdcaStatus, null, 2));

    // Initialize memory store
    const memoryPath = path.join(projectDir, 'docs', '.bkit-memory.json');
    let memory = {
      sessionCount: 1,
      platform: 'gemini',
      level: level,
      lastSessionStarted: new Date().toISOString()
    };

    if (fs.existsSync(memoryPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(memoryPath, 'utf-8'));
        memory.sessionCount = (existing.sessionCount || 0) + 1;
      } catch (e) {
        // Use default memory
      }
    }

    fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));

    // Generate welcome context
    const welcomeContext = generateWelcomeContext(pdcaStatus, level);

    // Output success
    const output = {
      status: 'allow',
      context: welcomeContext,
      hookEvent: 'SessionStart',
      metadata: {
        version: '1.0.0',
        platform: 'gemini',
        level: level,
        primaryFeature: pdcaStatus.primaryFeature,
        currentPhase: pdcaStatus.primaryFeature ?
          pdcaStatus.features[pdcaStatus.primaryFeature]?.phase : null
      }
    };

    console.log(JSON.stringify(output));
    process.exit(0);

  } catch (error) {
    // On error, output minimal context
    console.log(JSON.stringify({
      status: 'allow',
      context: 'bkit Vibecoding Kit v1.0.0 activated (Gemini CLI)',
      hookEvent: 'SessionStart'
    }));
    process.exit(0);
  }
}

function detectProjectLevel(projectDir) {
  // Check for Enterprise indicators
  const enterpriseDirs = ['kubernetes', 'terraform', 'k8s', 'infra'];
  for (const dir of enterpriseDirs) {
    if (fs.existsSync(path.join(projectDir, dir))) {
      return 'Enterprise';
    }
  }

  // Check for Dynamic indicators
  const dynamicIndicators = [
    { type: 'dir', path: 'lib/bkend' },
    { type: 'dir', path: 'supabase' },
    { type: 'dir', path: 'api' },
    { type: 'file', path: '.mcp.json' },
    { type: 'file', path: 'docker-compose.yml' }
  ];

  for (const indicator of dynamicIndicators) {
    const fullPath = path.join(projectDir, indicator.path);
    if (fs.existsSync(fullPath)) {
      return 'Dynamic';
    }
  }

  // Check package.json for BaaS patterns
  const packagePath = path.join(projectDir, 'package.json');
  if (fs.existsSync(packagePath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const dynamicPatterns = ['bkend', '@supabase', 'firebase', 'prisma'];

      for (const pattern of dynamicPatterns) {
        if (Object.keys(deps).some(d => d.includes(pattern))) {
          return 'Dynamic';
        }
      }
    } catch (e) {
      // Ignore package.json errors
    }
  }

  return 'Starter';
}

function generateWelcomeContext(pdcaStatus, level) {
  const lines = [
    '# bkit Vibecoding Kit v1.0.0 - Session Start',
    '',
    '## MANDATORY: Session Start Action',
    '',
    '**AskUserQuestion tool** call required on user\'s first message.',
    '',
    '### Actions by selection:',
    '- **Learn bkit** - Run /development-pipeline',
    '- **Learn Gemini CLI** - Run /gemini-cli-learning',
    '- **Start new project** - Select level then run /starter, /dynamic, or /enterprise',
    '- **Start freely** - General conversation mode',
    '',
    '## PDCA Core Rules (Always Apply)',
    '- New feature request - Check/create Plan/Design documents first',
    '- After implementation - Suggest Gap analysis',
    '- Gap Analysis < 90% - Auto-improvement with pdca-iterator',
    '- Gap Analysis >= 90% - Completion report with report-generator',
    '',
    `## Current Session`,
    `- **Level**: ${level}`,
    `- **Primary Feature**: ${pdcaStatus.primaryFeature || 'None'}`,
    `- **Current Phase**: ${pdcaStatus.primaryFeature ? pdcaStatus.features[pdcaStatus.primaryFeature]?.phase || 'plan' : 'N/A'}`
  ];

  return lines.join('\n');
}

main();
