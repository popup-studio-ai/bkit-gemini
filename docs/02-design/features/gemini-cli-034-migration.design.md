# Gemini CLI v0.34.0 Migration 설계 문서

> **Summary**: Gemini CLI v0.34.0 호환성 업데이트를 위한 bkit-gemini v1.5.9 상세 설계
>
> **Project**: bkit-gemini (Vibecoding Kit - Gemini Edition)
> **Version**: v1.5.9 (target)
> **Author**: CTO Team
> **Date**: 2026-03-18
> **Status**: Draft
> **Plan Reference**: docs/01-plan/features/gemini-cli-034-migration.plan.md

---

## Executive Summary

| 항목 | 내용 |
|------|------|
| **Feature** | gemini-cli-034-migration |
| **시작일** | 2026-03-18 |
| **대상 버전** | bkit v1.5.8 → v1.5.9, Gemini CLI v0.34.0 |
| **수정 파일** | 9개 파일 (6개 TOML 완료 + 3개 JS + 2개 설정 + 2개 문서) |
| **신규 파일** | 1개 (테스트 스위트) |

| 관점 | 내용 |
|------|------|
| **Problem** | 6개 TOML 로드 실패 + v0.34.0 Feature Flags 부재 + 호환성 미검증 |
| **Solution** | TOML 수정(완료) + 14개 Feature Flags + 설정/문서 업데이트 |
| **Function UX Effect** | 24/24 커맨드 정상 로드, v0.34.0 완전 호환 |
| **Core Value** | Gemini CLI 최신 버전 완벽 호환 + 향후 확장 기반 |

---

## 1. 설계 개요

### 1.1 수정 범위 요약

| # | 파일 | 변경 유형 | 상태 |
|---|------|----------|------|
| 1 | `commands/simplify.toml` | TOML 포맷 수정 | ✅ 완료 |
| 2 | `commands/batch.toml` | TOML 포맷 수정 | ✅ 완료 |
| 3 | `commands/loop.toml` | TOML 포맷 수정 | ✅ 완료 |
| 4 | `commands/plan-plus.toml` | TOML 포맷 수정 | ✅ 완료 |
| 5 | `commands/pm-discovery.toml` | TOML 포맷 수정 | ✅ 완료 |
| 6 | `commands/output-style-setup.toml` | TOML 포맷 수정 | ✅ 완료 |
| 7 | `lib/adapters/gemini/version-detector.js` | Feature Flags 추가 | 🔲 미완 |
| 8 | `lib/adapters/gemini/tool-registry.js` | 버전 주석 업데이트 | 🔲 미완 |
| 9 | `hooks/scripts/session-start.js` | 버전 업데이트 + 기능 감지 | 🔲 미완 |
| 10 | `bkit.config.json` | 호환성 정보 업데이트 | 🔲 미완 |
| 11 | `gemini-extension.json` | 버전 1.5.9 | 🔲 미완 |
| 12 | `GEMINI.md` | 버전 1.5.9 | 🔲 미완 |
| 13 | `.gemini/context/tool-reference.md` | v0.34.0 변경사항 추가 | 🔲 미완 |
| 14 | `CHANGELOG.md` | v1.5.9 항목 추가 | 🔲 미완 |
| 15 | `tests/suites/tc79-v034-features.js` | 신규 테스트 스위트 | 🔲 미완 |

---

## 2. 상세 설계: version-detector.js

### 2.1 현재 상태 (v1.5.8)

- **위치**: `lib/adapters/gemini/version-detector.js` (252줄)
- **버전 주석**: `@version 1.5.8`
- **Feature Flags**: v0.26.0 ~ v0.33.0 (33개)
- **bkit Feature Flags**: 5개 (canUseTeam, canUsePmTeam, canUseNativeAgents, canUsePlanDirectory, canUseExcludeTools)
- **nightly 파싱**: `0.34.0-nightly.20260304` 까지만 지원 (해시 미지원)

### 2.2 변경 사항

#### 2.2.1 nightly 버전 파싱 개선 (parseVersion 함수)

**현재 regex** (50번째 줄):
```javascript
const match = raw.match(/^(\d+)\.(\d+)\.(\d+)(-(?:preview\.(\d+)|nightly\.(\d+)))?/);
```

**변경 후**:
```javascript
const match = raw.match(/^(\d+)\.(\d+)\.(\d+)(-(?:preview\.(\d+)|nightly\.(\d+)(?:\.[a-f0-9]+)?))?/);
```

