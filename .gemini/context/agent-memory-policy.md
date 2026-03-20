# Agent Memory Access Control Policy (v2.0.1)

> Documents the intended access control for `.gemini/agent-memory/bkit/` files.
> Gemini CLI does not enforce file-level isolation per agent; this serves as a design spec.

## Access Tiers

| Tier | Agents | Read Own | Read Others | Write Own | Write Others |
|------|--------|----------|-------------|-----------|--------------|
| readonly | gap-detector, design-validator, code-analyzer, security-architect, qa-monitor, qa-strategist, starter-guide, pipeline-guide | Yes | No | Yes | No |
| docwrite | report-generator, product-manager, infra-architect, frontend-architect, bkend-expert, enterprise-expert | Yes | readonly agents | Yes | No |
| full | pdca-iterator, cto-lead, pm-lead | Yes | All | Yes | All |

## Notes

- This policy is informational only (not enforced at runtime)
- ACP-based enforcement planned for v2.1.0
- Each agent's memory file: `.gemini/agent-memory/bkit/{agent-name}.json`
