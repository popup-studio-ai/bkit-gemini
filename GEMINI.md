# bkit Vibecoding Kit v1.5.0 - Gemini CLI Edition

> AI-native development toolkit implementing PDCA methodology with Context Engineering

## Overview

bkit is a Gemini CLI extension that provides structured development workflows through:
- **PDCA Methodology**: Plan-Do-Check-Act cycle for systematic development
- **Context Engineering**: Systematic context curation for optimal LLM inference
- **3 Project Levels**: Starter (static), Dynamic (fullstack), Enterprise (microservices)
- **21 Skills**: Domain-specific knowledge activated on-demand
- **11 Agents**: Specialized AI assistants with role-based constraints

## Core Rules (Always Apply)

### PDCA Workflow Rules
1. **New feature request** → Check/create Plan document first (`/pdca plan`)
2. **Plan complete** → Create Design document (`/pdca design`)
3. **After implementation** → Run Gap analysis (`/pdca analyze`)
4. **Gap Analysis < 90%** → Auto-improvement iteration (`/pdca iterate`)
5. **Gap Analysis >= 90%** → Generate completion report (`/pdca report`)

### Behavioral Guidelines
- Always verify important decisions with the user - AI is not perfect
- Prefer editing existing files over creating new ones
- Follow existing code patterns and conventions
- Include bkit Feature Usage report at the end of every response

## Available Commands

### PDCA Commands (Primary)
| Command | Description | Use When |
|---------|-------------|----------|
| `/pdca plan [feature]` | Create plan document | Starting new feature |
| `/pdca design [feature]` | Create design document | Plan approved |
| `/pdca do [feature]` | Implementation guide | Ready to code |
| `/pdca analyze [feature]` | Run gap analysis | Implementation complete |
| `/pdca iterate [feature]` | Auto-improvement loop | Gap < 90% |
| `/pdca report [feature]` | Completion report | Gap >= 90% |
| `/pdca status` | Check current status | Anytime |
| `/pdca next` | Guide to next step | Unsure what's next |

### Level Commands (Project Initialization)
| Command | Level | Stack |
|---------|-------|-------|
| `/starter` | Starter | HTML/CSS/JS, static sites |
| `/dynamic` | Dynamic | Next.js, BaaS (bkend.ai) |
| `/enterprise` | Enterprise | Microservices, K8s, Terraform |

### Utility Commands
| Command | Description |
|---------|-------------|
| `/code-review` | Analyze code quality |
| `/zero-script-qa` | Log-based QA testing |
| `/development-pipeline` | 9-phase pipeline guide |
| `/bkit` | Show all bkit functions |

## Agent Triggers (8 Languages)

Agents are auto-triggered by keywords in user messages:

| Keywords | Agent | Action |
|----------|-------|--------|
| verify, check, is this right?, 검증, 맞아?, 確認, 正しい?, 验证, 对吗? | `gap-detector` | Design-implementation gap analysis |
| improve, fix, iterate, 개선, 고쳐, 改善, 直して, 改进, 修复 | `pdca-iterator` | Auto-improvement with Evaluator-Optimizer pattern |
| analyze, quality, issues, 분석, 품질, 分析, 品質, 质量, 问题 | `code-analyzer` | Code quality and architecture check |
| report, summary, status, 보고서, 요약, 報告, 概要, 报告, 总结 | `report-generator` | PDCA completion report |
| help, beginner, how to, 도움, 초보, 助けて, 初心者, 帮助, 新手 | `starter-guide` | Beginner-friendly guidance |
| validate design, spec check, 설계 검증, 設計検証, 设计验证 | `design-validator` | Design document completeness check |
| QA, testing, docker logs, 테스트, 로그, テスト, ログ, 测试, 日志 | `qa-monitor` | Zero Script QA with log monitoring |
| pipeline, where to start, 뭐부터, 어디서부터, 何から, 从哪里 | `pipeline-guide` | 9-phase development pipeline guide |
| bkend, auth, login, database, 인증, 로그인, 認証, ログイン, 身份验证 | `bkend-expert` | bkend.ai BaaS integration |
| microservices, k8s, architecture, 마이크로서비스, アーキテクチャ, 微服务 | `enterprise-expert` | Enterprise architecture decisions |
| AWS, terraform, infrastructure, 인프라, インフラ, 基础设施 | `infra-architect` | Cloud infrastructure design |

