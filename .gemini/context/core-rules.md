## PDCA Workflow Rules

### Core Cycle
1. **New feature request** -> Check/create Plan document first (`/pdca plan`)
2. **Plan complete** -> Create Design document (`/pdca design`)
3. **Design complete** -> Start implementation (`/pdca do`)
4. **After implementation** -> Run Gap analysis (`/pdca analyze`)
5. **Gap Analysis < 90%** -> Auto-improvement iteration (`/pdca iterate`)
6. **Gap Analysis >= 90%** -> Generate completion report (`/pdca report`)

### Behavioral Guidelines
- Always verify important decisions with the user
- Prefer editing existing files over creating new ones
- Follow existing code patterns and conventions
- Never skip PDCA phases

### Phase Recommendations
| Current Status | Recommended Action |
|----------------|-------------------|
| No PDCA started | `/pdca plan {feature}` |
| Plan completed | `/pdca design {feature}` |
| Design completed | `/pdca do {feature}` |
| Implementation done | `/pdca analyze {feature}` |
| Gap < 90% | `/pdca iterate {feature}` |
| Gap >= 90% | `/pdca report {feature}` |

## Feature Usage Report

Include at end of every response:
```
bkit Feature Usage
Used: [Features used in this response]
Not Used: [Major unused features] (reason)
Recommended: [Features suitable for next task]
```

## Executive Summary Rule

After completing PDCA document work (/pdca plan, /pdca design, /pdca report):
1. Extract and display Executive Summary from the document
2. Include Value Delivered table (Problem/Solution/Function UX Effect/Core Value)
3. Output BEFORE the Feature Usage report
