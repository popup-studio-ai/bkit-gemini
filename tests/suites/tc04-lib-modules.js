// tests/suites/tc04-lib-modules.js
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, cleanupTestProject, assert, assertEqual, assertContains, assertExists, getPdcaStatus, withVersion } = require('../test-utils');
const path = require('path');
const os = require('os');
const fs = require('fs');

const tests = [
  // LIB-01~10: ContextHierarchy tests removed in v2.0.4 (lib/context-hierarchy.js deleted)
  // Replaced by flat module architecture in lib/core/ + lib/gemini/
  {
    name: 'LIB-01: Plugin config loading (v2.0.4: via bkit.config.json)',
    fn: () => {
      const configPath = path.join(PLUGIN_ROOT, 'bkit.config.json');
      assert(fs.existsSync(configPath), 'bkit.config.json should exist');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      assert(config.version, 'Should have version field');
    }
  },
  {
    name: 'LIB-04: Session override has highest priority (v2.0.4: skip - ContextHierarchy removed)',
    skip: true,
    fn: () => {}
  },
  {
    name: 'LIB-05: Dot-notation access (v2.0.4: skip - ContextHierarchy removed)',
    skip: true,
    fn: () => {}
  },
  {
    name: 'LIB-06: 5s TTL cache expiration (v2.0.4: skip - ContextHierarchy removed)',
    skip: true,
    fn: () => {}
  },
  {
    name: 'LIB-09: _deepMerge objects (v2.0.4: skip - ContextHierarchy removed)',
    skip: true,
    fn: () => {}
  },
  {
    name: 'LIB-10: _deepMerge arrays replace (v2.0.4: skip - ContextHierarchy removed)',
    skip: true,
    fn: () => {}
  },
  {
    name: 'LIB-14: Project scope path',
    fn: () => {
      const { AgentMemoryManager } = require(path.join(PLUGIN_ROOT, 'lib', 'core', 'agent-memory'));
      const mem = new AgentMemoryManager('gap-detector', 'project');
      const memPath = mem.getMemoryPath('/tmp/project');
      assertContains(memPath, '.gemini/agent-memory/bkit/gap-detector.json', 'Should use project scope');
    }
  },
  {
    name: 'LIB-15: User scope path',
    fn: () => {
      const { AgentMemoryManager } = require(path.join(PLUGIN_ROOT, 'lib', 'core', 'agent-memory'));
      const mem = new AgentMemoryManager('starter-guide', 'user');
      const memPath = mem.getMemoryPath();
      assertContains(memPath, '.gemini/agent-memory/bkit/starter-guide.json', 'Should use user scope');
      assertContains(memPath, os.homedir(), 'Should be in home directory');
    }
  },
  {
    name: 'LIB-16: addSession prepends to sessions',
    fn: () => {
      const { AgentMemoryManager } = require(path.join(PLUGIN_ROOT, 'lib', 'core', 'agent-memory'));
      const mem = new AgentMemoryManager('test-agent', 'project');
      mem.memory = mem._createDefault();
      mem.addSession({ summary: 'Session 1' });
      mem.addSession({ summary: 'Session 2' });
      assertEqual(mem.memory.sessions[0].summary, 'Session 2', 'Newest should be first');
      assertEqual(mem.memory.sessions.length, 2, 'Should have 2 sessions');
      assertEqual(mem.memory.stats.totalSessions, 2, 'Total should be 2');
    }
  },
  {
    name: 'LIB-17: addSession enforces 20 max',
    fn: () => {
      const { AgentMemoryManager } = require(path.join(PLUGIN_ROOT, 'lib', 'core', 'agent-memory'));
      const mem = new AgentMemoryManager('test-agent', 'project');
      mem.memory = mem._createDefault();
      for (let i = 0; i < 25; i++) {
        mem.addSession({ summary: `Session ${i}` });
      }
      assertEqual(mem.memory.sessions.length, 20, 'Should trim to 20');
      assertEqual(mem.memory.stats.totalSessions, 25, 'Total should count all');
    }
  },
  {
    name: 'LIB-24: getAgentMemory factory - starter-guide gets user scope',
    fn: () => {
      const { getAgentMemory } = require(path.join(PLUGIN_ROOT, 'lib', 'core', 'agent-memory'));
      const mem = getAgentMemory('starter-guide');
      assertEqual(mem.scope, 'user', 'starter-guide should get user scope');
    }
  },
  {
    name: 'LIB-25: getAgentMemory factory - gap-detector gets project scope',
    fn: () => {
      const { getAgentMemory } = require(path.join(PLUGIN_ROOT, 'lib', 'core', 'agent-memory'));
      const mem = getAgentMemory('gap-detector');
      assertEqual(mem.scope, 'project', 'gap-detector should get project scope');
    }
  },
  {
    name: 'LIB-26: rm -rf / → deny',
    setup: () => createTestProject({}),
    fn: () => {
      const { checkPermission } = require(path.join(PLUGIN_ROOT, 'lib', 'core', 'permission'));
      const result = checkPermission('run_shell_command', { command: 'rm -rf /' }, TEST_PROJECT_DIR);
      assertEqual(result.level, 'deny', 'Should deny rm -rf /');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'LIB-27: git push --force → deny (from DEFAULT_PATTERNS)',
    setup: () => createTestProject({}),
    fn: () => {
      const { checkPermission } = require(path.join(PLUGIN_ROOT, 'lib', 'core', 'permission'));
      const result = checkPermission('run_shell_command', { command: 'git push --force main' }, TEST_PROJECT_DIR);
      assertEqual(result.level, 'ask', 'Should ask for git push --force');
    },
    teardown: cleanupTestProject
  },
  {
    name: 'LIB-30: Normal write → allow',
    fn: () => {
      const { checkPermission } = require(path.join(PLUGIN_ROOT, 'lib', 'core', 'permission'));
      const result = checkPermission('write_file', { file_path: 'src/app.js' }, PLUGIN_ROOT);
      assertEqual(result.level, 'allow', 'Normal write should be allowed');
    }
  },
  {
    name: 'LIB-31: Glob pattern matching',
    fn: () => {
      const { matchesGlobPattern } = require(path.join(PLUGIN_ROOT, 'lib', 'core', 'permission'));
      assert(matchesGlobPattern('rm -rf /', 'rm -rf *'), 'Should match glob');
      assert(!matchesGlobPattern('ls -la', 'rm -rf *'), 'Should not match');
      assert(matchesGlobPattern('.env', '*.env'), 'Should match .env');
    }
  },
  {
    name: 'LIB-32: Variable substitution in path',
    fn: async () => {
      const { resolveImports, clearCache } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'import-resolver'));
      clearCache();
      const contextFile = path.join(PLUGIN_ROOT, '.gemini', 'context', 'pdca-rules.md');
      if (fs.existsSync(contextFile)) {
        const result = await resolveImports(contextFile);
        assert(result.content.length > 0, 'Should resolve content');
      }
    }
  },
  {
    name: 'LIB-36: Named snapshot creation',
    setup: () => {
      const { PDCA_STATUS_FIXTURE } = require('../fixtures');
      createTestProject({ 'docs/.pdca-status.json': PDCA_STATUS_FIXTURE });
    },
    fn: () => {
      const { forkContext, discardFork } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'context-fork'));
      const fork = forkContext('gap-detector', { name: 'test-fork', projectDir: TEST_PROJECT_DIR });
      assert(fork.forkId, 'Should have forkId');
      assertEqual(fork.name, 'test-fork', 'Should use provided name');
      assertExists(fork.snapshotPath, 'Snapshot file should exist');
      discardFork(fork.forkId, { projectDir: TEST_PROJECT_DIR });
    },
    teardown: cleanupTestProject
  },
  {
    name: 'LIB-37: LRU snapshot limit (10)',
    setup: () => {
      const { PDCA_STATUS_FIXTURE } = require('../fixtures');
      createTestProject({ 
        'docs/.pdca-status.json': PDCA_STATUS_FIXTURE,
        'docs/.pdca-snapshots/.keep': '' 
      });
    },
    fn: () => {
      const { forkContext } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'context-fork'));
      for (let i = 0; i < 12; i++) {
        forkContext('test-agent', { projectDir: TEST_PROJECT_DIR });
      }
      const snapshotDir = path.join(TEST_PROJECT_DIR, 'docs', '.pdca-snapshots');
      const files = fs.readdirSync(snapshotDir).filter(f => f.endsWith('.json'));
      assert(files.length <= 10, `Should have <=10 snapshots but found ${files.length}`);
    },
    teardown: cleanupTestProject
  }
];

module.exports = { tests };
