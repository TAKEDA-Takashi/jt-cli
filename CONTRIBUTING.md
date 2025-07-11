# Contributing to jt-cli

Thank you for your interest in contributing to jt-cli! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)
- [Feature Requests](#feature-requests)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please be respectful and constructive in all interactions.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/jt-cli.git
   cd jt-cli
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/TAKEDA-Takashi/jt-cli.git
   ```

## Development Setup

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Run tests to ensure everything is working:
   ```bash
   npm test
   ```

## Development Workflow

### Test-Driven Development (TDD)

We follow Test-Driven Development practices. The workflow is:

1. **Write failing tests** for your new feature or bug fix
2. **Implement** the minimum code to make tests pass
3. **Refactor** to improve code quality while keeping tests green

Example:
```bash
# 1. Write tests
npm test -- --watch

# 2. Implement feature
# Edit source files...

# 3. Verify all tests pass
npm test
```

### Running the CLI Locally

To test the CLI during development:

```bash
# Build and run
npm run build
node dist/index.js "$.name" test.json

# Or use npm link for global testing
npm link
jt "$.name" test.json
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Test Coverage

We maintain a minimum of 90% test coverage. New code should include comprehensive tests covering:
- Happy path scenarios
- Edge cases
- Error conditions
- Type variations

### Writing Tests

Tests are located in the `tests/` directory. Follow the existing patterns:

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should handle normal case', () => {
    // Arrange
    const input = { name: 'test' };
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
  
  it('should handle error case', () => {
    expect(() => myFunction(null)).toThrow(JtError);
  });
});
```

## Coding Standards

### Code Quality

Before committing, ensure your code passes all quality checks:

```bash
# Run all checks
npm run check

# Fix auto-fixable issues
npm run check:fix

# Run individual checks
npm run format      # Format code
npm run lint        # Lint code
npm run typecheck   # Check TypeScript types
```

### Style Guide

- We use Biome for code formatting and linting
- TypeScript strict mode is enabled
- No `any` types (use `unknown` instead)
- Prefer functional programming patterns
- Keep functions small and focused
- Add JSDoc comments for public APIs

### Error Handling

Always provide user-friendly error messages:

```typescript
// Good
throw new JtError({
  code: 'INVALID_JSON',
  message: 'Invalid JSON input',
  detail: `Unexpected token at position ${position}`,
  suggestion: 'Check for missing quotes or commas'
});

// Bad
throw new Error('Invalid input');
```

## Submitting Changes

### Pull Request Process

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following TDD practices

3. Ensure all tests pass and coverage is maintained:
   ```bash
   npm test
   npm run check
   npm run typecheck
   ```

4. Commit your changes using conventional commits:
   ```bash
   git commit -m "feat: add new output format"
   git commit -m "fix: handle empty arrays correctly"
   git commit -m "docs: update usage examples"
   ```

5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

6. Create a Pull Request on GitHub

### PR Requirements

Your PR must:
- Include tests for new functionality
- Pass all existing tests
- Pass all code quality checks
- Include appropriate commit messages
- Update documentation if needed
- Not decrease test coverage

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test additions or fixes
- `chore`: Build process or auxiliary tool changes

Examples:
```bash
feat(formats): add CSV output format
fix(query): handle null values in arrays
docs(readme): add installation instructions
test(cli): add integration tests for pipe input
```

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Minimal steps to reproduce
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: OS, Node.js version, jt version
6. **Sample Data**: Minimal JSON/YAML that reproduces the issue

Example:
```markdown
**Description**
The CLI crashes when processing arrays with null values

**Steps to Reproduce**
1. Create test.json: `[1, null, 3]`
2. Run: `jt "$[?@ != null]" test.json`

**Expected Behavior**
Output: `[1, 3]`

**Actual Behavior**
Error: Cannot read property of null

**Environment**
- OS: macOS 13.0
- Node.js: 18.17.0
- jt version: 1.0.0
```

## Feature Requests

When requesting features:

1. Check existing issues first
2. Provide clear use cases
3. Explain why this feature would be valuable
4. Include example usage

Example:
```markdown
**Feature Description**
Support for XML input format

**Use Case**
Many APIs return XML data that needs to be queried

**Proposed Usage**
```bash
jt -i xml "$.root.items" data.xml
```

**Benefits**
- Enables processing of XML APIs
- Consistent with existing format support
```

## Getting Help

If you need help:

1. Check the [README](README.md) and documentation
2. Search existing [issues](https://github.com/TAKEDA-Takashi/jt-cli/issues)
3. Ask questions in issues with the "question" label
4. Review the [CLAUDE.md](CLAUDE.md) for project-specific guidelines

## Recognition

Contributors will be recognized in:
- The project's contributors list
- Release notes for significant contributions
- Special mentions for exceptional contributions

Thank you for contributing to jt-cli!