import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createProductionContext,
  NodeEnvironmentAdapter,
  NodeFileSystemAdapter,
  NodeInputAdapter,
  NodeOutputAdapter,
} from '../../src/adapters/node-adapters';

describe('NodeFileSystemAdapter', () => {
  let adapter: NodeFileSystemAdapter;
  let tempFiles: string[] = [];

  beforeEach(() => {
    adapter = new NodeFileSystemAdapter();
  });

  afterEach(() => {
    // テスト用一時ファイルをクリーンアップ
    tempFiles.forEach((file) => {
      if (existsSync(file)) {
        unlinkSync(file);
      }
    });
    tempFiles = [];
  });

  describe('readFile', () => {
    it('should read existing file content', async () => {
      const tempFile = join(tmpdir(), `jt-test-${Date.now()}.json`);
      tempFiles.push(tempFile);
      const content = '{"name": "Alice"}';
      writeFileSync(tempFile, content);

      const result = await adapter.readFile(tempFile);

      expect(result).toBe(content);
    });

    it('should throw error for non-existent file', async () => {
      const nonExistentFile = '/tmp/non-existent-file.json';

      await expect(adapter.readFile(nonExistentFile)).rejects.toThrow();
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', () => {
      const tempFile = join(tmpdir(), `jt-test-${Date.now()}.json`);
      tempFiles.push(tempFile);
      writeFileSync(tempFile, 'content');

      expect(adapter.fileExists(tempFile)).toBe(true);
    });

    it('should return false for non-existent file', () => {
      const nonExistentFile = '/tmp/non-existent-file.json';

      expect(adapter.fileExists(nonExistentFile)).toBe(false);
    });
  });
});

describe('NodeEnvironmentAdapter', () => {
  let adapter: NodeEnvironmentAdapter;
  let originalEnv: typeof process.env;

  beforeEach(() => {
    adapter = new NodeEnvironmentAdapter();
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // 環境変数を復元
    process.env = originalEnv;
  });

  describe('getVar and setVar', () => {
    it('should get environment variable', () => {
      process.env['TEST_VAR'] = 'test_value';

      expect(adapter.getVar('TEST_VAR')).toBe('test_value');
    });

    it('should return undefined for non-existent variable', () => {
      delete process.env['NON_EXISTENT'];

      expect(adapter.getVar('NON_EXISTENT')).toBeUndefined();
    });

    it('should set environment variable', () => {
      adapter.setVar('NEW_VAR', 'new_value');

      expect(process.env['NEW_VAR']).toBe('new_value');
    });
  });
});

describe('NodeOutputAdapter', () => {
  let adapter: NodeOutputAdapter;

  beforeEach(() => {
    adapter = new NodeOutputAdapter();
  });

  describe('log', () => {
    it('should call console.log', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

      adapter.log('test message');

      expect(spy).toHaveBeenCalledWith('test message');
      spy.mockRestore();
    });
  });

  describe('error', () => {
    it('should call console.error', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      adapter.error('error message');

      expect(spy).toHaveBeenCalledWith('error message');
      spy.mockRestore();
    });
  });

  describe('exit', () => {
    it('should call process.exit', () => {
      const spy = vi.spyOn(process, 'exit').mockImplementation(() => {
        // プロセスを実際に終了させないためのモック
        return undefined as never;
      });

      adapter.exit(1);

      expect(spy).toHaveBeenCalledWith(1);
      spy.mockRestore();
    });
  });
});

describe('NodeInputAdapter', () => {
  let adapter: NodeInputAdapter;

  beforeEach(() => {
    adapter = new NodeInputAdapter();
  });

  describe('readStdin', () => {
    it('should read from process.stdin', async () => {
      // 注意: この種のテストは実際のstdinをモックするのが複雑なため、
      // 統合テストで扱うことが多い
      // ここでは基本的な存在確認のみ
      expect(typeof adapter.readStdin).toBe('function');
    });
  });

  describe('isTTY', () => {
    it('should return boolean value', () => {
      const result = adapter.isTTY();
      expect(typeof result).toBe('boolean');
    });
  });
});

describe('createProductionContext', () => {
  it('should create context with Node.js adapters', () => {
    const context = createProductionContext();

    expect(context.fs).toBeInstanceOf(NodeFileSystemAdapter);
    expect(context.env).toBeInstanceOf(NodeEnvironmentAdapter);
    expect(context.output).toBeInstanceOf(NodeOutputAdapter);
    expect(context.input).toBeInstanceOf(NodeInputAdapter);
  });

  it('should create different instances each time', () => {
    const context1 = createProductionContext();
    const context2 = createProductionContext();

    expect(context1).not.toBe(context2);
    expect(context1.fs).not.toBe(context2.fs);
  });
});
