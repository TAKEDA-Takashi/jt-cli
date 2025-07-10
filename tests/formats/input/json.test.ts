import { describe, expect, it } from 'vitest';
import { ErrorCode, JtError } from '../../../src/errors';
import { parseJson } from '../../../src/formats/input/json';

describe('parseJson', () => {
  describe('valid JSON', () => {
    it('should parse a simple object', () => {
      const input = '{"name": "Alice", "age": 30}';
      const result = parseJson(input);
      expect(result).toEqual({ name: 'Alice', age: 30 });
    });

    it('should parse an array', () => {
      const input = '[1, 2, 3, 4, 5]';
      const result = parseJson(input);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should parse nested structures', () => {
      const input = '{"users": [{"name": "Alice"}, {"name": "Bob"}]}';
      const result = parseJson(input);
      expect(result).toEqual({
        users: [{ name: 'Alice' }, { name: 'Bob' }],
      });
    });

    it('should parse null', () => {
      const input = 'null';
      const result = parseJson(input);
      expect(result).toBe(null);
    });

    it('should parse boolean values', () => {
      expect(parseJson('true')).toBe(true);
      expect(parseJson('false')).toBe(false);
    });

    it('should parse numbers', () => {
      expect(parseJson('42')).toBe(42);
      expect(parseJson('3.14')).toBe(3.14);
      expect(parseJson('-100')).toBe(-100);
    });

    it('should parse strings', () => {
      const input = '"Hello, World!"';
      const result = parseJson(input);
      expect(result).toBe('Hello, World!');
    });
  });

  describe('invalid JSON', () => {
    it('should throw JtError for invalid JSON', () => {
      const input = '{invalid}';
      expect(() => parseJson(input)).toThrow(JtError);
    });

    it('should provide helpful error details', () => {
      const input = '{"name": "Alice",}';
      try {
        parseJson(input);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(JtError);
        expect((error as JtError).code).toBe(ErrorCode.INVALID_INPUT);
        expect((error as JtError).message).toContain('Invalid JSON');
        expect((error as JtError).detail).toBeDefined();
      }
    });

    it('should handle empty string', () => {
      const input = '';
      expect(() => parseJson(input)).toThrow(JtError);
    });

    it('should handle malformed objects', () => {
      const input = '{"key": value}';
      expect(() => parseJson(input)).toThrow(JtError);
    });

    it('should handle unclosed arrays', () => {
      const input = '[1, 2, 3';
      expect(() => parseJson(input)).toThrow(JtError);
    });
  });

  describe('edge cases', () => {
    it('should handle whitespace', () => {
      const input = '  \n\t{\n\t"key":\t"value"\n}\t\n  ';
      const result = parseJson(input);
      expect(result).toEqual({ key: 'value' });
    });

    it('should handle empty objects and arrays', () => {
      expect(parseJson('{}')).toEqual({});
      expect(parseJson('[]')).toEqual([]);
    });

    it('should handle Unicode characters', () => {
      const input = '{"message": "Hello 世界 🌍"}';
      const result = parseJson(input);
      expect(result).toEqual({ message: 'Hello 世界 🌍' });
    });
  });
});
