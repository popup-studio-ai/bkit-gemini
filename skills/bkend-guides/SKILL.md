---
name: bkend-guides
description: |
  bkend.ai operational guides, troubleshooting, and platform comparison.
  Covers migration guides, performance optimization, testing strategy,
  common error solutions, and FAQ.

  Triggers: migration, troubleshoot, FAQ, performance, error handling, comparison,
  마이그레이션, 문제해결, 자주 묻는 질문, 성능, 에러,
  マイグレーション, トラブルシューティング, FAQ, パフォーマンス,
  迁移, 故障排除, 常见问题, 性能, 错误处理,
  migracion, solucion de problemas, preguntas frecuentes, rendimiento,
  migration, depannage, FAQ, performance, gestion des erreurs,
  Migration, Fehlerbehebung, FAQ, Leistung, Fehlerbehandlung,
  migrazione, risoluzione problemi, FAQ, prestazioni, gestione errori

  Do NOT use for: authentication implementation (use bkend-auth),
  database schema design (use bkend-data), security setup (use bkend-security)

user-invocable: true
argument-hint: ""

allowed-tools:
  - read_file
  - write_file
  - replace
  - glob
  - grep_search
  - run_shell_command
  - web_fetch

imports: []

agents:
  backend: bkend-expert

context: session
memory: project
pdca-phase: all
---

# bkend-guides

> bkend.ai operational guides, troubleshooting, and platform comparison

## 1. Platform Comparison

| Feature | bkend.ai | Firebase | Supabase |
|---------|----------|----------|----------|
| **Database** | MongoDB Atlas (NoSQL) | Firestore (NoSQL) / RTDB | PostgreSQL (SQL) |
| **Auth** | Built-in JWT + Social + MFA | Firebase Auth (full suite) | GoTrue (JWT + Social) |
| **MCP Support** | Native (first-class) | None | Community plugins |
| **Real-time** | Planned (WebSocket) | Built-in (Firestore listeners) | Built-in (Postgres changes) |
| **File Storage** | Integrated | Cloud Storage | S3-compatible |
| **Edge Functions** | Planned | Cloud Functions | Deno Edge Functions |
| **Schema** | Schemaless / flexible | Schemaless | Rigid SQL migrations |
| **Pricing** | Usage-based (API calls) | Spark (free) / Blaze (pay-as-you-go) | Free tier + Pro ($25/mo) |
| **Open Source** | No | No | Yes |
| **AI Integration** | Native MCP + prompt workflows | Vertex AI extensions | pgvector + AI plugins |
| **Best For** | AI-assisted rapid prototyping | Mobile-first apps, Google ecosystem | SQL-heavy apps, open source |

### When to Choose bkend.ai

- You want **AI-assisted development** with Gemini CLI, Claude Code, or Cursor via MCP
- You prefer **schemaless / flexible data models** without migration headaches
- You need **rapid prototyping** with minimal configuration
- Your team is comfortable with **REST APIs** and does not need GraphQL

### When to Choose Alternatives

- **Firebase**: You need mature real-time capabilities, deep Google Cloud integration, or are building primarily for mobile within the Google ecosystem
- **Supabase**: You need SQL, full-text search, row-level security with PostgreSQL policies, or prefer an open-source solution

---

## 2. Migration Guides

### 2.1 From Firebase (Planned)

> This migration guide is under development. Key considerations:

- **Firestore to bkend.ai**: Export Firestore collections as JSON, then import into bkend tables via the REST API or MCP tools
- **Firebase Auth to bkend Auth**: Re-register users with email/password or social providers; there is no automatic migration path for password hashes
- **Cloud Functions to bkend**: Rewrite triggers as webhook handlers (webhooks are planned)
- **Cloud Storage to bkend Storage**: Re-upload files using the bkend storage API

### 2.2 From Supabase (Planned)

> This migration guide is under development. Key considerations:

- **PostgreSQL to bkend.ai**: Export tables as JSON; flatten relational data into document-style schemas
- **Supabase Auth to bkend Auth**: Re-register users; JWT tokens are not transferable
- **Edge Functions to bkend**: Rewrite as API route handlers in your frontend framework
- **Supabase Storage to bkend Storage**: Re-upload files using the bkend storage API
- **RLS Policies**: Translate PostgreSQL RLS policies to bkend RBAC rules (admin/user/self/guest)

