---
name: pm-discovery
classification: H
description: |
  PM Agent Team - Automated product discovery, strategy, and PRD generation.
  Runs PM analysis workflow to produce comprehensive PRD before PDCA Plan phase.

  Triggers: pm team, product discovery, PM analysis,
  PM 분석, 제품 기획, PMチーム,
  PM分析, 产品分析, PM-Analyse,
  PM análisis, analyse PM, analisi PM

user-invocable: false
allowed-tools:
  - read_file
  - write_file
  - replace
  - glob
  - grep_search
  - google_web_search
  - web_fetch
  - tracker_create_task
  - tracker_update_task
  - tracker_list_tasks

agents:
  discovery: pm-discovery
  strategy: pm-strategy
  research: pm-research
  prd: pm-prd
  lead: pm-lead

context: session
memory: project
classification: workflow
---

# PM Agent Team Skill

> Automated product discovery, strategy analysis, and PRD generation.
> Produces a comprehensive PRD before the PDCA Plan phase begins.

## Overview

The PM Agent Team applies 8 professional product management frameworks to
systematically analyze a feature before implementation begins. This ensures
that development is grounded in validated strategy rather than assumptions.

## PM Frameworks

The following frameworks are applied across the 4-phase workflow:

| # | Framework | Phase | Purpose |
|---|-----------|-------|---------|
| 1 | Opportunity Solution Tree (OST) | Discovery | Map problem space systematically |
| 2 | Teresa Torres' Continuous Discovery | Discovery | Evidence-based opportunity identification |
| 3 | JTBD 6-Part Value Proposition | Strategy | Define who, why, and what progress |
| 4 | Lean Canvas | Strategy | Validate business model viability |
| 5 | User Personas (JTBD-based) | Research | Humanize target segments |
| 6 | Competitor Analysis Matrix | Research | Identify differentiation opportunities |
| 7 | TAM/SAM/SOM Dual Validation | Research | Size the market with confidence |
| 8 | Beachhead Segment + GTM (Moore) | PRD | Define go-to-market strategy |

## 4-Phase Workflow

```
Phase 1: Discovery (OST)
    Desired Outcome → Opportunities → Solutions → Experiments
        │
Phase 2: Strategy (VP + Lean Canvas)
    JTBD 6-Part → Lean Canvas → Key Assumptions
        │
Phase 3: Research (Personas + Competitors + Market)
    3 Personas → 5 Competitors → TAM/SAM/SOM
        │
Phase 4: PRD Synthesis
    Beachhead → GTM → 8-Section PRD
        │
    Output: docs/00-pm/{feature}.prd.md
```

## Usage

### Via PDCA Command

```
/pdca pm {feature-name}
```

This runs the full PM Team workflow for the specified feature and outputs
the PRD to `docs/00-pm/{feature-name}.prd.md`.

### Direct Agent Invocation

Individual phases can be triggered by mentioning relevant keywords:

- **Discovery**: "opportunity analysis", "OST", "customer pain points"
- **Strategy**: "value proposition", "lean canvas", "JTBD"
- **Research**: "persona", "competitor analysis", "market sizing"
- **PRD**: "product requirements", "beachhead", "GTM strategy"

## PDCA Integration

The PM Team workflow is a pre-phase that feeds into the PDCA cycle:

```
PM Team → PRD
              ↓
         PDCA Plan  → references PRD for requirements
              ↓
         PDCA Design → translates PRD into technical design
              ↓
         PDCA Do     → implements the design
              ↓
         PDCA Check  → verifies implementation against design
              ↓
         PDCA Act    → iterates until quality threshold met
```

### Handoff

After the PRD is generated, the PM lead agent guides the user to:
1. Review the PRD for completeness and accuracy
2. Run `/pdca plan {feature}` to begin the implementation cycle
3. The Plan phase automatically references the PRD as its source document

## Output Structure

```
docs/
  00-pm/
    {feature}.prd.md          # Complete PRD with all 4 phases
```

The PRD includes all analysis outputs in a single consolidated document:
- Discovery analysis (OST map, opportunity ranking)
- Strategy analysis (JTBD table, Lean Canvas, assumptions)
- Research analysis (personas, competitor matrix, market sizing)
- Beachhead selection and GTM strategy
- Full 8-section PRD with user stories and acceptance criteria

## Agents

| Agent | Role | Model | Temp |
|-------|------|-------|------|
| pm-lead | Orchestrates 4-phase workflow | gemini-3.1-pro | 0.3 |
| pm-discovery | OST analysis | gemini-3.1-pro | 0.5 |
| pm-strategy | JTBD + Lean Canvas | gemini-3.1-pro | 0.4 |
| pm-research | Personas + Competitors + Market | gemini-3.1-pro | 0.4 |
| pm-prd | PRD synthesis + Beachhead + GTM | gemini-3.1-pro | 0.3 |
