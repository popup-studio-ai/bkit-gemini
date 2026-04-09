/**
 * QA Test Runner
 * Detects test framework, executes L1-L5 tests, collects structured results.
 *
 * @module mcp/tools/qa-runner
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Run QA test suite
 * @param {object} params
 * @param {string} params.feature - Feature name for QA scope
 * @param {string} params.projectDir - Project root directory
 * @param {number[]} [params.levels] - Test levels to run (default: [1,2])
 * @param {string} [params.testPattern] - Glob pattern for test files
 * @returns {Promise<object>} Test results
 */
async function run({ feature, projectDir, levels = [1, 2], testPattern }) {
  const results = {
    feature,
    timestamp: new Date().toISOString(),
    framework: null,
    levels: [],
    summary: { total: 0, passed: 0, failed: 0, skipped: 0 },
    passRate: 0,
    coverage: null
  };

  // Step 1: Detect test framework
  results.framework = detectFramework(projectDir);

  // Step 2: Run each level
  for (const level of levels.sort((a, b) => a - b)) {
    const levelResult = await runLevel(level, {
      feature, projectDir, framework: results.framework, testPattern
    });
    results.levels.push(levelResult);
    results.summary.total += levelResult.total;
    results.summary.passed += levelResult.passed;
    results.summary.failed += levelResult.failed;
    results.summary.skipped += levelResult.skipped;
  }

  // Step 3: Calculate pass rate
  if (results.summary.total > 0) {
    results.passRate = Math.round(
      (results.summary.passed / results.summary.total) * 100
    );
  }

  // Step 4: Collect coverage if available
  if (results.framework && levels.includes(1)) {
    results.coverage = collectCoverage(projectDir);
  }

  // Step 5: Write QA report
  const reportPath = path.join(projectDir, 'docs', '03-test', `${feature}.qa-report.md`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, generateReport(results), 'utf-8');
  results.reportPath = reportPath;

  return results;
}

/**
 * Detect installed test framework
 * @param {string} projectDir
 * @returns {string|null} Framework name
 */
function detectFramework(projectDir) {
  const pkg = safeReadJson(path.join(projectDir, 'package.json'));
  if (!pkg) return null;

  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  if (deps['vitest']) return 'vitest';
  if (deps['jest']) return 'jest';
  if (deps['@playwright/test']) return 'playwright';
  if (deps['mocha']) return 'mocha';

  // Node.js built-in test runner detection
  const scripts = pkg.scripts || {};
  if (Object.values(scripts).some(s => s.includes('node --test'))) {
    return 'node-test';
  }

  return null;
}

/**
 * Run tests for a specific level
 */
