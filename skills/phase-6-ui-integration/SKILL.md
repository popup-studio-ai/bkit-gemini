---
name: phase-6-ui-integration
description: |
  Skill for implementing UI and integrating with APIs.
  Covers frontend-backend integration and state management.

  Use proactively when user needs to connect frontend with backend.

  Triggers: UI implementation, API integration, state management,
  UI 구현, API 연동, 상태 관리,
  UI実装, API連携, 状態管理,
  UI实现, API集成, 状态管理,
  implementación UI, integración API,
  implémentation UI, intégration API,
  UI-Implementierung, API-Integration,
  implementazione UI, integrazione API

  Do NOT use for: mockup creation, backend-only development

# ──── NEW FIELDS (v1.5.1) ────
user-invocable: true
argument-hint: ""

allowed-tools:
  - read_file
  - write_file
  - replace
  - glob
  - grep_search
  - run_shell_command

imports: []

agents:
  frontend: frontend-architect

context: session
memory: project
pdca-phase: do
---

# Phase 6: UI Integration

> Connect your frontend to the backend

## Key Tasks

### 1. API Client Setup

```typescript
// lib/api/client.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }

  return res.json();
}
```

### 2. Data Fetching

```typescript
// Server Component
async function UserList() {
  const users = await fetchAPI<User[]>('/api/users');

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### 3. Form Handling

```typescript
// Client Component with Server Action
'use client';

export function LoginForm() {
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await loginAction(formData);
    });
  }

  return (
    <form action={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button disabled={pending}>
        {pending ? 'Loading...' : 'Login'}
      </button>
    </form>
  );
}
```

### 4. State Management

- Server State: React Query / SWR
- Client State: Zustand / Jotai
- Form State: React Hook Form

## Integration Checklist

- [ ] API client configured
- [ ] Authentication flow working
- [ ] Error boundaries added
- [ ] Loading states implemented
- [ ] Optimistic updates where needed

## Next Phase

After completion: `/phase-7-seo-security` (Dynamic/Enterprise) or `/phase-9-deployment` (Starter)
