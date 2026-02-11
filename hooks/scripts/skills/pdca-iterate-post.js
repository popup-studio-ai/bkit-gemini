/**
 * PDCA Iterate Post-processor
 * After iteration -> update count + re-analyze trigger
 */
const { updateFeaturePhase, loadPdcaStatus } = require('../utils/pdca-state-updater');

module.exports = function(input, adapter) {
  try {
    const projectDir = adapter.getProjectDir();
    const feature = extractFeature(input);
    if (!feature) return;

    const status = loadPdcaStatus(projectDir);
    const featureData = status?.features?.[feature] || {};
    const iterationCount = (featureData.iterationCount || 0) + 1;

    updateFeaturePhase(projectDir, feature, 'act', {
      iterationCount,
      lastIteratedAt: new Date().toISOString()
    });

    if (iterationCount >= 5) {
      return {
        additionalContext: `Iteration ${iterationCount}/5 complete for "${feature}". Maximum iterations reached. Run /pdca analyze ${feature} for final check.`
      };
    }

    return {
      additionalContext: `Iteration ${iterationCount}/5 complete for "${feature}". Run /pdca analyze ${feature} to check progress.`
    };
  } catch (e) { /* graceful degradation */ }
};

function extractFeature(input) {
  const args = input.args || input.arguments || '';
  const match = args.match(/iterate\s+(\S+)/);
  return match ? match[1] : null;
}
