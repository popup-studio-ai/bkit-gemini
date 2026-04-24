/**
 * TC-114: SessionStart slim default + verbose env var (v2.0.5+)
 *
 * Verifies that the SessionStart hook emits a single-line systemMessage by
 * default (Issue #25655 mitigation) and restores the verbose multi-section
 * body when BKIT_SESSION_START_VERBOSE=true.
 *
 * Plan ref: docs/01-plan/features/bkit-v2.0.5-finalization.plan.md G2/G3/G7
 * Design ref: docs/02-design/features/bkit-v2.0.5-finalization.design.md §2,5
 * Carrier complement to: tc113-session-start-duplication-defense.js
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');
const { PLUGIN_ROOT, assert, assertEqual } = require('../test-utils');

const HOOK_PATH = path.join(PLUGIN_ROOT, 'hooks', 'scripts', 'session-start.js');

function runHook(env = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-tc114-'));
  try {
    const r = spawnSync('node', [HOOK_PATH], {
      cwd: tmp,
      env: { ...process.env, BKIT_PLUGIN_ROOT: PLUGIN_ROOT, ...env },
      encoding: 'utf-8',
      timeout: 8000
    });
    return { stdout: r.stdout || '', status: r.status };
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* non-fatal */ }
  }
}

function parseSingleJsonLine(stdout) {
  const lines = stdout.trim().split('\n').filter(l => l.trim());
  if (lines.length !== 1) {
    throw new Error(`Expected 1 line, got ${lines.length}`);
  }
  return JSON.parse(lines[0]);
}

const tests = [
  {
    name: 'TC114-01: default mode (verbose unset) → systemMessage is single line header only',
    fn: () => {
      // Explicitly unset to defeat caller env.
      const r = runHook({ BKIT_SESSION_START_VERBOSE: '' });
      assertEqual(r.status, 0, `hook exit must be 0 (got ${r.status})`);
      const obj = parseSingleJsonLine(r.stdout);
      assert(typeof obj.systemMessage === 'string', 'systemMessage must be string');
      // Slim contract: exactly one '\n'-free line. Allow trailing newline-less form.
      assert(!obj.systemMessage.includes('\n'),
        `slim systemMessage must NOT contain newline (Issue #25655 mitigation). Got:\n${obj.systemMessage}`);
      assert(obj.systemMessage.includes('bkit Vibecoding Kit'),
        'slim header must contain "bkit Vibecoding Kit"');
      assert(obj.systemMessage.includes('Level:'),
        'slim header must contain "Level:" suffix');
    }
  },
  {
    name: 'TC114-02: default slim mode does NOT include verbose body markers',
    fn: () => {
      const r = runHook({ BKIT_SESSION_START_VERBOSE: '' });
      const obj = parseSingleJsonLine(r.stdout);
      const verboseMarkers = [
        '# bkit Session Start',
        '## PDCA Core Rules',
        '## Available Skills',
        '## Agent Auto-Triggers',
        '## Natural Language Feature Request'
      ];
      for (const m of verboseMarkers) {
        assert(!obj.systemMessage.includes(m),
          `slim mode must NOT contain "${m}" (verbose body marker)`);
      }
    }
  },
  {
    name: 'TC114-03: stdout is exactly 1 JSON line (Issue #25655 hook contract preserved)',
    fn: () => {
      const r = runHook({ BKIT_SESSION_START_VERBOSE: '' });
      const lines = r.stdout.trim().split('\n').filter(l => l.trim());
      assertEqual(lines.length, 1, `hook stdout must be exactly 1 line (got ${lines.length})`);
    }
  },
  {
    name: 'TC114-04: verbose=true restores full multi-section body',
    fn: () => {
      const r = runHook({ BKIT_SESSION_START_VERBOSE: 'true' });
      assertEqual(r.status, 0, `hook exit must be 0 (got ${r.status})`);
      const obj = parseSingleJsonLine(r.stdout);
      assert(obj.systemMessage.includes('# bkit Session Start'),
        'verbose mode must contain "# bkit Session Start" heading');
      assert(obj.systemMessage.includes('## PDCA Core Rules'),
        'verbose mode must contain PDCA Core Rules section');
      assert(obj.systemMessage.includes('## Available Skills'),
        'verbose mode must contain Available Skills section');
      // Verbose body is multi-line by design.
      assert(obj.systemMessage.split('\n').length > 10,
        `verbose body should have >10 lines (got ${obj.systemMessage.split('\n').length})`);
    }
  },
  {
    name: 'TC114-05: header references current bkit version (manifest cross-reference)',
    fn: () => {
      const r = runHook({ BKIT_SESSION_START_VERBOSE: '' });
      const obj = parseSingleJsonLine(r.stdout);
      const manifest = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'gemini-extension.json'), 'utf-8'));
      // Header should mention "v{manifest.version}" — accepts "v2.0.5" or "v2.0.x"-style format.
      const expected = `v${manifest.version}`;
      assert(obj.systemMessage.includes(expected),
        `slim header must reference manifest version "${expected}" (got: ${obj.systemMessage})`);
    }
  },
  {
    name: 'TC114-06: metadata.version === manifest version',
    fn: () => {
      const r = runHook({ BKIT_SESSION_START_VERBOSE: '' });
      const obj = parseSingleJsonLine(r.stdout);
      const manifest = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'gemini-extension.json'), 'utf-8'));
      // metadata is only present on the normal path, not the fallback path.
      if (obj.metadata) {
        assertEqual(obj.metadata.version, manifest.version,
          `metadata.version must equal manifest.version (${manifest.version})`);
      }
    }
  }
];

module.exports = { tests };
