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

license: Apache-2.0
metadata:
  author: POPUP STUDIO
  version: "1.0.0"
  bkit-version: "1.0.0"
  argument-hint: "[path|feature]"
  agent: code-analyzer
  next-skill: null
  pdca-phase: check
  task-template: "[Review] {feature}"
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
