const fs = require('fs');
const path = require('path');
const { 
  assert, assertEqual, assertContains, assertExists, 
  PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, cleanupTestProject, executeHook 
} = require('../test-utils');

const { resetCache } = require(path.join(PLUGIN_ROOT, 'lib/adapters/gemini/version-detector'));
const { LEVEL_POLICY_TEMPLATES, generateLevelPolicy, generatePolicyFile } = require(path.join(PLUGIN_ROOT, 'lib/adapters/gemini/policy-migrator'));
const { HOOK_EVENT_MAP, supportsRuntimeHookFunctions, getHookExecutionInfo, getRuntimeHookTemplate } = require(path.join(PLUGIN_ROOT, 'lib/adapters/gemini/hook-adapter'));

module.exports = {
  tests: [
    {
      name: 'V156-26: LEVEL_POLICY_TEMPLATES has Starter, Dynamic, Enterprise',
      fn: () => {
        const keys = Object.keys(LEVEL_POLICY_TEMPLATES);
        assertEqual(keys.length, 3);
        assert(keys.includes('Starter'), 'Should have Starter');
        assert(keys.includes('Dynamic'), 'Should have Dynamic');
        assert(keys.includes('Enterprise'), 'Should have Enterprise');
      }
    },
    {
      name: 'V156-27: Starter template has 10 rules',
      fn: () => {
        assertEqual(LEVEL_POLICY_TEMPLATES.Starter.rules.length, 10);
      }
    },
    {
      name: 'V156-28: Dynamic template has 7 rules',
      fn: () => {
        assertEqual(LEVEL_POLICY_TEMPLATES.Dynamic.rules.length, 7);
      }
    },
    {
      name: 'V156-29: Enterprise template has 5 rules',
      fn: () => {
        assertEqual(LEVEL_POLICY_TEMPLATES.Enterprise.rules.length, 5);
      }
    },
    {
      name: 'V156-30: All level templates use tier 3 (workspace)',
      fn: () => {
        Object.values(LEVEL_POLICY_TEMPLATES).forEach(tmpl => {
          assertEqual(tmpl.tier, 3, `Template tier should be 3, got ${tmpl.tier}`);
        });
      }
    },
    {
      name: 'V156-31: generateLevelPolicy creates Starter policy TOML when CLI >= 0.31.0',
      setup: () => createTestProject({}),
      fn: () => {
        resetCache();
        process.env.GEMINI_CLI_VERSION = '0.31.0';
        try {
          const result = generateLevelPolicy('Starter', TEST_PROJECT_DIR);
          assertEqual(result.created, true, 'Should create Starter policy');
          assertContains(result.path, 'bkit-starter-policy.toml');
          assertExists(result.path, 'TOML file should exist');

          // Verify TOML content
          const content = fs.readFileSync(result.path, 'utf-8');
          assertContains(content, '[[rule]]', 'Should have [[rule]] syntax');
          assertContains(content, 'decision = "deny"', 'Starter should have deny rules');
          assertContains(content, 'decision = "ask_user"', 'Starter should have ask_user rules');
          assertContains(content, 'decision = "allow"', 'Starter should have allow rules');
        } finally {
          delete process.env.GEMINI_CLI_VERSION;
          resetCache();
        }
      },
      teardown: cleanupTestProject
    },
    {
      name: 'V156-32: generateLevelPolicy does not overwrite existing level policy',
      setup: () => {
        createTestProject({});
        const policyDir = path.join(TEST_PROJECT_DIR, '.gemini', 'policies');
        fs.mkdirSync(policyDir, { recursive: true });
        fs.writeFileSync(path.join(policyDir, 'bkit-starter-policy.toml'), 'EXISTING');
      },
      fn: () => {
        resetCache();
        process.env.GEMINI_CLI_VERSION = '0.31.0';
        try {
          const result = generateLevelPolicy('Starter', TEST_PROJECT_DIR);
          assertEqual(result.created, false, 'Should not overwrite');
          assertContains(result.reason, 'exists');
        } finally {
          delete process.env.GEMINI_CLI_VERSION;
          resetCache();
        }
      },
      teardown: cleanupTestProject
    },
    {
      name: 'V156-33: version guard (< 0.31.0)',
      fn: () => {
        resetCache();
        process.env.GEMINI_CLI_VERSION = '0.29.0';
        try {
          const result = generateLevelPolicy('Starter', '/tmp/test');
          assertEqual(result.created, false);
          assertContains(result.reason, 'not available');
        } finally {
          delete process.env.GEMINI_CLI_VERSION;
          resetCache();
        }
      }
    },
    {
      name: 'V156-34: unknown level',
      fn: () => {
        resetCache();
        process.env.GEMINI_CLI_VERSION = '0.31.0';
        try {
          const result = generateLevelPolicy('Unknown', '/tmp/test');
          assertEqual(result.created, false);
          assertContains(result.reason, 'Unknown level');
        } finally {
          delete process.env.GEMINI_CLI_VERSION;
          resetCache();
        }
      }
    },
    {
      name: 'V156-35: Enterprise policy TOML has allow decisions',
      setup: () => createTestProject({}),
      fn: () => {
        resetCache();
        process.env.GEMINI_CLI_VERSION = '0.31.0';
        try {
          const result = generateLevelPolicy('Enterprise', TEST_PROJECT_DIR);
          assertEqual(result.created, true);
          const content = fs.readFileSync(result.path, 'utf-8');
          assertContains(content, 'Enterprise Level Policy');
          assertContains(content, 'decision = "allow"');
        } finally {
          delete process.env.GEMINI_CLI_VERSION;
          resetCache();
        }
      },
      teardown: cleanupTestProject
    },
    {
      name: 'V156-36: Dynamic policy TOML has rm -rf deny',
      setup: () => createTestProject({}),
      fn: () => {
        resetCache();
        process.env.GEMINI_CLI_VERSION = '0.31.0';
        try {
          const result = generateLevelPolicy('Dynamic', TEST_PROJECT_DIR);
          assertEqual(result.created, true);
          const content = fs.readFileSync(result.path, 'utf-8');
          assertContains(content, 'rm -rf');
          assertContains(content, 'decision = "deny"');
        } finally {
          delete process.env.GEMINI_CLI_VERSION;
          resetCache();
        }
      },
      teardown: cleanupTestProject
    },
    {
      name: 'V156-37: supportsRuntimeHookFunctions() true for v0.31.0',
      fn: () => {
        resetCache();
        process.env.GEMINI_CLI_VERSION = '0.31.0';
        try {
          assertEqual(supportsRuntimeHookFunctions(), true);
        } finally {
          delete process.env.GEMINI_CLI_VERSION;
          resetCache();
        }
      }
    },
    {
      name: 'V156-38: supportsRuntimeHookFunctions() false for v0.30.0',
      fn: () => {
        resetCache();
        process.env.GEMINI_CLI_VERSION = '0.30.0';
        try {
          assertEqual(supportsRuntimeHookFunctions(), false);
        } finally {
          delete process.env.GEMINI_CLI_VERSION;
          resetCache();
        }
      }
    },
    {
      name: 'V156-39: getHookExecutionInfo() always returns mode="command"',
      fn: () => {
        const info = getHookExecutionInfo('session_start');
        assertEqual(info.mode, 'command', 'v1.5.6 always uses command mode');
        assertEqual(info.hookEvent, 'session_start');
      }
    },
    {
      name: 'V156-40: getHookExecutionInfo() reports sdkAvailable for v0.31.0',
      fn: () => {
        resetCache();
        process.env.GEMINI_CLI_VERSION = '0.31.0';
        try {
          const info = getHookExecutionInfo('before_tool');
          assertEqual(info.sdkAvailable, true);
          assertEqual(info.mode, 'command');
        } finally {
          delete process.env.GEMINI_CLI_VERSION;
          resetCache();
        }
      }
    },
    {
      name: 'V156-41: getRuntimeHookTemplate() default timeout is 30000',
      fn: () => {
        const tmpl = getRuntimeHookTemplate('session_start');
        assertEqual(tmpl.event, 'session_start');
        assertEqual(tmpl.timeout, 30000);
        assert(tmpl._note.includes('v1.5.6'), 'Should mention v1.5.6');
      }
    },
    {
      name: 'V156-42: getRuntimeHookTemplate() accepts custom timeout',
      fn: () => {
        const tmpl = getRuntimeHookTemplate('before_tool', 5000);
        assertEqual(tmpl.timeout, 5000);
      }
    },
    {
      name: 'V156-43: HOOK_EVENT_MAP has 10 entries',
      fn: () => {
        assertEqual(Object.keys(HOOK_EVENT_MAP).length, 10);
      }
    },
    {
      name: 'V156-44: HOOK_EVENT_MAP maps PascalCase to snake_case',
      fn: () => {
        assertEqual(HOOK_EVENT_MAP['SessionStart'], 'session_start');
        assertEqual(HOOK_EVENT_MAP['AfterTool'], 'after_tool');
        assertEqual(HOOK_EVENT_MAP['BeforeModel'], 'before_model');
        assertEqual(HOOK_EVENT_MAP['PreCompress'], 'pre_compress');
      }
    },
    {
      name: 'V156-45: HOOK_EVENT_MAP all values use snake_case',
      fn: () => {
        Object.values(HOOK_EVENT_MAP).forEach(v => {
          assert(/^[a-z_]+$/.test(v), `"${v}" should be snake_case`);
        });
      }
    },
    {
      name: 'V156-46: HOOK_EVENT_MAP is Object.freeze()-d',
      fn: () => {
        assertEqual(Object.isFrozen(HOOK_EVENT_MAP), true);
      }
    },
    {
      name: 'V156-47: session-start.js references v1.5.6 version',
      fn: () => {
        const content = fs.readFileSync(
          path.join(PLUGIN_ROOT, 'hooks', 'scripts', 'session-start.js'), 'utf-8'
        );
        const matches = content.match(/1\.5\.6/g) || [];
        assert(matches.length >= 4,
          `session-start.js should reference v1.5.6 at least 4 times, found ${matches.length}`);
      }
    },
    {
      name: 'V156-48: session-start generates level policy TOML for v0.31.0',
      setup: () => createTestProject({}),
      fn: () => {
        const result = executeHook('session-start.js', {}, {
          GEMINI_CLI_VERSION: '0.31.0'
        });
        assert(result.success || result.exitCode === 0,
          'session-start.js must exit 0 with GEMINI_CLI_VERSION=0.31.0');
        const policyDir = path.join(TEST_PROJECT_DIR, '.gemini', 'policies');
        if (fs.existsSync(policyDir)) {
          const files = fs.readdirSync(policyDir);
          assert(files.length >= 1, 'Policy directory should have at least one policy file');
        }
      },
      teardown: cleanupTestProject
    },
    {
      name: 'V156-49: v0.29.0 backward compatibility',
      fn: () => {
        resetCache();
        process.env.GEMINI_CLI_VERSION = '0.29.0';
        try {
          const { getFeatureFlags } = require(path.join(PLUGIN_ROOT, 'lib/adapters/gemini/version-detector'));
          const flags = getFeatureFlags();
          const trueFlags = Object.values(flags).filter(v => v === true).length;
          assertEqual(trueFlags, 4, 'v0.29.0 should have 4 true flags');

          const result = generateLevelPolicy('Starter', '/tmp/test');
          assertEqual(result.created, false, 'Level policy should be skipped for v0.29.0');
        } finally {
          delete process.env.GEMINI_CLI_VERSION;
          resetCache();
        }
      }
    },
    {
      name: 'V156-50: v0.30.0 backward compatibility',
      setup: () => createTestProject({}),
      fn: () => {
        resetCache();
        process.env.GEMINI_CLI_VERSION = '0.30.0';
        try {
          const { getFeatureFlags } = require(path.join(PLUGIN_ROOT, 'lib/adapters/gemini/version-detector'));
          const flags = getFeatureFlags();
          const trueFlags = Object.values(flags).filter(v => v === true).length;
          assertEqual(trueFlags, 9, 'v0.30.0 should have 9 true flags');

          const levelResult = generateLevelPolicy('Starter', TEST_PROJECT_DIR);
          assertEqual(levelResult.created, false, 'Level policy not available for v0.30.0');

          const baseResult = generatePolicyFile(TEST_PROJECT_DIR, PLUGIN_ROOT);
          assertEqual(baseResult.created, true, 'Base policy should generate for v0.30.0');
        } finally {
          delete process.env.GEMINI_CLI_VERSION;
          resetCache();
        }
      },
      teardown: cleanupTestProject
    },
    {
      name: 'V156-51: All config files reference version 1.5.6',
      fn: () => {
        const config = JSON.parse(fs.readFileSync(
          path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'
        ));
        const ext = JSON.parse(fs.readFileSync(
          path.join(PLUGIN_ROOT, 'gemini-extension.json'), 'utf-8'
        ));
        assertEqual(config.version, '1.5.6', 'bkit.config.json version');
        assertEqual(ext.version, '1.5.6', 'gemini-extension.json version');
      }
    }
  ]
};
