import { execSync } from 'node:child_process';
import { beforeEach, describe, expect, it } from 'vitest';
import { main } from '../src/cli';
import { createMockContextWithData, type MockOutputAdapter } from '../src/adapters';
import type { CliContext } from '../src/adapters';

// モック用のデータ
const mockJsonData = { name: 'Alice', age: 30 };
const mockJsonString = JSON.stringify(mockJsonData);
const mockYamlString = 'name: Alice\nage: 30';
const mockJsonLinesString = '{"id": 1}\n{"id": 2}';
const mockCsvString = 'name,age,city\nAlice,30,Tokyo\nBob,25,Osaka';

describe('CLI version', () => {
  it('should display version with --version flag', () => {
    const packageJson = JSON.parse(execSync('cat package.json', { encoding: 'utf8' }));

    const versionOutput = execSync('tsx src/cli.ts --version', { encoding: 'utf8' }).trim();

    expect(versionOutput).toBe(packageJson.version);
  });

  it('should display version with -V flag', () => {
    const packageJson = JSON.parse(execSync('cat package.json', { encoding: 'utf8' }));

    const versionOutput = execSync('tsx src/cli.ts -V', { encoding: 'utf8' }).trim();

    expect(versionOutput).toBe(packageJson.version);
  });
});

describe('main function', () => {
  let mockContext: CliContext;

  beforeEach(() => {
    mockContext = createMockContextWithData({
      files: {
        'data.json': mockJsonString,
        'data.yaml': mockYamlString,
        'data.jsonl': mockJsonLinesString,
        'data.csv': mockCsvString,
      },
      stdinData: mockJsonString,
    });
  });

  it('should process JSON input from file', async () => {
    await main(['node', 'jt', '$.name', 'data.json'], mockContext);

    const output = (mockContext.output as MockOutputAdapter).logs;
    expect(output[0]).toBe('"Alice"');
  });

  it('should handle --compact flag', async () => {
    await main(['node', 'jt', '$', 'data.json', '--compact'], mockContext);

    const output = (mockContext.output as MockOutputAdapter).logs;
    expect(output[0]).toBe('{"name":"Alice","age":30}');
  });

  it('should handle --raw-string flag', async () => {
    await main(['node', 'jt', '$.name', 'data.json', '--raw-string'], mockContext);

    const output = (mockContext.output as MockOutputAdapter).logs;
    expect(output[0]).toBe('Alice');
  });

  it('should handle different output formats', async () => {
    await main(['node', 'jt', '$', 'data.json', '-o', 'yaml'], mockContext);

    const output = (mockContext.output as MockOutputAdapter).logs;
    expect(output[0]).toContain('name: Alice');
    expect(output[0]).toContain('age: 30');
  });

  it('should handle CSV input with --no-header', async () => {
    (mockContext.fs as any).writeFile('headerless.csv', 'Alice,30\nBob,25');

    await main(['node', 'jt', '$', 'headerless.csv', '-i', 'csv', '--no-header'], mockContext);

    const output = (mockContext.output as MockOutputAdapter).logs;
    const parsed = JSON.parse(output[0]!);
    expect(parsed[0]).toHaveProperty('col1', 'Alice');
    expect(parsed[0]).toHaveProperty('col2', '30');
  });

  it('should handle errors gracefully', async () => {
    await main(['node', 'jt', '$.name', 'nonexistent.json'], mockContext);

    const errors = (mockContext.output as MockOutputAdapter).errors;
    expect(errors[0]).toContain('File not found');
    expect((mockContext.output as MockOutputAdapter).exitCode).toBe(1);
  });

  it('should handle stdin input when no file is provided', async () => {
    (mockContext.input as any).setTTY(false);

    await main(['node', 'jt', '$.name'], mockContext);

    const output = (mockContext.output as MockOutputAdapter).logs;
    expect(output[0]).toBe('"Alice"');
  });

  it('should show error when no input provided', async () => {
    (mockContext.input as any).setTTY(true);

    await main(['node', 'jt'], mockContext);

    const errors = (mockContext.output as MockOutputAdapter).errors;
    expect(errors[0]).toContain('No input provided');
    expect((mockContext.output as MockOutputAdapter).exitCode).toBe(1);
  });

  it('should handle format conversion without query', async () => {
    await main(['node', 'jt', 'data.json', '-o', 'yaml'], mockContext);

    const output = (mockContext.output as MockOutputAdapter).logs;
    expect(output[0]).toContain('name: Alice');
    expect(output[0]).toContain('age: 30');
  });

  it('should warn about --compact with non-json output', async () => {
    await main(['node', 'jt', '$', 'data.json', '-o', 'yaml', '--compact'], mockContext);

    const warnings = (mockContext.output as MockOutputAdapter).errors;
    expect(warnings[0]).toContain('Warning');
    expect(warnings[0]).toContain('--compact');
  });

  it('should handle --color flag', async () => {
    await main(['node', 'jt', '$', 'data.json', '--color'], mockContext);

    expect(mockContext.env.getVar('FORCE_COLOR')).toBe('1');
  });

  it('should handle --no-color flag', async () => {
    await main(['node', 'jt', '$', 'data.json', '--no-color'], mockContext);

    expect(mockContext.env.getVar('FORCE_COLOR')).toBe('0');
  });

  it('should handle complex queries', async () => {
    const complexData = JSON.stringify([
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
      { name: 'Charlie', age: 35 },
    ]);
    (mockContext.fs as any).writeFile('complex.json', complexData);

    await main(['node', 'jt', '$[age > 26].name', 'complex.json'], mockContext);

    const output = (mockContext.output as MockOutputAdapter).logs;
    const result = JSON.parse(output[0]!);
    expect(result).toEqual(['Alice', 'Charlie']);
  });

  it('should handle YAML format detection', async () => {
    await main(['node', 'jt', '$.name', 'data.yaml'], mockContext);

    const output = (mockContext.output as MockOutputAdapter).logs;
    expect(output[0]).toBe('"Alice"');
  });

  it('should handle JSON Lines format detection', async () => {
    await main(['node', 'jt', '$[id=2]', 'data.jsonl'], mockContext);

    const output = (mockContext.output as MockOutputAdapter).logs;
    expect(output[0]).toBe('{\n  "id": 2\n}');
  });

  it('should handle validation errors', async () => {
    await main(['node', 'jt', '$', 'data.json', '-o', 'invalid'], mockContext);

    const errors = (mockContext.output as MockOutputAdapter).errors;
    expect(errors[0]).toContain('Invalid output format: invalid');
    expect((mockContext.output as MockOutputAdapter).exitCode).toBe(1);
  });
});
