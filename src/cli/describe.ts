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
      options: CLI_OPTIONS.filter((o) => !o.hidden).map((o) => ({
        flag: o.flag,
        description: o.description,
      })),
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
