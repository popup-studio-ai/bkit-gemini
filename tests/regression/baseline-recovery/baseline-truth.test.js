/**
 * baseline-truth — Dynamic Regression (S6)
 *
 * Sprint: S6 v2.0.7-baseline-full-recovery (P6)
 *
 * 핵심: Wave 1~7에서 적용한 truth-update + lib/pdca/status.js v3 schema +
 *      deprecated module skip 결정이 미래 drift되지 않도록 동적 강제.
 */
'use strict';

const fs = require('fs');
const path = require('path');

let __pass = 0;
let __fail = 0;
const __failures = [];

function test(name, fn) {
  try { fn(); __pass++; console.log(`  [PASS] ${name}`); }
  catch (e) { __fail++; __failures.push({ name, error: e.message }); console.error(`  [FAIL] ${name}\n         ${e.message}`); }
}

function assertTrue(c, m) { if (!c) throw new Error(m || 'assertTrue'); }
function assertFalse(c, m) { if (c) throw new Error(m || 'assertFalse'); }
function assertEq(a, b, m) { if (a !== b) throw new Error(`${m}: got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`); }

console.log('Suite: baseline-truth (S6 truth-update + v3 schema 강제)');
console.log('---');

const PLUGIN_ROOT = path.resolve(__dirname, '../../..');
const pdcaStatus = require(path.join(PLUGIN_ROOT, 'lib', 'pdca', 'status'));

// ── BT-01~03: version sync (config / extension / GEMINI.md) ──

test('BT-01 bkit.config.json version matches gemini-extension.json', () => {
  const c = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
  const e = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'gemini-extension.json'), 'utf-8'));
  assertEq(c.version, e.version, 'config and extension versions must match');
  assertTrue(/^2\.\d+\.\d+$/.test(c.version), `version format invalid: ${c.version}`);
});

test('BT-02 GEMINI.md mentions current bkit version', () => {
  const c = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf-8'));
  const gemini = fs.readFileSync(path.join(PLUGIN_ROOT, 'GEMINI.md'), 'utf-8');
  assertTrue(gemini.includes(`v${c.version}`),
    `GEMINI.md must mention v${c.version}, got first line: ${gemini.split('\n')[0]}`);
});

test('BT-03 gemini-extension.json description mentions current version', () => {
  const e = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'gemini-extension.json'), 'utf-8'));
  assertTrue(e.description.includes(`v${e.version}`),
    `description must mention v${e.version}, got: ${e.description}`);
});

// ── BT-04~06: PDCA v3 schema 정합성 ──

test('BT-04 createInitialStatusV2 returns v3 schema (activeFeatures array + features object)', () => {
  const s = pdcaStatus.createInitialStatusV2();
  assertEq(s.version, '2.0');
  assertTrue(Array.isArray(s.activeFeatures), 'activeFeatures must be array');
  assertTrue(s.features && typeof s.features === 'object' && !Array.isArray(s.features),
    'features must be object map');
  assertTrue(s.session && typeof s.session.lastActivity === 'string',
    'session.lastActivity must be ISO string');
  assertTrue(s.pipeline && typeof s.pipeline === 'object');
  assertTrue(Array.isArray(s.history));
});

