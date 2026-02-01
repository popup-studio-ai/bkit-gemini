# gemini-philosophy-gaps Implementation Plan

> **Status**: Draft
>
> **Project**: bkit-gemini
> **Version**: 1.5.1
> **Author**: POPUP STUDIO
> **Created**: 2026-02-01
> **Priority**: High

---

## 1. Overview

### 1.1 Background

Philosophy alignment analysis identified **3 critical gaps** and **3 moderate gaps** that prevent bkit-gemini from fully implementing the bkit philosophy documented in `bkit-system/philosophy/`.

### 1.2 Reference Document

- Analysis Report: [gemini-philosophy-alignment.report.md](../../04-report/features/gemini-philosophy-alignment.report.md)

### 1.3 Objective

Implement workarounds and extensions to achieve **90%+ philosophy alignment** score (current: 78%).

---

## 2. Gap Inventory

### 2.1 Critical Gaps (Must Fix)

| # | Gap | Affected Components | Philosophy Impact |
|---|-----|---------------------|-------------------|
| GAP-01 | Context Fork/Isolation | gap-detector, design-validator | FR-03, No Guessing |
| GAP-02 | Task Dependency Chain | PDCA workflow, Task System | FR-06, Automation First |
| GAP-03 | spawn_agent Tool | All 11 agents | Agent System, Behavioral Rules |

### 2.2 Moderate Gaps (Should Fix)

| # | Gap | Affected Components | Philosophy Impact |
|---|-----|---------------------|-------------------|
| GAP-04 | Per-Agent Model Selection | Agent performance optimization | AI-Native Principles |
| GAP-05 | Permission Pattern Matching | Security enforcement | FR-05, Automation First |
| GAP-06 | Structured Memory Storage | .bkit-memory.json | FR-08, State Management |

---

## 3. Implementation Plan

### 3.1 Phase 1: Context Fork Simulation (GAP-01)

**Goal**: Enable isolated context execution for analysis agents

#### 3.1.1 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Context Fork Simulation                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  forkContext(agentName)                                     │
│       │                                                     │
│       ├── 1. Snapshot current .pdca-status.json            │
│       ├── 2. Create fork ID (uuid)                         │
│       ├── 3. Store snapshot in .pdca-snapshots/            │
│       └── 4. Return { forkId, snapshotPath }               │
│                                                             │
│  mergeForkedContext(forkId)                                 │
│       │                                                     │
│       ├── 1. Read fork result                              │
│       ├── 2. Merge arrays (dedupe)                         │
│       ├── 3. Merge objects (deep)                          │
│       └── 4. Update main state                             │
│                                                             │
│  discardFork(forkId)                                        │
│       │                                                     │
│       └── Delete snapshot, no merge                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 3.1.2 Implementation Files

| File | Purpose |
|------|---------|
| `lib/adapters/gemini/context-fork.js` | Fork simulation logic |
| `hooks/scripts/after-agent.js` | Fork merge/discard handling |

#### 3.1.3 Usage in Agents

```yaml
# agents/gap-detector.md
---
name: gap-detector
metadata:
  context: fork
  mergeResult: false
---
```

Hook script reads metadata and handles fork lifecycle.

### 3.2 Phase 2: Task Dependency Tracking (GAP-02)

**Goal**: Implement blockedBy dependency metadata for PDCA phase blocking

#### 3.2.1 Data Model

```json
// .pdca-status.json extension
{
  "tasks": {
    "task-001": {
      "id": "task-001",
      "subject": "[Plan] user-auth",
      "status": "completed",
      "blockedBy": [],
      "blocks": ["task-002"]
    },
    "task-002": {
      "id": "task-002",
      "subject": "[Design] user-auth",
      "status": "pending",
      "blockedBy": ["task-001"],
      "blocks": ["task-003"]
    }
  }
}
```

#### 3.2.2 Implementation Files

| File | Purpose |
|------|---------|
| `lib/task/dependency.js` | NEW: Dependency tracking logic |
| `lib/task/tracker.js` | UPDATE: Add blockedBy support |
| `hooks/scripts/before-agent.js` | Check dependencies before task start |

#### 3.2.3 Dependency Rules

```javascript
// lib/task/dependency.js
const PDCA_DEPENDENCY_CHAIN = {
  'Plan': [],
  'Design': ['Plan'],
  'Do': ['Design'],
  'Check': ['Do'],
  'Act': ['Check'],
  'Report': ['Check']
};

function canStartTask(taskType, featureTasks) {
  const dependencies = PDCA_DEPENDENCY_CHAIN[taskType];
  return dependencies.every(dep =>
    featureTasks.some(t => t.type === dep && t.status === 'completed')
  );
}
```

### 3.3 Phase 3: spawn_agent MCP Server (GAP-03)

