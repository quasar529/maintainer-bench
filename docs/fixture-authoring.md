# Fixture Authoring Guide

The fastest path to value is a small repo-local suite that captures maintainer decisions your project already makes.

## The 30-minute workflow

1. Pick 5 past issues or PRs that represent recurring maintainer decisions.
2. Capture or write one fixture per case.
3. Edit the `expected` block by hand.
4. Run the suite with your current runner.
5. Use the report to decide whether your maintainer automation is ready.

```bash
pnpm mb capture issue https://github.com/owner/repo/issues/123
pnpm mb capture pr https://github.com/owner/repo/pull/456
pnpm mb run
pnpm mb grade
pnpm mb report --fail-on-failures
```

## Keep fixtures small

Good fixtures test one maintainer decision pattern:

- A bug report that needs a reproduction.
- A PR that touches auth and needs tests.
- A docs issue that is actionable.
- A security-sensitive change that must mention risk.

Avoid giant fixtures that try to grade everything at once.

## Expected fields

```json
{
  "decision": "needs-info",
  "labels": ["bug", "needs-repro"],
  "mustAsk": ["minimal reproduction"],
  "mustMention": ["config file path"]
}
```

- `decision`: the maintainer-level outcome.
- `labels`: labels the automation should assign or recommend.
- `mustAsk`: information the automation must request.
- `mustMention`: files, risks, modules, or concerns it must surface.

## Real issue and PR data

Public does not always mean reusable. If a fixture uses third-party issue or PR content, make sure redistribution is acceptable. When in doubt, rewrite and anonymize the fixture while preserving the maintainer decision pattern.

For public OSS-inspired fixtures, include `provenance` so readers understand where the pattern came from:

```json
{
  "provenance": {
    "inspiredBy": "https://github.com/owner/repo/issues/123",
    "repo": "owner/repo",
    "type": "public-oss-pattern",
    "anonymized": true,
    "capturedAt": "2026-06-01"
  }
}
```

Do not copy large issue bodies, comments, patches, or private context verbatim. Summarize the maintainer decision pattern instead.
