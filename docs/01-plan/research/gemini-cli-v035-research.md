# Gemini CLI v0.35.0 변경사항 조사 보고서

> 조사일: 2026-03-21 (초판) -> 2026-03-23 (2차) -> **2026-03-23 (3차 최종갱신)**
> 조사 범위: v0.34.0 (이전 Stable) -> v0.35.0 (신규 Stable, 2026-03-24 확정)
> 조사 주체: gemini-researcher 에이전트
> 갱신 사유: v0.35.0 Stable npm `latest` 태그 확정, preview.3~5 패치 내역 확인, v0.36.0-preview.0 선행 조사 추가

---

## 1. 버전 개요

| 구분 | 내용 |
|------|------|
| **현재 Stable** | **v0.35.0** (2026-03-24T20:06:31Z, 159 commits from v0.34.0) |
| **이전 Stable** | v0.34.0 (2026-03-17, 150+ PR, 81명 기여자) |
| **Preview** | **v0.36.0-preview.0** (2026-03-24T19:59:27Z) |
| **Nightly** | v0.36.0-nightly.20260323.6055c4707 (2026-03-23T23:30:18Z) |
| **npm dist-tags (실측)** | `latest`=0.35.0, `preview`=0.36.0-preview.0, `nightly`=0.36.0-nightly.20260323 |
| **릴리스 주기** | Stable/Preview: 매주 화요일 UTC 20:00 / Nightly: 매일 UTC 00:00 |
| **기여자** | 52명 (12명 첫 기여자) |

### 1.1 v0.35.0 Preview -> Stable 타임라인 (npm publish 실측)

