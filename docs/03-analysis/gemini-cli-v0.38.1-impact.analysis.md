# Gemini CLI v0.38.1 bkit 영향 분석 보고서 (증분)

> 분석일: 2026-04-17
> 분석 범위: bkit v2.0.4 전체 코드베이스 — v0.38.0 대비 **증분만**
> 대상 버전: Gemini CLI **v0.38.0 → v0.38.1** (2026-04-15 release)
> 분석자: bkit-impact-analyzer agent
> 입력: `docs/01-plan/research/gemini-cli-v0.38.1-research.md`
> 선행 분석: `docs/03-analysis/gemini-cli-v0.38.0-impact.analysis.md` (v0.38.0 영향 전수 검증 완료)

---

## Executive Summary

| 항목 | 수치 |
|------|------|
| 전수 스캔 대상 파일 | 276개 (소스), 613개 (docs/tests 포함) |
| **v0.38.1 증분으로 영향 받는 파일** | **0개 (직접), 1개 (간접/검증 권장)** |
| Breaking Changes (증분) | **0건** |
| 새 기능 (증분) | **1건** (Plan Mode silent fallback) |
| Deprecation (증분) | **0건** |
| 설정 스키마 변경 (증분) | **0건** |
| 🔴 Critical | **0건** |
| 🟠 High | **0건** |
| 🟡 Medium | **0건** |
| 🟢 Low | **2건** (둘 다 검증/모니터링 권장) |
| 기능 개선 기회 (증분) | **1건** (BeforeModel × Plan Mode 상호작용 문서화) |

**총평**: v0.38.1은 **단일 cherry-pick 핫픽스**로, bkit 코드베이스에 **직접 수정이 필요한 항목이 없음**. v0.38.0 분석에서 이미 v0.38.1의 영향 표면을 포괄적으로 커버했으며, 이 문서는 증분 검증에 집중한다. 위험도 **LOW**, 계약 변경 0건, 스키마 변경 0건.

핵심 관찰: bkit은 `--approval-mode=yolo`와 `--approval-mode=default`만 사용하고 `--approval-mode=plan`은 사용하지 않으므로 Plan Mode silent fallback이 런타임 경로로 진입할 가능성이 **현재 구현에선 매우 낮음**. 단, v2.1.x에서 BeforeModel E2E 모델 오버라이드를 구현할 때 두 메커니즘의 우선순위 상호작용을 E2E 테스트로 확보할 필요가 있다.

---

## 1. Breaking Changes 영향 매핑 (증분)

### 증분 Breaking Changes: **0건**

Research 보고서 §2에서 확정된 대로:

- `settings.json` 스키마: 변경 없음 → **bkit `bkit.config.json`, `.gemini/settings.json` 영향 없음**
- `gemini-extension.json` 스키마: 변경 없음 → **bkit `gemini-extension.json` 영향 없음**
- MCP stdio/sse 프로토콜: 변경 없음 → **`mcp/bkit-server.js` 영향 없음**
- Hook 이벤트 계약(19종): 변경 없음 → **`hooks/scripts/*.js` 12개 영향 없음**
- CLI 플래그/서브커맨드: 변경 없음 → **`mcp/bkit-server.js`의 `spawn('gemini', args)` 호출 영향 없음**
- `gemini.toml` / `.gemini/` 레이아웃: 변경 없음 → **`policies/bkit-extension-policy.toml`, `GEMINI.md` 영향 없음**

### 간접 동작 변경 (주의 항목)

| # | 항목 | 이전 | 이후 | bkit 검증 필요 | 영향도 |
|---|------|------|------|----------------|--------|
| 1 | **Plan Mode policy action resolution** | Pro 모델 미가용 시 `prompt`/`interrupt` 분기 → hang 가능 | `ApprovalMode.PLAN` 감지 시 fallback 체인의 모든 action이 `silent`로 override | bkit은 `ApprovalMode.PLAN`을 명시적으로 사용하지 **않음** (`mcp/bkit-server.js:1054-1056` 확인: `yolo` 또는 `default`만 사용). 직접 영향 없음 | 🟢 Low |
| 2 | `SILENT_ACTIONS` export 범위 확대 (`policyCatalog.ts`) | 내부 상수 | core 모듈 간 공유 export | bkit은 core 내부 API 직접 참조하지 않음 | 🟢 Low |

