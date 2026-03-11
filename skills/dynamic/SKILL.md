---
name: dynamic
classification: W
description: |
  Fullstack development skill using bkend.ai BaaS platform.
  Covers authentication, data storage, API integration for dynamic web apps.

  Project initialization with "init dynamic" or "dynamic init".

  Use proactively when user needs login, database, or backend features.

  Triggers: fullstack, BaaS, bkend, authentication, login feature, signup, database,
  web app, SaaS, MVP, init dynamic, dynamic init,
  풀스택, 인증, 로그인 기능, 회원가입, 데이터베이스, 웹앱,
  フルスタック, 認証, ログイン機能, データベース,
  全栈, 身份验证, 登录功能, 数据库,
  autenticación, inicio de sesión, registro, base de datos, fullstack,
  authentification, connexion, inscription, base de données, fullstack,
  Authentifizierung, Anmeldung, Registrierung, Datenbank, Fullstack,
  autenticazione, accesso, registrazione, database, fullstack

  Do NOT use for: static websites, microservices architecture

# ──── NEW FIELDS (v1.5.1) ────
user-invocable: true
argument-hint: "[init]"

allowed-tools:
  - read_file
  - write_file
  - replace
  - glob
  - grep_search
  - run_shell_command
  - google_web_search
  - web_fetch

imports: []

agents:
  backend: bkend-expert

context: session
memory: project
pdca-phase: all
---

# Dynamic Skill

> Fullstack development with bkend.ai BaaS platform

## Overview

The Dynamic skill enables fullstack web application development using bkend.ai as the Backend-as-a-Service platform. No server management required.

## When to Use

- Web applications with user accounts
- SaaS products
- MVPs with backend requirements
- Apps needing authentication
- Data-driven applications

## bkend.ai Features

- **Authentication**: Email, OAuth (Google, GitHub), Magic Links
- **Database**: MongoDB Atlas (REST API)
- **Storage**: S3 Presigned URL file uploads
- **Real-time**: WebSocket subscriptions (planned)
- **API**: REST API (`https://api-client.bkend.ai`)
- **MCP**: 28 tools + 4 resources (`https://api.bkend.ai/mcp`)

## Project Structure

```
project/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/
│   │   └── ...
│   └── api/
├── lib/
│   └── bkend/
│       └── client.ts
├── components/
├── docs/
│   ├── 01-plan/
│   ├── 02-design/
│   └── 03-analysis/
└── .mcp.json
```

## Key Phases (Dynamic Level)

| Phase | Required | Description |
|-------|----------|-------------|
| 1. Schema | ✅ | Define data models |
| 2. Convention | ✅ | Set coding rules |
| 3. Mockup | ✅ | Design UI/UX |
| 4. API | ✅ | Design API endpoints |
| 5. Design System | 🔶 Optional | Component library |
| 6. UI Integration | ✅ | Connect frontend to API |
| 7. SEO/Security | 🔶 Optional | Auth hardening |
| 8. Review | 🔶 Optional | Code review |
| 9. Deployment | ✅ | Deploy to production |

## Getting Started

```bash
# Initialize Dynamic project
/dynamic init

# Start the pipeline
/development-pipeline start
```

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

## Available bkend Skills

For detailed domain knowledge, use these dedicated skills:

| Skill | Command | Domain |
|-------|---------|--------|
| bkend-quickstart | `/bkend-quickstart` | Onboarding, core concepts |
| bkend-auth | `/bkend-auth` | Authentication (21 docs) |
| bkend-data | `/bkend-data` | Database CRUD (13 docs) |
| bkend-storage | `/bkend-storage` | File storage (10 docs) |
| bkend-mcp | `/bkend-mcp` | MCP + AI tools (18 docs) |
| bkend-security | `/bkend-security` | Security (8 docs) |
| bkend-cookbook | `/bkend-cookbook` | Project tutorials (4+5) |
| bkend-guides | `/bkend-guides` | Guides + troubleshooting (16 docs) |
