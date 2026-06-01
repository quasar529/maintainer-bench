# Contributing

Thanks for helping make AI-assisted maintainer workflows easier to trust.

The most valuable contributions are:

- Fixture packs that capture realistic maintainer decisions.
- Deterministic grader improvements.
- Runner integrations that keep the shared JSON contract.
- Documentation that helps maintainers build their first suite quickly.

## Local setup

```bash
pnpm install
pnpm build
pnpm test
pnpm mb run
pnpm mb grade
pnpm mb report --fail-on-failures
```

## Fixture contribution rules

- Prefer small fixtures that encode one maintainer decision pattern.
- Do not include private repository data, secrets, tokens, or confidential vulnerability details.
- If using public third-party issue or PR content, confirm that redistribution is acceptable. When unsure, anonymize and rewrite the example.
- Keep `expected` focused on `decision`, `labels`, `mustAsk`, and `mustMention`.

## Pull requests

Before opening a PR:

- Run `pnpm test`.
- Run `pnpm mb report --fail-on-failures`.
- Update README or docs if CLI behavior changes.
- Explain what maintainer workflow the change helps evaluate.
