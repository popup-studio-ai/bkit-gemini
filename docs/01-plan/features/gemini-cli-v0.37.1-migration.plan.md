# Gemini CLI v0.37.1 Migration Plan -- bkit v2.0.4

> **Feature**: gemini-cli-v037-migration
> **Version**: bkit v2.0.4
> **Created**: 2026-04-13
> **Status**: Draft
> **Strategy**: B' (Balanced Enhancement) -- 5th application of validated Strategy B pattern
> **Migration Scope**: v0.36.0 -> v0.37.1 (Stable -> Stable)
> **Research**: [gemini-cli-v0.37.1-research.md](../research/gemini-cli-v0.37.1-research.md)
> **Impact Analysis**: [gemini-cli-v0.37.1-impact.analysis.md](../../03-analysis/gemini-cli-v0.37.1-impact.analysis.md)
> **Prior Art**: [gemini-cli-v036-migration.plan.md](gemini-cli-v036-migration.plan.md) (v0.36.0 Phase 2, Strategy B)

---

## Executive Summary

| Item | Content |
|------|---------|
| Target Version | v0.37.1 Stable (2026-04-09 released) |
| Breaking Changes | 0건 (코드 변경 필수 항목 없음) |
| Default Value Changes | 3건 (enableAgents=true 복원, jitContext=false, compactToolOutput=true) |
| Recommended Strategy | Approach B' (Balanced Enhancement): 최적화 + 기능 플래그 + 선별적 기회 채택 |
| Estimated Effort | 2.3h (Impact Analysis 추정 ~8h 대비 71% YAGNI 절감) |
| Wave Structure | 3 Waves (Foundation -> Optimization -> Tests) |
| Affected Files | 5개 (modify 4 + update tests 1) |

## Value Delivered

| Perspective | Content |
|-------------|---------|
| Problem | v0.37.0 기본값 복원/변경으로 bkit 방어 코드가 불필요한 I/O 및 잘못된 모드 판정 수행 |
| Solution | 버전 감지 기반 조건부 스킵 + 기능 플래그 확장 + 테스트 보강 |
| Functional Effect | 불필요한 settings.json 쓰기 제거, JIT 방어 코드 정확성 복원, v0.37.0+ 기능 게이팅 기반 확보 |
| Core Value | bkit 코드-실제동작 의미적 정합성 향상 + 향후 v0.38.0 대응 기반 |

---

## 1. Intent Analysis (의도 분석)

### 1.1 WHY: 이 마이그레이션이 필요한 이유

**Primary: 코드 의미 정합성(Semantic Correctness) 복원**

v0.37.0에서 `enableAgents` 기본값이 `true`로 복원되고 `jitContext` 기본값이 `false`로 변경되었다. bkit의 두 핵심 방어 코드가 의미적으로 부정확한 상태로 동작하고 있다:

1. `ensureAgentsEnabled()`: 이미 `true`인 설정을 다시 `true`로 덮어쓰기 (불필요한 파일 I/O)
2. `isJITMode()`: CLI가 JIT를 비활성화했는데 `true`를 반환 (과잉 방어 코드 실행)

둘 다 기능 오류는 아니지만, "코드가 의도하는 바와 실제 동작이 다른" 상태를 방치하면 향후 디버깅과 유지보수 비용이 증가한다.

**Secondary: v0.37.0+ 기능 게이팅(Feature Gate) 기반 확보**

`version.js`에 v0.37.0+ 플래그가 없으면, Plan Mode stable, memoryBoundaryMarkers, Project Memory Scope 등의 기능을 조건부로 활용하는 것이 불가능하다. 이는 v0.35.0, v0.36.0 마이그레이션에서 검증된 "Feature Gate 선행 추가" 패턴의 연속이다.

**Tertiary: v0.38.0 대비 기반 구축**

v0.38.0-preview에서 ContextCompressionService, Background Memory Service 등 bkit과 충돌 가능성이 높은 변경이 예고되었다. v0.37.0+ 기능 플래그가 확보되어야 v0.38.0 마이그레이션 시 조건부 분기가 가능하다.

### 1.2 핵심 목적 판정

