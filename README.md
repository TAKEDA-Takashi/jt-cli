# jt - JSONata Query Tool

`jt` is a powerful command-line tool for querying and transforming JSON data using [JSONata](https://jsonata.org/), a lightweight query and transformation language for JSON.

## Features

- 🔍 Query JSON, YAML, and JSON Lines data using JSONata expressions
- 📝 Multiple output formats: Pretty JSON, Compact JSON, JSON Lines, YAML, and CSV
- 🚀 Fast and efficient processing with streaming support
- 💡 User-friendly error messages with helpful suggestions
- 📖 Support for both stdin and file input
- 🎯 TypeScript implementation with full type safety

## Installation

### Using npm

```bash
npm install -g jt
```

### Using Homebrew (coming soon)

```bash
brew install jt
```

## Usage

### Basic Usage

```bash
# Query from file
jt '<jsonata-expression>' input.json

# Query from stdin
cat data.json | jt '<jsonata-expression>'

# With explicit input format
jt -i yaml '<jsonata-expression>' data.yaml
```

### Examples

#### Basic Query
```bash
# Extract all names from an array of objects
echo '[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]' | jt '$.name'
# Output: ["Alice", "Bob"]
```

#### Filtering
```bash
# Filter objects where age > 25
echo '[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]' | jt '$[age > 25]'
# Output: [{"name": "Alice", "age": 30}]
```

#### Transformation
```bash
# Transform data structure
echo '{"users": [{"first": "John", "last": "Doe"}]}' | jt 'users.{"fullName": first & " " & last}'
# Output: [{"fullName": "John Doe"}]
```

#### Aggregation
```bash
# Sum all values
echo '[{"value": 10}, {"value": 20}, {"value": 30}]' | jt '$sum(value)'
# Output: 60
```

### Input Formats

`jt` supports multiple input formats:

- **JSON** (default): Standard JSON format
- **YAML**: YAML format (`-i yaml` or `--input yaml`)
- **JSON Lines**: Newline-delimited JSON (`-i jsonl` or `--input jsonl`)

```bash
# YAML input
jt -i yaml '$.users.name' config.yaml

# JSON Lines input
jt -i jsonl '$.event' events.jsonl
```

### Output Formats

Control output formatting with the `-o` or `--output` option:

- **pretty** (default): Formatted JSON with indentation
- **compact**: Minified JSON
- **jsonl**: JSON Lines (one JSON per line)
- **yaml**: YAML format
- **csv**: CSV format (for tabular data)

```bash
# Compact JSON output
jt -o compact '$.users' data.json

# YAML output
jt -o yaml '$.config' settings.json

# CSV output (for arrays of objects)
jt -o csv '$' users.json
```

### Advanced Features

#### Using JSONata Functions
```bash
# String manipulation
echo '{"name": "john doe"}' | jt '{"name": $uppercase(name)}'
# Output: {"name": "JOHN DOE"}

# Date handling
echo '{"date": "2023-12-01"}' | jt '{"year": $substring(date, 0, 4)}'
# Output: {"year": "2023"}
```

#### Complex Queries
```bash
# Group and aggregate
echo '[{"dept": "sales", "salary": 50000}, {"dept": "sales", "salary": 60000}]' | \
  jt 'dept{dept: $sum(salary)}'
# Output: {"sales": 110000}
```

## JSONata Expression Language

JSONata is a powerful query language designed specifically for JSON. Key features include:

- Path expressions: `$.users[0].name`
- Filtering: `$.users[age > 21]`
- Mapping: `$.users.{"fullName": firstName & " " & lastName}`
- Aggregation: `$sum($.items.price)`
- Functions: `$uppercase()`, `$substring()`, `$now()`, etc.

For complete JSONata documentation, visit [jsonata.org](https://jsonata.org/).

## Error Handling

`jt` provides clear, actionable error messages:

```bash
# Invalid JSON input
echo '{invalid}' | jt '$'
# Error: Invalid JSON input at position 1: Unexpected token 'i'

# Invalid JSONata expression
echo '{}' | jt '$undefined('
# Error: Invalid JSONata expression: Unexpected token '(' at position 11
```

## Development

### Prerequisites

- Node.js 20 or higher
- npm or yarn

### Setup

```bash
# Clone repository
git clone https://github.com/TAKEDA-Takashi/jt.git
cd jt

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

### Testing

This project follows Test-Driven Development (TDD) practices:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Implement your changes
5. Ensure all tests pass
6. Commit your changes (`git commit -m 'feat: add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [JSONata](https://jsonata.org/) - The powerful JSON query language
- [Commander.js](https://github.com/tj/commander.js/) - CLI framework
- [Biome](https://biomejs.dev/) - Fast formatter and linter

## Support

- 📝 [Report issues](https://github.com/TAKEDA-Takashi/jt/issues)
- 💬 [Discussions](https://github.com/TAKEDA-Takashi/jt/discussions)
- 📖 [Documentation](https://github.com/TAKEDA-Takashi/jt/wiki)