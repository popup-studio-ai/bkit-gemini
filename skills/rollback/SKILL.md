---
name: rollback
classification: C
description: |
  Manage checkpoints and rollback for safe recovery. Create restore points
  before risky operations and restore to previous states when needed.

  Use proactively when user mentions rollback, undo, restore, checkpoint, or recovery.

  Triggers: rollback, checkpoint, restore, undo, revert, recovery, save point,
  롤백, 체크포인트, 복원, 되돌리기, 복구,
  ロールバック, チェックポイント, 復元, 元に戻す,
  回滚, 检查点, 恢复, 撤销,
  restaurar, punto de control, revertir, deshacer,
  restaurer, point de contrôle, annuler, revenir,
  Wiederherstellung, Prüfpunkt, rückgängig machen,
  ripristino, checkpoint, annullare, ripristinare

  Do NOT use for: git operations (use git directly), file editing

# ──── NEW FIELDS (v2.0.4) ────
user-invocable: true
argument-hint: "[create [label]|list|restore [id]|diff [id]]"

allowed-tools:
  - read_file
  - write_file
  - read_many_files
  - glob
  - list_directory
  - bkit_checkpoint

imports: []

agents: {}

context: session
memory: project
pdca-phase: act
---

# Rollback Skill

> Create, list, and restore checkpoints for safe recovery

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/rollback create` | Create a new checkpoint | `/rollback create "before refactor"` |
| `/rollback list` | List all checkpoints | `/rollback list` |
| `/rollback restore [id]` | Restore to a checkpoint | `/rollback restore chk-20260409-143000` |
| `/rollback diff [id]` | Show changes since checkpoint | `/rollback diff chk-20260409-143000` |

## MCP Integration

This skill uses the `bkit_checkpoint` MCP tool to manage checkpoints.

### How to Execute

#### Create Checkpoint

1. Call `bkit_checkpoint` with action `create`
2. Optionally include a label for easy identification
3. The tool snapshots the current state of tracked files
4. Returns a checkpoint ID (format: `chk-YYYYMMDD-HHMMSS`)
5. Display confirmation with the checkpoint ID

#### List Checkpoints

1. Call `bkit_checkpoint` with action `list`
2. Display checkpoints in reverse chronological order
3. Show: ID, timestamp, label, file count, size

#### Restore Checkpoint

1. Call `bkit_checkpoint` with action `restore` and the checkpoint ID
2. **Important**: Automatically create a new checkpoint before restoring (safety net)
3. Restore files to the checkpoint state
4. Display list of files changed/restored
5. Warn about any files that were added after the checkpoint (they will remain)

#### Show Diff

1. Call `bkit_checkpoint` with action `diff` and the checkpoint ID
2. Compare current state against the checkpoint
3. Show added, modified, and deleted files
4. Display line-level diff for modified files

## Checkpoint Storage

Checkpoints are stored in `.bkit/checkpoints/`:

```
.bkit/checkpoints/
  chk-20260409-143000/
    manifest.json    # List of files and their hashes
    label.txt        # Optional label
    files/           # Snapshot of tracked files
```

### Manifest Format

```json
{
  "id": "chk-20260409-143000",
  "timestamp": "2026-04-09T14:30:00Z",
  "label": "before refactor",
  "files": [
    {
      "path": "src/api/auth.js",
      "hash": "sha256:abc123...",
      "size": 2456
    }
  ],
  "totalFiles": 12,
  "totalSize": 34567
}
```

## Auto-Checkpoint Triggers

Checkpoints are automatically created by hooks in these situations:
- Before deployment (`/deploy`)
- Before PDCA iterate phase
- Before bulk file operations (10+ files)

## Output Format

```markdown
## Checkpoint Created

- **ID**: chk-20260409-143000
- **Label**: before refactor
- **Files**: 12 tracked files
- **Size**: 34.5 KB

Use `/rollback restore chk-20260409-143000` to restore.
```

## Safety Rules

1. **Always create backup** before restoring (double safety net)
2. **Never delete checkpoints** automatically - user must manage
3. **Warn on old checkpoints** - flag if restoring to a checkpoint older than 24 hours
4. **Show diff first** - recommend `/rollback diff` before `/rollback restore`
