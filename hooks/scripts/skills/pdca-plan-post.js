/**
 * PDCA Plan Post-processor
 * After Plan document creation -> update PDCA status + recommend Design
 */
const { updateFeaturePhase } = require('../utils/pdca-state-updater');

module.exports = function(input, adapter) {
  try {
    const projectDir = adapter.getProjectDir();
    const feature = extractFeature(input);
    if (!feature) return;

    updateFeaturePhase(projectDir, feature, 'plan');

    return {
      additionalContext: `Plan document created for "${feature}". Recommended next step: /pdca design ${feature}`
    };
  } catch (e) { /* graceful degradation */ }
};

function extractFeature(input) {
  const args = input.args || input.arguments || '';
  const match = args.match(/plan\s+(\S+)/);
  return match ? match[1] : null;
}
