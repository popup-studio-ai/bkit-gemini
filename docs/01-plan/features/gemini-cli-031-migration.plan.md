# Plan: bkit v1.5.6 - Gemini CLI v0.31.0 Migration

> **Summary**: bkit v1.5.5 → v1.5.6 패치. Gemini CLI v0.31.0 stable 호환성 확보 및 신규 기능 기반 마련.
>
> **Feature**: gemini-cli-031-migration
> **Author**: CTO Team (Product Manager + Architects)
> **Created**: 2026-02-28
> **Status**: Draft
> **Method**: Plan-Plus (CTO Team 분석 보고서 기반)
> **Analysis Source**: [gemini-cli-031-upgrade-comprehensive-analysis.report.md](../../04-report/gemini-cli-031-upgrade-comprehensive-analysis.report.md)

---

## 1. Intent Discovery

### 1.1 WHY: 이 마이그레이션이 필요한 이유

**Primary: v0.31.0이 현재 stable 최신 버전**

Gemini CLI v0.31.0이 2026-02-27에 stable로 릴리즈됨. `npm install -g @google/gemini-cli`를 실행하는 모든 사용자가 v0.31.0을 받게 됨. bkit v1.5.5의 `testedVersions`에는 v0.30.0까지만 포함되어 있어, v0.31.0 사용자에 대한 호환성이 공식적으로 보증되지 않는 상태.

**Secondary: Version Detector가 v0.31.0 기능을 인식하지 못함**

`version-detector.js`의 `getFeatureFlags()`가 9개 플래그만 반환 (v0.30.0까지). v0.31.0의 핵심 기능들(RuntimeHook Functions, Project-level Policy, Tool Annotations, Browser Agent, MCP Progress 등)에 대한 feature flag가 없어, 향후 기능 활용 시 버전 분기가 불가능.

**Tertiary: Policy Engine 확장 기회**

v0.31.0의 Project-level Policy (Tier 3), MCP wildcard 지원은 bkit의 레벨별 자동 정책 생성 기회를 제공. 이 기반을 v1.5.6에서 마련해야 v1.6.0에서의 본격적 활용이 가능.

**한 문장 비즈니스 케이스**: bkit v1.5.6 없이는, Gemini CLI v0.31.0 사용자의 호환성이 미보증이며, 향후 v1.6.0의 RuntimeHook/SDK/Plan Mode 통합을 위한 버전 분기 기반이 부재.

### 1.2 WHO: 영향 받는 대상

| Stakeholder | Impact | Severity |
|---|---|:---:|
| **bkit users on v0.31.0** | testedVersions 미포함, feature flag 미지원 | Medium |
| **bkit developers** | v0.31.0 기능 활용 불가 (버전 분기 없음) | High |
| **v0.30.0 이하 사용자** | 무영향 (하위호환 100%) | None |
| **v1.6.0 개발자** | v0.31.0 feature flag 기반 부재 | High |

### 1.3 WHAT: 마이그레이션하지 않으면?

**즉시 (1주차)**:
- v0.31.0 사용자에 대한 공식 호환성 미보증
- `getFeatureFlags()`가 v0.31.0 기능을 감지하지 못함
- Policy Engine의 project-level 기능 미활용

**단기 (2-4주)**:
- v1.6.0 개발 시 모든 v0.31.0 기능에 대한 feature flag를 동시 추가해야 함 (작업량 증가)
- 경쟁 Extension이 v0.31.0 기능을 먼저 활용할 가능성

---

## 2. Scope Definition

### 2.1 v1.5.6 범위 (이번 패치)

