/**
 * CheckpointManager — Unit Tests (CK-01~08)
 *
 * Sprint: S7 v2.0.7-gemini-cli-l4-automation (Wave 1 Day 3)
 * Spec: AC-T5 (checkpoint + rollback 3 시나리오)
 * Design: §3.5 + §3.5.6 CK-01~08
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

let __pass = 0;
let __fail = 0;
const __failures = [];

function test(name, fn) {
  try {
    fn();
    __pass++;
    console.log(`  [PASS] ${name}`);
  } catch (e) {
    __fail++;
    __failures.push({ name, error: e.message });
    console.error(`  [FAIL] ${name}\n         ${e.message}`);
  }
}

function assertTrue(c, m) { if (!c) throw new Error(m || 'assertTrue'); }
function assertFalse(c, m) { if (c) throw new Error(m || 'assertFalse'); }
function assertEq(a, b, m) { if (a !== b) throw new Error(`${m}: got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`); }

function setupTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-cp-'));
}
function teardown(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* */ }
}

let CM;
try { CM = require('../../../lib/core/checkpoint'); } catch (e) {
  console.error('[SETUP FAIL]:', e.message);
  CM = null;
}

console.log('Suite: checkpoint (CK-01~08)');
console.log('---');

if (!CM) {
  for (let i = 1; i <= 8; i++) test(`CK-${String(i).padStart(2, '0')}`, () => { throw new Error('checkpoint.js missing'); });
} else {
  test('CK-01 create + rollback normal', () => {
    const dir = setupTmpDir();
    try {
      const f = path.join(dir, 'foo.txt');
      fs.writeFileSync(f, 'before');
      const cm = new CM(dir);
      const id = cm.create('Edit', [f]);
      // modify
      fs.writeFileSync(f, 'after');
      // rollback
      const r = cm.rollback(id, { force: true });
      assertTrue(r.success, `rollback fail: ${JSON.stringify(r)}`);
      assertEq(fs.readFileSync(f, 'utf-8'), 'before', 'content restored');
    } finally { teardown(dir); }
  });

  test('CK-02 create + later modified + rollback → conflict (no force)', () => {
    const dir = setupTmpDir();
    try {
      const f = path.join(dir, 'foo.txt');
      fs.writeFileSync(f, 'before');
      const cm = new CM(dir);
      const id = cm.create('Edit', [f]);
      // wait + modify (mtime change)
      const past = new Date(Date.now() + 5000);
      fs.writeFileSync(f, 'newer');
      fs.utimesSync(f, past, past);
      const r = cm.rollback(id);
      assertFalse(r.success, 'should detect conflict');
      assertTrue(r.conflicts.length > 0, 'has conflict report');
    } finally { teardown(dir); }
  });

  test('CK-03 file deleted after checkpoint + rollback (force) → recreate', () => {
    const dir = setupTmpDir();
    try {
      const f = path.join(dir, 'foo.txt');
      fs.writeFileSync(f, 'original');
      const cm = new CM(dir);
      const id = cm.create('Edit', [f]);
      fs.unlinkSync(f);
      const r = cm.rollback(id, { force: true });
      assertTrue(r.success, `rollback after delete: ${JSON.stringify(r)}`);
      assertEq(fs.readFileSync(f, 'utf-8'), 'original', 'recreated');
    } finally { teardown(dir); }
  });

  test('CK-04 list most recent', () => {
    const dir = setupTmpDir();
    try {
      const cm = new CM(dir);
      const f = path.join(dir, 'a.txt');
      fs.writeFileSync(f, 'x');
      const id1 = cm.create('Edit', [f]);
      // Ensure timestamp differs
      const past = new Date(Date.now() - 60000).toISOString();
      const cpPath = path.join(dir, '.bkit', 'checkpoints', `${id1}.json`);
      const cp = JSON.parse(fs.readFileSync(cpPath, 'utf-8'));
      cp.timestamp = past;
      fs.writeFileSync(cpPath, JSON.stringify(cp));
      const id2 = cm.create('Edit', [f]);
      const list = cm.list({ limit: 5 });
      assertEq(list.length, 2, 'list count');
      assertEq(list[0].id, id2, 'newest first');
    } finally { teardown(dir); }
  });

  test('CK-05 get(nonexistent) → null', () => {
    const dir = setupTmpDir();
    try {
      const cm = new CM(dir);
      assertEq(cm.get('not-found-id'), null);
    } finally { teardown(dir); }
  });

  test('CK-06 purge older than 91 days', () => {
    const dir = setupTmpDir();
    try {
      const cm = new CM(dir);
      const f = path.join(dir, 'a.txt');
      fs.writeFileSync(f, 'x');
      const id = cm.create('Edit', [f]);
      // Backdate to 100 days ago
      const cpPath = path.join(dir, '.bkit', 'checkpoints', `${id}.json`);
      const cp = JSON.parse(fs.readFileSync(cpPath, 'utf-8'));
      cp.timestamp = new Date(Date.now() - 100 * 86400000).toISOString();
      fs.writeFileSync(cpPath, JSON.stringify(cp));
      const purged = cm.purge(90);
      assertEq(purged, 1, 'one purged');
    } finally { teardown(dir); }
  });

  test('CK-07 multi-file transaction', () => {
    const dir = setupTmpDir();
    try {
      const cm = new CM(dir);
      const files = ['a.txt', 'b.txt', 'c.txt'].map(n => path.join(dir, n));
      files.forEach(f => fs.writeFileSync(f, 'orig'));
      const id = cm.create('Edit', files);
      files.forEach(f => fs.writeFileSync(f, 'changed'));
      const r = cm.rollback(id, { force: true });
      assertTrue(r.success, `transaction: ${JSON.stringify(r)}`);
      assertEq(r.restored.length, 3, 'all restored');
      files.forEach(f => assertEq(fs.readFileSync(f, 'utf-8'), 'orig'));
    } finally { teardown(dir); }
  });

  test('CK-08 capture file that does not exist (will-be-created)', () => {
    const dir = setupTmpDir();
    try {
      const cm = new CM(dir);
      const f = path.join(dir, 'new.txt');
      // Capture before creating
      const id = cm.create('Write', [f]);
      fs.writeFileSync(f, 'created');
      // Rollback should delete (file did not exist at capture)
      const r = cm.rollback(id, { force: true });
      assertTrue(r.success, `${JSON.stringify(r)}`);
      assertFalse(fs.existsSync(f), 'deleted');
    } finally { teardown(dir); }
  });
}

console.log('---');
console.log(`Result: ${__pass}/${__pass + __fail} passed`);
console.log(`Pass: ${__pass} | Fail: ${__fail} | Skip: 0`);
if (__failures.length > 0) {
  console.log('\nFailures:');
  __failures.forEach(f => console.log(`  ${f.name}: ${f.error}`));
}
process.exit(__fail > 0 ? 1 : 0);
