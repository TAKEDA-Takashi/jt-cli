import { existsSync, readFileSync } from 'node:fs';
import { isatty } from 'node:tty';
import type {
  CliContext,
  EnvironmentAdapter,
  FileSystemAdapter,
  InputAdapter,
  OutputAdapter,
} from './interfaces';

/**
 * Node.js用ファイルシステムアダプター
 */
export class NodeFileSystemAdapter implements FileSystemAdapter {
  async readFile(path: string): Promise<string> {
    return readFileSync(path, 'utf8');
  }

  fileExists(path: string): boolean {
    return existsSync(path);
  }
}

/**
 * Node.js用環境変数アダプター
 */
export class NodeEnvironmentAdapter implements EnvironmentAdapter {
  getVar(key: string): string | undefined {
    return process.env[key];
  }

  setVar(key: string, value: string): void {
    process.env[key] = value;
  }
}

/**
 * Node.js用出力アダプター
 */
export class NodeOutputAdapter implements OutputAdapter {
  log(message: string): void {
    console.log(message);
  }

  error(message: string): void {
    console.error(message);
  }

  exit(code: number): void {
    process.exit(code);
  }
}

/**
 * Node.js用入力アダプター
 */
export class NodeInputAdapter implements InputAdapter {
  async readStdin(): Promise<string> {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
  }

  isTTY(): boolean {
    return isatty(0);
  }
}

/**
 * 本番用CLIコンテキストを作成
 */
export function createProductionContext(): CliContext {
  return {
    fs: new NodeFileSystemAdapter(),
    env: new NodeEnvironmentAdapter(),
    output: new NodeOutputAdapter(),
    input: new NodeInputAdapter(),
  };
}
