---
name: batch
classification: W
description: |
  Process multiple features or tasks in parallel.
  Batch execution of PDCA commands across features.

  Triggers: batch, parallel, bulk, multiple features,
  배치, 병렬, 대량 처리,
  バッチ, 並列, 一括処理,
  批量, 并行, 批处理,
  lote, paralelo, procesamiento masivo,
  lot, parallèle, traitement en masse,
  Stapel, parallel, Massenverarbeitung,
  batch, parallelo, elaborazione di massa

user-invocable: true
argument-hint: "[command] [features...]"
allowed-tools:
  - read_file
  - write_file
  - glob
  - grep_search
  - tracker_create_task
  - tracker_update_task
  - tracker_list_tasks
classification: workflow
---

# Batch Skill

> Process multiple features or tasks in parallel. Execute PDCA commands across multiple features in a single invocation.

## Usage

```
/batch plan user-auth payment-system notification
/batch design user-auth payment-system
/batch analyze user-auth payment-system notification search
/batch report user-auth payment-system
```

## Execution Model

1. **Parse**: Extract the command and feature list from arguments
2. **Validate**: Check that each feature has prerequisites for the requested command
3. **Execute**: Process each feature sequentially, tracking progress via Task Tracker
4. **Report**: Output a summary table showing status for each feature

## Progress Tracking

Each feature creates a Task Tracker entry:
- Task subject: `[Batch {command}] {feature}`
- Status updates as each feature completes
- Final summary shows pass/fail per feature

## Error Handling

- **Fail-forward**: If one feature fails, remaining features still execute
- **Error log**: Failed features are collected and reported at the end
- **Retry option**: Use `--retry-failed` to re-run only the failed features

```
/batch --retry-failed analyze user-auth payment-system
```

## Output Format

```
Batch Execution Summary
----------------------------------------------
Command: plan
Features: 4 total | 3 success | 1 failed
----------------------------------------------
  user-auth        [OK]   docs/01-plan/features/user-auth.plan.md
  payment-system   [OK]   docs/01-plan/features/payment-system.plan.md
  notification     [OK]   docs/01-plan/features/notification.plan.md
  search           [FAIL] Missing prerequisite: project scope undefined
----------------------------------------------
```

## Feature Discovery

If no features are specified, batch will auto-discover features from:
1. `.pdca-status.json` primary and secondary features
2. `docs/01-plan/features/*.plan.md` existing plan files
3. `docs/02-design/features/*.design.md` existing design files

```
/batch analyze          # auto-discovers all features
/batch report --all     # explicitly process all known features
```

## Combination with Other Skills

Batch works with any PDCA subcommand and can be combined with loop:

```
/loop 1h batch analyze user-auth payment-system
```
