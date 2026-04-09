/**
 * Gap Analyzer
 * Compares design document specifications against actual implementation.
 * Checks structural (file existence) and functional (code content) match.
 *
 * @module mcp/tools/gap-analyzer
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Analyze gaps between design document and implementation
 * @param {object} params
 * @param {string} params.feature - Feature name
 * @param {string} params.projectDir - Project root directory
 * @param {string} params.designPath - Path to design document
 * @param {string} [params.extensionPath] - bkit extension path
 * @returns {object} Analysis results with match rate and gap list
 */
function analyze({ feature, projectDir, designPath, extensionPath }) {
  const result = {
    feature,
    matchRate: 0,
    gaps: [],
    structural: { matched: 0, total: 0 },
    functional: { matched: 0, total: 0 }
  };

  // Step 1: Read design document
  const designContent = safeReadFile(designPath);
  if (!designContent) {
    result.gaps.push({
      type: 'missing',
      severity: 'critical',
      description: `Design document not found: ${designPath}`,
      file: designPath,
      line: 0
    });
    return result;
  }

  const designSpec = parseDesignDocument(designContent);

  // Step 2: Structural match - check file existence
  for (const expectedFile of designSpec.files) {
    result.structural.total++;
    const filePath = path.join(projectDir, expectedFile.path);

    if (fs.existsSync(filePath)) {
      result.structural.matched++;
    } else {
      result.gaps.push({
        type: 'structural',
        severity: 'high',
        description: `Expected file missing: ${expectedFile.path}`,
        file: expectedFile.path,
        line: 0,
        expected: expectedFile.purpose
      });
    }
  }

  // Step 3: Functional match - check for meaningful content
  for (const expectedFunc of designSpec.functions) {
    result.functional.total++;

    // Resolve file path for the function
    const targetFile = expectedFunc.file
      ? path.join(projectDir, expectedFunc.file)
      : findFileContaining(projectDir, expectedFunc.name);

    if (!targetFile || !fs.existsSync(targetFile)) {
      result.gaps.push({
        type: 'functional',
        severity: 'high',
        description: `Expected function/class not found: ${expectedFunc.name}`,
        file: expectedFunc.file || 'unknown',
        line: 0,
        expected: expectedFunc.signature
      });
      continue;
    }

    const content = fs.readFileSync(targetFile, 'utf-8');
    const lines = content.split('\n');
    const foundIndex = lines.findIndex(line =>
      line.includes(expectedFunc.name) &&
      (line.includes('function') || line.includes('class') ||
       line.includes('=>') || line.includes('async') ||
       line.includes('module.exports') || line.includes('export'))
    );

    if (foundIndex >= 0) {
      result.functional.matched++;
    } else {
      result.gaps.push({
        type: 'functional',
        severity: 'high',
        description: `Expected function/class not found: ${expectedFunc.name}`,
        file: path.relative(projectDir, targetFile),
        line: 0,
        expected: expectedFunc.signature
      });
    }
  }

  // Step 4: Check for empty/stub files
  for (const expectedFile of designSpec.files) {
    const filePath = path.join(projectDir, expectedFile.path);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf-8').trim();
    const meaningfulLines = content.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed &&
        !trimmed.startsWith('//') &&
        !trimmed.startsWith('/*') &&
        !trimmed.startsWith('*') &&
        trimmed !== '{' &&
        trimmed !== '}' &&
        trimmed !== '';
    });

    if (meaningfulLines.length < 3) {
      result.gaps.push({
        type: 'stub',
        severity: 'medium',
        description: `File appears to be a stub (${meaningfulLines.length} meaningful lines): ${expectedFile.path}`,
        file: expectedFile.path,
        line: 0,
        expected: 'Substantial implementation'
      });
    }
  }

  // Step 5: Calculate match rate
  // Weighted: Structural 40%, Functional 60%
  const structRate = result.structural.total > 0
    ? result.structural.matched / result.structural.total
    : 1;
  const funcRate = result.functional.total > 0
    ? result.functional.matched / result.functional.total
    : 1;

  result.matchRate = Math.round(
    (structRate * 0.4 + funcRate * 0.6) * 100
  );

  return result;
}

/**
 * Parse design document to extract expected files and functions
 * @param {string} content - Design document markdown content
 * @returns {object} Parsed specification { files, functions }
 */
function parseDesignDocument(content) {
  const spec = { files: [], functions: [] };
  const seenFiles = new Set();
  const seenFunctions = new Set();

  // Extract file paths from markdown lists and code blocks
  // Patterns: - `path/to/file.js` — description
  //           - path/to/file.js (description)
  //           * path/to/file.js
  const filePattern = /^[-*]\s+`?([a-zA-Z0-9_\-/.]+\.[a-zA-Z]{1,4})`?\s*[-—(]?\s*(.*)/gm;
  let match;
  while ((match = filePattern.exec(content)) !== null) {
    const filePath = match[1];
    if (filePath.match(/\.(js|ts|jsx|tsx|py|go|rs|json|yaml|yml|md)$/) && !seenFiles.has(filePath)) {
      seenFiles.add(filePath);
      spec.files.push({ path: filePath, purpose: (match[2] || '').replace(/[)]/g, '').trim() });
    }
  }

  // Extract file paths from code blocks (```\npath/to/file.js\n```)
  const codeBlockFilePattern = /^([a-zA-Z0-9_\-/.]+\.[a-zA-Z]{1,4})\s*$/gm;
  while ((match = codeBlockFilePattern.exec(content)) !== null) {
    const filePath = match[1];
    if (filePath.match(/\.(js|ts|jsx|tsx)$/) && !seenFiles.has(filePath)) {
      seenFiles.add(filePath);
      spec.files.push({ path: filePath, purpose: '' });
    }
  }

  // Extract function/class signatures from code blocks
  const funcPattern = /(?:function|async\s+function|class)\s+(\w+)/g;
  while ((match = funcPattern.exec(content)) !== null) {
    const name = match[1];
    // Skip common words that aren't actual identifiers
    if (['if', 'for', 'while', 'switch', 'return', 'new', 'Object', 'Array', 'String', 'Number', 'Boolean'].includes(name)) continue;
    if (!seenFunctions.has(name)) {
      seenFunctions.add(name);
      spec.functions.push({ name, file: '', signature: match[0] });
    }
  }

  // Extract arrow function exports: const name = async (...) => { ... }
  const arrowPattern = /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(/g;
  while ((match = arrowPattern.exec(content)) !== null) {
    const name = match[1];
    if (!seenFunctions.has(name) && name.length > 2) {
      seenFunctions.add(name);
      spec.functions.push({ name, file: '', signature: match[0] });
    }
  }

  return spec;
}

/**
 * Search project for a file containing a specific identifier
 * @param {string} projectDir - Project root
 * @param {string} identifier - Function/class name to find
 * @returns {string|null} File path or null
 */
function findFileContaining(projectDir, identifier) {
  try {
    const output = execSync(
      `grep -r "${identifier}" --include="*.js" --include="*.ts" -l | head -1`,
      { cwd: projectDir, encoding: 'utf-8', timeout: 10000 }
    );
    const file = output.trim().split('\n')[0];
    return file ? path.join(projectDir, file) : null;
  } catch {
    return null;
  }
}

/**
 * Safely read a file
 */
function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

module.exports = { analyze };
