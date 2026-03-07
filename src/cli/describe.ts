import packageInfo from '../../package.json';
import { CLI_OPTIONS } from './options';

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
      options: CLI_OPTIONS.filter((o) => !o.hidden).map((o) => {
        const opt: { flag: string; description: string; defaultValue?: string } = {
          flag: o.flag,
          description: o.description,
        };
        if (o.defaultValue !== undefined) {
          opt.defaultValue = o.defaultValue;
        }
        return opt;
      }),
      notes: [
        'The query argument is optional. When omitted, jt acts as a format converter (e.g., jt data.json -o yaml).',
        'Input format is auto-detected from file extension or content when not specified with -i.',
        'Pipe input via stdin or provide a file path as the last argument.',
      ],
      examples: [
        { command: "jt '$.name' data.json", description: 'Extract a field from JSON file' },
        { command: "cat data.json | jt '$.users[age > 20]'", description: 'Filter from stdin' },
        { command: 'jt data.json -o yaml', description: 'Convert JSON to YAML (no query)' },
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
