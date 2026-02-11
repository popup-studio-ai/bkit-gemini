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
| team, project lead, CTO, 팀 구성, 팀장, チームリード, 团队领导 | `cto-lead` | CTO-level team orchestration |
| UI, frontend, component, 프론트엔드, フロントエンド, 前端 | `frontend-architect` | Frontend architecture decisions |
| security, vulnerability, OWASP, 보안, 취약점, セキュリティ, 安全 | `security-architect` | Security review and analysis |
| requirements, feature spec, user story, 요구사항, 기능 정의, 要件定義, 需求 | `product-manager` | Requirements and feature specs |
| test strategy, QA plan, quality, 테스트 전략, QA 계획, テスト戦略, 测试策略 | `qa-strategist` | Test strategy and quality planning |
