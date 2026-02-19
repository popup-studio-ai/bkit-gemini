---
name: bkend-security
description: |
  bkend.ai security policies and encryption expert skill.
  Covers API key management (Public vs Secret), Row Level Security (RLS) with 4 roles
  (admin/user/guest/self), data encryption (Argon2id, AES-256-GCM, TLS 1.2+),
  and security best practices.

  Triggers: security, RLS, api key, encryption, RBAC, permissions,
  보안, API 키, 암호화, 권한, 역할, 접근제어,
  セキュリティ, APIキー, 暗号化, 権限, ロール,
  安全, API密钥, 加密, 权限, 角色,
  seguridad, clave API, cifrado, permisos, roles,
  securite, cle API, chiffrement, permissions, roles,
  Sicherheit, API-Schluessel, Verschluesselung, Berechtigungen,
  sicurezza, chiave API, crittografia, permessi, ruoli

  Do NOT use for: authentication flows (use bkend-auth), database operations (use bkend-data),
  infrastructure security (use security-architect agent)

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

# bkend-security: Security Policies & Encryption Expert Skill

## 1. Multi-Layer Security Model

bkend.ai implements a defense-in-depth security architecture with multiple layers of protection. Each layer operates independently so that a breach in one layer does not compromise the entire system.

```
Request Flow:

  Client Request
       |
       v
  [ TLS 1.2+ ]              Layer 1: Transport encryption
       |
       v
  [ API Key Validation ]     Layer 2: Identify client type (Public/Secret)
       |
       v
  [ JWT Authentication ]     Layer 3: Verify user identity and session
       |
       v
  [ Row Level Security ]     Layer 4: Enforce data access policies per role
       |
       v
  [ AES-256-GCM ]           Layer 5: Data encrypted at rest
       |
       v
  [ Database ]               Secured data store
```

### Layer Summary

| Layer | Technology        | Purpose                              | Applied At       |
|-------|-------------------|--------------------------------------|------------------|
| 1     | TLS 1.2+          | Encrypt data in transit              | Network edge     |
| 2     | API Keys          | Identify and authorize client apps   | API gateway      |
| 3     | JWT               | Authenticate individual users        | Auth middleware   |
| 4     | RLS               | Enforce row-level data access        | Query engine     |
| 5     | AES-256-GCM       | Encrypt data at rest                 | Storage layer    |

---

## 2. API Keys

### 2.1 Key Format

All bkend.ai API keys follow a consistent format:

```
ak_<64 hexadecimal characters>
```

- **Prefix:** `ak_` identifies the string as a bkend.ai API key
- **Body:** 64 hex characters (256 bits of entropy)
- **Total length:** 67 characters

### 2.2 Key Storage

API keys are stored as **SHA-256 one-way hashes**. The original key value is never stored on bkend.ai servers.

```
Original key:  ak_a1b2c3d4e5f6...   (shown once at creation)
Stored hash:   sha256(ak_a1b2...)  = 9f86d081884c7d659a2feaa...
```

**Implications:**
- Lost keys cannot be recovered; a new key must be generated
- Key validation compares the SHA-256 hash of the submitted key against the stored hash
- Even if the database is compromised, original keys cannot be derived from the hashes

### 2.3 Key Types: Public vs Secret

bkend.ai provides two types of API keys with different security properties.

| Property            | Public Key                          | Secret Key                           |
|---------------------|-------------------------------------|--------------------------------------|
| **Exposure**        | Safe to expose in client-side code  | Must never be exposed to clients     |
| **RLS Enforcement** | Always enforced                     | Bypasses RLS (full access)           |
| **Use Case**        | Web apps, mobile apps, SPAs         | Server-side code, admin scripts, CI/CD |
| **Permissions**     | Limited by RLS role of the user     | Full read/write access to all data   |
| **Rate Limit**      | 100 requests/minute                 | 1000 requests/minute                 |
| **CORS**            | Restricted to allowed domains       | Not subject to CORS                  |

