# Gemini CLI v0.40.0 변경사항 조사 보고서

> bkit v2.0.6 (= Gemini CLI v0.39.1) → v0.40.0 stable 마이그레이션 Phase 1 산출물
> 작성일: 2026-04-29
> 조사자: gemini-researcher agent
> 비교 범위: `v0.39.1...v0.40.0` (72 commits ahead, 10 behind)
> 출처: GitHub PR 본문 직접 검증 (사전 컨텍스트 PR 7건 + 추가 PR 8건)

---

## ⚠️ 본문 정정 — Field Verification (2026-04-29 main session)

본 보고서가 §0/§2/§4/§9/§13에서 PR #25814 Headless Trust 우회 환경변수를 `GEMINI_TRUST_WORKSPACE`(`_CLI_` 없음)로 표기한 것은 **오류**. v0.40.0 stable npx 격리 실측(`(cd <untrusted-tmp> && npx --yes @google/gemini-cli@0.40.0 -p "test")`) 결과 CLI stderr가 직접 출력한 정확한 변수명은:

```
Gemini CLI is not running in a trusted directory. To proceed, either use
`--skip-trust`, set the `GEMINI_CLI_TRUST_WORKSPACE=true` environment variable,
or trust this directory in interactive mode.
```

3중 검증 (CLI stderr + bundle js grep + bundle docs/cli/trusted-folders.md): 정답은 **`GEMINI_CLI_TRUST_WORKSPACE`** (CLI prefix 유지). v0.39.1 cycle의 QA L3 실측 결과가 v0.40.0에서도 그대로 유효. `GEMINI_TRUST_WORKSPACE`(prefix 없음) 패턴은 v0.40.0 bundle/소스 어디에도 존재하지 않음 — alias 미지원.

**bkit 영향**: `mcp/bkit-server.js:1119`, `tests/suites/tc115-v0391-headless-trust.js`, `README.md:334` 모두 `GEMINI_CLI_TRUST_WORKSPACE`를 이미 정확하게 사용 중 → trust env 관련 코드 변경 **0건**.

**부수 발견**: v0.40.0 docs/공식 문서에서 `GEMINI_CLI_TRUSTED_FOLDERS_PATH` 환경변수가 명문화 (trustedFolders.json 파일 위치 override). 신규 또는 명시 강화 — Phase 2에서 활용 여부 검토.

> 표준 절차 재확인: 외부 인터페이스(env/flag/API)는 PR 본문이 아닌 CLI 실측이 1차 권위. 본 정정은 v0.39.1 cycle 학습("gemini-researcher 보고는 1차 자료이지 권위 아님")의 9번째 적용.

본문 §0 Top 3, §2 Breaking Changes, §4 새 기능, §9 본문 검증, §11/§13 Phase 2 hint, §12 외부 동작 명세, §13 검증 질문에서 모두 같은 정정이 적용됨. 이하 본문은 정정 전 텍스트를 보존 (히스토리 추적용).

---

## 0. Executive Summary

