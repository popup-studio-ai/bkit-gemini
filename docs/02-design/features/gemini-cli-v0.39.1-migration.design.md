# Gemini CLI v0.39.1 마이그레이션 설계 명세 — bkit v2.0.6

> **Feature**: `gemini-cli-v0.39.1-migration`
> **Branch**: `feature/v2.0.6-gemini-cli-v0.39.1-migration`
> **Strategy**: B' (Critical Patch + Defensive Test + Trust Bootstrap UX)
> **Estimated**: 2.7h (P0 0.5h + P1 1.3h + P1 0.5h + buffer 0.4h)
> **Created**: 2026-04-25
> **Status**: Design — Do 단계 진입 대기

---

## 1. 개요

### 1.1 변경 요약

| # | 영역 | 파일 | 변경 유형 |
|---|------|------|----------|
| 1 | MCP runtime | `mcp/bkit-server.js` | Edit (env 1줄 + 주석) |
| 2 | bkit config | `bkit.config.json` | Edit (testedVersions +1) |
| 3 | Version flags | `lib/gemini/version.js` | Edit (feature flag +4) |
| 4 | Test (신규) | `tests/suites/tc115-v0391-headless-trust.js` | Create |
| 5 | Test 등록 | `tests/run-all.js` | Edit (tc115 등록) |
| 6 | Bootstrap (신규) | `scripts/bootstrap-trust.sh` | Create |
| 7 | 문서 | `README.md` | Edit (1줄 안내) |
| 8 | 버전 | `bkit.config.json`, `gemini-extension.json` | Edit (이미 v2.0.6 적용 완료) |

### 1.2 설계 원칙

1. **Version-safe**: env 주입 방식은 v0.34.0~v0.39.1 모든 버전에서 무영향 → 무조건 적용
2. **Defensive**: tc115 회귀 카나리아로 미래 spawn 경로 추가 시 자동 감지
3. **YAGNI**: `lib/gemini/trust.js` 헬퍼 보류 (현재 spawn 1곳뿐)
4. **Idempotent**: bootstrap 스크립트는 2회 실행해도 안전

---

## 2. 변경 명세

### 2.1 [Wave 1.1] `mcp/bkit-server.js` env 주입

**위치**: Line 1105-1113 사이 (env 빌더 직후)

**현재 코드** (Line 1104-1113):
```js
// Set up environment with context
const env = { ...process.env };
if (context) {
  env.BKIT_AGENT_CONTEXT = JSON.stringify(context);
}

// v0.32.0+ sub-agent hang prevention
if (flags.hasTaskTracker) {
  env.GEMINI_NON_INTERACTIVE = '1';
}
```

**변경 후 코드**:
```js
// Set up environment with context
const env = { ...process.env };
if (context) {
  env.BKIT_AGENT_CONTEXT = JSON.stringify(context);
}

// v0.32.0+ sub-agent hang prevention
if (flags.hasTaskTracker) {
  env.GEMINI_NON_INTERACTIVE = '1';
}

// v0.39.1+ headless trust enforcement (PR #25814)
// bkit MCP는 사용자가 인터랙티브로 trust한 세션 내부에서 동작하므로
// 자식 gemini 프로세스에 trust를 전파한다.
// v0.39.0 이하에서는 미사용 env (무영향) → version-safe로 무조건 주입.
env.GEMINI_CLI_TRUST_WORKSPACE = 'true';
```

**검증 기준**:
- `grep -c "GEMINI_CLI_TRUST_WORKSPACE" mcp/bkit-server.js` == 2 (env 주입 + 주석)
- `node -c mcp/bkit-server.js` syntax OK
- spawn 직후 디버그 로그(`console.error`)에 env 미노출 (보안)

### 2.2 [Wave 1.2] `bkit.config.json` testedVersions

**위치**: Line 120

**현재**:
```json
"testedVersions": ["0.29.0", "0.30.0", ..., "0.38.2", "0.39.0"],
```

**변경 후**:
```json
"testedVersions": ["0.29.0", "0.30.0", ..., "0.38.2", "0.39.0", "0.39.1"],
```

**검증 기준**:
- JSON 유효성 (`node -e "JSON.parse(require('fs').readFileSync('bkit.config.json'))"`)
- `"0.39.1"`가 배열 마지막 위치에 추가됨

### 2.3 [Wave 1.3] `lib/gemini/version.js` feature flags

