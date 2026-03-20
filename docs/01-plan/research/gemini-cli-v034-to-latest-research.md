# Gemini CLI v0.34.0 ~ v0.36.0-nightly 변경사항 조사 보고서

> 조사일: 2026-03-19
> 조사 범위: v0.33.0 (이전 안정 버전) -> v0.34.0 (현재 안정) -> v0.35.0-preview.1 -> v0.36.0-nightly
> 조사자: gemini-researcher agent
> bkit 현재 버전: v1.5.9 (Gemini CLI v0.34.0 대상)

---

## 1. 버전 개요

### 1.1 릴리스 타임라인

| 버전 | 릴리스일 | 유형 | 주요 테마 |
|------|---------|------|----------|
| v0.33.0 | 2026-03-11 | Stable | Plan Mode 도입, 서브에이전트 UX, A2A HTTP 인증 |
| v0.33.1 | 2026-03-12 | Patch | MCP tool FQN 검증 핫픽스 (cherry-pick #22206) |
| v0.33.2 | 2026-03-16 | Patch | 추가 핫픽스 (cherry-pick #22720) |
| **v0.34.0** | **2026-03-17** | **Stable (Latest)** | **Plan Mode 기본 활성화, 샌드박스 확장, 키바인딩 인프라, Tracker CRUD** |
| v0.34.0-preview.4 | 2026-03-16 | Preview | v0.34.0 RC |
| v0.35.0-preview.1 | 2026-03-17 | Preview | JIT Context 기본 활성화, 서브에이전트 격리, 커스텀 키보드 단축키 |
| v0.36.0-nightly | 2026-03-18 | Nightly | 멀티레지스트리 아키텍처, InjectionService, Linux 샌드박스 |

### 1.2 릴리스 규모

- v0.33.0 -> v0.34.0: **150+ merged PR** (대규모 기능 릴리스)
- v0.34.0 -> v0.35.0-preview.1: **100+ merged PR** (서브에이전트/JIT 중심)
- v0.35.0-preview.1 -> v0.36.0-nightly: 추가 인프라 변경

### 1.3 주요 테마

1. **Plan Mode 정식화**: 실험적 -> 기본 활성화, 모델 라우팅 자동화
2. **샌드박스 다양화**: Docker 외에 gVisor (runsc), LXC, Bubblewrap/Seccomp 지원
3. **서브에이전트 강화**: 도구 격리(tool isolation), 독립 컨텍스트, TOML 정책
4. **JIT Context Loading**: 지연 로딩으로 초기 컨텍스트 부하 감소
5. **보안 강화**: disableAlwaysAllow, 확장 암호학적 무결성 검증, OAuth2 개선
6. **UI/UX 현대화**: 커스텀 키바인딩, Vim 모드, 테마 정리, 접근성

---

## 2. Breaking Changes (하위 호환성 깨짐)

### 2.1 확인된 Breaking Changes

| # | 항목 | 이전 동작 | 이후 동작 | 영향 범위 | 도입 버전 | 참조 |
|---|------|-----------|-----------|-----------|-----------|------|
| 1 | `--experimental-acp` 플래그 제거 | `--experimental-acp`로 ACP 활성화 | `--acp`로 변경, Zed 참조 제거 | ACP 사용자 | v0.34.0 | [#21171](https://github.com/google-gemini/gemini-cli/pull/21171) |
| 2 | Deprecated settings 자동 제거 | 비활성 경고만 표시 | `migrateDeprecatedSettings()` 기본 활성화 | 레거시 설정 사용자 | v0.34.0 | [#20682](https://github.com/google-gemini/gemini-cli/pull/20682), [#20657](https://github.com/google-gemini/gemini-cli/issues/20657) |
| 3 | Plan Mode 기본 활성화 | `experimental.plan: true` 필요 | 기본 활성화, `experimental.plan` 불필요 | 모든 사용자 | v0.34.0 | [#21713](https://github.com/google-gemini/gemini-cli/pull/21713) |
| 4 | MCP Tool FQN 표준화 | MCP 도구 이름 비표준 | `mcp_{serverAlias}_{toolName}` 형식 필수 | MCP 서버 사용자 | v0.34.0 | [#21425](https://github.com/google-gemini/gemini-cli/pull/21425), [#21664](https://github.com/google-gemini/gemini-cli/pull/21664) |
| 5 | Gemma 설정 숨김 처리 | 설정 UI에 표시 | `experimental`로 마킹, UI에서 숨김 | Gemma 사용자 | v0.34.0 | [#21471](https://github.com/google-gemini/gemini-cli/pull/21471) |
| 6 | Agent card auth config 플래그 제거 | 인증 설정 플래그 존재 | 플래그 제거, 직접 인증 상태 표시 | A2A 에이전트 사용자 | v0.34.0 | [#20986](https://github.com/google-gemini/gemini-cli/pull/20986) |

### 2.2 잠재적 Breaking Changes (Preview/Nightly에서 확인)

| # | 항목 | 설명 | 예상 도입 | 참조 |
|---|------|------|-----------|------|
| 1 | JIT Context Loading 기본 활성화 | GEMINI.md 로딩 방식 변경 (eager -> lazy) | v0.35.0 | [#22736](https://github.com/google-gemini/gemini-cli/pull/22736) |
| 2 | AgentLoopContext 전면 마이그레이션 | 에이전트 루프 관리 인터페이스 변경 | v0.35.0 | [#22115](https://github.com/google-gemini/gemini-cli/pull/22115) |
| 3 | SandboxManager 통합 | 프로세스 스포닝 도구 자동 샌드박싱 | v0.35.0 | [#22231](https://github.com/google-gemini/gemini-cli/pull/22231) |
| 4 | disableAlwaysAllow 설정 추가 | "항상 허용" 옵션 비활성화 가능 | v0.35.0 | [#21941](https://github.com/google-gemini/gemini-cli/pull/21941) |

### 2.3 bkit 영향 분석

**즉시 대응 필요 (v0.34.0)**:
- `experimental.plan` 설정 참조가 있다면 제거/업데이트 필요
- MCP 서버 이름에 언더스코어(`_`) 사용 중이면 하이픈(`-`)으로 변경 필요
  - MCP FQN 파서가 `mcp_` 프리픽스 이후 첫 언더스코어로 서버명을 판별
  - 서버 별칭에 언더스코어가 있으면 정책 엔진이 잘못된 서버명을 인식

**중기 대응 (v0.35.0 대비)**:
- JIT Context Loading이 기본이 되면 GEMINI.md의 `@import` 패턴 동작 검증 필요
- SandboxManager 통합 시 Hook 스크립트의 프로세스 스포닝 영향 검토

---

## 3. 새로운 기능

### 3.1 v0.34.0 주요 신규 기능

| # | 기능명 | 설명 | bkit 활용 가능성 | 참조 |
|---|--------|------|-----------------|------|
| 1 | **Plan Mode 기본 활성화** | 구조화된 계획 워크플로우가 기본. `/plan` 또는 `Shift+Tab`으로 모드 전환. 읽기 전용 MCP 도구 허용 | 높음: bkit PDCA Plan 단계와 직접 통합 가능 | [#21713](https://github.com/google-gemini/gemini-cli/pull/21713) |
| 2 | **Tracker CRUD 도구** | 내장 태스크 추적 도구 (생성/조회/수정/삭제 + 시각화). `tracker_visualize`로 그래프 출력 | 높음: bkit 태스크 관리와 통합 검토 | [#19489](https://github.com/google-gemini/gemini-cli/pull/19489) |
| 3 | **gVisor (runsc) 샌드박싱** | Docker 런타임으로 gVisor 격리 지원. `GEMINI_SANDBOX=runsc` 설정 | 중간: 보안이 중요한 Enterprise 레벨에서 활용 | [#21062](https://github.com/google-gemini/gemini-cli/pull/21062) |
| 4 | **LXC 컨테이너 샌드박스** (실험적) | LXC/LXD 기반 풀 시스템 컨테이너 격리 | 낮음: 특수 환경에서만 필요 | [#20735](https://github.com/google-gemini/gemini-cli/pull/20735) |
| 5 | **OAuth2 Authorization Code** | A2A 에이전트용 OAuth2 인증 코드 플로우 | 중간: 원격 에이전트 연동 시 활용 | [#21496](https://github.com/google-gemini/gemini-cli/pull/21496) |
| 6 | **Chat Resume Footer** | 세션 종료 시 이어하기(resume) 안내 푸터 표시 | 낮음: UX 개선 자동 적용 | [#20667](https://github.com/google-gemini/gemini-cli/pull/20667) |
| 7 | **/upgrade 커맨드** | 앱 내에서 직접 버전 업그레이드 | 낮음: 사용자 편의 기능 | [#21511](https://github.com/google-gemini/gemini-cli/pull/21511) |
| 8 | **스킬 슬래시 커맨드 활성화** | 슬래시 커맨드로 스킬 직접 활성화 가능 | 높음: bkit 스킬을 슬래시 커맨드로 노출 가능 | [#21758](https://github.com/google-gemini/gemini-cli/pull/21758) |
| 9 | **서브에이전트 TOML 정책** | `subagent` 필드로 에이전트별 세분화된 정책 | 높음: bkit 에이전트별 권한 제어 강화 | [#21431](https://github.com/google-gemini/gemini-cli/pull/21431) |
| 10 | **키바인딩 인프라** | 동적 키바인딩 힌트 생성, 통합 키바인딩 시스템 | 낮음: 기반 인프라, 직접 활용 제한적 | [#21776](https://github.com/google-gemini/gemini-cli/pull/21776) |
| 11 | **모델 Fallback 지원** | 도구 호출 시 2.5 모델로 자동 폴백 | 중간: 안정성 향상 자동 적용 | [#21283](https://github.com/google-gemini/gemini-cli/pull/21283) |
| 12 | **Per-Model Token 사용량** | stream-json 출력에 모델별 토큰 사용량 포함 | 중간: 비용 모니터링에 활용 가능 | [#21839](https://github.com/google-gemini/gemini-cli/pull/21839) |
| 13 | **루프 감지 강화** | 반복 루프 감지에 모델 피드백 활용, 경합 조건 방지 | 중간: 안정성 향상 자동 적용 | [#20763](https://github.com/google-gemini/gemini-cli/pull/20763) |
| 14 | **Unified Keychain Service** | 토큰 저장소를 통합 Keychain으로 마이그레이션 | 낮음: 내부 인프라 변경 | [#21344](https://github.com/google-gemini/gemini-cli/pull/21344) |
| 15 | **확장 레지스트리 URI 설정** | 확장 레지스트리 소스 위치 커스터마이징 | 중간: 프라이빗 레지스트리 지원 | [#20463](https://github.com/google-gemini/gemini-cli/pull/20463) |

### 3.2 v0.33.0 주요 신규 기능 (이전 보고서 보완)

| # | 기능명 | 설명 | bkit 활용 가능성 | 참조 |
|---|--------|------|-----------------|------|
| 1 | **Plan Mode 도입** | `/plan` 커맨드, 읽기 전용 모드, 구조화된 계획 | 높음: 이미 `plan.directory` 활용 중 | [#20972](https://github.com/google-gemini/gemini-cli/pull/20972) |
| 2 | **A2A HTTP 인증** | 원격 에이전트 HTTP 인증 + 인증 카드 디스커버리 | 중간 | [#20510](https://github.com/google-gemini/gemini-cli/pull/20510) |
| 3 | **Plan 서브에이전트** | Plan 모드에서 내장 리서치 서브에이전트 활성화 | 높음: 리서치 단계 자동화 | [#20972](https://github.com/google-gemini/gemini-cli/pull/20972) |
| 4 | **Plan 피드백 어노테이션** | 계획에 피드백 주석 달기, 반복 개선 | 높음: PDCA Check 단계와 연동 | [#20876](https://github.com/google-gemini/gemini-cli/pull/20876) |
| 5 | **TOML 정책 도구 이름 검증** | TOML 정책 파일에서 도구 이름 유효성 검사 | 중간: bkit 정책 파일 안정성 향상 | [#19281](https://github.com/google-gemini/gemini-cli/pull/19281) |
| 6 | **확장 Plan 디렉토리** | `gemini-extension.json`에 `plan.directory` 지원 | 높음: 이미 bkit에서 사용 중 | [#20354](https://github.com/google-gemini/gemini-cli/pull/20354) |
| 7 | **30일 채팅 기록 보존** | 기본 30일 채팅 히스토리 보존 활성화 | 낮음: 자동 적용 | [#20853](https://github.com/google-gemini/gemini-cli/pull/20853) |

### 3.3 v0.35.0-preview.1 주요 신규 기능

| # | 기능명 | 설명 | bkit 활용 가능성 | 참조 |
|---|--------|------|-----------------|------|
| 1 | **JIT Context Loading 기본 활성화** | GEMINI.md 지연 로딩으로 초기 부하 감소 | 높음: bkit의 대규모 컨텍스트에 큰 이점 | [#22736](https://github.com/google-gemini/gemini-cli/pull/22736) |
| 2 | **커스텀 키보드 단축키** | `~/.gemini/keybindings.json`으로 단축키 정의 | 중간: bkit 전용 단축키 제공 가능 | [#21945](https://github.com/google-gemini/gemini-cli/pull/21945) |
| 3 | **서브에이전트 도구 격리** | 서브에이전트별 독립 도구 레지스트리 | 높음: bkit 에이전트 보안 강화 | [#22708](https://github.com/google-gemini/gemini-cli/pull/22708) |
| 4 | **확장 암호학적 무결성 검증** | 확장 업데이트 시 서명 검증 | 중간: bkit 배포 보안 | [#21772](https://github.com/google-gemini/gemini-cli/pull/21772) |
| 5 | **disableAlwaysAllow 설정** | "항상 허용" 옵션 완전 비활성화 가능 | 높음: Enterprise 레벨 보안 정책 | [#21941](https://github.com/google-gemini/gemini-cli/pull/21941) |
| 6 | **Vim 모드 확장** | X, ~, r, f/F/t/T, yank/paste 등 추가 | 낮음: 사용자 편의 | [#21932](https://github.com/google-gemini/gemini-cli/pull/21932) |
| 7 | **`--admin-policy` 플래그** | 보충 관리자 정책 파일 지정 | 높음: Enterprise 정책 배포에 활용 | [#20360](https://github.com/google-gemini/gemini-cli/pull/20360) |
| 8 | **네이티브 gRPC 지원** | A2A 통신을 위한 네이티브 gRPC 프로토콜 라우팅 | 중간: 원격 에이전트 성능 향상 | [#21403](https://github.com/google-gemini/gemini-cli/pull/21403) |
| 9 | **Browser Agent 개선** | Chrome DevTools 번들, 도메인 제한, 입력 차단 오버레이 | 낮음: 브라우저 자동화 시 활용 | [#22213](https://github.com/google-gemini/gemini-cli/pull/22213) |
| 10 | **Silent Retry 메커니즘** | API 에러 시 최대 3회 자동 재시도 | 중간: 안정성 향상 자동 적용 | [#21989](https://github.com/google-gemini/gemini-cli/pull/21989) |

### 3.4 v0.36.0-nightly 주요 신규 기능

| # | 기능명 | 설명 | bkit 활용 가능성 | 참조 |
|---|--------|------|-----------------|------|
| 1 | **멀티레지스트리 아키텍처** | 서브에이전트 도구 필터링을 위한 다중 레지스트리 | 높음: 에이전트별 도구 세트 분리 | [#22712](https://github.com/google-gemini/gemini-cli/pull/22712) |
| 2 | **InjectionService** | 소스 인식 주입 + 백엔드 네이티브 백그라운드 완료 | 중간: 컨텍스트 주입 방식 변화 가능 | [#22544](https://github.com/google-gemini/gemini-cli/pull/22544) |
| 3 | **Tracker 'blocked' 상태** | 태스크에 'blocked' 상태 추가 | 높음: bkit 태스크 관리 정교화 | [#22735](https://github.com/google-gemini/gemini-cli/pull/22735) |
| 4 | **Linux Bubblewrap/Seccomp 샌드박스** | Linux 전용 경량 샌드박스 | 낮음: Linux 환경에서만 해당 | [#22680](https://github.com/google-gemini/gemini-cli/pull/22680), [#22815](https://github.com/google-gemini/gemini-cli/pull/22815) |
| 5 | **AgentSession 추상화** | 통합 에이전트 인터페이스 | 중간: 에이전트 라이프사이클 관리 변화 | [#22270](https://github.com/google-gemini/gemini-cli/pull/22270) |
| 6 | **JIT Context 메모리 중복 제거** | JIT 활성 시 프로젝트 메모리 중복 방지 | 높음: 컨텍스트 효율성 향상 | [#22234](https://github.com/google-gemini/gemini-cli/pull/22234) |

---

## 4. Deprecation 예고 (지원 중단 예정)

| # | 항목 | 예고 버전 | 제거 예정 | 현재 대안 | 참조 |
|---|------|-----------|-----------|-----------|------|
| 1 | `experimental.plan` 설정 | v0.33.0 | v0.34.0 (제거됨) | Plan Mode가 기본 활성화. `defaultApprovalMode: "plan"` 사용 | [#19272](https://github.com/google-gemini/gemini-cli/issues/19272) |
| 2 | `--experimental-acp` 플래그 | v0.33.x | v0.34.0 (제거됨) | `--acp` 사용 | [#21171](https://github.com/google-gemini/gemini-cli/pull/21171) |
| 3 | Gemma 설정 (비실험적) | v0.34.0 | 미정 | `experimental.gemmaModelRouter` 사용 | [#21471](https://github.com/google-gemini/gemini-cli/pull/21471) |
| 4 | 레거시 설정들 (다수) | v0.32.x | v0.34.0 (자동 제거) | `migrateDeprecatedSettings()` 자동 마이그레이션 | [#20682](https://github.com/google-gemini/gemini-cli/pull/20682) |
| 5 | `excludeTools` in gemini-extension.json | v0.33.x | 미정 (권장 대안 존재) | TOML 정책 파일 (`policies/*.toml`)로 대체 권장 | bkit 이미 대응 완료 |

---

## 5. 설정/구성 변경

### 5.1 settings.json 변경사항

| # | 설정 항목 | 변경 유형 | 설명 | bkit 영향 | 도입 버전 |
|---|-----------|-----------|------|-----------|-----------|
| 1 | `defaultApprovalMode` | 값 추가 | `"plan"` 모드 추가 (기존: `"default"`, `"auto_edit"`, `"yolo"`) | bkit Starter 레벨에서 `"plan"` 기본값 검토 | v0.33.0 |
| 2 | `plan.modelRouting` | 신규 | Plan/실행 단계에 따라 Pro/Flash 모델 자동 전환 | bkit Plan 단계 최적화에 활용 가능 | v0.34.0 |
| 3 | `security.disableAlwaysAllow` | 신규 | "항상 허용" 영구 승인 옵션 비활성화 | Enterprise 보안 정책에 활용 | v0.35.0-preview |
| 4 | `security.disableYoloMode` | 신규 | YOLO 모드 완전 차단 | Enterprise/Starter 보안 강화 | v0.34.0+ |
| 5 | `security.enablePermanentToolApproval` | 신규 | "모든 향후 세션에서 허용" 옵션 제어 | 보안 정책 세분화 | v0.34.0+ |
| 6 | `experimental.jitContext` | 신규 | JIT Context Loading 활성화 (v0.35.0에서 기본 `true`) | bkit 컨텍스트 로딩 전략 변경 필요 | v0.35.0-preview |
| 7 | `experimental.enableAgents` | 기본값 변경 | 서브에이전트 기능 기본 `true` | bkit 에이전트가 네이티브 서브에이전트로 동작 | v0.34.0+ |
| 8 | `experimental.modelSteering` | 신규 | 도구 실행 중 모델 가이드 힌트 | 컨텍스트 엔지니어링에 활용 가능 | v0.34.0 |
| 9 | `experimental.directWebFetch` | 신규 | LLM 요약 없이 직접 웹 페칭 | 웹 리서치 성능 향상 | v0.34.0+ |
| 10 | `tools.exclude` | 신규 | 특정 도구를 디스커버리에서 제외 | bkit 레벨별 도구 제한과 중복/보완 | v0.34.0 |
| 11 | `context.discoveryMaxDirs` | 신규 | 최대 디렉토리 스캔 깊이 (기본 200) | 대규모 프로젝트에서 성능 튜닝 | v0.34.0 |
| 12 | `model.compressionThreshold` | 신규 | 컨텍스트 압축 트리거 포인트 (기본 0.5) | 컨텍스트 관리 최적화 | v0.34.0 |
| 13 | `checkpointing.enabled` | 신규 | 세션 복구 체크포인팅 | 긴 세션 안정성 향상 | v0.34.0 |
| 14 | `billing.overageStrategy` | 신규 | 크레딧 초과 시 동작 (`"ask"`, `"always"`, `"never"`) | 비용 관리에 활용 | v0.34.0 |

### 5.2 gemini-extension.json 변경사항

| # | 필드 | 변경 유형 | 설명 | bkit 현재 상태 | 도입 버전 |
|---|------|-----------|------|---------------|-----------|
| 1 | `plan.directory` | 안정화 | Plan 아티팩트 디렉토리 지정 | **이미 사용 중**: `"docs/01-plan"` | v0.33.0 |
| 2 | `themes` | 신규 | 커스텀 테마 정의 (색상, 배경, 보더 등) | 미사용: 활용 검토 가능 | v0.33.0 |
| 3 | `migratedTo` | 신규 | 확장 이전 시 자동 업데이트 감지 URL | 미사용: 향후 리브랜딩 시 활용 | v0.34.0 |
| 4 | `contextFileName` | 안정화 | 컨텍스트 파일명 (기본: GEMINI.md) | **이미 사용 중**: `"GEMINI.md"` | 기존 |

### 5.3 TOML 정책 변경사항

| # | 필드 | 변경 유형 | 설명 | bkit 영향 | 도입 버전 |
|---|------|-----------|------|-----------|-----------|
| 1 | `subagent` | 신규 | 규칙의 서브에이전트 범위 지정 | 에이전트별 정책 분리 가능 | v0.34.0 |
| 2 | `mcpName` | 신규 | MCP 서버 단위 도구 타겟팅 | MCP 정책 정교화 | v0.34.0 |
| 3 | `modes` | 신규 | 승인 모드별 규칙 적용 (`default`, `autoEdit`, `plan`, `yolo`) | 모드별 차별화된 정책 가능 | v0.34.0 |
| 4 | `interactive` | 신규 | 인터랙티브/비인터랙티브 환경 제한 | CI/CD 환경 정책 분리 | v0.34.0 |
| 5 | `deny_message` | 신규 | 거부 시 사용자 정의 설명 메시지 | UX 향상에 활용 가능 | v0.34.0 |

### 5.4 새 파일 형식

| 파일 | 위치 | 설명 | 도입 버전 |
|------|------|------|-----------|
| `keybindings.json` | `~/.gemini/keybindings.json` | VS Code 스타일 키바인딩 커스터마이징 | v0.35.0-preview |
| `.gemini/agents/*.md` | 프로젝트/사용자 레벨 | 커스텀 서브에이전트 정의 (YAML frontmatter) | v0.33.0 |
| `policies/*.toml` | `.gemini/policies/` 또는 확장 `policies/` | TOML 정책 파일 | v0.31.0+ (확장됨 v0.34.0) |

---

## 6. 버그 수정 (주요)

### 6.1 v0.34.0 주요 버그 수정

| # | 이슈 | 설명 | bkit 관련성 | 참조 |
|---|------|------|-------------|------|
| 1 | OOM 크래시 방지 | 장시간 세션에서 ChatRecordingService 메모리 캐시로 OOM 방지 | **높음**: bkit 긴 PDCA 세션 안정성 | [#21502](https://github.com/google-gemini/gemini-cli/pull/21502), [#19608](https://github.com/google-gemini/gemini-cli/pull/19608) |
| 2 | Symlink 무한 재귀 | 심링크 해석 시 무한 재귀 방지 | **높음**: bkit 프로젝트 구조에 심링크 포함 가능 | [#21487](https://github.com/google-gemini/gemini-cli/pull/21487) |
| 3 | Windows 줄바꿈/경로 | Windows에서 줄바꿈과 경로 구분자 버그 수정 | 중간: 크로스 플랫폼 지원 | [#21068](https://github.com/google-gemini/gemini-cli/pull/21068) |
| 4 | OAuth 행 방지 | 비인터랙티브 세션에서 OAuth 행 방지 | 중간: CI/CD 환경 | [#21045](https://github.com/google-gemini/gemini-cli/pull/21045) |
| 5 | Grep 출력 잘림 | 과도하게 긴 라인의 grep 결과 잘림 처리 | 중간: 검색 결과 안정성 | [#21147](https://github.com/google-gemini/gemini-cli/pull/21147) |
| 6 | PTY 리소스 누수 | kill() 및 예외 시 PTY fd 누수 방지 | **높음**: Hook 스크립트 프로세스 관리 | [#21693](https://github.com/google-gemini/gemini-cli/pull/21693) |
| 7 | MCP notifications 지원 | `tools/list_changed` 알림 수정 | 중간: MCP 서버 동적 도구 업데이트 | [#21050](https://github.com/google-gemini/gemini-cli/pull/21050) |
| 8 | 모델 선택 지속성 | 여러 시나리오에서 모델 선택 유지 수정 | 중간: 일관된 모델 사용 | [#21051](https://github.com/google-gemini/gemini-cli/pull/21051) |
| 9 | Plan 잘림 방지 | 승인 대화상자에서 Plan 내용 잘림 방지 | **높음**: bkit Plan 문서 표시 | [#21037](https://github.com/google-gemini/gemini-cli/pull/21037) |
| 10 | GEMINI.md 중복 제거 | 대소문자 무시 파일시스템에서 GEMINI.md 중복 로딩 방지 | **높음**: macOS에서 bkit 사용 시 | [#19915](https://github.com/google-gemini/gemini-cli/pull/19915) |
| 11 | gaxios 스트림 손상 패치 | gaxios v7의 Array.toString() 스트림 손상 수정 | **높음**: API 통신 안정성 | [#21884](https://github.com/google-gemini/gemini-cli/pull/21884) |
| 12 | JSON SSE 손상 살균 | SSE 손상된 JSON 및 도메인 문자열 정리 | 중간: 에러 분류 정확성 | [#21702](https://github.com/google-gemini/gemini-cli/pull/21702) |

### 6.2 v0.35.0-preview 주요 버그 수정

| # | 이슈 | 설명 | bkit 관련성 | 참조 |
|---|------|------|-------------|------|
| 1 | CJK 입력 지원 | CJK 입력 및 전체 유니코드 스칼라 지원 | **높음**: 한국어 입력 안정성 | [#22353](https://github.com/google-gemini/gemini-cli/pull/22353) |
| 2 | JIT Context 버그 | read_file, read_many_files, memoryDiscovery의 JIT 버그 수정 | **높음**: 컨텍스트 로딩 안정성 | [#22679](https://github.com/google-gemini/gemini-cli/pull/22679) |
| 3 | 서로게이트 페어 처리 | truncateString의 서로게이트 페어 처리 | 중간: 멀티바이트 문자 안정성 | [#22754](https://github.com/google-gemini/gemini-cli/pull/22754) |
| 4 | MCP Tool FQN 검증 | FQN 검증, 스키마 내보내기, 와일드카드 수정 | **높음**: bkit MCP 서버 안정성 | [#22069](https://github.com/google-gemini/gemini-cli/pull/22069) |

---

## 7. 성능/최적화 변경

| # | 항목 | 변경 내용 | 예상 효과 | 도입 버전 |
|---|------|-----------|-----------|-----------|
| 1 | Keychain 액세스 캐싱 | API 키 로딩 캐시, 설정 로딩 캐시 | 시작 시간 단축 | v0.34.0 |
| 2 | ChatRecordingService 메모리 캐시 | 인메모리 캐시로 OOM 방지 | 장시간 세션 안정성 향상 | v0.34.0 |
| 3 | JIT Context Loading | GEMINI.md 지연 로딩 | 초기 컨텍스트 부하 대폭 감소 | v0.35.0 |
| 4 | 사용자 할당량/실험 병렬 페칭 | 병렬 API 호출 | 시작 시간 단축 | v0.35.0 |
| 5 | 코드 분할 및 지연 UI 로딩 | 번들 크기 최적화 | 초기 로딩 속도 향상 | v0.35.0 |
| 6 | esbuild 번들 NPM 배포 | npm 패키지에 esbuild 번들 포함 | 설치/시작 속도 향상 | v0.34.0 |
| 7 | TrackerService 의존성 최적화 | 불필요 의존성 제거 | 메모리 사용량 감소 | v0.35.0 |
| 8 | 모델 기반 병렬 도구 스케줄러 | 도구 호출 병렬 실행 | 실행 속도 향상 | v0.35.0 |

---

## 8. 의존성 변경

| 패키지 | 변경 내용 | 주의사항 | 도입 버전 |
|--------|-----------|----------|-----------|
| clipboardy | ~5.2.x로 핀 고정 | 호환성 보장을 위한 버전 고정 | v0.33.0 |
| gaxios | v7 스트림 손상 패치 적용 | Array.toString() 관련 | v0.34.0 |
| esbuild | npm 번들에 포함 | 배포 방식 변경 | v0.34.0 |
| Chrome DevTools | 프리빌트 번들 포함 (Browser Agent) | v0.35.0 Preview | v0.35.0 |

---

## 9. bkit-gemini 구체적 영향도 요약

### 9.1 현재 bkit 구성 호환성 검증

| bkit 구성 요소 | v0.34.0 호환성 | 필요 조치 | 우선순위 |
|---------------|---------------|-----------|----------|
| `gemini-extension.json` | **호환** | `themes`, `migratedTo` 필드 활용 검토 | 낮음 |
| `GEMINI.md` (@import 패턴) | **호환** | JIT Context 활성화 시 동작 검증 필요 (v0.35.0) | 중간 |
| `.gemini/policies/*.toml` | **호환** | `subagent`, `modes`, `mcpName` 필드 활용 검토 | 중간 |
| `policies/bkit-extension-policy.toml` | **호환** | Tier 2 ALLOW 불가 규칙 준수 확인 (이미 준수 중) | 낮음 |
| `hooks/hooks.json` + 스크립트 | **호환** | PTY 누수 수정으로 안정성 향상, 추가 조치 불필요 | 없음 |
| `hooks/runtime-hooks.js` | **호환** | `PreCompress` 등 새 hook 이벤트 활용 검토 | 낮음 |
| `agents/*.md` | **호환** | 네이티브 서브에이전트와 통합 검토 | 중간 |
| `commands/*.toml` | **호환** | 슬래시 커맨드 충돌 시 dot-prefixing 적용됨 | 낮음 |
| `skills/` | **호환** | 슬래시 커맨드 스킬 활성화 기능 활용 가능 | 중간 |
| `mcp/` MCP 서버 | **검증 필요** | 서버 별칭 언더스코어 확인, FQN 네이밍 확인 | **높음** |
| `lib/` 런타임 라이브러리 | **호환** | 직접적 변경 불필요, 간접적 API 변화 모니터링 | 낮음 |

### 9.2 권장 조치 우선순위

**P0 - 즉시 (v0.34.0 대응)**:
1. MCP 서버 별칭에 언더스코어 사용 여부 확인 -> 하이픈으로 변경
2. `experimental.plan` 설정 참조 제거 (있다면)
3. deprecated settings 자동 마이그레이션 영향 확인

**P1 - 단기 (v0.35.0 대비)**:
4. JIT Context Loading과 bkit `@import` 패턴 호환성 테스트
5. 서브에이전트 도구 격리 기능으로 에이전트별 도구 제한 마이그레이션
6. `disableAlwaysAllow`와 `--admin-policy` 활용한 Enterprise 정책 강화

**P2 - 중기 (기능 활용)**:
7. Plan Mode `plan.modelRouting`으로 PDCA Plan 단계 모델 라우팅 최적화
8. Tracker CRUD 도구와 bkit 태스크 관리 통합
9. 커스텀 키바인딩으로 bkit 전용 단축키 번들
10. `subagent` 필드 활용한 에이전트별 TOML 정책 정교화
11. `modes` 필드 활용한 승인 모드별 차별화 정책

**P3 - 장기 (탐색적)**:
12. 멀티레지스트리 아키텍처 기반 에이전트별 도구 세트
13. InjectionService 기반 컨텍스트 주입 방식 탐색
14. gVisor/LXC 샌드박스를 Enterprise 레벨에 도입

---

## 10. 원문 참조 링크

### 공식 릴리스 노트
- [v0.34.0 릴리스](https://github.com/google-gemini/gemini-cli/releases/tag/v0.34.0)
- [v0.33.0 릴리스](https://github.com/google-gemini/gemini-cli/releases/tag/v0.33.0)
- [v0.33.1 릴리스](https://github.com/google-gemini/gemini-cli/releases/tag/v0.33.1)
- [v0.33.2 릴리스](https://github.com/google-gemini/gemini-cli/releases/tag/v0.33.2)
- [v0.35.0-preview.1 릴리스](https://github.com/google-gemini/gemini-cli/releases/tag/v0.35.0-preview.1)
- [v0.36.0-nightly 릴리스](https://github.com/google-gemini/gemini-cli/releases/tag/v0.36.0-nightly.20260318.e2658ccda)

### 공식 문서
- [Gemini CLI 최신 Changelog](https://geminicli.com/docs/changelogs/latest/)
- [Preview Changelog](https://geminicli.com/docs/changelogs/preview/)
- [Configuration Reference](https://geminicli.com/docs/reference/configuration/)
- [Policy Engine](https://geminicli.com/docs/reference/policy-engine/)
- [Subagents](https://geminicli.com/docs/core/subagents/)
- [Extension Reference](https://geminicli.com/docs/extensions/reference/)
- [Plan Mode](https://geminicli.com/docs/cli/plan-mode/)
- [Keyboard Shortcuts](https://geminicli.com/docs/reference/keyboard-shortcuts/)
- [Sandboxing](https://geminicli.com/docs/cli/sandbox/)
- [Model Steering](https://geminicli.com/docs/cli/model-steering/)

### GitHub Issues/Discussions
- [Deprecated settings removal overdue (#20657)](https://github.com/google-gemini/gemini-cli/issues/20657)
- [experimental.plan issue (#19272)](https://github.com/google-gemini/gemini-cli/issues/19272)
- [MCP tool FQN underscore issue](https://geminicli.com/docs/reference/policy-engine/)
- [Plan Mode announcement Discussion (#22078)](https://github.com/google-gemini/gemini-cli/discussions/22078)

### 기술 블로그
- [Google Developers Blog: Plan mode now available](https://developers.googleblog.com/plan-mode-now-available-in-gemini-cli/)
- [InfoWorld: Gemini CLI introduces plan mode](https://www.infoworld.com/article/4144594/gemini-cli-introduces-plan-mode.html)
- [DevOps.com: Plan Mode separates thinking from doing](https://devops.com/gemini-cli-plan-mode-separates-thinking-from-doing-and-makes-read-only-the-default/)

---

## 11. 조사 신뢰도

| 항목 | 신뢰도 | 비고 |
|------|--------|------|
| Breaking Changes | 4/5 | v0.34.0 릴리스 노트 + 공식 문서 교차 검증 완료. deprecated settings 정확한 목록은 소스 코드 확인 필요 |
| 새 기능 | 5/5 | GitHub Releases + 공식 문서 + PR 번호 확인 완료 |
| Deprecation | 3/5 | `experimental.plan` 제거 확인. 기타 deprecated settings의 정확한 목록은 소스 확인 필요 |
| 설정 변경 | 4/5 | 공식 configuration 문서에서 확인. 일부 실험적 설정 기본값은 버전에 따라 다를 수 있음 |
| 버그 수정 | 5/5 | GitHub Releases에서 PR 번호와 함께 확인 |
| 성능 최적화 | 4/5 | 릴리스 노트에서 확인. 정량적 벤치마크는 미확인 |
| bkit 영향도 | 4/5 | 현재 bkit 코드베이스와 교차 분석 완료. 실제 동작은 테스트 필요 |

---

## 12. 이전 조사 보고서와의 차이

이전 보고서 (`gemini-cli-update-research.md`, 2026-03-11 작성)과 비교:

| 항목 | 이전 보고서 | 본 보고서 | 변화 |
|------|-----------|-----------|------|
| 조사 범위 | v0.32.x ~ v0.34.x (나이틀리) | v0.33.0 ~ v0.36.0-nightly | v0.34.0 정식 릴리스 + v0.35/v0.36 추가 |
| v0.34.0 상태 | 나이틀리 (실험적) | **안정 릴리스** (2026-03-17) | 정식 릴리스 확정 |
| Plan Mode | 프리뷰/실험적 | **기본 활성화** | 주요 변화 확정 |
| JIT Context | 미언급 | 기본 활성화 예정 (v0.35.0) | 신규 발견 |
| 서브에이전트 격리 | 개선 수준 | **도구 격리 + 멀티레지스트리** | 대폭 강화 |
| TOML 정책 | 기본 문법만 | `subagent`, `modes`, `mcpName`, `deny_message` 확장 | 상세 필드 확인 |
| 보안 설정 | 미상세 | `disableAlwaysAllow`, `--admin-policy`, 확장 무결성 검증 | 신규 발견 |
| 키바인딩 | 미언급 | `keybindings.json` 커스터마이징 | 신규 발견 |

---

> 본 보고서는 GitHub Releases, 공식 문서 (geminicli.com), Google Developers Blog, PR/Issue 번호를 기반으로 작성되었습니다.
> v0.35.0 이상의 기능은 Preview/Nightly로 변경 가능성이 있으며, 정식 릴리스 시 재검증이 필요합니다.
>
> *bkit Vibecoding Kit - gemini-researcher agent*
> *Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
