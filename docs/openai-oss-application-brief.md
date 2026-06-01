# OpenAI Codex for OSS Application Brief

## Project summary

`maintainer-bench` helps open-source projects safely adopt Codex-style maintainer automation by turning real issues and pull requests into repo-local regression tests.

It is not an AI code reviewer. It tests whether a maintainer automation workflow still matches a repository's own policy after changes to prompts, `AGENTS.md`, model selection, runner configuration, or workflow code.

## Why this matters

OSS maintainers need help with issue triage, PR reviewability, and repetitive decision-making. AI agents can help, but maintainers need a way to detect silent regressions:

- Did the triage workflow stop asking for reproductions?
- Did a prompt change remove security-sensitive warnings?
- Did a new model start adding noisy labels?
- Did a PR risk summary stop mentioning the files maintainers care about?

`maintainer-bench` makes those questions testable in CI.

## What Codex/API credits would support

Credits would be used for repeatable OpenAI runner evaluations across fixture packs and real maintainer workflow experiments:

- Issue triage regression tests
- PR reviewability and risk summary checks
- Prompt and `AGENTS.md` change evaluations
- Fixture pack validation for common OSS project types

## Current proof points

- Public GitHub repository with CI.
- Deterministic fixture schema and grader.
- Command runner that works without an API key.
- Optional OpenAI runner.
- Sample fixture packs for TypeScript, Python, docs, and security-sensitive changes.
- Markdown report artifact generated in GitHub Actions.

## Near-term roadmap

- Add more fixture packs from anonymized real maintainer workflows.
- Add fixture authoring helpers that reduce setup time below 30 minutes.
- Add comparison reports for prompt/model changes.
- Add more runner examples while preserving the shared JSON contract.
