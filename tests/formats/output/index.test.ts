import { describe, expect, it } from 'vitest';
import { JtError } from '../../../src/errors';
import { formatOutput } from '../../../src/formats/output';

describe('formatOutput', () => {
  describe('format selection', () => {
    it('should use JSON formatter for json format', () => {
      const data = { name: 'Alice', age: 30 };
      const result = formatOutput(data, 'json');
      expect(result).toBe('{\n  "name": "Alice",\n  "age": 30\n}');
    });

    it('should use JSON formatter with compact flag', () => {
      const data = { name: 'Alice', age: 30 };
      const result = formatOutput(data, 'json', true);
      expect(result).toBe('{"name":"Alice","age":30}');
    });

    it('should use JSON Lines formatter for jsonl format', () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = formatOutput(data, 'jsonl');
      expect(result).toBe('{"id":1}\n{"id":2}\n{"id":3}');
    });

    it('should use YAML formatter for yaml format', () => {
      const data = { name: 'Alice', age: 30 };
      const result = formatOutput(data, 'yaml');
      expect(result).toBe('name: Alice\nage: 30\n');
    });

    it('should use CSV formatter for csv format', () => {
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ];
      const result = formatOutput(data, 'csv');
      expect(result).toBe('name,age\nAlice,30\nBob,25');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined consistently across formats', () => {
      expect(formatOutput(undefined, 'json')).toBe('');
      expect(formatOutput(undefined, 'json', true)).toBe('');
      expect(formatOutput(undefined, 'jsonl')).toBe('');
      expect(formatOutput(undefined, 'yaml')).toBe('');
      expect(formatOutput(undefined, 'csv')).toBe('');
    });

    it('should throw error for invalid format', () => {
      const data = { test: 'value' };
      expect(() => formatOutput(data, 'invalid' as any)).toThrow(JtError);
    });
  });

  describe('format-specific edge cases', () => {
    it('should handle non-array data for CSV format', () => {
      const data = { not: 'an array' };
      expect(() => formatOutput(data, 'csv')).toThrow(JtError);
    });

    it('should handle circular references in YAML', () => {
      const data: any = { name: 'Alice' };
      data.self = data;
      const result = formatOutput(data, 'yaml');
      expect(result).toContain('&');
      expect(result).toContain('*');
    });

    it('should handle single values in JSON Lines', () => {
      const data = 'just a string';
      const result = formatOutput(data, 'jsonl');
      expect(result).toBe('"just a string"');
    });

    it('should handle empty arrays consistently', () => {
      const data: unknown[] = [];
      expect(formatOutput(data, 'json')).toBe('[]');
      expect(formatOutput(data, 'json', true)).toBe('[]');
      expect(formatOutput(data, 'jsonl')).toBe('');
      expect(formatOutput(data, 'yaml')).toBe('[]\n');
      expect(formatOutput(data, 'csv')).toBe('');
    });
  });

  describe('complex data structures', () => {
    it('should handle nested objects across formats', () => {
      const data = {
        user: {
          name: 'Alice',
          details: {
            age: 30,
            city: 'Tokyo',
          },
        },
      };

      // JSON pretty
      const jsonResult = formatOutput(data, 'json');
      expect(jsonResult).toContain('"user": {');
      expect(jsonResult).toContain('"details": {');

      // YAML
      const yamlResult = formatOutput(data, 'yaml');
      expect(yamlResult).toContain('user:');
      expect(yamlResult).toContain('  details:');

      // JSON Lines (single object)
      const jsonlResult = formatOutput(data, 'jsonl');
      expect(jsonlResult).toBe('{"user":{"name":"Alice","details":{"age":30,"city":"Tokyo"}}}');
    });

    it('should handle arrays of objects for CSV', () => {
      const data = [
        { id: 1, name: 'Alice', active: true },
        { id: 2, name: 'Bob', active: false },
      ];

      const csvResult = formatOutput(data, 'csv');
      expect(csvResult).toContain('id,name,active');
      expect(csvResult).toContain('1,Alice,true');
      expect(csvResult).toContain('2,Bob,false');
    });
  });
});
