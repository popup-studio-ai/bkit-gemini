---
name: github-stats
description: Collect GitHub repository statistics and update Confluence page
metadata:
  author: POPUP STUDIO
  version: "1.0.0"
  bkit-version: "1.0.0"
  user-invocable: true
  allowed-tools:
    - run_shell_command
    - read_file
    - write_file
---

# GitHub Statistics Collector

Collect bkit-gemini GitHub repository statistics and update Confluence report page.

## Configuration

- **Repository**: popup-studio-ai/bkit-gemini
- **Confluence Page ID**: (To be configured)
- **Confluence Space**: POPUPSTUDI

## Data Collection Notice (Important)

```
GitHub Traffic API has 1-2 day processing delay.
Therefore, collecting "today" shows data up to "2 days ago".

Example:
• Collection date: 2026-01-30
• Latest data: Up to 2026-01-28
• Missing period: Jan 29-30 (API processing)

This is normal GitHub behavior. Missing dates will be included in next collection.
```

## Tasks Performed

### 1. Collect GitHub Statistics

Use `gh` CLI to collect the following data:

```bash
# Basic repo info (stars, forks, watchers)
gh repo view popup-studio-ai/bkit-gemini --json stargazerCount,forkCount,watchers,issues,pullRequests,createdAt,pushedAt

# Traffic views (last 14 days)
gh api repos/popup-studio-ai/bkit-gemini/traffic/views

# Clone statistics (last 14 days)
gh api repos/popup-studio-ai/bkit-gemini/traffic/clones

# Referrer sources
gh api repos/popup-studio-ai/bkit-gemini/traffic/popular/referrers

# Popular content paths
gh api repos/popup-studio-ai/bkit-gemini/traffic/popular/paths
```

### 2. Generate Report Content

Create Markdown report with the following sections:

#### Header
- Report date (today) with Data Collection Notice
- GitHub API 14-day limitation notice
- Last available data date

#### Basic Info
- Repository name and description
- Created date, last push date

#### Popularity Metrics
- Stars, Forks, Watchers
- Open Issues, Open PRs

#### Traffic Summary (Last 14 Days)
- Total views and unique visitors
- Total clones and unique cloners

#### Daily Views Table
```markdown
| Date | Views | Unique | Change | Notes |
|------|-------|--------|--------|-------|
| 2026-01-28 | 150 | 45 | +25% | - |
```

#### Key Insights
- Growth metrics
- Traffic patterns
- Popular content

## Output Format

```
📊 GitHub Statistics Collection Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 Summary (as of {date})
• Stars: {count}
• Forks: {count}
• Views (14d): {count} ({unique} unique)
• Clones (14d): {count} ({unique} unique)

⚠️ Data Notice: GitHub API has 1-2 day processing delay
   Latest data available: {latest_date}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Report generated successfully

💡 Next collection: Run /github-stats again tomorrow
```

## Important Notes

- GitHub Traffic API only provides **last 14 days** of data
- **API has 1-2 day processing delay**
- Run this command daily to maintain historical records

## Error Handling

| Error | Solution |
|-------|----------|
| gh CLI not authenticated | Run `gh auth login` |
| Rate limit exceeded | Wait and retry later |
| Data seems incomplete | Normal - GitHub API has 1-2 day delay |

## Schedule Recommendation

- **Daily**: Collect stats for trend analysis
- **Weekly**: Detailed analysis with event correlation
- **Monthly**: Comprehensive report with growth metrics
