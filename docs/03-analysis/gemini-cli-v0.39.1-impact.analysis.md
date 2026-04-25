# Gemini CLI v0.39.1 bkit 영향 분석 보고서

> 분석일: **2026-04-25**
> 분석 범위: bkit v2.0.5 전체 코드베이스 (소스/문서/설정 624개 파일, node_modules 제외)
> 대상 버전: **Gemini CLI v0.39.1** (2026-04-24 02:11 UTC, isLatest=true)
> 베이스라인: **v0.39.0** (2026-04-23, `docs/03-analysis/gemini-cli-v0.39.0-impact.analysis.md`)
> 분석자: bkit-impact-analyzer agent
> 입력 문서: `docs/01-plan/research/gemini-cli-v0.39.1-research.md`

---

## Executive Summary

| 항목 | 수치 |
|------|------|
| 전수 스캔 대상 파일 | **624개** (소스/문서/설정 — node_modules 제외) |
| **v0.39.1 신규 직접 영향 받는 bkit 파일** | **2개** (`mcp/bkit-server.js`, `bkit.config.json`) |
| **v0.39.1 신규 간접 영향 받는 bkit 파일** | **3개** (`mcp/start-server.sh` 부트스트랩, `lib/gemini/version.js` feature flag, `.gemini/policies/bkit-permissions.toml`) |
| 🔴 Critical | **1건** (Headless Trust Enforcement → bkit-server `executeAgent` 차단 회귀) |
| 🟠 High | **0건** |
| 🟡 Medium | **2건** (`tools.core` 신규 정책 채택 기회, 셸 재귀 검증 정책 회귀 검증) |
| 🟢 Low | **2건** (`--skip-trust` 플래그 인지, `.env` 차단 — bkit 비의존 확인) |
| 기능 개선 기회 | **3건** (`tools.core` 도입, trust 부트스트랩 자동화, runners trust env 일괄 주입) |
| **전체 위험도 (v0.39.0 → v0.39.1 델타)** | **MEDIUM-HIGH** (Critical 1건이 bkit `spawn_agent` 핵심 경로를 정면 적중) |

**최우선 조치 Top 3** (`file:line` 명시):
1. 🔴 **`mcp/bkit-server.js:1105` `executeAgent` 환경변수 주입**: `env.GEMINI_CLI_TRUST_WORKSPACE = 'true'` 추가 (1117 라인의 `spawn('gemini', args, ...)` 호출 직전에 trust 우회 보장)
2. 🟡 **`bkit.config.json:120` testedVersions 갱신**: `"0.39.0"` 뒤에 `"0.39.1"` 추가
3. 🟡 **`lib/gemini/version.js:185-199` v0.39.1 feature flag 추가**: `hasHeadlessTrustEnforcement`, `hasToolsCoreAllowlist`, `hasShellRecursiveValidation`, `hasSkipTrustFlag` 4개 플래그 신설 (`isVersionAtLeast('0.39.1')`)

---

## 1. Breaking Changes 영향 매핑

### 1.1 🔴 CRITICAL — Headless Trust Enforcement (PR #25814)

| 항목 | 내용 |
|------|------|
| 업스트림 변경 | `packages/core/src/utils/trust.ts` (+356 신규), `userStartupWarnings.ts` (+26), trustedFolders.ts (+31/-365 리팩) |
| 이전 동작 (v0.39.0) | Headless 모드(`gemini -p`, `gemini -e`)는 trust 상태 무관 즉시 실행 |
| **v0.39.1 동작** | Untrusted 워크스페이스에서 `FatalUntrustedWorkspaceError`로 차단. 우회 옵션: `--skip-trust` / `GEMINI_CLI_TRUST_WORKSPACE=true` / `~/.gemini/trustedFolders.json` 사전 등록 |
| **bkit 영향 핵심 경로** | `mcp/bkit-server.js:1117` `spawn('gemini', args, { env, cwd: process.cwd(), stdio: ['pipe', 'pipe', 'pipe'] })` → 모든 서브에이전트 spawn이 `gemini -e <agent>.md` 헤드리스 호출 |

#### 1.1.1 영향 파일/라인

| 파일 | 라인 | 영향 항목 | 영향도 | 수정 방안 |
|------|------|----------|--------|----------|
| `mcp/bkit-server.js` | **1097-1102** (args 빌더), **1105** (env 빌더), **1117** (`spawn('gemini', ...)`) | bkit 21개 에이전트 모두 trust 미등록 워크스페이스에서 spawn 실패 | 🔴 Critical | env 빌더(Line 1105 직후)에 `env.GEMINI_CLI_TRUST_WORKSPACE = 'true';` 1줄 추가. 또는 args 빌더(Line 1097)에 `'--skip-trust'` 플래그 추가 (단, v0.39.0 이하에서 unknown flag 거부 가능 → 권장: env 방식) |
| `mcp/start-server.sh` | (전체) | MCP 서버 자체는 stdio 통신이라 trust 게이트 비대상이지만, 이 셸이 spawn하는 `bkit-server.js`가 후속 `gemini` spawn 시 trust 회귀 — 영향은 bkit-server.js 측에서 해결 가능 | 🟢 Low (간접) | 수정 불필요. bkit-server.js 측 env 주입으로 충분 |
| `tests/suites/tc97-e2e-integration.js` 외 v0.39.1 환경에서 `gemini -e` 호출하는 모든 E2E 테스트 | — | 회귀 가능 (단, 현재 bkit 테스트는 hooks/MCP 단위만 검증, `gemini -e` 직접 호출 없음 — `grep -rn "gemini -e" tests/` 결과 0건 확인) | 🟢 Low | 신규 E2E 회귀 테스트 권고: `tests/suites/tc115-v0391-headless-trust.js` 신설 |

