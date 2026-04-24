# Gemini CLI v0.38.2 이후 변경사항 조사 보고서 (Post-v0.38.2 Landscape)

> ⚠️ **2026-04-23 부분 무효화 (SUPERSEDED)** — 이 문서는 2026-04-22 시점 스냅샷이다. 다음 날(2026-04-23) v0.39.0 stable, v0.40.0-preview.2, v0.41.0-nightly가 동시 출시되었다. **최신 stable target 결정과 Breaking Changes는 다음 문서를 우선 참조하라**:
> - `docs/01-plan/research/gemini-cli-v0.39.0-research.md` (신규 stable target — v0.39.0)
> - `docs/01-plan/research/gemini-cli-v0.40.0-preview-research.md` (다음 stable 예고 — 메모리 4-tier 등)
>
> 본 문서의 §4 "v0.39.0 예고 변경사항"은 일부 부정확 (메모리 4-tier와 autoMemory split은 v0.39.0이 아닌 v0.40.0으로 미뤄짐). v0.39.0 release notes 직접 확인 결과 §4.1 표의 항목 1(legacy subagent 제거)만 v0.39.0에 포함, 항목 2~3은 v0.40.0 영역.

---

> 조사일: **2026-04-22**
> 조사 범위: **v0.38.2 (2026-04-17 18:38 UTC) → 오늘 (2026-04-22)**
> 선행 참조: `docs/01-plan/research/gemini-cli-v0.38.2-research.md`
> 조사자: gemini-researcher agent
> bkit 현재 버전: v2.0.4 (Gemini CLI v0.36.0 대상)
> 최신 stable: **v0.38.2** (npm `latest` 태그, 2026-04-17 — 변동 없음 ← **2026-04-23 무효화**)
> 최신 preview: **v0.39.0-preview.2** (2026-04-22 00:45 UTC ← **2026-04-23 v0.40.0-preview.2로 갱신됨**)

---

## 0. 한 눈에 보는 결론 (TL;DR)

**v0.38.2 이후 새로운 stable 릴리스는 없다.** 마이그레이션 target으로 선정할 수 있는 새 stable 버전이 존재하지 않으며, bkit의 "v0.38.2 기반 마이그레이션 플랜"은 여전히 유효하다.

단, 다음 2건의 v0.39.0 preview 태그가 출시되었고, 이는 **다음 minor stable(v0.39.0)의 모양을 예고**한다:

| 항목 | 값 |
|------|-----|
| 최신 stable (target 후보) | **v0.38.2** (변동 없음) |
| 최신 preview | **v0.39.0-preview.2** (2026-04-22 00:45 UTC) |
| v0.38.2 이후 stable 태그 | **0건** |
| v0.38.2 이후 preview 태그 | **2건** (v0.39.0-preview.1, v0.39.0-preview.2) |
| v0.38.2 이후 main 커밋 | **15+건** (2026-04-17 ~ 2026-04-22) |

### 이 보고서의 사용 방식

1. **bkit 즉시 마이그레이션 target**: `v0.38.2` (변동 없음) — 기존 `docs/01-plan/features/gemini-cli-v0.38.2-migration.plan.md` 그대로 진행
2. **선제 대비**: v0.39.0 stable 출시에 대비해 아래 §4 "v0.39.0 예고 변경사항"을 bkit 설계에 반영
3. **회귀 모니터링**: §5 "main 브랜치 수정 사항"은 v0.38.3 핫픽스 또는 v0.39.0 stable에 반영될 예정

---

## 1. 버전 타임라인 (v0.38.2 → 오늘)

