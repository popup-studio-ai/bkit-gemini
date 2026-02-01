---
name: enterprise
description: |
  Enterprise-grade system development with microservices, Kubernetes, and Terraform.
  Includes AI Native methodology and Monorepo architecture patterns.

  Project initialization with "init enterprise" or "enterprise init".

  Use proactively when user needs high traffic, microservices, or custom infrastructure.

  Triggers: microservices, kubernetes, terraform, k8s, AWS, monorepo, AI native,
  init enterprise, enterprise init,
  마이크로서비스, 모노레포, 인프라,
  マイクロサービス, モノレポ, インフラ,
  微服务, 单仓库, 基础设施,
  microservicios, estrategia empresarial, arquitectura,
  microservices, stratégie d'entreprise, architecture,
  Microservices, Unternehmensstrategie, Architektur,
  microservizi, strategia aziendale, architettura

  Do NOT use for: simple projects, static websites, learning projects

license: Apache-2.0
metadata:
  author: POPUP STUDIO
  version: "1.0.0"
  bkit-version: "1.0.0"
  argument-hint: "[init|guide|help]"
  agent: enterprise-expert
  next-skill: phase-1-schema
  pdca-phase: plan
  task-template: "[Enterprise] {feature}"
---

# Enterprise Skill

> Enterprise-grade systems with microservices, Kubernetes, and Terraform

## Overview

The Enterprise skill provides guidance for building large-scale, production-ready systems with microservices architecture, container orchestration, and infrastructure-as-code.

## When to Use

- High-traffic applications
- Multi-team development
- Complex business logic
- Regulatory compliance needs
- Custom infrastructure requirements

## Architecture Patterns

### Monorepo Structure

```
enterprise-project/
├── packages/
│   ├── api-gateway/
│   ├── user-service/
│   ├── order-service/
│   ├── payment-service/
│   └── shared/
├── infrastructure/
│   ├── terraform/
│   └── kubernetes/
├── docs/
│   ├── 01-plan/
│   ├── 02-design/
│   ├── 03-analysis/
│   └── 04-report/
├── turbo.json
└── package.json
```

### Key Technologies

- **Container**: Docker, Kubernetes
- **IaC**: Terraform, Pulumi
- **CI/CD**: GitHub Actions, ArgoCD
- **Observability**: Prometheus, Grafana, Jaeger
- **Service Mesh**: Istio, Linkerd

## Key Phases (Enterprise Level)

| Phase | Required | Description |
|-------|----------|-------------|
| 1. Schema | ✅ | Domain modeling |
| 2. Convention | ✅ | Team coding standards |
| 3. Mockup | ✅ | UI/UX prototypes |
| 4. API | ✅ | API contracts (OpenAPI) |
| 5. Design System | ✅ | Shared component library |
| 6. UI Integration | ✅ | Frontend integration |
| 7. SEO/Security | ✅ | Security hardening |
| 8. Review | ✅ | Architecture review |
| 9. Deployment | ✅ | Multi-env deployment |

## Getting Started

```bash
# Initialize Enterprise project
/enterprise init

# Full pipeline with all phases
/development-pipeline start
```

## Infrastructure Example

```hcl
# infrastructure/terraform/main.tf
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "enterprise-cluster"
  cluster_version = "1.28"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
}
```
