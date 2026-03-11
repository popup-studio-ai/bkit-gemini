# bkit-gemini v1.5.8 종합 테스트 계획서

> **요약**: bkit-gemini v1.5.8의 전체 기능을 10개 관점에서 검증하는 종합 테스트 계획
>
> **프로젝트**: bkit-gemini
> **버전**: v1.5.8
> **작성자**: CTO Team
> **작성일**: 2026-03-11
> **상태**: Draft v0.3

---

## Executive Summary

| 항목 | 값 |
|------|-----|
| Feature | bkit-gemini v1.5.8 종합 테스트 |
| 작성일 | 2026-03-11 |
| 테스트 대상 | 170+ 컴포넌트 (50 lib 모듈, 21 에이전트, 35 스킬, 24 커맨드, 17 훅, 10+ 설정/컨텍스트) |
| 테스트 케이스 | **총 880+ TC** (10개 관점, 54개 신규 스위트) |
| 기존 테스트 | TC-01~TC-24 (v1.5.7 기준, 회귀 테스트, ~219 TC) |
| 신규 테스트 | TC-25~TC-78 (v1.5.8 신규 + 확장, ~666 TC) |
| 테스트 프레임워크 | Node.js 자체 assert (외부 의존성 없음) |

### Value Delivered (4관점)

| 관점 | 내용 |
|------|------|
| **Problem** | v1.5.8 신규 기능 44개 FR 검증 미완, 170+ 컴포넌트 다각도 검증 필요 |
| **Solution** | 10개 관점의 종합 테스트: Unit/E2E/통합/시나리오/철학/보안/에지케이스/경계값/에러복구/인프라 |
| **기능/UX 효과** | 100% 기능 검증, 릴리스 품질 보증, 회귀 방지, 엣지 케이스 + 인프라 커버 |
| **핵심 가치** | "출시 가능 품질"을 880+ 자동화 테스트로 객관적 검증 |

---

## 1. 개요

### 1.1 목적

bkit-gemini v1.5.8의 전체 기능을 10가지 관점에서 880건 이상의 테스트 케이스로 검증하여 릴리스 품질을 보증한다.

### 1.2 테스트 관점 (10개)

| # | 관점 | 설명 | TC 수 | 범위 |
|---|------|------|:-----:|------|
| 1 | **Unit Test** | 개별 함수/모듈 단위 검증 | ~200 | lib/ 50개 모듈의 exported 함수 |
| 2 | **E2E Test** | 전체 워크플로우 종단간 검증 | ~60 | PDCA 사이클, 팀 오케스트레이션, 스킬 활성화 |
| 3 | **통합 테스트** | 모듈 간 연동 검증 | ~80 | Hook → Lib → Config 체인, Agent-Skill 바인딩 |
| 4 | **시나리오 테스트** | 사용자 경험 관점 시뮬레이션 | ~50 | 초보자/중급자/전문가/PM/다국어 시나리오 |
| 5 | **철학 검증** | bkit 설계 사상/원칙 준수 확인 | ~50 | Context Engineering, PDCA, No Guessing, AI-Native |
| 6 | **보안/호환성** | 보안 취약점 + 버전 호환성 | ~45 | SemVer, TOML 인젝션, 퍼미션, 버전 매트릭스 |
| 7 | **에지 케이스** | 비정상 입력/경계 상황 검증 | ~50 | Null/undefined, 빈 데이터, 특수문자, 동시성 |
| 8 | **경계값 테스트** | 임계값/한계치 검증 | ~35 | 버전 경계, 설정 한계, 데이터 크기 |
| 9 | **에러 복구** | 장애 상황 복원력 검증 | ~35 | 파일 손상, 모듈 누락, 캐시 무효화, Graceful degradation |
| 10 | **인프라/리소스** | 출력 스타일, 템플릿, 훅 인프라 검증 | ~55 | Output Style, Template, Hook 개별 스크립트, Hook 설정 |
| 11 | **회귀 변형** | 기존 TC를 v1.5.8 변경사항에 맞춰 변형 검증 | ~219 | TC-01~TC-24 회귀 + version assertion 업데이트 |

### 1.3 테스트 환경

```
- Node.js: 18+ (LTS)
- OS: macOS / Linux / Windows (크로스 플랫폼)
- Gemini CLI: v0.29.0 ~ v0.33.0 (최소~최대 지원)
- 테스트 프레임워크: 자체 test-utils.js (외부 의존성 없음)
- 테스트 프로젝트: tests/bkit-test-project/ (자동 생성/정리)
```

### 1.4 테스트 대상 컴포넌트 상세

#### lib/ 모듈 (50개)

| 카테고리 | 모듈 | 파일 수 |
|----------|------|:-------:|
| adapters/ | index.js, platform-interface.js | 2 |
| adapters/gemini/ | index.js, tool-registry.js, version-detector.js, policy-migrator.js, tracker-bridge.js, hook-adapter.js, import-resolver.js, context-fork.js | 8 |
| core/ | index.js, paths.js, config.js, cache.js, debug.js, file.js, io.js, platform.js, memory.js, agent-memory.js, permission.js | 11 |
| intent/ | index.js, language.js, trigger.js, ambiguity.js, language-patterns.js | 5 |
| pdca/ | index.js, status.js, phase.js, level.js, automation.js, tier.js | 6 |
| task/ | index.js, classification.js, context.js, creator.js, dependency.js, tracker.js | 6 |
| team/ | index.js, coordinator.js, strategy.js, cto-logic.js, communication.js, task-queue.js, state-recorder.js, pattern-selector.js, memory.js | 9 |
| root | common.js, skill-orchestrator.js, context-hierarchy.js | 3 |

#### agents/ (21개)

cto-lead, product-manager, qa-strategist, gap-detector, pdca-iterator, code-analyzer, report-generator, design-validator, qa-monitor, starter-guide, pipeline-guide, bkend-expert, enterprise-expert, infra-architect, frontend-architect, security-architect, pm-lead, pm-discovery, pm-strategy, pm-research, pm-prd

#### skills/ (35개)

pdca, development-pipeline, plan-plus, simplify, loop, batch, output-style-setup, starter, dynamic, enterprise, pm-discovery, code-review, zero-script-qa, gemini-cli-learning, mobile-app, desktop-app, bkit-templates, bkit-rules, phase-1~phase-9 (9개), bkend-quickstart, bkend-auth, bkend-data, bkend-storage, bkend-mcp, bkend-cookbook, bkend-guides, bkend-security

#### commands/ (24개)

pdca, pipeline, plan-plus, simplify, loop, batch, pm-discovery, output-style-setup, starter, dynamic, enterprise, learn, review, qa, bkit, github-stats, bkend-quickstart, bkend-auth, bkend-data, bkend-storage, bkend-mcp, bkend-cookbook, bkend-guides, bkend-security

---

## 2. 범위

### 2.1 In Scope

#### 회귀 테스트 (기존 TC-01~TC-24, ~219 TC)
- [x] 기존 24개 테스트 스위트 전체 통과 확인 (실측 219 TC)
- [x] v1.5.8 변경으로 인한 회귀 여부 검증
- [x] version assertion 1.5.7 → 1.5.8 업데이트

#### 신규 테스트 (TC-25~TC-78, ~666 TC)
- [ ] 관점 1: Unit Test (TC-25~TC-38, ~200 TC)
- [ ] 관점 2: E2E Test (TC-39~TC-43, ~63 TC)
- [ ] 관점 3: 통합 테스트 (TC-44~TC-49, ~83 TC)
- [ ] 관점 4: 시나리오 테스트 (TC-50~TC-54, ~50 TC)
- [ ] 관점 5: 철학 검증 (TC-55~TC-59, ~50 TC)
- [ ] 관점 6: 보안/호환성 (TC-60~TC-63, ~45 TC)
- [ ] 관점 7: 에지 케이스 (TC-64~TC-68, ~50 TC)
- [ ] 관점 8: 경계값 테스트 (TC-69~TC-71, ~35 TC)
- [ ] 관점 9: 에러 복구 (TC-72~TC-74, ~35 TC)
- [ ] 관점 10: 인프라/리소스 (TC-75~TC-78, ~55 TC)

### 2.2 Out of Scope

- Gemini CLI 런타임 실제 호출 (모킹으로 대체)
- 네트워크 의존 테스트 (google_web_search, web_fetch)
- UI/브라우저 테스트 (CLI 도구이므로)

---

## 3. 요구사항

### 3.1 기능 요구사항

| FR-ID | 요구사항 | 관련 TC | 우선순위 |
|-------|---------|---------|:--------:|
| FR-T01 | 기존 회귀 테스트 전체 통과 | TC-01~TC-24 | P0 |
| FR-T02 | v0.33.x 호환성 Unit Test | TC-25~TC-26, TC-38 | P0 |
| FR-T03 | PM Agent Team 통합 테스트 | TC-44, TC-53 | P1 |
| FR-T04 | CTO Team 모듈 Unit Test | TC-31 | P0 |
| FR-T05 | 신규 스킬 구조 검증 | TC-27, TC-45 | P1 |
| FR-T06 | Path Registry Unit Test | TC-32 | P1 |
| FR-T07 | Hook System 확장 테스트 | TC-40, TC-49 | P0 |
| FR-T08 | PDCA E2E 사이클 테스트 | TC-39 | P0 |
| FR-T09 | 사용자 시나리오 테스트 | TC-50~TC-54 | P1 |
| FR-T10 | bkit 철학 검증 테스트 | TC-55~TC-59 | P1 |
| FR-T11 | 8개국어 트리거 테스트 | TC-29, TC-54 | P2 |
| FR-T12 | 보안/호환성 테스트 | TC-60~TC-63 | P1 |
| FR-T13 | 에지 케이스 테스트 | TC-64~TC-68 | P1 |
| FR-T14 | 경계값 테스트 | TC-69~TC-71 | P2 |
| FR-T15 | 에러 복구 테스트 | TC-72~TC-74 | P1 |
| FR-T16 | lib/task/ 모듈 Unit Test | TC-33 | P1 |
| FR-T17 | lib/pdca/ 모듈 Unit Test | TC-30 | P0 |
| FR-T18 | lib/core/ 모듈 Unit Test | TC-32~TC-34 | P1 |
| FR-T19 | lib/adapters/ 모듈 Unit Test | TC-35~TC-36 | P1 |
| FR-T20 | Context Engineering 통합 | TC-46 | P1 |

---

## 4. 상세 테스트 케이스

### 4.1 관점 1: Unit Test (TC-25~TC-38, ~200 TC)

---

#### TC-25: tool-registry.js v1.5.8 (20 TC)

```
TC-25-01: TOOL_PARAM_CHANGES 구조체에 3개 키(read_file, replace, grep_search) 존재 확인
TC-25-02: getToolParamChanges('read_file') - lineNumberBase=1, params에 start_line/end_line 존재
TC-25-03: getToolParamChanges('replace') - params.allow_multiple.since='0.31.0', requiredSince='0.33.0'
TC-25-04: getToolParamChanges('grep_search') - glob→include_pattern 리네임 since='0.32.0'
TC-25-05: getToolParamChanges('nonexistent_tool') → null 반환 (null 안전성)
TC-25-06: getVersionedParamName('grep_search', 'glob', '0.32.0') → 'include_pattern'
TC-25-07: getVersionedParamName('grep_search', 'include_pattern', '0.32.0') → 'include_pattern' (이미 신규명)
TC-25-08: getVersionedParamName('grep_search', 'glob', '0.31.0') → 'glob' (이전 버전 유지)
TC-25-09: resolveToolName('edit_file') → 'replace'
TC-25-10: resolveToolName('find_files') → 'glob'
TC-25-11: resolveToolName('web_search') → 'google_web_search'
TC-25-12: resolveToolName('search_file_content') → 'grep_search' (공식 레거시)
TC-25-13: resolveToolName('read_file') → 'read_file' (이미 정규명)
TC-25-14: isReadOnlyTool('read_file') → true
TC-25-15: isReadOnlyTool('glob') → true
TC-25-16: isReadOnlyTool('write_file') → false
TC-25-17: isReadOnlyTool('run_shell_command') → false
TC-25-18: CLAUDE_TO_GEMINI_MAP - 'Write'→'write_file', 'TaskCreate'→'tracker_create_task' 등 전체 매핑
TC-25-19: ALL_BUILTIN_TOOL_NAMES.size === 23 (전수 확인)
TC-25-20: TOOL_CATEGORIES 카테고리별 도구 수 - FILE_MANAGEMENT=7, SEARCH=2, SHELL=1, WEB=2, AI=3, PLAN=2, TASK_TRACKER=6
```

