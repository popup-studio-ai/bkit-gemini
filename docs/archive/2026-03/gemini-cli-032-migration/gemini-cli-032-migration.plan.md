# Gemini CLI v0.32.x Full Migration Planning Document

> **Summary**: Gemini CLI v0.31.0 -> v0.32.1 완전 마이그레이션 및 전체 고도화 (bkit v1.5.7 릴리즈)
>
> **Project**: bkit-gemini (Vibecoding Kit - Gemini CLI Edition)
> **Version**: v1.5.6 -> v1.5.7
> **Author**: CTO Agent Team
> **Date**: 2026-03-04
> **Status**: Draft
> **Reference**: `docs/04-report/features/gemini-cli-upgrade.report.md` (조사 분석 보고서)

---

## 1. Overview

### 1.1 Purpose

Gemini CLI가 v0.32.1까지 릴리즈되면서 5개 Breaking Change, 6개 새 빌트인 도구, Policy Engine 4-tier 시스템 등 대규모 변경이 발생. bkit-gemini v1.5.7에서 **단계적 접근 없이 모든 개선 사항을 일괄 반영**하여 v0.32.1 완전 호환 + 성능 고도화 + 보안 강화를 달성한다.

### 1.2 Background

- **현재 상태**: bkit v1.5.6, Gemini CLI v0.29.0~v0.31.0 지원
- **목표 상태**: bkit v1.5.7, Gemini CLI v0.29.0~v0.32.1 완전 지원
- 사용자가 `npm update -g @google/gemini-cli`로 v0.32.x를 설치하면 bkit가 부분적으로 깨지는 문제 해결
- 성능, 보안, 기능 모두 최신 CLI 기능을 최대한 활용

### 1.3 Related Documents

- 조사 분석 보고서: `docs/04-report/features/gemini-cli-upgrade.report.md`
- 이전 마이그레이션: `docs/archive/2026-02/gemini-cli-030-migration/`, `gemini-cli-031-migration`
- Gemini CLI Releases: `https://github.com/google-gemini/gemini-cli/releases`

---

## 2. Scope

### 2.1 In Scope

- [x] **WS-01**: Tool Registry 업데이트 (6개 새 Task Tracker 도구 + 어노테이션)
- [x] **WS-02**: Version Detector 확장 (11개 v0.32.0+ feature flags + nightly 파싱)
- [x] **WS-03**: Breaking Change 대응 (grep_search, read_file, replace 파라미터 변경)
- [x] **WS-04**: Policy Engine 4-tier 마이그레이션 (excludeTools 제거, Extension/Workspace 분리)
- [x] **WS-05**: RuntimeHook 함수 마이그레이션 (command -> function, 상위 6개 Hook)
- [x] **WS-06**: Task Tracker - PDCA Bridge 모듈 신규 개발
- [x] **WS-07**: AfterAgent 루프 가드 + Sub-agent 타임아웃 가드
- [x] **WS-08**: 16 에이전트 frontmatter 업데이트 (새 도구 + 파라미터 변경)
- [x] **WS-09**: 29 스킬 frontmatter 업데이트 (새 도구 + 파라미터 변경)
- [x] **WS-10**: 문서 전체 업데이트 (GEMINI.md, README.md, CHANGELOG.md, context modules)
- [x] **WS-11**: bkit.config.json 호환성 설정 업데이트
- [x] **WS-12**: 테스트 스위트 확장 (11개 새 테스트 케이스)

### 2.2 Out of Scope

