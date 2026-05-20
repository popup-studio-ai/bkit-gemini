# Gemini CLI v0.42.0 stable bkit 영향 분석 (P2)

> 작성일: 2026-05-13
> 작성자: bkit-impact-analyzer agent (Strategy B' 13회차 후보 — preview 압축 + stable 갱신)
> 입력: P1 research (`docs/01-plan/research/gemini-cli-v0.42.0-research.md`, 2026-05-13, 416 lines)
> 베이스 산출물: `docs/03-analysis/gemini-cli-v0.42.0-preview-impact.analysis.md` (2026-05-09, 291 lines, preview.2 기반)
> 베이스라인: bkit v2.0.6 (= Gemini CLI v0.39.1 main 머지) + v0.41.2 cycle (P1~P4 완료, Do 미실행)
> 본 cycle 비교 범위: **v0.41.2 → v0.42.0 stable** (= preview.2 bit-for-bit promotion, code patch 0건)
> 누적 비교 범위 (참조): v0.39.1 → v0.42.0 stable

---

## Executive Summary

### 영향도 카운트 (본 cycle delta vs preview-impact vs v0.41.2 누적)

| 항목 | **v0.42.0 stable 본 cycle delta** | preview-impact (preview.2 기반, 2026-05-09) | v0.41.2 cycle 누적 (참조) |
|---|---:|---:|---:|
| 영향 추정 파일 | **1** (`skills/gemini-cli-learning/SKILL.md` placeholder 단락 — preview-impact와 동일) | 1 | 33 |
| 🔴 Critical | **0** | 0 | 0 |
| 🟠 High | **0** | 0 | 5 |
| 🟡 Medium | **0** | 0 | 10 |
| 🟢 Low | **1** | 1 | 28 |
| 신규 활용 후보 (Cx*) | **6** (Cx1, Cx2, Cx4, Cx7, Cx11, Cx14) — preview-impact와 동일 | 6 | 11 |
| 미해결 검증 (Q*) | **5** (Q6, Q7, Q8 + 본 cycle 추가 Q9, Q10) | 3 | 5 |

### 핵심 결론

**v0.42.0 stable = preview.2 bit-for-bit promotion (1 commit / 9 files / package.json 만). 따라서 preview-impact.analysis.md (2026-05-09)의 모든 영향도 판정이 그대로 유효.** 본 P2는 **3건의 정정/보완**만 추가:

| # | 정정/보완 항목 | preview-impact 기록 | 본 P2 확정 |
|---|---|---|---|
| 1 | **PR #25827 (SessionStart `systemMessage` 중복 fix) 상태** | OPEN (7 release 연속 미흡수) | **MERGED 2026-05-11** (main only) — v0.42.0 release 브랜치 미포함. **v0.43.0-preview.0 흡수 확정**. bkit 워크어라운드 v0.42.0 cycle 유지, v0.43.0 stable cycle 제거 후보 |
| 2 | **OAuth headless Linux silent hang fix (#26571) 미포함 리스크** | preview-impact §6 R2/R3에서 부재 (preview.2 미포함만 기록) | bkit `mcp/bkit-server.js:1119` `GEMINI_CLI_TRUST_WORKSPACE=true` 워크어라운드 (commit e00c067)는 *trust* 경로만 해소. *OAuth* 경로 미해소 → **v0.42.0 cycle에서 추가 가드 불필요** (bkit는 OAuth 사용 없음 / 사용자 책임 영역) but 사용자가 OAuth 사용 시 v0.43.0 라인 대기 권고 |
| 3 | **v0.43.0-preview.0 시그널 사전 검토** | 부재 | Subagent Protocol 추상화 (#25302/#25303)는 bkit `spawn('gemini', ...)` 외부 프로세스 패턴에 **무관 (0건 영향)**. Session persistence (#26514)는 bkit `.bkit/state/session-history.json` + `.bkit/checkpoints/` 와 **namespace 분리** (직교) — 충돌 0건 |

### v0.41.2 cycle 누적 카운트 변동

**없음.** v0.41.2 cycle 33 files / Critical 0 / High 5 / Medium 10 / Low 28 그대로 유효.

본 cycle delta는 P0 차단 0건. **v0.42.0 stable 출시(2026-05-12)와 함께 v0.41.2 cycle Do 동시 흡수 권고** (B' 13회차 단일 PR, ~5h).

---

## 1. v0.42.0 stable 차분 영향 (preview.2 → stable, code patch 0건)

### 1.1 stable promotion의 영향 분석상 의미

| 항목 | 값 | 의미 |
|---|---|---|
| commits ahead (preview.2 → stable) | 1 | `chore(release): v0.42.0` (SHA `68e2196d`) — 버전 범프만 |
| files changed | 9 | 모두 `package.json` / `package-lock.json` (sub-package 7개 포함) |
| 소스 코드 변경 | **0건** | bkit 영향 0건 |
| 테스트 변경 | **0건** | bkit 회귀 테스트 0건 |
| 도큐 변경 | **0건** | bkit SKILL.md 추가 0건 |

**결론**: preview-impact.analysis.md (2026-05-09)의 영향도 판정 **그대로 유효**. 본 P2는 preview-impact의 §1~§7 결론을 **참조 + 정정 보강** 형태로 처리.

### 1.2 preview-impact 각 섹션의 stable 시점 유효성

| preview-impact 섹션 | stable 변경 영향 | 본 P2 처리 |
|---|---|---|
| §1.1 Bx0 `continueOnFailedApiCall` 제거 (PR #26340) | 변경 0건 | **§1 그대로 참조 — 0건 확정 유지** |
| §1.2 Bx1 ToolDisplay refactor (PR #25186) | 변경 0건 (v0.43.0-preview.0에서 추가 진행 — Q6) | **§1 그대로 참조 — 0건 확정 유지** |
| §1.3 Bx2 `exit_plan_mode` shell 호출 금지 (PR #26230) | 변경 0건 | **§1 그대로 참조 — 0건 확정 유지** |
| §1.4 Bx3 `Config.setSessionId()` reset (PR #26342) | 변경 0건 | **§1 그대로 참조 — 0건 확정 유지** |
| §1.5 Bx4 Gemma 4 default-on (PR #26307) | 변경 0건 | **§1 그대로 참조 — 0건 확정 유지** |
| §2 활용 후보 14건 (Cx1~Cx14) | 변경 0건 | **§2 그대로 참조 — 6개 활용 후보 유지** |
| §3 스킬 영향 | 변경 0건 | **§3 그대로 참조 — 1 Low (placeholder) 유지** |
| §4 에이전트 영향 | 변경 0건 | **§4 그대로 참조 — 0건 확정 유지** |
| §5 스크립트/라이브러리 영향 | 변경 0건 | **§5 그대로 참조 + 본 P2 §2 정정 1건 (PR #25827)** |
| §6 설정/MCP/테스트 영향 | 변경 0건 | **§6 그대로 참조 + 본 P2 §2 정정 1건 (tc113)** |
| §7 철학 정합성 | 변경 0건 | **§7 그대로 참조 — 5 강화 / 3 중립 / 0 충돌 유지** |
| §8 v0.41.2 누적 일관성 | 변경 0건 | **§8 그대로 참조 — 누적 변동 없음** |

**v0.42.0-preview-impact.analysis.md의 §1~§8 100% 유효**. 본 P2는 §2~§5로 정정/보완.

---

## 2. PR #25827 정정 영향 분석 (preview-impact §6, R2 갱신)

### 2.1 정정 사실 (preview-impact 기록 → P1 확정)

| 항목 | preview-impact 기록 (2026-05-09) | P1 확정 (2026-05-13) |
|---|---|---|
| PR #25827 상태 | OPEN | **MERGED 2026-05-11 16:59 UTC** (merge_commit_sha `ecfaac2dc7...`) |
| Issue #25655 상태 | OPEN | **CLOSED/COMPLETED 2026-05-11 16:59 UTC** |
| v0.42.0 release 브랜치 포함 | 미포함 | **여전히 미포함** (`compare/{25827_merge}...{v0.42.0}` = diverged, 6/54) — main에는 들어갔지만 release 브랜치에는 cherry-pick 부재 |
| v0.43.0-preview.0 포함 | 부재 (preview-impact 시점 v0.43.0 미존재) | **포함 확정** |

### 2.2 bkit 워크어라운드 위치 매핑 (전수)

> grep으로 식별한 bkit 코드베이스 내 SessionStart `systemMessage` 중복 관련 워크어라운드 모든 위치.

| 파일 | 위치 | 역할 | v0.42.0 cycle 처리 | v0.43.0 stable cycle 처리 (제거 후보) |
|---|---|---|---|---|
| `hooks/scripts/session-start.js` | line 347-360 (`generateDynamicContext` 함수 진입부) | `BKIT_SESSION_START_VERBOSE !== 'true'` 시 header 단일 라인만 반환 (verbose body 차단). 본문은 GEMINI.md에 위임 | **유지 필요** (v0.42.0 stable에 fix 미포함) | 제거 가능. `BKIT_SESSION_START_VERBOSE` 환경변수 폐기, verbose body 기본 복원 |
| `tests/suites/tc113-session-start-duplication-defense.js` | 전체 파일 (~100 lines) | systemMessage 중복 카나리아 — `addItem` 중복 호출 차단 검증 | **유지 필요** | 제거 가능 (v0.43.0 stable + 회귀 0건 확인 후) |
| `tests/suites/tc114-session-start-slim-mode.js` | 전체 파일 (~125 lines) | `BKIT_SESSION_START_VERBOSE=''` 시 slim default 동작 검증 | **유지 필요** | 제거 가능 (`BKIT_SESSION_START_VERBOSE` env 폐기 시 자동 무의미) |
| `tests/suites/tc01-hooks.js` | line 73, 83 | hook 실행 시 `BKIT_SESSION_START_VERBOSE: 'true'` 명시 (verbose 가정 검증 유지) | **유지 필요** | 환경변수 명시 제거 (verbose가 default가 되면 불필요) |
| `tests/suites/tc08-context.js` | line 28 | 동상 | **유지 필요** | 환경변수 명시 제거 |
| `tests/suites/tc10-philosophy.js` | line 13 | 동상 | **유지 필요** | 환경변수 명시 제거 |
| `tests/suites/tc22-pdca-status-path.js` | line 16, 28 | 동상 | **유지 필요** | 환경변수 명시 제거 |
| `GEMINI.md` | line 30 | 사용자에게 verbose 모드 활성화 예시(`export BKIT_SESSION_START_VERBOSE=true`) 문서화 | **유지 필요** | 단락 제거 |
| `docs/02-design/features/bkit-v2.0.5-finalization.design.md` | line 39~81 | 워크어라운드 설계 근거 명문화 | (변경 불필요 — 역사 기록) | (변경 불필요) |
| `docs/04-report/bkit-v2.0.5-finalization.report.md` | line 18~197 | 워크어라운드 결정 보고 (역사 기록) | (변경 불필요) | (변경 불필요) |

**핵심 결정**: v0.42.0 cycle에서는 **위 워크어라운드 9개 위치 모두 유지**. v0.43.0 stable cycle에서 **`hooks/scripts/session-start.js` 1 파일 + 테스트 6 파일 + `GEMINI.md` 1 단락 = 총 8 위치 제거 후보**.

### 2.3 영향도 갱신

- **본 cycle (v0.42.0)**: 영향도 변동 0건. preview-impact §6 R2 (PR #25827 미흡수, 매우 높음 / 0건 영향) 그대로 유효 (단, "preview 7 연속 미흡수" → "main 머지 but release 브랜치 미포함" 으로 정정).
- **v0.43.0 stable cycle 사전 식별**: 본 P2가 후행 cycle 작업 범위로 등록 (~30분: 코드 1 + 테스트 6 + 문서 1 + 회귀 스모크).

### 2.4 워크어라운드 유지의 No Guessing 효과

PR #25827이 main에는 머지됐으므로 v0.42.0 사용자가 *"곧 v0.42.x 패치 release에 cherry-pick 되지 않을까"* 추측할 가능성이 있음. **본 P2는 명시적으로 "v0.42.0 cycle 내내 워크어라운드 유지"를 권고**하여 추측 행동을 차단 (No Guessing 강화).

---

## 3. OAuth Headless fix #26571 미포함 리스크 분석

### 3.1 fix #26571 본질

- **PR 제목**: `fix(core): prevent silent hang during OAuth auth on headless Linux`
- **v0.42.0 stable 미포함** (P1 §3.3 확정)
- **v0.43.0-preview.0 포함** (P1 §3.3 확정)

### 3.2 bkit 워크어라운드 (commit e00c067) 와의 관계

bkit는 **v0.39.1 사이클 (commit e00c067)** 에서 `mcp/bkit-server.js:1115-1119`에 `env.GEMINI_CLI_TRUST_WORKSPACE = 'true'` 주입 워크어라운드 추가. **이는 `Trust` 경로 해소만** (PR #25814 Headless Trust Enforcement). **`OAuth` 경로는 별개**.

| 워크어라운드 | 대상 fix | 효력 |
|---|---|---|
| bkit `GEMINI_CLI_TRUST_WORKSPACE=true` (commit e00c067) | PR #25814 (v0.39.1 Headless Trust Enforcement) | bkit 자식 gemini 프로세스가 headless 환경에서도 trust prompt 우회. **OAuth와 무관** |
| (없음, 사용자 책임) | PR #26571 (OAuth headless Linux silent hang) | bkit 자체는 OAuth 사용 0건 (Gemini API 키 / GCP ADC 위임). 사용자가 OAuth 로그인 흐름에 진입하면 hang 가능 |

### 3.3 bkit OAuth 사용 패턴 확인 (grep)

- `mcp/bkit-server.js`의 `spawn('gemini', args, ...)` 호출 시 args 빌더(line 1097-1102): `-e <agentPath>`, approval flag, tool isolation, task — **OAuth/login 관련 args 미주입**
- `scripts/bootstrap-trust.sh`: 사용자 인터랙티브 trust 스크립트 — OAuth login 미트리거
- `lib/gemini/` 전체: OAuth/login API 직접 호출 0건

### 3.4 v0.42.0 cycle 추가 가드 필요 여부

| 시나리오 | 가드 필요? | 근거 |
|---|---|---|
| bkit MCP 서버가 spawn된 자식 gemini가 OAuth flow 진입 (headless Linux) | **불필요 (bkit scope 외)** | bkit args 빌더는 OAuth 미트리거. 자식 gemini가 OAuth로 빠지려면 사용자가 직접 인증 미완료 상태일 때만 발생 — bkit 자동화 시나리오에서는 *사전 인증 완료* 가정 (사용자 책임) |
| bkit baseline runner가 headless CI 환경에서 OAuth 미인증 (사용자 환경 문제) | **bkit 자동화 시나리오 외 — 문서화로 충분** | `GEMINI.md` 또는 README에 "CI 환경에서는 API key 사전 설정 필요" 1줄 추가 권고 |
| bkit가 v0.43.0 stable로 마이그레이션 후 #26571 fix 자연 흡수 | **자동 해소** | v0.43.0 stable cycle에서 자동 적용 |

**결론**: v0.42.0 cycle에서 **추가 가드 0건 필요**. 문서화 1줄 추가는 **권고**만 (선택). preview-impact §10.3 R 표에 추가 R4 (OAuth headless 사용자 환경 hang — 매우 낮음 / 사용자 책임) 등록.

### 3.5 v0.43.0 stable 출시 시 자연 해소 경로

| cycle | 처리 |
|---|---|
| v0.42.0 stable (현 cycle) | 변경 0건. 문서화 1줄 권고 (선택) |
| v0.43.0 stable (다음 cycle) | OAuth headless fix 자동 적용 (#26571). 추가 작업 0건 |

---

## 4. v0.43.0-preview.0 시그널 사전 검토

> P1 §3에서 식별한 80 commits 신호 중 bkit 영향 가능성 있는 항목만 사전 검토.

### 4.1 Subagent Protocol 추상화 (#25302 / #25303)

#### 4.1.1 변경 본질

- **#25302** (`feat(core): add LocalSubagentProtocol behind AgentProtocol`): 인프로세스 subagent 호출을 `AgentProtocol` 추상화 뒤로 래핑
- **#25303** (`feat(core): add RemoteSubagentProtocol behind AgentProtocol`): A2A 원격 subagent 호출을 같은 추상화 뒤로 래핑. `RemoteSubagentSession`(`getResult()`, `getLatestProgress()`) 노출
- 영향 범위: **Gemini CLI 내부 subagent invocation 경로** (v0.34.0+ `invoke_agent` tool 및 `experimental.enableAgents: true` 설정 활성화 시 사용되는 *내부 API*)

#### 4.1.2 bkit subagent 실행 모델 (grep 확정)

bkit는 21개 agent를 **외부 프로세스 spawn 패턴**으로 실행:

| 위치 | 패턴 | 의미 |
|---|---|---|
| `mcp/bkit-server.js:1123` | `spawn('gemini', args, { env, cwd, stdio })` | 매 subagent 호출마다 *새 gemini binary 프로세스*를 별도 PID로 spawn. 내부 `AgentProtocol` 미경유 |
| `mcp/bkit-server.js:1097-1102` args 빌더 | `-e <agentPath>` (extension 모드) | Gemini CLI를 extension 모드로 호출 — `invoke_agent` tool 미사용. bkit는 *Gemini CLI를 도구로 외부 호출* |
| `mcp/bkit-server.js:52` `AGENTS` 상수 (21개) | bkit-server 내부 카탈로그 | bkit가 자체 관리. Gemini CLI의 `AgentProtocol` registry와 namespace 분리 |
| `lib/gemini/version.js:163` `hasSubagentPolicies: isVersionAtLeast('0.34.0')` | TOML 정책 분기만 | `subagent = "<name>"` 필드 사용 (v0.34.0+ 정책 문법). 내부 API 호출 0건 |
| `lib/gemini/version.js:186` | `Legacy SubagentTool removed (PR #25053), replaced by invoke_agent (PR #24489)` 코멘트만 | bkit는 `invoke_agent` 도구 미호출 (외부 spawn 사용) |

#### 4.1.3 bkit 21개 agents 영향 가능성

| Subagent Protocol 추상화 변경 가능성 | bkit 21 agents 영향 | 근거 |
|---|---|---|
| 내부 API signature 변경 (`invoke_agent` → `AgentProtocol.invoke()`) | **0건** | bkit는 `invoke_agent` tool 미호출 |
| Remote subagent A2A 프로토콜 (Dx5) 도입 | **0건** | bkit는 A2A 미사용 (`mcp/bkit-server.js` JSON-RPC over stdio) |
| LocalSubagentProtocol 등록 메커니즘 변경 | **0건** | bkit subagent registry(`AGENTS` 상수)는 bkit-server 내부. Gemini CLI 인지 불필요 |
| v0.34.0+ `subagent = "<name>"` TOML 정책 문법 호환성 | **유지 가능성 매우 높음** (preview.0에서 호환 깨짐 신호 0건) | P1 §3.2 Dx4/Dx5 변경 정보 한정. v0.43.0 stable 출시 시 lib/gemini/policy.js 회귀 스모크로 확정 |

**결론**: 본 cycle (v0.42.0) **영향 0건**. v0.43.0 stable cycle에서 **lib/gemini/policy.js `generateSubagentRules()` (line 537) 회귀 스모크** 1건만 권고 (~10분). bkit 외부 spawn 패턴의 결정적 우위가 여기서 발현.

### 4.2 Session persistence (#26514, `/export-session` + `--session-file`)

#### 4.2.1 변경 본질

- `/export-session <path>` 슬래시 명령 (Issue #23663)
- `--session-file <path>` flag 새로 추가 (CLI 옵션)
- 세션 상태를 JSON 파일로 export/import 지원

#### 4.2.2 bkit Session 관련 영역 매핑

| bkit 자체 영역 | 파일/디렉토리 | 책임 | Gemini CLI Session persistence와 충돌? |
|---|---|---|---|
| Session history | `.bkit/state/session-history.json` | bkit own session lifecycle (`prompt_input_exit` 등 reason 추적) | **충돌 없음** — bkit own schema (`sessionId`/`reason`/`endedAt`/`feature`/`phase`/`progress`) |
| PDCA checkpoint | `.bkit/checkpoints/<feature>/<id>.json` | bkit PDCA 단계별 스냅샷 (별도 도구 `bkit_checkpoint`) | **충돌 없음** — feature-aware schema, Gemini session과 namespace 직교 |
| Audit log | `.bkit/audit/YYYY-MM-DD.jsonl` | bkit 자체 감사 로그 | **충돌 없음** |
| Snapshots | `.bkit/snapshots/` | bkit 자체 스냅샷 디렉토리 | **충돌 없음** |
| Memory | `.bkit/state/memory.json` | bkit own memory store | **충돌 없음** |

#### 4.2.3 1H prompt caching 충돌 가능성

- 본 P1/preview-impact에서 "1H prompt caching" 명시 영역 부재 (Q10 신규 등록 — bkit 코드베이스 grep 결과 `cache.*prompt|prompt.*cach|1[HhrR] cach` 패턴 0건).
- Gemini CLI Session persistence가 *서버 측 1시간 prompt cache*와 같은 namespace에 속한다 해도 bkit는 cache 직접 관리 0건 → **충돌 0건**.

#### 4.2.4 v0.43.0 stable cycle 활용 후보 (Dx2)

bkit 자동화 시나리오에서 `--session-file` 채택은 **긍정적 가치** (preview-impact §3 ~ Cx14 그룹에 추가될 후보):

| 활용 가능성 | 시나리오 | 우선순위 |
|---|---|---|
| Baseline runner 단계별 session export → re-run 시 재사용 | CI 결정성 향상 | P3 별도 cycle (v0.43.0 stable 출시 후) |
| PDCA cycle 진행 시 cycle 종료마다 session snapshot 저장 | 사용자가 cycle 회귀 시 복원 | P3 별도 cycle |

**결론**: 본 cycle (v0.42.0) **영향 0건 + 충돌 0건**. v0.43.0 stable cycle 활용 후보 등록만.

### 4.3 Context 강화 (#26888, #26655, #26534, #26452)

| PR | 본질 | bkit 영향 |
|---|---|---|
| #26888 adaptive token calculator | content size 계산 정확화 + 토큰 계산 버그 fix | bkit baseline runner 컨텍스트 한계 정확성 향상 (긍정). 영향 0건 (자동 적용) |
| #26655 snapshotter improvements | context management 안정성 향상 | bkit `.bkit/snapshots/`와 namespace 분리. 0건 |
| #26534 chat corruption fix | context manager chat corruption | bkit는 chat 자체 미관여 (사용자 prompt 의존). 0건 |
| #26452 async context hysteresis fix | async context management 안정성 | 0건 (자동 적용) |

**결론**: 본 cycle (v0.42.0) **영향 0건**. v0.43.0 stable 흡수 시 자동 적용.

---

## 5. bkit-system/philosophy 정합성 재검증 (preview-impact §7 갱신)

> preview-impact §7의 8개 검증 원칙 평가를 본 P2 정정 사항 반영하여 재검증.

| 원칙 | preview-impact §7 | 본 P2 갱신 | 변동 |
|---|---|---|---|
| Core Mission — Automation First | ✅ 강화 | ✅ 강화 (변동 없음) | 0 |
| Core Mission — No Guessing | ✅ 강화 | ✅ **강화 ++** | PR #25827 워크어라운드 명시 유지 (§2.4) → 사용자 추측 행동 사전 차단 |
| Core Mission — Docs = Code | ➖ 중립 | ➖ 중립 (변동 없음) | 0 |
| AI Native Principles — AI as Partner | ✅ 강화 | ✅ 강화 (변동 없음) | 0 |
| PDCA Methodology — 9-Stage Pipeline | ➖ 중립 | ➖ 중립 (변동 없음) | 0 |
| PDCA Methodology — Zero Script QA | ✅ 유지 | ✅ 유지 (변동 없음) | 0 |
| Context Engineering — 6-Layer Hierarchy | ✅ 유지 | ✅ **유지 ++** | v0.43.0-preview.0 Session persistence(#26514)와 bkit `.bkit/state/` namespace 분리 사전 검증 완료 (§4.2.2) → 6-Layer Hierarchy 무결성 사전 확인 |
| Context Engineering — 12 Hook Events | ✅ 유지 | ✅ 유지 (변동 없음) | 0 |

**종합**: 5 강화 / 3 중립 또는 유지 / **0 충돌** — preview-impact 시점 결론 유지. v0.43.0-preview.0 시그널 사전 검토 결과 **bkit 4대 철학과 긴장 포인트 0건** 확정.

---

## 6. 영향도 매트릭스 확정 (preview-impact §6.1 + §8 검증)

### 6.1 P1 §6.1 vs preview-impact 비교

| 등급 | P1 §6.1 (preview-research 인용, 미검증) | **preview-impact §6.1 / 본 P2 §6 (grep 검증 후 확정)** |
|---|---|---|
| 🔴 Critical | 0건 | **0건** (변동 없음) |
| 🟠 High | 2건 (Bx0 + Bx1) | **0건** (Bx1 schema 변경 무관 / Bx0 빈 응답 retry 의존 0건 — grep 확정) |
| 🟡 Medium | 1건 (Bx4 Gemma 4) | **0건** (Bx4는 사용자 prompt 의존만 — args 빌더에 `--model` 미주입 grep 확정) |
| 🟢 Low | 4건 (Bx2, Bx3, 자동 update, 빈 A2A log) | **1건** (`skills/gemini-cli-learning/SKILL.md` placeholder 단락 추가만) |

**P1 §6.1의 등급 분포 (Critical 0 / High 2 / Medium 1 / Low 4)는 정적 분석 전 추정값**. **본 P2 (preview-impact 인용)는 grep 검증 후 Critical 0 / High 0 / Medium 0 / Low 1** — preview-impact 결론 그대로 유지.

### 6.2 본 P2 최종 영향도 매트릭스

| 등급 | 카운트 | 항목 | 비고 |
|---|---:|---|---|
| 🔴 Critical | **0** | (없음) | stable promotion only |
| 🟠 High | **0** | (없음) | grep 검증으로 P1 §6.1 추정 2건 모두 강등 |
| 🟡 Medium | **0** | (없음) | grep 검증으로 P1 §6.1 추정 1건 강등 |
| 🟢 Low | **1** | `skills/gemini-cli-learning/SKILL.md` placeholder 단락 (v0.42.0 stable 출시 commemorating) | 5분 분량 |

### 6.3 v0.41.2 cycle 누적 + 본 cycle delta 누적

| 항목 | v0.41.2 cycle 누적 | + v0.42.0 stable delta | **누적 합계** |
|---|---:|---:|---:|
| 영향 추정 파일 | 33 | +1 | **34** |
| 🔴 Critical | 0 | +0 | **0** |
| 🟠 High | 5 | +0 | **5** |
| 🟡 Medium | 10 | +0 | **10** |
| 🟢 Low | 28 | +1 | **29** |

---

## 7. 기능 개선 기회 (v0.40.0 ~ v0.42.0 미활용 신기능)

> preview-impact §2의 활용 후보 14개 + 직전 v0.41.2 누적 활용 후보를 종합. **본 cycle delta로 새로 추가되는 후보 0건** — preview-impact 그대로.

### 7.1 우선 채택 후보 (B' 13회차 P0 통합 권고)

| 후보 | PR | 작업 분량 | 시너지 영역 | 채택 가치 |
|---|---|---|---|---|
| **Cx1**: `--ignore-env` flag 채택 | #26445 | ~30분 (args 빌더 + tc115 시나리오 1개) | baseline runner CI 안정성 강화 | **P1 (높음)** — bkit 자동화 결정성 향상 |
| **Cx13**: `experimental.gemma: false` 잠금 | #26307 | ~5분 (settings.json 1줄) | Bx4 default-on 회귀 사전 차단 (No Guessing) | **P1 (높음)** — bkit P0 통합 |

### 7.2 별도 cycle 채택 후보 (P3 brainstorm 위임)

| 후보 | PR | 작업 분량 | 시너지 영역 | 채택 가치 |
|---|---|---|---|---|
| Cx2: Auto Memory inbox flow | #26338 | ~hours (PoC 분리) | v2.1.0 implementation | 중간 — namespace 직교 가능 |
| Cx4: `/bug-memory` slash command | #25639 | ~hours | baseline runner OOM 디버깅 | 낮음 — 인터랙티브 의존 |
| Cx7: `/commands list` subcommand | #22324 | ~hours | skill-status / audit health check | 중간 — 보조 skill 보강 |
| Cx11: `/agents refresh` 로깅 개선 | #26442 | ~10분 | list_agents 디버깅 | 낮음 |
| Cx14: `--prompt` undeprecated | #26329 | ~1줄 (SKILL.md) | 자동화 권장 명문화 | 매우 낮음 |

### 7.3 v0.43.0-preview.0 시그널 사전 등록 (다음 cycle 위임)

| 후보 | PR | 다음 cycle 가치 |
|---|---|---|
| Dx2: `/export-session` + `--session-file` | #26514 | bkit 자동화 결정성 향상 — baseline runner cycle 재사용 |
| Dx7: snapshotter improvements | #26655 | context management 자동 안정성 (수동 작업 0건) |
| Dx8: adaptive token calculator | #26888 | baseline runner 컨텍스트 한계 정확성 (자동 적용) |
| #26571: OAuth headless fix | #26571 | bkit 자동화 시나리오 외 (사용자 환경) — 자동 흡수 |
| #25827: SessionStart `systemMessage` fix | #25827 | bkit 워크어라운드 8 위치 제거 (~30분) — **v0.43.0 stable cycle P0 핵심 작업** |

---

## 8. 미해결 검증 질문 (Q6~Q10)

> preview-impact §9의 Q6~Q8 + 본 P2 추가 Q9, Q10.

| Q# | 질문 | 가설 | 검증 방법 |
|---|---|---|---|
| Q6 (preview-impact §9) | v0.42.0 stable 시점 PR #25186 ToolDisplay refactor 추가 마이그레이션 완성? | preview.0 + nightly 20260507에서 점진적. **v0.42.0 stable에 추가 변경 0건 확정** (P1 §3.3) | v0.43.0-preview.0 진행 중. **본 P2에서 0건 확정 처리** |
| Q7 (preview-impact §9) | bkit `--ignore-env` (Cx1) 채택 시 baseline runner CI 안정성 향상? | `.env` 직접 사용 0건이지만 부모 env 누설 차단 가치 | **B' 13회차 P0에서 `mcp/bkit-server.js:1097` args에 `--ignore-env` 추가 + tc115 시나리오 1개** (~30분) |
| Q8 (preview-impact §9) | `experimental.gemma: false` (Cx13) 잠금 시 Gemma 4 default-on 회귀 차단? | settings.json 1줄로 No Guessing 강화 | **B' 13회차 P0에서 `.gemini/settings.json`에 1줄 추가** (~5분) |
| **Q9 (본 P2 신규)** | PR #25827 워크어라운드 8개 위치(§2.2)를 v0.43.0 stable cycle에서 일괄 제거 시 회귀 위험? | 매우 낮음 — `BKIT_SESSION_START_VERBOSE` 환경변수 폐기, verbose default 복원만 | v0.43.0 stable cycle Wave 2에서 tc113/tc114 회귀 스모크 + 7개 tc01/08/10/22 환경변수 명시 제거 (~30분) |
| **Q10 (본 P2 신규)** | v0.43.0-preview.0 Session persistence(#26514)가 bkit `.bkit/state/`와 namespace 충돌? | 0건 — schema/디렉토리 모두 직교 (§4.2.2 확정) | v0.43.0 stable cycle에서 `--session-file` PoC 시 추가 검증 (~30분) |

**미해결 5건 모두 P3 brainstorm/Do 단계에서 해소 가능**. 본 P2로 ✅ Critical/High 결정 충분.

---

## 9. 다음 단계 권고 (P3 위임)

### 9.1 Strategy 후보 (preview-impact §10.1 갱신)

| 전략 | 시간 | 리스크 | 점수 | 비고 |
|---|---|---|---|---|
| **B' 13회차 (권장)** | ~5h | LOW | 7.50 | v0.41.2 cycle B' 12회차 골격 90% 재사용 + 본 cycle delta 1 Low 통합 (Cx1 + Cx13). v0.42.0 stable 출시 후 즉시 진입. *권장* |
| A' (Minimum) | ~3h | LOW | 7.20 | testedVersions + flag만. SKILL.md 단락 보류 — 비권장 (Docs=Code 약화) |
| C' (Full + autoMemory PoC) | ~26h | MEDIUM | 7.45 | B' + Cx2/Cx7 PoC. PoC 분리 권장 |

### 9.2 Wave 분할 가이드라인 (B' 13회차)

| Wave | 작업 | 시간 |
|---|---|---|
| W1.0 | v0.41.2 cycle Wave 1 (P0): testedVersions + version flag + topicUpdateNarration 잠금 | 50분 |
| **W1.5 (본 cycle 추가)** | `experimental.gemma: false` (1줄) + `bkit.config.json` `"0.40.0"~"0.42.0"` 6개 추가 (1분) + `hasGemmaDefaultOn` flag (5분) + tc38 매트릭스 1줄 + (선택) `--ignore-env` args 1줄 + tc115 시나리오 1개 | **~30분** |
| W2.0 | v0.41.2 cycle Wave 2 (21 agent 스모크 + SKILL.md 12개 단락 + v2.1.0 hint) | ~3h |
| W2.5 (본 cycle 추가) | `gemini-cli-learning/SKILL.md` v0.42.0 stable 1줄 placeholder | ~5분 |

### 9.3 R* 리스크 (preview-impact §10.3 갱신)

| R# | 리스크 | 가능성 | 영향 | 완화 |
|---|---|---|---|---|
| R1 (preview-impact) | ToolDisplay refactor schema 회귀 (Q6) | 매우 낮음 | 매우 낮음 | **본 P2에서 0건 확정 — R1 폐기** |
| R2 (preview-impact) | PR #25827 v0.42.0 stable 미흡수 | **확정** (main 머지 / release 브랜치 미포함) | 0건 (워크어라운드 유지) | tc113/tc114 그대로 유지 |
| R3 (preview-impact) | Cx13 `experimental.gemma: false` 잠금 시 Gemma 4 사용자 명시 호출 거부 | 매우 낮음 | 매우 낮음 | 향후 요구 시 해제 |
| **R4 (본 P2 신규)** | OAuth headless silent hang #26571 v0.42.0 stable 미포함 — 사용자 환경에서 hang | 낮음 | 매우 낮음 (bkit scope 외) | 문서화 1줄 권고 (선택) + v0.43.0 stable 자동 해소 |
| **R5 (본 P2 신규)** | v0.43.0-preview.0 Subagent Protocol 추상화(#25302/#25303)가 v0.43.0 stable에서 bkit 정책 호환성 깨뜨림 | 매우 낮음 | 낮음 (lib/gemini/policy.js TOML 회귀 가능) | v0.43.0 stable cycle Wave 2에서 policy.js generateSubagentRules() 회귀 스모크 (~10분) |

### 9.4 v0.42.0 stable 출시 시점 (확정)

- 출시 일시: **2026-05-12 22:29 UTC** (P1 §0.1 확정)
- v0.43.0-preview.0 동시 릴리스: **2026-05-12 22:25 UTC** (stable 출시 4분 전)
- **본 P2 분석 가능 시점: 출시 후 24시간 이내**. 본 P2는 출시 익일(2026-05-13) 작성.
- **B' 13회차 즉시 진입 가능** (preview-impact §6.3 ✅ 가능 결론 그대로).

### 9.5 P3 brainstorm 입력 핵심 5줄

1. **본 cycle delta 영향**: Critical 0 / High 0 / Medium 0 / Low 1 (placeholder 단락 추가만). v0.41.2 누적(33 files)과 합산 시 **34 files / Critical 0 / High 5 / Medium 10 / Low 29**.
2. **권장 전략**: B' 13회차 (~5h, 단일 PR, v0.41.2 cycle Do와 동시 흡수). v0.42.0 stable = preview.2 bit-for-bit promotion이므로 preview-impact §6.3 결론 즉시 진입 가능.
3. **본 cycle 추가 P0 (~30분)**: `experimental.gemma: false` (5분) + `bkit.config.json` v0.40.0~v0.42.0 6개 testedVersions 추가(1분) + `hasGemmaDefaultOn` flag(5분) + (선택) `--ignore-env` args 1줄 + tc115 시나리오 1개(~20분).
4. **본 cycle 활용 후보 6건 (P3 등록)**: Cx1 (`--ignore-env`, P1) + Cx13 (`experimental.gemma: false`, P1) + Cx2/Cx4/Cx7/Cx11/Cx14 (P3 별도 cycle).
5. **다음 cycle 사전 등록**: v0.43.0 stable cycle에서 **PR #25827 워크어라운드 8 위치 일괄 제거(~30분)** + OAuth headless fix #26571 자동 흡수 + Subagent Protocol(#25302/#25303) policy.js 호환성 회귀 스모크(~10분) + Session persistence(#26514) PoC 후보 등록.

---

## 10. P3 진입 가능 여부

✅ **즉시 진입 가능** (preview-impact §6.4와 동일 결론, P1 §6.4 강화)

**근거**:
1. **stable promotion = code patch 0건**: preview-impact §1~§8 결론 100% 유효. 본 P2의 정정 3건(§2~§5)은 모두 *0건 확정 / 충돌 0건* 결론.
2. **B' 13회차 골격 90% 재사용**: v0.41.2 cycle B' 12회차 산출물 그대로 + 본 cycle delta 30분 + 1 Low 5분 = 추가 35분만 통합.
3. **회귀 위험 매우 낮음**: PR #25827 워크어라운드 9 위치 유지로 SessionStart 안정성 보존. OAuth #26571 미포함은 bkit scope 외 (사용자 환경). Subagent Protocol/Session persistence는 다음 cycle scope.
4. **No Guessing 강화**: PR #25827 main 머지에도 불구하고 v0.42.0 cycle 내내 워크어라운드 유지 명시 → 사용자 추측 행동 차단.
5. **미해결 5건(Q6~Q10)** 모두 P3 brainstorm/Do 단계에서 해소 가능. P2 결정 충분.

---

## 11. 본 P2 산출물 메타데이터

- **파일 경로**: `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/03-analysis/gemini-cli-v0.42.0-impact.analysis.md`
- **베이스 산출물**: `docs/03-analysis/gemini-cli-v0.42.0-preview-impact.analysis.md` (2026-05-09 / 291 lines, preview.2 기반) — 본 P2가 §1~§8 100% 인용
- **갱신 P1 산출물**: `docs/01-plan/research/gemini-cli-v0.42.0-research.md` (2026-05-13, 416 lines) — stable promotion 확정 + PR #25827 정정 + v0.43.0-preview.0 시그널 검증
- **누적 baseline**: `docs/03-analysis/gemini-cli-v0.41.2-impact.analysis.md` (33 files / Critical 0 / High 5 / Medium 10 / Low 28)
- **사용 grep/Read 도구**: bkit 코드베이스 6 디렉토리 (scripts, hooks, mcp, lib, agents, .bkit/state) + 4 settings 파일 (.gemini/settings.json, bkit.config.json, package.json, GEMINI.md)

---

*분석 종료: 2026-05-13. v0.42.0 stable = preview.2 bit-for-bit promotion. preview-impact.analysis.md (2026-05-09) §1~§8 100% 유효 + 본 P2 정정 3건(PR #25827 main 머지 / OAuth #26571 미포함 / v0.43.0-preview.0 시그널 사전 검토) 추가. 영향도 매트릭스: **Critical 0 / High 0 / Medium 0 / Low 1** (preview-impact 그대로). v0.41.2 cycle 누적 합산: **34 files / Critical 0 / High 5 / Medium 10 / Low 29**. 권장 전략 B' 13회차 (~5h, 단일 PR, v0.41.2 cycle Do와 동시 흡수, v0.42.0 stable 출시 후 즉시 진입). PR #25827 워크어라운드 9 위치는 v0.42.0 cycle 유지, v0.43.0 stable cycle 제거 후보 사전 식별. P3 진입 ✅ 가능.*
*bkit-impact-analyzer agent (Strategy B' 13번째 적용 후보)*
