# Gemini CLI v0.38.2 마이그레이션 종합 보고서

> **Summary**: bkit-gemini v2.0.4를 Gemini CLI v0.38.1에서 v0.38.2로 마이그레이션 (증분 UI 핫픽스). Breaking Changes 0건, 새 기능 1건(Edit/Write 확인 UI 파일 경로 복원), 단 릴리스 직후 보고된 🔴 Issue #25655 "SessionStart 훅 `systemMessage` 이중 렌더링"이 bkit 경로에 정면 적중. 전략 **B' (Spot Validation + Defensive Test)**로 testedVersions 업데이트 + tc107 방어 테스트 신설. 위험도: **MEDIUM**, YAGNI 절감률: **~80%**.
>
> **작성자**: Report Generator (Phase 4)
> **작성일**: 2026-04-20
> **상태**: Final Report (Pre-Do Synthesis)

---

## Migration Summary Card

| 항목 | 내용 |
|------|------|
| **From** | v0.38.1 (2026-04-15) |
| **To** | v0.38.2 (2026-04-17, stable) |
| **Released** | 2026-04-17 18:38 UTC |
| **Breaking Changes (증분)** | **0건** — 설정/훅/MCP/CLI/확장 계약 전부 무변경 |
| **Impact Files** | **1개 직접 수정** (`bkit.config.json`) + **1개 관찰** (`hooks/scripts/session-start.js`) |
| **Critical Issue (업스트림)** | **Issue #25655** (SessionStart 훅 systemMessage 이중 렌더링) |
| **Recommended Strategy** | **B' (Spot Validation + Defensive Test)** — v0.38.1 plan in-place swap + tc107 신설 |
| **ETA** | **0.5h P0 필수** + 2h P1 (방어 테스트) = **총 2.5h** |
| **Risk Grade** | **MEDIUM** |
| **YAGNI Savings** | **~80%** (naive C 전략 10-15h → B' 2.5h) |

---

## Executive Summary

| 항목 | 내용 |
|------|------|
| **대상 버전** | v0.38.1 (2026-04-15) → v0.38.2 (2026-04-17, 최신 stable) |
| **증분 범위** | 단일 cherry-pick (PR #24974 → #25585) + 9 release chore files |
| **조사/분석 완료일** | 2026-04-20 |
| **총 변경 파일 (업스트림)** | 7 functional + 9 release chore |
| **v0.38.2 Breaking Changes (증분)** | **0건** |
| **직접 영향 bkit 파일** | **1개** (`bkit.config.json` testedVersions 추가) |
| **간접 영향 (업스트림 후속 이슈)** | **1개** (`hooks/scripts/session-start.js` Line 89, 114) |
| **Critical Issues** | **1건** (Issue #25655 — CLI 상위 렌더러 버그, bkit 훅 경로에 적중) |
| **High / Medium Issues** | **0 / 0** |
| **Low Issues** | **2건** (testedVersions 문자열 추가 / UI 경로 복원 UX 체감) |
| **새 기능 (증분)** | **1건** (Edit/WriteFile 도구 확인 UI 파일 경로 복원) |
| **기능 개선 기회** | **+1건** (tc107 회귀 방어 테스트 기반 구축 → 미래 SessionStart 훅 회귀 자동 감지) |
| **선택 전략** | **B' (Spot Validation + Defensive Test)** — 가중 합계 8.05 (A 6.00, C 6.90) |
| **예상 작업 기간** | **0.5h P0** + 2h P1 = **2.5h** |
| **위험도 등급** | **MEDIUM** (계약 LOW + Issue #25655 간접 회귀 가능성) |

## Value Delivered

| 관점 | 내용 |
|------|------|
| **Problem** | (1) npm `latest` 태그가 v0.38.2로 교체되어 testedVersions 미포함 시 사용자가 "미검증 환경"에서 bkit 사용. (2) 릴리스 직후 Issue #25655 발견 — SessionStart 훅 `systemMessage`가 **두 번 렌더링**되어 bkit Welcome/PDCA 지침/Phase-Aware Context 2회 중복 출력, `notifications:false` 무시 |
| **Solution** | (1) `bkit.config.json` testedVersions에 `"0.38.1"`, `"0.38.2"` 추가. (2) v0.38.1 plan의 target version을 in-place swap. (3) **올바른 위치의 조치**: bkit 훅 본문 수정 금지(NG1) — 이슈는 CLI 상위 렌더러 버그이므로 훅 가드는 wrong-layer fix. 대신 `tc107-v0382-session-start-duplication.js` 방어 테스트로 훅 계약(1회 JSON 배출)을 고정하여 업스트림 픽스 도래 시 자동 회귀 감지 |
| **Function / UX Effect** | Edit/WriteFile 확인 프롬프트에서 **파일 경로 노출 복원** → bkit 스킬·에이전트 30개+가 자동 UX 수혜. SessionStart 중복은 업스트림 픽스 도래 시 자동 해결, 그 사이 `tc107`이 훅 단위 회귀 방어 |
| **Core Value** | **No Guessing 원칙 준수**: 증상(CLI 레이어 버그)을 훅에서 추측 수정하지 않음. **Docs = Code**: v0.38.1 plan delta 각주로 문서 일관성. **Automation First**: tc107로 업스트림 픽스 자동 추적. 최소 비용(2.5h)으로 Critical 회귀 방어 + 호환성 선언 완료 |

---

## 1. 변경사항 요약 (Phase 1 결과)

### 1.1 v0.38.1 → v0.38.2 Breaking Changes (증분)

**0건** — 계약 전면 무변경.

| 항목 | 상태 |
|------|------|
| `settings.json` 스키마 | 변경 없음 |
| `gemini-extension.json` 스키마 | 변경 없음 |
| MCP stdio/sse 프로토콜 | 변경 없음 |
| Hook 이벤트 계약 (19종) | 변경 없음 |
| CLI 플래그/서브커맨드 | 변경 없음 |
| `gemini.toml` / `.gemini/` 레이아웃 | 변경 없음 |

**결론**: bkit 코드 계약 변경 불필요.

### 1.2 새로운 기능 (증분)

| # | 기능명 | 설명 | bkit 활용 가능성 |
|---|--------|------|-----------------|
| 1 | **Edit/WriteFile 확인 UI 파일 경로 복원** | PR #24974 원본, cherry-pick PR #25585. v0.38.0의 PR #24376이 만든 UI 회귀(파일 경로 미표시)를 수정. 사용자가 Edit/WriteFile 도구 승인 시 대상 경로를 다시 볼 수 있음 | 🟢 **HIGH** — bkit 스킬·에이전트가 `write_file`/`replace` 도구를 사용하는 모든 경로에서 자동 혜택 |

### 1.3 🔴 Critical 후속 이슈 (릴리스 후 발견)

**Issue #25655**: SessionStart 훅 `systemMessage` 이중 렌더링

| 속성 | 내용 |
|------|------|
| 재현 환경 | Windows 11 (확인), macOS/Linux (미확인) |
| 증상 | SessionStart 훅이 반환한 `systemMessage` 블록이 CLI 세션 화면에 **2회 렌더링** |
| 영향받지 않는 이벤트 | BeforeAgent, BeforeTool (정상) |
| 부가 증상 | ANSI escape 리터럴 출력, `notifications: false` 무시 |
| 업스트림 수정 PR | **없음** (2026-04-20 기준) |

### 1.4 원문 참조

- [v0.38.2 릴리스 태그](https://github.com/google-gemini/gemini-cli/releases/tag/v0.38.2)
- [v0.38.1…v0.38.2 compare](https://github.com/google-gemini/gemini-cli/compare/v0.38.1...v0.38.2)
- [PR #25585 cherry-pick](https://github.com/google-gemini/gemini-cli/pull/25585)
- [PR #24974 원본](https://github.com/google-gemini/gemini-cli/pull/24974)
- [PR #24376 회귀 원인](https://github.com/google-gemini/gemini-cli/pull/24376)
- [**Issue #25655 CRITICAL**](https://github.com/google-gemini/gemini-cli/issues/25655)

---

## 2. 영향 분석 결과 (Phase 2 결과)

### 2.1 영향도 집계

| 영향도 | 건수 | 비고 |
|--------|------|------|
| 🔴 Critical | **1** | Issue #25655 SessionStart 훅 이중 렌더링 (업스트림 버그, bkit 훅 경로 적중) |
| 🟠 High | 0 | — |
| 🟡 Medium | 0 | — |
| 🟢 Low | **2** | testedVersions 문자열 추가 / UI 경로 복원 UX 체감 |

### 2.2 Issue #25655 bkit 적중 근거

| 파일 | 라인 | 역할 | 증거 |
|------|------|------|------|
| `hooks/scripts/session-start.js` | **L89** | 정상 경로 `systemMessage: dynamicContext` (Welcome/PDCA/Phase-Aware Context) | stdout JSON 1회 배출 중 (훅 계약은 정상) |
| `hooks/scripts/session-start.js` | **L114** | Fallback 경로 `systemMessage: 'bkit Vibecoding Kit v2.0.4 activated (Gemini CLI)'` | 에러 시 동일 systemMessage 필드 |
| `lib/gemini/platform.js` | **L97-108** | `outputAllow()` 헬퍼가 `output.systemMessage = context` 생성 | 공용 JSON 배출 헬퍼 |
| `hooks/hooks.json` | **L4-15** | SessionStart 이벤트에 `bkit-session-init` 훅 명시적 등록 | 훅 등록 지점 |

**MCP 서버(`mcp/bkit-server.js`)는 `systemMessage`를 사용하지 않음** → MCP 경로는 무관 (grep 확인).

### 2.3 철학 정합성 검증

| 원칙 (bkit-system/philosophy) | 정합 | 비고 |
|-------------------------------|------|------|
| core-mission.md — No Guessing | ✅ | 증상 원인이 CLI 상위 렌더러임을 확인, 훅에서 추측 수정하지 않음 |
| core-mission.md — Docs = Code | ✅ | v0.38.1 plan target swap + delta 각주로 동기화 |
| core-mission.md — Automation First | ✅ | tc107로 업스트림 픽스 자동 추적 |
| ai-native-principles.md | ✅ | Human-AI 역할 분담 변경 없음 |
| pdca-methodology.md | ✅ | PDCA 사이클, 19종 훅 이벤트 계약 무변경 |
| context-engineering.md | ⚠️ 간접 | SessionStart Context Fork 영향 없음 (훅 JSON 1회 배출). 단 Welcome/PDCA systemMessage가 CLI 레이어에서 중복 출력되는 일시적 UX 저하 존재 |

---

## 3. 마이그레이션 전략 (Phase 3 결과)

### 3.1 대안 비교 Evaluation Matrix

| 기준 (가중치) | A: 최소 수정 (0.3h) | **B: 방어 테스트 (2.5h)** | C: 업스트림 기여 (5-7h) |
|---------------|---------------------|----------------------------|--------------------------|
| 위험도 (30%) | 5 (Issue #25655 방치) | **9 (방어 확보)** | 9 |
| 작업량 (25%) | 10 | **7** | 3 |
| 가치 창출 (25%) | 4 | **8** | 9 |
| 장기 이점 (20%) | 4 | **8** | 9 |
| **가중 합계** | 6.00 | **8.05** | 6.90 |

### 3.2 선택: Strategy B' (Spot Validation + Defensive Test)

**선택 근거**:

1. **Critical 회귀 방어 필수**: Issue #25655가 bkit `hooks/scripts/session-start.js` 경로에 정면 적중. 방어 테스트 없이 태그 업데이트는 무책임
2. **올바른 위치의 수정**: 근본 버그는 CLI 상위 렌더러 → bkit 코드 수정은 wrong-layer fix. 방어 테스트(`tc107`)가 올바른 조치
3. **업스트림 픽스 자동 추적**: `tc107`은 업스트림 픽스 도래 시점을 자동으로 알려주는 "카나리아"
4. **Strategy B 패턴 일관성**: migration-strategist memory의 "Strategy B 기본 채택" 원칙 준수. 핫픽스 규모에 맞게 축소한 B' 변종

### 3.3 SessionStart 중복 이슈 완화 — 옵션 1 (Passive + Defensive Test) 선택

| 옵션 | 결정 | 근거 |
|------|------|------|
| **옵션 1 (채택)**: 업스트림 수정 대기 + tc107 방어 테스트 | ✅ | 이슈는 CLI 상위 렌더러. 훅은 이미 1회 배출. 가장 정직한 조치 |
| 옵션 2: session-start.js 가드 추가 | ❌ | 잘못된 위치의 수정. 업스트림 픽스 도래 시 오히려 회귀 유발 |
| 옵션 3: 중복 감지 런타임 경고 | ❌ | 경고 문구 자체도 중복 렌더링되어 **악화** |

### 3.4 YAGNI 핵심 결정 (13개 항목 중 6개 채택, 7개 보류)

**채택 (P0/P1)**:
- testedVersions 추가, version.js 동기화, smoke test, plan target swap, delta 각주, References 링크
- tc107 방어 테스트 신설, sentinel 카운트 검증, docstring 한계 명시, E2E 수동 재현 기록

**보류 (YAGNI)**:
- session-start.js 본문 수정 (NG1 — wrong layer)
- `notifications:false` 삽입 (NG2 — 무시됨)
- Phase-Aware Context BeforeAgent 이관 (업스트림 픽스 후 무의미)
- `tool.description` ANSI sanitization (주입 경로 없음)
- 업스트림 기여 (내부 품질 무관 → P3)

**YAGNI 절감률**: **~80%** (naive C 전략 10-15h → B' 2.5h)

---

## 4. 구현 로드맵 (Implementation Roadmap)

### 4.1 Wave 구조 (3 Waves)

| Wave | 목적 | 공수 | 우선순위 |
|------|------|------|----------|
| **Wave 1**: Version Swap & Smoke | testedVersions 추가, version.js 동기화, `npm test` 993/993 green | 0.3h | **P0** |
| **Wave 2**: Plan Target Swap & Annotation | v0.38.1 plan target `v0.38.2` swap, delta 각주, References 링크 | 0.2h | **P0** |
| **Wave 3**: Defensive Regression Test | `tc107-v0382-session-start-duplication.js` 신설, E2E 수동 재현 | 2.0h | **P1** |
| **Buffer** | — | 0h | — |
| **총 공수** | — | **2.5h** | — |

### 4.2 Wave별 상세 작업

#### Wave 1 — Version Swap & Smoke (P0, 0.3h)

1. `bkit.config.json` `compatibility.testedVersions`에 `"0.38.1"`, `"0.38.2"` 추가 (5분)
2. `lib/gemini/version.js` testedVersions/feature flag 레지스트리 동기화 확인 (5분)
3. v0.38.2 설치 후 `npm test` → **993/993 green** 확인 (5분)

#### Wave 2 — Plan Target Swap & Delta Annotation (P0, 0.2h)

1. `docs/01-plan/features/gemini-cli-v0.38.1-migration.plan.md` 상단 target version을 `v0.38.2`로 in-place swap (5분)
2. 동일 plan Executive Summary 하단에 "v0.38.2 delta: PR #24974 UI 복원 cherry-pick + Issue #25655 방어 테스트 추가" 각주 추가 (5분)
3. 동일 plan References 섹션에 v0.38.2 research/impact 링크 추가 (3분)

#### Wave 3 — Defensive Regression Test (P1, 2.0h)

1. `tests/suites/tc107-v0382-session-start-duplication.js` 스켈레톤 (30분)
2. 테스트 로직: `hooks/scripts/session-start.js`를 subprocess 실행 → stdout JSON parse → `systemMessage` 필드 정확히 1회 검증 (30분)
3. Sentinel 문자열(`bkit Session Start`) 카운트 검증 추가 (15분)
4. Docstring에 한계 명시: "훅 단위만 검증. CLI 상위 렌더러 중복은 E2E 수동 확인 필요 (Issue #25655)" (10분)
5. 수동 E2E: v0.38.2 설치 → bkit extension 활성화 → `gemini` 실행 → `bkit Session Start` 등장 횟수 기록 (20분)
6. `npm test`로 tc107 포함 **994/994 green** 확인 (5분)

### 4.3 Deferred (Wave 4)

| 항목 | 위임 대상 |
|------|----------|
| `hooksConfig.showOutput` / BeforeModel E2E / Plan Mode silent fallback 통합 검증 | v0.38.0 plan Wave 2 |
| v2.1.x context-optimization 연계 | v2.1.0 plan |
| Issue #25655 upstream contribution | P3 (여력 있을 때) |
| v0.39.0-preview.0 breaking 대응 (Legacy subagent wrapping tools 제거) | 별도 마이그레이션 트리거 |

---

## 5. bkit 기능 개선/고도화 제안

| # | 제안 | 근거 (Phase 1~3) | 우선순위 | 담당 Plan |
|---|------|------------------|---------|-----------|
| 1 | **tc107 회귀 방어 테스트 신설** | Issue #25655 대응 + 미래 SessionStart 훅 회귀 자동 감지 기반 | **P1** | 본 plan Wave 3 |
| 2 | **Edit/Write UI 경로 복원 활용도 측정** | PR #24974로 파일 경로 노출이 복원되어 bkit 스킬 30개+ 자동 수혜 → 사용자 피드백 수집 | P3 | 별도 UX 모니터링 |
| 3 | **SessionStart 훅 JSON 스키마 정형화** | 훅 stdout JSON 1회 배출이 CLI 레이어와 무관하게 고정된 계약임을 문서화 | P2 | context-engineering.md 후속 |
| 4 | **업스트림 픽스 모니터링 자동화** | v0.38.3 / v0.39.x 릴리스 감지 시 자동 마이그레이션 트리거 | P3 | `/gemini-migration` 스킬 확장 |
| 5 | **Strategy B 패턴 메모리화 완료** | 8회째 Strategy B 적용 (B'), migration-strategist 메모리에 축적 | ✅ 완료 | — |

---

## 6. 위험 관리 계획 (Risk Management)

| # | 위험 | 확률 | 영향 | 완화책 |
|---|------|------|------|--------|
| R1 | Issue #25655로 실제 사용자 세션에서 SessionStart 중복 출력 | **High** (Windows 11 확인) | Medium (UX 저하, 기능 정상) | 옵션 1 passive + tc107, output-style 안내 선택 추가 |
| R2 | 업스트림 v0.38.3/v0.39.x #25655 픽스 지연 | Medium | Medium | tc107이 픽스 도래 자동 감지, v0.38.1 권장 경로 유지 |
| R3 | tc107 작성 중 test harness 호환성 문제 | Low | Low | Wave 3 실패 시 P0만 유지, tc107 차회 이관 |
| R4 | v0.38.2 설치 후 993/993 예상치 못한 회귀 | Very Low (계약 무변경) | High | `git revert` + v0.38.1 재pin, 원인 분석 |
| R5 | 타 이슈(#25615 shell loop, #25610 theme) bkit 경로 영향 | Low (미사용 경로) | Low | Impact §7 근거로 영향 없음, 모니터링 유지 |
| R6 | 미래 bkit 훅 확장 시 `tool.description` ANSI injection 보안 이슈 | Very Low | Low | 현재 주입 경로 없음, skill 추가 시 선형 감시 |
| R7 | v0.38.1 plan target swap의 git conflict | Very Low | Very Low | 단일 작업자 기준 직선 swap |

### 롤백 의사결정 기준

| 상황 | 대응 |
|------|------|
| Wave 1 smoke 실패 | 즉시 revert, v0.38.1 재pin |
| Wave 3 tc107 설계/환경 이슈 | Wave 3 포기, P0만 유지 |
| E2E SessionStart 심각 UX 저하 확인 | output-style 안내 추가, v0.38.1 권장 명시 |
| 업스트림 v0.38.3 #25655 픽스 릴리스 | 즉시 v0.38.3 마이그레이션 트리거 |

---

## 7. 검증 체크리스트 (Acceptance Criteria)

### 7.1 P0 필수

- [ ] `bkit.config.json` `compatibility.testedVersions`에 `"0.38.1"`, `"0.38.2"` 포함
- [ ] `lib/gemini/version.js` (존재 시) testedVersions 동기화
- [ ] v0.38.2 설치 상태 `npm test` → **993/993 PASS**
- [ ] 수동 E2E: v0.38.2 실환경 `gemini` 실행 시 "bkit Session Start" 등장 **횟수 관찰 결과 Do report 기록**
- [ ] Edit/Write 확인 UI에서 파일 경로 노출 확인 (샘플 1회 이상)
- [ ] v0.38.1 plan 상단 target `v0.38.2`로 swap 완료
- [ ] v0.38.1 plan에 v0.38.2 delta 각주 + research/impact 링크 존재

### 7.2 P1 선택

- [ ] `tests/suites/tc107-v0382-session-start-duplication.js` 신설
- [ ] tc107이 훅 프로세스 stdout JSON `systemMessage` 필드를 정확히 1회만 검출
- [ ] tc107 docstring에 "CLI 상위 렌더러 중복은 E2E 수동 확인 필요" 한계 명시
- [ ] tc107 포함 `npm test` → **994/994 PASS**

---

## 8. 참고 자료 (References)

### 8.1 bkit 내부 (본 마이그레이션 산출물)

- Research: [docs/01-plan/research/gemini-cli-v0.38.2-research.md](../01-plan/research/gemini-cli-v0.38.2-research.md)
- Impact Analysis: [docs/03-analysis/gemini-cli-v0.38.2-impact.analysis.md](../03-analysis/gemini-cli-v0.38.2-impact.analysis.md)
- Plan: [docs/01-plan/features/gemini-cli-v0.38.2-migration.plan.md](../01-plan/features/gemini-cli-v0.38.2-migration.plan.md)
- Parent Plan (target swap 대상): [docs/01-plan/features/gemini-cli-v0.38.1-migration.plan.md](../01-plan/features/gemini-cli-v0.38.1-migration.plan.md)

### 8.2 업스트림

- [v0.38.2 Release](https://github.com/google-gemini/gemini-cli/releases/tag/v0.38.2)
- [v0.38.1…v0.38.2 compare](https://github.com/google-gemini/gemini-cli/compare/v0.38.1...v0.38.2)
- [PR #25585 cherry-pick](https://github.com/google-gemini/gemini-cli/pull/25585)
- [PR #24974 원본 — fix(cli): restore file path display](https://github.com/google-gemini/gemini-cli/pull/24974)
- [PR #24376 회귀 원인](https://github.com/google-gemini/gemini-cli/pull/24376)
- **[Issue #25655 (CRITICAL) — SessionStart 훅 systemMessage 이중 렌더링](https://github.com/google-gemini/gemini-cli/issues/25655)**
- [Issue #25615 Windows shell loop](https://github.com/google-gemini/gemini-cli/issues/25615)
- [Issue #25610 theme validation](https://github.com/google-gemini/gemini-cli/issues/25610)
- [Commit 14b2f35](https://github.com/google-gemini/gemini-cli/commit/14b2f35)

---

## Phase Feature Usage Report

| Phase | Agent / Skill | 산출물 | 상태 |
|-------|--------------|--------|------|
| Phase 1 (Research) | `gemini-researcher` | `docs/01-plan/research/gemini-cli-v0.38.2-research.md` | ✅ Done |
| Phase 2 (Impact) | `bkit-impact-analyzer` | `docs/03-analysis/gemini-cli-v0.38.2-impact.analysis.md` | ✅ Done |
| Phase 3 (Brainstorm) | `migration-strategist` + `/plan-plus` | `docs/01-plan/features/gemini-cli-v0.38.2-migration.plan.md` | ✅ Done |
| Phase 4 (Report) | `report-generator` | `docs/04-report/gemini-cli-v0.38.2-migration.report.md` | ✅ Done (본 문서) |
| Phase Do (Implementation) | (다음 단계) | 코드 변경 + tc107 + E2E 기록 | ⏳ Pending approval |

---

*Report 작성 완료: 2026-04-20 | Pre-Do Synthesis | 승인 후 Do phase 착수*
*Strategy: B' (Spot Validation + Defensive Test) — 8th Strategy B family application*