**결론**: 증분 Breaking Changes 영향 받는 bkit 파일 **0개**.

---

## 2. 스킬 영향 분석 (증분)

### No Change

43개 스킬(`skills/` 디렉토리) 전수 재스캔:

- SKILL.md frontmatter 스키마 변경 없음 (v0.38.0 분석 결과 유지)
- `allowed-tools`, `imports`, `agents`, `pdca-phase` 필드 모두 호환
- `/plan-plus`, `/pdca-iterator`, `pdca:plan` 등 "plan" 키워드 포함 스킬은 **bkit PDCA phase**를 지칭하며, CLI의 `ApprovalMode.PLAN`과는 무관
- `skills/plan-plus/SKILL.md`는 `pdca-phase: plan`으로 설정되나 이는 bkit 자체 PDCA 단계 표식이지 Gemini CLI의 Plan Mode 진입과 무관

| 스킬 | v0.38.1 증분 영향 | 영향도 | 비고 |
|------|-------------------|--------|------|
| 전체 43개 | **없음** | — | v0.38.0 분석 결과에서 변동 없음 |
| `plan-plus` | 간접(문서) | 🟢 Low | 스킬 본문에서 Plan Mode 관련 언급이 없으나, v2.1.x에서 E2E 모델 라우팅 구현 시 docstring 보강 후보 |

---

## 3. 에이전트 영향 분석 (증분)

### No Change

21개 에이전트(`agents/` 디렉토리) 전수 재스캔:

- 에이전트 frontmatter에 **`permissionMode` 또는 `approvalMode` 필드 사용 0건** (grep 확인)
- `model`, `tools`, `classification` 등 기존 필드 호환 유지
- `cto-lead`, `pdca-iterator` 등 Plan-heavy 에이전트도 `ApprovalMode.PLAN` 직접 진입 경로 없음

| 에이전트 | v0.38.1 증분 영향 | 영향도 | 비고 |
|----------|-------------------|--------|------|
| 전체 21개 | **없음** | — | v0.38.0 분석 결과에서 변동 없음 |
| `pdca-iterator`, `cto-lead` | 간접(이론적) | 🟢 Low | Plan Mode를 명시적으로 호출하지 않음. 단, 사용자가 CLI 프롬프트에서 `/approval-mode plan`을 수동 토글하고 이어서 이 에이전트를 호출하는 경로에서 silent fallback이 적용될 수 있음 (사용자 주도 경로, bkit 코드 개입 없음) |

---

## 4. 스크립트/라이브러리 영향 분석 (증분)

### 4.1 Hook 스크립트 — 1개 파일 **검증 권장** (수정 불필요)

| 파일 | v0.38.1 증분 영향 | 영향도 | 검증/대응 방안 |
|------|-------------------|--------|----------------|
| `hooks/scripts/before-model.js` | **간접 (상호작용 검증 권장)** | 🟢 Low | 현재 구현은 `additionalContext`에 `MODEL_ROUTING` **텍스트 힌트만** 주입 (Line 13-26, 99-102). 실제 `llm_request.model` 오버라이드 미구현. 따라서 v0.38.1의 Plan Mode silent fallback과 직접 충돌하지 않음. **v2.1.x에서 E2E 오버라이드 구현 시**: Plan Mode 진입 상태에서 훅이 `hookSpecificOutput.llm_request.model = "gemini-2.5-pro"`를 반환하더라도 silent fallback이 `flash`로 override할 가능성 있음. 이 우선순위를 E2E 테스트로 확보 필요 |
| `hooks/scripts/*.js` (나머지 11개) | 없음 | — | before-tool, after-tool, session-start, pre-compress 등 전부 Plan Mode 경로와 무관 |

### 4.2 라이브러리 (`lib/`) — No Change

