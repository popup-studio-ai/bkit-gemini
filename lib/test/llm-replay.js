/**
 * llm-replay.js — 3-mode LLM record/replay framework for CI stub mode
 *
 * Sprint: S1 v2.0.7-ci-stub-mode (P3)
 * Design: docs/01-plan/sprints/v2.0.7-ci-stub-mode-design.md
 * RCA:    docs/03-analysis/v2.0.7-ci-stub-mode-rca.md
 * Spec:   AC-CS1~CS7
 *
 * Responsibilities:
 *   1. Compute deterministic request hash (SHA256, allowlisted env, sorted)
 *   2. Mode-aware dispatch:
 *        stub   → fixture lookup (fail-fast on miss)
 *        record → live spawn + fixture write
 *        live   → live spawn only (default)
 *   3. Spawn helper for `gemini` CLI invocation
 *   4. Fixture I/O with schema {hash, captured_at, gemini_cli_version, bkit_version, request, response}
 *
 * Cross-OS: pure JS (crypto, fs, path, child_process). macOS / Windows / Linux 동일.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const FIXTURE_DIR = path.resolve(__dirname, '..', '..', 'tests', 'fixtures', 'llm-responses');

// env vars that affect bkit/gemini behavior and MUST be in hash payload.
// Any other env var (PATH, HOME, USER, SSH_* etc.) is excluded — they should not change response semantics.
const HASH_ENV_ALLOWLIST = Object.freeze([
  'BKIT_SESSION_START_VERBOSE',
  'GEMINI_CLI_TRUST_WORKSPACE',
  'GEMINI_CLI_VERSION'
]);

const VALID_MODES = Object.freeze(['stub', 'record', 'live']);

/**
 * Read BKIT_TEST_MODE with validation. Default: 'live'.
 * @returns {'stub'|'record'|'live'}
 */
function getTestMode() {
  const raw = (process.env.BKIT_TEST_MODE || 'live').toLowerCase().trim();
  return VALID_MODES.includes(raw) ? raw : 'live';
}

/**
 * Load bkit package.json version (cached).
 */
let _bkitVersion = null;
function getBkitVersion() {
  if (_bkitVersion) return _bkitVersion;
  try {
    const pkgPath = path.resolve(__dirname, '..', '..', 'package.json');
    _bkitVersion = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')).version || 'unknown';
  } catch (e) {
    _bkitVersion = 'unknown';
  }
  return _bkitVersion;
}

/**
 * Compute deterministic request hash.
 * Inputs: CLI args (order preserved), allowlisted env (sorted), cwd basename, bkit version.
 * @param {{ args: string[], env?: Object, cwd?: string }} request
 * @returns {string} 16-char hex
 */
function computeRequestHash(request) {
  if (!request || !Array.isArray(request.args)) {
    throw new Error('computeRequestHash: request.args must be an array');
  }
  const env = {};
  const sortedAllowlist = [...HASH_ENV_ALLOWLIST].sort();
  for (const k of sortedAllowlist) {
    if (request.env && Object.prototype.hasOwnProperty.call(request.env, k)) {
      env[k] = String(request.env[k]);
    }
  }
  const cwdRel = request.cwd ? path.basename(request.cwd) : path.basename(process.cwd());
  const payload = JSON.stringify({
    args: request.args,
    env,
    cwd_rel: cwdRel,
    bkit_version: getBkitVersion()
  });
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

/**
 * Compute fixture file path from label + hash.
 */
function getFixturePath(label, hash) {
  const safeLabel = (label || 'unlabeled').replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(FIXTURE_DIR, `${safeLabel}-${hash}.json`);
}

/**
 * Load fixture JSON. Throws if invalid schema.
 */
function loadFixture(fixturePath) {
  const raw = fs.readFileSync(fixturePath, 'utf-8');
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || !parsed.response || !parsed.hash) {
    throw new Error(`fixture schema invalid: ${fixturePath}`);
  }
  return parsed;
}

/**
 * Save fixture with full schema.
 */
function saveFixture(fixturePath, fixture) {
  if (!fs.existsSync(FIXTURE_DIR)) {
    fs.mkdirSync(FIXTURE_DIR, { recursive: true });
  }
  fs.writeFileSync(fixturePath, JSON.stringify(fixture, null, 2) + '\n', 'utf-8');
}

