# Gemini CLI v0.36.0 Migration Design — bkit v2.0.2

> **Feature**: gemini-cli-v036-migration
> **Version**: bkit v2.0.2
> **Created**: 2026-03-28
> **Status**: Approved (L4 Auto)
> **Plan**: [gemini-cli-v036-migration.plan.md](../../01-plan/features/gemini-cli-v036-migration.plan.md)

---

## 구현 상세 설계

### 총 수정 파일 8개, 신규 파일 2개

| # | 파일 | Wave | 유형 | 변경 요약 |
|---|------|------|------|-----------|
| 1 | `hooks/scripts/session-start.js` | W1 | 수정 | ensureAgentsEnabled() 함수 추가 + 호출 |
| 2 | `.gemini/settings.json` | W1 | 신규 | enableAgents: true 초기 파일 |
| 3 | `bkit.config.json` | W1 | 수정 | testedVersions 업데이트 |
| 4 | `lib/gemini/version.js` | W2 | 수정 | v0.36.0 Feature Flag 7개 + canUse* 3개 |
| 5 | `hooks/scripts/before-tool.js` | W2 | 수정 | BeforeTool ask 결정 지원 |
| 6 | `tests/suites/tc111-v036-enableagents.js` | W3 | 신규 | enableAgents 테스트 5 TC |
| 7 | `tests/suites/tc105-v035-feature-gates.js` | W3 | 수정 | v0.36.0 플래그 검증 4 TC 추가 |
| 8 | `tests/suites/tc109-v035-skill-agent-compat.js` | W3 | 수정 | enableAgents 검증 2 TC 추가 |

---

## Wave 1: P0 Critical — enableAgents 방어

### D1-1: session-start.js — ensureAgentsEnabled()

**위치**: Line 47 (정책 생성 직후, `// 4. Load/Update memory store` 직전)

**추가할 함수**:

```javascript
// 3.6. Ensure Agents Enabled for v0.36.0+ (P0 Critical)
// v0.36.0에서 experimental.enableAgents 기본값이 false로 변경됨
// bkit 에이전트 시스템 정상 동작을 위해 settings.json에 명시적 설정 보장
function ensureAgentsEnabled(projectDir) {
  try {
    const settingsDir = path.join(projectDir, '.gemini');
    const settingsPath = path.join(settingsDir, 'settings.json');

    let settings = {};
    if (fs.existsSync(settingsPath)) {
      const raw = fs.readFileSync(settingsPath, 'utf-8');
      settings = JSON.parse(raw);
    }

    // No Guessing 원칙: 사용자가 명시적으로 false로 설정한 경우 존중
    if (!settings.experimental) {
      settings.experimental = {};
    }
    if (settings.experimental.enableAgents === undefined) {
      settings.experimental.enableAgents = true;

      if (!fs.existsSync(settingsDir)) {
        fs.mkdirSync(settingsDir, { recursive: true });
      }
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
    }
  } catch (e) {
    // Non-fatal: settings.json generation should not block session
  }
}
```

**호출 위치**:

```javascript
    // Line 47 직후에 추가:
    // 3.6. Ensure Agents Enabled for v0.36.0+
    ensureAgentsEnabled(projectDir);
```

**동작 규칙**:
1. `.gemini/settings.json` 미존재 → 생성하고 `enableAgents: true` 설정
2. 존재 + `enableAgents` 미설정 → `true` 추가
3. 존재 + `enableAgents: true` → 변경 없음
4. 존재 + `enableAgents: false` → **변경 안 함** (사용자 의도 존중, No Guessing)

### D1-2: .gemini/settings.json

**신규 파일**: Git에 커밋하여 기본 설정 제공

```json
{
  "experimental": {
    "enableAgents": true
  }
}
```

### D1-3: bkit.config.json

**수정 위치**: Line 120 `testedVersions`

```
이전: "testedVersions": ["0.34.0", "0.35.0"]
이후: "testedVersions": ["0.34.0", "0.35.0", "0.35.3", "0.36.0"]
```

---

## Wave 2: P1 기반 확보

### D2-1: version.js — v0.36.0 Feature Flag

**수정 위치**: `getFeatureFlags()` 함수 (Line 149~187)

**v0.35.0+ 블록 뒤에 추가**:

```javascript
    // v0.36.0+
    hasEnableAgentsDefaultFalse: isVersionAtLeast('0.36.0'),
    hasToolNameRequired: isVersionAtLeast('0.36.0'),
    hasStatelessSandbox: isVersionAtLeast('0.36.0'),
    hasBeforeToolAsk: isVersionAtLeast('0.36.0'),
    hasGitWorktree: isVersionAtLeast('0.36.0'),
    hasPlanModeNonInteractive: isVersionAtLeast('0.36.0'),
    hasMultiRegistry: isVersionAtLeast('0.36.0'),
```

**`getBkitFeatureFlags()` 함수 (Line 194~214)**에 추가:

```javascript
    // v0.36.0+
    canUseBeforeToolAsk: flags.hasBeforeToolAsk,
    canUseGitWorktree: flags.hasGitWorktree,
    canUsePlanModeNonInteractive: flags.hasPlanModeNonInteractive
```

### D2-2: before-tool.js — BeforeTool Hook 'ask' 결정

**수정 위치**: `processHook()` 함수 (Line 49~88)

**permResult.level === 'ask' 블록 (Line 62~65) 수정**:

```javascript
    if (permResult.level === 'ask') {
      // v0.36.0+: BeforeTool Hook에서 'ask' 결정을 CLI에 전달
      // v0.35.x에서는 'ask' 미지원이므로 allow + warning으로 fallback
      try {
        const { getFeatureFlags } = require(path.join(libPath, 'gemini', 'version'));
        if (getFeatureFlags().hasBeforeToolAsk) {
          writeSecurityAuditLog(projectDir, 'ASK', toolName, toolInput, permResult.reason);
          return { status: 'ask', message: permResult.reason || 'This action requires user confirmation.' };
        }
      } catch (e) { /* version detection failure, fall through */ }

      // Fallback for v0.35.x: allow with warning
      contexts.push(`**Permission Warning**: ${permResult.reason || 'This action requires caution.'}`);
      writeSecurityAuditLog(projectDir, 'ASK', toolName, toolInput, permResult.reason);
    }
```

**동작 규칙**:
1. v0.36.0+: `{ status: 'ask' }` 반환 → CLI가 사용자에게 확인 프롬프트 표시
2. v0.35.x: 기존 동작 유지 (allow + warning context)
3. Feature Flag 감지 실패 시: 기존 동작으로 fallback

---

## Wave 3: 테스트

### D3-1: TC-111 — enableAgents 설정 자동 생성 (5 TC)

```
TC-111-01: settings.json 미존재 시 자동 생성 확인
  - .gemini/settings.json 미존재 상태에서 ensureAgentsEnabled() 호출
  - 결과: 파일 생성, enableAgents === true

TC-111-02: settings.json 존재 + enableAgents 미설정 시 true 추가
  - { "someOther": "value" } 파일 존재 상태에서 호출
  - 결과: enableAgents === true 추가, someOther 값 보존

TC-111-03: settings.json 존재 + enableAgents=true 시 변경 없음
  - { "experimental": { "enableAgents": true } } 존재 상태에서 호출
  - 결과: 파일 내용 변경 없음

TC-111-04: settings.json 존재 + enableAgents=false 시 사용자 의도 존중
  - { "experimental": { "enableAgents": false } } 존재 상태에서 호출
  - 결과: enableAgents === false 유지 (No Guessing)

TC-111-05: settings.json 생성 시 다른 설정 키 보존
  - { "experimental": { "someFlag": true }, "theme": "dark" } 존재 상태
  - 결과: enableAgents 추가, 기존 키 모두 보존
```

### D3-2: TC-105 업데이트 — v0.36.0 Feature Flag (4 TC 추가)

```
TC-105-09: v0.36.0 hasEnableAgentsDefaultFalse = true
TC-105-10: v0.36.0 hasBeforeToolAsk = true
TC-105-11: v0.36.0 hasGitWorktree = true
TC-105-12: v0.35.0 hasEnableAgentsDefaultFalse = false (하위 버전 검증)
```

### D3-3: TC-109 업데이트 — enableAgents 검증 (2 TC 추가)

```
TC-109-11: .gemini/settings.json이 enableAgents 키를 포함하는지 확인
TC-109-12: bkit.config.json testedVersions에 "0.36.0" 포함 확인
```

---

## 검증 기준 (Gap Analysis 대상)

| # | 검증 항목 | 파일 | 기대 결과 |
|---|-----------|------|-----------|
| G1 | ensureAgentsEnabled() 함수 존재 | session-start.js | 함수 정의 + 호출 |
| G2 | settings.json enableAgents 설정 | .gemini/settings.json | `enableAgents: true` |
| G3 | testedVersions 업데이트 | bkit.config.json | `["0.34.0","0.35.0","0.35.3","0.36.0"]` |
| G4 | v0.36.0 Feature Flag 7개 | version.js | hasEnableAgentsDefaultFalse 등 7개 |
| G5 | getBkitFeatureFlags v0.36.0 | version.js | canUseBeforeToolAsk 등 3개 |
| G6 | BeforeTool ask 분기 | before-tool.js | hasBeforeToolAsk 분기 + status: 'ask' |
| G7 | TC-111 5개 테스트 케이스 | tc111-v036-enableagents.js | 5 TC 존재 |
| G8 | TC-105 v0.36.0 추가 4 TC | tc105-v035-feature-gates.js | 12 TC 이상 |
| G9 | TC-109 enableAgents 2 TC | tc109-v035-skill-agent-compat.js | 12 TC 이상 |
| G10 | 기존 테스트 회귀 없음 | 전체 테스트 스위트 | 기존 TC PASS |
