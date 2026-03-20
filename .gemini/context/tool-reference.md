## Tool Name Reference (v2.0.0)

bkit uses Gemini CLI native tool names (v0.29.0~v0.34.x verified):

| Tool | Purpose | Category | Since |
|------|---------|----------|-------|
| `write_file` | Create/overwrite files | File | v0.29.0 |
| `replace` | Edit existing files | File | v0.29.0 |
| `read_file` | Read file contents | File | v0.29.0 |
| `read_many_files` | Read multiple files | File | v0.29.0 |
| `run_shell_command` | Execute shell commands | Shell | v0.29.0 |
| `glob` | Find files by pattern | Search | v0.29.0 |
| `grep_search` | Search file contents | Search | v0.29.0 |
| `list_directory` | List directory contents | Search | v0.29.0 |
| `google_web_search` | Search the web | Web | v0.29.0 |
| `web_fetch` | Fetch URL content | Web | v0.29.0 |
| `activate_skill` | Load skill context | Skill | v0.29.0 |
| `write_todos` | Manage task lists | Task | v0.29.0 |
| `save_memory` | Save to long-term memory | Memory | v0.29.0 |
| `ask_user` | Ask user a question | Interaction | v0.29.0 |
| `get_internal_docs` | Get extension docs | Reference | v0.29.0 |
| `enter_plan_mode` | Enter planning mode | Planning | v0.29.0 |
| `exit_plan_mode` | Exit planning mode | Planning | v0.29.0 |
| `tracker_create_task` | Create tracker task | Task Tracker | v0.32.0 |
| `tracker_update_task` | Update tracker task | Task Tracker | v0.32.0 |
| `tracker_get_task` | Get tracker task details | Task Tracker | v0.32.0 |
| `tracker_list_tasks` | List tracker tasks | Task Tracker | v0.32.0 |
| `tracker_add_dependency` | Add task dependency | Task Tracker | v0.32.0 |
| `tracker_visualize` | Visualize task graph | Task Tracker | v0.32.0 |

## Breaking Changes

### v0.32.0 Changes

| ID | Tool | Change | Impact |
|----|------|--------|--------|
| BC-1 | `grep_search` | `glob` param renamed to `include_pattern` | Use `include_pattern` for file filtering on v0.32.0+ |
| BC-2 | `read_file` | New `start_line`/`end_line` params (1-based line numbers) | Use 1-based line numbers for offset/limit on v0.32.0+ |
| BC-3 | `replace` | New `allow_multiple` param for multi-occurrence replace | Set `allow_multiple: true` when multiple matches on v0.31.0+ |

### v0.33.0 Changes

| ID | Tool | Change | Impact |
|----|------|--------|--------|
| BC-4 | `replace` | `allow_multiple` now **required** when multiple matches exist | Omitting causes error on v0.33.0+ |
| BC-5 | Extension | New `plan.directory` field in gemini-extension.json | Optional: specify plan output directory |
| BC-6 | Extension | New `excludeTools` field for tool restriction | Optional: restrict tools by level |

### v0.34.0 Changes

| ID | Tool | Change | Impact |
|----|------|--------|--------|
| BC-7 | TOML Commands | Strict Zod schema: only `prompt` (required) + `description` (optional) at top level | `[command]` section headers and `name` fields cause validation failure |
| BC-8 | Commands | `SkillCommandLoader` adds `CommandKind.SKILL` type | Skill commands may conflict with extension commands |
| BC-9 | Commands | `SlashCommandConflictResolver` auto-renames conflicting extension commands | Extension commands prefixed with `ext-name:` on conflict |
| BC-10 | Policies | `subagent` field supported in TOML policy rules | Per-agent policy rules possible |

### Tool Usage Guide (v0.34.x)

When using tools, follow these version-aware guidelines:

- **`read_file`**: `offset`/`limit` use 1-based line numbers. Line 1 is the first line.
- **`replace`**: When `old_string` matches multiple locations, you MUST set `allow_multiple: true`.
- **`grep_search`**: Use `include_pattern` (not `glob`) for file pattern filtering.

## Tool Annotations (v2.0.0)

Tool annotations provide hints for Gemini CLI's v0.31.0+ trust model and parallel execution:

| Tool | readOnlyHint | destructiveHint | idempotentHint |
|------|:---:|:---:|:---:|
| `read_file` | true | false | true |
| `read_many_files` | true | false | true |
| `grep_search` | true | false | true |
| `glob` | true | false | true |
| `list_directory` | true | false | true |
| `google_web_search` | true | false | true |
| `web_fetch` | true | false | true |
| `ask_user` | true | false | false |
| `get_internal_docs` | true | false | true |
| `activate_skill` | false | false | false |
| `save_memory` | false | false | true |
| `write_todos` | false | false | false |
| `write_file` | false | false | true |
| `replace` | false | false | false |
| `run_shell_command` | false | true | false |
| `enter_plan_mode` | false | false | true |
| `exit_plan_mode` | false | false | true |
| `tracker_create_task` | false | false | false |
| `tracker_update_task` | false | false | false |
| `tracker_get_task` | true | false | true |
| `tracker_list_tasks` | true | false | true |
| `tracker_add_dependency` | false | false | false |
| `tracker_visualize` | true | false | true |

- **readOnlyHint**: Tool does not modify state
- **destructiveHint**: Tool may cause irreversible side effects
- **idempotentHint**: Multiple identical calls produce same result

bkit-gemini uses these annotations via `getToolAnnotations()` and `isReadOnlyTool()` in `tool-registry.js`.
