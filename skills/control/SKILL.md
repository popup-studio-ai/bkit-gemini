---
name: control
classification: C
description: |
  View and change bkit automation settings. Shows current automation level,
  feature flags, trust score, and guardrail configuration.

  Use proactively when user asks about automation settings, trust level, or guardrails.

  Triggers: control, automation, settings, level, guardrail, trust,
  제어, 자동화, 설정, 레벨, 가드레일, 신뢰도,
  制御, 自動化, 設定, レベル, ガードレール,
  控制, 自动化, 设置, 级别, 护栏,
  control, automatización, configuración, nivel,
  contrôle, automatisation, paramètres, niveau,
  Kontrolle, Automatisierung, Einstellungen, Stufe,
  controllo, automazione, impostazioni, livello

  Do NOT use for: deployment (use /deploy), code changes

# ──── NEW FIELDS (v2.0.4) ────
user-invocable: true
argument-hint: "[status|level [L0-L2]]"

allowed-tools:
  - read_file
  - write_file
  - glob

imports: []

agents: {}

context: session
memory: project
pdca-phase: check
---

# Control Skill

> View and manage bkit automation levels and guardrail settings

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/control status` | Show current automation state | `/control status` |
| `/control level L0` | Set automation to manual | `/control level L0` |
| `/control level L1` | Set automation to semi-auto | `/control level L1` |
| `/control level L2` | Set automation to auto-confirm | `/control level L2` |

## Automation Levels

| Level | Name | Behavior |
|-------|------|----------|
| **L0** | Manual | Agent asks before every action. No automatic file writes. |
| **L1** | Semi-Auto | Agent executes known-safe operations. Asks for destructive actions. |
| **L2** | Auto-Confirm | Agent executes all operations. Confirms only for irreversible actions. |
| ~~L3~~ | ~~Full-Auto~~ | Not available on Gemini CLI (Extension can only deny, not allow) |
| ~~L4~~ | ~~Autonomous~~ | Not available on Gemini CLI (Extension can only deny, not allow) |

> **Note**: L3-L4 are not possible on Gemini CLI because the Extension API
> can only deny operations via hooks, it cannot proactively allow or initiate them.
> The agent must always be the initiator.

## How to Execute

### Show Status

1. Read `.bkit/config.json` for current settings
2. Display:
   - Current automation level (L0-L2)
   - Active feature flags
   - Trust score (if tracked)
   - Hook configuration summary
   - Guardrail rules in effect

### Change Level

1. Read `.bkit/config.json`
2. Validate the requested level (L0, L1, or L2 only)
3. Update the `automationLevel` field
4. Write back to `.bkit/config.json` using `write_file`
5. Confirm the change and explain what it means

## Configuration File

Settings are stored in `.bkit/config.json`:

```json
{
  "automationLevel": "L1",
  "features": {
    "auditLog": true,
    "checkpointOnDeploy": true,
    "autoIterate": false,
    "maxIterations": 5
  },
  "guardrails": {
    "denyPatterns": [".env", "credentials", "secret"],
    "maxFileSize": 10000,
    "requireCheckpoint": true
  }
}
```

## Feature Flags

| Flag | Default | Description |
|------|---------|-------------|
| `auditLog` | `true` | Enable audit trail logging |
| `checkpointOnDeploy` | `true` | Auto-create checkpoint before deploy |
| `autoIterate` | `false` | Auto-run iterate when match rate < 90% |
| `maxIterations` | `5` | Maximum PDCA iteration cycles |

## Guardrail Rules

Guardrails are enforced by Extension hooks (before-model, before-agent):

1. **File deny patterns**: Block writes to sensitive files
2. **Max file size**: Prevent accidentally large file writes
3. **Checkpoint requirement**: Require checkpoint before destructive operations
4. **Review requirement**: Require human review for production changes

## Output Format

```markdown
## bkit Control Status

| Setting | Value |
|---------|-------|
| Automation Level | L1 (Semi-Auto) |
| Audit Logging | Enabled |
| Checkpoint on Deploy | Enabled |
| Auto-Iterate | Disabled |
| Max Iterations | 5 |

### Active Guardrails
- File deny patterns: .env, credentials, secret
- Max file size: 10,000 lines
- Checkpoint required: Yes
```
