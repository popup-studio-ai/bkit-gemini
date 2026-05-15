#!/usr/bin/env bash
# v2.0.7-S1 PR-time CI stub runner.
#
# Goal: full validation in <= 5 minutes with zero LLM API calls.
# Sprint: v2.0.7-ci-stub-mode
# Sets BKIT_TEST_MODE=stub so any test using lib/test/llm-replay.js will:
#   - read fixtures from tests/fixtures/llm-responses/
#   - fail-fast on fixture miss (no silent live fallback)
#
# Usage (CI):
#   ./scripts/run-ci-stub.sh
#
# Exit codes:
#   0  — all suites passed
#   >0 — at least one suite failed (LLM-bound or otherwise)
#
# Future (incremental):
#   - tests/scenarios/*.test.js for automated L3/L4/L5 canaries
#   - GitHub Actions yaml integration
set -euo pipefail

export BKIT_TEST_MODE=stub
export NODE_OPTIONS="${NODE_OPTIONS:-}"  # honor caller's --max-old-space-size etc.

# Step 1 — Strict unit/integration baseline (zero LLM calls today)
echo "[bkit-stub] Running strict baseline (tests/run-all.js --strict)..."
node tests/run-all.js --strict

# Step 2 — Replay framework regression
echo "[bkit-stub] Running llm-replay regression..."
node tests/regression/test-mode/llm-replay.test.js

# Step 3 — Security regression suites
echo "[bkit-stub] Running security regression..."
for f in tests/regression/security/*.test.js; do
  node "$f"
done

# Step 4 — Agent dispatch + before-model integration (S3)
echo "[bkit-stub] Running agent-dispatch regression..."
for f in tests/regression/agent-dispatch/*.test.js; do
  node "$f"
done

# Step 5 — S7 cohort (trust-score, cmd-parser, checkpoint, before-phase, sprint-dryrun)
echo "[bkit-stub] Running S7 regression cohort..."
for d in trust-score cmd-parser checkpoint before-phase sprint-dryrun; do
  for f in tests/regression/$d/*.test.js; do
    [ -f "$f" ] && node "$f"
  done
done

echo "[bkit-stub] CI stub run complete."
