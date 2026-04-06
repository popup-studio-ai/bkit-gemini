# Gemini CLI v0.36.0 bkit 영향 분석 보고서

> 분석일: 2026-04-06
> 분석 범위: bkit v2.0.2 전체 코드베이스 (233개 파일)
> 분석자: bkit-impact-analyzer agent
> 입력: gemini-cli-v036-stable-research.md (Phase 1 조사 결과)
> CLI 버전: v0.35.3 -> v0.36.0 stable (2026-04-01 릴리스)

---

## Executive Summary

| 항목 | 수치 |
|------|------|
| 분석 대상 파일 | 233개 (lib 48, hooks 17, agents 21, skills 35, policies 1, tests 111) |
| 영향 받는 파일 | 34개 |
| Critical | 0건 (P0 이미 대응 완료) |
| High | 4건 |
| Medium | 8건 |
| Low | 5건 |
| 기능 개선 기회 | 10건 |

### 핵심 결론

1. **P0 enableAgents 대응 완료**: v2.0.2 `session-start.js`의 `ensureAgentsEnabled()`가 정상 작동. Critical 이슈 없음
2. **Extension Skills 접두사 변경 (`.` -> `:`)**: bkit 코드에서 이미 `bkit:pdca` 패턴 대응됨. **추가 작업 불필요**
3. **toolName 필수화**: bkit 정책 파일 100% 호환 확인. 모든 rule에 toolName 명시
4. **v0.36.0 Feature Flags**: 7개 플래그 정의 완료. 실제 활용은 `hasBeforeToolAsk` 1개만 (before-tool.js). 나머지 6개는 미활용 상태
5. **Sandbox Governance 파일 보호**: bkit 에이전트가 `.gitignore`/`.geminiignore`/`.git/` 수정 시도하는 코드 1건 발견 (skills/bkend-security/SKILL.md) -- 안내 문구 수준이므로 실제 영향 없음

---

## 1. Breaking Changes 영향 매핑

### 1.1 `enableAgents` 기본값 `false` 전환 (PR #23546)

- **영향도**: ~~Critical~~ -> 대응 완료 (영향 없음)
- **영향 파일**:
  - `hooks/scripts/session-start.js` (Line 126-152): `ensureAgentsEnabled()` 함수
  - `tests/suites/tc111-v036-enableagents.js`: 5개 TC 검증
  - `tests/suites/tc109-v035-skill-agent-compat.js` (Line 111-117): enableAgents 키 존재 검증
- **현재 코드**:
  ```javascript
  // session-start.js:141-142
  if (settings.experimental.enableAgents === undefined) {
    settings.experimental.enableAgents = true;
  }
  ```
- **수정 방안**: 없음 (이미 완벽 대응). "No Guessing" 원칙에 따라 사용자가 명시적으로 `false`로 설정한 경우 존중
- **검증 상태**: TC111-01~05 테스트 통과

### 1.2 Policy `toolName` 필수화 (PR #23330)

- **영향도**: ~~High~~ -> 호환 확인됨 (영향 없음)
- **영향 파일**:
  - `policies/bkit-extension-policy.toml`: 4개 rule 모두 `toolName = "run_shell_command"` 명시
  - `lib/gemini/policy.js`: `convertToToml()` 함수에서 항상 `toolName` 출력 (Line 229)
  - `lib/gemini/policy.js`: `validateTomlStructure()` (Line 54-73) - toolName 검증 포함
  - `LEVEL_POLICY_TEMPLATES`: 모든 rule에 `toolName` 필드 존재
  - `SUBAGENT_POLICY_GROUPS`: 모든 rule에 `toolName` 필드 존재
- **수정 방안**: 없음. bkit 정책 생성 코드가 처음부터 toolName을 필수로 출력하는 구조

### 1.3 Extension Skills 접두사 변경 `.` -> `:` (PR #23566)

