# Gemini CLI v0.37.2 bkit 영향 분석 보고서

> 분석일: 2026-04-14
> 분석 범위: bkit v2.0.4 전체 코드베이스
> 분석 대상: v0.36.0 -> v0.37.2 누적 마이그레이션 (v0.37.0 + v0.37.1 + v0.37.2)
> 분석자: bkit-impact-analyzer agent
> 선행 분석: `docs/03-analysis/gemini-cli-v0.37.1-impact.analysis.md` (재검증 완료)

---

## Executive Summary

| 항목 | 수치 |
|------|------|
| 분석 대상 파일 | 21개 (lib/gemini/ 9, hooks/scripts/ 10, config 2) |
| 영향 받는 파일 | 8개 (v0.37.1과 동일, v0.37.2 신규 영향 0개) |
| Critical | 0건 |
| High | 2건 (v0.37.1 승계) |
| Medium | 5건 (v0.37.1 승계) |
| Low | 4건 (v0.37.1 승계) |
| v0.37.2 **단독** 신규 영향 | **0건** |
| 기능 개선 기회 | 6건 (v0.37.1과 동일) |

**v0.37.2 마이그레이션 위험도: ZERO**

v0.37.2는 v0.37.1 대비 2커밋(cherry-pick), 21파일(소스 2 + 스냅샷 20), 순수 UI 테이블 렌더링 버그 수정 핫픽스입니다. Breaking Change / 신규 기능 / 설정 스키마 변경 / 의존성 변경 / Hook 변경 / Policy 변경 **모두 0건**. bkit 코드와 접점 없음 (`styledCharsToString` -> `styledLineToString` 교체는 `packages/cli/src/ui/utils/TableRenderer.tsx` UI 레이어 단독 변경).

**v0.36.0 -> v0.37.2 누적 영향**: 전량 **v0.37.1 영향 분석과 동일**. v0.37.1 대비 v0.37.2가 추가로 부과하는 영향은 **없음**. 따라서 기존 `gemini-cli-v0.37.1-impact.analysis.md`의 권장 조치(bkit.config.json testedVersions 업데이트, version.js v0.37.0+ 기능 플래그 추가, ensureAgentsEnabled/isJITMode 최적화)를 그대로 적용하고, target 버전 문자열만 `0.37.2`로 갱신하면 충분합니다.

---

## 1. Breaking Changes 영향 매핑 (v0.36.0 -> v0.37.2 누적)

v0.37.2 단독 Breaking Change는 **0건**. 아래는 v0.36.0 -> v0.37.2 누적 기준입니다.

### 1.1 `experimental.enableAgents`: false -> true (v0.37.0, 복원)

- **영향도**: 🟠 High (안전망 승계, 기능 이상 없음)
- **영향 파일**:
  - `hooks/scripts/session-start.js` (Line 125-151): `ensureAgentsEnabled()` 함수
  - `bkit-system/.gemini/settings.json` 및 설치된 `.gemini/settings.json`: `"enableAgents": true` 명시
  - `lib/gemini/version.js` (Line ~177): `hasEnableAgentsDefaultFalse` 플래그
  - `tests/suites/tc111-v036-enableagents.js`, `tc109-v035-skill-agent-compat.js`
- **수정 방안**:
  - 즉시 수정 불필요. `=== undefined` 조건으로 사용자 명시 설정을 존중하며 중복 쓰기만 발생
  - 권장: `session-start.js`에서 `isVersionAtLeast('0.37.0')` 시 `ensureAgentsEnabled()` 스킵 (세션 시작 속도 미세 개선, v0.36.0 사용자에 대한 하위 호환성 유지)