---

#### TC-26: version-detector.js v1.5.8 (25 TC)

```
TC-26-01: parseVersion('0.33.0') → { major:0, minor:33, patch:0, isPreview:false, isNightly:false }
TC-26-02: parseVersion('0.33.0-preview.4') → { major:0, minor:33, patch:0, previewNum:4, isPreview:true }
TC-26-03: parseVersion('0.34.0-nightly.20260304') → { isNightly:true, nightlyNum:20260304 }
TC-26-04: parseVersion(null) → 기본값 { major:0, minor:29, patch:0 }
TC-26-05: parseVersion(undefined) → 기본값
TC-26-06: parseVersion('') → 기본값
TC-26-07: parseVersion('abc') → 기본값 (비정상 문자열)
TC-26-08: compareVersions('0.33.0', '0.32.0') → 1 (a > b)
TC-26-09: compareVersions('0.29.0', '0.33.0') → -1 (a < b)
TC-26-10: compareVersions('0.33.0', '0.33.0') → 0 (equal)
TC-26-11: compareVersions('0.33.1', '0.33.0') → 1 (patch 차이)
TC-26-12: compareVersions('1.0.0', '0.99.99') → 1 (major 차이)
TC-26-13: isVersionAtLeast('0.30.0') (v0.33.0 환경) → true
TC-26-14: isVersionAtLeast('0.34.0') (v0.33.0 환경) → false
TC-26-15: isVersionAtLeast('0.33.0') (v0.33.0 환경) → true (경계값 포함)
TC-26-16: getFeatureFlags() v0.33.0 - 7개 플래그 모두 true 확인
  (hasMcpV2Prep, hasNativeSubagents, hasPlanDirectory, hasThemeSupport,
   hasExcludeToolsConfig, hasAgentsDirectory, hasReplaceAllowMultipleRequired)
TC-26-17: getFeatureFlags() v0.29.0 - hasPlanMode=true만, 나머지 false
TC-26-18: getBkitFeatureFlags() v0.33.0 - 5개 게이트 검증
  (canUseTeam, canUsePmTeam, canUseNativeAgents, canUsePlanDirectory, canUseExcludeTools)
TC-26-19: getBkitFeatureFlags() v0.29.0 - 모든 게이트 false
TC-26-20: getBkitFeatureFlags() v0.32.0 - canUseTeam=true, canUseNativeAgents=false
TC-26-21: isValidSemVer('0.33.0') → true
TC-26-22: isValidSemVer('0.33.0-preview.4') → true
TC-26-23: isValidSemVer('abc') → false
TC-26-24: isValidSemVer('0.33.0;rm -rf /') → false (인젝션 시도)
TC-26-25: isVersionBeyondPlausible('2.0.1') → true, '0.33.0' → false
```

---

#### TC-27: skill-orchestrator.js 확장 (20 TC)

```
TC-27-01: getSkillsByClassification('W') → 10개 워크플로우 스킬
TC-27-02: getSkillsByClassification('C') → 24개 역량 스킬
TC-27-03: getSkillsByClassification('H') → 1개 하이브리드 (pm-discovery)
TC-27-04: getSkillsByClassification(null) → 35개 전체 반환
TC-27-05: getSkillsByClassification('X') → 0개 (존재하지 않는 분류)
TC-27-06: getSkillsByClassification('w') → 대소문자 무시, 10개 반환
TC-27-07: listSkills() → 35개 전체 스킬 목록
TC-27-08: parseSkillFrontmatter('pdca/SKILL.md') → classification='W'
TC-27-09: parseSkillFrontmatter('code-review/SKILL.md') → classification='C'
TC-27-10: parseSkillFrontmatter('pm-discovery/SKILL.md') → classification='H'
TC-27-11: applyDefaults() classification 필드 없는 YAML → null 반환
TC-27-12: applyDefaults() classification='W' → 'W' 유지
TC-27-13: 35개 스킬 전부 classification 필드 보유 확인 (전수 검증)
TC-27-14: W 스킬 목록 정확성: pdca, development-pipeline, plan-plus, simplify, loop, batch, output-style-setup, starter, dynamic, enterprise
TC-27-15: getSkillsByClassification() 반환 객체에 name, description, classification 필드
TC-27-16: listSkills() 반환 객체에 name, description 필드
TC-27-17: parseSkillFrontmatter() YAML 문법 오류 파일 → 빈 객체 반환
TC-27-18: parseSkillFrontmatter() 존재하지 않는 파일 → 빈 객체 반환
TC-27-19: 스킬 디렉토리에 SKILL.md 없는 디렉토리 무시 확인
TC-27-20: W+C+H 합계 === 35 (분류 누락 없음)
```

---

#### TC-28: lib/intent/ 다국어 시스템 (25 TC)

```
TC-28-01: detectLanguage('검증해줘') → 'ko'
TC-28-02: detectLanguage('コード分析して') → 'ja'
TC-28-03: detectLanguage('验证一下代码') → 'zh'
TC-28-04: detectLanguage('¿Cómo puedo verificar?') → 'es'
TC-28-05: detectLanguage('Vérifier le résultat') → 'fr'
TC-28-06: detectLanguage('Können Sie das überprüfen?') → 'de'
TC-28-07: detectLanguage('Verificare il risultato') → 'it'
TC-28-08: detectLanguage('verify the code') → 'en'
TC-28-09: detectLanguage('') → 'en' (빈 문자열 기본값)
TC-28-10: detectLanguage(null) → 'en' (null 안전성)
TC-28-11: matchMultiLangPattern('검증해줘', gap-detector 트리거) → true
TC-28-12: matchMultiLangPattern('improve code', pdca-iterator 트리거) → true
TC-28-13: matchMultiLangPattern('改善して', pdca-iterator 트리거) → true (일본어)
TC-28-14: matchMultiLangPattern('改进代码', pdca-iterator 트리거) → true (중국어)
TC-28-15: matchMultiLangPattern('hello world', gap-detector 트리거) → false (매칭 없음)
TC-28-16: AGENT_TRIGGER_PATTERNS - 8개 에이전트 각각 8개 언어 키 보유 확인
TC-28-17: SKILL_TRIGGER_PATTERNS - starter/dynamic/enterprise/mobile-app 각 8개 언어
TC-28-18: findMatchingAgent('mejorar el código') → 'pdca-iterator' (스페인어)
TC-28-19: findMatchingAgent('analyser la qualité') → 'code-analyzer' (프랑스어)
TC-28-20: findMatchingAgent('Bericht erstellen') → 'report-generator' (독일어)
TC-28-21: findMatchingAgent('rapporto di completamento') → 'report-generator' (이탈리아어)
TC-28-22: findMatchingAgent('random nonsense text') → null (매칭 없음)
TC-28-23: language-patterns.js AGENT_PATTERNS 구조 검증 (8개 에이전트 × 8개 언어)
TC-28-24: language-patterns.js SKILL_PATTERNS 구조 검증 (4개 스킬 × 8개 언어)
TC-28-25: ambiguity.js detectAmbiguity() - 모호한 입력 감지 검증
```

---

#### TC-29: lib/pdca/ 모듈 (25 TC)

```
TC-29-01: loadPdcaStatus(projectDir) - .pdca-status.json 로드 성공
TC-29-02: loadPdcaStatus(projectDir) - 파일 없을 때 기본 스키마 생성
TC-29-03: savePdcaStatus(status, projectDir) - 저장 후 재로드 일치
TC-29-04: PDCA Status v2.0 스키마 - version, primaryFeature, activeFeatures, archivedFeatures, pipeline, lastChecked
TC-29-05: getPhase(feature) → 'plan'|'design'|'do'|'check'|'act'|'completed'
TC-29-06: setPhase(feature, 'design') → activeFeatures[feature].phase === 'design'
TC-29-07: setPhase 잘못된 phase → 에러 또는 무시
TC-29-08: updateMatchRate(feature, 95) → activeFeatures[feature].matchRate === 95
TC-29-09: incrementIteration(feature) → iterationCount + 1
TC-29-10: archiveFeature(feature) → activeFeatures에서 제거, archivedFeatures에 추가
TC-29-11: archiveFeature - archivedAt 타임스탬프 설정
TC-29-12: primaryFeature 설정/변경 검증
TC-29-13: 다중 feature 독립 상태 관리 (feature-A: plan, feature-B: do)
TC-29-14: phase.js getPhaseOrder() → ['plan', 'design', 'do', 'check', 'act', 'completed']
TC-29-15: phase.js getNextPhase('plan') → 'design'
TC-29-16: phase.js getNextPhase('completed') → null
TC-29-17: phase.js isValidPhase('plan') → true, isValidPhase('xyz') → false
TC-29-18: level.js detectLevel(projectDir) - kubernetes/ 존재 → 'Enterprise'
TC-29-19: level.js detectLevel(projectDir) - .mcp.json 존재 → 'Dynamic'
TC-29-20: level.js detectLevel(projectDir) - 빈 프로젝트 → 'Starter'
TC-29-21: automation.js shouldAutoTransition('do', 'src/app.js') → true
TC-29-22: automation.js shouldAutoTransition('plan', 'src/app.js') → false (plan에서는 안 됨)
TC-29-23: tier.js getTierConfig('Enterprise') → maxAgents, maxIterations 등 설정
TC-29-24: tier.js getTierConfig('Starter') → 제한된 설정
TC-29-25: status.js 레거시 경로 (docs/.pdca-status.json) 마이그레이션 검증
```

---

#### TC-30: lib/core/ 모듈 (30 TC)

```
# paths.js (10 TC)
TC-30-01: getPaths(projectDir) - pdca, bkit, gemini, docs 카테고리 존재
TC-30-02: getPaths().pdca - statusFile, planDir, designDir, analysisDir, reportDir 포함
TC-30-03: getPaths().bkit - stateDir, runtimeDir, snapshotsDir, memoryFile 포함
TC-30-04: ensureDirectories(projectDir) - 모든 필수 디렉토리 생성됨
TC-30-05: getPaths() - 모든 경로가 path.isAbsolute() === true
TC-30-06: getPaths().pdca.statusFile 끝이 '.pdca-status.json'
TC-30-07: getPaths().bkit.stateDir 끝이 '.bkit/state'
TC-30-08: ensureDirectories() - 이미 존재하는 디렉토리에 에러 없음

# memory.js (7 TC)
TC-30-09: getMemory(projectDir) → MemoryManager 인스턴스
TC-30-10: MemoryManager.startSession() → sessionCount 증가
TC-30-11: MemoryManager.get('key') / set('key', 'value') 동작
TC-30-12: MemoryManager.get('nonexistent') → 기본값 반환
TC-30-13: MemoryManager 파일 영속성 (set → 재로드 → get)
TC-30-14: memory.json 레거시 경로 마이그레이션

# config.js (5 TC)
TC-30-15: loadConfig() → bkit.config.json 내용 로드
TC-30-16: loadConfig() - version === '1.5.8'
TC-30-17: loadConfig() - pdca.matchRateThreshold === 90
TC-30-18: loadConfig() - pdca.maxIterations === 5
TC-30-19: loadConfig() - team.enabled === true

# cache.js (3 TC)
TC-30-20: CacheManager.get/set 동작
TC-30-21: CacheManager TTL 만료 검증
TC-30-22: CacheManager.clear() 전체 초기화

# agent-memory.js (3 TC)
TC-30-23: AgentMemory scope='project' 저장/조회
TC-30-24: AgentMemory scope='user' 저장/조회
TC-30-25: AgentMemory 에이전트별 격리 확인

# permission.js (3 TC)
TC-30-26: checkPermission('run_shell_command', 'rm -rf *') → 'deny'
TC-30-27: checkPermission('run_shell_command', 'git status') → 'allow'
TC-30-28: checkPermission('run_shell_command', 'rm -r folder') → 'ask'

# debug.js, file.js, io.js, platform.js (2 TC)
TC-30-29: debug.js isDebugEnabled() - BKIT_DEBUG=true → true
TC-30-30: platform.js getPlatform() → 'darwin'|'linux'|'win32'
```

