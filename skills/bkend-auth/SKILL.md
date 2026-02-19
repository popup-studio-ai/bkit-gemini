---
name: bkend-auth
description: |
  bkend.ai authentication and security expert skill.
  Covers email signup/login, social login (Google, GitHub), magic link,
  JWT tokens (Access 1h, Refresh 30d), session management, RBAC (admin/user/self/guest),
  RLS policies, password management, and account lifecycle.

  Triggers: signup, login, JWT, session, social login, RBAC, RLS, password, token,
  회원가입, 로그인, 토큰, 세션, 권한, 보안정책, 비밀번호,
  ログイン, 認証, セッション, 権限, パスワード,
  登录, 认证, 会话, 权限, 密码,
  registro, inicio de sesion, permisos, contrasena,
  inscription, connexion, permissions, mot de passe,
  Registrierung, Anmeldung, Berechtigungen, Passwort,
  registrazione, accesso, permessi, password

  Do NOT use for: file storage (use bkend-storage), database queries (use bkend-data),
  MCP tool setup (use bkend-mcp)

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

# bkend-auth

> bkend.ai authentication and security expert skill

## 1. Auth Overview

bkend.ai uses **JWT-based authentication** with a dual-token strategy:

| Token | Type | Lifetime | Purpose |
|-------|------|----------|---------|
| Access Token | JWT | **1 hour** | API request authorization |
| Refresh Token | Opaque | **30 days** | Obtain new access tokens |

### Supported Authentication Methods

1. **Email/Password** -- traditional signup and login
2. **Magic Link** -- passwordless email-based login
3. **Social Login (OAuth)** -- Google, GitHub
4. **API Key** -- server-to-server (tenant-level, not user-level)

### Required Headers

All auth endpoints require these headers:

```http
X-Project-Id: <your-project-id>
X-Environment: <dev|staging|prod>
Content-Type: application/json
```

Authenticated endpoints additionally require:

```http
Authorization: Bearer <access-token>
```

### Auth Response Structure

All successful auth responses follow this pattern:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "name": "Alice",
      "role": "user",
      "emailVerified": true,
      "createdAt": "2025-01-15T09:00:00.000Z",
      "updatedAt": "2025-01-15T09:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "rt_a1b2c3d4e5f6...",
      "expiresIn": 3600
    }
  }
}
```

## 2. Email Authentication

### 2.1 Signup

**Endpoint:** `POST /auth/email/signup`

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123",
  "name": "Alice Kim"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "name": "Alice Kim",
      "role": "user",
      "emailVerified": false,
      "createdAt": "2025-01-15T09:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "rt_a1b2c3d4e5f6...",
      "expiresIn": 3600
    }
  }
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Error Responses:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `INVALID_EMAIL` | Email format is invalid |
| 400 | `WEAK_PASSWORD` | Password does not meet requirements |
| 409 | `EMAIL_ALREADY_EXISTS` | Account with this email already exists |
| 400 | `MISSING_REQUIRED_FIELD` | Required field (email, password) is missing |

**bkendFetch Example:**

```typescript
const result = await bkendFetch("/auth/email/signup", {
  method: "POST",
  body: JSON.stringify({
    email: "user@example.com",
    password: "SecureP@ss123",
    name: "Alice Kim",
  }),
});

// Store tokens
const { accessToken, refreshToken } = result.data.tokens;
```

### 2.2 Login

**Endpoint:** `POST /auth/email/signin`

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "name": "Alice Kim",
      "role": "user",
      "emailVerified": true,
      "lastLoginAt": "2025-01-20T14:30:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "rt_x9y8z7w6v5u4...",
      "expiresIn": 3600
    }
  }
}
```

**Error Responses:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 401 | `INVALID_CREDENTIALS` | Email or password is incorrect |
| 403 | `ACCOUNT_DISABLED` | Account has been disabled |
| 403 | `ACCOUNT_LOCKED` | Too many failed attempts (locked 30 min) |
| 429 | `TOO_MANY_ATTEMPTS` | Rate limit exceeded |

