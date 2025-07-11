import { ErrorCode, JtError } from '../../errors';
import type { InputFormat } from '../../types';
import { parseCsv } from './csv';
import { parseJson } from './json';
import { parseJsonLines } from './jsonl';
import { parseYaml } from './yaml';

export function parseInput(input: string, format: InputFormat, noHeader?: boolean): unknown {
  switch (format) {
    case 'json':
      return parseJson(input);

    case 'yaml':
      return parseYaml(input);

    case 'jsonl':
      return parseJsonLines(input);

    case 'csv':
      return parseCsv(input, noHeader);

    default:
      throw new JtError(
        ErrorCode.INVALID_FORMAT,
        'Invalid input format',
        `Format: ${format}`,
        'Use one of: json, yaml, jsonl, csv',
      );
  }
}

// Re-export individual parsers for direct use
export { parseCsv } from './csv';
export { parseJson } from './json';
export { parseJsonLines, parseJsonLinesStream } from './jsonl';
export { parseYaml } from './yaml';
