# Gemini CLI v0.39.1 마이그레이션 플랜 — bkit v2.0.5 (Critical Trust Patch + Defensive Test)

> **Feature**: gemini-cli-v0391-migration
> **Version**: bkit v2.0.5 (patch bump 또는 v2.0.6 예정)
> **Created**: 2026-04-25
> **Status**: Draft
> **Strategy**: **B' (Critical Patch + Spot Validation + Defensive Test)** — `mcp/bkit-server.js` 1줄 trust env 주입 + testedVersions/feature-flag 갱신 + 회귀 테스트 신설
> **Migration Scope**: v0.39.0 → v0.39.1 (patch, 4 commits / 27 files / 4 contributors)
> **Delta Scope**: 사실상 Breaking 1건 (Headless trust enforcement), 새 기능 1건 (`tools.core` + 셸 재귀 검증), Doc fix 1건
> **Research**: [gemini-cli-v0.39.1-research.md](../research/gemini-cli-v0.39.1-research.md)
> **Impact Analysis**: [gemini-cli-v0.39.1-impact.analysis.md](../../03-analysis/gemini-cli-v0.39.1-impact.analysis.md)
> **Predecessor (v0.39.0)**: [gemini-cli-v0.39.0-migration.plan.md](gemini-cli-v0.39.0-migration.plan.md) — Strategy B' 약속결제 완료 (tc113 신설)

---

## 메타데이터

