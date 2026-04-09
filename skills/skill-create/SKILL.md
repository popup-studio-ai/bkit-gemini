---
name: skill-create
classification: C
description: |
  Create new project-local skills with proper directory structure and SKILL.md template.
  Generates a ready-to-use skill that Gemini CLI can activate immediately.

  Use proactively when user wants to create a new custom skill or slash command.

  Triggers: skill-create, new skill, create skill, add skill, custom skill,
  스킬 생성, 새 스킬, 스킬 만들기, 커스텀 스킬,
  スキル作成, 新しいスキル, カスタムスキル,
  创建技能, 新技能, 自定义技能,
  crear skill, nueva habilidad, habilidad personalizada,
  créer compétence, nouvelle compétence, compétence personnalisée,
  Skill erstellen, neuer Skill, benutzerdefinierter Skill,
  creare skill, nuova competenza, competenza personalizzata

  Do NOT use for: modifying existing skills, listing skills (use /skill-status)

# ──── NEW FIELDS (v2.0.4) ────
user-invocable: true
argument-hint: "[skill-name]"

allowed-tools:
  - read_file
  - write_file
  - glob
  - list_directory

imports: []

agents: {}

context: session
memory: project
pdca-phase: plan
---

# Skill Create

> Generate new project-local skills with proper structure

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/skill-create [name]` | Create a new skill | `/skill-create api-monitor` |

## How to Execute

### 1. Validate Name

- Must be lowercase with hyphens only (`[a-z0-9-]+`)
- Must not conflict with existing skills in `skills/` directory
- Must be 2-30 characters long

### 2. Create Directory

Create `skills/{name}/` directory.

### 3. Generate SKILL.md

Write `skills/{name}/SKILL.md` with the following template:

```markdown
---
name: {name}
classification: C
description: |
  {User-provided description or placeholder}

  Triggers: {name}, {related keywords}

user-invocable: true
argument-hint: "[args]"

allowed-tools:
  - read_file
  - write_file
  - glob
  - grep_search

imports: []
agents: {}
context: session
memory: project
pdca-phase: do
---

# {Name} Skill

> {One-line description}

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/{name}` | {Main action} | `/{name} [args]` |

## How to Execute

1. {Step 1}
2. {Step 2}
3. {Step 3}

## Output Format

{Define expected output}
```

### 4. Verify Creation

- Confirm the directory exists
- Confirm SKILL.md has valid YAML frontmatter
- Show the user the created file path

### 5. Interactive Refinement

After creating the template, ask the user:
1. What should this skill do specifically?
2. What MCP tools should it use?
3. What triggers should activate it (in multiple languages)?

Then update the SKILL.md with their answers.

## Skill Classification

| Code | Type | Description |
|------|------|-------------|
| `W` | Workflow | Multi-step process (PDCA, deploy, QA) |
| `C` | Command | Single action (audit, status, create) |
| `G` | Guide | Educational/reference content |

## File Structure

```
skills/{name}/
  SKILL.md        # Required - skill definition and instructions
```

## Naming Conventions

- Use descriptive, action-oriented names: `api-monitor`, `db-migrate`, `log-analyzer`
- Avoid generic names: `helper`, `util`, `misc`
- Use hyphens to separate words, not underscores or camelCase

## Output Format

```markdown
## Skill Created: {name}

- **Path**: skills/{name}/SKILL.md
- **Classification**: C (Command)
- **Status**: Ready to use

Next steps:
1. Review and customize `skills/{name}/SKILL.md`
2. Add specific triggers for your use case
3. Test with `/{name}` command
```

## Validation Rules

1. **No duplicate names** - check `skills/` directory first
2. **Valid characters** - lowercase alphanumeric and hyphens only
3. **Valid YAML** - frontmatter must parse correctly
4. **Required fields** - name, classification, description, user-invocable
