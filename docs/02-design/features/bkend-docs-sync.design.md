# bkend-docs-sync Design Document

> **Summary**: bkend.ai 공식 문서 109건 + 5개 예제 앱의 분석 결과를 bkit-gemini v1.5.2에 반영하기 위한 상세 기술 설계서
>
> **Project**: bkit-gemini
> **Version**: 1.5.1 → 1.5.2
> **Author**: CTO Team (5-Agent Analysis + Design)
> **Date**: 2026-02-14
> **Status**: Draft
> **Planning Doc**: [bkend-docs-sync.plan.md](../01-plan/features/bkend-docs-sync.plan.md)

### Pipeline References

| Phase | Document | Status |
|-------|----------|--------|
| Phase 1 | Schema Definition | N/A (Extension project) |
| Phase 2 | Coding Conventions | N/A (bkit.config.json conventions) |
| Phase 3 | Mockup | N/A (CLI Extension, no UI) |
| Phase 4 | API Spec | N/A (Hook/MCP protocol based) |

### Research Sources

| Source | Method | Key Findings |
|--------|--------|--------------|
| bkend-docs v0.0.10 | 5-Agent 병렬 분석 (109 docs) | 92% 격차, Critical 오류 3건, 64 Auth 엔드포인트, 28 MCP 도구 |
| Gemini CLI 공식 문서 | WebSearch + WebFetch | Extension architecture, Hook lifecycle, skills/agents/commands 패턴 |
| Gemini CLI GitHub | Issue/PR 분석 | Hook Support in Extensions (#14449), Skills experimental feature |
| bkit-gemini 코드베이스 | 전체 파일 분석 | 21 skills, 16 agents, 10 commands, 6 context, 17 hooks, 6 lib modules |

---

## 1. Overview

### 1.1 Design Goals

1. **bkend.ai 공식 문서 95%+ 커버리지**: 현재 ~10% → 95%+ 달성
2. **Critical 오류 0건**: PostgreSQL→MongoDB, SDK→REST, Refresh Token 수명 수정
3. **Progressive Disclosure 유지**: 8개 신규 스킬 모두 on-demand 로딩으로 컨텍스트 토큰 절약
4. **기존 아키텍처 완벽 준수**: Gemini CLI extension 패턴 (SKILL.md frontmatter, TOML commands, hooks.json) 100% 준수
5. **테스트 커버리지**: 새 컴포넌트 전체에 대한 검증 테스트 추가

### 1.2 Design Principles

- **Existing Pattern First**: 기존 21개 스킬의 frontmatter 형식, TOML 명령어 형식, 테스트 패턴을 정확히 따름
- **Modular Knowledge**: 대규모 bkend 지식을 8개 도메인 스킬로 분리하여 필요 시에만 로딩
- **Single Source of Truth**: bkend-expert.md는 에이전트 행동 규칙만, 도메인 지식은 스킬에 위임
- **REST API 패턴 표준화**: `bkendFetch` 래퍼 패턴을 모든 bkend-* 스킬에서 일관되게 사용
- **Version Pinning**: bkend-docs v0.0.10 기준, 향후 버전 변경 추적을 위한 메타데이터 포함

### 1.3 Scope

**In Scope:**
- agents/bkend-expert.md 전면 재작성
- skills/dynamic/SKILL.md Critical Fix
- 8개 신규 bkend-* 스킬 생성
- 8개 신규 TOML 커맨드 생성
- 6개 context 모듈 업데이트
- bkit.config.json, gemini-extension.json, GEMINI.md, README.md 업데이트
- 테스트 업데이트 (tc02, tc03, tc06, verify-components)

**Out of Scope:**
- Hook 스크립트 수정 (기존 10-event 시스템 유지)
- lib/ 모듈 수정 (skill-orchestrator.js는 동적으로 새 스킬 감지)
- MCP spawn-agent-server.js 수정 (에이전트 수 변경 없음)
- 새 에이전트 추가 (bkend-expert 1개 유지)

---

## 2. Architecture

### 2.1 현재 vs 목표 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    bkit-gemini v1.5.2 bkend Architecture                │
│                                                                         │
│  현재 (v1.5.1)                    목표 (v1.5.2)                         │
│  ═══════════════                  ═══════════════                       │
│                                                                         │
│  agents/                          agents/                               │
│  └── bkend-expert.md (146행)      └── bkend-expert.md (400행, 재작성)    │
│      ❌ useAuth (미존재)              ✅ REST API 패턴                    │
│      ❌ PostgreSQL 언급               ✅ MCP 도구 카탈로그                │
│      ❌ 트러블슈팅 4행               ✅ 30+ 에러 코드                    │
│                                                                         │
│  skills/                          skills/                               │
│  └── dynamic/SKILL.md (128행)     ├── dynamic/SKILL.md (200행, 수정)     │
│      ❌ "Managed PostgreSQL"          ✅ "MongoDB Atlas"                 │
│      ❌ @bkend/sdk                    ✅ REST API 직접 호출              │
│      ❌ "REST & GraphQL"              ✅ "REST API only"                 │
│                                   ├── bkend-quickstart/SKILL.md (NEW)    │
│                                   ├── bkend-auth/SKILL.md (NEW)          │
│                                   ├── bkend-data/SKILL.md (NEW)          │
│                                   ├── bkend-storage/SKILL.md (NEW)       │
│                                   ├── bkend-mcp/SKILL.md (NEW)           │
│                                   ├── bkend-security/SKILL.md (NEW)      │
│                                   ├── bkend-cookbook/SKILL.md (NEW)       │
│                                   └── bkend-guides/SKILL.md (NEW)        │
│                                                                         │
│  commands/                        commands/                             │
│  └── dynamic.toml (1개)           ├── dynamic.toml (수정)                │
│                                   ├── bkend-quickstart.toml (NEW)        │
│                                   ├── bkend-auth.toml (NEW)              │
│                                   ├── bkend-data.toml (NEW)              │
│                                   ├── bkend-storage.toml (NEW)           │
│                                   ├── bkend-mcp.toml (NEW)               │
│                                   ├── bkend-security.toml (NEW)          │
│                                   ├── bkend-cookbook.toml (NEW)           │
│                                   └── bkend-guides.toml (NEW)            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 스킬 계층 구조 (Skill Dependency Graph)

```
                    /dynamic (Level Skill)
                         │
                         │ imports: [bkend-quickstart, bkend-auth, ...]
                         │
        ┌────────────────┼────────────────────────────┐
        │                │                              │
   bkend-quickstart  bkend-auth                    bkend-data
   (온보딩)          (인증 21 docs)                (DB 13 docs)
                         │
                    ┌────┴────┐
                    │         │
              bkend-security  bkend-mcp
              (보안 8 docs)   (MCP+AI 18 docs)
                    │
               bkend-storage
               (파일 10 docs)

   bkend-cookbook ──── bkend-guides
   (4 프로젝트+5 앱)   (운영+트러블슈팅)
```

### 2.3 데이터 흐름 (스킬 활성화)

```
User: "로그인 구현해줘"
  ↓
BeforeAgent Hook (intent detection)
  ↓ trigger: "로그인" → skill: dynamic + agent: bkend-expert
  ↓
Skill Orchestrator (lib/skill-orchestrator.js)
  ↓ loadSkill('dynamic') → metadata.imports: [bkend-auth, ...]
  ↓ On-demand: 사용자가 "인증" 관련 질문 시 bkend-auth 스킬 활성화
  ↓
bkend-expert Agent (agents/bkend-expert.md)
  ↓ REST API 패턴 + MCP 도구 지식으로 구현 가이드
  ↓
Response
```

### 2.4 Context Token Budget

```
현재 bkend 관련 Context 소비:
  GEMINI.md                      : ~1,200 tokens (6 @import 포함)
  agents/bkend-expert.md          : ~500 tokens (활성화 시)
  skills/dynamic/SKILL.md         : ~400 tokens (활성화 시)
  ─────────────────────────────────────────────
  총 상시 로딩                     : ~1,200 tokens
  총 활성화 시 최대               : ~2,100 tokens

목표 v1.5.2 Context 소비:
  GEMINI.md                      : ~1,200 tokens (변경 없음)
  agents/bkend-expert.md          : ~1,200 tokens (활성화 시, 3배 증가)
  skills/dynamic/SKILL.md         : ~600 tokens (활성화 시)
  skills/bkend-auth/SKILL.md      : ~1,500 tokens (on-demand)
  skills/bkend-data/SKILL.md      : ~1,200 tokens (on-demand)
  skills/bkend-storage/SKILL.md   : ~1,000 tokens (on-demand)
  skills/bkend-mcp/SKILL.md       : ~1,200 tokens (on-demand)
  skills/bkend-security/SKILL.md  : ~900 tokens (on-demand)
  skills/bkend-quickstart/SKILL.md: ~900 tokens (on-demand)
  skills/bkend-cookbook/SKILL.md   : ~1,500 tokens (on-demand)
  skills/bkend-guides/SKILL.md    : ~1,000 tokens (on-demand)
  ─────────────────────────────────────────────
  총 상시 로딩                     : ~1,200 tokens (변경 없음!)
  총 활성화 시 최대               : ~11,200 tokens (한 번에 전부 로드 안 함)
  일반적인 세션 (1-2 스킬 활성)    : ~3,600 tokens

결론: Progressive Disclosure 덕분에 상시 로딩은 변경 없음.
```

---

## 3. 파일별 상세 설계

### 3.1 agents/bkend-expert.md (전면 재작성)

**변경 사유**: REST API 헤더 누락, 미존재 SDK 패턴 사용, MCP 도구 체계 미반영, 트러블슈팅 부실

**Frontmatter (변경 없음):**
```yaml
---
name: bkend-expert
description: |
  bkend.ai BaaS platform expert agent.
  Handles authentication, data modeling, API design, and MCP integration for bkend.ai projects.

  Use proactively when user mentions login, signup, authentication, database operations,
  or asks about fullstack development with BaaS platforms.

  Triggers: bkend, BaaS, authentication, login, signup, database, fullstack, backend,
  API integration, data model, 인증, 로그인, 회원가입, 데이터베이스, 풀스택, 백엔드,
  認証, ログイン, データベース, autenticación, 身份验证, 数据库,
  authentification, connexion, inscription, base de données, fullstack, backend,
  Authentifizierung, Anmeldung, Registrierung, Datenbank, Fullstack, Backend,
  autenticazione, accesso, registrazione, database, fullstack, backend

  Do NOT use for: static websites without backend, infrastructure tasks, pure frontend styling,
  or enterprise microservices architecture.

model: gemini-2.5-flash
tools:
  - read_file
  - write_file
  - replace
  - glob_tool
  - grep_search
  - run_shell_command
  - web_fetch
temperature: 0.3
max_turns: 20
timeout_mins: 10
---
```

**Body 구조 (재작성):**

```markdown
# bkend.ai Expert Agent

## Role
Full-stack development expert utilizing the bkend.ai BaaS platform.
All guidance is based on bkend-docs v0.0.10 official documentation.

## bkend.ai Platform Overview
- Backend-as-a-Service with MongoDB Atlas database
- REST API at https://api-client.bkend.ai
- MCP server at https://api.bkend.ai/mcp (OAuth 2.1 + PKCE)
- Resource hierarchy: Organization > Project > Environment

## Required HTTP Headers (All API Calls)
| Header | Value | Required |
|--------|-------|----------|
| X-Project-Id | {project_id} | Always |
| X-Environment | dev / staging / prod | Always |
| Content-Type | application/json | POST/PUT |
| Authorization | Bearer {accessToken} | Authenticated endpoints |

## bkendFetch Wrapper Pattern
```typescript
async function bkendFetch(path: string, options: RequestInit = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_BKEND_API_URL || 'https://api-client.bkend.ai';
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Project-Id': process.env.NEXT_PUBLIC_BKEND_PROJECT_ID!,
      'X-Environment': process.env.NEXT_PUBLIC_BKEND_ENVIRONMENT || 'dev',
      ...options.headers,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new BkendError(response.status, error);
  }
  return response.json();
}
```

## Authentication Patterns
### Email Signup
POST /auth/email/signup
Body: { email, password, name? }
Response: { accessToken, refreshToken, user }

### Email Login
POST /auth/email/signin
Body: { email, password }
Response: { accessToken, refreshToken, user }

### Token Management
- Access Token: 1 hour lifetime
- Refresh Token: 30 days lifetime
- POST /auth/token/refresh { refreshToken }
- Store: httpOnly cookie (server) or secure localStorage (client)

### Social Login (OAuth)
GET /auth/social/{provider}?redirectUri=...
Providers: google, github

## MCP Tool System
### Available Tools (28 total)
Fixed (3): get_context, search_docs, get_operation_schema
Project (6): backend_org_list, backend_project_list/create/get, backend_env_list/create
Table (9): backend_table_list/create/get/update/delete, backend_field_manage, backend_index_manage, backend_schema_version_list/get
Data CRUD (5): backend_data_list/get/create/update/delete

### MCP Limitations
- Auth & Storage: NO MCP tools → use REST API directly
- Table creation: Console or MCP only (not REST API)
- Use search_docs tool to get REST API code for auth/storage

## Database Patterns
### Column Types (7)
string, int, double, bool, date, object, array

### System Fields (auto-generated)
id, createdBy, createdAt, updatedAt

### CRUD REST API
- POST /v1/data/:tableName (create/batch)
- GET /v1/data/:tableName/:id (read one)
- GET /v1/data/:tableName (list with filter/sort/page)
- PUT /v1/data/:tableName/:id (update)
- DELETE /v1/data/:tableName/:id (delete)

### Filter Operators (10)
$eq, $ne, $gt, $gte, $lt, $lte, $in, $nin, $regex, $exists

## Security Model
### 4 RLS Roles
admin (full), user (own data), guest (public only), self (own profile)

### API Keys
Format: ak_ + 64 hex chars, SHA-256 hashed, shown once at creation

## Work Rules
### When Changing Data Model
1. Update docs/02-design/data-model.md first
2. Analyze impact scope
3. Create/modify tables via bkend Console or MCP
4. Sync frontend types

### When Adding API
1. Check if MCP tool exists (Table/Data CRUD)
2. If auth/storage: use REST API directly
3. Add bkendFetch calls with proper headers
4. Add type definitions

### When Implementing Authentication
1. Use REST API endpoints (NOT SDK)
2. Implement token storage (httpOnly cookie recommended)
3. Set up refresh token rotation
4. Implement protected route middleware

## Troubleshooting
| Problem | Cause | Solution |
|---------|-------|----------|
| 401 Unauthorized | Token expired | Refresh with POST /auth/token/refresh |
| 401 INVALID_TOKEN | Malformed token | Re-authenticate, check token format |
| 403 PERMISSION_DENIED | RLS policy | Check role, verify table RLS settings |
| 404 TABLE_NOT_FOUND | Table missing | Create via Console or MCP tool |
| 400 VALIDATION_ERROR | Schema mismatch | Check column types and constraints |
| 400 DUPLICATE_KEY | Unique violation | Check unique index on field |
| 413 FILE_TOO_LARGE | Storage limit | Check file size limits |
| CORS error | Domain not registered | Add domain in bkend Console |
| Slow queries | Missing index | Add index on frequently queried fields |
| MCP connection failed | OAuth expired | Re-authenticate MCP OAuth |

## Reference Skills
For detailed domain knowledge, activate these skills:
- `bkend-quickstart`: Platform onboarding and core concepts
- `bkend-auth`: Authentication implementation (21 docs)
- `bkend-data`: Database CRUD operations (13 docs)
- `bkend-storage`: File storage and uploads (10 docs)
- `bkend-mcp`: MCP tools and AI integration (18 docs)
- `bkend-security`: Security policies and encryption (8 docs)
- `bkend-cookbook`: Project tutorials and examples (4+5)
- `bkend-guides`: Operational guides and troubleshooting (16 docs)
```

