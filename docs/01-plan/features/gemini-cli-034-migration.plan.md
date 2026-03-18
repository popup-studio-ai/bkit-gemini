# Gemini CLI v0.34.0 Migration Planning Document

> **Summary**: Gemini CLI v0.32.x → v0.34.0 버전업에 따른 bkit-gemini 확장 호환성 업데이트 및 신기능 통합
>
> **Project**: bkit-gemini (Vibecoding Kit - Gemini Edition)
> **Version**: v1.5.9 (target)
> **Author**: CTO Team (8-agent orchestration)
> **Date**: 2026-03-18
> **Status**: Draft
> **Method**: Plan-Plus (Brainstorming-Enhanced PDCA Planning)

---

## Executive Summary

| 항목 | 내용 |
|------|------|
| **Feature** | gemini-cli-034-migration |
| **시작일** | 2026-03-18 |
| **대상 버전** | Gemini CLI v0.32.x → v0.34.0, bkit v1.5.8 → v1.5.9 |
| **변경 규모** | Major (6개 TOML 수정 + 신규 기능 15+ 통합) |

### Value Delivered

| 관점 | 내용 |
|------|------|
| **Problem** | Gemini CLI v0.34.0 버전업으로 6개 TOML 커맨드 로드 실패 + 새 Skills/ACP/Registry 시스템 미지원 |
| **Solution** | TOML 포맷 수정, v0.34.0 Feature Flags 추가, Skills 시스템 연동, ACP 지원 준비 |
| **Function UX Effect** | 모든 24개 커맨드 정상 로드, 새 기능 활용 가능 |
| **Core Value** | bkit 확장의 Gemini CLI 최신 버전 완벽 호환 유지 |

---

## 1. Overview

### 1.1 Purpose

Gemini CLI가 v0.32.x에서 v0.34.0으로 메이저 업그레이드되면서, bkit-gemini 확장에 다음 문제가 발생:

1. **즉시 수정 필요**: 6개 TOML 커맨드 파일이 `FileCommandLoader` 검증 실패로 로드 불가
2. **호환성 업데이트 필요**: v0.34.0의 새 기능(Skills 시스템, ACP, Extension Registry 등)에 대한 feature flag 및 지원 코드 부재
3. **고도화 기회**: 새 Skills 시스템, 커맨드 충돌 해결, Extension 검증 등을 활용한 bkit 품질 향상

### 1.2 Background

#### Gemini CLI 버전 히스토리 (bkit 관련)
| 버전 | 주요 변경 | bkit 대응 |
|------|----------|----------|
| v0.29.0 | Plan Mode, Gemini 3, Extension Registry | bkit v1.5.4 |
| v0.30.0 | Policy Engine, SDK, Approval Mode | bkit v1.5.5 |
| v0.31.0 | Runtime Hooks, Tool Annotations, Browser Agent | bkit v1.5.6 |
| v0.32.0 | Task Tracker, Extension Policies, A2A Streaming | bkit v1.5.7 |
| v0.33.0 | Native Subagents, Plan Directory, Theme Support | bkit v1.5.8 |
| **v0.34.0** | **Skills System, ACP, Extension Registry Client, Hook Migration** | **bkit v1.5.9 (본 작업)** |

#### 현재 설치된 버전
- Gemini CLI: **v0.34.0** (npm global, @google/gemini-cli@0.34.0)
- bkit-gemini: **v1.5.8** (gemini-extension.json)
- 최신 Nightly: v0.35.0-nightly.20260314 (참고)

### 1.3 Related Documents

- 이전 마이그레이션: `docs/01-plan/features/gemini-cli-031-migration.plan.md`
- 이전 업그레이드: `docs/01-plan/features/bkit-gemini-v158-upgrade.plan.md`
- Gemini CLI 공식 리포: https://github.com/google-gemini/gemini-cli

---

## 2. Gemini CLI v0.34.0 변경사항 심층 분석

### 2.1 Breaking Changes (즉시 대응 필요)

#### BC-1: TOML 커맨드 파일 스키마 엄격화

**변경 내용**: `FileCommandLoader`의 TOML 검증에 Zod 스키마가 적용됨

```javascript
// Gemini CLI v0.34.0 - FileCommandLoader.js
const TomlCommandDefSchema = z.object({
    prompt: z.string({ required_error: "The 'prompt' field is required." }),
    description: z.string().optional(),
});
```

