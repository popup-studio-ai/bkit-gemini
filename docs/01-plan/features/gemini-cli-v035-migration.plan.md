# Gemini CLI v0.35.0 Migration Plan

> **Summary**: bkit v2.0.0 -- Gemini CLI v0.34.0 -> v0.35.0 호환성 확보 및 선택적 기능 활용
>
> **Feature**: gemini-cli-v035-migration
> **Author**: migration-strategist agent
> **Created**: 2026-03-21
> **Updated**: 2026-03-23
> **Status**: In Progress (Wave 1 ✅, Wave 2 부분 ✅, P0 modes 검증 미착수)
> **Method**: Plan-Plus (Phase 1 Research + Phase 2 Impact Analysis 기반)
> **Research**: [gemini-cli-v035-research.md](../research/gemini-cli-v035-research.md)
> **Impact Analysis**: [gemini-cli-v035-impact.analysis.md](../../03-analysis/gemini-cli-v035-impact.analysis.md)
> **Prior Art**: [gemini-cli-031-migration.plan.md](gemini-cli-031-migration.plan.md) (v0.31.0 마이그레이션 패턴 참조)

---

## 1. Intent Analysis (의도 분석)

### 1.1 WHY: 이 마이그레이션이 필요한 이유

**Primary: v0.35.0 Stable 릴리스 대비**

Gemini CLI v0.35.0 Stable이 2026-03-25 (화요일)에 예상됨. `npm install -g @google/gemini-cli`를 실행하는 모든 사용자가 v0.35.0을 받게 됨.

> **[2026-03-23 갱신]** npm dist-tags 실측: `latest`=0.34.0 (v0.35.0 stable 미발행). `testedVersions`에 "0.35.0" 추가 완료. Feature Gate 7개 등록 완료. 잔여 작업은 P0 `modes` 검증 + Wave 3 실제 테스트.

**Secondary: JIT Context Loading 기본화 대응**

v0.35.0의 가장 큰 Breaking Change는 JIT Context Loading 기본화. GEMINI.md의 `@` import 2개(`@.gemini/context/commands.md`, `@.gemini/context/core-rules.md`)가 lazy 로딩으로 전환되어 첫 번째 모델 호출 전에 로딩되지 않을 수 있음. 이것이 bkit의 핵심 컨텍스트 파이프라인에 영향을 줄 수 있는지 검증이 필요.

**Tertiary: Feature Gate 기반 확보**

`version.js`에 v0.35.0 Feature Gate가 없으면, 향후 JIT Context, 도구 격리, 병렬 스케줄러 등의 기능을 조건부로 활용하는 것이 불가능. 이전 v0.31.0 마이그레이션에서도 동일한 패턴(Feature Gate 선행 추가)이 검증됨.

**한 문장 비즈니스 케이스**: v0.35.0 Stable 릴리스 전에 호환성을 보증하고, JIT Context Loading 변경에 대한 안전성을 확인하여, bkit 사용자의 무중단 업그레이드를 보장.

### 1.2 핵심 목적 판정

| 질문 | 답변 |
|------|------|
| 단순 호환성 유지? | **Yes** -- 핵심 목적. Breaking Change 대응 필수. |
| 기능 고도화? | **부분적** -- `deny_message`는 가치 대비 비용이 낮아 포함 가치 있음. |
| 아키텍처 개선? | **No** -- 아키텍처 변경 불필요. 현재 구조가 v0.35.0 변경을 충분히 수용. |

### 1.3 사용자 가치 분석

| 가치 | v0.35.0 기여 | 중요도 |
|------|-------------|--------|
| **안정성** | JIT Context Loading 호환성 확인 -> 기존 기능 정상 동작 보장 | 최우선 |
| **성능** | JIT/병렬 스케줄러 자동 적용 -> 사용자 코드 변경 없이 속도 향상 | 자동 |
| **CJK 입력** | 한국어 입력 안정성 개선 -> CLI 자동 적용, bkit 코드 변경 없음 | 자동 |
| **보안** | `deny_message`로 정책 거부 시 UX 개선 | P1 가치 |

### 1.4 시간/리소스 제약

