# Gemini CLI v0.37.2 변경사항 조사 보고서

> 조사일: 2026-04-14
> 조사 범위: v0.37.1 (2026-04-09) -> v0.37.2 (2026-04-13)
> 누적 범위: v0.36.0 (bkit 현재 target) -> v0.37.2 (최신 stable)
> 조사자: gemini-researcher agent
> bkit 현재 버전: v2.0.4 (Gemini CLI v0.36.0 대상)
> 감지된 최신 stable: **v0.37.2**

---

## 1. 버전 개요 (Version Overview)

### 1.1 릴리스 타임라인 (2026-04-14 기준)

| 버전 | 릴리스일 | 유형 | 주요 테마 |
|------|---------|------|----------|
| **v0.36.0** | 2026-04-01 | Stable | 멀티레지스트리, 네이티브 샌드박싱, AgentSession, enableAgents=false (bkit 현재 target) |
| **v0.37.0** | 2026-04-08 | Stable | Plan Mode stable, enableAgents=true 복원, JIT context=false, Chapters |
| v0.38.0-preview.0 | 2026-04-08 | Preview | ContextCompressionService, BeforeModel e2e 전파 (stable 아님) |
| **v0.37.1** | 2026-04-09 | Stable (Patch) | ACP 오류 처리 개선, /about + /help 명령 (선행 조사 완료) |
| **v0.37.2** | 2026-04-13 | Stable (Patch) | **UI 표(table) 렌더링 수정 (cherry-pick)** |
| v0.39.0-nightly.* | 2026-04-09~11 | Nightly | v0.38 라인 skip, v0.39.0으로 진행 중 (stable 아님) |

### 1.2 v0.37.2 릴리스 규모

- **커밋 수**: 2개 (cherry-pick 1건 + release chore 1건)
- **변경 파일**: 21개 (소스 2개 + 스냅샷 테스트 20개)
- **변경 규모**: +249 / -234 라인
- **PR**: #25322 (cherry-pick of commit 9d741ab / 원본 PR #24565)
- **기여자**: @gemini-cli-robot, @devr0306, @SandyTao520

### 1.3 주요 테마

**v0.37.2는 핫픽스 패치 릴리스**. v0.37.1에 대한 UI 테이블 스타일링 버그 한 건을 cherry-pick한 최소 변경.

1. **Table Styling 렌더링 버그 수정 (ink 라이브러리 호환)**: `styledCharsToString` -> `styledLineToString` 함수 전환으로 ANSI 스타일(볼드/이탤릭/색상) 보존 개선

---

## 2. Breaking Changes (하위 호환성 깨짐)

### 2.1 v0.37.1 -> v0.37.2 구간

**Breaking Changes 없음.** 순수 UI 렌더링 버그 수정 패치.

### 2.2 v0.36.0 -> v0.37.2 누적 (참조)

v0.37.1 조사 보고서(`docs/01-plan/research/gemini-cli-v0.37.1-research.md` 섹션 2)에서 이미 다뤄진 항목들이 그대로 유효. v0.37.2에서 추가된 Breaking Change는 없음.

