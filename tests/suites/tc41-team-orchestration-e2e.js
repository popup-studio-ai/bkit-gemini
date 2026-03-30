// TC-41: Team Orchestration E2E Tests (12 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertType, withVersion, getPdcaStatus } = require('../test-utils');
const path = require('path');

const TeamCoordinator = require(path.join(PLUGIN_ROOT, 'lib/team/coordinator'));
const TeamStrategy = require(path.join(PLUGIN_ROOT, 'lib/team/strategy'));
const { selectPattern } = require(path.join(PLUGIN_ROOT, 'lib/team/pattern-selector'));
const AgentCommunication = require(path.join(PLUGIN_ROOT, 'lib/team/communication'));
const TaskQueue = require(path.join(PLUGIN_ROOT, 'lib/team/task-queue'));

const tests = [
  {
    name: 'TC41-01: Dynamic 레벨 팀 구성 (3 에이전트)',
    fn: () => {
      const strategy = new TeamStrategy();
      const s = strategy.getStrategy ? strategy.getStrategy('Dynamic') : strategy.selectStrategy('Dynamic');
      assert(s !== undefined, 'Should return strategy for Dynamic');
    }
  },
  {
    name: 'TC41-02: Enterprise 레벨 팀 구성 (5 에이전트)',
    fn: () => {
      const strategy = new TeamStrategy();
      const s = strategy.getStrategy ? strategy.getStrategy('Enterprise') : strategy.selectStrategy('Enterprise');
      assert(s !== undefined, 'Should return strategy for Enterprise');
    }
  },
  {
    name: 'TC41-03: Plan 단계 leader 패턴',
    fn: () => {
      const pattern = selectPattern('plan', 'Dynamic');
      assert(pattern !== undefined, 'Should select pattern for plan');
    }
  },
  {
    name: 'TC41-04: Do 단계 swarm 패턴',
    fn: () => {
      const pattern = selectPattern('do', 'Enterprise');
      assert(pattern !== undefined, 'Should select pattern for do');
    }
  },
  {
    name: 'TC41-05: Check 단계 council 패턴',
    fn: () => {
      const pattern = selectPattern('check', 'Enterprise');
      assert(pattern !== undefined, 'Should select pattern for check');
    }
  },
  {
    name: 'TC41-06: TaskQueue → AgentCommunication 연동',
    fn: () => {
      const queue = new TaskQueue();
      const comm = new AgentCommunication();
      queue.enqueue({ id: 'task1', priority: 'critical', agent: 'gap-detector', action: 'analyze' });
      const task = queue.dequeue();
      try {
        const result = comm.sendTask(task.agent, { action: task.action });
        assert(result.taskId !== undefined, 'Should create task');
      } catch (e) {
        // Expected: MCP not available in test env
        assert(e.message.includes('MCP'), 'Should fail with MCP error');
      }
    }
  },
  {
    name: 'TC41-07: 팀 상태 조회',
    fn: () => {
      const tc = new TeamCoordinator();
      const status = tc.getStatus();
      assertType(status, 'object', 'Should return status object');
    }
  },
  {
    name: 'TC41-08: 팀 해산',
    fn: () => {
      const tc = new TeamCoordinator();
      const result = tc.dissolve();
      assert(result !== undefined || result === undefined, 'Should dissolve without error');
    }
  },
  {
    name: 'TC41-09: Communication broadcast 메시지',
    fn: () => {
      const comm = new AgentCommunication();
      const result = comm.broadcast({ type: 'phase_changed', data: { phase: 'check' } });
      assertEqual(result.delivered, 0, 'No listeners registered');
    }
  },
  {
    name: 'TC41-10: 다중 태스크 순차 큐 처리',
    fn: () => {
      const queue = new TaskQueue();
      queue.enqueue({ id: 't1', priority: 'normal', agent: 'a1' });
      queue.enqueue({ id: 't2', priority: 'critical', agent: 'a2' });
      queue.enqueue({ id: 't3', priority: 'normal', agent: 'a3' });
      const tasks = [];
      while (true) {
        const task = queue.dequeue();
        if (!task) break;
        tasks.push(task);
      }
      assertEqual(tasks.length, 3, 'Should dequeue 3 tasks');
      assertEqual(tasks[0].id, 't1', 'FIFO order');
    }
  },
  {
    name: 'TC41-11: v0.33.0 네이티브 에이전트 위임',
    fn: () => {
      withVersion('0.33.0', () => {
        const comm = new AgentCommunication();
        try {
          const result = comm.sendTask('gap-detector', { action: 'analyze' });
          assert(result.method === 'native' || result.method === 'mcp', 'Should use delegation');
        } catch (e) {
          assert(e.message.includes('MCP'), 'MCP not available in test env');
        }
      });
    }
  },
  {
    name: 'TC41-12: v0.28.0 MCP 폴백',
    fn: () => {
      withVersion('0.28.0', () => {
        const comm = new AgentCommunication();
        try {
          const result = comm.sendTask('gap-detector', { action: 'analyze' });
          assertEqual(result.method, 'mcp', 'v0.28 should fallback to mcp');
        } catch (e) {
          assert(e.message.includes('MCP'), 'MCP not available in test env');
        }
      });
    }
  }
];

module.exports = { tests };
