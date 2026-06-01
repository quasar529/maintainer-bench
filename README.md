# maintainer-bench

[![maintainer-bench](https://github.com/quasar529/maintainer-bench/actions/workflows/maintainer-bench.yml/badge.svg)](https://github.com/quasar529/maintainer-bench/actions/workflows/maintainer-bench.yml)

This is not an AI code reviewer.

`maintainer-bench` is a repo-local regression test harness for AI-assisted maintainer decisions. It helps open-source projects test whether their issue triage and PR reviewability workflows still match the project's own maintainer policy after prompts, `AGENTS.md`, runner config, or model choices change.

## Why maintainers use it

AI agents can help with issue triage and PR reviewability, but maintainers still need a way to catch silent regressions:

- A prompt stops asking for reproductions.
- A model starts adding noisy labels.
- A security-sensitive PR no longer mentions the risky file.
- An `AGENTS.md` change makes review summaries less useful.

`maintainer-bench` turns those expectations into fixtures that can run in CI.

## What it tests

- Issue decisions: `actionable`, `needs-info`, `duplicate`, `invalid`, `blocked`
- Expected labels
- Questions the maintainer automation must ask
- Files, risks, or maintainer concerns it must mention
- Noisy extra labels

The goal is not a public model leaderboard. The goal is private, repeatable maintainer workflow regression tests for each repository.

The included `fixtures/oss-patterns` examples are real-world-inspired and anonymized. They preserve maintainer decision patterns without redistributing full third-party issue or PR text.

## Quick start

Install the latest release tarball:

```bash
npm install -g https://github.com/quasar529/maintainer-bench/releases/download/v0.1.3/maintainer-bench-0.1.3.tgz
maintainer-bench init
```

Or run it without a global install:

```bash
npm exec --yes --package https://github.com/quasar529/maintainer-bench/releases/download/v0.1.3/maintainer-bench-0.1.3.tgz -- maintainer-bench init
```

Use this repository locally:

```bash
pnpm install
pnpm build
pnpm mb run
pnpm mb grade
pnpm mb report
```

The default config uses `examples/mock-runner.mjs`, so the sample suite runs without an API key.

You can run the full local verification flow with:

```bash
pnpm verify
```

In CI, use `pnpm mb report --fail-on-failures` after grading so the Markdown report is still written before the job fails.

## Use in your repository

After installing the CLI, create starter files in your project:

```bash
maintainer-bench init
maintainer-bench run
maintainer-bench grade
maintainer-bench report
```

`init` creates:

- `.maintainer-bench.json`
- `fixtures/maintainer-bench/issue-needs-info.json`
- `scripts/maintainer-bench-runner.mjs`
- `.github/workflows/maintainer-bench.yml`

Edit the starter fixture and replace the starter runner with your agent, script, or CLI.

See also:

- [Fixture authoring guide](docs/fixture-authoring.md)
- [Decision taxonomy](docs/decision-taxonomy.md)
- [Sample report](examples/sample-report.md)
- [Roadmap](docs/roadmap.md)

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
- `fixtures/oss-patterns`

Each fixture should represent a real maintainer decision pattern, not a synthetic model benchmark puzzle.

Start from:

- [Issue fixture template](templates/issue.fixture.json)
- [PR fixture template](templates/pr.fixture.json)

## License

MIT
