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
    const { getAdapter } = require(path.join(libPath, 'gemini', 'platform'));
    const adapter = getAdapter();

    const projectDir = adapter.getProjectDir();
    const pdcaStatusModule = require(path.join(libPath, 'pdca', 'status'));
    const pdcaStatusPath = pdcaStatusModule.getPdcaStatusPath(projectDir);

    if (!fs.existsSync(pdcaStatusPath)) {
      adapter.outputEmpty();
      return;
    }

    // Read current PDCA status
    const pdcaStatus = pdcaStatusModule.loadPdcaStatus(projectDir);

    // JIT safeguard (v0.35.0+): detect if context may be partially loaded
    let jitPartial = false;
    try {
      const { getFeatureFlags } = require(path.join(libPath, 'gemini', 'version'));
      if (getFeatureFlags().hasJITContextLoading) {
        const hasFeatures = pdcaStatus.features && Object.keys(pdcaStatus.features).length > 0;
        if (!hasFeatures && pdcaStatus.primaryFeature) {
          // primaryFeature set but no features data -- likely incomplete load
          jitPartial = true;
        }
      }
    } catch (e) { /* non-fatal */ }

    // Create snapshot directory
    const snapshotDir = path.join(projectDir, '.bkit', 'snapshots');
    if (!fs.existsSync(snapshotDir)) {
      fs.mkdirSync(snapshotDir, { recursive: true });
    }

    // Save snapshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotPath = path.join(snapshotDir, `snapshot-${timestamp}.json`);

    fs.writeFileSync(snapshotPath, JSON.stringify({
      ...pdcaStatus,
      _snapshotTimestamp: new Date().toISOString(),
      _reason: 'pre-compress',
      _jitPartial: jitPartial
    }, null, 2));

    // v2.0.7-S5 W1: Strategy 1 Compaction — extract decisions/openItems/codeRefs and persist
    // alongside the snapshot. Honors BKIT_COMPACTION=false toggle (graceful no-op).
    try {
      const compactor = require(path.join(libPath, 'core', 'compactor'));
      if (compactor.isCompactionEnabled()) {
        // Reading raw transcript is out-of-scope for sync hook; we extract from the
        // PDCA status itself (history field if present, plus active feature notes).
        const messages = [];
        if (pdcaStatus.history && Array.isArray(pdcaStatus.history)) {
          for (const entry of pdcaStatus.history.slice(-200)) {
            if (entry && typeof entry.details === 'string') messages.push(entry.details);
            if (entry && typeof entry.summary === 'string') messages.push(entry.summary);
          }
        }
        if (pdcaStatus.features) {
          for (const [name, feat] of Object.entries(pdcaStatus.features)) {
            if (feat && feat.notes) messages.push(`${name}: ${feat.notes}`);
          }
        }
        const result = compactor.compactSession(
          {
            turnCount: (pdcaStatus.history && pdcaStatus.history.length) || 0,
            tokenUsage: 0,           // hook has no token visibility; rely on turn threshold
            contextWindow: 200_000,
            messages
          },
          projectDir
        );
        if (result.compacted) {
          fs.writeFileSync(snapshotPath + '.compact.json',
            JSON.stringify(result.summary, null, 2), 'utf-8');
        }
      }
    } catch (e) {
      // non-fatal: compaction failures must not break PreCompress hook
      if (process.env.BKIT_DEBUG === '1') console.error('compactor:', e.message);
    }

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
    if (process.env.BKIT_DEBUG === '1') {
      console.error('PreCompress Hook Error:', error);
    }
    process.exit(0);
  }
}

main();
