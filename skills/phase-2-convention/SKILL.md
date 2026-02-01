---
name: phase-2-convention
description: |
  Skill for defining coding rules and conventions.
  Ensures consistent code style and specifies coding standards.

  Use proactively when starting a new project or when coding standards are needed.

  Triggers: convention, coding style, naming rules,
  컨벤션, 코딩 스타일, 네이밍 규칙,
  コンベンション, コーディングスタイル,
  编码风格, 命名规则,
  convención, estilo de código,
  convention, style de codage,
  Konvention, Coding-Stil,
  convenzione, stile di codice

  Do NOT use for: existing projects with established conventions

license: Apache-2.0
metadata:
  author: POPUP STUDIO
  version: "1.0.0"
  bkit-version: "1.0.0"
  agent: pipeline-guide
  next-skill: phase-3-mockup
  pdca-phase: plan
  task-template: "[Phase-2] {feature}"
---

# Phase 2: Convention Definition

> Establish coding standards and conventions

## Categories

### 1. Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Functions | camelCase | `getUserById()` |
| Constants | UPPER_SNAKE | `MAX_RETRY_COUNT` |
| Files | kebab-case | `user-service.ts` |
| CSS Classes | kebab-case | `user-card` |

### 2. File Structure

```
src/
├── components/     # UI components
├── hooks/          # Custom hooks
├── lib/            # Utilities
├── services/       # API services
├── types/          # TypeScript types
└── utils/          # Helper functions
```

### 3. Git Conventions

```
feat: Add user login
fix: Resolve password reset bug
docs: Update README
style: Format code
refactor: Extract auth service
test: Add login tests
chore: Update dependencies
```

### 4. Code Style

- Max line length: 100
- Indentation: 2 spaces
- Quotes: Single quotes
- Semicolons: Required
- Trailing commas: ES5

## Output

Save to: `docs/01-plan/conventions.md`

## Next Phase

After completion: `/phase-3-mockup`