### 2.3 Email Verification

**Send verification email:**

```
POST /auth/email/verify/resend
```

```json
{
  "email": "user@example.com"
}
```

**Verify email with token:**

```
POST /auth/email/verify
```

```json
{
  "token": "ev_abc123def456..."
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully",
    "emailVerified": true
  }
}
```

## 3. Magic Link Authentication

Magic link provides passwordless authentication via email.

### 3.1 Send Magic Link

**Endpoint:** `POST /auth/magiclink/send`

**Request:**

```json
{
  "email": "user@example.com",
  "redirectUri": "https://myapp.com/auth/callback"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Magic link sent to user@example.com",
    "expiresIn": 600
  }
}
```

The user receives an email with a link like:
```
https://api-client.bkend.ai/auth/magiclink/verify?token=ml_abc123...&redirectUri=https://myapp.com/auth/callback
```

### 3.2 Verify Magic Link

**Endpoint:** `GET /auth/magiclink/verify?token=<token>&redirectUri=<uri>`

The server verifies the token and redirects to `redirectUri` with tokens as query parameters:

```
https://myapp.com/auth/callback?accessToken=eyJ...&refreshToken=rt_...&expiresIn=3600
```

**Client-side handling:**

```typescript
// app/auth/callback/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (accessToken && refreshToken) {
      // Store tokens securely
      document.cookie = `bkend_access_token=${accessToken}; path=/; secure; samesite=lax; max-age=3600`;
      document.cookie = `bkend_refresh_token=${refreshToken}; path=/; secure; samesite=lax; max-age=2592000`;
      router.push("/dashboard");
    } else {
      router.push("/login?error=invalid_magic_link");
    }
  }, [searchParams, router]);

  return <div>Authenticating...</div>;
}
```

**Error Responses:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `INVALID_MAGIC_LINK` | Token is invalid or malformed |
| 410 | `MAGIC_LINK_EXPIRED` | Token has expired (10 min lifetime) |
| 400 | `MAGIC_LINK_USED` | Token has already been used |

## 4. Social Login (OAuth)

### 4.1 Google OAuth

**Console Configuration:**

1. Go to **Console > Project > Settings > Auth > Social Login**
2. Enable Google provider
3. Enter your Google Client ID and Client Secret
4. Set authorized redirect URI: `https://api-client.bkend.ai/auth/social/google/callback`

**Initiate Google Login:**

```
GET /auth/social/google?redirectUri=https://myapp.com/auth/callback
```

The server redirects the user to Google's OAuth consent screen. After authorization, the user is redirected back to your `redirectUri` with tokens:

```
https://myapp.com/auth/callback?accessToken=eyJ...&refreshToken=rt_...&expiresIn=3600
```

**bkendFetch Example (redirect):**

```typescript
function handleGoogleLogin() {
  const projectId = process.env.NEXT_PUBLIC_BKEND_PROJECT_ID;
  const env = process.env.NEXT_PUBLIC_BKEND_ENVIRONMENT;
  const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);

  window.location.href =
    `${process.env.NEXT_PUBLIC_BKEND_API_URL}/auth/social/google` +
    `?redirectUri=${redirectUri}` +
    `&projectId=${projectId}` +
    `&environment=${env}`;
}
```

### 4.2 GitHub OAuth

**Console Configuration:**

1. Go to **Console > Project > Settings > Auth > Social Login**
2. Enable GitHub provider
3. Enter your GitHub Client ID and Client Secret
4. Set authorization callback URL: `https://api-client.bkend.ai/auth/social/github/callback`

**Initiate GitHub Login:**

```
GET /auth/social/github?redirectUri=https://myapp.com/auth/callback
```

The flow is identical to Google. The user is redirected to GitHub for authorization, then back to your app with tokens.