**예상 행수**: ~400행 (현재 146행 → 3배)

---

### 3.2 skills/dynamic/SKILL.md (Critical Fix)

**변경 사항:**

| 위치 | 현재 (❌) | 수정 (✅) |
|------|----------|----------|
| Line ~66 | `Database: Managed PostgreSQL` | `Database: MongoDB Atlas (REST API)` |
| Line ~69 | `API: Auto-generated REST & GraphQL` | `API: REST API (GraphQL 미지원)` |
| Line ~119-127 | `import { createClient } from '@bkend/sdk'` | `bkendFetch` REST API 패턴 |
| Frontmatter imports | `imports: []` | `imports: []` (스킬 간 import는 동적) |

**수정된 bkend.ai Features 섹션:**
```markdown
## bkend.ai Features

- **Authentication**: Email, OAuth (Google, GitHub), Magic Links
- **Database**: MongoDB Atlas (REST API)
- **Storage**: S3 Presigned URL file uploads
- **Real-time**: WebSocket subscriptions (준비 중)
- **API**: REST API (https://api-client.bkend.ai)
- **MCP**: 28 tools + 4 resources (https://api.bkend.ai/mcp)
```

**수정된 Authentication Example:**
```markdown
## Authentication Example

```typescript
// lib/bkend/client.ts - REST API Direct Call Pattern
const BKEND_API_URL = process.env.NEXT_PUBLIC_BKEND_API_URL || 'https://api-client.bkend.ai';

