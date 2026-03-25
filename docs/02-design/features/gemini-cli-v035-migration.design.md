# Gemini CLI v0.35.0 Migration Design Document

> **Summary**: bkit v2.0.0 -- Gemini CLI v0.34.0 -> v0.35.0 호환성 확보 및 신규 기능(JIT, deny_message) 대응 설계
>
> **Project**: bkit-gemini
> **Version**: 2.0.0
> **Author**: migration-strategist agent
> **Date**: 2026-03-21
> **Status**: Draft
> **Planning Doc**: [gemini-cli-v035-migration.plan.md](../../01-plan/features/gemini-cli-v035-migration.plan.md)

---

## 1. Overview

### 1.1 Design Goals

1. **v0.35.0 Feature Gate 확보**: Gemini CLI v0.35.0의 신규 기능을 조건부로 활성화할 수 있는 기반 마련.
2. **JIT Context Loading 호환성**: Breaking Change인 JIT 기본화에 대응하여 컨텍스트 로딩 무결성 보장.
3. **보안 UX 개선**: `deny_message` TOML 필드를 지원하여 정책 거부 시 사용자 친화적 메시지 제공.
4. **테스트 자동화**: v0.35.0 환경을 시뮬레이션하는 단위 테스트 및 통합 테스트 설계.

### 1.2 Design Principles

- **Backward Compatibility**: v0.34.0 이하 버전과의 완전한 하위 호환성 유지.
- **Feature Gating**: 모든 신규 기능은 `isVersionAtLeast('0.35.0')` 플래그로 보호.
- **Defense in Depth**: CLI의 신규 보안 기능(도구 격리, SandboxManager)을 bkit의 기존 보안 티어와 결합.
- **Minimal Intervention**: CLI 내부 메커니즘(JIT, 병렬 스케줄러)은 가급적 CLI에 맡기고, bkit은 정합성만 검증.

---

## 2. Architecture

### 2.1 Component Diagram (Migration Focus)

```
┌─────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   version.js    │──────▶│    policy.js     │──────▶│ bkit-permissions │
│ (Feature Gates) │       │ (TOML Generator) │       │      .toml       │
└─────────────────┘       └──────────────────┘       └──────────────────┘
         │                         │
         │                ┌──────────────────┐
         └───────────────▶│ import-resolver  │
                          │ (Cache Strategy) │
                          └──────────────────┘
```

### 2.2 Data Flow (JIT Context)

```
SessionStart Hook → metadata.version (v0.35.0) → hasJITContextLoading: true
GEMINI.md @import → Gemini CLI (JIT Lazy Load)
bkit Phase Context → session-start.js context output (Eager Load)
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| lib/gemini/version.js | isVersionAtLeast() | v0.35.0 플래그 정의 |
| lib/gemini/policy.js | version.js | `deny_message` 필드 조건부 생성 |
| lib/gemini/import-resolver.js | version.js | JIT 모드 감지 후 캐시 TTL 조정 |
| hooks/scripts/session-start.js | version.js | metadata에 v0.35.0 기능 정보 포함 |

---

## 3. Detailed Specification

### 3.1 Feature Gate Mapping (version.js)

`getFeatureFlags()`에 다음 7개 플래그 추가:

| Flag Name | Version | CLI Feature |
|-----------|---------|-------------|
| `hasJITContextLoading` | v0.35.0+ | JIT Context Loading 기본화 |
| `hasToolIsolation` | v0.35.0+ | 서브에이전트 도구 격리 |
| `hasParallelToolScheduler` | v0.35.0+ | 병렬 도구 실행 스케줄러 |
| `hasAdminPolicy` | v0.35.0+ | `--admin-policy` 플래그 지원 |
| `hasDisableAlwaysAllow` | v0.35.0+ | "항상 허용" 비활성화 설정 |
| `hasCryptoVerification` | v0.35.0+ | 확장 암호학적 검증 |
| `hasCustomKeybindings` | v0.35.0+ | `keybindings.json` 지원 |

### 3.2 TOML Policy Extension (policy.js)

`convertToToml()` 및 `LEVEL_POLICY_TEMPLATES`에 `deny_message` 지원 추가:

```javascript
// policy.js
function convertToToml(permissions) {
  // ...
  if (rule.deny_message) {
    lines.push(`deny_message = "${escapeTomlString(rule.deny_message)}"`);
  }
  // ...
}

