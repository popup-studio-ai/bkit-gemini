---
name: bkend-quickstart
description: |
  bkend.ai platform onboarding and core concepts guide.
  Covers MCP setup, resource hierarchy (Org->Project->Environment),
  Tenant vs User model, and first project creation.

  Use proactively when user is new to bkend or asks about initial setup.

  Triggers: bkend setup, first project, bkend start, MCP connect,
  bkend 시작, 처음, 설정, MCP 연결, 프로젝트 생성,
  bkend始め方, 初期設定, MCP接続, bkend入门, 初始设置, MCP连接,
  configuracion bkend, primer proyecto, configuration bkend, premier projet,
  bkend Einrichtung, erstes Projekt, configurazione bkend, primo progetto

  Do NOT use for: advanced auth flows (use bkend-auth), database queries (use bkend-data),
  file storage (use bkend-storage), security policies (use bkend-security)

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
  - web_fetch

imports: []

agents:
  backend: bkend-expert

context: session
memory: project
pdca-phase: all
---

# bkend-quickstart

> bkend.ai platform onboarding and core concepts guide

## 1. What is bkend.ai

bkend.ai is a **Backend-as-a-Service (BaaS)** platform built on **MongoDB Atlas**. It provides:

- **REST API** endpoints for CRUD operations, authentication, file storage, and more
- **MCP (Model Context Protocol)** server for AI-assisted development with Gemini CLI, Claude Code, and Cursor
- **Console UI** at `https://console.bkend.ai` for visual management
- **Zero-config database** powered by MongoDB Atlas (no schema migration needed)
- **Multi-tenant architecture** with project-level isolation

### Key Differentiators

| Feature | bkend.ai | Traditional BaaS |
|---------|----------|-------------------|
| AI Integration | Native MCP support | None |
| Database | MongoDB Atlas (managed) | Self-managed |
| Schema | Schemaless / flexible | Rigid migrations |
| Auth | Built-in JWT + Social | Plugin-based |
| File Storage | Integrated | Separate service |

## 2. Core Concepts

### 2.1 Resource Hierarchy

```
Organization (Org)
└── Project
    └── Environment (dev / staging / prod)
        ├── Tables (collections)
        ├── Auth (users, sessions)
        ├── Storage (files, buckets)
        └── API Keys
```

- **Organization**: Top-level billing and team boundary. One user can belong to multiple orgs.
- **Project**: A single application or service. Contains its own database, auth, and storage.
- **Environment**: Isolated runtime context within a project. Each environment has its own data, API keys, and configuration. Default environments: `dev`, `staging`, `prod`.

### 2.2 Tenant vs User Model

bkend.ai distinguishes between two identity layers:

| Concept | Tenant | User |
|---------|--------|------|
| Who | Developer / team member | End-user of your app |
| Scope | Console + API management | App-level auth |
| Auth | Console login | `/auth/*` endpoints |
| Permissions | Org/Project roles | RBAC (admin/user/self/guest) |
| API Key | Yes (X-API-Key) | No (uses JWT) |

- **Tenant**: You, the developer. Manages projects via the Console or API keys.
- **User**: Your application's end-user. Authenticates via email, social login, or magic link.

### 2.3 API Structure

**Base URL:**

```
https://api-client.bkend.ai
```

**MCP URL:**

```
https://api.bkend.ai/mcp
```

**Required Headers for all API calls:**

```http
X-Project-Id: <your-project-id>
X-Environment: <dev|staging|prod>
```

**Authentication Headers (choose one):**

```http
# For tenant/server-side calls
X-API-Key: <your-api-key>

# For user-authenticated calls
Authorization: Bearer <access-token>
```

**Standard Response Format:**

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

**Standard Error Format:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [...]
  }
}
```

## 3. Quick Start Steps

### Step 1: Sign Up

Visit `https://console.bkend.ai/signup` and create your tenant account.

### Step 2: Create an Organization

```http
POST https://api-client.bkend.ai/orgs
Content-Type: application/json

{
  "name": "My Company",
  "slug": "my-company"
}
```

Or use the Console: **Dashboard > Create Organization**.

### Step 3: Create a Project

```http
POST https://api-client.bkend.ai/projects
Content-Type: application/json
X-Org-Id: <your-org-id>

{
  "name": "My App",
  "slug": "my-app"
}
```

Or use the Console: **Organization > New Project**.

### Step 4: Set Environment

Each project starts with three environments: `dev`, `staging`, `prod`. Choose your target:

```http
X-Project-Id: proj_abc123
X-Environment: dev
```

### Step 5: Create a Table

