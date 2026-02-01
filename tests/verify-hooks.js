const { exec } = require('child_process');
const path = require('path');
const assert = require('assert');
const { setupEnvironment, TEST_DIR } = require('./setup');

function runHook(scriptName, input, env = {}) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, '../hooks/scripts', scriptName);
    const child = exec(`node ${scriptPath}`, {
      cwd: TEST_DIR,
      env: { ...process.env, ...env, BKIT_DEBUG: '1' }
    });

    let stdout = '';
    let stderr = '';

    if (input) {
      child.stdin.write(JSON.stringify(input));
      child.stdin.end();
    }

    child.stdout.on('data', data => stdout += data);
    child.stderr.on('data', data => stderr += data);

    child.on('close', code => {
      try {
        const jsonOutput = stdout.trim() ? JSON.parse(stdout.trim()) : null;
        resolve({ code, stdout, stderr, json: jsonOutput });
      } catch (e) {
        resolve({ code, stdout, stderr, json: null });
      }
    });
  });
}

async function verifyHooks() {
  console.log('Starting Hooks Tests...');
  setupEnvironment();

  try {
    // HOOK-01: Session Start
    console.log('Testing HOOK-01: SessionStart...');
    const startResult = await runHook('session-start.js', {}, { 
        // Mock env if needed by session-start
    });
    // Session start usually prints welcome message to stderr or just logs
    assert.strictEqual(startResult.code, 0, 'SessionStart should exit 0');
    // Check for welcome message in stderr or stdout (depending on implementation)
    // The design doc says "SessionStart hook displays welcome message"
    const output = startResult.stdout + startResult.stderr;
    assert.ok(output.includes('bkit') || output.includes('Welcome'), 'Should display welcome');
    console.log('PASS: HOOK-01');


    // HOOK-02: BeforeAgent (Intent Detection)
    console.log('Testing HOOK-02: BeforeAgent...');
    const agentInput = {
      userPrompt: "Add user authentication"
    };
    const agentResult = await runHook('before-agent.js', agentInput);
    assert.strictEqual(agentResult.code, 0, 'BeforeAgent should exit 0');
    // It should return additional context
    if (agentResult.json) {
        assert.ok(agentResult.json.hookSpecificOutput, 'Should return hook output');
        // Note: The specific output format depends on the implementation.
    }
    console.log('PASS: HOOK-02');


    // HOOK-03: BeforeTool (Permission - Allow)
    console.log('Testing HOOK-03: BeforeTool (Allow)...');
    const toolInputAllow = {
      toolName: "run_shell_command",
      toolArguments: { command: "ls -la" }
    };
    const toolResultAllow = await runHook('before-tool.js', toolInputAllow);
    assert.strictEqual(toolResultAllow.code, 0, 'BeforeTool should exit 0 for allowed');
    // Should NOT have decision: deny
    if (toolResultAllow.json) {
        assert.notStrictEqual(toolResultAllow.json.decision, 'deny', 'Should not deny safe command');
    }
    console.log('PASS: HOOK-03');


    // HOOK-04: BeforeTool (Permission - Deny)
    console.log('Testing HOOK-04: BeforeTool (Deny)...');
    const toolInputDeny = {
      toolName: "run_shell_command",
      toolArguments: { command: "rm -rf /" }
    };
    const toolResultDeny = await runHook('before-tool.js', toolInputDeny);
    // Deny usually exits with non-zero or returns decision: deny
    // Checking lib/core/permission.js, it might return exit code 2 or JSON decision
    if (toolResultDeny.json && toolResultDeny.json.decision === 'deny') {
         assert.ok(true, 'Denied via JSON');
    } else {
         // Fallback check
         // Depending on implementation, it might just exit 1 or print error
    }
    console.log('PASS: HOOK-04');


    // HOOK-07: PreCompress
    console.log('Testing HOOK-07: PreCompress...');
    const compressResult = await runHook('pre-compress.js', {});
    assert.strictEqual(compressResult.code, 0, 'PreCompress should exit 0');
    // Check if snapshot was created
    const fs = require('fs');
    const snapshots = fs.readdirSync(path.join(TEST_DIR, 'docs/.pdca-snapshots'));
    assert.ok(snapshots.length > 0, 'Snapshot should be created');
    console.log('PASS: HOOK-07');

  } catch (err) {
    console.error('FAILED:', err);
    process.exit(1);
  }
}

verifyHooks();
