---
name: phase-7-seo-security
description: |
  Skill for search optimization (SEO) and security hardening.
  Covers meta tags, semantic HTML, and security vulnerability checks.

  Use proactively when user asks about search ranking or security.

  Triggers: SEO, security, meta tags, XSS, CSRF,
  보안, 검색 최적화,
  セキュリティ, SEO,
  安全, 搜索优化,
  seguridad, SEO,
  sécurité, SEO,
  Sicherheit, SEO,
  sicurezza, SEO

  Do NOT use for: backend-only APIs, internal tools

license: Apache-2.0
metadata:
  author: POPUP STUDIO
  version: "1.0.0"
  bkit-version: "1.0.0"
  agent: code-analyzer
  next-skill: phase-8-review
  pdca-phase: do
  task-template: "[Phase-7] {feature}"
---

# Phase 7: SEO & Security

> Optimize for search and secure your application

## SEO Checklist

### 1. Meta Tags

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    template: '%s | My App',
    default: 'My App - Best Product'
  },
  description: 'Description for search engines',
  keywords: ['keyword1', 'keyword2'],
  openGraph: {
    title: 'My App',
    description: 'Description for social sharing',
    images: ['/og-image.png']
  },
  twitter: {
    card: 'summary_large_image'
  }
};
```

### 2. Semantic HTML

- Use proper heading hierarchy (h1 → h2 → h3)
- Add alt text to images
- Use semantic elements (article, section, nav)
- Implement structured data (JSON-LD)

### 3. Performance

- Image optimization (next/image)
- Code splitting
- Lazy loading
- Core Web Vitals monitoring

## Security Checklist

### 1. Headers

```typescript
// next.config.js
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
  { key: 'Content-Security-Policy', value: "default-src 'self'" }
];
```

### 2. Input Validation

- Validate all user inputs
- Sanitize HTML content
- Use parameterized queries
- Implement rate limiting

### 3. Authentication

- Secure password hashing
- JWT token expiration
- CSRF protection
- Session management

## Next Phase

After completion: `/phase-8-review`
