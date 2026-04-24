# Gemini CLI v0.38.2 변경사항 조사 보고서 (v0.38.1 → v0.38.2 증분)

> 조사일: **2026-04-20**
> 조사 범위: **v0.38.1 (2026-04-15) → v0.38.2 (2026-04-17)** (증분만)
> 선행 참조: `docs/01-plan/research/gemini-cli-v0.38.1-research.md`, `docs/01-plan/research/gemini-cli-v0.38.0-research.md`
> 조사자: gemini-researcher agent
> bkit 현재 버전: v2.0.4 (Gemini CLI v0.36.0 대상)
> 최신 stable: **v0.38.2** (npm `latest` tag, 2026-04-17 18:38 UTC)

---

## 1. 버전 개요 (Version Overview)

### 1.1 릴리스 메타데이터

| 항목 | 값 |
|------|-----|
| 버전 | **v0.38.2** |
| 릴리스 일시 | **2026-04-17 18:38 UTC** |
| 릴리스 태그 SHA | `b0ed611` (chore(release)) |
| 릴리스 담당자 (릴리스 chore 커밋) | `gemini-cli-robot` (자동 봇) |
| 원본 Author | `jwhelangoog` (Jarrod Whelan) |
| 릴리스 타입 | **Patch (stable)** |
| npm 태그 | `latest` (교체, v0.38.1 → v0.38.2) |
| 기반 브랜치 | `release/v0.38.1-pr-24974` (v0.38.1 핫픽스 브랜치) |
| 릴리스 태그 | `v0.38.2` |

### 1.2 릴리스 규모 (v0.38.1 → v0.38.2)

