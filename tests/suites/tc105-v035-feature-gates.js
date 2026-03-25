// TC-105: v0.35.0 Feature Gates (8 TC)
const { PLUGIN_ROOT, assert, assertEqual, withVersion } = require('../test-utils');
const path = require('path');

const versionPath = path.join(PLUGIN_ROOT, 'lib/gemini/version');

const tests = [
  { name: 'TC105-01: v0.35.0 hasJITContextLoading = true', fn: () => {
    withVersion('0.35.0', () => {
      const { getFeatureFlags } = require(versionPath);
      assertEqual(getFeatureFlags().hasJITContextLoading, true, 'hasJITContextLoading should be true');
    });
  }},

  { name: 'TC105-02: v0.35.0 hasToolIsolation = true', fn: () => {
    withVersion('0.35.0', () => {
      const { getFeatureFlags } = require(versionPath);
      assertEqual(getFeatureFlags().hasToolIsolation, true, 'hasToolIsolation should be true');
    });
  }},

  { name: 'TC105-03: v0.35.0 hasParallelToolScheduler = true', fn: () => {
    withVersion('0.35.0', () => {
      const { getFeatureFlags } = require(versionPath);
      assertEqual(getFeatureFlags().hasParallelToolScheduler, true, 'hasParallelToolScheduler should be true');
    });
  }},

  { name: 'TC105-04: v0.35.0 hasAdminPolicy = true', fn: () => {
    withVersion('0.35.0', () => {
      const { getFeatureFlags } = require(versionPath);
      assertEqual(getFeatureFlags().hasAdminPolicy, true, 'hasAdminPolicy should be true');
    });
  }},

  { name: 'TC105-05: v0.34.0 hasJITContextLoading = false', fn: () => {
    withVersion('0.34.0', () => {
      const { getFeatureFlags } = require(versionPath);
      assertEqual(getFeatureFlags().hasJITContextLoading, false, 'hasJITContextLoading should be false for v0.34.0');
    });
  }},

  { name: 'TC105-06: v0.35.0 getBkitFeatureFlags().canUseJITContext = true', fn: () => {
    withVersion('0.35.0', () => {
      const { getBkitFeatureFlags } = require(versionPath);
      assertEqual(getBkitFeatureFlags().canUseJITContext, true, 'canUseJITContext should be true');
    });
  }},

  { name: 'TC105-07: v0.35.0 hasDisableAlwaysAllow = true', fn: () => {
    withVersion('0.35.0', () => {
      const { getFeatureFlags } = require(versionPath);
      assertEqual(getFeatureFlags().hasDisableAlwaysAllow, true, 'hasDisableAlwaysAllow should be true');
    });
  }},

  { name: 'TC105-08: v0.35.0 hasCryptoVerification = true', fn: () => {
    withVersion('0.35.0', () => {
      const { getFeatureFlags } = require(versionPath);
      assertEqual(getFeatureFlags().hasCryptoVerification, true, 'hasCryptoVerification should be true');
    });
  }}
];

module.exports = { tests };