**위치**: Line 199 다음 (현재 v0.39.0+ 그룹의 `hasUseAgentStream` 뒤)

**추가 코드**:
```js
// v0.39.1+ (Patch — PR #25814 + #25720 보안 강화)
// Headless 모드 untrusted workspace 차단 (PR #25814)
// → bkit MCP가 자식 gemini에 GEMINI_CLI_TRUST_WORKSPACE='true'을 무조건 전파해 우회
hasHeadlessTrustEnforcement: isVersionAtLeast('0.39.1'),
// `tools.core` allowlist 신설 (PR #25720) — Multi-Registry 통합 시점 채택
hasToolsCoreAllowlist: isVersionAtLeast('0.39.1'),
// Policy Engine 셸 명령 재귀 검증 강화 (PR #25720)
// → bkit 정책 회귀 위험 0건 확인 후 spot 검증
hasShellRecursiveValidation: isVersionAtLeast('0.39.1'),
// `--skip-trust` CLI 플래그 신설 (PR #25814) — bkit는 env 방식 채택, 미사용
hasSkipTrustFlag: isVersionAtLeast('0.39.1'),
```

**검증 기준**:
- `grep -c "isVersionAtLeast('0.39.1')" lib/gemini/version.js` == 4
- `node -c lib/gemini/version.js` syntax OK
- 기존 `hasUseAgentStream` 라인 유지 (회귀 0)

### 2.4 [Wave 2.1-2.4] `tests/suites/tc115-v0391-headless-trust.js`

**파일**: 신규 생성 (`tc113` 패턴 참조)

**구조**:
```js
/**
 * TC-115: v0.39.1+ Headless Trust Enforcement 우회 검증
 *
 * 컨텍스트:
 *   Gemini CLI v0.39.1 (PR #25814)이 헤드리스 모드에서 untrusted 워크스페이스
 *   실행을 FatalUntrustedWorkspaceError로 차단. bkit `mcp/bkit-server.js`의
 *   `executeAgent` Line 1117 spawn 경로가 정면 적중. 우회: env 주입.
 *
 * 본 테스트의 역할 (카나리아):
 *   - bkit-server가 자식 gemini 프로세스에 GEMINI_CLI_TRUST_WORKSPACE='true'을
 *     무조건 전파하는지 단위 검증.
 *   - 미래 spawn 경로 추가 시 trust env 누락을 자동 감지.
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
const { PLUGIN_ROOT, assert, assertEqual } = require('../test-utils');

const SERVER_PATH = path.join(PLUGIN_ROOT, 'mcp', 'bkit-server.js');

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
    name: 'TC115-03: env.GEMINI_CLI_TRUST_WORKSPACE is set to "1" (truthy string)',
    fn: () => {
      const content = fs.readFileSync(SERVER_PATH, 'utf8');
      const re = /env\.GEMINI_CLI_TRUST_WORKSPACE\s*=\s*['"]1['"]/;
      assert(re.test(content), 'GEMINI_CLI_TRUST_WORKSPACE must be assigned the string "1"');
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
    name: 'TC115-05: assignment is unconditional (no flag-gate)',
    fn: () => {
      const content = fs.readFileSync(SERVER_PATH, 'utf8');
      // 라인을 찾아 if 문 안에 들어있지 않은지 확인 (의도: version-safe 무조건 주입)
      const lines = content.split('\n');
      const idx = lines.findIndex(l => l.includes('env.GEMINI_CLI_TRUST_WORKSPACE'));
      assert(idx > 0, 'GEMINI_CLI_TRUST_WORKSPACE line must exist');
      // 직전 5줄 내에 hasHeadlessTrustEnforcement 같은 게이트가 없어야 함
      const window = lines.slice(Math.max(0, idx - 5), idx).join('\n');
      assert(
        !window.includes('hasHeadlessTrustEnforcement'),
        'GEMINI_CLI_TRUST_WORKSPACE must NOT be flag-gated (env is no-op below v0.39.1)'
      );
    }
  },
  {
    name: 'TC115-06: bkit.config.json testedVersions includes 0.39.1',
    fn: () => {
      const cfg = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'bkit.config.json'), 'utf8'));
      assert(Array.isArray(cfg.testedVersions), 'testedVersions must be array');
      assert(cfg.testedVersions.includes('0.39.1'), 'testedVersions must include "0.39.1"');
    }
  },
  {
    name: 'TC115-07: lib/gemini/version.js exports v0.39.1+ feature flags',
    fn: () => {
      const versionPath = path.join(PLUGIN_ROOT, 'lib', 'gemini', 'version.js');
      const content = fs.readFileSync(versionPath, 'utf8');
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

module.exports = { name: 'TC-115: v0.39.1 Headless Trust Bypass', tests };
```

