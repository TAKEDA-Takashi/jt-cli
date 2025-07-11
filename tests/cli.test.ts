import { execSync } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { main, processQuery } from '../src/cli';
import { JtError } from '../src/errors';
import type { CliOptions } from '../src/types';

// モック用のデータ
const mockJsonData = { name: 'Alice', age: 30 };
const mockJsonString = JSON.stringify(mockJsonData);
const mockYamlString = 'name: Alice\nage: 30';
const mockJsonLinesString = '{"id": 1}\n{"id": 2}';
const mockCsvString = 'name,age,city\nAlice,30,Tokyo\nBob,25,Osaka';

describe('processQuery', () => {
  describe('basic query execution', () => {
    it('should process JSON input with simple query', async () => {
      const options: CliOptions = {
        query: 'name',
        inputFormat: 'json',
        outputFormat: 'json',
        input: mockJsonString,
      };

      const result = await processQuery(options);
      expect(result).toBe('"Alice"');
    });

    it('should process YAML input with query', async () => {
      const options: CliOptions = {
        query: 'age',
        inputFormat: 'yaml',
        outputFormat: 'json',
        input: mockYamlString,
        compact: true,
      };

      const result = await processQuery(options);
      expect(result).toBe('30');
    });

    it('should process JSON Lines input with query', async () => {
      const options: CliOptions = {
        query: '$[id=2]',
        inputFormat: 'jsonl',
        outputFormat: 'json',
        input: mockJsonLinesString,
      };

      const result = await processQuery(options);
      expect(result).toBe('{\n  "id": 2\n}');
    });

    it('should process CSV input with query', async () => {
      const options: CliOptions = {
        query: '$[age="30"]',
        inputFormat: 'csv',
        outputFormat: 'json',
        input: mockCsvString,
      };

      const result = await processQuery(options);
      expect(result).toBe('{\n  "name": "Alice",\n  "age": "30",\n  "city": "Tokyo"\n}');
    });
  });

  describe('output format handling', () => {
    it('should output as JSON Lines', async () => {
      const options: CliOptions = {
        query: '$',
        inputFormat: 'jsonl',
        outputFormat: 'jsonl',
        input: mockJsonLinesString,
      };

      const result = await processQuery(options);
      expect(result).toBe('{"id":1}\n{"id":2}');
    });

    it('should output as YAML', async () => {
      const options: CliOptions = {
        query: '$',
        inputFormat: 'json',
        outputFormat: 'yaml',
        input: mockJsonString,
      };

      const result = await processQuery(options);
      expect(result).toBe('name: Alice\nage: 30\n');
    });

    it('should output as CSV', async () => {
      const options: CliOptions = {
        query: '[$]', // 配列でラップ
        inputFormat: 'json',
        outputFormat: 'csv',
        input: mockJsonString,
      };

      const result = await processQuery(options);
      expect(result).toBe('name,age\nAlice,30');
    });
  });

  describe('error handling', () => {
    it('should handle invalid input format', async () => {
      const options: CliOptions = {
        query: '$',
        inputFormat: 'json',
        outputFormat: 'json',
        input: '{invalid json}',
      };

      await expect(processQuery(options)).rejects.toThrow(JtError);
    });

    it('should handle invalid query syntax', async () => {
      const options: CliOptions = {
        query: '${invalid syntax}',
        inputFormat: 'json',
        outputFormat: 'json',
        input: mockJsonString,
      };

      await expect(processQuery(options)).rejects.toThrow(JtError);
    });

    it('should handle query execution errors', async () => {
      const options: CliOptions = {
        query: 'nonexistent.deeply.nested.path',
        inputFormat: 'json',
        outputFormat: 'json',
        input: mockJsonString,
      };

      const result = await processQuery(options);
      expect(result).toBe(''); // undefinedは空文字列になる
    });
  });

  describe('complex queries', () => {
    it('should handle transformation query', async () => {
      const input = JSON.stringify([
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 },
      ]);

      const options: CliOptions = {
        query: '$[age > 26].name',
        inputFormat: 'json',
        outputFormat: 'jsonl',
        input,
      };

      const result = await processQuery(options);
      expect(result).toBe('"Alice"\n"Charlie"');
    });

    it('should handle aggregation query', async () => {
      const input = JSON.stringify([
        { department: 'Sales', employee: 'Alice', salary: 50000 },
        { department: 'Sales', employee: 'Bob', salary: 55000 },
        { department: 'IT', employee: 'Charlie', salary: 60000 },
      ]);

      const options: CliOptions = {
        query: '${department: $sum(salary)}',
        inputFormat: 'json',
        outputFormat: 'json',
        input,
      };

      const result = await processQuery(options);
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({
        Sales: 105000,
        IT: 60000,
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty input', async () => {
      const options: CliOptions = {
        query: '$',
        inputFormat: 'jsonl',
        outputFormat: 'json',
        input: '',
      };

      const result = await processQuery(options);
      expect(result).toBe('[]');
    });

    it('should handle query returning undefined', async () => {
      const options: CliOptions = {
        query: 'nonexistent',
        inputFormat: 'json',
        outputFormat: 'json',
        input: mockJsonString,
      };

      const result = await processQuery(options);
      expect(result).toBe('');
    });
  });

  describe('no query expression', () => {
    it('should format JSON without query', async () => {
      const options: CliOptions = {
        query: undefined,
        inputFormat: 'json',
        outputFormat: 'json',
        input: mockJsonString,
      };

      const result = await processQuery(options);
      expect(result).toBe('{\n  "name": "Alice",\n  "age": 30\n}');
    });

    it('should format YAML without query', async () => {
      const options: CliOptions = {
        query: undefined,
        inputFormat: 'yaml',
        outputFormat: 'yaml',
        input: mockYamlString,
      };

      const result = await processQuery(options);
      expect(result).toBe('name: Alice\nage: 30\n');
    });

    it('should format JSON Lines without query', async () => {
      const options: CliOptions = {
        query: undefined,
        inputFormat: 'jsonl',
        outputFormat: 'jsonl',
        input: mockJsonLinesString,
      };

      const result = await processQuery(options);
      expect(result).toBe('{"id":1}\n{"id":2}');
    });

    it('should convert JSON to YAML without query', async () => {
      const options: CliOptions = {
        query: undefined,
        inputFormat: 'json',
        outputFormat: 'yaml',
        input: mockJsonString,
      };

      const result = await processQuery(options);
      expect(result).toBe('name: Alice\nage: 30\n');
    });

    it('should convert YAML to JSON without query', async () => {
      const options: CliOptions = {
        query: undefined,
        inputFormat: 'yaml',
        outputFormat: 'json',
        input: mockYamlString,
        compact: true,
      };

      const result = await processQuery(options);
      expect(result).toBe('{"name":"Alice","age":30}');
    });
  });

  describe('raw string mode', () => {
    it('should output string without quotes', async () => {
      const options: CliOptions = {
        query: 'name',
        inputFormat: 'json',
        outputFormat: 'json',
        input: mockJsonString,
        rawString: true,
      };

      const result = await processQuery(options);
      expect(result).toBe('Alice');
    });

    it('should output number as string', async () => {
      const options: CliOptions = {
        query: 'age',
        inputFormat: 'json',
        outputFormat: 'json',
        input: mockJsonString,
        rawString: true,
      };

      const result = await processQuery(options);
      expect(result).toBe('30');
    });

    it('should work with JSONL format', async () => {
      const options: CliOptions = {
        query: '$.id',
        inputFormat: 'jsonl',
        outputFormat: 'jsonl',
        input: mockJsonLinesString,
        rawString: true,
      };

      const result = await processQuery(options);
      expect(result).toBe('1\n2');
    });

    it('should output objects normally in raw mode', async () => {
      const options: CliOptions = {
        query: '$',
        inputFormat: 'json',
        outputFormat: 'json',
        input: mockJsonString,
        rawString: true,
      };

      const result = await processQuery(options);
      expect(result).toBe('{\n  "name": "Alice",\n  "age": 30\n}');
    });

    it('should handle multiline strings', async () => {
      const input = JSON.stringify({ text: 'Line 1\nLine 2' });
      const options: CliOptions = {
        query: 'text',
        inputFormat: 'json',
        outputFormat: 'json',
        input,
        rawString: true,
      };

      const result = await processQuery(options);
      expect(result).toBe('Line 1\nLine 2');
    });
  });
});

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

describe.skip('main function', () => {
  let originalStdout: any;
  let originalStderr: any;
  let originalStdin: any;
  let originalExit: any;
  let stdoutData: string;
  let stderrData: string;

  beforeEach(() => {
    // 標準出力をモック
    stdoutData = '';
    stderrData = '';
    originalStdout = process.stdout.write;
    originalStderr = process.stderr.write;
    originalStdin = process.stdin;
    originalExit = process.exit;

    process.stdout.write = vi.fn((data: string) => {
      stdoutData += data;
      return true;
    }) as any;

    process.stderr.write = vi.fn((data: string) => {
      stderrData += data;
      return true;
    }) as any;

    process.exit = vi.fn() as any;
  });

  afterEach(() => {
    process.stdout.write = originalStdout;
    process.stderr.write = originalStderr;
    process.stdin = originalStdin;
    process.exit = originalExit;
    vi.clearAllMocks();
  });

  it('should process JSON input from file', async () => {
    // ファイル読み込みをモック
    const fs = await import('node:fs');
    vi.spyOn(fs, 'readFileSync').mockReturnValue(mockJsonString);

    await main(['node', 'jt', '$.name', 'data.json']);

    expect(stdoutData).toContain('"Alice"');
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should handle --compact flag', async () => {
    const fs = await import('node:fs');
    vi.spyOn(fs, 'readFileSync').mockReturnValue(mockJsonString);

    await main(['node', 'jt', '$', 'data.json', '--compact']);

    expect(stdoutData).toBe('{"name":"Alice","age":30}\n');
  });

  it('should handle --raw-string flag', async () => {
    const fs = await import('node:fs');
    vi.spyOn(fs, 'readFileSync').mockReturnValue(mockJsonString);

    await main(['node', 'jt', '$.name', 'data.json', '--raw-string']);

    expect(stdoutData).toBe('Alice\n');
  });

  it('should handle different output formats', async () => {
    const fs = await import('node:fs');
    vi.spyOn(fs, 'readFileSync').mockReturnValue(mockJsonString);

    await main(['node', 'jt', '$', 'data.json', '-o', 'yaml']);

    expect(stdoutData).toContain('name: Alice');
    expect(stdoutData).toContain('age: 30');
  });

  it('should handle CSV input with --no-header', async () => {
    const fs = await import('node:fs');
    vi.spyOn(fs, 'readFileSync').mockReturnValue('Alice,30\nBob,25');

    await main(['node', 'jt', '$', 'data.csv', '-i', 'csv', '--no-header']);

    expect(stdoutData).toContain('field1');
    expect(stdoutData).toContain('Alice');
  });

  it('should handle errors gracefully', async () => {
    const fs = await import('node:fs');
    vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('File not found');
    });

    await main(['node', 'jt', '$.name', 'nonexistent.json']);

    expect(stderrData).toContain('Error');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle stdin input when no file is provided', async () => {
    // stdin入力をモック
    const mockStdin = {
      isTTY: false,
      setEncoding: vi.fn(),
      on: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
        if (event === 'data') {
          callback(mockJsonString);
        } else if (event === 'end') {
          callback();
        }
      }),
      removeAllListeners: vi.fn(),
    };
    Object.defineProperty(process, 'stdin', {
      value: mockStdin,
      configurable: true,
    });

    await main(['node', 'jt', '$.name']);

    expect(stdoutData).toContain('"Alice"');
  });

  it('should show help when no arguments provided', async () => {
    // TTYをtrueに設定
    const mockStdin = {
      isTTY: true,
    };
    Object.defineProperty(process, 'stdin', {
      value: mockStdin,
      configurable: true,
    });

    await main(['node', 'jt']);

    expect(stderrData).toContain('Usage:');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle format conversion without query', async () => {
    const fs = await import('node:fs');
    vi.spyOn(fs, 'readFileSync').mockReturnValue(mockJsonString);

    await main(['node', 'jt', 'data.json', '-o', 'yaml']);

    expect(stdoutData).toContain('name: Alice');
    expect(stdoutData).toContain('age: 30');
  });

  it('should warn about --compact with non-json output', async () => {
    const fs = await import('node:fs');
    vi.spyOn(fs, 'readFileSync').mockReturnValue(mockJsonString);

    await main(['node', 'jt', '$', 'data.json', '-o', 'yaml', '--compact']);

    expect(stderrData).toContain('Warning');
    expect(stderrData).toContain('--compact');
  });

  it('should handle --color flag', async () => {
    const fs = await import('node:fs');
    vi.spyOn(fs, 'readFileSync').mockReturnValue(mockJsonString);

    await main(['node', 'jt', '$', 'data.json', '--color']);

    // 環境変数が設定されることを確認
    expect(process.env['FORCE_COLOR']).toBeDefined();
  });

  it('should handle --no-color flag', async () => {
    const fs = await import('node:fs');
    vi.spyOn(fs, 'readFileSync').mockReturnValue(mockJsonString);

    await main(['node', 'jt', '$', 'data.json', '--no-color']);

    // 環境変数が設定されることを確認
    expect(process.env['NO_COLOR']).toBeDefined();
  });
});