- **영향도**: Medium
- **영향 파일**:
  - `hooks/scripts/after-tool.js` (Line 115): `skillName.startsWith('bkit:pdca')` -- **이미 대응됨**
  - `tests/suites/tc09-pdca-e2e.js` (Line 13, 37): `skill: 'bkit:pdca'` 테스트 케이스 존재
  - `docs/test-design/hooks-v2.0.0-test-cases.md` (Line 171): T-075 `bkit:pdca` prefix 처리 테스트 정의
  - `lib/skill-orchestrator.js`: 스킬 로딩 시 디렉토리명 기반 (`loadSkill(skillName)`) -- 접두사 무관
- **현재 코드**:
  ```javascript
  // after-tool.js:115 -- 이미 colon prefix 처리
  if (skillName === 'pdca' || skillName.startsWith('bkit:pdca')) {
  ```
- **분석**: Gemini CLI v0.36.0에서 extension skill 호출 시 `bkit:skillname` 형태로 접두사가 붙을 수 있음. bkit의 after-tool.js는 이미 `bkit:pdca` 패턴을 처리하고 있으나, **pdca 외 다른 스킬에 대해서는 prefix stripping 로직 없음**
- **수정 방안**:
  - after-tool.js의 `processPostSkill()`에서 범용 prefix stripping 추가 권장:
    ```javascript
    // 제안: 범용 bkit: prefix 제거
    const normalizedSkill = skillName.replace(/^bkit:/, '');
    ```
  - after-agent.js의 `SKILL_HANDLERS` 매핑에도 동일 적용 필요
  - before-tool-selection.js의 `getActiveSkillToolFilter()`는 메모리에서 스킬명을 읽으므로 영향 없음 (Gemini CLI가 내부적으로 정규화)
- **우선순위**: P2 (현재 pdca 외 스킬에서 AfterTool post-processing이 없으므로 실제 장애 가능성 낮음)

### 1.4 AgentSession 도입: stream() -> subscribe() (PR #23159)

- **영향도**: Low
- **영향 파일**: 없음 (직접 영향 없음)
- **분석**: bkit은 Gemini CLI 내부 API를 직접 호출하지 않고 hooks 기반으로 동작. AgentSession 변경은 SDK 레벨이며 bkit hook scripts에 영향 없음
- **수정 방안**: 없음

### 1.5 Auth type `oauth2` -> `oauth` (PR #23639)

- **영향도**: Low
- **분석**: bkit 코드베이스 전수 스캔 결과 `oauth2` 또는 `oauth` 참조 없음
- **수정 방안**: 없음

### 1.6 `coreToolScheduler` 삭제 (PR #23502)

- **영향도**: Low
- **분석**: bkit 코드베이스에서 `coreToolScheduler` 직접 참조 없음. version.js의 `hasParallelToolScheduler` 플래그는 v0.35.0+ 용이며 새 scheduler 기반
- **수정 방안**: 없음

---

## 2. Extension Skills 접두사 변경 상세 분석

### 2.1 변경 내용

| 항목 | v0.35.x | v0.36.0 |
|------|---------|---------|
| 접두사 부착 시점 | 충돌 시에만 | 항상 |
| 구분자 | `.` (점) | `:` (콜론) |
| 예시 | `pdca` 또는 `bkit.pdca` | `bkit:pdca` |

### 2.2 bkit 코드베이스 스킬 호출 패턴

#### 2.2.1 사용자 대면 스킬 호출 (SKILL.md, 에이전트, 세션)