#### 1.1.2 회귀 시나리오

```
[현재 v0.39.0 동작 — bkit-server `spawn_agent` MCP tool]
  Gemini CLI ─→ bkit MCP server (stdio)
  bkit MCP server ─→ spawn('gemini', ['-e', 'agents/cto-lead.md', '--approval-mode=yolo', task])
  gemini (subprocess) ─→ 즉시 실행

[v0.39.1 차단 시나리오]
  Gemini CLI ─→ bkit MCP server (stdio)
  bkit MCP server ─→ spawn('gemini', ['-e', 'agents/cto-lead.md', '--approval-mode=yolo', task])
  gemini (subprocess) ─→ 워크스페이스 trust 검증
                       ─→ ~/.gemini/trustedFolders.json에 cwd 미등록
                       ─→ FatalUntrustedWorkspaceError exit
                       ─→ stderr: "Gemini CLI is not running in a trusted directory"
  bkit MCP server ─→ proc.on('close', code=비-0) → output={ exitCode: 1, output: stderr }
  Gemini CLI ─→ 사용자에게 spawn_agent 실패 표시
```

#### 1.1.3 수정 방안 (권장)

**`mcp/bkit-server.js` Line 1105 부근**:
```js
const env = { ...process.env };

// v0.39.1+ 헤드리스 trust enforcement 우회 (PR #25814)
// bkit MCP는 이미 사용자가 인터랙티브로 trust한 세션 내부에서 동작하므로
// 자식 gemini 프로세스에 trust를 전파한다.
env.GEMINI_CLI_TRUST_WORKSPACE = 'true';

if (context) {
  env.BKIT_AGENT_CONTEXT = JSON.stringify(context);
}
```

**대안** (방어적): version-gate로 v0.39.1+에서만 주입:
```js
const flags = getFeatureFlags();
if (flags.hasHeadlessTrustEnforcement) {
  env.GEMINI_CLI_TRUST_WORKSPACE = 'true';
}
```

**의도적 비채택**: `--skip-trust` CLI 플래그.
- 이유: v0.39.0 이하에서 unknown flag로 거부될 수 있고, env 방식이 동일 효과 + version-safe.

#### 1.1.4 확인 필요 항목

- [ ] **확인 필요**: 실제 v0.39.1 바이너리에서 `GEMINI_CLI_TRUST_WORKSPACE=true`이 stdin/MCP 호출에도 동일하게 적용되는지(현재 인터랙티브 stdio 세션에서 부모-자식 env 상속이 trust 전파에 충분한지) — Phase 3 검증 필요.
- [ ] **확인 필요**: bkit MCP server가 spawn하는 `gemini` 자식 프로세스의 cwd가 `process.cwd()`(워크스페이스 루트)와 동일한지 — Line 1119에서 명시 `cwd: process.cwd()` 확인됨.

---

## 2. 새로운 기능 영향 매핑

### 2.1 🟡 MEDIUM — `tools.core` allowlist 신설 (PR #25720)

| 항목 | 내용 |
|------|------|
| 업스트림 변경 | `schemas/settings.schema.json` +9, `packages/cli/src/config/settingsSchema.ts` +13 |
| 시맨틱 | 빌트인 도구 정확 매칭 allowlist. `tools.confirmationRequired`가 `tools.core` 및 `tools.allowed` 모두에 우선 |
| Restart | **필요** (settings 변경 후 재시작) |
| **bkit 현재 상태** | `tools.core` 미사용 (검색 0건). `tools.allowed`/`tools.confirmationRequired`도 `.gemini/settings.json`에 미정의 (현재 파일은 `experimental.enableAgents`만 1줄) |

#### 2.1.1 영향 파일/대응

| 파일 | 영향 항목 | 영향도 | 대응 |
|------|----------|--------|------|
| `.gemini/settings.json` (현재 5줄) | `tools.core` 채택 가능 — 빌트인 도구 단위 정밀 통제 | 🟡 Medium (기회) | §8 기능 개선 기회 #1 — bkit 빌트인 도구 화이트리스트 신설 PoC |
| `.gemini/policies/bkit-permissions.toml` | TOML 정책과 `tools.core` 시맨틱 차이 — TOML은 prefix 매칭, `tools.core`는 정확 매칭 | 🟢 Low | 병행 운영 가능. 우선순위는 `tools.confirmationRequired > tools.core > TOML 정책` 순으로 가정 (확인 필요) |
| `bkit.config.json:111-115` `permissions` 섹션 (5건의 run_shell_command rules) | TOML 정책 생성 소스 — `tools.core` 도입 시 별개 출력 추가 가능 | 🟢 Low | §8 기능 개선 기회 #1 PoC와 함께 검토 |

