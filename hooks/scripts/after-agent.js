#!/usr/bin/env node
/**
 * AfterAgent Hook - Agent Completion Handler
 * Handles cleanup and phase transitions after agent/skill completion
 */
const fs = require('fs');
const path = require('path');

const libPath = path.resolve(__dirname, '..', '..', 'lib');

// Agent handler registry
const AGENT_HANDLERS = {
  'gap-detector': handleGapDetectorComplete,
  'pdca-iterator': handleIteratorComplete,
  'code-analyzer': handleAnalyzerComplete,
  'qa-monitor': handleQaComplete,
  'report-generator': handleReportComplete
};

// Skill handler registry
const SKILL_HANDLERS = {
  'pdca': handlePdcaSkillComplete,
  'code-review': handleCodeReviewComplete,
  'phase-8-review': handlePhase8Complete
};

function main() {
  try {
    const { getAdapter } = require(path.join(libPath, 'adapters'));
    const adapter = getAdapter();

    // Read input
    const input = adapter.readHookInput();

    // Try to detect active skill/agent
    let activeAgent = input.agent_name || input.agent;
    let activeSkill = input.skill_name || input.skill;

    // Check tool_input for skill invocation
    if (!activeSkill && input.tool_input?.skill) {
      activeSkill = input.tool_input.skill;
    }

    // Execute appropriate handler
    if (activeAgent && AGENT_HANDLERS[activeAgent]) {
      AGENT_HANDLERS[activeAgent](adapter, input);
      return;
    }

    if (activeSkill && SKILL_HANDLERS[activeSkill]) {
      SKILL_HANDLERS[activeSkill](adapter, input);
      return;
    }

    adapter.outputEmpty();

  } catch (error) {
    process.exit(0);
  }
}

function handleGapDetectorComplete(adapter, input) {
  const projectDir = adapter.getProjectDir();
  const pdcaStatusPath = path.join(projectDir, 'docs', '.pdca-status.json');

  try {
    if (!fs.existsSync(pdcaStatusPath)) {
      adapter.outputEmpty();
      return;
    }

    const pdcaStatus = JSON.parse(fs.readFileSync(pdcaStatusPath, 'utf-8'));
    const primaryFeature = pdcaStatus.primaryFeature;

    if (!primaryFeature) {
      adapter.outputEmpty();
      return;
    }

    // Try to extract match rate from context
    const context = input.context || input.output || '';
    const matchRateMatch = context.match(/(?:Match Rate|매치율|一致率)[^\d]*(\d+)/i);
    const matchRate = matchRateMatch ? parseInt(matchRateMatch[1]) : null;

    if (matchRate !== null) {
      // Update PDCA status
      pdcaStatus.features[primaryFeature].phase = 'check';
      pdcaStatus.features[primaryFeature].matchRate = matchRate;
      pdcaStatus.features[primaryFeature].updatedAt = new Date().toISOString();
      pdcaStatus.lastUpdated = new Date().toISOString();

      pdcaStatus.history.push({
        timestamp: new Date().toISOString(),
        action: 'gap_analysis_complete',
        feature: primaryFeature,
        details: `Match rate: ${matchRate}%`
      });

      fs.writeFileSync(pdcaStatusPath, JSON.stringify(pdcaStatus, null, 2));

      // Suggest next action based on match rate
      if (matchRate >= 90) {
        adapter.outputAllow(
          `**Gap Analysis Complete**: Match rate ${matchRate}% (>=90%). Run \`/pdca report ${primaryFeature}\` to generate completion report.`,
          'AfterAgent'
        );
      } else {
        adapter.outputAllow(
          `**Gap Analysis Complete**: Match rate ${matchRate}% (<90%). Run \`/pdca iterate ${primaryFeature}\` for auto-improvement.`,
          'AfterAgent'
        );
      }
      return;
    }
  } catch (e) {
    // Ignore errors
  }

  adapter.outputEmpty();
}

