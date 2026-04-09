---
name: btw
classification: W
description: |
  Collect improvement suggestions during work. By-The-Way captures ideas,
  observations, and suggestions without interrupting the current workflow.
  Stores entries in .bkit/btw.json for later review and promotion.

  Use proactively when user says "btw", mentions a suggestion, improvement idea,
  or wants to note something for later.

  Triggers: btw, suggestion, improve, idea, feedback, note for later, by the way,
  제안, 개선, 아이디어, 피드백, 참고로,
  提案, 改善, アイデア, フィードバック, ちなみに,
  建议, 改进, 想法, 反馈, 顺便说一下,
  sugerencia, mejora, idea, retroalimentación,
  amélioration, suggestion, idée, retour,
  Verbesserung, Vorschlag, Idee, Feedback,
  miglioramento, suggerimento, idea, feedback

  Do NOT use for: bug reports (use issues), task tracking (use PDCA)

# ──── NEW FIELDS (v2.0.4) ────
user-invocable: true
argument-hint: "[\"suggestion text\"|list|analyze|promote [id]]"

allowed-tools:
  - read_file
  - write_file
  - glob
  - grep_search

imports: []

agents: {}

context: session
memory: project
pdca-phase: act
---

# BTW (By-The-Way) Skill

> Capture improvement suggestions on the fly without disrupting your workflow

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/btw "text"` | Record a new suggestion | `/btw "Consider adding input validation to user form"` |
| `/btw list` | Show all collected suggestions | `/btw list` |
| `/btw analyze` | Analyze and categorize suggestions | `/btw analyze` |
| `/btw promote [id]` | Promote suggestion to PDCA feature | `/btw promote 3` |

## How It Works

### Recording a Suggestion

1. Read `.bkit/btw.json` (create if it does not exist)
2. Append a new entry with:
   - `id`: Auto-incrementing integer
   - `text`: The suggestion text
   - `timestamp`: ISO 8601 date string
   - `context`: Current file or feature being worked on
   - `status`: `pending` (default)
   - `category`: Auto-detected (`perf`, `ux`, `refactor`, `security`, `docs`, `other`)
3. Write the updated array back to `.bkit/btw.json` using `write_file`

### Storage Format

```json
{
  "entries": [
    {
      "id": 1,
      "text": "Consider caching API responses for /users endpoint",
      "timestamp": "2026-04-09T14:30:00Z",
      "context": "src/api/users.js",
      "status": "pending",
      "category": "perf"
    }
  ]
}
```

### Listing Suggestions

1. Read `.bkit/btw.json`
2. Display entries in a table sorted by newest first
3. Show status indicators: pending, promoted, dismissed

### Analyzing Suggestions

1. Read all entries from `.bkit/btw.json`
2. Group by category
3. Identify patterns and recurring themes
4. Suggest which items to prioritize
5. Estimate effort for each (low/medium/high)

### Promoting to PDCA Feature

1. Read the specified entry by ID
2. Create a new PDCA plan document: `docs/01-plan/features/{slug}.plan.md`
3. Pre-fill the plan with the suggestion details
4. Update the entry status to `promoted`
5. Inform user to continue with `/pdca design {slug}`

## Categories

| Category | Detection Keywords |
|----------|--------------------|
| `perf` | cache, speed, optimize, slow, performance, latency |
| `ux` | user, UI, UX, interface, experience, accessibility |
| `refactor` | refactor, cleanup, simplify, DRY, extract, reorganize |
| `security` | security, auth, validation, sanitize, XSS, CSRF |
| `docs` | document, README, comment, explain, JSDoc |
| `other` | Everything else |

## Integration with PDCA

BTW feeds into the Act phase:
1. Collect suggestions during Do phase with `/btw "..."`
2. Review collected items with `/btw list`
3. Analyze patterns with `/btw analyze`
4. Promote actionable items with `/btw promote [id]`
5. Continue with standard PDCA flow for promoted items
