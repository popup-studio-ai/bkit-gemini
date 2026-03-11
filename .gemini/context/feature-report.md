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
- **PDCA PM Skill**: /pdca pm (project management workflow with discovery, strategy, research, PRD)
- **Agents**: gap-detector, pdca-iterator, code-analyzer, report-generator, starter-guide, design-validator, qa-monitor, pipeline-guide, bkend-expert, enterprise-expert, infra-architect, cto-lead, frontend-architect, security-architect, product-manager, qa-strategist
- **PM Agents**: pm-lead, pm-discovery, pm-strategy, pm-research, pm-prd
- **Level Skills**: /starter, /dynamic, /enterprise
- **Phase Skills**: /phase-1-schema ~ /phase-9-deployment
- **Utility Skills**: /code-review, /zero-script-qa, /development-pipeline, /output-style
- **Workflow Skills**: /plan-plus (enhanced planning with multi-source research), /simplify (complexity reduction), /loop (recurring interval execution), /batch (parallel multi-feature processing), /output-style-setup (install output styles)

### PDCA Phase Recommendations

| Current Phase | Completed | Recommended Next | Command |
|---------------|-----------|------------------|---------|
| (none) | - | Start planning | `/pdca plan <feature>` |
| Plan | Plan doc created | Design phase | `/pdca design <feature>` |
| Design | Design doc created | Implementation | `/pdca do <feature>` |
| Do | Code implemented | Gap analysis | `/pdca analyze <feature>` |
| Check | Match Rate < 90% | Iterate to fix gaps | `/pdca iterate <feature>` |
| Check | Match Rate >= 90% | Generate report | `/pdca report <feature>` |
| Act | Gaps resolved | Re-analyze | `/pdca analyze <feature>` |
| Report | Report generated | Archive or next feature | `/pdca archive <feature>` |
