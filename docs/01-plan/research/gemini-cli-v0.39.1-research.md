# Gemini CLI v0.39.1 변경사항 조사 보고서

> 베이스라인: v0.39.0 (2026-04-23)
> 대상: v0.39.1 (2026-04-24, GitHub Releases isLatest=true)
> 조사일: 2026-04-25
> 작성자: gemini-researcher 에이전트 (via /gemini-migration)

---

## 1. 버전 개요

| 항목 | 값 |
|------|-----|
| 릴리스 날짜 | **2026-04-24 02:11 UTC** (created 02:03 UTC) |
| 버전 타입 | **Patch** (v0.39.0 → v0.39.1) |
| 베이스라인 (v0.39.0) 출시 | 2026-04-23 04:12 UTC (간격 22시간) |
| 누적 커밋 수 | **4 commits** (3 PR + 1 release chore) |
| 주요 테마 | **🔒 보안 강화 단일 테마** — workspace trust 무신뢰 환경 차단 + 셸 명령 검증 강화 + 핵심 도구 allowlist 신규 |
| 릴리스 노트 본문 | (자동생성, 변경사항 인라인 텍스트 없음. compare 링크만 존재) |
| 의존성 변경 | `package-lock.json` +32/-53 (간접 audit fix, 직접 메이저 변경 없음) |

> **이상치 알림**: patch 릴리스에 `feat(cli):` / `feat(core):` 커밋 2건 포함. 명목상 patch지만 **신규 기능 + 동작 변경 포함**. 일반적 SemVer minor 수준 변경이 patch에 들어옴 — 운영 측면에선 minor로 취급해야 함.

---

## 2. Breaking Changes (🔴 Critical)

### 2.1 #1 — Headless 모드에서 미신뢰 (untrusted) 워크스페이스 실행 차단 (PR #25814)