- ADK Replatforming 대응 (Issue #20995, 장기 과제 - v1.6.0+에서 별도 진행)
- A2A 프로토콜 기반 Team Mode 재설계 (v1.6.0+)
- Gemma Router / Generalist Agent 통합 (experimental, CLI 안정화 후)
- Shell 자동완성 커스텀 프로바이더 (v1.6.0+)
- v0.33.0 preview 기능 (research subagents in plan mode 등)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Work Stream |
|----|-------------|----------|-------------|
| FR-01 | Tool Registry에 6개 Task Tracker 도구 등록 (BUILTIN_TOOLS, ALL_BUILTIN_TOOL_NAMES, TOOL_CATEGORIES, TOOL_ANNOTATIONS) | **P0** | WS-01 |
| FR-02 | Tool Registry에 tracker 도구용 CLAUDE_TO_GEMINI_MAP 매핑 추가 | P1 | WS-01 |
| FR-03 | Version Detector에 v0.32.0+ feature flags 11개 추가 | **P0** | WS-02 |
| FR-04 | Version Detector nightly 버전 포맷(`X.Y.Z-nightly.YYYYMMDD`) 파싱 지원 | P1 | WS-02 |
| FR-05 | grep_search `include` -> `include_pattern` 파라미터 변경 반영 (전 파일) | **P0** | WS-03 |
| FR-06 | read_file `offset`/`limit` -> `start_line`/`end_line` 파라미터 변경 반영 | **P0** | WS-03 |
| FR-07 | replace `expected_replacements` -> `allow_multiple` 파라미터 변경 반영 | P1 | WS-03 |
| FR-08 | gemini-extension.json에서 `excludeTools` 제거, Extension-level TOML 정책으로 대체 | **P0** | WS-04 |
| FR-09 | Policy Migrator에 Tier 2(Extension) / Tier 3(Workspace) 분리 로직 구현 | **P0** | WS-04 |
| FR-10 | Policy Migrator TOML 유효성 검증에 필드명 검증 추가 (`toolName` vs `toolname`) | P1 | WS-04 |
| FR-11 | Extension policies/ 디렉토리 구조 생성 및 DENY/ASK_USER only 정책 파일 배치 | P1 | WS-04 |
| FR-12 | 상위 6개 Hook을 `type: "function"` RuntimeHook으로 마이그레이션 | **P0** | WS-05 |
| FR-13 | Hook 스크립트를 dual-mode로 변환 (function export + stdin fallback) | **P0** | WS-05 |
| FR-14 | hook-adapter.js 활성화 (detection-only -> active migration) | P1 | WS-05 |
| FR-15 | tracker-bridge.js 신규 모듈 개발 (PDCA 태스크 체인 <-> Task Tracker 연동) | P1 | WS-06 |
| FR-16 | session-start.js에서 활성 PDCA 피처의 tracker epic 자동 생성 | P2 | WS-06 |
| FR-17 | after-tool.js에서 PDCA 페이즈 전환 시 tracker 태스크 상태 동기화 | P2 | WS-06 |
| FR-18 | after-agent.js에 자기 루프 감지 가드 추가 | **P0** | WS-07 |
| FR-19 | spawn-agent-server.js executeAgent()에 타임아웃 가드 강화 | P1 | WS-07 |
| FR-20 | spawn-agent-server.js --non-interactive 플래그 추가 (v0.32.0 regression 대응) | P1 | WS-07 |
| FR-21 | 16 에이전트 .md frontmatter에 tracker 도구 추가 (해당 에이전트만) | P1 | WS-08 |
| FR-22 | 16 에이전트 instructions에서 deprecated 파라미터명 업데이트 | P1 | WS-08 |
| FR-23 | 29 스킬 SKILL.md allowed-tools에 tracker 도구 추가 (해당 스킬만) | P1 | WS-09 |
| FR-24 | 29 스킬 instructions에서 deprecated 파라미터명 업데이트 | P1 | WS-09 |
| FR-25 | GEMINI.md 도구 수 17 -> 23 업데이트 + 새 도구 설명 | P1 | WS-10 |
| FR-26 | .gemini/context/tool-reference.md 전면 업데이트 | P1 | WS-10 |
| FR-27 | README.md 호환성 섹션, 버전 배지, 도구 매핑 테이블 업데이트 | P1 | WS-10 |
| FR-28 | CHANGELOG.md v1.5.7 엔트리 작성 | P1 | WS-10 |
| FR-29 | bkit.config.json testedVersions에 v0.32.0, v0.32.1 추가 | **P0** | WS-11 |
| FR-30 | bkit.config.json compatibility 섹션 확장 (tracker, runtimeHooks 설정) | P1 | WS-11 |
| FR-31 | gemini-extension.json version 1.5.6 -> 1.5.7 업데이트 | **P0** | WS-11 |
| FR-32 | 11개 신규 테스트 케이스 작성 (TC-21 ~ TC-31) | P1 | WS-12 |
| FR-33 | 기존 테스트 스위트 v0.32.x 환경 호환 검증 | P1 | WS-12 |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| **하위 호환성** | v0.29.0~v0.31.0에서 기존 동작 100% 유지 | 기존 테스트 스위트 전체 통과 |
| **상위 호환성** | v0.32.0~v0.32.1에서 모든 기능 정상 동작 | 신규 TC-21~TC-31 전체 통과 |
| **성능** | Hook 실행 시간 50% 이상 단축 (RuntimeHook 마이그레이션) | before/after 벤치마크 비교 |
| **보안** | Policy Engine TOML 필드명 검증, 루프 가드 | TC-25, TC-29 통과 |
| **코드 품질** | 기존 코드 패턴 준수, 새 모듈은 기존 모듈 구조 따름 | 코드 리뷰 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 모든 P0 요구사항 (FR-01, 03, 05, 06, 08, 09, 12, 13, 18, 29, 31) 구현 완료
- [ ] 모든 P1/P2 요구사항 구현 완료
- [ ] TC-21 ~ TC-31 신규 테스트 전체 통과
- [ ] 기존 테스트 스위트 전체 통과 (regression 없음)
- [ ] v0.29.0, v0.31.0, v0.32.1 3개 버전에서 호환성 검증
- [ ] CHANGELOG.md, README.md, GEMINI.md 문서 업데이트 완료
- [ ] gemini-extension.json version 1.5.7 반영

### 4.2 Quality Criteria

- [ ] Gap Analysis Match Rate >= 90%
- [ ] 새로 추가된 코드에 JSDoc 주석 포함
- [ ] 하위 호환 코드 경로에 feature flag 기반 분기 적용

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| v0.32.0 Sub-agent 행 버그 (#21052)가 v0.32.1에서도 미해결 | High | Medium | executeAgent()에 강화된 타임아웃 + 프로세스 킬 가드 추가. v0.32.1 실제 테스트로 확인 |
| AfterAgent 무한루프 버그 (#20426) 지속 | High | High | 자기 루프 감지 환경변수 가드 추가. hooks.json 10s 타임아웃 유지 |
| RuntimeHook `type: "function"` 포맷이 v0.32.x에서 미지원 또는 불안정 | High | Low | Dual-mode 구현: function export 우선, 실패 시 command fallback. Feature flag로 활성화 제어 |
| Policy Engine TOML 포맷 변경 | Medium | Low | validateTomlStructure()에 필드명 검증 추가. 생성 전 CLI 버전 체크 |
| 16개 에이전트/29개 스킬 대량 수정 시 regression | Medium | Medium | 체계적 grep으로 변경 대상 파일 특정. 변경 전후 diff 검증 |
| tracker 도구가 v0.29.0~v0.31.0에서 존재하지 않아 에러 | Medium | High | Feature flag `hasTaskTracker`로 v0.32.0+ 에서만 tracker 기능 활성화 |
| nightly/preview 버전에서 예측 불가 동작 | Low | Medium | isPreview/isNightly 플래그로 실험적 기능 보수적 처리 |

---

## 6. Architecture Considerations

### 6.1 Project Level

- **Selected**: Starter (bkit-gemini은 Gemini CLI 확장 - 프레임워크/앱이 아님)
- 확장 패턴: Library Module + Hook Script + Configuration

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Hook 마이그레이션 전략 | A) 전부 function / B) dual-mode / C) 점진적 | **B) dual-mode** | v0.29.0~v0.31.0 하위 호환 보장. function export 우선, stdin fallback |
| Policy Engine 전환 | A) excludeTools 유지+TOML 병행 / B) TOML only | **B) TOML only** | excludeTools deprecated 확정. 깔끔한 전환이 장기적으로 유리 |
| Task Tracker 통합 | A) 완전 대체 / B) Bridge 공존 / C) 무시 | **B) Bridge 공존** | MCP team 도구는 유지하면서 native tracker 연동 브릿지 추가 |
| 에이전트/스킬 업데이트 범위 | A) 전체 / B) 관련 항목만 | **B) 관련 항목만** | 불필요한 변경 최소화. grep으로 실제 영향받는 파일만 수정 |

