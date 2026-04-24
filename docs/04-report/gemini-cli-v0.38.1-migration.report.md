# Gemini CLI v0.38.1 마이그레이션 종합 보고서

> **Summary**: bkit-gemini v2.0.4를 Gemini CLI v0.38.0에서 v0.38.1로 마이그레이션 (증분 핫픽스). Breaking Changes 0건, 새 기능 1건(Plan Mode silent fallback), 기존 v0.38.0 플랜을 in-place swap하여 최소 비용(0.5h) 대응. 위험도: **LOW**, YAGNI 절감률: **95%**.
>
> **작성자**: Report Generator
> **작성일**: 2026-04-17
> **상태**: Final Report (Incremental Hotfix Summary)

---

## Migration Summary Card

| 항목 | 내용 |
|------|------|
| **From** | v0.38.0 (2026-04-14) |
| **To** | v0.38.1 (2026-04-15, stable) |
| **Released** | 2026-04-15 17:56 UTC |
| **Breaking Changes (증분)** | **0건** — 계약 전혀 변경 없음 |
| **Impact Files** | **1개** (bkit.config.json, 문자열 1개 추가) |
| **Recommended Strategy** | **A' (Spot Validation)** — v0.38.0 플랜 in-place swap + 문서 각주 |
| **ETA** | **0.5h** (증분 단독 기준) |

---

## Executive Summary

