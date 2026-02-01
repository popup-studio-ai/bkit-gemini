#!/usr/bin/env node
/**
 * spawn_agent MCP Server (GAP-03)
 * Provides spawn_agent tool for agent orchestration in Gemini CLI
 *
 * Philosophy: Agent System Behavioral Rules - Agents must be able to delegate to specialized sub-agents
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get extension path
const extensionPath = path.resolve(__dirname, '..');

/**
 * Available agents registry
 * Maps agent names to their files and descriptions
 */
const AGENTS = {
  'gap-detector': {
    file: 'gap-detector.md',
    description: 'Detect gaps between design documents and implementation',
    recommendedModel: 'pro'
  },
  'design-validator': {
    file: 'design-validator.md',
    description: 'Validate design document completeness and consistency',
    recommendedModel: 'pro'
  },
  'pdca-iterator': {
    file: 'pdca-iterator.md',
    description: 'Auto-iterate through evaluation and improvement cycles',
    recommendedModel: 'flash'
  },
  'code-analyzer': {
    file: 'code-analyzer.md',
    description: 'Analyze code quality, security, and architecture compliance',
    recommendedModel: 'pro'
  },
  'report-generator': {
    file: 'report-generator.md',
    description: 'Generate PDCA completion reports',
    recommendedModel: 'flash-lite'
  },
  'qa-monitor': {
    file: 'qa-monitor.md',
    description: 'Zero Script QA via Docker log monitoring',
    recommendedModel: 'flash-lite'
  },
  'starter-guide': {
    file: 'starter-guide.md',
    description: 'Beginner-friendly guidance for new developers',
    recommendedModel: 'flash'
  },
  'pipeline-guide': {
    file: 'pipeline-guide.md',
    description: '9-phase development pipeline guidance',
    recommendedModel: 'flash'
  },
  'bkend-expert': {
    file: 'bkend-expert.md',
    description: 'bkend.ai BaaS integration expert',
    recommendedModel: 'flash'
  },
  'enterprise-expert': {
    file: 'enterprise-expert.md',
    description: 'Enterprise architecture and AI-Native patterns',
    recommendedModel: 'pro'
  },
  'infra-architect': {
    file: 'infra-architect.md',
    description: 'AWS, Kubernetes, Terraform infrastructure design',
    recommendedModel: 'pro'
  }
};

/**
 * MCP Server implementation using stdio transport
 * Follows MCP protocol specification
 */
class SpawnAgentServer {
  constructor() {
    this.buffer = '';
    this.requestId = 0;
  }

  /**
   * Start the server
   */
  async run() {
    process.stdin.setEncoding('utf-8');

    process.stdin.on('data', (chunk) => {
      this.buffer += chunk;
      this.processBuffer();
    });

    process.stdin.on('end', () => {
      process.exit(0);
    });

    // Log startup to stderr (not stdout, which is for MCP messages)
    console.error('bkit-agents MCP server started');
  }

