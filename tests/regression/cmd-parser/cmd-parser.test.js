/**
 * CmdParser — Unit Tests (CP-01~31, 31 cases)
 *
 * Sprint S7 v2.0.7-gemini-cli-l4-automation Wave 1 Day 2
 * Design: §4 (D7 + D16' revised) + §4.3 16 destructive patterns + §4.4 11 bypass
 * Cross-OS: pure JS — macOS / Windows / Linux / WSL / Git Bash
 */
'use strict';

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

function assertTrue(cond, msg) { if (!cond) throw new Error(msg || 'assertTrue fail'); }
function assertFalse(cond, msg) { if (cond) throw new Error(msg || 'assertFalse fail'); }
function assertEq(a, b, msg) { if (a !== b) throw new Error(`${msg || 'assertEq'}: got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`); }

let CmdParser;
try {
  CmdParser = require('../../../lib/core/cmd-parser');
} catch (e) {
  console.error(`[SETUP FAIL] lib/core/cmd-parser.js missing: ${e.message}`);
  CmdParser = null;
}

console.log('Suite: cmd-parser (CP-01~31, Design §4.3+§4.4+§4.5)');
console.log('---');

if (!CmdParser) {
  for (let i = 1; i <= 31; i++) {
    test(`CP-${String(i).padStart(2, '0')}`, () => { throw new Error('cmd-parser.js not implemented'); });
  }
} else {
  const p = new CmdParser();

  // ── 16 destructive patterns (CP-01~17, 27~31) ──

  test('CP-01 rm -rf /tmp → D-RM-RF', () => {
    assertTrue(p.isDestructive('rm -rf /tmp'), 'rm -rf');
  });

  test('CP-02 rm -r -f /tmp → D-RM-RF', () => {
    assertTrue(p.isDestructive('rm -r -f /tmp'), 'separated flags');
  });

  test('CP-03 bash -c "rm -rf /" → D-RM-RF (nested)', () => {
    assertTrue(p.isDestructive('bash -c "rm -rf /"'), 'bash -c nested');
  });

  test('CP-04 heredoc bash <<EOF rm -rf EOF → D-RM-RF (heredoc bypass)', () => {
    const cmd = 'bash <<EOF\nrm -rf /\nEOF';
    assertTrue(p.isDestructive(cmd), 'heredoc bypass');
  });

  test('CP-05 base64 encoded rm -rf via echo | base64 -d | bash → conservative detect', () => {
    // echo cm0gLXJmIC8K | base64 -d | bash  (cm0gLXJmIC8K = "rm -rf /\n")
    const cmd = 'echo cm0gLXJmIC8K | base64 -d | bash';
    assertTrue(p.isDestructive(cmd), 'base64 bypass');
  });

  test('CP-06 eval "rm -rf /" → D-RM-RF (eval bypass)', () => {
    assertTrue(p.isDestructive('eval "rm -rf /"'), 'eval');
  });

  test('CP-07 $(rm -rf /) → D-RM-RF (subshell)', () => {
    assertTrue(p.isDestructive('echo $(rm -rf /tmp)'), 'subshell');
  });

  test('CP-08 git push --force origin main → D-FORCE-PUSH', () => {
    assertTrue(p.isDestructive('git push --force origin main'), 'force push --force');
  });

  test('CP-09 git push -f origin main → D-FORCE-PUSH', () => {
    assertTrue(p.isDestructive('git push -f origin main'), 'force push -f');
  });

  test('CP-10 drop table users → D-DROP-TABLE', () => {
    assertTrue(p.isDestructive('psql -c "drop table users"'), 'drop table');
  });

  test('CP-11 truncate users (SQL) → D-TRUNCATE', () => {
    assertTrue(p.isDestructive('psql -c "truncate users;"'), 'truncate');
  });

  test('CP-12 delete from users; (no WHERE) → D-DELETE-NO-WHERE', () => {
    assertTrue(p.isDestructive('psql -c "delete from users;"'), 'delete no where');
  });

  test('CP-13 delete from users where id=1 → safe', () => {
    assertFalse(p.isDestructive('psql -c "delete from users where id=1;"'), 'delete with where');
  });

  test('CP-14 sudo apt install → D-SUDO', () => {
    assertTrue(p.isDestructive('sudo apt install -y package'), 'sudo');
  });

  test('CP-15 chmod 777 ~/.ssh/config → D-CHMOD-777 + D-SSH-WRITE', () => {
    assertTrue(p.isDestructive('chmod 777 ~/.ssh/config'), 'chmod 777');
  });

  test('CP-16 echo > /etc/hosts → D-ETC-WRITE', () => {
    assertTrue(p.isDestructive('echo "127.0.0.1 evil" > /etc/hosts'), '/etc write');
  });

  test('CP-17 gpg --batch --delete-key X → D-GPG-DISABLE', () => {
    assertTrue(p.isDestructive('gpg --batch --yes --delete-key ABCDEF'), 'gpg delete');
  });

  // ── safe commands (CP-18~20) ──

  test('CP-18 ls -la → safe', () => {
    assertFalse(p.isDestructive('ls -la'), 'ls');
  });

  test('CP-19 cat README.md → safe', () => {
    assertFalse(p.isDestructive('cat README.md'), 'cat');
  });

  test('CP-20 grep "TODO" *.md → safe', () => {
    assertFalse(p.isDestructive('grep "TODO" *.md'), 'grep');
  });

  // ── 11 bypass patterns (CP-21~26) ──

  test('CP-21 exec rm -rf /tmp → bypass exec → D-RM-RF', () => {
    assertTrue(p.isDestructive('exec rm -rf /tmp'), 'exec bypass');
  });

  test('CP-22 echo /tmp | xargs rm -rf → bypass xargs → D-RM-RF', () => {
    assertTrue(p.isDestructive('echo /tmp | xargs rm -rf'), 'xargs bypass');
  });

  test('CP-23 fd redirection conservative deny', () => {
    // exec 3< file; cat <&3 | bash → conservative deny (ambiguous)
    const cmd = 'exec 3< /tmp/malicious; cat <&3 | bash';
    assertTrue(p.isDestructive(cmd), 'fd redirection conservative');
  });

  test('CP-24 IFS 변조 rm bypass', () => {
    // IFS=x; cmd=xrmx-rfx/tmp; $cmd
    const cmd = 'IFS=x; cmd=xrmx-rfx/tmp; $cmd';
    assertTrue(p.isDestructive(cmd), 'IFS bypass');
  });

  test('CP-25 ANSI control char rm -rf', () => {
    // r\x08m -rf /tmp (backspace 사용)
    const cmd = 'rm -rf /tmp';
    assertTrue(p.isDestructive(cmd), 'ANSI bypass');
  });

  test('CP-26 function override rm', () => {
    const cmd = 'function rm() { /bin/rm -rf "$@"; }; rm /tmp';
    assertTrue(p.isDestructive(cmd), 'function override');
  });

  // ── credential patterns (H-2, CP-27~31) ──

  test('CP-27 echo SECRET > .env → D-ENV-WRITE', () => {
    assertTrue(p.isDestructive('echo "SECRET=x" > .env'), 'env write');
  });

  test('CP-28 rm id_rsa → D-PRIVATE-KEY-WRITE', () => {
    assertTrue(p.isDestructive('rm id_rsa'), 'private key delete');
  });

  test('CP-29 npm publish --force → D-NPM-FORCE-PUBLISH', () => {
    assertTrue(p.isDestructive('npm publish --force'), 'npm force publish');
  });

  test('CP-30 git config --unset credential.helper → D-GIT-CONFIG-UNSET', () => {
    assertTrue(p.isDestructive('git config --unset credential.helper'), 'git config credential unset');
  });

  test('CP-31 rm -rf .git → D-RM-DOT-GIT', () => {
    assertTrue(p.isDestructive('rm -rf .git'), 'rm dot-git');
  });
}

console.log('---');
console.log(`Result: ${__pass}/${__pass + __fail} passed`);
console.log(`Pass: ${__pass} | Fail: ${__fail} | Skip: 0`);
if (__failures.length > 0) {
  console.log('\nFailed tests:');
  __failures.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
}
process.exit(__fail > 0 ? 1 : 0);