---

#### TC-31: lib/team/ 9개 모듈 (40 TC)

```
# index.js (3 TC)
TC-31-01: require('lib/team') 모든 export 접근 가능
TC-31-02: Coordinator, Strategy, CTOLogic, Communication, TaskQueue, StateRecorder, PatternSelector, Memory 8개 클래스 export
TC-31-03: 각 클래스 instanceof 검증

# coordinator.js (7 TC)
TC-31-04: new TeamCoordinator(config) 생성
TC-31-05: TeamCoordinator.initialize() → status = 'initialized'
TC-31-06: TeamCoordinator.getStatus() → { status, agents, pattern }
TC-31-07: TeamCoordinator.dissolve() → status = 'dissolved'
TC-31-08: dissolve 후 getStatus() → 초기화된 상태
TC-31-09: TeamCoordinator 중복 initialize → 에러 또는 무시
TC-31-10: TeamCoordinator config 유효성 검증

# task-queue.js (7 TC)
TC-31-11: TaskQueue.enqueue(task) → 대기열 추가
TC-31-12: TaskQueue.dequeue() → 우선순위 최고 태스크 반환
TC-31-13: enqueue(normal) → enqueue(critical) → dequeue() → critical 반환
TC-31-14: enqueue(normal,'A') → enqueue(normal,'B') → dequeue() → 'A' (FIFO)
TC-31-15: dequeue() 빈 큐 → null
TC-31-16: TaskQueue.size() → 현재 대기열 크기
TC-31-17: TaskQueue 우선순위 순서: critical > high > normal > low

# pattern-selector.js (5 TC)
TC-31-18: selectPattern('plan') → 'leader'
TC-31-19: selectPattern('do') → 'swarm'
TC-31-20: selectPattern('check') → 'council'
TC-31-21: selectPattern('unknown') → 기본 패턴
TC-31-22: 5가지 패턴: leader, council, swarm, pipeline, watchdog

# communication.js (6 TC)
TC-31-23: sendTask('gap-detector', task) v0.33.0 → method='native'
TC-31-24: sendTask('gap-detector', task) v0.32.0 → method='mcp'
TC-31-25: collectResult(taskId) → 결과 반환 후 삭제
TC-31-26: collectResult('nonexistent') → null
TC-31-27: broadcast(message) → delivered 카운트
TC-31-28: _supportsNativeDelegate() v0.33.0 → true, v0.32.0 → false

# cto-logic.js (4 TC)
TC-31-29: reviewPlan(planDoc) → 0~100 점수
TC-31-30: reviewDesign(designDoc) → 0~100 점수
TC-31-31: decidePattern(phase, level) → 적절한 패턴
TC-31-32: CTOLogic null 입력 → graceful 처리

# state-recorder.js (4 TC)
TC-31-33: record(state) → 상태 기록
TC-31-34: getHistory() → 기록된 상태 배열
TC-31-35: getLatest() → 최신 상태
TC-31-36: getHistory() 빈 기록 → []

# strategy.js (3 TC)
TC-31-37: selectStrategy('Dynamic') → { maxAgents: 3 }
TC-31-38: selectStrategy('Enterprise') → { maxAgents: 10 }
TC-31-39: selectStrategy('Starter') → { maxAgents: 1 }

# memory.js (2 TC)
TC-31-40: TeamMemory.set('key', 'value') → get('key') === 'value'
TC-31-41: TeamMemory.clear() → 모든 키 제거
```

---

#### TC-32: lib/core/paths.js + 파일 유틸리티 심화 (15 TC)

```
TC-32-01: getPaths() 반환 구조에 docs.planDir, docs.designDir 포함
TC-32-02: getPaths().gemini - extensionJson, geminiMd 경로 포함
TC-32-03: ensureDirectories() 후 .bkit/state/ 디렉토리 존재
TC-32-04: ensureDirectories() 후 .bkit/runtime/ 디렉토리 존재
TC-32-05: ensureDirectories() 후 .bkit/snapshots/ 디렉토리 존재
TC-32-06: ensureDirectories() 후 docs/01-plan/features/ 디렉토리 존재
TC-32-07: ensureDirectories() 후 docs/02-design/features/ 디렉토리 존재
TC-32-08: ensureDirectories() 후 docs/03-analysis/ 디렉토리 존재
TC-32-09: ensureDirectories() 후 docs/04-report/features/ 디렉토리 존재
TC-32-10: ensureDirectories() 이미 존재하는 구조에서 에러 없이 idempotent
TC-32-11: getPaths() Windows 경로 구분자 호환성 (path.sep)
TC-32-12: getPaths() 상대경로 입력 → 절대경로 변환
TC-32-13: file.js readFileIfExists() - 존재하는 파일 → 내용 반환
TC-32-14: file.js readFileIfExists() - 존재하지 않는 파일 → null
TC-32-15: file.js writeFileSafe() - 중간 디렉토리 자동 생성
```

---

#### TC-33: lib/task/ 모듈 (20 TC)

```
# index.js (2 TC)
TC-33-01: require('lib/task') 모든 export 접근 가능
TC-33-02: classification, context, creator, dependency, tracker export 확인

# classification.js (5 TC)
TC-33-03: classifyTask('Implement login feature') → 적절한 분류
TC-33-04: classifyTask('Fix bug in auth') → 'bug-fix' 분류
TC-33-05: classifyTask('Refactor database module') → 'refactoring' 분류
TC-33-06: classifyTask('') → 기본 분류
TC-33-07: classifyTask(null) → 기본 분류 (null 안전성)

# context.js (3 TC)
TC-33-08: getTaskContext(feature, phase) → PDCA 상태 포함 컨텍스트
TC-33-09: getTaskContext - plan phase → Plan 문서 경로 포함
TC-33-10: getTaskContext - check phase → 분석 문서 경로 포함

# creator.js (4 TC)
TC-33-11: createPdcaTask(feature, 'plan') → Plan 태스크 생성
TC-33-12: createPdcaTask(feature, 'design') → Design 태스크 (blockedBy: plan)
TC-33-13: createPdcaTask(feature, 'do') → Do 태스크 (blockedBy: design)
TC-33-14: createPdcaTask(feature, 'check') → Check 태스크 (blockedBy: do)

# dependency.js (3 TC)
TC-33-15: addDependency(taskA, taskB) → B는 A 완료 후 시작
TC-33-16: getDependencies(task) → 의존 태스크 목록
TC-33-17: hasCyclicDependency() → 순환 참조 감지

# tracker.js (3 TC)
TC-33-18: TrackerBridge 인스턴스 생성
TC-33-19: getTrackerContextInjection(feature, phase) → 컨텍스트 문자열
TC-33-20: getTrackerContextInjection() 빈 feature → 빈 문자열
```

---

#### TC-34: lib/adapters/gemini/ 모듈 (25 TC)

```
# import-resolver.js (5 TC)
TC-34-01: resolveImports(geminiMd) → @import 지시자 해석
TC-34-02: resolveImports - 7개 context 파일 내용 병합
TC-34-03: resolveImports - 존재하지 않는 @import → 경고/무시
TC-34-04: resolveImports - 순환 @import → 무한루프 방지
TC-34-05: resolveImports - @import 경로 상대/절대 모두 지원

# policy-migrator.js (6 TC)
TC-34-06: generatePolicyFile(projectDir, pluginRoot) → TOML 파일 생성
TC-34-07: generatePolicyFile - TOML 내용에 [permission] 섹션 포함
TC-34-08: generateLevelPolicy('Enterprise', projectDir) → Enterprise 전용 정책
TC-34-09: generateLevelPolicy('Starter', projectDir) → Starter 전용 정책
TC-34-10: generateExtensionPolicy(pluginRoot) → 확장 정책 파일
TC-34-11: escapeTomlString() 특수문자 이스케이프 검증

# hook-adapter.js (5 TC)
TC-34-12: createHookHandler() → handler 함수 반환
TC-34-13: hook-adapter v0.31.0+ SDK 모드 지원 확인
TC-34-14: hook-adapter 레거시 stdin 모드 폴백 확인
TC-34-15: hook handler JSON 출력 형식 검증
TC-34-16: hook handler 에러 시 graceful degradation

# tracker-bridge.js (4 TC)
TC-34-17: getTrackerContextInjection(feature, 'plan') → Plan 관련 컨텍스트
TC-34-18: getTrackerContextInjection(feature, 'check') → Check 관련 컨텍스트
TC-34-19: getTrackerContextInjection(null, null) → 빈 문자열
TC-34-20: tracker-bridge instruction-based 접근 방식 확인

# context-fork.js (3 TC)
TC-34-21: createContextFork() → 분기 컨텍스트 생성
TC-34-22: context-fork Skills 2.0 context:fork 지원
TC-34-23: context-fork 격리된 컨텍스트 확인

# index.js (2 TC)
TC-34-24: require('lib/adapters/gemini') → 모든 export 접근 가능
TC-34-25: adapter.getProjectDir(), adapter.getPluginRoot() 동작
```

---

#### TC-35: lib/adapters/ + common.js (10 TC)

```
TC-35-01: require('lib/adapters') → getAdapter() 함수 export
TC-35-02: getAdapter() → gemini adapter 반환
TC-35-03: platform-interface.js 인터페이스 메서드 목록 확인
TC-35-04: adapter.getProjectDir() → 유효한 디렉토리 경로
TC-35-05: adapter.getPluginRoot() → 플러그인 루트 경로
TC-35-06: common.js export 확인
TC-35-07: common.js 공통 유틸리티 함수 동작
TC-35-08: adapter 없는 환경 → 기본 adapter 폴백
TC-35-09: context-hierarchy.js ContextHierarchy 클래스 export
TC-35-10: ContextHierarchy plugin→user→project→session 우선순위 검증
```

---

#### TC-36: config/extension 파일 검증 (15 TC)

```
TC-36-01: bkit.config.json version === '1.5.8'
TC-36-02: bkit.config.json testedVersions에 '0.33.0' 포함
TC-36-03: bkit.config.json team.enabled === true
TC-36-04: bkit.config.json team.orchestrationPatterns에 5개 패턴
TC-36-05: bkit.config.json team.communication.protocol === 'task-tracker'
TC-36-06: bkit.config.json pdca.matchRateThreshold === 90
TC-36-07: bkit.config.json pdca.maxIterations === 5
TC-36-08: gemini-extension.json version === '1.5.8'
TC-36-09: gemini-extension.json plan.directory === 'docs/01-plan'
TC-36-10: GEMINI.md 버전 '1.5.8' 포함
TC-36-11: GEMINI.md @import 7개 이상 존재
TC-36-12: tool-reference.md v0.33.0 Breaking Changes 섹션 존재
TC-36-13: bkit.config.json permissions deny 규칙 존재
TC-36-14: bkit.config.json permissions ask 규칙 존재
TC-36-15: gemini-extension.json agents 디렉토리 참조 확인
```

---

#### TC-37: lib/context-hierarchy.js + lib/common.js (10 TC)

```
TC-37-01: ContextHierarchy 4-Level: plugin, user, project, session
TC-37-02: ContextHierarchy session 값이 project 값 오버라이드
TC-37-03: ContextHierarchy project 값이 user 값 오버라이드
TC-37-04: ContextHierarchy user 값이 plugin 값 오버라이드
TC-37-05: ContextHierarchy 하위 레벨 없으면 상위 폴백
TC-37-06: ContextHierarchy 빈 세션 → project 값 사용
TC-37-07: ContextHierarchy 모든 레벨 빈 값 → null/undefined
TC-37-08: common.js 버전 상수 확인
TC-37-09: common.js 유틸리티 함수 null 안전성
TC-37-10: common.js 경로 해석 유틸리티 검증
```

