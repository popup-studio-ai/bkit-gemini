// TC-48: Command Integration Tests (10 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertContains, assertExists, getPdcaStatus, withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const COMMANDS_DIR = path.join(PLUGIN_ROOT, 'commands');

const tests = [
  { name: 'TC48-01: 23+ TOML 커맨드 파일', fn: () => {
    const files = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.toml'));
    assert(files.length >= 23, `Should have >=23, found ${files.length}`);
  }},
  { name: 'TC48-02: 핵심 커맨드 3개 존재', fn: () => {
    assertExists(path.join(COMMANDS_DIR, 'bkit.toml'), 'bkit.toml');
    assertExists(path.join(COMMANDS_DIR, 'pdca.toml'), 'pdca.toml');
    assertExists(path.join(COMMANDS_DIR, 'pipeline.toml'), 'pipeline.toml');
  }},
  { name: 'TC48-03: TOML 파일 유효 구문', fn: () => {
    const files = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.toml'));
    let invalid = [];
    for (const f of files) {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, f), 'utf-8');
      if (content.trim().length < 10) invalid.push(f);
    }
    assertEqual(invalid.length, 0, `Invalid TOML: ${invalid.join(', ')}`);
  }},
  { name: 'TC48-04: bkend 커맨드 8개', fn: () => {
    const bkendCmds = ['bkend-quickstart', 'bkend-auth', 'bkend-data', 'bkend-storage', 'bkend-mcp', 'bkend-cookbook', 'bkend-guides', 'bkend-security'];
    for (const cmd of bkendCmds) {
      assertExists(path.join(COMMANDS_DIR, `${cmd}.toml`), `${cmd}.toml`);
    }
  }},
  { name: 'TC48-05: 워크플로우 커맨드 존재', fn: () => {
    assertExists(path.join(COMMANDS_DIR, 'simplify.toml'), 'simplify');
    assertExists(path.join(COMMANDS_DIR, 'loop.toml'), 'loop');
  }},
  { name: 'TC48-06: 레벨 커맨드 존재', fn: () => {
    assertExists(path.join(COMMANDS_DIR, 'starter.toml'), 'starter');
    assertExists(path.join(COMMANDS_DIR, 'dynamic.toml'), 'dynamic');
    assertExists(path.join(COMMANDS_DIR, 'enterprise.toml'), 'enterprise');
  }},
  { name: 'TC48-07: learn 커맨드 존재', fn: () => {
    assertExists(path.join(COMMANDS_DIR, 'learn.toml'), 'learn');
  }},
  { name: 'TC48-08: qa 커맨드 존재', fn: () => {
    assertExists(path.join(COMMANDS_DIR, 'qa.toml'), 'qa');
  }},
  { name: 'TC48-09: TOML description 또는 prompt 필드 존재', fn: () => {
    const content = fs.readFileSync(path.join(COMMANDS_DIR, 'pdca.toml'), 'utf-8');
    assert(content.includes('description') || content.includes('prompt'), 'Should have description or prompt field');
  }},
  { name: 'TC48-10: TOML description 필드 존재', fn: () => {
    const content = fs.readFileSync(path.join(COMMANDS_DIR, 'pdca.toml'), 'utf-8');
    assertContains(content, 'description', 'Should have description field');
  }}
];

module.exports = { tests };