**Error Responses (Social Login):**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `SOCIAL_AUTH_FAILED` | OAuth provider returned an error |
| 400 | `SOCIAL_EMAIL_NOT_FOUND` | Provider did not return an email |
| 409 | `EMAIL_ALREADY_EXISTS` | Email is linked to another auth method |
| 400 | `SOCIAL_PROVIDER_DISABLED` | Provider not enabled in project settings |

## 5. Token Management

### 5.1 Refresh Token

**Endpoint:** `POST /auth/token/refresh`

**Request:**

```json
{
  "refreshToken": "rt_a1b2c3d4e5f6..."
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "rt_newtoken123...",
    "expiresIn": 3600
  }
}
```

**Error Responses:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 401 | `INVALID_REFRESH_TOKEN` | Refresh token is invalid |
| 401 | `REFRESH_TOKEN_EXPIRED` | Refresh token has expired (30 day lifetime) |
| 401 | `REFRESH_TOKEN_REVOKED` | Refresh token has been revoked |

### 5.2 Token Storage Patterns

**Recommended: httpOnly Cookie (Server-rendered apps)**

```typescript
// API route: app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { bkendFetch } from "@/lib/bkend";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = await bkendFetch("/auth/email/signin", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const response = NextResponse.json({ user: result.data.user });

  response.cookies.set("bkend_access_token", result.data.tokens.accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 3600, // 1 hour
  });

  response.cookies.set("bkend_refresh_token", result.data.tokens.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 2592000, // 30 days
  });

  return response;
}
```

**Alternative: Memory + localStorage (SPA)**

```typescript
// lib/auth-store.ts
class AuthStore {
  private accessToken: string | null = null;

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    localStorage.setItem("bkend_refresh_token", refreshToken);
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return localStorage.getItem("bkend_refresh_token");
  }

  clearTokens() {
    this.accessToken = null;
    localStorage.removeItem("bkend_refresh_token");
  }
}

export const authStore = new AuthStore();
```

### 5.3 Auto-refresh Pattern (Next.js Middleware)

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/", "/auth/callback"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("bkend_access_token")?.value;
  const refreshToken = request.cookies.get("bkend_refresh_token")?.value;

  // No tokens at all -- redirect to login
  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Access token exists -- proceed
  if (accessToken) {
    return NextResponse.next();
  }

  // Access token expired, refresh token exists -- auto-refresh
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

    if (!res.ok) {
      throw new Error("Refresh failed");
    }

    const data = await res.json();
    const response = NextResponse.next();

    response.cookies.set("bkend_access_token", data.data.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 3600,
    });

    if (data.data.refreshToken) {
      response.cookies.set("bkend_refresh_token", data.data.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 2592000,
      });
    }

    return response;
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("bkend_access_token");
    response.cookies.delete("bkend_refresh_token");
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
```

## 6. Session Management

### 6.1 Revoke Current Session

**Endpoint:** `POST /auth/session/revoke`

**Headers:**

```http
Authorization: Bearer <access-token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Session revoked successfully"
  }
}
```

### 6.2 Revoke All Sessions

**Endpoint:** `POST /auth/session/revoke-all`

**Headers:**

```http
Authorization: Bearer <access-token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "All sessions revoked",
    "revokedCount": 5
  }
}
```

### 6.3 List Active Sessions

**Endpoint:** `GET /auth/session/list`

**Headers:**

```http
Authorization: Bearer <access-token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "ses_abc123",
        "device": "Chrome on macOS",
        "ip": "192.168.1.1",
        "lastActiveAt": "2025-01-20T14:30:00.000Z",
        "createdAt": "2025-01-15T09:00:00.000Z",
        "current": true
      },
      {
        "id": "ses_def456",
        "device": "Safari on iPhone",
        "ip": "10.0.0.1",
        "lastActiveAt": "2025-01-19T10:00:00.000Z",
        "createdAt": "2025-01-18T08:00:00.000Z",
        "current": false
      }
    ]
  }
}
```

**bkendFetch Example:**

```typescript
// Logout from current device
async function logout(token: string) {
  await bkendFetch("/auth/session/revoke", {
    method: "POST",
    token,
  });

  // Clear local tokens
  document.cookie = "bkend_access_token=; max-age=0; path=/";
  document.cookie = "bkend_refresh_token=; max-age=0; path=/";
  window.location.href = "/login";
}

