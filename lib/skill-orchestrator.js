/**
 * Skill Orchestrator (FR-12)
 * Manages skill lifecycle: parsing, loading, activation, agent delegation, and template imports.
 * Equivalent to Claude Code's lib/skill-orchestrator.js (489 lines, 11 exports).
 *
 * Philosophy: Skills are the primary unit of user-facing functionality.
 * The orchestrator bridges SKILL.md metadata with runtime execution.
 */
const fs = require('fs');
const path = require('path');

// ────────────────────────────────────────────────────────────────────────────
// Internal state
// ────────────────────────────────────────────────────────────────────────────

/** @type {Map<string, object>} Parsed frontmatter cache keyed by skill name */
const _metadataCache = new Map();

/** @type {{ name: string, action: string, args: string, metadata: object } | null} */
let _activeSkill = null;

/** @type {string|null} Plugin root resolved once */
let _pluginRoot = null;

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Resolve plugin root directory (cached).
 * Falls back to two directories above this file.
 * @returns {string}
 */
function getPluginRoot() {
  if (_pluginRoot) return _pluginRoot;

  try {
    const { getAdapter } = require('./adapters');
    _pluginRoot = getAdapter().getPluginRoot();
  } catch {
    _pluginRoot = path.resolve(__dirname, '..');
  }

  return _pluginRoot;
}

/**
 * Resolve skills directory path.
 * @returns {string}
 */
function getSkillsDir() {
  return path.join(getPluginRoot(), 'skills');
}

/**
 * Build the path to a skill's SKILL.md file.
 * @param {string} skillName
 * @returns {string}
 */
function getSkillPath(skillName) {
  return path.join(getSkillsDir(), skillName, 'SKILL.md');
}

// ────────────────────────────────────────────────────────────────────────────
// Simple YAML Frontmatter Parser (no external deps)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Parse a simple YAML value — handles strings, numbers, booleans, and null.
 * @param {string} raw
 * @returns {*}
 */
function parseScalar(raw) {
  if (raw === undefined || raw === null) return null;
  const trimmed = raw.trim();

  // Quoted strings
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  // Booleans
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  // Null
  if (trimmed === 'null' || trimmed === '~' || trimmed === '') return null;
  // Numbers
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);

  return trimmed;
}

/**
 * Minimal YAML parser that handles the subset used in SKILL.md frontmatter:
 * - Scalar key: value
 * - Multiline block scalar (key: |)
 * - Sequence (list) items (- value)
 * - Single-level mapping (key: value inside a parent key)
 *
 * Does NOT handle full YAML spec — intentionally simple to avoid external deps.
 *
 * @param {string} yamlStr - Raw YAML content between --- markers
 * @returns {object}
 */
function parseSimpleYaml(yamlStr) {
  const result = {};
  const lines = yamlStr.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Skip blank lines and comments
    if (!line.trim() || line.trim().startsWith('#')) {
      i++;
      continue;
    }

    // Detect indentation level of current line
    const indent = line.search(/\S/);

    // Only process top-level keys (indent === 0)
    if (indent !== 0) {
      i++;
      continue;
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) {
      i++;
      continue;
    }

    const key = line.slice(0, colonIdx).trim();
    const valueRaw = line.slice(colonIdx + 1);
    const valueTrimmed = valueRaw.trim();

    // Block scalar: key: | or key: >
    if (valueTrimmed === '|' || valueTrimmed === '>') {
      let block = '';
      i++;
      while (i < lines.length) {
        const bline = lines[i];
        // End of block: non-empty line with zero indent (new top-level key)
        if (bline.trim() && bline.search(/\S/) === 0) break;
        block += (block ? '\n' : '') + bline.replace(/^ {2}/, '');
        i++;
      }
      result[key] = block.trim();
      continue;
    }

    // Check if next line is indented — could be a list or nested mapping
    if (valueTrimmed === '' || valueTrimmed === '') {
      const nextIdx = i + 1;
      if (nextIdx < lines.length) {
        const nextLine = lines[nextIdx];
        const nextIndent = nextLine.search(/\S/);

        // List items
        if (nextIndent > 0 && nextLine.trim().startsWith('- ')) {
          const items = [];
          i++;
          while (i < lines.length) {
            const lline = lines[i];
            if (!lline.trim()) { i++; continue; }
            const lIndent = lline.search(/\S/);
            if (lIndent === 0) break; // back to top-level
            if (lline.trim().startsWith('- ')) {
              items.push(parseScalar(lline.trim().slice(2)));
            }
            i++;
          }
          result[key] = items;
          continue;
        }

        // Nested mapping (single level)
        if (nextIndent > 0 && !nextLine.trim().startsWith('- ')) {
          const map = {};
          i++;
          while (i < lines.length) {
            const mline = lines[i];
            if (!mline.trim() || mline.trim().startsWith('#')) { i++; continue; }
            const mIndent = mline.search(/\S/);
            if (mIndent === 0) break; // back to top-level
            const mColonIdx = mline.indexOf(':');
            if (mColonIdx !== -1) {
              const mKey = mline.slice(0, mColonIdx).trim();
              const mVal = mline.slice(mColonIdx + 1).trim();
              // Nested mapping value could itself be a quoted string with {template} vars
              if (mVal.startsWith('"') && mVal.endsWith('"')) {
                map[mKey] = mVal.slice(1, -1);
              } else {
                map[mKey] = parseScalar(mVal);
              }
            }
            i++;
          }
          result[key] = map;
          continue;
        }
      }
    }

    // Simple scalar value
    result[key] = parseScalar(valueTrimmed);
    i++;
  }

  return result;
}

