// tests/fixtures.js
const PDCA_STATUS_FIXTURE = {
  version: '2.0.2',
  lastUpdated: new Date().toISOString(),
  activeFeatures: ['test-feature'],
  primaryFeature: 'test-feature',
  features: {
    'test-feature': {
      phase: 'plan',
      matchRate: null,
      iterationCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documents: {
        plan: 'docs/01-plan/features/test-feature.plan.md'
      }
    }
  },
  pipeline: { currentPhase: 1, level: 'Starter', phaseHistory: [] },
  history: [],
  session: { startedAt: new Date().toISOString(), onboardingCompleted: false }
};

const BKIT_MEMORY_FIXTURE = {
  sessionCount: 1,
  platform: 'gemini',
  level: 'Starter',
  lastSessionStarted: new Date().toISOString()
};

const BKIT_MEMORY_RETURNING = {
  sessionCount: 5,
  platform: 'gemini',
  level: 'Dynamic',
  lastSessionStarted: new Date().toISOString(),
  outputStyle: 'bkit-pdca-guide'
};

const PDCA_STATUS_V157 = {
  version: "2.0",
  activeFeatures: ["test-feature"],
  primaryFeature: "test-feature",
  features: {
    "test-feature": {
      phase: "design",
      matchRate: null,
      lastUpdated: new Date().toISOString()
    }
  },
  pipeline: {
    currentPhase: 1,
    level: "Starter",
    phaseHistory: []
  },
  session: {
    startedAt: new Date().toISOString(),
    onboardingCompleted: false,
    lastActivity: new Date().toISOString()
  }
};

const TRACKER_BRIDGE_FIXTURE = {
  featureName: "test-feature",
  epicId: null,
  taskIds: {}
};

const PDCA_STATUS_V158 = {
  version: '2.0',
  primaryFeature: 'test-feature',
  activeFeatures: {
    'test-feature': {
      phase: 'plan',
      matchRate: null,
      iterationCount: 0,
      lastUpdated: new Date().toISOString(),
      documents: { plan: 'docs/01-plan/features/test-feature.plan.md' }
    }
  },
  archivedFeatures: {},
  pipeline: { level: 'Dynamic', currentPhase: 3, phaseHistory: [] },
  lastChecked: new Date().toISOString()
};

const PDCA_STATUS_MULTI = {
  version: '2.0',
  primaryFeature: 'feature-a',
  activeFeatures: {
    'feature-a': { phase: 'plan', matchRate: null, iterationCount: 0, lastUpdated: new Date().toISOString(), documents: {} },
    'feature-b': { phase: 'do', matchRate: null, iterationCount: 0, lastUpdated: new Date().toISOString(), documents: {} },
    'feature-c': { phase: 'completed', matchRate: 100, iterationCount: 2, completedAt: new Date().toISOString(), lastUpdated: new Date().toISOString(), documents: {} }
  },
  archivedFeatures: {},
  pipeline: { level: 'Enterprise', currentPhase: 9, phaseHistory: [] },
  lastChecked: new Date().toISOString()
};

const TEAM_CONFIG_FIXTURE = {
  enabled: true,
  defaultStrategy: 'balanced',
  strategies: {
    Starter: { maxAgents: 1 },
    Dynamic: { maxAgents: 3 },
    Enterprise: { maxAgents: 10 }
  },
  orchestrationPatterns: ['leader', 'council', 'swarm', 'pipeline', 'watchdog'],
  communication: { protocol: 'task-tracker' }
};

const MULTILANG_INPUTS = {
  ko: { verify: '검증해줘', improve: '개선해줘', report: '보고서 작성해줘', help: '도움이 필요해' },
  ja: { verify: 'コード確認して', improve: '改善して', report: '報告書作成', help: '助けて' },
  zh: { verify: '验证代码', improve: '改进代码', report: '生成报告', help: '帮助我' },
  es: { verify: 'verificar código', improve: 'mejorar código', report: 'informe', help: 'ayuda' },
  fr: { verify: 'vérifier le code', improve: 'améliorer', report: 'rapport', help: 'aide' },
  de: { verify: 'Code prüfen', improve: 'verbessern', report: 'Bericht', help: 'Hilfe' },
  it: { verify: 'verificare codice', improve: 'migliorare', report: 'rapporto', help: 'aiuto' },
  en: { verify: 'verify code', improve: 'improve code', report: 'generate report', help: 'help me' }
};

const HOOK_INPUT_FIXTURES = {
  sessionStart: {},
  beforeTool: { toolName: 'run_shell_command', input: { command: 'git status' } },
  afterTool: { toolName: 'write_file', input: { file_path: 'src/app.js' }, output: { success: true } },
  beforeToolDeny: { toolName: 'run_shell_command', input: { command: 'rm -rf /' } }
};

const LEVEL_DETECTION_FIXTURES = {
  enterprise: { dirs: ['kubernetes'], files: [] },
  dynamic: { dirs: [], files: ['.mcp.json', 'docker-compose.yml'] },
  starter: { dirs: [], files: [] }
};

// v2.0.1 + Gemini CLI v0.35.0 fixtures
const V035_HOOK_INPUT_FIXTURES = {
  sessionStart: {},
  beforeToolDenyFullPath: { toolName: 'run_shell_command', input: { command: '/usr/bin/rm -rf /' } },
  beforeToolDenyBare: { toolName: 'run_shell_command', input: { command: 'rm -rf /' } },
  beforeToolSafeFullPath: { toolName: 'run_shell_command', input: { command: '/usr/bin/ls -la' } },
  beforeToolGitForceFullPath: { toolName: 'run_shell_command', input: { command: '/usr/local/bin/git push --force' } }
};

const V035_POLICY_PERMISSIONS = {
  'run_shell_command(rm -rf*)': 'deny',
  'run_shell_command(git push --force*)': 'deny',
  'run_shell_command(git reset --hard*)': 'ask',
  'write_file': 'allow'
};

const V035_FEATURE_FLAGS_EXPECTED = {
  hasJITContextLoading: true,
  hasToolIsolation: true,
  hasParallelToolScheduler: true,
  hasAdminPolicy: true,
  hasDisableAlwaysAllow: true,
  hasCryptoVerification: true,
  hasCustomKeybindings: true,
  hasPolicyEngine: true,
  hasProjectLevelPolicy: true,
  hasExtensionPolicies: true,
  hasTaskTracker: true,
  hasRuntimeHookFunctions: true,
  hasSubagentPolicies: true,
  hasNativeSkillSystem: true
};

module.exports = {
  PDCA_STATUS_FIXTURE, BKIT_MEMORY_FIXTURE, BKIT_MEMORY_RETURNING, PDCA_STATUS_V157, TRACKER_BRIDGE_FIXTURE,
  PDCA_STATUS_V158, PDCA_STATUS_MULTI, TEAM_CONFIG_FIXTURE,
  MULTILANG_INPUTS, HOOK_INPUT_FIXTURES, LEVEL_DETECTION_FIXTURES,
  V035_HOOK_INPUT_FIXTURES, V035_POLICY_PERMISSIONS, V035_FEATURE_FLAGS_EXPECTED
};
