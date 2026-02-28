## Tool Name Reference

bkit uses Gemini CLI native tool names (v0.29.0+ verified):

| Tool | Purpose | Example |
|------|---------|---------|
| `write_file` | Create/overwrite files | Creating new components |
| `replace` | Edit existing files | Modifying code |
| `read_file` | Read file contents | Understanding code |
| `read_many_files` | Read multiple files | Batch analysis |
| `run_shell_command` | Execute shell commands | Git, npm, docker |
| `glob` | Find files by pattern | `**/*.tsx` |
| `grep_search` | Search file contents | Finding definitions |
| `list_directory` | List directory contents | Exploring structure |
| `google_web_search` | Search the web | Finding documentation |
| `web_fetch` | Fetch URL content | Reading web pages |
| `activate_skill` | Load skill context | On-demand expertise |
| `write_todos` | Manage task lists | Task tracking |
| `save_memory` | Save to long-term memory | Cross-session persistence |
| `ask_user` | Ask user a question | Clarifying requirements |
| `get_internal_docs` | Get extension docs | Internal reference |
| `enter_plan_mode` | Enter planning mode | Structured planning (v0.29.0+) |
| `exit_plan_mode` | Exit planning mode | Plan completion (v0.29.0+) |

## Tool Alias Reference (v1.5.6)

### Forward Aliases (Future Compatibility)

These aliases are pre-mapped for potential future Gemini CLI tool renames:

| Current Name (v0.29.0) | Potential Future Name | Status |
|------------------------|----------------------|--------|
| `replace` | `edit_file` | Proposed (Issue #1391) |
| `glob` | `find_files` | Proposed (Issue #1391) |
| `grep_search` | `find_in_file` | Proposed (Issue #1391) |
| `google_web_search` | `web_search` | Proposed (Issue #1391) |
| `read_many_files` | `read_files` | Proposed (Issue #1391) |

bkit-gemini resolves both current and future names automatically via `tool-registry.js`.

## Tool Annotations (v1.5.6)

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

- **readOnlyHint**: Tool does not modify state
- **destructiveHint**: Tool may cause irreversible side effects
- **idempotentHint**: Multiple identical calls produce same result

bkit-gemini uses these annotations via `getToolAnnotations()` and `isReadOnlyTool()` in `tool-registry.js`.