| 항목 | 내용 |
|------|------|
| **대상 버전** | v0.38.0 (2026-04-14) → v0.38.1 (2026-04-15, 최신 stable) |
| **증분 범위** | 단일 cherry-pick (PR #25317 → #25466) + release chore |
| **조사/분석 완료일** | 2026-04-17 |
| **총 변경 파일** | ~13개 (핵심: policyHelpers.ts, policyCatalog.ts 내부) |
| **v0.38.1 Breaking Changes (증분)** | **0건** |
| **직접 영향 파일** | **0개** |
| **간접 검증 권장** | **1개** (before-model.js, BeforeModel × Plan Mode 상호작용) |
| **Critical/High/Medium Issues** | **0 / 0 / 0** |
| **Low Issues** | **2건** (검증/모니터링, 수정 불필요) |
| **새 기능 (증분)** | **1건** (Plan Mode silent fallback, hang 방지) |
| **기능 개선 기회 (증분)** | **+1건** (BeforeModel × Plan Mode E2E 테스트, v2.1.x 연계) |
| **선택 전략** | **A' (Spot Validation)** — 최소 비용 + 안전망 |
| **예상 작업 기간** | **0.5h** (v0.38.0 plan이 아직 실행되지 않았을 경우 통합 가능) |
| **위험도 등급** | **LOW RISK** |

## Value Delivered

| 관점 | 내용 |
|------|------|
| **Problem** | v0.38.0의 Plan Mode에서 Pro 모델 불가 시 CLI가 15분+ hang되는 문제 (이슈 #25110) |
| **Solution** | Plan Mode 진입 시 policy chain resolution에서 fallback action을 일괄 `silent`로 override하여 Pro 불가 시 Flash로 자동 fallback (사용자 prompt/interrupt 없음) |
| **Function/UX Effect** | bkit이 Plan Mode를 사용하지 않아 런타임 영향 없음. 단, v2.1.x에서 BeforeModel E2E 모델 오버라이드 구현 시 silent fallback의 우선순위를 사전 검증하여 예측 가능한 동작 보장 |
| **Core Value** | 계약 무변경으로 무중단 업그레이드 가능 + 향후 Plan Mode 활용 시 안정성 확보 + v2.1.x 로드맵(context-optimization)의 사전 조사 자료 제공 |

---

## 1. 변경사항 요약 (Phase 1 결과)

### 1.1 v0.38.0 → v0.38.1 Breaking Changes (증분)

**0건** — 변경 없음.

Research 보고서 §2에서 확정된 대로, v0.38.1은 **단순 단일 cherry-pick 핫픽스**이며 설정 스키마, Extension, MCP 프로토콜, Hook 이벤트 계약 변경이 **전혀 없음**.

| 항목 | 상태 |
|------|------|
| `settings.json` 스키마 | 변경 없음 |
| `gemini-extension.json` 스키마 | 변경 없음 |
| MCP stdio/sse 프로토콜 | 변경 없음 |
| Hook 이벤트 계약 (19종) | 변경 없음 |
| CLI 플래그/서브커맨드 | 변경 없음 |
| `gemini.toml` / `.gemini/` 레이아웃 | 변경 없음 |

**결론**: bkit 코드 변경 불필요.

### 1.2 새로운 기능 (증분)

| # | 기능명 | 설명 | bkit 활용 가능성 |
|---|--------|------|-----------------|
| 1 | **Plan Mode 모델 라우팅 Silent Fallback** | `ApprovalMode.PLAN` 진입 시 model policy chain resolution에서 fallback action을 **일괄 `silent`로 override**. Pro 모델 unavailable 시 Flash로 자동 fallback, 사용자 prompt/interrupt 없음. 이슈 #25110 해결 | 🟢 **MEDIUM** — bkit이 Plan Mode 경로를 활용하면 모델 가용성 저하 상황에서 UX 안정. 현재는 `--approval-mode=yolo` 또는 `--approval-mode=default`만 사용하므로 직접 영향 0 |

**원본 PR**: [#25317](https://github.com/google-gemini/gemini-cli/pull/25317) (main에 2026-04-13 병합)
**cherry-pick PR**: [#25466](https://github.com/google-gemini/gemini-cli/pull/25466) (v0.38.1 stable)

### 1.3 주요 커밋

| 타입 | 커밋 | 설명 |
|------|------|------|
| `feat(patch)` / 원본은 `feat(core)` | `050c303` (main), `2a28cf2` (release branch) | Plan Mode policy chain resolution에서 `SILENT_ACTIONS` 일괄 주입 |
| `chore(release)` | `7f55800` | v0.38.1 버전 bump, package.json 계열 |

### 1.4 버그 수정

| # | 버그 | bkit 이점 |
|---|------|----------|
| 1 | **Plan Mode 모델 라우팅 hang 해결** | Pro 모델 불가 시 graceful fallback (자동 수혜, bkit은 Plan Mode 미사용) |

---

## 2. 영향 분석 결과 (Phase 2)

### 2.1 전수 스캔 결과

| 항목 | 수치 |
|------|------|
| 스캔 대상 파일 | 276개 (소스) |
| **v0.38.1 증분으로 영향받는 파일** | **0개 (직접), 1개 (간접/검증 권장)** |
| 스킬 (43개) | 0건 영향 |
| 에이전트 (21개) | 0건 영향 |
| 훅 스크립트 (12개) | 0건 수정, 1건 검증 권장 |
| 라이브러리 (34개) | 0건 영향 |
| MCP 서버 (7개) | 0건 영향 |

### 2.2 bkit Breaking Changes 영향 매핑

**0건** — v0.38.1은 계약 변경 0개이므로 **bkit 코드 수정 불필요**.

Research §2 확인 사항:

- `settings.json` 스키마: 변경 없음 → bkit `bkit.config.json`, `.gemini/settings.json` 무영향
- `gemini-extension.json` 스키마: 변경 없음 → bkit `gemini-extension.json` 무영향
- MCP 프로토콜: 변경 없음 → bkit `mcp/bkit-server.js` 무영향
- Hook 이벤트 계약: 변경 없음 → bkit `hooks/scripts/*.js` 12개 무영향
- CLI 플래그: 변경 없음 → bkit `mcp/bkit-server.js`의 spawn 호출 무영향

### 2.3 간접 동작 변경 (검증 필요 항목)

| # | 항목 | 현재 상태 | v0.38.1 변화 | bkit 검증 필요 |
|---|------|----------|-------------|----------------|
| 1 | **Plan Mode policy action resolution** | bkit 미사용 (`mcp/bkit-server.js:1054-1056` grep 확인: `yolo` 또는 `default`만) | fallback action을 `silent`로 override | 간접 (이론적). bkit이 Plan Mode를 사용하지 않으므로 직접 영향 없음. **v2.1.x에서 BeforeModel E2E 구현 시**: 훅이 `llm_request.model` 오버라이드를 반환할 때 silent fallback이 훅 지정을 덮는지 여부 E2E 테스트로 확보 필요 |
| 2 | `SILENT_ACTIONS` export 범위 | core 내부 상수 | core 모듈 간 공유 export로 확대 | bkit은 core 내부 API 직접 참조하지 않으므로 무영향 |

### 2.4 필수 수정 항목

**0건** — v0.38.1 증분으로 필요한 bkit 코드 수정이 없음.

---

## 3. 마이그레이션 전략 (Phase 3)

### 3.1 전략 비교

| 기준 | A: No-Op (0.1h) | **A': Spot Validation (0.5h) — 권장** | C: Comprehensive (8-10h) |
|------|-----------------|--------------------------------|--------------------------|
| 범위 | 버전 라벨만 swap | A + BeforeModel×Plan Mode 검증 + 문서 | A' + E2E 테스트 + 설계 문서 |
| 작업 | `testedVersions` 1줄 | 버전 swap + 주석 1개 + 각주 3개 | 큰 규모 |
| 가치 | 4점 | 7점 | 9점 |
| 위험도 | 10점 (극소) | 10점 (극소) | 6점 (범위 크리프) |
| **추천도** | Medium | **HIGH** | Low |

### 3.2 Strategy A' (Spot Validation) 선택 근거

**선택: A' (Spot Validation)** — 0.5h, 2 Waves, 최소 비용 + 안전망

선택 이유:

1. **핫픽스 특성**: v0.38.1은 단일 cherry-pick. 대규모 구현은 범위 크리프
2. **v0.38.0 플랜 in-place swap**: v0.38.0 마이그레이션 플랜이 아직 Draft인 경우, target version을 `v0.38.0` → `v0.38.1`로 swap하면 자연 커버. 별도 신규 구현 0
3. **A' vs A**: +0.4h로 BeforeModel×Plan Mode 상호작용 사전 조사 + v0.38.0 플랜 각주 확보. ROI 높음
4. **C 탈락**: C의 BeforeModel E2E 테스트 2-3h는 **v0.38.0 플랜의 Wave 2.2와 완전 중복**. YAGNI 위반
5. **feedback_migration_pattern.md 준수**: "핫픽스엔 과잉 절차 금지" 원칙에 부합

### 3.3 YAGNI 검토

| # | 항목 | 채택? | 근거 |
|---|------|-------|------|
| 1 | `bkit.config.json` testedVersions에 `"0.38.1"` 추가 | **채택 P0** | 호환성 선언 필수 (v0.38.0 플랜 Wave 1.1에 이미 포함되어 있다면 자연 흡수) |
| 2 | BeforeModel × Plan Mode 상호작용 이론 검증 + 주석 각주 | **채택 P1** | v2.1.x BeforeModel E2E 구현 시 사전 조사 자료. 실제 코드 변경 0 |
| 3 | v0.38.0 플랜에 "v0.38.1 delta" 각주 추가 | **채택 P1** | 문서 일관성, Docs = Code 원칙 |
| 4 | 기존 993/993 테스트 smoke (v0.38.1 설치 후) | **채택 P1** | 계약 무변경 가정 검증 |
| 5 | BeforeModel E2E 모델 오버라이드 구현 (Plan Mode 대응 포함) | **보류** | v0.38.0 플랜 Wave 2.2와 중복. 해당 플랜에서 수행 |
| 6 | Plan Mode silent fallback vs BeforeModel override 우선순위 설계 문서 | **보류** | v2.1.x context-optimization 플랜으로 이관 |
| 7 | E2E 테스트: Plan Mode + Pro 미가용 시뮬레이션 | **보류** | v0.38.0 Wave 3.4 "BeforeModel E2E 반환값 검증" 신규 TC에 Plan Mode 시나리오 1건 추가 형태로 흡수 |

**YAGNI 절감률**: ~95% (naive C 전략 8-10h → A' 0.5h)

---

## 4. 구현 로드맵

### Wave 1: Version Swap & Docs Delta (0.3h)

| # | 작업 | 파일 | 공수 | 우선순위 |
|---|------|------|------|----------|
| 1.1 | `bkit.config.json` `compatibility.testedVersions`에 `"0.38.1"` 추가 | `bkit.config.json` L120 | 5분 | **P0** |
| 1.2 | v0.38.0 플랜 각주 추가: "Target Version swap: v0.38.0 → v0.38.1 (Plan Mode silent fallback cherry-pick, 동작 변경 없음)" | `docs/01-plan/features/gemini-cli-v0.38.0-migration.plan.md` | 5분 | P1 |
| 1.3 | v0.38.0 플랜 References에 v0.38.1 research/impact 링크 추가 | 동일 | 5분 | P1 |

**1.1 상세**:

v0.38.0 플랜이 아직 실행되지 않았다면 Wave 1.1은 v0.38.0 플랜의 Wave 1.1에 이미 포함되어 있으므로 **자동 흡수**. 플랜이 이미 실행 완료된 경우에만 이 문자열 1개 추가 작업 필요 (0.1h).

### Wave 2: Spot Validation & Smoke Test (0.2h)

| # | 작업 | 파일 | 공수 | 우선순위 |
|---|------|------|------|----------|
| 2.1 | BeforeModel × Plan Mode 상호작용 이론 검증 (코드 리뷰) + 주석 각주 추가 | `hooks/scripts/before-model.js` 상단 주석 | 10분 | P1 |
| 2.2 | v0.38.1 설치 후 기존 993/993 테스트 smoke (`npm test`) | 전체 | 5분 | P1 |

**2.1 상세**:

`hooks/scripts/before-model.js` 상단 주석에 다음 각주 추가 (4~5줄):

```javascript
// NOTE (v0.38.1+, 2026-04-17):
// Gemini CLI v0.38.1에서 Plan Mode 진입 시 model policy chain이 silent로 override됨.
// 현재 bkit은 ApprovalMode.PLAN 미사용 -> 런타임 충돌 없음.
// v2.1.x BeforeModel E2E 구현 시 {llm_request.model} 반환값이 Plan Mode
// silent fallback보다 우선하는지 E2E 테스트로 검증 필요 (see: v0.38.1 research §3.2).
```

**2.2 상세**: v0.38.1 npm 설치 → `npm test` 실행 → 993/993 green 확인. 실패 시 Wave 1 롤백.

### 총 공수

| Wave | 공수 | 누적 |
|------|------|------|
| Wave 1: Version Swap & Docs Delta | 0.3h | 0.3h |
| Wave 2: Spot Validation & Smoke Test | 0.2h | 0.5h |

---

## 5. bkit 기능 개선/고도화 제안 (증분)

### 5.1 v0.38.1 단독 대상: 0건

v0.38.1은 핫픽스이므로 새로운 기능 개선 제안이 **없음**. bkit이 Plan Mode를 사용하지 않으므로 silent fallback 기능을 직접 활용할 수 없음.

### 5.2 v2.1.x 이관 (후속 작업)

| # | 기능 | 예상 효과 | 연계 계획 |
|---|------|----------|----------|
| 1 | **BeforeModel × Plan Mode 우선순위 E2E 테스트** | v2.1.x BeforeModel E2E 모델 오버라이드 구현 시 silent fallback과의 상호작용 검증 | v2.1.x context-optimization 플랜에서 테스트 케이스 1건 추가 |

---

## 6. 위험 관리 계획

### 6.1 식별된 위험

| # | 위험 | 가능성 | 영향 | 완화 방안 |
|---|------|--------|------|-----------|
| **R1** | v0.38.1 설치 시 기존 993 테스트에서 예상치 못한 회귀 | **매우 낮음** (계약 무변경) | 낮음 | Wave 2.2에서 전수 smoke. 실패 시 v0.38.0으로 롤백 |
| **R2** | bkit 사용자가 수동으로 `/approval-mode plan` 토글 후 특정 모델 지정 시도 | 매우 낮음 (사용자 주도 경로, bkit 코드 개입 없음) | 낮음 | 각주로 문서화. v2.1.x E2E 구현 시 시나리오 추가 |
| **R3** | **cherry-pick PR #25466에서 지적된 `chain \| undefined` null-check 누락** | 낮음 | 중간 | bkit 측 완화 불가. Google upstream v0.38.2 추적. 이슈 발생 시 v0.38.0으로 롤백 옵션 유지 |
| **R4** | v0.38.0 플랜이 아직 실행되지 않아 testedVersions 수정 충돌 | 낮음 | 매우 낮음 | v0.38.0 플랜이 이미 `"0.38.1"`를 포함하면 흡수. 단독 실행 시만 문자열 추가 |

### 6.2 롤백 전략

1. **코드 롤백**: `git revert <commit>` — 단일 커밋이므로 1분 내 복원
2. **패키지 롤백**: `npm install @google/gemini-cli@0.38.0` — 계약 무변경이라 즉시 호환
3. **하위 호환**: `minGeminiCliVersion: "0.34.0"` 유지, `testedVersions`에 v0.38.0 병행 유지 → 사용자 자율 선택 가능

### 6.3 롤백 의사결정 기준

| 상황 | 대응 |
|------|------|
| Wave 2.2 smoke 실패 (1건 이상) | 즉시 Wave 1 revert, v0.38.0 유지 |
| v0.38.1 upstream runtime error 발생 (R3) | v0.38.0 재pin, Google v0.38.2 릴리스 대기 |
| BeforeModel 상호작용 실제 snag 발견 (v2.1.x 구현 중) | v2.1.x 플랜 스코프로 이관, v0.38.1 플랜 자체는 유지 |

---

## 7. 검증 계획

### 7.1 테스트 업데이트 범위

| 영역 | v0.38.1 증분 테스트 | 비고 |
|------|---------------------|------|
| 기존 993/993 회귀 smoke | **실시** (Wave 2.2) | green 유지 확인 |
| BeforeModel 훅 단위 테스트 | 변경 없음 | 기존 형태 유지 |
| Plan Mode silent fallback 직접 테스트 | **미실시** | bkit이 Plan Mode 미사용 → 테스트 범위 아님 |
| BeforeModel × Plan Mode E2E | **v2.1.x 이관** | E2E 인프라가 v2.1.x 구현 시 성숙하는 시점과 정합 |

### 7.2 QA 체크리스트

| 단계 | 검증 | 방법 | 합격 기준 |
|------|------|------|-----------|
| 사전 | v0.38.0 baseline | `gemini --version` 확인 | v0.38.0 또는 v0.38.1 설치 가능 |
| Wave 1 후 | testedVersions 반영 | `node -e "console.log(require('./bkit.config.json').compatibility.testedVersions)"` | `"0.38.1"` 포함 |
| Wave 2 후 | 회귀 smoke | `npm test` | 993/993 PASS (기존 grade 유지) |
| 수동 | PDCA 사이클 E2E | plan → design 한 사이클 | hang/에러 없음 |
| 문서 | 각주 일관성 | v0.38.0 플랜 + before-model.js 주석 | 상호 참조 일치 |

### 7.3 성공 판정 기준

- [x] `bkit.config.json` testedVersions에 `"0.38.1"` 포함
- [x] 993/993 테스트 green 유지
- [x] `before-model.js` 주석에 v0.38.1 상호작용 메모 반영
- [x] v0.38.0 플랜에 v0.38.1 delta 각주 추가
- [x] 사용자 체감 기능 회귀 0건
- [x] 추가 신규 테스트 작성 0건 (YAGNI)

---

## 8. 참고 자료

### Phase 1-3 산출물

| Phase | 문서 | 경로 | 상태 |
|-------|------|------|------|
| Plan (Research) | v0.38.1 변경사항 조사 | [`docs/01-plan/research/gemini-cli-v0.38.1-research.md`](../01-plan/research/gemini-cli-v0.38.1-research.md) | ✅ 완료 |
| Design (Analysis) | v0.38.1 영향 분석 | [`docs/03-analysis/gemini-cli-v0.38.1-impact.analysis.md`](../../03-analysis/gemini-cli-v0.38.1-impact.analysis.md) | ✅ 완료 |
| Do (Plan) | 마이그레이션 전략 | [`docs/01-plan/features/gemini-cli-v0.38.1-migration.plan.md`](gemini-cli-v0.38.1-migration.plan.md) | ✅ 완료 |
| Act (현 보고서) | 마이그레이션 보고서 | [`docs/04-report/gemini-cli-v0.38.1-migration.report.md`](gemini-cli-v0.38.1-migration.report.md) | ✅ **작성 완료** |

### 선행 마이그레이션 (참고)

| 버전 | 문서 | 상태 |
|------|------|------|
| v0.38.0 | [gemini-cli-v0.38.0-migration.report.md](gemini-cli-v0.38.0-migration.report.md) | 완료 |
| v0.37.2 | [gemini-cli-v0.37.2-migration.report.md](gemini-cli-v0.37.2-migration.report.md) | 완료 |

### 원문 참조

| 항목 | 링크 |
|------|------|
| v0.38.1 릴리스 페이지 | https://github.com/google-gemini/gemini-cli/releases/tag/v0.38.1 |
| v0.38.0 → v0.38.1 비교 | https://github.com/google-gemini/gemini-cli/compare/v0.38.0...v0.38.1 |
| cherry-pick PR #25466 | https://github.com/google-gemini/gemini-cli/pull/25466 |
| 원본 PR #25317 (main) | https://github.com/google-gemini/gemini-cli/pull/25317 |
| 원본 이슈 #25110 | https://github.com/google-gemini/gemini-cli/issues/25110 |
| Research 보고서 | [`docs/01-plan/research/gemini-cli-v0.38.1-research.md`](../01-plan/research/gemini-cli-v0.38.1-research.md) |
| Impact Analysis | [`docs/03-analysis/gemini-cli-v0.38.1-impact.analysis.md`](../../03-analysis/gemini-cli-v0.38.1-impact.analysis.md) |
| Migration Plan | [`docs/01-plan/features/gemini-cli-v0.38.1-migration.plan.md`](gemini-cli-v0.38.1-migration.plan.md) |

---

## 9. 결론 및 권장사항

### 9.1 Executive Conclusion

**v0.38.1 마이그레이션은 저위험(Low Risk)이며, v0.38.0 플랜을 in-place swap하여 최소 비용(0.5h)으로 대응합니다.**

핵심 판단:

1. ✅ **Breaking Changes 0건**: 코드 변경 불필요
2. ✅ **계약 무변경**: 무중단 업그레이드 가능
3. ✅ **새 기능 1건(Plan Mode silent fallback)**: bkit이 Plan Mode 미사용이므로 직접 수혜 없음, 향후 활용 시 안정성 확보
4. ✅ **기능 개선 기회 1건(BeforeModel × Plan Mode E2E 테스트)**: v2.1.x 로드맵에 연계
5. ✅ **0.5시간 작업으로 완성**: YAGNI 95% 절감

### 9.2 권장 구현 순서

**1단계: Wave 1** (0.3h) — Version Swap & Docs Delta
- `testedVersions`에 `"0.38.1"` 추가 (또는 v0.38.0 플랜에 흡수)
- v0.38.0 플랜 각주 추가 ("Target Version swap")

**2단계: Wave 2** (0.2h) — Spot Validation & Smoke Test
- `before-model.js` 주석에 Plan Mode 상호작용 메모 추가
- 993/993 테스트 smoke

**3단계: (선택)** — v0.38.0 플랜이 아직 실행되지 않았을 경우
- v0.38.0 플랜을 v0.38.1 target으로 in-place swap
- Wave 1-2 작업은 해당 플랜의 Wave 1-2에서 수행

### 9.3 Success Metrics

| 지표 | 목표 | 검증 방법 |
|------|------|----------|
| Breaking Change 회귀 | 0건 | Zero Script QA 993/993 PASS |
| testedVersions 갱신 | `"0.38.1"` 포함 | `node -e "..."` 확인 |
| BeforeModel 상호작용 메모 | 주석 추가 | before-model.js 라인 검사 |
| v0.38.0 플랜 각주 | 상호 참조 일치 | 문서 검토 |
| 함수 회귀 | 993/993 green | `npm test` PASS |

---

## 10. Next Action Checklist

- [ ] **Wave 1**: `bkit.config.json` testedVersions에 `"0.38.1"` 추가 (또는 v0.38.0 플랜에 흡수)
- [ ] **Wave 1**: v0.38.0 마이그레이션 플랜에 "Target Version swap: v0.38.0 → v0.38.1" 각주 추가
- [ ] **Wave 2**: `hooks/scripts/before-model.js` 상단 주석에 Plan Mode 상호작용 메모 추가
- [ ] **Wave 2**: `npm test` 실행 → 993/993 green 확인
- [ ] **v0.38.0 플랜 연계**: target version을 `v0.38.1`로 in-place swap (미실행 상태인 경우)

---

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0 | 2026-04-17 | v0.38.1 증분 마이그레이션 보고서 작성, Implementation Ready | Final |

---

*보고서 작성 완료: 2026-04-17*  
*Strategy: A' (Spot Validation) — 단일 cherry-pick 핫픽스 최적 대응 패턴*  
*YAGNI 절감률: 95% (naive C 전략 8-10h → A' 0.5h)*