// Logout from all devices
async function logoutAll(token: string) {
  await bkendFetch("/auth/session/revoke-all", {
    method: "POST",
    token,
  });
}
```

## 7. Password Management

### 7.1 Forgot Password

**Endpoint:** `POST /auth/password/forgot`

**Request:**

```json
{
  "email": "user@example.com",
  "redirectUri": "https://myapp.com/reset-password"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Password reset email sent",
    "expiresIn": 3600
  }
}
```

The user receives an email with a link:
```
https://myapp.com/reset-password?token=pr_abc123...
```

### 7.2 Reset Password

**Endpoint:** `POST /auth/password/reset`

**Request:**

```json
{
  "token": "pr_abc123...",
  "newPassword": "NewSecureP@ss456"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully"
  }
}
```

### 7.3 Change Password (Authenticated)

**Endpoint:** `PUT /auth/password/change`

**Headers:**

```http
Authorization: Bearer <access-token>
```

**Request:**

```json
{
  "currentPassword": "SecureP@ss123",
  "newPassword": "NewSecureP@ss456"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  }
}
```

**Error Responses:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `INVALID_RESET_TOKEN` | Reset token is invalid |
| 410 | `RESET_TOKEN_EXPIRED` | Reset token has expired (1 hour) |
| 401 | `INCORRECT_PASSWORD` | Current password is incorrect |
| 400 | `WEAK_PASSWORD` | New password does not meet requirements |
| 400 | `SAME_PASSWORD` | New password must differ from current |

## 8. Multi-Factor Authentication (MFA)

### 8.1 Setup MFA

**Endpoint:** `POST /auth/mfa/setup`

**Headers:**

```http
Authorization: Bearer <access-token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCodeUrl": "otpauth://totp/bkend:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=bkend",
    "backupCodes": [
      "abc123def456",
      "ghi789jkl012",
      "mno345pqr678",
      "stu901vwx234",
      "yza567bcd890"
    ]
  }
}
```

### 8.2 Verify MFA

**Endpoint:** `POST /auth/mfa/verify`

**Request:**

```json
{
  "code": "123456"
}
```

This endpoint is used both to complete MFA setup (first verification) and during login when MFA is enabled.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "MFA verified successfully",
    "mfaEnabled": true
  }
}
```

When MFA is enabled, login responses include an `mfaRequired` flag:

```json
{
  "success": true,
  "data": {
    "mfaRequired": true,
    "mfaToken": "mfa_temp_abc123..."
  }
}
```

The client must then call `/auth/mfa/verify` with the `mfaToken` header and the TOTP code.

### 8.3 Disable MFA

**Endpoint:** `POST /auth/mfa/disable`

**Headers:**

```http
Authorization: Bearer <access-token>
```

**Request:**

```json
{
  "code": "123456"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "MFA disabled successfully",
    "mfaEnabled": false
  }
}
```

## 9. Account Linking

Link multiple auth methods to a single user account.

### 9.1 Link Provider

**Endpoint:** `POST /auth/link/{provider}`

**Supported providers:** `google`, `github`

**Headers:**

```http
Authorization: Bearer <access-token>
```