async function bkendFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(`${BKEND_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Project-Id': process.env.NEXT_PUBLIC_BKEND_PROJECT_ID!,
      'X-Environment': process.env.NEXT_PUBLIC_BKEND_ENVIRONMENT || 'dev',
      ...options.headers,
    },
  });
  if (!response.ok) throw new Error(`bkend API error: ${response.status}`);
  return response.json();
}

// Login
const { accessToken, refreshToken, user } = await bkendFetch('/auth/email/signin', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});
```
```

**추가 섹션: bkend-* Skills Reference:**
```markdown
## Available bkend Skills

For detailed domain knowledge, use these dedicated skills:

| Skill | Command | Domain |
|-------|---------|--------|
| bkend-quickstart | `/bkend-quickstart` | 온보딩, 핵심 개념 |
| bkend-auth | `/bkend-auth` | 인증 (21 docs) |
| bkend-data | `/bkend-data` | 데이터베이스 (13 docs) |
| bkend-storage | `/bkend-storage` | 파일 스토리지 (10 docs) |
| bkend-mcp | `/bkend-mcp` | MCP + AI 도구 (18 docs) |
| bkend-security | `/bkend-security` | 보안 (8 docs) |
| bkend-cookbook | `/bkend-cookbook` | 실전 프로젝트 (4+5) |
| bkend-guides | `/bkend-guides` | 운영 가이드 (16 docs) |
```

---

### 3.3 신규 스킬 상세 설계 (8개)

모든 스킬은 다음 공통 frontmatter 패턴을 따름:

```yaml
---
name: bkend-{domain}
description: |
  {description}

  {triggers}

  Do NOT use for: {exclusions}

# ──── NEW FIELDS (v1.5.1) ────
user-invocable: true
argument-hint: ""

allowed-tools:
  - read_file
  - write_file
  - replace
  - glob_tool
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
```

#### 3.3.1 skills/bkend-quickstart/SKILL.md

**Source**: en/getting-started/ (7 docs) + en/console/ (12 docs)
**예상 행수**: ~300행

**Content 구조:**
```
# bkend.ai Quick Start Guide

## What is bkend.ai
- BaaS (Backend-as-a-Service) 플랫폼
- MongoDB Atlas 기반 데이터베이스
- REST API + MCP 프로토콜
- 인증, 스토리지, 보안 내장

## Core Concepts
### Resource Hierarchy
Organization → Project → Environment (dev/staging/prod)

### Tenant vs User
- Tenant: Organization 소유자/관리자
- User: 앱 사용자 (email/social 로그인)

### API Structure
- Base URL: https://api-client.bkend.ai
- MCP URL: https://api.bkend.ai/mcp
- Required: X-Project-Id, X-Environment headers

## Quick Start Steps
1. bkend.ai Console 회원가입
2. Organization 생성
3. Project 생성
4. Environment 설정 (dev)
5. Table 생성 (Console 또는 MCP)
6. API Key 발급
7. 앱에서 REST API 호출

## MCP Setup (Gemini CLI)
.gemini/settings.json:
{
  "mcpServers": {
    "bkend": {
      "httpUrl": "https://api.bkend.ai/mcp"
    }
  }
}

## Framework Quick Start
### Next.js Setup
- env vars, lib/bkend/client.ts, middleware.ts

### Flutter Setup
- DioClient, interceptors, providers

## Console Guide (Summary)
- Projects: 생성, 설정, 삭제
- Environments: dev/staging/prod 관리
- Tables: 스키마 관리, 필드 추가
- API Keys: 발급, 관리
- Team: 멤버 초대, 역할 관리
```

#### 3.3.2 skills/bkend-auth/SKILL.md

**Source**: en/authentication/ (21 docs)
**예상 행수**: ~500행 (가장 큰 스킬)

**Content 구조:**
```
# bkend.ai Authentication Guide

## Auth Overview
- JWT 기반 (Access 1h + Refresh 30d)
- 4 methods: email+password, magic-link, google, github
- Required: X-Project-Id, X-Environment

## Email Authentication
### Signup: POST /auth/email/signup
Request: { email, password, name?, metadata? }
Response: { accessToken, refreshToken, user, expiresIn }
Errors: EMAIL_ALREADY_EXISTS, VALIDATION_ERROR, WEAK_PASSWORD

### Login: POST /auth/email/signin
Request: { email, password }
Response: { accessToken, refreshToken, user, expiresIn }
Errors: INVALID_CREDENTIALS, USER_NOT_FOUND, ACCOUNT_LOCKED

### Email Verification
POST /auth/email/verify { token }
POST /auth/email/verify/resend { email }

## Magic Link Authentication
POST /auth/magiclink/send { email, redirectUri }
GET /auth/magiclink/verify?token=...&redirectUri=...

## Social Login (OAuth)
### Google OAuth
1. Console에서 Google Client ID/Secret 등록
2. GET /auth/social/google?redirectUri=...
3. Callback에서 accessToken, refreshToken 수신

### GitHub OAuth
1. Console에서 GitHub Client ID/Secret 등록
2. GET /auth/social/github?redirectUri=...
3. Callback 처리

## Token Management
### Token Refresh
POST /auth/token/refresh { refreshToken }
Response: { accessToken, refreshToken, expiresIn }

### Token Storage Patterns
Server-side: httpOnly cookie (recommended)
Client-side: memory + localStorage (SPA fallback)

### Auto-refresh Pattern (Next.js middleware)
```typescript
// middleware.ts
if (isTokenExpired(accessToken)) {
  const { accessToken: newToken } = await bkendFetch('/auth/token/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
  // Set new cookie
}
```

## Session Management
POST /auth/session/revoke
POST /auth/session/revoke-all
GET /auth/session/list

## Password Management
POST /auth/password/forgot { email }
POST /auth/password/reset { token, newPassword }
PUT /auth/password/change { currentPassword, newPassword }

## Multi-Factor Authentication (MFA)
POST /auth/mfa/setup → { secret, qrCodeUrl }
POST /auth/mfa/verify { code }
POST /auth/mfa/disable { code }

## Account Linking
POST /auth/link/{provider} { redirectUri }
DELETE /auth/link/{provider}

## Invitation System
POST /auth/invite { email, role }
POST /auth/invite/accept { token }

## User Management
GET /users (admin only, with pagination)
GET /users/:id
PUT /users/:id { name, metadata }
DELETE /users/:id (account deletion)
GET /users/me (current user profile)
PUT /users/me { name, avatar }

## Auth Form Patterns (React/Next.js)
- LoginForm component template
- SignupForm component template
- AuthProvider context
- useAuth hook pattern
- Protected route HOC

## Error Codes Reference (30+)
| Code | HTTP | Description |
|------|------|-------------|
| INVALID_CREDENTIALS | 401 | Wrong email/password |
| TOKEN_EXPIRED | 401 | Access token expired |
| REFRESH_TOKEN_EXPIRED | 401 | Refresh token expired |
| EMAIL_ALREADY_EXISTS | 409 | Duplicate email |
| ...
```

#### 3.3.3 skills/bkend-data/SKILL.md

**Source**: en/database/ (13 docs)
**예상 행수**: ~400행

**Content 구조:**
```
# bkend.ai Database Guide

## Overview
- MongoDB Atlas 기반
- 프로젝트별 격리
- 스키마 검증 + RLS

## Data Model
### Column Types (7)
| Type | Description | Example |
|------|-------------|---------|
| string | UTF-8 text | "hello" |
| int | 32-bit integer | 42 |
| double | 64-bit float | 3.14 |
| bool | true/false | true |
| date | ISO 8601 | "2026-01-01T00:00:00Z" |
| object | Nested JSON | { key: "value" } |
| array | JSON array | [1, 2, 3] |

### System Fields (자동)
id, createdBy, createdAt, updatedAt

### Constraints
required, unique, default, min, max, enum

### Default Indexes
_id_, idx_createdAt_desc, idx_updatedAt_desc, idx_createdBy

## CRUD REST API (Complete)
### Create: POST /v1/data/:tableName
Single: { field1: "value" }
Batch: [{ field1: "a" }, { field1: "b" }]

### Read One: GET /v1/data/:tableName/:id

### List: GET /v1/data/:tableName
Query params: filter, sort, limit (max 100), cursor, search, searchType

### Update: PUT /v1/data/:tableName/:id
Body: { field1: "new value" }

### Delete: DELETE /v1/data/:tableName/:id

### Table Spec: GET /v1/data/:tableName/spec
Returns: schema definition, fields, indexes

## Filtering
### AND (default)
filter: { status: { $eq: "active" }, age: { $gte: 18 } }

### OR
filter: { $or: [{ status: "active" }, { role: "admin" }] }

### Operators (10)
$eq, $ne, $gt, $gte, $lt, $lte, $in, $nin, $regex, $exists

### Search
search=keyword&searchType=partial

## Sorting & Pagination
sort: { createdAt: -1 }
limit: 20 (max 100)
cursor: "last_id_value"

## Relations
### 1:N
posts table: authorId (reference to users)
Join: GET /v1/data/posts?join=authorId

### N:M
Junction table pattern:
post_tags: { postId, tagId }

## Frontend CRUD Pattern (TanStack Query)
```typescript
// Query Key Factory
const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (filters: PostFilters) => [...postKeys.lists(), filters] as const,
  detail: (id: string) => [...postKeys.all, 'detail', id] as const,
};
```

## Error Codes
| Code | HTTP | Description |
|------|------|-------------|
| TABLE_NOT_FOUND | 404 | Table does not exist |
| VALIDATION_ERROR | 400 | Schema validation failed |
| DUPLICATE_KEY | 400 | Unique constraint violated |
| PERMISSION_DENIED | 403 | RLS policy blocked |
| INVALID_FILTER | 400 | Malformed filter syntax |
| RECORD_NOT_FOUND | 404 | Document ID not found |
| LIMIT_EXCEEDED | 400 | Limit > 100 |
```

#### 3.3.4 skills/bkend-storage/SKILL.md

**Source**: en/storage/ (10 docs)
**예상 행수**: ~350행

**Content 구조:**
```
# bkend.ai Storage Guide

## Overview
- S3 기반 Presigned URL 패턴
- CDN 제공
- 4 visibility levels

## Single File Upload (3-Step)
1. Presigned URL 요청: POST /v1/files/presigned-url
   Body: { fileName, contentType, visibility, tableName?, recordId? }
   Response: { presignedUrl, fileKey }

2. S3 직접 업로드: PUT {presignedUrl}
   Headers: Content-Type: {contentType}
   Body: <file binary>

3. 메타데이터 등록: POST /v1/files
   Body: { fileKey, fileName, contentType, size, visibility }

## Multiple File Upload
동일 3-Step, 각 파일에 대해 반복
POST /v1/files/presigned-urls (batch)

## Multipart Upload (대용량)
1. POST /v1/files/multipart/init
2. POST /v1/files/multipart/presigned-url (각 파트)
3. PUT {presignedUrl} (각 파트 업로드)
4. POST /v1/files/multipart/complete
취소: POST /v1/files/multipart/abort

## File Download
### CDN (public): GET https://cdn.bkend.ai/{fileKey}
### Presigned (private): GET /v1/files/{fileId}/download

## Visibility Levels (4)
| Level | Access | Use Case |
|-------|--------|----------|
| public | Anyone | Profile images, public assets |
| private | Owner only | Personal documents |
| protected | Authenticated users | Team files |
| shared | Specified users | Collaboration |

## File Metadata
GET /v1/files/:fileId
PUT /v1/files/:fileId { visibility, metadata }
DELETE /v1/files/:fileId
GET /v1/files (list with filter)

## Frontend Upload Pattern
```typescript
async function uploadFile(file: File, visibility = 'private') {
  // 1. Get presigned URL
  const { presignedUrl, fileKey } = await bkendFetch('/v1/files/presigned-url', {
    method: 'POST',
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      visibility,
    }),
  });
  // 2. Upload to S3
  await fetch(presignedUrl, { method: 'PUT', body: file,
    headers: { 'Content-Type': file.type } });
  // 3. Register metadata
  return bkendFetch('/v1/files', {
    method: 'POST',
    body: JSON.stringify({ fileKey, fileName: file.name,
      contentType: file.type, size: file.size, visibility }),
  });
}
```
```

#### 3.3.5 skills/bkend-mcp/SKILL.md

**Source**: en/mcp/ (9 docs) + en/ai-tools/ (9 docs)
**예상 행수**: ~400행

**Content 구조:**
```
# bkend.ai MCP & AI Tools Guide

## MCP Overview
- Protocol: MCP 2025-03-26
- Transport: Streamable HTTP
- Auth: OAuth 2.1 + PKCE
- Server URL: https://api.bkend.ai/mcp

## MCP Tool Catalog (28 Tools)

### Fixed Tools (3) - Always Available
| Tool | Description |
|------|-------------|
| get_context | Current session context (org, project, env) |
| search_docs | Search bkend documentation |
| get_operation_schema | Get tool parameter schema |

### Project Management (6)
| Tool | Description |
|------|-------------|
| backend_org_list | List organizations |
| backend_project_list | List projects |
| backend_project_create | Create project |
| backend_project_get | Get project details |
| backend_env_list | List environments |
| backend_env_create | Create environment |

### Table Management (9)
| Tool | Description |
|------|-------------|
| backend_table_list | List tables |
| backend_table_create | Create table |
| backend_table_get | Get table schema |
| backend_table_update | Update table settings |
| backend_table_delete | Delete table |
| backend_field_manage | Add/modify/delete fields |
| backend_index_manage | Manage indexes |
| backend_schema_version_list | List schema versions |
| backend_schema_version_get | Get specific version |

### Data CRUD (5)
| Tool | Description |
|------|-------------|
| backend_data_list | List records with filter/sort |
| backend_data_get | Get single record |
| backend_data_create | Insert record(s) |
| backend_data_update | Update record |
| backend_data_delete | Delete record |

## MCP Resources (4)
| URI | Description |
|-----|-------------|
| bkend://context | Session context |
| bkend://tables | Available tables |
| bkend://schema/{table} | Table schema |
| bkend://docs/{topic} | Documentation |

## Auth & Storage MCP 대안
Auth, Storage는 MCP 도구 미제공.
→ search_docs로 REST API 문서 검색 후 코드 생성

예시: "search_docs: how to implement email login"
→ POST /auth/email/signin REST API 코드 생성

## AI Tool Setup

### Gemini CLI (.gemini/settings.json)
```json
{
  "mcpServers": {
    "bkend": {
      "httpUrl": "https://api.bkend.ai/mcp"
    }
  }
}
```

### Claude Code (.mcp.json)
```json
{
  "mcpServers": {
    "bkend": {
      "type": "streamable-http",
      "url": "https://api.bkend.ai/mcp"
    }
  }
}
```

### Cursor
1. Settings → MCP → Add Server
2. Type: HTTP
3. URL: https://api.bkend.ai/mcp
4. OAuth 인증

## OAuth 2.1 Flow
1. MCP client → /oauth/authorize?client_id=...&code_challenge=...
2. User login at bkend.ai
3. Auth code redirect → /oauth/token
4. Access token (1h) + Refresh token (30d)
```

#### 3.3.6 skills/bkend-security/SKILL.md

**Source**: en/security/ (8 docs)
**예상 행수**: ~300행

**Content 구조:**
```
# bkend.ai Security Guide

## Multi-Layer Security Model
API Keys → JWT Auth → RLS → TLS 1.2+ → AES-256-GCM

## API Keys
- Format: ak_ + 64 hex characters
- Storage: SHA-256 one-way hash (원본 저장 안 함)
- Types: Public Key (클라이언트), Secret Key (서버)
- 발급: Console에서만 가능, 생성 시 1회 표시

### Public vs Secret Key
| Feature | Public Key | Secret Key |
|---------|-----------|------------|
| Exposure | Client-side OK | Server-side ONLY |
| RLS | Applied | Bypassed |
| Use case | Frontend apps | Server scripts, admin |

## Row Level Security (RLS)
### 4 Roles
| Role | Access | Determined By |
|------|--------|---------------|
| admin | Full CRUD on all data | Secret Key or admin flag |
| user | Own data (createdBy match) | Valid access token |
| guest | Public data only | No auth header |
| self | Own profile only | Token + user ID match |

### RLS Policy Configuration (Console)
Per-table, per-operation (create/read/update/delete) settings

## Data Encryption
### At Rest
- MongoDB Atlas: AES-256 encryption
- Storage: S3 server-side encryption

### In Transit
- TLS 1.2+ enforced
- HSTS headers

### Passwords
- Argon2id (64 MiB memory, 3 iterations, 4 threads)
- Never stored in plaintext

### API Keys
- SHA-256 one-way hash
- Original never stored

## Best Practices
1. Never expose Secret Key in client code
2. Use httpOnly cookies for token storage
3. Enable MFA for admin accounts
4. Set appropriate RLS policies per table
5. Rotate API keys periodically
6. Use environment-specific keys (dev/staging/prod)
7. Validate all user input server-side
8. Use HTTPS-only for all API calls
```

#### 3.3.7 skills/bkend-cookbook/SKILL.md

**Source**: cookbooks/ (4 projects) + examples/ (5 apps)
**예상 행수**: ~500행

**Content 구조:**
```
# bkend.ai Cookbook

## Projects Overview
| Project | Level | Tables | Stack | Quick Start |
|---------|-------|--------|-------|-------------|
| Blog | Beginner | 3 | Next.js | 5분 |
| Recipe App | Intermediate | 5 | Next.js + Flutter | 10분 |
| Shopping Mall | Intermediate | 4 | Next.js | 10분 |
| Social Network | Beginner | 5 | Flutter | 10분 |

## Blog Project
### Schema (3 tables)
- users: { name, email, avatar }
- posts: { title, content, authorId, status, tags }
- comments: { content, postId, authorId }

### Quick Start (5분)
1. Project 생성 → 2. Tables 생성 → 3. API 테스트

### AI Prompt Collection
"Create a blog with user authentication, post CRUD, and comments using bkend.ai"

## Recipe App Project
### Schema (5 tables)
- users, recipes, ingredients, categories, favorites

### Architecture
Web: Next.js App Router + TanStack Query + Zustand
Mobile: Flutter + Dio + Riverpod

## Shopping Mall Project
### Schema (4 tables)
- users, products, orders, order_items

### Order State Machine
draft → pending → paid → shipped → delivered → completed
     → cancelled

## Social Network Project
### Schema (5 tables)
- users, posts, comments, likes, follows

### Feed Algorithm Pattern
GET /v1/data/posts?filter={authorId:{$in:[...followingIds]}}&sort={createdAt:-1}

## Common Architecture Patterns

### Next.js App Structure
```
app/
├── (app)/           # Authenticated routes
│   ├── dashboard/
│   └── layout.tsx   # Auth guard
├── (auth)/          # Public auth routes
│   ├── login/
│   └── signup/
└── api/             # Server-side API routes

application/
├── dto/             # Data Transfer Objects
├── hooks/queries/   # TanStack Query hooks
└── stores/          # Zustand stores

infrastructure/
└── api/
    └── client.ts    # bkendFetch wrapper
```

### Flutter App Structure
```
lib/
├── core/
│   └── network/
│       └── dio_client.dart
├── features/
│   └── {feature}/
│       ├── data/
│       ├── models/
│       ├── presentation/
│       └── providers/
└── shared/
```

### Key Patterns (15)
1. bkendFetch wrapper
2. Mock mode toggle
3. DTO layer
4. Query Key Factory
5. Counter cache
6. Order state machine
7. Optimistic updates
8. Image upload with preview
9. Infinite scroll pagination
10. Real-time subscription (planned)
11. Auth middleware
12. Error boundary
13. Loading skeleton
14. Form validation (zod)
15. Search debounce

### Dependencies
Next.js 16+, React 19+, TanStack Query 5, Zustand, Radix UI, Tailwind CSS 4
```

#### 3.3.8 skills/bkend-guides/SKILL.md

**Source**: en/guides/ (11 docs) + en/troubleshooting/ (5 docs)
**예상 행수**: ~350행

**Content 구조:**
```
# bkend.ai Guides & Troubleshooting

## Platform Comparison
| Feature | bkend.ai | Firebase | Supabase |
|---------|----------|----------|----------|
| Database | MongoDB Atlas | Firestore/RTDB | PostgreSQL |
| Auth | JWT + OAuth | Firebase Auth | GoTrue |
| MCP | Native | None | Community |
| Pricing | Free tier + scale | Blaze plan | Free tier |

## Migration Guides
### From Firebase (준비 중)
### From Supabase (준비 중)

## Performance Optimization
- Use indexes on frequently queried fields
- Limit query results (max 100)
- Use cursor pagination (not offset)
- Cache with TanStack Query
- Denormalize frequently joined data

## Testing Strategy
- Unit: Business logic with mock bkendFetch
- Integration: API calls with dev environment
- E2E: Full flow with test data

## Webhooks (준비 중)
- Planned: table change notifications
- Planned: auth event webhooks

## Realtime (준비 중)
- Planned: WebSocket subscriptions

## Error Handling Guide
### Error Response Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { ... }
  }
}
```

### Common Errors
| Code | HTTP | Fix |
|------|------|-----|
| VALIDATION_ERROR | 400 | Check field types and constraints |
| INVALID_CREDENTIALS | 401 | Verify email/password |
| TOKEN_EXPIRED | 401 | Refresh token |
| PERMISSION_DENIED | 403 | Check RLS policies |
| TABLE_NOT_FOUND | 404 | Create table in Console/MCP |
| DUPLICATE_KEY | 400 | Check unique indexes |
| RATE_LIMIT_EXCEEDED | 429 | Wait and retry |

## Connection Troubleshooting
1. Check X-Project-Id header
2. Check X-Environment header
3. Verify API key is valid
4. Check CORS settings in Console
5. Verify network connectivity

## Auth Troubleshooting
1. Token expired → Refresh
2. Invalid token format → Re-authenticate
3. MFA required → Provide MFA code
4. Account locked → Contact admin

## FAQ
Q: Can I use GraphQL?
A: No, bkend.ai provides REST API only.

Q: What database is used?
A: MongoDB Atlas with AES-256 encryption at rest.

Q: Can I create tables via REST API?
A: No, use Console or MCP tools.

Q: What's the maximum query limit?
A: 100 records per request.

Q: How long are refresh tokens valid?
A: 30 days.
```