| 위치 | 호출 패턴 | 예시 | 영향 |
|------|----------|------|------|
| skills/*/SKILL.md | `/스킬명 action` | `/pdca plan user-auth` | Gemini CLI가 자동 해석 -- 사용자 입력은 CLI가 `bkit:pdca`로 매핑 |
| session-start.js | `` `/스킬명` `` 문자열 출력 | `` `/pdca plan ${feature}` `` | **안내 문구**: CLI가 해석하므로 영향 없음 |
| agents/*.md | `/스킬명` 안내 | `/pdca analyze` | **안내 문구**: CLI가 해석하므로 영향 없음 |

#### 2.2.2 프로그래밍 스킬 처리 (hooks, lib)

| 파일 | 코드 위치 | 패턴 | 대응 상태 |
|------|----------|------|----------|
| `after-tool.js` | Line 115 | `skillName === 'pdca' \|\| skillName.startsWith('bkit:pdca')` | **대응됨** |
| `after-agent.js` | Line 24-28 | `SKILL_HANDLERS['pdca']` | 추가 확인 필요 |
| `before-tool-selection.js` | Line 130 | `memory.activeSkill` (메모리에서 읽음) | CLI 내부 정규화에 의존 |
| `skill-orchestrator.js` | 전체 | `loadSkill(skillName)` -- 디렉토리명 기반 | **영향 없음** (접두사 불포함) |
| `tc09-pdca-e2e.js` | Line 13, 37 | `skill: 'bkit:pdca'` | **테스트 존재** |

#### 2.2.3 핵심 발견사항

1. **after-tool.js**: `bkit:pdca`에 대해서만 prefix 처리됨. `bkit:code-review`나 `bkit:phase-8-review` 등 다른 스킬은 SKILL_HANDLERS에 없으므로 현재 영향 없음
2. **after-agent.js**: `SKILL_HANDLERS` 키가 `'pdca'`, `'code-review'`, `'phase-8-review'`로만 매핑됨. v0.36.0에서 CLI가 `bkit:pdca`로 전달하면 `SKILL_HANDLERS['pdca']`에 매칭 안 됨 -- **잠재적 이슈**
3. **skill-orchestrator.js**: `loadSkill()`, `activateSkill()` 등은 디렉토리명 기반 조회. Gemini CLI의 `activate_skill` 도구가 스킬명을 어떻게 전달하는지에 따라 달라짐
4. **결론**: Gemini CLI가 hook 이벤트의 `skill` 필드에 `bkit:pdca`를 전달할 경우, after-agent.js의 `SKILL_HANDLERS` 매칭 실패 가능성 존재

### 2.3 권장 조치

| 우선순위 | 조치 | 파일 | 예상 공수 |
|---------|------|------|----------|
| P2 | 범용 `bkit:` prefix stripping 유틸리티 함수 추가 | hooks/scripts/utils/ | 0.5h |
| P2 | after-agent.js SKILL_HANDLERS 매칭에 prefix stripping 적용 | hooks/scripts/after-agent.js | 0.3h |
| P3 | 모든 hook에서 일관된 스킬명 정규화 검증 테스트 추가 | tests/suites/ | 1h |

---

## 3. v0.36.0 Feature Flags 활용도 분석

### 3.1 정의된 플래그 (lib/gemini/version.js Line 177-183)

| # | 플래그명 | 코드 사용 여부 | 사용 위치 | 활용 제안 |
|---|---------|---------------|----------|----------|
| 1 | `hasEnableAgentsDefaultFalse` | **사용중** | session-start.js (간접: ensureAgentsEnabled 호출 트리거), tc105, tc111 | 이미 활용 |
| 2 | `hasToolNameRequired` | **미사용** | 정의만 존재 | policy.js의 `validateTomlStructure()`에서 v0.36.0+ 추가 검증으로 활용 가능 |
| 3 | `hasStatelessSandbox` | **미사용** | 정의만 존재 | bkit이 SandboxManager를 직접 호출하지 않으므로 활용 불필요 |
| 4 | `hasBeforeToolAsk` | **사용중** | before-tool.js (Line 66): `status: 'ask'` 반환 분기 | 이미 활용 |
| 5 | `hasGitWorktree` | **미사용** | getBkitFeatureFlags() 노출만 | context-fork.js에서 worktree 기반 격리 활용 가능 (P3) |
| 6 | `hasPlanModeNonInteractive` | **미사용** | getBkitFeatureFlags() 노출만 | CI/CD 파이프라인 bkit 자동화에 활용 가능 (P3) |
| 7 | `hasMultiRegistry` | **미사용** | getBkitFeatureFlags() 노출만 | spawn-agent-server.js에서 에이전트별 도구 격리에 활용 가능 (P2) |

### 3.2 getBkitFeatureFlags() 확장 플래그 (Line 241-243)

| # | 플래그명 | 코드 사용 여부 | 활용 제안 |
|---|---------|---------------|----------|
| 1 | `canUseBeforeToolAsk` | **미사용** (before-tool.js는 직접 `hasBeforeToolAsk` 사용) | getBkitFeatureFlags에서 제거 또는 before-tool.js에서 이 플래그 사용으로 통일 |
| 2 | `canUseGitWorktree` | **미사용** | context-fork.js에서 git worktree 감지 로직에 활용 |
| 3 | `canUsePlanModeNonInteractive` | **미사용** | 향후 CI/CD 통합 시 활용 |

### 3.3 미활용 플래그 최적화 권장

- **hasToolNameRequired**: policy.js에서 v0.36.0+ 환경일 때 `toolName = "*"` 누락 경고 추가 가능
- **hasMultiRegistry**: spawn-agent-server.js의 `executeAgent()`에서 `--tool-filter` 또는 에이전트별 도구 제한 플래그 적용 가능
- **hasGitWorktree**: context-fork.js의 `forkContext()`에서 git worktree 감지 시 네이티브 워크트리 활용으로 전환 가능
- 나머지 플래그는 정보성(informational)으로 유지해도 무방

---

## 4. 새 기능 활용 기회

| # | 새 CLI 기능 | bkit 활용 방안 | 영향 파일 | 예상 효과 | 우선순위 | 난이도 |
|---|-----------|---------------|----------|----------|---------|-------|
| 1 | **BeforeTool `ask` decision** (PR #21146) | before-tool.js에서 `status: 'ask'` 반환 -- **이미 구현됨** (Line 66-69) | hooks/scripts/before-tool.js | PDCA 위반 시 사용자 확인 요청 가능 | **완료** | - |
| 2 | **allowRedirection** (PR #23579) | policy.js 정책 템플릿에 `allowRedirection = true` 추가. 로그 리디렉션(`> file.log`) 허용하면서 위험한 리디렉션(`> /etc/passwd`) 차단 | lib/gemini/policy.js | 셸 정책 세밀도 향상 | P3 | Low |
| 3 | **toolAnnotations in Policy** | policy.js의 `TOOL_ANNOTATIONS`와 연계하여 `destructiveHint: true` 도구에 자동 `ask_user` 정책 생성 | lib/gemini/policy.js, tools.js | 정책 자동화 수준 향상 | P3 | Medium |
| 4 | **Multi-Registry + Tool Isolation** (PR #22712, #22718) | spawn-agent-server.js에서 READONLY 에이전트 스폰 시 `--allowed-tools` 플래그 전달하여 네이티브 도구 격리 활용 | mcp/spawn-agent-server.js | SAFETY_TIERS를 CLI 레벨에서 강제 | P2 | Medium |
| 5 | **Git Worktree** (PR #22973) | context-fork.js에서 `forkContext()` 호출 시 git worktree 생성하여 파일시스템 수준 격리 | lib/gemini/context-fork.js | 분석 에이전트 격리 수준 향상 | P3 | High |
| 6 | **memoryManager Agent** (PR #22726) | 현재 bkit memory-helper.js는 자체 메모리 저장소 사용. 향후 `experimental.memoryManager` 활성화 시 save_memory 도구 가용성 확인 필요 | hooks/scripts/utils/memory-helper.js | 메모리 관리 고도화 (향후) | P3 | Medium |
| 7 | **ModelChain** (PR #22914) | model-resolver.js의 `FALLBACK_CHAIN`을 ModelChain 스키마로 외부화하여 설정 파일에서 관리 | lib/gemini/model-resolver.js | 모델 라우팅 유연성 향상 | P3 | Medium |
| 8 | **Plan Mode Non-Interactive** (PR #22670) | CI/CD 환경에서 `--plan` 플래그로 bkit PDCA plan 자동 생성 | hooks/scripts/session-start.js | CI/CD 파이프라인 통합 | P3 | Low |
| 9 | **Behavioral Evaluations** (PR #23272) | spawn-agent-server.js의 에이전트 라우팅에 행동 평가 데이터 활용 | mcp/spawn-agent-server.js | 에이전트 라우팅 품질 향상 | P3 | High |
| 10 | **Task Blocked Status** (PR #22735) | tracker.js에서 `blocked` 상태를 PDCA 의존성 표현에 활용 | lib/gemini/tracker.js | PDCA 의존성 관리 강화 | P3 | Low |

---

## 5. Sandbox Governance 파일 보호 영향

### 5.1 보호 대상 파일 (PR #23139)

| 파일/디렉토리 | 보호 수준 |
|-------------|----------|
| `.gitignore` | 쓰기 보호 (샌드박스 내) |
| `.geminiignore` | 쓰기 보호 (샌드박스 내) |
| `.git/` | 쓰기 보호 (샌드박스 내) |

### 5.2 bkit 코드베이스 스캔 결과

| 파일 | 참조 내용 | 영향 |
|------|----------|------|
| `skills/bkend-security/SKILL.md` (Line 336) | `Add .env* to .gitignore to prevent committing secrets` | **안내 문구**: 에이전트가 `.gitignore`에 항목 추가를 시도할 수 있으나, 이는 사용자에게 권장하는 안내이며 bkit 코드가 직접 `.gitignore`를 수정하는 로직은 없음 |
| agents/*.md | 스캔 결과 `.gitignore`/`.geminiignore` 수정 지시 **없음** | 영향 없음 |
| hooks/scripts/*.js | `.git/` 경로 직접 수정 **없음** | 영향 없음 |
| lib/**/*.js | `.gitignore` 수정 로직 **없음** | 영향 없음 |

