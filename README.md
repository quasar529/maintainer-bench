# maintainer-bench

This is not an AI code reviewer.

`maintainer-bench` is a repo-local regression test harness for AI-assisted maintainer decisions. It helps open-source projects test whether their issue triage and PR reviewability workflows still match the project's own maintainer policy after prompts, `AGENTS.md`, runner config, or model choices change.

## What it tests

- Issue decisions: `actionable`, `needs-info`, `duplicate`, `invalid`, `blocked`
- Expected labels
- Questions the maintainer automation must ask
- Files, risks, or maintainer concerns it must mention
- Noisy extra labels

The goal is not a public model leaderboard. The goal is private, repeatable maintainer workflow regression tests for each repository.

## Quick start

```bash
pnpm install
pnpm build
pnpm mb run
pnpm mb grade
pnpm mb report
```

The default config uses `examples/mock-runner.mjs`, so the sample suite runs without an API key.

In CI, use `pnpm mb report --fail-on-failures` after grading so the Markdown report is still written before the job fails.

## Create a fixture

```bash
pnpm mb capture issue https://github.com/owner/repo/issues/123
pnpm mb capture pr https://github.com/owner/repo/pull/456
```

Then edit the generated `expected` block. Keep it small:

```json
{
  "decision": "needs-info",
  "labels": ["bug", "needs-repro"],
  "mustAsk": ["minimal reproduction"],
  "mustMention": ["config file path"]
}
```

You can also baseline from the configured runner:

```bash
pnpm mb suggest-baseline fixtures/captured/owner-repo-issue-123.json
```

## Runner contract

Any runner can be evaluated if it reads one fixture JSON object from stdin and writes this JSON shape to stdout:

```json
{
  "decision": "needs-info",
  "labels": ["bug", "needs-repro"],
  "questions": ["Can you provide a minimal reproduction?"],
  "mentions": ["config file path"],
  "summary": "The report is plausible but lacks reproduction details."
}
```

Configure a command runner in `.maintainer-bench.json`:

```json
{
  "suitePath": "fixtures",
  "outputPath": ".maintainer-bench/results",
  "runner": {
    "type": "command",
    "command": "node",
    "args": ["examples/mock-runner.mjs"],
    "timeoutMs": 60000
  }
}
```

## OpenAI runner

OpenAI support is opt-in. Set a model explicitly:

```json
{
  "runner": {
    "type": "openai",
    "model": "your-model-name",
    "prompt": "Return only JSON with decision, labels, questions, mentions, and summary."
  }
}
```

The core sample suite does not require `OPENAI_API_KEY`.

## Community contribution surface

The most useful contributions are fixture packs:

- `fixtures/typescript-library`
- `fixtures/python-package`
- `fixtures/docs-project`
- `fixtures/security-sensitive-change`

Each fixture should represent a real maintainer decision pattern, not a synthetic model benchmark puzzle.
