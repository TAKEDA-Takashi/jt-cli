import type { CliContext } from '../adapters';
import { JtError } from '../errors';
import { parseInput } from '../formats/input';
import { formatOutput } from '../formats/output/index';
import { executeQuery } from '../query';
import type { CliOptions } from '../types';

/**
 * CLIコマンドを実行（依存性注入版）
 */
export async function executeCliCommand(
  options: CliOptions,
  _context: CliContext,
): Promise<string> {
  // 入力データをパース
  const data = parseInput(options.input, options.inputFormat, options.noHeader);

  // JSONataクエリの有無で処理を分岐
  let result: unknown;
  if (options.query) {
    // JSONataクエリを実行
    result = await executeQuery(options.query, data);
  } else {
    // クエリなしの場合はパースしたデータをそのまま使用
    result = data;
  }

  // 結果をフォーマット
  return formatOutput(result, options.outputFormat, options.compact, options.rawString);
}

/**
 * エラーを処理して適切なメッセージを出力
 */
export function handleError(error: unknown, context: CliContext): void {
  if (error instanceof JtError) {
    context.output.error(error.format());
    context.output.exit(1);
  } else if (error instanceof Error) {
    context.output.error(`Error: ${error.message}`);
    context.output.exit(1);
  } else {
    context.output.error('An unknown error occurred');
    context.output.exit(1);
  }
}
