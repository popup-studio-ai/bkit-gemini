---
name: gemini-cli-learning
classification: C
description: |
  Gemini CLI learning and education skill.
  Teaches users how to configure and optimize Gemini CLI settings.

  Start learning/setup with "learn" or "setup".

  Use proactively when user is new to Gemini CLI or asks about configuration.

  Triggers: learn gemini cli, gemini cli setup, GEMINI.md, hooks, commands, skills,
  how to configure, gemini cli learning,
  제미나이 CLI 배우기, 설정 방법,
  Gemini CLI学習, 設定方法,
  学习Gemini CLI, 配置方法,
  aprender gemini cli, configuración,
  apprendre gemini cli, configuration,
  Gemini CLI lernen, Konfiguration,
  imparare gemini cli, configurazione

  Do NOT use for: implementation tasks, debugging code

# ──── NEW FIELDS (v1.5.1) ────
user-invocable: true
argument-hint: "[learn|setup]"

allowed-tools:
  - read_file
  - write_file
  - glob
  - grep_search
  - google_web_search
  - web_fetch

imports: []

agents: {}

context: session
memory: user
pdca-phase: all
---

# Gemini CLI Learning

> Learn to configure and optimize Gemini CLI

## Topics

### 1. GEMINI.md Configuration

The context file that provides instructions to Gemini:

```markdown
# Project Context

## Overview
This project uses Next.js 14 with App Router.

## Coding Standards
- Use TypeScript
- Follow ESLint rules
- Use Prettier for formatting

## Architecture
[Describe your architecture here]
```

### 2. Extensions

Install and manage extensions:

```bash
# Install from GitHub
gemini extensions install username/extension-name

# List installed
gemini extensions list

# Update all
gemini extensions update
```

### 3. Hooks

Customize Gemini CLI behavior:

```json
{
  "hooks": {
    "SessionStart": [...],
    "BeforeAgent": [...],
    "BeforeTool": [...],
    "AfterTool": [...]
  }
}
```

### 4. Agent Skills

Create custom skills:

```yaml
---
name: my-skill
description: Does something useful
license: Apache-2.0
---

# My Skill

Instructions for the skill...
```

### 5. MCP Servers

Connect to external services:

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": ["run", "ghcr.io/github/github-mcp-server"]
    }
  }
}
```

## Commands

```bash
# Learn about specific topic
/gemini-cli-learning hooks

# Setup new project
/gemini-cli-learning setup

