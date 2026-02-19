---
name: starter
description: |
  Static web development skill for beginners and non-developers.
  Covers HTML/CSS/JavaScript and Next.js App Router basics.

  Project initialization with "init starter" or "starter init".

  Use proactively when user is a beginner or wants a simple static website.

  Triggers: static website, portfolio, landing page, HTML CSS, beginner, first website,
  simple web, personal site, init starter, starter init,
  정적 웹, 포트폴리오, 랜딩페이지, 초보자, 첫 웹사이트, 간단한 웹,
  静的サイト, ポートフォリオ, 初心者,
  静态网站, 个人网站, 初学者,
  sitio web estático, portafolio, página de inicio, principiante,
  site web statique, portfolio, page d'accueil, débutant,
  statische Website, Portfolio, Landingpage, Anfänger,
  sito web statico, portfolio, pagina di destinazione, principiante

  Do NOT use for: fullstack apps, backend development, microservices

# ──── NEW FIELDS (v1.5.1) ────
user-invocable: true
argument-hint: "[init]"

allowed-tools:
  - read_file
  - write_file
  - replace
  - glob
  - grep_search
  - google_web_search
  - web_fetch

imports: []

agents:
  guide: starter-guide

context: session
memory: project
pdca-phase: all
---

# Starter Skill

> Static web development for beginners and non-developers

## Overview

The Starter skill helps beginners create static websites using HTML, CSS, JavaScript, and Next.js App Router.

## When to Use

- First-time web developers
- Portfolio websites
- Landing pages
- Simple static sites
- Personal blogs (static)

## Project Structure

```
project/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── ...
├── public/
│   └── images/
├── docs/
│   ├── 01-plan/
│   └── 02-design/
└── package.json
```

## Key Phases (Starter Level)

| Phase | Required | Description |
|-------|----------|-------------|
| 1. Schema | ✅ | Define terminology |
| 2. Convention | ✅ | Set coding rules |
| 3. Mockup | ✅ | Design UI/UX |
| 4. API | ⏭️ Skip | No backend |
| 5. Design System | ⏭️ Skip | Keep simple |
| 6. UI Integration | ✅ | Implement UI |
| 7. SEO/Security | ⏭️ Skip | Basic only |
| 8. Review | ⏭️ Skip | Self-review |
| 9. Deployment | ✅ | Deploy to Vercel |

## Getting Started

```bash
# Initialize Starter project
/starter init

# Follow the 9-phase pipeline
/development-pipeline start
```

## Deployment Options

- Vercel (recommended)
- Netlify
- GitHub Pages
- Cloudflare Pages