---

#### TC-38: version-detector 버전별 기능 플래그 매트릭스 (15 TC)

```
TC-38-01: v0.29.0 → hasPlanMode=true, 나머지 false
TC-38-02: v0.30.0 → hasPolicyEngine=true, hasRuntimeHookFunctions=false
TC-38-03: v0.30.1 → hasPolicyEngine=true (패치 무관)
TC-38-04: v0.31.0 → hasRuntimeHookFunctions=true, hasToolAnnotations=true, hasProjectLevelPolicy=true
TC-38-05: v0.31.0 → hasProjectLevelPolicy=true
TC-38-06: v0.32.0 → hasTaskTracker=true, hasGrepIncludePatternRename=true
TC-38-07: v0.32.0 → hasExtensionPolicies=true
TC-38-08: v0.33.0 → hasNativeSubagents=true, hasReplaceAllowMultipleRequired=true
TC-38-09: v0.33.0 → hasMcpV2Prep=true, hasPlanDirectory=true
TC-38-10: v0.33.0 → hasThemeSupport=true, hasExcludeToolsConfig=true, hasAgentsDirectory=true
TC-38-11: v0.35.0 (미래) → 에러 없이 동작, 모든 현재 플래그 true
TC-38-12: resetCache() 후 환경변수 변경 → 새 버전으로 재감지
TC-38-13: detectVersion() 캐싱 - 두 번 호출 시 동일 결과
TC-38-14: detectVersion() GEMINI_CLI_VERSION 환경변수 없음 → 기본값
TC-38-15: detectVersion() raw 속성 문자열 원본 유지
```

---

### 4.2 관점 2: E2E Test (TC-39~TC-43, ~60 TC)

---

#### TC-39: PDCA 전체 사이클 E2E (18 TC)

```
TC-39-01: Plan → Design → Do → Check(100%) → Report 성공 경로 전체 사이클
TC-39-02: .pdca-status.json 생성 → primaryFeature 설정 확인
TC-39-03: Plan 문서 생성 후 phase='plan' 확인
TC-39-04: Design 문서 생성 후 phase='design' 확인
TC-39-05: src/ 파일 변경 후 phase='do' 자동 전환
TC-39-06: Gap 분석 matchRate=100 → phase='check' → completed
TC-39-07: Report 생성 → .pdca-status.json completedAt 타임스탬프
TC-39-08: Check < 90% → Iterate → Re-check 반복 경로
TC-39-09: matchRate 70 → iterate → matchRate 95 → report (개선 시나리오)
TC-39-10: maxIterations=5 도달 시 강제 종료
TC-39-11: 다중 Feature 동시 관리 (A:plan, B:do, C:completed)
TC-39-12: primaryFeature 전환 시 각 feature 상태 독립
TC-39-13: Archive 동작 - completed → archived 이동
TC-39-14: archived feature는 activeFeatures에서 제거
TC-39-15: Plan 문서 경로 docs/01-plan/features/{feature}.plan.md 준수
TC-39-16: Design 문서 경로 docs/02-design/features/{feature}.design.md 준수
TC-39-17: Report 문서 경로 docs/04-report/features/{feature}.report.md 준수
TC-39-18: PDCA 사이클 중 .pdca-status.json lastChecked 업데이트
```

---

#### TC-40: Hook System E2E (15 TC)

```
TC-40-01: session-start.js 실행 → JSON 출력 status='allow'
TC-40-02: session-start.js context에 'PDCA Core Rules' 포함
TC-40-03: session-start.js context에 'Agent Auto-Triggers' 포함
TC-40-04: session-start.js context에 'Feature Usage Report' 포함
TC-40-05: session-start.js context에 'pm-lead', 'bkend-expert' 트리거 포함
TC-40-06: session-start.js metadata.version === '1.5.8'
TC-40-07: session-start.js metadata.level 감지 정확성
TC-40-08: session-start.js 반환 사용자(sessionCount>1) 감지
TC-40-09: session-start.js 첫 방문(sessionCount=1) 감지
TC-40-10: after-tool.js write_file 이벤트 → PDCA phase 전환 시도
TC-40-11: after-tool.js validatePdcaDocument() plan 문서 필수 섹션 검증
TC-40-12: after-tool.js validatePdcaDocument() 섹션 누락 시 경고 반환
TC-40-13: before-tool.js run_shell_command(rm -rf *) → deny
TC-40-14: session-start.js 에러 발생 시 graceful degradation (기본 context 반환)
TC-40-15: session-start.js 출력 style 로딩 - bkit-learning/bkit-pdca-guide/bkit-enterprise
```

---

#### TC-41: Team Orchestration E2E (12 TC)

```
TC-41-01: TeamCoordinator 생성 → initialize → assignAgents → execute → dissolve
TC-41-02: 5가지 오케스트레이션 패턴 전환: plan→leader, do→swarm, check→council
TC-41-03: Agent Communication v0.33.0 native delegation
TC-41-04: Agent Communication v0.32.0 MCP fallback
TC-41-05: TaskQueue에 태스크 추가 → 우선순위별 처리
TC-41-06: StateRecorder 상태 기록 → 이력 조회
TC-41-07: TeamStrategy 레벨별 전략 선택
TC-41-08: CTOLogic Plan 리뷰 → 점수 반환
TC-41-09: TeamMemory 세션 간 데이터 유지
TC-41-10: Team 해산 후 리소스 정리 확인
TC-41-11: broadcast() 메시지 전달 확인
TC-41-12: 복수 팀 동시 운영 격리 확인
```

---

#### TC-42: Skill 활성화 E2E (10 TC)

```
TC-42-01: /pdca plan feature → Plan 문서 생성 워크플로우
TC-42-02: /pdca design feature → Design 문서 생성 워크플로우
TC-42-03: /pdca analyze feature → Gap 분석 워크플로우
TC-42-04: /pdca report feature → 완료 보고서 생성 워크플로우
TC-42-05: /pdca status → 현재 상태 조회
TC-42-06: /development-pipeline → 9단계 파이프라인 가이드
TC-42-07: /plan-plus feature → 브레인스토밍 기반 계획
TC-42-08: /simplify → 코드 복잡도 감소 분석
TC-42-09: /output-style-setup → 출력 스타일 설정
TC-42-10: /batch feature-A feature-B → 다중 feature 처리
```

---

#### TC-43: MCP Server + Command E2E (8 TC)

```
TC-43-01: MCP server 시작 → JSON-RPC 응답
TC-43-02: MCP tools/list → spawn-agent 도구 포함
TC-43-03: MCP spawn-agent → 에이전트 이름 해석
TC-43-04: 24개 commands/*.toml 파싱 성공 (TOML 문법 오류 없음)
TC-43-05: command prompt에 @{extensionPath} 치환 확인
TC-43-06: pdca.toml → skills/pdca/SKILL.md 매핑
TC-43-07: plan-plus.toml → skills/plan-plus/SKILL.md 매핑
TC-43-08: 커맨드-스킬 1:1 대응 검증 (24개 전수)
```

---

### 4.3 관점 3: 통합 테스트 (TC-44~TC-49, ~80 TC)

---

#### TC-44: Agent 시스템 통합 (18 TC)

```
TC-44-01: 21개 에이전트 파일 존재 확인 (agents/*.md)
TC-44-02: 16개 기존 에이전트 'Tool Usage Notes (v0.33.x)' 섹션 포함
TC-44-03: 5개 PM 에이전트 frontmatter: name, description, model, tools
TC-44-04: pm-lead.md tools에 tracker_* 도구 포함
TC-44-05: pm-discovery.md tools에 google_web_search 포함
TC-44-06: pm-strategy.md tools에 web_fetch 포함
TC-44-07: pm-research.md tools에 google_web_search, web_fetch 포함
TC-44-08: pm-prd.md tools에 write_file 포함
TC-44-09: 21개 에이전트 model 필드 값 유효성 (gemini-2.5-pro 등)
TC-44-10: 에이전트 tools 항목이 ALL_BUILTIN_TOOL_NAMES에 모두 존재
TC-44-11: cto-lead.md description에 'orchestrate' 키워드 포함
TC-44-12: gap-detector.md description에 'gap' 키워드 포함
TC-44-13: pdca-iterator.md description에 'iterate' 키워드 포함
TC-44-14: report-generator.md description에 'report' 키워드 포함
TC-44-15: code-analyzer.md description에 'analyze' 키워드 포함
TC-44-16: starter-guide.md description에 'beginner' 또는 'starter' 키워드 포함
TC-44-17: 에이전트 파일명과 frontmatter name 일치 검증
TC-44-18: 에이전트 temperature 값 0~2 범위 내 검증
```

---

#### TC-45: Skill 시스템 통합 (18 TC)

```
TC-45-01: 35개 스킬 SKILL.md 존재 확인
TC-45-02: 35개 스킬 classification 필드 전수 확인 (W|C|H)
TC-45-03: classification 분포: W=10, C=24, H=1
TC-45-04: 커맨드-스킬 매핑 검증 (commands/*.toml ↔ skills/*/SKILL.md)
TC-45-05: 신규 5개 스킬 frontmatter: plan-plus, simplify, loop, batch, output-style-setup
TC-45-06: pm-discovery 스킬 classification='H'
TC-45-07: 모든 스킬 user-invocable 필드 존재 확인
TC-45-08: 모든 스킬 allowed-tools 필드 존재 확인
TC-45-09: pdca 스킬 allowed-tools에 tracker_* 포함
TC-45-10: phase-1~phase-9 스킬 순서 검증
TC-45-11: bkend-* 스킬 8개 존재 확인
TC-45-12: 모든 스킬 description 비어있지 않음
TC-45-13: 모든 스킬 pdca-phase 필드 보유 ('all'|'plan'|'design'|'do'|'check'|'act')
TC-45-14: W 스킬 pdca-phase='all' 인 스킬 확인
TC-45-15: C 스킬 specific phase 매핑 확인
TC-45-16: 스킬 디렉토리명과 SKILL.md name 필드 일치 검증
TC-45-17: 스킬 SKILL.md YAML frontmatter 문법 유효성 (35개 전수)
TC-45-18: skills/ 디렉토리 내 SKILL.md 없는 하위 디렉토리 없음 확인
```

---

#### TC-46: Context Engineering 통합 (15 TC)

```
TC-46-01: GEMINI.md @import 7개+ context 파일 참조
TC-46-02: context/commands.md 존재 및 내용 유효
TC-46-03: context/pdca-rules.md 존재 및 PDCA 규칙 포함
TC-46-04: context/agent-triggers.md 8개국어 트리거 테이블
TC-46-05: context/skill-triggers.md 4개 레벨 트리거
TC-46-06: context/tool-reference.md v0.33.0 Breaking Changes
TC-46-07: context/feature-report.md PM 에이전트 + 신규 스킬 목록
TC-46-08: context/executive-summary-rules.md When/What/Position 규칙
TC-46-09: import-resolver.js로 GEMINI.md 처리 → 전체 내용 병합
TC-46-10: @import 대상 파일이 모두 실제 존재
TC-46-11: tool-reference.md BC-4, BC-5, BC-6 항목 + Tool Usage Guide
TC-46-12: pdca-rules.md Plan→Design→Do→Check→Act 전체 규칙
TC-46-13: feature-report.md plan-plus, simplify, loop, batch, output-style-setup 포함
TC-46-14: agent-triggers.md pm-lead, bkend-expert 트리거 포함
TC-46-15: GEMINI.md 토큰 크기 합리적 범위 (< 5000 토큰 추정)
```

---

#### TC-47: Config/Extension 상호 연동 (12 TC)

