# Gemini CLI v0.38.2 마이그레이션 계획서 -- bkit v2.0.4 (Delta Hotfix + Defensive Test)

> **Feature**: gemini-cli-v0382-migration
> **Version**: bkit v2.0.4
> **Created**: 2026-04-20
> **Status**: Draft
> **Strategy**: **B' (Spot Validation + Defensive Test)** -- v0.38.1 플랜에 target swap delta + 회귀 감지 테스트 신설
> **Migration Scope**: v0.38.1 → v0.38.2 (Patch, Edit/Write 확인 UI 파일 경로 복원 핫픽스)
> **Delta Scope**: v0.38.1 → v0.38.2 (cherry-pick PR #24974, 7 functional files + 9 release chore files)
> **Research**: [gemini-cli-v0.38.2-research.md](../research/gemini-cli-v0.38.2-research.md)
> **Impact Analysis**: [gemini-cli-v0.38.2-impact.analysis.md](../../03-analysis/gemini-cli-v0.38.2-impact.analysis.md)
> **Parent Plan (active)**: [gemini-cli-v0.38.1-migration.plan.md](gemini-cli-v0.38.1-migration.plan.md) -- v0.38.2는 target swap delta + Critical 회귀 방어 테스트 추가

---

## 메타데이터

| 항목 | 값 |
|------|-----|
| Feature ID | `gemini-cli-v0.38.2-migration` |
| 대상 버전 | **v0.38.1 → v0.38.2** |
| 릴리스 일자 | 2026-04-17 18:38 UTC |
| 작성일 | 2026-04-20 |
| 전체 위험도 | **MEDIUM** (계약 LOW + Issue #25655 간접 회귀 가능성) |
| Breaking Changes (증분) | 0건 |
| Critical Impact | 1건 (업스트림 Issue #25655, bkit 간접 영향) |
| 새 기능 (증분) | 1건 (Edit/Write 확인 UI 파일 경로 복원, PR #24974) |
| 예상 작업 시간 | **0.5h (P0 필수)** + 2h (P1 방어 테스트) |
| Wave 구조 | 3 Waves (Version swap → Spot validation → Defensive test) |
| Affected Files | 1개 직접 (`bkit.config.json`) + 1개 관찰 (`hooks/scripts/session-start.js`) |
| YAGNI Savings | **~80%** (naive C 전략 10h+ → B' 2.5h) |

---

## Executive Summary

**TL;DR**: v0.38.2는 단일 UI 회귀 수정 cherry-pick이지만, 릴리스 **후** 보고된 업스트림 [Issue #25655](https://github.com/google-gemini/gemini-cli/issues/25655) "SessionStart 훅 `systemMessage` 이중 렌더링"이 bkit의 `hooks/scripts/session-start.js`(Line 89, 114)에 **정면 적중**한다. 업스트림 수정 PR이 없는 상태이므로, bkit는 (a) v0.38.1 플랜의 target version을 `v0.38.2`로 in-place swap 하고, (b) **회귀 감지용 방어 테스트 `tc107` 신설**을 병행한다. 직접 코드 수정은 testedVersions 문자열 추가 1건뿐이며, bkit 측 근본 수정은 **의도적으로 수행하지 않는다** (업스트림 버그이므로 v0.38.3/v0.39.x 수정 대기가 올바른 조치).

---

## 1. Problem Statement (문제 정의)

### 1.1 왜 v0.38.2 마이그레이션을 해야 하는가

1. **npm `latest` tag 교체**: 2026-04-17 기준 `@google/gemini-cli@latest`가 v0.38.2로 교체됨. `testedVersions`에 포함되지 않으면 사용자가 최신 stable을 쓸 때 bkit가 "미검증 환경"으로 동작함
2. **UI 회귀 수혜**: v0.38.0~v0.38.1 기간 Edit/WriteFile 확인 프롬프트에서 사라졌던 파일 경로가 v0.38.2에서 복원됨 → bkit 스킬·에이전트 30개+가 자동으로 UX 혜택
3. **연속 패치 추적**: v0.38.1에 이어 2일 간격 연속 핫픽스. 호환성 선언을 늦추면 v0.39.x 도래 시 누적 갭 발생

### 1.2 왜 **지금** (2026-04-20) 반드시 처리해야 하는가

**핵심 위험**: [Issue #25655](https://github.com/google-gemini/gemini-cli/issues/25655)가 v0.38.2에 포함되어 있고, bkit의 **SessionStart 훅 경로에 정면 적중**한다. 사용자가 bkit extension + `gemini@latest`로 신규 세션을 시작하면:

```
bkit Vibecoding Kit v2.0.4 activated (Gemini CLI) - Level: Dynamic
# bkit Session Start
## PDCA Core Rules (Always Apply)
...
bkit Vibecoding Kit v2.0.4 activated (Gemini CLI) - Level: Dynamic     ← DUPLICATE
# bkit Session Start                                                    ← DUPLICATE
## PDCA Core Rules (Always Apply)                                       ← DUPLICATE
```

→ Welcome/PDCA 지침/Phase-Aware Context가 **2회 중복 출력**. 첫인상 신뢰도 저하. `notifications: false` 플래그도 무시됨(이슈에 명시).

### 1.3 scope boundary

- ✅ **포함**: testedVersions 업데이트, v0.38.1 plan target swap, 회귀 감지 테스트 신설
- ❌ **제외(의도적)**: session-start.js 본문 수정(업스트림 버그라 bkit 수정은 잘못된 신호), `notifications:false` 삽입(무시됨), Phase-Aware Context를 BeforeAgent로 이관(YAGNI, 업스트림 수정 시 무의미)

---

## 2. Goals (목표)

| ID | 목표 | 수용 기준 |
|----|------|---------|
| G1 | v0.38.2 호환성 확보 | `bkit.config.json` `compatibility.testedVersions`에 `"0.38.1"`, `"0.38.2"` 포함, smoke test 993/993 green |
| G2 | Issue #25655 회귀 감지 역량 확보 | `tc107-v0382-session-start-duplication.js` 테스트 신설, 훅 stdout이 `systemMessage`를 **정확히 1회** 배출하는지 검증 |
| G3 | `testedVersions` 메타데이터 최신화 | `bkit.config.json`, `lib/gemini/version.js` 동기화 (존재 시) |
| G4 | 상위 플랜(v0.38.1) 일관성 유지 | v0.38.1 plan target을 v0.38.2로 in-place swap + delta 각주 추가 |

---

## 3. Non-Goals (하지 않을 것)

| ID | 항목 | 이유 |
|----|------|------|
| NG1 | `hooks/scripts/session-start.js` 본문 수정 (systemMessage 축소/이관) | 업스트림 버그가 근본 원인. bkit 측 수정은 업스트림 픽스 도래 시 **오히려 UX 회귀** 유발. 옵션 A(관찰)가 최적 |
| NG2 | `notifications: false` 플래그 명시 | Issue #25655에서 **무시됨**이 공식 확인. 작업 낭비 |
| NG3 | `tool.description` ANSI sanitization 선제 구현 | 업스트림 리뷰 지적 상태, bkit 훅은 description에 외부 입력 주입 없음. 실익 없는 방어 코드 회피 |
| NG4 | v0.38.1 지원 종료 | `minGeminiCliVersion: "0.34.0"` 유지. 사용자 자율 선택 보장 |
| NG5 | v0.39.0-preview.0 breaking 대응 (Legacy subagent wrapping tools 제거) | 별도 플랜 대상. 스코프 크리프 방지 |
| NG6 | v0.38.2 전용 신규 plan.md 별도 작성 | v0.38.1 plan을 in-place swap. 핫픽스 특성상 문서 분할 불필요 |

---

## 4. 브레인스토밍: 대안 비교 (Strategy Alternatives)

### 4.1 마이그레이션 접근법 (3개 대안)

#### 접근법 A: 최소 수정 (target swap only)

**범위**: v0.38.1 plan의 target version만 `v0.38.2`로 in-place swap, testedVersions 문자열 1개 추가.

| 작업 | 파일 | 공수 |
|------|------|------|
| `bkit.config.json` testedVersions에 `"0.38.2"` 추가 | `bkit.config.json` | 5분 |
| v0.38.1 plan target swap + 각주 | `docs/01-plan/features/gemini-cli-v0.38.1-migration.plan.md` | 5분 |
| smoke `npm test` | 전체 | 5분 |
| **합계** | **2 files** | **~0.3h** |

| 장점 | 단점 | 리스크 | 추천도 |
|------|------|--------|--------|
| 최소 비용 | Issue #25655 **회귀 감지 불가** → v0.38.3 지연 시 사용자가 먼저 발견 | **중간** (Issue #25655가 bkit 경로에 적중) | **Low** |

#### 접근법 B: 방어 테스트 포함 (RECOMMENDED)

**범위**: A + `tc107-v0382-session-start-duplication.js` 신설로 회귀 감지 자동화.

| 작업 | 파일 | 공수 |
|------|------|------|
| A 전체 | (위) | 0.3h |
| `tc107` 방어 테스트 신설 (훅 프로세스 stdout JSON 배출 횟수 확인) | `tests/suites/tc107-v0382-session-start-duplication.js` | 1.5h |
| v0.38.1 plan에 "v0.38.2 delta: Issue #25655 방어 테스트 추가" 각주 | 동일 plan | 5분 |
| 수동 E2E 재현 확인 (실제 `gemini` 실행, macOS/Linux 1회씩) | 수동 | 20분 |
| **합계** | **2 files 수정 + 1 file 신규** | **~2.5h** |

| 장점 | 단점 | 리스크 | 추천도 |
|------|------|--------|--------|
| 회귀 조기 경보, 업스트림 v0.38.3/v0.39.x 도래 시 자동 회귀 확인 | A 대비 +2h | 낮음 | **HIGH** ★★★★★ |

> **주의 (테스트 한계)**: `tc107`은 훅 자체의 JSON 출력 횟수만 검증한다. **CLI 상위 레이어의 이중 렌더링은 훅 단위 테스트로 재현 불가**. 수동 E2E로만 확인 가능. `tc107`은 "훅은 여전히 계약대로 동작한다"는 사실을 고정하는 회귀 방어의 "하부 절반"이다. 상부 절반(CLI 레이어)은 수동 E2E와 업스트림 이슈 트래킹으로 커버.

#### 접근법 C: 업스트림 기여 + 방어 테스트

**범위**: B + Issue #25655 재현 PR/코멘트를 업스트림에 제출.

| 작업 | 공수 |
|------|------|
| B 전체 | 2.5h |
| Issue #25655에 bkit 재현 스크립트/환경 comment | 30분 |
| 가능하면 minimal repro PR 시도 (upstream contribution) | 2-4h (upstream review 대기 불포함) |
| **합계** | **5-7h** |

| 장점 | 단점 | 리스크 | 추천도 |
|------|------|--------|--------|
| 커뮤니티 기여, 업스트림 수정 가속 가능성 | 업스트림 리뷰 대기 시간 불확실, bkit 내부 가치 낮음 | 중간 (scope creep) | ★★★★ (여력 있을 때만) |

### 4.2 Evaluation Matrix

| 기준 (가중치) | A: 최소 수정 (0.3h) | **B: 방어 테스트 (2.5h)** | C: 업스트림 기여 (5-7h) |
|---------------|---------------------|----------------------------|--------------------------|
| 위험도 (30%) | 5 (Issue #25655 방치) | 9 (방어 확보) | 9 |
| 작업량 (25%) | 10 | 7 | 3 |
| 가치 창출 (25%) | 4 | 8 | 9 |
| 장기 이점 (20%) | 4 | 8 | 9 |
| **가중 합계** | **6.00** | **8.05** | **6.90** |

### 4.3 Strategy Decision

**선택: 접근법 B (Spot Validation + Defensive Test)** -- 가중 합계 8.05

선택 근거:

1. **Critical 회귀 방어**: Issue #25655가 bkit 경로에 적중. 방어 테스트 없이 넘어가면 v0.38.3 지연 시 사용자 현장에서 문제 발견 → bkit 신뢰 훼손
2. **B vs A 비교**: +2h 투자로 업스트림 픽스 도래 시 **자동 회귀 확인** 가능 (green 전환 = 픽스 반영 증거)
3. **C 탈락**: 업스트림 기여는 가치 있으나 bkit 내부 품질 확보와 무관한 가외 작업. 여력 있을 때 별도 수행 (P3 이관)
4. **Strategy B 패턴 일관성**: `feedback_migration_pattern.md` "Strategy B 기본 채택" 원칙 준수. 핫픽스 규모에 맞게 축소한 B' 변종

### 4.4 SessionStart 중복 이슈 완화 전략 (3개 옵션)

| 옵션 | 내용 | 장점 | 단점 | 리스크 | 추천도 |
|------|------|------|------|--------|--------|
| **옵션 1 (채택): 업스트림 수정 대기 (passive) + 방어 테스트** | bkit 측 근본 수정 안 함. `tc107`으로 훅 계약만 고정. v0.38.3/v0.39.x 픽스 모니터링 | 업스트림 픽스 도래 시 자동 해결, bkit 코드 안정 | 중복 출력 UX 불편이 일시 지속 | Low (기능 정상, UX만 일시 저하) | ★★★★★ |
| 옵션 2: `systemMessage` 출력 조건부 가드 (defensive code) | session-start.js에 "이미 출력했는지" 플래그로 stdout 1회만 배출 | 중복 원인을 훅 자체 수준에서 차단 시도 | **효과 없음** — 이슈는 훅 stdout이 아닌 CLI 렌더러 중복. 훅은 이미 1회 출력 중. 불필요한 코드 추가 | Medium (잘못된 모델링, 향후 혼선) | ★★ |
| 옵션 3: 중복 감지 런타임 경고 추가 | 훅 실행 시 "v0.38.2 알려진 이슈" 안내 텍스트를 systemMessage 상단에 추가 | 사용자에게 투명성 제공 | systemMessage 자체도 중복 출력되므로 **경고도 중복**됨(역효과). v0.38.3 픽스 후 잔존하면 노이즈 | Medium | ★ |

**선택: 옵션 1** -- 근거: 이슈가 **CLI 상위 렌더러 레이어**이며, 훅 단위에서는 이미 JSON 1회만 배출됨(Impact §3.4 재확인 완료). 훅 측 "가드"는 잘못된 위치의 수정이고, 런타임 경고는 중복 증상을 **악화**시킨다. passive + 방어 테스트가 가장 정직한 조치.

### 4.5 하위 호환성 전략

| 질문 | 결정 |
|------|------|
| v0.38.1 지원 유지? | **유지**. `minGeminiCliVersion: "0.34.0"`, `testedVersions`에 v0.38.1과 v0.38.2 병행 기재 |
| v0.38.0 지원? | **유지** (계약 동등, 이미 testedVersions에 존재). Issue #25655가 v0.38.2 전용 이슈라면 v0.38.0/v0.38.1로 다운그레이드가 일시 회피책 |
| testedVersions 배열 관리 전략 | **누적 기재**. 각 패치를 문자열로 추가, Deprecation/drop은 Major 릴리스에서 일괄 처리 |
| v0.38.0 → v0.38.2 단번 업그레이드? | 안전. 계약 무변경 연속 2 패치 |

---

## 5. YAGNI Review (YAGNI 리뷰 결과)

### 5.1 채택/보류 판정

| # | 항목 | 공수 | 채택? | 근거 |
|---|------|------|-------|------|
| 1 | `bkit.config.json` testedVersions에 `"0.38.1"`, `"0.38.2"` 추가 | 5분 | **채택 P0** | 호환성 선언 필수 |
| 2 | `lib/gemini/version.js` 동기화 확인 (존재 시) | 5분 | **채택 P0** | 코드-설정 동기화 |
| 3 | 수동 E2E 재현 테스트 (macOS/Linux 1회씩, `bkit Session Start` 출현 횟수 확인) | 20분 | **채택 P0** | Impact §3.4가 지정한 재현 절차, 중복 실재 확인 근거 |
| 4 | v0.38.1 plan target swap + delta 각주 | 5분 | **채택 P0** | Docs = Code 원칙 |
| 5 | `tc107-v0382-session-start-duplication.js` 신설 (훅 단위 JSON 1회 배출 검증) | 1.5h | **채택 P1** | 업스트림 픽스 도래 추적, 회귀 감지 자동화 |
| 6 | smoke test `npm test` 993/993 green 확인 | 5분 | **채택 P0** | 계약 무변경 검증 |
| 7 | session-start.js 본문에 "이미 출력했는지" 가드 추가 | 30분 | **보류** | 잘못된 위치의 수정 (NG1). 훅은 이미 1회 배출 중 |
| 8 | `notifications: false` 플래그 삽입 | 1분 | **보류** | Issue #25655에서 무시됨 (NG2) |
| 9 | Phase-Aware Context를 BeforeAgent로 이관 | 2-3h | **보류** | 업스트림 픽스 도래 시 **불필요한 아키텍처 이동** (NG1 연장). v2.1.x context-optimization에서 필요 시 재검토 |
| 10 | `tool.description` ANSI sanitization 방어 코드 | 30분 | **보류** | bkit 훅에 외부 입력 주입 경로 없음(Impact §6 확인). YAGNI |
| 11 | Issue #25655 업스트림 재현 PR/코멘트 | 2-4h | **보류 → P3** | 내부 품질 확보와 무관. 여력 있을 때 |
| 12 | output-styles/ "파일 경로 복원" 안내문 | 10분 | **보류 → P3** | 사용자가 자연 체감. 문서 노이즈 방지 |
| 13 | v0.38.3/v0.39.0-preview.0 감시 | 모니터링 | **채택 P3** | 이후 마이그레이션 자동 트리거 |

### 5.2 YAGNI 체크리스트

- [x] "있으면 좋을 것 같은" 기능 제외: 훅 가드(잘못된 위치), Phase-Aware 이관(사전 이관 불필요), ANSI sanitization(주입 경로 없음), 업스트림 기여(내부 품질 무관)
- [x] 현재 사용자가 실제로 필요: testedVersions, 회귀 감지 자동화(업스트림 픽스 추적)
- [x] bkit 철학 부합: **No Guessing**(중복 원인을 훅에서 추측 수정하지 않음), **Docs = Code**(v0.38.1 plan 각주 동기화), **Automation First**(tc107로 감지 자동화)
- [x] 유지보수 비용 대비 가치: 2.5h 투자로 업스트림 수정 시 자동 확인 + 미래 테스트 기반 확보
- [x] 이전 마이그레이션 불필요 패턴 미반복: v0.38.1과 동일하게 target swap 방식 유지. 플랜 중복 작성 회피

### 5.3 YAGNI Savings

| Category | Items | Effort |
|----------|-------|--------|
| 채택 (Wave 1-3) | 6 items | 2.5h |
| 보류/이관 | 7 items | 10-12h |
| **Naive 추정 합계 (C 전략 + 방어 코드 풀셋)** | 13 items | ~12-15h |
| **YAGNI 절감률** | | **~80%** |

---

## 6. Recommended Strategy + Rationale (권장 전략 요약)

**Strategy B' (Spot Validation + Defensive Test)** -- 2.5h, 3 Waves, 1 file 수정 + 1 file 신규

### 6.1 핵심 근거

1. **Critical 회귀 방어 필수**: Issue #25655가 bkit 경로에 정면 적중. 방어 테스트 없이 태그 업데이트는 무책임
2. **올바른 위치의 수정**: 근본 버그는 CLI 상위 렌더러 → bkit 코드 수정은 wrong layer. 방어 테스트가 올바른 조치
3. **업스트림 픽스 자동 추적**: `tc107`은 picking up upstream fix 시점을 자동으로 알려주는 "카나리아"
4. **Strategy B 패턴 정합성**: `feedback_migration_pattern.md` 기준 Strategy B 기본 채택, 핫픽스 규모에 맞게 B'로 축소

---

## 7. 구현 단계 (Implementation Steps / Roadmap)

### Wave 1: Version Swap & Smoke (0.3h) -- P0

| # | 작업 | 파일 | 공수 | 우선순위 |
|---|------|------|------|----------|
| 1.1 | `bkit.config.json`의 `compatibility.testedVersions`에 `"0.38.1"`, `"0.38.2"` 문자열 추가 (둘 다 없으면) | `bkit.config.json` L120 | 5분 | P0 |
| 1.2 | `lib/gemini/version.js`의 `testedVersions`/feature flag 레지스트리 존재 여부 확인 후 동기화 | `lib/gemini/version.js` | 5분 | P0 |
| 1.3 | v0.38.2 설치 후 `npm test` 실행 | 전체 | 5분 | P0 |

**합격 기준**: 993/993 green 유지.

### Wave 2: Plan Target Swap & Delta Annotation (0.2h) -- P0

| # | 작업 | 파일 | 공수 | 우선순위 |
|---|------|------|------|----------|
| 2.1 | v0.38.1 plan의 target version을 `v0.38.2`로 in-place swap | `docs/01-plan/features/gemini-cli-v0.38.1-migration.plan.md` 상단 메타 | 5분 | P0 |
| 2.2 | v0.38.1 plan에 "v0.38.2 delta: PR #24974 UI 복원 cherry-pick + Issue #25655 방어 테스트 추가" 각주 추가 | 동일 plan Executive Summary 하단 | 5분 | P0 |
| 2.3 | v0.38.1 plan References에 v0.38.2 research/impact 링크 추가 | 동일 plan References 섹션 | 3분 | P0 |

### Wave 3: Defensive Regression Test (2.0h) -- P1

| # | 작업 | 파일 | 공수 | 우선순위 |
|---|------|------|------|----------|
| 3.1 | `tc107-v0382-session-start-duplication.js` 스켈레톤 작성 (기존 tc 패턴 참조) | `tests/suites/tc107-v0382-session-start-duplication.js` 신규 | 30분 | P1 |
| 3.2 | 테스트 로직: `hooks/scripts/session-start.js`를 subprocess로 실행 → stdout 수집 → JSON parse → `systemMessage` field가 정확히 1번 존재하는지 검증 | 동일 | 30분 | P1 |
| 3.3 | sentinel 문자열(`bkit Session Start`) 카운트 검증 추가 (훅 JSON 출력 내부에서 1회) | 동일 | 15분 | P1 |
| 3.4 | tc107 docstring에 **한계 명시**: "이 테스트는 훅 단위만 검증. CLI 상위 렌더러 중복은 E2E 수동 확인 필요 (Issue #25655)" | 동일 | 10분 | P1 |
| 3.5 | 수동 E2E: v0.38.2 설치 → bkit extension 활성화 → `gemini` 실행 → `bkit Session Start` 등장 횟수 확인. 결과를 v0.38.2 report에 기록 (Do phase에서) | 수동 | 20분 | P1 |
| 3.6 | `npm test`로 tc107 포함 994/994 green 확인 | 전체 | 5분 | P1 |

### Wave 4 (Deferred): 상위 플랜/모니터링 위임

| 항목 | 위임 대상 |
|------|----------|
| `hooksConfig.showOutput` / BeforeModel E2E / Plan Mode silent fallback 통합 검증 | v0.38.0 plan (Wave 2) |
| v2.1.x context-optimization 연계 | v2.1.0 plan |
| Issue #25655 upstream contribution | P3 (여력 있을 때) |
| v0.39.0-preview.0 breaking 대응 | 별도 마이그레이션 트리거 |

### 총 공수

| Wave | 공수 | 누적 | 우선순위 |
|------|------|------|----------|
| Wave 1: Version Swap & Smoke | 0.3h | 0.3h | P0 |
| Wave 2: Plan Swap & Annotation | 0.2h | 0.5h | P0 |
| Wave 3: Defensive Regression Test | 2.0h | 2.5h | P1 |
| **Buffer** | 0h | **2.5h** | |

---

## 8. 롤백 전략 (Rollback Plan)

### 8.1 체크포인트 생성 시점

1. **Wave 1 시작 전**: `git commit` 또는 branch 분기 `migration/v0.38.2` 생성
2. **Wave 3 시작 전**: Wave 2까지 완료분 커밋 (P0만으로 호환성 선언 완료 상태 보존)
3. **Wave 3 완료 후**: 최종 커밋 (tc107 포함)

### 8.2 롤백 절차 (실패 시)

| 실패 시점 | 복구 절차 |
|----------|----------|
| Wave 1.3 smoke 실패 (993/993 중 회귀 발견) | `git revert <Wave 1 commit>` → `npm install @google/gemini-cli@0.38.1` 재pin → 원인 분석 후 v0.38.3 대기 |
| Wave 3 tc107 작성 중 환경 이슈 | Wave 1-2만 유지 (P0 완료 상태), tc107은 차회 이관. bkit 신뢰성 유지 |
| E2E 재현에서 사용자 심각 UX 저하 확인 | bkit README 또는 output-style에 **임시 경고**: "v0.38.2 사용 시 SessionStart 중복 출력 있음, v0.38.1 권장". 근본 수정 대신 안내로 대응 |
| v0.38.2 런타임 타 이슈 발견 (#25615, #25610 등) | testedVersions에서 v0.38.2 문자열만 제거, v0.38.1 pin 유지 |

### 8.3 하위 호환 보장

- `minGeminiCliVersion: "0.34.0"` 유지 → 사용자가 v0.38.0/v0.38.1로 자율 다운그레이드 가능
- testedVersions에 v0.38.1 병행 기재 → "Issue #25655 회피 원하는 사용자는 v0.38.1 고정" 안내 가능
- bkit 코드 계약 무변경 → v0.38.0/v0.38.1/v0.38.2 중 어느 버전이든 동일 동작

---

## 9. 검증 체크리스트 (Acceptance Criteria)

### 9.1 필수 항목 (P0)

- [ ] `bkit.config.json` `compatibility.testedVersions` 배열에 `"0.38.1"`, `"0.38.2"` 두 문자열 모두 포함
- [ ] `lib/gemini/version.js` (존재 시) testedVersions 또는 feature flag 동기화
- [ ] v0.38.2 설치 상태에서 `npm test` 결과 **993/993 PASS** (기존 grade 유지)
- [ ] 수동 E2E: v0.38.2 실환경에서 `gemini` 실행 시 "bkit Session Start" 등장 **횟수 관찰 결과를 Do report에 기록** (1회 또는 2회 중 어느 쪽이든 관찰 사실을 기록)
- [ ] Edit/Write 도구 확인 UI에서 파일 경로 노출 확인 (`write_file`/`replace` 샘플 호출 1회 이상)
- [ ] v0.38.1 plan 상단 target version이 `v0.38.2`로 swap 완료
- [ ] v0.38.1 plan에 v0.38.2 delta 각주 및 research/impact 링크 존재

### 9.2 선택 항목 (P1)

- [ ] `tests/suites/tc107-v0382-session-start-duplication.js` 신설
- [ ] tc107이 훅 프로세스 stdout JSON의 `systemMessage` 필드를 정확히 1회만 검출
- [ ] tc107 docstring에 "CLI 상위 렌더러 중복은 E2E 수동 확인 필요" 한계 명시
- [ ] tc107 포함 `npm test` 결과 **994/994 PASS**

### 9.3 문서 업데이트 범위

| 문서 | 수정 | 내용 |
|------|------|------|
| `docs/01-plan/features/gemini-cli-v0.38.1-migration.plan.md` | 상단 target swap + 각주 + References 추가 | "v0.38.2 delta: UI 복원 + #25655 방어 테스트" |
| `docs/01-plan/features/gemini-cli-v0.38.2-migration.plan.md` | **신규** (본 문서) | Delta plan |
| `docs/04-report/gemini-cli-v0.38.2-migration.report.md` | Do phase 후 생성 | 실행 결과 + E2E 재현 관찰 기록 |
| `docs/01-plan/research/gemini-cli-v0.38.2-research.md` | 수정 없음 | 완료 |
| `docs/03-analysis/gemini-cli-v0.38.2-impact.analysis.md` | 수정 없음 | 완료 |
| `hooks/scripts/session-start.js` | **수정 없음 (NG1)** | 업스트림 버그, bkit 측 수정 금지 |

---

## 10. 의존성 및 리스크 (Risk Management)

### 10.1 식별된 위험

| # | 위험 | 확률 | 영향 | 완화책 |
|---|------|------|------|--------|
| R1 | Issue #25655로 인해 실제 사용자 세션에서 SessionStart 중복 출력 관찰 | **High** (Windows 11 재현 확인됨, macOS/Linux 미검증) | Medium (UX 저하, 기능 정상) | 옵션 1 passive + tc107 방어 테스트, output-style 안내 선택적 추가 |
| R2 | 업스트림 v0.38.3/v0.39.x에서 #25655 픽스 지연 | Medium | Medium | tc107이 픽스 도래 자동 감지, 사용자에게는 v0.38.1 권장 경로 유지 |
| R3 | `tc107` 작성 중 기존 test harness와 호환성 문제 | Low | Low | Wave 3 실패 시 P0만 유지하고 tc107은 차회 이관 |
| R4 | v0.38.2 설치 후 993/993 중 예상치 못한 회귀 | Very Low (계약 무변경) | High | `git revert` + v0.38.1 재pin, 원인 분석 |
| R5 | 릴리스 직후 타 이슈 (#25615 shell loop, #25610 theme) bkit 경로 영향 | Low (bkit이 해당 경로 미사용) | Low | Impact §7 근거로 영향 없음 확인, 모니터링 유지 |
| R6 | `tool.description` ANSI injection 보안 이슈가 미래 bkit 훅 확장 시 문제화 | Very Low | Low | 현재 bkit 훅에 주입 경로 없음, 향후 skill 추가 시 선형 감시 |
| R7 | v0.38.1 plan target swap이 git conflict 유발 (병렬 작업 시) | Very Low | Very Low | 단일 작업자 기준 직선 swap, conflict 시 rebase |

### 10.2 롤백 의사결정 기준

| 상황 | 대응 |
|------|------|
| Wave 1 smoke 실패 | 즉시 revert, v0.38.1 재pin |
| Wave 3 tc107 실패 (설계/환경 이슈) | Wave 3 포기, P0만 유지 |
| E2E에서 SessionStart 중복 심각 UX 저하 확인 | output-style 안내 추가, v0.38.1 권장 명시 |
| 업스트림 v0.38.3 릴리스되며 #25655 픽스 | 즉시 v0.38.3 마이그레이션 트리거, testedVersions 추가 |

---

## 11. 참고 문서 (References)

### 11.1 bkit 내부

- Research: `docs/01-plan/research/gemini-cli-v0.38.2-research.md`
- Impact Analysis: `docs/03-analysis/gemini-cli-v0.38.2-impact.analysis.md`
- Parent Plan: `docs/01-plan/features/gemini-cli-v0.38.1-migration.plan.md` (target swap 대상)
- Predecessor: `docs/01-plan/features/gemini-cli-v0.38.0-migration.plan.md`
- Strategy B Pattern: `.claude/agent-memory/migration-strategist/feedback_migration_pattern.md`
- Prior Migration Memory: `project_v0381_migration.md`

### 11.2 업스트림

- v0.38.2 Release: https://github.com/google-gemini/gemini-cli/releases/tag/v0.38.2
- v0.38.1 → v0.38.2 Compare: https://github.com/google-gemini/gemini-cli/compare/v0.38.1...v0.38.2
- cherry-pick PR #25585: https://github.com/google-gemini/gemini-cli/pull/25585
- 원본 PR #24974 (`fix(cli): restore file path display...`): https://github.com/google-gemini/gemini-cli/pull/24974
- 회귀 원인 PR #24376: https://github.com/google-gemini/gemini-cli/pull/24376
- **Issue #25655 (CRITICAL)**: https://github.com/google-gemini/gemini-cli/issues/25655
- Issue #25615 (Windows shell loop): https://github.com/google-gemini/gemini-cli/issues/25615
- Issue #25610 (theme validation): https://github.com/google-gemini/gemini-cli/issues/25610

---

*Plan 작성 완료: 2026-04-20 | 승인 대기*
*Strategy: B' (Spot Validation + Defensive Test) -- 8th Strategy B family application, 핫픽스 + Critical 회귀 방어 변종*
