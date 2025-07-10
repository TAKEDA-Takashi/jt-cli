import { describe, expect, it } from 'vitest';
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
});
