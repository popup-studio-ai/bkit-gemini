# Gemini CLI v0.34.0 미활용 기능 고도화 상세 설계

> 작성일: 2026-03-19
> Feature: gemini-cli-034-enhancement
> Plan 참조: docs/01-plan/features/gemini-cli-034-enhancement.plan.md
> Analysis 참조: docs/03-analysis/gemini-cli-034-underutilized-features.analysis.md

---

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | Gemini CLI v0.34.0 미활용 기능 고도화 |
| 시작일 | 2026-03-19 |
| 예상 완료 | 2026-04-02 |
| 총 수정 파일 | 15개 |
| 신규 파일 | 0개 |
| 목표 bkit 버전 | v1.6.0 |

### Value Delivered

| 관점 | 내용 |
|------|------|
| Problem | v0.34.0 기능의 30%만 활용, Tracker가 힌트만 생성하여 Automation First 위반 |
| Solution | Tracker CRUD 직접 호출 + subagent/modes TOML 정책 + modelRouting 비용 최적화 |
| Function UX Effect | PDCA 태스크 100% 자동 추적, 에이전트 최소 권한, API 비용 30-50% 절감 |
| Core Value | bkit 자동화/보안/비용 3축 동시 고도화 |

---

## 1. 아키텍처 개요

### 1.1 현재 아키텍처 (AS-IS)

```
┌─ PDCA Skill ─────────────┐
│  /pdca plan/design/do...  │
└────────────┬──────────────┘
             │ (hint text only)
┌────────────▼──────────────┐     ┌──────────────────────┐
│  tracker-bridge.js        │────▶│  "Use tracker_create  │
│  mode: instruction-based  │     │  _task to create..."  │
└───────────────────────────┘     └──────────────────────┘
                                    ↑ LLM이 해석해서 도구 호출 (불확실)

┌─ Policy Engine ───────────┐
│  Extension Tier 2:        │     ┌──────────────────────┐
│    rm -rf deny            │     │  모든 에이전트 동일    │
│    git push --force deny  │────▶│  권한으로 실행         │
│  Workspace Tier 3:        │     │  (최소권한 미적용)     │
│    Starter: ask_user      │     └──────────────────────┘
└───────────────────────────┘

┌─ BeforeModel Hook ────────┐
│  Phase context 주입만      │     ┌──────────────────────┐
│  모델 선택 로직 없음       │────▶│  항상 동일 모델 사용   │
└───────────────────────────┘     └──────────────────────┘
```

### 1.2 목표 아키텍처 (TO-BE)

```
┌─ PDCA Skill ─────────────┐
│  /pdca plan/design/do...  │
└────────────┬──────────────┘
             │ (direct CRUD call)
┌────────────▼──────────────┐     ┌──────────────────────────┐
│  tracker-bridge.js        │────▶│  tracker_create_task()    │
│  mode: direct-crud        │     │  tracker_update_task()    │
│  fallback: instruction    │     │  직접 API 호출 (확정적)   │
└───────────────────────────┘     └──────────────────────────┘

┌─ Policy Engine ───────────┐
│  Extension Tier 2:        │     ┌──────────────────────────┐
│    rm -rf deny            │     │  읽기전용 에이전트:       │
│    git push --force deny  │     │    write_file deny        │
│    + subagent 규칙 (NEW)  │────▶│  문서전용 에이전트:       │
│  Workspace Tier 3:        │     │    shell deny             │
│    + modes 규칙 (NEW)     │     │  plan_mode: write deny    │
└───────────────────────────┘     └──────────────────────────┘

┌─ BeforeModel Hook ────────┐
│  Phase context 주입        │     ┌──────────────────────────┐
│  + modelRouting (NEW)     │────▶│  Plan/Check → Flash       │
│  + PDCA 단계 자동 감지     │     │  Design/Do → Pro          │
└───────────────────────────┘     └──────────────────────────┘
```

---

## 2. 상세 설계

### 2.1 A-1: Tracker CRUD 직접 활용

#### 2.1.1 수정 파일: `lib/adapters/gemini/tracker-bridge.js`