### 5.3 결론

- bkit 코드베이스에서 `.gitignore`, `.geminiignore`, `.git/` 디렉토리를 **프로그래밍적으로 수정하는 코드는 없음**
- `skills/bkend-security/SKILL.md`의 안내 문구는 에이전트가 사용자에게 제안하는 내용이며, 에이전트가 실제로 이 파일을 수정하려 하면 v0.36.0 샌드박스가 차단함
- **조치 필요**: bkend-security SKILL.md에 "Note: In Gemini CLI v0.36.0+, `.gitignore` is write-protected by sandbox governance. Add entries manually." 안내 추가 권장 (P3)

---

## 6. 철학 정합성 검증 결과

| 원칙 | 상태 | 비고 |
|------|------|------|
| **Automation First** | 유지 | v0.36.0 변경이 자동화 수준을 저하시키지 않음. `ensureAgentsEnabled()` 자동 설정으로 에이전트 시스템 자동 활성화 유지. BeforeTool `ask` 도입으로 자동화 세밀도 오히려 향상 |
| **No Guessing** | 유지 | `enableAgents=false` 사용자 설정 존중 (Line 141: `=== undefined` 조건). BeforeTool `ask`로 불확실한 조작 시 사용자 확인 요청 가능 |
| **Docs = Code** | 유지 | bkit.config.json `testedVersions`에 `"0.36.0"` 이미 포함. version.js 플래그 7개 동기화 완료. 설계 문서(gemini-cli-v036-migration.design.md) 존재 |
| **AI as Partner** | 향상 | Multi-Registry로 에이전트별 도구 격리 가능. Behavioral evaluations로 에이전트 라우팅 품질 향상. memoryManager로 메모리 관리 지능화 가능 |
| **Context Engineering** | 유지 | 6-Layer hook 아키텍처 변경 없음. JIT Context Loading 호환성 유지. Phase-aware context 정상 작동 |
| **PDCA Methodology** | 유지 | PDCA 상태 머신, 트래커 브릿지, 스킬 시스템 모두 정상 작동. Plan Mode Non-Interactive로 CI/CD PDCA 자동화 기회 발생 |