**허용 구조** (Top-level만):
```toml
description = "커맨드 설명"
prompt = """커맨드 프롬프트"""
```

**거부되는 구조** (`[command]` 섹션 + `name` 필드):
```toml
[command]           # ❌ 섹션 사용 불가
name = "simplify"   # ❌ name 필드 불필요 (파일명에서 자동 추출)
description = "..."
prompt = """..."""
```

**영향받는 파일** (6개):
| 파일 | 원인 | 상태 |
|------|------|------|
| `commands/simplify.toml` | `[command]` + `name` | ✅ 수정 완료 |
| `commands/batch.toml` | `[command]` + `name` | ✅ 수정 완료 |
| `commands/loop.toml` | `[command]` + `name` | ✅ 수정 완료 |
| `commands/plan-plus.toml` | `[command]` + `name` | ✅ 수정 완료 |
| `commands/pm-discovery.toml` | `[command]` + `name` | ✅ 수정 완료 |
| `commands/output-style-setup.toml` | `[command]` + `name` | ✅ 수정 완료 |

**근본 원인**: v1.5.8에서 6개 신규 커맨드를 추가할 때 `[command]` 섹션 포맷을 사용했으나, v0.34.0의 Zod 스키마가 top-level `prompt` 필수로 엄격 검증하면서 거부됨. 기존 18개 커맨드는 처음부터 flat 포맷을 사용하여 정상 작동.

### 2.2 New Features (통합 대상)

#### NF-1: Skills System (Native Agent Skills)

**핵심 구성요소**:
- `SkillCommandLoader` - SKILL.md 기반 스킬을 슬래시 커맨드로 로드
- `ACTIVATE_SKILL_TOOL_NAME` - 스킬 활성화 빌트인 도구
- `CommandKind.SKILL` - 새로운 커맨드 타입
- `SkillManager` - 스킬 등록/활성화/비활성화 관리
- `skillSettings.js` - 스코프별 스킬 설정 (user/workspace)
- `skillUtils.js` - Git/로컬/ZIP 소스에서 스킬 설치

**CLI 명령어**:
```bash
gemini skills install <source> [--scope user|workspace] [--path subdir]
gemini skills link <path> [--scope user|workspace]
gemini skills list
gemini skills enable <name>
gemini skills disable <name>
gemini skills uninstall <name>
```

**bkit 영향**: bkit의 35개 스킬을 네이티브 Skills 시스템으로 연동할 수 있는 기회. 현재 bkit 스킬은 TOML 커맨드 → SKILL.md `@import` 방식인데, 네이티브 스킬 시스템을 활용하면 `activate_skill` 도구를 통한 더 나은 UX 제공 가능.

#### NF-2: ACP (Agent Client Protocol)

**핵심 구성요소**:
- `@agentclientprotocol/sdk` 통합
- `acpClient.js` - ACP 클라이언트/에이전트 구현
- `GeminiAgent` 클래스 - 멀티세션, 인증, 파일시스템 서비스
- JSON-RPC 스트리밍 (stdin/stdout)

**인증 방식**: Google Login, Gemini API Key, Vertex AI, AI API Gateway

**bkit 영향**: 향후 bkit 에이전트를 ACP 프로토콜로 표준화할 수 있는 기반. 현재는 직접 활용보다 호환성 확인 수준.

#### NF-3: Extension Registry Client

**핵심 구성요소**:
- `ExtensionRegistryClient` - 중앙 확장 레지스트리 클라이언트
- 기본 레지스트리 URL: `https://geminicli.com/extensions.json`
- Fuzzy 검색 (`fzf` 라이브러리 사용)
- 페이지네이션, 정렬 (ranking, alphabetical)

**bkit 영향**: bkit를 공식 Extension Registry에 등록하여 `gemini extensions install bkit` 방식의 설치 지원 가능.

#### NF-4: Extension Validation

**핵심 구성요소**:
- `gemini extensions validate <path>` 명령어
- Context 파일 존재 확인
- SemVer 버전 검증
- `ExtensionManager.loadExtensionConfig()` 활용

**bkit 영향**: CI/CD에서 자동 검증 파이프라인 구축 가능.