| 항목 | 상태 |
|------|------|
| v0.35.0 Stable 예상일 | 2026-03-25 (4일 후) |
| Critical Breaking Change | 1건 (JIT Context Loading) |
| 가용 시간 | 03-21 ~ 03-24 (Stable 전 준비 + Stable 후 검증) |
| v0.34.0 마이그레이션 완료? | Yes (bkit v2.0.0에 반영 완료) |

---

## 2. Strategy Alternatives (전략 비교)

### Strategy A: Minimal Patch (최소 수정)

**범위**: Critical 2건 + JIT 호환성 검증만

| 작업 | 파일 | 공수 |
|------|------|------|
| version.js Feature Gate 3개 추가 | `lib/gemini/version.js` | 0.5h |
| bkit.config.json testedVersions 추가 | `bkit.config.json` | 0.3h |
| GEMINI.md `@` import JIT 호환성 수동 테스트 | GEMINI.md | 1h |
| **합계** | **3 files** | **1.8h** |

| 장점 | 단점 |
|------|------|
| 위험 최소, 가장 빠른 완료 | v0.35.0 신규 TOML 필드 미지원 |
| 검증 범위 좁아 확신 높음 | import-resolver.js 캐시 중복 방치 |
| v0.31.0 마이그레이션에서 검증된 패턴 | hooks 정합성 미검증 |

**리스크**: 낮음
**추천도**: 시간 부족 시

---

### Strategy B: Targeted Upgrade (핵심 대응 + 선별 기능) -- RECOMMENDED

**범위**: Critical 2건 + High 5건 중 실제 필요한 항목 + `deny_message` TOML 필드

| 작업 | 파일 | 공수 |
|------|------|------|
| version.js Feature Gate 추가 (7개) | `lib/gemini/version.js` | 0.5h |
| getBkitFeatureFlags() 확장 | `lib/gemini/version.js` | 0.3h |
| bkit.config.json testedVersions + JIT 설정 | `bkit.config.json` | 0.5h |
| GEMINI.md `@` import JIT 호환성 검증 + 필요시 수정 | GEMINI.md | 1.5h |
| import-resolver.js JIT 모드 캐시 조정 | `lib/gemini/import-resolver.js` | 1h |
| policy.js `deny_message` 필드 지원 | `lib/gemini/policy.js` | 1.5h |
| hooks.js BeforeAgent/AfterAgent 정합성 검증 | `lib/gemini/hooks.js` | 1h |
| tc82 Feature Gate 테스트 추가 | `tests/suites/tc82-gemini-version.js` | 1h |
| tc84 TOML `deny_message` 테스트 추가 | `tests/suites/tc84-gemini-policy.js` | 0.5h |
| **합계** | **9 files** | **7.8h** |

| 장점 | 단점 |
|------|------|
| 모든 Critical/High 해결 | Strategy A보다 변경 범위 넓음 |
| `deny_message`로 즉시 UX 개선 | policy.js 변경 테스트 필요 |
| v0.31.0 마이그레이션 패턴 재사용 | JIT 검증은 v0.35.0 Stable 후 최종 확인 필요 |
| YAGNI 원칙 준수 (필요한 것만) | |
| 테스트 커버리지 확보 | |

**리스크**: 낮음~중간
**추천도**: 기본 추천

---

### Strategy C: Comprehensive Upgrade (전면 고도화)

**범위**: 모든 12건 + 기능 개선 기회 8건

| 작업 | 파일 | 공수 |
|------|------|------|
| Strategy B 전체 | 9 files | 7.8h |
| spawn-agent-server SandboxManager 대응 | `mcp/spawn-agent-server.js` | 2h |
| 도구 격리 환경변수 전달 | `mcp/spawn-agent-server.js` | 1h |
| tc101-v035-features 테스트 스위트 신규 생성 | `tests/suites/tc101-v035-features.js` | 4h |
| TOML 정책 파일 재생성 (deny_message 포함) | 3 TOML files | 1h |
| 커스텀 키바인딩 번들 생성 | `keybindings.json` | 1h |
| gemini-cli-learning 스킬 업데이트 | SKILL.md | 1h |
| pre-compress.js JIT 스냅샷 검증 | `hooks/scripts/pre-compress.js` | 1h |
| `--admin-policy` Enterprise 통합 | 설정 + 문서 | 1.5h |
| **합계** | **18+ files** | **20.3h** |

