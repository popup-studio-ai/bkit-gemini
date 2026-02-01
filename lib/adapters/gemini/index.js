/**
 * Gemini CLI Platform Adapter
 * Implements platform-specific functionality for Gemini CLI
 */
const { PlatformAdapter } = require('../platform-interface');
const fs = require('fs');
const path = require('path');

// Tool name mapping: Claude Code → Gemini CLI
const TOOL_MAP = {
  'Write': 'write_file',
  'Edit': 'replace',
  'Read': 'read_file',
  'Bash': 'run_shell_command',
  'Glob': 'glob',
  'Grep': 'grep',
  'WebSearch': 'web_search',
  'WebFetch': 'web_fetch',
  'Task': 'task',
  'TaskCreate': 'task_create',
  'TaskUpdate': 'task_update',
  'TaskList': 'task_list',
  'TaskGet': 'task_get',
  'AskUserQuestion': 'ask_user',
  'Skill': 'skill'
};

// Reverse mapping: Gemini CLI → Claude Code
const REVERSE_TOOL_MAP = Object.fromEntries(
  Object.entries(TOOL_MAP).map(([k, v]) => [v, k])
);

class GeminiAdapter extends PlatformAdapter {
  constructor() {
    super();
    this._name = 'gemini';
    this._version = '1.0.0';
    this._pluginRoot = null;
    this._projectDir = null;
  }

  get name() { return this._name; }
  get version() { return this._version; }

  /**
   * Check if running in Gemini CLI environment
   */
  isActive() {
    return !!(
      process.env.GEMINI_CLI ||
      process.env.GEMINI_PROJECT_DIR ||
      process.env.GEMINI_EXTENSION_PATH ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY
    );
  }

  /**
   * Get extension root directory
   */
  getPluginRoot() {
    if (this._pluginRoot) return this._pluginRoot;

    this._pluginRoot =
      process.env.GEMINI_EXTENSION_PATH ||
      process.env.extensionPath ||
      path.resolve(__dirname, '..', '..', '..');

    return this._pluginRoot;
  }

  /**
   * Get current project directory
   */
  getProjectDir() {
    if (this._projectDir) return this._projectDir;

    this._projectDir =
      process.env.GEMINI_PROJECT_DIR ||
      process.env.workspacePath ||
      process.cwd();

    return this._projectDir;
  }

  /**
   * Expand template variables
   */
  expandVariables(template) {
    if (!template || typeof template !== 'string') return template;

    return template
      // Gemini CLI variables
      .replace(/\$\{extensionPath\}/g, this.getPluginRoot())
      .replace(/\$\{workspacePath\}/g, this.getProjectDir())
      // Claude Code compatibility
      .replace(/\$\{PLUGIN_ROOT\}/g, this.getPluginRoot())
      .replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, this.getPluginRoot())
      .replace(/\$\{PROJECT_DIR\}/g, this.getProjectDir())
      // Path separators
      .replace(/\$\{\/\}/g, path.sep)
      .replace(/\$\{pathSeparator\}/g, path.sep);
  }

  /**
   * Map Claude Code tool name to Gemini CLI tool name
   */
  mapToolName(toolName) {
    return TOOL_MAP[toolName] || toolName.toLowerCase();
  }

  /**
   * Map Gemini CLI tool name to Claude Code tool name
   */
  reverseMapToolName(geminiToolName) {
    return REVERSE_TOOL_MAP[geminiToolName] || geminiToolName;
  }

  /**
   * Read hook input from stdin
   */
  readHookInput() {
    try {
      const input = fs.readFileSync(0, 'utf-8').trim();
      if (!input) return {};
      return JSON.parse(input);
    } catch (e) {
      return {};
    }
  }

  /**
   * Output allow decision with optional context
   */
  outputAllow(context, hookEvent) {
    const output = {
      status: 'allow'
    };

    if (context) {
      output.context = context;
    }

    if (hookEvent) {
      output.hookEvent = hookEvent;
    }

    console.log(JSON.stringify(output));
    process.exit(0);
  }

  /**
   * Output block decision with reason
   */
  outputBlock(reason) {
    console.log(JSON.stringify({
      status: 'block',
      reason: reason
    }));
    process.exit(2);
  }

  /**
   * Output empty (no-op)
   */
  outputEmpty() {
    process.exit(0);
  }

  /**
   * Get debug log path
   */
  getDebugLogPath() {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '/tmp';
    return path.join(homeDir, '.gemini', 'bkit-debug.log');
  }

  /**
   * Write debug log entry
   */
  debugLog(category, message, data) {
    if (process.env.BKIT_DEBUG !== 'true') return;

    try {
      const logPath = this.getDebugLogPath();
      const logDir = path.dirname(logPath);

      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const timestamp = new Date().toISOString();
      const dataStr = data ? '\n' + JSON.stringify(data, null, 2) : '';
      const logEntry = `[${timestamp}] [${category}] ${message}${dataStr}\n`;

      fs.appendFileSync(logPath, logEntry);
    } catch (e) {
      // Silently fail debug logging
    }
  }

  /**
   * Get context file name
   */
  getContextFileName() {
    return 'GEMINI.md';
  }

  /**
   * Get template file path
   */
  getTemplatePath(templateName) {
    return path.join(this.getPluginRoot(), 'templates', templateName);
  }

  /**
   * Get skill directory path
   */
  getSkillPath(skillName) {
    return path.join(this.getPluginRoot(), 'skills', skillName);
  }

  /**
   * Get agent file path
   */
  getAgentPath(agentName) {
    return path.join(this.getPluginRoot(), 'agents', `${agentName}.md`);
  }

  /**
   * Reset cached paths
   */
  reset() {
    this._pluginRoot = null;
    this._projectDir = null;
  }
}

// Export singleton instance
module.exports = new GeminiAdapter();
