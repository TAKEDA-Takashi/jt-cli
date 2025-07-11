import { beforeEach, describe, expect, it } from 'vitest';
import type { CliContext, CliOptions } from '../../src/adapters';
import { createMockContextWithData, type MockInputAdapter } from '../../src/adapters';
import {
  detectInputFormatWithContext,
  getInputWithContext,
  parseCliArgs,
  validateCliOptions,
} from '../../src/cli/core';

describe('getInputWithContext', () => {
  let mockContext: CliContext;

  beforeEach(() => {
    mockContext = createMockContextWithData({
      files: {
        '/test.json': '{"name": "Alice"}',
        '/test.yaml': 'name: Bob',
      },
      stdinData: '{"stdin": "data"}',
    });
  });

  describe('file input', () => {
    it('should read file content when file path is provided', async () => {
      const result = await getInputWithContext('/test.json', mockContext);

      expect(result).toBe('{"name": "Alice"}');
    });

    it('should throw JtError for non-existent file', async () => {
      await expect(getInputWithContext('/non-existent.json', mockContext)).rejects.toThrow(
        'File not found: /non-existent.json',
      );
    });
  });

  describe('stdin input', () => {
    it('should read stdin when no file path and not TTY', async () => {
      (mockContext.input as MockInputAdapter).setTTY(false);

      const result = await getInputWithContext(undefined, mockContext);

      expect(result).toBe('{"stdin": "data"}');
    });

    it('should throw JtError when no file path and is TTY', async () => {
      (mockContext.input as MockInputAdapter).setTTY(true);

      await expect(getInputWithContext(undefined, mockContext)).rejects.toThrow(
        'No input provided',
      );
    });
  });
});

describe('detectInputFormatWithContext', () => {
  it('should detect JSON format from file extension', () => {
    expect(detectInputFormatWithContext('{}', '/test.json')).toBe('json');
  });

  it('should detect YAML format from file extension', () => {
    expect(detectInputFormatWithContext('name: test', '/test.yaml')).toBe('yaml');
    expect(detectInputFormatWithContext('name: test', '/test.yml')).toBe('yaml');
  });

  it('should detect JSONL format from file extension', () => {
    expect(detectInputFormatWithContext('{}\\n{}', '/test.jsonl')).toBe('jsonl');
    expect(detectInputFormatWithContext('{}\\n{}', '/test.ndjson')).toBe('jsonl');
  });

  it('should detect CSV format from file extension', () => {
    expect(detectInputFormatWithContext('a,b,c', '/test.csv')).toBe('csv');
  });

  it('should detect JSON format from content', () => {
    expect(detectInputFormatWithContext('{"name": "test"}')).toBe('json');
    expect(detectInputFormatWithContext('[1, 2, 3]')).toBe('json');
  });

  it('should detect YAML format from content', () => {
    expect(detectInputFormatWithContext('name: test\nage: 30')).toBe('yaml');
    expect(detectInputFormatWithContext('- item1\n- item2')).toBe('yaml');
  });

  it('should detect JSONL format from content', () => {
    const jsonl = '{"id": 1}\n{"id": 2}\n{"id": 3}';
    expect(detectInputFormatWithContext(jsonl)).toBe('jsonl');
  });

  it('should detect CSV format from content', () => {
    expect(detectInputFormatWithContext('name,age\nAlice,30')).toBe('csv');
    expect(detectInputFormatWithContext('a,b,c\n1,2,3')).toBe('csv');
  });

  it('should default to JSON for ambiguous content', () => {
    expect(detectInputFormatWithContext('simple text')).toBe('json');
  });
});

describe('validateCliOptions', () => {
  it('should return valid for correct options', () => {
    const options: CliOptions = {
      inputFormat: 'json',
      outputFormat: 'json',
      input: '{}',
    };

    const result = validateCliOptions(options);

    expect(result.valid).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it('should add warning for compact with non-json output', () => {
    const options: CliOptions = {
      inputFormat: 'json',
      outputFormat: 'yaml',
      input: '{}',
      compact: true,
    };

    const result = validateCliOptions(options);

    expect(result.valid).toBe(true);
    expect(result.warnings).toContain(
      'Warning: --compact option is only effective with JSON output format. Current format: yaml',
    );
  });

  it('should add warning for no-header with non-csv input', () => {
    const options: CliOptions = {
      inputFormat: 'json',
      outputFormat: 'json',
      input: '{}',
      noHeader: true,
    };

    const result = validateCliOptions(options);

    expect(result.valid).toBe(true);
    expect(result.warnings).toContain(
      'Warning: --no-header option is only effective with CSV input format. Current format: json',
    );
  });

  it('should validate invalid output format', () => {
    const options: CliOptions = {
      inputFormat: 'json',
      outputFormat: 'invalid' as any,
      input: '{}',
    };

    const result = validateCliOptions(options);

    expect(result.valid).toBe(false);
    expect(result.warnings).toContain('Invalid output format: invalid');
  });
});

describe('parseCliArgs', () => {
  let mockContext: CliContext;

  beforeEach(() => {
    mockContext = createMockContextWithData({
      files: {
        '/data.json': '{"name": "test"}',
      },
      stdinData: '{"stdin": true}',
    });
  });

  it('should parse basic query and file arguments', async () => {
    const argv = ['node', 'jt', '$.name', '/data.json'];

    const result = await parseCliArgs(argv, mockContext);

    expect(result.query).toBe('$.name');
    expect(result.input).toBe('{"name": "test"}');
    expect(result.inputFormat).toBe('json');
    expect(result.outputFormat).toBe('json');
  });

  it('should handle query-less file argument', async () => {
    const argv = ['node', 'jt', '/data.json'];

    const result = await parseCliArgs(argv, mockContext);

    expect(result.query).toBeUndefined();
    expect(result.input).toBe('{"name": "test"}');
  });

  it('should read from stdin when no file provided', async () => {
    (mockContext.input as MockInputAdapter).setTTY(false);
    const argv = ['node', 'jt', '$.name'];

    const result = await parseCliArgs(argv, mockContext);

    expect(result.query).toBe('$.name');
    expect(result.input).toBe('{"stdin": true}');
  });

  it('should handle format options', async () => {
    const argv = ['node', 'jt', '-i', 'yaml', '-o', 'csv', '$.name', '/data.json'];

    const result = await parseCliArgs(argv, mockContext);

    expect(result.inputFormat).toBe('yaml');
    expect(result.outputFormat).toBe('csv');
  });

  it('should handle boolean flags', async () => {
    const argv = ['node', 'jt', '--compact', '--raw-string', '--no-header', '$.name', '/data.json'];

    const result = await parseCliArgs(argv, mockContext);

    expect(result.compact).toBe(true);
    expect(result.rawString).toBe(true);
    expect(result.noHeader).toBe(true);
  });

  it('should handle color flags', async () => {
    const argv1 = ['node', 'jt', '--color', '$.name', '/data.json'];
    await parseCliArgs(argv1, mockContext);
    expect(mockContext.env.getVar('FORCE_COLOR')).toBe('1');

    const argv2 = ['node', 'jt', '--no-color', '$.name', '/data.json'];
    await parseCliArgs(argv2, mockContext);
    expect(mockContext.env.getVar('FORCE_COLOR')).toBe('0');
  });
});