| 장점 | 단점 |
|------|------|
| v0.35.0 기능 완전 활용 | 과잉 설계 위험 |
| 포괄적 테스트 커버리지 | v0.35.0 Stable 전 완료 불가 |
| Enterprise 기능 강화 | 키바인딩/스킬 업데이트는 YAGNI |
| | SandboxManager 동작이 Stable 전 불확실 |

**리스크**: 높음
**추천도**: 충분한 시간과 v0.35.0 Stable 확인 후에만

---

### Evaluation Matrix

| 기준 (가중치) | Strategy A | Strategy B | Strategy C |
|---------------|-----------|-----------|-----------|
| 위험도 (30%) | 낮음 [9] | 낮음~중간 [7] | 높음 [4] |
| 작업량 (25%) | 1.8h [10] | 7.8h [7] | 20.3h [3] |
| 가치 창출 (25%) | 낮음 [4] | 중간~높음 [8] | 높음 [9] |
| 장기 이점 (20%) | 낮음 [3] | 중간 [7] | 높음 [9] |
| **가중 합계** | **6.65** | **7.25** | **6.10** |

---

## 3. Recommended Strategy (추천 전략)

### Strategy B: Targeted Upgrade

**근거**:

1. **검증된 패턴 재사용**: v0.31.0 마이그레이션에서 "Feature Gate 선행 + 설정 동기화 + 선별 기능 채택" 패턴이 성공적이었음 (Strategy B 선택, 8.7h, 무사 완료). 동일 접근법을 v0.35.0에도 적용.

2. **YAGNI 기반 범위 결정**: Impact Analysis의 12건 중 실제로 코드 수정이 필요한 항목은 5건. 나머지 7건은 "검증만 필요" 또는 "자동 적용"이므로 Strategy C의 20h는 과잉.

3. **deny_message 포함 근거**: 구현 난이도가 낮고(기존 `convertToToml()` 패턴에 필드 1개 추가), Starter 레벨 사용자의 UX를 즉시 개선하므로 가치 대비 비용이 매우 낮음.

4. **JIT 영향은 제한적**: 실제 코드 분석 결과, GEMINI.md의 `@` import는 Gemini CLI가 해석하며, bkit의 `import-resolver.js`는 내부 context file 조합에만 사용됨. session-start hook의 `context` 출력은 `@` import와 독립 경로이므로, JIT 기본화의 실질적 영향은 캐시 TTL 조정 수준에 그침.

5. **v0.35.0 Stable 전 완료 가능**: 7.8h 공수로 3-25 Stable 전 준비 완료 가능.

---

## 4. YAGNI Review

### 포함 (실제 필요)

| # | 항목 | 이유 |
|---|------|------|
| 1 | version.js Feature Gate 추가 | 모든 v0.35.0 기능 분기의 전제 조건. 미추가 시 향후 모든 기능 활용 불가. |
| 2 | bkit.config.json testedVersions | Docs = Code 원칙. 호환성 선언 없으면 사용자에게 거짓 정보 제공. |
| 3 | GEMINI.md `@` import JIT 검증 | 핵심 Breaking Change. 미검증 시 컨텍스트 로딩 실패 위험. |
| 4 | import-resolver.js 캐시 조정 | CLI 캐시와 bkit 캐시 중복 시 불필요한 I/O. JIT 모드 감지 후 TTL 연장으로 간단히 해결. |
| 5 | policy.js `deny_message` 지원 | 낮은 구현 비용(필드 1개 추가) 대비 높은 사용자 가치(거부 사유 표시). |
| 6 | hooks.js 정합성 검증 | v0.35.0 BeforeAgent/AfterAgent 버그 수정의 영향 확인. 기존 루프 가드/이벤트 핸들러 동작 검증. |
| 7 | 테스트 추가 | 기존 tc82, tc84에 v0.35.0 TC 추가. 회귀 방지 필수. |

### 제외 (있으면 좋지만 불필요)

