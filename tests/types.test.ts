import type { CliOptions, InputFormat, OutputFormat } from '../src/types';

describe('Type definitions', () => {
  it('should accept valid input formats', () => {
    const formats: InputFormat[] = ['json', 'yaml', 'jsonl'];
    expect(formats).toHaveLength(3);
  });

  it('should accept valid output formats', () => {
    const formats: OutputFormat[] = ['pretty', 'compact', 'jsonl', 'yaml', 'csv'];
    expect(formats).toHaveLength(5);
  });

  it('should define CLI options structure', () => {
    const options: CliOptions = {
      input: 'json',
      output: 'pretty',
      csvHeader: true,
      continueOnError: false,
    };

    expect(options.input).toBe('json');
    expect(options.output).toBe('pretty');
    expect(options.csvHeader).toBe(true);
    expect(options.continueOnError).toBe(false);
  });

  it('should allow optional CLI options', () => {
    const minimalOptions: CliOptions = {
      input: 'json',
      output: 'pretty',
    };

    expect(minimalOptions.csvHeader).toBeUndefined();
    expect(minimalOptions.continueOnError).toBeUndefined();
  });
});