#### NF-5: Hook Migration (Claude → Gemini)

**핵심 구성요소**:
- `gemini hooks migrate` 명령어
- 이벤트 이름 매핑: PreToolUse → BeforeTool, PostToolUse → AfterTool 등
- 도구 이름 매핑: Edit → replace, Bash → run_shell_command 등
- 환경변수 매핑: $CLAUDE_PROJECT_DIR → $GEMINI_PROJECT_DIR

**bkit 영향**: bkit의 hook-adapter.js가 이미 유사 기능을 제공하지만, 공식 마이그레이션 도구와의 호환성 확인 필요.

#### NF-6: Slash Command Conflict Resolution

**핵심 구성요소**:
- `SlashCommandConflictHandler` - 충돌 감지 및 알림
- `SlashCommandResolver` - 충돌 해결 (renaming)
- `CommandService` - 모든 로더(Builtin, File, Skill, MCP) 통합 관리

**커맨드 로드 순서**: User → Project → Extensions (알파벳순)
- User/Project 커맨드: "last wins" 전략
- Extension 커맨드: 충돌 시 이름 변경 (namespace prefixing)

**bkit 영향**: bkit 커맨드가 다른 확장이나 사용자 커맨드와 충돌할 경우 자동으로 `bkit:commandName` 형태로 renamed. 커맨드 이름 설계 시 고려 필요.

#### NF-7: New Built-in Tools

v0.34.0에서 추가된 빌트인 도구:

| 도구 | 설명 | bkit 영향 |
|------|------|----------|
| `activate_skill` | 스킬 활성화 | 스킬 시스템 통합 시 활용 |
| `ask_user` | 사용자 질문 (옵션 선택) | 에이전트 상호작용 개선 가능 |
| `enter_plan_mode` | 플랜 모드 진입 | PDCA Plan 단계 연동 |
| `exit_plan_mode` | 플랜 모드 종료 | PDCA Plan 단계 연동 |
| `get_internal_docs` | 내부 문서 조회 | 문서 기반 참조 |

Plan Mode 도구 목록:
```
glob, grep, read_file, ls, web_search, ask_user, activate_skill
```

#### NF-8: Gemini 3.1 모델 지원

새로 추가된 모델 상수:
- `PREVIEW_GEMINI_3_1_MODEL`
- `PREVIEW_GEMINI_3_1_CUSTOM_TOOLS_MODEL`
- `DEFAULT_GEMINI_MODEL_AUTO`
- `PREVIEW_GEMINI_MODEL_AUTO`

**bkit 영향**: 에이전트 프론트매터에서 모델 지정 시 참고.

#### NF-9: Theme 디렉토리 재구성

v0.34.0에서 테마 디렉토리가 `dark/`와 `light/` 서브디렉토리로 재구성됨.

**bkit 영향**: bkit의 output-styles/ 디렉토리는 테마와 무관하므로 직접 영향 없음. 단, 향후 테마 확장 시 참고.

#### NF-10: 추가 CLI 명령어

- **`/upgrade`** - CLI 업그레이드 명령어 (신규)
- **`/compact`** - `/compress` 별칭 (신규)
- **`gemini extensions uninstall --all`** - 전체 확장 제거 옵션
- **`gemini extensions validate`** - 확장 검증

#### NF-11: Subagent 정책 지원

TOML 정책 파일에서 `subagent` 필드로 서브에이전트별 정책 정의 가능:
```toml
[[rule]]
toolName = "run_shell_command"
decision = "deny"
priority = 100
subagent = "my-restricted-agent"
```

**bkit 영향**: bkit의 21개 에이전트에 대해 에이전트별 세밀한 정책 적용 가능. 보안 강화 기회.

#### NF-12: LXC/gVisor 샌드박스

실험적 컨테이너 기반 샌드박싱 지원. bkit 현재 scope에서는 직접 활용 불필요.

#### NF-13: contextFileName 배열 지원

```javascript
// 이전: 단일 문자열만
contextFileName: "GEMINI.md"

// v0.34.0: 배열도 지원
contextFileName: ["GEMINI.md", "ADDITIONAL_CONTEXT.md"]
```

**bkit 영향**: 다중 컨텍스트 파일 지원으로 GEMINI.md 분리 가능.

### 2.3 New CommandKind Types