const LEVEL_POLICY_TEMPLATES = {
  Starter: {
    rules: [
      { toolName: 'run_shell_command', commandPrefix: 'rm', 
        decision: 'deny', priority: 100, 
        deny_message: 'bkit blocks rm commands for safety. Use file manager instead.' },
      // ...
    ]
  }
};
```

### 3.3 JIT Cache Strategy (import-resolver.js)

JIT 모드에서는 CLI가 주 컨텍스트 캐시를 관리하므로 bkit의 중복 캐싱 최소화:

```javascript
// import-resolver.js
const { getFeatureFlags } = require('./version');

function getCacheTTL() {
  const flags = getFeatureFlags();
  if (flags.hasJITContextLoading) {
    return 30000; // 30s - CLI manages primary cache, bkit just prevents redundant I/O in same turn
  }
  return 5000; // 5s - default for legacy
}
```

---

## 4. Error Handling

### 4.1 v0.35.0 관련 예외 처리

| Scenario | Handling |
|----------|----------|
| v0.35.0 preview에서 `deny_message` 에러 | `validateTomlStructure()`에서 필드 유효성 검증 후 안전하게 무시 |
| JIT 로딩 지연으로 컨텍스트 누락 | `session-start.js`에서 필수 컨텍스트(core-rules)를 eager로 직접 주입 |
| SandboxManager로 인한 hook 실행 실패 | `version.js`의 3단계 fallback(env -> npm -> cli)으로 대응 |

---

## 5. Security Considerations

- **Policy Integrity**: v0.35.0의 `hasAdminPolicy` 감지 시, bkit의 로컬 정책이 관리자 정책과 충돌하지 않도록 우선순위(priority) 설계 주의.
- **Tool Isolation**: 서브에이전트 스폰 시 `GEMINI_TOOL_ISOLATION` 환경변수 전달하여 격리 강화.
- **Crypto Verification**: bkit 확장 업데이트 시 CLI의 신규 검증 메커니즘 호환성 확인.

---

## 6. Test Plan

### 6.1 Test Scope

| Type | Target | Tool |
|------|--------|------|
| Unit Test | version.js Feature Gates | node tests/run-all.js |
| Unit Test | policy.js TOML Generation | node tests/run-all.js |
| Integration Test | JIT Context Loading | Manual CLI Session |
| E2E Test | PDCA cycle on v0.35.0 | Manual PDCA Execution |

### 6.2 Key Test Cases

1. **[TC-82] Feature Gate**: `GEMINI_CLI_VERSION=0.35.0` 환경에서 신규 7개 플래그가 `true`인지 확인.
2. **[TC-84] Policy TOML**: 생성된 TOML에 `deny_message` 필드가 정확히 직렬화되는지 확인.
3. **[TC-101] JIT Compatibility**: GEMINI.md의 `@` import가 JIT 환경에서 첫 번째 턴에 정상 로딩되는지 확인.
4. **[TC-102] Sandbox Integration**: `GEMINI_SANDBOX=runsc` 환경에서 hook 스크립트 정상 실행 확인.

---

## 7. Implementation Guide

### 7.1 Implementation Order

1. **Wave 1 (Critical)**: `lib/gemini/version.js` 플래그 추가 + `bkit.config.json` 업데이트.
2. **Wave 2 (High)**: `lib/gemini/policy.js` 필드 지원 + `lib/gemini/import-resolver.js` 캐시 조정.
3. **Wave 3 (Validation)**: v0.35.0 Stable 릴리스 후 `GEMINI.md` 및 `hooks.js` 정합성 검증.
4. **Final**: `CHANGELOG.md` 기록 및 마이그레이션 완료 보고서 작성.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-21 | Initial design for v0.35.0 migration | migration-strategist |