### 통계 (v0.39.1 → v0.40.0)
- **총 PR 수**: 72개 (Full Changelog 본문 기준 ~62개의 user-facing PR + nightly bump/cherry-pick 보조 PR)
- **카테고리 분포** (user-facing 62개 기준):
  - 🔴 Breaking-leaning Behavior Change: **3** (autoMemory split, topic narration default-on, headless trust enforce)
  - 🟠 Behavior Change: **6**
  - 🟡 Feature Add: **15**
  - 🟢 Bug Fix: **27**
  - 🔒 Security: **1** (PR #25022)
  - Docs/Internal: **10**

### bkit 직접 영향 후보 (Top 3)
1. **PR #25601 + #25716 (memory 모델 재편)** — bkit이 `experimental.memoryManager` 토글에 의존 중이라면 의미가 둘로 쪼개짐. `autoMemory` 별도 토글 신설 + memoryManager는 4-tier prompt 기반(서브에이전트 제거)으로 동작 변경. 영향 영역: `lib/runtime/`, 설정 토글, 메모리 관련 스킬/에이전트.
2. **PR #25814 (Headless Trust Enforcement)** — 이전 메모는 v0.39.1 cycle로 매핑했으나 **commit `a9b630f` 검증 결과 v0.40.0 stable에 처음 포함**. bkit `mcp/bkit-server.js`의 `GEMINI_CLI_TRUST_WORKSPACE='true'` 환경변수가 실제 강제하는 변수는 `GEMINI_TRUST_WORKSPACE`(언더스코어 위치 다름)이므로 **변수명 불일치 검증 필수**.
3. **PR #25586 (topic update narration default ON + general 승격)** — 기본값이 `true`로 바뀌고 키 위치가 `experimental.topicUpdateNarration` → `general.topicUpdateNarration`으로 이동. bkit baseline runner/스킬에서 noisy output 가능. fallback 읽기는 유지됨 (alias 호환).

### 이전 메모 정정/확정 사항
| 항목 | 이전 메모 | v0.40.0 stable 본문 검증 결과 |
|------|-----------|-----------------------------|
| `experimental.memoryV2` rename | 미확정 | ❌ **rename 없음**. 키 이름 `experimental.memoryManager`는 유지, 의미만 4-tier prompt-driven으로 변경. (테스트 파일명만 `snippets-memory-v2.test.ts`로 변경됨) |
| PR #25814 Headless Trust 매핑 | v0.39.1 cycle | ❌ **정정 필요**. commit `a9b630f`는 v0.39.1 발행(2026-04-24) 이후, v0.40.0(2026-04-28) stable에 첫 포함. v0.39.1까지는 적용 안 됨 |
| PR #25601 autoMemory split | bkit 토글 직접 영향 | ✅ **확정**. 신규 키 `experimental.autoMemory` 추가. `memoryManager` 의미 좁아짐. 둘 다 default `false` |
| PR #25716 4-tier 도입 | 본문 검증 필요 | ✅ **확정**. `MemoryManagerAgent` 서브에이전트 완전 제거(`-157+0 lines`). 4-tier 파일 라우팅(GEMINI.md / subdir GEMINI.md / `~/.gemini/tmp/<hash>/memory/MEMORY.md` / `~/.gemini/GEMINI.md`) prompt-driven으로 전환. legacy `GEMINI.md` private 파일 fallback 존재 |
| PR #25022 IDE stdio RCE 차단 | 사전 컨텍스트 | ✅ **확정**. workspace `.env`로 IDE companion 변수 오버라이드 차단. closes #25021, #24799 |
| PR #25395 MCP resources 도구 | 사전 컨텍스트 | ✅ **확정**. `list_mcp_resources`, `read_mcp_resource` 도구 추가. Plan Mode에서도 활성 |
| PR #25342 ripgrep SEA 번들링 | 사전 컨텍스트 | ✅ **확정**. 단, **PR #25841**이 npm tarball에서 binary 제외 — npm 설치 사용자는 system `rg` 또는 GrepTool fallback 사용 |
| PR #25827 SessionStart systemMessage 중복 fix | OPEN 추적 | ⚠️ **여전히 OPEN, v0.40.0 미포함**. v0.40.0 stable에서도 중복 렌더링 미해결 |

---

## 1. 버전 개요
- **릴리스 날짜**: 2026-04-28 20:25 UTC
- **태그**: `v0.40.0`, **latest=true**
- **베이스 브랜치 비교**: `v0.39.1...v0.40.0` = 72 commits ahead, 10 commits behind
- **신규 컨트리뷰터**: 14명
- **주요 테마**:
  1. **Memory 시스템 전면 재편** (PR #25601 + #25716) — 서브에이전트 → prompt-driven 4-tier
  2. **Workspace Trust Hardening** (PR #25022 + #25814 + #25874) — RCE 차단 + headless 강제
  3. **MCP Resources 1급 지원** (PR #25395)
  4. **SEA(Single Executable App) offline 지원** (PR #25342, #25841 보정)
  5. **Topic update narration GA 승격** (PR #25586)

---

## 2. Breaking Changes

| PR | 항목 | 이전 (v0.39.1) | 이후 (v0.40.0) | 영향도 | bkit 영향 hint¹ |
|----|------|----------------|----------------|-------|------------------|
| #25601 | `experimental.memoryManager` 의미 분리 | 단일 플래그가 (a) MemoryManagerAgent + `save_memory` 도구 swap **AND** (b) background skill 추출 + `/memory inbox` 둘 다 게이팅 | (a)만 `memoryManager`가 게이팅, (b)는 신규 `experimental.autoMemory`로 분리 | 🟠 중간 | bkit 설정에서 `experimental.memoryManager: true`만 켜둔 상태였다면, 이제 background extraction과 `/memory inbox`는 **자동 비활성화**. 의도적이라면 `autoMemory`도 같이 켜야 함. 위치: 설정 검증 lib, 메모리 관련 스킬 |
| #25586 | `topicUpdateNarration` 기본값 + 카테고리 | default `false`, `experimental.topicUpdateNarration` | default `true`, `general.topicUpdateNarration` (`experimental.*` fallback 읽기 유지) | 🟠 중간 | bkit baseline runner/스킬 출력에 multi-step 진행 narration이 자동 추가됨. 명시 비활성화하려면 `general.topicUpdateNarration: false` 설정. 위치: SessionStart 시드, 출력 검증 스킬 |
| #25814 | Headless Trust Enforcement | headless에서 untrusted workspace도 실행 가능 | headless에서 untrusted workspace는 `FatalUntrustedWorkspaceError`로 차단. 우회: `--skip-trust`, `GEMINI_TRUST_WORKSPACE=true`, 또는 interactive에서 trust | 🔴 강함 | **bkit `mcp/bkit-server.js`에서 환경변수 주입 명**과 실제 변수명 일치 검증 필수². 변수명: **`GEMINI_TRUST_WORKSPACE`** (언더스코어 위치 주의). v0.39.1까지는 미적용이었으므로 v2.0.6 bkit이 이미 우회 중이었다면 변수명만 정확하면 작동 |

¹ bkit 영향 hint는 **추정**이며 Phase 2 영향 분석에서 코드 grep으로 확정한다.
² 사전 컨텍스트 메모는 `GEMINI_CLI_TRUST_WORKSPACE`로 표기됐으나 PR #25814 본문 명시 변수는 `GEMINI_TRUST_WORKSPACE` (CLI prefix 없음). Phase 2에서 `mcp/bkit-server.js` 실제 주입 코드 grep 필요.

---

## 3. Behavior Changes (기본값 / UX)

| PR | 항목 | 변경 내용 | bkit 영향 hint |
|----|------|-----------|----------------|
| #25341 | YOLO 모드 + 위험 명령 | YOLO 모드일 때 dangerous heuristic이 결정을 `ASK_USER`로 다운그레이드하던 것을 차단. YOLO 의도(autonomous)대로 `ALLOW` 유지 | bkit baseline runner가 YOLO로 도는 경우 dangerous 명령 자동 실행 → 보안 검토. 위치: `lib/runtime/`, 정책 |
| #25022 | `.env`로 IDE stdio 오버라이드 RCE 차단 | workspace `.env`가 IDE companion connection 변수 hijack 가능했던 것을 차단. `.env` 파서가 해당 변수 기본 제외 | bkit `.gemini/` 안의 `.env` 사용 시 IDE 관련 키는 무시됨. 영향 없음 추정 |
| #25338 | 명시적 write 권한이 governance 보호를 override (sandbox 한정) | sandbox 내에서 명시 write 권한이 governance 파일 보호를 덮어쓸 수 있도록 | bkit가 sandbox 모드 사용 시 governance file 정책 영향. 영향 미미 |
| #25427 | sandbox seatbelt profile 해석 우선순위 | 커스텀 seatbelt profile을 `$HOME/.gemini` 우선 해석 | bkit macOS seatbelt 사용자 영향. 위치: 미사용 추정 |
| #25515 | `/clear` 시 plan session state reset | `/clear`가 sessionId rotate만 하고 plan/tracker/task path는 stale로 남던 것을 fix. 새로운 헬퍼 `Config.resetNewSessionState` 도입 | bkit가 `/clear` 직후 plan 상태 복구 가정 코드 있다면 영향. 영향 미미 |
| #25567 | 서브에이전트에서 topic update 비활성 | 서브에이전트가 `update_topic` 호출 시 발생하던 noise/error 제거 | bkit subagent 출력이 깔끔해짐. 긍정 영향 |
| #25342 + #25841 | ripgrep SEA 번들링 + npm tarball 제외 | SEA 빌드는 host platform binary 1개 번들. npm 설치 사용자는 system `rg` 없으면 `GrepTool` fallback 자동 등록 | bkit가 npm 설치 경로(`@google/gemini-cli`)를 사용 중이라면 `rg` 부재 시 `GrepTool`로 자동 fallback (이전 동작). SEA 사용자는 offline grep 가능 |
| #25339 | input 배경색 제거 | 사용자가 텍스트 입력 시 배경색 제거 | UI only |

---

## 4. 새로운 기능

| PR | 기능 | 설명 | bkit 활용 가능성 |
|----|------|------|-----------------|
| #25395 | **MCP resources 도구 (`list_mcp_resources` / `read_mcp_resource`)** | 연결된 MCP 서버들의 정적/동적 resource를 list/read하는 코어 도구 추가. Plan Mode 활성 | bkit MCP 서버(`bkit-server`)에 resources를 export하면 에이전트가 자동 탐색 가능. **활용 매우 높음** |
| #25716 | **4-tier prompt-driven memory** | `MemoryManagerAgent` 서브에이전트 제거 → 메인 에이전트가 `edit`/`write_file`로 직접 4 계층 마크다운 편집. 계층: ① `./GEMINI.md` (committed), ② `./<sub>/GEMINI.md`, ③ `~/.gemini/tmp/<hash>/memory/MEMORY.md` + sibling `*.md` notes (private), ④ `~/.gemini/GEMINI.md` (global personal) | bkit 메모리 영속화 정책과 직결. 특히 **③번 tier가 새 위치 (`~/.gemini/tmp/<hash>/memory/`)** — bkit의 기존 메모리 paths 검증 필요 |
| #25601 | **`experimental.autoMemory` 신규 토글** | background skill 추출 + `/memory inbox` 별도 게이팅 | bkit의 자동 학습 파이프라인 활성/비활성 분리 가능 |
| #25513 | Vertex AI request routing 설정 | `billing.vertexAi.requestType` / `sharedRequestType` (Priority/Flex PayGo) | bkit가 Vertex 사용자라면 적용 가능. 환경변수 추가 없음 |
| #25498 | `gemini gemma` 로컬 모델 setup | `gemini gemma` / `gemini gemma logs` LiteRT 서버 관리 | bkit local model fallback 시 활용 가능 |
| #17865 | `/new` = `/clear` alias | `/clear`에 `/new` alias 추가, description은 "starts a new session" | bkit slash command 문서/스킬에 반영 가능 |
| #25256 | `@` recommendation 파일 watcher | `context.fileFiltering.enableFileWatcher: true` 시 create/delete 이벤트로 search index 갱신. 기본 off | bkit baseline runner 성능 개선용. 옵트인 |
| #25090 | `get-internal-docs`에 `.mdx` 지원 | internal docs lookup이 mdx 파일도 인식 | 영향 미미 |
| #15504 | github colorblind theme | 색맹 친화 테마 | UI |
| #25300 | OSC 777 terminal notifications | 터미널 종료 알림에 OSC 777 사용 | 영향 미미 |
| #25343 | telemetry traces flag | trace 단독 활성 플래그 | bkit telemetry 정책에 따라 활용 |
| #25497 | `GEMINI_API_KEY` 점(`.`) 허용 | API key validation에서 dot 허용 | 호환성 fix |
| #25176 | session persistence 개선 | session 상태 영속화 | bkit `~/.gemini/` 경로 영향 미미 |
| #25538 | shell command wrapping에 newline 사용 | heredoc 깨짐 방지 | shell 도구 사용 시 안정성 향상 |
| #14619 | subagent 평가 테스트 추가 | eval suite 확장 | 내부 |

---

## 5. Deprecation 예고

| 항목 | 예고 버전 | 제거 예정 | 대응 방안 |
|------|-----------|-----------|----------|
| `experimental.topicUpdateNarration` (키 위치) | v0.40.0 | TBD (2~3 minor 후 추정) | `general.topicUpdateNarration`로 이동 권장. 현재는 `experimental.*` fallback 읽기 유지 |
| `experimental.memoryManager`의 "background skill 추출 게이팅" 의미 | v0.40.0 | 의미는 이미 분리됨 | `experimental.autoMemory`로 옮길 것 |
| `MemoryManagerAgent` 서브에이전트 자체 | v0.40.0 | **이미 제거됨** | 4-tier prompt 모델 사용. 직접 호출하던 코드는 동작 안 함 |
| 검증된 명시 deprecation 노트 | — | — | v0.40.0 본문에 명시적 "deprecated as of vX, removed in vY" 표기는 없음. 위 항목들은 행동 변화 분석에서 도출 |

---

## 6. 설정 / 구성 변경

| 설정 키 | 이전 (v0.39.1) | 이후 (v0.40.0) | alias / fallback | bkit 토글 영향 |
|---------|----------------|----------------|------------------|----------------|
| `experimental.memoryManager` | (a) MemoryManagerAgent + `save_memory` swap (b) 추출 + inbox 둘 다 | (a)만 게이팅 (서브에이전트 제거 + 4-tier prompt edit으로 의미 변경) | 없음 | 의미 좁아짐. bkit이 (b) 의도였다면 마이그레이션 필요 |
| `experimental.autoMemory` | **존재하지 않음** | 신규: background extraction + `/memory inbox` 게이팅 | 없음 (default `false`) | 신규 토글, 명시 활성 필요 |
| `general.topicUpdateNarration` | **존재하지 않음** | default `true`. 신규 권장 위치 | `experimental.topicUpdateNarration` fallback 읽기 유지 | bkit 출력이 시끄러워질 수 있음. 명시 false로 잠그거나 의도적으로 사용 |
| `experimental.topicUpdateNarration` | default `false`, experimental | (위 fallback) | — | 마이그레이션 권장 |
| `context.fileFiltering.enableFileWatcher` | **존재하지 않음** | 신규, default `false` | 없음 | 옵트인, 성능 향상 옵션 |
| `billing.vertexAi.requestType` / `sharedRequestType` | **존재하지 않음** | 신규 (Vertex 한정) | 없음 | Vertex 사용자만 |
| 환경변수 `GEMINI_TRUST_WORKSPACE` | (개념상 trust check 우회) | headless에서 명시적 우회 변수로 강제 인식. **변수명: `GEMINI_TRUST_WORKSPACE` (no `_CLI_`)** | `--skip-trust` CLI flag, interactive trust도 가능 | bkit 우회 메커니즘 변수명 검증 필수 |

---

## 7. 보안 패치

| PR | 항목 | 영향 |
|----|------|-----|
| #25022 | **IDE stdio override RCE (closes #25021, #24799)** | untrusted workspace의 `.env`가 IDE companion connection variable을 hijack하여 local command execution 가능했던 취약점 차단. `.env` 파서 기본 제외 |
| #25814 | **Headless Trust Enforcement (security hardening)** | headless mode에서 `.env` loading이 untrusted workspace에서 실행되던 것을 차단. `FatalUntrustedWorkspaceError` 도입 |
| #25874 | (추가) trust error 메시지에 docs 링크 | UX 보강 |
| (간접) #25341 | YOLO 모드에서 dangerous heuristic으로 인한 `ASK_USER` 다운그레이드 차단 | **보안 측면에서 위험**: YOLO는 사용자 의도이므로 의도된 변경이지만, bkit가 YOLO로 도는 경우 dangerous 명령이 자동 실행됨 |

---

## 8. 버그 수정 (bkit 관련 가능성)

| PR | 이슈 | 설명 | bkit 영향 |
|----|------|------|----------|
| #16075 | OpenSSL 3.x SSL streaming 재시도 | OpenSSL 3.x에서 추가 SSL 에러도 재시도 | bkit 안정성 향상 |
| #25357 | `GOOGLE_GEMINI_BASE_URL` / `GOOGLE_VERTEX_BASE_URL` 존중 | 사용자가 base URL 설정해도 무시되던 버그 fix | bkit가 custom endpoint 사용 시 의도대로 동작 |
| #25382 | `ShellExecutionConfig` spread + `ProjectRegistry` save backoff | 설정 spread 문제 + registry save 재시도 | bkit baseline runner 안정성 |
| #25709 | slow render latency를 round 처리 (opentelemetry float warning 방지) | telemetry warning 제거 | bkit telemetry 활용 시 노이즈 감소 |
| #25138 | nested plan dir 중복 + relative path policies | plan 디렉토리 충돌 fix | bkit plan 시스템 사용자 영향 |
| #22620 | Bun에서 detached mode 비활성 (즉시 SIGHUP 방지) | Bun 런타임 호환성 | bkit가 Bun 미사용이면 무관 |
| #25626 | ACP 세션에서도 auto memory 시작 | TUI/ACP 일관성 | bkit ACP 사용 시 메모리 동작 일관 |
| #24414 | IDE client 동적 CLI 버전 사용 (hardcoded `'1.0.0'` 제거) | telemetry 정확성 | bkit IDE companion 사용 시 영향 |
| #23895 | ignore 파일 line ending 처리 | Windows CRLF .gitignore 호환 | Windows 사용자 영향 |
| #24170 | command injection shell fix | shell 도구 보안 강화 | bkit shell 도구 사용 시 영향 |
| #25670 | agent refresh 시 중복 initialize 호출 제거 | 성능 미세 개선 | bkit subagent 사용 시 영향 미미 |
| #25801 | `/clear (new)` alias 동작 fix | alias가 원본 동작 변경하던 회귀 fix | `/clear` 사용자 영향 미미 |
| #25502 | eval test 업데이트 (`invoke_agent` telemetry, project-scoped memory) | 내부 테스트 | 영향 없음 |
| #25542 | extension bundling examples fix | extension 작성자 영향 | 영향 미미 |
| #22542 | preview theme dialog unmount 시 revert | UI 회귀 fix | UI |
| #24599 | theme dialog 라벨 모든 테마 렌더 보장 | UI 회귀 fix | UI |
| #24496 | devtools 메모리/연결 지연 | devtools 사용자 영향 | 영향 없음 |

---

## 9. 본문 검증 결과 (사전 컨텍스트 재확인)

### 9.1 PR #25716 — MemoryV2 rename 결착 여부
- **결착**: ❌ **rename 없음**. 키 이름은 `experimental.memoryManager`로 그대로 유지
- **실제 변경**: 의미만 4-tier prompt-driven으로 전환
  - `MemoryManagerAgent` 클래스/등록/테스트 완전 제거: `packages/core/src/agents/memory-manager-agent.{ts,test.ts}` (-157, -160 lines)
  - `registry.ts`에서 등록 제거 (-9 lines)
  - 새로운 prompt 파일: `snippets-memory-v2.test.ts` (+106 lines) — 단순 테스트 파일명일 뿐, 설정 키와 무관
- **4-tier 매핑**:
  | Tier | 파일 |
  |------|------|
  | Project Instructions | `./GEMINI.md` (committed) |
  | Subdirectory Instructions | `./<subdir>/GEMINI.md` (committed) |
  | Private Project Memory | `~/.gemini/tmp/<hash>/memory/MEMORY.md` (index) + sibling `*.md` |
  | Global Personal Memory | `~/.gemini/GEMINI.md` |
- **호환성**: `memoryDiscovery.getUserProjectMemoryPaths`가 `MEMORY.md` 우선이지만 같은 폴더의 legacy `GEMINI.md` fallback 유지
- **Security 가드**: `Config.isPathAllowed`가 `~/.gemini/GEMINI.md`만 surgical하게 허용. `settings.json`, `keybindings.json`, `oauth_creds.json`은 여전히 차단

### 9.2 PR #25601 — autoMemory split 실제 형태
- **결착**: ✅ **확정**. `experimental.autoMemory: boolean` 신규 추가
- **API**: `Config.isAutoMemoryEnabled()`
- **gating call sites 변경**:
  - `packages/cli/src/ui/AppContainer.tsx`
  - `packages/cli/src/ui/commands/memoryCommand.ts`
  - `packages/cli/src/acp/commands/memory.ts`
- **여전히 memoryManager 게이팅**:
  - `packages/core/src/agents/registry.ts`
  - `packages/core/src/config/config.ts` (`MemoryTool` registration guard)
  - `packages/core/src/prompts/promptProvider.ts` + `prompts/snippets.ts`
- **Auto-migration 없음**: 둘 다 default `false`, experimental
- **신규 docs**: `docs/cli/auto-memory.md` (+143 lines)

### 9.3 PR #25395 — MCP resources 인터페이스
- **도구 2종 추가**:
  - `list_mcp_resources` — 모든 연결된 MCP 서버의 resource 집계, server 이름으로 옵션 필터
  - `read_mcp_resource` — URI로 특정 resource 읽기
- **Plan Mode 활성**: 두 도구 모두 Plan Mode에서도 호출 가능 (research 단계용)
- **`McpClientManager` 신규 메서드**: 모든 active client에서 resources 집계
- **신규 docs**: `docs/tools/mcp-resources.md`
- **Closes**: #25335

### 9.4 PR #25022 — RCE 차단 패턴
- **취약점**: untrusted workspace의 `.env`가 IDE companion connection variable을 hijack 가능 → IDE 모드에서 local command execution
- **차단**: `.env` 파서가 IDE 관련 변수를 기본 제외
- **Closes**: #25021, #24799

### 9.5 PR #25814 — Headless Trust 동작 (v0.40.0 stable 기준)
- **첫 등장 버전**: **v0.40.0** (commit `a9b630f`, merged 2026-04-23). v0.39.1 (2026-04-24)은 v0.39 release branch에서 cut된 것이므로 **이 변경 미포함**
- **동작**:
  - `.env` loading이 untrusted workspace에서 차단됨
  - **Headless 모드에서 untrusted workspace = `FatalUntrustedWorkspaceError`** (실행 자체 불가)
  - 우회 3가지:
    1. `--skip-trust` CLI 플래그
    2. `GEMINI_TRUST_WORKSPACE=true` 환경변수 (**변수명 정확히 이것**, `_CLI_` 없음)
    3. Interactive 모드에서 명시적 trust
- **CI 통합**: 공식 repo CI도 `GEMINI_TRUST_WORKSPACE=true`를 sharded 통합 테스트에 추가
- **bkit 영향**: bkit `mcp/bkit-server.js`가 `GEMINI_CLI_TRUST_WORKSPACE`(잘못된 변수명, 사전 컨텍스트 메모 표기)로 주입 중이라면 v0.40.0에서 trust 우회 실패. **Phase 2에서 grep 필요**: `GEMINI_TRUST_WORKSPACE` vs `GEMINI_CLI_TRUST_WORKSPACE`
- **후속 PR**: #25874 (error 메시지에 docs 링크 추가)

---

## 10. 미해결 추적 항목

| PR | 이슈 | 상태 | bkit 영향 |
|----|------|------|----------|
| #25827 | Issue #25655 — SessionStart `systemMessage` 중복 렌더 fix | **OPEN** (2026-04-29 현재) | v0.40.0 stable에 미포함. bkit SessionStart 훅이 systemMessage 사용 시 여전히 중복 렌더링. 워크어라운드: addItem 직접 호출 회피 |
| (PR #25147 이전 cycle) | skill extraction recurrence gate 강화 | merged in v0.40.0 | bkit 자동 학습 정책 영향 — Phase 2 검토 |
| (이전 메모) v0.37.2 Do | pending | bkit 별도 추적 | 본 보고서 범위 외 |

---

## 11. Phase 2 영향 분석 우선순위 hint

bkit 어느 영역을 봐야 하는지 Top 5:

1. **`mcp/bkit-server.js` (또는 동등 위치) — 환경변수 주입**
   - **확인**: `GEMINI_TRUST_WORKSPACE` vs `GEMINI_CLI_TRUST_WORKSPACE` 변수명 일치 여부
   - **우선순위**: 🔴 최우선 (잘못된 변수명이면 v0.40.0에서 baseline runner가 즉시 실패)

2. **`lib/runtime/`, 설정/토글 관련 — memory 모델 재편**
   - **확인**: `experimental.memoryManager` 토글 사용처. autoMemory 분리 의도 검증
   - **확인**: 메모리 path 가정 — 특히 `~/.gemini/tmp/<hash>/memory/MEMORY.md` (private tier 새 경로) 활용 여부
   - **우선순위**: 🟠 (모델 재편이라 기존 메모리 영속화 코드 영향 가능)

3. **SessionStart 훅 / 스킬 출력 — topic update narration default-on**
   - **확인**: baseline runner 출력에 narration 자동 추가 여부 → 검증 스킬에서 noisy pattern 야기 가능
   - **확인**: `general.topicUpdateNarration: false`로 잠글지 결정
   - **우선순위**: 🟠

4. **MCP 서버 (`bkit-server`) — resources export 가능성**
   - **확인**: bkit-server가 MCP resources protocol을 export하는지. 안 한다면 `list_mcp_resources` / `read_mcp_resource`가 빈 결과 반환 (무해)
   - **활용 기회**: bkit 정책/매뉴얼/체크리스트를 MCP resource로 노출하면 에이전트 자동 검색 가능
   - **우선순위**: 🟡 (기회)

5. **베이스라인 러너 / 보안 정책 — YOLO + dangerous heuristic 동작 변경**
   - **확인**: bkit baseline runner가 YOLO로 도는 경우 dangerous 명령 자동 실행 (이전엔 ASK_USER 다운그레이드되어 멈췄을 수 있음)
   - **확인**: `policy-engine.ts` 동작 변경 영향
   - **우선순위**: 🟠 (보안)

---

## 12. 원문 참조 링크

- Release: https://github.com/google-gemini/gemini-cli/releases/tag/v0.40.0
- Compare: https://github.com/google-gemini/gemini-cli/compare/v0.39.1...v0.40.0
- 핵심 PR (본문 검증 완료):
  - #25601 autoMemory split — https://github.com/google-gemini/gemini-cli/pull/25601
  - #25716 4-tier prompt-driven memory — https://github.com/google-gemini/gemini-cli/pull/25716
  - #25395 MCP resources tools — https://github.com/google-gemini/gemini-cli/pull/25395
  - #25022 IDE stdio RCE fix — https://github.com/google-gemini/gemini-cli/pull/25022
  - #25586 topic narration default-on — https://github.com/google-gemini/gemini-cli/pull/25586
  - #25342 ripgrep SEA bundling — https://github.com/google-gemini/gemini-cli/pull/25342
  - #25841 ripgrep npm tarball exclude — https://github.com/google-gemini/gemini-cli/pull/25841
  - #25814 Headless Trust Enforcement — https://github.com/google-gemini/gemini-cli/pull/25814
  - #25874 Trust error message — https://github.com/google-gemini/gemini-cli/pull/25874
  - #25341 YOLO not downgraded — https://github.com/google-gemini/gemini-cli/pull/25341
  - #25515 /clear plan reset — https://github.com/google-gemini/gemini-cli/pull/25515
  - #25626 ACP auto memory startup — https://github.com/google-gemini/gemini-cli/pull/25626
  - #25827 SessionStart systemMessage duplicate (OPEN) — https://github.com/google-gemini/gemini-cli/pull/25827
- 보조 PR:
  - #25513 Vertex routing — https://github.com/google-gemini/gemini-cli/pull/25513
  - #25256 @ file watcher — https://github.com/google-gemini/gemini-cli/pull/25256
  - #25498 gemini gemma — https://github.com/google-gemini/gemini-cli/pull/25498
  - #17865 /new alias — https://github.com/google-gemini/gemini-cli/pull/17865
  - #25801 /clear (new) fix — https://github.com/google-gemini/gemini-cli/pull/25801
  - #25147 skill recurrence gate — https://github.com/google-gemini/gemini-cli/pull/25147
  - #25421 skill-creator integration — https://github.com/google-gemini/gemini-cli/pull/25421
  - #25327 skill default post-submit — https://github.com/google-gemini/gemini-cli/pull/25327
  - #25816 jsonl session log support — https://github.com/google-gemini/gemini-cli/pull/25816
  - #24556 task tracker docs — https://github.com/google-gemini/gemini-cli/pull/24556

---

## 13. 조사 신뢰도

| 항목 | 신뢰도 | 비고 |
|------|--------|------|
| Breaking Changes | ⬛⬛⬛⬛⬛ | 사전 컨텍스트 핵심 PR 7개 + 추가 PR 8개 본문 직접 fetch 검증 |
| 새 기능 | ⬛⬛⬛⬛⬜ | 주요 15개 중 핵심 5개는 본문 검증, 나머지는 release notes title 기반 |
| Deprecation | ⬛⬛⬛⬜⬜ | v0.40.0에 명시적 deprecation note 없음. 행동 변화에서 도출 |
| 설정 변경 | ⬛⬛⬛⬛⬛ | PR #25601, #25586 본문에서 schema 변경 직접 확인 |
| 보안 패치 | ⬛⬛⬛⬛⬛ | PR #25022, #25814 본문 직접 확인 |
| bkit 영향 hint | ⬛⬛⬛⬜⬜ | **추정**. Phase 2에서 코드 grep으로 확정 필요 |

---

**Phase 2로 전달할 핵심 검증 질문**:
1. bkit `mcp/bkit-server.js`가 주입하는 trust 우회 환경변수의 정확한 이름은?
2. bkit이 `experimental.memoryManager` 토글에서 (a) 서브에이전트 swap 의도였는가, (b) background extraction 의도였는가? → autoMemory 신규 토글 도입 여부 결정
3. bkit이 `~/.gemini/tmp/<hash>/memory/MEMORY.md` (private tier 새 경로)를 사용 또는 가정하는 코드가 있는가?
4. bkit baseline runner가 topic update narration default-on으로 noisy해지지 않는가?
5. bkit-server가 MCP resources를 export할 가치가 있는 정책/매뉴얼 자료가 있는가?
