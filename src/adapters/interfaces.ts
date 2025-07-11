/**
 * ファイルシステム操作の抽象化インターフェース
 */
export interface FileSystemAdapter {
  /**
   * ファイルを読み込む
   */
  readFile(path: string): Promise<string>;

  /**
   * ファイルが存在するかチェック
   */
  fileExists(path: string): boolean;
}

/**
 * 環境変数操作の抽象化インターフェース
 */
export interface EnvironmentAdapter {
  /**
   * 環境変数を取得
   */
  getVar(key: string): string | undefined;

  /**
   * 環境変数を設定
   */
  setVar(key: string, value: string): void;
}

/**
 * 出力操作の抽象化インターフェース
 */
export interface OutputAdapter {
  /**
   * 標準出力にメッセージを出力
   */
  log(message: string): void;

  /**
   * 標準エラー出力にメッセージを出力
   */
  error(message: string): void;

  /**
   * プロセスを終了
   */
  exit(code: number): void;
}

/**
 * 入力操作の抽象化インターフェース
 */
export interface InputAdapter {
  /**
   * 標準入力からデータを読み込む
   */
  readStdin(): Promise<string>;

  /**
   * 標準入力がTTYかどうかチェック
   */
  isTTY(): boolean;
}

/**
 * CLI実行時の依存性コンテキスト
 */
export interface CliContext {
  fs: FileSystemAdapter;
  env: EnvironmentAdapter;
  output: OutputAdapter;
  input: InputAdapter;
}