```http
POST https://api-client.bkend.ai/tables
Content-Type: application/json
X-Project-Id: proj_abc123
X-Environment: dev
X-API-Key: <your-api-key>

{
  "name": "todos",
  "schema": {
    "title": { "type": "string", "required": true },
    "completed": { "type": "boolean", "default": false },
    "priority": { "type": "number", "default": 0 }
  }
}
```

### Step 6: Get an API Key

Navigate to **Console > Project > Settings > API Keys** and generate a new key. Or via API:

```http
POST https://api-client.bkend.ai/api-keys
X-Project-Id: proj_abc123
X-Environment: dev
```

### Step 7: Call the API

```bash
# Create a record
curl -X POST https://api-client.bkend.ai/data/todos \
  -H "Content-Type: application/json" \
  -H "X-Project-Id: proj_abc123" \
  -H "X-Environment: dev" \
  -H "X-API-Key: your-api-key" \
  -d '{"title": "Learn bkend", "completed": false}'

# List records
curl https://api-client.bkend.ai/data/todos \
  -H "X-Project-Id: proj_abc123" \
  -H "X-Environment: dev" \
  -H "X-API-Key: your-api-key"
```

## 4. MCP Setup

### 4.1 Gemini CLI

Create or edit `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "bkend": {
      "httpUrl": "https://api.bkend.ai/mcp",
      "headers": {
        "X-Project-Id": "proj_abc123",
        "X-Environment": "dev",
        "X-API-Key": "your-api-key"
      }
    }
  }
}
```

After setup, restart Gemini CLI. You can then use natural language:

```
> Create a users table with name, email, and age fields
> Add a new user named Alice with email alice@example.com
> List all users where age > 25
```

### 4.2 Claude Code

Create or edit `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "bkend": {
      "type": "http",
      "url": "https://api.bkend.ai/mcp",
      "headers": {
        "X-Project-Id": "proj_abc123",
        "X-Environment": "dev",
        "X-API-Key": "your-api-key"
      }
    }
  }
}
```

### 4.3 Cursor

Open **Cursor Settings > MCP Servers** and add:

```json
{
  "bkend": {
    "type": "http",
    "url": "https://api.bkend.ai/mcp",
    "headers": {
      "X-Project-Id": "proj_abc123",
      "X-Environment": "dev",
      "X-API-Key": "your-api-key"
    }
  }
}
```

## 5. Framework Quick Start

### 5.1 Next.js Setup

**Environment Variables** (`.env.local`):

```env
NEXT_PUBLIC_BKEND_API_URL=https://api-client.bkend.ai
NEXT_PUBLIC_BKEND_PROJECT_ID=proj_abc123
NEXT_PUBLIC_BKEND_ENVIRONMENT=dev
BKEND_API_KEY=your-api-key
```

**bkendFetch Client** (`lib/bkend.ts`):

```typescript
interface BkendFetchOptions extends RequestInit {
  token?: string;
}

export async function bkendFetch<T = any>(
  path: string,
  options: BkendFetchOptions = {}
): Promise<T> {
  const { token, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Project-Id": process.env.NEXT_PUBLIC_BKEND_PROJECT_ID!,
    "X-Environment": process.env.NEXT_PUBLIC_BKEND_ENVIRONMENT!,
    ...customHeaders as Record<string, string>,
  };

  // Server-side: use API key
  if (typeof window === "undefined" && process.env.BKEND_API_KEY) {
    headers["X-API-Key"] = process.env.BKEND_API_KEY;
  }

  // Client-side: use JWT token
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BKEND_API_URL}${path}`,
    { headers, ...rest }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || "bkend API error");
  }

  return res.json();
}
```

**Middleware** (`middleware.ts`):

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("bkend_access_token")?.value;
  const refreshToken = request.cookies.get("bkend_refresh_token")?.value;

  // Public routes - skip auth
  const publicPaths = ["/login", "/signup", "/"];
  if (publicPaths.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Auto-refresh if access token is missing but refresh token exists
  if (!accessToken && refreshToken) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BKEND_API_URL}/auth/token/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Project-Id": process.env.NEXT_PUBLIC_BKEND_PROJECT_ID!,
            "X-Environment": process.env.NEXT_PUBLIC_BKEND_ENVIRONMENT!,
          },
          body: JSON.stringify({ refreshToken }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const response = NextResponse.next();
        response.cookies.set("bkend_access_token", data.data.accessToken, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          maxAge: 3600,
        });
        return response;
      }
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

### 5.2 Flutter Setup

**DioClient** (`lib/core/network/bkend_client.dart`):

```dart
import 'package:dio/dio.dart';

class BkendClient {
  late final Dio _dio;

