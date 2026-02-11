/**
 * PDCA Report Post-processor
 * After report generation -> mark feature as completed
 */
const { updateFeaturePhase, loadPdcaStatus, savePdcaStatus } = require('../utils/pdca-state-updater');

module.exports = function(input, adapter) {
  try {
    const projectDir = adapter.getProjectDir();
    const feature = extractFeature(input);
    if (!feature) return;

    const status = loadPdcaStatus(projectDir);
    if (!status) return;

    updateFeaturePhase(projectDir, feature, 'completed', {
      completedAt: new Date().toISOString()
    });

    // Remove from active features
    if (status.activeFeatures) {
      status.activeFeatures = status.activeFeatures.filter(f => f !== feature);
    }

    // Clear primary feature if it was this one
    if (status.primaryFeature === feature) {
      status.primaryFeature = status.activeFeatures[0] || null;
    }

    savePdcaStatus(projectDir, status);

    return {
      additionalContext: `PDCA cycle complete for "${feature}". Report generated successfully.`
    };
  } catch (e) { /* graceful degradation */ }
};

function extractFeature(input) {
  const args = input.args || input.arguments || '';
  const match = args.match(/report\s+(\S+)/);
  return match ? match[1] : null;
}