| 모듈 | v0.38.1 증분 영향 | 영향도 |
|------|-------------------|--------|
| `lib/gemini/version.js` | 없음 (v0.38.1 플래그는 의미적으로 v0.38.0의 silent fallback 개선이라 별도 플래그 불필요. 단, `testedVersions`에 `"0.38.1"` 추가는 v0.38.0 분석의 §8.1과 동일 작업) | 🟢 Low |
| `lib/gemini/tools.js` | 없음 | — |
| `lib/gemini/model-resolver.js` | 없음 | — |
| `lib/gemini/hooks.js` | 없음 (HOOK_EVENT_MAP 무변경) | — |
| `lib/gemini/policy.js` | 없음 (TOML 스키마 무변경) | — |
| `lib/gemini/context-fork.js` | 없음 | — |
| `lib/gemini/platform.js` | 없음 | — |
| `lib/core/permission.js` | 없음 | — |
| `lib/core/memory.js` | 없음 | — |
| `lib/pdca/*` (5개) | 없음 | — |
| `lib/intent/*` (5개) | 없음 | — |

### 4.3 MCP 서버 (`mcp/`) — No Change

| 파일 | v0.38.1 증분 영향 | 영향도 | 확인 |
|------|-------------------|--------|------|
| `mcp/bkit-server.js` | **없음** | — | `--approval-mode=yolo`(SAFETY_TIERS.FULL) 또는 `--approval-mode=default`만 사용 (Line 1054-1056). `plan` mode 호출 경로 0건. silent fallback이 런타임에 트리거되지 않음 |
| `mcp/start-server.sh` | 없음 | — | POSIX 호환 유지 |
| `mcp/gemini-extension.json` | 없음 | — | MCP 스키마 무변경 |

---

## 5. 설정 파일 영향 분석 (증분)

| 파일 | v0.38.1 증분 영향 | 영향도 | 대응 |
|------|-------------------|--------|------|
| `bkit.config.json` | `compatibility.testedVersions`에 `"0.38.1"` 추가 권장 | 🟢 Low | v0.38.0 분석 §8.1과 동일 수정 항목에 `"0.38.1"` 포함 (5분 작업). `minGeminiCliVersion: "0.34.0"` 유지 |
| `gemini-extension.json` | **없음** | — | 스키마 무변경 |
| `hooks/hooks.json` | **없음** | — | 19개 훅 이벤트 계약 무변경 |
| `policies/bkit-extension-policy.toml` | **없음** | — | TOML 스키마 무변경 |
| `GEMINI.md` | **없음** | — | `@import` 디렉티브 무변경 |
| `.gemini/settings.json` | **없음** | — | v0.38.1은 노출 설정 0건 추가 |
| `package.json` | **없음** | — | 의존성 무변경 |

---

## 6. 철학 정합성 검증 결과 (증분)

> bkit-system/philosophy/ 디렉토리는 현재 비어있음(Glob 확인). v0.38.0 분석의 6개 원칙 프레임워크를 그대로 적용하여 증분 관점에서만 검증.

| 원칙 | v0.38.0 결과 | v0.38.1 증분 결과 | 비고 |
|------|------------|-------------------|------|
| Automation First | 유지 | **유지** | Plan Mode hang → silent fallback은 오히려 자동화 경로의 견고성 향상 |
| No Guessing | 유지 | **⚠️ 주의** | silent fallback은 "사용자에게 묻지 않고" 모델을 Flash로 전환. bkit의 `No Guessing` 원칙(정보 부족 시 질문)과 미묘한 긴장 관계 존재. 단, 이는 CLI 내부 정책이며 bkit은 사용자 의사결정 경로에서 Plan Mode를 사용하지 않으므로 원칙 위반이 아님. v2.1.x에서 E2E 모델 라우팅 구현 시 "silent vs explicit" 동작을 설정 가능하게 하는 것이 바람직 |
| Docs = Code | 유지 | **유지** | PDCA 문서↔코드 동기화 메커니즘 무영향 |
| AI as Partner | 유지 (향상 기회) | **유지** | Plan Mode fallback은 사용자 중단(hang) 감소로 UX 개선 |
| Context Engineering | 유지 (모니터링) | **유지** | 6-Layer 아키텍처, Phase-Aware Context 전략 무영향 |
| PDCA Methodology | 유지 | **유지** | PDCA 사이클 전 단계 정상 작동 |

