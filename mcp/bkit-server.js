#!/usr/bin/env node
/**
 * bkit Unified MCP Server
 * Combines spawn_agent orchestration with PM, QA, iteration, audit, and checkpoint tools.
 *
 * Preserves ALL existing spawn-agent-server.js functionality:
 * - AGENTS registry (all 21 agents)
 * - spawn_agent, list_agents, get_agent_info tools
 * - team_create, team_assign, team_status tools
 * - Safety tiers (READONLY, DOCWRITE, FULL)
 * - Model resolver integration
 *
 * Adds 6 new tools:
 * - bkit_pm_run: PM analysis pipeline
 * - bkit_qa_run: QA test execution
 * - bkit_iterate: Gap analysis with iteration tracking
 * - bkit_team_run: Team workflow coordination
 * - bkit_audit_query: Audit trail search
 * - bkit_checkpoint: Checkpoint CRUD
 */
'use strict';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Extension path
const extensionPath = path.resolve(__dirname, '..');
const { resolveModel } = require(path.join(extensionPath, 'lib', 'gemini', 'model-resolver'));

// Internal tool modules
const pmPipeline = require('./tools/pm-pipeline');
const qaRunner = require('./tools/qa-runner');
const gapAnalyzer = require('./tools/gap-analyzer');
const auditStore = require('./tools/audit-store');
const checkpointManager = require('./tools/checkpoint-manager');

// ---------------------------------------------------------------------------
// Safety Tiers (from original spawn-agent-server.js)
// ---------------------------------------------------------------------------

const SAFETY_TIERS = Object.freeze({
  READONLY: 0,
  DOCWRITE: 1,
  FULL: 2
});

// ---------------------------------------------------------------------------
// Agent Registry (all 21 agents from original)
// ---------------------------------------------------------------------------

const AGENTS = {
  'gap-detector': {
    file: 'gap-detector.md',
    description: 'Detect gaps between design documents and implementation',
    recommendedModel: 'pro',
    safetyTier: SAFETY_TIERS.READONLY
  },
  'design-validator': {
    file: 'design-validator.md',
    description: 'Validate design document completeness and consistency',
    recommendedModel: 'pro',
    safetyTier: SAFETY_TIERS.READONLY
  },
  'pdca-iterator': {
    file: 'pdca-iterator.md',
    description: 'Auto-iterate through evaluation and improvement cycles',
    recommendedModel: 'flash',
    safetyTier: SAFETY_TIERS.FULL
  },
  'code-analyzer': {
    file: 'code-analyzer.md',
    description: 'Analyze code quality, security, and architecture compliance',
    recommendedModel: 'pro',
    safetyTier: SAFETY_TIERS.READONLY
  },
  'report-generator': {
    file: 'report-generator.md',
    description: 'Generate PDCA completion reports',
    recommendedModel: 'flash-lite',
    safetyTier: SAFETY_TIERS.DOCWRITE
  },
  'qa-monitor': {
    file: 'qa-monitor.md',
    description: 'Zero Script QA via Docker log monitoring',
    recommendedModel: 'flash-lite',
    safetyTier: SAFETY_TIERS.READONLY
  },
  'starter-guide': {
    file: 'starter-guide.md',
    description: 'Beginner-friendly guidance for new developers',
    recommendedModel: 'flash',
    safetyTier: SAFETY_TIERS.READONLY
  },
  'pipeline-guide': {
    file: 'pipeline-guide.md',
    description: '9-phase development pipeline guidance',
    recommendedModel: 'flash',
    safetyTier: SAFETY_TIERS.READONLY
  },
  'bkend-expert': {
    file: 'bkend-expert.md',
    description: 'bkend.ai BaaS integration expert',
    recommendedModel: 'flash',
    safetyTier: SAFETY_TIERS.READONLY
  },
  'enterprise-expert': {
    file: 'enterprise-expert.md',
    description: 'Enterprise architecture and AI-Native patterns',
    recommendedModel: 'pro',
    safetyTier: SAFETY_TIERS.READONLY
  },
  'infra-architect': {
    file: 'infra-architect.md',
    description: 'AWS, Kubernetes, Terraform infrastructure design',
    recommendedModel: 'pro',
    safetyTier: SAFETY_TIERS.DOCWRITE
  },
  'cto-lead': {
    file: 'cto-lead.md',
    description: 'CTO-level orchestrator, PDCA workflow management, team composition',
    recommendedModel: 'pro',
    safetyTier: SAFETY_TIERS.FULL
  },
  'frontend-architect': {
    file: 'frontend-architect.md',
    description: 'UI/UX architecture, component design, design system expert',
    recommendedModel: 'pro',
    safetyTier: SAFETY_TIERS.DOCWRITE
  },
  'security-architect': {
    file: 'security-architect.md',
    description: 'Vulnerability analysis, auth design, OWASP compliance (read-only)',
    recommendedModel: 'pro',
    safetyTier: SAFETY_TIERS.READONLY
  },
  'product-manager': {
    file: 'product-manager.md',
    description: 'Requirements analysis, feature specs, user stories, product roadmap',
    recommendedModel: 'flash',
    safetyTier: SAFETY_TIERS.DOCWRITE
  },
  'qa-strategist': {
    file: 'qa-strategist.md',
    description: 'Test strategy, quality metrics, verification coordination',
    recommendedModel: 'pro',
    safetyTier: SAFETY_TIERS.READONLY
  },
  // PM Agent Team (added in v2.0.5 — were present in agents/ but missing from
  // this constant, so list_agents returned 16 instead of 21).
  'pm-lead': {
    file: 'pm-lead.md',
    description: 'PM Team Lead — orchestrates pm-discovery/strategy/research/prd workflow',
    recommendedModel: 'pro',
    safetyTier: SAFETY_TIERS.DOCWRITE
  },
  'pm-discovery': {
    file: 'pm-discovery.md',
    description: 'Opportunity Solution Tree (Teresa Torres) discovery analysis',
    recommendedModel: 'pro',
    safetyTier: SAFETY_TIERS.READONLY
  },
  'pm-strategy': {
    file: 'pm-strategy.md',
    description: 'Value Proposition (JTBD 6-Part) + Lean Canvas product strategy',
    recommendedModel: 'pro',
    safetyTier: SAFETY_TIERS.READONLY
  },
  'pm-research': {
    file: 'pm-research.md',
    description: 'User Personas, Competitor Analysis, TAM/SAM/SOM market sizing',
    recommendedModel: 'pro',
    safetyTier: SAFETY_TIERS.READONLY
  },
  'pm-prd': {
    file: 'pm-prd.md',
    description: 'PRD synthesis — Beachhead Segment + GTM Strategy + 8-section PRD',
    recommendedModel: 'pro',
    safetyTier: SAFETY_TIERS.DOCWRITE
  }
};

