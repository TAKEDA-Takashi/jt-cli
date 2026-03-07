import type { CliContext } from '../adapters';
import { ErrorCode, JtError } from '../errors';
import { parseInput } from '../formats/input';
import { formatOutput } from '../formats/output/index';
import { executeQuery } from '../query';
import type { CliOptions, ErrorFormat } from '../types';

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
 * エラーからメッセージを抽出
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
}

/**
 * エラーを処理して適切なメッセージを出力
 */
export function handleError(error: unknown, context: CliContext, errorFormat?: ErrorFormat): void {
  if (errorFormat === 'json') {
    const json =
      error instanceof JtError
        ? error.toJSON()
        : { error: { code: ErrorCode.UNKNOWN_ERROR, message: extractErrorMessage(error) } };
    context.output.error(JSON.stringify(json));
    context.output.exit(1);
    return;
  }

  if (error instanceof JtError) {
    context.output.error(error.format());
  } else {
    context.output.error(`Error: ${extractErrorMessage(error)}`);
  }
  context.output.exit(1);
}
