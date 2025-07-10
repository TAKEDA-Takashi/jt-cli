import { formatYaml } from '../../../src/formats/output/yaml';

describe('formatYaml', () => {
  describe('basic types', () => {
    it('should format objects as YAML', () => {
      const data = { name: 'Alice', age: 30, city: 'Tokyo' };
      const result = formatYaml(data);
      expect(result).toBe('name: Alice\nage: 30\ncity: Tokyo\n');
    });

    it('should format arrays as YAML', () => {
      const data = ['apple', 'banana', 'orange'];
      const result = formatYaml(data);
      expect(result).toBe('- apple\n- banana\n- orange\n');
    });

    it('should format nested structures', () => {
      const data = {
        user: {
          name: 'Alice',
          contacts: ['email@example.com', '+1234567890'],
        },
      };
      const result = formatYaml(data);
      expect(result).toBe(
        "user:\n  name: Alice\n  contacts:\n    - email@example.com\n    - '+1234567890'\n",
      );
    });

    it('should handle null and undefined correctly', () => {
      const data = { value: null, missing: undefined };
      const result = formatYaml(data);
      // js-yamlはundefinedを持つプロパティを出力しない
      expect(result).toBe('value: null\n');
    });

    it('should handle primitives', () => {
      expect(formatYaml(true)).toBe('true\n');
      expect(formatYaml(false)).toBe('false\n');
      expect(formatYaml(42)).toBe('42\n');
      expect(formatYaml('hello')).toBe('hello\n');
      expect(formatYaml(null)).toBe('null\n');
    });
  });

  describe('special cases', () => {
    it('should handle empty objects and arrays', () => {
      expect(formatYaml({})).toBe('{}\n');
      expect(formatYaml([])).toBe('[]\n');
    });

    it('should quote strings that look like numbers or booleans', () => {
      const data = { port: '8080', enabled: 'true', version: '1.0' };
      const result = formatYaml(data);
      expect(result).toBe("port: '8080'\nenabled: 'true'\nversion: '1.0'\n");
    });

    it('should handle special characters in strings', () => {
      const data = {
        multiline: 'Hello\nWorld',
        tab: 'Tab\there',
        quoted: '"Quoted"',
        colon: 'key: value',
      };
      const result = formatYaml(data);
      // js-yamlは自動的に適切なクォート/エスケープを行う
      expect(result).toContain('multiline: |-');
      expect(result).toContain('  Hello');
      expect(result).toContain('  World');
      expect(result).toContain('tab: "Tab\\there"');
      expect(result).toContain('quoted: \'"Quoted"\'');
      expect(result).toContain("colon: 'key: value'");
    });

    it('should handle Unicode correctly', () => {
      const data = { greeting: 'こんにちは', emoji: '🌍' };
      const result = formatYaml(data);
      expect(result).toBe('greeting: こんにちは\nemoji: 🌍\n');
    });

    it('should handle arrays of objects', () => {
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ];
      const result = formatYaml(data);
      expect(result).toBe('- name: Alice\n  age: 30\n- name: Bob\n  age: 25\n');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined by returning empty string', () => {
      const result = formatYaml(undefined);
      expect(result).toBe('');
    });

    it('should handle circular references gracefully', () => {
      const data: any = { name: 'Alice' };
      data.self = data;
      // js-yamlは循環参照をYAMLアンカー/エイリアスで処理する
      const result = formatYaml(data);
      expect(result).toContain('&'); // アンカー
      expect(result).toContain('*'); // エイリアス
    });

    it('should handle dates', () => {
      const data = { created: new Date('2024-01-01T00:00:00.000Z') };
      const result = formatYaml(data);
      // js-yamlはDateオブジェクトをISO文字列に変換
      expect(result).toBe('created: 2024-01-01T00:00:00.000Z\n');
    });

    it('should handle mixed nested arrays and objects', () => {
      const data = {
        items: [
          { id: 1, tags: ['a', 'b'] },
          { id: 2, tags: ['c', 'd'] },
        ],
        config: {
          nested: {
            deep: ['value1', 'value2'],
          },
        },
      };
      const result = formatYaml(data);
      expect(result).toContain('items:');
      expect(result).toContain('  - id: 1');
      expect(result).toContain('    tags:');
      expect(result).toContain('      - a');
      expect(result).toContain('      - b');
      expect(result).toContain('config:');
      expect(result).toContain('  nested:');
      expect(result).toContain('    deep:');
      expect(result).toContain('      - value1');
    });
  });

  describe('YAML format options', () => {
    it('should produce valid YAML output', () => {
      const data = {
        string: 'value',
        number: 123,
        boolean: true,
        array: [1, 2, 3],
        object: { key: 'value' },
      };
      const result = formatYaml(data);

      // 出力が改行で終わることを確認
      expect(result.endsWith('\n')).toBe(true);

      // YAMLの基本構造を確認
      expect(result).toContain('string: value');
      expect(result).toContain('number: 123');
      expect(result).toContain('boolean: true');
      expect(result).toContain('array:');
      expect(result).toContain('  - 1');
      expect(result).toContain('object:');
      expect(result).toContain('  key: value');
    });
  });
});
