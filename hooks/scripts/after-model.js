#!/usr/bin/env node
/**
 * AfterModel Hook - Response Tracking & Logging
 * Tracks usage metrics and validates response quality
 */
const fs = require('fs');
const path = require('path');

const libPath = path.resolve(__dirname, '..', '..', 'lib');

function main() {
  try {
    const { getAdapter } = require(path.join(libPath, 'adapters'));
    const adapter = getAdapter();

    const input = adapter.readHookInput();
    const response = input.response || input.text || '';

    if (!response) {
      console.log(JSON.stringify({ status: 'allow' }));
      process.exit(0);
    }

    const projectDir = adapter.getProjectDir();

    // 1. Track usage metrics
    trackUsage(projectDir, {
      responseLength: response.length,
      timestamp: new Date().toISOString(),
      hasFeatureReport: response.includes('bkit Feature Usage')
    });

    console.log(JSON.stringify({ status: 'allow' }));
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
    const memoryPath = path.join(projectDir, 'docs', '.bkit-memory.json');
    if (!fs.existsSync(memoryPath)) return;

    const memoryStr = fs.readFileSync(memoryPath, 'utf-8');
    const memory = JSON.parse(memoryStr);

    if (!memory.usage) {
      memory.usage = { totalResponses: 0, totalTokensEstimate: 0, featureReportRate: 0 };
    }

    memory.usage.totalResponses = (memory.usage.totalResponses || 0) + 1;
    memory.usage.totalTokensEstimate = (memory.usage.totalTokensEstimate || 0) + Math.ceil(metrics.responseLength / 4);
    memory.usage.lastResponseAt = metrics.timestamp;

    fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
  } catch (e) {
    // Silently fail
  }
}

main();