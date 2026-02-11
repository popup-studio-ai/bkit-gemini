# Conductor Integration Research

> **Status**: Research (FR-20)
> **Date**: 2026-02-11
> **Author**: bkit-gemini team

## 1. Overview

Google Conductor Extension is an agent orchestration framework for Gemini CLI that provides structured workflow management for multi-agent tasks.

## 2. Research Items

### 2.1 Conductor Extension Feature Analysis

| Feature | Description | bkit Equivalent |
|---------|-------------|-----------------|
| Workflow Definition | YAML-based workflow specs | PDCA phase progression |
| Agent Routing | Task-based agent selection | Skill Orchestrator + before-agent.js |
| State Management | Centralized workflow state | docs/.pdca-status.json |
| Error Recovery | Automatic retry/fallback | Graceful degradation in hooks |
| Parallel Execution | Fan-out/fan-in patterns | MCP team_create + spawn_agent |

### 2.2 Overlap Analysis

**Overlapping Areas:**
- Agent orchestration and routing
- Workflow state management
- Multi-agent coordination patterns

**Complementary Areas:**
- Conductor: Low-level workflow primitives, retry logic, fan-out/fan-in
- bkit: PDCA methodology, quality gates, gap analysis, domain-specific agents

### 2.3 Integration Possibilities

1. **Conductor as Orchestration Layer**: Use Conductor for low-level agent coordination, bkit for high-level PDCA methodology
2. **bkit Workflow Adapter**: Map PDCA phases to Conductor workflow steps
3. **Hybrid Approach**: Use bkit for PDCA-driven tasks, Conductor for non-PDCA multi-agent tasks

### 2.4 Differentiation Strategy

- bkit focuses on **methodology** (PDCA), Conductor focuses on **mechanics** (workflow execution)
- bkit provides **domain knowledge** (development pipeline, code review patterns), Conductor provides **infrastructure**
- Integration should preserve bkit's PDCA identity while leveraging Conductor's execution capabilities

## 3. Recommendation

**Phase 1 (Current v1.5.1)**: No Conductor dependency. Use MCP-based team tools as foundation.
**Phase 2 (Future)**: Evaluate Conductor as optional orchestration backend when it reaches stable release.
**Phase 3 (Future)**: If integrated, create `lib/adapters/conductor/` adapter following existing Platform Adapter pattern.

## 4. Open Questions

1. Conductor Extension API stability and release timeline
2. Performance overhead of Conductor vs direct MCP calls
3. Community adoption and ecosystem maturity
4. License compatibility with bkit distribution model
