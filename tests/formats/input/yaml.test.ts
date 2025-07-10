import { describe, expect, it } from 'vitest';
import { ErrorCode, JtError } from '../../../src/errors';
import { parseYaml } from '../../../src/formats/input/yaml';

describe('parseYaml', () => {
  describe('valid YAML', () => {
    it('should parse a simple object', () => {
      const input = `
name: Alice
age: 30
`;
      const result = parseYaml(input);
      expect(result).toEqual({ name: 'Alice', age: 30 });
    });

    it('should parse an array', () => {
      const input = `
- apple
- banana
- orange
`;
      const result = parseYaml(input);
      expect(result).toEqual(['apple', 'banana', 'orange']);
    });

    it('should parse nested structures', () => {
      const input = `
users:
  - name: Alice
    role: admin
  - name: Bob
    role: user
`;
      const result = parseYaml(input);
      expect(result).toEqual({
        users: [
          { name: 'Alice', role: 'admin' },
          { name: 'Bob', role: 'user' },
        ],
      });
    });

    it('should parse mixed content', () => {
      const input = `
string: Hello World
number: 42
float: 3.14
boolean: true
null_value: null
date: 2024-01-01
`;
      const result = parseYaml(input);
      expect(result).toEqual({
        string: 'Hello World',
        number: 42,
        float: 3.14,
        boolean: true,
        null_value: null,
        date: new Date('2024-01-01T00:00:00.000Z'),
      });
    });

    it('should handle multiline strings', () => {
      const input = `
description: |
  This is a multiline
  string that preserves
  line breaks.
`;
      const result = parseYaml(input);
      expect(result).toEqual({
        description: 'This is a multiline\nstring that preserves\nline breaks.\n',
      });
    });

    it('should handle inline syntax', () => {
      const input = `{name: Alice, age: 30, hobbies: [reading, swimming]}`;
      const result = parseYaml(input);
      expect(result).toEqual({
        name: 'Alice',
        age: 30,
        hobbies: ['reading', 'swimming'],
      });
    });

    it('should handle empty document', () => {
      const input = '';
      const result = parseYaml(input);
      expect(result).toBeUndefined();
    });

    it('should handle document with only comments', () => {
      const input = `
# This is a comment
# Another comment
`;
      const result = parseYaml(input);
      expect(result).toBe(null);
    });
  });

  describe('invalid YAML', () => {
    it('should throw JtError for invalid YAML', () => {
      const input = '{ invalid: yaml: syntax }';
      expect(() => parseYaml(input)).toThrow(JtError);
    });

    it('should provide helpful error details', () => {
      const input = `
users:
  - name: Alice
    role: admin
  - name: Bob
   role: user  # Wrong indentation
`;
      try {
        parseYaml(input);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(JtError);
        expect((error as JtError).code).toBe(ErrorCode.INVALID_INPUT);
        expect((error as JtError).message).toContain('Invalid YAML');
        expect((error as JtError).detail).toBeDefined();
      }
    });

    it('should throw error for duplicate keys', () => {
      const input = `name: Alice
name: Bob`;
      // js-yaml throws error for duplicate keys by default
      expect(() => parseYaml(input)).toThrow(JtError);
      try {
        parseYaml(input);
      } catch (error) {
        expect((error as JtError).detail).toContain('duplicated mapping key');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle anchors and aliases', () => {
      const input = `
defaults: &defaults
  timeout: 30
  retries: 3

service1:
  <<: *defaults
  endpoint: /api/v1

service2:
  <<: *defaults
  endpoint: /api/v2
`;
      const result = parseYaml(input);
      expect(result).toEqual({
        defaults: { timeout: 30, retries: 3 },
        service1: { timeout: 30, retries: 3, endpoint: '/api/v1' },
        service2: { timeout: 30, retries: 3, endpoint: '/api/v2' },
      });
    });

    it('should handle tags', () => {
      const input = `
tagged: !!str 123
explicit_string: !!str true
`;
      const result = parseYaml(input);
      expect(result).toEqual({
        tagged: '123',
        explicit_string: 'true',
      });
    });
  });
});
