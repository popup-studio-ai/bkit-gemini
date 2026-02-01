---
name: phase-9-deployment
description: |
  Skill for deploying to production environment.
  Covers CI/CD, environment configuration, and deployment strategies.

  Use proactively when user is ready to deploy.

  Triggers: deployment, CI/CD, production, Vercel, Kubernetes, Docker,
  배포, 프로덕션,
  デプロイ, 本番環境,
  部署, 生产环境,
  despliegue, producción,
  déploiement, production,
  Bereitstellung, Produktion,
  distribuzione, produzione

  Do NOT use for: local development, design phase
---

# Phase 9: Deployment

> Ship to production

## Deployment Options

### Starter Level: Vercel/Netlify

```bash
# Vercel deployment
npm i -g vercel
vercel deploy --prod

# Or connect GitHub for auto-deploy
```

### Dynamic Level: Docker + Platform

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

### Enterprise Level: Kubernetes

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
        image: myapp:latest
        ports:
        - containerPort: 3000
```

## CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## Environment Variables

```bash
# Production .env
DATABASE_URL=postgres://...
NEXT_PUBLIC_API_URL=https://api.example.com
AUTH_SECRET=<generated-secret>
```

## Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] SSL certificates configured
- [ ] Monitoring set up
- [ ] Backup strategy in place

## Post-Deployment

After successful deployment:
1. Verify functionality
2. Monitor logs
3. Check performance
4. Generate completion report: `/pdca report {feature}`
