---
name: dynamic
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

license: Apache-2.0
metadata:
  author: POPUP STUDIO
  version: "1.0.0"
  bkit-version: "1.0.0"
  argument-hint: "[init|guide|help]"
  agent: bkend-expert
  next-skill: phase-1-schema
  pdca-phase: plan
  task-template: "[Dynamic] {feature}"
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

- **Authentication**: Email, OAuth, Magic Links
- **Database**: Managed PostgreSQL
- **Storage**: File uploads
- **Real-time**: WebSocket subscriptions
- **API**: Auto-generated REST & GraphQL

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
// lib/bkend/client.ts
import { createClient } from '@bkend/sdk';

export const bkend = createClient({
  projectId: process.env.BKEND_PROJECT_ID!,
  apiKey: process.env.BKEND_API_KEY!
});
```
