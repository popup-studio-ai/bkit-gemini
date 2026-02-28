const fs = require('fs');
const path = require('path');
const { assert, assertEqual, PLUGIN_ROOT } = require('../test-utils');

const { getFeatureFlags, resetCache } = require(path.join(PLUGIN_ROOT, 'lib/adapters/gemini/version-detector'));
const { TOOL_ANNOTATIONS, getToolAnnotations, isReadOnlyTool, getStrictReadOnlyTools, BUILTIN_TOOLS } = require(path.join(PLUGIN_ROOT, 'lib/adapters/gemini/tool-registry'));

module.exports = {
  tests: [
    {
      name: 'V156-01: v0.31.0 has 18 feature flags all true',
      fn: () => {
        resetCache();
        const original = process.env.GEMINI_CLI_VERSION;
        process.env.GEMINI_CLI_VERSION = '0.31.0';
        try {
          const flags = getFeatureFlags();
          const keys = Object.keys(flags);
          assertEqual(keys.length, 18, 'Should have exactly 18 feature flags');
          keys.forEach(key => {
            assertEqual(flags[key], true, `${key} should be true for v0.31.0`);
          });
        } finally {
          if (original !== undefined) process.env.GEMINI_CLI_VERSION = original;
          else delete process.env.GEMINI_CLI_VERSION;
          resetCache();
        }
      }
    },
    {
      name: 'V156-02: hasRuntimeHookFunctions is true for v0.31.0',
      fn: () => {
        resetCache();
        process.env.GEMINI_CLI_VERSION = '0.31.0';
        try {
          assertEqual(getFeatureFlags().hasRuntimeHookFunctions, true);
        } finally {
          delete process.env.GEMINI_CLI_VERSION;
          resetCache();
        }
      }
    },
    {
      name: 'V156-03: hasRuntimeHookFunctions is false for v0.30.0',
      fn: () => {
        resetCache();
        process.env.GEMINI_CLI_VERSION = '0.30.0';
        try {
          assertEqual(getFeatureFlags().hasRuntimeHookFunctions, false);
        } finally {
          delete process.env.GEMINI_CLI_VERSION;
          resetCache();
        }
      }
    },
    {
      name: 'V156-04: hasBrowserAgent is true for v0.31.0',
      fn: () => {
        resetCache();
        process.env.GEMINI_CLI_VERSION = '0.31.0';
        try {
          assertEqual(getFeatureFlags().hasBrowserAgent, true);
        } finally {
          delete process.env.GEMINI_CLI_VERSION;
          resetCache();
        }
      }
    },
    {
      name: 'V156-05: hasProjectLevelPolicy is true for v0.31.0',
      fn: () => {
        resetCache();
        process.env.GEMINI_CLI_VERSION = '0.31.0';
        try {
          assertEqual(getFeatureFlags().hasProjectLevelPolicy, true);
        } finally {
          delete process.env.GEMINI_CLI_VERSION;
          resetCache();
        }
      }
    },
    {
      name: 'V156-06: hasMcpProgress is true for v0.31.0',
      fn: () => {
        resetCache();
        process.env.GEMINI_CLI_VERSION = '0.31.0';
        try {
          assertEqual(getFeatureFlags().hasMcpProgress, true);
        } finally {
          delete process.env.GEMINI_CLI_VERSION;
          resetCache();
        }
      }
    },
    {
      name: 'V156-07: hasParallelReadCalls is true for v0.31.0',
      fn: () => {
        resetCache();
        process.env.GEMINI_CLI_VERSION = '0.31.0';
        try {
          assertEqual(getFeatureFlags().hasParallelReadCalls, true);
        } finally {
          delete process.env.GEMINI_CLI_VERSION;
          resetCache();
        }
      }
    },
    {
      name: 'V156-08: hasPlanModeCustomStorage is true for v0.31.0',
      fn: () => {
        resetCache();
        process.env.GEMINI_CLI_VERSION = '0.31.0';
        try {
          assertEqual(getFeatureFlags().hasPlanModeCustomStorage, true);
        } finally {
          delete process.env.GEMINI_CLI_VERSION;
          resetCache();
        }
      }
    },
    {
      name: 'V156-09: hasToolAnnotations is true for v0.31.0',
      fn: () => {
        resetCache();
        process.env.GEMINI_CLI_VERSION = '0.31.0';
        try {
          assertEqual(getFeatureFlags().hasToolAnnotations, true);
        } finally {
          delete process.env.GEMINI_CLI_VERSION;
          resetCache();
        }
      }
    },
    {
      name: 'V156-10: hasExtensionFolderTrust is true for v0.31.0',
      fn: () => {
        resetCache();
        process.env.GEMINI_CLI_VERSION = '0.31.0';
        try {
          assertEqual(getFeatureFlags().hasExtensionFolderTrust, true);
        } finally {
          delete process.env.GEMINI_CLI_VERSION;
          resetCache();
        }
      }
    },
    {
      name: 'V156-11: hasAllowMultipleReplace is true for v0.31.0',
      fn: () => {
        resetCache();
        process.env.GEMINI_CLI_VERSION = '0.31.0';
        try {
          assertEqual(getFeatureFlags().hasAllowMultipleReplace, true);
        } finally {
          delete process.env.GEMINI_CLI_VERSION;
          resetCache();
        }
      }
    },
    {
      name: 'V156-12: v0.30.0 has 9 true flags and 9 false (v0.31.0 flags)',
      fn: () => {
        resetCache();
        process.env.GEMINI_CLI_VERSION = '0.30.0';
        try {
          const flags = getFeatureFlags();
          assertEqual(flags.hasSkillsStable, true);
          assertEqual(flags.hasPlanMode, true);
          assertEqual(flags.hasPolicyEngine, true);
          assertEqual(flags.hasSDK, true);
          assertEqual(flags.hasApprovalMode, true);
          assertEqual(flags.hasRuntimeHookFunctions, false);
          assertEqual(flags.hasBrowserAgent, false);
          assertEqual(flags.hasProjectLevelPolicy, false);
          assertEqual(flags.hasMcpProgress, false);
          assertEqual(flags.hasParallelReadCalls, false);
          assertEqual(flags.hasPlanModeCustomStorage, false);
          assertEqual(flags.hasToolAnnotations, false);
          assertEqual(flags.hasExtensionFolderTrust, false);
          assertEqual(flags.hasAllowMultipleReplace, false);
        } finally {
          delete process.env.GEMINI_CLI_VERSION;
          resetCache();
        }
      }
    },
    {
      name: 'V156-13: v0.29.0 has only 4 true flags',
      fn: () => {
        resetCache();
        process.env.GEMINI_CLI_VERSION = '0.29.0';
        try {
          const flags = getFeatureFlags();
          const trueCount = Object.values(flags).filter(v => v === true).length;
          assertEqual(trueCount, 4, 'v0.29.0 should have exactly 4 true flags');
          assertEqual(flags.hasSkillsStable, true);
          assertEqual(flags.hasPlanMode, true);
          assertEqual(flags.hasGemini3Default, true);
          assertEqual(flags.hasExtensionRegistry, true);
        } finally {
          delete process.env.GEMINI_CLI_VERSION;
          resetCache();
        }
      }
    },
    {
      name: 'V156-14: getFeatureFlags() returns exactly 18 keys',
      fn: () => {
        const flags = getFeatureFlags();
        assertEqual(Object.keys(flags).length, 18);
      }
    },
    {
      name: 'V156-15: TOOL_ANNOTATIONS has 17 entries (all built-in tools)',
      fn: () => {
        assertEqual(Object.keys(TOOL_ANNOTATIONS).length, 17);
      }
    },
    {
      name: 'V156-16: 9 tools have readOnlyHint=true',
      fn: () => {
        const readOnly = Object.entries(TOOL_ANNOTATIONS)
          .filter(([, ann]) => ann.readOnlyHint === true);
        assertEqual(readOnly.length, 9);
      }
    },
    {
      name: 'V156-17: only run_shell_command has destructiveHint=true',
      fn: () => {
        const destructive = Object.entries(TOOL_ANNOTATIONS)
          .filter(([, ann]) => ann.destructiveHint === true);
        assertEqual(destructive.length, 1);
        assertEqual(destructive[0][0], BUILTIN_TOOLS.RUN_SHELL_COMMAND || 'run_shell_command');
      }
    },
    {
      name: 'V156-18: 12 tools have idempotentHint=true',
      fn: () => {
        const idempotent = Object.entries(TOOL_ANNOTATIONS)
          .filter(([, ann]) => ann.idempotentHint === true);
        assertEqual(idempotent.length, 12);
      }
    },
    {
      name: 'V156-19: getToolAnnotations("read_file") returns correct hints',
      fn: () => {
        const ann = getToolAnnotations('read_file');
        assert(ann !== null && ann !== undefined, 'Should return annotation');
        assertEqual(ann.readOnlyHint, true);
        assertEqual(ann.destructiveHint, false);
        assertEqual(ann.idempotentHint, true);
      }
    },
    {
      name: 'V156-20: isReadOnlyTool("read_file") returns true',
      fn: () => {
        assertEqual(isReadOnlyTool('read_file'), true);
      }
    },
    {
      name: 'V156-21: isReadOnlyTool("write_file") returns false',
      fn: () => {
        assertEqual(isReadOnlyTool('write_file'), false);
      }
    },
    {
      name: 'V156-22: getStrictReadOnlyTools() returns 9 tools',
      fn: () => {
        const tools = getStrictReadOnlyTools();
        assertEqual(tools.length, 9, 'Should return 9 strict read-only tools');
      }
    },
    {
      name: 'V156-23: getStrictReadOnlyTools() includes read_file, glob, grep_search',
      fn: () => {
        const tools = getStrictReadOnlyTools();
        assert(tools.includes('read_file'), 'Should include read_file');
        assert(tools.includes('glob'), 'Should include glob');
        assert(tools.includes('grep_search'), 'Should include grep_search');
        assert(tools.includes('google_web_search'), 'Should include google_web_search');
      }
    },
    {
      name: 'V156-24: bkit.config.json testedVersions includes "0.31.0"',
      fn: () => {
        const config = JSON.parse(fs.readFileSync(
          path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'
        ));
        assert(
          config.compatibility.testedVersions.includes('0.31.0'),
          'testedVersions must include "0.31.0" for v1.5.6'
        );
      }
    },
    {
      name: 'V156-25: bkit.config.json levelPolicies.enabled is true',
      fn: () => {
        const config = JSON.parse(fs.readFileSync(
          path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'
        ));
        assertEqual(
          config.compatibility.policyEngine.levelPolicies?.enabled, true,
          'levelPolicies must be enabled for v1.5.6'
        );
      }
    }
  ]
};