| 버전 | 발행일 | 내용 |
|------|--------|------|
| preview.1 | 2026-03-17T20:59 | 주요 기능 집중 (JIT Context, 도구 격리, CJK, 병렬 스케줄러 등) |
| preview.2 | 2026-03-19T19:11 | 단일 cherry-pick: JIT Context git root traversal 수정 ([#23074](https://github.com/google-gemini/gemini-cli/pull/23074)) |
| preview.3 | 2026-03-23T18:50 | cherry-pick: "allow always" 명령 경로 보존 수정 ([#23558](https://github.com/google-gemini/gemini-cli/pull/23558)) |
| preview.4 | 2026-03-23T20:07 | 온보딩 텔레메트리 설정 + VS Code User-Agent 통합 + 확장 제거 동작 복구 |
| preview.5 | 2026-03-23T23:16 | cherry-pick (충돌 해결): preview.4 패치 보완 ([#23585](https://github.com/google-gemini/gemini-cli/pull/23585)) |
| **0.35.0 Stable** | **2026-03-24T20:06** | **preview.5 기반 최종 프로모션** |

### 1.2 v0.35.0 주요 테마

1. **JIT Context Loading 기본화** - GEMINI.md 지연 로딩 기본 전환
2. **서브에이전트 도구 격리** - 에이전트별 독립 도구 레지스트리
3. **CJK 입력 지원 개선** - 한국어/중국어/일본어 IME + full Unicode scalar values
4. **병렬 도구 스케줄러** - Safe 도구(read-only, subagent) 동시 실행
5. **확장 암호학적 검증** - 확장 업데이트 서명 검증
6. **커스텀 키바인딩** - 사용자 정의 단축키 시스템

---

## 2. Breaking Changes (갱신)

### 2.1 v0.35.0 Breaking Changes (마이그레이션 대상)

| # | 항목 | 이전 동작 | 이후 동작 | 영향도 | bkit 영향 | PR |
|---|------|-----------|-----------|--------|-----------|-----|
| 1 | **JIT Context Loading 기본화** | GEMINI.md eager 로딩 | `experimental.jitContext = true` 기본값. `ContextManager`가 `discoverContext(accessedPath)` 호출 시 lazy 로딩 | **높음** | `import-resolver.js` 캐시 TTL 30s 대응 완료. `@import` 해석 시점 변경. `context-fork.js` JIT 환경 검증 필요 | [#22736](https://github.com/google-gemini/gemini-cli/pull/22736) |
| 2 | **SandboxManager 통합** | 프로세스 스포닝 직접 호출 | 모든 process-spawning 도구가 SandboxManager 통과. bubblewrap(Linux), seccomp 필터링 | 중간 | Hook 스크립트 실행 환경 검토 필요. macOS에서는 영향 미미 | [#22231](https://github.com/google-gemini/gemini-cli/pull/22231) |
| 3 | **CoreToolScheduler 제거** | 레거시 순차 실행 스케줄러 | 이벤트 기반 스케줄러로 완전 교체. Safe 도구(read-only, subagent) 병렬 실행 | 낮음 | 내부 변경, 직접 영향 없음 | [#21955](https://github.com/google-gemini/gemini-cli/pull/21955) |

### 2.2 preview.2 이후 추가된 Breaking 수준 변경 (preview.3~5 -> Stable)

| # | 항목 | 설명 | 영향도 | bkit 영향 | PR |
|---|------|------|--------|-----------|-----|
| 4 | **"allow always" 명령 경로 보존** | `normalizeCommandName`이 전체 경로를 보존하도록 변경. 이전에는 바이너리 이름만 추출. `auto-saved.toml` 정책 파일에 전체 경로 저장 | 중간 | bkit Hook 스크립트가 경로 기반 명령을 사용하는 경우 정책 파일 호환성 확인 필요 | [#23558](https://github.com/google-gemini/gemini-cli/pull/23558) |
| 5 | **확장 제거 동작 복구** | 로드 실패 확장의 자동 삭제 동작을 복구(revert). skip-and-log 방식으로 복원 | 낮음 | 확장을 직접 관리하지 않으므로 영향 없음 | [#23317](https://github.com/google-gemini/gemini-cli/pull/23317) |

> **참고**: preview.3~5는 cherry-pick 패치 위주로, preview.1에 집중된 기능적 Breaking Change는 추가되지 않음.

---

## 3. 새로운 기능 (전체 목록, preview.2 이후 추가분 구분)

### 3.1 preview.1 기반 주요 기능 (기존 조사 확인)

| # | 기능 | 설명 | bkit 활용 가능성 | PR/참조 |
|---|------|------|-----------------|---------|
| 1 | **JIT Context Loading** | GEMINI.md 지연 로딩 기본화. 성능 개선 + 메모리 절약 | **높음**: 대규모 컨텍스트 최적화 | [#22736](https://github.com/google-gemini/gemini-cli/pull/22736) |
| 2 | **서브에이전트 도구 격리** | 에이전트별 독립 도구 레지스트리 | **높음**: 보안 및 안정성 강화 | [#22891](https://github.com/google-gemini/gemini-cli/pull/22891) |
| 3 | **커스텀 키바인딩** | `~/.gemini/keybindings.json` + Kitty protocol 키 지원 | 중간: bkit 전용 단축키 번들 가능 | - |
| 4 | **`--admin-policy` 플래그** | 보충 관리자 정책 지정 | **높음**: Enterprise 정책 관리 | - |
| 5 | **`disableAlwaysAllow` 설정** | "항상 허용" 비활성화 설정 | **높음**: Enterprise/Starter 보안 | [#23012](https://github.com/google-gemini/gemini-cli/pull/23012) |
| 6 | **병렬 도구 스케줄러** | 모델 기반 도구 병렬 실행. Safe 도구 동시 실행 허용 | **높음**: 실행 속도 향상 | [#21955](https://github.com/google-gemini/gemini-cli/pull/21955) |
| 7 | **확장 암호학적 검증** | 확장 업데이트 시 서명 검증 | 중간: 배포 보안 강화 | - |
| 8 | **CJK 입력 지원** | 한국어/중국어/일본어 IME + full Unicode scalar values | **높음**: 한국어 사용자 필수 | [#3014](https://github.com/google-gemini/gemini-cli/issues/3014) |
| 9 | **Vim yank/paste 확장** | X, ~, r, f/F/t/T 모션, yank(y)/paste(p/P) + unnamed register | 낮음: 사용자 편의 | - |
| 10 | **코드 분할/지연 UI 로딩** | 시작 시간 단축을 위한 deferred loading | 중간: 자동 적용 | - |
| 11 | **Browser Agent 개선** | Chrome DevTools MCP pre-built 번들. 도메인 제한(allowlist) + 입력 차단 오버레이 | 낮음: bkit 미사용 | - |
| 12 | **"All the above" 멀티 선택** | AskUser 질문에서 전체 선택 옵션 | 낮음: UX 편의 | - |
| 13 | **서브에이전트 turn/time 제한 증가** | 서브에이전트의 턴/시간 제한 상향 | 중간: bkit 에이전트 팀 타임아웃 완화 | - |
| 14 | **프로젝트 메모리 중복 제거** | JIT Context 활성화 시 메모리 deduplication | 중간: 토큰 효율성 개선 | - |
| 15 | **AgentSession 추상화** | 에이전트 인터페이스 통합 구조 도입 | 중간: 내부 아키텍처 개선 | - |
| 16 | **Task Tracker 정책 제어** | TodoList 표시 + 전용 정책 컨트롤 | 중간: 태스크 관리 보안 강화 | - |
| 17 | **web_fetch Stage 1/2 보안** | web_fetch 도구 보안 및 일관성 개선 | 낮음: 자동 적용 | - |

### 3.2 preview.3~5에서 추가된 기능 (preview.2 이후 신규)

| # | 기능 | 설명 | bkit 활용 가능성 | PR |
|---|------|------|-----------------|-----|
| 18 | **온보딩 텔레메트리** | 초기 설정 과정 텔레메트리 수집 | 낮음: 자동 적용. 프라이버시 정책 확인 권장 | [#23118](https://github.com/google-gemini/gemini-cli/pull/23118) |
| 19 | **VS Code User-Agent 통합** | VS Code 트래픽을 위한 통합 User-Agent 포맷 | 낮음: IDE 통합 시 참고 | [#23256](https://github.com/google-gemini/gemini-cli/pull/23256) |

---

## 4. 버그 수정 (preview.2 이후 추가분 포함)

### 4.1 기존 확인된 버그 수정 (preview.1~2)

| # | 이슈/PR | 설명 | 버전 | bkit 영향 |
|---|---------|------|------|-----------|
| 1 | **CJK 입력 지원** | 한국어 입력 안정성 확보 | preview.1 | **높음**: 한국어 사용자 필수 |
| 2 | JIT Context 버그 수정 | read_file, read_many_files, memoryDiscovery 컨텍스트 로딩 안정성 | preview.1 | 컨텍스트 관리 |
| 3 | [#18514](https://github.com/google-gemini/gemini-cli/pull/18514) | BeforeAgent/AfterAgent 불일치 수정 | preview.1 | **높음**: Hook 시스템 정합성 |
| 4 | [#21124](https://github.com/google-gemini/gemini-cli/pull/21124) | 고아 프로세스 정리 (PTY abort 시 자식 프로세스 관리) | preview.1 | Hook 안정성 |
| 5 | [#22754](https://github.com/google-gemini/gemini-cli/pull/22754) | `truncateString` surrogate pair 수정 (CJK 문자열 처리) | preview.1 | 중간: CJK 문자열 |
| 6 | [#22069](https://github.com/google-gemini/gemini-cli/pull/22069) | MCP Tool FQN validation 수정 + schema export | preview.1 | **높음**: MCP 연동 안정성 |
| 7 | [#20439](https://github.com/google-gemini/gemini-cli/pull/20439) | AfterAgent retry path stopHookActive 전파 | preview.1 | **높음**: Hook 재시도 안정성 |
| 8 | [#23074](https://github.com/google-gemini/gemini-cli/pull/23074) | JIT Context git root traversal 수정 (git repo 밖 탐색 방지) | preview.2 | **높음**: bkit 프로젝트 구조 |

### 4.2 preview.3~5에서 추가된 버그 수정 (신규)

| # | 이슈/PR | 설명 | bkit 영향 |
|---|---------|------|-----------|
| 9 | [#23558](https://github.com/google-gemini/gemini-cli/pull/23558) | **"allow always" 명령 경로 보존**: `normalizeCommandName`이 전체 경로 보존. 관련 이슈 [#16450](https://github.com/google-gemini/gemini-cli/issues/16450) | 중간: auto-saved.toml 정책 파일 포맷 변경 |
| 10 | [#23317](https://github.com/google-gemini/gemini-cli/pull/23317) | **확장 제거 동작 복구**: 로드 실패 확장을 자동 삭제하던 동작([#21772](https://github.com/google-gemini/gemini-cli/pull/21772))을 revert. skip-and-log 복원 | 낮음: 확장 안정성 향상 |
| 11 | [#23585](https://github.com/google-gemini/gemini-cli/pull/23585) | preview.4 충돌 해결 cherry-pick | 낮음: 릴리스 안정성 |

### 4.3 Stable 릴리스 노트에 명시된 추가 수정

| # | 항목 | 설명 | bkit 영향 |
|---|------|------|-----------|
| 12 | Cursor clamping | NORMAL 모드 삭제 후 커서 위치 보정 | 낮음: Vim 모드 UX |
| 13 | 언어 감지 LSP 3.18 | Language detection identifiers 업데이트 | 낮음: 자동 적용 |
| 14 | 불완전 MCP 서버 설정 처리 | 설정 핸들링 개선 | 중간: MCP 연동 안정성 |

---

## 5. Deprecation 예고

| # | 항목 | 예고 버전 | 제거 완료/예정 | 현재 대안 | bkit 영향 |
|---|------|-----------|---------------|-----------|-----------|
| 1 | `experimental.plan` 설정 | v0.33.0 | v0.34.0에서 제거됨 | Plan Mode 기본 활성화 | 설정 참조 삭제 완료 |
| 2 | `--experimental-acp` 플래그 | v0.33.x | v0.34.0에서 제거됨 | `--acp` 사용 | 미사용 |
| 3 | CoreToolScheduler | v0.34.0 | **v0.35.0에서 제거됨** | 이벤트 기반 스케줄러 | 내부, 영향 없음 |
| 4 | `excludeTools` (extension.json) | v0.33.x | 권장 대안 존재 | TOML 정책 `deny` decision | 정책 마이그레이션 |
| 5 | `tools.exclude` (settings.json) | 미명시 | 권장 대안 존재 | TOML 정책 `deny` decision | 정책 마이그레이션 |
| 6 | `Object.create()`/`Reflect` (정책) | v0.35.0 | **v0.35.0에서 금지** | 정책 TOML에서 JS 표현식 사용 금지 | 정책 검증 시 주의 |

---

## 6. 설정/구성 변경

### 6.1 신규 settings.json 항목

| 설정 항목 | 설명 | bkit 영향 | 도입 버전 |
|-----------|------|-----------|-----------|
| `security.disableAlwaysAllow` | "항상 허용" 비활성화 | Enterprise 보안 강화 | v0.35.0 |
| `experimental.jitContext` | JIT Context 활성화 (기본 true) | 컨텍스트 전략 변경 | v0.35.0 |

### 6.2 신규 TOML 정책 필드

| 필드 | 설명 | bkit `policy.js` 지원 | bkit 영향 |
|------|------|----------------------|-----------|
| `subagent` | 서브에이전트 범위 지정 | 지원 (`generateSubagentRules()`) | 에이전트별 정책 분리 |
| `mcpName` | MCP 서버 단위 타겟팅 | **미지원** (추가 필요) | 공식 문서: "FQN 수동 작성보다 robust" |
| `modes` | 승인 모드별 규칙 (`default`/`autoEdit`/`plan`/`yolo`) | **부분 지원** (P0 검증 필요) | 모드별 차별화 정책 |
| `interactive` | 인터랙티브/비인터랙티브 제한 | **미지원** (추가 권장) | CI/CD 정책 분리 |
| `deny_message` | 거부 시 사용자+모델 메시지 | 지원 (Starter 템플릿 활용) | UX 향상 |

> **P0 `modes` 값 불일치**: bkit `policy.js` 332행에서 `modes: ['plan_mode']`를 사용하나, 공식 문서의 유효 값은 `default`, `autoEdit`, `plan`, `yolo`. `plan_mode`가 아닌 `plan`이 올바른 값일 가능성 높음. **즉시 검증 필요.**

### 6.3 신규 파일 형식

| 파일 | 위치 | 도입 버전 |
|------|------|-----------|
| `keybindings.json` | `~/.gemini/keybindings.json` | v0.35.0 |

---

## 7. v0.36.0-preview.0 선행 조사

> **발행일**: 2026-03-24T19:59:27Z (v0.35.0 Stable과 거의 동시 발행)
> **Full Changelog**: [v0.35.0-preview.5...v0.36.0-preview.0](https://github.com/google-gemini/gemini-cli/compare/v0.35.0-preview.5...v0.36.0-preview.0)

### 7.1 Breaking Changes

| # | 항목 | 이전 동작 | 이후 동작 | bkit 영향 | PR |
|---|------|-----------|-----------|-----------|-----|
| 1 | **정책 `toolName` 필수화** | `toolName` 생략 시 모든 도구에 암묵적 적용 | `toolName` 명시 필수. 전체 매칭은 `toolName = "*"` 작성 필요. 빈 문자열/미지정 시 validation 실패 | **높음**: bkit `policy.js`의 TOML 생성 로직에서 `toolName` 누락 규칙 전수 검사 필요 | [#23330](https://github.com/google-gemini/gemini-cli/pull/23330) |

### 7.2 주요 새 기능

| # | 기능 | 설명 | 향후 bkit 영향 |
|---|------|------|---------------|
| 1 | **Strict macOS Seatbelt 샌드박싱** | Seatbelt allowlist 기반 파일/네트워크 접근 제한 | **높음**: macOS에서 Hook 스크립트 실행 환경 제한 가능. bkit 사용자 주요 플랫폼이 macOS |
| 2 | **Native Windows 샌드박싱** | explicit deny 인터페이스로 프로세스 격리 | 낮음: Windows bkit 사용자가 적을 경우 |
| 3 | **Git Worktree 지원** | 격리된 병렬 세션을 위한 git worktree 지원. 동적 macOS 샌드박스 확장 포함 | **높음**: 병렬 에이전트 세션 운영 패턴에 활용 가능 |
| 4 | **서브에이전트 멀티 레지스트리** | 도구 필터링 기능이 있는 다중 레지스트리 아키텍처 | **높음**: bkit 에이전트 팀의 도구 격리 고도화 |
| 5 | **실험적 메모리 매니저 에이전트** | `save_memory` 도구를 대체하는 에이전트 기반 메모리 관리 | 중간: bkit 메모리 시스템과 통합 검토 |
| 6 | **AgentSession 추상화 확장** | `LegacyAgentSession` 호환성 레이어 + 에이전트 중심 이벤트 체계 | 중간: Hook 시스템 이벤트 모델 변화 모니터링 |
| 7 | **ModelChain / 동적 모델 해석** | `ModelConfigService`를 통한 순차 모델 체이닝 | 중간: 모델 라우팅 전략 고도화 |
| 8 | **Write-protected 거버넌스 파일** | 거버넌스 파일 쓰기 보호 | 중간: 정책 파일 보안 강화 |
| 9 | **Plan Mode 비인터랙티브 지원** | 비인터랙티브 컨텍스트에서 Plan Mode 사용 가능 | **높음**: CI/CD 파이프라인에서 Plan Mode 활용 |
| 10 | **BeforeTool hook 'ask' decision** | BeforeTool 훅에서 'ask' 결정 지원 | **높음**: bkit Hook 시스템에 새로운 결정 유형 추가 가능 |

### 7.3 주요 버그 수정

| # | 항목 | 설명 | bkit 영향 |
|---|------|------|-----------|
| 1 | 터미널 이스케이프 시퀀스 누출 | 종료 시 이스케이프 시퀀스 누출 방지 | 낮음: UX 안정성 |
| 2 | 정책 경로 tilde 확장 | `settings.json`의 정책 경로에서 `~` 확장 | 중간: 경로 처리 호환성 |
| 3 | 서브에이전트 중복 thought 추가 | 서브에이전트 출력 중복 방지 | 중간: 에이전트 출력 정합성 |
| 4 | Skill 활성화 채팅 기록 | 스킬 활성화가 채팅 히스토리에 기록 | 낮음: 디버깅 용이성 |
| 5 | stale closure 설정 로딩 | `onModelChange`에서 지연 설정 로딩 | 중간: 설정 관리 안정성 |

---

## 8. 마이그레이션 우선순위 요약 (2026-03-23 최종갱신)

### P0: 즉시 확인 필요

- [ ] **`modes` 값 불일치 검증**: `policy.js` 332행 `plan_mode` vs 공식 문서 `plan` -- Gemini CLI 소스 또는 실제 동작으로 확인
- [ ] **MCP FQN validation** ([#22069](https://github.com/google-gemini/gemini-cli/pull/22069)): v0.34.0 FQN 표준화와 v0.35.0 수정 정합성 확인
- [ ] **v0.36.0 대비: `toolName` 필수화** ([#23330](https://github.com/google-gemini/gemini-cli/pull/23330)): bkit `policy.js`에서 `toolName` 누락 규칙이 있는지 전수 검사. v0.36.0에서 validation 실패 위험

### P1: v0.35.0 Stable 대응 (즉시)

- [x] ~~`version.js` Feature Gate 추가~~ -> 7개 플래그 등록 완료
- [x] ~~`import-resolver.js` JIT 모드 대응~~ -> 캐시 TTL 30s 대응 완료
- [ ] JIT Context Loading + `@import` 패턴 통합 테스트
- [ ] `context-fork.js` JIT 환경 동작 검증
- [ ] BeforeAgent/AfterAgent Hook 수정 ([#18514](https://github.com/google-gemini/gemini-cli/pull/18514), [#20439](https://github.com/google-gemini/gemini-cli/pull/20439)) 호환성 확인
- [ ] CJK(한국어) 입력 개선 사용자 테스트
- [ ] "allow always" 경로 보존 변경 ([#23558](https://github.com/google-gemini/gemini-cli/pull/23558))이 bkit Hook 스크립트에 미치는 영향 확인

### P2: 기능 고도화 (v0.35.0 이후)

- [x] ~~`deny_message` TOML 필드~~ -> Starter 템플릿에서 활용 중
- [ ] `mcpName` TOML 필드 지원 추가 (공식 권장)
- [ ] `interactive` TOML 필드 지원 (CI/CD 분리)
- [ ] `security.disableAlwaysAllow` Starter 기본 정책 통합
- [ ] `--admin-policy` Enterprise 배포 패턴 설계
- [ ] 커스텀 키바인딩 프리셋 번들 검토

### P3: v0.36.0 선행 대비

- [ ] `toolName = "*"` 명시적 와일드카드 대응 (`policy.js` TOML 생성기 검토)
- [ ] macOS Seatbelt 샌드박싱이 bkit Hook 스크립트에 미치는 영향 조사
- [ ] Git Worktree 병렬 세션 패턴 설계 검토
- [ ] BeforeTool hook 'ask' decision 활용 방안 설계

---

## 9. 알려진 이슈 (v0.35.0 관련)

| # | 이슈 | 설명 | 심각도 | 상태 |
|---|------|------|--------|------|
| 1 | [#22415](https://github.com/google-gemini/gemini-cli/issues/22415) | gemini-3.1-pro-preview에서 CLI 무한 대기 ("This is taking a bit longer"). 비정상 API 요청 급증 | 높음 | 모델 의존 |
| 2 | [#20731](https://github.com/google-gemini/gemini-cli/issues/20731) | "Initializing..." 무한 행 (Windows TUI). aggressive auto-updater가 롤백 방해 | 중간 | Windows 한정 |
| 3 | [#22141](https://github.com/google-gemini/gemini-cli/issues/22141) | 소규모 코드 편집에서 극심한 지연 (1시간+) | 높음 | 모델 의존 |

---

## 10. bkit 코드베이스 현황

### 10.1 핵심 의존성 맵

| 모듈 | 파일 | v0.35.0 영향 | 상태 |
|------|------|-------------|------|
| version.js | `lib/gemini/version.js` | 지원 범위 확장 | Feature Flags 7개 등록 완료 |
| import-resolver.js | `lib/gemini/import-resolver.js` | JIT 호환성 | 캐시 TTL 30s 대응 완료 |
| policy.js | `lib/gemini/policy.js` | 새 필드 지원 | **P0: modes 값 불일치 검증 필요** |
| hooks.js | `lib/gemini/hooks.js` | Hook 수정 호환 | P1: BeforeAgent/AfterAgent 검증 필요 |
| context-fork.js | `lib/gemini/context-fork.js` | JIT 환경 영향 | P1: 검증 필요 |
| platform.js | `lib/gemini/platform.js` | 플랫폼 어댑터 | 검토 필요 |
| tools.js | `lib/gemini/tools.js` | 도구 메타데이터 | 검토 필요 |
| tracker.js | `lib/gemini/tracker.js` | Task Tracker | 검토 필요 |

### 10.2 버전 Feature Gates (version.js)

| Feature Gate | 도입 버전 | 상태 |
|-------------|-----------|------|
| hasJITContextLoading | v0.35.0+ | 등록 완료 |
| hasToolIsolation | v0.35.0+ | 등록 완료 |
| hasParallelToolScheduler | v0.35.0+ | 등록 완료 |
| hasAdminPolicy | v0.35.0+ | 등록 완료 |
| hasDisableAlwaysAllow | v0.35.0+ | 등록 완료 |
| hasCryptoVerification | v0.35.0+ | 등록 완료 |
| hasCustomKeybindings | v0.35.0+ | 등록 완료 |

### 10.3 bkit 준비도 (종합)

| 항목 | 준비도 | 비고 |
|------|--------|------|
| Feature Flags | 90% | 7개 등록 완료. 실동작 통합 테스트 미완 |
| Breaking Change 대응 | 60% | JIT Context 코드 대응 완료. 통합 테스트 + modes 검증 미완 |
| Policy Engine | 75% | `deny_message` 지원. `mcpName`, `interactive`, `modes` 미완 |
| Hook System | 50% | BeforeAgent/AfterAgent 수정 호환성 미검증 |
| Testing | 40% | 단위 테스트 있으나 v0.35.0 통합 테스트 미완 |
| **전체** | **63%** | P0 modes 불일치 해결 시 ~70% |

---

## 11. 조사 신뢰도

| 항목 | 신뢰도 | 비고 |
|------|--------|------|
| Breaking Changes | **5/5** | v0.35.0 Stable 릴리스 노트 + preview.1~5 전체 추적 + npm 실측 완료 |
| 새 기능 | **4/5** | Stable 릴리스 노트 확인. 일부 세부 기능은 PR 단위 미확인 |
| Deprecation | 3/5 | 공식 문서 명시 항목만. 암묵적 deprecation 미확인 |
| 설정 변경 | 4/5 | geminicli.com/docs/reference/configuration 실측 |
| `modes` 값 불일치 | 2/5 | 공식 문서 vs bkit 코드 차이 발견이나 실제 동작 미검증 |
| preview.3~5 패치 내역 | **5/5** | 개별 PR + commit diff 실측 완료 |
| v0.36.0-preview.0 | **4/5** | 릴리스 노트 + PR #23330 직접 확인. 상세 코드 변경은 미확인 |
| bkit 코드 대응 | 5/5 | 실제 코드 읽기로 확인 |

---

## 12. 원문 참조 링크

### v0.35.0 관련
- [v0.35.0 Stable Release](https://github.com/google-gemini/gemini-cli/releases/tag/v0.35.0) - 2026-03-24
- [v0.35.0-preview.5 Release](https://github.com/google-gemini/gemini-cli/releases/tag/v0.35.0-preview.5) - 2026-03-23
- [v0.35.0-preview.4 Release](https://github.com/google-gemini/gemini-cli/releases/tag/v0.35.0-preview.4) - 2026-03-23
- [v0.35.0-preview.3 Release](https://github.com/google-gemini/gemini-cli/releases/tag/v0.35.0-preview.3) - 2026-03-23
- [v0.35.0-preview.2 Release](https://github.com/google-gemini/gemini-cli/releases/tag/v0.35.0-preview.2) - 2026-03-19
- [v0.35.0-preview.1 Release](https://github.com/google-gemini/gemini-cli/releases/tag/v0.35.0-preview.1) - 2026-03-17
- [Full Changelog v0.34.0...v0.35.0](https://github.com/google-gemini/gemini-cli/compare/v0.34.0...v0.35.0) - 159 commits

### v0.36.0 관련
- [v0.36.0-preview.0 Release](https://github.com/google-gemini/gemini-cli/releases/tag/v0.36.0-preview.0) - 2026-03-24
- [PR #23330: Force toolName in policy](https://github.com/google-gemini/gemini-cli/pull/23330) - Breaking Change

### 주요 PR (preview.3~5 패치)
- [PR #23558: "allow always" 경로 보존](https://github.com/google-gemini/gemini-cli/pull/23558) - preview.3
- [PR #23317: 확장 제거 동작 복구](https://github.com/google-gemini/gemini-cli/pull/23317) - preview.4
- [PR #23118: 온보딩 텔레메트리](https://github.com/google-gemini/gemini-cli/pull/23118) - preview.4
- [PR #23256: VS Code User-Agent 통합](https://github.com/google-gemini/gemini-cli/pull/23256) - preview.4
- [PR #23585: preview.5 충돌 해결](https://github.com/google-gemini/gemini-cli/pull/23585) - preview.5

### 공식 문서
- [GitHub Releases](https://github.com/google-gemini/gemini-cli/releases)
- [Latest Changelog](https://geminicli.com/docs/changelogs/latest/)
- [Preview Changelog](https://geminicli.com/docs/changelogs/preview/)
- [Configuration Reference](https://geminicli.com/docs/reference/configuration/)
- [Policy Engine Reference](https://geminicli.com/docs/reference/policy-engine/)
- [Hooks Reference](https://geminicli.com/docs/hooks/reference/)
- [Release Schedule](https://geminicli.com/docs/releases/)
- [@google/gemini-cli npm](https://www.npmjs.com/package/@google/gemini-cli)

### 관련 이슈
- [#22415: CLI 무한 대기](https://github.com/google-gemini/gemini-cli/issues/22415)
- [#20731: Windows TUI 행](https://github.com/google-gemini/gemini-cli/issues/20731)
- [#22141: 극심한 편집 지연](https://github.com/google-gemini/gemini-cli/issues/22141)
- [#3014: CJK 입력](https://github.com/google-gemini/gemini-cli/issues/3014)
- [#16450: allow always 경로 문제](https://github.com/google-gemini/gemini-cli/issues/16450)
- [#20635: 정책 toolName 암묵적 매칭 문제](https://github.com/google-gemini/gemini-cli/issues/20635)