**결론**: 증분 관점에서 철학 정합성 **유지**. 단, v2.1.x 로드맵에서 BeforeModel E2E 구현 시 `No Guessing` 원칙과의 상호작용을 설계 단계에서 명시화 필요.

---

## 7. 기능 개선 기회 (증분)

v0.38.0 분석 §7에서 6개 개선 기회를 이미 식별. 증분 관점에서는 **1건 추가**:

| # | 기회 | 설명 | 우선순위 | 예상 공수 |
|---|------|------|----------|-----------|
| 7 | **BeforeModel × Plan Mode 우선순위 E2E 테스트** | v2.1.x에서 before-model.js가 `hookSpecificOutput.llm_request.model` 필드로 실제 모델 override를 시작하면, Plan Mode 진입 상태에서 silent fallback이 훅 지정을 덮는지 여부를 E2E로 검증. 문서화 후 사용자가 예측 가능한 동작을 얻도록 함 | **P1** (v2.1.x BeforeModel E2E 구현과 함께) | 2-3h (테스트 작성 + 문서화) |

### 기존 기회와의 관계

v0.38.0 분석 §7.2의 #2 "BeforeModel E2E 모델 오버라이드"를 구현할 때 이 테스트를 **같이 작성**하는 것이 효율적. 별도 작업으로 분리하지 않음.

---

## 8. v0.38.0 대비 증분 영향 (요약 테이블)

| 영역 | v0.38.1 증분 | 변경 요약 |
|------|-------------|----------|
| Breaking Changes 매핑 | **No Change** | 0건 추가, v0.38.0의 7건 그대로 Low |
| 스킬 (43개) | **No Change** | frontmatter 무영향 |
| 에이전트 (21개) | **No Change** | `permissionMode` 필드 미사용 확인 |
| Hook 스크립트 (12개) | **1개 검증 권장** | `before-model.js` × Plan Mode 상호작용 (실제 수정 불필요) |
| 라이브러리 lib/ (34개) | **No Change** | 전 모듈 호환 |
| MCP 서버 (7개) | **No Change** | `--approval-mode=plan` 미사용 확인 |
| 설정 파일 (7개) | **`bkit.config.json`** | `testedVersions`에 `"0.38.1"` 추가 (v0.38.0 작업에 포함) |
| 철학 정합성 | **유지** | 6개 원칙 전부 유지 (No Guessing만 향후 주의) |
| 기능 개선 기회 | **+1건** | BeforeModel × Plan Mode E2E 테스트 (P1, v2.1.x 연계) |
| 필수 수정 항목 | **0건** | v0.38.0 §8.1의 `testedVersions` 작업에 `"0.38.1"` 문자열만 포함 |

---

## 9. 필수 수정 항목 (증분)

### 9.1 `bkit.config.json` testedVersions에 `"0.38.1"` 포함

- **파일**: `bkit.config.json`
- **변경**: v0.38.0 분석 §8.1 권장 배열에 `"0.38.1"` 추가
  - 최종 형태: `[..., "0.37.0", "0.37.1", "0.37.2", "0.38.0", "0.38.1"]`
- **영향도**: 🟢 Low (문자열 1개 추가)
- **난이도**: 극소 (1분, v0.38.0 작업에 통합)

**그 외 v0.38.1 증분으로 필요한 수정 없음.**

---

## 10. 구현 우선순위 매트릭스 (증분)

| 우선순위 | 항목 | 근거 | 예상 공수 |
|----------|------|------|-----------|
| **P0** | `bkit.config.json` testedVersions에 `"0.38.1"` 추가 | 호환성 선언 (v0.38.0 P0 작업에 통합) | 1분 |
| **P1** | BeforeModel × Plan Mode E2E 테스트 (v2.1.x 연계) | v2.1.x BeforeModel E2E 모델 오버라이드 구현 시 함께 | 2-3h |
| **P3** | v2.1.x 설계 문서에 "silent fallback vs 훅 override" 우선순위 명시 | No Guessing 원칙과의 정합성 문서화 | 30분 |

