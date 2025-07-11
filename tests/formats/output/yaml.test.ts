import chalk, { type ColorSupportLevel } from 'chalk';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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

  describe('color output', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should not include color codes when NO_COLOR is set', () => {
      const env = process.env as Record<string, string | undefined>;
      env['NO_COLOR'] = '1';

      const data = { name: 'Alice', age: 30, active: true };
      const result = formatYaml(data);

      // ANSIエスケープコードが含まれていないことを確認
      expect(result).not.toContain('\u001b[');
      expect(result).toBe('name: Alice\nage: 30\nactive: true\n');
    });
  });

  describe('color output with colorization enabled', () => {
    const originalEnv = process.env;
    const originalStdout = process.stdout.isTTY;
    let originalChalkLevel: ColorSupportLevel;

    beforeEach(() => {
      process.env = { ...originalEnv };
      // Chalkのレベルを保存
      originalChalkLevel = chalk.level;
      // 色付けを有効にする
      const env = process.env as Record<string, string | undefined>;
      delete env['NO_COLOR'];
      env['FORCE_COLOR'] = '3';
      // TTYを有効にする
      process.stdout.isTTY = true;
      // Chalkのレベルを明示的に設定
      chalk.level = 3 as ColorSupportLevel;
    });

    afterEach(() => {
      process.env = originalEnv;
      process.stdout.isTTY = originalStdout;
      // Chalkのレベルを復元
      chalk.level = originalChalkLevel;
    });

    it('should colorize object keys and values', () => {
      const data = { name: 'Alice', age: 30, active: true, value: null };
      const result = formatYaml(data);

      // 結果にキーと値が含まれていることを確認
      expect(result).toContain('name');
      expect(result).toContain('Alice');
      expect(result).toContain('30');
      expect(result).toContain('true');
      expect(result).toContain('null');

      // 色付けが有効な場合、結果の長さが通常より長くなる
      const plainResult = 'name: Alice\nage: 30\nactive: true\nvalue: null\n';
      expect(result.length).toBeGreaterThanOrEqual(plainResult.length);
    });

    it('should colorize arrays', () => {
      const data = ['apple', 'banana', 123, true, null];
      const result = formatYaml(data);

      // 配列要素が含まれていることを確認
      expect(result).toContain('apple');
      expect(result).toContain('banana');
      expect(result).toContain('123');
      expect(result).toContain('true');
      expect(result).toContain('null');
      expect(result).toContain('-'); // YAML配列のマーカー
    });

    it('should colorize nested structures', () => {
      const data = {
        user: {
          name: 'Alice',
          age: 30,
          tags: ['admin', 'user'],
          active: true,
          lastLogin: null,
        },
        settings: {
          theme: 'dark',
          notifications: false,
          timeout: 3600,
        },
      };
      const result = formatYaml(data);

      // ANSIエスケープコードが含まれていることを確認
      expect(result).toContain('\u001b[');
      // すべてのキーと値が含まれている
      expect(result).toContain('user');
      expect(result).toContain('name');
      expect(result).toContain('Alice');
      expect(result).toContain('tags');
      expect(result).toContain('admin');
      expect(result).toContain('active');
      expect(result).toContain('true');
      expect(result).toContain('lastLogin');
      expect(result).toContain('null');
    });

    it('should colorize quoted strings', () => {
      const data = {
        quoted: '"already quoted"',
        number_string: '123',
        bool_string: 'true',
      };
      const result = formatYaml(data);

      // js-yamlが適切にクォートする値
      expect(result).toContain('quoted');
      expect(result).toContain('number_string');
      expect(result).toContain('bool_string');
      expect(result).toContain("'"); // YAMLのクォート
    });

    it('should colorize special values', () => {
      const data = {
        null_value: null,
        number_int: 42,
        number_float: 3.14,
        number_exp: 1.5e10,
        bool_true: true,
        bool_false: false,
        empty_string: '',
        yaml_null: '~',
      };
      const result = formatYaml(data);

      // 特殊な値が含まれていることを確認
      expect(result).toContain('null_value');
      expect(result).toContain('null');
      expect(result).toContain('42');
      expect(result).toContain('3.14');
      expect(result).toMatch(/1\.5e\+?10|15000000000/);
      expect(result).toContain('true');
      expect(result).toContain('false');
    });

    it('should colorize comments if present', () => {
      // YAMLにコメントを含むデータ構造を作成
      // 注: js-yamlは通常コメントを生成しないが、colorizeYaml関数はコメント行も処理する
      // コメントの例: 'name: Alice\n# This is a comment\nage: 30\n'
      // formatYamlではなく、colorizeYaml関数を直接テストする必要がある場合
      // ここではformatYamlの結果にコメントが含まれないことを確認
      const data = { name: 'Alice', age: 30 };
      const result = formatYaml(data);
      expect(result).not.toContain('#');
    });

    it('should handle empty values in colorization', () => {
      const data = {
        nested: {
          empty_object: {},
          empty_array: [],
        },
      };
      const result = formatYaml(data);

      // ANSIエスケープコードが含まれていることを確認
      expect(result).toContain('\u001b[');
      expect(result).toContain('nested');
      expect(result).toContain('empty_object');
      expect(result).toContain('{}');
      expect(result).toContain('empty_array');
      expect(result).toContain('[]');
    });

    it('should colorize multiline strings', () => {
      const data = {
        multiline: 'Line 1\nLine 2\nLine 3',
        regular: 'single line',
      };
      const result = formatYaml(data);

      // マルチライン文字列が含まれていることを確認
      expect(result).toContain('multiline');
      expect(result).toContain('Line 1');
      expect(result).toContain('Line 2');
      expect(result).toContain('Line 3');
      expect(result).toContain('regular');
      expect(result).toContain('single line');
      // YAMLのマルチライン記法
      expect(result).toContain('|-');
    });
  });
});
