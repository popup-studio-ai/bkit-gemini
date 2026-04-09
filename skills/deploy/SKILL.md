---
name: deploy
classification: W
description: |
  Deployment guidance and checklist for dev, staging, and production environments.
  Creates a checkpoint before deploy and provides a structured pre-deploy checklist.

  Use proactively when user mentions deploying, releasing, or shipping to any environment.

  Triggers: deploy, release, ship, publish, go live,
  배포, 릴리스, 출시,
  デプロイ, リリース, 公開,
  部署, 发布, 上线,
  desplegar, lanzar, publicar,
  déployer, publier, mettre en production,
  bereitstellen, veröffentlichen, freigeben,
  distribuire, rilasciare, pubblicare

  Do NOT use for: development builds, local testing

# ──── NEW FIELDS (v2.0.4) ────
user-invocable: true
argument-hint: "[dev|staging|prod]"

allowed-tools:
  - read_file
  - write_file
  - glob
  - grep_search
  - list_directory
  - bkit_checkpoint
  - run_shell_command

imports: []

agents:
  review: code-analyzer

context: session
memory: project
pdca-phase: do
---

# Deploy Skill

> Guided deployment with pre-deploy checklist and checkpoint creation

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/deploy dev` | Deploy to development | `/deploy dev` |
| `/deploy staging` | Deploy to staging | `/deploy staging` |
| `/deploy prod` | Deploy to production (full checklist) | `/deploy prod` |

> **Note**: Auto-deploy is not possible from the Gemini CLI Extension.
> This skill provides a guided checklist and ensures safety steps are taken.
> The actual deploy command must be run by the user or CI/CD pipeline.

## How to Execute

### 1. Pre-Deploy Checkpoint

Before any deployment:
1. Call `bkit_checkpoint` to create a restore point
2. Record the checkpoint ID for potential rollback
3. Note: If checkpoint fails, warn user but do not block

### 2. Environment-Specific Checklists

#### Development (`/deploy dev`)

- [ ] All modified files saved
- [ ] No syntax errors (`node -c` on changed files)
- [ ] Local tests pass (if configured)
- [ ] Checkpoint created

#### Staging (`/deploy staging`)

All of dev checklist, plus:
- [ ] PDCA Check phase completed (match rate >= 80%)
- [ ] No `TODO` or `FIXME` in changed files
- [ ] Environment variables documented
- [ ] API changes backward-compatible

#### Production (`/deploy prod`)

All of staging checklist, plus:
- [ ] PDCA Check phase completed (match rate >= 90%)
- [ ] Code review completed (`/code-review`)
- [ ] All tests pass
- [ ] No debug/console.log statements
- [ ] Rollback plan documented
- [ ] PDCA report generated (`/pdca report`)
- [ ] Changelog updated

### 3. Deploy Command Guidance

After checklist is verified, provide the appropriate deploy command:

```bash
# Development
npm run deploy:dev    # or project-specific command

# Staging
npm run deploy:staging

# Production
npm run deploy:prod
```

### 4. Post-Deploy Verification

After deployment:
1. Verify the deployment was successful
2. Check health endpoints (if applicable)
3. Update PDCA status to "deployed"
4. Log the deployment in audit trail

## Output Format

```markdown
## Deploy Checklist: {environment}

### Pre-Deploy
- [x] Checkpoint created (ID: chk-20260409-143000)
- [x] Syntax check passed (12 files)
- [x] PDCA match rate: 94%
- [ ] Code review: PENDING

### Deploy Command
Run: `npm run deploy:staging`

### Post-Deploy
- [ ] Verify health endpoint
- [ ] Update PDCA status
```

## Safety Rules

1. **Production requires explicit confirmation** - Never auto-deploy to prod
2. **Checkpoint is mandatory** - Always create before deploy
3. **Match rate threshold** - Warn if below required threshold for environment
4. **Rollback ready** - Always provide rollback instructions with checkpoint ID
