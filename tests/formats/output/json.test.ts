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

  describe('raw string mode', () => {
    it('should output string without quotes', () => {
      const result = formatJson('Hello World', false, true);
      expect(result).toBe('Hello World');
    });

    it('should output multiline string with actual newlines', () => {
      const result = formatJson('Line 1\nLine 2\nLine 3', false, true);
      expect(result).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should output tab characters', () => {
      const result = formatJson('Tab:\tHere', false, true);
      expect(result).toBe('Tab:\tHere');
    });

    it('should output numbers as strings', () => {
      expect(formatJson(42, false, true)).toBe('42');
      expect(formatJson(3.14, false, true)).toBe('3.14');
      expect(formatJson(-100, false, true)).toBe('-100');
    });

    it('should output booleans as strings', () => {
      expect(formatJson(true, false, true)).toBe('true');
      expect(formatJson(false, false, true)).toBe('false');
    });

    it('should output null as string', () => {
      expect(formatJson(null, false, true)).toBe('null');
    });

    it('should output arrays normally in raw mode', () => {
      const data = ['apple', 'banana'];
      const result = formatJson(data, false, true);
      expect(result).toBe(`[
  "apple",
  "banana"
]`);
    });

    it('should output objects normally in raw mode', () => {
      const data = { name: 'Alice' };
      const result = formatJson(data, false, true);
      expect(result).toBe(`{
  "name": "Alice"
}`);
    });

    it('should work with compact mode', () => {
      expect(formatJson('Hello', true, true)).toBe('Hello');
      expect(formatJson(42, true, true)).toBe('42');
      expect(formatJson(true, true, true)).toBe('true');
    });

    it('should handle empty string', () => {
      expect(formatJson('', false, true)).toBe('');
    });

    it('should handle Unicode in raw mode', () => {
      expect(formatJson('こんにちは 🌍', false, true)).toBe('こんにちは 🌍');
    });
  });
});
