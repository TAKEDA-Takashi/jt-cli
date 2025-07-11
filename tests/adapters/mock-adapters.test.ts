import { beforeEach, describe, expect, it } from 'vitest';
import {
  createMockContext,
  createMockContextWithData,
  MockEnvironmentAdapter,
  MockFileSystemAdapter,
  MockInputAdapter,
  MockOutputAdapter,
} from '../../src/adapters/mock-adapters';

describe('MockFileSystemAdapter', () => {
  let adapter: MockFileSystemAdapter;

  beforeEach(() => {
    adapter = new MockFileSystemAdapter();
  });

  describe('readFile', () => {
    it('should read existing file content', async () => {
      adapter.addFile('/test.json', '{"name": "Alice"}');

      const content = await adapter.readFile('/test.json');

      expect(content).toBe('{"name": "Alice"}');
    });

    it('should throw error for non-existent file', async () => {
      await expect(adapter.readFile('/non-existent.json')).rejects.toThrow(
        "ENOENT: no such file or directory, open '/non-existent.json'",
      );
    });

    it('should throw error with ENOENT code', async () => {
      try {
        await adapter.readFile('/non-existent.json');
      } catch (error) {
        expect((error as any).code).toBe('ENOENT');
      }
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', () => {
      adapter.addFile('/test.json', 'content');

      expect(adapter.fileExists('/test.json')).toBe(true);
    });

    it('should return false for non-existent file', () => {
      expect(adapter.fileExists('/non-existent.json')).toBe(false);
    });
  });

  describe('utility methods', () => {
    it('should remove file', () => {
      adapter.addFile('/test.json', 'content');
      adapter.removeFile('/test.json');

      expect(adapter.fileExists('/test.json')).toBe(false);
    });

    it('should clear all files', () => {
      adapter.addFile('/test1.json', 'content1');
      adapter.addFile('/test2.json', 'content2');
      adapter.clear();

      expect(adapter.fileExists('/test1.json')).toBe(false);
      expect(adapter.fileExists('/test2.json')).toBe(false);
    });
  });
});

describe('MockEnvironmentAdapter', () => {
  let adapter: MockEnvironmentAdapter;

  beforeEach(() => {
    adapter = new MockEnvironmentAdapter();
  });

  describe('getVar and setVar', () => {
    it('should get and set environment variables', () => {
      adapter.setVar('TEST_VAR', 'test_value');

      expect(adapter.getVar('TEST_VAR')).toBe('test_value');
    });

    it('should return undefined for non-existent variable', () => {
      expect(adapter.getVar('NON_EXISTENT')).toBeUndefined();
    });
  });

  describe('utility methods', () => {
    it('should delete variable', () => {
      adapter.setVar('TEST_VAR', 'value');
      adapter.deleteVar('TEST_VAR');

      expect(adapter.getVar('TEST_VAR')).toBeUndefined();
    });

    it('should clear all variables', () => {
      adapter.setVar('VAR1', 'value1');
      adapter.setVar('VAR2', 'value2');
      adapter.clear();

      expect(adapter.getVar('VAR1')).toBeUndefined();
      expect(adapter.getVar('VAR2')).toBeUndefined();
    });

    it('should get all variables', () => {
      adapter.setVar('VAR1', 'value1');
      adapter.setVar('VAR2', 'value2');

      const allVars = adapter.getAllVars();

      expect(allVars).toEqual({
        VAR1: 'value1',
        VAR2: 'value2',
      });
    });
  });
});

describe('MockOutputAdapter', () => {
  let adapter: MockOutputAdapter;

  beforeEach(() => {
    adapter = new MockOutputAdapter();
  });

  describe('log and error', () => {
    it('should capture log messages', () => {
      adapter.log('test log');
      adapter.log('another log');

      expect(adapter.logs).toEqual(['test log', 'another log']);
    });

    it('should capture error messages', () => {
      adapter.error('test error');
      adapter.error('another error');

      expect(adapter.errors).toEqual(['test error', 'another error']);
    });
  });

  describe('exit', () => {
    it('should capture exit code', () => {
      adapter.exit(1);

      expect(adapter.exitCode).toBe(1);
    });
  });

  describe('utility methods', () => {
    it('should get last log message', () => {
      adapter.log('first');
      adapter.log('last');

      expect(adapter.getLastLog()).toBe('last');
    });

    it('should get last error message', () => {
      adapter.error('first error');
      adapter.error('last error');

      expect(adapter.getLastError()).toBe('last error');
    });

    it('should return undefined for last log when no logs', () => {
      expect(adapter.getLastLog()).toBeUndefined();
    });

    it('should clear all data', () => {
      adapter.log('test');
      adapter.error('error');
      adapter.exit(1);
      adapter.clear();

      expect(adapter.logs).toEqual([]);
      expect(adapter.errors).toEqual([]);
      expect(adapter.exitCode).toBeUndefined();
    });
  });
});

describe('MockInputAdapter', () => {
  it('should return configured stdin data', async () => {
    const adapter = new MockInputAdapter('test stdin data');

    const data = await adapter.readStdin();

    expect(data).toBe('test stdin data');
  });

  it('should return configured TTY status', () => {
    const ttyAdapter = new MockInputAdapter('', true);
    const nonTtyAdapter = new MockInputAdapter('', false);

    expect(ttyAdapter.isTTY()).toBe(true);
    expect(nonTtyAdapter.isTTY()).toBe(false);
  });

  it('should allow setting stdin data', async () => {
    const adapter = new MockInputAdapter();
    adapter.setStdinData('new data');

    const data = await adapter.readStdin();

    expect(data).toBe('new data');
  });

  it('should allow setting TTY flag', () => {
    const adapter = new MockInputAdapter();
    adapter.setTTY(true);

    expect(adapter.isTTY()).toBe(true);
  });
});

describe('createMockContext', () => {
  it('should create context with default adapters', () => {
    const context = createMockContext();

    expect(context.fs).toBeInstanceOf(MockFileSystemAdapter);
    expect(context.env).toBeInstanceOf(MockEnvironmentAdapter);
    expect(context.output).toBeInstanceOf(MockOutputAdapter);
    expect(context.input).toBeInstanceOf(MockInputAdapter);
  });

  it('should allow overriding adapters', () => {
    const customOutput = new MockOutputAdapter();
    customOutput.log('custom');

    const context = createMockContext({ output: customOutput });

    expect(context.output).toBe(customOutput);
    expect((context.output as MockOutputAdapter).logs).toEqual(['custom']);
  });
});

describe('createMockContextWithData', () => {
  it('should create context with initial data', async () => {
    const context = createMockContextWithData({
      files: { '/test.json': '{"name": "Alice"}' },
      env: { TEST_VAR: 'test_value' },
      stdinData: 'stdin content',
      isTTY: true,
    });

    expect(await context.fs.readFile('/test.json')).toBe('{"name": "Alice"}');
    expect(context.env.getVar('TEST_VAR')).toBe('test_value');
    expect(await context.input.readStdin()).toBe('stdin content');
    expect(context.input.isTTY()).toBe(true);
  });

  it('should work with empty configuration', () => {
    const context = createMockContextWithData({});

    expect(context.fs).toBeInstanceOf(MockFileSystemAdapter);
    expect(context.env).toBeInstanceOf(MockEnvironmentAdapter);
    expect(context.output).toBeInstanceOf(MockOutputAdapter);
    expect(context.input).toBeInstanceOf(MockInputAdapter);
  });
});