---

### 3.4 신규 TOML 커맨드 설계 (8개)

모든 커맨드는 동일한 패턴을 따름:

```toml
# commands/bkend-{domain}.toml
description = "{Korean description}"
prompt = """
@skills/bkend-{domain}/SKILL.md

Action: {{args}}

For {domain} tasks, use the bkend-expert agent for implementation guidance.
Delegate backend tasks to bkend-expert agent.
"""
```

**8개 커맨드 목록:**

| 파일 | 명령어 | description |
|------|--------|-------------|
| `commands/bkend-quickstart.toml` | `/bkend-quickstart` | `"bkend.ai platform onboarding and quick start guide"` |
| `commands/bkend-auth.toml` | `/bkend-auth` | `"bkend.ai authentication implementation guide"` |
| `commands/bkend-data.toml` | `/bkend-data` | `"bkend.ai database CRUD operations guide"` |
| `commands/bkend-storage.toml` | `/bkend-storage` | `"bkend.ai file storage and upload guide"` |
| `commands/bkend-mcp.toml` | `/bkend-mcp` | `"bkend.ai MCP tools and AI integration guide"` |
| `commands/bkend-security.toml` | `/bkend-security` | `"bkend.ai security policies and encryption guide"` |
| `commands/bkend-cookbook.toml` | `/bkend-cookbook` | `"bkend.ai project cookbook and examples"` |
| `commands/bkend-guides.toml` | `/bkend-guides` | `"bkend.ai operational guides and troubleshooting"` |

