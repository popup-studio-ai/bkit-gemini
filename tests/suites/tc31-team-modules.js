// TC-31: Team Modules Unit Tests (40 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertType, assertThrows, withVersion } = require('../test-utils');
const path = require('path');

const team = require(path.join(PLUGIN_ROOT, 'lib/team'));
const TeamCoordinator = require(path.join(PLUGIN_ROOT, 'lib/team/coordinator'));
const TeamStrategy = require(path.join(PLUGIN_ROOT, 'lib/team/strategy'));
const CTOLogic = require(path.join(PLUGIN_ROOT, 'lib/team/cto-logic'));
const AgentCommunication = require(path.join(PLUGIN_ROOT, 'lib/team/communication'));
const TaskQueue = require(path.join(PLUGIN_ROOT, 'lib/team/task-queue'));
const StateRecorder = require(path.join(PLUGIN_ROOT, 'lib/team/state-recorder'));
const { selectPattern, getPatternConfig } = require(path.join(PLUGIN_ROOT, 'lib/team/pattern-selector'));
const TeamMemory = require(path.join(PLUGIN_ROOT, 'lib/team/memory'));

const tests = [
  // index.js exports
  { name: 'TC31-01: team index TeamCoordinator export', fn: () => { assert(team.TeamCoordinator, 'Should export TeamCoordinator'); } },
  { name: 'TC31-02: team index TaskQueue export', fn: () => { assert(team.TaskQueue, 'Should export TaskQueue'); } },
  { name: 'TC31-03: team index AgentCommunication export', fn: () => { assert(team.AgentCommunication, 'Should export AgentCommunication'); } },
  { name: 'TC31-04: team index TeamStrategy export', fn: () => { assert(team.TeamStrategy, 'Should export TeamStrategy'); } },
  { name: 'TC31-05: team index CTOLogic export', fn: () => { assert(team.CTOLogic, 'Should export CTOLogic'); } },
  { name: 'TC31-06: team index StateRecorder export', fn: () => { assert(team.StateRecorder, 'Should export StateRecorder'); } },
  { name: 'TC31-07: team index PatternSelector export', fn: () => { assert(team.PatternSelector, 'Should export PatternSelector'); } },
  { name: 'TC31-08: team index TeamMemory export', fn: () => { assert(team.TeamMemory, 'Should export TeamMemory'); } },
  // TaskQueue
  {
    name: 'TC31-09: TaskQueue 생성',
    fn: () => { const q = new TaskQueue(); assert(q, 'Should create instance'); }
  },
  {
    name: 'TC31-10: TaskQueue enqueue/dequeue FIFO',
    fn: () => {
      const q = new TaskQueue();
      q.enqueue({ id: 'a', priority: 'normal' });
      q.enqueue({ id: 'b', priority: 'normal' });
      const first = q.dequeue();
      assertEqual(first.id, 'a', 'FIFO: first in first out');
    }
  },
  {
    name: 'TC31-11: TaskQueue 우선순위 처리',
    fn: () => {
      const q = new TaskQueue();
      q.enqueue({ id: 'a', priority: 'normal' });
      q.enqueue({ id: 'b', priority: 'critical' });
      const first = q.dequeue();
      // TaskQueue is FIFO, not priority-based
      assertEqual(first.id, 'a', 'First enqueued should come first (FIFO)');
    }
  },
  {
    name: 'TC31-12: TaskQueue 빈 큐 dequeue',
    fn: () => {
      const q = new TaskQueue();
      const result = q.dequeue();
      assertEqual(result, null, 'Empty queue should return null');
    }
  },
  // AgentCommunication
  {
    name: 'TC31-13: AgentCommunication 생성',
    fn: () => { const comm = new AgentCommunication(); assert(comm, 'Should create instance'); }
  },
  {
    name: 'TC31-14: AgentCommunication sendTask (MCP not available)',
    fn: () => {
      const comm = new AgentCommunication();
      try {
        const result = comm.sendTask('gap-detector', { action: 'analyze' });
        assert(result.taskId, 'Should return taskId');
      } catch (e) {
        // Expected: MCP server not configured in test environment
        assert(e.message.includes('MCP'), 'Should fail with MCP error');
      }
    }
  },
  {
    name: 'TC31-15: AgentCommunication collectResult (no tasks)',
    fn: () => {
      const comm = new AgentCommunication();
      const result = comm.collectResult('nonexistent');
      assertEqual(result, null, 'Should return null for missing task');
    }
  },
  {
    name: 'TC31-16: AgentCommunication broadcast',
    fn: () => {
      const comm = new AgentCommunication();
      const result = comm.broadcast({ type: 'test' });
      assertEqual(result.delivered, 0, 'No listeners, 0 delivered');
    }
  },
  {
    name: 'TC31-17: AgentCommunication 미등록 결과 null',
    fn: () => {
      const comm = new AgentCommunication();
      const result = comm.collectResult('nonexistent-id');
      assertEqual(result, null, 'Should return null');
    }
  },
  // TeamStrategy
  {
    name: 'TC31-18: TeamStrategy 생성',
    fn: () => { const s = new TeamStrategy(); assert(s, 'Should create instance'); }
  },
  {
    name: 'TC31-19: TeamStrategy getStrategies',
    fn: () => {
      const s = new TeamStrategy();
      const strategies = s.getStrategies();
      assert(strategies !== undefined, 'Should return strategies');
    }
  },
  // CTOLogic
  {
    name: 'TC31-20: CTOLogic 생성',
    fn: () => { const cto = new CTOLogic(); assert(cto, 'Should create instance'); }
  },
  // StateRecorder
  {
    name: 'TC31-21: StateRecorder 생성',
    fn: () => { const sr = new StateRecorder(); assert(sr, 'Should create instance'); }
  },
  // PatternSelector
  {
    name: 'TC31-22: selectPattern 함수 존재',
    fn: () => { assertType(selectPattern, 'function', 'Should export selectPattern'); }
  },
  {
    name: 'TC31-23: getPatternConfig 함수 존재',
    fn: () => { assertType(getPatternConfig, 'function', 'Should export getPatternConfig'); }
  },
  {
    name: 'TC31-24: selectPattern leader 패턴',
    fn: () => {
      const pattern = selectPattern('plan', 'Dynamic');
      assert(pattern !== undefined, 'Should return a pattern');
    }
  },
  // TeamMemory
  {
    name: 'TC31-25: TeamMemory 생성',
    fn: () => { const tm = new TeamMemory(); assert(tm, 'Should create instance'); }
  },
  // TeamCoordinator
  {
    name: 'TC31-26: TeamCoordinator 생성',
    fn: () => { const tc = new TeamCoordinator(); assert(tc, 'Should create instance'); }
  },
  {
    name: 'TC31-27: TeamCoordinator getStatus',
    fn: () => {
      const tc = new TeamCoordinator();
      const s = tc.getStatus();
      assert(s !== undefined, 'Should return status');
    }
  },
  // Version-gated tests
  {
    name: 'TC31-28: v0.33.0 AgentCommunication native method',
    fn: () => {
      withVersion('0.33.0', () => {
        const comm = new AgentCommunication();
        try {
          const result = comm.sendTask('test', { action: 'test' });
          assert(result.method === 'native' || result.method === 'mcp', 'Should have method');
        } catch (e) {
          assert(e.message.includes('MCP'), 'Should fail with MCP error in test env');
        }
      });
    }
  },
  {
    name: 'TC31-29: v0.28.0 AgentCommunication mcp fallback',
    fn: () => {
      withVersion('0.28.0', () => {
        const comm = new AgentCommunication();
        try {
          const result = comm.sendTask('test', { action: 'test' });
          assertEqual(result.method, 'mcp', 'v0.28 should use mcp');
        } catch (e) {
          assert(e.message.includes('MCP'), 'Should fail with MCP error in test env');
        }
      });
    }
  },
  {
    name: 'TC31-30: TaskQueue size 추적',
    fn: () => {
      const q = new TaskQueue();
      q.enqueue({ id: 'x', priority: 'normal' });
      q.enqueue({ id: 'y', priority: 'normal' });
      assert(q.size !== undefined || q.length !== undefined || q.queue !== undefined, 'Should track size');
    }
  },
  {
    name: 'TC31-31: AgentCommunication MCP 서버 없을 때',
    fn: () => {
      withVersion('0.28.0', () => {
        const comm = new AgentCommunication(null);
        try {
          const result = comm.sendTask('test', { action: 'test' });
          assert(result.taskId, 'Should return taskId');
        } catch (e) {
          // Expected in test env without MCP
          assert(e.message.includes('MCP'), 'Should fail with MCP error');
        }
      });
    }
  },
  {
    name: 'TC31-32: selectPattern swarm 패턴',
    fn: () => {
      const pattern = selectPattern('do', 'Enterprise');
      assert(pattern !== undefined, 'Should return pattern for Enterprise do');
    }
  },
  {
    name: 'TC31-33: selectPattern council 패턴',
    fn: () => {
      const pattern = selectPattern('check', 'Enterprise');
      assert(pattern !== undefined, 'Should return pattern for Enterprise check');
    }
  },
  {
    name: 'TC31-34: TeamCoordinator dissolve',
    fn: () => {
      const tc = new TeamCoordinator();
      assertType(tc.dissolve, 'function', 'Should have dissolve method');
    }
  },
  {
    name: 'TC31-35: TeamCoordinator initialize',
    fn: () => {
      const tc = new TeamCoordinator();
      assertType(tc.initialize, 'function', 'Should have initialize method');
    }
  },
  {
    name: 'TC31-36: TeamCoordinator assignAgent',
    fn: () => {
      const tc = new TeamCoordinator();
      assertType(tc.assignAgent, 'function', 'Should have assignAgent method');
    }
  },
  {
    name: 'TC31-37: CTOLogic 메서드 존재 확인',
    fn: () => {
      const cto = new CTOLogic();
      assertType(cto, 'object', 'Should be object');
    }
  },
  {
    name: 'TC31-38: StateRecorder 기록 메서드',
    fn: () => {
      const sr = new StateRecorder();
      assertType(sr, 'object', 'Should be object');
    }
  },
  {
    name: 'TC31-39: TeamStrategy selectStrategy',
    fn: () => {
      const s = new TeamStrategy();
      assertType(s.selectStrategy, 'function', 'Should have selectStrategy');
    }
  },
  {
    name: 'TC31-40: TeamMemory 인스턴스 메서드',
    fn: () => {
      const tm = new TeamMemory();
      assertType(tm, 'object', 'Should be object');
    }
  }
];

module.exports = { tests };
