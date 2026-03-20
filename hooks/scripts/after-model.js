#!/usr/bin/env node
/**
 * AfterModel Hook - Response Tracking & Logging
 * Tracks usage metrics and validates response quality
 * Dual-mode: handler export (v0.31.0+ SDK) + stdin command (legacy)
 */
const fs = require('fs');
const path = require('path');

const libPath = path.resolve(__dirname, '..', '..', 'lib');

// --- Core processing logic ---
function processHook(input) {
  try {
    const response = input.response || input.text || '';
    if (!response) return { status: 'allow' };

    const projectDir = input.projectDir || process.cwd();
    trackUsage(projectDir, {
      responseLength: response.length,
      timestamp: new Date().toISOString(),
      hasFeatureReport: response.includes('bkit Feature Usage')
    });

    return { status: 'allow' };
  } catch (error) {
    return { status: 'allow' };
  }
}

// --- RuntimeHook function export (v0.31.0+ SDK) ---
async function handler(event) {
  return processHook(event);
}

// --- Legacy command mode ---
function main() {
  try {
    const { getAdapter } = require(path.join(libPath, 'gemini', 'platform'));
    const adapter = getAdapter();
    const input = adapter.readHookInput();
    input.projectDir = adapter.getProjectDir();
    const result = processHook(input);
    console.log(JSON.stringify(result));
    process.exit(0);
  } catch (error) {
    console.log(JSON.stringify({ status: 'allow' }));
    process.exit(0);
  }
}

/**
 * Track usage metrics to memory
 */
function trackUsage(projectDir, metrics) {
  try {
    const { getMemory } = require(path.join(libPath, 'core', 'memory'));
    const memoryManager = getMemory(projectDir);

    const totalResponses = memoryManager.get('usage.totalResponses', 0) + 1;
    const totalTokensEstimate = memoryManager.get('usage.totalTokensEstimate', 0) + Math.ceil(metrics.responseLength / 4);

    memoryManager.set('usage.totalResponses', totalResponses);
    memoryManager.set('usage.totalTokensEstimate', totalTokensEstimate);
    memoryManager.set('usage.lastResponseAt', metrics.timestamp);
  } catch (e) {
    // Silently fail
  }
}

if (require.main === module) { main(); }

module.exports = { handler };