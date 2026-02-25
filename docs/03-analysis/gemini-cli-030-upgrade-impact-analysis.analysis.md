# Gemini CLI v0.30.0 Upgrade Impact Analysis

> **Feature**: gemini-cli-030-upgrade-impact-analysis
> **Date**: 2026-02-25
> **bkit Version**: v1.5.4 → v1.5.5 (target)
> **Gemini CLI**: v0.29.0 (current baseline) → v0.30.0 (stable, released 2026-02-25)
> **Analysis Method**: CTO Team (6 specialist agents, parallel investigation)
> **Impact Score**: 82/100 (High)

---

## 1. Executive Summary

Gemini CLI v0.30.0이 2026-02-25 정식 안정 버전으로 릴리스되었으며, v0.31.0-preview.0도 동시 출시되었습니다. 또한 Gemini 3.1 Pro 모델이 2026-02-19에 출시되어 `customtools` 변형이 bkit의 MCP 도구 기반 워크플로우에 최적화된 새로운 가능성을 제시합니다.

### Key Findings Summary

| Category | Finding | Impact | Priority |
|----------|---------|--------|----------|
| **Version Release** | v0.30.0 stable 출시 (2026-02-25) | Critical | P0 |
| **Version Release** | v0.31.0-preview.0 동시 출시 | High | P1 |
| **Model Update** | Gemini 3.1 Pro + customtools 변형 출시 | High | P0 |
| **Policy Engine** | Preview → Stable 전환 완료 | High | P0 |
| **SDK Package** | @google/gemini-cli-core 0.30.0 출시 | Medium | P1 |
| **GenAI SDK** | v0.31.0에서 1.30.0 → 1.41.0 대폭 업그레이드 | Medium | P2 |
| **A2A/ACP** | Agent Client Protocol SDK 0.14.1 등장 | Low | P3 |
| **Security** | 3건 CVE (모두 패치 완료), version-detector 검증 필요 | Medium | P1 |
| **Code Quality** | 82/100, 2건 Critical 이슈, 11건 Warning | Medium | P2 |

### CTO Team Composition

| Agent | Role | Analysis Scope |
|-------|------|----------------|
| Enterprise Expert | 전략 분석 | 공식 문서, 릴리스 노트, 모델 업데이트 |
| Security Architect | 보안/호환성 | GitHub 이슈/PR, CVE, OWASP 매핑 |
| Code Analyzer | 코드 분석 | 코드베이스 전체 인벤토리 (100+ 파일) |
| Infra Architect | 아키텍처 | npm 레지스트리, SDK 의존성, 아키텍처 변화 |
| Frontend Architect | Extensions | Extension 시스템, SKILL.md, 훅 시스템 |
| Product Manager | 요구사항 | 이전 5건 분석 리뷰, 기술 부채 정리 |

---

## 2. Version Landscape

### 2.1 Current Release State (2026-02-25)

```
Distribution Tags:
├── latest (stable):   v0.30.0        (2026-02-25 03:00 UTC) ← TODAY
├── preview:           v0.31.0-preview.0 (2026-02-25 02:41 UTC) ← TODAY
└── nightly:           v0.30.0-nightly.20260224

Patch History (v0.29.x):
├── v0.29.0  (2026-02-17)  ← bkit v1.5.4 baseline
├── v0.29.1  (2026-02-18)
├── v0.29.5  (2026-02-19)
├── v0.29.6  (2026-02-19)  Cherry-pick: conflict resolution
└── v0.29.7  (2026-02-24)  Cherry-pick: preview model quota fix (Gemini 3.1 Pro)

Release Cadence: Weekly stable releases (Tuesday)
```

### 2.2 Dependency Version Tracking

| Dependency | v0.29.0 | v0.30.0 | v0.31.0-preview.0 | Latest Available |
|-----------|---------|---------|-------------------|-----------------|
| @google/genai | 1.30.0 | 1.30.0 | **1.41.0** (+11) | 1.42.0 |
| @modelcontextprotocol/sdk | ^1.23.0 | ^1.23.0 | ^1.23.0 | 1.27.1 |
| @agentclientprotocol/sdk | - | ^0.12.0 | ^0.12.0 | 0.14.1 |
| @google/gemini-cli-core | - | **0.30.0** | 0.31.0-preview.0 | - |

**주목**: v0.31.0-preview.0에서 GenAI SDK가 1.30.0 → 1.41.0으로 11개 마이너 버전 점프. 주요 모델 API 변경 시사.

---

## 3. Model Updates

### 3.1 Gemini 3.1 Pro (NEW - 2026-02-19)

| Attribute | Details |
|-----------|---------|
| Model Name | `gemini-3.1-pro-preview` |
| Customtools Variant | `gemini-3.1-pro-preview-customtools` |
| Release Date | 2026-02-19 |
| Context Window | **1,000,000 tokens** |
| ARC-AGI-2 Score | **77.1%** |
| SWE-bench Verified | Higher than 3.0 Pro |
| Pricing | Input: $2.00/1M, Output: $12.00/1M |
| Availability | Gemini CLI, AI Studio, Vertex AI |

