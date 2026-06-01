# maintainer-bench agent guide

`maintainer-bench` is a repo-local regression test harness for AI-assisted maintainer decisions.

## Project intent

- Do not turn this project into an AI code reviewer.
- Keep the core value focused on replayable, deterministic regression tests for maintainer workflows.
- Prefer local/private fixture suites over public model leaderboards.
- Keep OpenAI support first-class but optional; the command runner must remain useful without an API key.

## Development commands

```bash
pnpm install
pnpm build
pnpm test
pnpm mb run
pnpm mb grade
pnpm mb report --fail-on-failures
```

## Design constraints

- Fixture schemas should stay small and editable by humans.
- Deterministic graders are preferred over LLM judges in v1.
- New runner integrations must emit or validate the same runner output contract.
- Avoid committing private repository data, secrets, or third-party issue/PR text unless it is clearly allowed to be redistributed.

## PR expectations

- Include tests for schema, grader, or runner behavior changes.
- Keep docs updated when CLI commands or fixture shapes change.
- Add or update at least one fixture when changing scoring behavior.
