# Model Selection Guide

> **Version**: 1.5.6
> **Updated**: 2026-02-28
> **Author**: POPUP STUDIO

This guide provides recommendations for selecting the optimal Gemini model for different bkit agents and workflows.

---

## 1. Agent Model Recommendations

| Agent | Recommended Model | Complexity | Reason |
|-------|-------------------|------------|--------|
| cto-lead | **Gemini 3.1 Pro** (customtools) | Very High | CTO-level orchestration, multi-agent coordination, complex reasoning |
| gap-detector | **Gemini 3.1 Pro** | High | Complex analysis requiring deep reasoning, design-implementation comparison |
| design-validator | Gemini 3 Pro | High | Document analysis and validation, requires understanding of specifications |
| pdca-iterator | Gemini 3 Flash | Medium | Fast iteration cycles, code modifications based on clear patterns |
| code-analyzer | Gemini 3 Pro | High | Security analysis, architecture compliance, quality assessment |
| report-generator | **Gemini 3 Flash Lite** | Low | Template-based generation, straightforward content creation (60% cost reduction) |
| qa-monitor | **Gemini 3 Flash Lite** | Low | Log parsing and pattern detection, structured output (60% cost reduction) |
| starter-guide | Gemini 3 Flash | Medium | Quick, friendly responses, simple explanations |
| pipeline-guide | Gemini 3 Flash | Medium | Guidance and suggestions, workflow assistance |
| bkend-expert | Gemini 3 Flash | Medium | BaaS integration patterns, API usage guidance |
| enterprise-expert | Gemini 3 Pro | High | Complex architecture decisions, strategic planning |
| infra-architect | Gemini 3 Pro | High | Infrastructure design, Kubernetes/Terraform expertise |

---

## 2. Model Comparison

| Model | Speed | Cost | Best For |
|-------|:-----:|:----:|----------|
| **Gemini 3.1 Pro** | ★☆☆ | ★★★ | Most complex reasoning, tool-heavy agents (ARC-AGI-2: 77.1%) |
| Gemini 3.1 Pro (customtools) | ★☆☆ | ★★★ | MCP tool-based orchestration, prioritizes registered tools over bash |
| Gemini 3 Pro | ★★☆ | ★★☆ | Balanced performance, code analysis, design validation |
| Gemini 3 Flash | ★★★ | ★☆☆ | Fast responses, iteration, general guidance |
| Gemini 3 Flash Lite | ★★★ | ★☆☆ | Simple tasks, template generation, log parsing (60% cheaper than Flash) |

### Gemini 3.1 Pro (NEW - 2026-02-19)

| Attribute | Value |
|-----------|-------|
| Model ID | `gemini-3.1-pro-preview` |
| Customtools Variant | `gemini-3.1-pro-preview-customtools` |
| Context Window | 1,000,000 tokens |
| ARC-AGI-2 Score | 77.1% |
| Best For | Complex reasoning, tool-heavy agents (cto-lead, gap-detector) |
| Cost | Input: $2.00/1M, Output: $12.00/1M |

The `customtools` variant prioritizes registered MCP tools over bash commands,
making it ideal for bkit's tool-based agent orchestration.

---

## 3. Workflow-Based Recommendations

### 3.1 Complex Analysis Workflow

**Use Case**: Design validation, gap analysis, security audit

```bash
# Start session with Pro model
gemini --model gemini-2.5-pro

# Suitable agents:
# - gap-detector
# - design-validator
# - code-analyzer
# - enterprise-expert
# - infra-architect
```

### 3.2 Fast Iteration Workflow

**Use Case**: Bug fixes, quick improvements, routine tasks

```bash
# Start session with Flash model
gemini --model gemini-flash

# Suitable agents:
# - pdca-iterator
# - starter-guide
# - pipeline-guide
# - bkend-expert
```

### 3.3 Report Generation Workflow

**Use Case**: Documentation, summaries, QA reports

```bash
# Start session with Flash Lite model
gemini --model gemini-flash-lite

# Suitable agents:
# - report-generator
# - qa-monitor
```

### 3.4 Auto-Select (Recommended Default)

