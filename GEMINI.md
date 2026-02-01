# bkit Vibecoding Kit v1.0.0 - Gemini CLI Edition

## Overview

bkit is an AI-native development toolkit implementing PDCA (Plan-Do-Check-Act) methodology for systematic software development with Gemini CLI.

## Quick Start

### Session Initialization

At session start, you will be asked to choose your starting point:
- **Learn bkit** - Development pipeline guide
- **Learn Gemini CLI** - Gemini CLI configuration and features
- **Start new project** - Select level (Starter/Dynamic/Enterprise)
- **Start freely** - General conversation mode

## PDCA Core Rules

1. **New feature request** → Check/create Plan/Design documents first
2. **After implementation** → Suggest Gap analysis
3. **Gap Analysis < 90%** → Auto-improvement with pdca-iterator
4. **Gap Analysis >= 90%** → Completion report

## Project Levels

| Level | Description | Use Case |
|-------|-------------|----------|
| **Starter** | Static websites, HTML/CSS/JS | Portfolio, landing pages |
| **Dynamic** | Fullstack with BaaS (bkend.ai) | Web apps, SaaS, MVPs |
| **Enterprise** | Microservices, Kubernetes, Terraform | Large-scale systems |

## Available Commands

### PDCA Commands
- `/pdca plan [feature]` - Create plan document
- `/pdca design [feature]` - Create design document
- `/pdca do [feature]` - Implementation guide
- `/pdca analyze [feature]` - Gap analysis
- `/pdca iterate [feature]` - Auto-improvement
- `/pdca report [feature]` - Completion report
- `/pdca status` - Current PDCA status
- `/pdca next` - Next phase guide

### Level Commands
- `/starter` - Start Starter level project
- `/dynamic` - Start Dynamic level project
- `/enterprise` - Start Enterprise level project

### Utility Commands
- `/code-review` - Code quality analysis
- `/zero-script-qa` - Log-based QA testing
- `/development-pipeline` - 9-phase pipeline guide

## Agent Triggers (8 Languages Supported)

| Keywords | Agent | Action |
|----------|-------|--------|
| verify, check, 검증, 確認, 验证 | gap-detector | Run Gap analysis |
| improve, iterate, 개선, 改善, 改进 | pdca-iterator | Auto-improvement |
| analyze, quality, 분석, 品質, 质量 | code-analyzer | Code quality analysis |
| report, summary, 보고서, 報告, 报告 | report-generator | Generate report |

## Documentation Structure

```
docs/
├── 01-plan/features/     # Plan documents
├── 02-design/features/   # Design documents
├── 03-analysis/          # Gap analysis reports
└── 04-report/            # Completion reports
```

## Important Notes

- AI Agent is not perfect. Always verify important decisions.
- Include bkit Feature Usage report at the end of every response.
- Follow PDCA methodology for all feature development.

---

*bkit Vibecoding Kit - Empowering AI-native development*