| # | 항목 | 제외 이유 |
|---|------|-----------|
| 1 | tc101-v035-features 신규 스위트 | 기존 tc82, tc84에 TC를 추가하는 것으로 충분. 별도 스위트는 유지보수 부담만 증가. |
| 2 | spawn-agent-server SandboxManager 대응 | Impact Analysis에서 "직접 영향 없음 가능성 높음"으로 판정. Hook command는 CLI 내부 메커니즘이므로 SandboxManager 대상 외. v0.35.0 Stable에서 실제 문제 발생 시 대응해도 충분. |
| 3 | 커스텀 키바인딩 번들 | 파워 유저 편의 기능. 현재 사용자 요청 없음. |
| 4 | gemini-cli-learning 스킬 업데이트 | 교육 콘텐츠는 Stable 릴리스 후 업데이트해도 지장 없음. |
| 5 | `--admin-policy` Enterprise 통합 | Enterprise 채택이 활발해지면 필요하나, 현재는 미사용. |
| 6 | `disableAlwaysAllow` 자동 설정 | 기능 자체는 CLI 설정이며, bkit이 자동 설정하는 것은 사용자 자율성 침해 가능. |
| 7 | pre-compress.js JIT 스냅샷 검증 | context-fork.js가 PDCA 상태만 스냅샷하므로 JIT 컨텍스트 로딩과 무관. |
| 8 | TOML 정책 파일 재생성 | 기존 정책 파일은 정상 작동. `deny_message`는 신규 생성 시에만 포함하면 됨 (기존 파일 강제 재생성 불필요). |
| 9 | `interactive` TOML 필드 | CI/CD 환경 분리는 현재 bkit 사용 패턴에서 불필요. |
| 10 | `mcpName` TOML 필드 | MCP 서버 단위 정책은 현재 1개 MCP 서버만 사용하므로 불필요. 단, 공식 문서에서 "FQN보다 robust" 명시적 권장 → P2로 재분류 권장. |

### MVM (Minimum Viable Migration)

**2.8h로 완료 가능한 최소 범위**:
1. version.js Feature Gate 7개 추가 (0.5h)
2. bkit.config.json testedVersions 업데이트 (0.3h)
3. GEMINI.md JIT 호환성 수동 테스트 (1h)
4. tc82 테스트 추가 (1h)

이것만으로도 v0.35.0 호환성은 보증됨. Strategy B의 나머지 항목(import-resolver, policy, hooks)은 v0.35.0 Stable 릴리스 후 1주 내에 완료해도 사용자 영향 없음.

---

## 5. Implementation Roadmap (구현 로드맵)

### Wave 1: Critical (2026-03-21) — ✅ 완료

| # | 작업 | 영향 파일 | 예상 공수 | 의존성 |
|---|------|-----------|-----------|--------|
| W1-1 | version.js Feature Gate 7개 추가 | `lib/gemini/version.js` | 0.5h | 없음 |
| W1-2 | getBkitFeatureFlags() v0.35.0 매핑 추가 | `lib/gemini/version.js` | 0.3h | W1-1 |
| W1-3 | bkit.config.json testedVersions, JIT 설정 | `bkit.config.json` | 0.5h | 없음 |

**Wave 1 합계**: 1.3h
**병렬 가능**: W1-1/W1-2와 W1-3은 독립적이므로 병렬 진행 가능.

#### W1-1 상세: version.js Feature Gate

```javascript
// getFeatureFlags()에 추가:

// v0.35.0+
hasJITContextLoading: isVersionAtLeast('0.35.0'),
hasToolIsolation: isVersionAtLeast('0.35.0'),
hasParallelToolScheduler: isVersionAtLeast('0.35.0'),
hasAdminPolicy: isVersionAtLeast('0.35.0'),
hasDisableAlwaysAllow: isVersionAtLeast('0.35.0'),
hasCryptoVerification: isVersionAtLeast('0.35.0'),
hasCustomKeybindings: isVersionAtLeast('0.35.0'),
```

#### W1-2 상세: getBkitFeatureFlags()

```javascript
// getBkitFeatureFlags()에 추가:
canUseJITContext: flags.hasJITContextLoading,
canUseToolIsolation: flags.hasToolIsolation,
canUseParallelScheduler: flags.hasParallelToolScheduler,
canUseAdminPolicy: flags.hasAdminPolicy,
```

#### W1-3 상세: bkit.config.json

