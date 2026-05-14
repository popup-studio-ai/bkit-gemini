# Gemini CLI v0.42.0 stable 변경사항 조사 보고서 (P1)

> 작성일: 2026-05-13
> 작성자: gemini-researcher agent (PDCA Strategy B' 13회차 후보)
> 베이스라인: bkit v2.0.6 (= Gemini CLI v0.39.1 main 머지) + v0.41.2 cycle (P1~P4 완료, Do 미실행)
> **본 cycle 비교 범위**: `v0.41.2 → v0.42.0 stable` (v0.42.0 = 2026-05-12 22:29 UTC 릴리스)
> **참조 산출물 (delta 압축 베이스)**: `docs/01-plan/research/gemini-cli-v0.42.0-preview-research.md` (390 lines, 2026-05-09 작성, preview.2 기반)
> **추가 컨텍스트**: v0.43.0-preview.0이 v0.42.0 stable과 사실상 동시 릴리스됨 (preview.0 22:25 UTC → stable 22:29 UTC, 4분 간격)
> 출처: GitHub Releases/PR/compare API (`gh` CLI 직접 호출), preview-research.md 인용

---

## 0. 조사 메타데이터

### 0.1 본 보고서의 역할

- **stable 한정 delta**: preview.2 (2026-05-06) → v0.42.0 stable (2026-05-12) 간 변경의 실체 확정
- **preview-research 차분 검증**: preview-research가 §8 "사전 시그널"로 식별한 *최신 nightly* 24 commits delta 중 stable에 *실제로 흡수된 것이 무엇인지* 확정
- **v0.43.0-preview.0 시그널**: 다음 cycle 방향성 추출
- **누적 baseline 비교 그대로 유효**: v0.41.2 P1~P4 + v0.42.0-preview P1은 본 보고서의 base. *재작성 없음*.

### 0.2 본 P1의 핵심 발견 사실 (사전 정정 포함)

1. **preview.2 → v0.42.0 stable: 사실상 *코드 변경 0건***
   - `gh api repos/google-gemini/gemini-cli/compare/v0.42.0-preview.2...v0.42.0` 결과: **ahead 1 commit, 9 파일**
   - 9개 파일 = **모두 `package.json` / `package-lock.json` 버전 범프** (`chore(release): v0.42.0`, SHA `68e2196d`)
   - **소스 코드 패치 0건, 도큐먼트 변경 0건, 테스트 변경 0건**
   - 결론: **v0.42.0 stable = v0.42.0-preview.2의 *bit-for-bit* promotion**
   - preview-research §10.4의 "v0.42.0 stable 출시 시 즉시 흡수 가능 여부 ✅ 가능" 결론 **정정 불필요 — 그대로 유효**

2. **PR #25827 (SessionStart `systemMessage` 중복 fix) — main에 MERGED but v0.42.0에 미포함 (preview-research §9 정정)**
   - `gh api repos/google-gemini/gemini-cli/pulls/25827`: `merged: true, merged_at: 2026-05-11T16:59:22Z`, `merge_commit_sha: ecfaac2dc7...`
   - Issue #25655: `state: CLOSED, stateReason: COMPLETED`
   - **그러나** `gh api compare/{25827_merge_sha}...{v0.42.0_tag_sha}` 결과: `status: diverged, ahead 6, behind 54`
   - **v0.42.0 release 브랜치는 main에서 분기된 별도 라인** — PR #25827은 main에는 들어갔지만 release 브랜치에는 cherry-pick되지 않음
   - **그러나 v0.43.0-preview.0에는 포함**: `compare/v0.42.0-preview.2...v0.43.0-preview.0` 80 commits 중 `fix(cli): prevent duplicate SessionStart systemMessage render (#25827)` 확인
   - **결론**: bkit의 SessionStart `systemMessage` 워크어라운드는 **v0.42.0 stable에서도 유지 필요**. v0.43.0-preview.0부터 자연 해소.

3. **v0.43.0-preview.0 동시 릴리스 (2026-05-12 22:25 UTC, stable 출시 4분 전)**
   - `compare/v0.42.0...v0.43.0-preview.0`: ahead 80, behind 6, files 300
   - "behind 6" = release/v0.42.0 브랜치에 있는 6개 release 자동화 commit (changelog, version bump 등)이 main에 미반영
   - 다음 cycle 핵심 시그널: §3 분석

### 0.3 본 P1이 preview-research 대비 새로 갱신하는 것

| # | 항목 | preview-research 기록 | 본 P1 확정 |
|---|---|---|---|
| 1 | v0.42.0 stable 실체 | preview.2 promotion 추정 | **확정: bit-for-bit promotion (9 파일 package.json만 변경)** |
| 2 | preview.2 → 최신 nightly 24 commits delta 흡수 여부 (preview-research §8) | "거의 확정" / "매우 높음" 추정 | **확정: 흡수 0건** — 24개 commits *전부 v0.42.0 stable 미포함*. v0.43.0-preview.0으로 흡수됨 |
| 3 | PR #25827 상태 (preview-research §9) | OPEN (미머지) | **정정: main에 MERGED (2026-05-11) but v0.42.0 release 브랜치 미포함. v0.43.0-preview.0에 포함** |
| 4 | v0.43.0-preview.0 시그널 | 없음 | **신설 §3** — 80 commits delta 핵심 신기능 9건 식별 |
| 5 | bkit 영향 추정 | preview-research §10 그대로 | **재확인: Critical 0 / High 2 / Medium 1 / Low 4 — 변동 없음** |

### 0.4 사용 소스

- GitHub Releases (`gh release view`): v0.42.0, v0.43.0-preview.0, v0.42.0-preview.2 (재확인)
- GitHub compare API:
  - `v0.42.0-preview.2...v0.42.0` (ahead **1**, 9 files — package.json만)
  - `v0.41.2...v0.42.0` (ahead **112**, 300 files — preview.2 누적 + 버전 범프 1)
  - `v0.42.0...v0.43.0-preview.0` (ahead **80**, 300 files)
  - `compare/{PR25827_merge_sha}...{v0.42.0_tag_sha}` (diverged, ahead 6 / behind 54)
- GitHub PR API: #25827 (merge 상태 재검증), #26514 (export/import session), #25303 (RemoteSubagentProtocol), #26888 (adaptive token calculator)
- GitHub Issue API: #25655 (CLOSED/COMPLETED 확정)
- **preview-research 인용**: §1, §2, §3, §4, §5, §6, §7, §8, §10, §11, §12, §13, §14 — *delta only*
- 외부 블로그/비공식 매체: 0건

---

## 1. v0.41.2 → v0.42.0 stable 누적 변경 요약 (preview-research 인용)

> preview-research §1~§7이 누적 변경 *전부*를 다룸. v0.42.0 stable = preview.2 bit-for-bit promotion이므로 그대로 유효.

### 1.1 Breaking Changes (1 + 4 행동 변화) — **preview-research §2 참조**

- **Bx0**: `continueOnFailedApiCall` config 옵션 **제거** + `"System: Please continue."` post-stream injection 제거 (PR #26340) — bkit 영향 추정 0건
- **Bx1**: core tool들이 native `ToolDisplay` 객체 emit, legacy `returnDisplay` adapter deprecated (PR #25186, refactor 일부)
- **Bx2**: `exit_plan_mode`를 `run_shell_command`로 호출 금지 (PR #26230)
- **Bx3**: `Config.setSessionId()` 호출 시 15+ session-scoped 상태 일괄 reset (PR #26342)
- **Bx4**: `experimental.gemma` default `false` → `true` (Gemma 4 default-on, PR #26307)

**preview-research §2 표 그대로 유효** — stable에 새로 추가된 Breaking 0건.

### 1.2 새로운 기능 14건 — **preview-research §3 참조**

| # | 핵심 신기능 | PR | preview-research |
|---|---|---|---|
| Cx1 | `--ignore-env` flag + `advanced.ignoreLocalEnv` setting | #26445 | §3 Cx1 |
| Cx2 | Auto Memory inbox flow (`extraction.patch` canonical contract) | #26338 | §3 Cx2 |
| Cx4 | `/bug-memory` slash command + `/bug` 2GB 자동 heap snapshot | #25639 | §3 Cx4 |
| Cx5 | V8 heap snapshot utility | #26440 | §3 Cx5 |
| Cx6 | `/exit --delete` flag | #19332 | §3 Cx6 |
| Cx7 | `/commands list` subcommand | #22324 | §3 Cx7 |
| Cx8 | `/extensions delete` alias | #25660 | §3 Cx8 |
| Cx10 | Voice Mode privacy/compliance UX warning | #26454 | §3 Cx10 |
| Cx11 | `/agents refresh` 개선 로깅 | #26442 | §3 Cx11 |
| Cx12 | Inquiry 제약 강화 (unauthorized 변경 방지) | #26310 | §3 Cx12 |
| Cx13 | Gemma 4 default-on (Bx4 짝) | #26307 | §3 Cx13 |
| Cx14 | `--prompt` (-p) flag **undeprecated** | #26329 | §3 Cx14 |

**preview-research §3에 포함됐으나 stable 미포함인 항목 (정정)**:
- **Cx3**: Auto Memory private patch allowlist tighten (PR #26535) — preview-research §3에서 "nightly 20260507 (preview.2 미포함)"로 표시. **확정: v0.42.0 stable 미포함. v0.43.0-preview.0에 포함됨** (본 보고서 §3 참조)
- **Cx9**: queuing messages during compression (PR #26506) — preview-research §3에서 "nightly 20260506 (preview.2 미포함)"로 표시. **확정: v0.42.0 stable 미포함. v0.43.0-preview.0에도 미포함** (별도 nightly 분기 — 다음 cycle 추적)

### 1.3 Deprecation 예고 — **preview-research §4 참조**

명시 deprecation 통보 0건. `--prompt` deprecation은 v0.42.0에서 정정(undeprecated)됨.

### 1.4 설정 / 구성 변경 — **preview-research §5 참조**

- `advanced.ignoreLocalEnv` **신규** (default `false`, 옵트인)
- `--ignore-env` flag **신규**
- `experimental.gemma` default `false` → `true` (Bx4)
- `continueOnFailedApiCall` **제거** (Bx0, no-op이었음)
- `experimental.autoMemory` 의미 확장 (inbox flow 추가, Cx2)
- `--prompt` deprecation 표시 제거 (정정)

### 1.5 보안 패치 — **preview-research §6 참조**

- PR #26230 (`exit_plan_mode` shell 금지)
- PR #26310 (Inquiry 강화)
- PR #26340 (`"System: Please continue."` injection 제거)
- PR #26198 (A2A pushMessage 빈 log guard)
- PR #26136 (Extension MCP client disconnect leak)

**stable 미포함 보안 패치 (preview-research §6에 포함됐으나 정정)**:
- PR #26571 (OAuth headless Linux silent hang fix) — preview-research §6에서 "nightly 20260507 (preview.2 미포함)" → **확정: v0.42.0 stable 미포함. v0.43.0-preview.0에 포함**
- PR #26535 (Auto Memory private patch allowlist tighten) — **확정: v0.42.0 stable 미포함. v0.43.0-preview.0에 포함**

### 1.6 버그 수정 (bkit 관련) — **preview-research §7 참조**

stable에 포함된 핵심 11건:
- PR #26191 (API timeout 5분 → 60초)
- PR #26342 (session resumption state reset)
- PR #26218 (`InvalidStream` graceful handling)
- PR #26340 (post-stream injection 제거)
- PR #26542 (YOLO/AUTO_EDIT redirection — preview.1 cherry-pick)
- PR #26568 (a2a-server race fix — preview.2 cherry-pick)
- PR #26330 (branch indicator git worktree fix)
- PR #25662 (GEMINI.md EISDIR silent skip)
- PR #26132 (auto-update channel downgrade 방지)
- PR #26136 (Extension MCP cleanup)
- PR #26264 (informational logs JSON 누설 차단)
- PR #26285 (sandbox 비활성 auto-update check)

**stable 미포함 버그 fix (preview-research §7에서 nightly로 분류됐으나 stable에 미흡수)**:
- PR #26534 (context manager chat corruption fix)
- PR #26452 (async context hysteresis fix)
- PR #26571 (OAuth headless Linux silent hang fix)

이 3건은 **v0.43.0-preview.0에 포함됨** (§3 참조).

---

## 2. v0.42.0 stable 한정 delta (preview.2 → stable)

### 2.1 commit / 파일 변경 실체

| 메트릭 | 값 |
|---|---|
| commits ahead | **1** |
| commits behind | 0 |
| files changed | 9 |
| 코드 패치 | **0건** (소스/테스트/도큐 변경 0) |
| 변경 파일 | **모두 `package.json` 계열만** (`package.json`, `package-lock.json`, 7개 sub-package의 `package.json`) |
| 단일 commit | `chore(release): v0.42.0` (SHA `68e2196d5b487a8e477adff9ebe0b8116cead273`, 2026-05-12 22:27 UTC) |

### 2.2 9개 변경 파일 명세

| 파일 | additions | deletions | 변경 성격 |
|---|---|---|---|
| `package.json` | 2 | 2 | 최상위 version 필드 + workspace ref |
| `package-lock.json` | 9 | 9 | npm lockfile (각 workspace ref) |
| `packages/a2a-server/package.json` | 1 | 1 | version |
| `packages/cli/package.json` | 2 | 2 | version + core ref |
| `packages/core/package.json` | 1 | 1 | version |
| `packages/devtools/package.json` | 1 | 1 | version |
| `packages/sdk/package.json` | 1 | 1 | version |
| `packages/test-utils/package.json` | 1 | 1 | version |
| `packages/vscode-ide-companion/package.json` | 1 | 1 | version |

### 2.3 stable promotion 의미

- **사실상의 *retag 릴리스***: preview.2 (2026-05-06 18:06 UTC) → stable (2026-05-12 22:29 UTC) **6일 burn-in** 후 promotion
- **새 fix/feat/breaking change 0건** — preview.2 cherry-pick 2건이 마지막 substantive 변경
- bkit 마이그레이션 관점에서: **preview.2를 검증한 결과 = stable을 검증한 결과**. preview-research §10 (Critical 0 / High 2 / Medium 1 / Low 4) **그대로 유효**
- preview-research §8 "preview.2 → 최신 nightly 24 commits delta" 사전 시그널 → **stable 흡수 0건 확정**. 모든 24 commits는 v0.43.0-preview.0으로 흘러감

---

## 3. v0.43.0-preview.0 동시 릴리스 시그널 (다음 cycle 방향성)

### 3.1 릴리스 메타데이터

| 항목 | 값 |
|---|---|
| 태그 | v0.43.0-preview.0 |
| 릴리스 일시 | 2026-05-12 22:25:17 UTC (stable 출시 **4분 전**) |
| 성격 | prerelease |
| compare base | v0.42.0 stable |
| ahead / behind | 80 / 6 |
| files changed | 300 |
| 새 contributor | 14명 |

### 3.2 v0.42.0 → v0.43.0-preview.0 핵심 신기능 9건

| # | PR | 신기능 | bkit 영향 추정 (다음 cycle 위임) |
|---|---|---|---|
| Dx1 | #26480 | **`feat(core): steer model to use edit tool for surgical edits`** — LLM이 작은 변경에 `edit` 도구 선호하도록 system prompt 강화 (preview-research §8) | 🟢 긍정 — bkit 도구 사용 정확도 향상 |
| Dx2 | #26514 | **`feat: export session to file and import via flag`** — `/export-session <path>` 슬래시 명령 + `--session-file <path>` flag (Issue #23663) | 🟢 **매우 높음** — bkit 자동화에서 세션 영속화 활용 가능. v0.41.2 baseline runner와 시너지 |
| Dx3 | #25637 | `Feat: Add Machine Hostname to CLI interface` | 🟢 Low — CLI UX 개선 |
| Dx4 | #25302 | **`feat(core): add LocalSubagentProtocol behind AgentProtocol`** — `AgentProtocol` abstraction 신설 | 🟡 중간 — bkit 21 agents 호환성 검증 필요 |
| Dx5 | #25303 | **`feat(core): add RemoteSubagentProtocol behind AgentProtocol`** — A2A 원격 agent를 `AgentProtocol` 뒤로 래핑. `RemoteSubagentSession`(`getResult()`, `getLatestProgress()`) 노출 | 🟡 중간 — bkit 원격 agent 사용 없음 (현재) |
| Dx6 | #26676 | `feat(acp/core): prefix tool call IDs with tool names` — ACP IDE 도구 렌더링 지원 | 🟢 Low — bkit ACP 미사용 |
| Dx7 | #26655 | **`feat(context): Improvements to the snapshotter`** | 🟡 중간 — context management 안정성 향상 |
| Dx8 | #26888 | **`feat(context): Introduce adaptive token calculator`** (Issue #26887) — content size 계산 정확화 + 토큰 계산 버그 fix | 🟢 baseline runner 컨텍스트 한계 정확성 향상 |
| Dx9 | #26528 | `feat(evals): add shell command safety evals` | 🟢 Low — 테스트만 |

### 3.3 v0.42.0 → v0.43.0-preview.0 중요 fix 흡수 5건

| PR | fix | preview-research 추정 | 실제 |
|---|---|---|---|
| #25827 | `fix(cli): prevent duplicate SessionStart systemMessage render` (Issue #25655) | OPEN (preview-research §9) | **MERGED 2026-05-11 → v0.43.0-preview.0에 포함**. bkit SessionStart 워크어라운드 다음 cycle에 자연 해소 |
| #26534 | `fix(core): chat corruption bug in context manager` | "거의 확정 stable 포함" (preview-research §8) | **stable 미포함, v0.43.0-preview.0에 포함** |
| #26452 | `fix(core): Fix hysteresis in async context management pipelines` | "거의 확정 stable 포함" (preview-research §8) | **stable 미포함, v0.43.0-preview.0에 포함** |
| #26571 | `fix(core): prevent silent hang during OAuth auth on headless Linux` | "거의 확정 stable 포함" (preview-research §8) | **stable 미포함, v0.43.0-preview.0에 포함** |
| #25186 | `refactor(cli): migrate core tools to native ToolDisplay property` (Bx1) | "부분 포함, stable 추가 마이그레이션 완성 가능" | **stable 추가 변경 0건. v0.43.0-preview.0에 추가 부분 포함** |

### 3.4 v0.43.0-preview.0 방향성 시사

1. **Subagent Protocol 추상화 라인** (Dx4 + Dx5) — Local/Remote 통합. bkit 21개 subagent 호환성이 다음 cycle 주요 검증 대상이 될 가능성
2. **Context management 개선 라인** (Dx7 + Dx8 + #26452 fix + #26534 fix) — context manager 안정성/정확성 강화. bkit baseline runner 안정성에 긍정
3. **Session persistence 라인** (Dx2) — `/export-session` + `--session-file` 플래그. bkit 자동화 시나리오 활용 가능성 매우 높음
4. **ToolDisplay refactor 진행 중** (Bx1) — preview-research §10에서 "High 후보 1건"으로 기록된 회귀 위험. v0.42.0 stable에서는 *추가 변경 없음*이지만 v0.43.0-preview.0에서 진행. **다음 cycle에 추가 검증 필요**
5. **OAuth headless Linux fix (#26571)** — preview-research §6 보안 패치 후보. **v0.42.0 stable 미포함. 헤드리스/CI OAuth 사용 bkit은 v0.43.0 라인 대기 필요**

### 3.5 PR #25827 정정 사항 (preview-research §9 갱신)

- **이전 기록 (preview-research §9)**: "OPEN (미머지) — v0.40.0/.1, v0.41.0/.1/.2, v0.42.0-preview.0/.1/.2 + 4 nightly 모두 미포함. 7개 release 연속 미흡수"
- **확정 (2026-05-13)**:
  - PR 상태: **MERGED** (2026-05-11 16:59:22 UTC, merge_commit_sha `ecfaac2dc7...`)
  - Issue #25655: **CLOSED/COMPLETED** (2026-05-11 16:59:24 UTC)
  - v0.42.0 release 브랜치: **미포함** (`compare/{25827_sha}...{v0.42.0_sha}` = diverged, 6/54)
  - v0.43.0-preview.0: **포함** (compare commit 목록에 등장)
- **bkit 영향**:
  - **v0.42.0 stable 마이그레이션 시**: SessionStart `systemMessage` 워크어라운드(`addItem` 직접 호출 회피, `BKIT_SESSION_START_VERBOSE` slim default, tc113 방어) **여전히 유지 필요**
  - **v0.43.0 stable 이후 마이그레이션 시**: 워크어라운드 *제거 후보*. 회귀 테스트 후 정리 가능

---

## 4. 설정 / 구성 변경 (v0.41.2 → v0.42.0 stable 누적)

> preview-research §5 그대로 유효. stable에 새로 추가된 설정 변경 0건. 본 표는 P2 grep용 빠른 참조.

| 설정 키 | 변경 | 첫 포함 | bkit 영향 추정 (P2 위임) |
|---|---|---|---|
| `advanced.ignoreLocalEnv` (boolean) | **신규** (default `false`) | preview.0 | 옵트인. bkit baseline runner CI 안정성 향상 잠재 |
| `--ignore-env` CLI flag | **신규** | preview.0 | 옵트인 |
| `experimental.gemma` (boolean) | default `false` → **`true`** | preview.0 | bkit 명시 부재 → default `true` 자동 적용. 모델 명시 선택 시 무관 |
| `continueOnFailedApiCall` config | **제거** | preview.0 | bkit 0건 사용 → 무영향 |
| `experimental.autoMemory` 의미 | inbox flow 추가 | preview.0 | 활성 시 background extraction + inbox 검토 |
| `--prompt` (-p) deprecation 표시 | **제거 (정정)** | preview.0 | 자동화 권장 |

---

## 5. 버그 수정 (bkit 관련 — v0.42.0 stable 포함분 확정 카탈로그)

> preview-research §7에서 식별된 후보 중 *v0.42.0 stable에 실제로 포함된 것*만 확정 카탈로그화. (nightly 분기로 빠진 #26534, #26452, #26571은 §3.3 참조)

| PR | 설명 | bkit 수혜 |
|---|---|---|
| #26191 | API timeout 5분 → 60초 + Undici timeout retry | 🟢 baseline runner latency 개선 |
| #26342 | Session resumption 시 15+ session-scoped 상태 일괄 reset | 🟢 `--resume` stale state 누설 차단 |
| #26218 | `InvalidStream` graceful handling | 🟢 baseline runner 안정성 |
| #26340 | `"System: Please continue."` injection 제거 (false re-prompt 차단) | 🟢 모델 의도 보존 |
| #26542 | YOLO/AUTO_EDIT redirection 회귀 fix (preview.1 cherry-pick) | 🟢 자동 적용 |
| #26568 | a2a-server race fix (preview.2 cherry-pick) | 0건 (a2a-server 미사용) |
| #26330 | branch indicator git worktree/sub-directory fix | 🟡 bkit worktree 사용 시 |
| #25662 | `GEMINI.md`이 디렉토리(EISDIR)일 때 silent skip | 🟡 방어 강화 |
| #26132 | 자동 update less stable channel 다운그레이드 방지 | 🟢 stable 채널 고정 시 안전 |
| #26136 | Extension MCP client disconnect leak fix | 🟡 extension MCP 사용 시 |
| #26285 | sandbox 비활성 환경 auto-update check 정확화 | 🟢 baseline runner |
| #26264 | informational logs가 JSON output에 누설되는 것 차단 | 🟢 bkit-server NDJSON 무결성 |

---

## 6. 다음 단계 권고 (P2 위임)

### 6.1 본 cycle bkit 영향 추정 — preview-research §10.1 그대로 유효

| 등급 | 항목 | 근거 |
|---|---|---|
| 🔴 Critical | **0건** | stable delta 0건 (promotion only) |
| 🟠 High | **2건** | (Bx1) ToolDisplay refactor (PR #25186), (Bx0) `continueOnFailedApiCall` 제거 + injection 제거 (PR #26340) |
| 🟡 Medium | **1건** | (Bx4) Gemma 4 default-on (PR #26307) |
| 🟢 Low | **4건** | Bx2 (exit_plan_mode shell 금지), Bx3 (setSessionId reset), 자동 update 채널 guard, 빈 A2A log guard |

**preview-research §10 결론 그대로 유효** — stable 한정 변경이 없으므로 P2 재분석 불필요. v0.41.2 누적 P2 분석(33 files / Critical 0 / High 5)에 본 cycle delta만 추가하면 됨.

### 6.2 신규 검증 질문 (preview-research §14에 추가)

19. **(v0.42.0 stable)** bkit가 v0.42.0 stable로 마이그레이션 시, SessionStart `systemMessage` 워크어라운드는 *유지 필요*. v0.43.0 stable 출시까지 제거 보류 — Acceptance 기준 추가 필요?
20. **(v0.43.0 시그널)** Subagent Protocol 추상화 (Dx4 + Dx5)가 bkit 21개 subagent 호환성에 미치는 영향 — v0.43.0-preview 진행 시 사전 검증?
21. **(v0.43.0 시그널)** `/export-session` + `--session-file` (Dx2)을 bkit baseline runner / 자동화 시나리오에 어떻게 통합?
22. **(stable 미포함 fix)** OAuth headless Linux silent hang fix (#26571)이 v0.42.0 stable 미포함 — bkit CI/headless OAuth 사용 시 v0.43.0 라인 대기 필요?
23. **(stable 미포함 fix)** Chat corruption fix (#26534) + async context hysteresis fix (#26452) 미포함 — v0.42.0 stable 마이그레이션 후 보고된 회귀 발생 시 v0.43.0 라인 fast-track 가능?

### 6.3 즉시 흡수 가능 여부

✅ **즉시 흡수 가능** (preview-research §10.4 결론 강화)
- 근거 1: stable = preview.2 bit-for-bit promotion. preview.2를 분석한 결과 = stable을 분석한 결과
- 근거 2: preview-research가 식별한 Critical 0 / High 2 / Medium 1 / Low 4 모두 정적 분석으로 자체 검증 가능
- 근거 3: v0.41.2 cycle Strategy B' 12회차 골격 90% 재사용 가능 (B' 13회차)
- 근거 4: PR #25827 워크어라운드 *제거*는 v0.42.0 cycle scope 아님. v0.43.0 stable 출시 후 별도 cycle

### 6.4 P2 즉시 진입 가능 여부

✅ **가능**. 본 P1 + preview-research + v0.41.2 P2 분석을 누적 통합하는 형식 권장 (B' 13회차 패턴).

---

## 7. 원문 참조 링크

### 7.1 Releases

- v0.41.2 (baseline): https://github.com/google-gemini/gemini-cli/releases/tag/v0.41.2
- **v0.42.0 stable** (대상): https://github.com/google-gemini/gemini-cli/releases/tag/v0.42.0
- v0.42.0-preview.2 (= stable bit-for-bit base): https://github.com/google-gemini/gemini-cli/releases/tag/v0.42.0-preview.2
- **v0.43.0-preview.0** (시그널): https://github.com/google-gemini/gemini-cli/releases/tag/v0.43.0-preview.0

### 7.2 Compare

- **v0.42.0-preview.2...v0.42.0** (ahead 1, 9 files, package.json only): https://github.com/google-gemini/gemini-cli/compare/v0.42.0-preview.2...v0.42.0
- **v0.41.2...v0.42.0** (ahead 112, 300 files — preview.2 누적 + 버전 범프): https://github.com/google-gemini/gemini-cli/compare/v0.41.2...v0.42.0
- **v0.42.0...v0.43.0-preview.0** (ahead 80, 300 files): https://github.com/google-gemini/gemini-cli/compare/v0.42.0...v0.43.0-preview.0
- v0.42.0-preview.2...v0.43.0-preview.0 (ahead 80): https://github.com/google-gemini/gemini-cli/compare/v0.42.0-preview.2...v0.43.0-preview.0

### 7.3 stable 한정 commit

- `chore(release): v0.42.0`: https://github.com/google-gemini/gemini-cli/commit/68e2196d5b487a8e477adff9ebe0b8116cead273

### 7.4 PR #25827 (SessionStart `systemMessage` 정정)

- PR: https://github.com/google-gemini/gemini-cli/pull/25827
- merge_commit_sha: `ecfaac2dc7e1e9f32338a018a0f87fc1b0615c88`
- Issue #25655: https://github.com/google-gemini/gemini-cli/issues/25655 (CLOSED/COMPLETED)

### 7.5 v0.43.0-preview.0 핵심 PR (다음 cycle 시그널)

- #26514 (export/import session): https://github.com/google-gemini/gemini-cli/pull/26514
- #25302 (LocalSubagentProtocol): https://github.com/google-gemini/gemini-cli/pull/25302
- #25303 (RemoteSubagentProtocol): https://github.com/google-gemini/gemini-cli/pull/25303
- #26888 (adaptive token calculator): https://github.com/google-gemini/gemini-cli/pull/26888
- #26655 (snapshotter improvements): https://github.com/google-gemini/gemini-cli/pull/26655
- #26480 (steer to edit tool): https://github.com/google-gemini/gemini-cli/pull/26480
- #26534 (chat corruption fix): https://github.com/google-gemini/gemini-cli/pull/26534
- #26452 (async context hysteresis fix): https://github.com/google-gemini/gemini-cli/pull/26452
- #26571 (OAuth headless Linux silent hang fix): https://github.com/google-gemini/gemini-cli/pull/26571

### 7.6 인용 산출물 (preview-research)

- `docs/01-plan/research/gemini-cli-v0.42.0-preview-research.md` (390 lines, 2026-05-09)
- `docs/03-analysis/gemini-cli-v0.42.0-preview-impact.analysis.md`
- `docs/01-plan/features/gemini-cli-v0.42.0-preview-migration.plan.md`
- `docs/04-report/gemini-cli-v0.42.0-preview-migration.report.md`

### 7.7 누적 baseline (v0.41.2)

- `docs/01-plan/research/gemini-cli-v0.41.2-research.md` (387 lines)
- `docs/03-analysis/gemini-cli-v0.41.2-impact.analysis.md` (262 lines)
- `docs/01-plan/features/gemini-cli-v0.41.2-migration.plan.md`
- `docs/04-report/gemini-cli-v0.41.2-migration.report.md`

---

## 8. 조사 신뢰도

| 항목 | 신뢰도 | 비고 |
|------|--------|------|
| stable 한정 delta (preview.2 → stable = 1 commit, package.json만) | ⬛⬛⬛⬛⬛ | `gh api compare` 직접 호출 — files JSON 명세 직접 확인 |
| 누적 변경 (v0.41.2 → stable) | ⬛⬛⬛⬛⬛ | preview-research 인용 + commit count 재검증 (111 → 112) |
| PR #25827 상태 정정 | ⬛⬛⬛⬛⬛ | merge 상태 + Issue 상태 + diverged compare 3중 검증 |
| v0.43.0-preview.0 시그널 | ⬛⬛⬛⬛⬜ | 80 commits 중 핵심 9 PR 본문 직접 검증. 나머지는 commit title 기반 |
| Breaking Changes / 신기능 | ⬛⬛⬛⬛⬜ | preview-research 결론 그대로 — stable promotion이므로 차분 없음 |
| Deprecation | ⬛⬛⬛⬛⬜ | preview-research 인용 — 명시 통보 0건 |
| 설정 / 구성 변경 | ⬛⬛⬛⬛⬛ | preview-research 인용 |
| 보안 패치 | ⬛⬛⬛⬛⬛ | stable 포함분 (#26230, #26310, #26340, #26198, #26136) 확정. 미포함 2건 (#26571, #26535)도 확정 |
| 버그 수정 | ⬛⬛⬛⬛⬛ | stable 포함 12건 확정. 미포함 3건 (#26534, #26452, #26571)도 확정 |
| bkit 영향 hint | ⬛⬛⬛⬜⬜ | 추정. P2 코드 grep으로 확정 필요 |
| 활용 후보 (Cx 시리즈 + Dx 시리즈) | ⬛⬛⬛⬜⬜ | 식별만. 결정은 P3 brainstorm |

---

## 9. 본 P1의 한계 및 미해결

1. **v0.42.0 stable promotion이 *예외적으로 단순*** — 6일 burn-in 후 코드 변경 0건 retag. 따라서 본 P1의 새 substantive 발견은 *PR #25827 정정* + *v0.43.0-preview.0 시그널* + *preview-research §8 흡수 0건 확정*뿐. 이는 stable 출시 자체의 성격이며 본 P1의 한계가 아님.
2. **bkit 영향은 여전히 추정** — preview-research §10의 Critical 0 / High 2 / Medium 1 / Low 4는 P2 코드 grep으로 확정. v0.41.2 P2 분석(33 files)에 본 delta 추가만 검토.
3. **v0.43.0-preview.0 시그널은 *방향성 추출*** — 80 commits 중 9건 핵심 PR 본문만 검증. 나머지 71 commits는 commit title 기반. v0.43.0 stable 출시 시 별도 cycle 필요.
4. **Subagent Protocol 라인 (Dx4 + Dx5)이 bkit 21 agents 호환성에 미치는 영향** — v0.43.0-preview 진행 시 사전 검증 권고. 본 cycle scope 아님.

---

## 10. P2로 전달할 핵심 검증 질문 (preview-research §14에 추가)

(preview-research §14의 18개 질문 그대로 유효 — 본 cycle 추가 5개)

19. bkit가 v0.42.0 stable 마이그레이션 시 SessionStart `systemMessage` 워크어라운드 *유지 필요* — Acceptance 기준에 명문화?
20. v0.43.0-preview의 Subagent Protocol 추상화 (Dx4 + Dx5)가 bkit 21 agents 호환성에 미치는 영향 사전 검증 필요?
21. v0.43.0-preview의 `/export-session` + `--session-file` (Dx2)을 bkit baseline runner 자동화에 통합?
22. v0.42.0 stable 미포함 OAuth headless Linux fix (#26571) — bkit CI/headless OAuth 사용 시 v0.43.0 stable 라인 대기 필요?
23. v0.42.0 stable 미포함 chat corruption fix (#26534) + async context hysteresis fix (#26452) — 회귀 발생 시 v0.43.0 라인 fast-track 가능?

---

**조사 완료**: 2026-05-13. P2 (영향 분석)로 전달.

**한 줄 요약**: v0.42.0 stable = preview.2 bit-for-bit promotion (코드 변경 0건, package.json만 9 파일). preview-research §10의 Critical 0 / High 2 / Medium 1 / Low 4 그대로 유효. PR #25827 main에 머지됐으나 v0.42.0 release 브랜치 미포함 — bkit SessionStart 워크어라운드 v0.42.0 cycle에서 유지. v0.43.0-preview.0 시그널 80 commits = Subagent Protocol 추상화 + Session persistence + context management 강화 방향.
