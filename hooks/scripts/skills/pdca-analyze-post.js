/**
 * PDCA Analyze Post-processor
 * After Gap analysis -> save match rate + auto-iterate decision
 */
const { updateFeaturePhase, loadPdcaStatus } = require('../utils/pdca-state-updater');

module.exports = function(input, adapter) {
  try {
    const projectDir = adapter.getProjectDir();
    const feature = extractFeature(input);
    if (!feature) return;

    // Extract match rate from output if available
    const output = input.output || input.result || '';
    const matchRate = extractMatchRate(output);

    const extraData = {};
    if (matchRate !== null) {
      extraData.matchRate = matchRate;
      extraData.lastAnalyzedAt = new Date().toISOString();
    }

    updateFeaturePhase(projectDir, feature, 'check', extraData);

    if (matchRate !== null && matchRate < 90) {
      return {
        additionalContext: `Gap analysis complete: ${matchRate}% match rate. Below 90% threshold. Recommended: /pdca iterate ${feature}`
      };
    } else if (matchRate !== null) {
      return {
        additionalContext: `Gap analysis complete: ${matchRate}% match rate. Meets threshold! Recommended: /pdca report ${feature}`
      };
    }
  } catch (e) { /* graceful degradation */ }
};

function extractFeature(input) {
  const args = input.args || input.arguments || '';
  const match = args.match(/analyze\s+(\S+)/);
  return match ? match[1] : null;
}

function extractMatchRate(output) {
  if (!output) return null;
  const match = output.match(/(?:match\s*rate|일치율|매치율)[:\s]*(\d+(?:\.\d+)?)\s*%/i);
  return match ? parseFloat(match[1]) : null;
}