---

### 3.5 Context 모듈 업데이트

#### 3.5.1 .gemini/context/agent-triggers.md

**변경**: bkend-expert 트리거를 확장하여 더 정확한 매칭

```diff
- | bkend, auth, login, database, 인증, 로그인, 認証, ログイン, 身份验证 | `bkend-expert` | bkend.ai BaaS integration |
+ | bkend, BaaS, backend service, 백엔드 서비스, バックエンドサービス, 后端服务 | `bkend-expert` | bkend.ai BaaS platform |
```

#### 3.5.2 .gemini/context/skill-triggers.md

**추가**: 8개 신규 스킬 트리거

```markdown
| bkend setup, quickstart, 시작, 온보딩, bkendはじめ, bkend入门 | `bkend-quickstart` | bkend 온보딩 |
| auth, login, signup, JWT, token, 인증, 로그인, 회원가입, 認証, 身份验证 | `bkend-auth` | 인증 구현 |
| table, CRUD, data, schema, 테이블, 데이터, テーブル, 数据表 | `bkend-data` | DB CRUD |
| file, upload, storage, bucket, 파일, 업로드, ファイル, 文件 | `bkend-storage` | 스토리지 |
| mcp, ai tool, mcp setup, MCP 설정, MCP接続, MCP连接 | `bkend-mcp` | MCP/AI 도구 |
| security, RLS, api key, 보안, セキュリティ, 安全 | `bkend-security` | 보안 정책 |
| cookbook, tutorial, example, 쿡북, 예제, チュートリアル, 教程 | `bkend-cookbook` | 쿡북 |
| migration, troubleshoot, FAQ, 마이그레이션, 문제해결, トラブル, 常见问题 | `bkend-guides` | 가이드 |
```

