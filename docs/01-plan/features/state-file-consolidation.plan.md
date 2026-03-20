# State File Consolidation Plan

> **Feature**: state-file-consolidation
> **Version**: 2.0.0
> **Date**: 2026-03-21
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | State files scattered across 3 locations (root, docs/, .bkit/state/); 19 files with 30+ hardcoded path references bypass centralized paths.js; CC bkit uses `.bkit/` exclusively but bkit-gemini does not |
| **Solution** | Consolidate ALL state files into `.bkit/` directory matching CC bkit structure; update all 19 files to use paths.js; add migration logic for backward compatibility |
| **Function/UX Effect** | Consistent state management across CC bkit and bkit-gemini; cleaner project root; single migration path for future versions |
| **Core Value** | **Platform-agnostic state management** — same `.bkit/` structure whether using Claude Code or Gemini CLI |

---

## 1. Target State (CC bkit parity)

```
.bkit/
├── state/
│   ├── pdca-status.json          # PRIMARY (moved from root)
│   ├── memory.json               # Already here
│   ├── batch/                    # Batch operation state
│   ├── resume/                   # Feature resumption context
│   └── workflows/                # Workflow execution state
├── runtime/
│   ├── control-state.json        # Already here
│   └── agent-state.json          # Already here
├── snapshots/                    # Fork snapshots (moved from docs/.pdca-snapshots)
├── audit/                        # Daily audit JSONL
├── checkpoints/                  # Checkpoint snapshots
├── decisions/                    # Decision traces
└── workflows/                    # Workflow YAML definitions
```

**Files to REMOVE after migration:**
- `ROOT/.pdca-status.json` → `.bkit/state/pdca-status.json`
- `docs/.pdca-status.json` (ghost)
- `docs/.bkit-memory.json` (ghost)
- `docs/.pdca-snapshots/` → `.bkit/snapshots/`

---

## 2. Requirements

### 2.1 Functional Requirements

| ID | Requirement | Priority | Files Affected |
|----|-------------|----------|----------------|
| SC-01 | Move pdca-status.json from root to .bkit/state/ | Critical | paths.js, pdca/status.js, 10+ consumers |
| SC-02 | Update paths.js to match CC bkit STATE_PATHS structure | Critical | lib/core/paths.js |
| SC-03 | Add migration logic: root → .bkit/state/ for pdca-status.json | Critical | lib/pdca/status.js |
| SC-04 | Fix context-fork.js writePdcaStatus to use .bkit/state/ | Critical | lib/gemini/context-fork.js |
| SC-05 | Move fork snapshots from docs/.pdca-snapshots to .bkit/snapshots/ | High | lib/gemini/context-fork.js |
| SC-06 | Fix task/tracker.js to use paths.js | High | lib/task/tracker.js |
| SC-07 | Fix task/dependency.js to use paths.js | High | lib/task/dependency.js |
| SC-08 | Fix before-model.js legacy path | Medium | hooks/scripts/before-model.js |
| SC-09 | Fix after-agent.js 3 legacy paths | Medium | hooks/scripts/after-agent.js |
| SC-10 | Fix session-end.js 2 legacy paths | Medium | hooks/scripts/session-end.js |
| SC-11 | Fix before-tool-selection.js 2 legacy paths | Medium | hooks/scripts/before-tool-selection.js |
| SC-12 | Fix after-model.js legacy path | Medium | hooks/scripts/after-model.js |
| SC-13 | Fix memory-helper.js 2 legacy paths | Medium | hooks/scripts/utils/memory-helper.js |
| SC-14 | Fix pre-compress.js 2 legacy paths | Medium | hooks/scripts/pre-compress.js |
| SC-15 | Delete ghost files (docs/.pdca-status.json, docs/.bkit-memory.json) | High | File system |
| SC-16 | Add ensureBkitDirs() call in session-start.js | High | hooks/scripts/session-start.js |
| SC-17 | Update tests for new paths | High | tests/suites/tc*.js |
| SC-18 | Move .pdca-tasks.json from docs/ to .bkit/state/ | Medium | lib/task/tracker.js |

### 2.2 Non-Functional Requirements

| Category | Criteria |
|----------|----------|
| Backward compat | Auto-migrate from root/.pdca-status.json AND docs/.pdca-status.json to .bkit/state/ |
| Test integrity | All existing 115+ Sprint 5/6 tests pass |
| CC parity | .bkit/ structure matches bkit-claude-code layout |

---

## 3. Implementation Phases

### Phase 1: Core Infrastructure (SC-01, SC-02, SC-03, SC-16)
- Update paths.js with CC-parity STATE_PATHS
- Update pdca/status.js migration: root + docs/ → .bkit/state/
- Add ensureBkitDirs() to session-start.js

### Phase 2: Critical Fixes (SC-04, SC-05, SC-06, SC-07, SC-18)
- Fix context-fork.js (writePdcaStatus + snapshot paths)
- Fix task/tracker.js and task/dependency.js

### Phase 3: Hook Fixes (SC-08 ~ SC-14)
- Fix all 7 hook scripts with legacy paths

### Phase 4: Cleanup & Tests (SC-15, SC-17)
- Delete ghost files
- Update and run tests

---

## 4. Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Existing sessions break | 3-tier migration: .bkit/state/ → root → docs/ fallback chain |
| Tests rely on docs/ paths | Update test fixtures to use new paths |
| Ghost files regenerated | Remove writePdcaStatus in context-fork.js that writes to docs/ |
