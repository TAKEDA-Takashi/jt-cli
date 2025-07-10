import { describe, expect, it } from 'vitest';
import { processQuery } from '../src/cli';
import { JtError } from '../src/errors';
import type { CliOptions } from '../src/types';

// モック用のデータ
const mockJsonData = { name: 'Alice', age: 30 };
const mockJsonString = JSON.stringify(mockJsonData);
const mockYamlString = 'name: Alice\nage: 30';
const mockJsonLinesString = '{"id": 1}\n{"id": 2}';

describe('processQuery', () => {
  describe('basic query execution', () => {
    it('should process JSON input with simple query', async () => {
      const options: CliOptions = {
        query: 'name',
        inputFormat: 'json',
        outputFormat: 'pretty',
        input: mockJsonString,
      };

      const result = await processQuery(options);
      expect(result).toBe('"Alice"');
    });

    it('should process YAML input with query', async () => {
      const options: CliOptions = {
        query: 'age',
        inputFormat: 'yaml',
        outputFormat: 'compact',
        input: mockYamlString,
      };

      const result = await processQuery(options);
      expect(result).toBe('30');
    });

    it('should process JSON Lines input with query', async () => {
      const options: CliOptions = {
        query: '$[id=2]',
        inputFormat: 'jsonl',
        outputFormat: 'pretty',
        input: mockJsonLinesString,
      };

      const result = await processQuery(options);
      expect(result).toBe('{\n  "id": 2\n}');
    });
  });

  describe('output format handling', () => {
    it('should output as JSON Lines', async () => {
      const options: CliOptions = {
        query: '$',
        inputFormat: 'jsonl',
        outputFormat: 'jsonl',
        input: mockJsonLinesString,
      };

      const result = await processQuery(options);
      expect(result).toBe('{"id":1}\n{"id":2}');
    });

    it('should output as YAML', async () => {
      const options: CliOptions = {
        query: '$',
        inputFormat: 'json',
        outputFormat: 'yaml',
        input: mockJsonString,
      };

      const result = await processQuery(options);
      expect(result).toBe('name: Alice\nage: 30\n');
    });

    it('should output as CSV', async () => {
      const options: CliOptions = {
        query: '[$]', // 配列でラップ
        inputFormat: 'json',
        outputFormat: 'csv',
        input: mockJsonString,
      };

      const result = await processQuery(options);
      expect(result).toBe('name,age\nAlice,30');
    });
  });

  describe('error handling', () => {
    it('should handle invalid input format', async () => {
      const options: CliOptions = {
        query: '$',
        inputFormat: 'json',
        outputFormat: 'pretty',
        input: '{invalid json}',
      };

      await expect(processQuery(options)).rejects.toThrow(JtError);
    });

    it('should handle invalid query syntax', async () => {
      const options: CliOptions = {
        query: '${invalid syntax}',
        inputFormat: 'json',
        outputFormat: 'pretty',
        input: mockJsonString,
      };

      await expect(processQuery(options)).rejects.toThrow(JtError);
    });

    it('should handle query execution errors', async () => {
      const options: CliOptions = {
        query: 'nonexistent.deeply.nested.path',
        inputFormat: 'json',
        outputFormat: 'pretty',
        input: mockJsonString,
      };

      const result = await processQuery(options);
      expect(result).toBe(''); // undefinedは空文字列になる
    });
  });

  describe('complex queries', () => {
    it('should handle transformation query', async () => {
      const input = JSON.stringify([
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 },
      ]);

      const options: CliOptions = {
        query: '$[age > 26].name',
        inputFormat: 'json',
        outputFormat: 'jsonl',
        input,
      };

      const result = await processQuery(options);
      expect(result).toBe('"Alice"\n"Charlie"');
    });

    it('should handle aggregation query', async () => {
      const input = JSON.stringify([
        { department: 'Sales', employee: 'Alice', salary: 50000 },
        { department: 'Sales', employee: 'Bob', salary: 55000 },
        { department: 'IT', employee: 'Charlie', salary: 60000 },
      ]);

      const options: CliOptions = {
        query: '${department: $sum(salary)}',
        inputFormat: 'json',
        outputFormat: 'pretty',
        input,
      };

      const result = await processQuery(options);
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({
        Sales: 105000,
        IT: 60000,
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty input', async () => {
      const options: CliOptions = {
        query: '$',
        inputFormat: 'jsonl',
        outputFormat: 'pretty',
        input: '',
      };

      const result = await processQuery(options);
      expect(result).toBe('[]');
    });

    it('should handle query returning undefined', async () => {
      const options: CliOptions = {
        query: 'nonexistent',
        inputFormat: 'json',
        outputFormat: 'pretty',
        input: mockJsonString,
      };

      const result = await processQuery(options);
      expect(result).toBe('');
    });
  });
});
