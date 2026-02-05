# Contributing to Alexa MCP Server

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/alexa-mcp-server.git
   cd alexa-mcp-server
   ```
3. **Install dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

1. **Copy environment template**:
   ```bash
   cp .env.example .dev.vars
   ```

2. **Configure your `.dev.vars`** with your Amazon cookies (see [Setup Guide](./docs/SETUP.md))

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Run linting and type checking**:
   ```bash
   npm run lint
   npm run type-check
   ```

## Code Style

- **TypeScript**: We use TypeScript with strict mode enabled
- **Formatting**: We use Biome for formatting and linting
  - Run `npm run format` to format code
  - Run `npm run lint:fix` to auto-fix linting issues
- **Type Safety**: All code should be properly typed
- **Validation**: Use Zod schemas for input validation

## Project Structure

```
alexa-mcp-server/
├── src/
│   ├── api/v1/          # API route handlers
│   ├── mcp/             # MCP server and tools
│   ├── schemas/         # Zod validation schemas
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── index.ts         # Main entry point
├── docs/                # Documentation
└── scripts/             # Utility scripts
```

## Making Changes

### Adding a New API Endpoint

1. Create a new handler in `src/api/v1/`
2. Add route registration in `src/index.ts`
3. Add Zod schema validation in `src/schemas/`
4. Update API documentation in `docs/API-REFERENCE.md`
5. Add tests if applicable

### Adding a New MCP Tool

1. Create a new tool file in `src/mcp/tools/`
2. Register the tool in `src/mcp/server.ts`
3. Add tool documentation
4. Update [LangGraph/LangChain Integration Guide](./docs/LANGGRAPH_LANGCHAIN_INTEGRATION.md)

### Updating Documentation

- Keep documentation up to date with code changes
- Use clear, concise language
- Include code examples where helpful
- Update the README if adding major features

## Commit Messages

Use clear, descriptive commit messages:

```
feat: Add music search functionality
fix: Fix authentication error handling
docs: Update API reference
refactor: Simplify device discovery logic
test: Add tests for volume control
```

## Pull Request Process

1. **Update documentation** if needed
2. **Run linting and type checking**:
   ```bash
   npm run lint
   npm run type-check
   ```
3. **Test your changes** locally
4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Create a Pull Request** on GitHub

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] All tests pass (if applicable)
- [ ] Documentation is updated
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Commit messages are clear and descriptive

## Code Review

- All PRs require review before merging
- Be respectful and constructive in reviews
- Address feedback promptly
- Ask questions if something is unclear

## Reporting Issues

When reporting issues, please include:

- **Description**: Clear description of the issue
- **Steps to Reproduce**: How to reproduce the issue
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: Node version, OS, etc.
- **Logs**: Relevant error messages or logs

## Security

- **Never commit credentials** or sensitive information
- **Report security vulnerabilities** privately (don't open public issues)
- **Follow security best practices** (see [Security Guide](./docs/SECURITY.md))

## Questions?

- Check the [Documentation](./docs/)
- Review [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)
- Open an issue for questions or discussions

Thank you for contributing! 🎉