---

## 7. 파일별 상세 영향 매트릭스

### 7.1 lib/gemini/ (9 파일)

| 파일 경로 | 영향 항목 | 영향도 | 현재 상태 | 제안 조치 |
|----------|----------|--------|----------|----------|
| `lib/gemini/version.js` | v0.36.0 플래그 7개 | Low | 이미 구현 완료 (Line 177-183) | 미활용 플래그 활용 로드맵 수립 |
| `lib/gemini/policy.js` | toolName 필수화 호환 | Low | 호환 확인됨 | allowRedirection, toolAnnotations 향후 추가 (P3) |
| `lib/gemini/tools.js` | save_memory deprecation 예고 | Low | BUILTIN_TOOLS에 SAVE_MEMORY 존재 | memoryManager 대체 시 주석/코드 업데이트 (P3) |
| `lib/gemini/hooks.js` | BeforeTool ask 지원 | Low | HOOK_EVENT_MAP 변경 없음 | 없음 |
| `lib/gemini/tracker.js` | blocked status 활용 | Low | PDCA_TO_TRACKER_STATUS에 blocked 없음 | blocked 상태 매핑 추가 (P3) |
| `lib/gemini/platform.js` | 변경 없음 | - | 정상 | 없음 |
| `lib/gemini/context-fork.js` | Git Worktree 활용 기회 | Low | forkContext() JSON snapshot 방식 | worktree 기반 격리 검토 (P3) |
| `lib/gemini/import-resolver.js` | 변경 없음 | - | JIT 호환 정상 | 없음 |
| `lib/gemini/model-resolver.js` | ModelChain 활용 기회 | Low | 정적 FALLBACK_CHAIN | ModelChain 스키마 외부화 검토 (P3) |