| 질문 | 답변 |
|------|------|
| 단순 호환성 유지? | **아님** -- Breaking Change 0건. 코드 변경 없이도 동작함 |
| 기능 고도화? | **아님** -- P2 기회 항목(Plan Mode, memoryBoundaryMarkers)은 별도 이니셔티브로 분리 |
| 최적화 + 기반 확보? | **맞음** -- 방어 코드 정확성 복원 + 기능 플래그 확장 + 테스트 보강 |

### 1.3 사용자 가치 분석

| 가치 | v0.37.1 기여 | 중요도 |
|------|-------------|--------|
| **안정성** | enableAgents=true 복원으로 에이전트 시스템 기본 활성화 보장 (CLI 자체에서) | 자동 적용 |
| **정확성** | bkit 코드가 CLI 실제 동작과 의미적으로 일치 | P1 |
| **성능** | 불필요한 settings.json 쓰기 제거, JIT 방어 코드 스킵 | 미세 개선 |
| **기반** | v0.37.0+ 기능 플래그로 향후 기능 활용 가능 | P1 |
| **버그 수정 자동 적용** | TTY hang, 10MB cap, shell buffer leak, MCP discovery 등 | 자동 적용 |

### 1.4 시간/리소스 제약

| 항목 | 상태 |
|------|------|
| v0.37.1 Stable 릴리스일 | 2026-04-09 (이미 릴리스됨) |
| Critical Breaking Change | 0건 |
| 긴급도 | 낮음 -- 코드 변경 없이도 정상 동작 |
| v0.38.0 예상 stable | 미정 (preview.0 = 2026-04-08) |

---

## 2. Strategy Alternatives (전략 비교 브레인스토밍)

### 2.1 Approach A: Minimal Patch (최소 수정)

**범위**: `bkit.config.json` testedVersions 추가 + `version.js` 기능 플래그 추가만

| 작업 | 파일 | 공수 |
|------|------|------|
| bkit.config.json testedVersions에 "0.37.1" 추가 | `bkit.config.json` | 5분 |
| version.js v0.37.0+ 기능 플래그 8개 추가 | `lib/gemini/version.js` | 30분 |
| getBkitFeatureFlags() v0.37.0+ 매핑 추가 | `lib/gemini/version.js` | 10분 |
| **합계** | **2 files** | **0.75h** |

| Aspect | Assessment |
|--------|-----------|
| **장점** | 최소 위험, 가장 빠른 완료, Breaking Change 0건이므로 이것만으로도 충분 |
| **단점** | ensureAgentsEnabled() 불필요 쓰기 방치, isJITMode() 의미적 부정확 방치, 테스트 미보강 |
| **위험도** | 매우 낮음 |
| **품질 향상** | 낮음 -- 기능 플래그만 확보, 코드 품질 개선 없음 |

### 2.2 Approach B': Balanced Enhancement (최적화 + 기반 확보) -- RECOMMENDED

**범위**: A + ensureAgentsEnabled() 조건부 스킵 + isJITMode() 정확성 복원 + 테스트 보강

| 작업 | 파일 | 공수 |
|------|------|------|
| bkit.config.json testedVersions에 "0.37.1" 추가 | `bkit.config.json` | 5분 |
| version.js v0.37.0+ 기능 플래그 8개 추가 | `lib/gemini/version.js` | 30분 |
| getBkitFeatureFlags() v0.37.0+ 매핑 추가 | `lib/gemini/version.js` | 10분 |
| session-start.js ensureAgentsEnabled() v0.37.0+ 스킵 | `hooks/scripts/session-start.js` | 15분 |
| import-resolver.js isJITMode() v0.37.0+ false 반환 | `lib/gemini/import-resolver.js` | 15분 |
| tc105 기능 플래그 TC 추가 + tc111 기대값 업데이트 | `tests/suites/tc105-*.js`, `tc111-*.js` | 30분 |
| 기존 993+ TC 회귀 테스트 실행 | 전체 | 15분 |
| **합계** | **5 files** | **2.3h** |

| Aspect | Assessment |
|--------|-----------|
| **장점** | 코드-실제동작 의미 정합성 복원, 불필요 I/O 제거, 기능 플래그 확보, 테스트 보강 |
| **단점** | Approach A 대비 +1.5h 추가 작업 |
| **위험도** | 낮음 -- 조건부 분기만 추가, 기존 로직 변경 없음 |
| **품질 향상** | 중간 -- 코드 정확성 + 기반 확보 + 테스트 커버리지 |