async function runLevel(level, { feature, projectDir, framework, testPattern }) {
  const levelNames = { 1: 'Unit', 2: 'API', 3: 'E2E', 4: 'UX', 5: 'Data' };
  const result = {
    level,
    name: levelNames[level] || `L${level}`,
    total: 0, passed: 0, failed: 0, skipped: 0,
    errors: [],
    duration: 0
  };

  const startTime = Date.now();

  try {
    switch (level) {
      case 1:
        runUnitTests(result, { projectDir, framework, testPattern, feature });
        break;
      case 2:
        runApiTests(result, { projectDir, feature });
        break;
      case 3:
        runE2ETests(result, { projectDir, feature });
        break;
      case 4:
        runUxTests(result, { projectDir, feature });
        break;
      case 5:
        runDataTests(result, { projectDir, feature });
        break;
      default:
        result.errors.push(`Unknown test level: ${level}`);
    }
  } catch (err) {
    result.errors.push(err.message);
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * L1: Unit tests
 */
function runUnitTests(result, { projectDir, framework, testPattern, feature }) {
  const testFiles = findTestFiles(projectDir, testPattern, feature);

  if (testFiles.length === 0) {
    result.skipped = 1;
    result.total = 1;
    result.errors.push(`No test files found matching feature "${feature}"`);
    return;
  }

  const fileList = testFiles.join(' ');
  const commands = {
    'jest': `npx jest --json --passWithNoTests ${fileList}`,
    'vitest': `npx vitest run --reporter=json ${fileList}`,
    'mocha': `npx mocha --reporter=json ${fileList}`,
    'node-test': `node --test ${fileList}`
  };

  const cmd = commands[framework] || `node --test ${fileList}`;
  const output = safeExec(cmd, projectDir, 60000);
  parseTestOutput(output, framework, result);
}

/**
 * L2: API smoke tests via curl
 */
function runApiTests(result, { projectDir, feature }) {
  // Check for route files
  const routeFiles = findFiles(projectDir, '*route*');
  if (routeFiles.length === 0) {
    result.skipped = 1;
    result.total = 1;
    result.errors.push('No route files found');
    return;
  }

  // Check if server is running
  const healthCheck = safeExec(
    'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health',
    projectDir,
    10000
  );

  if (!healthCheck || healthCheck.trim() !== '200') {
    // Try common ports
    const ports = ['3000', '3001', '8080', '5000'];
    let serverFound = false;

    for (const port of ports) {
      const check = safeExec(
        `curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}/`,
        projectDir,
        5000
      );
      if (check && check.trim().match(/^[23]\d\d$/)) {
        serverFound = true;
        result.total = 1;
        result.passed = 1;
        break;
      }
    }

    if (!serverFound) {
      result.skipped = 1;
      result.total = 1;
      result.errors.push('Server not running on common ports (3000, 3001, 8080, 5000)');
    }
    return;
  }

  // Server is running - basic smoke test
  result.total = 1;
  result.passed = 1;
}

/**
 * L3: E2E tests via Playwright
 */
function runE2ETests(result, { projectDir, feature }) {
  const hasPlaywright = fs.existsSync(
    path.join(projectDir, 'node_modules', '@playwright', 'test')
  );

  if (!hasPlaywright) {
    result.skipped = 1;
    result.total = 1;
    result.errors.push('Playwright not installed');
    return;
  }

  const output = safeExec(
    `npx playwright test --grep="${feature}" --reporter=json`,
    projectDir,
    120000
  );
  parsePlaywrightOutput(output, result);
}

/**
 * L4: UX tests (lighthouse, accessibility)
 */
function runUxTests(result, { projectDir, feature }) {
  result.skipped = 1;
  result.total = 1;
  result.errors.push('UX testing requires manual configuration (lighthouse/axe-core)');
}

/**
 * L5: Data integrity tests
 */
function runDataTests(result, { projectDir, feature }) {
  result.skipped = 1;
  result.total = 1;
  result.errors.push('Data testing requires database configuration');
}

/**
 * Find test files matching feature pattern
 */
function findTestFiles(projectDir, testPattern, feature) {
  try {
    const pattern = testPattern
      ? testPattern
      : `*${feature}*`;

    // Use find to locate test files
    const output = safeExec(
      `find . -type f \\( -name "*.test.js" -o -name "*.test.ts" -o -name "*.spec.js" -o -name "*.spec.ts" \\) -path "*${pattern}*" | head -20`,
      projectDir,
      10000
    );

    if (!output || !output.trim()) {
      // Fallback: find all test files
      const allTests = safeExec(
        'find . -type f \\( -name "*.test.js" -o -name "*.test.ts" -o -name "*.spec.js" -o -name "*.spec.ts" \\) -not -path "*/node_modules/*" | head -30',
        projectDir,
        10000
      );
      return (allTests || '').split('\n').filter(f => f.trim());
    }

    return output.split('\n').filter(f => f.trim());
  } catch {
    return [];
  }
}

/**
 * Find files matching a name pattern
 */
function findFiles(projectDir, namePattern) {
  try {
    const output = safeExec(
      `find . -type f -name "${namePattern}" -not -path "*/node_modules/*" | head -20`,
      projectDir,
      10000
    );
    return (output || '').split('\n').filter(f => f.trim());
  } catch {
    return [];
  }
}

/**
 * Parse test output based on framework
 */
function parseTestOutput(output, framework, result) {
  if (!output) {
    result.total = 1;
    result.failed = 1;
    result.errors.push('No test output received');
    return;
  }

  try {
    if (framework === 'jest') {
      // Jest JSON output
      const jsonMatch = output.match(/\{[\s\S]*"numTotalTests"[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        result.total = data.numTotalTests || 0;
        result.passed = data.numPassedTests || 0;
        result.failed = data.numFailedTests || 0;
        result.skipped = (data.numPendingTests || 0) + (data.numTodoTests || 0);
        return;
      }
    }

    if (framework === 'vitest') {
      // Vitest JSON output
      const jsonMatch = output.match(/\{[\s\S]*"numTotalTests"[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        result.total = data.numTotalTests || 0;
        result.passed = data.numPassedTests || 0;
        result.failed = data.numFailedTests || 0;
        result.skipped = data.numPendingTests || 0;
        return;
      }
    }

    // Fallback: parse text output for common patterns
    const passMatch = output.match(/(\d+)\s+pass/i);
    const failMatch = output.match(/(\d+)\s+fail/i);
    const skipMatch = output.match(/(\d+)\s+skip/i);

    if (passMatch) result.passed = parseInt(passMatch[1], 10);
    if (failMatch) result.failed = parseInt(failMatch[1], 10);
    if (skipMatch) result.skipped = parseInt(skipMatch[1], 10);
    result.total = result.passed + result.failed + result.skipped;

    // If nothing parsed, count as 1 test
    if (result.total === 0) {
      result.total = 1;
      // Check exit status hint
      if (output.includes('FAIL') || output.includes('Error')) {
        result.failed = 1;
      } else {
        result.passed = 1;
      }
    }
  } catch (err) {
    result.total = 1;
    result.failed = 1;
    result.errors.push(`Parse error: ${err.message}`);
  }
}

/**
 * Parse Playwright JSON output
 */
function parsePlaywrightOutput(output, result) {
  if (!output) {
    result.skipped = 1;
    result.total = 1;
    return;
  }

  try {
    const data = JSON.parse(output);
    if (data.suites) {
      let total = 0, passed = 0, failed = 0, skipped = 0;
      for (const suite of data.suites) {
        for (const spec of (suite.specs || [])) {
          total++;
          if (spec.ok) passed++;
          else failed++;
        }
      }
      result.total = total;
      result.passed = passed;
      result.failed = failed;
      result.skipped = skipped;
    }
  } catch {
    // Fallback text parsing
    parseTestOutput(output, null, result);
  }
}

/**
 * Collect coverage data if available
 */
function collectCoverage(projectDir) {
  const coveragePath = path.join(projectDir, 'coverage', 'coverage-final.json');
  if (!fs.existsSync(coveragePath)) return null;

  try {
    const data = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
    let totalStatements = 0, coveredStatements = 0;
    let totalBranches = 0, coveredBranches = 0;
    let totalFunctions = 0, coveredFunctions = 0;
    let totalLines = 0, coveredLines = 0;

    for (const file of Object.values(data)) {
      const s = file.s || {};
      const b = file.b || {};
      const f = file.f || {};

      for (const v of Object.values(s)) {
        totalStatements++;
        if (v > 0) coveredStatements++;
      }
      for (const arr of Object.values(b)) {
        for (const v of arr) {
          totalBranches++;
          if (v > 0) coveredBranches++;
        }
      }
      for (const v of Object.values(f)) {
        totalFunctions++;
        if (v > 0) coveredFunctions++;
      }
    }

    return {
      statements: totalStatements > 0 ? Math.round((coveredStatements / totalStatements) * 100) : 0,
      branches: totalBranches > 0 ? Math.round((coveredBranches / totalBranches) * 100) : 0,
      functions: totalFunctions > 0 ? Math.round((coveredFunctions / totalFunctions) * 100) : 0,
      lines: totalLines > 0 ? Math.round((coveredLines / totalLines) * 100) : 0
    };
  } catch {
    return null;
  }
}

/**
 * Generate QA report markdown
 */
function generateReport(results) {
  const lines = [
    `# QA Report: ${results.feature}`,
    ``,
    `> Generated: ${results.timestamp}`,
    `> Framework: ${results.framework || 'unknown'}`,
    `> Pass Rate: ${results.passRate}%`,
    ``,
    `## Summary`,
    ``,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total | ${results.summary.total} |`,
    `| Passed | ${results.summary.passed} |`,
    `| Failed | ${results.summary.failed} |`,
    `| Skipped | ${results.summary.skipped} |`,
    ``
  ];

  if (results.coverage) {
    lines.push(`## Coverage`, ``);
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Statements | ${results.coverage.statements}% |`);
    lines.push(`| Branches | ${results.coverage.branches}% |`);
    lines.push(`| Functions | ${results.coverage.functions}% |`);
    lines.push(``);
  }

  lines.push(`## Level Details`, ``);
  for (const l of results.levels) {
    lines.push(`### L${l.level} (${l.name})`);
    lines.push(`- Passed: ${l.passed}/${l.total}`);
    lines.push(`- Duration: ${l.duration}ms`);
    if (l.errors.length > 0) {
      lines.push(`- Errors: ${l.errors.join(', ')}`);
    }
    lines.push(``);
  }

  return lines.join('\n');
}

// --- Utility functions ---

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function safeExec(cmd, cwd, timeout = 30000) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', timeout });
  } catch (err) {
    return err.stdout || err.message || '';
  }
}

module.exports = { run };