### 6.3 모듈 구조

```
lib/adapters/gemini/
├── version-detector.js      [MODIFY] +11 feature flags, nightly parsing
├── tool-registry.js          [MODIFY] +6 tracker tools, annotations, categories
├── policy-migrator.js        [MODIFY] Tier-aware generation, field validation
├── hook-adapter.js           [MODIFY] Activate RuntimeHook migration
├── context-fork.js           (no change)
├── import-resolver.js        (no change)
└── tracker-bridge.js         [NEW] PDCA <-> Task Tracker bridge (~200 lines)

hooks/
├── hooks.json                [MODIFY] type: "command" -> "function" (6 hooks)
└── scripts/
    ├── session-start.js      [MODIFY] v0.32.0 features, tracker bridge
    ├── before-agent.js       [MODIFY] dual-mode export
    ├── before-model.js       [MODIFY] dual-mode export
    ├── after-model.js        [MODIFY] dual-mode export
    ├── before-tool-selection.js [MODIFY] tracker tools in phase filtering, dual-mode
    ├── before-tool.js        [MODIFY] tracker tool permissions, dual-mode
    ├── after-tool.js         [MODIFY] tracker sync, dual-mode
    ├── after-agent.js        [MODIFY] loop guard, dual-mode
    ├── pre-compress.js       [MODIFY] dual-mode export
    └── session-end.js        [MODIFY] dual-mode export

gemini-extension.json         [MODIFY] Remove excludeTools, version 1.5.7
policies/                     [NEW] Extension-level TOML policies
└── bkit-extension-policy.toml [NEW] DENY/ASK_USER rules

mcp/
└── spawn-agent-server.js     [MODIFY] Timeout guard, --non-interactive

agents/                       [MODIFY] Selective frontmatter + instructions update
skills/                       [MODIFY] Selective allowed-tools + instructions update

bkit.config.json              [MODIFY] testedVersions, tracker config, runtimeHooks
GEMINI.md                     [MODIFY] Tool count, new features
README.md                     [MODIFY] Compatibility, badges, tool mapping
CHANGELOG.md                  [MODIFY] v1.5.7 entry
.gemini/context/tool-reference.md [MODIFY] Full rewrite with 23 tools
```

