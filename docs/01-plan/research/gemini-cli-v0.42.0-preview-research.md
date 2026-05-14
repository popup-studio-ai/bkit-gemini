# Gemini CLI v0.42.0 preview train 변경사항 조사 보고서 (P1)

> 작성일: 2026-05-09
> 작성자: gemini-researcher agent (PDCA Strategy B' 13번째 cycle 후보)
> 베이스라인: bkit v2.0.6 (= Gemini CLI v0.39.1 main 머지) + v0.41.2 cycle (P1~P4 완료, Do 미실행)
> **본 cycle 비교 범위**: `v0.41.2 → v0.42.0-preview.0/1/2 + 4개 nightly` (delta only)
> **누적 베이스라인 비교**: 별도 (v0.41.2 누적 보고서 §2 §3 §4 §5 §6 §11 그대로 유효 — 본 보고서는 *delta + 사전 시그널*만 추출)
> 출처: GitHub Releases/PR/compare API (`gh` CLI 직접 호출), 사전 v0.41.2 보고서 4건 인용
> v0.42.0 stable 미출시 (오늘 기준 preview.2가 최신 stable preview, 3일 경과)

---

## 0. 조사 메타데이터

### 0.1 본 cycle baseline 결정 근거

- bkit `main` HEAD = v2.0.6 = Gemini CLI v0.39.1 머지 완료
- 직전 cycle = `v0.41.2` 누적 (P1~P4 완료, Do 미실행) — Strategy B' 12회차
- 사용자 결정 (2026-05-09): v0.42.0 stable 출시 전 preview train 전체 사전 시그널 확보 → P1 별도 작성
- 본 cycle 비교 범위 = **`v0.41.2 → v0.42.0-preview-train`** (= preview.0/1/2 + 4 nightly, **delta only**)
- 누적 baseline (`v0.39.1 → v0.41.2`) 7 Breaking + 24 신기능은 v0.41.2 보고서 그대로 유효 → *본 P1에서 재작성 없음*
- 본 P1은 Phase 2 영향 분석의 입력. P3/P4는 v0.42.0 stable 출시 후 결정.

### 0.2 preview train 타임라인 (사전 검증)

| 버전 | published_at (UTC) | 성격 | 한 줄 요약 |
|---|---|---|---|
| v0.41.2 (baseline) | 2026-05-06T18:39 | patch (a2a-server only) | `Task.waitForPendingTools()` race fix |
| v0.42.0-nightly.20260504.g37edd1d4d | 2026-05-04T18:51 | nightly (preview 직전) | preview.0 commit set 누적 시작 (~67 commits) |
| v0.42.0-nightly.20260505.g8f0edcd64 | 2026-05-05T18:56 | nightly | + Auto Memory inbox / `--ignore-env` / `/bug-memory` / V8 heap snapshot 등 18 commits |
| **v0.42.0-preview.0** | **2026-05-05T20:39** | **preview (107 commits)** | **첫 preview cut. ~25개 신기능 + 약 75개 fix + 1 known breaking (`continueOnFailedApiCall` 제거)** |
| **v0.42.0-preview.1** | **2026-05-05T22:48** | **preview (cherry-pick)** | **PR #26542 cherry-pick (YOLO/AUTO_EDIT redirection 회귀 fix — v0.41.1과 동일 fix)** |
| v0.42.0-nightly.20260506.g80d269054 | 2026-05-06T17:08 | nightly | + 12 commits (queuing during compression, chat corruption fix, generalist profile fix 등) |
| **v0.42.0-preview.2** | **2026-05-06T18:06** | **preview (cherry-pick) — 최신 stable preview** | **PR #26568 cherry-pick (a2a-server race fix — v0.41.2와 동일 fix)** |
| v0.42.0-nightly.20260507.ga809bc7c5 | 2026-05-07T17:08 | nightly (최신) | + 16 commits — preview.2 → 최신 nightly 사이 신규 기능/수정 (§8) |

**주요 사실**:
- preview.0 → preview.2: **cherry-pick 2건**(PR #26544, #26590)만 추가. v0.41.x 라인의 hotfix를 0.42 라인으로 backport하는 표준 패턴.
- preview.0가 본 train의 *유일한 substantive cut*. 107 commits를 단일 release notes에 담음.
- preview.2 → 최신 nightly(20260507): **24 commits(behind 5)** 분기 — v0.42.0 stable 직전에 흡수될 가능성 높음 (§8).
- v0.41.2 → v0.42.0-preview.2: ahead **111 commits**, 변경 파일 **300개**, divergence (preview train이 v0.41.2 라인보다 12 commits behind 함).

### 0.3 본 P1이 새로 추가/수정한 핵심 포인트 (v0.41.2 누적 P1 대비)

1. **Breaking Change 신규 1건 (Bx0)**: `continueOnFailedApiCall` config 옵션 제거 — PR #26340 본문에 "Noted breaking changes (if any) — `continueOnFailedApiCall` config option removed; it was never user-facing and was a no-op when set." 명시 (§2 표). bkit `.gemini/settings.json`에 부재 — 영향 추정 0건.
2. **신기능 신규 12건**: `--ignore-env` flag + `advanced.ignoreLocalEnv` setting, Auto Memory inbox flow + `extraction.patch` contract, `/bug-memory` slash command + `/bug` 자동 heap snapshot, `/exit --delete` flag, `/commands list` subcommand, `/extensions delete` alias, `feat(memory): canonical-patch contract`, `feat: queuing messages during compression`, V8 heap snapshot utility, `feat(voice): privacy/compliance UX warning`, Gemma 4 default-on (`experimental.gemma: true`), `--prompt` undeprecated (§3 표).
3. **bkit OPEN 추적 1건 결과**: PR #25827 (SessionStart `systemMessage` 중복 fix, Issue #25655) → **여전히 OPEN**. v0.42.0 preview train에 미흡수 (§9).
4. **사전 시그널 §8 신설**: preview.2 → 최신 nightly(20260507) 24 commits delta 분석. v0.42.0 stable 출시 시 *추가 흡수 후보*.
5. **누적 baseline 보고서 인용 처리**: §2~§6 본문 표는 *v0.42.0 train delta only*. 누적 7 Breaking / 24 신기능은 v0.41.2 P1 §2 §3 인용.

### 0.4 사용 소스 목록

- GitHub Releases (`gh release view <tag>`): preview.0/1/2 + nightly 4개
- GitHub compare API: `v0.41.2...v0.42.0-preview.2` (ahead 111, 300 files), `v0.42.0-preview.2...v0.42.0-nightly.20260507.ga809bc7c5` (ahead 24)
- GitHub PR 본문 (`gh pr view <num>`): #26340 (breaking — continueOnFailedApiCall), #26445 (--ignore-env), #26338 (Auto Memory inbox), #26307 (Gemma 4 default), #26191 (60s timeout), #26506 (queuing during compression), #26230 (exit_plan_mode shell guard), #23608 (subagents Plan Mode awareness), #26342 (session-scoped state reset), #26571 (OAuth Linux silent hang), #26535 (Auto Memory patch allowlist tighten), #26329 (--prompt undeprecate), #25186 (ToolDisplay refactor), #25639 (/bug-memory + auto heap snapshot), #22324 (/commands list), #19332 (/exit --delete), #26207 (@ mention bot), #26330 (branch indicator git worktree), #26440 (V8 heap snapshot), #25660 (/extensions delete alias), #25662 (GEMINI.md EISDIR), #26136 (extension MCP cleanup), #26198 (A2A pushMessage guard), #26132 (auto-update channel guard), #26554 (acp tool explanation), #26528 (shell command safety evals)
- GitHub PR 상태 (`gh pr view 25827 --json state`): **OPEN** (미머지)
- bkit baseline 보고서 4건 직접 Read: `docs/01-plan/research/gemini-cli-v0.41.2-research.md` (387 lines), `docs/03-analysis/gemini-cli-v0.41.2-impact.analysis.md` (262 lines), `docs/01-plan/features/gemini-cli-v0.41.2-migration.plan.md` (head 100 lines), `docs/04-report/gemini-cli-v0.41.2-migration.report.md` (head 100 lines)
- 외부 블로그/비공식 매체 인용 **없음** (skill 1.3 quality rule 준수)

---

## 1. preview train 타임라인 상세

### 1.1 preview 단위별 commit 소스

| preview 버전 | 커버 커밋 범위 | 커밋 수 (compare API) | 주요 substantive 신규 |
|---|---|---|---|
| preview.0 | `v0.41.0-preview.3...v0.42.0-preview.0` | 107 (vs v0.41.2) | (§3 신기능 12건 + §2 breaking 1건 + §7 fix 다수 — 본 보고서 핵심 분석 대상) |
| preview.1 | `v0.42.0-preview.0...v0.42.0-preview.1` | 1 (cherry-pick PR #26544) | YOLO/AUTO_EDIT redirection fix(PR #26542) — v0.41.1과 동일 fix를 0.42 라인에 backport |
| preview.2 | `v0.42.0-preview.1...v0.42.0-preview.2` | 1 (cherry-pick PR #26590) | a2a-server race fix(PR #26568) — v0.41.2와 동일 fix를 0.42 라인에 backport |

### 1.2 nightly 흐름 (preview cut 직전/직후)

| nightly 태그 | published | 1차 substantive 신규 (preview 비포함분 또는 직전) |
|---|---|---|
| 20260504.g37edd1d4d | 2026-05-04 | preview.0 직전 — 67 commits 누적, preview.0에 대부분 흡수 |
| 20260505.g8f0edcd64 | 2026-05-05 18:56 | preview.0 직전 1.7h — Auto Memory inbox (#26338), `--ignore-env` (#26445), `/bug-memory` (#25639), V8 heap snapshot (#26440), Voice Mode privacy warning (#26454), `/agents refresh logging` (#26442) — **모두 preview.0에 포함됨** |
| 20260506.g80d269054 | 2026-05-06 17:08 | preview.0 ↔ preview.2 사이 — `feat: queuing messages during compression`(#26506), `fix(core): chat corruption bug in context manager`(#26534), `feat(core): steer model to use edit tool`(#26480), `fix(core): reject numeric project IDs`(#26532), `fix(core): allow redirection in YOLO/AUTO_EDIT`(#26542 — preview.1에 cherry-pick 됨) — **§8 사전 시그널 후보** |
| **20260507.ga809bc7c5** | **2026-05-07 17:08** | **최신 nightly. preview.2 → +24 commits**: `fix(a2a-server): race condition`(#26568 — preview.2에 cherry-pick 됨), `refactor(cli): migrate core tools to native ToolDisplay property`(#25186), `fix(core): Fix hysteresis in async context management pipelines`(#26452), `Tighten private Auto Memory patch allowlist`(#26535), `fix(cli): randomize sandbox container names`(#26014), `fix(core): prevent silent hang during OAuth auth on headless Linux`(#26571), `fix(cli): improve mcp list UX in untrusted folders`(#26457), `fix(cli): hide read-only settings scopes`(#26249), `feat(evals): add shell command safety evals`(#26528), `fix(acp): move tool explanation from thought stream`(#26554) — **§8 핵심 사전 시그널** |

---

## 2. Breaking Changes (vs v0.41.2 — preview train 신규 delta)

> 누적 7건은 v0.41.2 P1 §2 그대로 유효. 본 표는 v0.42.0 preview train 신규 delta만 추출.

| # | PR | 첫 포함 버전 | 항목 | 위험 키워드 | bkit 영향 추정 (P2 위임) |
|---|----|----|----|----|----|
| **Bx0** | **#26340** | preview.0 | **`continueOnFailedApiCall` config 옵션 제거** + `"System: Please continue."` post-stream injection 제거 + `NO_RESPONSE_TEXT` 중간 retry 제거 | config schema 변경 (no-op이지만 PR 본문 명시 breaking) | bkit `.gemini/settings.json` grep 0건 (`continueOnFailedApiCall` 키 부재) → **추정 영향 0건**. 단, hooks/스킬에서 빈 응답 retry에 의존하는 행동이 있다면 행동 변화 가능 (검증 필요) |
| (Bx1) | #25186 | preview.0 (refactor 일부) → **추가 일부는 nightly 20260507** | core tool들이 native `ToolDisplay` 객체 emit (legacy `returnDisplay` adapter deprecated) | 도구 응답 schema 내부 변경 | bkit가 도구 응답 JSON을 직접 파싱한다면 영향. `lib/gemini/tools.js` BUILTIN_TOOLS 카탈로그는 *이름*만 기록 — 추정 영향 0건. **검증 필요 P2-Q** |
| (Bx2) | #26230 | preview.0 | `exit_plan_mode` 도구를 `run_shell_command`로 호출하는 행동 시스템 prompt에서 명시 금지 | LLM 행동 변화 | bkit 21개 agent prompt가 `exit_plan_mode`를 shell로 호출하지 않음 (정적 분석 — agent prompt 본문 grep 권고). LLM이 잘못된 호출 시 명시 거부 — 보안 강화 |
| (Bx3) | #26342 | preview.0 | `Config.setSessionId()` 호출 시 15+ session-scoped 상태(trackerService, approvedPlanPath, topicState, skillManager, modelAvailabilityService, modelQuotas, hasAccessToPreviewModel 등) 일괄 reset | 내부 API 행동 강화 | bkit는 `Config.setSessionId()`를 직접 호출하지 않음 (mcp/bkit-server.js spawn만 사용). **추정 영향 0건** |
| (Bx4) | #26307 | preview.0 | `experimental.gemma` default `false` → **`true`** (Gemma 4 모델 default-on via Gemini API) | settings default 변경 | bkit `.gemini/settings.json`에 `experimental.gemma` 명시 부재 → default `true` 자동 적용. Gemma 4 모델 노출됨. bkit는 모델 명시 선택(`gemini-2.5-pro` 등) 시 무관 — **추정 영향 0건** (단 `--model` 자동 추론 시 미세 행동 변화) |

**preview train 신규 Breaking 1건 (Bx0) + 4건의 *행동 변화 강화*** (Bx1~Bx4). 명시적 "Breaking change" 마커는 Bx0만 있으나, bkit 추정 영향 0건. 모두 P2 코드 grep으로 확정 필요.

---

## 3. 새로운 기능 (preview train 신규 — bkit 활용 후보 중심)

> 누적 24건은 v0.41.2 P1 §3 그대로 유효. 본 표는 v0.42.0 preview train 신규 delta 12건만 정리.

| # | PR | 기능 | 첫 포함 버전 | 설명 | bkit 활용 가능성 (P2/P3 위임) |
|---|----|----|----|----|----|
| **Cx1** | #26445 | **`--ignore-env` flag + `advanced.ignoreLocalEnv` setting** | preview.0 | 프로젝트 `.env` 격리. 글로벌 `~/.env` 와 `.gemini/.env`는 유지. 조기 argument sniffing으로 init 전 적용 | 🟢 **매우 높음** — bkit baseline runner의 `.env` 누설 차단 가능. CI/headless 안정성 강화 |
| **Cx2** | #26338 | **Auto Memory inbox flow (`extraction.patch` canonical contract)** | preview.0 | `experimental.autoMemory` 활성 시 background extraction agent가 unified-diff `.patch`를 inbox에 적재 → `/memory inbox` 사용자 검토 후 적용. `private`/`global`/`skills` 3 tier. 단일 canonical filename `extraction.patch`. 안전망: MemoryService snapshot + rollback + `isPathAllowed` 거부. extraction agent에만 `runWithScopedMemoryInboxAccess` 한정 access | 🟡 **중간** — bkit는 자체 메모리 사용. 보조 채널로 inbox 활용 가능. v0.41.2 §9 C4와 시너지 |
| **Cx3** | #26535 | **Auto Memory private patch allowlist tighten** | nightly 20260507 (preview.2 미포함) | private 메모리 patch는 `MEMORY.md` + 직접 sibling `.md`만 허용. `.extraction-state.json`, `.inbox/`, `skills/`, nested paths, non-markdown 거부. `~/.gemini/GEMINI.md` 자식 path도 거부 | 🟢 (Cx2 보완) — Cx2 채택 시 자동 적용 |
| **Cx4** | #25639 | **`/bug-memory` slash command + `/bug` 2GB 자동 heap snapshot** | preview.0 | V8 heap snapshot을 `<projectTempDir>/bug-memory-<ts>.heapsnapshot`에 작성. `/bug`도 RSS 2GB 초과 시 자동 캡처. Chrome DevTools 호환 | 🟡 중간 — bkit 디버깅 활용 가능. baseline runner OOM 진단 |
| Cx5 | #26440 | **V8 heap snapshot utility (`captureHeapSnapshot()`)** | preview.0 | `packages/core/src/telemetry/heap-snapshot.ts` 신설. `MemoryMonitor` 통합. `gemini-snapshots` temp dir | 🟡 중간 (Cx4의 기반) |
| Cx6 | #19332 | **`/exit --delete` flag** | preview.0 | session 종료 시 history+temp 파일 삭제. privacy workflow | 🟡 중간 — bkit 자동화에서 직접 사용 가능성 낮음 |
| Cx7 | #22324 | **`/commands list` subcommand** | preview.0 | 로드된 모든 `.toml` 명령 파일 목록 (user `~/.gemini/commands/` + project `<root>/.gemini/commands/` + MCP prompts + extensions) | 🟡 중간 — bkit health check skill 작성 시 활용 가능 |
| Cx8 | #25660 | `/extensions delete` alias (= uninstall) | preview.0 | 사용자 UX | 🟢 Low — bkit 무관 |
| Cx9 | #26506 | **queuing messages during compression** | nightly 20260506 (preview.2 미포함) | `/compress` 비동기화. derived state로 duplicate loading indicator 제거. queued message가 compression 후 자동 발송 | 🟡 중간 — bkit는 baseline runner가 인터랙티브 compression 시 영향 |
| Cx10 | #26454 | **Voice Mode privacy/compliance UX warning** (Gemini Live backend) | nightly 20260505 → preview.0 | UI warning | 🟢 Low — bkit 무관 (headless) |
| Cx11 | #26442 | `feat(cli): improve /agents refresh logging` | nightly 20260505 → preview.0 | `/agents` UX | 🟡 중간 — bkit `list_agents` 진단 시 활용 가능 |
| Cx12 | #26310 | `feat(core): reinforce Inquiry constraints to prevent unauthorized changes` (Issue #24448) | preview.0 | inquiry mode 강화 — "변경하지 말라" 지시 시 unauthorized 코드 변경 방지 | 🟡 중간 — bkit READONLY tier agents의 prompt 의존도 감소 (LLM이 자체 거부) |
| Cx13 | #26307 | **Gemma 4 default-on** | preview.0 | (Bx4 참고). v0.41.0 #25604의 experimental → default | 🟡 중간 — `--model` 추론 시 행동 변화 가능성 |
| Cx14 | #26329 | **`--prompt` (-p) flag undeprecated** | preview.0 | docs+CLI help text 수정. positional 인자 대안 보장 | 🟢 (긍정) — bkit 자동화에서 `--prompt` 사용 권장 |

> 추가 minor enhancements (UI 한정, bkit 영향 추정 0): #26284 (voice wave animation), #26270 (microphone UI), #26287 (voice transcription cursor insert), #26339 (Escape key buffer guard), #26233 (Gemma setup docs), #26233/26073 (generalist profile fixes), #25186 (ToolDisplay refactor — Bx1과 동일).

---

## 4. Deprecation 예고 (preview train 신규)

| 항목 | 예고 버전 | 제거 예정 | 대응 방안 |
|---|---|---|---|
| `continueOnFailedApiCall` config 옵션 | preview.0 (PR #26340) | **이미 제거** (preview.0) | 코드 0건 사용 — 무대응 |
| Legacy `returnDisplay` adapter (도구 응답) | preview.0 (PR #25186 refactor 시작) | TBD (점진적) | 도구 응답 직접 파싱 시 native `ToolDisplay` 객체로 마이그레이션 권고 |
| `--prompt` (-p) **deprecation 자체 취소** | preview.0 (PR #26329) | — | 이전 *deprecation 표시* 자체가 잘못됨 → 정정 (행동 변화 없음) |
| **명시적 deprecation 통보 ("deprecated as of vX, removed in vY") 마커** | preview train | — | **0건** (v0.39.1 → v0.42.0-preview train 통틀어 명시 마커 부재 — *행동 기반* deprecation만 존재) |

---

## 5. 설정 / 구성 변경 (preview train 신규)

> 누적 12건은 v0.41.2 P1 §5 그대로 유효. 본 표는 v0.42.0 preview train 신규 delta만 정리.

| 설정 키 | 변경 | 첫 포함 버전 | bkit 영향 추정 (P2 위임) |
|---|---|---|---|
| `advanced.ignoreLocalEnv` (boolean) | **신규 (default `false`)** | preview.0 (PR #26445) | 옵트인. bkit baseline runner CI 안정성 잠재 향상 |
| CLI flag `--ignore-env` | **신규** | preview.0 (PR #26445) | 옵트인 |
| `experimental.gemma` (boolean) | default `false` → **`true`** | preview.0 (PR #26307) | bkit 명시 부재 → default `true` 적용. 모델 명시 선택 시 무관 |
| `continueOnFailedApiCall` (config) | **제거** | preview.0 (PR #26340) | bkit 0건 사용 → 무영향 |
| `experimental.autoMemory` 의미 | (v0.40.0 신설 그대로) + **inbox flow 추가** | preview.0 (PR #26338) | 활성 시 background extraction + inbox 검토 (Cx2) |
| `--prompt` (-p) deprecation 표시 | 제거 (정정) | preview.0 (PR #26329) | 자동화 권장 |
| `--ignore-env` flag와 `--prompt` 외 신규 CLI flag | 0건 | — | — |
| 환경변수 신규/변경 | 0건 (preview train) | — | — |

---

## 6. 보안 패치 (preview train 신규)

> 누적 5건은 v0.41.2 P1 인용. 본 표는 preview train 신규 delta만 정리.

| PR | 설명 | CVE/CWE | 첫 포함 버전 | bkit 영향 추정 |
|---|---|---|---|---|
| #26230 | `exit_plan_mode` 도구를 `run_shell_command`로 호출하는 행동 시스템 prompt에서 명시 금지 (Issue #25047) | — (LLM 행동 강화) | preview.0 | 추정 0건 (bkit agent prompt 의존) |
| #26310 | Inquiry mode 시 unauthorized 코드 변경 방지 강화 (Issue #24448) | — (prompt hardening) | preview.0 | 추정 0건 (READONLY tier 보조 강화) |
| #26535 | Auto Memory private patch allowlist tighten — `.inbox/`, `skills/`, nested paths, non-markdown 거부. `~/.gemini/GEMINI.md` 자식 path 거부 (Issue #26520) | — (path traversal 강화) | nightly 20260507 (preview.2 미포함) | 추정 0건 (autoMemory 활성 시) |
| #26571 | OAuth headless Linux silent hang fix — keychain probe에 2s timeout 추가 + `LOGIN_WITH_GOOGLE`/`COMPUTE_ADC` 시 `loadApiKey()` 스킵 | — (DoS 방지) | nightly 20260507 (preview.2 미포함) | 🟡 **추정 시 매우 긍정** — bkit가 헤드리스 Linux/CI에서 OAuth 인증 시 잠재 행맹 차단 |
| #26340 | `"System: Please continue."` injection 제거 + `NO_RESPONSE_TEXT` 중간 retry 제거 → 빈 모델 응답이 명시 `InvalidStream` failure로 노출 | — (prompt injection 회피 + 명확화) | preview.0 | 추정 영향 0건 (bkit 빈 응답 retry에 의존하지 않음 — 검증 권고 P2-Q) |
| #26198 | A2A `pushMessage` 빈 log guard | — (방어 코딩) | preview.0 | 0건 (a2a-server 미사용) |
| #26136 | Extension MCP client disconnect leak fix (Issue #24050) | — (resource leak) | preview.0 | 추정 0건 (bkit-server 자체 MCP 관리) |

---

## 7. 버그 수정 (bkit 관련 후보 — preview train delta)

> 전체 ~75건 fix 중 bkit 관련성 있는 11건만 추림.

| PR | 설명 | 본 cycle 수혜 가능성 | 첫 포함 버전 |
|---|---|---|---|
| #26191 | API timeout 5분 → **60초** + Undici timeout codes 자동 retry (`UND_ERR_HEADERS_TIMEOUT` 등 → `ETIMEDOUT` 매핑) (Issue #18030) | 🟢 baseline runner 응답 latency 개선 — *자동 적용* | preview.0 |
| #26342 | Session resumption 시 15+ session-scoped 상태 일괄 reset (`trackerService`, `approvedPlanPath`, `topicState`, `skillManager`, `modelAvailabilityService`, `modelQuotas` 등) (Issue #24639) | 🟢 `--resume` 사용 시 stale state 누설 차단 — *자동 적용* | preview.0 |
| #26218 | `InvalidStream` 이벤트 graceful handling | 🟢 baseline runner 안정성 — *자동 적용* | preview.0 |
| #26340 | `"System: Please continue."` post-stream injection 제거 (false re-prompt 차단) | 🟢 모델 의도 보존 — *자동 적용* (PR #26066 v0.41.0 sticky_retry 보강) | preview.0 |
| #26534 | Context manager chat corruption fix (Issue #26521) | 🟢 baseline runner 안정성 — *자동 적용* | nightly 20260506 (preview.2 미포함) |
| #26452 | Async context management pipeline hysteresis fix (Issue #26451) | 🟢 baseline runner 안정성 — *자동 적용* | nightly 20260507 (preview.2 미포함) |
| #26571 | OAuth headless Linux silent hang fix (2s keychain timeout) | 🟢 **CI/headless OAuth 활용 시 critical** — *자동 적용* | nightly 20260507 (preview.2 미포함) |
| #26542 | YOLO/AUTO_EDIT redirection 회귀 fix (cherry-pick from v0.41.1) | 🟢 자동 적용 (preview.1에 포함) | preview.1 |
| #26568 | a2a-server race fix (cherry-pick from v0.41.2) | 0건 (a2a-server 미사용 — v0.41.2 cycle 검증) | preview.2 |
| #26330 | branch indicator git worktree/sub-directory fix (Issue #19271) | 🟡 bkit가 worktree 사용 시 — *자동 적용* | preview.0 |
| #25662 | `GEMINI.md`이 디렉토리(EISDIR)일 때 silent skip | 🟡 bkit `.gemini/GEMINI.md` 정상이면 무관. 방어 강화 | preview.0 |
| #26132 | 자동 update가 less stable channel로 다운그레이드 방지 (preview→stable, nightly→preview 등) | 🟢 bkit가 stable 채널 고정 시 안전 — *자동 적용* | preview.0 |
| #26136 | Extension MCP client disconnect leak fix | 🟡 bkit가 extension-backed MCP 사용 시 — *자동 적용* | preview.0 |
| #26285 | sandbox 비활성 환경에서 auto-update check 정확화 | 🟢 baseline runner — *자동 적용* | preview.0 |
| #26264 | informational logs가 JSON output에 누설되는 것 차단 | 🟢 bkit-server NDJSON 무결성 — *자동 적용* | preview.0 |

---

## 8. preview.2 → 최신 nightly delta (v0.42.0 stable 사전 시그널)

> preview.2 (2026-05-06 18:06) → nightly.20260507.ga809bc7c5 (2026-05-07 17:08): **24 commits, 103 files**.
> v0.42.0 stable 출시 시 추가 흡수 후보.

| 변경 | PR | 추정 stable 포함 여부 | 위험 | bkit 영향 추정 |
|---|---|---|---|---|
| `feat(core): steer model to use edit tool for surgical edits` | #26480 | 🟢 매우 높음 | 낮음 (LLM steering) | 추정 0건 (긍정 — 정확한 edit 유도) |
| `fix(core): chat corruption bug in context manager` | #26534 | 🔴 거의 확정 (P1 fix) | 0 | 🟢 자동 적용 시 baseline runner 안정성 |
| `fix(core): allow redirection in YOLO and AUTO_EDIT modes without sandboxing` | #26542 | ✅ 이미 preview.1에 cherry-pick됨 | 0 | 자동 (v0.41.1 동등) |
| `fix(core): reject numeric project IDs in GOOGLE_CLOUD_PROJECT` | #26532 | 🟢 매우 높음 | 0 | 0건 (bkit는 string project ID) |
| `fix(core): Fix hysteresis in async context management pipelines` | #26452 | 🔴 거의 확정 | 0 | 🟢 baseline runner 안정성 |
| `Tighten private Auto Memory patch allowlist` | #26535 | 🟢 매우 높음 (Cx3) | 0 | 0건 (autoMemory 비활성 시) |
| `fix(cli): randomize sandbox container names` | #26014 | 🟢 매우 높음 | 0 | 0건 (sandbox 미사용) |
| `fix(cli): hide read-only settings scopes` | #26249 | 🟡 중간 | 0 | 0건 (UX 개선) |
| `fix(cli): improve mcp list UX in untrusted folders` | #26457 | 🟡 중간 | 0 | 🟡 `gemini mcp list` 사용 시 UX 향상 |
| `fix(core): prevent silent hang during OAuth auth on headless Linux` | #26571 | 🔴 거의 확정 (P0급 incident fix) | 0 | 🟢 **헤드리스 Linux OAuth 시 critical** |
| `refactor(cli): migrate core tools to native ToolDisplay property and fix UI rendering` | #25186 | 🟡 중간 (refactor 큼) | 🟡 도구 응답 schema 내부 변경 | (Bx1) bkit 도구 응답 직접 파싱 시 영향 — 검증 필요 |
| `fix(cli): provide JSON output for AgentExecutionStopped in non-interactive mode` | #26504 | 🟢 매우 높음 | 0 | 🟢 bkit 자동화에서 JSON 파싱 시 긍정 |
| `feat(evals): add shell command safety evals` | #26528 | 🟢 매우 높음 (테스트만) | 0 | 0건 (테스트만) |
| `fix(core): handle invalid custom plans directory gracefully` | #26560 | 🟡 중간 | 0 | 🟡 bkit Plan Mode 사용 시 |
| `fix(acp): move tool explanation from thought stream to tool call content` | #26554 | 🟡 중간 | 0 | 0건 (bkit ACP 미사용) |
| `fix(ci): preserve executable bit for mac binaries` | #26600 | 🟢 매우 높음 (release CI) | 0 | 0건 (CI만) |
| `Changelog for v0.42.0-preview.0` | #26537 | ✅ 이미 머지 (자동 changelog PR) | 0 | 0건 |
| `don't wrap args unnecessarily` | #26599 | 🟡 중간 | 0 | 🟡 검증 필요 (shell args wrapping 변화) |
| `fix(a2a-server): Resolve race condition in tool completion waiting` | #26568 | ✅ 이미 preview.2에 cherry-pick됨 | 0 | 0건 (a2a-server 미사용) |
| `ci: fix Argument list too long in triage workflows` | #26603 | 🟢 (CI만) | 0 | 0건 |

**v0.42.0 stable 사전 시그널 핵심 3가지**:
1. **OAuth headless Linux silent hang fix (#26571)** — 거의 확정. bkit가 CI/headless OAuth 시 잠재 critical 수혜.
2. **Chat corruption bug fix (#26534) + async context hysteresis fix (#26452)** — 거의 확정. baseline runner 안정성 향상.
3. **ToolDisplay refactor (#25186)** — 부분 포함됨. v0.42.0 stable에 추가 마이그레이션 완성될 가능성. *Bx1 회귀 위험 검증 필요*.

---

## 9. 미해결 추적 (v0.41.2까지 OPEN, v0.42.0 preview에서도 미수렴)

| PR | 이슈 | 상태 (2026-05-09 검증) | bkit 영향 |
|---|---|---|---|
| **#25827** | Issue #25655 — SessionStart `systemMessage` 중복 렌더 fix | **OPEN (미머지)** — v0.40.0/.1, v0.41.0/.1/.2, **v0.42.0-preview.0/.1/.2 + 4 nightly 모두 미포함**. 7개 release 연속 미흡수 | bkit SessionStart hook이 `systemMessage` 사용 시 여전히 중복 렌더링. 워크어라운드 (`addItem` 직접 호출 회피, `BKIT_SESSION_START_VERBOSE` slim default, tc113 방어) **유지 필요** |

기타 OPEN P0/P1 이슈: 본 P1 시점에 *추가 식별된 v0.42.0-preview train 차단 이슈 0건*. preview train의 known fix들은 모두 머지됨.

---

## 10. 다음 단계 권고 (P2 위임 항목)

### 10.1 본 cycle Critical/High 후보 추정 (P2 위임)

| 등급 | 항목 | 근거 | 검증 방법 |
|---|---|---|---|
| 🔴 **Critical 후보 0건** | — | preview train delta에 bkit 직접 회귀 신호 부재 | — |
| 🟠 **High 후보 1건** | (Bx1) ToolDisplay refactor (PR #25186) — bkit가 도구 응답 JSON을 직접 파싱하는 코드 grep | preview.0 + nightly 20260507에서 점진적 refactor. 미머지 부분이 v0.42.0 stable에 추가 포함될 가능성 | P2: `lib/gemini/tools.js`, `mcp/bkit-server.js`에서 도구 응답 schema 직접 파싱 grep |
| 🟠 **High 후보 1건** | (Bx0) `continueOnFailedApiCall` 제거 + `"System: Please continue."` injection 제거 (PR #26340) | bkit가 빈 응답 retry에 의존하는 행동이 있다면 영향 | P2: `hooks/scripts/`, `lib/core/agent-memory.js`에서 빈 응답 처리 로직 grep |
| 🟡 **Medium 후보 1건** | (Bx4) Gemma 4 default-on (PR #26307) | bkit가 `--model` 자동 추론 시 행동 변화 가능 | P2: `mcp/bkit-server.js:1097-1102`의 args에 `--model` 강제 지정 여부 확인 |
| 🟢 **Low 후보 4건** | Bx2 (exit_plan_mode shell 금지), Bx3 (setSessionId reset), 자동 update 채널 guard, 빈 A2A log guard | LLM 행동 강화 또는 내부 API 변경 | P2: agent prompt grep |

**총합**: 본 cycle delta — Critical 0 / High 2 / Medium 1 / Low 4 (preview train delta only). v0.41.2 누적 분석(Critical 0 / High 5 / Medium 10 / Low 28)에 추가될 잠재 항목.

### 10.2 bkit 활용 후보 (Cx 시리즈 — P3 위임)

1. **Cx1 (`--ignore-env`)** — 🟢 baseline runner CI/headless 안정성 향상
2. **Cx2 (Auto Memory inbox flow)** — 🟡 보조 채널 활용 (v0.41.2 §9 C4 시너지)
3. **Cx4 (`/bug-memory` + 2GB 자동 heap snapshot)** — 🟡 디버깅 활용
4. **Cx7 (`/commands list`)** — 🟡 health check skill 작성 시 활용
5. **Cx11 (`/agents refresh logging`)** — 🟡 `list_agents` 진단 시 활용
6. **Cx14 (`--prompt` undeprecate)** — 🟢 자동화에서 `--prompt` 사용 권장 명문화

### 10.3 미해결 검증 질문 (P2/Do 단계 위임)

- **Q1**: bkit가 도구 응답 JSON을 직접 파싱하는 코드 보유 여부? (Bx1 회귀 위험)
- **Q2**: bkit가 빈 모델 응답 retry에 의존하는 hook/policy 보유 여부? (Bx0 행동 변화)
- **Q3**: bkit `mcp/bkit-server.js` args 빌더가 `--model` 강제 지정 여부? (Bx4 영향)
- **Q4**: bkit baseline runner가 Gemini OAuth(headless Linux) 사용 여부? (#26571 수혜 가능성)
- **Q5**: bkit가 v0.42.0 stable 출시 시 즉시 흡수 가능 여부? — **사전 답**: ✅ **즉시 흡수 가능**. 본 P1에서 식별된 Critical 0 / High 2 후보 모두 정적 분석으로 자체 검증 가능. v0.41.2 cycle Strategy B' 12회차 골격 90% 재사용 가능 (B' 13회차 전망).

### 10.4 v0.42.0 stable 출시 시 즉시 흡수 가능 여부

✅ **가능**. 근거:
- preview train에 명시 Breaking Change 1건(Bx0)만 존재. bkit 추정 영향 0건.
- 행동 변화 강화 4건(Bx1~Bx4)도 추정 영향 0건 (정적 분석).
- 보안 패치 7건 모두 *자동 적용* + bkit 코드 변경 0건.
- 신기능 14건 모두 옵트인.
- 누적 baseline(v0.41.2 P1~P4)이 *Strategy B' 12회차*로 정착 — 본 cycle은 13회차 골격 90% 재사용.
- *유일한 위험*: PR #25186 (ToolDisplay refactor)의 v0.42.0 stable 시점 완성도. P2 grep으로 사전 차단 가능.

### 10.5 P2 즉시 진입 가능 여부

✅ **가능** (조건부). 본 P1이 P2 영향 분석에 충분한 입력 제공. v0.42.0 stable 출시 후 P2 신규 작성보다는 본 P1 + v0.41.2 P2 영향 분석을 누적 통합하는 형식 권장 (B' 13회차 패턴).

---

## 11. 원문 참조 링크

### 11.1 Releases (preview train + nightly 4개)

- v0.41.2 (baseline): https://github.com/google-gemini/gemini-cli/releases/tag/v0.41.2
- **v0.42.0-preview.0**: https://github.com/google-gemini/gemini-cli/releases/tag/v0.42.0-preview.0
- **v0.42.0-preview.1**: https://github.com/google-gemini/gemini-cli/releases/tag/v0.42.0-preview.1
- **v0.42.0-preview.2** (최신 stable preview): https://github.com/google-gemini/gemini-cli/releases/tag/v0.42.0-preview.2
- v0.42.0-nightly.20260504.g37edd1d4d: https://github.com/google-gemini/gemini-cli/releases/tag/v0.42.0-nightly.20260504.g37edd1d4d
- v0.42.0-nightly.20260505.g8f0edcd64: https://github.com/google-gemini/gemini-cli/releases/tag/v0.42.0-nightly.20260505.g8f0edcd64
- v0.42.0-nightly.20260506.g80d269054: https://github.com/google-gemini/gemini-cli/releases/tag/v0.42.0-nightly.20260506.g80d269054
- **v0.42.0-nightly.20260507.ga809bc7c5** (최신 nightly): https://github.com/google-gemini/gemini-cli/releases/tag/v0.42.0-nightly.20260507.ga809bc7c5

### 11.2 Compares

- **v0.41.2...v0.42.0-preview.2** (ahead 111, 300 files): https://github.com/google-gemini/gemini-cli/compare/v0.41.2...v0.42.0-preview.2
- v0.41.2...v0.42.0-preview.0 (ahead 107): https://github.com/google-gemini/gemini-cli/compare/v0.41.2...v0.42.0-preview.0
- v0.42.0-preview.0...v0.42.0-preview.1: https://github.com/google-gemini/gemini-cli/compare/v0.42.0-preview.0...v0.42.0-preview.1
- v0.42.0-preview.1...v0.42.0-preview.2: https://github.com/google-gemini/gemini-cli/compare/v0.42.0-preview.1...v0.42.0-preview.2
- **v0.42.0-preview.2...v0.42.0-nightly.20260507.ga809bc7c5** (ahead 24, 103 files): https://github.com/google-gemini/gemini-cli/compare/v0.42.0-preview.2...v0.42.0-nightly.20260507.ga809bc7c5

### 11.3 Breaking Change PR (preview train delta)

- **#26340** `fix(core): remove "System: Please continue." injection on InvalidStream events` (Bx0 — `continueOnFailedApiCall` 제거 명시): https://github.com/google-gemini/gemini-cli/pull/26340
- #25186 `refactor(cli): migrate core tools to native ToolDisplay property` (Bx1): https://github.com/google-gemini/gemini-cli/pull/25186
- #26230 `fix(agent): prevent exit_plan_mode from being called via shell` (Bx2): https://github.com/google-gemini/gemini-cli/pull/26230
- #26342 `fix(core): reset session-scoped state on resumption` (Bx3): https://github.com/google-gemini/gemini-cli/pull/26342
- #26307 `feat(config): enable Gemma 4 models by default via Gemini API` (Bx4): https://github.com/google-gemini/gemini-cli/pull/26307

### 11.4 신기능 핵심 PR

- #26445 `feat: add ignoreLocalEnv setting and --ignore-env flag` (Cx1): https://github.com/google-gemini/gemini-cli/pull/26445
- #26338 `feat(memory): add Auto Memory inbox flow with canonical-patch contract` (Cx2): https://github.com/google-gemini/gemini-cli/pull/26338
- #26535 `Tighten private Auto Memory patch allowlist` (Cx3): https://github.com/google-gemini/gemini-cli/pull/26535
- #25639 `feat(cli): add /bug-memory command and auto-capture heap snapshot in /bug` (Cx4): https://github.com/google-gemini/gemini-cli/pull/25639
- #26440 `feat: add minimal V8 heap snapshot utility for memory diagnostics` (Cx5): https://github.com/google-gemini/gemini-cli/pull/26440
- #19332 `feat(cli): add --delete flag to /exit command for session deletion` (Cx6): https://github.com/google-gemini/gemini-cli/pull/19332
- #22324 `feat(cli): Add 'list' subcommand to '/commands'` (Cx7): https://github.com/google-gemini/gemini-cli/pull/22324
- #25660 `feat(extensions): add 'delete' as an alias for /extensions uninstall` (Cx8): https://github.com/google-gemini/gemini-cli/pull/25660
- #26506 `feat: allow queuing messages during compression` (Cx9): https://github.com/google-gemini/gemini-cli/pull/26506
- #26454 `feat(voice): add privacy and compliance UX warning for Gemini Live backend` (Cx10): https://github.com/google-gemini/gemini-cli/pull/26454
- #26442 `feat(cli): improve /agents refresh logging` (Cx11): https://github.com/google-gemini/gemini-cli/pull/26442
- #26310 `feat(core): reinforce Inquiry constraints to prevent unauthorized changes` (Cx12): https://github.com/google-gemini/gemini-cli/pull/26310
- #26329 `fix(cli): undeprecate --prompt and correct positional query docs` (Cx14): https://github.com/google-gemini/gemini-cli/pull/26329

### 11.5 보안 패치 PR

- #26571 `fix(core): prevent silent hang during OAuth auth on headless Linux`: https://github.com/google-gemini/gemini-cli/pull/26571
- #26340 (보안 + 행동 변화): https://github.com/google-gemini/gemini-cli/pull/26340
- #26198 `fix(core): add explicit empty log guard in A2A pushMessage`: https://github.com/google-gemini/gemini-cli/pull/26198
- #26136 `fix(core): disconnect extension-backed MCP clients in stopExtension`: https://github.com/google-gemini/gemini-cli/pull/26136

### 11.6 미해결 (OPEN)

- **#25827** `fix(cli): prevent duplicate SessionStart systemMessage render` (Issue #25655) — **OPEN (미머지)**, v0.42.0 preview train 7 release 연속 미흡수: https://github.com/google-gemini/gemini-cli/pull/25827

### 11.7 baseline 보고서 (인용)

- `docs/01-plan/research/gemini-cli-v0.41.2-research.md` (387 lines, 2026-05-07)
- `docs/03-analysis/gemini-cli-v0.41.2-impact.analysis.md` (262 lines, 2026-05-07)
- `docs/01-plan/features/gemini-cli-v0.41.2-migration.plan.md` (Strategy B' 12회차 plan)
- `docs/04-report/gemini-cli-v0.41.2-migration.report.md` (P4 종합 보고서)

---

## 12. 조사 신뢰도

| 항목 | 신뢰도 | 비고 |
|------|--------|------|
| preview train 타임라인 | ⬛⬛⬛⬛⬛ | gh release view로 7개 release 직접 확인 (preview 3 + nightly 4) |
| compare 통계 (ahead 111 / 300 files / preview.2 → nightly +24) | ⬛⬛⬛⬛⬛ | gh api compare 직접 호출 |
| Breaking Changes (Bx0 — `continueOnFailedApiCall`) | ⬛⬛⬛⬛⬛ | PR #26340 본문 명시 marker 직접 검증 |
| 행동 변화 강화 (Bx1~Bx4) | ⬛⬛⬛⬛⬜ | PR 본문 직접 검증. *명시 breaking marker 부재* — 추정 영향 0건도 P2 grep 필요 |
| 새 기능 (Cx1~Cx14) | ⬛⬛⬛⬛⬜ | 핵심 12건 PR 본문 직접 검증. UI 한정 minor enhancements는 release notes title 기반 |
| Deprecation | ⬛⬛⬛⬛⬜ | 명시 통보 0건 — 행동 기반 도출. `--prompt` undeprecate는 명시 |
| 설정 / 구성 변경 | ⬛⬛⬛⬛⬛ | PR #26445, #26307, #26340 본문 schema 직접 확인 |
| 보안 패치 | ⬛⬛⬛⬛⬛ | PR #26571, #26340, #26230, #26310 본문 직접 확인 |
| §8 사전 시그널 (preview.2 → 최신 nightly) | ⬛⬛⬛⬛⬜ | compare API 24 commits 모두 commit title 확인 + 핵심 5건 본문 검증. v0.42.0 stable 추정은 *합리적 추정*이며 확정 아님 |
| §9 OPEN 추적 (#25827) | ⬛⬛⬛⬛⬛ | `gh pr view 25827 --json state` 직접 검증 — OPEN 확정 |
| bkit 영향 hint | ⬛⬛⬛⬜⬜ | **추정**. P2 코드 grep으로 확정 필요 |
| 활용 후보 (Cx 시리즈) | ⬛⬛⬛⬜⬜ | 식별만. 결정은 P3 brainstorm |

---

## 13. 본 P1의 한계 및 미해결

1. **v0.42.0 stable 출시 전**: preview train만 분석. preview.2 → 최신 nightly delta(§8)는 *추정 사전 시그널*이며 stable 확정 시 재검증 필요.
2. **bkit 영향은 추정만**: P2 코드 grep으로 Bx1/Bx0/Bx4 검증 위임. v0.41.2 P2 분석(33 files / Critical 0 / High 5)은 *그대로 유효한 상태*에서 본 P1 delta 추가만 검토.
3. **PR #25186 (ToolDisplay refactor) 진행 중**: preview.0 + nightly 20260507에서 점진적 — v0.42.0 stable 시점 완성도가 변수. 도구 응답 schema 회귀 가능성 *유일한 비-제로 위험*.
4. **preview cycle 빠른 회전**: preview.0 (2026-05-05) → preview.2 (2026-05-06)까지 *24h 내 2개 cherry-pick*. v0.42.0 stable 출시 시점 (추정 2026-05-09 ~ 12) 사이 추가 cherry-pick 가능성 — 본 P1 작성 후 stable 출시 시 재검증 권고.

---

## 14. P2로 전달할 핵심 검증 질문 (preview train delta)

(v0.41.2 P1 §14의 13개 질문은 그대로 유효 — 본 cycle 추가 5개)

14. **(v0.42.0)** bkit가 도구 응답 JSON을 직접 파싱하는 코드 보유? (Bx1 — PR #25186 ToolDisplay refactor)
15. **(v0.42.0)** bkit가 빈 모델 응답 retry에 의존하는 hook/policy 보유? (Bx0 — PR #26340 `continueOnFailedApiCall` 제거)
16. **(v0.42.0)** bkit `mcp/bkit-server.js` args 빌더가 `--model` 강제 지정? (Bx4 — Gemma 4 default-on)
17. **(v0.42.0)** bkit baseline runner가 헤드리스 Linux/CI에서 Gemini OAuth 사용? (#26571 수혜 가능성)
18. **(v0.42.0)** bkit가 `--ignore-env` 또는 `advanced.ignoreLocalEnv` 채택 시 baseline runner CI 안정성 향상 시나리오 식별 가능? (Cx1 활용)

---

**조사 완료**: 2026-05-09. P2 (영향 분석)로 전달 — *v0.42.0 stable 출시 시 즉시 진입 가능*. 권장: stable 출시 후 본 P1 + v0.41.2 P2를 누적 통합하는 B' 13회차 cycle.