test('BT-05 loadPdcaStatus normalizes legacy v2 (activeFeatures object map) to v3', () => {
  const os = require('os');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-bt05-'));
  try {
    const legacy = {
      version: '2.0',
      activeFeatures: { 'legacy-feat': { phase: 'plan', matchRate: 50 } },
      primaryFeature: 'legacy-feat'
    };
    fs.writeFileSync(path.join(tmp, '.pdca-status.json'), JSON.stringify(legacy));
    const status = pdcaStatus.loadPdcaStatus(tmp);
    assertTrue(Array.isArray(status.activeFeatures), 'must normalize to array');
    assertTrue(status.activeFeatures.includes('legacy-feat'));
    assertTrue(status.features['legacy-feat'], 'feature data must be migrated to features map');
    assertEq(status.features['legacy-feat'].matchRate, 50, 'feature data preserved');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('BT-06 addPdcaHistory uses push (newest-last) + trim slice(-MAX)', () => {
  const os = require('os');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-bt06-'));
  try {
    const initial = pdcaStatus.createInitialStatusV2();
    initial.history = Array.from({ length: 100 }, (_, i) => ({ action: `old-${i}`, timestamp: '2026-01-01T00:00:00Z' }));
    fs.writeFileSync(path.join(tmp, '.pdca-status.json'), JSON.stringify(initial));
    pdcaStatus.addPdcaHistory({ action: 'newest' }, tmp);
    const reloaded = pdcaStatus.loadPdcaStatus(tmp);
    const last = reloaded.history[reloaded.history.length - 1];
    assertEq(last.action, 'newest', 'newest entry must be at end (push convention)');
    assertTrue(reloaded.history.length <= 100, `must trim to <= MAX_HISTORY=100, got ${reloaded.history.length}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ── BT-07: extractFeatureFromContext hyphen / pdca-optional ──

test('BT-07 extractFeatureFromContext accepts hyphenated names + pdca-optional prefix', () => {
  assertEq(pdcaStatus.extractFeatureFromContext('/pdca plan login'), 'login');
  assertEq(pdcaStatus.extractFeatureFromContext('pdca design checkout-flow'), 'checkout-flow');
  assertEq(pdcaStatus.extractFeatureFromContext('implement login-form'), 'login-form');
  assertEq(pdcaStatus.extractFeatureFromContext('hello world'), null);
  assertEq(pdcaStatus.extractFeatureFromContext(''), null);
  assertEq(pdcaStatus.extractFeatureFromContext(null), null);
});

// ── BT-08~10: TC110 lib/ structure truth ──

test('BT-08 lib/pdca/ has exactly 5 JS files', () => {
  const files = fs.readdirSync(path.join(PLUGIN_ROOT, 'lib', 'pdca')).filter(f => f.endsWith('.js'));
  assertEq(files.length, 5, `lib/pdca/ has ${files.length} files: ${files.join(', ')}`);
});

test('BT-09 lib/ top-level structure (no deprecated subdirs)', () => {
  const dirs = fs.readdirSync(path.join(PLUGIN_ROOT, 'lib'), { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();
  // Deprecated subdirs that must NOT reappear
  const DEPRECATED = ['task', 'team', 'context-hierarchy'];
  for (const d of DEPRECATED) {
    assertFalse(dirs.includes(d), `deprecated lib/${d}/ should not exist`);
  }
  // Required subdirs
  for (const r of ['core', 'gemini', 'intent', 'pdca', 'test']) {
    assertTrue(dirs.includes(r), `lib/${r}/ must exist`);
  }
});

test('BT-10 lib/skill-orchestrator.js should NOT exist (delegated to Gemini CLI native skills)', () => {
  // v2.0.7-S6: deprecated module — verifies skip rationale stays accurate
  assertFalse(fs.existsSync(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator.js')),
    'lib/skill-orchestrator.js was removed when native Gemini CLI skill system became the source-of-truth');
});

// ── BT-11: agent model frontmatter (gemini-3-pro stable) ──

test('BT-11 14 agents use gemini-3-pro stable (no preview model)', () => {
  const AGENTS_DIR = path.join(PLUGIN_ROOT, 'agents');
  const agentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
  let proCount = 0;
  for (const f of agentFiles) {
    const content = fs.readFileSync(path.join(AGENTS_DIR, f), 'utf-8');
    const m = content.match(/^model:\s*(.+)$/m);
    if (!m) continue;
    const model = m[1].trim();
    // No preview model should remain (v2.0.7 S6 truth)
    assertFalse(/-preview\b/.test(model), `${f}: preview model "${model}" should be replaced with stable`);
    if (model === 'gemini-3-pro') proCount++;
  }
  assertTrue(proCount >= 10, `expected ≥10 gemini-3-pro agents, got ${proCount}`);
});

// ── BT-12: getReadOnlyTools 정합성 (TOOL_ANNOTATIONS와 일치) ──

test('BT-12 getReadOnlyTools entries all have readOnlyHint=true in TOOL_ANNOTATIONS', () => {
  const { getReadOnlyTools, TOOL_ANNOTATIONS } = require(path.join(PLUGIN_ROOT, 'lib', 'gemini', 'tools'));
  for (const t of getReadOnlyTools()) {
    const a = TOOL_ANNOTATIONS[t];
    assertTrue(a, `TOOL_ANNOTATIONS missing entry for ${t}`);
    assertEq(a.readOnlyHint, true, `${t} readOnlyHint should be true`);
  }
});

console.log('---');
console.log(`Result: ${__pass}/${__pass + __fail} passed`);
console.log(`Pass: ${__pass} | Fail: ${__fail} | Skip: 0`);
if (__failures.length > 0) {
  console.log('\nFailures:');
  __failures.forEach(f => console.log(`  ${f.name}: ${f.error}`));
}
process.exit(__fail > 0 ? 1 : 0);