The server redirects to the OAuth provider. After authorization, the provider is linked to the current user account.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Google account linked successfully",
    "linkedProviders": ["email", "google"]
  }
}
```

### 9.2 Unlink Provider

**Endpoint:** `DELETE /auth/link/{provider}`

**Headers:**

```http
Authorization: Bearer <access-token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Google account unlinked",
    "linkedProviders": ["email"]
  }
}
```

**Error Responses:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `PROVIDER_NOT_LINKED` | Provider is not linked to this account |
| 400 | `LAST_AUTH_METHOD` | Cannot unlink the only remaining auth method |
| 409 | `PROVIDER_ALREADY_LINKED` | Provider is already linked to another account |

## 10. Invitation System

Invite users to join your application with a predefined role.

### 10.1 Send Invitation

**Endpoint:** `POST /auth/invite`

**Headers:**

```http
Authorization: Bearer <access-token>
```

**Request:**

```json
{
  "email": "newuser@example.com",
  "role": "user",
  "redirectUri": "https://myapp.com/invite/accept",
  "metadata": {
    "teamId": "team_abc123",
    "welcomeMessage": "Welcome to our platform!"
  }
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "inviteId": "inv_abc123",
    "email": "newuser@example.com",
    "role": "user",
    "status": "pending",
    "expiresAt": "2025-01-22T09:00:00.000Z"
  }
}
```

### 10.2 Accept Invitation

**Endpoint:** `POST /auth/invite/accept`

**Request:**

```json
{
  "token": "inv_token_abc123...",
  "name": "New User",
  "password": "SecureP@ss123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_xyz789",
      "email": "newuser@example.com",
      "name": "New User",
      "role": "user"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "rt_newuser123...",
      "expiresIn": 3600
    }
  }
}
```

## 11. User Management

### 11.1 List Users (Admin)

**Endpoint:** `GET /users`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `sort` | string | `-createdAt` | Sort field (prefix `-` for descending) |
| `role` | string | -- | Filter by role |
| `search` | string | -- | Search by name or email |

**Headers:**

```http
Authorization: Bearer <admin-access-token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "usr_abc123",
      "email": "user@example.com",
      "name": "Alice Kim",
      "role": "user",
      "emailVerified": true,
      "createdAt": "2025-01-15T09:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

### 11.2 Get User by ID (Admin)

**Endpoint:** `GET /users/:id`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "Alice Kim",
    "role": "user",
    "emailVerified": true,
    "linkedProviders": ["email", "google"],
    "mfaEnabled": false,
    "lastLoginAt": "2025-01-20T14:30:00.000Z",
    "createdAt": "2025-01-15T09:00:00.000Z",
    "updatedAt": "2025-01-20T14:30:00.000Z"
  }
}
```

### 11.3 Update User (Admin)

**Endpoint:** `PUT /users/:id`

**Request:**

```json
{
  "name": "Alice Kim (Updated)",
  "role": "admin",
  "metadata": {
    "department": "Engineering"
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "name": "Alice Kim (Updated)",
    "role": "admin",
    "updatedAt": "2025-01-21T10:00:00.000Z"
  }
}
```

### 11.4 Delete User (Admin)

**Endpoint:** `DELETE /users/:id`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "User deleted successfully",
    "deletedId": "usr_abc123"
  }
}
```

### 11.5 Get Current User Profile

**Endpoint:** `GET /users/me`

**Headers:**

```http
Authorization: Bearer <access-token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "Alice Kim",
    "role": "user",
    "emailVerified": true,
    "linkedProviders": ["email", "google"],
    "mfaEnabled": true,
    "metadata": {},
    "createdAt": "2025-01-15T09:00:00.000Z",
    "updatedAt": "2025-01-20T14:30:00.000Z"
  }
}
```

### 11.6 Update Current User Profile

**Endpoint:** `PUT /users/me`

**Headers:**

```http
Authorization: Bearer <access-token>
```

**Request:**

```json
{
  "name": "Alice K.",
  "metadata": {
    "avatar": "https://example.com/avatar.jpg",
    "bio": "Full-stack developer"
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "name": "Alice K.",
    "metadata": {
      "avatar": "https://example.com/avatar.jpg",
      "bio": "Full-stack developer"
    },
    "updatedAt": "2025-01-21T11:00:00.000Z"
  }
}
```