---

## 7. Detailed Work Streams

### WS-01: Tool Registry 업데이트

**파일**: `lib/adapters/gemini/tool-registry.js`
**예상 변경량**: ~60 lines 추가

```
변경 내역:
1. BUILTIN_TOOLS에 6개 tracker 상수 추가
2. TOOL_CATEGORIES에 TASK_TRACKER 카테고리 추가
3. TOOL_ANNOTATIONS에 6개 tracker 도구 어노테이션 추가
4. CLAUDE_TO_GEMINI_MAP에 tracker 매핑 추가 (TodoWrite -> tracker 연동)
5. getReadOnlyTools()에 read-only tracker 도구 추가 (tracker_get_task, tracker_list_tasks, tracker_visualize)
6. isValidToolName()이 새 도구를 인식하도록 자동 반영 (ALL_BUILTIN_TOOL_NAMES Set 기반)
```

**검증**: ALL_BUILTIN_TOOL_NAMES.size === 23

---

### WS-02: Version Detector 확장

**파일**: `lib/adapters/gemini/version-detector.js`
**예상 변경량**: ~30 lines 추가/수정

```
변경 내역:
1. getFeatureFlags()에 v0.32.0+ flags 11개 추가:
   - hasTaskTracker, hasModelFamilyToolsets, hasExtensionPolicies
   - hasPlanModeEnhanced, hasA2AStreaming, hasShellAutocompletion
   - hasGrepIncludePatternRename, hasReadFileLineParams
   - hasParallelExtensionLoading, hasReplaceAllowMultiple
   - hasExcludeToolsRemoved (향후 대비)
2. parseVersion() nightly 포맷 지원:
   - /^(\d+)\.(\d+)\.(\d+)(-(?:preview\.(\d+)|nightly\.(\d+)))?/
   - isNightly 플래그 추가
3. getVersionSummary()에 nightly 표시 추가
```