---

## 3. Performance Optimization

### 3.1 Use Indexes on Frequently Queried Fields

Create indexes on fields that appear in `filter` and `sort` parameters. Common candidates:

- `authorId` -- for user-scoped queries
- `status` -- for filtering by state
- `createdAt` -- for chronological sorting
- `email` -- for user lookups

Use the bkend Console or MCP tool to create indexes:

```
> Create an index on the "posts" table for the "authorId" field
> Create a compound index on "posts" for "status" and "createdAt"
```

### 3.2 Limit Query Results

Always set a `limit` parameter. The maximum allowed value is **100 records per request**.

```
GET /v1/data/posts?limit=20
```

If no limit is specified, the default is 20. Never rely on fetching all records at once.

### 3.3 Use Cursor Pagination (Not Offset)

Offset-based pagination (`skip`) degrades performance on large datasets because the database must scan and discard skipped records.

**Avoid (offset pagination):**
```
GET /v1/data/posts?skip=1000&limit=20
```

**Prefer (cursor pagination):**
```
GET /v1/data/posts?cursor=<last-record-id>&limit=20
```

Cursor pagination is O(1) regardless of page depth.

### 3.4 Cache with TanStack Query

Configure appropriate `staleTime` and `gcTime` for your data:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 minutes before refetch
      gcTime: 30 * 60 * 1000,      // 30 minutes in cache
      retry: 2,                     // Retry failed requests twice
      refetchOnWindowFocus: false,  // Disable auto-refetch on focus
    },
  },
});
```

For frequently changing data (like feeds), use shorter `staleTime`:

```typescript
useQuery({
  queryKey: ["feed"],
  queryFn: fetchFeed,
  staleTime: 30 * 1000, // 30 seconds
});
```

### 3.5 Denormalize Frequently Joined Data

bkend.ai uses MongoDB (NoSQL), so joins are not native. Instead of querying multiple tables:

**Avoid:**
```
// 1. Fetch post
// 2. Fetch author by post.authorId
// 3. Fetch comments by post._id
// 4. Fetch each comment's author
```

**Prefer: Embed frequently accessed data at write time:**
```json
{
  "title": "My Post",
  "content": "...",
  "author": {
    "id": "user_123",
    "name": "Alice",
    "avatar": "https://..."
  },
  "commentsCount": 5,
  "likesCount": 12
}
```

Update embedded data when the source changes (e.g., when a user updates their name).

---

## 4. Testing Strategy

### 4.1 Unit Tests: Business Logic with Mock bkendFetch

Test business logic in isolation by mocking the API client.

```typescript
// __tests__/services/order-state-machine.test.ts
import { canTransition } from "@/application/services/order-state-machine";

describe("Order State Machine", () => {
  it("allows draft -> pending", () => {
    expect(canTransition("draft", "pending")).toBe(true);
  });

  it("blocks draft -> shipped", () => {
    expect(canTransition("draft", "shipped")).toBe(false);
  });

  it("allows paid -> cancelled", () => {
    expect(canTransition("paid", "cancelled")).toBe(true);
  });

  it("blocks completed -> any", () => {
    expect(canTransition("completed", "pending")).toBe(false);
    expect(canTransition("completed", "cancelled")).toBe(false);
  });
});
```

### 4.2 Integration Tests: API Calls with Dev Environment

Test actual API interactions against the `dev` environment.

```typescript
// __tests__/integration/posts-api.test.ts
import { bkendFetch } from "@/infrastructure/api/client";

describe("Posts API", () => {
  let postId: string;

  it("creates a post", async () => {
    const res = await bkendFetch("/v1/data/posts", {
      method: "POST",
      body: JSON.stringify({
        title: "Test Post",
        content: "Integration test content",
        authorId: "test_user_id",
        status: "draft",
      }),
    });
    expect(res.success).toBe(true);
    postId = res.data._id;
  });

  it("reads the created post", async () => {
    const res = await bkendFetch(`/v1/data/posts/${postId}`);
    expect(res.data.title).toBe("Test Post");
  });

  afterAll(async () => {
    if (postId) {
      await bkendFetch(`/v1/data/posts/${postId}`, { method: "DELETE" });
    }
  });
});
```

### 4.3 E2E Tests: Full Flow with Test Data

Test complete user flows from login to feature completion.

```typescript
// e2e/blog-post-flow.spec.ts (Playwright)
import { test, expect } from "@playwright/test";

