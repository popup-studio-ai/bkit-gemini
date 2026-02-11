---
name: bkit-templates
description: |
  PDCA document templates for consistent documentation.
  Plan, Design, Analysis, and Report templates.

  Use proactively when generating PDCA documents.

  Triggers: template, plan document, design document, analysis document, report,
  템플릿, 계획서, 설계서, 분석서, 보고서,
  テンプレート, 計画書, 設計書,
  模板, 计划书, 设计书,
  plantilla, documento de plan,
  modèle, document de plan,
  Vorlage, Plandokument,
  modello, documento di piano

  Do NOT use for: code implementation, debugging

# ──── NEW FIELDS (v1.5.1) ────
user-invocable: true
argument-hint: "[plan|design|analysis|report]"

allowed-tools:
  - read_file
  - write_file
  - glob_tool

imports: []

agents: {}

context: session
memory: project
pdca-phase: all
---

# bkit Templates

> Consistent PDCA documentation templates

## Available Templates

### Plan Template

```markdown
# {Feature} Plan Document

> Version: 1.0.0 | Created: {date} | Status: Draft

## 1. Executive Summary
Brief overview of the feature.

## 2. Goals and Objectives
- Goal 1
- Goal 2

## 3. Scope
### In Scope
- Item 1
- Item 2

### Out of Scope
- Item 1

## 4. Success Criteria
| Criterion | Metric | Target |
|-----------|--------|--------|

## 5. Timeline
| Milestone | Date | Description |
|-----------|------|-------------|

## 6. Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
```

### Design Template

```markdown
# {Feature} Design Document

> Version: 1.0.0 | Created: {date} | Status: Draft

## 1. Overview
System overview and context.

## 2. Architecture
### System Diagram
[Diagram here]

### Components
- Component 1: Description
- Component 2: Description

## 3. Data Model
### Entities
```typescript
interface Entity {
  id: string;
  // ...
}
```

## 4. API Specification
### Endpoints
| Method | Path | Description |
|--------|------|-------------|

## 5. UI Design
Reference to mockups.

## 6. Test Plan
| Test Case | Expected Result |
|-----------|-----------------|
```

### Analysis Template

```markdown
# {Feature} Gap Analysis

> Version: 1.0.0 | Created: {date}

## Match Rate: {X}%

## Gap Summary
| Category | Design | Implementation | Status |
|----------|--------|----------------|--------|

## Critical Gaps
1. Gap 1: Description

## Recommendations
1. Fix 1: Description
```

### Report Template

```markdown
# {Feature} Completion Report

> Version: 1.0.0 | Created: {date}

## Summary
Feature development completed.

## Metrics
- Match Rate: X%
- Iterations: N
- Duration: X days

## Key Achievements
1. Achievement 1

## Lessons Learned
1. Lesson 1

## Next Steps
1. Step 1
```

## Usage

Templates are automatically used when running PDCA commands:
- `/pdca plan {feature}` → Uses plan template
- `/pdca design {feature}` → Uses design template
- `/pdca analyze {feature}` → Uses analysis template
- `/pdca report {feature}` → Uses report template