### 2.3 Approach C: Comprehensive Enhancement (전면 고도화)

**범위**: B' + Plan Mode modelRouting 통합 + memoryBoundaryMarkers 활용 + Project Memory Scope + Secret Lockdown 문서화 + Chapters 연동

| 작업 | 파일 | 공수 |
|------|------|------|
| B' 전체 작업 | (위 참조) | 2.3h |
| Plan Mode modelRouting before-model.js 통합 | `hooks/scripts/before-model.js` | 2h |
| memoryBoundaryMarkers 활용 가이드 작성 | 문서 | 1h |
| Project Memory Scope 연계 설계 | `bkit.config.json` + 문서 | 1h |
| Secret Lockdown SKILL.md 문서화 | `skills/bkend-security/SKILL.md` | 0.5h |
| Chapters PDCA 연동 설계 | `hooks/scripts/after-agent.js` | 1.5h |
| 추가 테스트 | 테스트 | 1h |
| **합계** | **10+ files** | **9.3h** |

| Aspect | Assessment |
|--------|-----------|
| **장점** | v0.37.0 기능 최대 활용, Plan Mode 비용 최적화, 보안 강화 |
| **단점** | 4배 이상의 작업량, P2 기회 항목들은 현재 사용자 요구 없음 |
| **위험도** | 중간 -- Plan Mode 통합은 CLI Plan Mode와 PDCA Plan 단계의 인터페이스 검증 필요 |
| **품질 향상** | 높음 -- 그러나 대부분 "있으면 좋을 것 같은" 기능 |

### 2.4 Evaluation Matrix (평가 매트릭스)

| 기준 (가중치) | A: Minimal (0.75h) | B': Balanced (2.3h) | C: Comprehensive (9.3h) |
|---------------|-------------------|---------------------|------------------------|
| 위험도 (30%) | 10 (매우 낮음) | 9 (낮음) | 5 (중간) |
| 작업량 (25%) | 10 (0.75h) | 8 (2.3h) | 3 (9.3h) |
| 가치 창출 (25%) | 4 (플래그만) | 7 (정합성 + 기반) | 9 (전면 고도화) |
| 장기 이점 (20%) | 5 (기반만) | 8 (v0.38 대비) | 9 (완전 활용) |
| **가중 합계** | **7.35** | **8.05** | **6.35** |

### 2.5 Strategy Decision

**선택: Approach B' (Balanced Enhancement)** -- 가중 합계 8.05 (최고)

선택 근거:

1. **검증된 패턴**: Strategy B는 v0.31.0, v0.35.0, v0.36.0 (Phase 1, Phase 2) 총 4회 연속 적용되어 최고 점수를 기록한 패턴이다
2. **B' 변형 근거**: Breaking Change 0건이므로 "수정 + 선택적 채택" 대신 "검증 + 최적화 + 선택적 채택" 패턴 적용. 이는 v0.37.0 memory에서 이미 제안된 B' 변형과 동일
3. **한계 비용(Marginal Cost) 효율**: Approach A 대비 +1.5h로 코드 정합성 + 테스트 보강 확보
4. **YAGNI 준수**: Approach C의 7h 추가 작업은 전부 현재 사용자 요구가 없는 P2 기회 항목

---

## 3. YAGNI Review

### 3.1 Impact Analysis 항목별 채택/보류 판정