**현재 코드 분석:**
- `createPdcaEpic()` → 힌트 텍스트 반환 (`"Use tracker_create_task to..."`)
- `syncPhaseTransition()` → 힌트 텍스트 반환
- `getTrackerContextInjection()` → 세션 컨텍스트 힌트

**변경 설계:**

```javascript
// === 새로 추가할 상수 ===
const TRACKER_MODE = Object.freeze({
  DIRECT: 'direct-crud',      // v0.34.0+ 직접 호출
  INSTRUCTION: 'instruction'   // 기존 힌트 방식 (폴백)
});

// PDCA 태스크 템플릿
const PDCA_TASK_TEMPLATES = Object.freeze({
  plan:   { title: '[Plan] {feature}',   status: 'in_progress' },
  design: { title: '[Design] {feature}', status: 'pending',     blockedBy: 'plan' },
  do:     { title: '[Do] {feature}',     status: 'pending',     blockedBy: 'design' },
  check:  { title: '[Check] {feature}',  status: 'pending',     blockedBy: 'do' },
  act:    { title: '[Act] {feature}',    status: 'pending',     blockedBy: 'check' },
  report: { title: '[Report] {feature}', status: 'pending',     blockedBy: 'check' }
});

// === 변경할 함수 ===

/**
 * 현재 트래커 모드 결정
 * v0.34.0+에서 directCrud 설정이면 direct, 아니면 instruction
 */
function getTrackerMode() {
  if (!isTrackerAvailable()) return null;
  try {
    const configPath = path.join(process.cwd(), 'bkit.config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (config.compatibility?.taskTracker?.directCrud === true) {
      return TRACKER_MODE.DIRECT;
    }
  } catch (e) { /* ignore */ }
  return TRACKER_MODE.INSTRUCTION;
}

/**
 * PDCA Epic 생성 - 직접 CRUD 모드
 * 6개 서브태스크를 포함한 에픽 생성 명령 반환
 */
function createPdcaEpic(feature) {
  if (!isTrackerAvailable()) return { available: false, hint: '' };

  const mode = getTrackerMode();

  if (mode === TRACKER_MODE.DIRECT) {
    // 직접 호출 명령 구조체 반환
    const tasks = Object.entries(PDCA_TASK_TEMPLATES).map(([phase, tmpl]) => ({
      phase,
      title: tmpl.title.replace('{feature}', feature),
      status: tmpl.status,
      blockedBy: tmpl.blockedBy || null
    }));

    return {
      available: true,
      mode: TRACKER_MODE.DIRECT,
      tasks,  // 호출자가 tracker_create_task 도구로 실행
      epicTitle: `[PDCA] ${feature}`
    };
  }

  // 기존 instruction 모드 (폴백)
  return {
    available: true,
    mode: TRACKER_MODE.INSTRUCTION,
    hint: `Use tracker_create_task to create epic: "[PDCA] ${feature}" with 6 subtasks`
  };
}

/**
 * PDCA Phase 전환 동기화 - 직접 CRUD 모드
 */
function syncPhaseTransition(feature, fromPhase, toPhase) {
  if (!isTrackerAvailable()) return { mode: null };

  const mode = getTrackerMode();
  const status = PDCA_TO_TRACKER_STATUS[toPhase] || 'in_progress';

  if (mode === TRACKER_MODE.DIRECT) {
    return {
      mode: TRACKER_MODE.DIRECT,
      updates: [
        { phase: fromPhase, status: 'done' },
        { phase: toPhase, status }
      ]
    };
  }

  return {
    mode: TRACKER_MODE.INSTRUCTION,
    hint: `Update tracker: [${capitalize(fromPhase)}] → done, [${capitalize(toPhase)}] → ${status}`
  };
}
```

**핵심 설계 결정:**
- 기존 `instruction` 모드를 제거하지 않고 `direct-crud` 모드 추가 (하위 호환)
- `bkit.config.json`의 `taskTracker.directCrud: true`로 활성화
- 반환값 구조를 확장하여 호출자가 직접 Gemini CLI 도구 호출 가능

#### 2.1.2 수정 파일: `lib/task/tracker.js`

**변경 설계:**

