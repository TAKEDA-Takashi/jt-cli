import { beforeEach, describe, expect, it } from 'vitest';
import type { CliContext, CliOptions } from '../../src/adapters';
import { createMockContext, type MockOutputAdapter } from '../../src/adapters';
import { executeCliCommand, handleError } from '../../src/cli/executeCommand';
import { ErrorCode, JtError } from '../../src/errors';

describe('executeCliCommand', () => {
  let mockContext: CliContext;

  beforeEach(() => {
    mockContext = createMockContext();
  });

  describe('with query', () => {
    it('should execute JSONata query on JSON data', async () => {
      const options: CliOptions = {
        query: '$.name',
        inputFormat: 'json',
        outputFormat: 'json',
        input: '{"name": "Alice", "age": 30}',
      };

      const result = await executeCliCommand(options, mockContext);

      expect(result).toBe('"Alice"');
    });

    it('should handle complex queries', async () => {
      const options: CliOptions = {
        query: '$[age > 25].name',
        inputFormat: 'json',
        outputFormat: 'json',
        input: JSON.stringify([
          { name: 'Alice', age: 30 },
          { name: 'Bob', age: 20 },
          { name: 'Charlie', age: 35 },
        ]),
      };

      const result = await executeCliCommand(options, mockContext);

      expect(JSON.parse(result)).toEqual(['Alice', 'Charlie']);
    });

    it('should output in different formats', async () => {
      const options: CliOptions = {
        query: '$.users',
        inputFormat: 'json',
        outputFormat: 'yaml',
        input: '{"users": [{"name": "Alice"}, {"name": "Bob"}]}',
      };

      const result = await executeCliCommand(options, mockContext);

      expect(result).toContain('- name: Alice');
      expect(result).toContain('- name: Bob');
    });
  });

  describe('without query', () => {
    it('should format JSON to YAML', async () => {
      const options: CliOptions = {
        inputFormat: 'json',
        outputFormat: 'yaml',
        input: '{"name": "Alice", "age": 30}',
      };

      const result = await executeCliCommand(options, mockContext);

      expect(result).toBe('name: Alice\nage: 30\n');
    });

    it('should handle CSV to JSON conversion', async () => {
      const options: CliOptions = {
        inputFormat: 'csv',
        outputFormat: 'json',
        input: 'name,age\nAlice,30\nBob,25',
      };

      const result = await executeCliCommand(options, mockContext);

      const parsed = JSON.parse(result);
      expect(parsed).toEqual([
        { name: 'Alice', age: '30' },
        { name: 'Bob', age: '25' },
      ]);
    });

    it('should handle raw string mode', async () => {
      const options: CliOptions = {
        query: '$.name',
        inputFormat: 'json',
        outputFormat: 'json',
        input: '{"name": "Alice"}',
        rawString: true,
      };

      const result = await executeCliCommand(options, mockContext);

      expect(result).toBe('Alice'); // No quotes
    });

    it('should handle compact mode', async () => {
      const options: CliOptions = {
        inputFormat: 'json',
        outputFormat: 'json',
        input: '{"name": "Alice", "age": 30}',
        compact: true,
      };

      const result = await executeCliCommand(options, mockContext);

      expect(result).toBe('{"name":"Alice","age":30}');
    });
  });

  describe('error handling', () => {
    it('should propagate JtError', async () => {
      const options: CliOptions = {
        query: 'invalid query {',
        inputFormat: 'json',
        outputFormat: 'json',
        input: '{}',
      };

      await expect(executeCliCommand(options, mockContext)).rejects.toThrow();
    });

    it('should handle invalid input format', async () => {
      const options: CliOptions = {
        inputFormat: 'json',
        outputFormat: 'json',
        input: 'invalid json',
      };

      await expect(executeCliCommand(options, mockContext)).rejects.toThrow();
    });
  });
});

describe('handleError', () => {
  let mockContext: CliContext;

  beforeEach(() => {
    mockContext = createMockContext();
  });

  it('should handle JtError', () => {
    const error = new JtError(ErrorCode.INVALID_INPUT, 'Test error', 'Detail', 'Suggestion');

    handleError(error, mockContext);

    expect((mockContext.output as MockOutputAdapter).errors[0]).toContain('Test error');
    expect((mockContext.output as MockOutputAdapter).exitCode).toBe(1);
  });

  it('should handle regular Error', () => {
    const error = new Error('Regular error');

    handleError(error, mockContext);

    expect((mockContext.output as MockOutputAdapter).errors[0]).toBe('Error: Regular error');
    expect((mockContext.output as MockOutputAdapter).exitCode).toBe(1);
  });

  it('should handle unknown errors', () => {
    handleError('string error', mockContext);

    expect((mockContext.output as MockOutputAdapter).errors[0]).toBe('An unknown error occurred');
    expect((mockContext.output as MockOutputAdapter).exitCode).toBe(1);
  });
});
