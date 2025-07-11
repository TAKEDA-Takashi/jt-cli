# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.1] - 2025-01-11

### Added
- Automated Homebrew formula update workflow
- CODEOWNERS file for better code ownership management
- CONTRIBUTING.md with project contribution guidelines

### Changed
- Improved code documentation based on PR review feedback
- Renamed lint:check command to check for better clarity
- Applied import organization with Biome organizeImports
- Enhanced build configuration with specific file suppressions

### Fixed
- CI workflow now uses correct lint command
- CLI now uses direct JSON import for package.json

### Refactored
- Extracted CLI core logic to pure functions for better testability (Phase 2)
- Implemented Adapters/Ports pattern for improved testability (Phase 1)
- Significantly improved test coverage from 60.37% to 85.51%

## [1.2.0] - 2025-01-11

### Added
- CSV input format support with automatic header detection
- Raw string output option (-r/--raw-string) for unquoted string results
- --no-header option for parsing headerless CSV files  
- Syntax highlighting for JSON, YAML, CSV, and JSONL output formats
- Optional JSONata query expression - enables format conversion without transformation

### Changed
- Replaced format-based JSON output options with simpler --compact flag
- Improved CSV colorization from value-based to column-based approach

### Fixed
- Enhanced compact JSON colorization to handle escaped strings correctly

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

[Unreleased]: https://github.com/TAKEDA-Takashi/jt-cli/compare/v1.2.1...HEAD
[1.2.1]: https://github.com/TAKEDA-Takashi/jt-cli/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/TAKEDA-Takashi/jt-cli/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/TAKEDA-Takashi/jt-cli/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/TAKEDA-Takashi/jt-cli/releases/tag/v1.0.0