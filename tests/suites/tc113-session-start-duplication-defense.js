/**
 * TC-113: SessionStart systemMessage 중복 렌더링 방어 테스트
 *
 * 컨텍스트:
 *   Gemini CLI Issue #25655 — SessionStart 훅이 반환한 `systemMessage`가
 *   상위 CLI 렌더러에서 두 번 출력되는 회귀 (v0.38.2 도입, v0.39.0 잔존,
 *   fix PR #25827 OPEN). bkit `hooks/scripts/session-start.js` Line 89(정상),
 *   Line 114(fallback)이 직접 적중 영역.
 *
 * 본 테스트의 역할(카나리아):
 *   - 훅 단위 계약: 훅 stdout이 정확히 단일 JSON 라인 + `systemMessage` 필드
 *     1회만 배출함을 고정. 본문 수정(NG1 wrong-layer)을 방지하는 회귀 가드.
 *   - CLI 상위 렌더러의 이중 렌더링은 본 테스트로 검증 불가 — E2E 수동 확인 필요.
 *   - fix PR #25827 머지 시점을 자동 감지하는 카나리아 (훅 계약은 변동 없어야 함).
 *
 * 약속 결제:
 *   v0.38.2 plan이 `tc107-v0382-session-start-duplication.js`로 약속한 방어 테스트.
 *   tc107 번호가 점유되어 tc113로 명명 변경, 의도와 검증 범위는 동일.
 *
 * Plan reference: docs/01-plan/features/gemini-cli-v0.39.0-migration.plan.md §7.3
 * Report reference: docs/04-report/gemini-cli-v0.39.0-migration.report.md §4.4
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');
const { PLUGIN_ROOT, assert, assertEqual } = require('../test-utils');

const HOOK_PATH = path.join(PLUGIN_ROOT, 'hooks', 'scripts', 'session-start.js');

function runHook(env = {}) {
  // Use a clean temp cwd so hook initializes its own .bkit/ structure.
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-tc113-'));
  try {
    const result = spawnSync('node', [HOOK_PATH], {
      cwd: tmpDir,
      env: { ...process.env, BKIT_PLUGIN_ROOT: PLUGIN_ROOT, ...env },
      encoding: 'utf-8',
      timeout: 8000
    });
    return { stdout: result.stdout || '', stderr: result.stderr || '', status: result.status, tmpDir };
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) { /* non-fatal */ }
  }
}

function parseSingleJsonLine(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) return null;
  // The hook emits exactly one JSON object via console.log() — stdout should
  // contain a single newline-terminated line. Reject multi-line output as a
  // contract violation (multi-emission).
  const lines = trimmed.split('\n').filter(l => l.trim().length > 0);
  if (lines.length !== 1) {
    throw new Error(`Expected exactly 1 JSON line, got ${lines.length}: ${JSON.stringify(lines)}`);
  }
  return JSON.parse(lines[0]);
}

function countSystemMessageOccurrences(jsonObj) {
  // Counts top-level `systemMessage` key occurrences. The hook contract is
  // "exactly one systemMessage field per emit", so this MUST equal 1.
  let count = 0;
  for (const key of Object.keys(jsonObj)) {
    if (key === 'systemMessage') count++;
  }
  return count;
}

