---
name: gemini-cli-learning
description: |
  Gemini CLI learning and education skill.
  Teaches users how to configure and optimize Gemini CLI settings.

  Start learning/setup with "learn" or "setup".

  Use proactively when user is new to Gemini CLI or asks about configuration.

  Triggers: learn gemini cli, gemini cli setup, GEMINI.md, hooks, commands, skills,
  how to configure, gemini cli learning,
  제미나이 CLI 배우기, 설정 방법,
  Gemini CLI学習, 設定方法,
  学习Gemini CLI, 配置方法,
  aprender gemini cli, configuración,
  apprendre gemini cli, configuration,
  Gemini CLI lernen, Konfiguration,
  imparare gemini cli, configurazione

  Do NOT use for: implementation tasks, debugging code

# ──── NEW FIELDS (v1.5.1) ────
user-invocable: true
argument-hint: "[learn|setup]"

allowed-tools:
  - read_file
  - write_file
  - glob
  - grep_search
  - google_web_search
  - web_fetch

imports: []

agents: {}

context: session
memory: user
pdca-phase: all
---

# Gemini CLI Learning

> Learn to configure and optimize Gemini CLI

## Topics

### 1. GEMINI.md Configuration

The context file that provides instructions to Gemini:

```markdown
# Project Context

## Overview
This project uses Next.js 14 with App Router.

## Coding Standards
- Use TypeScript
- Follow ESLint rules
- Use Prettier for formatting

## Architecture
[Describe your architecture here]
```

### 2. Extensions

Install and manage extensions:

```bash
# Install from GitHub
gemini extensions install username/extension-name

# List installed
gemini extensions list

# Update all
gemini extensions update
```

### 3. Hooks

Customize Gemini CLI behavior:

```json
{
  "hooks": {
    "SessionStart": [...],
    "BeforeAgent": [...],
    "BeforeTool": [...],
    "AfterTool": [...]
  }
}
```

### 4. Agent Skills

Create custom skills:

```yaml
---
name: my-skill
description: Does something useful
license: Apache-2.0
---

# My Skill

Instructions for the skill...
```

### 5. MCP Servers

Connect to external services:

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": ["run", "ghcr.io/github/github-mcp-server"]
    }
  }
}
```

## Commands

```bash
# Learn about specific topic
/gemini-cli-learning hooks

# Setup new project
/gemini-cli-learning setup

# Get help
/gemini-cli-learning help
```

## Resources

- [Gemini CLI Docs](https://geminicli.com/docs/)
- [Extensions Guide](https://geminicli.com/docs/extensions/)
- [Hooks Reference](https://geminicli.com/docs/hooks/)