```javascript
// === 추가할 함수 ===

/**
 * PDCA 태스크 자동 생성 명령 생성
 * tracker-bridge에서 반환한 tasks 배열을 Gemini CLI tracker 도구 호출 형식으로 변환
 * @param {object} epicResult - createPdcaEpic() 반환값
 * @returns {object[]} tracker 도구 호출 인자 배열
 */
function buildTrackerCommands(epicResult) {
  if (!epicResult.available || epicResult.mode !== 'direct-crud') {
    return [];
  }

  return epicResult.tasks.map(task => ({
    tool: 'tracker_create_task',
    args: {
      title: task.title,
      description: `PDCA ${task.phase} phase for ${epicResult.epicTitle}`,
      status: task.status
    }
  }));
}

/**
 * Phase 전환 시 tracker 업데이트 명령 생성
 * @param {object} syncResult - syncPhaseTransition() 반환값
 * @param {string} feature
 * @returns {object[]}
 */
function buildTrackerUpdates(syncResult, feature) {
  if (!syncResult || syncResult.mode !== 'direct-crud') {
    return [];
  }

  return syncResult.updates.map(update => {
    const taskId = getPdcaTaskId(update.phase, feature);
    if (!taskId) return null;

    return {
      tool: 'tracker_update_task',
      args: {
        task_id: taskId,
        status: update.status
      }
    };
  }).filter(Boolean);
}
```

#### 2.1.3 수정 파일: `hooks/scripts/after-tool.js`

**변경 위치:** `processPostSkill()` 함수 (line 109-151)

현재 after-tool.js의 `processPostSkill()`이 PDCA 스킬 실행 후 상태만 업데이트합니다. 여기에 Tracker CRUD 동기화를 추가합니다.

```javascript
// processPostSkill() 내부 - action별 처리 후 추가
// 기존 PDCA 상태 업데이트 로직 유지 + tracker 동기화 추가

if (feature) {
  // ... 기존 PDCA 상태 업데이트 로직 ...

  // Tracker CRUD 동기화 (NEW)
  try {
    const { syncPhaseTransition, getTrackerMode } = require(
      path.join(libPath, 'adapters', 'gemini', 'tracker-bridge')
    );
    const mode = getTrackerMode();
    if (mode === 'direct-crud') {
      const syncResult = syncPhaseTransition(feature, previousPhase, action);
      if (syncResult.mode === 'direct-crud' && syncResult.updates) {
        contexts.push(
          `**Tracker Sync**: ${syncResult.updates.map(u =>
            `[${capitalize(u.phase)}] → ${u.status}`
          ).join(', ')}`
        );
      }
    }
  } catch (e) { /* non-fatal */ }
}
```

#### 2.1.4 수정 파일: `bkit.config.json`

```json
"taskTracker": {
  "enabled": true,
  "minVersion": "0.32.0",
  "bridgeEnabled": true,
  "directCrud": true    // NEW: 직접 CRUD 모드 활성화
}
```

---

### 2.2 A-2: subagent TOML 정책

#### 2.2.1 수정 파일: `policies/bkit-extension-policy.toml`

**현재:** 4개 규칙 (rm -rf, git push --force, git reset --hard, rm -r)

**추가 규칙:** 에이전트별 최소 권한 (Tier 2에서는 deny/ask_user만 가능)

```toml
# === 기존 4개 규칙 유지 ===

# === 신규: subagent 읽기 전용 정책 (v0.34.0+) ===

# 읽기 전용 에이전트: 코드 수정 불가
[[rule]]
description = "Read-only agents: deny file writes"
toolName = "write_file"
subagent = ["security-architect", "gap-detector", "code-analyzer", "design-validator"]
decision = "deny"
priority = 90

[[rule]]
description = "Read-only agents: deny replacements"
toolName = "replace"
subagent = ["security-architect", "gap-detector", "code-analyzer", "design-validator"]
decision = "deny"
priority = 90

[[rule]]
description = "Read-only agents: deny shell commands"
toolName = "run_shell_command"
subagent = ["security-architect", "gap-detector", "code-analyzer", "design-validator"]
decision = "deny"
priority = 90

# 문서 전용 에이전트: 셸 명령 불가
[[rule]]
description = "Doc-only agents: deny shell commands"
toolName = "run_shell_command"
subagent = ["report-generator", "product-manager"]
decision = "deny"
priority = 85

# 분석 전용 에이전트: 코드 수정 불가
[[rule]]
description = "Analysis agents: deny file writes"
toolName = "write_file"
subagent = ["qa-monitor", "qa-strategist"]
decision = "deny"
priority = 85

[[rule]]
description = "Analysis agents: deny replacements"
toolName = "replace"
subagent = ["qa-monitor", "qa-strategist"]
decision = "deny"
priority = 85
```