#### 3.5.3 .gemini/context/commands.md

**추가**: 8개 신규 커맨드

```markdown
### bkend Commands
| Command | Description |
|---------|-------------|
| `/bkend-quickstart` | bkend.ai onboarding guide |
| `/bkend-auth` | Authentication implementation |
| `/bkend-data` | Database CRUD operations |
| `/bkend-storage` | File storage guide |
| `/bkend-mcp` | MCP and AI tools setup |
| `/bkend-security` | Security policies |
| `/bkend-cookbook` | Project tutorials |
| `/bkend-guides` | Guides and troubleshooting |
```

---

### 3.6 설정 파일 업데이트

#### 3.6.1 gemini-extension.json

```diff
- "version": "1.5.1",
+ "version": "1.5.2",
```

#### 3.6.2 bkit.config.json

```diff
- "version": "1.5.1",
+ "version": "1.5.2",
```

#### 3.6.3 GEMINI.md

```diff
- **21 Skills**: Domain-specific knowledge activated on-demand
+ **29 Skills**: Domain-specific knowledge activated on-demand (including 8 bkend-* skills)
```

#### 3.6.4 README.md

**변경 항목:**
1. Badge: `Version-1.5.1` → `Version-1.5.2`
2. Architecture table: Skills 21 → 29
3. Extension Component Map: skills/ 섹션에 8개 bkend-* 추가
4. Commands table: 10 → 18
5. Skills table (21항목): 8개 bkend-* 스킬 추가
6. TOML Commands (10): 18로 업데이트, 8개 bkend 커맨드 추가
7. bkend.ai 관련 설명 업데이트

---

## 4. 테스트 설계

### 4.1 기존 테스트 수정

#### 4.1.1 tests/suites/tc02-skills.js