```
TC-47-01: bkit.config.json → gemini-extension.json version 일치 (1.5.8)
TC-47-02: bkit.config.json testedVersions ↔ version-detector 지원 범위 일치
TC-47-03: bkit.config.json team.orchestrationPatterns ↔ pattern-selector.js 패턴 일치
TC-47-04: bkit.config.json permissions ↔ permission.js 규칙 일치
TC-47-05: gemini-extension.json plan.directory ↔ getPaths().docs.planDir 일치
TC-47-06: gemini-extension.json agents 디렉토리 ↔ agents/*.md 실제 파일 일치
TC-47-07: bkit.config.json pdca 설정 ↔ pdca/status.js 기본값 일치
TC-47-08: output-styles/ 디렉토리 ↔ session-start.js 스타일 로딩 연동
TC-47-09: templates/ 디렉토리 ↔ pdca 스킬 템플릿 참조 연동
TC-47-10: bkit.config.json → policy-migrator.js TOML 생성 연동
TC-47-11: gemini-extension.json tools 섹션 ↔ tool-registry.js 도구 목록 연동
TC-47-12: bkit.config.json team.maxAgents ↔ strategy.js 제한값 연동
```

---

#### TC-48: Command 시스템 통합 (10 TC)

```
TC-48-01: 24개 commands/*.toml 전체 TOML 파싱 성공
TC-48-02: 각 TOML에 [command] 섹션 존재
TC-48-03: 각 TOML에 name 필드 존재
TC-48-04: 각 TOML에 description 필드 존재
TC-48-05: 각 TOML에 prompt 필드 존재
TC-48-06: prompt 내 @{extensionPath} 치환 경로가 실제 파일 참조
TC-48-07: pdca.toml prompt → skills/pdca/SKILL.md 경로
TC-48-08: 커맨드명 중복 없음 확인 (24개 unique)
TC-48-09: 커맨드 name과 파일명 일치 검증
TC-48-10: output-style-setup.toml 신규 커맨드 구조 검증
```

---

#### TC-49: Hook-Lib-Config 체인 통합 (10 TC)

```
TC-49-01: SessionStart hook → detectProjectLevel() → bkit.config.json level 일치
TC-49-02: SessionStart hook → loadOutputStyle() → output-styles/ 파일 로드
TC-49-03: SessionStart hook → loadPdcaStatus() → .pdca-status.json 일치
TC-49-04: SessionStart hook → getMemory() → .bkit/state/memory.json 연동
TC-49-05: SessionStart hook → getFeatureFlags() → version-detector 연동
TC-49-06: AfterTool hook → pdca/status.js phase 업데이트 → .pdca-status.json 저장
TC-49-07: AfterTool hook → validatePdcaDocument() → template 검증 연동
TC-49-08: BeforeTool hook → permission.js 퍼미션 체크 연동
TC-49-09: Hook 에러 → graceful degradation → status='allow' 반환
TC-49-10: Hook 체인 전체 흐름: SessionStart → BeforeTool → AfterTool 순서
```

---

### 4.4 관점 4: 시나리오 테스트 (TC-50~TC-54, ~50 TC)

---

#### TC-50: 초보자(Starter) 시나리오 (10 TC)

```
TC-50-01: 첫 방문 → 'Welcome to bkit' 메시지 → AskUserQuestion 호출
TC-50-02: 레벨 감지 → 'Starter' → bkit-learning 출력 스타일 적용
TC-50-03: '포트폴리오 만들어줘' → starter 스킬 트리거 감지
TC-50-04: /pdca plan portfolio → Plan 문서 생성 (Starter 적합 구조)
TC-50-05: /pdca design portfolio → Design 문서 생성
TC-50-06: 한국어 '웹사이트 만들고 싶어요' → detectLanguage 'ko' + starter 트리거
TC-50-07: /development-pipeline → 9단계 가이드 시작
TC-50-08: Starter 레벨 → maxAgents=1 제한 확인
TC-50-09: /starter → 정적 웹사이트 개발 가이드 활성화
TC-50-10: SessionStart 첫 방문 → 4가지 선택지 제시 (Learn bkit, Learn Gemini CLI, Start new, Start freely)
```

---

#### TC-51: 중급자(Dynamic) 시나리오 (10 TC)

```
TC-51-01: .mcp.json 존재 → 'Dynamic' 레벨 감지
TC-51-02: 'login and signup' 입력 → dynamic 스킬 + bkend-expert 에이전트 트리거
TC-51-03: /dynamic → 풀스택 개발 가이드 활성화
TC-51-04: /pdca plan user-auth → Plan 문서 (인증 관련 구조)
TC-51-05: Dynamic 레벨 → maxAgents=3 확인
TC-51-06: Dynamic 레벨 → bkit-pdca-guide 출력 스타일
TC-51-07: bkend-* 스킬 8개 활성화 가능 확인
TC-51-08: /phase-4-api → API 설계 가이드 활성화
TC-51-09: /zero-script-qa → Docker 로그 기반 테스트 가이드
TC-51-10: PM 워크플로우: /pdca pm feature → 5개 PM 에이전트 순차 실행
```

---

#### TC-52: 전문가(Enterprise) 시나리오 (10 TC)

```
TC-52-01: kubernetes/ 디렉토리 존재 → 'Enterprise' 레벨 감지
TC-52-02: /enterprise → 마이크로서비스 개발 가이드
TC-52-03: Enterprise 레벨 → maxAgents=10, CTO Team 활성화
TC-52-04: Enterprise 레벨 → bkit-enterprise 출력 스타일
TC-52-05: /pdca team microservice → CTO Team 10 에이전트 오케스트레이션
TC-52-06: Leader → Swarm → Council 패턴 전환 시나리오
TC-52-07: /simplify → Check ≥ 90% 후 코드 정리 → Report 생성
TC-52-08: /loop 10m /pdca analyze → 반복 Gap 분석
TC-52-09: /batch feature-A feature-B → 다중 feature 병렬 처리
TC-52-10: /plan-plus feature → 브레인스토밍 기반 강화 계획
```

---

#### TC-53: PM 워크플로우 시나리오 (10 TC)

```
TC-53-01: /pdca pm new-feature → PM Agent Team 활성화 확인
TC-53-02: pm-lead → pm-discovery 위임 → Opportunity Solution Tree
TC-53-03: pm-lead → pm-strategy 위임 → JTBD + Lean Canvas
TC-53-04: pm-lead → pm-research 위임 → Persona + Competitor Analysis
TC-53-05: pm-lead → pm-prd 위임 → 최종 PRD 산출
TC-53-06: PM 에이전트 순서: discovery → strategy → research → prd
TC-53-07: PM PRD 산출물 → PDCA Plan 문서 입력으로 활용
TC-53-08: PM 에이전트 간 데이터 전달 (context 공유)
TC-53-09: PM 팀 canUsePmTeam 게이트 v0.32.0+ 활성 확인
TC-53-10: PM 팀 canUsePmTeam 게이트 v0.31.0 비활성 확인
```

---

#### TC-54: 다국어 시나리오 (10 TC)

```
TC-54-01: 한국어 '검증해줘' → gap-detector 에이전트 트리거
TC-54-02: 일본어 '改善して' → pdca-iterator 에이전트 트리거
TC-54-03: 중국어 '分析代码' → code-analyzer 에이전트 트리거
TC-54-04: 스페인어 'verificar el código' → gap-detector 트리거
TC-54-05: 프랑스어 'améliorer le code' → pdca-iterator 트리거
TC-54-06: 독일어 'Bericht erstellen' → report-generator 트리거
TC-54-07: 이탈리아어 'analizzare il codice' → code-analyzer 트리거
TC-54-08: 영어 'help me get started' → starter-guide 에이전트 트리거
TC-54-09: 혼합 언어 '코드 verify 해줘' → 매칭 동작 확인
TC-54-10: 지원하지 않는 언어 (아랍어 등) → 영어 폴백
```

---

### 4.5 관점 5: bkit 철학 검증 (TC-55~TC-59, ~50 TC)

---

#### TC-55: Context Engineering 원칙 (12 TC)

```
TC-55-01: 3-Layer Architecture - Layer 1 (GEMINI.md + @imports) = 핵심 규칙
TC-55-02: 3-Layer Architecture - Layer 2 (skills/*/SKILL.md) = 필요 시 로드
TC-55-03: 3-Layer Architecture - Layer 3 (hooks dynamic context) = 세션별 동적
TC-55-04: Progressive Disclosure - GEMINI.md 핵심만 (~60줄 이내)
TC-55-05: Progressive Disclosure - @import 7개 파일로 세부 분리
TC-55-06: Progressive Disclosure - 35개 스킬 별도 디렉토리 분리
TC-55-07: Progressive Disclosure - 21개 에이전트 독립 파일
TC-55-08: @import 모듈화 - 각 context 파일이 단일 책임
TC-55-09: @import 모듈화 - 중복 내용 없음 검증
TC-55-10: 4-Level Context Hierarchy - session > project > user > plugin
TC-55-11: Token 효율성 - Layer 1 총 크기 합리적 범위
TC-55-12: context/ 파일 각각 명확한 주제 구분
```

---

#### TC-56: PDCA 방법론 원칙 (15 TC)

```
TC-56-01: 35개 스킬 전체 pdca-phase 필드 보유 확인
TC-56-02: pdca-phase 값 유효성: 'all'|'plan'|'design'|'do'|'check'|'act'
TC-56-03: PDCA 문서 경로 규칙: docs/01-plan/features/{feature}.plan.md
TC-56-04: PDCA 문서 경로 규칙: docs/02-design/features/{feature}.design.md
TC-56-05: PDCA 문서 경로 규칙: docs/03-analysis/features/{feature}.analysis.md
TC-56-06: PDCA 문서 경로 규칙: docs/04-report/features/{feature}.report.md
TC-56-07: 자동 전환 규칙 - src/ 변경 → design→do 전환
TC-56-08: matchRateThreshold === 90 (설계 의도)
TC-56-09: maxIterations === 5 (설계 의도)
TC-56-10: PDCA Status v2.0 스키마 완전성
TC-56-11: Feature Report 필수 출력 규칙: Used/Not Used/Recommended
TC-56-12: Executive Summary 출력 규칙: When/What/Position
TC-56-13: PDCA 단계 건너뛰기 방지 (plan 없이 design 불가)
TC-56-14: PDCA 완료 후 archive 가능
TC-56-15: PDCA 사이클 재시작 가능 (동일 feature)
```

---

#### TC-57: "No Guessing" + Gemini Native 원칙 (10 TC)

```
TC-57-01: 23개 빌트인 도구명 정확성 전수 검증
TC-57-02: 레거시 별칭 resolveToolName() 올바른 해석
TC-57-03: CC 패턴 단순 복사 방지 - communication.js native delegation 우선
TC-57-04: CC 패턴 단순 복사 방지 - tracker-bridge.js instruction-based 접근
TC-57-05: TOML 정책 시스템 (Gemini 고유) - policy-migrator.js
TC-57-06: RuntimeHook SDK (Gemini 고유) - hook-adapter.js
TC-57-07: Plan Mode 연동 (Gemini 고유) - gemini-extension.json plan.directory
TC-57-08: Task Tracker 네이티브 연동 (Gemini 고유) - tracker_* 도구
TC-57-09: Skills 2.0 classification (Gemini 고유) - activate_skill 기반
TC-57-10: 에이전트 도구명이 Gemini CLI 도구명 사용 (CC 도구명 아님)
```

---

#### TC-58: Progressive Disclosure 심화 (8 TC)

```
TC-58-01: 초보자 레벨 → 노출 기능 수 제한 확인
TC-58-02: 중급자 레벨 → 추가 기능 노출 확인
TC-58-03: 전문가 레벨 → 전체 기능 노출 확인
TC-58-04: SessionStart context → 레벨별 차등 정보량
TC-58-05: 스킬 트리거 → 레벨 일치 시만 활성화
TC-58-06: 에이전트 추천 → 레벨 적합성 기반
TC-58-07: 출력 스타일 → 레벨별 기본값 차등
TC-58-08: Feature Report → 레벨에 맞는 추천 제공
```

---

#### TC-59: AI-Native 개발 원칙 (5 TC)

