#!/usr/bin/env node
/**
 * AfterTool Hook - Post-execution Processing
 * Updates PDCA status, tracks changes, and suggests next steps
 */
const fs = require('fs');
const path = require('path');

const libPath = path.resolve(__dirname, '..', '..', 'lib');

function main() {
  try {
    const { getAdapter } = require(path.join(libPath, 'adapters'));
    const adapter = getAdapter();

    // Read input
    const input = adapter.readHookInput();
    const toolName = input.tool_name || '';
    const toolInput = input.tool_input || {};

    // Map tool name
    const claudeToolName = adapter.reverseMapToolName(toolName);

    // Handle by tool type
    if (['write_file', 'replace'].includes(toolName) || ['Write', 'Edit'].includes(claudeToolName)) {
      handlePostWrite(adapter, toolInput);
    } else if (toolName === 'activate_skill' || claudeToolName === 'Skill') {
      handlePostSkill(adapter, toolInput);
    } else {
      adapter.outputEmpty();
    }

  } catch (error) {
    process.exit(0);
  }
}

function handlePostWrite(adapter, toolInput) {
  const filePath = toolInput.file_path || toolInput.path || '';
  const projectDir = adapter.getProjectDir();

  // Update PDCA status if writing source code
  const ext = path.extname(filePath).toLowerCase();
  const sourceExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java'];

  if (!sourceExts.includes(ext)) {
    adapter.outputEmpty();
    return;
  }

  // Read current PDCA status
  const pdcaStatusPath = path.join(projectDir, 'docs', '.pdca-status.json');
  if (!fs.existsSync(pdcaStatusPath)) {
    adapter.outputEmpty();
    return;
  }

  try {
    const pdcaStatus = JSON.parse(fs.readFileSync(pdcaStatusPath, 'utf-8'));
    const primaryFeature = pdcaStatus.primaryFeature;

    if (primaryFeature && pdcaStatus.features[primaryFeature]) {
      const featureStatus = pdcaStatus.features[primaryFeature];

      // If in design phase, move to do phase
      if (featureStatus.phase === 'design') {
        featureStatus.phase = 'do';
        featureStatus.updatedAt = new Date().toISOString();
        pdcaStatus.lastUpdated = new Date().toISOString();

        pdcaStatus.history.push({
          timestamp: new Date().toISOString(),
          action: 'phase_transition',
          feature: primaryFeature,
          details: 'Moved to Do phase (implementation started)'
        });

        fs.writeFileSync(pdcaStatusPath, JSON.stringify(pdcaStatus, null, 2));

        adapter.outputAllow(
          `**PDCA Update**: Feature "${primaryFeature}" moved to Do phase. After implementation, run \`/pdca analyze ${primaryFeature}\` for gap analysis.`,
          'AfterTool'
        );
        return;
      }

      // If in do phase, suggest gap analysis after significant changes
      if (featureStatus.phase === 'do') {
        adapter.outputAllow(
          `**Reminder**: Feature "${primaryFeature}" is in implementation. Run \`/pdca analyze ${primaryFeature}\` when ready for gap analysis.`,
          'AfterTool'
        );
        return;
      }
    }
  } catch (e) {
    // Ignore errors
  }

  adapter.outputEmpty();
}

function handlePostSkill(adapter, toolInput) {
  const skillName = toolInput.skill || '';
  const args = toolInput.args || '';

  const contexts = [];

  // 1. Generic skill tracking (existing logic)
  if (skillName === 'pdca' || skillName.startsWith('bkit:pdca')) {
    const action = args.split(' ')[0];
    const feature = args.split(' ').slice(1).join(' ');

    if (action === 'plan' && feature) {
      contexts.push(`**PDCA Progress**: Plan created for "${feature}". Next: \`/pdca design ${feature}\``);
    } else if (action === 'design' && feature) {
      contexts.push(`**PDCA Progress**: Design created for "${feature}". Next: Start implementation, then \`/pdca analyze ${feature}\``);
    } else if (action === 'analyze' && feature) {
      contexts.push(`**PDCA Progress**: Gap analysis completed for "${feature}". Check match rate for next steps.`);
    }
  }

  // 2. Call specialized post-processors (FR-16)
  if (skillName === 'pdca' || skillName.startsWith('bkit:pdca')) {
    const action = args.split(' ')[0];
    const skillScriptMap = {
      'plan': 'pdca-plan-post.js',
      'design': 'pdca-design-post.js',
      'analyze': 'pdca-analyze-post.js',
      'iterate': 'pdca-iterate-post.js',
      'report': 'pdca-report-post.js'
    };

    const scriptFile = skillScriptMap[action];
    if (scriptFile) {
      try {
        const postProcessor = require(path.join(__dirname, 'skills', scriptFile));
        const result = postProcessor(toolInput, adapter);
        if (result && result.additionalContext) {
          contexts.push(result.additionalContext);
        }
      } catch (e) {
        // Silently fail post-processor
      }
    }
  }

  // Suggest agents based on skill
  const skillAgentMap = {
    'code-review': 'code-analyzer',
    'zero-script-qa': 'qa-monitor',
    'development-pipeline': 'pipeline-guide'
  };

  if (skillAgentMap[skillName]) {
    contexts.push(`**Agent Available**: ${skillAgentMap[skillName]} can assist with this task.`);
  }

  if (contexts.length > 0) {
    adapter.outputAllow(contexts.join('\n'), 'AfterTool');
  } else {
    adapter.outputEmpty();
  }
}

main();