### 2.4 Key Creation

API keys can only be created through the bkend.ai Console:

1. Navigate to **Project Settings** > **API Keys**
2. Click **Create New Key**
3. Select key type: **Public** or **Secret**
4. Optionally set an expiration date
5. Click **Generate**
6. **Copy the key immediately** -- it is displayed only once

**Warning:** After closing the creation dialog, the key value can never be retrieved again. Store it securely in your environment variables or secret manager.

### 2.5 Key Usage in Requests

Include the API key in the `X-API-Key` header:

```http
GET /api/v1/tables/users/data
Host: api.bkend.ai
X-API-Key: ak_a1b2c3d4e5f6...
Authorization: Bearer <jwt_token>
```

- **Public Key** requests must also include a valid JWT token (from user authentication)
- **Secret Key** requests can optionally include a JWT token; without one, the request runs with full admin access

---

## 3. Row Level Security (RLS)

### 3.1 Overview

Row Level Security (RLS) controls which records a user can access based on their role. RLS policies are defined per table, per operation (read, create, update, delete) in the bkend.ai Console.

### 3.2 Four Roles

| Role      | Description                                  | Data Access                             | Typical Use                    |
|-----------|----------------------------------------------|-----------------------------------------|--------------------------------|
| `admin`   | Full access to all data                      | All records, all operations             | Admin dashboards, CMS          |
| `user`    | Access to own data via `createdBy` match     | Records where `createdBy == userId`     | User profiles, user content    |
| `guest`   | Access to public data only                   | Records where `isPublic == true`        | Public pages, catalogs         |
| `self`    | Access to own profile record only            | Single record where `_id == userId`     | Profile viewing/editing        |

### 3.3 Role Resolution

The user's role is determined from the JWT token at request time:

```
JWT Payload:
{
  "sub": "user_abc123",
  "role": "user",
  "orgId": "org_xyz",
  "iat": 1700000000,
  "exp": 1700003600
}
```

- The `role` field in the JWT determines which RLS policies are applied
- If no JWT is provided (Secret Key only), the request operates as `admin`
- Roles are assigned during user registration or by an admin via the Console

### 3.4 RLS Policy Configuration

RLS policies are configured per table in the bkend.ai Console:

1. Navigate to **Tables** > select a table > **Security** tab
2. For each operation (Read, Create, Update, Delete), configure access per role:

**Example: `posts` Table**

| Operation | admin | user                     | guest              | self |
|-----------|-------|--------------------------|--------------------|----- |
| Read      | All   | Own + public             | Public only        | N/A  |
| Create    | All   | Own only                 | Denied             | N/A  |
| Update    | All   | Own only (`createdBy`)   | Denied             | N/A  |
| Delete    | All   | Own only (`createdBy`)   | Denied             | N/A  |

**Example: `profiles` Table**

| Operation | admin | user   | guest       | self          |
|-----------|-------|--------|-------------|---------------|
| Read      | All   | All    | Public only | Own only      |
| Create    | All   | Denied | Denied      | Own only      |
| Update    | All   | Denied | Denied      | Own only      |
| Delete    | All   | Denied | Denied      | Denied        |

### 3.5 RLS Filter Injection

When RLS is active, the system automatically injects filter conditions into database queries:

```
User request:       GET /api/v1/tables/posts/data
User role:          user
User ID:            user_abc123

Injected filter:    { "createdBy": "user_abc123" }
Effective query:    db.posts.find({ ...userFilter, "createdBy": "user_abc123" })
```

This injection is transparent to the client and cannot be overridden.

### 3.6 RLS with Secret Key

When a request uses a Secret Key without a JWT token:
- RLS is **completely bypassed**
- The request has full admin-level access to all data
- This is by design for server-side administration scripts

**Important:** Never use a Secret Key in client-side code. Use Public Key + JWT for all client-facing applications.