// ────────────────────────────────────────────────────────────────────────────
// Core Functions
// ────────────────────────────────────────────────────────────────────────────

/**
 * Parse SKILL.md YAML frontmatter and return normalized metadata.
 *
 * @param {string} skillPath - Absolute path to SKILL.md
 * @returns {object} Normalized skill metadata with defaults applied
 */
function parseSkillFrontmatter(skillPath) {
  try {
    const content = fs.readFileSync(skillPath, 'utf-8');

    // Extract YAML between --- markers
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) {
      return buildDefaults(path.basename(path.dirname(skillPath)), '');
    }

    const yaml = parseSimpleYaml(match[1]);
    return applyDefaults(yaml, skillPath);
  } catch {
    return buildDefaults(path.basename(path.dirname(skillPath)), '');
  }
}

/**
 * Build a default metadata object for a skill.
 * @param {string} name
 * @param {string} description
 * @returns {object}
 */
function buildDefaults(name, description) {
  return {
    name: name || '',
    description: description || '',
    'user-invocable': true,
    'argument-hint': '',
    'allowed-tools': [],
    imports: [],
    agents: {},
    context: 'session',
    memory: 'project',
    'pdca-phase': 'all',
    'task-template': null
  };
}

/**
 * Apply defaults to parsed YAML, producing a complete skill metadata object.
 * @param {object} yaml
 * @param {string} skillPath
 * @returns {object}
 */
function applyDefaults(yaml, skillPath) {
  const dirName = path.basename(path.dirname(skillPath));
  return {
    name: yaml.name || dirName,
    description: yaml.description || '',
    'user-invocable': yaml['user-invocable'] !== false,
    'argument-hint': yaml['argument-hint'] || '',
    'allowed-tools': Array.isArray(yaml['allowed-tools']) ? yaml['allowed-tools'] : [],
    imports: Array.isArray(yaml.imports) ? yaml.imports : [],
    agents: (yaml.agents && typeof yaml.agents === 'object') ? yaml.agents : {},
    context: yaml.context || 'session',
    memory: yaml.memory || 'project',
    'pdca-phase': yaml['pdca-phase'] || 'all',
    'task-template': (yaml['task-template'] && typeof yaml['task-template'] === 'object')
      ? yaml['task-template']
      : null
  };
}

/**
 * Load a skill by name: read SKILL.md, parse frontmatter, resolve templates.
 *
 * @param {string} skillName - Name of the skill (directory name under skills/)
 * @returns {{ metadata: object, body: string, templates: string[] } | null}
 */
function loadSkill(skillName) {
  if (!skillName) return null;

  const skillPath = getSkillPath(skillName);

  if (!fs.existsSync(skillPath)) return null;

  // Check metadata cache
  if (!_metadataCache.has(skillName)) {
    _metadataCache.set(skillName, parseSkillFrontmatter(skillPath));
  }
  const metadata = _metadataCache.get(skillName);

  // Read the body (everything after the closing ---)
  let body = '';
  try {
    const content = fs.readFileSync(skillPath, 'utf-8');
    const endOfFrontmatter = content.indexOf('\n---', 4);
    if (endOfFrontmatter !== -1) {
      body = content.slice(endOfFrontmatter + 4).trim();
    } else {
      body = content.trim();
    }
  } catch {
    body = '';
  }

  // Load templates referenced in imports
  const templates = loadTemplates(metadata.imports || []);

  return { metadata, body, templates };
}

// ────────────────────────────────────────────────────────────────────────────
// Activation / Deactivation
// ────────────────────────────────────────────────────────────────────────────

/**
 * Activate a skill — sets it as the current active skill and performs
 * agent delegation & task creation when appropriate.
 *
 * @param {string} skillName
 * @param {string} [action] - Sub-action (e.g., 'analyze', 'plan')
 * @param {string} [args] - Additional arguments / feature name
 * @returns {{ success: boolean, agent: string|null, task: object|null, templates: string[], metadata: object } | null}
 */
