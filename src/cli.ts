import { readFileSync } from 'node:fs';
import { isatty } from 'node:tty';
import { Command } from 'commander';
import { ErrorCode, JtError } from './errors';
import { parseInput } from './formats/input';
import { formatOutput } from './formats/output/index';
import { executeQuery } from './query';
import type { CliOptions, InputFormat, OutputFormat } from './types';

// package.jsonから情報を読み込む
const packageInfo = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as { version: string; description: string };

/**
 * JSONataクエリを実行してフォーマットした結果を返す
 */
export async function processQuery(options: CliOptions): Promise<string> {
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
 * 標準入力からデータを読み込む
 */
export async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString('utf8');
}

/**
 * ファイルまたは標準入力から入力を取得
 */
export async function getInput(filePath?: string): Promise<string> {
  if (filePath) {
    try {
      return readFileSync(filePath, 'utf8');
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
  if (!isatty(0)) {
    return readStdin();
  }

  throw new JtError(
    ErrorCode.INVALID_INPUT,
    'No input provided',
    'Use a file path or pipe data to stdin',
    'Example: cat data.json | jt "$.name"',
  );
}

/**
 * 入力形式を推測する
 */
export function detectInputFormat(input: string, filePath?: string): InputFormat {
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

    // CSV: カンマ区切りで、全行が同じ数のカンマを持つ
    if (lines.length > 0 && lines[0]) {
      const firstLineCommas = (lines[0].match(/,/g) || []).length;
      if (
        firstLineCommas > 0 &&
        lines.every((line) => {
          // クォート内のカンマは無視する簡易チェック
          const outsideQuotes = line.replace(/"[^"]*"/g, '');
          return (outsideQuotes.match(/,/g) || []).length === firstLineCommas;
        })
      ) {
        return 'csv';
      }
    }

    if (
      lines.length > 1 &&
      lines.every((line) => {
        const first = line.trim()[0];
        return (
          first === '{' ||
          first === '[' ||
          first === '"' ||
          /^(true|false|null|\d)/.test(line.trim())
        );
      })
    ) {
      return 'jsonl';
    }
  }

  // JSON: 中括弧または角括弧で始まる
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return 'json';
  }

  // デフォルトはYAML（最も柔軟）
  return 'yaml';
}

/**
 * CLIメイン関数
 */
export async function main(argv: string[] = process.argv): Promise<void> {
  const program = new Command();

  program
    .name('jt')
    .description(packageInfo.description)
    .version(packageInfo.version)
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
    .addHelpText(
      'after',
      `
Examples:
  $ jt '$.name' data.json
  $ cat data.yaml | jt '$.items[*].price'
  $ jt '$[age > 25].name' users.jsonl -o jsonl
  $ jt '\${department: $sum(salary)}' employees.json -o yaml
  $ jt '$' data.csv
  
  # Format conversion without query
  $ jt data.json -o yaml
  $ cat data.yaml | jt -c
  $ jt data.csv -o json
  
  # Raw string output (no quotes)
  $ jt -r '$.name' data.json
  $ jt -r '$.users[*].email' data.json
  
Input formats:
  json     JSON format
  yaml     YAML format
  jsonl    JSON Lines (one JSON per line)
  csv      CSV format with headers (use --no-header for headerless CSV)
  
Output formats:
  json     Pretty-printed JSON (default)
  jsonl    JSON Lines (one JSON per line)
  yaml     YAML format
  csv      CSV format (requires array of objects)
  
Options:
  -c, --compact    Compact JSON output (only works with -o json)
  -r, --raw-string Output raw strings without quotes (for JSON/JSONL output)
`,
    )
    .action(async (query?: string, file?: string) => {
      try {
        const opts = program.opts<{
          inputFormat?: string;
          outputFormat?: string;
          color?: boolean;
          compact?: boolean;
          rawString?: boolean;
          header?: boolean;
        }>();

        // 引数の解釈を調整：queryが省略された場合、最初の引数がfile
        let actualQuery: string | undefined = query;
        let actualFile: string | undefined = file;

        // queryがファイルパスっぽい場合（拡張子がある、または$で始まらない）
        if (query && !file && !query.startsWith('$') && !query.includes('(')) {
          // ファイル拡張子をチェック
          if (query.match(/\.(json|yaml|yml|jsonl|ndjson|csv)$/i)) {
            actualQuery = undefined;
            actualFile = query;
          }
        }

        // 入力を取得
        const input = await getInput(actualFile);

        // 入力形式を決定（指定されていない場合は自動検出）
        const inputFormat =
          (opts.inputFormat as InputFormat) || detectInputFormat(input, actualFile);

        // 出力形式を検証
        const outputFormat = (opts.outputFormat as OutputFormat) || 'json';
        if (!['json', 'jsonl', 'yaml', 'csv'].includes(outputFormat)) {
          throw new JtError(
            ErrorCode.INVALID_FORMAT,
            `Invalid output format: ${outputFormat}`,
            undefined,
            'Use one of: json, jsonl, yaml, csv',
          );
        }

        // 色付けオプションの設定
        if (opts.color !== undefined) {
          const env = process.env as Record<string, string | undefined>;
          env['FORCE_COLOR'] = opts.color ? '1' : '0';
        }

        // compactオプションの検証
        if (opts.compact && outputFormat !== 'json') {
          console.warn(
            `Warning: --compact option is only effective with JSON output format. Current format: ${outputFormat}`,
          );
        }

        // --no-headerオプションは、Commanderによってheader: falseとして処理される
        const noHeader = opts.header === false;

        // noHeaderオプションの検証
        if (noHeader && inputFormat !== 'csv') {
          console.warn(
            `Warning: --no-header option is only effective with CSV input format. Current format: ${inputFormat}`,
          );
        }

        // クエリを実行
        const options: CliOptions = {
          query: actualQuery,
          inputFormat,
          outputFormat,
          input,
          color: opts.color,
          compact: opts.compact,
          rawString: opts.rawString,
          noHeader,
        };

        const result = await processQuery(options);

        // 結果を出力
        console.log(result);
      } catch (error) {
        // エラーハンドリング
        if (error instanceof JtError) {
          console.error(error.format());
          process.exit(1);
        } else if (error instanceof Error) {
          console.error(`Error: ${error.message}`);
          process.exit(1);
        } else {
          console.error('An unknown error occurred');
          process.exit(1);
        }
      }
    });

  program.parse(argv);
}

import { realpathSync } from 'node:fs';
// CLIとして実行された場合
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const runningScript = process.argv[1];

if (runningScript && realpathSync(runningScript) === currentFile) {
  main().catch(console.error);
}