```json
"compatibility": {
  "minGeminiCliVersion": "0.34.0",
  "testedVersions": ["0.34.0", "0.35.0"],
  ...
}
```

`jitContext`, `toolIsolation` 등의 nested 설정은 **추가하지 않음** (YAGNI -- Feature Gate로 충분, 별도 설정 객체는 과잉 설계).

---

### Wave 2: High Priority (2026-03-22~23) — 🟡 부분 완료

| # | 작업 | 영향 파일 | 예상 공수 | 상태 |
|---|------|-----------|-----------|------|
| W2-1 | GEMINI.md `@` import JIT 호환성 검증 | `GEMINI.md` | 1.5h | ⏳ 미착수 |
| W2-2 | import-resolver.js JIT 모드 캐시 전략 | `lib/gemini/import-resolver.js` | 1h | ✅ 완료 |
| W2-3 | policy.js `deny_message` 필드 지원 | `lib/gemini/policy.js` | 1.5h | ✅ 완료 |
| **W2-4** | **⚠️ [신규 P0] `modes` 값 검증 (`plan_mode` vs `plan`)** | `lib/gemini/policy.js` 332행 | 0.5h | 🔴 미착수 |

> **[2026-03-23 갱신]** W2-4는 Phase 1 심층 조사에서 발견된 P0 이슈. `policy.js`의 `modes: ['plan_mode']`가 공식 문서 유효값 (`default`/`autoEdit`/`plan`/`yolo`)과 불일치. Gemini CLI 소스 또는 실제 테스트로 검증 후 수정 필요.

**Wave 2 합계**: 4.5h (2건 완료, 2건 잔여)
**병렬 가능**: W2-1 (JIT 검증)과 W2-4 (modes 검증)은 독립적.

#### W2-1 상세: GEMINI.md JIT 검증

**검증 항목**:
1. v0.35.0 preview.2에서 `@.gemini/context/commands.md`와 `@.gemini/context/core-rules.md`가 세션 시작 시 로딩되는지 확인
2. JIT 모드에서 첫 번째 모델 호출 전에 `@` import 내용이 컨텍스트에 포함되는지 확인
3. session-start hook의 `context` 출력과 `@` import의 로딩 순서/중복 확인

**예상 결론**: Impact Analysis에 따르면 session-start hook의 context 주입은 `@` import와 독립 경로. GEMINI.md 자체의 `@` import는 CLI가 관리하므로 bkit 코드 수정 불필요할 가능성 높음. 그러나 "No Guessing" 원칙에 따라 실제 테스트로 확인 필수.

**수정 시나리오 (만약 필요 시)**:
- GEMINI.md의 `@` import를 session-start hook에서 명시적으로 주입하는 방식으로 전환
- 또는 `experimental.jitContext = false` 설정으로 eager 로딩 유지

#### W2-2 상세: import-resolver.js

```javascript
// 현재
const CACHE_TTL = 5000; // 5 seconds

// 변경: JIT 모드에서는 CLI가 캐시를 관리하므로 TTL 연장
function getCacheTTL() {
  try {
    const { getFeatureFlags } = require('./version');
    if (getFeatureFlags().hasJITContextLoading) {
      return 30000; // 30s -- CLI manages primary cache
    }
  } catch { /* fallback */ }
  return 5000; // 5s -- pre-JIT behavior
}
```

**주의**: `import-resolver.js`는 bkit 내부 context file 조합용이며, GEMINI.md `@` import 해석은 Gemini CLI 자체 담당. 따라서 이 수정은 "중복 캐시 방지" 최적화이지 "필수 수정"은 아님.

#### W2-3 상세: policy.js `deny_message` 지원

```javascript
// LEVEL_POLICY_TEMPLATES 수정 예시 (Starter):
{ toolName: 'run_shell_command', commandPrefix: 'rm',
  decision: 'deny', priority: 100,
  deny_message: 'bkit blocks rm commands for safety. Use file manager instead.' },

// convertToToml() 수정: deny 규칙에 deny_message 직렬화
if (rule.deny_message) {
  lines.push(`deny_message = "${escapeTomlString(rule.deny_message)}"`);
}

// validateTomlStructure() 수정: deny_message 허용
```

---

### Wave 3: Verification (2026-03-25~26, Stable 릴리스 후)

