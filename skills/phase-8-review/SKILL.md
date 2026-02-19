---
name: phase-8-review
description: |
  Skill for verifying codebase quality and gap analysis.
  Covers architecture consistency and convention compliance.

  Use proactively when implementation is complete and quality verification is needed.

  Triggers: code review, architecture review, quality check, gap analysis,
  코드 리뷰, 설계-구현 분석,
  コードレビュー, ギャップ分析,
  代码审查, 差距分析,
  revisión de código, análisis de brechas,
  revue de code, analyse des écarts,
  Code-Review, Gap-Analyse,
  revisione del codice, analisi del divario

  Do NOT use for: initial planning, design creation

# ──── NEW FIELDS (v1.5.1) ────
user-invocable: true
argument-hint: ""

allowed-tools:
  - read_file
  - read_many_files
  - glob
  - grep_search
  - list_directory

imports:
  - templates/analysis.template.md

agents:
  analyze: code-analyzer
  gaps: gap-detector

context: session
memory: project
pdca-phase: check
---

# Phase 8: Review

> Verify quality before deployment

## Review Types

### 1. Code Review

Check for:
- Code quality and readability
- Naming convention compliance
- Error handling
- Performance issues
- Security vulnerabilities

### 2. Architecture Review

Verify:
- Design document alignment
- Component structure
- API contract compliance
- Database schema match

### 3. Gap Analysis

Compare:
- Plan vs Implementation
- Design vs Code
- Expected vs Actual behavior

## Review Process

```
1. Run code analysis
   /code-review src/

2. Run gap analysis
   /pdca analyze {feature}

3. Check match rate
   - >= 90%: Ready for deployment
   - < 90%: Needs iteration

4. Iterate if needed
   /pdca iterate {feature}
```

## Checklist

### Code Quality
- [ ] No ESLint errors
- [ ] No TypeScript errors
- [ ] Tests passing
- [ ] Coverage adequate

### Architecture
- [ ] Follows design document
- [ ] API contracts match
- [ ] Data models aligned

### Security
- [ ] Input validation
- [ ] Authentication working
- [ ] No exposed secrets

## Next Phase

When match rate >= 90%: `/phase-9-deployment`