| ID | Item | Priority | Type | Effort |
|:---:|---|:---:|:---:|:---:|
| M-01 | Version Detector v2: v0.31.0 feature flags 추가 | **P0** | Required | 1h |
| M-02 | bkit.config.json: testedVersions 업데이트 | **P0** | Required | 0.1h |
| M-03 | gemini-extension.json: version bump to 1.5.6 | **P0** | Required | 0.1h |
| M-04 | Policy Migrator: project-level policy 지원 | **P1** | Enhancement | 2h |
| M-05 | Policy Migrator: 레벨별 정책 템플릿 | **P1** | Enhancement | 2h |
| M-06 | Tool Registry: tool annotation 메타데이터 추가 | **P1** | Enhancement | 1h |
| M-07 | Hook System: RuntimeHook function 준비 (version-gated) | **P1** | Preparation | 1.5h |
| M-08 | Session Start: v1.5.6 버전 문자열 + 기능 업데이트 | **P0** | Required | 0.5h |
| M-09 | bkit-system/philosophy 문서 업데이트 | **P2** | Docs | 0.5h |

**총 예상 공수**: ~8.7h

### 2.2 v1.5.6 범위 외 (v1.6.0으로 이관)

| Item | Reason |
|---|---|
| RuntimeHook Function 실제 전환 | API 안정성 검증 필요 |
| Session SDK 통합 | SDK stable 릴리즈 대기 |
| Plan Mode ↔ PDCA 통합 | 별도 feature scope |
| Browser Agent 추가 | 별도 feature scope |
| MCP Progress Updates | spawn-agent-server 대규모 변경 |
| Extension Registry 등록 | 메타데이터 준비 후 |

---

## 3. Requirements

### 3.1 M-01: Version Detector v2

**현재 상태**: 9개 feature flags (v0.30.0까지)

```javascript
// 현재 (v1.5.5)
{
  hasPlanMode, hasPolicyEngine, hasExcludeToolsDeprecated,
  hasGemini3Default, hasSkillsStable, hasExtensionRegistry,
  hasSDK, hasGemini31Pro, hasApprovalMode
}
```

**요구사항**: 9개 신규 feature flags 추가

```javascript
// 추가 (v1.5.6)
{
  hasRuntimeHookFunctions: isVersionAtLeast('0.31.0'),
  hasBrowserAgent: isVersionAtLeast('0.31.0'),
  hasProjectLevelPolicy: isVersionAtLeast('0.31.0'),
  hasMcpProgress: isVersionAtLeast('0.31.0'),
  hasParallelReadCalls: isVersionAtLeast('0.31.0'),
  hasPlanModeCustomStorage: isVersionAtLeast('0.31.0'),
  hasToolAnnotations: isVersionAtLeast('0.31.0'),
  hasExtensionFolderTrust: isVersionAtLeast('0.31.0'),
  hasAllowMultipleReplace: isVersionAtLeast('0.31.0')
}
```

**제약사항**:
- 기존 9개 플래그는 수정 불가 (하위호환)
- 모든 신규 플래그는 `isVersionAtLeast()` 기반
- `@version` 주석 1.5.6으로 업데이트

### 3.2 M-02: bkit.config.json 업데이트

**요구사항**: `compatibility.testedVersions` 배열에 `"0.31.0"` 추가

```json
"testedVersions": ["0.29.0", "0.29.5", "0.29.7", "0.30.0-preview.3", "0.30.0", "0.31.0"]
```

**제약사항**: `version` 필드를 `"1.5.6"`으로 업데이트

### 3.3 M-03: gemini-extension.json 업데이트

**요구사항**: `version` 필드를 `"1.5.6"`으로 업데이트

**검토 사항**: `excludeTools` 필드의 v0.31.0 호환성 확인. v0.30.0에서 deprecated되었으나 bkit은 여전히 사용 중. v0.31.0에서 완전 제거되었는지 확인 필요.

### 3.4 M-04: Policy Migrator - Project-level Policy 지원

**현재 상태**: `generatePolicyFile()`이 `.gemini/policies/bkit-permissions.toml` 하나만 생성

**요구사항**:
1. Project-level policy 지원 (Tier 3)
2. `generateLevelPolicy(level, projectDir)` 함수 추가
3. 레벨별 정책 차이:
   - **Starter**: 읽기 전용 도구만 허용, shell command 제한적
   - **Dynamic**: API 호출 허용, 위험 shell command 확인
   - **Enterprise**: 전체 도구 허용, 보안 감사 로그
