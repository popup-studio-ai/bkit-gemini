# Gemini CLI v0.40.0-preview / v0.41.0-nightly 변경사항 조사 보고서

> 조사일: **2026-04-23**
> 조사 범위: **v0.39.0 (2026-04-23 04:12 UTC) → v0.40.0-preview.2 (2026-04-23 04:08 UTC) + v0.41.0-nightly.20260423 (05:41 UTC)**
> 조사자: gemini-researcher agent
> bkit 현재 버전: v2.0.4 (Gemini CLI v0.36.0 대상)
> 선행 참조: `docs/01-plan/research/gemini-cli-v0.39.0-research.md`

---

## 0. TL;DR (한 눈에 보는 결론)

**v0.39.0 stable과 동일한 날(2026-04-23)에 v0.40.0-preview.2 및 v0.41.0-nightly가 함께 출시되었다.** Google이 release train을 가속하고 있다는 신호.

| 항목 | 값 |
|------|-----|
| **최신 stable (마이그 target)** | **v0.39.0** (2026-04-23) |
| **최신 preview** | **v0.40.0-preview.2** (2026-04-23 04:08 UTC, commit `ee7e037`) |
| **최신 nightly** | **v0.41.0-nightly.20260423.gd1c91f526** (2026-04-23 05:41 UTC) |
| v0.40.0 preview.0 / preview.1 | **존재하지 않음** (preview.2가 첫 공개 preview) |
| v0.40.0-preview.2 contributors | **37명** (신규 14명) |
| v0.40.0 핵심 테마 | **메모리 시스템 본격 진화 (4-tier, autoMemory split), 보안 hardening (RCE 차단), 오프라인 지원 (ripgrep bundling), MCP 리소스 read 도구** |
| v0.41.0 (main) 추가 변경 | 스킬 추출 시 recurrence 증거 요구, 환경변수 정리, sandbox profile 위치 확장 |

### bkit 입장 핵심 결론
1. **bkit 즉시 마이그 target은 여전히 v0.39.0**. v0.40.0은 stable이 아니므로 채택 보류.
2. **v0.40.0 stable 출시는 4월 말 ~ 5월 초 가능성** (preview.2가 첫 공개 preview이므로 cherry-pick 안정화 시간 필요).
3. **v0.40.0이 도입할 메모리 4-tier + `autoMemory` 분리 + `experimental.memoryV2` rename은 bkit v2.1.0 context-optimization 설계의 핵심 가정과 직접 충돌**. 본 보고서는 이 충돌을 사전 분석할 수 있도록 PR 본문을 정리.

---

## 1. 출시 타임라인 (2026-04-23 단일일)

| 시각 (UTC) | 태그 | 타입 | 핵심 |
|-----------|------|------|------|
| 04:08 | v0.40.0-preview.2 | Pre-release | 메모리 4-tier + autoMemory split + RCE 차단 + ripgrep bundling |
| 04:12 | v0.39.0 | Stable | (선행 보고서 참조) |
| 05:41 | v0.41.0-nightly.20260423.gd1c91f526 | Nightly | 스킬 추출 강화, 환경변수 정리 |

> **관찰**: v0.40.0-preview.0/.1은 release 페이지에 존재하지 않음 (404). preview.2가 첫 공개 preview. 내부적으로 .0/.1을 건너뛰고 직접 .2로 공개했거나, .0/.1은 internal-only 였을 가능성.

---

## 2. v0.40.0-preview.2 변경사항 상세

### 2.1 🔴 Breaking Changes (예고 — v0.40.0 stable 시점)

