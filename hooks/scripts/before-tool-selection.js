#!/usr/bin/env node
/**
 * BeforeToolSelection Hook - Tool Filtering
 * Filters available tools based on PDCA phase and active skill restrictions
 */
const fs = require('fs');
const path = require('path');

const libPath = path.resolve(__dirname, '..', '..', 'lib');

function main() {
  try {
    const { getAdapter } = require(path.join(libPath, 'adapters'));
    const adapter = getAdapter();

    const input = adapter.readHookInput();
    const tools = input.tools || [];
    const toolConfig = input.toolConfig || {};

    if (!tools || tools.length === 0) {
      adapter.outputEmpty();
      return;
    }

    const projectDir = adapter.getProjectDir();
    const pluginRoot = adapter.getPluginRoot();

    // 1. Get PDCA phase restrictions
    const pdcaPhase = getCurrentPdcaPhase(projectDir);
    const phaseFilter = getPhaseToolFilter(pdcaPhase);

    // 2. Get active skill restrictions
    const skillFilter = getActiveSkillToolFilter(projectDir, pluginRoot);

    // 3. Merge filters (intersection)
    const allowedTools = mergeFilters(phaseFilter, skillFilter);

    // 4. Apply filter if restrictions exist
    if (allowedTools && allowedTools.length > 0) {
      const output = {
        status: 'allow',
        toolConfig: {
          functionCallingConfig: {
            mode: 'AUTO',
            allowedFunctionNames: allowedTools
          }
        },
        hookEvent: 'BeforeToolSelection'
      };
      console.log(JSON.stringify(output));
      process.exit(0);
    } else {
      adapter.outputEmpty();
    }

  } catch (error) {
    // Graceful degradation - don't restrict tools on error
    process.exit(0);
  }
}

/**
 * Get current PDCA phase
 */
function getCurrentPdcaPhase(projectDir) {
  try {
    const statusPath = path.join(projectDir, 'docs', '.pdca-status.json');
    if (!fs.existsSync(statusPath)) return null;

    const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
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

  const readOnlyTools = [
    'read_file', 'read_many_files', 'grep_search', 'glob_tool',
    'list_directory', 'web_search', 'web_fetch', 'activate_skill',
    'task_write', 'spawn_agent'
  ];

  const allTools = [
    ...readOnlyTools,
    'write_file', 'replace', 'run_shell_command'
  ];

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
    const memoryPath = path.join(projectDir, 'docs', '.bkit-memory.json');
    if (!fs.existsSync(memoryPath)) return null;

    const memory = JSON.parse(fs.readFileSync(memoryPath, 'utf-8'));
    const activeSkill = memory.activeSkill;
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

main();