## Skill Triggers (Auto-detection)

Skills are activated based on context and keywords:

| Keywords | Skill | Description |
|----------|-------|-------------|
| static site, portfolio, landing page, 정적 웹, 静的サイト, 静态网站 | `starter` | Static website development |
| fullstack, login, signup, database, 풀스택, 로그인, フルスタック | `dynamic` | Fullstack with BaaS |
| microservices, kubernetes, terraform, 마이크로서비스, 微服务 | `enterprise` | Enterprise architecture |
| schema, data model, terminology, 스키마, 용어, スキーマ, 数据模型 | `phase-1-schema` | Data structure design |
| convention, coding style, 컨벤션, コンベンション, 编码规范 | `phase-2-convention` | Coding standards |
| mockup, prototype, wireframe, 목업, 프로토타입, モックアップ | `phase-3-mockup` | UI/UX prototyping |
| API, REST, backend, endpoint, API 설계, API設計, API设计 | `phase-4-api` | Backend API design |
| design system, components, tokens, 디자인 시스템, コンポーネント | `phase-5-design-system` | Component library |
| UI implementation, state management, UI 구현, 状態管理 | `phase-6-ui-integration` | Frontend-backend integration |
| SEO, security, meta tags, XSS, 보안, セキュリティ, 安全 | `phase-7-seo-security` | SEO and security hardening |
| code review, architecture check, 코드 리뷰, コードレビュー | `phase-8-review` | Quality verification |
| deployment, CI/CD, production, 배포, デプロイ, 部署 | `phase-9-deployment` | Production deployment |

## Documentation Structure

```
docs/
├── 01-plan/features/     # Plan documents (PDCA Plan phase)
├── 02-design/features/   # Design documents (PDCA Design phase)
├── 03-analysis/          # Gap analysis reports (PDCA Check phase)
└── 04-report/            # Completion reports (PDCA Act phase)
```

## Tool Name Reference

bkit uses Gemini CLI native tool names:

| Tool | Purpose | Example |
|------|---------|---------|
| `write_file` | Create/overwrite files | Creating new components |
| `replace` | Edit existing files | Modifying code |
| `read_file` | Read file contents | Understanding code |
| `run_shell_command` | Execute shell commands | Git, npm, docker |
| `glob` | Find files by pattern | `**/*.tsx` |
| `grep` | Search file contents | Finding function definitions |
| `web_search` | Search the web | Finding documentation |
| `web_fetch` | Fetch URL content | Reading web pages |
| `spawn_agent` | Launch sub-agent | Complex multi-step tasks |
| `task_write` | Manage tasks | Task tracking |
| `activate_skill` | Load skill context | On-demand expertise |

## bkit Feature Usage Report Format

**Required at the end of every response:**

```
─────────────────────────────────────────────────
📊 bkit Feature Usage
─────────────────────────────────────────────────
✅ Used: [Features used in this response]
⏭️ Not Used: [Major unused features] (reason)
💡 Recommended: [Features suitable for next task]
─────────────────────────────────────────────────
```

### Features to Report:
- **PDCA Skill**: /pdca plan, design, do, analyze, iterate, report, status, next
- **Agents**: gap-detector, pdca-iterator, code-analyzer, report-generator, etc.
- **Level Skills**: /starter, /dynamic, /enterprise
- **Phase Skills**: /phase-1-schema ~ /phase-9-deployment
- **Utility Skills**: /code-review, /zero-script-qa, /development-pipeline

### PDCA Phase Recommendations:

| Current Status | Recommended Action |
|----------------|-------------------|
| No PDCA started | `/pdca plan {feature}` |
| Plan completed | `/pdca design {feature}` |
| Design completed | Start implementation |
| Implementation done | `/pdca analyze {feature}` |
| Gap < 90% | `/pdca iterate {feature}` |
| Gap >= 90% | `/pdca report {feature}` |

## Important Notes

- **AI is not perfect**: Always verify critical decisions
- **Context Engineering**: bkit optimizes context for better AI inference
- **Modular Skills**: Skills load on-demand to save context tokens
- **Hooks Integration**: bkit uses 7-event hook system for automation
- **Multilingual**: Supports EN, KO, JA, ZH, ES, FR, DE, IT

---

*bkit Vibecoding Kit - Empowering AI-native development*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