---

## 11. 회귀 테스트 포커스 (증분)

v0.38.0 분석 §10의 8개 영역을 그대로 재사용. **추가 검증은 불필요** (증분 변경 표면이 Plan Mode 내부 정책 해석 경로로 한정되고, bkit은 해당 경로에 진입하지 않음).

참고로 직전 커밋 `db6911e (test: update 49 test expectations for v2.0.4 architecture + QA pass 993/993)`에서 확보한 993/993 grade는 v0.38.1에서도 green이 예상된다 (계약 무변경).

| # | 기존 영역 (v0.38.0) | v0.38.1 증분 검증 | 비고 |
|---|--------------------|-------------------|------|
| 1 | 훅 JSON 반환 형식 | **No Change** | `{decision, systemMessage}` 포맷 유지 |
| 2 | SessionStart 초기화 | **No Change** | |
| 3 | BeforeModel 컨텍스트 | 현 수준에서 No Change. v2.1.x E2E 구현 시 추가 필요 | |
| 4 | BeforeTool 보안 | **No Change** | |
| 5 | AfterTool PDCA 상태 | **No Change** | |
| 6 | MCP 서버 | **No Change** | |
| 7 | 정책 TOML 생성 | **No Change** | |
| 8 | PreCompress 스냅샷 | **No Change** | |

---

## 12. 조사 신뢰도 (증분)

| 항목 | 신뢰도 | 비고 |
|------|--------|------|
| Breaking Changes 증분 영향 | ⬛⬛⬛⬛⬛ | 0건 확정 (Research §2 신뢰도 ⬛⬛⬛⬛⬛) |
| 스킬 증분 영향 | ⬛⬛⬛⬛⬛ | frontmatter grep 전수 확인 |
| 에이전트 증분 영향 | ⬛⬛⬛⬛⬛ | `permissionMode\|approvalMode` grep 결과 0건 |
| Hook 증분 영향 | ⬛⬛⬛⬛⬜ | before-model.js 소스 직접 확인, E2E 구현 전까지 이론적 검증만 가능 |
| MCP 서버 증분 영향 | ⬛⬛⬛⬛⬛ | `--approval-mode` 문자열 grep 결과 `yolo`/`default`만 사용 확정 |
| 설정 파일 증분 영향 | ⬛⬛⬛⬛⬛ | 스키마 무변경 확정 |
| 철학 정합성 | ⬛⬛⬛⬛⬜ | `No Guessing`의 향후 주의 플래그만 남음 |

---

## 13. 부록 — v0.38.0 분석과의 차이 요약

| 구분 | v0.38.0 분석 | v0.38.1 증분 분석 |
|------|------------|------------------|
| 분석 시점 | 2026-04-16 | 2026-04-17 |
| 커버 범위 | v0.37.2 → v0.38.1 (포괄) | v0.38.0 → v0.38.1 (증분만) |
| Breaking Changes | 7건 (모두 Low) | 0건 |
| 직접 영향 파일 | 14개 | 0개 (간접 검증 1개) |
| Critical/High/Medium/Low | 0/0/3/4 | 0/0/0/2 |
| 필수 수정 항목 | 3건 | 0건 (v0.38.0 항목에 문자열 1개 추가) |
| 기능 개선 기회 | 6건 | +1건 (E2E 테스트) |

v0.38.1은 **v0.38.0 분석에 완전히 포섭**된다. v0.38.0 마이그레이션 플랜(`docs/01-plan/features/gemini-cli-v0.38.0-migration.plan.md`)의 target version을 `v0.38.1`로 in-place swap하는 전략이 가장 효율적이며, 별도 v0.38.1 전용 마이그레이션 플랜 작성은 불필요하다.

---

*분석 종료: 2026-04-17 (v0.38.0 → v0.38.1 증분 전용 보고서)*
*bkit-impact-analyzer agent*