**설계 결정:**
- `subagent` 필드는 v0.34.0+ Policy Engine에서 지원하는 배열 형식
- priority 90: 기존 deny(100)보다 낮지만 allow(10)보다 높음
- Tier 2에서는 `allow` 사용 불가이므로 deny/ask_user만 사용
- cto-lead, pdca-iterator, enterprise-expert는 전체 권한 유지 (규칙 추가 안 함)

#### 2.2.2 수정 파일: `lib/adapters/gemini/policy-migrator.js`

**추가할 상수 및 함수:**

```javascript
// === 추가: 에이전트 권한 그룹 정의 ===
const SUBAGENT_POLICY_GROUPS = Object.freeze({
  readOnly: {
    agents: ['security-architect', 'gap-detector', 'code-analyzer', 'design-validator'],
    deny: ['write_file', 'replace', 'run_shell_command'],
    priority: 90
  },
  docOnly: {
    agents: ['report-generator', 'product-manager'],
    deny: ['run_shell_command'],
    priority: 85
  },
  analysisOnly: {
    agents: ['qa-monitor', 'qa-strategist'],
    deny: ['write_file', 'replace'],
    priority: 85
  }
  // fullAccess: cto-lead, pdca-iterator, enterprise-expert → 규칙 없음
});

/**
 * subagent TOML 규칙 생성
 * @returns {string} TOML 규칙 문자열
 */
function generateSubagentRules() {
  const { getFeatureFlags } = require('./version-detector');
  if (!getFeatureFlags().hasSubagentPolicies) return '';

  const lines = ['', '# --- Subagent Policies (v0.34.0+) ---', ''];

  for (const [groupName, group] of Object.entries(SUBAGENT_POLICY_GROUPS)) {
    for (const tool of group.deny) {
      lines.push('[[rule]]');
      lines.push(`description = "${groupName} agents: deny ${tool}"`);
      lines.push(`toolName = "${tool}"`);
      lines.push(`subagent = [${group.agents.map(a => `"${a}"`).join(', ')}]`);
      lines.push(`decision = "deny"`);
      lines.push(`priority = ${group.priority}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}
```

**기존 `generateExtensionPolicy()` 수정:**
- 함수 말미에 `generateSubagentRules()` 결과를 append

#### 2.2.3 수정 파일: `bkit.config.json`

```json
"compatibility": {
  ...
  "subagentPolicies": {
    "enabled": true,
    "minVersion": "0.34.0",
    "groups": {
      "readOnly": ["security-architect", "gap-detector", "code-analyzer", "design-validator"],
      "docOnly": ["report-generator", "product-manager"],
      "analysisOnly": ["qa-monitor", "qa-strategist"]
    }
  }
}
```

---

### 2.3 A-3: modes 정책 필드

#### 2.3.1 수정 파일: `.gemini/policies/bkit-starter-policy.toml`

**기존 11개 규칙 유지 + modes 규칙 추가:**

```toml
# === 기존 11개 규칙 유지 ===

# === 신규: Plan Mode 코드 작성 차단 (v0.34.0+) ===

[[rule]]
description = "PDCA Plan phase: deny code writes in Plan Mode"
toolName = "write_file"
modes = ["plan_mode"]
decision = "deny"
priority = 80

[[rule]]
description = "PDCA Plan phase: deny replacements in Plan Mode"
toolName = "replace"
modes = ["plan_mode"]
decision = "deny"
priority = 80

