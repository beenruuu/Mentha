# 🤝 Contributing to Mentha

Thank you for your interest in contributing to Mentha!

## Getting Started

1. Fork the repository
2. Clone your fork
3. Follow the [Quick Start Guide](docs/QUICKSTART.md)

## Development Workflow

### Branch Naming

```
feature/   - New features (feature/add-competitor-analysis)
fix/       - Bug fixes (fix/hallucination-detection)
docs/      - Documentation (docs/update-readme)
refactor/  - Code refactoring (refactor/api-client)
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add competitor visibility comparison
fix: resolve hallucination detection false positives
docs: update API documentation
refactor: simplify LLM service interface
```

## Code Style

### Frontend (TypeScript)
- Use TypeScript strict mode
- Follow existing component patterns
- Use Shadcn UI components when possible
- Prefer server components, use `'use client'` only when necessary

### Backend (Python)
- Follow PEP 8
- Use type hints
- Use Pydantic for data validation
- Keep endpoints thin, logic in services

## Project Structure

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed structure.

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Ensure code follows project style
4. Test your changes locally
5. Submit PR with clear description

## Questions?

Open an issue for discussion before major changes.