**검증 기준**:
- `node tests/suites/tc115-v0391-headless-trust.js` 실행 시 8/8 PASS (단독 실행 가능 여부는 test runner 패턴 의존)
- `tests/run-all.js`에 등록 후 `npm test` 995/995 green

**`tests/run-all.js` 등록**:
- 기존 tc113/tc114 등록 패턴을 따라 tc115 추가

### 2.5 [Wave 3.1] `scripts/bootstrap-trust.sh` 신설

**파일**: 신규 (`/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/scripts/bootstrap-trust.sh`)

**내용**:
```bash
#!/usr/bin/env bash
# bkit Trust Bootstrap — v0.39.1+ headless trust 등록 자동화 (idempotent)
#
# 목적:
#   Gemini CLI v0.39.1+ (PR #25814)이 untrusted 워크스페이스에서
#   `gemini -p`/`gemini -e` 헤드리스 모드 실행을 차단. 본 스크립트는
#   현재 워크스페이스 절대 경로를 ~/.gemini/trustedFolders.json에
#   idempotent 등록한다.
#
# 사용:
#   bash scripts/bootstrap-trust.sh
#
# 무조건 권장하지만, bkit MCP는 GEMINI_CLI_TRUST_WORKSPACE='true' env로
# 이중화되어 있어 본 스크립트 미실행도 정상 동작.
#
# 참고:
#   - PR #25814: https://github.com/google-gemini/gemini-cli/pull/25814
#   - bkit-server.js Line 1105: env.GEMINI_CLI_TRUST_WORKSPACE = 'true' (이미 적용)

set -euo pipefail

WORKSPACE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FILE="$HOME/.gemini/trustedFolders.json"

mkdir -p "$(dirname "$FILE")"
[ -f "$FILE" ] || echo '{}' > "$FILE"

# node로 idempotent JSON 갱신 (jq 의존성 회피)
node -e "
const fs = require('fs');
const file = '$FILE';
const ws = '$WORKSPACE';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
if (data[ws] === 'TRUST_FOLDER') {
  console.log('[bkit] Already trusted: ' + ws);
  process.exit(0);
}
data[ws] = 'TRUST_FOLDER';
fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
console.log('[bkit] Workspace registered: ' + ws);
"
```

**검증 기준**:
- `chmod +x scripts/bootstrap-trust.sh` 후 실행 가능
- 첫 실행: `~/.gemini/trustedFolders.json`에 워크스페이스 경로 추가
- 두 번째 실행: "Already trusted" 메시지, 파일 변경 없음 (idempotent)
- 스크립트 syntax: `bash -n scripts/bootstrap-trust.sh` 통과

### 2.6 [Wave 3.2] `README.md` 안내 추가

**위치**: 기존 Setup/Quick Start 섹션 (있으면 추가, 없으면 새 섹션)

**추가 내용** (한 줄 + 짧은 설명):
```markdown
### v0.39.1+ Trust Bootstrap (선택)

Gemini CLI v0.39.1부터 untrusted 워크스페이스에서 헤드리스 모드 실행이 차단됩니다.
bkit는 자동으로 `GEMINI_CLI_TRUST_WORKSPACE='true'` env를 자식 프로세스에 전파해 정상 동작하지만,
처음 한 번 다음 명령으로 워크스페이스를 trust 등록할 수도 있습니다 (이중화):

```bash
bash scripts/bootstrap-trust.sh
```
```

**검증 기준**:
- README.md 변경 후 markdownlint 등 CI 통과 (있으면)
- `bash` 코드 블록이 정상 렌더링

---

## 3. 데이터 흐름

### 3.1 spawn_agent 호출 시퀀스 (v0.39.1 기준, 적용 후)