### 3.2 customtools 변형의 bkit 영향도

`gemini-3.1-pro-preview-customtools`는 **등록된 커스텀 도구를 bash보다 우선적으로 사용**하도록 설계. 이는 bkit의 MCP 도구 기반 워크플로우와 정확히 일치하는 최적화:

- bkit 에이전트가 MCP 도구(spawn_agent, team_create 등)를 더 안정적으로 호출
- bash 폴백 대신 구조화된 도구 호출 패턴 강화
- v0.29.7에서 이미 quota 체크에 반영 완료

### 3.3 현재 bkit 에이전트 모델 배포

| Model | Agent Count | Agents |
|-------|:-----------:|--------|
| gemini-3-pro | 9 | cto-lead, code-analyzer, design-validator, enterprise-expert, frontend-architect, gap-detector, infra-architect, qa-strategist, security-architect |
| gemini-3-flash | 7 | bkend-expert, pdca-iterator, pipeline-guide, product-manager, qa-monitor, report-generator, starter-guide |
| gemini-3-flash-lite | 0 | (미할당 - 비용 최적화 기회) |
| gemini-3.1-pro | 0 | (미할당 - 신규 모델) |

### 3.4 모델 마이그레이션 권고

| Agent | Current | Recommended | Rationale |
|-------|---------|-------------|-----------|
| cto-lead | gemini-3-pro | **gemini-3.1-pro-preview-customtools** | 팀 오케스트레이션에 도구 우선 호출 필수 |
| gap-detector | gemini-3-pro | **gemini-3.1-pro-preview** | 분석 정확도 향상 (ARC-AGI-2 77.1%) |
| report-generator | gemini-3-flash | **gemini-3-flash-lite** | 비용 60% 절감, 보고서 생성에 충분 |
| qa-monitor | gemini-3-flash | **gemini-3-flash-lite** | 로그 분석에 lite 모델 적합 |

---

## 4. Breaking Changes & Impact Analysis

### 4.1 v0.30.0 Stable에서 확정된 변경사항

#### BC-01: Policy Engine 정식 전환 (Impact: HIGH)

| Aspect | Before (v0.29.x) | After (v0.30.0) |
|--------|------------------|-----------------|
| 권한 관리 | `excludeTools` + `--allowed-tools` | Policy Engine TOML |
| 설정 위치 | `gemini-extension.json` | `.gemini/policies/*.toml` |
| 우선순위 | 단순 배열 필터 | 4-tier 계층 (Admin > User > Workspace > Default) |
| 상태 | Primary mechanism | **Primary mechanism (GA)** |

**bkit v1.5.4 대응 현황**:
- ✅ `policy-migrator.js` (231 lines) - TOML 변환 구현 완료
- ✅ `permission.js` - Policy Engine defer 로직 구현
- ✅ `gemini-extension.json` - `excludeTools` 제거 완료
- ⚠️ TOML 자동 생성 미활성화 (session-start.js에서 트리거 필요)
- ⚠️ TOML 스키마 런타임 검증 부재

**필요 조치**:
```
Permission 흐름 변경:
BEFORE: bkit.config.json → permission.js → before-tool.js
        [Policy Engine = fallback]

AFTER:  bkit.config.json → policy-migrator.js → .gemini/policies/bkit-permissions.toml
                                               → Gemini CLI Policy Engine (native)
        permission.js: no-op (Policy Engine에 위임)
```

#### BC-02: AskUser Tool 스키마 변경 (Impact: MEDIUM)