```diff
  const ALL_SKILLS = [
    'pdca', 'starter', 'dynamic', 'enterprise', 'development-pipeline',
    'code-review', 'zero-script-qa', 'mobile-app', 'desktop-app',
    'bkit-templates', 'bkit-rules', 'gemini-cli-learning',
    'phase-1-schema', 'phase-2-convention', 'phase-3-mockup',
    'phase-4-api', 'phase-5-design-system', 'phase-6-ui-integration',
-   'phase-7-seo-security', 'phase-8-review', 'phase-9-deployment'
+   'phase-7-seo-security', 'phase-8-review', 'phase-9-deployment',
+   'bkend-quickstart', 'bkend-auth', 'bkend-data', 'bkend-storage',
+   'bkend-mcp', 'bkend-security', 'bkend-cookbook', 'bkend-guides'
  ];

// SKILL-01: Update count
- name: 'SKILL-01: 21 SKILL.md files parse without error',
+ name: 'SKILL-01: 29 SKILL.md files parse without error',

// SKILL-20: Update count
- name: 'SKILL-20: listSkills returns 21 skills',
+ name: 'SKILL-20: listSkills returns 29 skills',
- assertEqual(skills.length, 21, `Should list 21 skills but found ${skills.length}`);
+ assertEqual(skills.length, 29, `Should list 29 skills but found ${skills.length}`);
```

**신규 테스트 추가:**
```javascript
{
  name: 'SKILL-21: bkend-* skills have correct agent binding',
  fn: () => {
    const { parseSkillFrontmatter } = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
    const bkendSkills = ['bkend-quickstart', 'bkend-auth', 'bkend-data', 'bkend-storage',
                          'bkend-mcp', 'bkend-security', 'bkend-cookbook', 'bkend-guides'];
    for (const skill of bkendSkills) {
      const metadata = parseSkillFrontmatter(path.join(PLUGIN_ROOT, 'skills', skill, 'SKILL.md'));
      assertEqual(metadata.agents.backend, 'bkend-expert', `${skill} should delegate to bkend-expert`);
      assertEqual(metadata['user-invocable'], true, `${skill} should be user-invocable`);
    }
  }
},
{
  name: 'SKILL-22: bkend-auth skill contains REST API patterns',
  fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'skills', 'bkend-auth', 'SKILL.md'), 'utf-8');
    assertContains(content, '/auth/email/signup', 'Should contain signup endpoint');
    assertContains(content, '/auth/email/signin', 'Should contain signin endpoint');
    assertContains(content, 'X-Project-Id', 'Should contain required header');
    assertContains(content, '30', 'Should reference 30 day refresh token');
  }
},
{
  name: 'SKILL-23: dynamic SKILL.md has correct database type',
  fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'skills', 'dynamic', 'SKILL.md'), 'utf-8');
    assert(!content.includes('PostgreSQL'), 'Should NOT contain PostgreSQL');
    assert(!content.includes('@bkend/sdk'), 'Should NOT contain @bkend/sdk');
    assertContains(content, 'MongoDB', 'Should contain MongoDB');
    assertContains(content, 'bkendFetch', 'Should contain bkendFetch pattern');
  }
}
```

#### 4.1.2 tests/suites/tc06-commands.js

```diff
  const ALL_COMMANDS = [
    'pdca', 'bkit', 'review', 'qa', 'starter',
-   'dynamic', 'enterprise', 'pipeline', 'learn', 'github-stats'
+   'dynamic', 'enterprise', 'pipeline', 'learn', 'github-stats',
+   'bkend-quickstart', 'bkend-auth', 'bkend-data', 'bkend-storage',
+   'bkend-mcp', 'bkend-security', 'bkend-cookbook', 'bkend-guides'
  ];

- name: 'CMD-01: All 10 TOML files parse correctly',
+ name: 'CMD-01: All 18 TOML files parse correctly',
```

**신규 테스트 추가:**
```javascript
{
  name: 'CMD-04: bkend commands reference correct skills',
  fn: () => {
    const bkendCmds = ['bkend-quickstart', 'bkend-auth', 'bkend-data', 'bkend-storage',
                        'bkend-mcp', 'bkend-security', 'bkend-cookbook', 'bkend-guides'];
    for (const cmd of bkendCmds) {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'commands', `${cmd}.toml`), 'utf-8');
      assertContains(content, `@skills/${cmd}/SKILL.md`, `${cmd}.toml should reference ${cmd} SKILL.md`);
    }
  }
}
```

#### 4.1.3 tests/suites/tc03-agents.js

변경 없음 (에이전트 수 16개 유지, bkend-expert 내용만 변경)

**신규 테스트 추가:**
```javascript
{
  name: 'AGENT-14: bkend-expert has correct REST API patterns',
  fn: () => {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'agents', 'bkend-expert.md'), 'utf-8');
    assertContains(content, 'X-Project-Id', 'Should have required header');
    assertContains(content, 'X-Environment', 'Should have required header');
    assertContains(content, 'bkendFetch', 'Should have fetch wrapper pattern');
    assertContains(content, 'MongoDB Atlas', 'Should reference MongoDB Atlas');
    assert(!content.includes('useAuth'), 'Should NOT contain non-existent useAuth hook');
    assert(!content.includes('PostgreSQL'), 'Should NOT contain PostgreSQL');
  }
}
```

#### 4.1.4 tests/verify-components.js

**스킬 검증 추가:**
```diff
  const requiredSkills = [
    'pdca', 'starter', 'dynamic', 'enterprise',
    'development-pipeline', 'phase-1-schema', 'phase-9-deployment',
-   'code-review', 'gemini-cli-learning'
+   'code-review', 'gemini-cli-learning',
+   'bkend-quickstart', 'bkend-auth', 'bkend-data', 'bkend-storage',
+   'bkend-mcp', 'bkend-security', 'bkend-cookbook', 'bkend-guides'
  ];
```

---

## 5. 구현 순서 (Implementation Order)

### Phase 1: Critical Fixes (최우선)

| # | 파일 | 작업 | 예상 시간 |
|---|------|------|----------|
| 1-1 | `agents/bkend-expert.md` | 전면 재작성 (146→400행) | 30분 |
| 1-2 | `skills/dynamic/SKILL.md` | PostgreSQL→MongoDB, SDK→REST 수정 | 15분 |

### Phase 2: New Skills (핵심)

| # | 파일 | 작업 | 예상 행수 |
|---|------|------|----------|
| 2-1 | `skills/bkend-auth/SKILL.md` | 인증 스킬 생성 | ~500행 |
| 2-2 | `skills/bkend-data/SKILL.md` | DB CRUD 스킬 생성 | ~400행 |
| 2-3 | `skills/bkend-mcp/SKILL.md` | MCP+AI 스킬 생성 | ~400행 |
| 2-4 | `skills/bkend-storage/SKILL.md` | 스토리지 스킬 생성 | ~350행 |
| 2-5 | `skills/bkend-security/SKILL.md` | 보안 스킬 생성 | ~300행 |
| 2-6 | `skills/bkend-quickstart/SKILL.md` | 온보딩 스킬 생성 | ~300행 |
| 2-7 | `skills/bkend-cookbook/SKILL.md` | 쿡북 스킬 생성 | ~500행 |
| 2-8 | `skills/bkend-guides/SKILL.md` | 가이드 스킬 생성 | ~350행 |

### Phase 3: Commands + Config (지원)