[[rule]]
description = "PDCA Plan phase: deny shell in Plan Mode"
toolName = "run_shell_command"
modes = ["plan_mode"]
decision = "deny"
priority = 80
```

**설계 결정:**
- `modes = ["plan_mode"]`는 v0.34.0+ Policy Engine의 새 필드
- priority 80: 기존 ask_user(30-40)보다 높지만 rm -rf deny(100)보다 낮음
- Starter 레벨에서만 적용 (Dynamic/Enterprise는 사용자 판단에 맡김)
- Plan Mode 외에서는 기존 규칙이 적용됨

#### 2.3.2 수정 파일: `lib/adapters/gemini/policy-migrator.js`

**`LEVEL_POLICY_TEMPLATES.Starter.rules` 배열에 추가:**

```javascript
// Starter 템플릿에 modes 규칙 3개 추가
{ toolName: 'write_file', decision: 'deny', priority: 80, modes: ['plan_mode'] },
{ toolName: 'replace', decision: 'deny', priority: 80, modes: ['plan_mode'] },
{ toolName: 'run_shell_command', decision: 'deny', priority: 80, modes: ['plan_mode'] }
```

**`generateLevelPolicy()` 수정:**
- rule 출력 시 `modes` 필드 지원 추가

```javascript
// generateLevelPolicy() 내 rule 출력 루프에서:
if (rule.modes) {
  lines.push(`modes = [${rule.modes.map(m => `"${m}"`).join(', ')}]`);
}
```

---

### 2.4 B-1: plan.modelRouting

#### 2.4.1 수정 파일: `hooks/scripts/before-model.js`

**현재:** `processHook()` → phase context 주입만 (line 13-38)

**추가 설계:** `getModelRoutingHint()` 함수 추가

```javascript
// === 추가: PDCA 단계별 모델 라우팅 힌트 ===

const MODEL_ROUTING = Object.freeze({
  plan:   { model: 'flash', reason: 'Analysis/structuring task' },
  design: { model: 'pro',   reason: 'Creative design requires Pro' },
  do:     { model: 'pro',   reason: 'Accurate code generation' },
  check:  { model: 'flash', reason: 'Comparison/verification task' },
  act:    { model: 'pro',   reason: 'Code fix requires Pro' },
  report: { model: 'flash', reason: 'Document generation' }
});

function getModelRoutingHint(pdcaPhase) {
  const routing = MODEL_ROUTING[pdcaPhase];
  if (!routing) return null;

  // modelRouting은 힌트로만 제공 (Gemini CLI가 실제 모델 전환)
  return `**Model Routing**: Recommended model for ${pdcaPhase} phase: ${routing.model} (${routing.reason})`;
}

