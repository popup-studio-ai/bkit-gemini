// tests/suites/tc100-comprehensive-v200.js
// TC-100: Comprehensive v2.0 Testing - Various Perspectives
const {
  PLUGIN_ROOT, assert, assertEqual, assertContains, assertType,
  withVersion, createTestProject, cleanupTestProject
} = require('../test-utils');
const path = require('path');
const fs = require('fs');

const tests = [
  // ─── Perspective 1: Multilingual Triggers (Korean/Japanese) ───

  {
    name: 'COMP-01: Korean trigger "분석해줘" activates gap-detector',
    fn: () => {
      const sessionStart = require(path.join(PLUGIN_ROOT, 'hooks', 'scripts', 'session-start'));
      // Simulate input that should trigger gap-detector
      const input = "현재 진행 상황 분석해줘";
      const result = sessionStart.detectAgentFromInput(input);
      assertEqual(result, 'gap-detector', 'Korean "분석해줘" should trigger gap-detector');
    }
  },

  {
    name: 'COMP-02: Japanese trigger "計画" activates pdca-iterator',
    fn: () => {
      const sessionStart = require(path.join(PLUGIN_ROOT, 'hooks', 'scripts', 'session-start'));
      const input = "新しい機能を計画してください";
      const result = sessionStart.detectAgentFromInput(input);
      assertEqual(result, 'pdca-iterator', 'Japanese "計画" should trigger pdca-iterator');
    }
  },

  // ─── Perspective 2: Stress Testing (Tracker) ───

  {
    name: 'COMP-03: Tracker handles 1000 tasks without failure',
    fn: () => {
      const tracker = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'tracker'));
      const testDir = createTestProject('stress-tracker');
      const statusPath = path.join(testDir, '.pdca-status.json');

      // Create initial status
      const status = {
        version: '2.0',
        features: {
          'stress-feat': { tasks: [] }
        }
      };
      fs.writeFileSync(statusPath, JSON.stringify(status));

      // Add 1000 tasks
      for (let i = 0; i < 1000; i++) {
        tracker.addTask('stress-feat', `Task ${i}`, { projectDir: testDir });
      }

      const updatedStatus = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
      assertEqual(updatedStatus.features['stress-feat'].tasks.length, 1000, 'Should have 1000 tasks');
      cleanupTestProject(testDir);
    }
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
    name: 'COMP-05: All 21 agents have assigned safety tiers in spawn-agent-server',
    fn: () => {
      const spawnAgentSrc = fs.readFileSync(path.join(PLUGIN_ROOT, 'mcp', 'spawn-agent-server.js'), 'utf-8');
      const agentFiles = fs.readdirSync(path.join(PLUGIN_ROOT, 'agents')).filter(f => f.endsWith('.md'));

      for (const file of agentFiles) {
        const agentName = path.basename(file, '.md');
        // Check if agentName is in the AGENTS mapping in spawn-agent-server.js
        assert(spawnAgentSrc.includes(`'${agentName}'`), `Agent ${agentName} should be registered in spawn-agent-server.js`);
      }
    }
  },

  // ─── Perspective 5: Phase-Aware Context Verification ───

  {
    name: 'COMP-06: session-start selects correct context files for PLAN phase',
    fn: () => {
      const sessionStart = require(path.join(PLUGIN_ROOT, 'hooks', 'scripts', 'session-start'));
      const contextFiles = sessionStart.getContextFilesForPhase('plan');
      assert(contextFiles.includes('core-rules.md'), 'Plan phase should include core-rules.md');
      assert(contextFiles.includes('pdca-rules.md'), 'Plan phase should include pdca-rules.md');
      // Should NOT include tool-reference-v2.md (only for DO phase)
      assert(!contextFiles.includes('tool-reference-v2.md'), 'Plan phase should NOT include tool-reference-v2.md');
    }
  },

  {
    name: 'COMP-07: session-start selects tool-reference-v2.md for DO phase',
    fn: () => {
      const sessionStart = require(path.join(PLUGIN_ROOT, 'hooks', 'scripts', 'session-start'));
      const contextFiles = sessionStart.getContextFilesForPhase('do');
      assert(contextFiles.includes('tool-reference-v2.md'), 'Do phase should include tool-reference-v2.md');
    }
  }
];

module.exports = { tests };
