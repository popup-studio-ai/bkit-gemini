# Plan: Gemini CLI v0.31.0 Upgrade Comprehensive Analysis

> **Summary**: CTO Team 8+1 agent deep analysis of Gemini CLI v0.31.0 stable upgrade - impact assessment, philosophy alignment, UX improvements, and feature enhancement proposals from CTO/CPO perspectives.
>
> **Feature**: gemini-cli-031-upgrade-analysis
> **Author**: CTO Team Lead (AI-assisted)
> **Created**: 2026-02-28
> **Last Modified**: 2026-02-28
> **Status**: Completed
> **Method**: CTO Team (8 Specialist Agents + Team Lead)
> **Analysis Source**: Multi-source deep research (Official docs, GitHub, Tech blogs, Codebase audit, Philosophy analysis)

---

## 1. Background & Motivation

### 1.1 WHY This Analysis?

Gemini CLI has released v0.31.0 stable (2026-02-27) with significant architectural changes including RuntimeHook functions, Session-based SDK, Browser Agent, deep Plan Mode integration, and Extension Registry. bkit v1.5.5 is currently tested up to v0.30.0. A comprehensive analysis is needed to:

1. **Identify breaking changes** that affect bkit's 10 hooks, 29 skills, 16 agents, and 6 MCP tools
2. **Evaluate new opportunities** that align with bkit's Context Engineering philosophy
3. **Plan strategic upgrades** from CTO and CPO perspectives
4. **Maintain competitive advantage** against Claude Code and other AI coding tools

### 1.2 Version Context

| Distribution | Version | Status |
|:---:|:---:|:---:|
| **Stable** | 0.31.0 | Current Latest (2026-02-27) |
| **Preview** | 0.32.0-preview.0 | Preview |
| **Nightly** | 0.33.0-nightly | Nightly |
| **bkit Tested** | 0.29.0 ~ 0.30.0 | bkit v1.5.5 |

### 1.3 Analysis Scope

- Gemini CLI v0.30.0 -> v0.31.0 (stable) + v0.32.0-preview.0
- bkit Extension full feature inventory and API dependency mapping
- bkit-system/philosophy/ alignment analysis (4 philosophy files)
- CTO perspective: architecture, performance, security improvements
- CPO perspective: user experience, workflow automation, competitive positioning

---

## 2. CTO Team Composition

| Agent | Role | Analysis Focus |
|:---:|:---:|---|
| **version-researcher** | Version Analyst | Official docs, changelogs, release notes |
| **github-researcher** | GitHub Analyst | Issues, PRs, discussions, commit history |
| **blog-researcher** | Content Analyst | Tech blogs, community resources, competitive analysis |
| **bkit-auditor** | Codebase Auditor | Full feature inventory, API dependency mapping |
| **philosophy-analyst** | Strategy Analyst | Philosophy alignment, evolution direction |
| **impact-analyst** | Impact Analyst | Impact scope, compatibility, migration |
| **ux-strategist** | UX Strategist | CTO/CPO perspective UX improvements |
| **innovation-lead** | Innovation Lead | Feature enhancement, innovation, roadmap proposals |
| **Team Lead (CTO)** | Coordinator | Overall coordination, final report, quality assurance |

---

## 3. Analysis Methodology

```
Phase 1: Parallel Research (5 agents)
|-- Official docs + npm registry + GitHub releases
|-- GitHub issues / PRs / discussions
|-- Tech blogs + community
|-- bkit codebase full audit
|-- Philosophy alignment

Phase 2: Deep Analysis (3 agents)
|-- Impact scope analysis (based on Phase 1)
|-- CTO/CPO UX strategy (based on Phase 1)
|-- Innovation proposals (based on Phase 1+2)

Phase 3: Comprehensive Report (Team Lead)
|-- Integrate all agent results + write final report
```

---

## 4. Research Sources

### 4.1 Official Documentation
- Gemini CLI Release Notes (geminicli.com/docs/changelogs/)
- Gemini CLI Latest Stable v0.31.0 changelog
- Gemini CLI Preview v0.32.0-preview.0 changelog
- Gemini CLI Extension Reference
- Gemini CLI Policy Engine docs
- Gemini CLI Hooks Reference

