## Tool Reference (v2.0.0)

### Built-in Tools (23)
| Tool | Purpose | Category |
|------|---------|----------|
| `write_file` | Create/overwrite files | File |
| `replace` | Edit existing files | File |
| `read_file` | Read file contents | File |
| `read_many_files` | Read multiple files | File |
| `run_shell_command` | Execute shell commands | Shell |
| `glob` | Find files by pattern | Search |
| `grep_search` | Search file contents | Search |
| `list_directory` | List directory contents | Search |
| `google_web_search` | Search the web | Web |
| `web_fetch` | Fetch URL content | Web |
| `activate_skill` | Load skill context | Skill |
| `write_todos` | Manage task lists | Task |
| `save_memory` | Save to long-term memory | Memory |
| `ask_user` | Ask user a question | Interaction |
| `get_internal_docs` | Get extension docs | Reference |
| `enter_plan_mode` | Enter planning mode | Planning |
| `exit_plan_mode` | Exit planning mode | Planning |
| `tracker_create_task` | Create tracker task | Tracker |
| `tracker_update_task` | Update tracker task | Tracker |
| `tracker_get_task` | Get task details | Tracker |
| `tracker_list_tasks` | List tracker tasks | Tracker |
| `tracker_add_dependency` | Add task dependency | Tracker |
| `tracker_visualize` | Visualize task graph | Tracker |

### Usage Notes (v0.34.0)
- **`read_file`**: `start_line`/`end_line` use 1-based line numbers
- **`replace`**: `allow_multiple` required when multiple matches exist
- **`grep_search`**: Use `include_pattern` (not `glob`) for file filtering
