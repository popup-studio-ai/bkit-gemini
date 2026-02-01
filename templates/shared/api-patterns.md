# API Design Patterns

> Shared API design patterns for Skills and Agents
>
> Usage: Add to frontmatter imports in SKILL.md or Agent.md
> ```yaml
> imports:
>   - ${PLUGIN_ROOT}/templates/shared/api-patterns.md
> ```

## RESTful Endpoint Conventions

| Action | HTTP Method | Path | Example |
|--------|-------------|------|---------|
| List | GET | /resources | GET /users |
| Get one | GET | /resources/:id | GET /users/123 |
| Create | POST | /resources | POST /users |
| Update | PUT/PATCH | /resources/:id | PUT /users/123 |
| Delete | DELETE | /resources/:id | DELETE /users/123 |

## Request/Response Standards

### Request Headers

```http
Content-Type: application/json
Authorization: Bearer {token}
X-Request-ID: {uuid}
```

### Success Response

```json
{
  "success": true,
  "data": { /* response payload */ },
  "meta": {
    "timestamp": "2026-01-26T00:00:00Z",
    "requestId": "uuid"
  }
}
```

### Pagination

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 100,
    "totalPages": 5
  }
}
```

## API Documentation Pattern

```markdown
## POST /api/resource

**Description**: Create a new resource

**Request Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Resource name |

**Response** (201 Created):
| Field | Type | Description |
|-------|------|-------------|
| id | string | Created resource ID |

**Errors**:
- 400: Invalid request body
- 401: Authentication required
```

## Rate Limiting Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1706227200
```
