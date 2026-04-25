/**
 * TC-115: v0.39.1+ Headless Trust Enforcement 우회 검증
 *
 * 컨텍스트:
 *   Gemini CLI v0.39.1 (PR #25814)이 헤드리스 모드에서 untrusted 워크스페이스
 *   실행을 FatalUntrustedWorkspaceError로 차단. bkit `mcp/bkit-server.js`의
 *   `executeAgent` Line 1117 spawn 경로가 정면 적중. 우회: env 주입.
 *
 *   ⚠ Iterate 단계에서 발견된 정정:
 *   초기 조사(gemini-researcher)가 보고한 변수명 `GEMINI_TRUST_WORKSPACE='1'`은
 *   틀렸다. v0.39.1 실측에서 CLI 자체가 알려주는 정확한 변수명은
 *   `GEMINI_CLI_TRUST_WORKSPACE='true'` (CLI prefix 포함). QA Phase L3 시나리오
 *   B에서 untrusted dir 시뮬레이션 후 차단 메시지에서 직접 확인.
 *
 * 본 테스트의 역할 (카나리아):
 *   - bkit-server가 자식 gemini 프로세스에 GEMINI_CLI_TRUST_WORKSPACE='true'를
 *     무조건 전파하는지 단위 검증.
 *   - 미래 spawn 경로 추가 시 trust env 누락을 자동 감지.
 *   - testedVersions와 feature flag의 일관성 자동 감시.
 *
 * 한계:
 *   - 실제 gemini CLI 차단/우회 동작은 E2E QA 단계에서 gemini -p로 검증.
 *   - 본 테스트는 bkit-server.js 코드 계약 (env 빌더에 GEMINI_CLI_TRUST_WORKSPACE)
 *     만 검증. v0.39.0 이하에서는 env가 무영향 → 시나리오 모두 PASS 유지.
 *
 * Plan reference: docs/01-plan/features/gemini-cli-v0.39.1-migration.plan.md §5 Phase 2
 * Design reference: docs/02-design/features/gemini-cli-v0.39.1-migration.design.md §2.4
 */
const path = require('path');
const fs = require('fs');
const { PLUGIN_ROOT, assert } = require('../test-utils');

const SERVER_PATH = path.join(PLUGIN_ROOT, 'mcp', 'bkit-server.js');
const VERSION_PATH = path.join(PLUGIN_ROOT, 'lib', 'gemini', 'version.js');
const CONFIG_PATH = path.join(PLUGIN_ROOT, 'bkit.config.json');

