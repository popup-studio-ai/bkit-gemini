---
name: phase-3-mockup
description: |
  Skill for creating mockups with UI/UX trends.
  Designs HTML/CSS/JS prototypes before implementation.

  Use proactively when user wants to validate UI/UX before coding.

  Triggers: mockup, prototype, wireframe, UI design,
  목업, 프로토타입, 와이어프레임,
  モックアップ, プロトタイプ,
  原型, 线框图,
  maqueta, prototipo,
  maquette, prototype,
  Mockup, Prototyp,
  mockup, prototipo

  Do NOT use for: production code, API development
---

# Phase 3: Mockup Creation

> Design before you code

## Purpose

Create visual prototypes to validate UI/UX before implementation.

## Deliverables

### 1. Wireframes

Low-fidelity layouts showing structure:

```
┌─────────────────────────────────┐
│ [Logo]              [Nav] [User]│
├─────────────────────────────────┤
│                                 │
│   ┌─────────┐  ┌─────────┐     │
│   │ Card 1  │  │ Card 2  │     │
│   └─────────┘  └─────────┘     │
│                                 │
│   ┌─────────┐  ┌─────────┐     │
│   │ Card 3  │  │ Card 4  │     │
│   └─────────┘  └─────────┘     │
│                                 │
└─────────────────────────────────┘
```

### 2. Component Mockups

HTML/CSS prototypes:

```html
<!-- components/mockups/card.html -->
<div class="card">
  <img src="placeholder.jpg" alt="">
  <h3>Title</h3>
  <p>Description text here</p>
  <button>Action</button>
</div>
```

### 3. User Flows

Document user journeys:

```
Home → Browse Products → View Product → Add to Cart → Checkout → Payment → Confirmation
```

## Tools

- HTML/CSS prototypes (recommended)
- Figma exports
- ASCII diagrams

## Output

Save to: `docs/02-design/mockups/`

## Next Phase

After completion: `/phase-4-api` (Dynamic/Enterprise) or `/phase-6-ui-integration` (Starter)