### 2.2 🟡 MEDIUM — 셸 명령 재귀 검증 강화 (PR #25720)

| 항목 | 내용 |
|------|------|
| 업스트림 변경 | `packages/core/src/policy/policy-engine.ts` +70/-73, `parseCommandDetails` 재귀 분해, `stripShellWrapper` 신설 |
| 검증 대상 | command substitution `$(...)` / 백틱, subshell `(...)`, pipe `|`, redirection `>`, chaining `&&`/`||`/`;`, 셸 래퍼 `bash -c`/`sh -c`/`zsh -c` |

#### 2.2.1 bkit 정책 회귀 위험 매트릭스

| 위치 | 패턴 | v0.39.1 검증 통과? | 수정 필요 |
|------|------|-------------------|-----------|
| `.gemini/policies/bkit-permissions.toml:8-50` (deny: rm -rf, git push --force, curl, wget) | prefix 매칭만 사용 — 재귀 분해 후 각 부분이 prefix 매칭됨 | 통과 | 없음 |
| `.gemini/policies/bkit-permissions.toml:54-106` (allow: git status, git log, git diff, ls, cat, echo, npm test, npm run, node) | prefix 매칭만 사용 — 단순 명령 | 통과 | 없음 |
| `.gemini/policies/bkit-starter-policy.toml:1-78` | prefix 매칭만 사용 | 통과 | 없음 |
| `bkit.config.json:111-115` permissions 정의 | TOML 정책 소스 — 동일 prefix 매칭 | 통과 | 없음 |
| `mcp/tools/qa-runner.js:159,177,189,230,266,274,293` `safeExec` 호출 | bkit MCP 자체 child_process. **Gemini policy 비대상** (Gemini의 `run_shell_command` tool로 이슈되지 않음 — Node.js `execSync` 직접 호출) | 비대상 | 없음 |
| `mcp/tools/checkpoint-manager.js:33,34,108,109,170` `safeExec` 호출 | 동일 — bkit 내부 child_process, Gemini policy 비대상 | 비대상 | 없음 |
| `mcp/tools/pm-pipeline.js:324` `execShell` | 동일 | 비대상 | 없음 |
| `mcp/tools/gap-analyzer.js:222` `grep -r ... | head -1` (pipe 사용!) | bkit 내부 child_process, Gemini policy 비대상 | 비대상 | 없음 |
| `lib/gemini/version.js:93,105` `npm list ... 2>/dev/null` (redirection!) | bkit 내부 child_process, Gemini policy 비대상 | 비대상 | 없음 |
| `tests/test-utils.js:122,160` `echo '...' | node ...` (pipe!) | 테스트 인프라 — Gemini policy 비대상 | 비대상 | 없음 |
| **에이전트/스킬 시스템 프롬프트 안 셸 명령 예제** | `skills/zero-script-qa/SKILL.md`, `skills/qa-phase/SKILL.md`, `skills/deploy/SKILL.md`, 21개 에이전트 frontmatter `allowed-tools: run_shell_command` | LLM이 `run_shell_command(...)` 호출 시 정책 검증 받음. 단, 현재 정책은 prefix 기반이고 LLM 출력에서 `bash -c "..."` 명시적 사용 사례 없음 (grep 결과 0건) | 통과 (예방) | 없음. P1 회귀 테스트만 권고 |

**핵심 결론**: bkit 정책 규칙 자체는 모두 prefix 매칭이며 셸 우회 패턴(`$(...)`, `bash -c`)을 *명시적으로 허용*하는 규칙이 없으므로, 새 재귀 검증으로 인한 **차단 회귀 위험은 0건**. 다만 **확인 필요**: 미래 기능 추가 시 LLM이 `run_shell_command("docker logs <id> | tail -100")` 같은 pipe 사용을 시도하면 v0.39.1에서 각 부분(`docker logs`, `tail`)이 정책에 별도 대조됨 — 현재 `bkit-permissions.toml`에 `tail` allowlist 없음 → 기본 `ask_user`(priority=5)로 떨어져 사용자 확인 필요. 운영 영향은 미미.

### 2.3 🟢 LOW — `.env` 로딩 untrusted 차단 (PR #25814)

#### 2.3.1 bkit `.env` 의존성 매트릭스

