# Gemini CLI v0.38.1 변경사항 조사 보고서 (v0.38.0 → v0.38.1 증분)

> 조사일: 2026-04-17
> 조사 범위: **v0.38.0 (2026-04-14) → v0.38.1 (2026-04-15)** (증분만)
> 선행 참조: `docs/01-plan/research/gemini-cli-v0.38.0-research.md` (v0.37.2 → v0.38.0 및 v0.38.1 초기 메모)
> 조사자: gemini-researcher agent
> bkit 현재 버전: v2.0.4 (Gemini CLI v0.36.0 대상)
> 최신 stable: **v0.38.1** (npm `latest` tag, 2026-04-15 17:56 UTC)

---

## 1. 버전 개요 (Version Overview)

### 1.1 릴리스 메타데이터

| 항목 | 값 |
|------|-----|
| 버전 | **v0.38.1** |
| 릴리스 일시 | **2026-04-15 17:56 UTC** |
| 릴리스 태그 SHA | `7f55800343f6f53f130f7cadef1669d1886b9180` |
| 릴리스 담당자 (릴리스 chore 커밋) | `gemini-cli-robot` (자동 봇) |
| 원본 Author | `Jerop Kipruto` (`@jerop`) |
| 릴리스 타입 | **Patch (stable)** |
| npm 태그 | `latest` (교체) |
| 기반 브랜치 | `release/v0.38.0-pr-25317` (v0.38.0 핫픽스 브랜치) |

### 1.2 릴리스 규모 (v0.38.0 → v0.38.1)

