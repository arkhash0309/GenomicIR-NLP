# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not open a public issue.**

Instead, report it privately:

- Email **arkhash.0309@gmail.com**, or
- Use GitHub's [private vulnerability reporting](https://github.com/arkhash0309/GenomicIR-NLP/security/advisories/new)

Please include:

- A description of the vulnerability and its impact
- Steps to reproduce
- Any suggested remediation

We aim to acknowledge reports within a few days and will keep you informed as we
work on a fix.

## Handling secrets

This project uses an Anthropic API key. Never commit real keys — copy
`.env.example` to `.env` (which is git-ignored) and keep your key there. If you
believe a key has leaked, rotate it immediately in the
[Anthropic console](https://console.anthropic.com/).
