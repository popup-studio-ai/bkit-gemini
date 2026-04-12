---
name: audit
classification: C
description: |
  Query audit trail logs, decision traces, and session history for AI transparency.
  Provides searchable access to all bkit audit records via MCP tools.

  Use proactively when user wants to review past decisions, trace actions, or inspect logs.

  Triggers: audit, log, decision trace, audit trail, history,
  감사, 로그, 결정 추적, 이력,
  監査, ログ, 決定追跡, 履歴,
  审计, 日志, 决策追踪, 历史,
  auditoría, registro, rastreo de decisiones,
  audit, journal, traçage des décisions,
  Audit, Protokoll, Entscheidungsverfolgung,
  audit, registro, tracciamento delle decisioni

  Do NOT use for: creating new audit entries (hooks do that automatically), modifying logs

# ──── NEW FIELDS (v2.0.4) ────
user-invocable: true
argument-hint: "[log|search|summary] [--from DATE] [--to DATE] [--type TYPE]"

allowed-tools:
  - read_file
  - read_many_files
  - glob
  - grep_search
  - list_directory
  - bkit_audit_query

imports: []

agents:
  analyze: code-analyzer

context: session
memory: project
pdca-phase: check
---

# Audit Skill

> Query and review audit trail logs for transparency and decision tracing

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/audit log` | Show recent audit entries | `/audit log` |
| `/audit search [query]` | Search audit logs by keyword | `/audit search "deploy"` |
| `/audit summary` | Summarize audit activity | `/audit summary --from 2026-04-01` |

## MCP Integration

This skill uses the `bkit_audit_query` MCP tool to retrieve audit data.

### How to Execute

1. **Show Recent Logs**
   - Call `bkit_audit_query` with action `list`
   - Display results in a table format with timestamp, type, and summary

2. **Search Logs**
   - Call `bkit_audit_query` with action `search` and the user's query
   - Filter by date range if `--from` and `--to` are provided
   - Filter by type if `--type` is provided (e.g., `decision`, `action`, `error`)

3. **Generate Summary**
   - Call `bkit_audit_query` with action `summary`
   - Aggregate entries by type and provide counts
   - Highlight key decisions and their outcomes

## Audit Entry Types

| Type | Description |
|------|-------------|
| `decision` | Agent decision points with rationale |
| `action` | File modifications, tool invocations |
| `error` | Errors encountered during execution |
| `checkpoint` | Checkpoint creation/restoration events |
| `pdca` | PDCA phase transitions |

## Output Format

```markdown
## Audit Log Report

### Period: {from} to {to}

| Timestamp | Type | Summary |
|-----------|------|---------|
| 2026-04-09 14:23 | decision | Selected gap-detector agent for verification |
| 2026-04-09 14:24 | action | Modified src/api/auth.js (lines 45-67) |

### Statistics
- Total entries: N
- Decisions: N | Actions: N | Errors: N
```

## Data Location

Audit logs are stored in `.bkit/audit/` directory:
- `.bkit/audit/sessions/` - Per-session audit trails
- `.bkit/audit/decisions/` - Decision trace records

## Integration with PDCA

Audit is part of the Check phase:
1. Use `/audit summary` to review what happened during Do phase
2. Cross-reference with `/pdca analyze` results
3. Verify all decisions align with the Design document