| 위치 | .env 변수 | 회귀 시나리오 | 영향도 | 대응 |
|------|----------|-------------|--------|------|
| **bkit 코드베이스 전수 스캔** (`find . -name ".env*"`) | **0건** — `.env`/`.env.local`/`.env.example` 파일 없음 | 비해당 | 🟢 None | 없음 |
| **`process.env.X` 사용 (전수)** | bkit 자체 env: `BKIT_DEBUG`, `BKIT_LEVEL`, `BKIT_PDCA_AUTOMATION`, `BKIT_PROJECT_LEVEL`, `BKIT_OUTPUT_STYLE`, `BKIT_SESSION_START_VERBOSE`, `BKIT_AGENT_CONTEXT` (자식 spawn 시 주입) | bkit는 `.env` 파일에서 변수를 *로드하지 않음*. `process.env`는 부모 환경(쉘/CI)에서만 상속. v0.39.1 `.env` 차단은 bkit 동작에 무영향 | 🟢 None | 없음 |
| Gemini CLI env: `GEMINI_CLI_VERSION`, `GEMINI_PROJECT_DIR`, `GEMINI_EXTENSION_PATH`, `GEMINI_NON_INTERACTIVE`, `GOOGLE_API_KEY`, `GOOGLE_GENAI_API_KEY` | `lib/gemini/platform.js:27-31, 42, 56`, `mcp/bkit-server.js:1112` | bkit는 이 변수를 *읽기만* 함. Gemini CLI 자체가 어떻게 로드하는지(`.env` 차단 영향)는 CLI 측 책임 | 🟢 None | 없음 |
| `lib/core/permission.js:56-58` `'*.env', '*.env.local', '*.env.production'` | bkit *write 권한 차단 패턴* — `.env` 파일 *생성을 막는* 정책 | bkit는 `.env` 보호 측에 서있음 (방어). PR #25814와 *철학적으로 일치*. | 🟢 None | 없음 |
| `lib/core/file.js:143-146` `name.startsWith('.env')` 등 sensitive file detection | 동일 — bkit 방어 정책 | 🟢 None | 없음 |
| `hooks/scripts/before-tool.js:195` `path.basename(filePath).startsWith('.env')` | sensitive 파일 가드 | 🟢 None | 없음 |

**결론**: bkit는 `.env` 파일을 *읽지 않으며* 오히려 *방어 측*에 있다. v0.39.1 `.env` 차단은 bkit에 영향 없음.

### 2.4 🟢 LOW — `--skip-trust` / `GEMINI_CLI_TRUST_WORKSPACE` 신설

| 항목 | 내용 |
|------|------|
| **신규 우회 옵션** | CLI 플래그 `--skip-trust`, env `GEMINI_CLI_TRUST_WORKSPACE=true` |
| bkit 활용 | §1.1.3에서 채택 — `mcp/bkit-server.js`의 spawn env에 주입 |
| 문서화 | `bkit-system/philosophy/ai-native-principles.md` 또는 별도 ops 가이드에 1줄 설명 추가 권장 |

---

## 3. 스킬 영향 분석 (43개)

| 스킬 카테고리 | 영향 항목 | 영향도 | 대응 방안 |
|--------------|----------|--------|----------|
| 전체 43개 | Headless trust 차단 — bkit MCP `spawn_agent`로 호출되는 `gemini -e <agent>.md` 경로가 적중. 단, 스킬 자체는 LLM 인-세션 활성화이므로 직접 영향 없음. 영향은 §1.1의 bkit-server.js 단일 패치로 일괄 해소 | 🔴 Critical (간접) | bkit-server.js 패치로 일괄 해소 |
| 21개 (allowed-tools에 `run_shell_command` 포함) | 셸 재귀 검증 — pipe/substitution 사용 시 각 부분이 정책에 대조. 현재 정책에 `tail`/`head`/`awk`/`sed` 등 일반적인 텍스트 처리 명령이 ask_user 기본값 | 🟡 Medium (잠재) | 운영 회귀 테스트로 자주 사용되는 pipe 조합 식별 후 allowlist 보강 권고 (P2) |
| 모든 스킬 | `tools.core` 신규 — 스킬 단위 빌트인 도구 통제 가능 | 🟡 Medium (기회) | §8 기능 개선 기회 #1 — `tools.core`로 read-only 스킬 가드 강화 PoC |
| `gemini-cli-learning/SKILL.md` | v0.39.1 변경 반영 (3가지 trust 우회 옵션 교육) | 🟢 Low | 1단락 추가 (P3) |

---

## 4. 에이전트 영향 분석 (21개)

| 에이전트 | 영향 항목 | 영향도 | 대응 방안 |
|---------|----------|--------|----------|
| 전체 21개 | bkit MCP `spawn_agent`로 호출 시 v0.39.1 trust 게이트 적중 — `mcp/bkit-server.js:1117` 단일 호출이 모든 21개에 영향. **bkit-server.js 패치 1건으로 일괄 해소** | 🔴 Critical (간접) | §1.1.3 패치 |
| `agents/cto-lead.md`, `bkend-expert.md`, `qa-strategist.md`, `frontend-architect.md`, `pm-lead.md`, `pdca-iterator.md`, `qa-monitor.md`, `infra-architect.md` (총 8개 frontmatter `allowed-tools: run_shell_command`) | 셸 재귀 검증 — pipe/wrapper 사용 시 각 부분 정책 대조. 시스템 프롬프트 grep 결과 `bash -c`/`$(...)` 사용 사례 0건 (현재) | 🟢 Low | 회귀 테스트만 권고. 코드/프롬프트 수정 불필요 |
| `agents/cto-lead.md:36-39` `tracker_create_task`, `tracker_update_task` 등 | bkit MCP tool — Gemini policy/`tools.core` 비대상 (MCP 외부 등록 도구) | 🟢 None | 없음 |

---

## 5. 스크립트/라이브러리 영향 분석