```bash
# Let Gemini CLI choose the best model
gemini --model auto
```

This is recommended for most cases as it balances cost and performance.

---

## 4. PDCA Phase Recommendations

| PDCA Phase | Recommended Model | Agents Involved |
|------------|-------------------|-----------------|
| Plan | Gemini 3 Flash | pipeline-guide, starter-guide |
| Design | Gemini 3 Pro | design-validator |
| Do | Gemini 3 Flash | pdca-iterator, bkend-expert |
| Check | **Gemini 3.1 Pro** | gap-detector, code-analyzer, qa-monitor |
| Act | Gemini 3 Flash | pdca-iterator |
| Report | **Gemini 3 Flash Lite** | report-generator |
| Team | **Gemini 3.1 Pro (customtools)** | cto-lead (orchestration) |

---

## 5. Project Level Recommendations

### 5.1 Starter Level Projects

- **Default Model**: Gemini Flash
- **Rationale**: Simple static sites don't require deep reasoning
- **Key Agents**: starter-guide, pipeline-guide

### 5.2 Dynamic Level Projects

- **Default Model**: Gemini Flash or Auto
- **Upgrade to Pro**: For API design, database modeling
- **Key Agents**: bkend-expert, gap-detector

### 5.3 Enterprise Level Projects

- **Default Model**: Gemini 2.5 Pro or Gemini 3 Pro
- **Rationale**: Complex architecture requires deep analysis
- **Key Agents**: enterprise-expert, infra-architect, code-analyzer

---

## 6. Cost Optimization Tips

### 6.1 Start with Flash, Upgrade When Needed

```bash
# Start with Flash for exploration
gemini --model gemini-flash
> "Explore the codebase"

# Upgrade to Pro for complex analysis
gemini --model gemini-2.5-pro
> "Analyze security vulnerabilities"
```

### 6.2 Use Flash Lite for Routine Tasks

- Log monitoring
- Simple report generation
- Template-based operations
- Status checks

### 6.3 Reserve Pro for High-Value Tasks

- Architecture decisions
- Security audits
- Design-implementation gap analysis
- Code quality assessment

---

## 7. Agent Metadata Convention

Each agent file includes a recommended model in its metadata:

```yaml
# agents/gap-detector.md
---
name: gap-detector
metadata:
  recommended-model: pro
  complexity: high
  estimated-tokens: 100000
---
```

**Metadata Fields**:

| Field | Description | Values |
|-------|-------------|--------|
| recommended-model | Best model for this agent | pro, flash, flash-lite |
| complexity | Task complexity level | low, medium, high |
| estimated-tokens | Typical token usage | Number |

---

## 8. CLI Reference

### Session-Level Model Selection

```bash
# Use specific model for entire session
gemini --model gemini-3.1-pro

# Available models:
# - gemini-3.1-pro                   (Most capable, highest cost - NEW)
# - gemini-3.1-pro-preview-customtools  (MCP tool-optimized - NEW)
# - gemini-3-pro                     (Previous generation)
# - gemini-3-flash                   (Fast, lower cost)
# - gemini-3-flash-lite              (Fastest, lowest cost)
# - auto                             (Let CLI decide)
```

### Environment Variable

```bash
# Set default model via environment
export GEMINI_MODEL=gemini-2.5-pro
```

---

## 9. Troubleshooting

### Model Too Slow

If responses are taking too long:
1. Switch to `gemini-flash` for the current task
2. Break complex tasks into smaller steps
3. Use specialized agents instead of general queries

### Model Not Capable Enough

If responses lack depth:
1. Upgrade to `gemini-2.5-pro` or `gemini-3-pro`
2. Provide more context in your query
3. Use appropriate specialized agent

### Cost Concerns

If API costs are too high:
1. Use `auto` mode (optimizes cost/performance)
2. Switch to `flash-lite` for routine tasks
3. Batch similar operations together

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | 2026-02-25 | Added Gemini 3.1 Pro + customtools variant, updated agent recommendations, cost optimization with Flash Lite |
| 1.0 | 2026-02-01 | Initial guide |
