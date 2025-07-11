import { ErrorCode, JtError } from '../../errors';
import type { OutputFormat } from '../../types';
import { formatCsv } from './csv';
import { formatJson } from './json';
import { formatJsonLines } from './jsonl';
import { formatYaml } from './yaml';

export function formatOutput(data: unknown, format: OutputFormat, compact?: boolean): string {
  switch (format) {
    case 'json':
      return formatJson(data, compact);

    case 'jsonl':
      return formatJsonLines(data);

    case 'yaml':
      return formatYaml(data);

    case 'csv':
      return formatCsv(data);

    default:
      throw new JtError(
        ErrorCode.INVALID_OUTPUT_FORMAT,
        'Invalid output format',
        `Format: ${format}`,
        'Use one of: json, jsonl, yaml, csv',
      );
  }
}

// Re-export individual formatters for direct use
export { formatCsv } from './csv';
export { formatJson } from './json';
export { formatJsonLines } from './jsonl';
export { formatYaml } from './yaml';
