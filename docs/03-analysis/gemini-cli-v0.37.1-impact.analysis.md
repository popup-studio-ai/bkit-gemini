# Gemini CLI v0.37.1 bkit 영향 분석 보고서

> 분석일: 2026-04-13
> 분석 범위: bkit v2.0.4 전체 코드베이스 (5,016 lines across 21 core files)
> 분석 대상: v0.36.0 -> v0.37.1 마이그레이션
> 분석자: bkit-impact-analyzer agent

---

## Executive Summary

| 항목 | 수치 |
|------|------|
| 분석 대상 파일 | 21개 (lib/gemini/ 9, hooks/scripts/ 10, config 2) |
| 영향 받는 파일 | 8개 |
| Critical | 0건 |
| High | 2건 |
| Medium | 5건 |
| Low | 4건 |
| 기능 개선 기회 | 6건 |

**결론**: v0.36.0 -> v0.37.1 마이그레이션은 **저위험(Low Risk)**입니다. Breaking Change 0건, 코드 변경 필수 항목 0건. 기본값 변경 3건은 모두 bkit에 긍정적이거나 무영향입니다. Plan Mode stable 승격과 memoryBoundaryMarkers는 bkit 고도화의 주요 기회입니다.

---

## 1. 기본값 변경 영향 매핑 (Breaking Change 0건, 기본값 변경 3건)

### 1.1 `experimental.enableAgents`: false -> true (복원)

- **영향도**: High
- **영향 파일**:
  - `hooks/scripts/session-start.js` (Line 125-151): `ensureAgentsEnabled()` 함수
  - `.gemini/settings.json` (Line 3): `"enableAgents": true` 하드코딩
  - `lib/gemini/version.js` (Line 177): `hasEnableAgentsDefaultFalse` 플래그
  - `tests/suites/tc111-v036-enableagents.js`: 5개 TC
  - `tests/suites/tc109-v035-skill-agent-compat.js` (Line 111-117): TC109-11
- **현재 코드**:
  ```javascript
  // session-start.js Line 140
  if (settings.experimental.enableAgents === undefined) {
    settings.experimental.enableAgents = true;
  }
  ```
- **분석**:
  - v0.36.0에서 `enableAgents` 기본값이 `false`로 변경되어 bkit v2.0.2에서 `ensureAgentsEnabled()`를 P0 Critical로 추가함
  - v0.37.0에서 `true`로 복원되면서 이 함수는 **실질적으로 불필요**해짐
  - 단, `=== undefined` 조건으로 작성되어 있어 **이미 true인 설정을 다시 true로 쓰는 중복 쓰기만 발생** (동작 오류 없음)
  - `hasEnableAgentsDefaultFalse` 플래그명이 v0.37.0 이상에서는 의미적으로 부정확 (실제로는 다시 true)
- **수정 방안**:
  - **즉시**: 수정 불필요. 안전망 코드로 유지 (v0.36.0 사용자 하위 호환성)
  - **권장**: v0.37.0+ 감지 시 `ensureAgentsEnabled()` 실행 스킵하는 조건 추가
    ```javascript
    // session-start.js: v0.37.0+에서는 enableAgents 기본값이 true이므로 스킵
    const { isVersionAtLeast } = require('./version');
    if (!isVersionAtLeast('0.37.0')) {
      ensureAgentsEnabled(projectDir);
    }
    ```
  - **선택**: `hasEnableAgentsDefaultFalse` 플래그를 v0.37.0 미만에서만 true가 되도록 범위 한정 (현재는 `isVersionAtLeast('0.36.0')` -> v0.36.x에서만 true로 변경). 단, 기존 테스트 호환성 고려 필요