**검증**: `parseVersion('0.34.0-nightly.20260304')` 정상 파싱

---

### WS-03: Breaking Change 대응

**대상 파일**: 에이전트 16개 .md + 스킬 29개 SKILL.md + context 모듈 + hook 스크립트

```
변경 내역:
1. grep_search include -> include_pattern:
   - grep으로 "include" 파라미터 언급하는 모든 파일 탐색
   - v0.32.0+ 에서만 적용되도록 문서에 버전 노트 추가

2. read_file offset/limit -> start_line/end_line:
   - grep으로 "offset"/"limit" 언급 파일 탐색
   - 에이전트/스킬 instructions 업데이트

3. replace expected_replacements -> allow_multiple:
   - grep으로 "expected_replacements" 언급 파일 탐색
   - 에이전트/스킬 instructions 업데이트
```

**전략**: 파라미터명은 문서/instructions에서만 변경. Hook 스크립트에서 실제 파라미터를 파싱하는 경우 버전별 분기 처리.

---

### WS-04: Policy Engine 4-Tier 마이그레이션

**파일**: `gemini-extension.json`, `lib/adapters/gemini/policy-migrator.js`, NEW `policies/bkit-extension-policy.toml`

```
변경 내역:

1. gemini-extension.json:
   - "excludeTools" 섹션 완전 제거
   - Extension manifest는 policies/ 디렉토리 참조

2. policies/bkit-extension-policy.toml (NEW):
   # bkit Extension Policy (Tier 2 - DENY/ASK_USER only)
   [[rule]]
   toolName = "run_shell_command"
   commandPrefix = "rm -rf"
   decision = "deny"
   priority = 100

   [[rule]]
   toolName = "run_shell_command"
   commandPrefix = "git push --force"
   decision = "deny"
   priority = 100

3. policy-migrator.js:
   - generateExtensionPolicy(): Tier 2 전용 (DENY/ASK_USER만 허용)
   - generateWorkspacePolicy(): Tier 3 전용 (ALLOW 포함)
   - validateTomlStructure(): 필드명 검증 추가 (toolName != toolname)
   - LEVEL_POLICY_TEMPLATES 주석에 Tier 설명 명확화

4. permission.js:
   - v0.32.0+ Policy Engine 감지 시 Extension 정책 존재 여부 체크
   - 하위 버전에서는 기존 bkit pattern matching 유지
```

**하위 호환**: v0.29.0~v0.31.0에서는 `excludeTools` 없어도 `permission.js`의 pattern matching이 동일 보안 수준 제공. Policy Engine이 없는 버전에서는 bkit 자체 permission이 동작.

---

### WS-05: RuntimeHook 함수 마이그레이션

**파일**: `hooks/hooks.json`, 10개 hook 스크립트, `lib/adapters/gemini/hook-adapter.js`