| 항목 | 값 |
|------|-----|
| 커밋 수 | **2** (cherry-pick 1 + release chore 1) |
| 변경 파일 수 | **16** (compare 페이지 수치; release chore 9~10 포함) |
| 실제 기능 파일 변경 | **7** (PR #24974 원본) |
| 기능 변경 규모 | +70 / -8 lines |
| 핵심 PR | [#25585](https://github.com/google-gemini/gemini-cli/pull/25585) (cherry-pick) |
| 원본 PR | [#24974](https://github.com/google-gemini/gemini-cli/pull/24974) (main에 병합, commit `14b2f35`) |
| 버그 유발 PR (참고) | [#24376](https://github.com/google-gemini/gemini-cli/pull/24376) "feat(cli): enhance tool confirmation UI and selection layout" |
| 커밋 SHA | `47c35f3` (cherry-pick), `b0ed611` (release chore) |

### 1.3 주요 테마

**"Edit/Write 도구 확인 UI에서 파일 경로 표시 복원 핫픽스" 단일 주제**.

v0.38.0 릴리스에서 병합된 PR #24376이 Tool Confirmation UI 레이아웃을 재설계하면서, `ToolConfirmationQueue.tsx`에 `!isEdit && !!tool.description` 조건문을 추가했다. 이로 인해 **Edit/WriteFile 도구의 확인 프롬프트에서 파일 경로(예: `Edit src/main.ts`)가 사라지는** UI 회귀가 발생. 사용자가 어떤 파일을 수정하는지 확인할 수 없게 되었다.

v0.38.2는 해당 조건을 `{!!tool.description}`로 단순화해 **Edit/Write 도구도 description을 항상 표시**하도록 복원한 핫픽스이다.

### 1.4 v0.38.1과의 관계

- v0.38.1: **Plan Mode silent fallback** (PR #25317 cherry-pick) — core 로직 핫픽스
- v0.38.2: **Tool Confirmation UI 파일 경로 복원** (PR #24974 cherry-pick) — UI 회귀 핫픽스
- 두 패치 모두 v0.38.0에서 이미 main에 병합된 PR을 stable 브랜치로 cherry-pick한 패턴. v0.38.0 릴리스 cut 당시 둘 다 포함되지 않아 연속 패치가 필요했다.

---

## 2. v0.38.1 → v0.38.2 사이 릴리스 히스토리

| 버전 | 날짜 (UTC) | 타입 | 주요 변경 |
|------|-----------|------|----------|
| v0.38.1 | 2026-04-15 17:56 | Stable Patch | Plan Mode silent fallback (PR #25317) |
| v0.40.0-nightly.20260415.g06e7621b2 | 2026-04-15 04:21 | Nightly | MCP error handling, plan mode, sandbox test (13 PRs) |
| **v0.38.2** | **2026-04-17 18:38** | **Stable Patch** | **Tool Confirmation 파일 경로 복원 (PR #24974)** |

> 2026-04-18 이후 main 브랜치 커밋이 6건 발생했으나(아래 §8 참조), 조사일 기준 v0.38.3 또는 v0.39.0-preview.1 태그는 **아직 릴리스되지 않음**. [GitHub Tags](https://github.com/google-gemini/gemini-cli/tags) 최상단은 v0.38.2.

---

## 3. Breaking Changes (v0.38.1 → v0.38.2 증분)

| # | 항목 | 이전 동작 | 이후 동작 | 영향 범위 | 출처 |
|---|------|-----------|-----------|-----------|------|
| — | **증분 Breaking Changes: 없음** | — | — | — | — |

### 3.1 계약 변경 확인

- `settings.json` 스키마: **변경 없음**
- `gemini-extension.json` 스키마: **변경 없음**
- MCP stdio/sse 프로토콜: **변경 없음**
- Hook 이벤트 계약 (19종): **변경 없음**
- CLI 플래그/서브커맨드: **변경 없음**
- `.gemini/` 디렉토리 레이아웃: **변경 없음**

### 3.2 UI 스냅샷 업데이트 (Breaking은 아니나 주의)

| # | 항목 | 이전 (v0.38.0/v0.38.1) | 이후 (v0.38.2) | bkit 관련성 |
|---|------|----|----|----|
| 1 | Edit/WriteFile 도구 확인 프롬프트 | 도구 이름만 표시 (예: `? Edit`) — **파일 경로 누락** | 도구 이름 + 설명 표시 (예: `? Edit packages/cli/src/nonInteractiveCli.ts`) | 🟢 **긍정적** — bkit 사용자가 어떤 파일이 수정되는지 명확히 확인 가능 |
| 2 | `ToolConfirmationQueue.test.tsx` 스냅샷 | 기존 형태 | 업데이트된 형태 (description 포함) | 영향 없음 (내부 테스트) |
| 3 | `DenseToolMessage.test.tsx` | 해당 케이스 없음 | FileDiff 결과 파일명 렌더링 테스트 추가 | 영향 없음 (내부 테스트) |

**요약**: 외부 계약/설정은 무변경이며, 엔드유저가 보는 UI만 **개선**됨. bkit 통합 관점에서 "Breaking"이 아닌 "Restorative".

### 3.3 Gemini Code Assist 리뷰 지적 (잠재 주의)

- 리뷰어가 "LLM이 생성하는 `tool.description`을 무방비로 렌더링 → 터미널 escape sequence injection 가능성" 지적. `stripUnsafeCharacters` 등 sanitization 유틸리티 사용 권장했으나 **머지 시점에 반영되지 않음**. v0.38.3 또는 v0.39.x에서 후속 강화 가능성. bkit 훅이 `systemMessage` 또는 도구 description에 ANSI escape를 포함한다면 **현재는 그대로 렌더링**됨 (§7 이슈 #25655 참조).

---

## 4. 새로운 기능 (v0.38.1 → v0.38.2 증분)

### 4.1 증분 신규 기능

| # | 기능명 | 설명 | 사용법 | bkit 활용 가능성 | 출처 |
|---|--------|------|--------|-----------------|------|
| 1 | **Edit/Write 도구 확인 UI 파일 경로 복원** (`fix(cli)`) | `ToolConfirmationQueue.tsx`의 `{!isEdit && !!tool.description}` 조건을 `{!!tool.description}`으로 단순화하여, Edit/WriteFile 도구도 description을 항상 렌더링. PR #24376의 UI 회귀를 수정 | 자동 (모든 Edit/WriteFile 확인 프롬프트에 적용). 별도 flag 없음 | 🟢 **HIGH UX** — bkit 스킬/서브에이전트가 파일 편집 시 사용자에게 정확한 파일 경로 제시. 승인 결정 품질 개선 | [PR #24974](https://github.com/google-gemini/gemini-cli/pull/24974), cherry-pick [PR #25585](https://github.com/google-gemini/gemini-cli/pull/25585), commit `14b2f35` |

> 이번 릴리스는 **엄격히 말해 "신규 기능"이 아닌 "회귀 수정"** 이다. 원본 PR이 `fix(cli): restore file path display...`로 병합되었으며, v0.38.2 릴리스 노트도 `fix(patch):` 접두어를 사용한다. 단, bkit 사용 경험 관점에서 v0.38.0부터 누락되었던 "파일 경로 시인성"이 복원되었으므로 **사용자 체감 신기능**으로 분류.

### 4.2 (참고) v0.38.1 → v0.38.2 사이 main에 merge되었으나 아직 stable에 미포함

| # | 기능 | 커밋 (main) | 예상 릴리스 | 메모 |
|---|------|------------|-------------|------|
| 1 | `feat(config): split memoryManager flag into autoMemory` | 2026-04-18 (SandyTao520) | v0.39.x | `experimentalMemoryManager` → `autoMemory` 설정 키 분리. bkit이 v0.38.x 시점에 memoryManager를 켜지 않았다면 영향 없음. [Auto Memory 문서](https://geminicli.com/docs/cli/auto-memory/) |
| 2 | `feat(core): enable topic update narration by default and promote to general` | 2026-04-17 | v0.39.x | Chapters 기능 기본값 변경 — bkit 세션 UX 변화 예상 |
| 3 | `feat(core): Disable topic updates for subagents` | 2026-04-17 | v0.39.x | bkit 서브에이전트 출력 잡음 감소 (긍정적) |
| 4 | `fix(core): fix ShellExecutionConfig spread and add ProjectRegistry save backoff` | 2026-04-17 | v0.39.x | bkit의 MCP 서버 등록 경로와 간접 관련 가능성 |

> v0.38.2에는 **위 항목들이 포함되지 않음**. 단 v0.39.x 마이그레이션 때 재조사 필요.

---

## 5. Deprecation 예고 (v0.38.1 → v0.38.2 증분)

| # | 항목 | 예고 버전 | 제거 예정 | 대응 방안 | 출처 |
|---|------|-----------|-----------|-----------|------|
| — | **증분 Deprecation 예고: 없음** | — | — | — | — |

v0.38.2는 단일 UI 핫픽스로 새 deprecation 경고를 도입하지 않는다. v0.38.0/v0.38.1에서 예고된 항목(Legacy subagent wrapping tools, `Ctrl+X` → `Ctrl+G`, `ContextManager` → `MemoryContextManager`, `keytar` 전환, `ui.loadingPhrases` 기본값 변경)은 그대로 유지된다.

> v0.39.0-preview.0에서 **Legacy subagent wrapping tools 제거**가 이미 "Breaking Changes" 항목에 공식 포함됨 ([preview release notes](https://github.com/google-gemini/gemini-cli/releases/tag/v0.39.0-preview.0) 확인). v0.39.0 stable 출시 시점 재검토 대상.

---

## 6. 설정/구성 변경 (v0.38.1 → v0.38.2 증분)

| # | 설정 항목 | 변경 유형 | 이전 | 이후 | bkit 영향 | 출처 |
|---|-----------|-----------|------|------|-----------|------|
| — | **증분 설정 변경: 없음** | — | — | — | — | — |

### 6.1 검증 완료 항목

- `settings.json` 필드: **변경 없음**
- `~/.gemini/` 디렉토리 구조: **변경 없음**
- `gemini-extension.json` 필드: **변경 없음**
- 환경변수 문법(`${VAR:-default}`): v0.38.0에서 도입, 증분 없음
- Context Engineering 6-Layer 설정(`context.memoryBoundaryMarkers`, `chapters`, `experimentalMemoryManager` 등): **변경 없음**
- `hooksConfig.showOutput`: v0.38.0 도입, 증분 없음
- Plan Mode silent fallback 내부 동작: v0.38.1에서 도입, 증분 없음

---

## 7. 버그 수정 / 패치성 변경 (bkit 관련)

### 7.1 v0.38.2에 포함된 수정

| # | 이슈/PR | 설명 | bkit 영향 | 출처 |
|---|--------|------|----------|------|
| 1 | PR [#24974](https://github.com/google-gemini/gemini-cli/pull/24974) / commit `14b2f35` | Edit/WriteFile 도구 확인 UI에서 파일 경로 표시 복원 | 🟢 **긍정적** — bkit의 파일 편집 워크플로우(스킬, 서브에이전트)에서 사용자 확인 UX 향상 | [PR #25585](https://github.com/google-gemini/gemini-cli/pull/25585) |

### 7.2 v0.38.2 릴리스 후 보고된 신규 이슈 (bkit 중요도 높음, **v0.38.2에 미포함**)

| # | 이슈 | 설명 | bkit 영향도 | 상태 | 출처 |
|---|------|------|-------------|------|------|
| 1 | [#25655](https://github.com/google-gemini/gemini-cli/issues/25655) | **SessionStart hook의 `systemMessage`가 두 번 렌더링**. `BeforeAgent`/`BeforeTool` 훅은 1회만 렌더링. ANSI escape가 리터럴로 출력되고 `"notifications": false` 플래그가 무시됨 | 🔴 **CRITICAL** — bkit의 SessionStart 훅(bkit-server 등록 메시지)이 이중 출력될 가능성. v2.0.4 회귀 테스트 필수 | Open, Windows 11 / Node 24.14.0 재현 확인. 수정 PR 없음 | — |
| 2 | [#25615](https://github.com/google-gemini/gemini-cli/issues/25615) | Windows에서 `run_shell_command("gemini '/stats model'")` 무한 UI 출력 루프 → 11M+ 문자 생성, 세션 토큰 99% 소진 | 🟡 **MEDIUM** — bkit 훅이 `run_shell_command`로 `gemini` 바이너리를 재귀 호출하는 경우 주의. 대부분의 bkit 훅은 shell 직접 호출 경로 | Open, v0.38.2 (commit b0ed611) 재현 확인 | — |
| 3 | [#25610](https://github.com/google-gemini/gemini-cli/issues/25610) | `text.response` 설정 키에서 테마 validation 에러 | 🟢 **LOW** — bkit이 `text.response`를 커스터마이징하지 않으면 무관 | Open | — |

### 7.3 v0.38.2 이후 main 브랜치 수정 (아직 태그 안됨)

| # | 커밋 메시지 | 날짜 | bkit 관련성 |
|---|------------|------|-------------|
| 1 | `fix(ui): revert preview theme on dialog unmount` | 2026-04-17 | 테마 다이얼로그 이슈 ([#25610](https://github.com/google-gemini/gemini-cli/issues/25610)?) 수정 가능성 |
| 2 | `fix(core): fix ShellExecutionConfig spread and add ProjectRegistry save backoff` | 2026-04-17 | MCP/서브프로세스 설정 안정성 — **bkit 영향 가능** |

> [#25655](https://github.com/google-gemini/gemini-cli/issues/25655)는 조사일 기준 **수정 PR 없음**. bkit v2.0.4 → v0.38.2 마이그레이션 시 **SessionStart 훅 이중 출력**이 최우선 검증 항목.

---

## 8. bkit 통합 관점 영향 분석

### 8.1 즉시 영향

| 영역 | 영향 | 설명 |
|------|------|------|
| 설정 파일 | 🟢 없음 | `settings.json`, `gemini-extension.json`, `.gemini/` 무변경 |
| Hook 계약 | 🟢 없음 | 19종 훅 이벤트 페이로드/반환 형식 무변경 |
| MCP 서버 | 🟢 없음 | bkit-server 등록/호출 프로토콜 무변경 |
| 스킬 / 서브에이전트 | 🟢 없음 | 로더 매니페스트 경로, AsyncLocalStorage 스코핑 무변경 |
| UI 체감 | 🟢 **개선** | Edit/WriteFile 확인 시 파일 경로 시각 복원 |

### 8.2 검증 필요 항목 (v0.38.2 회귀 테스트)

1. **SessionStart 훅 systemMessage 이중 출력 여부** ([#25655](https://github.com/google-gemini/gemini-cli/issues/25655))
   - bkit-server의 SessionStart 훅이 `{ systemMessage: "..." }` 반환하는 경로 확인
   - Windows/macOS/Linux에서 재현성 확인
   - 이중 출력 시 임시 회피: `BeforeAgent` 이벤트로 이관 또는 `notifications: false` (후자는 현재 무시됨)
2. **Tool Confirmation UI 스냅샷 테스트 영향**
   - bkit의 993개 테스트 스위트 중 `ToolConfirmation` 관련 스냅샷 비교 있는지 확인
   - (bkit이 Gemini CLI 내부 UI 컴포넌트를 직접 테스트하지 않으므로 대부분 무관 예상)
3. **`tool.description` 내 ANSI escape / shell injection 검증**
   - bkit 훅이나 스킬이 description 필드에 외부 입력 삽입 시 sanitization 부재 확인 (v0.38.2 현재 **무방비**)

### 8.3 마이그레이션 위험도 (v0.38.0/v0.38.1 → v0.38.2)

| 버전 전환 | 위험도 | 권장 |
|-----------|--------|------|
| v0.38.0 → v0.38.2 | **LOW** | 2개 패치 누적이지만 모두 비-계약 영역. 단번 업그레이드 가능 |
| v0.38.1 → v0.38.2 | **LOW** | 단일 UI 핫픽스, 무중단 업그레이드 가능 |
| v0.36.0 (bkit 현재) → v0.38.2 | **LOW-MEDIUM** | 선행 plan 문서(v0.38.0, v0.38.1 migration)의 target을 v0.38.2로 in-place swap 권장 |

### 8.4 권장 조치

1. **[P1] bkit 마이그레이션 플랜 target을 v0.38.2로 갱신**
   - 기존 `docs/01-plan/features/gemini-cli-v0.38.1-migration.plan.md` → target version 수정
   - 증분 변경이 UI 복원 1건이라 별도 plan 문서 신설 불필요
2. **[P1] SessionStart 훅 회귀 테스트 작성**
   - `tests/hooks/session-start-duplication.test.ts` 신설
   - 이중 출력 감지 + Windows E2E 시나리오 추가
3. **[P2] v0.39.0-preview.0 watch 유지**
   - Legacy subagent wrapping tools 제거가 breaking으로 확정
   - `autoMemory` 설정 키 도입 감시 (2026-04-18 main 커밋)
4. **[P3] 현재 태그되지 않은 main 브랜치 fix 커밋 모니터링**
   - `fix(core): fix ShellExecutionConfig spread and add ProjectRegistry save backoff` → 다음 stable에 반영 예상

---

## 9. 원문 참조 링크

### 9.1 v0.38.2 직접 참조

- **v0.38.2 릴리스 페이지**: https://github.com/google-gemini/gemini-cli/releases/tag/v0.38.2
- **v0.38.1 → v0.38.2 비교 (compare)**: https://github.com/google-gemini/gemini-cli/compare/v0.38.1...v0.38.2
- **cherry-pick PR #25585**: https://github.com/google-gemini/gemini-cli/pull/25585
- **원본 PR #24974**: https://github.com/google-gemini/gemini-cli/pull/24974
- **원본 commit `14b2f35`**: https://github.com/google-gemini/gemini-cli/commit/14b2f35
- **UI 회귀 원인 PR #24376**: https://github.com/google-gemini/gemini-cli/pull/24376
- **릴리스 chore 커밋**: `b0ed611`
- **cherry-pick merge 커밋**: `47c35f3`

### 9.2 변경된 파일 (PR #24974 — 7개)

1. `packages/cli/src/ui/components/ToolConfirmationQueue.tsx` (핵심 수정)
2. `packages/cli/src/ui/components/ToolConfirmationQueue.test.tsx`
3. `packages/cli/src/ui/components/__snapshots__/ToolConfirmationQueue-ToolConfirmationQueue-height-allocation-and-layout-should-render-the-full-queue-wrapper-with-borders-and-content-for-large-edit-diffs.snap.svg`
4. `packages/cli/src/ui/components/__snapshots__/ToolConfirmationQueue.test.tsx.snap`
5. `packages/cli/src/ui/__snapshots__/ToolConfirmationFullFrame-Full-Terminal-Tool-Confirmation-Snapshot-renders-tool-confirmation-box-in-the-frame-of-the-entire-terminal.snap.svg`
6. `packages/cli/src/ui/__snapshots__/ToolConfirmationFullFrame.test.tsx.snap`
7. `packages/cli/src/ui/components/messages/DenseToolMessage.test.tsx`

> 나머지 9개 파일은 `chore(release)` 버전 스탬프 계열(`package.json`, `package-lock.json`, 각 워크스페이스 버전) 추정.

### 9.3 bkit 관련 후속 이슈 (v0.38.2 이후 보고)

- **[#25655](https://github.com/google-gemini/gemini-cli/issues/25655)** — SessionStart hook systemMessage 이중 출력 (🔴 bkit 영향도 HIGH)
- **[#25615](https://github.com/google-gemini/gemini-cli/issues/25615)** — Windows `run_shell_command` 무한 루프
- **[#25610](https://github.com/google-gemini/gemini-cli/issues/25610)** — `text.response` 테마 validation 에러

### 9.4 커뮤니티/블로그 참조

- **Google Developer Blog**: v0.38.2 전용 게시물 **확인되지 않음** (⚠️ 미확인, 연속 패치라 미게재 가능성 높음)
- **Hacker News / Reddit r/Bard**: v0.38.2 관련 상위 스레드 **확인되지 않음** (⚠️ 미확인)
- **geminicli.com/docs/changelogs/latest/**: 조사일 기준 **v0.38.1을 latest stable로 표기** (⚠️ 문서 사이트 동기화 지연 — 외부 미러 참고 주의)
- **releasebot.io/updates/google/gemini-cli**: v0.38.2 반영 확인 완료

### 9.5 연관 bkit 문서

- `docs/01-plan/research/gemini-cli-v0.38.1-research.md` (선행 증분 조사)
- `docs/01-plan/research/gemini-cli-v0.38.0-research.md` (v0.38 베이스라인)
- `docs/01-plan/research/gemini-cli-v0.37.2-research.md`
- `docs/01-plan/features/gemini-cli-v0.38.1-migration.plan.md` (target을 v0.38.2로 업데이트 필요)
- `docs/01-plan/features/v2.1.0-context-optimization.plan.md`

---

## 10. 조사 신뢰도

| 항목 | 신뢰도 | 비고 |
|------|--------|------|
| 최신 stable 감지 (v0.38.2) | ⬛⬛⬛⬛⬛ | GitHub Releases 페이지 직접 확인, 2026-04-17 18:38 UTC. Tags 최상단 확인 |
| Breaking Changes (증분) | ⬛⬛⬛⬛⬛ | 단일 UI 컴포넌트 수정, 스키마 무영향 확정 |
| 새 기능 (증분) | ⬛⬛⬛⬛⬛ | 단일 cherry-pick, 기능 본체 PR #24974 + 회귀 원인 PR #24376 양방향 확인 |
| Deprecation (증분) | ⬛⬛⬛⬛⬛ | 없음 확정 |
| 설정 변경 (증분) | ⬛⬛⬛⬛⬛ | 없음 확정 |
| Extension/MCP/Hook 영향 | ⬛⬛⬛⬛⬛ | 계약 변경 없음 확인 |
| 변경 파일 전수 | ⬛⬛⬛⬛⬜ | 16개 중 7개 기능 파일 완전 확인, 나머지 9개는 release chore 추정 |
| 커뮤니티 반응 | ⬛⬛⬜⬜⬜ | Google Blog/HN/Reddit 전용 언급 미확인 (UI 패치 특성) |
| 후속 이슈 영향도 | ⬛⬛⬛⬛⬜ | #25655/#25615 공식 확인, 수정 PR 부재 명시 |

---

## 11. 한 눈에 보는 요약 (TL;DR)

| 카테고리 | 증분 카운트 | 비고 |
|---------|------------|------|
| 🔴 Breaking Changes | **0** | 계약 전혀 바뀌지 않음 |
| 🟢 새 기능 | **1** | Edit/WriteFile 도구 확인 파일 경로 복원 (UI 회귀 수정) |
| 🟡 Deprecation 예고 | **0** | — |
| ⚙️ 설정 변경 | **0** | — |
| 🐛 버그 수정 (주요) | **1** | PR #24376 UI 회귀 복구 |
| 🔐 보안 이슈 | **0 (확인)** | 단, `tool.description` ANSI sanitization 미구현 상태 리뷰 지적 있음 |
| 📦 의존성 변경 | **0** | package.json 버전 스탬프만 변경 |
| ⚠️ 후속 발견 이슈 (bkit 중요) | **3** | #25655 (SessionStart 훅 중복), #25615 (Windows shell 무한루프), #25610 (테마) |

### 핵심 결론

v0.38.2는 **순수 UI 핫픽스**로, bkit의 계약 계층(설정/훅/MCP/확장/스킬)에는 영향 없음. 단, 릴리스 **후** 보고된 [#25655 SessionStart 훅 systemMessage 이중 출력 이슈](https://github.com/google-gemini/gemini-cli/issues/25655)가 bkit-server의 SessionStart 메시지에 영향 가능성이 있어 **v0.38.2 업그레이드 시 우선 회귀 테스트 대상**. 마이그레이션 위험도는 LOW로, 기존 v0.38.1 migration plan의 target을 v0.38.2로 swap하는 방식이 가장 효율적.

---

*조사 종료: 2026-04-20 (v0.38.1 → v0.38.2 증분 전용 보고서)*
