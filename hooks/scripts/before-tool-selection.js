#!/usr/bin/env node
/**
 * BeforeToolSelection Hook - Tool Filtering
 * Filters available tools based on PDCA phase and active skill restrictions
 * Dual-mode: handler export (v0.31.0+ SDK) + stdin command (legacy)
 */
const fs = require('fs');
const path = require('path');

const libPath = path.resolve(__dirname, '..', '..', 'lib');
const toolRegistryPath = path.join(libPath, 'gemini', 'tools');

// --- Core processing logic ---
function processHook(input) {
  try {
    const tools = input.tools || [];
    if (!tools || tools.length === 0) {
      return { status: 'allow' };
    }

    const projectDir = input.projectDir || process.cwd();
    const pluginRoot = input.pluginRoot || path.resolve(__dirname, '..', '..');

    const pdcaPhase = getCurrentPdcaPhase(projectDir);
    const phaseFilter = getPhaseToolFilter(pdcaPhase);
    const skillFilter = getActiveSkillToolFilter(projectDir, pluginRoot);
    let allowedTools = mergeFilters(phaseFilter, skillFilter);

    // Safety: Ensure CLI-critical tools (like plan mode) are never filtered out
    // if they exist in the phase/skill filter or registry
    const CRITICAL_TOOLS = ['enter_plan_mode', 'exit_plan_mode'];
    if (allowedTools) {
      for (const t of CRITICAL_TOOLS) {
        if (!allowedTools.includes(t)) allowedTools.push(t);
      }
    }

    if (allowedTools && allowedTools.length > 0) {
      return {
        status: 'allow',
        toolConfig: {
          functionCallingConfig: {
            mode: 'AUTO',
            allowedFunctionNames: allowedTools
          }
        },
        hookEvent: 'BeforeToolSelection'
      };
    }
    return { status: 'allow' };
  } catch (error) {
    return { status: 'allow' };
  }
}

// --- RuntimeHook function export (v0.31.0+ SDK) ---
async function handler(event) {
  return processHook(event);
}

// --- Legacy command mode ---
function main() {
  try {
    const { getAdapter } = require(path.join(libPath, 'gemini', 'platform'));
    const adapter = getAdapter();
    const input = adapter.readHookInput();
    input.projectDir = adapter.getProjectDir();
    input.pluginRoot = adapter.getPluginRoot();
    const result = processHook(input);

    if (result.toolConfig) {
      console.log(JSON.stringify(result));
      process.exit(0);
    } else {
      adapter.outputEmpty();
    }
  } catch (error) {
    process.exit(0);
  }
}

/**
 * Get current PDCA phase
 */
function getCurrentPdcaPhase(projectDir) {
  try {
    const pdcaStatusModule = require(path.join(libPath, 'pdca', 'status'));
    const status = pdcaStatusModule.loadPdcaStatus(projectDir);
    const feature = status.primaryFeature;
    if (!feature || !status.features[feature]) return null;

    return status.features[feature].phase;
  } catch (e) {
    return null;
  }
}

/**
 * Get tool filter based on PDCA phase
 * Returns null for unrestricted phases
 */
function getPhaseToolFilter(phase) {
  if (!phase) return null;

  // Tool names from centralized registry (v0.29.0+ verified)
  const { getReadOnlyTools, getAllTools } = require(toolRegistryPath);
  const readOnlyTools = getReadOnlyTools();

  const allTools = getAllTools();

  const phaseFilters = {
    plan: readOnlyTools,     // Read-only during planning
    design: [...readOnlyTools, 'write_file'],  // Can write design docs
    do: null,                // All tools during implementation
    check: readOnlyTools,    // Read-only during analysis
    act: null                // All tools during improvement
  };

  return phaseFilters[phase] !== undefined ? phaseFilters[phase] : null;
}

/**
 * Get tool filter from active skill's allowed-tools
 */
function getActiveSkillToolFilter(projectDir, pluginRoot) {
  try {
    const { getMemory } = require(path.join(libPath, 'core', 'memory'));
    const memoryManager = getMemory(projectDir);
    const memory = memoryManager.load();
    const activeSkill = memory.activeSkill || memoryManager.get('activeSkill');
    if (!activeSkill) return null;

    // Read SKILL.md frontmatter for allowed-tools
    const skillPath = path.join(pluginRoot, 'skills', activeSkill, 'SKILL.md');
    if (!fs.existsSync(skillPath)) return null;

    const content = fs.readFileSync(skillPath, 'utf-8');
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;

    // Extract allowed-tools from YAML
    const yamlContent = match[1];
    const toolsMatch = yamlContent.match(/allowed-tools:\s*\n((?:\s+-\s+.+\n?)*)/);
    if (!toolsMatch) return null;

    const tools = toolsMatch[1]
      .split('\n')
      .map(line => line.trim().replace(/^-\s+/, ''))
      .filter(Boolean);

    return tools.length > 0 ? tools : null;
  } catch (e) {
    return null;
  }
}

/**
 * Merge two tool filters (intersection)
 */
function mergeFilters(filter1, filter2) {
  if (!filter1 && !filter2) return null;
  if (!filter1) return filter2;
  if (!filter2) return filter1;

  // Intersection of both filters
  return filter1.filter(tool => filter2.includes(tool));
}

if (require.main === module) { main(); }

module.exports = { handler };