| 파일 | 영향 항목 | 영향도 | 대응 방안 |
|------|----------|--------|----------|
| **`mcp/bkit-server.js:1097-1121`** `executeAgent` | §1.1 — 헤드리스 trust 차단 정면 적중. `env` 빌더에 `GEMINI_CLI_TRUST_WORKSPACE='true'` 추가 | 🔴 Critical | §1.1.3 패치 |
| **`bkit.config.json:120`** testedVersions | `"0.39.1"` 추가 (현재 `["...","0.39.0"]`로 끝남) | 🟡 Medium | 1줄 수정 |
| **`lib/gemini/version.js:185-199`** v0.39.0+ feature flag 그룹 | v0.39.1+ 신규 4개 플래그 추가: `hasHeadlessTrustEnforcement`, `hasToolsCoreAllowlist`, `hasShellRecursiveValidation`, `hasSkipTrustFlag` (모두 `isVersionAtLeast('0.39.1')`) | 🟡 Medium | §1.1.3 코드에서 게이팅 사용 |
| `mcp/start-server.sh` | 영향 없음 (MCP는 stdio 통신, trust 게이트 비대상). 자식 `gemini` spawn은 bkit-server.js 측에서 처리 | 🟢 Low | 없음 |
| `hooks/scripts/session-start.js:89,114` | §7 #25655 잔존 (v0.39.0 분석 §7과 동일, v0.39.1에서 미수정 — fix PR #25827 OPEN) | 🔴 잔존 | v0.39.0 분석에서 권고된 tc107-v0382 방어 테스트 잔존 P0 |
| `hooks/scripts/before-tool.js:195` `.env` 가드 | 변경 없음 — bkit 방어 정책 유지 | 🟢 None | 없음 |
| `mcp/tools/qa-runner.js:159,177,189,230,266,274,293,503` `safeExec`/`execSync` | bkit 내부 child_process — Gemini policy 비대상 (LLM `run_shell_command`가 아님) | 🟢 None | 없음 |
| `mcp/tools/gap-analyzer.js:222` `execSync` (`grep -r | head -1`, pipe 포함) | 동일 — Gemini policy 비대상 | 🟢 None | 없음 |
| `mcp/tools/checkpoint-manager.js:33,34,108,109,170` `safeExec` (git 명령) | 동일 | 🟢 None | 없음 |
| `mcp/tools/pm-pipeline.js:324` `execShell` | 동일 | 🟢 None | 없음 |
| `lib/gemini/version.js:93,105` `execSync('npm list...2>/dev/null')`, `'gemini --version 2>/dev/null'` | redirection 사용 — bkit 내부 child_process, Gemini policy 비대상 | 🟢 None | 없음 |
| `lib/core/permission.js:56-58`, `lib/core/file.js:143-146` `.env` 가드 | bkit 방어 정책. v0.39.1 `.env` 차단과 일치 (중복 보호) | 🟢 None | 없음 |

---

## 6. 셸 명령 회귀 위험 매트릭스 (요약)

| 위치 (file:line) | 패턴 | v0.39.1 정책 검증 적용? | 수정 필요 |
|-----------------|------|----------------------|-----------|
| `.gemini/policies/bkit-permissions.toml:8-50` (5건 deny rule) | prefix `rm -rf`, `git push --force`, `curl`, `wget`, `rm -r` | 적용 (LLM `run_shell_command` 호출 시) — 모두 prefix 매칭, 재귀 분해 후 각 부분이 동일 매칭됨 | 없음 |
| `.gemini/policies/bkit-permissions.toml:54-106` (9건 allow rule) | prefix `git status`, `git log`, `git diff`, `ls`, `cat`, `echo`, `npm test`, `npm run`, `node` | 적용 — 동일 | 없음 |
| `.gemini/policies/bkit-permissions.toml:48` (default rule) | run_shell_command default = ask_user | 적용 — 매칭 안 된 명령은 사용자 확인 (안전한 기본값) | 없음 |
| `.gemini/policies/bkit-starter-policy.toml:17-78` | prefix `rm`, `git push --force`, `git reset --hard` deny | 적용 — 동일 | 없음 |
| `mcp/bkit-server.js:1117` `spawn('gemini', args, ...)` | `gemini` 자체는 별도 프로세스 호출. policy-engine은 *그 자식 프로세스 안의* `run_shell_command`만 검증 | bkit-server 측 spawn은 policy 비대상 | 없음 |
| `mcp/tools/*.js` 내 `execSync`/`safeExec` (총 13건) | bkit MCP server 자체 Node.js child_process | 비대상 (LLM tool call 아님) | 없음 |
| `tests/test-utils.js:122,160` `execSync('echo ... | node ...')` | 테스트 인프라 — pipe 사용하지만 비대상 | 없음 |
| `lib/gemini/version.js:93,105` `execSync('... 2>/dev/null')` | bkit 내부, redirection 사용. 비대상 | 없음 |

**핵심 결론**: bkit이 LLM에게 노출하는 정책 규칙은 모두 단순 prefix 매칭이며, *bkit 정책 자체가* 셸 우회 패턴(`bash -c`, `$(...)`)을 명시적 allowlist에 두지 않는다. PR #25720의 재귀 검증은 **악의적 우회 차단을 강화**할 뿐 bkit 정상 동작을 차단하지 않는다.

---

## 7. .env 의존성 매트릭스

