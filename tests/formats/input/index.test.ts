import { describe, expect, it } from 'vitest';
import { JtError } from '../../../src/errors';
import { parseInput } from '../../../src/formats/input';
import type { InputFormat } from '../../../src/types';

describe('parseInput', () => {
  describe('format selection', () => {
    it('should use JSON parser for json format', () => {
      const input = '{"name": "Alice", "age": 30}';
      const result = parseInput(input, 'json');
      expect(result).toEqual({ name: 'Alice', age: 30 });
    });

    it('should use YAML parser for yaml format', () => {
      const input = 'name: Alice\nage: 30';
      const result = parseInput(input, 'yaml');
      expect(result).toEqual({ name: 'Alice', age: 30 });
    });

    it('should use JSON Lines parser for jsonl format', () => {
      const input = '{"id": 1}\n{"id": 2}\n{"id": 3}';
      const result = parseInput(input, 'jsonl');
      expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });

    it('should use CSV parser for csv format', () => {
      const input = 'name,age\nAlice,30\nBob,25';
      const result = parseInput(input, 'csv');
      expect(result).toEqual([
        { name: 'Alice', age: '30' },
        { name: 'Bob', age: '25' },
      ]);
    });
  });

  describe('edge cases', () => {
    it('should handle empty input consistently', () => {
      expect(() => parseInput('', 'json')).toThrow(JtError);
      expect(parseInput('', 'yaml')).toBeUndefined();
      expect(parseInput('', 'jsonl')).toEqual([]);
      expect(() => parseInput('', 'csv')).toThrow(JtError);
    });

    it('should throw error for invalid format', () => {
      const input = '{"test": "value"}';
      expect(() => parseInput(input, 'invalid' as InputFormat)).toThrow(JtError);
    });
  });

  describe('format-specific parsing', () => {
    it('should handle JSON arrays', () => {
      const input = '[1, 2, 3]';
      const result = parseInput(input, 'json');
      expect(result).toEqual([1, 2, 3]);
    });

    it('should handle YAML arrays', () => {
      const input = '- apple\n- banana\n- orange';
      const result = parseInput(input, 'yaml');
      expect(result).toEqual(['apple', 'banana', 'orange']);
    });

    it('should handle JSON Lines with empty lines', () => {
      const input = '{"id": 1}\n\n{"id": 2}\n\n';
      const result = parseInput(input, 'jsonl');
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('error handling', () => {
    it('should provide format-specific error for invalid JSON', () => {
      const input = '{invalid json}';
      expect(() => parseInput(input, 'json')).toThrow(JtError);
    });

    it('should provide format-specific error for invalid YAML', () => {
      const input = 'invalid: [unclosed bracket';
      expect(() => parseInput(input, 'yaml')).toThrow(JtError);
    });

    it('should provide format-specific error for invalid JSON Lines', () => {
      const input = '{"valid": true}\n{invalid json}';
      expect(() => parseInput(input, 'jsonl')).toThrow(JtError);
    });

    it('should provide format-specific error for invalid CSV', () => {
      const input = 'name,age\n"unclosed quote';
      expect(() => parseInput(input, 'csv')).toThrow(JtError);
    });
  });

  describe('complex data structures', () => {
    it('should handle nested structures in JSON', () => {
      const input = '{"user": {"name": "Alice", "contacts": ["email@example.com"]}}';
      const result = parseInput(input, 'json');
      expect(result).toEqual({
        user: {
          name: 'Alice',
          contacts: ['email@example.com'],
        },
      });
    });

    it('should handle anchors and aliases in YAML', () => {
      const input = 'base: &base\n  name: Alice\nextended:\n  <<: *base\n  age: 30';
      const result = parseInput(input, 'yaml');
      expect(result).toEqual({
        base: { name: 'Alice' },
        extended: { name: 'Alice', age: 30 },
      });
    });

    it('should handle different data types in JSON Lines', () => {
      const input = '"string"\n42\ntrue\nnull\n{"object": "value"}';
      const result = parseInput(input, 'jsonl');
      expect(result).toEqual(['string', 42, true, null, { object: 'value' }]);
    });
  });

  describe('unicode handling', () => {
    it('should handle Unicode in all formats', () => {
      const jsonInput = '{"greeting": "こんにちは", "emoji": "🌍"}';
      expect(parseInput(jsonInput, 'json')).toEqual({
        greeting: 'こんにちは',
        emoji: '🌍',
      });

      const yamlInput = 'greeting: こんにちは\nemoji: 🌍';
      expect(parseInput(yamlInput, 'yaml')).toEqual({
        greeting: 'こんにちは',
        emoji: '🌍',
      });

      const jsonlInput = '{"greeting": "こんにちは"}\n{"emoji": "🌍"}';
      expect(parseInput(jsonlInput, 'jsonl')).toEqual([
        { greeting: 'こんにちは' },
        { emoji: '🌍' },
      ]);

      const csvInput = 'greeting,emoji\nこんにちは,🌍';
      expect(parseInput(csvInput, 'csv')).toEqual([{ greeting: 'こんにちは', emoji: '🌍' }]);
    });
  });
});
