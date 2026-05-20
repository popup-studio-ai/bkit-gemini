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
argument-hint: "[status|level [L0-L4]|stop|rollback [N]]"

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
| `/control level L3` | Set automation to full-auto (read-only) | `/control level L3` |
| `/control level L4` | Set automation to autonomous | `/control level L4` |
| `/control stop` | Emergency stop (immediate L0 + halt) | `/control stop` |
| `/control rollback` | Rollback last N decisions | `/control rollback 5` |

## Automation Levels (v2.0.7+ L3/L4 unlocked via bkit hook automation channel)

| Level | Name | Behavior |
|-------|------|----------|
| **L0** | Manual | Agent asks before every action. No automatic file writes. Emergency-stop default. |
| **L1** | Semi-Auto | Agent executes known-safe operations. Asks for destructive actions. |
| **L2** | Auto-Confirm | Agent executes all operations. Confirms only for irreversible actions. Default for new bkit projects. |
| **L3** | Full-Auto | Read-only tools (Read/Glob/Grep/list_directory/web_fetch) auto-allowed via bkit before-tool hook. Destructive ops always asked. Requires `trustScore >= 60`. |
| **L4** | Autonomous | All non-destructive tools auto-allowed. PDCA phase transitions automatic (via before-phase hook). Destructive ops always **hard-denied** (D6, 16 patterns matrix). Requires `trustScore >= 80 + no recent rejections + no active 24h cooldown`. |

### Hard Deny (영구 차단, L4 무관)

다음 16 destructive 패턴은 어떤 level에서도 항상 차단됩니다 (cmd-parser AST 분석):
`rm -rf`, `git push --force`, `drop table`, `truncate`, `delete from (no WHERE)`,
`sudo`, `chmod 777`, `/etc/* write`, `~/.ssh/* write`, `gpg --delete-key`,
`.env write`, `id_rsa* / *.pem / *.p12 write/delete`, `npm publish --force`,
`git config --unset credential.*`, `rm .git`, `drop database`.

### Auto-Downgrade (안전망)

- **5 consecutive rejections** → L4/L3 → L2 + 24h cooldown
- **Hard deny detected** (destructive op) → L4 → L3 (no cooldown)
- **Emergency stop** (Ctrl+C 2회 또는 `/control stop`) → 즉시 L0

### Gemini CLI 호환성 (v2.0.7 Wave 0 RCA로 입증)

- Non-interactive `gemini -p` 모드: `'allow'` decision suppress 정상 작동 ✓
- Interactive mode: CC issue #52822와 유사 가능성, Track B PR 검증 중
- 모든 결정은 `.bkit/state/audit/{date}/decisions.jsonl`에 영구 기록 (90d retention)

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