## 12. Auth Form Patterns (React / Next.js)

### 12.1 LoginForm Component

```typescript
// components/auth/LoginForm.tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function handleSocialLogin(provider: "google" | "github") {
    const baseUrl = process.env.NEXT_PUBLIC_BKEND_API_URL;
    const projectId = process.env.NEXT_PUBLIC_BKEND_PROJECT_ID;
    const env = process.env.NEXT_PUBLIC_BKEND_ENVIRONMENT;
    const redirectUri = encodeURIComponent(
      `${window.location.origin}/auth/callback`
    );

    window.location.href =
      `${baseUrl}/auth/social/${provider}` +
      `?redirectUri=${redirectUri}` +
      `&projectId=${projectId}` +
      `&environment=${env}`;
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </button>

      <div className="social-login">
        <button type="button" onClick={() => handleSocialLogin("google")}>
          Continue with Google
        </button>
        <button type="button" onClick={() => handleSocialLogin("github")}>
          Continue with GitHub
        </button>
      </div>

      <div className="links">
        <a href="/forgot-password">Forgot password?</a>
        <a href="/signup">Create account</a>
      </div>
    </form>
  );
}
```

### 12.2 SignupForm Component

```typescript
// components/auth/SignupForm.tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signup } = useAuth();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await signup(email, password, name);
      router.push("/verify-email");
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}

      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? "Creating account..." : "Create Account"}
      </button>

      <div className="links">
        <a href="/login">Already have an account? Sign in</a>
      </div>
    </form>
  );
}
```

### 12.3 AuthProvider Context

```typescript
// providers/AuthProvider.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { bkendFetch } from "@/lib/bkend";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  async function refreshUser() {
    try {
      const result = await fetch("/api/auth/me");
      if (result.ok) {
        const data = await result.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }

  async function login(email: string, password: string) {
    const result = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!result.ok) {
      const error = await result.json();
      throw new Error(error.error?.message || "Login failed");
    }

    const data = await result.json();
    setUser(data.user);
  }

  async function signup(email: string, password: string, name: string) {
    const result = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (!result.ok) {
      const error = await result.json();
      throw new Error(error.error?.message || "Signup failed");
    }

    const data = await result.json();
    setUser(data.user);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
```

### 12.4 useAuth Hook

```typescript
// hooks/useAuth.ts
"use client";

import { useAuthContext } from "@/providers/AuthProvider";

export function useAuth() {
  return useAuthContext();
}
```

### 12.5 Protected Route HOC

```typescript
// components/auth/ProtectedRoute.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRole,
  fallback,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return fallback || <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== "admin") {
    return <div>Access denied. Required role: {requiredRole}</div>;
  }

  return <>{children}</>;
}

// Usage:
// <ProtectedRoute requiredRole="admin">
//   <AdminDashboard />
// </ProtectedRoute>
```

### 12.6 RBAC Reference

bkend.ai supports four built-in roles:

| Role | Level | Description | Permissions |
|------|-------|-------------|-------------|
| `admin` | 4 | Full access | All CRUD, user management, settings |
| `user` | 3 | Standard user | CRUD own data, read shared data |
| `self` | 2 | Self-only | Read/write only own records |
| `guest` | 1 | Read-only | Read public data only |

**RLS (Row-Level Security) Policies:**

Configure in **Console > Project > Tables > [Table] > Security**:

```json
{
  "read": {
    "admin": "*",
    "user": "*",
    "self": { "createdBy": "{{userId}}" },
    "guest": { "isPublic": true }
  },
  "create": {
    "admin": "*",
    "user": "*",
    "self": "*",
    "guest": false
  },
  "update": {
    "admin": "*",
    "user": { "createdBy": "{{userId}}" },
    "self": { "createdBy": "{{userId}}" },
    "guest": false
  },
  "delete": {
    "admin": "*",
    "user": false,
    "self": { "createdBy": "{{userId}}" },
    "guest": false
  }
}
```

