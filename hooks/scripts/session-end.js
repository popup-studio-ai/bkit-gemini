#!/usr/bin/env node
/**
 * SessionEnd Hook - Cleanup and State Persistence
 * Saves final state and cleans up session resources
 */
const fs = require('fs');
const path = require('path');

const libPath = path.resolve(__dirname, '..', '..', 'lib');

function main() {
  try {
    const { getAdapter } = require(path.join(libPath, 'gemini', 'platform'));
    const adapter = getAdapter();

    const projectDir = adapter.getProjectDir();

    // Update PDCA status with session end
    const pdcaStatusModule = require(path.join(libPath, 'pdca', 'status'));
    const pdcaStatusPath = pdcaStatusModule.getPdcaStatusPath(projectDir);
    if (fs.existsSync(pdcaStatusPath)) {
      try {
        const pdcaStatus = pdcaStatusModule.loadPdcaStatus(projectDir);

        pdcaStatus.session.lastActivity = new Date().toISOString();
        pdcaStatus.lastUpdated = new Date().toISOString();

        pdcaStatus.history.push({
          timestamp: new Date().toISOString(),
          action: 'session_end',
          feature: pdcaStatus.primaryFeature || null,
          details: 'Session ended'
        });

        pdcaStatusModule.savePdcaStatus(pdcaStatus, projectDir);
      } catch (e) {
        // Ignore errors
      }
    }

    // Update memory store
    try {
      const { getMemory } = require(path.join(libPath, 'core', 'memory'));
      const memoryManager = getMemory(projectDir);
      memoryManager.endSession();
    } catch (e) {
      // Ignore errors
    }

    adapter.outputAllow('bkit session ended. State preserved.', 'SessionEnd');

  } catch (error) {
    process.exit(0);
  }
}

main();