- **참조**: [PR #23672](https://github.com/google-gemini/gemini-cli/pull/23672)

### 1.2 `experimental.jitContext`: true -> false (즉시 로딩 전환)

- **영향도**: High (긍정적)
- **영향 파일**:
  - `lib/gemini/context-fork.js` (Line 167-184): JIT 파셜 감지 로직
  - `lib/gemini/import-resolver.js` (Line 26-58): `isJITMode()`, `waitForFile()` JIT 재시도 로직
  - `hooks/scripts/session-start.js` (Line 247-265): JIT dedup 로직
  - `hooks/scripts/pre-compress.js` (Line 29-39): JIT 파셜 감지
  - `lib/gemini/version.js` (Line 168): `hasJITContextLoading` 플래그
- **현재 코드**:
  ```javascript
  // import-resolver.js Line 26-30
  function isJITMode() {
    try {
      const { getFeatureFlags } = require('./version');
      return !!getFeatureFlags().hasJITContextLoading;
    } catch (e) { return false; }
  }
  ```
- **분석**:
  - `hasJITContextLoading`은 `isVersionAtLeast('0.35.0')`로 판정 -> v0.37.1에서도 **true 반환**
  - 그러나 v0.37.0에서 jitContext 기본값이 `false`로 변경되어 **CLI 자체는 JIT를 비활성화**
  - bkit 코드는 CLI 버전으로 JIT 여부를 판단하지만, 실제 CLI 설정은 JIT off
  - **결과**: bkit이 "JIT 모드"라고 판단하여 불필요한 방어 코드(재시도, 파셜 감지, dedup)를 실행하지만, 이는 **성능 낭비일 뿐 기능 오류는 아님**
    - `waitForFile()`: 파일이 이미 존재하므로 즉시 통과 (재시도 발생 안 함)
    - `jitPartial` 감지: 데이터가 완전하므로 false 반환
    - JIT dedup (session-start): commands.md, core-rules.md를 중복 주입하지 않음 -> 오히려 **토큰 절약에 유리** (GEMINI.md @import가 즉시 로딩되므로 중복 방지가 정확히 작동)
- **수정 방안**:
  - **즉시**: 수정 불필요. JIT 방어 코드는 실질적 해가 없고 하위 호환성 유지
  - **권장 (v0.37.0+ 최적화)**: `isJITMode()` 로직을 CLI 설정 기반으로 변경
    ```javascript
    function isJITMode() {
      try {
        const { getFeatureFlags, isVersionAtLeast } = require('./version');
        // v0.37.0+: jitContext 기본값 false로 변경
        // 사용자가 명시적으로 jitContext=true로 설정하지 않는 한 JIT 비활성
        if (isVersionAtLeast('0.37.0')) return false;
        return !!getFeatureFlags().hasJITContextLoading;
      } catch (e) { return false; }
    }
    ```
  - **주의**: 사용자가 settings.json에서 `jitContext: true`를 명시적으로 설정한 경우를 완전히 커버하려면 settings.json 읽기가 필요하나, 현재 import-resolver에서 settings.json 접근 경로가 없으므로 버전 기반 추정이 실용적
- **참조**: [PR #24364](https://github.com/google-gemini/gemini-cli/pull/24364)

### 1.3 `ui.compactToolOutput`: false -> true

- **영향도**: Low
- **영향 파일**: 없음
- **분석**: bkit의 모든 훅(AfterTool, BeforeTool 등)은 `tool_name`과 `tool_input` 필드만 읽으며, UI 출력 형식에 의존하지 않음. `compactToolOutput`은 사용자 터미널 렌더링만 변경
- **수정 방안**: 없음
- **참조**: 설정 문서 확인

---

## 2. 스킬 영향 분석

| 스킬 | 영향 항목 | 영향도 | 수정 내용 | 난이도 |
|------|-----------|--------|-----------|--------|
| 전체 38개 스킬 | Hook/Policy 시스템 변경 없음 | 없음 | 없음 | - |
| pdca | Plan Mode stable 활용 기회 | Low (기회) | Plan Mode 연동 가이드 추가 가능 | 소 |
| bkit-rules | 기본값 변경 문서화 | Low | 새 기본값 반영 가이드 업데이트 | 소 |

**결론**: 스킬 자체에 코드 변경이 필요한 항목은 없습니다. 스킬은 SKILL.md (Markdown + YAML frontmatter)로 정의되며, Gemini CLI의 기본값 변경이나 새 기능은 스킬 콘텐츠에 영향을 주지 않습니다.

---

## 3. 에이전트 영향 분석

| 에이전트 | 영향 항목 | 영향도 | 수정 내용 | 난이도 |
|----------|-----------|--------|-----------|--------|
| 전체 21개 에이전트 | enableAgents=true 복원 | 없음 (긍정적) | 없음 (안전망 코드로 이미 활성화 보장) | - |
| gap-detector | Plan Mode에서 read-only 동작 | 없음 | Plan Mode 정책 이미 존재 (policy.js) | - |
| pdca-iterator | Plan Mode 활용 기회 | Low (기회) | Plan -> Execute 모델 라우팅 활용 | 중 |
| cto-lead | Plan Mode 모델 라우팅 활용 기회 | Low (기회) | Pro(설계)/Flash(구현) 자동 전환 활용 | 중 |

**결론**: 에이전트에 코드 변경이 필요한 항목은 없습니다. `enableAgents=true` 복원으로 에이전트 시스템이 기본적으로 활성화되어 bkit에 긍정적입니다.

---

## 4. 스크립트 영향 분석

| 스크립트 | 영향 항목 | 영향도 | 수정 내용 | 난이도 |
|----------|-----------|--------|-----------|--------|
| `session-start.js` | `ensureAgentsEnabled()` 중복 실행 | Medium | v0.37.0+ 감지 시 스킵 조건 추가 (권장) | 소 |
| `session-start.js` | JIT dedup 로직 (Line 260) | Medium | `isJITMode()` 반환값 조정 (권장) | 소 |
| `before-model.js` | Plan Mode stable 활용 기회 | Low (기회) | MODEL_ROUTING 힌트에 plan.modelRouting 연동 | 중 |
| `before-tool.js` | 변경 없음 | 없음 | - | - |
| `before-agent.js` | 변경 없음 | 없음 | - | - |
| `before-tool-selection.js` | Plan Mode 도구 보호 (Line 31) | 없음 | 이미 `enter_plan_mode`/`exit_plan_mode` 보호 중 | - |
| `after-tool.js` | 변경 없음 | 없음 | - | - |
| `after-agent.js` | 변경 없음 | 없음 | - | - |
| `after-model.js` | 변경 없음 | 없음 | - | - |
| `pre-compress.js` | JIT 파셜 감지 불필요 | Low | v0.37.0+ 시 스킵 가능 (선택) | 소 |
| `session-end.js` | 변경 없음 | 없음 | - | - |

---

## 5. 라이브러리 영향 분석

| 모듈 | 파일 | 영향 항목 | 영향도 | 수정 내용 |
|------|------|-----------|--------|-----------|
| version | `version.js` | v0.37.0+ 기능 플래그 추가 필요 | Medium | 새 플래그 그룹 추가 (아래 상세) |
| version | `version.js` | `hasEnableAgentsDefaultFalse` 의미적 부정확 | Low | 주석 또는 플래그명 보정 (선택) |
| context-fork | `context-fork.js` | JIT 파셜 감지 (Line 167-184) | Low | 기능 오류 없음, 최적화 기회 |
| import-resolver | `import-resolver.js` | `isJITMode()` 과잉 판정 | Medium | v0.37.0+ 시 false 반환 (권장) |
| model-resolver | `model-resolver.js` | Plan Mode modelRouting 활용 기회 | Low (기회) | Pro/Flash 라우팅 연동 |
| hooks | `hooks.js` | Hook 이벤트 변경 없음 (11개 유지) | 없음 | - |
| policy | `policy.js` | Policy 시스템 변경 없음 | 없음 | - |
| tools | `tools.js` | 도구 목록 변경 없음 (23개 유지) | 없음 | - |
| tracker | `tracker.js` | 변경 없음 | 없음 | - |
| platform | `platform.js` | 변경 없음 | 없음 | - |

### 5.1 version.js v0.37.0+ 기능 플래그 추가 (권장)

현재 `version.js`의 기능 플래그는 v0.34.0+, v0.35.0+, v0.36.0+ 그룹까지만 정의되어 있습니다. v0.37.0+에서 추가된 주요 기능에 대한 플래그가 필요합니다.

**추가 권장 플래그**:
```javascript
// v0.37.0+
hasPlanModeStable: isVersionAtLeast('0.37.0'),          // Plan Mode stable 승격
hasPlanModelRouting: isVersionAtLeast('0.37.0'),         // plan.modelRouting 설정
hasEnableAgentsDefaultTrue: isVersionAtLeast('0.37.0'),  // enableAgents 기본값 true 복원
hasJitContextDefaultFalse: isVersionAtLeast('0.37.0'),   // jitContext 기본값 false
hasMemoryBoundaryMarkers: isVersionAtLeast('0.37.0'),    // context.memoryBoundaryMarkers
hasProjectMemoryScope: isVersionAtLeast('0.37.0'),       // 프로젝트별 메모리 스코프
hasChapters: isVersionAtLeast('0.37.0'),                 // Chapters 시스템
hasSecretVisibilityLockdown: isVersionAtLeast('0.37.0'), // .env 비밀 가시성 제어
```

**getBkitFeatureFlags() 확장**:
```javascript
// v0.37.0+
canUsePlanModeStable: flags.hasPlanModeStable,
canUsePlanModelRouting: flags.hasPlanModelRouting,
canUseMemoryBoundaryMarkers: flags.hasMemoryBoundaryMarkers,
canUseProjectMemoryScope: flags.hasProjectMemoryScope,
```

---

## 6. 설정 파일 영향 분석

| 설정 파일 | 영향 항목 | 영향도 | 수정 내용 |
|-----------|-----------|--------|-----------|
| `bkit.config.json` (Line 120) | `testedVersions`에 "0.37.1" 추가 필요 | Medium | `"0.37.1"` 추가 |
| `bkit.config.json` (Line 119) | `minGeminiCliVersion` 변경 불필요 | 없음 | "0.34.0" 유지 |
| `gemini-extension.json` | 변경 불필요 | 없음 | - |
| `.gemini/settings.json` | `enableAgents: true` 중복 (CLI 기본값과 동일) | Low | 유지 (안전망) |
| `hooks/hooks.json` | Hook 이벤트 목록 변경 없음 (9개 사용 중) | 없음 | - |

### 6.1 bkit.config.json 업데이트

```json
"testedVersions": ["0.29.0", "0.30.0", "0.31.0", "0.32.0", "0.33.0", "0.34.0", "0.35.0", "0.35.3", "0.36.0", "0.37.0", "0.37.1"],
```

---

## 7. 철학 정합성 검증 결과

| 원칙 | 상태 | 검증 근거 |
|------|------|-----------|
| **Automation First** | 유지 | (1) `ensureAgentsEnabled()` 안전망이 유지되어 어떤 버전에서든 에이전트 자동 활성화 보장. (2) JIT->Eager 전환으로 컨텍스트 자동 로딩 안정성 향상. (3) Plan Mode stable 승격으로 자동 모델 라우팅 기회 확대 |
| **No Guessing** | 유지 | (1) `ensureAgentsEnabled()`의 `=== undefined` 조건은 사용자의 명시적 `false` 설정을 존중 (Line 140). (2) 기본값 변경이 bkit의 명시적 설정 패턴과 충돌하지 않음. (3) BeforeTool `ask` 결정 메커니즘 유지 |
| **Docs = Code** | 유지 | (1) PDCA 문서 경로(docs/01-plan/, docs/02-design/ 등)에 변경 없음. (2) Plan Mode stable 승격은 "설계 우선" 철학과 일치. (3) JIT->Eager 전환으로 GEMINI.md 컨텍스트가 세션 시작 시 확실히 로딩 -> 문서-코드 동기화 안정성 향상 |
| **AI as Partner** | 유지 | (1) 에이전트 시스템 기본 활성화 복원으로 AI 파트너 역할 강화. (2) Chapters 시스템으로 장시간 세션 가독성 향상 -> AI 협업 품질 향상. (3) Secret Visibility Lockdown은 AI에게 민감 데이터 노출 방지 -> 신뢰 향상 |
| **Context Engineering** | 유지 | (1) Hook 시스템 11개 이벤트 + Policy 시스템 완전 유지. (2) JIT->Eager 전환은 bkit 6-Layer 아키텍처에 긍정적 (L1 Plugin Policy -> L4 Session 계층이 세션 시작 시 완전 구성됨). (3) `context.memoryBoundaryMarkers`로 컨텍스트 탐색 범위 정밀 제어 기회 |
| **PDCA Methodology** | 유지 | (1) 상태 머신(20 전이, 9 가드) 동작에 변경 없음. (2) Plan Mode stable 승격은 PDCA Plan 단계와 자연스럽게 연계 가능. (3) `plan.modelRouting`은 bkit의 기존 `modelRouting.phaseRules` (bkit.config.json Line 186-193)과 보완적 |

---

## 8. 기능 개선 기회

| # | 새 CLI 기능 | bkit 활용 방안 | 예상 효과 | 우선순위 | 난이도 |
|---|------------|---------------|-----------|----------|--------|
| 1 | **Plan Mode stable + modelRouting** | `before-model.js`의 MODEL_ROUTING 힌트를 CLI 네이티브 `plan.modelRouting`과 통합. PDCA plan/design 단계에서 Plan Mode 진입을 BeforeModel 훅에서 추천. gemini-extension.json의 `plan.directory`를 "docs/01-plan"으로 유지하되 CLI Plan Mode와 PDCA Plan 단계의 연계 문서화 | 모델 비용 30-50% 절감 (Pro 설계 -> Flash 구현 자동 전환). PDCA Plan 단계에서 코드 작성 방지 강화 | P1 | 중 |
| 2 | **context.memoryBoundaryMarkers** | monorepo 사용 가이드에 `.bkit-boundary` 마커 파일 패턴 문서화. bkit 설치 시 프로젝트 루트에 경계 마커를 자동 생성하여 GEMINI.md 탐색이 프로젝트 범위를 벗어나지 않도록 설정 | monorepo 환경에서 컨텍스트 오염 방지. 다른 프로젝트의 GEMINI.md와 간섭 차단 | P2 | 소 |
| 3 | **Project-level memory scope** | `bkit.config.json`의 `agentMemory.projectScope` (Line 207)를 CLI 네이티브 프로젝트 메모리와 연계. `save_memory` 도구 호출 시 자동으로 프로젝트 스코프 적용 | 다중 프로젝트 환경에서 에이전트 메모리 격리. 프로젝트 간 컨텍스트 누수 방지 | P2 | 소 |
| 4 | **Chapters (도구 기반 토픽 그룹핑)** | bkit PDCA 단계 전이를 Chapters 경계로 활용. AfterAgent 훅에서 PDCA 단계 전이 시 "chapter" 정보를 systemMessage에 포함 | 장시간 세션에서 PDCA 단계별 작업 그룹화로 가독성 향상 | P3 | 소 |
| 5 | **Secret Visibility Lockdown** | bkit 보안 가이드(bkit-rules 스킬)에 `.env` 파일 보호 정책 문서화. `security.environmentVariableRedaction.enabled` 설정 권장사항 추가 | 보안 강화, 민감 정보 누출 방지 | P3 | 소 |
| 6 | **Dynamic Sandbox Expansion** | Enterprise 레벨에서 Git worktree 기반 다중 워크스페이스 작업 시 동적 샌드박스 확장 활용 가이드 | Enterprise 프로젝트의 멀티 워크스페이스 유연성 향상 | P3 | 소 |

---

## 9. v0.38.0-preview 선제적 대비 분석

| # | v0.38 항목 | bkit 충돌 가능성 | 선제 대응 |
|---|-----------|-----------------|-----------|
| 1 | **ContextCompressionService** | **높음**: bkit `pre-compress.js` 훅이 PreCompress 이벤트에서 PDCA 상태를 스냅샷하는데, CLI의 자체 압축 서비스가 bkit 컨텍스트를 과도하게 제거할 수 있음 | pre-compress.js에 "보존 필수 컨텍스트" 마커 시스템 설계 준비 |
| 2 | **Background Memory Service** | **높음**: CLI가 자동으로 스킬 추출 + SKILL.md 생성 -> bkit의 38개 수동 관리 스킬과 네이밍/경로 충돌 가능 | bkit 스킬 디렉토리 네이밍 규칙 명확화, 충돌 방지 네임스페이스 검토 |
| 3 | **Skill injection into subagent prompts** | **중간**: bkit 스킬이 서브에이전트 프롬프트에 의도치 않게 주입될 수 있음 -> 토큰 낭비 + 동작 간섭 | 스킬 frontmatter에 `subagentInjection: false` 같은 옵트아웃 메커니즘 필요성 모니터링 |
| 4 | **BeforeModel hook model override e2e** | **긍정적**: bkit `before-model.js`의 모델 라우팅 힌트가 전체 파이프라인에 전파됨 -> 안정성 향상 | 모니터링만 필요, 코드 변경 불필요 |

---

## 10. 구현 우선순위 매트릭스

| 우선순위 | 항목 | 이유 | 예상 공수 |
|----------|------|------|-----------|
| **P0 (즉시)** | `bkit.config.json` testedVersions에 "0.37.1" 추가 | 호환성 선언. 테스트 검증 범위 명시 | 5분 |
| **P1 (권장)** | `version.js`에 v0.37.0+ 기능 플래그 8개 추가 | 새 기능 게이팅 기반 확보. 다른 P1 항목의 전제 조건 | 30분 |
| **P1 (권장)** | `session-start.js` ensureAgentsEnabled() v0.37.0+ 스킵 조건 | 불필요한 settings.json 쓰기 제거. 세션 시작 속도 미세 개선 | 15분 |
| **P1 (권장)** | `import-resolver.js` isJITMode() v0.37.0+ false 반환 | JIT 방어 코드 불필요 실행 제거. 코드 의미 정확성 향상 | 15분 |
| **P2 (기회)** | Plan Mode stable + modelRouting 활용 설계 | PDCA Plan 단계와 CLI Plan Mode 통합으로 비용 최적화 | 2-3시간 |
| **P2 (기회)** | memoryBoundaryMarkers 활용 가이드 | monorepo 환경 지원 강화 | 1시간 |
| **P2 (기회)** | Project-level memory scope 연계 | 다중 프로젝트 메모리 격리 | 1시간 |
| **P3 (선택)** | Chapters 연동, Secret Lockdown 문서화, 테스트 업데이트 | 부가가치 기능 | 각 30분-1시간 |

---

## 11. 테스트 영향 분석

| 테스트 파일 | 관련 항목 | 영향도 | 필요 조치 |
|-------------|-----------|--------|-----------|
| `tc111-v036-enableagents.js` | enableAgents 복원 | Low | 기존 5 TC 유지 (하위 호환성 검증). v0.37.0+ 스킵 조건 추가 시 새 TC 필요 |
| `tc109-v035-skill-agent-compat.js` | TC109-11, TC109-12 | Low | 기존 TC 유지. testedVersions에 "0.37.1" 추가 시 TC109-12 검증 범위 확장 |
| `tc105-v035-feature-gates.js` | 기능 플래그 테스트 | Medium | v0.37.0+ 새 플래그 8개에 대한 TC 추가 필요 |
| `tc97-e2e-integration.js` | TC97-24 minGeminiCliVersion | 없음 | "0.34.0" 유지이므로 변경 없음 |
| `tc23-tracker-bridge.js` | v0.37.0 withVersion 테스트 | 없음 | 이미 v0.37.0 테스트 존재 |
| `tc110-v035-e2e-regression.js` | testedVersions 포함 확인 | Low | "0.37.1" 추가 후 자동 통과 |

**예상 신규 TC**: v0.37.0+ 기능 플래그 8개 x TC 2개 (true/false 경계) = 16 TC

---

## 12. 파일별 수정 요약

| 파일 | 수정 유형 | 우선순위 | 상세 |
|------|-----------|----------|------|
| `bkit.config.json` | 설정 업데이트 | P0 | testedVersions에 "0.37.1" 추가 |
| `lib/gemini/version.js` | 코드 추가 | P1 | v0.37.0+ 기능 플래그 8개 + getBkitFeatureFlags 확장 |
| `hooks/scripts/session-start.js` | 코드 수정 | P1 | ensureAgentsEnabled() v0.37.0+ 조건부 스킵 |
| `lib/gemini/import-resolver.js` | 코드 수정 | P1 | isJITMode() v0.37.0+ false 반환 |
| `lib/gemini/context-fork.js` | 변경 불필요 | - | JIT 파셜 감지가 false 반환하므로 사실상 비활성 |
| `hooks/scripts/pre-compress.js` | 변경 불필요 | - | JIT 파셜 감지가 false 반환하므로 사실상 비활성 |
| `hooks/scripts/before-model.js` | 기회 항목 | P2 | Plan Mode modelRouting 연동 (향후) |
| `.gemini/settings.json` | 변경 불필요 | - | 안전망으로 유지 |
| `tests/suites/tc105-*.js` | TC 추가 | P1 | v0.37.0+ 기능 플래그 TC 16개 |

---

## 13. 조사 신뢰도

| 항목 | 신뢰도 | 비고 |
|------|--------|------|
| 기본값 변경 영향 | 5/5 | 전체 코드베이스 전수 스캔 완료. enableAgents/jitContext/compactToolOutput 관련 모든 참조점 확인 |
| Hook 시스템 호환성 | 5/5 | hooks.json 9개 이벤트 + 10개 스크립트 전수 분석. v0.37에서 Hook 구조 변경 없음 확인 |
| Policy 시스템 호환성 | 5/5 | policy.js의 TOML 생성 로직과 v0.37 Policy 시스템 간 변경사항 없음 확인 |
| 기능 플래그 분석 | 5/5 | version.js의 42개 기존 플래그 전수 확인. v0.37.0+ 추가 필요 항목 식별 |
| 기능 개선 기회 | 4/5 | Plan Mode modelRouting 통합 상세 설계는 추가 조사 필요 (CLI Plan Mode와 bkit PDCA Plan 단계의 정확한 인터페이스 확인 필요) |
| v0.38 대비 분석 | 3/5 | preview 기반 추정. stable 릴리스에서 변경될 수 있음 |

---

## 14. 결론

**v0.36.0 -> v0.37.1 마이그레이션은 저위험(Low Risk)**이며, bkit 코드 변경 없이도 정상 작동합니다.

핵심 판단:
1. **Breaking Change 0건**: bkit 실행/빌드에 영향을 주는 변경사항이 없습니다
2. **기본값 변경 3건 모두 긍정적/무영향**: enableAgents=true 복원(긍정), jitContext=false(긍정), compactToolOutput=true(무영향)
3. **Hook 시스템 완전 호환**: 11개 이벤트 + 입출력 스키마 유지
4. **Policy 시스템 완전 호환**: toolName 필수 등 v0.36.0 규칙 유지
5. **주요 기회**: Plan Mode stable + modelRouting -> PDCA 비용 최적화, memoryBoundaryMarkers -> monorepo 지원
6. **v0.38 주의**: ContextCompressionService와 Background Memory Service는 bkit과 충돌 가능성이 있어 모니터링 필요

**권장 마이그레이션 순서**:
1. `bkit.config.json` testedVersions 업데이트
2. `version.js` v0.37.0+ 기능 플래그 추가
3. `session-start.js`, `import-resolver.js` 최적화
4. 통합 테스트 실행
5. Plan Mode / memoryBoundaryMarkers 활용 설계 (P2)