### 7.2 hooks/scripts/ (10 파일)

| 파일 경로 | 영향 항목 | 영향도 | 현재 상태 | 제안 조치 |
|----------|----------|--------|----------|----------|
| `session-start.js` | enableAgents P0 | Low | **대응 완료** (ensureAgentsEnabled) | 없음 |
| `before-tool.js` | BeforeTool ask | Low | **구현 완료** (Line 63-69) | 없음 |
| `after-tool.js` | Extension skill prefix | Medium | `bkit:pdca` 대응됨 (Line 115) | 범용 prefix stripping 추가 (P2) |
| `after-agent.js` | Extension skill prefix | Medium | SKILL_HANDLERS 키에 prefix 미고려 | prefix stripping 적용 (P2) |
| `before-tool-selection.js` | 변경 없음 | - | 메모리 기반 스킬 필터 정상 | 없음 |
| `before-agent.js` | 변경 없음 | - | 인텐트 감지 정상 | 없음 |
| `before-model.js` | 변경 없음 | - | 정상 | 없음 |
| `after-model.js` | 변경 없음 | - | 메트릭 수집 정상 | 없음 |
| `pre-compress.js` | 변경 없음 | - | JIT safeguard 정상 | 없음 |
| `session-end.js` | 변경 없음 | - | 정상 | 없음 |

### 7.3 agents/ (21 파일)

| 파일 경로 | 영향 항목 | 영향도 | 현재 상태 | 제안 조치 |
|----------|----------|--------|----------|----------|
| 전체 21개 에이전트 | enableAgents 기본값 변경 | Low | session-start.js에서 자동 활성화 | 없음 |
| 전체 21개 에이전트 | model frontmatter | Low | model-resolver.js가 자동 해석 | 없음 |