test("create and publish a blog post", async ({ page }) => {
  // Login
  await page.goto("/login");
  await page.fill('[name="email"]', "test@example.com");
  await page.fill('[name="password"]', "testpassword123");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/dashboard");

  // Create post
  await page.click('a[href="/posts/new"]');
  await page.fill('[name="title"]', "E2E Test Post");
  await page.fill('[name="content"]', "This is an E2E test.");
  await page.click('button:has-text("Publish")');

  // Verify post appears in list
  await page.goto("/posts");
  await expect(page.locator("text=E2E Test Post")).toBeVisible();
});
```

---

## 5. Webhooks (Planned)

> Webhooks are under development for a future bkend.ai release.

### 5.1 Table Change Notifications (Planned)

Receive HTTP callbacks when records are created, updated, or deleted in a table.

```json
{
  "event": "table.record.created",
  "table": "orders",
  "record": { "_id": "order_123", "status": "pending", "..." : "..." },
  "timestamp": "2026-01-15T10:30:00Z",
  "projectId": "proj_abc123",
  "environment": "prod"
}
```

### 5.2 Auth Event Webhooks (Planned)

Receive callbacks for authentication events.

```json
{
  "event": "auth.user.registered",
  "user": { "_id": "user_456", "email": "new@example.com" },
  "timestamp": "2026-01-15T10:30:00Z",
  "projectId": "proj_abc123",
  "environment": "prod"
}
```

Planned auth events: `auth.user.registered`, `auth.user.login`, `auth.user.logout`, `auth.user.deleted`, `auth.token.refreshed`.

---

## 6. Realtime (Planned)

> Real-time subscriptions are under development for a future bkend.ai release.

### 6.1 WebSocket Subscriptions (Planned)

Subscribe to live data changes via WebSocket connections.

```typescript
// Planned API (not yet available)
// import { bkendRealtime } from "@/infrastructure/realtime/client";
//
// const channel = bkendRealtime.subscribe("posts", {
//   filter: { status: "published" },
//   events: ["insert", "update", "delete"],
// });
//
// channel.on("insert", (record) => {
//   console.log("New post:", record);
// });
//
// channel.on("update", (record) => {
//   console.log("Updated post:", record);
// });
//
// // Unsubscribe when done
// channel.unsubscribe();
```

---

## 7. Error Handling Guide

### 7.1 Error Response Format

All bkend.ai API errors follow a consistent JSON structure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address"
      }
    ]
  }
}
```

### 7.2 Common Errors

| Error Code | HTTP Status | Description | Resolution |
|------------|-------------|-------------|------------|
| `VALIDATION_ERROR` | 400 | Request body failed schema validation | Check required fields and data types |
| `DUPLICATE_KEY` | 400 | A record with the same unique field already exists | Use a different value for the unique field |
| `INVALID_CREDENTIALS` | 401 | Email or password is incorrect | Verify login credentials |
| `TOKEN_EXPIRED` | 401 | Access token has expired | Refresh the token using `/v1/auth/token/refresh` |
| `PERMISSION_DENIED` | 403 | User does not have access to this resource | Check RBAC role (admin/user/self/guest) |
| `TABLE_NOT_FOUND` | 404 | The specified table does not exist | Verify table name and environment |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests in a short period | Wait and retry with exponential backoff |

### 7.3 Error Handling Pattern