```
[User] gemini> "@bkit spawn_agent cto-lead 'do X'"
   ↓
[Gemini CLI] MCP tool call → bkit-server (stdio)
   ↓
[bkit-server.js#executeAgent]
   ├─ env 빌더 (Line 1105):
   │    env = { ...process.env }
   │    env.BKIT_AGENT_CONTEXT = JSON
   │    env.GEMINI_NON_INTERACTIVE = '1' (v0.32.0+)
   │    env.GEMINI_CLI_TRUST_WORKSPACE = 'true' ★ NEW v0.39.1+ trust 전파
   ↓
   ├─ spawn('gemini', ['-e', 'agents/cto-lead.md', ...], { env, cwd, stdio })
   ↓
[child gemini process]
   ├─ trust check (v0.39.1+)
   │    GEMINI_CLI_TRUST_WORKSPACE === '1' ? OK : FatalUntrustedWorkspaceError
   ↓
   └─ 정상 실행 → stdout/stderr → bkit-server 회수 → MCP response
```

### 3.2 bootstrap-trust.sh 실행 흐름

```
[User] $ bash scripts/bootstrap-trust.sh
   ↓
[script]
   ├─ WORKSPACE = $(realpath of script's parent)
   ├─ FILE = $HOME/.gemini/trustedFolders.json
   ├─ mkdir -p ~/.gemini/
   ├─ touch FILE if missing (init '{}')
   ↓
   └─ node -e "..."
        ├─ data = JSON.parse(FILE)
        ├─ if (data[ws] === 'TRUST_FOLDER') → "Already trusted" exit
        └─ data[ws] = 'TRUST_FOLDER' → fs.writeFileSync → "Registered"
```

---

## 4. Acceptance Criteria (Plan §1.2와 동기)

| AC | 기준 | 검증 방법 |
|----|------|----------|
| S1 | v0.39.1 untrusted dir에서 spawn_agent 정상 동작 | 수동 E2E (백업/복원 시나리오) |
| S2 | v0.39.0 이하에서 회귀 없음 | `npm test` 994/994 → 995/995 green |
| S3 | testedVersions에 `"0.39.1"`, version.js에 4 flags export | `grep` 검증 + tc115-06/07 |
| S4 | tc115 양방향 검증 (코드 계약 + idempotent) | `npm test` 995/995 |
| S5 | bootstrap-trust.sh 동작 확인 | 첫 실행 등록 + 재실행 no-op |

---

## 5. Non-Goals (Plan §1.3과 동기)

- NG1: `--skip-trust` CLI 플래그 사용 (v0.39.0 이하 호환 깨짐)
- NG2: `tools.core` 즉시 채택 (v0.40.0 cycle 이관)
- NG3: `.env` 로딩 차단 관련 코드 패치 (bkit 비의존)
- NG4: 셸 정책 시뮬레이터 자동 회귀 (P2 이관)
- NG5: Issue #25655 추가 대응 (tc113 카나리아 운영 중)
- NG6: v0.40.0 사전 작업 (별도 cycle)
- NG7: `lib/gemini/trust.js#getSpawnEnv()` 헬퍼 (YAGNI)
- NG8: `tools.allowed → tools.core` 마이그 (대상 0건)

---

## 6. Risk & Rollback

### 6.1 위험 매트릭스 (Plan §6.1과 동기)

| 위험 | 발생 | 영향 | 대응 |
|------|------|------|------|
| env가 자식 spawn에 미전파 | Low | High | tc115-04로 코드 계약 검증, QA 단계 E2E로 실측 |
| 셸 재귀 검증으로 정책 거부 | Very Low | Medium | spot 검증, 거부 시 정책 수정 (본 plan은 미수행) |
| bootstrap이 사용자 환경 손상 | Very Low | Medium | idempotent + 표준 도구만 사용 |
| tc115 false positive (v0.39.0 이하) | Low | Low | 본 테스트는 코드 계약만 검증 → 모든 버전에서 PASS |

### 6.2 Rollback Plan

| 작업 | Rollback 명령 |
|------|---------------|
| env 주입 | Edit으로 해당 라인+주석 4줄 삭제 |
| testedVersions | `"0.39.1"` 제거 |
| feature flags | 4개 flag 라인 삭제 |
| tc115 신설 | `rm tests/suites/tc115-v0391-headless-trust.js` + `tests/run-all.js` 등록 제거 |
| bootstrap | `rm scripts/bootstrap-trust.sh` + README 안내 제거 |
| 버전 bump | `bkit.config.json`/`gemini-extension.json`에서 v2.0.5로 되돌림 |

또는 `git revert <commit>` / `git reset --hard origin/main` (사용자 명시 승인 시).

---

## 7. 구현 순서 (Do Phase)