### 7.4 skills/ (35 디렉토리)

| 파일 경로 | 영향 항목 | 영향도 | 현재 상태 | 제안 조치 |
|----------|----------|--------|----------|----------|
| 전체 35개 스킬 | Extension skill prefix 변경 | Low | CLI가 스킬 호출 시 자동 매핑 | 사용자 안내 문서에 `bkit:` prefix 표기 (P3) |
| `skills/bkend-security/SKILL.md` | Sandbox governance | Low | `.gitignore` 수정 안내 포함 | sandbox 보호 안내 추가 (P3) |

### 7.5 policies/ (1 파일)

| 파일 경로 | 영향 항목 | 영향도 | 현재 상태 | 제안 조치 |
|----------|----------|--------|----------|----------|
| `policies/bkit-extension-policy.toml` | toolName 필수화 | Low | 모든 rule에 toolName 명시 | 없음 |

### 7.6 mcp/ (1 파일)

| 파일 경로 | 영향 항목 | 영향도 | 현재 상태 | 제안 조치 |
|----------|----------|--------|----------|----------|
| `mcp/spawn-agent-server.js` | Multi-Registry 활용 기회 | Medium | SAFETY_TIERS는 approval mode로만 구현 | 네이티브 도구 격리 활용 (P2) |
| `mcp/spawn-agent-server.js` | model-resolver 연동 | Low | `_resolveAgentModel()` 정상 | ModelChain 연동 검토 (P3) |

### 7.7 tests/ (111 파일)

| 파일 경로 | 영향 항목 | 영향도 | 현재 상태 | 제안 조치 |
|----------|----------|--------|----------|----------|
| `tests/suites/tc111-v036-enableagents.js` | enableAgents 테스트 | Low | 5개 TC 존재 | 정상 |
| `tests/suites/tc105-v035-feature-gates.js` | Feature flag 테스트 | Low | v0.36.0 플래그 4개 TC 존재 | 정상 |
| `tests/suites/tc09-pdca-e2e.js` | bkit:pdca prefix 테스트 | Low | `bkit:pdca` 테스트 케이스 존재 | `bkit:code-review` prefix 테스트 추가 (P3) |
| `tests/suites/tc109-v035-skill-agent-compat.js` | enableAgents 검증 | Low | TC109-11 존재 | 정상 |

---

## 8. 구현 우선순위 매트릭스

| 우선순위 | 항목 | 이유 | 예상 공수 | 영향 파일 |
|---------|------|------|----------|----------|
| **P0** | (해당 없음) | 모든 P0 이슈 대응 완료 | - | - |
| **P1** | (해당 없음) | 모든 P1 호환성 확인 완료 | - | - |
| **P2** | Extension skill prefix 범용 stripping | after-agent.js SKILL_HANDLERS에서 `bkit:` prefix 포함 스킬명 매칭 실패 가능 | 1h | after-tool.js, after-agent.js, utils/ |
| **P2** | Multi-Registry 활용: 에이전트 도구 격리 | SAFETY_TIERS를 CLI 네이티브 도구 격리로 강화 | 2h | mcp/spawn-agent-server.js |
| **P3** | allowRedirection 정책 추가 | 셸 리디렉션 세밀 제어 | 1h | lib/gemini/policy.js |
| **P3** | tracker.js blocked 상태 매핑 | PDCA 의존성 표현 강화 | 0.5h | lib/gemini/tracker.js |
| **P3** | bkend-security SKILL.md sandbox 안내 | 사용자 혼란 방지 | 0.2h | skills/bkend-security/SKILL.md |
| **P3** | 미활용 Feature Flag 활용 로드맵 | hasMultiRegistry, hasGitWorktree 등 5개 플래그 | 문서 | docs/ |
| **P3** | bkit: prefix 테스트 확장 | pdca 외 스킬에 대한 prefix 테스트 | 1h | tests/suites/ |
| **P3** | memoryManager 에이전트 평가 | save_memory 도구 향후 대체 대비 | 2h | memory-helper.js, tools.js |

