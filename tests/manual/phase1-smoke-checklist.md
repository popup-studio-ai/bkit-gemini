# Phase 1 Manual Smoke Test Checklist
# Gemini CLI v0.30.0 Compatibility Verification

> **Test ID**: P1-01, P1-18
> **Priority**: P0 (must complete before v1.5.5 release)
> **Estimated Duration**: 2.5 hours
> **Requires**: Actual Gemini CLI v0.30.0 installation

---

## Test Record Header

| Field | Value |
|-------|-------|
| Date | |
| Tester | |
| Gemini CLI Version (verified) | |
| bkit Version | 1.5.5 |
| OS / Platform | |
| Overall Result | PASS / FAIL |

---

## P1-01: v0.30.0 Compatibility Smoke Test

### Prerequisites

```bash
# Verify CLI version
gemini --version
# Expected output: 0.30.0

# Set up test project
mkdir -p /tmp/bkit-smoke-test/src /tmp/bkit-smoke-test/docs
cd /tmp/bkit-smoke-test

# Ensure bkit extension is loaded
# (Extension should be in ~/.gemini/extensions/bkit or configured)
```

### Test Steps

#### Step 1: Verify CLI Version

```bash
gemini --version
```

| Expected | Actual | Status |
|----------|--------|--------|
| Contains "0.30.0" | | PASS / FAIL |

#### Step 2: Start New Session (Session-Start Hook)

```bash
cd /tmp/bkit-smoke-test
gemini
```

Observe the output immediately after session starts.

| Expected | Actual | Status |
|----------|--------|--------|
| bkit initialization message appears | | PASS / FAIL |
| Project level detected (Starter for empty dir) | | PASS / FAIL |
| No JavaScript error/stack trace visible | | PASS / FAIL |
| No "Module not found" errors | | PASS / FAIL |

#### Step 3: Policy TOML Auto-Generation

After session start, check for auto-generated policy file:

```bash
# In a new terminal (keep gemini session open)
ls -la /tmp/bkit-smoke-test/.gemini/policies/
cat /tmp/bkit-smoke-test/.gemini/policies/bkit-permissions.toml
```

| Expected | Actual | Status |
|----------|--------|--------|
| `.gemini/policies/` directory exists | | PASS / FAIL |
| `bkit-permissions.toml` file exists | | PASS / FAIL |
| File starts with `# bkit-gemini` comment | | PASS / FAIL |
| File contains `[[rule]]` syntax | | PASS / FAIL |
| File contains `decision = "deny"` for rm -rf rule | | PASS / FAIL |
| File contains `decision = "ask_user"` for ask rules | | PASS / FAIL |
| File does NOT contain `decision = "ask"` (wrong value) | | PASS / FAIL |

Sample expected TOML content:
```toml
# bkit-gemini v1.5.5 - Auto-generated Policy File

# --- Deny Rules (highest priority) ---

[[rule]]
toolName = "run_shell_command"
commandPrefix = "rm -rf"
decision = "deny"
priority = 100
```

#### Step 4: Tool Execution (BeforeTool Hook)

In the Gemini session, ask it to read a file:

```
read the current directory listing
```

| Expected | Actual | Status |
|----------|--------|--------|
| Tool executes without permission errors | | PASS / FAIL |
| No hook crash messages in output | | PASS / FAIL |
| Normal tool output returned | | PASS / FAIL |

#### Step 5: Dangerous Command Block (BeforeTool Security)

Ask the model to attempt a dangerous command:

```
run the command: rm -rf /tmp/test-delete-me
```

| Expected | Actual | Status |
|----------|--------|--------|
| Command is blocked or requires confirmation | | PASS / FAIL |
| Warning message displayed | | PASS / FAIL |
| No actual deletion occurs | | PASS / FAIL |

#### Step 6: Intent Detection (BeforeAgent Hook)

Type a phrase that should trigger gap-detector:

```
verify my design document
```

| Expected | Actual | Status |
|----------|--------|--------|
| gap-detector agent suggested or triggered | | PASS / FAIL |
| No hook error messages | | PASS / FAIL |

Type a phrase that should trigger pdca-iterator:

```
improve and fix the implementation
```

| Expected | Actual | Status |
|----------|--------|--------|
| pdca-iterator agent suggested | | PASS / FAIL |

#### Step 7: Session Exit

Type `/exit` or Ctrl+C to end the session.

| Expected | Actual | Status |
|----------|--------|--------|
| Session exits cleanly | | PASS / FAIL |
| No orphaned node processes | | PASS / FAIL |

Verify no orphaned processes:
```bash
ps aux | grep "spawn-agent-server" | grep -v grep
# Expected: no results
```

| Expected | Actual | Status |
|----------|--------|--------|
| No orphaned spawn-agent-server processes | | PASS / FAIL |

### P1-01 Overall Result

| Step | Status | Notes |
|------|--------|-------|
| 1. CLI version verified | | |
| 2. Session start clean | | |
| 3. Policy TOML generated | | |
| 4. Tool execution works | | |
| 5. Dangerous command blocked | | |
| 6. Intent detection works | | |
| 7. Clean exit | | |

**P1-01 OVERALL**: PASS / FAIL

**Failure Notes** (if any):

---

## P1-18: model-selection.md Gemini 3.1 Pro Information

### File Location

```
/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/guides/model-selection.md
```

### Verification Checklist

Open the file and verify each of the following items is present and accurate:

| Item | Expected Value | Present? | Accurate? |
|------|---------------|----------|-----------|
| Model name (preview) | `gemini-3.1-pro-preview` | | |
| Model name (customtools) | `gemini-3.1-pro-preview-customtools` | | |
| Release date | 2026-02-19 | | |
| Context window | 1,000,000 tokens | | |
| ARC-AGI-2 score | 77.1% | | |
| Pricing - input | $2.00 per 1M tokens | | |
| Pricing - output | $12.00 per 1M tokens | | |
| Recommended for cto-lead | Yes (customtools variant) | | |
| Recommended for gap-detector | Yes (analysis accuracy) | | |
| flash-lite recommendation | For report-generator, qa-monitor | | |

**P1-18 OVERALL**: PASS / FAIL

**Notes**:

---

## Post-Test Actions

After completing manual tests:

1. Fill in the test record header at the top of this document
2. Save this file with test results
3. Update PDCA status if all P1-01 and P1-18 items pass:
   - Both manual gates cleared = Phase 1 manual verification COMPLETE
4. If any items FAIL, create an issue and do NOT proceed to v1.5.5 release

### Quick Reference: Known Version Differences

| Feature | v0.29.0 | v0.30.0 | Notes |
|---------|:-------:|:-------:|-------|
| Policy Engine | Preview | GA (stable) | TOML auto-generation required |
| @google/gemini-cli-core | N/A | 0.30.0 | New SDK package |
| ask_user schema | Optional question type | Required question type | BC-02 |
| excludeTools in manifest | Supported | Deprecated fallback | BC-01 |
| FORWARD_ALIASES | Active | Active | 5 future tool name mappings |