```
TC-59-01: "AI는 완벽하지 않다" 원칙 - SessionStart context에 검증 안내 포함
TC-59-02: 자동 트리거 → 사용자 확인 단계 존재 (AskUserQuestion)
TC-59-03: PDCA 사이클 → 반복적 품질 개선 (iterate 패턴)
TC-59-04: 8개국어 지원 → 글로벌 접근성
TC-59-05: 테스트 자동화 → 객관적 품질 검증 (test-utils.js)
```

---

### 4.6 관점 6: 보안/호환성 (TC-60~TC-63, ~45 TC)

---

#### TC-60: 입력 새니타이제이션 (12 TC)

```
TC-60-01: SemVer 인젝션 방지 - '0.33.0;rm -rf /' → isValidSemVer false
TC-60-02: SemVer 인젝션 방지 - '0.33.0 && echo hacked' → false
TC-60-03: SemVer 인젝션 방지 - '$(whoami)' → false
TC-60-04: TOML 인젝션 방지 - escapeTomlString('test"\\nmalicious') → 이스케이프
TC-60-05: TOML 인젝션 방지 - escapeTomlString('key = "value"\n[attack]') → 이스케이프
TC-60-06: 팀 이름 새니타이제이션 - '<script>alert(1)</script>' → 특수문자 제거
TC-60-07: Feature 이름 새니타이제이션 - '../../../etc/passwd' → 경로 탈출 방지
TC-60-08: Feature 이름 새니타이제이션 - 'feat; rm -rf *' → 세미콜론 제거
TC-60-09: 환경변수 인젝션 방지 - GEMINI_CLI_VERSION에 셸 명령 삽입
TC-60-10: JSON 파싱 안전성 - 악의적 JSON → 파싱 에러 처리
TC-60-11: 파일 경로 검증 - 절대경로만 허용, 상대경로 '../' 거부
TC-60-12: hook stdin 입력 검증 - 비정상 JSON → 에러 처리
```

---

#### TC-61: 버전 보안 (10 TC)

```
TC-61-01: isVersionBeyondPlausible('2.0.1') → true (초과 버전 거부)
TC-61-02: isVersionBeyondPlausible('99.99.99') → true
TC-61-03: isVersionBeyondPlausible('0.33.0') → false (정상)
TC-61-04: parseVersion() 극단적 입력 → 기본값 폴백
TC-61-05: version-detector 캐시 오염 방지
TC-61-06: resetCache() 후 환경변수 조작 → 새 값 반영
TC-61-07: GEMINI_CLI_VERSION 미설정 → 기본값 0.29.0 안전 폴백
TC-61-08: version-detector 모듈 require 실패 → graceful 처리
TC-61-09: getFeatureFlags() 내부 에러 → 빈 플래그 반환
TC-61-10: getBkitFeatureFlags() 내부 에러 → 모든 게이트 false
```

---

#### TC-62: Permission 엔진 (10 TC)

```
TC-62-01: 'run_shell_command(rm -rf*)' → 'deny'
TC-62-02: 'run_shell_command(rm -r*)' → 'ask'
TC-62-03: 'run_shell_command(git reset --hard*)' → 'ask'
TC-62-04: 'run_shell_command(git status)' → 'allow'
TC-62-05: 'run_shell_command(npm install)' → 'allow'
TC-62-06: 'write_file(*)' → 'allow' (기본 허용)
TC-62-07: Permission 와일드카드 패턴 매칭 검증
TC-62-08: Permission 규칙 우선순위 (deny > ask > allow)
TC-62-09: Permission 설정 없는 도구 → 기본 'allow'
TC-62-10: Permission 설정 파일 손상 → 기본 정책 폴백
```

---

#### TC-63: 버전 호환성 매트릭스 (13 TC)

```
TC-63-01: v0.29.0 최소 버전 - hasPlanMode=true, 나머지 false
TC-63-02: v0.30.0 - hasPolicyEngine=true
TC-63-03: v0.31.0 - hasRuntimeHookFunctions=true, hasToolAnnotations=true
TC-63-04: v0.32.0 - hasTaskTracker=true, hasGrepIncludePatternRename=true
TC-63-05: v0.33.0 - hasNativeSubagents=true, hasReplaceAllowMultipleRequired=true
TC-63-06: v0.35.0 (미래) - 에러 없이 동작, 모든 플래그 true
TC-63-07: getBkitFeatureFlags v0.29.0 - 모든 게이트 false
TC-63-08: getBkitFeatureFlags v0.32.0 - canUseTeam=true, canUseNativeAgents=false
TC-63-09: getBkitFeatureFlags v0.33.0 - canUseTeam=true, canUseNativeAgents=true
TC-63-10: 버전 하위 호환성 - v0.29.0에서 모든 모듈 require 성공
TC-63-11: 버전 상위 호환성 - v0.35.0에서 모든 모듈 require 성공
TC-63-12: 버전 전환 시 캐시 초기화 검증
TC-63-13: SemVer 순서 전이성 - a<b, b<c → a<c
```

---

### 4.7 관점 7: 에지 케이스 (TC-64~TC-68, ~50 TC)

---

#### TC-64: Null/Undefined 입력 (10 TC)

```
TC-64-01: parseVersion(null) → 기본값 반환
TC-64-02: parseVersion(undefined) → 기본값 반환
TC-64-03: detectLanguage(null) → 'en' 기본값
TC-64-04: detectLanguage(undefined) → 'en' 기본값
TC-64-05: getToolParamChanges(null) → null
TC-64-06: resolveToolName(null) → null 또는 undefined
TC-64-07: loadPdcaStatus(null) → 에러 또는 기본 스키마
TC-64-08: getPaths(null) → 에러 처리
TC-64-09: getSkillsByClassification(undefined) → 전체 반환 또는 빈 배열
TC-64-10: TeamCoordinator(null) → 에러 또는 기본 설정
```

---

#### TC-65: 빈/비정상 데이터 (12 TC)

```
TC-65-01: parseVersion('') → 기본값
TC-65-02: detectLanguage('') → 'en'
TC-65-03: 빈 .pdca-status.json → 기본 스키마 생성
TC-65-04: 빈 bkit.config.json → 기본 설정 폴백
TC-65-05: 빈 SKILL.md → parseSkillFrontmatter → 빈 객체
TC-65-06: TOML 문법 오류 command → 파싱 에러 graceful 처리
TC-65-07: JSON 문법 오류 → JSON.parse 에러 처리
TC-65-08: 빈 agents/ 디렉토리 → 에이전트 0개 반환
TC-65-09: 빈 skills/ 디렉토리 → 스킬 0개 반환
TC-65-10: GEMINI.md @import 대상 파일 없음 → 경고 후 계속
TC-65-11: .pdca-status.json 잘못된 JSON → 기본 스키마로 복구
TC-65-12: memory.json 잘못된 JSON → 기본값으로 복구
```

---

#### TC-66: 특수문자/유니코드 (10 TC)

```
TC-66-01: Feature 이름에 한글 '로그인-기능' → 정상 처리
TC-66-02: Feature 이름에 이모지 '🔒auth' → 정상 처리 또는 정제
TC-66-03: Feature 이름에 공백 'user auth' → 하이픈 변환 또는 거부
TC-66-04: Feature 이름에 슬래시 'feat/auth' → 경로 안전성
TC-66-05: TOML 문자열 내 유니코드 → escapeTomlString 정상 처리
TC-66-06: 다국어 입력 CJK 문자 → detectLanguage 정상 처리
TC-66-07: 아랍어/히브리어 RTL 텍스트 → 에러 없이 처리
TC-66-08: NULL 바이트 '\0' 포함 문자열 → 안전 처리
TC-66-09: 매우 긴 문자열 (10000자) → 메모리/성능 이슈 없음
TC-66-10: 제어 문자 (\\n, \\r, \\t) 포함 → 적절한 이스케이프
```

---

#### TC-67: 동시성/경쟁 조건 (8 TC)

```
TC-67-01: 동시 savePdcaStatus() 호출 → 데이터 무결성
TC-67-02: 동시 MemoryManager.set() 호출 → 최종 값 정확성
TC-67-03: 동시 ensureDirectories() 호출 → 디렉토리 생성 에러 없음
TC-67-04: 동시 TeamCoordinator.initialize() → 중복 초기화 방지
TC-67-05: 동시 CacheManager.set() → 캐시 일관성
TC-67-06: 동시 Hook 실행 → 독립 실행 보장
TC-67-07: 동시 PDCA phase 변경 → 상태 일관성
TC-67-08: 동시 TaskQueue.enqueue/dequeue → 큐 무결성
```

---

#### TC-68: 파일 시스템 에지 케이스 (10 TC)

```
TC-68-01: 읽기 전용 디렉토리에서 ensureDirectories() → 적절한 에러
TC-68-02: 디스크 공간 부족 시 savePdcaStatus() → 에러 처리
TC-68-03: 파일 잠금(lock) 상태에서 읽기 → 재시도 또는 에러
TC-68-04: 심볼릭 링크된 .pdca-status.json → 정상 추적
TC-68-05: 매우 큰 .pdca-status.json (100+ features) → 성능
TC-68-06: 깊은 중첩 경로 (100+ depth) → 경로 길이 제한
TC-68-07: 프로젝트 디렉토리 이동 후 → 경로 재감지
TC-68-08: .bkit/ 디렉토리 수동 삭제 후 → 자동 재생성
TC-68-09: docs/ 디렉토리 없이 PDCA 시작 → 디렉토리 자동 생성
TC-68-10: 파일명에 공백/특수문자 있는 프로젝트 → 정상 동작
```

---

### 4.8 관점 8: 경계값 테스트 (TC-69~TC-71, ~35 TC)

---

#### TC-69: 버전 경계값 (12 TC)

```
TC-69-01: v0.29.0 (최소 지원) → 기본 기능만 활성
TC-69-02: v0.28.9 (미지원) → 기본값 폴백, 에러 없음
TC-69-03: v0.30.0 경계 → hasPolicyEngine 활성 시작점
TC-69-04: v0.29.9 → hasPolicyEngine 아직 false
TC-69-05: v0.31.0 경계 → hasRuntimeHookFunctions 활성 시작점
TC-69-06: v0.30.9 → hasRuntimeHookFunctions 아직 false
TC-69-07: v0.32.0 경계 → hasTaskTracker 활성 시작점
TC-69-08: v0.31.9 → hasTaskTracker 아직 false
TC-69-09: v0.33.0 경계 → hasNativeSubagents 활성 시작점
TC-69-10: v0.32.9 → hasNativeSubagents 아직 false
TC-69-11: v2.0.0 (MAX_PLAUSIBLE_VERSION 경계) → isVersionBeyondPlausible false
TC-69-12: v2.0.1 → isVersionBeyondPlausible true
```

---

#### TC-70: 설정 한계값 (12 TC)

```
TC-70-01: matchRateThreshold=0 → 항상 통과
TC-70-02: matchRateThreshold=100 → 완벽해야만 통과
TC-70-03: matchRateThreshold=90 (기본) → 경계값 89/90/91 동작
TC-70-04: maxIterations=0 → 반복 없음
TC-70-05: maxIterations=1 → 1회만 반복
TC-70-06: maxIterations=5 (기본) → 5회 후 강제 종료
TC-70-07: maxAgents=0 → 에이전트 없음 처리
TC-70-08: maxAgents=1 (Starter) → 1개 에이전트만
TC-70-09: maxAgents=3 (Dynamic) → 3개 에이전트
TC-70-10: maxAgents=10 (Enterprise) → 10개 에이전트
TC-70-11: TaskQueue 크기 0 → dequeue null
TC-70-12: TaskQueue 크기 1000 → 성능 저하 없음
```

---

#### TC-71: 데이터 크기 경계 (11 TC)