**변경 근거**: npm에 `0.34.0-nightly.20260304.28af4e127` 형태의 해시 포함 nightly 버전이 존재. 현재 regex는 해시 부분(`.28af4e127`)을 처리하지 못해 파싱 실패. `(?:\.[a-f0-9]+)?` 옵셔널 그룹 추가로 해시를 무시하면서 정상 파싱.

#### 2.2.2 v0.34.0+ Feature Flags 추가 (getFeatureFlags 함수)

**추가 위치**: `getFeatureFlags()` 함수의 `// v0.33.0+` 블록 뒤에 삽입

```javascript
    // v0.34.0+
    hasNativeSkillSystem: isVersionAtLeast('0.34.0'),
    hasACP: isVersionAtLeast('0.34.0'),
    hasExtensionRegistryClient: isVersionAtLeast('0.34.0'),
    hasExtensionValidation: isVersionAtLeast('0.34.0'),
    hasHookMigration: isVersionAtLeast('0.34.0'),
    hasSlashCommandConflictResolution: isVersionAtLeast('0.34.0'),
    hasMcpPromptLoader: isVersionAtLeast('0.34.0'),
    hasContextFileNameArray: isVersionAtLeast('0.34.0'),
    hasGemini31CustomTools: isVersionAtLeast('0.34.0'),
    hasToolLegacyAliases: isVersionAtLeast('0.34.0'),
    hasStrictTomlValidation: isVersionAtLeast('0.34.0'),
    hasSubagentPolicies: isVersionAtLeast('0.34.0'),
    hasThemeSubdirectories: isVersionAtLeast('0.34.0'),
    hasUpgradeCommand: isVersionAtLeast('0.34.0')
```

**14개 Flag 상세 설명**:

| Flag | 의미 | bkit 활용 |
|------|------|----------|
| `hasNativeSkillSystem` | SkillCommandLoader + ACTIVATE_SKILL 도구 | 향후 Skills 연동 |
| `hasACP` | Agent Client Protocol 지원 | 모니터링 |
| `hasExtensionRegistryClient` | 중앙 레지스트리 (geminicli.com) | 향후 등록 |
| `hasExtensionValidation` | `gemini extensions validate` 명령어 | CI 검증 |
| `hasHookMigration` | `gemini hooks migrate` 명령어 | 호환성 |
| `hasSlashCommandConflictResolution` | 커맨드 충돌 자동 해결 | 커맨드명 관리 |
| `hasMcpPromptLoader` | MCP 프롬프트를 커맨드로 로드 | MCP 통합 |
| `hasContextFileNameArray` | contextFileName 배열 지원 | 다중 컨텍스트 |
| `hasGemini31CustomTools` | Gemini 3.1 커스텀 도구 모델 | 에이전트 모델 |
| `hasToolLegacyAliases` | 도구명 레거시 별칭 시스템 | 호환성 |
| `hasStrictTomlValidation` | TOML Zod 스키마 검증 | TOML 관리 |
| `hasSubagentPolicies` | 서브에이전트별 TOML 정책 | 에이전트 보안 |
| `hasThemeSubdirectories` | dark/light 테마 서브디렉토리 | 테마 호환 |
| `hasUpgradeCommand` | /upgrade 내장 명령어 | 업그레이드 안내 |

#### 2.2.3 bkit Feature Flags 추가 (getBkitFeatureFlags 함수)

**추가할 bkit 게이트**:
```javascript
    canUseNativeSkills: flags.hasNativeSkillSystem || false,
    canUseSubagentPolicies: flags.hasSubagentPolicies || false,
    canValidateExtension: flags.hasExtensionValidation || false
```

#### 2.2.4 버전 주석 업데이트

```javascript
 * @version 1.5.9
```

### 2.3 변경 전후 diff 미리보기