| 항목 | 값 |
|------|-----|
| Feature ID | `gemini-cli-v0.39.1-migration` |
| 대상 버전 | **v0.39.0 → v0.39.1** |
| 릴리스 일자 | 2026-04-24 02:11 UTC, 22h 만의 핫픽스 |
| 작성일 | 2026-04-25 |
| 전체 위험도 | **MEDIUM-HIGH** (Critical 1건이 핵심 spawn 경로 정면 적중, 단 1줄 패치로 일괄 해소) |
| Breaking Changes (사실상) | **1건** (Headless `FatalUntrustedWorkspaceError`, **bkit hit 1** — `mcp/bkit-server.js:1117`) |
| Critical Impact | 1건 (spawn_agent 차단 회귀) + 잔존 1건 (#25655 미해결) |
| 새 기능 (증분) | 1건 (`tools.core` allowlist + 셸 재귀 검증) |
| Bug Fix | 1건 (#25874 에러 메시지 doc 링크 — bkit 무영향) |
| 예상 작업 시간 | **0.5h (P0 필수)** + 1.3h (P1 회귀 테스트) + 0.5h (P1 trust 부트스트랩) + 0.4h buffer = **~2.7h** |
| Wave 구조 | 3 Waves (Critical patch + version swap → Defensive regression test → Trust bootstrap UX) |
| Affected Files | **2개 직접 수정** (`mcp/bkit-server.js`, `bkit.config.json`) + **1개 갱신** (`lib/gemini/version.js`) + **1개 신규** (`tests/suites/tc115-v0391-headless-trust.js`) + 선택 1개 신규 (`scripts/bootstrap-trust.sh`) |
| YAGNI Savings | **~80%** (naive C 풀셋 13~16h+ → B' 2.7h) |

---

## 1. 의도 (Intent Discovery)

### 1.1 핵심 문제 진술 (Why)

**v0.39.1 patch는 명목상 patch이나 실제로는 사실상 Breaking 변경을 1건 포함한다**: PR #25814가 헤드리스(`gemini -p`/`gemini -e`) 모드에서 untrusted 워크스페이스 실행을 `FatalUntrustedWorkspaceError`로 즉시 차단하도록 강화했다. bkit의 핵심 자동화 경로인 `mcp/bkit-server.js#executeAgent` Line 1117의 `spawn('gemini', ['-e', '<agent>.md', ...])` 호출이 정면 적중하며, **trust 미등록 워크스페이스(특히 새 사용자/CI 환경)에서 21개 모든 에이전트 spawn이 즉시 회귀**한다.

다행히 우회 옵션 3가지(`--skip-trust` CLI 플래그, `GEMINI_CLI_TRUST_WORKSPACE=true` env, `~/.gemini/trustedFolders.json` 사전 등록)가 함께 출시되어, **`spawn` env 빌더에 1줄 추가**하는 것으로 일괄 해소 가능하다. 즉 위험은 Critical이지만 수정 비용은 5분이며, 본 사이클의 핵심은 **그 1줄을 안전하게 적용 + 회귀 테스트로 영구 방어 + version-gate 인프라로 미래 spawn 경로까지 일괄 보호**하는 것이다.

부수적으로 같이 출시된 `tools.core` allowlist 신설 + 셸 재귀 검증 강화(PR #25720)는 bkit 정책에 회귀 위험 0건이며 (모두 prefix 매칭, 셸 우회 명시 allowlist 0건), Verification Ability 강화 기회로 활용 가능하나 **본 사이클 P2 이관**한다.

### 1.2 성공 기준 (관측 가능한 형태)

| ID | 성공 기준 | 측정 방법 |
|----|----------|----------|
| S1 | v0.39.1 환경의 untrusted 워크스페이스에서 bkit MCP `spawn_agent` 호출이 정상 동작 | tc115 자동화 테스트 + `gemini` 인터랙티브 세션 내 `spawn_agent` 수동 1회 |
| S2 | v0.39.0 이하 환경에서 동일 코드가 회귀 없이 동작 | testedVersions 전체 범위에서 `npm test` 994/994 (또는 +1 신규) green |
| S3 | `bkit.config.json` testedVersions에 `"0.39.1"` 포함, `lib/gemini/version.js`에 v0.39.1+ feature flag 4개 export 확인 | grep |
| S4 | tc115 회귀 테스트가 trust 차단 시나리오 + env 우회 통과 시나리오 양방향 검증 | tc115 자체 PASS |
| S5 | (선택) trust 부트스트랩 자동화로 새 사용자가 수동 trust 등록 불필요 | `scripts/bootstrap-trust.sh` 동작 확인 |

### 1.3 Non-goals (하지 않을 것)

| ID | 항목 | 이유 |
|----|------|------|
| NG1 | `--skip-trust` CLI 플래그 사용 | v0.39.0 이하에서 unknown flag로 거부될 수 있음. env 방식이 version-safe (CLI 플래그가 도입된 v0.39.1+에서만 동작 vs env는 모든 버전에서 무영향 — 미래 호환성 우월) |
| NG2 | `tools.core` 즉시 채택 | bkit 정책에 회귀 위험 0건이며, 채택 효과(read-only 스킬 가드)는 가치 있으나 **별도 PoC + Multi-Registry 통합 설계**가 정직. v0.40.0 cycle 또는 별도 P2로 이관 |
| NG3 | `.env` 로딩 차단 관련 코드 패치 | bkit는 `.env` 비의존 + 방어 측 (`lib/core/permission.js:56-58`, `hooks/scripts/before-tool.js:195`). v0.39.1 차단과 *시너지* — 코드 수정 불필요 |
| NG4 | bkit 정책 시뮬레이터 전체 자동 회귀 (셸 재귀 검증) | bkit 정책 모두 prefix 매칭, 셸 우회 명시 allowlist 0건 (Impact §2.2.1, §6 확인). 회귀 위험 0건이라 정책 시뮬레이터 작업 비용 대비 가치 미확인. P2 이관 (관찰 기반 보강) |
| NG5 | Issue #25655 (SessionStart 중복) 추가 대응 | v0.39.0 cycle에서 tc113 신설 완료 (방어 카나리아 운영 중). v0.39.1에서도 잔존이지만 상태 변동 없음. 본 plan 범위 외 |
| NG6 | v0.40.0 (MemoryManager 4-tier, autoMemory split) 사전 작업 | 별도 cycle. v0.39.0 plan §11.3 hint 그대로 유지 |
| NG7 | `GEMINI_CLI_TRUST_WORKSPACE` env 주입을 `lib/gemini/trust.js#getSpawnEnv()` 헬퍼로 추상화 | 현 시점 spawn 경로 1곳뿐. 헬퍼는 미래 spawn 경로 추가 시점에 도입 (YAGNI). 본 plan에서는 **인라인 1줄 + 주석**으로 충분 |
| NG8 | bkit `tools.allowed` → `tools.core` 마이그레이션 | 현재 `.gemini/settings.json`에 `tools.allowed`/`tools.core` 모두 미정의 (5줄, `experimental.enableAgents`만). 마이그할 대상 없음 |

---

## 2. 컨텍스트 요약 (Context Snapshot)

### 2.1 v0.39.1 변경 요약

| 변경 | 분류 | bkit 적중 |
|------|------|----------|
| **PR #25814** Headless 모드 untrusted workspace 차단 + `.env` 로딩 차단 | 사실상 Breaking | 🔴 `mcp/bkit-server.js:1117` 정면 적중 (.env는 bkit 비의존) |
| **PR #25720** `tools.core` allowlist 신설 + 셸 재귀 검증 (`$(...)`, `bash -c`, pipe, redirection 분해) | Feature + 사실상 Breaking 잠재 | 🟡 정책 회귀 위험 0건, 채택 기회 1건 |
| **PR #25874** `FatalUntrustedWorkspaceError` 메시지에 docs 링크 추가 | Doc/UX | 🟢 영향 0 |
| Release chore | — | 🟢 영향 0 |

### 2.2 bkit 영향 요약 (Impact Analysis 기준)

- 직접 영향 파일: **2개** (`mcp/bkit-server.js`, `bkit.config.json`)
- 간접/검증 파일: **3개** (`mcp/start-server.sh` 부트스트랩 후보, `lib/gemini/version.js` feature flag, `.gemini/policies/bkit-permissions.toml` — 회귀 검증)
- 🔴 Critical 1건 (Headless trust 차단)
- 🟡 Medium 2건 (`tools.core` 채택 기회, 셸 재귀 검증 회귀 검증)
- 🟢 Low 2건 (`--skip-trust` 플래그 인지, `.env` 비의존 확인)

### 2.3 제약사항

| 제약 | 내용 |
|------|------|
| 시간 | v0.40.0 stable이 4월 말~5월 초 출시 예상 → 본 plan은 **신속 처리 (≤1주)** 목표 |
| 호환성 | v0.39.0 이하 지원 유지. env 주입 방식은 모든 버전에서 무영향 → version-safe |
| 사용자 환경 | 새 사용자가 trust 등록 누락 시 회귀 → P0 패치 우선 적용 후 P1 부트스트랩 자동화 권고 |
| MCP stdio 검증 미확정 | `GEMINI_CLI_TRUST_WORKSPACE=true`이 자식 spawn에 정상 전파되는지 v0.39.1 실환경 검증 필요 (Impact §1.1.4 확인 필요 항목) |

---

## 3. 대안 비교 (Alternative Strategies)

본 plan은 4개 결정 포인트(trust 우회 방식 / 셸 회귀 검증 범위 / `tools.core` 채택 시점 / 하위 호환성 범위)를 안고 3개 통합 전략을 제시한다.

### 3.1 접근법 A: 최소 패치 (Minimal Patch)

**범위**: env 주입 1줄 + testedVersions 갱신 + feature flag 4개 추가.

| 작업 | 파일 | 공수 |
|------|------|------|
| `mcp/bkit-server.js:1105` 직후 `env.GEMINI_CLI_TRUST_WORKSPACE = 'true';` 1줄 추가 + 주석 | `mcp/bkit-server.js` | 5분 |
| `bkit.config.json:120` testedVersions에 `"0.39.1"` 추가 | `bkit.config.json` | 1분 |
| `lib/gemini/version.js:185-199` 뒤 v0.39.1+ feature flag 4개 추가 (`hasHeadlessTrustEnforcement`, `hasToolsCoreAllowlist`, `hasShellRecursiveValidation`, `hasSkipTrustFlag`) | `lib/gemini/version.js` | 10분 |
| smoke `npm test` (994/994 green 확인) | 전체 | 5분 |
| 수동 E2E (untrusted workspace에서 spawn_agent 1회 호출 확인) | 수동 | 10분 |
| **합계** | **3 files 수정** | **~0.5h** |

| 장점 | 단점 | 리스크 | 작업량 | 추천도 |
|------|------|--------|--------|--------|
| Critical 회귀 즉시 해소 / 최소 비용 / hotfix성 | 회귀 영구 방어 부재 (회귀 테스트 0), trust 부트스트랩 부재 (새 사용자 UX 미개선) | **Medium** (다음 spawn 경로 추가 시 회귀 재발 가능) | 0.5h | ★★★ |

### 3.2 접근법 B: 패치 + 회귀 검증 (Patch + Defensive Regression)

**범위**: A + tc115 회귀 테스트 + 셸 재귀 검증 spot 회귀.

| 작업 | 파일 | 공수 |
|------|------|------|
| A 전체 | (위) | 0.5h |
| `tests/suites/tc115-v0391-headless-trust.js` 신설 — 트러스트 차단 시나리오(env 미주입 시 spawn 실패 또는 stderr에 trust 메시지) + env 우회 시나리오(env 주입 시 spawn 성공) 양방향 검증 | `tests/suites/tc115-v0391-headless-trust.js` 신규 | 1.0h |
| 셸 재귀 검증 spot — `.gemini/policies/bkit-permissions.toml` 9개 allow rule을 v0.39.1 환경에서 가벼운 정책 시뮬레이션 (수동 1회) — bkit 자체 LLM 실행을 통해 `git status`, `ls`, `npm test` 등이 정상 통과하는지 관찰 | 수동 | 20분 |
| **합계** | **3 files 수정 + 1 file 신규** | **~1.8h** |

| 장점 | 단점 | 리스크 | 작업량 | 추천도 |
|------|------|--------|--------|--------|
| Critical 회귀 영구 방어 (tc115) + 셸 검증 회귀 0건 확인 | trust 부트스트랩 부재 (새 사용자 UX 미개선) | **Low** | 1.8h | **★★★★★ (B' 변종 권장)** |

### 3.3 접근법 B' (RECOMMENDED): 패치 + 회귀 검증 + Trust Bootstrap UX

**범위**: B + `scripts/bootstrap-trust.sh` 신설 (idempotent trust 등록 자동화).

| 작업 | 파일 | 공수 |
|------|------|------|
| B 전체 | (위) | 1.8h |
| `scripts/bootstrap-trust.sh` — `~/.gemini/trustedFolders.json`에 현재 워크스페이스를 idempotent 등록하는 셸 스크립트 (jq 또는 node로 구현). 사용자가 처음 bkit 실행 시 한 번 실행하도록 README/setup 안내 추가 | `scripts/bootstrap-trust.sh` 신규 | 30분 |
| (선택) `mcp/start-server.sh` 또는 `package.json` 후크에 부트스트랩 자동 호출 (idempotent로 무위험) — **본 plan에서는 수동 안내까지만**, 자동 호출은 P2 | — | 0 (defer) |
| **합계** | **3 files 수정 + 2 files 신규** | **~2.3h + buffer 0.4h = 2.7h** |

| 장점 | 단점 | 리스크 | 작업량 | 추천도 |
|------|------|--------|--------|--------|
| Critical 영구 방어 + 새 사용자 UX 회복 (Automation First 정렬) + version-safe (env+부트스트랩 이중화) | A 대비 +2.2h, 단 trust 부트스트랩이 사용자 환경에 침습적(home dir json 수정) — README에 명시 필요 | **Low** | 2.7h | **★★★★★ (1순위)** |

### 3.4 접근법 C: 전면 고도화 (Comprehensive Adoption)

**범위**: B' + `tools.core` PoC + `lib/gemini/trust.js#getSpawnEnv()` 헬퍼 + 셸 정책 시뮬레이터 자동 회귀.

| 작업 | 공수 |
|------|------|
| B' 전체 | 2.7h |
| `.gemini/settings.json`에 read-only 스킬용 `tools.core: ["read_file", "glob", "grep_search", "list_directory"]` 추가 + 안전 등급별 도구 노출 시나리오 검증 (Impact §9 #1) | 1d (~6h) |
| `lib/gemini/trust.js` 신규 헬퍼 모듈 + 기존 spawn 경로 리팩 + 미래 호출 경로 가이드라인 추가 | 2-3h |
| 정책 시뮬레이터 자동 회귀 — `bkit-permissions.toml`의 모든 rule을 v0.39.1 policy-engine으로 패스/페일 자동 검증 | 4-6h |
| **합계** | **~14-18h** |

| 장점 | 단점 | 리스크 | 작업량 | 추천도 |
|------|------|--------|--------|--------|
| Verification Ability 강화 + 미래 spawn 경로 일괄 보호 + 정책 자동 회귀 인프라 | Scope creep 5배, v0.40.0 cycle과 충돌 위험, `tools.core` PoC가 v0.40.0 MemoryManager 4-tier와 같은 cycle에서 처리되는 게 정직 | **High** (sunk cost + cycle 지연) | 14-18h | ★★ (P2/v0.40.0 cycle 이관 권고) |

### 3.5 평가 매트릭스

| 기준 (가중치) | A: 최소 (0.5h) | **B: 패치+회귀 (1.8h)** | **B': +UX (2.7h)** | C: 풀셋 (14-18h) |
|---------------|---------------|---------------------|------------------|-----------------|
| 위험도 (30%) | 5 (회귀 영구 방어 부재) | 8 | **9** | 9 |
| 작업량 (25%) | 10 | 8 | **7** | 2 |
| 가치 창출 (25%) | 4 (즉시 회복) | 7 (방어 자동화) | **9** (UX까지) | 9 (단 cycle 지연 위험) |
| 장기 이점 (20%) | 3 | 7 | **8** (부트스트랩 인프라) | 8 |
| **가중 합계** | **5.55** | **7.55** | **8.30** | **6.20** |

### 3.6 결정 매트릭스 (4개 결정 포인트 × B' 채택)

| 결정 # | 채택 옵션 | 근거 |
|--------|----------|------|
| **결정 1**: Trust 우회 전달 방식 | **옵션 A (`env.GEMINI_CLI_TRUST_WORKSPACE='true'` 주입)** | (a) version-safe (v0.39.0 이하에서 무영향 vs `--skip-trust` 플래그는 unknown flag 거부 위험), (b) 1줄 패치로 일괄 해소, (c) 자식 spawn에 자동 상속, (d) 옵션 C(부트스트랩 등록)는 **이중화 보강용**으로 옵션 A와 병행 (B'에서 함께 채택) |
| **결정 2**: 셸 정책 회귀 검증 범위 | **옵션 B (위험 패턴만 수동 검증) — 단, 회귀 위험 0건 확인 후 Spot 1회로 축소** | bkit 정책 모두 prefix 매칭, 셸 우회 명시 allowlist 0건. 옵션 A(자동 회귀 인프라)는 비용 4-6h 대비 가치 미확인. 옵션 C(스킵)는 검증 의무 미이행 → **옵션 B 변종: 9개 allow rule을 v0.39.1 환경에서 인터랙티브 1회 관찰 (20분)** |
| **결정 3**: `tools.core` 채택 시점 | **옵션 B (별도 PoC → v0.40.0 cycle)** | bkit `.gemini/settings.json` 현재 5줄 (`experimental.enableAgents`만). `tools.core` PoC는 Multi-Registry tool isolation(v0.36.0+)과 통합 설계가 정직. 본 사이클 도입은 scope creep |
| **결정 4**: 하위 호환성 범위 | **v0.34.0 minimum 유지, testedVersions 누적 기재** | env 방식은 모든 버전에서 무영향. v0.39.1 추가만 수행. v0.39.0 plan §4.6 일관성 |

### 3.7 Sharp Decision (첨예 결정)

#### 결정 1 심화: env 주입을 모든 버전에 무조건 적용 vs version-gate

| 옵션 | 내용 | 장점 | 단점 | 리스크 | 추천도 |
|------|------|------|------|--------|--------|
| **옵션 X (채택)** | env 무조건 주입 (`env.GEMINI_CLI_TRUST_WORKSPACE = 'true';`) | 단순, 1줄, 모든 버전에서 무영향 (v0.39.0 이하에선 미사용 env), 새 spawn 경로 추가 시 자동 적용 | "보안을 항상 비활성화"라는 인상 — 단, bkit MCP는 이미 사용자가 인터랙티브로 trust한 세션 내부 동작이라 *trust 전파*가 정직 (보안 비활성화 ≠ trust 전파) | Very Low | ★★★★★ |
| **옵션 Y (반려)** | `flags.hasHeadlessTrustEnforcement` version-gate (`if (flags.hasHeadlessTrustEnforcement) env.GEMINI_CLI_TRUST_WORKSPACE = 'true'`) | "필요할 때만" 명시적 | 코드 복잡도 증가, version 감지 부정확 시 회귀 가능, env가 무영향이라 게이팅 가치 낮음 | Low (감지 회귀) | ★★ |

**채택: 옵션 X** — 근거: env는 v0.39.1+에서만 의미가 있고 그 이하에서는 무영향 → "항상 주입"이 가장 단순/안전. 주석으로 의도 명시(*"bkit MCP는 인터랙티브 trust 세션 내부 동작 — 자식 gemini 프로세스에 trust 전파"*)하면 보안 인상 문제도 해소됨.

---

## 4. 추천 접근법 (Recommended Strategy: B')

**Strategy B' (Critical Patch + Defensive Test + Trust Bootstrap UX)** — 가중 합계 **8.30**, 2.7h, 3 Waves.

### 4.1 결정 매트릭스 적용

| 결정 # | 적용 옵션 | Wave |
|--------|----------|------|
| 결정 1 (trust 우회) | env 무조건 주입 (옵션 X) | Wave 1.1 |
| 결정 2 (셸 회귀 범위) | 위험 패턴 인터랙티브 spot 1회 (옵션 B 변종) | Wave 2.3 |
| 결정 3 (`tools.core`) | v0.40.0 cycle 이관 (옵션 B) | Non-goal NG2 |
| 결정 4 (하위 호환) | v0.34.0 유지 + testedVersions 누적 | Wave 1.2 |
| 추가: 부트스트랩 | `scripts/bootstrap-trust.sh` 신설 (수동 안내 우선, 자동 호출은 P2) | Wave 3 |

### 4.2 선택 근거 요약

1. **Critical 즉시 해소**: 5분 패치로 21개 에이전트 spawn 회복 — 비용/효과 압도적
2. **회귀 영구 방어**: tc115가 차단/우회 양방향을 검증 → 미래 회귀 자동 감지 카나리아
3. **새 사용자 UX 회복**: trust 부트스트랩으로 Automation First 원칙 회귀 (수동 trust 등록 누락 0%)
4. **YAGNI 정렬**: `tools.core`/헬퍼/자동 시뮬레이터를 의도적 보류 (회귀 위험 0건 확인 후)
5. **Strategy B' 패턴 누적**: 9th Strategy B family application (v0.35→v0.39.0까지 8회 검증) — `feedback_migration_pattern.md` 정합

---

## 5. 구현 로드맵 (Phased Implementation)

### Phase 1: 즉시 회복 (Critical 차단 해소) — 0.5h, P0

| # | 작업 | 파일 (file:line) | 공수 | 우선순위 |
|---|------|-----------------|------|----------|
| 1.1 | `mcp/bkit-server.js:1105` env 빌더 직후에 trust 전파 1줄 추가:<br>```js\nconst env = { ...process.env };\n// v0.39.1+ headless trust enforcement (PR #25814) — bkit MCP는\n// 사용자가 인터랙티브로 trust한 세션 내부 동작이므로 자식 gemini\n// 프로세스에 trust를 전파한다. v0.39.0 이하에서는 미사용 env(무영향).\nenv.GEMINI_CLI_TRUST_WORKSPACE = 'true';\n``` | `mcp/bkit-server.js:1105` | 5분 | P0 |
| 1.2 | `bkit.config.json:120` testedVersions 배열 끝에 `"0.39.1"` 추가 (현재 `"0.39.0"`로 끝남) | `bkit.config.json:120` | 1분 | P0 |
| 1.3 | `lib/gemini/version.js:187` (현재 마지막 `hasInvokeAgent`) 뒤에 v0.39.1+ feature flag 4개 추가:<br>- `hasHeadlessTrustEnforcement: isVersionAtLeast('0.39.1')`<br>- `hasToolsCoreAllowlist: isVersionAtLeast('0.39.1')`<br>- `hasShellRecursiveValidation: isVersionAtLeast('0.39.1')`<br>- `hasSkipTrustFlag: isVersionAtLeast('0.39.1')` | `lib/gemini/version.js:187+` | 10분 | P0 |
| 1.4 | smoke `npm test` 994/994 green 확인 (v0.39.0 cycle Wave 3에서 994로 증가) | 전체 | 5분 | P0 |
| 1.5 | 수동 E2E: untrusted workspace 시뮬레이션 (`mv ~/.gemini/trustedFolders.json{,.bak}` → bkit MCP 실행 → `spawn_agent` 호출 → 정상 동작 확인 → 백업 복원) | 수동 | 10분 | P0 |

**합격 기준**: spawn_agent 호출이 untrusted dir에서 `FatalUntrustedWorkspaceError` 없이 정상 동작, 994/994 green 유지.

**검증 방법**:
- `npm test` 결과 PASS
- 수동 E2E 캡처: untrusted dir에서 `gemini -e agents/cto-lead.md "test"` 실행 시 env 미주입 시 stderr에 trust 메시지, env 주입 시 정상 동작 — Wave 1.5에서 직접 비교

### Phase 2: 회귀 검증 / 정책 안정화 — 1.3h, P0+P1

| # | 작업 | 파일 | 공수 | 우선순위 |
|---|------|------|------|----------|
| 2.1 | `tests/suites/tc115-v0391-headless-trust.js` 스켈레톤 (기존 `tc88-hooks-session-start.js`/`tc113-session-start-duplication-defense.js` 패턴 참조) | `tests/suites/tc115-v0391-headless-trust.js` 신규 | 30분 | P0 |
| 2.2 | tc115 시나리오 1 (차단 검증): 임시 untrusted dir 생성 → `process.env.GEMINI_CLI_TRUST_WORKSPACE`를 의도적으로 unset → `bkit-server.js#executeAgent` 호출 → `flags.hasHeadlessTrustEnforcement === true`이면 stderr에 trust 메시지 또는 exitCode !== 0 검증, `false`이면 skip<br>시나리오 2 (우회 검증): 동일 dir + env 주입 → spawn 성공 (exitCode 0 또는 정상 stdout) 검증 | `tests/suites/tc115-v0391-headless-trust.js` | 25분 | P0 |
| 2.3 | tc115 docstring에 한계 명시: "이 테스트는 bkit-server.js의 env 주입이 v0.39.1+ trust 게이트를 정상 우회하는지를 검증. v0.39.0 이하에서는 시나리오 1 자동 skip. 본 테스트는 미래 spawn 경로 추가 시 trust env 누락을 자동 감지하는 카나리아 역할" | `tests/suites/tc115-v0391-headless-trust.js` | 5분 | P0 |
| 2.4 | tc115 포함 `npm test` → 995/995 green | 전체 | 5분 | P0 |
| 2.5 | 셸 재귀 검증 spot 회귀: v0.39.1 환경에서 `gemini -e agents/cto-lead.md "git status를 실행해줘"` 같은 요청을 통해 `bkit-permissions.toml`의 9개 allow rule (`git status`, `git log`, `git diff`, `ls`, `cat`, `echo`, `npm test`, `npm run`, `node`)이 새 재귀 검증을 정상 통과하는지 인터랙티브 관찰 (수동, 거부 발생 시 결과 기록만 — 본 plan은 정책 변경 미수행) | 수동 | 20분 | P1 |
| 2.6 | v0.39.0 cycle의 tc113 (SessionStart 중복 방어) 결과를 v0.39.1 환경에서 재실행 → 잔존 #25655 카나리아 상태 갱신 (PASS 유지 확인) | 수동 (`node tests/suites/tc113-session-start-duplication-defense.js` 단독 실행) | 5분 | P1 |

**합격 기준**: tc115 추가로 995/995 green, 셸 재귀 검증 spot에서 9개 allow rule 모두 통과 (또는 ask_user 떨어지면 결과 기록), tc113 PASS 유지.

**검증 방법**:
- tc115 자체가 양방향 검증 (차단+우회) 자동화
- spot 회귀는 인터랙티브 관찰 결과를 Do report에 기록

### Phase 3: 기능 고도화 / Trust Bootstrap UX — 0.5h, P1

| # | 작업 | 파일 | 공수 | 우선순위 |
|---|------|------|------|----------|
| 3.1 | `scripts/bootstrap-trust.sh` 신설 — `~/.gemini/trustedFolders.json`에 현재 워크스페이스 절대 경로를 idempotent 등록. jq 또는 node 스크립트로 (이미 등록되었으면 no-op):<br>```bash\n#!/usr/bin/env bash\nset -euo pipefail\nWORKSPACE=\"$(cd \"$(dirname \"$0\")/..\" && pwd)\"\nFILE=\"$HOME/.gemini/trustedFolders.json\"\nmkdir -p \"$(dirname \"$FILE\")\"\n[ -f \"$FILE\" ] || echo '{}' > \"$FILE\"\nnode -e \"\n  const fs = require('fs');\n  const data = JSON.parse(fs.readFileSync('$FILE', 'utf8'));\n  data['$WORKSPACE'] = data['$WORKSPACE'] || 'TRUST_FOLDER';\n  fs.writeFileSync('$FILE', JSON.stringify(data, null, 2));\n\"\necho \"bkit workspace registered: $WORKSPACE\"\n``` | `scripts/bootstrap-trust.sh` 신규 | 25분 | P1 |
| 3.2 | `README.md` 또는 setup 안내에 한 줄 추가: "v0.39.1+ 환경에서는 처음 한 번 `bash scripts/bootstrap-trust.sh` 실행 권장 (또는 bkit MCP 자동 fallback이 있어 미실행도 동작)" | `README.md` | 5분 | P1 |

**합격 기준**: `scripts/bootstrap-trust.sh` 실행 후 `~/.gemini/trustedFolders.json`에 워크스페이스 경로가 추가되며 재실행 시 no-op (idempotent), README에 안내 추가.

**검증 방법**:
- 부트스트랩 실행 전후 `~/.gemini/trustedFolders.json` diff
- 부트스트랩 실행 후 env 미주입 상태에서도 `gemini -e ...` 정상 동작 (이중화 검증)

### Phase 4 (Deferred): 위임 항목

| 항목 | 위임 대상 |
|------|----------|
| `tools.core` PoC + `.gemini/settings.json` 안전 등급별 도구 노출 | **v0.40.0 cycle** (Multi-Registry 통합 설계와 함께) |
| `lib/gemini/trust.js#getSpawnEnv()` 헬퍼 신설 | **P2** (미래 spawn 경로 추가 시점) |
| 정책 시뮬레이터 자동 회귀 인프라 | **P2** (LLM이 자주 사용하는 pipe 조합 관찰 후 보강) |
| `mcp/start-server.sh` 또는 npm postinstall 후크에 부트스트랩 자동 호출 | **P2** (사용자 환경 자동 변경의 신뢰도 확립 후) |
| `gemini-cli-learning/SKILL.md` v0.39.1 trust 우회 옵션 1단락 | **P3** |
| Issue #25655 fix PR #25827 모니터링 | **P3** (5분/주, v0.39.0 cycle에서 이미 시작) |

### 5.1 총 공수

| Phase | 공수 | 누적 | 우선순위 |
|-------|------|------|----------|
| Phase 1: Critical 패치 + Version Swap | 0.5h | 0.5h | P0 |
| Phase 2: 회귀 테스트 (tc115) + Spot 검증 | 1.3h | 1.8h | P0+P1 |
| Phase 3: Trust Bootstrap UX | 0.5h | 2.3h | P1 |
| **Buffer** | 0.4h | **2.7h** | |

---

## 6. YAGNI 리뷰 결과

### 6.1 채택/보류 판정

| # | 항목 | 공수 | 채택? | 근거 |
|---|------|------|-------|------|
| 1 | `mcp/bkit-server.js` env 1줄 주입 | 5분 | **채택 P0** | Critical 회귀 즉시 해소 |
| 2 | `bkit.config.json` testedVersions `"0.39.1"` 추가 | 1분 | **채택 P0** | 호환성 선언 필수 |
| 3 | `lib/gemini/version.js` v0.39.1+ feature flag 4개 추가 | 10분 | **채택 P0** | version-gate 인프라 |
| 4 | smoke `npm test` 994/994 → 995/995 | 10분 | **채택 P0** | 계약 무변경 검증 |
| 5 | 수동 E2E (untrusted dir에서 spawn_agent 동작 확인) | 10분 | **채택 P0** | 실재 확인 |
| 6 | tc115 회귀 테스트 신설 | 1.0h | **채택 P0** | Critical 영구 방어 카나리아 |
| 7 | 셸 재귀 검증 spot (인터랙티브 1회) | 20분 | **채택 P1** | 회귀 위험 0건 확정 |
| 8 | tc113 v0.39.1 환경 재실행 | 5분 | **채택 P1** | 잔존 #25655 카나리아 갱신 |
| 9 | `scripts/bootstrap-trust.sh` 신설 | 25분 | **채택 P1** | 새 사용자 UX 회복 (Automation First) |
| 10 | README setup 안내 1줄 | 5분 | **채택 P1** | Docs = Code |
| 11 | `--skip-trust` CLI 플래그 사용 | 5분 | **보류 (NG1)** | v0.39.0 이하 unknown flag 거부 위험 |
| 12 | env 주입을 version-gate (`if (flags.hasHeadlessTrustEnforcement)`) | 10분 | **보류** | env 무영향 → version-gate 복잡도만 증가 (Sharp Decision 결정 1) |
| 13 | `lib/gemini/trust.js#getSpawnEnv()` 헬퍼 신설 | 2-3h | **보류 → P2** | 현재 spawn 경로 1곳, YAGNI |
| 14 | 정책 시뮬레이터 자동 회귀 인프라 | 4-6h | **보류 → P2** | 회귀 위험 0건 확정 후 ROI 미확인 |
| 15 | `tools.core` 도입 PoC | 1d | **보류 → v0.40.0 cycle** | Multi-Registry 통합 설계 정직 |
| 16 | `.gemini/settings.json` 안전 등급별 도구 노출 시나리오 | 4-6h | **보류 → v0.40.0 cycle** | NG2 |
| 17 | `mcp/start-server.sh` 부트스트랩 자동 호출 | 30분 | **보류 → P2** | 자동 환경 변경 신뢰도 확립 후 |
| 18 | `.env` 로딩 차단 관련 코드 패치 | 30분 | **보류 (NG3)** | bkit 비의존, 방어 측 |
| 19 | Issue #25655 추가 대응 | 2-3h | **보류 (NG5)** | v0.39.0 cycle tc113 신설 완료, 상태 변동 0 |
| 20 | v0.40.0 사전 작업 | — | **보류 (NG6)** | 별도 cycle |

### 6.2 YAGNI 체크리스트

- [x] "있으면 좋을 것 같은" 기능 제외: trust 헬퍼 추상화 (P2), 정책 시뮬레이터 자동화 (P2), tools.core PoC (v0.40.0), 부트스트랩 자동 호출 (P2)
- [x] 현재 사용자가 실제로 필요: Critical 패치 (Wave 1), 회귀 영구 방어 (Wave 2), 새 사용자 UX (Wave 3)
- [x] bkit 철학 부합:
  - **Automation First**: env 주입으로 trust 회복 + 부트스트랩 자동화
  - **No Guessing**: tc115가 trust env 정확 동작 검증, 추측 0
  - **Docs = Code**: README setup 안내 동기화
  - **Safe Defaults**: trust 게이트 자체는 Safe Defaults 강화, bkit는 명시적 trust 전파만 수행
- [x] 유지보수 비용 대비 가치: 2.7h 투자로 Critical 영구 방어 + UX 회복 + 미래 회귀 자동 감지
- [x] 이전 마이그레이션 불필요 패턴 미반복: B' 패턴 9회차 재사용, plan 분할 회피, naive 풀셋 (C 14-18h) 방지

### 6.3 YAGNI Savings

| Category | Items | Effort |
|----------|-------|--------|
| 채택 (Phase 1-3) | 10 items | 2.7h |
| 보류/이관 | 10 items | 13~16h+ |
| **Naive 추정 합계 (C 풀셋)** | 20 items | ~14-18h |
| **YAGNI 절감률** | | **~80%** |

---

## 7. 위험 관리 (Risk Management)

### 7.1 식별된 위험

| # | 위험 | 확률 | 영향 | 완화책 |
|---|------|------|------|--------|
| R1 | `GEMINI_CLI_TRUST_WORKSPACE=true`이 v0.39.1 자식 spawn에 정상 상속/효과 발휘되지 않음 (Impact §12 Confidence ⬛⬛⬛⬛⬜) | **Low-Medium** | **High** (Critical 패치 무효화) | Wave 1.5 수동 E2E로 즉시 검증 → 실패 시 옵션 C(`~/.gemini/trustedFolders.json` 부트스트랩)로 즉시 fallback (Wave 3 사전 처리) |
| R2 | tc115 작성 환경에서 spawn 자식 프로세스 격리 어려움 (현재 테스트 인프라는 hooks/MCP 단위만 검증, gemini 직접 spawn 사례 0) | **Medium** | Medium | Wave 2.1 실패 시 tc115를 mock 기반으로 작성 (`spawn` mock + env 인자 검증) — 실 spawn 미실행이지만 코드 경로 검증 |
| R3 | 새 사용자가 trust 부트스트랩 미실행 + env 주입 동작 안 함 동시 발생 → 회귀 | **Low** (env가 거의 100% 동작 추정) | High | env+부트스트랩 이중화 (B'에서 둘 다 채택), README 안내 명시 |
| R4 | 셸 재귀 검증으로 LLM이 자주 사용하는 pipe 조합(`docker logs | tail -100`)이 ask_user로 떨어져 사용자 마찰 증가 | **Low-Medium** | Low | Wave 2.5 spot에서 관찰 후 결과 기록만 — 본 plan은 정책 미수정. 실 사용자 데이터 누적 후 v0.40.0 cycle에서 allowlist 보강 |
| R5 | v0.39.1 → v0.39.2 또는 v0.40.0 stable이 본 plan Do phase 진행 중 출시 | **Medium** (4월 말~5월 초 예상) | Low (본 plan은 v0.39.1만, v0.40.0은 별도 cycle) | 본 plan을 신속 완료 후 v0.40.0 cycle 진입 |
| R6 | `scripts/bootstrap-trust.sh`의 jq/node 의존성이 사용자 환경에 부재 | **Very Low** | Low | node는 bkit가 이미 의존, jq 미사용. 단 macOS/Linux 한정 — Windows는 별도 PR |
| R7 | feature flag 4개 추가가 기존 분기 로직과 충돌 | **Very Low** | Low | `hasFeature(version)` 함수 호출자 부재 확인 후 추가 (기존 분기 로직 미변경) |
| R8 | Issue #25655 잔존 — v0.39.1에서도 SessionStart 중복 출력 | **High** (v0.38.2부터 누적) | Medium (UX 저하) | tc113이 v0.39.0 cycle에서 신설되어 fix PR #25827 머지 시 자동 감지. 본 plan에서 Wave 2.6으로 카나리아 PASS 유지 확인만 |

### 7.2 롤백 전략

#### 7.2.1 체크포인트

1. **Wave 1 시작 전**: `git commit` 또는 branch 분기 `migration/v0.39.1` 생성
2. **Wave 1 완료 후**: P0만으로 Critical 회복 + 호환성 선언 완료 상태 보존
3. **Wave 2 완료 후**: tc115 + spot 검증 보존
4. **Wave 3 완료 후**: 부트스트랩 + README 보존

#### 7.2.2 롤백 절차

| 실패 시점 | 복구 절차 |
|----------|----------|
| Wave 1.4 smoke 실패 (994/994 회귀) | `git revert <Wave 1 commit>` → `npm install @google/gemini-cli@0.39.0` 재pin → 원인 분석 후 v0.39.2 대기 |
| Wave 1.5 E2E 실패 (env 미동작 — R1) | env 1줄 + Wave 3 부트스트랩으로 강제 fallback (env+trustedFolders 병행). 그래도 실패 시 v0.39.0 testedVersions에서 `"0.39.1"` 제거, v0.39.0 pin 권고 |
| Wave 2 tc115 작성 환경 이슈 (R2) | tc115를 mock 기반으로 축약 또는 본 사이클은 P0 (Wave 1)만 + P1 (Wave 3 부트스트랩)으로 유지, tc115는 차회 이관 |
| Wave 2.5 spot에서 정책 거부 다수 발생 (R4) | bkit-permissions.toml에 임시 추가 (`tail`, `head`, `awk`, `grep` allow rule)는 별도 PR로 분리, 본 plan은 결과 기록만 |
| Wave 3 부트스트랩 실패 (R6) | `scripts/bootstrap-trust.sh` 미신설 + README에 "수동 trust 등록은 인터랙티브 `gemini` 실행 후 trust prompt 응답" 안내로 대체 |

#### 7.2.3 하위 호환 보장

- `minGeminiCliVersion: "0.34.0"` 유지 → 사용자 자율 다운그레이드 가능
- testedVersions에 v0.38.0/.1/.2 + v0.39.0/.1 병행 기재 → "Issue #25655 회피 원하는 사용자는 v0.38.x 고정" 안내 가능
- env 주입은 v0.39.0 이하에서 무영향 (미사용 env) → 단일 코드베이스가 모든 버전에서 안전 동작

### 7.3 회귀 테스트 시나리오

| 시나리오 | 검증 위치 | 자동화 |
|---------|----------|--------|
| Untrusted dir + env 주입 → spawn 성공 | tc115 시나리오 2 | 자동 |
| Untrusted dir + env 미주입 → spawn 실패 (또는 v0.39.0 이하 skip) | tc115 시나리오 1 | 자동 (version-gate) |
| Trusted dir → spawn 성공 (env 무관) | tc115 시나리오 3 (선택) | 자동 |
| `bkit-permissions.toml` 9개 allow rule이 v0.39.1 정책 통과 | Wave 2.5 인터랙티브 spot | 수동 (1회) |
| SessionStart `systemMessage` 1회 배출 (#25655 잔존 카나리아) | tc113 (v0.39.0 cycle 신설) 재실행 | 자동 |
| 994/994 → 995/995 green 유지 | `npm test` | 자동 |

### 7.4 모니터링 포인트

| 모니터링 항목 | 도구/방법 | 주기 |
|--------------|----------|------|
| Issue #25655 fix PR #25827 머지 상태 | GitHub PR API | 5분/주 |
| v0.39.2 핫픽스 / v0.40.0 stable 출시 | `npm view @google/gemini-cli@latest` | 일/주 |
| 사용자 spawn_agent 회귀 신고 | Issues / Discord | 즉시 |
| LLM의 pipe 명령 사용 빈도 (bkit-permissions.toml ask_user 누적) | bkit audit log 분석 (P2) | v0.40.0 cycle 진입 시 |
| `tools.core` 채택 PoC trigger (v0.40.0 출시) | release notes | v0.40.0 stable 출시 시 |

---

## 8. 참고 문서 (References)

### 8.1 bkit 내부

- Research: `docs/01-plan/research/gemini-cli-v0.39.1-research.md`
- Impact Analysis: `docs/03-analysis/gemini-cli-v0.39.1-impact.analysis.md`
- Predecessor Plan (v0.39.0): `docs/01-plan/features/gemini-cli-v0.39.0-migration.plan.md` (Strategy B', 3.2h, 3 Waves)
- Strategy B Pattern: `.claude/agent-memory/migration-strategist/feedback_migration_pattern.md`
- Prior Migration Memory: `project_v0390_migration.md`, `project_v0382_migration.md`

### 8.2 업스트림

- v0.39.1 Release: https://github.com/google-gemini/gemini-cli/releases/tag/v0.39.1
- v0.39.0 → v0.39.1 Compare: https://github.com/google-gemini/gemini-cli/compare/v0.39.0...v0.39.1
- **PR #25814 (사실상 Breaking)** Headless trust enforcement + `.env` 차단: https://github.com/google-gemini/gemini-cli/pull/25814
- **PR #25720** `tools.core` allowlist + 셸 재귀 검증: https://github.com/google-gemini/gemini-cli/pull/25720
- PR #25874 (Doc) 에러 메시지 docs 링크: https://github.com/google-gemini/gemini-cli/pull/25874
- 신규 docs: `docs/cli/trusted-folders.md`, `docs/reference/configuration.md`
- 신규 코드: `packages/core/src/utils/trust.ts` (+356), `packages/core/src/utils/trust.test.ts` (+207)
- **잔존 Issue #25655** SessionStart 중복: https://github.com/google-gemini/gemini-cli/issues/25655
- **Fix PR #25827 (OPEN, 미머지)**: https://github.com/google-gemini/gemini-cli/pull/25827

### 8.3 v0.40.0 Cycle 재진입 hint (본 plan 범위 외)

> v0.40.0-preview 라인 (v0.39.0 plan §11.3과 동일):
> - **MemoryManager 4-tier** (PR [#25716](https://github.com/google-gemini/gemini-cli/pull/25716))
> - **`autoMemory` rename/split** (PR [#25601](https://github.com/google-gemini/gemini-cli/pull/25601))
> - 본 plan에서 보류한 **`tools.core` PoC**도 함께 진행 (Multi-Registry 통합 설계와 결합)

---

## 9. 권장 다음 단계

| # | 단계 | 트리거 | 산출물 |
|---|------|--------|--------|
| 1 | 본 plan 사용자 검토 + 승인 | 수동 | 승인 또는 수정 요청 |
| 2 | P4 보고서 작성 (Plan Validation) | `/pdca check gemini-cli-v0.39.1-migration` | `docs/04-report/gemini-cli-v0.39.1-migration.report.md` (Plan validation 섹션) |
| 3 | Do Phase 1 (Critical Patch) | `/pdca do gemini-cli-v0.39.1-migration` | `mcp/bkit-server.js`, `bkit.config.json`, `lib/gemini/version.js` 수정 + smoke + E2E |
| 4 | Do Phase 2 (Defensive Test) | (계속) | `tests/suites/tc115-v0391-headless-trust.js` 신설 + spot 검증 결과 |
| 5 | Do Phase 3 (Trust Bootstrap UX) | (계속) | `scripts/bootstrap-trust.sh` 신설 + README 안내 |
| 6 | 최종 보고서 갱신 + 메모리 업데이트 | 수동 | `project_v0391_migration.md` 메모리, MEMORY.md 인덱스 |
| 7 | v0.40.0 stable 출시 모니터링 | 외부 트리거 | 별도 cycle 진입 (`tools.core` PoC, MemoryManager 4-tier 통합 처리) |

---

*Plan 작성 완료: 2026-04-25 | 승인 대기*
*Strategy: B' (Critical Patch + Defensive Test + Trust Bootstrap UX) — 9th Strategy B family application, Patch 핫픽스 + Critical 회귀 영구 방어 + 새 사용자 UX 회복*
*Migration target: v0.39.0 → v0.39.1 (4 commits / 27 files / 4 contributors, 사실상 Breaking 1건 hit, env 1줄 패치로 일괄 해소)*
