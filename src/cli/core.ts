import { Command } from 'commander';
import type { CliContext } from '../adapters';
import { ErrorCode, JtError } from '../errors';
import type { CliOptions, InputFormat, OutputFormat } from '../types';

/**
 * ファイルまたは標準入力から入力を取得（依存性注入版）
 */
export async function getInputWithContext(
  filePath: string | undefined,
  context: CliContext,
): Promise<string> {
  if (filePath) {
    try {
      return await context.fs.readFile(filePath);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new JtError(
          ErrorCode.FILE_NOT_FOUND,
          `File not found: ${filePath}`,
          undefined,
          'Check the file path and try again',
        );
      }
      throw error;
    }
  }

  // 標準入力がパイプされているかチェック
  if (!context.input.isTTY()) {
    return context.input.readStdin();
  }

  throw new JtError(
    ErrorCode.INVALID_INPUT,
    'No input provided',
    'Use a file path or pipe data to stdin',
    'Example: cat data.json | jt "$.name"',
  );
}

/**
 * 入力形式を推測する（依存性注入版）
 */
export function detectInputFormatWithContext(input: string, filePath?: string): InputFormat {
  // ファイル拡張子から判定
  if (filePath) {
    if (filePath.endsWith('.json')) return 'json';
    if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) return 'yaml';
    if (filePath.endsWith('.jsonl') || filePath.endsWith('.ndjson')) return 'jsonl';
    if (filePath.endsWith('.csv')) return 'csv';
  }

  // 内容から判定
  const trimmed = input.trim();

  // JSON Lines: 複数行でそれぞれがJSONっぽい
  if (trimmed.includes('\n')) {
    const lines = trimmed.split('\n').filter((line) => line.trim());
    if (lines.length > 1) {
      // 全行がJSONとしてパースできそうならJSON Lines
      const allLinesLookLikeJson = lines.every((line) => {
        const trimmedLine = line.trim();
        return (
          (trimmedLine.startsWith('{') && trimmedLine.endsWith('}')) ||
          (trimmedLine.startsWith('[') && trimmedLine.endsWith(']'))
        );
      });
      if (allLinesLookLikeJson) {
        return 'jsonl';
      }

      // CSV判定
      const firstLine = lines[0];
      // カンマが含まれていて、かつ全行のカンマ数が同じならCSV
      if (firstLine && firstLine.includes(',')) {
        const firstLineCommas = (firstLine.match(/,/g) || []).length;
        const allLinesHaveSameCommas = lines.every((line) => {
          const commas = (line.match(/,/g) || []).length;
          return commas === firstLineCommas;
        });
        if (allLinesHaveSameCommas && firstLineCommas > 0) {
          return 'csv';
        }
      }
    }
  }

  // JSONっぽい判定（YAML判定より先に行う）
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    return 'json';
  }

  // YAML判定
  if (
    trimmed.includes(': ') || // key: value形式
    trimmed.startsWith('- ') || // リスト形式
    (trimmed.includes('\n') && (trimmed.includes('\n  ') || trimmed.includes('\n- '))) // インデントがある
  ) {
    return 'yaml';
  }

  // CSV (単一行)
  if (trimmed.includes(',') && !trimmed.includes('\n')) {
    return 'csv';
  }

  // デフォルトはJSON
  return 'json';
}

/**
 * CLIオプションを検証
 */
export function validateCliOptions(options: CliOptions): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let valid = true;

  // 出力形式の検証
  const validOutputFormats = ['json', 'jsonl', 'yaml', 'csv'];
  if (!validOutputFormats.includes(options.outputFormat)) {
    warnings.push(`Invalid output format: ${options.outputFormat}`);
    valid = false;
  }

  // compactオプションの警告
  if (options.compact && options.outputFormat !== 'json') {
    warnings.push(
      `Warning: --compact option is only effective with JSON output format. Current format: ${options.outputFormat}`,
    );
  }

  // noHeaderオプションの警告
  if (options.noHeader && options.inputFormat !== 'csv') {
    warnings.push(
      `Warning: --no-header option is only effective with CSV input format. Current format: ${options.inputFormat}`,
    );
  }

  return { valid, warnings };
}

/**
 * コマンドライン引数をパース（依存性注入版）
 */
export async function parseCliArgs(argv: string[], context: CliContext): Promise<CliOptions> {
  const program = new Command();

  // Commander.jsの設定（outputHelpは後で制御）
  program.exitOverride(); // プロセス終了を防ぐ
  program.configureOutput({
    writeOut: (str) => context.output.log(str),
    writeErr: (str) => context.output.error(str),
  });

  let parsedOptions: Record<string, unknown> = {};
  let query: string | undefined;
  let file: string | undefined;

  program
    .name('jt')
    .description('JSONata CLI tool')
    .version('1.2.0')
    .argument('[query]', 'JSONata query expression (optional)')
    .argument('[file]', 'Input file (JSON, YAML, or JSON Lines)')
    .option(
      '-i, --input-format <format>',
      'Input format: json, yaml, jsonl, csv (auto-detected if not specified)',
    )
    .option('-o, --output-format <format>', 'Output format', 'json')
    .option('-c, --compact', 'Compact JSON output (only works with -o json)')
    .option('-r, --raw-string', 'Output raw strings without quotes (for JSON output)')
    .option('--no-header', 'Treat CSV input as having no headers (only works with -i csv)')
    .option('--color', 'Force color output even when piped')
    .option('--no-color', 'Disable color output')
    .action((queryArg?: string, fileArg?: string) => {
      query = queryArg;
      file = fileArg;
      parsedOptions = program.opts();
    });

  // パース実行
  try {
    program.parse(argv);
  } catch (error) {
    // Commander.jsが--versionや--helpでスローするエラーをキャッチ
    if (
      error instanceof Error &&
      'code' in error &&
      (error.code === 'commander.version' || error.code === 'commander.help')
    ) {
      // バージョンやヘルプ表示時は終了
      context.output.exit(0);
      // ダミーのオプションを返す
      return {
        inputFormat: 'json',
        outputFormat: 'json',
        input: '{}',
      };
    }
    throw error;
  }

  // 引数の解釈を調整：queryが省略された場合、最初の引数がfile
  let actualQuery = query;
  let actualFile = file;

  // queryがファイルパスっぽい場合（拡張子がある、または$で始まらない）
  if (query && !file && !query.startsWith('$') && !query.includes('(')) {
    // ファイル拡張子をチェック
    if (query.match(/\.(json|yaml|yml|jsonl|ndjson|csv)$/i)) {
      actualQuery = undefined;
      actualFile = query;
    }
  }

  // 入力を取得
  const input = await getInputWithContext(actualFile, context);

  // 入力形式を決定（指定されていない場合は自動検出）
  const inputFormat =
    (parsedOptions['inputFormat'] as InputFormat) || detectInputFormatWithContext(input, actualFile);

  // 出力形式
  const outputFormat = (parsedOptions['outputFormat'] as OutputFormat) || 'json';

  // 色付けオプションの設定
  if (parsedOptions['color'] !== undefined) {
    context.env.setVar('FORCE_COLOR', parsedOptions['color'] ? '1' : '0');
  }

  // --no-headerオプションは、Commanderによってheader: falseとして処理される
  const noHeader = parsedOptions['header'] === false;

  return {
    query: actualQuery,
    inputFormat,
    outputFormat,
    input,
    color: parsedOptions['color'] as boolean | undefined,
    compact: parsedOptions['compact'] as boolean | undefined,
    rawString: parsedOptions['rawString'] as boolean | undefined,
    noHeader,
  };
}
