/**
 * Project Level Detection
 * Detects project complexity level: Starter, Dynamic, Enterprise
 */
const fs = require('fs');
const path = require('path');

/**
 * Level to phase requirements mapping
 */
const LEVEL_PHASE_MAP = {
  'Starter': {
    required: [1, 2, 3, 6, 9],
    optional: [],
    skip: [4, 5, 7, 8]
  },
  'Dynamic': {
    required: [1, 2, 3, 4, 6, 9],
    optional: [5, 7, 8],
    skip: []
  },
  'Enterprise': {
    required: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    optional: [],
    skip: []
  }
};

/**
 * Level indicators for detection
 */
const LEVEL_INDICATORS = {
  enterprise: {
    directories: ['kubernetes', 'terraform', 'k8s', 'infra', 'helm', 'charts'],
    files: ['docker-compose.prod.yml', 'Makefile.prod'],
    packagePatterns: ['@kubernetes', '@terraform', '@pulumi']
  },
  dynamic: {
    directories: ['lib/bkend', 'supabase', 'api', 'backend', 'server', 'prisma'],
    files: ['.mcp.json', 'docker-compose.yml', 'prisma/schema.prisma'],
    packagePatterns: ['bkend', '@supabase', 'firebase', 'prisma', '@prisma', 'express', 'fastify', 'nest']
  }
};

// Lazy load for project directory
let _projectDir = null;
function getProjectDir() {
  if (_projectDir) return _projectDir;

  try {
    const { getAdapter } = require('../adapters');
    _projectDir = getAdapter().getProjectDir();
  } catch {
    _projectDir = process.cwd();
  }

  return _projectDir;
}

/**
 * Detect project level
 * @param {string} projectDir - Optional project directory override
 * @returns {'Starter'|'Dynamic'|'Enterprise'}
 */
function detectLevel(projectDir) {
  const dir = projectDir || getProjectDir();

  // Check for Enterprise indicators
  for (const indicator of LEVEL_INDICATORS.enterprise.directories) {
    if (fs.existsSync(path.join(dir, indicator))) {
      return 'Enterprise';
    }
  }

  for (const file of LEVEL_INDICATORS.enterprise.files) {
    if (fs.existsSync(path.join(dir, file))) {
      return 'Enterprise';
    }
  }

  // Check for Dynamic indicators
  for (const indicator of LEVEL_INDICATORS.dynamic.directories) {
    if (fs.existsSync(path.join(dir, indicator))) {
      return 'Dynamic';
    }
  }

  for (const file of LEVEL_INDICATORS.dynamic.files) {
    if (fs.existsSync(path.join(dir, file))) {
      return 'Dynamic';
    }
  }

  // Check package.json dependencies
  const packagePath = path.join(dir, 'package.json');
  if (fs.existsSync(packagePath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const depNames = Object.keys(deps);

      // Check Enterprise patterns
      for (const pattern of LEVEL_INDICATORS.enterprise.packagePatterns) {
        if (depNames.some(d => d.includes(pattern))) {
          return 'Enterprise';
        }
      }

      // Check Dynamic patterns
      for (const pattern of LEVEL_INDICATORS.dynamic.packagePatterns) {
        if (depNames.some(d => d.includes(pattern))) {
          return 'Dynamic';
        }
      }
    } catch {
      // Ignore package.json errors
    }
  }

  // Environment override
  if (process.env.BKIT_LEVEL) {
    const envLevel = process.env.BKIT_LEVEL;
    if (['Starter', 'Dynamic', 'Enterprise'].includes(envLevel)) {
      return envLevel;
    }
  }

  return 'Starter';
}

/**
 * Check if a phase can be skipped for the given level
 * @param {string} level
 * @param {number} phase
 * @returns {boolean}
 */
function canSkipPhase(level, phase) {
  const map = LEVEL_PHASE_MAP[level];
  return map ? map.skip.includes(phase) : false;
}

/**
 * Get required phases for a level
 * @param {string} level
 * @returns {number[]}
 */
function getRequiredPhases(level) {
  const map = LEVEL_PHASE_MAP[level];
  return map ? map.required : [1, 2, 3, 4, 5, 6, 7, 8, 9];
}

/**
 * Get next phase for level
 * @param {number} currentPhase
 * @param {string} level
 * @returns {number|null}
 */
function getNextPhaseForLevel(currentPhase, level) {
  const required = getRequiredPhases(level);
  const currentIndex = required.indexOf(currentPhase);

  if (currentIndex === -1 || currentIndex === required.length - 1) {
    return null;
  }

  return required[currentIndex + 1];
}

/**
 * Check if phase is applicable for level
 * @param {number} phase
 * @param {string} level
 * @returns {boolean}
 */
function isPhaseApplicable(phase, level) {
  const map = LEVEL_PHASE_MAP[level];
  return map ? !map.skip.includes(phase) : true;
}

/**
 * Get level-specific phase guide
 * @param {string} level
 * @returns {object}
 */
function getLevelPhaseGuide(level) {
  const map = LEVEL_PHASE_MAP[level] || LEVEL_PHASE_MAP.Starter;

  return {
    level,
    required: map.required,
    optional: map.optional,
    skip: map.skip,
    description: {
      'Starter': 'Static websites without backend. Focuses on schema, convention, mockup, UI, and deployment.',
      'Dynamic': 'Full-stack applications with BaaS. Adds API and optional design system phases.',
      'Enterprise': 'Enterprise-grade systems. All phases required including security and code review.'
    }[level]
  };
}

module.exports = {
  LEVEL_PHASE_MAP,
  LEVEL_INDICATORS,
  detectLevel,
  canSkipPhase,
  getRequiredPhases,
  getNextPhaseForLevel,
  isPhaseApplicable,
  getLevelPhaseGuide
};