```
TC-71-01: Feature 이름 1글자 → 정상 처리
TC-71-02: Feature 이름 100글자 → 정상 처리
TC-71-03: Feature 이름 1000글자 → 잘림/거부 동작
TC-71-04: .pdca-status.json 0개 feature → 빈 상태 정상
TC-71-05: .pdca-status.json 1개 feature → 기본 동작
TC-71-06: .pdca-status.json 50개 feature → 성능 확인
TC-71-07: SKILL.md frontmatter 0개 필드 → 기본값 적용
TC-71-08: SKILL.md frontmatter 100개 필드 → 불필요 필드 무시
TC-71-09: SessionStart context 출력 크기 측정
TC-71-10: Agent Memory 1000개 항목 → 성능 확인
TC-71-11: context/ 파일 하나가 매우 큼 (100KB) → @import 처리
```

---

### 4.9 관점 9: 에러 복구 (TC-72~TC-74, ~35 TC)

---

#### TC-72: 파일 손상 복구 (12 TC)

```
TC-72-01: .pdca-status.json 손상 → 기본 스키마로 재생성
TC-72-02: .pdca-status.json 삭제 → 자동 재생성
TC-72-03: bkit.config.json 손상 → 기본 설정 폴백
TC-72-04: memory.json 손상 → 기본값으로 초기화
TC-72-05: GEMINI.md 삭제 → 에러 없이 동작 (context 축소)
TC-72-06: gemini-extension.json 삭제 → 기본 설정 폴백
TC-72-07: context/ 파일 일부 삭제 → @import 경고 후 계속
TC-72-08: agents/ 디렉토리 삭제 → 에이전트 0개, 에러 없음
TC-72-09: skills/ 디렉토리 삭제 → 스킬 0개, 에러 없음
TC-72-10: TOML 커맨드 파일 손상 → 해당 커맨드만 무시
TC-72-11: output-styles/ 디렉토리 삭제 → 기본 스타일 폴백
TC-72-12: templates/ 디렉토리 삭제 → 템플릿 없이 동작
```

---

#### TC-73: 모듈 누락 복구 (12 TC)

```
TC-73-01: lib/team/ 모듈 누락 → team 기능 비활성, 다른 기능 정상
TC-73-02: lib/intent/ 모듈 누락 → 다국어 비활성, 영어 폴백
TC-73-03: lib/pdca/ 모듈 누락 → PDCA 기능 비활성
TC-73-04: lib/task/ 모듈 누락 → 태스크 기능 비활성
TC-73-05: version-detector 모듈 누락 → 기본 버전 폴백
TC-73-06: tool-registry 모듈 누락 → 도구 매핑 비활성
TC-73-07: policy-migrator 모듈 누락 → 정책 생성 스킵
TC-73-08: hook-adapter 모듈 누락 → 레거시 모드 폴백
TC-73-09: skill-orchestrator 모듈 누락 → 스킬 분류 비활성
TC-73-10: SessionStart hook 에러 → graceful degradation 확인
TC-73-11: AfterTool hook 에러 → status='allow' 폴백
TC-73-12: BeforeTool hook 에러 → status='allow' 폴백 (안전 방향)
```

---

#### TC-74: 캐시/상태 복구 (11 TC)

```
TC-74-01: version-detector 캐시 무효화 → resetCache() 후 정상 재감지
TC-74-02: CacheManager TTL 만료 → 자동 재로드
TC-74-03: CacheManager 수동 clear() → 빈 캐시 정상 동작
TC-74-04: AgentMemory 상태 불일치 → 재초기화
TC-74-05: TeamCoordinator 비정상 종료 후 재시작 → 클린 상태
TC-74-06: PDCA Status 레거시 경로 → 신규 경로 자동 마이그레이션
TC-74-07: memory.json 레거시 경로 → 신규 경로 자동 마이그레이션
TC-74-08: StateRecorder 이력 초과 → 오래된 이력 정리
TC-74-09: TaskQueue 비정상 상태 → 복구 가능
TC-74-10: Hook 출력 비정상 JSON → 파싱 에러 처리
TC-74-11: 환경변수 변경 후 캐시 미반영 → resetCache 호출 검증
```

---

### 4.10 관점 10: 인프라/리소스 테스트 (TC-75~TC-78, ~55 TC)

---

#### TC-75: Output Style 시스템 (12 TC)

```
TC-75-01: output-styles/ 디렉토리에 4개 파일 존재 확인
  검증: bkit-learning.md, bkit-pdca-guide.md, bkit-enterprise.md, bkit-pdca-enterprise.md
TC-75-02: bkit-learning.md '## Output Rules' 섹션 존재
TC-75-03: bkit-pdca-guide.md '## Output Rules' 섹션 존재
TC-75-04: bkit-enterprise.md '## Output Rules' 섹션 존재
TC-75-05: bkit-pdca-enterprise.md '## Output Rules' 섹션 존재
TC-75-06: loadOutputStyle('bkit-learning') → { name, rules } 반환
TC-75-07: loadOutputStyle('nonexistent') → { name, rules: '' } 폴백
TC-75-08: getDefaultStyleForLevel('Starter') → 'bkit-learning'
TC-75-09: getDefaultStyleForLevel('Dynamic') → 'bkit-pdca-guide'
TC-75-10: getDefaultStyleForLevel('Enterprise') → 'bkit-enterprise'
TC-75-11: getDefaultStyleForLevel('Unknown') → 'bkit-pdca-guide' (기본값)
TC-75-12: output-style-setup 커맨드 → SKILL.md 연결 및 스타일 목록 출력
```

---

#### TC-76: Template 시스템 (15 TC)

```
TC-76-01: templates/ 디렉토리에 13개 루트 템플릿 존재 확인
TC-76-02: templates/pipeline/ 디렉토리에 10개 파이프라인 템플릿 존재
TC-76-03: templates/shared/ 디렉토리에 3개 공유 템플릿 존재
TC-76-04: plan.template.md 필수 섹션 포함: '## 1.', '## 2.', '## 3.'
TC-76-05: design.template.md 필수 섹션 포함: '## 1.', '## 2.', '## 3.'
TC-76-06: analysis.template.md 필수 섹션 포함: 'Match Rate', 'Gap'
TC-76-07: report.template.md 필수 섹션 포함: 'Executive Summary', 'Result'
TC-76-08: design-starter.template.md → Starter 레벨 전용 구조 확인
TC-76-09: design-enterprise.template.md → Enterprise 레벨 전용 구조 확인
TC-76-10: GEMINI.template.md → GEMINI.md 초기화 템플릿 구조 확인
TC-76-11: pipeline/phase-1-schema.template.md ~ phase-9-deployment.template.md 9개 순서 검증
TC-76-12: pipeline/zero-script-qa.template.md 존재 및 구조 확인
TC-76-13: shared/naming-conventions.md → 네이밍 규칙 정의 포함
TC-76-14: shared/api-patterns.md → API 패턴 정의 포함
TC-76-15: shared/error-handling-patterns.md → 에러 처리 패턴 포함
```

---

#### TC-77: Hook 개별 스크립트 검증 (18 TC)

```
# 메인 훅 10개 (각 스크립트 실행 가능성 + JSON 출력 형식)
TC-77-01: session-start.js 실행 → JSON { status: 'allow' } 반환
TC-77-02: session-end.js 실행 → 정상 종료 (exit 0)
TC-77-03: before-agent.js 실행 → JSON { status: 'allow'|'block' } 반환
TC-77-04: after-agent.js 실행 → JSON 출력 형식 준수
TC-77-05: before-model.js 실행 → JSON 출력 형식 준수
TC-77-06: after-model.js 실행 → JSON 출력 형식 준수
TC-77-07: before-tool-selection.js 실행 → JSON 출력 형식 준수
TC-77-08: before-tool.js 실행 → JSON { status: 'allow'|'deny' } 반환
TC-77-09: after-tool.js 실행 → JSON 출력 형식 준수
TC-77-10: pre-compress.js 실행 → 컨텍스트 압축 로직 동작

# PDCA 스킬 후처리 훅 5개
TC-77-11: skills/pdca-plan-post.js → Plan 생성 후 상태 업데이트
TC-77-12: skills/pdca-design-post.js → Design 생성 후 상태 업데이트
TC-77-13: skills/pdca-analyze-post.js → 분석 후 matchRate 기록
TC-77-14: skills/pdca-iterate-post.js → 반복 후 iterationCount 증가
TC-77-15: skills/pdca-report-post.js → 보고서 후 completedAt 기록

# 유틸리티 훅 스크립트 3개
TC-77-16: utils/memory-helper.js → 메모리 읽기/쓰기 헬퍼 함수
TC-77-17: utils/pdca-state-updater.js → PDCA 상태 업데이트 유틸리티
TC-77-18: 모든 훅 스크립트 syntax 에러 없음 (require 성공 확인)
```

---

#### TC-78: Hook 설정 + Runtime Hooks (10 TC)

```
TC-78-01: hooks.json 존재 및 JSON 파싱 성공
TC-78-02: hooks.json에 10개 라이프사이클 이벤트 정의 확인
  (SessionStart, BeforeAgent, BeforeModel, AfterModel, BeforeToolSelection,
   BeforeTool, AfterTool, AfterAgent, PreCompress, SessionEnd)
TC-78-03: hooks.json 각 이벤트에 스크립트 경로 매핑 확인
TC-78-04: hooks.json 스크립트 경로가 실제 파일로 존재 확인 (전수)
TC-78-05: runtime-hooks.js require 성공
TC-78-06: runtime-hooks.js registerRuntimeHooks() 함수 존재
TC-78-07: runtime-hooks.js HOT_PATH_HOOKS 상수 존재 및 배열 형태
TC-78-08: HOT_PATH_HOOKS에 BeforeTool, AfterTool 포함 확인 (성능 최적화 대상)
TC-78-09: hooks.json 이벤트명 ↔ hooks/scripts/ 파일명 매핑 일관성
TC-78-10: hook-adapter.js supportsRuntimeHookFunctions() v0.31.0+ → true
```

---

## 5. 테스트 실행 계획

### 5.1 Sprint 구성

| Sprint | 테스트 범위 | 관점 | 우선순위 | TC 수 |
|--------|------------|------|:--------:|:-----:|
| Sprint 1 | 회귀 + Core Unit | 관점 1, 11 | P0 | ~419 |
| Sprint 2 | E2E + 통합 | 관점 2, 3 | P0~P1 | ~146 |
| Sprint 3 | 시나리오 + 철학 + 인프라 | 관점 4, 5, 10 | P1 | ~155 |
| Sprint 4 | 보안 + 에지 + 경계 + 복구 | 관점 6, 7, 8, 9 | P1~P2 | ~165 |

### 5.2 테스트 파일 구조

