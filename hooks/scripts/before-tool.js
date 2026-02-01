#!/usr/bin/env node
/**
 * BeforeTool Hook - Pre-execution Validation
 * Validates tool calls, checks permissions, and provides PDCA guidance
 */
const fs = require('fs');
const path = require('path');

const libPath = path.resolve(__dirname, '..', '..', 'lib');

function main() {
  try {
    const { getAdapter } = require(path.join(libPath, 'adapters'));
    const adapter = getAdapter();

    // Read input
    const input = adapter.readHookInput();
    const toolName = input.tool_name || '';
    const toolInput = input.tool_input || {};

    // Map tool name
    const claudeToolName = adapter.reverseMapToolName(toolName);

    // Handle by tool type
    if (['write_file', 'replace'].includes(toolName) || ['Write', 'Edit'].includes(claudeToolName)) {
      handleWriteEdit(adapter, toolInput);
    } else if (toolName === 'run_shell_command' || claudeToolName === 'Bash') {
      handleBash(adapter, toolInput);
    } else {
      adapter.outputEmpty();
    }

  } catch (error) {
    process.exit(0);
  }
}

function handleWriteEdit(adapter, toolInput) {
  const filePath = toolInput.file_path || toolInput.path || '';
  const content = toolInput.content || '';

  // Check for dangerous patterns in content
  if (content.includes('rm -rf /') || content.includes(':(){ :|:& };:')) {
    adapter.outputBlock('Potentially dangerous content detected');
    return;
  }

  // Get PDCA guidance based on file type
  const contexts = [];

  // Check if writing to source code
  const ext = path.extname(filePath).toLowerCase();
  const sourceExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java'];

  if (sourceExts.includes(ext)) {
    // Estimate task size
    const lines = content.split('\n').length;
    let pdcaLevel = 'none';
    let guidance = '';

    if (lines > 500) {
      pdcaLevel = 'required';
      guidance = 'Major feature detected. PDCA documentation is strongly recommended.';
    } else if (lines > 100) {
      pdcaLevel = 'recommended';
      guidance = 'Feature-sized change detected. Consider creating design documentation.';
    } else if (lines > 30) {
      pdcaLevel = 'optional';
      guidance = 'Minor change detected. PDCA is optional but helpful.';
    }

    if (guidance) {
      contexts.push(`**PDCA Guidance** (${pdcaLevel}): ${guidance}`);
    }
  }

  // Check for env file writes
  if (path.basename(filePath).startsWith('.env')) {
    contexts.push('**Security Note**: Writing to environment file. Ensure sensitive values are not committed.');
  }

  if (contexts.length > 0) {
    adapter.outputAllow(contexts.join('\n'), 'BeforeTool');
  } else {
    adapter.outputEmpty();
  }
}

function handleBash(adapter, toolInput) {
  const command = toolInput.command || '';

  // Dangerous patterns to block
  const blockPatterns = [
    /rm\s+-rf\s+\/(?!\s)/,
    /rm\s+-rf\s+\*/,
    /mkfs\./,
    /dd\s+if=.*of=\/dev/,
    />\s*\/dev\/sd[a-z]/,
    /curl.*\|\s*(?:bash|sh)/,
    /wget.*\|\s*(?:bash|sh)/
  ];

  for (const pattern of blockPatterns) {
    if (pattern.test(command)) {
      adapter.outputBlock(`Dangerous command pattern detected: ${pattern}`);
      return;
    }
  }

  // Warning patterns
  const warnPatterns = [
    { pattern: /git\s+push\s+--force/, msg: 'Force push detected. Use with caution.' },
    { pattern: /git\s+reset\s+--hard/, msg: 'Hard reset detected. This may cause data loss.' },
    { pattern: /rm\s+-r/, msg: 'Recursive delete detected. Verify the path.' },
    { pattern: /DROP\s+TABLE/i, msg: 'SQL DROP statement detected.' },
    { pattern: /TRUNCATE/i, msg: 'SQL TRUNCATE statement detected.' }
  ];

  const warnings = [];
  for (const { pattern, msg } of warnPatterns) {
    if (pattern.test(command)) {
      warnings.push(`**Warning**: ${msg}`);
    }
  }

  if (warnings.length > 0) {
    adapter.outputAllow(warnings.join('\n'), 'BeforeTool');
  } else {
    adapter.outputEmpty();
  }
}

main();
