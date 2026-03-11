---
name: simplify
classification: W
description: |
  Review changed code for reuse, quality, and efficiency, then fix any issues found.
  Use after PDCA Check >= 90% or when code review is needed.

  Triggers: simplify, clean code, refactor, reduce complexity,
  간소화, 코드 정리, リファクタリング, コード整理,
  简化, 代码清理, simplificar, simplifier, vereinfachen, semplificare

user-invocable: true
argument-hint: ""
allowed-tools:
  - read_file
  - replace
  - glob
  - grep_search
  - run_shell_command

agents:
  analyze: code-analyzer

context: session
classification: workflow
---

# Simplify — Code Quality Review and Improvement

> Review changed code for reuse, quality, and efficiency, then fix any issues found.

## When to Use

- After PDCA Check phase reaches >= 90% match rate.
- When code review is needed before merging.
- When refactoring is requested.

## 4-Step Workflow

### Step 1: Collect Changed Files

Run `git diff --name-only` (and `git diff --cached --name-only` for staged files) to identify all recently changed files.

Filter to relevant source files only (exclude lockfiles, generated files, build artifacts).

**Output:** List of files to review.

### Step 2: Analyze Each File

For each changed file, analyze for:

| Category | What to Look For |
|----------|-----------------|
| **Duplicate code** | Repeated logic that can be extracted into shared functions |
| **Unnecessary complexity** | Nested conditionals, long functions, over-engineering |
| **Naming improvements** | Unclear variable/function names, inconsistent conventions |
| **Unused code** | Dead imports, unreachable branches, commented-out blocks |
| **Error handling** | Missing try/catch, unhandled edge cases |
| **Performance** | Unnecessary loops, redundant operations, missing caching |

**Output:** Issue table per file.

### Step 3: Apply Improvements

For each identified issue:

1. Apply the fix automatically using `replace` tool.
2. Ensure the fix does not change external behavior.
3. Preserve existing test coverage.

**Rules:**
- Do NOT change public API signatures without confirmation.
- Do NOT remove code that appears unused if it is exported.
- Keep changes minimal and focused.

### Step 4: Output Change Summary

Present a summary table of all changes made:

| File | Change Type | Before | After | Impact |
|------|------------|--------|-------|--------|
| ... | Dedup | 3 copies | 1 shared function | -20 lines |
| ... | Naming | `tmp` | `userSession` | Readability |
| ... | Dead code | Unused import | Removed | Clean |

**Final output:**
- Total files reviewed
- Total issues found
- Total issues fixed
- Lines added / removed

## References

- Use project's existing linting rules and conventions.
- Respect `.eslintrc`, `.prettierrc`, or equivalent config files.
