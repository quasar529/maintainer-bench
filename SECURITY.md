# Security Policy

`maintainer-bench` works with issue and pull request data, which can include sensitive details. Treat fixtures as repository data, not generic benchmark samples.

## Reporting vulnerabilities

Please report security issues privately by opening a GitHub security advisory or by contacting the maintainer through the repository owner profile.

Do not open public issues for:

- Secret leakage
- Token exposure
- Private repository fixture data
- Vulnerabilities in runner execution or command handling

## Fixture safety

- Do not commit secrets, private logs, customer data, or undisclosed vulnerability details.
- Redact tokens, credentials, hostnames, and personal data before adding fixtures.
- Prefer anonymized fixtures when permission to redistribute public issue/PR text is unclear.

## Runner safety

The command runner executes local commands configured by the repository. Review `.maintainer-bench.json` before running a suite from an untrusted repository.