```diff
--- a/lib/adapters/gemini/version-detector.js
+++ b/lib/adapters/gemini/version-detector.js
@@ -10,7 +10,7 @@
- * @version 1.5.8
+ * @version 1.5.9
  */

@@ -50,1 +50,1 @@
-  const match = raw.match(/^(\d+)\.(\d+)\.(\d+)(-(?:preview\.(\d+)|nightly\.(\d+)))?/);
+  const match = raw.match(/^(\d+)\.(\d+)\.(\d+)(-(?:preview\.(\d+)|nightly\.(\d+)(?:\.[a-f0-9]+)?))?/);

@@ -197,1 +197,18 @@
     hasReplaceAllowMultipleRequired: isVersionAtLeast('0.33.0')
+
+    // v0.34.0+
+    hasNativeSkillSystem: isVersionAtLeast('0.34.0'),
+    hasACP: isVersionAtLeast('0.34.0'),
+    hasExtensionRegistryClient: isVersionAtLeast('0.34.0'),
+    hasExtensionValidation: isVersionAtLeast('0.34.0'),
+    hasHookMigration: isVersionAtLeast('0.34.0'),
+    hasSlashCommandConflictResolution: isVersionAtLeast('0.34.0'),
+    hasMcpPromptLoader: isVersionAtLeast('0.34.0'),
+    hasContextFileNameArray: isVersionAtLeast('0.34.0'),
+    hasGemini31CustomTools: isVersionAtLeast('0.34.0'),
+    hasToolLegacyAliases: isVersionAtLeast('0.34.0'),
+    hasStrictTomlValidation: isVersionAtLeast('0.34.0'),
+    hasSubagentPolicies: isVersionAtLeast('0.34.0'),
+    hasThemeSubdirectories: isVersionAtLeast('0.34.0'),
+    hasUpgradeCommand: isVersionAtLeast('0.34.0')

@@ -215,1 +232,5 @@
     canUseExcludeTools: flags.hasExcludeToolsConfig || false
+    canUseNativeSkills: flags.hasNativeSkillSystem || false,
+    canUseSubagentPolicies: flags.hasSubagentPolicies || false,
+    canValidateExtension: flags.hasExtensionValidation || false
```

---

## 3. 상세 설계: tool-registry.js

### 3.1 현재 상태 (v1.5.8)

- **위치**: `lib/adapters/gemini/tool-registry.js` (373줄)
- **버전 주석**: `@version 1.5.8`
- **빌트인 도구**: 23개 (BUILTIN_TOOLS 객체)
- **도구 어노테이션**: 22개 (TOOL_ANNOTATIONS, v0.31.0+)
- **이미 등록됨**: `activate_skill`, `ask_user`, `enter_plan_mode`, `exit_plan_mode`, `get_internal_docs`

### 3.2 변경 사항

**분석 결과**: tool-registry.js는 이미 v0.34.0의 23개 빌트인 도구를 모두 포함하고 있음! `BUILTIN_TOOLS` 객체의 `ASK_USER`, `ACTIVATE_SKILL`, `GET_INTERNAL_DOCS`, `ENTER_PLAN_MODE`, `EXIT_PLAN_MODE`이 이미 등록되어 있고 `TOOL_ANNOTATIONS`에도 포함됨.

**필요한 변경**: 최소한의 업데이트만 수행

#### 3.2.1 버전 주석 업데이트

```diff
- * @version 1.5.8
+ * @version 1.5.9
```

#### 3.2.2 주석 업데이트 (검증 범위)

```diff
-// ─── 23 Built-in Tool Names (v0.29.0+ base, v0.32.0+ tracker) ─
+// ─── 23 Built-in Tool Names (v0.29.0+ base, v0.32.0+ tracker, v0.34.0 verified) ─
```

#### 3.2.3 TOOL_PARAM_CHANGES에 v0.34.0 관련 변경 없음

v0.34.0에서 기존 도구의 파라미터 변경은 확인되지 않음. 추가 불필요.

---

## 4. 상세 설계: session-start.js

### 4.1 현재 상태 (v1.5.8)

- **위치**: `hooks/scripts/session-start.js` (408줄)
- **버전 참조**: `v1.5.8` (3곳: 주석, 헤더, fallback 메시지)
- **getGeminiCliFeatures()**: 버전, isPreview, flagCount, totalFlags 반환

### 4.2 변경 사항

#### 4.2.1 버전 참조 업데이트 (3곳)

**변경 위치 1** - 주석 (6줄):
```diff
- * SessionStart Hook - Enhanced Session Initialization (v1.5.8)
+ * SessionStart Hook - Enhanced Session Initialization (v1.5.9)
```

**변경 위치 2** - 메타데이터 (95줄):
```diff
-        version: '1.5.8',
+        version: '1.5.9',
```

**변경 위치 3** - fallback 메시지 (113줄):
```diff
-      context: 'bkit Vibecoding Kit v1.5.8 activated (Gemini CLI)',
+      context: 'bkit Vibecoding Kit v1.5.9 activated (Gemini CLI)',
```

**변경 위치 4** - 헤더 (213줄):
```diff
-  sections.push('# bkit Vibecoding Kit v1.5.8 - Session Start');
+  sections.push('# bkit Vibecoding Kit v1.5.9 - Session Start');
```