function activateSkill(skillName, action, args) {
  const skill = loadSkill(skillName);
  if (!skill) return null;

  const { metadata, templates } = skill;

  // Set active skill state
  _activeSkill = {
    name: skillName,
    action: action || null,
    args: args || '',
    metadata
  };

  // Resolve agent delegation
  const agentName = resolveAgent(skillName, action);

  // Create task from template if applicable
  let task = null;
  if (shouldAutoCreateTask(skillName, action)) {
    task = createTaskFromTemplate(metadata['task-template'], {
      action: action || '',
      feature: args || '',
      skill: skillName
    });
  }

  return {
    success: true,
    agent: agentName,
    task,
    templates,
    metadata
  };
}

/**
 * Deactivate the currently active skill.
 * Clears active skill state and tool filters.
 *
 * @param {string} [skillName] - If provided, only deactivate if it matches
 * @returns {boolean} Whether a skill was deactivated
 */
function deactivateSkill(skillName) {
  if (!_activeSkill) return false;

  if (skillName && _activeSkill.name !== skillName) return false;

  _activeSkill = null;
  return true;
}

/**
 * Get the currently active skill (if any).
 * @returns {{ name: string, action: string, args: string, metadata: object } | null}
 */
function getActiveSkill() {
  return _activeSkill;
}

// ────────────────────────────────────────────────────────────────────────────
// Agent Delegation
// ────────────────────────────────────────────────────────────────────────────

/**
 * Resolve which agent should handle a given action for a skill.
 * Returns null when the main agent should handle it directly.
 *
 * @param {string} skillName
 * @param {string} [action]
 * @returns {string|null} Agent name or null
 */
function resolveAgent(skillName, action) {
  if (!action) return null;

  const skill = _metadataCache.get(skillName);
  if (!skill) {
    // Try loading it
    const loaded = loadSkill(skillName);
    if (!loaded) return null;
  }

  const metadata = _metadataCache.get(skillName);
  if (!metadata || !metadata.agents) return null;

  const agentName = metadata.agents[action];
  // null or undefined means main agent handles it
  if (!agentName) return null;

  return agentName;
}

/**
 * Prepare agent delegation context for spawning via MCP.
 *
 * @param {string} agentName - Target agent name
 * @param {object} task - Task specification { subject, description }
 * @param {object} [context] - Additional context to pass
 * @returns {{ agent: string, prompt: string, context: object }}
 */
function delegateToAgent(agentName, task, context) {
  if (!agentName || !task) {
    return { agent: null, prompt: '', context: {} };
  }

  // Build delegation prompt
  const prompt = [
    task.description || task.subject || '',
    '',
    context && context.feature ? `Feature: ${context.feature}` : '',
    context && context.phase ? `PDCA Phase: ${context.phase}` : ''
  ].filter(Boolean).join('\n');

  return {
    agent: agentName,
    prompt: prompt.trim(),
    context: {
      ...(context || {}),
      delegatedFrom: _activeSkill ? _activeSkill.name : null,
      task: task.subject || ''
    }
  };
}

/**
 * Get the full multi-binding map for a skill (action -> agent name).
 *
 * @param {string} skillName
 * @returns {object} Map of action names to agent names
 */
function getMultiBindingMap(skillName) {
  const skill = _metadataCache.get(skillName) || (loadSkill(skillName) || {}).metadata;
  if (!skill || !skill.agents) return {};
  return { ...skill.agents };
}

// ────────────────────────────────────────────────────────────────────────────
// Template Management
// ────────────────────────────────────────────────────────────────────────────

/**
 * Load template contents from a list of import paths.
 * Paths are resolved relative to the plugin root.
 *
 * @param {string[]} importPaths - Array of relative paths
 * @returns {string[]} Array of template contents (empty string on failure)
 */
function loadTemplates(importPaths) {
  if (!Array.isArray(importPaths) || importPaths.length === 0) return [];

  const root = getPluginRoot();

  return importPaths.map(relPath => {
    try {
      const fullPath = path.resolve(root, relPath);
      if (!fs.existsSync(fullPath)) return '';
      return fs.readFileSync(fullPath, 'utf-8');
    } catch {
      return '';
    }
  }).filter(Boolean);
}

/**
 * Get the list of available template paths for a skill.
 *
 * @param {string} skillName
 * @returns {string[]} Array of relative template paths
 */
function getAvailableTemplates(skillName) {
  const skill = _metadataCache.get(skillName) || (loadSkill(skillName) || {}).metadata;
  if (!skill) return [];
  return skill.imports || [];
}

// ────────────────────────────────────────────────────────────────────────────
// Task Auto-Creation
// ────────────────────────────────────────────────────────────────────────────