---

## 4. Data Encryption

### 4.1 At Rest

| Component         | Encryption Method         | Key Management                     |
|--------------------|---------------------------|------------------------------------|
| MongoDB Atlas      | AES-256 encryption        | AWS KMS managed keys               |
| S3 Storage         | Server-side encryption    | AWS SSE-S3 managed keys            |
| Backups            | AES-256 encryption        | Separate backup encryption keys    |

All data stored in bkend.ai infrastructure is encrypted at rest using AES-256. Encryption keys are managed through AWS Key Management Service (KMS) and are rotated automatically.

### 4.2 In Transit

| Property              | Value                          |
|-----------------------|--------------------------------|
| Minimum TLS Version   | TLS 1.2                       |
| Preferred TLS Version | TLS 1.3                       |
| HSTS                  | Enabled (`max-age=31536000`)  |
| Certificate Authority | Let's Encrypt / AWS ACM       |
| Cipher Suites         | Modern suites only (no RC4, 3DES, SHA-1) |

All API communication is encrypted with TLS 1.2 or higher. HTTP requests are automatically redirected to HTTPS. HSTS headers ensure browsers always use HTTPS.

### 4.3 Password Hashing

User passwords are hashed using **Argon2id**, the winner of the Password Hashing Competition and recommended by OWASP.

| Parameter        | Value       | Rationale                            |
|------------------|-------------|--------------------------------------|
| Algorithm        | Argon2id    | Hybrid resistance to side-channel and GPU attacks |
| Memory Cost      | 64 MiB      | High memory usage deters GPU cracking |
| Iterations       | 3           | Balanced computation time            |
| Parallelism      | 4 threads   | Utilizes multi-core CPUs             |
| Salt Length       | 16 bytes    | Unique per password                  |
| Hash Length       | 32 bytes    | 256-bit output                       |

**Why Argon2id:**
- Memory-hard: requires significant RAM, making GPU/ASIC attacks expensive
- Hybrid variant: combines Argon2i (side-channel resistance) and Argon2d (GPU resistance)
- Configurable parameters allow tuning for the target hardware

### 4.4 API Key Hashing

API keys are hashed using **SHA-256** one-way hash:

```
Input:  ak_a1b2c3d4e5f6...  (67 characters)
Output: 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
```

- One-way: the original key cannot be derived from the hash
- Deterministic: the same key always produces the same hash (for validation)
- Fast: efficient for per-request validation

---

## 5. Environment Security

### 5.1 Separate Keys per Environment

Each environment (dev, staging, prod) has its own set of API keys:

```
Project: my-app
├── dev
│   ├── Public Key:  ak_dev_...
│   └── Secret Key:  ak_dev_secret_...
├── staging
│   ├── Public Key:  ak_staging_...
│   └── Secret Key:  ak_staging_secret_...
└── prod
    ├── Public Key:  ak_prod_...
    └── Secret Key:  ak_prod_secret_...
```

Keys from one environment cannot access data in another environment. This prevents accidental data leaks between environments.

### 5.2 Environment Variable Management

Store API keys and sensitive configuration in environment variables, never in source code:

```bash
# .env.development
BKEND_API_URL=https://api-client.bkend.ai
BKEND_PUBLIC_KEY=ak_dev_...
BKEND_SECRET_KEY=ak_dev_secret_...

# .env.production
BKEND_API_URL=https://api-client.bkend.ai
BKEND_PUBLIC_KEY=ak_prod_...
BKEND_SECRET_KEY=ak_prod_secret_...
```

**Rules:**
- Add `.env*` to `.gitignore` to prevent committing secrets
- Use a secret manager (AWS Secrets Manager, Vault, etc.) for production deployments
- Never log environment variables containing keys or tokens

### 5.3 Domain Allowlist for CORS

Configure allowed domains per environment to prevent unauthorized cross-origin requests:

```
dev:      http://localhost:3000, http://localhost:5173
staging:  https://staging.myapp.com
prod:     https://myapp.com, https://www.myapp.com
```

- Only Public Key requests are subject to CORS restrictions
- Secret Key requests bypass CORS (server-to-server only)
- Wildcard domains (`*.myapp.com`) are supported but not recommended for production

---

## 6. Security Best Practices

### 1. Never Expose Secret Key in Client Code

The Secret Key bypasses all RLS policies and grants full admin access. It must only be used in server-side code.

```
WRONG:
  <script>
    const API_KEY = "ak_secret_...";  // Visible to anyone inspecting the page
  </script>

RIGHT:
  // Server-side only (Node.js, Python, etc.)
  const API_KEY = process.env.BKEND_SECRET_KEY;
```

### 2. Use httpOnly Cookies for Token Storage

Store JWT tokens in httpOnly cookies to prevent XSS attacks from accessing them:

```http
Set-Cookie: token=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Path=/
```

- `HttpOnly`: prevents JavaScript access to the cookie
- `Secure`: cookie is only sent over HTTPS
- `SameSite=Strict`: prevents CSRF attacks

**Avoid:** storing tokens in `localStorage` or `sessionStorage` where they are accessible to JavaScript.

### 3. Enable MFA for Admin Accounts

Multi-Factor Authentication adds a second verification step for admin users:

1. Navigate to **Organization Settings** > **Security**
2. Enable **Require MFA for admins**
3. Admin users will be prompted to set up TOTP (authenticator app) on next login

### 4. Set Appropriate RLS Policies per Table

Review and configure RLS policies for every table:

- Use the principle of least privilege
- Default to `denied` and explicitly grant access
- Test policies by impersonating different roles in the Console

### 5. Rotate API Keys Periodically

Regular key rotation limits the impact of a compromised key:

- **Recommended rotation:** every 90 days for production keys
- **Process:** create a new key, update all consumers, then revoke the old key
- **Zero-downtime:** maintain two active keys during the transition period

### 6. Use Environment-Specific Keys

Never share keys across environments:

- Development keys should only access development data
- Production keys should be stored in a secret manager
- Staging keys should use production-like security but with test data

### 7. Validate All User Input Server-Side

Never trust client-side validation alone:

- Validate data types, lengths, and formats on the server
- Use bkend.ai field-level validation rules (min, max, pattern, required)
- Sanitize user input to prevent injection attacks

### 8. Use HTTPS-Only for All API Calls

All bkend.ai API endpoints enforce HTTPS:

- HTTP requests are automatically redirected to HTTPS (301)
- HSTS headers prevent downgrade attacks
- Ensure your application code always uses `https://` URLs
- Configure your CDN/proxy to enforce HTTPS at the edge

---

## Quick Reference Card

### API Key Header

```http
X-API-Key: ak_<64 hex characters>
```

### RLS Role Summary

| Role    | Access Level              | Key Requirement   |
|---------|---------------------------|-------------------|
| admin   | All records               | Secret Key or JWT |
| user    | Own records (createdBy)   | Public Key + JWT  |
| guest   | Public records only       | Public Key        |
| self    | Own profile only          | Public Key + JWT  |

### Encryption Summary

| Data Type       | Algorithm    | Key Size  |
|-----------------|-------------|-----------|
| Data at rest    | AES-256-GCM | 256-bit   |
| Data in transit | TLS 1.2+    | 256-bit   |
| Passwords       | Argon2id    | 256-bit   |
| API keys        | SHA-256     | 256-bit   |

### Security Checklist

- [ ] Secret Key stored in environment variables only
- [ ] JWT tokens stored in httpOnly cookies
- [ ] MFA enabled for admin accounts
- [ ] RLS policies configured for all tables
- [ ] API keys rotated within the last 90 days
- [ ] Environment-specific keys in use
- [ ] Server-side input validation enabled
- [ ] All API calls use HTTPS