#### 4.2.2 getGeminiCliFeatures() 확장

**현재** (392~406줄):
```javascript
function getGeminiCliFeatures() {
  try {
    const vd = require(path.join(libPath, 'adapters', 'gemini', 'version-detector'));
    const version = vd.detectVersion();
    const flags = vd.getFeatureFlags();
    return {
      version: version.raw,
      isPreview: version.isPreview,
      flagCount: Object.values(flags).filter(Boolean).length,
      totalFlags: Object.keys(flags).length
    };
  } catch (e) {
    return { version: 'unknown', isPreview: false, flagCount: 0, totalFlags: 0 };
  }
}
```

**변경 후**:
```javascript
function getGeminiCliFeatures() {
  try {
    const vd = require(path.join(libPath, 'adapters', 'gemini', 'version-detector'));
    const version = vd.detectVersion();
    const flags = vd.getFeatureFlags();
    return {
      version: version.raw,
      isPreview: version.isPreview,
      isNightly: version.isNightly || false,
      flagCount: Object.values(flags).filter(Boolean).length,
      totalFlags: Object.keys(flags).length,
      hasNativeSkills: flags.hasNativeSkillSystem || false,
      hasStrictToml: flags.hasStrictTomlValidation || false
    };
  } catch (e) {
    return { version: 'unknown', isPreview: false, isNightly: false, flagCount: 0, totalFlags: 0, hasNativeSkills: false, hasStrictToml: false };
  }
}
```

**추가 필드**:
- `isNightly`: nightly 빌드 여부 (세션 메타데이터 강화)
- `hasNativeSkills`: Skills 시스템 활성화 상태 (향후 활용)
- `hasStrictToml`: TOML 엄격 검증 활성화 (디버깅 정보)

---

## 5. 상세 설계: bkit.config.json

### 5.1 변경 사항

#### 5.1.1 version 업데이트 (2줄)

```diff
-  "version": "1.5.8",
+  "version": "1.5.9",
```

#### 5.1.2 compatibility.testedVersions에 v0.34.0 추가 (120줄)

```diff
-    "testedVersions": ["0.29.0", "0.29.5", "0.29.7", "0.30.0-preview.3", "0.30.0", "0.31.0", "0.32.0", "0.32.1", "0.33.0-preview.4", "0.33.0"],
+    "testedVersions": ["0.29.0", "0.29.5", "0.29.7", "0.30.0-preview.3", "0.30.0", "0.31.0", "0.32.0", "0.32.1", "0.33.0-preview.4", "0.33.0", "0.34.0"],
```

#### 5.1.3 compatibility.skillsSystem 섹션 추가

`compatibility.taskTracker` 블록 뒤에 추가:

```json
    "skillsSystem": {
      "enabled": true,
      "minVersion": "0.34.0",
      "nativeActivation": false,
      "description": "Gemini CLI native skills system compatibility"
    }
```

**설명**: `nativeActivation: false`는 현재 bkit 스킬을 네이티브 Skills 시스템으로 직접 활성화하지 않음을 의미. 향후 v1.6.0에서 `true`로 전환 가능.

---

## 6. 상세 설계: gemini-extension.json

### 6.1 변경 사항

```diff
-  "version": "1.5.8",
-  "description": "bkit Vibecoding Kit v1.5.8 - PDCA methodology + Context Engineering for AI-native development with Gemini CLI",
+  "version": "1.5.9",
+  "description": "bkit Vibecoding Kit v1.5.9 - PDCA methodology + Context Engineering for AI-native development with Gemini CLI",
```

---

## 7. 상세 설계: GEMINI.md

### 7.1 변경 사항

```diff
-# bkit Vibecoding Kit v1.5.8 - Gemini CLI Edition
+# bkit Vibecoding Kit v1.5.9 - Gemini CLI Edition
```

```diff
-*bkit Vibecoding Kit v1.5.8 - Empowering AI-native development*
+*bkit Vibecoding Kit v1.5.9 - Empowering AI-native development*
```

---

## 8. 상세 설계: .gemini/context/tool-reference.md

### 8.1 변경 사항

#### 8.1.1 헤더 업데이트

```diff
-bkit uses Gemini CLI native tool names (v0.29.0~v0.33.x verified):
+bkit uses Gemini CLI native tool names (v0.29.0~v0.34.x verified):
```

#### 8.1.2 v0.34.0 Breaking Changes 섹션 추가

`### v0.33.0 Changes` 섹션 뒤에 추가:

```markdown
### v0.34.0 Changes

| ID | Tool | Change | Impact |
|----|------|--------|--------|
| BC-7 | TOML Commands | Strict Zod schema: only `prompt` (required) + `description` (optional) at top level | `[command]` section headers and `name` fields cause validation failure |
| BC-8 | Commands | `SkillCommandLoader` adds `CommandKind.SKILL` type | Skill commands may conflict with extension commands |
| BC-9 | Commands | `SlashCommandConflictResolver` auto-renames conflicting extension commands | Extension commands prefixed with `ext-name:` on conflict |
| BC-10 | Policies | `subagent` field supported in TOML policy rules | Per-agent policy rules possible |
```

---

## 9. 상세 설계: CHANGELOG.md

### 9.1 v1.5.9 항목 (CHANGELOG.md 최상단에 추가)

```markdown
## [1.5.9] - 2026-03-18

### Fixed
- **6 TOML Command Files**: Removed invalid `[command]` section headers and `name` fields from simplify, batch, loop, plan-plus, pm-discovery, output-style-setup commands to comply with Gemini CLI v0.34.0 Zod schema validation

### Added
- **14 v0.34.0 Feature Flags**: hasNativeSkillSystem, hasACP, hasExtensionRegistryClient, hasExtensionValidation, hasHookMigration, hasSlashCommandConflictResolution, hasMcpPromptLoader, hasContextFileNameArray, hasGemini31CustomTools, hasToolLegacyAliases, hasStrictTomlValidation, hasSubagentPolicies, hasThemeSubdirectories, hasUpgradeCommand
- **3 bkit Feature Gates**: canUseNativeSkills, canUseSubagentPolicies, canValidateExtension
- **Nightly version hash parsing**: Support `0.34.0-nightly.20260304.28af4e127` format
- **Session metadata**: isNightly, hasNativeSkills, hasStrictToml fields
- **Gemini CLI v0.34.0 Compatibility**: tested and verified

### Changed
- Version bump: 1.5.8 → 1.5.9 across gemini-extension.json, GEMINI.md, bkit.config.json, session-start.js, version-detector.js, tool-registry.js
- compatibility.testedVersions: added "0.34.0"
- Tool reference: verified range expanded to v0.29.0~v0.34.x
- CHANGELOG BC-7~BC-10: v0.34.0 breaking changes documented

### Documentation
- Plan: gemini-cli-034-migration plan document
- Design: gemini-cli-034-migration design document
```

---

## 10. 상세 설계: 테스트 스위트

### 10.1 tc79-v034-features.js (신규)

**위치**: `tests/suites/tc79-v034-features.js`
**테스트 케이스**: 약 25개

```javascript
/**
 * TC-79: Gemini CLI v0.34.0 Feature Tests
 * Tests v0.34.0 feature flags, nightly parsing, TOML validation
 */

// 테스트 구조:
// 1. v0.34.0 Feature Flags (14 tests)
//    - 각 flag가 v0.34.0에서 true 반환 확인
//    - v0.33.0에서 false 반환 확인
//
// 2. Nightly 버전 파싱 (4 tests)
//    - "0.34.0-nightly.20260304" 정상 파싱
//    - "0.34.0-nightly.20260304.28af4e127" 해시 포함 정상 파싱
//    - "0.35.0-nightly.20260314.3038fdce2" 다른 버전 파싱
//    - 비정상 형식 거부
//
// 3. bkit Feature Gates (3 tests)
//    - canUseNativeSkills: v0.34.0에서 true
//    - canUseSubagentPolicies: v0.34.0에서 true
//    - canValidateExtension: v0.34.0에서 true
//
// 4. TOML 검증 호환성 (4 tests)
//    - 정상 TOML (prompt + description) 구조 확인
//    - [command] 섹션 없는 구조 확인
//    - 모든 24개 commands/*.toml 파일 구조 검증
//    - name 필드 없음 확인
```

### 10.2 테스트 검증 항목

| # | 테스트 | 검증 대상 | 예상 결과 |
|---|--------|----------|----------|
| 1 | `hasNativeSkillSystem('0.34.0')` | Feature Flag | `true` |
| 2 | `hasNativeSkillSystem('0.33.0')` | Feature Flag | `false` |
| 3 | `parseVersion('0.34.0-nightly.20260304.28af4e127')` | 파싱 | `{ major: 0, minor: 34, patch: 0, isNightly: true }` |
| 4 | `parseVersion('0.34.0-nightly.20260304')` | 파싱 | `{ major: 0, minor: 34, patch: 0, isNightly: true }` |
| 5 | 모든 TOML에 `[command]` 없음 | 구조 검증 | 0개 일치 |
| 6 | 모든 TOML에 top-level `prompt` 있음 | 구조 검증 | 24개 일치 |

