import { formatJson } from '../../../src/formats/output/json';
import { OutputFormat } from '../../../src/types';

describe('formatJson', () => {
  describe('pretty format', () => {
    it('should format object with indentation', () => {
      const data = { name: 'Alice', age: 30, city: 'Tokyo' };
      const result = formatJson(data, 'pretty');
      expect(result).toBe(`{
  "name": "Alice",
  "age": 30,
  "city": "Tokyo"
}`);
    });

    it('should format array with indentation', () => {
      const data = ['apple', 'banana', 'orange'];
      const result = formatJson(data, 'pretty');
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
      const result = formatJson(data, 'pretty');
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
      const result = formatJson(null, 'pretty');
      expect(result).toBe('null');
    });

    it('should handle primitives', () => {
      expect(formatJson(true, 'pretty')).toBe('true');
      expect(formatJson(false, 'pretty')).toBe('false');
      expect(formatJson(42, 'pretty')).toBe('42');
      expect(formatJson('hello', 'pretty')).toBe('"hello"');
    });
  });

  describe('compact format', () => {
    it('should format without spaces', () => {
      const data = { name: 'Alice', age: 30, city: 'Tokyo' };
      const result = formatJson(data, 'compact');
      expect(result).toBe('{"name":"Alice","age":30,"city":"Tokyo"}');
    });

    it('should format array compactly', () => {
      const data = ['apple', 'banana', 'orange'];
      const result = formatJson(data, 'compact');
      expect(result).toBe('["apple","banana","orange"]');
    });

    it('should format nested structures compactly', () => {
      const data = {
        user: {
          name: 'Alice',
          contacts: ['email@example.com', '+1234567890'],
        },
      };
      const result = formatJson(data, 'compact');
      expect(result).toBe('{"user":{"name":"Alice","contacts":["email@example.com","+1234567890"]}}');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined by returning empty string', () => {
      const result = formatJson(undefined, 'pretty');
      expect(result).toBe('');
    });

    it('should handle empty objects and arrays', () => {
      expect(formatJson({}, 'pretty')).toBe('{}');
      expect(formatJson([], 'pretty')).toBe('[]');
      expect(formatJson({}, 'compact')).toBe('{}');
      expect(formatJson([], 'compact')).toBe('[]');
    });

    it('should handle special characters', () => {
      const data = { message: 'Hello\nWorld\t"Quoted"' };
      const result = formatJson(data, 'compact');
      expect(result).toBe('{"message":"Hello\\nWorld\\t\\"Quoted\\""}');
    });

    it('should handle Unicode correctly', () => {
      const data = { greeting: 'こんにちは', emoji: '🌍' };
      const result = formatJson(data, 'compact');
      expect(result).toBe('{"greeting":"こんにちは","emoji":"🌍"}');
    });

    it('should handle circular references gracefully', () => {
      const data: any = { name: 'Alice' };
      data.self = data;
      expect(() => formatJson(data, 'pretty')).toThrow();
    });
  });

  describe('invalid format', () => {
    it('should default to pretty for unknown format', () => {
      const data = { test: 'value' };
      const result = formatJson(data, 'unknown' as OutputFormat);
      expect(result).toBe(`{
  "test": "value"
}`);
    });
  });
});