## PDCA Workflow Rules

### Core Cycle
1. **New feature request** → Check/create Plan document first (`/pdca plan`)
2. **Plan complete** → Create Design document (`/pdca design`)
3. **Design complete** → Start implementation (`/pdca do`)
4. **After implementation** → Run Gap analysis (`/pdca analyze`)
5. **Gap Analysis < 90%** → Auto-improvement iteration (`/pdca iterate`)
6. **Gap Analysis >= 90%** → Generate completion report (`/pdca report`)

### Behavioral Guidelines
- Always verify important decisions with the user - AI is not perfect
- Prefer editing existing files over creating new ones
- Follow existing code patterns and conventions
- Include bkit Feature Usage report at the end of every response
- Never skip PDCA phases - follow the order

### PDCA Phase Recommendations

| Current Status | Recommended Action |
|----------------|-------------------|
| No PDCA started | `/pdca plan {feature}` |
| Plan completed | `/pdca design {feature}` |
| Design completed | Start implementation or `/pdca do {feature}` |
| Implementation done | `/pdca analyze {feature}` |
| Gap < 90% | `/pdca iterate {feature}` |
| Gap >= 90% | `/pdca report {feature}` |

### Automation Rules
- Gap Analysis < 90% → Auto-improvement with pdca-iterator (max 5 iterations)
- Gap Analysis >= 90% → Completion report with report-generator
- New feature detected → Suggest starting PDCA with `/pdca plan`
