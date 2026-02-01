---
name: zero-script-qa
description: |
  Zero Script QA - Testing methodology without test scripts.
  Uses structured JSON logging and real-time Docker monitoring.

  Use proactively when user needs to verify features through log analysis.

  Triggers: zero script qa, log-based testing, docker logs,
  제로 스크립트 QA, 테스트, 로그 분석,
  ゼロスクリプトQA, ログ分析,
  零脚本QA, 日志分析,
  QA sin scripts, pruebas basadas en logs,
  QA sans script, tests basés sur les logs,
  skriptloses QA, log-basiertes Testen,
  QA senza script, test basati sui log

  Do NOT use for: unit testing, projects without Docker

license: Apache-2.0
metadata:
  author: POPUP STUDIO
  version: "1.0.0"
  bkit-version: "1.0.0"
  argument-hint: "[start|monitor|report]"
  agent: qa-monitor
  next-skill: null
  pdca-phase: check
  task-template: "[QA] {feature}"
---

# Zero Script QA

> Testing methodology using structured logging instead of test scripts

## Philosophy

Instead of writing and maintaining test scripts, Zero Script QA uses:
1. **Structured JSON logging** for all operations
2. **Real-time Docker log monitoring**
3. **Pattern-based verification**

## Key Principles

### 1. Structured Logging

```typescript
// Every operation logs structured JSON
logger.info({
  event: 'user.login',
  userId: user.id,
  method: 'email',
  success: true,
  duration: 234
});
```

### 2. Log Patterns

Define expected patterns for verification:

```json
{
  "feature": "user-login",
  "patterns": [
    {"event": "user.login", "success": true},
    {"event": "session.created"},
    {"event": "audit.login"}
  ]
}
```

### 3. Real-time Monitoring

```bash
# Monitor Docker logs in real-time
docker logs -f app-container 2>&1 | grep -E '"event":'
```

## Usage

```bash
# Start QA monitoring
/zero-script-qa start

# Monitor specific feature
/zero-script-qa monitor user-login

# Generate QA report
/zero-script-qa report
```

## Benefits

| Traditional Testing | Zero Script QA |
|---------------------|----------------|
| Write test scripts | Define log patterns |
| Maintain test code | Logs are automatic |
| Flaky tests | Consistent logs |
| Separate test env | Same as production |

## Log Categories

1. **Business Events**: User actions, transactions
2. **System Events**: Startup, shutdown, errors
3. **Performance Metrics**: Response times, throughput
4. **Security Events**: Auth, access control

## Integration

Works with:
- Docker Compose
- Kubernetes
- Any JSON logging system