| # | 항목 | 이전 (v0.39.0) | v0.40.0-preview.2 | 영향 | 참조 |
|---|------|---------------|---------------------|------|------|
| 1 | **`MemoryManagerAgent` 완전 제거 → 프롬프트 기반 4-tier** | `MemoryManagerAgent` subagent가 메모리 편집 담당 | Agent 제거. **프롬프트 기반 직접 파일 편집**. 4-tier 라우팅 (mutual exclusion 강제) | bkit가 MemoryManagerAgent를 invoke하거나 그 결과를 가정한 코드 즉시 작동 중지 | [PR #25716](https://github.com/google-gemini/gemini-cli/pull/25716), commit `6edfba4` (2026-04-22 01:31 UTC merge) |
| 2 | **Experimental flag rename: `experimental.memoryManager` → `experimental.memoryV2`** | `experimental.memoryManager: true` | **`experimental.memoryV2: true`** (별칭/deprecation alias **없음**) | bkit 설정에서 구 키 사용 시 경고 또는 무시. 사용자 마이그 가이드 필요 | [PR #25716](https://github.com/google-gemini/gemini-cli/pull/25716) |
| 3 | **`experimental.jitContext` 기본값 `false` → `true`** | opt-in JIT context | **opt-out**으로 전환 (기본 ON) | bkit JIT 컨텍스트 가정과 정합 — 회귀 테스트 필요 | [PR #25716](https://github.com/google-gemini/gemini-cli/pull/25716) |
| 4 | **`experimental.autoMemory` 신규 플래그** | `memoryManager` 단일 플래그가 (a) MemoryManagerAgent + (b) 백그라운드 스킬 추출 둘 다 게이트 | **두 기능 분리**. `memoryManager: true` → MemoryManagerAgent만 (이미 v0.40.0에선 제거되어 의미 모호), `autoMemory: true` → 백그라운드 스킬 추출 | 두 플래그 모두 default false. **자동 마이그 shim 없음** — 사용자가 명시 설정 필요 | [PR #25601](https://github.com/google-gemini/gemini-cli/pull/25601), commit `8573650` (2026-04-18 merge) |

> **주의**: PR #25716(메모리 4-tier)과 #25601(autoMemory split)은 시점상 #25601이 먼저 머지(04-18)되고 #25716이 나중(04-22). v0.40.0-preview.2는 둘 다 포함. **v0.40.0 stable에 두 변경이 함께 적용되면 `experimental.memoryManager`는 사실상 무의미해진다** (Agent 자체가 없으므로).

### 2.2 🔒 보안 (Critical Security)

| # | 항목 | 설명 | 참조 |
|---|------|------|------|
| 1 | **🔒 IDE stdio override RCE 차단** | workspace `.env`로 IDE stdio 설정 override 금지 | (v0.39.0에 이미 포함, [PR #25022](https://github.com/google-gemini/gemini-cli/pull/25022)) — preview.2 release notes에서도 강조 |
| 2 | **OpenSSL 3.x SSL 에러 처리** | 스트리밍 중 SSL 에러 핸들링 개선 (OpenSSL 3.x 호환성) | preview.2 release notes |
| 3 | **Shell command injection 취약점 보강** | (구체 PR 미확인) | preview.2 release notes |
| 4 | **Ignore file 파싱 line ending 정상화** | `.geminiignore` 등 라인 엔딩 보정 | preview.2 release notes |
| 5 | **API key 파싱 — `.` 포함 값 지원** | API key 값에 dot 허용 | preview.2 release notes |

### 2.3 🟢 신규 기능

#### 2.3.1 메모리 시스템 (4-tier)

PR #25716 핵심 — 4-tier 라우팅:

| Tier | 위치 | 용도 | 커밋/공유 |
|------|------|------|----------|
| 1. Project Instructions | `./GEMINI.md` | 팀 공유 | 커밋됨 |
| 2. Subdirectory Instructions | `./<subdir>/GEMINI.md` | 디렉토리 scope | 커밋됨 |
| 3. Private Project Memory | `~/.gemini/tmp/<hash>/memory/MEMORY.md` | 프로젝트별 사용자 메모 | **커밋 안됨** |
| 4. Global Personal Memory | `~/.gemini/GEMINI.md` | 크로스 프로젝트 사용자 선호 | 비커밋 |

**부가 변경**:
- **`Config.isPathAllowed`**가 `~/.gemini/GEMINI.md`만 허용하는 surgical allowlist 추가
- **XML-tag sanitization**으로 prompt injection 방어 추가
- 시스템 프롬프트 재작성 — per-tier strict routing + mutual exclusion

#### 2.3.2 인프라 / 빌드

| # | 기능 | 설명 | 참조 |
|---|------|------|------|
| 1 | **Ripgrep 바이너리를 SEA에 번들** | Single Executable Application에 ripgrep 포함, 오프라인 검색 지원 | preview.2 release notes |
| 2 | **JSONL 세션 로그 — memory/summary 서비스 지원** | v0.39.0에서 도입된 JSONL 채팅 기록을 메모리/요약 서비스가 직접 읽음 | preview.2 release notes |
| 3 | **ACP 세션에서 auto memory 시작** | ACP 환경에서도 백그라운드 메모리 추출 동작 | [PR #25626](https://github.com/google-gemini/gemini-cli/pull/25626) |

#### 2.3.3 스킬 / 도구

| # | 기능 | 설명 | 참조 |
|---|------|------|------|
| 1 | **Skill extraction이 skill-creator agent와 통합** | 스킬 추출 파이프라인이 skill-creator를 직접 호출 | preview.2 release notes |
| 2 | **`gemini gemma` 로컬 모델 셋업 streamline** | 로컬 gemma 모델 설치/구성 단순화 | [PR #25498](https://github.com/google-gemini/gemini-cli/pull/25498) |
| 3 | **MCP 리소스 list/read 도구 추가** | MCP 서버 리소스를 도구로 노출 | preview.2 release notes |

#### 2.3.4 UI/UX

| # | 기능 | 설명 |
|---|------|------|
| 1 | GitHub colorblind 테마 추가 |
| 2 | 테마 다이얼로그 라벨 렌더링 수정 ([PR #24599](https://github.com/google-gemini/gemini-cli/pull/24599)) |
| 3 | 테마 다이얼로그 unmount 시 preview 테마 revert |
| 4 | **OSC 777 터미널 알림 구현** (데스크탑 알림) |
| 5 | Input 배경색 제거 |

#### 2.3.5 기타 수정

| # | 항목 | 참조 |
|---|------|------|
| 1 | **YOLO 모드 downgrade 방지** | preview.2 release notes |
| 2 | **Topic update narration 기본 ON** | [PR #25586](https://github.com/google-gemini/gemini-cli/pull/25586) |
| 3 | **Subagent topic updates OFF** (노이즈 감소) | [PR #25567](https://github.com/google-gemini/gemini-cli/pull/25567) |
| 4 | **Plan 중첩 디렉토리 중복 해결** | (v0.39.0-preview.1 cherry-pick 정착) |
| 5 | **Bun 런타임 detached 모드 비활성화** | [PR #22620](https://github.com/google-gemini/gemini-cli/pull/22620) |
| 6 | **IDE client에 dynamic CLI version 사용** | preview.2 release notes |

---

## 3. v0.41.0-nightly.20260423 추가 변경 (main 브랜치)

v0.40.0-preview.2 이후 main으로 들어온 추가 커밋. v0.41.0 stable의 모양 예고.

| # | 항목 | 설명 | bkit 영향 |
|---|------|------|----------|
| 1 | **스킬 추출 시 recurrence 증거 요구** | 같은 패턴이 반복 관찰돼야 스킬 추출 — 잘못된 조기 추출 방지 | bkit 스킬 자동 추출 정확도 향상 |
| 2 | **Topic update narration GA 승격** | experimental → general | bkit Chapters 기능과 정합 |
| 3 | Subagent에서는 topic update 비활성 | (preview.2 정착) | 서브에이전트 출력 노이즈 감소 |
| 4 | **Custom seatbelt sandbox profile을 `$HOME/.gemini`에서 먼저 resolve** | 사용자 sandbox profile 우선순위 변경 | bkit-server sandbox 설정 시 영향 |
| 5 | **명시적 write permission이 governance file 보호 override** | sandbox 내 write 권한 정책 | 보안 정책 변경 |
| 6 | **`GOOGLE_GEMINI_BASE_URL` / `GOOGLE_VERTEX_BASE_URL` 처리 개선** | Base URL 환경변수 정리 | bkit이 base URL 환경변수 의존 시 회귀 테스트 |
| 7 | `/new` (= `/clear` alias) — main에 정착 | (v0.39.0 미포함, v0.40.0/v0.41.0 영역) | bkit 슬래시 커맨드 훅 확장 검토 |

> nightly release notes에는 "No breaking changes were explicitly listed"라고 적혀 있으나, sandbox profile resolve 순서 변경은 사실상 동작 변경.

---

## 4. v0.40.0 stable 진입 시 bkit 영향 매트릭스

### 4.1 🔴 CRITICAL — 메모리 4-tier 리팩터 (#25716)

- **bkit v2.1.0 context-optimization 설계 직접 충돌**
- 4-tier 위치 중 **Tier 3 (`~/.gemini/tmp/<hash>/memory/MEMORY.md`)는 bkit의 6-Layer 중 어느 layer에 매핑될지 재정의 필요**
- bkit이 `MemoryManagerAgent` 호출 코드를 가지고 있다면 즉시 NoOp/실패
- **권고**: v0.40.0-preview.2 코드에서 `MemoryManagerAgent` 검색 후 v2.1.0 설계 재작성

### 4.2 🔴 HIGH — `experimental.memoryV2` rename + `autoMemory` 분리

- bkit이 `experimental.memoryManager` 키를 설정 스키마에 둔 경우:
  - 무시됨 (rename 후 매칭 안됨)
  - 또는 strict mode validator에서 경고
- **권고**:
  1. bkit 설정 validator에 두 키 호환 어댑터 추가
  2. 사용자 가이드: `experimental.memoryManager` → `experimental.memoryV2` 매뉴얼 변경 안내
  3. `experimental.autoMemory` 별도 노출 (백그라운드 스킬 추출 ON/OFF 제어)

### 4.3 🟡 MEDIUM — `experimental.jitContext` 기본 ON

- bkit JIT context 가정 코드가 있는 경우 영향
- **권고**: bkit 6-Layer 중 JIT 관련 layer가 Gemini의 jitContext와 중복/충돌하는지 확인

### 4.4 🟡 MEDIUM — Ripgrep 번들 → 검색 도구 일관성

- Gemini CLI 자체 `search_file_content` 도구가 번들 ripgrep 사용
- bkit-server가 자체 ripgrep 호출 시 버전 불일치 가능
- **권고**: bkit-server search 도구가 시스템 ripgrep을 호출하는지 점검

### 4.5 🟡 MEDIUM — MCP 리소스 list/read 도구

- 신규 MCP 도구가 bkit-server의 자체 MCP 리소스 노출과 중복 가능
- **권고**: 도구명 충돌 점검, bkit-server가 MCP 리소스 list/read를 자체 도구로 노출 중이면 통합 검토

### 4.6 🟢 LOW-MEDIUM — Topic update narration 기본 ON

- bkit Chapters 기능과 동시 동작 시 UI 중복 출력 가능
- **권고**: bkit Chapters와 Gemini topic update narration 정합성 회귀 테스트

---

## 5. v0.40.0 stable 출시 시점 추정

| 근거 | 추정 |
|------|------|
| v0.40.0-preview.0/.1이 부재, .2가 첫 공개 | 추가 1~2회 cherry-pick preview 예상 |
| v0.39.0 preview cycle | preview.0 (4-14) → stable (4-23), 9일 |
| v0.40.0-preview.2 (4-23) | stable 출시 예상: **4월 말 ~ 5월 초** |
| v0.41.0-nightly가 이미 존재 | v0.40.0 cut은 임박 |

---

## 6. 원문 참조 링크

### 6.1 GitHub Releases
- [v0.40.0-preview.2](https://github.com/google-gemini/gemini-cli/releases/tag/v0.40.0-preview.2) — 2026-04-23 04:08 UTC
- [v0.41.0-nightly.20260423.gd1c91f526](https://github.com/google-gemini/gemini-cli/releases/tag/v0.41.0-nightly.20260423.gd1c91f526) — 2026-04-23 05:41 UTC

### 6.2 핵심 PR (v0.40.0 영역)
- [#25716 — Refactor memory: replace MemoryManagerAgent with prompt-driven memory editing across four tiers](https://github.com/google-gemini/gemini-cli/pull/25716) (commit `6edfba4`)
- [#25601 — Split memoryManager flag into autoMemory](https://github.com/google-gemini/gemini-cli/pull/25601) (commit `8573650`)
- [#25626 — Auto memory in ACP sessions](https://github.com/google-gemini/gemini-cli/pull/25626)
- [#25022 — 🔒 Disallow IDE stdio override via workspace .env (RCE)](https://github.com/google-gemini/gemini-cli/pull/25022) (v0.39.0 + v0.40.0 모두 포함)
- [#25586 — Topic update narration default ON](https://github.com/google-gemini/gemini-cli/pull/25586)
- [#25567 — Disable topic updates for subagents](https://github.com/google-gemini/gemini-cli/pull/25567)
- [#25498 — Streamlined gemini gemma local model setup](https://github.com/google-gemini/gemini-cli/pull/25498)
- [#22620 — Disable detached mode in Bun](https://github.com/google-gemini/gemini-cli/pull/22620)
- [#24599 — Theme dialog labels rendering fix](https://github.com/google-gemini/gemini-cli/pull/24599)
- [#17865 — `/new` alias for `/clear`](https://github.com/google-gemini/gemini-cli/pull/17865)
- [#25256 — `@` file recommendations watcher-based updates](https://github.com/google-gemini/gemini-cli/pull/25256)

### 6.3 연관 bkit 문서
- `docs/01-plan/research/gemini-cli-v0.39.0-research.md` (선행, 신규 stable target)
- `docs/01-plan/research/gemini-cli-post-v0.38.2-research.md` (이전 baseline, 본 보고서로 갱신)
- `docs/01-plan/features/v2.1.0-context-optimization.plan.md` (메모리 4-tier 리팩터로 재검토 필수)

---

## 7. 조사 신뢰도

| 항목 | 신뢰도 | 비고 |
|------|--------|------|
| v0.40.0-preview.2 / v0.41.0-nightly 출시 시각 | ⬛⬛⬛⬛⬛ | Tags 페이지 확인 |
| v0.40.0-preview.0/.1 부재 | ⬛⬛⬛⬛⬜ | 직접 fetch 시 404. internal cut 가능성 배제 못함 |
| 4-tier 구조 (Tier 1~4 위치) | ⬛⬛⬛⬛⬛ | PR #25716 본문에서 명시 |
| `experimental.memoryV2` rename / `jitContext` default ON | ⬛⬛⬛⬛⬛ | PR #25716 본문에서 명시 |
| `autoMemory` 분리 의미 | ⬛⬛⬛⬛⬛ | PR #25601 본문에서 명시 |
| Ripgrep 번들 + MCP 리소스 도구 | ⬛⬛⬛⬛⬜ | release notes 확인, 구체 PR 일부 미확인 |
| nightly 추가 변경 (sandbox profile resolve) | ⬛⬛⬛⬜⬜ | release notes 요약 확인, 구체 PR 미확인 |
| v0.40.0 stable 출시 시점 추정 | ⬛⬛⬜⬜⬜ | preview cycle 추정 |

---

## 8. 권장 조치 (bkit 팀)

### 8.1 즉시 (P1 후속)
1. **v2.1.0 context-optimization 플랜 재검토 회의** 소집
   - 4-tier 구조와 bkit 6-Layer 정합성 분석
   - 특히 `~/.gemini/tmp/<hash>/memory/MEMORY.md` (Tier 3)가 bkit의 어느 layer와 매핑되는지 결정
2. **`MemoryManagerAgent` 사용 전수 감사** (`grep -r "MemoryManagerAgent" .`)

### 8.2 단기 (v0.40.0 stable 출시 전)
3. bkit 설정 validator에 `experimental.memoryManager` ↔ `experimental.memoryV2` 호환 어댑터
4. `experimental.autoMemory` 노출 인터페이스 결정
5. JIT context 기본 ON 정책 회귀 테스트
6. bkit-server search 도구의 ripgrep 의존성 점검
7. MCP 리소스 list/read 도구와 bkit-server 도구 충돌 점검

### 8.3 모니터링
8. v0.40.0-preview.3+ cherry-pick 모니터링
9. v0.41.0 nightly의 sandbox profile 변경 추적
10. PR #25827 (#25655 SessionStart 중복 fix) 머지 모니터링 — v0.40.0 stable 포함 여부

---

*조사 종료: 2026-04-23. v0.40.0-preview.2 + v0.41.0-nightly 출시 확인. 메모리 4-tier 리팩터와 autoMemory split이 v0.40.0 stable에 포함될 예정. bkit v2.1.0 설계 재검토 필수.*
