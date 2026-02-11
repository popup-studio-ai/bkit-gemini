---
name: phase-5-design-system
description: |
  Skill for building platform-independent design systems.
  Develops consistent component libraries for all UI frameworks.

  Use proactively when user needs consistent UI components.

  Triggers: design system, component library, design tokens,
  디자인 시스템, 컴포넌트 라이브러리,
  デザインシステム, コンポーネントライブラリ,
  设计系统, 组件库,
  sistema de diseño, biblioteca de componentes,
  système de design, bibliothèque de composants,
  Design-System, Komponentenbibliothek,
  sistema di design, libreria di componenti

  Do NOT use for: one-off UI changes, Starter level

# ──── NEW FIELDS (v1.5.1) ────
user-invocable: true
argument-hint: ""

allowed-tools:
  - read_file
  - write_file
  - replace
  - glob_tool
  - grep_search
  - web_search

imports: []

agents:
  frontend: frontend-architect

context: session
memory: project
pdca-phase: design
---

# Phase 5: Design System

> Build a consistent component library

## Components

### 1. Design Tokens

```css
:root {
  /* Colors */
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-success: #22c55e;
  --color-error: #ef4444;

  /* Typography */
  --font-sans: 'Inter', sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-4: 1rem;
  --space-8: 2rem;

  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
}
```

### 2. Base Components

```typescript
// components/ui/button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant, size, children, onClick }: ButtonProps) {
  return (
    <button
      className={cn('btn', `btn-${variant}`, `btn-${size}`)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### 3. Component Categories

- **Primitives**: Button, Input, Select, Checkbox
- **Layout**: Container, Grid, Stack, Flex
- **Navigation**: Navbar, Sidebar, Tabs, Breadcrumb
- **Feedback**: Alert, Toast, Modal, Spinner
- **Data Display**: Table, Card, List, Badge

## Tools

- shadcn/ui (recommended)
- Tailwind CSS
- Radix UI primitives

## Output

Save components to: `components/ui/`

## Next Phase

After completion: `/phase-6-ui-integration`