function handleIteratorComplete(adapter, input) {
  const projectDir = adapter.getProjectDir();
  const pdcaStatusPath = path.join(projectDir, 'docs', '.pdca-status.json');

  try {
    if (!fs.existsSync(pdcaStatusPath)) {
      adapter.outputEmpty();
      return;
    }

    const pdcaStatus = JSON.parse(fs.readFileSync(pdcaStatusPath, 'utf-8'));
    const primaryFeature = pdcaStatus.primaryFeature;

    if (!primaryFeature) {
      adapter.outputEmpty();
      return;
    }

    // Increment iteration count
    const featureStatus = pdcaStatus.features[primaryFeature];
    featureStatus.iterationCount = (featureStatus.iterationCount || 0) + 1;
    featureStatus.phase = 'act';
    featureStatus.updatedAt = new Date().toISOString();
    pdcaStatus.lastUpdated = new Date().toISOString();

    pdcaStatus.history.push({
      timestamp: new Date().toISOString(),
      action: 'iteration_complete',
      feature: primaryFeature,
      details: `Iteration ${featureStatus.iterationCount} completed`
    });

    fs.writeFileSync(pdcaStatusPath, JSON.stringify(pdcaStatus, null, 2));

    if (featureStatus.iterationCount >= 5) {
      adapter.outputAllow(
        `**Iteration Limit Reached**: Max iterations (5) reached for "${primaryFeature}". Consider manual review or \`/pdca report ${primaryFeature}\`.`,
        'AfterAgent'
      );
    } else {
      adapter.outputAllow(
        `**Iteration ${featureStatus.iterationCount} Complete**: Run \`/pdca analyze ${primaryFeature}\` to verify improvements.`,
        'AfterAgent'
      );
    }

  } catch (e) {
    adapter.outputEmpty();
  }
}

function handleAnalyzerComplete(adapter, input) {
  adapter.outputAllow(
    '**Code Analysis Complete**: Review the findings and address any critical issues.',
    'AfterAgent'
  );
}

function handleQaComplete(adapter, input) {
  adapter.outputAllow(
    '**QA Monitoring Complete**: Check the log analysis results for any issues.',
    'AfterAgent'
  );
}

function handleReportComplete(adapter, input) {
  const projectDir = adapter.getProjectDir();
  const pdcaStatusPath = path.join(projectDir, 'docs', '.pdca-status.json');

  try {
    if (fs.existsSync(pdcaStatusPath)) {
      const pdcaStatus = JSON.parse(fs.readFileSync(pdcaStatusPath, 'utf-8'));
      const primaryFeature = pdcaStatus.primaryFeature;

      if (primaryFeature && pdcaStatus.features[primaryFeature]) {
        pdcaStatus.features[primaryFeature].phase = 'completed';
        pdcaStatus.features[primaryFeature].updatedAt = new Date().toISOString();
        pdcaStatus.lastUpdated = new Date().toISOString();

        pdcaStatus.history.push({
          timestamp: new Date().toISOString(),
          action: 'report_complete',
          feature: primaryFeature,
          details: 'PDCA cycle completed'
        });

        fs.writeFileSync(pdcaStatusPath, JSON.stringify(pdcaStatus, null, 2));

        adapter.outputAllow(
          `**PDCA Complete**: Feature "${primaryFeature}" development cycle completed. Consider \`/pdca archive ${primaryFeature}\` to archive documents.`,
          'AfterAgent'
        );
        return;
      }
    }
  } catch (e) {
    // Ignore errors
  }

  adapter.outputAllow('**Report Complete**: PDCA completion report generated.', 'AfterAgent');
}

function handlePdcaSkillComplete(adapter, input) {
  // Generic PDCA skill completion
  adapter.outputAllow('**PDCA Skill Complete**: Check /pdca status for current progress.', 'AfterAgent');
}

function handleCodeReviewComplete(adapter, input) {
  adapter.outputAllow('**Code Review Complete**: Address any findings in the review report.', 'AfterAgent');
}

function handlePhase8Complete(adapter, input) {
  adapter.outputAllow('**Phase 8 Review Complete**: Ready for deployment phase.', 'AfterAgent');
}

main();
