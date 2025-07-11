import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { colorizeJson, colorizeJsonCompact, isColorEnabled } from '../src/formats/output/colorize';

describe('colorize', () => {
  const originalEnv = process.env;
  const originalStdout = process.stdout.isTTY;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    process.stdout.isTTY = originalStdout;
  });

  describe('isColorEnabled', () => {
    it('should return false when NO_COLOR is set', () => {
      const env = process.env as Record<string, string | undefined>;
      env['NO_COLOR'] = '1';
      expect(isColorEnabled()).toBe(false);
    });

    it('should return false when FORCE_COLOR is 0', () => {
      const env = process.env as Record<string, string | undefined>;
      env['FORCE_COLOR'] = '0';
      expect(isColorEnabled()).toBe(false);
    });

    it('should return true when FORCE_COLOR is set (non-zero)', () => {
      const env = process.env as Record<string, string | undefined>;
      env['FORCE_COLOR'] = '1';
      process.stdout.isTTY = false;
      expect(isColorEnabled()).toBe(true);
    });

    it('should return true when stdout is TTY', () => {
      const env = process.env as Record<string, string | undefined>;
      delete env['NO_COLOR'];
      delete env['FORCE_COLOR'];
      process.stdout.isTTY = true;
      expect(isColorEnabled()).toBe(true);
    });

    it('should return false when stdout is not TTY and no FORCE_COLOR', () => {
      const env = process.env as Record<string, string | undefined>;
      delete env['NO_COLOR'];
      delete env['FORCE_COLOR'];
      process.stdout.isTTY = false;
      expect(isColorEnabled()).toBe(false);
    });
  });

  describe('colorizeJson', () => {
    beforeEach(() => {
      // 色付けを無効にしてプレーンな出力をテスト
      const env = process.env as Record<string, string | undefined>;
      env['NO_COLOR'] = '1';
    });

    it('should format null', () => {
      expect(colorizeJson(null)).toBe('null');
    });

    it('should format undefined', () => {
      // JSON標準に準拠してundefinedは空文字列
      expect(colorizeJson(undefined)).toBe('');
    });

    it('should format boolean', () => {
      expect(colorizeJson(true)).toBe('true');
      expect(colorizeJson(false)).toBe('false');
    });

    it('should format number', () => {
      expect(colorizeJson(42)).toBe('42');
      expect(colorizeJson(3.14)).toBe('3.14');
      expect(colorizeJson(-100)).toBe('-100');
    });

    it('should format string', () => {
      expect(colorizeJson('hello')).toBe('"hello"');
      expect(colorizeJson('with "quotes"')).toBe('"with \\"quotes\\""');
    });

    it('should format empty array', () => {
      expect(colorizeJson([])).toBe('[]');
    });

    it('should format array with values', () => {
      const result = colorizeJson([1, 'two', true]);
      expect(result).toContain('1');
      expect(result).toContain('"two"');
      expect(result).toContain('true');
    });

    it('should format empty object', () => {
      expect(colorizeJson({})).toBe('{}');
    });

    it('should format object with properties', () => {
      const result = colorizeJson({ name: 'Alice', age: 30 });
      expect(result).toContain('"name"');
      expect(result).toContain('"Alice"');
      expect(result).toContain('"age"');
      expect(result).toContain('30');
    });

    it('should format nested structures', () => {
      const data = {
        user: {
          name: 'Bob',
          scores: [10, 20, 30],
        },
      };
      const result = colorizeJson(data);
      expect(result).toContain('"user"');
      expect(result).toContain('"name"');
      expect(result).toContain('"Bob"');
      expect(result).toContain('"scores"');
      expect(result).toContain('10');
    });
  });

  describe('colorizeJsonCompact', () => {
    beforeEach(() => {
      // 色付けを無効にしてプレーンな出力をテスト
      const env = process.env as Record<string, string | undefined>;
      env['NO_COLOR'] = '1';
    });

    it('should format compact JSON', () => {
      const data = { name: 'Alice', age: 30, active: true };
      const result = colorizeJsonCompact(data);
      expect(result).toBe('{"name":"Alice","age":30,"active":true}');
    });

    it('should handle arrays in compact format', () => {
      const data = [1, 2, 3];
      const result = colorizeJsonCompact(data);
      expect(result).toBe('[1,2,3]');
    });
  });
});