const tests = [
  {
    name: 'TC115-01: bkit-server.js exists and is readable',
    fn: () => {
      assert(fs.existsSync(SERVER_PATH), 'mcp/bkit-server.js must exist');
      const content = fs.readFileSync(SERVER_PATH, 'utf8');
      assert(content.length > 0, 'bkit-server.js must not be empty');
    }
  },
  {
    name: 'TC115-02: bkit-server.js sets GEMINI_CLI_TRUST_WORKSPACE in spawn env',
    fn: () => {
      const content = fs.readFileSync(SERVER_PATH, 'utf8');
      assert(
        content.includes('env.GEMINI_CLI_TRUST_WORKSPACE'),
        'env builder must set GEMINI_CLI_TRUST_WORKSPACE for v0.39.1+ trust propagation'
      );
    }
  },
  {
    name: 'TC115-03: env.GEMINI_CLI_TRUST_WORKSPACE is set to "true" (CLI accepted value)',
    fn: () => {
      const content = fs.readFileSync(SERVER_PATH, 'utf8');
      const re = /env\.GEMINI_CLI_TRUST_WORKSPACE\s*=\s*['"]true['"]/;
      assert(re.test(content), 'GEMINI_CLI_TRUST_WORKSPACE must be assigned the string "true"');
    }
  },
  {
    name: 'TC115-04: GEMINI_CLI_TRUST_WORKSPACE assignment precedes spawn() call',
    fn: () => {
      const content = fs.readFileSync(SERVER_PATH, 'utf8');
      const trustIdx = content.indexOf('env.GEMINI_CLI_TRUST_WORKSPACE');
      const spawnIdx = content.indexOf("spawn('gemini'");
      assert(trustIdx > 0, 'GEMINI_CLI_TRUST_WORKSPACE must be set');
      assert(spawnIdx > 0, "spawn('gemini' must exist");
      assert(trustIdx < spawnIdx, 'env must be set before spawn()');
    }
  },
  {
    name: 'TC115-05: assignment is unconditional (no version flag-gate)',
    fn: () => {
      const content = fs.readFileSync(SERVER_PATH, 'utf8');
      const lines = content.split('\n');
      const idx = lines.findIndex(l => l.includes('env.GEMINI_CLI_TRUST_WORKSPACE'));
      assert(idx > 0, 'GEMINI_CLI_TRUST_WORKSPACE line must exist');
      // 직전 5줄 내에 hasHeadlessTrustEnforcement 같은 게이트가 없어야 함
      // (의도: env는 v0.39.0 이하에서 무영향이므로 무조건 주입이 version-safe)
      const window = lines.slice(Math.max(0, idx - 5), idx).join('\n');
      assert(
        !window.includes('hasHeadlessTrustEnforcement'),
        'GEMINI_CLI_TRUST_WORKSPACE must NOT be flag-gated (env is no-op below v0.39.1)'
      );
    }
  },
  {
    name: 'TC115-06: bkit.config.json compatibility.testedVersions includes 0.39.1',
    fn: () => {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      assert(cfg.compatibility, 'bkit.config.json must have compatibility block');
      assert(Array.isArray(cfg.compatibility.testedVersions), 'compatibility.testedVersions must be array');
      assert(cfg.compatibility.testedVersions.includes('0.39.1'), 'testedVersions must include "0.39.1"');
    }
  },
  {
    name: 'TC115-07: lib/gemini/version.js exports v0.39.1+ feature flags',
    fn: () => {
      const content = fs.readFileSync(VERSION_PATH, 'utf8');
      const flags = [
        'hasHeadlessTrustEnforcement',
        'hasToolsCoreAllowlist',
        'hasShellRecursiveValidation',
        'hasSkipTrustFlag',
      ];
      flags.forEach(flag => {
        assert(content.includes(flag), `version.js must export ${flag}`);
        const re = new RegExp(`${flag}\\s*:\\s*isVersionAtLeast\\(['"]0\\.39\\.1['"]\\)`);
        assert(re.test(content), `${flag} must be gated by isVersionAtLeast('0.39.1')`);
      });
    }
  },
  {
    name: 'TC115-08: design intent comment precedes env assignment',
    fn: () => {
      const content = fs.readFileSync(SERVER_PATH, 'utf8');
      const lines = content.split('\n');
      const idx = lines.findIndex(l => l.includes('env.GEMINI_CLI_TRUST_WORKSPACE'));
      assert(idx > 0, 'GEMINI_CLI_TRUST_WORKSPACE line must exist');
      // 직전 5줄에 PR #25814 또는 trust 관련 키워드 주석 있어야 함
      const window = lines.slice(Math.max(0, idx - 5), idx).join('\n');
      const hasIntent = /25814|trust|Trust|TRUST/.test(window);
      assert(hasIntent, 'GEMINI_CLI_TRUST_WORKSPACE must have intent comment (PR #25814/trust) above');
    }
  },
];

// Test runner contract per existing tc113/tc114 pattern
async function run() {
  let pass = 0;
  let fail = 0;
  for (const t of tests) {
    try {
      await t.fn();
      console.log(`  PASS: ${t.name}`);
      pass++;
    } catch (e) {
      console.log(`  FAIL: ${t.name} - ${e.message}`);
      fail++;
    }
  }
  console.log(`  Result: ${pass}/${tests.length} passed`);
  return { pass, fail, total: tests.length };
}

if (require.main === module) {
  run().then(({ fail }) => process.exit(fail > 0 ? 1 : 0));
}

module.exports = { run, tests };