**Goal**: Create MCP server that provides spawn_agent tool

#### 3.3.1 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    spawn_agent MCP Server                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tool: spawn_agent                                          │
│                                                             │
│  Input:                                                     │
│    - agent_name: string (e.g., "gap-detector")             │
│    - task: string (agent's task description)               │
│    - context: object (optional context data)               │
│                                                             │
│  Process:                                                   │
│    1. Resolve agent extension path                         │
│    2. Build gemini-cli command                             │
│    3. Execute: gemini -e {agent} --yolo "{task}"          │
│    4. Capture stdout/stderr                                │
│    5. Parse result                                         │
│                                                             │
│  Output:                                                    │
│    - success: boolean                                       │
│    - result: string (agent's final output)                 │
│    - error: string (if failed)                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 3.3.2 Implementation Files

| File | Purpose |
|------|---------|
| `mcp/spawn-agent-server.js` | NEW: MCP server implementation |
| `gemini-extension.json` | UPDATE: Register MCP server |
| `agents/*.md` | UPDATE: Add extension metadata |

#### 3.3.3 MCP Server Registration

```json
// gemini-extension.json
{
  "mcpServers": {
    "bkend": { ... },
    "bkit-agents": {
      "command": "node",
      "args": ["${extensionPath}/mcp/spawn-agent-server.js"],
      "cwd": "${extensionPath}"
    }
  }
}
```

#### 3.3.4 Tool Schema

```javascript
// mcp/spawn-agent-server.js
server.registerTool('spawn_agent', {
  description: 'Spawn a specialized bkit agent to handle a task',
  inputSchema: z.object({
    agent_name: z.string().describe('Name of agent to spawn'),
    task: z.string().describe('Task description for the agent'),
    context: z.object({}).optional().describe('Additional context')
  })
}, async ({ agent_name, task, context }) => {
  // Implementation
});
```

### 3.4 Phase 4: Permission Pattern Matching (GAP-05)

**Goal**: Implement deny/ask/allow permission system with pattern matching

#### 3.4.1 Configuration Format

```json
// bkit.config.json
{
  "permissions": {
    "write_file": "allow",
    "run_shell_command(rm -rf*)": "deny",
    "run_shell_command(git push --force*)": "deny",
    "run_shell_command(docker system prune*)": "ask"
  }
}
```

#### 3.4.2 Implementation Files

| File | Purpose |
|------|---------|
| `lib/core/permission.js` | UPDATE: Add pattern matching |
| `hooks/scripts/before-tool.js` | UPDATE: Check permissions |

#### 3.4.3 Permission Logic

```javascript
// lib/core/permission.js
function checkPermission(toolName, toolInput) {
  const config = loadConfig();
  const permissions = config.permissions || {};

  // Check exact tool match
  if (permissions[toolName]) {
    return permissions[toolName];
  }

  // Check pattern match (e.g., run_shell_command(rm -rf*))
  for (const [pattern, level] of Object.entries(permissions)) {
    if (matchesPattern(toolName, toolInput, pattern)) {
      return level;
    }
  }

  return 'allow'; // Default
}
```

### 3.5 Phase 5: Structured Memory Storage (GAP-06)

**Goal**: Implement file-based structured memory for complex state

#### 3.5.1 Data Model

```json
// docs/.bkit-memory.json
{
  "version": "1.0",
  "lastUpdated": "2026-02-01T12:00:00Z",
  "data": {
    "lastFeature": "user-auth",
    "sessionCount": 5,
    "activePdca": "user-auth",
    "preferences": {
      "language": "ko"
    }
  }
}
```

#### 3.5.2 Implementation Files

| File | Purpose |
|------|---------|
| `lib/core/memory.js` | NEW: Structured memory API |
| `hooks/scripts/session-start.js` | UPDATE: Load memory |
| `hooks/scripts/session-end.js` | UPDATE: Save memory |

#### 3.5.3 Memory API

```javascript
// lib/core/memory.js
const memoryPath = path.join(process.cwd(), 'docs', '.bkit-memory.json');

function setMemory(key, value) {
  const memory = loadMemory();
  memory.data[key] = value;
  memory.lastUpdated = new Date().toISOString();
  saveMemory(memory);
}

function getMemory(key, defaultValue = null) {
  const memory = loadMemory();
  return memory.data[key] ?? defaultValue;
}

function deleteMemory(key) {
  const memory = loadMemory();
  delete memory.data[key];
  saveMemory(memory);
}
```

### 3.6 Phase 6: Model Selection Enhancement (GAP-04)

**Goal**: Document and implement best practices for model selection

#### 3.6.1 Strategy

Since Gemini CLI doesn't support per-agent model selection:

1. **Document Recommended Settings**
   - Complex analysis tasks: Use `gemini 2.5 pro` or `gemini 3 pro`
   - Fast monitoring tasks: Use `gemini flash`
   - Default: Use `auto` (recommended by Google)

2. **Agent Metadata for Reference**
   ```yaml
   # agents/gap-detector.md
   metadata:
     recommended-model: pro
     complexity: high
   ```

3. **User Guidance in README**
   - Add section on model selection
   - Explain trade-offs

---

## 4. Implementation Order

```
┌─────────────────────────────────────────────────────────────┐
│                   Implementation Timeline                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Phase 1: Context Fork          ████████░░  (Priority: 1)  │
│           GAP-01                                            │
│                                                             │
│  Phase 2: Task Dependency       ████████░░  (Priority: 2)  │
│           GAP-02                                            │
│                                                             │
│  Phase 3: spawn_agent MCP       ██████████  (Priority: 3)  │
│           GAP-03                                            │
│                                                             │
│  Phase 4: Permission Pattern    ████░░░░░░  (Priority: 4)  │
│           GAP-05                                            │
│                                                             │
│  Phase 5: Structured Memory     ████░░░░░░  (Priority: 5)  │
│           GAP-06                                            │
│                                                             │
│  Phase 6: Model Selection       ██░░░░░░░░  (Priority: 6)  │
│           GAP-04 (Documentation)                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Success Criteria

### 5.1 Acceptance Criteria

| Phase | Criteria | Verification |
|-------|----------|--------------|
| 1 | Context fork simulation works | gap-detector runs in isolation |
| 2 | Task dependencies enforced | Design blocked until Plan complete |
| 3 | spawn_agent tool available | Agent spawning via MCP works |
| 4 | Permission patterns work | rm -rf blocked, docker prune asks |
| 5 | Memory persistence works | State survives session restart |
| 6 | Model guidance documented | README updated |

### 5.2 Target Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Philosophy Alignment Score | 78% | 90%+ |
| Critical Gaps | 3 | 0 |
| Moderate Gaps | 3 | 0 |

---

## 6. Files to Create/Modify

### 6.1 New Files

| File | Phase | Purpose |
|------|-------|---------|
| `lib/adapters/gemini/context-fork.js` | 1 | Context fork simulation |
| `lib/task/dependency.js` | 2 | Task dependency tracking |
| `mcp/spawn-agent-server.js` | 3 | spawn_agent MCP server |
| `lib/core/memory.js` | 5 | Structured memory storage |

### 6.2 Modified Files

| File | Phase | Changes |
|------|-------|---------|
| `hooks/scripts/after-agent.js` | 1 | Fork merge/discard handling |
| `lib/task/tracker.js` | 2 | blockedBy support |
| `hooks/scripts/before-agent.js` | 2 | Dependency checking |
| `gemini-extension.json` | 3 | Register MCP server |
| `lib/core/permission.js` | 4 | Pattern matching |
| `hooks/scripts/before-tool.js` | 4 | Permission enforcement |
| `hooks/scripts/session-start.js` | 5 | Load memory |
| `hooks/scripts/session-end.js` | 5 | Save memory |
| `README.md` | 6 | Model selection guide |

---

## 7. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| MCP server complexity | Delayed spawn_agent | Start with simple shell wrapper |
| Context fork simulation limits | Incomplete isolation | Document limitations |
| Gemini CLI updates | Breaking changes | Pin compatible version |
| Performance overhead | Slower execution | Optimize critical paths |

---

## 8. Testing Plan

### 8.1 Unit Tests

- [ ] Context fork: create/merge/discard
- [ ] Task dependency: chain validation
- [ ] Permission: pattern matching
- [ ] Memory: CRUD operations

### 8.2 Integration Tests

- [ ] Full PDCA cycle with dependencies
- [ ] gap-detector with context fork
- [ ] spawn_agent via MCP
- [ ] Session restart memory persistence

### 8.3 End-to-End Tests

- [ ] Complete feature development flow
- [ ] Multi-feature parallel development
- [ ] Error recovery scenarios

---

## 9. Version Target

**Target Version**: bkit-gemini v1.5.1

**Changelog Entry**:
```
### v1.5.1 (TBD)

**Added:**
- Context fork simulation for analysis agents
- Task dependency tracking with blockedBy
- spawn_agent MCP server
- Structured memory storage
- Permission pattern matching

**Fixed:**
- GAP-01: Context Fork/Isolation
- GAP-02: Task Dependency Chain
- GAP-03: spawn_agent Tool
- GAP-04: Model Selection Documentation
- GAP-05: Permission Pattern Matching
- GAP-06: Structured Memory Storage

**Philosophy Alignment:**
- Score improved from 78% to 90%+
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-01 | Initial plan | POPUP STUDIO |