// processHook() 수정:
function processHook(input) {
  try {
    // ... 기존 로직 ...

    const pdcaPhase = getCurrentPdcaPhase(projectDir);
    if (pdcaPhase) {
      const phaseContext = getPhaseContext(pdcaPhase);
      if (phaseContext) contexts.push(phaseContext);

      // NEW: modelRouting 힌트 추가
      const routingHint = getModelRoutingHint(pdcaPhase);
      if (routingHint) contexts.push(routingHint);
    }

    // ... 기존 반환 로직 ...
  } catch (error) {
    return { status: 'allow' };
  }
}
```

**설계 결정:**
- Gemini CLI의 `plan.modelRouting` 설정과는 별개로, BeforeModel Hook에서 힌트를 주입
- 실제 모델 전환은 Gemini CLI의 내장 Plan Mode가 처리
- bkit은 PDCA 단계 정보를 제공하여 더 정확한 라우팅 유도

#### 2.4.2 수정 파일: `bkit.config.json`

```json
"modelRouting": {
  "enabled": true,
  "minVersion": "0.34.0",
  "rules": {
    "plan": "flash",
    "design": "pro",
    "do": "pro",
    "check": "flash",
    "act": "pro",
    "report": "flash"
  }
}
```

---

### 2.5 B-2: contextFileNameArray

#### 2.5.1 수정 파일: `gemini-extension.json`

```json
{
  "name": "bkit",
  "version": "1.6.0",
  "contextFileName": ["GEMINI.md", "GEMINI-agents.md", "GEMINI-skills.md"],
  ...
}
```

**설계 결정:**
- v0.34.0+의 `hasContextFileNameArray` Feature Flag로 게이트
- GEMINI.md: 핵심 PDCA 규칙 + 에이전트 트리거 (현재 @import 유지)
- GEMINI-agents.md: 에이전트 상세 설명 (JIT 로딩 대비)
- GEMINI-skills.md: 스킬 트리거/분류 (JIT 로딩 대비)
- 기존 @import 구조와 공존 (contextFileNameArray가 지원 안 되면 GEMINI.md만 로드)

---

### 2.6 B-3: MCP Prompt Loader

#### 2.6.1 수정 파일: `lib/adapters/gemini/version-detector.js`

**변경 없음** — `hasMcpPromptLoader` Feature Flag 이미 존재 (line 206)

#### 2.6.2 수정 파일: `.gemini/settings.json` (프로젝트 사용 시)

```json
{
  "mcpServers": {
    "bkend": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/claude-code-mcp-server"],
      "promptsAsCommands": true
    }
  }
}
```

**설계 결정:**
- `promptsAsCommands: true` 설정으로 MCP prompts/list를 슬래시 커맨드로 노출
- bkend MCP 서버에 prompts/list 엔드포인트가 있어야 활용 가능
- 문서 업데이트로 사용법 안내 (코드 변경 최소)

---

## 3. 구현 순서

### Phase A (Week 1) — 병렬 진행 가능

| 순서 | 작업 | 수정 파일 | 예상 공수 |
|------|------|-----------|-----------|
| A-1a | tracker-bridge.js 직접 CRUD 모드 추가 | tracker-bridge.js | 1일 |
| A-1b | tracker.js에 buildTrackerCommands() 추가 | lib/task/tracker.js | 0.5일 |
| A-1c | after-tool.js에 Tracker 동기화 추가 | hooks/scripts/after-tool.js | 0.5일 |
| A-1d | bkit.config.json directCrud 설정 | bkit.config.json | 0.5일 |
| A-2a | Extension TOML에 subagent 규칙 추가 | policies/bkit-extension-policy.toml | 0.5일 |
| A-2b | policy-migrator.js subagent 생성 로직 | lib/adapters/gemini/policy-migrator.js | 1일 |
| A-3a | Starter TOML에 modes 규칙 추가 | .gemini/policies/bkit-starter-policy.toml | 0.5일 |
| A-3b | policy-migrator.js modes 필드 지원 | lib/adapters/gemini/policy-migrator.js | 0.5일 |

### Phase B (Week 2) — A 완료 후 순차

| 순서 | 작업 | 수정 파일 | 예상 공수 |
|------|------|-----------|-----------|
| B-1a | before-model.js modelRouting 힌트 | hooks/scripts/before-model.js | 0.5일 |
| B-1b | bkit.config.json modelRouting 설정 | bkit.config.json | 0.5일 |
| B-2a | gemini-extension.json 배열 전환 | gemini-extension.json | 0.5일 |
| B-2b | GEMINI-agents.md, GEMINI-skills.md 분리 | 신규 2개 파일 | 1일 |
| B-3a | MCP Prompt 설정 문서화 | 문서 업데이트 | 0.5일 |

---

## 4. 데이터 모델

### 4.1 tracker-bridge.js 반환값 변경

```typescript
// AS-IS
interface EpicResult {
  available: boolean;
  hint: string;
}

// TO-BE
interface EpicResult {
  available: boolean;
  mode: 'direct-crud' | 'instruction';
  // direct-crud 모드
  tasks?: Array<{
    phase: string;
    title: string;
    status: string;
    blockedBy: string | null;
  }>;
  epicTitle?: string;
  // instruction 모드 (폴백)
  hint?: string;
}

