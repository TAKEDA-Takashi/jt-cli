import { describe, expect, it } from 'vitest';
import { formatJsonLines } from '../../../src/formats/output/jsonl';

describe('formatJsonLines', () => {
  describe('array input', () => {
    it('should format each array element on a new line', () => {
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 },
      ];
      const result = formatJsonLines(data);
      expect(result).toBe(
        '{"name":"Alice","age":30}\n{"name":"Bob","age":25}\n{"name":"Charlie","age":35}',
      );
    });

    it('should handle array of primitives', () => {
      const data = ['apple', 'banana', 'orange'];
      const result = formatJsonLines(data);
      expect(result).toBe('"apple"\n"banana"\n"orange"');
    });

    it('should handle array of mixed types', () => {
      const data = [42, 'text', true, null, { key: 'value' }];
      const result = formatJsonLines(data);
      expect(result).toBe('42\n"text"\ntrue\nnull\n{"key":"value"}');
    });

    it('should handle empty array', () => {
      const data: unknown[] = [];
      const result = formatJsonLines(data);
      expect(result).toBe('');
    });

    it('should handle nested arrays by treating inner arrays as single values', () => {
      const data = [
        [1, 2, 3],
        ['a', 'b', 'c'],
      ];
      const result = formatJsonLines(data);
      expect(result).toBe('[1,2,3]\n["a","b","c"]');
    });
  });

  describe('non-array input', () => {
    it('should output single object as one line', () => {
      const data = { name: 'Alice', age: 30 };
      const result = formatJsonLines(data);
      expect(result).toBe('{"name":"Alice","age":30}');
    });

    it('should output primitives as single line', () => {
      expect(formatJsonLines(42)).toBe('42');
      expect(formatJsonLines('text')).toBe('"text"');
      expect(formatJsonLines(true)).toBe('true');
      expect(formatJsonLines(false)).toBe('false');
      expect(formatJsonLines(null)).toBe('null');
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          name: 'Alice',
          contacts: {
            email: 'alice@example.com',
            phone: '+1234567890',
          },
        },
      };
      const result = formatJsonLines(data);
      expect(result).toBe(
        '{"user":{"name":"Alice","contacts":{"email":"alice@example.com","phone":"+1234567890"}}}',
      );
    });
  });

  describe('edge cases', () => {
    it('should handle undefined by returning empty string', () => {
      const result = formatJsonLines(undefined);
      expect(result).toBe('');
    });

    it('should handle arrays containing undefined by skipping them', () => {
      const data = [1, undefined, 3];
      const result = formatJsonLines(data);
      expect(result).toBe('1\n3');
    });

    it('should handle special characters in strings', () => {
      const data = ['Hello\nWorld', 'Tab\there', '"Quoted"'];
      const result = formatJsonLines(data);
      expect(result).toBe('"Hello\\nWorld"\n"Tab\\there"\n"\\"Quoted\\""');
    });

    it('should handle Unicode correctly', () => {
      const data = [{ greeting: 'こんにちは' }, { emoji: '🌍' }];
      const result = formatJsonLines(data);
      expect(result).toBe('{"greeting":"こんにちは"}\n{"emoji":"🌍"}');
    });

    it('should handle circular references gracefully', () => {
      const data: any = { name: 'Alice' };
      data.self = data;
      expect(() => formatJsonLines(data)).toThrow();
    });
  });

  describe('streaming compatibility', () => {
    it('should produce output parseable by JSON Lines parsers', () => {
      const data = [
        { id: 1, value: 'first' },
        { id: 2, value: 'second' },
      ];
      const formatted = formatJsonLines(data);
      const lines = formatted.split('\n');

      // 各行が有効なJSONであることを確認
      expect(lines).toHaveLength(2);
      expect(JSON.parse(lines[0] ?? '')).toEqual({ id: 1, value: 'first' });
      expect(JSON.parse(lines[1] ?? '')).toEqual({ id: 2, value: 'second' });
    });

    it('should not add trailing newline', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const result = formatJsonLines(data);
      expect(result.endsWith('\n')).toBe(false);
    });
  });
});