| # | 파일 | 작업 |
|---|------|------|
| 3-1 | `commands/bkend-*.toml` (8개) | TOML 커맨드 생성 |
| 3-2 | `.gemini/context/skill-triggers.md` | 8개 트리거 추가 |
| 3-3 | `.gemini/context/agent-triggers.md` | bkend-expert 트리거 수정 |
| 3-4 | `.gemini/context/commands.md` | 8개 커맨드 추가 |
| 3-5 | `bkit.config.json` | 버전 1.5.2 |
| 3-6 | `gemini-extension.json` | 버전 1.5.2 |
| 3-7 | `GEMINI.md` | 스킬 수 29 반영 |

### Phase 4: Tests + Docs (검증)

| # | 파일 | 작업 |
|---|------|------|
| 4-1 | `tests/suites/tc02-skills.js` | 29 스킬 검증 |
| 4-2 | `tests/suites/tc06-commands.js` | 18 커맨드 검증 |
| 4-3 | `tests/suites/tc03-agents.js` | bkend-expert 내용 검증 |
| 4-4 | `tests/verify-components.js` | 신규 컴포넌트 검증 추가 |
| 4-5 | `README.md` | 수치, 테이블, 설명 업데이트 |
| 4-6 | `CHANGELOG.md` | v1.5.2 엔트리 |

---

## 6. File Change Summary

### 수정 파일 (10개)

| 파일 | 변경 종류 | 변경 규모 |
|------|----------|----------|
| `agents/bkend-expert.md` | **전면 재작성** | 146행 → ~400행 |
| `skills/dynamic/SKILL.md` | Critical Fix + 확장 | 128행 → ~200행 |
| `.gemini/context/agent-triggers.md` | 트리거 수정 | 1행 수정 |
| `.gemini/context/skill-triggers.md` | 8행 추가 | +8행 |
| `.gemini/context/commands.md` | 10행 추가 | +10행 |
| `bkit.config.json` | 버전 업데이트 | 1행 수정 |
| `gemini-extension.json` | 버전 업데이트 | 1행 수정 |
| `GEMINI.md` | 스킬 수 업데이트 | 1행 수정 |
| `README.md` | 전체 수치/테이블 업데이트 | ~30행 수정 |
| `tests/verify-components.js` | 신규 스킬 검증 추가 | +8행 |

### 신규 파일 (17개)

| 파일 | 카테고리 | 예상 규모 |
|------|----------|----------|
| `skills/bkend-quickstart/SKILL.md` | Skill | ~300행 |
| `skills/bkend-auth/SKILL.md` | Skill | ~500행 |
| `skills/bkend-data/SKILL.md` | Skill | ~400행 |
| `skills/bkend-storage/SKILL.md` | Skill | ~350행 |
| `skills/bkend-mcp/SKILL.md` | Skill | ~400행 |
| `skills/bkend-security/SKILL.md` | Skill | ~300행 |
| `skills/bkend-cookbook/SKILL.md` | Skill | ~500행 |
| `skills/bkend-guides/SKILL.md` | Skill | ~350행 |
| `commands/bkend-quickstart.toml` | Command | ~10행 |
| `commands/bkend-auth.toml` | Command | ~10행 |
| `commands/bkend-data.toml` | Command | ~10행 |
| `commands/bkend-storage.toml` | Command | ~10행 |
| `commands/bkend-mcp.toml` | Command | ~10행 |
| `commands/bkend-security.toml` | Command | ~10행 |
| `commands/bkend-cookbook.toml` | Command | ~10행 |
| `commands/bkend-guides.toml` | Command | ~10행 |
| `docs/02-design/features/bkend-docs-sync.design.md` | Design Doc | 본 문서 |

### 수정 테스트 파일 (4개)

| 파일 | 변경 내용 |
|------|----------|
| `tests/suites/tc02-skills.js` | ALL_SKILLS에 8개 추가, 카운트 21→29, 신규 테스트 3개 |
| `tests/suites/tc03-agents.js` | bkend-expert 내용 검증 테스트 1개 추가 |
| `tests/suites/tc06-commands.js` | ALL_COMMANDS에 8개 추가, 카운트 10→18, 신규 테스트 1개 |
| `tests/verify-components.js` | requiredSkills에 8개 추가 |

### 총 변경 규모

- **수정**: 10 파일 + 4 테스트 파일 = 14 파일
- **신규**: 17 파일
- **예상 총 코드량**: ~3,500행 추가
- **버전**: v1.5.1 → v1.5.2

---

## 7. Gemini CLI 호환성 고려사항

### 7.1 Extension Architecture 준수

| Gemini CLI Feature | bkit v1.5.2 사용 방식 | 호환 상태 |
|-------------------|---------------------|----------|
| GEMINI.md + @import | 6개 context 모듈 (변경 없음) | ✅ 호환 |
| Agent frontmatter | bkend-expert.md native format | ✅ 호환 |
| Skills (experimental) | 29개 SKILL.md progressive disclosure | ✅ 호환 |
| TOML commands | 18개 commands with @{}, {{}} syntax | ✅ 호환 |
| Hooks (10 events) | hooks.json + scripts/ (변경 없음) | ✅ 호환 |
| MCP server | spawn-agent-server.js (변경 없음) | ✅ 호환 |
| settings.json | Extension settings (변경 없음) | ✅ 호환 |

### 7.2 Progressive Disclosure 보장

```
Gemini CLI context window budget:
  - GEMINI.md + @imports: ~1,200 tokens (고정)
  - 활성화된 agent: ~1,200 tokens (bkend-expert 최대)
  - 활성화된 skill: ~500-1,500 tokens (1개씩 로드)
  - 총 동시 부하: ~3,000-4,000 tokens

Gemini 2.5 Pro/Flash context window: 1M tokens
→ bkit 전체 부하는 <0.5%로 영향 없음
```

### 7.3 Skill Orchestrator 자동 감지

`lib/skill-orchestrator.js`의 `listSkills()` 함수는 `skills/` 디렉터리를 동적 스캔하므로,
새 스킬 디렉터리 + SKILL.md를 생성하면 자동으로 인식됨. **코드 수정 불필요**.

---

## 8. Risk Assessment

| 위험 | 영향도 | 발생 확률 | 대응 전략 |
|------|--------|----------|----------|
| 스킬 파일 크기 초과 | Medium | Low | 핵심만 포함, 상세는 web_fetch로 참조 |
| bkend-docs API 변경 | High | Medium | 스킬에 source version 명시 (v0.0.10) |
| Gemini CLI 업데이트 호환성 | Medium | Low | v0.28.0+ 표준 기능만 사용 |
| 테스트 실패 | Low | Low | Phase 4에서 전체 테스트 실행 |
| Context token 과다 | Medium | Low | Progressive Disclosure로 동시 로딩 제한 |

---

## 9. Success Criteria

| 지표 | 현재 (v1.5.1) | 목표 (v1.5.2) | 검증 방법 |
|------|-------------|-------------|----------|
| bkend 문서 커버리지 | ~10% | 95%+ | 스킬 내 엔드포인트/개념 대조 |
| Critical 오류 | 3건 | 0건 | tc02 SKILL-23 테스트 |
| 스킬 수 | 21 | 29 | tc02 SKILL-01, SKILL-20 |
| 커맨드 수 | 10 | 18 | tc06 CMD-01 |
| REST API 엔드포인트 정확도 | ~20% | 100% | SKILL-22 + 수동 검증 |
| MCP 도구 커버리지 | 0% | 100% | bkend-mcp 스킬 내용 검증 |
| 테스트 통과율 | 100% | 100% | `node tests/run-all.js` |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-14 | Initial draft based on 5-agent analysis + Gemini CLI research | CTO Team |
