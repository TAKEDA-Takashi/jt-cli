import { describe, expect, it } from 'vitest';
import { formatJson } from '../../../src/formats/output/json';

describe('formatJson', () => {
  describe('pretty format', () => {
    it('should format object with indentation', () => {
      const data = { name: 'Alice', age: 30, city: 'Tokyo' };
      const result = formatJson(data);
      expect(result).toBe(`{
  "name": "Alice",
  "age": 30,
  "city": "Tokyo"
}`);
    });

    it('should format array with indentation', () => {
      const data = ['apple', 'banana', 'orange'];
      const result = formatJson(data);
      expect(result).toBe(`[
  "apple",
  "banana",
  "orange"
]`);
    });

    it('should format nested structures', () => {
      const data = {
        user: {
          name: 'Alice',
          contacts: ['email@example.com', '+1234567890'],
        },
      };
      const result = formatJson(data);
      expect(result).toBe(`{
  "user": {
    "name": "Alice",
    "contacts": [
      "email@example.com",
      "+1234567890"
    ]
  }
}`);
    });

    it('should handle null', () => {
      const result = formatJson(null);
      expect(result).toBe('null');
    });

    it('should handle primitives', () => {
      expect(formatJson(true)).toBe('true');
      expect(formatJson(false)).toBe('false');
      expect(formatJson(42)).toBe('42');
      expect(formatJson('hello')).toBe('"hello"');
    });
  });

  describe('compact format', () => {
    it('should format without spaces', () => {
      const data = { name: 'Alice', age: 30, city: 'Tokyo' };
      const result = formatJson(data, true);
      expect(result).toBe('{"name":"Alice","age":30,"city":"Tokyo"}');
    });

    it('should format array compactly', () => {
      const data = ['apple', 'banana', 'orange'];
      const result = formatJson(data, true);
      expect(result).toBe('["apple","banana","orange"]');
    });

    it('should format nested structures compactly', () => {
      const data = {
        user: {
          name: 'Alice',
          contacts: ['email@example.com', '+1234567890'],
        },
      };
      const result = formatJson(data, true);
      expect(result).toBe(
        '{"user":{"name":"Alice","contacts":["email@example.com","+1234567890"]}}',
      );
    });
  });

  describe('edge cases', () => {
    it('should handle undefined by returning empty string', () => {
      const result = formatJson(undefined);
      expect(result).toBe('');
    });

    it('should handle empty objects and arrays', () => {
      expect(formatJson({})).toBe('{}');
      expect(formatJson([])).toBe('[]');
      expect(formatJson({}, true)).toBe('{}');
      expect(formatJson([], true)).toBe('[]');
    });

    it('should handle special characters', () => {
      const data = { message: 'Hello\nWorld\t"Quoted"' };
      const result = formatJson(data, true);
      expect(result).toBe('{"message":"Hello\\nWorld\\t\\"Quoted\\""}');
    });

    it('should handle Unicode correctly', () => {
      const data = { greeting: 'こんにちは', emoji: '🌍' };
      const result = formatJson(data, true);
      expect(result).toBe('{"greeting":"こんにちは","emoji":"🌍"}');
    });

    it('should handle circular references gracefully', () => {
      const data: any = { name: 'Alice' };
      data.self = data;
      expect(() => formatJson(data)).toThrow();
    });
  });

  describe('invalid format', () => {
    it('should default to pretty for unknown format', () => {
      const data = { test: 'value' };
      const result = formatJson(data, false);
      expect(result).toBe(`{
  "test": "value"
}`);
    });
  });
});
