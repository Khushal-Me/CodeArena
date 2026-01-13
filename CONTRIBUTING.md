# Contributing to CodeArena

Thank you for your interest in contributing to CodeArena! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please be respectful and constructive in all interactions.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Set up the development environment (see below)
4. Create a feature branch from `main`

## Development Setup

### Prerequisites

- Docker Desktop (v20.10+)
- Node.js (v20+)
- Python (v3.11+)
- Git

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/codearena.git
cd codearena

# Install dependencies
cd frontend && npm install && cd ..
cd backend/api-gateway && npm install && cd ../..
cd backend/websocket-service && npm install && cd ../..
cd backend/execution-worker && pip install -r requirements.txt && cd ../..

# Start infrastructure
docker compose up -d postgres redis

# Run the application
./start.sh
```

## Making Changes

### Branch Naming

Use descriptive branch names:
- `feature/add-rust-support` - New features
- `fix/submission-timeout` - Bug fixes
- `docs/api-documentation` - Documentation updates
- `refactor/queue-service` - Code refactoring

### Commit Messages

Follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
```
feat(worker): add Go language support
fix(api): resolve race condition in submission handler
docs(readme): update installation instructions
```

## Pull Request Process

1. Ensure all tests pass locally
2. Update documentation if needed
3. Add tests for new functionality
4. Submit PR against `main` branch
5. Address review feedback promptly

### PR Checklist

- [ ] Tests pass locally
- [ ] Code follows project style guidelines
- [ ] Documentation updated (if applicable)
- [ ] No unnecessary files included
- [ ] Commit messages follow conventions

## Coding Standards

### TypeScript (API Gateway, WebSocket, Frontend)

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use explicit return types for functions
- Document public APIs with JSDoc comments

### Python (Worker)

- Follow PEP 8 style guidelines
- Use type hints for function signatures
- Document functions with docstrings
- Maximum line length: 100 characters

### General

- Write self-documenting code
- Add comments for complex logic
- Keep functions focused and small
- Handle errors gracefully

## Questions?

Feel free to open an issue for any questions or concerns. We're happy to help!