| # | 항목 | 공수 | 채택? | 근거 |
|---|------|------|-------|------|
| 1 | bkit.config.json testedVersions | 5분 | **채택** | 호환성 선언. 모든 마이그레이션의 기본 작업 |
| 2 | version.js 기능 플래그 8개 | 30분 | **채택** | 모든 조건부 분기의 전제 조건. 검증된 패턴 |
| 3 | getBkitFeatureFlags() 확장 | 10분 | **채택** | 플래그 추가 시 자연스럽게 수반되는 작업 |
| 4 | ensureAgentsEnabled() v0.37.0+ 스킵 | 15분 | **채택** | 불필요한 파일 I/O 제거. 코드-동작 의미 일치 복원 |
| 5 | isJITMode() v0.37.0+ false 반환 | 15분 | **채택** | JIT 방어 코드 정확성 복원. 2줄 변경으로 높은 가치 |
| 6 | 테스트 추가 (TC-113 또는 TC-105 확장) | 30분 | **채택** | 새 플래그와 최적화 변경에 대한 검증 필수 |
| 7 | Plan Mode modelRouting 통합 | 2h | **보류** | 사용자 요구 없음. PDCA Plan 단계와 CLI Plan Mode의 인터페이스가 불명확. 별도 이니셔티브 적합 |
| 8 | memoryBoundaryMarkers 활용 가이드 | 1h | **보류** | monorepo 사용 사례가 현재 없음. "있으면 좋을 것 같은" 문서 |
| 9 | Project Memory Scope 연계 | 1h | **보류** | 현재 단일 프로젝트 운용. 다중 프로젝트 수요 없음 |
| 10 | Secret Lockdown SKILL.md 문서화 | 0.5h | **보류** | bkend-security SKILL.md는 v0.36.0 Phase 2에서 이미 sandbox notice 추가됨. 추가 문서화는 별도 |
| 11 | Chapters PDCA 연동 | 1.5h | **보류** | Chapters는 UI 레벨 기능. bkit 훅에서 제어할 인터페이스 미확인 |
| 12 | hasEnableAgentsDefaultFalse 플래그명 변경 | 0.5h | **보류** | 기존 테스트 5개(tc111)가 이 플래그명에 의존. 리네이밍 비용 > 이점 |

### 3.2 YAGNI Savings

| Category | Items | Effort |
|----------|-------|--------|
| 채택 (Wave 1-3) | 6 items | 2.3h |
| 보류 | 6 items | 6.5h |
| **Impact Analysis 추정 합계** | 12 items | ~8h |
| **실제 Plan** | 6 items | **2.3h** |
| **YAGNI 절감** | | **71%** |

### 3.3 YAGNI Checklist

- [x] "있으면 좋을 것 같은" 기능이 포함되어 있지 않은가? -- Plan Mode, memoryBoundaryMarkers, Chapters 등 모두 보류
- [x] 현재 사용자가 실제로 필요로 하는 변경인가? -- 기능 플래그(기반)와 최적화(정확성)만 채택
- [x] bkit 철학에 부합하는가? -- "No Guessing" (isJITMode 정확성), "Automation First" (ensureAgentsEnabled 효율화)
- [x] 유지보수 비용 대비 가치가 충분한가? -- 모든 변경이 3줄 이내, 기존 모듈 내 수정
- [x] 이전 마이그레이션에서 불필요했던 패턴을 반복하고 있지 않은가? -- v0.35.0에서 "모든 P3 수정" 안티패턴 없음

### 3.4 보류 항목의 적절한 시점

| 보류 항목 | 적절한 시점 | 트리거 조건 |
|-----------|------------|------------|
| Plan Mode modelRouting 통합 | v2.1.0 또는 별도 feature plan | 사용자가 PDCA Plan 단계에서 비용 최적화를 요청할 때 |
| memoryBoundaryMarkers | monorepo 지원 요구 시 | bkit을 monorepo 환경에서 사용하는 사례 발생 시 |
| Project Memory Scope | 다중 프로젝트 운용 시 | 동일 머신에서 2+ bkit 프로젝트 동시 운용 시 |
| Secret Lockdown 문서화 | 보안 감사(audit) 시 | 보안 검토 요청 또는 .env 관련 인시던트 발생 시 |
| Chapters PDCA 연동 | CLI Chapters API 안정화 후 | Chapters에 대한 훅 인터페이스가 공식 문서화될 때 |
| hasEnableAgentsDefaultFalse 리네이밍 | v0.36.0 하위 호환 불필요 시 | minGeminiCliVersion이 0.37.0 이상으로 올라갈 때 |

---

## 4. v0.38.0-preview 선제 대응 평가

### 4.1 지금 대비해야 하는 것

