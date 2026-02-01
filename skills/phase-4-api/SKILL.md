---
name: phase-4-api
description: |
  Skill for designing and implementing backend APIs.
  Includes Zero Script QA methodology for API validation.

  Use proactively when user needs to design or implement backend APIs.

  Triggers: API design, REST API, backend, endpoint,
  API 설계, 백엔드, 엔드포인트,
  API設計, バックエンド,
  API设计, 后端,
  diseño de API, backend,
  conception API, backend,
  API-Design, Backend,
  progettazione API, backend

  Do NOT use for: frontend-only projects, Starter level
---

# Phase 4: API Design & Implementation

> Build robust backend APIs

## Deliverables

### 1. API Specification

OpenAPI/Swagger format:

```yaml
openapi: 3.0.0
info:
  title: User API
  version: 1.0.0

paths:
  /api/users:
    get:
      summary: List users
      responses:
        '200':
          description: User list
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'

    post:
      summary: Create user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUser'
```

### 2. Endpoint Implementation

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const users = await db.user.findMany();
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await db.user.create({ data: body });
  return NextResponse.json(user, { status: 201 });
}
```

### 3. Error Handling

```typescript
// Standard error response
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      { "field": "email", "message": "Must be a valid email" }
    ]
  }
}
```

## API Patterns

- RESTful resource naming
- Consistent response format
- Proper HTTP status codes
- Input validation
- Rate limiting

## Output

Save to: `docs/02-design/api-spec.yaml`

## Next Phase

After completion: `/phase-5-design-system` or `/phase-6-ui-integration`