/**
 * Internal: spawn `gemini` CLI and return { stdout, stderr, exitCode }.
 * Pure live execution — no fixture interaction.
 * Injected via _runLiveImpl for testability.
 */
let _runLiveImpl = function defaultRunLive(request) {
  return new Promise((resolve) => {
    const args = request.args || [];
    const env = { ...process.env, ...(request.env || {}) };
    const cwd = request.cwd || process.cwd();
    const timeout = request.timeout || 60000;

    const child = spawn('gemini', args, { env, cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      try { child.kill('SIGTERM'); } catch (e) { /* ignore */ }
    }, timeout);

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: code === null ? -1 : code });
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ stdout: '', stderr: err.message, exitCode: -1 });
    });
  });
};

/**
 * Test-only: override the live runner (used by unit tests to avoid real spawn).
 */
function _setRunLiveImpl(fn) {
  if (typeof fn !== 'function') throw new Error('_setRunLiveImpl: fn must be a function');
  _runLiveImpl = fn;
}

/**
 * Get current Gemini CLI version (best-effort, used for fixture meta).
 */
function _detectGeminiVersion() {
  try {
    const { detectVersion } = require('../gemini/version');
    return detectVersion().raw || 'unknown';
  } catch (e) {
    return 'unknown';
  }
}

/**
 * Main entrypoint: execute or replay an LLM-bound CLI invocation.
 * @param {Object} request
 * @param {string[]} request.args
 * @param {Object}  [request.env]
 * @param {string}  [request.cwd]
 * @param {number}  [request.timeout]  default 60000ms
 * @param {string}  [request.label]    fixture label (e.g. 'L3-1-onetwothree')
 * @returns {Promise<{stdout, stderr, exitCode, fromFixture, hash, mode}>}
 */
async function recordOrReplay(request) {
  if (!request || !Array.isArray(request.args)) {
    throw new Error('recordOrReplay: request.args is required (string[])');
  }
  const mode = getTestMode();
  const hash = computeRequestHash(request);
  const fixturePath = getFixturePath(request.label, hash);

  if (mode === 'stub') {
    if (!fs.existsSync(fixturePath)) {
      const err = new Error(
        `[bkit-stub] No fixture for label="${request.label || 'unlabeled'}" hash=${hash}.\n` +
        `  Expected file: ${fixturePath}\n` +
        `  To capture: BKIT_TEST_MODE=record <re-run the same test>\n` +
        `  To bypass:  BKIT_TEST_MODE=live <re-run>`
      );
      err.code = 'BKIT_STUB_MISS';
      err.fixturePath = fixturePath;
      err.hash = hash;
      throw err;
    }
    const fixture = loadFixture(fixturePath);
    return { ...fixture.response, fromFixture: true, hash, mode };
  }

  if (mode === 'record') {
    const live = await _runLiveImpl(request);
    saveFixture(fixturePath, {
      hash,
      captured_at: new Date().toISOString(),
      gemini_cli_version: _detectGeminiVersion(),
      bkit_version: getBkitVersion(),
      request: {
        args: request.args,
        env: Object.fromEntries(
          HASH_ENV_ALLOWLIST
            .filter(k => request.env && k in request.env)
            .map(k => [k, String(request.env[k])])
        ),
        cwd_rel: path.basename(request.cwd || process.cwd())
      },
      response: live
    });
    return { ...live, fromFixture: false, hash, mode };
  }

  // mode === 'live' (default)
  const live = await _runLiveImpl(request);
  return { ...live, fromFixture: false, hash, mode };
}

/**
 * List all fixtures in tests/fixtures/llm-responses/.
 * @returns {string[]} basenames
 */
function listFixtures() {
  if (!fs.existsSync(FIXTURE_DIR)) return [];
  return fs.readdirSync(FIXTURE_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();
}

module.exports = {
  recordOrReplay,
  computeRequestHash,
  getTestMode,
  listFixtures,
  getFixturePath,
  loadFixture,
  saveFixture,
  HASH_ENV_ALLOWLIST,
  VALID_MODES,
  FIXTURE_DIR,
  _setRunLiveImpl  // test-only injection point
};
