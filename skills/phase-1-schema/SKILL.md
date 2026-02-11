---
name: phase-1-schema
description: |
  Skill for defining terminology and data structures.
  Covers domain terminology, entities, relationships, and schema design.

  Use proactively when starting a new project or when data structures are unclear.

  Triggers: schema, terminology, data model, entity,
  스키마, 용어, 데이터 모델,
  スキーマ, 用語, データモデル,
  模式, 术语, 数据模型,
  esquema, terminología, modelo de datos,
  schéma, terminologie, modèle de données,
  Schema, Terminologie, Datenmodell,
  schema, terminologia, modello dati

  Do NOT use for: UI-only changes, deployment

# ──── NEW FIELDS (v1.5.1) ────
user-invocable: true
argument-hint: ""

allowed-tools:
  - read_file
  - write_file
  - replace
  - glob_tool
  - grep_search

imports:
  - templates/plan.template.md

agents: {}

context: session
memory: project
pdca-phase: plan
---

# Phase 1: Schema/Terminology Definition

> Define the language and data structures of your project

## Purpose

Create a shared vocabulary and data model before writing any code.

## Deliverables

### 1. Terminology Glossary

```markdown
## Terms

| Term | Definition | Example |
|------|------------|---------|
| User | A registered account | john@email.com |
| Order | A purchase transaction | ORD-123 |
| Product | An item for sale | Blue Widget |
```

### 2. Entity Definitions

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'paid' | 'shipped';
}
```

### 3. Relationship Diagram

```
User (1) ──── (N) Order (N) ──── (N) Product
              │
              └── (N) OrderItem
```

## Output

Save to: `docs/01-plan/schema.md`

## Next Phase

After completion: `/phase-2-convention` or `/pdca design {feature}`