### Phase Do-1: Critical Patch (P0, 0.5h)
1. `mcp/bkit-server.js` env 주입 (5분)
2. `bkit.config.json` testedVersions 갱신 (1분)
3. `lib/gemini/version.js` feature flags 추가 (10분)
4. smoke `npm test` 994/994 green (5분)

### Phase Do-2: Defensive Test (P0, 1.0h)
5. `tests/suites/tc115-v0391-headless-trust.js` 신설 (45분)
6. `tests/run-all.js`에 tc115 등록 (5분)
7. `npm test` 995/995 green (5분)
8. tc113 v0.39.1 환경 재실행 (5분, 잔존 #25655 카나리아 갱신)

### Phase Do-3: Trust Bootstrap UX (P1, 0.5h)
9. `scripts/bootstrap-trust.sh` 신설 + chmod +x (25분)
10. README 안내 1단락 추가 (5분)

### Phase Do-4: Verification spot (P1, 0.3h)
11. 셸 재귀 검증 spot — `gemini -p "git status, ls, npm test 등"`로 9개 allow rule 인터랙티브 확인 (20분)

---

## 8. QA 계획 (Check Phase)

### 8.1 L1 Unit (자동)
- `npm test` → 995/995 green (tc115 포함)

### 8.2 L2 Integration (자동)
- tc115 8개 테스트 PASS (코드 계약 검증)
- tc113 PASS (잔존 카나리아)

### 8.3 L3 E2E with `gemini -p` (수동)

**시나리오 A: env 주입 정상 동작 검증**
```bash
gemini -p "GEMINI_CLI_TRUST_WORKSPACE 환경변수가 설정되었을 때 'OK'를 출력해주세요. process.env.GEMINI_CLI_TRUST_WORKSPACE를 read하지 않고, 단순히 'OK'만 출력하세요."
# 기대: 정상 동작
```

**시나리오 B: untrusted 시뮬레이션 (수동)**
```bash
# 백업
mv ~/.gemini/trustedFolders.json{,.bak}

# 1. env 미주입 시 — 차단 확인
gemini -p "test" 2>&1 | head
# 기대: FatalUntrustedWorkspaceError 또는 trust 메시지

# 2. env 주입 시 — 우회 확인
GEMINI_CLI_TRUST_WORKSPACE=true gemini -p "test" 2>&1 | head
# 기대: 정상 동작

# 복원
mv ~/.gemini/trustedFolders.json{.bak,}
```

**시나리오 C: bkit MCP spawn_agent E2E**
- bkit MCP 서버를 인터랙티브 gemini에서 호출
- `spawn_agent` MCP tool로 실제 에이전트 spawn
- 정상 출력 확인

### 8.4 L4 Manual (수동)
- bootstrap-trust.sh 첫 실행 + 재실행 idempotent 확인
- README 안내 렌더링 확인

### 8.5 합격 기준
- L1/L2: 100% PASS (정량)
- L3: 시나리오 A/B/C 모두 정상 (정성)
- L4: idempotent 확인 (정성)

---

## 9. Document Sync

| 문서 | 변경 |
|------|------|
| `docs/01-plan/features/gemini-cli-v0.39.1-migration.plan.md` | 변동 없음 (Source of Truth 유지) |
| `docs/01-plan/research/gemini-cli-v0.39.1-research.md` | 변동 없음 |
| `docs/03-analysis/gemini-cli-v0.39.1-impact.analysis.md` | 변동 없음 |
| `docs/02-design/features/gemini-cli-v0.39.1-migration.design.md` | **본 문서, 신규** |
| `docs/04-report/gemini-cli-v0.39.1-migration.report.md` | Do/Check/Act 결과 추가 (PDCA Report 단계) |
| `docs/03-analysis/gemini-cli-v0.39.1-do.analysis.md` | Do 단계에서 신규 작성 (gap analysis 결과 포함) |

---

## 10. References

- Plan: `docs/01-plan/features/gemini-cli-v0.39.1-migration.plan.md`
- Research: `docs/01-plan/research/gemini-cli-v0.39.1-research.md`
- Impact: `docs/03-analysis/gemini-cli-v0.39.1-impact.analysis.md`
- Predecessor design: `docs/02-design/features/bkit-gemini-v200-refactoring.design.md`
- Test pattern: `tests/suites/tc113-session-start-duplication-defense.js`

---

*Generated by `/pdca design` (Phase: Design) — 2026-04-25*
