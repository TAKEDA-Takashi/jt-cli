import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = join(__dirname, '..', 'src', 'cli.ts');
const TEST_DATA_JSON = join(__dirname, 'fixtures', 'test-data.json');
const TEST_DATA_YAML = join(__dirname, 'fixtures', 'test-data.yaml');

function runCLI(args: string): string {
  try {
    return execSync(`tsx ${CLI_PATH} ${args}`, { encoding: 'utf8' }).trim();
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'stdout' in error) {
      return (error as { stdout: Buffer | string }).stdout.toString().trim();
    }
    throw error;
  }
}

describe('CLI Integration - No Query', () => {
  it('should format JSON file without query', () => {
    const output = runCLI(`${TEST_DATA_JSON}`);
    const parsed = JSON.parse(output);
    expect(parsed).toEqual({
      name: 'Test',
      items: [
        { id: 1, value: 100 },
        { id: 2, value: 200 },
      ],
    });
  });

  it('should convert JSON to YAML without query', () => {
    const output = runCLI(`${TEST_DATA_JSON} -o yaml`);
    expect(output).toContain('name: Test');
    expect(output).toContain('items:');
    expect(output).toContain('id: 1');
    expect(output).toContain('value: 100');
  });

  it('should convert YAML to JSON without query', () => {
    const output = runCLI(`${TEST_DATA_YAML} -o compact`);
    const parsed = JSON.parse(output);
    expect(parsed).toEqual({
      name: 'Test',
      items: [
        { id: 1, value: 100 },
        { id: 2, value: 200 },
      ],
    });
  });

  it('should format piped JSON without query', () => {
    const output = execSync(`cat ${TEST_DATA_JSON} | tsx ${CLI_PATH} -o compact`, {
      encoding: 'utf8',
    }).trim();
    expect(output).toBe('{"name":"Test","items":[{"id":1,"value":100},{"id":2,"value":200}]}');
  });

  it('should convert piped YAML to JSON without query', () => {
    const output = execSync(`cat ${TEST_DATA_YAML} | tsx ${CLI_PATH} -o pretty`, {
      encoding: 'utf8',
    }).trim();
    const parsed = JSON.parse(output);
    expect(parsed).toEqual({
      name: 'Test',
      items: [
        { id: 1, value: 100 },
        { id: 2, value: 200 },
      ],
    });
  });
});

describe('CLI Integration - With Query', () => {
  it('should apply query to file', () => {
    const output = runCLI(`'$.name' ${TEST_DATA_JSON}`);
    expect(output).toBe('"Test"');
  });

  it('should apply query to piped input', () => {
    const output = execSync(`cat ${TEST_DATA_JSON} | tsx ${CLI_PATH} '$.items[1].value'`, {
      encoding: 'utf8',
    }).trim();
    expect(output).toBe('200');
  });

  it('should handle complex query with file', () => {
    const output = runCLI(`'$.items[value > 100].id' ${TEST_DATA_JSON} -o jsonl`);
    expect(output).toBe('2');
  });
});

describe('CLI Integration - Edge Cases', () => {
  it('should handle query that looks like filename', () => {
    // '$' で始まるクエリはクエリとして扱われる
    const output = runCLI(`'$.name' ${TEST_DATA_JSON}`);
    expect(output).toBe('"Test"');
  });

  it('should detect file when no query and has extension', () => {
    // 拡張子がある場合はファイルとして扱われる
    const output = runCLI(`${TEST_DATA_JSON} -o compact`);
    expect(output).toBe('{"name":"Test","items":[{"id":1,"value":100},{"id":2,"value":200}]}');
  });
});