  /**
   * Process incoming buffer for complete JSON-RPC messages
   */
  processBuffer() {
    const lines = this.buffer.split('\n');

    // Keep incomplete last line in buffer
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        this.handleMessage(line);
      }
    }
  }

  /**
   * Handle a single JSON-RPC message
   * @param {string} message
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
   * @param {object} request
   */
  async handleRequest(request) {
    const { id, method, params } = request;

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
   * @param {string|number} id
   * @param {object} result
   */
  sendResponse(id, result) {
    const response = {
      jsonrpc: '2.0',
      id,
      result
    };
    console.log(JSON.stringify(response));
  }

  /**
   * Send JSON-RPC error
   * @param {string|number} id
   * @param {string} message
   */
  sendError(id, message) {
    const response = {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32000,
        message
      }
    };
    console.log(JSON.stringify(response));
  }

  /**
   * Handle initialize request
   * @param {object} params
   * @returns {object}
   */
  handleInitialize(params) {
    return {
      protocolVersion: '2024-11-05',
      serverInfo: {
        name: 'bkit-agents',
        version: '1.0.0'
      },
      capabilities: {
        tools: {}
      }
    };
  }

  /**
   * Handle tools/list request
   * @returns {object}
   */
  handleToolsList() {
    return {
      tools: [
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
          inputSchema: {
            type: 'object',
            properties: {}
          }
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
        }
      ]
    };
  }

  /**
   * Handle tools/call request
   * @param {object} params
   * @returns {object}
   */
  async handleToolsCall(params) {
    const { name, arguments: args } = params;

    switch (name) {
      case 'spawn_agent':
        return this.handleSpawnAgent(args);

      case 'list_agents':
        return this.handleListAgents();

      case 'get_agent_info':
        return this.handleGetAgentInfo(args);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  /**
   * Handle spawn_agent tool call
   * @param {object} args
   * @returns {object}
   */
  async handleSpawnAgent(args) {
    const { agent_name, task, context, timeout = 300000 } = args;

    // Validate agent exists
    if (!AGENTS[agent_name]) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: `Unknown agent: ${agent_name}`,
            available_agents: Object.keys(AGENTS)
          }, null, 2)
        }]
      };
    }

    const agentInfo = AGENTS[agent_name];
    const agentPath = path.join(extensionPath, 'agents', agentInfo.file);

    // Verify agent file exists
    if (!fs.existsSync(agentPath)) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: `Agent file not found: ${agentPath}`
          }, null, 2)
        }]
      };
    }

    try {
      console.error(`Spawning agent: ${agent_name}`);
      const result = await this.executeAgent(agentPath, task, context, timeout);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: result.exitCode === 0,
            agent: agent_name,
            result: result.output,
            exitCode: result.exitCode,
            duration: result.duration
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            agent: agent_name,
            error: error.message
          }, null, 2)
        }]
      };
    }
  }

  /**
   * Handle list_agents tool call
   * @returns {object}
   */
  handleListAgents() {
    const agents = Object.entries(AGENTS).map(([name, info]) => ({
      name,
      description: info.description,
      recommendedModel: info.recommendedModel
    }));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ agents }, null, 2)
      }]
    };
  }

  /**
   * Handle get_agent_info tool call
   * @param {object} args
   * @returns {object}
   */
  handleGetAgentInfo(args) {
    const { agent_name } = args;

    if (!AGENTS[agent_name]) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: `Unknown agent: ${agent_name}`,
            available_agents: Object.keys(AGENTS)
          }, null, 2)
        }]
      };
    }

    const agentInfo = AGENTS[agent_name];
    const agentPath = path.join(extensionPath, 'agents', agentInfo.file);

    // Read agent file to get full metadata
    let agentContent = '';
    try {
      agentContent = fs.readFileSync(agentPath, 'utf-8');
    } catch {
      // Ignore read errors
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          name: agent_name,
          file: agentInfo.file,
          description: agentInfo.description,
          recommendedModel: agentInfo.recommendedModel,
          path: agentPath,
          exists: fs.existsSync(agentPath)
        }, null, 2)
      }]
    };
  }

  /**
   * Execute an agent using Gemini CLI
   * @param {string} agentPath - Path to agent file
   * @param {string} task - Task description
   * @param {object} context - Additional context
   * @param {number} timeout - Timeout in ms
   * @returns {Promise<{output: string, exitCode: number, duration: number}>}
   */
  executeAgent(agentPath, task, context, timeout) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      // Build gemini CLI command
      // Using gemini with extension flag and yolo mode for non-interactive execution
      const args = [
        '-e', agentPath,
        '--yolo',
        task
      ];

      // Set up environment with context
      const env = { ...process.env };
      if (context) {
        env.BKIT_AGENT_CONTEXT = JSON.stringify(context);
      }

      console.error(`Executing: gemini ${args.join(' ')}`);

      const proc = spawn('gemini', args, {
        env,
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

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

      // Set timeout
      const timeoutId = setTimeout(() => {
        proc.kill('SIGTERM');
        setTimeout(() => {
          if (!proc.killed) {
            proc.kill('SIGKILL');
          }
        }, 5000);
        reject(new Error(`Agent execution timed out after ${timeout}ms`));
      }, timeout);

      proc.on('close', () => {
        clearTimeout(timeoutId);
      });
    });
  }
}

// Run server
const server = new SpawnAgentServer();
server.run().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
