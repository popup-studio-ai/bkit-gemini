// tests/fixtures.js
const PDCA_STATUS_FIXTURE = {
  version: '2.0',
  lastUpdated: new Date().toISOString(),
  activeFeatures: ['test-feature'],
  primaryFeature: 'test-feature',
  features: {
    'test-feature': {
      phase: 'plan',
      matchRate: null,
      iterationCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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

module.exports = { PDCA_STATUS_FIXTURE, BKIT_MEMORY_FIXTURE, BKIT_MEMORY_RETURNING };
