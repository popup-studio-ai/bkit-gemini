---
name: qa-phase
classification: W
description: |
  Run QA tests at various levels (L1-L5) for features under PDCA management.
  Integrates with MCP tools to execute structured test plans.

  Use proactively when user asks to test, validate, or run QA on a feature.

  Triggers: qa, test, QA, quality assurance, run tests, test plan,
  테스트, QA, 품질 보증, 검증, 테스트 실행,
  テスト, QA, 品質保証, テスト実行,
  测试, QA, 质量保证, 运行测试,
  prueba, QA, aseguramiento de calidad, ejecutar pruebas,
  test, QA, assurance qualité, exécuter les tests,
  Test, QA, Qualitätssicherung, Tests ausführen,
  test, QA, garanzia di qualità, eseguire test

  Do NOT use for: unit test writing (just write them), production monitoring

# ──── NEW FIELDS (v2.0.4) ────
user-invocable: true
argument-hint: "[feature] [--level L1-L5]"

allowed-tools:
  - read_file
  - read_many_files
  - write_file
  - glob
  - grep_search
  - list_directory
  - run_shell_command
  - bkit_qa_run

imports: []

agents:
  analyze: gap-detector
  review: code-analyzer

context: session
memory: project
pdca-phase: check
---

# QA Phase Skill

> Structured QA testing with 5 levels from syntax to production-readiness

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/qa-phase [feature]` | Run default (L2) QA | `/qa-phase user-auth` |
| `/qa-phase [feature] --level L1` | Syntax check only | `/qa-phase user-auth --level L1` |
| `/qa-phase [feature] --level L3` | Full test suite | `/qa-phase user-auth --level L3` |
| `/qa-phase [feature] --level L5` | Production readiness | `/qa-phase user-auth --level L5` |

## MCP Integration

This skill uses the `bkit_qa_run` MCP tool to execute QA tests.

### How to Execute

1. Parse the feature name and level from arguments
2. Call `bkit_qa_run` with `{ feature, level }`
3. Display results with pass/fail indicators
4. If failures found, suggest specific fixes

## QA Levels

### L1: Syntax and Lint

- File syntax validation (`node -c`, `tsc --noEmit`, etc.)
- Linting rules (ESLint, Prettier)
- Import/require resolution check
- No build errors

### L2: Unit and Logic (Default)

All of L1, plus:
- Unit test execution (Jest, Mocha, Vitest)
- Test coverage check (minimum threshold)
- Logic validation against Design document
- Edge case identification

### L3: Integration

All of L2, plus:
- API endpoint testing
- Database query validation
- Third-party service mock testing
- Cross-module interaction tests

### L4: End-to-End

All of L3, plus:
- User flow testing (Playwright, Cypress)
- Browser compatibility (if web)
- Performance benchmarks
- Accessibility checks (a11y)

### L5: Production Readiness

All of L4, plus:
- Security scan (dependency audit, OWASP checks)
- Load testing results review
- Rollback verification
- Documentation completeness
- Deploy checklist validation

## Test Plan Generation

When no existing tests are found:

1. Read the Design document for the feature
2. Extract testable requirements
3. Generate a test plan with:
   - Test case descriptions
   - Expected inputs and outputs
   - Edge cases to cover
4. Write test plan to `docs/qa/{feature}-test-plan.md`

## Output Format

```markdown
## QA Report: {feature} (Level {level})

### Summary
- Level: L2 (Unit and Logic)
- Total checks: 24
- Passed: 22
- Failed: 2
- Coverage: 87%

### Results

#### L1: Syntax and Lint
- [PASS] File syntax valid (8/8 files)
- [PASS] ESLint clean (0 errors, 2 warnings)

#### L2: Unit and Logic
- [PASS] Unit tests (18/20 passing)
- [FAIL] Missing test for edge case: empty input
- [FAIL] Coverage below threshold (87% < 90%)

### Recommendations
1. Add test for empty input handling in src/validators/user.js
2. Add tests for error paths in src/api/auth.js to reach 90% coverage
```

## Integration with PDCA

QA Phase maps to the Check phase:
1. Complete implementation (Do phase)
2. Run `/qa-phase {feature} --level L2` for initial check
3. Fix issues and re-run until passing
4. Run `/qa-phase {feature} --level L3+` for deeper validation
5. Results feed into `/pdca analyze` match rate calculation