// ---------------------------------------------------------------------------
// BkitServer - Unified MCP Server
// ---------------------------------------------------------------------------

class BkitServer {
  constructor() {
    this.buffer = '';
    this.requestId = 0;
    this.iterationState = new Map(); // bkit_iterate state tracking
  }

  /**
   * Start the server (stdio transport)
   */
  async run() {
    process.stdin.setEncoding('utf-8');

    process.stdin.on('data', (chunk) => {
      this.buffer += chunk;
      this.processBuffer();
    });

    process.stdin.on('end', () => {
      if (this.buffer.trim()) {
        this.handleMessage(this.buffer);
        this.buffer = '';
      }
      process.exit(0);
    });

    console.error('bkit MCP server started (unified)');
  }

  /**
   * Process incoming buffer for complete JSON-RPC messages
   */
  processBuffer() {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        this.handleMessage(line);
      }
    }
  }

  /**
   * Handle a single JSON-RPC message
   */
  handleMessage(message) {
    try {
      const request = JSON.parse(message);
      this.handleRequest(request);
    } catch (error) {
      console.error('Failed to parse message:', error.message);
    }
  }

  /**
   * Handle JSON-RPC request
   */
  async handleRequest(request) {
    const { id, method, params } = request;

    // Notifications (no id) should not receive a response
    if (id === undefined || id === null) {
      // Silently handle known notifications
      // notifications/initialized, notifications/cancelled, etc.
      return;
    }

    try {
      let result;

      switch (method) {
        case 'initialize':
          result = this.handleInitialize(params);
          break;
        case 'tools/list':
          result = this.handleToolsList();
          break;
        case 'tools/call':
          result = await this.handleToolsCall(params);
          break;
        case 'shutdown':
          result = {};
          break;
        default:
          throw new Error(`Unknown method: ${method}`);
      }

      this.sendResponse(id, result);
    } catch (error) {
      this.sendError(id, error.message);
    }
  }

  /**
   * Send JSON-RPC response
   */
  sendResponse(id, result) {
    const response = { jsonrpc: '2.0', id, result };
    console.log(JSON.stringify(response));
  }

  /**
   * Send JSON-RPC error
   */
  sendError(id, message) {
    const response = {
      jsonrpc: '2.0',
      id,
      error: { code: -32000, message }
    };
    console.log(JSON.stringify(response));
  }

  // =========================================================================
  // Protocol handlers
  // =========================================================================

  handleInitialize(params) {
    return {
      protocolVersion: '2024-11-05',
      serverInfo: { name: 'bkit', version: '2.0.4' },
      capabilities: { tools: { listChanged: true } }
    };
  }

  handleToolsList() {
    return { tools: this._defineTools() };
  }

  _defineTools() {
    return [
      // --- Original tools (from spawn-agent-server.js) ---
      {
        name: 'spawn_agent',
        description: 'Spawn a specialized bkit agent to handle a task. The agent runs in isolation and returns results.',
        inputSchema: {
          type: 'object',
          properties: {
            agent_name: {
              type: 'string',
              description: 'Name of the agent to spawn',
              enum: Object.keys(AGENTS)
            },
            task: {
              type: 'string',
              description: 'Task description for the agent to execute'
            },
            context: {
              type: 'object',
              description: 'Additional context data to pass to the agent',
              additionalProperties: true
            },
            timeout: {
              type: 'number',
              description: 'Timeout in milliseconds (default: 300000 = 5 minutes)',
              default: 300000
            }
          },
          required: ['agent_name', 'task']
        }
      },
      {
        name: 'list_agents',
        description: 'List all available bkit agents with their descriptions',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'get_agent_info',
        description: 'Get detailed information about a specific agent',
        inputSchema: {
          type: 'object',
          properties: {
            agent_name: {
              type: 'string',
              description: 'Name of the agent',
              enum: Object.keys(AGENTS)
            }
          },
          required: ['agent_name']
        }
      },
      {
        name: 'team_create',
        description: 'Create a team of agents for coordinated multi-agent tasks',
        inputSchema: {
          type: 'object',
          properties: {
            team_name: { type: 'string', description: 'Unique name for the team' },
            strategy: {
              type: 'string',
              description: 'Team composition strategy',
              enum: ['dynamic', 'enterprise', 'custom'],
              default: 'dynamic'
            },
            agents: {
              type: 'array',
              description: 'Agent names to include (for custom strategy)',
              items: { type: 'string' }
            }
          },
          required: ['team_name']
        }
      },
      {
        name: 'team_assign',
        description: 'Assign a task to a specific agent in a team',
        inputSchema: {
          type: 'object',
          properties: {
            team_name: { type: 'string', description: 'Team name' },
            agent_name: { type: 'string', description: 'Agent to assign' },
            task: { type: 'string', description: 'Task description' },
            context: { type: 'object', description: 'Task context', additionalProperties: true }
          },
          required: ['team_name', 'agent_name', 'task']
        }
      },
      {
        name: 'team_status',
        description: 'Get current status of a team and its agents',
        inputSchema: {
          type: 'object',
          properties: {
            team_name: { type: 'string', description: 'Team name' }
          },
          required: ['team_name']
        }
      },

      // --- New tools ---
      {
        name: 'bkit_pm_run',
        description: 'Run PM analysis pipeline. Generates PRD from project analysis. Executes discovery, strategy, research, synthesis sequentially.',
        inputSchema: {
          type: 'object',
          properties: {
            feature: {
              type: 'string',
              description: 'Feature name to analyze (e.g. "user-auth", "payment-v2")'
            },
            projectDir: {
              type: 'string',
              description: 'Project root directory (absolute path)'
            },
            phases: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['discovery', 'strategy', 'research', 'synthesis']
              },
              description: 'Specific phases to run (default: all)',
              default: ['discovery', 'strategy', 'research', 'synthesis']
            }
          },
          required: ['feature', 'projectDir']
        }
      },
      {
        name: 'bkit_qa_run',
        description: 'Run QA test suite. Detects test framework, executes L1-L5 tests, collects results with pass rate and coverage.',
        inputSchema: {
          type: 'object',
          properties: {
            feature: {
              type: 'string',
              description: 'Feature name for QA scope'
            },
            projectDir: {
              type: 'string',
              description: 'Project root directory'
            },
            levels: {
              type: 'array',
              items: { type: 'integer', minimum: 1, maximum: 5 },
              description: 'Test levels to run: 1=Unit, 2=API, 3=E2E, 4=UX, 5=Data (default: [1,2])',
              default: [1, 2]
            },
            testPattern: {
              type: 'string',
              description: 'Glob pattern for test files (e.g. "**/*.test.js")'
            }
          },
          required: ['feature', 'projectDir']
        }
      },
      {
        name: 'bkit_iterate',
        description: 'Run gap analysis between design document and implementation. Returns gaps with file:line references. Call repeatedly until matchRate >= target. Server tracks iteration count internally (max 5).',
        inputSchema: {
          type: 'object',
          properties: {
            feature: {
              type: 'string',
              description: 'Feature name'
            },
            projectDir: {
              type: 'string',
              description: 'Project root directory'
            },
            designPath: {
              type: 'string',
              description: 'Path to design document (relative or absolute)'
            },
            targetMatchRate: {
              type: 'number',
              description: 'Target match rate percentage (default: 90)',
              default: 90
            }
          },
          required: ['feature', 'projectDir']
        }
      },
      {
        name: 'bkit_team_run',
        description: 'Run a team workflow (PM/QA/CTO) with sequential agent coordination. Creates team, assigns tasks to each agent in order, returns aggregated results.',
        inputSchema: {
          type: 'object',
          properties: {
            team: {
              type: 'string',
              enum: ['pm', 'qa', 'cto'],
              description: 'Team type: pm=product management, qa=quality assurance, cto=technical leadership'
            },
            feature: {
              type: 'string',
              description: 'Feature name'
            },
            projectDir: {
              type: 'string',
              description: 'Project root directory'
            },
            task: {
              type: 'string',
              description: 'Task description for the team'
            }
          },
          required: ['team', 'feature', 'projectDir']
        }
      },
      {
        name: 'bkit_audit_query',
        description: 'Search audit trail in .gemini/audit/*.jsonl files. Returns matching audit entries filtered by time range, event type, or keyword.',
        inputSchema: {
          type: 'object',
          properties: {
            projectDir: {
              type: 'string',
              description: 'Project root directory'
            },
            eventType: {
              type: 'string',
              enum: ['tool_call', 'agent_spawn', 'phase_change', 'error', 'decision'],
              description: 'Filter by event type'
            },
            keyword: {
              type: 'string',
              description: 'Search keyword in event data'
            },
            since: {
              type: 'string',
              description: 'ISO date string - return events after this time'
            },
            limit: {
              type: 'integer',
              description: 'Max entries to return (default: 50)',
              default: 50
            }
          },
          required: ['projectDir']
        }
      },
      {
        name: 'bkit_checkpoint',
        description: 'Manage development checkpoints in .bkit/checkpoints/. Supports create, list, restore, and delete operations.',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['create', 'list', 'restore', 'delete'],
              description: 'Checkpoint operation'
            },
            feature: {
              type: 'string',
              description: 'Feature name'
            },
            projectDir: {
              type: 'string',
              description: 'Project root directory'
            },
            checkpointId: {
              type: 'string',
              description: 'Checkpoint ID (for restore/delete)'
            },
            label: {
              type: 'string',
              description: 'Human-readable label (for create)'
            }
          },
          required: ['action', 'projectDir']
        }
      }
    ];
  }

  // =========================================================================
  // Tool dispatch
  // =========================================================================

  async handleToolsCall(params) {
    const { name, arguments: args } = params;

    // Record audit entry for tool calls
    if (args && args.projectDir) {
      try {
        auditStore.append({
          projectDir: args.projectDir,
          entry: { type: 'tool_call', tool: name, detail: args.feature || '' }
        });
      } catch {
        // Non-critical: do not fail tool call if audit fails
      }
    }

    switch (name) {
      // Original tools
      case 'spawn_agent':    return this.handleSpawnAgent(args);
      case 'list_agents':    return this.handleListAgents();
      case 'get_agent_info': return this.handleGetAgentInfo(args);
      case 'team_create':    return this.handleTeamCreate(args);
      case 'team_assign':    return await this.handleTeamAssign(args);
      case 'team_status':    return this.handleTeamStatus(args);
      // New tools
      case 'bkit_pm_run':      return await this.handlePmRun(args);
      case 'bkit_qa_run':      return await this.handleQaRun(args);
      case 'bkit_iterate':     return await this.handleIterate(args);
      case 'bkit_team_run':    return await this.handleTeamRun(args);
      case 'bkit_audit_query': return this.handleAuditQuery(args);
      case 'bkit_checkpoint':  return this.handleCheckpoint(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  // =========================================================================
  // Original tool handlers (from spawn-agent-server.js)
  // =========================================================================

  async handleSpawnAgent(args) {
    const { agent_name, task, context, timeout = 300000 } = args;

    if (!AGENTS[agent_name]) {
      return this._textResponse({
        success: false,
        error: `Unknown agent: ${agent_name}`,
        available_agents: Object.keys(AGENTS)
      });
    }

    const agentInfo = AGENTS[agent_name];
    const agentPath = path.join(extensionPath, 'agents', agentInfo.file);

    if (!fs.existsSync(agentPath)) {
      return this._textResponse({
        success: false,
        error: `Agent file not found: ${agentPath}`
      });
    }

    try {
      console.error(`Spawning agent: ${agent_name} (safety tier: ${agentInfo.safetyTier})`);
      const result = await this.executeAgent(agentPath, task, context, timeout, agentInfo.safetyTier);

      return this._textResponse({
        success: result.exitCode === 0,
        agent: agent_name,
        result: result.output,
        exitCode: result.exitCode,
        duration: result.duration
      });
    } catch (error) {
      return this._textResponse({
        success: false,
        agent: agent_name,
        error: error.message
      });
    }
  }

  handleListAgents() {
    const agents = Object.entries(AGENTS).map(([name, info]) => ({
      name,
      description: info.description,
      recommendedModel: info.recommendedModel
    }));

    return this._textResponse({ agents });
  }

  handleGetAgentInfo(args) {
    const { agent_name } = args;

    if (!AGENTS[agent_name]) {
      return this._textResponse({
        error: `Unknown agent: ${agent_name}`,
        available_agents: Object.keys(AGENTS)
      });
    }

    const agentInfo = AGENTS[agent_name];
    const agentPath = path.join(extensionPath, 'agents', agentInfo.file);

    return this._textResponse({
      name: agent_name,
      file: agentInfo.file,
      description: agentInfo.description,
      recommendedModel: agentInfo.recommendedModel,
      safetyTier: agentInfo.safetyTier,
      exists: fs.existsSync(agentPath)
    });
  }

  handleTeamCreate(args) {
    const { team_name, strategy = 'dynamic', agents: customAgents } = args;

    const strategyAgents = {
      dynamic: ['cto-lead', 'code-analyzer', 'gap-detector'],
      enterprise: ['cto-lead', 'frontend-architect', 'security-architect', 'code-analyzer', 'gap-detector'],
      custom: customAgents || []
    };

    const teamAgents = strategyAgents[strategy] || strategyAgents.dynamic;

    // Validate all agents exist
    const invalid = teamAgents.filter(a => !AGENTS[a]);
    if (invalid.length > 0) {
      return this._textResponse({
        success: false,
        error: `Unknown agents: ${invalid.join(', ')}`,
        available_agents: Object.keys(AGENTS)
      });
    }

    // Validate team name
    const safeName = this._sanitizeTeamName(team_name);
    if (!safeName) {
      return this._textResponse({
        success: false,
        error: `Invalid team name: "${team_name}". Use only alphanumeric, hyphens, underscores.`
      });
    }

    // Create team state
    const teamState = {
      name: team_name,
      strategy,
      createdAt: new Date().toISOString(),
      agents: teamAgents.map(name => ({ name, status: 'idle', currentTask: null })),
      tasks: []
    };

    const teamDir = path.join(process.cwd(), '.gemini', 'teams');
    fs.mkdirSync(teamDir, { recursive: true });
    const teamPath = path.join(teamDir, `${safeName}.json`);
    fs.writeFileSync(teamPath, JSON.stringify(teamState, null, 2));

    return this._textResponse({
      success: true,
      team: team_name,
      strategy,
      agents: teamAgents,
      message: `Team "${team_name}" created with ${teamAgents.length} agents`
    });
  }

  async handleTeamAssign(args) {
    const { team_name, agent_name, task, context } = args;

    const safeName = this._sanitizeTeamName(team_name);
    if (!safeName) {
      return this._textResponse({
        success: false,
        error: `Invalid team name: "${team_name}". Use only alphanumeric, hyphens, underscores (max 64 chars).`
      });
    }

    const teamPath = path.join(process.cwd(), '.gemini', 'teams', `${safeName}.json`);
    if (!fs.existsSync(teamPath)) {
      return this._textResponse({ success: false, error: `Team "${team_name}" not found` });
    }

    const teamState = JSON.parse(fs.readFileSync(teamPath, 'utf-8'));
    const agent = teamState.agents.find(a => a.name === agent_name);
    if (!agent) {
      return this._textResponse({
        success: false,
        error: `Agent "${agent_name}" not in team "${team_name}"`
      });
    }

    // Create task entry
    const taskId = teamState.tasks.length + 1;
    const taskEntry = {
      id: taskId,
      description: task,
      assignedTo: agent_name,
      status: 'in_progress',
      createdAt: new Date().toISOString()
    };
    teamState.tasks.push(taskEntry);

    agent.status = 'active';
    agent.currentTask = taskId;
    fs.writeFileSync(teamPath, JSON.stringify(teamState, null, 2));

    try {
      const result = await this.handleSpawnAgent({
        agent_name, task, context, timeout: 300000
      });

      // Update status after completion
      const updatedState = JSON.parse(fs.readFileSync(teamPath, 'utf-8'));
      const updatedAgent = updatedState.agents.find(a => a.name === agent_name);
      const updatedTask = updatedState.tasks.find(t => t.id === taskId);
      if (updatedAgent) { updatedAgent.status = 'idle'; updatedAgent.currentTask = null; }
      if (updatedTask) { updatedTask.status = 'completed'; updatedTask.completedAt = new Date().toISOString(); }
      fs.writeFileSync(teamPath, JSON.stringify(updatedState, null, 2));

      return result;
    } catch (error) {
      return this._textResponse({
        success: false,
        error: error.message,
        team: team_name,
        agent: agent_name
      });
    }
  }

  handleTeamStatus(args) {
    const { team_name } = args;

    const safeName = this._sanitizeTeamName(team_name);
    if (!safeName) {
      return this._textResponse({
        success: false,
        error: `Invalid team name: "${team_name}". Use only alphanumeric, hyphens, underscores (max 64 chars).`
      });
    }

    const teamPath = path.join(process.cwd(), '.gemini', 'teams', `${safeName}.json`);
    if (!fs.existsSync(teamPath)) {
      return this._textResponse({ success: false, error: `Team "${team_name}" not found` });
    }

    const teamState = JSON.parse(fs.readFileSync(teamPath, 'utf-8'));
    return this._textResponse({ success: true, ...teamState });
  }

  // =========================================================================
  // New tool handlers
  // =========================================================================

  async handlePmRun(args) {
    const { feature, projectDir, phases } = args;
    const result = await pmPipeline.run({ feature, projectDir, phases, extensionPath });
    return this._textResponse(result);
  }

  async handleQaRun(args) {
    const { feature, projectDir, levels, testPattern } = args;
    const result = await qaRunner.run({ feature, projectDir, levels, testPattern });
    return this._textResponse(result);
  }

  async handleIterate(args) {
    const { feature, projectDir, designPath, targetMatchRate = 90 } = args;

    // Iteration state tracking (in-process memory)
    const stateKey = `${projectDir}::${feature}`;
    if (!this.iterationState.has(stateKey)) {
      this.iterationState.set(stateKey, { count: 0, history: [] });
    }

    const state = this.iterationState.get(stateKey);

    // Max iterations guard
    if (state.count >= 5) {
      return this._textResponse({
        status: 'max_iterations_reached',
        iterationCount: state.count,
        message: 'Maximum 5 iterations reached. Review gaps manually.',
        lastMatchRate: state.history.length > 0
          ? state.history[state.history.length - 1].matchRate
          : 0,
        history: state.history
      });
    }

    state.count++;

    // Resolve design path
    const resolvedDesignPath = designPath
      || path.join(projectDir, 'docs', '02-design', 'features', `${feature}.design.md`);

    const result = gapAnalyzer.analyze({
      feature, projectDir, designPath: resolvedDesignPath, extensionPath
    });

    state.history.push({
      iteration: state.count,
      matchRate: result.matchRate,
      gapCount: result.gaps.length,
      timestamp: new Date().toISOString()
    });

    return this._textResponse({
      status: result.matchRate >= targetMatchRate ? 'target_reached' : 'gaps_found',
      iterationCount: state.count,
      maxIterations: 5,
      matchRate: result.matchRate,
      targetMatchRate,
      gaps: result.gaps,
      structural: result.structural,
      functional: result.functional,
      history: state.history,
      recommendation: result.matchRate >= targetMatchRate
        ? 'Target match rate achieved. Proceed to QA phase.'
        : `Fix ${result.gaps.length} gaps and call bkit_iterate again.`
    });
  }

  async handleTeamRun(args) {
    const { team, feature, projectDir, task } = args;

    const teamConfigs = {
      pm: {
        agents: ['product-manager'],
        defaultTask: `Analyze feature "${feature}" and generate PRD`
      },
      qa: {
        agents: ['qa-strategist', 'qa-monitor'],
        defaultTask: `Plan and execute QA for feature "${feature}"`
      },
      cto: {
        agents: ['cto-lead', 'code-analyzer', 'security-architect'],
        defaultTask: `Technical review and architecture validation for "${feature}"`
      }
    };

    const config = teamConfigs[team];
    if (!config) {
      return this._textResponse({
        success: false,
        error: `Unknown team type: ${team}. Available: pm, qa, cto`
      });
    }

    // Filter agents to only those that exist in AGENTS registry
    const validAgents = config.agents.filter(a => AGENTS[a]);
    if (validAgents.length === 0) {
      return this._textResponse({
        success: false,
        error: `No valid agents found for team "${team}"`
      });
    }

    const teamName = `${team}-${feature}-${Date.now()}`;
    const taskDesc = task || config.defaultTask;

    // Step 1: Create team
    this.handleTeamCreate({
      team_name: teamName,
      strategy: 'custom',
      agents: validAgents
    });

    // Step 2: Assign task to lead agent
    const leadAgent = validAgents[0];
    let assignResult;
    try {
      assignResult = await this.handleTeamAssign({
        team_name: teamName,
        agent_name: leadAgent,
        task: taskDesc,
        context: { feature, projectDir, team, supportAgents: validAgents.slice(1) }
      });
    } catch (error) {
      return this._textResponse({
        success: false,
        error: `Team run failed: ${error.message}`,
        team: teamName
      });
    }

    // Step 3: Get team status
    const statusResult = this.handleTeamStatus({ team_name: teamName });

    let parsedAssign, parsedStatus;
    try {
      parsedAssign = JSON.parse(assignResult.content[0].text);
    } catch {
      parsedAssign = assignResult;
    }
    try {
      parsedStatus = JSON.parse(statusResult.content[0].text);
    } catch {
      parsedStatus = statusResult;
    }

    return this._textResponse({
      success: true,
      team: teamName,
      type: team,
      feature,
      leadAgent,
      result: parsedAssign,
      status: parsedStatus
    });
  }

  handleAuditQuery(args) {
    const { projectDir, eventType, keyword, since, limit } = args;
    const result = auditStore.query({ projectDir, eventType, keyword, since, limit });
    return this._textResponse(result);
  }

  handleCheckpoint(args) {
    const { action, feature, projectDir, checkpointId, label } = args;
    const result = checkpointManager.execute({ action, feature, projectDir, checkpointId, label });
    return this._textResponse(result);
  }

  // =========================================================================
  // Agent execution (from original spawn-agent-server.js)
  // =========================================================================

  /**
   * Resolve model name in agent frontmatter
   */
  _resolveAgentModel(agentPath) {
    try {
      const content = fs.readFileSync(agentPath, 'utf-8');
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!fmMatch) return;

      const modelMatch = fmMatch[1].match(/^model:\s*(.+)$/m);
      if (!modelMatch) return;

      const currentModel = modelMatch[1].trim();

      // Load settings overrides if available
      let settingsOverrides = null;
      try {
        const settingsPath = path.join(extensionPath, '.gemini', 'settings.json');
        if (fs.existsSync(settingsPath)) {
          const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
          settingsOverrides = settings.agentModels || null;
        }
      } catch { /* ignore */ }

      const agentName = path.basename(agentPath, '.md');
      const result = resolveModel(currentModel, { settingsOverrides, agentName });

      if (result.warning) {
        console.error(result.warning);
      }

      if (result.wasAliased) {
        const updated = content.replace(
          `model: ${currentModel}`,
          `model: ${result.resolved}`
        );
        fs.writeFileSync(agentPath, updated, 'utf-8');
        console.error(`[model-resolver] ${agentName}: "${currentModel}" -> "${result.resolved}"`);
      }
    } catch (e) {
      console.error(`[model-resolver] Failed to resolve model for ${agentPath}: ${e.message}`);
    }
  }

  /**
   * Execute an agent using Gemini CLI
   */
  executeAgent(agentPath, task, context, timeout, safetyTier = SAFETY_TIERS.FULL) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      // Resolve model name before execution
      this._resolveAgentModel(agentPath);

      // Build gemini CLI command with feature flags
      const { getFeatureFlags } = require(path.join(extensionPath, 'lib', 'gemini', 'version'));
      const flags = getFeatureFlags();

      // Safety tier determines approval mode
      let approvalFlag;
      if (safetyTier === SAFETY_TIERS.FULL) {
        approvalFlag = flags.hasApprovalMode ? '--approval-mode=yolo' : '--yolo';
      } else {
        approvalFlag = flags.hasApprovalMode ? '--approval-mode=default' : '';
      }

      // v0.36.0+ native tool isolation for READONLY agents
      let toolIsolationArgs = [];
      if (flags.hasMultiRegistry && safetyTier === SAFETY_TIERS.READONLY) {
        toolIsolationArgs = ['--allowed-tools', 'read_file,read_many_files,list_directory,glob,grep_search,google_web_search,web_fetch'];
      }

      const args = [
        '-e', agentPath,
        ...(approvalFlag ? [approvalFlag] : []),
        ...toolIsolationArgs,
        task
      ];

      // Set up environment with context
      const env = { ...process.env };
      if (context) {
        env.BKIT_AGENT_CONTEXT = JSON.stringify(context);
      }

      // v0.32.0+ sub-agent hang prevention
      if (flags.hasTaskTracker) {
        env.GEMINI_NON_INTERACTIVE = '1';
      }

      console.error(`Executing: gemini ${args.join(' ')}`);

      const proc = spawn('gemini', args, {
        env,
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => { stdout += data.toString(); });
      proc.stderr.on('data', (data) => { stderr += data.toString(); });

      proc.on('close', (code) => {
        const duration = Date.now() - startTime;
        resolve({
          output: stdout || stderr,
          exitCode: code || 0,
          duration
        });
      });

      proc.on('error', (err) => {
        reject(err);
      });

      // Timeout with absolute cap
      const MAX_TIMEOUT = 600000; // 10 min
      const effectiveTimeout = Math.min(timeout, MAX_TIMEOUT);

      const timeoutId = setTimeout(() => {
        console.error(`Agent timeout after ${effectiveTimeout}ms, sending SIGTERM`);
        proc.stdin.end();
        proc.kill('SIGTERM');
        setTimeout(() => {
          if (!proc.killed) {
            console.error('Agent did not exit after SIGTERM, sending SIGKILL');
            proc.kill('SIGKILL');
          }
        }, 5000);
        reject(new Error(`Agent execution timed out after ${effectiveTimeout}ms`));
      }, effectiveTimeout);

      proc.on('close', () => {
        clearTimeout(timeoutId);
      });
    });
  }

  // =========================================================================
  // Utility methods
  // =========================================================================

  /**
   * Create a standard MCP text response
   */
  _textResponse(data) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(data, null, 2)
      }]
    };
  }

  /**
   * Sanitize team name to prevent path traversal
   */
  _sanitizeTeamName(teamName) {
    if (!teamName || typeof teamName !== 'string') return null;
    const sanitized = teamName.replace(/[^a-zA-Z0-9_-]/g, '');
    if (sanitized !== teamName || sanitized.length === 0 || sanitized.length > 64) return null;
    return sanitized;
  }
}

// ---------------------------------------------------------------------------
// Export for testing and run server
// ---------------------------------------------------------------------------

module.exports = { BkitServer, AGENTS, SAFETY_TIERS };

// Run server when executed directly
if (require.main === module) {
  const server = new BkitServer();
  server.run().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
}
