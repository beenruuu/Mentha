# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅ |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it by opening an issue at:

https://github.com/beenruuu/mentha/issues

Do NOT open a public issue for critical vulnerabilities. Instead, email the maintainers directly.

## Best Practices

- Never commit `.env` files or API keys to the repository
- The `docker-compose.yml` is for **development only** — do not deploy to production
- Change default credentials (`POSTGRES_PASSWORD`) before any public-facing deployment
- Keep dependencies updated via `pnpm audit`
- Use `api` scan execution mode in production (avoids browser automation risks)
