# bkit Operations & Troubleshooting Reference

> Update / Development Mode / Security / Compatibility / Contributing. Moved from
> README.md during v2.0.7-S4 onboarding-slim sprint.
> Back to: [README](../../README.md) | [QUICKSTART](../../QUICKSTART.md)

## Updating bkit Extension

### Via CLI (Recommended)

```bash
gemini extensions install https://github.com/popup-studio-ai/bkit-gemini.git
```

This reinstalls the extension with the latest version from the repository.

### Manual Update

```bash
cd ~/.gemini/extensions/bkit && git pull origin main
```

### Verify Update

```bash
# Check extension list
/extensions list

# Verify version
/bkit
```

### Development Mode

For local development, use the `link` command to avoid reinstalling after every change:

```bash
gemini extensions link /path/to/local/bkit-gemini
```

In Gemini CLI v0.28.2+, you can use the following command to refresh agents and skills without restarting:

```bash
/agents refresh
```

---

## Security & Permissions (v0.28.2+)

Gemini CLI v0.28.2 introduces strict security warnings for extensions using hooks. When installing or activating `bkit`, you may see warnings about tool interception.

**Why bkit uses hooks:**
- **PDCA Context**: To automatically track development phases and update `.pdca-status.json`.
- **Memory Management**: To persist agent-specific context across sessions.
- **Intent Detection**: To intelligently trigger the right agents based on your prompt.

These hooks are non-interactive, performance-optimized, and essential for the Context Engineering features of bkit.

---

## Compatibility

| Requirement | Version |
|-------------|---------|
| Gemini CLI | v0.29.0+ (forward-compatible with v0.33.x Task Tracker + Extension Policies) |
| Node.js | v18+ (for hook scripts) |
| Git | Any recent version |

### Gemini CLI Feature Utilization

| Gemini CLI Feature | bkit Usage |
|-------------------|-----------|
| Agent frontmatter (model, tools, temperature, max_turns, timeout_mins) | All 21 agents |
| 10 Hook Events | All 10 events registered with matcher patterns |
| @import syntax | 7 context modules in `.gemini/context/` |
| TOML commands with `@{}`, `!{}`, `{{}}` | 24 enhanced commands |
| Agent Skills (GA since v0.26.0) | 35 skills with progressive disclosure |
| MCP servers | 6 tools via `spawn-agent-server.js` |
| Extension manifest `settings` | 2 user-configurable options |
| `${extensionPath}` variable | Used in hooks.json for portable paths |

---

## Documentation

### Component Reference

- [Development Pipeline](skills/development-pipeline/SKILL.md) -- 9-stage pipeline skill
- [Skills Reference](skills/) -- 35 domain skills
- [Agents Reference](agents/) -- 21 specialized agents
- [Changelog](CHANGELOG.md) -- Complete version history

### PDCA Documents

- [Plans](docs/01-plan/features/) -- Feature plan documents
- [Designs](docs/02-design/features/) -- Feature design documents
- [Reports](docs/04-report/) -- PDCA completion reports

---

## Relationship to bkit-claude-code

bkit-gemini is a fork of [bkit-claude-code](https://github.com/popup-studio-ai/bkit-claude-code), adapted for Gemini CLI compatibility. Key differences:

| Aspect | bkit-claude-code | bkit-gemini |
|--------|-----------------|-------------|
| Platform | Claude Code | Gemini CLI |
| Context file | CLAUDE.md | GEMINI.md |
| Tool names | Write, Edit, Read, Bash | write_file, replace, read_file, run_shell_command |
| Variables | N/A | `${extensionPath}`, `${workspacePath}` |
| Hooks | Claude Code hooks | Gemini CLI 10-event hook system |
| Commands | Slash commands | TOML commands with `@`, `!`, `{{}}` syntax |
| Skills | Native skills | Skills (GA since v0.26.0) |
| Agent format | .md with custom fields | .md with Gemini native frontmatter |

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Branch Protection

- Only `admin` team members can merge to `main`
- All changes require pull request review
- Version releases are managed through Git tags

---

## License

Copyright 2024-2026 POPUP STUDIO PTE. LTD.

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.

You must include the [NOTICE](NOTICE) file in any redistribution.

---

## Support

- **Issues**: [GitHub Issues](https://github.com/popup-studio-ai/bkit-gemini/issues)
- **Email**: contact@popupstudio.ai

---

Made with AI by [POPUP STUDIO](https://popupstudio.ai)