### 4.2 GitHub
- google-gemini/gemini-cli releases
- GitHub issues and PRs (#19598, #19284, #19180, #19046, #18791, #19567, #19703)
- npm @google/gemini-cli version history

### 4.3 Tech Blogs & Community
- AI coding tool comparisons and trends (2026)
- PDCA methodology in AI development
- Context Engineering research

### 4.4 bkit Codebase
- All 10 hook scripts + hooks.json
- All 29 skills (SKILL.md files)
- All 16 agents (agent .md files)
- lib/ modules (180 exports)
- MCP server (spawn-agent-server.js)
- Configuration files (bkit.config.json, gemini-extension.json)
- Philosophy files (bkit-system/philosophy/*.md)

---

## 5. Expected Deliverables

| # | Deliverable | Location | Status |
|:---:|---|---|:---:|
| 1 | **Feature Enhancement Proposals** (10 proposals with roadmap) | `docs/03-analysis/gemini-cli-031-feature-enhancement-proposals.analysis.md` | Completed |
| 2 | **Comprehensive Analysis Report** (CTO/CPO multi-perspective) | `docs/04-report/gemini-cli-031-upgrade-comprehensive-analysis.report.md` | Completed |
| 3 | **This Plan Document** | `docs/01-plan/features/gemini-cli-031-upgrade-analysis.plan.md` | Completed |

---

## 6. Key Findings Summary

### 6.1 Impact Score: 75/100 (High-Medium)

- **Breaking Changes**: 2 items (LOW severity) - 100% backward compatible
- **Required Updates**: 2 items (version-detector, config)
- **Recommended Updates**: 4 items (policy, hooks, MCP, manifest)
- **Opportunity Items**: 8 items (RuntimeHook, SDK, Browser, Plan, etc.)

### 6.2 Top 3 CTO Recommendations

1. **RuntimeHook Function Migration** - 99% faster hook execution (P1)
2. **Plan Mode <-> PDCA Integration** - Unified workflow automation (P1)
3. **MCP Progress Updates** - Real-time feedback during agent operations (P1)

### 6.3 Top 3 CPO Recommendations

1. **MCP Progress** - Users immediately feel the improvement (P1)
2. **Plan Mode Integration** - 50% reduction in PDCA Plan creation time (P1)
3. **Level-based Auto Policy** - Safe defaults for beginners (P2)

### 6.4 Philosophy Alignment

All 3 core philosophies (Automation First, No Guessing, Docs=Code) are **strengthened** by v0.31.0 capabilities. All 8 Context Engineering FRs have enhancement opportunities.

---

## 7. Roadmap Summary

```
v1.5.6 (Patch - 1h)
|-- Version Detector: v0.31.0 feature flags
|-- bkit.config.json: testedVersions update

v1.6.0 (Feature Release - ~24h)
|-- Plan Mode <-> PDCA integration
|-- MCP Progress real-time feedback
|-- RuntimeHook Function (top 3 hooks)
|-- Level-based auto Policy generation
|-- Tool Annotation Policy Rules
|-- Extension Registry preparation

v1.7.0 (Major Feature - ~22h)
|-- Browser Agent (browser-researcher)
|-- SDK Hybrid Skills (5 skills)
|-- RuntimeHook Function (remaining 7 hooks)
|-- UI/UX improvements (Progress Dashboard)

v2.0.0 (Architecture - Future)
|-- Full SDK-based skill architecture
|-- Plugin marketplace integration
|-- Multi-CLI support
|-- AI-Native Development Platform
```

---

## References

- See full references in [Analysis Document](../../03-analysis/gemini-cli-031-feature-enhancement-proposals.analysis.md#references)
- See full references in [Report Document](../../04-report/gemini-cli-031-upgrade-comprehensive-analysis.report.md#appendix-a-참조-소스)
- Previous analysis: [v0.29-v0.30 Impact Analysis](../../04-report/gemini-cli-029-030-upgrade-impact-analysis.report.md)
- Previous migration: [v0.30 Migration Report](../../04-report/features/gemini-cli-030-migration.report.md)

---

*bkit Vibecoding Kit v1.5.5 - Gemini CLI v0.31.0 Upgrade Analysis Plan*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*