4. 기존 `generatePolicyFile()` 동작 유지 (하위호환)

**제약사항**:
- `hasPolicyEngine` && `hasProjectLevelPolicy` 일 때만 레벨별 정책 생성
- 기존 정책 파일 덮어쓰기 금지

### 3.5 M-05: Policy Migrator - 레벨별 정책 템플릿

**요구사항**: 3개 레벨별 TOML 정책 템플릿 내장

| Level | Policy File | Key Rules |
|---|---|---|
| Starter | `bkit-starter-policy.toml` | write_file=ask, shell=ask, destructive=deny |
| Dynamic | `bkit-dynamic-policy.toml` | write_file=allow, shell=allow, destructive=ask |
| Enterprise | `bkit-enterprise-policy.toml` | all=allow, audit logging rules |

### 3.6 M-06: Tool Registry - Tool Annotation 메타데이터

**현재 상태**: `getReadOnlyTools()`가 하드코딩된 배열 반환

**요구사항**:
1. `TOOL_ANNOTATIONS` 상수 추가 (readOnlyHint, destructiveHint, idempotentHint)
2. `getToolAnnotations(toolName)` 함수 추가
3. 기존 `getReadOnlyTools()`를 annotation 기반으로 리팩토링

### 3.7 M-07: Hook System - RuntimeHook Function 준비

**현재 상태**: 모든 10개 훅이 `type: "command"`

**요구사항**:
1. `hooks.json` 변경 없음 (v1.5.6에서는 command 유지)
2. Hook 스크립트에 `module.exports = { handler }` 패턴 추가 (dual-mode 준비)
3. 가장 고빈도 훅 3개(`session-start`, `before-agent`, `before-tool`)에 대해 handler 함수 export 추가
4. `lib/adapters/gemini/hook-adapter.js` 새 파일: RuntimeHook function 감지 및 라우팅 유틸리티

**제약사항**: 실제 `type: "function"` 전환은 v1.6.0으로 이관. v1.5.6에서는 준비만.

### 3.8 M-08: Session Start 버전 업데이트

**요구사항**:
- 모든 `v1.5.5` 문자열을 `v1.5.6`으로 업데이트
- `metadata.version`을 `'1.5.6'`으로 변경
- v0.31.0 감지 시 신규 기능 사용 가능 여부 메타데이터에 포함

### 3.9 M-09: Philosophy 문서 업데이트

**요구사항**: `context-engineering.md`의 버전 히스토리에 v1.5.6 추가
- RuntimeHook function 준비
- Tool annotation 메타데이터
- Project-level policy

---

## 4. Strategy Alternatives

### Strategy A: Minimal Patch (P0 only)

| Pros | Cons |
|---|---|
| 최소 변경 (3 files, 0.5h) | v0.31.0 기능 활용 기반 미확보 |
| 위험 최소 | v1.6.0에서 더 큰 작업 필요 |

### Strategy B: Foundation Patch (P0 + P1) - **RECOMMENDED**

| Pros | Cons |
|---|---|
| v0.31.0 호환성 + 기능 기반 확보 | 변경 범위 확대 (8.7h) |
| v1.6.0 개발 가속 | Policy/Hook 변경 테스트 필요 |
| 점진적 진화 (bkit 철학 부합) | |

### Strategy C: Full Migration

| Pros | Cons |
|---|---|
| 모든 v0.31.0 기능 즉시 활용 | 범위 과대 (47h+) |
| 경쟁 우위 즉시 확보 | 안정성 위험 |

**선택: Strategy B (Foundation Patch)**

---

## 5. Migration Checklist

### 5.1 수정 대상 파일 목록

