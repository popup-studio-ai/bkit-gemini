# PDCA Iteration Report: {{FEATURE_NAME}}

## Overview

| Item | Value |
|------|-------|
| Feature | {{FEATURE_NAME}} |
| Date | {{DATE}} |
| Total Iterations | {{TOTAL_ITERATIONS}} |
| Final Status | {{STATUS}} |
| Duration | {{DURATION}} |

## Iteration Configuration

```yaml
evaluators:
  - gap-detector
  - code-analyzer
  - qa-monitor

thresholds:
  gap_analysis: {{GAP_THRESHOLD}}%
  code_quality: {{QUALITY_THRESHOLD}}%
  functional: {{FUNCTIONAL_THRESHOLD}}%

limits:
  max_iterations: {{MAX_ITERATIONS}}
  fixes_per_iteration: {{FIX_LIMIT}}
```

## Score Progression

### Summary Chart

```
Score (%)
100 ┤
 90 ┼──────────────────────────── Target ──────
 80 ┤      ╭────────╮
 70 ┤   ╭──╯        ╰──────────────────────────
 60 ┤───╯
 50 ┤
    └───┬────┬────┬────┬────┬────┬────┬────┬───
       Init  1    2    3    4    5    6    7
                     Iteration
```

### Detailed Scores

| Iteration | Gap Analysis | Code Quality | Functional | Overall |
|-----------|--------------|--------------|------------|---------|
| Initial | {{INIT_GAP}}% | {{INIT_QUALITY}}% | {{INIT_FUNC}}% | {{INIT_OVERALL}}% |
{{#ITERATIONS}}
| {{ITER_NUM}} | {{GAP}}% | {{QUALITY}}% | {{FUNC}}% | {{OVERALL}}% |
{{/ITERATIONS}}
| **Final** | **{{FINAL_GAP}}%** | **{{FINAL_QUALITY}}%** | **{{FINAL_FUNC}}%** | **{{FINAL_OVERALL}}%** |

## Issues Fixed

### By Severity

| Severity | Initial | Fixed | Remaining |
|----------|---------|-------|-----------|
| 🔴 Critical | {{CRITICAL_INIT}} | {{CRITICAL_FIXED}} | {{CRITICAL_REMAIN}} |
| 🟡 Warning | {{WARNING_INIT}} | {{WARNING_FIXED}} | {{WARNING_REMAIN}} |
| 🟢 Info | {{INFO_INIT}} | {{INFO_FIXED}} | {{INFO_REMAIN}} |

### By Category

| Category | Initial | Fixed | Remaining |
|----------|---------|-------|-----------|
| Design-Impl Gap | {{GAP_INIT}} | {{GAP_FIXED}} | {{GAP_REMAIN}} |
| Security | {{SEC_INIT}} | {{SEC_FIXED}} | {{SEC_REMAIN}} |
| Code Quality | {{QUAL_INIT}} | {{QUAL_FIXED}} | {{QUAL_REMAIN}} |
| Functional | {{FUNC_INIT}} | {{FUNC_FIXED}} | {{FUNC_REMAIN}} |

## Iteration Details

{{#ITERATIONS}}
### Iteration {{ITER_NUM}}

**Scores:** Gap {{GAP}}% | Quality {{QUALITY}}% | Functional {{FUNC}}%

**Issues Addressed:**
{{#ISSUES}}
- [{{SEVERITY}}] {{DESCRIPTION}}
  - Location: `{{LOCATION}}`
  - Fix: {{FIX_DESCRIPTION}}
{{/ISSUES}}

**Files Modified:**
{{#FILES}}
- {{ACTION}}: `{{PATH}}`
{{/FILES}}

---
{{/ITERATIONS}}

## Changes Summary

### Created Files

{{#CREATED_FILES}}
- `{{PATH}}`
  - Purpose: {{PURPOSE}}
{{/CREATED_FILES}}

### Modified Files

{{#MODIFIED_FILES}}
- `{{PATH}}`
  - Changes: {{CHANGES}}
{{/MODIFIED_FILES}}

### Deleted Files

{{#DELETED_FILES}}
- `{{PATH}}`
  - Reason: {{REASON}}
{{/DELETED_FILES}}

## Remaining Issues

{{#HAS_REMAINING_ISSUES}}
The following issues could not be auto-fixed and require manual attention:

{{#REMAINING_ISSUES}}
### {{ISSUE_NUM}}. {{TITLE}}

- **Severity:** {{SEVERITY}}
- **Category:** {{CATEGORY}}
- **Location:** `{{LOCATION}}`
- **Description:** {{DESCRIPTION}}
- **Reason Not Fixed:** {{REASON}}
- **Suggested Action:** {{SUGGESTION}}

{{/REMAINING_ISSUES}}
{{/HAS_REMAINING_ISSUES}}

{{^HAS_REMAINING_ISSUES}}
✅ All identified issues have been addressed.
{{/HAS_REMAINING_ISSUES}}

## Recommendations

### Immediate Actions

{{#IMMEDIATE_ACTIONS}}
1. {{ACTION}}
{{/IMMEDIATE_ACTIONS}}

### Follow-up Tasks

{{#FOLLOWUP_TASKS}}
- [ ] {{TASK}}
{{/FOLLOWUP_TASKS}}

## Quality Metrics

### Before/After Comparison

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Design-Impl Match | {{BEFORE_GAP}}% | {{AFTER_GAP}}% | {{CHANGE_GAP}} |
| Security Score | {{BEFORE_SEC}} | {{AFTER_SEC}} | {{CHANGE_SEC}} |
| Complexity Avg | {{BEFORE_COMPLEX}} | {{AFTER_COMPLEX}} | {{CHANGE_COMPLEX}} |
| Code Duplication | {{BEFORE_DUP}} | {{AFTER_DUP}} | {{CHANGE_DUP}} |

## Next Steps

```
{{#SUCCESS}}
✅ Iteration successful. Proceed with:
   1. Review changes: /pdca-analyze {{FEATURE_NAME}}
   2. Manual testing of critical paths
   3. Create completion report: /pdca-report {{FEATURE_NAME}}
{{/SUCCESS}}

{{#PARTIAL}}
⚠️ Partial success. Manual intervention needed:
   1. Review remaining issues above
   2. Make manual fixes or design decisions
   3. Re-run iteration: /pdca-iterate {{FEATURE_NAME}}
{{/PARTIAL}}

{{#FAILURE}}
❌ Iteration failed. Required actions:
   1. Review failure reasons in report
   2. Update design document if needed
   3. Address blocking issues manually
   4. Re-attempt: /pdca-iterate {{FEATURE_NAME}}
{{/FAILURE}}
```

---

## Appendix

### A. Evaluator Criteria Used

#### Gap Analysis

```yaml
api_endpoints:
  match_rate: {{GAP_THRESHOLD}}%
  weight: 30%
data_models:
  match_rate: {{MODEL_THRESHOLD}}%
  weight: 30%
components:
  match_rate: {{COMP_THRESHOLD}}%
  weight: 20%
error_handling:
  coverage: {{ERROR_THRESHOLD}}%
  weight: 20%
```

#### Code Quality

```yaml
security:
  critical_issues: 0
  weight: 40%
complexity:
  max_per_function: 15
  weight: 20%
duplication:
  max_lines: 10
  weight: 20%
maintainability:
  min_score: 70
  weight: 20%
```

### B. Tool Usage Statistics

| Tool | Invocations | Success Rate |
|------|-------------|--------------|
| Read | {{READ_COUNT}} | {{READ_SUCCESS}}% |
| Write | {{WRITE_COUNT}} | {{WRITE_SUCCESS}}% |
| Edit | {{EDIT_COUNT}} | {{EDIT_SUCCESS}}% |
| Grep | {{GREP_COUNT}} | {{GREP_SUCCESS}}% |
| Bash | {{BASH_COUNT}} | {{BASH_SUCCESS}}% |

### C. Performance Metrics

| Metric | Value |
|--------|-------|
| Total Duration | {{TOTAL_DURATION}} |
| Avg Iteration Time | {{AVG_ITER_TIME}} |
| Evaluation Time | {{EVAL_TIME}} |
| Fix Application Time | {{FIX_TIME}} |

---

*Generated by bkit Evaluator-Optimizer Pattern*
*POPUP STUDIO PTE. LTD. - https://popupstudio.ai*
