import { describe, expect, it } from 'vitest';
import * as jtExports from '../src';

describe('index exports', () => {
  it('should export error types', () => {
    expect(jtExports.ErrorCode).toBeDefined();
    expect(jtExports.JtError).toBeDefined();
  });

  it('should export input parsers', () => {
    expect(jtExports.parseInput).toBeDefined();
    expect(jtExports.parseJson).toBeDefined();
    expect(jtExports.parseJsonLines).toBeDefined();
    expect(jtExports.parseJsonLinesStream).toBeDefined();
    expect(jtExports.parseYaml).toBeDefined();
  });

  it('should export output formatters', () => {
    expect(jtExports.formatCsv).toBeDefined();
    expect(jtExports.formatJson).toBeDefined();
    expect(jtExports.formatJsonLines).toBeDefined();
    expect(jtExports.formatOutput).toBeDefined();
    expect(jtExports.formatYaml).toBeDefined();
  });

  it('should export core query functionality', () => {
    expect(jtExports.executeQuery).toBeDefined();
  });

  it('should verify all exports are functions or objects', () => {
    // ErrorCode is an object (enum)
    expect(typeof jtExports.ErrorCode).toBe('object');

    // JtError is a class (function)
    expect(typeof jtExports.JtError).toBe('function');

    // All other exports should be functions - verify specific exports to avoid dynamic access
    expect(typeof jtExports.parseInput).toBe('function');
    expect(typeof jtExports.parseJson).toBe('function');
    expect(typeof jtExports.parseJsonLines).toBe('function');
    expect(typeof jtExports.parseJsonLinesStream).toBe('function');
    expect(typeof jtExports.parseYaml).toBe('function');
    expect(typeof jtExports.formatCsv).toBe('function');
    expect(typeof jtExports.formatJson).toBe('function');
    expect(typeof jtExports.formatJsonLines).toBe('function');
    expect(typeof jtExports.formatOutput).toBe('function');
    expect(typeof jtExports.formatYaml).toBe('function');
    expect(typeof jtExports.executeQuery).toBe('function');
  });
});
