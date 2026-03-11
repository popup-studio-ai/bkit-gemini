// tests/run-all.js - Main test runner for bkit-gemini v1.5.8
const { runSuite } = require('./test-utils');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--') && args[i + 1] && !args[i + 1].startsWith('--')) {
      opts[args[i].replace('--', '')] = args[i + 1];
      i++;
    }
  }
  return opts;
}

function filterSuites(suites, opts) {
  let filtered = [...suites];
  if (opts.priority) filtered = filtered.filter(s => s.priority === opts.priority);
  if (opts.category) filtered = filtered.filter(s => s.category === opts.category);
  if (opts.sprint) filtered = filtered.filter(s => s.sprint === parseInt(opts.sprint));
  if (opts.suite) filtered = filtered.filter(s => s.file.includes(opts.suite));
  return filtered;
}

async function main() {
  const opts = parseArgs();

  const suites = [
    // ═══ 기존 TC-01~TC-24 (Regression) ═══
    { name: 'TC-04: Lib Modules', file: 'suites/tc04-lib-modules.js', priority: 'P0', category: 'regression', sprint: 0 },
    { name: 'TC-01: Hook System', file: 'suites/tc01-hooks.js', priority: 'P0', category: 'regression', sprint: 0 },
    { name: 'TC-02: Skill System', file: 'suites/tc02-skills.js', priority: 'P0', category: 'regression', sprint: 0 },
    { name: 'TC-09: PDCA E2E', file: 'suites/tc09-pdca-e2e.js', priority: 'P0', category: 'regression', sprint: 0 },
    { name: 'TC-13: Automation', file: 'suites/tc13-automation.js', priority: 'P0', category: 'regression', sprint: 0 },
    { name: 'TC-16: v0.30.0 Phase 1', file: 'suites/tc16-v030-phase1.js', priority: 'P0', category: 'regression', sprint: 0 },
    { name: 'TC-18: v0.31.0 Features', file: 'suites/tc18-v031-features.js', priority: 'P0', category: 'regression', sprint: 0 },
    { name: 'TC-19: v0.31.0 Policy Hooks', file: 'suites/tc19-v031-policy-hooks.js', priority: 'P0', category: 'regression', sprint: 0 },
    { name: 'TC-20: Coverage Gaps', file: 'suites/tc20-coverage-gaps.js', priority: 'P1', category: 'regression', sprint: 0 },
    { name: 'TC-21: v0.32.x Migration', file: 'suites/tc21-v032-migration.js', priority: 'P0', category: 'regression', sprint: 0 },
    { name: 'TC-22: PDCA Status Path', file: 'suites/tc22-pdca-status-path.js', priority: 'P0', category: 'regression', sprint: 0 },
    { name: 'TC-23: Tracker Bridge', file: 'suites/tc23-tracker-bridge.js', priority: 'P0', category: 'regression', sprint: 0 },
    { name: 'TC-24: RuntimeHook SDK', file: 'suites/tc24-runtime-hooks.js', priority: 'P0', category: 'regression', sprint: 0 },
    { name: 'TC-07: Configuration', file: 'suites/tc07-config.js', priority: 'P1', category: 'regression', sprint: 0 },
    { name: 'TC-03: Agent System', file: 'suites/tc03-agents.js', priority: 'P1', category: 'regression', sprint: 0 },
    { name: 'TC-05: MCP Server', file: 'suites/tc05-mcp.js', priority: 'P1', category: 'regression', sprint: 0 },
    { name: 'TC-06: TOML Commands', file: 'suites/tc06-commands.js', priority: 'P1', category: 'regression', sprint: 0 },
    { name: 'TC-08: Context Engineering', file: 'suites/tc08-context.js', priority: 'P1', category: 'regression', sprint: 0 },
    { name: 'TC-11: Output Styles', file: 'suites/tc11-output-styles.js', priority: 'P1', category: 'regression', sprint: 0 },
    { name: 'TC-12: Agent Memory', file: 'suites/tc12-agent-memory.js', priority: 'P1', category: 'regression', sprint: 0 },
    { name: 'TC-17: v0.30.0 Phase 2', file: 'suites/tc17-v030-phase2.js', priority: 'P1', category: 'regression', sprint: 0 },
    { name: 'TC-14: bkend.ai Skills', file: 'suites/tc14-bkend-skills.js', priority: 'P2', category: 'regression', sprint: 0 },
    { name: 'TC-15: Feature Report', file: 'suites/tc15-feature-report.js', priority: 'P2', category: 'regression', sprint: 0 },
    { name: 'TC-10: Philosophy', file: 'suites/tc10-philosophy.js', priority: 'P2', category: 'regression', sprint: 0 },

    // ═══ 관점 1: Unit Test (TC-25~TC-38) ═══
    { name: 'TC-25: Tool Registry v1.5.8', file: 'suites/tc25-tool-registry-v158.js', priority: 'P0', category: 'unit', sprint: 1 },
    { name: 'TC-26: Version Detector v1.5.8', file: 'suites/tc26-version-detector-v158.js', priority: 'P0', category: 'unit', sprint: 1 },
    { name: 'TC-27: Skill Orchestrator v1.5.8', file: 'suites/tc27-skill-orchestrator-v158.js', priority: 'P1', category: 'unit', sprint: 1 },
    { name: 'TC-28: Multilang Intent', file: 'suites/tc28-multilang-intent.js', priority: 'P1', category: 'unit', sprint: 1 },
    { name: 'TC-29: PDCA Modules', file: 'suites/tc29-pdca-modules.js', priority: 'P0', category: 'unit', sprint: 1 },
    { name: 'TC-30: Core Modules', file: 'suites/tc30-core-modules.js', priority: 'P1', category: 'unit', sprint: 1 },
    { name: 'TC-31: Team Modules', file: 'suites/tc31-team-modules.js', priority: 'P0', category: 'unit', sprint: 1 },
    { name: 'TC-32: Paths Registry', file: 'suites/tc32-paths-registry.js', priority: 'P1', category: 'unit', sprint: 1 },
    { name: 'TC-33: Task Modules', file: 'suites/tc33-task-modules.js', priority: 'P1', category: 'unit', sprint: 1 },
    { name: 'TC-34: Adapters Gemini', file: 'suites/tc34-adapters-gemini.js', priority: 'P1', category: 'unit', sprint: 1 },
    { name: 'TC-35: Adapters Common', file: 'suites/tc35-adapters-common.js', priority: 'P1', category: 'unit', sprint: 1 },
    { name: 'TC-36: Config Extension v1.5.8', file: 'suites/tc36-config-extension-v158.js', priority: 'P0', category: 'unit', sprint: 1 },
    { name: 'TC-37: Context Hierarchy', file: 'suites/tc37-context-hierarchy.js', priority: 'P1', category: 'unit', sprint: 1 },
    { name: 'TC-38: Feature Flags Matrix', file: 'suites/tc38-feature-flags-matrix.js', priority: 'P0', category: 'unit', sprint: 1 },

    // ═══ 관점 2: E2E Test (TC-39~TC-43) ═══
    { name: 'TC-39: PDCA E2E v1.5.8', file: 'suites/tc39-pdca-e2e-v158.js', priority: 'P0', category: 'e2e', sprint: 2 },
    { name: 'TC-40: Hook System E2E', file: 'suites/tc40-hook-system-e2e.js', priority: 'P0', category: 'e2e', sprint: 2 },
    { name: 'TC-41: Team Orchestration E2E', file: 'suites/tc41-team-orchestration-e2e.js', priority: 'P0', category: 'e2e', sprint: 2 },
    { name: 'TC-42: Skill Activation E2E', file: 'suites/tc42-skill-activation-e2e.js', priority: 'P1', category: 'e2e', sprint: 2 },
    { name: 'TC-43: MCP Command E2E', file: 'suites/tc43-mcp-command-e2e.js', priority: 'P1', category: 'e2e', sprint: 2 },

    // ═══ 관점 3: Integration (TC-44~TC-49) ═══
    { name: 'TC-44: Agent Integration v1.5.8', file: 'suites/tc44-agent-integration-v158.js', priority: 'P1', category: 'integration', sprint: 2 },
    { name: 'TC-45: Skill Integration v1.5.8', file: 'suites/tc45-skill-integration-v158.js', priority: 'P1', category: 'integration', sprint: 2 },
    { name: 'TC-46: Context Engineering', file: 'suites/tc46-context-engineering.js', priority: 'P1', category: 'integration', sprint: 2 },
    { name: 'TC-47: Config Interop', file: 'suites/tc47-config-interop.js', priority: 'P1', category: 'integration', sprint: 2 },
    { name: 'TC-48: Command Integration', file: 'suites/tc48-command-integration.js', priority: 'P1', category: 'integration', sprint: 2 },
    { name: 'TC-49: Hook-Lib-Config Chain', file: 'suites/tc49-hook-lib-config-chain.js', priority: 'P1', category: 'integration', sprint: 2 },

    // ═══ 관점 4: Scenario (TC-50~TC-54) ═══
    { name: 'TC-50: Scenario Starter', file: 'suites/tc50-scenario-starter.js', priority: 'P1', category: 'scenario', sprint: 3 },
    { name: 'TC-51: Scenario Dynamic', file: 'suites/tc51-scenario-dynamic.js', priority: 'P1', category: 'scenario', sprint: 3 },
    { name: 'TC-52: Scenario Enterprise', file: 'suites/tc52-scenario-enterprise.js', priority: 'P1', category: 'scenario', sprint: 3 },
    { name: 'TC-53: Scenario PM Workflow', file: 'suites/tc53-scenario-pm-workflow.js', priority: 'P1', category: 'scenario', sprint: 3 },
    { name: 'TC-54: Scenario Multilang', file: 'suites/tc54-scenario-multilang.js', priority: 'P2', category: 'scenario', sprint: 3 },

    // ═══ 관점 5: Philosophy (TC-55~TC-59) ═══
    { name: 'TC-55: Philosophy Context Eng', file: 'suites/tc55-philosophy-context-eng.js', priority: 'P1', category: 'philosophy', sprint: 3 },
    { name: 'TC-56: Philosophy PDCA', file: 'suites/tc56-philosophy-pdca.js', priority: 'P1', category: 'philosophy', sprint: 3 },
    { name: 'TC-57: Philosophy No Guessing', file: 'suites/tc57-philosophy-no-guessing.js', priority: 'P1', category: 'philosophy', sprint: 3 },
    { name: 'TC-58: Philosophy Disclosure', file: 'suites/tc58-philosophy-disclosure.js', priority: 'P2', category: 'philosophy', sprint: 3 },
    { name: 'TC-59: Philosophy AI-Native', file: 'suites/tc59-philosophy-ai-native.js', priority: 'P2', category: 'philosophy', sprint: 3 },

    // ═══ 관점 6: Security/Compatibility (TC-60~TC-63) ═══
    { name: 'TC-60: Security Sanitization', file: 'suites/tc60-security-sanitization.js', priority: 'P1', category: 'security', sprint: 4 },
    { name: 'TC-61: Security Version', file: 'suites/tc61-security-version.js', priority: 'P1', category: 'security', sprint: 4 },
    { name: 'TC-62: Security Permission', file: 'suites/tc62-security-permission.js', priority: 'P1', category: 'security', sprint: 4 },
    { name: 'TC-63: Compatibility Matrix', file: 'suites/tc63-compatibility-matrix.js', priority: 'P1', category: 'security', sprint: 4 },

    // ═══ 관점 7: Edge Cases (TC-64~TC-68) ═══
    { name: 'TC-64: Edge Null/Undefined', file: 'suites/tc64-edge-null-undefined.js', priority: 'P1', category: 'edge', sprint: 4 },
    { name: 'TC-65: Edge Empty/Malformed', file: 'suites/tc65-edge-empty-malformed.js', priority: 'P1', category: 'edge', sprint: 4 },
    { name: 'TC-66: Edge Unicode/Special', file: 'suites/tc66-edge-unicode-special.js', priority: 'P2', category: 'edge', sprint: 4 },
    { name: 'TC-67: Edge Concurrency', file: 'suites/tc67-edge-concurrency.js', priority: 'P2', category: 'edge', sprint: 4 },
    { name: 'TC-68: Edge Filesystem', file: 'suites/tc68-edge-filesystem.js', priority: 'P1', category: 'edge', sprint: 4 },

    // ═══ 관점 8: Boundary (TC-69~TC-71) ═══
    { name: 'TC-69: Boundary Version', file: 'suites/tc69-boundary-version.js', priority: 'P2', category: 'boundary', sprint: 4 },
    { name: 'TC-70: Boundary Config', file: 'suites/tc70-boundary-config.js', priority: 'P2', category: 'boundary', sprint: 4 },
    { name: 'TC-71: Boundary DataSize', file: 'suites/tc71-boundary-datasize.js', priority: 'P2', category: 'boundary', sprint: 4 },

    // ═══ 관점 9: Error Recovery (TC-72~TC-74) ═══
    { name: 'TC-72: Recovery File Corruption', file: 'suites/tc72-recovery-file-corruption.js', priority: 'P1', category: 'recovery', sprint: 4 },
    { name: 'TC-73: Recovery Module Missing', file: 'suites/tc73-recovery-module-missing.js', priority: 'P1', category: 'recovery', sprint: 4 },
    { name: 'TC-74: Recovery Cache State', file: 'suites/tc74-recovery-cache-state.js', priority: 'P1', category: 'recovery', sprint: 4 },

    // ═══ 관점 10: Infrastructure (TC-75~TC-78) ═══
    { name: 'TC-75: Output Styles', file: 'suites/tc75-output-styles.js', priority: 'P1', category: 'infra', sprint: 3 },
    { name: 'TC-76: Template System', file: 'suites/tc76-template-system.js', priority: 'P1', category: 'infra', sprint: 3 },
    { name: 'TC-77: Hook Scripts Individual', file: 'suites/tc77-hook-scripts-individual.js', priority: 'P1', category: 'infra', sprint: 3 },
    { name: 'TC-78: Hook Config Runtime', file: 'suites/tc78-hook-config-runtime.js', priority: 'P1', category: 'infra', sprint: 3 },
  ];

  const filtered = filterSuites(suites, opts);

  if (filtered.length !== suites.length) {
    console.log(`\nFiltered: ${filtered.length}/${suites.length} suites`);
    if (opts.priority) console.log(`  --priority ${opts.priority}`);
    if (opts.category) console.log(`  --category ${opts.category}`);
    if (opts.sprint) console.log(`  --sprint ${opts.sprint}`);
    if (opts.suite) console.log(`  --suite ${opts.suite}`);
  }

  let passed = 0, failed = 0, skipped = 0;
  for (const suite of filtered) {
    const result = await runSuite(suite);
    passed += result.passed;
    failed += result.failed;
    skipped += result.skipped;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Total: ${passed + failed + skipped} | Pass: ${passed} | Fail: ${failed} | Skip: ${skipped}`);
  console.log(`Pass Rate: ${(((passed || 0) / ((passed + failed + skipped) || 1)) * 100).toFixed(1)}%`);

  generatePDCACompletionReport(passed, failed, skipped);

  process.exit(failed > 0 ? 1 : 0);
}

function generatePDCACompletionReport(passed, failed, skipped) {
  const fs = require('fs');
  const path = require('path');
  const date = new Date().toISOString().split('T')[0];
  const reportPath = path.resolve(__dirname, '../docs/04-report/features/bkit-v158-comprehensive-test.report.md');

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });

  const total = passed + failed + skipped;
  const matchRate = (((passed || 0) / (total || 1)) * 100).toFixed(1);

  let report = `# bkit-gemini v1.5.8 Comprehensive Test Report

> **Feature**: bkit-v158-comprehensive-test
> **Status**: ${failed === 0 ? 'COMPLETED' : 'IN_PROGRESS'}
> **Match Rate**: ${matchRate}%
> **Date**: ${date}

## 1. Summary

| Category | Passed | Failed | Skipped | Status |
|----------|--------|--------|---------|--------|
| Total | ${passed} | ${failed} | ${skipped} | ${failed === 0 ? '✅' : '❌'} |

## 2. Test Execution Details

The test suite covered 78 categories including v1.5.8 Unit Tests, E2E, Integration,
Scenario, Philosophy, Security, Edge Cases, Boundary, Error Recovery, and Infrastructure.
A total of ${total} automated test cases were executed across 11 test perspectives.

---
*Generated by bkit PDCA Act Phase*
`;

  fs.writeFileSync(reportPath, report);
}

main();