```typescript
// infrastructure/api/error-handler.ts

export class BkendError extends Error {
  code: string;
  status: number;
  details: any[];

  constructor(response: any, status: number) {
    super(response.error?.message || "Unknown bkend error");
    this.code = response.error?.code || "UNKNOWN_ERROR";
    this.status = status;
    this.details = response.error?.details || [];
  }
}

export async function handleBkendResponse<T>(res: Response): Promise<T> {
  const body = await res.json();

  if (!res.ok) {
    throw new BkendError(body, res.status);
  }

  return body;
}

// Usage in components:
// try {
//   await createPost(data);
// } catch (error) {
//   if (error instanceof BkendError) {
//     if (error.code === "VALIDATION_ERROR") {
//       showValidationErrors(error.details);
//     } else if (error.code === "TOKEN_EXPIRED") {
//       await refreshToken();
//       await createPost(data); // retry
//     }
//   }
// }
```

---

## 8. Connection Troubleshooting

If you cannot connect to the bkend.ai API, follow these five steps:

### Step 1: Check X-Project-Id Header

Ensure the `X-Project-Id` header is set to a valid project ID.

```bash
curl -v https://api-client.bkend.ai/v1/data/posts \
  -H "X-Project-Id: proj_abc123" \
  -H "X-Environment: dev" \
  -H "X-API-Key: <your-api-key>"
```

If you receive `PROJECT_NOT_FOUND`, verify the project ID in the bkend Console under **Project Settings**.

### Step 2: Check X-Environment Header

The `X-Environment` value must be one of: `dev`, `staging`, or `prod`. A missing or invalid environment header results in a `400 Bad Request`.

### Step 3: Check API Key

API keys are scoped per environment. An API key created for `dev` will not work for `prod`.

- Verify the key is active in **Console > Project > Settings > API Keys**
- Check that the key matches the target environment
- Ensure the key has not been revoked

### Step 4: Check CORS Configuration

If making requests from a browser, ensure your domain is allowed in the CORS settings.

- Navigate to **Console > Project > Settings > CORS**
- Add your frontend domain (e.g., `http://localhost:3000` for development)
- For production, add your actual domain (e.g., `https://myapp.com`)

Common CORS error symptoms:
- Browser console shows `Access-Control-Allow-Origin` errors
- Requests work in Postman or curl but fail in the browser
- Preflight (OPTIONS) requests are rejected

### Step 5: Check Network