---

## 11. 의존 관계 및 실행 순서

```
Phase 1 (완료): TOML 수정 ─────────────────────── ✅
                     │
Phase 2: version-detector.js ──┐
                               ├─→ Phase 4: session-start.js
Phase 3: tool-registry.js ─────┘          │
                                          │
Phase 5: bkit.config.json ────────────────┤
Phase 6: gemini-extension.json ───────────┤
Phase 7: GEMINI.md ───────────────────────┤
Phase 8: tool-reference.md ──────────────┤
Phase 9: CHANGELOG.md ───────────────────┘
                     │
Phase 10: tc79-v034-features.js (테스트)
```

**실행 순서 근거**:
- Phase 2 (version-detector)가 먼저 완료되어야 Phase 4 (session-start)에서 새 flags 참조 가능
- Phase 3 (tool-registry)는 Phase 2와 독립적이므로 병렬 가능
- Phase 5~9 (설정/문서)는 모두 독립적이므로 병렬 가능
- Phase 10 (테스트)는 모든 변경 완료 후 실행

---

## 12. 하위 호환성 보장 설계

### 12.1 원칙

모든 변경은 `isVersionAtLeast()` 가드를 통해 보호됨. v0.29.0~v0.33.0 환경에서도 정상 동작 보장.

### 12.2 검증 매트릭스

| 환경 | TOML 로드 | Feature Flags | Session Start | 전체 동작 |
|------|----------|--------------|--------------|----------|
| v0.29.0 | ✅ 24/24 | 4/50 true | ✅ | ✅ |
| v0.30.0 | ✅ 24/24 | 8/50 true | ✅ | ✅ |
| v0.31.0 | ✅ 24/24 | 17/50 true | ✅ | ✅ |
| v0.32.0 | ✅ 24/24 | 28/50 true | ✅ | ✅ |
| v0.33.0 | ✅ 24/24 | 36/50 true | ✅ | ✅ |
| **v0.34.0** | **✅ 24/24** | **50/50 true** | **✅** | **✅** |

### 12.3 TOML 하위 호환성

Zod 스키마의 `z.object()`는 기본적으로 unknown keys를 strip하므로, flat 포맷(`prompt` + `description`)은 v0.29.0부터 v0.34.0까지 모든 버전에서 정상 작동:

- v0.29.0~v0.33.x: TOML 파서가 flat 구조를 정상 읽음 (Zod 없음 또는 느슨한 검증)
- v0.34.0: Zod `safeParse`로 `prompt` 필수 검증 → flat 구조 통과

---

## 13. 리스크 대응 설계

| 리스크 | 대응 | 구현 |
|--------|------|------|
| v0.35.0에서 추가 breaking change | Feature Flag 분기 | 모든 새 기능이 `isVersionAtLeast` 가드 내 |
| nightly 해시 파싱 실패 | 옵셔널 그룹 | `(?:\.[a-f0-9]+)?` 으로 해시 있어도 없어도 OK |
| Session Start 오류 | Graceful degradation | try-catch로 fallback 메시지 출력 |
| TOML 재발 방지 | 테스트 검증 | tc79에서 모든 TOML 구조 자동 검증 |

---

## 14. 성공 기준 매핑

| Plan 요구사항 | 설계 커버리지 | 검증 방법 |
|-------------|-------------|----------|
| FR-1: TOML 호환성 | Section 2 (완료) | gemini CLI 실행 시 에러 0건 |
| FR-2: Version Detection | Section 2 (14 flags + nightly) | tc79 테스트 |
| FR-3: Tool Registry | Section 3 (이미 완료, 주석만) | 기존 테스트 |
| FR-4: Configuration | Section 5~6 | JSON 구조 검증 |
| FR-5: Session Start | Section 4 | Session metadata 확인 |
| FR-6: Command Conflict | Section 8 (문서화) | 매뉴얼 검증 |
| NFR-1: 하위 호환성 | Section 12 | 버전별 매트릭스 |
| NFR-2: 성능 | 변경 없음 (3초 미만 유지) | 기존 캐시 구조 |

---

*Generated by CTO Team via PDCA Design phase*
*bkit Vibecoding Kit v1.5.9 - Gemini CLI v0.34.0 Migration*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