  BkendClient({
    required String projectId,
    required String environment,
    String? apiKey,
  }) {
    _dio = Dio(BaseOptions(
      baseUrl: 'https://api-client.bkend.ai',
      headers: {
        'Content-Type': 'application/json',
        'X-Project-Id': projectId,
        'X-Environment': environment,
        if (apiKey != null) 'X-API-Key': apiKey,
      },
    ));

    _dio.interceptors.add(AuthInterceptor());
  }

  Future<Response<T>> get<T>(String path, {
    Map<String, dynamic>? queryParameters,
  }) => _dio.get<T>(path, queryParameters: queryParameters);

  Future<Response<T>> post<T>(String path, {dynamic data}) =>
      _dio.post<T>(path, data: data);

  Future<Response<T>> put<T>(String path, {dynamic data}) =>
      _dio.put<T>(path, data: data);

  Future<Response<T>> delete<T>(String path) => _dio.delete<T>(path);
}
```

**Auth Interceptor** (`lib/core/network/auth_interceptor.dart`):

```dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthInterceptor extends Interceptor {
  final _storage = const FlutterSecureStorage();

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _storage.read(key: 'access_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      final refreshToken = await _storage.read(key: 'refresh_token');
      if (refreshToken != null) {
        try {
          final dio = Dio();
          final res = await dio.post(
            'https://api-client.bkend.ai/auth/token/refresh',
            data: {'refreshToken': refreshToken},
            options: Options(headers: err.requestOptions.headers),
          );
          final newToken = res.data['data']['accessToken'];
          await _storage.write(key: 'access_token', value: newToken);

          // Retry original request
          err.requestOptions.headers['Authorization'] = 'Bearer $newToken';
          final retryRes = await dio.fetch(err.requestOptions);
          handler.resolve(retryRes);
          return;
        } catch (_) {
          await _storage.deleteAll();
        }
      }
    }
    handler.next(err);
  }
}
```

## 6. Console Guide Summary

The bkend.ai Console (`https://console.bkend.ai`) provides visual management for all platform features:

| Section | Description |
|---------|-------------|
| **Projects** | Create, configure, and manage projects |
| **Environments** | Switch between dev/staging/prod environments |
| **Tables** | Create collections, define schemas, browse data |
| **API Keys** | Generate and revoke API keys per environment |
| **Auth** | View registered users, manage sessions |
| **Storage** | Browse uploaded files, manage buckets |
| **Team** | Invite members, assign roles (Owner/Admin/Member) |
| **Settings** | Project configuration, custom domains, webhooks |
| **Logs** | View API request logs and error traces |

## 7. Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_BKEND_API_URL` | Yes | bkend API base URL | `https://api-client.bkend.ai` |
| `NEXT_PUBLIC_BKEND_PROJECT_ID` | Yes | Your project ID | `proj_abc123` |
| `NEXT_PUBLIC_BKEND_ENVIRONMENT` | Yes | Target environment | `dev` |
| `BKEND_API_KEY` | Server only | API key for server-side calls | `bk_key_...` |
| `NEXT_PUBLIC_BKEND_MCP_URL` | Optional | MCP server URL | `https://api.bkend.ai/mcp` |
| `BKEND_WEBHOOK_SECRET` | Optional | Webhook signature secret | `whsec_...` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID | `123...apps.googleusercontent.com` |
| `NEXT_PUBLIC_GITHUB_CLIENT_ID` | Optional | GitHub OAuth client ID | `gh_abc123` |

## 8. Next Steps

Once you have completed setup, use the following bkend-* skills for each domain:

| Domain | Skill | Description |
|--------|-------|-------------|
| Authentication | `/bkend-auth` | Email/social login, JWT, sessions, RBAC, MFA |
| Data Operations | `/bkend-data` | CRUD, queries, filtering, pagination, relations |
| File Storage | `/bkend-storage` | Upload, download, presigned URLs, image transforms |
| Security | `/bkend-security` | RLS policies, rate limiting, CORS, audit logs |
| MCP Tools | `/bkend-mcp` | MCP server tools reference and advanced usage |
| Realtime | `/bkend-realtime` | WebSocket subscriptions, live queries |
| Functions | `/bkend-functions` | Server-side functions, webhooks, scheduled tasks |

### Recommended Learning Path

1. **Start here** (bkend-quickstart) -- you are here
2. **Authentication** (`/bkend-auth`) -- set up user auth for your app
3. **Data Operations** (`/bkend-data`) -- CRUD and query patterns
4. **Storage** (`/bkend-storage`) -- file uploads and management
5. **Security** (`/bkend-security`) -- production-ready security policies
