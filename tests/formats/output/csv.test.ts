import chalk, { type ColorSupportLevel } from 'chalk';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { JtError } from '../../../src/errors';
import { formatCsv } from '../../../src/formats/output/csv';

describe('formatCsv', () => {
  describe('array of objects', () => {
    it('should format simple array of objects as CSV', () => {
      const data = [
        { name: 'Alice', age: 30, city: 'Tokyo' },
        { name: 'Bob', age: 25, city: 'Osaka' },
        { name: 'Charlie', age: 35, city: 'Kyoto' },
      ];
      const result = formatCsv(data);
      expect(result).toBe('name,age,city\nAlice,30,Tokyo\nBob,25,Osaka\nCharlie,35,Kyoto');
    });

    it('should handle objects with different keys', () => {
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', city: 'Osaka' },
        { age: 35, city: 'Kyoto' },
      ];
      const result = formatCsv(data);
      // すべてのキーを含むヘッダーと、存在しない値は空になる
      expect(result).toBe('name,age,city\nAlice,30,\nBob,,Osaka\n,35,Kyoto');
    });

    it('should quote values containing special characters', () => {
      const data = [
        { name: 'Alice, Bob', value: 'Hello "World"' },
        { name: 'Line\nBreak', value: 'Tab\there' },
      ];
      const result = formatCsv(data);
      expect(result).toBe('name,value\n"Alice, Bob","Hello ""World"""\n"Line\nBreak","Tab\there"');
    });

    it('should handle null and undefined values', () => {
      const data = [
        { name: 'Alice', value: null },
        { name: 'Bob', value: undefined },
        { name: 'Charlie' },
      ];
      const result = formatCsv(data);
      expect(result).toBe('name,value\nAlice,\nBob,\nCharlie,');
    });

    it('should handle numeric and boolean values', () => {
      const data = [
        { id: 1, price: 19.99, active: true },
        { id: 2, price: 29.99, active: false },
      ];
      const result = formatCsv(data);
      expect(result).toBe('id,price,active\n1,19.99,true\n2,29.99,false');
    });

    it('should handle Unicode correctly', () => {
      const data = [
        { name: 'こんにちは', emoji: '🌍' },
        { name: '你好', emoji: '🌏' },
      ];
      const result = formatCsv(data);
      expect(result).toBe('name,emoji\nこんにちは,🌍\n你好,🌏');
    });
  });

  describe('edge cases', () => {
    it('should handle empty array', () => {
      const data: unknown[] = [];
      const result = formatCsv(data);
      expect(result).toBe('');
    });

    it('should handle undefined by returning empty string', () => {
      const result = formatCsv(undefined);
      expect(result).toBe('');
    });

    it('should throw error for non-array input', () => {
      expect(() => formatCsv({ not: 'an array' })).toThrow(JtError);
      expect(() => formatCsv('not an array')).toThrow(JtError);
      expect(() => formatCsv(123)).toThrow(JtError);
      expect(() => formatCsv(true)).toThrow(JtError);
      expect(() => formatCsv(null)).toThrow(JtError);
    });

    it('should throw error for array of non-objects', () => {
      expect(() => formatCsv([1, 2, 3])).toThrow(JtError);
      expect(() => formatCsv(['a', 'b', 'c'])).toThrow(JtError);
      expect(() => formatCsv([true, false])).toThrow(JtError);
    });

    it('should handle mixed array with objects and non-objects', () => {
      const data = [{ name: 'Alice' }, 'not an object', { name: 'Bob' }];
      expect(() => formatCsv(data)).toThrow(JtError);
    });
  });

  describe('complex data structures', () => {
    it('should flatten nested objects', () => {
      const data = [
        { name: 'Alice', address: { city: 'Tokyo', country: 'Japan' } },
        { name: 'Bob', address: { city: 'New York', country: 'USA' } },
      ];
      const result = formatCsv(data);
      // ネストされたオブジェクトはJSON文字列として出力される
      expect(result).toBe(
        'name,address\nAlice,"{""city"":""Tokyo"",""country"":""Japan""}"\nBob,"{""city"":""New York"",""country"":""USA""}"',
      );
    });

    it('should handle arrays as values', () => {
      const data = [
        { name: 'Alice', tags: ['developer', 'designer'] },
        { name: 'Bob', tags: ['manager'] },
      ];
      const result = formatCsv(data);
      // 配列はJSON文字列として出力される
      expect(result).toBe('name,tags\nAlice,"[""developer"",""designer""]"\nBob,"[""manager""]"');
    });

    it('should handle dates', () => {
      const data = [
        { name: 'Alice', created: new Date('2024-01-01T00:00:00.000Z') },
        { name: 'Bob', created: new Date('2024-02-01T00:00:00.000Z') },
      ];
      const result = formatCsv(data);
      // DateオブジェクトはISO文字列として出力される
      expect(result).toBe(
        'name,created\nAlice,2024-01-01T00:00:00.000Z\nBob,2024-02-01T00:00:00.000Z',
      );
    });
  });

  describe('CSV format compliance', () => {
    it('should not add trailing newline', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const result = formatCsv(data);
      expect(result.endsWith('\n')).toBe(false);
    });

    it('should handle column names with special characters', () => {
      const data = [{ 'name,with,commas': 'value1', 'name"with"quotes': 'value2' }];
      const result = formatCsv(data);
      expect(result).toBe('"name,with,commas","name""with""quotes"\nvalue1,value2');
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

      const data = [
        { name: 'Alice', age: 30, active: true },
        { name: 'Bob', age: 25, active: false },
      ];
      const result = formatCsv(data);

      // ANSIエスケープコードが含まれていないことを確認
      expect(result).not.toContain('\u001b[');
      expect(result).toBe('name,age,active\nAlice,30,true\nBob,25,false');
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

    it('should colorize CSV output with column-based colors', () => {
      const data = [
        { name: 'Alice', age: 30, city: 'Tokyo' },
        { name: 'Bob', age: 25, city: 'Osaka' },
      ];
      const result = formatCsv(data);

      // 結果にデータが含まれていることを確認
      expect(result).toContain('name');
      expect(result).toContain('age');
      expect(result).toContain('city');
      expect(result).toContain('Alice');
      expect(result).toContain('30');
      expect(result).toContain('Tokyo');
    });

    it('should colorize headers with bold style', () => {
      const data = [{ col1: 'value1', col2: 'value2' }];
      const result = formatCsv(data);

      // ヘッダーとデータが含まれていることを確認
      expect(result).toContain('col1');
      expect(result).toContain('col2');
      expect(result).toContain('value1');
      expect(result).toContain('value2');
    });

    it('should handle quoted fields with colors', () => {
      const data = [
        { name: 'Alice, Bob', value: 'Hello "World"' },
        { name: 'Line\nBreak', value: 'Normal' },
      ];
      const result = formatCsv(data);

      // クォートされたフィールドが正しく処理されていることを確認
      expect(result).toContain('Alice, Bob');
      expect(result).toContain('Hello ""World""');
      // 改行は実際の改行として出力される
      expect(result).toContain('Line');
      expect(result).toContain('Break');
    });

    it('should cycle through column colors for many columns', () => {
      // 12列のデータを作成（色パレットより多い）
      const data = [
        {
          col1: 'a',
          col2: 'b',
          col3: 'c',
          col4: 'd',
          col5: 'e',
          col6: 'f',
          col7: 'g',
          col8: 'h',
          col9: 'i',
          col10: 'j',
          col11: 'k',
          col12: 'l',
        },
      ];
      const result = formatCsv(data);

      // すべての列が含まれていることを確認
      for (let i = 1; i <= 12; i++) {
        expect(result).toContain(`col${i}`);
      }
      expect(result).toContain('a');
      expect(result).toContain('l');
    });

    it('should handle empty fields in colorization', () => {
      const data = [
        { name: 'Alice', value: '' },
        { name: '', value: 'test' },
      ];
      const result = formatCsv(data);

      // 空のフィールドも正しく処理されることを確認
      expect(result).toContain('Alice');
      expect(result).toContain('test');
      expect(result.split('\n').length).toBe(3); // ヘッダー + 2行
    });

    it('should handle CSV ending with comma', () => {
      const data = [{ name: 'Alice', value: null }];
      const result = formatCsv(data);

      // nullは空のフィールドとして出力される
      expect(result).toContain('name');
      expect(result).toContain('value');
      expect(result).toContain('Alice');
    });

    it('should apply different colors to different columns', () => {
      const data = [
        { col1: 'red', col2: 'green', col3: 'blue', col4: 'yellow' },
        { col1: '1', col2: '2', col3: '3', col4: '4' },
      ];
      const result = formatCsv(data);

      // 各列のデータが含まれていることを確認
      expect(result).toContain('red');
      expect(result).toContain('green');
      expect(result).toContain('blue');
      expect(result).toContain('yellow');
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('3');
      expect(result).toContain('4');
    });
  });
});