## 13. Error Codes Reference

Complete list of auth-related error codes:

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `INVALID_EMAIL` | 400 | Email format is invalid |
| `WEAK_PASSWORD` | 400 | Password does not meet requirements |
| `MISSING_REQUIRED_FIELD` | 400 | A required field is missing |
| `INVALID_REQUEST_BODY` | 400 | Request body is malformed |
| `EMAIL_ALREADY_EXISTS` | 409 | An account with this email already exists |
| `INVALID_CREDENTIALS` | 401 | Email or password is incorrect |
| `ACCOUNT_DISABLED` | 403 | User account has been disabled by admin |
| `ACCOUNT_LOCKED` | 403 | Account locked due to too many failed attempts |
| `EMAIL_NOT_VERIFIED` | 403 | Email address has not been verified |
| `INVALID_VERIFICATION_TOKEN` | 400 | Email verification token is invalid |
| `VERIFICATION_TOKEN_EXPIRED` | 410 | Email verification token has expired |
| `INVALID_MAGIC_LINK` | 400 | Magic link token is invalid |
| `MAGIC_LINK_EXPIRED` | 410 | Magic link token has expired (10 min) |
| `MAGIC_LINK_USED` | 400 | Magic link has already been used |
| `SOCIAL_AUTH_FAILED` | 400 | OAuth provider returned an error |
| `SOCIAL_EMAIL_NOT_FOUND` | 400 | OAuth provider did not return an email |
| `SOCIAL_PROVIDER_DISABLED` | 400 | Social login provider not enabled |
| `INVALID_ACCESS_TOKEN` | 401 | Access token is invalid or malformed |
| `ACCESS_TOKEN_EXPIRED` | 401 | Access token has expired |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token is invalid |
| `REFRESH_TOKEN_EXPIRED` | 401 | Refresh token has expired (30 days) |
| `REFRESH_TOKEN_REVOKED` | 401 | Refresh token has been revoked |
| `INVALID_RESET_TOKEN` | 400 | Password reset token is invalid |
| `RESET_TOKEN_EXPIRED` | 410 | Password reset token has expired (1 hour) |
| `INCORRECT_PASSWORD` | 401 | Current password is incorrect |
| `SAME_PASSWORD` | 400 | New password must differ from current |
| `MFA_REQUIRED` | 403 | Multi-factor authentication is required |
| `INVALID_MFA_CODE` | 400 | MFA TOTP code is invalid |
| `MFA_ALREADY_ENABLED` | 409 | MFA is already enabled for this account |
| `PROVIDER_NOT_LINKED` | 400 | Auth provider is not linked to account |
| `PROVIDER_ALREADY_LINKED` | 409 | Provider already linked to another account |
| `LAST_AUTH_METHOD` | 400 | Cannot remove the last auth method |
| `INVITE_NOT_FOUND` | 404 | Invitation not found |
| `INVITE_EXPIRED` | 410 | Invitation has expired (7 days) |
| `INVITE_ALREADY_ACCEPTED` | 400 | Invitation has already been accepted |
| `INSUFFICIENT_PERMISSIONS` | 403 | User role lacks required permissions |
| `USER_NOT_FOUND` | 404 | User with given ID does not exist |
| `TOO_MANY_ATTEMPTS` | 429 | Rate limit exceeded, try again later |
| `SESSION_NOT_FOUND` | 404 | Session does not exist |
| `SESSION_EXPIRED` | 401 | Session has expired |
| `MISSING_PROJECT_HEADER` | 400 | X-Project-Id header is missing |
| `MISSING_ENVIRONMENT_HEADER` | 400 | X-Environment header is missing |
| `INVALID_PROJECT_ID` | 400 | Project ID is invalid or not found |