# Get help
/gemini-cli-learning help
```

## 6. Gemini CLI Version History — v0.40.0 ~ v0.42.0 stable (bkit v2.0.7 누적 흡수)

> bkit v2.0.7은 Gemini CLI v0.40.0 → v0.40.1 → v0.41.0 → v0.41.1 → v0.41.2 → v0.42.0 stable의 6개 릴리스를 단일 sprint(`v0.42.0-stable-migration`)에서 누적 흡수했다. 본 단락 12개는 각 릴리스의 핵심 변경, bkit 대응, PR 출처를 추적 가능한 형태로 명문화한다. v0.42.0 stable 단락(12)은 PR #25827 정정과 R-extra-1 (agent dispatch) 갭을 포함한다.

### 단락 1 — v0.40.0 (preview cycle, 2026-04-XX)

핵심 Breaking changes 4건이 본 릴리스에 도입됐고 bkit는 4개의 신규 capability flag로 매핑했다.

- **Bx0** `continueOnFailedApiCall` config 옵션 제거 + `"System: Please continue."` post-stream injection 제거 ([PR #26340](https://github.com/google-gemini/gemini-cli/pull/26340)) — bkit 코드 영향 0건 (이 옵션 미사용).
- **Bx1** core tools가 native `ToolDisplay` 객체 emit, legacy `returnDisplay` adapter deprecated ([PR #25186](https://github.com/google-gemini/gemini-cli/pull/25186)) — bkit MCP tool들은 `returnDisplay`에 의존하지 않음. 0건.
- **Bx2** `exit_plan_mode`를 `run_shell_command`로 호출 금지 ([PR #26230](https://github.com/google-gemini/gemini-cli/pull/26230)) — bkit `hooks/scripts/before-tool-selection.js`의 `CRITICAL_TOOLS` 등록은 *호출 차단* 가드 (Bx2의 *발신 차단*과 직교). 0건.
- **Bx3** `Config.setSessionId()` 호출 시 15+ session-scoped 상태 일괄 reset ([PR #26342](https://github.com/google-gemini/gemini-cli/pull/26342)) — bkit는 `Config.setSessionId()` 직접 호출 안 함. 0건.

**bkit 대응**: `lib/gemini/version.js`에 v0.40.0+ 그룹 4 flag 추가 (`hasContinueOnFailedApiCallRemoved`, `hasNewToolDisplay`, `hasExitPlanModeShellBan`, `hasSetSessionIdReset`). 참조: `docs/01-plan/features/gemini-cli-v0.40.0-migration.plan.md`, `docs/01-plan/research/gemini-cli-v0.40.0-research.md`, `docs/03-analysis/gemini-cli-v0.40.0-impact.analysis.md`.

### 단락 2 — v0.40.1 (patch)

v0.40.0 minor bug fix 패치. 신규 기능 0건, breaking change 0건. bkit 영향 추정: 0건. testedVersions에 추가 등록만 수행. 참조: `docs/04-report/gemini-cli-v0.40.0-migration.report.md`.

### 단락 3 — v0.41.0

Context/Memory 신기능 4건 도입 (모두 opt-in). bkit는 4개의 신규 flag로 매핑하되 모두 *`false`로 잠금* (Cx1/Cx2/Cx14는 v2.1.0 cycle 위임).

- **Cx1** `--ignore-env` flag / `advanced.ignoreLocalEnv` setting ([PR #26445](https://github.com/google-gemini/gemini-cli/pull/26445)) — CI/headless 사용자 환경 변수 누설 차단. bkit `GEMINI_CLI_TRUST_WORKSPACE` 전파와 충돌 가능성 검증 후 채택 예정.
- **Cx2** `experimental.autoMemory` inbox flow + `extraction.patch` canonical contract ([PR #26338](https://github.com/google-gemini/gemini-cli/pull/26338)) — bkit `.bkit/state/session-history.json` namespace 직교성 검증 후 통합.
- **Cx14** `--prompt` (-p) flag undeprecated ([PR #26329](https://github.com/google-gemini/gemini-cli/pull/26329)) — bkit가 이미 `-p` 사용 중 (예: `gemini -p "..."`). deprecation 우려 해소.
- (참조) a2a-server 분리 신호 — 별도 단락 6 참조.

**bkit 대응**: `lib/gemini/version.js`에 v0.41.0+ 그룹 4 flag 추가 (`hasA2aServerSplit`, `hasAutoMemoryInbox`, `hasIgnoreEnvFlag`, `hasPromptUndeprecated`). `.gemini/settings.json`에 `experimental.autoMemory: false`, `experimental.memoryManager: false` 명시 잠금. 참조: `docs/01-plan/features/gemini-cli-v0.41.1-migration.plan.md`, `docs/03-analysis/gemini-cli-v0.41.1-impact.analysis.md`.

### 단락 4 — v0.41.1 (patch)

`memoryManager` 옵션 신설 (Cx2 inbox flow의 보강) + 기타 minor fix. bkit는 `.gemini/settings.json`에 `experimental.memoryManager: false`로 잠금하여 v2.1.0 cycle까지 미사용. 참조: `docs/04-report/gemini-cli-v0.41.1-migration.report.md`.

### 단락 5 — v0.41.2 (patch)

v0.41.x cycle 누적 fix + a2a-server 모듈 분리(별도 단락 6). bkit P1~P4까지 완료하고 Do 미실행 상태로 본 sprint(v0.42.0-stable-migration)에서 통합 흡수. 누적 영향 추정: 33 files (High 5 / Medium 10 / Low 28). 본 sprint 누적 Do 동시 흡수 결정 사유: Strategy B' 13회차 (단일 PR 통합 + B' cycle 일관성). 참조: `docs/04-report/gemini-cli-v0.41.2-migration.report.md`, `docs/03-analysis/gemini-cli-v0.41.2-impact.analysis.md`.

### 단락 6 — v0.41.2: a2a-server 분리 (강조)

Gemini CLI v0.41.2에서 `a2a-server` 모듈이 별도 패키지로 분리됐다. **bkit의 영향 분석 결론: 사용 0건**.

- `grep -rn "a2a-server" mcp/ lib/ hooks/ tests/` = 코드 사용 0건 (lib/gemini/version.js에 참조용 capability flag 주석 1건만, `hasA2aServerSplit`)
- bkit MCP (`mcp/bkit-server.js`)는 a2a-server에 의존하지 않음 (별도 spawn-based subprocess 패턴 사용)
- 본 sprint W2 F2.8 grep 검증으로 회귀 0건 확정

향후 bkit이 multi-agent 통신을 도입할 경우 a2a-server 채택 검토 가능 (v2.1.0 또는 그 이후 cycle).

### 단락 7 — v0.42.0-preview.0

v0.42.0 stable cycle 첫 preview release. 핵심 식별 사항:
- **Cx13** `experimental.gemma` default `false` → `true` 변경 ([PR #26307](https://github.com/google-gemini/gemini-cli/pull/26307)) — **Gemma 4 default-on**. Bx4 위험 식별.
- preview cycle 시작 → bkit는 stable 출시까지 monitoring 모드.

참조: `docs/01-plan/research/gemini-cli-v0.42.0-preview-research.md`.

### 단락 8 — v0.42.0-preview.1

preview.0의 minor fix + Cx14 `--prompt` undeprecated 정정 확정. bkit 영향 추정 0건. preview cycle B' 12회차에 진입.

### 단락 9 — v0.42.0-preview.2

stable 후보 RC. preview.2 → stable bit-for-bit promotion 확인 (commit `68e2196d` `chore(release): v0.42.0`, 9 files = package.json/lockfile만). bkit 영향 분석 본 cycle delta: 1 Low (`skills/gemini-cli-learning/SKILL.md` placeholder, 본 단락 자체).

### 단락 10 — PR #25827 main MERGED 발견 (preview cycle 중)

preview cycle 중 PR #25827 (SessionStart `systemMessage` 중복 fix)이 main에 MERGED됨 (2026-05-11 16:59 UTC, merge_commit_sha `ecfaac2dc7...`, Issue #25655 CLOSED). **그러나 v0.42.0 release 브랜치에는 cherry-pick되지 않음** (`compare/{25827_merge}...{v0.42.0}` = diverged, ahead 6/behind 54). bkit는 워크어라운드 9 위치를 v0.42.0 cycle 내내 유지하기로 결정 (D5 명문화).

### 단락 11 — v0.42.0-preview cycle B' 13회차 (사전 부검)

B' 13회차 (Strategy B' "preview 압축 + stable 갱신") 결정:
- D1: 시나리오 A 활성화 (stable 출시 후 5 cycle 통합 단일 PR)
- D3: Cx13 본 cycle 채택 (잠금)
- D4: PR #25827 워크어라운드 v0.42.0 cycle 유지
- D5: PR #25827 정정 흡수 명문화 (No Guessing 강화)

본 sprint(v0.42.0-stable-migration) Total 추정: ~5h, cumulativeTokens < 50K, 영향 33 files / Critical 0 / High 5 / Medium 10 / Low 28.

### 단락 12 — v0.42.0 stable (2026-05-12 출시, 본 sprint 처리 결과)

**v0.42.0 stable (2026-05-12 22:29 UTC 출시)**: preview.2 bit-for-bit promotion (code 0건, `chore(release): v0.42.0` 단일 commit SHA `68e2196d`, 9 files 모두 package.json/package-lock.json).

**bkit v2.0.7 처리 결과**:
- **Bx4 Gemma 4 default-on 잠금**: `.gemini/settings.json` `experimental.gemma: false`로 명시 잠금. 사용자가 Gemma 사용 시 명시 opt-in 필요.
- **Cx13** `hasGemmaDefaultOn` flag 신설 (`lib/gemini/version.js`). 9개 capability flag 그룹 추가 완료 (`tc38` 매트릭스 29 PASS).
- **Cx1~Cx14 14건 중 Cx13만 채택**, 나머지 13건 별도 cycle (v2.1.0-context-optimization) 위임.
- **PR #25827 정정**: main MERGED 2026-05-11이나 v0.42.0 release 브랜치 미포함 → SessionStart `systemMessage` 워크어라운드(`BKIT_SESSION_START_VERBOSE` slim default + `tc113`/`tc114` + 5개 tc 환경변수 명시 + `GEMINI.md` 사용자 문서) **v0.42.0 cycle 유지, v0.43.0 stable cycle 제거 후보**.
- **v0.43.0-preview.0** 동시 출시 시그널은 `docs/01-plan/features/v2.1.0-context-optimization.plan.md §11`에 명문화 (D8 carry).

**Dual-version 검증 (본 sprint W3/W4/W5)**: `gemini` (local v0.39.1) + `npx --yes @google/gemini-cli@0.42.0` 두 환경에서:
- `bkit Vibecoding Kit v2.0.7 activated` 메시지 양 환경 출력 ✅
- bkit hook (SessionStart/SessionEnd) 정상 동작 ✅
- `gemini agents list` catalog: v0.39.1 = bkit 21 + v0.42.0 = bkit 21 + 내장 3 (codebase_investigator, cli_help, generalist) = 24 ✅
- baseline 1939/2046 = 94.8% pass (양 env 동일, AC pass≥1925 충족) ✅
- tc113 (SessionStart 중복) 8/8 ✅
- tc115 (v0.39.1 headless trust) 8/8 ✅
- tc38 (capability flag matrix) 29 PASS ✅

**R-extra-1 (사전 부채, v2.1.0-agent-dispatch-fix sprint 위임)**:
- `gemini agents list` catalog는 21 agent 인식 ✅
- 그러나 `gemini -p "Use the <agent> agent..."` invocation 시 `LocalSubagentInvocation.execute` HTTP 404 → `generalist` agent fallback
- 양 환경(v0.39.1 + v0.42.0) 동일 = **본 sprint scope 외 사전 부채** (v0.39.1부터 누적)
- fallback 경로는 정상 LLM 응답 산출 (응답 길이 > 0, 명령 거부 0건). design.md F2.5 sample command 기준 PASS (M8 L6 6.25/12.5 PARTIAL).
- 해결: `docs/01-plan/sprints/v2.1.0-agent-dispatch-fix-master-plan.md` (v0.42.0 stable PR 머지 직후 시작 예정)

**v0.42.0 신규 발견 (W6 carry)**:
- `gemini gemma` subcommand 신규 (Cx13 잠금이 정합성 보장)
- `--session-id` CLI flag 신규 (Bx3 짝)
- v0.42.0 환경에서 `Ripgrep is not available. Falling back to GrepTool.` 경고 — 정보성. v2.1.0 cycle에 ripgrep 설치 안내 carry.
- 신규 내장 agent 3개 (codebase_investigator/cli_help/generalist) — v2.1.0-agent-dispatch-fix 또는 그 이후 cycle에서 bkit과의 협업/위임 패턴 검토.

## 7. Pre-existing Conditions (사전 부채, transparent 명시)

bkit v2.0.7은 다음 사전 부채를 명시적으로 공시한다. 모두 v0.42.0 migration scope **외** 항목이며, 별도 sprint에 위임된다:

| ID | 항목 | 상태 | 위임 sprint | 사용자 영향 |
|---|---|---|---|---|
| R-extra-1 | bkit 21 agent의 `gemini -p` dispatch (404) | dual-env 동일 (v0.39.1+v0.42.0) | `v2.1.0-agent-dispatch-fix` | `generalist` fallback으로 정상 응답. 단, 특화 agent 의도 시 결과 품질 차이 가능. |
| R-extra-2 | 사전 부채 83건 (PDCA-* 35 + TC80-* 9 + COMP-* 7 + 기타 32) | baseline 83 fail 항목 | `bkit-baseline-stabilization` sprint | baseline 1939/2046 = 94.8% (AC 1925/2032 충족). 본 sprint scope에서는 회복 0건이지만 회귀도 0건. |

## Commands

```bash
# Learn about specific topic
/gemini-cli-learning hooks