- **v0.37.2 변경사항**: 없음 (v0.37.0 복원 동작 그대로 유지)
- **참조**: [PR #23672](https://github.com/google-gemini/gemini-cli/pull/23672)

### 1.2 `experimental.jitContext`: true -> false (v0.37.0, 즉시 로딩)

- **영향도**: 🟠 High (긍정적)
- **영향 파일**:
  - `lib/gemini/context-fork.js` (Line 167-184): JIT 파셜 감지 로직
  - `lib/gemini/import-resolver.js` (Line 26-58): `isJITMode()`, `waitForFile()` 재시도
  - `hooks/scripts/session-start.js` (Line 247-265): JIT dedup
  - `hooks/scripts/pre-compress.js` (Line 29-39): JIT 파셜 감지
  - `lib/gemini/version.js` (Line ~168): `hasJITContextLoading` 플래그
- **분석**: `hasJITContextLoading`은 `isVersionAtLeast('0.35.0')`로 판정되어 v0.37.2에서도 true 반환하지만, CLI 자체는 JIT off. 결과적으로 bkit의 JIT 방어 코드는 무해한 "그림자 실행" 상태. 기능 오류 없음, 최적화 기회만 존재
- **수정 방안**: `isJITMode()` 내부에서 `isVersionAtLeast('0.37.0')` 시 false 반환하도록 권장
- **v0.37.2 변경사항**: 없음
- **참조**: [PR #24364](https://github.com/google-gemini/gemini-cli/pull/24364)

### 1.3 `ui.compactToolOutput`: false -> true (v0.37.0)

- **영향도**: 🟢 Low
- **영향 파일**: 없음 (bkit 훅은 `tool_name`/`tool_input`만 참조, UI 출력 형식 비의존)
- **v0.37.2 변경사항**: 없음

### 1.4 Plan Mode: experimental -> stable (v0.37.0)

- **영향도**: INFO (활용 기회)
- **영향 파일**: 없음 (bkit은 plan mode 직접 사용 안 함)
- **v0.37.2 변경사항**: 없음

### 1.5 `/about` + `/help` 명령 추가 (v0.37.1)

- **영향도**: INFO
- **영향 파일**: 없음. bkit은 CLI 슬래시 명령을 훅에서 가로채지 않음
- **v0.37.2 변경사항**: 없음 (v0.37.1에서 도입된 이후 유지)

### 1.6 ACP 오류 처리 개선 (v0.37.1)

- **영향도**: 🟢 Low
- **영향 파일**: 없음. bkit은 ACP 경로를 직접 다루지 않음
- **v0.37.2 변경사항**: 없음

### 1.7 **v0.37.2 단독: TableRenderer 함수 교체 (UI-only)**

- **영향도**: 🟢 Low (간접 긍정)
- **영향 파일**: **bkit 측 영향 파일 0개**
- **변경 내용**: `packages/cli/src/ui/utils/TableRenderer.tsx`에서 `styledCharsToString` -> `styledLineToString` 호출 교체. ANSI escape sequence(볼드/이탤릭/색상/링크) 보존이 개선됨
- **분석**:
  - Grep 결과: bkit 코드베이스에 `styledCharsToString`, `styledLineToString`, `TableRenderer` 참조 **0건**
  - bkit 훅/MCP 서버/스킬/에이전트 중 어느 것도 Gemini CLI UI 렌더링 레이어에 의존하지 않음
  - 사용자 체감: 에이전트가 markdown 표를 출력할 때 내부 스타일이 올바르게 표시됨 (시각적 품질 향상만, 기능 변화 없음)
- **수정 방안**: 없음
- **참조**: [PR #24565](https://github.com/google-gemini/gemini-cli/pull/24565), [cherry-pick PR #25322](https://github.com/google-gemini/gemini-cli/pull/25322), [commit 9d741ab](https://github.com/google-gemini/gemini-cli/commit/9d741ab)

---

## 2. 스킬 영향 분석

| 스킬 범주 | 영향 항목 | 영향도 | 수정 내용 | 난이도 |
|-----------|-----------|--------|-----------|--------|
| 전체 스킬 (skills/ 디렉토리) | Hook/Policy/Frontmatter 스키마 변경 없음 | 없음 | 없음 | - |
| pdca | Plan Mode stable 활용 기회 (v0.37.0 승계) | 🟢 Low (기회) | Plan Mode 연동 가이드 추가 가능 | 소 |
| bkit-rules | 기본값 변경 문서화 (v0.37.0 승계) | 🟢 Low | 새 기본값 반영 가이드 업데이트 | 소 |
| 전체 스킬 | 마크다운 표 렌더링 품질 향상 (v0.37.2) | 🟢 Low (간접 긍정) | 없음 (자동 수혜) | - |

**결론**: 스킬 SKILL.md frontmatter의 `allowed-tools`, `hooks`, `imports` 스키마는 v0.36.0 대비 완전 호환. v0.37.2 단독 영향은 마크다운 표를 사용하는 스킬 본문에서 볼드/색상 표시가 개선되는 시각적 혜택뿐 (코드 변경 불필요).

---

## 3. 에이전트 영향 분석

| 에이전트 범주 | 영향 항목 | 영향도 | 수정 내용 | 난이도 |
|---------------|-----------|--------|-----------|--------|
| 전체 에이전트 (agents/) | frontmatter (tools/model/permissionMode) 스키마 변경 없음 | 없음 | 없음 | - |
| 전체 에이전트 | enableAgents=true 복원 (v0.37.0) | 없음 (긍정적) | 없음 (안전망 코드가 이미 활성화 보장) | - |
| gap-detector | Plan Mode read-only 호환 | 없음 | 이미 policy.js에서 Plan Mode 정책 구현 | - |
| pdca-iterator, cto-lead | Plan Mode + modelRouting 기회 | 🟢 Low (기회) | Pro(설계)/Flash(구현) 자동 전환 활용 | 중 |
| 전체 에이전트 | 마크다운 표 출력 품질 향상 (v0.37.2) | 🟢 Low (간접 긍정) | 없음 (자동 수혜) | - |

**결론**: v0.37.2는 에이전트 frontmatter, tools 목록, permissionMode 체계에 어떤 변경도 주지 않음.

---

## 4. 스크립트/라이브러리 영향 분석

### 4.1 Hook 스크립트

| 스크립트 | 영향 항목 | 영향도 | v0.37.2 신규 영향 | 수정 내용 |
|----------|-----------|--------|-------------------|-----------|
| `session-start.js` | `ensureAgentsEnabled()` 중복 실행 (v0.37.0 승계) | 🟡 Medium | 없음 | v0.37.0+ 감지 시 스킵 (권장) |
| `session-start.js` | JIT dedup 로직 (v0.37.0 승계) | 🟡 Medium | 없음 | `isJITMode()` 반환값 조정 |
| `before-model.js` | Plan Mode modelRouting 기회 (v0.37.0 승계) | 🟢 Low (기회) | 없음 | MODEL_ROUTING 힌트 연동 |
| `before-tool.js` | 변경 없음 | 없음 | 없음 | - |
| `before-tool-selection.js` | Plan Mode 도구 보호 유지 | 없음 | 없음 | 이미 보호 중 |
| `before-agent.js` | 변경 없음 | 없음 | 없음 | - |
| `after-tool.js` | 변경 없음 | 없음 | 없음 | - |
| `after-agent.js` | 변경 없음 | 없음 | 없음 | - |
| `after-model.js` | 변경 없음 | 없음 | 없음 | - |
| `pre-compress.js` | JIT 파셜 감지 불필요 (v0.37.0 승계) | 🟢 Low | 없음 | v0.37.0+ 시 스킵 가능 (선택) |
| `session-end.js` | 변경 없음 | 없음 | 없음 | - |

### 4.2 라이브러리 (lib/gemini/)

| 모듈 | 파일 | 영향 항목 | 영향도 | v0.37.2 신규 영향 | 수정 내용 |
|------|------|-----------|--------|-------------------|-----------|
| version | `version.js` | v0.37.0+ 기능 플래그 추가 필요 | 🟡 Medium | 없음 | 신규 플래그 8개 (+선택: `hasTableRendererFix` v0.37.2 마커) |
| version | `version.js` | `hasEnableAgentsDefaultFalse` 의미 부정확 | 🟢 Low | 없음 | 주석/플래그명 보정 (선택) |
| context-fork | `context-fork.js` | JIT 파셜 감지 | 🟢 Low | 없음 | 기능 오류 없음, 최적화 기회 |
| import-resolver | `import-resolver.js` | `isJITMode()` 과잉 판정 | 🟡 Medium | 없음 | v0.37.0+ 시 false 반환 권장 |
| model-resolver | `model-resolver.js` | Plan Mode modelRouting 기회 | 🟢 Low (기회) | 없음 | 연동 |
| hooks | `hooks.js` | 11개 Hook 이벤트 완전 유지 | 없음 | 없음 | - |
| policy | `policy.js` | Policy 스키마 완전 유지 | 없음 | 없음 | - |
| tools | `tools.js` | 도구 목록 변경 없음 | 없음 | 없음 | - |
| tracker | `tracker.js` | 변경 없음 | 없음 | 없음 | - |
| platform | `platform.js` | 변경 없음 | 없음 | 없음 | - |

### 4.3 설정 파일

| 설정 파일 | 영향 항목 | 영향도 | 수정 내용 |
|-----------|-----------|--------|-----------|
| `bkit.config.json` (Line 120) | `testedVersions`가 `"0.37.0"`에서 멈춤 -> **v0.37.1, v0.37.2 누락** | 🟡 Medium | `"0.37.1"`, `"0.37.2"` 추가 (호환성 선언) |
| `bkit.config.json` (Line 119) | `minGeminiCliVersion` | 없음 | `"0.34.0"` 유지 |
| `gemini-extension.json` | 변경 불필요 | 없음 | - |
| `.gemini/settings.json` | `enableAgents: true`가 CLI 기본값과 중복 | 🟢 Low | 안전망으로 유지 |
| `hooks/hooks.json` | 11개 이벤트 완전 유지 | 없음 | - |

**testedVersions 권장 업데이트**:
```json
"testedVersions": ["0.29.0", "0.30.0", "0.31.0", "0.32.0", "0.33.0", "0.34.0", "0.35.0", "0.35.3", "0.36.0", "0.37.0", "0.37.1", "0.37.2"]
```

### 4.4 템플릿 (templates/)

| 대상 | 영향 항목 | 영향도 | 수정 내용 |
|------|-----------|--------|-----------|
| PDCA 문서 템플릿 | 변경 없음 | 없음 | - |
| 출력 스타일 템플릿 | 마크다운 표 렌더링 품질 향상 (v0.37.2) | 🟢 Low (간접 긍정) | 없음 (자동 수혜) |

---

## 5. 철학 정합성 검증 결과 (4대 원칙)

| 원칙 | 상태 | v0.37.2 검증 근거 |
|------|------|-------------------|
| **Automation First** | 유지 | v0.37.2는 UI 핫픽스로 자동화 파이프라인에 영향 없음. `ensureAgentsEnabled()` 안전망, JIT->Eager 전환(v0.37.0), Plan Mode stable(v0.37.0) 모두 자동화 기조 유지 또는 강화 |
| **No Guessing** | 유지 | v0.37.2 변경은 렌더링 시각 효과만 수정. `=== undefined` 기반 명시적 사용자 설정 존중 패턴 변경 없음. BeforeTool `ask` 결정 메커니즘 유지 |
| **Docs = Code** | 유지 | PDCA 문서 경로 불변. **마크다운 표 렌더링 품질 향상은 docs/ 내 PDCA 보고서의 표 가독성 향상으로 Docs=Code 철학에 미세 긍정적 기여** |
| **AI as Partner** | 유지 | 에이전트 활성화 기본값 유지, UI 개선으로 AI 출력 가독성 향상 -> 협업 품질 향상 |
| **Context Engineering** (보조) | 유지 | 6-Layer 아키텍처(Plugin Policy / Environment / User / Session / Agent / Tool) 영향 없음. v0.37.2는 렌더링 레이어만 변경 |
| **PDCA Methodology** (보조) | 유지 | 상태 머신(20 전이, 9 가드) 영향 없음. PDCA Report 단계의 마크다운 표(메트릭 테이블 등) 가독성 향상 |

**종합**: v0.37.2는 bkit 4대 철학 및 Context Engineering / PDCA 방법론에 **긍정적이거나 무영향**. 위반 요소 없음.

---

## 6. 기능 개선 기회 (신규 기능 활용 방안)

### 6.1 v0.37.2 단독 신규 기회

| # | 새 기능 | bkit 활용 방안 | 예상 효과 | 우선순위 | 난이도 |
|---|---------|----------------|-----------|----------|--------|
| 1 | TableRenderer 스타일 보존 개선 | PDCA Report(`docs/04-report/`) 템플릿에 메트릭 표(테스트 통과율, 커버리지, 성능 지표 등)를 적극 활용. 기존에는 ANSI 스타일 유실로 중요 지표 강조가 불가했으나, v0.37.2에서 볼드/색상 표시 정상화됨 | 에이전트 출력 가독성 향상, 주요 메트릭 시각적 강조 가능 | P3 | 소 |

### 6.2 v0.37.0 + v0.37.1 승계 기회 (재검증 완료)

| # | 새 기능 | bkit 활용 방안 | 예상 효과 | 우선순위 | 난이도 |
|---|---------|----------------|-----------|----------|--------|
| 2 | Plan Mode stable + modelRouting | `before-model.js` MODEL_ROUTING 힌트를 CLI 네이티브 `plan.modelRouting`과 통합. PDCA Plan/Design 단계에서 Pro 모델, Build 단계에서 Flash 모델 자동 전환 | 모델 비용 30-50% 절감, PDCA Plan 단계에서 코드 작성 방지 강화 | P1 | 중 |
| 3 | `context.memoryBoundaryMarkers` | monorepo 루트에 `.bkit-boundary` 마커 자동 생성하여 GEMINI.md 탐색이 프로젝트 범위를 벗어나지 않도록 설정 | monorepo 환경 컨텍스트 오염 방지 | P2 | 소 |
| 4 | Project-level memory scope | `bkit.config.json`의 `agentMemory.projectScope`를 CLI 네이티브 프로젝트 메모리와 연계 | 다중 프로젝트 메모리 격리 | P2 | 소 |
| 5 | Chapters (도구 기반 토픽 그룹핑) | PDCA 단계 전이를 Chapters 경계로 활용. `AfterAgent` 훅에서 단계 전이 시 chapter 정보를 systemMessage에 포함 | 장시간 세션 가독성 향상 | P3 | 소 |
| 6 | Secret Visibility Lockdown | `bkit-rules` 스킬에 `.env` 보호 정책 + `security.environmentVariableRedaction.enabled` 권장사항 문서화 | 민감 정보 누출 방지 | P3 | 소 |

---

## 7. 구현 우선순위 매트릭스

| 우선순위 | 항목 | 이유 | 예상 공수 |
|----------|------|------|-----------|
| **P0 (즉시)** | `bkit.config.json` testedVersions에 `"0.37.1"`, `"0.37.2"` 추가 | 호환성 선언, 테스트 검증 범위 명시 | 5분 |
| **P0 (즉시)** | `README.md` / `CHANGELOG.md`의 "Gemini CLI compatibility" 섹션을 `v0.37.2`로 업데이트 | 사용자 공지 | 10분 |
| **P1 (권장)** | `version.js`에 v0.37.0+ 기능 플래그 8개 추가 | 새 기능 게이팅 기반. 다른 P1 항목의 전제 조건 | 30분 |
| **P1 (권장)** | `session-start.js` `ensureAgentsEnabled()` v0.37.0+ 조건부 스킵 | 불필요한 settings.json 쓰기 제거 | 15분 |
| **P1 (권장)** | `import-resolver.js` `isJITMode()` v0.37.0+ false 반환 | JIT 방어 코드 불필요 실행 제거 | 15분 |
| **P2 (기회)** | Plan Mode stable + modelRouting 활용 설계 | PDCA 비용 최적화 | 2-3시간 |
| **P2 (기회)** | memoryBoundaryMarkers 활용 가이드 | monorepo 지원 강화 | 1시간 |
| **P2 (기회)** | Project-level memory scope 연계 | 다중 프로젝트 메모리 격리 | 1시간 |
| **P3 (선택)** | Chapters 연동, Secret Lockdown 문서화, PDCA Report 표 강화 | 부가가치 | 각 30분-1시간 |
| **P3 (모니터링)** | v0.38 stable 릴리스 감시 (ContextCompressionService, Background Memory Service) | 충돌 가능성 선제 대비 | 지속 |

---

## 8. v0.37.1 분석과의 차분(Delta)

| 항목 | v0.37.1 분석 | v0.37.2 분석 | 차분 |
|------|--------------|--------------|------|
| 총 영향 파일 | 8개 | 8개 | 0 |
| Critical | 0 | 0 | 0 |
| High | 2 | 2 | 0 |
| Medium | 5 | 5 | 0 |
| Low | 4 | 4 | 0 |
| Breaking Change | 0 | 0 | 0 |
| 신규 기능 기회 | 6 | **7** | **+1** (TableRenderer PDCA Report 활용) |
| testedVersions 대상 | `0.37.1` | `0.37.1` + `0.37.2` | +1 |

**순 차분**: v0.37.1 대비 v0.37.2에서 bkit 코드 수정 요구 증가 **없음**. 추가된 항목은 PDCA Report 템플릿 개선 기회 1건(P3 선택)과 설정 파일 testedVersions 엔트리 1건뿐.

---

## 9. 결론

**v0.36.0 -> v0.37.2 마이그레이션은 저위험(Low Risk)**이며, v0.37.1 -> v0.37.2 단독 마이그레이션은 **무위험(Zero Risk)**입니다.

핵심 판단:
1. **v0.37.2 단독 Breaking Change 0건**: UI 테이블 렌더링 핫픽스만 포함
2. **v0.37.2 bkit 코드 영향 파일 0개**: `styledCharsToString`/`styledLineToString`/`TableRenderer` 참조 grep 결과 0건
3. **v0.36.0 -> v0.37.2 누적 영향**: v0.37.1 분석과 완전 동일
4. **설정 업데이트 필요**: `bkit.config.json` testedVersions에 `"0.37.1"`, `"0.37.2"` 추가 필요 (현재 `"0.37.0"`에서 멈춤)
5. **신규 기회 1건**: PDCA Report 템플릿의 마크다운 표 강조(볼드/색상) 활용 가능 (P3 선택)
6. **v0.38 주의**: ContextCompressionService, Background Memory Service, Skill injection 등 preview 기능은 bkit과 충돌 가능성이 있어 stable 릴리스 시 재분석 필요

**권장 마이그레이션 순서** (v0.37.1 분석과 동일, target만 v0.37.2로 갱신):
1. `bkit.config.json` testedVersions에 `0.37.1`, `0.37.2` 추가
2. `version.js` v0.37.0+ 기능 플래그 추가
3. `session-start.js`, `import-resolver.js` 최적화
4. 통합 테스트 실행 (기존 993/993 QA 통과 전제, 표 렌더링 무관)
5. Plan Mode / memoryBoundaryMarkers 활용 설계 (P2)
6. PDCA Report 템플릿 표 스타일 강화 (P3 선택)

---

*분석 종료: 2026-04-14*
