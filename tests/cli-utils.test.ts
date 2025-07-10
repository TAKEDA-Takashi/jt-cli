import * as fs from 'node:fs';
import * as tty from 'node:tty';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// モックをインポート前に設定
vi.mock('node:fs', () => ({
  readFileSync: vi.fn().mockImplementation((path: any) => {
    if (path.toString().includes('package.json')) {
      return JSON.stringify({ version: '1.0.0', description: 'Test CLI' });
    }
    throw new Error('File not found');
  }),
}));
vi.mock('node:tty');

// モック設定後にインポート
import { detectInputFormat, getInput, readStdin } from '../src/cli';
import { ErrorCode, JtError } from '../src/errors';

describe('CLI Utility Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('readStdin', () => {
    it('should read data from stdin', async () => {
      const testData = 'Hello, World!';
      const chunks = [Buffer.from(testData)];

      // process.stdinのモック
      const originalAsyncIterator = process.stdin[Symbol.asyncIterator];
      process.stdin[Symbol.asyncIterator] = async function* () {
        for (const chunk of chunks) {
          yield chunk;
        }
      };

      const result = await readStdin();
      expect(result).toBe(testData);

      // 元に戻す
      process.stdin[Symbol.asyncIterator] = originalAsyncIterator;
    });

    it('should handle multi-chunk input', async () => {
      const chunks = [Buffer.from('Hello, '), Buffer.from('World!')];

      const originalAsyncIterator = process.stdin[Symbol.asyncIterator];
      process.stdin[Symbol.asyncIterator] = async function* () {
        for (const chunk of chunks) {
          yield chunk;
        }
      };

      const result = await readStdin();
      expect(result).toBe('Hello, World!');

      process.stdin[Symbol.asyncIterator] = originalAsyncIterator;
    });
  });

  describe('getInput', () => {
    beforeEach(() => {
      // デフォルトでパイプモード
      vi.mocked(tty.isatty).mockReturnValue(false);
    });

    it('should read file when filePath is provided', async () => {
      const testData = '{"test": true}';
      vi.mocked(fs.readFileSync).mockReturnValue(testData);

      const result = await getInput('test.json');

      expect(fs.readFileSync).toHaveBeenCalledWith('test.json', 'utf8');
      expect(result).toBe(testData);
    });

    it('should throw JtError for file not found', async () => {
      const error: any = new Error('ENOENT: no such file or directory');
      error.code = 'ENOENT';
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw error;
      });

      await expect(getInput('nonexistent.json')).rejects.toThrow(JtError);
      await expect(getInput('nonexistent.json')).rejects.toMatchObject({
        code: ErrorCode.FILE_NOT_FOUND,
        message: 'File not found: nonexistent.json',
      });
    });

    it('should re-throw non-ENOENT errors', async () => {
      const error = new Error('Permission denied');
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw error;
      });

      await expect(getInput('protected.json')).rejects.toThrow('Permission denied');
    });

    it('should read from stdin when no filePath and piped', async () => {
      const testData = 'piped data';
      const originalAsyncIterator = process.stdin[Symbol.asyncIterator];
      process.stdin[Symbol.asyncIterator] = async function* () {
        yield Buffer.from(testData);
      };

      const result = await getInput();
      expect(result).toBe(testData);

      process.stdin[Symbol.asyncIterator] = originalAsyncIterator;
    });

    it('should throw JtError when no input and TTY mode', async () => {
      vi.mocked(tty.isatty).mockReturnValue(true); // TTYモード

      await expect(getInput()).rejects.toThrow(JtError);
      await expect(getInput()).rejects.toMatchObject({
        code: ErrorCode.INVALID_INPUT,
        message: 'No input provided',
      });
    });
  });

  describe('detectInputFormat', () => {
    it('should detect JSON format from .json extension', () => {
      expect(detectInputFormat('any content', 'data.json')).toBe('json');
    });

    it('should detect YAML format from .yaml extension', () => {
      expect(detectInputFormat('any content', 'config.yaml')).toBe('yaml');
    });

    it('should detect YAML format from .yml extension', () => {
      expect(detectInputFormat('any content', 'config.yml')).toBe('yaml');
    });

    it('should detect JSONL format from .jsonl extension', () => {
      expect(detectInputFormat('any content', 'logs.jsonl')).toBe('jsonl');
    });

    it('should detect JSONL format from .ndjson extension', () => {
      expect(detectInputFormat('any content', 'logs.ndjson')).toBe('jsonl');
    });

    it('should detect JSON Lines from multi-line JSON content', () => {
      const content = '{"id": 1}\n{"id": 2}\n{"id": 3}';
      expect(detectInputFormat(content)).toBe('jsonl');
    });

    it('should detect JSON from content starting with {', () => {
      const content = '{"name": "test"}';
      expect(detectInputFormat(content)).toBe('json');
    });

    it('should detect JSON from content starting with [', () => {
      const content = '[1, 2, 3]';
      expect(detectInputFormat(content)).toBe('json');
    });

    it('should detect JSON Lines with mixed valid JSON values', () => {
      const content = '{"obj": true}\n[1, 2, 3]\n"string"\ntrue\nnull\n42';
      expect(detectInputFormat(content)).toBe('jsonl');
    });

    it('should default to YAML for ambiguous content', () => {
      const content = 'key: value';
      expect(detectInputFormat(content)).toBe('yaml');
    });

    it('should default to YAML for empty content', () => {
      expect(detectInputFormat('')).toBe('yaml');
      expect(detectInputFormat('   ')).toBe('yaml');
    });

    it('should handle single-line non-JSON content as YAML', () => {
      const content = 'not json or jsonl';
      expect(detectInputFormat(content)).toBe('yaml');
    });
  });
});