| # | File | Change Type | Priority |
|:---:|---|:---:|:---:|
| 1 | `lib/adapters/gemini/version-detector.js` | Modify | P0 |
| 2 | `bkit.config.json` | Modify | P0 |
| 3 | `gemini-extension.json` | Modify | P0 |
| 4 | `lib/adapters/gemini/policy-migrator.js` | Modify | P1 |
| 5 | `lib/adapters/gemini/tool-registry.js` | Modify | P1 |
| 6 | `hooks/scripts/session-start.js` | Modify | P0 |
| 7 | `lib/adapters/gemini/hook-adapter.js` | **New** | P1 |
| 8 | `hooks/scripts/before-agent.js` | Modify | P1 |
| 9 | `hooks/scripts/before-tool.js` | Modify | P1 |
| 10 | `bkit-system/philosophy/context-engineering.md` | Modify | P2 |

### 5.2 수정하지 않는 파일

| File | Reason |
|---|---|
| `hooks/hooks.json` | v1.5.6에서는 command 타입 유지 |
| `mcp/spawn-agent-server.js` | MCP Progress는 v1.6.0 scope |
| `agents/*.md` | Agent 변경 없음 |
| `skills/*/SKILL.md` | Skill 변경 없음 |
| `GEMINI.md` | Context 파일 변경 없음 |

### 5.3 테스트 시나리오

| # | Test | Expected | Priority |
|:---:|---|---|:---:|
| T-01 | Gemini CLI v0.31.0에서 session start | 정상 초기화, metadata에 v1.5.6 | P0 |
| T-02 | `getFeatureFlags()` on v0.31.0 | 18개 플래그 모두 true | P0 |
| T-03 | `getFeatureFlags()` on v0.30.0 | 기존 9개만 true, 신규 9개 false | P0 |
| T-04 | `generatePolicyFile()` on v0.31.0 | 기존 동작 유지 | P0 |
| T-05 | `generateLevelPolicy('Starter')` | Starter TOML 정책 생성 | P1 |
| T-06 | `getToolAnnotations('read_file')` | `{ readOnlyHint: true }` 반환 | P1 |
| T-07 | Hook 스크립트 dual-mode export | `module.exports.handler` 존재 | P1 |
| T-08 | v0.29.0 하위호환 | 모든 기존 기능 정상 동작 | P0 |

---

## 6. YAGNI Review

| Considered & Rejected | Reason |
|---|---|
| RuntimeHook function 실제 전환 | API 안정성 미확인, v1.6.0으로 이관 |
| Session SDK 통합 | SDK stable 미출시, v1.7.0으로 이관 |
| Browser Agent 추가 | 별도 feature 규모, v1.7.0으로 이관 |
| MCP Progress Updates | spawn-agent-server 대규모 변경, v1.6.0으로 이관 |
| Extension Registry 등록 | 메타데이터 준비만, 실제 등록은 v1.6.0 |
| Plan Mode custom storage | PDCA 통합 설계 필요, v1.6.0으로 이관 |

---

## 7. Dependencies

| Dependency | Status | Impact if Missing |
|---|:---:|---|
| Gemini CLI v0.31.0 stable | ✅ Released | N/A |
| Node.js >= 18 | ✅ | N/A |
| bkit v1.5.5 codebase | ✅ | N/A |
| Gemini CLI v0.31.0 hooks API docs | ✅ Available | Hook adapter 설계 영향 |
| Policy Engine TOML spec | ✅ Available | Policy 템플릿 영향 |

---

## References

- [v0.31.0 Analysis Report](../../04-report/gemini-cli-031-upgrade-comprehensive-analysis.report.md)
- [Feature Enhancement Proposals](../../03-analysis/gemini-cli-031-feature-enhancement-proposals.analysis.md)
- [v0.30.0 Migration Report](../../04-report/features/gemini-cli-030-migration.report.md)
- [Gemini CLI v0.31.0 Changelog](https://geminicli.com/docs/changelogs/latest/)

---

*bkit Vibecoding Kit v1.5.6 - Gemini CLI v0.31.0 Migration Plan*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