| 항목 | 값 |
|------|-----|
| 출처 | [PR #25814](https://github.com/google-gemini/gemini-cli/pull/25814), commit `77ab9e6a`, merged 2026-04-23 16:22 UTC, +881/-489 (27 files) |
| 작성자 | Emily Hedlund (Google) |
| 분류 | **사실상 Breaking** (patch 라벨에도 동작 차단 도입) |

**이전 (v0.39.0)**:
- Headless 모드 (예: `gemini -p "..."`, CI/cron, bkit `simulate`/`gates` 러너)는 워크스페이스 trust 상태와 무관하게 즉시 실행됨.
- `.env` 파일은 trust 상태와 무관하게 로드됨.

**이후 (v0.39.1)**:
- Headless 모드에서 현재 디렉토리가 **untrusted**면 `FatalUntrustedWorkspaceError`로 즉시 차단.
- 우회 옵션 3가지:
  1. `--skip-trust` CLI 플래그
  2. `GEMINI_CLI_TRUST_WORKSPACE=true` 환경변수 (CI 권장)
  3. 인터랙티브 모드에서 디렉토리를 trust 등록 (`~/.gemini/trustedFolders.json`)
- `.env` 로딩도 untrusted 워크스페이스에서는 차단 (시크릿 보호).
- `trustedFolders.ts`는 +31/-365 라인으로 대규모 리팩터됨 — 로직이 `packages/core/src/utils/trust.ts` (신규, +356 라인) + `packages/cli/src/utils/userStartupWarnings.ts` (+26)로 분리됨.
- `core/src/index.ts`에서 trust 유틸 export 추가됨 (SDK/IDE 통합 인터페이스).

**bkit 영향도** 🔴 **HIGH**:
- `runners/baseline_runner.py`, `runners/simulate.sh`, `bkit-server` 등 **headless로 `gemini` 호출하는 모든 경로**가 v0.39.1에서 즉시 실패할 수 있음 (`Gemini CLI is not running in a trusted directory.`).
- 현재 bkit 워크스페이스가 `~/.gemini/trustedFolders.json`에 등록되지 않은 새 환경/CI에서 회귀 발생.
- **즉시 조치**: 모든 러너의 환경변수에 `GEMINI_CLI_TRUST_WORKSPACE=true` 주입 또는 호출 인자에 `--skip-trust` 추가.

---

## 3. 새로운 기능 (🟢 New)

### 3.1 `tools.core` allowlist 설정 신설 + 셸 명령 재귀 검증 (PR #25720)

| 항목 | 값 |
|------|-----|
| 출처 | [PR #25720](https://github.com/google-gemini/gemini-cli/pull/25720), commit `6e64110b`, merged 2026-04-23 20:40 UTC, +632/-88 (16 files) |
| 작성자 | Gal Zahavi (Google) |

**신규 설정 항목** (`schemas/settings.schema.json` +9, `packages/cli/src/config/settingsSchema.ts` +13):
```jsonc
{
  "tools": {
    "core": ["run_shell_command(ls)", "edit", ...]   // 신규: 빌트인 도구 allowlist (정확 매칭)
  }
}
```

- 시맨틱: `tools.allowed`와 동일한 매칭 규칙. 빌트인 도구 호출을 명시적으로 화이트리스트.
- `tools.confirmationRequired`가 **`tools.core` 및 `tools.allowed` 모두에 우선** (확인 강제).
- "Requires restart: Yes" — bkit-server runtime 재시작 필요.

**Policy Engine 셸 검증 강화** (`packages/core/src/policy/policy-engine.ts` +70/-73):
- `parseCommandDetails`가 sub-commands, command substitution (`$(...)`, backtick), subshells (`(...)`), 파이프(`|`), 리다이렉션(`>`), 체이닝(`&&`/`||`/`;`)을 **재귀적으로 분해**해 **각 부분을 정책에 대조**.
- `stripShellWrapper` 신설: `bash -c "..."`, `sh -c`, `zsh -c` 등 셸 래퍼를 재귀적으로 unwrap.
- 신규 회귀 테스트 3개:
  - `core-tools-mapping.test.ts` (+76)
  - `shell-safety-regression.test.ts` (+134)
  - `shell-substitution.test.ts` (+97)

**bkit 활용 가능성** 🟡 **MEDIUM-HIGH**:
- `tools.core` 신설로 bkit이 **더 좁은 허용 리스트** 운영 가능. 기존 `tools.allowed`로 셸 명령만 허용하는 구조에 빌트인 도구 단위 통제 추가.
- **회귀 위험**: 기존 bkit 정책이 `bash -c '<cmd>'` 형태로 우회 허용했던 케이스가 새 검증에서 차단될 수 있음. 모든 정책 규칙에 대해 v0.39.1 환경 회귀 테스트 필수.
- 기존 `run_shell_command("$(...)")` 또는 `run_shell_command("ls | grep ...")` 사용 시 검증 로직 강화로 거부될 가능성.

---

## 4. Bug Fixes / Documentation

### 4.1 PR #25874 — `FatalUntrustedWorkspaceError` 메시지에 docs 링크 추가

| 항목 | 값 |
|------|-----|
| 출처 | [PR #25874](https://github.com/google-gemini/gemini-cli/pull/25874), commit `3d0536a6`, merged 2026-04-23 23:39 UTC, +7/-1 (2 files) |
| 분류 | Doc/UX (Followup to #25814) |

- `userStartupWarnings.ts`의 에러 메시지에 `docs/cli/trusted-folders.md` 링크 추가.
- bkit 영향 없음 (문구 변경만).

---

## 5. Deprecation 예고

**없음** — v0.39.1 patch에는 신규 deprecation 없음.

> 참고: v0.39.0에서 진행된 legacy subagent 제거(#25053)는 v0.39.1에서도 유지됨 (별도 변경 없음).

---

## 6. 설정/구성 변경 (델타)

| # | 설정/환경변수 | 변경 유형 | 이전 (v0.39.0) | v0.39.1 | bkit 영향 |
|---|--------------|----------|---------------|---------|-----------|
| 1 | `tools.core` (settings) | **신규 추가** | 미존재 | array, 빌트인 도구 allowlist | 🟡 정책 재검토 권장 |
| 2 | `--skip-trust` (CLI 플래그) | **신규 추가** | 미존재 | headless trust check 우회 | 🔴 러너 호출에 추가 필요 가능 |
| 3 | `GEMINI_CLI_TRUST_WORKSPACE` (env) | **신규 추가** | 미존재 | `true` 시 trust check 우회 | 🔴 CI/headless에서 필수 |
| 4 | `~/.gemini/trustedFolders.json` (저장소) | 동작 변경 | 인터랙티브에서만 의미 | **headless 진입 게이트로 활용** | 🔴 bkit 워크스페이스 사전 등록 필요 |
| 5 | `.env` 로딩 정책 | 동작 변경 | 무조건 로드 | **untrusted 워크스페이스에서 차단** | 🟡 `.env` 의존 bkit 컴포넌트 회귀 |
| 6 | `packages/core/src/index.ts` | export 추가 | trust 유틸 비export | trust 유틸 export | 🟢 SDK 통합 시 활용 가능 |

---

## 7. v0.40.0 시그널 (참고)

본 조사 범위 외이지만 v0.39.1과 동시에 main 브랜치에서 진행 중인 v0.40.0-preview 라인은 v0.39.0 보고서 §10 기록과 동일:
- **MemoryManager 4-tier** (#25716) — v0.40.0 예정
- **`autoMemory` rename/split** (#25601) — v0.40.0 예정

v0.39.1에는 위 두 항목 미포함 확인.

---

## 8. SessionStart 중복 버그 (#25655) 상태 갱신

- **이슈 #25655**: 여전히 **OPEN**. closed_at = null.
- **수정 PR #25827**: 여전히 **OPEN, 미머지**.
- **결론**: v0.39.1에서도 **잔존**. bkit-server SessionStart 메시지 이중 렌더링 회귀 가능성 v0.39.0과 동일하게 유지.

---

## 9. 원문 참조 링크

- Release: https://github.com/google-gemini/gemini-cli/releases/tag/v0.39.1
- Compare: https://github.com/google-gemini/gemini-cli/compare/v0.39.0...v0.39.1
- PR #25814 (.env + headless trust, BREAKING): https://github.com/google-gemini/gemini-cli/pull/25814
- PR #25720 (tools.core + shell validation): https://github.com/google-gemini/gemini-cli/pull/25720
- PR #25874 (error message doc link): https://github.com/google-gemini/gemini-cli/pull/25874
- 신규 docs: `docs/cli/trusted-folders.md` (+24/+4 lines, 2 PR 합산)
- 신규 docs: `docs/reference/configuration.md` (+8 from #25814, +6 from #25720)
- 신규 코드: `packages/core/src/utils/trust.ts` (+356), `packages/core/src/utils/trust.test.ts` (+207)

---

## 10. bkit 영향 Top 3

### #1 🔴 CRITICAL — Headless 모드 trust enforcement (PR #25814)
- **영향**: 모든 bkit 러너/CI/bkit-server에서 `gemini -p` 호출이 untrusted 디렉토리에서 즉시 차단됨
- **조치**: `GEMINI_CLI_TRUST_WORKSPACE=true` env 추가 또는 `--skip-trust` 플래그를 모든 호출 경로에 일괄 적용

### #2 🟡 MEDIUM-HIGH — 셸 명령 재귀 검증 강화 (PR #25720)
- **영향**: 기존 `run_shell_command("...$(subshell)...")`, `bash -c "..."`, 파이프/리다이렉션 사용하는 정책 규칙이 차단될 수 있음
- **조치**: bkit 정책 시뮬레이터에서 v0.39.1 환경으로 baseline runner 회귀, 거부된 명령 식별 후 정책 재작성

### #3 🟡 MEDIUM — `.env` 로딩 차단 + `tools.core` 신규 (PR #25814 + #25720)
- **영향**: `.env`로 bkit 비밀값/구성 주입하는 경로가 untrusted 워크스페이스에서 작동 안함; `tools.core`로 더 정밀한 빌트인 도구 통제 가능
- **조치**: bkit 워크스페이스를 trustedFolders에 사전 등록하는 부트스트랩 스크립트, `tools.core` 도입 PoC

---

## 11. 요약

**변경 4건**: Breaking 1 / Feature 1 / Fix(doc) 1 / Release chore 1.

**Top 3 영향**:
1. 🔴 Headless trust enforcement (#25814) — 모든 러너에 `GEMINI_CLI_TRUST_WORKSPACE=true` 또는 `--skip-trust` 필수
2. 🟡 셸 재귀 검증 + `tools.core` 신규 (#25720) — 정책 회귀 테스트 필수
3. 🟡 `.env` 로딩 untrusted 차단 — bkit 부트스트랩 스크립트 필요

**잔존 이슈**: #25655 SessionStart 중복 버그 v0.39.1에서도 미해결 (PR #25827 OPEN 상태).
