import type {
  CliContext,
  EnvironmentAdapter,
  FileSystemAdapter,
  InputAdapter,
  OutputAdapter,
} from './interfaces';

/**
 * テスト用ファイルシステムアダプター
 */
export class MockFileSystemAdapter implements FileSystemAdapter {
  private files = new Map<string, string>();

  constructor(initialFiles: Record<string, string> = {}) {
    Object.entries(initialFiles).forEach(([path, content]) => {
      this.files.set(path, content);
    });
  }

  async readFile(path: string): Promise<string> {
    const content = this.files.get(path);
    if (content === undefined) {
      const error = new Error(`ENOENT: no such file or directory, open '${path}'`) as Error & {
        code: string;
      };
      error.code = 'ENOENT';
      throw error;
    }
    return content;
  }

  fileExists(path: string): boolean {
    return this.files.has(path);
  }

  /**
   * テスト用: ファイルを追加
   */
  addFile(path: string, content: string): void {
    this.files.set(path, content);
  }

  /**
   * テスト用: ファイルを削除
   */
  removeFile(path: string): void {
    this.files.delete(path);
  }

  /**
   * テスト用: 全ファイルをクリア
   */
  clear(): void {
    this.files.clear();
  }
}

/**
 * テスト用環境変数アダプター
 */
export class MockEnvironmentAdapter implements EnvironmentAdapter {
  private vars = new Map<string, string>();

  constructor(initialVars: Record<string, string> = {}) {
    Object.entries(initialVars).forEach(([key, value]) => {
      this.vars.set(key, value);
    });
  }

  getVar(key: string): string | undefined {
    return this.vars.get(key);
  }

  setVar(key: string, value: string): void {
    this.vars.set(key, value);
  }

  /**
   * テスト用: 環境変数を削除
   */
  deleteVar(key: string): void {
    this.vars.delete(key);
  }

  /**
   * テスト用: 全環境変数をクリア
   */
  clear(): void {
    this.vars.clear();
  }

  /**
   * テスト用: 全環境変数を取得
   */
  getAllVars(): Record<string, string> {
    return Object.fromEntries(this.vars);
  }
}

/**
 * テスト用出力アダプター
 */
export class MockOutputAdapter implements OutputAdapter {
  public logs: string[] = [];
  public errors: string[] = [];
  public exitCode: number | undefined;

  log(message: string): void {
    this.logs.push(message);
  }

  error(message: string): void {
    this.errors.push(message);
  }

  exit(code: number): void {
    this.exitCode = code;
    // テスト環境では実際にはexitしない
  }

  /**
   * テスト用: ログをクリア
   */
  clear(): void {
    this.logs = [];
    this.errors = [];
    this.exitCode = undefined;
  }

  /**
   * テスト用: 最後のログメッセージを取得
   */
  getLastLog(): string | undefined {
    return this.logs[this.logs.length - 1];
  }

  /**
   * テスト用: 最後のエラーメッセージを取得
   */
  getLastError(): string | undefined {
    return this.errors[this.errors.length - 1];
  }
}

/**
 * テスト用入力アダプター
 */
export class MockInputAdapter implements InputAdapter {
  private stdinData = '';
  private ttyFlag = false;

  constructor(stdinData = '', isTTY = false) {
    this.stdinData = stdinData;
    this.ttyFlag = isTTY;
  }

  async readStdin(): Promise<string> {
    return this.stdinData;
  }

  isTTY(): boolean {
    return this.ttyFlag;
  }

  /**
   * テスト用: 標準入力データを設定
   */
  setStdinData(data: string): void {
    this.stdinData = data;
  }

  /**
   * テスト用: TTYフラグを設定
   */
  setTTY(isTTY: boolean): void {
    this.ttyFlag = isTTY;
  }
}

/**
 * テスト用CLIコンテキストを作成
 */
export function createMockContext(overrides: Partial<CliContext> = {}): CliContext {
  return {
    fs: new MockFileSystemAdapter(),
    env: new MockEnvironmentAdapter(),
    output: new MockOutputAdapter(),
    input: new MockInputAdapter(),
    ...overrides,
  };
}

/**
 * テスト用CLIコンテキストを作成（初期データ付き）
 */
export function createMockContextWithData(config: {
  files?: Record<string, string>;
  env?: Record<string, string>;
  stdinData?: string;
  isTTY?: boolean;
}): CliContext {
  return {
    fs: new MockFileSystemAdapter(config.files),
    env: new MockEnvironmentAdapter(config.env),
    output: new MockOutputAdapter(),
    input: new MockInputAdapter(config.stdinData, config.isTTY),
  };
}
