# Decision Taxonomy

Use a small, consistent decision vocabulary so fixture packs remain easy to compare.

## Decisions

| Decision | Use When |
| --- | --- |
| `actionable` | The maintainer automation has enough information to route, review, or act. |
| `needs-info` | The report or PR is plausible but missing required details. |
| `duplicate` | The maintainer automation should identify an already-known issue or PR pattern. |
| `invalid` | The report does not describe a project issue or cannot be handled by the repository. |
| `blocked` | The maintainer automation should stop progress until a required review, test, or clarification happens. |

## Labels

Labels should match the target repository's vocabulary when testing a real project. For shared examples, prefer plain labels such as:

- `bug`
- `documentation`
- `needs-repro`
- `needs-tests`
- `security`

## `mustAsk`

Use `mustAsk` for missing information the automation must request before the decision can move forward:

- `minimal reproduction`
- `version information`
- `expected behavior`
- `actual behavior`
- `backward compatibility impact`

## `mustMention`

Use `mustMention` for risks, files, modules, or maintainer concerns that must appear in the output:

- `security-sensitive change`
- `missing tests`
- `auth middleware`
- `request context`
- `public API change`

Keep each item short. The deterministic grader uses normalized substring matching, so precise phrases are easier to maintain than long sentences.
