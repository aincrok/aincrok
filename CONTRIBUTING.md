# Contributing to Aincrok

Thank you for your interest in contributing to Aincrok! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Issues

- Check existing issues before creating a new one
- Use issue templates when available
- Provide clear reproduction steps
- Include system information

### Pull Requests

1. Fork the repository
2. Create a feature branch (`feature/amazing-feature`)
3. Commit your changes following conventional commits
4. Write/update tests as needed
5. Update documentation
6. Submit a pull request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/aincrok.git
cd aincrok

# Install dependencies
npm install

# Run in development mode
npm run watch

# Run tests
npm test
```

### Coding Standards

- TypeScript for all new code
- ESLint and Prettier configurations must pass
- Maintain test coverage above 80%
- Document all public APIs

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test updates
- `chore:` Maintenance tasks

## Development Workflow

1. Pick an issue or create one
2. Fork and create a branch
3. Make your changes
4. Test thoroughly
5. Submit PR with clear description
6. Respond to review feedback

## License

By contributing, you agree that your contributions will be licensed under Apache 2.0.