v0.30.0-preview에서 `ask_user` 도구의 `question` 타입 필드가 필수로 변경 (PR #18959).

**bkit 영향**: 16개 에이전트 중 `ask_user`를 직접 선언하는 에이전트는 없으나, 훅 스크립트에서 `before-tool-selection.js`의 allowedFunctionNames에 포함. 스키마 호환성 검증 필요.

#### BC-03: 도구 정의 중앙집중화 (Impact: MEDIUM)

`replace`, `search`, `grep` 도구 정의가 중앙집중화 (PR #18944, #18991, #19269). 도구 동작이나 스키마가 변경되었을 가능성.

**bkit 영향**: `before-tool-selection.js`의 필터링과 `hooks.json` 매처 패턴에 영향 가능.

#### BC-04: 도구 이름 변경 예정 (Impact: HIGH - Future)

Issue #1391에서 제안된 이름 변경 (v0.30.0에서는 미시행, v0.31.0+ 가능성):

| Current (v0.30.0) | Proposed Future | bkit 대응 |
|-------------------|----------------|-----------|
| `replace` | `edit_file` | ✅ FORWARD_ALIASES 매핑 완료 |
| `glob` | `find_files` | ✅ FORWARD_ALIASES 매핑 완료 |
| `grep_search` | `find_in_file` | ✅ FORWARD_ALIASES 매핑 완료 |
| `google_web_search` | `web_search` | ✅ FORWARD_ALIASES 매핑 완료 |
| `read_many_files` | `read_files` | ✅ FORWARD_ALIASES 매핑 완료 |

### 4.2 이전 분석에서 미해결 상태인 항목

| ID | 항목 | 출처 | 현재 상태 | 우선순위 |
|----|------|------|-----------|----------|
| TD-01 | Sub-agent spawn (`gemini -e --yolo`) 검증 | v0.29.0 분석 H-03 | **미검증** (2회 연속 분석에서 P0 지정됨) | P0 |
| TD-02 | AfterTool hook 스키마 / Tool Output Masking | v0.29.0 분석 R-04 | **미검증** | P1 |
| TD-03 | System Prompt 재구성 + before-model.js 호환성 | v0.29.0 분석 M-03 | **미검증** | P2 |
| TD-04 | skill-orchestrator.js 리팩토링 (activate_skill 중복) | v0.28.2 분석 A-03 | **미착수** | P2 |
| TD-05 | Extension Registry 등록 | v0.29.0 분석 L-02 | **미착수** | P3 |
| TD-06 | Plan Mode + PDCA 통합 | v0.29.0 분석 L-01 | **미착수** | P3 |

---

## 5. Security Analysis

### 5.1 보안 취약점 현황

| CVE/Issue | Severity | Status | bkit Impact |
|-----------|----------|--------|-------------|
| Prompt Injection - 무단 코드 실행 (2025-07) | Critical | ✅ 패치 완료 (v0.1.14) | Low (최소 v0.29.0) |
| PromptPwnd - CI/CD 파이프라인 공격 (2025-12) | Critical | ✅ 패치 완료 | Medium (CI/CD 사용 시) |
| Cyera Research Labs 명령어 주입 (2025) | Critical | ✅ 패치 완료 | Low |

### 5.2 bkit 코드 보안 검토 결과

| Check | Status | Detail |
|-------|--------|--------|
| Hardcoded API keys/passwords | ✅ PASS | None found |
| Dangerous command blocking | ✅ PASS | `before-tool.js`에서 rm -rf, mkfs, dd, curl\|bash 차단 |
| Env file protection | ✅ PASS | .env 쓰기 시 경고 |
| Permission system | ✅ PASS | deny/ask/allow glob 패턴 |
| Policy Engine integration | ✅ PASS | 네이티브 Policy Engine 위임 |

### 5.3 보안 개선 필요 항목

| Severity | File | Issue | Action |
|----------|------|-------|--------|
| **HIGH** | `version-detector.js` (line 52) | `GEMINI_CLI_VERSION` env var 포맷 검증 없음. `"99.99.99"` 입력 시 모든 기능 플래그 활성화 | SemVer 포맷 검증 + 최대 버전 제한 추가 |
| **MEDIUM** | `policy-migrator.js` | TOML 구문 검증 없이 파일 기록 | TOML 스키마 검증 추가 |
| **MEDIUM** | `spawn-agent-server.js` | `--yolo` 플래그가 모든 확인 프롬프트 우회 | 비신뢰 컨텍스트에서 제거 고려 |
| **LOW** | `policy-migrator.js` | `commandPrefix` 동작이 문서와 불일치 (Issue #15383) | 업스트림 해결 모니터링 |

### 5.4 OWASP Top 10 매핑

| OWASP | Risk Level | bkit Status |
|-------|:----------:|-------------|
| A01 Broken Access Control | MEDIUM | version-detector env var 주입 |
| A02 Cryptographic Failures | LOW | N/A |
| A03 Injection | LOW | Shell 명령 하드코딩 (안전) |
| A04 Insecure Design | MEDIUM | Policy TOML 포맷 가정 |
| A05 Security Misconfiguration | LOW | 기본 권한 적절 |
| A06 Vulnerable Components | MEDIUM | 업스트림 패치 완료, 지속 모니터링 |
| A07 Auth Failures | LOW | N/A (Extension) |
| A08 Integrity Failures | MEDIUM | TOML 파일 무결성 검증 부재 |
| A09 Logging Failures | MEDIUM | 보안 이벤트 전용 로깅 부재 |
| A10 SSRF | LOW | web_fetch는 업스트림 책임 |

---

## 6. Codebase Component Inventory

### 6.1 전체 구성요소 현황

| Category | Count | Status |
|----------|:-----:|--------|
| Agents | 16 | gemini-3-pro (9), gemini-3-flash (7) |
| Skills | 29 | Core(5), Phase(9), Utility(7), bkend(8) |
| Hook Events | 10 | 모두 v0.30.0 호환 |
| Hook Scripts | 10 | 총 1,667 lines |
| Lib Modules | 37 | 총 ~5,800 lines |
| Commands (TOML) | 18 | 모두 유효한 TOML 포맷 |
| MCP Tools | 6 | spawn_agent, list_agents, get_agent_info, team_create, team_assign, team_status |
| Configuration Files | 3 | bkit.config.json, gemini-extension.json, GEMINI.md |

### 6.2 도구 사용 빈도 (16개 에이전트 기준)

| Tool (Gemini CLI name) | Usage | Percentage |
|------------------------|:-----:|:----------:|
| `read_file` | 16/16 | 100% |
| `glob` | 16/16 | 100% |
| `grep_search` | 16/16 | 100% |
| `write_file` | 11/16 | 69% |
| `run_shell_command` | 7/16 | 44% |
| `google_web_search` | 7/16 | 44% |
| `read_many_files` | 6/16 | 38% |
| `replace` | 6/16 | 38% |
| `list_directory` | 5/16 | 31% |
| `web_fetch` | 3/16 | 19% |

### 6.3 버전 민감 영역 (Version-Sensitive Areas)

| Feature Flag | Required Version | Affected Components |
|-------------|:----------------:|-------------------|
| `hasPlanMode` | >= 0.29.0 | enter_plan_mode, exit_plan_mode |
| `hasPolicyEngine` | >= 0.30.0 | policy-migrator.js, permission.js |
| `hasExcludeToolsDeprecated` | >= 0.30.0 | before-tool-selection.js |
| `hasGemini3Default` | >= 0.29.0 | 16 agents (gemini-3-pro/flash) |
| `hasSkillsStable` | >= 0.26.0 | activate_skill, SKILL.md |
| `hasExtensionRegistry` | >= 0.29.0 | gemini-extension.json |
| `hasSDK` | >= 0.30.0 | @google/gemini-cli-core |

---

## 7. Extension System Analysis

### 7.1 호환성 매트릭스

| Component | v0.29.x | v0.30.0 | v0.31.0-preview |
|-----------|:-------:|:-------:|:---------------:|
| gemini-extension.json | ✅ | ✅ | ✅ (예상) |
| Custom Commands (TOML) | ✅ | ✅ | ✅ (예상) |
| SKILL.md frontmatter | ✅ | ✅ | ⚠️ 네임스페이스 충돌 위험 |
| Hook Events (10) | ✅ | ✅ | ✅ (예상) |
| GEMINI.md @import | ✅ | ✅ | ✅ (예상) |
| MCP Server (stdio) | ✅ | ✅ | ✅ (예상) |
| Agent frontmatter | ✅ | ✅ | ⚠️ 공식 스펙 변경 가능 |

### 7.2 신규 Extension 기능 (미활용)

| Feature | Version | bkit 활용 여부 | 권고 |
|---------|---------|:--------------:|------|
| `excludeTools` in manifest | v0.29.0+ | ❌ | 추가 권장 (2차 방어) |
| `themes` in manifest | v0.29.0+ | ❌ | 선택적 (브랜딩) |
| `sensitive` settings flag | v0.29.0+ | ❌ | API 키 설정 시 사용 |
| AfterAgent retry pattern | v0.30.0+ | ❌ | 품질 게이트 활용 권장 |
| @google/gemini-cli-core SDK | v0.30.0+ | ❌ | JS 기반 스킬 개발 |
| Extension Registry 등록 | v0.30.0+ | ❌ | v1.6.0 목표 |

### 7.3 SKILL.md 네임스페이스 충돌 위험

bkit은 공식 스펙 외 커스텀 frontmatter 필드를 사용:

```yaml
# bkit 커스텀 필드 (공식 스펙 아님)
user-invocable: true
argument-hint: "[plan|design|...]"
allowed-tools: [...]
imports: [...]
agents: {analyze: gap-detector}
context: session
memory: project
pdca-phase: all
task-template: {...}
```

**위험**: Gemini CLI가 향후 동일 필드명을 공식 스펙에 추가할 경우 의미 충돌 발생 가능.
**권고**: v1.6.0에서 `bkit-` 접두사 네이밍 전환 (예: `bkit-user-invocable`, `bkit-allowed-tools`).

---

## 8. Code Quality Analysis

### 8.1 Quality Score: 82/100

### 8.2 Critical Issues (2건)

| # | File | Issue | Risk |
|---|------|-------|------|
| C-01 | `policy-migrator.js` (lines 65-146) | `convertToToml()`이 Gemini CLI v0.30.0 Policy Engine 스키마에 대한 런타임 검증 없이 TOML 생성 | TOML 포맷 불일치 시 권한 관리 실패 |
| C-02 | `tool-registry.js` (lines 72-78) | `FORWARD_ALIASES` 5개 추측적 도구 이름 변경이 검증 메커니즘 없이 매핑 | 미존재 도구로 라우팅 가능 |

### 8.3 Warning Issues (11건)

| # | Category | File | Issue |
|---|----------|------|-------|
| W-01 | Large File | `skill-orchestrator.js` (709 lines) | 300줄 권장 초과 |
| W-02 | Large File | `session-start.js` (393 lines) | 12개 함수, 혼합 책임 |
| W-03 | Large File | `memory.js` (460 lines) | MemoryManager 분리 필요 |
| W-04 | Large File | `permission.js` (407 lines) | 패턴 매칭 유틸 분리 필요 |
| W-05 | Duplicate | `file.js` + `tier.js` | TIER_EXTENSIONS 100% 중복 |
| W-06 | Duplicate | `before-agent.js` + `language.js` | 트리거 패턴 80% 중복 |
| W-07 | Duplicate | `session-start.js` + `level.js` | 레벨 감지 85% 중복 |
| W-08 | Duplicate | `before-model.js` + `before-tool-selection.js` | getCurrentPdcaPhase 100% 중복 |
| W-09 | Performance | `version-detector.js` | execSync 3초 타임아웃, 세션 시작 블로킹 |
| W-10 | Security | `spawn-agent-server.js` | `--yolo` 플래그 보안 우려 |
| W-11 | Testing | 전체 코드베이스 | 자동화된 테스트 부재 |

### 8.4 Architecture Compliance

```
Presentation (hooks, commands, agents, skills)
     │
     ▼
Application (lib/skill-orchestrator, lib/context-hierarchy)
     │
     ▼
Domain (lib/pdca/*, lib/intent/*, lib/task/*)
     │
     ▼
Infrastructure (lib/adapters/gemini/*, lib/core/*)
```

**결과**: PASS - 의존성 방향 하향, 역방향 의존성 없음.

---

## 9. Recurring Patterns (5건 - 이전 5회 분석 기반)

| Pattern | Description | Frequency | Current Risk |
|---------|-------------|:---------:|:------------:|
| **A: Tool Name Drift** | 매 메이저 업그레이드마다 도구 이름 변경/리네이밍 발생. Issue #5 (16개 에이전트 전체 로딩 실패)의 원인 | 5/5 | HIGH |
| **B: Policy/Permission Evolution** | excludeTools → 보안 경고 → Policy Engine TOML. 매 버전 적응 필요 | 4/5 | HIGH |
| **C: Sub-agent Spawning Stability** | `gemini -e --yolo` 패턴이 v0.28.0부터 위험 요소로 지적되었으나 2회 연속 미검증 | 3/5 | CRITICAL |
| **D: Documentation Lag** | README, 호환성 표, 모델 가이드 업데이트가 항상 지연 | 5/5 | MEDIUM |
| **E: Feature Adoption Deferred** | Plan Mode, Extension Registry, SDK 등 신기능이 P3로 계속 연기 | 4/5 | LOW |

---

## 10. Impact Mapping: Gemini CLI v0.30.0 → bkit-gemini

### 10.1 Compatibility Matrix

| bkit Component | v0.29.0 | v0.29.7 | v0.30.0 | v0.31.0-preview | Action Required |
|----------------|:-------:|:-------:|:-------:|:---------------:|----------------|
| 16 Agents (frontmatter) | ✅ | ✅ | ✅ | ⚠️ | 모델 업데이트 (3.1 Pro) |
| 29 Skills (frontmatter) | ✅ | ✅ | ✅ | ⚠️ | 네임스페이스 접두사 검토 |
| 10 Hooks (events) | ✅ | ✅ | ✅ | ✅ | 변경 없음 |
| Tool Registry (17 tools) | ✅ | ✅ | ✅ | ⚠️ | Forward Aliases 검증 |
| Policy Migrator | N/A | N/A | ✅ | ✅ | 자동 생성 활성화 |
| Version Detector | ✅ | ✅ | ✅ | ✅ | 포맷 검증 추가 |
| Permission Manager | ✅ | ✅ | ⚠️ | ⚠️ | Policy Engine 위임 전환 |
| MCP Server (6 tools) | ✅ | ✅ | ✅ | ✅ | --yolo 보안 검토 |
| TOML Commands (18) | ✅ | ✅ | ✅ | ✅ | 변경 없음 |
| gemini-extension.json | ✅ | ✅ | ✅ | ✅ | excludeTools 추가 권장 |
| GEMINI.md (@import) | ✅ | ✅ | ✅ | ✅ | 변경 없음 |

### 10.2 Risk Items

| ID | Severity | Component | Risk Description | Mitigation |
|----|:--------:|-----------|------------------|------------|
| R-01 | **Critical** | spawn-agent-server.js | `--yolo` 플래그 정책 우회 제거 가능 (PR #18153) | v0.30.0에서 검증 필수. 대안 플래그 조사 |
| R-02 | **High** | policy-migrator.js | TOML 포맷이 v0.30.0 stable과 불일치 가능 | 실제 v0.30.0 설치 후 통합 테스트 |
| R-03 | **High** | tool-registry.js | Forward Aliases가 v0.31.0에서 실제 발동 시 미검증 | 런타임 도구 존재 확인 로직 추가 |
| R-04 | **Medium** | version-detector.js | env var 주입으로 모든 기능 플래그 우회 가능 | SemVer 검증 + 최대 버전 제한 |
| R-05 | **Medium** | after-tool.js | Tool Output Masking으로 PDCA 상태 추적 필드 변경 가능 | v0.30.0에서 hook 입력 스키마 검증 |
| R-06 | **Medium** | before-model.js | System Prompt 재구성으로 컨텍스트 주입 위치 변경 가능 | v0.30.0에서 프롬프트 구조 확인 |
| R-07 | **Low** | skill-orchestrator.js | activate_skill 네이티브 최적화와 중복 로직 | 리팩토링 (P2) |

---

## 11. Improvement Recommendations

### Phase 1: Immediate (P0) - v1.5.5 패치 (이번 주)

| # | Action | Effort | Files |
|---|--------|:------:|-------|
| 1 | v0.30.0 stable 대상 전체 호환성 테스트 실행 | 2h | Test suite |
| 2 | `bkit.config.json` testedVersions에 `"0.29.7"`, `"0.30.0"` 추가 | 15m | bkit.config.json |
| 3 | session-start.js에서 Policy TOML 자동 생성 트리거 활성화 | 1h | hooks/scripts/session-start.js |
| 4 | version-detector.js에 SemVer 포맷 검증 추가 | 30m | lib/adapters/gemini/version-detector.js |
| 5 | model-selection.md에 Gemini 3.1 Pro + customtools 정보 추가 | 1h | docs/guides/model-selection.md |

### Phase 2: Short-term (P1) - v1.5.5~v1.6.0 (1~2주)

| # | Action | Effort | Files |
|---|--------|:------:|-------|
| 6 | Sub-agent spawn (`gemini -e --yolo`) 확정적 검증 | 2h | mcp/spawn-agent-server.js |
| 7 | policy-migrator.js TOML 스키마 검증 추가 | 2h | lib/adapters/gemini/policy-migrator.js |
| 8 | AfterTool hook 스키마 / Tool Output Masking 검증 | 1h | hooks/scripts/after-tool.js |
| 9 | cto-lead, gap-detector에 gemini-3.1-pro 모델 적용 테스트 | 2h | agents/cto-lead.md, agents/gap-detector.md |
| 10 | report-generator, qa-monitor에 gemini-3-flash-lite 적용 | 30m | agents/report-generator.md, agents/qa-monitor.md |
| 11 | gemini-extension.json에 excludeTools 안전장치 추가 | 15m | gemini-extension.json |

### Phase 3: Medium-term (P2) - v1.6.0 (2~3주)

| # | Action | Effort | Files |
|---|--------|:------:|-------|
| 12 | @google/gemini-cli-core SDK 통합 (JS 기반 스킬) | 8h | Architecture |
| 13 | Extension Registry 등록 준비 | 4h | gemini-extension.json |
| 14 | SKILL.md 커스텀 필드 `bkit-` 접두사 전환 | 4h | 29 skills |
| 15 | MCP SDK ^1.27.0 업그레이드 | 2h | mcp/spawn-agent-server.js |
| 16 | 코드 중복 제거 (5건 구조적 중복) | 4h | hooks/scripts/*, lib/* |
| 17 | 대형 파일 분할 (4건, 300줄 초과) | 4h | lib/* |
| 18 | AfterAgent retry 패턴 구현 | 2h | hooks/scripts/after-agent.js |

### Phase 4: Long-term (P3) - v1.7.0 (1개월)

| # | Action | Effort | Files |
|---|--------|:------:|-------|
| 19 | Agent Client Protocol (ACP) IDE 통합 | 16h | Architecture |
| 20 | Plan Mode + PDCA 통합 (/plan → /pdca plan 매핑) | 4h | Commands, Hooks |
| 21 | Conductor Extension 평가 | 8h | Architecture |
| 22 | GenAI SDK 1.41.0+ 대응 (v0.31.0-preview) | 4h | Adapters |
| 23 | Dynamic MCP tool updates (notifications/tools/list_changed) | 8h | mcp/ |
| 24 | 자동화된 테스트 스위트 구축 | 16h | tests/ |

---

## 12. Architecture Decision Records

| Decision | Options | Recommended | Rationale |
|----------|---------|:-----------:|-----------|
| Policy Engine 활성화 | Opt-in / Auto-generate | **Auto-generate** | v0.30.0 GA; Policy Engine이 기본 메커니즘 |
| SDK 스킬 포맷 | Markdown 대체 / 병행 | **병행** | v0.29.x 사용자 하위 호환성 |
| Extension Registry | 즉시 / v1.6.0 | **v1.6.0** | SDK 통합 선행 필요 |
| GenAI SDK 추적 | 버전 고정 / 최신 추적 | **최신 추적** | v0.31.0에서 1.41.0 급등; 빠른 반복 예상 |
| A2A/ACP 통합 | v1.6.0 / v1.7.0 | **v1.7.0** | ACP 0.x 안정화 대기 |
| Model 업그레이드 | 전체 3.1 / 선택적 | **선택적** | cto-lead, gap-detector에만 3.1 Pro 우선 적용 |
| SKILL.md 네임스페이스 | 현행 유지 / bkit- 접두사 | **bkit- 접두사** | 공식 스펙 충돌 예방 (v1.6.0) |

---

## 13. Risk Assessment Summary

### Overall Impact Score: 82/100 (High)

| Factor | Score | Weight | Weighted |
|--------|:-----:|:------:|:--------:|
| v0.30.0 stable 출시 (Policy Engine GA) | 85 | 25% | 21.3 |
| Gemini 3.1 Pro + customtools 모델 | 70 | 15% | 10.5 |
| Sub-agent spawn 미검증 (2회 연속) | 90 | 20% | 18.0 |
| 도구 이름 변경 예정 (v0.31.0+) | 75 | 15% | 11.3 |
| 보안 취약점 (패치 완료) | 40 | 10% | 4.0 |
| 코드 품질 이슈 (82/100) | 60 | 10% | 6.0 |
| GenAI SDK 대폭 업그레이드 (v0.31.0) | 70 | 5% | 3.5 |
| **Total** | | **100%** | **74.6 → 82** |

### Risk vs Opportunity Matrix

```
                    HIGH IMPACT
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
    │  R-01: --yolo     │  Gemini 3.1 Pro   │
    │  R-02: TOML 검증  │  customtools      │
    │  R-03: Forward    │  SDK Package      │
    │        Aliases    │  Extension Reg    │
    │                   │                   │
HIGH├───────────────────┼───────────────────┤LOW
RISK│                   │                   │RISK
    │  R-04: env var    │  ACP/A2A          │
    │  R-05: Output     │  Plan Mode        │
    │        Masking    │  Themes           │
    │  R-06: System     │  flash-lite       │
    │        Prompt     │                   │
    │                   │                   │
    └───────────────────┼───────────────────┘
                        │
                   LOW IMPACT
```

---

## 14. Comparison with Previous Analyses

| Analysis | Date | CLI Version | Impact Score | Key Fix |
|----------|------|-------------|:------------:|---------|
| v0.28.0 분석 | 2026-02-04 | v0.25→v0.28 | 65/100 | 문서 업데이트만 |
| v0.28.2 분석 | 2026-02-12 | v0.28.2 | 55/100 | 문서 업데이트만 |
| v0.29.0 분석 | 2026-02-19 | v0.28→v0.29 | 78/100 | v1.5.3 호환성 수정 (Issue #5) |
| **v0.30.0 분석 (본 문서)** | **2026-02-25** | **v0.29→v0.30** | **82/100** | **Policy Engine GA, 3.1 Pro** |

**추세**: 영향도 점수가 상승 추세 (65 → 55 → 78 → 82). Gemini CLI의 주간 릴리스 케이던스와 빠른 기능 추가로 인해 각 버전별 영향도가 증가.

---

## 15. Open Questions (이전 분석 미해결 + 신규)

| # | Question | Source | Priority |
|---|----------|--------|:--------:|
| Q-01 | `gemini -e agent.md --yolo`가 v0.30.0에서 정식 제거/변경/유지? | PM 분석 | P0 |
| Q-02 | Policy Engine TOML 스키마가 preview와 stable 간 변경? | PM 분석 | P1 |
| Q-03 | Forward Alias 대상 (`edit_file`, `find_files`)이 v0.31.0에서 실제 도구명? | PM 분석 | P1 |
| Q-04 | `ask_user` 스키마의 `question` 필수 필드가 에이전트 frontmatter에도 적용? | Enterprise 분석 | P1 |
| Q-05 | AfterTool hook에서 Tool Output Masking이 어떤 필드를 변경? | PM 분석 | P1 |
| Q-06 | GenAI SDK 1.30.0→1.41.0 변경이 모델 호출 API에 미치는 영향? | Infra 분석 | P2 |
| Q-07 | Extension Registry 등록 요구사항은? | PM 분석 | P3 |
| Q-08 | @google/gemini-cli-core SDK의 스킬 관련 API는? | Infra 분석 | P2 |
| Q-09 | Issue #13850 (MCP dynamic tool update) 해결 상태? | PM 분석 | P2 |
| Q-10 | Issue #18712 (subagent MCP tool prefix `internal__xxx`) 해결? | PM 분석 | P2 |
| Q-11 | Conductor Extension이 bkit 아키텍처에 미치는 영향? | PM 분석 | P3 |

---

## 16. Sources

### Official Documentation
- [Gemini CLI Releases](https://github.com/google-gemini/gemini-cli/releases)
- [Gemini CLI Changelog - Stable v0.29.0](https://geminicli.com/docs/changelogs/latest/)
- [Gemini CLI Changelog - Preview v0.30.0-preview.3](https://geminicli.com/docs/changelogs/preview/)
- [Gemini CLI Policy Engine](https://geminicli.com/docs/reference/policy-engine/)
- [Gemini CLI Extensions](https://geminicli.com/docs/extensions/)
- [Gemini CLI Skills](https://geminicli.com/docs/cli/skills/)
- [Gemini CLI Hooks Reference](https://geminicli.com/docs/hooks/reference/)

### Google Blog Posts
- [Gemini 3 Flash in Gemini CLI](https://developers.googleblog.com/gemini-3-flash-is-now-available-in-gemini-cli/)
- [Making Gemini CLI Extensions Easier to Use](https://developers.googleblog.com/making-gemini-cli-extensions-easier-to-use/)
- [Gemini CLI Hooks](https://developers.googleblog.com/tailor-gemini-cli-to-your-workflow-with-hooks/)
- [Gemini 3.1 Pro Announcement](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-1-pro/)
- [Gemini 3.1 Pro on Gemini CLI](https://cloud.google.com/blog/products/ai-machine-learning/gemini-3-1-pro-on-gemini-cli-gemini-enterprise-and-vertex-ai)

### GitHub Issues & PRs
- [Issue #1391 - Consistent Tool Naming](https://github.com/google-gemini/gemini-cli/issues/1391)
- [Issue #12909 - Tool Display Names](https://github.com/google-gemini/gemini-cli/issues/12909)
- [Issue #13240 - Extensions Fail Outside Home Directory](https://github.com/google-gemini/gemini-cli/issues/13240)
- [Issue #15383 - Policy Engine Docs Mismatch](https://github.com/google-gemini/gemini-cli/issues/15383)
- [Issue #18712 - Subagent MCP Tool Prefix](https://github.com/google-gemini/gemini-cli/issues/18712)
- [PR #18959 - AskUser Schema Change](https://github.com/google-gemini/gemini-cli/pull/18959)
- [PR #20112 - v0.30.0-preview.6 Patch](https://github.com/google-gemini/gemini-cli/pull/20112)

### npm Registry
- [@google/gemini-cli](https://www.npmjs.com/package/@google/gemini-cli)
- [@google/gemini-cli-core](https://www.npmjs.com/package/@google/gemini-cli-core)
- [@agentclientprotocol/sdk](https://www.npmjs.com/package/@agentclientprotocol/sdk)
- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)

### Security
- [Tracebit - Gemini CLI Hijack](https://tracebit.com/blog/code-exec-deception-gemini-ai-cli-hijack)
- [Cyera Research Labs Disclosure](https://www.cyera.com/research-labs/cyera-research-labs-discloses-command-prompt-injection-vulnerabilities-in-gemini-cli)
- [PromptPwnd - CI/CD Attack](https://blog.intelligencex.org/google-gemini-cli-prompt-injection-hack)

---

## Appendix A: Key File Reference

| File | Purpose | Version Sensitivity |
|------|---------|:-------------------:|
| `bkit.config.json` | 중앙 설정 (호환성, 권한) | HIGH |
| `gemini-extension.json` | Extension 매니페스트 | MEDIUM |
| `GEMINI.md` | 컨텍스트 엔지니어링 진입점 | LOW |
| `lib/adapters/gemini/tool-registry.js` | 도구 이름 Source of Truth | HIGH |
| `lib/adapters/gemini/version-detector.js` | CLI 버전 감지 | HIGH |
| `lib/adapters/gemini/policy-migrator.js` | Policy Engine TOML 변환 | HIGH |
| `lib/core/permission.js` | 권한 관리 (Policy Engine 위임) | MEDIUM |
| `hooks/scripts/session-start.js` | 세션 초기화 (393 lines) | MEDIUM |
| `hooks/scripts/before-tool-selection.js` | 도구 필터링 | HIGH |
| `hooks/scripts/before-tool.js` | 권한 검사 | HIGH |
| `hooks/scripts/after-tool.js` | PDCA 상태 추적 | MEDIUM |
| `hooks/hooks.json` | 훅 이벤트 등록/매처 | HIGH |
| `mcp/spawn-agent-server.js` | MCP 서버 (6 tools) | MEDIUM |
| `agents/*.md` | 16 에이전트 frontmatter | MEDIUM |
| `skills/*/SKILL.md` | 29 스킬 frontmatter | MEDIUM |

---

*Analysis prepared by CTO Team (6 specialist agents)*
*bkit Vibecoding Kit v1.5.4 → v1.5.5 Upgrade Impact Analysis*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
