import type { CliContext } from './adapters';
import { createProductionContext } from './adapters';
import { parseCliArgs, validateCliOptions } from './cli/core';
import { getToolDescription } from './cli/describe';
import { executeCliCommand, handleError } from './cli/executeCommand';

/**
 * CLIメイン関数（依存性注入版）
 */
export async function main(argv: string[] = process.argv, context?: CliContext): Promise<void> {
  // コンテキストが提供されていない場合は本番用コンテキストを使用
  const ctx = context || createProductionContext();

  // --describe を早期に処理（入力不要）
  if (argv.includes('--describe')) {
    ctx.output.log(getToolDescription());
    ctx.output.exit(0);
    return;
  }

  // --error-format を早期に抽出（パース失敗時にもJSON出力できるように）
  const errorFormatIdx = argv.indexOf('--error-format');
  const rawErrorFormat = errorFormatIdx !== -1 ? argv[errorFormatIdx + 1] : undefined;
  const errorFormat =
    rawErrorFormat === 'json' || rawErrorFormat === 'text' ? rawErrorFormat : undefined;

  try {
    // コマンドライン引数をパース
    const options = await parseCliArgs(argv, ctx);

    // オプションを検証
    const validation = validateCliOptions(options);

    // 警告を出力
    for (const warning of validation.warnings) {
      ctx.output.error(warning);
    }

    // 検証エラーがある場合は終了
    if (!validation.valid) {
      ctx.output.exit(1);
      return;
    }

    // コマンドを実行
    const result = await executeCliCommand(options, ctx);

    // 結果を出力
    ctx.output.log(result);
  } catch (error) {
    // エラーハンドリング
    handleError(error, ctx, errorFormat);
  }
}

import { realpathSync } from 'node:fs';
// CLIとして実行された場合
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const runningScript = process.argv[1];

if (runningScript && realpathSync(runningScript) === currentFile) {
  main().catch(console.error);
}
