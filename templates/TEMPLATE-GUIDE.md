# bkit Template Selection Guide

> Quick reference for choosing the right template for your task

---

## Template Selection Flowchart

```
What are you doing?
│
├─► Starting a new feature?
│   │
│   ├─► Using 9-phase Pipeline? ──► Use Pipeline Templates
│   │   (Phase 1 → 2 → 3 → ... → 9)
│   │
│   └─► Using PDCA only? ──► Use PDCA Templates
│       (Plan → Design → Do → Check → Act)
│
├─► Analyzing implementation?
│   └─► analysis.template.md
│
├─► Writing completion report?
│   └─► report.template.md
│
└─► Setting up new project?
    └─► CLAUDE.template.md
```

---

## PDCA Templates (Core)

| Template | Phase | When to Use |
|----------|-------|-------------|
| **plan.template.md** | Plan | Starting a new feature, defining requirements |
| **design.template.md** | Design | Technical design for Dynamic level projects |
| **design-starter.template.md** | Design | Simple projects (static sites, portfolios) |
| **design-enterprise.template.md** | Design | Complex systems (microservices, k8s) |
| **analysis.template.md** | Check | Gap analysis, code review, performance check |
| **report.template.md** | Act | Completion report, retrospective |

### Level-Based Design Template Selection

```
Project Complexity?
│
├─► Simple (HTML/CSS, static site) ──► design-starter.template.md
│
├─► Medium (Web app, SaaS MVP) ──► design.template.md (default)
│
└─► Complex (Enterprise, MSA) ──► design-enterprise.template.md
```

---

## Pipeline Templates (9-Phase)

| Phase | Template | Purpose |
|-------|----------|---------|
| 1 | `pipeline/phase-1-schema.template.md` | Terminology & data model |
| 2 | `pipeline/phase-2-convention.template.md` | Coding rules & architecture |
| 3 | `pipeline/phase-3-mockup.template.md` | UI prototypes |
| 4 | `pipeline/phase-4-api.template.md` | API specification |
| 5 | `pipeline/phase-5-design-system.template.md` | Component library |
| 6 | `pipeline/phase-6-ui.template.md` | UI implementation |
| 7 | `pipeline/phase-7-seo-security.template.md` | SEO & security |
| 8 | `pipeline/phase-8-review.template.md` | Architecture/convention review |
| 9 | `pipeline/phase-9-deployment.template.md` | Deployment config |

### Pipeline vs PDCA

| Scenario | Use Pipeline | Use PDCA |
|----------|:------------:|:--------:|
| New project from scratch | ✅ | ⚠️ |
| Adding feature to existing project | ⚠️ | ✅ |
| Quick fix / bug fix | ❌ | ⚠️ |
| Enterprise-grade development | ✅ | ✅ |

---

## Other Templates

| Template | Purpose |
|----------|---------|
| **CLAUDE.template.md** | Generate CLAUDE.md for new projects |
| **iteration-report.template.md** | Evaluator-Optimizer iteration report |
| **_INDEX.template.md** | Folder document index |

---

## Template Features Comparison

### Clean Architecture Support

| Template | Layer Definition | Dependency Rules | Import Order |
|----------|:----------------:|:----------------:|:------------:|
| design.template.md | ✅ | ✅ | ✅ |
| design-starter.template.md | ❌ | ❌ | ❌ |
| design-enterprise.template.md | ✅ | ✅ | ✅ |
| phase-2-convention.template.md | ✅ | ✅ | ✅ |
| phase-8-review.template.md | ✅ | ✅ | ✅ |

### Convention Compliance Support

| Template | Naming | Folder Structure | Env Variables |
|----------|:------:|:----------------:|:-------------:|
| design.template.md | ✅ | ✅ | ✅ |
| analysis.template.md | ✅ | ✅ | ✅ |
| phase-2-convention.template.md | ✅ | ✅ | ✅ |
| phase-8-review.template.md | ✅ | ✅ | ✅ |

---

## Quick Commands

```bash
# PDCA Commands
/pdca-plan {feature}      # Create plan document
/pdca-design {feature}    # Create design document
/pdca-analyze {feature}   # Run gap analysis
/pdca-report {feature}    # Create completion report

# Pipeline Commands
/pipeline-start           # Start 9-phase pipeline
/pipeline-status          # Check current phase
/pipeline-next            # Go to next phase

# Project Setup
/setup-claude-code        # Generate CLAUDE.md
/init-starter             # Initialize Starter level project
/init-dynamic             # Initialize Dynamic level project
/init-enterprise          # Initialize Enterprise level project
```

---

## Cross-Reference Guide

### PDCA ↔ Pipeline Integration

When using both PDCA and Pipeline:

1. **Plan Phase**: Reference Phase 1 (Schema) and Phase 2 (Convention) outputs
2. **Design Phase**: Reference Phase 3 (Mockup) and Phase 4 (API) outputs
3. **Check Phase**: Use Phase 8 (Review) checklist for verification

### Document Location Convention

```
docs/
├── 01-plan/
│   ├── features/          # PDCA Plan documents
│   ├── schema.md          # Pipeline Phase 1
│   └── conventions.md     # Pipeline Phase 2
├── 02-design/
│   ├── features/          # PDCA Design documents
│   ├── mockup/            # Pipeline Phase 3
│   └── api/               # Pipeline Phase 4
├── 03-analysis/           # PDCA Check documents
└── 04-report/             # PDCA Act documents
```

---

**Version**: 1.0.0
**Last Updated**: 2026-01-20