| # | 항목 | 선제 대응 | 근거 |
|---|------|-----------|------|
| 1 | v0.37.0+ 기능 플래그 확보 | **이번 마이그레이션에 포함** | v0.38.0 마이그레이션 시 `isVersionAtLeast('0.37.0')` 조건부 분기의 전제 조건 |
| 2 | isJITMode() 정확성 복원 | **이번 마이그레이션에 포함** | v0.38.0에서 ContextCompressionService가 추가될 때 JIT 관련 코드 경로가 정확해야 충돌 분석 가능 |

### 4.2 나중에 해도 되는 것

| # | 항목 | 보류 근거 | 대응 시점 |
|---|------|-----------|-----------|
| 1 | ContextCompressionService 대응 | preview 단계. CLI 자체 압축과 bkit pre-compress 훅의 상호작용이 stable에서 확정되어야 함 | v0.38.0 stable 릴리스 시 |
| 2 | Background Memory Service 충돌 방지 | preview 단계. CLI 자동 SKILL.md 생성이 bkit 수동 관리 스킬과 충돌하는지 stable에서 검증 필요 | v0.38.0 stable 릴리스 시 |
| 3 | Skill subagent 주입 옵트아웃 | preview 단계. `subagentInjection` 옵트아웃 메커니즘이 CLI에서 제공될 가능성 있음 | v0.38.0 stable 릴리스 시 |
| 4 | BeforeModel e2e 전파 활용 | 긍정적 변경이므로 대응 불필요. stable 릴리스 시 자동 적용 | v0.38.0 stable 릴리스 시 모니터링 |

### 4.3 판단 원칙

> **"Preview에 대해 코딩하지 않는다"** -- preview 변경사항에 대한 코드 수정은 stable 릴리스 후에만 수행한다. preview에서 stable로 넘어갈 때 API/동작이 변경되는 경우가 빈번하기 때문이다. 이번 마이그레이션에서의 v0.38.0 대비는 "기반 확보"(기능 플래그)에 한정한다.

---

## 5. Implementation Roadmap (구현 로드맵)

### Wave 1: Foundation -- 기능 플래그 + 설정 (0.75h)

| # | Task | File | Change | Effort |
|---|------|------|--------|--------|
| W1-1 | testedVersions에 "0.37.1" 추가 | `bkit.config.json` | `testedVersions` 배열에 `"0.37.0"`, `"0.37.1"` 추가 | 5분 |
| W1-2 | v0.37.0+ 기능 플래그 8개 추가 | `lib/gemini/version.js` getFeatureFlags() | `hasPlanModeStable`, `hasPlanModelRouting`, `hasEnableAgentsDefaultTrue`, `hasJitContextDefaultFalse`, `hasMemoryBoundaryMarkers`, `hasProjectMemoryScope`, `hasChapters`, `hasSecretVisibilityLockdown` | 25분 |
| W1-3 | getBkitFeatureFlags() v0.37.0+ 매핑 | `lib/gemini/version.js` getBkitFeatureFlags() | `canUsePlanModeStable`, `canUsePlanModelRouting`, `canUseMemoryBoundaryMarkers`, `canUseProjectMemoryScope` | 10분 |

**Dependency**: 없음 (W1-1, W1-2, W1-3 병렬 가능)
**Gate**: Wave 1 완료 후 Wave 2 진행 (W2가 새 플래그에 의존)

### Wave 2: Optimization -- 방어 코드 정확성 복원 (0.5h)

| # | Task | File | Change | Effort |
|---|------|------|--------|--------|
| W2-1 | ensureAgentsEnabled() v0.37.0+ 스킵 | `hooks/scripts/session-start.js` | `hasEnableAgentsDefaultTrue` 플래그 확인 -> true이면 설정 쓰기 스킵 | 15분 |
| W2-2 | isJITMode() v0.37.0+ false 반환 | `lib/gemini/import-resolver.js` | `hasJitContextDefaultFalse` 플래그 확인 -> true이면 false 반환 | 15분 |

**Dependency**: Wave 1 완료 필수 (새 플래그 사용)

**Verification**:
- W2-1: v0.37.0+에서 ensureAgentsEnabled()가 settings.json 파일 쓰기를 수행하지 않음
- W2-2: v0.37.0+에서 isJITMode()가 false를 반환하여 JIT 방어 코드가 실행되지 않음

### Wave 3: Tests -- 검증 (1h)

