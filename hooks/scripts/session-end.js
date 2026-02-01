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
    const { getAdapter } = require(path.join(libPath, 'adapters'));
    const adapter = getAdapter();

    const projectDir = adapter.getProjectDir();

    // Update PDCA status with session end
    const pdcaStatusPath = path.join(projectDir, 'docs', '.pdca-status.json');
    if (fs.existsSync(pdcaStatusPath)) {
      try {
        const pdcaStatus = JSON.parse(fs.readFileSync(pdcaStatusPath, 'utf-8'));

        pdcaStatus.session.lastActivity = new Date().toISOString();
        pdcaStatus.lastUpdated = new Date().toISOString();

        pdcaStatus.history.push({
          timestamp: new Date().toISOString(),
          action: 'session_end',
          feature: pdcaStatus.primaryFeature || null,
          details: 'Session ended'
        });

        fs.writeFileSync(pdcaStatusPath, JSON.stringify(pdcaStatus, null, 2));
      } catch (e) {
        // Ignore errors
      }
    }

    // Update memory store
    const memoryPath = path.join(projectDir, 'docs', '.bkit-memory.json');
    if (fs.existsSync(memoryPath)) {
      try {
        const memory = JSON.parse(fs.readFileSync(memoryPath, 'utf-8'));
        memory.lastSessionEnded = new Date().toISOString();
        fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
      } catch (e) {
        // Ignore errors
      }
    }

    adapter.outputAllow('bkit session ended. State preserved.', 'SessionEnd');

  } catch (error) {
    process.exit(0);
  }
}

main();