# Setup new project
/gemini-cli-learning setup

# Get help
/gemini-cli-learning help

# v0.42.0 stable specific
gemini --version           # local installed version 확인
npx --yes @google/gemini-cli@0.42.0 --version   # v0.42.0 직접 호출
gemini agents list         # 21 bkit agent + (v0.42.0+) 내장 3 = 24
cat .gemini/settings.json | jq '.experimental.gemma'  # Cx13 잠금 검증 (반드시 false)
```

## Resources

- [Gemini CLI Docs](https://geminicli.com/docs/)
- [Extensions Guide](https://geminicli.com/docs/extensions/)
- [Hooks Reference](https://geminicli.com/docs/hooks/)
- [v0.42.0 stable Release](https://github.com/google-gemini/gemini-cli/releases/tag/v0.42.0)
- [v0.43.0-preview.0 Release (next cycle signal)](https://github.com/google-gemini/gemini-cli/releases/tag/v0.43.0-preview.0)
- [PR #26307 (Cx13 Gemma 4 default-on)](https://github.com/google-gemini/gemini-cli/pull/26307)
- [PR #25827 (SessionStart systemMessage fix, MERGED but excluded from v0.42.0)](https://github.com/google-gemini/gemini-cli/pull/25827)
- bkit v0.42.0-stable-migration sprint 산출물: `docs/01-plan/sprints/v0.42.0-stable-migration-*.md`
- bkit v0.42.0 test plan + user instructions: `docs/test-plans/v0.42.0-bkit-extension-test-plan.md` + `docs/test-plans/v0.42.0-user-test-instructions.md`