| # | Task | File | Change | Effort |
|---|------|------|--------|--------|
| W3-1 | v0.37.0+ 기능 플래그 TC 추가 | `tests/suites/tc105-v035-feature-gates.js` | 8개 새 플래그에 대한 TC 추가 (v0.37.0 경계값 테스트 포함) | 30분 |
| W3-2 | ensureAgentsEnabled 스킵 TC | `tests/suites/tc111-v036-enableagents.js` | v0.37.0+ 환경에서 스킵 동작 확인 TC 추가 | 15분 |
| W3-3 | 기존 993+ TC 회귀 테스트 | 전체 테스트 스위트 | `npm test` 실행, 전체 통과 확인 | 15분 |

**Dependency**: Wave 1 + Wave 2 완료 후 실행

---

## 6. Detailed File Change Specification (상세 변경 명세)

### 6.1 bkit.config.json (W1-1)

```json
// Before:
"testedVersions": ["0.29.0", "0.30.0", "0.31.0", "0.32.0", "0.33.0", "0.34.0", "0.35.0", "0.35.3", "0.36.0"],

// After:
"testedVersions": ["0.29.0", "0.30.0", "0.31.0", "0.32.0", "0.33.0", "0.34.0", "0.35.0", "0.35.3", "0.36.0", "0.37.0", "0.37.1"],
```

### 6.2 lib/gemini/version.js getFeatureFlags() (W1-2)

Line 183 이후에 추가:

```javascript
    // v0.37.0+
    hasPlanModeStable: isVersionAtLeast('0.37.0'),
    hasPlanModelRouting: isVersionAtLeast('0.37.0'),
    hasEnableAgentsDefaultTrue: isVersionAtLeast('0.37.0'),
    hasJitContextDefaultFalse: isVersionAtLeast('0.37.0'),
    hasMemoryBoundaryMarkers: isVersionAtLeast('0.37.0'),
    hasProjectMemoryScope: isVersionAtLeast('0.37.0'),
    hasChapters: isVersionAtLeast('0.37.0'),
    hasSecretVisibilityLockdown: isVersionAtLeast('0.37.0'),
```

### 6.3 lib/gemini/version.js getBkitFeatureFlags() (W1-3)

Line 243 이후에 추가:

```javascript
    // v0.37.0+
    canUsePlanModeStable: flags.hasPlanModeStable,
    canUsePlanModelRouting: flags.hasPlanModelRouting,
    canUseMemoryBoundaryMarkers: flags.hasMemoryBoundaryMarkers,
    canUseProjectMemoryScope: flags.hasProjectMemoryScope,
```

### 6.4 hooks/scripts/session-start.js ensureAgentsEnabled() (W2-1)

```javascript
// Before (Line 125-151):
function ensureAgentsEnabled(projectDir) {
  try {
    const settingsDir = path.join(projectDir, '.gemini');
    const settingsPath = path.join(settingsDir, 'settings.json');
    // ... (settings.json 읽기 + 쓰기)
  } catch (e) { /* ... */ }
}

// After:
function ensureAgentsEnabled(projectDir) {
  try {
    // v0.37.0+: enableAgents defaults to true, skip redundant settings write
    const vd = require(path.join(libPath, 'gemini', 'version'));
    if (vd.getFeatureFlags().hasEnableAgentsDefaultTrue) return;

    const settingsDir = path.join(projectDir, '.gemini');
    const settingsPath = path.join(settingsDir, 'settings.json');
    // ... (기존 코드 유지)
  } catch (e) { /* ... */ }
}
```

**설계 판단**: 함수 자체를 삭제하지 않고, 진입부에서 early return하는 방식을 선택한다. 이유:
1. v0.36.x 사용자가 여전히 존재할 수 있음 (minGeminiCliVersion=0.34.0)
2. 호출부(session-start.js main flow)를 변경하지 않아 회귀 위험 최소화
3. 향후 minGeminiCliVersion이 0.37.0 이상이 되면 함수 전체 제거 가능

### 6.5 lib/gemini/import-resolver.js isJITMode() (W2-2)

