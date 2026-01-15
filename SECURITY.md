# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **security@nexwave.io**

Include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You should receive a response within 48 hours. If the issue is confirmed, we will release a patch as soon as possible.

## Security Best Practices

When using the Nexwave SDK:

1. **Never commit API keys** — Use environment variables
2. **Use latest versions** — We regularly patch security issues
3. **Validate inputs** — Use the provided Zod schemas
4. **Set reasonable constraints** — Use slippage limits, fee caps
5. **Monitor agent activity** — Use the logging and metrics features

## Bug Bounty

We do not currently have a formal bug bounty program, but we deeply appreciate responsible disclosure and will acknowledge security researchers in our release notes.