```
tests/
├── run-all.js                  # v1.5.8 업데이트 (TC-25~TC-74 추가)
├── setup.js                    # 테스트 환경 설정
├── test-utils.js               # 테스트 유틸리티
├── fixtures.js                 # 테스트 픽스처
├── suites/
│   ├── tc01-hooks.js                    # (기존) Hook System
│   ├── tc02-skills.js                   # (기존) Skill System
│   ├── ...
│   ├── tc24-runtime-hooks.js            # (기존) RuntimeHook SDK
│   │
│   │  ──── 관점 1: Unit Test ────
│   ├── tc25-tool-registry-v158.js       # [신규] tool-registry (20 TC)
│   ├── tc26-version-detector-v158.js    # [신규] version-detector (25 TC)
│   ├── tc27-skill-orchestrator-v158.js  # [신규] skill-orchestrator (20 TC)
│   ├── tc28-multilang-intent.js         # [신규] 다국어 Intent (25 TC)
│   ├── tc29-pdca-modules.js             # [신규] lib/pdca/ (25 TC)
│   ├── tc30-core-modules.js             # [신규] lib/core/ (30 TC)
│   ├── tc31-team-modules.js             # [신규] lib/team/ (40 TC)
│   ├── tc32-paths-registry.js           # [신규] paths + file 유틸 (15 TC)
│   ├── tc33-task-modules.js             # [신규] lib/task/ (20 TC)
│   ├── tc34-adapters-gemini.js          # [신규] adapters/gemini/ (25 TC)
│   ├── tc35-adapters-common.js          # [신규] adapters + common (10 TC)
│   ├── tc36-config-extension-v158.js    # [신규] Config/Extension (15 TC)
│   ├── tc37-context-hierarchy.js        # [신규] ContextHierarchy (10 TC)
│   ├── tc38-feature-flags-matrix.js     # [신규] 버전별 플래그 매트릭스 (15 TC)
│   │
│   │  ──── 관점 2: E2E Test ────
│   ├── tc39-pdca-e2e-v158.js            # [신규] PDCA E2E 확장 (18 TC)
│   ├── tc40-hook-system-e2e.js          # [신규] Hook E2E (15 TC)
│   ├── tc41-team-orchestration-e2e.js   # [신규] Team E2E (12 TC)
│   ├── tc42-skill-activation-e2e.js     # [신규] Skill E2E (10 TC)
│   ├── tc43-mcp-command-e2e.js          # [신규] MCP+Command E2E (8 TC)
│   │
│   │  ──── 관점 3: 통합 테스트 ────
│   ├── tc44-agent-integration-v158.js   # [신규] Agent 통합 (18 TC)
│   ├── tc45-skill-integration-v158.js   # [신규] Skill 통합 (18 TC)
│   ├── tc46-context-engineering.js      # [신규] Context 통합 (15 TC)
│   ├── tc47-config-interop.js           # [신규] Config 연동 (12 TC)
│   ├── tc48-command-integration.js      # [신규] Command 통합 (10 TC)
│   ├── tc49-hook-lib-config-chain.js    # [신규] Hook-Lib-Config 체인 (10 TC)
│   │
│   │  ──── 관점 4: 시나리오 테스트 ────
│   ├── tc50-scenario-starter.js         # [신규] Starter 시나리오 (10 TC)
│   ├── tc51-scenario-dynamic.js         # [신규] Dynamic 시나리오 (10 TC)
│   ├── tc52-scenario-enterprise.js      # [신규] Enterprise 시나리오 (10 TC)
│   ├── tc53-scenario-pm-workflow.js     # [신규] PM 워크플로우 (10 TC)
│   ├── tc54-scenario-multilang.js       # [신규] 다국어 시나리오 (10 TC)
│   │
│   │  ──── 관점 5: 철학 검증 ────
│   ├── tc55-philosophy-context-eng.js   # [신규] Context Engineering (12 TC)
│   ├── tc56-philosophy-pdca.js          # [신규] PDCA 방법론 (15 TC)
│   ├── tc57-philosophy-no-guessing.js   # [신규] No Guessing + Native (10 TC)
│   ├── tc58-philosophy-disclosure.js    # [신규] Progressive Disclosure (8 TC)
│   ├── tc59-philosophy-ai-native.js     # [신규] AI-Native 원칙 (5 TC)
│   │
│   │  ──── 관점 6: 보안/호환성 ────
│   ├── tc60-security-sanitization.js    # [신규] 입력 새니타이제이션 (12 TC)
│   ├── tc61-security-version.js         # [신규] 버전 보안 (10 TC)
│   ├── tc62-security-permission.js      # [신규] Permission 엔진 (10 TC)
│   ├── tc63-compatibility-matrix.js     # [신규] 버전 호환성 (13 TC)
│   │
│   │  ──── 관점 7: 에지 케이스 ────
│   ├── tc64-edge-null-undefined.js      # [신규] Null/Undefined (10 TC)
│   ├── tc65-edge-empty-malformed.js     # [신규] 빈/비정상 데이터 (12 TC)
│   ├── tc66-edge-unicode-special.js     # [신규] 특수문자/유니코드 (10 TC)
│   ├── tc67-edge-concurrency.js         # [신규] 동시성 (8 TC)
│   ├── tc68-edge-filesystem.js          # [신규] 파일 시스템 (10 TC)
│   │
│   │  ──── 관점 8: 경계값 ────
│   ├── tc69-boundary-version.js         # [신규] 버전 경계 (12 TC)
│   ├── tc70-boundary-config.js          # [신규] 설정 한계 (12 TC)
│   ├── tc71-boundary-datasize.js        # [신규] 데이터 크기 (11 TC)
│   │
│   │  ──── 관점 9: 에러 복구 ────
│   ├── tc72-recovery-file-corruption.js # [신규] 파일 손상 복구 (12 TC)
│   ├── tc73-recovery-module-missing.js  # [신규] 모듈 누락 복구 (12 TC)
│   ├── tc74-recovery-cache-state.js     # [신규] 캐시/상태 복구 (11 TC)
│   │
│   │  ──── 관점 10: 인프라/리소스 ────
│   ├── tc75-output-styles.js            # [신규] Output Style 시스템 (12 TC)
│   ├── tc76-template-system.js          # [신규] Template 시스템 (15 TC)
│   ├── tc77-hook-scripts-individual.js  # [신규] Hook 개별 스크립트 (18 TC)
│   └── tc78-hook-config-runtime.js      # [신규] Hook 설정 + Runtime (10 TC)
```

### 5.3 실행 명령

```bash
# 전체 테스트 실행
node tests/run-all.js

# 개별 스위트 실행
node -e "require('./tests/suites/tc25-tool-registry-v158.js').run()"

# P0 우선순위만 실행
node tests/run-all.js --priority P0

# 관점별 실행
node tests/run-all.js --category unit          # 관점 1
node tests/run-all.js --category e2e           # 관점 2
node tests/run-all.js --category integration   # 관점 3
node tests/run-all.js --category scenario      # 관점 4
node tests/run-all.js --category philosophy    # 관점 5
node tests/run-all.js --category security      # 관점 6
node tests/run-all.js --category edge          # 관점 7
node tests/run-all.js --category boundary      # 관점 8
node tests/run-all.js --category recovery      # 관점 9
node tests/run-all.js --category infra          # 관점 10

# Sprint별 실행
node tests/run-all.js --sprint 1    # 회귀 + Core Unit
node tests/run-all.js --sprint 2    # E2E + 통합
node tests/run-all.js --sprint 3    # 시나리오 + 철학
node tests/run-all.js --sprint 4    # 보안 + 에지 + 경계 + 복구
```

---

## 6. 성공 기준

### 6.1 Pass Criteria

| 기준 | 조건 |
|------|------|
| **P0 전체 통과** | TC-01~TC-24 회귀 + TC-25~TC-43 Core Unit/E2E = 100% PASS |
| **P1 90% 이상** | TC-44~TC-78 = 90% 이상 PASS |
| **P2 80% 이상** | 경계값/에지케이스 = 80% 이상 PASS |
| **전체 Pass Rate** | 95% 이상 (880+ TC 기준) |
| **Zero Critical** | Critical 이슈 0건 |

### 6.2 Exit Criteria

1. 모든 P0 테스트 100% PASS
2. 전체 Pass Rate 95% 이상
3. Critical/High 이슈 0건
4. 테스트 결과 Report 생성 완료
5. .pdca-status.json에 matchRate >= 90 기록

---

## 7. 리스크 및 대응

| 리스크 | 영향 | 대응 방안 |
|--------|------|-----------|
| 기존 TC에서 v1.5.8 변경으로 회귀 발생 | High | version assertion 업데이트, 구조 변경 반영 |
| lib/team/ 모듈 외부 의존성 | Medium | 모킹으로 격리 테스트 |
| 8개국어 감지 오차 | Low | 임계값 기반 매칭, 영어 폴백 |
| Hook 스크립트 실행 환경 차이 | Medium | 임시 프로젝트 기반 격리 |
| Gemini CLI 버전 감지 실패 | Low | 기본값(0.29.0) 폴백 검증 |
| 동시성 테스트 안정성 | Medium | Promise.all 기반 제한적 병렬 실행 |
| 파일 시스템 에지 케이스 OS 차이 | Medium | 크로스 플랫폼 경로 처리 (path.sep) |
| 대규모 TC 실행 시간 | Low | Sprint별 분할 실행, --priority 필터 |

---

## 8. 테스트 케이스 요약 매트릭스

### 관점별 테스트 케이스 수

| # | 관점 | 스위트 | TC 수 | 우선순위 |
|---|------|--------|:-----:|:-------:|
| 1 | **Unit Test** | TC-25~TC-38 | 200 | P0~P1 |
| 2 | **E2E Test** | TC-39~TC-43 | 63 | P0 |
| 3 | **통합 테스트** | TC-44~TC-49 | 83 | P1 |
| 4 | **시나리오 테스트** | TC-50~TC-54 | 50 | P1 |
| 5 | **철학 검증** | TC-55~TC-59 | 50 | P1~P2 |
| 6 | **보안/호환성** | TC-60~TC-63 | 45 | P1 |
| 7 | **에지 케이스** | TC-64~TC-68 | 50 | P1~P2 |
| 8 | **경계값 테스트** | TC-69~TC-71 | 35 | P2 |
| 9 | **에러 복구** | TC-72~TC-74 | 35 | P1 |
| 10 | **인프라/리소스** | TC-75~TC-78 | 55 | P1 |
| 11 | **기존 회귀** | TC-01~TC-24 | ~219 | P0 |
| | **합계** | **TC-01~TC-78** | **~885** | - |

### Sprint별 TC 분포

| Sprint | 관점 | TC 범위 | TC 수 | 우선순위 |
|--------|------|---------|:-----:|:--------:|
| Sprint 1 | Unit + 회귀 | TC-01~TC-38 | ~419 | P0 |
| Sprint 2 | E2E + 통합 | TC-39~TC-49 | ~146 | P0~P1 |
| Sprint 3 | 시나리오 + 철학 + 인프라 | TC-50~TC-59, TC-75~TC-78 | ~155 | P1 |
| Sprint 4 | 보안 + 에지 + 경계 + 복구 | TC-60~TC-74 | ~165 | P1~P2 |

### FR-TC 매핑 매트릭스

| FR-ID | 요구사항 | 관련 TC |
|-------|---------|---------|
| FR-T01 | 기존 회귀 전체 통과 | TC-01~TC-24 |
| FR-T02 | v0.33.x 호환성 Unit | TC-25, TC-26, TC-38, TC-63 |
| FR-T03 | PM Agent Team 통합 | TC-44-03~08, TC-53 |
| FR-T04 | CTO Team Unit | TC-31, TC-41 |
| FR-T05 | 신규 스킬 구조 | TC-27, TC-45 |
| FR-T06 | Path Registry Unit | TC-30-01~08, TC-32 |
| FR-T07 | Hook System 확장 | TC-40, TC-49 |
| FR-T08 | PDCA E2E 사이클 | TC-39 |
| FR-T09 | 사용자 시나리오 | TC-50~TC-54 |
| FR-T10 | bkit 철학 검증 | TC-55~TC-59 |
| FR-T11 | 8개국어 트리거 | TC-28, TC-54 |
| FR-T12 | 보안/호환성 | TC-60~TC-63 |
| FR-T13 | 에지 케이스 | TC-64~TC-68 |
| FR-T14 | 경계값 | TC-69~TC-71 |
| FR-T15 | 에러 복구 | TC-72~TC-74 |
| FR-T16 | lib/task/ Unit | TC-33 |
| FR-T17 | lib/pdca/ Unit | TC-29 |
| FR-T18 | lib/core/ Unit | TC-30, TC-32 |
| FR-T19 | lib/adapters/ Unit | TC-34, TC-35 |
| FR-T20 | Context Engineering 통합 | TC-46, TC-55 |
| FR-T21 | Output Style 시스템 검증 | TC-75 |
| FR-T22 | Template 시스템 검증 | TC-76 |
| FR-T23 | Hook 개별 스크립트 검증 | TC-77 |
| FR-T24 | Hook 설정/런타임 검증 | TC-78 |

---

## Version History

| 버전 | 날짜 | 변경사항 | 작성자 |
|------|------|---------|--------|
| 0.1 | 2026-03-11 | 초안 작성 (6개 관점, 21개 스위트, 287 TC) | CTO Team |
| 0.2 | 2026-03-11 | 대폭 확장 (10개 관점, 50개 스위트, 761 TC) | CTO Team |
| 0.3 | 2026-03-11 | 인프라/리소스 관점 추가 (11개 관점, 54개 스위트, 885 TC) | CTO Team |

---

*bkit-gemini v1.5.8 종합 테스트 계획서*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
