import { parseJsonLines, parseJsonLinesStream } from '../../../src/formats/input/jsonl';
import { JtError, ErrorCode } from '../../../src/errors';
import { Readable } from 'stream';

describe('parseJsonLines', () => {
  describe('valid JSON Lines', () => {
    it('should parse single line', () => {
      const input = '{"name": "Alice", "age": 30}';
      const result = parseJsonLines(input);
      expect(result).toEqual([{ name: 'Alice', age: 30 }]);
    });

    it('should parse multiple lines', () => {
      const input = `{"name": "Alice", "age": 30}
{"name": "Bob", "age": 25}
{"name": "Charlie", "age": 35}`;
      const result = parseJsonLines(input);
      expect(result).toEqual([
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 },
      ]);
    });

    it('should skip empty lines', () => {
      const input = `{"id": 1}

{"id": 2}

{"id": 3}`;
      const result = parseJsonLines(input);
      expect(result).toEqual([
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ]);
    });

    it('should handle different JSON types per line', () => {
      const input = `"string value"
42
true
null
["array", "of", "values"]
{"object": "value"}`;
      const result = parseJsonLines(input);
      expect(result).toEqual([
        'string value',
        42,
        true,
        null,
        ['array', 'of', 'values'],
        { object: 'value' },
      ]);
    });

    it('should handle empty input', () => {
      const input = '';
      const result = parseJsonLines(input);
      expect(result).toEqual([]);
    });

    it('should handle input with only empty lines', () => {
      const input = '\n\n\n';
      const result = parseJsonLines(input);
      expect(result).toEqual([]);
    });
  });

  describe('invalid JSON Lines', () => {
    it('should throw error for invalid JSON on any line', () => {
      const input = `{"valid": true}
{invalid json}
{"another": "valid"}`;
      expect(() => parseJsonLines(input)).toThrow(JtError);
    });

    it('should provide line number in error', () => {
      const input = `{"line": 1}
{"line": 2}
{bad: json}
{"line": 4}`;
      try {
        parseJsonLines(input);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(JtError);
        expect((error as JtError).code).toBe(ErrorCode.INVALID_INPUT);
        expect((error as JtError).detail).toContain('line 3');
      }
    });

    it('should handle missing closing brackets', () => {
      const input = `{"complete": true}
{"incomplete": "value"`;
      expect(() => parseJsonLines(input)).toThrow(JtError);
    });
  });

  describe('edge cases', () => {
    it('should handle lines with different line endings', () => {
      const input = '{"unix": "lf"}\n{"windows": "crlf"}\r\n{"classic": "cr"}\r';
      const result = parseJsonLines(input);
      expect(result).toEqual([
        { unix: 'lf' },
        { windows: 'crlf' },
        { classic: 'cr' },
      ]);
    });

    it('should handle Unicode in JSON Lines', () => {
      const input = `{"emoji": "🌍"}
{"chinese": "你好"}
{"arabic": "مرحبا"}`;
      const result = parseJsonLines(input);
      expect(result).toEqual([
        { emoji: '🌍' },
        { chinese: '你好' },
        { arabic: 'مرحبا' },
      ]);
    });
  });
});

describe('parseJsonLinesStream', () => {
  describe('streaming parsing', () => {
    it('should parse stream of JSON lines', async () => {
      const data = `{"id": 1}
{"id": 2}
{"id": 3}`;
      const stream = Readable.from([data]);
      
      const results: unknown[] = [];
      for await (const item of parseJsonLinesStream(stream)) {
        results.push(item);
      }
      
      expect(results).toEqual([
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ]);
    });

    it('should handle chunked data', async () => {
      const chunks = [
        '{"id": 1}\n{"i',
        'd": 2}\n',
        '{"id": 3}',
      ];
      const stream = Readable.from(chunks);
      
      const results: unknown[] = [];
      for await (const item of parseJsonLinesStream(stream)) {
        results.push(item);
      }
      
      expect(results).toEqual([
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ]);
    });

    it('should skip empty lines in stream', async () => {
      const data = `{"id": 1}

{"id": 2}

`;
      const stream = Readable.from([data]);
      
      const results: unknown[] = [];
      for await (const item of parseJsonLinesStream(stream)) {
        results.push(item);
      }
      
      expect(results).toEqual([
        { id: 1 },
        { id: 2 },
      ]);
    });

    it('should throw error for invalid JSON in stream', async () => {
      const data = `{"valid": true}
{invalid}`;
      const stream = Readable.from([data]);
      
      const results: unknown[] = [];
      await expect(async () => {
        for await (const item of parseJsonLinesStream(stream)) {
          results.push(item);
        }
      }).rejects.toThrow(JtError);
      
      // Should have processed the first valid line
      expect(results).toEqual([{ valid: true }]);
    });

    it('should handle error with continueOnError option', async () => {
      const data = `{"valid": 1}
{invalid}
{"valid": 2}
bad json
{"valid": 3}`;
      const stream = Readable.from([data]);
      
      const results: unknown[] = [];
      const errors: JtError[] = [];
      
      for await (const item of parseJsonLinesStream(stream, true)) {
        if (item instanceof JtError) {
          errors.push(item);
        } else {
          results.push(item);
        }
      }
      
      expect(results).toEqual([
        { valid: 1 },
        { valid: 2 },
        { valid: 3 },
      ]);
      expect(errors).toHaveLength(2);
      expect(errors[0]?.detail).toContain('line 2');
      expect(errors[1]?.detail).toContain('line 4');
    });
  });
});