// Phase 전환 반환값
// AS-IS: string (힌트 텍스트)
// TO-BE:
interface SyncResult {
  mode: 'direct-crud' | 'instruction' | null;
  updates?: Array<{ phase: string; status: string }>;
  hint?: string;
}
```

### 4.2 bkit.config.json 추가 필드

```json
{
  "compatibility": {
    "taskTracker": {
      "directCrud": true          // NEW
    },
    "subagentPolicies": {         // NEW section
      "enabled": true,
      "minVersion": "0.34.0",
      "groups": { ... }
    }
  },
  "modelRouting": {               // NEW section
    "enabled": true,
    "minVersion": "0.34.0",
    "rules": { ... }
  }
}
```

---

## 5. 에러 처리

| 상황 | 처리 | 폴백 |
|------|------|------|
| Tracker API 없음 (CLI < 0.32.0) | `isTrackerAvailable()` false | 기존 instruction 모드 |
| directCrud 설정 없음 | `getTrackerMode()` → instruction | 힌트 텍스트 반환 |
| subagent 필드 미지원 (CLI < 0.34.0) | Feature Flag 체크 | 규칙 무시 (기존 동작) |
| modes 필드 미지원 | Feature Flag 체크 | 규칙 무시 |
| modelRouting 비활성화 | config.modelRouting.enabled 체크 | 힌트 미생성 |
| contextFileNameArray 미지원 | 단일 contextFileName 유지 | GEMINI.md만 로드 |

---

## 6. 테스트 시나리오

### 6.1 Tracker CRUD 테스트

| TC | 시나리오 | 기대 결과 |
|----|----------|-----------|
| TC-1 | directCrud=true에서 /pdca plan 실행 | tasks 배열 반환, instruction 아님 |
| TC-2 | directCrud=false에서 /pdca plan 실행 | hint 텍스트 반환 (기존 동작) |
| TC-3 | CLI < 0.32.0에서 실행 | available=false, 무해 |
| TC-4 | Phase 전환 (plan→design) | updates 배열에 2건 |

### 6.2 subagent 정책 테스트

| TC | 시나리오 | 기대 결과 |
|----|----------|-----------|
| TC-5 | security-architect → write_file | deny |
| TC-6 | cto-lead → write_file | allow (규칙 없음) |
| TC-7 | report-generator → write_file | allow (문서 작성 허용) |
| TC-8 | report-generator → run_shell_command | deny |
| TC-9 | CLI < 0.34.0에서 subagent 규칙 | 무시됨 (기존 동작) |

### 6.3 modes 정책 테스트

| TC | 시나리오 | 기대 결과 |
|----|----------|-----------|
| TC-10 | Plan Mode + write_file (Starter) | deny |
| TC-11 | Normal Mode + write_file (Starter) | ask_user (기존) |
| TC-12 | Plan Mode + read_file | allow |
| TC-13 | Plan Mode + write_file (Dynamic) | allow (modes 규칙 없음) |

### 6.4 modelRouting 테스트

| TC | 시나리오 | 기대 결과 |
|----|----------|-----------|
| TC-14 | Plan 단계 BeforeModel | "Recommended: flash" 힌트 |
| TC-15 | Do 단계 BeforeModel | "Recommended: pro" 힌트 |
| TC-16 | PDCA 비활성 상태 | 힌트 없음 |

---

## 7. 하위 호환성

| 항목 | 보장 방식 |
|------|-----------|
| tracker-bridge.js | `getTrackerMode()` 폴백으로 기존 instruction 모드 유지 |
| TOML 정책 | subagent/modes 필드는 미지원 CLI에서 무시됨 |
| before-model.js | modelRouting 힌트는 additionalContext로만 주입, 기존 동작 불변 |
| contextFileNameArray | 미지원 시 첫 번째 요소(GEMINI.md)만 로드 |
| bkit.config.json | 새 필드 추가만, 기존 필드 변경 없음 |

---

## 8. 버전 변경 계획

| 파일 | 버전 변경 |
|------|-----------|
| bkit.config.json | `"version": "1.5.9"` → `"1.6.0"` |
| gemini-extension.json | `"version": "1.5.9"` → `"1.6.0"` |
| tracker-bridge.js | `@version 1.5.8` → `@version 1.6.0` |
| policy-migrator.js | `@version 1.5.8` → `@version 1.6.0` |
| tool-registry.js | 변경 없음 (v1.5.9 유지) |
| version-detector.js | 변경 없음 (v1.5.9 유지) |
