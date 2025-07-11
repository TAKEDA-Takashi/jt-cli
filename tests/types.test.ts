import { describe, expect, it } from 'vitest';
import type { CliOptions, InputFormat, OutputFormat } from '../src/types';

describe('Type definitions', () => {
  it('should accept valid input formats', () => {
    const formats: InputFormat[] = ['json', 'yaml', 'jsonl'];
    expect(formats).toHaveLength(3);
  });

  it('should accept valid output formats', () => {
    const formats: OutputFormat[] = ['json', 'jsonl', 'yaml', 'csv'];
    expect(formats).toHaveLength(4);
  });

  it('should define CLI options structure', () => {
    const options: CliOptions = {
      query: '$.name',
      inputFormat: 'json',
      outputFormat: 'json',
      input: '{"name": "Alice"}',
    };

    expect(options.query).toBe('$.name');
    expect(options.inputFormat).toBe('json');
    expect(options.outputFormat).toBe('json');
    expect(options.input).toBe('{"name": "Alice"}');
  });

  it('should require all CLI options properties', () => {
    const options: CliOptions = {
      query: '$',
      inputFormat: 'yaml',
      outputFormat: 'json',
      compact: true,
      input: 'name: Bob',
    };

    // All properties are required in the current interface
    expect(options.query).toBeDefined();
    expect(options.inputFormat).toBeDefined();
    expect(options.outputFormat).toBeDefined();
    expect(options.input).toBeDefined();
  });
});