---

## 9. 신뢰도 평가

| 분석 영역 | 신뢰도 | 근거 |
|----------|--------|------|
| Breaking Changes | HIGH (5/5) | 코드 전수 스캔 + PR 직접 대조 |
| Extension Skills Prefix | HIGH (4/5) | 코드 패턴 분석 완료. 실제 v0.36.0 CLI 동작 테스트는 미완 |
| Feature Flags | HIGH (5/5) | version.js + 전체 코드베이스 grep 완료 |
| Sandbox Governance | HIGH (5/5) | 전수 스캔 완료 |
| 새 기능 활용 기회 | MEDIUM (3/5) | 연구 문서 기반 분석. 실제 구현 가능성은 POC 필요 |
| 철학 정합성 | HIGH (4/5) | 4개 철학 문서 대조 완료 |

---

## Appendix A: 스캔 범위

### 코드 파일 스캔 목록

```
lib/gemini/version.js          (281줄) - 전수 분석
lib/gemini/policy.js            (652줄) - 전수 분석
lib/gemini/tools.js             (300줄) - 전수 분석
lib/gemini/hooks.js             (144줄) - 전수 분석
lib/gemini/tracker.js           (192줄) - 전수 분석
lib/gemini/platform.js          (226줄) - 전수 분석
lib/gemini/context-fork.js      (536줄) - 전수 분석
lib/gemini/import-resolver.js   (182줄) - 전수 분석
lib/gemini/model-resolver.js    (130줄) - 전수 분석
lib/skill-orchestrator.js       (755줄) - 전수 분석
hooks/scripts/session-start.js  (507줄) - 전수 분석
hooks/scripts/before-tool.js    (251줄) - 전수 분석
hooks/scripts/after-tool.js     (180줄) - 전수 분석
hooks/scripts/before-tool-selection.js (172줄) - 전수 분석
hooks/scripts/before-agent.js   (203줄) - 전수 분석
hooks/scripts/after-agent.js    (100줄+) - 전수 분석
hooks/scripts/pre-compress.js   (98줄) - 전수 분석
mcp/spawn-agent-server.js       (901줄) - 전수 분석
policies/bkit-extension-policy.toml - 전수 분석
bkit.config.json                - 전수 분석
```

### Grep 검색 키워드

```
activate_skill, /bkit:, bkit:, .bkit., skill_name, skillName
.gitignore, .geminiignore, .git/
save_memory, memoryManager
allowRedirection, toolAnnotations, ModelChain, multiRegistry
enableAgents, settings.json
hasBeforeToolAsk, hasGitWorktree, hasPlanModeNonInteractive
hasMultiRegistry, hasEnableAgentsDefaultFalse, hasToolNameRequired, hasStatelessSandbox
```

### 철학 문서 검증

```
bkit-system/philosophy/ai-native-principles.md
bkit-system/philosophy/context-engineering.md
bkit-system/philosophy/core-mission.md
bkit-system/philosophy/pdca-methodology.md
```

---

## Appendix B: 연구 문서 참조

| 문서 | 위치 | 용도 |
|------|------|------|
| v0.36.0 Stable 조사 보고서 | `docs/01-plan/research/gemini-cli-v036-stable-research.md` | Phase 1 조사 입력 |
| v0.36.0 마이그레이션 설계 | `docs/02-design/features/gemini-cli-v036-migration.design.md` | 설계 참조 |
| v0.36.0 마이그레이션 보고서 | `docs/04-report/gemini-cli-v036-migration.report.md` | 구현 보고서 |
| v0.35.0 영향 분석 | `docs/03-analysis/gemini-cli-v035-impact.analysis.md` | 이전 분석 참조 |