| 위치 | .env 변수 | 회귀 시나리오 | 대응 |
|------|----------|-------------|------|
| **bkit 코드 전수 스캔** | `.env` 파일 0건, `.env*` 파일 0건 | 비해당 | 없음 |
| `process.env.*` 모든 사용처 (전수) | 모두 부모 환경(쉘/CI/SDK)에서 상속받는 변수 — `.env` 파일 로딩 의존성 0 | 비해당 | 없음 |
| **bkit는 `.env` 방어 측** (`lib/core/permission.js:56-58`, `lib/core/file.js:143-146`, `hooks/scripts/before-tool.js:195`) | bkit가 `.env` write/read를 가드. v0.39.1 차단과 *시너지* (방어 강화) | — | 없음 |

**결론**: bkit는 `.env` 파일에 의존하지 않으며 오히려 보호 정책을 운영. v0.39.1 `.env` 로딩 차단은 bkit 정책 철학과 일치하는 *상향 정렬*.

---

## 8. 철학 정합성 검증 결과

| 원칙 | 출처 | v0.39.0 → v0.39.1 변동 | 비고 |
|------|------|----------------------|------|
| **Automation First** | core-mission.md | ⚠️ 약한 주의 | Headless trust 게이트는 자동화 흐름에 신규 마찰 도입. 단, env 1줄 주입으로 해소 가능하므로 *자동화 자체는 유지*. bkit-server.js 패치 후 정상화 |
| **No Guessing** | core-mission.md | ✅ 강화 | `.env` 차단 + trust 게이트는 "정보 부족 시 명시적 확인"과 일치. CLI가 사용자에게 trust 등록을 요구하는 패턴이 No Guessing 원칙과 정렬 |
| **Docs = Code** | core-mission.md | ✅ 유지 | 영향 없음. 단, 신규 trust 우회 옵션을 README/ops 문서에 반영 권고 |
| **Safe Defaults / Progressive Trust / Full Visibility / Always Interruptible** | core-mission.md | ✅ 강화 | trust enforcement는 Safe Defaults 4원칙 모두에 정렬: untrusted=차단(Safe Default), 명시적 등록=Progressive Trust, FatalUntrustedWorkspaceError 표시=Full Visibility, env/플래그/파일 3가지 우회=Always Interruptible |
| **AI as Partner / 3 Core Competencies (Domain Expertise / Implementation / Verification)** | ai-native-principles.md | ✅ 유지 | 영향 없음. `tools.core` 채택 시 Verification Ability 강화 가능 (§9 #1) |
| **Context Engineering 6-Layer / 12 Hook Events** | context-engineering.md | ✅ 유지 | v0.39.1 변경은 trust/policy 레이어에 한정. 6-Layer 훅 시스템 무영향 |
| **PDCA Methodology / Zero Script QA / 9-Stage Pipeline** | pdca-methodology.md | ✅ 유지 | 영향 없음 |

**종합 결론**: 6개 원칙 중 **3개 강화 / 3개 유지 / 1개(Automation First) 약한 주의**. Automation First는 bkit-server.js 1줄 패치로 즉시 회복. v0.39.1은 보안 강화 단일 테마이며 bkit 철학과 *상향 정렬*된다.

---

## 9. 기능 개선 기회

| # | 새 CLI 기능 | bkit 활용 방안 | 예상 효과 | 우선순위 | 난이도 |
|---|-----------|---------------|----------|---------|--------|
| 1 | **`tools.core` allowlist 도입** | `.gemini/settings.json`에 read-only 스킬용 `tools.core: ["read_file", "glob", "grep_search", "list_directory"]` 명시. v0.36.0+ Multi-Registry tool isolation(`mcp/bkit-server.js:1094`)과 결합하여 안전 등급별 도구 노출 정밀 통제 | 🔒 Verification Ability + Safe Defaults 강화. Starter 레벨에서 readonly 도구만 노출 가능 | P2 | 1d (PoC) |
| 2 | **trust 부트스트랩 자동화** | `mcp/start-server.sh`에 워크스페이스를 `~/.gemini/trustedFolders.json`에 등록하는 idempotent 로직 1단계 추가 (또는 별도 `scripts/bootstrap-trust.sh`). 사용자가 처음 bkit 실행 시 자동 trust 등록 | 🚀 Onboarding UX 향상. Automation First 원칙 회복 (사용자가 trust 등록 누락하는 케이스 0%) | P1 | 2-3h |
| 3 | **runners trust env 일괄 주입** | bkit-server.js 외에 향후 추가될 모든 `gemini` spawn 경로에 `GEMINI_CLI_TRUST_WORKSPACE=true` 일괄 주입을 위한 헬퍼 함수 신설 (`lib/gemini/trust.js#getSpawnEnv()`). 기존 `executeAgent`도 이 헬퍼 사용 | 🔧 미래 확장성. 새 러너 추가 시 trust 회귀 자동 방지 | P2 | 2-3h |

---

## 10. 베이스라인(v0.39.0) 대비 델타

### 10.1 신규 영향 (v0.39.1 only)

| 영역 | v0.39.1 신규 | 비고 |
|------|-------------|------|
| Critical 영향 | **+1건** (`mcp/bkit-server.js:1117` headless trust 차단) | v0.39.0 분석에서 다루지 않은 항목 |
| Medium 영향 | **+2건** (`tools.core` 채택 기회, 셸 재귀 검증 회귀 검증) | 신규 |
| Low 영향 | **+2건** (`--skip-trust` 인지, `.env` 차단 — bkit 비의존 확인) | 신규 |
| 기능 개선 기회 | **+3건** (`tools.core` 도입, trust 부트스트랩, trust env 헬퍼) | 신규 |

### 10.2 해소된 영향 (v0.39.0 → v0.39.1에서 사라진 항목)

**없음** — v0.39.1 patch는 v0.39.0 stable의 어떤 영향도 직접 해소하지 않음.

### 10.3 잔존 영향 (v0.39.0 분석에서 식별, v0.39.1에서도 그대로 유지)

| 영역 | 항목 | v0.39.1 상태 |
|------|------|--------------|
| 🔴 Critical | Issue #25655 SessionStart `systemMessage` 중복 | **여전히 잔존** — fix PR #25827 OPEN, v0.39.1 미포함 (Research §8) |
| 🟡 Medium | ContextManager + Sidecar 디커플링 (PR #24752) ↔ v2.1.0 plan 정합성 | 변동 없음 — v0.39.1 무관 |
| 🟡 Medium | MCP `auth` 블록 채택 기회 (PR #24770) | 변동 없음 |
| 🟡 Medium | JSONL chat recording 표준화 (PR #23749) | 변동 없음 |
| 🟢 Low | useAgentStream(#24292), Plan Mode `activate_skill` 게이트(#24946), GEMINI_PLANS_DIR(#25296) 등 | 모두 변동 없음 |
| 🟢 Low | Tool-controlled display protocol Steps 2-3 (#25134) 회귀 검증 (P1) | 변동 없음 |

### 10.4 v0.39.0 분석에서 권고된 P0 작업 상태

| 권고 작업 | v0.39.1 진입 시점 상태 | 우선순위 변동 |
|----------|---------------------|--------------|
| `tests/suites/tc107-v0382-session-start-duplication.js` 방어 테스트 신설 | 미신설 (단, `tc113-session-start-duplication-defense.js` 존재 — 동일 목적 신설된 것으로 추정. 확인 필요) | **확인 필요** — 만약 tc113이 동일 의도라면 P0 해소. 아니면 P0 유지 |
| `bkit.config.json` testedVersions 갱신 | v0.39.0까지 반영됨 (Line 120). v0.39.1 신규 갱신 필요 | **P0 유지** (1줄 추가) |
| `lib/gemini/version.js` v0.39.0+ feature flag 그룹 | v0.39.0 그룹 존재 (Line 185-199). v0.39.1+ 그룹 신규 필요 | **P0 유지** (4개 플래그 신규) |

---

## 11. 구현 우선순위 매트릭스

| 우선순위 | 항목 | 이유 | 예상 공수 | 출처 |
|---------|------|------|----------|------|
| **P0** | `mcp/bkit-server.js:1105` env 빌더에 `GEMINI_CLI_TRUST_WORKSPACE='true'` 1줄 추가 | 21개 에이전트 spawn이 trust 미등록 워크스페이스에서 즉시 차단 (Critical 회귀) | 5분 + 회귀 테스트 30분 | §1.1.3 |
| **P0** | `bkit.config.json:120` testedVersions에 `"0.39.1"` 추가 | 호환성 선언 | 1분 | §10.4 |
| **P0** | `lib/gemini/version.js:185-199` 뒤에 v0.39.1+ feature flag 4개 추가 | version-gate 분기 활성화 | 10분 | §10.4 |
| **P0** | E2E 검증: 실제 v0.39.1 환경에서 `mcp/bkit-server.js spawn_agent` 동작 확인 (untrusted dir에서 차단 → env 주입 후 통과) | Critical 패치 회귀 방지 | 30분 | §1.1.4 |
| **P1** | `mcp/start-server.sh` (또는 신규 `scripts/bootstrap-trust.sh`)에 trust 등록 idempotent 자동화 | Onboarding UX, Automation First 원칙 회복 | 2-3h | §9 #2 |
| **P1** | tc113-session-start-duplication-defense.js 검증 — 만약 tc107-v0382 의도와 다르면 신규 회귀 테스트 추가 | #25655 잔존 방어 | 30분-2h | §10.4 |
| **P1** | `tests/suites/tc115-v0391-headless-trust.js` 회귀 테스트 신설 (untrusted dir에서 차단 시나리오 + env 우회 시나리오) | Critical 패치 영구 방어 | 2-3h | §1.1.1 |
| **P2** | `tools.core` PoC — `.gemini/settings.json`에 readonly 스킬용 화이트리스트 추가 | Verification Ability 강화 | 1d | §9 #1 |
| **P2** | `lib/gemini/trust.js#getSpawnEnv()` 헬퍼 신설 — 미래 spawn 경로 일괄 trust env 주입 | 미래 확장성 | 2-3h | §9 #3 |
| **P2** | LLM이 자주 사용하는 pipe 조합 식별 (예: `... | tail`, `... | head`, `git log | grep ...`) → bkit-permissions.toml allowlist 보강 | 셸 재귀 검증 운영 마찰 감소 | 2h (관찰) | §2.2.1 |
| **P3** | `gemini-cli-learning/SKILL.md`에 v0.39.1 trust 우회 옵션 1단락 추가 | 사용자 교육 | 30분 | §3 |
| **P3** | PR #25827 (#25655 fix) 머지 모니터링 → v0.39.2/v0.40.0 stable 진입 시 즉시 검증 | 잔존 #25655 해소 추적 | 5분/주 | §10.3 |
| **하지 않을 것** | `--skip-trust` CLI 플래그 사용 | env 방식이 v0.39.0 이하와 호환 (unknown flag 회피). version-safe 우선 | 0 | §1.1.3 |
| **하지 않을 것** | `.env` 로딩 관련 코드 패치 | bkit는 `.env` 비의존 + 방어 측. 불필요 | 0 | §7 |

---

## 12. 조사 신뢰도

| 항목 | 신뢰도 | 비고 |
|------|--------|------|
| 헤드리스 trust enforcement (PR #25814) bkit 적중 경로 | ⬛⬛⬛⬛⬛ | `mcp/bkit-server.js:1117` `spawn('gemini', ...)` 직접 확인. `cwd: process.cwd()` Line 1119 명시 확인 |
| 셸 재귀 검증 (PR #25720) bkit 정책 회귀 0건 | ⬛⬛⬛⬛⬛ | `bkit-permissions.toml` 전수 검토. 모두 prefix 매칭, 셸 우회 명시 allowlist 0건 |
| `.env` 차단 (PR #25814) bkit 비의존 | ⬛⬛⬛⬛⬛ | `find . -name ".env*"` 0건. `process.env.*` 사용처 전수 검토 — `.env` 파일 의존 0 |
| `tools.core` 채택 기회 | ⬛⬛⬛⬛⬜ | 신규 설정 시맨틱 1차 검토 완료. `tools.confirmationRequired` 우선순위는 Research §3.1 기재 — bkit 적용 시 우선순위 충돌 시나리오 추가 검증 필요 |
| MCP server stdio가 trust 게이트 비대상인지 | ⬛⬛⬛⬜⬜ | **확인 필요** — Research/PR 본문에 명시 없음. 추측: stdio 기반 MCP는 인터랙티브 세션 내부 통신이라 trust 검증 비대상이지만, 자식 spawn 시 별도 검증 — Phase 3에서 실제 v0.39.1 바이너리로 검증 권고 |
| `GEMINI_CLI_TRUST_WORKSPACE` 환경변수가 부모-자식 간 정상 상속되는지 | ⬛⬛⬛⬛⬜ | Node.js child_process spawn은 기본적으로 env 상속 — `mcp/bkit-server.js:1118` `env` 옵션 명시 → 적용됨. 단, gemini 바이너리가 이 env를 trust 검증 단계에서 *실제로* 우회 게이트로 사용하는지는 v0.39.1 환경 검증 필수 |
| tc113-session-start-duplication-defense.js의 의도 | ⬛⬛⬛⬜⬜ | **확인 필요** — 파일명만 확인, 내부 검증 로직이 v0.39.0 분석에서 권고된 tc107-v0382 의도와 동일한지 미확정 |

---

## 13. 최종 결론

v0.39.1의 핵심 변경 **헤드리스 모드 trust enforcement(PR #25814)**는 bkit `mcp/bkit-server.js:1117`의 `spawn('gemini', args, ...)` 호출을 정면 적중한다. bkit의 모든 21개 에이전트 호출은 이 단일 spawn 경로를 거치므로, **trust 미등록 워크스페이스에서는 즉시 회귀**가 발생한다. 다행히 **단일 패치(env 빌더에 1줄 `env.GEMINI_CLI_TRUST_WORKSPACE='true'` 추가)로 일괄 해소** 가능하며, 이는 Critical 영향이지만 **수정 난이도는 5분**.

셸 재귀 검증 강화(PR #25720)는 bkit 정책에 회귀 위험 0건 (모두 prefix 매칭, 셸 우회 명시 allowlist 0건). `tools.core` 신규 설정은 **Verification Ability 강화 기회**로 활용 가능. `.env` 로딩 차단은 bkit이 *방어 측*에 있으므로 *상향 정렬* (영향 0).

전체 위험도 **MEDIUM-HIGH** (Critical 1건이 핵심 경로 적중하지만 1줄 패치로 해소). v0.39.0 → v0.39.1 in-place migration plan 권고: 본 분석의 §11 P0 4건(env 주입, testedVersions, version flag 4개, E2E 검증)을 v0.39.0 plan에 추가 반영하여 단일 PR로 처리.

핵심 잔존 위험: Issue #25655 SessionStart 중복 미해결 (fix PR #25827 OPEN). v0.39.1은 이 이슈를 해소하지 않음.

---

*분석 종료: 2026-04-25. v0.39.1 patch 영향 분석 완료. v0.39.0 stable 베이스라인 대비 신규 Critical 1건 + Medium 2건. 단일 패치로 회귀 일괄 해소 가능.*
*bkit-impact-analyzer agent*
