const { spawn } = require('child_process');
const path = require('path');

const SERVER_PATH = path.resolve(__dirname, '..', 'mcp/spawn-agent-server.js');

function callTool(method, params) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [SERVER_PATH], { stdio: ['pipe', 'pipe', 'inherit'] });
    
    let response = '';
    proc.stdout.on('data', (data) => {
      response += data.toString();
    });

    const request = {
      jsonrpc: '2.0',
      id: 1,
      method,
      params
    };

    proc.stdin.write(JSON.stringify(request) + '\n');
    
    setTimeout(() => {
      proc.kill();
      try {
        const res = JSON.parse(response.split('\n')[0]);
        resolve(res);
      } catch (e) {
        reject(new Error(`Failed to parse response: ${response}`));
      }
    }, 1000);
  });
}

async function runTests() {
  console.log('Testing MCP Server tools:');

  try {
    console.log('1. Testing tools/list (MCP-02):');
    const listRes = await callTool('tools/list', {});
    // console.log('Result:', JSON.stringify(listRes, null, 2));
    if (listRes.result.tools.length === 3) {
      console.log('PASS: 3 tools found');
    } else {
      console.log('FAIL: Expected 3 tools');
    }
    console.log('---');

    console.log('2. Testing get_agent_info (MCP-03):');
    const infoRes = await callTool('tools/call', {
      name: 'get_agent_info',
      arguments: { agent_name: 'gap-detector' }
    });
    // console.log('Result:', JSON.stringify(infoRes, null, 2));
    if (infoRes.result.content[0].text.includes('gap-detector.md')) {
      console.log('PASS: Agent info found');
    } else {
      console.log('FAIL: Agent info incorrect');
    }
    console.log('---');

  } catch (e) {
    console.error('Test failed:', e);
  }
}

runTests();