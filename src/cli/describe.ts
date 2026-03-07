import packageInfo from '../../package.json';

/**
 * jtの機能をJSON形式で出力（AIエージェント向け）
 */
export function getToolDescription(): string {
  return JSON.stringify(
    {
      name: 'jt',
      version: packageInfo.version,
      description: packageInfo.description,
      usage: 'jt [options] [query] [file]',
      inputFormats: ['json', 'yaml', 'jsonl', 'csv'],
      outputFormats: ['json', 'jsonl', 'yaml', 'csv'],
      options: [
        {
          flag: '-i, --input-format <format>',
          description: 'Input format (auto-detected if not specified)',
        },
        { flag: '-o, --output-format <format>', description: 'Output format (default: json)' },
        { flag: '-c, --compact', description: 'Compact JSON output' },
        { flag: '-r, --raw-string', description: 'Output raw strings without quotes' },
        { flag: '--no-header', description: 'Treat CSV input as having no headers' },
        {
          flag: '--error-format <format>',
          description: 'Error output format: text (default), json',
        },
        { flag: '--color / --no-color', description: 'Force or disable color output' },
      ],
      examples: [
        { command: "jt '$.name' data.json", description: 'Extract a field from JSON file' },
        { command: "cat data.json | jt '$.users[age > 20]'", description: 'Filter from stdin' },
        { command: 'jt data.json -o yaml', description: 'Convert JSON to YAML' },
        { command: "jt -i csv '$.name' users.csv", description: 'Query CSV data' },
      ],
      queryLanguage: {
        name: 'JSONata',
        url: 'https://jsonata.org/',
        features: ['Path expressions', 'Filtering', 'Mapping', 'Aggregation', 'Built-in functions'],
      },
    },
    null,
    2,
  );
}