| 날짜 (UTC) | 태그 | 타입 | 주요 변경 |
|-----------|------|------|----------|
| 2026-04-17 18:38 | **v0.38.2** | Stable Patch | Edit/Write 도구 확인 UI 파일 경로 복원 (선행 조사 완료) |
| 2026-04-18 | (태그 없음) | main commit | `feat(config): split memoryManager flag into autoMemory` (#25601) |
| 2026-04-20 ~ 21 | (태그 없음) | main commits | `/new` alias, 테마 다이얼로그 수정, ACP auto memory, 중복 initialize 제거 등 9건 |
| 2026-04-21 22:52 | **v0.39.0-preview.1** | Pre-release | Plan Mode 중첩 경로 정책 핫픽스 (cherry-pick `a4e98c0`, PR #25138) |
| 2026-04-22 00:45 | **v0.39.0-preview.2** | Pre-release | A2A 활동 추적/구성 관리 리팩터 (cherry-pick `d6f88f8`) |
| 2026-04-22 | (태그 없음) | main commit | `refactor(memory): replace MemoryManagerAgent with prompt-driven memory editing across four tiers` (#25716) |

> **관찰**: 2026-04-14 (v0.39.0-preview.0) 이후 preview만 3회 연속 cherry-pick 패치되고 있다. v0.39.0 stable cut은 아직 이루어지지 않았으며, 적어도 1~2회 추가 preview가 예상된다.

---

## 2. v0.38.2 이후 릴리스별 상세

### 2.1 v0.39.0-preview.1 (2026-04-21 22:52 UTC)

| 항목 | 값 |
|------|-----|
| 릴리스 SHA | `5cdce61e8fee3ab8a78083ae201cf3eaa7dcf4dc` |
| 기반 | `release/v0.39.0-preview.0-pr-25138` |
| 타입 | **Pre-release (preview patch)** |
| 커밋 수 | 2 (cherry-pick 1 + release chore 1) |
| 핵심 PR | [#25766](https://github.com/google-gemini/gemini-cli/pull/25766) (cherry-pick) |
| 원본 커밋 | `a4e98c0` (원본 PR [#25138](https://github.com/google-gemini/gemini-cli/pull/25138)) |

**주제**: *"Nested plan directory duplication and relative path policies"* 수정.

**세부 내용**:
- **Plan Mode 중첩 디렉토리 지원**: Plan Mode에서 서브디렉토리 구조가 있을 때 경로가 중복되는 버그 수정
- **상대 경로 정책 도입**: EditTool/WriteFileTool이 시스템 프롬프트에서 **절대 경로 → 상대 경로**로 전환
- **경로 검증 강화**: 비인가 접근 방지용 path resolution 추가

**변경 파일**:
- `packages/core/src/tools/edit.ts` (EditTool 경로 해석)
- `packages/core/src/tools/write-file.ts` (WriteFileTool 경로 해석)
- 시스템 프롬프트 (상대 경로 사용 지시)
- 테스트 (중첩 경로 케이스)

**보안 주의사항** (Gemini Code Assist 리뷰어 지적):
- 검증 실패 시 raw file path로 fallback하는 로직이 **Plan Mode 제약을 우회할 수 있다**는 우려. 리뷰어가 approve했으나 후속 강화 가능성.

**bkit 영향**:
- 🟡 **MEDIUM** — bkit 스킬/서브에이전트가 절대 경로를 기대하는 시스템 프롬프트를 사용 중이면 동작 변경 가능. v0.39.0 stable 진입 시 `bkit-server`의 EditTool/WriteFileTool 호출 경로 정책 재검증 필요.
- 🟢 긍정: Plan Mode 중첩 경로 중복 버그가 해소되면 bkit Plan Mode 워크플로우 안정성 향상.

---

### 2.2 v0.39.0-preview.2 (2026-04-22 00:45 UTC)

| 항목 | 값 |
|------|-----|
| 타입 | **Pre-release (preview patch)** |
| 커밋 수 | 2 (cherry-pick 1 + release chore 1) |
| 핵심 PR | [#25776](https://github.com/google-gemini/gemini-cli/pull/25776) (cherry-pick) |
| 원본 커밋 | `d6f88f8` |

**주제**: A2A (Agent-to-Agent) 활동 추적 및 구성 관리 리팩터.

**세부 내용**:
- **A2AResultReassembler 업데이트**:
  - Activity items에 message logs 포함
  - 관련 없는 메시지 필터링
  - `toActivityItems()` 메서드가 빈/중복 인증 메시지 제거, "Working..." 표시 유지
- **Configuration 리팩터**:
  - `private onAgentsRefreshed` 메서드 제거
  - 테스트를 public `reload` 메서드로 전환

**변경 파일**:
- `packages/core/src/agents/a2aUtils.ts`
- `packages/core/src/agents/a2aUtils.test.ts`

**머지 시점**: 2026-04-21, 29개 체크 중 28개 통과.

**bkit 영향**:
- 🟢 **LOW-MEDIUM** — bkit의 서브에이전트 호출 흐름이 A2A 프로토콜을 간접 사용하면 활동 UI 표시가 개선됨. 계약 변경 없음.
- 🟡 **주의**: `onAgentsRefreshed` 제거는 내부 API 변경. bkit이 private 메서드를 참조하지 않으므로 직접 영향은 없으나, v0.39.0 stable 진입 시 agent reload 로직 재검증 권장.

---

## 3. v0.38.2 → 오늘 (2026-04-22) 사이 main 브랜치 커밋

태그되지 않았으나 차기 stable/preview에 반영될 커밋들을 **bkit 영향도 순**으로 정리.

### 3.1 🔴 HIGH 영향 가능성

| # | 커밋/PR | 날짜 | 저자 | 설명 |
|---|---------|------|------|------|
| 1 | `refactor(memory): replace MemoryManagerAgent with prompt-driven memory editing across four tiers` (#25716) | 2026-04-22 | SandyTao520 | **메모리 관리 시스템 대규모 리팩터**. Agent 기반 메모리 편집을 **프롬프트 기반 4-tier 구조**로 교체. bkit v2.1.0 context-optimization 설계와 직접 충돌 가능성 |
| 2 | `feat(config): split memoryManager flag into autoMemory` (#25601) | 2026-04-18 | SandyTao520 | `experimentalMemoryManager` → `autoMemory` 설정 키 분리 (v0.38.2 연구 §4.2에서 예고된 커밋 확정) |
| 3 | `fix(cli): start auto memory in ACP sessions` (#25626) | 2026-04-21 | jasonmatthewsuhari | ACP 세션에서 auto memory 초기화 수정. bkit ACP 경로 의존 시 회귀 테스트 필요 |
| 4 | `fix(core): remove duplicate initialize call on agents refreshed` (#25670) | 2026-04-21 | adamfweidman | Agent reload 중복 초기화 제거. bkit 서브에이전트 hot-reload 경로에 영향 가능 |

### 3.2 🟡 MEDIUM 영향 가능성

| # | 커밋/PR | 날짜 | 저자 | 설명 |
|---|---------|------|------|------|
| 5 | `feat: add /new as alias for /clear and refine command description` (#17865) | 2026-04-21 | ved015 | `/new` 슬래시 커맨드를 `/clear` 별칭으로 추가. bkit 슬래시 커맨드 파싱/훅에 별칭 인식 필요 시 회귀 검토 |
| 6 | `feat: detect new files in @ recommendations with watcher-based updates` (#25256) | 2026-04-21 | prassamin | `@` 파일 참조 자동완성이 watcher 기반으로 전환. bkit 파일 감시 충돌 가능성 확인 필요 |
| 7 | `fix(cli): use newline in shell command wrapping to avoid breaking heredocs` (#25537) | 2026-04-21 | cocosheng-g | 셸 명령 래핑에서 heredoc 보존. bkit 훅이 heredoc을 이용한 셸 호출을 할 경우 긍정적 영향 |
| 8 | `fix(core): disable detached mode in Bun to prevent immediate SIGHUP` (#22620) | 2026-04-21 | euxaristia | Bun 런타임에서 detached 모드 비활성화. bkit이 Bun을 지원 대상으로 고려하면 관련 |
| 9 | `feat(cli): add streamlined gemini gemma local model setup` (#25498) | 2026-04-20 | 복수 | 로컬 gemma 모델 지원 UX 개선. bkit BeforeModel 훅에서 로컬 모델 선택 지원 시 관련 |

### 3.3 🟢 LOW 영향

| # | 커밋/PR | 날짜 | 저자 | 설명 |
|---|---------|------|------|------|
| 10 | `test(e2e): default integration tests to Flash Preview` (#25753) | 2026-04-21 | SandyTao520 | Gemini CLI 자체 E2E 테스트 기본 모델 변경. bkit 테스트 영향 없음 |
| 11 | `fix(cli): ensure theme dialog labels are rendered for all themes` (#24599) | 2026-04-21 | 복수 | 테마 다이얼로그 레이블 렌더링 수정 ([#25610](https://github.com/google-gemini/gemini-cli/issues/25610) 관련 가능성) |
| 12 | `fix(cli): round slow render latency to avoid opentelemetry float warning` (#25709) | 2026-04-20 | scidomino | OpenTelemetry 경고 억제. bkit 무관 |
| 13 | `docs(cli): fix system.md casing inconsistencies` (#25414) | 2026-04-20 | 복수 | 문서 수정 |
| 14 | `docs(tracker): introduce experimental task tracker feature` (#24556) | 2026-04-20 | anj-s | **실험적 task tracker 기능 문서 공개**. bkit tasks/plan 모듈과 기능 중복 가능성 모니터링 |

### 3.4 v0.38.2 직후(04-17) 태그되지 않은 잔여 커밋 (이미 v0.38.2 연구에서 언급)

| # | 커밋/PR | 날짜 | 설명 |
|---|---------|------|------|
| 15 | `feat(core): enable topic update narration by default and promote to general` (#25586) | 2026-04-17 | Chapters 기능 narration 기본 ON (behavior change) |
| 16 | `feat(core): disable topic updates for subagents` (#25567) | 2026-04-17 | 서브에이전트 topic narration OFF (노이즈 감소) |
| 17 | `fix(core): fix ShellExecutionConfig spread and add ProjectRegistry save backoff` (#25382) | 2026-04-17 | MCP 서버 등록 경로 안정성 |

---

## 4. v0.39.0 stable 예고 변경사항 (선제 대비 요약)

v0.39.0-preview.0 (2026-04-14) 및 후속 patch 기준 **v0.39.0 stable 출시 시 bkit에 적용될 주요 변경**:

### 4.1 🔴 Breaking Changes (예고)

| # | 항목 | 영향 | 출처 |
|---|------|------|------|
| 1 | **Legacy subagent wrapping tools 제거** | bkit이 구 subagent 래핑 API를 사용 중이면 호출 실패. `invoke_subagent` 단일 API로 이관 필요 | [v0.39.0-preview.0 release notes](https://github.com/google-gemini/gemini-cli/releases/tag/v0.39.0-preview.0) |
| 2 | Subagent 도구 통합 (`invoke_subagent` 단일화) | bkit 서브에이전트 호출 코드 전수 검토. 하위 호환성 제공 여부 확인 필요 | 동일 |
| 3 | MemoryManagerAgent → 프롬프트 기반 4-tier 메모리 (#25716, main 04-22) | bkit v2.1.0 context-optimization 설계 재검토 필수 | [PR #25716](https://github.com/google-gemini/gemini-cli/pull/25716) |

### 4.2 🟢 새 기능 (예고)

| # | 기능 | bkit 활용 |
|---|------|----------|
| 1 | `/memory inbox` 커맨드 — 추출된 스킬 리뷰 | bkit 스킬 라이프사이클 통합 가능 |
| 2 | **Skill patching 지원** | bkit 스킬 업데이트 UX 개선 기회 |
| 3 | JSONL 스트리밍 채팅 기록 (binary→JSONL) | bkit 세션 로그 파싱 간소화 |
| 4 | **ContextManager + Sidecar 디커플드 아키텍처** | bkit v2.1.0 context-optimization과 정렬/충돌 동시 분석 필요 |
| 5 | **Tool-controlled display protocol** (Steps 2-3) | bkit 도구 출력 포맷 제어 기회 (hooksConfig.showOutput 확장 가능성) |
| 6 | `useAgentStream` 훅 — 커스텀 스트림 처리 | bkit UI 통합 옵션 |
| 7 | **MCP auth 블록 지원** (server config) | bkit-server 인증 구성 강화 기회 |
| 8 | Plan Mode 사용자 확인 + skill 활성화 게이트 | bkit 안전성 강화 |
| 9 | `/new` (= `/clear` alias) | bkit 슬래시 커맨드 훅 확장 |
| 10 | `@` 파일 추천 watcher 기반 업데이트 | bkit 파일 감시 충돌 검증 필요 |
| 11 | `autoMemory` 설정 키 (memoryManager flag 분리) | bkit 설정 스키마 업데이트 필요 |

### 4.3 🟡 안정성/성능

- 복수의 memory leak 수정
- PTY exhaustion 수정
- Sandbox 최적화

---

## 5. bkit 관련 후속 이슈 추적 (v0.38.2 이후 오픈)

v0.38.2 연구 §7.2에서 식별한 이슈의 **현재 상태** (2026-04-22 기준):

| # | 이슈 | 상태 변화 | bkit 영향도 |
|---|------|----------|-------------|
| 1 | [#25655](https://github.com/google-gemini/gemini-cli/issues/25655) SessionStart 훅 systemMessage 중복 | ⚠️ **미확인** (조사일 기준 수정 PR 병합 확인 안됨) | 🔴 **CRITICAL** — v0.38.2 및 v0.39.0-preview.* 모두 영향 |
| 2 | [#25615](https://github.com/google-gemini/gemini-cli/issues/25615) Windows `run_shell_command("gemini ...")` 무한 루프 | ⚠️ **미확인** | 🟡 MEDIUM |
| 3 | [#25610](https://github.com/google-gemini/gemini-cli/issues/25610) `text.response` 테마 validation | ⚠️ **미확인** (PR #24599 `fix(cli): ensure theme dialog labels are rendered for all themes`가 관련일 수 있으나 동일 이슈 확정 불가) | 🟢 LOW |

> **조사 한계**: 이슈 현재 상태(open/closed, 수정 PR 링크)를 웹 페이지 로드 실패로 직접 확인하지 못했다. bkit 마이그레이션 시 GitHub에서 직접 재확인 권장.

---

## 6. Breaking Changes / 새 기능 / Deprecation 카운트

### 6.1 v0.38.2 → 오늘 (2026-04-22) **stable 증분**

| 카테고리 | 카운트 | 비고 |
|---------|--------|------|
| 🔴 Breaking Changes | **0** | 새 stable 태그가 없으므로 증분 0 |
| 🟢 새 기능 | **0** | 동일 |
| 🟡 Deprecation | **0** | 동일 |
| ⚙️ 설정 변경 | **0** | 동일 |

### 6.2 v0.38.2 → v0.39.0-preview.2 **preview 증분**

| 카테고리 | 카운트 | 비고 |
|---------|--------|------|
| 🔴 Breaking Changes (preview 한정) | **0** (v0.39.0-preview.0 대비) | preview.1, preview.2는 모두 cherry-pick 패치 |
| 🟢 새 기능 (preview 한정) | **2** (Plan Mode 상대 경로, A2A 활동 필터링) | |
| 🟡 Deprecation | **0** (preview 내 신규) | v0.39.0-preview.0 시점의 legacy subagent 제거는 이미 예고 |
| ⚙️ 설정 변경 | **0** (preview 내 신규) | |

### 6.3 v0.39.0 stable **예상 증분** (v0.38.2 → v0.39.0 가정)

| 카테고리 | 예상 카운트 | 근거 |
|---------|------------|------|
| 🔴 Breaking Changes | **2~3** | Legacy subagent 제거, invoke_subagent 통합, MemoryManagerAgent 리팩터 |
| 🟢 새 기능 | **10+** | §4.2 표 참조 |
| 🟡 Deprecation | **1+** | MemoryManager 관련 구 플래그 |
| ⚙️ 설정 변경 | **2+** | `autoMemory` 분리, MCP auth 블록 |

---

## 7. bkit 영향 가능성 상위 5개

### 7.1 #1 🔴 CRITICAL — MemoryManagerAgent → 프롬프트 기반 4-tier 리팩터 (#25716)

- **출처**: main commit 2026-04-22, [PR #25716](https://github.com/google-gemini/gemini-cli/pull/25716)
- **영향**: bkit v2.1.0 context-optimization 플랜 (`docs/01-plan/features/v2.1.0-context-optimization.plan.md`)이 MemoryManagerAgent 기반 모델을 전제로 설계되어 있다면, 프롬프트 기반 4-tier로 재설계 필요
- **조치**: v0.39.0 stable 출시 전까지 **v2.1.0 설계 재검토 미팅 필수**. 4-tier 구조 파악 후 bkit 6-Layer context engineering과 정합성 검증

### 7.2 #2 🔴 CRITICAL — Legacy subagent wrapping tools 제거 (v0.39.0 stable)

- **출처**: [v0.39.0-preview.0 release notes](https://github.com/google-gemini/gemini-cli/releases/tag/v0.39.0-preview.0)
- **영향**: bkit 서브에이전트 래핑 코드가 구 API를 사용 중이면 v0.39.0 업그레이드 시 **즉시 동작 중단**
- **조치**: bkit 코드베이스에서 `invoke_subagent`로의 이관 완료 여부 사전 감사

### 7.3 #3 🔴 HIGH — `autoMemory` 설정 키 분리 (#25601)

- **출처**: main commit 2026-04-18, [PR #25601](https://github.com/google-gemini/gemini-cli/pull/25601)
- **영향**: `experimentalMemoryManager` 플래그를 설정/문서화한 경우 `autoMemory`로 rename 필요. bkit v2.0.4는 기본값 유지로 직접 영향 없음 예상이나, bkit 설정 스키마 검증기가 엄격 모드면 알 수 없는 키 경고 가능
- **조치**: `packages/bkit-*`의 settings 스키마 validator 보강. v0.39.0 출시 시 점진적 마이그레이션 경로 제공

### 7.4 #4 🔴 HIGH — #25655 SessionStart 훅 systemMessage 중복 (미해결)

- **출처**: [Issue #25655](https://github.com/google-gemini/gemini-cli/issues/25655)
- **영향**: bkit-server의 SessionStart 훅 메시지가 v0.38.2 및 v0.39.0-preview.* 모두에서 **이중 출력**될 가능성. ANSI escape 리터럴 렌더링, `notifications: false` 무시
- **조치**:
  1. bkit v2.0.4 → v0.38.2 마이그레이션 E2E 테스트에 SessionStart 중복 검증 케이스 추가
  2. 임시 회피: 중복을 전제로 하는 메시지 설계 또는 BeforeAgent 이벤트 전환 검토
  3. v0.39.0 stable 출시 시 수정 포함 여부 우선 확인

### 7.5 #5 🟡 MEDIUM — Tool-controlled display protocol (v0.39.0 예고)

- **출처**: v0.39.0-preview.0 release notes
- **영향**: bkit hooksConfig.showOutput 동작이 tool-controlled display protocol과 상호작용 방식 변경 가능. 도구 출력 포맷 제어 권한이 도구 측으로 이동
- **조치**: v0.39.0 stable 출시 후 bkit 훅 출력 렌더링 회귀 테스트. 긍정적 기회: bkit이 도구 출력 포맷을 세밀하게 제어하는 API 활용 가능성

---

## 8. 원문 참조 링크

### 8.1 GitHub Releases

- [v0.38.2 (latest stable)](https://github.com/google-gemini/gemini-cli/releases/tag/v0.38.2) — 2026-04-17 18:38 UTC
- [v0.39.0-preview.1](https://github.com/google-gemini/gemini-cli/releases/tag/v0.39.0-preview.1) — 2026-04-21 22:52 UTC
- [v0.39.0-preview.2](https://github.com/google-gemini/gemini-cli/releases/tag/v0.39.0-preview.2) — 2026-04-22 00:45 UTC
- [v0.39.0-preview.0 (baseline)](https://github.com/google-gemini/gemini-cli/releases/tag/v0.39.0-preview.0) — 2026-04-14

### 8.2 주요 PR / 커밋

- [PR #25766](https://github.com/google-gemini/gemini-cli/pull/25766) — v0.39.0-preview.1 cherry-pick
- [PR #25776](https://github.com/google-gemini/gemini-cli/pull/25776) — v0.39.0-preview.2 cherry-pick
- [PR #25138](https://github.com/google-gemini/gemini-cli/pull/25138) — Plan Mode 중첩 경로 (원본)
- [PR #25716](https://github.com/google-gemini/gemini-cli/pull/25716) — MemoryManagerAgent 리팩터 (main, 04-22)
- [PR #25601](https://github.com/google-gemini/gemini-cli/pull/25601) — `autoMemory` 분리 (main, 04-18)
- [PR #25626](https://github.com/google-gemini/gemini-cli/pull/25626) — ACP auto memory 시작 (main, 04-21)
- [PR #25670](https://github.com/google-gemini/gemini-cli/pull/25670) — agent refresh 중복 initialize 제거 (main, 04-21)

### 8.3 관련 이슈 (bkit 관점)

- [Issue #25655](https://github.com/google-gemini/gemini-cli/issues/25655) — SessionStart 훅 systemMessage 중복 (🔴 HIGH)
- [Issue #25615](https://github.com/google-gemini/gemini-cli/issues/25615) — Windows `run_shell_command` 무한 루프
- [Issue #25610](https://github.com/google-gemini/gemini-cli/issues/25610) — text.response 테마 validation

### 8.4 연관 bkit 연구 문서

- `docs/01-plan/research/gemini-cli-v0.38.2-research.md` (2026-04-20, 선행 v0.38.1 → v0.38.2 증분)
- `docs/01-plan/research/gemini-cli-v0.38.1-research.md`
- `docs/01-plan/research/gemini-cli-v0.38.0-research.md`
- `docs/01-plan/research/gemini-cli-v0.37.2-research.md`
- `docs/01-plan/research/gemini-cli-v0.37.1-research.md`

### 8.5 연관 bkit 플랜 문서

- `docs/01-plan/features/gemini-cli-v0.38.2-migration.plan.md` (현재 target, 변경 없음)
- `docs/01-plan/features/v2.1.0-context-optimization.plan.md` (MemoryManagerAgent 리팩터 영향 재검토 필요)

---

## 9. 조사 신뢰도

| 항목 | 신뢰도 | 비고 |
|------|--------|------|
| 최신 stable 재확인 (v0.38.2 유지) | ⬛⬛⬛⬛⬛ | GitHub Tags/Releases 이중 확인 |
| v0.39.0-preview.1 / .2 메타데이터 | ⬛⬛⬛⬛⬛ | 릴리스 페이지 직접 확인 |
| v0.39.0-preview.1 기능 세부 | ⬛⬛⬛⬛⬜ | PR #25766 + 원본 PR #25138 요약 확인, raw 변경 파일 일부 추정 |
| v0.39.0-preview.2 기능 세부 | ⬛⬛⬛⬛⬜ | PR #25776 요약 확인 |
| v0.38.2 → 오늘 main commits | ⬛⬛⬛⬛⬜ | commits/main 페이지 기반 15+건 나열, 일부 PR 본문 미확인 |
| v0.39.0 stable 예고 변경 | ⬛⬛⬛⬜⬜ | preview.0 release notes 기반, 최종 stable에서 범위 변동 가능 |
| #25655 / #25615 / #25610 현재 상태 | ⬛⬛⬜⬜⬜ | 이슈 검색 페이지 로드 실패, v0.38.2 연구 시점 상태 전제 |
| 커뮤니티 반응 (블로그/HN/Reddit) | ⬛⬛⬜⬜⬜ | preview 특성상 전용 언급 적음 |

---

## 10. 권장 조치 (bkit 팀)

### 10.1 즉시 (P1)

1. **bkit 마이그레이션 target 유지**: v0.38.2 (변동 없음). 기존 `gemini-cli-v0.38.2-migration.plan.md` 그대로 진행
2. **#25655 SessionStart 훅 중복 E2E 회귀 테스트 신설**: v2.0.4 → v0.38.2 수용 기준에 포함
3. **v0.39.0 stable 대비 사전 감사 착수**:
   - Legacy subagent wrapping 사용 여부 코드베이스 전수 조사
   - MemoryManager 관련 설정 키 사용 여부 확인

### 10.2 단기 (P2, v0.39.0 stable 출시 전)

4. **v2.1.0 context-optimization 플랜 재검토**: MemoryManagerAgent → 프롬프트 기반 4-tier 리팩터 (#25716) 반영
5. **`autoMemory` 설정 스키마 대응**: bkit 설정 validator 업데이트 (experimentalMemoryManager ↔ autoMemory 호환)
6. **MCP auth 블록 도입 평가**: bkit-server 보안 강화 기회

### 10.3 모니터링 (P3)

7. v0.38.3 핫픽스 출시 여부 — 4월 말 ~ 5월 초 예상
8. v0.39.0-preview.3+ 추가 cherry-pick 모니터링
9. Tool-controlled display protocol Steps 2-3 구체화 동향
10. `@` 파일 추천 watcher 기반 업데이트 (#25256) vs bkit 파일 감시 충돌 가능성

---

*조사 종료: 2026-04-22. v0.38.2 이후 신규 stable 태그 없음 확정. v0.39.0-preview.1/.2 출시 및 main 브랜치 15+건 커밋은 v0.39.0 stable 방향을 예고.*