/**
 * Create a task specification by substituting template variables.
 * Replaces `{key}` placeholders in the template fields with provided params.
 *
 * @param {object} template - Task template from frontmatter { subject, description, activeForm }
 * @param {object} params - Key-value pairs for substitution
 * @returns {{ subject: string, description: string, activeForm: string } | null}
 */
function createTaskFromTemplate(template, params) {
  if (!template || typeof template !== 'object') return null;

  const substituted = {};
  for (const [key, val] of Object.entries(template)) {
    if (typeof val !== 'string') {
      substituted[key] = val;
      continue;
    }
    substituted[key] = val.replace(/\{(\w+)\}/g, (_, varName) => {
      return (params && params[varName] !== undefined) ? String(params[varName]) : '';
    }).trim();
  }

  return {
    subject: substituted.subject || '',
    description: substituted.description || '',
    activeForm: substituted.activeForm || substituted.subject || ''
  };
}

/**
 * Check whether a skill + action should auto-create a task.
 *
 * @param {string} skillName
 * @param {string} [action]
 * @returns {boolean}
 */
function shouldAutoCreateTask(skillName, action) {
  const skill = _metadataCache.get(skillName) || (loadSkill(skillName) || {}).metadata;
  if (!skill || !skill['task-template']) return false;

  // If there's a task-template, auto-create is warranted
  return true;
}

// ────────────────────────────────────────────────────────────────────────────
// Query Functions
// ────────────────────────────────────────────────────────────────────────────

/**
 * List all available skills with basic metadata.
 *
 * @returns {Array<{ name: string, description: string, userInvocable: boolean, pdcaPhase: string }>}
 */
function listSkills() {
  const skillsDir = getSkillsDir();
  const results = [];

  try {
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillMdPath = path.join(skillsDir, entry.name, 'SKILL.md');
      if (!fs.existsSync(skillMdPath)) continue;

      const metadata = parseSkillFrontmatter(skillMdPath);
      _metadataCache.set(entry.name, metadata);

      results.push({
        name: metadata.name || entry.name,
        description: (metadata.description || '').split('\n')[0].trim(),
        userInvocable: metadata['user-invocable'],
        pdcaPhase: metadata['pdca-phase'],
        argumentHint: metadata['argument-hint']
      });
    }
  } catch {
    // skills directory missing or unreadable
  }

  return results;
}

/**
 * Get detailed metadata for a specific skill.
 *
 * @param {string} skillName
 * @returns {object|null}
 */
function getSkillInfo(skillName) {
  if (!skillName) return null;

  if (_metadataCache.has(skillName)) {
    return _metadataCache.get(skillName);
  }

  const skillPath = getSkillPath(skillName);
  if (!fs.existsSync(skillPath)) return null;

  const metadata = parseSkillFrontmatter(skillPath);
  _metadataCache.set(skillName, metadata);
  return metadata;
}

/**
 * Get all skills marked as user-invocable.
 *
 * @returns {Array<{ name: string, description: string, argumentHint: string }>}
 */
function getUserInvocableSkills() {
  return listSkills()
    .filter(s => s.userInvocable)
    .map(s => ({
      name: s.name,
      description: s.description,
      argumentHint: s.argumentHint
    }));
}

/**
 * Get skills that apply to a given PDCA phase.
 * A skill matches if its pdca-phase is 'all' or equals the requested phase.
 *
 * @param {string} pdcaPhase - One of: plan, design, do, check, act
 * @returns {Array<{ name: string, description: string, userInvocable: boolean }>}
 */
function getSkillsByPhase(pdcaPhase) {
  if (!pdcaPhase) return listSkills();

  const phase = pdcaPhase.toLowerCase();

  return listSkills().filter(s => {
    const skillPhase = (s.pdcaPhase || 'all').toLowerCase();
    return skillPhase === 'all' || skillPhase === phase;
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Cache Management
// ────────────────────────────────────────────────────────────────────────────

/**
 * Clear all cached metadata. Useful for testing or config changes.
 */
function clearCache() {
  _metadataCache.clear();
  _activeSkill = null;
  _pluginRoot = null;
}

// ────────────────────────────────────────────────────────────────────────────
// Exports (11 primary + helpers)
// ────────────────────────────────────────────────────────────────────────────

module.exports = {
  // Core
  parseSkillFrontmatter,
  loadSkill,
  activateSkill,
  deactivateSkill,

  // Agent Delegation
  resolveAgent,
  delegateToAgent,

  // Template Management
  loadTemplates,

  // Task Auto-Creation
  createTaskFromTemplate,

  // Query
  listSkills,
  getUserInvocableSkills,
  getSkillsByPhase,

  // Additional helpers (not in the 11, but useful for hooks)
  getActiveSkill,
  getSkillInfo,
  getMultiBindingMap,
  getAvailableTemplates,
  shouldAutoCreateTask,
  clearCache,

  // Internals exported for testing
  parseSimpleYaml,
  parseScalar,
  buildDefaults
};
