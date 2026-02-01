---
template: analysis
version: 1.2
description: PDCA Check phase document template with Clean Architecture and Convention compliance checks
variables:
  - feature: Feature name
  - date: Creation date (YYYY-MM-DD)
  - author: Author
  - project: Project name (from package.json or GEMINI.md)
  - version: Project version (from package.json)
---

# {feature} Analysis Report

> **Analysis Type**: Gap Analysis / Code Quality / Performance Analysis
>
> **Project**: {project}
> **Version**: {version}
> **Analyst**: {author}
> **Date**: {date}
> **Design Doc**: [{feature}.design.md](../02-design/features/{feature}.design.md)

### Pipeline References (for verification)

| Phase | Document | Verification Target |
|-------|----------|---------------------|
| Phase 1 | [Schema](../01-plan/schema.md) | Terminology consistency |
| Phase 2 | [Conventions](../01-plan/conventions.md) | Convention compliance |
| Phase 4 | [API Spec](../02-design/api/{feature}.md) | API implementation match |
| Phase 8 | [Review Checklist](./phase-8-review.md) | Architecture/Convention review |

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

{Purpose of conducting this analysis}

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/{feature}.design.md`
- **Implementation Path**: `src/features/{feature}/`
- **Analysis Date**: {date}

---

## 2. Gap Analysis (Design vs Implementation)

### 2.1 API Endpoints

| Design | Implementation | Status | Notes |
|--------|---------------|--------|-------|
| POST /api/{resource} | POST /api/{resource} | ✅ Match | |
| GET /api/{resource}/:id | GET /api/{resource}/:id | ✅ Match | |
| - | POST /api/{resource}/bulk | ⚠️ Missing in design | Added in impl |
| DELETE /api/{resource}/:id | - | ❌ Not implemented | Needs impl |

### 2.2 Data Model

| Field | Design Type | Impl Type | Status |
|-------|-------------|-----------|--------|
| id | string | string | ✅ |
| email | string | string | ✅ |
| createdAt | Date | Date | ✅ |
| metadata | - | object | ⚠️ Missing in design |

### 2.3 Component Structure

| Design Component | Implementation File | Status |
|------------------|---------------------|--------|
| {ComponentA} | src/components/{ComponentA}.tsx | ✅ Match |
| {ComponentB} | - | ❌ Not implemented |

### 2.4 Match Rate Summary

```
┌─────────────────────────────────────────────┐
│  Overall Match Rate: 75%                     │
├─────────────────────────────────────────────┤
│  ✅ Match:          12 items (60%)           │
│  ⚠️ Missing design:  4 items (20%)           │
│  ❌ Not implemented:  4 items (20%)           │
└─────────────────────────────────────────────┘
```

---

## 3. Code Quality Analysis

### 3.1 Complexity Analysis

| File | Function | Complexity | Status | Recommendation |
|------|----------|------------|--------|----------------|
| {service}.ts | processData | 15 | ⚠️ High | Split function |
| utils.ts | formatDate | 3 | ✅ Good | - |

### 3.2 Code Smells

| Type | File | Location | Description | Severity |
|------|------|----------|-------------|----------|
| Long function | api.ts | L45-120 | 75 lines (recommended: <50) | 🟡 |
| Duplicate code | helpers.ts | L10, L45 | Same logic repeated | 🟡 |
| Magic number | config.ts | L23 | Hardcoded number | 🟢 |

### 3.3 Security Issues

| Severity | File | Location | Issue | Recommendation |
|----------|------|----------|-------|----------------|
| 🔴 Critical | auth.ts | L42 | Hardcoded secret | Move to env var |
| 🟡 Warning | api.ts | L15 | Missing input validation | Add validation |
| 🟢 Info | - | - | - | - |

---

## 4. Performance Analysis (if applicable)

### 4.1 Response Time

| Endpoint | Measured | Target | Status |
|----------|----------|--------|--------|
| GET /api/{resource} | 150ms | 200ms | ✅ |
| POST /api/{resource} | 350ms | 200ms | ❌ |

### 4.2 Bottlenecks

| Location | Problem | Impact | Recommendation |
|----------|---------|--------|----------------|
| Repository.findAll() | N+1 query | Increased response time | Eager Loading |
| ImageProcessor | Sync processing | Blocking | Async processing |

---

## 5. Test Coverage

### 5.1 Coverage Status

| Area | Current | Target | Status |
|------|---------|--------|--------|
| Statements | 72% | 80% | ❌ |
| Branches | 65% | 75% | ❌ |
| Functions | 80% | 80% | ✅ |
| Lines | 73% | 80% | ❌ |

### 5.2 Uncovered Areas

- `src/features/{feature}/handlers/errorHandler.ts`
- `src/features/{feature}/utils/parser.ts`

---

## 6. Clean Architecture Compliance

> Reference: `docs/02-design/{feature}.design.md` Section 9 (Clean Architecture)

### 6.1 Layer Dependency Verification

| Layer | Expected Dependencies | Actual Dependencies | Status |
|-------|----------------------|---------------------|--------|
| Presentation | Application, Domain | {actual imports} | ✅/❌ |
| Application | Domain, Infrastructure | {actual imports} | ✅/❌ |
| Domain | None (independent) | {actual imports} | ✅/❌ |
| Infrastructure | Domain only | {actual imports} | ✅/❌ |

### 6.2 Dependency Violations

| File | Layer | Violation | Recommendation |
|------|-------|-----------|----------------|
| `components/UserList.tsx` | Presentation | Imports `@/lib/api` directly | Use service hook instead |
| `services/user.ts` | Application | Imports `@/components/Button` | Remove UI dependency |
| - | - | - | - |

### 6.3 Layer Assignment Verification

| Component | Designed Layer | Actual Location | Status |
|-----------|---------------|-----------------|--------|
| {ComponentA} | Presentation | `src/components/{feature}/` | ✅ |
| {ServiceA} | Application | `src/services/{feature}.ts` | ✅ |
| {TypeA} | Domain | `src/types/{feature}.ts` | ✅ |
| {ApiClient} | Infrastructure | `src/lib/api/{feature}.ts` | ✅ |

### 6.4 Architecture Score

```
┌─────────────────────────────────────────────┐
│  Architecture Compliance: 85%                │
├─────────────────────────────────────────────┤
│  ✅ Correct layer placement: 17/20 files     │
│  ⚠️ Dependency violations:   2 files         │
│  ❌ Wrong layer:              1 file         │
└─────────────────────────────────────────────┘
```

---

## 7. Convention Compliance

> Reference: `docs/01-plan/conventions.md` or Phase 2 Pipeline output

### 7.1 Naming Convention Check

| Category | Convention | Files Checked | Compliance | Violations |
|----------|-----------|:-------------:|:----------:|------------|
| Components | PascalCase | 15 | 100% | - |
| Functions | camelCase | 42 | 98% | `GetUser` → `getUser` |
| Constants | UPPER_SNAKE_CASE | 8 | 100% | - |
| Files (component) | PascalCase.tsx | 15 | 93% | `userProfile.tsx` → `UserProfile.tsx` |
| Files (utility) | camelCase.ts | 12 | 100% | - |
| Folders | kebab-case | 10 | 90% | `userProfile/` → `user-profile/` |

### 7.2 Folder Structure Check

| Expected Path | Exists | Contents Correct | Notes |
|---------------|:------:|:----------------:|-------|
| `src/components/` | ✅ | ✅ | |
| `src/features/{feature}/` | ✅ | ✅ | |
| `src/services/` | ✅ | ⚠️ | Some services in features/ |
| `src/types/` | ✅ | ✅ | |
| `src/lib/` | ✅ | ✅ | |

### 7.3 Import Order Check

- [x] External libraries first
- [x] Internal absolute imports second (`@/...`)
- [ ] Relative imports third (`./...`)
- [x] Type imports fourth (`import type`)
- [x] Styles last

**Violations Found:**
| File | Issue | Line |
|------|-------|------|
| `components/Header.tsx` | Type import before relative import | L5-6 |

### 7.4 Environment Variable Check

| Variable | Convention | Actual | Status |
|----------|-----------|--------|--------|
| API URL | `NEXT_PUBLIC_API_URL` | `NEXT_PUBLIC_API_URL` | ✅ |
| DB Host | `DB_HOST` | `DATABASE_HOST` | ⚠️ Non-standard |
| Auth Secret | `AUTH_SECRET` | `AUTH_SECRET` | ✅ |

### 7.5 Convention Score

```
┌─────────────────────────────────────────────┐
│  Convention Compliance: 92%                  │
├─────────────────────────────────────────────┤
│  Naming:          95%                        │
│  Folder Structure: 90%                       │
│  Import Order:     88%                       │
│  Env Variables:    95%                       │
└─────────────────────────────────────────────┘
```

---

## 8. Overall Score

```
┌─────────────────────────────────────────────┐
│  Overall Score: 78/100                       │
├─────────────────────────────────────────────┤
│  Design Match:        75 points              │
│  Code Quality:        70 points              │
│  Security:            65 points              │
│  Testing:             70 points              │
│  Performance:         80 points              │
│  Architecture:        85 points (New)        │
│  Convention:          92 points (New)        │
└─────────────────────────────────────────────┘
```

---

## 9. Recommended Actions

### 9.1 Immediate (within 24 hours)

| Priority | Item | File | Assignee |
|----------|------|------|----------|
| 🔴 1 | Remove hardcoded secret | auth.ts:42 | - |
| 🔴 2 | Add input validation | api.ts:15 | - |

### 9.2 Short-term (within 1 week)

| Priority | Item | File | Expected Impact |
|----------|------|------|-----------------|
| 🟡 1 | Fix N+1 query | repository.ts | 60% response time reduction |
| 🟡 2 | Split function | service.ts | Improved maintainability |

### 9.3 Long-term (backlog)

| Item | File | Notes |
|------|------|-------|
| Refactoring | utils/ | Clean up duplicate code |
| Documentation | - | Add JSDoc |

---

## 10. Design Document Updates Needed

The following items require design document updates to match implementation:

- [ ] Add POST /api/{resource}/bulk endpoint
- [ ] Add metadata field to data model
- [ ] Update error code list

---

## 11. Next Steps

- [ ] Fix Critical issues
- [ ] Update design document
- [ ] Write completion report (`{feature}.report.md`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | {date} | Initial analysis | {author} |