| # | 작업 | 영향 파일 | 예상 공수 | 의존성 |
|---|------|-----------|-----------|--------|
| W3-1 | hooks.js BeforeAgent/AfterAgent 정합성 검증 | `lib/gemini/hooks.js` | 1h | v0.35.0 Stable |
| W3-2 | tc82 v0.35.0 Feature Gate 테스트 | `tests/suites/tc82-gemini-version.js` | 1h | W1-1 |
| W3-3 | tc84 `deny_message` TOML 테스트 | `tests/suites/tc84-gemini-policy.js` | 0.5h | W2-3 |

**Wave 3 합계**: 2.5h

#### W3-1 상세: hooks.js 검증

**검증 항목** (v0.35.0 Stable 환경에서):
1. `HOOK_EVENT_MAP`의 `BeforeAgent`/`AfterAgent` 매핑이 v0.35.0 이벤트와 일치하는지
2. `after-agent.js`의 `LOOP_GUARD_KEY`와 `MAX_REENTRY = 3` 동작이 v0.35.0 AfterAgent 호출 패턴에서 정상 작동하는지
3. `before-agent.js`의 event 객체 필드(`event.prompt`, `event.user_message`, `event.message`) 접근이 v0.35.0에서도 유효한지

**코드 수정 예상**: 없음 (방어적 접근 패턴이 이미 구현되어 있음). 문제 발견 시 hotfix.

#### W3-2 상세: tc82 테스트 추가

```javascript
// v0.35.0 Feature Gate 테스트
test('v0.35.0 feature flags', () => {
  process.env.GEMINI_CLI_VERSION = '0.35.0';
  version.resetCache();
  const flags = version.getFeatureFlags();
  expect(flags.hasJITContextLoading).toBe(true);
  expect(flags.hasToolIsolation).toBe(true);
  expect(flags.hasParallelToolScheduler).toBe(true);
  // v0.34.0 이전 동작 검증
  process.env.GEMINI_CLI_VERSION = '0.34.0';
  version.resetCache();
  const oldFlags = version.getFeatureFlags();
  expect(oldFlags.hasJITContextLoading).toBe(false);
});
```

---

### Summary Timeline

```
2026-03-21 (오늘)   : Wave 1 착수 + 완료 (1.3h)
2026-03-22~23       : Wave 2 작업 (4h)
2026-03-24          : 자체 QA, 코드 리뷰
2026-03-25 (예상)   : v0.35.0 Stable 릴리스
2026-03-25~26       : Wave 3 검증 (2.5h) -- Stable 환경 실테스트
2026-03-27          : 마이그레이션 완료 선언, CHANGELOG 업데이트
```

**총 예상 공수**: 7.8h (Impact Analysis의 20h 대비 61% 절감)

---

## 6. Risk Management (위험 관리)

### 6.1 식별된 위험

| # | 위험 | 가능성 | 영향 | 완화 방안 |
|---|------|--------|------|-----------|
| R1 | JIT에서 `@` import가 첫 모델 호출 전 미로딩 | 중간 | 높음 | W2-1에서 실제 테스트. 미로딩 시 session-start hook으로 명시적 주입 전환 |
| R2 | v0.35.0 Stable이 preview.2와 다른 동작 | 낮음 | 중간 | Wave 3를 Stable 릴리스 후로 배치. preview와 Stable 차이 확인 |
| R3 | BeforeAgent/AfterAgent event 구조 변경 | 낮음 | 중간 | 현재 방어적 접근 패턴(`event.prompt \|\| event.user_message \|\| event.message`)이 보호. Wave 3에서 검증 |
| R4 | SandboxManager가 hook command 실행에 영향 | 낮음 | 중간 | YAGNI: 현재 미대응. 실제 문제 발생 시 환경변수 전달로 해결 가능 |
| R5 | import-resolver.js 캐시 변경이 기존 동작 깨뜨림 | 낮음 | 낮음 | TTL만 변경하므로 기능적 차이 없음. 기존 5초도 정상 동작 |

### 6.2 Rollback Strategy

**단계적 롤백**:

1. **코드 롤백**: `git revert` 기반. 모든 변경은 독립적 commit으로 관리하여 개별 롤백 가능.
   - Wave 1: `feat: add v0.35.0 feature gates` (독립 revert 가능)
   - Wave 2: `feat: JIT cache + deny_message` (독립 revert 가능)

2. **설정 롤백**: `bkit.config.json`의 `testedVersions`에서 `"0.35.0"` 제거만으로 호환성 선언 철회 가능. 코드 자체는 하위 호환이므로 기능적 문제 없음.

3. **v0.34.0 하위 호환 유지**: 모든 v0.35.0 전용 코드는 Feature Gate로 보호됨. `isVersionAtLeast('0.35.0')`가 false를 반환하면 기존 v0.34.0 동작 그대로 유지.

### 6.3 Worst-Case Scenario

**만약 v0.35.0이 bkit과 근본적으로 비호환이면?**

1. `bkit.config.json`에서 `minGeminiCliVersion`을 `"0.34.0"`으로 유지
2. `testedVersions`에 `"0.35.0"`을 추가하지 않음
3. session-start hook에서 v0.35.0 감지 시 경고 메시지 출력
4. 사용자에게 `npm install -g @google/gemini-cli@0.34.0`으로 다운그레이드 안내

**가능성**: 매우 낮음. v0.34.0 -> v0.35.0은 JIT 기본화 외에 공개 API 변경 없음.

---

## 7. Backward Compatibility (하위 호환성 전략)

### 7.1 기본 원칙

**모든 v0.35.0 전용 코드는 Feature Gate로 보호한다.**

```javascript
// 패턴: Feature Gate 보호
if (getFeatureFlags().hasJITContextLoading) {
  // v0.35.0+ 전용 코드
} else {
  // v0.34.0 이하 기존 동작
}
```

### 7.2 호환성 매트릭스

| 항목 | v0.34.0 | v0.35.0 |
|------|---------|---------|
| Feature Gate | 기존 17개 true | 기존 17개 + 신규 7개 true |
| JIT Context | eager 로딩 (기존) | lazy 로딩 (캐시 TTL 30s) |
| `deny_message` TOML | 필드 무시됨 (CLI가 미지원) | 필드 표시됨 |
| GEMINI.md `@` import | 즉시 로딩 | JIT 로딩 (검증 필요) |
| import-resolver.js | TTL 5s | TTL 30s (JIT 모드) |
| hooks.js | 기존 동작 | 기존 동작 (정합성 검증) |

### 7.3 하위 호환 보장 항목

- `getFeatureFlags()`: 기존 17개 플래그 반환값 불변
- `getBkitFeatureFlags()`: 기존 매핑 불변, 신규 매핑만 추가
- `convertToToml()`: 기존 TOML 출력 형식 유지, `deny_message`는 존재 시에만 추가
- `validateTomlStructure()`: 기존 검증 로직 유지, `deny_message` 허용만 추가
- `LEVEL_POLICY_TEMPLATES`: 기존 규칙 불변, `deny_message` 필드만 추가
- `import-resolver.js`: 기존 5s TTL 동작 유지 (JIT 미감지 시)

---

## 8. Test Strategy (테스트 전략)

### 8.1 기존 테스트 활용

| 테스트 스위트 | 역할 | 변경 |
|-------------|------|------|
| tc82-gemini-version.js | Feature Gate 검증 | v0.35.0 TC 추가 |
| tc84-gemini-policy.js | TOML 정책 생성 검증 | `deny_message` TC 추가 |
| tc79-v034-features.js | v0.34.0 호환성 회귀 | 변경 없음 (회귀 방지) |

### 8.2 테스트 시나리오

