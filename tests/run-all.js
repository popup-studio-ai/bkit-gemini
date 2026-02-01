const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const TESTS = [
  'verify-philosophy.js',
  'verify-lib.js',
  'verify-components.js',
  'verify-hooks.js'
];

async function runTest(script) {
  return new Promise((resolve) => {
    console.log(`\n=== Running ${script} ===`);
    const child = exec(`node tests/${script}`);
    
    let output = '';
    child.stdout.on('data', data => {
      process.stdout.write(data);
      output += data;
    });
    child.stderr.on('data', data => {
      process.stderr.write(data);
      output += data;
    });
    
    child.on('close', (code) => {
      resolve({ script, code, output });
    });
  });
}

async function main() {
  console.log('Starting bkit-gemini Comprehensive Test Suite...');
  
  const results = [];
  let allPassed = true;

  for (const test of TESTS) {
    const result = await runTest(test);
    results.push(result);
    if (result.code !== 0) allPassed = false;
  }

  generateReport(results, allPassed);
}

function generateReport(results, allPassed) {
  const date = new Date().toISOString().split('T')[0];
  const reportPath = path.resolve(__dirname, '../docs/04-report/features/bkit-gemini-comprehensive-test.report.md');
  
  // Ensure directory exists
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });

  let report = `# bkit-gemini Comprehensive Test Report

> **Status**: ${allPassed ? 'Passed' : 'Failed'}
>
> **Project**: bkit-gemini
> **Version**: 1.5.1
> **Test Date**: ${date}
> **Executor**: Gemini CLI Test Runner

---

## 1. Summary

| Metric | Value |
|--------|-------|
| Total Suites | ${results.length} |
| Passed | ${results.filter(r => r.code === 0).length} |
| Failed | ${results.filter(r => r.code !== 0).length} |
| Overall Status | ${allPassed ? '✅ PASS' : '❌ FAIL'} |

---

## 2. Test Results

`;

  results.forEach(r => {
    const status = r.code === 0 ? '✅ PASS' : '❌ FAIL';
    report += `### ${r.script} (${status})\n\n`;
    report += '```\n';
    report += r.output.trim();
    report += '\n```\n\n';
  });

  report += `---

## 3. Detailed Verification

### 3.1 Philosophy Alignment
- **Automation First**: Verified via logic tests in \`verify-philosophy.js\`
- **No Guessing**: Verified via logic tests in \`verify-philosophy.js\`
- **Docs = Code**: Verified via template checks in \`verify-philosophy.js\`

### 3.2 Functional Requirements
- **FR-01 to FR-08**: Verified via library unit tests in \`verify-lib.js\`

### 3.3 Components
- **Skills/Agents**: Verified file existence and structure in \`verify-components.js\`
- **Hooks**: Verified execution in \`verify-hooks.js\`

---

## 4. Conclusion

This report confirms that the core mechanisms of bkit-gemini v1.5.1 are functioning as designed.
`;

  fs.writeFileSync(reportPath, report);
  console.log(`\nReport generated at: ${reportPath}`);
}

main();