```
변경 내역:

1. hooks.json - 10개 Hook 모두 dual-mode 등록:
   {
     "name": "bkit-intent-detection",
     "type": "function",                    // v0.31.0+ RuntimeHook
     "source": "${extensionPath}/hooks/scripts/before-agent.js",
     "export": "handler",
     "fallback": {                          // v0.29.0~v0.30.x fallback
       "type": "command",
       "command": "node ${extensionPath}/hooks/scripts/before-agent.js"
     }
   }

   NOTE: 실제 Gemini CLI hooks.json 스펙에 fallback 지원 여부 확인 필요.
   미지원 시 대안: version-detector 기반으로 hooks.json을 동적 생성
   (session-start에서 적절한 hooks.json 심볼릭 링크 교체)

2. 10개 Hook 스크립트 dual-mode 변환 패턴:

   // --- Dual-mode: RuntimeHook function (v0.31.0+) + command stdin (legacy) ---
   async function handler(event) {
     // Direct object access - no JSON parsing needed
     const result = await processHook(event);
     return result;
   }

   // Legacy command mode: stdin JSON
   if (require.main === module) {
     const fs = require('fs');
     try {
       const input = JSON.parse(fs.readFileSync('/dev/stdin', 'utf-8'));
       handler(input).then(result => {
         process.stdout.write(JSON.stringify(result));
       });
     } catch (e) {
       process.exit(0);
     }
   }

   module.exports = { handler };

3. hook-adapter.js 활성화:
   - getHookConfig(): hooks.json 생성/업데이트 로직
   - shouldUseFunction(): version-detector 연동
   - 마이그레이션 상태 보고 (session metadata에 포함)
```

**성능 기대치**:
- 현재: Hook 1회 호출 ~50-200ms (child_process spawn + Node.js boot)
- 이후: Hook 1회 호출 ~1-5ms (in-process function call)
- 1턴 누적 (최대 6 Hook): ~300-1200ms -> ~6-30ms (**40배~97% 개선**)

---

### WS-06: Task Tracker - PDCA Bridge

**파일**: NEW `lib/adapters/gemini/tracker-bridge.js` (~200 lines)

```
모듈 설계:

/**
 * Task Tracker - PDCA Bridge
 * Maps PDCA task chain to native Gemini CLI Task Tracker (v0.32.0+)
 */

exports = {
  // PDCA Epic 생성
  createPdcaEpic(feature, phases) -> epicId
    // tracker_create_task(type: "epic", title: `[PDCA] ${feature}`)
    // 각 phase를 sub-task로 생성

  // PDCA 페이즈 상태 동기화
  syncPhaseStatus(feature, phase, status) -> void
    // tracker_update_task(task_id, status: mapPdcaToTrackerStatus(status))

  // PDCA 진행 시각화
  getPdcaVisualization(feature) -> string
    // tracker_visualize(root_task_id: epicId)

  // .pdca-status.json <-> .tracker/tasks/ 양방향 동기화
  syncBidirectional(feature) -> { pdcaStatus, trackerStatus }

  // Feature flag 체크
  isTrackerAvailable() -> boolean
    // getFeatureFlags().hasTaskTracker
}

PDCA Phase -> Tracker Status 매핑:
  plan     -> "in_progress"  (epic created)
  design   -> "in_progress"  (design task active)
  do       -> "in_progress"  (implementation task active)
  check    -> "in_progress"  (analysis task active)
  act      -> "in_progress"  (iteration task active)
  completed -> "done"        (all tasks done)
```

**통합 포인트**:
- `session-start.js`: 활성 피처에 대해 tracker epic 존재 여부 확인, 없으면 생성
- `after-tool.js`: PDCA 페이즈 전환 시 tracker 태스크 상태 업데이트
- `pdca` 스킬: `/pdca status`에 tracker 시각화 포함

---

### WS-07: 버그 가드 (AfterAgent Loop + Sub-agent Timeout)

**파일**: `hooks/scripts/after-agent.js`, `mcp/spawn-agent-server.js`