| # | 항목 | 영향도 | 요약 | 참조 |
|---|------|--------|------|------|
| 1 | `experimental.enableAgents` 기본값 `true` 복원 | INFO | v0.37.0에서 복원, v0.37.2 그대로 유지 | [PR #23672](https://github.com/google-gemini/gemini-cli/pull/23672) |
| 2 | `experimental.jitContext` 기본값 `false` | 🟡 Medium | v0.37.0 변경, v0.37.2 그대로 유지 | [PR #24364](https://github.com/google-gemini/gemini-cli/pull/24364) |
| 3 | `ui.compactToolOutput` 기본값 `true` | 🟢 Low | v0.37.0 변경, v0.37.2 그대로 유지 | v0.37.0 릴리스 노트 |
| 4 | Plan Mode stable 승격 | INFO | v0.37.0 승격, v0.37.2 그대로 유지 | [PR #24282](https://github.com/google-gemini/gemini-cli/pull/24282) |

---

## 3. 새로운 기능 (New Features)

### 3.1 v0.37.1 -> v0.37.2 구간

**신규 기능 없음.** 버그 수정 전용 릴리스.

### 3.2 v0.36.0 -> v0.37.2 누적 (참조)

v0.37.1 조사 보고서 섹션 3 (15개 항목) 그대로 유효. Plan Mode stable + Model Routing, Chapters, Dynamic Sandbox Expansion, `context.memoryBoundaryMarkers`, Project-Level Memory Scope 등. v0.37.2에서 신규 기능 추가 없음.

---

## 4. Deprecation 예고 (Deprecation Warnings)

### 4.1 v0.37.1 -> v0.37.2 구간

**Deprecation 신규 예고 없음.**

### 4.2 누적 참조

v0.37.1 조사 보고서 섹션 4 참조. v0.37.2는 deprecation 관련 변경 없음.

---

## 5. 설정/구성 변경 (Configuration Changes)

### 5.1 v0.37.1 -> v0.37.2 구간

**설정 스키마 변경 없음.** 변경 파일은 `packages/cli/src/ui/utils/TableRenderer.tsx` 및 스냅샷 테스트로 한정됨. `settings.json`, `.gemini-cli/` 경로, 환경변수, CLI 플래그 모두 변경 없음.

### 5.2 누적 참조

v0.37.1 조사 보고서 섹션 5 참조. v0.37.2에서 설정 관련 변경 없음.

---

## 6. 버그 수정 (Bug Fixes)

### 6.1 v0.37.2 단일 버그 수정

| # | 이슈 | 설명 | bkit 관련성 | 참조 |
|---|------|------|-------------|------|
| 1 | **Table styling broken** (issue #24563) | Markdown 표(table) 렌더링 시 내부 텍스트 스타일(볼드, 이탤릭, 색상, 링크)이 표시되지 않던 버그. `ink` 라이브러리 최신 API 변경에 따라 `styledCharsToString` -> `styledLineToString`로 전환하여 ANSI escape sequence 보존 수정 | **간접적 긍정**: bkit은 표 렌더링을 직접 제어하지 않지만, 에이전트가 markdown 표로 결과를 출력하거나 도구 출력에 표가 포함된 경우 시각적 품질 향상. 기능 영향 없음 | [PR #24565](https://github.com/google-gemini/gemini-cli/pull/24565), [cherry-pick PR #25322](https://github.com/google-gemini/gemini-cli/pull/25322), [commit 9d741ab](https://github.com/google-gemini/gemini-cli/commit/9d741ab) |

### 6.2 bkit 영향 분석

**bkit 코드/설정/훅에 영향 없음.**

- **변경된 코드 경로**: `packages/cli/src/ui/utils/TableRenderer.tsx` (line 17 import, line 199 function call)
- **스냅샷 테스트 업데이트**: 20개 파일 (columns width, markdown parsing, emoji, text wrapping 등)
- **bkit 훅/MCP 서버**: BeforeTool, AfterTool, BeforeModel 등 어떤 훅도 UI 렌더링 로직과 접점 없음
- **bkit 스킬/서브에이전트**: Gemini CLI UI 레이어에 의존하지 않음
- **사용자 체감 변화**: 에이전트가 markdown 표를 출력할 때 볼드/이탤릭/색상이 올바르게 표시됨 (기능 추가 아닌 시각적 수정)

---

## 7. 성능/최적화 변경

### 7.1 v0.37.1 -> v0.37.2 구간

**성능 관련 변경 없음.** 단일 함수 호출 교체이며 성능 특성 동일.

---

## 8. 의존성 변경

### 8.1 v0.37.1 -> v0.37.2 구간

| 패키지 | 이전 버전 | 이후 버전 | 주의사항 |
|--------|-----------|-----------|----------|
| `ink` | (동일) | (동일) | **직접 버전 변경 없음**. 단, `ink`의 `styledLineToString` 함수를 사용하도록 호출 변경. 이는 `ink`가 최근에 API를 진화시킨 결과를 반영한 것으로 추정됨 |

**package.json 의존성 스키마 변경 없음**. v0.37.1과 완전히 동일한 의존성 버전.

---

## 9. 원문 참조 링크 (Original Source References)

### 9.1 v0.37.2 직접 참조

- [x] **v0.37.2 릴리스 페이지**: https://github.com/google-gemini/gemini-cli/releases/tag/v0.37.2
- [x] **v0.37.1...v0.37.2 비교**: https://github.com/google-gemini/gemini-cli/compare/v0.37.1...v0.37.2
- [x] **Cherry-pick PR #25322**: https://github.com/google-gemini/gemini-cli/pull/25322
- [x] **원본 PR #24565 (fix(ui): fixed table styling)**: https://github.com/google-gemini/gemini-cli/pull/24565
- [x] **원본 이슈 #24563 (Table styling is broken)**: https://github.com/google-gemini/gemini-cli/issues/24563
- [x] **원본 커밋 9d741ab**: https://github.com/google-gemini/gemini-cli/commit/9d741ab
- [x] **릴리스 커밋 545e956**: https://github.com/google-gemini/gemini-cli/commit/545e956c3cb433d575cb3ea0cf827644a3c2dc15

### 9.2 연관 참조 (v0.36.0 -> v0.37.2 누적)

- [x] **v0.37.1 조사 보고서**: `docs/01-plan/research/gemini-cli-v0.37.1-research.md` (2026-04-13)
- [x] **v0.36.0 stable 조사 보고서**: `docs/01-plan/research/gemini-cli-v036-stable-research.md` (2026-04-06)
- [x] **v0.36 context performance 조사**: `docs/01-plan/research/gemini-cli-context-performance.md`

---

## 10. 조사 신뢰도 (Confidence Assessment)

| 항목 | 신뢰도 | 비고 |
|------|--------|------|
| v0.37.2 최신 stable 감지 | ⬛⬛⬛⬛⬛ | GitHub Releases 페이지 직접 확인. 2026-04-13 릴리스, 2026-04-14 조사 시점 기준 최신 stable 확인 |
| Breaking Changes | ⬛⬛⬛⬛⬛ | 2개 커밋 전체 확인, UI 렌더링 한정 변경 확인 |
| 새 기능 | ⬛⬛⬛⬛⬛ | cherry-pick 전용 릴리스로 신규 기능 없음 확정 |
| Deprecation | ⬛⬛⬛⬛⬛ | 해당 사항 없음 확정 |
| 설정 변경 | ⬛⬛⬛⬛⬛ | 변경 파일 21개 모두 UI/스냅샷으로 한정, 설정 스키마 불변 확정 |
| bkit 영향 분석 | ⬛⬛⬛⬛⬛ | UI 레이어 단일 함수 변경으로 bkit 접점 없음 확정 |

---

## 11. 요약 및 권장 조치 (Summary & Recommendations)

### 11.1 v0.37.1 -> v0.37.2 요약

**v0.37.2는 UI 표 렌더링 단일 버그 수정 핫픽스.** 2 커밋, 21 파일 (소스 2 + 스냅샷 20), Breaking Change/신규 기능/설정 변경/의존성 변경 **모두 없음**.

### 11.2 bkit 마이그레이션 위험도

- **v0.37.1 -> v0.37.2**: 위험도 **ZERO** (bkit 코드와 접점 없는 UI-only 패치)
- **v0.36.0 -> v0.37.2** (누적): 위험도 **LOW** (v0.37.1 조사 결과와 동일, v0.37.2가 추가로 위험을 늘리지 않음)

### 11.3 권장 조치

1. **v2.0.4 -> v2.1.x 마이그레이션 계획**: 기존 v0.37.1 마이그레이션 플랜(`docs/01-plan/features/gemini-cli-v0.37.1-migration.plan.md`)의 target 버전을 **v0.37.2**로 업데이트만 하면 충분. 계획 내 P1/P2/P3 항목 변경 불필요.
2. **회귀 테스트**: v0.37.2 UI 변경은 markdown 표 출력에만 영향. bkit 테스트 993/993은 표 렌더링에 의존하지 않으므로 기존 QA 통과 전제.
3. **문서 업데이트**: bkit README/CHANGELOG의 "Gemini CLI compatibility" 섹션에 `v0.37.2`로 표기.
4. **v0.38/v0.39 watch**: v0.38.0-preview.0 이후 stable이 없이 v0.39.0-nightly로 진행 중. 차기 stable 릴리스 시점에 ContextCompressionService, Background Memory Service 등 preview 기능의 stable 승격 여부 재조사 필요.

---

*조사 종료: 2026-04-14*