```javascript
// Before (Line 26-33):
function isJITMode() {
  try {
    const { getFeatureFlags } = require('./version');
    return !!getFeatureFlags().hasJITContextLoading;
  } catch (e) { return false; }
}

// After:
function isJITMode() {
  try {
    const { getFeatureFlags } = require('./version');
    const flags = getFeatureFlags();
    // v0.37.0+: jitContext defaults to false, JIT mode effectively disabled
    if (flags.hasJitContextDefaultFalse) return false;
    return !!flags.hasJITContextLoading;
  } catch (e) { return false; }
}
```

**설계 판단**: 기존 `hasJITContextLoading` 플래그를 삭제하지 않고, `hasJitContextDefaultFalse`로 오버라이드하는 방식을 선택한다. 이유:
1. 사용자가 settings.json에서 `jitContext: true`를 명시적으로 설정한 경우를 완전히 커버하지 못하지만, import-resolver에서 settings.json 접근 경로가 없으므로 버전 기반 추정이 실용적
2. v0.35.0~v0.36.x 범위에서는 기존 `hasJITContextLoading=true` 동작 유지
3. v0.37.0+에서는 CLI 기본 동작(JIT off)에 맞게 false 반환

---

## 7. Risk Management (위험 관리)

### 7.1 식별된 위험

| # | 위험 | 가능성 | 영향 | 완화 방안 |
|---|------|--------|------|-----------|
| 1 | ensureAgentsEnabled 스킵 후 enableAgents가 false인 환경 | 매우 낮음 | 중간 | `hasEnableAgentsDefaultTrue`는 v0.37.0+ 전용. v0.36.x는 기존 코드 경로 실행. v0.37.0+에서 사용자가 명시적으로 `false` 설정하면 CLI 자체가 이를 존중 |
| 2 | isJITMode() false 반환 후 JIT가 실제로 활성인 환경 | 낮음 | 낮음 | 사용자가 `jitContext: true`를 명시적으로 설정한 드문 경우. 이 경우에도 import-resolver의 waitForFile()은 파일 존재 시 즉시 통과하므로 기능 오류 없음 |
| 3 | 기존 테스트 회귀 | 매우 낮음 | 높음 | Wave 3에서 993+ TC 전체 회귀 테스트 실행. 조건부 분기만 추가하므로 기존 경로는 미변경 |
| 4 | v0.38.0 preview에서 기능 플래그 의미 변경 | 낮음 | 낮음 | 기능 플래그는 `isVersionAtLeast('0.37.0')` 기반이므로 v0.38.0에서도 true. v0.38.0 마이그레이션 시 별도 플래그 추가 |

### 7.2 Rollback Strategy (롤백 전략)

각 Wave는 독립 커밋. `git revert <commit>`으로 개별 Wave 롤백 가능.

| Wave | Rollback | Side Effects |
|------|----------|--------------|
| Wave 1 | `git revert <W1-commit>` | 기능 플래그 제거, testedVersions 복원. Wave 2 코드가 플래그를 참조하므로 Wave 2도 함께 롤백 필요 |
| Wave 2 | `git revert <W2-commit>` | 최적화 제거, 기존 방어 코드 복원. 기능 오류 없음 (기존 동작으로 복귀) |
| Wave 3 | `git revert <W3-commit>` | 테스트 제거. 프로덕션 영향 없음 |

### 7.3 Test Strategy (테스트 전략)

| Layer | Method | Coverage |
|-------|--------|----------|
| Unit | tc105 확장: v0.37.0+ 기능 플래그 8개 경계값 테스트 | 기능 플래그 정확성 |
| Unit | tc111 확장: ensureAgentsEnabled v0.37.0+ 스킵 동작 | 최적화 코드 정확성 |
| Regression | 전체 993+ TC 실행 | 기존 기능 무파손 확인 |
| Manual | Gemini CLI v0.37.1에서 bkit 세션 시작 -> 에이전트 정상 활성화 확인 | E2E 검증 |

### 7.4 Backward Compatibility (하위 호환성)

| Component | v0.35.x | v0.36.x | v0.37.x | 호환성 |
|-----------|---------|---------|---------|--------|
| ensureAgentsEnabled | 실행 (enableAgents undefined) | 실행 (enableAgents false) | **스킵** (enableAgents true) | 모두 정상 |
| isJITMode | true (JIT 활성) | true (JIT 활성) | **false** (JIT 비활성) | 모두 정상 |
| 기능 플래그 | v0.35.0+ true | v0.36.0+ true | v0.37.0+ true | 누적 추가 |

