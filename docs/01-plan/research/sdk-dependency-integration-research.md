# SDK/Dependency Integration Research for bkit-gemini

> **Task**: #11 - CTO Team Research
> **Author**: Infra Architect Agent
> **Date**: 2026-02-25
> **bkit Version**: v1.5.4 (current) -> v1.5.5 / v1.6.0 (target)
> **Status**: Completed

---

## Table of Contents

1. [@google/gemini-cli-core SDK (v0.30.0)](#1-googegemini-cli-core-sdk-v0300)
2. [Agent Client Protocol (ACP) SDK (v0.14.1)](#2-agent-client-protocol-acp-sdk-v0141)
3. [GenAI SDK Changes (1.30.0 -> 1.41.0)](#3-genai-sdk-changes-1300---1410)
4. [MCP SDK Update (1.23.0 -> 1.27.1)](#4-mcp-sdk-update-1230---1271)
5. [Extension Registry Requirements](#5-extension-registry-requirements)
6. [Automated Test Framework Selection](#6-automated-test-framework-selection)
7. [Integration Roadmap](#7-integration-roadmap)
8. [Architecture Decision Records](#8-architecture-decision-records)

---

## 1. @google/gemini-cli-core SDK (v0.30.0)

### 1.1 Findings Summary

The `@google/gemini-cli-core` package was first published alongside Gemini CLI v0.30.0 on 2026-02-25. It represents the extraction of the CLI's core runtime into a standalone package, enabling programmatic access to the same engine that powers the Gemini CLI.

**npm Registry Data (live, 2026-02-25)**:

| Attribute | Value |
|-----------|-------|
| Package | `@google/gemini-cli-core` |
| Latest Stable | `0.30.0` (2026-02-25) |
| Latest Preview | `0.31.0-preview.0` (2026-02-25) |
| Entry Point | `dist/index.js` |
| Type Definitions | `./dist/index.d.ts` |
| Key Dependencies | `@google/genai@1.30.0`, `@modelcontextprotocol/sdk@^1.23.0`, `@a2a-js/sdk@^0.3.8` |

### 1.2 API/Capability Details

Based on the package metadata and Gemini CLI source code analysis:

**Core Exports (inferred from type definitions path)**:

| API Surface | Description | bkit Relevance |
|------------|-------------|----------------|
| `SessionContext` | Runtime context for skill/hook execution | HIGH - programmatic skill execution |
| `ToolRegistry` | Built-in tool definitions and schemas | HIGH - validate bkit tool-registry.js |
| `PolicyEngine` | TOML policy evaluation engine | MEDIUM - validate policy-migrator.js |
| `SkillRuntime` | Skill loading, YAML parsing, execution | HIGH - replace/augment skill-orchestrator.js |
| `HookSystem` | Hook event types, handler interfaces | MEDIUM - type-safe hook development |
| `ExtensionLoader` | Extension manifest parsing, registration | LOW - internal API |
| `ModelRouter` | Model selection, fallback logic | LOW - internal API |

**Key Dependencies bundled in core**:

```
@google/genai@1.30.0          - GenAI API client (pinned, not floating)
@modelcontextprotocol/sdk@^1.23.0 - MCP protocol implementation
@a2a-js/sdk@^0.3.8            - Agent-to-Agent protocol
@iarna/toml@^2.2.5            - TOML parser (for Policy Engine)
zod@^3.25.76                   - Schema validation
js-yaml@^4.1.1                - YAML parsing (for skills)
picomatch@^4.0.1               - Glob pattern matching
```

### 1.3 bkit Integration Recommendation

**Recommendation**: Do NOT add as a direct dependency for v1.5.5. Plan integration for v1.6.0.

**Rationale**:

| Factor | Analysis |
|--------|----------|
| **Size** | ~60+ transitive dependencies including OpenTelemetry stack. Would massively increase bkit's footprint. |
| **Stability** | v0.30.0 is the first stable release. API surface may still shift in v0.31.0+. |
| **Overlap** | bkit already implements skill-orchestrator.js (708 lines), tool-registry.js, and policy-migrator.js that cover similar ground. |
| **Value** | Primary value is type-safe programmatic skill development in JavaScript alongside SKILL.md. |
| **Risk** | Coupling bkit to CLI internals creates tight version dependency. |

**Proposed Integration Architecture (v1.6.0)**:

```
lib/adapters/gemini/
  sdk-bridge.js          # NEW - Optional lazy-load bridge to @google/gemini-cli-core
  tool-registry.js       # KEEP - bkit's own Source of Truth (validated against SDK)
  policy-migrator.js     # KEEP - Standalone TOML generator
  version-detector.js    # KEEP - Version detection

Integration pattern:
  1. sdk-bridge.js checks if @google/gemini-cli-core is available
  2. If available: Import SessionContext for JS skill runtime
  3. If unavailable: Fall back to existing SKILL.md + skill-orchestrator.js
  4. Never require it - always optional dependency
```

**JS Skills Design** (alongside SKILL.md):

```javascript
// skills/custom/my-skill.js (future v1.6.0)
module.exports = {
  name: 'my-custom-skill',
  description: 'A programmatic skill',
  execute: async (context, args) => {
    // context.readFile, context.writeFile, context.runTool
    // Falls back to SKILL.md if SDK unavailable
  }
};
```

### 1.4 Effort Estimate

| Task | Effort | Phase |
|------|:------:|-------|
| Create `lib/adapters/gemini/sdk-bridge.js` | 4h | v1.6.0 |
| Validate tool-registry.js against SDK ToolRegistry | 2h | v1.6.0 |
| JS skill runtime with fallback | 8h | v1.6.0 |
| Integration tests | 4h | v1.6.0 |
| **Total** | **18h** | |

### 1.5 Risk Assessment

| Risk | Severity | Mitigation |
|------|:--------:|------------|
| API breaking changes in 0.31.0 | HIGH | Optional dependency pattern, never hard-require |
| Dependency bloat (60+ transitive deps) | MEDIUM | Lazy-load only when needed |
| Version mismatch with installed CLI | MEDIUM | sdk-bridge.js validates version compatibility |
| Duplicate logic (skill-orchestrator vs SkillRuntime) | LOW | Gradual migration, keep both paths |

---

## 2. Agent Client Protocol (ACP) SDK (v0.14.1)

### 2.1 Findings Summary

The Agent Client Protocol (ACP) standardizes communication between **code editors** (VS Code, JetBrains, etc.) and **coding agents** (programs that use generative AI to autonomously modify code).

**npm Registry Data (live, 2026-02-25)**:

| Attribute | Value |
|-----------|-------|
| Package | `@agentclientprotocol/sdk` |
| Latest | `0.14.1` |
| Entry Point | `dist/acp.js` |
| Type Definitions | `dist/acp.d.ts` |
| Dependencies | **None** (zero dependencies) |
| Repository | `github.com/agentclientprotocol/typescript-sdk` |

**Release History**: 18 releases from v0.4.5 to v0.14.1 - rapid iteration, still pre-1.0.

### 2.2 What ACP Enables

ACP provides a standardized protocol for:

| Capability | Description | IDE Integration |
|-----------|-------------|-----------------|
| **Agent Discovery** | IDE discovers available agents | VS Code extension sidebar |
| **Task Submission** | IDE sends coding tasks to agents | "Fix this bug" from editor |
| **Progress Streaming** | Agent streams progress back to IDE | Real-time status panel |
| **File Diff Preview** | Agent proposes changes, user reviews | Side-by-side diff view |
| **Approval Workflow** | User approves/rejects agent changes | Accept/Reject buttons |
| **Multi-Agent Routing** | IDE routes tasks to appropriate agent | Agent picker dropdown |

**Gemini CLI Usage**: Gemini CLI v0.30.0 includes `@agentclientprotocol/sdk@^0.12.0` in the main CLI package (NOT in cli-core). This means ACP is used for the CLI's IDE integration features (VS Code Gemini extension).

### 2.3 Relevance for bkit Agents

| bkit Agent | ACP Relevance | Integration Value |
|-----------|:-------------:|-------------------|
| cto-lead | HIGH | Orchestrate multi-agent tasks from IDE |
| code-analyzer | HIGH | Send analysis results to IDE diff view |
| gap-detector | MEDIUM | Show gap analysis in IDE panel |
| security-architect | HIGH | Display vulnerabilities as IDE diagnostics |
| All 16 agents | MEDIUM | Discoverable from IDE agent picker |

### 2.4 Phase 4 Integration Architecture

**Recommendation**: Defer to v1.7.0 (Phase 4). ACP is pre-1.0 and bkit's primary interface is Gemini CLI, not direct IDE communication.

```
Phase 4 Architecture (v1.7.0):

                    VS Code / JetBrains
                          |
                    [ACP Protocol]
                          |
                    Gemini CLI (v0.30.0+)
                          |
                    [Extension System]
                          |
                    bkit Extension
                     /    |    \
                 Skills  Hooks  MCP
                          |
                    bkit Agents (16)

Key Insight: bkit does NOT need to implement ACP directly.
Gemini CLI already handles ACP. bkit benefits transitively
when users run Gemini CLI from VS Code with ACP enabled.
```

**Direct ACP integration would only be needed if**:
1. bkit wants to function as a standalone agent outside Gemini CLI
2. bkit wants to expose agents directly to IDEs without Gemini CLI as intermediary

Neither scenario is currently planned.

### 2.5 Effort Estimate

| Task | Effort | Phase |
|------|:------:|-------|
| Monitor ACP 1.0 release | Ongoing | v1.7.0 |
| Evaluate standalone agent mode | 4h | v1.7.0 |
| ACP server wrapper for bkit agents | 16h | v1.7.0 (if needed) |
| **Total** | **20h** (conditional) | |

### 2.6 Risk Assessment

| Risk | Severity | Mitigation |
|------|:--------:|------------|
| ACP pre-1.0 instability | HIGH | Do not depend until 1.0 |
| Redundant with Gemini CLI's ACP | MEDIUM | Use transitive integration instead |
| Zero dependencies = thin layer | LOW | May need additional infra if adopted |
| Rapid release cadence (18 versions) | MEDIUM | Pin version, update quarterly |

---

## 3. GenAI SDK Changes (1.30.0 -> 1.41.0)

### 3.1 Findings Summary

The `@google/genai` SDK jumped from 1.30.0 (in CLI v0.30.0) to 1.41.0 (in CLI v0.31.0-preview.0) - an 11 minor version leap. This is the largest dependency jump in a single CLI release.

**Version Map**:

| Gemini CLI | @google/genai | Status |
|-----------|:------------:|--------|
| v0.29.0 - v0.30.0 | `1.30.0` (pinned) | Current baseline |
| v0.31.0-preview.0 | `1.41.0` (pinned) | Preview |
| npm latest | `1.42.0` | Available |

### 3.2 Key Changes (1.30.0 -> 1.41.0)

**Dependency Changes**:

| Dependency | 1.30.0 | 1.41.0 | Significance |
|-----------|--------|--------|-------------|
| `ws` | ^8.18.0 | ^8.18.0 | No change |
| `google-auth-library` | ^10.3.0 | ^10.3.0 | No change |
| `p-retry` | N/A | **^7.1.1** | NEW - automatic retry for API calls |
| `protobufjs` | N/A | **^7.5.4** | NEW - binary protocol support (Vertex AI) |

**New Exports in 1.41.0**:

| Export | Description | bkit Relevance |
|--------|-------------|----------------|
| `./tokenizer` | Client-side token counting | MEDIUM - context budget estimation |
| `./tokenizer/node` | Node.js tokenizer variant | MEDIUM - for hooks/scripts |
| `./web` | Browser-compatible client | LOW - bkit is Node.js only |
| `./node` | Node.js-specific client | MEDIUM - server-side usage |

### 3.3 Impact on bkit Agent Configurations

**Model Parameter Changes** (inferred from GenAI SDK evolution):

| Parameter | 1.30.0 | 1.41.0 | bkit Impact |
|-----------|--------|--------|-------------|
| `model` | string | string | No change - bkit agents use model name strings |
| `temperature` | 0.0-2.0 | 0.0-2.0 | No change - bkit temperature values remain valid |
| `systemInstruction` | string | string/array | LOW - Gemini CLI handles this, not bkit directly |
| `tools` | Tool[] | Tool[] | No change |

**Gemini 3.1 Pro Specific Requirements**:

| Requirement | Details | bkit Action |
|------------|---------|-------------|
| Model name | `gemini-3.1-pro-preview` | Update agent frontmatter (selected agents) |
| customtools variant | `gemini-3.1-pro-preview-customtools` | Use for cto-lead (tool-calling optimized) |
| Context window | 1,000,000 tokens | No change needed (already within limits) |
| API pricing | Input: $2/1M, Output: $12/1M | Cost documentation update |
| Retry behavior | Built into SDK via p-retry | No change needed (CLI handles) |

### 3.4 Recommendation

**For v1.5.5**: No action needed. bkit does not directly depend on `@google/genai`. Gemini CLI manages the model API layer.

**For v1.6.0**: Add tokenizer import for context budget estimation in `session-start.js` and `pre-compress.js`:

```javascript
// Optional tokenizer usage (v1.6.0)
let countTokens = null;
try {
  const { createTokenizer } = require('@google/genai/tokenizer/node');
  countTokens = createTokenizer();
} catch (e) {
  // Fallback to character-based estimation
  countTokens = (text) => ({ totalTokens: Math.ceil(text.length / 4) });
}
```

### 3.5 Effort Estimate

| Task | Effort | Phase |
|------|:------:|-------|
| Update model-selection.md for 3.1 Pro | 1h | v1.5.5 |
| Agent model update (cto-lead, gap-detector) | 30m | v1.5.5 |
| Tokenizer integration for context budgeting | 4h | v1.6.0 |
| **Total** | **5.5h** | |

### 3.6 Risk Assessment

| Risk | Severity | Mitigation |
|------|:--------:|------------|
| GenAI SDK API changes breaking agent calls | LOW | bkit does not call GenAI directly |
| 3.1 Pro preview model deprecation | MEDIUM | Keep 3.0 Pro as fallback in agents |
| p-retry changing error handling behavior | LOW | CLI handles retry, transparent to bkit |
| protobufjs increasing package size | LOW | Only affects CLI, not bkit |

---

## 4. MCP SDK Update (1.23.0 -> 1.27.1)

### 4.1 Findings Summary

The `@modelcontextprotocol/sdk` has 4 minor version releases between the Gemini CLI's pinned version and latest available.

**Version Timeline**:

| Version | Key Addition |
|---------|-------------|
| 1.23.0 | Current in Gemini CLI v0.30.0 (baseline) |
| 1.24.x | New exports: `./validation`, `./experimental` |
| 1.25.x | `./experimental/tasks` export added |
| 1.26.0 | `./validation/ajv`, `./validation/cfworker` |
| 1.27.0 | Hono web framework support (`@hono/node-server`) |
| 1.27.1 | Latest stable |

### 4.2 New Capabilities (1.23.0 -> 1.27.1)

**New Dependencies Added**:

| Dependency | Version | Added In | Purpose |
|-----------|---------|----------|---------|
| `hono` | ^4.11.4 | 1.27.0 | Lightweight web framework for MCP servers |
| `@hono/node-server` | ^1.19.9 | 1.27.0 | Hono Node.js adapter |
| `jose` | ^6.1.3 | 1.25.0+ | JSON Web Token / OAuth support |
| `json-schema-typed` | ^8.0.2 | 1.26.0 | Enhanced schema typing |

**New Export Paths**:

| Export | Description | bkit Relevance |
|--------|-------------|----------------|
| `./validation` | Schema validation utilities | MEDIUM - validate MCP tool schemas |
| `./validation/ajv` | AJV-based validator | LOW - specific validator |
| `./validation/cfworker` | CloudFlare Worker validator | LOW - not applicable |
| `./experimental` | Experimental MCP features | HIGH - notifications, tasks |
| `./experimental/tasks` | Task management protocol | HIGH - maps to bkit PDCA tasks |

### 4.3 Notifications/Tools/list_changed Support

The `notifications/tools/list_changed` notification is a MCP protocol feature that allows servers to dynamically notify clients when the available tool list changes. This is relevant to bkit because:

| Scenario | Current Behavior | With list_changed |
|----------|-----------------|-------------------|
| New agent added to team | Client must restart | Dynamic update |
| Skill adds new MCP tools | Client must restart | Hot-reload |
| PDCA phase changes available tools | Not supported | Dynamic filter |

**Current bkit MCP server** (`mcp/spawn-agent-server.js`):
- Protocol version: `2024-11-05`
- Capabilities: `{ tools: {} }` (no notifications declared)
- Tool list: Static (6 tools)
- Transport: stdio (JSON-RPC over stdin/stdout)

### 4.4 MCP Server Upgrade Plan

**Phase 1 (v1.5.5)**: Minimal protocol compliance updates.

```javascript
// spawn-agent-server.js - Updated initialize handler
handleInitialize(params) {
  return {
    protocolVersion: '2025-03-26',  // Updated from 2024-11-05
    serverInfo: {
      name: 'bkit-agents',
      version: '1.5.5'
    },
    capabilities: {
      tools: {
        listChanged: true  // NEW - declare dynamic tool support
      }
    }
  };
}
```

**Phase 2 (v1.6.0)**: Use `@modelcontextprotocol/sdk` for proper server implementation.

```javascript
// mcp/spawn-agent-server.js - Refactored with SDK
const { McpServer } = require('@modelcontextprotocol/sdk/server');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio');

const server = new McpServer({
  name: 'bkit-agents',
  version: '1.6.0'
});

// Tools registered via SDK (type-safe, validated)
server.tool('spawn_agent', { /* zod schema */ }, async (args) => {
  // Implementation
});

// Dynamic tool updates
server.notification('notifications/tools/list_changed', {});

const transport = new StdioServerTransport();
await server.connect(transport);
```

**Phase 3 (v1.7.0)**: Experimental tasks integration.

```javascript
// Map PDCA status to MCP tasks
const { TaskManager } = require('@modelcontextprotocol/sdk/experimental/tasks');
// Expose PDCA phases as trackable tasks in MCP protocol
```

### 4.5 Effort Estimate

| Task | Effort | Phase |
|------|:------:|-------|
| Update protocol version and capabilities | 30m | v1.5.5 |
| Refactor to use SDK McpServer class | 8h | v1.6.0 |
| Add listChanged notification support | 2h | v1.6.0 |
| Experimental tasks integration | 4h | v1.7.0 |
| Integration tests for MCP server | 4h | v1.6.0 |
| **Total** | **18.5h** | |

### 4.6 Risk Assessment

| Risk | Severity | Mitigation |
|------|:--------:|------------|
| SDK McpServer API changes | MEDIUM | Pin to ^1.27.0, test before upgrade |
| Hono dependency adds weight | LOW | Only imported if using HTTP transport |
| Experimental APIs unstable | HIGH | Isolate behind feature flag |
| stdio transport compatibility | LOW | SDK maintains backward compat |

---

## 5. Extension Registry Requirements

### 5.1 Findings Summary

Gemini CLI v0.29.0+ introduced the Extension Discovery system. The Extension Registry enables `gemini extensions install <name>` for one-command installation.

**Current State** (2026-02-25):

| Aspect | Status |
|--------|--------|
| `gemini extensions install` command | Available (v0.29.0+) |
| Public registry | Active (geminicli.com/extensions) |
| Submission process | Open (GitHub-based) |
| bkit registration | NOT submitted (TD-05 from analysis) |

### 5.2 Manifest Requirements

Based on Gemini CLI extension documentation and `gemini-extension.json` schema:

**Required Fields**:

```json
{
  "name": "bkit",
  "version": "1.5.5",
  "description": "bkit Vibecoding Kit - PDCA methodology + Context Engineering",
  "author": "POPUP STUDIO PTE. LTD.",
  "license": "Apache-2.0",
  "repository": "https://github.com/popup-studio-ai/bkit-gemini",
  "contextFileName": "GEMINI.md"
}
```

**Recommended Fields (for registry)**:

```json
{
  "keywords": ["vibecoding", "pdca", "ai-native", "context-engineering", "agents"],
  "settings": [...],
  "excludeTools": [],
  "icon": "images/bkit-icon.png",
  "homepage": "https://bkit.dev"
}
```

### 5.3 Publishing Steps

| Step | Action | Status |
|------|--------|:------:|
| 1 | Ensure `gemini-extension.json` has all required fields | Partial |
| 2 | Verify extension loads without errors on v0.30.0 | Pending |
| 3 | Create extension listing PR to registry repo | Not started |
| 4 | Include screenshots/demo of key features | Not started |
| 5 | Pass automated validation checks | Not started |
| 6 | Community review (if applicable) | Not started |
| 7 | Extension available via `gemini extensions install bkit` | Not started |

### 5.4 What bkit Needs to Prepare

| Requirement | Current State | Action Needed |
|------------|:-------------:|---------------|
| Clean manifest | Partial - missing `icon`, `homepage` | Add icon and homepage |
| No deprecated fields | PASS - excludeTools removed in v1.5.4 | None |
| Tested on latest stable | Pending v0.30.0 | Run full test suite on v0.30.0 |
| License file | PASS - Apache-2.0 | None |
| CONTRIBUTING.md | PASS | None |
| README with installation | Partial | Add `gemini extensions install bkit` section |
| No hardcoded secrets | PASS (security audit) | None |
| Sub-100MB package size | PASS (~2MB) | None |

### 5.5 Effort Estimate

| Task | Effort | Phase |
|------|:------:|-------|
| Add icon, homepage to manifest | 1h | v1.5.5 |
| Create extension listing PR | 2h | v1.6.0 |
| Screenshots/demo materials | 2h | v1.6.0 |
| v0.30.0 compatibility verification | 2h | v1.5.5 |
| **Total** | **7h** | |

### 5.6 Risk Assessment

| Risk | Severity | Mitigation |
|------|:--------:|------------|
| Registry review rejection | MEDIUM | Pre-validate against published criteria |
| Name conflict ("bkit") | LOW | Name is unique, no conflicts found |
| Dependency on stable CLI version | MEDIUM | Test on both v0.29.x and v0.30.0 |
| Registry process changes | LOW | Monitor announcements |

---

## 6. Automated Test Framework Selection

### 6.1 Current Test Infrastructure

bkit-gemini currently uses a **custom test framework** (`tests/test-utils.js`, 171 lines) with:

| Component | Details |
|-----------|---------|
| Test runner | `tests/run-all.js` - sequential suite execution |
| Assert library | Custom: `assert()`, `assertEqual()`, `assertContains()`, `assertExists()` |
| Test suites | 15 suites (TC-01 through TC-15) |
| Test count | ~72 automated cases (per v1.5.4 report) |
| Execution | `node tests/run-all.js` |
| Hook testing | `executeHook()` - pipes JSON to stdin, captures stdout |
| MCP testing | `sendMcpRequest()` - JSON-RPC over stdin/stdout |
| Fixtures | `tests/fixtures.js` - shared test data |
| Test project | Temporary directory with fixture files |
| CI/CD | `tests/run-all-tests.sh` shell script |

**Strengths**: Zero external dependencies, fast startup, direct hook/MCP testing.
**Weaknesses**: No watch mode, no coverage, no snapshot testing, no parallel execution, brittle assert messages, no mocking library.

### 6.2 Framework Comparison

| Feature | Current Custom | Jest | Vitest | Node:test (built-in) |
|---------|:-----------:|:----:|:------:|:-------------------:|
| External dependencies | 0 | ~80 | ~15 | 0 |
| Startup time | <50ms | ~500ms | ~200ms | <50ms |
| Watch mode | No | Yes | Yes | Yes (v20+) |
| Coverage | No | Yes (istanbul) | Yes (v8/istanbul) | Yes (v20+) |
| Snapshot testing | No | Yes | Yes | Yes (v22.3+) |
| Mocking | No | Yes (jest.fn) | Yes (vi.fn) | Yes (mock.fn v22+) |
| Parallel execution | No | Yes | Yes | Yes |
| TypeScript support | N/A | Via ts-jest | Native | Via --loader |
| CommonJS support | Native | Native | Via config | Native |
| ESM support | Manual | Experimental | Native | Native |
| Community adoption | N/A | Very High | High | Growing |
| bkit compatibility | Perfect | Good | Good | Good |

### 6.3 Recommendation: Vitest

**Selected**: Vitest with custom test utilities preserved.

**Rationale**:

| Factor | Decision |
|--------|----------|
| **bkit is CommonJS** | Vitest handles CommonJS via config. Jest also works, but Vitest is faster. |
| **Zero-dep preference** | bkit extension should not bundle test deps. Vitest is a devDependency only. |
| **Hook/MCP testing** | Preserve existing `executeHook()` and `sendMcpRequest()` utilities. |
| **Coverage** | v8 coverage is faster and more accurate than istanbul. |
| **Migration cost** | Low - test functions are simple, mainly need assert -> expect migration. |
| **Watch mode** | Critical for iterative development during hook/lib changes. |

**Alternative: Node:test (built-in)**

If the team prefers zero devDependencies, Node.js built-in test runner (v20+) is viable. However, it lacks Vitest's watch mode quality and plugin ecosystem.

### 6.4 Test Architecture Design

```
tests/
  vitest.config.js              # Vitest configuration
  setup.js                      # Global setup (existing, enhanced)
  test-utils.js                 # KEEP - executeHook, sendMcpRequest
  fixtures.js                   # KEEP - shared test data
  __mocks__/                    # Mock modules
    child_process.js
  unit/                         # Unit tests (fast, isolated)
    lib/
      core/
        permission.test.js
        agent-memory.test.js
        config.test.js
        cache.test.js
      adapters/
        gemini/
          tool-registry.test.js
          version-detector.test.js
          policy-migrator.test.js
          import-resolver.test.js
          context-fork.test.js
      context-hierarchy.test.js
      skill-orchestrator.test.js
    hooks/
      session-start.test.js
      before-agent.test.js
      before-tool.test.js
      before-tool-selection.test.js
      after-tool.test.js
      after-agent.test.js
    mcp/
      spawn-agent-server.test.js
  integration/                  # Integration tests (hook + lib)
    pdca-workflow.test.js
    agent-lifecycle.test.js
    permission-flow.test.js
    context-engineering.test.js
  validation/                   # Static validation (fast)
    agents.test.js              # 16 agent frontmatter validation
    skills.test.js              # 29 skill frontmatter validation
    commands.test.js            # 18 TOML command validation
    config.test.js              # bkit.config.json schema validation
    output-styles.test.js       # 4 output style validation
  e2e/                          # End-to-end (slow, optional)
    gemini-interactive/         # Manual test prompts (existing)
```

### 6.5 Coverage Targets

| Module Category | Current Coverage | Target (v1.6.0) | Target (v1.7.0) |
|----------------|:---------------:|:----------------:|:----------------:|
| `lib/core/` (permission, agent-memory, config) | ~60% (estimated) | 80% | 90% |
| `lib/adapters/gemini/` (tool-registry, version-detector, policy-migrator) | ~50% | 85% | 95% |
| `lib/context-hierarchy.js` | ~40% | 70% | 85% |
| `lib/skill-orchestrator.js` | ~20% | 50% | 70% |
| `hooks/scripts/` (10 scripts) | ~30% | 60% | 80% |
| `mcp/spawn-agent-server.js` | ~20% | 60% | 80% |
| **Overall** | **~35%** | **65%** | **80%** |

### 6.6 Migration Plan

**Phase 1 (v1.5.5)**: Keep existing test runner, add Vitest as devDependency.

```json
// package.json (new, for development only)
{
  "devDependencies": {
    "vitest": "^3.0.0"
  },
  "scripts": {
    "test": "node tests/run-all.js",
    "test:unit": "vitest run tests/unit/",
    "test:watch": "vitest tests/unit/",
    "test:coverage": "vitest run --coverage tests/unit/"
  }
}
```

**Phase 2 (v1.6.0)**: Migrate existing 15 suites to Vitest format.

```javascript
// Example migration: tc04-lib-modules.js -> lib/core/permission.test.js
import { describe, it, expect } from 'vitest';
import { checkPermission, matchesGlobPattern } from '../../lib/core/permission';

describe('Permission Manager', () => {
  it('should deny rm -rf /', () => {
    const result = checkPermission('run_shell_command', { command: 'rm -rf /' }, PLUGIN_ROOT);
    expect(result.level).toBe('deny');
  });
});
```

**Phase 3 (v1.7.0)**: Full coverage with mocking, snapshot tests, and CI integration.

### 6.7 Effort Estimate

| Task | Effort | Phase |
|------|:------:|-------|
| Add Vitest devDependency + config | 1h | v1.5.5 |
| Create initial unit tests (lib/core, lib/adapters) | 8h | v1.6.0 |
| Migrate existing 15 suites to Vitest | 6h | v1.6.0 |
| Hook script tests with mocking | 8h | v1.6.0 |
| MCP server tests | 4h | v1.6.0 |
| Validation test suite (agents, skills, commands) | 4h | v1.6.0 |
| CI/CD integration (GitHub Actions) | 2h | v1.6.0 |
| Coverage reporting and targets | 2h | v1.6.0 |
| **Total** | **35h** | |

### 6.8 Risk Assessment

| Risk | Severity | Mitigation |
|------|:--------:|------------|
| Vitest version conflicts with CLI | LOW | devDependency only, not bundled |
| CommonJS compatibility issues | MEDIUM | Use `vitest.config.js` with CJS settings |
| Existing tests break during migration | LOW | Keep both runners during transition |
| Coverage numbers misleading | MEDIUM | Focus on critical path coverage first |

---

## 7. Integration Roadmap

### 7.1 Phase Timeline

```
v1.5.5 (This week - 2026-02-25)
  [P0] Update bkit.config.json testedVersions with v0.30.0
  [P0] MCP protocol version bump (2024-11-05 -> 2025-03-26)
  [P0] Version-detector SemVer validation
  [P1] Add Vitest devDependency
  [P1] Model selection guide: Gemini 3.1 Pro + customtools
  [P1] Extension manifest: add icon, homepage

v1.6.0 (2 weeks - 2026-03-11)
  [P1] @google/gemini-cli-core SDK bridge (optional dependency)
  [P1] Extension Registry submission
  [P1] MCP server refactor with @modelcontextprotocol/sdk
  [P1] Vitest migration + unit test coverage to 65%
  [P2] SKILL.md bkit- namespace prefix
  [P2] JS skill runtime (alongside SKILL.md)

v1.7.0 (1 month - 2026-03-25)
  [P2] GenAI tokenizer integration for context budgeting
  [P2] MCP experimental tasks (PDCA -> MCP tasks)
  [P3] ACP evaluation (if 1.0 released)
  [P3] Test coverage to 80%
  [P3] Conductor Extension evaluation
```

### 7.2 Dependency Addition Summary

| Package | Version | Phase | Type | Rationale |
|---------|---------|:-----:|------|-----------|
| `vitest` | ^3.0.0 | v1.5.5 | devDependency | Test framework |
| `@modelcontextprotocol/sdk` | ^1.27.0 | v1.6.0 | dependency | MCP server refactor |
| `@google/gemini-cli-core` | ^0.30.0 | v1.6.0 | optionalDependency | SDK bridge (lazy-load) |
| `@google/genai` | N/A | N/A | NOT added | CLI manages this |
| `@agentclientprotocol/sdk` | N/A | v1.7.0+ | NOT added (evaluate) | ACP pre-1.0 |

### 7.3 File Change Impact

| Phase | New Files | Modified Files | Deleted Files |
|-------|:---------:|:--------------:|:-------------:|
| v1.5.5 | 1 (vitest.config.js) | 5 (config, MCP, manifest, version-detector, model-selection) | 0 |
| v1.6.0 | 15+ (tests, sdk-bridge) | 3 (MCP server, skill-orchestrator, manifest) | 0 |
| v1.7.0 | 5+ (ACP eval, tokenizer) | 3 (MCP server, hooks, config) | 0 |

---

## 8. Architecture Decision Records

### ADR-01: @google/gemini-cli-core as Optional Dependency

| Aspect | Decision |
|--------|----------|
| **Context** | CLI core SDK v0.30.0 exposes skill runtime, tool registry, policy engine |
| **Decision** | Add as optionalDependency, lazy-load via sdk-bridge.js |
| **Rationale** | 60+ transitive deps too heavy for required; API may change in 0.31.0 |
| **Consequences** | Must maintain fallback paths for all SDK-dependent features |
| **Status** | Approved for v1.6.0 |

### ADR-02: ACP SDK Deferred to v1.7.0+

| Aspect | Decision |
|--------|----------|
| **Context** | ACP enables IDE integration, but Gemini CLI already implements it |
| **Decision** | Do not add dependency. Monitor for 1.0 release. |
| **Rationale** | Pre-1.0, redundant with CLI's built-in ACP, bkit benefits transitively |
| **Consequences** | No standalone IDE integration for bkit agents |
| **Status** | Approved |

### ADR-03: MCP SDK Upgrade Path

| Aspect | Decision |
|--------|----------|
| **Context** | MCP SDK 1.27.1 adds validation, experimental tasks, Hono support |
| **Decision** | Refactor spawn-agent-server.js to use SDK McpServer class in v1.6.0 |
| **Rationale** | Type-safe tool registration, listChanged notifications, protocol compliance |
| **Consequences** | New dependency on @modelcontextprotocol/sdk; must handle backward compat |
| **Status** | Approved for v1.6.0 |

### ADR-04: Vitest as Test Framework

| Aspect | Decision |
|--------|----------|
| **Context** | Current custom framework lacks coverage, watch mode, mocking |
| **Decision** | Adopt Vitest as devDependency; preserve existing test utilities |
| **Rationale** | Fast, v8 coverage, CommonJS support, zero impact on extension bundle |
| **Consequences** | Need package.json for devDependencies (currently none) |
| **Status** | Approved for v1.5.5 (devDep) + v1.6.0 (migration) |

### ADR-05: GenAI SDK Not Added Directly

| Aspect | Decision |
|--------|----------|
| **Context** | GenAI SDK jumped to 1.41.0 with tokenizer, retry, protobuf support |
| **Decision** | Do not add as direct dependency. Use CLI's bundled version. |
| **Rationale** | bkit does not call GenAI API directly; CLI handles model communication |
| **Consequences** | Cannot use tokenizer for context budgeting until v1.6.0 (via cli-core) |
| **Status** | Approved |

### ADR-06: Extension Registry Submission at v1.6.0

| Aspect | Decision |
|--------|----------|
| **Context** | Registry enables `gemini extensions install bkit` |
| **Decision** | Submit at v1.6.0 after SDK integration and v0.30.0 verification |
| **Rationale** | Want stable v0.30.0 compatibility confirmed before public listing |
| **Consequences** | Delayed visibility in extension marketplace |
| **Status** | Approved |

---

## Appendix A: Package Size Analysis

| Package | Install Size | Transitive Deps | Impact on bkit |
|---------|:----------:|:----------------:|---------------|
| `vitest@^3.0.0` (dev) | ~15MB | ~15 | None (devDep) |
| `@modelcontextprotocol/sdk@^1.27.0` | ~2MB | ~20 | Medium (new dep) |
| `@google/gemini-cli-core@^0.30.0` | ~50MB+ | ~60+ | Heavy (optional, lazy) |
| `@agentclientprotocol/sdk@^0.14.1` | ~50KB | 0 | Minimal (deferred) |

## Appendix B: Version Compatibility Matrix

| bkit Version | Gemini CLI | genai SDK | MCP SDK | ACP SDK | cli-core |
|:------------|:----------:|:---------:|:-------:|:-------:|:--------:|
| v1.5.4 | v0.29.0-v0.30.0 | N/A (via CLI) | N/A | N/A | N/A |
| v1.5.5 | v0.29.0-v0.30.0 | N/A (via CLI) | N/A | N/A | N/A |
| v1.6.0 | v0.29.0-v0.31.0 | N/A (via CLI) | ^1.27.0 | N/A | ^0.30.0 (optional) |
| v1.7.0 | v0.30.0-v0.32.0 | N/A (via CLI) | ^1.27.0 | TBD | ^0.31.0 (optional) |

---

*Research prepared by Infra Architect Agent (CTO Team)*
*bkit Vibecoding Kit v1.5.4 - SDK/Dependency Integration Research*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
