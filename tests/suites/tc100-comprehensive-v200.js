// tests/suites/tc100-comprehensive-v200.js
// TC-100: Comprehensive v2.0 Testing - Various Perspectives
const { PLUGIN_ROOT, assert, assertEqual, assertContains, assertType, withVersion, createTestProject, cleanupTestProject, getPdcaStatus } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const tests = [
  // ─── Perspective 1: Multilingual Triggers (Korean/Japanese) ───

  // v2.0.7-S6 (Sprint v2.0.7-baseline-full-recovery):
  // COMP-01~03 are intentionally skipped — the underlying APIs were either
  // moved or replaced by v2.0.x:
  //   - sessionStart.detectAgentFromInput   → S3 agent-dispatch.js (8-lang matcher)
  //                                            Korean/Japanese natural-language
  //                                            dispatch is now handled by
  //                                            lib/gemini/agent-dispatch.js +
  //                                            hooks/scripts/before-model.js.
  //   - tracker.addTask                     → Gemini CLI native task tracker
  //                                            (lib/gemini/tracker.js no longer
  //                                            exposes a direct addTask API).
  // For multilingual dispatch coverage see tests/regression/agent-dispatch/
  // full-matrix.test.js (21 agents × 8 languages = 168 cases).
  {
    name: 'COMP-01: Korean trigger activates gap-detector (SKIP — replaced by S3 agent-dispatch full-matrix)',
    skip: true,
    fn: () => {}
  },
  {
    name: 'COMP-02: Japanese trigger activates pdca-iterator (SKIP — replaced by S3 agent-dispatch full-matrix)',
    skip: true,
    fn: () => {}
  },
  {
    name: 'COMP-03: Tracker handles 1000 tasks (SKIP — delegated to Gemini CLI native task tracker)',
    skip: true,
    fn: () => {}
  },

  // ─── Perspective 3: Edge Case (Context Fork) ───

  {
    name: 'COMP-04: Context Fork handles deep nesting (10 levels)',
    fn: () => {
      const fork = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'context-fork'));
      let context = { name: 'root', children: [] };
      let current = context;
      for (let i = 0; i < 10; i++) {
        const next = { name: `level-${i}`, children: [] };
        current.children.push(next);
        current = next;
      }

      const result = fork.forkContext(context);
      assert(result !== context, 'Fork should return new object');
      assertEqual(result.name, 'root', 'Root name should match');
      // Verify depth
      let depth = 0;
      let check = result;
      while (check.children && check.children.length > 0) {
        depth++;
        check = check.children[0];
      }
      assertEqual(depth, 10, 'Fork should preserve 10 levels of nesting');
    }
  },

  // ─── Perspective 4: Agent Safety Tiers (Full Inventory) ───

  {
    name: 'COMP-05: All 21 agents have assigned safety tiers in bkit-server',
    fn: () => {
      const spawnAgentSrc = fs.readFileSync(path.join(PLUGIN_ROOT, 'mcp', 'bkit-server.js'), 'utf-8');
      const agentFiles = fs.readdirSync(path.join(PLUGIN_ROOT, 'agents')).filter(f => f.endsWith('.md'));

      for (const file of agentFiles) {
        const agentName = path.basename(file, '.md');
        // Check if agentName is in the AGENTS mapping in bkit-server.js
        assert(spawnAgentSrc.includes(`'${agentName}'`), `Agent ${agentName} should be registered in bkit-server.js`);
      }
    }
  },

  // ─── Perspective 5: Phase-Aware Context Verification ───

  // v2.0.7-S6: COMP-06/07 — sessionStart.getContextFilesForPhase was replaced
  // by Phase-Aware Context Loading via GEMINI.md @-imports (see context/*.md
  // files referenced by GEMINI.md and the Phase-Aware Context table in
  // docs/reference/architecture.md). The hook no longer exposes a direct
  // per-phase file-list API.
  {
    name: 'COMP-06: session-start phase context for PLAN (SKIP — replaced by GEMINI.md @-import)',
    skip: true,
    fn: () => {}
  },
  {
    name: 'COMP-07: session-start phase context for DO (SKIP — replaced by GEMINI.md @-import)',
    skip: true,
    fn: () => {}
  }
];

module.exports = { tests };
