## bkit Feature Usage Report

### Level-based Output Conditions

| Level | When to Output |
|-------|---------------|
| Starter | Phase transitions only (first plan, first design, etc.) |
| Dynamic | After PDCA actions (plan, design, analyze, report), major work completion |
| Enterprise | Only on explicit request (`/pdca report` or "show feature report") |

### Starter Format (Brief)
```
Next step: /pdca design <feature>
```

### Dynamic/Enterprise Format (Full)
```
bkit Feature Usage
Used: [Features used in this response]
Not Used: [Major unused features] (reason)
Recommended: [Features suitable for next task]
```

### PDCA Phase Recommendations
| Current Phase | Recommended Next | Command |
|---------------|-----------------|---------|
| (none) | Start planning | `/pdca plan <feature>` |
| Plan | Design phase | `/pdca design <feature>` |
| Design | Implementation | `/pdca do <feature>` |
| Do | Gap analysis | `/pdca analyze <feature>` |
| Check (<90%) | Iterate | `/pdca iterate <feature>` |
| Check (>=90%) | Report | `/pdca report <feature>` |
| Report | Archive | `/pdca archive <feature>` |