- Verify your internet connection is active
- Check if `api-client.bkend.ai` is reachable: `curl -I https://api-client.bkend.ai/health`
- If behind a corporate firewall or VPN, ensure `api-client.bkend.ai` and `api.bkend.ai` are not blocked
- Check the [bkend.ai status page](https://status.bkend.ai) for any ongoing incidents

---

## 9. Auth Troubleshooting

### Step 1: Token Expired

**Symptom:** API returns `401` with code `TOKEN_EXPIRED`.

**Solution:** Refresh the access token using the refresh token endpoint.

```bash
curl -X POST https://api-client.bkend.ai/v1/auth/token/refresh \
  -H "Content-Type: application/json" \
  -H "X-Project-Id: proj_abc123" \
  -H "X-Environment: dev" \
  -d '{"refreshToken": "<your-refresh-token>"}'
```

Access tokens expire after **1 hour**. Implement auto-refresh in your HTTP client interceptor (see bkend-quickstart for middleware examples).

### Step 2: Invalid Token Format

**Symptom:** API returns `401` with code `INVALID_TOKEN`.

**Solution:** Verify the Authorization header format:
- Correct: `Authorization: Bearer eyJhbGciOiJIUzI1NiIs...`
- Wrong: `Authorization: eyJhbGciOiJIUzI1NiIs...` (missing `Bearer` prefix)
- Wrong: `Authorization: Bearer undefined` (token variable is undefined)

Check that your token storage and retrieval logic is working correctly.

### Step 3: MFA Required

**Symptom:** Login returns `403` with code `MFA_REQUIRED` and a `mfaToken` in the response.

**Solution:** Complete the MFA verification step:

```bash
curl -X POST https://api-client.bkend.ai/v1/auth/mfa/verify \
  -H "Content-Type: application/json" \
  -H "X-Project-Id: proj_abc123" \
  -H "X-Environment: dev" \
  -d '{"mfaToken": "<mfa-token-from-login>", "code": "123456"}'
```

The MFA code is a 6-digit TOTP code from the user's authenticator app.

### Step 4: Account Locked

**Symptom:** Login returns `403` with code `ACCOUNT_LOCKED`.

**Solution:** The account has been locked due to too many failed login attempts. Options:
- Wait for the lockout period to expire (default: 30 minutes)
- Reset the password via the forgot password flow
- Contact the project administrator to unlock the account via the Console

---

## 10. FAQ

### Q: Can I use GraphQL with bkend.ai?

**A:** No. bkend.ai provides a **REST API only**. There is no GraphQL endpoint. Use the `filter`, `sort`, `select`, and `limit` query parameters to shape your queries. For complex data needs, make multiple REST calls and combine the results on the client side.

### Q: What database does bkend.ai use?

**A:** bkend.ai uses **MongoDB Atlas** as its underlying database. All data is encrypted at rest with **AES-256 encryption**. You do not manage the database directly; all access is through the bkend REST API or MCP tools.

### Q: Can I create tables via the REST API?

**A:** No. Tables can only be created through the **bkend Console** (web UI) or via **MCP tools** (Gemini CLI, Claude Code, Cursor). The REST API is for data operations (CRUD) on existing tables only.

### Q: What is the maximum query limit?

**A:** The maximum `limit` parameter value is **100 records per request**. The default limit is 20. To retrieve more records, use cursor-based pagination to fetch subsequent pages.

### Q: How long are refresh tokens valid?

**A:** Refresh tokens are valid for **30 days** from the time of issuance. After 30 days, the user must log in again to obtain a new refresh token. Access tokens expire after **1 hour**.

### Q: Is there an official SDK for bkend.ai?

**A:** No. There is no official SDK at this time. Instead, use the **bkendFetch** REST API wrapper pattern documented in the bkend-quickstart and bkend-cookbook skills. This lightweight approach works with any language or framework that supports HTTP requests.

### Q: What column types are supported?

**A:** bkend.ai supports **7 column types**:

| Type | Description | Example |
|------|-------------|---------|
| `string` | Text data | `"Hello World"` |
| `int` | Integer numbers | `42` |
| `double` | Floating-point numbers | `3.14` |
| `bool` | Boolean values | `true` / `false` |
| `date` | ISO 8601 date strings | `"2026-01-15T10:30:00Z"` |
| `object` | Nested JSON objects | `{"street": "123 Main St"}` |
| `array` | JSON arrays | `["tag1", "tag2"]` |

**Important:** There is no generic `number` type. Use `int` for whole numbers and `double` for decimal values.

### Q: Can I use bkend.ai with frameworks other than Next.js and Flutter?

**A:** Yes. Since bkend.ai is a REST API, it works with any framework or language. The cookbook examples use Next.js and Flutter, but the same API calls work with React Native, Vue.js, Svelte, Angular, iOS (Swift), Android (Kotlin), Python, Go, or any HTTP-capable environment. Adapt the `bkendFetch` pattern to your language's HTTP client.

### Q: How do I handle file uploads?

**A:** Use the bkend storage API endpoint:

```bash
curl -X POST https://api-client.bkend.ai/v1/storage/upload \
  -H "X-Project-Id: proj_abc123" \
  -H "X-Environment: dev" \
  -H "X-API-Key: <your-api-key>" \
  -F "file=@/path/to/image.jpg"
```

The response includes a `url` field with the publicly accessible file URL. For detailed storage patterns, use the `/bkend-storage` skill.

### Q: What is the rate limit?

**A:** Rate limits depend on your plan. When exceeded, the API returns `429 Too Many Requests` with a `Retry-After` header indicating how many seconds to wait. Implement exponential backoff in your retry logic:

```typescript
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}
```

---

## 11. Next Steps

| Skill | When to Use |
|-------|-------------|
| `/bkend-quickstart` | First-time setup, core concepts, MCP configuration |
| `/bkend-auth` | Authentication flows, JWT, social login, MFA |
| `/bkend-data` | Advanced queries, filtering, pagination, relations |
| `/bkend-security` | RLS policies, rate limiting, CORS, audit logs |
| `/bkend-mcp` | MCP server tools reference and advanced usage |
| `/bkend-cookbook` | Full project tutorials with step-by-step implementation |
