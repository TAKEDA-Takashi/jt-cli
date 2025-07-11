import chalk from 'chalk';

export enum ErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_QUERY = 'INVALID_QUERY',
  EXECUTION_ERROR = 'EXECUTION_ERROR',
  OUTPUT_ERROR = 'OUTPUT_ERROR',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_OUTPUT_FORMAT = 'INVALID_OUTPUT_FORMAT',
}

// エラー出力の色付けが有効かどうかを判定
function isErrorColorEnabled(): boolean {
  const env = process.env as Record<string, string | undefined>;

  // NO_COLOR環境変数が設定されている場合は無効
  if (env['NO_COLOR']) {
    return false;
  }

  // Force colorを環境変数で制御
  if (env['FORCE_COLOR'] === '0') {
    return false;
  }

  // TTYでない場合でもFORCE_COLORが設定されていれば有効
  if (env['FORCE_COLOR']) {
    return true;
  }

  // 標準エラー出力がTTYかどうかで判定
  return process.stderr.isTTY === true;
}

export class JtError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly detail?: string,
    public readonly suggestion?: string,
  ) {
    super(message);
    this.name = 'JtError';
    Object.setPrototypeOf(this, JtError.prototype);
  }

  format(): string {
    const useColor = isErrorColorEnabled();

    let formatted = useColor
      ? `${chalk.red('Error:')} ${chalk.bold(this.message)}`
      : `Error: ${this.message}`;

    if (this.detail) {
      formatted += useColor
        ? `\n${chalk.yellow('Detail:')} ${this.detail}`
        : `\nDetail: ${this.detail}`;
    }

    if (this.suggestion) {
      formatted += useColor
        ? `\n${chalk.green('Suggestion:')} ${this.suggestion}`
        : `\nSuggestion: ${this.suggestion}`;
    }

    return formatted;
  }
}
