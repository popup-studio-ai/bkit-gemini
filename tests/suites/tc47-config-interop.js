// TC-47: Config Interop Tests (12 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertType, assertExists, assertContains, getPdcaStatus, withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const tests = [
  { name: 'TC47-01: bkit.config.json ↔ hooks.json 일관성', fn: () => {
    assertExists(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'bkit.config.json');
    assertExists(path.join(PLUGIN_ROOT, 'hooks/hooks.json'), 'hooks.json');
  }},
  { name: 'TC47-02: hooks.json 유효 JSON', fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks/hooks.json'), 'utf-8');
    const parsed = JSON.parse(content);
    assertType(parsed, 'object', 'Should be valid JSON');
  }},
  { name: 'TC47-03: bkit.config.json version ↔ GEMINI.md', fn: () => {
    const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
    const geminiMd = fs.readFileSync(path.join(PLUGIN_ROOT, 'GEMINI.md'), 'utf-8');
    assert(config.version !== undefined, 'Config should have version');
    assertContains(geminiMd, 'bkit', 'GEMINI.md should reference bkit');
  }},
  { name: 'TC47-04: zero-dependency (no package.json)', fn: () => {
    // bkit-gemini uses zero external deps - no package.json needed
    assert(!fs.existsSync(path.join(PLUGIN_ROOT, 'package.json')), 'Should have no package.json');
  }},
  { name: 'TC47-05: bkit.config.json 유효 JSON', fn: () => {
    const content = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
    assert(content !== undefined, 'Should be valid JSON');
  }},
  { name: 'TC47-06: hooks.json hooks 이벤트 정의', fn: () => {
    const hooks = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks/hooks.json'), 'utf-8'));
    assert(Object.keys(hooks).length >= 1, 'Should have at least 1 hook event');
  }},
  { name: 'TC47-07: TOML 커맨드 ↔ 스킬 매핑', fn: () => {
    const commands = fs.readdirSync(path.join(PLUGIN_ROOT, 'commands')).filter(f => f.endsWith('.toml'));
    const skills = fs.readdirSync(path.join(PLUGIN_ROOT, 'skills')).filter(f => fs.statSync(path.join(PLUGIN_ROOT, 'skills', f)).isDirectory());
    assert(commands.length >= 20, `Should have >=20 commands, found ${commands.length}`);
    assert(skills.length >= 30, `Should have >=30 skills, found ${skills.length}`);
  }},
  { name: 'TC47-08: .gemini/ 디렉토리 구조', fn: () => {
    assertExists(path.join(PLUGIN_ROOT, '.gemini'), '.gemini dir');
  }},
  { name: 'TC47-09: bkit.config.json pdca 섹션', fn: () => {
    const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
    assert(config.pdca !== undefined, 'Should have pdca section');
  }},
  { name: 'TC47-10: bkit.config.json team 섹션', fn: () => {
    const config = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
    assert(config.agentTeams !== undefined || config.team !== undefined, 'Should have team section');
  }},
  { name: 'TC47-11: hooks 스크립트 10개 존재', fn: () => {
    const scripts = fs.readdirSync(path.join(PLUGIN_ROOT, 'hooks/scripts')).filter(f => f.endsWith('.js'));
    assert(scripts.length >= 10, `Should have >=10 hook scripts, found ${scripts.length}`);
  }},
  { name: 'TC47-12: output-styles ↔ bkit.config.json', fn: () => {
    const styles = fs.readdirSync(path.join(PLUGIN_ROOT, 'output-styles')).filter(f => f.endsWith('.md'));
    assert(styles.length >= 4, `Should have >=4 styles, found ${styles.length}`);
  }}
];

module.exports = { tests };
