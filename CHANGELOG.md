# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2025-01-10

### Added
- Version flag tests for --version and -V options
- Comprehensive test coverage for CLI version display functionality

## [1.0.0] - 2025-01-10

### Added
- Initial release of jt-cli
- JSONata query execution for JSON data transformation
- Support for multiple input formats:
  - JSON (default)
  - YAML
  - JSON Lines (JSONL)
- Support for multiple output formats:
  - Pretty JSON (default)
  - Compact JSON
  - YAML
  - JSON Lines
  - CSV (for tabular data)
- Comprehensive error handling with helpful messages
- TypeScript implementation with full type safety
- Support for both stdin and file input
- Extensive test suite with >80% coverage
- Version flag support (--version, -V)

### Security
- All dependencies are up to date
- No known vulnerabilities

[Unreleased]: https://github.com/TAKEDA-Takashi/jt-cli/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/TAKEDA-Takashi/jt-cli/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/TAKEDA-Takashi/jt-cli/releases/tag/v1.0.0