| Kind | 설명 | 로더 |
|------|------|------|
| `built-in` | 내장 명령어 (help, clear 등) | BuiltinCommandLoader |
| `user-file` | 사용자 TOML (~/.gemini/commands/) | FileCommandLoader |
| `workspace-file` | 프로젝트 TOML (.gemini/commands/) | FileCommandLoader |
| `extension-file` | 확장 TOML (extensions/*/commands/) | FileCommandLoader |
| `mcp-prompt` | MCP 서버 프롬프트 | McpPromptLoader |
| `agent` | 에이전트 (기존) | - |
| **`skill`** | **네이티브 스킬 (신규)** | **SkillCommandLoader** |

### 2.4 Prompt Processor 시스템

TOML 커맨드의 프롬프트 처리 파이프라인:

1. **`@{...}` (AtFileProcessor)**: 파일 내용 주입 (보안 우선 처리)
2. **`!{...}` (ShellProcessor)**: 셸 명령어 실행 결과 주입
3. **`{{args}}` (DefaultArgumentProcessor)**: 사용자 인자 주입

**보안 주의**: `@{extensionPath}` 변수가 v0.34.0에서도 지원되는지 확인 필요. `VARIABLE_SCHEMA`에 `extensionPath`가 정의되어 있음을 확인.

---

## 3. Scope

### 3.1 In Scope

- [x] **S-1**: TOML 커맨드 파일 6개 수정 (BC-1 대응) — ✅ 완료
- [ ] **S-2**: version-detector.js에 v0.34.0 Feature Flags 추가
- [ ] **S-3**: tool-registry.js에 새 빌트인 도구 등록
- [ ] **S-4**: bkit.config.json 호환성 정보 업데이트
- [ ] **S-5**: gemini-extension.json 버전 v1.5.9로 업데이트
- [ ] **S-6**: GEMINI.md, CHANGELOG.md 업데이트
- [ ] **S-7**: session-start.js에 v0.34.0 기능 감지 통합
- [ ] **S-8**: 테스트 스위트 추가 (v0.34.0 Feature Flag 검증)
- [ ] **S-9**: Skills 시스템 연동 준비 (탐색적)
- [ ] **S-10**: Extension Validation 호환 확인
- [ ] **S-11**: Slash Command Conflict 대응 검토
- [ ] **S-12**: nightly version 파싱 개선 (`0.34.0-nightly.20260304.28af4e127` 형태 지원)

### 3.2 Out of Scope

- ACP 프로토콜 완전 구현 (향후 v1.6.0+)
- Extension Registry 등록 (별도 작업)
- Skills 시스템으로의 완전 마이그레이션 (향후 검토)
- v0.35.0 nightly 기능 선행 대응

---

## 4. Requirements

### 4.1 Functional Requirements

#### FR-1: TOML 호환성 (완료)
| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-1.1 | 6개 TOML 파일에서 `[command]` 섹션 제거 | P0 ✅ |
| FR-1.2 | 6개 TOML 파일에서 `name` 필드 제거 | P0 ✅ |
| FR-1.3 | 24개 전체 TOML 파일이 Zod 스키마 통과 확인 | P0 ✅ |

#### FR-2: Version Detection
| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-2.1 | v0.34.0+ Feature Flags 추가 (Skills, ACP, Registry 등) | P0 |
| FR-2.2 | nightly 버전 형식 `0.34.0-nightly.20260304.28af4e127` 파싱 지원 | P1 |
| FR-2.3 | getBkitFeatureFlags()에 새 기능 게이트 추가 | P0 |
| FR-2.4 | testedVersions에 v0.34.0 추가 | P0 |

#### FR-3: Tool Registry
| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-3.1 | `activate_skill` 도구 등록 | P1 |
| FR-3.2 | `ask_user` 도구 등록 | P1 |
| FR-3.3 | `enter_plan_mode` / `exit_plan_mode` 도구 등록 | P1 |
| FR-3.4 | `get_internal_docs` 도구 등록 | P2 |
| FR-3.5 | 도구 어노테이션 업데이트 | P2 |

#### FR-4: Configuration Updates
| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-4.1 | bkit.config.json - compatibility.testedVersions에 "0.34.0" 추가 | P0 |
| FR-4.2 | bkit.config.json - Skills 시스템 설정 섹션 추가 | P1 |
| FR-4.3 | gemini-extension.json - version "1.5.9" 업데이트 | P0 |
| FR-4.4 | GEMINI.md - 버전 v1.5.9 업데이트 | P0 |

#### FR-5: Session Start Integration
| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-5.1 | v0.34.0 기능 감지 결과를 세션 메타데이터에 포함 | P1 |
| FR-5.2 | Skills 시스템 활성화 상태 확인 로직 | P2 |

#### FR-6: Slash Command Conflict Handling
| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-6.1 | bkit 커맨드 이름 충돌 가능성 분석 | P2 |
| FR-6.2 | 빌트인 커맨드와 충돌하는 이름 확인 (help, clear, settings 등) | P2 |

### 4.2 Non-Functional Requirements

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| NFR-1 | v0.29.0 ~ v0.34.0 전 버전 하위 호환성 유지 | P0 |
| NFR-2 | version-detector 실행 시간 3초 미만 유지 | P1 |
| NFR-3 | 테스트 커버리지 90% 이상 | P1 |

---

## 5. Plan-Plus 브레인스토밍 분석

### 5.1 의도 탐색 (Intent Discovery)

**핵심 목표**: Gemini CLI v0.34.0 호환성 확보 + 신기능 활용 + 확장 안정성 강화

**사용자 가치**:
1. bkit 확장이 최신 Gemini CLI에서 오류 없이 동작
2. 새 Skills/ACP 기능을 통한 더 나은 개발 경험
3. 향후 업그레이드에 대한 견고한 기반

### 5.2 대안 비교

| 접근 방식 | 장점 | 단점 | 채택 |
|-----------|------|------|------|
| A: TOML 수정만 (최소) | 빠른 수정, 리스크 낮음 | 신기능 미활용, 향후 재작업 | ❌ |
| B: 호환성 업데이트 (중간) | 체계적, Feature Flag 관리 | Skills 완전 통합 미포함 | ✅ 채택 |
| C: Skills 전면 마이그레이션 (최대) | 최신 UX, 완전 통합 | 대규모 변경, 하위 호환성 리스크 | ❌ (향후) |

**채택 근거**: B안(호환성 업데이트)이 안정성과 진보성의 최적 균형. TOML 수정은 이미 완료, Feature Flags와 설정 업데이트로 v0.34.0 완전 지원. Skills 전면 마이그레이션은 v1.6.0에서 별도 작업으로 진행.

### 5.3 YAGNI 검토

| 후보 기능 | 판정 | 근거 |
|-----------|------|------|
| ACP 완전 구현 | YAGNI | 현재 bkit 에이전트 아키텍처와 다른 패러다임, 시기상조 |
| Extension Registry 등록 | YAGNI | 별도 작업, 이번 scope 아님 |
| Skills 전면 마이그레이션 | YAGNI | 대규모 변경, 별도 계획 필요 |
| contextFileName 배열 활용 | YAGNI | 현재 단일 GEMINI.md로 충분 |
| Gemini 3.1 모델 설정 | Keep | 에이전트 프론트매터에 모델 옵션 추가 유용 |
| Hook Migration 도구 호환 | Keep | bkit의 hook-adapter와의 호환성 확인 필요 |
| nightly 버전 파싱 개선 | Keep | 기존 parseVersion이 해시 포함 nightly 미지원 |

---

## 6. Technical Design

### 6.1 version-detector.js 변경

```javascript
// v0.34.0+ Feature Flags 추가
// v0.34.0+
hasNativeSkillSystem: isVersionAtLeast('0.34.0'),
hasACP: isVersionAtLeast('0.34.0'),
hasExtensionRegistryClient: isVersionAtLeast('0.34.0'),
hasExtensionValidation: isVersionAtLeast('0.34.0'),
hasHookMigration: isVersionAtLeast('0.34.0'),
hasSlashCommandConflictResolution: isVersionAtLeast('0.34.0'),
hasMcpPromptLoader: isVersionAtLeast('0.34.0'),
hasAskUserTool: isVersionAtLeast('0.34.0'),
hasPlanModeTool: isVersionAtLeast('0.34.0'),
hasGetInternalDocsTool: isVersionAtLeast('0.34.0'),
hasContextFileNameArray: isVersionAtLeast('0.34.0'),
hasGemini31CustomTools: isVersionAtLeast('0.34.0'),
hasToolLegacyAliases: isVersionAtLeast('0.34.0'),
hasStrictTomlValidation: isVersionAtLeast('0.34.0'),
```

### 6.2 nightly 버전 파싱 개선

```javascript
// 현재: "0.34.0-nightly.20260304" 까지만 파싱
// 개선: "0.34.0-nightly.20260304.28af4e127" 해시 포함 형태도 지원
const match = raw.match(/^(\d+)\.(\d+)\.(\d+)(-(?:preview\.(\d+)|nightly\.(\d+)(?:\.[a-f0-9]+)?))?/);
```

### 6.3 tool-registry.js 변경

```javascript
// 새 빌트인 도구 추가 (v0.34.0+)
'activate_skill': {
  description: 'Activate a specialized agent skill',
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true
},
'ask_user': {
  description: 'Ask the user a question with structured options',
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true
},
'enter_plan_mode': {
  description: 'Enter plan mode for read-only exploration',
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true
},
'exit_plan_mode': {
  description: 'Exit plan mode and submit the plan',
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false
},
'get_internal_docs': {
  description: 'Get internal documentation by path',
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true
}
```

### 6.4 bkit.config.json 변경

```json
{
  "compatibility": {
    "testedVersions": ["0.29.0", "0.29.5", "0.29.7", "0.30.0-preview.3", "0.30.0", "0.31.0", "0.32.0", "0.32.1", "0.33.0-preview.4", "0.33.0", "0.34.0"],
    "skillsSystem": {
      "enabled": true,
      "minVersion": "0.34.0",
      "nativeActivation": false
    }
  }
}
```

---

## 7. Implementation Plan

### Phase 1: 즉시 수정 (P0) — ✅ 완료
| 항목 | 파일 | 상태 |
|------|------|------|
| TOML 6개 파일 수정 | commands/*.toml | ✅ 완료 |

### Phase 2: Feature Flags & Tool Registry (P0)
| 항목 | 파일 | 예상 변경량 |
|------|------|-----------|
| v0.34.0 Feature Flags | lib/adapters/gemini/version-detector.js | ~30줄 추가 |
| nightly 파싱 개선 | lib/adapters/gemini/version-detector.js | ~5줄 수정 |
| 새 빌트인 도구 등록 | lib/adapters/gemini/tool-registry.js | ~30줄 추가 |
| bkit Feature Flags | lib/adapters/gemini/version-detector.js | ~10줄 추가 |

### Phase 3: Configuration & Metadata (P0)
| 항목 | 파일 | 예상 변경량 |
|------|------|-----------|
| testedVersions 추가 | bkit.config.json | ~1줄 |
| skills 설정 추가 | bkit.config.json | ~5줄 |
| 버전 업데이트 | gemini-extension.json | ~1줄 |
| GEMINI.md 업데이트 | GEMINI.md | ~2줄 |
| CHANGELOG 업데이트 | CHANGELOG.md | ~50줄 |

### Phase 4: Session Integration (P1)
| 항목 | 파일 | 예상 변경량 |
|------|------|-----------|
| v0.34.0 기능 감지 | hooks/scripts/session-start.js | ~15줄 |
| 메타데이터 확장 | hooks/scripts/session-start.js | ~10줄 |

### Phase 5: Testing (P1)
| 항목 | 파일 | 예상 변경량 |
|------|------|-----------|
| v0.34.0 Feature Flag 테스트 | tests/tc-XX-v034-features.js | 신규 |
| TOML 검증 테스트 | tests/tc-XX-toml-validation.js | 신규 |
| 통합 테스트 | tests/tc-XX-v034-integration.js | 신규 |

---

## 8. Risk Analysis

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| v0.35.0에서 추가 breaking change | 중 | 중 | Feature Flag 기반 분기로 격리 |
| Skills 시스템과 TOML 커맨드 충돌 | 낮 | 중 | SlashCommandResolver가 자동 해결 |
| 하위 버전 호환성 깨짐 | 낮 | 높 | isVersionAtLeast() 가드 사용 |
| ACP가 extension 아키텍처 변경 | 낮 | 높 | 현 시점에서는 모니터링만 |

---

## 9. Success Criteria

| 기준 | 측정 방법 | 목표값 |
|------|----------|-------|
| TOML 파일 로드 성공률 | gemini CLI 실행 시 에러 메시지 0건 | 24/24 (100%) |
| Feature Flag 정확도 | v0.34.0 감지 시 모든 플래그 true | 14/14 (100%) |
| 하위 호환성 | v0.29.0 환경에서 정상 동작 | 100% |
| 테스트 통과율 | 신규 테스트 스위트 | 100% |

---

## 10. Appendix

### A. Gemini CLI v0.34.0 파일 구조 (주요)

```
dist/src/
├── acp/                          # 🆕 ACP (Agent Client Protocol)
│   ├── acpClient.js
│   ├── acpErrors.js
│   ├── commandHandler.js
│   ├── commands/
│   └── fileSystemService.js
├── commands/
│   ├── extensions/
│   │   └── validate.js           # 🆕 Extension 검증
│   ├── hooks/
│   │   └── migrate.js            # 🆕 Hook 마이그레이션
│   ├── skills/                   # 🆕 Skills CLI
│   │   ├── install.js
│   │   ├── link.js
│   │   ├── list.js
│   │   ├── enable.js
│   │   ├── disable.js
│   │   └── uninstall.js
│   └── mcp/
├── config/
│   ├── extensionRegistryClient.js # 🆕 Registry 클라이언트
│   └── extensions/
│       └── variableSchema.js      # extensionPath, workspacePath 등
├── services/
│   ├── FileCommandLoader.js       # 🔄 Zod 스키마 강화
│   ├── SkillCommandLoader.js      # 🆕 Skills 로더
│   ├── CommandService.js          # 🔄 통합 커맨드 관리
│   ├── SlashCommandConflictHandler.js # 🆕 충돌 핸들러
│   ├── SlashCommandResolver.js    # 🆕 충돌 리졸버
│   ├── McpPromptLoader.js         # 🆕 MCP 프롬프트 로더
│   └── prompt-processors/
│       ├── argumentProcessor.js
│       ├── atFileProcessor.js     # @{} 처리
│       ├── shellProcessor.js      # !{} 처리
│       └── types.js               # {{args}}, !{, @{ 정의
└── utils/
    ├── skillSettings.js           # 🆕 스킬 설정
    └── skillUtils.js              # 🆕 스킬 설치/관리
```

### B. Built-in Tool Names (v0.34.0 전체)

```javascript
ALL_BUILTIN_TOOL_NAMES = [
  'glob', 'write_todos', 'write_file', 'web_search', 'web_fetch',
  'replace', 'run_shell_command', 'grep', 'read_many_files', 'read_file',
  'ls', 'memory',
  'activate_skill',        // 🆕
  'ask_user',              // 🆕
  'tracker_create_task', 'tracker_update_task', 'tracker_get_task',
  'tracker_list_tasks', 'tracker_add_dependency', 'tracker_visualize',
  'get_internal_docs',     // 🆕
  'enter_plan_mode',       // 🆕
  'exit_plan_mode'         // 🆕
];
```

### C. TOML 커맨드 파일 규격 (v0.34.0)

```toml
# 필수: prompt (string)
# 선택: description (string)
# ※ 그 외 top-level 키는 Zod 스키마에 의해 strip됨 (에러는 아님)
# ※ [section] 사용 시 구조가 중첩되어 top-level prompt 없음으로 거부됨

description = "커맨드 설명 (100자 제한, sanitizeForDisplay 적용)"
prompt = """
프롬프트 내용

사용 가능한 변수/구문:
- @{extensionPath}  : 확장 루트 경로 (AtFileProcessor)
- @{workspacePath}   : 워크스페이스 경로
- {{args}}          : 사용자 입력 인자 (DefaultArgumentProcessor)
- !{command}        : 셸 명령어 실행 결과 주입 (ShellProcessor)
- @path/to/file     : 파일 내용 주입 (@import)

※ @{} 우선 처리 → !{} / {{args}} 처리 → Default 인자 처리
※ {{args}} 미사용 시 사용자 입력이 프롬프트 끝에 자동 추가
"""
```

---

*Generated by CTO Team (8-agent orchestration) via Plan-Plus brainstorming methodology*
*bkit Vibecoding Kit v1.5.9 - Gemini CLI v0.34.0 Migration*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