```
1. after-agent.js 루프 가드:

   const LOOP_GUARD_KEY = '__bkit_after_agent_invoked';
   const MAX_REENTRY = 3;

   function handler(event) {
     const count = parseInt(process.env[LOOP_GUARD_KEY] || '0');
     if (count >= MAX_REENTRY) {
       return { result: 'continue' }; // 즉시 통과
     }
     process.env[LOOP_GUARD_KEY] = String(count + 1);

     // 기존 로직...

     // 완료 후 카운터 리셋 (정상 종료 시)
     process.env[LOOP_GUARD_KEY] = '0';
     return result;
   }

2. spawn-agent-server.js 타임아웃 강화:

   function executeAgent(agentPath, task, options) {
     const DEFAULT_TIMEOUT = 120000; // 2분
     const MAX_TIMEOUT = 600000;     // 10분
     const timeout = Math.min(options.timeout || DEFAULT_TIMEOUT, MAX_TIMEOUT);

     const proc = spawn('gemini', ['-e', agentPath, ...flags], {
       timeout,
       stdio: ['pipe', 'pipe', 'pipe']  // 모든 stdio를 pipe로 (interactive 방지)
     });

     // 타임아웃 시 강제 종료
     const timer = setTimeout(() => {
       proc.kill('SIGTERM');
       setTimeout(() => proc.kill('SIGKILL'), 5000);
     }, timeout);
   }
```

---

### WS-08: 에이전트 업데이트 (16개)

```
업데이트 기준:
- tracker 도구가 필요한 에이전트: cto-lead, product-manager, pdca-iterator, qa-strategist
- grep_search 파라미터 언급 에이전트: 전체 탐색 후 해당 에이전트만
- read_file 파라미터 언급 에이전트: 전체 탐색 후 해당 에이전트만

frontmatter tools 추가 대상:
- cto-lead: +tracker_create_task, +tracker_update_task, +tracker_list_tasks, +tracker_visualize
- product-manager: +tracker_create_task, +tracker_list_tasks
- pdca-iterator: +tracker_update_task, +tracker_get_task
- qa-strategist: +tracker_list_tasks, +tracker_visualize

instructions 업데이트: grep으로 실제 파라미터명 언급 부분만 수정
```

---

### WS-09: 스킬 업데이트 (29개)

```
업데이트 기준:
- tracker 도구가 필요한 스킬: pdca, development-pipeline, phase-8-review
- 파라미터 변경 영향 스킬: 전체 탐색 후 해당 스킬만

allowed-tools 추가 대상:
- pdca/SKILL.md: +tracker_create_task, +tracker_update_task, +tracker_list_tasks, +tracker_visualize
- development-pipeline/SKILL.md: +tracker_list_tasks, +tracker_visualize
- phase-8-review/SKILL.md: +tracker_list_tasks

instructions 업데이트: grep으로 실제 파라미터명 언급 부분만 수정
```

---

### WS-10: 문서 업데이트

```
1. GEMINI.md:
   - "17 built-in tools" -> "23 built-in tools"
   - 새 도구 카테고리 추가 (Task Tracker)
   - 호환 버전 범위 업데이트

2. .gemini/context/tool-reference.md:
   - 6개 tracker 도구 설명 추가
   - 파라미터 변경 사항 반영
   - 23개 도구 전체 테이블 업데이트

3. README.md:
   - 버전 배지: v0.29.0~v0.32.1
   - 호환성 테이블 업데이트
   - 도구 매핑 테이블에 tracker 추가
   - v1.5.7 Highlights 섹션

4. CHANGELOG.md:
   - [1.5.7] - 2026-03-XX 엔트리 전체 작성

5. .gemini/context/commands.md:
   - /pdca 관련 tracker 연동 설명 추가

6. .gemini/context/agent-triggers.md:
   - 업데이트 불필요 (에이전트 수 변경 없음)

7. .gemini/context/feature-report.md:
   - 도구 수 업데이트
```

---

### WS-11: 설정 파일 업데이트

```
1. bkit.config.json:
   - compatibility.testedVersions: +["0.32.0", "0.32.1"]
   - compatibility.runtimeHooks: { enabled: true, minVersion: "0.31.0" }
   - compatibility.taskTracker: { enabled: true, minVersion: "0.32.0", bridgeEnabled: true }
   - permissions: 기존 유지 (bkit 내부 permission manager용)

2. gemini-extension.json:
   - version: "1.5.7"
   - excludeTools 섹션 삭제
   - description 업데이트
```

