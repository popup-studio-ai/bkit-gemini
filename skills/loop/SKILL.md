---
name: loop
classification: W
description: |
  Run a prompt or command on a recurring interval.
  Useful for monitoring, polling, or periodic checks.

  Triggers: loop, recurring, interval, monitor, poll, cron,
  반복, 주기적, 모니터링,
  ループ, 定期的, 監視,
  循环, 定期, 监控,
  bucle, intervalo, monitorear,
  boucle, intervalle, surveiller,
  Schleife, Intervall, überwachen,
  ciclo, intervallo, monitorare

user-invocable: true
argument-hint: "[interval] [command]"
allowed-tools:
  - run_shell_command
  - read_file
  - write_file
classification: workflow
---

# Loop Skill

> Run a prompt or command on a recurring interval. Useful for monitoring, polling, or periodic checks.

## Usage

```
/loop 5m pdca status
/loop 10m analyze user-auth
/loop 1h git log --oneline -5
/loop check build status
```

## Interval Format

| Format | Meaning | Example |
|--------|---------|---------|
| `Nm` | Every N minutes | `5m` = every 5 minutes |
| `Nh` | Every N hours | `1h` = every 1 hour |
| `Ns` | Every N seconds | `30s` = every 30 seconds |
| (none) | Default 10 minutes | `/loop check status` |

If no interval is specified, the default interval is **10 minutes**.

## Safety Limits

- **Maximum iterations**: 100 (hard safety limit, non-configurable)
- **Minimum interval**: 10 seconds (prevents accidental tight loops)
- **Timeout**: Each individual command execution has a 5-minute timeout

## Stop Conditions

The loop stops automatically when any of the following occur:
1. Maximum iteration count (100) is reached
2. The user explicitly requests stop
3. The command returns a fatal error 3 times consecutively
4. A stop condition expression evaluates to true (if provided)

## Stop Condition Expressions

You can specify an optional stop condition using `--until`:

```
/loop 5m --until "matchRate >= 90" analyze user-auth
/loop 1h --until "status == deployed" check deployment
```

## Output

Each iteration outputs:
- Iteration number and timestamp
- Command output
- Time until next iteration

At completion, a summary report is displayed:
- Total iterations executed
- Total elapsed time
- Last command output
- Reason for stopping
