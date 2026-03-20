#!/usr/bin/env node
/**
 * Version Sync Script
 * Ensures all version strings across the project match bkit.config.json
 *
 * Usage: node scripts/sync-version.js [--check-only]
 * @version 2.0.0
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function getConfigVersion() {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'bkit.config.json'), 'utf-8'));
  return config.version;
}

function syncFile(filePath, pattern, replacement) {
  if (!fs.existsSync(filePath)) return { file: filePath, status: 'not_found' };

  const content = fs.readFileSync(filePath, 'utf-8');
  const newContent = content.replace(pattern, replacement);

  if (content === newContent) return { file: filePath, status: 'unchanged' };

  if (!process.argv.includes('--check-only')) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
  }
  return { file: filePath, status: 'updated' };
}

function main() {
  const version = getConfigVersion();
  const checkOnly = process.argv.includes('--check-only');

  console.log(`Version: ${version}${checkOnly ? ' (check only)' : ''}`);

  const results = [];

  // gemini-extension.json
  results.push(syncFile(
    path.join(ROOT, 'gemini-extension.json'),
    /"version":\s*"[^"]+"/,
    `"version": "${version}"`
  ));

  // hooks/hooks.json description
  results.push(syncFile(
    path.join(ROOT, 'hooks', 'hooks.json'),
    /bkit Vibecoding Kit v[\d.]+(-\w+\.?\d*)?/,
    `bkit Vibecoding Kit v${version}`
  ));

  // Report results
  let errors = 0;
  for (const r of results) {
    const icon = r.status === 'updated' ? '~' : r.status === 'unchanged' ? '=' : '!';
    console.log(`  [${icon}] ${path.relative(ROOT, r.file)}: ${r.status}`);
    if (r.status === 'not_found') errors++;
  }

  console.log(`\nDone. ${results.filter(r => r.status === 'updated').length} files updated.`);
  if (errors > 0) console.log(`WARNING: ${errors} files not found.`);

  process.exit(checkOnly && errors > 0 ? 1 : 0);
}

main();
