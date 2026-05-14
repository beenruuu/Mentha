# Contributing to Mentha

Thank you for your interest in contributing to the open-source Answer Engine Optimization (AEO) platform!

---

## Code of Conduct

Be respectful, inclusive, and constructive. We welcome contributors of all experience levels.

---

## How to Contribute

### Reporting Bugs

1. Check existing issues to avoid duplicates
2. Include: steps to reproduce, expected vs actual behavior, environment details
3. Add logs and screenshots if applicable

### Feature Requests

1. Describe the problem and proposed solution
2. Explain how it benefits the AEO community
3. Tag with `enhancement`

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Follow code conventions (Biome linter, 4-space indent, single quotes)
4. Write clear commit messages
5. Open PR against `main`

---

## Development Setup

```bash
git clone https://github.com/beenruuu/mentha.git
cd mentha
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
pnpm dev
```

---

## Code Conventions

### TypeScript

- Strict mode enabled
- Named exports preferred for utilities and types
- Default exports for pages, components, and Hono routers
- `as const` for immutable objects and controllers

### Linting

```bash
pnpm check        # Check code style
pnpm check:fix    # Auto-fix issues
pnpm format       # Format code
```

### File Naming

- kebab-case for files: `auth.controller.ts`, `project-context.tsx`
- PascalCase for components: `ProjectProvider`, `MetricCards`
- camelCase for functions/variables: `fetchFromApi`, `selectedProject`

---

## Project Structure

```
mentha/
├── apps/
│   ├── web/       # Next.js 14 frontend
│   ├── api/       # Hono backend
│   ├── cli/       # Commander.js CLI
│   └── mcp/       # MCP server
└── packages/
    ├── core/      # Shared types
    └── external/  # Third-party integrations
```

---

## Need Help?

Open a discussion on GitHub or check the existing documentation in the `docs/` folder.