---

### WS-12: 테스트 스위트

```
신규 테스트 케이스:

TC-21: Tool Registry - 23개 도구 등록 검증
TC-22: Tool Registry - 6개 tracker 도구 어노테이션 검증
TC-23: Feature Flags - 11개 v0.32.0+ 플래그 검증
TC-24: Policy Engine - Extension/Workspace Tier 분리 생성 검증
TC-25: Policy Engine - 필드명 검증 (toolName vs toolname)
TC-26: Version Detector - nightly 버전 포맷 파싱 검증
TC-27: Before Tool Selection - tracker 도구 PDCA 페이즈별 필터링 검증
TC-28: Sub-agent - v0.32.1 spawn_agent 동작 검증 (타임아웃 포함)
TC-29: AfterAgent - 루프 가드 동작 검증 (MAX_REENTRY=3)
TC-30: grep_search - include_pattern 파라미터 처리 검증
TC-31: Tracker Bridge - PDCA 태스크 체인 생성/동기화 검증

기존 테스트 v0.32.x 호환 검증:
- TC-01 ~ TC-20 전체 실행
- 환경변수 GEMINI_CLI_VERSION=0.32.1로 feature flag 검증
```

---

## 8. Implementation Order

```
구현 순서 (의존성 기반):

Phase 1: Foundation (WS-02 -> WS-01)
  ① version-detector.js 확장 (모든 feature flag의 기반)
  ② tool-registry.js 업데이트 (다른 모듈이 참조)

Phase 2: Breaking Changes (WS-03)
  ③ 파라미터 변경 일괄 반영 (grep 탐색 -> 일괄 수정)

Phase 3: Core Infrastructure (WS-04 -> WS-05 -> WS-07)
  ④ Policy Engine 마이그레이션 (gemini-extension.json 변경)
  ⑤ RuntimeHook 함수 마이그레이션 (hooks.json + 10개 스크립트)
  ⑥ 버그 가드 추가 (after-agent + spawn-agent-server)

Phase 4: New Feature (WS-06)
  ⑦ tracker-bridge.js 신규 모듈 개발
  ⑧ session-start.js / after-tool.js 통합

Phase 5: Propagation (WS-08 -> WS-09)
  ⑨ 16 에이전트 업데이트
  ⑩ 29 스킬 업데이트

Phase 6: Documentation & Config (WS-10 -> WS-11)
  ⑪ 문서 전체 업데이트
  ⑫ 설정 파일 업데이트

Phase 7: Verification (WS-12)
  ⑬ TC-21 ~ TC-31 작성 및 실행
  ⑭ 기존 TC-01 ~ TC-20 regression 테스트
  ⑮ 3개 버전 호환성 최종 검증
```

---

## 9. File Change Summary

| Category | Files Modified | Files Created | Estimated Lines |
|----------|---------------|---------------|----------------|
| Core Modules | 5 | 1 | ~350 |
| Hook Scripts | 10 | 0 | ~200 |
| Hook Config | 1 | 0 | ~50 |
| Extension Manifest | 1 | 0 | ~10 |
| Policy Files | 0 | 1 | ~30 |
| MCP Server | 1 | 0 | ~30 |
| Agents | ~4-8 | 0 | ~40 |
| Skills | ~3-6 | 0 | ~30 |
| Config | 1 | 0 | ~15 |
| Documentation | 6 | 0 | ~200 |
| Tests | 1-2 | 0 | ~300 |
| **Total** | **~35-40** | **2** | **~1,255** |

---

## 10. Next Steps

1. [ ] Plan 리뷰 및 승인
2. [ ] Design 문서 작성 (`/pdca design gemini-cli-032-migration`)
3. [ ] 구현 시작 (Phase 1부터 순차 진행)
4. [ ] Gap Analysis 실행 (`/pdca analyze gemini-cli-032-migration`)
5. [ ] v1.5.7 릴리즈

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-04 | Initial draft - 조사 분석 보고서 기반 전체 고도화 계획 | CTO Agent Team |
