---
name: code-review
description: |
  Code review skill for analyzing code quality, detecting bugs, and ensuring best practices.

  Use proactively when user requests code review, quality check, or bug detection.

  Triggers: code review, review code, check code, analyze code, bug detection,
  코드 리뷰, 코드 검토, 버그 검사,
  コードレビュー, バグ検出,
  代码审查, 代码检查,
  revisión de código, detección de errores,
  revue de code, détection de bugs,
  Code-Review, Fehlererkennung,
  revisione del codice, rilevamento bug

  Do NOT use for: design document creation, deployment tasks

# ──── NEW FIELDS (v1.5.1) ────
user-invocable: true
argument-hint: "[file-path]"

allowed-tools:
  - read_file
  - read_many_files
  - glob_tool
  - grep_search
  - list_directory

imports: []

agents:
  analyze: code-analyzer

context: session
memory: project
pdca-phase: do
---

# Code Review Skill

> Comprehensive code analysis for quality, security, and performance

## Review Categories

### 1. Code Quality
- Naming conventions
- Code structure
- DRY principles
- SOLID principles
- Complexity metrics

### 2. Security
- Input validation
- Authentication/Authorization
- SQL injection
- XSS vulnerabilities
- Sensitive data exposure

### 3. Performance
- Algorithm efficiency
- Memory usage
- Database queries
- Caching opportunities
- Bundle size

### 4. Best Practices
- Error handling
- Logging
- Testing coverage
- Documentation
- Type safety

## Usage

```bash
# Review specific file
/code-review src/components/Login.tsx

# Review entire feature
/code-review user-authentication

# Review with specific focus
/code-review security src/api/
```

## Output Format

```markdown
## Code Review Report

### Summary
- Files reviewed: N
- Issues found: N (Critical: N, Warning: N, Info: N)

### Critical Issues
- [FILE:LINE] Description

### Warnings
- [FILE:LINE] Description

### Suggestions
- [FILE:LINE] Description

### Positive Observations
- Well-structured code in X
- Good test coverage in Y
```

## Integration with PDCA

Code review is part of the Check phase:
1. Run `/code-review` after implementation
2. Address critical issues
3. Run `/pdca analyze` for gap analysis
4. Iterate until quality standards met
