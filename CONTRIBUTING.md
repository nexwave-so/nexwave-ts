# Contributing to Nexwave SDK

Thank you for your interest in contributing to Nexwave! This document provides guidelines and information for contributors.

## Code of Conduct

Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0
- Git

### Setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/nexwave-ts.git
cd nexwave-ts

# Install dependencies
bun install

# Build all packages
bun run build

# Run tests
bun test
```

## Development Workflow

### Branch Naming

- `feature/description` — New features
- `fix/description` — Bug fixes
- `docs/description` — Documentation updates
- `refactor/description` — Code refactoring

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(sdk): add support for batch intents
fix(types): correct AssetAmount validation
docs: update installation instructions
chore: update dependencies
```

### Pull Request Process

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Write/update tests as needed
5. Ensure all tests pass: `bun test`
6. Ensure types are correct: `bun run typecheck`
7. Submit a pull request

### Code Style

- Use TypeScript strict mode
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Keep functions small and focused

## Testing

```bash
# Run all tests
bun test

# Run tests for specific package
bun test --filter @nexwave/sdk

# Run tests in watch mode
bun test --watch
```

## Package Development

### Adding a New Feature

1. Add types to `@nexwave/types` if needed
2. Implement in `@nexwave/sdk`
3. Add mock support to `@nexwave/mock-server`
4. Add tests
5. Update documentation

### Releasing

Releases are handled by maintainers via GitHub Actions.

## Questions?

- Open an issue for bugs or feature requests
- Join our [Discord](https://discord.gg/nexwave) for discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