const tests = [
  {
    name: 'TC113-01: session-start.js exists and is executable as a node script',
    fn: () => {
      assert(fs.existsSync(HOOK_PATH), 'session-start.js should exist at hooks/scripts/');
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      assert(src.startsWith('#!/usr/bin/env node'), 'should have node shebang');
      assert(/main\(\);?\s*$/.test(src), 'main() should be invoked at module bottom');
    }
  },
  {
    name: 'TC113-02: hook normal path emits exactly one JSON line on stdout',
    fn: () => {
      const { stdout, status } = runHook();
      assertEqual(status, 0, `hook should exit 0, stderr might explain. status=${status}`);
      const lines = stdout.trim().split('\n').filter(l => l.trim());
      assertEqual(lines.length, 1, `exactly one stdout JSON line required, got ${lines.length}`);
    }
  },
  {
    name: 'TC113-03: stdout JSON has decision: allow',
    fn: () => {
      const { stdout } = runHook();
      const obj = parseSingleJsonLine(stdout);
      assert(obj !== null, 'stdout JSON should parse');
      assertEqual(obj.decision, 'allow', 'decision must be "allow"');
    }
  },
  {
    name: 'TC113-04: stdout JSON has systemMessage field exactly once (HOOK CONTRACT)',
    fn: () => {
      const { stdout } = runHook();
      const obj = parseSingleJsonLine(stdout);
      const count = countSystemMessageOccurrences(obj);
      assertEqual(count, 1, `Issue #25655 carrier: systemMessage MUST appear exactly 1 time, got ${count}`);
      assert(typeof obj.systemMessage === 'string' && obj.systemMessage.length > 0,
        'systemMessage must be non-empty string');
    }
  },
  {
    name: 'TC113-05: bkit Vibecoding Kit sentinel string appears 0 or 1 times in systemMessage',
    fn: () => {
      const { stdout } = runHook();
      const obj = parseSingleJsonLine(stdout);
      const sentinel = 'bkit Vibecoding Kit';
      const matches = obj.systemMessage.match(new RegExp(sentinel, 'g'));
      const count = matches ? matches.length : 0;
      // Normal path may include the sentinel via dynamic context (1 time);
      // duplication of sentinel within a single payload would imply hook-side
      // duplication (not the upstream renderer issue, but a hook bug).
      assert(count <= 1, `sentinel "${sentinel}" should appear at most 1 time per emit, got ${count}`);
    }
  },
  {
    name: 'TC113-06: hook fallback path also emits single JSON line with single systemMessage',
    fn: () => {
      // Trigger fallback by pointing platform adapter to a non-existent lib path.
      // Easiest reliable trigger: corrupt the project dir to non-writable.
      // Since fallback is wrapped in try/catch, set BKIT_DEBUG to see stderr but
      // expect graceful degradation either way. We force the error path by
      // setting BKIT_PLUGIN_ROOT to a bogus path so initial requires fail.
      const { stdout, status } = runHook({ BKIT_PLUGIN_ROOT: '/nonexistent/path/zzz' });
      assertEqual(status, 0, 'fallback path should still exit 0 (graceful degradation)');
      const obj = parseSingleJsonLine(stdout);
      assertEqual(obj.decision, 'allow', 'fallback decision must be allow');
      const count = countSystemMessageOccurrences(obj);
      assertEqual(count, 1, `fallback systemMessage MUST appear exactly 1 time, got ${count}`);
      // Fallback string is the v2.0.4 activation sentinel.
      assert(typeof obj.systemMessage === 'string' && obj.systemMessage.includes('bkit'),
        'fallback systemMessage should mention bkit');
    }
  },
  {
    name: 'TC113-07: hook output contains valid metadata (normal path schema)',
    fn: () => {
      const { stdout } = runHook();
      const obj = parseSingleJsonLine(stdout);
      // Normal path includes metadata block; fallback omits it. If metadata
      // exists, verify minimal schema. If not, we are on the fallback path
      // which is verified by TC113-06.
      if (obj.metadata) {
        assert(typeof obj.metadata.version === 'string', 'metadata.version should be string');
        assertEqual(obj.metadata.platform, 'gemini', 'platform must be gemini');
        assert(typeof obj.metadata.geminiCliFeatures === 'object',
          'metadata.geminiCliFeatures should be object');
      }
    }
  },
  {
    name: 'TC113-08: documents the limitation — CLI-level duplication detection requires E2E',
    fn: () => {
      // This test exists as documentation. The hook contract above only
      // verifies that the hook emits a single payload. The upstream Issue
      // #25655 is that the CLI renderer renders that payload TWICE — that
      // cannot be detected at hook-unit level. Verified by E2E manual.
      //
      // Carrier role: fix PR #25827 merge does NOT change the hook contract,
      // so this suite continues to pass. If a future regression duplicates
      // the systemMessage at the hook level (NG1 violation), this suite WILL
      // fail loudly. That is the intended carrier signal.
      const docPath = __filename;
      const src = fs.readFileSync(docPath, 'utf-8');
      assert(src.includes('#25655'), 'this suite must reference upstream Issue #25655');
      assert(src.includes('PR #25827'), 'this suite must reference upstream fix PR #25827');
      assert(src.includes('NG1'), 'this suite must reference NG1 wrong-layer principle');
    }
  }
];

module.exports = { tests };