| 항목 | 값 |
|------|-----|
| 커밋 수 | **2** (cherry-pick 1 + release chore 1) |
| 변경 파일 수 | **13** (비교 페이지 수치) |
| 커밋 SHA | `2a28cf2cb3ea67cce6f01b6fef12c3d504049bba`, `7f55800343f6f53f130f7cadef1669d1886b9180` |
| 핵심 PR | [#25466](https://github.com/google-gemini/gemini-cli/pull/25466) (cherry-pick) |
| 원본 PR | [#25317](https://github.com/google-gemini/gemini-cli/pull/25317) (main에 병합됨, 2026-04-13) |
| 원본 이슈 | [#25110](https://github.com/google-gemini/gemini-cli/issues/25110) (Plan Mode hang, Windows CLI v0.36.0 보고) |

### 1.3 주요 테마

**"Plan Mode 모델 라우팅 Silent Fallback 핫픽스" 단일 주제**.

Pro 모델 가용성이 저하될 때(>15분 hang) Plan Mode가 조용히 Flash 모델로 fallback하여 사용자 중단을 최소화. Plan Mode approval 단계에서 `SILENT_ACTIONS`를 일관 주입하는 "Unified Injection" 접근.

> 참고: v0.38.0 릴리스는 2026-04-14에 이루어졌고, 원본 PR #25317은 **2026-04-13에 main에 이미 병합**되어 있었다. 그러나 v0.38.0 cut 시점에는 해당 커밋이 포함되지 않아, 2026-04-15 v0.38.1 패치로 cherry-pick되었다.

---

## 2. Breaking Changes (v0.38.0 → v0.38.1 증분)

| # | 항목 | 이전 동작 | 이후 동작 | 영향 범위 | 참조 |
|---|------|-----------|-----------|-----------|------|
| — | **증분 Breaking Changes: 없음** | — | — | — | — |

### 2.1 설정 스키마 / Extension / MCP API 계약 확인

- `settings.json` 스키마: **변경 없음**
- `gemini-extension.json` 스키마: **변경 없음**
- MCP stdio/sse 프로토콜: **변경 없음**
- Hook 이벤트 계약(`BeforeTool`/`AfterTool`/`BeforeModel` 등 19종): **변경 없음**
- CLI 플래그/서브커맨드: **변경 없음**
- `gemini.toml` / `.gemini/` 디렉토리 레이아웃: **변경 없음**

### 2.2 간접 동작 변경 (Breaking은 아니나 주의)

| # | 항목 | 이전 | 이후 | bkit 관련성 |
|---|------|------|------|-------------|
| 1 | Plan Mode의 policy action resolution | action이 `prompt`/`interrupt` 등으로 분기되어 Pro 모델 미가용 시 hang 또는 차단 | `ApprovalMode.PLAN` 감지 시 fallback 체인의 모든 action이 `silent`로 override | bkit이 `ApprovalMode.PLAN`을 명시적으로 사용하지 않는 한 직접 영향 없음. 단, **BeforeModel 훅 기반 모델 라우팅과 Plan Mode가 동시에 사용될 경우** fallback 순서 (훅 override → policy chain → silent fallback) 상호작용 미검증 |
| 2 | `SILENT_ACTIONS` export 범위 | `policyCatalog.ts` 내부 상수 | `policyCatalog.ts`에서 **export** → core 모듈 간 공유 | bkit은 core 내부 API 직접 참조하지 않으므로 영향 없음 |

---

## 3. 새로운 기능 (v0.38.0 → v0.38.1 증분)

### 3.1 증분 신규 기능

| # | 기능명 | 설명 | 사용법 | bkit 활용 가능성 | 참조 |
|---|--------|------|--------|-----------------|------|
| 1 | **Plan Mode 모델 라우팅 Silent Fallback** (`feat(core)`) | Plan Mode (`ApprovalMode.PLAN`) 진입 시 model policy chain resolution에서 fallback action을 **일괄 `silent`로 override**. Pro 모델 unavailable 시 Flash로 자동 fallback, 사용자 prompt/interrupt 없음. 이슈 #25110의 "15분+ hang" 시나리오 해결 | 자동 (Plan Mode 진입 시 내부 적용). 별도 flag 없음 | 🟢 **MEDIUM** — bkit이 Plan Mode 경로를 활용하는 경우 모델 가용성 저하 상황에서 UX 안정. **주의**: bkit의 BeforeModel 훅이 모델을 pro로 명시 지정하더라도, Plan Mode fallback이 우선될 수 있는지 v2.1.x에서 검증 필요 | [PR #25317](https://github.com/google-gemini/gemini-cli/pull/25317), cherry-pick [PR #25466](https://github.com/google-gemini/gemini-cli/pull/25466), origin commit `050c303`, issue [#25110](https://github.com/google-gemini/gemini-cli/issues/25110) |

### 3.2 bkit 스킬/에이전트/Hook 활용 관점

- **19개 Hook 이벤트**: 증분 영향 없음. 단, `BeforeModel` 훅에서 `llm_request.model = "gemini-2.5-pro"`를 지정한 뒤 Plan Mode에 진입하는 조합은 v0.38.1에서 최초로 "silent fallback이 훅 지정을 덮을 수 있는" 경로가 생긴다. → Analysis 단계에서 E2E 테스트 케이스로 확보 권장.
- **37개 스킬**: 증분 영향 없음 (스킬 로더/매니페스트 경로 무변경).
- **32개 에이전트(서브에이전트)**: 증분 영향 없음. 단, Plan Mode를 사용하는 서브에이전트 정의가 있다면 동일한 silent fallback이 적용됨.

---

## 4. Deprecation 예고 (v0.38.0 → v0.38.1 증분)

| # | 항목 | 예고 버전 | 제거 예정 | 현재 대안 | 참조 |
|---|------|-----------|-----------|-----------|------|
| — | **증분 Deprecation 예고: 없음** | — | — | — | — |

v0.38.1은 단일 핫픽스로, 새 deprecation 경고를 도입하지 않는다. v0.38.0에서 예고된 항목(Legacy subagent wrapping tools, `Ctrl+X` → `Ctrl+G`, `ContextManager` → `MemoryContextManager`, `keytar` 전환)은 그대로 유지된다.

---

## 5. 설정/구성 변경 (v0.38.0 → v0.38.1 증분)

| # | 설정 항목 | 변경 유형 | 이전 | 이후 | 참조 |
|---|-----------|-----------|------|------|------|
| 1 | Plan Mode Silent Actions 주입 | **동작 강화 (설정 노출 없음)** | `ApprovalMode.PLAN`에서 fallback action이 policy에 따라 prompt/interrupt 분기 | `ApprovalMode.PLAN`에서 `SILENT_ACTIONS` 일괄 주입으로 모든 fallback action이 조용히 처리 | [PR #25317](https://github.com/google-gemini/gemini-cli/pull/25317) |

### 5.1 settings.json / .gemini/ / extension config

- `settings.json`: **변경 없음**
- `.gemini/` 디렉토리: **변경 없음**
- `gemini-extension.json`: **변경 없음**
- 환경변수 문법(`${VAR:-default}`): v0.38.0에서 이미 도입. 증분 없음.
- Context Engineering 6-Layer 관련 설정(`context.memoryBoundaryMarkers`, `chapters`, `experimentalMemoryManager` 등): **변경 없음**

---

## 6. 버그 수정 / 패치성 변경 (v0.38.0 → v0.38.1 증분)

| # | 커밋 타입 | 설명 | 원본 PR | bkit 관련성 | 참조 |
|---|----------|------|---------|-------------|------|
| 1 | `fix(patch)` | Plan Mode fallback hang 해결 (cherry-pick commit `050c303`) | #25317 (원래는 `feat`) | 간접 (Plan Mode 사용 시 안정성) | [PR #25466](https://github.com/google-gemini/gemini-cli/pull/25466) |
| 2 | `chore(release)` | v0.38.1 릴리스 버전 bump (package.json 계열) | — | — | commit `7f55800` |

### 6.1 `feat:` vs `fix:` 구분

- **원본 PR #25317**은 main 브랜치에 `feat(core): implement silent fallback for Plan Mode model routing` 로 병합됨 (기능 추가 성격).
- **cherry-pick PR #25466**은 hotfix 채널 규약에 따라 `fix(patch):` 접두어로 stable 릴리스에 반영됨.
- 즉, v0.38.1의 릴리스 채널 관점에서는 **기능 추가가 포함된 패치 릴리스**이다 (순수 bug-fix only 릴리스 아님). 이 점은 SemVer상 논쟁의 여지가 있으나, 변경 표면이 Plan Mode 내부 정책 해석에 국한되어 Google 팀은 patch bump를 선택했다.

### 6.2 리뷰어 지적 사항

- Gemini Code Assist가 원본 PR에서 "assigning `SILENT_ACTIONS` directly could lead to shared state across policies" 플래그 → 후속 커밋에서 spread 연산자(`{...SILENT_ACTIONS}`)로 방어 완료. v0.38.1에는 방어 처리 포함 상태로 반영.
- cherry-pick PR에서는 `chain` 변수의 `ModelPolicyChain | undefined` 타입 null-check 누락이 추가 지적되었으나 **해당 시점에 머지** → 잠재적 runtime error 경로 존재. v0.38.2 또는 v0.39.x에서 후속 수정 가능성.

---

## 7. 원문 참조 링크

### 7.1 v0.38.1 직접 참조

- **v0.38.1 릴리스 페이지**: https://github.com/google-gemini/gemini-cli/releases/tag/v0.38.1
- **v0.38.0 → v0.38.1 비교 (compare)**: https://github.com/google-gemini/gemini-cli/compare/v0.38.0...v0.38.1
- **cherry-pick PR #25466**: https://github.com/google-gemini/gemini-cli/pull/25466
- **원본 PR #25317**: https://github.com/google-gemini/gemini-cli/pull/25317
- **원본 이슈 #25110**: https://github.com/google-gemini/gemini-cli/issues/25110
- **핵심 커밋 (cherry-pick)**: `050c303` (main), `2a28cf2` (release branch merge)
- **릴리스 tag 커밋**: `7f55800`

### 7.2 직접 변경된 파일 (PR #25317에서 식별)

- `packages/core/src/availability/policyHelpers.ts` — `resolvePolicyChain` 리팩토링 (Plan Mode silent override)
- `packages/core/src/availability/policyCatalog.ts` — `SILENT_ACTIONS` export
- `packages/core/src/availability/policyHelpers.test.ts` — silent fallback 유닛 테스트 추가
- `docs/cli/plan-mode.md` — 자동 fallback 동작 문서화

> 참고: compare 페이지가 "taking too long to generate" 상태로 전체 13개 파일 목록은 원격에서 즉시 확인되지 않았다. 나머지 파일은 release chore 커밋의 `package.json`/`package-lock.json`/버전 스탬프 계열로 추정된다(일반적인 `chore(release)` 패턴).

### 7.3 커뮤니티/블로그 참조

- **Google Developer Blog**: v0.38.1 전용 게시물 **확인되지 않음** (⚠️ 미확인, 패치 릴리스라 미게재 가능성 높음)
- **Hacker News / Reddit r/Bard 최근 2일**: v0.38.1 관련 상위 스레드 **확인되지 않음** (⚠️ 미확인, 단일 핫픽스라 커뮤니티 반응 미미)
- **GitHub Discussions**: v0.38.1 전용 토론 스레드 **확인되지 않음** (⚠️ 미확인)
- geminicli.com/docs/changelogs 페이지는 조사 시점에 아직 v0.37.2를 "latest stable"로 표기 중 — 문서 사이트 동기화 지연 (⚠️ 미확인 상태의 외부 미러)

### 7.4 연관 bkit 문서

- `docs/01-plan/research/gemini-cli-v0.38.0-research.md` (선행 조사, v0.38.1 초기 메모 포함)
- `docs/01-plan/research/gemini-cli-v0.37.2-research.md`
- `docs/01-plan/features/gemini-cli-v0.38.0-migration.plan.md`
- `docs/01-plan/features/v2.1.0-context-optimization.plan.md` (BeforeModel 라우팅 훅 설계와 상호작용 가능)

---

## 8. 조사 신뢰도

| 항목 | 신뢰도 | 비고 |
|------|--------|------|
| 최신 stable 감지 (v0.38.1) | ⬛⬛⬛⬛⬛ | GitHub Releases 페이지 직접 확인, 2026-04-15 17:56 UTC |
| Breaking Changes (증분) | ⬛⬛⬛⬛⬛ | 단일 PR, 변경 표면이 `policyHelpers` 내부로 한정됨. 스키마 무영향 확정 |
| 새 기능 (증분) | ⬛⬛⬛⬛⬛ | 단일 cherry-pick, 기능 본체 PR #25317 상세 확인 |
| Deprecation (증분) | ⬛⬛⬛⬛⬛ | 없음 확정 |
| 설정 변경 (증분) | ⬛⬛⬛⬛⬛ | 없음 확정 (동작 강화만 존재) |
| Extension/MCP/Hook 영향 | ⬛⬛⬛⬛⬜ | 계약 변경 없음 확인, BeforeModel 훅-Plan Mode 상호작용은 E2E 미검증 |
| 커뮤니티 반응 | ⬛⬛⬜⬜⬜ | Google Blog/HN/Reddit 전용 언급 미확인 (패치 특성) |
| 변경 파일 전수 | ⬛⬛⬛⬜⬜ | 13개 중 4개(policyHelpers/policyCatalog/test/docs) 확인, 나머지는 release chore 추정 |

---

## 9. bkit 영향 요약 및 권장 조치 (증분 관점)

### 9.1 즉시 영향

- **없음**. v0.38.1은 계약 변경 0건, 설정 변경 0건, Deprecation 0건. 기본 설정의 bkit 사용자는 **무중단 업그레이드 가능**.

### 9.2 검증 필요 항목 (v2.1.x 로드맵 연계)

1. **BeforeModel 훅 × Plan Mode 상호작용 E2E 테스트**
   - 시나리오: bkit 훅이 `{llm_request: {model: "gemini-2.5-pro"}}` 반환 → Plan Mode 진입 → Pro 모델 unavailable 상황 시뮬레이션
   - 기대: 훅 지정 vs silent fallback 간 우선순위 확정 및 문서화
2. **Plan Mode를 사용하는 bkit 서브에이전트 정의 확인**
   - `.claude-plugin/agents/` 및 skills 하위에서 `approvalMode: plan` 참조 여부 grep
   - 해당 에이전트의 모델 fallback 허용 여부 정책 명시화
3. **회귀 테스트 스위트 스모크**
   - 기존 993/993 테스트가 v0.38.1에서도 green인지 확인 (계약 무변경 가정 검증)

### 9.3 마이그레이션 위험도 (v0.38.0 → v0.38.1)

- **위험도: LOW** (단일 핫픽스, 변경 표면이 Plan Mode 내부 정책 해석 경로로 한정, 계약 무변경)
- **권장 업그레이드 전략**: v0.38.0 마이그레이션 플랜의 "target version"을 v0.38.1로 swap in-place. 새 플랜 문서 신규 작성보다는 **기존 v0.38.0 migration plan에 "v0.38.1 delta: Plan Mode silent fallback only" 각주 추가**가 효율적.

### 9.4 v0.38.2 / v0.39.x watch 포인트

- cherry-pick PR #25466에서 지적된 `chain | undefined` null-check 누락 → 향후 패치 가능성
- v0.39.0-preview.0의 `invoke_subagent` 통합, `/memory inbox`, JSONL chat recording, `@github/keytar` 전환 (별도 연구 대상)

---

## 10. 한 눈에 보는 요약 (TL;DR)

| 카테고리 | 증분 카운트 | 비고 |
|---------|------------|------|
| 🔴 Breaking Changes | **0** | 계약 전혀 바뀌지 않음 |
| 🟢 새 기능 | **1** | Plan Mode silent fallback (PR #25317 cherry-pick) |
| 🟡 Deprecation 예고 | **0** | — |
| ⚙️ 설정 변경 | **0** (노출 설정 기준) | 내부 동작 강화 1건 |
| 🐛 버그 수정 (주요) | **1** | Plan Mode hang (issue #25110) |
| 🔐 보안 이슈 | **0** | — |
| 📦 의존성 변경 | **0** | package.json 버전 스탬프만 변경 |

---

*조사 종료: 2026-04-17 (v0.38.0 → v0.38.1 증분 전용 보고서)*
