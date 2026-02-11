/**
 * PDCA Design Post-processor
 * After Design document creation -> update status + recommend Do
 */
const { updateFeaturePhase } = require('../utils/pdca-state-updater');

module.exports = function(input, adapter) {
  try {
    const projectDir = adapter.getProjectDir();
    const feature = extractFeature(input);
    if (!feature) return;

    updateFeaturePhase(projectDir, feature, 'design');

    return {
      additionalContext: `Design document created for "${feature}". Recommended next step: /pdca do ${feature}`
    };
  } catch (e) { /* graceful degradation */ }
};

function extractFeature(input) {
  const args = input.args || input.arguments || '';
  const match = args.match(/design\s+(\S+)/);
  return match ? match[1] : null;
}