---

## 8. Deferred Items -- v2.1.0+ Backlog (보류 항목)

| Feature | Effort | Priority | Deferral Reason | Trigger |
|---------|--------|----------|-----------------|---------|
| Plan Mode modelRouting 통합 | 2h | P2 | CLI Plan Mode와 PDCA Plan 단계의 인터페이스 미확인. 사용자 비용 최적화 요구 없음 | 비용 최적화 요청 시 |
| memoryBoundaryMarkers 활용 | 1h | P2 | monorepo 사용 사례 없음 | monorepo 환경 지원 요구 시 |
| Project Memory Scope 연계 | 1h | P2 | 단일 프로젝트 운용 중 | 다중 프로젝트 운용 시 |
| Chapters PDCA 연동 | 1.5h | P3 | Chapters 훅 인터페이스 미확인 | CLI Chapters API 안정화 후 |
| Secret Lockdown 문서화 | 0.5h | P3 | 현재 보안 가이드에 포함 가능하나 긴급성 없음 | 보안 감사 시 |
| hasEnableAgentsDefaultFalse 리네이밍 | 0.5h | P3 | tc111 5개 TC가 의존. 리네이밍 비용 > 이점 | minGeminiCliVersion >= 0.37.0 시 |

---

## 9. Strategy B Validation History (전략 B 검증 이력)

| Migration | Version | Weighted Score | YAGNI Savings | Variant | Outcome |
|-----------|---------|---------------|---------------|---------|---------|
| 1st | v0.31.0 | 7.8 | ~50% | B | Completed |
| 2nd | v0.35.0 | 7.9 | 42% | B -> B' (Stable 후) | Completed |
| 3rd | v0.36.0 Phase 1 | 7.85 | 81% | B | Completed (100% Gap Match) |
| 4th | v0.36.0 Phase 2 | 7.85 | 67% | B | Completed |
| **5th** | **v0.37.1** | **8.05** | **71%** | **B'** | **This Plan** |

---

## 10. Approval Criteria

### Automated Evaluation (L4 Auto)

| Criterion | Result |
|-----------|--------|
| P0/P1 Critical issues | None (Breaking Change 0건) |
| Strategy consistency | B' (5th application, B' variant justified by 0 breaking changes) |
| YAGNI savings > 50% | 71% (pass) |
| Backward compatibility | All changes are additive or conditional |
| Risk level | Low (조건부 분기만 추가, 기존 로직 미변경) |
| Estimated effort < 4h | 2.3h (pass) |
| **Decision** | **Approved** |

---

## Appendix A: Impact Analysis Cross-Reference

| Impact Analysis Section | Plan Coverage |
|------------------------|---------------|
| Section 1.1 (enableAgents) | Wave 2: W2-1 (조건부 스킵) |
| Section 1.2 (jitContext) | Wave 2: W2-2 (isJITMode 정확성) |
| Section 1.3 (compactToolOutput) | N/A (영향 없음, 수정 불필요) |
| Section 5.1 (version.js 기능 플래그) | Wave 1: W1-2, W1-3 |
| Section 6.1 (bkit.config.json) | Wave 1: W1-1 |
| Section 8 (기능 개선 기회) | Deferred (Section 8) |
| Section 9 (v0.38 대비) | Section 4 (선제 대응 평가) |

## Appendix B: v0.38.0 Watch List

v0.38.0 stable 릴리스 시 즉시 Phase 1 Research를 시작해야 하는 항목:

| # | 항목 | 예상 영향도 | bkit 위험 영역 |
|---|------|-----------|---------------|
| 1 | ContextCompressionService | High | pre-compress.js, PDCA 상태 스냅샷 보존 |
| 2 | Background Memory Service | High | 38개 수동 관리 스킬 네이밍 충돌 |
| 3 | Skill subagent 주입 | Medium | 토큰 낭비, 스킬 동작 간섭 |
| 4 | BeforeModel e2e 전파 | Positive | before-model.js 모델 라우팅 안정성 향상 |
| 5 | Subagent Workspace Scoping | Medium | 에이전트 격리 강화 (긍정적이나 검증 필요) |
