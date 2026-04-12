---
name: skill-status
classification: C
description: |
  Show loaded skills inventory with status, classification, and coverage information.
  Lists all skills from the skills/ directory with their activation state.

  Use proactively when user asks about available skills, loaded commands, or skill status.

  Triggers: skill-status, skill list, skills, available commands, loaded skills, show skills,
  스킬 목록, 스킬 상태, 사용 가능한 스킬, 로드된 스킬,
  スキル一覧, スキル状態, 利用可能なスキル,
  技能列表, 技能状态, 可用技能,
  lista de skills, estado de skills, habilidades disponibles,
  liste des compétences, état des compétences, compétences disponibles,
  Skill-Liste, Skill-Status, verfügbare Skills,
  lista delle skill, stato delle skill, skill disponibili

  Do NOT use for: creating skills (use /skill-create), modifying skills

# ──── NEW FIELDS (v2.0.4) ────
user-invocable: true
argument-hint: "[--verbose]"

allowed-tools:
  - read_file
  - read_many_files
  - glob
  - list_directory

imports: []

agents: {}

context: session
memory: project
pdca-phase: check
---

# Skill Status

> Show all loaded skills with classification, status, and coverage analysis

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/skill-status` | Show skill inventory summary | `/skill-status` |
| `/skill-status --verbose` | Show detailed per-skill info | `/skill-status --verbose` |

## How to Execute

### 1. Scan Skills Directory

1. List all directories under `skills/`
2. For each directory, check if `SKILL.md` or `skill.md` exists
3. If skill file exists, parse YAML frontmatter for metadata

### 2. Categorize Skills

Group skills by source:
- **bkit Core**: Skills shipped with bkit extension
- **Project-Local**: Skills added by the project team

Group skills by classification:
- **W (Workflow)**: Multi-step process skills
- **C (Command)**: Single-action skills
- **G (Guide)**: Educational/reference skills

### 3. Determine Status

For each skill:
- **Active**: Has SKILL.md with valid frontmatter
- **Empty**: Directory exists but no SKILL.md (stub)
- **Error**: SKILL.md exists but has invalid frontmatter

### 4. Coverage Analysis

Calculate coverage metrics:
- Total skill directories vs active skills
- PDCA phase coverage (plan, design, do, check, act)
- Agent integration coverage (which skills reference agents)

## Output Format

### Summary View (Default)

```markdown
## bkit Skill Inventory

### Summary
- Total: 35 skills | Active: 33 | Empty: 0 | Error: 2

### By Classification
- Workflow (W): 12 skills
- Command (C): 18 skills
- Guide (G): 5 skills

### Skills

| # | Name | Class | Phase | Status |
|---|------|-------|-------|--------|
| 1 | pdca | W | all | Active |
| 2 | code-review | C | do | Active |
| 3 | deploy | W | do | Active |
| 4 | audit | C | check | Active |
| ... | | | | |

### PDCA Coverage
- Plan: 4 skills
- Design: 3 skills
- Do: 8 skills
- Check: 6 skills
- Act: 3 skills
```

### Verbose View (`--verbose`)

Adds for each skill:
- Description (first line)
- Trigger keywords
- Allowed tools list
- Agent integrations
- Import dependencies

```markdown
### pdca (Workflow)
- **Phase**: all
- **Triggers**: pdca, plan, design, analyze...
- **Tools**: read_file, write_file, glob, grep_search, tracker_*
- **Agents**: gap-detector, pdca-iterator, report-generator
- **Imports**: 4 templates
```

## Conflict Detection

Check for potential issues:
1. **Duplicate triggers**: Two skills with the same trigger keyword
2. **Missing agents**: Skill references an agent that does not exist
3. **Circular imports**: Skill A imports B which imports A

## Integration

- Use `/skill-status` before `/skill-create` to check for conflicts
- Use `--verbose` to debug skill activation issues
- Results help identify coverage gaps in the PDCA workflow