| # | 시나리오 | 예상 결과 | 우선순위 |
|---|---------|-----------|---------|
| T-01 | `GEMINI_CLI_VERSION=0.35.0`에서 Feature Gate | 24개 플래그 (17 기존 + 7 신규) 모두 true | P0 |
| T-02 | `GEMINI_CLI_VERSION=0.34.0`에서 Feature Gate | 기존 17개 true, 신규 7개 false | P0 |
| T-03 | `convertToToml()` deny 규칙에 `deny_message` 포함 | TOML에 `deny_message = "..."` 출력 | P1 |
| T-04 | `convertToToml()` allow/ask 규칙에 `deny_message` 없음 | `deny_message` 미출력 | P1 |
| T-05 | `validateTomlStructure()` with `deny_message` | true 반환 | P1 |
| T-06 | `generateLevelPolicy('Starter')` | `deny_message` 포함된 TOML 생성 | P1 |
| T-07 | v0.35.0 실환경에서 GEMINI.md `@` import 로딩 | 컨텍스트 정상 포함 | P0 (Stable 후) |
| T-08 | v0.35.0 실환경에서 BeforeAgent hook 정상 동작 | 이벤트 수신 + 처리 정상 | P1 (Stable 후) |
| T-09 | import-resolver.js JIT 모드 캐시 TTL | 30s TTL 적용 | P2 |

### 8.3 테스트 실행 순서

```
1. Wave 1 완료 후: T-01, T-02 (단위 테스트)
2. Wave 2 완료 후: T-03 ~ T-06, T-09 (단위 테스트)
3. v0.35.0 Stable 후: T-07, T-08 (통합 테스트)
4. 전체 회귀: tc79, tc80, tc81, tc82, tc84 전체 실행
```

---

## 9. Files to Modify (수정 대상)

### 수정 파일 (9개)

| # | File | Wave | Change Type |
|---|------|------|-------------|
| 1 | `lib/gemini/version.js` | W1 | Feature Gate 추가 |
| 2 | `bkit.config.json` | W1 | testedVersions 추가 |
| 3 | `GEMINI.md` | W2 | 검증 (수정 가능성 낮음) |
| 4 | `lib/gemini/import-resolver.js` | W2 | 캐시 TTL 조정 |
| 5 | `lib/gemini/policy.js` | W2 | `deny_message` 지원 |
| 6 | `lib/gemini/hooks.js` | W3 | 검증 (수정 가능성 낮음) |
| 7 | `tests/suites/tc82-gemini-version.js` | W3 | TC 추가 |
| 8 | `tests/suites/tc84-gemini-policy.js` | W3 | TC 추가 |
| 9 | `CHANGELOG.md` | W3 | 마이그레이션 기록 |

### 수정하지 않는 파일 (YAGNI)

| File | Reason |
|------|--------|
| `mcp/spawn-agent-server.js` | SandboxManager 영향 미확인, 실제 문제 발생 시 대응 |
| `hooks/hooks.json` | 구조 변경 없음 |
| `hooks/scripts/*.js` | 방어적 접근 패턴 이미 구현, 검증만 |
| `lib/gemini/context-fork.js` | JIT와 독립적 (PDCA 상태 스냅샷만 관리) |
| `lib/gemini/tools.js` | v0.35.0 신규 빌트인 도구 미확인 |
| `agents/*.md` | 선언적 정의, CLI 비의존 |
| `skills/*/SKILL.md` | 선언적 정의, CLI 비의존 |
| `policies/*.toml` | 기존 파일 강제 재생성 불필요 |

---

## 10. Summary Decision Matrix

| 결정 사항 | 선택 | 근거 |
|-----------|------|------|
| 전략 | Strategy B (Targeted Upgrade) | 가치/비용 최적, 검증된 패턴 |
| 총 공수 | 7.8h (MVM 2.8h + 추가 5h) | Impact Analysis 20h 대비 61% 절감 |
| Wave 수 | 3개 (Critical/High/Verification) | Stable 릴리스 전후 분리 |
| YAGNI 절감 | 10항목 제외 | 실질적 필요 vs "있으면 좋은 것" 구분 |
| 하위 호환 | Feature Gate 보호 | 모든 v0.35.0 코드를 조건부 실행 |
| 롤백 전략 | 독립 commit + 설정 롤백 | 개별 변경 revert 가능 |
| `deny_message` 포함 | Yes | 낮은 비용, 높은 UX 가치 |
| `interactive`/`mcpName` 포함 | No | 현재 사용 패턴에서 불필요 |
| SandboxManager 대응 | No (관찰) | 실질 영향 미확인, 문제 시 대응 |

---

*migration-strategist agent | 2026-03-21*
*Based on gemini-cli-v035-research.md and gemini-cli-v035-impact.analysis.md*
*Prior art: gemini-cli-031-migration.plan.md (Strategy B pattern validated)*
