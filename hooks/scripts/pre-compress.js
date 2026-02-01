#!/usr/bin/env node
/**
 * PreCompress Hook - Context Preservation
 * Saves PDCA state before context compression
 */
const fs = require('fs');
const path = require('path');

const libPath = path.resolve(__dirname, '..', '..', 'lib');

function main() {
  try {
    const { getAdapter } = require(path.join(libPath, 'adapters'));
    const adapter = getAdapter();

    const projectDir = adapter.getProjectDir();
    const pdcaStatusPath = path.join(projectDir, 'docs', '.pdca-status.json');

    if (!fs.existsSync(pdcaStatusPath)) {
      adapter.outputEmpty();
      return;
    }

    // Read current PDCA status
    const pdcaStatus = JSON.parse(fs.readFileSync(pdcaStatusPath, 'utf-8'));

    // Create snapshot directory
    const snapshotDir = path.join(projectDir, 'docs', '.pdca-snapshots');
    if (!fs.existsSync(snapshotDir)) {
      fs.mkdirSync(snapshotDir, { recursive: true });
    }

    // Save snapshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotPath = path.join(snapshotDir, `snapshot-${timestamp}.json`);

    fs.writeFileSync(snapshotPath, JSON.stringify({
      ...pdcaStatus,
      _snapshotTimestamp: new Date().toISOString(),
      _reason: 'pre-compress'
    }, null, 2));

    // Cleanup old snapshots (keep last 10)
    const snapshots = fs.readdirSync(snapshotDir)
      .filter(f => f.startsWith('snapshot-'))
      .sort()
      .reverse();

    if (snapshots.length > 10) {
      for (const oldSnapshot of snapshots.slice(10)) {
        fs.unlinkSync(path.join(snapshotDir, oldSnapshot));
      }
    }

    // Generate summary for context restoration
    const summary = [];
    summary.push('**PDCA State Preserved**');

    if (pdcaStatus.primaryFeature) {
      const feature = pdcaStatus.features[pdcaStatus.primaryFeature];
      summary.push(`- Primary Feature: ${pdcaStatus.primaryFeature}`);
      summary.push(`- Current Phase: ${feature?.phase || 'unknown'}`);
      if (feature?.matchRate !== null && feature?.matchRate !== undefined) {
        summary.push(`- Match Rate: ${feature.matchRate}%`);
      }
    }

    if (pdcaStatus.activeFeatures.length > 1) {
      summary.push(`- Active Features: ${pdcaStatus.activeFeatures.join(', ')}`);
    }

    adapter.outputAllow(summary.join('\n'), 'PreCompress');

  } catch (error) {
    process.exit(0);
  }
}

main();
